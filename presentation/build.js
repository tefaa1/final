/* Sportify / MSCMS — graduation overview deck.
 * Dark-navy + cyan, emoji-led, friend's section style. Each FEATURE gets its own
 * slide followed by a dedicated SCREENSHOT slide (auto-fills if the named image
 * exists in ../documentation/screenshots/, else shows a labelled placeholder).
 * A ROLE VIEWS section shows the dashboard each role lands on.
 * Build: node build.js [outfile] → python add_transitions.py [outfile]. */
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Sportify Team";
pres.title = "Sportify (MSCMS) — Project Overview";
const W = 13.3, H = 7.5;

const CYAN = "27B6D6", GREEN = "3DBB8E", WHITE = "FFFFFF";
const BODY_TX = "C6D2E0", MUTE = "8A98AC";
const CARD = "16273C", CARD_HI = "1B3149", BORDER = "2B405C";
const NAVY = "0A1524", TILE = "0F2840";
const HEAD = "Segoe UI", BODY = "Segoe UI";

let PAGE = 0;
const sh = () => ({ type: "outer", color: "000000", blur: 9, offset: 3, angle: 90, opacity: 0.34 });
const cardSh = () => ({ type: "outer", color: "000000", blur: 7, offset: 2, angle: 90, opacity: 0.30 });
const newSlide = (img) => { const s = pres.addSlide(); if (img) s.background = { path: "assets/" + img }; PAGE++; return s; };
const content = () => newSlide("bg-content.png");
const SHOT_DIR = "../documentation/screenshots/";
const hasShot = (f) => { try { return fs.existsSync(SHOT_DIR + f); } catch (e) { return false; } };

