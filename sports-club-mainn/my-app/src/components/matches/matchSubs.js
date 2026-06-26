// ─────────────────────────────────────────────────────────────────────────────
// SUBSTITUTION encoding — shared between the live match panel (which records a
// real SUBSTITUTION match-event) and the post-match review form (which reads
// those events to learn which substitutes actually came on).
//
// The backend MatchEvent has a SINGLE playerKeycloakId (no separate in/out
// fields), so a SUBSTITUTION records the player going OFF in playerKeycloakId and
// captures BOTH players — keycloak ids + numeric DB ids + names — in a parseable
// tag inside the description. The numeric DB ids let the review form resolve
// which substitutes came on (it keys on player.id); the keycloak ids let the live
// timeline render faces and rebuild the on-pitch set on reload. Shape:
//
//     [SUB out=#13|kc:<uuid> in=#27|kc:<uuid>] <Out Name> ➜ <In Name>
//
// An injury substitution additionally carries the literal " (injury)" suffix so
// it can be excluded from the normal-substitution count.
// ─────────────────────────────────────────────────────────────────────────────

export const SUB_TAG = "[SUB";

export const buildSubDescription = (out, inn) =>
  `${SUB_TAG} out=#${out.id}|kc:${out.keycloakId || ""} in=#${inn.id}|kc:${inn.keycloakId || ""}] ` +
  `${out.firstName} ${out.lastName} ➜ ${inn.firstName} ${inn.lastName}`;

const SUB_RE = /\[SUB\s+out=#(\d+)\|kc:([^\s]*)\s+in=#(\d+)\|kc:([^\]\s]*)\]/i;

// Parse a SUBSTITUTION description → { outId, outKc, inId, inKc } or null.
export const parseSubDescription = (desc) => {
  const m = SUB_RE.exec(String(desc || ""));
  if (!m) return null;
  return { outId: Number(m[1]), outKc: m[2] || null, inId: Number(m[3]), inKc: m[4] || null };
};
