"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import { PageHeader, AddButton, Toast, EmptyState } from "@/src/components/shared/SharedComponents";
import MatchesCard from './MatchesCard';
import MatchModal from './MatchModal';
import Filters from './Filters';
import { FiAward, FiCalendar, FiAlertCircle, FiArrowUp } from 'react-icons/fi';
import useRole from "@/src/lib/useRole";
import { parseKickoff } from "@/src/components/matches/liveClock";

// A scheduled/live match stays "in window" for this long after kickoff. Past it,
// an unmanaged fixture is considered abandoned (see auto-clean below).
const LIVE_WINDOW_MS = 90 * 60 * 1000;

const Matches = () => {
    const [data, setData] = useState({ matches: [] });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [toast, setToast] = useState(null);
    // status: 'All' | 'LIVE' | 'SCHEDULED' | 'COMPLETED' — driven by the 4 stat boxes.
    const [matchFilters, setMatchFilters] = useState({ sport: 'All', status: 'All' });
    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const { canEdit } = useRole();
    const router = useRouter();

    // The "+ Schedule Match" button opens the full-page schedule flow.
    const handleAddClick = () => router.push("/dashboard/matches/new");

    // DB-driven dropdown sources (no hard-coded teams/venues/competitions).
    const SPORT_BY_ID = { 1: "FOOTBALL", 2: "BASKETBALL", 3: "TENNIS", 4: "VOLLEYBALL", 6: "HANDBALL" };
    const DEFAULT_FORMATION = { FOOTBALL: "4-3-3", BASKETBALL: "1-2-2", HANDBALL: "3-3", TENNIS: "1" };
    const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
    useEffect(() => {
        (async () => {
            try {
                const res = await api.getTeams();
                setTeams(unwrapArr(res)
                    .filter(t => SPORT_BY_ID[t.sportId] !== "VOLLEYBALL") // volleyball removed everywhere
                    .map(t => ({ id: t.id, name: t.name, sportType: SPORT_BY_ID[t.sportId] || "FOOTBALL" })));
            } catch { /* ignore */ }
            try {
                const lists = await Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])));
                const byId = new Map();
                lists.flatMap(unwrapArr).forEach(p => byId.set(p.id, p));
                setPlayers([...byId.values()]);
            } catch { /* ignore */ }
        })();
    }, []);

    const matchList = data.matches || [];
    const opponentOptions = Object.values(matchList.reduce((acc, m) => {
        if (m.opponentName && !acc[m.opponentName]) {
            acc[m.opponentName] = { name: m.opponentName, crest: m.opponentCrest || "", sport: String(m.sportType || "FOOTBALL").toUpperCase() };
        }
        return acc;
    }, {})).sort((a, b) => a.name.localeCompare(b.name));
    const stadiumOptions = [...new Set(matchList.map(m => m.venue).filter(v => v && !["Away", "Home", "TBD"].includes(v)))].sort();
    const competitionOptions = [...new Set(matchList.map(m => m.competition).filter(Boolean))].sort();

    const showToast = (msg, type = "success") => setToast({ msg, type });

    // ── AUTO-CLEAN abandoned / fake matches ────────────────────────────────────
    // On every list load we sweep SCHEDULED/LIVE matches whose live window has
    // fully elapsed (now > kickoff + 90 min) and which were never properly ended:
    //   • NO recorded events  → never managed at all → it's a fake match → DELETE.
    //   • HAS events but never ended → auto-finalize to COMPLETED with its score.
    // Future matches, in-window matches, completed matches, and event-bearing
    // matches (other than the finalize case) are never touched.
    const autoCleanMatches = async (matches) => {
        const now = Date.now();
        const candidates = matches.filter((m) => {
            const status = String(m.status || "").toUpperCase();
            const open = status === "SCHEDULED" || status === "LIVE" || status === "HALFTIME";
            if (!open) return false; // never touch completed/finished or anything else
            const k = parseKickoff(m.kickoffTime);
            if (!k) return false; // no kickoff time → can't judge it abandoned
            return now > k.getTime() + LIVE_WINDOW_MS; // past the live window
        });
        if (candidates.length === 0) return false;

        // Resolve which candidates have any recorded events. One bulk fetch, then
        // filter per match (fall back to "has events = true" on error so we never
        // delete a match we couldn't verify).
        let eventsByMatch = new Map();
        let eventsKnown = true;
        try {
            const allEvents = unwrapArr(await api.getMatchEvents());
            allEvents.forEach((e) => {
                const key = String(e.matchId);
                eventsByMatch.set(key, (eventsByMatch.get(key) || 0) + 1);
            });
        } catch {
            eventsKnown = false;
        }

        let changed = false;
        for (const m of candidates) {
            const hasEvents = eventsKnown ? (eventsByMatch.get(String(m.id)) || 0) > 0 : true;
            try {
                if (hasEvents) {
                    // Played but never ended → finalize to FINISHED with current score.
                    // ("FINISHED" is the only completed status the backend enum accepts;
                    // "COMPLETED" is rejected with 400 and the match would stay LIVE forever.)
                    await api.updateMatch(m.id, { ...m, status: "FINISHED" });
                    changed = true;
                }
                // NOTE: we intentionally DO NOT auto-delete event-less past matches
                // anymore. A user can schedule a match and play it later; deleting it
                // just because its kickoff has passed destroyed real, saved fixtures.
            } catch (e) {
                console.error("Auto-clean failed for match", m.id, e);
            }
        }
        return changed;
    };

    const loadData = async () => {
        setLoading(true);
        try {
            let res = await api.getMatches();
            let finalData = unwrapArr(res);

            // Sweep abandoned/fake matches before showing the list. If anything
            // was deleted/finalized, re-fetch so the grid reflects the truth.
            try {
                const changed = await autoCleanMatches(finalData);
                if (changed) finalData = unwrapArr(await api.getMatches());
            } catch (e) { console.error("Auto-clean error:", e); }

            setData({ matches: finalData });
        } catch (err) {
            console.error("Fetch Error [matches]:", err);
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleAddMatch = async (form) => {
        try {
            const homeTeamId = Number(form.homeTeamId) || 1;

            // 1. If a lineup was picked, create its formation first so the match links to it.
            let formationId = null;
            if (!editItem && Array.isArray(form.lineup) && form.lineup.length) {
                try {
                    const fres = await api.createMatchFormation({
                        teamId: homeTeamId,
                        formation: DEFAULT_FORMATION[form.sportType] || "4-3-3",
                        tacticalApproach: "Balanced",
                        formationDetails: `Starting lineup — ${form.lineup.length} players`,
                    });
                    formationId = fres?.data?.id || fres?.id || null;
                } catch (e) { console.error("Formation create failed:", e); }
            }

            const payload = {
                homeTeamId,
                outerTeamId: form.outerTeamId ? Number(form.outerTeamId) : null,
                opponentName: form.opponentName || null,
                opponentCrest: form.opponentCrest || null,
                matchType: form.matchType || "LEAGUE",
                status: editItem ? (form.status || "SCHEDULED") : "SCHEDULED",
                sportType: form.sportType || "FOOTBALL",
                venue: form.venue || "TBD",
                competition: form.competition || "Friendly Match",
                season: form.season || "2025/2026",
                referee: form.referee || "TBD",
                matchSummary: form.matchSummary || "Scheduled fixture",
                notes: form.notes || "N/A",
                attendance: form.attendance ? Number(form.attendance) : null,
                kickoffTime: form.kickoffTime ? new Date(form.kickoffTime).toISOString().slice(0, 19) : new Date().toISOString().slice(0, 19),
                finishTime: form.finishTime ? new Date(form.finishTime).toISOString().slice(0, 19) : null,
                ...(formationId ? { matchFormationId: formationId } : {}),
            };

            if (editItem) {
                await api.updateMatch(editItem.id, payload);
            } else {
                const res = await api.createMatch(payload);
                const matchId = res?.data?.id || res?.id;

                // 2. Persist each picked player as a STARTING_11 lineup row on the formation.
                if (matchId && formationId && Array.isArray(form.lineup) && form.lineup.length) {
                    for (const pid of form.lineup) {
                        const p = players.find(x => x.id === pid) || {};
                        try {
                            await api.createMatchLineup({
                                teamId: homeTeamId,
                                playerId: pid,
                                matchFormationId: formationId,
                                lineupStatus: "STARTING_11",
                                position: p.preferredPosition || undefined,
                                jerseyNumber: p.kitNumber ? Number(p.kitNumber) : undefined,
                            });
                        } catch (e) { console.error("Lineup row failed:", e); }
                    }
                }
            }

            showToast(editItem ? "Match Updated Successfully" : "Match Scheduled Successfully");
            setShowModal(false);
            setEditItem(null);
            loadData();
        } catch (err) {
            showToast(err.message || "Failed to save match.", "error");
        }
    };

    // Filter Matches. Backend sends uppercase enum values (FOOTBALL, BASKETBALL,
    // HANDBALL, …) while the filter buttons pass Title-Case labels — compare
    // case-insensitively, with substring matching so localised variants resolve.
    // 1) Apply the SPORT filter first — the base set the stat-box counts use.
    const sportMatches = (data.matches || []).filter(item => {
        if (matchFilters.sport === 'All' || matchFilters.sport === 'All Sports') return true;
        const sportRaw = String(item.sportType || item.sport || "").toLowerCase().trim();
        const wanted = String(matchFilters.sport).toLowerCase().trim();
        if (!sportRaw) return false;
        return sportRaw === wanted || sportRaw.includes(wanted) || wanted.includes(sportRaw);
    });

    // Status buckets within the chosen sport (drive the stat-box counts).
    const statusOf = (m) => String(m.status || "").toUpperCase();
    const liveMatches = sportMatches.filter(m => statusOf(m) === "LIVE" || statusOf(m) === "HALFTIME");
    const scheduledMatches = sportMatches.filter(m => statusOf(m) === "SCHEDULED");
    const completedMatches = sportMatches.filter(m => statusOf(m) === "COMPLETED" || statusOf(m) === "FINISHED");

    // 2) Apply the STATUS filter (the active stat box) on top of the sport set.
    const matchesStatusFilter = (m) => {
        const s = statusOf(m);
        switch (matchFilters.status) {
            case "LIVE": return s === "LIVE" || s === "HALFTIME";
            case "SCHEDULED": return s === "SCHEDULED";
            case "COMPLETED": return s === "COMPLETED" || s === "FINISHED";
            default: return true; // 'All'
        }
    };
    const filteredMatches = sportMatches.filter(matchesStatusFilter);

    // Toggle a stat box: clicking the active one clears back to 'All'.
    const setStatusFilter = (status) =>
        setMatchFilters(p => ({ ...p, status: p.status === status ? 'All' : status }));

    return (
        <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto fade-in">
            <PageHeader
                title="Match Hub"
                subtitle="Schedule fixtures, follow live matches, and review full match details"
                icon={FiAward}
                action={canEdit ? <AddButton label="+ Schedule Match" onClick={handleAddClick} /> : null}
            />

            {loading ? (
                <div className="text-center py-20 text-slate-500 font-black uppercase text-[10px] tracking-widest italic animate-pulse">
                    LOADING MATCH DATA...
                </div>
            ) : (
                <div className="mt-4">
                    {/* The four stat boxes double as STATUS FILTERS. Clicking one
                        filters the grid to that status; clicking it again clears. */}
                    {(() => {
                        const boxes = [
                            { key: "All", label: "Total Matches", count: sportMatches.length, Icon: FiAward, iconCls: "text-emerald-500", ring: "border-emerald-500 ring-emerald-500/30 bg-emerald-500/[0.06]" },
                            { key: "LIVE", label: "Live Now", count: liveMatches.length, Icon: FiAlertCircle, iconCls: "text-red-500 animate-pulse", ring: "border-red-500 ring-red-500/30 bg-red-500/[0.06]" },
                            { key: "SCHEDULED", label: "Scheduled", count: scheduledMatches.length, Icon: FiCalendar, iconCls: "text-blue-500", ring: "border-blue-500 ring-blue-500/30 bg-blue-500/[0.06]" },
                            { key: "COMPLETED", label: "Completed", count: completedMatches.length, Icon: FiArrowUp, iconCls: "text-slate-400", ring: "border-slate-400 ring-slate-400/20 bg-slate-400/[0.06]" },
                        ];
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {boxes.map(({ key, label, count, Icon, iconCls, ring }) => {
                                    const active = matchFilters.status === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setStatusFilter(key)}
                                            aria-pressed={active}
                                            title={key === "All" ? "Show all matches" : `Filter to ${label}`}
                                            className={`text-left bg-slate-950 rounded-2xl p-4 shadow-sm border flex items-center gap-4 transition-all cursor-pointer hover:border-slate-600
                                                ${active ? `${ring} ring-2 shadow-lg` : "border-slate-800"}`}
                                        >
                                            <Icon className={`text-3xl ${iconCls} ${active ? "" : "opacity-50"}`} strokeWidth={2.2} />
                                            <div>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-slate-300" : "text-slate-500"}`}>{label}</p>
                                                <p className="text-2xl font-black text-slate-100">{count}</p>
                                            </div>
                                            {active && <span className="ml-auto text-[9px] font-black uppercase tracking-widest text-emerald-400">● Active</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}

                    <Filters filters={matchFilters} updateFilter={(key, val) => setMatchFilters(p => ({ ...p, [key]: val }))} />

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-10 mt-6">
                        {filteredMatches.length > 0 ? (
                            filteredMatches.map(match => (
                                <MatchesCard
                                    key={match.id}
                                    match={match}
                                    onRefresh={loadData}
                                    onViewDetails={(m) => router.push(`/dashboard/matches/${m.id}`)}
                                    onPlanLineup={(m) => router.push(`/dashboard/matches/${m.id}/lineup`)}
                                    onEdit={(m) => { setEditItem(m); setShowModal(true); }}
                                    onGoLive={(m) => router.push(`/dashboard/matches/${m.id}/live`)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full">
                                <EmptyState icon="🏆" title={matchFilters.status === "All" ? "No matches found" : `No ${matchFilters.status === "COMPLETED" ? "completed" : matchFilters.status.toLowerCase()} matches`} />
                                {matchFilters.status !== "All" && (
                                    <div className="text-center mt-3">
                                        <button onClick={() => setStatusFilter(matchFilters.status)} className="text-[11px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300">Clear filter</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showModal && (
                <MatchModal
                    open={showModal}
                    onClose={() => { setShowModal(false); setEditItem(null); }}
                    onAddMatch={handleAddMatch}
                    initialData={editItem}
                    teams={teams}
                    opponents={opponentOptions}
                    stadiums={stadiumOptions}
                    competitions={competitionOptions}
                    players={players}
                />
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default Matches;
