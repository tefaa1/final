/* Dependency-free gradient PNG generator (Node stdlib zlib + crc32).
 * Produces vibrant FC-Barcelona-palette gradient backgrounds for the deck. */
const fs = require("fs"), zlib = require("zlib");

function writePNG(path, w, h, pix) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  let o = 0;
  for (let y = 0; y < h; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < w; x++) { const c = pix(x, y); raw[o++] = c[0]; raw[o++] = c[1]; raw[o++] = c[2]; }
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, "latin1");
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])) >>> 0, 0);
    return Buffer.concat([len, t, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(path, Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]));
  console.log("wrote", path);
}

const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function stops3(c0, c1, c2) { return t => t < 0.5 ? lerp(c0, c1, t * 2) : lerp(c1, c2, (t - 0.5) * 2); }
function stops2(c0, c1) { return t => lerp(c0, c1, t); }
// gentle diagonal parameter with a soft vignette toward darker corner for depth
const diag = (w, h) => (x, y) => (x / (w - 1) * 0.55 + y / (h - 1) * 0.45);

const BLUE = [0, 77, 152], GARNET = [165, 0, 68], GOLD = [237, 187, 0],
      NAVY = [11, 37, 69], MAG = [196, 30, 110], DEEP = [6, 24, 56], TEAL = [0, 119, 150];

const W = 1600, H = 900, D = diag(W, H);
const out = "D:\\Project-final-repo\\presentation\\assets\\";
const mk = (name, fn) => writePNG(out + name, W, H, (x, y) => fn(D(x, y)));

mk("grad-title.png", stops3(BLUE, GARNET, GOLD));   // hero
mk("grad-a.png", stops3(BLUE, MAG, GARNET));        // section dividers (cycle)
mk("grad-b.png", stops3(GARNET, MAG, GOLD));
mk("grad-c.png", stops3(DEEP, BLUE, TEAL));
mk("grad-d.png", stops3(NAVY, GARNET, GOLD));
mk("grad-navy.png", stops2(DEEP, BLUE));            // conclusion / calm
console.log("done");
