import React, { useState, useEffect } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { supabase, isSupabaseConfigured } from "../../services/supabase";

const ROLE_COLOR = {
  admin: COLORS.admin,
  manager: COLORS.manager,
  employee: COLORS.creamMuted,
};

const ROLES = ["admin", "manager", "employee"];
const DEPARTMENTS = ["Management", "Sales Floor", "Inventory"];

export default function AdminEditUserScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [employee, setEmployee] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthday, setBirthday] = useState("");
  const [role, setRole] = useState("employee");
  const [department, setDepartment] = useState("Sales Floor");
  const [title, setTitle] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [userId]);

  async function fetchEmployee() {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setEmployee(data);
      setName(data.name || "");
      setEmail(data.email || "");
      setBirthday(data.birthday || "");
      setRole(data.role || "employee");
      setDepartment(data.department || "Sales Floor");
      setTitle(data.title || "");
      setIsRemote(data.worker_type === "remote");
      setIsActive(data.is_active);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={COLORS.teal} size="large" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: COLORS.creamMuted, fontSize: 14 }}>User not found.</Text>
      </View>
    );
  }

  const roleColor = ROLE_COLOR[role] || COLORS.creamMuted;
  const initial = (employee.first_name || employee.name || "?").charAt(0);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Invalid Name", "Name cannot be empty.");
      return;
    }

    setSaving(true);
    const firstName = name.trim().split(" ")[0];

    const { error } = await supabase
      .from("employees")
      .update({
        name: name.trim(),
        first_name: firstName,
        email: email.trim(),
        birthday: birthday.trim() || null,
        role,
        department,
        title: title.trim(),
        worker_type: isRemote ? "remote" : "in_store",
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Saved", `${firstName}'s profile has been updated.`);
  };

  const handleArchiveRestore = async () => {
    const action = isActive ? "disable" : "enable";
    const label = isActive ? "Archive" : "Restore";

    Alert.alert(
      `${label} ${employee.name}?`,
      isActive
        ? "This will prevent them from logging in."
        : "This will allow them to log in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: label,
          style: isActive ? "destructive" : "default",
          onPress: async () => {
            setActionLoading(true);
            const { data, error } = await supabase.functions.invoke("manage-employee-auth", {
              body: { employeeId: userId, action },
            });

            setActionLoading(false);

            if (error || data?.error) {
              Alert.alert("Error", data?.error || error?.message || "Action failed");
              return;
            }

            setIsActive(!isActive);
            Alert.alert("Done", `${employee.name} has been ${isActive ? "archived" : "restored"}.`);
          },
        },
      ]
    );
  };

  const handleResetPassword = () => {
    Alert.alert(
      "Reset Password?",
      `This will reset ${employee.name}'s password to the default. They will be required to change it on next login.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            const { data, error } = await supabase.functions.invoke("manage-employee-auth", {
              body: { employeeId: userId, action: "reset-password" },
            });

            setActionLoading(false);

            if (error || data?.error) {
              Alert.alert("Error", data?.error || error?.message || "Reset failed");
              return;
            }

            Alert.alert("Done", "Password has been reset to the default.");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={2} />
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>EDIT STAFF</Text>
          <Text style={styles.headerTitle}>{employee.name}</Text>
        </View>
        {!isActive && (
          <View style={[styles.archivedBadge]}>
            <Text style={styles.archivedBadgeText}>ARCHIVED</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: roleColor + "30", borderColor: roleColor }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>{initial}</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: roleColor + "25" }]}>
              <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </View>
          </View>

          {/* Basic Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BASIC INFO</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput style={styles.fieldInput} value={name} onChangeText={setName} placeholderTextColor={COLORS.creamMuted} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput style={styles.fieldInput} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.creamMuted} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Birthday</Text>
              <TextInput style={styles.fieldInput} value={birthday} onChangeText={setBirthday} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.creamMuted} />
            </View>
          </View>

          {/* Admin Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADMIN FIELDS</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Role</Text>
              <View style={styles.pillRow}>
                {ROLES.map((r) => {
                  const c = ROLE_COLOR[r] || COLORS.creamMuted;
                  const active = role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.pill, active && { backgroundColor: c + "30", borderColor: c }]}
                      onPress={() => setRole(r)}
                    >
                      <Text style={[styles.pillText, active && { color: c }]}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Department</Text>
              <View style={styles.pillRow}>
                {DEPARTMENTS.map((d) => {
                  const active = department === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.pill, active && { backgroundColor: COLORS.teal + "30", borderColor: COLORS.teal }]}
                      onPress={() => setDepartment(d)}
                    >
                      <Text style={[styles.pillText, active && { color: COLORS.teal }]}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput style={styles.fieldInput} value={title} onChangeText={setTitle} placeholderTextColor={COLORS.creamMuted} placeholder="e.g. Sales Manager" />
            </View>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TAGS</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Worker Type</Text>
              <View style={styles.pillRow}>
                <TouchableOpacity
                  style={[styles.pill, !isRemote && { backgroundColor: COLORS.teal + "30", borderColor: COLORS.teal }]}
                  onPress={() => setIsRemote(false)}
                >
                  <Text style={[styles.pillText, !isRemote && { color: COLORS.teal }]}>In-Store</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, isRemote && { backgroundColor: COLORS.teal + "30", borderColor: COLORS.teal }]}
                  onPress={() => setIsRemote(true)}
                >
                  <Text style={[styles.pillText, isRemote && { color: COLORS.teal }]}>Remote</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.tagHelper}>
                Remote workers can clock in/out from the mobile app with GPS tracking. In-store workers must use the kiosk.
              </Text>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.charcoal} />
            ) : (
              <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
            )}
          </TouchableOpacity>

          {/* Auth Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT ACTIONS</Text>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleResetPassword}
              activeOpacity={0.7}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>Reset Password to Default</Text>
              <Text style={styles.actionBtnHint}>
                Resets to the shared default password. Employee must change it on next login.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: isActive ? COLORS.red : COLORS.green }]}
              onPress={handleArchiveRestore}
              activeOpacity={0.7}
              disabled={actionLoading}
            >
              <Text style={[styles.actionBtnText, { color: isActive ? COLORS.red : COLORS.green }]}>
                {isActive ? "Archive Employee" : "Restore Employee"}
              </Text>
              <Text style={styles.actionBtnHint}>
                {isActive
                  ? "Deactivates the account and prevents login."
                  : "Reactivates the account and allows login."}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center", justifyContent: "center",
  },
  eyebrow: { fontSize: 9, fontWeight: "700", color: COLORS.amber, letterSpacing: 2, marginBottom: 2 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: COLORS.cream },
  archivedBadge: {
    marginLeft: "auto",
    backgroundColor: COLORS.red + "25",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  archivedBadgeText: { fontSize: 9, fontWeight: "800", color: COLORS.red, letterSpacing: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 40 },

  avatarSection: { alignItems: "center", gap: 10, paddingVertical: 10 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: "center", justifyContent: "center", borderWidth: 2,
  },
  avatarText: { fontSize: 28, fontWeight: "800" },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },

  section: { gap: 12 },
  sectionTitle: { fontSize: 10, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginBottom: 4 },

  fieldGroup: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: COLORS.creamMuted, letterSpacing: 0.5 },
  fieldInput: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: "600", color: COLORS.cream,
    borderWidth: 1, borderColor: COLORS.charcoalLight,
  },

  pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.charcoalLight,
    backgroundColor: COLORS.charcoalMid,
  },
  pillText: { fontSize: 12, fontWeight: "700", color: COLORS.creamMuted },

  tagHelper: { fontSize: 11, color: COLORS.creamMuted, lineHeight: 16, marginTop: 4 },

  saveBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 16, alignItems: "center",
  },
  saveBtnText: { fontSize: 13, fontWeight: "800", color: COLORS.charcoal, letterSpacing: 1.5 },

  actionBtn: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    padding: 16,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.amber,
  },
  actionBtnHint: {
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 4,
    lineHeight: 16,
  },
});
