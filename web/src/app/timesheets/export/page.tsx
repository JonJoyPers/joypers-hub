"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import TimesheetTabs from "../TimesheetTabs";

interface Timesheet {
  id: number;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  worked_minutes: number;
  break_minutes: number;
  lunch_minutes: number;
  status: string;
  pay_rate_snapshot: string | null;
  pay_amount: string | null;
  employee: { name: string; title: string | null; pay_rate: string | null } | null;
}

interface EmployeeGroup {
  id: string;
  name: string;
  title: string | null;
  sheets: Timesheet[];
  totalMinutes: number;
  totalPay: number;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString([], { weekday: "short", month: "numeric", day: "numeric" });
}

function fmtDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtHours(mins: number): string {
  return (mins / 60).toFixed(2);
}

function fmtMoney(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getPresets(): { label: string; start: string; end: string }[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((dow + 6) % 7));
  const lastMon = new Date(mon);
  lastMon.setDate(mon.getDate() - 7);
  const lastSun = new Date(mon);
  lastSun.setDate(mon.getDate() - 1);
  const twoWeeksAgo = new Date(mon);
  twoWeeksAgo.setDate(mon.getDate() - 14);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { label: "This Month", start: fmt(monthStart), end: fmt(today) },
    { label: "Last Month", start: fmt(lastMonthStart), end: fmt(lastMonthEnd) },
    { label: "Last Week", start: fmt(lastMon), end: fmt(lastSun) },
    { label: "Last 2 Weeks", start: fmt(twoWeeksAgo), end: fmt(lastSun) },
  ];
}

