// Règle d'arrondi unique (décision du 18/11/2026) : ligne au franc (0,5 vers le haut), total = somme des lignes,
// remise / frais / TVA sur le total HT arrondis au franc, TTC = HT + TVA. Une seule valeur attendue par cas.
import { computeQuote, montantLigne } from "./engine.js";
import { buildInput, newDraft } from "./packs.js";
let pass = 0, fail = 0;
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + n + (ok ? "" : `  obtenu=${JSON.stringify(g)} attendu=${JSON.stringify(w)}`)); };
// 1. montant d'une ligne — valeurs calculées à la main
for (const [q, p, w] of [[12, 6500, 78000], [2.5, 1250, 3125], [2.5, 1333, 3333], [0.35, 1350, 473], [1.15, 1100, 1265], [1500, 125000, 187500000], [0.333, 1000, 333], [0.3335, 1000, 334], [10, 0.5, 5], [100000, 99999, 9999900000]])
  eq(`ligne ${q} × ${p} = ${w}`, montantLigne(q, p), w);
eq("ligne sans prix : aucun montant (jamais zéro)", montantLigne(3, null), null);
// 2. devis complet : remise, TVA, décimales — l'écran, l'aperçu, le PDF et le Word lisent tous ce résultat
const cat = [["A", "materiaux", 12000], ["B", "materiaux", 6000], ["MO", "main_oeuvre", 20000], ["C", "materiaux", 1350]].map(([id, c, p]) => ({ id, ref: id, label: id, cat: c, unit: "pièce", pricing: "unitaire", price: p, cost: null, yield: null, tags: [], archived: false }));
const devis = (lignes, o = {}) => { const d = newDraft(); d.manual = lignes.map(([itemId, qty], i) => ({ id: "m" + i, itemId, group: "x", mode: "fixed", qty, option: false })); Object.assign(d, o); if (o.vat !== undefined) d.terms.vatPct = o.vat; return computeQuote(buildInput(d, cat, {})).totals; };
let t = devis([["A", 5], ["B", 2.5], ["MO", 2]], { discount: { pct: 10, amount: null }, vat: 19.25 });
eq("115 000 − 10 % = HT 103 500", t.base, 103500); eq("remise 11 500", t.discountBase, 11500); eq("TVA 19,25 % de 103 500 = 19 923,75 → 19 924", t.vatBase, 19924); eq("TTC 123 424", t.ttcBase, 123424);
t = devis([["A", 6.5], ["MO", 3]], { vat: 19.25 }); // 78 000 + 60 000 = 138 000
eq("TVA de 138 000 = 26 565", t.vatBase, 26565); eq("TTC 164 565", t.ttcBase, 164565);
t = devis([["C", 0.35], ["C", 0.35]], {});
eq("deux lignes 0,35 × 1 350 : 473 + 473 = 946 (somme des lignes affichées)", t.base, 946);
t = devis([["A", 1]], { discount: { pct: null, amount: 2500 }, vat: 19.25 }); // 12 000 − 2 500 = 9 500 ; TVA 1 828,75 → 1 829
eq("remise en montant : HT 9 500", t.base, 9500); eq("TVA 1 828,75 → 1 829", t.vatBase, 1829); eq("TTC 11 329", t.ttcBase, 11329);
t = devis([["A", 1]], { vat: 19.25 }); // 12 000 × 19,25 % = 2 310 exact
eq("TVA exacte 2 310, TTC 14 310", [t.vatBase, t.ttcBase], [2310, 14310]);
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
