// Shared presentation helpers for the Alerts / Notifications center.
// Keeps the big component lean and centralises the type→icon/color mapping
// so alerts and notifications render with a consistent, intentional look.

import {
    Bell, AlertTriangle, ShieldAlert, HeartPulse, Stethoscope, Activity,
    TrendingDown, FileText, CalendarClock, Trophy, Ban, UserX, ArrowLeftRight,
    FileClock, Search, Handshake, Mail, Settings, Dumbbell, Megaphone,
} from "lucide-react";

const API_BASE = "http://localhost:8080";

// "INJURY_REPORTED" -> "Injury Reported"
export const prettify = (s) =>
    (s || "")
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

// Backend timestamps (alert.triggeredAt / notification.createdAt) are generated
// server-side in UTC but serialised WITHOUT a timezone marker
// (e.g. "2026-06-23T16:56:58.366285"). new Date() would then parse them as the
// browser's LOCAL time, so a brand-new event reads ~3h in the past for a UTC+3
// user. Append "Z" when the string carries no zone so it is parsed as UTC, and
// it then renders at the correct local wall-clock time.
export const parseServerDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value) ? null : value;
    let s = String(value).trim();
    // Already zone-aware? (ends with Z, or +hh:mm / -hh:mm after the time part)
    const hasZone = /[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
    if (!hasZone && /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s)) {
        s = s.replace(" ", "T") + "Z";
    }
    const d = new Date(s);
    return isNaN(d) ? null : d;
};

export const fmtDate = (iso) => {
    const d = parseServerDate(iso);
    if (!d) return null;
    return d.toLocaleString(undefined, {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
};

// Relative time: "just now", "5m ago", "3h ago", "2d ago".
export const relativeTime = (iso) => {
    const d = parseServerDate(iso);
    if (!d) return null;
    const secs = Math.floor((Date.now() - d.getTime()) / 1000);
    if (secs < 45) return "just now";
    if (secs < 90) return "1m ago";
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.round(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return fmtDate(iso);
};

// Decode the current user's Keycloak id (JWT `sub`) from the stored token.
// The /alerts/{id}/acknowledge endpoint requires an acknowledgedByKeycloakId
// query param (HTTP 400 without it), and we use the same id to pull the
// current user's personal notification feed.
export function currentKeycloakId() {
    try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return null;
        const payload = JSON.parse(
            atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
        );
        return payload.sub || null;
    } catch {
        return null;
    }
}

// ── Type → icon + accent colour ────────────────────────────────────────────
// One source of truth so every match/goal/injury/transfer row gets the same
// glyph and tint across stat cards, filter chips and the feed.
const ICON_MAP = {
    // alert types
    INJURY_REPORTED: { Icon: HeartPulse, accent: "rose" },
    MEDICAL_CHECKUP_DUE: { Icon: Stethoscope, accent: "amber" },
    FITNESS_TEST_DUE: { Icon: Dumbbell, accent: "amber" },
    REHABILITATION_MILESTONE: { Icon: Activity, accent: "emerald" },
    KPI_DROP: { Icon: TrendingDown, accent: "rose" },
    REPORT_GENERATED: { Icon: FileText, accent: "sky" },
    MATCH_UPCOMING: { Icon: CalendarClock, accent: "blue" },
    MATCH_RESULT_AVAILABLE: { Icon: Trophy, accent: "emerald" },
    GOAL_SCORED: { Icon: Trophy, accent: "emerald" },
    TRAINING_CANCELLED: { Icon: Ban, accent: "rose" },
    PLAYER_SUSPENSION: { Icon: UserX, accent: "rose" },
    TRANSFER_COMPLETED: { Icon: ArrowLeftRight, accent: "violet" },
    CONTRACT_EXPIRING: { Icon: FileClock, accent: "amber" },
    SCOUT_REPORT_SUBMITTED: { Icon: Search, accent: "sky" },
    SPONSOR_OFFER_RECEIVED: { Icon: Handshake, accent: "violet" },
    SYSTEM: { Icon: Settings, accent: "slate" },
    OTHER: { Icon: AlertTriangle, accent: "slate" },
    // notification categories
    INJURY: { Icon: HeartPulse, accent: "rose" },
    KPI_ALERT: { Icon: TrendingDown, accent: "rose" },
    TRANSFER: { Icon: ArrowLeftRight, accent: "violet" },
    REPORT_READY: { Icon: FileText, accent: "sky" },
    MATCH_REMINDER: { Icon: CalendarClock, accent: "blue" },
    TRAINING_REMINDER: { Icon: Dumbbell, accent: "amber" },
};

const ACCENTS = {
    rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", ring: "border-rose-500/40", chip: "bg-rose-500/15 text-rose-300 border-rose-500/40" },
    amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", ring: "border-amber-500/40", chip: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", ring: "border-emerald-500/40", chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" },
    sky: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30", ring: "border-sky-500/40", chip: "bg-sky-500/15 text-sky-300 border-sky-500/40" },
    blue: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", ring: "border-blue-500/40", chip: "bg-blue-500/15 text-blue-300 border-blue-500/40" },
    violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", ring: "border-violet-500/40", chip: "bg-violet-500/15 text-violet-300 border-violet-500/40" },
    slate: { text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30", ring: "border-slate-500/40", chip: "bg-slate-500/15 text-slate-300 border-slate-500/40" },
};

export function accentFor(name) {
    return ACCENTS[name] || ACCENTS.slate;
}

// Resolve a type/category key to { Icon, accent-classes }.
export function typeVisual(key, fallbackIcon = Bell) {
    const m = ICON_MAP[(key || "").toUpperCase()];
    const accent = accentFor(m ? m.accent : "slate");
    return { Icon: m ? m.Icon : fallbackIcon, ...accent };
}

// Priority → tint (CRITICAL/HIGH stand out).
export function priorityVisual(priority) {
    const p = (priority || "").toUpperCase();
    if (p === "CRITICAL") return accentFor("rose");
    if (p === "HIGH") return accentFor("amber");
    if (p === "MEDIUM") return accentFor("blue");
    return accentFor("slate");
}

export { Mail, Megaphone, API_BASE };
