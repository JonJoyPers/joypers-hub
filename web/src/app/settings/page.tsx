"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

/* ─── Types ─── */

interface Location {
  id: number;
  name: string;
  address: string | null;
  timezone: string;
  is_active: boolean;
}

type Section = "business" | "locations" | "scheduling" | "roles" | "notifications";

type Settings = Record<string, string>;

/* ─── Constants ─── */

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Indianapolis",
  "America/Detroit",
  "America/Boise",
];

const SHIFT_TYPES = [
  { key: "opening", label: "Opening", color: "bg-teal/20 text-teal-light border-teal/30" },
  { key: "mid", label: "Mid", color: "bg-amber/20 text-amber border-amber/30" },
  { key: "closing", label: "Closing", color: "bg-violet/20 text-violet border-violet/30" },
  { key: "inventory", label: "Inventory", color: "bg-rose/20 text-rose border-rose/30" },
  { key: "part_time", label: "Part Time", color: "bg-cream-muted/20 text-cream-muted border-cream-muted/30" },
];

const SECTIONS: { key: Section; label: string; icon: string; description: string }[] = [
  { key: "business", label: "Business", icon: "🏢", description: "Company details and branding" },
  { key: "locations", label: "Locations", icon: "🌐", description: "Manage store locations and timezones" },
  { key: "scheduling", label: "Scheduling", icon: "📅", description: "Shift types and default hours" },
  { key: "roles", label: "Roles & Titles", icon: "🏷", description: "Job titles, departments, and worker types" },
  { key: "notifications", label: "Notifications", icon: "🔔", description: "Push notification preferences" },
];

const SHIFT_COLORS: { key: string; classes: string }[] = [
  { key: "teal", classes: "bg-teal/20 text-teal-light border-teal/30" },
  { key: "amber", classes: "bg-amber/20 text-amber border-amber/30" },
  { key: "violet", classes: "bg-violet/20 text-violet border-violet/30" },
  { key: "rose", classes: "bg-rose/20 text-rose border-rose/30" },
  { key: "cream-muted", classes: "bg-cream-muted/20 text-cream-muted border-cream-muted/30" },
  { key: "green", classes: "bg-green/20 text-green border-green/30" },
  { key: "red", classes: "bg-red/20 text-red border-red/30" },
  { key: "blue", classes: "bg-blue/20 text-blue border-blue/30" },
];

function shiftColorClasses(color: string): string {
  return SHIFT_COLORS.find((c) => c.key === color)?.classes || SHIFT_COLORS[0].classes;
}

const PERMISSION_GROUPS = [
  {
    label: "Schedule",
    permissions: [
      { key: "viewSchedule", label: "View schedule" },
      { key: "manageSchedule", label: "Create & edit shifts" },
      { key: "publishSchedule", label: "Publish schedule" },
      { key: "manageClosures", label: "Manage store closures" },
    ],
  },
  {
    label: "Timesheets",
    permissions: [
      { key: "viewTimesheets", label: "View timesheets" },
      { key: "editTimesheets", label: "Edit & approve timesheets" },
      { key: "exportTimesheets", label: "Export timesheets" },
    ],
  },
  {
    label: "Leave",
    permissions: [
      { key: "viewLeave", label: "View & request leave" },
      { key: "approveLeave", label: "Approve & deny leave" },
    ],
  },
  {
    label: "People",
    permissions: [
      { key: "viewDirectory", label: "View employee directory" },
      { key: "viewEmployees", label: "View employee details" },
      { key: "manageEmployees", label: "Add, edit & archive employees" },
    ],
  },
  {
    label: "Content",
    permissions: [
      { key: "manageBulletins", label: "Create & manage bulletins" },
      { key: "viewManual", label: "View employee manual" },
      { key: "editManual", label: "Edit employee manual" },
    ],
  },
  {
    label: "Administration",
    permissions: [
      { key: "viewSettings", label: "View settings" },
      { key: "manageSettings", label: "Manage settings" },
    ],
  },
];

const inputClass =
  "bg-charcoal-light border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm w-full focus:border-teal focus:outline-none";
const btnPrimary =
  "px-4 py-2 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark transition-colors";
const btnDanger =
  "px-4 py-2 bg-red/80 text-cream rounded-lg text-sm hover:bg-red transition-colors";
const btnSecondary =
  "px-4 py-2 bg-charcoal-light text-cream-muted rounded-lg text-sm hover:text-cream transition-colors";

