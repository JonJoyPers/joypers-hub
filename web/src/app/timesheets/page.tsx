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
  employee: { name: string } | null;
}

export default function TimesheetsPage() {
  const supabase = createClient();
  const [punches, setPunches] = useState<Punch[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchPunches();
  }, [date, employeeFilter]);

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
      .order("timestamp", { ascending: false });

    if (employeeFilter) {
      query = query.eq("employee_id", employeeFilter);
    }

    const { data } = await query;
    setPunches(data || []);
  }

  function exportCSV() {
    const headers = ["Employee", "Type", "Time", "Note"];
    const rows = punches.map((p) => [
      p.employee?.name || "",
      p.type,
      new Date(p.timestamp).toLocaleString(),
      p.note || "",
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Group punches by employee for summary
  const byEmployee = new Map<string, Punch[]>();
  punches.forEach((p) => {
    const name = p.employee?.name || p.employee_id;
    if (!byEmployee.has(name)) byEmployee.set(name, []);
    byEmployee.get(name)!.push(p);
  });

  const typeColors: Record<string, string> = {
    clock_in: "bg-green/20 text-green",
    clock_out: "bg-red/20 text-red",
    break_start: "bg-amber/20 text-amber",
    break_end: "bg-amber/20 text-amber",
    lunch_start: "bg-violet/20 text-violet",
    lunch_end: "bg-violet/20 text-violet",
  };

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

      {/* Punch Timeline */}
      <div className="bg-charcoal-mid rounded-xl border border-charcoal-light overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-charcoal-light">
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Employee</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Type</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Time</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {punches.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-cream-muted text-sm">
                  No punches recorded for this date.
                </td>
              </tr>
            ) : (
              punches.map((punch) => (
                <tr key={punch.id} className="border-b border-charcoal-light/50 hover:bg-charcoal-light/30">
                  <td className="px-5 py-3 text-cream text-sm">{punch.employee?.name}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${typeColors[punch.type] || ""}`}>
                      {punch.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-cream-muted text-sm">
                    {new Date(punch.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </td>
                  <td className="px-5 py-3 text-cream-muted text-sm">{punch.note || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {byEmployee.size > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-cream mb-3">Daily Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(byEmployee.entries()).map(([name, empPunches]) => {
              const clockIns = empPunches.filter((p) => p.type === "clock_in").length;
              const clockOuts = empPunches.filter((p) => p.type === "clock_out").length;
              return (
                <div key={name} className="bg-charcoal-light rounded-lg p-4">
                  <p className="text-cream font-medium text-sm">{name}</p>
                  <p className="text-cream-muted text-xs mt-1">
                    {clockIns} clock-in{clockIns !== 1 ? "s" : ""}, {clockOuts} clock-out{clockOuts !== 1 ? "s" : ""}
                    {" | "}{empPunches.length} total punches
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
