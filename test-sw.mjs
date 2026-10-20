import fs from "fs";
const sw = fs.readFileSync("sw.js", "utf8");
const files = JSON.parse(sw.match(/const FILES = (\[.*?\]);/s)[1]);
const need = ["index.html", "app.js", "engine.js", "packs.js", "store.js", "ui-doc.js", "logo.js", "docx.js", "csv.js", ...fs.readdirSync("metiers").map((f) => "metiers/" + f)];
let fail = 0;
for (const f of need) if (!files.includes(f)) { console.log("FAIL absent du cache :", f); fail++; }
for (const f of files) if (f !== "./" && !fs.existsSync(f)) { console.log("FAIL fichier inexistant :", f); fail++; }
const dup = files.filter((f, i) => files.indexOf(f) !== i); if (dup.length) { console.log("FAIL doublon :", dup); fail++; }
const imports = [...fs.readdirSync(".").filter((f) => f.endsWith(".js")), ...fs.readdirSync("metiers").map((f) => "metiers/" + f)].filter((f) => !["sw.js"].includes(f));
for (const f of imports) if (!files.includes(f)) { console.log("FAIL js non listé :", f); fail++; }
console.log(fail ? `${fail} échec(s)` : "sw.js : liste de fichiers cohérente");
process.exit(fail ? 1 : 0);
