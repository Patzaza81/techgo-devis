// Métré : chaque exemple est vérifiable à la main (le calcul attendu est écrit en commentaire).
import * as M from "./metiers/metre.js";
import fs from "fs";
let pass = 0, fail = 0;
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + n + (ok ? "" : `  obtenu=${JSON.stringify(g)} attendu=${JSON.stringify(w)}`)); };
const pres = (n, x, w, tol = 1e-6) => eq(n, Math.abs(x - w) < tol, true) || (Math.abs(x - w) < tol ? 0 : console.log("     valeur = " + x));
let n = 0; const id = () => "o" + ++n;
const un = (type, v, metier) => M.calculer({ zones: [{ id: "z", nom: "Zone", ouvrages: [{ id: id(), type, v }] }] }, metier);
const L = (r, nom) => r.lignes.find((l) => l.nom === nom);
const mes = (r, nom) => r.zones[0].ouvrages[0].mesures.find((m) => m.nom === nom);

// ===== Arrondis =====
eq("entier au-dessus : 2,513 → 3", M.arrSup(2.513), 3);
eq("entier au-dessus : 4 reste 4 (pas de sac en trop à cause des décimales)", M.arrSup(100 / 25), 4);
eq("entier au-dessus : 0,1 + 0,2 ne devient pas 1 de plus", M.arrSup((0.1 + 0.2) * 10), 3);
eq("demi-journée au-dessus : 3,83 → 4", M.arrDemi(3.8296), 4);
eq("demi-journée au-dessus : 3,03 → 3,5", M.arrDemi(3.03), 3.5);
eq("demi-journée : 3 reste 3", M.arrDemi(3), 3);
eq("écriture française : 1234,5", M.fr(1234.5), "1 234,5");

// ===== PEINTURE =====
// Pièce 4 × 3 × 2,8 ; porte 0,9 × 2,1 ; fenêtre 1,2 × 1,2 ; plafond compris.
// Murs : 2 × (4+3) × 2,8 = 39,2 ; ouvertures 1,89 + 1,44 = 3,33 ; murs = 35,87 ; plafond 12 ; total 47,87 m².
// Peinture 2 couches, 40 m² par pot, 5 % de pertes : 47,87 × 2 × 1,05 = 100,527 ÷ 40 = 2,513 → 3 pots.
// Sous-couche 1 couche, 50 m² par pot : 47,87 × 1,05 = 50,2635 ÷ 50 = 1,005 → 2 pots.
// Main-d'œuvre à la journée, 25 m² par jour, 2 ouvriers : 47,87 ÷ 25 = 1,9148 × 2 = 3,83 → 4 journées.
const piece = { longueur: 4, largeur: 3, hauteur: 2.8, plafond: true, ouv: [{ n: 1, l: 0.9, h: 2.1 }, { n: 1, l: 1.2, h: 1.2 }], perte: 5,
  prod: [{ nom: "Sous-couche", couches: 1, couv: 50, u: "Pot" }, { nom: "Peinture acrylique", couches: 2, couv: 40, u: "Pot" }], moMode: "jour", moRend: 25, moOuv: 2 };
