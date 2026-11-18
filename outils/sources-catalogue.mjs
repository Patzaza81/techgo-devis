// Tableau des produits ajoutés et de leurs sources, tiré directement de metiers/complements.js (pas recopié à la main).
import { AJOUTS, SOURCES } from "../metiers/complements.js";
const M = { maconnerie: "Maçonnerie", electricite: "Électricité", carrelage: "Carrelage", peinture: "Peinture" };
const tous = Object.entries(AJOUTS).flatMap(([m, l]) => l.map((a) => ({ m, ...a })));
const out = ["# Sources du catalogue — vérification du 18/11/2026\n",
  `${tous.length} produits ajoutés : **${tous.filter((a) => a.statut === "vérifié").length} vérifiés**, **${tous.filter((a) => a.statut !== "vérifié").length} à confirmer**.`,
  "« Vérifié » = une source camerounaise, ouverte avec succès, montre le produit et sa façon d'être vendu (pour un appareil : à l'unité). Pour les deux devis publiés sur Scribd, le détail a été lu dans l'extrait du document indexé par le moteur de recherche ; la page Scribd elle-même ne l'affiche qu'après ouverture du document. Tout le reste est « à confirmer », et la fiche du produit l'affiche à l'artisan.\n",
  "## Produits\n", "| Métier | Produit | Unités proposées | Statut | Ce qui est démontré / ce qui manque | Sources |", "|---|---|---|---|---|---|",
  ...tous.map((a) => `| ${M[a.m]} | ${a.nom} | ${a.unites.join(", ")} | ${a.statut === "vérifié" ? "**vérifié**" : "à confirmer"} | ${a.note} | ${a.src.length ? a.src.join(", ") : "aucune retrouvée"} |`),
  "\n## Sources\n", "| Clé | Source | Pays | Ce qu'elle démontre réellement | Lien ouvert lors de la vérification |", "|---|---|---|---|---|",
  ...Object.entries(SOURCES).map(([k, s]) => `| ${k} | [${s.titre}](${s.lien}) | ${s.pays} | ${s.montre}${s.note ? " (" + s.note + ")" : ""} | ${s.lien_ok ? "oui" : "**non** : le site refuse la lecture automatique, à ouvrir à la main"} |`),
  "\n## Corrections faites",
  "- Retirées car introuvables : appel d'offres de Messamena (chevrons), « Vitrine du Cameroun » (latte), « Forum Construire » (poutrelles), « Brico Dépôt » (ragréage). Les 3 produits concernés restent, **à confirmer**.",
  "- Corrigée : la thèse sur la chaux et la latérite est celle d'A. Ngo'o Ze, Université de Yaoundé I (2020), pas « ENSET Ebolowa ». Elle ne montre aucune unité de vente.",
  "- Retirée comme preuve : le catalogue Chausson ne montre ni natte d'étanchéité ni silicone sanitaire.",
  "- Retirée comme preuve : le catalogue Tollens (hydrofuge de façade) ne prouve pas l'hydrofuge de masse (produit différent).",
  "- Unités corrigées d'après les sources : pointes au **paquet** ou au carton (plus « kg ») ; film polyane au **rouleau** (plus « m ») ; peinture antirouille d'abord au **kg** (1, 5, 30 kg) ; latérite d'abord au **camion**.",
];
console.log(out.join("\n"));
