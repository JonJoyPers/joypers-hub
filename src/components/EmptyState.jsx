import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

export default function EmptyState({ icon, title, subtitle }) {
  return (
    <View style={styles.container}>
      {icon || null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.creamMuted,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: "center",
  },
});
