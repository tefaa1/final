"use client";
import React, { useState } from "react";
import { CalendarDays } from "lucide-react";

const SPORTS_CONFIG = {
  Football:   { icon: "⚽", color: "bg-blue-500",   teams: ["First Team", "Junior Team", "Reserve Team"] },
  Basketball: { icon: "🏀", color: "bg-orange-500", teams: ["First Team", "Junior Team"] },
  Handball:   { icon: "🤾", color: "bg-purple-500", teams: ["First Team", "Junior Team"] },
  Volleyball: { icon: "🏐", color: "bg-yellow-500", teams: ["Volleyball Team", "Junior Team"] },
  Swimming:   { icon: "🏊", color: "bg-cyan-500",   teams: ["Swim Team", "Junior Swimmers"] },
  Tennis:     { icon: "🎾", color: "bg-green-500",  teams: ["Tennis Squad", "Junior Tennis"] },
  "All Sports": { icon: "📋", color: "bg-gray-500", teams: ["All Teams", "Coaching Staff"] },
};

const SESSION_TYPES = ["Tactical Training", "Fitness Session", "Technical Training", "Defense Drills", "Shooting Practice", "Serve & Rally Practice", "Endurance Laps", "Spike & Serve Drills", "Strategy Meeting", "Recovery Session"];
const PRIORITIES    = ["low", "medium", "high"];
const COACHES       = ["John Anderson", "Sarah Smith", "Mike Johnson", "Alex Trainer", "David Wilson", "Maria Lopez", "Tom Reeves", "Claire Dupont"];

const defaultForm = {
  title:    "",
  sport:    "",
  team:     "",
  date:     "",
  time:     "",
  coach:    "",
  location: "",
  priority: "medium",
  completed: false,
};

const formatDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

export default function TrainingModal({ open, onClose, onAddSession }) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});

  if (!open) return null;

  const set = (key, val) =>
    setForm((prev) => ({
      ...prev,
      [key]: val,
      ...(key === "sport" ? { team: "" } : {}),
    })) || setErrors((prev) => ({ ...prev, [key]: "" }));

  const validate = () => {
    const e = {};
    if (!form.title)    e.title    = "Title is required";
    if (!form.sport)    e.sport    = "Select a sport";
    if (!form.team)     e.team     = "Select a team";
    if (!form.date)     e.date     = "Pick a date";
    if (!form.time)     e.time     = "Pick a time";
    if (!form.coach)    e.coach    = "Select a coach";
    if (!form.location) e.location = "Location is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const sport     = SPORTS_CONFIG[form.sport];
    const newSession = {
      id:          Date.now(),
      ...form,
      date:        formatDate(form.date),
      sportColor:  sport?.color   || "bg-gray-500",
      sportIcon:   sport?.icon    || "📋",
    };

    onAddSession?.(newSession);
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  const teams = form.sport ? (SPORTS_CONFIG[form.sport]?.teams || []) : [];

  const inputCls = (key) =>
    `w-full bg-slate-800/50 border rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition-all
     placeholder:text-slate-600
     ${errors[key]
       ? "border-red-500/60 focus:ring-2 focus:ring-red-500/20"
       : "border-slate-700 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10"
     }`;

  const Field = ({ label, error, children }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</label>
      {children}
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-xl p-2">
            <CalendarDays size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-black text-slate-100 text-lg uppercase tracking-widest">Add Training</h2>
            <p className="text-slate-500 text-xs">Schedule a new training session</p>
          </div>
          <button
            onClick={handleClose}
            className="ml-auto text-slate-600 hover:text-slate-300 hover:bg-slate-800 rounded-lg p-1.5 transition-all"
          >✕</button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">

          {/* Title – full width */}
          <div className="col-span-2">
            <Field label="Session Title *" error={errors.title}>
              <select className={inputCls("title")} value={form.title} onChange={(e) => set("title", e.target.value)}>
                <option value="">Select session type</option>
                {SESSION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>

          {/* Sport */}
          <Field label="Sport *" error={errors.sport}>
            <select className={inputCls("sport")} value={form.sport} onChange={(e) => set("sport", e.target.value)}>
              <option value="">Select sport</option>
              {Object.keys(SPORTS_CONFIG).map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>

          {/* Team – depends on sport */}
          <Field label="Team *" error={errors.team}>
            <select className={inputCls("team")} value={form.team} onChange={(e) => set("team", e.target.value)} disabled={!form.sport}>
              <option value="">Select team</option>
              {teams.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          {/* Date */}
          <Field label="Date *" error={errors.date}>
            <input type="date" className={inputCls("date")} value={form.date} onChange={(e) => set("date", e.target.value)} />
          </Field>

          {/* Time */}
          <Field label="Time *" error={errors.time}>
            <input type="time" className={inputCls("time")} value={form.time} onChange={(e) => set("time", e.target.value)} />
          </Field>

          {/* Coach */}
          <Field label="Coach *" error={errors.coach}>
            <select className={inputCls("coach")} value={form.coach} onChange={(e) => set("coach", e.target.value)}>
              <option value="">Select coach</option>
              {COACHES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>

          {/* Location */}
          <Field label="Location *" error={errors.location}>
            <input
              className={inputCls("location")}
              placeholder="e.g. Training Ground 1"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>

          {/* Priority */}
          <div className="col-span-2">
            <Field label="Priority" error={errors.priority}>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("priority", p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all
                      ${form.priority === p
                        ? p === "high"   ? "bg-red-500/20 border-red-500 text-red-400"
                        : p === "medium" ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                        :                  "bg-slate-700 border-slate-500 text-slate-300"
                        : "border-slate-800 text-slate-600 hover:border-slate-700"
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          {/* Completed toggle */}
          <div className="col-span-2 flex items-center justify-between bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Mark as Completed</span>
            <button
              type="button"
              onClick={() => set("completed", !form.completed)}
              className={`w-12 h-6 rounded-full border-2 transition-all relative
                ${form.completed ? "bg-emerald-600 border-emerald-500" : "bg-slate-800 border-slate-700"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all
                ${form.completed ? "left-6" : "left-0.5"}`} />
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-800">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest active:scale-[0.98] transition-all"
          >
            Add Session
          </button>
        </div>

      </div>
    </div>
  );
}