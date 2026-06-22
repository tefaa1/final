"use client";
import React, { useEffect, useState } from "react";
import AnalyticCard from "./AnalyticCard";
import Header from "../Header";
import Filter from "./Filter";
import { api } from "@/src/lib/api";
import { FiTrendingUp, FiTarget, FiStar, FiActivity, FiPieChart, FiAward, FiHeart, FiAlertCircle } from "react-icons/fi";

// Aggregates data from multiple endpoints into one read-only Overview.
// Endpoints used:
//   /team-analytics       — match record (wins/losses) + fitness + injuries
//   /player-analytics     — average player rating
//   /match-analyses       — number of analysed games
//   /training-analytics   — squad-wide training attendance
//   /injuries             — active injuries count (optional; soft-fail)

const unwrap = (res) => Array.isArray(res) ? res : (res?.content || res?.data || []);
const safe = (val, fallback = "—") => (val == null || isNaN(val)) ? fallback : val;
const pct = (val, digits = 0) => val == null || isNaN(val) ? "—" : `${val.toFixed(digits)}%`;

function StatBox({ icon, label, value, sub, color = "emerald" }) {
  const palette = {
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-300 border-emerald-500/25",
    cyan:    "from-cyan-500/15 to-cyan-500/5 text-cyan-300 border-cyan-500/25",
    violet:  "from-violet-500/15 to-violet-500/5 text-violet-300 border-violet-500/25",
    amber:   "from-amber-500/15 to-amber-500/5 text-amber-300 border-amber-500/25",
    rose:    "from-rose-500/15 to-rose-500/5 text-rose-300 border-rose-500/25",
  }[color] || "from-emerald-500/15 to-emerald-500/5 text-emerald-300 border-emerald-500/25";

  return (
    <div className={`bg-gradient-to-br ${palette} border rounded-2xl p-5`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-300/80">{label}</p>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1 tracking-wide">{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    winRate: null,
    pointsPerGame: null,
    avgRating: null,
    fitness: null,
    totalMatches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    matchAnalyses: 0,
    activeInjuries: null,
    avgAttendance: null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [teamRes, playerRes, matchAnalysesRes, trainingRes, injuriesRes] = await Promise.all([
          api.getTeamAnalytics().catch(() => []),
          api.getPlayerAnalytics().catch(() => []),
          api.getMatchAnalyses().catch(() => []),
          api.getTrainingAnalytics().catch(() => []),
          api.medical?.Injuries?.get?.().catch(() => []) ?? [],
        ]);
        if (cancelled) return;

        const teams    = unwrap(teamRes);
        const players  = unwrap(playerRes);
        const matches  = unwrap(matchAnalysesRes);
        const training = unwrap(trainingRes);
        const injuries = unwrap(injuriesRes);

        // ── Aggregate team analytics across all teams in the period ──
        let totalMatches = 0, wins = 0, draws = 0, losses = 0, pointsFor = 0, pointsAgainst = 0;
        let fitnessSum = 0, fitnessCount = 0;
        teams.forEach((t) => {
          totalMatches += t.totalMatches || 0;
          wins         += t.wins         || 0;
          draws        += t.draws        || 0;
          losses       += t.losses       || 0;
          pointsFor    += t.pointsFor    || 0;
          pointsAgainst+= t.pointsAgainst|| 0;
          if (t.averageTeamFitnessScore != null) {
            fitnessSum += t.averageTeamFitnessScore;
            fitnessCount += 1;
          }
        });

        const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : null;
        const pointsPerGame = totalMatches > 0 ? pointsFor / totalMatches : null;

        // ── Average player rating from player-analytics ──
        const ratings = players
          .map((p) => Number(p.averageRating))
          .filter((r) => !isNaN(r) && r > 0);
        const avgRating = ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;

        // ── Team fitness average (0-10 scale → display as %) ──
        const fitness = fitnessCount > 0 ? (fitnessSum / fitnessCount) * 10 : null;

        // ── Squad-wide training attendance (team-level rows have null player) ──
        const teamWide = training.filter((t) => !t.playerKeycloakId);
        const avgAttendance = teamWide.length > 0
          ? teamWide.reduce((sum, t) => sum + (t.attendanceRate || 0), 0) / teamWide.length
          : null;

        // ── Active injuries (status != RECOVERED) ──
        const active = injuries.filter((i) => i.status && i.status !== "RECOVERED");

        setStats({
          winRate,
          pointsPerGame,
          avgRating,
          fitness,
          totalMatches,
          wins, draws, losses,
          pointsFor, pointsAgainst,
          matchAnalyses: matches.length,
          activeInjuries: active.length,
          avgAttendance,
        });
      } catch (err) {
        console.error("Analytics overview fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto">
      <Header title="Analytics & Reports" desc="Performance insights aggregated across the club" />

      {loading && (
        <div className="text-center text-emerald-400 font-extrabold uppercase tracking-[0.3em] text-xs py-10 animate-pulse">
          Crunching the numbers…
        </div>
      )}

      {!loading && (
        <>
          {/* ── Headline cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <AnalyticCard
              title="Win Rate"
              num={pct(stats.winRate)}
              icon={
                <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5 transition-all group-hover:scale-110">
                  <FiTrendingUp size={20} />
                </div>
              }
              doub={`${stats.wins}W · ${stats.draws}D · ${stats.losses}L`}
            />
            <AnalyticCard
              title="Avg Points/Game"
              num={safe(stats.pointsPerGame?.toFixed?.(2))}
              icon={
                <div className="bg-cyan-500/10 text-cyan-400 p-3 rounded-xl border border-cyan-500/20 shadow-xl shadow-cyan-500/5 transition-all group-hover:scale-110">
                  <FiTarget size={20} />
                </div>
              }
              doub={`${stats.pointsFor} for / ${stats.pointsAgainst} against`}
            />
            <AnalyticCard
              title="Team Rating"
              num={safe(stats.avgRating?.toFixed?.(1))}
              icon={
                <div className="bg-amber-500/10 text-amber-400 p-3 rounded-xl border border-amber-500/20 shadow-xl shadow-amber-500/5 transition-all group-hover:scale-110">
                  <FiStar size={20} />
                </div>
              }
              doub="avg across rated players"
            />
            <AnalyticCard
              title="Squad Fitness"
              num={pct(stats.fitness, 1)}
              icon={
                <div className="bg-violet-500/10 text-violet-400 p-3 rounded-xl border border-violet-500/20 shadow-xl shadow-violet-500/5 transition-all group-hover:scale-110">
                  <FiActivity size={20} />
                </div>
              }
              doub="from team analytics"
            />
          </div>

          {/* ── Secondary stat strip ───────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <StatBox
              icon={<FiPieChart strokeWidth={2.4} />}
              label="Match Analyses"
              value={stats.matchAnalyses}
              sub="reports published"
              color="cyan"
            />
            <StatBox
              icon={<FiAward strokeWidth={2.4} />}
              label="Matches Played"
              value={stats.totalMatches}
              sub="across all teams"
              color="emerald"
            />
            <StatBox
              icon={<FiAlertCircle strokeWidth={2.4} />}
              label="Active Injuries"
              value={safe(stats.activeInjuries)}
              sub="not yet recovered"
              color={stats.activeInjuries > 0 ? "rose" : "emerald"}
            />
            <StatBox
              icon={<FiHeart strokeWidth={2.4} />}
              label="Training Attendance"
              value={pct(stats.avgAttendance, 1)}
              sub="squad-wide"
              color="violet"
            />
          </div>

          {/* ── Filter strip (placeholder for future drill-down) ───────── */}
          <div className="mt-10">
            <Filter />
          </div>

          {/* ── Footer hint ─────────────────────────────────────────── */}
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.24em] text-center mt-10">
            Read-only overview · data aggregated from match, player, team and training analytics
          </p>
        </>
      )}
    </div>
  );
}
