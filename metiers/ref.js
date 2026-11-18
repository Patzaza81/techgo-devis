// Référentiels métier (électricité, plomberie, maçonnerie) : sous-ensembles, familles, recherche, fiche « avant de chiffrer ».
// Les données viennent des documents de référence de Patrick (elec-data.js, plo-data.js, mac-data.js) : noms, spécifications, unités, normes.
import * as E from "./elec-data.js";
import * as P from "./plo-data.js";
import * as M from "./mac-data.js";
import { nomClair } from "./noms-clairs.js";
import { AJOUTS, UNITES_FAMILLE, UNITES_NOM, unitesAccessoire } from "./complements.js";

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

// Recherche : chaque mot tapé doit se retrouver (dans le nom, la précision ou la famille), dans n'importe quel ordre ;
// tirets, points et barres ignorés (« PPR » trouve « PP-R ») ; quelques mots du chantier renvoient au terme du référentiel.
// Ces équivalences ne créent aucun produit : elles orientent seulement vers les fiches qui existent déjà.
const VIDES = new Set(["de", "du", "des", "la", "le", "les", "l", "d", "a", "au", "aux", "en", "et", "pour", "un", "une"]);
const EQUIV = { agglo: ["parpaing", "bloc"], agglos: ["parpaing", "bloc"], agglomere: ["parpaing", "bloc"], ampoule: ["ampoule", "lampe", "led"], spot: ["spot", "downlight"], teflon: ["ptfe"], fer: ["fer", "acier", "armature"], tuyau: ["tuyau", "tube"], tuyaux: ["tuyau", "tube"], solaire: ["solaire", "photovolta"], panneau: ["panneau", "module"], fil: ["fil", "conducteur"], glycero: ["glycero", "huile"], facade: ["facade", "exterieure"], white: ["white", "diluant"], wago: ["wago", "borne"], polytank: ["polytank", "cuve", "citerne", "reservoir"], recuit: ["recuit", "attache"], faience: ["faience", "carreaux"], cale: ["cale", "croisillons"], stabilisateur: ["stabilisateur", "regulateur"], plastique: ["plastique", "polyane", "film"], spirit: ["spirit", "diluant"], surpresseur: ["surpresseur", "surpression"] };
const plat = (s) => nz(s).replace(/[-_./'’]/g, "");
export function chercher(liste, query) {
  const mots = nz(query).replace(/[-_./'’]/g, "").split(/\s+/).filter((m) => m && !VIDES.has(m));
  if (!mots.length) return [];
  const res = [];
  for (const r of liste) {
    // un mot tapé doit être le DÉBUT d'un mot de la fiche (« sable » ne trouve pas « réutilisable »)
    // le nom deux fois : « Sous-couche » se trouve en tapant « souscouche » comme « sous couche »
    const nom = " " + plat(r.name + " " + (r.nomRef || "")).replace(/[()\[\],;:]/g, " ") + " " + nz(r.name).replace(/[-_./'’()\[\],;:]/g, " "), tout = nom + " " + plat(r.spec + " " + r.famLabel).replace(/[()\[\],;:]/g, " ");
    let score = 0, ok = true;
    for (const m of mots) { const alt = (EQUIV[m] || [m]).map((a) => " " + a); const debut = alt.some((a) => nom.startsWith(a)) ? 1 : 0, litteral = (nom + " ").includes(" " + m + " ") ? 2 : 0; if (alt.some((a) => (nom + " ").includes(a + " "))) score += 4 + debut + litteral; else if (debut) score += 3; else if (alt.some((a) => nom.includes(a))) score += 2; else if (alt.some((a) => tout.includes(a))) score += 1; else { ok = false; break; } }
    if (ok) { const pos = nom.indexOf(" " + ((EQUIV[mots[0]] || [mots[0]])[0])); res.push([score, r, pos < 0 ? 999 : pos]); }
  }
  // « PPR 25 » : le diamètre n'est pas dans les fiches ; on montre les fiches qui ont les mots, sans le nombre.
  if (!res.length && mots.some((m) => /^\d/.test(m)) && mots.some((m) => !/^\d/.test(m))) return chercher(liste, mots.filter((m) => !/^\d/.test(m)).join(" "));
  // à score égal : le mot cherché le plus tôt dans le nom (« Tube PER » avant « Tube multicouche PER-alu-PER »)
  // puis l'ordre des sous-ensembles (« Logement et bâtiment » d'abord), quand la fiche en porte un
  return res.sort((a, b) => b[0] - a[0] || a[2] - b[2] || (a[1].rang ?? 99) - (b[1].rang ?? 99)).map((x) => x[1]);
}
const CACHE = {};
// Sous-ensembles d'usine : visibles pour le profil entreprise, ou sur demande ; cachés par défaut pour l'artisan du logement.
const INDUS = { electricite: ["ind", "spe"], plomberie: ["ind", "cim"] };
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
  // Compléments v41 (nom + unités de vente, sources dans complements.js) rangés dans un sous-ensemble existant.
  for (const a of AJOUTS[met] || []) if (a.dom) all.push({ fam: "C:" + a.fam, famLabel: a.fam, name: a.nom, spec: "", unit: a.unites.join(" ou "), norm: "", tab: "produits", dom: a.dom, ajout: true, statut: a.statut, note: a.note });
  // Unités proposées quand le document n'en donne pas : par famille, ou par nom quand la famille mélange les ventes.
  for (const r of all) r.unites = r.unit ? unitsOf(r.unit) : UNITES_NOM[r.name] || (UNITES_FAMILLE[met] || {})[r.fam] || (String(r.fam).startsWith("A:") ? unitesAccessoire(r.name) : []);
  // Désignation en clair (le sigle reste entre parenthèses) ; l'ancien nom retrouve toujours la fiche (devis déjà enregistrés).
  for (const r of all) { const c = nomClair(r.name); if (c !== r.name) { r.nomRef = r.name; r.name = c; } }
  const byName = new Map(all.map((r) => [nz(r.name), r])); for (const r of all) if (r.nomRef) byName.set(nz(r.nomRef), r);
  const domOf = new Map(); d.DOMAINES.forEach(([id, , , fams]) => fams.forEach((f) => domOf.set(f, id)));
  const dom = (r) => (r.dom ? r.dom : r.acc ? "acc" : domOf.get(r.fam) || "");
  for (const r of all) r.rang = d.DOMAINES.findIndex((x) => x[0] === dom(r));
  const industriel = (r) => (INDUS[met] || []).includes(dom(r)) || /^A:(HTA|ATEX|Cimenterie|Moteurs|Automatisme|Instrumentation)$/.test(r.fam) || /industriel|réactifs/i.test(r.name);
  const out = {
    met, domaines: d.DOMAINES, count: all.length, fiche: cfg.fiche, guide: cfg.guide, units: cfg.units, specLabel: cfg.specLabel || "À préciser", labels: cfg.labels || {}, calc: !!cfg.calc, ph: cfg.ph || null,
    find: (name) => byName.get(nz(name)) || null,
    /** Nom tapé à la main : la fiche exacte, sinon la seule fiche dont le nom commence par ce mot complet
     *  (« Hourdis » → « Hourdis (entrevous) »). Plusieurs candidates ou aucune → null : on ne devine pas. */
    proche(name) {
      const k = nz(name); if (!k) return null; const ex = byName.get(k); if (ex) return ex;
      if (k.length < 3) return null;
      const c = all.filter((r) => { const n = nz(r.name); return n.startsWith(k) && /^[\s(,]/.test(n.slice(k.length)); });
      return c.length === 1 ? c[0] : null;
    },
    /** Unités à proposer pour un nom tapé : celles de la fiche (exacte ou proche) ; si plusieurs fiches
     *  commencent par ce nom et ont exactement les mêmes unités, ces unités ; sinon aucune proposition. */
    unitesPour(name) {
      const r = this.proche(name); if (r) return r.unites || [];
      const k = nz(name); if (k.length < 3) return [];
      const c = all.filter((x) => { const n = nz(x.name); return n.startsWith(k) && /^[\s(,]/.test(n.slice(k.length)); });
      const u = new Set(c.map((x) => (x.unites || []).join("|")));
      return c.length && u.size === 1 ? c[0].unites || [] : [];
    },
    famLabel: (f) => (f.startsWith("A:") ? "Accessoires — " + f.slice(2) : f.startsWith("C:") ? f.slice(2) : d.FAM[f] || f).replace(/ BT$/, " basse tension (BT)"),
    note: (f) => d.FAM_NOTE[f] || "",
    firstDomain: d.DOMAINES[0][0],
    /** Fiches visibles : onglet, sous-ensemble choisi, recherche libre (alors tous les sous-ensembles, 40 au plus). */
    rows(tab, dm, query, { indus = true } = {}) {
      const q = nz(query), garde = (r) => indus || !industriel(r);
      if (tab !== "produits") return all.filter((r) => r.tab === tab && (!q || nz(r.name).includes(q)));
      if (q) return chercher(all.filter((r) => r.tab === "produits" && garde(r)), query).slice(0, 40);
      return all.filter((r) => r.tab === "produits" && garde(r) && dom(r) === (d.DOMAINES.some((x) => x[0] === dm) ? dm : d.DOMAINES[0][0]));
    },
    /** Matériel d'usine (postes HTA, moteurs, ATEX, cimenteries…) : caché par défaut à l'artisan du logement. */
    estIndustriel: (r) => industriel(r),
    domainesLogement: d.DOMAINES.filter((x) => !(INDUS[met] || []).includes(x[0])),
    industrielsTrouves(query) { return nz(query) ? chercher(all.filter((r) => r.tab === "produits" && industriel(r)), query).length : 0; },
    domainOf: dom,
  };
  return (CACHE[met] = out);
}
