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
  has_open_punch: boolean;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  manager_note: string | null;
  pay_rate_snapshot: string | null;
  pay_amount: string | null;
  employee: { name: string; title: string | null; pay_rate: string | null } | null;
}

interface Punch {
  id: number;
  type: string;
  timestamp: string;
  note: string | null;
}

interface EmployeeSummary {
  id: string;
  name: string;
  title: string | null;
  sheetCount: number;
  pendingCount: number;
  totalHours: number;
  timesheets: Timesheet[];
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

function fmtHoursDecimal(mins: number): string {
  return (mins / 60).toFixed(2);
}

function fmtTimeFull(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

/** Convert ISO timestamp to HH:MM for <input type="time"> */
function toLocalTimeInput(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber/20 text-amber",
  approved: "bg-green/20 text-green",
  disputed: "bg-red/20 text-red",
  exported: "bg-violet/20 text-violet",
};

const punchTypeLabels: Record<string, string> = {
  clock_in: "Clock In",
  clock_out: "Clock Out",
  break_start: "Break Start",
  break_end: "Break End",
  lunch_start: "Lunch Start",
  lunch_end: "Lunch End",
};

const punchTypeColors: Record<string, string> = {
  clock_in: "text-green",
  clock_out: "text-red",
  break_start: "text-amber",
  break_end: "text-amber",
  lunch_start: "text-violet",
  lunch_end: "text-violet",
};

function getPresets(): { label: string; start: string; end: string }[] {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const dow = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((dow + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const lastMon = new Date(mon);
  lastMon.setDate(mon.getDate() - 7);
  const lastSun = new Date(mon);
  lastSun.setDate(mon.getDate() - 1);
  const twoWeeksAgo = new Date(mon);
  twoWeeksAgo.setDate(mon.getDate() - 14);

  return [
    { label: "This Week", start: fmt(mon), end: fmt(sun) },
    { label: "Last Week", start: fmt(lastMon), end: fmt(lastSun) },
    { label: "Last 2 Weeks", start: fmt(twoWeeksAgo), end: fmt(lastSun) },
  ];
}

export default function TimesheetApprovalPage() {
  const supabase = createClient();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const defaultStart = (() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7);
    return d.toISOString().split("T")[0];
  })();
  const defaultEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 1);
    return d.toISOString().split("T")[0];
  })();

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detailPunches, setDetailPunches] = useState<Punch[]>([]);
  const [approving, setApproving] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editBreak, setEditBreak] = useState("");
  const [editLunch, setEditLunch] = useState("");
  const [editNote, setEditNote] = useState("");

  const presets = getPresets();

  async function fetchTimesheets() {
    setLoading(true);
    const { data } = await supabase
      .from("timesheets")
      .select("*, employee:employees(name, title, pay_rate)")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    setTimesheets(data || []);
    setLoading(false);
  }

  async function handleRebuild() {
    setRebuilding(true);
    const session = await supabase.auth.getSession();
    await fetch("/api/timesheets/rebuild", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: startDate, end: endDate }),
    });
    await fetchTimesheets();
    setRebuilding(false);
  }

  async function fetchPunches(empId: string, date: string) {
    const { data } = await supabase
      .from("punches")
      .select("id, type, timestamp, note")
      .eq("employee_id", empId)
      .gte("timestamp", `${date}T00:00:00`)
      .lte("timestamp", `${date}T23:59:59`)
      .order("timestamp", { ascending: true });
    setDetailPunches(data || []);
  }

  async function handleApprove(action: "approve" | "unapprove" | "dispute", ids: number[], note?: string) {
    setApproving(true);
    const { data: { session } } = await supabase.auth.getSession();
    await fetch("/api/timesheets/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ timesheet_ids: ids, action, note }),
    });
    await fetchTimesheets();
    setApproving(false);
    setCheckedIds(new Set());
  }

  useEffect(() => {
    fetchTimesheets();
  }, [startDate, endDate]);

  useEffect(() => {
    if (selectedEmpId && selectedDate) {
      fetchPunches(selectedEmpId, selectedDate);
    }
  }, [selectedEmpId, selectedDate]);

  // Build employee summaries
  const employees = useMemo((): EmployeeSummary[] => {
    const map = new Map<string, EmployeeSummary>();
    timesheets.forEach((ts) => {
      if (!map.has(ts.employee_id)) {
        map.set(ts.employee_id, {
          id: ts.employee_id,
          name: ts.employee?.name || ts.employee_id,
          title: ts.employee?.title || null,
          sheetCount: 0,
          pendingCount: 0,
          totalHours: 0,
          timesheets: [],
        });
      }
      const emp = map.get(ts.employee_id)!;
      emp.sheetCount++;
      if (ts.status === "pending") emp.pendingCount++;
      emp.totalHours += (ts.worked_minutes || 0) / 60;
      emp.timesheets.push(ts);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [timesheets]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId);
  const selectedTimesheet = selectedEmployee?.timesheets.find((t) => t.date === selectedDate);

  // Auto-select first employee
  useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees]);

  const filteredSheets = selectedEmployee?.timesheets.filter((ts) => {
    if (filterStatus === "all") return true;
    return ts.status === filterStatus;
  }) || [];

  // Initials from name
  function initials(name: string): string {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <DashboardLayout>
      <TimesheetTabs />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
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
            onClick={() => { setStartDate(p.start); setEndDate(p.end); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              startDate === p.start && endDate === p.end
                ? "bg-teal/25 text-teal border border-teal/40"
                : "bg-charcoal-mid text-cream-muted border border-charcoal-light hover:text-cream"
            }`}
          >{p.label}</button>
        ))}
        <button onClick={handleRebuild} disabled={rebuilding}
          className="ml-auto px-3 py-1.5 bg-charcoal-mid border border-charcoal-light rounded-lg text-xs text-cream-muted hover:text-cream disabled:opacity-50"
        >{rebuilding ? "Rebuilding…" : "Rebuild Timesheets"}</button>
      </div>

      <div className="flex gap-4" style={{ minHeight: "calc(100vh - 220px)" }}>
        {/* ─── Left Sidebar: Employee List ─── */}
        <div className="w-64 flex-shrink-0 bg-charcoal-mid rounded-xl border border-charcoal-light overflow-hidden flex flex-col">
          <div className="p-3 border-b border-charcoal-light">
            <p className="text-cream-muted text-[10px] uppercase tracking-wider font-medium">
              {employees.length} employee{employees.length !== 1 ? "s" : ""} · {timesheets.length} sheets
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-cream-muted text-sm">Loading…</p>
            ) : employees.length === 0 ? (
              <p className="p-4 text-cream-muted text-sm">No timesheets found. Try rebuilding.</p>
            ) : (
              employees.map((emp) => (
                <button key={emp.id}
                  onClick={() => { setSelectedEmpId(emp.id); setSelectedDate(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-charcoal-light/30 ${
                    selectedEmpId === emp.id ? "bg-teal/10" : "hover:bg-charcoal-light/30"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    selectedEmpId === emp.id ? "bg-teal text-charcoal" : "bg-charcoal-light text-cream-muted"
                  }`}>
                    {initials(emp.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-cream text-sm font-medium truncate">{emp.name}</p>
                    <p className="text-cream-muted text-[10px]">
                      {emp.sheetCount} sheets · {fmtHoursDecimal(emp.totalHours * 60)} hrs
                    </p>
                  </div>
                  {emp.pendingCount > 0 && (
                    <span className="bg-amber/20 text-amber text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {emp.pendingCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ─── Main Area: Day Rows ─── */}
        <div className="flex-1 flex flex-col gap-4">
          {selectedEmployee ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-cream">{selectedEmployee.name}</h3>
                  {selectedEmployee.title && (
                    <p className="text-cream-muted text-xs">{selectedEmployee.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-charcoal-mid border border-charcoal-light rounded-lg px-3 py-1.5 text-cream text-xs"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="disputed">Disputed</option>
                    <option value="exported">Exported</option>
                  </select>
                  {checkedIds.size > 0 && (
                    <button onClick={() => handleApprove("approve", Array.from(checkedIds))} disabled={approving}
                      className="px-3 py-1.5 bg-green text-charcoal rounded-lg text-xs font-bold disabled:opacity-50"
                    >{approving ? "…" : `Approve ${checkedIds.size}`}</button>
                  )}
                </div>
              </div>

              {/* Day table */}
              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-charcoal-light">
                      <th className="w-8 px-3 py-2">
                        <input type="checkbox"
                          checked={filteredSheets.length > 0 && filteredSheets.every((ts) => checkedIds.has(ts.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCheckedIds(new Set([...checkedIds, ...filteredSheets.map((ts) => ts.id)]));
                            } else {
                              const next = new Set(checkedIds);
                              filteredSheets.forEach((ts) => next.delete(ts.id));
                              setCheckedIds(next);
                            }
                          }}
                          className="accent-teal"
                        />
                      </th>
                      <th className="text-left text-[10px] text-cream-muted font-medium px-3 py-2 uppercase tracking-wider">Date</th>
                      <th className="text-left text-[10px] text-cream-muted font-medium px-3 py-2 uppercase tracking-wider">Status</th>
                      <th className="text-left text-[10px] text-cream-muted font-medium px-3 py-2 uppercase tracking-wider">Time</th>
                      <th className="text-right text-[10px] text-cream-muted font-medium px-3 py-2 uppercase tracking-wider">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSheets.length === 0 ? (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-cream-muted text-sm">No timesheets match filter.</td></tr>
                    ) : (
                      filteredSheets.map((ts) => {
                        const isSelected = selectedDate === ts.date;
                        const breakTotal = (ts.break_minutes || 0) + (ts.lunch_minutes || 0);
                        return (
                          <tr key={ts.id}
                            onClick={() => setSelectedDate(isSelected ? null : ts.date)}
                            className={`border-b border-charcoal-light/30 cursor-pointer transition-colors ${
                              isSelected ? "bg-teal/10" : "hover:bg-charcoal-light/20"
                            }`}
                          >
                            <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" checked={checkedIds.has(ts.id)}
                                onChange={(e) => {
                                  const next = new Set(checkedIds);
                                  e.target.checked ? next.add(ts.id) : next.delete(ts.id);
                                  setCheckedIds(next);
                                }}
                                className="accent-teal"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-cream text-sm font-medium">{fmtDate(ts.date)}</span>
                              {ts.has_open_punch && (
                                <span className="ml-2 text-amber text-[10px]" title="Missing clock out">⚠</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusStyles[ts.status] || ""}`}>
                                {ts.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-cream-muted text-sm">
                              {fmtTime(ts.clock_in)} – {fmtTime(ts.clock_out)}
                              {breakTotal > 0 && (
                                <span className="text-cream-muted text-xs ml-1">| {fmtDuration(breakTotal)}</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span className="text-teal font-semibold text-sm">{fmtHoursDecimal(ts.worked_minutes)}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Totals row */}
                {filteredSheets.length > 0 && (
                  <div className="flex justify-between px-5 py-3 border-t border-charcoal-light bg-charcoal-light/20">
                    <span className="text-cream-muted text-xs">{filteredSheets.length} timesheets</span>
                    <span className="text-teal font-bold text-sm">
                      {fmtHoursDecimal(filteredSheets.reduce((s, ts) => s + (ts.worked_minutes || 0), 0))} hrs
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-cream-muted text-sm">
              {loading ? "Loading…" : "Select an employee to view timesheets."}
            </div>
          )}

          {/* ─── Detail Panel ─── */}
          {selectedTimesheet && (
            <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-cream font-bold text-sm mb-1">Timesheet Summary</h4>
                  <p className="text-cream-muted text-xs">{fmtDate(selectedTimesheet.date)}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedTimesheet.status !== "exported" && !editing && (
                    <button onClick={() => {
                      setEditing(true);
                      setEditClockIn(selectedTimesheet.clock_in ? toLocalTimeInput(selectedTimesheet.clock_in) : "");
                      setEditClockOut(selectedTimesheet.clock_out ? toLocalTimeInput(selectedTimesheet.clock_out) : "");
                      setEditBreak(String(selectedTimesheet.break_minutes || 0));
                      setEditLunch(String(selectedTimesheet.lunch_minutes || 0));
                      setEditNote("");
                    }}
                      className="px-4 py-1.5 bg-charcoal-light text-cream rounded-lg text-xs font-bold"
                    >Adjust</button>
                  )}
                  {selectedTimesheet.status === "pending" && !editing && (
                    <>
                      <button onClick={() => handleApprove("approve", [selectedTimesheet.id])} disabled={approving}
                        className="px-4 py-1.5 bg-green text-charcoal rounded-lg text-xs font-bold disabled:opacity-50"
                      >Approve</button>
                      <button onClick={() => handleApprove("dispute", [selectedTimesheet.id], "Needs review")} disabled={approving}
                        className="px-4 py-1.5 bg-red/20 text-red rounded-lg text-xs font-bold disabled:opacity-50"
                      >Dispute</button>
                    </>
                  )}
                  {selectedTimesheet.status === "approved" && !editing && (
                    <button onClick={() => handleApprove("unapprove", [selectedTimesheet.id])} disabled={approving}
                      className="px-4 py-1.5 bg-amber/20 text-amber rounded-lg text-xs font-bold disabled:opacity-50"
                    >Unapprove</button>
                  )}
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${statusStyles[selectedTimesheet.status]}`}>
                    {selectedTimesheet.status}
                  </span>
                </div>
              </div>

              {/* ── Edit Mode ── */}
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] text-cream-muted uppercase tracking-wider mb-1 block">Clock In</label>
                      <input type="time" value={editClockIn} onChange={(e) => setEditClockIn(e.target.value)}
                        className="w-full bg-charcoal border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream-muted uppercase tracking-wider mb-1 block">Clock Out</label>
                      <input type="time" value={editClockOut} onChange={(e) => setEditClockOut(e.target.value)}
                        className="w-full bg-charcoal border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream-muted uppercase tracking-wider mb-1 block">Break (min)</label>
                      <input type="number" min="0" value={editBreak} onChange={(e) => setEditBreak(e.target.value)}
                        className="w-full bg-charcoal border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-cream-muted uppercase tracking-wider mb-1 block">Lunch (min)</label>
                      <input type="number" min="0" value={editLunch} onChange={(e) => setEditLunch(e.target.value)}
                        className="w-full bg-charcoal border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-cream-muted uppercase tracking-wider mb-1 block">Reason for adjustment</label>
                    <input type="text" value={editNote} onChange={(e) => setEditNote(e.target.value)}
                      placeholder="e.g. Forgot to clock out, adjusted to actual departure time"
                      className="w-full bg-charcoal border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm placeholder:text-charcoal-light"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      setSaving(true);
                      const { data: { session } } = await supabase.auth.getSession();
                      // Build ISO timestamps from the date + time inputs
                      const clockIn = editClockIn ? `${selectedTimesheet.date}T${editClockIn}:00` : undefined;
                      const clockOut = editClockOut ? `${selectedTimesheet.date}T${editClockOut}:00` : undefined;
                      await fetch("/api/timesheets/adjust", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session?.access_token}`,
                        },
                        body: JSON.stringify({
                          timesheet_id: selectedTimesheet.id,
                          clock_in: clockIn,
                          clock_out: clockOut,
                          break_minutes: editBreak,
                          lunch_minutes: editLunch,
                          note: editNote || undefined,
                        }),
                      });
                      await fetchTimesheets();
                      setEditing(false);
                      setSaving(false);
                    }} disabled={saving}
                      className="px-4 py-1.5 bg-teal text-charcoal rounded-lg text-xs font-bold disabled:opacity-50"
                    >{saving ? "Saving…" : "Save Adjustment"}</button>
                    <button onClick={() => setEditing(false)}
                      className="px-4 py-1.5 bg-charcoal-light text-cream-muted rounded-lg text-xs font-bold"
                    >Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* ── Read-only summary ── */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] text-cream-muted uppercase tracking-wider mb-1">Time</p>
                      <p className="text-cream text-sm font-medium">
                        {fmtTime(selectedTimesheet.clock_in)} – {fmtTime(selectedTimesheet.clock_out)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-cream-muted uppercase tracking-wider mb-1">Worked</p>
                      <p className="text-teal text-sm font-bold">{fmtHoursDecimal(selectedTimesheet.worked_minutes)} hrs</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-cream-muted uppercase tracking-wider mb-1">Break Summary</p>
                      <p className="text-cream text-sm">
                        {selectedTimesheet.lunch_minutes > 0 && `Lunch: ${selectedTimesheet.lunch_minutes}m`}
                        {selectedTimesheet.lunch_minutes > 0 && selectedTimesheet.break_minutes > 0 && " · "}
                        {selectedTimesheet.break_minutes > 0 && `Break: ${selectedTimesheet.break_minutes}m`}
                        {selectedTimesheet.lunch_minutes === 0 && selectedTimesheet.break_minutes === 0 && "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-cream-muted uppercase tracking-wider mb-1">Pay</p>
                      <p className="text-cream text-sm">
                        {selectedTimesheet.pay_rate_snapshot
                          ? `$${parseFloat(selectedTimesheet.pay_rate_snapshot).toFixed(2)}/hr`
                          : "—"
                        }
                        {selectedTimesheet.pay_amount && (
                          <span className="text-teal font-bold ml-2">${parseFloat(selectedTimesheet.pay_amount).toFixed(2)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Punch details */}
                  {detailPunches.length > 0 && (
                    <div>
                      <p className="text-[10px] text-cream-muted uppercase tracking-wider mb-2">Punch Details</p>
                      <div className="space-y-1">
                        {detailPunches.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 text-sm">
                            <span className={`text-xs font-medium w-24 ${punchTypeColors[p.type] || "text-cream-muted"}`}>
                              {punchTypeLabels[p.type] || p.type}
                            </span>
                            <span className="text-cream">{fmtTimeFull(p.timestamp)}</span>
                            {p.note && <span className="text-cream-muted text-xs">— {p.note}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedTimesheet.manager_note && !editing && (
                <div className="mt-3 p-3 bg-charcoal-light/30 rounded-lg">
                  <p className="text-[10px] text-cream-muted uppercase tracking-wider mb-1">Manager Note</p>
                  <p className="text-cream text-sm whitespace-pre-line">{selectedTimesheet.manager_note}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
