import React, { useState, useEffect } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import { X, Calendar } from "lucide-react-native";
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateDisplay(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function CreateBulletinModal({ visible, onClose, editingPost }) {
  const user = useAuthStore((s) => s.user);
  const addBulletinPost = useAppStore((s) => s.addBulletinPost);
  const updateBulletinPost = useAppStore((s) => s.updateBulletinPost);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedType, setSelectedType] = useState("announcement");
  const [emoji, setEmoji] = useState("📋");
  const [tagsText, setTagsText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [eventDate, setEventDate] = useState(null);
  const [showEventDatePicker, setShowEventDatePicker] = useState(false);

  const isEditing = !!editingPost;

  // Populate form when editing
  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || "");
      setBody(editingPost.body || "");
      setSelectedType(editingPost.type || "announcement");
      setEmoji(editingPost.emoji || "📋");
      setTagsText(
        (editingPost.tags || [])
          .map((t) => t.replace(/^#/, ""))
          .join(", ")
      );
      setPinned(!!editingPost.pinned);
      if (editingPost.eventDate) {
        const parsed = new Date(editingPost.eventDate);
        setEventDate(!isNaN(parsed.getTime()) ? parsed : null);
      } else {
        setEventDate(null);
      }
    } else {
      resetForm();
    }
  }, [editingPost]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setSelectedType("announcement");
    setEmoji("📋");
    setTagsText("");
    setPinned(false);
    setEventDate(null);
    setShowEventDatePicker(false);
  };

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

    const parsedEventDate = eventDate instanceof Date ? eventDate.toISOString() : null;

    if (isEditing) {
      updateBulletinPost(editingPost.id, {
        title: title.trim(),
        body: body.trim(),
        type: selectedType,
        emoji: emoji || TYPES.find((t) => t.key === selectedType)?.emoji || "📋",
        tags,
        pinned,
        eventDate: parsedEventDate,
      });
    } else {
      addBulletinPost({
        title: title.trim(),
        body: body.trim(),
        type: selectedType,
        emoji: emoji || TYPES.find((t) => t.key === selectedType)?.emoji || "📋",
        tags,
        pinned,
        author: user.name,
        authorRole: user.role,
        authorId: user.id,
        eventDate: parsedEventDate,
      });
    }

    resetForm();
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
            <Text style={styles.eyebrow}>{isEditing ? "EDIT POST" : "NEW POST"}</Text>
            <Text style={styles.headerTitle}>
              {isEditing ? "Edit Bulletin" : "Create Bulletin"}
            </Text>
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
          <View style={styles.dateFieldRow}>
            <TouchableOpacity
              style={[styles.datePickerField, { flex: 1 }]}
              onPress={() => setShowEventDatePicker(!showEventDatePicker)}
              activeOpacity={0.7}
            >
              <Calendar size={16} color={COLORS.teal} />
              <Text style={eventDate ? styles.datePickerText : styles.datePickerPlaceholder}>
                {eventDate ? formatDateDisplay(eventDate) : "Select event date"}
              </Text>
            </TouchableOpacity>
            {eventDate && (
              <TouchableOpacity
                style={styles.dateClearBtn}
                onPress={() => { setEventDate(null); setShowEventDatePicker(false); }}
              >
                <X size={16} color={COLORS.creamMuted} />
              </TouchableOpacity>
            )}
          </View>
          {showEventDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={eventDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(event, selectedDate) => {
                  if (Platform.OS === "android") setShowEventDatePicker(false);
                  if (event.type === "dismissed") return;
                  if (selectedDate) setEventDate(selectedDate);
                }}
                textColor={COLORS.cream}
                accentColor={COLORS.teal}
                themeVariant="dark"
              />
              {Platform.OS === "ios" && (
                <TouchableOpacity style={styles.datePickerDoneBtn} onPress={() => setShowEventDatePicker(false)}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

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

          {/* Publish / Save Button */}
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={handlePublish}
            activeOpacity={0.85}
          >
            <Text style={styles.publishBtnText}>
              {isEditing ? "SAVE CHANGES" : "PUBLISH"}
            </Text>
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
  dateFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  datePickerField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  datePickerText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.cream,
  },
  datePickerPlaceholder: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.creamMuted,
  },
  dateClearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center",
    justifyContent: "center",
  },
  datePickerContainer: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
  },
  datePickerDoneBtn: {
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.charcoalLight,
  },
  datePickerDoneText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.teal,
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
