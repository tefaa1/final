"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "user_profile";

const DEFAULT_PROFILE = {
  fullName: "",
  email: "",
  role: "",
  phone: "",
  bio: "",
};

// Decode a JWT payload without verifying the signature (display only).
function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    ));
  } catch {
    return {};
  }
}

const ROLE_LABELS = {
  admin: "Admin", sport_manager: "Sport Manager", team_manager: "Team Manager",
  head_coach: "Head Coach", assistant_coach: "Assistant Coach", specific_coach: "Specific Coach",
  fitness_coach: "Fitness Coach", performance_analyst: "Performance Analyst",
  team_doctor: "Team Doctor", doctor: "Doctor", physiotherapist: "Physiotherapist",
  scout: "Scout", sponsor: "Sponsor", fan: "Fan", player: "Player",
  national_team: "National Team", staff: "Staff",
};

export default function ProfileTab() {
  const [image, setImage] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // 1) Start from values decoded out of the JWT in localStorage.
    const token = localStorage.getItem("token") || "";
    const claims = token ? decodeJwt(token) : {};
    const role = (localStorage.getItem("user_role") || "").toLowerCase();
    const fromJwt = {
      fullName: claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(" ") || claims.preferred_username || "",
      email: claims.email || "",
      role: ROLE_LABELS[role] || role.replace(/_/g, " ") || "",
      phone: "",
      bio: "",
    };

    // 2) Layer any locally-saved edits on top — including the avatar as
    //    a base64 data URL so it survives a reload (object URLs don't).
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      // ignore corrupt storage
    }

    setProfile({ ...DEFAULT_PROFILE, ...fromJwt, ...saved });
    if (saved.image) setImage(saved.image);
  }, []);

  const set = (key, val) => setProfile((p) => ({ ...p, [key]: val }));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Hard cap at ~3.5MB before we read it. localStorage caps at ~5MB total,
    // and base64 inflates the file by ~33%, so anything bigger is unsafe.
    if (file.size > 3.5 * 1024 * 1024) {
      setStatus({ type: "error", msg: "Image too large (max 3.5 MB). Pick a smaller one." });
      return;
    }

    // Read as data URL (base64) so we can persist it through reloads.
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      if (typeof dataUrl === "string") {
        setImage(dataUrl);
        setStatus({ type: "success", msg: "Click \"Save Changes\" to keep this image." });
      }
    };
    reader.onerror = () => setStatus({ type: "error", msg: "Could not read that image." });
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setStatus(null);

    if (!profile.fullName.trim() || !profile.email.trim()) {
      setStatus({ type: "error", msg: "Name and email are required." });
      return;
    }

    setSaving(true);
    try {
      // No /profile endpoint on the backend yet — persist locally so the
      // form (and the avatar) roundtrip a page reload.
      const persisted = { ...profile, image: image || null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      await new Promise((r) => setTimeout(r, 300)); // tiny delay so the spinner is visible
      setStatus({ type: "success", msg: "Profile saved." });
    } catch (err) {
      // Most common failure: localStorage quota exceeded for very large images.
      if (err && /quota/i.test(err.message || err.name || "")) {
        setStatus({ type: "error", msg: "Image too large to store. Pick a smaller one." });
      } else {
        setStatus({ type: "error", msg: err.message || "Failed to save profile." });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10">
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">
          Profile Information
        </h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Update your personal details</p>

        {/* Avatar Section */}
        <div className="flex items-center gap-8 mt-10">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex-shrink-0 relative group">
            {image ? (
              <img
                src={image}
                alt="Profile"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700 text-[10px] font-black uppercase tracking-widest">
                No Image
              </div>
            )}
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div>
            <label className="inline-block cursor-pointer bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/5 active:scale-95">
              Change Photo
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-3">
              JPG, PNG or GIF. Max 5MB.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
              Full Name
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
              Email
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
              Role
            </label>
            <input
              type="text"
              value={profile.role}
              disabled
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-3 text-slate-500 text-sm font-black uppercase tracking-widest cursor-not-allowed opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
              Phone
            </label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-3 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800"
            />
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Bio</label>
          <textarea
            rows="4"
            placeholder="Tell us about yourself..."
            value={profile.bio}
            onChange={(e) => set("bio", e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-slate-100 text-sm font-medium focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all resize-none placeholder:text-slate-800"
          />
        </div>

        {/* Save Button + Status */}
        <div className="mt-10 flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {status && (
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                status.type === "success" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {status.msg}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
