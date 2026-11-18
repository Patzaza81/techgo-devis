// Lecture des nombres tapés : cas qui doivent passer, cas qui doivent être refusés, et aucune conversion d'unité silencieuse.
import { lireSaisie, uniteDuLibelle } from "./saisie.js";
let ok = 0, ko = 0;
const t = (nom, cond, detail = "") => { if (cond) ok++; else { ko++; console.log("ÉCHEC", nom, detail); } };
const v = (txt, lib) => lireSaisie(txt, lib);

// --- doivent PASSER (valeur exacte) ---
t("virgule", v("4,5").valeur === 4.5);
t("point", v("4.5").valeur === 4.5);
t("entier", v("12").valeur === 12);
t("espace des milliers", v("1 500").valeur === 1500);
t("espace insécable", v("1 500").valeur === 1500);
t("espace fine insécable", v("2 750").valeur === 2750);
t("zéro", v("0").valeur === 0 && v("0").etat === "nombre");
t("0,9 (le zéro n'est pas perdu)", v("0,9").valeur === 0.9);
t("virgule seule devant", v(",5").valeur === 0.5);
t("négatif conservé pour que l'application le juge", v("-3").valeur === -3);
t("vide", v("   ").etat === "vide" && v("").valeur === null);
t("unité du champ : 60 cm dans « (cm) »", v("60 cm", "Longueur d'un carreau (cm)").valeur === 60 && v("60 cm", "Longueur d'un carreau (cm)").etat === "unite_du_champ");
t("unité collée : 60cm", v("60cm", "Largeur (cm)").valeur === 60);
t("m² écrit m2", v("20m2", "Surface à peindre (m²)").valeur === 20);
t("4,5 m dans « (m) »", v("4,5 m", "Longueur (m)").valeur === 4.5);
t("FCFA / F", v("2 500 F", "Prix (FCFA)").valeur === 2500);
t("% dans « (%) »", v("10 %", "Pertes (%)").valeur === 10 || v("10%", "Pertes (%)").valeur === 10);

// --- doivent être REFUSÉS (aucune valeur) ---
t("texte", v("abc").etat === "invalide" && v("abc").valeur === undefined);
t("unité sans libellé d'unité : refus, pas de devinette", v("4m", "Nom du bloc").etat === "invalide");
t("3000 cm dans un champ en m : refus", v("3000 cm", "Longueur (m)").etat === "autre_unite" && v("3000 cm", "Longueur (m)").valeur === undefined);
t("0,6 m dans un champ en cm : refus (pas converti en 0,6)", v("0,6 m", "Largeur (cm)").etat === "autre_unite" && v("0,6 m", "Largeur (cm)").valeur === undefined);
t("m² dans un champ en m : refus", v("20 m²", "Longueur (m)").etat === "autre_unite");
t("deux nombres", v("4 5 6x").etat === "invalide");
t("virgule double", v("4,,5").etat === "invalide");
t("point d'interrogation", v("?").etat === "invalide");
t("message du refus dit l'unité du champ", /en m\b/.test(v("3000 cm", "Longueur (m)").message) && /en cm/.test(v("3000 cm", "Longueur (m)").message));
t("message invalide nomme le texte", v("abc", "Longueur (m)").message.includes("abc"));

// --- lecture de l'unité dans un libellé ---
t("unité du libellé", uniteDuLibelle("Surface à peindre (m²)") === "m²" && uniteDuLibelle("Pertes (%)") === "%");
t("pas d'unité connue", uniteDuLibelle("Nom du carreau") === "" && uniteDuLibelle("Colle : kg par m² — vide si pas de colle") === "");
t("parenthèse inconnue", uniteDuLibelle("Faces à peindre (1 ou 2)") === "");

console.log(`${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
