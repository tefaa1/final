// Single source of truth for which roles can access which dashboard routes.
// Imported by both src/components/Sidebar.jsx (menu filtering) and
// middleware.js (server-side route guard). Keep these aligned.
//
// Special tokens:
//   "any"   -> any authenticated user
//   "admin" -> always allowed (handled in canAccess, no need to list)
//
// ROLES (14): admin, head_coach, assistant_coach, specific_coach,
// fitness_coach, performance_analyst, team_doctor, physiotherapist,
// team_manager, sport_manager, scout, sponsor, player, fan.
//
// Per-role access is the EXPERT design below. admin is all-access (handled in
// canAccess, never needs listing). Every authenticated account gets
// /dashboard and /dashboard/settings.
//
// EXPERT distribution:
//   - fan  = SPECTATOR-ONLY: dashboard, club, trophies, competitions, matches,
//            world-cup, head-to-head, settings. NOTHING else (no messages,
//            players-mgmt, training, medical, scouting, contracts, analytics,
//            finance, staff, users, sponsors).
//   - player = the fan set PLUS messages, training, medical, players
//            (read-only UI via isReadOnly()).
//   - staff roles keep their sensible domain access; admin is all-access.
//
// Fan + player get a read-only UI (no add/edit/delete) — enforced via
// isReadOnly() in the feature UIs.

// Canonical 14 app routing roles (lowercase). Single source of truth so login
// role extraction can intersect realm roles against this set and ignore coarse
// Keycloak group roles (STAFF/COACH/DOCTOR) that are NOT app routing roles.
export const CANONICAL_ROLES = new Set([
  "admin",
  "sport_manager",
  "team_manager",
  "head_coach",
  "assistant_coach",
  "specific_coach",
  "fitness_coach",
  "performance_analyst",
  "team_doctor",
  "physiotherapist",
  "scout",
  "sponsor",
  "player",
  "fan",
]);

// Every authenticated, non-fan account (used to gate team-wide tools like the
// General chat that spectators must NOT be part of).
const NON_FAN_ROLES = [
  "head_coach", "assistant_coach", "specific_coach", "fitness_coach",
  "performance_analyst", "team_doctor", "physiotherapist", "team_manager",
  "sport_manager", "scout", "sponsor", "player",
];

export const ROUTE_ROLES = {
  // --- Always available to every authenticated account ---
  "/dashboard":                    ["any"],
  // Settings: allowed for all logged-in roles.
  "/dashboard/settings":           ["any"],
  // Barça chatbot — open to every authenticated user.
  "/dashboard/assistant":          ["any"],
  // Team chat / General group is for participants only — every authenticated
  // account EXCEPT fans (fans are spectator-only and must not be in General).
  "/dashboard/messages":           [...NON_FAN_ROLES],

  // --- Overview / club browsing ---
  "/dashboard/club":               ["admin", "head_coach", "assistant_coach", "team_manager", "sport_manager", "sponsor", "player", "fan"],
  // Trophy room is part of the public-facing club overview — open to fans and
  // all participant roles (listed explicitly rather than "any").
  "/dashboard/trophies":           ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst", "team_doctor", "physiotherapist", "team_manager", "sport_manager", "scout", "sponsor", "player", "fan"],
  "/dashboard/competitions":       ["admin", "head_coach", "assistant_coach", "performance_analyst", "team_manager", "sport_manager", "scout", "sponsor", "player", "fan"],
  "/dashboard/head-to-head":       ["admin", "head_coach", "assistant_coach", "performance_analyst", "team_manager", "scout", "player", "fan"],
  "/dashboard/world-cup":          ["admin", "head_coach", "assistant_coach", "performance_analyst", "team_manager", "scout", "sponsor", "player", "fan"],

  // --- People / squad ---
  "/dashboard/players":            ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst", "team_doctor", "physiotherapist", "team_manager", "sport_manager", "scout", "player"],
  "/dashboard/users":              ["admin"],
  "/dashboard/staff":              ["admin", "sport_manager", "team_manager"],
  "/dashboard/teams":              ["admin", "head_coach", "assistant_coach", "team_manager", "sport_manager"],

  // --- Operations ---
  "/dashboard/training":           ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "team_doctor", "physiotherapist", "team_manager", "player"],
  "/dashboard/training-analytics": ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst"],
  "/dashboard/matches":            ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst", "team_manager", "sport_manager", "scout", "sponsor", "player", "fan"],
  "/dashboard/medical":            ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "team_doctor", "physiotherapist", "player"],
  "/dashboard/scouting":           ["admin", "sport_manager", "scout"],
  "/dashboard/scouting-ops":       ["admin", "scout"],
  "/dashboard/contracts":          ["admin", "team_manager", "sport_manager"],

  // --- Analytics ---
  "/dashboard/analytics":          ["admin", "head_coach", "assistant_coach", "performance_analyst"],
  "/dashboard/analytics-detail":   ["admin", "head_coach", "assistant_coach", "performance_analyst"],
  "/dashboard/reports":            ["admin", "head_coach", "assistant_coach", "performance_analyst", "team_manager", "sport_manager", "scout"],

  // --- AI & Predictions ---
  // ML services — predictions/ratings consumed by analysts (and head coach).
  "/dashboard/ml-predict":         ["admin", "performance_analyst"],
  "/dashboard/ml-rating":          ["admin", "performance_analyst"],

  // --- Finance & sponsors ---
  "/dashboard/finance":            ["admin", "sponsor"],
  "/dashboard/sponsors":           ["admin", "sport_manager", "sponsor"],

  // --- Communication / misc ---
  "/dashboard/alerts":             ["admin", "head_coach", "team_doctor"],
};

