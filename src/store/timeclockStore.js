import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { MOCK_TIMECARDS } from "../data/mockTimecards";
import { enqueue, isOnline, getPendingCount } from "../services/offlineQueue";

/**
 * timeclockStore — manages punch history and current clock state
 *
 * Supabase mode: fetches/inserts punches from punches table
 * Mock fallback: original in-memory mock data
 */
export const useTimeclockStore = create((set, get) => ({
  punches: isSupabaseConfigured() ? [] : [...MOCK_TIMECARDS],
  loading: false,

  /**
   * Fetch punches from Supabase. Call on mount.
   */
  fetchPunches: async (userId) => {
    if (!isSupabaseConfigured()) return;

    set({ loading: true });
    let query = supabase
      .from("punches")
      .select("*")
      .order("timestamp", { ascending: false });

    if (userId) {
      query = query.eq("employee_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch punches:", error.message);
      set({ loading: false });
      return;
    }

    const punches = (data || []).map(mapPunchFromDb);
    set({ punches, loading: false });
  },

  currentStatus: (userId) => {
    const userPunches = get()
      .punches.filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const last = userPunches[0];
    if (!last) return "clocked_out";
    if (
      last.type === "clock_in" ||
      last.type === "break_end" ||
      last.type === "lunch_end"
    )
      return "clocked_in";
    if (last.type === "break_start") return "on_break";
    if (last.type === "lunch_start") return "on_lunch";
    return "clocked_out";
  },

  getPunchesForUser: (userId) =>
    get()
      .punches.filter((p) => p.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),

  getTodayHours: (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPunches = get()
      .punches.filter(
        (p) => p.userId === userId && new Date(p.timestamp) >= today
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let total = 0;
    let clockInTime = null;
    for (const punch of todayPunches) {
      if (punch.type === "clock_in" || punch.type === "lunch_end") {
        clockInTime = new Date(punch.timestamp);
      } else if (
        (punch.type === "clock_out" || punch.type === "lunch_start") &&
        clockInTime
      ) {
        total += (new Date(punch.timestamp) - clockInTime) / (1000 * 60 * 60);
        clockInTime = null;
      }
    }
    if (clockInTime) {
      total += (new Date() - clockInTime) / (1000 * 60 * 60);
    }
    return Math.round(total * 10) / 10;
  },

  clockIn: async (userId, photoUri = null, location = null) => {
    return get()._addPunch(userId, "clock_in", photoUri, null, location);
  },

  clockOut: async (userId, location = null) => {
    return get()._addPunch(userId, "clock_out", null, null, location);
  },

  startBreak: async (userId, location = null) => {
    return get()._addPunch(userId, "break_start", null, "Break", location);
  },

  endBreak: async (userId, location = null) => {
    return get()._addPunch(userId, "break_end", null, null, location);
  },

  startLunch: async (userId, location = null) => {
    return get()._addPunch(userId, "lunch_start", null, "Lunch", location);
  },

  endLunch: async (userId, location = null) => {
    return get()._addPunch(userId, "lunch_end", null, null, location);
  },

  /**
   * Internal: add a punch record.
   */
  pendingOffline: 0,

  _addPunch: async (userId, type, photoUri, note, location) => {
    const timestamp = new Date().toISOString();

    if (!isSupabaseConfigured()) {
      const punch = {
        id: `tc_${Date.now()}`,
        userId,
        type,
        timestamp,
        photoUri,
        note,
        location,
      };
      set((s) => ({ punches: [punch, ...s.punches] }));
      return punch;
    }

    // Check connectivity — queue offline if no connection
    const online = await isOnline();

    if (!online) {
      await enqueue({
        type: "punch",
        employeeId: userId,
        punchType: type,
        timestamp,
        photoUri,
        note,
        location,
      });
      const count = await getPendingCount();
      const punch = {
        id: `tc_offline_${Date.now()}`,
        userId,
        type,
        timestamp,
        photoUri,
        note,
        location,
        offline: true,
      };
      set((s) => ({ punches: [punch, ...s.punches], pendingOffline: count }));
      return punch;
    }

    const row = {
      employee_id: userId,
      type,
      timestamp,
      photo_url: photoUri,
      note,
    };

    // Store GPS as PostGIS point if available
    if (location?.latitude && location?.longitude) {
      row.location = `POINT(${location.longitude} ${location.latitude})`;
    }

    const { data, error } = await supabase
      .from("punches")
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error("Failed to add punch:", error.message);
      // Queue for offline sync
      await enqueue({
        type: "punch",
        employeeId: userId,
        punchType: type,
        timestamp,
        photoUri,
        note,
        location,
      });
      const count = await getPendingCount();
      const punch = { id: `tc_${Date.now()}`, userId, type, timestamp, photoUri, note, location, offline: true };
      set((s) => ({ punches: [punch, ...s.punches], pendingOffline: count }));
      return punch;
    }

    const punch = mapPunchFromDb(data);
    set((s) => ({ punches: [punch, ...s.punches] }));
    return punch;
  },
}));

/**
 * Map a Supabase punch row to the shape the app expects.
 */
function mapPunchFromDb(row) {
  return {
    id: String(row.id),
    userId: row.employee_id,
    type: row.type,
    timestamp: row.timestamp,
    photoUri: row.photo_url,
    note: row.note,
    location: row.location
      ? {
          longitude: row.location.x ?? row.location.longitude ?? null,
          latitude: row.location.y ?? row.location.latitude ?? null,
        }
      : null,
  };
}
