"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/src/lib/api";
import Pie from "../charts/Pie";
import UserChip from "@/src/components/shared/UserChip";
import { lookupTeam } from "@/src/lib/teamDirectory";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

// Same visual styling as the previous static version — the only change is
// that every series, bar, and radar axis is computed live from the
// /team-analytics, /player-analytics and /teams endpoints. No mock data.

const unwrap = (res) => Array.isArray(res) ? res : (res?.content || res?.data || []);

const sportLabel = (raw) => {
  const s = String(raw || "").toUpperCase().trim();
  if (s.startsWith("FOOT") || s.startsWith("SOCCER")) return "Football";
  if (s.startsWith("BASKET")) return "Basketball";
  if (s.startsWith("HAND")) return "Handball";
  if (s.startsWith("VOLLEY")) return "Volleyball";
  if (s.startsWith("TENNIS") || s.startsWith("TENIS")) return "Tennis";
  if (s) return s.charAt(0) + s.slice(1).toLowerCase();
  return "Other";
};

const SPORT_COLORS = {
  Football:   "#10b981",
  Basketball: "#3b82f6",
  Handball:   "#6366f1",
  Volleyball: "#f59e0b",
  Tennis:     "#ef4444",
  Other:      "#94a3b8",
};

function EmptyPanel({ msg }) {
  return (
    <div className="h-72 flex items-center justify-center text-slate-500 text-xs uppercase tracking-[0.3em] font-bold">
      {msg || "No data yet"}
    </div>
  );
}

