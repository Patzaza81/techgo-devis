// Import / export CSV du catalogue (Excel enregistre en CSV). Aucune donnée inventée : une cellule vide de prix = prix inconnu (nouvel article)
// ou « inchangé » (article existant). Rien n'est appliqué sans aperçu et validation par l'utilisateur.
import { CATS, PRICING } from "./packs.js";

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
export const COLUMNS = ["ref", "designation", "categorie", "unite", "mode", "prix_vente", "prix_achat", "rendement", "unite_rendement", "fournisseur", "marque", "balises"];
const ALIAS = { reference: "ref", designation: "designation", libelle: "designation", categorie: "categorie", unite: "unite", mode: "mode", mode_de_tarification: "mode", tarification: "mode", prix: "prix_vente", prix_de_vente: "prix_vente", prix_vente: "prix_vente", prix_achat: "prix_achat", cout: "prix_achat", rendement: "rendement", unite_rendement: "unite_rendement", unite_du_rendement: "unite_rendement", fournisseur: "fournisseur", marque: "marque", balises: "balises", tags: "balises" };

export function parseCsv(text) {
  let s = String(text ?? "").replace(/^﻿/, "");
  const first = s.split(/\r?\n/)[0] || ""; const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length && first.includes(";") ? ";" : first.includes("\t") ? "\t" : ",";
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === sep) { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some((x) => x.trim() !== "")) rows.push(row); row = []; }
    else cur += c;
  }
  row.push(cur); if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}
const esc = (v) => { const s = v === null || v === undefined ? "" : String(v); return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const numOut = (n) => (n === null || n === undefined ? "" : String(n).replace(".", ","));
export function exportCatalogueCsv(catalogue) {
  const head = COLUMNS.join(";");
  const lines = catalogue.filter((i) => !i.archived).map((i) => [i.ref, i.label, CATS[i.cat] || i.cat, i.unit, PRICING[i.pricing] || i.pricing, numOut(i.price), numOut(i.cost), numOut(i.yield), i.yieldUnit || "", i.supplier || "", i.brand || "", (i.tags || []).join(",")].map(esc).join(";"));
  return "﻿" + [head, ...lines].join("\r\n") + "\r\n";
}
export const templateCsv = () => "﻿" + COLUMNS.join(";") + "\r\n";
export function exportRowsCsv(head, rows) { return "﻿" + [head.join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\r\n") + "\r\n"; }

function toNum(v) {
  const t = String(v ?? "").trim(); if (t === "") return { empty: true };
  const n = Number(t.replace(/[\s  ]/g, "").replace(",", ".")); return Number.isFinite(n) ? { n } : { bad: true };
}
const byKeyOrLabel = (map, v) => { const k = norm(v); return Object.keys(map).find((key) => norm(key) === k || norm(map[key]) === k) || null; };

/** Analyse seulement (ne modifie rien). Retourne { fatal, rows:[{line, ref, status:'new'|'update'|'error', item?, problems[]}], counts } */
export function analyseCsv(text, catalogue) {
  const table = parseCsv(text);
  if (table.length < 2) return { fatal: "Fichier vide ou sans ligne de données.", rows: [], counts: { new: 0, update: 0, error: 0 } };
  const map = table[0].map((h) => ALIAS[norm(h)] || (COLUMNS.includes(norm(h)) ? norm(h) : null));
  const missing = ["ref", "designation", "categorie", "unite", "mode"].filter((c) => !map.includes(c));
  if (missing.length) return { fatal: "Colonnes obligatoires absentes : " + missing.join(", ") + ".", rows: [], counts: { new: 0, update: 0, error: 0 } };
  const byRef = new Map(catalogue.map((i) => [i.ref, i])); const seen = new Set(); const rows = [];
  table.slice(1).forEach((cells, idx) => {
    const g = {}; map.forEach((c, i) => { if (c) g[c] = (cells[i] ?? "").trim(); });
    const line = idx + 2, problems = [];
    const ref = g.ref || "";
    if (!ref) problems.push("référence manquante");
    if (ref && seen.has(ref)) problems.push("référence en double dans le fichier");
    seen.add(ref);
    if (!g.designation) problems.push("désignation manquante");
    if (!g.unite) problems.push("unité manquante");
    const cat = byKeyOrLabel(CATS, g.categorie); if (!cat) problems.push(`catégorie inconnue « ${g.categorie} »`);
    const mode = byKeyOrLabel(PRICING, g.mode); if (!mode) problems.push(`mode de tarification inconnu « ${g.mode} »`);
    const nums = {};
    for (const [col, lab] of [["prix_vente", "prix de vente"], ["prix_achat", "prix d'achat"], ["rendement", "rendement"]]) {
      if (!(col in g)) continue; const r = toNum(g[col]);
      if (r.bad) problems.push(`${lab} illisible « ${g[col]} »`);
      else if (!r.empty) { if (r.n < 0) problems.push(`${lab} négatif`); else if (col === "rendement" && r.n === 0) problems.push("rendement nul"); else nums[col] = r.n; }
    }
    if (problems.length) { rows.push({ line, ref, status: "error", problems }); return; }
    const old = byRef.get(ref);
    const tags = "balises" in g ? g.balises.split(/[,|]/).map((x) => x.trim()).filter(Boolean) : null;
    if (old) {
      const item = JSON.parse(JSON.stringify(old));
      Object.assign(item, { label: g.designation, cat, unit: g.unite, pricing: mode });
      if ("prix_vente" in nums) item.price = nums.prix_vente; if ("prix_achat" in nums) item.cost = nums.prix_achat; if ("rendement" in nums) item.yield = nums.rendement;
      if (g.unite_rendement) item.yieldUnit = g.unite_rendement; if (g.fournisseur) item.supplier = g.fournisseur; if (g.marque) item.brand = g.marque; if (tags) item.tags = tags;
      item.archived = false;
      rows.push({ line, ref, status: "update", item, problems: [] });
    } else {
      const eq = cat === "equip_loue" || cat === "equip_possede";
      const item = { id: ref, ref, label: g.designation, cat, unit: g.unite, pricing: mode, price: nums.prix_vente ?? null, cost: nums.prix_achat ?? null, priceDate: null, supplier: g.fournisseur || "", brand: g.marque || "", yield: nums.rendement ?? null, yieldUnit: g.unite_rendement || "m²", tags: tags || [], pack: "", archived: false,
        ...(eq ? { ownership: cat === "equip_loue" ? "loue" : "possede", ownCostDay: null, rent: { day: null, week: null, month: null, setup: null, teardown: null, setupPerM2: null, teardownPerM2: null, transport: null, minDays: null, setupIncluded: false } } : {}) };
      rows.push({ line, ref, status: "new", item, problems: [] });
    }
  });
  const counts = { new: 0, update: 0, error: 0 }; rows.forEach((r) => counts[r.status]++);
  return { fatal: "", rows, counts };
}
