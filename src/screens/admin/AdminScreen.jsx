import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, ChevronRight } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useTimeclockStore } from "../../store/timeclockStore";
import { supabase, isSupabaseConfigured } from "../../services/supabase";

const ROLE_COLOR = {
  admin: COLORS.admin,
  manager: COLORS.manager,
  employee: COLORS.creamMuted,
};

export default function AdminScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { currentStatus, getTodayHours } = useTimeclockStore();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("employees")
      .select("id, name, first_name, email, role, department, title, worker_type, is_active")
      .order("name");

    setEmployees(data || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [fetchEmployees])
  );

  if (!user || !["admin", "manager"].includes(user.role)) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ShieldCheck size={48} color={COLORS.charcoalLight} strokeWidth={1.5} />
        <Text style={{ color: COLORS.creamMuted, marginTop: 16, fontSize: 14 }}>Admin/Manager access only.</Text>
      </View>
    );
  }

  const activeEmployees = employees.filter((e) => e.is_active);

  const clocked = activeEmployees.filter((u) => {
    const s = currentStatus(u.id);
    return s === "clocked_in" || s === "on_break";
  });

  const clockedOut = activeEmployees.filter((u) => currentStatus(u.id) === "clocked_out");

  const stats = [
    { label: "Total Staff", value: activeEmployees.length, color: COLORS.teal },
    { label: "On Clock", value: clocked.length, color: COLORS.green },
    { label: "Off Clock", value: clockedOut.length, color: COLORS.creamMuted },
    { label: "On Break", value: activeEmployees.filter((u) => currentStatus(u.id) === "on_break").length, color: COLORS.amber },
  ];

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={COLORS.teal} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>ADMIN</Text>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={[styles.statCard, { borderTopColor: s.color }]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Active Staff */}
        <Text style={styles.sectionLabel}>CURRENTLY ON CLOCK</Text>
        {clocked.length === 0 ? (
          <Text style={styles.emptyText}>No staff currently clocked in.</Text>
        ) : (
          clocked.map((u) => {
            const status = currentStatus(u.id);
            const hours = getTodayHours(u.id);
            const statusColor = status === "on_break" ? COLORS.amber : COLORS.green;
            const initial = (u.first_name || u.name || "?").charAt(0);
            return (
              <TouchableOpacity
                key={u.id}
                style={styles.staffRow}
                onPress={() => navigation.navigate("AdminEditUser", { userId: u.id })}
                activeOpacity={0.7}
              >
                <View style={[styles.staffAvatar, { borderColor: ROLE_COLOR[u.role] }]}>
                  <Text style={[styles.staffAvatarText, { color: ROLE_COLOR[u.role] }]}>
                    {initial}
                  </Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{u.name}</Text>
                  <Text style={styles.staffTitle}>{u.title}</Text>
                </View>
                <View style={styles.staffStatus}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {status === "on_break" ? "ON BREAK" : "IN"}
                  </Text>
                  <Text style={styles.hoursText}>{hours}h today</Text>
                </View>
                <ChevronRight size={16} color={COLORS.creamMuted} strokeWidth={2} />
              </TouchableOpacity>
            );
          })
        )}

        {/* Off Clock */}
        <Text style={styles.sectionLabel}>NOT CLOCKED IN</Text>
        {clockedOut.map((u) => {
          const initial = (u.first_name || u.name || "?").charAt(0);
          return (
            <TouchableOpacity
              key={u.id}
              style={[styles.staffRow, { opacity: 0.6 }]}
              onPress={() => navigation.navigate("AdminEditUser", { userId: u.id })}
              activeOpacity={0.7}
            >
              <View style={[styles.staffAvatar, { borderColor: COLORS.charcoalLight }]}>
                <Text style={[styles.staffAvatarText, { color: COLORS.creamMuted }]}>
                  {initial}
                </Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{u.name}</Text>
                <Text style={styles.staffTitle}>{u.title}</Text>
              </View>
              <Text style={styles.offText}>Off</Text>
              <ChevronRight size={16} color={COLORS.creamMuted} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}

        {/* Manage Staff */}
        <Text style={styles.sectionLabel}>MANAGE STAFF</Text>
        {employees.map((u) => {
          const initial = (u.first_name || u.name || "?").charAt(0);
          return (
            <TouchableOpacity
              key={u.id}
              style={[styles.staffRow, !u.is_active && { opacity: 0.4 }]}
              onPress={() => navigation.navigate("AdminEditUser", { userId: u.id })}
              activeOpacity={0.7}
            >
              <View style={[styles.staffAvatar, { borderColor: ROLE_COLOR[u.role] }]}>
                <Text style={[styles.staffAvatarText, { color: ROLE_COLOR[u.role] }]}>
                  {initial}
                </Text>
              </View>
              <View style={styles.staffInfo}>
                <View style={styles.staffNameRow}>
                  <Text style={styles.staffName}>{u.name}</Text>
                  {u.worker_type === "remote" && (
                    <View style={styles.remoteBadge}>
                      <Text style={styles.remoteBadgeText}>REMOTE</Text>
                    </View>
                  )}
                  {!u.is_active && (
                    <View style={[styles.remoteBadge, { backgroundColor: COLORS.red + "25" }]}>
                      <Text style={[styles.remoteBadgeText, { color: COLORS.red }]}>ARCHIVED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.staffTitle}>{u.title} · {u.department}</Text>
              </View>
              <ChevronRight size={16} color={COLORS.creamMuted} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1, borderBottomColor: COLORS.charcoalLight,
  },
  eyebrow: { fontSize: 9, fontWeight: "700", color: COLORS.amber, letterSpacing: 2, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.cream, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginTop: 8 },
  emptyText: { fontSize: 13, color: COLORS.creamMuted },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    flex: 1, minWidth: "45%", backgroundColor: COLORS.charcoalMid,
    borderRadius: 12, padding: 16, borderTopWidth: 3, alignItems: "center",
  },
  statValue: { fontSize: 32, fontWeight: "900" },
  statLabel: { fontSize: 10, color: COLORS.creamMuted, fontWeight: "600", letterSpacing: 0.5, marginTop: 2 },

  staffRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.charcoalMid,
  },
  staffAvatar: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.charcoalMid,
  },
  staffAvatarText: { fontSize: 16, fontWeight: "800" },
  staffInfo: { flex: 1 },
  staffNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  staffName: { fontSize: 14, fontWeight: "700", color: COLORS.cream },
  remoteBadge: {
    backgroundColor: COLORS.teal + "25",
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  remoteBadgeText: { fontSize: 8, fontWeight: "800", color: COLORS.teal, letterSpacing: 1 },
  staffTitle: { fontSize: 11, color: COLORS.creamMuted, marginTop: 1 },
  staffStatus: { alignItems: "flex-end", gap: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  hoursText: { fontSize: 11, color: COLORS.creamMuted },
  offText: { fontSize: 11, color: COLORS.creamMuted, fontWeight: "600" },
});
