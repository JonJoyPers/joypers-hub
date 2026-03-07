import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useScheduleStore } from "../../store/scheduleStore";
import { getUserById } from "../../data/mockUsers";

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

function formatTime(time24) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getShiftDuration(startTime, endTime) {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
  return `${hours}h`;
}

function isToday(dateString) {
  return dateString === new Date().toISOString().split("T")[0];
}

function isPast(dateString) {
  return dateString < new Date().toISOString().split("T")[0];
}

export default function UserScheduleScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { userId } = route.params;
  const user = getUserById(userId);
  const getShiftsForUser = useScheduleStore((s) => s.getShiftsForUser);
  const shifts = getShiftsForUser(userId);
  const roleColor = ROLE_COLOR[user?.role] || COLORS.creamMuted;

  // Group shifts by week (Monday)
  const groupedByWeek = useMemo(() => {
    const weeks = {};
    shifts.forEach((s) => {
      const d = new Date(s.date + "T00:00:00");
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d);
      mon.setDate(diff);
      const weekKey = mon.toISOString().split("T")[0];
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(s);
    });
    return Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));
  }, [shifts]);

  // Calculate total hours for a week
  function weekHours(weekShifts) {
    return weekShifts.reduce((sum, s) => {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      return sum + (eh * 60 + em - (sh * 60 + sm)) / 60;
    }, 0);
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={2} />
        </TouchableOpacity>
        <View
          style={[
            styles.headerAvatar,
            { backgroundColor: roleColor + "30", borderColor: roleColor },
          ]}
        >
          <Text style={[styles.headerAvatarText, { color: roleColor }]}>
            {user?.firstName?.charAt(0) || "?"}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{user?.name || "Unknown"}</Text>
          <Text style={[styles.headerRole, { color: roleColor }]}>
            {user?.title || ""}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupedByWeek.length === 0 && (
          <Text style={styles.emptyText}>No shifts scheduled</Text>
        )}

        {groupedByWeek.map(([weekKey, weekShifts]) => {
          const mondayDate = new Date(weekKey + "T00:00:00");
          const weekEnd = new Date(mondayDate);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const total = weekHours(weekShifts);

          return (
            <View key={weekKey} style={styles.weekSection}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekLabel}>
                  {mondayDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  –{" "}
                  {weekEnd.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text style={styles.weekHours}>{total}h total</Text>
              </View>

              {weekShifts.map((sh) => {
                const typeColor =
                  SHIFT_TYPE_COLORS[sh.type] || COLORS.creamMuted;
                const today = isToday(sh.date);
                const past = isPast(sh.date);
                const shiftDate = new Date(sh.date + "T00:00:00");

                return (
                  <View
                    key={sh.id}
                    style={[
                      styles.shiftCard,
                      { borderLeftColor: typeColor },
                      past && { opacity: 0.5 },
                    ]}
                  >
                    <View style={styles.shiftDateCol}>
                      <Text
                        style={[
                          styles.shiftDayName,
                          today && { color: COLORS.teal },
                        ]}
                      >
                        {shiftDate.toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </Text>
                      <Text
                        style={[
                          styles.shiftDayNum,
                          today && { color: COLORS.teal },
                        ]}
                      >
                        {shiftDate.getDate()}
                      </Text>
                    </View>
                    <View style={styles.shiftDetails}>
                      <Text style={styles.shiftTime}>
                        {formatTime(sh.startTime)} – {formatTime(sh.endTime)}
                      </Text>
                      <Text style={styles.shiftDuration}>
                        {getShiftDuration(sh.startTime, sh.endTime)}
                        {today && "  ●  Today"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.typePill,
                        { backgroundColor: typeColor + "25" },
                      ]}
                    >
                      <Text style={[styles.typePillText, { color: typeColor }]}>
                        {sh.type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  headerAvatarText: { fontSize: 14, fontWeight: "800" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  headerRole: { fontSize: 11, fontWeight: "600", marginTop: 1 },

  // Content
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20 },
  emptyText: {
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: "center",
    marginTop: 40,
  },

  // Week Section
  weekSection: { gap: 8 },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 2,
  },
  weekHours: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.creamMuted,
  },

  // Shift Card
  shiftCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    gap: 12,
  },
  shiftDateCol: {
    alignItems: "center",
    width: 40,
  },
  shiftDayName: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  shiftDayNum: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.cream,
  },
  shiftDetails: { flex: 1, gap: 2 },
  shiftTime: { fontSize: 14, fontWeight: "700", color: COLORS.cream },
  shiftDuration: { fontSize: 12, color: COLORS.creamMuted },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typePillText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