/* ─── Defaults ─── */

const DEFAULT_SETTINGS: Settings = {
  "business.companyName": "Joy-Per's Shoes",
  "business.phone": "",
  "business.email": "",
  "business.address": "",
  "business.defaultTimezone": "America/Chicago",
  "schedule.weekStartsOn": "monday",
  "schedule.overtimeAfter": "40",
  "schedule.shiftTypes": JSON.stringify([
    { key: "opening", label: "Opening", color: "teal", startTime: "09:00", endTime: "17:00" },
    { key: "mid", label: "Mid", color: "amber", startTime: "11:00", endTime: "19:00" },
    { key: "closing", label: "Closing", color: "violet", startTime: "13:00", endTime: "21:00" },
    { key: "inventory", label: "Inventory", color: "rose", startTime: "09:00", endTime: "17:00" },
    { key: "part_time", label: "Part Time", color: "cream-muted", startTime: "10:00", endTime: "14:00" },
  ]),
  "roles.titles": JSON.stringify(["Store Manager", "Floor Manager", "Social Media Marketing Manager", "Floor Lead", "Associate", "Inventory", "Temp"]),
  "roles.departments": JSON.stringify(["Sales Floor", "Back Room"]),
  "roles.systemRoles": JSON.stringify([
    { key: "admin", label: "Admin", description: "Full access to all features, settings, and employee management." },
    { key: "manager", label: "Manager", description: "Can manage schedules, approve leave, view timesheets, and manage employees." },
    { key: "employee", label: "Employee", description: "Can view own schedule, clock in/out, request leave, and view directory." },
  ]),
  "roles.workerTypes": JSON.stringify([
    { key: "in_store", label: "In-Store", description: "Works on-site at a store location" },
    { key: "remote", label: "Remote", description: "Works remotely" },
    { key: "both", label: "Both", description: "Splits time between on-site and remote" },
  ]),
  "roles.permissions": JSON.stringify({
    manager: {
      viewSchedule: true, manageSchedule: true, publishSchedule: true,
      viewTimesheets: true, editTimesheets: true, exportTimesheets: true,
      viewLeave: true, approveLeave: true,
      viewEmployees: true, manageEmployees: true,
      viewDirectory: true,
      manageBulletins: true,
      viewManual: true, editManual: true,
      manageClosures: true,
      viewSettings: false, manageSettings: false,
    },
    employee: {
      viewSchedule: true, manageSchedule: false, publishSchedule: false,
      viewTimesheets: false, editTimesheets: false, exportTimesheets: false,
      viewLeave: true, approveLeave: false,
      viewEmployees: false, manageEmployees: false,
      viewDirectory: true,
      manageBulletins: false,
      viewManual: true, editManual: false,
      manageClosures: false,
      viewSettings: false, manageSettings: false,
    },
  }),
  "notif.shiftPublished": "true",
  "notif.shiftChanged": "true",
  "notif.leaveApproved": "true",
  "notif.leaveSubmitted": "true",
  "notif.timesheetReminder": "true",
  "notif.newBulletin": "true",
};

/* ─── Main Component ─── */

