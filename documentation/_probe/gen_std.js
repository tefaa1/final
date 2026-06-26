const fs = require('fs');
const dir = "D:\\Project-final-repo\\documentation\\_probe\\";
const ids = ["arch-overview", "state-match", "state-injury"];
for (const id of ids) {
  const fx = dir + "fix_" + id + ".tex", wf = dir + "wf_" + id + ".tex";
  const f = fs.existsSync(fx) ? fx : wf;
  const t = fs.readFileSync(f, "utf8");
  const m = t.match(/\\begin\{tikzpicture\}[\s\S]*\\end\{tikzpicture\}/);
  if (!m) { console.log("NO tikzpicture in", id); continue; }
  const tex = "\\documentclass[border=10pt]{standalone}\n\\input{../preamble-diagrams.tex}\n\\begin{document}\n" + m[0] + "\n\\end{document}\n";
  fs.writeFileSync(dir + "std_" + id + ".tex", tex);
  console.log("wrote std_" + id + ".tex");
}
// also print a few screenshot dimensions (PNG IHDR)
const ss = "D:\\Project-final-repo\\documentation\\screenshots\\";
for (const n of ["fig-dashboard", "fig-club-hub", "fig-live-match", "fig-messages"]) {
  try { const b = fs.readFileSync(ss + n + ".png"); console.log(n, b.readUInt32BE(16) + "x" + b.readUInt32BE(20), "aspect", (b.readUInt32BE(16) / b.readUInt32BE(20)).toFixed(2)); }
  catch (e) { console.log(n, "missing"); }
}
