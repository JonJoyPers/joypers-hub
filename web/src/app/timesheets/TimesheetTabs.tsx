"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/timesheets/approval", label: "Timesheets" },
  { href: "/timesheets/export", label: "Export" },
];

export default function TimesheetTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-cream">Timesheets</h2>
      <div className="flex bg-charcoal-mid rounded-lg border border-charcoal-light p-0.5">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                active
                  ? "bg-teal/25 text-teal"
                  : "text-cream-muted hover:text-cream"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