let r = un("p_piece", piece, "peinture");
pres("peinture pièce : murs = 35,87 m²", mes(r, "Murs").val, 35.87);
pres("peinture pièce : surface totale = 47,87 m²", mes(r, "Surface à peindre").val, 47.87);
eq("peinture pièce : 3 pots de peinture", L(r, "Peinture acrylique").qty, 3);
eq("peinture pièce : 2 pots de sous-couche (1,005 → 2)", L(r, "Sous-couche").qty, 2);
eq("peinture pièce : 4 journées", L(r, "Travaux de peinture (à la journée)").qty, 4);
eq("peinture pièce : la journée est rangée avec les ouvriers", L(r, "Travaux de peinture (à la journée)").tab, "ouvriers");
eq("peinture pièce : l'explication donne la formule", /47,87 m² × 2 couches \+ 5 % de pertes = 100,53 m² à couvrir ÷ 40 m² par pot = 2,51/.test(L(r, "Peinture acrylique").detail), true);
eq("peinture pièce : l'explication dit l'arrondi", /→ 3 Pot \(entier au-dessus\)/.test(L(r, "Peinture acrylique").detail), true);
eq("peinture pièce : rien ne manque", r.manques, []);
// Sans plafond : 35,87 × 2 × 1,05 = 75,327 ÷ 40 = 1,88 → 2 pots.
eq("peinture sans plafond : 2 pots", L(un("p_piece", { ...piece, plafond: false }, "peinture"), "Peinture acrylique").qty, 2);
// À la tâche : la quantité de main-d'œuvre est la surface, pas la surface × couches.
pres("peinture à la tâche : 47,87 m²", L(un("p_piece", { ...piece, moMode: "tache" }, "peinture"), "Travaux de peinture").qty, 47.87);
// 4 portes 0,9 × 2,1 peintes sur 2 faces : 4 × 0,9 × 2,1 × 2 = 15,12 m².
pres("peinture portes 2 faces : 15,12 m²", mes(un("p_surface", { longueur: 0.9, hauteur: 2.1, nombre: 4, faces: 2, prod: [{ nom: "Laque", couv: 10 }] }, "peinture"), "Surface à peindre").val, 15.12);
// Données manquantes
r = un("p_piece", { ...piece, prod: [{ nom: "Peinture acrylique", couches: 2, couv: null, u: "Pot" }] }, "peinture");
eq("peinture sans couverture : pas de ligne dans le devis", L(r, "Peinture acrylique"), undefined);
eq("peinture sans couverture : le manque est nommé", r.manques.map((m) => m.quoi).flat(), ["la surface couverte par pot de « Peinture acrylique »"]);
eq("peinture sans hauteur : ouvrage incomplet", un("p_piece", { ...piece, hauteur: null }, "peinture").manques[0].quoi, ["la hauteur"]);
eq("peinture sans produit : signalé", un("p_piece", { ...piece, prod: [] }, "peinture").manques[0].quoi, ["au moins un produit à appliquer"]);
r = un("p_piece", { ...piece, ouv: [{ n: 30, l: 1, h: 2 }] }, "peinture");
eq("ouvertures plus grandes que les murs : alerte, aucune quantité", [r.lignes.length, r.alertes.length > 0], [0, true]);
eq("pertes absurdes (150 %) : refusées", un("p_piece", { ...piece, perte: 150 }, "peinture").manques.some((m) => m.quoi.includes("un pourcentage de pertes entre 0 et 100")), true);
eq("ouverture sans hauteur : signalée", un("p_piece", { ...piece, ouv: [{ n: 1, l: 0.9, h: null }] }, "peinture").manques[0].quoi, ["la largeur et la hauteur de chaque ouverture"]);

