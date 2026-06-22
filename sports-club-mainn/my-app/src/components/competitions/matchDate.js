// ─────────────────────────────────────────────────────────────────────────────
// Match date/time helpers — shared by the fixtures list and the team filter.
// Backend stores `playedAt` as a naive ISO datetime, e.g. "2025-05-10T20:00:00".
// ─────────────────────────────────────────────────────────────────────────────

// ISO/"2025-05-10T20:00:00" → "10 May 2025 · 20:00" for display on played matches.
// Falls back gracefully when only a date (no time) is present.
export function fmtPlayedDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16).replace("T", " · ");
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const s = String(value);
  // Only show a time when the source actually carried one (has a "T" + HH:MM).
  const hasTime = s.includes("T") && /T\d{2}:\d{2}/.test(s);
  if (!hasTime) return date;
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

// Normalise a stored playedAt to the value a <input type="datetime-local"> wants:
// "YYYY-MM-DDTHH:MM" (no seconds, no timezone).
export function toDateTimeLocal(value) {
  if (!value) return "";
  const s = String(value);
  // Already "YYYY-MM-DDTHH:MM[:SS]" → trim to minute precision.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16);
  // Date-only "YYYY-MM-DD" → default to 20:00 kick-off.
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s}T20:00`;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return localDateTimeInput(d);
}

// A sensible default for entering a new result: today at 20:00.
export function defaultDateTimeLocal() {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  return localDateTimeInput(d);
}

// Date → "YYYY-MM-DDTHH:MM" in LOCAL time (so the picker shows what the user expects).
function localDateTimeInput(d) {
  const p = (n) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// What we actually send to the backend: the datetime-local string with seconds,
// e.g. "2025-05-10T20:00" → "2025-05-10T20:00:00".
export function toPlayedAtPayload(dtLocal) {
  if (!dtLocal) return "";
  const s = String(dtLocal);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) return `${s}:00`;
  return s;
}
