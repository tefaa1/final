"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Search, Check, Upload, Camera, Users, Loader2 } from "lucide-react";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";
import { PRESET_AVATARS } from "./groupChat";
import { photoFor } from "./senderDirectory";

// A premium dark "create group" modal:
//   - name + description
//   - a PHOTO (paste a URL or upload an image -> data URL) OR pick a preset avatar
//   - invite members from the REAL users directory (api.getUsers)
//
// On submit it returns the assembled definition object to the parent, which
// persists it via api.chatGroups.create (real backend group + invitations).
// No ids are ever shown — names + avatars only.

function MemberAvatar({ user, size = 34 }) {
  const photo = photoFor(user.keycloakId);
  const [broken, setBroken] = useState(false);
  if (photo && !broken) {
    return (
      <img
        src={photo}
        alt={user.name}
        onError={() => setBroken(true)}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <PlayerAvatar name={user.name} sport="General" size={size} className="rounded-full shrink-0" />
  );
}

export default function CreateGroupModal({ open, onClose, onCreate, users, meId, busy }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [selected, setSelected] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  // Reset whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setPhotoUrl("");
      setAvatar(PRESET_AVATARS[0]);
      setSelected(new Set());
      setQuery("");
      setErr("");
    }
  }, [open]);

  // Selectable directory = every real user except me (I'm added automatically).
  const directory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users || [])
      .filter((u) => u.keycloakId && u.keycloakId !== meId)
      .filter((u) => !q || u.name.toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users, query, meId]);

  if (!open) return null;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Please choose an image file.");
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      setErr("Image is too large (max ~1.5 MB). Paste a URL instead.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setErr("Give your group a name.");
      return;
    }
    setErr("");
    onCreate({
      name: trimmed,
      description: description.trim(),
      photoUrl: photoUrl.trim() || null,
      avatar: photoUrl.trim() ? null : avatar,
      members: [...selected],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a]">
          <span className="grid place-items-center w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <Users size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black text-white tracking-tight">New group</h2>
            <p className="text-[11px] font-bold text-slate-400">Name it, give it a face, invite the squad.</p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-slate-400 hover:text-white disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
          {/* Photo / avatar */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Group"
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-700"
                  onError={() => setPhotoUrl("")}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 grid place-items-center text-3xl">
                  {avatar}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Camera size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={photoUrl.startsWith("data:") ? "" : photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder={photoUrl.startsWith("data:") ? "Uploaded image ✓" : "Paste photo URL…"}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
                  />
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40"
                >
                  <Upload size={14} /> Upload
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
              </div>
              {photoUrl && (
                <button
                  onClick={() => setPhotoUrl("")}
                  className="text-[11px] font-bold text-slate-500 hover:text-rose-400"
                >
                  Remove photo — use a preset avatar
                </button>
              )}
            </div>
          </div>

          {/* Preset avatars (only relevant when no photo) */}
          {!photoUrl && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Pick an avatar</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_AVATARS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAvatar(a)}
                    className={`w-10 h-10 rounded-xl text-xl grid place-items-center border transition-all ${
                      avatar === a
                        ? "bg-emerald-500/20 border-emerald-500/60 scale-105"
                        : "bg-slate-800 border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name + description */}
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name (e.g. Medical Team)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's this group for? (optional)"
              className="w-full resize-none bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
            />
          </div>

          {/* Member picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                Invite members
              </p>
              <span className="text-[10px] font-black text-emerald-400 tabular-nums">
                {selected.size} selected
              </span>
            </div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people…"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="max-h-52 overflow-y-auto custom-scrollbar rounded-xl border border-slate-800 divide-y divide-slate-800/60">
              {directory.length === 0 ? (
                <p className="px-3 py-4 text-[11px] text-slate-600 font-bold text-center">
                  No people match “{query}”.
                </p>
              ) : (
                directory.map((u) => {
                  const on = selected.has(u.keycloakId);
                  return (
                    <button
                      key={u.keycloakId}
                      onClick={() => toggle(u.keycloakId)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                        on ? "bg-emerald-500/10" : "hover:bg-slate-800/50"
                      }`}
                    >
                      <MemberAvatar user={u} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-slate-200 truncate">{u.name}</p>
                        {u.role && (
                          <p className="text-[10px] font-bold text-slate-500 truncate uppercase tracking-wider">
                            {u.role}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 w-5 h-5 rounded-md grid place-items-center border ${
                          on
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-600 text-transparent"
                        }`}
                      >
                        <Check size={13} />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {err && <p className="text-[12px] font-bold text-rose-400">{err}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-800 bg-slate-900/80">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
            Create group
          </button>
        </div>
      </div>
    </div>
  );
}
