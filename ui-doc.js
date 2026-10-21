// Documents imprimables : devis client (depuis un instantané figé ou un brouillon) et facture de gestion.
import { effSurface, surfaceSource } from "./packs.js";
export const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const fmtN = (n) => (n === null || n === undefined ? "—" : Math.round(n).toLocaleString("fr-FR"));
export const fmtD = (n) => (n === null || n === undefined ? "—" : Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 }));
export const fmt = (n) => (n === null || n === undefined ? "—" : fmtN(n) + " FCFA");
export const frDate = (iso) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "");

// ---------- Montant en lettres (français) ----------
const U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const T = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];
function b100(n, fin) {
  if (n < 20) return U[n];
  const t = Math.floor(n / 10), u = n % 10;
  if (t === 7) return "soixante" + (u === 1 ? " et onze" : "-" + U[10 + u]);
  if (t === 9) return "quatre-vingt-" + U[10 + u];
  if (t === 8) return u === 0 ? (fin ? "quatre-vingts" : "quatre-vingt") : "quatre-vingt-" + U[u];
  return T[t] + (u === 0 ? "" : u === 1 ? " et un" : "-" + U[u]);
}
function b1000(n, fin) {
  const h = Math.floor(n / 100), r = n % 100;
  if (h === 0) return b100(r, fin);
  const cent = h === 1 ? "cent" : U[h] + " cent";
  return r === 0 ? cent + (h > 1 && fin ? "s" : "") : cent + " " + b100(r, fin);
}
export function toWordsFr(n) {
  n = Math.round(n); if (n === 0) return "zéro"; if (n < 0) return "moins " + toWordsFr(-n);
  const bn = Math.floor(n / 1e9), m = Math.floor(n / 1e6) % 1000, k = Math.floor(n / 1e3) % 1000, r = n % 1000, out = [];
  if (bn) out.push(b1000(bn, false) + " milliard" + (bn > 1 ? "s" : ""));
  if (m) out.push(b1000(m, false) + " million" + (m > 1 ? "s" : ""));
  if (k) out.push(k === 1 ? "mille" : b1000(k, false) + " mille");
  if (r) out.push(b1000(r, true));
  return out.join(" ");
}

// ---------- Devis client ----------
const EXCL = {
  acces: ["exclu", "Les échafaudages et moyens d'accès ne sont pas inclus et font l'objet d'un chiffrage séparé."],
  acces_c: ["client", "Les échafaudages et moyens d'accès sont fournis par le client."],
  outillage: ["exclu", "L'outillage et les équipements ne sont pas inclus et font l'objet d'un chiffrage séparé."],
  transport: ["exclu", "Le transport et la manutention ne sont pas inclus."],
  protection: ["exclu", "Les protections et la sécurité du chantier ne sont pas incluses."],
  nettoyage: ["exclu", "Le nettoyage et l'évacuation des déchets ne sont pas inclus."],
};
export function exclusions(decisions) {
  const d = decisions || {}, out = [];
  if (d.acces === "exclu") out.push(EXCL.acces[1]); if (d.acces === "client") out.push(EXCL.acces_c[1]);
  for (const k of ["outillage", "transport", "protection", "nettoyage"]) if (d[k] === "exclu") out.push(EXCL[k][1]);
  return out;
}

function groupTable(lines) {
  const groups = [...new Set(lines.map((l) => l.group))];
  return groups.map((g) => {
    const ls = lines.filter((l) => l.group === g);
    return `<tr class="sub"><td colspan="4">${esc(g)}</td></tr>` +
      ls.map((l) => `<tr><td><b>${esc(l.label)}</b>${l.role ? `<div class="note">${esc(l.role)}</div>` : ""}</td><td class="n">${fmtN(l.qty)} ${esc(l.unit)}</td><td class="n">${fmtN(l.price)}</td><td class="n">${fmtN(l.total)}</td></tr>`).join("") +
      `<tr class="sub"><td colspan="3">Sous-total — ${esc(g)}</td><td class="n">${fmtN(ls.reduce((a, l) => a + (l.total ?? 0), 0))}</td></tr>`;
  }).join("");
}
export const legalLine = (c) => [c.rccm ? "RCCM : " + c.rccm : "", c.niu ? "NIU : " + c.niu : ""].filter(Boolean).join(" — ");
const head = (c, pres, draft) => `<div class="dochead"><div class="dl">${pres && pres.logo ? `<img class="dlogo" src="${pres.logo}" alt="">` : draft ? `<label class="logoslot noprint">+ Logo<input type="file" accept="image/png,image/jpeg" data-on="logoFile" hidden></label>` : ""}<div><b class="co">${esc(c.name)}</b><div class="note">${esc(c.tagline)}<br>${esc(c.address)}${c.phone ? " — Tél. " + esc(c.phone) : ""}<br>${c.whatsapp ? "WhatsApp " + esc(c.whatsapp) : ""}${c.web ? " — " + esc(c.web) : ""}</div></div></div></div>`;


