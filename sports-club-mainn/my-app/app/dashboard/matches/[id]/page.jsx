"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import useRole from "@/src/lib/useRole";
import { lookupTeam, lookupOuterTeam } from "@/src/lib/teamDirectory";
import { PageHeader } from "@/src/components/shared/SharedComponents";
import MatchDetailsBoard from "@/src/components/matches/MatchDetailsBoard";
import MatchEventsTimeline from "@/src/components/matches/MatchEventsTimeline";
import MatchReviewsPanel from "@/src/components/matches/MatchReviewsPanel";
import AddPlayerReviewForm from "@/src/components/matches/AddPlayerReviewForm";
import MatchReviewWall from "@/src/components/matches/MatchReviewWall";
import MatchStatsPanel from "@/src/components/matches/MatchStatsPanel";
import { sportMeta, parseStatsJson } from "@/src/components/matches/sportConfig";
import {
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiAward, FiUsers,
  FiActivity, FiBarChart2, FiPlayCircle, FiFlag,
} from "react-icons/fi";

// This is a fully client-driven, data-dependent page (it fetches the match by id
// at runtime). Mark it dynamic so Next never tries to statically pre-generate
// params for it — that prerender worker was crashing the route ("Failed to
// generate static paths" → 500). Rendering on demand is correct here anyway.
export const dynamic = "force-dynamic";

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const unwrapOne = (r) => r?.data || r;
const BARCA_CREST = "https://crests.football-data.org/81.png";
const titleSport = (s) => { const x = String(s || "").toLowerCase(); return x ? x[0].toUpperCase() + x.slice(1) : "Football"; };

