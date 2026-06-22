// Shared constants + helpers for the FC Barcelona GROUP CHAT system.
//
// Groups are now FIRST-CLASS backend entities (no more subject-marker hacks):
//
//   * GROUPS — api.chatGroups.mine(userKc) returns every group the user belongs
//     to (status MEMBER), General first. The General group is flagged general:true
//     and its membership is implicit (everyone in the system). User-created groups
//     carry a real member list with per-user status (MEMBER / INVITED).
//
//   * INVITATIONS — api.chatGroups.invitations(userKc) returns groups where the
//     user is INVITED but has not accepted. They appear in an "Invitations"
//     section with Accept/Decline and only join the sidebar after accepting.
//
//   * MESSAGES — every group line carries a real numeric `groupId`. A message is
//     sent with recipient "group:<id>" + subject "GRP" (both must be non-blank
//     for backend validation) and groupId set. The thread for a group is the set
//     of messages whose m.groupId === selectedGroupId.
//
//   * REACTIONS — there is still no reactions column, so each reaction is a tiny
//     child message: content "[REACT <emoji>]", parentMessageId -> reacted msg,
//     and the SAME groupId so it lives in the group. On load these markers are
//     pulled out of the visible thread and aggregated into reaction pills.

// FC Barcelona crest — fallback photo for the General group if the backend omits one.
export const BARCA_CREST = "https://crests.football-data.org/81.png";

// The backend group has only a `photoUrl` string column (no avatar field). To let
// a creator keep a PRESET EMOJI avatar without showing a broken image, we encode
// the emoji into photoUrl with this marker and decode it back on read.
export const EMOJI_PHOTO_PREFIX = "emoji:";
export function encodeAvatarPhoto(photoUrl, avatar) {
  if (photoUrl) return photoUrl;
  if (avatar) return `${EMOJI_PHOTO_PREFIX}${avatar}`;
  return null;
}

// Recipient sentinel + subject used on every group message. The backend ignores
// the recipient for routing (it routes by groupId) but validates it is non-blank,
// so we encode "group:<id>" purely to satisfy validation + stay human-readable.
export function groupRecipient(groupId) {
  return `group:${groupId}`;
}
export const GROUP_SUBJECT = "GRP";

// ── Reaction markers ──────────────────────────────────────────────────────
export const REACT_PREFIX = "[REACT";
export const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏"];

export function isReactionMarker(msg) {
  return typeof msg?.content === "string" && msg.content.trimStart().startsWith(REACT_PREFIX);
}
export function parseReactionEmoji(content) {
  if (typeof content !== "string") return null;
  const m = content.trim().match(/^\[REACT\s+(.+?)\]/u);
  return m ? m[1].trim() : null;
}
export function reactionContent(emoji) {
  return `${REACT_PREFIX} ${emoji}]`;
}

// ── Preset avatars offered when a creator doesn't upload a photo ──────────
export const PRESET_AVATARS = [
  "⚽", "🏀", "🤾", "🎾", "🏆", "🔥", "⭐", "💪",
  "🧤", "🩺", "📋", "🎯", "🛡️", "🚑", "📈", "🗞️",
];

