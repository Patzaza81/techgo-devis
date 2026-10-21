import { LISTES, METIERS } from "./metiers/listes.js";
import { PACKS } from "./packs.js";
let pass = 0, fail = 0;
const ok = (n, c) => { c ? pass++ : fail++; console.log((c ? "OK   " : "FAIL ") + n); };
ok("5 métiers dans la liste", METIERS.length === 5 && METIERS.every(([k]) => LISTES[k]));
ok("chaque métier de la liste existe dans les packs", METIERS.every(([k]) => PACKS[k]));
for (const [k] of METIERS) for (const tab of ["produits", "outils", "ouvriers", "autres"]) {
  const l = LISTES[k][tab];
  ok(`${k}/${tab} : rempli, sans doublon`, Array.isArray(l) && l.length > 0 && new Set(l.map((x) => x.toLowerCase())).size === l.length);
  ok(`${k}/${tab} : noms seulement (aucun chiffre, aucun prix)`, l.every((x) => !/\d{2,}|fcfa|prix/i.test(x)));
}
ok("test d'échec : un nom avec prix serait refusé", !(!/\d{2,}|fcfa|prix/i.test("Ciment 6500 FCFA")));
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
