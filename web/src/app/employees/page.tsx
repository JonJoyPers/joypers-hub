"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

/* ─── Types ─── */

interface Employee {
  id: string;
  name: string;
  first_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
  title: string | null;
  worker_type: string;
  location_id: number | null;
  hire_date: string | null;
  birthday: string | null;
  avatar_url: string | null;
  is_active: boolean;
  pay_rate: string | null;
  pay_type: string | null;
  location: { name: string } | null;
}

interface Location {
  id: number;
  name: string;
}

interface Availability {
  id: number;
  employee_id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_available: boolean;
}

interface LeaveBalance {
  leave_type_id: number;
  balance: string;
  leave_type_name?: string;
}

interface LeaveType {
  id: number;
  name: string;
}

interface EmployeeDocument {
  id: number;
  employee_id: string;
  doc_type: string;
  label: string;
  status: "not_sent" | "sent" | "completed";
  sent_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface NewEmployeeForm {
  name: string;
  email: string;
  role: string;
  department: string;
  title: string;
  worker_type: string;
  location_id: string;
}

type FilterTab = "active" | "archived" | "all";
type DetailTab = "details" | "availability" | "pay" | "leave" | "onboarding";

/* ─── Constants ─── */

const emptyForm: NewEmployeeForm = {
  name: "",
  email: "",
  role: "employee",
  department: "",
  title: "",
  worker_type: "in_store",
  location_id: "",
};

interface WorkerTypeOption {
  key: string;
  label: string;
  description: string;
}

const DEFAULT_TITLES = [
  "Store Manager", "Floor Manager", "Social Media Marketing Manager",
  "Floor Lead", "Associate", "Inventory", "Temp",
];

const DEFAULT_DEPARTMENTS = ["Sales Floor", "Back Room"];

const DEFAULT_WORKER_TYPES: WorkerTypeOption[] = [
  { key: "in_store", label: "In-Store", description: "Works on-site at a store location" },
  { key: "remote", label: "Remote", description: "Works remotely" },
  { key: "both", label: "Both", description: "Splits time between on-site and remote" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-amber/20 text-amber border-amber/30",
  manager: "bg-teal/20 text-teal-light border-teal/30",
  employee: "bg-charcoal-light text-cream-muted border-charcoal-light",
};

const AVATAR_COLORS = [
  "bg-teal", "bg-amber", "bg-violet", "bg-rose", "bg-teal-dark", "bg-teal-light",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DEFAULT_ONBOARDING_DOCS = [
  { doc_type: "w4", label: "W-4 (Federal Tax Withholding)" },
  { doc_type: "i9", label: "I-9 (Employment Eligibility)" },
  { doc_type: "w2", label: "W-2 (Wage & Tax Statement)" },
  { doc_type: "direct_deposit", label: "Direct Deposit Authorization" },
  { doc_type: "handbook_ack", label: "Employee Handbook Acknowledgment" },
  { doc_type: "emergency_contact", label: "Emergency Contact Form" },
];

const inputClass =
  "w-full px-3 py-2 bg-charcoal-light border border-charcoal-light rounded-lg text-cream text-sm focus:outline-none focus:border-teal";

/* ─── Helpers ─── */

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(d: string | null): string {
  if (!d) return "-";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: string | null): string {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function tenure(hireDate: string | null): string {
  if (!hireDate) return "";
  const start = new Date(hireDate + "T00:00:00");
  const now = new Date();
  const years = now.getFullYear() - start.getFullYear();
  const months = now.getMonth() - start.getMonth();
  const totalMonths = years * 12 + months;
  if (totalMonths < 1) return "< 1 month";
  if (totalMonths < 12) return `${totalMonths} month${totalMonths !== 1 ? "s" : ""}`;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  return m > 0 ? `${y}y ${m}m` : `${y} year${y !== 1 ? "s" : ""}`;
}

function formatTime12(time24: string | null): string {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${ampm}`;
}

/* ─── Main Component ─── */

export default function EmployeesPage() {
  const supabase = createClient();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("active");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterWorkerType, setFilterWorkerType] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<NewEmployeeForm>(emptyForm);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [titles, setTitles] = useState<string[]>(DEFAULT_TITLES);
  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [workerTypes, setWorkerTypes] = useState<WorkerTypeOption[]>(DEFAULT_WORKER_TYPES);

  // Detail panel tab
  const [detailTab, setDetailTab] = useState<DetailTab>("details");

  // Availability
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [editingAvail, setEditingAvail] = useState(false);
  const [availForm, setAvailForm] = useState<Availability[]>([]);

  // Leave
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  // Documents
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);

  async function fetchEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("*, location:locations(name)")
      .order("name");
    setEmployees(data || []);
  }

  async function fetchLocations() {
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    setLocations(data || []);
  }

  async function fetchSettings() {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["roles.titles", "roles.departments", "roles.workerTypes"]);
    if (data) {
      for (const row of data) {
        try {
          if (row.key === "roles.titles") setTitles(JSON.parse(row.value));
          if (row.key === "roles.departments") setDepartments(JSON.parse(row.value));
          if (row.key === "roles.workerTypes") setWorkerTypes(JSON.parse(row.value));
        } catch { /* use defaults */ }
      }
    }
  }

  async function fetchLeaveTypes() {
    const { data } = await supabase.from("leave_types").select("id, name");
    setLeaveTypes(data || []);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEmployees(); fetchLocations(); fetchSettings(); fetchLeaveTypes(); }, []);

  // Fetch detail data when selected employee changes
  useEffect(() => {
    if (!selected) return;
    fetchAvailability(selected.id);
    fetchLeaveBalances(selected.id);
    fetchDocuments(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function fetchAvailability(employeeId: string) {
    const { data } = await supabase
      .from("employee_availability")
      .select("*")
      .eq("employee_id", employeeId)
      .order("day_of_week");
    setAvailability(data || []);
  }

  async function fetchLeaveBalances(employeeId: string) {
    const { data } = await supabase
      .from("leave_balances")
      .select("leave_type_id, balance")
      .eq("employee_id", employeeId);
    setLeaveBalances(data || []);
  }

  async function fetchDocuments(employeeId: string) {
    const { data } = await supabase
      .from("employee_documents")
      .select("*")
      .eq("employee_id", employeeId)
      .order("created_at");
    setDocuments(data || []);
  }

  function workerTypeLabel(key: string): string {
    return workerTypes.find((w) => w.key === key)?.label || key;
  }

  /* ─── Filtering ─── */

  const filtered = employees
    .filter((e) => {
      if (filterTab === "active") return e.is_active;
      if (filterTab === "archived") return !e.is_active;
      return true;
    })
    .filter((e) => {
      if (filterRole && e.role !== filterRole) return false;
      if (filterLocation && String(e.location_id) !== filterLocation) return false;
      if (filterWorkerType && e.worker_type !== filterWorkerType) return false;
      return true;
    })
    .filter((e) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.department || "").toLowerCase().includes(q) ||
        (e.title || "").toLowerCase().includes(q)
      );
    });

  /* ─── Stats ─── */

  const activeCount = employees.filter((e) => e.is_active).length;
  const archivedCount = employees.filter((e) => !e.is_active).length;
  const managerCount = employees.filter((e) => e.is_active && (e.role === "manager" || e.role === "admin")).length;
  const usedDepartments = [...new Set(employees.filter((e) => e.department).map((e) => e.department!))];

  /* ─── CRUD ─── */

  async function saveEdit() {
    if (!selected) return;
    const { name, first_name, email, role, department, title, worker_type, location_id, hire_date, birthday, pay_rate, pay_type } = editForm;
    const update: Record<string, unknown> = {};
    if (name !== undefined) {
      update.name = name;
      update.first_name = name.split(" ")[0];
    }
    if (first_name !== undefined && name === undefined) update.first_name = first_name;
    if (email !== undefined) update.email = email || null;
    if (role !== undefined) update.role = role;
    if (department !== undefined) update.department = department || null;
    if (title !== undefined) update.title = title || null;
    if (worker_type !== undefined) update.worker_type = worker_type;
    if (location_id !== undefined) update.location_id = location_id || null;
    if (hire_date !== undefined) update.hire_date = hire_date || null;
    if (birthday !== undefined) update.birthday = birthday || null;
    if (pay_rate !== undefined) update.pay_rate = pay_rate || null;
    if (pay_type !== undefined) update.pay_type = pay_type || null;

    try {
      const res = await fetch("/api/employees/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selected.id, update }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(`Error saving: ${result.error}`);
        return;
      }
    } catch (e) {
      alert(`Save failed: ${e instanceof Error ? e.message : e}`);
      return;
    }

    setEditing(false);
    await fetchEmployees();
    const { data } = await supabase
      .from("employees")
      .select("*, location:locations(name)")
      .eq("id", selected.id)
      .single();
    if (data) setSelected(data);
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    const res = await supabase.functions.invoke("create-employee", {
      body: {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        role: addForm.role,
        department: addForm.department.trim() || null,
        title: addForm.title.trim() || null,
        worker_type: addForm.worker_type,
        location_id: addForm.location_id ? Number(addForm.location_id) : null,
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

    await fetchEmployees();
    if (selected?.id === employeeId) {
      const { data } = await supabase
        .from("employees")
        .select("*, location:locations(name)")
        .eq("id", employeeId)
        .single();
      if (data) setSelected(data);
    }
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

  /* ─── Availability CRUD ─── */

  function startEditAvailability() {
    // Build a full 7-day form, filling in existing data
    const form: Availability[] = DAY_NAMES.map((_, i) => {
      const existing = availability.find((a) => a.day_of_week === i);
      return existing
        ? { ...existing }
        : { id: 0, employee_id: selected!.id, day_of_week: i, start_time: "09:00", end_time: "17:00", is_available: true };
    });
    setAvailForm(form);
    setEditingAvail(true);
  }

  async function saveAvailability() {
    if (!selected) return;
    // Delete existing and re-insert
    await supabase.from("employee_availability").delete().eq("employee_id", selected.id);
    const inserts = availForm.map((a) => ({
      employee_id: selected.id,
      day_of_week: a.day_of_week,
      start_time: a.is_available ? a.start_time : null,
      end_time: a.is_available ? a.end_time : null,
      is_available: a.is_available,
    }));
    const { error } = await supabase.from("employee_availability").insert(inserts);
    if (error) {
      alert(`Error saving availability: ${error.message}`);
      return;
    }
    setEditingAvail(false);
    fetchAvailability(selected.id);
  }

  /* ─── Document CRUD ─── */

  async function initOnboarding() {
    if (!selected) return;
    const existing = documents.map((d) => d.doc_type);
    const toInsert = DEFAULT_ONBOARDING_DOCS
      .filter((d) => !existing.includes(d.doc_type))
      .map((d) => ({ employee_id: selected.id, ...d, status: "not_sent" as const }));
    if (toInsert.length === 0) return;
    await supabase.from("employee_documents").insert(toInsert);
    fetchDocuments(selected.id);
  }

  async function updateDocStatus(docId: number, status: "not_sent" | "sent" | "completed") {
    const update: Record<string, unknown> = { status };
    if (status === "sent") update.sent_at = new Date().toISOString();
    if (status === "completed") update.completed_at = new Date().toISOString();
    await supabase.from("employee_documents").update(update).eq("id", docId);
    if (selected) fetchDocuments(selected.id);
  }

  async function deleteDoc(docId: number) {
    await supabase.from("employee_documents").delete().eq("id", docId);
    if (selected) fetchDocuments(selected.id);
  }

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeCount },
    { key: "archived", label: "Archived", count: archivedCount },
    { key: "all", label: "All", count: employees.length },
  ];

  const detailTabs: { key: DetailTab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "availability", label: "Availability" },
    { key: "pay", label: "Pay" },
    { key: "leave", label: "Leave" },
    { key: "onboarding", label: "Onboarding" },
  ];

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* ─── Left Panel: List ─── */}
        <div className={`flex flex-col ${selected ? "w-1/2 xl:w-3/5" : "w-full"} transition-all`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-cream">Employees</h2>
              <p className="text-sm text-cream-muted mt-0.5">
                {activeCount} active &middot; {managerCount} manager{managerCount !== 1 ? "s" : ""} &middot; {usedDepartments.length} department{usedDepartments.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => { setShowAddModal(true); setAddError(""); setAddForm(emptyForm); }}
              className="px-4 py-2 bg-teal hover:bg-teal-dark text-cream rounded-lg text-sm font-medium transition-colors"
            >
              + Add Employee
            </button>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by name, email, department, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] bg-charcoal-mid border border-charcoal-light rounded-lg px-4 py-2 text-cream text-sm focus:outline-none focus:border-teal"
            />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="bg-charcoal-mid border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="bg-charcoal-mid border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm">
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
            <select value={filterWorkerType} onChange={(e) => setFilterWorkerType(e.target.value)} className="bg-charcoal-mid border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm">
              <option value="">All Types</option>
              {workerTypes.map((wt) => (
                <option key={wt.key} value={wt.key}>{wt.label}</option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-3">
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
                <span className="ml-1.5 text-xs opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Employee Cards */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filtered.map((emp) => (
              <button
                key={emp.id}
                onClick={() => { setSelected(emp); setEditing(false); setDetailTab("details"); }}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  selected?.id === emp.id
                    ? "bg-teal/10 border border-teal/30"
                    : "hover:bg-charcoal-mid border border-transparent"
                } ${!emp.is_active ? "opacity-50" : ""}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-cream shrink-0 ${getAvatarColor(emp.name)}`}>
                  {getInitials(emp.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-cream truncate">{emp.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[emp.role]}`}>{emp.role}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-charcoal-light text-cream-muted">{workerTypeLabel(emp.worker_type)}</span>
                    {!emp.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red/20 text-red border border-red/30">archived</span>
                    )}
                  </div>
                  <div className="text-xs text-cream-muted truncate mt-0.5">
                    {emp.title || emp.department || emp.email || "No details"}
                    {emp.location && <span className="ml-1 opacity-70">&middot; {emp.location.name}</span>}
                  </div>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-cream-muted">
                {search || filterRole || filterLocation ? "No employees match your filters." : "No employees found."}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Panel: Detail ─── */}
        {selected && (
          <div className="w-1/2 xl:w-2/5 border-l border-charcoal-light pl-6 ml-6 overflow-y-auto">
            {/* Close button */}
            <div className="flex justify-end mb-2">
              <button onClick={() => setSelected(null)} className="text-cream-muted hover:text-cream text-xl">&times;</button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-cream ${getAvatarColor(selected.name)}`}>
                {getInitials(selected.name)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-cream">{selected.name}</h3>
                <p className="text-sm text-cream-muted">{selected.title || "No title"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${ROLE_COLORS[selected.role]}`}>{selected.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    selected.is_active ? "bg-green/20 text-green border-green/30" : "bg-red/20 text-red border-red/30"
                  }`}>
                    {selected.is_active ? "Active" : "Archived"}
                  </span>
                </div>
              </div>
            </div>

            {/* Detail Tabs */}
            <div className="flex gap-1 mb-4 border-b border-charcoal-light pb-2">
              {detailTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${
                    detailTab === tab.key
                      ? "bg-teal/20 text-teal-light border-b-2 border-teal"
                      : "text-cream-muted hover:text-cream"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {detailTab === "details" && (
              <DetailsTab
                selected={selected}
                editing={editing}
                editForm={editForm}
                setEditForm={setEditForm}
                setEditing={setEditing}
                saveEdit={saveEdit}
                titles={titles}
                departments={departments}
                workerTypes={workerTypes}
                workerTypeLabel={workerTypeLabel}
                locations={locations}
                actionLoading={actionLoading}
                handleResetPassword={handleResetPassword}
                handleArchiveRestore={handleArchiveRestore}
              />
            )}

            {detailTab === "availability" && (
              <AvailabilityTab
                availability={availability}
                editingAvail={editingAvail}
                availForm={availForm}
                setAvailForm={setAvailForm}
                startEditAvailability={startEditAvailability}
                saveAvailability={saveAvailability}
                setEditingAvail={setEditingAvail}
              />
            )}

            {detailTab === "pay" && (
              <PayTab
                selected={selected}
                editing={editing}
                editForm={editForm}
                setEditForm={setEditForm}
                setEditing={setEditing}
                saveEdit={saveEdit}
              />
            )}

            {detailTab === "leave" && (
              <LeaveTab
                leaveBalances={leaveBalances}
                leaveTypes={leaveTypes}
                employeeName={selected.name}
              />
            )}

            {detailTab === "onboarding" && (
              <OnboardingTab
                documents={documents}
                initOnboarding={initOnboarding}
                updateDocStatus={updateDocStatus}
                deleteDoc={deleteDoc}
              />
            )}
          </div>
        )}
      </div>

      {/* ─── Add Employee Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="bg-charcoal-mid border border-charcoal-light rounded-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-cream">Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="text-cream-muted hover:text-cream text-xl">&times;</button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-red/10 border border-red/30 rounded-lg text-red text-sm">{addError}</div>
            )}

            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="block text-xs text-cream-muted mb-1">Full Name *</label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className={inputClass} placeholder="e.g. Jane Smith" required />
              </div>
              <div>
                <label className="block text-xs text-cream-muted mb-1">Email *</label>
                <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className={inputClass} placeholder="jane@joypers.com" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-cream-muted mb-1">Role</label>
                  <select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })} className={inputClass}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-cream-muted mb-1">Worker Type</label>
                  <select value={addForm.worker_type} onChange={(e) => setAddForm({ ...addForm, worker_type: e.target.value })} className={inputClass}>
                    {workerTypes.map((wt) => (
                      <option key={wt.key} value={wt.key}>{wt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-cream-muted mb-1">Department</label>
                  <select value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} className={inputClass}>
                    <option value="">No Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-cream-muted mb-1">Title</label>
                  <select value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} className={inputClass}>
                    <option value="">No Title</option>
                    {titles.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-cream-muted mb-1">Location</label>
                <select value={addForm.location_id} onChange={(e) => setAddForm({ ...addForm, location_id: e.target.value })} className={inputClass}>
                  <option value="">No Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-cream-muted">
                The employee will be created with the default password and required to change it on first login.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-cream-muted text-sm hover:text-cream transition-colors">Cancel</button>
                <button type="submit" disabled={addLoading} className="px-4 py-2 bg-teal hover:bg-teal-dark text-cream rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
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

/* ─── Detail Tab: Details ─── */

function DetailsTab({
  selected, editing, editForm, setEditForm, setEditing, saveEdit,
  titles, departments, workerTypes, workerTypeLabel, locations,
  actionLoading, handleResetPassword, handleArchiveRestore,
}: {
  selected: Employee;
  editing: boolean;
  editForm: Partial<Employee>;
  setEditForm: (f: Partial<Employee>) => void;
  setEditing: (b: boolean) => void;
  saveEdit: () => void;
  titles: string[];
  departments: string[];
  workerTypes: WorkerTypeOption[];
  workerTypeLabel: (k: string) => string;
  locations: Location[];
  actionLoading: string | null;
  handleResetPassword: (id: string, name: string) => void;
  handleArchiveRestore: (id: string, action: "disable" | "enable") => void;
}) {
  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex gap-2 flex-wrap">
        {!editing ? (
          <button onClick={() => { setEditing(true); setEditForm(selected); }} className="px-4 py-2 bg-teal/20 text-teal-light rounded-lg text-sm hover:bg-teal/30 transition-colors">
            Edit Details
          </button>
        ) : (
          <>
            <button onClick={saveEdit} className="px-4 py-2 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark">Save</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-charcoal-light text-cream-muted rounded-lg text-sm hover:text-cream">Cancel</button>
          </>
        )}
        <button onClick={() => handleResetPassword(selected.id, selected.name)} disabled={actionLoading === selected.id} className="px-4 py-2 bg-amber/10 text-amber rounded-lg text-sm hover:bg-amber/20 transition-colors disabled:opacity-50">
          Reset Password
        </button>
        {selected.is_active ? (
          <button
            onClick={() => { if (confirm(`Archive ${selected.name}? They will not be able to log in.`)) handleArchiveRestore(selected.id, "disable"); }}
            disabled={actionLoading === selected.id}
            className="px-4 py-2 bg-red/10 text-red rounded-lg text-sm hover:bg-red/20 transition-colors disabled:opacity-50"
          >
            Archive
          </button>
        ) : (
          <button
            onClick={() => { if (confirm(`Restore ${selected.name}? They will be able to log in again.`)) handleArchiveRestore(selected.id, "enable"); }}
            disabled={actionLoading === selected.id}
            className="px-4 py-2 bg-green/10 text-green rounded-lg text-sm hover:bg-green/20 transition-colors disabled:opacity-50"
          >
            Restore
          </button>
        )}
      </div>

      <DetailSection title="Contact">
        {editing ? (
          <>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Name</label>
              <input type="text" value={editForm.name ?? selected.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Email</label>
              <input type="email" value={editForm.email ?? selected.email ?? ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className={inputClass} />
            </div>
          </>
        ) : (
          <>
            <DetailField label="Name" value={selected.name} />
            <DetailField label="Email" value={selected.email || "-"} />
          </>
        )}
      </DetailSection>

      <DetailSection title="Employment">
        {editing ? (
          <>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Role</label>
              <select value={editForm.role || selected.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className={inputClass}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Title</label>
              <select value={editForm.title ?? selected.title ?? ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputClass}>
                <option value="">No Title</option>
                {titles.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Department</label>
              <select value={editForm.department ?? selected.department ?? ""} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className={inputClass}>
                <option value="">No Department</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Worker Type</label>
              <select value={editForm.worker_type || selected.worker_type} onChange={(e) => setEditForm({ ...editForm, worker_type: e.target.value })} className={inputClass}>
                {workerTypes.map((wt) => <option key={wt.key} value={wt.key}>{wt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Location</label>
              <select
                value={editForm.location_id !== undefined ? (editForm.location_id ?? "") : (selected.location_id ?? "")}
                onChange={(e) => setEditForm({ ...editForm, location_id: e.target.value ? Number(e.target.value) : null })}
                className={inputClass}
              >
                <option value="">No Location</option>
                {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
          </>
        ) : (
          <>
            <DetailField label="Role" value={selected.role} />
            <DetailField label="Title" value={selected.title || "-"} />
            <DetailField label="Department" value={selected.department || "-"} />
            <DetailField label="Worker Type" value={workerTypeLabel(selected.worker_type)} />
            <DetailField label="Location" value={selected.location?.name || "-"} />
          </>
        )}
      </DetailSection>

      <DetailSection title="Dates">
        {editing ? (
          <>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Hire Date</label>
              <input type="date" value={editForm.hire_date ?? selected.hire_date ?? ""} onChange={(e) => setEditForm({ ...editForm, hire_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Birthday</label>
              <input type="date" value={editForm.birthday ?? selected.birthday ?? ""} onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })} className={inputClass} />
            </div>
          </>
        ) : (
          <>
            <DetailField label="Hire Date" value={formatDate(selected.hire_date)} />
            {selected.hire_date && <DetailField label="Tenure" value={tenure(selected.hire_date)} />}
            <DetailField label="Birthday" value={formatDate(selected.birthday)} />
          </>
        )}
      </DetailSection>
    </div>
  );
}

/* ─── Detail Tab: Availability ─── */

function AvailabilityTab({
  availability, editingAvail, availForm, setAvailForm,
  startEditAvailability, saveAvailability, setEditingAvail,
}: {
  availability: Availability[];
  editingAvail: boolean;
  availForm: Availability[];
  setAvailForm: (f: Availability[]) => void;
  startEditAvailability: () => void;
  saveAvailability: () => void;
  setEditingAvail: (b: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-cream">Weekly Availability</h4>
        {!editingAvail ? (
          <button onClick={startEditAvailability} className="px-3 py-1.5 bg-teal/20 text-teal-light rounded-lg text-sm hover:bg-teal/30 transition-colors">
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={saveAvailability} className="px-3 py-1.5 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark">Save</button>
            <button onClick={() => setEditingAvail(false)} className="px-3 py-1.5 bg-charcoal-light text-cream-muted rounded-lg text-sm hover:text-cream">Cancel</button>
          </div>
        )}
      </div>

      {editingAvail ? (
        <div className="space-y-2">
          {availForm.map((day, i) => (
            <div key={i} className="flex items-center gap-3 bg-charcoal-mid rounded-lg border border-charcoal-light p-3">
              <div className="w-10 text-sm font-medium text-cream">{DAY_NAMES[i]}</div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={day.is_available}
                  onChange={(e) => {
                    const updated = [...availForm];
                    updated[i] = { ...updated[i], is_available: e.target.checked };
                    setAvailForm(updated);
                  }}
                  className="accent-teal"
                />
                <span className="text-xs text-cream-muted">Available</span>
              </label>
              {day.is_available && (
                <>
                  <input
                    type="time"
                    value={day.start_time || "09:00"}
                    onChange={(e) => {
                      const updated = [...availForm];
                      updated[i] = { ...updated[i], start_time: e.target.value };
                      setAvailForm(updated);
                    }}
                    className="bg-charcoal-light border border-charcoal-light rounded px-2 py-1 text-cream text-sm"
                  />
                  <span className="text-cream-muted text-xs">to</span>
                  <input
                    type="time"
                    value={day.end_time || "17:00"}
                    onChange={(e) => {
                      const updated = [...availForm];
                      updated[i] = { ...updated[i], end_time: e.target.value };
                      setAvailForm(updated);
                    }}
                    className="bg-charcoal-light border border-charcoal-light rounded px-2 py-1 text-cream text-sm"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {availability.length === 0 ? (
            <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 text-center">
              <p className="text-cream-muted text-sm">No availability set yet.</p>
              <button onClick={startEditAvailability} className="mt-2 text-teal-light text-sm hover:underline">
                Set up availability
              </button>
            </div>
          ) : (
            DAY_NAMES.map((name, i) => {
              const day = availability.find((a) => a.day_of_week === i);
              const available = day?.is_available ?? false;
              return (
                <div key={i} className={`flex items-center gap-3 rounded-lg px-4 py-2.5 ${
                  available ? "bg-charcoal-mid border border-charcoal-light" : "bg-charcoal-mid/50 border border-charcoal-light/30"
                }`}>
                  <span className="w-10 text-sm font-medium text-cream">{name}</span>
                  {available ? (
                    <span className="text-sm text-green">
                      {formatTime12(day?.start_time || null)} - {formatTime12(day?.end_time || null)}
                    </span>
                  ) : (
                    <span className="text-sm text-cream-muted/50">Unavailable</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Detail Tab: Pay ─── */

function PayTab({
  selected, editing, editForm, setEditForm, setEditing, saveEdit,
}: {
  selected: Employee;
  editing: boolean;
  editForm: Partial<Employee>;
  setEditForm: (f: Partial<Employee>) => void;
  setEditing: (b: boolean) => void;
  saveEdit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-cream">Compensation</h4>
        {!editing ? (
          <button onClick={() => { setEditing(true); setEditForm(selected); }} className="px-3 py-1.5 bg-teal/20 text-teal-light rounded-lg text-sm hover:bg-teal/30 transition-colors">
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={saveEdit} className="px-3 py-1.5 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark">Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-charcoal-light text-cream-muted rounded-lg text-sm hover:text-cream">Cancel</button>
          </div>
        )}
      </div>

      <DetailSection title="Pay Information">
        {editing ? (
          <>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">Pay Type</label>
              <select
                value={editForm.pay_type ?? selected.pay_type ?? "hourly"}
                onChange={(e) => setEditForm({ ...editForm, pay_type: e.target.value })}
                className={inputClass}
              >
                <option value="hourly">Hourly</option>
                <option value="salary">Salary</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cream-muted mb-1 block">
                {(editForm.pay_type ?? selected.pay_type) === "salary" ? "Annual Salary ($)" : "Hourly Rate ($)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.pay_rate ?? selected.pay_rate ?? ""}
                onChange={(e) => setEditForm({ ...editForm, pay_rate: e.target.value })}
                className={inputClass}
                placeholder={(editForm.pay_type ?? selected.pay_type) === "salary" ? "e.g. 45000" : "e.g. 15.50"}
              />
            </div>
          </>
        ) : (
          <>
            <DetailField label="Pay Type" value={selected.pay_type === "salary" ? "Salary" : "Hourly"} />
            <DetailField
              label={selected.pay_type === "salary" ? "Annual Salary" : "Hourly Rate"}
              value={selected.pay_rate ? `$${Number(selected.pay_rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Not set"}
            />
            {selected.pay_type === "hourly" && selected.pay_rate && (
              <DetailField
                label="Est. Annual (40hr/wk)"
                value={`$${(Number(selected.pay_rate) * 40 * 52).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              />
            )}
          </>
        )}
      </DetailSection>

      <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-4">
        <p className="text-xs text-cream-muted">
          Pay information is visible only to administrators and managers. Changes are logged for audit purposes.
        </p>
      </div>
    </div>
  );
}

/* ─── Detail Tab: Leave ─── */

function LeaveTab({
  leaveBalances, leaveTypes, employeeName,
}: {
  leaveBalances: LeaveBalance[];
  leaveTypes: LeaveType[];
  employeeName: string;
}) {
  function getTypeName(typeId: number): string {
    return leaveTypes.find((t) => t.id === typeId)?.name || `Type ${typeId}`;
  }

  const sickLeave = leaveBalances.find((b) => {
    const name = getTypeName(b.leave_type_id).toLowerCase();
    return name.includes("sick");
  });

  const vacationLeave = leaveBalances.find((b) => {
    const name = getTypeName(b.leave_type_id).toLowerCase();
    return name.includes("vacation") || name.includes("annual") || name.includes("pto");
  });

  const otherBalances = leaveBalances.filter((b) => b !== sickLeave && b !== vacationLeave);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-cream">Leave Balances for {employeeName}</h4>

      {leaveBalances.length === 0 && leaveTypes.length === 0 ? (
        <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 text-center">
          <p className="text-cream-muted text-sm">No leave types configured.</p>
          <p className="text-cream-muted/60 text-xs mt-1">Set up leave types in the database to track balances.</p>
        </div>
      ) : leaveBalances.length === 0 ? (
        <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 text-center">
          <p className="text-cream-muted text-sm">No leave balance recorded yet.</p>
          <p className="text-cream-muted/60 text-xs mt-1">Balances accrue automatically on the 1st and 15th.</p>
        </div>
      ) : (
        <>
          {/* Primary balances */}
          <div className="grid grid-cols-2 gap-3">
            <LeaveBalanceCard
              label="Sick Leave"
              hours={sickLeave ? Number(sickLeave.balance) : 0}
              color="rose"
              hasData={!!sickLeave}
            />
            <LeaveBalanceCard
              label="Vacation"
              hours={vacationLeave ? Number(vacationLeave.balance) : 0}
              color="teal"
              hasData={!!vacationLeave}
            />
          </div>

          {/* Other balances */}
          {otherBalances.length > 0 && (
            <DetailSection title="Other Leave Types">
              {otherBalances.map((b) => (
                <DetailField
                  key={b.leave_type_id}
                  label={getTypeName(b.leave_type_id)}
                  value={`${Number(b.balance).toFixed(1)} hrs`}
                />
              ))}
            </DetailSection>
          )}
        </>
      )}

      <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-4">
        <p className="text-xs text-cream-muted">
          Leave balances accrue on the 1st and 15th of each month via the scheduled accrual job. Balances are adjusted automatically when leave requests are approved.
        </p>
      </div>
    </div>
  );
}

function LeaveBalanceCard({ label, hours, color, hasData }: { label: string; hours: number; color: string; hasData: boolean }) {
  const colorClasses: Record<string, string> = {
    rose: "border-rose/30 bg-rose/10",
    teal: "border-teal/30 bg-teal/10",
  };

  return (
    <div className={`rounded-xl border p-4 ${hasData ? colorClasses[color] || "border-charcoal-light bg-charcoal-mid" : "border-charcoal-light bg-charcoal-mid"}`}>
      <p className="text-xs text-cream-muted mb-1">{label}</p>
      {hasData ? (
        <>
          <p className="text-2xl font-bold text-cream">{hours.toFixed(1)}</p>
          <p className="text-xs text-cream-muted">hours available</p>
        </>
      ) : (
        <p className="text-sm text-cream-muted/50">N/A</p>
      )}
    </div>
  );
}

/* ─── Detail Tab: Onboarding ─── */

function OnboardingTab({
  documents, initOnboarding, updateDocStatus, deleteDoc,
}: {
  documents: EmployeeDocument[];
  initOnboarding: () => void;
  updateDocStatus: (id: number, status: "not_sent" | "sent" | "completed") => void;
  deleteDoc: (id: number) => void;
}) {
  const completedCount = documents.filter((d) => d.status === "completed").length;
  const progress = documents.length > 0 ? Math.round((completedCount / documents.length) * 100) : 0;

  const statusColors: Record<string, string> = {
    not_sent: "bg-charcoal-light text-cream-muted",
    sent: "bg-amber/20 text-amber",
    completed: "bg-green/20 text-green",
  };

  const statusLabels: Record<string, string> = {
    not_sent: "Not Sent",
    sent: "Sent",
    completed: "Completed",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-cream">Onboarding Documents</h4>
        {documents.length === 0 && (
          <button onClick={initOnboarding} className="px-3 py-1.5 bg-teal/20 text-teal-light rounded-lg text-sm hover:bg-teal/30 transition-colors">
            Initialize Checklist
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 text-center">
          <p className="text-cream-muted text-sm">No onboarding documents set up yet.</p>
          <p className="text-cream-muted/60 text-xs mt-1">Click &quot;Initialize Checklist&quot; to create the standard document set.</p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-cream-muted">Progress</span>
              <span className="text-xs text-cream font-medium">{completedCount}/{documents.length} completed ({progress}%)</span>
            </div>
            <div className="w-full bg-charcoal-light rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${progress === 100 ? "bg-green" : "bg-teal"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Document List */}
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-charcoal-mid rounded-xl border border-charcoal-light p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-cream font-medium">{doc.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[doc.status]}`}>
                      {statusLabels[doc.status]}
                    </span>
                  </div>
                  <button onClick={() => deleteDoc(doc.id)} className="text-cream-muted/40 hover:text-red text-xs">remove</button>
                </div>

                <div className="flex items-center gap-2 text-xs text-cream-muted">
                  {doc.sent_at && <span>Sent: {formatDateTime(doc.sent_at)}</span>}
                  {doc.completed_at && <span>Completed: {formatDateTime(doc.completed_at)}</span>}
                </div>

                <div className="flex gap-2 mt-2">
                  {doc.status === "not_sent" && (
                    <button
                      onClick={() => updateDocStatus(doc.id, "sent")}
                      className="px-3 py-1 bg-amber/10 text-amber rounded text-xs hover:bg-amber/20 transition-colors"
                    >
                      Mark as Sent
                    </button>
                  )}
                  {doc.status === "sent" && (
                    <button
                      onClick={() => updateDocStatus(doc.id, "completed")}
                      className="px-3 py-1 bg-green/10 text-green rounded text-xs hover:bg-green/20 transition-colors"
                    >
                      Mark as Completed
                    </button>
                  )}
                  {doc.status !== "not_sent" && (
                    <button
                      onClick={() => updateDocStatus(doc.id, "not_sent")}
                      className="px-3 py-1 bg-charcoal-light text-cream-muted rounded text-xs hover:text-cream transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add more button */}
          <button onClick={initOnboarding} className="w-full py-2 text-sm text-cream-muted hover:text-cream hover:bg-charcoal-mid rounded-lg border border-dashed border-charcoal-light transition-colors">
            + Add Missing Documents
          </button>
        </>
      )}
    </div>
  );
}

/* ─── Shared Sub-components ─── */

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-4">
      <h4 className="text-xs font-semibold text-cream-muted uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-cream-muted">{label}</span>
      <span className="text-sm text-cream">{value}</span>
    </div>
  );
}