// ===== CARRELAGE =====
// Sol 5 × 4 = 20 m² ; carreau 60 × 60, 4 par carton = 1,44 m² par carton ; 10 % : 22 ÷ 1,44 = 15,28 → 16 cartons.
// Colle 5 kg/m², sac de 25 kg : 100 ÷ 25 = 4 sacs. Joint 0,5 kg/m², sac de 5 kg : 10 ÷ 5 = 2 sacs.
// Plinthes : 2 × (5+4) = 18 − 0,9 de porte = 17,1 ml ; + 10 % = 18,81 ÷ 0,6 m = 31,35 → 32 plinthes.
const sol = { longueur: 5, largeur: 4, carreau: "Grès 60×60", cA: 60, cB: 60, parCarton: 4, perte: 10, colle: 5, colleSac: 25, jointC: 0.5, jointSac: 5, plinthes: true, portes: 0.9, plinthe: 60, moMode: "tache" };
r = un("c_sol", sol, "carrelage");
eq("carrelage sol : 16 cartons", L(r, "Grès 60×60").qty, 16);
eq("carrelage sol : 4 sacs de colle (pas 5)", L(r, "Colle à carrelage").qty, 4);
eq("carrelage sol : 2 sacs de joint", L(r, "Joint de carrelage").qty, 2);
eq("carrelage sol : 32 plinthes", L(r, "Plinthes").qty, 32);
pres("carrelage sol : pose 20 m²", L(r, "Pose de carrelage").qty, 20);
eq("carrelage sol : explication du carton", /22 m² ÷ 1,44 m² par carton \(4 carreaux de 60 × 60 cm\) = 15,28/.test(L(r, "Grès 60×60").detail), true);
// Deux pièces identiques : 30,56 → 31 cartons (et non 16 + 16 = 32).
r = M.calculer({ zones: [{ id: "a", nom: "Salon", ouvrages: [{ id: "1", type: "c_sol", v: sol }] }, { id: "b", nom: "Chambre", ouvrages: [{ id: "2", type: "c_sol", v: { ...sol, longueur: 5.001 } }] }] }, "carrelage");
eq("deux zones : l'arrondi se fait sur le total (31 cartons, pas 32)", L(r, "Grès 60×60").qty, 31);
eq("deux zones : le détail cite les deux zones", /Salon/.test(L(r, "Grès 60×60").detail) && /Chambre/.test(L(r, "Grès 60×60").detail), true);
// Faïence : 7 m de mur × 2 m de haut − porte 0,8 × 2 = 14 − 1,6 = 12,4 m² ; carreau 25 × 40, 15 par carton = 1,5 m² ; 12,4 ÷ 1,5 = 8,27 → 9.
r = un("c_mur", { longueur: 7, hauteur: 2, ouv: [{ n: 1, l: 0.8, h: 2 }], cA: 25, cB: 40, parCarton: 15 }, "carrelage");
eq("faïence : 9 cartons", L(r, "Carreaux").qty, 9);
eq("faïence sans colle ni joint : 2 alertes", r.alertes.length, 2);
eq("carrelage sans format : manque nommé", un("c_sol", { longueur: 5, largeur: 4 }, "carrelage").manques[0].quoi, ["la longueur d'un carreau (cm)", "la largeur d'un carreau (cm)", "le nombre de carreaux par carton"]);
eq("carrelage : colle sans poids de sac", un("c_sol", { ...sol, colleSac: null }, "carrelage").manques.some((m) => m.quoi.includes("le poids d'un sac de colle (kg)")), true);
eq("carrelage : même pièce saisie deux fois → alerte doublon", M.calculer({ zones: [{ id: "a", nom: "Salon", ouvrages: [{ id: "1", type: "c_sol", v: sol }, { id: "2", type: "c_sol", v: sol }] }] }, "carrelage").alertes.some((a) => /compté deux fois/.test(a.texte)), true);

