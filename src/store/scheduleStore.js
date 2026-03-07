import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { MOCK_SHIFTS } from "../data/mockSchedule";

/**
 * scheduleStore — employee shift scheduling
 *
 * Supabase mode: fetches/inserts/deletes from shifts table
 * Mock fallback: original in-memory mock data
 */
export const useScheduleStore = create((set, get) => ({
  shifts: isSupabaseConfigured() ? [] : [...MOCK_SHIFTS],
  loading: false,

  /**
   * Fetch all shifts from Supabase. Call on mount or after mutations.
   */
  fetchShifts: async () => {
    if (!isSupabaseConfigured()) return;

    set({ loading: true });
    const { data, error } = await supabase
      .from("shifts")
      .select("*, employee:employees(id, name, first_name, role)")
      .order("date")
      .order("start_time");

    if (error) {
      console.error("Failed to fetch shifts:", error.message);
      set({ loading: false });
      return;
    }

    // Map DB rows to the shape the app expects
    const shifts = (data || []).map(mapShiftFromDb);
    set({ shifts, loading: false });
  },

  getShiftsForDate: (dateStr) =>
    get()
      .shifts.filter((s) => s.date === dateStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),

  getShiftsForUser: (userId) =>
    get()
      .shifts.filter((s) => s.userId === userId)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      ),

  getShiftsForWeek: (mondayDateStr) => {
    const monday = new Date(mondayDateStr + "T00:00:00");
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return get()
      .shifts.filter((s) => dates.includes(s.date))
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
      );
  },

  addShift: async ({ userId, date, startTime, endTime, type }) => {
    if (!isSupabaseConfigured()) {
      const shift = {
        id: `sh_${Date.now()}`,
        userId,
        date,
        startTime,
        endTime,
        type,
      };
      set((s) => ({ shifts: [...s.shifts, shift] }));
      return shift;
    }

    // Build full timestamps from date + time
    const startTimestamp = `${date}T${startTime}:00`;
    const endTimestamp = `${date}T${endTime}:00`;

    const { data, error } = await supabase
      .from("shifts")
      .insert({
        employee_id: userId,
        date,
        start_time: startTimestamp,
        end_time: endTimestamp,
        type: type === "part-time" ? "part_time" : type,
      })
      .select("*, employee:employees(id, name, first_name, role)")
      .single();

    if (error) {
      console.error("Failed to add shift:", error.message);
      return null;
    }

    const shift = mapShiftFromDb(data);
    set((s) => ({ shifts: [...s.shifts, shift] }));
    return shift;
  },

  removeShift: async (shiftId) => {
    set((s) => ({ shifts: s.shifts.filter((sh) => sh.id !== shiftId) }));

    if (!isSupabaseConfigured()) return;

    // shiftId is numeric from Supabase, string from mock
    const numId = typeof shiftId === "string" ? parseInt(shiftId, 10) : shiftId;
    if (!isNaN(numId)) {
      const { error } = await supabase.from("shifts").delete().eq("id", numId);
      if (error) console.error("Failed to delete shift:", error.message);
    }
  },
}));

/**
 * Map a Supabase shift row to the shape the app expects.
 */
function mapShiftFromDb(row) {
  const start = new Date(row.start_time);
  const end = new Date(row.end_time);
  return {
    id: String(row.id),
    userId: row.employee_id,
    date: row.date,
    startTime: start.toTimeString().slice(0, 5), // HH:MM
    endTime: end.toTimeString().slice(0, 5),
    type: row.type === "part_time" ? "part-time" : row.type,
    employeeName: row.employee?.name,
    employeeRole: row.employee?.role,
  };
}
