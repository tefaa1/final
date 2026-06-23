"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  FiUsers, FiAward, FiArrowRight, FiCalendar, FiActivity,
  FiTrendingUp, FiMapPin, FiClock, FiChevronRight,
} from "react-icons/fi";
import { RiDashboardLine } from "react-icons/ri";
import Link from "next/link";
import InfoCard from "./InfoCard";
import { api } from "@/src/lib/api";
import { lookupTeam } from "@/src/lib/teamDirectory";
import { PageHeader } from "@/src/components/shared/SharedComponents";

// Home side of every Barça fixture. Football team id 1 → FC Barcelona crest.
const BARCA = lookupTeam(1) || { name: "FC Barcelona", short: "FCB" };
const BARCA_CREST = BARCA.crestUrl || "https://crests.football-data.org/81.png";

// ── status helpers ────────────────────────────────────────────────────
const isLive = (s) => ["LIVE", "HALFTIME", "IN_PLAY", "PAUSED"].includes(String(s).toUpperCase());
const isFinished = (s) => ["FINISHED", "FT", "AWARDED"].includes(String(s).toUpperCase());

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "TBD";
const fmtFull = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "Date TBD";
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "";

// Robustly recognise the FC Barcelona standings row. The API gives a full name
// ("FC Barcelona") with no team id, but copy elsewhere may say "Barça"/"Barcelona".
// Match on a normalized name (accent-insensitive) OR on the shared crest URL.
const isBarcaRow = (r) => {
  if (!r) return false;
  const name = String(r.team || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip accents: "barça" → "barca"
  if (name.includes("barcelona") || name.includes("barca")) return true;
  // Crest fallback: the seeded Barça crest matches the standings crest exactly.
  return !!r.crest && BARCA_CREST && r.crest === BARCA_CREST;
};

// home is always Barça for these fixtures; resolve the rare non-football home via directory
const homeOf = (m) => {
  const t = lookupTeam(m.homeTeamId);
  return { name: t?.name || BARCA.name, short: t?.short || BARCA.short, crest: t?.crestUrl || BARCA_CREST };
};
// Opponent resolution lives inside the component (it needs the outer-teams map),
// see `awayOf` defined there. A match's opponent can be a free-typed name
// (opponentName) OR a seeded rival club referenced by outerTeamId.
const resultOf = (m) => {
  const h = m.homeTeamScore ?? 0, a = m.awayTeamScore ?? 0;
  return h > a ? "W" : h < a ? "L" : "D";
};
const eur = (v) =>
  v == null ? "—" : v >= 1e6 ? `€${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)}M` : v >= 1e3 ? `€${Math.round(v / 1e3)}K` : `€${v}`;
const POS_SHORT = {
  GOALKEEPER: "GK", RIGHT_BACK: "RB", LEFT_BACK: "LB", CENTER_BACK: "CB",
  DEFENSIVE_MID: "DM", CENTRAL_MID: "CM", ATTACKING_MID: "AM",
  RIGHT_WING: "RW", LEFT_WING: "LW", STRIKER: "ST",
};

// Crest with a guaranteed-visible fallback: when there's no logo URL (or it fails
// to load) we show the team's initials, or a "?" badge — never a blank span.
function Crest({ url, size = 24, ring = false, fallback = "" }) {
  const [broken, setBroken] = useState(false);
  // Build initials: short codes ("FCB") pass through; multi-word names ("FC
  // Barcelona") collapse to the leading letters of each word ("FB").
  const raw = (fallback || "").trim();
  const words = raw.split(/\s+/).filter(Boolean);
  const label = (words.length > 1
    ? words.map((w) => w[0]).join("")
    : raw
  ).slice(0, 3).toUpperCase();
  const showImg = url && !broken;
  if (showImg) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className={`object-contain shrink-0 ${ring ? "rounded-full bg-white/5 p-0.5" : ""}`}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center bg-slate-700 text-slate-300 font-black rounded-full shrink-0 leading-none"
      style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {label || "?"}
    </span>
  );
}

