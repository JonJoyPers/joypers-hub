import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

export default function Card({ children, accentColor, style }) {
  return (
    <View
      style={[
        styles.card,
        accentColor && { borderLeftWidth: 4, borderLeftColor: accentColor },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
});
