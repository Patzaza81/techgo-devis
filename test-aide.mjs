// Aides au chiffrage : ligne incomplète, calcul de quantité, rappels d'oublis.
const A = await import("./metiers/aide.js");
let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + name + (ok ? "" : `  obtenu=${JSON.stringify(got)} attendu=${JSON.stringify(want)}`)); };
const P = (...noms) => noms.map((nom) => ({ nom, tab: "produits" }));
const O = (nom) => ({ nom, tab: "ouvriers" }), T = (nom) => ({ nom, tab: "autres" });
const ids = (met, lignes, ign) => A.oublis(met, lignes, ign).map((o) => o.id);
const sansCommuns = (l) => l.filter((x) => !["main-oeuvre", "materiel", "transport"].includes(x));

// ----- Ligne incomplète
eq("ligne complète : rien ne manque", A.manqueLigne({ label: "Carreaux", qty: 12, unit: "Carton", price: 9500 }), []);
eq("ligne sans prix : acceptée (prix à saisir plus tard)", A.manqueLigne({ label: "Carreaux", qty: 12, unit: "Carton", price: null }), []);
eq("unité oubliée", A.manqueLigne({ label: "Carreaux", qty: 12, unit: "", price: 9500 }), ["l'unité"]);
eq("quantité oubliée", A.manqueLigne({ label: "Carreaux", qty: null, unit: "Carton", price: 9500 }), ["la quantité"]);
eq("quantité nulle", A.manqueLigne({ label: "Carreaux", qty: 0, unit: "Carton", price: 9500 }), ["la quantité"]);
eq("prix à zéro", A.manqueLigne({ label: "Carreaux", qty: 1, unit: "Carton", price: 0 }), ["un prix supérieur à zéro"]);
eq("tout manque", A.manqueLigne({}), ["le nom", "la quantité", "l'unité"]);
eq("fiche vide : pas de données", A.aDesDonnees({ label: "Carreaux", qty: null, price: null, unit: "" }), false);
eq("fiche avec un prix : des données", A.aDesDonnees({ label: "Carreaux", qty: null, price: 9500, unit: "" }), true);
eq("fiche avec une quantité : des données", A.aDesDonnees({ qty: 3 }), true);

// ----- Quantité à partir de la surface
const qc = (o) => { const r = A.quantiteCouverture(o); return r.ok ? r.qty : r.manque; };
eq("carrelage 40 m², carton de 1,44 m², sans pertes → 28", qc({ surface: 40, couverture: 1.44 }), 28);
eq("carrelage 40 m², carton de 1,44 m², 10 % de pertes → 31", qc({ surface: 40, couverture: 1.44, pertePct: 10 }), 31);
eq("résultat exact : pas d'unité en trop (40 × 1,05 ÷ 1,4 = 30)", qc({ surface: 40, couverture: 1.4, pertePct: 5 }), 30);
eq("résultat exact : 120 ÷ 40 = 3", qc({ surface: 120, couverture: 40 }), 3);
eq("juste au-dessus : 120,5 ÷ 40 → 4", qc({ surface: 120.5, couverture: 40 }), 4);
eq("peinture 120 m², 2 couches, pot couvrant 100 m² → 3", qc({ surface: 120, couches: 2, couverture: 100 }), 3);
eq("petite surface : au moins 1", qc({ surface: 2, couverture: 39 }), 1);
eq("surface manquante", qc({ surface: null, couverture: 1.44 }), ["la surface"]);
eq("couverture manquante", qc({ surface: 40, couverture: null }), ["la surface couverte par unité"]);
eq("couverture à zéro refusée (pas de division par zéro)", qc({ surface: 40, couverture: 0 }), ["la surface couverte par unité"]);
eq("couches non entières refusées", qc({ surface: 40, couverture: 10, couches: 1.5 }), ["le nombre de couches"]);
eq("pertes négatives refusées", qc({ surface: 40, couverture: 10, pertePct: -5 }), ["un pourcentage de pertes entre 0 et 100"]);
eq("pertes > 100 % refusées", qc({ surface: 40, couverture: 10, pertePct: 150 }), ["un pourcentage de pertes entre 0 et 100"]);
eq("le détail montre la formule", A.quantiteCouverture({ surface: 40, couverture: 1.44, pertePct: 10 }).detail, "40 m² + 10 % de pertes = 44 m² à couvrir ; ÷ 1,44 m² par unité = 30,56 → 31 (arrondi au-dessus)");
eq("aide proposée en peinture et carrelage seulement", Object.keys(A.AIDE_QTE).sort(), ["carrelage", "peinture"]);

