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

export default function TimesheetsPage() {
  const supabase = createClient();
  const [punches, setPunches] = useState<Punch[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [expandedPunch, setExpandedPunch] = useState<number | null>(null);

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
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Location</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {punches.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-cream-muted text-sm">
                  No punches recorded for this date.
                </td>
              </tr>
            ) : (
              punches.map((punch) => {
                const loc = parseLocation(punch.location);
                const isExpanded = expandedPunch === punch.id;
                return (
                  <tr key={punch.id} className="border-b border-charcoal-light/50 hover:bg-charcoal-light/30 align-top">
                    <td className="px-5 py-3 text-cream text-sm">{punch.employee?.name}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${typeColors[punch.type] || ""}`}>
                        {punch.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-cream-muted text-sm">
                      {new Date(punch.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {loc ? (
                        <div>
                          <button
                            onClick={() => setExpandedPunch(isExpanded ? null : punch.id)}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-teal/20 text-teal hover:bg-teal/30 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            {isExpanded ? "Hide Map" : "View Map"}
                          </button>
                          {isExpanded && (
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
                    <td className="px-5 py-3 text-cream-muted text-sm">{punch.note || "-"}</td>
                  </tr>
                );
              })
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
