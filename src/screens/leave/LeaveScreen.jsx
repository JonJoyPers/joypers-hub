import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, Clock, ChevronDown, Plus, X } from "lucide-react-native";
import { COLORS } from "../../theme/colors";
import { useLeaveStore } from "../../store/leaveStore";
import { useAuthStore } from "../../store/authStore";
import Card from "../../components/Card";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import FormInput from "../../components/FormInput";
import { isSupabaseConfigured } from "../../services/supabase";

const STATUS_COLORS = {
  pending: COLORS.amber,
  approved: COLORS.green,
  declined: COLORS.red,
  cancelled: COLORS.creamMuted,
};

export default function LeaveScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === "admin" || user?.role === "manager";

  const {
    leaveTypes,
    requests,
    balances,
    loading,
    fetchLeaveTypes,
    fetchRequests,
    fetchBalances,
    submitRequest,
    cancelRequest,
    reviewRequest,
  } = useLeaveStore();

  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all"); // all | pending | approved | declined

  const load = useCallback(() => {
    if (!isSupabaseConfigured() || !user) return;
    fetchLeaveTypes();
    fetchRequests(user.id, isManager);
    fetchBalances(user.id);
  }, [user, isManager]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered =
    filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const handleCancel = (id) => {
    Alert.alert("Cancel Request", "Are you sure you want to cancel this request?", [
      { text: "No" },
      { text: "Yes, Cancel", style: "destructive", onPress: () => cancelRequest(id) },
    ]);
  };

  const handleReview = (id, action) => {
    const label = action === "approve" ? "Approve" : "Decline";
    Alert.alert(label, `Are you sure you want to ${action} this request?`, [
      { text: "No" },
      { text: label, onPress: () => reviewRequest(id, action) },
    ]);
  };

  if (!isSupabaseConfigured()) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <EmptyState title="Leave management requires Supabase" subtitle="Configure your Supabase connection to use this feature." />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.eyebrow}>TIME OFF</Text>
        <Text style={styles.title}>Leave</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.teal} />}
      >
        {/* Balances */}
        {leaveTypes.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>YOUR BALANCES</Text>
            <View style={styles.balanceRow}>
              {leaveTypes.map((lt) => (
                <View key={lt.id} style={styles.balanceCard}>
                  <Text style={styles.balanceHours}>
                    {(balances[lt.id] || 0).toFixed(1)}
                  </Text>
                  <Text style={styles.balanceLabel}>{lt.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Filters */}
        <View style={styles.filterRow}>
          {["all", "pending", "approved", "declined"].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Requests */}
        <Text style={styles.sectionLabel}>
          {isManager ? "ALL REQUESTS" : "YOUR REQUESTS"}
        </Text>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Calendar size={40} color={COLORS.creamMuted} />}
            title="No requests"
            subtitle="Tap + to submit a leave request"
          />
        ) : (
          filtered.map((req) => (
            <Card key={req.id} accentColor={STATUS_COLORS[req.status]}>
              <View style={styles.reqHeader}>
                <View style={{ flex: 1 }}>
                  {isManager && req.employeeName ? (
                    <Text style={styles.reqEmployee}>{req.employeeName}</Text>
                  ) : null}
                  <Text style={styles.reqType}>{req.leaveTypeName || "Leave"}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[req.status] + "25" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[req.status] }]}>
                    {req.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.reqDates}>
                <Calendar size={14} color={COLORS.creamMuted} />
                <Text style={styles.reqDateText}>
                  {req.startDate} — {req.endDate}
                </Text>
                <Clock size={14} color={COLORS.creamMuted} />
                <Text style={styles.reqDateText}>{req.hours}h</Text>
              </View>

              {req.reason ? (
                <Text style={styles.reqReason}>{req.reason}</Text>
              ) : null}

              {req.reviewerName ? (
                <Text style={styles.reqReviewer}>
                  Reviewed by {req.reviewerName}
                </Text>
              ) : null}

              {/* Actions */}
              {req.status === "pending" && (
                <View style={styles.reqActions}>
                  {isManager && req.employeeId !== user.id ? (
                    <>
                      <Button label="APPROVE" variant="success" size="sm" style={{ flex: 1 }} onPress={() => handleReview(req.id, "approve")} />
                      <Button label="DECLINE" variant="danger" size="sm" style={{ flex: 1 }} onPress={() => handleReview(req.id, "decline")} />
                    </>
                  ) : req.employeeId === user.id ? (
                    <Button label="CANCEL" variant="ghost" size="sm" onPress={() => handleCancel(req.id)} />
                  ) : null}
                </View>
              )}
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)}>
        <Plus size={28} color={COLORS.charcoal} strokeWidth={3} />
      </TouchableOpacity>

      {/* Create Modal */}
      <CreateLeaveModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        leaveTypes={leaveTypes}
        onSubmit={async (data) => {
          const result = await submitRequest({ ...data, employeeId: user.id });
          if (result) {
            setShowCreate(false);
            fetchBalances(user.id);
          }
        }}
      />
    </View>
  );
}

