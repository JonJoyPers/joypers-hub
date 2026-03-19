import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Clock, LogIn, LogOut, Coffee, Utensils, MapPin, AlertTriangle } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useTimeclockStore } from "../../store/timeclockStore";
import { useLocation } from "../../hooks/useLocation";
import { getUserById } from "../../data/mockUsers";

function formatTime(isoString) {
  if (!isoString) return "--:--";
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function punchLabel(type) {
  switch (type) {
    case "clock_in": return "Clocked In";
    case "clock_out": return "Clocked Out";
    case "break_start": return "Break Started";
    case "break_end": return "Break Ended";
    case "lunch_start": return "Lunch Started";
    case "lunch_end": return "Lunch Ended";
    default: return type;
  }
}

function punchColor(type) {
  switch (type) {
    case "clock_in": return COLORS.green;
    case "clock_out": return COLORS.red;
    case "break_start": return COLORS.amber;
    case "break_end": return COLORS.teal;
    case "lunch_start": return COLORS.violet;
    case "lunch_end": return COLORS.teal;
    default: return COLORS.creamMuted;
  }
}

export default function TimeclockScreen({ embedded = false }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { clockIn, clockOut, startBreak, endBreak, startLunch, endLunch, currentStatus, getPunchesForUser, getTodayHours } =
    useTimeclockStore();
  const { permissionGranted, getLocation } = useLocation();

  const fetchPunches = useTimeclockStore((s) => s.fetchPunches);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchPunches(user?.id);
  }, [user?.id]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Re-read user from mock data to get latest tags
  const liveUser = getUserById(user.id) || user;
  const isRemote = liveUser.tags?.includes("Remote");

  // Gate: non-Remote users see "Kiosk Required" message
  if (!isRemote) {
    return (
      <View style={styles.root}>
        {!embedded && (
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View>
              <Text style={styles.eyebrow}>TIME CLOCK</Text>
              <Text style={styles.title}>
                {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </Text>
              <Text style={styles.dateStr}>
                {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
            </View>
          </View>
        )}
        <View style={styles.kioskGate}>
          <MapPin size={48} color={COLORS.creamMuted} strokeWidth={1.5} />
          <Text style={styles.kioskTitle}>Kiosk Required</Text>
          <Text style={styles.kioskSubtitle}>
            Mobile clock-in is only available for Remote workers.{"\n"}
            Please use the in-store kiosk to clock in and out.
          </Text>
        </View>
      </View>
    );
  }

  const status = currentStatus(user.id);
  const punches = getPunchesForUser(user.id).slice(0, 20);
  const todayHours = getTodayHours(user.id);

  const handleAction = (action) => {
    const labels = {
      clockIn: "Clock In",
      clockOut: "Clock Out",
      startBreak: "Start Break",
      endBreak: "End Break",
      startLunch: "Start Lunch",
      endLunch: "End Lunch",
    };
    Alert.alert(
      labels[action],
      `Confirm: ${labels[action]} at ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const loc = await getLocation();
            if (!loc) {
              Alert.alert("Location Required", "Unable to capture GPS location. Punch was not recorded.");
              return;
            }
            if (action === "clockIn") clockIn(user.id, null, loc);
            else if (action === "clockOut") clockOut(user.id, loc);
            else if (action === "startBreak") startBreak(user.id, loc);
            else if (action === "endBreak") endBreak(user.id, loc);
            else if (action === "startLunch") startLunch(user.id, loc);
            else if (action === "endLunch") endLunch(user.id, loc);
          },
        },
      ]
    );
  };

  const statusColor =
    status === "clocked_in" ? COLORS.green
    : status === "on_break" ? COLORS.amber
    : status === "on_lunch" ? COLORS.violet
    : COLORS.creamMuted;

  const statusLabel =
    status === "clocked_in" ? "CLOCKED IN"
    : status === "on_break" ? "ON BREAK"
    : status === "on_lunch" ? "ON LUNCH"
    : "CLOCKED OUT";

  return (
    <View style={styles.root}>
      {/* Header — hidden when embedded in WorkHubScreen */}
      {!embedded && (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View>
            <Text style={styles.eyebrow}>TIME CLOCK</Text>
            <Text style={styles.title}>
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </Text>
            <Text style={styles.dateStr}>
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Permission Banner */}
        {!permissionGranted && (
          <View style={styles.permBanner}>
            <AlertTriangle size={16} color={COLORS.charcoal} strokeWidth={2.5} />
            <Text style={styles.permBannerText}>Location permission required for clock-in</Text>
          </View>
        )}

        {/* Status Card */}
        <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.employeeName}>{user.name}</Text>
          <Text style={styles.employeeTitle}>{user.title} · {user.department}</Text>
          <Text style={styles.todayHours}>Today: {todayHours}h</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsGrid}>
          {status === "clocked_out" && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionGreen]} onPress={() => handleAction("clockIn")}>
              <LogIn size={24} color={COLORS.charcoal} strokeWidth={2.5} />
              <Text style={styles.actionBtnText}>CLOCK IN</Text>
            </TouchableOpacity>
          )}
          {status === "clocked_in" && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionAmber]}
                onPress={() => {
                  Alert.alert(
                    "Break Type",
                    "Is this a paid Break or unpaid Lunch?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Break (Paid)", onPress: () => handleAction("startBreak") },
                      { text: "Lunch (Unpaid)", onPress: () => handleAction("startLunch") },
                    ]
                  );
                }}
              >
                <Coffee size={22} color={COLORS.charcoal} strokeWidth={2.5} />
                <Text style={styles.actionBtnText}>BREAK</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionRed]} onPress={() => handleAction("clockOut")}>
                <LogOut size={22} color={COLORS.cream} strokeWidth={2.5} />
                <Text style={[styles.actionBtnText, { color: COLORS.cream }]}>CLOCK OUT</Text>
              </TouchableOpacity>
            </>
          )}
          {status === "on_break" && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionGreen]} onPress={() => handleAction("endBreak")}>
              <LogIn size={24} color={COLORS.charcoal} strokeWidth={2.5} />
              <Text style={styles.actionBtnText}>END BREAK</Text>
            </TouchableOpacity>
          )}
          {status === "on_lunch" && (
            <TouchableOpacity style={[styles.actionBtn, styles.actionGreen]} onPress={() => handleAction("endLunch")}>
              <Utensils size={22} color={COLORS.charcoal} strokeWidth={2.5} />
              <Text style={styles.actionBtnText}>END LUNCH</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Punches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RECENT PUNCHES</Text>
          {punches.length === 0 ? (
            <Text style={styles.emptyText}>No punches recorded yet.</Text>
          ) : (
            punches.map((p) => (
              <View key={p.id} style={styles.punchRow}>
                <View style={[styles.punchDot, { backgroundColor: punchColor(p.type) }]} />
                <View style={styles.punchInfo}>
                  <Text style={styles.punchLabel}>{punchLabel(p.type)}</Text>
                  <View style={styles.punchMeta}>
                    <Text style={styles.punchDate}>{formatDate(p.timestamp)}</Text>
                    {p.location && (
                      <View style={styles.punchLocation}>
                        <MapPin size={10} color={COLORS.teal} strokeWidth={2.5} />
                        <Text style={styles.punchLocationText}>
                          {(p.location.latitude ?? p.location.y ?? 0).toFixed(4)}, {(p.location.longitude ?? p.location.x ?? 0).toFixed(4)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.punchTime}>{formatTime(p.timestamp)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
  },
  eyebrow: { fontSize: 9, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginBottom: 2 },
  title: { fontSize: 32, fontWeight: "800", color: COLORS.cream, letterSpacing: -0.5 },
  dateStr: { fontSize: 12, color: COLORS.creamMuted, fontWeight: "500", marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 40 },

  // Kiosk gate
  kioskGate: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12,
  },
  kioskTitle: {
    fontSize: 20, fontWeight: "800", color: COLORS.cream, marginTop: 4,
  },
  kioskSubtitle: {
    fontSize: 13, color: COLORS.creamMuted, textAlign: "center", lineHeight: 20,
  },

  // Permission banner
  permBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.amber, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  permBannerText: {
    fontSize: 12, fontWeight: "700", color: COLORS.charcoal, flex: 1,
  },

  statusCard: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 16, padding: 20,
    borderLeftWidth: 4,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  employeeName: { fontSize: 22, fontWeight: "800", color: COLORS.cream, marginBottom: 2 },
  employeeTitle: { fontSize: 12, color: COLORS.creamMuted, fontWeight: "500" },
  todayHours: { fontSize: 13, color: COLORS.teal, fontWeight: "700", marginTop: 10 },

  actionsGrid: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 18, borderRadius: 14,
  },
  actionGreen: { backgroundColor: COLORS.green },
  actionAmber: { backgroundColor: COLORS.amber },
  actionRed: { backgroundColor: COLORS.red },
  actionBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.charcoal, letterSpacing: 1.5 },

  section: {},
  sectionTitle: { fontSize: 10, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginBottom: 12 },
  emptyText: { color: COLORS.creamMuted, fontSize: 13 },
  punchRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.charcoalMid,
  },
  punchDot: { width: 8, height: 8, borderRadius: 4 },
  punchInfo: { flex: 1 },
  punchLabel: { fontSize: 13, fontWeight: "600", color: COLORS.cream },
  punchMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 1 },
  punchDate: { fontSize: 11, color: COLORS.creamMuted },
  punchLocation: { flexDirection: "row", alignItems: "center", gap: 3 },
  punchLocationText: { fontSize: 10, color: COLORS.teal, fontWeight: "600" },
  punchTime: { fontSize: 13, fontWeight: "700", color: COLORS.cream },
});
