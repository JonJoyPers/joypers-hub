"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

interface Punch {
  id: number;
  employee_id: string;
  type: string;
  timestamp: string;
  note: string | null;
  location: string | { x: number; y: number } | null;
  employee: { name: string } | null;
}

interface DaySummary {
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  workedHours: number;
  breakMinutes: number;
  lunchMinutes: number;
  punches: Punch[];
}

interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  totalWorkedHours: number;
  totalBreakMinutes: number;
  totalLunchMinutes: number;
  daysWorked: number;
  days: DaySummary[];
}

/** Parse PostGIS point — comes as "(lng,lat)" string or {x,y} object */
function parseLocation(loc: Punch["location"]): { lng: number; lat: number } | null {
  if (!loc) return null;
  if (typeof loc === "object" && "x" in loc) {
    if (loc.x === 0 && loc.y === 0) return null;
    return { lng: loc.x, lat: loc.y };
  }
  if (typeof loc === "string") {
    const m = loc.match(/\(([^,]+),([^)]+)\)/);
    if (m) {
      const lng = parseFloat(m[1]);
      const lat = parseFloat(m[2]);
      if (lng === 0 && lat === 0) return null;
      return { lng, lat };
    }
  }
  return null;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtTimeFull(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtMinutes(mins: number): string {
  if (mins < 1) return "0m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function fmtDateRange(start: string, end: string): string {
  if (start === end) return fmtDateShort(start);
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  const sMonth = s.toLocaleDateString([], { month: "short" });
  const eMonth = e.toLocaleDateString([], { month: "short" });
  if (sMonth === eMonth) {
    return `${sMonth} ${s.getDate()} – ${e.getDate()}`;
  }
  return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}`;
}

/** Calculate hours/breaks for a single day's punches */
function calcDayStats(sorted: Punch[]) {
  let workedMs = 0;
  let breakMs = 0;
  let lunchMs = 0;
  let activeStart: Date | null = null;
  let breakStart: Date | null = null;
  let lunchStart: Date | null = null;

  for (const p of sorted) {
    const t = new Date(p.timestamp);
    if (p.type === "clock_in" || p.type === "break_end" || p.type === "lunch_end") {
      activeStart = t;
      if (p.type === "break_end" && breakStart) {
        breakMs += t.getTime() - breakStart.getTime();
        breakStart = null;
      }
      if (p.type === "lunch_end" && lunchStart) {
        lunchMs += t.getTime() - lunchStart.getTime();
        lunchStart = null;
      }
    } else if (p.type === "clock_out" || p.type === "break_start" || p.type === "lunch_start") {
      if (activeStart) {
        workedMs += t.getTime() - activeStart.getTime();
        activeStart = null;
      }
      if (p.type === "break_start") breakStart = t;
      if (p.type === "lunch_start") lunchStart = t;
    }
  }

  if (activeStart) workedMs += Date.now() - activeStart.getTime();
  if (breakStart) breakMs += Date.now() - breakStart.getTime();
  if (lunchStart) lunchMs += Date.now() - lunchStart.getTime();

  return {
    workedHours: workedMs / (1000 * 60 * 60),
    breakMinutes: breakMs / (1000 * 60),
    lunchMinutes: lunchMs / (1000 * 60),
  };
}

/** Build employee summaries with per-day breakdowns */
function buildSummaries(punches: Punch[]): EmployeeSummary[] {
  const byEmployee = new Map<string, Punch[]>();
  punches.forEach((p) => {
    const key = p.employee_id;
    if (!byEmployee.has(key)) byEmployee.set(key, []);
    byEmployee.get(key)!.push(p);
  });

  const summaries: EmployeeSummary[] = [];

  byEmployee.forEach((empPunches, employeeId) => {
    const sorted = [...empPunches].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const name = sorted[0]?.employee?.name || employeeId;

    // Group by date
    const byDate = new Map<string, Punch[]>();
    sorted.forEach((p) => {
      const d = new Date(p.timestamp).toISOString().split("T")[0];
      if (!byDate.has(d)) byDate.set(d, []);
      byDate.get(d)!.push(p);
    });

    const days: DaySummary[] = [];
    let totalWorked = 0;
    let totalBreak = 0;
    let totalLunch = 0;

    Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, dayPunches]) => {
        const firstIn = dayPunches.find((p) => p.type === "clock_in");
        const lastOut = [...dayPunches].reverse().find((p) => p.type === "clock_out");
        const stats = calcDayStats(dayPunches);

        totalWorked += stats.workedHours;
        totalBreak += stats.breakMinutes;
        totalLunch += stats.lunchMinutes;

        days.push({
          date,
          clockIn: firstIn?.timestamp || null,
          clockOut: lastOut?.timestamp || null,
          ...stats,
          punches: dayPunches,
        });
      });

    summaries.push({
      employeeId,
      employeeName: name,
      totalWorkedHours: totalWorked,
      totalBreakMinutes: totalBreak,
      totalLunchMinutes: totalLunch,
      daysWorked: days.length,
      days,
    });
  });

  return summaries.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

/** Get preset date ranges */
function getPresets(): { label: string; start: string; end: string }[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const dayOfWeek = today.getDay();
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setDate(thisMonday.getDate() - 1);

  const twoWeeksAgoMonday = new Date(thisMonday);
  twoWeeksAgoMonday.setDate(thisMonday.getDate() - 14);
  const lastSundayForBiweekly = new Date(thisMonday);
  lastSundayForBiweekly.setDate(thisMonday.getDate() - 1);

  return [
    { label: "Today", start: fmt(today), end: fmt(today) },
    { label: "This Week", start: fmt(thisMonday), end: fmt(thisSunday) },
    { label: "Last Week", start: fmt(lastMonday), end: fmt(lastSunday) },
    { label: "Last 2 Weeks", start: fmt(twoWeeksAgoMonday), end: fmt(lastSundayForBiweekly) },
  ];
}

const typeColors: Record<string, string> = {
  clock_in: "bg-green/20 text-green",
  clock_out: "bg-red/20 text-red",
  break_start: "bg-amber/20 text-amber",
  break_end: "bg-amber/20 text-amber",
  lunch_start: "bg-violet/20 text-violet",
  lunch_end: "bg-violet/20 text-violet",
};

const typeLabels: Record<string, string> = {
  clock_in: "Clock In",
  clock_out: "Clock Out",
  break_start: "Break Start",
  break_end: "Break End",
  lunch_start: "Lunch Start",
  lunch_end: "Lunch End",
};

export default function TimesheetsPage() {
  const supabase = createClient();
  const [punches, setPunches] = useState<Punch[]>([]);
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [expandedMap, setExpandedMap] = useState<number | null>(null);

  const isRange = startDate !== endDate;
  const presets = getPresets();

  async function fetchEmployees() {
    const { data } = await supabase.from("employees").select("id, name").eq("is_active", true).order("name");
    setEmployees(data || []);
  }

  async function fetchPunches() {
    let query = supabase
      .from("punches")
      .select("*, employee:employees(name)")
      .gte("timestamp", `${startDate}T00:00:00`)
      .lte("timestamp", `${endDate}T23:59:59`)
      .order("timestamp", { ascending: true });

    if (employeeFilter) {
      query = query.eq("employee_id", employeeFilter);
    }

    const { data } = await query;
    setPunches(data || []);
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchPunches();
  }, [startDate, endDate, employeeFilter]);

  function exportCSV() {
    const headers = ["Employee", "Date", "Type", "Time", "Location", "Note"];
    const rows = punches.map((p) => {
      const loc = parseLocation(p.location);
      const d = new Date(p.timestamp);
      return [
        p.employee?.name || "",
        d.toLocaleDateString(),
        p.type,
        d.toLocaleTimeString(),
        loc ? `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}` : "In-store",
        p.note || "",
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${startDate}${isRange ? `-to-${endDate}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const summaries = buildSummaries(punches);
  const totalWorked = summaries.reduce((s, e) => s + e.totalWorkedHours, 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cream">Timesheets</h2>
        <button onClick={exportCSV} className="px-4 py-1.5 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (e.target.value > endDate) setEndDate(e.target.value);
            }}
            className="bg-charcoal-mid border border-charcoal-light rounded-lg px-4 py-2 text-cream text-sm"
          />
          <span className="text-cream-muted text-sm">to</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-charcoal-mid border border-charcoal-light rounded-lg px-4 py-2 text-cream text-sm"
          />
        </div>
        <select
          value={employeeFilter}
          onChange={(e) => setEmployeeFilter(e.target.value)}
          className="bg-charcoal-mid border border-charcoal-light rounded-lg px-4 py-2 text-cream text-sm"
        >
          <option value="">All Employees</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
      </div>

      {/* Quick presets */}
      <div className="flex flex-wrap gap-2 mb-6">
        {presets.map((p) => {
          const active = startDate === p.start && endDate === p.end;
          return (
            <button
              key={p.label}
              onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-teal/25 text-teal border border-teal/40"
                  : "bg-charcoal-mid text-cream-muted border border-charcoal-light hover:bg-charcoal-light hover:text-cream"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Totals bar */}
      {summaries.length > 0 && (
        <div className="flex gap-4 mb-4">
          <div className="bg-charcoal-mid rounded-lg px-4 py-2 border border-charcoal-light">
            <span className="text-cream-muted text-xs uppercase tracking-wider">Period</span>
            <span className="ml-2 text-cream font-semibold text-sm">{fmtDateRange(startDate, endDate)}</span>
          </div>
          <div className="bg-charcoal-mid rounded-lg px-4 py-2 border border-charcoal-light">
            <span className="text-cream-muted text-xs uppercase tracking-wider">Employees</span>
            <span className="ml-2 text-cream font-semibold text-sm">{summaries.length}</span>
          </div>
          <div className="bg-charcoal-mid rounded-lg px-4 py-2 border border-charcoal-light">
            <span className="text-cream-muted text-xs uppercase tracking-wider">Total Hours</span>
            <span className="ml-2 text-teal font-semibold text-sm">{fmtDuration(totalWorked)}</span>
          </div>
        </div>
      )}

      {/* Employee rows */}
      <div className="space-y-2">
        {summaries.length === 0 ? (
          <div className="bg-charcoal-mid rounded-xl border border-charcoal-light px-5 py-8 text-center text-cream-muted text-sm">
            No punches recorded for this period.
          </div>
        ) : (
          summaries.map((summary) => {
            const isExpanded = expandedEmployee === summary.employeeId;
            const stillActive = summary.days.some((d) => d.clockIn && !d.clockOut);

            return (
              <div
                key={summary.employeeId}
                className="bg-charcoal-mid rounded-xl border border-charcoal-light overflow-hidden"
              >
                {/* Master row */}
                <button
                  onClick={() => setExpandedEmployee(isExpanded ? null : summary.employeeId)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-charcoal-light/30 transition-colors text-left"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-cream-muted transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>

                  <div className="min-w-[140px]">
                    <p className="text-cream font-semibold text-sm">{summary.employeeName}</p>
                    {stillActive && (
                      <span className="inline-flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                        <span className="text-green text-[10px] font-bold uppercase tracking-wider">Active</span>
                      </span>
                    )}
                  </div>

                  {/* Single day: show clock in → out */}
                  {!isRange && summary.days[0] && (
                    <div className="flex items-center gap-2 min-w-[160px]">
                      <span className="text-cream text-sm">
                        {summary.days[0].clockIn ? fmtTime(summary.days[0].clockIn) : "—"}
                      </span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cream-muted"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      <span className="text-cream text-sm">
                        {summary.days[0].clockOut ? fmtTime(summary.days[0].clockOut) : "—"}
                      </span>
                    </div>
                  )}

                  {/* Multi-day: show days worked */}
                  {isRange && (
                    <div className="min-w-[100px]">
                      <span className="text-cream-muted text-xs">{summary.daysWorked} day{summary.daysWorked !== 1 ? "s" : ""}</span>
                    </div>
                  )}

                  {/* Break / Lunch */}
                  <div className="flex gap-3 min-w-[180px]">
                    {summary.totalBreakMinutes > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber/15 text-amber">
                        Break {fmtMinutes(summary.totalBreakMinutes)}
                      </span>
                    )}
                    {summary.totalLunchMinutes > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet/15 text-violet">
                        Lunch {fmtMinutes(summary.totalLunchMinutes)}
                      </span>
                    )}
                    {summary.totalBreakMinutes === 0 && summary.totalLunchMinutes === 0 && (
                      <span className="text-xs text-cream-muted">No breaks</span>
                    )}
                  </div>

                  <div className="ml-auto text-right">
                    <span className="text-teal font-bold text-sm">{fmtDuration(summary.totalWorkedHours)}</span>
                    <span className="text-cream-muted text-xs ml-1">worked</span>
                  </div>

                  <span className="text-cream-muted text-xs bg-charcoal-light rounded-full px-2 py-0.5 flex-shrink-0">
                    {summary.days.reduce((t, d) => t + d.punches.length, 0)}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-charcoal-light">
                    {summary.days.map((day) => {
                      const dayKey = `${summary.employeeId}-${day.date}`;
                      const isDayExpanded = expandedDay === dayKey;

                      return (
                        <div key={day.date}>
                          {/* Day header row */}
                          <button
                            onClick={() => setExpandedDay(isDayExpanded ? null : dayKey)}
                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-charcoal-light/20 transition-colors text-left border-b border-charcoal-light/30"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`text-cream-muted transition-transform flex-shrink-0 ml-2 ${isDayExpanded ? "rotate-90" : ""}`}
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>

                            <span className="text-cream text-sm font-medium min-w-[130px]">{fmtDateShort(day.date)}</span>

                            <div className="flex items-center gap-2 min-w-[140px]">
                              <span className="text-cream-muted text-xs">
                                {day.clockIn ? fmtTime(day.clockIn) : "—"}
                              </span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cream-muted"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                              <span className="text-cream-muted text-xs">
                                {day.clockOut ? fmtTime(day.clockOut) : "—"}
                              </span>
                            </div>

                            <div className="flex gap-2">
                              {day.breakMinutes > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber/15 text-amber">
                                  Brk {fmtMinutes(day.breakMinutes)}
                                </span>
                              )}
                              {day.lunchMinutes > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet/15 text-violet">
                                  Lnch {fmtMinutes(day.lunchMinutes)}
                                </span>
                              )}
                            </div>

                            <span className="ml-auto text-teal font-semibold text-xs">{fmtDuration(day.workedHours)}</span>
                            <span className="text-cream-muted text-[10px]">{day.punches.length} punches</span>
                          </button>

                          {/* Punch detail table */}
                          {isDayExpanded && (
                            <div className="bg-charcoal/30">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-charcoal-light/30">
                                    <th className="text-left text-[10px] text-cream-muted font-medium px-5 py-1.5 pl-14 uppercase tracking-wider">Type</th>
                                    <th className="text-left text-[10px] text-cream-muted font-medium px-5 py-1.5 uppercase tracking-wider">Time</th>
                                    <th className="text-left text-[10px] text-cream-muted font-medium px-5 py-1.5 uppercase tracking-wider">Location</th>
                                    <th className="text-left text-[10px] text-cream-muted font-medium px-5 py-1.5 uppercase tracking-wider">Note</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {day.punches.map((punch) => {
                                    const loc = parseLocation(punch.location);
                                    const isMapExpanded = expandedMap === punch.id;
                                    return (
                                      <tr key={punch.id} className="border-b border-charcoal-light/20 last:border-b-0">
                                        <td className="px-5 py-2 pl-14">
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[punch.type] || ""}`}>
                                            {typeLabels[punch.type] || punch.type}
                                          </span>
                                        </td>
                                        <td className="px-5 py-2 text-cream text-sm">{fmtTimeFull(punch.timestamp)}</td>
                                        <td className="px-5 py-2 text-sm">
                                          {loc ? (
                                            <div>
                                              <button
                                                onClick={() => setExpandedMap(isMapExpanded ? null : punch.id)}
                                                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-teal/20 text-teal hover:bg-teal/30 transition-colors"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                                {isMapExpanded ? "Hide Map" : "View Map"}
                                              </button>
                                              {isMapExpanded && (
                                                <div className="mt-2 rounded-lg overflow-hidden border border-charcoal-light" style={{ width: 300, height: 220 }}>
                                                  <iframe
                                                    width="300"
                                                    height="200"
                                                    style={{ border: 0 }}
                                                    loading="lazy"
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng - 0.005},${loc.lat - 0.003},${loc.lng + 0.005},${loc.lat + 0.003}&layer=mapnik&marker=${loc.lat},${loc.lng}`}
                                                  />
                                                  <div className="text-[10px] text-cream-muted px-2 py-1 bg-charcoal-light">
                                                    {loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-cream-muted text-xs">In-store</span>
                                          )}
                                        </td>
                                        <td className="px-5 py-2 text-cream-muted text-sm">{punch.note || "—"}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}
