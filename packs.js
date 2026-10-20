// Catalogue universel + packs métiers + construction des lignes d'un devis.
// Règle du projet : aucun prix, rendement ou plafond inventé. Seul le pack « Enduits » porte des valeurs réelles
// (devis DEV-2026-09-001 du 28/09/2026). Les autres packs fournissent les FORMULES ; prix et rendements restent
// vides (donc bloquants) jusqu'à saisie par l'entreprise.
import { computeQuote } from "./engine.js";

export const CATS = {
  materiaux: "Matériaux et produits", consommables: "Consommables", main_oeuvre: "Main-d'œuvre", outillage: "Outillage",
  equip_possede: "Équipements possédés", equip_loue: "Équipements loués", acces: "Accès et travail en hauteur",
  securite: "Sécurité et protections", transport: "Transport et manutention", installation: "Installation et repli du chantier",
  sous_traitance: "Sous-traitance", frais: "Frais indirects et autres frais",
};
export const PRICING = { unitaire: "Prix unitaire", forfait: "Forfait", horaire: "Horaire", journalier: "Journalier", duree: "Lié à une durée" };
export const DECISION_TAGS = { acces: "Accès / échafaudage", transport: "Transport", protection: "Protections", nettoyage: "Nettoyage / déchets", outillage: "Outillage" };

const D = "2026-09-28";
const mk = (ref, label, cat, unit, pricing, price, extra = {}) => ({ id: ref, ref, label, cat, unit, pricing, price, cost: null, priceDate: price === null ? null : D, supplier: "", brand: "", yield: null, yieldUnit: "m²", tags: [], pack: "", ...extra });
const rent = (o = {}) => ({ day: null, week: null, month: null, setup: null, teardown: null, setupPerM2: null, teardownPerM2: null, transport: null, minDays: null, setupIncluded: false, ...o });

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

// ---------- PACK ENDUITS (valeurs réelles du devis DEV-2026-09-001) ----------
const ENDUIT_SEEDS = [
  mk("END-FIXACOAT", "Fixacoat (25 kg)", "materiaux", "pot", "unitaire", 22000, { yield: 39, pack: "enduits" }),
  mk("END-HOMAY", "Homay enduit extérieur (25 kg)", "materiaux", "sac", "unitaire", 25000, { pack: "enduits" }),
  mk("END-P60", "Papier-vert P60", "consommables", "rouleau", "unitaire", 19500, { tags: ["abrasif"], pack: "enduits" }),
  mk("END-P100", "Papier-vert P100", "consommables", "rouleau", "unitaire", 19500, { tags: ["abrasif"], pack: "enduits" }),
  mk("END-P120", "Papier-vert P120", "consommables", "rouleau", "unitaire", 19500, { tags: ["abrasif"], pack: "enduits" }),
  mk("END-P220", "Papier abrasif P220", "consommables", "paquet", "unitaire", 13000, { tags: ["abrasif"], pack: "enduits" }),
  mk("END-CIMENT", "Ciment ordinaire 32,5", "materiaux", "sac", "unitaire", 4500, { pack: "enduits" }),
  mk("END-ADDITIF", "Additif de mélange (sachet 5 kg)", "materiaux", "sachet", "unitaire", 3500, { pack: "enduits", packKg: 5 }),
  mk("END-MULTIPRIM", "Multiprim anti-alcali (25 kg)", "materiaux", "pot", "unitaire", 65000, { yield: 250, tags: ["primaire"], pack: "enduits" }),
  mk("MO-ENDUIT", "Application d'enduit (par couche)", "main_oeuvre", "m²", "unitaire", 400, { pack: "enduits" }),
  mk("MO-PONCAGE", "Ponçage (par passe)", "main_oeuvre", "m²", "unitaire", 100, { pack: "enduits" }),
  mk("MO-PRIMAIRE", "Application du primaire anti-alcali", "main_oeuvre", "m²", "unitaire", 150, { pack: "enduits" }),
  mk("TRA-CHANTIER-ENDUIT", "Transport et logistique de chantier (enduits)", "transport", "forfait", "forfait", 180000, { tags: ["transport"], pack: "enduits" }),
];

