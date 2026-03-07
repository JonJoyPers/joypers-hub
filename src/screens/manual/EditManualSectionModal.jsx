import React, { useState, useEffect } from "react";
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
import { useAuthStore } from "../../store/authStore";
import { useManualStore } from "../../store/manualStore";

export default function EditManualSectionModal({ visible, onClose, section }) {
  const user = useAuthStore((s) => s.user);
  const updateSection = useManualStore((s) => s.updateSection);
  const addSection = useManualStore((s) => s.addSection);

  const isEditing = !!section;

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (section) {
      setTitle(section.title);
      setBody(section.body);
    } else {
      setTitle("");
      setBody("");
    }
  }, [section, visible]);

  const handlePublish = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert("Missing fields", "Title and body are required.");
      return;
    }

    if (isEditing) {
      updateSection(section.id, { title: title.trim(), body: body.trim() }, user.id);
    } else {
      addSection({ title: title.trim(), body: body.trim() }, user.id);
    }

    setTitle("");
    setBody("");
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
            <Text style={styles.eyebrow}>
              {isEditing ? "EDIT SECTION" : "NEW SECTION"}
            </Text>
            <Text style={styles.headerTitle}>
              {isEditing ? "Edit Manual" : "Add Section"}
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
          {/* Title */}
          <Text style={styles.label}>TITLE</Text>
          <TextInput
            style={styles.input}
            placeholder="Section title..."
            placeholderTextColor={COLORS.creamMuted}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />

          {/* Body */}
          <Text style={styles.label}>BODY</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="Write the section content..."
            placeholderTextColor={COLORS.creamMuted}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={2000}
          />

          {/* Publish Button */}
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={handlePublish}
            activeOpacity={0.85}
          >
            <Text style={styles.publishBtnText}>
              {isEditing ? "PUBLISH UPDATE" : "PUBLISH SECTION"}
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
    minHeight: 200,
    textAlignVertical: "top",
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
