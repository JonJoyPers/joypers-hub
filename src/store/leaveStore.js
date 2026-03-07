import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../services/supabase";

/**
 * leaveStore — leave request and balance management
 *
 * Requires Supabase. No mock fallback (leave management is a new feature).
 */
export const useLeaveStore = create((set, get) => ({
  leaveTypes: [],
  requests: [],
  balances: {},
  loading: false,

  /**
   * Fetch leave types from Supabase.
   */
  fetchLeaveTypes: async () => {
    if (!isSupabaseConfigured()) return;

    const { data } = await supabase
      .from("leave_types")
      .select("*")
      .order("name");

    if (data) {
      set({
        leaveTypes: data.map((lt) => ({
          id: lt.id,
          name: lt.name,
          accrualRate: Number(lt.accrual_rate) || 0,
          maxBalance: Number(lt.max_balance) || null,
        })),
      });
    }
  },

  /**
   * Fetch leave requests for a user (or all if admin/manager).
   */
  fetchRequests: async (userId, isManager = false) => {
    if (!isSupabaseConfigured()) return;

    set({ loading: true });

    let query = supabase
      .from("leave_requests")
      .select(
        "*, leave_type:leave_types(name), employee:employees(id, name), reviewer:employees!leave_requests_reviewed_by_fkey(name)"
      )
      .order("created_at", { ascending: false });

    if (!isManager) {
      query = query.eq("employee_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch leave requests:", error.message);
      set({ loading: false });
      return;
    }

    const requests = (data || []).map((row) => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee?.name,
      leaveTypeId: row.leave_type_id,
      leaveTypeName: row.leave_type?.name,
      startDate: row.start_date,
      endDate: row.end_date,
      hours: Number(row.hours) || 0,
      status: row.status,
      reason: row.reason,
      reviewedBy: row.reviewed_by,
      reviewerName: row.reviewer?.name,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
    }));

    set({ requests, loading: false });
  },

  /**
   * Fetch leave balances for a user.
   */
  fetchBalances: async (userId) => {
    if (!isSupabaseConfigured()) return;

    const { data } = await supabase
      .from("leave_ledger")
      .select("leave_type_id, delta_hours")
      .eq("employee_id", userId);

    if (data) {
      const balances = {};
      for (const row of data) {
        const typeId = row.leave_type_id;
        balances[typeId] = (balances[typeId] || 0) + Number(row.delta_hours);
      }
      set({ balances });
    }
  },

  /**
   * Submit a new leave request.
   */
  submitRequest: async ({ employeeId, leaveTypeId, startDate, endDate, hours, reason }) => {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        hours: String(hours),
        reason,
        status: "pending",
      })
      .select(
        "*, leave_type:leave_types(name), employee:employees(id, name)"
      )
      .single();

    if (error) {
      console.error("Failed to submit leave request:", error.message);
      return null;
    }

    const request = {
      id: data.id,
      employeeId: data.employee_id,
      employeeName: data.employee?.name,
      leaveTypeId: data.leave_type_id,
      leaveTypeName: data.leave_type?.name,
      startDate: data.start_date,
      endDate: data.end_date,
      hours: Number(data.hours) || 0,
      status: data.status,
      reason: data.reason,
      reviewedBy: null,
      reviewerName: null,
      reviewedAt: null,
      createdAt: data.created_at,
    };

    set((s) => ({ requests: [request, ...s.requests] }));
    return request;
  },

  /**
   * Approve or decline a leave request (manager/admin only).
   * Calls the approve-leave edge function.
   */
  reviewRequest: async (leaveRequestId, action) => {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase.functions.invoke("approve-leave", {
      body: { leave_request_id: leaveRequestId, action },
    });

    if (error) {
      console.error(`Failed to ${action} leave request:`, error.message);
      return null;
    }

    // Update local state
    if (data?.request) {
      set((s) => ({
        requests: s.requests.map((r) =>
          r.id === leaveRequestId
            ? {
                ...r,
                status: data.request.status,
                reviewedBy: data.request.reviewed_by,
                reviewedAt: data.request.reviewed_at,
              }
            : r
        ),
      }));
    }

    return data?.request;
  },

  /**
   * Cancel own leave request (only if still pending).
   */
  cancelRequest: async (leaveRequestId) => {
    if (!isSupabaseConfigured()) return;

    const { error } = await supabase
      .from("leave_requests")
      .update({ status: "cancelled" })
      .eq("id", leaveRequestId)
      .eq("status", "pending");

    if (error) {
      console.error("Failed to cancel leave request:", error.message);
      return;
    }

    set((s) => ({
      requests: s.requests.map((r) =>
        r.id === leaveRequestId ? { ...r, status: "cancelled" } : r
      ),
    }));
  },

  /**
   * Get balance for a specific leave type.
   */
  getBalance: (leaveTypeId) => get().balances[leaveTypeId] || 0,

  /**
   * Get pending requests (for manager review queue).
   */
  getPendingRequests: () =>
    get().requests.filter((r) => r.status === "pending"),
}));
