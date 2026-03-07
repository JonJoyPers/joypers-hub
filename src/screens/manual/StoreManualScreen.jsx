import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Eye,
  Check,
} from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useAuthStore } from "../../store/authStore";
import { useManualStore } from "../../store/manualStore";
import EditManualSectionModal from "./EditManualSectionModal";
import HtmlBody from "../../components/HtmlBody";

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function StoreManualScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const sections = useManualStore((s) => s.sections);
  const loading = useManualStore((s) => s.loading);
  const error = useManualStore((s) => s.error);
  const fetchFromGoogleDocs = useManualStore((s) => s.fetchFromGoogleDocs);
  const acknowledge = useManualStore((s) => s.acknowledge);
  const getUnacknowledged = useManualStore((s) => s.getUnacknowledged);

  useEffect(() => {
    fetchFromGoogleDocs();
  }, []);

  const [expandedId, setExpandedId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const isAdmin = user?.role === "admin";
  const unacked = getUnacknowledged(user?.id);
  const unackedIds = new Set(unacked.map((s) => s.id));

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleAcknowledge = (sectionId) => {
    acknowledge(sectionId, user.id);
  };

  const handleAcknowledgeAll = () => {
    unacked.forEach((s) => acknowledge(s.id, user.id));
  };

  const handleEdit = (section) => {
    setEditingSection(section);
    setModalVisible(true);
  };

  const handleAdd = () => {
    setEditingSection(null);
    setModalVisible(true);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color={COLORS.cream} strokeWidth={2} />
        </TouchableOpacity>
        <View>
          <Text style={styles.eyebrow}>STORE MANUAL</Text>
          <Text style={styles.title}>Manual</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.teal} />
            <Text style={styles.loadingText}>Loading manual...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Couldn't refresh manual — showing cached version.
            </Text>
            <TouchableOpacity onPress={fetchFromGoogleDocs} activeOpacity={0.8}>
              <Text style={styles.retryText}>Tap to retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Unacknowledged Banner */}
        {unacked.length > 0 && (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>
              {unacked.length} section{unacked.length > 1 ? "s" : ""} updated
            </Text>
            <Text style={styles.bannerSub}>
              {unacked.map((s) => s.title).join(", ")}
            </Text>
            <TouchableOpacity
              style={styles.ackAllBtn}
              onPress={handleAcknowledgeAll}
              activeOpacity={0.85}
            >
              <Check size={14} color={COLORS.charcoal} strokeWidth={2.5} />
              <Text style={styles.ackAllBtnText}>ACKNOWLEDGE ALL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section Cards */}
        {sections.map((section) => {
          const isOpen = expandedId === section.id;
          const needsAck = unackedIds.has(section.id);

          return (
            <TouchableOpacity
              key={section.id}
              style={[
                styles.card,
                needsAck && styles.cardUpdated,
              ]}
              onPress={() => toggleExpand(section.id)}
              activeOpacity={0.8}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{section.title}</Text>
                    {needsAck && (
                      <View style={styles.updatedBadge}>
                        <Text style={styles.updatedBadgeText}>UPDATED</Text>
                      </View>
                    )}
                  </View>
                  {!isOpen && (
                    <Text style={styles.cardSub} numberOfLines={1}>
                      Updated {formatDate(section.updatedAt)}
                    </Text>
                  )}
                </View>
                {isOpen ? (
                  <ChevronUp size={18} color={COLORS.creamMuted} strokeWidth={2} />
                ) : (
                  <ChevronDown size={18} color={COLORS.creamMuted} strokeWidth={2} />
                )}
              </View>

              {/* Card Body */}
              {isOpen && (
                <View style={styles.cardBody}>
                  <Text style={styles.cardDate}>
                    Updated {formatDate(section.updatedAt)} · v{section.version}
                  </Text>
                  <HtmlBody html={section.body} />

                  {/* Acknowledge button for unacked sections */}
                  {needsAck && (
                    <TouchableOpacity
                      style={styles.ackBtn}
                      onPress={() => handleAcknowledge(section.id)}
                      activeOpacity={0.85}
                    >
                      <Check size={14} color={COLORS.charcoal} strokeWidth={2.5} />
                      <Text style={styles.ackBtnText}>ACKNOWLEDGE</Text>
                    </TouchableOpacity>
                  )}

                  {/* Admin actions */}
                  {isAdmin && (
                    <View style={styles.adminActions}>
                      <TouchableOpacity
                        style={styles.adminAction}
                        onPress={() => handleEdit(section)}
                        activeOpacity={0.8}
                      >
                        <Pencil size={14} color={COLORS.teal} strokeWidth={2} />
                        <Text style={styles.adminActionText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.adminAction}
                        onPress={() =>
                          navigation.navigate("ManualAcknowledgments", {
                            sectionId: section.id,
                          })
                        }
                        activeOpacity={0.8}
                      >
                        <Eye size={14} color={COLORS.teal} strokeWidth={2} />
                        <Text style={styles.adminActionText}>
                          View Acknowledgments
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Admin FAB */}
      {isAdmin && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 24 }]}
          onPress={handleAdd}
          activeOpacity={0.85}
        >
          <Plus size={24} color={COLORS.charcoal} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      {/* Edit Modal */}
      <EditManualSectionModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingSection(null);
        }}
        section={editingSection}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.charcoalLight,
    alignItems: "center",
    justifyContent: "center",
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
  scrollContent: { padding: 20, gap: 16 },

  // Loading & Error
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.creamMuted,
  },
  errorContainer: {
    backgroundColor: COLORS.rose + "15",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.rose + "40",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.creamMuted,
    textAlign: "center",
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.teal,
  },

  // Banner
  banner: {
    backgroundColor: COLORS.amber + "15",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.amber + "40",
    gap: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.amber,
  },
  bannerSub: {
    fontSize: 12,
    color: COLORS.creamMuted,
    lineHeight: 17,
  },
  ackAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.amber,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  ackAllBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 1.5,
  },

  // Cards
  card: {
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
  },
  cardUpdated: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.amber,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.cream, flexShrink: 1 },
  updatedBadge: {
    backgroundColor: COLORS.amber + "25",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  updatedBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.amber,
    letterSpacing: 1,
  },
  cardSub: { fontSize: 12, color: COLORS.creamMuted, marginTop: 2 },
  cardBody: { marginTop: 12, gap: 10 },
  cardDate: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },

  // Acknowledge button
  ackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.teal,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  ackBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.charcoal,
    letterSpacing: 1.5,
  },

  // Admin actions
  adminActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.charcoalLight,
  },
  adminAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  adminActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.teal,
  },

  // FAB
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.teal,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
