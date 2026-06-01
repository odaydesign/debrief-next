"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Floating theme toggle (top-left). Flips data-theme on <html> between the
 * dark "ink" and light "paper" palettes and persists the choice. The initial
 * theme is set pre-paint by the bootstrap script in app/layout.js.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState("ink");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || "ink");
  }, []);

  const toggle = () => {
    const next = theme === "ink" ? "paper" : "ink";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("debrief-theme", next);
    } catch {
      /* ignore */
    }
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Byt tema"
      className="fixed top-5 right-[64px] z-[70] w-10 h-10 rounded-full bg-card border border-line shadow-lg flex items-center justify-center text-ink hover:bg-surface transition-colors active:scale-90"
    >
      {theme === "ink" ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
    </button>
  );
}
