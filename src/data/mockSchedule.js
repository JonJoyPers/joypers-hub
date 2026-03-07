/**
 * Joy-Per's Hub — Mock Schedule Data
 * Shift types: "opening" | "mid" | "closing" | "inventory" | "part-time"
 * Generates 2 weeks of shifts relative to today's Monday
 */

function getMonday(weeksOffset = 0) {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff + weeksOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateStr(baseDate, dayOffset = 0) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split("T")[0];
}

const monday1 = getMonday(0);
const monday2 = getMonday(1);

let idCounter = 1;
function shiftId() {
  return `sh${String(idCounter++).padStart(3, "0")}`;
}

function shift(userId, base, dayOffset, startTime, endTime, type) {
  return {
    id: shiftId(),
    userId,
    date: dateStr(base, dayOffset),
    startTime,
    endTime,
    type,
  };
}

export const MOCK_SHIFTS = [
  // ── WEEK 1 ──────────────────────────────────────────────

  // u000 - Jon (Owner) — sparse, 2-3 days
  shift("u000", monday1, 1, "10:00", "16:00", "mid"),
  shift("u000", monday1, 3, "10:00", "16:00", "mid"),

  // u001 - Diana (GM) — Mon-Fri, opening
  shift("u001", monday1, 0, "08:00", "17:00", "opening"),
  shift("u001", monday1, 1, "08:00", "17:00", "opening"),
  shift("u001", monday1, 2, "08:00", "17:00", "opening"),
  shift("u001", monday1, 3, "08:00", "17:00", "opening"),
  shift("u001", monday1, 4, "08:00", "17:00", "opening"),

  // u002 - Marcus (Sales Mgr) — Mon-Fri, opening/mid
  shift("u002", monday1, 0, "08:30", "18:00", "opening"),
  shift("u002", monday1, 1, "08:30", "18:00", "opening"),
  shift("u002", monday1, 2, "08:30", "18:00", "opening"),
  shift("u002", monday1, 3, "10:00", "19:00", "mid"),
  shift("u002", monday1, 4, "08:30", "18:00", "opening"),
  shift("u002", monday1, 5, "09:00", "15:00", "mid"),

  // u003 - Sophie (Inventory Mgr) — Mon-Fri, opening
  shift("u003", monday1, 0, "08:00", "16:30", "opening"),
  shift("u003", monday1, 1, "08:00", "16:30", "opening"),
  shift("u003", monday1, 2, "08:00", "16:30", "opening"),
  shift("u003", monday1, 3, "08:00", "16:30", "opening"),
  shift("u003", monday1, 4, "08:00", "16:30", "opening"),

  // u004 - Jordan (Sr Sales) — Mon-Fri, opening
  shift("u004", monday1, 0, "09:00", "18:00", "opening"),
  shift("u004", monday1, 1, "09:00", "18:00", "opening"),
  shift("u004", monday1, 2, "09:00", "18:00", "opening"),
  shift("u004", monday1, 3, "09:00", "18:00", "opening"),
  shift("u004", monday1, 4, "09:00", "18:00", "opening"),

  // u005 - Priya (Sales) — Mon-Fri, mid
  shift("u005", monday1, 0, "10:00", "19:00", "mid"),
  shift("u005", monday1, 1, "10:00", "19:00", "mid"),
  shift("u005", monday1, 2, "10:00", "19:00", "mid"),
  shift("u005", monday1, 4, "10:00", "19:00", "mid"),
  shift("u005", monday1, 5, "10:00", "18:00", "mid"),

  // u006 - Devon (Sales) — Mon,Tue,Thu,Fri,Sat, closing
  shift("u006", monday1, 0, "12:00", "20:00", "closing"),
  shift("u006", monday1, 1, "12:00", "20:00", "closing"),
  shift("u006", monday1, 3, "12:00", "20:00", "closing"),
  shift("u006", monday1, 4, "12:00", "20:00", "closing"),
  shift("u006", monday1, 5, "11:00", "19:00", "closing"),

  // u007 - Aisha (Stock) — Mon-Fri, opening
  shift("u007", monday1, 0, "08:00", "16:30", "opening"),
  shift("u007", monday1, 1, "08:00", "16:30", "opening"),
  shift("u007", monday1, 2, "08:00", "16:30", "opening"),
  shift("u007", monday1, 3, "08:00", "16:30", "opening"),
  shift("u007", monday1, 4, "08:00", "16:30", "opening"),

  // u008 - Tyler (Part-Time) — Wed,Fri,Sat
  shift("u008", monday1, 2, "15:00", "20:00", "part-time"),
  shift("u008", monday1, 4, "15:00", "20:00", "part-time"),
  shift("u008", monday1, 5, "12:00", "18:00", "part-time"),

  // ── WEEK 2 ──────────────────────────────────────────────

  // u000 - Jon (Owner)
  shift("u000", monday2, 0, "10:00", "16:00", "mid"),
  shift("u000", monday2, 2, "10:00", "15:00", "mid"),
  shift("u000", monday2, 4, "09:00", "14:00", "mid"),

  // u001 - Diana (GM)
  shift("u001", monday2, 0, "08:00", "17:00", "opening"),
  shift("u001", monday2, 1, "08:00", "17:00", "opening"),
  shift("u001", monday2, 2, "08:00", "17:00", "opening"),
  shift("u001", monday2, 3, "08:00", "17:00", "opening"),
  shift("u001", monday2, 4, "08:00", "17:00", "opening"),

  // u002 - Marcus (Sales Mgr)
  shift("u002", monday2, 0, "08:30", "18:00", "opening"),
  shift("u002", monday2, 1, "10:00", "19:00", "mid"),
  shift("u002", monday2, 2, "08:30", "18:00", "opening"),
  shift("u002", monday2, 3, "08:30", "18:00", "opening"),
  shift("u002", monday2, 4, "08:30", "18:00", "opening"),

  // u003 - Sophie (Inventory Mgr)
  shift("u003", monday2, 0, "08:00", "16:30", "opening"),
  shift("u003", monday2, 1, "08:00", "16:30", "opening"),
  shift("u003", monday2, 2, "07:00", "16:00", "inventory"),
  shift("u003", monday2, 3, "08:00", "16:30", "opening"),
  shift("u003", monday2, 4, "08:00", "16:30", "opening"),

  // u004 - Jordan (Sr Sales)
  shift("u004", monday2, 0, "09:00", "18:00", "opening"),
  shift("u004", monday2, 1, "09:00", "18:00", "opening"),
  shift("u004", monday2, 2, "09:00", "18:00", "opening"),
  shift("u004", monday2, 3, "09:00", "18:00", "opening"),
  shift("u004", monday2, 4, "09:00", "18:00", "opening"),
  shift("u004", monday2, 5, "10:00", "16:00", "mid"),

  // u005 - Priya (Sales)
  shift("u005", monday2, 0, "10:00", "19:00", "mid"),
  shift("u005", monday2, 1, "10:00", "19:00", "mid"),
  shift("u005", monday2, 3, "10:00", "19:00", "mid"),
  shift("u005", monday2, 4, "10:00", "19:00", "mid"),
  shift("u005", monday2, 5, "10:00", "18:00", "mid"),

  // u006 - Devon (Sales)
  shift("u006", monday2, 0, "12:00", "20:00", "closing"),
  shift("u006", monday2, 1, "12:00", "20:00", "closing"),
  shift("u006", monday2, 2, "12:00", "20:00", "closing"),
  shift("u006", monday2, 4, "12:00", "20:00", "closing"),
  shift("u006", monday2, 5, "11:00", "19:00", "closing"),

  // u007 - Aisha (Stock)
  shift("u007", monday2, 0, "08:00", "16:30", "opening"),
  shift("u007", monday2, 1, "08:00", "16:30", "opening"),
  shift("u007", monday2, 2, "07:00", "16:00", "inventory"),
  shift("u007", monday2, 3, "08:00", "16:30", "opening"),
  shift("u007", monday2, 4, "08:00", "16:30", "opening"),

  // u008 - Tyler (Part-Time)
  shift("u008", monday2, 1, "15:00", "20:00", "part-time"),
  shift("u008", monday2, 3, "15:00", "20:00", "part-time"),
  shift("u008", monday2, 5, "12:00", "18:00", "part-time"),
];
