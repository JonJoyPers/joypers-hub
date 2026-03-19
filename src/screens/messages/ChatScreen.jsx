import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Send } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useMessageStore } from "../../store/messageStore";
import { getUserById } from "../../data/mockUsers";

const ROLE_COLOR = {
  admin: COLORS.admin,
  manager: COLORS.manager,
  employee: COLORS.creamMuted,
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ChatScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { conversationId, otherUserId } = route.params;
  const user = useAuthStore((s) => s.user);
  const getMessages = useMessageStore((s) => s.getMessages);
  const fetchMessages = useMessageStore((s) => s.fetchMessages);
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const markConversationRead = useMessageStore((s) => s.markConversationRead);
  // Subscribe to messages array to trigger re-render on new messages
  const _messages = useMessageStore((s) => s.messages);

  const participantProfiles = useMessageStore((s) => s.participantProfiles);
  const messages = getMessages(conversationId);
  const otherUser = getUserById(otherUserId) || participantProfiles[otherUserId];
  const roleColor = ROLE_COLOR[otherUser?.role] || COLORS.creamMuted;

  const [text, setText] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchMessages(conversationId);
    markConversationRead(conversationId, user.id);
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: false });
    }, 100);
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(conversationId, user.id, trimmed);
    setText("");
    setTimeout(() => {
      scrollRef.current?.scrollToEnd?.({ animated: true });
    }, 150);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={COLORS.cream} strokeWidth={2} />
        </TouchableOpacity>
        <View
          style={[
            styles.headerAvatar,
            { backgroundColor: roleColor + "30", borderColor: roleColor },
          ]}
        >
          <Text style={[styles.headerAvatarText, { color: roleColor }]}>
            {otherUser?.firstName?.charAt(0) || "?"}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {otherUser?.name || "Unknown"}
          </Text>
          <Text style={[styles.headerRole, { color: roleColor }]}>
            {otherUser?.title || ""}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesScroll}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd?.({ animated: false })
        }
      >
        {messages.length === 0 && (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Start the conversation with {otherUser?.firstName || "them"}
            </Text>
          </View>
        )}
        {messages.map((msg, idx) => {
          const isMine = msg.senderId === user.id;
          const prevMsg = messages[idx - 1];
          const sameSender = prevMsg && prevMsg.senderId === msg.senderId;

          return (
            <View
              key={msg.id}
              style={[
                styles.bubbleWrap,
                isMine ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
                sameSender && { marginTop: 2 },
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isMine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
              {!sameSender && (
                <Text
                  style={[
                    styles.bubbleTime,
                    isMine && styles.bubbleTimeRight,
                  ]}
                >
                  {timeAgo(msg.timestamp)}
                </Text>
              )}
            </View>
          );
        })}
        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.creamMuted}
          value={text}
          onChangeText={setText}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Send size={20} color={COLORS.charcoal} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  headerAvatarText: { fontSize: 14, fontWeight: "800" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  headerRole: { fontSize: 11, fontWeight: "600", marginTop: 1 },

  // Messages
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, gap: 6 },

  emptyChat: { alignItems: "center", paddingTop: 60 },
  emptyChatText: { fontSize: 14, color: COLORS.creamMuted },

  bubbleWrap: { maxWidth: "80%", gap: 2 },
  bubbleWrapLeft: { alignSelf: "flex-start" },
  bubbleWrapRight: { alignSelf: "flex-end" },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  bubbleMine: {
    backgroundColor: COLORS.teal,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: COLORS.charcoalMid,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: COLORS.charcoal },
  bubbleTextTheirs: { color: COLORS.cream },

  bubbleTime: {
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 1,
    marginLeft: 4,
  },
  bubbleTimeRight: { textAlign: "right", marginRight: 4 },

  // Input Bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 10,
    backgroundColor: COLORS.charcoalMid,
    borderTopWidth: 1,
    borderTopColor: COLORS.charcoalLight,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.charcoalLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.cream,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
