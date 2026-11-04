"use client";
import { useEffect, useState } from "react";
import { ThemeIcon } from "./icons";

// Theme switcher: Original (warm, default), Light, Dark. Saved per browser.
const KEY = "tripdiary-theme";
const OPTIONS = [
  { value: "default", label: "Original", swatch: "swatch-warm" },
  { value: "light", label: "Light", swatch: "swatch-light" },
  { value: "dark", label: "Dark", swatch: "swatch-dark" },
];

export default function ThemeMenu() {
  const [theme, setTheme] = useState("default");

  useEffect(() => {
    try { setTheme(localStorage.getItem(KEY) || "default"); } catch {}
  }, []);

  function pick(value: string) {
    setTheme(value);
    const root = document.documentElement;
    if (value === "default") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", value);
    try { localStorage.setItem(KEY, value); } catch {}
  }

  return (
    <details className="theme-menu">
      <summary aria-label="Change theme" title="Change theme"><ThemeIcon /></summary>
      <div className="theme-panel">
        <p>Theme</p>
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="menuitemradio"
            aria-checked={theme === o.value}
            className="theme-option"
            onClick={() => pick(o.value)}
          >
            <span className={`theme-swatch ${o.swatch}`} />
            {o.label}
          </button>
        ))}
      </div>
    </details>
  );
}
