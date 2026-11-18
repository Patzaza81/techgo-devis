// Compléments du catalogue (v41) — produits courants absents du référentiel et unités de vente.
// RÈGLE : un NOM et sa ou ses UNITÉS DE VENTE seulement. Aucun prix, aucune norme, aucune dimension, aucun dosage.
// Chaque ajout cite sa source (devis, appels d'offres et prix publiés au Cameroun en priorité) et reste « à confirmer »
// par Patrick : il apparaît avec la mention « ajouté v41 » dans le rapport, jamais comme une donnée validée.

// Sources vérifiées le 18/11/2026. lien : adresse exacte ; pays : où la source situe le produit ;
// montre : ce que la source démontre RÉELLEMENT (relu, pas supposé) ; lien_ok : page ouverte avec succès lors de la vérification
// (false = le site refuse la lecture automatique : lien non vérifié, à ouvrir à la main).
export const SOURCES = {
  ciment: { titre: "Infos Pratiques Cameroun — prix homologués du ciment", lien: "https://infospratiques.cm/prix-ciment-cameroun/", pays: "Cameroun", montre: "ciment vendu au sac de 50 kg (Douala, Yaoundé)", lien_ok: true },
  fer: { titre: "Infos Pratiques Cameroun — prix du fer à béton", lien: "https://infospratiques.cm/?p=76", pays: "Cameroun", montre: "fer à béton vendu à la barre de 12 m (fer de 6 à 25)", lien_ok: true },
  apsDouala: { titre: "APS immeuble R+2 « Yassa », Douala (Scribd)", lien: "https://fr.scribd.com/document/919419005/APS-R-2-YASSA", pays: "Cameroun", montre: "hourdis de 16 à l'unité (U) ; pointes au paquet ; plastique (film) au rouleau ; terre de remblai et gros sable par camion de 10 m³", lien_ok: true, note: "le détail n'est lisible qu'en ouvrant le document sur Scribd" },
  devisMendzana: { titre: "Devis gros œuvre « Mendzana » (Scribd)", lien: "https://fr.scribd.com/document/721202595/Devis-gros-oeuvre-complexe-Mendzana-V02", pays: "Cameroun (titre du document)", montre: "fils d'attache au rouleau ; cartons de pointes ; muret hydrofugé (l'emploi d'un hydrofuge, pas son conditionnement)", lien_ok: true, note: "le détail n'est lisible qu'en ouvrant le document sur Scribd" },
  williams: { titre: "Williams Éclairage, Yaoundé (annuaire Maligah)", lien: "https://maligah.com/entreprises/details/STE-WILLIAMS-ECLAIRAGE?id=184607", pays: "Cameroun", montre: "vend ampoules LED et économiques, plafonniers LED, gaines annelées ICTA, interrupteurs, prises", lien_ok: true },
  regulTension: { titre: "Glotelho Cameroun — stabilisateur de tension Delta 1 500 VA", lien: "https://site.glotelho.cm/en/stabilizer-analog-voltage-regulator-delta-avr-1500va-a-1500va-06-months.html", pays: "Cameroun", montre: "régulateur / stabilisateur de tension vendu comme un appareil, livré au Cameroun", lien_ok: true },
  regulCharge: { titre: "Glotelho Cameroun — régulateur de charge MPPT 40 A", lien: "https://site.glotelho.cm/en/energie-solaire/charge-controller-mppt-40a-12v-24v-6-months.html", pays: "Cameroun", montre: "régulateur de charge solaire vendu à l'unité (prix affiché en FCFA)", lien_ok: true },
  cimentBlanc: { titre: "Camer.be — Cimencam lance « Sublim », ciment blanc", lien: "https://www.camer.be/76589/12:1/cameroun-cimencam-sublime-la-construction-avec-le-ciment-blanc-cameroon.html", pays: "Cameroun", montre: "ciment blanc fabriqué au Cameroun, en sacs de 25 kg", lien_ok: true },
  inoda: { titre: "INODA Industries, Douala — fiche technique INOSATIN", lien: "https://bativel.com/wp-content/uploads/2024/08/inosatin.pdf", pays: "Cameroun", montre: "peinture antirouille fabriquée à Douala, conditionnée en 1, 5 et 30 kg", lien_ok: true },
  nezMarche: { titre: "Générateur de prix — Cameroun : nez de marches", lien: "https://cameroun.prix-construction.info/schluter-systems/renovation/Amenagements_et_finitions/Revetements_d_escaliers/Nez_de_marches.html", pays: "Cameroun (générateur de prix)", montre: "nez de marche pour carrelage, compté au mètre (m)", lien_ok: true },
  theseChaux: { titre: "Thèse A. Ngo'o Ze, Université de Yaoundé I (2020) — graveleux latéritiques stabilisés à la chaux", lien: "https://dicames.online/jspui/bitstream/20.500.12177/7708/1/ENSET_EBO_BC_21_0227.pdf", pays: "Cameroun", montre: "emploi de la latérite et de la chaux au Cameroun ; aucune unité de vente", lien_ok: true },
  chausson: { titre: "Catalogue carrelage Chausson Matériaux 2026", lien: "https://media.chausson.fr/catalogues/catalogue-carrelage-2026.pdf", pays: "France", montre: "primaires et ragréages (sans conditionnement lisible) ; profilés de finition vendus en barres de 2,40 à 2,60 ml ; pas de natte d'étanchéité ni de silicone sanitaire", lien_ok: true },
  domomat: { titre: "Domomat (distributeur électricité)", lien: "https://www.domomat.com/", pays: "France", montre: "rubriques : douilles, appliques et hublots, télérupteurs, systèmes de connexion, contacteurs, prises de télécommunication, compteurs d'énergie, brasseurs d'air (d'après les pages trouvées par la recherche)", lien_ok: false },
  mrBricolage: { titre: "Mr Bricolage (rayons peinture)", lien: "https://www.mr-bricolage.fr/", pays: "France", montre: "rubriques : peinture façade, crépi façade, peinture anti-rouille, peintures sol, vernis (d'après les pages trouvées par la recherche)", lien_ok: false },
  tollens: { titre: "Catalogue professionnel Tollens", lien: "https://www.tollens.com/", pays: "France", montre: "rubriques : impressions, fixateurs, hydrofuge de façade (d'après le sommaire trouvé par la recherche)", lien_ok: false },
  goafrica: { titre: "GoAfrica — fabricants et vendeurs de peinture au Cameroun", lien: "https://www.goafricaonline.com/cm/annuaire/entreprises-peinture", pays: "Cameroun", montre: "les fabricants camerounais produisent vernis, enduits et revêtements spéciaux", lien_ok: true },
};

