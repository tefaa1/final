"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api } from "@/src/lib/api";
import {
  FiBell, FiCheck, FiCheckCircle, FiInbox,
} from "react-icons/fi";
import {
  HeartPulse, Stethoscope, Dumbbell, Activity, TrendingDown, FileText,
  CalendarClock, Trophy, Ban, UserX, ArrowLeftRight, FileClock, Search,
  Handshake, Settings, AlertTriangle, Bell,
} from "lucide-react";

// ─── Local presentation helpers (self-contained: this component must not import
// from the alerts feature folder). Mirrors the alerts center mapping so a goal,
// injury or transfer gets the same glyph/tint here as on the full page. ───────
const API_BASE = "http://localhost:8080";
const POLL_MS = 10000; // poll every ~10s so live events (a goal just scored) appear

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
  rose: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  amber: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  sky: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30" },
  blue: { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  violet: { text: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  slate: { text: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/30" },
};

function typeVisual(key) {
  const m = ICON_MAP[(key || "").toUpperCase()];
  const accent = ACCENTS[m ? m.accent : "slate"] || ACCENTS.slate;
  return { Icon: m ? m.Icon : Bell, ...accent };
}

const prettify = (s) =>
  (s || "")
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Backend timestamps (triggeredAt / createdAt) are produced server-side in UTC
// but serialised WITHOUT a timezone marker (e.g. "2026-06-23T16:56:58.366285").
// new Date() would parse them as the browser's LOCAL time, so a brand-new event
// reads ~3h in the past for a UTC+3 user. Append "Z" when no zone is present so
// the string is parsed as UTC and renders at the correct local wall-clock time.
const parseServerDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value) ? null : value;
  let s = String(value).trim();
  const hasZone = /[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  if (!hasZone && /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s)) {
    s = s.replace(" ", "T") + "Z";
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const relativeTime = (iso) => {
  const d = parseServerDate(iso);
  if (!d) return "";
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
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// Decode the current user's Keycloak id (JWT `sub`) — the
// /alerts/{id}/acknowledge endpoint requires acknowledgedByKeycloakId
// (HTTP 400 without it).
function currentKeycloakId() {
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

const asList = (res) =>
  Array.isArray(res) ? res : res?.content || res?.data || [];

const tsOf = (x) => parseServerDate(x.triggeredAt || x.createdAt)?.getTime() || 0;

// Acknowledge an alert. api.acknowledgeAlert(id) omits the required
// acknowledgedByKeycloakId param (→ HTTP 400), so call the endpoint directly
// with the current user's id; fall back to the api helper if we have no id.
async function acknowledgeAlertWithUser(id) {
  const me = currentKeycloakId();
  if (!me) return api.acknowledgeAlert(id);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(
    `${API_BASE}/alerts/${id}/acknowledge?acknowledgedByKeycloakId=${encodeURIComponent(me)}`,
    { method: "PATCH", headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!res.ok) throw new Error(`Acknowledge failed (${res.status})`);
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef(null);
  const btnRef = useRef(null);

  // Unread = unread notifications + alerts not yet acknowledged.
  const notifUnread = (n) => !n.isRead && n.status !== "READ";
  const alertUnread = (a) => !a.isAcknowledged && !a.isResolved;

  const fetchAll = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const [aRes, nRes] = await Promise.allSettled([
        api.getAlerts(),
        api.getNotifications(),
      ]);
      if (aRes.status === "fulfilled") setAlerts(asList(aRes.value));
      if (nRes.status === "fulfilled") setNotifications(asList(nRes.value));
    } catch {
      // leave existing data in place on transient failure
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  // Initial load + poll every ~10s (pause while the tab is hidden).
  useEffect(() => {
    fetchAll(false);
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchAll(true);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Merge both feeds into one unified, newest-first list.
  const items = useMemo(() => {
    const ns = notifications.map((n) => ({
      kind: "notification",
      id: n.id,
      title: n.title,
      message: n.message,
      typeKey: n.category,
      when: n.triggeredAt || n.createdAt,
      ts: tsOf(n),
      unread: notifUnread(n),
      raw: n,
    }));
    const as = alerts.map((a) => ({
      kind: "alert",
      id: a.id,
      title: a.title,
      message: a.message || a.description,
      typeKey: a.alertType,
      priority: a.priority,
      when: a.triggeredAt || a.createdAt,
      ts: tsOf(a),
      unread: alertUnread(a),
      raw: a,
    }));
    return [...ns, ...as].sort((x, y) => y.ts - x.ts);
  }, [notifications, alerts]);

  const unreadCount = useMemo(() => items.filter((i) => i.unread).length, [items]);

  // Mark a single item read/acknowledged, then refresh so the badge updates.
  const markOne = async (item) => {
    if (!item.unread) return;
    setBusy(true);
    try {
      if (item.kind === "notification") await api.markNotificationRead(item.id);
      else await acknowledgeAlertWithUser(item.id);
      await fetchAll(true);
    } catch {
      // ignore — UI keeps the item flagged unread
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    const unread = items.filter((i) => i.unread);
    if (unread.length === 0) return;
    setBusy(true);
    try {
      await Promise.allSettled(
        unread.map((i) =>
          i.kind === "notification"
            ? api.markNotificationRead(i.id)
            : acknowledgeAlertWithUser(i.id)
        )
      );
      await fetchAll(true);
    } catch {
      // ignore partial failures
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className={`relative w-10 h-10 grid place-items-center rounded-lg border transition-all cursor-pointer ${
          open
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            : "border-transparent text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60 hover:border-[var(--border)]"
        }`}
        title="Notifications"
      >
        <FiBell className="text-lg" strokeWidth={2.4} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose-500 text-white text-[10px] font-black leading-none ring-2 ring-[var(--bg-card)] animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border)] bg-slate-900/98 backdrop-blur-xl shadow-2xl shadow-black/50 z-[200] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-slate-950/60">
            <div className="flex items-center gap-2">
              <FiBell className="text-emerald-400" strokeWidth={2.5} />
              <h4 className="text-sm font-extrabold text-slate-100 tracking-wide">Notifications</h4>
              {unreadCount > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-rose-500/90 text-white text-[10px] font-black">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0 || busy}
              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full border transition-all ${
                unreadCount === 0 || busy
                  ? "bg-slate-900/30 text-slate-600 border-slate-800/60 cursor-default"
                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20 cursor-pointer"
              }`}
              title="Mark all as read"
            >
              <FiCheckCircle size={12} /> Mark all read
            </button>
          </div>

          {/* List */}
          <div className="max-h-[26rem] overflow-y-auto sidebar-scrollbar divide-y divide-slate-800/70">
            {loading ? (
              <div className="px-4 py-12 text-center text-slate-500 text-xs uppercase tracking-widest animate-pulse">
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-14 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 grid place-items-center rounded-full bg-slate-800/60 border border-slate-700">
                  <FiInbox className="text-slate-500 text-xl" />
                </div>
                <p className="text-sm font-bold text-slate-300">You're all caught up</p>
                <p className="text-[11px] text-slate-500">No notifications or alerts right now.</p>
              </div>
            ) : (
              items.map((item) => {
                const tv = typeVisual(item.typeKey);
                return (
                  <div
                    key={`${item.kind}-${item.id}`}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors group ${
                      item.unread ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <div className={`mt-0.5 p-2 rounded-xl border shrink-0 ${tv.bg} ${tv.text} ${tv.border}`}>
                      <tv.Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {item.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Unread" />
                        )}
                        <p className={`text-sm truncate ${item.unread ? "font-bold text-slate-100" : "font-semibold text-slate-300"}`}>
                          {item.title || prettify(item.typeKey) || "Notification"}
                        </p>
                      </div>
                      {item.message && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{item.message}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${tv.text} opacity-80`}>
                          {item.kind === "alert" ? prettify(item.typeKey) || "Alert" : prettify(item.typeKey) || "Update"}
                        </span>
                        {item.when && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                            · {relativeTime(item.when)}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.unread && (
                      <button
                        type="button"
                        onClick={() => markOne(item)}
                        disabled={busy}
                        className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer disabled:opacity-50"
                        title={item.kind === "alert" ? "Acknowledge" : "Mark as read"}
                      >
                        <FiCheck size={15} strokeWidth={2.6} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