// ===== MAÇONNERIE =====
// Mur 10 × 3 = 30 m² ; bloc 40 × 20 × 15 cm, joint 1 cm : 1 ÷ (0,41 × 0,21) = 11,614 blocs par m².
// 30 × 11,614 = 348,43 ; + 5 % = 365,85 → 366 blocs.
// Joints : 1 − (40 × 20) ÷ (41 × 21) = 7,085 % ; 30 × 0,15 × 0,07085 = 0,3188 m³.
// Ciment 350 kg/m³, sac 50 kg : 0,3188 × 350 = 111,58 ÷ 50 = 2,23 → 3 sacs. Sable 1 m³/m³ → 0,32 m³.
const mur = { longueur: 10, hauteur: 3, blocNom: "Parpaing de 15", blocL: 40, blocH: 20, blocE: 15, joint: 1, perte: 5, ciment: 350, sac: 50, sable: 1, moMode: "jour", moRend: 10, moOuv: 3 };
r = un("m_mur", mur, "maconnerie");
pres("mur : 11,614 blocs par m²", mes(r, "Blocs par m²").val, 1 / (0.41 * 0.21));
eq("mur : 366 blocs", L(r, "Parpaing de 15").qty, 366);
pres("mur : 0,3188 m³ de mortier de joints", mes(r, "Mortier des joints").val, 30 * 0.15 * (1 - 800 / 861));
eq("mur : 3 sacs de ciment", L(r, "Ciment").qty, 3);
eq("mur : 0,32 m³ de sable", L(r, "Sable").qty, 0.32);
// 30 m² ÷ 10 m² par jour = 3 jours × 3 ouvriers = 9 journées.
eq("mur : 9 journées", L(r, "Élévation de mur (à la journée)").qty, 9);
eq("mur : durée d'équipe 3 jours", M.dureeEquipe({ zones: [{ id: "z", ouvrages: [{ id: "1", type: "m_mur", v: mur }] }] }, "maconnerie"), 3);
eq("mur sans dosage : blocs calculés, pas de ciment inventé", [L(un("m_mur", { ...mur, ciment: null, sac: null, sable: null }, "maconnerie"), "Parpaing de 15").qty, L(un("m_mur", { ...mur, ciment: null, sac: null, sable: null }, "maconnerie"), "Ciment")], [366, undefined]);
eq("mur : dosage sans sable → sable manquant, ciment calculé", (() => { const x = un("m_mur", { ...mur, sable: null }, "maconnerie"); return [L(x, "Ciment").qty, x.manques.some((m) => m.besoin === "Sable")]; })(), [3, true]);
eq("mur : joint plus épais que le bloc → alerte d'unité", un("m_mur", { ...mur, joint: 25 }, "maconnerie").alertes.some((a) => /centimètres/.test(a.texte)), true);
// Avec une porte 0,9 × 2,1 : 30 − 1,89 = 28,11 m².
pres("mur avec porte : 28,11 m²", mes(un("m_mur", { ...mur, ouv: [{ n: 1, l: 0.9, h: 2.1 }] }, "maconnerie"), "Surface de mur").val, 28.11);
// Béton : 6 poteaux de 3 m, 20 × 20 cm : 6 × 3 × 0,2 × 0,2 = 0,72 m³.
// Ciment 350 kg/m³ : 252 kg ÷ 50 = 5,04 → 6 sacs. Sable 0,4 → 0,29 m³. Gravier 0,8 → 0,58 m³.
const pot = { nom: "Poteaux RDC", nombre: 6, longueur: 3, largeur: 20, epaisseur: 20, ciment: 350, sac: 50, sable: 0.4, gravier: 0.8 };
r = un("m_beton", pot, "maconnerie");
pres("béton : 0,72 m³", mes(r, "Volume de béton").val, 0.72);
eq("béton : 6 sacs de ciment (5,04 → 6)", L(r, "Ciment").qty, 6);
eq("béton : 0,29 m³ de sable", L(r, "Sable").qty, 0.29);
eq("béton : 0,58 m³ de gravier", L(r, "Gravier").qty, 0.58);
eq("béton sans gravier saisi : gravier réclamé", un("m_beton", { ...pot, gravier: null }, "maconnerie").manques.some((m) => m.besoin === "Gravier"), true);
eq("béton sans dosage : aucun sac inventé", un("m_beton", { ...pot, ciment: null }, "maconnerie").lignes.some((l) => l.nom === "Ciment"), false);
eq("béton : épaisseur saisie en mètres par erreur → alerte", un("m_beton", { ...pot, longueur: 0.3, epaisseur: 300 }, "maconnerie").alertes.length > 0, true);
// Mur + poteaux dans le même devis : ciment = 2,2317 + 5,04 = 7,27 → 8 sacs (et non 3 + 6 = 9).
r = M.calculer({ zones: [{ id: "a", nom: "RDC", ouvrages: [{ id: "1", type: "m_mur", v: mur }, { id: "2", type: "m_beton", v: pot }] }] }, "maconnerie");
eq("mur + poteaux : 8 sacs de ciment au total", L(r, "Ciment").qty, 8);
// Chape 5 × 4 × 5 cm = 1 m³ ; ciment 300 → 6 sacs ; sable 1 → 1 m³ ; pas de gravier.
r = un("m_chape", { longueur: 5, largeur: 4, epaisseur: 5, ciment: 300, sac: 50, sable: 1, moMode: "tache" }, "maconnerie");
eq("chape : 6 sacs, 1 m³ de sable, pas de gravier, 20 m² de pose", [L(r, "Ciment").qty, L(r, "Sable").qty, L(r, "Gravier"), L(r, "Réalisation de chape").qty], [6, 1, undefined, 20]);
// Enduit 10 × 3, 2 faces, 1,5 cm : 60 m² × 0,015 = 0,9 m³ ; ciment 300 → 270 kg → 5,4 → 6 sacs.
r = un("m_enduit", { longueur: 10, hauteur: 3, faces: 2, epaisseur: 1.5, ciment: 300, sac: 50, sable: 1 }, "maconnerie");
eq("enduit : 60 m², 0,9 m³, 6 sacs", [mes(r, "Surface à enduire").val, M.arrDec(mes(r, "Volume d'enduit").val), L(r, "Ciment").qty], [60, 0.9, 6]);
// Fouille : 8 semelles 1 × 1 × 0,8 = 6,4 m³.
r = un("m_fouille", { nombre: 8, longueur: 1, largeur: 1, profondeur: 0.8, moMode: "tache" }, "maconnerie");
eq("fouille : 6,4 m³", L(r, "Fouilles").qty, 6.4);
// Armatures : 6 poteaux de 3 m, 4 filants + 0,5 m : 6 × 4 × 3,5 = 84 ml ÷ 12 = 7 barres.
// Cadres tous les 15 cm : 3 ÷ 0,15 = 20 intervalles + 1 = 21 × 6 = 126 cadres × 0,70 m = 88,2 ml ÷ 12 = 7,35 → 8 barres.
r = un("m_acier", { nombre: 6, longueur: 3, filNom: "Fer de 12", filN: 4, filRec: 0.5, cadNom: "Fer de 6", cadEsp: 15, cadDev: 70, barre: 12 }, "maconnerie");
eq("armatures : 7 barres de 12 et 8 barres de 6", [L(r, "Fer de 12").qty, L(r, "Fer de 6").qty], [7, 8]);
eq("armatures : 126 cadres", mes(r, "Cadres").val, 126);
eq("armatures sans rien du plan : incomplet", un("m_acier", { longueur: 3 }, "maconnerie").manques[0].quoi, ["le nombre de barres filantes ou les cadres (lus sur le plan)"]);

