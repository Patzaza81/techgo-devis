// Stockage local (par entreprise), cycle de vie des devis, versions figées, audit, commandes, sauvegarde.
// Aucun serveur : les données restent sur l'appareil. La synchronisation entre appareils n'existe pas dans cette version.
import { fingerprint, computeQuote, runChecks, ENGINE_VERSION } from "./engine.js";
import { ALL_SEEDS, newDraft, buildInput, compute, packExpects, validPct, PACKS, effSurface } from "./packs.js";
import { LOGO } from "./logo.js";

export const STATUS = {
  brouillon: "Brouillon", a_verifier: "À vérifier", pret: "Prêt à envoyer", envoye: "Envoyé", negociation: "En négociation",
  accepte: "Accepté", refuse: "Refusé", expire: "Expiré", annule: "Annulé",
};
const TRANSITIONS = {
  brouillon: ["a_verifier", "pret", "annule"], a_verifier: ["brouillon", "pret", "annule"], pret: ["brouillon", "a_verifier", "annule"],
  envoye: ["negociation", "accepte", "refuse", "expire", "annule"], negociation: ["accepte", "refuse", "annule"],
  accepte: [], refuse: ["negociation"], expire: ["negociation"], annule: [],
};
export const EDITABLE = ["brouillon", "a_verifier", "pret", "negociation"];