// ----- Rappels communs
eq("devis vide : aucun rappel", ids("carrelage", []), []);
eq("produits sans main-d'œuvre ni transport", ids("carrelage", P("Colle à carrelage")).filter((x) => ["main-oeuvre", "transport"].includes(x)), ["main-oeuvre", "transport"]);
eq("main-d'œuvre seule : rappel « aucun produit »", ids("plomberie", [O("Plombier")]), ["materiel"]);
eq("produits + main-d'œuvre + transport : aucun rappel commun", ids("carrelage", [...P("Colle"), O("Carreleur"), T("Transport du matériel")]).filter((x) => ["main-oeuvre", "materiel", "transport"].includes(x)), []);
eq("« Location de camion » compte comme transport", ids("maconnerie", [...P("Sable"), O("Maçon"), T("Location de camion")]).includes("transport"), false);

// ----- Rappels par métier : chaque règle se déclenche, puis se tait quand le poste est présent
const cas = [
  ["carrelage", ["Carreaux 60×60"], ["colle", "joint", "plinthe"], ["Colle à carrelage", "Joint de carrelage", "Plinthes"]],
  ["carrelage", ["FAÏENCE murale"], ["colle", "joint", "plinthe"], ["Mortier colle", "Joint époxy", "Plinthes assorties"]],
  ["peinture", ["Peinture acrylique"], ["sous-couche", "preparation", "protection"], ["Sous-couche", "Enduit de rebouchage", "Bâche de protection"]],
  ["peinture", ["Peinture à huile"], ["sous-couche", "preparation", "protection"], ["Multiprim", "Papier abrasif", "Bandes adhésives"]],
  ["maconnerie", ["Parpaings de 15"], ["liant"], ["Ciment", "Sable"]],
  ["maconnerie", ["Ciment"], ["sable"], ["Sable"]],
  ["maconnerie", ["Fer à béton de 10"], ["attache", "coffrage"], ["Fil d'attache", "Planches de coffrage"]],
  ["plomberie", ["Tuyau PVC 100"], ["raccords", "colle-pvc", "etancheite"], ["Raccords", "Colle PVC", "Ruban téflon"]],
  ["plomberie", ["Lavabo"], ["robinetterie", "vidage"], ["Mitigeur", "Siphon"]],
  ["electricite", ["Câble électrique 2,5 mm²"], ["conduit", "protection"], ["Gaine ICTA", "Disjoncteur 16 A", "Piquet de terre"]],
  ["electricite", ["Prise 2P+T"], ["boites", "protection"], ["Boîte d'encastrement", "Tableau électrique", "Piquet de terre"]],
  ["electricite", ["Tableau électrique"], ["terre"], ["Piquet de terre"]],
];
for (const [met, produits, attendus, remedes] of cas) {
  eq(`${met} · ${produits[0]} → ${attendus.join(", ")}`, sansCommuns(ids(met, P(...produits))), attendus);
  eq(`${met} · ${produits[0]} + ${remedes.join(" + ")} → plus rien`, sansCommuns(ids(met, P(...produits, ...remedes))), []);
}
// Faux positifs à éviter
eq("un métier ne reçoit pas les rappels d'un autre", sansCommuns(ids("electricite", P("Carreaux"))), []);
eq("« Joint de carrelage » seul ne déclenche pas « carreaux sans… »", sansCommuns(ids("carrelage", P("Joint de carrelage"))), []);
eq("« Colle PVC » seule ne déclenche pas « PVC sans colle »", sansCommuns(ids("plomberie", P("Colle PVC"))).includes("colle-pvc"), false);
eq("le poste manquant peut être dans la main-d'œuvre (« Pose de plinthes »)", sansCommuns(ids("carrelage", [...P("Carreaux", "Colle", "Joint"), O("Pose de plinthes")])), []);
eq("métier inconnu : seulement les rappels communs", sansCommuns(ids("toiture", P("Tôles"))), []);
// Rappels écartés
eq("rappel écarté : il disparaît", sansCommuns(ids("carrelage", P("Carreaux"), ["plinthe"])), ["colle", "joint"]);
eq("tous écartés : plus rien", ids("carrelage", P("Carreaux"), ["plinthe", "colle", "joint", "main-oeuvre", "transport"]), []);
// Chaque rappel a un texte et une explication
const tous = A.METIERS_AVEC_RAPPELS.flatMap((m) => A.oublis(m, P("carreaux peinture parpaing ciment fer à béton tuyau pvc lavabo câble prise tableau")));
eq("les cinq métiers ont des rappels", A.METIERS_AVEC_RAPPELS.sort(), ["carrelage", "electricite", "maconnerie", "peinture", "plomberie"]);
eq("chaque rappel a un texte et une explication", tous.length > 15 && tous.every((o) => o.id && o.texte.length > 5 && o.aide.length > 10), true);

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail ? 1 : 0);
