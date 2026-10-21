// Listes de départ : NOMS seulement (aucun prix, aucune quantité, aucun rendement, aucune unité).
// Elles servent à toucher un nom au lieu de le taper. L'entreprise peut enrichir : tout produit saisi
// une fois est gardé dans « Produits » et réapparaît dans la liste.
export const LISTES = {
  peinture: {
    produits: ["Peinture intérieure", "Peinture extérieure", "Sous-couche", "Enduit de rebouchage", "Enduit de lissage", "Papier de verre", "Bâche de protection", "Ruban de masquage"],
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
    produits: ["Câble électrique", "Gaine", "Prise", "Interrupteur", "Disjoncteur", "Tableau électrique", "Boîte d'encastrement", "Luminaire"],
    outils: ["Pince à dénuder", "Testeur", "Perceuse"],
    ouvriers: ["Électricien", "Aide-électricien", "Manœuvre"],
    autres: ["Transport du matériel", "Évacuation des déchets"],
  },
};
export const METIERS = [["peinture", "Peinture"], ["carrelage", "Carrelage"], ["maconnerie", "Maçonnerie"], ["plomberie", "Plomberie"], ["electricite", "Électricité"]];
