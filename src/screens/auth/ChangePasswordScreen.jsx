import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const changePassword = useAuthStore((s) => s.changePassword);
  const logout = useAuthStore((s) => s.logout);

  const handleChange = async () => {
    if (newPassword.length < 8) {
      Alert.alert("Too short", "Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <View style={styles.brand}>
          <Text style={styles.brandName}>JOY-PER'S</Text>
          <Text style={styles.brandSub}>HUB</Text>
          <View style={styles.brandBar} />
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>Change Your Password</Text>
          <Text style={styles.subtext}>
            You must set a new password before continuing.
          </Text>

          <Text style={styles.label}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor={COLORS.creamMuted}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>CONFIRM PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={COLORS.creamMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleChange}
          />

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleChange}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.charcoal} />
            ) : (
              <Text style={styles.submitBtnText}>SET PASSWORD</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutLink}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  brand: { alignItems: "center", marginBottom: 48 },
  brandName: {
    fontSize: 36,
    fontWeight: "900",
    color: COLORS.cream,
    letterSpacing: 4,
  },
  brandSub: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 8,
    marginTop: -4,
  },
  brandBar: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.teal,
    borderRadius: 1,
    marginTop: 12,
  },
  card: {},
  heading: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.cream,
    marginBottom: 6,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: 24,
    lineHeight: 18,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.cream,
    fontWeight: "500",
  },
  submitBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 28,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 2,
  },
  logoutLink: {
    alignItems: "center",
    marginTop: 24,
  },
  logoutText: {
    fontSize: 13,
    color: COLORS.creamMuted,
    fontWeight: "500",
  },
});
