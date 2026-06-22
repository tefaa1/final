"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiList,
  FiGrid,
  FiAward,
  FiCheckCircle,
  FiTrash2,
  FiLock,
} from "react-icons/fi";
import {
  getCompetition,
  recordResult,
  deleteCompetition,
  computeStandings,
  detectFormat,
  isPlayed,
  isFinished,
  getChampion,
  isKnockoutRound,
  isLeaguePhaseRound,
} from "./store";
import { TeamCrest } from "./TeamPicker";
import CompCrest from "./CompCrest";
import StandingsTable from "./StandingsTable";
import MatchList from "./MatchList";
import Bracket from "./Bracket";
import ClLeaguePhase from "./ClLeaguePhase";
import CollapsibleSection from "./CollapsibleSection";
import ConfirmDialog from "./ConfirmDialog";
import RulesCard from "./RulesCard";

function Section({ title, children, className = "" }) {
  return (
    <section className={`bg-slate-900/50 rounded-2xl border border-slate-800 p-5 ${className}`}>
      <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 mb-4 flex items-center gap-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function TabBtn({ active, onClick, icon, children, locked = false, lockTitle }) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      title={locked ? lockTitle : undefined}
      aria-disabled={locked}
      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${
        locked
          ? "bg-slate-900/40 text-slate-600 border-slate-800 cursor-not-allowed"
          : active
          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
          : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700"
      }`}
    >
      {locked ? <FiLock size={13} /> : icon}
      {children}
    </button>
  );
}

function ChampionBanner({ champion }) {
  if (!champion) return null;
  return (
    <div className="mb-6 flex items-center gap-3 bg-gradient-to-r from-amber-500/20 via-amber-500/5 to-transparent border border-amber-500/40 rounded-2xl px-5 py-4">
      <span className="text-3xl">🏆</span>
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/80 font-black">Champion</p>
        <p className="text-lg font-black text-amber-100 flex items-center gap-2 mt-0.5">
          <TeamCrest team={champion} size={22} />
          {champion.name}
        </p>
      </div>
    </div>
  );
}

export default function CompetitionDetail({ compId, routed = false }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [tab, setTab] = useState("matches");
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refresh = async () => {
    const d = await getCompetition(compId);
    setData(d);
    setLoading(false);
  };

  useEffect(() => {
    setRole((localStorage.getItem("user_role") || "").toLowerCase());
    setLoading(true);
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compId]);

  // `canEdit` = is this user an admin at all (gates the Delete button, which is
  // always allowed). Result EDITING is a stricter capability: it is locked once
  // the competition is FINISHED (every fixture played). See `canEditResults`
  // below — that is what we hand to every MatchList. A completed competition is
  // READ-ONLY: final scores show with a "Completed" badge, no inputs, no edits.
  const canEdit = role === "admin";
  const teams = data?.teams || [];
  const fixtures = data?.fixtures || [];
  const competition = data?.competition;
  const fmt = useMemo(() => detectFormat(competition), [competition]);

  // Matches/league section is FIRST by default. LEAGUE uses the "matches" tab;
  // the Champions League uses "league" (its League-phase tab, matches-first).
  useEffect(() => {
    setTab(fmt === "CL" ? "league" : "matches");
  }, [fmt]);

  const leagueRows = useMemo(() => computeStandings(teams, fixtures), [teams, fixtures]);
  const finished = isFinished(fixtures);

  // RESULT EDITING is allowed ONLY for an admin on an ONGOING competition. Once
  // every fixture is played (`finished`), results are LOCKED read-only across the
  // league view, the CL league phase and the knockout. Deleting (admin) stays
  // allowed — that is gated on `canEdit`, not this flag.
  const canEditResults = canEdit && !finished;
  const champion = useMemo(
    () => getChampion({ competition, teams, fixtures }),
    [competition, teams, fixtures]
  );

  // CL league-phase fixtures vs. knockout fixtures. We match on ALL league-phase
  // aliases (LEAGUE_STAGE / LEAGUE_PHASE / REGULAR_SEASON) so the 144 imported
  // league-phase matches — and any freshly generated ones — always show up.
  const leagueStageFixtures = useMemo(
    () => fixtures.filter((m) => isLeaguePhaseRound(m.round)),
    [fixtures]
  );
  const koFixtures = useMemo(
    () => fixtures.filter((m) => isKnockoutRound(m.round)),
    [fixtures]
  );

  // CL knockout unlocks only once EVERY league-phase fixture has been played.
  const leaguePhaseDone = useMemo(
    () => leagueStageFixtures.length > 0 && leagueStageFixtures.every(isPlayed),
    [leagueStageFixtures]
  );
  const LOCK_MSG = "Finish the league phase first.";

  // If the user is on the bracket tab and it locks again (e.g. a result was
  // cleared), bounce them back to the league phase.
  useEffect(() => {
    if (fmt === "CL" && tab === "bracket" && !leaguePhaseDone) setTab("league");
  }, [fmt, tab, leaguePhaseDone]);

  // Record a result, then REFETCH the whole competition so standings + fixtures
  // recompute immediately — reliable for BOTH La Liga and the Champions League.
  // A redeploy can make the backend 500 once; retry a single time before the
  // refetch so a transient blip never leaves the table stale.
  const onRecord = async (fixtureId, hs, as, playedAt) => {
    try {
      await recordResult(compId, fixtureId, hs, as, playedAt);
    } catch (e) {
      await recordResult(compId, fixtureId, hs, as, playedAt);
    }
    await refresh();
  };

  const goBack = () => router.push("/dashboard/competitions");

  const doDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteCompetition(compId);
      goBack();
    } catch (e) {
      setDeleting(false);
      setConfirmOpen(false);
      window.alert("Couldn't delete the competition. Check the backend and try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-black italic animate-pulse">LOADING…</div>;
  }
  if (!data || !competition) {
    return (
      <div className="text-center py-20 text-slate-600 italic">
        Competition not found.
        <button onClick={goBack} className="block mx-auto mt-4 text-emerald-400 text-xs font-black uppercase">
          ← Back
        </button>
      </div>
    );
  }

  const c = competition;
  // ALWAYS show the human name in the header/banner — never the raw numeric id.
  // Fall back to a format label only if the name is genuinely missing.
  const displayName =
    (c.name && String(c.name).trim()) ||
    (fmt === "LEAGUE" ? "League competition" : "Knockout competition");
  const playedCount = fixtures.filter(isPlayed).length;
  const progress = fixtures.length ? Math.round((playedCount / fixtures.length) * 100) : 0;
  const badgeLabel = fmt === "LEAGUE" ? "League" : "Knockout";
  const sport = "Football";

  return (
    <div className="fade-in">
      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${displayName}?`}
        message={`This permanently removes “${displayName} · ${c.season}”, its teams and all fixtures. This can't be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => !deleting && setConfirmOpen(false)}
      />

      <button
        onClick={goBack}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-emerald-300 mb-5 transition-colors"
      >
        <FiArrowLeft /> All competitions
      </button>

      {/* Premium gradient banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.16),transparent_50%)]" />
        <div className="relative px-6 py-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <CompCrest competition={c} size={48} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] border ${
                    fmt === "LEAGUE"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  }`}
                >
                  {badgeLabel}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] bg-slate-800/70 text-slate-300 border border-slate-700">
                  {c.season}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] bg-slate-800/70 text-slate-300 border border-slate-700">
                  {sport}
                </span>
                {finished && (
                  <span
                    title="This competition is complete — results are read-only."
                    className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1"
                  >
                    <FiCheckCircle size={11} /> Completed
                  </span>
                )}
                {finished && (
                  <span
                    title="Final results are locked — no further editing."
                    className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] bg-slate-800/70 text-slate-300 border border-slate-600 flex items-center gap-1"
                  >
                    <FiLock size={10} /> Read-only
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{displayName}</h1>
              <p className="text-[11px] font-bold text-slate-300/80 uppercase tracking-[0.22em] mt-1">
                {teams.length} teams · {playedCount}/{fixtures.length} matches played
              </p>
              {fixtures.length > 0 && (
                <div className="mt-3 w-56 max-w-full">
                  <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${finished ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 shrink-0">
            {canEdit && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-2 border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white hover:border-rose-400 transition-all active:scale-95 disabled:opacity-60"
                title="Delete competition"
              >
                <FiTrash2 size={13} /> {deleting ? "Deleting…" : "Delete"}
              </button>
            )}
            <div className="flex -space-x-1.5">
              {teams.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  className="w-10 h-10 rounded-full bg-slate-950/70 border border-slate-700 flex items-center justify-center"
                  title={t.name}
                >
                  <TeamCrest team={t} size={24} />
                </div>
              ))}
              {teams.length > 8 && (
                <div className="w-10 h-10 rounded-full bg-slate-950/70 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400">
                  +{teams.length - 8}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {finished && <ChampionBanner champion={champion} />}

      {/* ─────────── LEAGUE (La Liga & user leagues) ─────────── */}
      {fmt === "LEAGUE" && (
        <div className="space-y-6">
          {/* Tabs — MATCHES first */}
          <div className="flex flex-wrap gap-2">
            <TabBtn active={tab === "matches"} onClick={() => setTab("matches")} icon={<FiList />}>Matches</TabBtn>
            <TabBtn active={tab === "table"} onClick={() => setTab("table")} icon={<FiAward />}>Standings</TabBtn>
          </div>

          {tab === "matches" && (
            <Section title={<><FiList className="text-emerald-400" /> Matches &amp; results</>}>
              <MatchList
                teams={teams}
                fixtures={fixtures}
                canEdit={canEditResults}
                onRecord={onRecord}
                finished={finished}
                compId={compId}
              />
            </Section>
          )}

          {tab === "table" && (
            <CollapsibleSection title={<><FiAward className="text-amber-400" /> Standings</>} defaultOpen>
              <StandingsTable rows={leagueRows} championTop={finished} />
            </CollapsibleSection>
          )}

          <RulesCard competition={c} />
        </div>
      )}

      {/* ─────────── CHAMPIONS LEAGUE — EXACTLY TWO TABS ─────────── */}
      {fmt === "CL" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <TabBtn active={tab === "league"} onClick={() => setTab("league")} icon={<FiAward />}>
              League phase
            </TabBtn>
            <TabBtn
              active={tab === "bracket"}
              onClick={() => setTab("bracket")}
              icon={<FiGrid />}
              locked={!leaguePhaseDone}
              lockTitle={LOCK_MSG}
            >
              Knockout bracket
            </TabBtn>
          </div>

          {/* LEAGUE PHASE TAB: matches FIRST, then standings, then rules */}
          {tab === "league" && (
            <div className="space-y-6">
              <Section title={<><FiList className="text-emerald-400" /> League-phase matches</>}>
                <MatchList
                  teams={teams}
                  fixtures={leagueStageFixtures}
                  canEdit={canEditResults}
                  onRecord={onRecord}
                  finished={finished}
                  compId={compId}
                />
              </Section>

              <ClLeaguePhase teams={teams} fixtures={fixtures} />

              {!leaguePhaseDone && (
                <p className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <FiLock size={12} /> {LOCK_MSG} The knockout bracket unlocks once every league-phase match is played.
                </p>
              )}

              <RulesCard competition={c} />
            </div>
          )}

          {/* KNOCKOUT BRACKET TAB — only reachable once the league phase is done */}
          {tab === "bracket" && leaguePhaseDone && (
            <div className="space-y-6">
              <Section title={<><FiGrid className="text-blue-400" /> Knockout bracket</>}>
                <Bracket teams={teams} fixtures={koFixtures} />
              </Section>
              <Section title={<><FiList className="text-emerald-400" /> Knockout matches</>}>
                <MatchList
                  teams={teams}
                  fixtures={koFixtures}
                  canEdit={canEditResults}
                  onRecord={onRecord}
                  requireWinner
                  finished={finished}
                  compId={compId}
                />
              </Section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
