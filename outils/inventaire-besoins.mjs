import { refOf, chercher } from "../metiers/ref.js";
import { LISTES } from "../metiers/listes.js";
import { AJOUTS } from "../metiers/complements.js";
const BES = {
  peinture: ["peinture acrylique", "peinture huile", "glycero", "sous couche", "enduit", "mastic", "diluant", "colorant", "abrasif", "bande", "bache", "vernis", "antirouille", "fixateur", "impression", "hydrofuge", "peinture sol", "anti moisissure", "crepi", "white spirit", "lasure", "peinture facade"],
  carrelage: ["carreau", "faience", "colle", "joint", "plinthe", "croisillon", "ciment", "sable", "primaire", "ragreage", "profile", "nez marche", "natte", "silicone", "seuil", "chaux", "cale"],
  maconnerie: ["ciment", "sable", "gravier", "agglo", "brique", "fer", "fil attache", "fil recuit", "pointe", "planche", "contreplaque", "chevron", "hourdis", "poutrelle", "etai", "treillis", "linteau", "polyane", "hydrofuge", "chaux", "laterite", "remblai", "buse", "regard", "dalle", "tole", "parpaing"],
  plomberie: ["tube pvc", "ppr", "per", "multicouche", "coude", "te", "manchon", "reduction", "vanne", "robinet", "melangeur", "siphon", "wc", "lavabo", "douche", "evier", "chauffe eau", "colle pvc", "teflon", "filasse", "collier", "flexible", "pompe", "surpresseur", "reservoir", "polytank", "compteur", "clapet", "regard", "fosse septique", "puisard", "receveur", "baignoire", "bonde", "abattant"],
  electricite: ["cable", "fil", "gaine", "boite", "interrupteur", "va et vient", "prise", "disjoncteur", "differentiel", "tableau", "coffret", "ampoule", "douille", "plafonnier", "reglette", "spot", "applique", "hublot", "piquet terre", "domino", "wago", "telerupteur", "minuterie", "detecteur", "sonnette", "ventilateur plafond", "brasseur", "climatiseur", "panneau solaire", "batterie", "onduleur", "regulateur", "stabilisateur", "parafoudre", "chemin cable", "goulotte", "projecteur", "compteur", "fusible", "contacteur", "prise tv", "prise rj45", "camera", "groupe electrogene", "inverseur"],
};
const NOMS = { peinture: "Peinture", carrelage: "Carrelage", maconnerie: "Maçonnerie", plomberie: "Plomberie", electricite: "Électricité" };
const ajoutes = new Set(Object.values(AJOUTS).flat().map((a) => a.nom));
console.log("# Inventaire des besoins courants (v41)\n\nPour chaque métier : les produits qu'un chantier de logement demande couramment, cherchés comme l'artisan les tape (recherche de l'application, matériel d'usine caché). « ajouté » = complément v41 sourcé (metiers/complements.js), « à confirmer ».\n");
for (const [met, mots] of Object.entries(BES)) {
  const rf = refOf(met);
  const plat = rf ? null : [...Object.values(LISTES[met] || {}).flat(), ...(AJOUTS[met] || []).map((a) => a.nom)].map((n) => ({ name: n, spec: "", famLabel: "" }));
  const lignes = mots.map((m) => { const r = rf ? rf.rows("produits", "", m, { indus: false }) : chercher(plat, m); const n = r[0] ? r[0].name : ""; return [m, n, !n ? "**absent**" : ajoutes.has(n) ? "ajouté v41" : "présent"]; });
  console.log(`## ${NOMS[met]} — ${lignes.filter((l) => l[1]).length}/${lignes.length} trouvés\n\n| Tapé | Premier résultat | État |\n|---|---|---|\n${lignes.map((l) => `| ${l[0]} | ${l[1] || "—"} | ${l[2]} |`).join("\n")}\n`);
}
