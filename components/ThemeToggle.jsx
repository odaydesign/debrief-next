"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Theme toggle. Flips data-theme on <html> between the light "paper" (default)
 * and dark "ink" palettes and persists the choice. The initial theme is set
 * pre-paint by the bootstrap script in app/layout.js.
 *
 * `inline` renders the bare button (for the top nav); otherwise it floats.
 */
const THEME_COLORS = { ink: "#26231f", paper: "#fbfbfa" };

// Keep the browser/OS chrome (PWA title bar, Android status bar) in sync.
const syncThemeColor = (theme) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.paper);
};

export default function ThemeToggle({ inline = false }) {
  const [theme, setTheme] = useState("paper");

  useEffect(() => {
    const current = document.documentElement.dataset.theme || "paper";
    setTheme(current);
    syncThemeColor(current);
  }, []);

  const toggle = () => {
    const next = theme === "ink" ? "paper" : "ink";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("debrief-theme", next);
    } catch {
      /* ignore */
    }
    syncThemeColor(next);
    setTheme(next);
  };

  const inlineCls =
    "w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-surface transition-colors active:scale-90";
  const floatCls =
    "fixed right-[64px] z-[70] w-10 h-10 rounded-full bg-card border border-line shadow-lg flex items-center justify-center text-ink hover:bg-surface transition-colors active:scale-90";

  return (
    <button
      onClick={toggle}
      aria-label="Byt tema"
      className={inline ? inlineCls : floatCls}
      style={inline ? undefined : { top: "max(20px, calc(env(safe-area-inset-top) + 8px))" }}
    >
      {theme === "ink" ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
    </button>
  );
}
