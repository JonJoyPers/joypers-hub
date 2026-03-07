import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

const VARIANTS = {
  primary: {
    bg: COLORS.teal,
    text: COLORS.charcoal,
  },
  secondary: {
    bg: COLORS.teal + "20",
    text: COLORS.teal,
    border: COLORS.teal + "40",
  },
  danger: {
    bg: COLORS.red,
    text: "#fff",
  },
  success: {
    bg: COLORS.green,
    text: COLORS.charcoal,
  },
  warning: {
    bg: COLORS.amber,
    text: COLORS.charcoal,
  },
  ghost: {
    bg: COLORS.charcoalLight,
    text: COLORS.creamMuted,
  },
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
  style,
  size = "md",
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const py = size === "sm" ? 10 : size === "lg" ? 18 : 14;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.btn,
        {
          backgroundColor: v.bg,
          paddingVertical: py,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border || "transparent",
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <>
          {icon || null}
          <Text style={[styles.label, { color: v.text }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
});