function Filter() {
  const [activeTab, setActiveTab] = useState("team");
  const [loading, setLoading] = useState(true);
  const [teamAnalytics, setTeamAnalytics] = useState([]);
  const [playerAnalytics, setPlayerAnalytics] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [teamA, playerA, teamRoster] = await Promise.all([
          api.getTeamAnalytics().catch(() => []),
          api.getPlayerAnalytics().catch(() => []),
          api.getTeams().catch(() => []),
        ]);
        if (cancelled) return;
        setTeamAnalytics(unwrap(teamA));
        setPlayerAnalytics(unwrap(playerA));
        setTeams(unwrap(teamRoster));
      } catch (err) {
        console.error("Analytics filter load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Resolve team display names. team-analytics only carries a numeric
  //    teamId, so we map it to a friendly club name. Prefer the seeded
  //    team directory (always correct — "FC Barcelona", "FC Barcelona
  //    Bàsquet", …) and fall back to whatever /teams returned. Last
  //    resort is a friendly "Team N" label — never a bare "#id".
  const teamNameById = useMemo(() => {
    const m = new Map();
    teams.forEach((t) => { if (t?.id != null) m.set(Number(t.id), t.name); });
    return m;
  }, [teams]);

  const teamLabel = (teamId) => {
    if (teamId == null) return "Team";
    return lookupTeam(teamId)?.name || teamNameById.get(Number(teamId)) || `Team ${teamId}`;
  };

  // The Pie counts items by their flat `sportType` field. The /teams API
  // currently returns sport/sportType = null for every row, so reading
  // those fields would collapse the whole pie into one "Other" slice.
  // Resolve the sport from the seeded team directory by id instead (with
  // a fall back to any API field that happens to be populated).
  const teamsForPie = useMemo(() => {
    return teams.map((t) => ({
      sportType: sportLabel(
        lookupTeam(t?.id)?.sport
        || t?.sport?.sportType || t?.sport?.name || t?.sportType
      ),
    }));
  }, [teams]);

  // ───────────────────────────────────────────────────────────────────
  // TEAM PERFORMANCE — bar chart of wins/draws/losses per team.
  // ───────────────────────────────────────────────────────────────────
  const teamBarData = useMemo(() => {
    return teamAnalytics
      .map((t) => ({
        team: teamLabel(t.teamId),
        wins:   Number(t.wins   || 0),
        draws:  Number(t.draws  || 0),
        losses: Number(t.losses || 0),
      }))
      .filter((row) => row.wins || row.draws || row.losses)
      .slice(0, 8);
  }, [teamAnalytics, teamNameById]);

  // ───────────────────────────────────────────────────────────────────
  // PLAYER STATISTICS — aggregate primary score + average rating by sport.
  // ───────────────────────────────────────────────────────────────────
  const playerStatsBySport = useMemo(() => {
    const bySport = {};
    playerAnalytics.forEach((p) => {
      const key = sportLabel(p.sportType);
      const row = bySport[key] || { name: key, score: 0, rating: 0, ratedCount: 0 };
      row.score += Number(p.primaryScore || 0);
      if (p.averageRating != null && !isNaN(p.averageRating) && Number(p.averageRating) > 0) {
        row.rating += Number(p.averageRating);
        row.ratedCount += 1;
      }
      bySport[key] = row;
    });
    return Object.values(bySport).map((r) => ({
      name:    r.name,
      Score:   r.score,
      Rating:  r.ratedCount > 0 ? Number((r.rating / r.ratedCount).toFixed(2)) : 0,
    }));
  }, [playerAnalytics]);

  const topPerformers = useMemo(() => {
    return [...playerAnalytics]
      .filter((p) => p.averageRating != null && !isNaN(p.averageRating) && Number(p.averageRating) > 0)
      .sort((a, b) => Number(b.averageRating) - Number(a.averageRating))
      .slice(0, 3);
  }, [playerAnalytics]);

  // ───────────────────────────────────────────────────────────────────
  // TACTICAL ANALYSIS — radar of derived metrics for the top 2 teams
  // (ranked by total matches played). Every axis is normalised to 0-100
  // so each leg of the radar is comparable.
  // ───────────────────────────────────────────────────────────────────
  const radarData = useMemo(() => {
    const sorted = [...teamAnalytics]
      .map((t) => ({ ...t, _games: Number(t.totalMatches || (Number(t.wins||0)+Number(t.draws||0)+Number(t.losses||0))) }))
      .filter((t) => t._games > 0)
      .sort((a, b) => b._games - a._games);

    const a = sorted[0];
    const b = sorted[1];
    if (!a) return { axes: [], teamA: null, teamB: null };

    // Find the max pointsFor / pointsAgainst in the dataset so we can
    // normalise Attack and Resilience to 0-100.
    const maxFor     = Math.max(1, ...sorted.map((t) => Number(t.pointsFor || 0)));
    const maxAgainst = Math.max(1, ...sorted.map((t) => Number(t.pointsAgainst || 0)));

    const metricsFor = (t) => {
      if (!t) return null;
      const games = t._games || 1;
      const wins   = Number(t.wins || 0);
      const draws  = Number(t.draws || 0);
      const losses = Number(t.losses || 0);
      const pf     = Number(t.pointsFor || 0);
      const pa     = Number(t.pointsAgainst || 0);
      const fit    = Number(t.averageTeamFitnessScore || 0); // 0..10 in entity

      return {
        winRate:    (wins   / games) * 100,
        defense:    ((games - losses) / games) * 100,
        attack:     (pf / maxFor) * 100,
        resilience: maxAgainst > 0 ? Math.max(0, 100 - (pa / maxAgainst) * 100) : 0,
        fitness:    fit * 10,
        decisive:   ((wins + losses) / games) * 100, // ties drag this down
      };
    };

    const mA = metricsFor(a);
    const mB = metricsFor(b);

    const axes = [
      { subject: "Win Rate",   A: mA.winRate,    B: mB?.winRate    ?? 0 },
      { subject: "Defense",    A: mA.defense,    B: mB?.defense    ?? 0 },
      { subject: "Attack",     A: mA.attack,     B: mB?.attack     ?? 0 },
      { subject: "Resilience", A: mA.resilience, B: mB?.resilience ?? 0 },
      { subject: "Fitness",    A: mA.fitness,    B: mB?.fitness    ?? 0 },
      { subject: "Decisive",   A: mA.decisive,   B: mB?.decisive   ?? 0 },
    ].map((p) => ({
      ...p,
      A: Number(p.A.toFixed(1)),
      B: Number(p.B.toFixed(1)),
      fullMark: 100,
    }));

    return {
      axes,
      teamA: teamLabel(a.teamId),
      teamB: b ? teamLabel(b.teamId) : null,
    };
  }, [teamAnalytics, teamNameById]);

  return (
    <div className="space-y-10">
      {/* FILTER TABS */}
      <div className="inline-flex bg-slate-900/50 backdrop-blur-sm rounded-xl p-1 border border-slate-800">
        {["team", "players", "tactical"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300
              ${activeTab === tab
                ? "bg-slate-100 text-slate-950 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              }`}
          >
            {tab === "team" && "Team Performance"}
            {tab === "players" && "Player Statistics"}
            {tab === "tactical" && "Tactical Analysis"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center text-emerald-400 font-extrabold uppercase tracking-[0.3em] text-xs py-10 animate-pulse">
          Loading live analytics…
        </div>
      )}

      {/* ── TEAM PERFORMANCE ─────────────────────────────────────────── */}
      {!loading && activeTab === "team" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 group relative overflow-hidden shadow-2xl">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-[80px]" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 relative z-10">
              Team W/D/L (live)
            </h2>
            <div className="h-72 relative z-10">
              {teamBarData.length === 0 ? (
                <EmptyPanel msg="No team analytics yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamBarData}>
                    <XAxis dataKey="team" stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        padding: "12px",
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: "9px", fontWeight: "800", textTransform: "uppercase", paddingBottom: "20px" }}
                    />
                    <Bar dataKey="wins"   fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="draws"  fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="losses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 group relative overflow-hidden shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6 relative z-10">
              Sport Distribution (live)
            </h2>
            <div className="h-72 flex items-center justify-center relative z-10">
              {/* Pass the flattened teamsForPie — each row has a top-level
                  sportType the Pie chart can count by. */}
              <Pie data={teamsForPie} />
            </div>
          </div>
        </div>
      )}

      {/* ── PLAYER STATISTICS ────────────────────────────────────────── */}
      {!loading && activeTab === "players" && (
        <div className="space-y-8 mt-10">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight relative z-10">
              Player Statistics by Sport
            </h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 relative z-10">
              Aggregated from player-analytics — score totals + avg rating per sport
            </p>

            <div className="h-[400px] w-full mt-10 relative z-10">
              {playerStatsBySport.length === 0 ? (
                <EmptyPanel msg="No player analytics yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={playerStatsBySport} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.02)" }}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        borderRadius: "12px",
                        border: "1px solid #1e293b",
                        fontSize: "10px",
                        fontWeight: "800",
                        textTransform: "uppercase",
                        padding: "12px",
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="rect" wrapperStyle={{ paddingTop: "20px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }} />
                    <Bar dataKey="Score"  fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Rating" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-2xl">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-2">
              Top Performers (live)
            </h2>
            <p className="text-[10px] font-bold text-slate-600 mb-10 uppercase tracking-widest leading-none">
              Top 3 players by average rating
            </p>

            {topPerformers.length === 0 ? (
              <EmptyPanel msg="No rated players yet" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topPerformers.map((p, i) => {
                  const sport = sportLabel(p.sportType);
                  const accent = SPORT_COLORS[sport] || SPORT_COLORS.Other;
                  return (
                    <div key={p.id ?? i} className="bg-slate-950/50 border border-slate-900 hover:border-emerald-500/30 rounded-2xl p-6 transition-all group flex justify-between items-center">
                      <div className="flex items-center gap-5 min-w-0">
                        <span className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-500 font-black text-sm group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all shrink-0">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          {p.playerKeycloakId
                            ? <UserChip keycloakId={p.playerKeycloakId} fallback="Player" variant="compact" />
                            : <span className="text-sm font-bold text-slate-400">Squad average</span>}
                          <p className="text-[9px] font-black uppercase tracking-widest mt-1.5" style={{ color: accent }}>
                            {sport}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <h6 className="text-xs font-black text-emerald-500 tracking-tighter">
                          {Number(p.averageRating).toFixed(1)}
                        </h6>
                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest mt-1">
                          {Number(p.primaryScore || 0)} pts
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TACTICAL ANALYSIS ────────────────────────────────────────── */}
      {!loading && activeTab === "tactical" && (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden mt-10">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px]" />

          <div className="relative z-10">
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight">Tactical Comparison</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">
              {radarData.teamA && radarData.teamB
                ? `${radarData.teamA} vs ${radarData.teamB} across six derived metrics`
                : radarData.teamA
                  ? `${radarData.teamA} profile (add a second team to enable comparison)`
                  : "No team analytics rows yet"}
            </p>
          </div>

          <div className="h-[500px] w-full mt-10 relative z-10 bg-slate-950/30 rounded-3xl border border-slate-800/50 p-6 flex items-center justify-center">
            {radarData.axes.length === 0 ? (
              <EmptyPanel msg="No team analytics to compare" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData.axes}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 10, fontWeight: "bold" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name={radarData.teamA || "Team A"}
                    dataKey="A"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                  {radarData.teamB && (
                    <Radar
                      name={radarData.teamB}
                      dataKey="B"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: "800",
                      textTransform: "uppercase",
                      padding: "12px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    verticalAlign="bottom"
                    wrapperStyle={{ paddingTop: "40px", fontSize: "9px", fontWeight: "800", textTransform: "uppercase" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {radarData.axes.length > 0 && (
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.24em] text-center mt-6 relative z-10">
              Axes derived from team-analytics: win rate, defense ratio, attack (pts-for vs max),
              resilience (inv. pts-against vs max), team fitness, decisive-game ratio.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Filter;
