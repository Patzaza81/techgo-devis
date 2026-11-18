// Compléments du catalogue (v41) — produits courants absents du référentiel et unités de vente.
// RÈGLE : un NOM et sa ou ses UNITÉS DE VENTE seulement. Aucun prix, aucune norme, aucune dimension, aucun dosage.
// Chaque ajout cite sa source (devis, appels d'offres et prix publiés au Cameroun en priorité) et reste « à confirmer »
// par Patrick : il apparaît avec la mention « ajouté v41 » dans le rapport, jamais comme une donnée validée.

export const SOURCES = {
  ciment: "Ecomatin — prix homologués du ciment Cimencam, sac de 50 kg (Douala, Yaoundé)",
  devisMendzana: "Devis gros œuvre « Mendzana » (Cameroun, 2023) : sable au m³, gravier à la tonne, ciment au sac, fil d'attache au rouleau, film polyane au mètre, cartons de pointes",
  apsDouala: "APS immeuble R+2 à Douala (2025) : hourdis de 16 à l'unité, parpaings de 15 vibrés, gros sable par camion de 10 m³",
  fer: "Infospratiques.cm — fer à béton vendu à la barre (fer de 8, 10, 12…) ou à la tonne",
  daoMessamena: "Appel d'offres commune de Messamena (2022) : chevrons de 8 × 8, prix au mètre linéaire",
  latte: "Vitrine du Cameroun — latte de charpente vendue à la pièce",
  forumPoutrelle: "Forum Construire (France) — poutrelles de plancher vendues au mètre linéaire ; à confirmer au Cameroun",
  chausson: "Catalogue carrelage Chausson Matériaux (2022) : primaires, ragréages, profilés de finition, nez de marche, natte d'étanchéité",
  nezMarche: "Générateur de prix Cameroun (cameroun.prix-construction.info) : nez de marche au mètre",
  bricoDepot: "Brico Dépôt : ragréage et mortier-colle en sac de 25 kg",
  williams: "Williams Éclairage, Yaoundé (annuaire Maligah) : plafonniers, ampoules LED, gaines ICTA, appareillage",
  domomat: "Domomat (catalogue électricité) : douilles, appliques et hublots, plafonniers, réglettes, télérupteurs, bornes de connexion, brasseurs d'air, contacteurs, prises de télécommunication, compteurs d'énergie",
  inoda: "INODA Industries, Douala (fiche technique INOSATIN) : peinture antirouille",
  mrBricolage: "Mr Bricolage (rayons peinture) : peinture façade, crépi façade, peinture anti-rouille, peintures sol, vernis",
  tollens: "Catalogue professionnel Tollens : impressions, fixateurs, hydrofuge de façade",
  regulTension: "Glotelho et NowTech Center (Cameroun) : régulateurs / stabilisateurs de tension vendus à l'unité (1 000 à 60 000 VA)",
  regulCharge: "Glotelho (Cameroun) : régulateur de charge solaire MPPT, vendu à l'unité",
  cimentBlanc: "Camer.be — Cimencam lance « Sublim », ciment blanc fabriqué au Cameroun",
  chauxLaterite: "Thèse ENSET Ebolowa (dicames) : graveleux latéritiques et stabilisation à la chaux au Cameroun",
};