export default function MatchDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const matchId = Number(id);
  const { canEdit } = useRole();

  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("overview");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const m = unwrapOne(await api.getMatchById(matchId));
        if (!alive) return;
        setMatch(m);

        const lists = await Promise.all(
          ["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map((s) => api.getPlayers(s).catch(() => []))
        );
        const byId = new Map();
        lists.flatMap(unwrapArr).forEach((p) => byId.set(p.id, p));
        if (alive) setPlayers([...byId.values()]);

        // Events for this match.
        try {
          const ev = unwrapArr(await api.getMatchEvents()).filter((e) => String(e.matchId) === String(matchId));
          if (alive) setEvents(ev);
        } catch { /* ignore */ }

        // Reviews for this match (only real, content-bearing rows — the table is
        // shared with lineups so blank rows must be filtered out).
        try {
          const rv = unwrapArr(await api.getMatchPerformanceReviews()).filter(
            (r) => String(r.matchId) === String(matchId) &&
              (r.overallPerformanceRating != null || r.tacticalAnalysis || r.strengths || r.weaknesses || r.areasForImprovement)
          );
          if (alive) setReviews(rv);
        } catch { /* ignore */ }

        // Match analysis (stats / tactical) for this match.
        try {
          const an = unwrapArr(await api.getMatchAnalyses()).find((a) => String(a.matchId) === String(matchId));
          if (alive) setAnalysis(an || null);
        } catch { /* ignore */ }

        // Staff (to resolve a review's coach id → name).
        try { if (alive) setStaff(unwrapArr(await api.getStaff())); } catch { /* ignore */ }
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [matchId]);

  const coachName = (cid) => {
    const s = staff.find((x) => String(x.id) === String(cid));
    return s ? `${s.firstName} ${s.lastName}` : null;
  };

  // The coach a NEW review is attributed to: prefer a head coach, else the first
  // staff member, else a sensible default (Hansi Flick is staff id 4).
  const reviewCoachId = useMemo(() => {
    const head = staff.find((s) => String(s.role || s.staffRole) === "HEAD_COACH");
    return head?.id || staff[0]?.id || 4;
  }, [staff]);

  const meta = useMemo(() => sportMeta(match?.sportType), [match?.sportType]);

  if (loading) {
    return <div className="text-center py-32 text-slate-500 font-black uppercase text-[11px] tracking-widest animate-pulse">Loading match details…</div>;
  }
  if (!match) {
    return (
      <div className="text-center py-32">
        <p className="text-slate-300 font-black uppercase tracking-widest">Match not found</p>
        <button onClick={() => router.push("/dashboard/matches")} className="mt-4 text-emerald-400 hover:text-emerald-300 text-[11px] font-black uppercase tracking-widest">← Back to Match Hub</button>
      </div>
    );
  }

  const synced = !!match.externalId;
  const home = lookupTeam(match.homeTeamId);
  const away = lookupOuterTeam(match.outerTeamId);
  const homeName = synced ? "FC Barcelona" : (home?.name || "FC Barcelona");
  const awayName = match.opponentName || away?.name || "Opponent";
  const homeCrest = synced ? BARCA_CREST : (home?.crestUrl || null);
  const awayCrest = match.opponentCrest || away?.crestUrl || null;
  const homeFallback = home?.crest || "⚪";
  const awayFallback = away?.crest || "🏟️";

  const status = String(match.status || "").toUpperCase();
  const isLive = status === "LIVE" || status === "HALFTIME";
  const isFinished = status === "FINISHED" || status === "COMPLETED";
  const hScore = match.homeTeamScore;
  const aScore = match.awayTeamScore;
  const hasScore = hScore != null && aScore != null;
  const sportUpper = String(match.sportType || "FOOTBALL").toUpperCase();

  const kickoff = match.kickoffTime ? new Date(match.kickoffTime) : null;
  const stats = parseStatsJson(analysis?.sportSpecificStats);

  const Crest = ({ url, fallback, size = 64 }) =>
    url ? (
      <img src={url} alt="" style={{ width: size, height: size }} className="object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = "none"; }} />
    ) : (
      <span style={{ fontSize: size * 0.8 }} className="shrink-0 leading-none">{fallback}</span>
    );

  const statusTone = isLive
    ? "bg-red-500/15 text-red-300 border-red-500/30 animate-pulse"
    : isFinished
      ? "bg-slate-700/40 text-slate-300 border-slate-600/40"
      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";

  // Section tabs — sport-aware: hide lineup tab if sport has no roster/formation.
  const sections = [
    { key: "overview", label: "Overview", icon: FiActivity },
    ...(meta.hasLineup ? [{ key: "lineup", label: meta.hasFormation ? "Lineup & Formation" : "Roster", icon: FiUsers }] : []),
    { key: "events", label: "Events", icon: FiFlag },
    { key: "stats", label: "Stats", icon: FiBarChart2 },
  ];

  return (
    <div className="w-full min-h-full bg-slate-950 fade-in p-4 md:p-6">
      {/* back link */}
      <button onClick={() => router.push("/dashboard/matches")}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-widest transition-colors mb-4">
        <FiArrowLeft /> Back to Match Hub
      </button>

      <PageHeader
        title={`${homeName} vs ${awayName}`}
        subtitle={`${meta.icon} ${meta.label} · ${match.competition || "Match"}${match.season ? ` · ${match.season}` : ""}`}
        icon={FiAward}
        action={
          <div className="flex items-center gap-2">
            {(isLive || (!isFinished && canEdit)) && (
              <button onClick={() => router.push(`/dashboard/matches/${matchId}/live`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest transition-all">
                <FiPlayCircle size={14} /> {isLive ? "Watch Live" : "Go Live"}
              </button>
            )}
            {/* The lineup/formation is LOCKED after creation — it's set once in
                the draft flow at match creation and can never be edited again.
                So there is NO "Edit Lineup" action here; the saved starting XI is
                shown read-only in the Lineup tab below. */}
          </div>
        }
      />

      {/* ── HERO SCOREBOARD ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/60 to-slate-950 p-6 md:p-8 shadow-xl mb-5">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${statusTone}`}>
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1.5 align-middle" />}
            {match.status}
          </span>
          <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            {meta.icon} {meta.label}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-8">
          {/* home */}
          <div className="flex flex-col items-center text-center gap-2.5 min-w-0">
            <Crest url={homeCrest} fallback={homeFallback} size={72} />
            <p className="text-sm md:text-lg font-black text-slate-100 leading-tight">{homeName}</p>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Home</span>
          </div>

          {/* score */}
          <div className="flex flex-col items-center px-2 md:px-4">
            {hasScore ? (
              <div className="flex items-center gap-3 md:gap-5">
                <span className="text-4xl md:text-6xl font-black text-slate-100 tabular-nums">{hScore}</span>
                <span className="text-2xl md:text-3xl font-black text-slate-600">:</span>
                <span className="text-4xl md:text-6xl font-black text-slate-100 tabular-nums">{aScore}</span>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-2xl md:text-3xl font-black text-slate-500">VS</span>
              </div>
            )}
            <span className="mt-2 text-[9px] font-black uppercase tracking-widest text-slate-500">{meta.scoreUnit}</span>
          </div>

          {/* away */}
          <div className="flex flex-col items-center text-center gap-2.5 min-w-0">
            <Crest url={awayCrest} fallback={awayFallback} size={72} />
            <p className="text-sm md:text-lg font-black text-slate-100 leading-tight">{awayName}</p>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Away</span>
          </div>
        </div>

        {/* meta strip */}
        <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-800 pt-5">
          <MetaItem icon={FiCalendar} label="Date" value={kickoff ? kickoff.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "TBD"} />
          <MetaItem icon={FiClock} label="Kickoff" value={kickoff ? kickoff.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBD"} />
          <MetaItem icon={FiMapPin} label="Venue" value={match.venue || "TBD"} />
          <MetaItem icon={FiAward} label="Competition" value={match.competition || "—"} />
        </div>
        {(match.referee || match.attendance || match.matchType) && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] text-slate-500">
            {match.matchType && <span><span className="font-black text-slate-400 uppercase tracking-widest">Type</span> · {String(match.matchType).replace(/_/g, " ")}</span>}
            {match.referee && <span><span className="font-black text-slate-400 uppercase tracking-widest">Referee</span> · {match.referee}</span>}
            {match.attendance && <span><span className="font-black text-slate-400 uppercase tracking-widest">Attendance</span> · {Number(match.attendance).toLocaleString()}</span>}
          </div>
        )}
      </div>

      {/* ── SECTION TABS ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {sections.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSection(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${section === key
              ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
              : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"}`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── MAIN GRID: content + reviews side panel ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 pb-12">
        <div className="min-w-0 space-y-5">
          {section === "overview" && (
            <OverviewSection
              match={match} meta={meta} stats={stats} analysis={analysis}
              events={events} players={players} sportUpper={sportUpper}
              onJump={setSection}
            />
          )}

          {section === "lineup" && meta.hasLineup && (
            <SectionCard title={meta.hasFormation ? "Lineup & Formation" : "Match Roster"} icon={FiUsers}>
              {match.matchFormationId ? (
                <div className="-mx-6 -mb-5">
                  <MatchDetailsBoard match={match} players={players} canEdit={canEdit} readOnly={isFinished} />
                </div>
              ) : (
                <EmptyBlock icon="📋" title="No lineup recorded" sub="This match has no saved starting XI yet." />
              )}
            </SectionCard>
          )}

          {section === "events" && (
            <SectionCard title="Match Events" icon={FiFlag} count={events.length}>
              <MatchEventsTimeline events={events} players={players} sport={titleSport(match.sportType)} />
            </SectionCard>
          )}

          {section === "stats" && (
            <SectionCard title={`${meta.label} Statistics`} icon={FiBarChart2}>
              <MatchStatsPanel analysis={analysis} sport={sportUpper} />
              {analysis?.keyMoments && (
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Key Moments</p>
                  <p className="text-[13px] text-slate-300 leading-relaxed">{analysis.keyMoments}</p>
                </div>
              )}
            </SectionCard>
          )}

          {/* REVIEW WALL — community match reviews + reactions (persisted via the
              messages API; no groupId so it never reaches the team chat). Always
              visible beneath the active section. */}
          <MatchReviewWall matchId={matchId} fixtureLabel={`${homeName} vs ${awayName}`} />
        </div>

        {/* REVIEWS SIDE PANEL — coach player-performance reviews. Admins/coaches
            get the "Add player review" composer at the top (addSlot); newly
            created reviews are prepended live. Kept SEPARATE from the community
            MatchReviewWall above. */}
        <MatchReviewsPanel
          reviews={reviews}
          players={players}
          coachName={coachName}
          sport={titleSport(match.sportType)}
          addSlot={canEdit ? (
            <AddPlayerReviewForm
              match={match}
              players={players}
              coachId={reviewCoachId}
              alreadyReviewed={reviews.map((r) => r.playerId)}
              onCreated={(row) => setReviews((prev) => [row, ...prev])}
            />
          ) : null}
        />
      </div>
    </div>
  );
}

