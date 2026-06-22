// Resolves a message sender's REAL photo from the players API.
//
// Players returned by GET /players carry a real `photoUrl` keyed by their
// Keycloak id. The chat uses that photo when a sender is a player; for staff /
// non-players (who have no photo) it falls back to the initials PlayerAvatar.
//
// Like userDirectory.ensureLiveUsers, this loads once and is shared across all
// chat bubbles so we never re-fetch per message. Nothing here is mock data —
// every photo is the real URL stored on the player record.

let PHOTOS = null; // Map<keycloakId, { photoUrl, sport }>
let _promise = null;

/**
 * Load player photos once. `fetchPlayers` is injected (api.getPlayers) so this
 * module stays decoupled from the api singleton / import cycles.
 * Resolves to the photo map (also cached on the module).
 */
export function ensurePlayerPhotos(fetchPlayers) {
  if (PHOTOS) return Promise.resolve(PHOTOS);
  if (_promise) return _promise;
  _promise = Promise.resolve()
    .then(() => fetchPlayers())
    .then((r) => {
      const arr = Array.isArray(r) ? r : r?.data || r?.content || [];
      const map = {};
      for (const p of arr) {
        if (p && p.keycloakId && p.photoUrl) {
          map[p.keycloakId] = { photoUrl: p.photoUrl, sport: p.sport || null };
        }
      }
      PHOTOS = map;
      return PHOTOS;
    })
    .catch(() => {
      PHOTOS = {};
      return PHOTOS;
    });
  return _promise;
}

/** Real photo URL for a sender keycloakId, or null when not a player/no photo. */
export function photoFor(keycloakId) {
  if (!keycloakId || !PHOTOS) return null;
  const rec = PHOTOS[keycloakId];
  return rec ? rec.photoUrl : null;
}
