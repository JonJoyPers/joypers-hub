import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useScheduleStore } from "../../store/scheduleStore";
import { getUserById } from "../../data/mockUsers";
import CreateShiftModal from "./CreateShiftModal";

const ROLE_COLOR = {
  admin: COLORS.amber,
  manager: COLORS.tealLight,
  employee: COLORS.creamMuted,
};

const SHIFT_TYPE_COLORS = {
  opening: COLORS.green,
  mid: COLORS.teal,
  closing: COLORS.violet,
  inventory: COLORS.amber,
  "part-time": COLORS.creamMuted,
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

function formatTimeShort(time24) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "p" : "a";
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${m.toString().padStart(2, "0")}${ampm}`;
}

function isToday(dateString) {
  return dateString === new Date().toISOString().split("T")[0];
}

export default function ScheduleScreen({ navigation, embedded = false }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const colWidth = (windowWidth - 16) / 7;
  const user = useAuthStore((s) => s.user);
  const shifts = useScheduleStore((s) => s.shifts);
  const getShiftsForWeek = useScheduleStore((s) => s.getShiftsForWeek);

  const fetchShifts = useScheduleStore((s) => s.fetchShifts);

  useEffect(() => {
    fetchShifts();
  }, []);

  const canCreate = user?.role === "admin" || user?.role === "manager";
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState("team"); // "team" | "my"
  const [displayMode, setDisplayMode] = useState("week"); // "week" | "day" | "list"
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const monday = useMemo(() => getMonday(weekOffset), [weekOffset]);
  const mondayStr = useMemo(() => dateStr(monday), [monday]);
  const weekShifts = getShiftsForWeek(mondayStr);

  // Build days array for the week
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const ds = dateStr(monday, i);
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return {
        dateStr: ds,
        dayName: DAY_NAMES[i],
        dayNum: d.getDate(),
        month: d.toLocaleDateString("en-US", { month: "short" }),
        today: isToday(ds),
      };
    });
  }, [monday]);

  // Filter shifts for view
  const filteredShifts = useMemo(() => {
    if (viewMode === "my") {
      return weekShifts.filter((s) => s.userId === user.id);
    }
    return weekShifts;
  }, [weekShifts, viewMode, user.id]);

  // Group shifts by date
  const shiftsByDate = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      map[d.dateStr] = filteredShifts.filter((s) => s.date === d.dateStr);
    });
    return map;
  }, [filteredShifts, days]);

  const weekLabel = useMemo(() => {
    if (weekOffset === 0) return "This Week";
    if (weekOffset === 1) return "Next Week";
    if (weekOffset === -1) return "Last Week";
    return `${days[0].month} ${days[0].dayNum} – ${days[6].month} ${days[6].dayNum}`;
  }, [weekOffset, days]);

  return (
    <View style={styles.root}>
      {/* Header — hidden when embedded in WorkHubScreen */}
      {!embedded && (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.eyebrow}>SCHEDULE</Text>
          <Text style={styles.title}>{weekLabel}</Text>
        </View>
      )}

      {/* Week Nav */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          onPress={() => setWeekOffset((w) => w - 1)}
          style={styles.weekArrow}
        >
          <ChevronLeft size={20} color={COLORS.cream} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.dayChips}>
          {days.map((d) => (
            <View
              key={d.dateStr}
              style={[styles.dayChip, d.today && styles.dayChipToday]}
            >
              <Text
                style={[styles.dayChipName, d.today && styles.dayChipTextToday]}
              >
                {d.dayName}
              </Text>
              <Text
                style={[styles.dayChipNum, d.today && styles.dayChipTextToday]}
              >
                {d.dayNum}
              </Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          onPress={() => setWeekOffset((w) => w + 1)}
          style={styles.weekArrow}
        >
          <ChevronRight size={20} color={COLORS.cream} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Display Mode Toggle */}
      <View style={styles.toggleRow}>
        {["week", "day", "list"].map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.toggleBtn, displayMode === mode && styles.toggleBtnActive]}
            onPress={() => setDisplayMode(mode)}
          >
            <Text style={[styles.toggleText, displayMode === mode && styles.toggleTextActive]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My / Team Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === "my" && styles.toggleBtnActive]}
          onPress={() => setViewMode("my")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "my" && styles.toggleTextActive,
            ]}
          >
            My Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            viewMode === "team" && styles.toggleBtnActive,
          ]}
          onPress={() => setViewMode("team")}
        >
          <Text
            style={[
              styles.toggleText,
              viewMode === "team" && styles.toggleTextActive,
            ]}
          >
            Team Schedule
          </Text>
        </TouchableOpacity>
      </View>

      {/* === WEEK VIEW === */}
      {displayMode === "week" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.gridScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridRow}>
            {days.map((day) => (
              <View
                key={day.dateStr}
                style={[
                  styles.gridColHeader,
                  { width: colWidth },
                  day.today && styles.gridColHeaderToday,
                ]}
              >
                <Text style={[styles.gridDayName, day.today && { color: COLORS.teal }]}>
                  {day.dayName.toUpperCase()}
                </Text>
                <Text style={[styles.gridDayNum, day.today && { color: COLORS.teal }]}>
                  {day.dayNum}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.gridRow}>
            {days.map((day) => {
              const dayShifts = shiftsByDate[day.dateStr] || [];
              return (
                <View
                  key={day.dateStr}
                  style={[styles.gridCol, { width: colWidth }, day.today && styles.gridColToday]}
                >
                  {dayShifts.length === 0 ? (
                    <Text style={styles.gridOff}>{viewMode === "my" ? "Off" : "—"}</Text>
                  ) : (
                    dayShifts.map((sh) => {
                      const shiftUser = getUserById(sh.userId);
                      const typeColor = SHIFT_TYPE_COLORS[sh.type] || COLORS.creamMuted;
                      const roleColor = ROLE_COLOR[shiftUser?.role] || COLORS.creamMuted;
                      return (
                        <TouchableOpacity
                          key={sh.id}
                          style={[styles.gridShiftBlock, { backgroundColor: typeColor + "20", borderLeftColor: typeColor }]}
                          onPress={() => viewMode === "team" && navigation.navigate("UserSchedule", { userId: sh.userId })}
                          activeOpacity={viewMode === "team" ? 0.7 : 1}
                        >
                          {viewMode === "team" && (
                            <View style={[styles.gridShiftAvatar, { backgroundColor: roleColor + "30", borderColor: roleColor }]}>
                              <Text style={[styles.gridShiftInitial, { color: roleColor }]}>
                                {shiftUser?.firstName?.charAt(0) || "?"}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.gridShiftTime} numberOfLines={1}>{formatTimeShort(sh.startTime)}</Text>
                          <Text style={styles.gridShiftTimeDim} numberOfLines={1}>{formatTimeShort(sh.endTime)}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              );
            })}
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* === DAY VIEW === */}
      {displayMode === "day" && (() => {
        const day = days[selectedDayIndex];
        const dayShifts = shiftsByDate[day.dateStr] || [];
        return (
          <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
            <View style={styles.dayNav}>
              <TouchableOpacity
                onPress={() => setSelectedDayIndex((i) => Math.max(0, i - 1))}
                style={styles.dayNavArrow}
                disabled={selectedDayIndex === 0}
              >
                <ChevronLeft size={22} color={selectedDayIndex === 0 ? COLORS.charcoalLight : COLORS.cream} strokeWidth={2} />
              </TouchableOpacity>
              <View style={styles.dayNavCenter}>
                <Text style={styles.dayNavTitle}>{DAY_NAMES_FULL[selectedDayIndex]}</Text>
                <Text style={styles.dayNavDate}>{day.month} {day.dayNum}{day.today ? "  ·  Today" : ""}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedDayIndex((i) => Math.min(6, i + 1))}
                style={styles.dayNavArrow}
                disabled={selectedDayIndex === 6}
              >
                <ChevronRight size={22} color={selectedDayIndex === 6 ? COLORS.charcoalLight : COLORS.cream} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {dayShifts.length === 0 ? (
              <View style={styles.dayEmpty}>
                <Text style={styles.dayEmptyText}>{viewMode === "my" ? "You're off this day" : "No shifts scheduled"}</Text>
              </View>
            ) : (
              dayShifts.map((sh) => {
                const shiftUser = getUserById(sh.userId);
                const typeColor = SHIFT_TYPE_COLORS[sh.type] || COLORS.creamMuted;
                const roleColor = ROLE_COLOR[shiftUser?.role] || COLORS.creamMuted;
                return (
                  <TouchableOpacity
                    key={sh.id}
                    style={[styles.dayCard, { borderLeftColor: typeColor }]}
                    onPress={() => viewMode === "team" && navigation.navigate("UserSchedule", { userId: sh.userId })}
                    activeOpacity={viewMode === "team" ? 0.7 : 1}
                  >
                    <View style={[styles.dayCardAvatar, { backgroundColor: roleColor + "30", borderColor: roleColor }]}>
                      <Text style={[styles.dayCardAvatarText, { color: roleColor }]}>
                        {shiftUser?.firstName?.charAt(0) || "?"}
                      </Text>
                    </View>
                    <View style={styles.dayCardInfo}>
                      <Text style={styles.dayCardName}>{shiftUser?.name || "Unknown"}</Text>
                      <Text style={styles.dayCardTime}>
                        {formatTimeShort(sh.startTime)} – {formatTimeShort(sh.endTime)}
                      </Text>
                    </View>
                    <View style={[styles.dayTypePill, { backgroundColor: typeColor + "25" }]}>
                      <Text style={[styles.dayTypePillText, { color: typeColor }]}>
                        {sh.type.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
            <View style={{ height: 80 }} />
          </ScrollView>
        );
      })()}

      {/* === LIST VIEW === */}
      {displayMode === "list" && (
        <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, gap: 6 }} showsVerticalScrollIndicator={false}>
          {days.map((day) => {
            const dayShifts = shiftsByDate[day.dateStr] || [];
            if (dayShifts.length === 0 && viewMode === "team") return null;
            return (
              <View key={day.dateStr}>
                <Text style={styles.listDateHeader}>
                  {DAY_NAMES_FULL[days.indexOf(day)].toUpperCase()}  ·  {day.month.toUpperCase()} {day.dayNum}
                  {day.today ? "  ·  TODAY" : ""}
                </Text>
                {dayShifts.length === 0 ? (
                  <Text style={styles.listOffText}>Off</Text>
                ) : (
                  dayShifts.map((sh) => {
                    const shiftUser = getUserById(sh.userId);
                    const typeColor = SHIFT_TYPE_COLORS[sh.type] || COLORS.creamMuted;
                    const roleColor = ROLE_COLOR[shiftUser?.role] || COLORS.creamMuted;
                    return (
                      <TouchableOpacity
                        key={sh.id}
                        style={styles.listRow}
                        onPress={() => viewMode === "team" && navigation.navigate("UserSchedule", { userId: sh.userId })}
                        activeOpacity={viewMode === "team" ? 0.7 : 1}
                      >
                        <View style={[styles.listAvatar, { backgroundColor: roleColor + "30", borderColor: roleColor }]}>
                          <Text style={[styles.listAvatarText, { color: roleColor }]}>
                            {shiftUser?.firstName?.charAt(0) || "?"}
                          </Text>
                        </View>
                        <View style={styles.listInfo}>
                          <Text style={styles.listName}>{shiftUser?.name || "Unknown"}</Text>
                          <Text style={styles.listTime}>
                            {formatTimeShort(sh.startTime)} – {formatTimeShort(sh.endTime)}
                          </Text>
                        </View>
                        <View style={[styles.listTypePill, { backgroundColor: typeColor + "25" }]}>
                          <Text style={[styles.listTypePillText, { color: typeColor }]}>{sh.type.toUpperCase()}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            );
          })}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
        >
          <Plus size={26} color={COLORS.charcoal} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      <CreateShiftModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.charcoalMid,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.cream,
    letterSpacing: -0.5,
  },

  // Week Nav
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
  },
  weekArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dayChips: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  dayChip: {
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  dayChipToday: {
    backgroundColor: COLORS.teal + "30",
  },
  dayChipName: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  dayChipNum: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.cream,
    marginTop: 1,
  },
  dayChipTextToday: {
    color: COLORS.teal,
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: COLORS.teal + "30",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.creamMuted,
  },
  toggleTextActive: {
    color: COLORS.teal,
  },

  // Grid Layout
  scroll: { flex: 1 },
  gridScrollContent: { paddingHorizontal: 8, paddingTop: 12 },
  gridRow: { flexDirection: "row" },

  gridColHeader: {
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
  },
  gridColHeaderToday: {
    backgroundColor: COLORS.teal + "12",
    borderRadius: 8,
  },
  gridDayName: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  gridDayNum: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.cream,
    marginTop: 1,
  },

  gridCol: {
    paddingHorizontal: 2,
    paddingTop: 6,
    gap: 4,
    minHeight: 100,
  },
  gridColToday: {
    backgroundColor: COLORS.teal + "08",
  },
  gridOff: {
    fontSize: 10,
    color: COLORS.charcoalLight,
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 12,
  },

  gridShiftBlock: {
    borderRadius: 8,
    borderLeftWidth: 3,
    paddingVertical: 5,
    paddingHorizontal: 3,
    alignItems: "center",
    gap: 2,
  },
  gridShiftAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 1,
  },
  gridShiftInitial: {
    fontSize: 10,
    fontWeight: "800",
  },
  gridShiftTime: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.cream,
    textAlign: "center",
  },
  gridShiftTimeDim: {
    fontSize: 8,
    fontWeight: "600",
    color: COLORS.creamMuted,
    textAlign: "center",
  },

  // Day View
  dayNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayNavArrow: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.charcoalMid,
  },
  dayNavCenter: { flex: 1, alignItems: "center" },
  dayNavTitle: { fontSize: 20, fontWeight: "800", color: COLORS.cream },
  dayNavDate: { fontSize: 12, color: COLORS.creamMuted, fontWeight: "600", marginTop: 2 },
  dayEmpty: { alignItems: "center", paddingTop: 40 },
  dayEmptyText: { fontSize: 14, color: COLORS.creamMuted },
  dayCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.charcoalMid, borderRadius: 14, padding: 14,
    borderLeftWidth: 4,
  },
  dayCardAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  dayCardAvatarText: { fontSize: 16, fontWeight: "800" },
  dayCardInfo: { flex: 1, gap: 2 },
  dayCardName: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  dayCardTime: { fontSize: 13, color: COLORS.creamMuted, fontWeight: "600" },
  dayTypePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  dayTypePillText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },

  // List View
  listDateHeader: {
    fontSize: 10, fontWeight: "700", color: COLORS.teal,
    letterSpacing: 2, marginTop: 12, marginBottom: 6,
  },
  listOffText: { fontSize: 13, color: COLORS.creamMuted, fontStyle: "italic", marginBottom: 4 },
  listRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.charcoalMid,
  },
  listAvatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  listAvatarText: { fontSize: 13, fontWeight: "800" },
  listInfo: { flex: 1, gap: 1 },
  listName: { fontSize: 14, fontWeight: "700", color: COLORS.cream },
  listTime: { fontSize: 12, color: COLORS.creamMuted, fontWeight: "600" },
  listTypePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  listTypePillText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
