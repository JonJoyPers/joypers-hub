import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { X } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useScheduleStore } from "../../store/scheduleStore";
import { MOCK_USERS } from "../../data/mockUsers";

const ROLE_COLOR = {
  admin: COLORS.amber,
  manager: COLORS.tealLight,
  employee: COLORS.creamMuted,
};

const SHIFT_TYPES = [
  { key: "opening", label: "Opening", color: COLORS.green },
  { key: "mid", label: "Mid", color: COLORS.teal },
  { key: "closing", label: "Closing", color: COLORS.violet },
  { key: "inventory", label: "Inventory", color: COLORS.amber },
  { key: "part-time", label: "Part-Time", color: COLORS.creamMuted },
];

function getNext14Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return days;
}

export default function CreateShiftModal({ visible, onClose }) {
  const addShift = useScheduleStore((s) => s.addShift);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedType, setSelectedType] = useState("opening");

  const days = useMemo(() => getNext14Days(), [visible]);

  const handleAssign = () => {
    if (!selectedUser) {
      Alert.alert("Missing", "Please select an employee.");
      return;
    }
    if (!selectedDate) {
      Alert.alert("Missing", "Please select a date.");
      return;
    }
    if (!startTime.trim() || !endTime.trim()) {
      Alert.alert("Missing", "Please enter start and end times.");
      return;
    }
    // Validate time format HH:MM
    const timeRegex = /^\d{1,2}:\d{2}$/;
    if (!timeRegex.test(startTime.trim()) || !timeRegex.test(endTime.trim())) {
      Alert.alert("Invalid time", "Use HH:MM format (e.g. 09:00, 17:30).");
      return;
    }

    addShift({
      userId: selectedUser.id,
      date: selectedDate,
      startTime: startTime.trim().padStart(5, "0"),
      endTime: endTime.trim().padStart(5, "0"),
      type: selectedType,
    });

    // Reset
    setSelectedUser(null);
    setSelectedDate(null);
    setStartTime("");
    setEndTime("");
    setSelectedType("opening");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>NEW SHIFT</Text>
            <Text style={styles.headerTitle}>Assign Shift</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={22} color={COLORS.creamMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Employee Selector */}
          <Text style={styles.label}>EMPLOYEE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.userRow}
          >
            {MOCK_USERS.map((u) => {
              const active = selectedUser?.id === u.id;
              const roleColor = ROLE_COLOR[u.role] || COLORS.creamMuted;
              return (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.userChip,
                    active && { backgroundColor: roleColor + "30", borderColor: roleColor },
                  ]}
                  onPress={() => setSelectedUser(u)}
                >
                  <View
                    style={[
                      styles.userChipAvatar,
                      { backgroundColor: roleColor + "30", borderColor: roleColor },
                    ]}
                  >
                    <Text style={[styles.userChipInitial, { color: roleColor }]}>
                      {u.firstName.charAt(0)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.userChipName,
                      active && { color: COLORS.cream },
                    ]}
                    numberOfLines={1}
                  >
                    {u.firstName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Date Selector */}
          <Text style={styles.label}>DATE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateRow}
          >
            {days.map((d) => {
              const active = selectedDate === d.dateStr;
              return (
                <TouchableOpacity
                  key={d.dateStr}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setSelectedDate(d.dateStr)}
                >
                  <Text
                    style={[
                      styles.dateChipDay,
                      active && styles.dateChipTextActive,
                    ]}
                  >
                    {d.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dateChipNum,
                      active && styles.dateChipTextActive,
                    ]}
                  >
                    {d.dayNum}
                  </Text>
                  <Text
                    style={[
                      styles.dateChipMonth,
                      active && styles.dateChipTextActive,
                    ]}
                  >
                    {d.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Inputs */}
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.label}>START TIME</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                placeholderTextColor={COLORS.creamMuted}
                value={startTime}
                onChangeText={setStartTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.label}>END TIME</Text>
              <TextInput
                style={styles.input}
                placeholder="17:00"
                placeholderTextColor={COLORS.creamMuted}
                value={endTime}
                onChangeText={setEndTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
          </View>

          {/* Type Selector */}
          <Text style={styles.label}>SHIFT TYPE</Text>
          <View style={styles.typeRow}>
            {SHIFT_TYPES.map((type) => {
              const active = selectedType === type.key;
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typePill,
                    { borderColor: type.color },
                    active && { backgroundColor: type.color + "30" },
                  ]}
                  onPress={() => setSelectedType(type.key)}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      { color: active ? type.color : COLORS.creamMuted },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Assign Button */}
          <TouchableOpacity
            style={styles.assignBtn}
            onPress={handleAssign}
            activeOpacity={0.85}
          >
            <Text style={styles.assignBtnText}>ASSIGN SHIFT</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.cream,
    letterSpacing: -0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 8 },

  label: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.teal,
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 4,
  },

  // User Selector
  userRow: { gap: 10, paddingVertical: 4 },
  userChip: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    minWidth: 64,
  },
  userChipAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  userChipInitial: { fontSize: 14, fontWeight: "800" },
  userChipName: { fontSize: 10, fontWeight: "700", color: COLORS.creamMuted },

  // Date Selector
  dateRow: { gap: 8, paddingVertical: 4 },
  dateChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    minWidth: 52,
  },
  dateChipActive: {
    backgroundColor: COLORS.teal + "30",
    borderColor: COLORS.teal,
  },
  dateChipDay: { fontSize: 10, fontWeight: "700", color: COLORS.creamMuted },
  dateChipNum: { fontSize: 18, fontWeight: "800", color: COLORS.cream, marginVertical: 2 },
  dateChipMonth: { fontSize: 9, fontWeight: "600", color: COLORS.creamMuted },
  dateChipTextActive: { color: COLORS.teal },

  // Time
  timeRow: { flexDirection: "row", gap: 12 },
  timeField: { flex: 1 },
  input: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.cream,
    textAlign: "center",
  },

  // Type
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typePillText: { fontSize: 12, fontWeight: "700" },

  // Assign
  assignBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 20,
  },
  assignBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 1.5,
  },
});
