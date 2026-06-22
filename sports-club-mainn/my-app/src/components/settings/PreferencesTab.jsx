"use client";

import toast from "react-hot-toast";
import { usePreferences } from "@/src/context/PreferencesContext";
import CustomDropdown from "@/src/components/CustomDropdown";

export default function PreferencesTab() {
  const { preferences, setPreferences, t } = usePreferences();

  const updatePreference = (key, value) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    toast.success("Preferences saved successfully!");
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10">
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">
          {t.settings}
        </h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
          {t.customizeExperience}
        </p>

        <div className="mt-10 space-y-8 max-w-xl">
          <CustomDropdown
            label={t.language}
            value={preferences.language}
            options={["English", "French", "Spanish", "German"]}
            onChange={(value) => updatePreference("language", value)}
          />

          <CustomDropdown
            label={t.timezone}
            value={preferences.timezone}
            options={["UTC", "GMT", "EST", "PST"]}
            onChange={(value) => updatePreference("timezone", value)}
          />

          <CustomDropdown
            label={t.theme}
            value={preferences.theme}
            options={["Light", "Dark", "System"]}
            onChange={(value) => updatePreference("theme", value)}
          />

          <div className="flex justify-between items-center bg-slate-950/50 p-6 rounded-2xl border border-slate-800 shadow-xl group hover:border-emerald-500/30 transition-all">
            <div>
              <p className="text-sm font-black text-slate-200 uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                {t.compactView}
              </p>
              <p className="text-[10px] text-slate-600 font-medium mt-1">
                {t.showMore}
              </p>
            </div>

            <button
              onClick={() =>
                updatePreference("compactView", !preferences.compactView)
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-xl transition-all duration-500 border
                ${preferences.compactView
                  ? "bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 border-slate-800"
                }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-lg bg-white shadow-xl transition-all duration-500
                  ${preferences.compactView
                    ? "translate-x-6"
                    : "translate-x-1"
                  }`}
              />
            </button>
          </div>

          <div className="pt-6">
            <button
              onClick={handleSave}
              className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              {t.savePreferences}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}