"use client"
import React, { useState, useEffect } from 'react';
import { api } from "@/src/lib/api";
import {
    PageHeader, AddButton, FilterTabs, Toast, EmptyState, FormModal, StatCard, SportBadge, StatusBadge
} from "@/src/components/shared/SharedComponents";
import TrainingDayGroup from './TrainingDayGroup';
import { lookupTeam } from "@/src/lib/teamDirectory";
import useRole from "@/src/lib/useRole";
import { AiFillEdit } from "react-icons/ai";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaClipboardCheck } from "react-icons/fa";
import { MdSportsSoccer } from "react-icons/md";

const sessionFields = [
    { key: "title", label: "Session Title", required: true },
    { key: "sportType", label: "Sport Type", type: "select", options: ["FOOTBALL", "BASKETBALL", "HANDBALL", "VOLLEYBALL", "TENNIS", "SWIMMING"] },
    { key: "type", label: "Category", type: "select", options: ["TACTICAL", "TECHNICAL", "FITNESS", "RECOVERY", "SET_PIECES"] },
    { key: "date", label: "Date", type: "date", placeholder: "YYYY-MM-DD" },
    { key: "startTime", label: "Start Time", type: "time" },
    { key: "durationMinutes", label: "Duration (Mins)", type: "number" },
    { key: "location", label: "Location", placeholder: "Main Pitch" },
    { key: "teamId", label: "Team ID", type: "number" },
    { key: "coachId", label: "Coach ID", placeholder: "uuid..." }
];

const planFields = [
    { key: "title", label: "Plan Title", required: true },
    { key: "description", label: "Description" },
    { key: "teamId", label: "Team ID", type: "number" },
    { key: "createdByCoachId", label: "Coach ID", type: "number" },
    { key: "startDate", label: "Start Date", type: "date" },
    { key: "endDate", label: "End Date", type: "date" },
    { key: "status", label: "Status", type: "select", options: ["DRAFT", "ACTIVE", "COMPLETED"] },
    { key: "goals", label: "Goals" },
    { key: "focus", label: "Focus" }
];

const drillFields = [
    { key: "trainingSessionId", label: "Session ID", type: "number", required: true },
    { key: "drillName", label: "Drill Name", required: true },
    { key: "category", label: "Category", type: "select", options: ["WARMUP", "TACTICAL", "TECHNICAL", "FITNESS", "SHOOTING_DRILL"] },
    { key: "durationMinutes", label: "Duration (Mins)", type: "number" },
    { key: "orderInSession", label: "Order In Session", type: "number" },
    { key: "intensity", label: "Intensity (1-10)", type: "number" },
    { key: "equipment", label: "Equipment" },
    { key: "description", label: "Description", full: true },
    { key: "instructions", label: "Instructions", full: true }
];

const attendanceFields = [
    { key: "trainingSessionId", label: "Session ID", type: "number", required: true },
    { key: "playerId", label: "Player ID", type: "number", required: true },
    { key: "status", label: "Status", type: "select", options: ["PRESENT", "ABSENT", "EXCUSED"] },
    { key: "checkInTime", label: "Check-in Time", type: "datetime-local" },
    { key: "absenceReason", label: "Absence Reason" },
    { key: "notes", label: "Notes", full: true }
];

const MIN_DURATION_MINUTES = 60;
const DEFAULT_DURATION_MINUTES = 90;

// A session is live strictly when "now" sits inside [start, start + duration].
// State is derived from time only — a stored status (e.g. a stale ONGOING) is
// NOT trusted to keep a session live past its window. CANCELLED never counts.
const isSessionLive = (s, now) => {
    if (!s) return false;
    if (String(s.status || "").toUpperCase() === "CANCELLED") return false;
    const dt = s.scheduledDateTime;
    if (!dt) return false;
    const start = new Date(dt).getTime();
    const end = start + (Number(s.durationMinutes) || DEFAULT_DURATION_MINUTES) * 60000;
    return now >= start && now <= end;
};

