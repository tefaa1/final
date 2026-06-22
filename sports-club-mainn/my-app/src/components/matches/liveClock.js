// ─────────────────────────────────────────────────────────────────────────────
// LIVE CLOCK + AUTO GO-LIVE helpers
//
// A scheduled match begins automatically when its kickoff date+time arrives —
// the user never manually flips it. These pure helpers compute, from a kickoff
// timestamp and "now":
//   • whether kickoff has arrived (hasKickedOff)
//   • the running match minute (elapsedMinute) advancing from kickoff
//   • the football phase (1st/2nd half, ET) implied by that minute
//   • a friendly countdown string for matches that haven't started yet
//
// Minute → phase is the same mapping LiveMatch already uses so the timeline and
// the clock agree. Penalties have no clock (they're a shootout), so the phase is
// only ever auto-derived up to extra time; PENALTIES is set explicitly by the UI.
// ─────────────────────────────────────────────────────────────────────────────

export const PHASE_DEFS = [
  { id: "FIRST_HALF", label: "1st Half", short: "1H", min: 0, max: 45 },
  { id: "SECOND_HALF", label: "2nd Half", short: "2H", min: 45, max: 90 },
  { id: "EXTRA_TIME", label: "Extra Time", short: "ET", min: 90, max: 120 },
  { id: "PENALTIES", label: "Penalties", short: "PENS", min: 120, max: 999 },
];

// Parse a backend timestamp (e.g. "2026-08-15T20:00:00", no zone) as LOCAL time.
export function parseKickoff(kickoffTime) {
  if (!kickoffTime) return null;
  // Treat a bare "YYYY-MM-DDTHH:mm:ss" (no offset) as local wall-clock time.
  const t = new Date(kickoffTime);
  return Number.isNaN(t.getTime()) ? null : t;
}

// Has the kickoff moment arrived (now >= kickoff)?
export function hasKickedOff(kickoffTime, now = Date.now()) {
  const k = parseKickoff(kickoffTime);
  if (!k) return false;
  return now >= k.getTime();
}

// Whole minutes since kickoff (>= 0). Returns 0 before kickoff.
export function elapsedMinute(kickoffTime, now = Date.now()) {
  const k = parseKickoff(kickoffTime);
  if (!k) return 0;
  const diffMs = now - k.getTime();
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / 60000);
}

// Football phase implied by the running minute (caps at extra time — penalties
// are an explicit, non-timed state owned by the live UI).
export function phaseForMinute(min) {
  if (min <= 45) return "FIRST_HALF";
  if (min <= 90) return "SECOND_HALF";
  return "EXTRA_TIME";
}

// A display clock like "67'" capped at 90+ / 120+ so it reads like a real match.
export function clockLabel(min) {
  if (min <= 0) return "0'";
  if (min > 120) return "120'+";
  if (min > 90) return `${Math.min(min, 120)}'`;
  if (min > 45 && min <= 47) return "45'+";
  return `${min}'`;
}

// Milliseconds remaining until kickoff (>= 0), or 0 if already started/invalid.
export function msUntilKickoff(kickoffTime, now = Date.now()) {
  const k = parseKickoff(kickoffTime);
  if (!k) return 0;
  return Math.max(0, k.getTime() - now);
}