export default function SettingsPage() {
  const supabase = createClient();
  const [section, setSection] = useState<Section>("business");
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS });
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // ── Location state ──
  const [locations, setLocations] = useState<Location[]>([]);
  const [locEditing, setLocEditing] = useState<number | null>(null);
  const [showLocAdd, setShowLocAdd] = useState(false);
  const [locForm, setLocForm] = useState({ name: "", address: "", timezone: "America/Chicago" });
  const [locEditForm, setLocEditForm] = useState({ name: "", address: "", timezone: "" });
  const [locSaving, setLocSaving] = useState(false);

  // ── Shift types editing state ──
  const [editingShiftType, setEditingShiftType] = useState<string | null>(null);
  const [newShiftType, setNewShiftType] = useState({ label: "", color: "teal", startTime: "09:00", endTime: "17:00" });

  // ── Roles editing state ──
  const [newTitle, setNewTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newWorkerType, setNewWorkerType] = useState({ label: "", description: "" });
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingWorkerType, setEditingWorkerType] = useState<string | null>(null);

  // ── Load settings from DB ──

  async function fetchSettings() {
    const { data } = await supabase.from("app_settings").select("key, value");
    if (data && data.length > 0) {
      const loaded = { ...DEFAULT_SETTINGS };
      for (const row of data) {
        loaded[row.key] = row.value;
      }
      setSettings(loaded);
    }
  }

  async function fetchLocations() {
    const { data } = await supabase
      .from("locations")
      .select("id, name, address, timezone, is_active")
      .order("name");
    setLocations(data || []);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchSettings(); fetchLocations(); }, []);

  // ── Setting helpers ──

  function getSetting(key: string): string {
    return settings[key] ?? DEFAULT_SETTINGS[key] ?? "";
  }

  function setSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaveStatus("idle");
  }

  function getSettingBool(key: string): boolean {
    return getSetting(key) === "true";
  }

  function getSettingJson<T>(key: string): T {
    try { return JSON.parse(getSetting(key)); }
    catch { return [] as T; }
  }

  function setSettingJson(key: string, value: unknown) {
    setSetting(key, JSON.stringify(value));
  }

  async function saveSettings() {
    setSaveStatus("saving");
    // Upsert all changed settings
    const rows = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));

    for (const row of rows) {
      const { error } = await supabase
        .from("app_settings")
        .upsert(row, { onConflict: "key" });
      if (error) {
        alert(`Error saving ${row.key}: ${error.message}`);
        setSaveStatus("idle");
        return;
      }
    }

    setDirty(false);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  // ── Location CRUD ──

  async function addLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!locForm.name.trim()) return;
    setLocSaving(true);
    const { error } = await supabase.from("locations").insert({
      name: locForm.name.trim(),
      address: locForm.address.trim() || null,
      timezone: locForm.timezone,
    });
    setLocSaving(false);
    if (error) { alert(`Error: ${error.message}`); return; }
    setLocForm({ name: "", address: "", timezone: "America/Chicago" });
    setShowLocAdd(false);
    fetchLocations();
  }

  function startLocEdit(loc: Location) {
    setLocEditing(loc.id);
    setLocEditForm({ name: loc.name, address: loc.address || "", timezone: loc.timezone });
  }

  async function saveLocEdit(id: number) {
    if (!locEditForm.name.trim()) return;
    setLocSaving(true);
    const { error } = await supabase
      .from("locations")
      .update({ name: locEditForm.name.trim(), address: locEditForm.address.trim() || null, timezone: locEditForm.timezone })
      .eq("id", id);
    setLocSaving(false);
    if (error) { alert(`Error: ${error.message}`); return; }
    setLocEditing(null);
    fetchLocations();
  }

  async function toggleLocActive(loc: Location) {
    const { error } = await supabase.from("locations").update({ is_active: !loc.is_active }).eq("id", loc.id);
    if (error) { alert(`Error: ${error.message}`); return; }
    fetchLocations();
  }

  async function deleteLocation(id: number) {
    if (!confirm("Delete this location? This cannot be undone.")) return;
    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) { alert(`Error: ${error.message}`); return; }
    fetchLocations();
  }

  // ── Shift type helpers ──

  interface ShiftTypeItem { key: string; label: string; color: string; startTime: string; endTime: string }
  const shiftTypes: ShiftTypeItem[] = getSettingJson("schedule.shiftTypes");

  function updateShiftType(key: string, field: keyof ShiftTypeItem, value: string) {
    setSettingJson("schedule.shiftTypes", shiftTypes.map((st) => st.key === key ? { ...st, [field]: value } : st));
  }

  function addShiftType() {
    if (!newShiftType.label.trim()) return;
    const key = newShiftType.label.trim().toLowerCase().replace(/\s+/g, "_");
    if (shiftTypes.some((st) => st.key === key)) return;
    setSettingJson("schedule.shiftTypes", [...shiftTypes, { key, ...newShiftType, label: newShiftType.label.trim() }]);
    setNewShiftType({ label: "", color: "teal", startTime: "09:00", endTime: "17:00" });
  }

  function removeShiftType(key: string) {
    setSettingJson("schedule.shiftTypes", shiftTypes.filter((st) => st.key !== key));
  }

  // ── Roles helpers ──

  const titles: string[] = getSettingJson("roles.titles");
  const departments: string[] = getSettingJson("roles.departments");

  interface RoleItem { key: string; label: string; description: string }
  interface WorkerTypeItem { key: string; label: string; description: string }

  const systemRoles: RoleItem[] = getSettingJson("roles.systemRoles");
  const workerTypes: WorkerTypeItem[] = getSettingJson("roles.workerTypes");

  function addTitle() {
    if (!newTitle.trim() || titles.includes(newTitle.trim())) return;
    setSettingJson("roles.titles", [...titles, newTitle.trim()]);
    setNewTitle("");
  }

  function removeTitle(t: string) {
    setSettingJson("roles.titles", titles.filter((x) => x !== t));
  }

  function addDepartment() {
    if (!newDepartment.trim() || departments.includes(newDepartment.trim())) return;
    setSettingJson("roles.departments", [...departments, newDepartment.trim()]);
    setNewDepartment("");
  }

  function removeDepartment(d: string) {
    setSettingJson("roles.departments", departments.filter((x) => x !== d));
  }

  function updateRole(key: string, field: "label" | "description", value: string) {
    setSettingJson("roles.systemRoles", systemRoles.map((r) => r.key === key ? { ...r, [field]: value } : r));
  }

  // ── Permissions helpers ──

  type PermissionMap = Record<string, Record<string, boolean>>;
  const permissions: PermissionMap = getSettingJson("roles.permissions");

  function togglePermission(role: string, perm: string) {
    const updated = { ...permissions };
    updated[role] = { ...updated[role], [perm]: !updated[role]?.[perm] };
    setSettingJson("roles.permissions", updated);
  }

  function addWorkerType() {
    if (!newWorkerType.label.trim()) return;
    const key = newWorkerType.label.trim().toLowerCase().replace(/\s+/g, "_");
    if (workerTypes.some((w) => w.key === key)) return;
    setSettingJson("roles.workerTypes", [...workerTypes, { key, label: newWorkerType.label.trim(), description: newWorkerType.description.trim() }]);
    setNewWorkerType({ label: "", description: "" });
  }

  function updateWorkerType(key: string, field: "label" | "description", value: string) {
    setSettingJson("roles.workerTypes", workerTypes.map((w) => w.key === key ? { ...w, [field]: value } : w));
  }

  function removeWorkerType(key: string) {
    setSettingJson("roles.workerTypes", workerTypes.filter((w) => w.key !== key));
  }

  // ── Save button component ──

  function SaveButton() {
    return (
      <div className="flex justify-end pt-4">
        <button
          onClick={saveSettings}
          disabled={saveStatus === "saving"}
          className={
            saveStatus === "saved"
              ? "px-4 py-2 bg-green-700/30 text-green-400 rounded-lg text-sm border border-green-700/50"
              : saveStatus === "saving"
              ? "px-4 py-2 bg-teal/50 text-cream rounded-lg text-sm"
              : btnPrimary
          }
        >
          {saveStatus === "saved" ? "\u2713 Saved" : saveStatus === "saving" ? "Saving..." : "Save Changes"}
        </button>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* ─── Settings Sidebar ─── */}
        <div className="w-64 shrink-0 pr-6 border-r border-charcoal-light/30 mr-6">
          <h2 className="text-2xl font-bold text-cream mb-1">Settings</h2>
          <p className="text-xs text-cream-muted mb-6">Manage your workspace</p>

          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  section === s.key
                    ? "bg-teal/10 text-teal-light border border-teal/20"
                    : "text-cream-muted hover:bg-charcoal-light/50 hover:text-cream border border-transparent"
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <div>
                  <div className="font-medium">{s.label}</div>
                  <div className="text-[10px] opacity-60 leading-tight">{s.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* ─── Content Area ─── */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Business ── */}
          {section === "business" && (
            <div className="max-w-2xl">
              <SectionHeader title="Business Details" subtitle="Your company information and defaults." />

              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 space-y-5">
                <div>
                  <label className="text-xs text-cream-muted mb-1 block">Company Name</label>
                  <input value={getSetting("business.companyName")} onChange={(e) => setSetting("business.companyName", e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-cream-muted mb-1 block">Phone</label>
                    <input value={getSetting("business.phone")} onChange={(e) => setSetting("business.phone", e.target.value)} className={inputClass} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="text-xs text-cream-muted mb-1 block">Email</label>
                    <input value={getSetting("business.email")} onChange={(e) => setSetting("business.email", e.target.value)} className={inputClass} placeholder="info@joypers.com" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-cream-muted mb-1 block">Address</label>
                  <input value={getSetting("business.address")} onChange={(e) => setSetting("business.address", e.target.value)} className={inputClass} placeholder="123 Main St, City, State" />
                </div>
                <div>
                  <label className="text-xs text-cream-muted mb-1 block">Default Timezone</label>
                  <select value={getSetting("business.defaultTimezone")} onChange={(e) => setSetting("business.defaultTimezone", e.target.value)} className={inputClass}>
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{formatTz(tz)}</option>
                    ))}
                  </select>
                </div>
                <SaveButton />
              </div>
            </div>
          )}

          {/* ── Locations ── */}
          {section === "locations" && (
            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Locations" subtitle="Manage your store locations, addresses, and timezones." />
                <button onClick={() => setShowLocAdd(!showLocAdd)} className={btnPrimary}>+ Add Location</button>
              </div>

              {showLocAdd && (
                <form onSubmit={addLocation} className="bg-charcoal-mid rounded-xl border border-charcoal-light p-5 mb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-cream-muted mb-1 block">Name</label>
                      <input type="text" placeholder="Store name" value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} required className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs text-cream-muted mb-1 block">Address</label>
                      <input type="text" placeholder="123 Main St" value={locForm.address} onChange={(e) => setLocForm({ ...locForm, address: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs text-cream-muted mb-1 block">Timezone</label>
                      <select value={locForm.timezone} onChange={(e) => setLocForm({ ...locForm, timezone: e.target.value })} className={inputClass}>
                        {TIMEZONES.map((tz) => (
                          <option key={tz} value={tz}>{formatTz(tz)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setShowLocAdd(false)} className={btnSecondary}>Cancel</button>
                    <button type="submit" disabled={locSaving} className={btnPrimary}>{locSaving ? "Saving..." : "Add Location"}</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {locations.map((loc) => (
                  <div key={loc.id} className={`bg-charcoal-mid rounded-xl border p-4 ${loc.is_active ? "border-charcoal-light" : "border-charcoal-light/50 opacity-60"}`}>
                    {locEditing === loc.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-cream-muted mb-1 block">Name</label>
                            <input type="text" value={locEditForm.name} onChange={(e) => setLocEditForm({ ...locEditForm, name: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className="text-xs text-cream-muted mb-1 block">Address</label>
                            <input type="text" value={locEditForm.address} onChange={(e) => setLocEditForm({ ...locEditForm, address: e.target.value })} className={inputClass} />
                          </div>
                          <div>
                            <label className="text-xs text-cream-muted mb-1 block">Timezone</label>
                            <select value={locEditForm.timezone} onChange={(e) => setLocEditForm({ ...locEditForm, timezone: e.target.value })} className={inputClass}>
                              {TIMEZONES.map((tz) => (
                                <option key={tz} value={tz}>{formatTz(tz)}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                          <button onClick={() => setLocEditing(null)} className={btnSecondary}>Cancel</button>
                          <button onClick={() => deleteLocation(loc.id)} className={btnDanger}>Delete</button>
                          <button onClick={() => saveLocEdit(loc.id)} disabled={locSaving} className={btnPrimary}>{locSaving ? "Saving..." : "Save"}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal-light text-lg">🌐</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-cream font-medium">{loc.name}</span>
                              {!loc.is_active && <span className="text-[10px] bg-red/20 text-red px-1.5 py-0.5 rounded">Inactive</span>}
                            </div>
                            <div className="text-xs text-cream-muted mt-0.5">
                              {loc.address && <span>{loc.address} &middot; </span>}
                              <span>{formatTz(loc.timezone)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleLocActive(loc)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                              loc.is_active ? "border-amber/30 text-amber hover:bg-amber/10" : "border-teal/30 text-teal-light hover:bg-teal/10"
                            }`}
                          >
                            {loc.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => startLocEdit(loc)} className="text-xs px-3 py-1.5 rounded-lg border border-charcoal-light text-cream-muted hover:text-cream hover:bg-charcoal-light transition-colors">
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {locations.length === 0 && (
                  <div className="text-center py-12 text-cream-muted">No locations yet. Add your first location above.</div>
                )}
              </div>
            </div>
          )}

          {/* ── Scheduling ── */}
          {section === "scheduling" && (
            <div className="max-w-2xl">
              <SectionHeader title="Scheduling" subtitle="Shift types and default scheduling settings." />

              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 mb-6">
                <h4 className="text-sm font-semibold text-cream mb-4">Shift Types & Default Times</h4>
                <p className="text-xs text-cream-muted mb-4">Manage shift types, their colors, and default start/end times.</p>

                <div className="space-y-2 mb-4">
                  {shiftTypes.map((st) => {
                    const isEditing = editingShiftType === st.key;
                    return (
                      <div key={st.key} className="bg-charcoal-light/20 rounded-lg px-4 py-3">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-cream-muted mb-0.5 block">Label</label>
                                <input value={st.label} onChange={(e) => updateShiftType(st.key, "label", e.target.value)} className={inputClass} />
                              </div>
                              <div>
                                <label className="text-[10px] text-cream-muted mb-0.5 block">Color</label>
                                <select value={st.color} onChange={(e) => updateShiftType(st.key, "color", e.target.value)} className={inputClass}>
                                  {SHIFT_COLORS.map((c) => (
                                    <option key={c.key} value={c.key}>{c.key}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] text-cream-muted mb-0.5 block">Default Times</label>
                              <div className="flex gap-2 items-center">
                                <input type="time" value={st.startTime} onChange={(e) => updateShiftType(st.key, "startTime", e.target.value)} className={inputClass} />
                                <span className="text-cream-muted text-xs">to</span>
                                <input type="time" value={st.endTime} onChange={(e) => updateShiftType(st.key, "endTime", e.target.value)} className={inputClass} />
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <button onClick={() => removeShiftType(st.key)} className="text-xs text-red/60 hover:text-red">remove</button>
                              <button onClick={() => setEditingShiftType(null)} className="text-xs text-teal-light hover:underline">done</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full border ${shiftColorClasses(st.color)}`}>{st.label}</span>
                              <span className="text-xs text-cream-muted">{st.startTime} - {st.endTime}</span>
                            </div>
                            <button onClick={() => setEditingShiftType(st.key)} className="text-xs text-cream-muted hover:text-cream">edit</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new shift type */}
                <div className="border-t border-charcoal-light/30 pt-4">
                  <p className="text-xs text-cream-muted mb-2">Add a new shift type</p>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={newShiftType.label}
                      onChange={(e) => setNewShiftType({ ...newShiftType, label: e.target.value })}
                      placeholder="Label (e.g. Training)"
                      className={inputClass}
                    />
                    <select
                      value={newShiftType.color}
                      onChange={(e) => setNewShiftType({ ...newShiftType, color: e.target.value })}
                      className={inputClass}
                    >
                      {SHIFT_COLORS.map((c) => (
                        <option key={c.key} value={c.key}>{c.key}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input type="time" value={newShiftType.startTime} onChange={(e) => setNewShiftType({ ...newShiftType, startTime: e.target.value })} className={inputClass} />
                    <span className="text-cream-muted text-xs">to</span>
                    <input type="time" value={newShiftType.endTime} onChange={(e) => setNewShiftType({ ...newShiftType, endTime: e.target.value })} className={inputClass} />
                    <button onClick={addShiftType} className={btnPrimary}>Add</button>
                  </div>
                </div>
                <SaveButton />
              </div>

              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6">
                <h4 className="text-sm font-semibold text-cream mb-4">Schedule Week</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-cream-muted mb-1 block">Week Starts On</label>
                    <select value={getSetting("schedule.weekStartsOn")} onChange={(e) => setSetting("schedule.weekStartsOn", e.target.value)} className={inputClass}>
                      <option value="monday">Monday</option>
                      <option value="sunday">Sunday</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-cream-muted mb-1 block">Overtime After</label>
                    <select value={getSetting("schedule.overtimeAfter")} onChange={(e) => setSetting("schedule.overtimeAfter", e.target.value)} className={inputClass}>
                      <option value="40">40 hours/week</option>
                      <option value="44">44 hours/week</option>
                      <option value="none">No overtime tracking</option>
                    </select>
                  </div>
                </div>
                <SaveButton />
              </div>
            </div>
          )}

          {/* ── Roles & Titles ── */}
          {section === "roles" && (
            <div className="max-w-2xl">
              <SectionHeader title="Roles & Titles" subtitle="Configure employee roles, job titles, and departments." />

              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 mb-6">
                <h4 className="text-sm font-semibold text-cream mb-4">System Roles</h4>
                <p className="text-xs text-cream-muted mb-3">Edit role descriptions to define permissions for your team.</p>
                <div className="space-y-3">
                  {systemRoles.map((role) => {
                    const colorMap: Record<string, string> = {
                      admin: "bg-amber/20 text-amber border-amber/30",
                      manager: "bg-teal/20 text-teal-light border-teal/30",
                      employee: "bg-charcoal-light text-cream-muted border-charcoal-light",
                    };
                    const color = colorMap[role.key] || "bg-charcoal-light text-cream-muted border-charcoal-light";
                    const isEditing = editingRole === role.key;

                    return (
                      <div key={role.key} className="bg-charcoal-light/20 rounded-lg px-4 py-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${color}`}>{role.label}</span>
                              <span className="text-[10px] text-cream-muted font-mono">{role.key}</span>
                            </div>
                            <textarea
                              value={role.description}
                              onChange={(e) => updateRole(role.key, "description", e.target.value)}
                              rows={2}
                              className={inputClass}
                            />
                            <div className="flex justify-end">
                              <button onClick={() => setEditingRole(null)} className="text-xs text-teal-light hover:underline">Done</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className={`text-xs px-2.5 py-1 rounded-full border mt-0.5 shrink-0 ${color}`}>{role.label}</span>
                              <p className="text-xs text-cream-muted leading-relaxed">{role.description}</p>
                            </div>
                            <button onClick={() => setEditingRole(role.key)} className="text-xs text-cream-muted hover:text-cream shrink-0">edit</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-charcoal-light/30">
                  <h4 className="text-sm font-semibold text-cream mb-2">Permissions</h4>
                  <p className="text-xs text-cream-muted mb-4">Configure what each role can access. Admin always has full access.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-charcoal-light">
                        <th className="text-left text-xs text-cream-muted font-medium py-2 pr-4 w-48">Permission</th>
                        <th className="text-center text-xs font-medium py-2 px-3">
                          <span className="text-amber">Admin</span>
                        </th>
                        {systemRoles.filter((r) => r.key !== "admin").map((role) => (
                          <th key={role.key} className="text-center text-xs font-medium py-2 px-3">
                            <span className={role.key === "manager" ? "text-teal-light" : "text-cream-muted"}>{role.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSION_GROUPS.map((group) => (
                        <>
                          <tr key={`group-${group.label}`}>
                            <td colSpan={2 + systemRoles.filter((r) => r.key !== "admin").length} className="pt-4 pb-1">
                              <span className="text-[10px] uppercase tracking-wider text-cream-muted/60 font-semibold">{group.label}</span>
                            </td>
                          </tr>
                          {group.permissions.map((perm) => (
                            <tr key={perm.key} className="border-b border-charcoal-light/10 hover:bg-charcoal-light/10">
                              <td className="text-xs text-cream py-2 pr-4">{perm.label}</td>
                              <td className="text-center py-2 px-3">
                                <span className="text-teal-light text-sm">&#10003;</span>
                              </td>
                              {systemRoles.filter((r) => r.key !== "admin").map((role) => (
                                <td key={role.key} className="text-center py-2 px-3">
                                  <button
                                    onClick={() => togglePermission(role.key, perm.key)}
                                    className={`w-8 h-5 rounded-full transition-colors relative inline-block ${
                                      permissions[role.key]?.[perm.key] ? "bg-teal" : "bg-charcoal-light"
                                    }`}
                                  >
                                    <span className={`absolute top-0.5 w-4 h-4 bg-cream rounded-full transition-transform shadow ${
                                      permissions[role.key]?.[perm.key] ? "left-[14px]" : "left-0.5"
                                    }`} />
                                  </button>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
                <SaveButton />
              </div>

              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 mb-6">
                <h4 className="text-sm font-semibold text-cream mb-4">Job Titles</h4>
                <p className="text-xs text-cream-muted mb-3">These titles appear in the dropdown when assigning a title to an employee.</p>
                <div className="space-y-2 mb-3">
                  {titles.map((title) => (
                    <div key={title} className="flex items-center justify-between bg-charcoal-light/20 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-cream">{title}</span>
                      <button onClick={() => removeTitle(title)} className="text-red/60 hover:text-red text-xs">remove</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTitle(); } }}
                    placeholder="Add a new title..."
                    className={inputClass}
                  />
                  <button onClick={addTitle} className={btnPrimary}>Add</button>
                </div>
              </div>

              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6 mb-6">
                <h4 className="text-sm font-semibold text-cream mb-4">Departments</h4>
                <p className="text-xs text-cream-muted mb-3">Departments are used to organize employees and for filtering.</p>
                <div className="space-y-2 mb-3">
                  {departments.map((dept) => (
                    <div key={dept} className="flex items-center justify-between bg-charcoal-light/20 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-cream">{dept}</span>
                      <button onClick={() => removeDepartment(dept)} className="text-red/60 hover:text-red text-xs">remove</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDepartment(); } }}
                    placeholder="Add a new department..."
                    className={inputClass}
                  />
                  <button onClick={addDepartment} className={btnPrimary}>Add</button>
                </div>
              </div>

              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6">
                <h4 className="text-sm font-semibold text-cream mb-4">Worker Types</h4>
                <p className="text-xs text-cream-muted mb-3">Manage the worker type options available when assigning employees.</p>
                <div className="space-y-2 mb-3">
                  {workerTypes.map((wt) => {
                    const isEditing = editingWorkerType === wt.key;
                    return (
                      <div key={wt.key} className="bg-charcoal-light/20 rounded-lg px-4 py-2.5">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] text-cream-muted mb-0.5 block">Label</label>
                              <input value={wt.label} onChange={(e) => updateWorkerType(wt.key, "label", e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className="text-[10px] text-cream-muted mb-0.5 block">Description</label>
                              <input value={wt.description} onChange={(e) => updateWorkerType(wt.key, "description", e.target.value)} className={inputClass} />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button onClick={() => removeWorkerType(wt.key)} className="text-xs text-red/60 hover:text-red">remove</button>
                              <button onClick={() => setEditingWorkerType(null)} className="text-xs text-teal-light hover:underline">done</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-sm text-cream">{wt.label}</span>
                              <span className="text-xs text-cream-muted ml-2">{wt.description}</span>
                            </div>
                            <button onClick={() => setEditingWorkerType(wt.key)} className="text-xs text-cream-muted hover:text-cream">edit</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWorkerType.label}
                    onChange={(e) => setNewWorkerType({ ...newWorkerType, label: e.target.value })}
                    placeholder="Label (e.g. Hybrid)"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={newWorkerType.description}
                    onChange={(e) => setNewWorkerType({ ...newWorkerType, description: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWorkerType(); } }}
                    placeholder="Description"
                    className={inputClass}
                  />
                  <button onClick={addWorkerType} className={btnPrimary}>Add</button>
                </div>
                <SaveButton />
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {section === "notifications" && (
            <div className="max-w-2xl">
              <SectionHeader title="Notifications" subtitle="Configure which push notifications are sent to employees." />

              <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-6">
                <div className="space-y-1">
                  <NotifToggle label="Schedule Published" description="Notify employees when a new schedule is published" checked={getSettingBool("notif.shiftPublished")} onChange={(v) => setSetting("notif.shiftPublished", String(v))} />
                  <NotifToggle label="Shift Changed" description="Notify when an employee's shift is modified or removed" checked={getSettingBool("notif.shiftChanged")} onChange={(v) => setSetting("notif.shiftChanged", String(v))} />
                  <NotifToggle label="Leave Approved / Denied" description="Notify employees when their leave request is reviewed" checked={getSettingBool("notif.leaveApproved")} onChange={(v) => setSetting("notif.leaveApproved", String(v))} />
                  <NotifToggle label="Leave Submitted" description="Notify managers when an employee submits a leave request" checked={getSettingBool("notif.leaveSubmitted")} onChange={(v) => setSetting("notif.leaveSubmitted", String(v))} />
                  <NotifToggle label="Timesheet Reminder" description="Remind employees to submit timesheets at end of pay period" checked={getSettingBool("notif.timesheetReminder")} onChange={(v) => setSetting("notif.timesheetReminder", String(v))} />
                  <NotifToggle label="New Bulletin" description="Notify all employees when a new bulletin post is created" checked={getSettingBool("notif.newBulletin")} onChange={(v) => setSetting("notif.newBulletin", String(v))} />
                </div>
                <SaveButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ─── Sub-components ─── */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-cream">{title}</h3>
      <p className="text-sm text-cream-muted mt-0.5">{subtitle}</p>
    </div>
  );
}


function NotifToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-charcoal-light/20 last:border-0">
      <div>
        <div className="text-sm text-cream font-medium">{label}</div>
        <div className="text-xs text-cream-muted mt-0.5">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? "bg-teal" : "bg-charcoal-light"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-cream rounded-full transition-transform shadow ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function formatTz(tz: string): string {
  return tz.replace("_", " ").replace("America/", "").replace("Pacific/", "");
}
