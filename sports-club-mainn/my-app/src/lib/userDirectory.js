// Maps the seeded Keycloak UUIDs to human-friendly names + roles.
// Every screen that previously rendered raw UUIDs like
// "00000000-0000-0000-0000-000000000101" should use lookupUser() so we
// show "Robert Lewandowski (Striker)" instead.
//
// The map mirrors:
//   user-management-service/bootstrap/SeedIds.java
//   user-management-service/bootstrap/UserDataSeeder.java
//   reports-analytics-service/bootstrap/ReportsDataSeeder.java
//
// For UUIDs we don't know about (real users added later), we fall back
// to a truncated "id…" display.

export const KNOWN_USERS = {
  // Club leadership
  "00000000-0000-0000-0000-000000000001": { name: "Admin",           role: "Admin",          tier: "leadership" },
  "00000000-0000-0000-0000-000000000010": { name: "Joan Laporta",    role: "Sport Manager",  tier: "leadership" },
  "00000000-0000-0000-0000-000000000011": { name: "Deco",            role: "Team Manager",   tier: "leadership" },

  // Coaching staff
  "00000000-0000-0000-0000-000000000020": { name: "Hansi Flick",      role: "Head Coach (FB)",    tier: "coaching" },
  "00000000-0000-0000-0000-000000000021": { name: "Joan Peñarroya",   role: "Head Coach (BB)",    tier: "coaching" },

  // Medical staff
  "00000000-0000-0000-0000-000000000030": { name: "Ricard Pruna",     role: "Team Doctor",        tier: "medical" },
  "00000000-0000-0000-0000-000000000031": { name: "Juanjo Brau",      role: "Physiotherapist",    tier: "medical" },
  "00000000-0000-0000-0000-000000000032": { name: "Albert Roca",      role: "Fitness Coach",      tier: "medical" },

  // Scouting / commercial / fan
  "00000000-0000-0000-0000-000000000040": { name: "Jordi Roura",      role: "Scout",              tier: "scouting" },
  "00000000-0000-0000-0000-000000000041": { name: "Spotify",          role: "Sponsor",            tier: "commercial" },
  "00000000-0000-0000-0000-000000000042": { name: "Aleix Garcia",     role: "Fan",                tier: "fan" },

  // Additional sponsors
  "00000000-0000-0000-0000-000000000050": { name: "Nike",             role: "Sponsor",            tier: "commercial" },
  "00000000-0000-0000-0000-000000000051": { name: "Damm",             role: "Sponsor",            tier: "commercial" },
  "00000000-0000-0000-0000-000000000052": { name: "Beko",             role: "Sponsor",            tier: "commercial" },

  // Players — football
  "00000000-0000-0000-0000-000000000101": { name: "Robert Lewandowski",    role: "Striker",        tier: "player", sport: "football" },
  "00000000-0000-0000-0000-000000000102": { name: "Pedri",                 role: "Midfielder",     tier: "player", sport: "football" },
  "00000000-0000-0000-0000-000000000103": { name: "Ronald Araújo",         role: "Centre-Back",    tier: "player", sport: "football" },
  "00000000-0000-0000-0000-000000000104": { name: "Marc-André ter Stegen", role: "Goalkeeper",     tier: "player", sport: "football" },

  // Players — basketball / tennis
  "00000000-0000-0000-0000-000000000105": { name: "Tomáš Satoranský",      role: "Point Guard",    tier: "player", sport: "basketball" },
  "00000000-0000-0000-0000-000000000106": { name: "Iván Suárez Navarro",   role: "Singles Player", tier: "player", sport: "tennis" },

  // Players — handball
  "00000000-0000-0000-0000-000000000107": { name: "Aleix Gómez",           role: "HB Left Back",   tier: "player", sport: "handball" },
  "00000000-0000-0000-0000-000000000108": { name: "Ludovic Fabregas",      role: "HB Centre-Back", tier: "player", sport: "handball" },
  "00000000-0000-0000-0000-000000000109": { name: "Domen Makuc",           role: "HB Left Wing",   tier: "player", sport: "handball" },
  "00000000-0000-0000-0000-000000000110": { name: "Dika Mem",              role: "HB Pivot",       tier: "player", sport: "handball" },

  // National team accounts
  "00000000-0000-0000-0000-000000000200": { name: "Spain National Team",   role: "National Team",  tier: "national" },
  "00000000-0000-0000-0000-000000000201": { name: "Uruguay National Team", role: "National Team",  tier: "national" },
};

/**
 * Look up a Keycloak UUID. Returns { name, role, tier, … } when known,
 * otherwise null.
 */
// Live directory: populated once from GET /users so chips resolve names for
// users that aren't in the static seed map. Synchronous readers pick it up
// after the (single, shared) fetch resolves.
let LIVE_USERS = null;
let _usersPromise = null;
export function ensureLiveUsers(fetchUsers) {
  if (LIVE_USERS || _usersPromise) return _usersPromise || Promise.resolve();
  _usersPromise = Promise.resolve()
    .then(() => fetchUsers())
    .then((r) => {
      const arr = Array.isArray(r) ? r : (r?.data || r?.content || []);
      const map = {};
      arr.forEach((u) => {
        if (u && u.keycloakId) {
          map[u.keycloakId] = {
            name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "User",
            role: u.role || u.effRole || null,
          };
        }
      });
      LIVE_USERS = map;
    })
    .catch(() => { LIVE_USERS = {}; });
  return _usersPromise;
}

export function lookupUser(keycloakId) {
  if (!keycloakId || typeof keycloakId !== "string") return null;
  return (LIVE_USERS && LIVE_USERS[keycloakId]) || KNOWN_USERS[keycloakId] || null;
}

/**
 * Get a display name for a Keycloak UUID.
 *   "00000000-0000-0000-0000-000000000101" -> "Robert Lewandowski"
 *   "ab12cd34-..."                          -> "User a…"
 *   null / undefined                        -> "—"
 */
export function displayUserName(keycloakId, fallbackLabel = "User") {
  if (!keycloakId) return "—";
  const u = lookupUser(keycloakId);
  if (u) return u.name;
  return `${fallbackLabel} ${shortenId(keycloakId)}`;
}

/**
 * Two-letter initials for an Avatar fallback.
 * "Robert Lewandowski" -> "RL", "Spotify" -> "SP".
 */
export function initialsFromName(name) {
  if (!name) return "?";
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Shortened UUID: "00000000-0000-…0101" or "a1b2c3…d4e5f6".
 * Use sparingly — prefer displayUserName.
 */
export function shortenId(id) {
  if (!id) return "—";
  const s = String(id);
  if (s.length <= 8) return s;
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}
