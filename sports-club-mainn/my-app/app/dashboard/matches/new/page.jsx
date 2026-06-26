"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/src/lib/api";
import { resolveSportUpper } from "@/src/lib/playerSport";
import { resolveCompetitionKind, COMPETITION_KIND } from "@/src/components/matches/competitionTypes";
import { FIXTURE_SOURCE_TAG } from "@/src/components/matches/fixtureSource";
import { FORMATION_NAMES } from "@/src/components/matches/formationLayouts";
import { validateKickoff, minKickoffLocal, toNaiveLocalDateTime, toLocalInputValue } from "@/src/components/matches/liveClock";
import { saveDraftMatch } from "@/src/components/matches/draftMatch";
import PlayerFace from "@/src/components/matches/PlayerFace";
import Combobox, { buildVenueOptions } from "@/src/components/matches/Combobox";
import { KNOWN_OUTER_TEAMS } from "@/src/lib/teamDirectory";
import {
  FiAward, FiArrowLeft, FiCheck, FiZap, FiRepeat, FiChevronRight,
  FiStar, FiUsers, FiArrowRight,
} from "react-icons/fi";

// ── Constants ─────────────────────────────────────────────────────────
const DEFAULT_FORMATION = "4-3-3";
const SPORT_BY_ID = { 1: "FOOTBALL", 2: "BASKETBALL", 3: "TENNIS", 4: "VOLLEYBALL", 6: "HANDBALL" };
const BARCA_CREST = "https://crests.football-data.org/81.png";
const BARCA_NAMES = ["barcelona", "barça", "barca", "fc barcelona"];

const unwrapArr = (r) => r?.data || r?.content || (Array.isArray(r) ? r : []);
const isBarca = (name) => BARCA_NAMES.some((n) => String(name || "").toLowerCase().includes(n));

// A fixture is unplayed when it isn't flagged played and has no recorded score.
const isUnplayed = (f) => !(f.played === true || (f.homeScore != null && f.awayScore != null));