// Roles that get a view-only UI: no add/edit/delete buttons.
export const READ_ONLY_ROLES = new Set(["fan", "player"]);

export function isReadOnly(role) {
  if (!role) return true;
  return READ_ONLY_ROLES.has(String(role).toLowerCase());
}

// Roles allowed to EDIT training (create/edit/complete/delete plans, sessions,
// drills, attendance, and rate drills). These are the coaching roles only.
// Everyone else who can open /dashboard/training (team_doctor, physiotherapist,
// team_manager, player) gets a READ-ONLY view. This mirrors the gateway, which
// restricts training writes to exactly these roles (a doctor's write -> 403).
export const TRAINING_EDITOR_ROLES = new Set([
  "admin",
  "head_coach",
  "assistant_coach",
  "specific_coach",
  "fitness_coach",
]);

export function canEditTraining(role) {
  if (!role) return false;
  return TRAINING_EDITOR_ROLES.has(String(role).toLowerCase());
}

// ── Medical injury-lifecycle per-stage action policy ─────────────────────────
// Each clinical stage of the injury journey (report → diagnosis → treatment →
// rehabilitation → recovery program → fitness test → recovered) is actionable
// ONLY by the responsible role; admin can do everything. These mirror the
// gateway, which restricts each stage's writes to the same roles (a wrong-role
// action would 403):
//   /diagnoses,/treatments        → ADMIN, TEAM_DOCTOR
//   /rehabilitations,/recovery-*  → ADMIN, PHYSIOTHERAPIST
//   /fitness-tests                → ADMIN, FITNESS_COACH
// The stepper/journey stays VIEWABLE for every allowed role; only the action
// buttons/forms for a stage are role-gated.
const norm = (role) => String(role || "").toLowerCase();

// DIAGNOSIS + TREATMENT → team_doctor only (+ admin).
const DOCTOR_ROLES = new Set(["admin", "team_doctor"]);
// REHABILITATION + RECOVERY (recovery program) → physiotherapist only (+ admin).
const PHYSIO_ROLES = new Set(["admin", "physiotherapist"]);
// FITNESS TEST → fitness_coach only (+ admin). "fitness" is accepted as an alias
// for the canonical "fitness_coach" token.
const FITNESS_ROLES = new Set(["admin", "fitness_coach", "fitness"]);

