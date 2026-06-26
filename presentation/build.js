/* Sportify / MSCMS — graduation overview deck (formal edition).
 *   • NO emojis anywhere — a small cyan square is the only icon accent.
 *   • Per-section muted themed backgrounds (with a readability scrim); the
 *     architecture and screenshot/blank slides stay on the clean mesh.
 *   • A hyperlinked Index (click a section → jump to it) + "Index" back-links.
 *   • Consistent Fade transitions are added by add_transitions.py.
 * Build: node build.js [out.pptx] → python add_transitions.py [out.pptx] → export PDF. */
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Sportify Team";
pres.title = "Sportify (MSCMS) — Project Overview";
const W = 13.3, H = 7.5;

const CYAN = "27B6D6", GREEN = "3DBB8E", WHITE = "FFFFFF", GOLD = "E6B800";
const BODY_TX = "C6D2E0", MUTE = "8A98AC";
const CARD = "16273C", CARD_HI = "1B3149", BORDER = "2B405C";
const NAVY = "0A1524", TILE = "0F2840";
const HEAD = "Segoe UI", BODY = "Segoe UI";

let PAGE = 0;
const IDX_PAGE = 2;            // the Index/TOC slide number
const nav = {};               // section → first slide number (filled while building)
const cardSh = () => ({ type: "outer", color: "000000", blur: 7, offset: 2, angle: 90, opacity: 0.30 });
const sh = () => ({ type: "outer", color: "000000", blur: 9, offset: 3, angle: 90, opacity: 0.34 });
const ASSET = (f) => { try { return fs.existsSync("assets/" + f); } catch (e) { return false; } };
const SHOT_DIR = "../documentation/screenshots/";
const hasShot = (f) => { try { return fs.existsSync(SHOT_DIR + f); } catch (e) { return false; } };

const THEME = { overview: "bg-overview.png", medical: "bg-medical.png", training: "bg-training.png", livematch: "bg-livematch.png", team: "bg-team.png", conclusion: "bg-conclusion.png" };
const newSlide = (img) => { const s = pres.addSlide(); if (img) s.background = { path: "assets/" + img }; PAGE++; return s; };
function scrim(s) { s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: H, fill: { color: NAVY, transparency: 58 }, line: { type: "none" } }); }
// themed text slide (muted section background + scrim); falls back to clean mesh
function themed(theme) {
  const f = theme && THEME[theme] && ASSET(THEME[theme]) ? THEME[theme] : "bg-content.png";
  const s = newSlide(f);
  if (theme && f !== "bg-content.png") scrim(s);
  return s;
}
const content = () => newSlide("bg-content.png");   // clean mesh — diagrams & screenshots