function baseLine(s) { s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 7.06, w: 4.2, h: 0.022, fill: { color: CYAN }, line: { type: "none" } }); }
function footer(s) {
  s.addText("Sportify  ·  MSCMS", { x: 0.6, y: 7.04, w: 5, h: 0.3, color: MUTE, fontSize: 9, fontFace: BODY, margin: 0 });
  s.addText(String(PAGE), { x: 12.4, y: 7.04, w: 0.4, h: 0.3, color: MUTE, fontSize: 9, align: "right", fontFace: BODY, margin: 0 });
}
function head(s, emoji, heading, subtitle) {
  s.addShape(pres.shapes.RECTANGLE, { x: 0.62, y: 0.52, w: 0.085, h: 0.74, fill: { color: CYAN }, line: { type: "none" } });
  s.addText([{ text: emoji + "  ", options: {} }, { text: heading, options: { color: WHITE, bold: true } }],
    { x: 0.92, y: 0.46, w: 11.9, h: 0.7, fontSize: 29, fontFace: HEAD, valign: "middle", margin: 0 });
  if (subtitle) s.addText(subtitle, { x: 0.94, y: 1.18, w: 11.9, h: 0.4, color: MUTE, italic: true, fontSize: 13, fontFace: BODY, margin: 0 });
}
const card = (s, x, y, w, h, fill = CARD, r = 0.1) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: r, fill: { color: fill }, line: { color: BORDER, width: 1 }, shadow: cardSh() });
function frame(s, path, x, y, w, h, fit = "contain") {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: WHITE }, line: { color: BORDER, width: 1 }, shadow: cardSh() });
  s.addImage({ path, x: x + 0.07, y: y + 0.07, sizing: { type: fit, w: w - 0.14, h: h - 0.14 } });
}
function gridCards(s, items, cols, o = {}) {
  const x0 = o.x0 ?? 0.62, y0 = o.y0 ?? 1.72, areaW = o.areaW ?? 12.06, areaH = o.areaH ?? 5.1;
  const gx = o.gx ?? 0.36, gy = o.gy ?? 0.32, ts = o.titleSize ?? 14, ds = o.descSize ?? 11.5, es = o.emojiSize ?? 17;
  const rows = Math.ceil(items.length / cols);
  const cw = (areaW - (cols - 1) * gx) / cols, chh = (areaH - (rows - 1) * gy) / rows;
  items.forEach((it, i) => {
    const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (cw + gx), y = y0 + r * (chh + gy);
    card(s, x, y, cw, chh, (o.altFill && r % 2) ? CARD_HI : CARD);
    s.addText(it.emoji, { x: x + 0.18, y: y + 0.16, w: 0.55, h: 0.5, fontSize: es, align: "center", valign: "middle", margin: 0 });
    s.addText(it.title, { x: x + 0.74, y: y + 0.14, w: cw - 0.92, h: 0.52, color: CYAN, bold: true, fontSize: ts, fontFace: HEAD, valign: "middle", margin: 0 });
    s.addText(it.desc, { x: x + 0.24, y: y + 0.68, w: cw - 0.46, h: chh - 0.8, color: BODY_TX, fontSize: ds, fontFace: BODY, lineSpacingMultiple: 1.05, margin: 0, valign: "top" });
  });
}
// a dedicated screenshot slide — the image fills almost the whole slide (big),
// with just a slim title bar on top. Real image if present, else a big placeholder.
function shotSlide(emoji, heading, file, hint) {
  const s = content();
  s.addShape(pres.shapes.RECTANGLE, { x: 0.62, y: 0.4, w: 0.085, h: 0.6, fill: { color: CYAN }, line: { type: "none" } });
  s.addText([{ text: emoji + "  ", options: {} }, { text: heading, options: { color: WHITE, bold: true } }],
    { x: 0.9, y: 0.32, w: 11.9, h: 0.66, fontSize: 24, fontFace: HEAD, valign: "middle", margin: 0 });
  const x = 0.4, y = 1.12, w = 12.5, h = 5.98;   // big image area (~94% width)
  if (hasShot(file)) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.05, fill: { color: "0B1626" }, line: { color: BORDER, width: 1 }, shadow: cardSh() });
    s.addImage({ path: SHOT_DIR + file, x: x + 0.1, y: y + 0.1, sizing: { type: "contain", w: w - 0.2, h: h - 0.2 } });
  } else {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: "0E1E33" }, line: { color: CYAN, width: 1.5, dashType: "dash" } });
    s.addText("📷", { x: 0, y: y + h / 2 - 1.05, w: W, h: 0.9, align: "center", fontSize: 54, margin: 0 });
    s.addText(`Drop  ${file}  into documentation/screenshots/`, { x: 0, y: y + h / 2 - 0.05, w: W, h: 0.5, align: "center", color: CYAN, bold: true, fontSize: 16, fontFace: HEAD, margin: 0 });
    s.addText(hint, { x: 2.2, y: y + h / 2 + 0.5, w: W - 4.4, h: 0.7, align: "center", color: MUTE, fontSize: 12.5, italic: true, fontFace: BODY, margin: 0 });
  }
  s.addText(file, { x: 8.9, y: 7.12, w: 4.1, h: 0.22, align: "right", color: MUTE, fontSize: 8, fontFace: BODY, margin: 0 });
  footer(s);
}
// a feature slide: big emoji + title + blurb + supporting points
function featureSlide(f) {
  const s = content(); head(s, f.emoji, f.title, f.blurb);
  const items = f.points, x0 = 0.95, y0 = 2.0, rh = Math.min(0.95, 4.7 / items.length);
  items.forEach((p, i) => {
    const y = y0 + i * rh;
    s.addText(p[0], { x: x0, y, w: 0.5, h: 0.5, fontSize: 17, valign: "middle", margin: 0 });
    s.addText([{ text: p[1] + " — ", options: { color: CYAN, bold: true } }, { text: p[2], options: { color: BODY_TX } }],
      { x: x0 + 0.55, y, w: 11.3, h: rh, fontSize: 14.5, fontFace: BODY, valign: "middle", lineSpacingMultiple: 1.05, margin: 0 });
  });
  baseLine(s); footer(s);
}
const content_json = require("./content.json");
const D = content_json;

