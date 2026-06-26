"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Smile,
  X,
  CornerUpLeft,
  Users,
  Reply,
  ChevronLeft,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  Mail,
  Check,
  Clock,
  LogOut,
  MoreVertical,
} from "lucide-react";
import { api } from "../../lib/api";
import {
  lookupUser,
  displayUserName,
  ensureLiveUsers,
} from "@/src/lib/userDirectory";
import PlayerAvatar from "@/src/components/shared/PlayerAvatar";
import { ensurePlayerPhotos, photoFor } from "./senderDirectory";
import {
  BARCA_CREST,
  REACTIONS,
  reactionContent,
  groupRecipient,
  GROUP_SUBJECT,
  encodeAvatarPhoto,
  buildGroupThread,
  normalizeGroup,
  sameGroupId,
  formatTime,
  formatDayLabel,
  dayKey,
  recentActiveSenders,
  distinctParticipants,
  canCreateGroups,
  isFanRole,
  excludeFanMembers,
  asArray,
  ACTIVE_WINDOW_MS,
} from "./groupChat";
import useChatSocket from "./useChatSocket";
import CreateGroupModal from "./CreateGroupModal";

const COMPOSER_EMOJIS = ["⚽", "🔥", "💪", "❤️", "👏", "😂", "👍", "🎉", "🙌", "🇪🇸"];
const POLL_MS = 4000;

// ── Current user identity (same mechanism the old Messages used) ───────────
function getCurrentKeycloakId() {
  if (typeof window === "undefined") return null;
  const direct = localStorage.getItem("keycloakId");
  if (direct) return direct;
  try {
    const info = JSON.parse(localStorage.getItem("user_info") || "{}");
    if (info.keycloakId) return info.keycloakId;
  } catch {
    /* ignore */
  }
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
    return payload.sub || null;
  } catch {
    return null;
  }
}

function getCurrentName(meId) {
  if (typeof window !== "undefined") {
    try {
      const info = JSON.parse(localStorage.getItem("user_info") || "{}");
      if (info.name) return info.name;
      if (info.username) return info.username;
    } catch {
      /* ignore */
    }
  }
  return senderName(meId);
}

function getCurrentRole() {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem("user_role") || "").toLowerCase();
}

const SWATCHES = [
  { fg: "rgb(110,231,183)" },
  { fg: "rgb(147,197,253)" },
  { fg: "rgb(216,180,254)" },
  { fg: "rgb(252,211,77)" },
  { fg: "rgb(253,164,175)" },
  { fg: "rgb(125,211,252)" },
];
function swatchFor(text) {
  if (!text) return SWATCHES[0];
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return SWATCHES[hash % SWATCHES.length];
}

function senderName(keycloakId) {
  const known = lookupUser(keycloakId);
  return known ? known.name : displayUserName(keycloakId, "Member");
}
function senderRole(keycloakId) {
  const known = lookupUser(keycloakId);
  return known?.role || null;
}

