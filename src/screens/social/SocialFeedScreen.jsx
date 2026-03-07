import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Heart, MessageCircle, Send, Rss } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useAppStore } from "../../store/appStore";

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

function PostCard({ post, currentUser }) {
  const { toggleLike, addComment } = useAppStore();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const liked = post.likes.includes(currentUser.id);
  const roleColor = ROLE_COLOR[post.authorRole] || COLORS.creamMuted;

  const submitComment = () => {
    const text = commentText.trim();
    if (!text) return;
    addComment(post.id, currentUser.id, currentUser.firstName, text);
    setCommentText("");
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: roleColor + "30", borderColor: roleColor }]}>
          <Text style={[styles.avatarText, { color: roleColor }]}>
            {post.authorName.charAt(0)}
          </Text>
        </View>
        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={[styles.authorRole, { color: roleColor }]}>
            {post.authorRole.charAt(0).toUpperCase() + post.authorRole.slice(1)} · {timeAgo(post.timestamp)}
          </Text>
        </View>
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => toggleLike(post.id, currentUser.id)}
        >
          <Heart
            size={18}
            color={liked ? COLORS.rose : COLORS.creamMuted}
            fill={liked ? COLORS.rose : "none"}
            strokeWidth={2}
          />
          <Text style={[styles.actionCount, liked && { color: COLORS.rose }]}>
            {post.likes.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setShowComments(!showComments)}
        >
          <MessageCircle size={18} color={COLORS.creamMuted} strokeWidth={2} />
          <Text style={styles.actionCount}>{post.comments.length}</Text>
        </TouchableOpacity>
      </View>

      {showComments && (
        <View style={styles.commentsSection}>
          {post.comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Text style={styles.commentAuthor}>{c.authorName}</Text>
              <Text style={styles.commentText}>{c.content}</Text>
            </View>
          ))}
          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentTextInput}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.creamMuted}
              value={commentText}
              onChangeText={setCommentText}
              returnKeyType="send"
              onSubmitEditing={submitComment}
            />
            <TouchableOpacity onPress={submitComment}>
              <Send size={18} color={COLORS.teal} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function SocialFeedScreen({ embedded = false }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { socialPosts, addSocialPost, fetchSocialPosts } = useAppStore();
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    fetchSocialPosts();
  }, []);
  const canPost = user.role === "admin" || user.role === "manager";

  const submitPost = () => {
    const text = newPost.trim();
    if (!text) return;
    if (text.length < 10) {
      Alert.alert("Too short", "Please write at least 10 characters.");
      return;
    }
    addSocialPost(user.id, user.name, user.role, text);
    setNewPost("");
  };

  return (
    <View style={styles.root}>
      {!embedded && (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.eyebrow}>TEAM SOCIAL</Text>
          <Text style={styles.title}>Feed</Text>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {canPost && (
            <View style={styles.composer}>
              <TextInput
                style={styles.composerInput}
                placeholder="Share something with the team..."
                placeholderTextColor={COLORS.creamMuted}
                value={newPost}
                onChangeText={setNewPost}
                multiline
                maxLength={280}
              />
              <TouchableOpacity style={styles.postBtn} onPress={submitPost}>
                <Send size={18} color={COLORS.charcoal} strokeWidth={2.5} />
                <Text style={styles.postBtnText}>POST</Text>
              </TouchableOpacity>
            </View>
          )}
          {socialPosts.map((p) => (
            <PostCard key={p.id} post={p} currentUser={user} />
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1, borderBottomColor: COLORS.charcoalLight,
  },
  eyebrow: { fontSize: 9, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.cream, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },

  composer: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.charcoalLight, gap: 12,
  },
  composerInput: {
    fontSize: 14, color: COLORS.cream, fontWeight: "500", minHeight: 60,
  },
  postBtn: {
    flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-end",
    backgroundColor: COLORS.teal, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  postBtnText: { fontSize: 12, fontWeight: "800", color: COLORS.charcoal, letterSpacing: 1.5 },

  card: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 16, padding: 16, gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  avatarText: { fontSize: 16, fontWeight: "800" },
  authorMeta: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: "700", color: COLORS.cream },
  authorRole: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  content: { fontSize: 14, color: COLORS.cream, lineHeight: 20 },

  actions: { flexDirection: "row", gap: 20 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionCount: { fontSize: 13, fontWeight: "600", color: COLORS.creamMuted },

  commentsSection: { borderTopWidth: 1, borderTopColor: COLORS.charcoalLight, paddingTop: 12, gap: 10 },
  comment: { gap: 2 },
  commentAuthor: { fontSize: 12, fontWeight: "700", color: COLORS.teal },
  commentText: { fontSize: 13, color: COLORS.cream },
  commentInput: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.charcoalLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  commentTextInput: { flex: 1, fontSize: 13, color: COLORS.cream },
});