// ============================ 1. TITLE ============================
(() => {
  const s = newSlide("bg-title.png");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.92, y: 1.35, w: 1.5, h: 1.5, rectRadius: 0.14, fill: { color: WHITE }, shadow: sh() });
  s.addImage({ path: "assets/menoufia-logo.png", x: 1.04, y: 1.47, sizing: { type: "contain", w: 1.26, h: 1.26 } });
  s.addText("Sportify", { x: 0.95, y: 3.1, w: 11.4, h: 1.1, bold: true, fontSize: 64, fontFace: HEAD, color: WHITE, margin: 0 });
  s.addText([
    { text: "Cloud-Native ", options: { color: CYAN } },
    { text: "Multi-Sport Club Management System (MSCMS)", options: { color: WHITE } },
  ], { x: 0.97, y: 4.25, w: 11.4, h: 0.55, bold: true, fontSize: 21, fontFace: HEAD, margin: 0 });
  s.addText("Sportify unifies every operation of a modern multi-sport club — squads, live matches, medical, plan-driven training, real competitions and analytics — into one secure, role-aware platform built on a microservices back-end, a Next.js front-end and a Python ML engine.",
    { x: 0.97, y: 5.0, w: 9.6, h: 1.3, color: BODY_TX, fontSize: 14.5, fontFace: BODY, lineSpacingMultiple: 1.25, margin: 0 });
  baseLine(s);
})();

// ============================ 2. INDEX ============================
(() => {
  const s = content(); head(s, "🧭", "Index", "What we'll walk through today");
  // Section-level agenda only — NOT a list of individual features.
  const idx = [
    ["01", "🧩", "Problem & Goals", "Why a unified club platform is needed"],
    ["02", "⚙️", "The Solution", "One cloud-native platform, role-aware"],
    ["03", "🔐", "Roles & Access", "A tailored, secure surface per role"],
    ["04", "🏗️", "Architecture & Tech", "Microservices, gateway, ML & the stack"],
    ["05", "⭐", "Features", "Each capability, shown on real screens"],
    ["06", "🎬", "Live Demo", "Sportify in action"],
    ["07", "🚀", "Future Work", "Where the platform goes next"],
    ["08", "✅", "Conclusion & Team", "Wrap-up and the people behind it"],
  ];
  const cols = 2, cw = 5.9, chh = 1.16, gx = 0.4, gy = 0.28, x0 = 0.62, y0 = 1.85;
  idx.forEach((it, i) => {
    const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (cw + gx), y = y0 + r * (chh + gy);
    card(s, x, y, cw, chh, (i % 2) ? CARD_HI : CARD, 0.12);
    s.addText(it[0], { x: x + 0.25, y, w: 0.85, h: chh, align: "center", valign: "middle", color: CYAN, bold: true, fontSize: 26, fontFace: HEAD, margin: 0 });
    s.addText(it[1], { x: x + 1.15, y, w: 0.7, h: chh, align: "center", valign: "middle", fontSize: 22, margin: 0 });
    s.addText(it[2], { x: x + 1.95, y: y + 0.2, w: cw - 2.1, h: 0.5, color: WHITE, bold: true, fontSize: 15.5, fontFace: HEAD, margin: 0 });
    s.addText(it[3], { x: x + 1.95, y: y + 0.62, w: cw - 2.1, h: 0.4, color: MUTE, fontSize: 11, fontFace: BODY, margin: 0 });
  });
  baseLine(s); footer(s);
})();

// ============================ PROBLEMS (8, split 4+4) ============================
[[0, 4, "Where fragmented club operations break down"], [4, 8, "More gaps a unified platform has to close"]].forEach(([a, b, sub]) => {
  const s = content(); head(s, D.problems.emoji, D.problems.heading, sub);
  gridCards(s, D.problems.items.slice(a, b), 2, { y0: 1.78, areaH: 4.95, titleSize: 16, descSize: 13, emojiSize: 19, gy: 0.4 });
  baseLine(s); footer(s);
});

// ============================ GOALS ============================
(() => {
  const s = content(); head(s, D.goals.emoji, D.goals.heading, D.goals.subtitle);
  const items = D.goals.items, x0 = 0.92, y0 = 1.78, rh = 0.84;
  items.forEach((g, i) => {
    const y = y0 + i * rh;
    s.addText(g.emoji, { x: x0, y, w: 0.5, h: 0.55, fontSize: 18, valign: "middle", margin: 0 });
    s.addText([{ text: g.title + ":  ", options: { color: CYAN, bold: true } }, { text: g.desc, options: { color: BODY_TX } }],
      { x: x0 + 0.6, y, w: 11.3, h: 0.78, fontSize: 14.5, fontFace: BODY, valign: "middle", lineSpacingMultiple: 1.05, margin: 0 });
  });
  baseLine(s); footer(s);
})();