// Human countdown like "2d 4h", "3h 12m", "08:42" (mm:ss under an hour).
export function countdownLabel(kickoffTime, now = Date.now()) {
  const ms = msUntilKickoff(kickoffTime, now);
  if (ms <= 0) return "Kickoff!";
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Minimum lead time before a kickoff may be scheduled (5 minutes from now).
export const MIN_KICKOFF_LEAD_MS = 5 * 60 * 1000;

// Validate a datetime-local value for a NEW match: it must parse and be at least
// 5 minutes in the future. Returns null when valid, else a user-facing message.
export function validateKickoff(kickoffLocalValue, now = Date.now()) {
  if (!kickoffLocalValue) return "Choose a kickoff date & time.";
  const k = parseKickoff(kickoffLocalValue);
  if (!k) return "That kickoff date & time isn't valid.";
  const diff = k.getTime() - now;
  if (diff <= 0) return "Kickoff can't be in the past — pick a future time.";
  if (diff < MIN_KICKOFF_LEAD_MS) return "Kickoff must be at least 5 minutes from now.";
  return null;
}

// A datetime-local min= attribute string (now + 5 min) so the picker itself
// nudges the user toward a valid value. Format: "YYYY-MM-DDTHH:mm".
export function minKickoffLocal(now = Date.now()) {
  const d = new Date(now + MIN_KICKOFF_LEAD_MS);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Format a kickoff for display WITH the time (date everywhere = date + time).
export function formatKickoff(kickoffTime) {
  const k = parseKickoff(kickoffTime);
  if (!k) return "TBD";
  return k.toLocaleString([], { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE MACHINE — a broadcast-style sequence of phases. Each PLAYING phase has a
// regulation length and a base minute (so the clock reads 45+x / 90+x), plus
// admin-set stoppage time. The non-playing phases (HALF_TIME, FULL_TIME, the ET
// half-time interval, and PENALTIES) have no running clock.
//
//   FIRST_HALF (45') → HALF_TIME → SECOND_HALF (45') → FULL_TIME
//     [knockout & level] → EXTRA_FIRST (15') → EXTRA_HALFTIME
//                        → EXTRA_SECOND (15') → [still level] → PENALTIES
// ─────────────────────────────────────────────────────────────────────────────

// id: enum • label/short: display • base: minute the phase starts AT (clock = base+elapsed)
// len: regulation minutes for a playing phase • playing: has a running clock
// next: the phase that follows when the admin advances (null = terminal-ish)
export const MATCH_PHASES = {
  FIRST_HALF:     { id: "FIRST_HALF",     label: "1st Half",        short: "1H",   base: 0,   len: 45, playing: true,  next: "HALF_TIME" },
  HALF_TIME:      { id: "HALF_TIME",      label: "Half Time",       short: "HT",   base: 45,  len: 0,  playing: false, next: "SECOND_HALF" },
  SECOND_HALF:    { id: "SECOND_HALF",    label: "2nd Half",        short: "2H",   base: 45,  len: 45, playing: true,  next: "FULL_TIME" },
  FULL_TIME:      { id: "FULL_TIME",      label: "Full Time",       short: "FT",   base: 90,  len: 0,  playing: false, next: "EXTRA_FIRST" },
  EXTRA_FIRST:    { id: "EXTRA_FIRST",    label: "Extra Time 1",    short: "ET1",  base: 90,  len: 15, playing: true,  next: "EXTRA_HALFTIME" },
  EXTRA_HALFTIME: { id: "EXTRA_HALFTIME", label: "ET Half Time",    short: "ET-HT", base: 105, len: 0,  playing: false, next: "EXTRA_SECOND" },
  EXTRA_SECOND:   { id: "EXTRA_SECOND",   label: "Extra Time 2",    short: "ET2",  base: 105, len: 15, playing: true,  next: "PENALTIES" },
  PENALTIES:      { id: "PENALTIES",      label: "Penalties",       short: "PENS", base: 120, len: 0,  playing: false, next: null },
};

// Ordered list (timeline order) for the phase indicator/progress bar.
export const PHASE_ORDER = [
  "FIRST_HALF", "HALF_TIME", "SECOND_HALF", "FULL_TIME",
  "EXTRA_FIRST", "EXTRA_HALFTIME", "EXTRA_SECOND", "PENALTIES",
];

export const phaseDef = (id) => MATCH_PHASES[id] || MATCH_PHASES.FIRST_HALF;
export const phaseLabelOf = (id) => phaseDef(id).label;
export const phaseIndex = (id) => { const i = PHASE_ORDER.indexOf(id); return i < 0 ? 0 : i; };
export const isPlayingPhase = (id) => !!phaseDef(id).playing;

// The phase a running playing-phase clock implies from the elapsed match minute.
// Only auto-derives regulation play (1st/2nd half); HALF_TIME, FULL_TIME, ET and
// PENALTIES are explicit admin transitions the UI owns.
export function autoPhaseForMinute(min) {
  if (min <= 0) return "FIRST_HALF";
  if (min <= 45) return "FIRST_HALF";
  return "SECOND_HALF";
}

// Display the clock for a PLAYING phase: counts within the phase and shows
// stoppage as "45+2'". `phaseMin` is the live minute inside the phase (0-based),
// `stoppage` is the admin-set added minutes for the phase.
export function phaseClockLabel(phaseId, phaseMin, stoppage = 0) {
  const def = phaseDef(phaseId);
  if (!def.playing) return def.label;
  const regEnd = def.len;                       // 45 or 15
  const live = Math.max(0, Math.floor(phaseMin));
  if (live <= regEnd) return `${def.base + live}'`;
  // Into stoppage: cap the base number at the regulation end, then show +extra.
  const over = Math.min(live - regEnd, Math.max(stoppage, live - regEnd));
  return `${def.base + regEnd}+${over}'`;
}

// Whole minutes elapsed INSIDE the current playing phase, derived from the
// timestamp the phase was (re)started at. Returns 0 before/without a start.
export function phaseElapsed(phaseStartedAt, now = Date.now()) {
  if (!phaseStartedAt) return 0;
  const start = typeof phaseStartedAt === "number" ? phaseStartedAt : new Date(phaseStartedAt).getTime();
  if (!Number.isFinite(start)) return 0;
  const diff = now - start;
  if (diff <= 0) return 0;
  return Math.floor(diff / 60000);
}

// Map a stored MatchEvent minute back to a phase (for reconstructing state on
// reload). Shootout events are tagged separately by the UI.
export function phaseForStoredMinute(min) {
  const m = Number(min) || 0;
  if (m > 120) return "PENALTIES";
  if (m > 105) return "EXTRA_SECOND";
  if (m > 90) return "EXTRA_FIRST";
  if (m > 45) return "SECOND_HALF";
  return "FIRST_HALF";
}
