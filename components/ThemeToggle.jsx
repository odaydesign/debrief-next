"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Floating theme toggle (top-left). Flips data-theme on <html> between the
 * dark "ink" and light "paper" palettes and persists the choice. The initial
 * theme is set pre-paint by the bootstrap script in app/layout.js.
 */
const THEME_COLORS = { ink: "#26231f", paper: "#f4f1ea" };

// Keep the browser/OS chrome (PWA title bar, Android status bar) in sync
// with the active palette.
const syncThemeColor = (theme) => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme] || THEME_COLORS.ink);
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState("ink");

  useEffect(() => {
    const current = document.documentElement.dataset.theme || "ink";
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

  return (
    <button
      onClick={toggle}
      aria-label="Byt tema"
      className="fixed right-[64px] z-[70] w-10 h-10 rounded-full bg-card border border-line shadow-lg flex items-center justify-center text-ink hover:bg-surface transition-colors active:scale-90"
      style={{ top: "max(20px, calc(env(safe-area-inset-top) + 8px))" }}
    >
      {theme === "ink" ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
    </button>
  );
}