// Produits ajoutés. dom : sous-ensemble du référentiel où ils s'affichent (maçonnerie, électricité) ; liste : onglet de la liste à plat (carrelage).
export const AJOUTS = {
  maconnerie: [
    { dom: "dall", fam: "Plancher à hourdis", nom: "Hourdis (entrevous)", unites: ["pièce"], src: ["apsDouala"] },
    { dom: "dall", fam: "Plancher à hourdis", nom: "Poutrelle de plancher", unites: ["ml", "pièce"], src: ["forumPoutrelle"] },
    { dom: "acier", fam: "Bois de coffrage et de charpente", nom: "Chevron", unites: ["pièce", "ml"], src: ["daoMessamena"] },
    { dom: "acier", fam: "Bois de coffrage et de charpente", nom: "Latte", unites: ["pièce"], src: ["latte"] },
    { dom: "acier", fam: "Bois de coffrage et de charpente", nom: "Pointes", unites: ["kg", "carton"], src: ["devisMendzana"] },
    { dom: "dall", fam: "Dallage et protection", nom: "Film polyane", unites: ["m", "rouleau"], src: ["devisMendzana"] },
    { dom: "liants", fam: "Liants et terres", nom: "Chaux", unites: ["sac", "kg"], src: ["chauxLaterite"] },
    { dom: "liants", fam: "Liants et terres", nom: "Latérite (remblai)", unites: ["m³", "camion"], src: ["chauxLaterite"] },
    { dom: "adj", fam: "Imperméabilisation", nom: "Hydrofuge de masse", unites: ["litre", "bidon"], src: ["devisMendzana", "tollens"] },
  ],
  electricite: [
    { dom: "bat", fam: "Éclairage du logement", nom: "Ampoule (lampe à culot)", unites: ["pièce"], src: ["williams", "domomat"] },
    { dom: "bat", fam: "Éclairage du logement", nom: "Douille", unites: ["pièce"], src: ["domomat"] },
    { dom: "bat", fam: "Éclairage du logement", nom: "Plafonnier", unites: ["pièce"], src: ["williams", "domomat"] },
    { dom: "bat", fam: "Éclairage du logement", nom: "Applique murale", unites: ["pièce"], src: ["domomat"] },
    { dom: "bat", fam: "Éclairage du logement", nom: "Hublot (applique étanche)", unites: ["pièce"], src: ["domomat"] },
    { dom: "bat", fam: "Commande et raccordement", nom: "Télérupteur", unites: ["pièce"], src: ["domomat"] },
    { dom: "bat", fam: "Commande et raccordement", nom: "Borne de connexion (domino)", unites: ["pièce", "boîte"], src: ["domomat"] },
    { dom: "bat", fam: "Commande et raccordement", nom: "Contacteur modulaire", unites: ["pièce"], src: ["domomat"] },
    { dom: "bat", fam: "Commande et raccordement", nom: "Compteur d'énergie divisionnaire", unites: ["pièce"], src: ["domomat"] },
    { dom: "bat", fam: "Éclairage du logement", nom: "Brasseur d'air (ventilateur de plafond)", unites: ["pièce"], src: ["domomat"] },
    { dom: "fai", fam: "Prises de communication", nom: "Prise TV (télécommunication)", unites: ["pièce"], src: ["domomat"] },
    { dom: "sec", fam: "Tension et solaire", nom: "Régulateur de tension (stabilisateur)", unites: ["pièce"], src: ["regulTension"] },
    { dom: "sec", fam: "Tension et solaire", nom: "Régulateur de charge solaire", unites: ["pièce"], src: ["regulCharge"] },
  ],
  carrelage: [
    { liste: "produits", nom: "Primaire d'accrochage", unites: ["litre", "bidon"], src: ["chausson"] },
    { liste: "produits", nom: "Ragréage", unites: ["sac"], src: ["chausson", "bricoDepot"] },
    { liste: "produits", nom: "Profilé de finition (baguette d'angle)", unites: ["pièce", "ml"], src: ["chausson"] },
    { liste: "produits", nom: "Nez de marche", unites: ["ml", "pièce"], src: ["nezMarche", "chausson"] },
    { liste: "produits", nom: "Natte d'étanchéité", unites: ["m²", "rouleau"], src: ["chausson"] },
    { liste: "produits", nom: "Silicone sanitaire", unites: ["cartouche"], src: ["chausson"] },
    { liste: "produits", nom: "Ciment blanc", unites: ["sac"], src: ["cimentBlanc"] },
  ],
  peinture: [
    { liste: "produits", nom: "Peinture antirouille", unites: ["pot", "seau", "kg"], src: ["inoda", "mrBricolage"] },
    { liste: "produits", nom: "Peinture de sol", unites: ["pot", "seau", "kg"], src: ["mrBricolage"] },
    { liste: "produits", nom: "Vernis", unites: ["pot", "litre"], src: ["mrBricolage"] },
    { liste: "produits", nom: "Fixateur (impression)", unites: ["litre", "bidon"], src: ["tollens"] },
    { liste: "produits", nom: "Hydrofuge de façade", unites: ["litre", "bidon"], src: ["tollens"] },
    { liste: "produits", nom: "Crépi", unites: ["sac", "kg"], src: ["mrBricolage"] },
  ],
};

