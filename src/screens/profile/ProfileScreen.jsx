import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Eye, EyeOff, Shield, LogOut, FileText } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useManualStore } from "../../store/manualStore";

const ROLE_COLOR = {
  admin: COLORS.admin,
  manager: COLORS.manager,
  employee: COLORS.creamMuted,
};

export default function ProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateUser = useAuthStore((s) => s.updateUser);
  const getUnacknowledged = useManualStore((s) => s.getUnacknowledged);

  const insets = useSafeAreaInsets();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [pin, setPin] = useState(user?.pin || "");
  const [password, setPassword] = useState(user?.password || "");
  const [birthday, setBirthday] = useState(user?.birthday || "");
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!user) return null;

  const roleColor = ROLE_COLOR[user.role] || COLORS.creamMuted;
  const initial = user.firstName?.charAt(0) || user.name?.charAt(0) || "?";

  const handleSave = () => {
    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      Alert.alert("Invalid PIN", "PIN must be exactly 4 digits.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Invalid Name", "Name cannot be empty.");
      return;
    }

    updateUser({
      name: name.trim(),
      email: email.trim(),
      pin,
      password,
      birthday: birthday.trim(),
    });
    Alert.alert("Saved", "Your profile has been updated.");
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>PROFILE</Text>
        <Text style={styles.title}>{user.firstName || user.name}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: roleColor + "30", borderColor: roleColor }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>{initial}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "25" }]}>
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
          </View>

          {/* Editable Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDITABLE INFO</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholderTextColor={COLORS.creamMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.creamMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PIN Code</Text>
              <View style={styles.maskedRow}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  value={pin}
                  onChangeText={(t) => setPin(t.replace(/[^0-9]/g, "").slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry={!showPin}
                  placeholderTextColor={COLORS.creamMuted}
                />
                <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeBtn}>
                  {showPin ? (
                    <EyeOff size={18} color={COLORS.creamMuted} strokeWidth={2} />
                  ) : (
                    <Eye size={18} color={COLORS.creamMuted} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.maskedRow}>
                <TextInput
                  style={[styles.fieldInput, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={COLORS.creamMuted}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? (
                    <EyeOff size={18} color={COLORS.creamMuted} strokeWidth={2} />
                  ) : (
                    <Eye size={18} color={COLORS.creamMuted} strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Birthday</Text>
              <TextInput
                style={styles.fieldInput}
                value={birthday}
                onChangeText={setBirthday}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.creamMuted}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
          </TouchableOpacity>

          {/* Read-only Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WORK INFO</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{user.department}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Title</Text>
              <Text style={styles.infoValue}>{user.title}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={[styles.infoValue, { color: roleColor }]}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hire Date</Text>
              <Text style={styles.infoValue}>{user.hireDate || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Anniversary</Text>
              <Text style={styles.infoValue}>{user.anniversary || "—"}</Text>
            </View>
          </View>

          {/* Store Manual */}
          {(() => {
            const unacked = getUnacknowledged(user.id);
            return (
              <TouchableOpacity
                style={styles.manualBtn}
                onPress={() => navigation.navigate("StoreManual")}
                activeOpacity={0.85}
              >
                <FileText size={18} color={COLORS.teal} strokeWidth={2} />
                <Text style={styles.manualBtnText}>STORE MANUAL</Text>
                {unacked.length > 0 && (
                  <View style={styles.manualBadge}>
                    <Text style={styles.manualBadgeText}>{unacked.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })()}

          {/* Admin Section */}
          {user.role === "admin" && (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => navigation.navigate("AdminPanel")}
              activeOpacity={0.85}
            >
              <Shield size={18} color={COLORS.amber} strokeWidth={2} />
              <Text style={styles.adminBtnText}>ADMIN PANEL</Text>
            </TouchableOpacity>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <LogOut size={18} color={COLORS.red} strokeWidth={2} />
            <Text style={styles.logoutBtnText}>LOG OUT</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
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
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: "center", gap: 10, paddingVertical: 10 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarText: { fontSize: 32, fontWeight: "800" },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },

  // Sections
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 2,
    marginBottom: 4,
  },

  // Editable Fields
  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: COLORS.creamMuted, letterSpacing: 0.5 },
  fieldInput: {
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
  maskedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.charcoalMid,
    alignItems: "center",
    justifyContent: "center",
  },

  // Save
  saveBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 1.5,
  },

  // Read-only Info
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalMid,
  },
  infoLabel: { fontSize: 13, fontWeight: "600", color: COLORS.creamMuted },
  infoValue: { fontSize: 13, fontWeight: "700", color: COLORS.cream },

  // Store Manual
  manualBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.teal + "20",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.teal + "40",
  },
  manualBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.teal,
    letterSpacing: 1.5,
  },
  manualBadge: {
    backgroundColor: COLORS.amber,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  manualBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.charcoal,
  },

  // Admin
  adminBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.amber + "20",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.amber + "40",
  },
  adminBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.amber,
    letterSpacing: 1.5,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.red + "15",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.red + "30",
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.red,
    letterSpacing: 1.5,
  },
});
