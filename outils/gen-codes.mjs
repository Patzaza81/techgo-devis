// Fabrique des codes de licence. Écrit les EMPREINTES dans licence-codes.js (à valider dans
// Git) et les CODES EN CLAIR dans le fichier donné (à ne JAMAIS mettre dans Git : le dépôt est public).
//   node outils/gen-codes.mjs 200 /chemin/prive/codes.csv
import fs from "node:fs";
import { nouveauCode, empreinte } from "../licence.js";
const n = Number(process.argv[2]), sortie = process.argv[3];
if (!(n > 0) || !sortie) { console.error("usage : node outils/gen-codes.mjs <nombre> <fichier privé>"); process.exit(1); }
if (fs.realpathSync(process.cwd()) === fs.realpathSync(new URL("..", import.meta.url).pathname) && !/^(\/|\.\.)/.test(sortie)) { console.error("Refus : le fichier des codes en clair doit être hors du dépôt."); process.exit(1); }
const existantes = (await import("../licence-codes.js")).EMPREINTES;
const codes = new Set();
while (codes.size < n) codes.add(nouveauCode());
const hs = []; for (const c of codes) hs.push(await empreinte(c));
const toutes = [...new Set([...existantes, ...hs])];
fs.writeFileSync(new URL("../licence-codes.js", import.meta.url), `// Empreintes des codes de licence valides. Généré par outils/gen-codes.mjs — ne pas modifier à la main.\nexport const EMPREINTES = ${JSON.stringify(toutes)};\n`);
fs.writeFileSync(sortie, "numero;code;vendu_a;date;montant\n" + [...codes].map((c, i) => `${i + 1};${c};;;`).join("\n") + "\n");
console.log(`${n} codes créés. Empreintes au total : ${toutes.length}. Codes en clair : ${sortie}`);
