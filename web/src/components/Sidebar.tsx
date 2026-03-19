"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "Dashboard" },
  { href: "/schedule", label: "Schedule", icon: "Schedule" },
  { href: "/timesheets", label: "Timesheets", icon: "Clock" },
  { href: "/leave", label: "Leave", icon: "Calendar" },
  { href: "/employees", label: "Employees", icon: "People" },
  { href: "/manual", label: "Manual", icon: "Book" },
  { href: "/academy", label: "Academy", icon: "GradCap" },
  { href: "/settings", label: "Settings", icon: "Gear" },
];

const ICON_MAP: Record<string, string> = {
  Dashboard: "▦",
  Schedule: "☰",
  Clock: "◷",
  Calendar: "▣",
  People: "👤",
  Book: "☷",
  GradCap: "🎓",
  Gear: "⚙",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="w-64 bg-charcoal-mid border-r border-charcoal-light flex flex-col min-h-screen" role="navigation" aria-label="Main navigation">
      <div className="p-6 border-b border-charcoal-light">
        <h1 className="text-xl font-bold text-teal-light">Joy-Per&apos;s Hub</h1>
        <p className="text-xs text-cream-muted mt-1">Manager Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1" aria-label="Dashboard navigation">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-teal-dark text-cream"
                  : "text-cream-muted hover:bg-charcoal-light hover:text-cream"
              }`}
            >
              <span className="w-5 text-center text-xs" aria-hidden="true">{ICON_MAP[item.icon]}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-charcoal-light">
        <button
          onClick={handleLogout}
          aria-label="Sign out of dashboard"
          className="w-full px-3 py-2 text-sm text-cream-muted hover:text-red rounded-lg hover:bg-charcoal-light transition-colors text-left"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
