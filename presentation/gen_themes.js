/* Dependency-free themed background generator (Node stdlib zlib).
 * Produces muted, dark, semi-transparent-looking section backgrounds so text
 * stays readable. These are tasteful ABSTRACT tints + faint motifs (not photos);
 * to use a real photograph for a section, just drop a same-named PNG over the
 * generated one (e.g. assets/bg-medical.png) and rebuild — build.js darkens it
 * with a scrim for readability either way. */
const fs = require("fs"), zlib = require("zlib");
const W = 1280, H = 720;

function writePNG(path, rgb) {
  const raw = Buffer.alloc((W * 3 + 1) * H);
  let o = 0;
  for (let y = 0; y < H; y++) { raw[o++] = 0; for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; raw[o++] = rgb[i]; raw[o++] = rgb[i + 1]; raw[o++] = rgb[i + 2]; } }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0); const t = Buffer.from(type, "latin1"); const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])) >>> 0, 0); return Buffer.concat([len, t, data, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(path, Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]));
  console.log("wrote", path);
}
const clamp = (v) => v < 0 ? 0 : v > 255 ? 255 : v | 0;

// tint = [r,g,b] accent · glow = {cx,cy,rad,amt} · motif(x,y)->additive brightness
function gen(path, tint, glow, motif) {
  const buf = new Uint8Array(W * H * 3);
  for (let y = 0; y < H; y++) {
    const vy = y / H;
    for (let x = 0; x < W; x++) {
      // base dark-navy vertical gradient
      let r = 8 + vy * 5, g = 17 + vy * 9, b = 30 + vy * 14;
      // soft radial tint glow
      const dx = (x - glow.cx) / W, dy = (y - glow.cy) / H;
      const d = Math.sqrt(dx * dx + dy * dy);
      const gI = Math.max(0, 1 - d / glow.rad) * glow.amt;
      r += tint[0] / 255 * gI * 60; g += tint[1] / 255 * gI * 60; b += tint[2] / 255 * gI * 60;
      // faint motif (kept low so it never fights the text)
      const m = motif ? motif(x, y) : 0;
      r += tint[0] / 255 * m; g += tint[1] / 255 * m; b += tint[2] / 255 * m;
      // gentle vignette
      const vig = 1 - 0.5 * Math.min(1, (Math.abs(x - W / 2) / (W / 2)) ** 3 + (Math.abs(y - H / 2) / (H / 2)) ** 3);
      const i = (y * W + x) * 3;
      buf[i] = clamp(r * vig); buf[i + 1] = clamp(g * vig); buf[i + 2] = clamp(b * vig);
    }
  }
  writePNG(path, buf);
}

const A = "assets/";
// Overview / corporate — faint diagonal mesh, cyan
gen(A + "bg-overview.png", [39, 182, 214], { cx: 1050, cy: 120, rad: 1.1, amt: 0.5 },
  (x, y) => (((x + y) % 64 < 1.5) || ((x - y + 2000) % 64 < 1.5) ? 10 : 0));
// Medical — faint plus/cross grid, teal
gen(A + "bg-medical.png", [40, 200, 180], { cx: 980, cy: 160, rad: 1.05, amt: 0.55 },
  (x, y) => { const gx = x % 96, gy = y % 96; return ((gx > 42 && gx < 54 && gy > 30 && gy < 66) || (gy > 42 && gy < 54 && gx > 30 && gx < 66)) ? 12 : 0; });
// Training — horizontal pitch stripes + faint centre ring, green
gen(A + "bg-training.png", [46, 170, 90], { cx: 300, cy: 600, rad: 1.2, amt: 0.5 },
  (x, y) => { const stripe = (Math.floor(y / 60) % 2) ? 6 : 0; const dx = x - 980, dy = y - 360, r = Math.sqrt(dx * dx + dy * dy); const ring = Math.abs(r - 150) < 2 ? 14 : 0; return stripe + ring; });
// Live match — concentric stadium arcs from top-centre, blue
gen(A + "bg-livematch.png", [40, 120, 220], { cx: 640, cy: 90, rad: 1.25, amt: 0.5 },
  (x, y) => { const dx = x - 640, dy = y - 70, r = Math.sqrt(dx * dx + dy * dy); return (Math.floor(r / 70) % 2) && (r % 70 < 2) ? 12 : 0; });
// Team — soft diagonal bands, indigo
gen(A + "bg-team.png", [120, 110, 200], { cx: 640, cy: 360, rad: 1.3, amt: 0.45 },
  (x, y) => (Math.floor((x + y * 0.6) / 90) % 2) ? 7 : 0);
// Conclusion — celebratory rising confetti dots, gold
gen(A + "bg-conclusion.png", [230, 184, 60], { cx: 640, cy: 200, rad: 1.3, amt: 0.5 },
  (x, y) => { const seed = (x * 73 ^ y * 19) % 997; return (seed < 6 && y < 520) ? 60 : 0; });
console.log("themed backgrounds generated.");
