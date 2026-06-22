"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { api } from "@/src/lib/api";
import {
    FormModal,
    PageHeader,
    AddButton,
    Toast,
    EmptyState,
    StatusBadge,
} from "@/src/components/shared/SharedComponents";
import UserChip from "@/src/components/shared/UserChip";
import {
    Bell, AlertTriangle, CheckCircle2, ShieldAlert, CheckSquare, Inbox,
    Flame, MailOpen, RefreshCw, Filter, Radio,
} from "lucide-react";
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import {
    prettify, relativeTime, fmtDate, currentKeycloakId,
    typeVisual, priorityVisual, API_BASE,
} from "./alertUtils";

// ─── BACKEND ENUMS (must match notification-mail-service exactly) ──────────
const NOTIFICATION_TYPES = ["IN_APP", "EMAIL", "BOTH"];
const NOTIFICATION_CATEGORIES = ["INJURY", "KPI_ALERT", "TRANSFER", "REPORT_READY", "MATCH_REMINDER", "TRAINING_REMINDER", "SYSTEM", "OTHER"];
const NOTIFICATION_STATUSES = ["PENDING", "SENT", "DELIVERED", "READ", "FAILED"];
const ALERT_TYPES = ["SYSTEM", "OTHER", "INJURY_REPORTED", "MEDICAL_CHECKUP_DUE", "FITNESS_TEST_DUE", "REHABILITATION_MILESTONE", "KPI_DROP", "REPORT_GENERATED", "MATCH_UPCOMING", "MATCH_RESULT_AVAILABLE", "GOAL_SCORED", "TRAINING_CANCELLED", "PLAYER_SUSPENSION", "TRANSFER_COMPLETED", "CONTRACT_EXPIRING", "SCOUT_REPORT_SUBMITTED", "SPONSOR_OFFER_RECEIVED"];
const ALERT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const POLL_MS = 8000; // auto-refresh cadence for event-driven alerts/notifications

const asList = (res) =>
    Array.isArray(res) ? res : res?.content || res?.data || [];

const sortNewest = (arr) =>
    [...arr].sort(
        (a, b) =>
            new Date(b.triggeredAt || b.createdAt || 0) -
            new Date(a.triggeredAt || a.createdAt || 0)
    );

// ─── STAT CARD ────────────────────────────────────────────────────────────
function StatCard({ label, value, accent = "text-slate-100", icon: Icon }) {
    return (
        <div className="bg-slate-900/50 rounded-2xl px-5 py-4 border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-2xl font-black tracking-tight ${accent}`}>{value}</p>
            </div>
            {Icon && <Icon size={20} className={`${accent} opacity-70`} />}
        </div>
    );
}

