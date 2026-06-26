const fs = require('fs');
const dir = "D:\\Project-final-repo\\documentation\\_probe\\";
const figdir = "D:\\Project-final-repo\\documentation\\chapters\\figs\\";
fs.mkdirSync(figdir, { recursive: true });
const data = JSON.parse(fs.readFileSync(dir + "diagrams.json", "utf8"));

function bodyOf(id) {
  const fx = dir + "fix_" + id + ".tex";
  const wf = dir + "wf_" + id + ".tex";
  const f = fs.existsSync(fx) ? fx : wf;
  const t = fs.readFileSync(f, "utf8");
  const b = t.split("\\begin{document}")[1].split("\\end{document}")[0].trim();
  return { body: b, src: fs.existsSync(fx) ? "fix" : "wf" };
}
const CAP_OVERRIDE = {
  'seq-medical': 'Sequence diagram of the injury-to-recovery workflow, advancing a player through diagnosis, treatment, rehabilitation and a recovery programme, with the stage read from the single injury status and availability restored only on a passing fitness test.',
};
function cap(s) {
  s = String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  s = s.replace(/(?<!\\)&/g, '\\&').replace(/(?<!\\)%/g, '\\%').replace(/(?<!\\)#/g, '\\#');
  return s;
}
let n = 0, fixes = 0;
for (const d of data) {
  let { body, src } = bodyOf(d.id);
  if (src === 'fix') fixes++;
  // pgf-umlsd sequence diagrams must NOT be wrapped in \resizebox (LR-mode error
  // inside a figure). Extract the bare environment and shrink with a font size.
  if (body.includes('sequencediagram')) {
    const m = body.match(/\\begin\{sequencediagram\}[\s\S]*\\end\{sequencediagram\}/);
    if (m) {
      // \\ line breaks inside message/instance labels are illegal in pgf-umlsd
      // (LR mode). They only ever occur inside labels, so collapse to a space.
      const seq = m[0].replace(/\\\\/g, ' ');
      // size to fit page width: 6+ instances need a smaller size than 5
      const ninst = (seq.match(/\\newinst|\\newthread/g) || []).length;
      const size = ninst > 5 ? '\\scriptsize' : '\\footnotesize';
      body = '{' + size + '\n' + seq + '\n}';
    }
  }
  const fig = `% auto-generated figure: ${d.id} (source: ${src})\n` +
    `\\begin{figure}[H]\n\\centering\n${body}\n\\caption{${cap(CAP_OVERRIDE[d.id] || d.caption)}}\n\\label{${d.label}}\n\\end{figure}\n`;
  fs.writeFileSync(figdir + d.id + ".tex", fig, "utf8");
  n++;
}
console.log(`wrote ${n} figure files to chapters/figs/ (${fixes} from fix_*, ${n - fixes} from wf_*)`);