const mem = {};
const ls = {
  get(k) { try { return localStorage.getItem(k); } catch { return mem[k] ?? null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch { mem[k] = v; return false; } },
  del(k) { try { localStorage.removeItem(k); } catch { delete mem[k]; } },
};
const IDX = "tgd-index";
const wsKey = (id) => "tgd-ws-" + id;
export const clone = (x) => JSON.parse(JSON.stringify(x));
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export function deepFreeze(o) { if (o && typeof o === "object" && !Object.isFrozen(o)) { Object.freeze(o); Object.values(o).forEach(deepFreeze); } return o; }

export const state = { db: null, ws: null, conflict: false, storageOk: true, loadedRev: 0 };

// Catalogue « vide » : mêmes articles et formules, mais aucun prix, coût ni rendement (chaque entreprise saisit les siens).
export function blankPrices(items) {
  return items.map((i) => ({ ...i, price: null, cost: null, priceDate: null, yield: null, ownCostDay: null, ...(i.rent ? { rent: { day: null, week: null, month: null, setup: null, teardown: null, setupPerM2: null, teardownPerM2: null, transport: null, minDays: null, setupIncluded: false } } : {}) }));
}
function defaultDb() {
  return {
    v: 1, rev: 0,
    company: { name: "TECHGO S.A.R.L.", tagline: "Coordination, supervision et garantie des travaux", address: "Douala, Bonamoussadi", phone: "+237 694 375 420", whatsapp: "+237 699 881 729", web: "techgo-douala.netlify.app", responsible: "M. Bangue Henri Nkondo", responsiblePhone: "+237 694 375 420", rccm: "", niu: "" },
    settings: {
      metier: "",
      profil: "",
      presentation: { template: "classique", color: "#0b7a8c", logo: LOGO, logoW: 128, logoH: 128 },
      accessThresholdM: null, lossPct: null, vatPct: null, validityDays: 30, minMarginPct: null, overheadPct: 0, overheadMode: "inclus", quotePrefix: "DEV",
      payMaterials: [70, 30], payServices: [35, 40, 25], triggers: ["À la signature", "À 50 % d'avancement du chantier", "Chantier terminé, à la réception"],
      conditions: ["Prix : montants exprimés hors taxes sauf mention contraire, sur la base des prix fournisseurs et des tarifs de pose relevés à la date du devis. Au-delà de la durée de validité, les prix sont susceptibles d'être actualisés."],
    },
    catalogue: ALL_SEEDS(), priceHistory: [], clients: [], quotes: [], orders: [], invoices: [], audit: [], seq: {},
  };
}

// ---------- Espaces de travail (un par entreprise, isolés sur l'appareil) ----------
function readIndex() { try { return JSON.parse(ls.get(IDX)) || null; } catch { return null; } }
function writeIndex(i) { ls.set(IDX, JSON.stringify(i)); }
export function listWorkspaces() { const i = readIndex(); return i ? i.list : []; }
export function activeWorkspace() { const i = readIndex(); return i ? i.active : null; }

// Premier lancement. blank = true (application publiée) : espace vide, sans l'identité, le logo ni les prix de TechGo.
// L'espace de TechGo existe déjà dans le téléphone de TechGo et n'est jamais touché.
export function init({ blank = false } = {}) {
  let idx = readIndex();
  if (!idx || !idx.list.length) {
    if (blank) return createWorkspace("Mon entreprise");
    const id = uid(); idx = { active: id, list: [{ id, name: "TechGo" }] }; writeIndex(idx);
  }
  return load(idx.active);
}
export function load(id) {
  let db = null;
  try { db = JSON.parse(ls.get(wsKey(id))); } catch { db = null; }
  state.db = db ? migrate(db) : defaultDb();
  state.ws = id; state.loadedRev = state.db.rev; state.conflict = false;
  state.db.quotes.forEach((q) => q.versions.forEach((v) => deepFreeze(v)));
  sweepExpired();
  if (!db) commit();
  return state.db;
}
function migrate(db) {
  const d = defaultDb();
  for (const k of Object.keys(d)) if (!(k in db)) db[k] = d[k];
  db.settings = { ...d.settings, ...db.settings };
  // ajoute les articles livrés avec les packs qui manquent (ne modifie jamais ceux de l'utilisateur)
  const have = new Set(db.catalogue.map((i) => i.ref));
  const fresh = ALL_SEEDS().filter((s) => !have.has(s.ref));
  (db.blankSeeds ? blankPrices(fresh) : fresh).forEach((s) => db.catalogue.push(s));
  return db;
}
export function createWorkspace(name, { copyCatalogue = false } = {}) {
  const src = copyCatalogue && state.db ? clone(state.db.catalogue) : null;
  const idx = readIndex() || { active: null, list: [] };
  const id = uid(); idx.list.push({ id, name: name || "Nouvelle entreprise" }); idx.active = id; writeIndex(idx);
  const db = defaultDb(); db.company.name = name || "Nouvelle entreprise"; db.company.tagline = ""; db.company.address = ""; db.company.phone = ""; db.company.whatsapp = ""; db.company.web = ""; db.company.responsible = ""; db.company.responsiblePhone = ""; db.company.rccm = ""; db.company.niu = "";
  db.settings.payMaterials = [100]; db.settings.payServices = [100]; db.settings.triggers = ["À la signature"]; db.settings.conditions = [];
  db.settings.presentation = { template: "classique", color: "#0b7a8c", logo: null, logoW: 0, logoH: 0 };
  if (src) db.catalogue = src; else { db.catalogue = blankPrices(db.catalogue); db.blankSeeds = true; }
  ls.set(wsKey(id), JSON.stringify(db));
  return load(id);
}
export function switchWorkspace(id) { const idx = readIndex(); idx.active = id; writeIndex(idx); return load(id); }
export function deleteWorkspace(id) {
  const idx = readIndex(); if (idx.list.length <= 1) throw new Error("Impossible de supprimer le dernier espace.");
  idx.list = idx.list.filter((w) => w.id !== id); if (idx.active === id) idx.active = idx.list[0].id; writeIndex(idx); ls.del(wsKey(id)); return load(idx.active);
}
export function renameWorkspace(id, name) { const idx = readIndex(); const w = idx.list.find((x) => x.id === id); if (w) w.name = name; writeIndex(idx); }

// ---------- Enregistrement avec détection de conflit ----------
export function commit() {
  const db = state.db;
  // un autre onglet a modifié les données depuis notre lecture : on n'écrase jamais en silence
  let stored = null; try { stored = JSON.parse(ls.get(wsKey(state.ws))); } catch {}
  if (stored && stored.rev !== state.loadedRev) { state.conflict = true; return false; }
  db.rev = (db.rev || 0) + 1;
  state.storageOk = ls.set(wsKey(state.ws), JSON.stringify(db));
  state.loadedRev = db.rev;
  return state.storageOk;
}
export function reloadAfterConflict() { return load(state.ws); }

export function audit(action, objType, objId, detail) {
  state.db.audit.push({ at: new Date().toISOString(), action, objType, objId, detail: detail || "" });
  if (state.db.audit.length > 5000) state.db.audit.splice(0, state.db.audit.length - 5000);
}

// ---------- Catalogue et historique des prix ----------
function putItem(item, source) {
  const db = state.db; const i = db.catalogue.findIndex((x) => x.id === item.id);
  if (i < 0) { if (item.price !== null && item.price !== undefined && !item.priceDate) item.priceDate = today(); db.catalogue.push(item); audit("article_cree", "article", item.id, item.label); return; }
  const old = db.catalogue[i];
  for (const f of ["price", "cost", "ownCostDay", "yield"]) if ((old[f] ?? null) !== (item[f] ?? null)) { db.priceHistory.push({ itemId: item.id, field: f, old: old[f] ?? null, new: item[f] ?? null, date: today(), at: new Date().toISOString(), source }); }
  for (const f of ["day", "week", "month", "setup", "teardown", "setupPerM2", "teardownPerM2", "transport"]) {
    const a = old.rent ? old.rent[f] ?? null : null, b = item.rent ? item.rent[f] ?? null : null;
    if (a !== b) db.priceHistory.push({ itemId: item.id, field: "rent." + f, old: a, new: b, date: today(), at: new Date().toISOString(), source });
  }
  if ((old.price ?? null) !== (item.price ?? null)) item.priceDate = today();
  db.catalogue[i] = item; audit("article_modifie", "article", item.id, item.label);
}
export function saveItem(item, source = "saisie manuelle") { putItem(item, source); return commit(); }
// Plusieurs articles d'un coup (import) : un seul enregistrement, historique des prix conservé pour chacun.
export function saveItems(items, source = "import CSV") { items.forEach((it) => putItem(it, source)); audit("import_catalogue", "catalogue", "", `${items.length} article(s) — ${source}`); return commit(); }
export function newItemId(prefix = "ART") { let n = 1; const ids = new Set(state.db.catalogue.map((i) => i.id)); while (ids.has(`${prefix}-${String(n).padStart(3, "0")}`)) n++; return `${prefix}-${String(n).padStart(3, "0")}`; }
export function archiveItem(id, on = true) { const it = state.db.catalogue.find((x) => x.id === id); if (it) { it.archived = on; audit(on ? "article_archive" : "article_restaure", "article", id, it.label); commit(); } }
export function itemUsedIn(id) { return state.db.quotes.filter((q) => JSON.stringify(q.current).includes(`"${id}"`)).map((q) => q.ref); }

// ---------- Clients ----------
export function saveClient(c) {
  const db = state.db; if (!c.id) { c.id = uid(); db.clients.push(c); audit("client_cree", "client", c.id, c.name); }
  else { const i = db.clients.findIndex((x) => x.id === c.id); db.clients[i] = c; audit("client_modifie", "client", c.id, c.name); }
  return commit();
}
export const quotesOfClient = (id) => state.db.quotes.filter((q) => q.current.client.id === id);

// ---------- Devis ----------
export function createQuote(clientId) {
  const db = state.db; const d = today(); const ym = d.slice(0, 7);
  db.seq[ym] = (db.seq[ym] || 0) + 1;
  const draft = newDraft(db.settings, d);
  draft.ref = `${db.settings.quotePrefix || "DEV"}-${ym}-${String(db.seq[ym]).padStart(3, "0")}`;
  if (clientId) { const c = db.clients.find((x) => x.id === clientId); if (c) draft.client = { id: c.id, name: c.name, type: c.type, contact: c.contact || "" }; }
  const q = { id: uid(), ref: draft.ref, createdAt: new Date().toISOString(), status: "brouillon", current: draft, versions: [], statusLog: [{ at: new Date().toISOString(), to: "brouillon", reason: "Création" }] };
  db.quotes.unshift(q); audit("devis_cree", "devis", q.id, q.ref); commit(); return q;
}
export function duplicateQuote(id) {
  const src = state.db.quotes.find((q) => q.id === id); const q = createQuote();
  q.current = { ...clone(src.current), ref: q.ref, date: today() }; audit("devis_duplique", "devis", q.id, "depuis " + src.ref); commit(); return q;
}
// Suppression : uniquement les brouillons jamais envoyés (aucune version figée, aucune commande).
export const deletable = (q) => ["brouillon", "a_verifier", "pret"].includes(q.status) && q.versions.length === 0 && !(state.db.orders || []).some((o) => o.quoteId === q.id);
export function deleteQuote(id) {
  const db = state.db; const q = db.quotes.find((x) => x.id === id);
  if (!q || !deletable(q)) return false;
  db.quotes = db.quotes.filter((x) => x.id !== id); audit("devis_supprime", "devis", id, q.ref);
  if (!db.quotes.length) Object.keys(db.seq).forEach((k) => { if (!k.startsWith("CMD")) delete db.seq[k]; });
  return commit();
}
export const deletableQuotes = () => state.db.quotes.filter(deletable);
export function deleteAllDrafts() { const ids = deletableQuotes().map((q) => q.id); ids.forEach((id) => deleteQuote(id)); return ids.length; }
export const getQuote = (id) => state.db.quotes.find((q) => q.id === id);
export const editable = (q) => EDITABLE.includes(q.status);

export function lastVersion(q) { return q.versions[q.versions.length - 1] || null; }
export function expiryDate(q) { const v = lastVersion(q); return v ? addDays(v.at.slice(0, 10), v.quote.validityDays || 0) : null; }
export function effectiveStatus(q) {
  if ((q.status === "envoye" || q.status === "negociation") && lastVersion(q)) { const e = expiryDate(q); if (e && today() > e) return "expire"; }
  return q.status;
}
function sweepExpired() {
  let ch = false;
  for (const q of state.db.quotes) if (q.status === "envoye" && effectiveStatus(q) === "expire") { q.status = "expire"; q.statusLog.push({ at: new Date().toISOString(), to: "expire", reason: "Validité dépassée" }); audit("devis_expire", "devis", q.id, q.ref); ch = true; }
  return ch;
}

export function evaluate(q, draft = q.current) {
  const db = state.db; const s = db.settings;
  const result = compute(draft, db.catalogue, s);
  const last = lastVersion(q);
  const expired = !!last && ["envoye", "negociation"].includes(q.status) && effectiveStatus(q) === "expire";
  const checks = runChecks({
    surface: effSurface(draft.site), lossPct: draft.site.lossPct, result, workHeightM: draft.site.workHeightM, accessThresholdM: s.accessThresholdM, decisions: draft.decisions || {},
    expects: packExpects(draft), hasDelay: draft.terms.delayMin > 0 && draft.terms.delayMax >= draft.terms.delayMin, hasValidity: draft.validityDays > 0,
    hasPayment: validPct(draft.terms.payment.materials) && validPct(draft.terms.payment.services), vatPct: draft.terms.vatPct, minMarginPct: s.minMarginPct,
    discountActive: (draft.discount.pct > 0) || (draft.discount.amount > 0), expired,
  });
  return { result, checks };
}

export function setStatus(q, to, reason = "") {
  const from = q.status;
  if (!TRANSITIONS[from] || !TRANSITIONS[from].includes(to)) throw new Error(`Changement de statut impossible : ${STATUS[from]} → ${STATUS[to]}.`);
  if (to === "pret" && evaluate(q).checks.status === "bloque") throw new Error("Des points bloquants subsistent : corrige-les avant de marquer le devis prêt.");
  q.status = to; q.statusLog.push({ at: new Date().toISOString(), to, reason });
  audit("devis_statut", "devis", q.id, `${q.ref} : ${STATUS[from]} → ${STATUS[to]}${reason ? " (" + reason + ")" : ""}`);
  commit();
}

// ---------- Versions figées ----------
export function freezeVersion(q) {
  if (!["pret", "negociation"].includes(q.status)) throw new Error("Le devis doit être « Prêt à envoyer » (ou en négociation) pour être envoyé.");
  const ev = evaluate(q);
  if (ev.checks.status === "bloque") throw new Error("Envoi impossible : des points bloquants subsistent.");
  const db = state.db; const draft = clone(q.current);
  const used = new Set(ev.result.lines.map((l) => l.itemId));
  const items = Object.fromEntries(db.catalogue.filter((i) => used.has(i.id)).map((i) => [i.id, clone(i)]));
  const snap = {
    n: q.versions.length + 1, at: new Date().toISOString(), quote: draft, items, minMarginPct: db.settings.minMarginPct ?? null,
    company: clone(db.company), conditions: clone(db.settings.conditions), presentation: clone(db.settings.presentation), result: clone(ev.result), checkStatus: ev.checks.status,
    engineVersion: ENGINE_VERSION, packVersions: Object.fromEntries(Object.values(PACKS).map((p) => [p.id, p.version])),
  };
  snap.hash = fingerprint({ quote: snap.quote, items: snap.items, result: snap.result });
  q.versions.push(deepFreeze(snap)); q.status = "envoye";
  q.statusLog.push({ at: snap.at, to: "envoye", reason: `Version V${snap.n} figée (empreinte ${snap.hash})` });
  audit("devis_envoye", "devis", q.id, `${q.ref} V${snap.n} — ${snap.hash}`); commit(); return snap;
}
// Recalcule une version figée à partir de ses seules données et compare au résultat enregistré.
export function verifyVersion(v) {
  const reasons = [];
  try {
    const inp = buildInput(v.quote, Object.values(v.items), { minMarginPct: v.minMarginPct });
    const again = computeQuote(inp);
    if (fingerprint(again) !== fingerprint(v.result)) reasons.push("Le recalcul ne redonne pas le résultat enregistré.");
  } catch (e) { reasons.push("Recalcul impossible : " + e.message); }
  if (fingerprint({ quote: v.quote, items: v.items, result: v.result }) !== v.hash) reasons.push("L'empreinte de contrôle ne correspond plus.");
  return { ok: reasons.length === 0, reasons };
}
export function startNegotiation(q) {
  if (!["envoye", "refuse", "expire"].includes(q.status)) throw new Error("Une nouvelle version se prépare à partir d'un devis envoyé, refusé ou expiré.");
  const v = lastVersion(q);
  q.current = { ...clone(v.quote), date: today() };
  setStatus(q, "negociation", `Préparation de V${q.versions.length + 1}`);
  return q;
}
export function discardNegotiationDraft(q) { const v = lastVersion(q); if (v) q.current = clone(v.quote); commit(); }

// ---------- Acceptation, commande, factures de gestion ----------
export function accept(q, { by, date, note, option }) {
  const v = lastVersion(q); if (!v) throw new Error("Aucune version envoyée à accepter.");
  setStatus(q, "accepte", `V${v.n} acceptée${by ? " par " + by : ""}`);
  q.acceptance = { version: v.n, by: by || "", date: date || today(), note: note || "", option: !!option };
  const db = state.db; const sc = option ? v.result.schedules.option : v.result.schedules.base;
  const total = option ? v.result.totals.withOption : v.result.totals.base;
  const vat = option ? v.result.totals.vatOption : v.result.totals.vatBase;
  const ym = today().slice(0, 7); db.seq["CMD" + ym] = (db.seq["CMD" + ym] || 0) + 1;
  const trig = v.quote.terms.triggers || [];
  const order = {
    id: uid(), ref: `CMD-${ym}-${String(db.seq["CMD" + ym]).padStart(3, "0")}`, quoteId: q.id, quoteRef: q.ref, version: v.n, option: !!option, createdAt: new Date().toISOString(),
    client: v.quote.client.name, site: v.quote.site.name, totalHT: total, vat, status: "en_cours",
    tranches: sc.combined.map((amt, i) => ({ label: trig[i] || `Versement ${i + 1}`, amountHT: amt, vat: sc.vat ? sc.vat[i] : null, status: "a_facturer", invoiceId: null, paidAt: null })),
  };
  db.orders.unshift(order); audit("commande_creee", "commande", order.id, `${order.ref} depuis ${q.ref} V${v.n}`); commit(); return order;
}
export function reject(q, motif) { setStatus(q, "refuse", motif); }
export function cancel(q, motif) { setStatus(q, "annule", motif); }

export function invoiceTranche(orderId, i) {
  const db = state.db; const o = db.orders.find((x) => x.id === orderId); const t = o.tranches[i];
  if (t.invoiceId) throw new Error("Cette échéance est déjà facturée.");
  const y = today().slice(0, 4); db.seq["FAC" + y] = (db.seq["FAC" + y] || 0) + 1;
  const inv = { id: uid(), no: `FAC-${y}-${String(db.seq["FAC" + y]).padStart(4, "0")}`, orderId, orderRef: o.ref, quoteRef: o.quoteRef, tranche: i, label: t.label, date: today(), client: o.client, site: o.site, amountHT: t.amountHT, vat: t.vat, ttc: t.vat === null ? null : t.amountHT + t.vat, status: "emise" };
  db.invoices.unshift(inv); t.invoiceId = inv.id; t.status = "facture"; audit("facture_emise", "facture", inv.id, inv.no); commit(); return inv;
}
export function markPaid(orderId, i) {
  const o = state.db.orders.find((x) => x.id === orderId); const t = o.tranches[i]; t.status = "paye"; t.paidAt = today();
  const inv = state.db.invoices.find((x) => x.id === t.invoiceId); if (inv) inv.status = "payee";
  if (o.tranches.every((x) => x.status === "paye")) o.status = "solde";
  audit("paiement", "commande", o.id, `${o.ref} — ${t.label}`); commit();
}

// ---------- Sauvegarde et restauration vérifiées ----------
export function exportBackup() {
  const data = clone(state.db); const ws = listWorkspaces().find((w) => w.id === state.ws);
  const pack = { format: "techgo-devis-backup", v: 1, at: new Date().toISOString(), workspace: ws ? ws.name : "", data };
  pack.checksum = fingerprint(data); return JSON.stringify(pack);
}
export function verifyBackup(text) {
  const errors = [];
  let p; try { p = JSON.parse(text); } catch { return { ok: false, errors: ["Fichier illisible (JSON invalide)."] }; }
  if (!p || p.format !== "techgo-devis-backup") errors.push("Ce fichier n'est pas une sauvegarde TechGo Devis.");
  if (!p || !p.data) return { ok: false, errors: errors.length ? errors : ["Données absentes."] };
  if (fingerprint(p.data) !== p.checksum) errors.push("La somme de contrôle ne correspond pas : fichier modifié ou corrompu.");
  for (const k of ["company", "settings", "catalogue", "quotes", "orders", "invoices", "audit"]) if (!(k in p.data)) errors.push("Section manquante : " + k);
  let bad = 0;
  if (!errors.length) p.data.quotes.forEach((q) => q.versions.forEach((v) => { if (!verifyVersion(v).ok) bad++; }));
  if (bad) errors.push(`${bad} version(s) de devis ne passent pas le contrôle d'intégrité.`);
  return { ok: errors.length === 0, errors, parsed: p, summary: p.data ? { devis: p.data.quotes.length, clients: (p.data.clients || []).length, articles: p.data.catalogue.length, commandes: p.data.orders.length } : null };
}
export function restoreBackup(parsed, name) {
  const idx = readIndex() || { active: null, list: [] }; const id = uid();
  idx.list.push({ id, name: name || parsed.workspace || "Restauré" }); idx.active = id; writeIndex(idx);
  ls.set(wsKey(id), JSON.stringify(parsed.data)); return load(id);
}
export function pendingStorageWarning() { return state.storageOk ? "" : "Le stockage du téléphone est plein ou bloqué : exporte une sauvegarde maintenant."; }