export default function CommunicationsPage() {
    const [mainTab, setMainTab] = useState("alerts"); // alerts | notifications
    const [alerts, setAlerts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [newCount, setNewCount] = useState(0); // items that arrived since last view
    const [liveOn, setLiveOn] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toast, setToast] = useState(null);

    const [priorityFilter, setPriorityFilter] = useState("all"); // alerts
    const [typeFilter, setTypeFilter] = useState("all");         // alerts + notifications
    const [unreadOnly, setUnreadOnly] = useState(false);         // notifications

    const isAlerts = mainTab === "alerts";
    const data = isAlerts ? alerts : notifications;

    // Track the highest-seen id per feed so polling can detect genuinely new rows.
    const seenMaxId = useRef({ alerts: 0, notifications: 0 });

    // ── User dropdown options: value = keycloakId, label = "Name (ROLE)"
    const userOptions = useMemo(
        () =>
            users
                .filter((u) => u.keycloakId)
                .map((u) => ({
                    value: u.keycloakId,
                    label: `${[u.firstName, u.lastName].filter(Boolean).join(" ").trim() || "Unnamed"}${u.role ? ` (${u.role})` : ""}`,
                })),
        [users]
    );

    const notificationFields = useMemo(() => [
        { key: "recipientUserKeycloakId", label: "Recipient", type: "select", options: userOptions, required: true },
        { key: "title", label: "Title", required: true },
        { key: "message", label: "Message", required: true, full: true },
        { key: "notificationType", label: "Type", type: "select", options: NOTIFICATION_TYPES, required: true },
        { key: "category", label: "Category", type: "select", options: NOTIFICATION_CATEGORIES, required: true },
        { key: "status", label: "Status", type: "select", options: NOTIFICATION_STATUSES },
        { key: "emailSubject", label: "Email Subject" },
        { key: "emailBody", label: "Email Body", full: true },
        { key: "relatedEntityType", label: "Related Entity Type" },
        { key: "relatedEntityId", label: "Related Entity ID", type: "number" },
        { key: "actionUrl", label: "Action URL" },
    ], [userOptions]);

    const alertFields = useMemo(() => [
        { key: "targetUserKeycloakId", label: "Target User", type: "select", options: userOptions },
        { key: "targetRole", label: "Target Role", placeholder: "e.g. COACH" },
        { key: "title", label: "Alert Title", required: true },
        { key: "message", label: "Short Message", required: true },
        { key: "description", label: "Full Description", required: true, full: true },
        { key: "alertType", label: "Alert Type", type: "select", options: ALERT_TYPES, required: true },
        { key: "priority", label: "Priority", type: "select", options: ALERT_PRIORITIES, required: true },
        { key: "relatedEntityType", label: "Related Entity Type" },
        { key: "relatedEntityId", label: "Related Entity ID", type: "number" },
        { key: "actionRequired", label: "Action Required" },
        { key: "metadata", label: "Metadata (JSON/String)", full: true },
    ], [userOptions]);

    const fetchUsers = async () => {
        try {
            setUsers(asList(await api.getUsers()));
        } catch {
            setUsers([]);
        }
    };

    // Pull both feeds in parallel so tab counts stay live regardless of which
    // tab is showing. `quiet` skips the loading spinner (used by the poller).
    const refreshAll = useCallback(async (quiet = false) => {
        if (!quiet) setLoading(true);
        else setRefreshing(true);
        try {
            const [aRes, nRes] = await Promise.allSettled([
                api.getAlerts(),
                api.getNotifications(),
            ]);

            let arrivals = 0;
            if (aRes.status === "fulfilled") {
                const a = sortNewest(asList(aRes.value));
                const maxId = a.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
                if (seenMaxId.current.alerts && maxId > seenMaxId.current.alerts) {
                    arrivals += a.filter((x) => Number(x.id) > seenMaxId.current.alerts).length;
                }
                seenMaxId.current.alerts = Math.max(seenMaxId.current.alerts, maxId);
                setAlerts(a);
            }
            if (nRes.status === "fulfilled") {
                const n = sortNewest(asList(nRes.value));
                const maxId = n.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
                if (seenMaxId.current.notifications && maxId > seenMaxId.current.notifications) {
                    arrivals += n.filter((x) => Number(x.id) > seenMaxId.current.notifications).length;
                }
                seenMaxId.current.notifications = Math.max(seenMaxId.current.notifications, maxId);
                setNotifications(n);
            }
            if (aRes.status === "rejected" && nRes.status === "rejected") {
                throw new Error("Both feeds failed");
            }
            setLastSync(new Date());
            if (quiet && arrivals > 0) setNewCount((c) => c + arrivals);
        } catch {
            if (!quiet) setToast({ msg: "Failed to load data", type: "error" });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial load
    useEffect(() => { fetchUsers(); refreshAll(false); }, [refreshAll]);

    // Auto-refresh poller (pauses when the tab is hidden or live is off).
    useEffect(() => {
        if (!liveOn) return;
        const id = setInterval(() => {
            if (typeof document !== "undefined" && document.hidden) return;
            refreshAll(true);
        }, POLL_MS);
        return () => clearInterval(id);
    }, [liveOn, refreshAll]);

    // Reset sub-filters + clear the "new" badge when switching tabs.
    useEffect(() => {
        setPriorityFilter("all");
        setTypeFilter("all");
        setUnreadOnly(false);
        setNewCount(0);
    }, [mainTab]);

    const handleSave = async (form) => {
        try {
            let payload;
            if (!isAlerts) {
                payload = {
                    recipientUserKeycloakId: form.recipientUserKeycloakId,
                    notificationType: form.notificationType || "IN_APP",
                    category: form.category || "SYSTEM",
                    status: form.status || "PENDING",
                    title: form.title,
                    message: form.message,
                    relatedEntityType: form.relatedEntityType || null,
                    relatedEntityId: form.relatedEntityId ? Number(form.relatedEntityId) : null,
                    emailSubject: form.emailSubject || null,
                    emailBody: form.emailBody || null,
                    actionUrl: form.actionUrl || null,
                };
            } else {
                payload = {
                    targetUserKeycloakId: form.targetUserKeycloakId || null,
                    targetRole: form.targetRole || null,
                    title: form.title,
                    message: form.message,
                    description: form.description,
                    alertType: form.alertType,
                    priority: form.priority,
                    relatedEntityType: form.relatedEntityType || null,
                    relatedEntityId: form.relatedEntityId ? Number(form.relatedEntityId) : null,
                    actionRequired: form.actionRequired || null,
                    metadata: form.metadata || null,
                };
            }

            if (editItem) {
                isAlerts
                    ? await api.updateAlert(editItem.id, payload)
                    : await api.updateNotification(editItem.id, payload);
                setToast({ msg: "Updated successfully!" });
            } else {
                isAlerts
                    ? await api.createAlert(payload)
                    : await api.createNotification(payload);
                setToast({ msg: "Created successfully!" });
            }
            setShowModal(false);
            setEditItem(null);
            refreshAll(true);
        } catch (err) {
            setToast({ msg: err.message, type: "error" });
        }
    };

    // PATCH /alerts/{id}/acknowledge requires acknowledgedByKeycloakId
    // (HTTP 400 without it). api.acknowledgeAlert() omits it, so call directly.
    const acknowledgeAlert = async (id) => {
        const me = currentKeycloakId();
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch(
            `${API_BASE}/alerts/${id}/acknowledge?acknowledgedByKeycloakId=${encodeURIComponent(me || "")}`,
            { method: "PATCH", headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!res.ok) {
            const e = await res.json().catch(() => ({}));
            throw new Error(e.message || `Acknowledge failed (${res.status})`);
        }
    };

    const handleAction = async (id, action) => {
        try {
            if (action === "read") await api.markNotificationRead(id);
            else if (action === "resolve") await api.resolveAlert(id);
            else if (action === "acknowledge") await acknowledgeAlert(id);

            setToast({
                msg: action === "acknowledge" ? "Alert acknowledged."
                    : action === "resolve" ? "Alert resolved."
                        : "Marked as read.",
            });
            refreshAll(true);
        } catch (err) {
            setToast({ msg: err.message || "Action failed", type: "error" });
        }
    };

    // Mark every unread notification as read in one go.
    const markAllRead = async () => {
        const unread = notifications.filter((n) => !n.isRead && n.status !== "READ");
        if (unread.length === 0) return;
        try {
            await Promise.allSettled(unread.map((n) => api.markNotificationRead(n.id)));
            setToast({ msg: `Marked ${unread.length} as read.` });
            refreshAll(true);
        } catch {
            setToast({ msg: "Some could not be marked read", type: "error" });
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this record?")) return;
        try {
            isAlerts ? await api.deleteAlert(id) : await api.deleteNotification(id);
            setToast({ msg: "Deleted." });
            refreshAll(true);
        } catch {
            setToast({ msg: "Delete failed", type: "error" });
        }
    };

    // ── Unread counts for the tab badges ───────────────────────────────────
    const unreadNotifs = useMemo(
        () => notifications.filter((n) => !n.isRead && n.status !== "READ").length,
        [notifications]
    );
    const openAlerts = useMemo(
        () => alerts.filter((a) => !a.isResolved).length,
        [alerts]
    );

    // ── Available type filter chips (driven by what's actually in the feed) ─
    const typeKey = (item) => (isAlerts ? item.alertType : item.category);
    const typeOptions = useMemo(() => {
        const counts = {};
        data.forEach((d) => {
            const k = typeKey(d) || "OTHER";
            counts[k] = (counts[k] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, isAlerts]);

    // ── Final filtered view ────────────────────────────────────────────────
    const visibleData = useMemo(() => {
        return data.filter((d) => {
            if (typeFilter !== "all" && (typeKey(d) || "OTHER") !== typeFilter) return false;
            if (isAlerts && priorityFilter !== "all" &&
                (d.priority || "").toUpperCase() !== priorityFilter.toUpperCase()) return false;
            if (!isAlerts && unreadOnly && (d.isRead || d.status === "READ")) return false;
            return true;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, isAlerts, typeFilter, priorityFilter, unreadOnly]);

    const stats = useMemo(() => {
        if (!isAlerts) {
            return [
                { label: "Total", value: notifications.length, accent: "text-slate-100", icon: Inbox },
                { label: "Unread", value: unreadNotifs, accent: "text-amber-400", icon: Bell },
                { label: "Read", value: notifications.length - unreadNotifs, accent: "text-emerald-400", icon: CheckCircle2 },
            ];
        }
        const high = alerts.filter((d) => ["HIGH", "CRITICAL"].includes((d.priority || "").toUpperCase())).length;
        const unresolved = alerts.filter((d) => !d.isResolved).length;
        const acknowledged = alerts.filter((d) => d.isAcknowledged).length;
        return [
            { label: "Total Alerts", value: alerts.length, accent: "text-slate-100", icon: ShieldAlert },
            { label: "High Priority", value: high, accent: "text-rose-400", icon: Flame },
            { label: "Unresolved", value: unresolved, accent: "text-amber-400", icon: AlertTriangle },
            { label: "Acknowledged", value: acknowledged, accent: "text-emerald-400", icon: CheckSquare },
        ];
    }, [alerts, notifications, unreadNotifs, isAlerts]);

    const priorityChips = [["all", "All"], ["CRITICAL", "Critical"], ["HIGH", "High"], ["MEDIUM", "Medium"], ["LOW", "Low"]];

    // ── Tab button with unread/open badge ──────────────────────────────────
    const TabButton = ({ id, label, icon: Icon, badge }) => {
        const active = mainTab === id;
        return (
            <button
                onClick={() => setMainTab(id)}
                className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${active
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"}`}
            >
                <Icon size={15} />
                {label}
                {badge > 0 && (
                    <span className={`ml-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full text-[10px] font-black ${active ? "bg-white/25 text-white" : "bg-rose-500/90 text-white"}`}>
                        {badge > 99 ? "99+" : badge}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="w-full min-h-screen bg-slate-950 p-6 overflow-y-auto fade-in text-slate-200">
            <PageHeader
                icon={Bell}
                title="Notifications & Alerts"
                subtitle="Live event-driven alerts and notifications across the club — matches, goals, injuries, transfers and more"
                action={<AddButton label={`+ New ${isAlerts ? "Alert" : "Notification"}`} onClick={() => { setEditItem(null); setShowModal(true); }} />}
            />

            {/* Stat cards */}
            <div className={`grid grid-cols-2 ${isAlerts ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4 mb-6`}>
                {stats.map((s) => <StatCard key={s.label} {...s} />)}
            </div>

            {/* Tabs + live status row */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <div className="flex gap-2 p-1.5 bg-slate-950/50 border border-slate-800 rounded-xl w-fit">
                    <TabButton id="alerts" label="System Alerts" icon={ShieldAlert} badge={openAlerts} />
                    <TabButton id="notifications" label="Notifications" icon={Bell} badge={unreadNotifs} />
                </div>

                <div className="flex items-center gap-3">
                    {newCount > 0 && (
                        <button
                            onClick={() => { setNewCount(0); setToast({ msg: "Showing latest." }); }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase tracking-widest animate-pulse"
                            title="New items arrived via auto-refresh"
                        >
                            <Radio size={13} /> {newCount} New
                        </button>
                    )}
                    <button
                        onClick={() => setLiveOn((v) => !v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors ${liveOn
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                            : "bg-slate-900/60 border-slate-700 text-slate-500 hover:text-slate-300"}`}
                        title={liveOn ? `Auto-refreshing every ${POLL_MS / 1000}s — click to pause` : "Auto-refresh paused — click to resume"}
                    >
                        <span className={`w-1.5 h-1.5 rounded-full ${liveOn ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                        {liveOn ? "Live" : "Paused"}
                    </button>
                    <button
                        onClick={() => refreshAll(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-black uppercase tracking-widest transition-colors"
                        title={lastSync ? `Last synced ${relativeTime(lastSync.toISOString())}` : "Refresh now"}
                    >
                        <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                        {lastSync ? relativeTime(lastSync.toISOString()) : "Sync"}
                    </button>
                </div>
            </div>

            {/* Filter row */}
            {!loading && data.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-600 mr-1">
                        <Filter size={12} /> Type
                    </span>
                    {[["all", "All"], ...typeOptions.map(([k]) => [k, prettify(k)])].map(([key, label]) => {
                        const count = key === "all" ? data.length : (typeOptions.find(([k]) => k === key)?.[1] || 0);
                        const active = typeFilter === key;
                        const v = key === "all" ? null : typeVisual(key);
                        return (
                            <button
                                key={key}
                                onClick={() => setTypeFilter(key)}
                                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${active
                                    ? (v ? v.chip : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40")
                                    : "bg-slate-900/40 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700"}`}
                            >
                                {v && <v.Icon size={12} />}
                                {label} <span className="opacity-60">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Priority sub-filter (alerts) / unread toggle + mark-all (notifications) */}
            {!loading && data.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-5 -mt-1">
                    {isAlerts ? (
                        <>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 mr-1">Priority</span>
                            {priorityChips.map(([key, label]) => {
                                const count = key === "all" ? alerts.length : alerts.filter((d) => (d.priority || "").toUpperCase() === key).length;
                                const active = priorityFilter === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setPriorityFilter(key)}
                                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${active
                                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                                            : "bg-slate-900/40 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700"}`}
                                    >
                                        {label} <span className="opacity-60">{count}</span>
                                    </button>
                                );
                            })}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setUnreadOnly((v) => !v)}
                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${unreadOnly
                                    ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                                    : "bg-slate-900/40 text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700"}`}
                            >
                                Unread only <span className="opacity-60">{unreadNotifs}</span>
                            </button>
                            <button
                                onClick={markAllRead}
                                disabled={unreadNotifs === 0}
                                className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${unreadNotifs === 0
                                    ? "bg-slate-900/30 text-slate-700 border-slate-800/60 cursor-default"
                                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20"}`}
                            >
                                <MailOpen size={12} /> Mark all read
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="space-y-3">
                {loading ? (
                    <div className="p-20 text-center animate-pulse text-slate-500 uppercase tracking-widest">Loading...</div>
                ) : (
                    <>
                        {visibleData.map((item) => {
                            const recipientId = item.recipientUserKeycloakId || item.targetUserKeycloakId;
                            const when = relativeTime(item.triggeredAt || item.createdAt);
                            const whenExact = fmtDate(item.triggeredAt || item.createdAt);
                            const acknowledged = item.isAcknowledged;
                            const resolved = item.isResolved;
                            const unread = !isAlerts && !item.isRead && item.status !== "READ";

                            const tKey = isAlerts ? item.alertType : item.category;
                            const tv = typeVisual(tKey);
                            const pv = isAlerts ? priorityVisual(item.priority) : null;
                            const highlight = isAlerts && ["HIGH", "CRITICAL"].includes((item.priority || "").toUpperCase()) && !resolved;

                            return (
                                <div
                                    key={`${mainTab}-${item.id}`}
                                    className={`relative bg-slate-900/40 border p-4 rounded-2xl flex items-center justify-between gap-4 group transition-all hover:border-emerald-500/30 ${unread ? "border-l-2 border-l-amber-400/70 border-slate-800" : "border-slate-800"} ${highlight ? "ring-1 ring-rose-500/20" : ""}`}
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={`p-2.5 rounded-xl border shrink-0 shadow-inner ${tv.bg} ${tv.text} ${tv.border}`}>
                                            <tv.Icon size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                {unread && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unread" />}
                                                <h4 className="font-bold text-slate-100 text-sm truncate">{item.title}</h4>
                                                {tKey && <StatusBadge status={prettify(tKey)} />}
                                                {item.priority && <StatusBadge status={item.priority} />}
                                                {isAlerts && resolved && <StatusBadge status="RESOLVED" />}
                                                {isAlerts && !resolved && acknowledged && <StatusBadge status="ACKNOWLEDGED" />}
                                                {!isAlerts && !unread && <StatusBadge status="READ" />}
                                            </div>
                                            <p className="text-xs text-slate-400 line-clamp-1 mb-1.5">{item.message || item.description}</p>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{isAlerts ? "For:" : "To:"}</span>
                                                {recipientId
                                                    ? <UserChip keycloakId={recipientId} fallback="User" showRole />
                                                    : <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.targetRole || "All users"}</span>}
                                                {when && <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-1" title={whenExact || ""}>· {when}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {!isAlerts && (
                                            <button
                                                onClick={() => handleAction(item.id, "read")}
                                                disabled={!unread}
                                                className={`p-2 transition-colors ${!unread ? "text-emerald-500/40 cursor-default" : "text-slate-500 hover:text-emerald-400"}`}
                                                title={unread ? "Mark Read" : "Read"}
                                            ><CheckCircle2 size={16} /></button>
                                        )}
                                        {isAlerts && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(item.id, "acknowledge")}
                                                    disabled={acknowledged}
                                                    className={`p-2 transition-colors ${acknowledged ? "text-blue-500/40 cursor-default" : "text-slate-500 hover:text-blue-400"}`}
                                                    title={acknowledged ? "Acknowledged" : "Acknowledge"}
                                                ><CheckSquare size={16} /></button>
                                                <button
                                                    onClick={() => handleAction(item.id, "resolve")}
                                                    disabled={resolved}
                                                    className={`p-2 transition-colors ${resolved ? "text-emerald-500/40 cursor-default" : "text-slate-500 hover:text-emerald-400"}`}
                                                    title={resolved ? "Resolved" : "Resolve"}
                                                ><ShieldAlert size={16} /></button>
                                            </>
                                        )}
                                        <button onClick={() => { setEditItem(item); setShowModal(true); }} className="p-2 text-slate-500 hover:text-amber-400 transition-colors" title="Edit"><AiFillEdit size={16} /></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-500 hover:text-rose-400 transition-colors" title="Delete"><RiDeleteBin6Line size={16} /></button>
                                    </div>
                                </div>
                            );
                        })}
                        {visibleData.length === 0 && (
                            <EmptyState
                                icon={!isAlerts ? "📭" : "🛡️"}
                                title={data.length === 0 ? `No ${isAlerts ? "alerts" : "notifications"} yet` : "No matches for this filter"}
                                action={data.length === 0
                                    ? <AddButton label={`+ Create the first ${isAlerts ? "alert" : "notification"}`} onClick={() => { setEditItem(null); setShowModal(true); }} />
                                    : null}
                            />
                        )}
                    </>
                )}
            </div>

            {showModal && (
                <FormModal
                    title={`${editItem ? "Edit" : "New"} ${isAlerts ? "Alert" : "Notification"}`}
                    fields={isAlerts ? alertFields : notificationFields}
                    initialData={editItem || (isAlerts ? { priority: "MEDIUM", alertType: "SYSTEM" } : null)}
                    onSubmit={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                />
            )}
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
