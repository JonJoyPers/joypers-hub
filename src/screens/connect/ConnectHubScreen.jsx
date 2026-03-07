import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../../theme/colors";
import SocialFeedScreen from "../social/SocialFeedScreen";
import ConversationListScreen from "../messages/ConversationListScreen";
import DirectoryScreen from "./DirectoryScreen";

const TABS = ["social", "messages", "directory"];
const TAB_LABELS = { social: "Feed", messages: "Inbox", directory: "Directory" };

export default function ConnectHubScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("social");

  const title = TAB_LABELS[activeTab];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>CONNECT</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Segmented Toggle */}
      <View style={styles.toggleRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.toggleBtn, activeTab === tab && styles.toggleBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.toggleText, activeTab === tab && styles.toggleTextActive]}>
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === "social" ? (
          <SocialFeedScreen embedded />
        ) : activeTab === "messages" ? (
          <ConversationListScreen embedded navigation={navigation} />
        ) : (
          <DirectoryScreen navigation={navigation} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: COLORS.charcoalMid,
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
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: COLORS.teal + "30",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.creamMuted,
  },
  toggleTextActive: {
    color: COLORS.teal,
  },
  content: { flex: 1 },
});
