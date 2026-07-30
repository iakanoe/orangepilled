"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
      aria-pressed={isDark}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span className="flex flex-col">
        <span className="font-medium">Modo oscuro</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {mounted ? (isDark ? "Activado" : "Desactivado") : ""}
        </span>
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          isDark ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            isDark ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
