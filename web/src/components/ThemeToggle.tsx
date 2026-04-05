"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function applyTheme(t: Theme) {
  if (t === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", t);
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  // Load theme from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && ["light", "dark", "system"].includes(saved)) {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function cycleTheme() {
    const next: Theme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("theme", next);
  }

  const label = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";
  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀" : "⚙";

  return (
    <button
      onClick={cycleTheme}
      title={`Theme: ${label} (click to change)`}
      className="w-full px-3 py-2 text-sm text-cream-muted hover:text-cream rounded-lg hover:bg-charcoal-light transition-colors text-left flex items-center gap-3"
    >
      <span className="w-5 text-center text-xs" aria-hidden="true">{icon}</span>
      Theme: {label}
    </button>
  );
}