// ---------- Devis du technicien : court, sobre, professionnel (modèles 1111, v4 TechGo, ERCOG) ----------
const MAT_CATS_D = ["materiaux", "consommables"];
const SECT = (l) => (MAT_CATS_D.includes(l.cat) ? "mat" : l.cat === "main_oeuvre" ? "mo" : ["transport", "installation", "sous_traitance", "frais"].includes(l.cat) ? "log" : "out");
const TECH_FORMS = { express: "Express", detaille: "Détaillé", chantier: "Chantier" };
function renderDocTech(snap, o = {}) {
  const f = snap.quote.form;
  return f === "express" ? techExpress(snap, o) : f === "chantier" ? techChantier(snap, o) : techDetaille(snap, o);
}
// Éléments communs aux trois formes
function tctx(snap, ref) {
  const q = snap.quote, r = snap.result, c = snap.company, t = r.totals, vat = q.terms.vatPct;
  const shown = r.lines.filter((l) => !(l.mode === "equip" && l.total === 0));
  const base = shown.filter((l) => !l.option), opt = shown.filter((l) => l.option);
  const sum = (ls) => ls.reduce((a, l) => a + (l.total ?? 0), 0);
  const pres = snap.presentation || {};
  const tpl = ["classique", "sobre", "compact"].includes(pres.template) ? pres.template : "classique";
  const acc = /^#[0-9a-fA-F]{6}$/.test(pres.color || "") ? pres.color : "#0b7a8c";
  const sc = r.schedules, nPay = sc.base.combined.length, trig = q.terms.triggers || [], pc = q.terms.payment.materials || [];
  const dMin = q.terms.delayMin, dMax = q.terms.delayMax;
  const delay = dMin && dMax && dMin !== dMax ? `${dMin} à ${dMax} jours` : dMax || dMin ? `${dMax || dMin} jours maximum` : "";
  const grand = vat === null ? t.base : t.ttcBase;
  const pay = Array.from({ length: nPay }, (_, i) => ({ name: (i === 0 ? "Acompte" : i === nPay - 1 ? "Solde" : "Versement " + (i + 1)) + (pc[i] !== undefined && pc.length === nPay ? ` (${pc[i]} %)` : ""), amt: vat === null ? sc.base.combined[i] : sc.base.ttc[i], trig: trig[i] || "" }));
  return { q, r, c, t, vat, base, opt, sum, pres, tpl, acc, pay, delay, grand, ref: ref || q.ref, mat: base.filter((l) => SECT(l) === "mat"), mo: base.filter((l) => SECT(l) === "mo"), out: base.filter((l) => SECT(l) === "out"), log: base.filter((l) => SECT(l) === "log"), sNet: effSurface(q.site) };
}
const sigBlock = (x, snap) => `<div class="sign"><div>POUR LE CLIENT — Bon pour accord<br>Date : ____/____/______<br><br>____________________________<br><span class="note">Nom, signature et mention « Lu et approuvé »</span></div>
      <div>POUR ${esc(x.c.name)}<br>Date : ${frDate(snap.at || x.q.date)}<br><br>____________________________<br><span class="note">${esc(x.c.responsible)} — Signature &amp; cachet</span></div></div>`;
const footTech = (x, snap) => `<div class="docfoot note">${esc(x.c.name)} — ${esc(x.ref)}${snap.n ? " V" + snap.n : ""}${x.c.whatsapp ? " — WhatsApp " + esc(x.c.whatsapp) : ""}${legalLine(x.c) ? "<br>" + esc(legalLine(x.c)) : ""}${snap.hash ? `<br>Empreinte de contrôle : ${snap.hash}` : ""}</div>`;
const lawLine = "Devis établi sur la base des informations et métrés fournis. Toute prestation non incluse dans le présent devis, ou toute variation en cours de chantier, fera l'objet d'un avenant écrit avant exécution.";
const optBox = (x) => (x.opt.length ? `<p>☐ Offre de base seule — <b>${fmt(x.t.base)}</b><br>☐ Offre de base + option — <b>${fmt(x.t.withOption)}</b></p>` : "");