// ===== PLOMBERIE =====
// 23 m de PVC Ø100, 10 % de chutes = 25,3 ml ÷ barre de 4 m = 6,33 → 7 barres. Colliers tous les 80 cm : 23 ÷ 0,8 = 28,75 → 29 + 1 = 30.
const res = { tuyau: "Tube PVC Ø100", longueur: 23, perte: 10, vente: "Barre", barre: 4, colEsp: 80, art: [{ nom: "Coude 87° Ø100", n: 6 }, { nom: "Té Ø100", n: 2 }], moMode: "tache" };
r = un("pl_reseau", res, "plomberie");
eq("plomberie : 7 barres", L(r, "Tube PVC Ø100").qty, 7);
eq("plomberie : 30 colliers", L(r, "Colliers pour Tube PVC Ø100").qty, 30);
eq("plomberie : raccords comptés", [L(r, "Coude 87° Ø100").qty, L(r, "Té Ø100").qty], [6, 2]);
eq("plomberie : pose 23 ml (longueur posée, sans les chutes)", L(r, "Pose de tuyauterie").qty, 23);
eq("plomberie au mètre : 26 m (25,3 → 26)", L(un("pl_reseau", { ...res, vente: "Mètre" }, "plomberie"), "Tube PVC Ø100").qty, 26);
eq("plomberie sans raccord : alerte", un("pl_reseau", { ...res, art: [] }, "plomberie").alertes.some((a) => /raccord/.test(a.texte)), true);
eq("plomberie sans diamètre : incomplet", un("pl_reseau", { ...res, tuyau: "" }, "plomberie").manques[0].quoi, ["le type et le diamètre du tuyau"]);
r = un("pl_appareils", { art: [{ nom: "WC", n: 2 }, { nom: "Lavabo", n: 3 }], acc: [{ nom: "Flexible", n: 8 }], moMode: "tache" }, "plomberie");
eq("appareils : 5 points d'eau, pose par point", [mes(r, "Points d'eau").val, L(r, "Pose des appareils").qty, L(r, "Pose des appareils").unite], [5, 5, "point"]);
// Deux réseaux du même tuyau dans deux zones : 6,325 + 2,75 = 9,075 → 10 barres.
r = M.calculer({ zones: [{ id: "a", nom: "RDC", ouvrages: [{ id: "1", type: "pl_reseau", v: res }] }, { id: "b", nom: "Étage", ouvrages: [{ id: "2", type: "pl_reseau", v: { ...res, longueur: 10, art: [{ nom: "Té Ø100", n: 1 }] } }] }] }, "plomberie");
eq("plomberie deux zones : 10 barres et 3 tés", [L(r, "Tube PVC Ø100").qty, L(r, "Té Ø100").qty], [10, 3]);

