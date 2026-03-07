import React from "react";
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
import { useManualStore } from "../../store/manualStore";
import { MOCK_USERS } from "../../data/mockUsers";

const formatTimestamp = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function ManualAcknowledgmentsScreen({ navigation, route }) {
  const { sectionId } = route.params;
  const insets = useSafeAreaInsets();
  const sections = useManualStore((s) => s.sections);
  const getAcknowledgmentsForSection = useManualStore(
    (s) => s.getAcknowledgmentsForSection
  );

  const section = sections.find((s) => s.id === sectionId);
  const allAcks = getAcknowledgmentsForSection(sectionId);

  // Only show non-admin users in the tracking list
  const nonAdminUsers = MOCK_USERS.filter((u) => u.role !== "admin");

  // Build acknowledged / not-yet lists for the current version
  const acknowledged = [];
  const notYet = [];

  nonAdminUsers.forEach((u) => {
    const ack = allAcks.find(
      (a) =>
        a.userId === u.id && a.sectionVersion === section?.version
    );
    if (ack) {
      acknowledged.push({ user: u, timestamp: ack.timestamp });
    } else {
      notYet.push({ user: u });
    }
  });

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ACKNOWLEDGMENTS</Text>
          <Text style={styles.title} numberOfLines={1}>
            {section?.title || "Section"}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Version info */}
        <Text style={styles.versionInfo}>
          Version {section?.version} · {acknowledged.length} of{" "}
          {nonAdminUsers.length} acknowledged
        </Text>

        {/* Not Yet Acknowledged */}
        <Text style={styles.sectionLabel}>NOT YET ACKNOWLEDGED</Text>
        {notYet.length === 0 ? (
          <Text style={styles.emptyText}>Everyone has acknowledged!</Text>
        ) : (
          notYet.map(({ user }) => (
            <View key={user.id} style={styles.userRow}>
              <View style={[styles.dot, styles.dotRed]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user.firstName || user.name}</Text>
                <Text style={styles.userRole}>{user.title}</Text>
              </View>
            </View>
          ))
        )}

        {/* Acknowledged */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>ACKNOWLEDGED</Text>
        {acknowledged.length === 0 ? (
          <Text style={styles.emptyText}>No acknowledgments yet.</Text>
        ) : (
          acknowledged.map(({ user, timestamp }) => (
            <View key={user.id} style={styles.userRow}>
              <View style={[styles.dot, styles.dotGreen]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{user.firstName || user.name}</Text>
                <Text style={styles.userRole}>{user.title}</Text>
              </View>
              <Text style={styles.timestamp}>{formatTimestamp(timestamp)}</Text>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 2,
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.cream,
    letterSpacing: -0.5,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12 },

  versionInfo: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.creamMuted,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 2,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.creamMuted,
    fontStyle: "italic",
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: { backgroundColor: COLORS.green },
  dotRed: { backgroundColor: COLORS.red },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.cream,
  },
  userRole: {
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 1,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.creamMuted,
  },
});
