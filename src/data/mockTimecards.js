/**
 * Mock timecard/punch history for Joy-Per's Hub
 * type: "clock_in" | "clock_out" | "break_start" | "break_end" | "lunch_start" | "lunch_end"
 * Break = paid (time counts toward hours), Lunch = unpaid (time deducted)
 */

const today = new Date();
const d = (daysAgo, h, m = 0) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
};

export const MOCK_TIMECARDS = [
  // ── Jordan Blake (u004) ─────────────────────────────────
  { id: "tc001", userId: "u004", type: "clock_in",    timestamp: d(0, 9, 0),  note: null },
  { id: "tc002", userId: "u004", type: "lunch_start", timestamp: d(0, 13, 0), note: "Lunch" },
  { id: "tc003", userId: "u004", type: "lunch_end",   timestamp: d(0, 13, 30),note: null },

  { id: "tc004", userId: "u004", type: "clock_in",    timestamp: d(1, 9, 5),  note: null },
  { id: "tc005", userId: "u004", type: "lunch_start", timestamp: d(1, 12, 45),note: "Lunch" },
  { id: "tc006", userId: "u004", type: "lunch_end",   timestamp: d(1, 13, 15),note: null },
  { id: "tc007", userId: "u004", type: "clock_out",   timestamp: d(1, 18, 0), note: null },

  { id: "tc008", userId: "u004", type: "clock_in",    timestamp: d(2, 8, 55), note: null },
  { id: "tc009", userId: "u004", type: "clock_out",   timestamp: d(2, 17, 30),note: null },

  // ── Priya Nair (u005) ───────────────────────────────────
  { id: "tc010", userId: "u005", type: "clock_in",    timestamp: d(0, 10, 0), note: null },
  { id: "tc011", userId: "u005", type: "break_start", timestamp: d(0, 14, 0), note: "Break" },
  { id: "tc012", userId: "u005", type: "break_end",   timestamp: d(0, 14, 15),note: null },

  { id: "tc013", userId: "u005", type: "clock_in",    timestamp: d(1, 10, 2), note: null },
  { id: "tc014", userId: "u005", type: "clock_out",   timestamp: d(1, 19, 0), note: null },

  // ── Devon Carter (u006) ─────────────────────────────────
  { id: "tc015", userId: "u006", type: "clock_in",    timestamp: d(0, 12, 0), note: null },
  { id: "tc016", userId: "u006", type: "clock_in",    timestamp: d(1, 11, 45),note: null },
  { id: "tc017", userId: "u006", type: "clock_out",   timestamp: d(1, 20, 0), note: null },
  { id: "tc018", userId: "u006", type: "clock_in",    timestamp: d(2, 12, 0), note: null },
  { id: "tc019", userId: "u006", type: "clock_out",   timestamp: d(2, 19, 30),note: null },

  // ── Aisha Monroe (u007) ─────────────────────────────────
  { id: "tc020", userId: "u007", type: "clock_in",    timestamp: d(0, 8, 0),  note: null },
  { id: "tc021", userId: "u007", type: "lunch_start", timestamp: d(0, 12, 0), note: "Lunch" },
  { id: "tc022", userId: "u007", type: "lunch_end",   timestamp: d(0, 12, 30),note: null },
  { id: "tc023", userId: "u007", type: "clock_out",   timestamp: d(0, 16, 30),note: null },

  { id: "tc024", userId: "u007", type: "clock_in",    timestamp: d(1, 8, 0),  note: null },
  { id: "tc025", userId: "u007", type: "clock_out",   timestamp: d(1, 16, 15),note: null },

  // ── Tyler Huang (u008) ──────────────────────────────────
  { id: "tc026", userId: "u008", type: "clock_in",    timestamp: d(0, 15, 0), note: null },
  { id: "tc027", userId: "u008", type: "clock_out",   timestamp: d(0, 20, 0), note: null },
  { id: "tc028", userId: "u008", type: "clock_in",    timestamp: d(2, 15, 0), note: null },
  { id: "tc029", userId: "u008", type: "clock_out",   timestamp: d(2, 20, 30),note: null },

  // ── Marcus Reid (u002 — manager) ───────────────────────
  { id: "tc030", userId: "u002", type: "clock_in",    timestamp: d(0, 8, 30), note: null },
  { id: "tc031", userId: "u002", type: "clock_in",    timestamp: d(1, 8, 30), note: null },
  { id: "tc032", userId: "u002", type: "clock_out",   timestamp: d(1, 18, 0), note: null },
];

/**
 * Returns punches for a given user, sorted newest-first
 */
export const getPunchesForUser = (userId) =>
  MOCK_TIMECARDS.filter((p) => p.userId === userId).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

/**
 * Returns the most recent punch for a user (to determine current state)
 */
export const getLastPunchForUser = (userId) =>
  getPunchesForUser(userId)[0] || null;
