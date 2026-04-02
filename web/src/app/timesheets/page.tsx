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

interface ShiftSummary {
  employeeId: string;
  employeeName: string;
  clockIn: string | null;
  clockOut: string | null;
  workedHours: number;
  breakMinutes: number;
  lunchMinutes: number;
  punches: Punch[];
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

/** Build shift summaries from raw punches grouped by employee */
function buildSummaries(punches: Punch[]): ShiftSummary[] {
  const byEmployee = new Map<string, Punch[]>();
  punches.forEach((p) => {
    const key = p.employee_id;
    if (!byEmployee.has(key)) byEmployee.set(key, []);
    byEmployee.get(key)!.push(p);
  });

  const summaries: ShiftSummary[] = [];

  byEmployee.forEach((empPunches, employeeId) => {
    const sorted = [...empPunches].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const name = sorted[0]?.employee?.name || employeeId;

    const firstClockIn = sorted.find((p) => p.type === "clock_in");
    const lastClockOut = [...sorted].reverse().find((p) => p.type === "clock_out");

    // Calculate worked time (clock_in to clock_out, minus lunch)
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

    // Still clocked in — count time until now
    if (activeStart) {
      workedMs += Date.now() - activeStart.getTime();
    }
    if (breakStart) {
      breakMs += Date.now() - breakStart.getTime();
    }
    if (lunchStart) {
      lunchMs += Date.now() - lunchStart.getTime();
    }

    summaries.push({
      employeeId,
      employeeName: name,
      clockIn: firstClockIn?.timestamp || null,
      clockOut: lastClockOut?.timestamp || null,
      workedHours: workedMs / (1000 * 60 * 60),
      breakMinutes: breakMs / (1000 * 60),
      lunchMinutes: lunchMs / (1000 * 60),
      punches: sorted,
    });
  });

  return summaries.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
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
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [expandedMap, setExpandedMap] = useState<number | null>(null);

  async function fetchEmployees() {
    const { data } = await supabase.from("employees").select("id, name").eq("is_active", true).order("name");
    setEmployees(data || []);
  }

  async function fetchPunches() {
    let query = supabase
      .from("punches")
      .select("*, employee:employees(name)")
      .gte("timestamp", `${date}T00:00:00`)
      .lte("timestamp", `${date}T23:59:59`)
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
  }, [date, employeeFilter]);

  function exportCSV() {
    const headers = ["Employee", "Type", "Time", "Location", "Note"];
    const rows = punches.map((p) => {
      const loc = parseLocation(p.location);
      return [
        p.employee?.name || "",
        p.type,
        new Date(p.timestamp).toLocaleString(),
        loc ? `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}` : "In-store",
        p.note || "",
      ];
    });

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const summaries = buildSummaries(punches);

  // Totals across all employees
  const totalWorked = summaries.reduce((s, e) => s + e.workedHours, 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cream">Timesheets</h2>
        <button onClick={exportCSV} className="px-4 py-1.5 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-charcoal-mid border border-charcoal-light rounded-lg px-4 py-2 text-cream text-sm"
        />
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

      {/* Day totals bar */}
      {summaries.length > 0 && (
        <div className="flex gap-4 mb-4">
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

      {/* Employee shift rows */}
      <div className="space-y-2">
        {summaries.length === 0 ? (
          <div className="bg-charcoal-mid rounded-xl border border-charcoal-light px-5 py-8 text-center text-cream-muted text-sm">
            No punches recorded for this date.
          </div>
        ) : (
          summaries.map((summary) => {
            const isExpanded = expandedEmployee === summary.employeeId;
            const isActive = summary.clockIn && !summary.clockOut;

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
                  {/* Expand chevron */}
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

                  {/* Name + status */}
                  <div className="min-w-[140px]">
                    <p className="text-cream font-semibold text-sm">{summary.employeeName}</p>
                    {isActive && (
                      <span className="inline-flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                        <span className="text-green text-[10px] font-bold uppercase tracking-wider">Active</span>
                      </span>
                    )}
                  </div>

                  {/* Clock in/out times */}
                  <div className="flex items-center gap-2 min-w-[160px]">
                    <span className="text-cream text-sm">
                      {summary.clockIn ? fmtTime(summary.clockIn) : "—"}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cream-muted"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    <span className="text-cream text-sm">
                      {summary.clockOut ? fmtTime(summary.clockOut) : "—"}
                    </span>
                  </div>

                  {/* Break / Lunch */}
                  <div className="flex gap-3 min-w-[180px]">
                    {summary.breakMinutes > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber/15 text-amber">
                        Break {fmtMinutes(summary.breakMinutes)}
                      </span>
                    )}
                    {summary.lunchMinutes > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet/15 text-violet">
                        Lunch {fmtMinutes(summary.lunchMinutes)}
                      </span>
                    )}
                    {summary.breakMinutes === 0 && summary.lunchMinutes === 0 && (
                      <span className="text-xs text-cream-muted">No breaks</span>
                    )}
                  </div>

                  {/* Total worked */}
                  <div className="ml-auto text-right">
                    <span className="text-teal font-bold text-sm">{fmtDuration(summary.workedHours)}</span>
                    <span className="text-cream-muted text-xs ml-1">worked</span>
                  </div>

                  {/* Punch count */}
                  <span className="text-cream-muted text-xs bg-charcoal-light rounded-full px-2 py-0.5 flex-shrink-0">
                    {summary.punches.length}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-charcoal-light">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-charcoal-light/50">
                          <th className="text-left text-[10px] text-cream-muted font-medium px-5 py-2 uppercase tracking-wider">Type</th>
                          <th className="text-left text-[10px] text-cream-muted font-medium px-5 py-2 uppercase tracking-wider">Time</th>
                          <th className="text-left text-[10px] text-cream-muted font-medium px-5 py-2 uppercase tracking-wider">Location</th>
                          <th className="text-left text-[10px] text-cream-muted font-medium px-5 py-2 uppercase tracking-wider">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.punches.map((punch) => {
                          const loc = parseLocation(punch.location);
                          const isMapExpanded = expandedMap === punch.id;
                          return (
                            <tr key={punch.id} className="border-b border-charcoal-light/30 last:border-b-0">
                              <td className="px-5 py-2.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[punch.type] || ""}`}>
                                  {typeLabels[punch.type] || punch.type}
                                </span>
                              </td>
                              <td className="px-5 py-2.5 text-cream text-sm">{fmtTimeFull(punch.timestamp)}</td>
                              <td className="px-5 py-2.5 text-sm">
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
                              <td className="px-5 py-2.5 text-cream-muted text-sm">{punch.note || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
