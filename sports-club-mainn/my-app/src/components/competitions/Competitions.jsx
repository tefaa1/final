"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiPlus,
  FiTrash2,
  FiChevronRight,
  FiUsers,
  FiCheckCircle,
  FiAward,
} from "react-icons/fi";
import {
  listCompetitions,
  getCompetition,
  deleteCompetition,
  detectFormat,
  isPlayed,
  isFinished,
  getChampion,
} from "./store";
import { TeamCrest } from "./TeamPicker";
import CompCrest from "./CompCrest";
import ConfirmDialog from "./ConfirmDialog";

// Per-format badge accent. The label is the competition's real name, this only
// drives the colour + gradient of the card.
const FMT_BADGE = {
  LEAGUE: {
    label: "League",
    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    grad: "from-emerald-600/20 via-slate-900 to-[#0a1a3f]/60",
  },
  CL: {
    label: "Knockout",
    cls: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    grad: "from-blue-600/20 via-slate-900 to-[#0a1a3f]/60",
  },
};

// ── A single competition card (real DB competition) ──────────────────────────
function CompetitionCard({ comp, meta, canEdit, onOpen, onDelete, busy }) {
  const ct = meta || {
    teams: 0,
    played: 0,
    total: 0,
    crests: [],
    fmt: "LEAGUE",
    finished: false,
    champion: null,
  };
  const badge = FMT_BADGE[ct.fmt] || FMT_BADGE.LEAGUE;
  const progress = ct.total ? Math.round((ct.played / ct.total) * 100) : 0;
  return (
    <button
      onClick={onOpen}
      className="group relative text-left overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-emerald-500/40 transition-all"
    >
      <div className={`absolute inset-0 opacity-70 bg-gradient-to-br ${badge.grad}`} />
      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] border ${badge.cls}`}>
            {badge.label}
          </span>
          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-slate-800/70 text-slate-300 border border-slate-700">
            {comp.season}
          </span>
          {ct.finished && (
            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.2em] bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <FiCheckCircle size={10} /> Finished
            </span>
          )}
        </div>

        {/* logo + name */}
        <div className="flex items-center gap-3 mb-1.5 pr-6">
          <CompCrest competition={comp} size={32} />
          <h3 className="text-lg font-black text-white tracking-tight min-w-0">{comp.name}</h3>
        </div>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <FiUsers size={11} /> {ct.teams} teams · {ct.played}/{ct.total} played
        </p>

        {/* champion banner when finished */}
        {ct.finished && ct.champion && (
          <div className="mt-3 flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-transparent border border-amber-500/30 rounded-lg px-3 py-2">
            <span className="text-lg">🏆</span>
            <span className="flex items-center gap-1.5 min-w-0">
              <TeamCrest team={ct.champion} size={16} />
              <span className="text-xs font-black text-amber-200 truncate">{ct.champion.name}</span>
            </span>
          </div>
        )}

        {/* crest strip (only when not finished — finished shows the champion) */}
        {ct.crests.length > 0 && !ct.finished && (
          <div className="flex -space-x-1.5 mt-3">
            {ct.crests.map((t) => (
              <div
                key={t.id}
                className="w-7 h-7 rounded-full bg-slate-950/70 border border-slate-700 flex items-center justify-center"
                title={t.name}
              >
                <TeamCrest team={t} size={16} />
              </div>
            ))}
          </div>
        )}

        {/* progress */}
        {ct.total > 0 && (
          <div className="mt-3 h-1 rounded-full bg-slate-800/80 overflow-hidden">
            <div
              className={`h-full rounded-full ${ct.finished ? "bg-gradient-to-r from-amber-400 to-amber-500" : "bg-gradient-to-r from-emerald-400 to-emerald-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-center gap-1 mt-4 text-emerald-300/80 text-xs font-black uppercase tracking-wider">
          Open <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
        </div>

        {canEdit && (
          <span
            onClick={onDelete}
            className={`absolute top-4 right-4 transition-colors cursor-pointer ${
              busy ? "text-rose-400 animate-pulse" : "text-slate-600 hover:text-rose-400"
            }`}
            title="Delete competition"
          >
            <FiTrash2 size={14} />
          </span>
        )}
      </div>
    </button>
  );
}

// ── The "Add New Competition" dashed tile ────────────────────────────────────
function AddTile({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/30 hover:border-emerald-500/60 hover:bg-emerald-500/5 transition-all min-h-[210px] p-6"
    >
      <span className="w-14 h-14 rounded-2xl bg-slate-950/70 border border-slate-700 group-hover:border-emerald-500/50 flex items-center justify-center mb-3 transition-all">
        <FiPlus className="text-3xl text-slate-500 group-hover:text-emerald-300 transition-colors" />
      </span>
      <span className="text-sm font-black text-slate-300 group-hover:text-emerald-200 uppercase tracking-wider transition-colors">
        Add New Competition
      </span>
      <span className="text-[11px] text-slate-500 mt-1">La Liga or Champions League</span>
    </button>
  );
}

