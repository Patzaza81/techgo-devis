import { LISTES, METIERS, visibleIn, metierLabel } from "./metiers/listes.js";
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

// visibilité par métier : 3 cas visibles, 3 cas cachés
const elec = { ref: "ELE-CABLE", pack: "electricite" }, pein = { ref: "END-X", pack: "peinture" }, comm = { ref: "ACC-ECHAF-FIXE", pack: "" }, bet = { ref: "OUT-BETONNIERE", pack: "" };
ok("électricité voit un article d'électricité", visibleIn("electricite", elec));
ok("électricité voit un article commun (échafaudage)", visibleIn("electricite", comm));
ok("maçonnerie voit la bétonnière", visibleIn("maconnerie", bet));
ok("électricité ne voit PAS un article de peinture", !visibleIn("electricite", pein));
ok("électricité ne voit PAS la bétonnière", !visibleIn("electricite", bet));
ok("peinture ne voit PAS un article d'électricité", !visibleIn("peinture", elec));
ok("sans métier choisi : tout est visible", visibleIn("", pein) && visibleIn("", elec));
ok("libellé de métier", metierLabel("electricite") === "Électricité" && metierLabel("zzz") === "");
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