const need = (v, what) => (v > 0 ? {} : { unknown: what + " à renseigner" });
const hasN = (v) => typeof v === "number" && isFinite(v);

const enduits = {
  id: "enduits", label: "Enduits et ponçage", version: "1.0",
  seeds: ENDUIT_SEEDS,
  expects: [
    { tag: "abrasif", label: "Consommables de ponçage", severity: "verifier", hint: "Les passes de ponçage consomment des abrasifs." },
  ],
  prestations: [{
    id: "systeme3", label: "Enduit 3 couches + ponçage",
    params: [
      { key: "primer", label: "Primaire anti-alcali", type: "select", options: [["non", "Non prévu"], ["option", "En option"], ["inclus", "Inclus"]], def: "option" },
      { key: "additifKg", label: "Additif par sac de Homay (kg)", type: "number", def: 10 },
      { key: "abr60", label: "Papier-vert P60 (rouleaux)", type: "number", def: null },
      { key: "abr100", label: "Papier-vert P100 (rouleaux)", type: "number", def: null },
      { key: "abr120", label: "Papier-vert P120 (rouleaux)", type: "number", def: null },
      { key: "abr220", label: "Papier abrasif P220 (paquets)", type: "number", def: null },
      { key: "transport", label: "Forfait transport et logistique", type: "select", options: [["oui", "Oui"], ["non", "Non"]], def: "oui" },
    ],
    build(p) {
      const A = "A. Fournitures d'enduit", B = "B. Consommables de ponçage et d'égrenage", C = "C. Ciment ordinaire 32,5 (mortier de pose — Fixacoat)", Dg = "D. Additif de mélange (Homay)";
      const M = "Main-d'œuvre d'application";
      const opt = p.primer === "option", inc = p.primer === "inclus";
      const kg = hasN(p.additifKg) ? p.additifKg : 10;
      const L = [
        { key: "fix", itemId: "END-FIXACOAT", group: A, role: "1re couche — dressage et fixation du support brut", mode: "yield" },
        { key: "hom2", itemId: "END-HOMAY", group: A, role: "2e couche — ratissage, reprise des irrégularités", mode: "yield", yield: 50 },
        { key: "hom3", itemId: "END-HOMAY", group: A, role: "3e couche — lissage de finition (demi-dose)", mode: "yield", yield: 100 },
        { key: "p60", itemId: "END-P60", group: B, role: "Égrenage du support brut avant la 1re couche", mode: "fixed", qty: p.abr60 ?? undefined, ...(hasN(p.abr60) ? {} : { unknown: "Quantité à saisir" }) },
        { key: "p100", itemId: "END-P100", group: B, role: "Ponçage de la 1re couche (Fixacoat)", mode: "fixed", qty: p.abr100 ?? undefined, ...(hasN(p.abr100) ? {} : { unknown: "Quantité à saisir" }) },
        { key: "p120", itemId: "END-P120", group: B, role: "Ponçage de la 2e couche (Homay)", mode: "fixed", qty: p.abr120 ?? undefined, ...(hasN(p.abr120) ? {} : { unknown: "Quantité à saisir" }) },
        { key: "p220", itemId: "END-P220", group: B, role: "Ponçage fin de la 3e couche (finition)", mode: "fixed", qty: p.abr220 ?? undefined, ...(hasN(p.abr220) ? {} : { unknown: "Quantité à saisir" }) },
        { key: "cim", itemId: "END-CIMENT", group: C, role: "1 sac par pot de Fixacoat posé", mode: "ratio", of: "fix", factor: 1 },
        { key: "add2", itemId: "END-ADDITIF", group: Dg, role: `Mélange Homay 2e couche (${kg} kg/sac)`, mode: "ratio", of: "hom2", factor: kg / 5 },
        { key: "add3", itemId: "END-ADDITIF", group: Dg, role: `Mélange Homay 3e couche (${kg} kg/sac)`, mode: "ratio", of: "hom3", factor: kg / 5 },
        { key: "l1", itemId: "MO-ENDUIT", group: M, label: "Enduit non repassé (1re couche)", mode: "area", noLoss: true },
        { key: "l2", itemId: "MO-PONCAGE", group: M, label: "Ponçage — passe 1/3 (après la 1re couche)", mode: "area", noLoss: true },
        { key: "l3", itemId: "MO-ENDUIT", group: M, label: "Enduit intermédiaire (2e couche)", mode: "area", noLoss: true },
        { key: "l4", itemId: "MO-PONCAGE", group: M, label: "Ponçage — passe 2/3 (après la 2e couche)", mode: "area", noLoss: true },
        { key: "l5", itemId: "MO-ENDUIT", group: M, label: "Enduit de finition (3e couche)", mode: "area", noLoss: true },
        { key: "l6", itemId: "MO-PONCAGE", group: M, label: "Ponçage — passe 3/3 (après la 3e couche)", mode: "area", noLoss: true },
      ];
      if (p.transport !== "non") L.push({ key: "tr", itemId: "TRA-CHANTIER-ENDUIT", group: "Transport et logistique", mode: "flat", qty: 1 });
      if (opt || inc) {
        const G = "Option — Primaire anti-alcali";
        L.push({ key: "mp", itemId: "END-MULTIPRIM", group: G, role: "Impression du support, appliquée avant la 1re couche", mode: "yield", option: opt });
        L.push({ key: "lp", itemId: "MO-PRIMAIRE", group: G, label: "Application du primaire anti-alcali", mode: "area", noLoss: true, option: opt });
      }
      return L;
    },
  }],
};