// Skeleton block for loading states
const Skel = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-800/60 rounded-lg ${className}`} />
);

function Dashboard() {
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [outerTeams, setOuterTeams] = useState([]);
  const [standings, setStandings] = useState([]);
  const [activityItems, setActivityItems] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const savedRole = localStorage.getItem("user_role");
    setUserRole(savedRole ? savedRole.toLowerCase() : "fan");

    (async () => {
      const unwrap = (res) => (Array.isArray(res) ? res : res?.content || res?.data || []);
      const [playersR, teamsR, notifR, matchesR, standingsR, outerR] = await Promise.allSettled([
        api.getPlayers(), api.getTeams(), api.getNotifications(), api.getMatches(), api.getStandings("PD"), api.getOuterTeams(),
      ]);
      setPlayers(playersR.status === "fulfilled" ? unwrap(playersR.value) : []);
      setTeams(teamsR.status === "fulfilled" ? unwrap(teamsR.value) : []);
      setMatches(matchesR.status === "fulfilled" ? unwrap(matchesR.value) : []);
      setOuterTeams(outerR.status === "fulfilled" ? unwrap(outerR.value) : []);
      setStandings(standingsR.status === "fulfilled"
        ? (Array.isArray(standingsR.value) ? standingsR.value : unwrap(standingsR.value)) : []);
      const notifications = notifR.status === "fulfilled" ? unwrap(notifR.value) : [];
      setActivityItems(notifications.map((n) => ({
        title: n.title, description: n.message, from: n.category,
        when: n.createdAt, isNew: !n.isRead,
      })));
    })()
      .catch((err) => setLoadError(err.message || "Could not load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  const isAdmin = userRole === "admin";

  // Resolve an opponent for a match: either a free-typed name, or a seeded rival
  // club referenced by outerTeamId (e.g. the El Clásico result is stored with
  // outerTeamId → "Real Madrid CF", not opponentName).
  const outerMap = useMemo(() => {
    const m = {};
    outerTeams.forEach((t) => { m[t.id] = t; });
    return m;
  }, [outerTeams]);
  const awayOf = (m) => {
    const outer = m.outerTeamId != null ? outerMap[m.outerTeamId] : null;
    const name = m.opponentName || outer?.name || "Opponent";
    return {
      name,
      short: name.slice(0, 3).toUpperCase(),
      crest: m.opponentCrest || outer?.crestUrl || null,
    };
  };

  // ── derived match data (real fixtures: have an opponent name OR an outer team) ─
  const { live, finished, upcoming, featured } = useMemo(() => {
    const real = matches.filter((m) => m.opponentName || m.outerTeamId);
    const live = real.filter((m) => isLive(m.status));
    const finished = real
      .filter((m) => isFinished(m.status))
      .sort((a, b) => new Date(b.kickoffTime || 0) - new Date(a.kickoffTime || 0));
    const upcoming = real
      .filter((m) => !isLive(m.status) && !isFinished(m.status))
      .sort((a, b) => new Date(a.kickoffTime || 0) - new Date(b.kickoffTime || 0));
    const featured = live[0] || upcoming[0] || finished[0] || null;
    return { live, finished, upcoming, featured };
  }, [matches]);

  // ── stats computed from real data ────────────────────────────────────
  const wins = useMemo(() => finished.filter((m) => resultOf(m) === "W").length, [finished]);
  const draws = useMemo(() => finished.filter((m) => resultOf(m) === "D").length, [finished]);
  const losses = useMemo(() => finished.filter((m) => resultOf(m) === "L").length, [finished]);
  const goalsFor = useMemo(() => finished.reduce((s, m) => s + (m.homeTeamScore ?? 0), 0), [finished]);
  const winPct = finished.length ? Math.round((wins / finished.length) * 100) : 0;

  // recent form (last 5 finished, oldest→newest for left-to-right reading)
  const form = useMemo(() => finished.slice(0, 5).map(resultOf).reverse(), [finished]);

  // top squad members by market value (real players, photos).
  // Sort valued players first (desc), then null-value players last — so the grid
  // is never empty just because some/all players are missing a market value.
  const stars = useMemo(
    () =>
      [...players]
        .sort((a, b) => {
          const av = a.marketValue, bv = b.marketValue;
          if (av == null && bv == null) return 0;
          if (av == null) return 1;   // nulls last
          if (bv == null) return -1;
          return bv - av;
        })
        .slice(0, 5),
    [players]
  );

  const barcaRow = standings.find(isBarcaRow);
  const featuredLive = featured && isLive(featured.status);
  const featuredFinished = featured && isFinished(featured.status);
  const fHome = featured ? homeOf(featured) : null;
  const fAway = featured ? awayOf(featured) : null;

  return (
    <div className="h-full bg-slate-950 overflow-y-auto w-full pb-12">
      <div className="p-5 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
        <PageHeader
          title="Overview"
          subtitle={isAdmin ? "Club control center · live season snapshot" : "Your FC Barcelona season snapshot"}
          icon={RiDashboardLine}
          action={
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/40 border border-white/10 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">
              {live.length > 0 ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {live.length} Live
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {upcoming.length} Upcoming
                </>
              )}
            </span>
          }
        />

        {loadError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-sm px-4 py-3">
            ⚠ {loadError}
          </div>
        )}

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a] fade-in">
          <div className="absolute -right-16 -top-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-24 w-80 h-80 rounded-full bg-[#a50044]/20 blur-3xl pointer-events-none" />
          <div className="relative grid lg:grid-cols-[1.05fr_0.95fr]">
            {/* Left: club identity */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-4">
                  <img
                    src={BARCA_CREST}
                    alt="FC Barcelona"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.32em] text-emerald-300/80">
                      {isAdmin ? "Control Center" : "Welcome back"}
                    </p>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-[0.95] mt-1">
                      FC Barcelona
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Més que un club · Season hub</p>
                  </div>
                </div>

                {/* Live form pills + league position */}
                <div className="flex flex-wrap items-center gap-5 mt-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-1.5">Recent form</p>
                    <div className="flex items-center gap-1.5">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="w-6 h-6 rounded-md" />)
                      ) : form.length ? (
                        form.map((r, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black ${
                              r === "W" ? "bg-emerald-500 text-slate-950"
                                : r === "L" ? "bg-rose-500 text-white"
                                : "bg-slate-600 text-white"
                            }`}
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No results yet</span>
                      )}
                    </div>
                  </div>
                  {barcaRow && (
                    <div className="pl-5 border-l border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500 mb-1.5">La Liga</p>
                      <p className="text-white font-black text-lg leading-none">
                        {ordinal(barcaRow.position)}
                        <span className="text-slate-400 font-bold text-sm ml-2">{barcaRow.points} pts</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-7">
                <Link href="/dashboard/club" className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider hover:bg-emerald-500/25 transition-all">Club Hub</Link>
                <Link href="/dashboard/competitions" className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-200 text-xs font-black uppercase tracking-wider hover:border-slate-500 transition-all">Competitions</Link>
                <Link href="/dashboard/trophies" className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider hover:bg-amber-500/25 transition-all">Trophy Room</Link>
              </div>
            </div>

            {/* Right: Featured / Next match card */}
            <div className="p-6 sm:p-8 lg:p-10 lg:pl-4 flex items-center">
              <div className="w-full bg-slate-950/60 backdrop-blur rounded-2xl border border-white/10 p-6 shadow-2xl">
                {loading ? (
                  <div className="space-y-4">
                    <Skel className="h-4 w-32" />
                    <div className="flex items-center justify-between gap-4">
                      <Skel className="h-16 w-16 rounded-full" />
                      <Skel className="h-10 w-16" />
                      <Skel className="h-16 w-16 rounded-full" />
                    </div>
                    <Skel className="h-4 w-full" />
                  </div>
                ) : featured ? (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300/80">
                        {featuredLive ? "Live Now" : featuredFinished ? "Latest Result" : "Next Fixture"}
                      </span>
                      {featuredLive ? (
                        <span className="px-2.5 py-1 rounded-md bg-rose-500 text-white text-[10px] font-black uppercase animate-pulse">● Live</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md">
                          {featured.competition || "Friendly"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
                        <Crest url={fHome.crest} size={56} ring fallback={fHome.short} />
                        <span className="text-sm font-black text-white text-center truncate w-full">{fHome.short}</span>
                      </div>
                      <div className="text-center shrink-0 px-2">
                        {featuredFinished || featuredLive ? (
                          <div className="text-4xl font-black text-white tabular-nums leading-none">
                            {featured.homeTeamScore ?? 0}
                            <span className="text-slate-600 mx-2">-</span>
                            {featured.awayTeamScore ?? 0}
                          </div>
                        ) : (
                          <div className="text-2xl font-black text-emerald-400 leading-none">VS</div>
                        )}
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">
                          {featuredFinished ? "Full Time" : featuredLive ? "In Play" : fmtTime(featured.kickoffTime) || "Kick-off"}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-2.5 flex-1 min-w-0">
                        <Crest url={fAway.crest} size={56} ring fallback={fAway.short} />
                        <span className="text-sm font-black text-white text-center truncate w-full">{fAway.short}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 space-y-1.5">
                      <p className="text-xs text-slate-300 font-bold truncate">{fHome.name} vs {fAway.name}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1.5"><FiCalendar size={12} />{fmtFull(featured.kickoffTime)}</span>
                        {featured.venue && <span className="flex items-center gap-1.5 truncate"><FiMapPin size={12} />{featured.venue}</span>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <FiCalendar className="mx-auto mb-3 opacity-40" size={28} />
                    <p className="text-[11px] font-black uppercase tracking-[0.2em]">No fixtures scheduled</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── STAT TILES ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <InfoCard icon={<FiUsers strokeWidth={2.2} />} title="Squad Members" num={loading ? "—" : players.length} perc={teams.length ? `${teams.length} teams` : ""} />
          <InfoCard icon={<FiCalendar strokeWidth={2.2} />} title="Matches Played" num={loading ? "—" : finished.length} perc={upcoming.length ? `${upcoming.length} upcoming` : ""} />
          <InfoCard icon={<FiActivity strokeWidth={2.2} />} title="Win Rate" num={loading ? "—" : `${winPct}%`} perc={`${wins}W ${draws}D ${losses}L`} />
          <InfoCard icon={<FiTrendingUp strokeWidth={2.2} />} title="Goals Scored" num={loading ? "—" : goalsFor} perc={finished.length ? `${(goalsFor / finished.length).toFixed(1)} / match` : ""} />
        </div>

        {/* ── RESULTS + STANDINGS ──────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent results strip */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/70 to-slate-900/30 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black uppercase text-slate-300 tracking-[0.24em] flex items-center gap-2">
                <FiActivity className="text-emerald-400" size={14} />
                {upcoming.length ? "Fixtures & Results" : "Recent Results"}
              </h3>
              <Link href="/dashboard/competitions" className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-wider">
                All <FiArrowRight size={12} />
              </Link>
            </div>

            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-14 w-full rounded-xl" />)
              ) : [...upcoming.slice(0, 2), ...finished.slice(0, 5)].length === 0 ? (
                <p className="text-xs text-slate-600 italic py-6 text-center">No matches yet.</p>
              ) : (
                [...upcoming.slice(0, 2), ...finished.slice(0, 5)].map((m) => {
                  const fin = isFinished(m.status), lv = isLive(m.status);
                  const res = fin ? resultOf(m) : null;
                  const home = homeOf(m), away = awayOf(m);
                  const tone = res === "W" ? "bg-emerald-500 text-slate-950"
                    : res === "L" ? "bg-rose-500 text-white"
                    : res === "D" ? "bg-slate-600 text-white" : "";
                  return (
                    <div key={m.id} className="group flex items-center justify-between bg-slate-950/40 hover:bg-slate-900/60 rounded-xl border border-slate-800/60 hover:border-slate-700 px-3.5 py-3 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black shrink-0 ${tone || "bg-slate-800 text-slate-500"}`}>
                          {res || (lv ? "•" : "–")}
                        </span>
                        <Crest url={home.crest} size={22} fallback={home.short} />
                        <span className="text-sm font-bold text-slate-100 truncate max-w-[120px]">{home.short}</span>
                        <span className="text-slate-600 text-xs font-bold">vs</span>
                        <Crest url={away.crest} size={22} fallback={away.short} />
                        <span className="text-sm font-bold text-slate-300 truncate max-w-[140px]">{away.name}</span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        {lv ? (
                          <span className="text-rose-400 text-sm font-black tabular-nums animate-pulse">{m.homeTeamScore ?? 0}-{m.awayTeamScore ?? 0}</span>
                        ) : fin ? (
                          <span className="text-base font-black text-slate-100 tabular-nums">{m.homeTeamScore ?? 0}-{m.awayTeamScore ?? 0}</span>
                        ) : (
                          <span className="text-[11px] font-black text-emerald-400">{fmtDate(m.kickoffTime)}</span>
                        )}
                        <p className="text-[9px] text-slate-600 uppercase tracking-widest truncate max-w-[120px] ml-auto">{m.competition || ""}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* La Liga mini table */}
          <div className="bg-gradient-to-br from-slate-900/70 to-slate-900/30 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black uppercase text-slate-300 tracking-[0.24em]">La Liga Table</h3>
              <Link href="/dashboard/competitions" className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-wider">Full</Link>
            </div>
            {loading ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skel key={i} className="h-8 w-full" />)}</div>
            ) : standings.length ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-slate-600">
                    <th className="text-left font-black pb-2 pl-1">#</th>
                    <th className="text-left font-black pb-2">Team</th>
                    <th className="text-center font-black pb-2 w-7">P</th>
                    <th className="text-center font-black pb-2 w-7">GD</th>
                    <th className="text-center font-black pb-2 w-8">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.slice(0, 6).map((r) => {
                    const barca = isBarcaRow(r);
                    return (
                      <tr key={r.position} className={`border-t border-slate-800/60 ${barca ? "bg-emerald-500/10" : ""}`}>
                        <td className={`py-2 pl-1 font-mono font-bold w-5 ${r.position <= 4 ? "text-emerald-400" : "text-slate-500"}`}>{r.position}</td>
                        <td className="py-2">
                          <span className={`flex items-center gap-2 font-bold ${barca ? "text-emerald-300" : "text-slate-200"}`}>
                            <Crest url={r.crest} size={16} fallback={r.team} />
                            <span className="truncate max-w-[92px]">{r.team}</span>
                          </span>
                        </td>
                        <td className="py-2 text-center text-slate-500 tabular-nums">{r.played}</td>
                        <td className={`py-2 text-center tabular-nums font-bold ${r.goalDifference > 0 ? "text-emerald-400/80" : r.goalDifference < 0 ? "text-rose-400/80" : "text-slate-500"}`}>
                          {r.goalDifference > 0 ? "+" : ""}{r.goalDifference}
                        </td>
                        <td className="py-2 text-center font-black text-slate-100 tabular-nums">{r.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-slate-600 italic py-6 text-center">Table unavailable.</p>
            )}
            {barcaRow && barcaRow.position > 6 && !loading && (
              <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-xs bg-emerald-500/10 rounded-lg px-2 py-1.5">
                <span className="font-mono font-bold text-emerald-400 w-5">{barcaRow.position}</span>
                <Crest url={barcaRow.crest} size={16} fallback={barcaRow.team} />
                <span className="font-bold text-emerald-300 truncate flex-1">{barcaRow.team}</span>
                <span className="font-black text-slate-100">{barcaRow.points}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── SQUAD SNAPSHOT + ACTIVITY ────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Star players (by market value) */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/70 to-slate-900/30 rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black uppercase text-slate-300 tracking-[0.24em] flex items-center gap-2">
                <FiAward className="text-amber-400" size={14} /> Key Players
              </h3>
              <Link href="/dashboard/players" className="text-[11px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 uppercase tracking-wider">
                Squad <FiArrowRight size={12} />
              </Link>
            </div>
            {loading ? (
              <div className="grid sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-16 w-full rounded-xl" />)}</div>
            ) : stars.length ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {stars.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3 bg-slate-950/40 rounded-xl border border-slate-800/60 hover:border-emerald-500/40 px-3 py-2.5 transition-all">
                    <div className="relative shrink-0">
                      {p.photoUrl ? (
                        <img src={p.photoUrl} alt="" className="w-11 h-11 rounded-full object-cover bg-slate-800 ring-2 ring-slate-700"
                          onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
                      ) : (
                        <span className="w-11 h-11 rounded-full bg-slate-800 ring-2 ring-slate-700 flex items-center justify-center text-xs font-black text-slate-400">
                          {(p.firstName?.[0] || "") + (p.lastName?.[0] || "")}
                        </span>
                      )}
                      {p.kitNumber != null && (
                        <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                          {p.kitNumber}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-100 truncate">{p.firstName} {p.lastName}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        {POS_SHORT[p.preferredPosition] || p.preferredPosition || "—"}
                        {p.nationality ? ` · ${p.nationality}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-emerald-400 tabular-nums">{eur(p.marketValue)}</p>
                      {idx === 0 && <p className="text-[8px] text-amber-400 uppercase tracking-widest font-black">Top value</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic py-6 text-center">No squad data.</p>
            )}
          </div>

          {/* Activity feed */}
          <div className="bg-gradient-to-br from-slate-900/70 to-slate-900/30 rounded-2xl border border-slate-800 p-5">
            <h3 className="text-[11px] font-black uppercase text-slate-300 tracking-[0.24em] mb-4 flex items-center gap-2">
              <FiClock className="text-emerald-400" size={14} />
              {isAdmin ? "System Logs" : "Club Updates"}
            </h3>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-12 w-full" />)}</div>
            ) : activityItems.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <FiClock className="mx-auto mb-3 opacity-30" size={26} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activityItems.slice(0, 5).map((item, i) => (
                  <div key={i} className="flex gap-3 py-2.5 border-b border-slate-800/50 last:border-0">
                    <div className={`w-1.5 h-1.5 mt-2 rounded-full shrink-0 ${item.isNew ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" : "bg-slate-700"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-100 leading-snug truncate">{item.title}</p>
                      <p className="text-xs text-slate-400 leading-snug line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{item.from}</span>
                        {item.when && <span className="text-[9px] text-slate-600 font-bold">{fmtDate(item.when)}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ordinal(n) {
  if (n == null) return "—";
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default Dashboard;
