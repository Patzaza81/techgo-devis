import fs from "fs";
import { buildDocx } from "./docx.js";
import { renderDoc, fmtN } from "./ui-doc.js";
import { ALL_SEEDS, referenceDraft, compute } from "./packs.js";
import { fingerprint } from "./engine.js";
import { LOGO } from "./logo.js";

let pass = 0, fail = 0;
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + n + (ok ? "" : `  obtenu=${JSON.stringify(g)} attendu=${JSON.stringify(w)}`)); };
const company = { name: "Entreprise Test", tagline: "Peinture", address: "Douala", phone: "600", whatsapp: "600", web: "", responsible: "M. Test", responsiblePhone: "600" };
function snapOf(draft, pres, opt = {}) {
  const cat = ALL_SEEDS(); const result = compute(draft, cat, {});
  const used = new Set(result.lines.map((l) => l.itemId)); const items = Object.fromEntries(cat.filter((i) => used.has(i.id)).map((i) => [i.id, i]));
  const s = { n: 1, at: "2026-10-20T10:00:00.000Z", quote: draft, items, company, conditions: ["Condition test"], presentation: pres, result };
  s.hash = fingerprint({ quote: s.quote, items: s.items, result: s.result }); return s;
}
const nums = (s) => (s.replace(/<[^>]+>/g, " ").replace(/[  ]/g, " ").match(/\d{1,3}(?: \d{3})+/g) || []).map((x) => x.replace(/ /g, "")).sort();
const pres = { template: "classique", color: "#0b7a8c", logo: LOGO, logoW: 128, logoH: 128 };

const ref = referenceDraft({});
const snap = snapOf(ref, pres);
const w = buildDocx(snap, ref.ref);
const html = renderDoc(snap, { ref: ref.ref });
eq("Word : montants identiques au PDF (offre de base + option + échéancier)", nums(w.text), nums(html));
for (const m of ["15 614 500", "17 608 850", "8 436 925", "5 396 700", "1 780 875"]) eq("Word contient " + m, w.text.replace(/[  ]/g, " ").includes(m), true);
eq("Word porte « copie modifiable » et la version", /Copie modifiable de la version V1/.test(w.text), true);
// les 3 modèles ne changent aucun montant
for (const tpl of ["classique", "sobre", "compact"]) {
  const h = renderDoc(snapOf(ref, { ...pres, template: tpl }), { ref: ref.ref });
  eq("modèle " + tpl + " : mêmes montants que classique", nums(h), nums(html));
  eq("modèle " + tpl + " appliqué", h.includes(`tpl-${tpl}`), true);
}
eq("couleur invalide ignorée (pas d'injection CSS)", renderDoc(snapOf(ref, { ...pres, color: "red;} body{display:none" }), {}).includes("display:none"), false);
// brouillon refusé
let err = ""; try { buildDocx({ ...snap, hash: undefined }); } catch (e) { err = e.message; }
eq("Word refusé pour un brouillon", /version figée/.test(err), true);
// déterminisme
eq("même version → mêmes octets", Buffer.from(buildDocx(snap, ref.ref).bytes).equals(Buffer.from(w.bytes)), true);
// sans logo
const w2 = buildDocx(snapOf(ref, { ...pres, logo: null }), ref.ref); eq("sans logo : pas d'image", w2.documentXml.includes("<w:drawing>"), false);
// avec option absente, TVA 18 (valeur de TEST, non réelle)
const r2 = JSON.parse(JSON.stringify(ref)); r2.terms.vatPct = 10; r2.discount = { pct: 5, amount: null };
const s2 = snapOf(r2, pres); eq("avec TVA de test + remise : montants Word = PDF", nums(buildDocx(s2, r2.ref).text), nums(renderDoc(s2, { ref: r2.ref })));

// RCCM / NIU : affichés seulement s'ils sont renseignés (jamais inventés)
{
  const withIds = { ...snap, company: { ...company, rccm: "RC/TEST/2026/B/0001", niu: "M0000TEST" } };
  const hh = renderDoc(withIds, { ref: ref.ref }), ww = buildDocx(withIds, ref.ref).text;
  eq("RCCM affiché dans le devis si renseigné", hh.includes("RCCM : RC/TEST/2026/B/0001"), true);
  eq("NIU affiché dans le devis si renseigné", hh.includes("NIU : M0000TEST"), true);
  eq("RCCM et NIU présents aussi dans le Word", ww.includes("RCCM : RC/TEST/2026/B/0001") && ww.includes("NIU : M0000TEST"), true);
  eq("sans RCCM/NIU : rien d'affiché (devis)", /RCCM|NIU/.test(html), false);
  eq("sans RCCM/NIU : rien d'écrit (Word)", /RCCM|NIU/.test(w.text), false);
  eq("RCCM seul : pas de NIU affiché", /NIU/.test(renderDoc({ ...snap, company: { ...company, rccm: "X1" } }, { ref: ref.ref })), false);
  eq("RCCM/NIU ne changent aucun montant", nums(hh), nums(html));
}
fs.writeFileSync(process.argv[2] || "/tmp/test.docx", w.bytes);
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
