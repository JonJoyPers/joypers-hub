import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, MessageSquare } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useMessageStore } from "../../store/messageStore";
import { MOCK_USERS, getUserById } from "../../data/mockUsers";

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

function ConversationRow({ conversation, currentUserId, onPress }) {
  const otherUserId = conversation.participants.find(
    (p) => p !== currentUserId
  );
  const participantProfiles = useMessageStore((s) => s.participantProfiles);
  const otherUser = getUserById(otherUserId) || participantProfiles[otherUserId];
  if (!otherUser) return null;

  const roleColor = ROLE_COLOR[otherUser.role] || COLORS.creamMuted;
  const unread = conversation.unreadCount[currentUserId] || 0;
  const preview =
    conversation.lastMessage.text.length > 50
      ? conversation.lastMessage.text.slice(0, 50) + "..."
      : conversation.lastMessage.text;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: roleColor + "30", borderColor: roleColor },
        ]}
      >
        <Text style={[styles.avatarText, { color: roleColor }]}>
          {otherUser.firstName.charAt(0)}
        </Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName}>{otherUser.name}</Text>
          <Text style={styles.rowTime}>
            {timeAgo(conversation.lastMessage.timestamp)}
          </Text>
        </View>
        <View style={styles.rowBottom}>
          <Text
            style={[styles.rowPreview, unread > 0 && styles.rowPreviewUnread]}
            numberOfLines={1}
          >
            {preview || "No messages yet"}
          </Text>
          {unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function UserPickerModal({ visible, onClose, currentUserId, onSelectUser }) {
  const users = MOCK_USERS.filter((u) => u.id !== currentUserId);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <View>
            <Text style={styles.eyebrow}>NEW MESSAGE</Text>
            <Text style={styles.modalTitle}>Select User</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.modalScrollContent}
        >
          {users.map((u) => {
            const roleColor = ROLE_COLOR[u.role] || COLORS.creamMuted;
            return (
              <TouchableOpacity
                key={u.id}
                style={styles.userRow}
                onPress={() => onSelectUser(u)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.avatar,
                    {
                      backgroundColor: roleColor + "30",
                      borderColor: roleColor,
                    },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: roleColor }]}>
                    {u.firstName.charAt(0)}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <Text style={[styles.userRole, { color: roleColor }]}>
                    {u.title} · {u.department}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function ConversationListScreen({ navigation, embedded = false }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const fetchConversations = useMessageStore((s) => s.fetchConversations);
  const subscribeToMessages = useMessageStore((s) => s.subscribeToMessages);
  const unsubscribe = useMessageStore((s) => s.unsubscribe);
  const getConversationsForUser = useMessageStore(
    (s) => s.getConversationsForUser
  );
  const getOrCreateConversation = useMessageStore(
    (s) => s.getOrCreateConversation
  );
  const conversations = getConversationsForUser(user.id);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    fetchConversations(user?.id);
    subscribeToMessages(user?.id);
    return () => unsubscribe();
  }, [user?.id]);

  const handleSelectUser = async (otherUser) => {
    setShowPicker(false);
    const conv = await getOrCreateConversation(user.id, otherUser.id);
    if (!conv) return;
    navigation.navigate("Chat", {
      conversationId: conv.id,
      otherUserId: otherUser.id,
    });
  };

  const handleConversationPress = (conv) => {
    const otherUserId = conv.participants.find((p) => p !== user.id);
    navigation.navigate("Chat", {
      conversationId: conv.id,
      otherUserId,
    });
  };

  return (
    <View style={styles.root}>
      {!embedded && (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.eyebrow}>MESSAGES</Text>
          <Text style={styles.title}>Inbox</Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {conversations.length === 0 ? (
          <View style={styles.empty}>
            <MessageSquare
              size={40}
              color={COLORS.charcoalLight}
              strokeWidth={1.5}
            />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to start a new message
            </Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <ConversationRow
              key={conv.id}
              conversation={conv}
              currentUserId={user.id}
              onPress={() => handleConversationPress(conv)}
            />
          ))
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.85}
      >
        <Plus size={26} color={COLORS.charcoal} strokeWidth={2.5} />
      </TouchableOpacity>

      <UserPickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        currentUserId={user.id}
        onSelectUser={handleSelectUser}
      />
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
  scrollContent: { paddingVertical: 8 },

  // Conversation Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight + "60",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  avatarText: { fontSize: 18, fontWeight: "800" },
  rowContent: { flex: 1, gap: 4 },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowName: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  rowTime: { fontSize: 11, color: COLORS.creamMuted },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowPreview: {
    fontSize: 13,
    color: COLORS.creamMuted,
    flex: 1,
    marginRight: 8,
  },
  rowPreviewUnread: { color: COLORS.cream, fontWeight: "600" },
  unreadBadge: {
    backgroundColor: COLORS.teal,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { fontSize: 11, fontWeight: "800", color: COLORS.charcoal },

  // Empty State
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.creamMuted,
    marginTop: 8,
  },
  emptySubtext: { fontSize: 13, color: COLORS.creamMuted },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // User Picker Modal
  modalRoot: { flex: 1, backgroundColor: COLORS.charcoal },
  modalHeader: {
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
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.cream,
    letterSpacing: -0.5,
  },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.charcoalLight,
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.creamMuted,
  },
  modalScrollContent: { paddingVertical: 8 },

  // User Row (in picker)
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight + "60",
  },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  userRole: { fontSize: 12, fontWeight: "600" },
});