function CreateLeaveModal({ visible, onClose, leaveTypes, onSubmit }) {
  const [leaveTypeId, setLeaveTypeId] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const reset = () => {
    setLeaveTypeId(null);
    setStartDate("");
    setEndDate("");
    setHours("");
    setReason("");
  };

  const handleSubmit = async () => {
    if (!leaveTypeId || !startDate || !endDate || !hours) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    await onSubmit({ leaveTypeId, startDate, endDate, hours: Number(hours), reason });
    setSubmitting(false);
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalRoot, { paddingTop: insets.top }]}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Request Time Off</Text>
          <TouchableOpacity onPress={() => { onClose(); reset(); }} style={styles.closeBtn}>
            <X size={20} color={COLORS.creamMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          {/* Leave Type Selector */}
          <Text style={styles.fieldLabel}>LEAVE TYPE</Text>
          <View style={styles.typeRow}>
            {leaveTypes.map((lt) => (
              <TouchableOpacity
                key={lt.id}
                style={[styles.typeChip, leaveTypeId === lt.id && styles.typeChipActive]}
                onPress={() => setLeaveTypeId(lt.id)}
              >
                <Text style={[styles.typeChipText, leaveTypeId === lt.id && styles.typeChipTextActive]}>
                  {lt.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormInput label="START DATE (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder="2025-03-10" />
          <FormInput label="END DATE (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} placeholder="2025-03-12" />
          <FormInput label="HOURS" value={hours} onChangeText={setHours} placeholder="16" keyboardType="numeric" />
          <FormInput label="REASON (OPTIONAL)" value={reason} onChangeText={setReason} placeholder="Family vacation" multiline />

          <Button label="SUBMIT REQUEST" onPress={handleSubmit} loading={submitting} style={{ marginTop: 12 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.charcoal },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
  },
  eyebrow: { fontSize: 9, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: "800", color: COLORS.cream, letterSpacing: -0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12, paddingBottom: 100 },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: COLORS.teal, letterSpacing: 2, marginTop: 8 },

  // Balances
  balanceRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  balanceCard: {
    flex: 1,
    backgroundColor: COLORS.charcoalMid,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  balanceHours: { fontSize: 28, fontWeight: "800", color: COLORS.teal },
  balanceLabel: { fontSize: 11, fontWeight: "600", color: COLORS.creamMuted, marginTop: 4 },

  // Filters
  filterRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.charcoalMid,
  },
  filterChipActive: { backgroundColor: COLORS.teal + "30" },
  filterText: { fontSize: 12, fontWeight: "700", color: COLORS.creamMuted },
  filterTextActive: { color: COLORS.teal },

  // Request cards
  reqHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  reqEmployee: { fontSize: 14, fontWeight: "800", color: COLORS.cream },
  reqType: { fontSize: 15, fontWeight: "700", color: COLORS.cream },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  reqDates: { flexDirection: "row", alignItems: "center", gap: 6 },
  reqDateText: { fontSize: 13, color: COLORS.creamMuted, fontWeight: "600" },
  reqReason: { fontSize: 13, color: COLORS.creamMuted, fontStyle: "italic" },
  reqReviewer: { fontSize: 11, color: COLORS.creamMuted },
  reqActions: { flexDirection: "row", gap: 8, marginTop: 4 },

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

  // Modal
  modalRoot: { flex: 1, backgroundColor: COLORS.charcoal },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.charcoalMid,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.charcoalLight,
  },
  modalTitle: { fontSize: 24, fontWeight: "800", color: COLORS.cream, letterSpacing: -0.5 },
  closeBtn: { padding: 8, borderRadius: 10, backgroundColor: COLORS.charcoalLight },
  modalContent: { padding: 20, gap: 16, paddingBottom: 40 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: COLORS.creamMuted, letterSpacing: 0.5 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.charcoalMid,
    borderWidth: 1,
    borderColor: COLORS.charcoalLight,
  },
  typeChipActive: { backgroundColor: COLORS.teal + "30", borderColor: COLORS.teal },
  typeChipText: { fontSize: 13, fontWeight: "700", color: COLORS.creamMuted },
  typeChipTextActive: { color: COLORS.teal },
});
