"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { api } from "@/src/lib/api";
import {
    PageHeader, AddButton, FilterTabs, Toast, EmptyState, StatCard, StatusBadge
} from "@/src/components/shared/SharedComponents";
import TrainingDayGroup from './TrainingDayGroup';
import { lookupTeam } from "@/src/lib/teamDirectory";
import { isInjured } from "@/src/lib/playerStatus";
import { buildTeamIndex, buildPlayerTeamMap, SPORT_META, SPORT_BY_ID } from "@/src/lib/clubTeams";
import { DRILL_CATALOG, DRILL_SPORT_ORDER, catalogForSport } from "@/src/data/drillCatalog";
import useRole from "@/src/lib/useRole";
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaClipboardCheck } from "react-icons/fa";
import { MdSportsSoccer } from "react-icons/md";
import { FiCheckCircle, FiCircle, FiX, FiPlus, FiTrash2 } from "react-icons/fi";

const TRAINING_TYPES = ["TACTICAL", "TECHNICAL", "FITNESS", "RECOVERY", "VIDEO_ANALYSIS", "FRIENDLY_MATCH"];
const ATT_STATUS = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "INJURED"];
const MIN_DURATION_MINUTES = 60;
const DEFAULT_DURATION_MINUTES = 90;
const HEAD_COACH_ID = 4;

const unwrap = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const ymd = (d) => { if (!d) return ""; const x = new Date(d); return isNaN(x.getTime()) ? String(d).slice(0, 10) : x.toISOString().slice(0, 10); };
const parseSlots = (s) => { try { const a = JSON.parse(s || "[]"); return Array.isArray(a) ? a : []; } catch { return []; } };
const parseIds = (s) => { try { const a = JSON.parse(s || "[]"); return Array.isArray(a) ? a.map(Number) : []; } catch { return []; } };
const titleCase = (s) => String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
// Compact "in 2d 3h" / "in 4h" / "in 12m" until a session becomes completable.
const fmtUntil = (ms) => {
    if (ms <= 0) return "ready";
    const m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    if (d > 0) return `in ${d}d ${h}h`;
    if (h > 0) return `in ${h}h ${mm}m`;
    return `in ${mm}m`;
};

// Whole days from start..end inclusive.
function daysInclusive(start, end) {
    const a = new Date(ymd(start)), b = new Date(ymd(end));
    if (isNaN(a.getTime()) || isNaN(b.getTime()) || b < a) return 0;
    return Math.floor((b - a) / 86400000) + 1;
}
// Set of YYYY-MM-DD that have a match for this team within [start,end].
function matchDatesForTeam(matches, teamId, start, end) {
    const a = new Date(ymd(start)), b = new Date(ymd(end));
    const set = new Set();
    for (const m of matches || []) {
        if (Number(m.homeTeamId) !== Number(teamId)) continue;
        const key = m.kickoffTime ? ymd(m.kickoffTime) : null;
        if (!key) continue;
        const dd = new Date(key);
        if (dd >= a && dd <= b) set.add(key);
    }
    return set;
}
// Evenly spread `count` distinct training days across the range, skipping match days.
function pickSlotDates(start, end, count, matchDays) {
    const a = new Date(ymd(start)), b = new Date(ymd(end));
    const days = [];
    for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        if (!matchDays.has(key)) days.push(key);
    }
    if (count > days.length) return null;
    const step = days.length / count;
    const picked = [];
    for (let i = 0; i < count; i++) picked.push(days[Math.floor(i * step)]);
    return picked;
}

