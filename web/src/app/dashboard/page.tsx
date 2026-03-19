import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/DashboardLayout";
import LocalTime from "@/components/LocalTime";
import ClockedInCard from "@/components/ClockedInCard";

interface DashboardShift {
  id: number;
  start_time: string;
  end_time: string;
  type: string | null;
  employee: { name: string; role: string } | null;
}

interface DashboardPunch {
  id: number;
  type: string;
  timestamp: string;
  employee: { name: string } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];
  const todayStart = `${today}T00:00:00`;
  const todayEnd = `${today}T23:59:59`;

  const [
    { count: totalEmployees },
    { count: todayShifts },
    { data: clockInPunches },
    { count: pendingLeave },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("shifts").select("*", { count: "exact", head: true }).eq("date", today),
    supabase
      .from("punches")
      .select("employee_id, timestamp, employee:employees(name)")
      .gte("timestamp", todayStart)
      .eq("type", "clock_in")
      .order("timestamp", { ascending: false }),
    supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  // Deduplicate by employee (keep earliest clock-in)
  const seenEmployees = new Set<string>();
  const clockedInEmployees: { name: string; timestamp: string }[] = [];
  for (const p of (clockInPunches || []).reverse()) {
    if (!seenEmployees.has(p.employee_id)) {
      seenEmployees.add(p.employee_id);
      const emp = p.employee as unknown as { name: string } | null;
      clockedInEmployees.push({
        name: emp?.name || "Unknown",
        timestamp: p.timestamp,
      });
    }
  }
  const clockedIn = clockedInEmployees.length;

  // Today's shifts with employee names
  const { data: todaySchedule } = await supabase
    .from("shifts")
    .select("*, employee:employees(name, role)")
    .eq("date", today)
    .order("start_time");

  // Recent punches
  const { data: recentPunches } = await supabase
    .from("punches")
    .select("*, employee:employees(name)")
    .gte("timestamp", todayStart)
    .order("timestamp", { ascending: false })
    .limit(10);

  const stats = [
    { label: "Active Employees", value: totalEmployees ?? 0, color: "text-teal-light" },
    { label: "Today's Shifts", value: todayShifts ?? 0, color: "text-amber" },
    { label: "Leave Pending", value: pendingLeave ?? 0, color: "text-rose" },
  ];

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-cream mb-6">Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-charcoal-mid rounded-xl p-5 border border-charcoal-light">
            <p className="text-sm text-cream-muted">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
        <ClockedInCard count={clockedIn} employees={clockedInEmployees} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-5">
          <h3 className="text-lg font-semibold text-cream mb-4">Today&apos;s Schedule</h3>
          {todaySchedule && todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.map((shift: DashboardShift) => (
                <div key={shift.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-charcoal-light">
                  <span className="text-cream text-sm">{shift.employee?.name}</span>
                  <span className="text-cream-muted text-xs">
                    <LocalTime timestamp={shift.start_time} />
                    {" - "}
                    <LocalTime timestamp={shift.end_time} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream-muted text-sm">No shifts scheduled for today.</p>
          )}
        </div>

        {/* Recent Clock Activity */}
        <div className="bg-charcoal-mid rounded-xl border border-charcoal-light p-5">
          <h3 className="text-lg font-semibold text-cream mb-4">Recent Clock Activity</h3>
          {recentPunches && recentPunches.length > 0 ? (
            <div className="space-y-2">
              {recentPunches.map((punch: DashboardPunch) => (
                <div key={punch.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-charcoal-light">
                  <div>
                    <span className="text-cream text-sm">{punch.employee?.name}</span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      punch.type === "clock_in" ? "bg-green/20 text-green" :
                      punch.type === "clock_out" ? "bg-red/20 text-red" :
                      "bg-amber/20 text-amber"
                    }`}>
                      {punch.type.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-cream-muted text-xs">
                    <LocalTime timestamp={punch.timestamp} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-cream-muted text-sm">No clock activity today.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