// ===== ÉLECTRICITÉ =====
// 2 lignes de 18 m, 6 raccordements × 0,3 m : (18 + 1,8) × 2 = 39,6 ; + 10 % = 43,56 ml ÷ 100 m = 0,44 → 1 rouleau.
// Conduit : 2 × 18 = 36 ; + 10 % = 39,6 ÷ 25 m = 1,58 → 2 rouleaux.
const lig = { cable: "Câble 3G2,5", nombre: 2, longueur: 18, reserve: 0.3, racc: 6, perte: 10, rouleau: 100, conduit: "Gaine ICTA Ø20", rouleauC: 25, moMode: "tache" };
r = un("e_ligne", lig, "electricite");
pres("électricité : 43,56 ml de câble", mes(r, "Câble").val, 43.56);
eq("électricité : 1 rouleau de câble, 2 de gaine", [L(r, "Câble 3G2,5").qty, L(r, "Gaine ICTA Ø20").qty], [1, 2]);
eq("électricité : tirage 36 ml", L(r, "Tirage de câble").qty, 36);
// 3 fils de 1,5 tirés séparément sur 12 m : 36 ml.
pres("électricité : 3 fils séparés = 36 ml", mes(un("e_ligne", { cable: "Fil H07V-U 1,5", longueur: 12, fils: 3, rouleau: 100 }, "electricite"), "Câble").val, 36);
eq("électricité : réserve sans nombre de raccordements → incomplet", un("e_ligne", { ...lig, racc: null }, "electricite").manques[0].quoi, ["le nombre de raccordements"]);
eq("électricité : la section n'est jamais calculée (note affichée)", /ne sont pas calculés/.test(M.typeDe("e_ligne").note), true);
r = un("e_points", { art: [{ nom: "Prise 2P+T", n: 8 }, { nom: "Interrupteur simple", n: 4 }], boites: true, moMode: "tache" }, "electricite");
eq("points : 12 boîtes, 12 points de pose", [L(r, "Boîte d'encastrement").qty, L(r, "Pose des points électriques").qty], [12, 12]);
r = un("e_tableau", { art: [{ nom: "Disjoncteur 16 A", n: 6 }, { nom: "Coffret 13 modules", n: 1 }], moMode: "tache" }, "electricite");
eq("tableau : articles et forfait de câblage", [L(r, "Disjoncteur 16 A").qty, L(r, "Câblage du tableau").qty, L(r, "Câblage du tableau").unite], [6, 1, "forfait"]);

