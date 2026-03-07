import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

const SIZES = {
  sm: { container: 22, text: 10, border: 1 },
  md: { container: 40, text: 16, border: 1.5 },
  lg: { container: 48, text: 18, border: 1.5 },
  xl: { container: 80, text: 32, border: 2 },
};

export default function Avatar({ name, uri, size = "md", role }) {
  const s = SIZES[size] || SIZES.md;
  const roleColor = COLORS[role] || COLORS.creamMuted;
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const containerStyle = {
    width: s.container,
    height: s.container,
    borderRadius: s.container / 2,
    borderWidth: s.border,
    borderColor: roleColor,
    backgroundColor: roleColor + "30",
    alignItems: "center",
    justifyContent: "center",
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[containerStyle, { borderColor: roleColor }]}
      />
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={{ fontSize: s.text, fontWeight: "800", color: roleColor }}>
        {initials}
      </Text>
    </View>
  );
}