// small cyan square — the only icon accent in the deck
function accent(s, x, y, sz = 0.16, color = CYAN) { s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: sz, h: sz, rectRadius: 0.03, fill: { color }, line: { type: "none" } }); }
function baseLine(s) { s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 7.06, w: 4.2, h: 0.022, fill: { color: CYAN }, line: { type: "none" } }); }
function footer(s) {
  s.addText("Sportify  ·  MSCMS", { x: 0.6, y: 7.04, w: 5, h: 0.3, color: MUTE, fontSize: 9, fontFace: BODY, margin: 0 });
  s.addText(String(PAGE), { x: 12.4, y: 7.04, w: 0.4, h: 0.3, color: MUTE, fontSize: 9, align: "right", fontFace: BODY, margin: 0 });
}
function backToIndex(s) {
  s.addText("Index", { x: 11.55, y: 0.2, w: 1.2, h: 0.3, align: "right", color: CYAN, bold: true, fontSize: 10, fontFace: BODY, margin: 0, hyperlink: { slide: IDX_PAGE, tooltip: "Back to Index" } });
}
function head(s, heading, subtitle) {
  s.addShape(pres.shapes.RECTANGLE, { x: 0.62, y: 0.52, w: 0.085, h: 0.74, fill: { color: CYAN }, line: { type: "none" } });
  s.addText(heading, { x: 0.92, y: 0.46, w: 10.5, h: 0.7, fontSize: 29, fontFace: HEAD, color: WHITE, bold: true, valign: "middle", margin: 0 });
  if (subtitle) s.addText(subtitle, { x: 0.94, y: 1.18, w: 11.4, h: 0.4, color: MUTE, italic: true, fontSize: 13, fontFace: BODY, margin: 0 });
}
const card = (s, x, y, w, h, fill = CARD, r = 0.1) =>
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: r, fill: { color: fill }, line: { color: BORDER, width: 1 }, shadow: cardSh() });
function gridCards(s, items, cols, o = {}) {
  const x0 = o.x0 ?? 0.62, y0 = o.y0 ?? 1.72, areaW = o.areaW ?? 12.06, areaH = o.areaH ?? 5.1;
  const gx = o.gx ?? 0.36, gy = o.gy ?? 0.32, ts = o.titleSize ?? 14, ds = o.descSize ?? 11.5;
  const rows = Math.ceil(items.length / cols);
  const cw = (areaW - (cols - 1) * gx) / cols, chh = (areaH - (rows - 1) * gy) / rows;
  items.forEach((it, i) => {
    const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (cw + gx), y = y0 + r * (chh + gy);
    card(s, x, y, cw, chh, (o.altFill && r % 2) ? CARD_HI : CARD);
    accent(s, x + 0.24, y + 0.26, 0.17);
    s.addText(it.title, { x: x + 0.54, y: y + 0.14, w: cw - 0.72, h: 0.5, color: CYAN, bold: true, fontSize: ts, fontFace: HEAD, valign: "middle", margin: 0 });
    s.addText(it.desc, { x: x + 0.24, y: y + 0.66, w: cw - 0.46, h: chh - 0.78, color: BODY_TX, fontSize: ds, fontFace: BODY, lineSpacingMultiple: 1.05, margin: 0, valign: "top" });
  });
}
function divider(theme, title, sub) {
  const s = themed(theme); backToIndex(s);
  s.addShape(pres.shapes.RECTANGLE, { x: W / 2 - 0.9, y: 2.95, w: 1.8, h: 0.06, fill: { color: CYAN }, line: { type: "none" } });
  s.addText(title, { x: 0, y: 3.2, w: W, h: 0.9, align: "center", color: WHITE, bold: true, fontSize: 40, fontFace: HEAD, margin: 0 });
  if (sub) s.addText(sub, { x: 0, y: 4.2, w: W, h: 0.5, align: "center", color: CYAN, italic: true, fontSize: 15, fontFace: BODY, margin: 0 });
  baseLine(s); footer(s); return s;
}
function featureSlide(f) {
  const s = themed(f.theme); head(s, f.title, f.blurb); backToIndex(s);
  const items = f.points, x0 = 0.95, y0 = 2.0, rh = Math.min(0.95, 4.7 / items.length);
  items.forEach((p, i) => {
    const y = y0 + i * rh;
    accent(s, x0 + 0.02, y + rh / 2 - 0.09, 0.16);
    s.addText([{ text: p[1] + " — ", options: { color: CYAN, bold: true } }, { text: p[2], options: { color: BODY_TX } }],
      { x: x0 + 0.42, y, w: 11.5, h: rh, fontSize: 14.5, fontFace: BODY, valign: "middle", lineSpacingMultiple: 1.05, margin: 0 });
  });
  baseLine(s); footer(s);
}
// "[Feature] · In Action" — clean-mesh slide (screenshot if present, else video placeholder)
function actionSlide(title, file, hint) {
  const s = content();
  s.addShape(pres.shapes.RECTANGLE, { x: 0.62, y: 0.4, w: 0.085, h: 0.6, fill: { color: CYAN }, line: { type: "none" } });
  s.addText([{ text: title + "  ", options: { color: WHITE, bold: true } }, { text: "·  In Action", options: { color: CYAN, bold: true } }],
    { x: 0.9, y: 0.32, w: 11.4, h: 0.66, fontSize: 23, fontFace: HEAD, valign: "middle", margin: 0 });
  backToIndex(s);
  const x = 0.45, y = 1.15, w = 12.4, h = 5.9;
  if (file && hasShot(file)) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.05, fill: { color: "0B1626" }, line: { color: BORDER, width: 1 }, shadow: cardSh() });
    s.addImage({ path: SHOT_DIR + file, x: x + 0.1, y: y + 0.1, sizing: { type: "contain", w: w - 0.2, h: h - 0.2 } });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.18, y: y + 0.16, w: 1.7, h: 0.4, rectRadius: 0.08, fill: { color: NAVY }, line: { color: CYAN, width: 1 } });
    s.addText("LIVE DEMO", { x: x + 0.18, y: y + 0.16, w: 1.7, h: 0.4, align: "center", valign: "middle", color: CYAN, bold: true, fontSize: 10, charSpacing: 2, fontFace: HEAD, margin: 0 });
  } else {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: "0E1E33" }, line: { color: CYAN, width: 1.5, dashType: "dash" } });
    s.addShape(pres.shapes.OVAL, { x: W / 2 - 0.62, y: y + h / 2 - 1.2, w: 1.24, h: 1.24, fill: { color: NAVY }, line: { color: CYAN, width: 2 } });
    s.addText("DEMO", { x: W / 2 - 0.62, y: y + h / 2 - 1.2, w: 1.24, h: 1.24, align: "center", valign: "middle", color: CYAN, bold: true, fontSize: 14, charSpacing: 1, fontFace: HEAD, margin: 0 });
    s.addText(`Embed the ${title} demo video here`, { x: 0, y: y + h / 2 + 0.28, w: W, h: 0.5, align: "center", color: CYAN, bold: true, fontSize: 16, fontFace: HEAD, margin: 0 });
    if (hint) s.addText(hint, { x: 2.2, y: y + h / 2 + 0.8, w: W - 4.4, h: 0.6, align: "center", color: MUTE, italic: true, fontSize: 12.5, fontFace: BODY, margin: 0 });
  }
  footer(s);
}
// a completely blank, titled slide for a role's interface screenshot (clean mesh)
function roleBlank(role, sees) {
  const s = content();
  s.addShape(pres.shapes.RECTANGLE, { x: 0.62, y: 0.4, w: 0.085, h: 0.6, fill: { color: CYAN }, line: { type: "none" } });
  s.addText(role + " — what they see", { x: 0.9, y: 0.32, w: 11.4, h: 0.66, fontSize: 23, fontFace: HEAD, color: WHITE, bold: true, valign: "middle", margin: 0 });
  backToIndex(s);
  const x = 0.45, y = 1.15, w = 12.4, h = 5.7;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.06, fill: { color: "0E1E33" }, line: { color: BORDER, width: 1.4, dashType: "dash" } });
  s.addText(`Insert the ${role} dashboard screenshot here`, { x: 0, y: y + h / 2 - 0.3, w: W, h: 0.5, align: "center", color: CYAN, bold: true, fontSize: 16, fontFace: HEAD, margin: 0 });
  s.addText(sees, { x: 2.2, y: y + h / 2 + 0.22, w: W - 4.4, h: 0.6, align: "center", color: MUTE, italic: true, fontSize: 12.5, fontFace: BODY, margin: 0 });
  footer(s);
}

const D = require("./content.json");