// ---------- Autres packs : formules uniquement, prix et rendements vides ----------
const peinture = {
  id: "peinture", label: "Peinture", version: "1.0",
  seeds: [
    mk("PEI-SOUS-COUCHE", "Sous-couche / impression", "materiaux", "seau", "unitaire", null, { pack: "peinture", tags: [] }),
    mk("PEI-FINITION", "Peinture de finition", "materiaux", "seau", "unitaire", null, { pack: "peinture" }),
    mk("PEI-RUBAN", "Ruban de masquage", "consommables", "rouleau", "unitaire", null, { tags: ["protection"], pack: "peinture" }),
    mk("MO-PEINTURE", "Application de peinture (par couche)", "main_oeuvre", "m²", "unitaire", null, { pack: "peinture" }),
    mk("MO-PREPARATION", "Préparation du support", "main_oeuvre", "m²", "unitaire", null, { pack: "peinture" }),
  ],
  expects: [{ tag: "preparation", label: "Préparation du support", severity: "verifier", hint: "Ajouter la préparation ou indiquer « sans objet »." }],
  prestations: [{
    id: "murs", label: "Peinture murs / façade",
    params: [
      { key: "couches", label: "Nombre de couches de finition", type: "number", def: null },
      { key: "sousCouche", label: "Sous-couche", type: "select", options: [["oui", "Oui"], ["non", "Non"]], def: "oui" },
      { key: "preparation", label: "Préparation du support (main-d'œuvre)", type: "select", options: [["oui", "Oui"], ["non", "Non"]], def: "oui" },
    ],
    build(p) {
      const c = p.couches; const U = need(c, "Nombre de couches"); const m = c > 0 ? { mult: c } : U;
      const L = [];
      if (p.sousCouche !== "non") L.push({ key: "sc", itemId: "PEI-SOUS-COUCHE", group: "Fournitures de peinture", role: "Sous-couche", mode: "yield" });
      L.push({ key: "pf", itemId: "PEI-FINITION", group: "Fournitures de peinture", role: "Peinture de finition", mode: "yield", ...m });
      if (p.preparation !== "non") L.push({ key: "prep", itemId: "MO-PREPARATION", group: "Main-d'œuvre", label: "Préparation du support", mode: "area", noLoss: true, tag: "preparation" });
      L.push({ key: "mo", itemId: "MO-PEINTURE", group: "Main-d'œuvre", label: "Application de peinture (par couche)", mode: "area", noLoss: true, ...m });
      return L;
    },
  }],
};
// La préparation est reconnue via la balise « preparation » portée par la ligne ; on l'expose comme tag d'article.
peinture.seeds.find((s) => s.ref === "MO-PREPARATION").tags = ["preparation"];

