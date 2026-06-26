"use client";

import { useState, useEffect } from "react";
import { loadSection, saveSection, getClaims, getEmail, getRoleLabel } from "./settingsStore";

const SECTION = "profile";
const BIO_MAX = 400;
const AVATAR_MAX_BYTES = 3.5 * 1024 * 1024; // ~3.5MB (base64 inflation + localStorage cap)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const DEFAULT_PROFILE = { fullName: "", email: "", phone: "", bio: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s().-]{7,20}$/;

export default function ProfileTab() {
  const [image, setImage] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Real identity from the JWT — this is the authoritative role + email.
    const claims = getClaims();
    const jwtName =
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
      claims.preferred_username ||
      "";
    const jwtEmail = getEmail();
    setRole(getRoleLabel());

    // Layer the user's saved edits (per-user namespaced) over the JWT seed.
    const saved = loadSection(SECTION, {});
    setProfile({
      fullName: saved.fullName ?? jwtName,
      email: saved.email ?? jwtEmail,
      phone: saved.phone ?? "",
      bio: saved.bio ?? "",
    });
    if (saved.image) setImage(saved.image);
  }, []);

  const set = (key, val) => {
    setProfile((p) => ({ ...p, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!profile.fullName.trim()) e.fullName = "Name is required.";
    if (!profile.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(profile.email.trim())) e.email = "Enter a valid email address.";
    if (profile.phone.trim() && !PHONE_RE.test(profile.phone.trim())) e.phone = "Enter a valid phone number (7–20 digits).";
    if (profile.bio.length > BIO_MAX) e.bio = `Bio must be ${BIO_MAX} characters or fewer.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageUpload = (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setStatus(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setStatus({ type: "error", msg: "Unsupported format. Use JPG, PNG, GIF or WebP." });
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setStatus({ type: "error", msg: "Image too large (max 3.5 MB). Pick a smaller one." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl === "string") {
        setImage(dataUrl);
        setStatus({ type: "success", msg: 'Click "Save Changes" to keep this photo.' });
      }
    };
    reader.onerror = () => setStatus({ type: "error", msg: "Could not read that image." });
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setStatus({ type: "success", msg: 'Photo cleared — click "Save Changes" to confirm.' });
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setStatus(null);
    if (!validate()) {
      setStatus({ type: "error", msg: "Please fix the highlighted fields." });
      return;
    }

    setSaving(true);
    try {
      // No /profile endpoint on the backend — persist per-user locally so the
      // form (and the avatar, as a base64 data URL) round-trips a reload.
      const persisted = {
        fullName: profile.fullName.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        bio: profile.bio,
        image: image || null,
      };
      saveSection(SECTION, persisted);
      await new Promise((r) => setTimeout(r, 250));
      setStatus({ type: "success", msg: "Profile saved." });
    } catch (err) {
      if (err && /quota/i.test(err.message || err.name || "")) {
        setStatus({ type: "error", msg: "Image too large to store. Pick a smaller one." });
      } else {
        setStatus({ type: "error", msg: err.message || "Failed to save profile." });
      }
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = (key) =>
    `w-full bg-slate-950 border rounded-xl px-5 py-3 text-slate-100 text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-800 ${
      errors[key] ? "border-rose-500/60 focus:border-rose-500/60" : "border-slate-800 focus:border-emerald-500/50"
    }`;

  return (
    <form onSubmit={handleSave} className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden settings-density">
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10">
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Profile Information</h2>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Update your personal details</p>

        {/* Avatar */}
        <div className="flex items-center gap-8 mt-10">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-2xl flex-shrink-0 relative group">
            {image ? (
              <img src={image} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-700 text-[10px] font-black uppercase tracking-widest">No Image</div>
            )}
            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <label className="inline-block cursor-pointer bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/5 active:scale-95">
                Change Photo
                <input type="file" className="hidden" accept="image/png,image/jpeg,image/gif,image/webp" onChange={handleImageUpload} />
              </label>
              {image && (
                <button type="button" onClick={removeImage} className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300 px-3 py-2.5 rounded-xl hover:bg-rose-500/10 transition-all">
                  Remove
                </button>
              )}
            </div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-3">JPG, PNG, GIF or WebP. Max 3.5MB.</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <input type="text" value={profile.fullName} onChange={(e) => set("fullName", e.target.value)} className={fieldCls("fullName")} />
            {errors.fullName && <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">{errors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Email</label>
            <input type="email" value={profile.email} onChange={(e) => set("email", e.target.value)} className={fieldCls("email")} />
            {errors.email && <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Role</label>
            <input type="text" value={role || "—"} disabled className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-3 text-slate-500 text-sm font-black uppercase tracking-widest cursor-not-allowed opacity-60" />
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">From your account — not editable here.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Phone</label>
            <input type="tel" value={profile.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+34 600 000 000" className={fieldCls("phone")} />
            {errors.phone && <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">{errors.phone}</p>}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Bio</label>
            <span className={`text-[10px] font-black uppercase tracking-widest ${profile.bio.length > BIO_MAX ? "text-rose-400" : "text-slate-600"}`}>
              {profile.bio.length}/{BIO_MAX}
            </span>
          </div>
          <textarea
            rows="4"
            maxLength={BIO_MAX + 50}
            placeholder="Tell us about yourself..."
            value={profile.bio}
            onChange={(e) => set("bio", e.target.value)}
            className={`w-full bg-slate-950 border rounded-2xl px-5 py-4 text-slate-100 text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all resize-none placeholder:text-slate-800 ${
              errors.bio ? "border-rose-500/60 focus:border-rose-500/60" : "border-slate-800 focus:border-emerald-500/50"
            }`}
          />
          {errors.bio && <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">{errors.bio}</p>}
        </div>

        {/* Save */}
        <div className="mt-10 flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-500 px-10 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {status && (
            <span className={`text-[10px] font-black uppercase tracking-widest ${status.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>
              {status.msg}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
