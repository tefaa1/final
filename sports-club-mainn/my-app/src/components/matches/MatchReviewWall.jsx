"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/src/lib/api";
import UserChip from "@/src/components/shared/UserChip";
import {
  lookupUser,
  displayUserName,
  ensureLiveUsers,
} from "@/src/lib/userDirectory";
import {
  REACT_PREFIX,
  isReactionMarker,
  parseReactionEmoji,
  reactionContent,
  asArray,
  formatDayLabel,
} from "@/src/components/messages/groupChat";
import { FiMessageSquare, FiSend, FiSmile } from "react-icons/fi";

// ─────────────────────────────────────────────────────────────────────────────
// MATCH REVIEW WALL — a real, fully-persisted fan/staff review board for a single
// match, built entirely on the EXISTING messages API (no backend changes):
//
//   • A review  = a message with subject "MREVIEW#<matchId>", recipient
//     "match-review", no groupId (so it never leaks into the team chat, which
//     filters strictly by groupId).
//   • A reaction = a child message with subject "MREVIEWREACT#<matchId>",
//     content "[REACT <emoji>]", parentMessageId -> the review it reacts to.
//     This is the SAME marker convention the group chat uses, so we reuse its
//     helpers (isReactionMarker / parseReactionEmoji / reactionContent).
//
// On load we fetch api.getAllMessages() once, keep only rows for THIS match,
// split reviews from reaction-markers, aggregate the markers into per-review
// pills (with counts + "mine" flag), and render newest-first.
// ─────────────────────────────────────────────────────────────────────────────

// A small, friendly reaction set (distinct from the chat's so the wall feels
// its own — but still using the identical marker storage format).
const WALL_REACTIONS = ["👍", "❤️", "🔥", "😮", "👏"];

export const reviewSubject = (matchId) => `MREVIEW#${matchId}`;
export const reactSubject = (matchId) => `MREVIEWREACT#${matchId}`;
const RECIPIENT = "match-review";

// ── Current user identity — SAME mechanism the messages UI uses ─────────────
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

function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDayLabel(iso);
}