const carrelage = {
  id: "carrelage", label: "Carrelage", version: "1.0",
  seeds: [
    mk("CAR-CARREAU", "Carreaux", "materiaux", "boîte", "unitaire", null, { pack: "carrelage" }),
    mk("CAR-COLLE", "Colle carrelage (sac)", "materiaux", "sac", "unitaire", null, { pack: "carrelage" }),
    mk("CAR-JOINT", "Joint de carrelage (sac)", "materiaux", "sac", "unitaire", null, { pack: "carrelage" }),
    mk("MO-CARRELAGE", "Pose de carrelage", "main_oeuvre", "m²", "unitaire", null, { pack: "carrelage" }),
  ],
  expects: [],
  prestations: [{
    id: "pose", label: "Pose de carrelage",
    params: [
      { key: "boxM2", label: "Surface couverte par boîte (m²)", type: "number", def: null },
      { key: "pertePct", label: "Pertes de coupe carrelage (%)", type: "number", def: null },
    ],
    build(p) {
      const lossOk = hasN(p.pertePct);
      return [
        { key: "car", itemId: "CAR-CARREAU", group: "Fournitures", role: "Carreaux (surface + pertes, arrondi à la boîte)", mode: "yield", yield: p.boxM2, ...(lossOk ? { lossPct: p.pertePct } : {}), ...(p.boxM2 > 0 ? {} : { unknown: "Surface par boîte à renseigner" }), ...(lossOk ? {} : { unknown: "Pertes de coupe à renseigner" }) },
        { key: "col", itemId: "CAR-COLLE", group: "Fournitures", role: "Colle", mode: "yield" },
        { key: "jt", itemId: "CAR-JOINT", group: "Fournitures", role: "Joint", mode: "yield" },
        { key: "mo", itemId: "MO-CARRELAGE", group: "Main-d'œuvre", label: "Pose de carrelage", mode: "area", noLoss: true },
      ];
    },
  }],
};

const maconnerie = {
  id: "maconnerie", label: "Maçonnerie", version: "1.0",
  seeds: [
    mk("MAC-BLOC", "Bloc (parpaing)", "materiaux", "bloc", "unitaire", null, { pack: "maconnerie" }),
    mk("MAC-MORTIER", "Mortier / ciment de pose", "materiaux", "sac", "unitaire", null, { pack: "maconnerie" }),
    mk("MO-MACONNERIE", "Élévation de mur", "main_oeuvre", "m²", "unitaire", null, { pack: "maconnerie" }),
  ],
  expects: [],
  prestations: [{
    id: "mur", label: "Mur en blocs",
    params: [{ key: "blocsM2", label: "Nombre de blocs par m² de mur", type: "number", def: null }],
    build(p) {
      return [
        { key: "bl", itemId: "MAC-BLOC", group: "Fournitures", role: "Blocs (surface + pertes)", mode: "factor", factor: p.blocsM2, ...(p.blocsM2 > 0 ? {} : { unknown: "Nombre de blocs par m² à renseigner" }) },
        { key: "mo", itemId: "MAC-MORTIER", group: "Fournitures", role: "Mortier", mode: "yield" },
        { key: "mo2", itemId: "MO-MACONNERIE", group: "Main-d'œuvre", label: "Élévation de mur", mode: "area", noLoss: true },
      ];
    },
  }],
};

