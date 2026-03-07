"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

interface Employee {
  id: string;
  name: string;
  first_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  title: string | null;
  worker_type: string;
  hire_date: string | null;
  birthday: string | null;
  is_active: boolean;
  location: { name: string } | null;
}

type FilterTab = "active" | "archived" | "all";

interface NewEmployeeForm {
  name: string;
  email: string;
  role: string;
  department: string;
  title: string;
  worker_type: string;
}

const emptyForm: NewEmployeeForm = {
  name: "",
  email: "",
  role: "employee",
  department: "",
  title: "",
  worker_type: "in_store",
};

export default function EmployeesPage() {
  const supabase = createClient();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("active");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<NewEmployeeForm>(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 25;

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("*, location:locations(name)")
      .order("name");
    setEmployees(data || []);
  }

  async function saveEdit(id: string) {
    const { department, title, role } = editForm;
    const update: Record<string, string | null> = {};
    if (department !== undefined) update.department = department ?? null;
    if (title !== undefined) update.title = title ?? null;
    if (role !== undefined) update.role = role ?? null;

    await supabase.from("employees").update(update).eq("id", id);
    setEditing(null);
    fetchEmployees();
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await supabase.functions.invoke("create-employee", {
      body: {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        role: addForm.role,
        department: addForm.department.trim() || null,
        title: addForm.title.trim() || null,
        worker_type: addForm.worker_type,
      },
    });

    setAddLoading(false);

    if (res.error || res.data?.error) {
      setAddError(res.data?.error || res.error?.message || "Failed to create employee");
      return;
    }

    setShowAddModal(false);
    setAddForm(emptyForm);
    fetchEmployees();
  }

  async function handleArchiveRestore(employeeId: string, action: "disable" | "enable") {
    setActionLoading(employeeId);

    const res = await supabase.functions.invoke("manage-employee-auth", {
      body: { employeeId, action },
    });

    setActionLoading(null);

    if (res.error || res.data?.error) {
      alert(res.data?.error || res.error?.message || "Action failed");
      return;
    }

    fetchEmployees();
  }

  async function handleResetPassword(employeeId: string, employeeName: string) {
    if (!confirm(`Reset password for ${employeeName} to the default? They will be required to change it on next login.`)) return;

    setActionLoading(employeeId);

    const res = await supabase.functions.invoke("manage-employee-auth", {
      body: { employeeId, action: "reset-password" },
    });

    setActionLoading(null);

    if (res.error || res.data?.error) {
      alert(res.data?.error || res.error?.message || "Reset failed");
      return;
    }

    alert("Password reset successfully.");
  }

  const roleColors: Record<string, string> = {
    admin: "bg-amber/20 text-amber",
    manager: "bg-teal-light/20 text-teal-light",
    employee: "bg-cream-muted/20 text-cream-muted",
  };

  const filtered = employees
    .filter((e) => {
      if (filterTab === "active") return e.is_active;
      if (filterTab === "archived") return !e.is_active;
      return true;
    })
    .filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.department || "").toLowerCase().includes(search.toLowerCase())
    );

  const totalFiltered = filtered.length;
  const paged = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paged.length < totalFiltered;

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "active", label: "Active" },
    { key: "archived", label: "Archived" },
    { key: "all", label: "All" },
  ];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cream">Employees</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-charcoal-mid border border-charcoal-light rounded-lg px-4 py-2 text-cream text-sm w-64"
          />
          <button
            onClick={() => { setShowAddModal(true); setAddError(""); setAddForm(emptyForm); }}
            className="px-4 py-2 bg-teal hover:bg-teal-dark text-cream rounded-lg text-sm font-medium transition-colors"
          >
            + Add Employee
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterTab === tab.key
                ? "bg-teal/20 text-teal-light"
                : "text-cream-muted hover:text-cream hover:bg-charcoal-light/50"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs opacity-70">
              {tab.key === "active"
                ? employees.filter((e) => e.is_active).length
                : tab.key === "archived"
                ? employees.filter((e) => !e.is_active).length
                : employees.length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-charcoal-mid rounded-xl border border-charcoal-light overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-charcoal-light">
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3">Name</th>
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3">Email</th>
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3">Role</th>
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3">Department</th>
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3">Title</th>
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3">Location</th>
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3">Hire Date</th>
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3">Status</th>
              <th scope="col" className="text-left text-xs text-cream-muted font-medium px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {paged.map((emp) => (
              <tr
                key={emp.id}
                className={`border-b border-charcoal-light/50 hover:bg-charcoal-light/30 ${
                  !emp.is_active ? "opacity-50" : ""
                }`}
              >
                <td className="px-5 py-3 text-cream text-sm font-medium">{emp.name}</td>
                <td className="px-5 py-3 text-cream-muted text-sm">{emp.email || "-"}</td>
                <td className="px-5 py-3">
                  {editing === emp.id ? (
                    <select
                      value={editForm.role || emp.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="bg-charcoal-light border border-charcoal-light rounded px-2 py-1 text-cream text-xs"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-1 rounded-full ${roleColors[emp.role] || ""}`}>
                      {emp.role}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editing === emp.id ? (
                    <input
                      value={editForm.department ?? emp.department ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="bg-charcoal-light border border-charcoal-light rounded px-2 py-1 text-cream text-xs w-28"
                    />
                  ) : (
                    <span className="text-cream-muted text-sm">{emp.department || "-"}</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {editing === emp.id ? (
                    <input
                      value={editForm.title ?? emp.title ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="bg-charcoal-light border border-charcoal-light rounded px-2 py-1 text-cream text-xs w-32"
                    />
                  ) : (
                    <span className="text-cream-muted text-sm">{emp.title || "-"}</span>
                  )}
                </td>
                <td className="px-5 py-3 text-cream-muted text-sm">{emp.location?.name || "-"}</td>
                <td className="px-5 py-3 text-cream-muted text-sm">{emp.hire_date || "-"}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${emp.is_active ? "bg-green/20 text-green" : "bg-red/20 text-red"}`}>
                    {emp.is_active ? "Active" : "Archived"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2 items-center">
                    {editing === emp.id ? (
                      <>
                        <button onClick={() => saveEdit(emp.id)} className="text-green text-xs hover:underline">Save</button>
                        <button onClick={() => setEditing(null)} className="text-cream-muted text-xs hover:underline">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditing(emp.id); setEditForm({}); }}
                          className="text-teal-light text-xs hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleResetPassword(emp.id, emp.name)}
                          disabled={actionLoading === emp.id}
                          className="text-amber text-xs hover:underline disabled:opacity-50"
                        >
                          Reset PW
                        </button>
                        {emp.is_active ? (
                          <button
                            onClick={() => {
                              if (confirm(`Archive ${emp.name}? They will not be able to log in.`)) {
                                handleArchiveRestore(emp.id, "disable");
                              }
                            }}
                            disabled={actionLoading === emp.id}
                            className="text-red text-xs hover:underline disabled:opacity-50"
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`Restore ${emp.name}? They will be able to log in again.`)) {
                                handleArchiveRestore(emp.id, "enable");
                              }
                            }}
                            disabled={actionLoading === emp.id}
                            className="text-green text-xs hover:underline disabled:opacity-50"
                          >
                            Restore
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hasMore && (
          <div className="p-4 text-center border-t border-charcoal-light">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="text-teal-light text-sm hover:underline"
            >
              Show more ({totalFiltered - paged.length} remaining)
            </button>
          </div>
        )}
        {totalFiltered > 0 && (
          <div className="px-5 py-2 text-xs text-cream-muted border-t border-charcoal-light/50">
            Showing {paged.length} of {totalFiltered}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-charcoal-mid border border-charcoal-light rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold text-cream mb-4">Add New Employee</h3>

            {addError && (
              <div className="mb-4 p-3 bg-red/10 border border-red/30 rounded-lg text-red text-sm">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="block text-sm text-cream-muted mb-1">Full Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-charcoal-light border border-charcoal-light rounded-lg text-cream text-sm focus:outline-none focus:border-teal"
                  placeholder="e.g. Jane Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-cream-muted mb-1">Email *</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-charcoal-light border border-charcoal-light rounded-lg text-cream text-sm focus:outline-none focus:border-teal"
                  placeholder="jane@joypers.com"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-cream-muted mb-1">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 bg-charcoal-light border border-charcoal-light rounded-lg text-cream text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-cream-muted mb-1">Worker Type</label>
                  <select
                    value={addForm.worker_type}
                    onChange={(e) => setAddForm({ ...addForm, worker_type: e.target.value })}
                    className="w-full px-3 py-2 bg-charcoal-light border border-charcoal-light rounded-lg text-cream text-sm"
                  >
                    <option value="in_store">In-Store</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-cream-muted mb-1">Department</label>
                <input
                  type="text"
                  value={addForm.department}
                  onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-charcoal-light border border-charcoal-light rounded-lg text-cream text-sm focus:outline-none focus:border-teal"
                  placeholder="e.g. Sales Floor"
                />
              </div>
              <div>
                <label className="block text-sm text-cream-muted mb-1">Title</label>
                <input
                  type="text"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-charcoal-light border border-charcoal-light rounded-lg text-cream text-sm focus:outline-none focus:border-teal"
                  placeholder="e.g. Sales Associate"
                />
              </div>

              <p className="text-xs text-cream-muted">
                The employee will be created with the default password and required to change it on first login.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-cream-muted text-sm hover:text-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-teal hover:bg-teal-dark text-cream rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addLoading ? "Creating..." : "Create Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
