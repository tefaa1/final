/* Dependency-free dark-navy + cyan background generator (Node stdlib zlib).
 * Matches the reference "Sportify Academic" look: deep navy gradient with a
 * glowing cyan node/line mesh — clean and watermark-free (unlike stock art). */
const fs = require("fs"), zlib = require("zlib");

function writePNG(path, w, h, rgb) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; raw[o++] = rgb[i]; raw[o++] = rgb[i + 1]; raw[o++] = rgb[i + 2]; }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, "latin1");
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])) >>> 0, 0);
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(path, Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]));
  console.log("wrote", path);
}

// deterministic PRNG so re-runs are identical
let _seed = 1337;
const rnd = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };

const W = 1280, H = 720;
const clamp = v => v < 0 ? 0 : v > 255 ? 255 : v | 0;

// Deep-navy vertical gradient with a soft radial glow toward (fx,fy).
function baseGradient(rgb, top, bot, fx, fy, glowR, glowAmt) {
  const cx = fx * W, cy = fy * H, R2 = (glowR * Math.max(W, H)) ** 2;
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    const br = top[0] + (bot[0] - top[0]) * t, bg = top[1] + (bot[1] - top[1]) * t, bb = top[2] + (bot[2] - top[2]) * t;
    for (let x = 0; x < W; x++) {
      const d2 = (x - cx) ** 2 + (y - cy) ** 2;
      const g = glowAmt * Math.exp(-d2 / R2);
      const i = (y * W + x) * 3;
      rgb[i] = clamp(br + g * 14); rgb[i + 1] = clamp(bg + g * 26); rgb[i + 2] = clamp(bb + g * 36);
    }
  }
}

// Additive cyan glow buffer (nodes + connecting lines), composited over base.
function meshGlow(rgb, opts) {
  const { count, x0, x1, y0, y1, nodeSig, haloSig, lineSig, lineAmt, nodeAmt } = opts;
  const glow = new Float32Array(W * H);
  const nodes = [];
  for (let k = 0; k < count; k++) nodes.push({ x: (x0 + rnd() * (x1 - x0)) * W, y: (y0 + rnd() * (y1 - y0)) * H });
  const splat = (cx, cy, sig, amp) => {
    const r = Math.ceil(3 * sig);
    const xa = Math.max(0, (cx - r) | 0), xb = Math.min(W, (cx + r) | 0), ya = Math.max(0, (cy - r) | 0), yb = Math.min(H, (cy + r) | 0);
    const s2 = 2 * sig * sig;
    for (let y = ya; y < yb; y++) for (let x = xa; x < xb; x++) { const dx = x - cx, dy = y - cy; glow[y * W + x] += amp * Math.exp(-(dx * dx + dy * dy) / s2); }
  };
  // connect each node to its 2 nearest neighbours
  for (let a = 0; a < nodes.length; a++) {
    const d = nodes.map((n, b) => ({ b, dist: (n.x - nodes[a].x) ** 2 + (n.y - nodes[a].y) ** 2 })).sort((p, q) => p.dist - q.dist);
    for (let m = 1; m <= 2 && m < d.length; m++) {
      const B = nodes[d[m].b], len = Math.hypot(B.x - nodes[a].x, B.y - nodes[a].y);
      if (len > 0.42 * W) continue; // skip very long links
      const steps = Math.ceil(len / (lineSig * 0.6));
      for (let s = 0; s <= steps; s++) { const t = s / steps; splat(nodes[a].x + (B.x - nodes[a].x) * t, nodes[a].y + (B.y - nodes[a].y) * t, lineSig, lineAmt / steps * 2.2); }
    }
  }
  // node halos + bright cores
  for (const n of nodes) { splat(n.x, n.y, haloSig, nodeAmt * 0.5); splat(n.x, n.y, nodeSig, nodeAmt); }
  // composite cyan
  const CY = [56, 196, 230];
  for (let p = 0; p < W * H; p++) {
    const g = glow[p]; if (g <= 0.002) continue;
    const gg = g > 1.25 ? 1.25 : g, i = p * 3;
    rgb[i] = clamp(rgb[i] + CY[0] * gg); rgb[i + 1] = clamp(rgb[i + 1] + CY[1] * gg); rgb[i + 2] = clamp(rgb[i + 2] + CY[2] * gg);
  }
}

const out = "D:\\Project-final-repo\\presentation\\assets\\";
const TOP = [18, 34, 54], BOT = [8, 17, 29];   // deep navy

// 1) Plain content background — subtle, glow upper-left
{ const rgb = Buffer.alloc(W * H * 3); baseGradient(rgb, TOP, BOT, 0.18, 0.12, 0.7, 1.0); writePNG(out + "bg-content.png", W, H, rgb); }

// 2) Title background — navy + faint mesh drifting in from the right
{ const rgb = Buffer.alloc(W * H * 3); baseGradient(rgb, TOP, BOT, 0.30, 0.35, 0.85, 1.1);
  _seed = 4242; meshGlow(rgb, { count: 26, x0: 0.55, x1: 1.02, y0: -0.02, y1: 1.02, nodeSig: 2.6, haloSig: 13, lineSig: 1.2, lineAmt: 0.5, nodeAmt: 0.95 });
  writePNG(out + "bg-title.png", W, H, rgb); }

// 3) Tech-network — denser glowing mesh (half/full-bleed accents)
{ const rgb = Buffer.alloc(W * H * 3); baseGradient(rgb, [14, 28, 46], [7, 15, 26], 0.6, 0.4, 0.8, 1.2);
  _seed = 909; meshGlow(rgb, { count: 38, x0: 0.02, x1: 0.98, y0: 0.04, y1: 0.96, nodeSig: 2.4, haloSig: 12, lineSig: 1.2, lineAmt: 0.55, nodeAmt: 1.0 });
  writePNG(out + "tech-network.png", W, H, rgb); }

// 4) Tech-mesh — even denser (architecture / microservices full-bleed)
{ const rgb = Buffer.alloc(W * H * 3); baseGradient(rgb, [13, 27, 45], [6, 14, 25], 0.5, 0.45, 0.9, 1.3);
  _seed = 71; meshGlow(rgb, { count: 54, x0: 0.0, x1: 1.0, y0: 0.0, y1: 1.0, nodeSig: 2.2, haloSig: 10, lineSig: 1.1, lineAmt: 0.5, nodeAmt: 0.95 });
  writePNG(out + "tech-mesh.png", W, H, rgb); }

console.log("done");
