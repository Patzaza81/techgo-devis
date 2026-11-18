// Journal d'essai : activé seulement par le lien, ne garde aucun contenu saisi, export CSV lisible.
const mem = {};
globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
const J = await import("./journal.js");
let pass = 0, fail = 0;
const eq = (nom, a, b) => { const ok = JSON.stringify(a) === JSON.stringify(b); ok ? pass++ : fail++; console.log(`${ok ? "OK  " : "ÉCHEC"} ${nom}${ok ? "" : ` → ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`}`); };

J.noter("bouton", "pdf");
eq("sans le lien d'essai : rien n'est noté", J.entrees().length, 0);
J.lireParametre("?x=2"); eq("un autre paramètre n'active pas le journal", J.actif(), false);
J.lireParametre("?essai=1"); eq("« ?essai=1 » active le journal", J.actif(), true);
J.noter("bouton", "pdf"); J.noter("saisie", "row.price");
eq("deux entrées notées", J.entrees().map((e) => e.slice(1)), [["bouton", "pdf"], ["saisie", "row.price"]]);
eq("écran : l'identifiant du devis est masqué", J.ecran("#/devis/q_8f3a2/2"), "#/devis/x/2");
eq("écran sans devis inchangé", J.ecran("#/reglages"), "#/reglages");
eq("CSV : en-tête et séparateur « ; »", J.csv([["t", "bouton", "pdf"]]), "﻿heure;type;détail\nt;bouton;pdf\n");
eq("CSV : « ; » et guillemets protégés", J.csv([["t", "erreur", 'a;b "c"']]).split("\n")[1], 't;erreur;"a;b ""c"""');
for (let i = 0; i < 5100; i++) J.noter("bouton", "x");
eq("journal limité à 5 000 entrées", J.entrees().length, 5000);
J.effacer(); eq("Effacer vide le journal", J.entrees().length, 0);
J.lireParametre("?essai=0"); J.noter("bouton", "pdf");
eq("« ?essai=0 » arrête le journal", [J.actif(), J.entrees().length], [false, 0]);
mem["techgo-essai-journal"] = "pas du json"; eq("journal abîmé : liste vide, pas de plantage", J.entrees(), []);

console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