const TrainingSchedule = () => {
    const [tab, setTab] = useState("sessions");
    const [data, setData] = useState({ sessions: [], plans: [], drills: [], attendance: [] });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toast, setToast] = useState(null);
    const [players, setPlayers] = useState([]);
    const [allSessions, setAllSessions] = useState([]);
    const [now, setNow] = useState(() => Date.now());
    const { canEdit } = useRole();

    // Tick every second so LIVE-NOW badges & countdowns stay current.
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const liveCount = data.sessions.filter((s) => isSessionLive(s, now)).length;
    const upcomingCount = data.sessions.filter((s) => {
        if (isSessionLive(s, now) || !s.scheduledDateTime) return false;
        if (String(s.status || "").toUpperCase() === "CANCELLED") return false;
        return new Date(s.scheduledDateTime).getTime() > now;
    }).length;

    const showToast = (msg, type = "success") => setToast({ msg, type });

    // Sensible starting values when CREATING a record. Sessions default to a
    // valid 90-min duration so the min-1-hour rule is satisfied out of the box.
    const defaultsFor = (t) => (t === "sessions" ? { durationMinutes: DEFAULT_DURATION_MINUTES, status: "SCHEDULED" } : {});
    const openCreate = () => { setEditItem(null); setShowModal(true); };

    // Load players + sessions once so attendance/drills can show names, not ids.
    useEffect(() => {
        (async () => {
            try {
                const unwrap = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
                const lists = await Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])));
                const byId = new Map(); lists.flatMap(unwrap).forEach(p => byId.set(p.id, p));
                setPlayers([...byId.values()]);
                setAllSessions(unwrap(await api.getTrainingSessions()));
            } catch { /* ignore */ }
        })();
    }, []);
    const playerName = (id) => { const p = players.find(x => String(x.id) === String(id)); return p ? `${p.firstName} ${p.lastName}` : (id ? `Player #${id}` : "—"); };
    const sessionName = (id) => { const s = allSessions.find(x => String(x.id) === String(id)); return s?.objectives || (id ? `Session #${id}` : "—"); };

    const loadData = async () => {
        setLoading(true);
        try {
            let res;
            if (tab === "sessions") res = await api.getTrainingSessions();
            else if (tab === "plans") res = await api.getTrainingPlans();
            else if (tab === "drills") res = await api.getTrainingDrills();
            else if (tab === "attendance") res = await api.getAttendance();

            console.log(`[Training Fetch] Response for ${tab}:`, res);
            const finalData = res?.data || res?.content || (Array.isArray(res) ? res : []);
            setData(prev => ({ ...prev, [tab]: finalData }));
        } catch (err) {
            console.error(`Fetch Error [${tab}]:`, err);
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [tab]);

    const handleSave = async (form) => {
        try {
            let payload = { ...form };
            
            // Coach references aren't asked for in the form → default to the head coach.
            if (tab === "sessions" && !payload.headCoachId) payload.headCoachId = 4;
            if (tab === "plans" && !payload.createdByCoachId) payload.createdByCoachId = 4;

            // Type casting
            if (payload.teamId) payload.teamId = Number(payload.teamId);
            if (payload.durationMinutes) payload.durationMinutes = Number(payload.durationMinutes);
            if (payload.trainingSessionId) payload.trainingSessionId = Number(payload.trainingSessionId);

            // MIN 1 HOUR: a training session must run at least 60 minutes.
            // Block the submit (no API call) with a clear message if it's short.
            if (tab === "sessions") {
                const dur = Number(payload.durationMinutes);
                if (!dur || dur < MIN_DURATION_MINUTES) {
                    showToast(`Training sessions must be at least ${MIN_DURATION_MINUTES} minutes (1 hour).`, "error");
                    return;
                }
            }
            if (payload.createdByCoachId) payload.createdByCoachId = Number(payload.createdByCoachId);
            if (payload.orderInSession) payload.orderInSession = Number(payload.orderInSession);
            if (payload.intensity) payload.intensity = Number(payload.intensity);
            if (payload.playerId) payload.playerId = Number(payload.playerId);

            // Format datetimes if provided
            if (payload.checkInTime) payload.checkInTime = new Date(payload.checkInTime).toISOString().slice(0, 19);
            if (payload.scheduledDateTime) payload.scheduledDateTime = `${payload.scheduledDateTime}:00`.slice(0, 19);

            if (tab === "sessions") {
                editItem ? await api.updateTrainingSession(editItem.id, payload) : await api.createTrainingSession(payload);
            } else if (tab === "plans") {
                editItem ? await api.updateTrainingPlan(editItem.id, payload) : await api.createTrainingPlan(payload);
            } else if (tab === "drills") {
                editItem ? await api.updateTrainingDrill(editItem.id, payload) : await api.createTrainingDrill(payload);
            } else if (tab === "attendance") {
                editItem ? await api.updateAttendance(editItem.id, payload) : await api.createAttendance(payload);
            }

            showToast(editItem ? "Updated successfully" : "Added successfully");
            setShowModal(false);
            setEditItem(null);
            loadData();
        } catch (err) {
            console.error("Save Error:", err);
            showToast("Failed to save data", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            if (tab === "sessions") await api.deleteTrainingSession(id);
            else if (tab === "plans") await api.deleteTrainingPlan(id);
            else if (tab === "drills") await api.deleteTrainingDrill(id);
            else if (tab === "attendance") await api.deleteAttendance(id);
            
            showToast("Deleted successfully");
            loadData();
        } catch (err) {
            showToast("Delete failed", "error");
        }
    };

    const getModalConfig = () => {
        const teamOpts = [1, 2, 3, 5].map(id => ({ value: String(id), label: lookupTeam(id)?.name || `Team ${id}` }));
        const playerOpts = players.map(p => ({ value: String(p.id), label: `${p.firstName} ${p.lastName}` }));
        const sessionOpts = allSessions.map(s => ({ value: String(s.id), label: `${s.objectives || "Session"}${s.trainingType ? ` · ${s.trainingType}` : ""}` }));

        // Fields match the backend Request DTOs exactly (the old session form sent
        // title/type/date which the entity doesn't have → creation failed).
        const FIELDS = {
            sessions: [
                { key: "teamId", label: "Team", type: "select", options: teamOpts, required: true },
                { key: "trainingType", label: "Type", type: "select", options: ["TACTICAL", "TECHNICAL", "FITNESS", "RECOVERY", "VIDEO_ANALYSIS", "FRIENDLY_MATCH"], required: true },
                { key: "status", label: "Status", type: "select", options: ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"], required: true },
                { key: "scheduledDateTime", label: "Date & Time", type: "datetime-local", required: true },
                { key: "durationMinutes", label: "Duration (Mins · min 60)", type: "number", required: true, min: MIN_DURATION_MINUTES, step: 5 },
                { key: "location", label: "Location", required: true },
                { key: "objectives", label: "Objectives / Title", required: true, full: true },
                { key: "description", label: "Description", required: true, full: true },
                { key: "notes", label: "Notes", full: true },
            ],
            plans: [
                { key: "title", label: "Plan Title", required: true },
                { key: "description", label: "Description", required: true, full: true },
                { key: "teamId", label: "Team", type: "select", options: teamOpts, required: true },
                { key: "startDate", label: "Start Date", type: "date", required: true },
                { key: "endDate", label: "End Date", type: "date", required: true },
                { key: "status", label: "Status", type: "select", options: ["DRAFT", "ACTIVE", "COMPLETED"], required: true },
                { key: "goals", label: "Goals", required: true },
                { key: "focus", label: "Focus", required: true },
            ],
            drills: [
                { key: "trainingSessionId", label: "Session", type: "select", options: sessionOpts, required: true },
                { key: "drillName", label: "Drill Name", required: true },
                { key: "description", label: "Description", required: true, full: true },
                { key: "category", label: "Category", type: "select", options: ["WARMUP", "COOLDOWN", "FITNESS", "TACTICAL", "TECHNICAL", "RECOVERY", "PASSING_DRILL", "SHOOTING_DRILL", "DEFENDING_DRILL", "AGILITY_DRILL"], required: true },
                { key: "durationMinutes", label: "Duration (Mins)", type: "number", required: true },
                { key: "orderInSession", label: "Order In Session", type: "number", required: true },
                { key: "intensity", label: "Intensity (1-10)", type: "number" },
                { key: "equipment", label: "Equipment" },
                { key: "instructions", label: "Instructions", full: true },
            ],
            attendance: [
                { key: "trainingSessionId", label: "Session", type: "select", options: sessionOpts, required: true },
                { key: "playerId", label: "Player", type: "select", options: playerOpts, required: true },
                { key: "status", label: "Status", type: "select", options: ["PRESENT", "ABSENT", "LATE", "EXCUSED", "INJURED"], required: true },
                { key: "checkInTime", label: "Check-in Time", type: "datetime-local" },
                { key: "absenceReason", label: "Absence Reason" },
                { key: "notes", label: "Notes", full: true },
            ],
        };
        const titles = { sessions: "Session", plans: "Plan", drills: "Drill", attendance: "Attendance" };
        return { title: `${editItem ? "Edit" : "Add"} ${titles[tab] || "Record"}`, fields: FIELDS[tab] || [] };
    };

    // Grouping for Sessions Tab
    const groupedSessions = data.sessions.reduce((groups, item) => {
        const dt = item.scheduledDateTime || item.date || item.startTime;
        const dateKey = dt ? new Date(dt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : "Unscheduled";
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(item);
        return groups;
    }, {});
    // newest day first
    const orderedDays = Object.entries(groupedSessions).sort((a, b) => {
        const da = new Date(a[1][0]?.scheduledDateTime || 0), db = new Date(b[1][0]?.scheduledDateTime || 0);
        return db - da;
    });

    const tabs = [
        ["sessions", "📅 Sessions"],
        ["plans", "📝 Plans"],
        ["drills", "🏃‍♂️ Drills"],
        ["attendance", <span className="inline-flex items-center gap-1.5"><FaClipboardCheck size={12} /> Attendance</span>]
    ];

    return (
        <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
            <PageHeader
                title="Training Hub"
                subtitle="Schedules, plans, drills & attendance · Ciutat Esportiva Joan Gamper"
                icon={MdSportsSoccer}
                action={
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                        {liveCount > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.18em] shadow-lg shadow-rose-950/50">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-white/80 opacity-75 animate-ping" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                                </span>
                                {liveCount} Live Now
                            </span>
                        )}
                        {canEdit && <AddButton label={`+ Add ${tab.charAt(0).toUpperCase() + tab.slice(1, -1)}`} onClick={openCreate} />}
                    </div>
                }
            />

            <FilterTabs tabs={tabs} active={tab} onSelect={setTab} />

            {loading ? (
                <div className="text-center py-20 text-slate-500 font-black uppercase text-[10px] tracking-widest italic animate-pulse">
                    LOADING TRAINING DATA...
                </div>
            ) : (
                <div className="mt-4">
                    {/* SESSIONS TAB */}
                    {tab === "sessions" && (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                                <StatCard label="Total Sessions" value={data.sessions.length} />
                                <StatCard
                                    label="Live Now"
                                    value={liveCount}
                                    color={liveCount > 0 ? "text-rose-400" : "text-slate-500"}
                                    sub={liveCount > 0 ? "● happening now" : upcomingCount ? `${upcomingCount} upcoming` : "none active"}
                                />
                                <StatCard label="Tactical" value={data.sessions.filter(s => (s.trainingType || s.type) === 'TACTICAL').length} color="text-blue-400" />
                                <StatCard label="Fitness" value={data.sessions.filter(s => (s.trainingType || s.type) === 'FITNESS').length} color="text-amber-400" />
                                <StatCard label="Technical" value={data.sessions.filter(s => (s.trainingType || s.type) === 'TECHNICAL').length} color="text-purple-400" />
                            </div>

                            <div className="space-y-8 pb-10">
                                {orderedDays.length > 0 ? (
                                    orderedDays.map(([date, sessions]) => (
                                        <TrainingDayGroup key={date} date={date} sessions={sessions} />
                                    ))
                                ) : (
                                    <EmptyState icon="📅" title="No sessions scheduled" />
                                )}
                            </div>
                        </>
                    )}

                    {/* PLANS TAB */}
                    {tab === "plans" && (
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950/50 border-b border-slate-800">
                                        {["Plan Title", "Duration", "Team ID", "Coach ID", "Status", "Actions"].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.plans.map(p => (
                                        <tr key={p.id} className="border-b border-slate-900 hover:bg-white/[0.02] transition-all">
                                            <td className="px-6 py-4">
                                                <div className="text-slate-100 font-bold">{p.title}</div>
                                                <div className="text-slate-500 text-xs truncate max-w-xs">{p.description}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">
                                                {p.startDate} <span className="mx-1 text-slate-600">→</span> {p.endDate}
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 text-sm">{lookupTeam(p.teamId)?.name || "Club"}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">Head Coach</td>
                                            <td className="px-6 py-4"><StatusBadge status={p.status || "DRAFT"} /></td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-3">
                                                    <button onClick={() => { setEditItem(p); setShowModal(true); }} className="text-slate-500 hover:text-emerald-500 transition-colors"><AiFillEdit size={16} /></button>
                                                    <button onClick={() => handleDelete(p.id)} className="text-slate-500 hover:text-rose-500 transition-colors"><RiDeleteBin6Line size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {data.plans.length === 0 && <EmptyState icon="📝" title="No training plans" />}
                        </div>
                    )}

                    {/* DRILLS TAB */}
                    {tab === "drills" && (
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950/50 border-b border-slate-800">
                                        {["Drill Name", "Category", "Intensity", "Duration", "Actions"].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.drills.map(d => (
                                        <tr key={d.id} className="border-b border-slate-900 hover:bg-white/[0.02] transition-all">
                                            <td className="px-6 py-4">
                                                <div className="text-slate-100 font-bold">{d.drillName}</div>
                                                <div className="text-slate-500 text-xs truncate max-w-xs">{d.description}</div>
                                            </td>
                                            <td className="px-6 py-4"><StatusBadge status={d.category} /></td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-emerald-400 font-bold">{d.intensity || 5}</span>
                                                    <span className="text-[10px] text-slate-600">/ 10</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-emerald-400 font-bold">{d.durationMinutes} min</td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-3">
                                                    <button onClick={() => { setEditItem(d); setShowModal(true); }} className="text-slate-500 hover:text-emerald-500 transition-colors"><AiFillEdit size={16} /></button>
                                                    <button onClick={() => handleDelete(d.id)} className="text-slate-500 hover:text-rose-500 transition-colors"><RiDeleteBin6Line size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {data.drills.length === 0 && <EmptyState icon="🏃‍♂️" title="No training drills" />}
                        </div>
                    )}

                    {/* ATTENDANCE TAB */}
                    {tab === "attendance" && (
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950/50 border-b border-slate-800">
                                        {["Session", "Player", "Check-in", "Status", "Actions"].map(h => (
                                            <th key={h} className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.attendance.map(a => (
                                        <tr key={a.id} className="border-b border-slate-900 hover:bg-white/[0.02] transition-all">
                                            <td className="px-6 py-4 text-slate-300 text-sm">{sessionName(a.trainingSessionId)}</td>
                                            <td className="px-6 py-4 text-slate-100 font-bold text-sm">{playerName(a.playerId)}</td>
                                            <td className="px-6 py-4 text-slate-400 text-xs">
                                                {a.checkInTime ? new Date(a.checkInTime).toLocaleString() : "—"}
                                                {a.notes && <div className="text-[10px] text-slate-500 truncate max-w-[100px]">{a.notes}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border w-fit block 
                                                    ${a.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                      a.status === 'ABSENT' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 
                                                      'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                                    {a.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-3">
                                                    <button onClick={() => { setEditItem(a); setShowModal(true); }} className="text-slate-500 hover:text-emerald-500 transition-colors"><AiFillEdit size={16} /></button>
                                                    <button onClick={() => handleDelete(a.id)} className="text-slate-500 hover:text-rose-500 transition-colors"><RiDeleteBin6Line size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {data.attendance.length === 0 && <EmptyState icon="✅" title="No attendance records" />}
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <FormModal
                    {...getModalConfig()}
                    onSubmit={handleSave}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                    initialData={editItem || defaultsFor(tab)}
                />
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default TrainingSchedule;