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

// Serialize a datetime-local value ("YYYY-MM-DDTHH:mm") into the NAIVE LOCAL
// wall-clock string the backend stores ("YYYY-MM-DDTHH:mm:ss") — WITHOUT any
// timezone conversion. The backend keeps kickoff as a naive LocalDateTime, so we
// must NOT pass it through Date#toISOString()/Date.UTC() (those shift the wall
// time by the local UTC offset, which made matches display ~3h early and appear
// LIVE immediately). We just normalise the format and append seconds.
export function toNaiveLocalDateTime(localInputValue) {
  if (!localInputValue) return null;
  const s = String(localInputValue).trim();
  // Already "YYYY-MM-DDTHH:mm[:ss]" — keep the wall time exactly, ensure seconds.
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, date, hh, mm, ss] = m;
    return `${date}T${hh}:${mm}:${ss || "00"}`;
  }
  // Fallback: format whatever Date we can parse using LOCAL parts (no UTC shift).
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// Build a datetime-local input value ("YYYY-MM-DDTHH:mm") from a stored kickoff
// using LOCAL parts (NOT toISOString, which would print UTC and shift the wall
// time). Used to pre-fill the picker when editing / deep-linking.
export function toLocalInputValue(kickoffTime) {
  const k = parseKickoff(kickoffTime);
  if (!k) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${k.getFullYear()}-${pad(k.getMonth() + 1)}-${pad(k.getDate())}T${pad(k.getHours())}:${pad(k.getMinutes())}`;
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
//
// IMPORTANT (the "45+132" bug): the regulation minute is HARD-CAPPED at the phase
// length (45 for a half, 15 for an ET period) and the displayed added time is the
// ADMIN-SET stoppage only — never the raw computed overflow. So a half left
// running for hours freezes at "45+<stoppage>" (e.g. "45+3'", or just "45'" when
// no stoppage was set). It is the admin who advances the phase; the clock never
// runs away into nonsense like "45+132".
export function phaseClockLabel(phaseId, phaseMin, stoppage = 0) {
  const def = phaseDef(phaseId);
  if (!def.playing) return def.label;
  const regEnd = def.len;                          // 45 or 15
  const live = Math.max(0, Math.floor(phaseMin));
  const added = Math.max(0, Math.floor(stoppage)); // admin-set stoppage, bounded ≥ 0
  // Still inside regulation → plain "47'", but never past the phase length.
  if (live <= regEnd) return `${def.base + live}'`;
  // Past regulation: base freezes at the regulation end and we show ONLY the
  // admin-set stoppage. The live minute can never push it higher than +stoppage,
  // and with no stoppage set we show the clean "45'" rather than "45+0'".
  const over = Math.min(live - regEnd, added);
  return over > 0 ? `${def.base + regEnd}+${over}'` : `${def.base + regEnd}'`;
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

// Valid recordable-minute range for a PLAYING phase, used to clamp & validate
// the event-minute input so you can't (e.g.) score "minute 400", or log a
// first-half goal at minute 80. Regulation halves extend their upper bound by
// the admin-set stoppage time (so "45+x" / "90+x" are allowed). Extra-time
// periods are fixed 15' windows. Non-playing phases (HALF_TIME, FULL_TIME,
// ET-HT) carry no recordable minute; PENALTIES is a shootout (no minute).
//
//   FIRST_HALF  : 1–45 (+stoppage)
//   SECOND_HALF : 46–90 (+stoppage)
//   EXTRA_FIRST : 91–105
//   EXTRA_SECOND: 106–120
//
// Returns { min, max } (inclusive), or null when the phase has no minute.
export function phaseMinuteRange(phaseId, stoppage = 0) {
  const add = Math.max(0, Math.floor(Number(stoppage) || 0));
  switch (phaseId) {
    case "FIRST_HALF":   return { min: 1,   max: 45 + add };
    case "SECOND_HALF":  return { min: 46,  max: 90 + add };
    case "EXTRA_FIRST":  return { min: 91,  max: 105 + add };
    case "EXTRA_SECOND": return { min: 106, max: 120 + add };
    // HALF_TIME / FULL_TIME / EXTRA_HALFTIME / PENALTIES → no recordable minute.
    default:             return null;
  }
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
