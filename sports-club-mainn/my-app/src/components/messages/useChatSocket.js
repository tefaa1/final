"use client";

// Native WebSocket client for the group chat — NO npm libraries, just
// window.WebSocket. Connects DIRECTLY to the notification service's published
// port (the gateway's JWT filter rejects the browser WS handshake, which can't
// send an Authorization header; the service itself is permitAll):
//
//     ws://localhost:8085/ws/chat
//
// Protocol (JSON frames):
//   -> on open:  { type:"identify", user:<keycloakId>, name:<displayName> }
//   <- presence: { type:"presence", online:<number>, users:[keycloakId|{...}] }
//   <- chat:     { type:"chat", groupId, senderKeycloakId, senderName, content, sentAt }
//   -> to send:  { type:"chat", groupId, senderKeycloakId, senderName, content, sentAt }
//
// The send path is "persist first, then broadcast": the caller writes the
// message via api.createMessage (durable) and ALSO calls send() here so other
// connected clients get it instantly.
//
// GRACEFUL FALLBACK: if the socket can't connect or drops, the component keeps
// its ~4s polling so chat still works. This hook auto-reconnects with backoff so
// presence/live delivery light up the moment the backend WS comes online.

import { useCallback, useEffect, useRef, useState } from "react";

const WS_URL = "ws://localhost:8085/ws/chat";

// Reconnect backoff (ms): quick at first, capped so we don't hammer the gateway.
const BACKOFF = [1000, 2000, 4000, 8000, 15000];

/**
 * @param {object}   opts
 * @param {string}   opts.userId   current user's keycloakId (identify payload)
 * @param {string}   opts.userName current user's display name
 * @param {function} opts.onChat   (frame) => void — live chat frame for any group
 * @returns {{
 *   status: "connecting"|"live"|"reconnecting"|"offline",
 *   onlineCount: number|null,
 *   onlineUsers: Set<string>,
 *   sendChat: (payload) => boolean
 * }}
 */
export default function useChatSocket({ userId, userName, onChat } = {}) {
  const [status, setStatus] = useState("connecting");
  const [onlineCount, setOnlineCount] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());

  const wsRef = useRef(null);
  const attemptRef = useRef(0);
  const timerRef = useRef(null);
  const closedRef = useRef(false); // true once the component unmounts
  // Keep the latest onChat without forcing reconnects when the callback changes.
  const onChatRef = useRef(onChat);
  useEffect(() => {
    onChatRef.current = onChat;
  }, [onChat]);

  const connect = useCallback(() => {
    if (closedRef.current) return;
    if (typeof window === "undefined" || !("WebSocket" in window)) {
      setStatus("offline");
      return;
    }
    if (!userId) return; // wait until we know who we are

    let ws;
    try {
      ws = new WebSocket(WS_URL);
    } catch {
      scheduleReconnect();
      return;
    }
    wsRef.current = ws;
    setStatus(attemptRef.current === 0 ? "connecting" : "reconnecting");

    ws.onopen = () => {
      attemptRef.current = 0;
      setStatus("live");
      try {
        ws.send(JSON.stringify({ type: "identify", user: userId, name: userName || "Member" }));
      } catch {
        /* ignore */
      }
    };

    ws.onmessage = (ev) => {
      let frame;
      try {
        frame = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (!frame || typeof frame !== "object") return;

      if (frame.type === "presence") {
        const users = Array.isArray(frame.users)
          ? frame.users.map((u) => (typeof u === "string" ? u : u?.user || u?.keycloakId || u?.id)).filter(Boolean)
          : [];
        setOnlineUsers(new Set(users));
        const count = typeof frame.online === "number" ? frame.online : users.length;
        setOnlineCount(count);
      } else if (frame.type === "chat") {
        onChatRef.current?.(frame);
      }
    };

    ws.onerror = () => {
      // onclose handles the reconnect; closing here keeps state consistent.
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      setOnlineCount(null);
      setOnlineUsers(new Set());
      scheduleReconnect();
    };
  }, [userId, userName]);

  const scheduleReconnect = useCallback(() => {
    if (closedRef.current) return;
    setStatus("reconnecting");
    const delay = BACKOFF[Math.min(attemptRef.current, BACKOFF.length - 1)];
    attemptRef.current += 1;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => connect(), delay);
  }, [connect]);

  useEffect(() => {
    closedRef.current = false;
    attemptRef.current = 0;
    connect();
    return () => {
      closedRef.current = true;
      clearTimeout(timerRef.current);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws) {
        try {
          ws.onclose = null; // don't trigger a reconnect on intentional close
          ws.close();
        } catch {
          /* ignore */
        }
      }
    };
  }, [connect]);

  const sendChat = useCallback((payload) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
      ws.send(JSON.stringify({ type: "chat", ...payload }));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { status, onlineCount, onlineUsers, sendChat };
}
