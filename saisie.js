// Lecture d'un nombre écrit par une personne, avec ou sans unité. Fonctions pures (aucune dépendance au navigateur).
//  - « 4,5 », « 4.5 », « 1 500 » (espaces ordinaires, insécables, fines) → un nombre ;
//  - « 60 cm » dans un champ dont le libellé dit « (cm) » → 60 (l'unité tapée est celle du champ : aucune ambiguïté) ;
//  - « 3000 cm » dans un champ en mètres → refus avec un message qui dit en quelle unité écrire. On ne convertit JAMAIS à la place de la personne :
//    deviner une unité (60 cm lu comme 60 m) produirait une erreur silencieuse dans le devis.
const UNITES = { m: "m", ml: "m", "m²": "m²", m2: "m²", "m³": "m³", m3: "m³", cm: "cm", mm: "mm", kg: "kg", l: "l", "%": "%", fcfa: "FCFA", cfa: "FCFA", f: "FCFA", jour: "jours", jours: "jours", j: "jours" };
const NOMBRE = "[+-]?(?:\\d[\\d\\s\\u00a0\\u202f]*(?:[.,]\\d*)?|[.,]\\d+)";
const SEUL = new RegExp("^" + NOMBRE + "$");
const AVEC_UNITE = new RegExp("^(" + NOMBRE + ")\\s*([a-zA-Z²³%][a-zA-Z²³%0-9]*)\\s*$");

const sansEspaces = (t) => String(t).replace(/[\s  ]/g, "");
export const uniteDuLibelle = (libelle) => {
  const m = String(libelle || "").match(/\(([^)]*)\)/);
  return m ? UNITES[sansEspaces(m[1]).toLowerCase()] || "" : "";
};

// → { etat: "vide" | "nombre" | "unite_du_champ" | "autre_unite" | "invalide", valeur, unite, message }
export function lireSaisie(texte, libelle = "") {
  const t = String(texte ?? "").trim();
  if (t === "") return { etat: "vide", valeur: null };
  if (SEUL.test(t)) return { etat: "nombre", valeur: Number(sansEspaces(t).replace(",", ".")) };
  const m = t.match(AVEC_UNITE);
  const champ = uniteDuLibelle(libelle);
  if (m) {
    const u = UNITES[m[2].toLowerCase()];
    if (u && champ && u === champ) return { etat: "unite_du_champ", valeur: Number(sansEspaces(m[1]).replace(",", ".")), unite: u };
    if (u && champ) return { etat: "autre_unite", unite: u, message: `Ce champ est en ${champ}. Écris le nombre en ${champ} (tu as écrit en ${u}).` };
  }
  return { etat: "invalide", message: `« ${t.slice(0, 20)} » n'est pas un nombre. Écris seulement le chiffre, par exemple 4,5${champ ? ` : ce champ est en ${champ}` : " : l'unité est déjà indiquée"}.` };
}
