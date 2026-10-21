// Référentiels métier (électricité, plomberie, maçonnerie) : sous-ensembles, familles, recherche, fiche « avant de chiffrer ».
// Les données viennent des documents de référence de Patrick (elec-data.js, plo-data.js, mac-data.js) : noms, spécifications, unités, normes.
import * as E from "./elec-data.js";
import * as P from "./plo-data.js";
import * as M from "./mac-data.js";

const nz = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// Fiche « avant de chiffrer » : réponses imprimées sous l'objet du chantier. multi = plusieurs choix possibles.
const FICHE_ELEC = {
  fields: [
    { k: "projet", label: "Type de projet", opts: ["Bâtiment résidentiel", "Bâtiment tertiaire", "Chantier BTP", "Installation industrielle", "Cimenterie / mine", "Maintenance / dépannage"] },
    { k: "alim", label: "Alimentation électrique", opts: ["BT 230 V monophasé", "BT 400/230 V triphasé", "HTA / MT", "HT / THT", "Courant continu / photovoltaïque", "À déterminer par étude"] },
    { k: "env", label: "Environnement d'installation", opts: ["Intérieur standard", "Extérieur, humidité ou corrosion", "Poussières industrielles", "Température élevée ou vibrations", "Zone ATEX / poussières combustibles"] },
    { k: "objet", label: "Objet du devis", opts: ["Fourniture seule", "Fourniture et installation", "Installation, essais et mise en service", "Maintenance / pièces de rechange"] },
  ],
  warn: (f) => /HTA|HT \/ THT/.test(f.alim || "") || /ATEX/.test(f.env || ""),
  warnText: "Les installations HTA, les zones explosives (ATEX) et les systèmes de sécurité demandent une validation par un ingénieur habilité. Ne chiffre pas seul un dimensionnement : précise-le au client.",
};
const SENSIBLES = ["Protection incendie", "Gaz et combustibles", "Air comprimé", "Tuyauterie industrielle", "Réseaux de fluides chimiques", "Plomberie de cimenterie"];
const FICHE_PLO = {
  fields: [
    { k: "travaux", label: "Travaux concernés (touche ceux qui s'appliquent)", multi: true, opts: P.GUIDE.travaux },
    { k: "objet", label: "Fourniture seule ou avec pose", opts: ["Fourniture seule", "Fourniture et pose"] },
    { k: "pose", label: "Type d'installation", multi: true, opts: ["Installation apparente", "Installation encastrée", "Installation aérienne", "Installation enterrée"] },
    { k: "contraintes", label: "Contraintes du site", multi: true, opts: ["Environnement corrosif ou abrasif", "Présence de vibrations", "Risque de gel", "Risque de contamination"] },
  ],
  warn: (f) => (f.travaux || []).some((t) => SENSIBLES.includes(t)),
  warnText: "Pour les installations sous pression, le gaz, la protection incendie, les réseaux chimiques et les procédés industriels, une validation par un professionnel compétent est nécessaire. Précise-le au client.",
};
const STRUCT = ["Fondations", "Béton armé", "Dallages", "Linteaux et chaînages", "Réhabilitation"];
const FICHE_MAC = {
  fields: [
    { k: "projet", label: "Type d'ouvrage", opts: ["Bâtiment résidentiel", "Immeuble", "Bâtiment commercial", "Bâtiment industriel ou technique", "Clôture ou ouvrage extérieur", "Réhabilitation"] },
    { k: "travaux", label: "Lots concernés (touche ceux qui s'appliquent)", multi: true, opts: M.GUIDE.travaux },
    { k: "objet", label: "Ce que le prix comprend", opts: ["Fourniture et mise en œuvre", "Mise en œuvre seule (matériaux fournis par le client)", "Fourniture seule"] },
    { k: "plans", label: "Documents sur lesquels le devis s'appuie", multi: true, opts: M.GUIDE.plans },
    { k: "beton", label: "Béton", opts: M.GUIDE.beton },
    { k: "contraintes", label: "Contraintes du chantier", multi: true, opts: ["Travail en hauteur", "Fouilles profondes", "Site occupé", "Circulation d'engins", "Contraintes horaires", "Accès difficile pour les camions", "Présence d'eau ou risque d'inondation"] },
  ],
  warn: (f) => (f.travaux || []).some((t) => STRUCT.includes(t)) || /industriel/.test(f.projet || ""),
  warnText: "Fondations, béton armé, dallages, linteaux, chaînages, réhabilitation, ouvrages industriels : les dimensions et les armatures viennent des plans et des études validés par les professionnels compétents. Sans ces documents, ton chiffre n'est qu'une estimation : écris-le au client.",
};
export const FICHE_KEYS = ["projet", "alim", "env", "objet", "travaux", "plans", "beton", "pose", "contraintes"];

