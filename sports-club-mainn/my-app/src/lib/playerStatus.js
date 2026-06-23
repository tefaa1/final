// Single source of truth for reading a player's availability status across the
// app. A player's `status` (StatusOfPlayer enum on the backend) is the canonical
// flag — the Medical module flips it to INJURED when an injury is reported and
// back to AVAILABLE when the injury is marked RECOVERED (see Medical.jsx).

export const PLAYER_STATUS = {
  AVAILABLE: "AVAILABLE",
  INJURED: "INJURED",
  ABSENT: "ABSENT",
  SUSPENDED: "SUSPENDED",
};

// Normalise whatever shape the status arrives in (string, {name}, lowercase…).
export function statusOf(player) {
  const s = player?.status;
  const raw = typeof s === "object" ? (s?.name || s?.value || "") : s;
  return String(raw || "AVAILABLE").toUpperCase().trim();
}

// Injured players cannot be added to a match lineup or a training session.
export function isInjured(player) {
  return statusOf(player) === PLAYER_STATUS.INJURED;
}

// Available = eligible to be selected for matches/training. We only block the
// hard "INJURED" case (suspended/absent players are handled elsewhere by squad
// management); injured is the one the medical workflow drives automatically.
export function isSelectable(player) {
  return !isInjured(player);
}

// A medical injury status of RECOVERED means the player is fit again; any other
// active injury status (REPORTED/DIAGNOSED/TREATING/RECOVERING/CHRONIC) means
// they should be flagged INJURED.
export function playerStatusForInjury(injuryStatus) {
  return String(injuryStatus || "").toUpperCase() === "RECOVERED"
    ? PLAYER_STATUS.AVAILABLE
    : PLAYER_STATUS.INJURED;
}