// ── Time formatting ───────────────────────────────────────────────────────
export function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
export function formatDayLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const today = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}
export function dayKey(iso) {
  if (!iso) return "pending";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "pending";
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Window (ms) within which a poster counts as "active now" (polling fallback).
export const ACTIVE_WINDOW_MS = 10 * 60 * 1000;

export function recentActiveSenders(thread, windowMs = ACTIVE_WINDOW_MS, now = Date.now()) {
  const active = new Set();
  if (!Array.isArray(thread)) return active;
  for (const m of thread) {
    if (!m?.sender || !m?.sentAt) continue;
    const t = new Date(m.sentAt).getTime();
    if (Number.isNaN(t)) continue;
    if (now - t <= windowMs) active.add(m.sender);
  }
  return active;
}

export function distinctParticipants(thread) {
  const s = new Set();
  if (!Array.isArray(thread)) return s;
  for (const m of thread) if (m?.sender) s.add(m.sender);
  return s;
}

// Normalise whatever an API returns into a flat array.
export function asArray(r) {
  return Array.isArray(r) ? r : r?.data || r?.content || [];
}

// True if two group ids refer to the same group (ids may be number or string).
export function sameGroupId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

// ── Normalise a backend group DTO into the shape the UI renders ───────────
// Backend: { id, name, description, photoUrl, general, createdBy, myStatus,
//            members:[{userKeycloakId,status}], createdAt }
export function normalizeGroup(g) {
  if (!g) return null;
  const memberObjs = Array.isArray(g.members) ? g.members : [];
  // Active members = those who have actually joined (MEMBER), used for counts.
  const memberIds = memberObjs
    .filter((m) => (m.status || "MEMBER").toUpperCase() === "MEMBER")
    .map((m) => m.userKeycloakId)
    .filter(Boolean);
  const invitedIds = memberObjs
    .filter((m) => (m.status || "").toUpperCase() === "INVITED")
    .map((m) => m.userKeycloakId)
    .filter(Boolean);
  // Decode an emoji-avatar that was stashed in the photoUrl column.
  const rawPhoto = g.photoUrl || null;
  const isEmojiPhoto = typeof rawPhoto === "string" && rawPhoto.startsWith(EMOJI_PHOTO_PREFIX);
  const photoUrl = isEmojiPhoto ? null : rawPhoto;
  const avatar = isEmojiPhoto ? rawPhoto.slice(EMOJI_PHOTO_PREFIX.length) : g.avatar || null;
  return {
    id: g.id,
    name: g.name || "Group",
    description: g.description || "",
    photoUrl,
    avatar,
    isGeneral: g.general === true,
    createdBy: g.createdBy || null,
    myStatus: (g.myStatus || "").toUpperCase() || null,
    members: memberIds,
    invited: invitedIds,
    rawMembers: memberObjs,
    createdAt: g.createdAt || null,
  };
}

/**
 * Build one group's visible thread from the full message list, filtered by the
 * real numeric groupId. Strips reaction markers into aggregated pills and
 * resolves reply previews.
 *
 * @param {Array} allMessages raw messages from api.getAllMessages()
 * @param {string|number} groupId the group to build
 * @param {string|null} myId current user's keycloakId (flags own reactions)
 */
export function buildGroupThread(allMessages, groupId, myId) {
  const list = asArray(allMessages).filter((m) => sameGroupId(m?.groupId, groupId));

  const byId = new Map();
  list.forEach((m) => byId.set(m.id, m));

  // Aggregate reaction markers per parent message id.
  const reactionsByParent = new Map();
  for (const m of list) {
    if (!isReactionMarker(m)) continue;
    const emoji = parseReactionEmoji(m.content);
    if (!emoji || m.parentMessageId == null) continue;
    if (!reactionsByParent.has(m.parentMessageId)) reactionsByParent.set(m.parentMessageId, new Map());
    const bucket = reactionsByParent.get(m.parentMessageId);
    if (!bucket.has(emoji)) bucket.set(emoji, { count: 0, users: new Set() });
    const entry = bucket.get(emoji);
    if (!entry.users.has(m.senderUserKeycloakId)) {
      entry.users.add(m.senderUserKeycloakId);
      entry.count += 1;
    }
  }

  const visible = list
    .filter((m) => !isReactionMarker(m))
    .sort((a, b) => {
      const ta = new Date(a.sentAt || 0).getTime();
      const tb = new Date(b.sentAt || 0).getTime();
      if (ta !== tb) return ta - tb;
      return (a.id || 0) - (b.id || 0);
    })
    .map((m) => {
      const bucket = reactionsByParent.get(m.id);
      const reactions = bucket
        ? [...bucket.entries()].map(([emoji, info]) => ({
            emoji,
            count: info.count,
            users: [...info.users],
            mine: myId ? info.users.has(myId) : false,
          }))
        : [];

      let reply = null;
      if (m.parentMessageId != null) {
        const parent = byId.get(m.parentMessageId);
        if (parent && !isReactionMarker(parent)) {
          reply = { id: parent.id, sender: parent.senderUserKeycloakId, content: parent.content };
        }
      }
      return {
        id: m.id,
        clientMsgId: m.clientMsgId || null,
        sender: m.senderUserKeycloakId,
        content: m.content,
        sentAt: m.sentAt,
        groupId: m.groupId,
        reactions,
        reply,
      };
    });

  return { visible };
}

// Roles that may NOT create groups or invite members (read-only fans).
export function canCreateGroups(role) {
  const r = String(role || "").toLowerCase();
  if (!r) return false;
  return r !== "fan";
}
