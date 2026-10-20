import { analyseCsv, exportCatalogueCsv, parseCsv, templateCsv } from "./csv.js";
import { ALL_SEEDS } from "./packs.js";
let pass = 0, fail = 0;
const eq = (n, g, w) => { const ok = JSON.stringify(g) === JSON.stringify(w); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + n + (ok ? "" : `  obtenu=${JSON.stringify(g)} attendu=${JSON.stringify(w)}`)); };
const cat = ALL_SEEDS();
const H = "ref;designation;categorie;unite;mode;prix_vente;prix_achat;rendement;unite_rendement;fournisseur;marque;balises\n";
// 3 cas qui doivent passer
let a = analyseCsv(H + 'NEW-1;Peinture acrylique 20 L;Matériaux et produits;seau;Prix unitaire;48 500;41000;9,5;m²;Quincaillerie X;MarqueY;"finition,mur"', cat);
eq("nouvel article valide", [a.counts.new, a.counts.error, a.rows[0].item.price, a.rows[0].item.cost, a.rows[0].item.yield, a.rows[0].item.tags], [1, 0, 48500, 41000, 9.5, ["finition", "mur"]]);
a = analyseCsv(H + "NEW-2;Article sans prix;materiaux;u;unitaire;;;;;;;", cat);
eq("prix vide = inconnu (null), pas zéro", [a.rows[0].status, a.rows[0].item.price], ["new", null]);
a = analyseCsv(H + "END-P60;Papier-vert P60;Consommables;rouleau;Prix unitaire;21000;;;;;;", cat);
eq("référence existante = mise à jour, prix d'achat vide conservé", [a.rows[0].status, a.rows[0].item.price, a.rows[0].item.cost], ["update", 21000, cat.find((i) => i.ref === "END-P60").cost]);
// 3 cas qui doivent échouer
a = analyseCsv(H + "X-1;Test;Inconnue;u;unitaire;100;;;;;;", cat);
eq("catégorie inconnue refusée", [a.counts.error, /catégorie inconnue/.test(a.rows[0].problems.join())], [1, true]);
a = analyseCsv(H + "X-2;Test;materiaux;u;unitaire;abc;;;;;;\nX-3;Test;materiaux;u;unitaire;-5;;;;;;\nX-4;Test;materiaux;u;unitaire;10;;0;;;;", cat);
eq("prix illisible, prix négatif, rendement nul refusés", a.rows.map((r) => r.status), ["error", "error", "error"]);
a = analyseCsv(H + "D-1;A;materiaux;u;unitaire;1;;;;;;\nD-1;B;materiaux;u;unitaire;2;;;;;;\n;C;materiaux;u;unitaire;3;;;;;;", cat);
eq("doublon dans le fichier et référence vide refusés", a.rows.map((r) => r.status), ["new", "error", "error"]);
// fichiers invalides
eq("colonnes obligatoires absentes", /Colonnes obligatoires absentes/.test(analyseCsv("ref;prix\nA;1", cat).fatal), true);
eq("fichier vide", analyseCsv("", cat).fatal !== "", true);
// aller-retour export → import sans perte
const exp = exportCatalogueCsv(cat); const back = analyseCsv(exp, cat);
eq("export → import : aucune erreur, aucune modification de prix", [back.counts.error, back.rows.filter((r) => r.status === "update").every((r) => { const o = cat.find((i) => i.ref === r.ref); return r.item.price === o.price && r.item.yield === o.yield && r.item.cost === o.cost; })], [0, true]);
eq("séparateur virgule, guillemets et BOM acceptés", parseCsv('﻿a,b\n"x,1",2')[1], ["x,1", "2"]);
eq("modèle vide = en-têtes seulement", templateCsv().trim().split(";").length, 12);
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
