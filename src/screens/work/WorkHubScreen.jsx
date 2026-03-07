import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../theme/colors";
import TimeclockScreen from "../timeclock/TimeclockScreen";
import ScheduleScreen from "../schedule/ScheduleScreen";
import LeaveScreen from "../leave/LeaveScreen";

const TABS = ["timeclock", "schedule", "leave"];
const TAB_LABELS = { timeclock: "Time Clock", schedule: "Schedule", leave: "Leave" };

export default function WorkHubScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("timeclock");

  const title = TAB_LABELS[activeTab];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>WORK</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Segmented Toggle */}
      <View style={styles.toggleRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.toggleBtn, activeTab === tab && styles.toggleBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.toggleText, activeTab === tab && styles.toggleTextActive]}>
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "timeclock" ? (
          <TimeclockScreen embedded />
        ) : activeTab === "schedule" ? (
          <ScheduleScreen embedded navigation={navigation} />
        ) : (
          <LeaveScreen embedded />
        )}
      </View>
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
  content: { flex: 1 },
});
