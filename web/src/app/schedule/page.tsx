"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

interface Shift {
  id: number;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  employee: { name: string; role: string } | null;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

export default function SchedulePage() {
  const supabase = createClient();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().split("T")[0];
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employee_id: "", date: "", start_time: "09:00", end_time: "17:00", type: "opening" });

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  useEffect(() => {
    fetchShifts();
    fetchEmployees();
  }, [weekStart]);

  async function fetchShifts() {
    const endDate = weekDates[6];
    const { data } = await supabase
      .from("shifts")
      .select("*, employee:employees(name, role)")
      .gte("date", weekStart)
      .lte("date", endDate)
      .order("start_time");
    setShifts(data || []);
  }

  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("id, name, role")
      .eq("is_active", true)
      .order("name");
    setEmployees(data || []);
  }

  async function addShift(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("shifts").insert({
      employee_id: form.employee_id,
      date: form.date,
      start_time: `${form.date}T${form.start_time}:00`,
      end_time: `${form.date}T${form.end_time}:00`,
      type: form.type,
    });
    if (!error) {
      setShowForm(false);
      fetchShifts();
    }
  }

  async function deleteShift(id: number) {
    await supabase.from("shifts").delete().eq("id", id);
    fetchShifts();
  }

  function prevWeek() {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().split("T")[0]);
  }

  function nextWeek() {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().split("T")[0]);
  }

  const typeColors: Record<string, string> = {
    opening: "bg-teal/20 text-teal-light",
    mid: "bg-amber/20 text-amber",
    closing: "bg-violet/20 text-violet",
    inventory: "bg-rose/20 text-rose",
    part_time: "bg-cream-muted/20 text-cream-muted",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cream">Schedule</h2>
        <div className="flex items-center gap-3">
          <button onClick={prevWeek} className="px-3 py-1.5 bg-charcoal-mid border border-charcoal-light rounded-lg text-cream-muted hover:text-cream text-sm">
            &larr; Prev
          </button>
          <span className="text-cream text-sm font-medium">
            {new Date(weekStart + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" - "}
            {new Date(weekDates[6] + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button onClick={nextWeek} className="px-3 py-1.5 bg-charcoal-mid border border-charcoal-light rounded-lg text-cream-muted hover:text-cream text-sm">
            Next &rarr;
          </button>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-1.5 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark">
            + Add Shift
          </button>
        </div>
      </div>

      {/* Add Shift Form */}
      {showForm && (
        <form onSubmit={addShift} className="bg-charcoal-mid rounded-xl border border-charcoal-light p-5 mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required className="bg-charcoal-light border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm">
            <option value="">Employee</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="bg-charcoal-light border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm" />
          <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required className="bg-charcoal-light border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm" />
          <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required className="bg-charcoal-light border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm" />
          <button type="submit" className="bg-teal text-cream rounded-lg py-2 text-sm hover:bg-teal-dark">Save</button>
        </form>
      )}

      {/* Weekly Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDates.map((date, i) => {
          const dayShifts = shifts.filter((s) => s.date === date);
          const isToday = date === new Date().toISOString().split("T")[0];
          return (
            <div key={date} className={`bg-charcoal-mid rounded-xl border p-3 min-h-[200px] ${isToday ? "border-teal" : "border-charcoal-light"}`}>
              <div className="text-center mb-3">
                <p className="text-xs text-cream-muted">{dayNames[i]}</p>
                <p className={`text-sm font-medium ${isToday ? "text-teal-light" : "text-cream"}`}>
                  {new Date(date + "T00:00:00").getDate()}
                </p>
              </div>
              <div className="space-y-1.5">
                {dayShifts.map((shift) => (
                  <div key={shift.id} className={`p-2 rounded-lg text-xs ${typeColors[shift.type || "opening"] || typeColors.opening}`}>
                    <div className="font-medium truncate">{shift.employee?.name}</div>
                    <div className="opacity-75">
                      {new Date(shift.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      -
                      {new Date(shift.end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                    <button onClick={() => deleteShift(shift.id)} className="text-red/60 hover:text-red mt-1 text-[10px]">remove</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
