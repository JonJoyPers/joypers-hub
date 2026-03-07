import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

export function UnreadBadge({ count }) {
  if (!count) return null;
  return (
    <View style={styles.unread}>
      <Text style={styles.unreadText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

export function RoleBadge({ role }) {
  const color = COLORS[role] || COLORS.creamMuted;
  return (
    <View style={[styles.pill, { backgroundColor: color + "25" }]}>
      <Text style={[styles.pillText, { color }]}>
        {(role || "").toUpperCase()}
      </Text>
    </View>
  );
}

export function TypePill({ label, color }) {
  return (
    <View style={[styles.pill, { backgroundColor: (color || COLORS.teal) + "25" }]}>
      <Text style={[styles.pillText, { color: color || COLORS.teal }]}>
        {(label || "").toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  unread: {
    backgroundColor: COLORS.teal,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.charcoal,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
