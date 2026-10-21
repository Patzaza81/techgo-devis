// Accès au référentiel électricité : sous-ensembles, familles, recherche. Données dans elec-data.js.
import { ELEC_DOMAINES, ELEC_FAM, ELEC_REF, ELEC_ACC } from "./elec-data.js";
export { ELEC_DOMAINES, ELEC_FAM };

const nz = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const SECTION_CONTROLES = "19"; // contrôles, essais, mise en service : prestations chiffrées séparément du matériel

// Toutes les fiches : { fam, famLabel, name, spec, unit, norm, tab }
const ALL = (() => {
  const out = [];
  for (const [f, name, spec, unit, norm] of ELEC_REF) out.push({ fam: f, famLabel: ELEC_FAM[f] || f, name, spec, unit, norm, tab: f === SECTION_CONTROLES ? "autres" : "produits" });
  const seen = new Set(out.map((r) => nz(r.name)));
  for (const [fam, items] of ELEC_ACC) for (const it of items) {
    let name = it; if (seen.has(nz(name))) name = `${it} (${fam.toLowerCase()})`; seen.add(nz(name));
    out.push({ fam: "A:" + fam, famLabel: fam, name, spec: "", unit: "", norm: "", tab: "produits", acc: true });
  }
  return out;
})();
const BY_NAME = new Map(ALL.map((r) => [nz(r.name), r]));
const DOM_OF = new Map(); ELEC_DOMAINES.forEach(([id, , , fams]) => fams.forEach((f) => DOM_OF.set(f, id)));
export const domOf = (r) => (r.acc ? "acc" : DOM_OF.get(r.fam) || "");
export const elecFind = (name) => BY_NAME.get(nz(name)) || null;
export const elecCount = () => ALL.length;
/** Fiches visibles : onglet (produits | autres), sous-ensemble choisi, recherche libre (alors tous les sous-ensembles). */
export function elecRows(tab, dom, query) {
  const q = nz(query);
  if (tab === "autres") return ALL.filter((r) => r.tab === "autres" && (!q || nz(r.name).includes(q)));
  if (q) return ALL.filter((r) => r.tab === "produits" && (nz(r.name).includes(q) || nz(r.spec).includes(q))).slice(0, 40);
  return ALL.filter((r) => r.tab === "produits" && domOf(r) === dom);
}
/** Unités proposées pour une fiche : « Mètre ou rouleau » → Mètre, rouleau. */
export const unitsOf = (u) => String(u || "").split(/ ou /).map((x) => x.trim()).filter(Boolean).map((x, i) => (i ? x.charAt(0).toUpperCase() + x.slice(1) : x));
/** Norme imprimable : seulement une vraie référence (IEC, EN, ISO, NF, OIML…), jamais une phrase de réserve. */
export function printableNorm(n) {
  const s = String(n || "").trim();
  return /\b(IEC|EN|ISO|NF|OIML|CEI)\s?[0-9A-Z]/.test(s) && !/non applicable|à vérifier|applicable$/i.test(s) && s.length <= 90 ? s.replace(/\s*;\s*/g, " ; ") : "";
}
