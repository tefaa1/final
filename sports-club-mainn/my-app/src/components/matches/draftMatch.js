// ─────────────────────────────────────────────────────────────────────────────
// DRAFT MATCH HANDOFF
//
// A match must NEVER be persisted to the backend until it has a valid lineup.
// So the "new match" form does NOT create anything — it stashes the fully-formed
// match payload (+ the chosen default formation) here, then navigates to the
// lineup builder in DRAFT mode (?draft=1). The builder reads the draft, lets the
// user build the starting XI, and only on "Save & Finish" creates the formation,
// the match, and the lineup rows together. If the user abandons the builder,
// nothing is ever written — no lineup-less match is left behind.
//
// sessionStorage (not localStorage) so the draft is scoped to the tab and cleared
// when it closes.
// ─────────────────────────────────────────────────────────────────────────────

export const DRAFT_MATCH_KEY = "mscms.draftMatch";

export function saveDraftMatch(draft) {
  try {
    sessionStorage.setItem(DRAFT_MATCH_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function loadDraftMatch() {
  try {
    const raw = sessionStorage.getItem(DRAFT_MATCH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraftMatch() {
  try { sessionStorage.removeItem(DRAFT_MATCH_KEY); } catch { /* ignore */ }
}
