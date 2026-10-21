// Listes de départ : NOMS seulement (aucun prix, aucune quantité, aucun rendement, aucune unité).
// Elles servent à toucher un nom au lieu de le taper. L'entreprise peut enrichir : tout produit saisi
// une fois est gardé dans « Produits » et réapparaît dans la liste.
export const LISTES = {
  peinture: {
    produits: ["Peinture acrylique", "Peinture à huile", "Peinture intérieure", "Peinture extérieure", "Sous-couche", "Multiprim", "Soytex", "Pancoat Hydro", "Stucco", "Mastic de pontage", "Enduit de rebouchage", "Enduit de lissage", "Diluant", "Colorants", "Ciment ordinaire", "Papier abrasif", "Bandes adhésives", "Rouleaux et pinceaux", "Flintkote", "Bâche de protection"],
    outils: ["Rouleau", "Pinceau", "Échafaudage", "Échelle", "Ponceuse", "Pistolet à peinture"],
    ouvriers: ["Peintre", "Aide-peintre", "Manœuvre"],
    autres: ["Transport du matériel", "Nettoyage de fin de chantier", "Évacuation des déchets"],
  },
  carrelage: {
    produits: ["Carreaux", "Colle à carrelage", "Joint de carrelage", "Plinthes", "Croisillons", "Ciment", "Sable"],
    outils: ["Coupe-carreaux", "Malaxeur", "Niveau", "Truelle crantée"],
    ouvriers: ["Carreleur", "Aide-carreleur", "Manœuvre"],
    autres: ["Transport du matériel", "Nettoyage de fin de chantier", "Évacuation des gravats"],
  },
  maconnerie: {
    produits: ["Ciment", "Sable", "Gravier", "Parpaings", "Fer à béton", "Fil d'attache", "Planches de coffrage", "Eau"],
    outils: ["Bétonnière", "Brouette", "Pelle", "Vibreur à béton", "Échafaudage"],
    ouvriers: ["Maçon", "Aide-maçon", "Ferrailleur", "Coffreur", "Manœuvre"],
    autres: ["Transport du matériel", "Location de camion", "Évacuation des gravats"],
  },
  plomberie: {
    produits: ["Tuyau PVC", "Tuyau PER", "Raccords", "Colle PVC", "Robinet", "Mitigeur", "WC", "Lavabo", "Siphon", "Ruban téflon"],
    outils: ["Clé à molette", "Scie à métaux", "Coupe-tube"],
    ouvriers: ["Plombier", "Aide-plombier", "Manœuvre"],
    autres: ["Transport du matériel", "Évacuation des déchets"],
  },
  electricite: {
    produits: ["Câble électrique", "Gaine", "Prise", "Interrupteur", "Disjoncteur", "Tableau électrique", "Boîte d'encastrement", "Luminaire"], // repli : la liste complète vient du référentiel (ref.js)
    outils: ["Pince à dénuder", "Perceuse", "Multimètre", "Pince ampèremétrique", "Mégohmmètre", "Mesureur de terre", "Testeur d'installation", "Caméra thermique"],
    ouvriers: ["Électricien", "Aide-électricien", "Manœuvre"],
    autres: ["Transport du matériel", "Évacuation des déchets"],
  },
};
export const METIERS = [["peinture", "Peinture"], ["carrelage", "Carrelage"], ["maconnerie", "Maçonnerie"], ["plomberie", "Plomberie"], ["electricite", "Électricité"]];

// Articles communs qui ne servent que dans certains métiers (par référence). Les autres articles communs
// (échafaudage, transport, protections, nettoyage…) restent visibles dans tous les métiers.
export const COMMUN_METIERS = { "OUT-BETONNIERE": ["maconnerie"] };
export const metierLabel = (k) => (METIERS.find(([x]) => x === k) || [, ""])[1];
/** Un article est visible dans le métier m : le sien, ou un article commun non réservé à d'autres métiers. */
export const visibleIn = (m, it) => !m || (it.pack ? it.pack === m : !COMMUN_METIERS[it.ref] || COMMUN_METIERS[it.ref].includes(m));