// Build the review feed for one match out of the full message list.
//   reviews:      message rows whose subject === MREVIEW#<id> (not markers)
//   reactionsByParent: Map(parentId -> Map(emoji -> {count, users:Set}))
function buildWall(allMessages, matchId, myId) {
  const subj = reviewSubject(matchId);
  const reactSubj = reactSubject(matchId);
  const list = asArray(allMessages);

  const reactionsByParent = new Map();
  for (const m of list) {
    if (String(m?.subject) !== reactSubj) continue;
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

  const reviews = list
    .filter((m) => String(m?.subject) === subj && !isReactionMarker(m))
    .sort((a, b) => {
      const ta = new Date(a.sentAt || 0).getTime();
      const tb = new Date(b.sentAt || 0).getTime();
      if (tb !== ta) return tb - ta; // newest first
      return (b.id || 0) - (a.id || 0);
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
      return {
        id: m.id,
        sender: m.senderUserKeycloakId,
        content: m.content,
        sentAt: m.sentAt,
        reactions,
      };
    });

  return reviews;
}

export default function MatchReviewWall({ matchId, fixtureLabel }) {
  const [meId, setMeId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);
  const [pickerForId, setPickerForId] = useState(null);
  const pickerRef = useRef(null);

  // Boot: resolve identity + warm the users directory (so UserChip resolves names).
  useEffect(() => {
    setMeId(getCurrentKeycloakId());
    ensureLiveUsers(() => api.getUsers()).catch(() => {});
  }, []);

  const load = useCallback(
    async ({ silent } = {}) => {
      if (matchId == null || Number.isNaN(matchId)) return;
      if (!silent) setLoading(true);
      try {
        const all = await api.getAllMessages();
        setReviews(buildWall(all, matchId, getCurrentKeycloakId()));
        setError(null);
      } catch (e) {
        console.error("Failed to load match reviews", e);
        if (!silent) setError("Couldn't load reviews. Please try again.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [matchId]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Close the reaction picker on an outside click.
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest?.("[data-react-ui]")) setPickerForId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handlePost = async () => {
    const text = draft.trim();
    if (!text || posting) return;
    const myId = meId || getCurrentKeycloakId();
    if (!myId) {
      setError("We couldn't identify your account — please sign in again.");
      return;
    }
    setPosting(true);
    try {
      await api.createMessage({
        senderUserKeycloakId: myId,
        recipientUserKeycloakId: RECIPIENT,
        subject: reviewSubject(matchId),
        content: text,
        status: "SENT",
      });
      setDraft("");
      await load({ silent: true });
    } catch (e) {
      console.error("Failed to post review", e);
      setError(e.message || "Failed to post your review.");
    } finally {
      setPosting(false);
    }
  };

  // Toggle a reaction on a review. Adding = new child marker message; removing =
  // delete my existing marker for that emoji.
  const handleReact = async (review, emoji) => {
    const myId = meId || getCurrentKeycloakId();
    if (!myId || review.id == null) return;
    setPickerForId(null);
    const mine = review.reactions.find((r) => r.emoji === emoji && r.mine);
    try {
      if (mine) {
        const all = asArray(await api.getAllMessages().catch(() => []));
        const marker = all.find(
          (m) =>
            m.parentMessageId === review.id &&
            String(m.subject) === reactSubject(matchId) &&
            m.senderUserKeycloakId === myId &&
            typeof m.content === "string" &&
            m.content.includes(emoji) &&
            m.content.trim().startsWith(REACT_PREFIX)
        );
        if (marker?.id != null) await api.deleteMessage(marker.id);
      } else {
        await api.createMessage({
          senderUserKeycloakId: myId,
          recipientUserKeycloakId: RECIPIENT,
          subject: reactSubject(matchId),
          content: reactionContent(emoji),
          status: "SENT",
          parentMessageId: review.id,
        });
      }
      await load({ silent: true });
    } catch (e) {
      console.error("Failed to toggle reaction", e);
      setError("Couldn't update your reaction.");
    }
  };

  const count = reviews.length;

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/40 shadow-xl overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between gap-3 px-6 py-3.5 border-b border-slate-800 bg-gradient-to-r from-amber-500/[0.08] to-transparent">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <FiMessageSquare size={14} />
          </span>
          <h2 className="text-sm font-black text-slate-100 tracking-tight">Match Reviews</h2>
          <span className="text-[10px] font-black text-slate-500 bg-slate-800/60 border border-slate-700/50 rounded-full px-2 py-0.5">
            {count}
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        {/* composer */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3 mb-5">
          <div className="flex items-center gap-2 mb-2">
            {meId ? (
              <UserChip keycloakId={meId} />
            ) : (
              <span className="text-[11px] font-bold text-slate-500">Share your take</span>
            )}
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handlePost();
              }
            }}
            rows={3}
            placeholder={`Write a review${fixtureLabel ? ` of ${fixtureLabel}` : ""}… what stood out?`}
            className="w-full resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-600 outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-800/70">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hidden sm:block">
              {"⌘/Ctrl + Enter to post"}
            </span>
            <button
              onClick={handlePost}
              disabled={!draft.trim() || posting}
              className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <FiSend size={13} /> {posting ? "Posting…" : "Post review"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold">
            {error}
          </div>
        )}

        {/* feed */}
        {loading ? (
          <div className="py-10 text-center text-slate-500 font-black uppercase text-[11px] tracking-widest animate-pulse">
            Loading reviews…
          </div>
        ) : count === 0 ? (
          <div className="py-10 text-center">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-slate-300 font-black uppercase tracking-widest text-xs">No reviews yet</p>
            <p className="text-[12px] text-slate-500 mt-1.5">Be the first to share your take on this match.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <ReviewCard
                key={r.id}
                review={r}
                pickerOpen={pickerForId === r.id}
                setPickerOpen={(open) => setPickerForId(open ? r.id : null)}
                onReact={(emoji) => handleReact(r, emoji)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReviewCard({ review, pickerOpen, setPickerOpen, onReact }) {
  return (
    <div className="group relative rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <UserChip keycloakId={review.sender} showRole />
        <span className="shrink-0 text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">
          {timeAgo(review.sentAt)}
        </span>
      </div>

      <p className="text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap break-words pl-1">
        {review.content}
      </p>

      {/* reactions + hover picker */}
      <div className="flex items-center flex-wrap gap-1.5 mt-3" data-react-ui>
        {review.reactions.map((rx) => (
          <button
            key={rx.emoji}
            onClick={() => onReact(rx.emoji)}
            title={rx.users.map((u) => userName(u)).join(", ")}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border transition-colors ${
              rx.mine
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
            }`}
          >
            <span>{rx.emoji}</span>
            <span className="tabular-nums">{rx.count}</span>
          </button>
        ))}

        <div className="relative" data-react-ui>
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            title="Add reaction"
            className={`inline-flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${
              review.reactions.length === 0
                ? "opacity-0 group-hover:opacity-100"
                : ""
            } bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/40`}
          >
            <FiSmile size={13} />
          </button>
          {pickerOpen && (
            <div
              data-react-ui
              className="absolute bottom-full mb-2 left-0 flex gap-0.5 bg-slate-800 border border-slate-700 rounded-full px-1.5 py-1 shadow-2xl z-30"
            >
              {WALL_REACTIONS.map((e) => (
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
    </div>
  );
}

function userName(keycloakId) {
  const known = lookupUser(keycloakId);
  return known ? known.name : displayUserName(keycloakId, "Member");
}