const TrainingSchedule = () => {
    const [tab, setTab] = useState("plans");
    const [data, setData] = useState({ sessions: [], plans: [], drills: [], attendance: [] });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [players, setPlayers] = useState([]);
    const [teamsRaw, setTeamsRaw] = useState([]);
    const [rostersRaw, setRostersRaw] = useState([]);
    const [matches, setMatches] = useState([]);
    const [allSessions, setAllSessions] = useState([]);
    const [allPlans, setAllPlans] = useState([]);
    const { canEdit } = useRole();

    // modal state
    const [planModal, setPlanModal] = useState(false);
    const [sessionModal, setSessionModal] = useState(false);
    const [attendanceSession, setAttendanceSession] = useState(null);
    const [completeSession, setCompleteSession] = useState(null);
    const [viewSession, setViewSession] = useState(null);
    const [nowMs, setNowMs] = useState(() => Date.now());
    useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 30000); return () => clearInterval(t); }, []);

    const showToast = (msg, type = "success") => setToast({ msg, type });

    const teamIndex = useMemo(() => buildTeamIndex(teamsRaw), [teamsRaw]);
    const playerTeamMap = useMemo(() => buildPlayerTeamMap(rostersRaw), [rostersRaw]);
    const sessionById = useMemo(() => { const m = {}; allSessions.forEach((s) => { m[s.id] = s; }); return m; }, [allSessions]);

    const playerName = (id) => { const p = players.find((x) => String(x.id) === String(id)); return p ? `${p.firstName} ${p.lastName}` : (id ? `Player #${id}` : "—"); };
    const sessionLabel = (id) => { const s = sessionById[id]; return s ? `${s.objectives || "Session"} · ${ymd(s.scheduledDateTime)}` : (id ? `Session #${id}` : "—"); };
    const slotDone = (slot) => slot?.sessionId != null && String(sessionById[slot.sessionId]?.status || "").toUpperCase() === "COMPLETED";

    // reference data
    useEffect(() => {
        (async () => {
            try {
                const lists = await Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map((s) => api.getPlayers(s).catch(() => [])));
                const byId = new Map(); lists.flatMap(unwrap).forEach((p) => byId.set(p.id, p));
                setPlayers([...byId.values()]);
                setTeamsRaw(await api.getTeams().catch(() => []));
                setRostersRaw(await api.getRosters().catch(() => []));
                setMatches(unwrap(await api.getMatches().catch(() => [])));
                setAllSessions(unwrap(await api.getTrainingSessions().catch(() => [])));
                setAllPlans(unwrap(await api.getTrainingPlans().catch(() => [])));
            } catch { /* ignore */ }
        })();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            let res;
            if (tab === "sessions") { res = await api.getTrainingSessions(); setAllSessions(unwrap(res)); }
            else if (tab === "plans") { res = await api.getTrainingPlans(); setAllPlans(unwrap(res)); }
            else if (tab === "drills") { res = []; }
            else if (tab === "attendance") res = await api.getAttendance();
            setData((prev) => ({ ...prev, [tab]: unwrap(res) }));
        } catch (err) {
            showToast("Failed to load data", "error");
        } finally { setLoading(false); }
    };
    useEffect(() => { loadData(); }, [tab]);

    // refresh everything cross-tab after a create (sessions/plans interlink)
    const refreshAll = async () => {
        try {
            setAllSessions(unwrap(await api.getTrainingSessions().catch(() => [])));
            setAllPlans(unwrap(await api.getTrainingPlans().catch(() => [])));
        } catch { /* ignore */ }
        loadData();
    };

    const handleDelete = async (id, kind) => {
        if (!confirm("Are you sure?")) return;
        try {
            if (kind === "session") await api.deleteTrainingSession(id);
            else if (kind === "plan") await api.deleteTrainingPlan(id);
            else if (kind === "attendance") await api.deleteAttendance(id);
            showToast("Deleted successfully");
            refreshAll();
        } catch { showToast("Delete failed", "error"); }
    };

    // ── sessions grouping (existing day-grouped view) ─────────────────────────
    const groupedSessions = (data.sessions || []).reduce((groups, item) => {
        const dt = item.scheduledDateTime;
        const dateKey = dt ? new Date(dt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : "Unscheduled";
        (groups[dateKey] ||= []).push(item);
        return groups;
    }, {});
    const orderedDays = Object.entries(groupedSessions).sort((a, b) => new Date(b[1][0]?.scheduledDateTime || 0) - new Date(a[1][0]?.scheduledDateTime || 0));

    const tabs = [
        ["plans", "📝 Plans"],
        ["sessions", "📅 Sessions"],
        ["drills", "🏃‍♂️ Drill Library"],
        ["attendance", <span className="inline-flex items-center gap-1.5"><FaClipboardCheck size={12} /> Attendance</span>],
    ];

    const addLabel = tab === "plans" ? "+ New Plan" : tab === "sessions" ? "+ New Session" : null;
    const onAdd = () => { if (tab === "plans") setPlanModal(true); else if (tab === "sessions") setSessionModal(true); };

    return (
        <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
            <PageHeader
                title="Training Hub"
                subtitle="Plans → sessions → drills · attendance · Ciutat Esportiva Joan Gamper"
                icon={MdSportsSoccer}
                action={canEdit && addLabel ? <AddButton label={addLabel} onClick={onAdd} /> : null}
            />

            <FilterTabs tabs={tabs} active={tab} onSelect={setTab} />

            {loading ? (
                <div className="text-center py-20 text-slate-500 font-black uppercase text-[10px] tracking-widest italic animate-pulse">LOADING TRAINING DATA...</div>
            ) : (
                <div className="mt-4">
                    {/* ── PLANS ─────────────────────────────────────────────── */}
                    {tab === "plans" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                            {(data.plans || []).map((p) => {
                                const slots = parseSlots(p.sessionSlots);
                                const done = slots.filter(slotDone).length;
                                return (
                                    <div key={p.id} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-lg font-black text-white truncate">{p.title}</h3>
                                                    {p.trainingType && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 border border-emerald-500/30">{titleCase(p.trainingType)}</span>}
                                                    <StatusBadge status={p.status || "DRAFT"} />
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-1">{lookupTeam(p.teamId)?.name || `Team ${p.teamId}`} · {p.startDate} → {p.endDate}</p>
                                            </div>
                                            {canEdit && (
                                                <button onClick={() => handleDelete(p.id, "plan")} className="text-slate-500 hover:text-rose-500 shrink-0"><RiDeleteBin6Line size={16} /></button>
                                            )}
                                        </div>

                                        {/* Session slots — name + date + done flag only (no details) */}
                                        <div className="mt-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">
                                                Sessions <span className="text-slate-400">{done}/{slots.length} done</span>
                                            </p>
                                            {slots.length ? (
                                                <ul className="space-y-1.5">
                                                    {slots.map((s, i) => {
                                                        const ok = slotDone(s);
                                                        return (
                                                            <li key={i} className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${ok ? "border-emerald-500/30 bg-emerald-500/[0.05]" : s.sessionId != null ? "border-sky-500/20 bg-sky-500/[0.04]" : "border-slate-800 bg-slate-950/40"}`}>
                                                                {ok ? <FiCheckCircle className="text-emerald-400 shrink-0" /> : <FiCircle className="text-slate-600 shrink-0" />}
                                                                <span className="text-sm font-bold text-slate-200 flex-1 truncate">{s.name}</span>
                                                                {s.sessionId != null && !ok && <span className="text-[9px] font-black uppercase tracking-widest text-sky-300">scheduled</span>}
                                                                <span className="text-[11px] font-mono text-slate-500">{s.date}</span>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            ) : <p className="text-[12px] text-slate-600 italic">No session slots.</p>}
                                        </div>
                                    </div>
                                );
                            })}
                            {(data.plans || []).length === 0 && <div className="lg:col-span-2"><EmptyState icon="📝" title="No training plans" /></div>}
                        </div>
                    )}

                    {/* ── SESSIONS ──────────────────────────────────────────── */}
                    {tab === "sessions" && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                <StatCard label="Total Sessions" value={data.sessions.length} />
                                <StatCard label="Tactical" value={data.sessions.filter((s) => s.trainingType === "TACTICAL").length} color="text-blue-400" />
                                <StatCard label="Fitness" value={data.sessions.filter((s) => s.trainingType === "FITNESS").length} color="text-amber-400" />
                                <StatCard label="Completed" value={data.sessions.filter((s) => s.status === "COMPLETED").length} color="text-emerald-400" />
                            </div>
                            {/* Sessions awaiting completion — Complete unlocks only AFTER the
                                scheduled date+time has passed; View is always available. */}
                            {data.sessions.some((s) => { const st = String(s.status).toUpperCase(); return st !== "COMPLETED" && st !== "CANCELLED"; }) && (
                                <div className="mb-8 rounded-2xl border border-amber-500/25 bg-amber-500/[0.04] p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300/80 mb-3">⏳ To complete · rate drills + take attendance to score performance</p>
                                    <div className="space-y-2">
                                        {data.sessions.filter((s) => { const st = String(s.status).toUpperCase(); return st !== "COMPLETED" && st !== "CANCELLED"; })
                                            .sort((a, b) => new Date(a.scheduledDateTime || 0) - new Date(b.scheduledDateTime || 0))
                                            .map((s) => {
                                                const due = new Date(s.scheduledDateTime).getTime();
                                                const ready = nowMs >= due;
                                                return (
                                                    <div key={s.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-[13px] font-bold text-slate-200 truncate">{s.objectives || "Session"}</p>
                                                            <p className="text-[10px] text-slate-500">{new Date(s.scheduledDateTime).toLocaleString()}</p>
                                                        </div>
                                                        <button onClick={() => setViewSession(s)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800">View</button>
                                                        {ready ? (
                                                            <button onClick={() => setCompleteSession(s)} className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-500">✓ Complete</button>
                                                        ) : (
                                                            <span title="Available once the session date & time has passed" className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-slate-800 text-slate-600 cursor-not-allowed">🔒 {fmtUntil(due - nowMs)}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-8 pb-10">
                                {orderedDays.length > 0 ? orderedDays.map(([date, sessions]) => (
                                    <TrainingDayGroup key={date} date={date} sessions={sessions} onView={setViewSession} />
                                )) : <EmptyState icon="📅" title="No sessions yet — create one and assign it to a plan" />}
                            </div>
                        </>
                    )}

                    {/* ── DRILL LIBRARY (static, grouped by sport, divider between) ── */}
                    {tab === "drills" && (
                        <div className="space-y-10 pb-10">
                            {DRILL_SPORT_ORDER.map((sport, idx) => (
                                <section key={sport}>
                                    {idx > 0 && <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8" />}
                                    <h2 className="flex items-center gap-2.5 text-lg font-black uppercase tracking-tight text-white mb-4">
                                        <span className="text-2xl">{SPORT_META[sport]?.emoji}</span> {SPORT_META[sport]?.label} Drills
                                        <span className="text-[11px] font-black text-slate-500">{DRILL_CATALOG[sport].length}</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {DRILL_CATALOG[sport].map((d) => (
                                            <div key={d.name} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-sm font-black text-slate-100">{d.name}</h3>
                                                    <StatusBadge status={d.category} />
                                                </div>
                                                <p className="text-[12px] text-slate-400 mt-1.5 leading-snug">{d.description}</p>
                                                <div className="flex items-center gap-4 mt-3 text-[11px] font-bold text-slate-500">
                                                    <span className="text-emerald-400">{d.minutes} min</span>
                                                    <span>Intensity {d.intensity}/10</span>
                                                    <span className="truncate">{d.equipment}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}

                    {/* ── ATTENDANCE ────────────────────────────────────────── */}
                    {tab === "attendance" && (
                        <div className="pb-10">
                            <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-3">Take attendance for a session (all players at once)</p>
                                <div className="flex flex-wrap gap-2">
                                    {allSessions.filter((s) => parseIds(s.playerIds).length > 0).map((s) => (
                                        <button key={s.id} onClick={() => setAttendanceSession(s)}
                                            className="rounded-xl border border-slate-700 bg-slate-950/40 px-3.5 py-2 text-[11px] font-bold text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300 transition-all">
                                            {s.objectives || "Session"} · {ymd(s.scheduledDateTime)} <span className="text-slate-500">({parseIds(s.playerIds).length})</span>
                                        </button>
                                    ))}
                                    {allSessions.filter((s) => parseIds(s.playerIds).length > 0).length === 0 && (
                                        <span className="text-[12px] text-slate-600 italic">No sessions with assigned players yet.</span>
                                    )}
                                </div>
                            </div>

                            {/* existing records */}
                            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950/50 border-b border-slate-800">
                                            {["Session", "Player", "Status", "Actions"].map((h) => <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(data.attendance || []).map((a) => (
                                            <tr key={a.id} className="border-b border-slate-900 hover:bg-white/[0.02]">
                                                <td className="px-6 py-3 text-slate-300 text-sm">{sessionLabel(a.trainingSessionId)}</td>
                                                <td className="px-6 py-3 text-slate-100 font-bold text-sm">{playerName(a.playerId)}</td>
                                                <td className="px-6 py-3"><StatusBadge status={a.status} /></td>
                                                <td className="px-6 py-3">
                                                    {canEdit && <button onClick={() => handleDelete(a.id, "attendance")} className="text-slate-500 hover:text-rose-500"><RiDeleteBin6Line size={16} /></button>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {(data.attendance || []).length === 0 && <EmptyState icon="✅" title="No attendance records" />}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {planModal && (
                <PlanModal
                    teamIndex={teamIndex} matches={matches}
                    onClose={() => setPlanModal(false)}
                    onSaved={(msg) => { showToast(msg); setPlanModal(false); refreshAll(); }}
                    onError={(m) => showToast(m, "error")}
                />
            )}
            {sessionModal && (
                <SessionModal
                    plans={allPlans} sessions={allSessions} matches={matches}
                    players={players} playerTeamMap={playerTeamMap} teamIndex={teamIndex}
                    onClose={() => setSessionModal(false)}
                    onSaved={(msg) => { showToast(msg); setSessionModal(false); refreshAll(); }}
                    onError={(m) => showToast(m, "error")}
                />
            )}
            {attendanceSession && (
                <AttendanceModal
                    session={attendanceSession} players={players}
                    onClose={() => setAttendanceSession(null)}
                    onSaved={(msg) => { showToast(msg); setAttendanceSession(null); refreshAll(); }}
                    onError={(m) => showToast(m, "error")}
                />
            )}
            {completeSession && (
                <CompleteSessionModal
                    session={completeSession} players={players}
                    onClose={() => setCompleteSession(null)}
                    onSaved={(msg) => { showToast(msg); setCompleteSession(null); refreshAll(); }}
                    onError={(m) => showToast(m, "error")}
                />
            )}
            {viewSession && (
                <SessionDetailsModal
                    session={viewSession} players={players} plans={allPlans}
                    onClose={() => setViewSession(null)}
                />
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAN MODAL — pick type + range + how many sessions; auto-generate valid slots.
// ─────────────────────────────────────────────────────────────────────────────
function PlanModal({ teamIndex, matches, onClose, onSaved, onError }) {
    const teamOpts = teamIndex.list.length ? teamIndex.list : [1, 2, 3, 5].map((id) => ({ id, name: lookupTeam(id)?.name || `Team ${id}` }));
    const [f, setF] = useState({ title: "", description: "", trainingType: "TACTICAL", teamId: String(teamOpts[0]?.id || 1), startDate: "", endDate: "", sessionCount: 3, status: "ACTIVE", goals: "", focus: "" });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

    // live capacity hint
    const cap = useMemo(() => {
        if (!f.startDate || !f.endDate) return null;
        const total = daysInclusive(f.startDate, f.endDate);
        if (total <= 0) return { total: 0, matchCount: 0, max: 0 };
        const md = matchDatesForTeam(matches, f.teamId, f.startDate, f.endDate);
        return { total, matchCount: md.size, max: Math.max(0, total - md.size) };
    }, [f.startDate, f.endDate, f.teamId, matches]);

    const submit = async () => {
        if (!f.title.trim()) return onError("Plan title is required.");
        if (!f.startDate || !f.endDate) return onError("Start and end dates are required.");
        if (new Date(f.endDate) < new Date(f.startDate)) return onError("End date must be after the start date.");
        const count = Number(f.sessionCount);
        if (!count || count < 1) return onError("Enter at least 1 session.");
        const md = matchDatesForTeam(matches, f.teamId, f.startDate, f.endDate);
        const total = daysInclusive(f.startDate, f.endDate);
        const max = total - md.size;
        if (count > max) return onError(`Too many sessions: at most ${max} fit (${total} days − ${md.size} match day${md.size === 1 ? "" : "s"}). No session can fall on a match day or share a day with another.`);
        const dates = pickSlotDates(f.startDate, f.endDate, count, md);
        if (!dates) return onError(`Can't place ${count} sessions on separate non-match days in this range.`);
        const slots = dates.map((d, i) => ({ name: `Session ${i + 1}`, date: d, sessionId: null }));
        setSaving(true);
        try {
            await api.createTrainingPlan({
                title: f.title.trim(), description: f.description.trim() || f.title.trim(),
                teamId: Number(f.teamId), createdByCoachId: HEAD_COACH_ID,
                startDate: f.startDate, endDate: f.endDate, status: f.status,
                trainingType: f.trainingType, sessionSlots: JSON.stringify(slots),
                goals: f.goals.trim() || "General development", focus: f.focus.trim() || titleCase(f.trainingType),
            });
            onSaved(`Plan created with ${slots.length} session slots`);
        } catch (e) { onError(e.message || "Failed to create plan"); setSaving(false); }
    };

    return (
        <ModalShell title="New Training Plan" onClose={onClose}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Plan Title *" full><input className={IN} value={f.title} onChange={(e) => set("title", e.target.value)} /></Field>
                <Field label="Training Type *"><select className={IN} value={f.trainingType} onChange={(e) => set("trainingType", e.target.value)}>{TRAINING_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</select></Field>
                <Field label="Team *"><select className={IN} value={f.teamId} onChange={(e) => set("teamId", e.target.value)}>{teamOpts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
                <Field label="Start Date *"><input type="date" className={IN} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
                <Field label="End Date *"><input type="date" className={IN} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
                <Field label="Number of Sessions *"><input type="number" min={1} className={IN} value={f.sessionCount} onChange={(e) => set("sessionCount", e.target.value)} /></Field>
                <Field label="Status"><select className={IN} value={f.status} onChange={(e) => set("status", e.target.value)}>{["DRAFT", "ACTIVE", "COMPLETED"].map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
                <Field label="Goals" full><input className={IN} value={f.goals} onChange={(e) => set("goals", e.target.value)} /></Field>
                <Field label="Description" full><input className={IN} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
            </div>
            {cap && (
                <div className={`mt-4 rounded-xl border px-3 py-2.5 text-[12px] ${Number(f.sessionCount) > cap.max ? "border-rose-500/40 bg-rose-500/[0.06] text-rose-300" : "border-sky-500/30 bg-sky-500/[0.06] text-slate-300"}`}>
                    Range has <b>{cap.total}</b> days − <b>{cap.matchCount}</b> match day{cap.matchCount === 1 ? "" : "s"} ⇒ up to <b>{cap.max}</b> sessions. Slots are auto-placed on separate non-match days.
                </div>
            )}
            <ModalActions saving={saving} onClose={onClose} onSubmit={submit} label="Create Plan & Slots" />
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION MODAL — full session, assign to a plan slot, pick drills + players.
// ─────────────────────────────────────────────────────────────────────────────
function SessionModal({ plans, sessions, matches, players, playerTeamMap, teamIndex, onClose, onSaved, onError }) {
    const [planId, setPlanId] = useState("");
    const [slotIdx, setSlotIdx] = useState("");
    const [f, setF] = useState({ objectives: "", description: "", notes: "", durationMinutes: DEFAULT_DURATION_MINUTES, location: "Ciutat Esportiva Joan Gamper", date: "", time: "10:00", status: "SCHEDULED" });
    const [picked, setPicked] = useState([]); // drill objects
    const [selPlayers, setSelPlayers] = useState([]); // player ids
    const [custom, setCustom] = useState({ name: "", category: "TECHNICAL", minutes: 10 });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

    const plan = plans.find((p) => String(p.id) === String(planId)) || null;
    const slots = plan ? parseSlots(plan.sessionSlots) : [];
    const openSlots = slots.map((s, i) => ({ ...s, i })).filter((s) => s.sessionId == null);
    const teamId = plan ? plan.teamId : null;
    const sportType = teamId != null ? (teamIndex.byId[Number(teamId)]?.sportType || "FOOTBALL") : "FOOTBALL";
    const trainingType = plan?.trainingType || "TACTICAL";

    // when a slot is chosen, prefill the date to its planned date
    const chooseSlot = (i) => {
        setSlotIdx(i);
        const s = slots[Number(i)];
        if (s) set("date", s.date);
    };

    // players eligible: on the plan's team, matching sport, not injured
    const eligible = useMemo(() => {
        if (teamId == null) return [];
        return players.filter((p) => Number(playerTeamMap[Number(p.id)]) === Number(teamId) && !isInjured(p));
    }, [players, playerTeamMap, teamId]);

    const drillSum = picked.reduce((s, d) => s + (Number(d.minutes) || 0), 0);
    const togglePlayer = (id) => setSelPlayers((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    const addDrill = (d) => setPicked((p) => [...p, d]);
    const removeDrill = (idx) => setPicked((p) => p.filter((_, i) => i !== idx));
    // Coach-authored custom drill (added with intensity 0 — rated at completion).
    const addCustomDrill = () => {
        const name = custom.name.trim();
        if (!name) return;
        setPicked((p) => [...p, { name, category: custom.category, minutes: Number(custom.minutes) || 10, description: name, equipment: "—", instructions: name, custom: true }]);
        setCustom({ name: "", category: "TECHNICAL", minutes: 10 });
    };

    const submit = async () => {
        if (!plan) return onError("Pick a plan to assign this session to.");
        if (slotIdx === "") return onError("Pick an open session slot in the plan.");
        if (!f.objectives.trim()) return onError("Session title / objectives required.");
        if (!f.date) return onError("Pick a date.");
        const dur = Number(f.durationMinutes);
        if (!dur || dur < MIN_DURATION_MINUTES) return onError(`Session must be at least ${MIN_DURATION_MINUTES} minutes.`);

        // ── plan conditions ──
        const d = f.date;
        if (d < ymd(plan.startDate) || d > ymd(plan.endDate)) return onError("Date must fall within the plan's date range.");
        const md = matchDatesForTeam(matches, plan.teamId, plan.startDate, plan.endDate);
        if (md.has(d)) return onError("That day already has a match — no session can be on a match day.");
        const clash = sessions.some((s) => Number(s.trainingPlanId) === Number(plan.id) && ymd(s.scheduledDateTime) === d);
        if (clash) return onError("That day already has a session in this plan (one session per day).");
        // type is taken from the plan, so it always matches.
        if (picked.length && drillSum >= dur) return onError(`Drills total ${drillSum} min — must be LESS than the ${dur}-min session.`);
        if (selPlayers.length === 0) return onError("Select at least one player for this session.");

        setSaving(true);
        try {
            const scheduledDateTime = `${d}T${(f.time || "10:00")}:00`.slice(0, 19);
            const res = await api.createTrainingSession({
                teamId: Number(plan.teamId), trainingType, status: f.status,
                scheduledDateTime, durationMinutes: dur, location: f.location.trim() || "TBD",
                headCoachId: HEAD_COACH_ID, objectives: f.objectives.trim(),
                description: f.description.trim() || f.objectives.trim(), notes: f.notes.trim() || "Scheduled session",
                trainingPlanId: Number(plan.id), playerIds: JSON.stringify(selPlayers),
            });
            const sessionId = res?.data?.id || res?.id;

            // drills
            for (let i = 0; i < picked.length; i++) {
                const dr = picked[i];
                try {
                    await api.createTrainingDrill({
                        trainingSessionId: sessionId, drillName: dr.name, description: dr.description || dr.name,
                        category: dr.category, durationMinutes: Number(dr.minutes) || 10, orderInSession: i + 1,
                        intensity: 0, equipment: dr.equipment || "None", instructions: dr.instructions || "—",
                    });
                } catch (e) { console.error("drill failed", e); }
            }

            // notify each player (in-app alert + email)
            const when = new Date(scheduledDateTime).toLocaleString();
            for (const pid of selPlayers) {
                const pl = players.find((x) => x.id === pid);
                if (!pl?.keycloakId) continue;
                const title = `Training: ${f.objectives.trim()}`;
                const msg = `You're called up for "${f.objectives.trim()}" on ${when} at ${f.location.trim()}.`;
                try {
                    await api.createNotification({
                        recipientUserKeycloakId: pl.keycloakId, notificationType: "BOTH", category: "TRAINING_REMINDER",
                        status: "PENDING", title, message: msg, relatedEntityType: "TRAINING_SESSION", relatedEntityId: sessionId,
                        emailSubject: title, emailBody: msg, actionUrl: "/dashboard/training",
                    });
                } catch (e) { console.error("notif failed", e); }
                try {
                    await api.createAlert({
                        targetUserKeycloakId: pl.keycloakId, targetRole: null, title, message: msg, description: msg,
                        alertType: "SYSTEM", priority: "MEDIUM", relatedEntityType: "TRAINING_SESSION", relatedEntityId: sessionId,
                    });
                } catch (e) { console.error("alert failed", e); }
            }

            // mark the chosen slot as fulfilled (link the session)
            const updatedSlots = slots.map((s, i) => (i === Number(slotIdx) ? { ...s, sessionId } : s));
            try {
                await api.updateTrainingPlan(plan.id, {
                    title: plan.title, description: plan.description, teamId: plan.teamId, createdByCoachId: plan.createdByCoachId,
                    startDate: plan.startDate, endDate: plan.endDate, status: plan.status, trainingType: plan.trainingType,
                    goals: plan.goals, focus: plan.focus, sessionSlots: JSON.stringify(updatedSlots),
                });
            } catch (e) { console.error("plan slot link failed", e); }

            onSaved(`Session created · ${selPlayers.length} players notified by mail + alert`);
        } catch (e) { onError(e.message || "Failed to create session"); setSaving(false); }
    };

    return (
        <ModalShell title="New Session" onClose={onClose} wide>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Assign to Plan *">
                    <select className={IN} value={planId} onChange={(e) => { setPlanId(e.target.value); setSlotIdx(""); setPicked([]); setSelPlayers([]); }}>
                        <option value="">— pick a plan —</option>
                        {plans.map((p) => <option key={p.id} value={p.id}>{p.title} · {titleCase(p.trainingType || "")}</option>)}
                    </select>
                </Field>
                <Field label="Plan Slot *">
                    <select className={IN} value={slotIdx} onChange={(e) => chooseSlot(e.target.value)} disabled={!plan}>
                        <option value="">{plan ? "— pick an open slot —" : "pick a plan first"}</option>
                        {openSlots.map((s) => <option key={s.i} value={s.i}>{s.name} · {s.date}</option>)}
                    </select>
                </Field>
            </div>

            {plan && (
                <div className="mt-2 mb-1 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2 text-[12px] text-slate-300">
                    Type is fixed to the plan: <b className="text-emerald-300">{titleCase(trainingType)}</b> · Team <b>{lookupTeam(plan.teamId)?.name || plan.teamId}</b> · {sportType ? titleCase(sportType) : ""}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <Field label="Title / Objectives *" full><input className={IN} value={f.objectives} onChange={(e) => set("objectives", e.target.value)} /></Field>
                <Field label="Date *"><input type="date" className={IN} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
                <Field label="Time"><input type="time" className={IN} value={f.time} onChange={(e) => set("time", e.target.value)} /></Field>
                <Field label="Duration (min · ≥60) *"><input type="number" min={MIN_DURATION_MINUTES} step={5} className={IN} value={f.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} /></Field>
                <Field label="Location"><input className={IN} value={f.location} onChange={(e) => set("location", e.target.value)} /></Field>
            </div>

            {/* DRILLS */}
            <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Drills <span className={drillSum >= Number(f.durationMinutes) ? "text-rose-400" : "text-emerald-400"}>{drillSum} / {f.durationMinutes} min</span></p>
                </div>
                {picked.length > 0 && (
                    <ul className="space-y-1.5 mb-3">
                        {picked.map((d, i) => (
                            <li key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5">
                                <span className="text-sm text-slate-200 flex-1 truncate">{d.name}</span>
                                <span className="text-[11px] text-slate-500">{d.minutes}m</span>
                                <button onClick={() => removeDrill(i)} className="text-slate-500 hover:text-rose-400"><FiTrash2 size={13} /></button>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/30 p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {catalogForSport(sportType).map((d) => (
                        <button key={d.name} onClick={() => addDrill({ ...d, intensity: 0 })} type="button"
                            className="flex items-center gap-2 text-left rounded-lg border border-slate-800 bg-slate-900/40 px-2.5 py-1.5 hover:border-emerald-500/40">
                            <FiPlus className="text-emerald-400 shrink-0" size={13} />
                            <span className="text-[12px] text-slate-300 flex-1 truncate">{d.name}</span>
                            <span className="text-[10px] text-slate-500">{d.minutes}m</span>
                        </button>
                    ))}
                </div>

                {/* Coach-authored custom drill */}
                <div className="mt-2 flex flex-wrap items-end gap-2">
                    <input value={custom.name} onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))} placeholder="Custom drill name…"
                        className="flex-1 min-w-[140px] bg-slate-900/60 border border-slate-800 focus:border-emerald-500 rounded-lg px-2.5 py-2 text-[13px] text-slate-200 outline-none" />
                    <select value={custom.category} onChange={(e) => setCustom((c) => ({ ...c, category: e.target.value }))}
                        className="bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-2 text-[12px] text-slate-300 outline-none">
                        {["WARMUP", "TECHNICAL", "TACTICAL", "FITNESS", "RECOVERY", "COOLDOWN", "SHOOTING_DRILL", "PASSING_DRILL", "DEFENDING_DRILL", "AGILITY_DRILL"].map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}
                    </select>
                    <input type="number" min={1} value={custom.minutes} onChange={(e) => setCustom((c) => ({ ...c, minutes: e.target.value }))}
                        className="w-16 bg-slate-900/60 border border-slate-800 rounded-lg px-2 py-2 text-[12px] text-slate-300 outline-none" title="Minutes" />
                    <button type="button" onClick={addCustomDrill} className="px-3 py-2 rounded-lg bg-emerald-600/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white">+ Add</button>
                </div>
                <p className="mt-1.5 text-[10px] text-slate-600">Drills are added unrated (intensity 0). Rate them when you <b className="text-slate-400">Complete</b> the session.</p>
            </div>

            {/* PLAYERS */}
            <div className="mt-5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Players to call up <span className="text-slate-400">{selPlayers.length} selected</span> · they get a mail + alert</p>
                {plan ? (
                    eligible.length ? (
                        <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/30 p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {eligible.map((p) => {
                                const on = selPlayers.includes(p.id);
                                return (
                                    <button key={p.id} type="button" onClick={() => togglePlayer(p.id)}
                                        className={`flex items-center gap-2 text-left rounded-lg border px-2.5 py-1.5 ${on ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-800 bg-slate-900/40 hover:border-slate-700"}`}>
                                        {on ? <FiCheckCircle className="text-emerald-400 shrink-0" size={14} /> : <FiCircle className="text-slate-600 shrink-0" size={14} />}
                                        <span className="text-[12px] text-slate-200 flex-1 truncate">{p.firstName} {p.lastName}</span>
                                        <span className="text-[10px] text-slate-500">#{p.kitNumber ?? "—"}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : <p className="text-[12px] text-slate-600 italic">No eligible (fit) players found for this team.</p>
                ) : <p className="text-[12px] text-slate-600 italic">Pick a plan to load its squad.</p>}
            </div>

            <ModalActions saving={saving} onClose={onClose} onSubmit={submit} label="Create Session & Notify" />
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE MODAL — one session, all its players, set every status at once.
// ─────────────────────────────────────────────────────────────────────────────
function AttendanceModal({ session, players, onClose, onSaved, onError }) {
    const ids = parseIds(session.playerIds);
    const roster = ids.map((id) => players.find((p) => p.id === id) || { id, firstName: `Player`, lastName: `#${id}` });
    const [statuses, setStatuses] = useState(() => Object.fromEntries(ids.map((id) => [id, "PRESENT"])));
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        setSaving(true);
        try {
            const now = new Date().toISOString().slice(0, 19);
            for (const id of ids) {
                try {
                    await api.createAttendance({
                        trainingSessionId: session.id, playerId: id, status: statuses[id] || "PRESENT",
                        checkInTime: now, absenceReason: statuses[id] === "ABSENT" ? "Unexcused" : "N/A", notes: "Bulk attendance",
                    });
                } catch (e) { console.error("attendance row failed", id, e); }
            }
            onSaved(`Attendance saved for ${ids.length} players`);
        } catch (e) { onError(e.message || "Failed to save attendance"); setSaving(false); }
    };

    return (
        <ModalShell title="Take Attendance" onClose={onClose}>
            <div className="mb-3">
                <h3 className="text-base font-black text-white">{session.objectives || "Session"}</h3>
                <p className="text-[11px] text-slate-500">{new Date(session.scheduledDateTime).toLocaleString()} · {roster.length} players</p>
            </div>
            <div className="max-h-[55vh] overflow-y-auto space-y-1.5">
                {roster.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                        <span className="text-sm font-bold text-slate-200 flex-1 truncate">{p.firstName} {p.lastName}</span>
                        <select className={`${IN} max-w-[150px]`} value={statuses[p.id] || "PRESENT"} onChange={(e) => setStatuses((s) => ({ ...s, [p.id]: e.target.value }))}>
                            {ATT_STATUS.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>
                ))}
                {roster.length === 0 && <p className="text-[12px] text-slate-600 italic">No players assigned to this session.</p>}
            </div>
            <ModalActions saving={saving} onClose={onClose} onSubmit={submit} label="Save Attendance (all)" disabled={roster.length === 0} />
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE SESSION — coach rates each drill's intensity (0→1-10); that overrides
// the drills, computes the session's performance, marks it COMPLETED, and the new
// values flow into Training Analytics.
// ─────────────────────────────────────────────────────────────────────────────
function CompleteSessionModal({ session, players, onClose, onSaved, onError }) {
    const [drills, setDrills] = useState(null); // null = loading
    const [rating, setRating] = useState({});   // drillId -> intensity 1..10
    const [att, setAtt] = useState({});          // playerId -> status ("" until chosen)
    const [existingAtt, setExistingAtt] = useState({}); // playerId -> attendance row id
    const [saving, setSaving] = useState(false);

    const roster = parseIds(session.playerIds);
    const due = new Date(session.scheduledDateTime).getTime();
    const ready = Date.now() >= due; // time gate: only completable once the session time has passed

    useEffect(() => {
        (async () => {
            try {
                const all = unwrap(await api.getTrainingDrills());
                const mine = all.filter((d) => Number(d.trainingSessionId) === Number(session.id));
                setDrills(mine);
                setRating(Object.fromEntries(mine.map((d) => [d.id, Number(d.intensity) > 0 ? Number(d.intensity) : 5])));
            } catch { setDrills([]); }
            try {
                const ex = unwrap(await api.getAttendance()).filter((a) => Number(a.trainingSessionId) === Number(session.id));
                const map = {}, pre = {};
                ex.forEach((a) => { map[a.playerId] = a.id; pre[a.playerId] = a.status; });
                setExistingAtt(map);
                setAtt(Object.fromEntries(roster.map((id) => [id, pre[id] || ""]))); // blank until chosen
            } catch { setAtt(Object.fromEntries(roster.map((id) => [id, ""]))); }
        })();
    }, [session.id]);

    const playerName = (id) => { const p = players.find((x) => x.id === id); return p ? `${p.firstName} ${p.lastName}` : `Player #${id}`; };
    const vals = drills ? drills.map((d) => Number(rating[d.id]) || 0) : [];
    const performance = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    const allRated = drills != null;
    const allAttendanceChosen = roster.every((id) => att[id]); // every player has a status
    const canSubmit = ready && allRated && allAttendanceChosen;

    const submit = async () => {
        if (!ready) { onError("This session can't be completed until its scheduled date & time has passed."); return; }
        if (!allAttendanceChosen) { onError("Choose an attendance status for every player first."); return; }
        setSaving(true);
        try {
            const nowIso = new Date().toISOString().slice(0, 19);
            for (const d of drills || []) {
                try { await api.updateTrainingDrill(d.id, { intensity: Number(rating[d.id]) || 1 }); } catch (e) { console.error("drill rate failed", e); }
            }
            for (const id of roster) {
                const body = { trainingSessionId: session.id, playerId: id, status: att[id], checkInTime: nowIso, absenceReason: att[id] === "ABSENT" ? "Unexcused" : "N/A", notes: "Recorded at completion" };
                try {
                    if (existingAtt[id]) await api.updateAttendance(existingAtt[id], body);
                    else await api.createAttendance(body);
                } catch (e) { console.error("attendance failed", id, e); }
            }
            await api.updateTrainingSession(session.id, { status: "COMPLETED" });
            onSaved(`Session completed · performance ${performance.toFixed(1)}/10 · ${roster.length} players marked`);
        } catch (e) { onError(e.message || "Failed to complete session"); setSaving(false); }
    };

    return (
        <ModalShell title="Complete Session" onClose={onClose} wide>
            <div className="mb-3">
                <h3 className="text-base font-black text-white">{session.objectives || "Session"}</h3>
                <p className="text-[11px] text-slate-500">{new Date(session.scheduledDateTime).toLocaleString()}</p>
            </div>
            {!ready && (
                <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5 text-[12px] text-amber-300">
                    🔒 This session hasn't happened yet — you can complete it once its date & time has passed ({fmtUntil(due - Date.now())}).
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Drills */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Rate Drills (1–10)</p>
                    {drills === null ? (
                        <p className="text-[12px] text-slate-500 italic py-4 animate-pulse">Loading drills…</p>
                    ) : drills.length === 0 ? (
                        <p className="text-[12px] text-slate-600 italic">No drills on this session.</p>
                    ) : (
                        <div className="space-y-2.5 max-h-[42vh] overflow-y-auto pr-1">
                            {drills.map((d) => (
                                <div key={d.id} className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[13px] font-bold text-slate-200 truncate">{d.drillName}</span>
                                        <span className={`text-sm font-black w-7 text-center ${rating[d.id] >= 8 ? "text-emerald-400" : rating[d.id] >= 5 ? "text-amber-400" : "text-rose-400"}`}>{rating[d.id]}</span>
                                    </div>
                                    <input type="range" min={1} max={10} step={1} value={rating[d.id] || 5}
                                        onChange={(e) => setRating((r) => ({ ...r, [d.id]: Number(e.target.value) }))} className="w-full accent-emerald-500" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* Attendance */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">Attendance <span className={allAttendanceChosen ? "text-emerald-400" : "text-amber-400"}>{roster.filter((id) => att[id]).length}/{roster.length}</span></p>
                    <div className="space-y-2 max-h-[42vh] overflow-y-auto pr-1">
                        {roster.map((id) => (
                            <div key={id} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                                <span className="text-[13px] font-bold text-slate-200 flex-1 truncate">{playerName(id)}</span>
                                <select value={att[id] || ""} onChange={(e) => setAtt((a) => ({ ...a, [id]: e.target.value }))}
                                    className={`max-w-[130px] bg-slate-900/60 border rounded-lg px-2 py-1.5 text-[12px] outline-none ${att[id] ? "border-slate-800 text-slate-200" : "border-amber-500/40 text-amber-300"}`}>
                                    <option value="">— choose —</option>
                                    {ATT_STATUS.map((st) => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>
                        ))}
                        {roster.length === 0 && <p className="text-[12px] text-slate-600 italic">No players assigned to this session.</p>}
                    </div>
                </div>
            </div>
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-3 py-2.5 text-[12px] text-slate-300">
                Computed performance: <b className="text-emerald-300">{performance.toFixed(1)}/10</b>. Complete is enabled once the date has passed, all drills are rated and every player's attendance is set.
            </div>
            <ModalActions saving={saving} onClose={onClose} onSubmit={submit} label="Complete & Score" disabled={!canSubmit} />
        </ModalShell>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIEW SESSION — full read-only detail: meta, plan, drills (+intensity), players
// (+attendance), and the computed performance.
// ─────────────────────────────────────────────────────────────────────────────
function SessionDetailsModal({ session, players, plans, onClose }) {
    const [drills, setDrills] = useState(null);
    const [att, setAtt] = useState(null);
    useEffect(() => {
        (async () => {
            try { setDrills(unwrap(await api.getTrainingDrills()).filter((d) => Number(d.trainingSessionId) === Number(session.id))); } catch { setDrills([]); }
            try { setAtt(unwrap(await api.getAttendance()).filter((a) => Number(a.trainingSessionId) === Number(session.id))); } catch { setAtt([]); }
        })();
    }, [session.id]);
    const plan = plans.find((p) => Number(p.id) === Number(session.trainingPlanId));
    const playerName = (id) => { const p = players.find((x) => x.id === id); return p ? `${p.firstName} ${p.lastName}` : `Player #${id}`; };
    const roster = parseIds(session.playerIds);
    const rated = (drills || []).filter((d) => Number(d.intensity) > 0);
    const perf = rated.length ? (rated.reduce((s, d) => s + Number(d.intensity), 0) / rated.length) : null;
    const attOf = (id) => (att || []).find((a) => Number(a.playerId) === Number(id))?.status;
    const Meta = ({ k, v }) => <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{k}</p><p className="text-[13px] font-bold text-slate-200">{v}</p></div>;

    return (
        <ModalShell title="Session Details" onClose={onClose} wide>
            <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-black text-white">{session.objectives || "Session"}</h3>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${String(session.status).toUpperCase() === "COMPLETED" ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" : "text-amber-300 bg-amber-500/10 border-amber-500/30"}`}>{session.status}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Meta k="Type" v={titleCase(session.trainingType)} />
                <Meta k="Date" v={new Date(session.scheduledDateTime).toLocaleString()} />
                <Meta k="Duration" v={`${session.durationMinutes} min`} />
                <Meta k="Location" v={session.location || "—"} />
                <Meta k="Plan" v={plan ? plan.title : "—"} />
                <Meta k="Performance" v={perf != null ? `${perf.toFixed(1)}/10` : "Not rated"} />
                <Meta k="Players" v={roster.length} />
                <Meta k="Drills" v={(drills || []).length} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400/80 mb-2">Drills</p>
                    <div className="space-y-1.5">
                        {(drills || []).map((d) => (
                            <div key={d.id} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                                <span className="text-[13px] text-slate-200 flex-1 truncate">{d.drillName}</span>
                                <span className="text-[11px] text-slate-500">{d.durationMinutes}m</span>
                                <span className={`text-[12px] font-black ${Number(d.intensity) > 0 ? (d.intensity >= 8 ? "text-emerald-400" : d.intensity >= 5 ? "text-amber-400" : "text-rose-400") : "text-slate-600"}`}>{Number(d.intensity) > 0 ? `${d.intensity}/10` : "unrated"}</span>
                            </div>
                        ))}
                        {drills && drills.length === 0 && <p className="text-[12px] text-slate-600 italic">No drills.</p>}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-400/80 mb-2">Players & Attendance</p>
                    <div className="space-y-1.5">
                        {roster.map((id) => {
                            const st = attOf(id);
                            return (
                                <div key={id} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2">
                                    <span className="text-[13px] text-slate-200 flex-1 truncate">{playerName(id)}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${st === "PRESENT" ? "text-emerald-300 bg-emerald-500/10" : st === "ABSENT" ? "text-rose-300 bg-rose-500/10" : st ? "text-amber-300 bg-amber-500/10" : "text-slate-500 bg-slate-800/60"}`}>{st || "not taken"}</span>
                                </div>
                            );
                        })}
                        {roster.length === 0 && <p className="text-[12px] text-slate-600 italic">No players.</p>}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-900">Close</button>
            </div>
        </ModalShell>
    );
}

// ── tiny shared modal primitives ─────────────────────────────────────────────
const IN = "bg-slate-900/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-sm text-slate-200 outline-none w-full";
function Field({ label, children, full }) {
    return <div className={`flex flex-col gap-1.5 ${full ? "sm:col-span-2" : ""}`}><label className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</label>{children}</div>;
}
function ModalShell({ title, onClose, children, wide }) {
    return (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={`w-full ${wide ? "max-w-3xl" : "max-w-xl"} max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl`}>
                <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-black text-white text-lg">{title}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><FiX /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}
function ModalActions({ saving, onClose, onSubmit, label, disabled }) {
    return (
        <div className="mt-6 flex gap-3 justify-end">
            <button onClick={onClose} disabled={saving} className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-900">Cancel</button>
            <button onClick={onSubmit} disabled={saving || disabled} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-40">{saving ? "Saving…" : label}</button>
        </div>
    );
}

export default TrainingSchedule;
