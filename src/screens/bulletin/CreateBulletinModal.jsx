import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { X } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";

const TYPES = [
  { key: "announcement", label: "Announce", emoji: "📋" },
  { key: "event", label: "Event", emoji: "📅" },
  { key: "promo", label: "Promo", emoji: "🏷️" },
  { key: "recognition", label: "Recognition", emoji: "👏" },
  { key: "birthday", label: "Birthday", emoji: "🎂" },
  { key: "anniversary", label: "Anniversary", emoji: "⭐" },
];

const TYPE_COLORS = {
  birthday: COLORS.rose,
  anniversary: COLORS.amber,
  promo: COLORS.teal,
  event: COLORS.violet,
  announcement: COLORS.creamMuted,
  recognition: COLORS.green,
};

export default function CreateBulletinModal({ visible, onClose }) {
  const user = useAuthStore((s) => s.user);
  const addBulletinPost = useAppStore((s) => s.addBulletinPost);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedType, setSelectedType] = useState("announcement");
  const [emoji, setEmoji] = useState("📋");
  const [tagsText, setTagsText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [eventDate, setEventDate] = useState("");

  const handleTypeSelect = (type) => {
    setSelectedType(type.key);
    setEmoji(type.emoji);
  };

  const handlePublish = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing fields", "Title and body are required.");
      return;
    }
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));

    let parsedEventDate = null;
    if (eventDate.trim()) {
      const parsed = new Date(eventDate.trim());
      if (!isNaN(parsed.getTime())) {
        parsedEventDate = parsed.toISOString();
      }
    }

    addBulletinPost({
      title: title.trim(),
      body: body.trim(),
      type: selectedType,
      emoji: emoji || TYPES.find((t) => t.key === selectedType)?.emoji || "📋",
      tags,
      pinned,
      author: user.name,
      authorRole: user.role,
      eventDate: parsedEventDate,
    });

    // Reset form
    setTitle("");
    setBody("");
    setSelectedType("announcement");
    setEmoji("📋");
    setTagsText("");
    setPinned(false);
    setEventDate("");
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
            <Text style={styles.eyebrow}>NEW POST</Text>
            <Text style={styles.headerTitle}>Create Bulletin</Text>
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
          {/* Type Selector */}
          <Text style={styles.label}>TYPE</Text>
          <View style={styles.typeRow}>
            {TYPES.map((type) => {
              const active = selectedType === type.key;
              const color = TYPE_COLORS[type.key];
              return (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.typePill,
                    { borderColor: color },
                    active && { backgroundColor: color + "30" },
                  ]}
                  onPress={() => handleTypeSelect(type)}
                >
                  <Text
                    style={[
                      styles.typePillText,
                      { color: active ? color : COLORS.creamMuted },
                    ]}
                  >
                    {type.emoji} {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Title */}
          <Text style={styles.label}>TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="Bulletin title..."
            placeholderTextColor={COLORS.creamMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Body */}
          <Text style={styles.label}>BODY</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="Write your announcement..."
            placeholderTextColor={COLORS.creamMuted}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={500}
          />

          {/* Tags */}
          <Text style={styles.label}>TAGS (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. AllStaff, Sales, Event"
            placeholderTextColor={COLORS.creamMuted}
            value={tagsText}
            onChangeText={setTagsText}
          />

          {/* Event Date (optional) */}
          <Text style={styles.label}>EVENT DATE (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2026-04-05 or March 15, 2026"
            placeholderTextColor={COLORS.creamMuted}
            value={eventDate}
            onChangeText={setEventDate}
          />

          {/* Pinned Toggle */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pin to top</Text>
            <Switch
              value={pinned}
              onValueChange={setPinned}
              trackColor={{ false: COLORS.charcoalLight, true: COLORS.teal + "66" }}
              thumbColor={pinned ? COLORS.teal : COLORS.creamMuted}
            />
          </View>

          {/* Publish Button */}
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={handlePublish}
            activeOpacity={0.85}
          >
            <Text style={styles.publishBtnText}>PUBLISH</Text>
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
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  input: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.cream,
  },
  bodyInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.cream,
  },
  publishBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 20,
  },
  publishBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 1.5,
  },
});
