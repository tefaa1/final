"use client";
import { useState, useEffect } from "react";
import { SPORT_COLORS, SPORT_ICONS } from "@/src/data/mockData";

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const statusMap = {
    ACTIVE: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    AVAILABLE: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    COMPLETED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    RECOVERED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    FINISHED: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    PENDING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    SCHEDULED: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    TREATING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    RECOVERING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    NEGOTIATING: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    INJURED: "bg-red-500/10 text-red-400 border border-red-500/20",
    SUSPENDED: "bg-red-500/10 text-red-400 border border-red-500/20",
    CRITICAL: "bg-red-500/10 text-red-400 border border-red-500/20",
    REPORTED: "bg-red-500/10 text-red-400 border border-red-500/20",
    TERMINATED: "bg-red-500/10 text-red-400 border border-red-500/20",
    CANCELLED: "bg-red-500/10 text-red-400 border border-red-500/20",
    EXPIRED: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    RETIRED: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    ON_HOLD: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    TRANSFERRED: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    ON_LOAN: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    LIVE: "bg-red-500/10 text-red-400 border border-red-500/20",
    POSTPONED: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    HIGH: "bg-red-500/10 text-red-400 border border-red-500/20",
    MEDIUM: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    LOW: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};

export function StatusBadge({ status }) {
    const cls = statusMap[status] || "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}>
            {status}
        </span>
    );
}

// ─── SPORT BADGE ──────────────────────────────────────────────────────────────
export function SportBadge({ sport }) {
    const color = SPORT_COLORS[sport] || "#10b981";
    return (
        <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: color + "15", color, border: `1px solid ${color}33` }}
        >
            {SPORT_ICONS[sport]} {sport}
        </span>
    );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