// Avatar for a person (real player photo when we have one, else initials).
function Avatar({ keycloakId, size = 38, ring = true }) {
  const name = senderName(keycloakId);
  const role = senderRole(keycloakId);
  const photo = photoFor(keycloakId);
  const [broken, setBroken] = useState(false);
  const title = name + (role ? ` — ${role}` : "");

  if (photo && !broken) {
    return (
      <img
        src={photo}
        alt={name}
        title={title}
        onError={() => setBroken(true)}
        className={`rounded-full object-cover shrink-0 select-none ${ring ? "ring-2 ring-slate-700/60" : ""}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <PlayerAvatar
      name={name}
      sport="General"
      size={size}
      className={`rounded-full shrink-0 select-none ${ring ? "ring-2 ring-slate-700/60" : ""}`}
    />
  );
}

// Avatar for a GROUP (photo / preset emoji / crest for General).
function GroupAvatar({ group, size = 44 }) {
  const [broken, setBroken] = useState(false);
  const radius = Math.round(size * 0.28);
  const generalSrc = group?.photoUrl || BARCA_CREST;
  if (group?.isGeneral) {
    return (
      <img
        src={generalSrc}
        alt="General"
        className="bg-white/5 border border-white/10 object-contain p-1 rounded-2xl"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  if (group?.photoUrl && !broken) {
    return (
      <img
        src={group.photoUrl}
        alt={group.name}
        onError={() => setBroken(true)}
        className="object-cover border border-slate-700"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <div
      className="bg-emerald-500/10 border border-emerald-500/30 grid place-items-center"
      style={{ width: size, height: size, borderRadius: radius, fontSize: Math.round(size * 0.5) }}
    >
      {group?.avatar || "💬"}
    </div>
  );
}

export default function Messages() {
  const [meId, setMeId] = useState(null);
  const [meName, setMeName] = useState("Member");
  const [role, setRole] = useState("");
  const [dirReady, setDirReady] = useState(false);

  const [groups, setGroups] = useState([]); // normalized groups I belong to (General first)
  const [invitations, setInvitations] = useState([]); // normalized groups I'm INVITED to
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [generalMembers, setGeneralMembers] = useState([]); // keycloakIds — everyone (for General)
  const [thread, setThread] = useState([]);
  const [pending, setPending] = useState([]); // optimistic sends not yet seen in the persisted thread

  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pickerForId, setPickerForId] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const [showRailMobile, setShowRailMobile] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [actingInvite, setActingInvite] = useState(null); // group id being accepted/declined
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false); // group header "…" menu
  const [leaveConfirm, setLeaveConfirm] = useState(null); // group pending a "leave" confirm
  const [leaving, setLeaving] = useState(false);

  const scrollRef = useRef(null);
  const composerRef = useRef(null);
  const prevCountRef = useRef(0);
  const stickToBottomRef = useRef(true);
  const activeGroupRef = useRef(activeGroupId);
  useEffect(() => {
    activeGroupRef.current = activeGroupId;
  }, [activeGroupId]);
  const generalRosterLoadedRef = useRef(false); // fetch the General roster once

  // ── Boot: identity + directories ─────────────────────────────────────────
  useEffect(() => {
    const id = getCurrentKeycloakId();
    setMeId(id);
    setRole(getCurrentRole());
    Promise.all([
      ensureLiveUsers(() => api.getUsers()).catch(() => {}),
      ensurePlayerPhotos(() => api.getPlayers()).catch(() => {}),
    ]).finally(() => {
      setMeName(getCurrentName(id));
      setDirReady(true);
    });
    // Real users directory for the create-group member picker + General roster.
    api
      .getUsers()
      .then((r) =>
        setUsersList(
          // Fans are spectator-only — never offer them as group members/invitees.
          excludeFanMembers(asArray(r))
            .filter((u) => u && u.keycloakId)
            .map((u) => ({
              keycloakId: u.keycloakId,
              name:
                [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                u.username ||
                senderName(u.keycloakId),
              role: u.role || null,
            }))
        )
      )
      .catch(() => {});
  }, []);

  // Tick "now" every 30s so the active-window stays honest.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Load my groups + invitations from the real backend ───────────────────
  const loadGroups = useCallback(
    async (myId, { silent } = {}) => {
      if (!myId) return;
      try {
        const [mineRaw, invitesRaw] = await Promise.all([
          api.chatGroups.mine(myId).catch(() => []),
          api.chatGroups.invitations(myId).catch(() => []),
        ]);
        const mine = asArray(mineRaw).map(normalizeGroup).filter(Boolean);
        // General first, then by createdAt desc, then name.
        mine.sort((a, b) => {
          if (a.isGeneral !== b.isGeneral) return a.isGeneral ? -1 : 1;
          const ta = new Date(a.createdAt || 0).getTime();
          const tb = new Date(b.createdAt || 0).getTime();
          if (ta !== tb) return tb - ta;
          return (a.name || "").localeCompare(b.name || "");
        });
        setGroups(mine);
        setInvitations(asArray(invitesRaw).map(normalizeGroup).filter(Boolean));

        // The General group's membership is implicit (everyone) — its members
        // array comes back empty, so we populate it from the full users list.
        // Fetch this roster once (not on every 4s poll) to avoid hammering /users.
        const general = mine.find((g) => g.isGeneral);
        if (general && !generalRosterLoadedRef.current) {
          generalRosterLoadedRef.current = true;
          try {
            // Pull the full users list (carries each user's role) so we can keep
            // fans OUT of the implicit General roster — fans are spectator-only
            // and must never appear as members of the team chat.
            const all = await api.getUsers().catch(() => []);
            const nonFanUsers = excludeFanMembers(asArray(all));
            const nonFanIds = new Set(
              nonFanUsers.map((u) => u.keycloakId).filter(Boolean)
            );
            const fanIds = new Set(
              asArray(all)
                .filter((u) => u && isFanRole(u.role))
                .map((u) => u.keycloakId)
                .filter(Boolean)
            );
            const memRaw = await api.chatGroups.members(general.id).catch(() => []);
            const mem = asArray(memRaw)
              .map((m) => (typeof m === "string" ? m : m.userKeycloakId))
              .filter(Boolean)
              // Drop any fan the backend included in the implicit membership.
              .filter((id) => !fanIds.has(id));
            if (mem.length) {
              setGeneralMembers(mem);
            } else {
              setGeneralMembers([...nonFanIds]);
            }
          } catch {
            generalRosterLoadedRef.current = false; // allow a retry next poll
          }
        }

        // Pick an initial active group (General) if none selected yet.
        setActiveGroupId((cur) => {
          if (cur != null && mine.some((g) => sameGroupId(g.id, cur))) return cur;
          return general ? general.id : mine[0]?.id ?? null;
        });
      } catch (err) {
        console.error("Failed to load groups", err);
        if (!silent) setError("Could not load your chats.");
      } finally {
        if (!silent) setGroupsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!meId) return;
    setGroupsLoading(true);
    loadGroups(meId);
  }, [meId, loadGroups]);

  // ── Load all messages -> active thread (filtered by real groupId) ────────
  const loadThread = useCallback(
    async (myId, groupId, { silent } = {}) => {
      if (groupId == null) {
        setThread([]);
        if (!silent) setLoading(false);
        return;
      }
      try {
        // Fetch the group's whole thread directly (works for every member, not
        // just admins) instead of pulling all messages and filtering.
        const all = await api.getMessagesByGroup(groupId).catch(() => api.getAllMessages());
        const { visible } = buildGroupThread(all, groupId, myId);
        setThread(visible);
        // Retire optimistic sends for THIS group once their persisted copy has
        // landed in the thread (match by clientMsgId when present, else by
        // sender+content+near-time). After this the merge renders the persisted
        // row directly — still a single "sent" (✓) bubble, never a duplicate.
        // Pending sends for OTHER groups are left untouched.
        setPending((prev) =>
          prev.filter((p) => {
            if (!sameGroupId(p.groupId, groupId)) return true; // keep other groups
            return !visible.some((v) => v.id != null && isSameMessage(v, p));
          })
        );
        setError(null);
      } catch (err) {
        console.error("Failed to load messages", err);
        if (!silent) setError("Could not load chats. Please try again.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  // Initial + on group switch.
  useEffect(() => {
    if (activeGroupId == null) return;
    setLoading(true);
    setPending([]);
    stickToBottomRef.current = true;
    loadThread(meId, activeGroupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meId, activeGroupId]);

  // Polling fallback — keeps chat + invitations + presence alive when WS is down.
  useEffect(() => {
    if (!meId) return;
    const id = setInterval(() => {
      loadThread(meId, activeGroupRef.current, { silent: true });
      loadGroups(meId, { silent: true });
      setNow(Date.now());
    }, POLL_MS);
    return () => clearInterval(id);
  }, [meId, loadThread, loadGroups]);

  // ── WebSocket: live delivery + REAL presence ─────────────────────────────
  const handleWsChat = useCallback((frame) => {
    if (!frame || frame.type !== "chat") return;
    const gid = frame.groupId;
    // Only render live frames for the group currently open; the rest load when
    // the user opens that group (the persisted copy is fetched then).
    if (!sameGroupId(gid, activeGroupRef.current)) return;
    const incoming = {
      id: null,
      clientMsgId: frame.clientMsgId || null,
      groupId: gid,
      sender: frame.senderKeycloakId,
      content: frame.content,
      sentAt: frame.sentAt || new Date().toISOString(),
      reactions: [],
      reply: null,
      live: true,
    };
    setPending((prev) => {
      // Dedupe: never add a frame we already have (our own echo or a repeat).
      if (prev.some((p) => isSameMessage(p, incoming))) return prev;
      stickToBottomRef.current = true;
      return [...prev, incoming];
    });
  }, []);

  const { status: wsStatus, onlineCount, onlineUsers, sendChat } = useChatSocket({
    userId: meId,
    userName: meName,
    onChat: handleWsChat,
  });

  // ── Merge persisted thread + pending optimistic/live ─────────────────────
  // CRITICAL (WhatsApp single-bubble): a sent message must ALWAYS be exactly one
  // bubble that goes clock -> check. We do this by REPLACING in place, never
  // add-then-remove:
  //   * For each persisted message that matches a pending optimistic one
  //     (by clientMsgId, else sender+content+near-time), we MERGE the persisted
  //     copy ONTO the pending record so it keeps the pending record's stable
  //     React key (cmsg-<clientMsgId>) and shows status "sent" (✓).
  //   * The persisted copy is then NOT rendered as its own row, so there is no
  //     second bubble at any point.
  //   * Pending sends with no persisted match yet stay as "sending" (clock).
  const mergedThread = useMemo(() => {
    const mine = pending.filter((p) => sameGroupId(p.groupId, activeGroupId));
    if (mine.length === 0) return thread;

    // Index persisted messages that have been claimed by a pending bubble.
    const claimed = new Set(); // indices into `thread`
    const rows = [];

    for (const p of mine) {
      const idx = thread.findIndex((v, i) => !claimed.has(i) && isSameMessage(v, p));
      if (idx >= 0) {
        claimed.add(idx);
        const persisted = thread[idx];
        // Merge persisted fields (real id, server reactions/reply) onto the
        // optimistic record, but keep clientMsgId so the bubble's key is stable.
        rows.push({
          ...persisted,
          clientMsgId: p.clientMsgId,
          live: false,
          status: "sent",
        });
      } else {
        // Still in flight — keep showing the optimistic bubble (clock).
        rows.push({ ...p, status: p.status || "sending" });
      }
    }

    // Persisted messages NOT claimed by a pending bubble render normally.
    for (let i = 0; i < thread.length; i++) {
      if (!claimed.has(i)) rows.push(thread[i]);
    }

    return rows.sort(
      (a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()
    );
  }, [thread, pending, activeGroupId]);

  // ── Scroll handling ──────────────────────────────────────────────────────
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = dist < 120;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const grew = mergedThread.length !== prevCountRef.current;
    prevCountRef.current = mergedThread.length;
    if (grew && stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [mergedThread]);

  // Close pickers on outside click.
  useEffect(() => {
    const onDocClick = (e) => {
      if (composerRef.current && !composerRef.current.contains(e.target)) setShowEmoji(false);
      if (!e.target.closest?.("[data-reaction-ui]")) setPickerForId(null);
      if (!e.target.closest?.("[data-header-menu]")) setHeaderMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ── Active group ─────────────────────────────────────────────────────────
  const activeGroup =
    groups.find((g) => sameGroupId(g.id, activeGroupId)) || groups[0] || null;

  // ── Presence: REAL from WS when available, else activity-based fallback ──
  const activitySet = useMemo(
    () => recentActiveSenders(mergedThread, ACTIVE_WINDOW_MS, now),
    [mergedThread, now]
  );
  const wsLive = wsStatus === "live" && onlineCount != null;
  const presenceSet = wsLive && onlineUsers.size ? onlineUsers : activitySet;
  const activeCount = wsLive ? onlineCount : activitySet.size;

  const participants = useMemo(() => distinctParticipants(mergedThread), [mergedThread]);

  // Roster ids for the active group: everyone for General, the real member list
  // (joined MEMBERs) for custom groups.
  const rosterIds = useMemo(() => {
    if (!activeGroup) return [];
    if (activeGroup.isGeneral) {
      const ids = new Set(generalMembers);
      // Make sure recent posters are represented even before the roster loads.
      for (const id of participants) ids.add(id);
      return [...ids];
    }
    const ids = new Set(activeGroup.members);
    if (activeGroup.createdBy) ids.add(activeGroup.createdBy);
    return [...ids];
  }, [activeGroup, generalMembers, participants]);

  const totalMembers = rosterIds.length;

  // Members rail for the active group, online first then by name.
  const members = useMemo(() => {
    if (!activeGroup) return [];
    const lastByUser = new Map();
    for (const m of mergedThread) {
      const t = new Date(m.sentAt).getTime();
      const prev = lastByUser.get(m.sender);
      if (prev == null || t > prev) lastByUser.set(m.sender, t);
    }
    return rosterIds
      .map((id) => ({
        id,
        online: presenceSet.has(id),
        lastAt: lastByUser.get(id) || 0,
      }))
      .sort((a, b) => {
        if (a.online !== b.online) return a.online ? -1 : 1;
        if (b.lastAt !== a.lastAt) return b.lastAt - a.lastAt;
        return senderName(a.id).localeCompare(senderName(b.id));
      });
  }, [activeGroup, rosterIds, mergedThread, presenceSet]);

  // ── Send a message ───────────────────────────────────────────────────────
  const handleSend = async () => {
    // Fans are spectator-only and cannot post in any chat (defense-in-depth;
    // the route guard already keeps them off this page).
    if (isFanRole(role)) return;
    const text = draft.trim();
    if (!text || sending) return;
    const myId = meId || getCurrentKeycloakId();
    if (!myId) {
      setError("We couldn't identify your account — please sign in again.");
      return;
    }
    const gid = activeGroupId;
    if (gid == null) return;
    setSending(true);
    stickToBottomRef.current = true;
    const sentAt = new Date().toISOString();
    const clientMsgId = `c-${myId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Optimistic add — ONE bubble rendered immediately with a "sending" (clock)
    // status. The persisted copy is later MERGED into this same record by
    // clientMsgId (see mergedThread), flipping the clock to a check — we never
    // append a second bubble.
    const optimistic = {
      id: null,
      clientMsgId,
      groupId: gid,
      sender: myId,
      content: text,
      sentAt,
      reactions: [],
      reply: replyTo ? { id: replyTo.id, sender: replyTo.sender, content: replyTo.content } : null,
      live: true,
      status: "sending",
    };
    setPending((prev) => [...prev, optimistic]);
    setDraft("");
    const repliedTo = replyTo;
    setReplyTo(null);
    setShowEmoji(false);

    try {
      // 1) Persist (durable) with the real groupId. The POST returns the created
      //    row — flip THIS bubble to "sent" (✓) immediately with its real id, so
      //    the check shows the instant the server confirms, before any refetch.
      const saved = await api.createMessage({
        senderUserKeycloakId: myId,
        recipientUserKeycloakId: groupRecipient(gid),
        subject: GROUP_SUBJECT,
        content: text,
        status: "SENT",
        groupId: gid,
        parentMessageId: repliedTo ? repliedTo.id : null,
      });
      setPending((prev) =>
        prev.map((p) =>
          p.clientMsgId === clientMsgId
            ? { ...p, id: saved?.id ?? p.id, status: "sent", live: false }
            : p
        )
      );
      // 2) Broadcast over WS so others get it instantly (no-op if WS is down).
      //    Include clientMsgId so our own echo is deduped, not double-rendered.
      sendChat({
        groupId: gid,
        senderKeycloakId: myId,
        senderName: meName,
        content: text,
        sentAt,
        clientMsgId,
      });
      await loadThread(myId, gid);
    } catch (err) {
      console.error("Failed to post message", err);
      setError(err.message || "Failed to send your message.");
      // Roll back the optimistic bubble so it doesn't linger as "sending".
      setPending((prev) => prev.filter((p) => p.clientMsgId !== clientMsgId));
    } finally {
      setSending(false);
    }
  };

  // ── React (toggle) ───────────────────────────────────────────────────────
  const handleReact = async (msg, emoji) => {
    const myId = meId || getCurrentKeycloakId();
    if (!myId || msg.live || msg.id == null) return; // can't react to a not-yet-persisted msg
    setPickerForId(null);
    const existing = msg.reactions.find((r) => r.emoji === emoji && r.mine);
    const gid = activeGroupId;
    try {
      if (existing) {
        const all = await api.getMessagesByGroup(gid).catch(() => []);
        const list = asArray(all);
        const marker = list.find(
          (m) =>
            m.parentMessageId === msg.id &&
            m.senderUserKeycloakId === myId &&
            typeof m.content === "string" &&
            m.content.includes(emoji) &&
            m.content.trim().startsWith("[REACT")
        );
        if (marker) await api.deleteMessage(marker.id);
      } else {
        await api.createMessage({
          senderUserKeycloakId: myId,
          recipientUserKeycloakId: groupRecipient(gid),
          subject: GROUP_SUBJECT,
          content: reactionContent(emoji),
          status: "SENT",
          groupId: gid,
          parentMessageId: msg.id,
        });
      }
      await loadThread(myId, gid);
    } catch (err) {
      console.error("Failed to toggle reaction", err);
      setError("Couldn't update your reaction.");
    }
  };

  // ── Create a group (real backend) ────────────────────────────────────────
  const handleCreateGroup = async (def) => {
    const myId = meId || getCurrentKeycloakId();
    if (!myId) return;
    setCreating(true);
    try {
      const created = await api.chatGroups.create({
        name: def.name,
        description: def.description || "",
        photoUrl: encodeAvatarPhoto(def.photoUrl, def.avatar),
        createdBy: myId,
        memberKeycloakIds: Array.from(new Set(def.members || [])).filter((x) => x && x !== myId),
      });
      setCreateOpen(false);
      await loadGroups(myId);
      const newId = created?.id;
      if (newId != null) {
        setActiveGroupId(newId);
      }
      setShowRailMobile(false);
    } catch (err) {
      console.error("Failed to create group", err);
      setError(err.message || "Failed to create the group.");
    } finally {
      setCreating(false);
    }
  };

  // ── Accept / Decline an invitation ───────────────────────────────────────
  const handleAccept = async (groupId) => {
    const myId = meId || getCurrentKeycloakId();
    if (!myId) return;
    setActingInvite(groupId);
    try {
      await api.chatGroups.accept(groupId, myId);
      await loadGroups(myId);
      setActiveGroupId(groupId); // open it now that I've joined
      setShowRailMobile(false);
    } catch (err) {
      console.error("Failed to accept invite", err);
      setError(err.message || "Couldn't accept the invitation.");
    } finally {
      setActingInvite(null);
    }
  };

  const handleDecline = async (groupId) => {
    const myId = meId || getCurrentKeycloakId();
    if (!myId) return;
    setActingInvite(groupId);
    try {
      await api.chatGroups.decline(groupId, myId);
      await loadGroups(myId);
    } catch (err) {
      console.error("Failed to decline invite", err);
      setError(err.message || "Couldn't decline the invitation.");
    } finally {
      setActingInvite(null);
    }
  };

  // ── Leave a group ─────────────────────────────────────────────────────────
  // Reuse the decline endpoint (it removes the membership row) as "leave". After
  // leaving we drop the group from the sidebar and fall back to General. The
  // General group cannot be left.
  const handleLeaveGroup = async (group) => {
    const myId = meId || getCurrentKeycloakId();
    if (!myId || !group || group.isGeneral) return;
    const groupId = group.id;
    setLeaving(true);
    try {
      await api.chatGroups.decline(groupId, myId);
      // Remove from the sidebar immediately, then select General.
      setGroups((prev) => {
        const next = prev.filter((g) => !sameGroupId(g.id, groupId));
        const general = next.find((g) => g.isGeneral) || next[0] || null;
        setActiveGroupId(general ? general.id : null);
        return next;
      });
      setLeaveConfirm(null);
      setHeaderMenuOpen(false);
      // Reconcile with the backend (silent so we don't flash a loader).
      await loadGroups(myId, { silent: true });
    } catch (err) {
      console.error("Failed to leave group", err);
      setError(err.message || "Couldn't leave the group.");
    } finally {
      setLeaving(false);
    }
  };

  // Day separators.
  const grouped = useMemo(() => {
    const out = [];
    let lastKey = null;
    for (const m of mergedThread) {
      const k = dayKey(m.sentAt);
      if (k !== lastKey) {
        out.push({ type: "sep", key: `sep-${k}-${out.length}`, label: formatDayLabel(m.sentAt) });
        lastKey = k;
      }
      out.push({ type: "msg", key: messageKey(m), msg: m });
    }
    return out;
  }, [mergedThread]);

  const mayCreate = canCreateGroups(role);
  const isFan = isFanRole(role);

  // Fans are spectator-only and are not part of any team chat. The route guard
  // (permissions.js + middleware) keeps them off this page; this is the
  // in-component fallback so a fan who somehow lands here sees a locked state
  // instead of the General chat — and can never read or post.
  if (isFan) {
    return (
      <div className="-m-8 h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="max-w-sm w-full mx-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-slate-800 grid place-items-center text-slate-400">
            <Lock size={24} />
          </div>
          <h1 className="text-lg font-black text-slate-100 mb-1.5">Team chat is members-only</h1>
          <p className="text-[13px] font-bold text-slate-400 leading-relaxed">
            The General team chat is for club players and staff. As a fan you have
            full spectator access to matches, competitions and club news.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-8 h-[calc(100vh-4rem)] flex bg-slate-950 text-slate-100 overflow-hidden">
      {/* ── LEFT RAIL: groups + invitations ───────────────────────────── */}
      <aside
        className={`${
          showRailMobile ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-72 lg:w-80 shrink-0 border-r border-slate-800 bg-slate-900/40 backdrop-blur-xl absolute md:relative inset-0 z-30 md:z-auto`}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a]">
          <img
            src={BARCA_CREST}
            alt="FC Barcelona"
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 object-contain p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black tracking-tight truncate">Chats</p>
            <ConnIndicator status={wsStatus} />
          </div>
          {mayCreate && (
            <button
              onClick={() => setCreateOpen(true)}
              title="New group"
              className="shrink-0 w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white grid place-items-center shadow-lg shadow-emerald-500/20 transition-colors"
            >
              <Plus size={18} />
            </button>
          )}
          <button
            onClick={() => setShowRailMobile(false)}
            className="md:hidden text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {/* Invitations */}
          {invitations.length > 0 && (
            <div className="px-3 pb-2 mb-1 border-b border-slate-800/60">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 px-1 py-2">
                <Mail size={12} /> Invitations
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                  {invitations.length}
                </span>
              </p>
              <div className="space-y-2">
                {invitations.map((g) => (
                  <div
                    key={`inv-${g.id}`}
                    className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <GroupAvatar group={g} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-black text-slate-100 truncate">{g.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate">
                          {senderName(g.createdBy)} invited you
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(g.id)}
                        disabled={actingInvite === g.id}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black disabled:opacity-50 transition-colors"
                      >
                        {actingInvite === g.id ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(g.id)}
                        disabled={actingInvite === g.id}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-black disabled:opacity-50 transition-colors"
                      >
                        <X size={12} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {groupsLoading && groups.length === 0 ? (
            <div className="px-4 py-6 text-center text-[11px] font-bold text-slate-500">
              Loading your chats…
            </div>
          ) : (
            groups.map((g) => {
              const active = sameGroupId(g.id, activeGroupId);
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGroupId(g.id);
                    setShowRailMobile(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                    active ? "bg-emerald-500/10 border-l-2 border-emerald-500" : "hover:bg-slate-800/40 border-l-2 border-transparent"
                  }`}
                >
                  <div className="relative shrink-0">
                    <GroupAvatar group={g} size={46} />
                    {g.isGeneral && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black truncate text-slate-100">{g.name}</p>
                      {g.isGeneral && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
                          all
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 truncate">
                      {g.isGeneral
                        ? "Everyone's here"
                        : g.description || `${g.members.length} member${g.members.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </button>
              );
            })
          )}

          {mayCreate ? (
            <button
              onClick={() => setCreateOpen(true)}
              className="w-full flex items-center gap-3 px-3 py-3 mt-1 text-left text-slate-400 hover:text-emerald-300 hover:bg-slate-800/40 transition-colors"
            >
              <span className="w-11 h-11 rounded-2xl border-2 border-dashed border-slate-700 grid place-items-center shrink-0">
                <Plus size={18} />
              </span>
              <span className="text-sm font-bold">Create a new group</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 mt-1 text-[11px] font-bold text-slate-600">
              <Lock size={13} /> Fans can chat in General only.
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CHAT ─────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="relative flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-gradient-to-r from-[#0a1a3f] via-slate-900 to-[#3b0a2a]">
          <div className="absolute -right-10 -top-10 w-44 h-44 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
          <button
            onClick={() => setShowRailMobile(true)}
            className="md:hidden text-slate-300 hover:text-white shrink-0"
            aria-label="Groups"
          >
            <ChevronLeft size={20} />
          </button>
          {activeGroup && (
            <div className="relative shrink-0">
              <GroupAvatar group={activeGroup} size={46} />
              {activeCount > 0 && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
              )}
            </div>
          )}
          <div className="relative min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-black text-slate-100 tracking-tight truncate">
              {activeGroup?.name || "—"}
            </h1>
            <p className="text-[11px] font-bold text-slate-400 truncate flex items-center gap-1.5">
              {activeCount > 0 ? (
                <>
                  <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">{activeCount} active now</span>
                  {totalMembers > 0 && <span className="text-slate-600">·</span>}
                </>
              ) : (
                <Users size={12} className="text-emerald-400" />
              )}
              {totalMembers > 0
                ? `${totalMembers} member${totalMembers === 1 ? "" : "s"}`
                : activeGroup?.description || "Whole squad + staff"}
            </p>
          </div>
          {/* Live presence avatars */}
          <div className="relative hidden sm:flex items-center -space-x-2">
            {members
              .filter((m) => m.online)
              .slice(0, 4)
              .map((m) => (
                <div key={m.id} className="ring-2 ring-slate-900 rounded-full">
                  <Avatar keycloakId={m.id} size={28} ring={false} />
                </div>
              ))}
            {activeCount > 4 && (
              <span className="relative z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-black text-slate-300 ring-2 ring-slate-900">
                +{activeCount - 4}
              </span>
            )}
          </div>

          {/* Group header menu — only meaningful for non-General groups (Leave). */}
          {activeGroup && !activeGroup.isGeneral && (
            <div className="relative shrink-0" data-header-menu>
              <button
                onClick={() => setHeaderMenuOpen((v) => !v)}
                aria-label="Group options"
                aria-haspopup="menu"
                aria-expanded={headerMenuOpen}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  headerMenuOpen
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <MoreVertical size={18} />
              </button>
              {headerMenuOpen && (
                <div
                  role="menu"
                  data-header-menu
                  className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40 py-1 z-40"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      setLeaveConfirm(activeGroup);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] font-bold text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={15} /> Leave group
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex-1 overflow-y-auto px-3 sm:px-8 py-5 space-y-1 custom-scrollbar"
          style={{
            backgroundImage: "radial-gradient(rgba(16,185,129,0.05) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm font-bold">
              Loading {activeGroup?.name || "chat"}…
            </div>
          ) : mergedThread.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-70">
              {activeGroup && <GroupAvatar group={activeGroup} size={64} />}
              <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No messages yet</p>
              <p className="text-[11px] text-slate-500 font-bold">
                Be the first to post in {activeGroup?.name || "this group"}.
              </p>
            </div>
          ) : (
            grouped.map((row) =>
              row.type === "sep" ? (
                <div key={row.key} className="flex justify-center py-3 sticky top-1 z-10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-800/80 backdrop-blur border border-slate-700/50 px-3 py-1 rounded-full">
                    {row.label}
                  </span>
                </div>
              ) : (
                <Bubble
                  key={row.key}
                  msg={row.msg}
                  mine={row.msg.sender === meId}
                  onReply={() =>
                    setReplyTo({ id: row.msg.id, sender: row.msg.sender, content: row.msg.content })
                  }
                  onReact={(emoji) => handleReact(row.msg, emoji)}
                  pickerOpen={pickerForId === row.msg.id}
                  setPickerOpen={(open) => setPickerForId(open ? row.msg.id : null)}
                />
              )
            )
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-300 text-[11px] font-bold flex items-center justify-between gap-3">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div className="px-4 sm:px-8 pt-3 bg-slate-900/80 border-t border-slate-800">
            <div className="flex items-center gap-3 bg-slate-950/60 border-l-4 border-emerald-500 rounded-r-lg px-3 py-2">
              <CornerUpLeft size={16} className="text-emerald-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-emerald-400 truncate">
                  Replying to {senderName(replyTo.sender)}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-rose-400 shrink-0">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Composer */}
        <div
          ref={composerRef}
          className="relative flex items-end gap-2 px-3 sm:px-6 py-3 bg-slate-900/90 border-t border-slate-800"
        >
          {showEmoji && (
            <div className="absolute bottom-full left-3 mb-2 flex flex-wrap gap-1 bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-2xl w-56 z-20">
              {COMPOSER_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setDraft((d) => d + e)}
                  className="w-9 h-9 text-xl rounded-lg hover:bg-slate-700 transition-colors"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              showEmoji ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-emerald-300 hover:bg-slate-800"
            }`}
            aria-label="Add emoji"
          >
            <Smile size={20} />
          </button>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder={`Message ${activeGroup?.name || "the group"}…`}
            className="flex-1 resize-none max-h-32 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-emerald-500/40 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sending}
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </section>

      <CreateGroupModal
        open={createOpen}
        onClose={() => !creating && setCreateOpen(false)}
        onCreate={handleCreateGroup}
        users={usersList}
        meId={meId}
        busy={creating}
      />

      {/* Leave-group confirmation */}
      {leaveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !leaving && setLeaveConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 pt-5">
              <span className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-300 grid place-items-center shrink-0">
                <LogOut size={18} />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-black text-slate-100">Leave group?</h2>
                <p className="text-[12px] font-bold text-slate-400 truncate">{leaveConfirm.name}</p>
              </div>
            </div>
            <p className="px-5 py-4 text-[13px] text-slate-300 leading-relaxed">
              You'll be removed from <span className="font-bold text-slate-100">{leaveConfirm.name}</span> and
              it will disappear from your chats. You can rejoin only if you're invited again.
            </p>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setLeaveConfirm(null)}
                disabled={leaving}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[13px] font-black disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLeaveGroup(leaveConfirm)}
                disabled={leaving}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[13px] font-black disabled:opacity-50 transition-colors"
              >
                {leaving ? <RefreshCw size={14} className="animate-spin" /> : <LogOut size={14} />}
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// A stable React key for a message row (persisted id, else clientMsgId, else
// a content fingerprint so live frames don't collide).
function messageKey(m) {
  if (m.id != null) return `msg-${m.id}`;
  if (m.clientMsgId) return `cmsg-${m.clientMsgId}`;
  return `live-${m.sender}-${m.sentAt}-${(m.content || "").slice(0, 16)}`;
}

// Rigorous dedupe: two records are the SAME message if they share a persisted
// id, share a clientMsgId, or (for not-yet-persisted ones) match on
// sender + content within a short time window. This is what stops a sent
// message rendering twice (optimistic + WS echo + polling refetch).
function isSameMessage(a, b) {
  if (a.id != null && b.id != null) return a.id === b.id;
  if (a.clientMsgId && b.clientMsgId) return a.clientMsgId === b.clientMsgId;
  if (a.sender !== b.sender || a.content !== b.content) return false;
  const ta = new Date(a.sentAt || 0).getTime();
  const tb = new Date(b.sentAt || 0).getTime();
  return Math.abs(ta - tb) < 60000;
}

// ── WS connection indicator ────────────────────────────────────────────────
function ConnIndicator({ status }) {
  if (status === "live") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
        <Wifi size={11} /> Live
      </span>
    );
  }
  if (status === "reconnecting" || status === "connecting") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-black text-amber-400">
        <RefreshCw size={11} className="animate-spin" /> {status === "connecting" ? "Connecting…" : "Reconnecting…"}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-black text-slate-500">
      <WifiOff size={11} /> Offline · polling
    </span>
  );
}

// ── Send-status tick (WhatsApp style) ───────────────────────────────────────
// One bubble, one icon that flips clock -> check. "sending" shows a clock;
// anything else (persisted/loaded messages) shows a single check.
function StatusTick({ status }) {
  if (status === "sending") {
    return <Clock size={11} className="shrink-0 opacity-80" aria-label="Sending" />;
  }
  return <Check size={12} className="shrink-0 opacity-90" aria-label="Sent" />;
}

// ── A single chat bubble ────────────────────────────────────────────────────
function Bubble({ msg, mine, onReply, onReact, pickerOpen, setPickerOpen }) {
  const name = senderName(msg.sender);
  const role = senderRole(msg.sender);

  return (
    <div className={`group flex gap-2.5 py-1 ${mine ? "flex-row-reverse" : "flex-row"}`}>
      {!mine && <Avatar keycloakId={msg.sender} size={34} />}
      <div className={`flex flex-col max-w-[78%] ${mine ? "items-end" : "items-start"}`}>
        <div
          className={`relative rounded-2xl px-3.5 py-2 shadow-md ${
            mine
              ? "bg-emerald-600 text-white rounded-br-md"
              : "bg-slate-800 text-slate-100 rounded-bl-md border border-slate-700/50"
          }`}
        >
          {!mine && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-[11px] font-black" style={{ color: swatchFor(name).fg }}>
                {name}
              </span>
              {role && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{role}</span>
              )}
            </div>
          )}

          {msg.reply && (
            <div
              className={`mb-1.5 rounded-lg border-l-4 px-2.5 py-1.5 text-left ${
                mine ? "bg-emerald-700/50 border-emerald-300/70" : "bg-slate-900/60 border-emerald-500/70"
              }`}
            >
              <p className={`text-[10px] font-black truncate ${mine ? "text-emerald-100" : "text-emerald-300"}`}>
                {senderName(msg.reply.sender)}
              </p>
              <p className={`text-[11px] truncate ${mine ? "text-emerald-50/80" : "text-slate-400"}`}>
                {msg.reply.content}
              </p>
            </div>
          )}

          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>

          <span className={`flex items-center justify-end gap-1 text-[9px] mt-0.5 ${mine ? "text-emerald-100/70" : "text-slate-500"}`}>
            {formatTime(msg.sentAt)}
            {mine && <StatusTick status={msg.status} />}
          </span>

          {!msg.live && msg.id != null && (
            <div
              data-reaction-ui
              className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                mine ? "right-full mr-2" : "left-full ml-2"
              }`}
            >
              <button
                onClick={onReply}
                title="Reply"
                className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/40 flex items-center justify-center shadow"
              >
                <Reply size={13} />
              </button>
              <div className="relative" data-reaction-ui>
                <button
                  onClick={() => setPickerOpen(!pickerOpen)}
                  title="React"
                  className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 flex items-center justify-center shadow"
                >
                  <Smile size={13} />
                </button>
                {pickerOpen && (
                  <div
                    data-reaction-ui
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 flex gap-0.5 bg-slate-800 border border-slate-700 rounded-full px-1.5 py-1 shadow-2xl z-30"
                  >
                    {REACTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => onReact(e)}
                        className="w-8 h-8 text-lg rounded-full hover:bg-slate-700 hover:scale-125 transition-transform"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {msg.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
            {msg.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(r.emoji)}
                title={r.users.map((u) => senderName(u)).join(", ")}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border transition-colors ${
                  r.mine
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                }`}
              >
                <span>{r.emoji}</span>
                <span className="tabular-nums">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
