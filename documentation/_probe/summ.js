const fs = require('fs');
const p = "C:\\Users\\BESTBY~1\\AppData\\Local\\Temp\\claude\\D--Project-final-repo\\eb55686d-49c7-4f4f-a4fc-ab47cc373446\\tasks\\w05es4xoi.output";
const raw = fs.readFileSync(p, 'utf8');
let data = JSON.parse(raw);
console.log("top-level:", typeof data, "isArray:", Array.isArray(data));
if (!Array.isArray(data) && data && typeof data === 'object') {
  console.log("keys:", Object.keys(data));
  // common wrappers
  for (const k of ['result', 'results', 'value', 'return', 'output', 'data']) {
    if (Array.isArray(data[k])) { data = data[k]; break; }
  }
  // if a key holds a JSON string
  if (!Array.isArray(data)) {
    for (const k of Object.keys(data)) {
      if (typeof data[k] === 'string' && data[k].trim().startsWith('[')) {
        try { const a = JSON.parse(data[k]); if (Array.isArray(a)) { data = a; break; } } catch {}
      }
    }
  }
}
if (!Array.isArray(data)) { console.log("could not find array; aborting"); process.exit(1); }
let ok = 0;
for (const d of data) {
  const ll = d.latex ? d.latex.length : 0;
  if (d.compiled) ok++;
  console.log(`${d.compiled ? 'OK ' : 'XX '} ${String(d.id).padEnd(20)} len=${String(ll).padStart(5)}  ${(d.notes || '').replace(/\s+/g,' ').slice(0, 55)}`);
}
console.log(`\n${ok}/${data.length} compiled-clean`);
// dump the parsed array (clean) to a file for assembly
fs.writeFileSync("D:\\Project-final-repo\\documentation\\_probe\\diagrams.json", JSON.stringify(data, null, 0));
console.log("wrote diagrams.json");