export default function TimesheetExportPage() {
  const supabase = createClient();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const defaultStart = today.slice(0, 8) + "01";
  const defaultEnd = today;

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  const presets = getPresets();

  async function fetchTimesheets() {
    setLoading(true);
    const { data } = await supabase
      .from("timesheets")
      .select("*, employee:employees!timesheets_employee_id_fkey(name, title, pay_rate)")
      .gte("date", startDate)
      .lte("date", endDate)
      .in("status", ["approved", "exported"])
      .order("date", { ascending: true });

    setTimesheets(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchTimesheets();
  }, [startDate, endDate]);

  const groups = useMemo((): EmployeeGroup[] => {
    const map = new Map<string, EmployeeGroup>();
    timesheets.forEach((ts) => {
      if (!map.has(ts.employee_id)) {
        map.set(ts.employee_id, {
          id: ts.employee_id,
          name: ts.employee?.name || ts.employee_id,
          title: ts.employee?.title || null,
          sheets: [],
          totalMinutes: 0,
          totalPay: 0,
        });
      }
      const g = map.get(ts.employee_id)!;
      g.sheets.push(ts);
      g.totalMinutes += ts.worked_minutes || 0;
      g.totalPay += parseFloat(ts.pay_amount || "0");
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [timesheets]);

  // Auto-select all on first load
  useEffect(() => {
    if (groups.length > 0 && selectedEmployees.size === 0) {
      setSelectedEmployees(new Set(groups.map((g) => g.id)));
      setExpandedEmployees(new Set(groups.map((g) => g.id)));
    }
  }, [groups]);

  const selectedGroups = groups.filter((g) => selectedEmployees.has(g.id));
  const totalHours = selectedGroups.reduce((s, g) => s + g.totalMinutes, 0) / 60;
  const totalPay = selectedGroups.reduce((s, g) => s + g.totalPay, 0);
  const totalSheets = selectedGroups.reduce((s, g) => s + g.sheets.length, 0);

  // Get IDs of approved (not yet exported) timesheets for selected employees
  const exportableIds = selectedGroups
    .flatMap((g) => g.sheets)
    .filter((ts) => ts.status === "approved")
    .map((ts) => ts.id);

  function toggleEmployee(id: string) {
    const next = new Set(selectedEmployees);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedEmployees(next);
  }

  function toggleExpand(id: string) {
    const next = new Set(expandedEmployees);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedEmployees(next);
  }

  function downloadCSV() {
    const headers = ["Employee", "Title", "Date", "Clock In", "Clock Out", "Worked Hours", "Break (min)", "Lunch (min)", "Pay Rate", "Pay Amount", "Status"];
    const rows = selectedGroups.flatMap((g) =>
      g.sheets.map((ts) => [
        g.name,
        g.title || "",
        ts.date,
        ts.clock_in ? new Date(ts.clock_in).toLocaleTimeString() : "",
        ts.clock_out ? new Date(ts.clock_out).toLocaleTimeString() : "",
        fmtHours(ts.worked_minutes),
        ts.break_minutes,
        ts.lunch_minutes,
        ts.pay_rate_snapshot || "",
        ts.pay_amount || "",
        ts.status,
      ])
    );

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleMarkExported() {
    if (exportableIds.length === 0) return;
    setExporting(true);

    const { data: { session } } = await supabase.auth.getSession();
    await fetch("/api/timesheets/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        timesheet_ids: exportableIds,
        period_start: startDate,
        period_end: endDate,
      }),
    });

    await fetchTimesheets();
    setExporting(false);
  }

  function initials(name: string): string {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <DashboardLayout>
      <TimesheetTabs />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <input type="date" value={startDate}
            onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); }}
            className="bg-charcoal-mid border border-charcoal-light rounded-lg px-3 py-1.5 text-cream text-sm"
          />
          <span className="text-cream-muted text-sm">to</span>
          <input type="date" value={endDate} min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-charcoal-mid border border-charcoal-light rounded-lg px-3 py-1.5 text-cream text-sm"
          />
        </div>
        {presets.map((p) => (
          <button key={p.label}
            onClick={() => { setStartDate(p.start); setEndDate(p.end); setSelectedEmployees(new Set()); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              startDate === p.start && endDate === p.end
                ? "bg-teal/25 text-teal border border-teal/40"
                : "bg-charcoal-mid text-cream-muted border border-charcoal-light hover:text-cream"
            }`}
          >{p.label}</button>
        ))}
      </div>

      <div className="flex gap-4" style={{ minHeight: "calc(100vh - 220px)" }}>
        {/* ─── Left Sidebar: Employee Selection ─── */}
        <div className="w-64 flex-shrink-0 bg-charcoal-mid rounded-xl border border-charcoal-light overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-charcoal-light">
            <button onClick={() => setSelectedEmployees(new Set(groups.map((g) => g.id)))}
              className="text-teal text-[10px] font-bold hover:underline">Select All</button>
            <button onClick={() => setSelectedEmployees(new Set())}
              className="text-cream-muted text-[10px] font-bold hover:underline">Select None</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-cream-muted text-sm">Loading…</p>
            ) : groups.length === 0 ? (
              <p className="p-4 text-cream-muted text-sm">No approved timesheets.</p>
            ) : (
              groups.map((g) => (
                <button key={g.id}
                  onClick={() => toggleEmployee(g.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-charcoal-light/30 ${
                    selectedEmployees.has(g.id) ? "bg-teal/10" : "hover:bg-charcoal-light/30"
                  }`}
                >
                  <input type="checkbox" checked={selectedEmployees.has(g.id)} readOnly className="accent-teal flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-cream text-sm font-medium truncate">{g.name}</p>
                    <p className="text-cream-muted text-[10px]">
                      {g.sheets.length} items · {fmtHours(g.totalMinutes)} hrs
                      {g.totalPay > 0 && ` · ${fmtMoney(g.totalPay)}`}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ─── Main Area ─── */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Summary bar */}
          <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-4 flex items-center justify-between">
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] text-cream-muted uppercase tracking-wider">Selected</p>
                <p className="text-cream font-bold text-sm">{selectedGroups.length} employees · {totalSheets} items</p>
              </div>
              <div>
                <p className="text-[10px] text-cream-muted uppercase tracking-wider">Total Hours</p>
                <p className="text-teal font-bold text-sm">{totalHours.toFixed(2)} hrs</p>
              </div>
              {totalPay > 0 && (
                <div>
                  <p className="text-[10px] text-cream-muted uppercase tracking-wider">Total Pay</p>
                  <p className="text-green font-bold text-sm">{fmtMoney(totalPay)}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={downloadCSV} disabled={selectedGroups.length === 0}
                className="px-4 py-2 bg-teal text-charcoal rounded-lg text-xs font-bold disabled:opacity-50"
              >Export CSV</button>
              {exportableIds.length > 0 && (
                <button onClick={handleMarkExported} disabled={exporting}
                  className="px-4 py-2 bg-green text-charcoal rounded-lg text-xs font-bold disabled:opacity-50"
                >{exporting ? "…" : `Mark ${exportableIds.length} as Paid`}</button>
              )}
            </div>
          </div>

          {/* Expand/collapse controls */}
          {selectedGroups.length > 0 && (
            <div className="flex gap-3">
              <button onClick={() => setExpandedEmployees(new Set(selectedGroups.map((g) => g.id)))}
                className="text-cream-muted text-[10px] hover:text-cream">Expand All</button>
              <button onClick={() => setExpandedEmployees(new Set())}
                className="text-cream-muted text-[10px] hover:text-cream">Collapse All</button>
            </div>
          )}

          {/* Employee sections */}
          <div className="space-y-2">
            {selectedGroups.length === 0 ? (
              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light px-5 py-8 text-center text-cream-muted text-sm">
                Select employees to view export data.
              </div>
            ) : (
              selectedGroups.map((g) => {
                const isExpanded = expandedEmployees.has(g.id);
                return (
                  <div key={g.id} className="bg-charcoal-mid rounded-xl border border-charcoal-light overflow-hidden">
                    {/* Employee header */}
                    <button onClick={() => toggleExpand(g.id)}
                      className="w-full flex items-center gap-4 px-5 py-3 hover:bg-charcoal-light/20 transition-colors text-left"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={`text-cream-muted transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`}
                      ><polyline points="9 18 15 12 9 6" /></svg>

                      <div className="w-8 h-8 rounded-full bg-charcoal-light flex items-center justify-center text-[10px] font-bold text-cream-muted flex-shrink-0">
                        {initials(g.name)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-cream font-semibold text-sm">{g.name}</span>
                        {g.title && <span className="text-cream-muted text-xs ml-2">{g.title}</span>}
                        <span className="text-cream-muted text-xs ml-2">[{g.sheets.length}]</span>
                      </div>

                      <div className="text-right">
                        <span className="text-teal font-bold text-sm">{fmtHours(g.totalMinutes)} hrs</span>
                        {g.totalPay > 0 && (
                          <span className="text-green font-bold text-sm ml-4">{fmtMoney(g.totalPay)}</span>
                        )}
                      </div>
                    </button>

                    {/* Day rows */}
                    {isExpanded && (
                      <div className="border-t border-charcoal-light">
                        {g.sheets.map((ts) => {
                          const breakTotal = (ts.break_minutes || 0) + (ts.lunch_minutes || 0);
                          return (
                            <div key={ts.id}
                              className="flex items-center gap-4 px-5 py-2.5 border-b border-charcoal-light/20 last:border-b-0 text-sm"
                            >
                              <span className="text-cream min-w-[110px]">{fmtDate(ts.date)}</span>
                              <span className="text-cream-muted flex-1">
                                {fmtTime(ts.clock_in)} – {fmtTime(ts.clock_out)}
                                {breakTotal > 0 && <span className="ml-1">| {fmtDuration(breakTotal)}</span>}
                              </span>
                              <span className="text-teal font-semibold w-16 text-right">{fmtHours(ts.worked_minutes)} hrs</span>
                              {ts.pay_amount && (
                                <span className="text-cream w-20 text-right">{fmtMoney(parseFloat(ts.pay_amount))}</span>
                              )}
                              {ts.status === "exported" && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet/20 text-violet font-bold uppercase">Paid</span>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
