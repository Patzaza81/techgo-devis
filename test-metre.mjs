// Métré. Trois sortes de preuves :
//  A. exemples recalculables à la main (le calcul attendu est écrit en commentaire) ;
//  B. chantiers complets comparés à un SECOND CALCUL INDÉPENDANT (validation/controle.py, Python, fractions exactes) ;
//  C. propriétés vérifiées sur des centaines de dimensions tirées au hasard (l'arrondi n'est jamais trop court ni trop large).
import * as M from "./metiers/metre.js";
import fs from "fs";
let pass = 0, fail = 0;
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + n + (ok ? "" : `  obtenu=${JSON.stringify(g)} attendu=${JSON.stringify(w)}`)); };
const pres = (n, x, w, tol = 1e-6) => eq(n + (Math.abs(x - w) < tol ? "" : ` (valeur ${x})`), Math.abs(x - w) < tol, true);
let n = 0; const id = () => "o" + ++n;
const un = (type, v, metier) => M.calculer({ zones: [{ id: "z", nom: "Zone", ouvrages: [{ id: id(), type, v }] }] }, metier);
const L = (r, nom) => r.lignes.find((l) => l.nom === nom);
const mes = (r, nom) => r.zones[0].ouvrages[0].mesures.find((m) => m.nom.startsWith(nom));
const manq = (r) => r.manques.flatMap((m) => m.quoi);

// ================= A. Exemples à la main =================
eq("entier au-dessus : 2,513 → 3", M.arrSup(2.513), 3);
eq("entier au-dessus : 4 reste 4", M.arrSup(100 / 25), 4);
eq("entier au-dessus : 0,1 + 0,2 ne coûte pas une unité de plus", M.arrSup((0.1 + 0.2) * 10), 3);
eq("demi-journée au-dessus : 1,91 → 2 ; 3,03 → 3,5 ; 3 → 3", [M.arrDemi(1.9148), M.arrDemi(3.03), M.arrDemi(3)], [2, 3.5, 3]);
eq("écriture française : 1234,5", M.fr(1234.5), "1 234,5");

// ----- MAIN-D'ŒUVRE : jours de chantier, journées d'ouvrier, journées d'équipe -----
// Pièce de 47,87 m² ; l'équipe (2 ouvriers) fait 25 m² par jour : 47,87 ÷ 25 = 1,91 → 2 jours de chantier.
//   prix par ouvrier  : 2 jours × 2 ouvriers = 4 journées d'ouvrier
//   prix pour l'équipe : 2 journées d'équipe
const piece = { longueur: 4, largeur: 3, hauteur: 2.8, plafond: true, ouv: [{ n: 1, l: 0.9, h: 2.1 }, { n: 1, l: 1.2, h: 1.2 }], perte: 5,
  prod: [{ nom: "Sous-couche", couches: 1, couv: 50, u: "Pot" }, { nom: "Peinture acrylique", couches: 2, couv: 40, u: "Pot" }], moMode: "ouvrier", moRend: 25, moOuv: 2 };
