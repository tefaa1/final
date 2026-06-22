"use client";

import React, { useMemo } from "react";
import { TeamCrest } from "./TeamPicker";
import { KO_ROUNDS, groupTies, isPlayed } from "./store";

// Resolve a team display object by id (falling back to the stored name).
function teamById(teams, id, name) {
  return teams.find((t) => t.id === id) || { name: name || "—", crest: "⚽", crestUrl: "" };
}

// ── Fixed bracket geometry ──────────────────────────────────────────────────
// We lay the bracket out on a deterministic grid (absolute positioning) and draw
// the connectors as ONE SVG layer behind the cards. Because every card position
// is computed from these constants, the connector lines are always perfectly
// aligned to the card centres and can never overflow the layout.
const CARD_W = 224; // tie card width  (px)  — matches w-56
const CARD_H = 84; // tie card height (px)
const COL_GAP = 56; // horizontal gap between columns (the connector gutter)
const ROW_GAP = 20; // vertical gap between the two deepest-round (base) cards
const COL_W = CARD_W + COL_GAP;
const HEADER_H = 26; // room for the round label above the cards
const BASE_SLOT = CARD_H + ROW_GAP; // vertical pitch of the first (tallest) column

// ── one tie card ─────────────────────────────────────────────────────────────
function Side({ t, score, win, lose, single }) {
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 ${lose ? "opacity-45" : ""}`}>
      <span className="flex items-center gap-2 min-w-0">
        <TeamCrest team={t} size={18} />
        <span className={`text-xs truncate ${win ? "font-black text-emerald-300" : "font-semibold text-slate-300"}`}>
          {t.name}
        </span>
      </span>
      <span className={`text-sm font-black tabular-nums shrink-0 ${win ? "text-emerald-300" : "text-slate-400"}`}>
        {single ? score : score}
      </span>
    </div>
  );
}

function TieCard({ teams, tie, final = false }) {
  const a = teamById(teams, tie.teamAId, tie.teamAName);
  const b = teamById(teams, tie.teamBId, tie.teamBName);
  const decided = tie.legs.length > 0 && tie.legs.every(isPlayed);
  const aWin = decided && tie.winnerId === tie.teamAId;
  const bWin = decided && tie.winnerId === tie.teamBId;
  const twoLeg = tie.legs.length > 1;

  return (
    <div
      className={`bg-slate-950/80 border rounded-lg overflow-hidden shadow-sm h-full ${
        final ? "border-amber-500/40 ring-1 ring-amber-500/30" : "border-slate-800"
      }`}
    >
      <Side t={a} score={decided ? tie.aggA : "–"} win={aWin} lose={decided && bWin} single={!twoLeg} />
      <div className="border-t border-slate-800/70" />
      <Side t={b} score={decided ? tie.aggB : "–"} win={bWin} lose={decided && aWin} single={!twoLeg} />
      <div className="px-3 py-1 border-t border-slate-800/70 bg-slate-950/50 flex items-center justify-between">
        <span className="text-[8.5px] font-black uppercase tracking-[0.15em] text-slate-600">
          {twoLeg ? "Aggregate" : "Single match"}
        </span>
        {tie.legs.length > 0 && (
          <span className="text-[9px] font-bold tabular-nums text-slate-500">
            {tie.legs.map((l) => `${l.homeScore ?? "·"}–${l.awayScore ?? "·"}`).join(" · ")}
          </span>
        )}
      </div>
    </div>
  );
}

// Empty placeholder slot (round exists downstream but a feeding tie not yet set).
function EmptyTie() {
  return (
    <div className="w-full h-full rounded-lg border border-dashed border-slate-800 bg-slate-950/30 flex items-center justify-center">
      <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">TBD</span>
    </div>
  );
}

/**
 * Proper left-to-right knockout bracket. Each round is a column of tie cards;
 * the winners of two adjacent ties feed the single tie beside them in the next
 * column. Connectors are drawn as a single, perfectly-aligned SVG layer so the
 * lines never overflow or stick out. Two-legged ties show the aggregate, both
 * leg scores and a clear (emerald) winner. The chain ends at the single Final.
 *
 * `fixtures` = Champions League KNOCKOUT fixtures (everything except LEAGUE_STAGE).
 */
export default function Bracket({ teams, fixtures }) {
  // Build, per round, the ordered list of ties. We ORDER each round's ties so
  // that the two ties feeding a next-round tie sit adjacent.
  const columns = useMemo(() => {
    const present = KO_ROUNDS.filter(
      (r) => (fixtures || []).some((m) => m.round === r.key)
    );
    if (present.length === 0) return [];

    const raw = present.map((r) => ({
      round: r,
      ties: groupTies((fixtures || []).filter((m) => m.round === r.key)),
    }));

    // Order from the LAST round backwards so each earlier round lines up under
    // the tie its winner advances to.
    for (let i = raw.length - 1; i >= 0; i--) {
      if (i === raw.length - 1) continue;
      const next = raw[i + 1];
      const cur = raw[i];
      const ordered = [];
      const used = new Set();
      for (const nt of next.ties) {
        const feeders = cur.ties.filter(
          (t) =>
            !used.has(t.key) &&
            (t.winnerId != null
              ? t.winnerId === nt.teamAId || t.winnerId === nt.teamBId
              : false)
        );
        feeders.sort((x, y) => {
          const xa = x.winnerId === nt.teamAId ? 0 : 1;
          const ya = y.winnerId === nt.teamAId ? 0 : 1;
          return xa - ya;
        });
        for (const f of feeders) {
          ordered.push(f);
          used.add(f.key);
        }
      }
      for (const t of cur.ties) if (!used.has(t.key)) ordered.push(t);
      cur.ties = ordered;
    }

    return raw;
  }, [fixtures, teams]);

  // Champion = winner of the FINAL tie.
  const champion = useMemo(() => {
    const finalCol = columns.find((c) => c.round.key === "FINAL");
    const ft = finalCol?.ties?.[0];
    if (ft?.winnerId != null) {
      return teamById(teams, ft.winnerId, ft.winnerId === ft.teamAId ? ft.teamAName : ft.teamBName);
    }
    return null;
  }, [columns, teams]);

  // ── Compute absolute positions for every tie + the connector paths ──────────
  const layout = useMemo(() => {
    if (columns.length === 0) return null;
    // The tallest column drives the canvas height. Each subsequent column with
    // HALF the ties doubles its vertical pitch and centres each card between the
    // pair that feeds it; columns with the SAME count keep a 1:1 pitch.
    const maxTies = Math.max(...columns.map((c) => c.ties.length), 1);
    const canvasH = HEADER_H + maxTies * BASE_SLOT;

    // y-centre of card k in a column, given how many cards that column has.
    const yCenter = (count, k) => {
      if (count <= 0) return HEADER_H + BASE_SLOT / 2;
      const pitch = (maxTies * BASE_SLOT) / count; // spread evenly over canvas
      return HEADER_H + pitch * k + pitch / 2;
    };

    const cols = columns.map((col, ci) => {
      const count = Math.max(col.ties.length, 1);
      const x = ci * COL_W;
      const items = (col.ties.length ? col.ties : [null]).map((tie, k) => ({
        tie,
        x,
        y: yCenter(count, k) - CARD_H / 2,
        cy: yCenter(count, k),
      }));
      return { ...col, x, items };
    });

    // Connector paths: from each card in column ci to its target card in ci+1.
    const paths = [];
    for (let ci = 0; ci < cols.length - 1; ci++) {
      const cur = cols[ci];
      const nxt = cols[ci + 1];
      const ratio = cur.items.length / nxt.items.length; // 2 (merge) or 1 (straight)
      cur.items.forEach((src, k) => {
        const targetIdx = ratio >= 1.5 ? Math.floor(k / 2) : k;
        const dst = nxt.items[Math.min(targetIdx, nxt.items.length - 1)];
        if (!dst) return;
        const x1 = cur.x + CARD_W; // right edge of source card
        const y1 = src.cy;
        const x2 = nxt.x; // left edge of target card
        const y2 = dst.cy;
        const xm = x1 + COL_GAP / 2; // mid x for the elbow
        // Orthogonal elbow: out, vertical to target row, then into the target.
        paths.push(`M ${x1} ${y1} H ${xm} V ${y2} H ${x2}`);
      });
    }

    const canvasW = (cols.length - 1) * COL_W + CARD_W;
    return { cols, paths, canvasW, canvasH };
  }, [columns]);

  if (columns.length === 0 || !layout) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-slate-500 italic mb-3">Knockout stage not started yet.</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {KO_ROUNDS.map((r, i) => (
            <React.Fragment key={r.key}>
              <span className="px-3 py-1.5 rounded-lg bg-slate-950/60 border border-dashed border-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-500">
                {r.label}
              </span>
              {i < KO_ROUNDS.length - 1 && <span className="text-slate-700">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  const { cols, paths, canvasW, canvasH } = layout;

  return (
    <div>
      {champion && (
        <div className="mb-5 flex items-center gap-3 bg-gradient-to-r from-amber-500/15 to-transparent border border-amber-500/30 rounded-xl px-4 py-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/80 font-black">Champion</p>
            <p className="text-sm font-black text-amber-200 flex items-center gap-2">
              <TeamCrest team={champion} size={18} />
              {champion.name}
            </p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto pb-4">
        <div className="relative" style={{ width: canvasW, height: canvasH }}>
          {/* connector layer — drawn behind the cards, clipped to the canvas */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={canvasW}
            height={canvasH}
            viewBox={`0 0 ${canvasW} ${canvasH}`}
            aria-hidden
          >
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="rgb(51 65 85 / 0.7)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {/* round labels */}
          {cols.map((col) => (
            <p
              key={`lbl-${col.round.key}`}
              className="absolute text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center"
              style={{ left: col.x, top: 0, width: CARD_W }}
            >
              {col.round.label}
            </p>
          ))}

          {/* tie cards, absolutely positioned at their computed centres */}
          {cols.map((col) =>
            col.items.map((it, k) => (
              <div
                key={`${col.round.key}-${it.tie?.key ?? k}`}
                className="absolute"
                style={{ left: it.x, top: it.y, width: CARD_W, height: CARD_H }}
              >
                {it.tie ? (
                  <TieCard teams={teams} tie={it.tie} final={col.round.key === "FINAL"} />
                ) : (
                  <EmptyTie />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="mt-2 text-[10px] text-slate-600 italic text-center">
        Winners advance left → right. Two-legged ties decided on aggregate; the Final is one match.
      </p>
    </div>
  );
}
