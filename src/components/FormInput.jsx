import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { COLORS } from "../theme/colors";

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  editable = true,
  secureTextEntry,
  keyboardType,
  style,
}) {
  return (
    <View style={styles.group}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.creamMuted + "60"}
        multiline={multiline}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        style={[
          styles.input,
          multiline && { minHeight: 80, textAlignVertical: "top" },
          !editable && { opacity: 0.5 },
          style,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.cream,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
  },
});
