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
let err = ""; try { buildDocx(null); } catch (e) { err = e.message; }
eq("Word refusé si le devis est introuvable", /introuvable/.test(err), true);
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
{ const d = buildDocx({ ...snap, n: null, hash: undefined, at: null }, "REF-X"); eq("Word d'un brouillon : marqué brouillon, sans empreinte", d.text.includes("brouillon") && !d.text.includes("Empreinte de contrôle"), true); }
fs.writeFileSync(process.argv[2] || "/tmp/test.docx", w.bytes);
// En-tête imprimé : seulement ce qui est renseigné, aucun tiret orphelin
const vide = { ...company, tagline: "", address: "", phone: "", whatsapp: "", web: "" };
const hv = renderDoc({ ...snap, company: vide }, { ref: ref.ref });
const entete = hv.slice(hv.indexOf('class="dochead"'), hv.indexOf("</div></div></div>", hv.indexOf('class="dochead"')));
eq("en-tête sans coordonnées : pas de « Tél. » imprimé", /Tél\./.test(entete), false);
eq("en-tête sans coordonnées : pas de tiret orphelin", / — /.test(entete), false);
eq("en-tête complet : tél et WhatsApp imprimés", /Tél\. 600/.test(html) && /WhatsApp 600/.test(html), true);
// Détail du métré : imprimé dans le PDF et dans Word, sans changer aucun montant
const metre = { zones: [{ id: "z1", nom: "Salon", ouvrages: [{ id: "o1", type: "p_piece", v: { longueur: 4, largeur: 3, hauteur: 2.8, prod: [{ nom: "Peinture", couches: 2, couv: 40 }] } }] }] };
const refM = referenceDraft({}); refM.metre = metre; const snapM = snapOf(refM, pres);
for (const f of ["express", "detaille", "chantier", ""]) {
  const sm = snapOf({ ...refM, profil: f ? "technicien" : refM.profil, form: f }, pres), hm = renderDoc(sm, { ref: refM.ref });
  eq(`métré imprimé (forme ${f || "entreprise"}) : zone et formule`, /Détail du métré/.test(hm) && hm.includes("Salon") && hm.includes("2 × (4 + 3) × 2,8 = 39,2 m²"), true);
}
eq("métré imprimé : les montants ne changent pas", nums(renderDoc(snapM, { ref: refM.ref }).replace(/<h3 class="metreh">[\s\S]*?<\/table>/, "")), nums(html));
const wm = buildDocx(snapM, refM.ref);
eq("Word : détail du métré présent", wm.text.includes("Détail du métré") || wm.text.includes("DÉTAIL DU MÉTRÉ"), true);
eq("Word : formule du métré présente", wm.text.includes("2 × (4 + 3) × 2,8 = 39,2 m²"), true);
eq("métré non imprimé si décoché", /Détail du métré/.test(renderDoc(snapOf({ ...refM, metre: { ...metre, imprimer: false } }, pres), { ref: refM.ref })), false);
eq("devis sans métré : aucun bloc ajouté", /Détail du métré/.test(html), false);
// Quantités décimales : 0,32 m³ ne s'imprime plus « 0 »
import("./ui-doc.js").then((U) => { eq("quantité 0,32 imprimée 0,32 (pas 0)", [U.fmtQ(0.32), U.fmtQ(366), U.fmtQ(47.87), U.fmtQ(1234)], ["0,32", "366", "47,87", U.fmtN(1234)]); });
await new Promise((r) => setTimeout(r, 20));
// Word valide et sans texte de remplissage (audit v40)
{ const d0 = JSON.parse(JSON.stringify(ref)); d0.terms.delayMin = null; d0.terms.delayMax = null; const c0 = { ...company, responsible: "" };
  const s0 = { ...snapOf(d0, pres), company: c0 }; const w0 = buildDocx(s0, d0.ref);
  eq("Word : aucune virgule entre deux cellules (XML valide)", /<\/w:tc>,<w:tc>|<\/w:tr>,<w:tr>/.test(w0.documentXml), false);
  eq("Word : pas de « … jours » quand la durée est vide", /…\s*jours/.test(w0.text), false);
  eq("Word : pas de « — Signature » sans responsable", /(^|>)\s*— Signature/.test(w0.documentXml), false);
  const d1 = JSON.parse(JSON.stringify(ref)); d1.terms.delayMin = 10; d1.terms.delayMax = 15; const w1 = buildDocx(snapOf(d1, pres), d1.ref);
  eq("Word : la durée saisie est écrite (10 à 15 jours)", /10 à 15 jours/.test(w1.text), true);
  eq("Word : la date est écrite", /20\/10\/2026/.test(w1.text), true);
  eq("Word : le responsable signe quand il existe", /M\. Test — Signature/.test(w1.text), true);
}

// Arrêté du devis : sur le montant à payer (TTC) quand une TVA est appliquée, sinon hors taxes (audit v40)
{ const d2 = JSON.parse(JSON.stringify(ref)); d2.terms.vatPct = 19.25; const s2 = snapOf(d2, pres); const w2 = buildDocx(s2, d2.ref), h2 = renderDoc(s2, { ref: d2.ref });
  eq("Word avec TVA : arrêté « toutes taxes comprises »", /Arrêté[^\n]*toutes taxes comprises/.test(w2.text), true);
  eq("Aperçu avec TVA : arrêté « toutes taxes comprises »", /toutes taxes comprises/.test(h2), true);
  eq("Word avec TVA : TVA écrite « 19,25 % »", /TVA 19,25 %/.test(w2.text), true);
  eq("Word sans TVA : arrêté hors taxes", /Arrêté[^\n]*hors taxes/.test(w.text) && !/toutes taxes comprises/.test(w.text), true);
}

// Synthèse : les lignes s'additionnent jusqu'au total (la remise y figure) — audit v40
{ const d3 = JSON.parse(JSON.stringify(ref)); d3.discount = { pct: 10, amount: null }; const s3 = snapOf(d3, pres); const w3 = buildDocx(s3, d3.ref), h3 = renderDoc(s3, { ref: d3.ref });
  const t3 = s3.result.totals; eq("Synthèse : fournitures + services − remise = total", t3.matBase + t3.svcBase + (t3.overheadBase || 0) - t3.discountBase === t3.base, true);
  const syn = w3.text.slice(w3.text.indexOf("SYNTHÈSE") >= 0 ? w3.text.indexOf("SYNTHÈSE") : w3.text.indexOf("Synthèse")); eq("Word : la remise est dans la synthèse", /Remise/.test(syn.slice(0, 600)), true);
  const hs = h3.slice(h3.indexOf("Synthèse financière")); eq("Aperçu : la remise est dans la synthèse", /Remise/.test(hs.slice(0, 1500)), true);
}

console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
