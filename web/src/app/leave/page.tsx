"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

interface LeaveRequest {
  id: number;
  employee_id: string;
  start_date: string;
  end_date: string;
  hours: string;
  status: string;
  reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  employee: { name: string } | null;
  leave_type: { name: string } | null;
  reviewer: { name: string } | null;
}

export default function LeavePage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState("pending");

  async function fetchRequests() {
    let query = supabase
      .from("leave_requests")
      .select("*, employee:employees!leave_requests_employee_id_fkey(name), leave_type:leave_types(name), reviewer:employees!leave_requests_reviewed_by_fkey(name)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setRequests(data || []);
  }

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  async function handleAction(id: number, action: "approve" | "decline") {
    const { error } = await supabase.functions.invoke("approve-leave", {
      body: { leave_request_id: id, action },
    });

    if (!error) {
      fetchRequests();
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber/20 text-amber",
    approved: "bg-green/20 text-green",
    declined: "bg-red/20 text-red",
    cancelled: "bg-cream-muted/20 text-cream-muted",
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cream">Leave Requests</h2>
        <div className="flex gap-2">
          {["pending", "approved", "declined", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                filter === f
                  ? "bg-teal text-cream"
                  : "bg-charcoal-mid border border-charcoal-light text-cream-muted hover:text-cream"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-charcoal-mid rounded-xl border border-charcoal-light overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-charcoal-light">
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Employee</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Type</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Dates</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Hours</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Status</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Reason</th>
              <th className="text-left text-xs text-cream-muted font-medium px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-cream-muted text-sm">
                  No {filter !== "all" ? filter : ""} leave requests.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="border-b border-charcoal-light/50 hover:bg-charcoal-light/30">
                  <td className="px-5 py-3 text-cream text-sm">{req.employee?.name}</td>
                  <td className="px-5 py-3 text-cream-muted text-sm">{req.leave_type?.name}</td>
                  <td className="px-5 py-3 text-cream-muted text-sm">
                    {req.start_date} &rarr; {req.end_date}
                  </td>
                  <td className="px-5 py-3 text-cream-muted text-sm">{req.hours}h</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[req.status] || ""}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-cream-muted text-sm max-w-[200px] truncate">{req.reason || "-"}</td>
                  <td className="px-5 py-3">
                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, "approve")}
                          className="px-3 py-1 bg-green/20 text-green rounded text-xs hover:bg-green/30"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "decline")}
                          className="px-3 py-1 bg-red/20 text-red rounded text-xs hover:bg-red/30"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {req.reviewer?.name && (
                      <span className="text-cream-muted text-xs">by {req.reviewer.name}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
