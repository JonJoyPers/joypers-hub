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
import { useAppStore } from "../../store/appStore";
import { getSupabaseDebugInfo } from "../../services/supabase";

export default function LoginScreen() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const loginError = useAuthStore((s) => s.loginError);
  const clearLoginError = useAuthStore((s) => s.clearLoginError);
  const loading = useAuthStore((s) => s.loading);

  const handleLogin = async () => {
    if (loading) return;
    if (!name.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your name and password.");
      return;
    }
    const success = await loginWithCredentials(name.trim(), password);
    if (!success) {
      const msg = useAuthStore.getState().loginError || "Name or password not recognized.";
      Alert.alert("Login failed", msg);
      clearLoginError();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Logo / Brand */}
        <View style={styles.brand}>
          <Text style={styles.brandName}>JOY-PER'S</Text>
          <Text style={styles.brandSub}>HUB</Text>
          <View style={styles.brandBar} />
          <Text style={styles.brandTagline}>Internal Team Platform</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Jordan Blake"
            placeholderTextColor={COLORS.creamMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={COLORS.creamMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.charcoal} />
            ) : (
              <Text style={styles.loginBtnText}>SIGN IN</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Contact your manager if you need access.
          </Text>

          {/* DEBUG — remove after troubleshooting */}
          <TouchableOpacity
            style={{ marginTop: 20, padding: 10 }}
            onPress={() => {
              const d = getSupabaseDebugInfo();
              Alert.alert(
                "Supabase Debug",
                `URL: ${d.urlFirst20}\nURL type: ${d.urlType}\nKey set: ${d.keySet}\nKey: ${d.keyFirst10}\nClient ready: ${d.clientReady}\nError: ${d.createError || "none"}`
              );
            }}
          >
            <Text style={{ color: COLORS.creamMuted, fontSize: 9, textAlign: "center" }}>
              [DEBUG INFO]
            </Text>
          </TouchableOpacity>

          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={styles.kioskToggle}
              onPress={() => {
                useAppStore.getState().setKioskMode(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.kioskToggleText}>KIOSK MODE</Text>
              <Text style={styles.kioskToggleHint}>iPad Timeclock</Text>
            </TouchableOpacity>
          )}
        </View>
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
    marginBottom: 10,
  },
  brandTagline: {
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
    fontWeight: "500",
  },
  form: {},
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
  loginBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 28,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 2,
  },
  hint: {
    fontSize: 12,
    color: COLORS.creamMuted,
    textAlign: "center",
    marginTop: 20,
  },
  kioskToggle: {
    alignItems: "center",
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    backgroundColor: COLORS.charcoalMid,
  },
  kioskToggleText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.teal,
    letterSpacing: 2,
  },
  kioskToggleHint: {
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  },
});