// ============================ 1. INTRODUCTION ============================
(() => {
  const s = newSlide("bg-title.png");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.92, y: 1.2, w: 1.4, h: 1.4, rectRadius: 0.14, fill: { color: WHITE }, shadow: sh() });
  s.addImage({ path: "assets/menoufia-logo.png", x: 1.03, y: 1.31, sizing: { type: "contain", w: 1.18, h: 1.18 } });
  s.addText("Sportify", { x: 0.95, y: 2.8, w: 11.4, h: 1.1, bold: true, fontSize: 62, fontFace: HEAD, color: WHITE, margin: 0 });
  s.addText([{ text: "Cloud-Native ", options: { color: CYAN } }, { text: "Multi-Sport Club Management System (MSCMS)", options: { color: WHITE } }],
    { x: 0.97, y: 3.92, w: 11.4, h: 0.55, bold: true, fontSize: 21, fontFace: HEAD, margin: 0 });
  s.addText("A modern multi-sport club should not run on a dozen apps and a hundred spreadsheets. Sportify brings squads, live matches, medical, plan-driven training, real competitions, analytics and fans into one secure, role-aware platform.",
    { x: 0.97, y: 4.66, w: 9.8, h: 1.3, color: BODY_TX, fontSize: 14.5, fontFace: BODY, lineSpacingMultiple: 1.25, margin: 0 });
  s.addText("Graduation Project · Menoufia University · Faculty of Computers and Information · 2025-2026",
    { x: 0.97, y: 6.35, w: 11.4, h: 0.4, color: MUTE, fontSize: 12, fontFace: BODY, margin: 0 });
  baseLine(s);
})();

// ============================ 2. INDEX (hyperlinked — filled at the end) ============================
const idx = themed("overview");
head(idx, "Index", "Click any section to jump straight to it");

// ============================ 3. PROBLEMS ============================
(() => {
  const s = themed("overview"); nav.problem = PAGE; head(s, "The Problem", "Why a multi-sport club struggles without a unified platform"); backToIndex(s);
  gridCards(s, D.problems.items, 2, { y0: 1.74, areaH: 5.05, titleSize: 14.5, descSize: 11.5, gy: 0.26 });
  baseLine(s); footer(s);
})();

// ============================ 4. PROJECT OVERVIEW & PURPOSE ============================
(() => {
  const s = themed("overview"); nav.overview = PAGE; head(s, "Project Overview and Purpose", "What Sportify is, how it works, and who it helps"); backToIndex(s);
  const cols = [
    ["What it is", "A cloud-native platform that unifies every operation of a multi-sport club into one secure, role-aware system, replacing scattered spreadsheets, paper files and chat threads."],
    ["How it works", "A Next.js dashboard talks to one JWT-secured API gateway, which routes to six Spring microservices and a Python ML and AI layer, all kept in sync by an event backbone."],
    ["How it helps", "Every role gets exactly the screen it needs, matches run live, injuries gate selection automatically, real competition data stays the single source of truth, and analytics drive decisions."],
  ];
  const cw = 3.84, chh = 4.5, gx = 0.42, x0 = 0.62, y0 = 1.85;
  cols.forEach((c, i) => {
    const x = x0 + i * (cw + gx);
    card(s, x, y0, cw, chh, (i % 2) ? CARD_HI : CARD, 0.12);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + cw / 2 - 0.4, y: y0 + 0.5, w: 0.8, h: 0.8, rectRadius: 0.12, fill: { color: TILE }, line: { color: CYAN, width: 1.25 } });
    accent(s, x + cw / 2 - 0.16, y0 + 0.74, 0.32);
    s.addText(c[0], { x, y: y0 + 1.55, w: cw, h: 0.5, align: "center", color: WHITE, bold: true, fontSize: 18, fontFace: HEAD, margin: 0 });
    s.addText(c[1], { x: x + 0.32, y: y0 + 2.2, w: cw - 0.64, h: 2.1, align: "center", color: BODY_TX, fontSize: 12.5, fontFace: BODY, lineSpacingMultiple: 1.18, valign: "top", margin: 0 });
  });
  baseLine(s); footer(s);
})();

// ============================ 5. FAST LIVE DEMO ============================
(() => {
  const s = themed("livematch"); backToIndex(s);
  s.addShape(pres.shapes.OVAL, { x: 5.95, y: 2.0, w: 1.4, h: 1.4, fill: { color: NAVY }, line: { color: CYAN, width: 2.5 }, shadow: sh() });
  s.addText("PLAY", { x: 5.95, y: 2.0, w: 1.4, h: 1.4, align: "center", valign: "middle", color: CYAN, bold: true, fontSize: 16, charSpacing: 2, fontFace: HEAD, margin: 0 });
  s.addText("FAST LIVE DEMO", { x: 0, y: 3.7, w: W, h: 0.5, align: "center", color: CYAN, bold: true, fontSize: 16, charSpacing: 5, fontFace: HEAD, margin: 0 });
  s.addText("Sportify in 60 Seconds", { x: 0, y: 4.15, w: W, h: 0.8, align: "center", color: WHITE, bold: true, fontSize: 36, fontFace: HEAD, margin: 0 });
  s.addText("A fast teaser before we dive in: login, the role dashboard, a live match, the medical room and team chat.",
    { x: 2.2, y: 5.05, w: 8.9, h: 0.7, align: "center", color: BODY_TX, fontSize: 15, fontFace: BODY, margin: 0 });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.15, y: 5.95, w: 5.0, h: 0.7, rectRadius: 0.1, fill: { color: TILE }, line: { color: CYAN, width: 1 } });
  s.addText("Insert quick overview video here", { x: 4.15, y: 5.95, w: 5.0, h: 0.7, align: "center", valign: "middle", color: BODY_TX, bold: true, fontSize: 13, fontFace: BODY, margin: 0 });
  baseLine(s); footer(s);
})();