// Produits ajoutés. dom : sous-ensemble du référentiel où ils s'affichent (maçonnerie, électricité) ; liste : onglet de la liste à plat (carrelage).
// Produits ajoutés. dom : sous-ensemble du référentiel où ils s'affichent (maçonnerie, électricité) ; liste : onglet de la liste à plat.
// statut « vérifié » : une source camerounaise accessible montre le produit ET l'unité proposée.
// statut « à confirmer » : le produit ou l'unité n'est pas démontré au Cameroun ; note dit ce qui manque. Affiché à l'artisan.
export const AJOUTS = {
  maconnerie: [
    { dom: "dall", fam: "Plancher à hourdis", nom: "Hourdis (entrevous)", unites: ["pièce"], src: ["apsDouala"], statut: "vérifié", note: "hourdis de 16 à l'unité dans un devis de Douala" },
    { dom: "dall", fam: "Plancher à hourdis", nom: "Poutrelle de plancher", unites: ["ml", "pièce"], src: [], statut: "à confirmer", note: "aucune source camerounaise retrouvée ; au Cameroun les poutrelles sont souvent coulées sur place" },
    { dom: "acier", fam: "Bois de coffrage et de charpente", nom: "Chevron", unites: ["pièce", "ml"], src: [], statut: "à confirmer", note: "la référence d'origine (appel d'offres de Messamena) n'a pas été retrouvée" },
    { dom: "acier", fam: "Bois de coffrage et de charpente", nom: "Latte", unites: ["pièce"], src: [], statut: "à confirmer", note: "la référence d'origine n'a pas été retrouvée" },
    { dom: "acier", fam: "Bois de coffrage et de charpente", nom: "Pointes", unites: ["paquet", "carton"], src: ["apsDouala", "devisMendzana"], statut: "vérifié", note: "pointes au paquet (Douala) et en cartons" },
    { dom: "dall", fam: "Dallage et protection", nom: "Film polyane", unites: ["rouleau"], src: ["apsDouala"], statut: "vérifié", note: "film plastique au rouleau dans un devis de Douala" },
    { dom: "liants", fam: "Liants et terres", nom: "Chaux", unites: ["sac", "kg"], src: ["theseChaux"], statut: "à confirmer", note: "emploi de la chaux au Cameroun attesté ; unité de vente non démontrée" },
    { dom: "liants", fam: "Liants et terres", nom: "Latérite (remblai)", unites: ["camion", "m³"], src: ["apsDouala", "theseChaux"], statut: "vérifié", note: "terre de remblai par camion de 10 m³ (Douala)" },
    { dom: "adj", fam: "Imperméabilisation", nom: "Hydrofuge de masse", unites: ["litre", "bidon"], src: ["devisMendzana"], statut: "à confirmer", note: "l'emploi d'un hydrofuge est attesté, pas son conditionnement" },
  ],
  electricite: [
    { dom: "bat", fam: "Éclairage du logement", nom: "Ampoule (lampe à culot)", unites: ["pièce"], src: ["williams"], statut: "vérifié", note: "vendue par un grossiste de Yaoundé" },
    { dom: "bat", fam: "Éclairage du logement", nom: "Douille", unites: ["pièce"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "bat", fam: "Éclairage du logement", nom: "Plafonnier", unites: ["pièce"], src: ["williams"], statut: "vérifié", note: "vendu par un grossiste de Yaoundé" },
    { dom: "bat", fam: "Éclairage du logement", nom: "Applique murale", unites: ["pièce"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "bat", fam: "Éclairage du logement", nom: "Hublot (applique étanche)", unites: ["pièce"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "bat", fam: "Commande et raccordement", nom: "Télérupteur", unites: ["pièce"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "bat", fam: "Commande et raccordement", nom: "Borne de connexion (domino)", unites: ["pièce", "boîte"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "bat", fam: "Commande et raccordement", nom: "Contacteur modulaire", unites: ["pièce"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "bat", fam: "Commande et raccordement", nom: "Compteur d'énergie divisionnaire", unites: ["pièce"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "bat", fam: "Éclairage du logement", nom: "Brasseur d'air (ventilateur de plafond)", unites: ["pièce"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "fai", fam: "Prises de communication", nom: "Prise TV (télécommunication)", unites: ["pièce"], src: ["domomat"], statut: "à confirmer", note: "source française seulement" },
    { dom: "sec", fam: "Tension et solaire", nom: "Régulateur de tension (stabilisateur)", unites: ["pièce"], src: ["regulTension"], statut: "vérifié", note: "vendu au Cameroun comme un appareil" },
    { dom: "sec", fam: "Tension et solaire", nom: "Régulateur de charge solaire", unites: ["pièce"], src: ["regulCharge"], statut: "vérifié", note: "vendu à l'unité au Cameroun" },
  ],
  carrelage: [
    { liste: "produits", nom: "Primaire d'accrochage", unites: ["litre", "bidon"], src: ["chausson"], statut: "à confirmer", note: "source française ; conditionnement non lisible" },
    { liste: "produits", nom: "Ragréage", unites: ["sac"], src: ["chausson"], statut: "à confirmer", note: "source française ; poids du sac non lisible" },
    { liste: "produits", nom: "Profilé de finition (baguette d'angle)", unites: ["pièce", "ml"], src: ["chausson"], statut: "à confirmer", note: "source française (barres de 2,40 à 2,60 m)" },
    { liste: "produits", nom: "Nez de marche", unites: ["ml", "pièce"], src: ["nezMarche"], statut: "vérifié", note: "compté au mètre dans le générateur de prix du Cameroun" },
    { liste: "produits", nom: "Natte d'étanchéité", unites: ["m²", "rouleau"], src: [], statut: "à confirmer", note: "la source d'origine ne montre pas ce produit" },
    { liste: "produits", nom: "Silicone sanitaire", unites: ["cartouche"], src: [], statut: "à confirmer", note: "la source d'origine ne montre pas ce produit" },
    { liste: "produits", nom: "Ciment blanc", unites: ["sac"], src: ["cimentBlanc"], statut: "vérifié", note: "Cimencam, sac de 25 kg" },
  ],
  peinture: [
    { liste: "produits", nom: "Peinture antirouille", unites: ["kg", "pot", "seau"], src: ["inoda"], statut: "vérifié", note: "fabriquée à Douala, en 1, 5 et 30 kg" },
    { liste: "produits", nom: "Peinture de sol", unites: ["pot", "seau", "kg"], src: ["mrBricolage"], statut: "à confirmer", note: "source française seulement" },
    { liste: "produits", nom: "Vernis", unites: ["pot", "litre"], src: ["goafrica", "mrBricolage"], statut: "à confirmer", note: "fabriqué au Cameroun ; conditionnement non démontré" },
    { liste: "produits", nom: "Fixateur (impression)", unites: ["litre", "bidon"], src: ["tollens"], statut: "à confirmer", note: "source française seulement" },
    { liste: "produits", nom: "Hydrofuge de façade", unites: ["litre", "bidon"], src: ["tollens"], statut: "à confirmer", note: "source française seulement" },
    { liste: "produits", nom: "Crépi", unites: ["sac", "kg"], src: ["mrBricolage"], statut: "à confirmer", note: "source française seulement" },
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
