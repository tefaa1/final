"use client";
import React, { useState } from "react";
import { FiUser } from "react-icons/fi";
import { api } from "@/src/lib/api";

// Backend POST /players schema (from Swagger). 17 fields creating a
// Keycloak user (PLAYER role) + player record in one call.

// Must match backend Position enum exactly (user-management/.../Position.java).
// Handball entries are HB_ prefixed to avoid clash with Football wing/back names.
const POSITIONS = [
  // Football
  "GOALKEEPER", "RIGHT_BACK", "LEFT_BACK", "CENTER_BACK",
  "DEFENSIVE_MID", "CENTRAL_MID", "ATTACKING_MID",
  "RIGHT_WING", "LEFT_WING", "STRIKER",
  // Basketball
  "POINT_GUARD", "SHOOTING_GUARD", "SMALL_FORWARD", "POWER_FORWARD", "CENTER",
  // Tennis
  "SINGLES_PLAYER", "DOUBLES_PLAYER",
  // Volleyball
  "SETTER", "OUTSIDE_HITTER", "OPPOSITE_HITTER", "MIDDLE_BLOCKER", "LIBERO", "DEFENSIVE_SPECIALIST",
  // Handball
  "HB_GOALKEEPER", "HB_LEFT_WING", "HB_RIGHT_WING",
  "HB_LEFT_BACK", "HB_RIGHT_BACK", "HB_CENTRE_BACK", "HB_PIVOT",
  // Swimming
  "FREESTYLE_SWIMMER", "BACKSTROKE_SWIMMER", "BREASTSTROKE_SWIMMER",
  "BUTTERFLY_SWIMMER", "MEDLEY_SWIMMER",
];

const NATIONALITIES = [
  "Spanish", "Catalan", "German", "Polish", "French",
  "Portuguese", "Brazilian", "Argentinian", "Uruguayan", "Dutch",
  "Italian", "English", "Czech", "Other",
];

const STATUSES = ["AVAILABLE", "INJURED", "SUSPENDED", "RETIRED"];

const defaultForm = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  age: "",
  phone: "",
  address: "",
  gender: "MALE",
  dateOfBirth: "",
  nationality: "Spanish",
  preferredPosition: "STRIKER",
  marketValue: "",
  kitNumber: "",
  rosterId: "0",
  contractId: "0",
  status: "AVAILABLE",
};

// Defined outside Modal so the input ref stays stable across re-renders.
function Field({ label, error, children, full }) {
  return (
    <div className={`flex flex-col gap-2 ${full ? "col-span-2" : ""}`}>
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
        {label}
      </label>
      {children}
      {error && (
        <span className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-1">
          {error}
        </span>
      )}
    </div>
  );
}

