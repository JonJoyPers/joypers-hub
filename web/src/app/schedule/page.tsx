"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

/* ─── types ─── */

interface Shift {
  id: number;
  employee_id: string;
  location_id: number | null;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  published: boolean;
  employee: { name: string; role: string } | null;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  location_id: number | null;
}

interface Location {
  id: number;
  name: string;
}

interface Closure {
  id: number;
  location_id: number | null;
  date: string;
  reason: string;
}

interface ShiftFormData {
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  location_id: string;
}

/* ─── constants ─── */

interface ShiftTypeConfig {
  key: string;
  label: string;
  color: string;
  startTime: string;
  endTime: string;
}

const DEFAULT_SHIFT_TYPES: ShiftTypeConfig[] = [
  { key: "opening", label: "Opening", color: "teal", startTime: "09:00", endTime: "17:00" },
  { key: "mid", label: "Mid", color: "amber", startTime: "11:00", endTime: "19:00" },
  { key: "closing", label: "Closing", color: "violet", startTime: "13:00", endTime: "21:00" },
  { key: "inventory", label: "Inventory", color: "rose", startTime: "09:00", endTime: "17:00" },
  { key: "part_time", label: "Part Time", color: "cream-muted", startTime: "10:00", endTime: "14:00" },
];

const COLOR_CLASSES: Record<string, string> = {
  teal: "bg-teal/20 text-teal-light border-teal/30",
  amber: "bg-amber/20 text-amber border-amber/30",
  violet: "bg-violet/20 text-violet border-violet/30",
  rose: "bg-rose/20 text-rose border-rose/30",
  "cream-muted": "bg-cream-muted/20 text-cream-muted border-cream-muted/30",
  green: "bg-green/20 text-green border-green/30",
  red: "bg-red/20 text-red border-red/30",
  blue: "bg-blue/20 text-blue border-blue/30",
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ─── helpers ─── */

function getMonday(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().split("T")[0];
}

function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + "T00:00:00");
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function shiftWeek(weekStart: string, delta: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().split("T")[0];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDateLabel(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/* ─── Droppable Cell ─── */

function DroppableCell({
  id,
  children,
  isClosed,
  isToday,
}: {
  id: string;
  children: React.ReactNode;
  isClosed: boolean;
  isToday: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] p-1 rounded-lg relative transition-colors ${
        isClosed ? "bg-red/5" : isOver ? "bg-teal/10" : "hover:bg-charcoal-light/30"
      } ${isToday ? "ring-1 ring-teal/40" : ""}`}
    >
      {isClosed && (
        <div className="absolute inset-0 rounded-lg pointer-events-none opacity-30"
          style={{
            backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(239,68,68,0.2) 4px, rgba(239,68,68,0.2) 8px)",
          }}
        />
      )}
      {children}
    </div>
  );
}

/* ─── Shift Chip ─── */

function ShiftChip({
  shift,
  onClick,
  isDragging,
  typeConfigs,
}: {
  shift: Shift;
  onClick: () => void;
  isDragging?: boolean;
  typeConfigs: ShiftTypeConfig[];
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(shift.id),
  });
  const colors = getTypeColor(shift.type || "opening", typeConfigs);
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={style}
      className={`px-2 py-1 rounded-md text-xs border cursor-grab active:cursor-grabbing select-none ${colors} ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="font-medium truncate">{shift.employee?.name ?? "?"}</div>
      <div className="opacity-75">
        {formatTime(shift.start_time)}-{formatTime(shift.end_time)}
      </div>
    </div>
  );
}

/* ─── Modal Wrapper ─── */

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-charcoal-mid border border-charcoal-light rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-cream">{title}</h3>
          <button onClick={onClose} className="text-cream-muted hover:text-cream text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Select/Input component helpers ─── */

const inputClass = "bg-charcoal-light border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm w-full";
const btnPrimary = "px-4 py-2 bg-teal text-cream rounded-lg text-sm hover:bg-teal-dark";
const btnDanger = "px-4 py-2 bg-red/80 text-cream rounded-lg text-sm hover:bg-red";
const btnSecondary = "px-4 py-2 bg-charcoal-light text-cream-muted rounded-lg text-sm hover:text-cream";

/* ─── helpers for dynamic shift types ─── */

function getTypeColor(type: string, configs: ShiftTypeConfig[]): string {
  const cfg = configs.find((c) => c.key === type);
  const colorKey = cfg?.color || "teal";
  return COLOR_CLASSES[colorKey] || COLOR_CLASSES.teal;
}

function getTypeLabel(type: string, configs: ShiftTypeConfig[]): string {
  const cfg = configs.find((c) => c.key === type);
  return cfg?.label || type;
}

function getTypeDefaults(type: string, configs: ShiftTypeConfig[]): { startTime: string; endTime: string } {
  const cfg = configs.find((c) => c.key === type);
  return { startTime: cfg?.startTime || "09:00", endTime: cfg?.endTime || "17:00" };
}

/* ─── Main Component ─── */

export default function SchedulePage() {
  const supabase = createClient();

  // Data state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [closures, setClosures] = useState<Closure[]>([]);
  const [shiftTypeConfigs, setShiftTypeConfigs] = useState<ShiftTypeConfig[]>(DEFAULT_SHIFT_TYPES);

  // UI state
  const [weekStart, setWeekStart] = useState(getMonday);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [shiftModal, setShiftModal] = useState<{ mode: "add" | "edit"; shift?: Shift; prefill?: Partial<ShiftFormData> } | null>(null);
  const [closureModal, setClosureModal] = useState(false);
  const [copyWeekModal, setCopyWeekModal] = useState(false);
  const [publishConfirm, setPublishConfirm] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [closureDate, setClosureDate] = useState("");
  const [closureReason, setClosureReason] = useState("");

  const weekDates = getWeekDates(weekStart);
  const today = todayStr();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ─── Data Fetching ───

  async function fetchShifts() {
    const endDate = weekDates[6];
    const base = supabase
      .from("shifts")
      .select("*, employee:employees!shifts_employee_id_employees_id_fk(name, role)")
      .gte("date", weekStart)
      .lte("date", endDate)
      .order("start_time");
    const { data, error } = selectedLocationId
      ? await base.eq("location_id", selectedLocationId)
      : await base;
    if (error) console.error("fetchShifts error:", error.message, error.code, error.details, error.hint);
    setShifts(data || []);
  }

  async function fetchEmployees() {
    const base = supabase
      .from("employees")
      .select("id, name, role, location_id")
      .eq("is_active", true)
      .order("name");
    const { data } = selectedLocationId
      ? await base.eq("location_id", selectedLocationId)
      : await base;
    setEmployees(data || []);
  }

  async function fetchClosures() {
    const endDate = weekDates[6];
    const base = supabase
      .from("store_closures")
      .select("*")
      .gte("date", weekStart)
      .lte("date", endDate);
    const { data } = selectedLocationId
      ? await base.or(`location_id.eq.${selectedLocationId},location_id.is.null`)
      : await base;
    setClosures(data || []);
  }

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from("locations")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      setLocations(data || []);
    };
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "schedule.shiftTypes")
        .single();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          if (Array.isArray(parsed) && parsed.length > 0) setShiftTypeConfigs(parsed);
        } catch { /* use defaults */ }
      }
    };
    fetchLocations();
    fetchSettings();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchShifts(); fetchClosures(); }, [weekStart, selectedLocationId]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchEmployees(); }, [selectedLocationId]);

  // ─── Closure helpers ───

  function isDateClosed(date: string): boolean {
    return closures.some((c) => c.date === date);
  }

  function getClosureReason(date: string): string {
    return closures.find((c) => c.date === date)?.reason || "";
  }

  // ─── Shift CRUD ───

  async function saveShift(form: ShiftFormData, editId?: number) {
    // Build timezone offset string (e.g. "-05:00") so Supabase stores the correct instant
    const off = new Date(`${form.date}T${form.start_time}`).getTimezoneOffset();
    const sign = off <= 0 ? "+" : "-";
    const absOff = Math.abs(off);
    const tz = `${sign}${String(Math.floor(absOff / 60)).padStart(2, "0")}:${String(absOff % 60).padStart(2, "0")}`;

    const payload = {
      employee_id: form.employee_id,
      date: form.date,
      start_time: `${form.date}T${form.start_time}:00${tz}`,
      end_time: `${form.date}T${form.end_time}:00${tz}`,
      type: form.type,
      location_id: form.location_id ? Number(form.location_id) : null,
    };
    const { error } = editId
      ? await supabase.from("shifts").update(payload).eq("id", editId)
      : await supabase.from("shifts").insert(payload);
    if (error) {
      console.error("saveShift error:", error);
      alert(`Error saving shift: ${error.message}`);
      return;
    }
    setShiftModal(null);
    await fetchShifts();
  }

  async function deleteShift(id: number) {
    const { error } = await supabase.from("shifts").delete().eq("id", id);
    if (error) {
      console.error("deleteShift error:", error);
      alert(`Error deleting shift: ${error.message}`);
      return;
    }
    setShiftModal(null);
    await fetchShifts();
  }

  // ─── Drag and Drop ───

  function handleDragStart(event: DragStartEvent) {
    const shift = shifts.find((s) => s.id === Number(event.active.id));
    setActiveShift(shift || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveShift(null);
    const { active, over } = event;
    if (!over) return;

    const droppableId = String(over.id);
    if (!droppableId.startsWith("drop-")) return;

    const parts = droppableId.replace("drop-", "").split("-");
    // Format: drop-{employeeId}-{date} where employeeId is a UUID and date is YYYY-MM-DD
    const newDate = parts.slice(-3).join("-"); // last 3 parts = YYYY-MM-DD
    const newEmployeeId = parts.slice(0, -3).join("-"); // everything before date = UUID

    if (isDateClosed(newDate)) return;

    const shift = shifts.find((s) => s.id === Number(active.id));
    if (!shift) return;

    // Preserve time-of-day, change date and employee
    const oldStartTime = shift.start_time.split("T")[1];
    const oldEndTime = shift.end_time.split("T")[1];

    await supabase
      .from("shifts")
      .update({
        date: newDate,
        employee_id: newEmployeeId,
        start_time: `${newDate}T${oldStartTime}`,
        end_time: `${newDate}T${oldEndTime}`,
      })
      .eq("id", shift.id);

    fetchShifts();
  }

  // ─── Copy Week ───

  async function copyFromWeek(sourceStart: string) {
    const sourceDates = getWeekDates(sourceStart);
    const { data: sourceShifts } = await supabase
      .from("shifts")
      .select("*")
      .gte("date", sourceDates[0])
      .lte("date", sourceDates[6]);

    if (!sourceShifts?.length) return;

    const dayOffset = (new Date(weekStart + "T00:00:00").getTime() - new Date(sourceStart + "T00:00:00").getTime()) / 86400000;

    const newShifts = sourceShifts.map((s) => {
      const newDate = shiftWeek(s.date, dayOffset);
      const oldStartTime = s.start_time.split("T")[1];
      const oldEndTime = s.end_time.split("T")[1];
      return {
        employee_id: s.employee_id,
        location_id: s.location_id,
        date: newDate,
        start_time: `${newDate}T${oldStartTime}`,
        end_time: `${newDate}T${oldEndTime}`,
        type: s.type,
        published: false,
      };
    });

    await supabase.from("shifts").insert(newShifts);
    setCopyWeekModal(false);
    fetchShifts();
  }

  // ─── Publish ───

  async function publishWeek() {
    const endDate = weekDates[6];
    await supabase
      .from("shifts")
      .update({ published: true })
      .gte("date", weekStart)
      .lte("date", endDate);
    setPublishConfirm(false);
    fetchShifts();
  }

  const unpublishedCount = shifts.filter((s) => !s.published).length;
  const allPublished = shifts.length > 0 && unpublishedCount === 0;

  // ─── Closure CRUD ───

  async function addClosure() {
    if (!closureDate || !closureReason) return;
    await supabase.from("store_closures").insert({
      date: closureDate,
      reason: closureReason,
      location_id: selectedLocationId || null,
    });
    setClosureDate("");
    setClosureReason("");
    fetchClosures();
  }

  async function removeClosure(id: number) {
    await supabase.from("store_closures").delete().eq("id", id);
    fetchClosures();
  }

  // ─── Render ───

  return (
    <DashboardLayout>
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-cream">Schedule</h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week Nav */}
          <button onClick={() => setWeekStart(shiftWeek(weekStart, -7))} className={btnSecondary}>&larr;</button>
          <span className="text-cream text-sm font-medium px-2">
            {formatDateLabel(weekStart)} - {formatDateLabel(weekDates[6])}
            {", "}
            {new Date(weekDates[6] + "T00:00:00").getFullYear()}
          </span>
          <button onClick={() => setWeekStart(shiftWeek(weekStart, 7))} className={btnSecondary}>&rarr;</button>

          {/* Divider */}
          <div className="w-px h-6 bg-charcoal-light mx-1" />

          {/* Location Filter */}
          <select
            value={selectedLocationId ?? ""}
            onChange={(e) => setSelectedLocationId(e.target.value ? Number(e.target.value) : null)}
            className="bg-charcoal-light border border-charcoal-light rounded-lg px-3 py-2 text-cream text-sm"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          {/* Actions */}
          <button onClick={() => setCopyWeekModal(true)} className={btnSecondary}>Copy Week</button>
          <button
            onClick={() => setPublishConfirm(true)}
            className={`px-4 py-2 rounded-lg text-sm ${
              allPublished
                ? "bg-green-700/30 text-green-400 border border-green-700/50"
                : "bg-teal text-cream hover:bg-teal-dark"
            }`}
          >
            {allPublished ? "\u2713 Published" : "Publish"}
          </button>
          <button onClick={() => setClosureModal(true)} className={btnSecondary}>Closures</button>
          <button
            onClick={() => setShiftModal({ mode: "add", prefill: { date: weekDates[0] } })}
            className={btnPrimary}
          >
            + Add Shift
          </button>
        </div>
      </div>

      {/* Employee-Row Grid */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Day Headers */}
            <thead>
              <tr>
                <th className="sticky left-0 bg-charcoal z-10 p-2 text-left text-xs text-cream-muted font-medium w-40 min-w-[160px]">
                  Employee
                </th>
                {weekDates.map((date, i) => {
                  const closed = isDateClosed(date);
                  const isToday = date === today;
                  return (
                    <th
                      key={date}
                      className={`p-2 text-center text-xs font-medium min-w-[120px] ${
                        isToday ? "text-teal-light" : "text-cream-muted"
                      }`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setClosureDate(date);
                        setClosureModal(true);
                      }}
                    >
                      <div>{DAY_NAMES[i]}</div>
                      <div className={`text-sm ${isToday ? "text-teal-light font-bold" : "text-cream"}`}>
                        {new Date(date + "T00:00:00").getDate()}
                      </div>
                      {closed && (
                        <div className="text-[10px] text-red mt-0.5" title={getClosureReason(date)}>CLOSED</div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t border-charcoal-light/30">
                  <td className="sticky left-0 bg-charcoal z-10 p-2">
                    <div className="text-sm text-cream font-medium truncate">{emp.name}</div>
                    <div className="text-xs text-cream-muted">{emp.role}</div>
                  </td>
                  {weekDates.map((date) => {
                    const cellShifts = shifts.filter(
                      (s) => s.employee_id === emp.id && s.date === date
                    );
                    const closed = isDateClosed(date);
                    const isToday = date === today;
                    const droppableId = `drop-${emp.id}-${date}`;

                    return (
                      <td key={date} className="p-1 align-top">
                        <DroppableCell id={droppableId} isClosed={closed} isToday={isToday}>
                          <div className="space-y-1">
                            {cellShifts.map((shift) => (
                              <ShiftChip
                                key={shift.id}
                                shift={shift}
                                isDragging={activeShift?.id === shift.id}
                                typeConfigs={shiftTypeConfigs}
                                onClick={() =>
                                  setShiftModal({ mode: "edit", shift })
                                }
                              />
                            ))}
                          </div>
                          {/* Click to add */}
                          {!closed && (
                            <button
                              onClick={() =>
                                setShiftModal({
                                  mode: "add",
                                  prefill: { employee_id: emp.id, date },
                                })
                              }
                              className="w-full mt-1 py-1 text-[10px] text-cream-muted/40 hover:text-cream-muted hover:bg-charcoal-light/30 rounded transition-colors"
                            >
                              +
                            </button>
                          )}
                        </DroppableCell>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-cream-muted">
                    No active employees found{selectedLocationId ? " for this location" : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeShift && (
            <div className={`px-2 py-1 rounded-md text-xs border shadow-lg ${getTypeColor(activeShift.type || "opening", shiftTypeConfigs)}`}>
              <div className="font-medium">{activeShift.employee?.name}</div>
              <div className="opacity-75">
                {formatTime(activeShift.start_time)}-{formatTime(activeShift.end_time)}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ─── Shift Modal ─── */}
      <ShiftModalComponent
        modal={shiftModal}
        employees={employees}
        locations={locations}
        typeConfigs={shiftTypeConfigs}
        onClose={() => setShiftModal(null)}
        onSave={saveShift}
        onDelete={deleteShift}
      />

      {/* ─── Closure Modal ─── */}
      <Modal open={closureModal} onClose={() => setClosureModal(false)} title="Manage Closures">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <input
              type="date"
              value={closureDate}
              onChange={(e) => setClosureDate(e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Reason (e.g., Holiday, Maintenance)"
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              className={inputClass}
            />
            <button onClick={addClosure} className={btnPrimary}>Add Closure</button>
          </div>

          {closures.length > 0 && (
            <div className="border-t border-charcoal-light pt-3 space-y-2">
              <p className="text-xs text-cream-muted font-medium">This week&apos;s closures:</p>
              {closures.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-charcoal-light/30 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm text-cream">{formatDateLabel(c.date)}</span>
                    <span className="text-xs text-cream-muted ml-2">{c.reason}</span>
                    {c.location_id === null && <span className="text-[10px] text-amber ml-1">(all)</span>}
                  </div>
                  <button onClick={() => removeClosure(c.id)} className="text-red/60 hover:text-red text-xs">remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ─── Copy Week Modal ─── */}
      <Modal open={copyWeekModal} onClose={() => setCopyWeekModal(false)} title="Copy Week">
        <div className="space-y-3">
          <p className="text-sm text-cream-muted">Copy shifts from a previous week into the current week.</p>
          {[1, 2, 3, 4].map((n) => {
            const src = shiftWeek(weekStart, -7 * n);
            return (
              <button
                key={n}
                onClick={() => copyFromWeek(src)}
                className="w-full text-left px-4 py-3 bg-charcoal-light/30 hover:bg-charcoal-light rounded-lg text-sm text-cream transition-colors"
              >
                {n === 1 ? "Last week" : `${n} weeks ago`}
                <span className="text-cream-muted ml-2">({formatDateLabel(src)} - {formatDateLabel(shiftWeek(src, 6))})</span>
              </button>
            );
          })}
        </div>
      </Modal>

      {/* ─── Publish Confirm Modal ─── */}
      <Modal open={publishConfirm} onClose={() => setPublishConfirm(false)} title="Publish Schedule">
        <div className="space-y-4">
          {allPublished ? (
            <p className="text-sm text-cream-muted">All {shifts.length} shifts are already published.</p>
          ) : (
            <>
              <p className="text-sm text-cream-muted">
                This will publish {unpublishedCount} unpublished shift{unpublishedCount !== 1 ? "s" : ""} for the week of{" "}
                {formatDateLabel(weekStart)}.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setPublishConfirm(false)} className={btnSecondary}>Cancel</button>
                <button onClick={publishWeek} className={btnPrimary}>Publish</button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
}

/* ─── Shift Modal Subcomponent ─── */

function ShiftModalComponent({
  modal,
  employees,
  locations,
  typeConfigs,
  onClose,
  onSave,
  onDelete,
}: {
  modal: { mode: "add" | "edit"; shift?: Shift; prefill?: Partial<ShiftFormData> } | null;
  employees: Employee[];
  locations: Location[];
  typeConfigs: ShiftTypeConfig[];
  onClose: () => void;
  onSave: (form: ShiftFormData, editId?: number) => void;
  onDelete: (id: number) => void;
}) {
  const [form, setForm] = useState<ShiftFormData>({
    employee_id: "",
    date: "",
    start_time: "09:00",
    end_time: "17:00",
    type: typeConfigs[0]?.key || "opening",
    location_id: "",
  });

  useEffect(() => {
    if (!modal) return;
    if (modal.mode === "edit" && modal.shift) {
      const s = modal.shift;
      setForm({
        employee_id: s.employee_id,
        date: s.date,
        start_time: new Date(s.start_time).toTimeString().slice(0, 5),
        end_time: new Date(s.end_time).toTimeString().slice(0, 5),
        type: s.type || typeConfigs[0]?.key || "opening",
        location_id: s.location_id ? String(s.location_id) : "",
      });
    } else {
      const defaultType = typeConfigs[0]?.key || "opening";
      const defaults = getTypeDefaults(defaultType, typeConfigs);
      setForm({
        employee_id: modal.prefill?.employee_id || "",
        date: modal.prefill?.date || "",
        start_time: defaults.startTime,
        end_time: defaults.endTime,
        type: defaultType,
        location_id: "",
      });
    }
  }, [modal, typeConfigs]);

  if (!modal) return null;

  const isEdit = modal.mode === "edit";

  function handleTypeChange(newType: string) {
    const defaults = getTypeDefaults(newType, typeConfigs);
    setForm((prev) => ({
      ...prev,
      type: newType,
      start_time: isEdit ? prev.start_time : defaults.startTime,
      end_time: isEdit ? prev.end_time : defaults.endTime,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form, isEdit ? modal!.shift?.id : undefined);
  }

  return (
    <Modal open title={isEdit ? "Edit Shift" : "Add Shift"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required className={inputClass}>
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>

        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputClass} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-cream-muted mb-1 block">Start</label>
            <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required className={inputClass} />
          </div>
          <div>
            <label className="text-xs text-cream-muted mb-1 block">End</label>
            <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required className={inputClass} />
          </div>
        </div>

        <select value={form.type} onChange={(e) => handleTypeChange(e.target.value)} className={inputClass}>
          {typeConfigs.map((tc) => (
            <option key={tc.key} value={tc.key}>{tc.label}</option>
          ))}
        </select>

        <select value={form.location_id} onChange={(e) => setForm({ ...form, location_id: e.target.value })} className={inputClass}>
          <option value="">No Location</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name}</option>
          ))}
        </select>

        <div className="flex gap-3 justify-end">
          {isEdit && modal.shift && (
            <button type="button" onClick={() => onDelete(modal.shift!.id)} className={btnDanger}>Delete</button>
          )}
          <button type="button" onClick={onClose} className={btnSecondary}>Cancel</button>
          <button type="submit" className={btnPrimary}>{isEdit ? "Update" : "Add"}</button>
        </div>
      </form>
    </Modal>
  );
}