export function canDiagnose(role) {
  return DOCTOR_ROLES.has(norm(role));
}
export function canTreat(role) {
  return DOCTOR_ROLES.has(norm(role));
}
export function canRehab(role) {
  return PHYSIO_ROLES.has(norm(role));
}
export function canRecover(role) {
  return PHYSIO_ROLES.has(norm(role));
}
export function canFitnessTest(role) {
  return FITNESS_ROLES.has(norm(role));
}

// Sidebar grouping & display order. Same items, same role lists,
// just organized for the menu UI. Icons are attached in Sidebar.jsx.
// Sub/detail routes (analytics-detail, scouting-ops) are intentionally NOT
// listed here — they're reached from their parent page — but they remain in
// ROUTE_ROLES so the middleware still guards them.
export const SIDEBAR_SECTIONS = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard",    href: "/dashboard" },
      { name: "Club Hub",     href: "/dashboard/club" },
      { name: "Trophy Room",  href: "/dashboard/trophies" },
      { name: "World Cup",    href: "/dashboard/world-cup" },
      { name: "Barça Assistant", href: "/dashboard/assistant" },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Players",         href: "/dashboard/players" },
      { name: "User Management", href: "/dashboard/users" },
      { name: "Staff",           href: "/dashboard/staff" },
      { name: "Teams & Sports",  href: "/dashboard/teams" },
    ],
  },
  {
    title: "Operations",
    items: [
      { name: "Training",              href: "/dashboard/training" },
      { name: "Matches",               href: "/dashboard/matches" },
      { name: "Competitions",          href: "/dashboard/competitions" },
      { name: "Head-to-Head",          href: "/dashboard/head-to-head" },
      { name: "Medical",               href: "/dashboard/medical" },
      { name: "Scouting",              href: "/dashboard/scouting" },
      { name: "Contracts & Transfers", href: "/dashboard/contracts" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { name: "Overview",           href: "/dashboard/analytics" },
      { name: "Training Analytics", href: "/dashboard/training-analytics" },
      { name: "Reports",            href: "/dashboard/reports" },
    ],
  },
  {
    title: "AI & Predictions",
    items: [
      { name: "Match Predictor", href: "/dashboard/ml-predict" },
      { name: "Player Rating",   href: "/dashboard/ml-rating" },
    ],
  },
  {
    // Finance item intentionally removed from the visible sidebar. The
    // /dashboard/finance route stays in ROUTE_ROLES (admin, sponsor) so it
    // remains directly reachable, just not surfaced in the menu.
    title: "Finance & Sponsors",
    items: [
      { name: "Sponsors", href: "/dashboard/sponsors" },
    ],
  },
  {
    title: "Communication",
    items: [
      // Media hidden — no backend support yet.
      // Alerts removed from the sidebar — notifications now live in the top-bar
      // bell (NotificationBell). The /dashboard/alerts route still works; the
      // bell is the primary access point.
      { name: "Messages", href: "/dashboard/messages" },
      { name: "Settings", href: "/dashboard/settings" },
    ],
  },
];

function findRouteKey(pathname) {
  // Longest-prefix match so /dashboard/users/123 still matches /dashboard/users.
  // Exception: "/dashboard" is treated as exact-only so that unknown subpaths
  // like /dashboard/secret don't silently inherit its "any" rule.
  let best = null;
  for (const route of Object.keys(ROUTE_ROLES)) {
    const exact = pathname === route;
    const prefix = route !== "/dashboard" && pathname.startsWith(route + "/");
    if (exact || prefix) {
      if (!best || route.length > best.length) best = route;
    }
  }
  return best;
}

export function getAllowedRoles(pathname) {
  const key = findRouteKey(pathname);
  return key ? ROUTE_ROLES[key] : null;
}

export function canAccess(pathname, role) {
  if (!role) return false;
  const normalized = String(role).toLowerCase();
  // Admin is always allowed everywhere.
  if (normalized === "admin") return true;

  const allowed = getAllowedRoles(pathname);
  if (!allowed) return false; // unknown dashboard route -> deny by default

  return allowed.includes("any") || allowed.includes(normalized);
}
