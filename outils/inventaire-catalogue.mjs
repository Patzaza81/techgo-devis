// Inventaire du catalogue tel que l'écran le propose (listes et référentiels), métier par métier.
// Rien n'est ajouté ni corrigé ici : on mesure (nombre, doublons, unités manquantes, sigles, noms longs) et on écrit un rapport.
// Usage : node outils/inventaire-catalogue.mjs > audit-v40/INVENTAIRE-CATALOGUE.md
import { LISTES } from "../metiers/listes.js";
import { refOf } from "../metiers/ref.js";
import { AJOUTS } from "../metiers/complements.js";
const nz = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const SIGLE = /\b[A-Z]{2,}[A-Z0-9-]*\b/; // ex. RCBO, LSZH, HTA, PE-RT
const METIERS = [["peinture", "Peinture"], ["carrelage", "Carrelage"], ["maconnerie", "Maçonnerie"], ["plomberie", "Plomberie"], ["electricite", "Électricité"]];
// Mots du chantier qu'un artisan tape réellement : la recherche les trouve-t-elle ? (aucune fiche n'est créée pour eux)
const MOTS = {
  maconnerie: ["ciment", "agglo", "parpaing", "brique", "sable", "gravier", "fer de 10", "treillis", "fil d'attache", "planche", "chevron", "hourdis", "poutrelle", "étanchéité"],
  plomberie: ["PPR", "PVC", "tuyau", "coude", "té", "manchon", "vanne", "robinet", "mélangeur", "WC", "lavabo", "évier", "douche", "siphon", "chauffe-eau", "compteur", "colle PVC", "téflon", "filasse", "pompe", "citerne", "regard"],
  electricite: ["câble", "fil", "disjoncteur", "différentiel", "prise", "interrupteur", "va-et-vient", "douille", "ampoule", "réglette", "spot", "tableau", "coffret", "gaine", "boîte", "piquet de terre", "ventilateur", "climatiseur", "onduleur", "panneau solaire"],
};
const out = [];
out.push("# Inventaire du catalogue — TechGo Devis (v41)\n");
out.push("Mesuré sur les données que l'écran affiche (listes à plat et référentiels). Aucun produit, prix ou caractéristique n'a été ajouté.\n");
for (const [k, nom] of METIERS) {
  const L = Object.fromEntries(Object.entries(LISTES[k] || {}).map(([t, a]) => [t, [...a, ...(AJOUTS[k] || []).filter((x) => x.liste === t).map((x) => x.nom)]])), rf = refOf(k);
  out.push(`## ${nom}\n`);
  if (!rf) {
    out.push(`Liste à plat (pas de recherche) : ${Object.entries(L).map(([t, a]) => `${t} ${a.length}`).join(", ")}.\n`);
    for (const [t, a] of Object.entries(L)) out.push(`- **${t}** : ${a.join(", ")}`);
    const tous = Object.values(L).flat().map(nz), dbl = tous.filter((x, i) => tous.indexOf(x) !== i);
    out.push(`\nDoublons de nom : ${dbl.length ? dbl.join(", ") : "aucun"}.\n`);
    continue;
  }
  const tabs = ["produits", "outils", "ouvriers", "autres"], all = [];
  for (const t of tabs) { const rows = t === "produits" ? rf.domaines.flatMap(([d]) => rf.rows("produits", d, "")) : rf.rows(t, null, ""); all.push(...rows.map((r) => ({ ...r, tab: t }))); }
  const uniq = new Map(all.map((r) => [nz(r.name) + "|" + r.tab, r])); const R = [...uniq.values()];
  const parNom = new Map(); for (const r of R) parNom.set(nz(r.name), (parNom.get(nz(r.name)) || 0) + 1);
  const dbl = [...parNom.entries()].filter(([, n]) => n > 1).map(([x]) => x);
  const sansUnite = R.filter((r) => !r.unit), sansProp = R.filter((r) => r.tab === "produits" && !(r.unites || []).length), sigles = R.filter((r) => SIGLE.test(r.name.replace(/\([^)]*\)/g, ""))), longs = R.filter((r) => r.name.length > 45);
  const suffixes = R.filter((r) => /\([^)]+\)$/.test(r.name) && r.acc);
  out.push(`Référentiel : ${R.length} fiches. Produits en ${rf.domaines.length} sous-ensembles : ${rf.domaines.map(([d, l]) => `${l} (${rf.rows("produits", d, "").length})`).join(" ; ")}.`);
  out.push(`Autres onglets : outils ${rf.rows("outils", null, "").length}, ouvrages/main-d'œuvre ${rf.rows("ouvriers", null, "").length}, divers ${rf.rows("autres", null, "").length}.\n`);
  out.push(`- Même nom dans deux onglets : ${dbl.length ? dbl.slice(0, 12).join(", ") : "aucun"}`);
  out.push(`- Accessoires renommés « (famille) » pour éviter un doublon : ${suffixes.length}${suffixes.length ? " — ex. " + suffixes.slice(0, 4).map((r) => r.name).join(" ; ") : ""}`);
  out.push(`- Fiches sans unité écrite dans le document source : ${sansUnite.length} sur ${R.length} ; fiches produits sans aucune unité proposée à l'écran : ${sansProp.length} sur ${R.filter((r) => r.tab === "produits").length}${sansProp.length ? " — ex. " + sansProp.slice(0, 8).map((r) => r.name).join(" ; ") : ""}`);
  out.push(`- Noms avec un sigle non expliqué (hors parenthèses) : ${sigles.length} — ex. ${sigles.slice(0, 10).map((r) => r.name).join(" ; ")}`);
  out.push(`- Noms de plus de 45 caractères : ${longs.length}${longs.length ? " — ex. " + longs.slice(0, 3).map((r) => r.name).join(" ; ") : ""}\n`);
  if (MOTS[k]) {
    out.push("| Mot tapé | Fiches trouvées | Premiers résultats |\n|---|---|---|");
    for (const m of MOTS[k]) { const x = rf.rows("produits", null, m); out.push(`| ${m} | ${x.length} | ${x.slice(0, 3).map((r) => r.name).join(" ; ") || "**aucune** — à ajouter à la main"} |`); }
    out.push("");
  }
}
console.log(out.join("\n"));
