// Single source of truth for which roles can access which dashboard routes.
// Imported by both src/components/Sidebar.jsx (menu filtering) and
// middleware.js (server-side route guard). Keep these aligned.
//
// Special tokens:
//   "any"   -> any authenticated user
//   "admin" -> always allowed (handled in canAccess, no need to list)

// Fan gets a tight read-only subset: home + browsing of matches, players,
// teams, training and reports. No add/edit/delete (enforced in UI via
// isReadOnly()).
export const ROUTE_ROLES = {
  "/dashboard":                    ["any"],
  "/dashboard/club":               ["any"],
  "/dashboard/trophies":           ["any"],
  "/dashboard/competitions":       ["admin", "head_coach", "assistant_coach", "performance_analyst", "sport_manager", "team_manager", "fan"],
  "/dashboard/head-to-head":       ["admin", "head_coach", "assistant_coach", "performance_analyst", "sport_manager", "team_manager", "scout", "fan"],
  "/dashboard/world-cup":          ["admin", "head_coach", "assistant_coach", "performance_analyst", "sport_manager", "team_manager", "scout", "fan"],
  "/dashboard/players":            ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst", "team_doctor", "physiotherapist", "team_manager", "fan"],
  "/dashboard/users":              ["admin"],
  "/dashboard/staff":              ["admin", "sport_manager", "team_manager"],
  "/dashboard/teams":              ["admin", "sport_manager", "team_manager", "head_coach", "fan"],
  "/dashboard/training":           ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "fan"],
  "/dashboard/matches":            ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst", "team_doctor", "physiotherapist", "team_manager", "sport_manager", "scout", "sponsor", "fan"],
  "/dashboard/medical":            ["admin", "team_doctor", "physiotherapist", "head_coach"],
  // /dashboard/medical-records was a duplicate of /dashboard/medical — removed.
  "/dashboard/scouting":           ["admin", "scout"],
  "/dashboard/scouting-ops":       ["admin", "scout"],
  "/dashboard/contracts":          ["admin", "sport_manager", "team_manager"],
  "/dashboard/analytics":          ["admin", "head_coach", "performance_analyst", "scout"],
  "/dashboard/analytics-detail":   ["admin", "head_coach", "performance_analyst", "scout"],
  "/dashboard/training-analytics": ["admin", "head_coach", "performance_analyst"],
  "/dashboard/reports":            ["admin", "scout", "fan"],
  // Finance hidden — no backend endpoints; re-enable when backend lands.
  // "/dashboard/finance":         ["admin", "sponsor"],
  "/dashboard/sponsors":           ["admin", "sponsor"],
  // Media hidden — no backend support yet.
  // "/dashboard/media":            ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst", "team_doctor", "physiotherapist", "team_manager"],
  // Team chat is for EVERYONE — every account (incl. new players/fans) lands in
  // the General group. Fans can read/post in General but can't create groups
  // (enforced in the chat UI via canCreateGroups).
  "/dashboard/messages":           ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst", "team_doctor", "physiotherapist", "team_manager", "sport_manager", "scout", "sponsor", "player", "fan"],
  "/dashboard/alerts":             ["admin", "head_coach", "team_doctor"],
  "/dashboard/settings":           ["admin", "head_coach", "assistant_coach", "specific_coach", "fitness_coach", "performance_analyst", "team_doctor", "physiotherapist", "team_manager", "sport_manager", "scout", "sponsor"],

  // ML services — predictions/ratings consumed by coaches, analysts and scouts.
  "/dashboard/ml-predict":         ["admin", "head_coach", "assistant_coach", "performance_analyst", "scout"],
  "/dashboard/ml-rating":          ["admin", "head_coach", "performance_analyst", "scout"],
};

// Roles that get a view-only UI: no add/edit/delete buttons.
export const READ_ONLY_ROLES = new Set(["fan"]);

export function isReadOnly(role) {
  if (!role) return true;
  return READ_ONLY_ROLES.has(String(role).toLowerCase());
}

// Sidebar grouping & display order. Same items, same role lists,
// just organized for the menu UI. Icons are attached in Sidebar.jsx.
export const SIDEBAR_SECTIONS = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard",    href: "/dashboard" },
      { name: "Club Hub",     href: "/dashboard/club" },
      { name: "Trophy Room",  href: "/dashboard/trophies" },
      { name: "World Cup",    href: "/dashboard/world-cup" },
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
    title: "Finance & Sponsors",
    items: [
      // Finance hidden — no backend support yet.
      { name: "Sponsors", href: "/dashboard/sponsors" },
    ],
  },
  {
    title: "Communication",
    items: [
      // Media hidden — no backend support yet.
      { name: "Messages", href: "/dashboard/messages" },
      { name: "Alerts",   href: "/dashboard/alerts" },
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
