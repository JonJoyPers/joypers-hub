import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { COLORS } from "../theme/colors";

export default function FAB({ onPress, icon }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
      {icon || <Plus size={28} color={COLORS.charcoal} strokeWidth={3} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
