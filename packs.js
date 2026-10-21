// Catalogue universel + packs métiers + construction des lignes d'un devis.
// Règle du projet : aucun prix, rendement ou plafond inventé. Seule la prestation « Enduit 3 couches » (métier Peinture) porte des valeurs réelles
// (devis DEV-2026-09-001 du 28/09/2026). Les autres packs fournissent les FORMULES ; prix et rendements restent
// vides (donc bloquants) jusqu'à saisie par l'entreprise.
import { printableNorm } from "./metiers/elec-ref.js";
import { computeQuote } from "./engine.js";
import { mk, rent, hasN } from "./metiers/commun.js";
import peinture from "./metiers/peinture.js";
import carrelage from "./metiers/carrelage.js";
import maconnerie from "./metiers/maconnerie.js";
import plomberie from "./metiers/plomberie.js";
import electricite from "./metiers/electricite.js";

export const CATS = {
  materiaux: "Matériaux et produits", consommables: "Consommables", main_oeuvre: "Main-d'œuvre", outillage: "Outillage",
  equip_possede: "Équipements possédés", equip_loue: "Équipements loués", acces: "Accès et travail en hauteur",
  securite: "Sécurité et protections", transport: "Transport et manutention", installation: "Installation et repli du chantier",
  sous_traitance: "Sous-traitance", frais: "Frais indirects et autres frais",
};
export const PRICING = { unitaire: "Prix unitaire", forfait: "Forfait", horaire: "Horaire", journalier: "Journalier", duree: "Lié à une durée" };
export const DECISION_TAGS = { acces: "Accès / échafaudage", transport: "Transport", protection: "Protections", nettoyage: "Nettoyage / déchets", outillage: "Outillage" };


// ---------- Articles génériques (communs à tous les métiers) ----------
export const GENERIC_SEEDS = [
  mk("ACC-ECHAF-FIXE", "Échafaudage fixe (location)", "equip_loue", "jour", "duree", null, { ownership: "loue", rent: rent(), tags: ["acces"], ownCostDay: null }),
  mk("ACC-ECHAF-ROUL", "Échafaudage roulant (location)", "equip_loue", "jour", "duree", null, { ownership: "loue", rent: rent(), tags: ["acces"], ownCostDay: null }),
  mk("ACC-ECHELLE", "Échelle professionnelle", "equip_possede", "jour", "duree", null, { ownership: "possede", rent: rent(), tags: ["acces"], ownCostDay: null }),
  mk("ACC-NACELLE", "Plateforme / nacelle (location)", "equip_loue", "jour", "duree", null, { ownership: "loue", rent: rent(), tags: ["acces"], ownCostDay: null }),
  mk("OUT-PERFO", "Perforateur", "equip_possede", "jour", "duree", null, { ownership: "possede", rent: rent(), tags: ["outillage"], ownCostDay: null }),
  mk("OUT-MEULEUSE", "Meuleuse", "equip_possede", "jour", "duree", null, { ownership: "possede", rent: rent(), tags: ["outillage"], ownCostDay: null }),
  mk("OUT-BETONNIERE", "Bétonnière", "equip_possede", "jour", "duree", null, { ownership: "possede", rent: rent(), tags: ["outillage"], ownCostDay: null }),
  mk("OUT-GROUPE", "Groupe électrogène", "equip_possede", "jour", "duree", null, { ownership: "possede", rent: rent(), tags: ["outillage"], ownCostDay: null }),
  mk("OUT-POMPE", "Pompe", "equip_possede", "jour", "duree", null, { ownership: "possede", rent: rent(), tags: ["outillage"], ownCostDay: null }),
  mk("OUT-ASPIRATEUR", "Aspirateur industriel", "equip_possede", "jour", "duree", null, { ownership: "possede", rent: rent(), tags: ["outillage"], ownCostDay: null }),
  mk("OUT-ECLAIRAGE", "Éclairage provisoire et rallonges", "equip_possede", "jour", "duree", null, { ownership: "possede", rent: rent(), tags: ["outillage"], ownCostDay: null }),
  mk("SEC-BACHE", "Bâche de protection", "consommables", "m²", "unitaire", null, { tags: ["protection"] }),
  mk("SEC-EPI", "Équipements de protection individuelle (casques, gants, lunettes)", "consommables", "lot", "forfait", null, { tags: ["protection"] }),
  mk("SEC-HARNAIS", "Harnais adapté", "consommables", "pièce", "unitaire", null, { tags: ["protection"] }),
  mk("SEC-BALISAGE", "Balisage et signalisation", "securite", "forfait", "forfait", null, { tags: ["protection"] }),
  mk("TRA-CHANTIER", "Transport et logistique de chantier", "transport", "forfait", "forfait", null, { tags: ["transport"] }),
  mk("TRA-ROTATION", "Rotation de transport / livraison", "transport", "trajet", "unitaire", null, { tags: ["transport"] }),
  mk("TRA-MANUT", "Manutention et stockage", "transport", "forfait", "forfait", null, { tags: ["transport"] }),
  mk("INS-CHANTIER", "Installation et repli du chantier", "installation", "forfait", "forfait", null, {}),
  mk("NET-DECHETS", "Évacuation des déchets (benne)", "installation", "forfait", "forfait", null, { tags: ["nettoyage"] }),
  mk("NET-FINAL", "Nettoyage final du site", "installation", "forfait", "forfait", null, { tags: ["nettoyage"] }),
  mk("SST-GENERIQUE", "Sous-traitance (à préciser)", "sous_traitance", "forfait", "forfait", null, {}),
  mk("FRA-DIVERS", "Autre frais justifié (à préciser)", "frais", "forfait", "forfait", null, {}),
];