// ============================ SOLUTIONS ============================
(() => {
  const s = content(); head(s, D.solutions.emoji, D.solutions.heading, D.solutions.subtitle);
  gridCards(s, D.solutions.items, 3, { y0: 1.78, areaH: 4.95, titleSize: 13.5, descSize: 11.5 });
  baseLine(s); footer(s);
})();

// ============================ ROLES (8, split 4+4) ============================
[[0, 4, "How each role sees a tailored, secure surface"], [4, 8, "From analysts and scouts to read-only players & fans"]].forEach(([a, b, sub]) => {
  const s = content(); head(s, D.roles.emoji, D.roles.heading, sub);
  gridCards(s, D.roles.items.slice(a, b), 2, { y0: 1.78, areaH: 4.95, titleSize: 15, descSize: 11.5, emojiSize: 18, gy: 0.4 });
  baseLine(s); footer(s);
});

// ============================ ARCHITECTURE ============================
(() => {
  const s = content(); head(s, D.architecture.emoji, D.architecture.heading, D.architecture.subtitle);
  gridCards(s, D.architecture.items, 4, { y0: 1.78, areaH: 4.95, titleSize: 12.5, descSize: 10, emojiSize: 16, gx: 0.3 });
  baseLine(s); footer(s);
})();
(() => {
  const s = content(); head(s, "🗺️", "Architecture at a Glance", "One gateway, six domain services, an event backbone and an ML engine");
  frame(s, "assets/diag-arch-overview.png", 1.6, 1.75, 10.1, 5.05);
  baseLine(s); footer(s);
})();

// ============================ TECH STACK ============================
(() => {
  const s = content(); head(s, "🧱", "Enterprise-Grade Tech Stack", "Proven, production-grade technology at every layer");
  const groups = [
    ["☕", "Back-End", ["Java 21 / Spring Boot 3.5", "Spring Cloud Gateway + Eureka", "PostgreSQL 14 (DB per service)"]],
    ["⚛️", "Front-End", ["Next.js 16 (App Router)", "React 19 & Tailwind v4", "WebSockets for real-time"]],
    ["🐳", "Infrastructure", ["Keycloak 26 (Identity / JWT)", "Apache Kafka (Eventing)", "Docker · Python/FastAPI ML"]],
  ];
  const cw = 3.78, chh = 3.7, gx = 0.5, x0 = 0.62, y0 = 1.95;
  groups.forEach((g, i) => {
    const x = x0 + i * (cw + gx);
    card(s, x, y0, cw, chh, CARD, 0.12);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + cw / 2 - 0.55, y: y0 + 0.4, w: 1.1, h: 1.1, rectRadius: 0.1, fill: { color: TILE }, line: { color: CYAN, width: 1 } });
    s.addText(g[0], { x: x + cw / 2 - 0.55, y: y0 + 0.4, w: 1.1, h: 1.1, align: "center", valign: "middle", fontSize: 34, margin: 0 });
    s.addText(g[1], { x, y: y0 + 1.7, w: cw, h: 0.5, align: "center", color: WHITE, bold: true, fontSize: 19, fontFace: HEAD, margin: 0 });
    s.addText(g[2].map((t, j, a) => ({ text: t, options: { breakLine: j < a.length - 1, align: "center" } })),
      { x: x + 0.3, y: y0 + 2.35, w: cw - 0.6, h: 1.2, align: "center", color: BODY_TX, fontSize: 12.5, fontFace: BODY, paraSpaceAfter: 8, margin: 0 });
  });
  baseLine(s); footer(s);
})();