// ============================ 6. SOLUTION ============================
(() => {
  const s = themed("overview"); nav.solution = PAGE; head(s, "The Solution", "How Sportify answers each problem: old playbook to cloud-native one"); backToIndex(s);
  gridCards(s, D.solutions.items, 3, { y0: 1.78, areaH: 4.95, titleSize: 13.5, descSize: 11.5 });
  baseLine(s); footer(s);
})();

// ============================ 7. GOALS ============================
(() => {
  const s = themed("overview"); head(s, D.goals.heading, D.goals.subtitle); backToIndex(s);
  const items = D.goals.items, x0 = 0.95, y0 = 1.82, rh = 0.84;
  items.forEach((g, i) => {
    const y = y0 + i * rh;
    accent(s, x0, y + 0.2, 0.18);
    s.addText([{ text: g.title + ":  ", options: { color: CYAN, bold: true } }, { text: g.desc, options: { color: BODY_TX } }],
      { x: x0 + 0.45, y, w: 11.4, h: 0.78, fontSize: 14.5, fontFace: BODY, valign: "middle", lineSpacingMultiple: 1.05, margin: 0 });
  });
  baseLine(s); footer(s);
})();

// ============================ 8. ARCHITECTURE (cards · clean) ============================
(() => {
  const s = content(); nav.arch = PAGE; head(s, D.architecture.heading, D.architecture.subtitle); backToIndex(s);
  gridCards(s, D.architecture.items, 4, { y0: 1.78, areaH: 4.95, titleSize: 12.5, descSize: 10, gx: 0.3 });
  baseLine(s); footer(s);
})();

// ============================ 9. ARCHITECTURE DIAGRAM (redesigned · clean layers) ============================
(() => {
  const s = content(); head(s, "Architecture at a Glance", "Clean layers · one gateway · Keycloak as a side-guard · Python AI as separate services"); backToIndex(s);
  const box = (x, y, w, h, title, sub, fill = CARD, bc = BORDER) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: bc, width: 1.25 }, shadow: cardSh() });
    s.addText(title, { x: x + 0.06, y: y + (sub ? 0.07 : 0), w: w - 0.12, h: sub ? h * 0.55 : h, align: "center", valign: "middle", color: WHITE, bold: true, fontSize: 11.5, fontFace: HEAD, margin: 0 });
    if (sub) s.addText(sub, { x: x + 0.06, y: y + h * 0.5, w: w - 0.12, h: h * 0.46, align: "center", valign: "middle", color: MUTE, fontSize: 8.5, fontFace: BODY, margin: 0 });
  };
  const arrow = (x1, y1, x2, y2, both, color = CYAN) => s.addShape(pres.shapes.LINE, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width: 1.75, beginArrowType: both ? "triangle" : "none", endArrowType: "triangle" } });
  const lbl = (x, y, w, t, col = MUTE) => s.addText(t, { x, y, w, h: 0.26, align: "center", color: col, fontSize: 8.5, italic: true, fontFace: BODY, margin: 0 });

  box(5.15, 1.62, 3.0, 0.62, "Next.js Dashboard", "React · browser", TILE, CYAN);
  arrow(6.65, 2.24, 6.65, 2.52); lbl(6.75, 2.27, 2.2, "one HTTPS origin");

  box(0.7, 2.52, 3.0, 0.72, "Keycloak", "Identity · OAuth2 / JWT", "1A2740", GOLD);
  box(5.0, 2.52, 3.3, 0.72, "Spring Cloud Gateway", ":8080 · routes + JWT check", "143049", CYAN);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.6, y: 2.34, w: 3.0, h: 1.06, rectRadius: 0.08, fill: { color: "172A1F" }, line: { color: GREEN, width: 1.25 }, shadow: cardSh() });
  s.addText("Python AI Services", { x: 9.6, y: 2.4, w: 3.0, h: 0.34, align: "center", color: WHITE, bold: true, fontSize: 11.5, fontFace: HEAD, margin: 0 });
  s.addText([{ text: "FastAPI ML — predictions & ratings", options: { breakLine: true } }, { text: "Barca Assistant — Python + LLM", options: {} }],
    { x: 9.7, y: 2.74, w: 2.8, h: 0.6, align: "center", color: BODY_TX, fontSize: 8.7, fontFace: BODY, lineSpacingMultiple: 1.05, margin: 0 });
  arrow(3.7, 2.88, 5.0, 2.88, true, GOLD); lbl(3.55, 2.58, 1.6, "validate JWT", GOLD);
  arrow(8.3, 2.88, 9.6, 2.88, false, GREEN); lbl(8.2, 2.58, 1.5, "/ml · /assistant", GREEN);
  arrow(6.65, 3.24, 6.65, 3.62);

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.95, y: 3.62, w: 9.4, h: 1.66, rectRadius: 0.08, fill: { color: "0E2236" }, line: { color: BORDER, width: 1 } });
  s.addText("Six domain microservices · a private PostgreSQL database per service", { x: 1.95, y: 3.66, w: 9.4, h: 0.28, align: "center", color: CYAN, bold: true, fontSize: 9.5, fontFace: HEAD, margin: 0 });
  const svc = [["User", "8081"], ["Player", "8084"], ["Training-Match", "8087"], ["Medical", "8086"], ["Reports", "8083"], ["Notification", "8085"]];
  const sx = 2.15, sy = 4.0, sw = 2.93, shh = 0.54, sgx = 0.06, sgy = 0.12;
  svc.forEach((t, i) => { const c = i % 3, r = Math.floor(i / 3); box(sx + c * (sw + sgx), sy + r * (shh + sgy), sw, shh, t[0], ":" + t[1]); });
  arrow(4.3, 5.28, 4.3, 5.6); arrow(9.0, 5.28, 9.0, 5.6);
  box(2.1, 5.6, 4.4, 0.66, "Kafka — Event Backbone", "outbox publisher · async", "241A2E", "7A5CC0");
  box(6.9, 5.6, 4.4, 0.66, "Eureka + Config Server", "discovery + central config", CARD_HI);
  box(0.62, 4.05, 1.15, 0.86, "football-data.org", "real fixtures", "1E2A18", GREEN);
  arrow(1.77, 4.48, 1.95, 4.48, false, GREEN);
  footer(s);
})();