export function Avatar({ name = "?", size = 36 }) {
    const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    return (
        <div
            className="rounded-full flex items-center justify-center font-bold flex-shrink-0 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
            style={{ width: size, height: size, fontSize: size * 0.38 }}
        >
            {initials}
        </div>
    );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
export function Toast({ msg, type = "success", onClose }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    const colors = {
        success: "border-emerald-500 text-emerald-400 bg-slate-900",
        error: "border-red-500 text-red-400 bg-slate-900",
        info: "border-blue-500 text-blue-400 bg-slate-900"
    };
    return (
        <div className={`fixed bottom-6 right-6 z-50 shadow-2xl rounded-xl border-l-4 px-5 py-3 max-w-xs border border-slate-800 backdrop-blur-md ${colors[type]}`}>
            <p className="text-sm font-semibold">{msg}</p>
        </div>
    );
}

// ─── FORM MODAL ───────────────────────────────────────────────────────────────
export function FormModal({ title, fields, onSubmit, onClose, initialData }) {
    const [form, setForm] = useState(initialData || {});
    const [errors, setErrors] = useState({});

    // تحديث الفورم لو الـ initialData اتغيرت (مهم لحالة الـ Edit)
    useEffect(() => {
        setForm(initialData || {});
    }, [initialData]);

    const set = (k, v) => {
        setForm(p => ({ ...p, [k]: v }));
        if (errors[k]) setErrors(p => ({ ...p, [k]: null }));
    };

    const validate = () => {
        const newErrors = {};
        fields.forEach(f => {
            const val = form[f.key];
            if (f.key === "username" && (!val || val.length < 3)) {
                newErrors[f.key] = "Username must be at least 3 characters";
            }
            if (f.key === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                newErrors[f.key] = "Invalid email format";
            }
            if (f.key === "password" && (!val || val.length < 6)) {
                newErrors[f.key] = "Password must be at least 6 characters";
            }
            if (f.required && !val) {
                newErrors[f.key] = "This field is required";
            }
        });
        return newErrors;
    };

    const handleSubmit = () => {
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        onSubmit(form);
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <style>{`@keyframes fmIn{0%{opacity:0;transform:translateY(12px) scale(.96)}100%{opacity:1;transform:none}}`}</style>
            <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl" style={{ animation: "fmIn .25s cubic-bezier(.2,.8,.2,1)" }}>
                {/* gradient header */}
                <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a] px-6 py-5 shrink-0">
                    <div className="absolute -right-6 -top-8 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-lg shadow-lg">✦</div>
                            <div>
                                <h3 className="text-lg font-black text-white leading-none">{title}</h3>
                                <p className="text-[10px] text-slate-400 uppercase tracking-[0.22em] mt-1.5">FC Barcelona · MSCMS</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-sm leading-none transition-all">✕</button>
                    </div>
                </div>
                {/* body */}
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {fields.map(f => (
                            <div key={f.key} className={`flex flex-col gap-1.5 ${f.full ? "sm:col-span-2" : ""}`}>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">
                                    {f.label}
                                    {f.required && <span className="text-rose-500 ml-1">*</span>}
                                </label>
                                {f.type === "select" ? (
                                    <select
                                        value={form[f.key] ?? ""}
                                        onChange={e => set(f.key, e.target.value)}
                                        className={`w-full px-3 py-2.5 rounded-xl border bg-slate-900/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all ${errors[f.key] ? "border-rose-500" : "border-slate-800"
                                            }`}
                                    >
                                        <option value="">Select {f.label}</option>
                                        {(f.options || []).map((o, idx) => {
                                            const isObj = typeof o === 'object' && o !== null;
                                            const val = isObj ? o.value : o;
                                            const lab = isObj ? o.label : o;
                                            return <option key={idx} value={val} className="bg-slate-900">{lab}</option>;
                                        })}
                                    </select>
                                ) : (
                                    <input
                                        type={f.type || "text"}
                                        value={form[f.key] ?? ""}
                                        onChange={e => set(f.key, e.target.value)}
                                        placeholder={f.placeholder}
                                        className={`w-full px-3 py-2.5 rounded-xl border bg-slate-900/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600 ${errors[f.key] ? "border-rose-500" : "border-slate-800"
                                            }`}
                                    />
                                )}
                                {/* ✅ رسالة الخطأ تحت الفيلد */}
                                {errors[f.key] && (
                                    <span className="text-[10px] text-rose-400 font-bold">{errors[f.key]}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                {/* footer */}
                <div className="flex gap-3 p-5 border-t border-slate-800 bg-slate-900/40 justify-end shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-sm font-bold hover:bg-slate-900 hover:text-slate-200 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
// ─── STAT CARD ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, color = "text-emerald-500", sub }) {
    return (
        <div className='bg-slate-950 rounded-2xl p-4 w-full shadow-sm border border-slate-800 hover:border-emerald-500/50 transition-all group'>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 group-hover:text-slate-400">{label}</p>
            <p className={`text-3xl font-black tracking-tight ${color}`}>{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>}
        </div>
    );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title = "Nothing here yet", action }) {
    return (
        <div className="text-center py-20 text-slate-500">
            <div className="text-6xl mb-6 opacity-20 grayscale">{icon}</div>
            <p className="text-lg font-bold text-slate-400 mb-6">{title}</p>
            {action}
        </div>
    );
}

// ─── PAGE HEADER ──────────────────────────────────────────────────────────────
// A polished, consistent section bar used across every dashboard page. Pass an
// optional `icon` (a react-icons component) for the left chip. Backward-compatible:
// callers that only pass title/subtitle/action still render correctly.
export function PageHeader({ title, subtitle, action, icon: Icon }) {
    return (
        <div className="relative overflow-hidden mb-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a] px-6 py-5 shadow-lg">
            <div className="absolute -right-10 -top-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-12 w-44 h-44 rounded-full bg-fuchsia-500/5 blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    {Icon && (
                        <span className="grid place-items-center w-12 h-12 shrink-0 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-lg">
                            <Icon className="text-2xl" />
                        </span>
                    )}
                    <div className="space-y-1 min-w-0">
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">{title}</h1>
                        {subtitle && <p className="text-sm text-slate-400 font-medium">{subtitle}</p>}
                    </div>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </div>
    );
}

// ─── FILTER TABS ─────────────────────────────────────────────────────────────
export function FilterTabs({ tabs, active, onSelect }) {
    return (
        <div className="flex gap-2 p-1.5 bg-slate-950/50 border border-slate-800 rounded-xl w-fit mb-6">
            {tabs.map(([key, label]) => (
                <button
                    key={key}
                    onClick={() => onSelect(key)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${active === key
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                        : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"
                        }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

// ─── ADD BUTTON ───────────────────────────────────────────────────────────────
export function AddButton({ label = "+ Add", onClick }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-950 transition-all active:scale-95"
        >
            {label}
        </button>
    );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = "from-emerald-500 to-teal-500" }) {
    return (
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
    );
}
