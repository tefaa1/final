"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "@/lib/translations";

const PreferencesContext = createContext();

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState({
    language: "English",
    timezone: "UTC",
    theme: "Light", // ✅ Default Light
    compactView: false,
  });

  const [mounted, setMounted] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem("preferences");

    if (saved) {
      const parsed = JSON.parse(saved);
      setPreferences(parsed);

      // Apply theme immediately to prevent flicker
      const root = document.documentElement;
      if (parsed.theme === "Dark") {
        root.classList.add("dark");
      } else if (parsed.theme === "Light") {
        root.classList.remove("dark");
      } else {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.matches
          ? root.classList.add("dark")
          : root.classList.remove("dark");
      }
    } else {
      // Ensure Light mode if no saved preferences
      document.documentElement.classList.remove("dark");
    }

    setMounted(true);
  }, []);

  // Apply preferences globally whenever they change
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem("preferences", JSON.stringify(preferences));
    const root = document.documentElement;

    // ======================
    // THEME HANDLING
    // ======================
    const applyDark = () => root.classList.add("dark");
    const applyLight = () => root.classList.remove("dark");

    if (preferences.theme === "Dark") {
      applyDark();
    } else if (preferences.theme === "Light") {
      applyLight();
    } else {
      // System mode
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.matches ? applyDark() : applyLight();
    }

    // ======================
    // COMPACT MODE
    // ======================
    if (preferences.compactView) {
      root.classList.add("compact");
    } else {
      root.classList.remove("compact");
    }

  }, [preferences, mounted]);

  const t = translations[preferences.language] || translations.English;

  // Prevent flicker before mount
  if (!mounted) return null;

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, t }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);