"use client";

/**
 * Settings storage + effects helper.
 *
 * The backend has no per-user "settings" resource, so everything the Settings
 * screen owns is persisted to localStorage. To keep one user's settings from
 * leaking into another's on a shared machine, every key is namespaced by the
 * current user (their Keycloak `sub`, falling back to keycloakId / username).
 *
 * It also owns the *visible* effects for Preferences (theme + compact view).
 * The app is themed entirely through CSS custom properties declared in
 * globals.css `:root` (not Tailwind `dark:` variants), so toggling a `dark`
 * class does nothing on its own. Instead we inject a single <style> block that
 * (a) compresses layout under `html.compact` and (b) repaints the palette under
 * `html.mscms-light`, then toggle those classes. Re-applying on mount makes the
 * choice survive a full reload.
 */

const PREFIX = "mscms:settings";

/* --------------------------- JWT / identity --------------------------- */

export function decodeJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("token") || "";
}

export function getClaims() {
  const token = getToken();
  return token ? decodeJwt(token) : {};
}

export const ROLE_LABELS = {
  admin: "Admin", sport_manager: "Sport Manager", team_manager: "Team Manager",
  head_coach: "Head Coach", assistant_coach: "Assistant Coach", specific_coach: "Specific Coach",
  fitness_coach: "Fitness Coach", performance_analyst: "Performance Analyst",
  team_doctor: "Team Doctor", doctor: "Doctor", physiotherapist: "Physiotherapist",
  scout: "Scout", sponsor: "Sponsor", fan: "Fan", player: "Player",
  national_team: "National Team", staff: "Staff",
};

/** Real role from the JWT realm roles, falling back to the stored user_role. */
export function getRole() {
  if (typeof window === "undefined") return "";
  const claims = getClaims();
  const fromJwt = (claims.realm_access?.roles || []).find((r) => ROLE_LABELS[r.toLowerCase()]);
  const raw = (fromJwt || localStorage.getItem("user_role") || "").toLowerCase();
  return raw;
}

export function getRoleLabel() {
  const raw = getRole();
  return ROLE_LABELS[raw] || raw.replace(/_/g, " ") || "";
}

/** Real email from the JWT, falling back to the cached user_info blob. */
export function getEmail() {
  if (typeof window === "undefined") return "";
  const claims = getClaims();
  if (claims.email) return claims.email;
  try {
    return JSON.parse(localStorage.getItem("user_info") || "{}").email || "";
  } catch {
    return "";
  }
}

export function getKeycloakId() {
  if (typeof window === "undefined") return "";
  const claims = getClaims();
  if (claims.sub) return claims.sub;
  if (localStorage.getItem("keycloakId")) return localStorage.getItem("keycloakId");
  try {
    return JSON.parse(localStorage.getItem("user_info") || "{}").keycloakId || "";
  } catch {
    return "";
  }
}

/** A stable per-user key for namespacing storage. */
function userKey() {
  return getKeycloakId() || (typeof window !== "undefined" && localStorage.getItem("user_role")) || "anon";
}

/* ----------------------------- storage -------------------------------- */

function storageKey(section) {
  return `${PREFIX}:${userKey()}:${section}`;
}

export function loadSection(section, fallback = {}) {
  if (typeof window === "undefined") return { ...fallback };
  try {
    const raw = localStorage.getItem(storageKey(section));
    if (!raw) return { ...fallback };
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return { ...fallback };
  }
}

export function saveSection(section, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(section), JSON.stringify(value));
  // Let other settings surfaces in the same tab react without a reload.
  try {
    window.dispatchEvent(new CustomEvent("mscms:settings-changed", { detail: { section } }));
  } catch {
    /* CustomEvent unsupported — non-fatal */
  }
}

/* ------------------------- preference effects ------------------------- */

const STYLE_ID = "mscms-settings-effects";

/**
 * Inject (once) the CSS that gives `compact` and the light theme real, visible
 * meaning. Idempotent — safe to call on every mount.
 */
function ensureEffectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
/* ---- Compact view: tighten the global rhythm ---- */
html.compact body { letter-spacing: 0; }
html.compact .card,
html.compact .stat-card { padding: 12px 14px; }
html.compact main { padding: 1rem !important; }
html.compact main > div { gap: 1rem !important; }
html.compact .page-header { margin-bottom: 14px; }
html.compact td { padding: 8px 14px; }
html.compact th { padding: 8px 14px; }
html.compact .settings-density { padding: 1.25rem !important; }
html.compact .settings-density .settings-row { padding-top: 0.85rem !important; padding-bottom: 0.85rem !important; }

/* ---- Light theme: repaint the CSS-variable palette + slate utilities ---- */
html.mscms-light {
  --bg: #f1f5f9;
  --bg-card: #ffffff;
  --bg-hover: #e2e8f0;
  --border: #cbd5e1;
  --border-light: #94a3b8;
  --text: #0f172a;
  --text-muted: #475569;
  --text-sub: #334155;
  color-scheme: light;
}
html.mscms-light body { background: var(--bg); color: var(--text); }
/* Re-map the most common dark slate utility surfaces used across the app
   (and the Settings cards) so a light theme is genuinely legible. */
html.mscms-light .bg-slate-950 { background-color: #f1f5f9 !important; }
html.mscms-light .bg-slate-950\\/50,
html.mscms-light .bg-slate-950\\/30 { background-color: #ffffff !important; }
html.mscms-light .bg-slate-900,
html.mscms-light .bg-slate-900\\/50,
html.mscms-light .bg-slate-900\\/98 { background-color: #ffffff !important; }
html.mscms-light .border-slate-800,
html.mscms-light .border-slate-800\\/50 { border-color: #cbd5e1 !important; }
html.mscms-light .text-slate-100,
html.mscms-light .text-slate-200 { color: #0f172a !important; }
html.mscms-light .text-slate-300 { color: #334155 !important; }
html.mscms-light .text-slate-400,
html.mscms-light .text-slate-500 { color: #475569 !important; }
`;
  document.head.appendChild(style);
}

/**
 * Apply the saved theme + compact choice to the document root.
 * `theme` is "Light" | "Dark" | "System"; compact is a boolean.
 */
export function applyAppearance({ theme = "Dark", compact = false } = {}) {
  if (typeof document === "undefined") return;
  ensureEffectStyles();
  const root = document.documentElement;

  let light;
  if (theme === "Light") light = true;
  else if (theme === "Dark") light = false;
  else light = !window.matchMedia?.("(prefers-color-scheme: dark)")?.matches; // System

  root.classList.toggle("mscms-light", !!light);
  root.classList.toggle("compact", !!compact);
}