// ===== Synchronisation avec le devis =====
r = un("c_sol", sol, "carrelage");
let plan = M.planSync([], r.lignes);
eq("devis vide : toutes les lignes du métré sont à ajouter", [plan.ajouter.length, plan.maj.length, plan.retirer.length], [r.lignes.length, 0, 0]);
const man = r.lignes.map((l, i) => ({ id: "m" + i, metre: l.cle, metreQty: l.qty, qty: l.qty, nom: l.nom, detail: l.detail }));
plan = M.planSync(man, r.lignes);
eq("devis à jour : rien à faire", [plan.ajouter.length, plan.maj.length, plan.retirer.length, plan.ecarts.length], [0, 0, 0, 0]);
const r2 = un("c_sol", { ...sol, longueur: 6 }, "carrelage"); // 24 m² × 1,1 ÷ 1,44 = 18,33 → 19
plan = M.planSync(man, r2.lignes);
eq("pièce agrandie : la quantité de carreaux passe à 19", plan.maj.find((m) => m.id === "m0").qty, 19);
const man2 = man.map((m) => (m.nom === "Grès 60×60" ? { ...m, qty: 20 } : m));
plan = M.planSync(man2, r2.lignes);
eq("quantité changée à la main : jamais écrasée, signalée (20 contre 19)", [plan.maj.some((m) => m.id === "m0"), plan.ecarts.map((e) => [e.qty, e.metre])], [false, [[20, 19]]]);
plan = M.planSync(man, un("c_sol", { ...sol, plinthes: false }, "carrelage").lignes);
eq("plinthes retirées du métré : la ligne sort du devis", plan.retirer.length, 1);
plan = M.planSync([{ id: "x", qty: 5, nom: "Ligne saisie à la main" }], r.lignes);
eq("une ligne saisie à la main n'est jamais touchée", [plan.retirer, plan.maj], [[], []]);

// ===== Garde-fous généraux =====
eq("les cinq métiers ont un métré", [...M.METIERS_METRE].sort(), ["carrelage", "electricite", "maconnerie", "peinture", "plomberie"]);
eq("chaque métier a au moins 2 types d'ouvrage", M.METIERS_METRE.every((m) => M.typesDe(m).length >= 2), true);
eq("un ouvrage d'un autre métier est ignoré", M.calculer({ zones: [{ id: "z", nom: "Z", ouvrages: [{ id: "1", type: "m_mur", v: mur }] }] }, "peinture").lignes, []);
eq("zone vide : signalée", M.calculer({ zones: [{ id: "z", nom: "Cuisine", ouvrages: [] }] }, "peinture").alertes[0].texte, "Cuisine n'a encore aucun ouvrage.");
eq("métré absent : aucun plantage", M.calculer(undefined, "peinture").lignes, []);
eq("ouvrage vide de chaque type : incomplet, jamais de quantité", M.TYPES.every((t) => { const x = un(t.id, {}, t.metier); return x.lignes.length === 0 && x.manques.length > 0; }), true);
// Aucune donnée fabriquée : un ouvrage où seules les dimensions sont saisies ne produit aucune quantité de matériau.
eq("dimensions seules : aucune quantité de matériau sans donnée de l'entreprise", M.TYPES.filter((t) => !/^(pl_appareils|e_points|e_tableau|m_fouille|m_acier)$/.test(t.id)).every((t) => un(t.id, { longueur: 5, largeur: 4, hauteur: 3, epaisseur: 10, surface: 20, tuyau: "T", cable: "C" }, t.metier).lignes.filter((l) => l.tab === "produits").length === 0), true);
// Le fichier ne contient aucune valeur par défaut de rendement, dosage ou consommation.
const src = fs.readFileSync(new URL("./metiers/metre.js", import.meta.url), "utf8");
eq("aucune valeur par défaut dans les champs (def:)", /\bdef\s*:/.test(src), false);
eq("mémoire de l'entreprise : seuls les champs marqués sont gardés", M.memoDe(M.typeDe("c_sol"), sol), { carreau: "Grès 60×60", cA: 60, cB: 60, parCarton: 4, perte: 10, colle: 5, colleSac: 25, jointC: 0.5, jointSac: 5, plinthe: 60, moMode: "tache" });
eq("annexe imprimable : zone, mesure et formule", (() => { const a = M.annexe({ zones: [{ id: "z", nom: "Salon", ouvrages: [{ id: "1", type: "c_sol", v: sol }] }] }, "carrelage"); return [a[0].zone, a[0].lignes[0].mesure, a[0].lignes[0].detail]; })(), ["Salon", "Surface à carreler", "5 × 4 = 20 m²"]);

console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