// ============================ FEATURES — one by one, each + a screenshot slide ============================
(() => { const s = content();
  s.addText("⭐", { x: 0, y: 2.3, w: W, h: 1.0, align: "center", fontSize: 60, margin: 0 });
  s.addText("Key Features", { x: 0, y: 3.5, w: W, h: 0.9, align: "center", color: WHITE, bold: true, fontSize: 40, fontFace: HEAD, margin: 0 });
  s.addText("Each capability, one at a time — with a real screen of it in action.", { x: 0, y: 4.5, w: W, h: 0.5, align: "center", color: CYAN, fontSize: 15, italic: true, fontFace: BODY, margin: 0 });
  baseLine(s); footer(s);
})();
const FEATURES = [
  { emoji: "🛡️", title: "Role-Aware Dashboards", blurb: "One adaptive surface per role — from administrator to fan.", shot: "shot-dashboards.png", hint: "Capture the dashboard an admin or coach lands on (sidebar + cards).", points: [
    ["🎛️", "Adaptive surface", "Every menu, page and action is tailored to the signed-in role."],
    ["🔐", "Enforced twice", "A shared permissions map gates the sidebar and the server-side route guard."],
    ["👥", "Fourteen roles", "From administrator to fan, each account sees only what it should."] ] },
  { emoji: "🏟️", title: "Multi-Sport & Multi-Team", blurb: "Sports, teams, rosters, contracts and transfers in one place.", shot: "shot-teams.png", hint: "Capture the Teams & Sports page with the multi-sport squads.", points: [
    ["⚽", "Many sports", "Football, basketball, handball, swimming and more, all in one system."],
    ["🧑‍🤝‍🧑", "First & reserve squads", "Each sport runs a senior team plus a reserve / academy team."],
    ["📇", "Full squad data", "Players, staff, contracts and transfers managed per team."] ] },
  { emoji: "🏆", title: "Real Competitions", blurb: "Live La Liga and the new-format UEFA Champions League.", shot: "shot-competitions.png", hint: "Capture the La Liga table or the Champions League league-phase.", points: D.competitions.items.slice(0, 4).map(i => [i.emoji, i.title, i.desc]) },
  { emoji: "⚽", title: "Live-Match Engine", blurb: "A broadcast-style match-day cockpit, run minute by minute.", shot: "shot-livematch.png", hint: "Capture a live match running — clock, events and the add-event panel.", points: D.matches.items.slice(0, 4).map(i => [i.emoji, i.title, i.desc]) },
  { emoji: "🩺", title: "Advanced Injury Management", blurb: "A medically-governed return-to-play pipeline.", shot: "shot-injury.png", hint: "Capture a player's staged medical recovery journey.", points: D.medical.items.slice(0, 4).map(i => [i.emoji, i.title, i.desc]) },
  { emoji: "🏃", title: "Plan-Driven Training", blurb: "From season plan to scored session, one squad at a time.", shot: "shot-training.png", hint: "Capture a training plan with its sessions, drills and attendance.", points: D.training.items.slice(0, 4).map(i => [i.emoji, i.title, i.desc]) },
  { emoji: "🔍", title: "Scouting & Sponsorship", blurb: "Scout reports on prospects and sponsor-offer negotiation.", shot: "shot-scouting.png", hint: "Capture a scouting report and/or a sponsor-offer negotiation.", points: [
    ["📝", "Sign-or-pass reports", "Scouts log structured reports on external prospects."],
    ["🤝", "Sponsor negotiation", "Offers move through pending, stale and accepted states."],
    ["🔗", "Tied to fixtures", "Reports attach to the players and matches they were scouted at."] ] },
  { emoji: "💬", title: "Real-Time Messaging", blurb: "Club-wide group chat over a live socket.", shot: "shot-messaging.png", hint: "Capture a team-chat group conversation.", points: [
    ["⚡", "Live WebSocket", "Messages, reactions, replies and read receipts in real time."],
    ["🔁", "Polling fallback", "Falls back to polling when the socket is unavailable."],
    ["👥", "Team-scoped", "Staff and players only — fans stay on the spectator surface."] ] },
  { emoji: "🤖", title: "Analytics & ML Predictions", blurb: "Match-outcome and player-rating predictions on real data.", shot: "shot-analytics.png", hint: "Capture the Analytics dashboard or the ML predictor / rating screen.", points: [
    ["📊", "KPI dashboards", "Aggregates team, player and training KPIs."],
    ["🔮", "Match predictor", "A Python/FastAPI service forecasts match outcomes."],
    ["⭐", "Player ratings", "ML 0–100 ratings inform selection and scouting."] ] },
  { emoji: "🔔", title: "Live Notifications", blurb: "The whole club, kept in the loop in real time.", shot: "shot-notifications.png", hint: "Capture the notifications bell open, or the Alerts center.", points: [
    ["🔔", "Top-bar bell", "Injuries, goals, transfers and report-ready events surface instantly."],
    ["📨", "Event-driven", "Kafka events fan out to the notification service."],
    ["🗂️", "Alerts center", "A full history of everything that happened."] ] },
];
// Each feature uses your fresh shot-*.png if present, else falls back to an
// existing screenshot so no slide is empty; drop the shot-*.png to override.
const FB = {
  "shot-dashboards.png": "fig-dashboard.png", "shot-teams.png": "fig-club-hub.png",
  "shot-competitions.png": "fig-laliga.png", "shot-livematch.png": "fig-live-match.png",
  "shot-injury.png": "new-medical-lifecycle.PNG", "shot-training.png": "fig-training.png",
  "shot-scouting.png": "fig-scouting.png", "shot-messaging.png": "fig-messages.png",
  "shot-analytics.png": "fig-reports.png", "shot-notifications.png": "fig-notifications.png",
};
FEATURES.forEach((f) => {
  featureSlide(f);
  const fb = FB[f.shot];
  const file = hasShot(f.shot) ? f.shot : (fb && hasShot(fb) ? fb : f.shot);
  shotSlide("📷", f.title, file, f.hint);
});

