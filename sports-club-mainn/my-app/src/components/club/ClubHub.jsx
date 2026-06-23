"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/src/lib/api";
import { lookupTeam, lookupOuterTeam } from "@/src/lib/teamDirectory";
import { resolveSport } from "@/src/lib/playerSport";
import { buildTeamIndex, buildPlayerTeamMap, SPORT_META, VISIBLE_SPORTS } from "@/src/lib/clubTeams";
import PlayerFace from "./PlayerFace";
import {
  FiMapPin, FiUsers, FiCalendar, FiAward, FiActivity, FiArrowRight,
  FiTrendingUp, FiStar, FiChevronRight,
} from "react-icons/fi";

// ── Club identity (FC Barcelona) — static brand data the club "owns". ───────
const CLUB = {
  name: "FC Barcelona",
  short: "FCB",
  crest: "https://crests.football-data.org/81.png",
  founded: 1899,
  motto: "Més que un club",
  mottoEn: "More than a club",
  stadium: { name: "Spotify Camp Nou", city: "Barcelona, Spain", capacity: 99354 },
  colors: "Blaugrana",
  honours: 99, // total major honours teaser
};

// First-team (football) is homeTeamId 1; the other Barça sections (2-5) are
// the multi-sport divisions. We surface football as the headline squad.
const FOOTBALL_TEAM_ID = 1;

const SPORTS = ["Football", "Basketball", "Handball", "Tennis", "Volleyball"];

const isLive = (s) => ["LIVE", "IN_PROGRESS", "ONGOING", "HALF_TIME"].includes(String(s).toUpperCase());
const isFinished = (s) => ["FINISHED", "FT", "COMPLETED", "FULL_TIME"].includes(String(s).toUpperCase());
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "TBD");