// Un module par métier (dossier metiers/). « enduits » n'est pas un métier : c'est une prestation du métier Peinture.
export const PACKS = { peinture, carrelage, maconnerie, plomberie, electricite };
// Alias de lecture pour d'anciennes données (non énumérable : n'ajoute pas de doublon au catalogue).
Object.defineProperty(PACKS, "enduits", { value: peinture, enumerable: false });
export const ALL_SEEDS = () => [...GENERIC_SEEDS, ...Object.values(PACKS).flatMap((p) => p.seeds)].map((s) => JSON.parse(JSON.stringify(s)));

// ---------- Module accès / échafaudage ----------
// L'application chiffre ce que l'utilisateur décide ; elle ne conçoit pas l'échafaudage (voir l'avertissement affiché).
export function scaffoldLines(o) {
  const area = (o.longueur || 0) * (o.hauteur || 0);
  const L = [{
    id: o.id, itemId: o.itemId, group: "Accès et travail en hauteur", role: `${o.longueur ?? "?"} m × ${o.hauteur ?? "?"} m = ${area} m² de façade`,
    mode: "equip", days: o.jours, basis: o.basis || "jour", areaQty: area, trips: o.trips ?? 1, bill: o.bill || "inclus", markupPct: o.markupPct,
  }];
  return L;
}

// ---------- Construction des lignes et de l'entrée du moteur ----------
export function regen(q) {
  const out = [];
  for (const inst of q.prestations || []) {
    const pack = PACKS[inst.packId]; if (!pack) continue;
    const pres = pack.prestations.find((x) => x.id === inst.prestId); if (!pres) continue;
    for (const b of pres.build(inst.params || {}, { surface: effSurface(q.site) })) {
      const id = `${inst.id}.${b.key}`;
      const line = { ...b, id, ...(b.of ? { of: `${inst.id}.${b.of}` } : {}) };
      const adj = (q.adjust || {})[id]; if (adj) Object.assign(line, adj);
      if (line.skip) continue;
      out.push(line);
    }
  }
  for (const m of q.manual || []) { const adj = (q.adjust || {})[m.id]; const line = { ...m, ...(adj || {}) }; const pn = q.showNorms && m.norm ? printableNorm(m.norm) : ""; if (pn) line.role = [m.role, "Norme de référence : " + pn].filter(Boolean).join(" — "); if (!line.skip) out.push(line); }
  return out;
}
// Surface retenue pour le calcul : brute − ouvertures si la surface brute est saisie, sinon la surface nette saisie directement.
export function effSurface(s) {
  if (!s) return null;
  if (hasN(s.surfaceBrute) && s.surfaceBrute > 0) { const n = Math.round((s.surfaceBrute - (hasN(s.ouvertures) ? s.ouvertures : 0)) * 1000) / 1000; return n > 0 ? n : null; }
  return hasN(s.surface) ? s.surface : null;
}
export const surfaceSource = (s) => (s && hasN(s.surfaceBrute) && s.surfaceBrute > 0 ? "brute − ouvertures" : "surface nette saisie");
export function itemsMap(catalogue) { return Object.fromEntries(catalogue.map((i) => [i.id, i])); }
export const validPct = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => typeof x === "number" && isFinite(x) && x >= 0) && Math.abs(a.reduce((x, y) => x + y, 0) - 100) < 1e-9;
export function buildInput(q, catalogue, settings) {
  const pay = q.terms.payment || {};
  return {
    surface: effSurface(q.site), lossPct: q.site.lossPct, lines: regen(q), items: itemsMap(catalogue),
    payment: { materials: validPct(pay.materials) ? pay.materials : [100], services: validPct(pay.services) ? pay.services : [100] }, vatPct: q.terms.vatPct, discount: q.discount, overhead: q.overhead, pricing: q.pricing,
    minMarginPct: settings.minMarginPct ?? null,
  };
}
export function compute(q, catalogue, settings) { return computeQuote(buildInput(q, catalogue, settings)); }
// Les contrôles attendus sont portés par chaque PRESTATION utilisée (pas par le métier entier).
export function packExpects(q) {
  const seen = new Set(); const out = [];
  for (const inst of q.prestations || []) {
    const pres = PACKS[inst.packId]?.prestations.find((x) => x.id === inst.prestId);
    for (const e of pres?.expects || []) if (!seen.has(e.tag)) { seen.add(e.tag); out.push(e); }
  }
  return out;
}

