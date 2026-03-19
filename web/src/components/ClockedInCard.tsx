"use client";

import { useState } from "react";

interface ClockedInEmployee {
  name: string;
  timestamp: string;
}

export default function ClockedInCard({
  count,
  employees,
}: {
  count: number;
  employees: ClockedInEmployee[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left bg-charcoal-mid rounded-xl p-5 border border-charcoal-light hover:border-green/40 transition-colors cursor-pointer"
      >
        <p className="text-sm text-cream-muted">Clocked In Today</p>
        <p className="text-3xl font-bold mt-1 text-green">{count}</p>
        <p className="text-[10px] text-cream-muted mt-1">Click to see who</p>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-charcoal-mid border border-charcoal-light rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-charcoal-light flex justify-between items-center">
            <span className="text-xs font-semibold text-cream">
              Clocked In Today ({employees.length})
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="text-cream-muted hover:text-cream text-xs"
            >
              Close
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {employees.length === 0 ? (
              <p className="px-4 py-3 text-cream-muted text-sm">
                No one has clocked in yet today.
              </p>
            ) : (
              employees.map((emp, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-4 py-2 border-b border-charcoal-light/50 last:border-0"
                >
                  <span className="text-cream text-sm">{emp.name}</span>
                  <span className="text-cream-muted text-xs">
                    {new Date(emp.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