// Position → short label for player chips.
const POS_SHORT = {
  GOALKEEPER: "GK", RIGHT_BACK: "RB", LEFT_BACK: "LB", CENTER_BACK: "CB",
  DEFENSIVE_MID: "DM", CENTRAL_MID: "CM", ATTACKING_MID: "AM",
  RIGHT_WING: "RW", LEFT_WING: "LW", STRIKER: "ST",
};
const posShort = (p) => POS_SHORT[String(p || "").toUpperCase()] || String(p || "").replace(/_/g, " ").slice(0, 3).toUpperCase() || "—";

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-emerald-500/5 blur-2xl transition-all group-hover:bg-emerald-500/10" />
      <div className="relative flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">{icon}</div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
          <p className="truncate text-lg font-black leading-tight text-slate-100">{value}</p>
          {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// Small crest image with graceful fallback to a tinted monogram.
function Crest({ url, label, size = 20 }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt={label || ""}
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-slate-700 text-[9px] font-black text-slate-200"
      style={{ width: size, height: size }}
    >
      {(label || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function ClubHub() {
  const [players, setPlayers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teamsRaw, setTeamsRaw] = useState([]);
  const [rostersRaw, setRostersRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null); // null until teams load → defaults to first football team

  useEffect(() => {
    let mounted = true;
    (async () => {
      const unwrap = (r) => (Array.isArray(r) ? r : r?.content || r?.data || []);
      const STATUSES = ["AVAILABLE", "INJURED", "ABSENT", "SUSPENDED"];
      try {
        const [pl, st, mt, tm, ros] = await Promise.all([
          Promise.all(STATUSES.map((s) => api.getPlayers(s).catch(() => []))),
          api.getStaff().catch(() => []),
          api.getMatches().catch(() => []),
          api.getTeams().catch(() => []),
          api.getRosters().catch(() => []),
        ]);
        if (!mounted) return;
        const byId = new Map();
        pl.flatMap(unwrap).forEach((p) => byId.set(p.id, p));
        setPlayers([...byId.values()]);
        setStaff(unwrap(st));
        setMatches(unwrap(mt));
        setTeamsRaw(tm);
        setRostersRaw(ros);
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Team model: every club team (first + reserve) across all sports ────────
  const teamIndex = useMemo(() => buildTeamIndex(teamsRaw), [teamsRaw]);
  const playerTeamMap = useMemo(() => buildPlayerTeamMap(rostersRaw), [rostersRaw]);
  // Ordered list of teams for the selector: by sport order, first team then reserves.
  const clubTeams = useMemo(() => {
    const out = [];
    for (const sp of VISIBLE_SPORTS) for (const t of teamIndex.bySport[sp] || []) out.push(t);
    return out;
  }, [teamIndex]);
  // Default selection = the first football team (lowest id) once teams load.
  useEffect(() => {
    if (selectedTeamId == null && clubTeams.length) {
      const firstFootball = (teamIndex.bySport.FOOTBALL || [])[0];
      setSelectedTeamId((firstFootball || clubTeams[0]).id);
    }
  }, [clubTeams, teamIndex, selectedTeamId]);
  const selectedTeam = selectedTeamId != null ? teamIndex.byId[selectedTeamId] : null;
  const activeSportType = selectedTeam?.sportType || "FOOTBALL";
  const activeSportLabel = SPORT_META[activeSportType]?.label || "Football";

  // ── Squad of the SELECTED team (resolved via the roster → team mapping). ──
  const teamPlayers = useMemo(() => {
    const list = players.filter((p) => playerTeamMap[Number(p.id)] === Number(selectedTeamId));
    return list.sort((a, b) => (a.kitNumber ?? 999) - (b.kitNumber ?? 999));
  }, [players, playerTeamMap, selectedTeamId]);

  const headCoach =
    staff.find((s) => String(s.staffRole).toUpperCase() === "HEAD_COACH" && Number(s.teamId) === Number(selectedTeamId)) ||
    staff.find((s) => String(s.staffRole).toUpperCase() === "HEAD_COACH" && Number(s.sportId) === Number(selectedTeam?.sportId)) ||
    staff.find((s) => String(s.staffRole).toUpperCase() === "HEAD_COACH") ||
    staff[0];
  const injured = teamPlayers.filter((p) => p.status === "INJURED");

  // ── Match helpers ─────────────────────────────────────────────────────────
  // Opponent: external matches carry name+crest; seeded ones resolve via outerTeamId.
  const oppOf = (m) => {
    if (m.opponentName) return { name: m.opponentName, crest: m.opponentCrest };
    const t = lookupOuterTeam(m.outerTeamId);
    return { name: t?.name || "Opponent", crest: t?.crestUrl || null };
  };
  const resultOf = (m) => {
    const hs = m.homeTeamScore ?? 0, as = m.awayTeamScore ?? 0;
    return hs > as ? "W" : hs < as ? "L" : "D";
  };

  // Fixtures for the SELECTED team: matches tagged with its homeTeamId, plus —
  // for a first team — any match of that sport (the seeded fixtures carry the
  // first team's id / sportType). Reserve teams only show their own fixtures.
  const teamMatches = useMemo(
    () => matches.filter((m) =>
      Number(m.homeTeamId) === Number(selectedTeamId) ||
      (selectedTeam?.isFirstTeam && String(m.sportType).toUpperCase() === activeSportType)),
    [matches, selectedTeamId, selectedTeam, activeSportType]
  );

  const liveMatches = teamMatches.filter((m) => isLive(m.status));
  const upcoming = useMemo(
    () =>
      teamMatches
        .filter((m) => !isLive(m.status) && !isFinished(m.status))
        .sort((a, b) => new Date(a.kickoffTime || 0) - new Date(b.kickoffTime || 0))
        .slice(0, 5),
    [teamMatches]
  );
  const finishedSorted = useMemo(
    () => teamMatches.filter((m) => isFinished(m.status)).sort((a, b) => new Date(b.kickoffTime || 0) - new Date(a.kickoffTime || 0)),
    [teamMatches]
  );

  // Overall recent form (newest → oldest displayed left=oldest).
  const form = finishedSorted.slice(0, 6).map(resultOf).reverse();
  const record = finishedSorted.reduce(
    (a, m) => { const r = resultOf(m); a[r] = (a[r] || 0) + 1; return a; },
    { W: 0, D: 0, L: 0 }
  );
  const goalsFor = finishedSorted.reduce((s, m) => s + (m.homeTeamScore ?? 0), 0);
  const goalsAgainst = finishedSorted.reduce((s, m) => s + (m.awayTeamScore ?? 0), 0);

  // Results grouped by competition.
  const resultsByComp = useMemo(() => {
    const acc = {};
    for (const m of finishedSorted) {
      const k = m.competition || "Other";
      (acc[k] ||= []).push(m);
    }
    return acc;
  }, [finishedSorted]);
  const compNames = Object.keys(resultsByComp).sort((a, b) => resultsByComp[b].length - resultsByComp[a].length);

  const formTone = (r) =>
    r === "W" ? "bg-emerald-500 text-white" : r === "L" ? "bg-rose-500 text-white" : "bg-slate-600 text-white";

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-48 animate-pulse rounded-3xl border border-slate-800 bg-slate-900/60" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60 lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
        </div>
      </div>
    );
  }

  if (error && !players.length && !matches.length) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <p className="text-2xl font-black text-slate-300">Club data unavailable</p>
        <p className="mt-2 text-sm text-slate-500">We couldn’t reach the club service. Please try again shortly.</p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-8">
      {/* ── Banner ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a]">
        {/* glow + texture */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]" />

        <div className="relative p-7 sm:p-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl" />
              <Crest url={CLUB.crest} label={CLUB.short} size={120} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  Official Club Hub
                </span>
                {liveMatches.length > 0 && (
                  <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">
                    <span className="h-2 w-2 rounded-full bg-white" /> Live Now
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">{CLUB.name}</h1>
              <p className="mt-2 text-lg font-bold italic text-emerald-300">“{CLUB.motto}”</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300 sm:justify-start">
                <span className="flex items-center gap-1.5"><FiCalendar className="text-emerald-400" /> Est. {CLUB.founded}</span>
                <span className="flex items-center gap-1.5"><FiMapPin className="text-emerald-400" /> {CLUB.stadium.name}</span>
                <span className="flex items-center gap-1.5"><FiStar className="text-emerald-400" /> {CLUB.colors}</span>
              </div>
            </div>

            {/* Form strip in the banner */}
            {form.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center backdrop-blur-sm">
                <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">Recent Form</p>
                <div className="flex items-center justify-center gap-1.5">
                  {form.map((r, i) => (
                    <span key={i} className={`grid h-7 w-7 place-items-center rounded-lg text-[11px] font-black ${formTone(r)}`}>{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Team selector: every sport, first AND reserve teams ─────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Viewing</p>
        <div className="flex flex-wrap gap-2">
          {clubTeams.map((t) => {
            const on = Number(t.id) === Number(selectedTeamId);
            return (
              <button key={t.id} onClick={() => setSelectedTeamId(t.id)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                  on ? "bg-emerald-500 text-slate-950" : "border border-slate-700 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-slate-200"}`}>
                <span>{SPORT_META[t.sportType]?.emoji}</span>
                {t.name}
                <span className={`text-[8px] px-1 py-0.5 rounded ${on ? "bg-slate-900/30 text-slate-900" : "bg-slate-800 text-slate-500"}`}>{t.isFirstTeam ? "1st" : "B"}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Key stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<FiUsers size={18} />} label="Squad" value={`${teamPlayers.length}`} sub={`${activeSportLabel} · ${selectedTeam?.tier || ""}`} />
        <StatCard
          icon={<FiTrendingUp size={18} />}
          label="Form (W-D-L)"
          value={`${record.W}-${record.D}-${record.L}`}
          sub={`${goalsFor} GF · ${goalsAgainst} GA`}
        />
        <StatCard
          icon={<FiActivity size={18} />}
          label="Head Coach"
          value={headCoach ? `${headCoach.firstName} ${headCoach.lastName}` : "—"}
          sub={selectedTeam?.name || ""}
        />
        <StatCard icon={<FiMapPin size={18} />} label="Capacity" value={CLUB.stadium.capacity.toLocaleString()} sub={CLUB.stadium.name} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Matches column ─────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Live / Upcoming */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">Fixtures</h2>
              <Link href="/dashboard/matches" className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
                All matches <FiArrowRight size={12} />
              </Link>
            </div>
            {[...liveMatches, ...upcoming].length ? (
              <div className="space-y-2">
                {[...liveMatches, ...upcoming].map((m) => {
                  const opp = oppOf(m);
                  const live = isLive(m.status);
                  return (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Crest url={CLUB.crest} label={CLUB.short} size={22} />
                        <span className="truncate text-sm font-black text-slate-100">{CLUB.short}</span>
                        <span className="px-1 text-xs text-slate-600">vs</span>
                        <Crest url={opp.crest} label={opp.name} size={22} />
                        <span className="truncate text-sm font-bold text-slate-300">{opp.name}</span>
                      </div>
                      <div className="shrink-0 text-right">
                        {live ? (
                          <span className="rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-rose-400">
                            ● Live {m.homeTeamScore ?? 0}–{m.awayTeamScore ?? 0}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-300">{fmtDate(m.kickoffTime)}</span>
                        )}
                        <p className="mt-0.5 text-[9px] uppercase tracking-widest text-slate-600">{m.competition || "Friendly"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-xs italic text-slate-600">No upcoming fixtures scheduled.</p>
            )}
          </section>

          {/* Results — grouped by competition with per-comp form */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-300">Results by Competition</h2>
            {compNames.length ? (
              <div className="space-y-6">
                {compNames.map((comp) => {
                  const list = resultsByComp[comp];
                  const compForm = list.slice(0, 5).map(resultOf).reverse();
                  return (
                    <div key={comp}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-emerald-400/80">{comp}</h3>
                          <span className="text-[10px] text-slate-600">({list.length})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="mr-1 text-[9px] font-black uppercase tracking-widest text-slate-600">Form</span>
                          {compForm.map((r, i) => (
                            <span key={i} className={`grid h-4 w-4 place-items-center rounded text-[9px] font-black ${formTone(r)}`}>{r}</span>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {list.slice(0, 4).map((m) => {
                          const hs = m.homeTeamScore ?? 0, as = m.awayTeamScore ?? 0;
                          const res = resultOf(m);
                          const opp = oppOf(m);
                          const tone =
                            res === "W" ? "bg-emerald-500/20 text-emerald-400" :
                            res === "L" ? "bg-rose-500/20 text-rose-400" : "bg-slate-500/20 text-slate-300";
                          return (
                            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3">
                              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-[11px] font-black ${tone}`}>{res}</span>
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <Crest url={CLUB.crest} label={CLUB.short} size={20} />
                                <span className="truncate text-sm font-bold text-slate-100">{CLUB.short}</span>
                                <span className="px-1 text-xs text-slate-600">vs</span>
                                <Crest url={opp.crest} label={opp.name} size={20} />
                                <span className="truncate text-sm font-bold text-slate-300">{opp.name}</span>
                              </div>
                              <span className="ml-2 shrink-0 text-base font-black text-slate-100">{hs}–{as}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-xs italic text-slate-600">No results recorded yet.</p>
            )}
          </section>
        </div>

        {/* ── Side column ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Trophy room teaser */}
          <Link href="/dashboard/trophies" className="group block">
            <section className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 p-5 transition-all hover:border-amber-500/50">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl transition-all group-hover:bg-amber-500/25" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-amber-300">
                    <FiAward /> Trophy Room
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400">{CLUB.honours}+ major honours — enter the cabinet</p>
                </div>
                <span className="text-4xl drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]">🏆</span>
              </div>
              <span className="relative mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:text-amber-300">
                View trophy room <FiArrowRight size={12} />
              </span>
            </section>
          </Link>

          {/* Stadium card */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/5 blur-2xl" />
            <h2 className="relative mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-300">
              <FiMapPin className="text-emerald-400" /> Home Ground
            </h2>
            <p className="relative text-xl font-black text-slate-100">{CLUB.stadium.name}</p>
            <p className="relative mt-1 text-xs text-slate-500">{CLUB.stadium.city}</p>
            <div className="relative mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
                <p className="text-lg font-black text-slate-100">{CLUB.stadium.capacity.toLocaleString()}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Capacity</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
                <p className="text-lg font-black text-slate-100">{new Date().getFullYear() - CLUB.founded}</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Years</p>
              </div>
            </div>
          </section>

          {/* Coaching staff snapshot */}
          {headCoach && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-300">Dugout</h2>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-xl">
                  <PlayerFace name={`${headCoach.firstName} ${headCoach.lastName}`} sport={activeSportLabel} className="h-full w-full" textClass="text-sm" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-100">{headCoach.firstName} {headCoach.lastName}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Head Coach</p>
                </div>
              </div>
            </section>
          )}

          {/* Injury list */}
          {injured.length > 0 && (
            <section className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5">
              <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-rose-400">Treatment Room</h2>
              <div className="space-y-2">
                {injured.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                    <span className="text-sm font-bold text-slate-300">{p.firstName} {p.lastName}</span>
                    <span className="ml-auto text-[10px] font-black text-slate-600">{posShort(p.preferredPosition)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* ── Squad of the selected team ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-300">
            {selectedTeam?.name || "The Squad"}
            <span className="ml-2 text-[10px] font-black text-slate-500">{activeSportLabel} · {selectedTeam?.tier}</span>
          </h2>
          <Link href="/dashboard/players" className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300">
            Full squad <FiArrowRight size={12} />
          </Link>
        </div>

        {teamPlayers.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {teamPlayers.slice(0, 18).map((p) => (
              <div
                key={p.id}
                className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 transition-all hover:border-emerald-500/40"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <PlayerFace
                    name={`${p.firstName || ""} ${p.lastName || ""}`}
                    sport={resolveSport(p.preferredPosition)}
                    photoUrl={p.photoUrl}
                    className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                    textClass="text-3xl"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                  {p.kitNumber != null && (
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-black/50 text-sm font-black text-white backdrop-blur-sm">
                      {p.kitNumber}
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950">
                    {posShort(p.preferredPosition)}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="truncate text-[11px] font-black leading-tight text-white">{p.lastName || p.firstName}</p>
                  <p className="truncate text-[9px] text-slate-400">{p.nationality || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs italic text-slate-600">No players registered for {selectedTeam?.name || activeSportLabel}.</p>
        )}

        {teamPlayers.length > 18 && (
          <Link
            href="/dashboard/players"
            className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-400 transition-all hover:border-emerald-500/40 hover:text-emerald-400"
          >
            +{teamPlayers.length - 18} more players <FiChevronRight size={14} />
          </Link>
        )}
      </section>
    </div>
  );
}