// Forme « Express » : une page, un seul tableau (modèle devis n° 1111)
function techExpress(snap, { draft = false } = {}) {
  const x = tctx(snap, arguments[1] && arguments[1].ref), { q, c, t, vat } = x;
  const rows = (ls) => ls.map((l) => `<tr><td><b>${esc(l.label)}</b>${l.role ? `<div class="note">${esc(l.role)}</div>` : ""}</td><td class="n">${fmtN(l.qty)}</td><td>${esc(l.unit)}</td><td class="n">${fmtN(l.price)}</td><td class="n">${fmtN(l.total)}</td></tr>`).join("");
  const grp = [["Main-d'œuvre", x.mo], ["Outils, machines et accès", x.out], ["Transport, logistique et divers", x.log]].filter(([, ls]) => ls.length);
  return `<div id="doc" class="tpl-${x.tpl} tf tf-express" style="--dc:${x.acc}">
    ${head(c, x.pres, draft)}
    <h1>DEVIS${draft ? ' <span class="draftmark">PROJET — non figé</span>' : ""}</h1>
    <div class="meta">
      <div><span class="note">N° / DATE</span><b>${esc(x.ref)}${snap.n ? " — V" + snap.n : ""} — ${frDate(snap.at ? snap.at : q.date)}</b></div>
      <div><span class="note">VALABLE</span><b>${q.validityDays ?? "…"} jours</b></div>
      <div><span class="note">CLIENT</span><b>${esc(q.client.name) || "........................"}</b>${q.client.contact ? ` — ${esc(q.client.contact)}` : ""}</div>
      <div><span class="note">CHANTIER</span><b>${esc(q.site.name) || "Travaux"}${q.site.address ? " — " + esc(q.site.address) : ""}</b></div>
    </div>
    <table><thead><tr><th>Désignation</th><th class="n">Qté</th><th>Unité</th><th class="n">P.U.</th><th class="n">Montant</th></tr></thead>
      ${rows(x.mat)}${x.opt.length ? `<tr class="sub"><td colspan="5">Option non obligatoire</td></tr>${rows(x.opt)}` : ""}
      ${grp.map(([k, ls]) => `<tr class="sub"><td colspan="4">${k}${ls.length === 1 ? " — " + esc(ls[0].label) : ""}</td><td class="n">${fmtN(x.sum(ls))}</td></tr>`).join("")}
      ${t.discountBase ? `<tr><td colspan="4">Remise${q.discount.pct > 0 ? " (" + q.discount.pct + " %)" : ""}</td><td class="n">− ${fmtN(t.discountBase)}</td></tr>` : ""}
      <tr class="sub"><td colspan="4">TOTAL ${vat === null ? "(hors taxes)" : "HT"}</td><td class="n">${fmtN(t.base)}</td></tr>
      ${vat === null ? "" : `<tr><td colspan="4">TVA ${vat} %</td><td class="n">${fmtN(t.vatBase)}</td></tr><tr class="sub"><td colspan="4">TOTAL TTC</td><td class="n">${fmtN(t.ttcBase)}</td></tr>`}
      ${x.opt.length ? `<tr class="sub"><td colspan="4">TOTAL AVEC OPTION (HT)</td><td class="n">${fmtN(t.withOption)}</td></tr>` : ""}</table>
    <p class="note">Arrêté à la somme de <b>${toWordsFr(x.grand)} francs CFA</b>${vat === null ? " hors taxes" : " TTC"}.</p>
    <p class="note"><b>Règlement :</b> ${x.pay.map((p) => `${p.name} ${fmtN(p.amt)} FCFA${p.trig ? " — " + esc(p.trig.charAt(0).toLowerCase() + p.trig.slice(1)) : ""}`).join(" ; ")}.${x.delay ? ` <b>Durée des travaux :</b> ${x.delay}.` : ""}</p>
    <p class="note">${lawLine}${q.notes ? " " + esc(q.notes).replace(/\n/g, "<br>") : ""}</p>${optBox(x)}
    ${sigBlock(x, snap)}${footTech(x, snap)}</div>`;
}