export default function Competitions() {
  const router = useRouter();
  const [role, setRole] = useState("");

  const [comps, setComps] = useState([]);
  const [meta, setMeta] = useState({}); // id -> card meta
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null); // competition awaiting confirm

  const refresh = async () => {
    const list = await listCompetitions();
    setComps(list);
    const m = {};
    await Promise.all(
      list.map(async (comp) => {
        const d = await getCompetition(comp.id);
        const fixtures = d?.fixtures || [];
        const teams = d?.teams || [];
        const played = fixtures.filter(isPlayed).length;
        const fmt = detectFormat(d?.competition);
        m[comp.id] = {
          teams: teams.length,
          played,
          total: fixtures.length,
          crests: teams.slice(0, 6),
          fmt,
          finished: isFinished(fixtures),
          champion: getChampion({ competition: d?.competition, teams, fixtures }),
        };
      })
    );
    setMeta(m);
    setLoading(false);
  };

  useEffect(() => {
    setRole((localStorage.getItem("user_role") || "").toLowerCase());
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAdmin = role === "admin";

  // Clicking the trash icon on a card now OPENS the in-app confirm dialog rather
  // than deleting immediately. The actual delete runs from the dialog's confirm.
  const requestDelete = (e, comp) => {
    e.stopPropagation();
    if (busyId) return;
    setPendingDelete(comp);
  };

  const confirmDelete = async () => {
    const comp = pendingDelete;
    if (!comp || busyId) return;
    setBusyId(comp.id);
    await deleteCompetition(comp.id).catch(() => {});
    await refresh();
    setBusyId(null);
    setPendingDelete(null);
  };

  return (
    <div className="fade-in">
      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete competition?"}
        message={
          pendingDelete
            ? `This permanently removes “${pendingDelete.name} · ${pendingDelete.season}”, its teams and all fixtures. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        busy={!!busyId}
        onConfirm={confirmDelete}
        onCancel={() => !busyId && setPendingDelete(null)}
      />

      {/* ─────────── Premium gradient banner ─────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1a3f] via-slate-900 to-[#3b0a2a]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(244,63,94,0.18),transparent_50%)]" />
        {/* faint crest watermark */}
        <img
          src="https://crests.football-data.org/81.png"
          alt=""
          aria-hidden
          className="absolute -right-6 -bottom-10 w-48 h-48 object-contain opacity-[0.06] pointer-events-none select-none"
        />
        <div className="relative px-6 py-8 md:px-8 md:py-9 flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4 md:gap-5 min-w-0">
            {/* trophy logo mark on a glowing light container */}
            <span className="relative shrink-0">
              <span className="absolute inset-0 rounded-2xl bg-emerald-400/30 blur-xl" />
              <span className="relative inline-flex items-center justify-center w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 ring-1 ring-amber-200/50 shadow-lg shadow-amber-500/30">
                <FiAward className="text-slate-900 text-3xl md:text-4xl" />
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-emerald-300/80 uppercase tracking-[0.3em] mb-1.5">
                FC Barcelona · Competitions Hub
              </p>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
                Competitions
              </h1>
              <p className="mt-2.5 text-sm text-slate-300/90 font-medium max-w-xl">
                La Liga &amp; the Champions League — real tables, live results and full knockout brackets, all in one place.
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={() => router.push("/dashboard/competitions/new")}
              className="shrink-0 px-6 py-3 bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 rounded-xl hover:bg-emerald-500 hover:text-white hover:border-emerald-400 transition-all duration-300 font-bold text-xs uppercase tracking-[0.22em] flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <FiPlus className="text-base" /> New competition
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-black italic animate-pulse">LOADING…</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comps.map((c) => (
              <CompetitionCard
                key={c.id}
                comp={c}
                meta={meta[c.id]}
                canEdit={isAdmin}
                busy={busyId === c.id}
                onOpen={() => router.push(`/dashboard/competitions/${c.id}`)}
                onDelete={(e) => requestDelete(e, c)}
              />
            ))}

            {/* Add-new tile — admins only */}
            {isAdmin && <AddTile onClick={() => router.push("/dashboard/competitions/new")} />}
          </div>

          {/* Empty state — ONLY when there are genuinely zero competitions. */}
          {comps.length === 0 && (
            <p className="mt-6 text-center text-[11px] text-slate-600 italic">
              No competitions created yet — use the dashed tile above to start one.
            </p>
          )}
        </>
      )}
    </div>
  );
}