// ============================ 10. TECH STACK (clean) ============================
(() => {
  const s = content(); head(s, "Enterprise-Grade Tech Stack", "Proven, production-grade technology at every layer"); backToIndex(s);
  const groups = [
    ["Back-End", ["Java 21 / Spring Boot 3.5", "Spring Cloud Gateway + Eureka", "PostgreSQL 14 (DB per service)", "Apache Kafka (eventing)"]],
    ["Front-End", ["Next.js 16 (App Router)", "React 19 and Tailwind v4", "JWT-secured API client"]],
    ["Infrastructure and AI", ["Keycloak 26 (Identity / JWT)", "Docker (containerized stack)", "Python FastAPI (ML models)", "Python + LLM (Club Assistant)"]],
  ];
  const cw = 3.78, chh = 4.2, gx = 0.5, x0 = 0.62, y0 = 1.85;
  groups.forEach((g, i) => {
    const x = x0 + i * (cw + gx);
    card(s, x, y0, cw, chh, CARD, 0.12);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + cw / 2 - 0.45, y: y0 + 0.42, w: 0.9, h: 0.9, rectRadius: 0.12, fill: { color: TILE }, line: { color: CYAN, width: 1.25 } });
    accent(s, x + cw / 2 - 0.18, y0 + 0.69, 0.36);
    s.addText(g[0], { x, y: y0 + 1.55, w: cw, h: 0.5, align: "center", color: WHITE, bold: true, fontSize: 18, fontFace: HEAD, margin: 0 });
    s.addText(g[1].map((t, j, a) => ({ text: t, options: { breakLine: j < a.length - 1, align: "center" } })),
      { x: x + 0.3, y: y0 + 2.2, w: cw - 0.6, h: 1.7, align: "center", color: BODY_TX, fontSize: 12.5, fontFace: BODY, paraSpaceAfter: 8, margin: 0 });
  });
  baseLine(s); footer(s);
})();

// ============================ 11. ROLES (divider + Value → BLANK per role) ============================
(() => { nav.roles = PAGE + 1; })();
divider("overview", "User Roles and Access", "Eleven role surfaces: each one's value, then its own screen.");
const ROLE_SHOT = {
  "Administrator": "Full access: every section, plus admin-only User Management.",
  "Sport Manager": "Squad, staff, matches, scouting, contracts and sponsor deals.",
  "Team Manager": "Roster, training schedule, fixtures and contracts.",
  "Head Coach": "Training, line-ups, matches, medical and analytics.",
  "Doctor": "Injuries, diagnoses and treatments for a player's medical case.",
  "Physiotherapist": "Rehabilitation plans and recovery tracking.",
  "Fitness Coach": "Fitness tests: create, assign, track and clear return-to-play.",
  "Performance Analyst": "Analytics, reports and the ML predictor and rating tools.",
  "Scout": "Scouting, prospects, matches and head-to-head.",
  "Player": "A read-only club, matches, training and own-medical view.",
  "Fan": "Club hub, competitions, store, auctions and the news feed.",
};
D.roles.items.forEach((role) => {
  const s = themed("overview"); head(s, role.title, "Role value and core responsibilities"); backToIndex(s);
  const parts = role.desc.split("•").map((p) => p.trim()).filter(Boolean);
  card(s, 0.92, 1.95, 11.46, 1.35, CARD_HI, 0.1);
  accent(s, 1.18, 2.28, 0.18);
  s.addText([{ text: "What this role drives — ", options: { color: CYAN, bold: true } }, { text: (parts[1] || role.desc).replace(/^Primary Functions:\s*/i, ""), options: { color: WHITE } }],
    { x: 1.5, y: 2.08, w: 10.6, h: 1.1, fontSize: 16, fontFace: BODY, valign: "middle", lineSpacingMultiple: 1.15, margin: 0 });
  accent(s, 1.18, 3.78, 0.18);
  s.addText([{ text: "Key access:  ", options: { color: CYAN, bold: true } }, { text: (parts[0] || "").replace(/^Key Access:\s*/i, ""), options: { color: BODY_TX } }],
    { x: 1.5, y: 3.62, w: 10.6, h: 1.0, fontSize: 14, fontFace: BODY, valign: "top", lineSpacingMultiple: 1.15, margin: 0 });
  baseLine(s); footer(s);
  roleBlank(role.title, ROLE_SHOT[role.title] || "Insert this role's dashboard.");
});