export default function NewMatchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Competition deep-link: /dashboard/matches/new?fromComp=<id>&fixId=<id>&
  //   homeName=&homeCrest=&awayName=&awayCrest=&kickoff=<iso>&ko=<0|1>
  // When present we SKIP the type chooser + competition/fixture picking entirely
  // (both teams are already known) and land the user straight on the setup step
  // with the teams PREFILLED but still editable. Barça is always the home side.
  const deepLink = useMemo(() => {
    const fromComp = searchParams.get("fromComp");
    const fixId = searchParams.get("fixId");
    if (!fromComp || !fixId) return null;
    return {
      fromComp,
      fixId,
      homeName: searchParams.get("homeName") || "FC Barcelona",
      homeCrest: searchParams.get("homeCrest") || BARCA_CREST,
      awayName: searchParams.get("awayName") || "Opponent",
      awayCrest: searchParams.get("awayCrest") || "",
      kickoff: searchParams.get("kickoff") || "",
      ko: searchParams.get("ko") === "1",
    };
  }, [searchParams]);

  // mode: null = chooser, "friendly" = free one-off, "official" = real fixture,
  // "deeplink" = arrived from a competition fixture (teams already known). In the
  // deep-link path the opponent is FIXED (taken from the deepLink params) — there
  // is no editable opponent state.
  const [mode, setMode] = useState(null);

  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [opponents, setOpponents] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [customComps, setCustomComps] = useState([]);   // api.competitions.list()
  const [runningComps, setRunningComps] = useState([]); // only comps with unplayed fixtures
  const [compsLoading, setCompsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  // Kickoff error is shown DIRECTLY BELOW the date field (not at the top).
  const [dateErr, setDateErr] = useState("");

  // ── Official path state ──────────────────────────────────────────────
  const [compId, setCompId] = useState("");
  const [compDetail, setCompDetail] = useState(null); // { competition, teams, fixtures }
  const [compLoading, setCompLoading] = useState(false);
  const [pickedFixture, setPickedFixture] = useState(null);

  // ── Shared setup state (formation + kickoff + venue) ────────────────
  const [formation, setFormation] = useState(DEFAULT_FORMATION);
  const [kickoffTime, setKickoffTime] = useState("");
  const [venue, setVenue] = useState("Spotify Camp Nou");

  // ── Friendly path state ──────────────────────────────────────────────
  const [friendlyOpp, setFriendlyOpp] = useState({ name: "", crest: "" });
  // The chosen HOME team for a friendly. Defaults to the Barça football team but
  // the user can pick ANY club team (basketball, handball, tennis…). The match
  // sport follows the chosen team. Empty until teams have loaded + a default set.
  const [homeTeamId, setHomeTeamId] = useState("");

  // Load DB-derived dropdown sources.
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getTeams();
        // FULL club-team list for the friendly home-team picker. FC Barcelona
        // (football) IS included again — it's the default home team — alongside
        // the other club teams (basketball, handball, tennis…). Volleyball is the
        // only sport not modelled here. Sort so the Barça football side leads.
        setTeams(unwrapArr(res)
          .filter(t => SPORT_BY_ID[t.sportId] !== "VOLLEYBALL")
          .map(t => ({ id: t.id, name: t.name, sportType: SPORT_BY_ID[t.sportId] || "FOOTBALL" }))
          .sort((a, b) => {
            const aBarca = a.sportType === "FOOTBALL" && isBarca(a.name);
            const bBarca = b.sportType === "FOOTBALL" && isBarca(b.name);
            if (aBarca !== bBarca) return aBarca ? -1 : 1;
            return a.name.localeCompare(b.name);
          }));
      } catch { /* ignore */ }
      try {
        const lists = await Promise.all(["AVAILABLE", "INJURED", "SUSPENDED", "ABSENT"].map(s => api.getPlayers(s).catch(() => [])));
        const byId = new Map();
        lists.flatMap(unwrapArr).forEach(p => byId.set(p.id, p));
        setPlayers([...byId.values()]);
      } catch { /* ignore */ }
      try {
        const matchList = unwrapArr(await api.getMatches());
        const opp = Object.values(matchList.reduce((acc, m) => {
          if (m.opponentName && !acc[m.opponentName]) {
            acc[m.opponentName] = { name: m.opponentName, crest: m.opponentCrest || "" };
          }
          return acc;
        }, {})).sort((a, b) => a.name.localeCompare(b.name));
        setOpponents(opp);
        setStadiums([...new Set(matchList.map(m => m.venue).filter(v => v && !["Away", "Home", "TBD"].includes(v)))].sort());
      } catch { /* ignore */ }
      try { setCustomComps(unwrapArr(await api.competitions.list())); } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  // Arriving from a competition fixture: jump straight to the setup step with
  // the two teams prefilled (Barça home, opponent from the deep-link), the
  // kickoff seeded, and a knockout/league flag derived from ko=1.
  useEffect(() => {
    if (!deepLink) return;
    setMode("deeplink");
    if (deepLink.kickoff) {
      // Pre-fill the datetime-local input from the kickoff using LOCAL parts
      // (NOT toISOString, which prints UTC and would shift the wall time).
      const local = toLocalInputValue(deepLink.kickoff);
      if (local) setKickoffTime(local);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink]);

  // Football squad with real photos.
  const squad = players.filter(p => resolveSportUpper(p.preferredPosition) === "FOOTBALL");
  // A few faces for the chooser cards (premium touch with PLAYER PHOTOS).
  const heroFaces = squad.slice(0, 5);

  // ── HOME TEAM (friendly path) ────────────────────────────────────────
  // Default the friendly HOME team to the FC Barcelona FOOTBALL side (id 1)
  // once teams load — falling back to the first available club team if the
  // Barça football team isn't present. The match sport follows the chosen team.
  useEffect(() => {
    if (homeTeamId || !teams.length) return;
    const barca = teams.find((t) => t.sportType === "FOOTBALL" && isBarca(t.name));
    setHomeTeamId(String(barca?.id ?? teams[0].id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  // The currently-selected home team object (drives the sport + matchup labels).
  const homeTeam = useMemo(
    () => teams.find((t) => String(t.id) === String(homeTeamId)) || null,
    [teams, homeTeamId]
  );
  const homeSport = homeTeam?.sportType || "FOOTBALL";
  const homeCrestUrl = isBarca(homeTeam?.name) ? BARCA_CREST : "";

  // Opponent options for the combobox: merge clubs we've actually faced (real
  // crests from past matches) with the seeded rival directory (football clubs
  // with real crest URLs). De-duped by name, sorted A→Z. NOT mock data.
  const opponentOptions = useMemo(() => {
    const byName = new Map();
    opponents.forEach(o => { if (o.name) byName.set(o.name, { value: o.name, label: o.name, crest: o.crest || "" }); });
    // Seed rival clubs for the CHOSEN home team's sport (football, basketball…).
    // The combobox still lets the user type any opponent name freely.
    const sportTitle = homeSport.charAt(0) + homeSport.slice(1).toLowerCase(); // FOOTBALL → Football
    Object.values(KNOWN_OUTER_TEAMS)
      .filter(t => t.sport === sportTitle)
      .forEach(t => { if (!byName.has(t.name)) byName.set(t.name, { value: t.name, label: t.name, crest: t.crestUrl || "" }); });
    return [...byName.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [opponents, homeSport]);

  // Venue options: a generous list of real European stadiums (each with a
  // DISTINCT crest where we know the resident club) + any venues already on
  // existing matches. Custom entries are still allowed.
  const venueOptions = useMemo(() => buildVenueOptions(stadiums), [stadiums]);

  // Validate kickoff live and render the message right under the date field.
  const onKickoffChange = (val) => {
    setKickoffTime(val);
    setDateErr(val ? (validateKickoff(val) || "") : "");
  };

  // When the user opens the Official path, load every competition's detail and
  // keep ONLY the ones that are STILL RUNNING **for FC Barcelona** — i.e. that
  // have at least one unplayed fixture INVOLVING BARÇA. Competitions Barça isn't
  // in (or has finished its fixtures in) are hidden, and the "X to play" badge
  // counts only Barça's remaining fixtures (matching the Barça-only list shown
  // after selecting the competition).
  const loadRunningComps = async () => {
    if (runningComps.length || !customComps.length) { setCompsLoading(customComps.length === 0 ? false : compsLoading); }
    setCompsLoading(true);
    try {
      const details = await Promise.all(customComps.map(async (c) => {
        try {
          const d = await api.competitions.get(c.id);
          const detail = d?.competition ? d : (d?.data || d);
          const fixtures = detail?.fixtures || [];
          const cTeams = detail.teams || [];
          const teamName = (id, fallback) => cTeams.find((x) => x.id === id)?.name || fallback;
          const involvesBarca = (f) => isBarca(teamName(f.homeTeamId, f.homeName)) || isBarca(teamName(f.awayTeamId, f.awayName));
          const barcaUnplayed = fixtures.filter((f) => isUnplayed(f) && involvesBarca(f));
          return { comp: c, detail: { competition: detail.competition || detail, teams: cTeams, fixtures }, unplayedCount: barcaUnplayed.length };
        } catch { return null; }
      }));
      const running = details
        .filter(x => x && x.unplayedCount > 0)
        .map(x => ({ ...x.comp, unplayedCount: x.unplayedCount, _detail: x.detail }));
      setRunningComps(running);
    } catch { /* ignore */ }
    finally { setCompsLoading(false); }
  };

  const enterOfficial = () => { setMode("official"); setErrMsg(""); loadRunningComps(); };
  const enterFriendly = () => { setMode("friendly"); setErrMsg(""); };

  const onSelectCompetition = async (id) => {
    setCompId(id);
    setPickedFixture(null);
    setCompDetail(null);
    if (!id) return;
    // We may already have the detail cached from the running-scan.
    const cached = runningComps.find(c => String(c.id) === String(id))?._detail;
    if (cached) { setCompDetail(cached); return; }
    setCompLoading(true);
    try {
      const d = await api.competitions.get(id);
      const detail = d?.competition ? d : (d?.data || d);
      setCompDetail({ competition: detail.competition || detail, teams: detail.teams || [], fixtures: detail.fixtures || [] });
    } catch { setErrMsg("Couldn't load that competition's fixtures."); }
    finally { setCompLoading(false); }
  };

  const fixtureTeam = (teamId, fallbackName) => {
    const t = (compDetail?.teams || []).find((x) => x.id === teamId);
    return { name: t?.name || fallbackName || "Team", crestUrl: t?.crestUrl || "" };
  };

  // ONLY FC Barcelona's unplayed fixtures (the Match Hub is Barça-centric — the
  // user only schedules + sets lineups for Barça's own matches). A fixture
  // qualifies when Barça is the home OR away side; the rest of the league's
  // fixtures are hidden here. Sorted by matchday. The Competitions module still
  // shows the full fixture list — this filter is local to the scheduler.
  const unplayedFixtures = useMemo(() => {
    const involvesBarca = (f) => isBarca(fixtureTeam(f.homeTeamId, f.homeName).name) || isBarca(fixtureTeam(f.awayTeamId, f.awayName).name);
    return (compDetail?.fixtures || [])
      .filter(isUnplayed)
      .filter(involvesBarca)
      .sort((a, b) => (a.matchday ?? 999) - (b.matchday ?? 999));
  }, [compDetail]); // eslint-disable-line react-hooks/exhaustive-deps

  const compKindReal = compDetail ? resolveCompetitionKind(compDetail.competition, compDetail.competition?.name) : null;
  const isKnockoutReal = compKindReal === COMPETITION_KIND.KNOCKOUT;

  // Picked-fixture preview mapped onto our match shape (Barça as home when involved).
  const fixturePreview = useMemo(() => {
    if (!pickedFixture) return null;
    const h = fixtureTeam(pickedFixture.homeTeamId, pickedFixture.homeName);
    const a = fixtureTeam(pickedFixture.awayTeamId, pickedFixture.awayName);
    const barcaIsHome = isBarca(h.name);
    const barcaInvolved = barcaIsHome || isBarca(a.name);
    const opp = barcaIsHome ? a : (isBarca(a.name) ? h : a);
    return {
      barcaInvolved, barcaIsHome,
      homeLabel: barcaInvolved ? "FC Barcelona" : h.name,
      homeCrest: barcaInvolved ? BARCA_CREST : h.crestUrl,
      oppName: opp.name, oppCrest: opp.crestUrl,
    };
  }, [pickedFixture]); // eslint-disable-line react-hooks/exhaustive-deps

  const barcaTeamId = () => (teams.find((t) => isBarca(t.name) && t.sportType === "FOOTBALL")?.id) || 1;

  // NOTHING is persisted here. We stash the assembled match payload + chosen
  // default formation as a DRAFT and hand off to the lineup builder. The match
  // and its lineup are only ever created together, after a valid starting XI is
  // built. Abandoning the builder leaves no lineup-less match behind.
  const goToDraftLineup = (payload) => {
    setSaving(true);
    setErrMsg("");
    saveDraftMatch({ payload, formation });
    router.push(`/dashboard/matches/new/lineup?draft=1`);
  };

  const createFriendly = async () => {
    setErrMsg("");
    if (!friendlyOpp.name.trim()) { setErrMsg("Enter an opponent name."); return; }
    if (!homeTeam) { setErrMsg("Pick a home team."); return; }
    const ke = validateKickoff(kickoffTime);
    if (ke) { setDateErr(ke); return; }
    setDateErr("");
    if (!venue.trim()) { setErrMsg("Enter a venue."); return; }
    // Home team + sport follow the user's pick (any club team across sports).
    const chosenHomeId = Number(homeTeam.id) || barcaTeamId();
    const sportType = homeTeam.sportType || "FOOTBALL";
    goToDraftLineup({
      homeTeamId: chosenHomeId,
      outerTeamId: null,
      opponentName: friendlyOpp.name.trim(),
      opponentCrest: friendlyOpp.crest || null,
      matchType: "FRIENDLY",
      status: "SCHEDULED",
      sportType,
      venue: venue.trim() || "TBD",
      competition: "Friendly Match",
      competitionType: "LEAGUE",
      season: "2025/2026",
      referee: "TBD",
      matchSummary: `${homeTeam.name} vs ${friendlyOpp.name.trim()} — Friendly`,
      notes: "N/A",
      attendance: null,
      kickoffTime: toNaiveLocalDateTime(kickoffTime),
      finishTime: null,
    });
  };

  const createOfficial = async () => {
    setErrMsg("");
    if (!pickedFixture || !fixturePreview) { setErrMsg("Pick a fixture first."); return; }
    const ke = validateKickoff(kickoffTime);
    if (ke) { setDateErr(ke); return; }
    setDateErr("");
    const homeTeamId = barcaTeamId();
    const compName = compDetail?.competition?.name || "Competition";
    const season = compDetail?.competition?.season || "2025/2026";
    goToDraftLineup({
      homeTeamId,
      outerTeamId: null,
      opponentName: fixturePreview.oppName || null,
      opponentCrest: fixturePreview.oppCrest || null,
      matchType: isKnockoutReal ? "CUP" : "LEAGUE",
      status: "SCHEDULED",
      sportType: "FOOTBALL",
      venue: venue.trim() || "TBD",
      competition: compName,
      competitionType: isKnockoutReal ? "KNOCKOUT" : "LEAGUE",
      season,
      referee: "TBD",
      matchSummary: `${fixturePreview.homeLabel} vs ${fixturePreview.oppName} — ${compName}`,
      notes: `${FIXTURE_SOURCE_TAG} comp=${compId} fix=${pickedFixture.id}]`,
      attendance: null,
      kickoffTime: toNaiveLocalDateTime(kickoffTime),
      finishTime: null,
    });
  };

  // Deep-link path → build the draft from the competition fixture. The opponent
  // is FIXED by the fixture (no chooser) — Barça (home) vs the deep-link
  // opponent. The fixture link is carried in `notes` via the FIXTURE_SOURCE_TAG
  // so the played result writes back to that competition fixture. The match is
  // persisted as SCHEDULED (it only goes live at kickoff).
  const createDeepLink = async () => {
    setErrMsg("");
    if (!deepLink) return;
    const oppName = (deepLink.awayName || "").trim();
    if (!oppName) { setErrMsg("This fixture has no opponent."); return; }
    const ke = validateKickoff(kickoffTime);
    if (ke) { setDateErr(ke); return; }
    setDateErr("");
    if (!venue.trim()) { setErrMsg("Enter a venue."); return; }
    const homeTeamId = barcaTeamId();
    const isKo = deepLink.ko;
    const compName = customComps.find((c) => String(c.id) === String(deepLink.fromComp))?.name || "Competition";
    goToDraftLineup({
      homeTeamId,
      outerTeamId: null,
      opponentName: oppName,
      opponentCrest: deepLink.awayCrest || null,
      matchType: isKo ? "CUP" : "LEAGUE",
      status: "SCHEDULED",
      sportType: "FOOTBALL",
      venue: venue.trim() || "TBD",
      competition: compName,
      competitionType: isKo ? "KNOCKOUT" : "LEAGUE",
      season: "2025/2026",
      referee: "TBD",
      matchSummary: `FC Barcelona vs ${oppName} — ${compName}`,
      notes: `${FIXTURE_SOURCE_TAG} comp=${deepLink.fromComp} fix=${deepLink.fixId}]`,
      attendance: null,
      kickoffTime: toNaiveLocalDateTime(kickoffTime),
      finishTime: null,
    });
  };

  const inputCls =
    "bg-slate-900/60 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all w-full placeholder:text-slate-600";

  // A club crest that renders the logo and gracefully shows a shield if the URL
  // is empty or fails to load (fixes "logo doesn't appear" cases).
  const Crest = ({ url, size = 56 }) => {
    const [broken, setBroken] = useState(false);
    const ok = url && String(url).startsWith("http") && !broken;
    return ok
      ? <img src={url} alt="" width={size} height={size} className="object-contain" style={{ width: size, height: size }} onError={() => setBroken(true)} />
      : <span style={{ fontSize: size * 0.7, lineHeight: 1 }} role="img" aria-label="club crest">🛡️</span>;
  };

  const Field = ({ label, children, full }) => (
    <div className={`flex flex-col gap-2 ${full ? "md:col-span-2" : ""}`}>
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</label>
      {children}
    </div>
  );

  const Stepper = ({ steps, active }) => (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-2 ${i <= active ? "text-emerald-400" : "text-slate-600"}`}>
            <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black ${i < active ? "bg-emerald-600 border-emerald-600 text-white" : i === active ? "border-emerald-500 text-emerald-400" : "border-slate-700 text-slate-600"}`}>
              {i < active ? "✓" : i + 1}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-px ${i < active ? "bg-emerald-700" : "bg-slate-800"}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="w-full min-h-full bg-slate-950 fade-in">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a]">
        <div className="absolute -right-10 -top-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-16 w-72 h-72 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-10 py-8">
          <button onClick={() => ((mode && mode !== "deeplink") ? setMode(null) : router.push("/dashboard/matches"))}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-[11px] font-bold uppercase tracking-widest mb-5 transition-colors">
            <FiArrowLeft /> {(mode && mode !== "deeplink") ? "Choose a different type" : "Back to Match Hub"}
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-lg">
              <FiAward size={26} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-black text-white text-2xl md:text-3xl uppercase tracking-tight leading-none">Schedule Match</h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.22em] mt-2">FC Barcelona · MSCMS · New Fixture</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-32 text-slate-500 font-black uppercase text-[11px] tracking-widest animate-pulse">Loading squad &amp; fixtures…</div>
      ) : mode === null ? (
        /* ── TYPE CHOOSER: Friendly vs Official ─────────────────────── */
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-12">
          <p className="text-center text-slate-400 text-sm mb-2">How would you like to set up this match?</p>
          <p className="text-center text-slate-600 text-[11px] mb-9">Either way you'll set the kickoff, then build a starting lineup before it's saved.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FRIENDLY */}
            <button onClick={enterFriendly}
              className="group relative text-left rounded-3xl border border-slate-800 bg-slate-900/40 p-7 overflow-hidden hover:border-sky-500/60 hover:bg-sky-500/[0.04] transition-all shadow-xl">
              <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-sky-500/10 blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300 mb-4">
                  <FiUsers size={22} />
                </div>
                <h2 className="text-lg font-black text-white mb-1.5">Friendly Match</h2>
                <p className="text-[13px] text-slate-400 leading-relaxed mb-4">A one-off friendly you set up freely — pick the opponent, the venue and the date &amp; time. No competition table involved.</p>
                {/* player photos */}
                <div className="flex items-center -space-x-2 mb-4">
                  {heroFaces.map(p => (
                    <PlayerFace key={p.id} photoUrl={p.photoUrl} name={`${p.firstName} ${p.lastName}`} sport="Football" size={32} rounded="rounded-full" className="ring-2 ring-slate-900" />
                  ))}
                  {squad.length > heroFaces.length && <span className="pl-4 text-[10px] font-black text-slate-500">+{squad.length - heroFaces.length} squad</span>}
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-sky-400 group-hover:gap-2.5 transition-all">Set up a friendly <FiChevronRight /></span>
              </div>
            </button>

            {/* OFFICIAL */}
            <button onClick={enterOfficial}
              className="group relative text-left rounded-3xl border border-slate-800 bg-slate-900/40 p-7 overflow-hidden hover:border-emerald-500/60 hover:bg-emerald-500/[0.04] transition-all shadow-xl">
              <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 mb-4">
                  <FiStar size={22} />
                </div>
                <h2 className="text-lg font-black text-white mb-1.5">Official Match</h2>
                <p className="text-[13px] text-slate-400 leading-relaxed mb-4">Pick a real fixture from a competition that's still running. We pre-fill the opponent, crest and competition — the final score writes back to the table.</p>
                <div className="flex items-center gap-2 mb-4">
                  <img src={BARCA_CREST} alt="" className="w-8 h-8 object-contain" />
                  <span className="text-slate-600 font-black text-[10px]">VS</span>
                  <span className="text-2xl">🛡️</span>
                  <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-emerald-400/70">real fixtures</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-400 group-hover:gap-2.5 transition-all">Pick a fixture <FiChevronRight /></span>
              </div>
            </button>
          </div>
        </div>
      ) : mode === "friendly" ? (
        /* ── FRIENDLY PATH ──────────────────────────────────────────── */
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 pb-28">
          <Stepper steps={["Type", "Details", "Lineup"]} active={1} />
          {errMsg && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{errMsg}</div>}

          {/* VS preview with crests (both logos render reliably with a graceful
              shield fallback if a crest URL ever fails to load). The HOME side
              follows the chosen club team. */}
          <div className="mb-7 flex items-center justify-center gap-10 rounded-3xl border border-slate-800 bg-slate-900/40 py-7">
            <div className="flex flex-col items-center gap-2 w-40">
              <Crest url={homeCrestUrl} size={56} />
              <span className="text-sm font-black text-slate-200 text-center truncate w-full">{homeTeam?.name || "FC Barcelona"}</span>
            </div>
            <span className="text-slate-600 font-black">VS</span>
            <div className="flex flex-col items-center gap-2 w-40">
              <Crest url={friendlyOpp.crest} size={56} />
              <span className="text-sm font-black text-slate-200 text-center truncate w-full">{friendlyOpp.name || "Opponent"}</span>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 md:p-8 shadow-xl">
            <h2 className="text-[11px] font-black text-sky-400 uppercase tracking-[0.25em] mb-6">Friendly Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Home Team *">
                <select className={inputCls} value={homeTeamId} onChange={(e) => { setHomeTeamId(e.target.value); setFriendlyOpp({ name: "", crest: "" }); }}>
                  {teams.length === 0 && <option value="" className="bg-slate-950">Loading teams…</option>}
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-950">{t.name} · {t.sportType.charAt(0) + t.sportType.slice(1).toLowerCase()}</option>
                  ))}
                </select>
                <span className="text-[9px] text-slate-600">Any club team — football, basketball, handball, tennis… The match sport follows your pick.</span>
              </Field>
              <Field label="Opponent *">
                <Combobox
                  value={friendlyOpp.name}
                  options={opponentOptions}
                  placeholder="Pick or type a club — e.g. Manchester City"
                  onChange={(name, opt) => {
                    const o = opt || opponentOptions.find(x => x.value === name);
                    setFriendlyOpp({ name, crest: o?.crest || (name === friendlyOpp.name ? friendlyOpp.crest : "") });
                  }}
                />
                <span className="text-[9px] text-slate-600">Pick a club from the list (its crest fills in), or type any other club.</span>
              </Field>
              <Field label="Kickoff Date &amp; Time *">
                <input type="datetime-local" className={inputCls} style={{ colorScheme: "dark" }} min={minKickoffLocal()} value={kickoffTime} onChange={e => onKickoffChange(e.target.value)} />
                {dateErr
                  ? <span className="text-[11px] font-bold text-red-400">{dateErr}</span>
                  : <span className="text-[9px] text-slate-600">Must be at least 5 minutes from now.</span>}
              </Field>
              <Field label="Venue *">
                <Combobox
                  value={venue}
                  options={venueOptions}
                  fallbackIcon="🏟️"
                  placeholder="Pick or type a stadium — e.g. Spotify Camp Nou"
                  onChange={(v) => setVenue(v)}
                />
              </Field>
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-sky-500/30 bg-sky-500/[0.06] px-3 py-2.5">
              <span className="mt-0.5 text-sky-400"><FiRepeat /></span>
              <p className="text-[11px] text-slate-400 leading-snug">A friendly can finish drawn — no extra time or penalties. It auto-goes live when the kickoff time arrives, so you'll set the lineup in the next step before it's saved.</p>
            </div>
          </section>

          <ActionBar
            saving={saving}
            disabled={saving || !homeTeamId || !friendlyOpp.name.trim() || !kickoffTime || !venue.trim()}
            onCancel={() => router.push("/dashboard/matches")}
            onContinue={createFriendly}
            label="Continue to Lineup"
            hint={friendlyOpp.name ? `${homeTeam?.name || "FC Barcelona"} vs ${friendlyOpp.name}` : "Pick the home team, opponent, date & venue"}
          />
        </div>
      ) : mode === "deeplink" ? (
        /* ── COMPETITION DEEP-LINK PATH ─────────────────────────────────
           Teams already known from the competition fixture — skip the type
           chooser AND the competition/fixture pickers. The opponent is FIXED by
           the fixture, so there is NO opponent chooser: the matchup is shown as
           a LOCKED, read-only VS header (Barça home vs the fixed opponent). The
           user only sets kickoff, venue, formation and lineup. */
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 pb-28">
          <Stepper steps={["Fixture", "Setup", "Lineup"]} active={1} />
          {errMsg && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{errMsg}</div>}

          {/* LOCKED matchup — opponent is fixed by the competition fixture and
              cannot be changed here. */}
          <div className="relative mb-7 flex items-center justify-center gap-10 rounded-3xl border border-emerald-500/20 bg-slate-900/40 py-7">
            <span className="absolute top-3 right-4 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/70">
              🔒 Fixed fixture
            </span>
            <div className="flex flex-col items-center gap-2 w-40">
              <Crest url={deepLink?.homeCrest || BARCA_CREST} size={56} />
              <span className="text-sm font-black text-slate-200 text-center truncate w-full">{deepLink?.homeName || "FC Barcelona"}</span>
            </div>
            <span className="text-slate-600 font-black">VS</span>
            <div className="flex flex-col items-center gap-2 w-40">
              <Crest url={deepLink?.awayCrest} size={56} />
              <span className="text-sm font-black text-slate-200 text-center truncate w-full">{deepLink?.awayName || "Opponent"}</span>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 md:p-8 shadow-xl">
            <h2 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-1">Set Up the Match</h2>
            <p className="text-[11px] text-slate-500 mb-6">The opponent is set by the competition fixture and can't be changed here. Just set the kickoff, venue, formation and lineup.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Formation">
                <select className={inputCls} value={formation} onChange={(e) => setFormation(e.target.value)}>
                  {FORMATION_NAMES.map((f) => <option key={f} value={f} className="bg-slate-950">{f}</option>)}
                </select>
              </Field>
              <Field label="Kickoff Date &amp; Time *">
                <input type="datetime-local" className={inputCls} style={{ colorScheme: "dark" }} min={minKickoffLocal()} value={kickoffTime} onChange={(e) => onKickoffChange(e.target.value)} />
                {dateErr
                  ? <span className="text-[11px] font-bold text-red-400">{dateErr}</span>
                  : <span className="text-[9px] text-slate-600">Must be at least 5 minutes from now.</span>}
              </Field>
              <Field label="Venue *" full>
                <Combobox
                  value={venue}
                  options={venueOptions}
                  fallbackIcon="🏟️"
                  placeholder="Pick or type a stadium — e.g. Spotify Camp Nou"
                  onChange={(v) => setVenue(v)}
                />
              </Field>
            </div>

            <div className={`mt-5 flex items-start gap-2 rounded-xl border px-3 py-2.5 ${deepLink?.ko ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-sky-500/30 bg-sky-500/[0.06]"}`}>
              <span className={`mt-0.5 ${deepLink?.ko ? "text-amber-400" : "text-sky-400"}`}>{deepLink?.ko ? <FiZap /> : <FiRepeat />}</span>
              <div>
                <p className={`text-[11px] font-black uppercase tracking-widest ${deepLink?.ko ? "text-amber-300" : "text-sky-300"}`}>{deepLink?.ko ? "Knockout — a winner is required" : "League — a draw is a valid result"}</p>
                <p className="text-[10px] text-slate-500 normal-case tracking-normal leading-snug mt-0.5">{deepLink?.ko ? "If level at full time the live panel offers extra time, then penalties." : "No extra time or penalties — it can finish drawn."} It stays scheduled until kickoff, then auto-goes-live. The final score writes back to this competition's fixture.</p>
              </div>
            </div>
          </section>

          <ActionBar
            saving={saving}
            disabled={saving || !deepLink?.awayName || !kickoffTime || !venue.trim()}
            onCancel={() => router.push("/dashboard/matches")}
            onContinue={createDeepLink}
            label="Continue to Lineup"
            hint={deepLink?.awayName ? `FC Barcelona vs ${deepLink.awayName}` : "Set the kickoff & venue"}
          />
        </div>
      ) : (
        /* ── OFFICIAL PATH (running competitions only) ──────────────── */
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 pb-28">
          <Stepper steps={["Type", "Fixture", "Lineup"]} active={1} />
          {errMsg && <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300">{errMsg}</div>}

          {/* Step A — running competition */}
          <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 md:p-8 shadow-xl mb-6">
            <h2 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-1">Choose a Running Competition</h2>
            <p className="text-[11px] text-slate-500 mb-5">Only competitions with fixtures still to play are shown. Finished ones are hidden.</p>
            {compsLoading ? (
              <p className="text-[12px] text-slate-500 italic animate-pulse">Scanning competitions for unplayed fixtures…</p>
            ) : runningComps.length === 0 ? (
              <p className="text-[13px] text-slate-500">No running competitions with unplayed fixtures. Create or import one in the Competitions module, or set up a <button onClick={enterFriendly} className="text-sky-400 font-bold underline">friendly match</button> instead.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {runningComps.map((c) => {
                  const kind = resolveCompetitionKind(c, c.name);
                  const active = String(compId) === String(c.id);
                  return (
                    <button key={c.id} onClick={() => onSelectCompetition(c.id)}
                      className={`text-left rounded-2xl border px-4 py-3.5 transition-all ${active ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
                      <p className="text-sm font-black text-slate-100 truncate">{c.name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${kind === "KNOCKOUT" ? "text-amber-300 border-amber-500/40 bg-amber-500/10" : "text-sky-300 border-sky-500/40 bg-sky-500/10"}`}>{kind === "KNOCKOUT" ? "Knockout" : "League"}</span>
                        {c.season && <span className="text-[10px] text-slate-500">{c.season}</span>}
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400/80">{c.unplayedCount} to play</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Step B — fixture */}
          {compId && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 md:p-8 shadow-xl mb-6">
              <h2 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-5">Pick an Unplayed Fixture</h2>
              {compLoading ? (
                <p className="text-[12px] text-slate-500 italic animate-pulse">Loading fixtures…</p>
              ) : unplayedFixtures.length === 0 ? (
                <p className="text-[13px] text-slate-500">No unplayed fixtures left in this competition.</p>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {unplayedFixtures.slice(0, 60).map((f) => {
                    const h = fixtureTeam(f.homeTeamId, f.homeName);
                    const a = fixtureTeam(f.awayTeamId, f.awayName);
                    const barca = isBarca(h.name) || isBarca(a.name);
                    const active = pickedFixture?.id === f.id;
                    return (
                      <button key={f.id} onClick={() => { setPickedFixture(f); setErrMsg(""); }}
                        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${active ? "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/30" : barca ? "border-emerald-500/20 bg-emerald-500/[0.03] hover:border-emerald-500/40" : "border-slate-800 bg-slate-950/40 hover:border-slate-700"}`}>
                        {f.matchday != null && <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-500 w-10 text-center">{f.round && f.round !== "REGULAR_SEASON" && f.round !== "" ? f.round.replace(/_/g, " ").slice(0, 5) : `MD${f.matchday}`}</span>}
                        <div className="flex items-center gap-2 flex-1 justify-end min-w-0 text-right">
                          <span className={`text-xs truncate ${isBarca(h.name) ? "font-black text-emerald-300" : "font-bold text-slate-200"}`}>{h.name}</span>
                          {h.crestUrl ? <img src={h.crestUrl} alt="" className="w-6 h-6 object-contain shrink-0" /> : <span className="text-base shrink-0">🛡️</span>}
                        </div>
                        <span className="shrink-0 text-[10px] font-black text-slate-600 px-1">VS</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {a.crestUrl ? <img src={a.crestUrl} alt="" className="w-6 h-6 object-contain shrink-0" /> : <span className="text-base shrink-0">🛡️</span>}
                          <span className={`text-xs truncate ${isBarca(a.name) ? "font-black text-emerald-300" : "font-bold text-slate-200"}`}>{a.name}</span>
                        </div>
                        {active && <FiCheck className="text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Step C — formation + kickoff */}
          {pickedFixture && fixturePreview && (
            <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-6 md:p-8 shadow-xl">
              <h2 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.25em] mb-5">Set Up the Match</h2>
              <div className="mb-7 flex items-center justify-center gap-10 rounded-3xl border border-slate-800 bg-slate-950/40 py-7">
                <div className="flex flex-col items-center gap-2 w-40">
                  <Crest url={fixturePreview.homeCrest} size={56} />
                  <span className="text-sm font-black text-slate-200 text-center truncate w-full">{fixturePreview.homeLabel}</span>
                </div>
                <span className="text-slate-600 font-black">VS</span>
                <div className="flex flex-col items-center gap-2 w-40">
                  <Crest url={fixturePreview.oppCrest} size={56} />
                  <span className="text-sm font-black text-slate-200 text-center truncate w-full">{fixturePreview.oppName}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Formation">
                  <select className={inputCls} value={formation} onChange={(e) => setFormation(e.target.value)}>
                    {FORMATION_NAMES.map((f) => <option key={f} value={f} className="bg-slate-950">{f}</option>)}
                  </select>
                </Field>
                <Field label="Kickoff Date &amp; Time *">
                  <input type="datetime-local" className={inputCls} style={{ colorScheme: "dark" }} min={minKickoffLocal()} value={kickoffTime} onChange={(e) => onKickoffChange(e.target.value)} />
                  {dateErr
                    ? <span className="text-[11px] font-bold text-red-400">{dateErr}</span>
                    : <span className="text-[9px] text-slate-600">Must be at least 5 minutes from now.</span>}
                </Field>
                <Field label="Venue" full>
                  <Combobox
                    value={venue}
                    options={venueOptions}
                    fallbackIcon="🏟️"
                    placeholder="Pick or type a stadium — e.g. Spotify Camp Nou"
                    onChange={(v) => setVenue(v)}
                  />
                </Field>
              </div>

              <div className={`mt-5 flex items-start gap-2 rounded-xl border px-3 py-2.5 ${isKnockoutReal ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-sky-500/30 bg-sky-500/[0.06]"}`}>
                <span className={`mt-0.5 ${isKnockoutReal ? "text-amber-400" : "text-sky-400"}`}>{isKnockoutReal ? <FiZap /> : <FiRepeat />}</span>
                <div>
                  <p className={`text-[11px] font-black uppercase tracking-widest ${isKnockoutReal ? "text-amber-300" : "text-sky-300"}`}>{isKnockoutReal ? "Knockout — a winner is required" : "League — a draw is a valid result"}</p>
                  <p className="text-[10px] text-slate-500 normal-case tracking-normal leading-snug mt-0.5">{isKnockoutReal ? "If level at full time the live panel offers extra time, then penalties." : "No extra time or penalties — it can finish drawn."} The final score writes back to <span className="font-bold text-slate-400">{compDetail?.competition?.name}</span>.</p>
                </div>
              </div>
            </section>
          )}

          <ActionBar
            saving={saving}
            disabled={saving || !pickedFixture || !kickoffTime}
            onCancel={() => router.push("/dashboard/matches")}
            onContinue={createOfficial}
            label="Continue to Lineup"
            hint={pickedFixture ? `${fixturePreview?.homeLabel} vs ${fixturePreview?.oppName}` : "Pick a competition, then a fixture"}
          />
        </div>
      )}
    </div>
  );
}

// Sticky bottom action bar shared by both paths. "Continue to Lineup" makes it
// explicit that creation isn't finished until the (mandatory) lineup is built.
function ActionBar({ saving, disabled, onCancel, onContinue, label, hint }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-4 flex gap-4 items-center">
        <p className="text-[11px] text-slate-500 hidden sm:block">{hint}</p>
        <button onClick={onCancel} disabled={saving}
          className="ml-auto px-6 py-3 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50">Cancel</button>
        <button onClick={onContinue} disabled={disabled}
          className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          {saving ? "Creating…" : <>{label} <FiArrowRight /></>}
        </button>
      </div>
    </div>
  );
}
