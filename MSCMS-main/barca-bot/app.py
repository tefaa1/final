"""
Barça Bot — an FC Barcelona expert chatbot for the Sportify platform.

Provider-flexible and FREE-first: it auto-detects whichever LLM key is set —
  • GEMINI_API_KEY  → Google Gemini  (FREE tier, no credit card — recommended)
  • GROQ_API_KEY    → Groq           (FREE tier, very fast)
  • ANTHROPIC_API_KEY → Anthropic Claude (paid)
It pairs the model's deep FC Barcelona knowledge with live data from the app.

Run: uvicorn app:app --host 0.0.0.0 --port 8000
"""
import os
import httpx
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GROQ_KEY = os.environ.get("GROQ_API_KEY", "").strip()
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
MODEL_OVERRIDE = os.environ.get("BOT_MODEL", "").strip()

if GEMINI_KEY:
    PROVIDER, MODEL = "gemini", MODEL_OVERRIDE or "gemini-2.0-flash"
elif GROQ_KEY:
    PROVIDER, MODEL = "groq", MODEL_OVERRIDE or "llama-3.3-70b-versatile"
elif ANTHROPIC_KEY:
    PROVIDER, MODEL = "anthropic", MODEL_OVERRIDE or "claude-sonnet-4-6"
else:
    PROVIDER, MODEL = None, None

# The deployment network performs TLS interception, so verify=False lets the
# container reach the provider's API (same approach as the football-data feed).
_http = httpx.Client(verify=False, timeout=90.0)

SYSTEM_PROMPT = """You are **Culé**, the official FC Barcelona expert assistant inside "Sportify", a Barça-themed multi-sport club platform. You are a warm, passionate, knowledgeable Culer (Barça fan) and a meticulous historian. Motto: "Més que un club".

YOU KNOW FC BARCELONA INSIDE OUT — answer about ANY of it:
- HISTORY: founding (29 Nov 1899 by Joan Gamper), every era, presidents, the rivalry with Real Madrid (El Clásico) and Espanyol, "Més que un club", the Catalan identity, the 2009 sextuple, the tiki-taka era, famous comebacks (e.g. the 6-1 vs PSG in 2017).
- FOOTBALL (men's): every major trophy and the counts — La Liga, Copa del Rey, Supercopa, UEFA Champions League / European Cup, Cup Winners' Cup, UEFA Super Cup, FIFA Club World Cup, Inter-Cities Fairs Cup — season by season where you can. Legends (Cruyff, Maradona, Romário, Ronaldo, Rivaldo, Ronaldinho, Messi, Xavi, Iniesta, Puyol, Piqué, Suárez, Neymar) and managers (Cruyff, Rijkaard, Guardiola, Luis Enrique, Xavi, Flick…).
- LA MASIA: the academy, its philosophy and famous graduates.
- THE OTHER SECTIONS / SPORTS: FC Barcelona Bàsquet (EuroLeague, Liga ACB), Barça Handbol (EHF Champions League — one of the most successful ever), Barça Futsal (LNFS, UEFA Futsal Champions League), roller hockey (FC Barcelona Hoquei — many European titles), women's football (Barça Femení — multiple UWCL titles; Alexia Putellas & Aitana Bonmatí Ballon d'Or winners), and other sections. Know their trophies and stars too.
- VENUES: Spotify Camp Nou, the Palau Blaugrana, the Johan Cruyff Stadium, the Ciutat Esportiva.

HOW TO ANSWER:
- Be accurate and specific (numbers, seasons, names). If unsure of an exact figure or a very recent detail, say so rather than inventing it.
- Concise but complete; short paragraphs or bullet lists. A little Barça passion ("Visca el Barça!", "Força Barça!") is welcome, but stay factual.
- You cover ALL sports/sections, not just men's football.
- If "LIVE DATA FROM THE SPORTIFY APP" is given below, PREFER it for current-season questions (standings, this season's results, the squad/teams in this Sportify instance)."""

app = FastAPI(title="Barça Bot")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class Msg(BaseModel):
    role: str
    content: str


class ChatReq(BaseModel):
    messages: List[Msg]
    liveContext: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "ok", "provider": PROVIDER, "model": MODEL, "configured": PROVIDER is not None}


def _call_gemini(system, history):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={GEMINI_KEY}"
    contents = [{"role": ("model" if m["role"] == "assistant" else "user"), "parts": [{"text": m["content"]}]} for m in history]
    body = {"system_instruction": {"parts": [{"text": system}]}, "contents": contents,
            "generationConfig": {"maxOutputTokens": 1200, "temperature": 0.6}}
    r = _http.post(url, json=body)
    r.raise_for_status()
    data = r.json()
    return "".join(p.get("text", "") for p in data["candidates"][0]["content"]["parts"]).strip()


def _call_groq(system, history):
    msgs = [{"role": "system", "content": system}] + history
    r = _http.post("https://api.groq.com/openai/v1/chat/completions",
                   headers={"Authorization": f"Bearer {GROQ_KEY}"},
                   json={"model": MODEL, "messages": msgs, "max_tokens": 1200, "temperature": 0.6})
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"].strip()


def _call_anthropic(system, history):
    r = _http.post("https://api.anthropic.com/v1/messages",
                   headers={"x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                   json={"model": MODEL, "max_tokens": 1200, "system": system, "messages": history})
    r.raise_for_status()
    return "".join(b.get("text", "") for b in r.json()["content"] if b.get("type") == "text").strip()


@app.post("/chat")
def chat(req: ChatReq):
    if not PROVIDER:
        return {"reply": "⚠️ The Barça assistant isn't switched on yet — the server needs a free LLM key (GEMINI_API_KEY or GROQ_API_KEY). Add one to MSCMS-main/.env and restart the barca-bot service.", "configured": False}
    system = SYSTEM_PROMPT
    if req.liveContext:
        system += "\n\n=== LIVE DATA FROM THE SPORTIFY APP (authoritative for current-season questions) ===\n" + req.liveContext
    history = [{"role": m.role, "content": m.content} for m in req.messages
               if m.role in ("user", "assistant") and (m.content or "").strip()][-20:]
    if not history:
        return {"reply": "Ask me anything about FC Barcelona — history, any sport, players, seasons or trophies! 🔵🔴", "configured": True}
    try:
        if PROVIDER == "gemini":
            text = _call_gemini(system, history)
        elif PROVIDER == "groq":
            text = _call_groq(system, history)
        else:
            text = _call_anthropic(system, history)
        return {"reply": text or "(no response)", "configured": True, "provider": PROVIDER}
    except httpx.HTTPStatusError as e:
        return {"reply": f"⚠️ The model API returned {e.response.status_code}. Check the API key / rate limit. ({e.response.text[:200]})", "configured": True, "error": True}
    except Exception as e:
        return {"reply": f"⚠️ Couldn't reach the model right now: {e}", "configured": True, "error": True}