// ============================ 12. FEATURES (divider + Description → In Action per feature) ============================
(() => { nav.features = PAGE + 1; })();
divider("overview", "Key Features", "Each capability explained, then shown live.");
const FEATURES = [
  { title: "Role-Aware Dashboards", blurb: "One adaptive surface per role, from administrator to fan.", shot: "shot-dashboards.png", hint: "The admin or coach dashboard with its sidebar.", points: [
    ["", "Adaptive surface", "Every menu, page and action is tailored to the signed-in role."],
    ["", "Enforced twice", "A shared permissions map gates the sidebar and the server-side route guard."],
    ["", "Nine role surfaces", "From administrator to fan, each account sees only what it should."] ] },
  { title: "Multi-Sport and Multi-Team", blurb: "Sports, teams, rosters, contracts and transfers in one place.", shot: "shot-teams.png", hint: "The Teams and Sports page with multi-sport squads.", points: [
    ["", "Many sports", "Football, basketball, handball and more, all in one system."],
    ["", "First and reserve squads", "Each sport runs a senior team plus a reserve or academy team."],
    ["", "Full squad data", "Players, staff, contracts and transfers managed per team."] ] },
  { title: "Real Competitions", blurb: "Live La Liga and the new-format UEFA Champions League.", shot: "shot-competitions.png", hint: "The La Liga table or the Champions League league-phase.", points: D.competitions.items.slice(0, 4).map(i => ["", i.title, i.desc]) },
  { title: "Live-Match Engine", theme: "livematch", blurb: "A broadcast-style match-day cockpit, run minute by minute.", shot: "shot-livematch.png", hint: "A live match: clock, events and the add-event panel.", points: D.matches.items.slice(0, 4).map(i => ["", i.title, i.desc]) },
  { title: "Advanced Injury Management", theme: "medical", blurb: "A medically-governed return-to-play pipeline.", shot: "shot-injury.png", hint: "A player's staged medical recovery journey.", points: D.medical.items.slice(0, 4).map(i => ["", i.title, i.desc]) },
  { title: "Plan-Driven Training", theme: "training", blurb: "From season plan to scored session, one squad at a time.", shot: "shot-training.png", hint: "A training plan with its sessions, drills and attendance.", points: D.training.items.slice(0, 4).map(i => ["", i.title, i.desc]) },
  { title: "Scouting and Sponsorship", blurb: "Scout reports on prospects and sponsor-offer negotiation.", shot: "shot-scouting.png", hint: "A scouting report and a sponsor-offer negotiation.", points: [
    ["", "Sign-or-pass reports", "Scouts log structured reports (country, position, club, sport), grouped by sport."],
    ["", "Sponsor negotiation", "Offers move through pending, counter-offer and accepted states."],
    ["", "Auto-routed", "A new report emails and alerts the sport manager automatically."] ] },
  { title: "Team Messaging", blurb: "Club-wide group chat, delivered to every member.", shot: "shot-messaging.png", hint: "A team-chat group conversation.", points: [
    ["", "Group delivery", "A message posted to a group reaches every member of that group."],
    ["", "Reactions and replies", "Threaded replies and reactions keep conversations organized."],
    ["", "Team-scoped", "Staff and players only; fans stay on the spectator surface."] ] },
  { title: "Analytics and ML Predictions", blurb: "Match-outcome and player-rating predictions on real data.", shot: "shot-analytics.png", hint: "The Analytics dashboard or the ML predictor and rating.", points: [
    ["", "KPI dashboards", "Aggregates team, player and training KPIs from real records."],
    ["", "Match predictor", "A Python and FastAPI service forecasts match outcomes."],
    ["", "Player ratings", "An ML 0-100 rating informs selection and scouting."] ] },
  { title: "Live Notifications", blurb: "The whole club, kept in the loop in real time.", shot: "shot-notifications.png", hint: "The notifications bell open, or the Alerts center.", points: [
    ["", "Top-bar bell", "Injuries, goals, transfers and report-ready events surface instantly."],
    ["", "Event-driven", "Kafka events fan out to the notification service, with email."],
    ["", "Alerts center", "A full history of everything that happened."] ] },
  { title: "AI Club Assistant", blurb: "A Phase-1 intelligent assistant, the Barca Assistant.", shot: "shot-assistant.png", hint: "The Barca Assistant answering a club question.", points: [
    ["", "Domain-specific Q&A", "Answers questions about the club: sports, players, trophies and fixtures."],
    ["", "Bilingual replies", "Responds naturally in more than one language for fans and staff."],
    ["", "Python micro-service + LLM", "A dedicated FastAPI service backed by an LLM. Phase 1, built to grow."] ] },
];
const FB = {
  "shot-dashboards.png": "fig-dashboard.png", "shot-teams.png": "fig-club-hub.png",
  "shot-competitions.png": "fig-laliga.png", "shot-livematch.png": "fig-live-match.png",
  "shot-injury.png": "new-medical-lifecycle.PNG", "shot-training.png": "fig-training.png",
  "shot-scouting.png": "fig-scouting.png", "shot-messaging.png": "fig-messages.png",
  "shot-analytics.png": "fig-reports.png", "shot-notifications.png": "fig-notifications.png",
};
FEATURES.forEach((f) => {
  featureSlide(f);
  // Always leave the demo area as an empty video placeholder (no screenshots),
  // matching the "Fast Live Demo" template — drop in a recorded clip instead.
  actionSlide(f.title, null, f.hint);
});

// ============================ 13. FUTURE WORK (phased) ============================
(() => { nav.future = PAGE + 1; })();
divider("overview", "Future Work", "Two phases: a fan store and auctions, then a full engagement economy.");
(() => {
  const s = themed("overview"); head(s, "Phase 1 — Club Store and Auctions", "Turning fans into customers"); backToIndex(s);
  gridCards(s, [
    { title: "Official Club Store", desc: "An online merchandise store for fans: kits, training gear and memorabilia, with secure checkout and order tracking." },
    { title: "Bidding / Auction System", desc: "Timed auctions for exclusive, one-of-a-kind items where fans bid against each other in real time, with a live highest-bid, anti-snipe extension and a winner checkout." },
    { title: "Exclusive Signed Items", desc: "The auction's headline lots: gear signed by players, the coach or the club president. Scarcity drives the highest bids and margins." },
    { title: "Built on the Platform", desc: "Reuses the existing identity, notifications and payment rails, so the store and auctions plug straight into the current system." },
  ], 2, { y0: 1.85, areaH: 4.9, titleSize: 15, descSize: 12.5, gy: 0.36 });
  baseLine(s); footer(s);
})();
(() => {
  const s = themed("overview"); head(s, "Phase 2 — Fan Engagement and Monetization", "Scaling reach and revenue"); backToIndex(s);
  gridCards(s, [
    { title: "Fans and Sponsors Ad Board", desc: "A tailored advertisement board with placed, targeted slots that fans and sponsors can buy, turning audience reach into recurring revenue." },
    { title: "Club News Feed and Page", desc: "A comprehensive news feed and club page for official updates, match recaps, signings and announcements: the fan home of the platform." },
    { title: "Native Mobile Apps", desc: "iOS and Android apps with push notifications so fans, staff and players stay engaged on the move." },
    { title: "Deeper ML and Wearables", desc: "Richer predictions fed by live in-match features and wearable biometrics streamed into player profiles." },
  ], 2, { y0: 1.85, areaH: 4.9, titleSize: 15, descSize: 12.5, gy: 0.36 });
  baseLine(s); footer(s);
})();