let r = un("p_piece", piece, "peinture");
let mo = L(r, "Travaux de peinture — 2 ouvriers");
eq("par ouvrier : 4 journées d'ouvrier", [mo.qty, mo.unite, mo.tab], [4, "journée d'ouvrier", "ouvriers"]);
eq("par ouvrier : l'explication donne les jours de chantier puis × ouvriers", /47,87 m² ÷ 25 m² par jour pour l'équipe = 1,91 jour de chantier/.test(mo.detail) && /→ 2 jours de chantier \(demi-journée au-dessus\) × 2 ouvriers = 4 journées d'ouvrier/.test(mo.detail), true);
eq("par ouvrier : le prix attendu est dit", /celui d'UN ouvrier pour UNE journée/.test(mo.detail), true);
r = un("p_piece", { ...piece, moMode: "equipe" }, "peinture"); mo = L(r, "Travaux de peinture — équipe de 2");
eq("pour l'équipe : 2 journées d'équipe", [mo.qty, mo.unite], [2, "journée d'équipe"]);
eq("pour l'équipe : le prix attendu est dit", /celui de TOUTE l'équipe pour une journée/.test(mo.detail) && /= 2 journées d'équipe/.test(mo.detail), true);
eq("une seule ligne de main-d'œuvre par ouvrage, quel que soit le mode", ["tache", "ouvrier", "equipe"].map((m) => un("p_piece", { ...piece, moMode: m }, "peinture").lignes.filter((l) => l.tab === "ouvriers").length), [1, 1, 1]);
// Même coût dans les deux modes si le prix de l'équipe = nombre d'ouvriers × prix d'un ouvrier : aucun double comptage.
{ let ok = true; for (let i = 0; i < 300; i++) { const rend = 5 + (i * 7) % 60, ouv = 1 + (i % 6), s = 10 + (i * 13) % 400; const a = un("p_libre", { surface: s, prod: [{ nom: "P", couv: 10 }], moMode: "ouvrier", moRend: rend, moOuv: ouv }, "peinture").lignes.find((l) => l.tab === "ouvriers"), b = un("p_libre", { surface: s, prod: [{ nom: "P", couv: 10 }], moMode: "equipe", moRend: rend, moOuv: ouv }, "peinture").lignes.find((l) => l.tab === "ouvriers"); if (a.qty !== b.qty * ouv || a.jours !== b.jours) ok = false; } eq("300 tirages : journées d'ouvrier = journées d'équipe × ouvriers, toujours", ok, true); }
eq("chaque ouvrier est payé le même nombre de jours (jamais 1,33 jour) : 1,3 jour × 3 → 1,5 × 3 = 4,5", un("p_libre", { surface: 13, prod: [{ nom: "P", couv: 10 }], moMode: "ouvrier", moRend: 10, moOuv: 3 }, "peinture").lignes.find((l) => l.tab === "ouvriers").qty, 4.5);
eq("à la tâche : quantité = surface (et non surface × couches)", [L(un("p_piece", { ...piece, moMode: "tache" }, "peinture"), "Travaux de peinture").qty, L(un("p_piece", { ...piece, moMode: "tache" }, "peinture"), "Travaux de peinture").unite], [47.87, "m²"]);
eq("ancien mode « jour » (v32) lu comme « par ouvrier »", un("p_piece", { ...piece, moMode: "jour" }, "peinture").lignes.find((l) => l.tab === "ouvriers").qty, 4);
eq("par ouvrier sans effectif : refusé", manq(un("p_piece", { ...piece, moOuv: null }, "peinture")), ["le nombre d'ouvriers de l'équipe"]);
eq("par ouvrier, 2,5 ouvriers : refusé", manq(un("p_piece", { ...piece, moOuv: 2.5 }, "peinture")), ["le nombre d'ouvriers de l'équipe (nombre entier, 1 ou plus)"]);
eq("pour l'équipe sans effectif : accepté (l'effectif ne sert pas au calcul)", L(un("p_piece", { ...piece, moMode: "equipe", moOuv: null }, "peinture"), "Travaux de peinture — équipe").qty, 2);
eq("sans rendement : refusé", manq(un("p_piece", { ...piece, moRend: null }, "peinture")), ["ce que toute l'équipe fait en une journée (m²)"]);
// Deux zones, même prestation : 30 ÷ 25 = 1,2 jour chacune → 2,4 → 2,5 jours × 2 = 5 (et non 1,5 + 1,5 = 3 jours × 2 = 6).
const z2 = (v1, v2, t = "p_libre", met = "peinture") => M.calculer({ zones: [{ id: "a", nom: "A", ouvrages: [{ id: "1", type: t, v: v1 }] }, { id: "b", nom: "B", ouvrages: [{ id: "2", type: t, v: v2 }] }] }, met);
const lib = { surface: 30, prod: [{ nom: "P", couv: 10 }], moMode: "ouvrier", moRend: 25, moOuv: 2 };
r = z2(lib, lib);
eq("deux zones : jours de chantier additionnés avant l'arrondi (5 journées, pas 6)", r.lignes.find((l) => l.tab === "ouvriers").qty, 5);
eq("durée du chantier : 2,5 jours", M.dureeEquipe({ zones: [{ id: "a", nom: "A", ouvrages: [{ id: "1", type: "p_libre", v: lib }] }, { id: "b", nom: "B", ouvrages: [{ id: "2", type: "p_libre", v: lib }] }] }, "peinture"), 2.5);
r = z2(lib, { ...lib, moOuv: 3 });
eq("deux équipes de taille différente : deux lignes distinctes, jamais mélangées", r.lignes.filter((l) => l.tab === "ouvriers").map((l) => [l.nom, l.qty]), [["Travaux de peinture — 2 ouvriers", 3], ["Travaux de peinture — 3 ouvriers", 4.5]]);
r = z2(lib, { ...lib, moMode: "equipe" });
eq("un ouvrage par ouvrier, un autre pour l'équipe : deux lignes, deux unités", r.lignes.filter((l) => l.tab === "ouvriers").map((l) => l.unite), ["journée d'ouvrier", "journée d'équipe"]);

// ----- PEINTURE -----
// Murs 2 × (4+3) × 2,8 = 39,2 − (1,89 + 1,44) = 35,87 ; plafond 12 ; 47,87 m².
// Peinture 2 couches, 40 m²/pot, 5 % : 47,87 × 2 × 1,05 = 100,527 ÷ 40 = 2,51 → 3. Sous-couche : 50,26 ÷ 50 = 1,005 → 2.
r = un("p_piece", piece, "peinture");
pres("peinture : murs 35,87 m²", mes(r, "Murs").val, 35.87); pres("peinture : total 47,87 m²", mes(r, "Surface à peindre").val, 47.87);
eq("peinture : 3 pots et 2 pots de sous-couche", [L(r, "Peinture acrylique").qty, L(r, "Sous-couche").qty], [3, 2]);
eq("peinture : formule écrite", /47,87 m² × 2 couches \+ 5 % de pertes = 100,53 m² à couvrir ÷ 40 m² par pot = 2,51/.test(L(r, "Peinture acrylique").detail) && /→ 3 Pot \(entier au-dessus\)/.test(L(r, "Peinture acrylique").detail), true);
eq("peinture : quantité marquée « estimation » (dépend du support)", /Estimation/.test(L(r, "Peinture acrylique").detail), true);
eq("peinture sans plafond : 2 pots", L(un("p_piece", { ...piece, plafond: false }, "peinture"), "Peinture acrylique").qty, 2);
// 4 portes 0,9 × 2,1 sur 2 faces = 15,12 m² ; avec un vitrage 0,3 × 0,5 par porte et par face : 15,12 − 8 × 0,15 = 13,92.
pres("portes 2 faces : 15,12 m²", mes(un("p_surface", { longueur: 0.9, hauteur: 2.1, nombre: 4, faces: 2, prod: [{ nom: "Laque", couv: 10 }] }, "peinture"), "Surface").val, 15.12);
pres("portes 2 faces avec vitrage : l'ouverture est déduite sur chaque face de chaque porte (13,92)", mes(un("p_surface", { longueur: 0.9, hauteur: 2.1, nombre: 4, faces: 2, ouv: [{ n: 1, l: 0.3, h: 0.5 }], prod: [{ nom: "Laque", couv: 10 }] }, "peinture"), "Surface").val, 13.92);
eq("sans couverture : pas de ligne, manque nommé", [L(un("p_piece", { ...piece, prod: [{ nom: "X", couches: 2, couv: null, u: "Pot" }] }, "peinture"), "X"), manq(un("p_piece", { ...piece, prod: [{ nom: "X", couches: 2, couv: null, u: "Pot" }] }, "peinture"))], [undefined, ["la surface couverte par pot de « X »"]]);
eq("1,5 couche : refusé", manq(un("p_piece", { ...piece, prod: [{ nom: "X", couches: 1.5, couv: 40 }] }, "peinture")), ["le nombre de couches de « X » (nombre entier, 1 ou plus)"]);
eq("couches vides : 1 couche", L(un("p_libre", { surface: 40, prod: [{ nom: "X", couv: 40 }] }, "peinture"), "X").qty, 1);
eq("sans hauteur / sans produit", [manq(un("p_piece", { ...piece, hauteur: null }, "peinture")), manq(un("p_piece", { ...piece, prod: [] }, "peinture"))], [["la hauteur"], ["au moins un produit à appliquer"]]);
eq("dimension négative : refusée", manq(un("p_piece", { ...piece, longueur: -4 }, "peinture")), ["la longueur"]);
eq("pertes 150 % ou −5 % : refusées", [manq(un("p_piece", { ...piece, perte: 150 }, "peinture")).length > 0, manq(un("p_piece", { ...piece, perte: -5 }, "peinture")).length > 0], [true, true]);
eq("pertes 0 ou vides : même résultat", L(un("p_piece", { ...piece, perte: 0 }, "peinture"), "Peinture acrylique").qty, L(un("p_piece", { ...piece, perte: null }, "peinture"), "Peinture acrylique").qty);
// Ouvertures
r = un("p_piece", { ...piece, ouv: [{ n: 30, l: 1, h: 2 }] }, "peinture");
eq("ouvertures plus grandes que les murs : alerte, aucune quantité", [r.lignes.length, r.alertes.length > 0], [0, true]);
eq("ouverture sans hauteur : signalée", manq(un("p_piece", { ...piece, ouv: [{ n: 1, l: 0.9, h: null }] }, "peinture")), ["la largeur et la hauteur de chaque ouverture"]);
pres("« 0 porte » : rien n'est déduit (et non 1 porte)", mes(un("p_piece", { ...piece, plafond: false, ouv: [{ n: 0, l: 0.9, h: 2.1 }] }, "peinture"), "Murs").val, 39.2);
pres("nombre d'ouvertures vide : 1", mes(un("p_piece", { ...piece, plafond: false, ouv: [{ l: 0.9, h: 2.1 }] }, "peinture"), "Murs").val, 39.2 - 1.89);
eq("1,5 porte : refusé", manq(un("p_piece", { ...piece, ouv: [{ n: 1.5, l: 0.9, h: 2.1 }] }, "peinture")), ["le nombre d'ouvertures (nombre entier, 1 ou plus)"]);
eq("porte de 3,2 m dans un mur de 2,8 m : alerte", un("p_piece", { ...piece, ouv: [{ n: 1, l: 0.9, h: 3.2 }] }, "peinture").alertes.some((a) => /plus haute que la paroi/.test(a.texte)), true);
eq("ligne d'ouverture vide : ignorée", manq(un("p_piece", { ...piece, ouv: [{}, { n: 1, l: 0.9, h: 2.1 }] }, "peinture")), []);
eq("0 surface identique / 3 faces : refusés", [manq(un("p_surface", { longueur: 2, hauteur: 2, nombre: 0, prod: [{ nom: "P", couv: 10 }] }, "peinture")), manq(un("p_surface", { longueur: 2, hauteur: 2, faces: 3, prod: [{ nom: "P", couv: 10 }] }, "peinture"))], [["le nombre de surfaces (nombre entier, 1 ou plus)"], ["1 ou 2 faces"]]);

// ----- CARRELAGE -----
// Sol 5 × 4 = 20 m² ; 60 × 60 par 4 = 1,44 m²/carton ; 10 % : 22 ÷ 1,44 = 15,28 → 16.
// Colle 5 kg/m² : 100 kg ÷ 25 = 4 sacs (sur la surface posée, sans la casse). Joint 0,5 : 10 ÷ 5 = 2.
// Plinthes : 18 − 0,9 = 17,1 ml ; + 10 % = 18,81 ÷ 0,6 = 31,35 → 32.
const sol = { longueur: 5, largeur: 4, carreau: "Grès 60×60", cA: 60, cB: 60, parCarton: 4, perte: 10, colle: 5, colleSac: 25, jointC: 0.5, jointSac: 5, plinthes: true, portes: 0.9, plinthe: 60, perteP: 10, moMode: "tache" };
r = un("c_sol", sol, "carrelage");
eq("sol : 16 cartons, 4 sacs de colle, 2 de joint, 32 plinthes, 20 m² de pose", [L(r, "Grès 60×60").qty, L(r, "Colle à carrelage").qty, L(r, "Joint de carrelage").qty, L(r, "Plinthes").qty, L(r, "Pose de carrelage").qty], [16, 4, 2, 32, 20]);
eq("sol : formule du carton", /22 m² ÷ 1,44 m² par carton \(4 carreaux de 60 × 60 cm\) = 15,28/.test(L(r, "Grès 60×60").detail), true);
eq("cartons : quantité exacte (pas marquée estimation) ; colle : estimation", [/Estimation/.test(L(r, "Grès 60×60").detail), /Estimation/.test(L(r, "Colle à carrelage").detail)], [false, true]);
eq("plinthes sans coupes : 17,1 ÷ 0,6 = 28,5 → 29", L(un("c_sol", { ...sol, perteP: null }, "carrelage"), "Plinthes").qty, 29);
eq("pile un nombre entier de cartons : 4,32 m² ÷ 1,44 = 3 (pas 4)", L(un("c_libre", { surface: 4.32, cA: 60, cB: 60, parCarton: 4, colle: 1, colleSac: 1, jointC: 1, jointSac: 1 }, "carrelage"), "Carreaux").qty, 3);
eq("vendu au m² : 20 × 1,10 = 22 m², sans format ni carton", [L(un("c_sol", { ...sol, vente: "m²", cA: null, cB: null, parCarton: null }, "carrelage"), "Grès 60×60").qty, L(un("c_sol", { ...sol, vente: "m²", cA: null, cB: null, parCarton: null }, "carrelage"), "Grès 60×60").unite], [22, "m²"]);
r = M.calculer({ zones: [{ id: "a", nom: "Salon", ouvrages: [{ id: "1", type: "c_sol", v: sol }] }, { id: "b", nom: "Chambre", ouvrages: [{ id: "2", type: "c_sol", v: { ...sol, longueur: 5.001 } }] }] }, "carrelage");
eq("deux zones : 31 cartons (15,28 + 15,28 = 30,56), pas 16 + 16 = 32", [L(r, "Grès 60×60").qty, /Salon/.test(L(r, "Grès 60×60").detail) && /Chambre/.test(L(r, "Grès 60×60").detail) && /Total : /.test(L(r, "Grès 60×60").detail)], [31, true]);
// Faïence : 7 × 2 − 0,8 × 2 = 12,4 m² ; 25 × 40 par 15 = 1,5 m² ; 8,27 → 9.
r = un("c_mur", { longueur: 7, hauteur: 2, ouv: [{ n: 1, l: 0.8, h: 2 }], cA: 25, cB: 40, parCarton: 15 }, "carrelage");
eq("faïence : 9 cartons ; colle et joint absents signalés", [L(r, "Carreaux").qty, r.alertes.length], [9, 2]);
eq("sans format : manque nommé", manq(un("c_sol", { longueur: 5, largeur: 4 }, "carrelage")), ["la longueur d'un carreau (cm)", "la largeur d'un carreau (cm)", "le nombre de carreaux par carton"]);
eq("4,5 carreaux par carton : refusé", manq(un("c_sol", { ...sol, parCarton: 4.5 }, "carrelage")).includes("le nombre de carreaux par carton (nombre entier, 1 ou plus)"), true);
eq("colle sans poids de sac", manq(un("c_sol", { ...sol, colleSac: null }, "carrelage")), ["le poids d'un sac de colle (kg)"]);
eq("surface à déduire plus grande que la pièce : aucune quantité", un("c_sol", { ...sol, deduire: 25 }, "carrelage").lignes.length, 0);
eq("portes plus larges que le tour de la pièce : plinthes refusées, le reste calculé", (() => { const x = un("c_sol", { ...sol, portes: 30 }, "carrelage"); return [L(x, "Plinthes"), L(x, "Grès 60×60").qty]; })(), [undefined, 16]);
eq("carreau saisi en mètres (0,6) : alerte d'unité", un("c_sol", { ...sol, cA: 0.6, cB: 0.6 }, "carrelage").alertes.some((a) => /centimètres/.test(a.texte)), true);
eq("même pièce saisie deux fois dans une zone : alerte", M.calculer({ zones: [{ id: "a", nom: "Salon", ouvrages: [{ id: "1", type: "c_sol", v: sol }, { id: "2", type: "c_sol", v: sol }] }] }, "carrelage").alertes.some((a) => /compté deux fois/.test(a.texte)), true);

// ----- MAÇONNERIE -----
// Mur 10 × 3 = 30 m² ; bloc 40 × 20 × 15, joint 1 : 1 ÷ (0,41 × 0,21) = 11,614 ; × 30 = 348,43 ; + 5 % = 365,85 → 366.
// Joints : 1 − 800 ÷ 861 = 7,085 % ; 30 × 0,15 × 0,07085 = 0,3188 m³ ; 350 kg/m³ : 111,58 kg ÷ 50 = 2,23 → 3 sacs ; sable 0,32 m³.
const mur = { longueur: 10, hauteur: 3, blocNom: "Parpaing de 15", blocL: 40, blocH: 20, blocE: 15, joint: 1, perte: 5, mortier: true, ciment: 350, sac: 50, sable: 1, moMode: "ouvrier", moRend: 10, moOuv: 3 };
r = un("m_mur", mur, "maconnerie");
pres("mur : 11,614 blocs par m²", mes(r, "Blocs par m²").val, 1 / (0.41 * 0.21));
pres("mur : 0,3188 m³ de joints", mes(r, "Mortier des joints").val, 30 * 0.15 * (1 - 800 / 861));
eq("mur : 366 blocs, 3 sacs, 0,32 m³ de sable, 9 journées d'ouvrier", [L(r, "Parpaing de 15").qty, L(r, "Ciment").qty, L(r, "Sable").qty, L(r, "Élévation de mur — 3 ouvriers").qty], [366, 3, 0.32, 9]);
eq("mur : le volume de mortier est nommé « estimation géométrique »", [mes(r, "Mortier des joints").nom, mes(r, "Mortier des joints").est], ["Mortier des joints (estimation géométrique)", true]);
eq("mur : blocs exacts, ciment et sable marqués estimation", [/Estimation/.test(L(r, "Parpaing de 15").detail), /Estimation/.test(L(r, "Ciment").detail), /Estimation/.test(L(r, "Sable").detail)], [false, true, true]);
// Contrôle par un autre chemin : le mur fait 30 × 0,15 = 4,5 m³ ; les blocs seuls (sans casse) 348,43 × 0,4 × 0,2 × 0,15 = 4,1812 m³ ; reste 0,3188 m³.
pres("mur : volume du mur − volume des blocs = volume des joints", 30 * 0.15 - (30 / (0.41 * 0.21)) * 0.4 * 0.2 * 0.15, mes(r, "Mortier des joints").val);
eq("mortier non demandé : blocs seuls, aucun sac", (() => { const x = un("m_mur", { ...mur, mortier: false }, "maconnerie"); return [L(x, "Parpaing de 15").qty, L(x, "Ciment"), manq(x)]; })(), [366, undefined, []]);
eq("mortier demandé sans dosage : blocs calculés, dosage réclamé, aucun sac inventé", (() => { const x = un("m_mur", { ...mur, ciment: null, sac: null, sable: null }, "maconnerie"); return [L(x, "Parpaing de 15").qty, L(x, "Ciment"), manq(x).length]; })(), [366, undefined, 3]);
eq("pertes de mortier 20 % : 0,3826 m³ → 133,9 kg → 3 sacs", (() => { const x = un("m_mur", { ...mur, perteM: 20 }, "maconnerie"); return [Math.round(mes(x, "Mortier des joints").val * 1000) / 1000, L(x, "Ciment").qty]; })(), [0.383, 3]);
// Pose à sec (joint 0) : 1 ÷ (0,4 × 0,2) = 12,5 blocs/m² ; 30 × 12,5 × 1,05 = 393,75 → 394 ; aucun mortier.
eq("joint 0 : 394 blocs, volume de joints nul, ni ciment ni sable dans le devis", (() => { const x = un("m_mur", { ...mur, joint: 0 }, "maconnerie"); return [L(x, "Parpaing de 15").qty, mes(x, "Mortier des joints").val, L(x, "Ciment"), L(x, "Sable")]; })(), [394, 0, undefined, undefined]);
eq("joint plus épais que le bloc / bloc saisi en mètres : alertes d'unité", [un("m_mur", { ...mur, joint: 25 }, "maconnerie").alertes.length > 0, un("m_mur", { ...mur, longueur: 0.3, blocL: 40 }, "maconnerie").alertes.some((a) => /plus grand que le mur/.test(a.texte))], [true, true]);
pres("mur avec porte 0,9 × 2,1 : 28,11 m²", mes(un("m_mur", { ...mur, ouv: [{ n: 1, l: 0.9, h: 2.1 }] }, "maconnerie"), "Surface de mur").val, 28.11);
// Béton : 6 poteaux de 3 m, 20 × 20 cm = 0,72 m³ ; 350 kg/m³ : 252 kg = 5,04 → 6 sacs ; sable 0,4 → 0,29 ; gravier 0,8 → 0,58.
const pot = { nom: "Poteaux RDC", nombre: 6, longueur: 3, largeur: 20, epaisseur: 20, ciment: 350, sac: 50, sable: 0.4, gravier: 0.8 };
r = un("m_beton", pot, "maconnerie");
eq("béton : 0,72 m³, 6 sacs, 0,29 m³ de sable, 0,58 m³ de gravier", [M.arrDec(mes(r, "Volume de béton").val), L(r, "Ciment").qty, L(r, "Sable").qty, L(r, "Gravier").qty], [0.72, 6, 0.29, 0.58]);
eq("béton avec 5 % de pertes : 0,756 m³ → 264,6 kg → 6 sacs ; main-d'œuvre sur le volume en place (0,72)", (() => { const x = un("m_beton", { ...pot, perte: 5, moMode: "tache" }, "maconnerie"); return [L(x, "Ciment").qty, L(x, "Coulage de béton").qty]; })(), [6, 0.72]);
eq("béton : gravier ou dosage manquant → réclamé, jamais inventé", [manq(un("m_beton", { ...pot, gravier: null }, "maconnerie")), un("m_beton", { ...pot, ciment: null }, "maconnerie").lignes.some((l) => l.nom === "Ciment")], [["le gravier par m³ de béton (m³)"], false]);
eq("béton : section saisie en mètres ou longueur en centimètres → alerte", [un("m_beton", { ...pot, longueur: 0.3, epaisseur: 300 }, "maconnerie").alertes.length > 0, un("m_beton", { ...pot, longueur: 0.1 }, "maconnerie").alertes.length > 0, un("m_beton", pot, "maconnerie").alertes.length], [true, true, 0]);
eq("béton : 0 élément refusé", manq(un("m_beton", { ...pot, nombre: 0 }, "maconnerie")), ["le nombre d'éléments (nombre entier, 1 ou plus)"]);
r = M.calculer({ zones: [{ id: "a", nom: "RDC", ouvrages: [{ id: "1", type: "m_mur", v: mur }, { id: "2", type: "m_beton", v: pot }] }] }, "maconnerie");
eq("mur + poteaux : ciment 2,23 + 5,04 = 7,27 → 8 sacs (pas 3 + 6 = 9)", L(r, "Ciment").qty, 8);
// Chape 5 × 4 × 5 cm = 1 m³ ; 300 kg/m³ → 6 sacs ; sable 1 m³ ; pas de gravier.
r = un("m_chape", { longueur: 5, largeur: 4, epaisseur: 5, ciment: 300, sac: 50, sable: 1, moMode: "tache" }, "maconnerie");
eq("chape : 6 sacs, 1 m³ de sable, pas de gravier, 20 m²", [L(r, "Ciment").qty, L(r, "Sable").qty, L(r, "Gravier"), L(r, "Réalisation de chape").qty], [6, 1, undefined, 20]);
// Enduit 10 × 3, 2 faces, 1,5 cm : 60 m² × 0,015 = 0,9 m³ ; 300 kg/m³ = 270 kg → 5,4 → 6 sacs.
r = un("m_enduit", { longueur: 10, hauteur: 3, faces: 2, epaisseur: 1.5, ciment: 300, sac: 50, sable: 1 }, "maconnerie");
eq("enduit : 60 m², 0,9 m³ (estimation), 6 sacs", [mes(r, "Surface à enduire").val, M.arrDec(mes(r, "Volume d'enduit").val), mes(r, "Volume d'enduit").est, L(r, "Ciment").qty], [60, 0.9, true, 6]);
eq("fouille : 8 × 1 × 1 × 0,8 = 6,4 m³", L(un("m_fouille", { nombre: 8, longueur: 1, largeur: 1, profondeur: 0.8, moMode: "tache" }, "maconnerie"), "Fouilles").qty, 6.4);
// Armatures par DÉCOUPE. 6 poteaux de 3 m, 4 filants de 3 + 0,5 = 3,5 m : 24 pièces ; 12 ÷ 3,5 = 3,43 → 3 pièces par barre ; 24 ÷ 3 = 8 barres.
// (84 ml ÷ 12 m donnerait 7 barres : impossible à découper, il manquerait 3 pièces.)
// Cadres tous les 15 cm : 3 ÷ 0,15 = 20 intervalles + 1 = 21 × 6 = 126 ; 12 ÷ 0,70 = 17,14 → 17 par barre ; 126 ÷ 17 = 7,41 → 8.
const acier = { nombre: 6, longueur: 3, filNom: "Fer de 12", filN: 4, filRec: 0.5, cadNom: "Fer de 6", cadEsp: 15, cadDev: 70, barre: 12 };
r = un("m_acier", acier, "maconnerie");
eq("armatures : 8 barres de 12 (découpe, pas 7), 8 barres de 6, 126 cadres", [L(r, "Fer de 12").qty, L(r, "Fer de 6").qty, mes(r, "Cadres").val], [8, 8, 126]);
eq("armatures : la découpe est expliquée", /24 pièces de 3,5 m ; 3 pièces entières par barre de 12 m/.test(L(r, "Fer de 12").detail), true);
eq("armatures : pièce de 3 m dans une barre de 12 m = 4 par barre, pile (24 pièces → 6 barres)", L(un("m_acier", { ...acier, filRec: 0 }, "maconnerie"), "Fer de 12").qty, 6);
eq("armatures : pièce de 6 m → 2 par barre (10 pièces → 5 barres) ; 6,01 m → 1 par barre (10 barres)", [L(un("m_acier", { nombre: 10, longueur: 6, filN: 1, barre: 12 }, "maconnerie"), "Fer à béton (filants)").qty, L(un("m_acier", { nombre: 10, longueur: 6.01, filN: 1, barre: 12 }, "maconnerie"), "Fer à béton (filants)").qty], [5, 10]);
r = un("m_acier", { nombre: 2, longueur: 14, filN: 4, barre: 12 }, "maconnerie");
eq("armatures : pièce plus longue que la barre → alerte « recouvrements », quantité marquée estimation basse", [r.alertes.some((a) => /recouvrements/.test(a.texte)), L(r, "Fer à béton (filants)").qty, /Estimation basse/.test(L(r, "Fer à béton (filants)").detail)], [true, 10, true]);
eq("armatures : rien du plan / 2,5 barres → refusé", [manq(un("m_acier", { longueur: 3 }, "maconnerie")), manq(un("m_acier", { ...acier, filN: 2.5 }, "maconnerie"))], [["le nombre de barres filantes ou les cadres (lus sur le plan)"], ["le nombre de barres filantes (nombre entier, 1 ou plus)"]]);
eq("armatures : sans longueur de barre du commerce → réclamée", manq(un("m_acier", { ...acier, barre: null }, "maconnerie")).includes("la longueur d'une barre du commerce (m)"), true);

// ----- PLOMBERIE -----
// 23 m, 10 % = 25,3 ml ÷ 4 = 6,33 → 7 barres. Colliers tous les 80 cm : 28,75 → 29 intervalles + 1 = 30.
const res = { tuyau: "Tube PVC Ø100", longueur: 23, perte: 10, vente: "Barre", barre: 4, colEsp: 80, art: [{ nom: "Coude 87° Ø100", n: 6 }, { nom: "Té Ø100", n: 2 }], moMode: "tache" };
r = un("pl_reseau", res, "plomberie");
eq("réseau : 7 barres, 30 colliers, 6 coudes, 2 tés, pose 23 ml (sans les chutes)", [L(r, "Tube PVC Ø100").qty, L(r, "Colliers pour Tube PVC Ø100").qty, L(r, "Coude 87° Ø100").qty, L(r, "Té Ø100").qty, L(r, "Pose de tuyauterie").qty], [7, 30, 6, 2, 23]);
eq("colliers : marqués estimation ; barres : exactes", [/Estimation/.test(L(r, "Colliers pour Tube PVC Ø100").detail), /Estimation/.test(L(r, "Tube PVC Ø100").detail)], [true, false]);
eq("au mètre : 25,3 → 26 m ; couronne de 50 m : 1", [L(un("pl_reseau", { ...res, vente: "Mètre" }, "plomberie"), "Tube PVC Ø100").qty, L(un("pl_reseau", { ...res, vente: "Couronne", barre: 50 }, "plomberie"), "Tube PVC Ø100").qty], [26, 1]);
eq("8 m pile en barres de 4 m sans chutes : 2 barres (pas 3)", L(un("pl_reseau", { ...res, longueur: 8, perte: null }, "plomberie"), "Tube PVC Ø100").qty, 2);
eq("colliers : tracé de 0,5 m, un tous les 80 cm → 2 ; espacement 0 → refusé ; vide → aucun", [L(un("pl_reseau", { ...res, longueur: 0.5 }, "plomberie"), "Colliers pour Tube PVC Ø100").qty, manq(un("pl_reseau", { ...res, colEsp: 0 }, "plomberie")), L(un("pl_reseau", { ...res, colEsp: null }, "plomberie"), "Colliers pour Tube PVC Ø100")], [2, ["un espacement de colliers supérieur à zéro (cm)"], undefined]);
eq("sans raccord : alerte ; sans diamètre : incomplet ; 2,5 coudes : refusé", [un("pl_reseau", { ...res, art: [] }, "plomberie").alertes.length, manq(un("pl_reseau", { ...res, tuyau: "" }, "plomberie")), manq(un("pl_reseau", { ...res, art: [{ nom: "Coude", n: 2.5 }] }, "plomberie"))], [1, ["le type et le diamètre du tuyau"], ["la quantité de « Coude » (nombre entier, 1 ou plus)"]]);
r = un("pl_appareils", { art: [{ nom: "WC", n: 2 }, { nom: "Lavabo", n: 3 }], acc: [{ nom: "Flexible", n: 8 }], moMode: "tache" }, "plomberie");
eq("appareils : 5 points, pose par point, accessoires hors points", [mes(r, "Points d'eau").val, L(r, "Pose des appareils").qty, L(r, "Pose des appareils").unite, L(r, "Flexible").qty], [5, 5, "point", 8]);
r = M.calculer({ zones: [{ id: "a", nom: "RDC", ouvrages: [{ id: "1", type: "pl_reseau", v: res }] }, { id: "b", nom: "Étage", ouvrages: [{ id: "2", type: "pl_reseau", v: { ...res, longueur: 10, art: [{ nom: "Té Ø100", n: 1 }] } }] }] }, "plomberie");
eq("deux zones : 6,325 + 2,75 = 9,08 → 10 barres ; 3 tés ; colliers 30 + 14 = 44", [L(r, "Tube PVC Ø100").qty, L(r, "Té Ø100").qty, L(r, "Colliers pour Tube PVC Ø100").qty], [10, 3, 44]);
eq("plomberie : diamètres, pentes et pression laissés au plombier (note)", /rien de cela n'est calculé/.test(M.typeDe("pl_reseau").note), true);

// ----- ÉLECTRICITÉ -----
// 2 lignes de 18 m, 6 raccordements × 0,3 m : (18 + 1,8) × 2 = 39,6 ; + 10 % = 43,56 ml → 1 rouleau de 100 m. Conduit : 36 × 1,1 = 39,6 ÷ 25 = 1,58 → 2.
const lig = { cable: "Câble 3G2,5", nombre: 2, longueur: 18, reserve: 0.3, racc: 6, perte: 10, rouleau: 100, conduit: "Gaine ICTA Ø20", rouleauC: 25, moMode: "tache" };
r = un("e_ligne", lig, "electricite");
pres("ligne : 43,56 ml de câble", mes(r, "Câble").val, 43.56); pres("ligne : 39,6 ml de conduit (sans les longueurs de raccordement)", mes(r, "Conduit").val, 39.6);
eq("ligne : 1 rouleau de câble, 2 de gaine, tirage 36 ml", [L(r, "Câble 3G2,5").qty, L(r, "Gaine ICTA Ø20").qty, L(r, "Tirage de câble").qty], [1, 2, 36]);
pres("3 fils tirés séparément sur 12 m : 36 ml de fil, 12 ml de conduit", mes(un("e_ligne", { cable: "Fil 1,5", longueur: 12, fils: 3, rouleau: 100, conduit: "G", rouleauC: 25 }, "electricite"), "Câble").val, 36);
pres("3 fils : le conduit n'est pas multiplié par le nombre de fils", mes(un("e_ligne", { cable: "Fil 1,5", longueur: 12, fils: 3, rouleau: 100, conduit: "G", rouleauC: 25 }, "electricite"), "Conduit").val, 12);
eq("longueur de raccordement sans nombre de raccordements : incomplet ; 2,5 raccordements : refusé", [manq(un("e_ligne", { ...lig, racc: null }, "electricite")), manq(un("e_ligne", { ...lig, racc: 2.5 }, "electricite"))], [["le nombre de raccordements"], ["le nombre de raccordements (nombre entier, 1 ou plus)"]]);
eq("aucune longueur de raccordement : alerte", un("e_ligne", { ...lig, reserve: null, racc: null }, "electricite").alertes.some((a) => /raccordements/.test(a.texte)), true);
eq("ligne de 120 m avec des rouleaux de 100 m : alerte (pas de raccord dans un conduit)", un("e_ligne", { ...lig, longueur: 120 }, "electricite").alertes.some((a) => /plus longue qu'un rouleau/.test(a.texte)), true);
eq("sans conduit : aucune ligne de conduit ; conduit sans longueur de rouleau : réclamée", [un("e_ligne", { ...lig, conduit: "" }, "electricite").lignes.length, manq(un("e_ligne", { ...lig, rouleauC: null }, "electricite"))], [2, ["la longueur d'un rouleau ou d'une barre de conduit (m)"]]);
eq("section, calibre, différentiels, terre : jamais calculés (notes des 3 ouvrages)", [/ne sont pas calculés/.test(M.typeDe("e_ligne").note), /électricien qualifié/.test(M.typeDe("e_tableau").note), /électricien qualifié/.test(M.typeDe("e_points").note)], [true, true, true]);
eq("aucun champ ne demande ni ne propose une section, un calibre ou une intensité", M.typesDe("electricite").flatMap((t) => t.champs).some((c) => /calibre|intensit|ampère|mm²/i.test(c.l) && c.t === "n"), false);
r = un("e_points", { art: [{ nom: "Prise 2P+T", n: 8 }, { nom: "Interrupteur simple", n: 4 }], boites: true, moMode: "tache" }, "electricite");
eq("points : 12 boîtes, 12 points de pose", [L(r, "Boîte d'encastrement").qty, L(r, "Pose des points électriques").qty], [12, 12]);
r = un("e_tableau", { art: [{ nom: "Disjoncteur 16 A", n: 6 }, { nom: "Coffret 13 modules", n: 1 }], moMode: "tache" }, "electricite");
eq("tableau : articles comptés, câblage au forfait", [L(r, "Disjoncteur 16 A").qty, L(r, "Câblage du tableau").qty, L(r, "Câblage du tableau").unite], [6, 1, "forfait"]);

// ================= B. Chantiers complets : second calcul indépendant =================
const CAS = JSON.parse(fs.readFileSync(new URL("./validation/cas.json", import.meta.url), "utf8")), ATT = JSON.parse(fs.readFileSync(new URL("./validation/attendus.json", import.meta.url), "utf8"));
for (const [met, c] of Object.entries(CAS)) {
  const metre = { zones: c.zones.map((z, i) => ({ id: "z" + i, nom: z.nom, ouvrages: z.ouvrages.map((o, j) => ({ id: `o${i}_${j}`, type: o.type, v: o.v })) })) };
  const res2 = M.calculer(metre, met), obtenu = Object.fromEntries(res2.lignes.map((l) => [`${l.nom} [${l.unite}]`, l.qty]));
  eq(`chantier ${met} (« ${c.titre} ») : ${Object.keys(ATT[met]).length} quantités identiques au calcul indépendant`, Object.fromEntries(Object.entries(obtenu).sort()), Object.fromEntries(Object.entries(ATT[met]).sort()));
  eq(`chantier ${met} : rien ne manque`, res2.manques, []);
  // Cumul : la quantité du devis n'est jamais inférieure au besoin réel additionné, ni supérieure à la somme des arrondis par ouvrage.
  eq(`chantier ${met} : cumul entre zones cohérent`, res2.lignes.every((l) => { const base = l.mult ? l.qty / l.mult : l.qty, parOuvrage = l.parts.reduce((s, p) => s + (l.arr === "sup" ? M.arrSup(p.brut) : l.arr === "demi" ? M.arrDemi(p.brut) : p.brut + 0.005), 0); return base + 0.005 >= l.brut - 1e-9 && base <= parOuvrage + 1e-9; }), true);
}

// ================= C. Propriétés sur des dimensions tirées au hasard =================
let g = 12345; const alea = (a, b, pas = 0.05) => { g = (g * 1103515245 + 12345) % 2147483648; return Math.round((a + (g / 2147483648) * (b - a)) / pas) * pas; };
{ let ok = true, pire = "";
  for (let i = 0; i < 400; i++) {
    const Lg = alea(1, 12), la = alea(1, 9), a = [20, 25, 30, 33, 40, 45, 60, 80][i % 8], b = [20, 25, 30, 33, 40, 45, 60, 120][(i * 3) % 8], pc = 2 + (i % 12), pe = i % 16;
    const x = un("c_sol", { longueur: Lg, largeur: la, cA: a, cB: b, parCarton: pc, perte: pe, colle: 4, colleSac: 25, jointC: 0.4, jointSac: 5 }, "carrelage"), q = x.lignes.find((l) => l.unite === "Carton").qty;
    const besoinM2 = Lg * la * (1 + pe / 100), carton = (a / 100) * (b / 100) * pc;
    if (!(q * carton >= besoinM2 - 1e-6 && (q - 1) * carton < besoinM2 - 1e-9)) { ok = false; pire = `${Lg}×${la} ${a}×${b} ${pc}/carton ${pe}% → ${q}`; }
  } eq("400 sols tirés au hasard : assez de cartons, et jamais un carton de trop" + (ok ? "" : " — " + pire), ok, true); }
{ let ok = true;
  for (let i = 0; i < 400; i++) {
    const Lg = alea(2, 40), h = alea(1, 4), bl = [40, 50, 39, 30][i % 4], bh = [20, 19, 25][i % 3], j = [0, 1, 1.5, 2][i % 4], pe = i % 11;
    const x = un("m_mur", { longueur: Lg, hauteur: h, blocL: bl, blocH: bh, blocE: 15, joint: j, perte: pe, mortier: true, ciment: 350, sac: 50, sable: 1 }, "maconnerie"), q = x.lignes.find((l) => l.unite === "Pièce").qty;
    const S = Lg * h, aire = ((bl + j) / 100) * ((bh + j) / 100), besoin = (S / aire) * (1 + pe / 100);
    const Vj = x.zones[0].ouvrages[0].mesures.find((m) => m.est)?.val ?? 0, Vblocs = (S / aire) * (bl / 100) * (bh / 100) * 0.15;
    if (!(q >= besoin - 1e-6 && q - 1 < besoin - 1e-9) || Math.abs(S * 0.15 - Vblocs - Vj) > 1e-9 || Vj < -1e-12) ok = false;
  } eq("400 murs tirés au hasard : blocs justes à l'unité, et blocs + joints = volume du mur", ok, true); }
{ let ok = true;
  for (let i = 0; i < 400; i++) {
    const lg = alea(0.5, 11.5, 0.1), rec = alea(0, 1, 0.1), nb = 1 + (i % 15), fn = 2 + (i % 7), barre = [12, 11.7, 6][i % 3];
    const x = un("m_acier", { nombre: nb, longueur: lg, filN: fn, filRec: rec, barre }, "maconnerie"), l = x.lignes.find((y) => y.unite === "Barre"); if (lg + rec > barre) continue;
    const par = Math.floor((barre + 1e-9) / (lg + rec)), pieces = nb * fn;
    if (!(l.qty * par >= pieces && (l.qty - 1) * par < pieces)) ok = false;
  } eq("400 ferraillages tirés au hasard : toutes les pièces se découpent dans les barres comptées, sans barre de trop", ok, true); }
{ let ok = true;
  for (let i = 0; i < 300; i++) {
    const s = alea(5, 300, 0.01), couv = alea(5, 60, 0.5), c = 1 + (i % 3), pe = i % 13, q = un("p_libre", { surface: s, prod: [{ nom: "P", couches: c, couv }], perte: pe }, "peinture").lignes[0].qty, b = (s * c * (1 + pe / 100)) / couv;
    if (!(q >= b - 1e-6 && q - 1 < b - 1e-9)) ok = false;
  } eq("300 surfaces tirées au hasard : assez de pots, jamais un pot de trop", ok, true); }
{ let ok = true;
  for (let i = 0; i < 300; i++) {
    const lg = alea(1, 80, 0.1), res2 = alea(0, 0.5, 0.05), rc = i % 9, nb = 1 + (i % 4), fl = 1 + (i % 3), pe = i % 12, rl = [50, 100, 25][i % 3];
    const x = un("e_ligne", { cable: "C", longueur: lg, nombre: nb, fils: fl, reserve: res2 || null, racc: res2 ? rc || 1 : null, perte: pe, rouleau: rl }, "electricite"), q = x.lignes[0].qty, b = (nb * (lg + (res2 ? res2 * (rc || 1) : 0)) * fl * (1 + pe / 100)) / rl;
    if (!(q >= b - 1e-6 && q - 1 < b - 1e-9)) ok = false;
  } eq("300 lignes tirées au hasard : assez de rouleaux, jamais un rouleau de trop", ok, true); }
{ let ok = true; // ajouter des pertes ou agrandir ne fait jamais baisser une quantité
  for (let i = 0; i < 200; i++) { const s = alea(5, 200, 0.01); const q = (p, k = 1) => un("c_libre", { surface: s * k, cA: 60, cB: 60, parCarton: 4, perte: p, colle: 4, colleSac: 25, jointC: 0.4, jointSac: 5 }, "carrelage").lignes[0].qty; if (q(10) < q(0) || q(0, 1.2) < q(0)) ok = false; }
  eq("200 tirages : plus de pertes ou plus de surface ne donne jamais moins de cartons", ok, true); }

// ================= Lien avec le devis =================
r = un("c_sol", sol, "carrelage");
let plan = M.planSync([], r.lignes);
eq("devis vide : tout le métré est à ajouter", [plan.ajouter.length, plan.maj.length, plan.retirer.length], [r.lignes.length, 0, 0]);
const man = r.lignes.map((l, i) => ({ id: "m" + i, metre: l.cle, metreQty: l.qty, qty: l.qty, nom: l.nom, detail: l.detail }));
plan = M.planSync(man, r.lignes);
eq("devis à jour : rien à faire", [plan.ajouter.length, plan.maj.length, plan.retirer.length, plan.ecarts.length], [0, 0, 0, 0]);
const r2 = un("c_sol", { ...sol, longueur: 6 }, "carrelage"); // 24 × 1,1 ÷ 1,44 = 18,33 → 19
eq("pièce agrandie : 19 cartons", M.planSync(man, r2.lignes).maj.find((m) => m.id === "m0").qty, 19);
plan = M.planSync(man.map((m) => (m.nom === "Grès 60×60" ? { ...m, qty: 20 } : m)), r2.lignes);
eq("quantité changée à la main : jamais écrasée, signalée (20 contre 19)", [plan.maj.some((m) => m.id === "m0"), plan.ecarts.map((e) => [e.qty, e.metre])], [false, [[20, 19]]]);
eq("plinthes retirées du métré : la ligne sort du devis", M.planSync(man, un("c_sol", { ...sol, plinthes: false }, "carrelage").lignes).retirer.length, 1);
eq("une ligne saisie à la main n'est jamais touchée", [M.planSync([{ id: "x", qty: 5, nom: "Main" }], r.lignes).retirer, M.planSync([{ id: "x", qty: 5, nom: "Main" }], r.lignes).maj], [[], []]);
// Changement de mode de facturation : l'ancienne ligne sort, la nouvelle entre (jamais les deux).
{ const a = un("p_piece", piece, "peinture"), b = un("p_piece", { ...piece, moMode: "equipe" }, "peinture"), m0 = a.lignes.map((l, i) => ({ id: "m" + i, metre: l.cle, metreQty: l.qty, qty: l.qty, nom: l.nom, detail: l.detail })), p2 = M.planSync(m0, b.lignes);
  eq("passer de « par ouvrier » à « pour l'équipe » : 1 ligne retirée, 1 ajoutée", [p2.retirer.length, p2.ajouter.map((l) => l.unite)], [1, ["journée d'équipe"]]); }

// ================= Mémoire de l'entreprise =================
const tSol = M.typeDe("c_sol");
eq("valeurs de pratique gardées : pertes, consommations, façon de facturer — jamais les dimensions ni le produit", M.memoDe(tSol, sol), { perte: 10, colle: 5, colleSac: 25, jointC: 0.5, jointSac: 5, perteP: 10, moMode: "tache" });
const neuf = M.nouvelOuvrage(tSol, M.memoDe(tSol, sol), "n1");
eq("nouvel ouvrage : valeurs proposées et marquées « à confirmer » ; dimensions, format et nom du carreau vides", [neuf.repris.slice().sort(), neuf.v.longueur, neuf.v.cA, neuf.v.carreau], [["colle", "colleSac", "jointC", "jointSac", "moMode", "perte", "perteP"], undefined, undefined, undefined]);
const aConf = { zones: [{ id: "z", nom: "Z", ouvrages: [{ ...neuf, v: { ...neuf.v, longueur: 5, largeur: 4, cA: 60, cB: 60, parCarton: 4 } }] }] };
r = M.calculer(aConf, "carrelage");
eq("tant que les valeurs reprises ne sont pas confirmées : AUCUNE quantité dans le devis", [r.lignes.length, manq(r)], [0, ["ta confirmation des valeurs reprises du dernier ouvrage"]]);
eq("les valeurs à confirmer sont nommées (seulement celles des champs visibles : pas les coupes de plinthes sans plinthes)", r.zones[0].ouvrages[0].aConfirmer.length, 6);
aConf.zones[0].ouvrages[0].repris = [];
eq("après confirmation : les quantités entrent dans le devis", M.calculer(aConf, "carrelage").lignes.length > 0, true);
eq("un ouvrage sans mémoire n'a rien à confirmer", M.nouvelOuvrage(tSol, {}, "n2").repris, undefined);
eq("la mémoire d'un type ne déborde pas sur un autre (une valeur inconnue du type est ignorée)", M.nouvelOuvrage(M.typeDe("m_mur"), { colle: 5, blocL: 40, joint: 1 }, "n3").v, { joint: 1 });
// Valeurs attachées à un produit : reprises seulement pour le même nom.
const fiches = { [M.clePlate("Grès 60×60")]: { cA: 60, cB: 60, parCarton: 4 } }, lien = M.liensDe(tSol)[0];
let v = { carreau: "grès 60×60 " }; eq("même produit (casse et espaces ignorés) : format repris", [M.changerProduit(tSol, lien, v, fiches), v.cA, v.parCarton], [true, 60, 4]);
v = { carreau: "Grès 45×45", cA: 60, cB: 60, parCarton: 4 }; eq("autre produit : les valeurs de l'ancien sont effacées, rien n'est repris", [M.changerProduit(tSol, lien, v, fiches), v.cA, v.cB, v.parCarton], [false, undefined, undefined, undefined]);
v = { carreau: "", cA: 60 }; eq("nom effacé : valeurs effacées", [M.changerProduit(tSol, lien, v, fiches), v.cA], [false, undefined]);
eq("fiche d'un produit : seulement ses propres champs", M.ficheProduit(tSol, lien, sol), { cA: 60, cB: 60, parCarton: 4 });
eq("produits à fiche : carreau, bloc, tuyau, câble, conduit", M.TYPES.flatMap((t) => M.liensDe(t).map((l) => l.nom)).filter((x, i, a) => a.indexOf(x) === i).sort(), ["blocNom", "cable", "carreau", "conduit", "tuyau"]);
eq("aucun champ n'est à la fois valeur de pratique et valeur de produit", M.TYPES.every((t) => M.liensDe(t).every((l) => l.champs.every((k) => !t.champs.find((c) => c.k === k)?.memo))), true);

// ================= Garde-fous généraux =================
eq("les cinq métiers ont un métré, au moins 2 types chacun", [[...M.METIERS_METRE].sort(), M.METIERS_METRE.every((m) => M.typesDe(m).length >= 2)], [["carrelage", "electricite", "maconnerie", "peinture", "plomberie"], true]);
eq("un ouvrage d'un autre métier est ignoré", M.calculer({ zones: [{ id: "z", nom: "Z", ouvrages: [{ id: "1", type: "m_mur", v: mur }] }] }, "peinture").lignes, []);
eq("zone vide signalée ; métré absent sans plantage", [M.calculer({ zones: [{ id: "z", nom: "Cuisine", ouvrages: [] }] }, "peinture").alertes[0].texte, M.calculer(undefined, "peinture").lignes], ["Cuisine n'a encore aucun ouvrage.", []]);
eq("ouvrage vide de chaque type : incomplet, jamais de quantité", M.TYPES.every((t) => { const x = un(t.id, {}, t.metier); return x.lignes.length === 0 && x.manques.length > 0; }), true);
eq("dimensions seules : aucune quantité de matériau sans donnée de l'entreprise", M.TYPES.filter((t) => !/^(pl_appareils|e_points|e_tableau|m_fouille|m_acier)$/.test(t.id)).every((t) => un(t.id, { longueur: 5, largeur: 4, hauteur: 3, epaisseur: 10, surface: 20, tuyau: "T", cable: "C", mortier: true }, t.metier).lignes.filter((l) => l.tab === "produits").length === 0), true);
const src = fs.readFileSync(new URL("./metiers/metre.js", import.meta.url), "utf8");
eq("aucune valeur par défaut dans les champs (def:)", /\bdef\s*:/.test(src), false);
eq("chaque type a des rubriques (formulaire regroupé) et chaque rubrique un titre", M.TYPES.every((t) => t.champs[0].g && t.champs.filter((c) => c.g).length >= 2), true);
eq("toute quantité à zéro est écartée du devis", M.calculer({ zones: [{ id: "z", nom: "Z", ouvrages: [{ id: "1", type: "m_mur", v: { ...mur, joint: 0 } }] }] }, "maconnerie").lignes.every((l) => l.qty > 0), true);
eq("annexe imprimable : zone, mesure et formule", (() => { const a = M.annexe({ zones: [{ id: "z", nom: "Salon", ouvrages: [{ id: "1", type: "c_sol", v: sol }] }] }, "carrelage"); return [a[0].zone, a[0].lignes[0].mesure, a[0].lignes[0].detail]; })(), ["Salon", "Surface à carreler", "5 × 4 = 20 m²"]);

// Aucun texte affiché ne doit contenir « null » (vu par un utilisateur : « Pose des appareils — null ouvrier »)
for (const [mode, moOuv, attendu] of [["ouvrier", null, false], ["ouvrier", 3, false], ["equipe", null, false], ["tache", null, false]]) {
  const sortie = JSON.stringify(un("p_piece", { ...piece, moMode: mode, moOuv, moRend: mode === "tache" ? null : 10 }, "peinture"));
  eq(`aucun « null » affiché — main-d'œuvre ${mode}, ouvriers ${moOuv}`, /null ouvrier|— null|undefined/.test(sortie), attendu);
}

console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