const plomberie = {
  id: "plomberie", label: "Plomberie", version: "1.0",
  seeds: [
    mk("PLO-TUYAU", "Tuyauterie", "materiaux", "ml", "unitaire", null, { pack: "plomberie" }),
    mk("PLO-RACCORD", "Raccords et accessoires", "materiaux", "pièce", "unitaire", null, { pack: "plomberie" }),
    mk("MO-PLOMBERIE", "Pose par point d'eau", "main_oeuvre", "point", "unitaire", null, { pack: "plomberie" }),
  ],
  expects: [],
  prestations: [{
    id: "points", label: "Points d'eau",
    params: [
      { key: "points", label: "Nombre de points d'eau", type: "number", def: null },
      { key: "mlPoint", label: "Mètres de tuyau par point", type: "number", def: null },
      { key: "raccPoint", label: "Raccords par point", type: "number", def: null },
    ],
    build(p) {
      const pts = p.points;
      const bad = pts > 0 ? {} : { unknown: "Nombre de points à renseigner" };
      return [
        { key: "tu", itemId: "PLO-TUYAU", group: "Fournitures", role: "Tuyauterie", mode: "factor", baseQty: pts, factor: p.mlPoint, ...(p.mlPoint > 0 ? bad : { unknown: "Mètres par point à renseigner" }) },
        { key: "ra", itemId: "PLO-RACCORD", group: "Fournitures", role: "Raccords", mode: "factor", baseQty: pts, factor: p.raccPoint, ...(p.raccPoint > 0 ? bad : { unknown: "Raccords par point à renseigner" }) },
        { key: "mo", itemId: "MO-PLOMBERIE", group: "Main-d'œuvre", label: "Pose par point d'eau", mode: "flat", qty: pts, ...bad },
      ];
    },
  }],
};

const electricite = {
  id: "electricite", label: "Électricité", version: "1.0",
  seeds: [
    mk("ELE-CABLE", "Câble (rouleau)", "materiaux", "rouleau", "unitaire", null, { pack: "electricite", yieldUnit: "ml" }),
    mk("ELE-POINT", "Appareillage par point", "materiaux", "point", "unitaire", null, { pack: "electricite" }),
    mk("MO-ELECTRICITE", "Pose par point", "main_oeuvre", "point", "unitaire", null, { pack: "electricite" }),
  ],
  expects: [],
  prestations: [{
    id: "circuits", label: "Circuits électriques",
    params: [
      { key: "longueur", label: "Longueur totale des circuits (ml)", type: "number", def: null },
      { key: "coef", label: "Coefficient technique de longueur", type: "number", def: null },
      { key: "points", label: "Nombre de points", type: "number", def: null },
    ],
    build(p) {
      const okL = p.longueur > 0 && p.coef > 0;
      return [
        { key: "ca", itemId: "ELE-CABLE", group: "Fournitures", role: "Câble (longueur × coefficient technique, + pertes)", mode: "yield", baseQty: okL ? p.longueur * p.coef : undefined, ...(okL ? {} : { unknown: "Longueur et coefficient à renseigner" }) },
        { key: "pt", itemId: "ELE-POINT", group: "Fournitures", role: "Appareillage", mode: "fixed", qty: p.points, ...(p.points > 0 ? {} : { unknown: "Nombre de points à renseigner" }) },
        { key: "mo", itemId: "MO-ELECTRICITE", group: "Main-d'œuvre", label: "Pose par point", mode: "flat", qty: p.points, ...(p.points > 0 ? {} : { unknown: "Nombre de points à renseigner" }) },
      ];
    },
  }],
};

