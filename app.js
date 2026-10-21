import * as S from "./store.js";
import { CATS, PRICING, DECISION_TAGS, PACKS, scaffoldLines, referenceDraft, effSurface, surfaceSource } from "./packs.js";
import { buildDocx, DOCX_MIME } from "./docx.js";
import { analyseCsv, exportCatalogueCsv, templateCsv, exportRowsCsv } from "./csv.js";
import { LOGO } from "./logo.js";
import { LISTES, METIERS, visibleIn, metierLabel } from "./metiers/listes.js";
import { esc, fmt, fmtN, fmtD, frDate, renderDoc, renderInvoice, summaryText } from "./ui-doc.js";

const $ = (s) => document.querySelector(s);
const ICONS = {
  devis: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  clients: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M18.5 14.4c1.8.8 3 2.6 3 5.6"/>',
  catalogue: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  suivi: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  reglages: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  produits: '<path d="M5 8h14l-1 12H6z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  outils: '<path d="M14.5 6.5a4 4 0 0 0-5 5L3 18l3 3 6.5-6.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  ouvriers: '<path d="M5 17h14v3H5zM7 17v-3a5 5 0 0 1 10 0v3M12 6V3"/>',
  autres: '<path d="M2 6h12v10H2zM14 9h4l4 3v4h-8zM6 19a2 2 0 1 0 0-.01M18 19a2 2 0 1 0 0-.01"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>', warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18.2v.1"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>',
};
const ic = (n, sz = 22) => `<svg class="ic" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;
const STEPS_E = ["Client et chantier", "Travaux", "Produits et main-d'œuvre", "Prix et paiement", "Vérifier et envoyer"];
const STEPS_T = ["Le client", "Le travail et le matériel", "Le prix et l'envoi"];
// Technicien : 3 écrans rapides. Entreprise / marché public : 5 écrans complets. Le mode est fixé à la création du devis.
const modeOf = (q) => (q && q.current && q.current.profil === "technicien" ? "technicien" : "entreprise");
const stepsOf = (q) => (modeOf(q) === "technicien" ? STEPS_T : STEPS_E);
const lastOf = (q) => stepsOf(q).length - 1; // la page suivante = « Suivi du devis » (hors barre de progression)
const DECISIONS = [["", "Non examiné"], ["inclus", "Inclus (je chiffre une ligne)"], ["exclu", "Exclu du devis (chiffré séparément)"], ["client", "Fourni par le client"], ["na", "Sans objet"]];
const STATE_LABEL = { complet: "Prêt", verifier: "À vérifier", bloque: "Il manque quelque chose" };
const activeMetier = () => S.state.db.settings.metier || "";
const metierOf = (q) => q.current.metier || (q.current.prestations[0] && q.current.prestations[0].packId) || activeMetier();
const chooser = (cur) => `<div class="chips">${METIERS.map(([k, n]) => `<button type="button" class="chip ${cur === k ? "on" : ""}" data-act="setMetier" data-k="${k}">${n}</button>`).join("")}</div>`;
const nz = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const TABS = [["produits", "Produits"], ["outils", "Outils et machines"], ["ouvriers", "Ouvriers"], ["autres", "Transport et autres"]];
const TAB_OF = { materiaux: "produits", consommables: "produits", equip_possede: "outils", equip_loue: "outils", outillage: "outils", acces: "outils", securite: "outils", main_oeuvre: "ouvriers", transport: "autres", installation: "autres", sous_traitance: "autres", frais: "autres" };
const FREE_CAT = { produits: "materiaux", outils: "outillage", ouvriers: "main_oeuvre", autres: "transport" };
const FREE_UNITS = { produits: ["sac", "seau", "litre", "kg", "mètre", "pièce", "m²"], outils: ["jour", "forfait"], ouvriers: ["jour", "heure", "m²", "forfait"], autres: ["forfait", "trajet", "jour"] };
const EQUIP_CATS = ["equip_loue", "equip_possede"];

const ui = {
  qid: null, step: 0, view: "client", ver: null, flash: null, itemDraft: null, clientDraft: null, backup: null, invoice: null, wsNew: "", wsCopy: false, csv: null,
  f: { q: "", status: "", cat: "", pack: "", cl: "" },
  tmp: { addPrest: "", line: { itemId: "", qty: 1, option: false }, equip: { itemId: "", days: null, basis: "jour", trips: 1, bill: "inclus", markupPct: null },
    scaf: { itemId: "", longueur: null, hauteur: null, jours: null, basis: "jour", trips: 1, bill: "inclus", markupPct: null },
    accept: { by: "", note: "", option: false }, reason: "",
    free: { tab: "produits", metier: "", label: "", unit: "", qty: null, price: null, save: true, ask: null, ok: false } },
};

// ---------- Utilitaires de formulaire ----------
const attr = (o) => `${o.dis ? "disabled" : ""} ${o.id ? `id="${o.id}"` : ""}`;
const I = (r, p, v, o = {}) => `<input data-r="${r}" data-p="${p}" ${o.n ? `data-n="${o.n}"` : ""} ${o.list ? `data-list="${o.list}"` : ""} type="${o.type || "text"}" ${o.type === "number" ? 'inputmode="decimal" step="any"' : ""} value="${esc(v ?? "")}" placeholder="${esc(o.ph || "")}" ${attr(o)}>`;
const Sel = (r, p, v, opts, o = {}) => `<select data-r="${r}" data-p="${p}" ${attr(o)}>${opts.map(([val, lab]) => `<option value="${esc(val)}" ${String(v ?? "") === String(val) ? "selected" : ""}>${esc(lab)}</option>`).join("")}</select>`;
const Chk = (r, p, v, label, o = {}) => `<label class="chkl"><input type="checkbox" data-r="${r}" data-p="${p}" ${v ? "checked" : ""} ${attr(o)}> ${label}</label>`;
const Txt = (r, p, v, o = {}) => `<textarea data-r="${r}" data-p="${p}" ${o.list ? `data-list="${o.list}"` : ""} rows="${o.rows || 3}" ${attr(o)}>${esc(v ?? "")}</textarea>`;
const L = (t) => `<label>${t}</label>`;
const badge = (state, text) => `<span class="badge b-${state}">${esc(text)}</span>`;
const stBadge = (s) => `<span class="st st-${s}">${esc(S.STATUS[s])}</span>`;
const num = (v, z) => (v === "" || v === null || v === undefined ? (z ? 0 : null) : Number(String(v).replace(",", ".")));
const pctList = (s) => String(s).split("/").map((x) => x.trim()).filter((x) => x !== "").map((x) => Number(x.replace(",", ".")));
const roots = () => ({ q: S.getQuote(ui.qid), db: S.state.db, it: ui.itemDraft, cl: ui.clientDraft, tmp: ui.tmp, ui });
function setPath(o, path, v) { const k = path.split("."); for (let i = 0; i < k.length - 1; i++) { if (o[k[i]] === undefined || o[k[i]] === null) o[k[i]] = {}; o = o[k[i]]; } o[k[k.length - 1]] = v; }
const joinPct = (a) => (a || []).join(" / ").replace(/\./g, ",");

// ---------- Routage ----------
function route() {
  const h = (location.hash || "#/devis").replace(/^#\/?/, "").split("/");
  return { tab: h[0] || "devis", a: h[1], b: h[2] };
}
const go = (h) => { location.hash = h; };

// ---------- Vues : liste des devis ----------
function viewDevis() {
  const db = S.state.db, f = ui.f;
  const am = activeMetier();
  const list = db.quotes.filter((q) => {
    if (am && metierOf(q) && metierOf(q) !== am) return false;
    const txt = (q.ref + " " + q.current.client.name + " " + q.current.site.name).toLowerCase();
    return (!f.q || txt.includes(f.q.toLowerCase())) && (!f.status || S.effectiveStatus(q) === f.status);
  });
  const counts = Object.keys(S.STATUS).map((k) => [k, list.filter((q) => S.effectiveStatus(q) === k).length]).filter((x) => x[1]);
  const pf = db.settings.profil;
  if (!am) return `<section class="welcome"><p class="stepno">Question 1 sur 2</p><h2>Quel est ton métier ?</h2><p class="hint">Touche ton métier. Tu ne le fais qu'une fois.</p>${chooser("")}</section>
    ${db.quotes.length ? `<p class="hint">Tes ${db.quotes.length} devis déjà créés s'afficheront ensuite.</p>` : ""}`;
  if (pf !== "technicien" && pf !== "entreprise") return `<section class="welcome"><p class="stepno">Question 2 sur 2</p><h2>Tu travailles comment ?</h2>
    <button type="button" class="bigopt" data-act="setProfil" data-k="technicien"><b>Je suis technicien ou artisan</b><span>Devis rapide en 3 écrans. Moins de 10 minutes.</span></button>
    <button type="button" class="bigopt" data-act="setProfil" data-k="entreprise"><b>Je suis une entreprise, ou c'est un marché public</b><span>Devis complet en 5 écrans : paiement en tranches, frais, vérifications.</span></button>
    <p class="metierbar"><button type="button" class="linkbtn" data-act="clearMetier">← Changer de métier (${esc(metierLabel(am))})</button></p></section>`;
  const tech = pf === "technicien";
  return `<section class="welcome"><h2>Mes devis</h2>
      <button class="bigcta" data-act="newQuote">＋ Faire un devis</button>
      <p class="hint" style="text-align:center">${tech ? "3 écrans : le client → le travail et le matériel → le prix et l'envoi" : "5 écrans : client, travaux, produits, prix et paiement, vérification"}</p>
      <p class="metierbar">${esc(metierLabel(am))} · ${tech ? "Technicien" : "Entreprise"} <button type="button" class="linkbtn" data-act="clearMetier">Changer</button></p>
      ${am === "peinture" ? `<p class="metierbar"><button type="button" class="linkbtn" data-act="demoQuote">Voir un exemple de devis rempli</button></p>` : ""}</section>
    <div class="card"><div class="row"><div>${L("Rechercher un devis")}${I("ui", "f.q", f.q, { ph: "Rechercher" })}</div>
    <div>${L("Statut")}${Sel("ui", "f.status", f.status, [["", "Tous"], ...Object.entries(S.STATUS)])}</div></div>
    ${counts.length ? `<div class="chips">${counts.map(([k, n]) => `<span class="st st-${k}">${S.STATUS[k]} ${n}</span>`).join("")}</div>` : ""}</div>
    <p class="hint">Tes devis restent dans ce téléphone. Pense à faire une sauvegarde (Réglages).</p>
    ${list.length ? list.map(quoteCard).join("") : `<div class="empty"><b>Aucun devis.</b><br>Touche « Nouveau devis » pour commencer.</div>`}`;
}
function quoteCard(q) {
  const last = S.lastVersion(q); const ev = S.editable(q) || !last ? S.evaluate(q) : null;
  const total = last && !S.editable(q) ? last.result.totals.base : ev.result.totals.base;
  const st = S.effectiveStatus(q);
  return `<a class="qcard" href="#/devis/${q.id}/${S.editable(q) ? 0 : lastOf(q)}"><div class="qtop"><b>${esc(q.ref)}${last ? ` · V${last.n}` : ""}</b>${stBadge(st)}</div>
    <div class="note">${esc(q.current.client.name) || "Client non renseigné"} — ${esc(q.current.site.name) || "Chantier non renseigné"}</div>
    <div class="qbot"><b>${fmt(total)}</b>${ev ? badge(ev.checks.status, STATE_LABEL[ev.checks.status]) : ""}</div></a>`;
}

// ---------- Vue : éditeur de devis ----------
function viewQuote() {
  const q = S.getQuote(ui.qid); if (!q) return `<div class="empty">Devis introuvable. <a href="#/devis">Retour à la liste</a></div>`;
  const dis = !S.editable(q); const ev = S.evaluate(q); const st = S.effectiveStatus(q);
  const STEPS = stepsOf(q), LAST = lastOf(q), simple = modeOf(q) === "technicien";
  const onSuivi = ui.step > LAST, n = ui.step + 1;
  const miss = missingPrices(ev);
  const prog = onSuivi ? `<a class="back" href="#/devis/${q.id}/${LAST}">${ic("back", 18)} Retour au devis</a>`
    : `<div class="prog noprint"><div class="segs">${STEPS.map((t, i) => `<a class="${ui.step === i ? "on" : i < ui.step ? "done" : ""}" href="#/devis/${q.id}/${i}" aria-label="${esc(t)}"><i></i></a>`).join("")}</div>
       <div class="progtop"><span>Étape ${n} sur ${STEPS.length}</span><span class="ref">${esc(q.ref)} · ${esc(S.STATUS[st])}</span></div></div>`;
  const head = "";
  const frozen = dis ? `<div class="banner info">Ce devis est « ${S.STATUS[q.status]} » : les versions envoyées sont figées. ${["envoye", "refuse", "expire"].includes(q.status) ? "Prépare une nouvelle version pour modifier." : ""}</div>` : "";
  const steps = simple ? [stepClientS, stepTravauxS, stepEnvoiS, stepVersions] : [stepClient, stepPrest, stepBesoins, stepPrix, stepVerifier, stepVersions];
  const bar = onSuivi ? "" : `<div class="actbar noprint"><div class="acts">${ui.step > 0 ? `<button class="sec sq" data-act="prev" aria-label="Précédent">${ic("back", 24)}</button>` : ""}${ui.step < LAST ? `<button class="go" data-act="next"><span>Continuer</span><span class="amt">${miss ? `${miss} prix manquant${miss > 1 ? "s" : ""}` : fmt(ev.result.totals.base)}</span></button>` : `<button class="go" data-act="toApercu"><span>Aperçu, PDF et envoi</span>${ic("next", 22)}</button>`}</div></div>`;
  return `<a class="back" href="#/devis">${ic("back", 18)} Tous les devis</a>${head}${prog}${frozen}${steps[ui.step](q, ev, dis)}${bar}`;
}

const missingPrices = (ev) => ev.result.lines.filter((l) => !l.option && l.flags.includes("prix_inconnu")).length;

function stepClient(q, ev, dis) {
  const c = S.state.db.clients, cur = q.current;
  return `<h2>Client et chantier</h2><div class="card">
    ${L("Client enregistré")}<select data-on="pickClient" ${dis ? "disabled" : ""}><option value="">— Saisie libre —</option>${c.map((x) => `<option value="${x.id}" ${cur.client.id === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>
    ${L("Nom du client")}${I("q", "current.client.name", cur.client.name, { dis })}
    <div class="row"><div>${L("Type de client")}${Sel("q", "current.client.type", cur.client.type, ["Particulier", "Entreprise", "Syndic / gestionnaire", "Administration", "Sous-traitant / donneur d'ordre"].map((x) => [x, x]), { dis })}</div>
    <div>${L("Contact")}${I("q", "current.client.contact", cur.client.contact, { dis })}</div></div>
    ${cur.client.type === "Administration" ? `<p class="hint">Administration : les pièces exigées par le marché (cadre de prix, références de consultation) ne sont pas générées par l'application. Joins-les au dossier.</p>` : ""}
    <div class="row"><div>${L("Date du devis")}${I("q", "current.date", cur.date, { type: "date", dis })}</div><div>${L("Validité (jours)")}${I("q", "current.validityDays", cur.validityDays, { type: "number", n: "n", dis })}</div></div></div>
    <div class="card"><b>Chantier</b>
    ${L("Nom du chantier")}${I("q", "current.site.name", cur.site.name, { ph: "Immeuble R+5", dis })}
    ${L("Adresse / quartier")}${I("q", "current.site.address", cur.site.address, { dis })}
    <div class="row"><div>${L("Surface des murs (m²)")}${I("q", "current.site.surfaceBrute", cur.site.surfaceBrute, { type: "number", n: "n", dis })}</div><div>${L("Portes et fenêtres à enlever (m²)")}${I("q", "current.site.ouvertures", cur.site.ouvertures, { type: "number", n: "n", dis })}</div></div>
    ${L("ou surface déjà calculée (m²)")}${I("q", "current.site.surface", cur.site.surface, { type: "number", n: "n", dis })}
    <p class="hint"><b>Surface retenue pour le calcul : ${effSurface(cur.site) === null ? "non renseignée" : fmtD(effSurface(cur.site)) + " m² (" + surfaceSource(cur.site) + ")"}.</b> Si la surface brute est saisie, elle prime : surface nette = brute − ouvertures (portes, fenêtres).</p>
    <div class="row"><div>${L("Hauteur de travail maximale (m)")}${I("q", "current.site.workHeightM", cur.site.workHeightM, { type: "number", n: "n", dis })}</div><div>${L("Nombre de niveaux")}${I("q", "current.site.levels", cur.site.levels, { type: "number", n: "n", dis })}</div></div>
    ${L("Produit en plus pour les pertes (%)")}${I("q", "current.site.lossPct", cur.site.lossPct, { type: "number", n: "n", dis })}
    <p class="hint">La marge de sécurité couvre pertes, reprises et irrégularités. Elle s'applique aux fournitures, jamais à la main-d'œuvre. Utilise la valeur observée sur tes chantiers. Seuil d'accès de l'entreprise : ${S.state.db.settings.accessThresholdM === null ? "non défini (Réglages)" : S.state.db.settings.accessThresholdM + " m"}.</p>
    <details><summary>Informations facultatives sur le chantier</summary>
    <div class="row"><div>${L("Type de bâtiment")}${I("q", "current.site.buildingType", cur.site.buildingType, { ph: "Villa, immeuble, entrepôt…", dis })}</div><div>${L("Occupation des lieux")}${Sel("q", "current.site.occupied", cur.site.occupied, [["", "—"], ["Occupé", "Occupé"], ["Vide", "Vide"]], { dis })}</div></div>
    <div class="row"><div>${L("État du support")}${I("q", "current.site.support", cur.site.support, { ph: "Brut, fissuré, ancien enduit…", dis })}</div><div>${L("Niveau de finition")}${I("q", "current.site.finish", cur.site.finish, { dis })}</div></div>
    <div class="row"><div>${L("Eau sur place")}${Sel("q", "current.site.water", cur.site.water, [["", "—"], ["Disponible", "Disponible"], ["Non disponible", "Non disponible"]], { dis })}</div><div>${L("Électricité sur place")}${Sel("q", "current.site.power", cur.site.power, [["", "—"], ["Disponible", "Disponible"], ["Non disponible", "Non disponible"]], { dis })}</div></div>
    <div class="row"><div>${L("Accès pour les véhicules")}${I("q", "current.site.vehicleAccess", cur.site.vehicleAccess, { dis })}</div><div>${L("Distance de transport (km)")}${I("q", "current.site.transportKm", cur.site.transportKm, { type: "number", n: "n", dis })}</div></div>
    <div class="row"><div>${L("Durée prévue (jours)")}${I("q", "current.site.durationDays", cur.site.durationDays, { type: "number", n: "n", dis })}</div><div>${L("Date souhaitée de démarrage")}${I("q", "current.site.wishedDate", cur.site.wishedDate, { type: "date", dis })}</div></div>
    <p class="hint">Aucun de ces champs n'est obligatoire. Ils servent de mémoire du chantier et sont conservés dans chaque version figée.</p></details>
    ${L("Observations (contraintes, accès, remarques)")}${Txt("q", "current.site.notes", cur.site.notes, { dis })}</div>`;
}

// ---------- Parcours Technicien : 3 écrans, mots simples ----------
function stepClientS(q, ev, dis) {
  const c = S.state.db.clients, cur = q.current;
  return `<h2>Pour qui est le devis ?</h2><div class="card">
    ${c.length ? `${L("Client déjà enregistré (facultatif)")}<select data-on="pickClient" ${dis ? "disabled" : ""}><option value="">— Nouveau client —</option>${c.map((x) => `<option value="${x.id}" ${cur.client.id === x.id ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select>` : ""}
    ${L("Nom du client")}${I("q", "current.client.name", cur.client.name, { ph: "Ex. : M. Mballa", dis })}
    ${L("Téléphone du client")}${I("q", "current.client.contact", cur.client.contact, { ph: "6 xx xx xx xx", dis })}</div>
    <div class="card"><b>Où est le chantier ?</b>
    ${L("Quartier ou adresse")}${I("q", "current.site.address", cur.site.address, { ph: "Ex. : Bonamoussadi, près du carrefour", dis })}
    ${L("Surface à traiter (m²)")}${I("q", "current.site.surface", cur.site.surface, { type: "number", n: "n", ph: "Ex. : 120", dis })}
    <p class="hint">${effSurface(cur.site) === null ? "Pas de surface ? Laisse vide si ton travail ne se mesure pas en m²." : `Surface retenue : <b>${fmtD(effSurface(cur.site))} m²</b> (${esc(surfaceSource(cur.site))})`}</p>
    <details><summary>Je veux calculer la surface (murs moins portes et fenêtres)</summary>
      <div class="row"><div>${L("Surface des murs (m²)")}${I("q", "current.site.surfaceBrute", cur.site.surfaceBrute, { type: "number", n: "n", dis })}</div><div>${L("Portes et fenêtres (m²)")}${I("q", "current.site.ouvertures", cur.site.ouvertures, { type: "number", n: "n", dis })}</div></div>
      <p class="hint">Si tu remplis « surface des murs », l'application enlève elle-même les portes et fenêtres.</p></details>
    ${L("Description courte du chantier (facultatif)")}${I("q", "current.site.name", cur.site.name, { ph: "Ex. : Peinture d'un appartement", dis })}</div>`;
}
function stepTravauxS(q, ev, dis) {
  return `<h2>Quel travail ?</h2>${stepPrest(q, ev, dis, true)}${stepBesoins(q, ev, dis, true)}`;
}
function stepEnvoiS(q, ev, dis) {
  const cur = q.current, r = ev.result, miss = missingPrices(ev);
  return `<h2>Le prix</h2>
    <div class="total"><div><span>Total du devis</span><span class="big">${fmt(r.totals.base)}</span></div>${miss ? `<div class="opt"><span>Total pas fini : ${miss} prix manquant${miss > 1 ? "s" : ""}</span></div>` : ""}${r.totals.vatBase !== null ? `<div><span>Avec TVA</span><span>${fmt(r.totals.ttcBase)}</span></div>` : ""}</div>
    ${miss ? `<div class="banner warn">Il manque ${miss} prix. <a href="#/devis/${q.id}/1">Retourne au travail et au matériel</a> pour les remplir.</div>` : ""}
    <div class="card"><b>Conditions</b>
    <div class="row"><div>${L("TVA (%) — laisse vide si pas de TVA")}${I("q", "current.terms.vatPct", cur.terms.vatPct, { type: "number", n: "n", dis })}</div><div>${L("Le devis reste valable (jours)")}${I("q", "current.validityDays", cur.validityDays, { type: "number", n: "n", dis })}</div></div>
    <div class="row"><div>${L("Remise en % (facultatif)")}${I("q", "current.discount.pct", cur.discount.pct, { type: "number", n: "n", dis })}</div><div>${L("ou remise en FCFA")}${I("q", "current.discount.amount", cur.discount.amount, { type: "number", n: "n", dis })}</div></div>
    ${L("Message pour le client (facultatif)")}${Txt("q", "current.notes", cur.notes, { dis })}
    <p class="hint">Le paiement en tranches et les autres conditions viennent de tes Réglages.</p></div>
    ${stepVerifier(q, ev, dis)}`;
}

function skipped(q) {
  return Object.entries(q.current.adjust || {}).filter(([, a]) => a.skip).map(([id]) => {
    let label = id;
    for (const inst of q.current.prestations) { const pres = PACKS[inst.packId]?.prestations.find((x) => x.id === inst.prestId); const b = pres?.build(inst.params || {}, {}).find((x) => `${inst.id}.${x.key}` === id); if (b) label = b.label || (S.state.db.catalogue.find((i) => i.id === b.itemId) || {}).label || id; }
    const m = q.current.manual.find((x) => x.id === id); if (m) label = (S.state.db.catalogue.find((i) => i.id === m.itemId) || {}).label || id;
    return [id, label];
  });
}

function lineCard(l, q, dis) {
  const adj = q.current.adjust[l.id] || {}; const man = q.current.manual.find((m) => m.id === l.id);
  const mf = (f, label, val, o = {}) => `<div>${L(label)}<input data-on="mf" data-id="${esc(l.id)}" data-f="${f}" type="number" inputmode="decimal" step="any" value="${esc(val ?? "")}" ${dis ? "disabled" : ""}></div>`;
  return `<div class="lcard ${l.flags.length ? "warn" : ""}"><div class="lt"><b>${esc(l.label)}</b>${l.option ? '<span class="tag">option</span>' : ""}${l.overridden ? '<span class="tag t2">corrigé</span>' : ""}</div>
    ${l.role ? `<div class="note">${esc(l.role)}</div>` : ""}<div class="lcalc">${esc(l.calc)}</div>
    <div class="lnums"><span>${l.qty === null ? "quantité inconnue" : fmtN(l.qty) + " " + esc(l.unit)}</span><span>× ${l.mode === "equip" ? (l.total === 0 ? "non facturé" : "forfait") : l.price === null ? "prix inconnu" : fmtN(l.price)}</span><b>${l.total === null ? "—" : fmt(l.total)}</b></div>
    ${!dis && l.flags.includes("prix_inconnu") && l.mode !== "equip" ? (q.current.pricing.method === "cout_plus_marge"
      ? `<div class="miss">${ic("warn", 18)} <b>Il manque le prix d'achat de ${esc(l.label)}.</b>${L("Prix d'achat par " + esc(l.unit) + " (FCFA)")}<input data-on="adj" data-id="${esc(l.id)}" data-f="cost" type="number" inputmode="decimal" step="any" value="${esc(adj.costOverride ?? "")}"></div>`
      : `<div class="miss">${ic("warn", 18)} <b>Il manque le prix de ${esc(l.label)}.</b>${L("Prix par " + esc(l.unit) + " (FCFA)")}<input data-on="adj" data-id="${esc(l.id)}" data-f="price" type="number" inputmode="decimal" step="any" value="${esc(adj.priceOverride ?? "")}"></div>`) : ""}
    ${l.flags.includes("qte_inconnue") ? `<div class="miss">${ic("warn", 18)} <b>Il manque la quantité.</b> ${man && man.mode !== "equip" ? `<input data-on="mf" data-id="${esc(l.id)}" data-f="qty" type="number" inputmode="decimal" step="any" value="">` : man ? "Renseigne la durée ci-dessous." : "Renseigne les champs du bloc Travaux."}</div>` : ""}
    ${man && man.mode === "equip" ? `<div class="row3">${mf("days", "Durée (jours)", man.days)}${mf("trips", "Trajets", man.trips)}${mf("areaQty", "Surface (m²)", man.areaQty)}</div>
      <div class="row"><div>${L("Tarif retenu")}<select data-on="mf" data-id="${esc(l.id)}" data-f="basis" ${dis ? "disabled" : ""}>${[["jour", "Journalier"], ["semaine", "Hebdomadaire"], ["mois", "Mensuel"]].map(([v, t]) => `<option value="${v}" ${man.basis === v ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div>${L("Facturation au client")}<select data-on="mf" data-id="${esc(l.id)}" data-f="bill" ${dis ? "disabled" : ""}><option value="inclus" ${man.bill !== "refacture" ? "selected" : ""}>Non facturé séparément (absorbé)</option><option value="refacture" ${man.bill === "refacture" ? "selected" : ""}>Refacturé avec majoration</option></select></div></div>
      ${man.bill === "refacture" ? `<div>${L("Majoration sur coût (%) — 0 = au prix coûtant")}<input data-on="mf" data-id="${esc(l.id)}" data-f="markupPct" type="number" inputmode="decimal" step="any" value="${esc(man.markupPct ?? "")}" ${dis ? "disabled" : ""}></div>` : ""}` : ""}
    ${dis ? "" : `<details><summary>Corriger cette ligne</summary>
      <div class="row"><div>${L(`Quantité retenue (calculée : ${l.qtyCalc === null ? "—" : fmtN(l.qtyCalc)})`)}<input data-on="adj" data-id="${esc(l.id)}" data-f="qty" type="number" inputmode="decimal" step="any" value="${esc(adj.override?.qty ?? "")}"></div>
      <div>${L("Motif de la correction (obligatoire)")}<input data-on="adj" data-id="${esc(l.id)}" data-f="reason" value="${esc(adj.override?.reason ?? "")}"></div></div>
      ${l.mode === "equip" ? "" : `${L("Prix unitaire pour ce devis (remplace le catalogue)")}<input data-on="adj" data-id="${esc(l.id)}" data-f="price" type="number" inputmode="decimal" step="any" value="${esc(adj.priceOverride ?? "")}">`}
      <label class="chkl"><input type="checkbox" data-on="adj" data-id="${esc(l.id)}" data-f="option" ${l.option ? "checked" : ""}> Option (hors offre de base)</label>
      <button class="sec" data-act="skipLine" data-id="${esc(l.id)}">Retirer cette ligne</button>${man ? ` <button class="sec" data-act="delManual" data-id="${esc(l.id)}">Supprimer</button>` : ""}</details>`}</div>`;
}

function stepPrest(q, ev, dis, simple) {
  const cur = q.current;
  const mt = metierOf(q);
  const opts = [["", "— Choisir un travail —"]];
  if (mt && PACKS[mt]) PACKS[mt].prestations.forEach((x) => opts.push([`${mt}|${x.id}`, x.label]));
  const blocks = cur.prestations.map((inst, i) => {
    const pack = PACKS[inst.packId], pres = pack.prestations.find((x) => x.id === inst.prestId);
    const lines = ev.result.lines.filter((l) => l.id.startsWith(inst.id + "."));
    return `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(pack.label)} — ${esc(pres.label)}</b>${dis ? "" : `<button class="del" data-act="delPrest" data-i="${i}">✕</button>`}</div>
      <div class="params">${pres.params.map((p) => `<div>${L(p.label)}${p.type === "select" ? Sel("q", `current.prestations.${i}.params.${p.key}`, inst.params[p.key], p.options, { dis }) : I("q", `current.prestations.${i}.params.${p.key}`, inst.params[p.key], { type: "number", n: "n", dis })}</div>`).join("")}</div>
      ${pres.params.some((p) => p.type === "number" && p.def === null) ? `<p class="hint">Les champs vides sont à renseigner : aucune valeur n'est supposée.</p>` : ""}
      <h3>Ce que l'application a compté</h3>${lines.map((l) => lineCard(l, q, dis)).join("") || `<p class="hint">Aucune ligne.</p>`}</div>`;
  }).join("");
  const sk = skipped(q);
  return `${simple ? "" : "<h2>Travaux à faire</h2>"}<p class="hint">${simple ? "Choisis le travail, réponds aux questions : les quantités de produit se calculent toutes seules." : "Les quantités se calculent seules à partir de la surface. Si tu corriges une quantité, l'application garde le calcul d'origine et te demande pourquoi."}</p>
    ${blocks || `<div class="empty">Aucun travail pour l'instant. Choisis-en un ci-dessous.</div>`}
    ${sk.length && !dis ? `<div class="card"><b>Lignes retirées</b>${sk.map(([id, lab]) => `<div class="chk"><div style="flex:1">${esc(lab)}</div><button class="sec" data-act="restoreLine" data-id="${esc(id)}">Rétablir</button></div>`).join("")}</div>` : ""}
    ${dis ? "" : !mt ? `<div class="card"><b>Quel est ton métier ?</b>${chooser("")}</div>` : `<div class="card"><b>Ajouter un travail (${esc(metierLabel(mt))})</b>${L("Choisis dans la liste")}${Sel("tmp", "addPrest", ui.tmp.addPrest, opts)}<button class="gold" data-act="addPrest" style="margin-top:10px">Ajouter</button>
      <p class="hint">Les prix manquants te seront demandés juste après, pour chaque produit.</p></div>`}`;
}

const tabOf = (l) => TAB_OF[l.cat] || "autres";
function freeSection(q, ev, dis) {
  const t = ui.tmp.free, db = S.state.db, lines = ev.result.lines;
  const cm = q.current.pricing.method === "cout_plus_marge";
  const sub = (tab) => { const ls = lines.filter((l) => tabOf(l) === tab && !l.option); const miss = ls.filter((l) => l.total === null).length; return { n: ls.length, sum: ls.reduce((a, l) => a + (l.total ?? 0), 0), miss }; };
  const tabs = `<div class="seg tabs4">${TABS.map(([k, n]) => { const c = sub(k); return `<button class="${t.tab === k ? "on" : ""}" data-act="freeTab" data-k="${k}">${ic(k, 22)}<span>${n}${c.n ? ` (${c.n})` : ""}</span></button>`; }).join("")}</div>`;
  const cur = sub(t.tab), shown = lines.filter((l) => tabOf(l) === t.tab);
  const match = db.catalogue.find((i) => !i.archived && nz(i.label) === nz(t.label));
  const field = cm ? "cost" : "price", prev = match ? match[field] : null;
  const units = FREE_UNITS[t.tab].map((u) => `<button type="button" class="chip ${nz(t.unit) === nz(u) ? "on" : ""}" data-act="freeUnit" data-u="${esc(u)}">${esc(u)}</button>`).join("");
  const met = metierOf(q);
  const saved = db.catalogue.filter((i) => !i.archived && TAB_OF[i.cat] === t.tab && (i.pack === met || String(i.id).startsWith("TER-"))).map((i) => i.label);
  const names = [...new Set([...saved, ...(LISTES[met]?.[t.tab] || [])])];
  const picker = `${met ? "" : chooser("")}
    ${names.length ? `<div class="chips names">${names.map((n) => `<button type="button" class="chip nm ${nz(t.label) === nz(n) ? "on" : ""}" data-act="pickName" data-n="${esc(n)}">${esc(n)}</button>`).join("")}</div><p class="hint">Touche un nom, ou écris-le plus bas. Ce sont des noms seulement : aucun prix ni quantité.</p>` : `<p class="hint">Choisis ton métier pour voir la liste, ou écris le nom plus bas.</p>`}`;
  const form = dis ? "" : `<div class="card"><b>+ Ajouter</b>
    ${L("Choisir dans la liste")}${picker}
    ${L("Nom (ex. : ciment, carreaux, maçon)")}<input data-r="tmp" data-p="free.label" list="dl-items" value="${esc(t.label)}" autocomplete="off"><datalist id="dl-items">${db.catalogue.filter((i) => !i.archived).map((i) => `<option value="${esc(i.label)}">`).join("")}</datalist>
    ${match ? `<p class="hint">Déjà enregistré : ${esc(match.label)} (${esc(match.unit)})${prev !== null && prev !== undefined ? ` — dernier ${cm ? "prix d'achat" : "prix"} : ${fmt(prev)}${match.priceDate ? " le " + frDate(match.priceDate) : ""}${match.fieldPrice ? ", saisi sur place, à confirmer" : ""}` : " — pas de prix"}.</p>` : ""}
    ${L("Unité")}<div class="chips">${units}</div>${I("tmp", "free.unit", match ? match.unit : t.unit, { ph: "ou écris l'unité" })}
    <div class="row"><div>${L("Quantité")}${I("tmp", "free.qty", t.qty, { type: "number", n: "n" })}</div><div>${L(cm ? "Prix d'achat par unité (FCFA)" : "Prix par unité (FCFA)")}${I("tmp", "free.price", t.price, { type: "number", n: "n" })}</div></div>
    <p class="hint">${t.price > 0 ? "Tu écris : <b>" + fmt(t.price) + "</b> par unité. " : ""}Prix pas connu ? Laisse vide : tu le mettras plus tard. Rien n'est compté à zéro.</p>
    ${Chk("tmp", "free.save", t.save, "Garder ce produit et ce prix pour la prochaine fois")}
    ${t.ask ? `<div class="banner warn"><b>Dernier prix enregistré : ${fmt(t.ask.prev)}. Tu écris ${fmt(t.price)}.</b><div class="row"><button data-act="askYes">Oui, c'est bon</button><button class="sec" data-act="askNo">Non, je corrige</button></div></div>` : `<button class="gold" data-act="addFree" style="margin-top:10px">Ajouter à ${esc(TABS.find((x) => x[0] === t.tab)[1])}</button>`}</div>`;
  const miss = cur.miss ? `Total pas fini : ${cur.miss} prix manquant${cur.miss > 1 ? "s" : ""}` : "";
  return `${tabs}${form}
    <div class="total"><div><span>${esc(TABS.find((x) => x[0] === t.tab)[1])}</span><span class="big">${fmt(cur.sum)}</span></div>${miss ? `<div class="opt"><span>${miss}</span></div>` : ""}</div>
    ${shown.map((l) => lineCard(l, q, dis)).join("") || `<p class="hint">Rien ici pour l'instant.</p>`}`;
}

function stepBesoins(q, ev, dis, simple) {
  const cur = q.current, db = S.state.db, t = ui.tmp;
  const hasTag = (k) => ev.result.lines.some((l) => l.tags.includes(k) && (l.qty ?? 0) > 0 && !l.option);
  const dec = Object.entries(DECISION_TAGS).map(([k, lab]) => `<div class="chk"><div class="dot d-${hasTag(k) || cur.decisions[k] ? "ok" : "verifier"}">${hasTag(k) || cur.decisions[k] ? "✓" : "!"}</div>
    <div style="flex:1"><b>${lab}</b>${hasTag(k) ? `<div class="hint">Chiffré dans ce devis.</div>` : `<select data-on="decide" data-k="${k}" ${dis ? "disabled" : ""}>${DECISIONS.map(([v, tx]) => `<option value="${v}" ${(cur.decisions[k] || "") === v ? "selected" : ""}>${tx}</option>`).join("")}</select>`}</div></div>`).join("");
  const mt = metierOf(q), eq = db.catalogue.filter((i) => EQUIP_CATS.includes(i.cat) && !i.archived && visibleIn(mt, i)), ac = eq.filter((i) => (i.tags || []).includes("acces"));
  const others = db.catalogue.filter((i) => !EQUIP_CATS.includes(i.cat) && !i.archived && visibleIn(mt, i));
  const optItems = (arr) => `<option value="">— Choisir —</option>${arr.map((i) => `<option value="${esc(i.id)}">${esc(i.label)}</option>`).join("")}`;
  const man = cur.manual.map((m) => ev.result.lines.find((l) => l.id === m.id)).filter(Boolean);
  const eqForm = (key, items, title, extra = "") => `<div class="card"><b>${title}</b>${extra}
    ${L("Équipement")}<select data-r="tmp" data-p="${key}.itemId">${optItems(items).replace(`value="${esc(t[key].itemId)}"`, `value="${esc(t[key].itemId)}" selected`)}</select>
    ${key === "scaf" ? `<div class="row"><div>${L("Longueur de façade (m)")}${I("tmp", "scaf.longueur", t.scaf.longueur, { type: "number", n: "n" })}</div><div>${L("Hauteur (m)")}${I("tmp", "scaf.hauteur", t.scaf.hauteur, { type: "number", n: "n" })}</div></div>` : ""}
    <div class="row3"><div>${L("Durée (jours)")}${I("tmp", `${key}.${key === "scaf" ? "jours" : "days"}`, t[key][key === "scaf" ? "jours" : "days"], { type: "number", n: "n" })}</div>
    <div>${L("Tarif")}${Sel("tmp", `${key}.basis`, t[key].basis, [["jour", "Jour"], ["semaine", "Semaine"], ["mois", "Mois"]])}</div><div>${L("Trajets")}${I("tmp", `${key}.trips`, t[key].trips, { type: "number", n: "n" })}</div></div>
    <div class="row"><div>${L("Facturation")}${Sel("tmp", `${key}.bill`, t[key].bill, [["inclus", "Compris dans mon prix"], ["refacture", "Je le facture en plus"]])}</div>
    <div>${t[key].bill === "refacture" ? L("Majoration (%)") + I("tmp", `${key}.markupPct`, t[key].markupPct, { type: "number", n: "n" }) : ""}</div></div>
    <button class="gold" data-act="${key === "scaf" ? "addScaf" : "addEquip"}" style="margin-top:10px">Ajouter</button></div>`;
  return `<h2>${simple ? "Produits, outils et ouvriers" : "Produits et main-d'œuvre"}</h2>${freeSection(q, ev, dis)}
    ${simple ? `<details class="more"><summary>Échafaudage, outils loués, oublis fréquents</summary>` : ""}<h3>À ne pas oublier</h3><p class="hint">Ce que les devis oublient le plus : accès en hauteur, outillage, protections, transport, nettoyage. Chiffre chaque point ou indique pourquoi il n'y en a pas.</p>
    <div class="card">${dec}</div>
    ${dis ? "" : `${eqForm("scaf", ac, "Accès en hauteur / échafaudage", `<div class="banner info">L'application chiffre ce que tu décides. Le type d'échafaudage, la hauteur autorisée, les protections collectives et les vérifications dépendent du site, du matériel et de l'évaluation des risques par une personne compétente.</div>`)}
    ${eqForm("equip", eq, "Équipements et outillage", `<p class="hint">Un équipement <b>possédé</b> n'est jamais facturé en location : seul son coût interne d'utilisation est compté. Un équipement <b>loué</b> compte location, montage/démontage et transport, sans doublon si le fournisseur inclut déjà le montage.</p>`)}
    <div class="card"><b>Ajouter un produit déjà enregistré</b>${L("Article")}<select data-r="tmp" data-p="line.itemId">${optItems(others).replace(`value="${esc(t.line.itemId)}"`, `value="${esc(t.line.itemId)}" selected`)}</select>
      <div class="row"><div>${L("Quantité")}${I("tmp", "line.qty", t.line.qty, { type: "number", n: "n" })}</div><div>${Chk("tmp", "line.option", t.line.option, "Option")}</div></div>
      <button class="gold" data-act="addLine">Ajouter</button></div>`}
    ${simple ? "</details>" : ""}`;
}

function stepPrix(q, ev, dis) {
  const cur = q.current, r = ev.result, m = r.margin;
  return `<h2>Prix et conditions</h2>
    <div class="card"><b>Comment calculer le prix de vente</b>${L("Prix de vente")}${Sel("q", "current.pricing.method", cur.pricing.method, [["catalogue", "Prix de vente du catalogue"], ["cout_plus_marge", "Prix d'achat + ma marge"]], { dis })}
    ${cur.pricing.method === "cout_plus_marge" ? `${L("Majoration sur coût d'achat (%)")}${I("q", "current.pricing.markupPct", cur.pricing.markupPct, { type: "number", n: "n", dis })}<p class="hint">Chaque article doit avoir un coût d'achat dans le Catalogue, sinon son prix reste inconnu.</p>` : ""}</div>
    <div class="card"><b>Remise</b><div class="row"><div>${L("Remise (%)")}${I("q", "current.discount.pct", cur.discount.pct, { type: "number", n: "n", dis })}</div><div>${L("ou montant (FCFA)")}${I("q", "current.discount.amount", cur.discount.amount, { type: "number", n: "n", dis })}</div></div>
    <p class="hint">Si les deux sont remplis, le pourcentage prime. La remise s'applique sur le total HT, une seule fois, et alerte si la marge passe sous le minimum.</p></div>
    <div class="card"><b>Frais de fonctionnement (bureau, assurance, véhicule…)</b><div class="row"><div>${L("Taux (% du coût direct)")}${I("q", "current.overhead.pct", cur.overhead.pct, { type: "number", n: "z", dis })}</div>
    <div>${L("Traitement")}${Sel("q", "current.overhead.mode", cur.overhead.mode, [["inclus", "Déjà inclus dans mes prix"], ["ligne", "Ligne séparée facturée"]], { dis })}</div></div>
    <p class="hint">Jamais les deux : « inclus » compte les frais dans le coût de revient interne seulement ; « ligne séparée » les ajoute au devis. Le choix évite le double comptage.</p></div>
    <div class="card"><b>TVA, délais et paiement en tranches</b><div class="row"><div>${L("TVA (%) — vide = hors taxes")}${I("q", "current.terms.vatPct", cur.terms.vatPct, { type: "number", n: "n", dis })}</div><div>${L("Validité (jours)")}${I("q", "current.validityDays", cur.validityDays, { type: "number", n: "n", dis })}</div></div>
    <div class="row"><div>${L("Délai minimum (jours)")}${I("q", "current.terms.delayMin", cur.terms.delayMin, { type: "number", n: "n", dis })}</div><div>${L("Délai maximum (jours)")}${I("q", "current.terms.delayMax", cur.terms.delayMax, { type: "number", n: "n", dis })}</div></div>
    ${L("Paiement en tranches des produits (% séparés par « / », total 100)")}${I("q", "current.terms.payment.materials", joinPct(cur.terms.payment.materials), { list: "slash", dis })}
    ${L("Paiement en tranches de la main-d'œuvre (% séparés par « / », total 100)")}${I("q", "current.terms.payment.services", joinPct(cur.terms.payment.services), { list: "slash", dis })}
    ${L("À quel moment chaque tranche est payée (une par ligne, dans l'ordre)")}${Txt("q", "current.terms.triggers", (cur.terms.triggers || []).join("\n"), { list: "lines", dis })}
    ${L("Hypothèses et remarques pour le client (facultatif)")}${Txt("q", "current.notes", cur.notes, { dis })}</div>
    <div class="total"><div><span>Offre de base HT</span><span class="big">${fmt(r.totals.base)}</span></div>${r.lines.some((l) => l.option) ? `<div class="opt"><span>Avec option HT</span><span>${fmt(r.totals.withOption)}</span></div>` : ""}
    ${r.totals.vatBase !== null ? `<div><span>TTC (base)</span><span>${fmt(r.totals.ttcBase)}</span></div>` : ""}${r.totals.discountBase ? `<div><span>dont remise</span><span>− ${fmt(r.totals.discountBase)}</span></div>` : ""}</div>
    <div class="card"><b>Rentabilité (interne)</b>${m ? `<table><tr><td>Coût de revient</td><td class="n">${fmt(m.base.cost)}</td></tr><tr><td>Bénéfice</td><td class="n">${fmt(m.base.profit)}</td></tr><tr><td>Marge sur coût</td><td class="n">${m.base.markupPct?.toFixed(1)} %</td></tr><tr><td>Taux de marque</td><td class="n">${m.base.marginRatePct?.toFixed(1)} %</td></tr></table>` : `<p class="hint">Non calculable : il manque au moins un coût d'achat. Un coût inconnu n'est jamais compté comme zéro.</p>`}</div>`;
}

function stepControle(q, ev, dis) {
  const ck = ev.checks;
  const acts = [];
  if (q.status === "brouillon" || q.status === "pret") acts.push(`<button class="sec" data-act="mark" data-to="a_verifier">Marquer « À vérifier »</button>`);
  if (["brouillon", "a_verifier"].includes(q.status)) acts.push(`<button data-act="mark" data-to="pret" ${ck.status === "bloque" ? "disabled" : ""}>Marquer « Prêt à envoyer »</button>`);
  if (["a_verifier", "pret"].includes(q.status)) acts.push(`<button class="sec" data-act="mark" data-to="brouillon">Repasser en brouillon</button>`);
  return `<h2>Vérifier avant d'envoyer</h2><div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b>Résultat</b>${badge(ck.status, STATE_LABEL[ck.status])}</div>
    <p class="hint">Prêt : tout est en ordre. À vérifier : un point reste à confirmer. Il manque quelque chose : corrige-le avant d'envoyer.</p>
    ${ck.items.map((r) => `<div class="chk"><div class="dot d-${r.state}">${r.state === "ok" ? "✓" : r.state === "verifier" ? "!" : "✕"}</div><div><b>${esc(r.label)}</b>${r.hint ? `<div class="hint">${esc(r.hint)}</div>` : ""}</div></div>`).join("")}</div>
    ${r_warn(ev)}${dis ? "" : `<div class="row">${acts.join("")}</div>`}`;
}
function stepVerifier(q, ev, dis) {
  return `<div class="noprint">${stepControle(q, ev, dis)}</div>${stepApercu(q, ev, dis)}<div class="noprint"><a class="btn sec" href="#/devis/${q.id}/${lastOf(q) + 1}" style="margin-top:14px;width:100%">Suivi du devis : statut, versions, décision du client</a></div>`;
}
const r_warn = (ev) => (ev.result.warnings.length ? `<div class="card"><b>Alertes de calcul</b>${ev.result.warnings.map((w) => `<div class="hint">• ${esc(w)}</div>`).join("")}</div>` : "");

function snapFor(q, ev) {
  const sel = ui.ver ?? (S.editable(q) || !S.lastVersion(q) ? "draft" : String(S.lastVersion(q).n));
  if (sel === "draft") return { snap: { quote: q.current, result: ev.result, company: S.state.db.company, conditions: S.state.db.settings.conditions, presentation: S.state.db.settings.presentation, n: null, at: null, hash: null }, draft: true, sel };
  const v = q.versions.find((x) => String(x.n) === sel) || S.lastVersion(q);
  if (!v) return { snap: { quote: q.current, result: ev.result, company: S.state.db.company, conditions: S.state.db.settings.conditions, presentation: S.state.db.settings.presentation }, draft: true, sel: "draft" };
  return { snap: v, draft: false, sel: String(v.n) };
}
function stepApercu(q, ev, dis) {
  const { snap, draft, sel } = snapFor(q, ev);
  const opts = [...(S.editable(q) || !q.versions.length ? [["draft", "Brouillon actuel"]] : []), ...q.versions.map((v) => [String(v.n), `V${v.n} — ${frDate(v.at)}`])];
  const seg = `<div class="seg noprint"><button class="${ui.view === "client" ? "on" : ""}" data-act="view" data-v="client">Version client</button><button class="${ui.view === "interne" ? "on" : ""}" data-act="view" data-v="interne">Interne (marge)</button></div>`;
  const canSend = ["pret", "negociation"].includes(q.status);
  const top = `<div class="noprint" id="apercu"><h2>Aperçu et envoi</h2>${seg}<div class="row">${L("Version affichée")}${Sel("ui", "ver", sel, opts)}</div></div>`;
  if (ui.view === "interne") return top + internal(snap, q);
  const wa = `https://wa.me/?text=${encodeURIComponent(summaryText(snap, q.ref))}`;
  const blocked = ev.checks.status === "bloque";
  return `${top}<div class="noprint">${draft ? `<div class="banner info">Aperçu d'un brouillon : il n'a ni empreinte ni valeur contractuelle tant qu'il n'est pas envoyé (figé).</div>` : `<div class="banner info">Version figée V${snap.n} — empreinte ${snap.hash}</div>`}
    <div class="row"><button data-act="print" ${draft && blocked ? "disabled" : ""}>Générer le PDF (Imprimer → Enregistrer en PDF)</button>
    <button class="gold" data-act="send" ${canSend && !blocked ? "" : "disabled"}>Envoyer : figer V${q.versions.length + 1}</button></div>
    ${canSend ? "" : draft ? `<p class="hint">Pour envoyer : marque d'abord le devis « Prêt à envoyer » (bloc Vérifier, plus haut).</p>` : ""}
    ${blocked && draft ? `<p class="hint">Corrige ce qui manque (bloc Vérifier, plus haut) pour générer le PDF.</p>` : ""}
    ${!draft ? `<div class="row"><a class="btn sec" href="${wa}" target="_blank" rel="noopener">Partager sur WhatsApp</a><button class="sec" data-act="copy" data-t="${esc(summaryText(snap, q.ref))}">Copier le message</button></div><p class="hint">WhatsApp reçoit le message de synthèse ; joins le PDF enregistré depuis l'impression.</p><div class="row"><button class="sec" data-act="word" data-n="${snap.n}">Télécharger Word (.docx, copie modifiable)</button></div>` : ""}</div>
    ${renderDoc(snap, { draft, ref: q.ref })}`;
}
function internal(snap, q) {
  const r = snap.result, m = r.margin;
  return `<div class="card"><b>Récapitulatif interne</b><p class="hint">Ne pas envoyer au client.</p>
    ${m ? `<table><tr><th>Offre de base</th><th class="n">Montant</th></tr><tr><td>Prix de vente HT</td><td class="n">${fmt(r.totals.base)}</td></tr><tr><td>Coût de revient (frais généraux inclus)</td><td class="n">${fmt(m.base.cost)}</td></tr><tr class="sub"><td>Bénéfice</td><td class="n">${fmt(m.base.profit)}</td></tr><tr><td>Marge sur coût</td><td class="n">${m.base.markupPct?.toFixed(1)} %</td></tr><tr><td>Taux de marque</td><td class="n">${m.base.marginRatePct?.toFixed(1)} %</td></tr></table>` : `<p class="hint">Marge non calculable : coûts d'achat incomplets.</p>`}</div>
    <div class="card"><b>Détail des calculs</b><div class="scroll"><table><tr><th>Ligne</th><th class="n">Calculé</th><th class="n">Retenu</th><th class="n">Coût</th><th class="n">Total</th></tr>${r.lines.map((l) => `<tr><td>${esc(l.label)}${l.option ? " <span class='note'>(option)</span>" : ""}<div class="note">${esc(l.calc)}${l.overridden ? ` — corrigé : ${esc(l.overrideReason)}` : ""}</div></td><td class="n">${fmtN(l.qtyCalc)}</td><td class="n">${fmtN(l.qty)}</td><td class="n">${fmtN(l.cost)}</td><td class="n">${fmtN(l.total)}</td></tr>`).join("")}</table></div></div>
    ${r.warnings.length ? `<div class="card"><b>Alertes</b>${r.warnings.map((w) => `<div class="hint">• ${esc(w)}</div>`).join("")}</div>` : ""}
    <div class="card"><b>Règles de calcul appliquées</b><ul class="note"><li>Quantité de produit : surface × (1 + marge de sécurité) ÷ rendement, arrondie à l'unité supérieure.</li><li>Montants de ligne : FCFA entiers, 0,5 arrondi vers le haut.</li><li>Remise, frais généraux, TVA : calculés une seule fois sur le total, 0,5 vers le haut.</li><li>Échéancier : chaque part arrondie, la dernière reçoit le reste : la somme est exacte.</li><li>Moteur ${esc(r.engineVersion)}.</li></ul></div>`;
}

function stepVersions(q, ev) {
  const last = S.lastVersion(q), st = S.effectiveStatus(q), t = ui.tmp;
  const vers = q.versions.map((v) => { const ok = S.verifyVersion(v).ok; return `<div class="chk"><div class="dot d-${ok ? "ok" : "bloque"}">${ok ? "✓" : "✕"}</div><div style="flex:1"><b>V${v.n}</b> — ${frDate(v.at)} — ${fmt(v.result.totals.base)} HT<div class="note">Empreinte ${v.hash} · ${ok ? "intégrité vérifiée par recalcul" : "INTÉGRITÉ NON VÉRIFIÉE"}</div></div><a class="btn sec" href="#/devis/${q.id}/${lastOf(q)}" data-act="seeVer" data-n="${v.n}">Voir</a></div>`; }).join("");
  const actions = [];
  if (["envoye", "refuse", "expire"].includes(q.status)) actions.push(`<button data-act="startNeg">Préparer V${q.versions.length + 1}${q.status === "expire" ? " (renouveler)" : ""}</button>`);
  if (q.status === "negociation") actions.push(`<button class="sec" data-act="discardNeg">Abandonner le brouillon de V${q.versions.length + 1}</button>`);
  actions.push(`<button class="sec" data-act="dup">Dupliquer ce devis</button>`);
  if (S.deletable(q)) actions.push(`<button class="sec" data-act="delQuote">Supprimer ce brouillon</button>`);
  const hasOpt = last && last.result.lines.some((l) => l.option);
  const decide = ["envoye", "negociation"].includes(q.status) ? `<div class="card"><b>Décision du client (sur V${last.n})</b>
    ${L("Nom de la personne qui accepte")}${I("tmp", "accept.by", t.accept.by)}${L("Preuve d'accord (référence du message, du bon signé…)")}${I("tmp", "accept.note", t.accept.note)}
    ${hasOpt ? Chk("tmp", "accept.option", t.accept.option, "Offre de base + option retenue") : ""}
    <div class="row"><button data-act="accept">Marquer accepté + créer la commande</button></div>
    ${L("Motif (refus ou annulation)")}${I("tmp", "reason", t.reason)}<div class="row"><button class="sec" data-act="reject">Marquer refusé</button><button class="sec" data-act="cancel">Annuler le devis</button></div></div>`
    : ["brouillon", "a_verifier", "pret"].includes(q.status) ? `<div class="card">${L("Motif d'annulation")}${I("tmp", "reason", t.reason)}<button class="sec" data-act="cancel" style="margin-top:8px">Annuler le devis</button></div>` : "";
  return `<h2>Suivi du devis</h2><div class="card"><div style="display:flex;justify-content:space-between"><b>Statut</b>${stBadge(st)}</div>
    ${last ? `<p class="hint">Validité jusqu'au ${frDate(S.expiryDate(q))}.</p>` : ""}
    ${q.acceptance ? `<p class="hint">Accepté (V${q.acceptance.version}) le ${frDate(q.acceptance.date)}${q.acceptance.by ? " par " + esc(q.acceptance.by) : ""}. Preuve : ${esc(q.acceptance.note) || "—"}. <a href="#/suivi">Voir la commande</a></p>` : ""}
    <div class="row">${actions.join("")}</div></div>${decide}
    <h3>Versions envoyées</h3><div class="card">${vers || `<p class="hint">Aucune version envoyée.</p>`}</div>
    <h3>Historique des statuts</h3><div class="card">${q.statusLog.slice().reverse().map((l) => `<div class="chk"><div style="flex:1"><b>${S.STATUS[l.to]}</b><div class="note">${esc(l.reason)}</div></div><span class="note">${frDate(l.at)}</span></div>`).join("")}</div>`;
}

// ---------- Clients ----------
function viewClients(a) {
  const db = S.state.db;
  if (a) {
    if (!ui.clientDraft || (ui.clientDraft.id || "new") !== a) ui.clientDraft = a === "new" ? { id: "", name: "", type: "Particulier", contact: "", address: "", notes: "" } : S.clone(db.clients.find((c) => c.id === a));
    const c = ui.clientDraft; const qs = c.id ? S.quotesOfClient(c.id) : [];
    return `<a class="back" href="#/clients">‹ Clients</a><h2>${c.id ? esc(c.name) : "Nouveau client"}</h2><div class="card">
      ${L("Nom")}${I("cl", "name", c.name)}${L("Type")}${Sel("cl", "type", c.type, ["Particulier", "Entreprise", "Syndic / gestionnaire", "Administration", "Sous-traitant / donneur d'ordre"].map((x) => [x, x]))}
      ${L("Contact (téléphone, e-mail)")}${I("cl", "contact", c.contact)}${L("Adresse")}${I("cl", "address", c.address)}${L("Notes")}${Txt("cl", "notes", c.notes)}
      <div class="row" style="margin-top:10px"><button data-act="saveClient">Enregistrer</button>${c.id ? `<button class="gold" data-act="quoteFor" data-id="${c.id}">Nouveau devis pour ce client</button>` : ""}</div></div>
      ${c.id ? `<h3>Historique (${qs.length})</h3>${qs.map(quoteCard).join("") || `<div class="empty">Aucun devis pour ce client.</div>`}` : ""}`;
  }
  const f = ui.f.cl.toLowerCase(); const list = db.clients.filter((c) => !f || (c.name + c.contact).toLowerCase().includes(f));
  return `<h2>Clients</h2><div class="row"><a class="btn" href="#/clients/new">+ Nouveau client</a><div>${I("ui", "f.cl", ui.f.cl, { ph: "Rechercher" })}</div></div>
    ${list.map((c) => `<a class="qcard" href="#/clients/${c.id}"><div class="qtop"><b>${esc(c.name)}</b><span class="note">${esc(c.type)}</span></div><div class="note">${esc(c.contact)}</div><div class="note">${S.quotesOfClient(c.id).length} devis</div></a>`).join("") || `<div class="empty">Aucun client enregistré.</div>`}`;
}

// ---------- Catalogue ----------
function blankItem() { return { id: S.newItemId("ART"), ref: "", label: "", cat: "materiaux", unit: "", pricing: "unitaire", price: null, cost: null, priceDate: null, supplier: "", brand: "", yield: null, yieldUnit: "m²", tags: [], pack: "", archived: false }; }
function viewCatalogue(a) {
  const db = S.state.db;
  if (a) {
    if (!ui.itemDraft || ui.itemKey !== a) { ui.itemKey = a; ui.itemDraft = a === "new" ? blankItem() : S.clone(db.catalogue.find((i) => i.id === a)); }
    const it = ui.itemDraft; const isNew = !db.catalogue.some((x) => x.id === it.id); const eqp = EQUIP_CATS.includes(it.cat);
    if (eqp && !it.rent) it.rent = { day: null, week: null, month: null, setup: null, teardown: null, setupPerM2: null, teardownPerM2: null, transport: null, minDays: null, setupIncluded: false };
    if (eqp && !it.ownership) it.ownership = it.cat === "equip_loue" ? "loue" : "possede";
    const hist = db.priceHistory.filter((h) => h.itemId === it.id).slice().reverse(); const used = isNew ? [] : S.itemUsedIn(it.id);
    const n = (p, lab) => `<div>${L(lab)}${I("it", p, p.split(".").reduce((o, k) => o?.[k], it), { type: "number", n: "n" })}</div>`;
    return `<a class="back" href="#/catalogue">‹ Catalogue</a><h2>${isNew ? "Nouvel article" : esc(it.label)}</h2><div class="card">
      <div class="row"><div>${L("Référence unique *")}${I("it", "ref", it.ref)}</div><div>${L("Catégorie *")}${Sel("it", "cat", it.cat, Object.entries(CATS))}</div></div>
      ${L("Désignation *")}${I("it", "label", it.label)}
      <div class="row"><div>${L("Unité de mesure *")}${I("it", "unit", it.unit, { ph: "m², sac, jour…" })}</div><div>${L("Mode de tarification *")}${Sel("it", "pricing", it.pricing, Object.entries(PRICING))}</div></div>
      <div class="row">${n("price", "Prix de vente (FCFA) — vide = inconnu")}${n("cost", "Prix d'achat (interne)")}</div>
      <p class="hint">Prix vide = <b>inconnu</b> (bloque le devis). Saisis 0 pour un article réellement gratuit. Tarif daté : ${it.priceDate ? frDate(it.priceDate) : "—"}.</p>
      <div class="row"><div>${L("Fournisseur")}${I("it", "supplier", it.supplier)}</div><div>${L("Marque")}${I("it", "brand", it.brand)}</div></div>
      <div class="row">${n("yield", "Rendement par unité")}<div>${L("Unité du rendement")}${I("it", "yieldUnit", it.yieldUnit)}</div></div>
      ${L("Balises (séparées par des virgules : acces, protection, transport, nettoyage, outillage, abrasif…)")}${I("it", "tags", (it.tags || []).join(", "), { list: "comma" })}
      ${eqp ? `<h3>Équipement</h3>${L("Statut")}${Sel("it", "ownership", it.ownership, [["loue", "Loué (tarifs fournisseur = coûts)"], ["possede", "Possédé (coût interne d'utilisation)"]])}
        ${it.ownership === "possede" ? `<div class="row">${n("ownCostDay", "Coût interne par jour (usure, entretien, amortissement)")}<div></div></div>` : `<div class="row3">${n("rent.day", "Location / jour")}${n("rent.week", "Location / semaine")}${n("rent.month", "Location / mois")}</div>
        <div class="row3">${n("rent.setup", "Montage (forfait)")}${n("rent.teardown", "Démontage (forfait)")}${n("rent.transport", "Transport / trajet")}</div>
        <div class="row3">${n("rent.setupPerM2", "Montage / m²")}${n("rent.teardownPerM2", "Démontage / m²")}${n("rent.minDays", "Durée minimale (jours)")}</div>${Chk("it", "rent.setupIncluded", it.rent.setupIncluded, "Montage et démontage déjà inclus dans le tarif du fournisseur")}`}` : ""}
      <div class="row" style="margin-top:12px"><button data-act="saveItem">Enregistrer</button><button class="sec" data-act="cancelItem">Annuler</button></div>
      ${!isNew ? `<button class="sec" data-act="archiveItem" data-id="${esc(it.id)}" style="margin-top:8px">${it.archived ? "Restaurer l'article" : "Archiver l'article"}</button>${used.length ? `<p class="hint">Utilisé dans : ${esc(used.join(", "))}. Les devis envoyés gardent leurs prix d'origine.</p>` : ""}` : ""}</div>
      ${hist.length ? `<h3>Historique des prix</h3><div class="card">${hist.map((h) => `<div class="chk"><div style="flex:1"><b>${esc(h.field)}</b> : ${fmtN(h.old)} → ${fmtN(h.new)}<div class="note">${esc(h.source)}</div></div><span class="note">${frDate(h.date)}</span></div>`).join("")}</div>` : ""}`;
  }
  const f = ui.f; const q = (f.q || "").toLowerCase();
  const effPack = f.pack === "*" ? "" : (f.pack || activeMetier());
  const list = db.catalogue.filter((i) => (!f.cat || i.cat === f.cat) && visibleIn(effPack, i) && (!q || (i.label + i.ref).toLowerCase().includes(q)));
  const unknown = db.catalogue.filter((i) => !i.archived && i.price === null && !EQUIP_CATS.includes(i.cat)).length;
  return `<h2>Catalogue</h2><div class="row"><a class="btn" href="#/catalogue/new">+ Nouvel article</a><div>${I("ui", "f.q", f.q, { ph: "Rechercher" })}</div></div>
    <div class="row"><div>${Sel("ui", "f.cat", f.cat, [["", "Toutes les catégories"], ...Object.entries(CATS)])}</div><div>${Sel("ui", "f.pack", f.pack, [["", activeMetier() ? "Mon métier : " + metierLabel(activeMetier()) : "Tous les métiers"], ...(activeMetier() ? [["*", "Tous les métiers"]] : []), ["peinture", "Peinture et enduits"], ["carrelage", "Carrelage"], ["maconnerie", "Maçonnerie"], ["plomberie", "Plomberie"], ["electricite", "Électricité"]])}</div></div>
    <div class="card"><b>Import / export Excel (CSV)</b>
      <div class="row"><button class="sec" data-act="csvExport">Exporter le catalogue</button><button class="sec" data-act="csvTemplate">Modèle vide</button></div>
      ${L("Importer un fichier CSV (enregistré depuis Excel)")}<input type="file" accept=".csv,text/csv,text/plain" data-on="csvFile">
      <p class="hint">Colonnes : ref, designation, categorie, unite, mode, prix_vente, prix_achat, rendement, unite_rendement, fournisseur, marque, balises. Prix vide = inconnu (nouvel article) ou inchangé (article existant). Rien n'est appliqué avant ta validation.</p>
      ${csvPreview()}</div>
    <p class="hint">${unknown} article(s) sans prix : complète les prix de tes métiers avant de les utiliser dans un devis.</p>
    ${list.map((i) => `<a class="qcard ${i.archived ? "arch" : ""}" href="#/catalogue/${esc(i.id)}"><div class="qtop"><b>${esc(i.label)}</b><span class="note">${esc(i.ref)}</span></div><div class="note">${esc(CATS[i.cat])} · ${esc(i.unit)}${i.ownership ? " · " + (i.ownership === "loue" ? "loué" : "possédé") : ""}</div>
      <div class="qbot"><b>${i.price === null ? "prix inconnu" : fmt(i.price)}</b><span class="note">${i.cost === null ? "achat inconnu" : "achat " + fmt(i.cost)}</span></div></a>`).join("")}`;
}

function csvPreview() {
  const c = ui.csv; if (!c) return "";
  if (c.fatal) return `<div class="banner bad">${esc(c.fatal)}</div>`;
  const bad = c.rows.filter((r) => r.status === "error");
  return `<div class="banner ${bad.length ? "bad" : "info"}"><b>${c.counts.new}</b> nouveau(x), <b>${c.counts.update}</b> mis à jour, <b>${c.counts.error}</b> ligne(s) refusée(s).${bad.slice(0, 8).map((r) => `<div class="hint">Ligne ${r.line}${r.ref ? " (" + esc(r.ref) + ")" : ""} : ${esc(r.problems.join(", "))}</div>`).join("")}${bad.length > 8 ? `<div class="hint">… et ${bad.length - 8} autre(s).</div>` : ""}</div>
    ${c.counts.new + c.counts.update ? `<button class="gold" data-act="csvApply">Appliquer ${c.counts.new + c.counts.update} ligne(s) valide(s)</button> <button class="sec" data-act="csvCancel">Annuler</button>` : `<button class="sec" data-act="csvCancel">Fermer</button>`}`;
}

// ---------- Suivi : commandes et factures ----------
function viewSuivi(a) {
  const db = S.state.db;
  if (a === "facture") {
    const inv = db.invoices.find((x) => x.id === ui.invoice); if (!inv) return `<div class="empty">Facture introuvable.</div>`;
    return `<div class="noprint"><a class="back" href="#/suivi">‹ Suivi</a><button data-act="print">Imprimer / Enregistrer en PDF</button></div>${renderInvoice(inv, db.company, db.settings.presentation)}`;
  }
  const pipe = ["envoye", "negociation", "accepte", "refuse", "expire"].map((k) => [k, db.quotes.filter((q) => S.effectiveStatus(q) === k)]);
  const soon = db.quotes.filter((q) => ["envoye", "negociation"].includes(q.status) && S.lastVersion(q)).map((q) => [q, S.expiryDate(q)]).filter(([, e]) => e && e >= S.today() && e <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10));
  return `<h2>Suivi</h2><div class="card"><b>Devis en cours</b><div class="chips">${pipe.map(([k, a2]) => `<span class="st st-${k}">${S.STATUS[k]} ${a2.length}</span>`).join("")}</div>
    ${soon.length ? `<p class="hint">À relancer (validité dans moins de 7 jours) : ${soon.map(([q, e]) => `<a href="#/devis/${q.id}/${lastOf(q) + 1}">${esc(q.ref)}</a> (${frDate(e)})`).join(", ")}</p>` : ""}</div>
    <h3>Commandes</h3>${db.orders.map((o) => `<div class="card"><div class="qtop"><b>${esc(o.ref)}</b>${badge(o.status === "solde" ? "complet" : "verifier", o.status === "solde" ? "Soldée" : "En cours")}</div>
      <div class="note">${esc(o.client) || "Client non renseigné"} — ${esc(o.site)} — depuis ${esc(o.quoteRef)} V${o.version}${o.option ? " (avec option)" : ""}</div><b>${fmt(o.totalHT)} HT</b>
      ${o.tranches.map((t, i) => `<div class="chk"><div style="flex:1"><b>${esc(t.label)}</b><div class="note">${fmt(t.amountHT)} HT${t.vat !== null ? " · TTC " + fmt(t.amountHT + t.vat) : ""} — ${{ a_facturer: "à facturer", facture: "facturé", paye: "payé le " + frDate(t.paidAt) }[t.status]}</div></div>
      ${t.status === "a_facturer" ? `<button class="sec" data-act="invoice" data-o="${o.id}" data-i="${i}">Facturer</button>` : ""}${t.status === "facture" ? `<a class="btn sec" href="#/suivi/facture" data-act="openInv" data-id="${t.invoiceId}">Facture</a> <button class="sec" data-act="pay" data-o="${o.id}" data-i="${i}">Payé</button>` : ""}${t.status === "paye" ? `<a class="btn sec" href="#/suivi/facture" data-act="openInv" data-id="${t.invoiceId}">Facture</a>` : ""}</div>`).join("")}</div>`).join("") || `<div class="empty">Aucune commande. Une commande se crée quand un devis est accepté.</div>`}`;
}

// ---------- Réglages ----------
function viewReglages() {
  const db = S.state.db, s = db.settings, c = db.company, ws = S.listWorkspaces(), act = S.state.ws, b = ui.backup;
  const ci = (p, lab) => `<div>${L(lab)}${I("db", "company." + p, c[p])}</div>`;
  return `<h2>Réglages</h2>
    <div class="card"><b>Entreprise</b><div class="row">${ci("name", "Nom")}${ci("tagline", "Activité")}</div><div class="row">${ci("address", "Adresse")}${ci("phone", "Téléphone")}</div><div class="row">${ci("whatsapp", "WhatsApp")}${ci("web", "Site web")}</div><div class="row">${ci("responsible", "Responsable chantier")}${ci("responsiblePhone", "Tél. responsable")}</div><div class="row">${ci("rccm", "RCCM (facultatif)")}${ci("niu", "N° contribuable NIU (facultatif)")}</div><p class="hint">RCCM et NIU s'affichent en bas du devis seulement si tu les remplis. Je ne les invente jamais.</p></div>
    <div class="card"><b>Règles de l'entreprise</b><p class="hint">Aucune de ces valeurs n'est supposée : renseigne celles qui viennent de tes chantiers.</p>
      <div class="row"><div>${L("Hauteur à partir de laquelle un accès est exigé (m)")}${I("db", "settings.accessThresholdM", s.accessThresholdM, { type: "number", n: "n" })}</div><div>${L("Marge de sécurité produits par défaut (%)")}${I("db", "settings.lossPct", s.lossPct, { type: "number", n: "n" })}</div></div>
      <div class="row"><div>${L("TVA par défaut (%) — vide = hors taxes")}${I("db", "settings.vatPct", s.vatPct, { type: "number", n: "n" })}</div><div>${L("Validité par défaut (jours)")}${I("db", "settings.validityDays", s.validityDays, { type: "number", n: "n" })}</div></div>
      <div class="row"><div>${L("Taux de marque minimal d'alerte (%)")}${I("db", "settings.minMarginPct", s.minMarginPct, { type: "number", n: "n" })}</div><div>${L("Préfixe des devis")}${I("db", "settings.quotePrefix", s.quotePrefix)}</div></div>
      <div class="row"><div>${L("Frais généraux par défaut (%)")}${I("db", "settings.overheadPct", s.overheadPct, { type: "number", n: "z" })}</div><div>${L("Traitement")}${Sel("db", "settings.overheadMode", s.overheadMode, [["inclus", "Inclus dans mes prix"], ["ligne", "Ligne séparée"]])}</div></div>
      ${L("Échéancier fournitures par défaut (% séparés par « / »)")}${I("db", "settings.payMaterials", joinPct(s.payMaterials), { list: "slash" })}${L("Échéancier main-d'œuvre par défaut")}${I("db", "settings.payServices", joinPct(s.payServices), { list: "slash" })}
      ${L("Déclencheurs par défaut (un par ligne)")}${Txt("db", "settings.triggers", (s.triggers || []).join("\n"), { list: "lines" })}${L("Conditions de l'offre imprimées sur chaque devis (une par ligne)")}${Txt("db", "settings.conditions", (s.conditions || []).join("\n"), { list: "lines", rows: 5 })}
      <p class="hint">Les réglages servent aux nouveaux devis. Les devis déjà créés gardent leurs valeurs.</p></div>
    <div class="card"><b>Présentation des devis</b>
      <p class="hint">Choix enregistré pour tous tes devis. Un devis envoyé garde le modèle, la couleur et le logo du jour de l'envoi. Aucun modèle ne modifie un montant.</p>
      <div class="tplprev">${[["classique", "Classique"], ["sobre", "Sobre"], ["compact", "Compact"]].map(([v, t]) => `<label><input type="radio" name="tpl" value="${v}" data-r="db" data-p="settings.presentation.template" ${s.presentation.template === v ? "checked" : ""}> ${t}</label>`).join("")}</div>
      ${L("Couleur principale")}<input type="color" data-r="db" data-p="settings.presentation.color" value="${esc(s.presentation.color)}" style="height:48px;padding:4px">
      ${L("Logo (PNG ou JPG)")}${s.presentation.logo ? `<div class="row"><img src="${s.presentation.logo}" alt="Logo" style="max-height:64px;max-width:100%;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:8px;padding:4px"><button class="sec" data-act="logoClear">Retirer le logo</button></div>` : `<p class="hint">Aucun logo : le devis s'imprime sans logo.</p>`}
      <input type="file" accept="image/png,image/jpeg" data-on="logoFile"></div>
    <div class="card"><b>Entreprises sur cet appareil</b><p class="hint">Chaque entreprise a son propre espace : devis, clients, catalogue et prix ne se mélangent jamais.</p>
      ${ws.map((w) => `<div class="chk"><div style="flex:1"><b>${esc(w.name)}</b> ${w.id === act ? badge("complet", "active") : ""}</div>${w.id !== act ? `<button class="sec" data-act="switchWs" data-id="${w.id}">Ouvrir</button> <button class="sec" data-act="delWs" data-id="${w.id}">Supprimer</button>` : ""}</div>`).join("")}
      ${L("Créer une entreprise")}${I("ui", "wsNew", ui.wsNew, { ph: "Nom de la nouvelle entreprise" })}${Chk("ui", "wsCopy", ui.wsCopy, "Copier le catalogue (prix compris) de l'entreprise actuelle")}<p class="hint">Sans cette case, le nouvel espace démarre avec les articles et formules, mais sans aucun prix ni rendement.</p><button class="sec" data-act="newWs" style="margin-top:8px">Créer et ouvrir</button></div>
    <div class="card"><b>Sauvegarde et restauration</b><p class="hint">Les données sont uniquement sur cet appareil. Exporte une sauvegarde régulièrement. Il n'y a pas de synchronisation entre appareils dans cette version.</p>
      ${S.pendingStorageWarning() ? `<div class="banner bad">${S.pendingStorageWarning()}</div>` : ""}
      <button data-act="export">Exporter une sauvegarde complète (.json)</button> <button class="sec" data-act="quotesCsv">Exporter la liste des devis (CSV)</button>
      ${L("Restaurer depuis un fichier (testé avant d'être appliqué)")}<input type="file" accept=".json,application/json" data-on="backupFile">
      ${b ? `<div class="banner ${b.ok ? "info" : "bad"}">${b.ok ? `Sauvegarde valide : ${b.summary.devis} devis, ${b.summary.clients} clients, ${b.summary.articles} articles, ${b.summary.commandes} commandes. Toutes les versions de devis passent le contrôle d'intégrité.` : b.errors.map(esc).join("<br>")}</div>${b.ok ? `<button class="gold" data-act="restore">Restaurer comme nouvelle entreprise</button><p class="hint">La restauration crée un nouvel espace : tes données actuelles ne sont pas écrasées.</p>` : ""}` : ""}</div>
    <div class="card"><b>Repartir de zéro</b><p class="hint">Supprime les devis commencés mais jamais envoyés. Les devis envoyés ou acceptés ne sont jamais supprimés. Fais d'abord une sauvegarde ci-dessus si tu hésites.</p>
      <button class="sec" data-act="delDrafts" ${S.deletableQuotes().length ? "" : "disabled"}>Supprimer mes brouillons (${S.deletableQuotes().length})</button></div>
    <div class="card"><b>Journal d'audit</b><p class="hint">Les 40 dernières actions (création, envoi, statut, prix, paiements).</p>${db.audit.slice(-40).reverse().map((a) => `<div class="chk"><div style="flex:1"><b>${esc(a.action)}</b><div class="note">${esc(a.detail)}</div></div><span class="note">${frDate(a.at)}</span></div>`).join("") || `<p class="hint">Vide.</p>`}</div>
    <div class="card"><b>À propos</b><p class="hint">Les documents commerciaux sont des devis. Les factures sont des pièces de gestion : les mentions légales et fiscales officielles ne sont pas générées. Aucune règle locale (fiscalité, marchés publics) n'est supposée : à valider avant usage.</p></div>`;
}

// ---------- Rendu ----------
function render() {
  const r = route(), db = S.state.db; let html = "";
  const tab = r.tab;
  if (tab === "devis" && r.a && r.a !== ui.qid) { ui.tmp.free.tab = "produits"; ui.tmp.free.ask = null; ui.tmp.free.ok = false; }
  ui.qid = tab === "devis" && r.a ? r.a : ui.qid;
  if (tab === "devis") { if (r.a) { const qq = S.getQuote(r.a); ui.step = Math.min((qq ? lastOf(qq) : 4) + 1, Math.max(0, Number(r.b) || 0)); html = viewQuote(); } else html = viewDevis(); }
  else if (tab === "clients") html = viewClients(r.a);
  else if (tab === "catalogue") html = viewCatalogue(r.a);
  else if (tab === "suivi") html = viewSuivi(r.a);
  else if (tab === "reglages") html = viewReglages();
  else html = viewDevis();
  const banners = (S.state.conflict ? `<div class="banner bad noprint"><b>Conflit :</b> ces données ont été modifiées ailleurs (autre onglet). Rien n'a été écrasé. <button data-act="reload">Recharger la version la plus récente</button></div>` : "") +
    (!S.state.storageOk ? `<div class="banner bad noprint">Le stockage de l'appareil est plein ou bloqué : exporte une sauvegarde (Réglages).</div>` : "") +
    (ui.flash ? `<div class="banner ${ui.flash.type === "ok" ? "info" : "bad"} noprint">${esc(ui.flash.text)}</div>` : "");
  $("#app").innerHTML = banners + html;
  const tabs = [["devis", "Devis"], ["clients", "Clients"], ["catalogue", "Produits"], ["suivi", "Suivi"], ["reglages", "Réglages"]];
  $("#nav").innerHTML = tabs.map(([k, n]) => `<a class="${tab === k ? "on" : ""}" href="#/${k}">${ic(k, 26)}<span>${n}</span></a>`).join("");
  $("#hsub").textContent = ((S.listWorkspaces().find((w) => w.id === S.state.ws) || {}).name || "") + (activeMetier() ? " · " + metierLabel(activeMetier()) : "");
  $("#hname").textContent = "TechGo Devis"; $("#hlogo").src = LOGO;
}
function rerender(keepScroll = true) { const y = window.scrollY; render(); if (keepScroll) window.scrollTo(0, y); }

// ---------- Événements ----------
function parseValue(el) {
  if (el.type === "checkbox") return el.checked;
  if (el.dataset.list === "slash") return pctList(el.value);
  if (el.dataset.list === "lines") return el.value.split("\n").map((x) => x.trim()).filter(Boolean);
  if (el.dataset.list === "comma") return el.value.split(",").map((x) => x.trim()).filter(Boolean);
  if (el.dataset.n) { const v = num(el.value, el.dataset.n === "z"); return typeof v === "number" && isNaN(v) ? null : v; }
  return el.value;
}
const onHandlers = {
  pickClient(el) { const q = S.getQuote(ui.qid); const c = S.state.db.clients.find((x) => x.id === el.value); q.current.client = c ? { id: c.id, name: c.name, type: c.type, contact: c.contact || "" } : { ...q.current.client, id: "" }; touchQuote(q); },
  decide(el) { const q = S.getQuote(ui.qid); if (el.value) q.current.decisions[el.dataset.k] = el.value; else delete q.current.decisions[el.dataset.k]; touchQuote(q); },
  adj(el) {
    const q = S.getQuote(ui.qid), id = el.dataset.id, f = el.dataset.f; const a = (q.current.adjust[id] = q.current.adjust[id] || {});
    if (f === "qty") { const v = num(el.value); if (v === null) delete a.override; else a.override = { qty: v, reason: a.override?.reason || "" }; }
    else if (f === "reason") { a.override = a.override || { qty: null, reason: "" }; a.override.reason = el.value; }
    else if (f === "price") { const v = num(el.value); if (v !== null && !(v > 0)) throw new Error("Le prix doit être plus grand que zéro."); if (v === null) delete a.priceOverride; else a.priceOverride = v; }
    else if (f === "cost") { const v = num(el.value); if (v !== null && !(v > 0)) throw new Error("Le prix d'achat doit être plus grand que zéro."); if (v === null) delete a.costOverride; else a.costOverride = v; }
    else if (f === "option") a.option = el.checked;
    touchQuote(q);
  },
  mf(el) { const q = S.getQuote(ui.qid); const m = q.current.manual.find((x) => x.id === el.dataset.id); if (!m) return; const f = el.dataset.f; m[f] = ["basis", "bill"].includes(f) ? el.value : num(el.value); touchQuote(q); },
  csvFile(el) { const f = el.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { ui.csv = analyseCsv(String(rd.result), S.state.db.catalogue); rerender(); }; rd.readAsText(f); },
  logoFile(el) { const f = el.files[0]; if (!f) return; processLogo(f).then((l) => { const p = S.state.db.settings.presentation; p.logo = l.url; p.logoW = l.w; p.logoH = l.h; S.commit(); ui.flash = { type: "ok", text: "Logo enregistré." }; rerender(); }).catch((e) => { ui.flash = { type: "err", text: e.message }; rerender(); }); },
  backupFile(el) { const file = el.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = () => { ui.backup = S.verifyBackup(String(rd.result)); rerender(); }; rd.readAsText(file); },
};
// Redimensionne le logo (côté max 256 px) pour ne pas saturer le stockage du téléphone.
function processLogo(file) {
  return new Promise((res, rej) => {
    if (!/^image\/(png|jpeg)$/.test(file.type)) return rej(new Error("Format non accepté : utilise un fichier PNG ou JPG."));
    const rd = new FileReader();
    rd.onerror = () => rej(new Error("Lecture du fichier impossible."));
    rd.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error("Image illisible."));
      img.onload = () => {
        const k = Math.min(1, 256 / Math.max(img.width, img.height)), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
        const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
        if (file.type === "image/jpeg") { g.fillStyle = "#fff"; g.fillRect(0, 0, w, h); }
        g.drawImage(img, 0, 0, w, h);
        const url = file.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.85);
        if (url.length > 400000) return rej(new Error("Logo trop lourd : choisis une image plus simple."));
        res({ url, w, h });
      };
      img.src = String(rd.result);
    };
    rd.readAsDataURL(file);
  });
}
function download(name, mime, data) {
  const blob = new Blob([data], { type: mime }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function touchQuote(q) {
  if (q.status === "pret") { q.status = "brouillon"; q.statusLog.push({ at: new Date().toISOString(), to: "brouillon", reason: "Modifié après validation" }); }
  S.commit(); rerender();
}
document.addEventListener("change", (e) => {
  const el = e.target; if (!el.dataset) return; ui.flash = null;
  try {
    if (el.dataset.on) return onHandlers[el.dataset.on](el);
    if (!el.dataset.p) return;
    const root = el.dataset.r || "q", o = roots()[root]; if (!o) return;
    setPath(o, el.dataset.p, parseValue(el));
    if (root === "q") touchQuote(o); else if (root === "db") { S.commit(); rerender(); } else rerender();
  } catch (err) { ui.flash = { type: "err", text: err.message }; rerender(); }
});

const actions = {
  reload() { S.reloadAfterConflict(); },
  newQuote() { const q = S.createQuote(); go(`#/devis/${q.id}/0`); },
  demoQuote() { const q = S.createQuote(); q.current = { ...referenceDraft(S.state.db.settings), ref: q.ref, date: S.today() }; S.state.db.settings.accessThresholdM ?? 0; S.commit(); go(`#/devis/${q.id}/0`); },
  prev() { go(`#/devis/${ui.qid}/${Math.max(0, ui.step - 1)}`); }, next() { go(`#/devis/${ui.qid}/${Math.min(lastOf(S.getQuote(ui.qid)), ui.step + 1)}`); },
  addPrest() {
    const q = S.getQuote(ui.qid); const [pid, rid] = (ui.tmp.addPrest || "").split("|"); if (!pid) throw new Error("Choisis une prestation.");
    const pres = PACKS[pid].prestations.find((x) => x.id === rid); const params = {}; pres.params.forEach((p) => (params[p.key] = p.def));
    q.current.prestations.push({ id: "p" + S.uid(), packId: pid, prestId: rid, params }); ui.tmp.addPrest = ""; touchQuote(q);
  },
  delPrest(b) { const q = S.getQuote(ui.qid); if (!confirm("Retirer cette prestation et ses lignes ?")) return; q.current.prestations.splice(Number(b.dataset.i), 1); touchQuote(q); },
  skipLine(b) { const q = S.getQuote(ui.qid); const a = (q.current.adjust[b.dataset.id] = q.current.adjust[b.dataset.id] || {}); a.skip = true; touchQuote(q); },
  restoreLine(b) { const q = S.getQuote(ui.qid); delete q.current.adjust[b.dataset.id].skip; touchQuote(q); },
  delManual(b) { const q = S.getQuote(ui.qid); q.current.manual = q.current.manual.filter((m) => m.id !== b.dataset.id); delete q.current.adjust[b.dataset.id]; touchQuote(q); },
  addLine() {
    const q = S.getQuote(ui.qid), t = ui.tmp.line, it = S.state.db.catalogue.find((i) => i.id === t.itemId);
    if (!it) throw new Error("Choisis un article."); if (!(t.qty > 0)) throw new Error("Saisis une quantité supérieure à zéro.");
    ui.tmp.free.tab = TAB_OF[it.cat] || "autres"; q.current.manual.push({ id: "m" + S.uid(), itemId: it.id, group: CATS[it.cat], mode: "fixed", qty: t.qty, option: !!t.option }); ui.tmp.line = { itemId: "", qty: 1, option: false }; touchQuote(q);
  },
  toApercu() { const el = document.getElementById("apercu"); if (el) el.scrollIntoView?.({ behavior: "smooth", block: "start" }); return "skip"; },
  freeTab(b) { ui.tmp.free.tab = b.dataset.k; ui.tmp.free.unit = ""; ui.tmp.free.ask = null; },
  setMetier(b) { const k = b.dataset.k; S.state.db.settings.metier = k; const q = ui.qid && S.getQuote(ui.qid); if (q && location.hash.includes("/devis/") && S.editable(q) && !q.current.metier) q.current.metier = k; S.commit(); },
  clearMetier() { S.state.db.settings.metier = ""; S.state.db.settings.profil = ""; S.commit(); },
  setProfil(b) { S.state.db.settings.profil = b.dataset.k; S.commit(); },
  pickName(b) { const it = S.state.db.catalogue.find((i) => !i.archived && nz(i.label) === nz(b.dataset.n)); ui.tmp.free.label = b.dataset.n; ui.tmp.free.unit = it ? it.unit : ""; ui.tmp.free.ask = null; ui.tmp.free.ok = false; },
  freeUnit(b) { ui.tmp.free.unit = b.dataset.u; },
  askNo() { ui.tmp.free.ask = null; },
  askYes() { ui.tmp.free.ok = true; actions.addFree(); },
  addFree() {
    const q = S.getQuote(ui.qid), t = ui.tmp.free, db = S.state.db; const cm = q.current.pricing.method === "cout_plus_marge", field = cm ? "cost" : "price";
    const label = (t.label || "").trim(); if (!label) throw new Error("Écris le nom (ex. : ciment).");
    let it = db.catalogue.find((i) => !i.archived && nz(i.label) === nz(label)), created = false;
    const unit = it ? it.unit : (t.unit || "").trim(); if (!unit) throw new Error("Choisis l'unité (sac, litre, jour…).");
    if (!(t.qty > 0)) throw new Error("Écris la quantité (plus grande que zéro).");
    const has = t.price !== null && t.price !== undefined && t.price !== ""; if (has && !(t.price > 0)) throw new Error("Le prix doit être plus grand que zéro. Si tu ne le connais pas, laisse vide.");
    if (it && has && it[field] != null && it[field] !== t.price && !t.ok) { t.ask = { prev: it[field] }; return; }
    if (!it) { const id = S.newItemId("TER"); it = { id, ref: id, label, cat: FREE_CAT[t.tab], unit, pricing: "unitaire", price: null, cost: null, priceDate: null, supplier: "", brand: "", yield: null, yieldUnit: "m²", tags: [], pack: "", archived: false, fieldPrice: false }; created = true; }
    if (has && t.save && (it[field] === null || it[field] === undefined)) { it[field] = t.price; it.priceDate = S.today(); it.fieldPrice = true; }
    if (created || (has && t.save && it.fieldPrice)) S.saveItem(it, "saisi sur place");
    const m = { id: "m" + S.uid(), itemId: it.id, group: CATS[it.cat], mode: "fixed", qty: t.qty, option: false }; q.current.manual.push(m);
    if (has && it[field] !== t.price) { const a = (q.current.adjust[m.id] = {}); if (cm) a.costOverride = t.price; else a.priceOverride = t.price; }
    ui.tmp.free = { ...t, label: "", unit: "", qty: null, price: null, ask: null, ok: false };
    ui.flash = { type: "ok", text: has ? `${label} ajouté.` : `${label} ajouté. Il manque son prix : total pas fini.` }; touchQuote(q);
  },
  addEquip() {
    const q = S.getQuote(ui.qid), t = ui.tmp.equip, it = S.state.db.catalogue.find((i) => i.id === t.itemId);
    if (!it) throw new Error("Choisis un équipement."); if (!(t.days > 0)) throw new Error("Saisis la durée d'utilisation en jours.");
    ui.tmp.free.tab = "outils"; q.current.manual.push({ id: "m" + S.uid(), itemId: it.id, group: CATS[it.cat], mode: "equip", days: t.days, basis: t.basis, trips: t.trips ?? 1, areaQty: 0, bill: t.bill, markupPct: t.markupPct }); ui.tmp.equip = { itemId: "", days: null, basis: "jour", trips: 1, bill: "inclus", markupPct: null }; touchQuote(q);
  },
  addScaf() {
    const q = S.getQuote(ui.qid), t = ui.tmp.scaf; if (!t.itemId) throw new Error("Choisis un équipement d'accès."); if (!(t.longueur > 0 && t.hauteur > 0)) throw new Error("Saisis la longueur et la hauteur de façade."); if (!(t.jours > 0)) throw new Error("Saisis la durée d'utilisation en jours.");
    ui.tmp.free.tab = "outils"; q.current.manual.push(...scaffoldLines({ id: "m" + S.uid(), itemId: t.itemId, longueur: t.longueur, hauteur: t.hauteur, jours: t.jours, basis: t.basis, trips: t.trips ?? 1, bill: t.bill, markupPct: t.markupPct }));
    ui.tmp.scaf = { itemId: "", longueur: null, hauteur: null, jours: null, basis: "jour", trips: 1, bill: "inclus", markupPct: null }; touchQuote(q);
  },
  mark(b) { const q = S.getQuote(ui.qid); S.setStatus(q, b.dataset.to); ui.flash = { type: "ok", text: "Statut : " + S.STATUS[q.status] }; },
  view(b) { ui.view = b.dataset.v; },
  print() { window.print(); },
  send() { const q = S.getQuote(ui.qid); const v = S.freezeVersion(q); ui.ver = String(v.n); ui.view = "client"; ui.flash = { type: "ok", text: `V${v.n} figée et envoyée. Empreinte ${v.hash}.` }; },
  seeVer(b) { ui.ver = b.dataset.n; ui.view = "client"; },
  copy(b) { const t = b.dataset.t; const ok = () => { ui.flash = { type: "ok", text: "Message copié." }; rerender(); }; if (navigator.clipboard) navigator.clipboard.writeText(t).then(ok).catch(() => { ui.flash = { type: "err", text: "Copie impossible : sélectionne le texte manuellement." }; rerender(); }); else ok(); return "skip"; },
  startNeg() { const q = S.getQuote(ui.qid); S.startNegotiation(q); ui.ver = "draft"; ui.flash = { type: "ok", text: `Brouillon de V${q.versions.length + 1} prêt : modifie puis envoie.` }; go(`#/devis/${q.id}/0`); },
  discardNeg() { S.discardNegotiationDraft(S.getQuote(ui.qid)); },
  delQuote() { const q = S.getQuote(ui.qid); if (!q || !confirm(`Supprimer le brouillon ${q.ref} ? Tu ne pourras pas le récupérer.`)) return; if (S.deleteQuote(q.id)) go("#/devis"); },
  delDrafts() { const n = S.deletableQuotes().length; if (!n || !confirm(`Supprimer ${n} brouillon(s) jamais envoyé(s) ? Les devis envoyés ne sont pas touchés. Tu ne pourras pas les récupérer.`)) return; S.deleteAllDrafts(); ui.flash = { type: "ok", text: `${n} brouillon(s) supprimé(s).` }; },
  dup() { const q = S.duplicateQuote(ui.qid); go(`#/devis/${q.id}/0`); },
  accept() { const q = S.getQuote(ui.qid); const o = S.accept(q, { ...ui.tmp.accept }); ui.tmp.accept = { by: "", note: "", option: false }; ui.flash = { type: "ok", text: `Commande ${o.ref} créée.` }; },
  reject() { S.reject(S.getQuote(ui.qid), ui.tmp.reason); ui.tmp.reason = ""; },
  cancel() { if (!confirm("Annuler ce devis ? L'historique est conservé.")) return; S.cancel(S.getQuote(ui.qid), ui.tmp.reason); ui.tmp.reason = ""; },
  saveClient() { const c = ui.clientDraft; if (!c.name.trim()) throw new Error("Le nom du client est obligatoire."); const isNew = !c.id; S.saveClient(c); ui.clientDraft = null; ui.flash = { type: "ok", text: "Client enregistré." }; go("#/clients"); },
  quoteFor(b) { const q = S.createQuote(b.dataset.id); go(`#/devis/${q.id}/0`); },
  saveItem() {
    const it = ui.itemDraft, db = S.state.db; const miss = [];
    if (!it.ref.trim()) miss.push("référence"); if (!it.label.trim()) miss.push("désignation"); if (!it.unit.trim()) miss.push("unité");
    if (miss.length) throw new Error("Champs obligatoires manquants : " + miss.join(", ") + ".");
    if (db.catalogue.some((x) => x.ref === it.ref.trim() && x.id !== it.id)) throw new Error("Cette référence existe déjà : elle doit être unique.");
    it.ref = it.ref.trim(); S.saveItem(it); ui.itemDraft = null; ui.itemKey = null; ui.flash = { type: "ok", text: "Article enregistré." }; go("#/catalogue");
  },
  cancelItem() { ui.itemDraft = null; ui.itemKey = null; go("#/catalogue"); },
  archiveItem(b) { const it = S.state.db.catalogue.find((i) => i.id === b.dataset.id); S.archiveItem(b.dataset.id, !it.archived); ui.itemDraft = null; ui.itemKey = null; go("#/catalogue"); },
  invoice(b) { const inv = S.invoiceTranche(b.dataset.o, Number(b.dataset.i)); ui.flash = { type: "ok", text: "Facture " + inv.no + " émise." }; },
  pay(b) { S.markPaid(b.dataset.o, Number(b.dataset.i)); },
  openInv(b) { ui.invoice = b.dataset.id; },
  word(b) {
    const q = S.getQuote(ui.qid); const v = q.versions.find((x) => String(x.n) === b.dataset.n); if (!v) throw new Error("Version introuvable.");
    const { bytes } = buildDocx(v, q.ref); download(`${q.ref}-V${v.n}.docx`, DOCX_MIME, bytes); ui.flash = { type: "ok", text: `Word V${v.n} téléchargé (copie modifiable).` };
  },
  csvExport() { download(`catalogue-${S.today()}.csv`, "text/csv;charset=utf-8", exportCatalogueCsv(S.state.db.catalogue)); ui.flash = { type: "ok", text: "Catalogue exporté (CSV)." }; },
  csvTemplate() { download("modele-catalogue.csv", "text/csv;charset=utf-8", templateCsv()); },
  csvApply() { const ok = ui.csv.rows.filter((r) => r.status !== "error").map((r) => r.item); S.saveItems(ok, "import CSV"); ui.flash = { type: "ok", text: `${ok.length} article(s) importé(s).` }; ui.csv = null; },
  csvCancel() { ui.csv = null; },
  quotesCsv() {
    const rows = S.state.db.quotes.map((q) => { const l = S.lastVersion(q); return [q.ref, q.current.client.name, q.current.site.name, S.STATUS[S.effectiveStatus(q)], q.versions.length, l ? l.result.totals.base : "", l ? l.at.slice(0, 10) : "", l ? l.hash : ""]; });
    download(`devis-${S.today()}.csv`, "text/csv;charset=utf-8", exportRowsCsv(["reference", "client", "chantier", "statut", "versions", "total_ht_derniere_version", "date_envoi", "empreinte"], rows));
  },
  logoClear() { const p = S.state.db.settings.presentation; p.logo = null; p.logoW = 0; p.logoH = 0; S.commit(); },
  export() {
    const blob = new Blob([S.exportBackup()], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `techgo-devis-sauvegarde-${S.today()}.json`; document.body.appendChild(a); a.click(); a.remove(); ui.flash = { type: "ok", text: "Sauvegarde exportée. Garde le fichier hors du téléphone." };
  },
  restore() { if (!ui.backup?.ok) return; S.restoreBackup(ui.backup.parsed); ui.backup = null; ui.flash = { type: "ok", text: "Sauvegarde restaurée dans un nouvel espace." }; },
  newWs() { S.createWorkspace(ui.wsNew.trim() || "Nouvelle entreprise", { copyCatalogue: ui.wsCopy }); ui.wsNew = ""; ui.wsCopy = false; go("#/reglages"); },
  switchWs(b) { S.switchWorkspace(b.dataset.id); go("#/devis"); },
  delWs(b) { if (!confirm("Supprimer cette entreprise et toutes ses données de cet appareil ?")) return; S.deleteWorkspace(b.dataset.id); },
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b || !actions[b.dataset.act]) return;
  if (b.tagName === "A" && b.dataset.act !== "openInv" && b.dataset.act !== "seeVer") return;
  ui.flash = null;
  try { const r = actions[b.dataset.act](b); if (r === "skip") return; } catch (err) { ui.flash = { type: "err", text: err.message }; }
  rerender(b.tagName !== "A");
});
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
window.addEventListener("beforeprint", () => document.body.classList.add("printing"));
window.addEventListener("afterprint", () => document.body.classList.remove("printing"));
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
S.init();
render();
