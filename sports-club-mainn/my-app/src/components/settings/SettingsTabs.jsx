"use client";

import { useState } from "react";
import ProfileTab from "./ProfileTab";
import SecurityTab from "./SecurityTab";
import PreferencesTab from "./PreferencesTab";
import NotificationsTab from "./NotificationsTab";
import { PageHeader } from "@/src/components/shared/SharedComponents";
import { Settings as SettingsIcon, User, Bell, Shield, Sliders } from "lucide-react";

const TABS = [
  ["Profile", User],
  ["Notifications", Bell],
  ["Security", Shield],
  ["Preferences", Sliders],
];

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="w-full min-h-screen bg-slate-950 p-6 overflow-y-auto fade-in">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Manage your account, security and preferences"
      />

      {/* Tabs */}
      <div className="inline-flex flex-wrap gap-1 bg-slate-900/50 backdrop-blur-sm rounded-xl p-1 border border-slate-800 mb-6">
        {TABS.map(([tab, Icon]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300
              ${activeTab === tab
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              }`}
          >
            <Icon size={14} />
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === "Profile" && <ProfileTab />}
        {activeTab === "Notifications" && <NotificationsTab />}
        {activeTab === "Security" && <SecurityTab />}
        {activeTab === "Preferences" && <PreferencesTab />}
      </div>
    </div>
  );
}