// ── Overview: a digest that links into the other sections ──────────────────────
function OverviewSection({ match, meta, stats, analysis, events, players, sportUpper, onJump }) {
  const titleSportLocal = titleSport(match.sportType);
  const statEntries = Object.entries(stats || {}).slice(0, 4);
  const topEvents = [...events].sort((a, b) => (Number(a.minute) || 0) - (Number(b.minute) || 0)).slice(0, 5);

  return (
    <>
      {/* summary + tactical */}
      {(match.matchSummary || analysis?.tacticalAnalysis || analysis?.keyMoments) && (
        <SectionCard title="Match Summary" icon={FiActivity}>
          {match.matchSummary && <p className="text-[13px] text-slate-300 leading-relaxed">{match.matchSummary}</p>}
          {analysis?.keyMoments && (
            <p className="text-[13px] text-slate-400 leading-relaxed mt-2"><span className="font-black text-slate-300 uppercase text-[10px] tracking-widest">Key moments · </span>{analysis.keyMoments}</p>
          )}
          {analysis?.tacticalAnalysis && (
            <p className="text-[13px] text-slate-400 leading-relaxed mt-2 italic border-l-2 border-emerald-500/40 pl-3">"{analysis.tacticalAnalysis}"</p>
          )}
        </SectionCard>
      )}

      {/* quick stats preview */}
      {statEntries.length > 0 && (
        <SectionCard title={`${meta.label} Stats`} icon={FiBarChart2} action={<JumpBtn onClick={() => onJump("stats")} label="All stats" />}>
          <MatchStatsPanel analysis={analysis} sport={sportUpper} />
        </SectionCard>
      )}

      {/* recent events preview */}
      <SectionCard title="Events Timeline" icon={FiFlag} count={events.length} action={events.length > 5 ? <JumpBtn onClick={() => onJump("events")} label="All events" /> : null}>
        <MatchEventsTimeline events={topEvents} players={players} sport={titleSportLocal} />
      </SectionCard>
    </>
  );
}

function MetaItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 shrink-0">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</p>
        <p className="text-[12.5px] font-bold text-slate-200 truncate" title={value}>{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, count, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-800 bg-gradient-to-r from-emerald-500/[0.06] to-transparent">
        <div className="flex items-center gap-2.5">
          {Icon && <span className="grid place-items-center w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"><Icon size={14} /></span>}
          <h2 className="text-sm font-black text-slate-100 tracking-tight">{title}</h2>
          {count != null && <span className="text-[10px] font-black text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded-full px-2 py-0.5">{count}</span>}
        </div>
        {action}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function JumpBtn({ onClick, label }) {
  return (
    <button onClick={onClick} className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors">
      {label} →
    </button>
  );
}

function EmptyBlock({ icon, title, sub }) {
  return (
    <div className="py-10 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-slate-300 font-black uppercase tracking-widest text-xs">{title}</p>
      {sub && <p className="text-[12px] text-slate-500 mt-1.5">{sub}</p>}
    </div>
  );
}
