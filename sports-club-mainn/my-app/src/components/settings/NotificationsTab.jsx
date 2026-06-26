"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Mail, BellRing, Trophy, Dumbbell, HeartPulse, Check, X } from "lucide-react";
import { loadSection, saveSection } from "./settingsStore";

const DEFAULTS = {
  email: true,
  push: true,
  matchUpdates: true,
  trainingReminders: true,
  medicalAlerts: true,
};

/* ------------------ Reusable UI ------------------ */

function ToggleSwitch({ enabled, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={enabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-xl transition-all duration-500 border disabled:opacity-50
        ${enabled ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20" : "bg-slate-950 border-slate-800"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-lg bg-white shadow-xl transition-all duration-500 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

function NotificationItem({ icon: Icon, title, description, value, onToggle, badge }) {
  return (
    <div className="settings-row flex justify-between items-center py-6 border-b border-slate-800/50 last:border-0 group hover:bg-emerald-500/5 px-4 -mx-4 rounded-2xl transition-all">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl border ${value ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-slate-950 border-slate-800 text-slate-600"} transition-colors`}>
          <Icon size={16} />
        </div>
        <div>
          <p className="text-sm font-black text-slate-100 uppercase tracking-tight group-hover:text-emerald-400 transition-colors flex items-center gap-2">
            {title}
            {badge}
          </p>
          <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wide">{description}</p>
        </div>
      </div>
      <ToggleSwitch enabled={value} onClick={onToggle} />
    </div>
  );
}

/* ------------------ Main ------------------ */

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  // Browser Notification permission so the Push toggle is demonstrably real.
  const [pushPerm, setPushPerm] = useState("default");

  useEffect(() => {
    setNotifications(loadSection("notifications", DEFAULTS));
    if (typeof Notification !== "undefined") setPushPerm(Notification.permission);
    setLoaded(true);
  }, []);

  // Persist immediately so a reload keeps the change (load on mount, save on change).
  const persist = (next) => {
    setNotifications(next);
    saveSection("notifications", next);
  };

  const toggle = (key) => persist({ ...notifications, [key]: !notifications[key] });

  // The Push toggle is wired to a real effect: enabling it requests OS/browser
  // notification permission; if granted we fire a confirmation notification.
  const togglePush = async () => {
    const turningOn = !notifications.push;
    if (turningOn && typeof Notification !== "undefined") {
      if (Notification.permission === "default") {
        try {
          const perm = await Notification.requestPermission();
          setPushPerm(perm);
          if (perm !== "granted") {
            toast.error("Push blocked by the browser. Saved preference, but the browser won't deliver pushes.");
          } else {
            new Notification("Sportify push enabled", { body: "You'll receive push notifications here." });
          }
        } catch { /* permission API unavailable — still persist the preference */ }
      } else if (Notification.permission === "granted") {
        new Notification("Sportify push enabled", { body: "You'll receive push notifications here." });
      } else if (Notification.permission === "denied") {
        toast.error("Push is blocked in your browser settings. Preference saved.");
      }
    }
    persist({ ...notifications, push: turningOn });
  };

  const handleSave = () => {
    saveSection("notifications", notifications);
    const on = Object.values(notifications).filter(Boolean).length;
    toast.success(`Saved — ${on} of 5 channels enabled.`);
  };

  if (!loaded) return null;

  const pushBadge =
    notifications.push && typeof Notification !== "undefined" ? (
      pushPerm === "granted" ? (
        <span className="inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Check size={9} /> Browser allowed</span>
      ) : pushPerm === "denied" ? (
        <span className="inline-flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20"><X size={9} /> Browser blocked</span>
      ) : null
    ) : null;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden settings-density">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10">
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Notification Preferences</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Manage how you receive updates</p>

        <div className="mt-10 space-y-2 max-w-2xl bg-slate-950/30 p-4 rounded-3xl border border-slate-800/50 shadow-inner">
          <NotificationItem icon={Mail} title="Email Notifications" description="Receive notifications via email" value={notifications.email} onToggle={() => toggle("email")} />
          <NotificationItem icon={BellRing} title="Push Notifications" description="Receive push notifications on your device" value={notifications.push} onToggle={togglePush} badge={pushBadge} />
          <NotificationItem icon={Trophy} title="Match Updates" description="Get notified about match results and schedules" value={notifications.matchUpdates} onToggle={() => toggle("matchUpdates")} />
          <NotificationItem icon={Dumbbell} title="Training Reminders" description="Reminders for upcoming training sessions" value={notifications.trainingReminders} onToggle={() => toggle("trainingReminders")} />
          <NotificationItem icon={HeartPulse} title="Medical Alerts" description="Important health and injury updates" value={notifications.medicalAlerts} onToggle={() => toggle("medicalAlerts")} />
        </div>

        <div className="pt-10">
          <button
            type="button"
            onClick={handleSave}
            className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            Save Preferences
          </button>
          <p className="text-[10px] text-slate-600 font-medium mt-3">
            Preferences are stored on this device and reload with the page. Push uses your browser's notification permission.
          </p>
        </div>
      </div>
    </div>
  );
}