export const PACKS = { enduits, peinture, carrelage, maconnerie, plomberie, electricite };
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
    for (const b of pres.build(inst.params || {}, { surface: q.site.surface })) {
      const id = `${inst.id}.${b.key}`;
      const line = { ...b, id, ...(b.of ? { of: `${inst.id}.${b.of}` } : {}) };
      const adj = (q.adjust || {})[id]; if (adj) Object.assign(line, adj);
      if (line.skip) continue;
      out.push(line);
    }
  }
  for (const m of q.manual || []) { const adj = (q.adjust || {})[m.id]; const line = { ...m, ...(adj || {}) }; if (!line.skip) out.push(line); }
  return out;
}
export function itemsMap(catalogue) { return Object.fromEntries(catalogue.map((i) => [i.id, i])); }
export const validPct = (a) => Array.isArray(a) && a.length > 0 && a.every((x) => typeof x === "number" && isFinite(x) && x >= 0) && Math.abs(a.reduce((x, y) => x + y, 0) - 100) < 1e-9;
export function buildInput(q, catalogue, settings) {
  const pay = q.terms.payment || {};
  return {
    surface: q.site.surface, lossPct: q.site.lossPct, lines: regen(q), items: itemsMap(catalogue),
    payment: { materials: validPct(pay.materials) ? pay.materials : [100], services: validPct(pay.services) ? pay.services : [100] }, vatPct: q.terms.vatPct, discount: q.discount, overhead: q.overhead, pricing: q.pricing,
    minMarginPct: settings.minMarginPct ?? null,
  };
}
export function compute(q, catalogue, settings) { return computeQuote(buildInput(q, catalogue, settings)); }
export function packExpects(q) {
  const seen = new Set(); const out = [];
  for (const inst of q.prestations || []) { const pack = PACKS[inst.packId]; if (pack && !seen.has(pack.id)) { seen.add(pack.id); out.push(...pack.expects); } }
  return out;
}

export function newDraft(settings, date) {
  const s = settings || {};
  return {
    ref: "", date, validityDays: s.validityDays ?? null,
    client: { id: "", name: "", type: "Particulier", contact: "" },
    site: { name: "", address: "", surface: null, levels: null, workHeightM: null, lossPct: s.lossPct ?? null, notes: "" },
    prestations: [], manual: [], adjust: {}, decisions: {},
    terms: { delayMin: null, delayMax: null, vatPct: s.vatPct ?? null,
      payment: { materials: s.payMaterials ? [...s.payMaterials] : [100], services: s.payServices ? [...s.payServices] : [100] },
      triggers: s.triggers ? [...s.triggers] : ["À la signature", "À l'avancement convenu", "À la réception du chantier"] },
    pricing: { method: "catalogue", markupPct: null }, discount: { pct: null, amount: null },
    overhead: { pct: s.overheadPct ?? 0, mode: s.overheadMode ?? "inclus" }, notes: "",
  };
}

// Devis de référence DEV-2026-09-001 (jeu de test et démonstration)
export function referenceDraft(settings) {
  const q = newDraft(settings, "2026-09-28");
  q.ref = "DEV-2026-09-001"; q.validityDays = 30;
  q.client.name = "";
  q.site = { name: "Immeuble R+5 — Douala", address: "Douala", surface: 4629, levels: 6, workHeightM: 18, lossPct: 5, notes: "Niveaux 1 à 5, terrasse et cage d'escalier — métrés du client." };
  q.prestations = [{ id: "p1", packId: "enduits", prestId: "systeme3", params: { primer: "option", additifKg: 10, abr60: 3, abr100: 4, abr120: 4, abr220: 20, transport: "oui" } }];
  q.terms = { delayMin: 90, delayMax: 120, vatPct: null, payment: { materials: [70, 30], services: [35, 40, 25] }, triggers: ["À la signature", "À 50 % d'avancement du chantier", "Chantier terminé, à la réception"] };
  q.decisions = { acces: "exclu", protection: "na", nettoyage: "inclus", outillage: "exclu" };
  return q;
}