// Plans de paiement du technicien, repris de tes devis (v4 TechGo ; ERCOG 2026-B01).
export const PLAN_TECH = {
  "70-30": { label: "70 % à la signature, 30 % à la réception", pct: [70, 30], triggers: ["À la signature, avant démarrage du chantier", "À la réception des travaux"] },
  "70-15-15": { label: "70 % à la commande, 15 % à mi-chantier, 15 % à la réception", pct: [70, 15, 15], triggers: ["À la commande, avant démarrage des travaux", "À l'avancement, à mi-chantier", "À la réception des travaux"] },
};
export function newDraft(settings, date) {
  const s = settings || {};
  return {
    ref: "", date, metier: s.metier || "", profil: s.profil === "technicien" ? "technicien" : "entreprise", form: s.profil === "technicien" ? "detaille" : "", validityDays: s.validityDays ?? null,
    client: { id: "", name: "", type: "Particulier", contact: "" },
    site: { name: "", address: "", surface: null, surfaceBrute: null, ouvertures: null, levels: null, workHeightM: null, lossPct: s.lossPct ?? null, notes: "",
      buildingType: "", support: "", finish: "", occupied: "", water: "", power: "", vehicleAccess: "", transportKm: null, durationDays: null, wishedDate: "" },
    prestations: [], manual: [], adjust: {}, decisions: {},
    terms: s.profil === "technicien"
      // Plan par défaut tiré de tes devis TechGo v4 (acompte 70 % à la signature, solde 30 % à la réception)
      ? { delayMin: null, delayMax: null, vatPct: s.vatPct ?? null, crew: { workers: null, extraDay: null }, payment: { materials: [70, 30], services: [70, 30] }, triggers: [...PLAN_TECH["70-30"].triggers] }
      : { delayMin: null, delayMax: null, vatPct: s.vatPct ?? null, crew: { workers: null, extraDay: null },
      payment: { materials: s.payMaterials ? [...s.payMaterials] : [100], services: s.payServices ? [...s.payServices] : [100] },
      triggers: s.triggers ? [...s.triggers] : ["À la signature", "À l'avancement convenu", "À la réception du chantier"] },
    pricing: { method: "catalogue", markupPct: null }, discount: { pct: null, amount: null },
    overhead: { pct: s.overheadPct ?? 0, mode: s.overheadMode ?? "inclus" }, notes: "",
  };
}

// Devis de référence DEV-2026-09-001 (jeu de test et démonstration)
export function referenceDraft(settings) {
  const q = newDraft(settings, "2026-09-28");
  q.ref = "DEV-2026-09-001"; q.validityDays = 30; q.metier = "peinture"; q.profil = "entreprise";
  q.client.name = "";
  q.site = { name: "Immeuble R+5 — Douala", address: "Douala", surface: 4629, levels: 6, workHeightM: 18, lossPct: 5, notes: "Niveaux 1 à 5, terrasse et cage d'escalier — métrés du client." };
  q.prestations = [{ id: "p1", packId: "peinture", prestId: "systeme3", params: { primer: "option", additifKg: 10, abr60: 3, abr100: 4, abr120: 4, abr220: 20, transport: "oui" } }];
  q.terms = { delayMin: 90, delayMax: 120, vatPct: null, payment: { materials: [70, 30], services: [35, 40, 25] }, triggers: ["À la signature", "À 50 % d'avancement du chantier", "Chantier terminé, à la réception"] };
  q.decisions = { acces: "exclu", protection: "na", nettoyage: "inclus", outillage: "exclu" };
  return q;
}
