"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Check, Clock, Sun, Moon, Monitor } from "lucide-react";
import { loadSection, saveSection, applyAppearance } from "./settingsStore";

/* English labels for this tab. (Multi-language switching was removed — the app
   is English-only, so we keep a single, flat label set.) */
const T = { settings: "Preferences", subtitle: "Customize your experience", timezone: "Timezone", theme: "Theme", compactView: "Compact View", showMore: "Show more content in less space", save: "Save Preferences", saved: "Preferences saved", light: "Light", dark: "Dark", system: "System", localTime: "Current time" };

// IANA zones so we can render a real, live clock for the chosen timezone.
const TIMEZONES = [
  { label: "UTC", zone: "UTC" },
  { label: "London (GMT/BST)", zone: "Europe/London" },
  { label: "Madrid / Barcelona (CET)", zone: "Europe/Madrid" },
  { label: "New York (EST)", zone: "America/New_York" },
  { label: "Los Angeles (PST)", zone: "America/Los_Angeles" },
  { label: "Dubai (GST)", zone: "Asia/Dubai" },
  { label: "Tokyo (JST)", zone: "Asia/Tokyo" },
];

// `language` kept only as a harmless inert default for back-compat with any
// previously persisted prefs blob — it has no UI and never changes.
const DEFAULTS = { language: "English", timezone: "UTC", theme: "Dark", compactView: false };

/* Dark-on-brand dropdown (the shared CustomDropdown renders light/white because
   it relies on `dark:` variants this app never enables). */
function Dropdown({ icon: Icon, label, value, options, render, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  return (
    <div className="space-y-2" ref={ref}>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex justify-between items-center bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 text-sm font-medium hover:border-emerald-500/40 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all"
        >
          <span className="flex items-center gap-2.5">
            {Icon && <Icon size={15} className="text-emerald-400" />}
            {render ? render(value) : value}
          </span>
          <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute z-30 mt-2 w-full rounded-xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden py-1">
            {options.map((opt) => {
              const key = typeof opt === "string" ? opt : opt.value;
              const selected = key === value;
              return (
                <button
                  type="button"
                  key={String(opt.value ?? opt.label ?? opt)}
                  onClick={() => { onChange(key); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-5 py-2.5 text-sm text-left transition-colors ${selected ? "text-emerald-400 bg-emerald-500/10" : "text-slate-300 hover:bg-slate-800"}`}
                >
                  <span>{typeof opt === "string" ? opt : opt.label}</span>
                  {selected && <Check size={15} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PreferencesTab() {
  const [prefs, setPrefs] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(new Date());

  // Load saved prefs on mount and apply the appearance so it round-trips reloads.
  useEffect(() => {
    const saved = loadSection("preferences", DEFAULTS);
    setPrefs(saved);
    applyAppearance({ theme: saved.theme, compact: saved.compactView });
    setLoaded(true);
  }, []);

  // Tick a live clock so the chosen timezone is visibly reflected.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Persist + apply effects immediately on every change (no "stale until save").
  const update = (key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      saveSection("preferences", next);
      applyAppearance({ theme: next.theme, compact: next.compactView });
      return next;
    });
  };

  const tz = TIMEZONES.find((z) => z.label === prefs.timezone) || TIMEZONES[0];
  let clock = "—";
  try {
    clock = new Intl.DateTimeFormat(undefined, {
      timeZone: tz.zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    }).format(now);
  } catch { /* invalid zone — leave dash */ }

  const themeOptions = [
    { value: "Light", label: T.light },
    { value: "Dark", label: T.dark },
    { value: "System", label: T.system },
  ];
  const themeLabel = (v) => themeOptions.find((o) => o.value === v)?.label || v;
  const ThemeIcon = prefs.theme === "Light" ? Sun : prefs.theme === "System" ? Monitor : Moon;

  if (!loaded) return null;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden settings-density">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10">
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">{T.settings}</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">{T.subtitle}</p>

        <div className="mt-10 space-y-8 max-w-xl">
          <div>
            <Dropdown
              icon={Clock}
              label={T.timezone}
              value={prefs.timezone}
              options={TIMEZONES}
              render={(v) => (TIMEZONES.find((z) => z.label === v)?.label || v)}
              onChange={(v) => update("timezone", v)}
            />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 ml-1">
              {T.localTime}: <span className="text-emerald-400 tabular-nums">{clock}</span>
            </p>
          </div>

          <Dropdown
            icon={ThemeIcon}
            label={T.theme}
            value={prefs.theme}
            options={themeOptions}
            render={themeLabel}
            onChange={(v) => update("theme", v)}
          />

          <div className="flex justify-between items-center bg-slate-950/50 p-6 rounded-2xl border border-slate-800 shadow-xl group hover:border-emerald-500/30 transition-all">
            <div>
              <p className="text-sm font-black text-slate-200 uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{T.compactView}</p>
              <p className="text-[10px] text-slate-600 font-medium mt-1">{T.showMore}</p>
            </div>
            <button
              type="button"
              aria-pressed={prefs.compactView}
              onClick={() => update("compactView", !prefs.compactView)}
              className={`relative inline-flex h-7 w-12 items-center rounded-xl transition-all duration-500 border
                ${prefs.compactView ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20" : "bg-slate-900 border-slate-800"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-lg bg-white shadow-xl transition-all duration-500 ${prefs.compactView ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => { saveSection("preferences", prefs); toast.success(T.saved); }}
              className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              {T.save}
            </button>
            <p className="text-[10px] text-slate-600 font-medium mt-3">
              Changes apply and save instantly — this button is just a confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
