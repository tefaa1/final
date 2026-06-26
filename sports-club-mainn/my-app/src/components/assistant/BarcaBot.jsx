"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@/src/lib/api";

// Barça chatbot UI. Talks to the FastAPI bot at /bot-proxy/chat (Next rewrite →
// localhost:9100), which calls Claude. We pass a compact "live context" built
// from the app's own data so the bot is accurate on the current season too.
const SUGGESTIONS = [
  "How many Champions League titles has Barça won?",
  "Tell me about the 2009 sextuple.",
  "What trophies has FC Barcelona Bàsquet won?",
  "Who are the greatest La Masia graduates?",
  "How is Barça doing in La Liga this season?",
  "Tell me about Barça Femení's success.",
];

export default function BarcaBot() {
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', content}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveContext, setLiveContext] = useState("");
  const scrollRef = useRef(null);

  // Build a compact live context from the app's data (best-effort).
  useEffect(() => {
    (async () => {
      const parts = [];
      try {
        const s = await api.getStandings("PD");
        const rows = (Array.isArray(s) ? s : s?.standings || s?.table || []).slice(0, 6);
        if (rows.length) {
          parts.push("La Liga standings (top): " + rows.map(r => `${r.position}. ${r.team} ${r.points}pts`).join(", ") + ".");
          const bar = (Array.isArray(s) ? s : s?.standings || []).find(r => /barcelona/i.test(r.team || ""));
          if (bar) parts.push(`FC Barcelona is currently ${bar.position}${bar.position === 1 ? "st" : "th"} in La Liga with ${bar.points} points.`);
        }
      } catch { /* ignore */ }
      try {
        const t = await api.getTeams();
        const teams = (Array.isArray(t) ? t : t?.data || []);
        if (teams.length) parts.push("Teams in this Sportify club: " + teams.map(x => x.name).filter(Boolean).join(", ") + ".");
      } catch { /* ignore */ }
      setLiveContext(parts.join("\n"));
    })();
  }, []);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    const next = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/bot-proxy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, liveContext }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply || "(no response)" }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: "⚠️ Couldn't reach the assistant. Make sure the barca-bot service is running." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, liveContext]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl grid place-items-center text-2xl bg-gradient-to-br from-[#004D98] to-[#A50044] shadow-lg shadow-[#A50044]/20">🔵</div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Barça Assistant</h1>
          <p className="text-xs text-slate-400 font-medium">Ask me anything about FC Barcelona — every sport, season, player & trophy. <span className="text-[#EDBB00] font-bold">Més que un club</span></p>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-5">
            <div className="text-5xl">🔵🔴</div>
            <p className="text-slate-400 max-w-sm">I'm your Culé expert. Try one of these, or ask your own:</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl">
              {SUGGESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)}
                  className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 hover:border-[#A50044] hover:text-white transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-emerald-600 text-white rounded-br-sm"
                : "bg-slate-800/80 text-slate-100 border border-slate-700 rounded-bl-sm"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Barça…"
          className="flex-1 bg-slate-900/70 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-slate-100 outline-none focus:border-[#A50044] transition-all"
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#004D98] to-[#A50044] text-white font-black text-sm hover:opacity-90 disabled:opacity-40 transition-all">
          Send
        </button>
      </form>
    </div>
  );
}
