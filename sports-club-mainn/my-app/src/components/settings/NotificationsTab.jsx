"use client";

import { useState } from "react";
import toast from "react-hot-toast";

/* ------------------ Reusable Components (OUTSIDE) ------------------ */

function ToggleSwitch({ enabled, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex h-7 w-12 items-center rounded-xl transition-all duration-500 border
        ${enabled ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20" : "bg-slate-950 border-slate-800"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-lg bg-white shadow-xl transition-all duration-500
          ${enabled ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

function NotificationItem({ title, description, value, onToggle }) {
  return (
    <div className="flex justify-between items-center py-6 border-b border-slate-800/50 last:border-0 group hover:bg-emerald-500/5 px-4 -mx-4 rounded-2xl transition-all">
      <div>
        <p className="text-sm font-black text-slate-100 uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{title}</p>
        <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wide">{description}</p>
      </div>
      <ToggleSwitch enabled={value} onClick={onToggle} />
    </div>
  );
}

/* ------------------ Main Component ------------------ */

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    matchUpdates: true,
    trainingReminders: true,
    medicalAlerts: true,
  });

  const toggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    toast.success("Notification preferences saved!");
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10">
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">
          Notification Preferences
        </h2>

        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
          Manage how you receive updates
        </p>

        <div className="mt-10 space-y-2 max-w-2xl bg-slate-950/30 p-4 rounded-3xl border border-slate-800/50 shadow-inner">
          <NotificationItem
            title="Email Notifications"
            description="Receive notifications via email"
            value={notifications.email}
            onToggle={() => toggle("email")}
          />

          <NotificationItem
            title="Push Notifications"
            description="Receive push notifications on your device"
            value={notifications.push}
            onToggle={() => toggle("push")}
          />

          <NotificationItem
            title="Match Updates"
            description="Get notified about match results and schedules"
            value={notifications.matchUpdates}
            onToggle={() => toggle("matchUpdates")}
          />

          <NotificationItem
            title="Training Reminders"
            description="Reminders for upcoming training sessions"
            value={notifications.trainingReminders}
            onToggle={() => toggle("trainingReminders")}
          />

          <NotificationItem
            title="Medical Alerts"
            description="Important health and injury updates"
            value={notifications.medicalAlerts}
            onToggle={() => toggle("medicalAlerts")}
          />
        </div>

        <div className="pt-10">
          <button
            onClick={handleSave}
            className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}