export default function Modal({ open, onClose, onAddPlayer }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    const username = (form.username || "").trim();
    if (!username) e.username = "Required";
    // Keycloak username policy: letters, digits, dot, underscore, dash only.
    else if (!/^[a-zA-Z0-9._-]+$/.test(username)) e.username = "No spaces / special chars (use . _ - only)";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required";
    if (!form.password || form.password.length < 8) e.password = "Min 8 chars";
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    const age = Number(form.age);
    if (!age || age < 14 || age > 50) e.age = "Age 14–50";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.dateOfBirth) e.dateOfBirth = "Required";
    if (!form.kitNumber || Number(form.kitNumber) < 1 || Number(form.kitNumber) > 99) {
      e.kitNumber = "Kit 1–99";
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      age: Number(form.age),
      phone: form.phone.trim(),
      address: form.address.trim() || "N/A",
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      nationality: form.nationality,
      preferredPosition: form.preferredPosition,
      marketValue: Number(form.marketValue) || 0,
      kitNumber: Number(form.kitNumber),
      rosterId: Number(form.rosterId) || 0,
      contractId: Number(form.contractId) || 0,
      status: form.status,
    };

    setSubmitting(true);
    try {
      await api.createPlayer(payload);
      if (onAddPlayer) await onAddPlayer();
      handleClose();
      alert("Player created successfully.");
    } catch (err) {
      console.error("Create player error:", err);
      alert(err.message || "Failed to create player. Check the fields and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  const inputCls = (key) =>
    `bg-slate-900/50 border rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all w-full placeholder:text-slate-600
     ${errors[key]
      ? "border-red-500/50 focus:border-red-500 ring-2 ring-red-500/10"
      : "border-slate-800 focus:border-emerald-500 ring-2 ring-transparent focus:ring-emerald-500/10"
    }`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <style>{`@keyframes fmIn{0%{opacity:0;transform:translateY(12px) scale(.96)}100%{opacity:1;transform:none}}`}</style>
      <div className="relative bg-slate-950 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-800 overflow-hidden" style={{ animation: "fmIn .25s cubic-bezier(.2,.8,.2,1)" }}>

        {/* gradient header */}
        <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a] px-6 py-5">
          <div className="absolute -right-6 -top-8 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-lg">
              <FiUser size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="font-black text-white text-lg uppercase tracking-tight leading-none">Register New Player</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.22em] mt-1.5">FC Barcelona · MSCMS</p>
            </div>
            <button
              onClick={handleClose}
              className="ml-auto w-8 h-8 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm leading-none transition-all cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-6 grid grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">

          {/* --- Account --- */}
          <Field label="Username *" error={errors.username}>
            <input className={inputCls("username")} placeholder="player01" value={form.username} onChange={(e) => set("username", e.target.value)} />
          </Field>

          <Field label="Email *" error={errors.email}>
            <input type="email" className={inputCls("email")} placeholder="player@club.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>

          <Field label="Password (min 8) *" error={errors.password} full>
            <input type="password" className={inputCls("password")} placeholder="At least 8 characters" value={form.password} onChange={(e) => set("password", e.target.value)} />
          </Field>

          {/* --- Personal --- */}
          <Field label="First Name *" error={errors.firstName}>
            <input className={inputCls("firstName")} placeholder="John" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </Field>

          <Field label="Last Name *" error={errors.lastName}>
            <input className={inputCls("lastName")} placeholder="Doe" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </Field>

          <Field label="Age *" error={errors.age}>
            <input type="number" min={14} max={50} className={inputCls("age")} placeholder="24" value={form.age} onChange={(e) => set("age", e.target.value)} />
          </Field>

          <Field label="Gender" error={errors.gender}>
            <select className={inputCls("gender")} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="MALE" className="bg-slate-950">MALE</option>
              <option value="FEMALE" className="bg-slate-950">FEMALE</option>
            </select>
          </Field>

          <Field label="Phone *" error={errors.phone}>
            <input className={inputCls("phone")} placeholder="+34xxxxxxxxx" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>

          <Field label="Date of Birth *" error={errors.dateOfBirth}>
            <input type="date" className={inputCls("dateOfBirth")} value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </Field>

          <Field label="Address" error={errors.address} full>
            <input className={inputCls("address")} placeholder="City, Country" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>

          <Field label="Nationality" error={errors.nationality}>
            <select className={inputCls("nationality")} value={form.nationality} onChange={(e) => set("nationality", e.target.value)}>
              {NATIONALITIES.map((n) => <option key={n} value={n} className="bg-slate-950">{n}</option>)}
            </select>
          </Field>

          {/* --- Player specifics --- */}
          <Field label="Preferred Position" error={errors.preferredPosition}>
            <select className={inputCls("preferredPosition")} value={form.preferredPosition} onChange={(e) => set("preferredPosition", e.target.value)}>
              {POSITIONS.map((p) => <option key={p} value={p} className="bg-slate-950">{p}</option>)}
            </select>
          </Field>

          <Field label="Kit Number * (1–99)" error={errors.kitNumber}>
            <input type="number" min={1} max={99} className={inputCls("kitNumber")} placeholder="10" value={form.kitNumber} onChange={(e) => set("kitNumber", e.target.value)} />
          </Field>

          <Field label="Market Value (€)" error={errors.marketValue}>
            <input type="number" min={0} className={inputCls("marketValue")} placeholder="0" value={form.marketValue} onChange={(e) => set("marketValue", e.target.value)} />
          </Field>

          <Field label="Status" error={errors.status}>
            <select className={inputCls("status")} value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s} className="bg-slate-950">{s}</option>)}
            </select>
          </Field>

        </div>

        {/* Footer */}
        <div className="flex gap-4 px-6 py-6 border-t border-slate-800">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-900 hover:text-slate-200 cursor-pointer transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating..." : "Create Player"}
          </button>
        </div>

      </div>
    </div>
  );
}