// ============================ 14. FINANCIAL SECTION ============================
(() => {
  const s = themed("overview"); nav.finance = PAGE; head(s, "What I Got from This Project — Financial Section", "Five distinct, realistic revenue streams — each with its own payer and mechanism"); backToIndex(s);
  gridCards(s, [
    { title: "B2B SaaS Subscription", desc: "The core, recurring revenue: clubs and academies pay a tiered monthly or annual subscription to run their operations on the platform. Payer: clubs." },
    { title: "Auction Commission", desc: "A percentage cut of every completed sale in the fan bidding system — a purely transactional fee on exclusive, signed memorabilia. Payer: bidding fans." },
    { title: "Store Sales Margin", desc: "A commission on fixed-price official merchandise sold through the club store — distinct from auctions in mechanism and catalog. Payer: shopping fans." },
    { title: "Sponsorship & Targeted Ads", desc: "Paid, targeted placements and sponsor packages on the fan-facing surface (ad board and news feed), priced by audience reach. Payer: sponsors and advertisers." },
    { title: "Premium Fan Membership", desc: "An optional recurring fan tier: early auction access and exclusive content — a different payer and cadence from the club SaaS. Payer: fans." },
  ], 3, { y0: 1.8, areaH: 4.95, titleSize: 14, descSize: 11.5 });
  baseLine(s); footer(s);
})();
(() => {
  const s = themed("overview"); head(s, "Sustainability and Business Model", "Recurring base, transactional upside, one platform for many clubs"); backToIndex(s);
  const pts = [
    ["Recurring base", "SaaS licensing to clubs and academies gives predictable, recurring revenue."],
    ["Transactional upside", "Store sales, auction commission and ad placements scale with fan engagement."],
    ["Low marginal cost", "One cloud platform serves many clubs, so each new customer is mostly profit."],
    ["Reinvestment loop", "Revenue funds richer ML, mobile apps and more sports, which attract more clubs and fans."],
    ["Project to product", "A graduation project with a credible, staged path to a real, sustainable business."],
  ];
  pts.forEach((p, i) => {
    const y = 1.95 + i * 0.92; accent(s, 0.98, y + 0.16, 0.18);
    s.addText([{ text: p[0] + " — ", options: { color: CYAN, bold: true } }, { text: p[1], options: { color: BODY_TX } }],
      { x: 1.4, y, w: 11.2, h: 0.8, fontSize: 15, fontFace: BODY, valign: "middle", lineSpacingMultiple: 1.1, margin: 0 });
  });
  baseLine(s); footer(s);
})();

// ============================ 15. CONCLUSION (split + footer) ============================
(() => {
  const s = themed("conclusion"); nav.conclusion = PAGE; head(s, "Conclusion", ""); backToIndex(s);
  s.addShape(pres.shapes.RECTANGLE, { x: 6.64, y: 1.7, w: 0.018, h: 4.55, fill: { color: BORDER }, line: { type: "none" } });
  s.addText("The Big Picture", { x: 0.75, y: 1.72, w: 5.6, h: 0.45, color: CYAN, bold: true, fontSize: 17, fontFace: HEAD, margin: 0 });
  const impact = [
    "Turns a club's scattered, manual operations into one secure, real-time platform.",
    "Real value for every audience: staff run the club, players stay informed, fans stay engaged.",
    "Real competitions, a live-match engine and a complete medical workflow on real data.",
    "An extensible foundation ready for a fan store, auctions and a wider sporting world.",
  ];
  impact.forEach((t, i) => { const y = 2.35 + i * 1.0; accent(s, 0.8, y + 0.04, 0.15); s.addText(t, { x: 1.12, y, w: 5.25, h: 0.95, color: BODY_TX, fontSize: 13.5, fontFace: BODY, lineSpacingMultiple: 1.12, valign: "top", margin: 0 }); });
  s.addText("The Technology and Why", { x: 6.95, y: 1.72, w: 5.6, h: 0.45, color: CYAN, bold: true, fontSize: 17, fontFace: HEAD, margin: 0 });
  const tech = [
    ["Spring microservices", "independent scaling and a database per service: clean separation of concerns."],
    ["Gateway + Keycloak", "one secure entry point with role-based access enforced on every request."],
    ["Apache Kafka", "event-driven, so notifications and analytics never block the user."],
    ["Next.js / React", "a fast, role-aware UI delivered from a single API origin."],
    ["Python FastAPI + LLM", "ML predictions and a club assistant, kept as separate services."],
    ["Docker", "the whole stack reproducibly containerized for deployment."],
  ];
  tech.forEach((t, i) => { const y = 2.3 + i * 0.72; s.addText([{ text: t[0] + " — ", options: { color: WHITE, bold: true } }, { text: t[1], options: { color: BODY_TX } }], { x: 6.98, y, w: 5.5, h: 0.7, fontSize: 12.5, fontFace: BODY, valign: "top", lineSpacingMultiple: 1.1, margin: 0 }); });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.75, y: 6.42, w: 11.8, h: 0.013, fill: { color: BORDER }, line: { type: "none" } });
  s.addText("With sincere gratitude to our supervisor Dr. Shaimaa Saber, the Faculty of Computers and Information, and Menoufia University.",
    { x: 0.6, y: 6.55, w: 12.1, h: 0.45, align: "center", color: GOLD, italic: true, bold: true, fontSize: 13.5, fontFace: BODY, margin: 0 });
  footer(s);
})();