// Forme « Chantier » : deux pages, fournitures puis synthèse et paiement (modèle ERCOG)
function techChantier(snap, { draft = false } = {}) {
  const x = tctx(snap, arguments[1] && arguments[1].ref), { q, c, t, vat } = x;
  const rows = (ls) => ls.map((l) => `<tr><td><b>${esc(l.label)}</b>${l.role ? `<div class="note">${esc(l.role)}</div>` : ""}</td><td class="n">${fmtN(l.qty)} ${esc(l.unit)}</td><td class="n">${fmtN(l.price)}</td><td class="n">${fmtN(l.total)}</td></tr>`).join("");
  const partiel = x.sum(x.mat) + x.sum(x.out) + x.sum(x.log);
  const crew = q.terms.crew || {};
  return `<div id="doc" class="tpl-${x.tpl} tf tf-chantier" style="--dc:${x.acc}">
    ${head(c, x.pres, draft)}
    <h1>DEVIS N° ${esc(x.ref)}${snap.n ? " — V" + snap.n : ""}${draft ? ' <span class="draftmark">PROJET — non figé</span>' : ""}</h1>
    <p class="note">${esc(c.address ? c.address.split(",").pop().trim() : "")}, le ${frDate(snap.at ? snap.at : q.date)}</p>
    <div class="meta"><div><span class="note">CLIENT</span><b>${esc(q.client.name) || "........................"}</b>${q.client.contact ? `<div class="note">${esc(q.client.contact)}</div>` : ""}</div>
      <div><span class="note">OBJET DU DEVIS</span><b>${esc(q.site.name) || "Travaux"}</b><div class="note">${esc(q.site.address)}${x.sNet ? ` — ${fmtD(x.sNet)} m²` : ""}</div></div></div>
    <h3>1. Détail des fournitures et matériaux</h3>
    <table><thead><tr><th>Désignation</th><th class="n">Quantité</th><th class="n">P.U. (FCFA)</th><th class="n">Montant (FCFA)</th></tr></thead>${rows(x.mat)}<tr class="sub"><td colspan="3">SOUS-TOTAL MATÉRIAUX</td><td class="n">${fmtN(x.sum(x.mat))}</td></tr></table>
    ${x.opt.length ? `<h3>Option non obligatoire</h3><table><tr><th>Désignation</th><th class="n">Quantité</th><th class="n">P.U. (FCFA)</th><th class="n">Montant (FCFA)</th></tr>${rows(x.opt)}<tr class="sub"><td colspan="3">SOUS-TOTAL OPTION</td><td class="n">${fmtN(x.sum(x.opt))}</td></tr></table>` : ""}
    <div class="gt"><div class="gl"><span>MONTANT TOTAL DU DEVIS${vat === null ? " (HT)" : " (TTC)"}<br><small>Transport et main-d'œuvre inclus — détail dans la synthèse financière</small></span><b class="gb">${fmt(x.grand)}</b></div></div>
    <h3>2. Synthèse financière</h3>
    <table><tr><td>Sous-total matériaux</td><td class="n">${fmt(x.sum(x.mat))}</td></tr>
      ${x.out.length ? `<tr><td>Outils, machines et accès</td><td class="n">${fmt(x.sum(x.out))}</td></tr>` : ""}${x.log.length ? `<tr><td>Transport, logistique et divers</td><td class="n">${fmt(x.sum(x.log))}</td></tr>` : ""}
      <tr class="sub"><td>Total partiel (coût des travaux)</td><td class="n">${fmt(partiel)}</td></tr>
      ${x.mo.length ? `<tr><td>Main-d'œuvre</td><td class="n">${fmt(x.sum(x.mo))}</td></tr>` : ""}
      ${t.discountBase ? `<tr><td>Remise</td><td class="n">− ${fmt(t.discountBase)}</td></tr>` : ""}
      <tr class="sub"><td>TOTAL ${vat === null ? "GÉNÉRAL (hors taxes)" : "HT"}</td><td class="n">${fmt(t.base)}</td></tr>
      ${vat === null ? "" : `<tr><td>TVA ${vat} %</td><td class="n">${fmt(t.vatBase)}</td></tr><tr class="sub"><td>TOTAL TTC</td><td class="n">${fmt(t.ttcBase)}</td></tr>`}
      ${x.opt.length ? `<tr class="sub"><td>Total avec option (HT)</td><td class="n">${fmt(t.withOption)}</td></tr>` : ""}</table>
    <p class="note">Arrêté le présent devis à la somme de : <b>${toWordsFr(x.grand)} francs CFA</b>.</p>
    ${crew.workers > 0 || crew.extraDay > 0 ? `<p class="note"><b>Main-d'œuvre :</b> ${crew.workers > 0 ? `${crew.workers} ouvrier${crew.workers > 1 ? "s" : ""}${x.delay ? `, durée prévue ${x.delay}` : ""}. ` : ""}${crew.extraDay > 0 ? `Au-delà de la durée prévue, supplément de ${fmtN(crew.extraDay)} FCFA par jour, validé avec le client avant poursuite.` : ""}</p>` : ""}
    <h3>3. Modalités de paiement</h3>
    <table><tr><th>Échéance</th><th class="n">Montant</th><th>Déclenchement</th></tr>${x.pay.map((p) => `<tr><td>${p.name}</td><td class="n">${fmt(p.amt)}</td><td>${esc(p.trig)}</td></tr>`).join("")}</table>
    <h3>4. Conditions</h3>
    <ul class="note"><li>Validité : ${q.validityDays ?? "…"} jours calendaires à compter de la date d'émission du devis.</li><li>Durée des travaux : ${x.delay || "selon planning à convenir avec le client"}.</li><li>Observations : toute prestation non incluse dans le présent devis fera l'objet d'un avenant écrit.</li>${(snap.conditions || []).map((y) => `<li>${esc(y)}</li>`).join("")}${q.notes ? `<li>${esc(q.notes).replace(/\n/g, "<br>")}</li>` : ""}</ul>${optBox(x)}
    <h3>5. Signatures</h3>${sigBlock(x, snap)}${footTech(x, snap)}</div>`;
}
function techDetaille(snap, { draft = false, ref = "" } = {}) {
  const q = snap.quote, r = snap.result, c = snap.company, t = r.totals, vat = q.terms.vatPct;
  const shown = r.lines.filter((l) => !(l.mode === "equip" && l.total === 0));
  const base = shown.filter((l) => !l.option), opt = shown.filter((l) => l.option);
  const sum = (ls) => ls.reduce((a, l) => a + (l.total ?? 0), 0);
  const mat = base.filter((l) => SECT(l) === "mat"), mo = base.filter((l) => SECT(l) === "mo"), out = base.filter((l) => SECT(l) === "out"), log = base.filter((l) => SECT(l) === "log");
  const pres = snap.presentation || {};
  const tpl = ["classique", "sobre", "compact"].includes(pres.template) ? pres.template : "classique";
  const acc = /^#[0-9a-fA-F]{6}$/.test(pres.color || "") ? pres.color : "#0b7a8c";
  const sc = r.schedules, nPay = sc.base.combined.length, trig = q.terms.triggers || [], pc = q.terms.payment.materials || [];
  const ohOn = q.overhead && q.overhead.mode === "ligne" && q.overhead.pct > 0;
  const crew = q.terms.crew || {}, dMin = q.terms.delayMin, dMax = q.terms.delayMax;
  const sNet = effSurface(q.site);
  const matRows = (ls) => ls.map((l) => `<tr><td><b>${esc(l.label)}</b>${l.role ? `<div class="note">${esc(l.role)}</div>` : ""}</td><td>${esc(l.unit)}</td><td class="n">${fmtN(l.qty)}</td><td class="n">${fmtN(l.price)}</td><td class="n">${fmtN(l.total)}</td></tr>`).join("");
  const head5 = `<tr><th>Désignation</th><th>Unité</th><th class="n">Qté</th><th class="n">P.U. (FCFA)</th><th class="n">Total (FCFA)</th></tr>`;
  const synth = [["Fournitures et matériaux", sum(mat)], ["Main-d'œuvre", sum(mo)], ["Outils, machines et accès", sum(out)], ["Transport, logistique et divers", sum(log)]].filter((x) => x[1] > 0);
  const delay = dMin && dMax && dMin !== dMax ? `${dMin} à ${dMax} jours` : dMax || dMin ? `${dMax || dMin} jours maximum` : "";
  const crewTxt = [crew.workers > 0 ? `Ce poste couvre la mobilisation de ${crew.workers} ouvrier${crew.workers > 1 ? "s" : ""}${delay ? ` sur une durée prévisionnelle de ${delay}` : ""}, ainsi que la supervision et la coordination du chantier.` : "", crew.extraDay > 0 ? `Au-delà de la durée prévue, pour une cause non imputable à ${esc(c.name)}, un supplément journalier de ${fmtN(crew.extraDay)} FCFA sera appliqué et validé avec le client avant poursuite des travaux.` : ""].filter(Boolean).join(" ");
  return `<div id="doc" class="tpl-${tpl} tf tf-detaille" style="--dc:${acc}">
    ${head(c, pres, draft)}
    <h1>DEVIS ESTIMATIF${draft ? ' <span class="draftmark">PROJET — non figé</span>' : ""}</h1>
    <div class="meta">
      <div><span class="note">RÉFÉRENCE</span><b>${esc(ref || q.ref)}${snap.n ? " — V" + snap.n : ""}</b></div>
      <div><span class="note">DATE</span><b>${frDate(snap.at ? snap.at : q.date)}</b></div>
      <div><span class="note">VALIDITÉ</span><b>${q.validityDays ?? "…"} jours</b></div>
      <div><span class="note">CLIENT</span><b>${esc(q.client.name) || "........................"}</b>${q.client.contact ? `<div class="note">${esc(q.client.contact)}</div>` : ""}</div>
      <div style="grid-column:1/-1"><span class="note">OBJET ET LIEU DU CHANTIER</span><b>${esc(q.site.name) || "Travaux"}${q.site.address ? " — " + esc(q.site.address) : ""}${sNet ? ` — ${fmtD(sNet)} m²` : ""}</b></div>
      ${c.responsible ? `<div style="grid-column:1/-1"><span class="note">RESPONSABLE CHANTIER</span><b>${esc(c.responsible)}${c.responsiblePhone ? " — " + esc(c.responsiblePhone) : ""}</b></div>` : ""}
    </div>
    <div class="gt"><div class="gl"><span>MONTANT TOTAL${vat === null ? " (hors taxes)" : " (HT)"}</span><b class="gb">${fmt(t.base)}</b></div>${vat === null ? "" : `<div class="gl"><span>Total TTC</span><b>${fmt(t.ttcBase)}</b></div>`}${opt.length ? `<div class="gl gold"><span>Avec option</span><b>${fmt(t.withOption)}</b></div>` : ""}</div>
    ${mat.length ? `<h3>1. Fournitures et matériaux</h3><table><thead>${head5}</thead>${matRows(mat)}<tr class="sub"><td colspan="4">SOUS-TOTAL FOURNITURES</td><td class="n">${fmtN(sum(mat))}</td></tr></table>` : ""}
    ${opt.length ? `<h3>Option non obligatoire</h3><table><thead>${head5}</thead>${matRows(opt)}<tr class="sub"><td colspan="4">SOUS-TOTAL OPTION</td><td class="n">${fmtN(sum(opt))}</td></tr></table>` : ""}
    <h3>${mat.length ? "2" : "1"}. Synthèse financière</h3>
    <table>${synth.map(([k, v]) => `<tr><td>${k}</td><td class="n">${fmt(v)}</td></tr>`).join("")}
      ${ohOn ? `<tr><td>Frais de fonctionnement (${q.overhead.pct} %)</td><td class="n">${fmt(t.overheadBase)}</td></tr>` : ""}
      ${t.discountBase ? `<tr><td>Remise${q.discount.pct > 0 ? " (" + q.discount.pct + " %)" : ""}</td><td class="n">− ${fmt(t.discountBase)}</td></tr>` : ""}
      <tr class="sub"><td>TOTAL ${vat === null ? "(hors taxes)" : "HT"}</td><td class="n">${fmt(t.base)}</td></tr>
      ${vat === null ? "" : `<tr><td>TVA ${vat} %</td><td class="n">${fmt(t.vatBase)}</td></tr><tr class="sub"><td>TOTAL TTC</td><td class="n">${fmt(t.ttcBase)}</td></tr>`}
      ${opt.length ? `<tr><td>Option</td><td class="n">${fmt(t.withOption - t.base)}</td></tr><tr class="sub"><td>Total avec option (HT)</td><td class="n">${fmt(t.withOption)}</td></tr>` : ""}</table>
    <p class="note">Arrêté le présent devis à la somme de <b>${toWordsFr(vat === null ? t.base : t.ttcBase)} francs CFA</b> (${fmtN(vat === null ? t.base : t.ttcBase)} FCFA${vat === null ? " hors taxes" : " TTC"}).</p>
    ${crewTxt ? `<p class="note"><b>Précision sur la main-d'œuvre :</b> ${crewTxt}</p>` : ""}
    <h3>${mat.length ? "3" : "2"}. Modalités de paiement</h3>
    <table><tr><th>Échéance</th><th class="n">Montant (FCFA)</th><th>Déclenchement</th></tr>
      ${Array.from({ length: nPay }, (_, i) => `<tr><td>${i === 0 ? "Acompte" : i === nPay - 1 ? "Solde" : "Versement " + (i + 1)}${pc[i] !== undefined && pc.length === nPay ? ` (${pc[i]} %)` : ""}</td><td class="n">${fmtN(vat === null ? sc.base.combined[i] : sc.base.ttc[i])}</td><td>${esc(trig[i] || "")}</td></tr>`).join("")}</table>
    <h3>Conditions</h3>
    <ul class="note"><li>Validité : ${q.validityDays ?? "…"} jours calendaires à compter de la date d'émission du devis.</li>
      ${delay ? `<li>Durée des travaux : ${delay}, à compter du démarrage effectif sur site.</li>` : ""}
      <li>Devis établi sur la base des informations et métrés fournis. Toute prestation non incluse dans le présent devis, ou toute variation en cours de chantier, fera l'objet d'un avenant écrit avant exécution.</li>
      ${(snap.conditions || []).map((x) => `<li>${esc(x)}</li>`).join("")}${q.notes ? `<li>${esc(q.notes).replace(/\n/g, "<br>")}</li>` : ""}</ul>
    ${opt.length ? `<p>☐ Offre de base seule — <b>${fmt(t.base)}</b><br>☐ Offre de base + option — <b>${fmt(t.withOption)}</b></p>` : ""}
    <div class="sign"><div>POUR LE CLIENT — Bon pour accord<br>Date : ____/____/______<br><br>____________________________<br><span class="note">Nom, signature et mention « Lu et approuvé »</span></div>
      <div>POUR ${esc(c.name)}<br>Date : ${frDate(snap.at || q.date)}<br><br>____________________________<br><span class="note">${esc(c.responsible)} — Signature &amp; cachet</span></div></div>
    <div class="docfoot note">${esc(c.name)} — ${esc(ref || q.ref)}${snap.n ? " V" + snap.n : ""}${c.whatsapp ? " — WhatsApp " + esc(c.whatsapp) : ""}${legalLine(c) ? "<br>" + esc(legalLine(c)) : ""}${snap.hash ? `<br>Empreinte de contrôle : ${snap.hash}` : ""}</div>
  </div>`;
}

/** snap = { quote, result, company, conditions, n, at, hash } ; draft = true si non figé */
export function renderDoc(snap, { draft = false, ref = "" } = {}) {
  if (snap.quote && snap.quote.profil === "technicien") return renderDocTech(snap, { draft, ref });
  const q = snap.quote, r = snap.result, c = snap.company, t = r.totals, vat = q.terms.vatPct;
  const shown = r.lines.filter((l) => !(l.mode === "equip" && l.total === 0));
  const base = shown.filter((l) => !l.option), opt = shown.filter((l) => l.option);
  const hasOpt = opt.length > 0;
  const ohLabel = q.overhead && q.overhead.mode === "ligne" && q.overhead.pct > 0;
  const tail = (sub, oh, disc, net, v, ttc) => `
    <tr class="sub"><td colspan="3">Sous-total HT</td><td class="n">${fmtN(sub)}</td></tr>
    ${ohLabel ? `<tr><td colspan="3">Frais généraux (${q.overhead.pct} %)</td><td class="n">${fmtN(oh)}</td></tr>` : ""}
    ${disc ? `<tr><td colspan="3">Remise${q.discount.pct > 0 ? " (" + q.discount.pct + " %)" : ""}</td><td class="n">− ${fmtN(disc)}</td></tr>` : ""}
    <tr class="sub"><td colspan="3">TOTAL HT</td><td class="n">${fmtN(net)}</td></tr>
    ${v === null ? "" : `<tr><td colspan="3">TVA ${vat} %</td><td class="n">${fmtN(v)}</td></tr><tr class="sub"><td colspan="3">TOTAL TTC</td><td class="n">${fmtN(ttc)}</td></tr>`}`;
  const sc = r.schedules, nPay = sc.base.combined.length, trig = q.terms.triggers || [];
  const excl = exclusions(q.decisions);
  const unitTotal = (k) => (vat === null ? fmt(k.ht) : `${fmt(k.ht)} HT · ${fmt(k.ttc)} TTC`);
  const tb = { ht: t.base, ttc: t.ttcBase }, to = { ht: t.withOption, ttc: t.ttcOption };
  const pres = snap.presentation || {};
  const tpl = ["classique", "sobre", "compact"].includes(pres.template) ? pres.template : "classique";
  const acc = /^#[0-9a-fA-F]{6}$/.test(pres.color || "") ? pres.color : "#0b7a8c";
  const sNet = effSurface(q.site);
  return `<div id="doc" class="tpl-${tpl}" style="--dc:${acc}">
    ${head(c, pres, draft)}
    <h1>DEVIS ESTIMATIF${draft ? ' <span class="draftmark">PROJET — non figé</span>' : ""}</h1>
    <div class="meta">
      <div><span class="note">RÉFÉRENCE</span><b>${esc(ref || q.ref)}${snap.n ? " — V" + snap.n : ""}</b></div>
      <div><span class="note">DATE</span><b>${frDate(snap.at ? snap.at : q.date)}</b></div>
      <div><span class="note">VALIDITÉ</span><b>${q.validityDays ?? "…"} jours</b></div>
      <div><span class="note">SURFACE / QUANTITÉ DE BASE</span><b>${fmtD(sNet)} m²</b></div>
      <div><span class="note">CLIENT</span><b>${esc(q.client.name) || "........................"}</b></div>
      <div><span class="note">CHANTIER</span><b>${esc(q.site.name)}${q.site.address ? " — " + esc(q.site.address) : ""}</b></div>
      ${c.responsible ? `<div style="grid-column:1/-1"><span class="note">RESPONSABLE CHANTIER</span><b>${esc(c.responsible)}${c.responsiblePhone ? " — " + esc(c.responsiblePhone) : ""}</b></div>` : ""}
    </div>
    <div class="gt"><div class="gl"><span>TOTAL OFFRE DE BASE${vat === null ? " (hors taxes)" : " (HT)"}</span><b class="gb">${fmt(t.base)}</b></div>
      ${vat === null ? "" : `<div class="gl"><span>Total TTC</span><b>${fmt(t.ttcBase)}</b></div>`}
      ${hasOpt ? `<div class="gl gold"><span>Avec option${vat === null ? "" : " (HT)"}</span><b>${fmt(t.withOption)}</b></div>` : ""}</div>
    ${vat === null ? `<p class="note"><i>Montants hors taxes — détail des quantités et modalités de paiement ci-dessous.</i></p>` : ""}
    <h3>Base de calcul des quantités</h3>
    <p class="note">Quantité ou surface de base : ${fmtD(sNet)} m²${surfaceSource(q.site) === "brute − ouvertures" ? ` (surface brute ${fmtD(q.site.surfaceBrute)} m² − ouvertures ${fmtD(q.site.ouvertures ?? 0)} m²)` : ""}. Marge de sécurité sur les produits : ${q.site.lossPct ?? 0} % (pertes, reprises, irrégularités du support) — surface de calcul : ${r.calcSurface.toLocaleString("fr-FR")} m². Quantité de produit = surface de calcul ÷ rendement, arrondie à l'unité de conditionnement supérieure. La main-d'œuvre est calculée sur la surface réelle.</p>
    <h3>Offre de base</h3>
    <table><tr><th>Désignation</th><th class="n">Quantité</th><th class="n">P.U. (FCFA)</th><th class="n">Total HT</th></tr>${groupTable(base)}${tail(t.subBase, t.overheadBase, t.discountBase, t.base, t.vatBase, t.ttcBase)}</table>
    ${hasOpt ? `<h3>Option non obligatoire</h3><table><tr><th>Désignation</th><th class="n">Quantité</th><th class="n">P.U. (FCFA)</th><th class="n">Total HT</th></tr>${groupTable(opt)}
      <tr class="sub"><td colspan="3">SOUS-TOTAL OPTION</td><td class="n">${fmtN(t.matOpt + t.svcOpt)}</td></tr>${tail(t.subOption, t.overheadOption, t.discountOption, t.withOption, t.vatOption, t.ttcOption)}</table>` : ""}
    <h3>Synthèse financière</h3>
    <table><tr><td>Fournitures et consommables (offre de base)</td><td class="n">${fmt(t.matBase)}</td></tr><tr><td>Main-d'œuvre, équipements et services (offre de base)</td><td class="n">${fmt(t.svcBase)}</td></tr>
    <tr class="sub"><td>Total offre de base (HT)</td><td class="n">${fmt(t.base)}</td></tr>${hasOpt ? `<tr><td>Option (HT)</td><td class="n">${fmt(t.withOption - t.base)}</td></tr><tr class="sub"><td>Total offre de base + option (HT)</td><td class="n">${fmt(t.withOption)}</td></tr>` : ""}</table>
    <p class="note">Arrêté le présent devis, offre de base, à la somme de <b>${toWordsFr(t.base)} (${fmtN(t.base)}) francs CFA ${vat === null ? "hors taxes" : "hors taxes"}</b>${hasOpt ? `; avec option, à la somme de <b>${toWordsFr(t.withOption)} (${fmtN(t.withOption)}) francs CFA hors taxes</b>` : ""}.</p>
    ${excl.length || q.notes ? `<h3>Périmètre, hypothèses et exclusions</h3><ul class="note">${excl.map((e) => `<li>${esc(e)}</li>`).join("")}${q.notes ? `<li>${esc(q.notes).replace(/\n/g, "<br>")}</li>` : ""}</ul>` : ""}
    <h3>Délai</h3><p class="note">${q.terms.delayMin ?? "…"} jours minimum à ${q.terms.delayMax ?? "…"} jours maximum, à compter du démarrage effectif des travaux sur site.</p>
    <h3>Modalités de paiement</h3>
    <table><tr><th>Versement</th><th class="n">Offre de base (HT)</th>${hasOpt ? `<th class="n">Avec option (HT)</th>` : ""}${vat === null ? "" : `<th class="n">Base TTC</th>`}<th>Déclenchement</th></tr>
    ${Array.from({ length: nPay }, (_, i) => `<tr><td>${i + 1}</td><td class="n">${fmtN(sc.base.combined[i])}</td>${hasOpt ? `<td class="n">${fmtN(sc.option.combined[i])}</td>` : ""}${vat === null ? "" : `<td class="n">${fmtN(sc.base.ttc[i])}</td>`}<td>${esc(trig[i] || "")}</td></tr>`).join("")}
    <tr class="sub"><td>Total</td><td class="n">${fmtN(sc.base.combined.reduce((a, b) => a + b, 0))}</td>${hasOpt ? `<td class="n">${fmtN(sc.option.combined.reduce((a, b) => a + b, 0))}</td>` : ""}${vat === null ? "" : `<td class="n">${fmtN(sc.base.ttc.reduce((a, b) => a + b, 0))}</td>`}<td></td></tr></table>
    <p class="note">Fournitures : ${esc((q.terms.payment.materials || []).join(" / "))} % · Main-d'œuvre et services : ${esc((q.terms.payment.services || []).join(" / "))} %.</p>
    ${(snap.conditions || []).length ? `<h3>Conditions de l'offre</h3><ul class="note">${snap.conditions.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    <h3>Choix du client et signatures</h3>
    <p>☐ Offre de base seule — <b>${fmt(t.base)}</b>${hasOpt ? `<br>☐ Offre de base + option — <b>${fmt(t.withOption)}</b>` : ""}</p>
    <div class="sign"><div>POUR LE CLIENT — Bon pour accord<br>Date : ____/____/______<br><br>____________________________<br><span class="note">Nom, signature et mention « Bon pour accord »</span></div>
      <div>POUR ${esc(c.name)}<br>Date : ${frDate(snap.at || q.date)}<br><br>____________________________<br><span class="note">${esc(c.responsible)} — Signature &amp; cachet</span></div></div>
    <div class="docfoot note">${esc(c.name)} — ${esc(ref || q.ref)}${snap.n ? " V" + snap.n : ""}${c.whatsapp ? " — WhatsApp " + esc(c.whatsapp) : ""}${legalLine(c) ? "<br>" + esc(legalLine(c)) : ""}${snap.hash ? `<br>Empreinte de contrôle : ${snap.hash} (vérifie l'intégrité du document ; ne remplace pas une signature électronique)` : ""}</div>
  </div>`;
}

export function renderInvoice(inv, c, pres) {
  return `<div id="doc" class="tpl-classique">${head(c, pres, false)}
    <h1>FACTURE DE GESTION <span class="draftmark">${esc(inv.no)}</span></h1>
    <div class="meta"><div><span class="note">DATE</span><b>${frDate(inv.date)}</b></div><div><span class="note">COMMANDE / DEVIS</span><b>${esc(inv.orderRef)} / ${esc(inv.quoteRef)}</b></div>
      <div><span class="note">CLIENT</span><b>${esc(inv.client) || "........................"}</b></div><div><span class="note">CHANTIER</span><b>${esc(inv.site)}</b></div></div>
    <table><tr><th>Désignation</th><th class="n">Montant HT</th>${inv.vat === null ? "" : `<th class="n">TVA</th><th class="n">TTC</th>`}</tr>
    <tr><td>Versement ${inv.tranche + 1} — ${esc(inv.label)}</td><td class="n">${fmtN(inv.amountHT)}</td>${inv.vat === null ? "" : `<td class="n">${fmtN(inv.vat)}</td><td class="n">${fmtN(inv.ttc)}</td>`}</tr>
    <tr class="sub"><td>Total à payer</td><td class="n" colspan="${inv.vat === null ? 1 : 3}">${fmt(inv.vat === null ? inv.amountHT : inv.ttc)}</td></tr></table>
    <p class="note">Arrêtée la présente facture à la somme de <b>${toWordsFr(inv.vat === null ? inv.amountHT : inv.ttc)} francs CFA</b>${inv.vat === null ? " hors taxes" : " toutes taxes comprises"}.</p>
    <p class="note"><b>Pièce de gestion.</b> Les mentions légales et fiscales obligatoires (identifiants fiscaux, régime, numérotation officielle) ne sont pas générées par l'application : à valider avant émission officielle.</p>
  </div>`;
}

export function summaryText(snap, ref) {
  const t = snap.result.totals, q = snap.quote, c = snap.company;
  return `${c.name} — Devis ${ref || q.ref}${snap.n ? " V" + snap.n : ""}\nChantier : ${q.site.name || "—"}\nTotal offre de base : ${fmt(t.base)} ${q.terms.vatPct === null ? "HT" : "HT (" + fmt(t.ttcBase) + " TTC)"}${snap.result.lines.some((l) => l.option) ? `\nAvec option : ${fmt(t.withOption)} HT` : ""}\nValidité : ${q.validityDays} jours\nLe devis détaillé (PDF) est joint.${snap.hash ? "\nEmpreinte : " + snap.hash : ""}`;
}