// Unités de vente proposées pour les fiches qui n'en ont pas (maçonnerie : 98 fiches). Par famille du référentiel ;
// la première est la plus courante. Seulement les unités qui ont un sens pour le produit.
export const UNITES_FAMILLE = {
  maconnerie: {
    M1: ["sac", "tonne"], M2: ["m³", "camion", "tonne"], M3: ["tonne", "m³", "camion"], M4: ["m³", "litre"], M6: ["pièce"], M7: ["pièce", "m³"],
    M8: ["sac", "m³"], M9: ["sac", "m²"], M10: ["rouleau", "kg"], M11: ["pièce", "ml", "m³"], M12: ["litre", "kg", "sac"], M13: ["m²", "m³", "ml"], M14: ["pièce"],
    O1: ["jour", "forfait"], "GO-IND": ["forfait", "m³", "m²", "ml", "unité"], C1: ["forfait", "unité"], C2: ["pièce", "lot"], C3: ["forfait", "trajet", "jour"],
  },
};
// Précisions par nom quand la famille mélange des produits vendus différemment.
export const UNITES_NOM = {
  "Huile de décoffrage adaptée": ["litre"], "Étais": ["pièce", "jour"], "Contreplaqué de coffrage": ["pièce"], "Panneaux réutilisables": ["pièce", "jour"],
  "Pierre naturelle": ["m³", "tonne"], "Film contre les remontées d'humidité": ["m²", "rouleau"], "Armatures ou treillis de dallage": ["pièce", "m²"],
  "Matériau granulaire (hérisson)": ["m³", "tonne"], "Matériau de couche de forme": ["m³", "tonne"], "Isolation sous dallage": ["m²"], "Joints de fractionnement ou de construction": ["ml"],
  "Eau de gâchage": ["m³", "litre"],
};
// Accessoires d'électricité (familles « A: », noms génériques au pluriel, sans unité dans le document) :
// ce qui se coupe à la longueur se vend au mètre, le ruban au rouleau, le reste à la pièce ou par lot.
// Ce sont des modes de vente, pas des caractéristiques ; l'artisan garde « Autre… » pour toute autre unité.
export const UNITES_ACCESSOIRE = [
  [/^(Câbles?|Conducteurs|Gaines)\b/i, ["mètre", "rouleau"]], [/^(Goulottes|Rails?|Tiges filetées)\b/i, ["mètre", "barre"]],
  [/^Rubans?\b/i, ["rouleau"]], [/./, ["pièce", "lot"]],
];
export function unitesAccessoire(nom) { const r = UNITES_ACCESSOIRE.find(([re]) => re.test(nom)); return r ? r[1] : []; }
// Liste à plat (peinture, carrelage) : unités qui correspondent à chaque produit.
export const UNITES_LISTE = {
  peinture: [[/^Peinture|Sous-couche|Multiprim|Soytex|Pancoat|Flintkote/i, ["pot", "seau", "litre", "kg"]], [/Stucco|Mastic|Enduit/i, ["sac", "pot", "kg"]], [/Ciment/i, ["sac"]], [/Diluant/i, ["litre"]], [/Colorant/i, ["flacon", "litre"]], [/Papier abrasif/i, ["rouleau", "paquet", "feuille"]], [/Bandes adhésives/i, ["rouleau"]], [/Rouleaux et pinceaux/i, ["pièce", "lot"]], [/Bâche/i, ["pièce", "m²"]]],
  carrelage: [[/^Carreaux/i, ["m²", "carton"]], [/Colle à carrelage|Mortier-colle|Joint de carrelage|Ragréage/i, ["sac", "kg"]], [/Plinthes/i, ["ml", "pièce", "carton"]], [/Croisillons/i, ["paquet"]], [/^Ciment/i, ["sac"]], [/^Sable/i, ["m³", "camion", "tonne"]], [/Primaire/i, ["litre", "bidon"]], [/Profilé|Nez de marche/i, ["pièce", "ml"]], [/Natte/i, ["m²", "rouleau"]], [/Silicone/i, ["cartouche"]]],
};
export function unitesListe(met, nom) {
  const a = (AJOUTS[met] || []).find((p) => p.liste && p.nom === nom); if (a) return a.unites; // produit ajouté : ses unités sourcées
  const t = UNITES_LISTE[met] || []; const x = t.find(([re]) => re.test(String(nom || ""))); return x ? x[1] : null;
}
