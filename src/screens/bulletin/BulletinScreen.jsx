import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Megaphone, Pin, Plus, Pencil, Trash2 } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAppStore } from "../../store/appStore";
import { useAuthStore } from "../../store/authStore";
import CreateBulletinModal from "./CreateBulletinModal";

const TYPE_COLORS = {
  birthday: COLORS.rose,
  anniversary: COLORS.amber,
  promo: COLORS.teal,
  event: COLORS.violet,
  announcement: COLORS.creamMuted,
  recognition: COLORS.green,
};

function getCountdownText(eventDateISO, now) {
  if (!eventDateISO) return null;
  const target = new Date(eventDateISO);
  const diffMs = target - now;

  if (diffMs <= 0) return "Now!";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? "s" : ""}`;
  return `${diffMins} min${diffMins !== 1 ? "s" : ""}`;
}

function PostCard({ post, now, currentUser, onEdit, onDelete }) {
  const color = TYPE_COLORS[post.type] || COLORS.creamMuted;
  const countdown = getCountdownText(post.eventDate, now);

  const isOwner =
    currentUser &&
    (post.authorId === currentUser.id ||
      post.author === currentUser.name);
  const isAdminOrManager =
    currentUser &&
    (currentUser.role === "admin" || currentUser.role === "manager");
  const canEdit = isOwner;
  const canDelete = isOwner || isAdminOrManager;

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardEmoji}>{post.emoji}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardType}>{post.type.toUpperCase()}</Text>
          <Text style={styles.cardDate}>
            {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Text>
        </View>
        {post.pinned && (
          <View style={styles.pinnedBadge}>
            <Pin size={10} color={COLORS.teal} strokeWidth={2.5} />
          </View>
        )}
        {(canEdit || canDelete) && (
          <View style={styles.postActions}>
            {canEdit && (
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => onEdit(post)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Pencil size={14} color={COLORS.creamMuted} strokeWidth={2} />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                style={styles.actionIcon}
                onPress={() => onDelete(post)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={14} color={COLORS.red} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {countdown && (
        <View style={[styles.countdownBadge, { backgroundColor: color + "22" }]}>
          <Text style={styles.countdownIcon}>{"⏳"}</Text>
          <Text style={[styles.countdownText, { color }]}>{countdown}</Text>
          <Text style={styles.countdownLabel}>away</Text>
        </View>
      )}

      <Text style={styles.cardTitle}>{post.title}</Text>
      <Text style={styles.cardBody}>{post.body}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardAuthor}>— {post.author}</Text>
        <View style={styles.tagsRow}>
          {post.tags.slice(0, 2).map((t) => (
            <Text key={t} style={styles.tag}>{t}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function BulletinScreen() {
  const insets = useSafeAreaInsets();
  const markBulletinRead = useAppStore((s) => s.markBulletinRead);
  const bulletinPosts = useAppStore((s) => s.bulletinPosts);
  const deleteBulletinPost = useAppStore((s) => s.deleteBulletinPost);
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [now, setNow] = useState(new Date());

  const canCreate = user?.role === "admin" || user?.role === "manager";

  const fetchBulletinPosts = useAppStore((s) => s.fetchBulletinPosts);

  useEffect(() => {
    fetchBulletinPosts();
    markBulletinRead();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleEdit = (post) => {
    setEditingPost(post);
    setShowCreate(true);
  };

  const handleDelete = (post) => {
    Alert.alert(
      "Delete Post",
      `Are you sure you want to delete "${post.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteBulletinPost(post.id),
        },
      ]
    );
  };

  const handleCloseModal = () => {
    setShowCreate(false);
    setEditingPost(null);
  };

  const pinned = bulletinPosts.filter((p) => p.pinned);
  const unpinned = bulletinPosts
    .filter((p) => !p.pinned)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>STORE UPDATES</Text>
        <Text style={styles.title}>Bulletin Board</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {pinned.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PINNED</Text>
            {pinned.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                now={now}
                currentUser={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
        <Text style={styles.sectionLabel}>LATEST</Text>
        {unpinned.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            now={now}
            currentUser={user}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>

      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
        >
          <Plus size={26} color={COLORS.charcoal} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      <CreateBulletinModal
        visible={showCreate}
        onClose={handleCloseModal}
        editingPost={editingPost}
      />
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
  sectionLabel: { fontSize: 10, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginTop: 8, marginBottom: 4 },

  card: {
    backgroundColor: COLORS.charcoalMid, borderRadius: 16, padding: 16,
    borderLeftWidth: 4, gap: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardEmoji: { fontSize: 22 },
  cardMeta: { flex: 1 },
  cardType: { fontSize: 9, fontWeight: "700", color: COLORS.creamMuted, letterSpacing: 1.5 },
  cardDate: { fontSize: 11, color: COLORS.creamMuted, marginTop: 1 },
  pinnedBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.teal + "22",
    alignItems: "center", justifyContent: "center",
  },

  postActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 4,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center",
    justifyContent: "center",
  },

  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  countdownIcon: { fontSize: 14 },
  countdownText: { fontSize: 16, fontWeight: "800" },
  countdownLabel: { fontSize: 12, fontWeight: "500", color: COLORS.creamMuted },

  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  cardBody: { fontSize: 13, color: COLORS.creamMuted, lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  cardAuthor: { fontSize: 11, color: COLORS.creamMuted, fontStyle: "italic" },
  tagsRow: { flexDirection: "row", gap: 4 },
  tag: {
    fontSize: 10, fontWeight: "600", color: COLORS.teal,
    backgroundColor: COLORS.teal + "18",
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },

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
});
