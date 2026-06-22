// ─────────────────────────────────────────────────────────────────────────────
// FIXTURE SOURCE LINK
//
// When a match is created from a real competition fixture (the "Play a real
// fixture" flow on /dashboard/matches/new) we remember WHERE it came from so the
// final score can be written back to that fixture when the match finishes.
//
// The backend match entity has no spare structured column for this, so we stash
// a small parseable tag inside the free-text `notes` field:
//
//     [FIXTURE comp=18 fix=1186]
//
// `parseFixtureSource(notes)` returns { compId, fixtureId } or null.
// ─────────────────────────────────────────────────────────────────────────────

export const FIXTURE_SOURCE_TAG = "[FIXTURE";

const RE = /\[FIXTURE\s+comp=(\d+)\s+fix=(\d+)\]/i;

// Pull the { compId, fixtureId } a match was created from, or null.
export function parseFixtureSource(notes) {
  const m = RE.exec(String(notes || ""));
  if (!m) return null;
  return { compId: Number(m[1]), fixtureId: Number(m[2]) };
}

// Build the tag string to store in notes.
export function buildFixtureSource(compId, fixtureId) {
  return `[FIXTURE comp=${compId} fix=${fixtureId}]`;
}