// ============================ ROLE VIEWS ============================
(() => { const s = content();
  s.addText("👁️", { x: 0, y: 2.3, w: W, h: 1.0, align: "center", fontSize: 60, margin: 0 });
  s.addText("Role Views", { x: 0, y: 3.5, w: W, h: 0.9, align: "center", color: WHITE, bold: true, fontSize: 40, fontFace: HEAD, margin: 0 });
  s.addText("The same platform, a different surface for every login.", { x: 0, y: 4.5, w: W, h: 0.5, align: "center", color: CYAN, fontSize: 15, italic: true, fontFace: BODY, margin: 0 });
  baseLine(s); footer(s);
})();
const ROLE_VIEWS = [
  { emoji: "👑", role: "Administrator", shot: "shot-view-admin.png", sees: "Full access — every section, plus User Management." },
  { emoji: "🏢", role: "Sport Manager", shot: "shot-view-sportmanager.png", sees: "Squad, staff, matches, scouting, contracts and sponsors." },
  { emoji: "🎯", role: "Head Coach", shot: "shot-view-headcoach.png", sees: "Training, line-ups, matches, medical and analytics." },
  { emoji: "🩺", role: "Team Doctor", shot: "shot-view-doctor.png", sees: "The medical module, players and training availability." },
  { emoji: "🔍", role: "Scout", shot: "shot-view-scout.png", sees: "Scouting, prospects, matches and head-to-head." },
  { emoji: "👤", role: "Player", shot: "shot-view-player.png", sees: "A read-only view of club, matches, training and own medical." },
  { emoji: "🎟️", role: "Fan", shot: "shot-view-fan.png", sees: "Spectator-only — club hub, trophies, competitions and matches." },
];
ROLE_VIEWS.forEach((r) => shotSlide(r.emoji, `${r.role} — what they see`, r.shot, r.sees));

// ============================ LIVE DEMO ============================
(() => {
  const s = newSlide("tech-network.png");
  s.addShape(pres.shapes.OVAL, { x: 5.9, y: 2.0, w: 1.5, h: 1.5, fill: { color: CYAN }, line: { type: "none" }, shadow: sh() });
  s.addText("▶", { x: 6.05, y: 2.0, w: 1.5, h: 1.5, align: "center", valign: "middle", color: NAVY, bold: true, fontSize: 40, fontFace: BODY, margin: 0 });
  s.addText("🎬  LIVE DEMO", { x: 0, y: 3.75, w: W, h: 0.5, align: "center", color: CYAN, bold: true, fontSize: 16, charSpacing: 4, fontFace: HEAD, margin: 0 });
  s.addText("See Sportify in Action", { x: 0, y: 4.2, w: W, h: 0.8, align: "center", color: WHITE, bold: true, fontSize: 36, fontFace: HEAD, margin: 0 });
  s.addText("A short walkthrough — login, the role dashboard, a live match, the medical room and team messaging.",
    { x: 2.4, y: 5.1, w: 8.5, h: 0.7, align: "center", color: BODY_TX, fontSize: 15, fontFace: BODY, margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.15, y: 6.0, w: 5.0, h: 0.7, rectRadius: 0.1, fill: { color: TILE }, line: { color: CYAN, width: 1 } });
  s.addText("Insert → Video here, or run the live app", { x: 4.15, y: 6.0, w: 5.0, h: 0.7, align: "center", valign: "middle", color: BODY_TX, bold: true, fontSize: 13, fontFace: BODY, margin: 0 });
  baseLine(s); footer(s);
})();