// ============================ 16. TEAM (reordered · photo above name) ============================
(() => {
  const s = themed("team"); head(s, "Team Members", "Supervised by Dr. Shaimaa Saber"); backToIndex(s);
  const team = ["Mohamed Salem", "Mohamed Abdellatief", "Mariam Mohamed Ahmed", "Eman Ahmed Elboghdady", "Khaled Mohamed", "Shahd Abdelaziz"];
  const cols = 3, cw = 3.6, chh = 2.1, gx = 0.5, gy = 0.45, x0 = 0.95, y0 = 1.95;
  team.forEach((t, i) => {
    const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (cw + gx), y = y0 + r * (chh + gy);
    card(s, x, y, cw, chh, (i % 2) ? CARD_HI : CARD, 0.12);
    s.addShape(pres.shapes.OVAL, { x: x + cw / 2 - 0.62, y: y + 0.22, w: 1.24, h: 1.24, fill: { color: TILE }, line: { color: CYAN, width: 1.4 } });
    s.addText("PHOTO", { x: x + cw / 2 - 0.62, y: y + 0.22, w: 1.24, h: 1.24, align: "center", valign: "middle", color: MUTE, fontSize: 10, charSpacing: 1, fontFace: BODY, margin: 0 });
    s.addText(t, { x: x + 0.1, y: y + 1.56, w: cw - 0.2, h: 0.45, align: "center", color: WHITE, bold: true, fontSize: 14.5, fontFace: HEAD, margin: 0 });
  });
  s.addText("Menoufia University · Faculty of Computers and Information · Graduation Project 2025-2026",
    { x: 0, y: 6.62, w: W, h: 0.4, align: "center", color: MUTE, fontSize: 12, fontFace: BODY, margin: 0 });
  baseLine(s); footer(s);
})();

// ============================ 17. THANKS ============================
(() => {
  const s = newSlide("bg-title.png");
  s.addText("Thank You", { x: 0, y: 2.9, w: W, h: 1.0, align: "center", color: WHITE, bold: true, fontSize: 52, fontFace: HEAD, margin: 0 });
  s.addText("Questions and discussion welcome", { x: 0, y: 4.1, w: W, h: 0.5, align: "center", color: CYAN, fontSize: 17, fontFace: BODY, margin: 0 });
  s.addText("Sportify · MSCMS  —  a cloud-native multi-sport club management platform", { x: 0, y: 5.2, w: W, h: 0.4, align: "center", color: MUTE, fontSize: 13, fontFace: BODY, margin: 0 });
  baseLine(s);
})();

// ============================ POPULATE THE HYPERLINKED INDEX ============================
(() => {
  const rows = [
    ["01", "The Problem", "Why a unified platform is needed", nav.problem],
    ["02", "Overview and Purpose", "What it is, how it works, who it helps", nav.overview],
    ["03", "Solution and Goals", "One cloud-native, role-aware platform", nav.solution],
    ["04", "Architecture and Tech", "Microservices, gateway, AI and the stack", nav.arch],
    ["05", "User Roles and Access", "A tailored, secure surface per role", nav.roles],
    ["06", "Key Features", "Each capability, explained and shown", nav.features],
    ["07", "Future Work", "Store, auctions and fan engagement", nav.future],
    ["08", "Financial Model", "How the platform earns and sustains", nav.finance],
    ["09", "Conclusion and Team", "Wrap-up and the people behind it", nav.conclusion],
  ];
  const cols = 2, cw = 5.9, chh = 0.92, gx = 0.4, gy = 0.16, x0 = 0.62, y0 = 1.6;
  rows.forEach((it, i) => {
    const c = i % cols, r = Math.floor(i / cols), x = x0 + c * (cw + gx), y = y0 + r * (chh + gy);
    const link = { slide: it[3] || IDX_PAGE, tooltip: "Go to " + it[1] };
    idx.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: chh, rectRadius: 0.12, fill: { color: (i % 2) ? CARD_HI : CARD }, line: { color: BORDER, width: 1 }, shadow: cardSh(), hyperlink: link });
    idx.addText(it[0], { x: x + 0.22, y, w: 0.85, h: chh, align: "center", valign: "middle", color: CYAN, bold: true, fontSize: 21, fontFace: HEAD, margin: 0, hyperlink: link });
    idx.addText(it[1], { x: x + 1.15, y: y + 0.13, w: cw - 1.3, h: 0.42, color: WHITE, bold: true, fontSize: 14.5, fontFace: HEAD, margin: 0, hyperlink: link });
    idx.addText(it[2], { x: x + 1.15, y: y + 0.5, w: cw - 1.3, h: 0.36, color: MUTE, fontSize: 10.5, fontFace: BODY, margin: 0, hyperlink: link });
  });
  baseLine(idx);
  idx.addText("Sportify  ·  MSCMS", { x: 0.6, y: 7.04, w: 5, h: 0.3, color: MUTE, fontSize: 9, fontFace: BODY, margin: 0 });
  idx.addText(String(IDX_PAGE), { x: 12.4, y: 7.04, w: 0.4, h: 0.3, color: MUTE, fontSize: 9, align: "right", fontFace: BODY, margin: 0 });
})();

const OUT = process.argv[2] || "Sportify-MSCMS-Overview-NEW.pptx";
pres.writeFile({ fileName: OUT }).then(f => console.log("WROTE", f, "·", PAGE, "slides"));
