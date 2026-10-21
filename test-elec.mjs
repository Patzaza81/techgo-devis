// Référentiel électricité : données du document, normes imprimables, sous-ensembles, devis avec normes.
const _m = {};
globalThis.localStorage = { getItem: (k) => (k in _m ? _m[k] : null), setItem: (k, v) => { _m[k] = String(v); }, removeItem: (k) => { delete _m[k]; } };
const R = await import("./metiers/elec-ref.js");
const S = await import("./store.js");
const { renderDoc, installLine } = await import("./ui-doc.js");
let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + name + (ok ? "" : `  obtenu=${JSON.stringify(got)} attendu=${JSON.stringify(want)}`)); };

// --- contenu du référentiel (487 fiches du document + 77 accessoires)
eq("564 fiches (487 matériels + 77 accessoires)", R.elecCount(), 564);
eq("8 sous-ensembles", R.ELEC_DOMAINES.length, 8);
eq("chaque famille du document est rangée dans un sous-ensemble", ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16.1","16.8","17","18"].every((f) => R.ELEC_DOMAINES.some((d) => d[3].includes(f))), true);
eq("la famille 19 (contrôles) n'est dans aucun sous-ensemble : elle va dans « divers »", R.ELEC_DOMAINES.some((d) => d[3].includes("19")), false);
eq("aucune fiche sans nom ni famille", R.elecRows("produits", "bat", "").concat(R.elecRows("autres", "", "")).every((r) => r.name && r.famLabel), true);
eq("aucun prix ni quantité dans une fiche", R.elecRows("produits", "bat", "").every((r) => !("price" in r) && !("qty" in r)), true);
eq("sous-ensemble Logement : contient l'interrupteur simple", R.elecRows("produits", "bat", "").some((r) => r.name === "Interrupteur simple"), true);
eq("sous-ensemble Logement : ne contient pas de matériel de cimenterie", R.elecRows("produits", "bat", "").some((r) => r.fam.startsWith("16")), false);
eq("Interrupteur simple : unité et norme du document", [R.elecFind("interrupteur simple").unit, R.elecFind("Interrupteur simple").norm], ["Pièce", "IEC 60669-1"]);
eq("accents ignorés à la recherche", R.elecRows("produits", "bat", "eclairage").length > 0 || R.elecRows("produits", "bat", "disjoncteur").length > 0, true);
eq("recherche : au plus 40 résultats", R.elecRows("produits", "bat", "e").length <= 40, true);
eq("recherche d'un mot inconnu : rien", R.elecRows("produits", "bat", "zzzxqw").length, 0);
eq("contrôles : 21 prestations", R.elecRows("autres", "", "").length, 21);
eq("accessoires : une fiche sans unité (jamais devinée)", R.elecRows("produits", "acc", "").every((r) => r.unit === ""), true);
eq("noms uniques (pas de doublon dans un même sous-ensemble)", (() => { const n = R.elecRows("produits", "ind", "").map((r) => r.name.toLowerCase()); return new Set(n).size === n.length; })(), true);
eq("unité « Mètre ou rouleau » → deux choix", R.unitsOf("Mètre ou rouleau"), ["Mètre", "Rouleau"]);
eq("unité vide → aucun choix", R.unitsOf(""), []);

// --- normes imprimables : 3 qui passent, 3 qui ne passent pas
eq("norme IEC imprimée", R.printableNorm("IEC 60669-1"), "IEC 60669-1");
eq("norme EN imprimée", R.printableNorm("EN 397 selon le type et le marché"), "EN 397 selon le type et le marché");
eq("norme ISO imprimée", R.printableNorm("ISO 8528"), "ISO 8528");
eq("phrase vague non imprimée", R.printableNorm("Norme produit applicable"), "");
eq("réserve « non applicable » non imprimée", R.printableNorm("IEC 60598 non applicable par défaut ; norme produit spécifique à vérifier"), "");
eq("réglementation générale non imprimée", R.printableNorm("Réglementation de sécurité applicable au chantier"), "");

// --- devis : la norme n'est écrite que si l'utilisateur le demande
S.init(); S.state.db.settings.metier = "electricite"; S.state.db.settings.profil = "technicien";
const q = S.createQuote(); q.current.metier = "electricite"; q.current.profil = "technicien";
S.saveItem({ id: "TER-X", ref: "TER-X", label: "Interrupteur simple (10/16 A)", cat: "materiaux", unit: "Pièce", pricing: "unitaire", price: 2500, cost: null, priceDate: null, supplier: "", brand: "", yield: null, yieldUnit: "m²", tags: [], pack: "electricite", archived: false });
q.current.manual.push({ id: "m1", itemId: "TER-X", group: "Fournitures", mode: "fixed", qty: 10, option: false, label: "Interrupteur simple (10/16 A)", nom: "Interrupteur simple", norm: "IEC 60669-1" });
q.current.manual.push({ id: "m2", itemId: "TER-X", group: "Fournitures", mode: "fixed", qty: 1, option: false, label: "Prise vague", nom: "Prise vague", norm: "Norme produit applicable" });
const lines = () => S.evaluate(q).result.lines;
eq("sans option : aucune norme sur le devis", lines().every((l) => !/Norme de référence/.test(l.role)), true);
q.current.showNorms = true;
eq("avec option : norme IEC écrite", lines().find((l) => l.id === "m1").role, "Norme de référence : IEC 60669-1");
eq("avec option : phrase vague jamais écrite", lines().find((l) => l.id === "m2").role, "");
eq("la norme ne change aucun montant", S.evaluate(q).result.totals.base, 25000 + 2500);
q.current.elec = { projet: "Bâtiment résidentiel", alim: "BT 230 V monophasé", env: "", objet: "Fourniture et installation" };
eq("ligne d'installation imprimée (champs vides ignorés)", installLine(q.current), '<div class="note">Bâtiment résidentiel · BT 230 V monophasé · Fourniture et installation</div>');
eq("sans fiche : aucune ligne", installLine({}), "");
const html = renderDoc({ quote: q.current, result: S.evaluate(q).result, company: S.state.db.company, conditions: [], presentation: {}, n: null, at: null, hash: null }, { draft: true, ref: q.ref });
eq("devis : norme et fiche présentes", html.includes("Norme de référence : IEC 60669-1") && html.includes("Bâtiment résidentiel"), true);
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