// ============================ FUTURE WORK ============================
(() => {
  const s = content(); head(s, D.future.emoji, D.future.heading, D.future.subtitle);
  gridCards(s, D.future.items, 3, { y0: 1.78, areaH: 4.95, titleSize: 13.5, descSize: 11.5 });
  baseLine(s); footer(s);
})();

// ============================ CONCLUSION ============================
(() => {
  const s = content(); head(s, "✅", "Conclusion", "");
  s.addText("Sportify turns a club's scattered, manual operations into one secure, real-time, data-driven platform.",
    { x: 0.95, y: 1.85, w: 11.4, h: 1.0, color: WHITE, bold: true, fontSize: 22, fontFace: HEAD, lineSpacingMultiple: 1.05, margin: 0 });
  const points = [
    ["🧱", "A production-grade microservices architecture, deployed with Docker."],
    ["⚽", "Real competitions, a live-match engine and a complete medical workflow."],
    ["🔐", "Role-based security end to end, with analytics and ML predictions on top."],
    ["🚀", "An extensible foundation ready for mobile, more sports and richer models."],
  ];
  points.forEach((p, i) => {
    const y = 3.3 + i * 0.78;
    s.addText(p[0], { x: 0.98, y, w: 0.5, h: 0.5, fontSize: 17, valign: "middle", margin: 0 });
    s.addText(p[1], { x: 1.6, y, w: 10.7, h: 0.5, color: BODY_TX, fontSize: 15.5, fontFace: BODY, valign: "middle", margin: 0 });
  });
  baseLine(s); footer(s);
})();

// ============================ TEAM ============================
(() => {
  const s = content(); head(s, "👥", "Team Members", "Supervised by Dr. Shaimaa Saber");
  const team = ["Mariam Mohamed Ahmed", "Mohamed Abdellatief", "Eman Ahmed Elboghdady", "Khaled Mohamed", "Shahd Abdelaziz", "Mohamed Salem"];
  const cols = 3, cw = 3.83, chh = 1.2, gx = 0.36, gy = 0.4, x0 = 0.62, y0 = 2.1;
  team.forEach((t, i) => {
    const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (cw + gx), y = y0 + r * (chh + gy);
    card(s, x, y, cw, chh, (i % 2) ? CARD_HI : CARD, 0.12);
    s.addText("👤", { x, y: y + 0.18, w: cw, h: 0.5, align: "center", fontSize: 22, margin: 0 });
    s.addText(t, { x, y: y + 0.6, w: cw, h: 0.5, align: "center", color: WHITE, bold: true, fontSize: 14, fontFace: HEAD, margin: 0 });
  });
  s.addText("Menoufia University · Faculty of Computers and Information · Graduation Project 2025 – 2026",
    { x: 0, y: 6.5, w: W, h: 0.4, align: "center", color: MUTE, fontSize: 12.5, fontFace: BODY, margin: 0 });
  baseLine(s); footer(s);
})();

// ============================ THANKS ============================
(() => {
  const s = newSlide("bg-title.png");
  s.addText("🙌", { x: 0, y: 1.9, w: W, h: 1.0, align: "center", fontSize: 56, margin: 0 });
  s.addText("Thanks for your attention!", { x: 0, y: 3.2, w: W, h: 1.0, align: "center", color: WHITE, bold: true, fontSize: 46, fontFace: HEAD, margin: 0 });
  s.addText("Questions & discussion welcome", { x: 0, y: 4.35, w: W, h: 0.5, align: "center", color: CYAN, fontSize: 17, fontFace: BODY, margin: 0 });
  s.addText("Sportify · MSCMS  —  a cloud-native multi-sport club management platform", { x: 0, y: 5.5, w: W, h: 0.4, align: "center", color: MUTE, fontSize: 13, fontFace: BODY, margin: 0 });
  baseLine(s);
})();

const OUT = process.argv[2] || "Sportify-MSCMS-Overview.pptx";
pres.writeFile({ fileName: OUT }).then(f => console.log("WROTE", f, "·", PAGE, "slides"));