const CFG = {
  electricite: { d: E, controles: ["19"], outils: [], units: ["Pièce", "Mètre", "Ensemble", "Lot", "Kit", "Rouleau", "Paire", "Point", "Forfait"], fiche: FICHE_ELEC, guide: null,
    ph: { desc: "Installation électrique d'une villa R+1", role: "Ex. : éclairage du salon", search: "Ex. : disjoncteur, câble, parafoudre", brand: "Ex. : Legrand, Schneider" } },
  plomberie: { d: P, controles: ["36"], outils: ["33"], units: ["pièce", "mètre", "ensemble", "kit", "lot", "rouleau", "litre", "m²", "forfait"], fiche: FICHE_PLO, guide: P.GUIDE,
    ph: { desc: "Plomberie sanitaire d'une villa R+1", role: "Ex. : alimentation de la salle de bains", search: "Ex. : tube PER, siphon, vanne", brand: "Ex. : marque ou référence du fabricant" } },
  // Maçonnerie : le document n'est pas un catalogue de matériel. Les matériaux vont dans « Produits », les ouvrages du bordereau (partie 18) dans « Ouvrages et main-d'œuvre ».
  maconnerie: { d: M, controles: M.AUTRES, outils: M.OUTILS, ouvrages: M.OUVRAGES, units: ["sac", "tonne", "kg", "m³", "m²", "ml", "unité", "litre", "forfait"], fiche: FICHE_MAC, guide: M.GUIDE, specLabel: "À vérifier",
    labels: { ouvriers: ["Ouvrages et main-d'œuvre", "Ajouter un ouvrage ou de la main-d'œuvre", "Ouvrages"], autres: ["Contrôles, sécurité et frais", "Ajouter un contrôle, une protection ou un frais", "Contrôles et frais"] },
    ph: { desc: "Maçonnerie d'une villa R+1", role: "Ex. : murs extérieurs du rez-de-chaussée", search: "Ex. : ciment, bloc, acier, linteau", brand: "Ex. : marque, classe, dimensions" }, calc: true },
};
export const hasRef = (m) => !!CFG[m];

/** Unités proposées pour une fiche : « mètre ou barre » → mètre, barre (même casse que la première). */
export const unitsOf = (u) => { const a = String(u || "").split(/ ou /).map((x) => x.trim()).filter(Boolean); const up = /^[A-ZÀ-Ý]/.test(a[0] || ""); return a.map((x, i) => (i ? (up ? x.charAt(0).toUpperCase() + x.slice(1) : x.charAt(0).toLowerCase() + x.slice(1)) : x)); };
/** Norme imprimable : seulement une vraie référence (IEC, EN, ISO, NF…), jamais une phrase de réserve. */
export function printableNorm(n) {
  const s = String(n || "").trim();
  return /\b(IEC|EN|ISO|NF|OIML|CEI)\s?[0-9A-Z]/.test(s) && !/non applicable|à vérifier|applicable$/i.test(s) && s.length <= 90 ? s.replace(/\s*;\s*/g, " ; ") : "";
}

const CACHE = {};
export function refOf(met) {
  const cfg = CFG[met]; if (!cfg) return null;
  if (CACHE[met]) return CACHE[met];
  const d = cfg.d, all = [];
  const tabOf = (f) => (cfg.controles.includes(f) ? "autres" : cfg.outils.includes(f) ? "outils" : (cfg.ouvrages || []).includes(f) ? "ouvriers" : "produits");
  for (const [f, name, spec, unit, norm] of d.REF) all.push({ fam: f, famLabel: d.FAM[f] || f, name, spec, unit, norm, tab: tabOf(f) });
  const seen = new Set(all.map((r) => nz(r.name)));
  for (const [fam, items] of d.ACC) for (const it of items) {
    let name = it; if (seen.has(nz(name))) name = `${it} (${fam.toLowerCase()})`; seen.add(nz(name));
    all.push({ fam: "A:" + fam, famLabel: fam, name, spec: "", unit: "", norm: "", tab: "produits", acc: true });
  }
  const byName = new Map(all.map((r) => [nz(r.name), r]));
  const domOf = new Map(); d.DOMAINES.forEach(([id, , , fams]) => fams.forEach((f) => domOf.set(f, id)));
  const dom = (r) => (r.acc ? "acc" : domOf.get(r.fam) || "");
  const out = {
    met, domaines: d.DOMAINES, count: all.length, fiche: cfg.fiche, guide: cfg.guide, units: cfg.units, specLabel: cfg.specLabel || "À préciser", labels: cfg.labels || {}, calc: !!cfg.calc, ph: cfg.ph || null,
    find: (name) => byName.get(nz(name)) || null,
    famLabel: (f) => (f.startsWith("A:") ? "Accessoires — " + f.slice(2) : d.FAM[f] || f),
    note: (f) => d.FAM_NOTE[f] || "",
    firstDomain: d.DOMAINES[0][0],
    /** Fiches visibles : onglet, sous-ensemble choisi, recherche libre (alors tous les sous-ensembles, 40 au plus). */
    rows(tab, dm, query) {
      const q = nz(query);
      if (tab !== "produits") return all.filter((r) => r.tab === tab && (!q || nz(r.name).includes(q)));
      if (q) return all.filter((r) => r.tab === "produits" && (nz(r.name).includes(q) || nz(r.spec).includes(q))).slice(0, 40);
      return all.filter((r) => r.tab === "produits" && dom(r) === (d.DOMAINES.some((x) => x[0] === dm) ? dm : d.DOMAINES[0][0]));
    },
    domainOf: dom,
  };
  return (CACHE[met] = out);
}
