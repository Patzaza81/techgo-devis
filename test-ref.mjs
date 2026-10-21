// Référentiel électricité : données du document, normes imprimables, sous-ensembles, devis avec normes.
const _m = {};
globalThis.localStorage = { getItem: (k) => (k in _m ? _m[k] : null), setItem: (k, v) => { _m[k] = String(v); }, removeItem: (k) => { delete _m[k]; } };
const M = await import("./metiers/ref.js");
const S = await import("./store.js");
const { renderDoc, installLine } = await import("./ui-doc.js");
let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + name + (ok ? "" : `  obtenu=${JSON.stringify(got)} attendu=${JSON.stringify(want)}`)); };

// --- contenu du référentiel électricité
const R = { printableNorm: M.printableNorm, unitsOf: M.unitsOf };
const E = M.refOf("electricite"), P = M.refOf("plomberie");
eq("électricité : 564 fiches (487 matériels + 77 accessoires)", E.count, 564);
eq("électricité : 8 sous-ensembles", E.domaines.length, 8);
eq("électricité : chaque famille du document est rangée dans un sous-ensemble", ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16.1","16.8","17","18"].every((f) => E.domaines.some((d) => d[3].includes(f))), true);
eq("électricité : contrôles (19) hors sous-ensembles, dans « divers »", [E.domaines.some((d) => d[3].includes("19")), E.rows("autres", "", "").length], [false, 21]);
eq("électricité : Logement contient l'interrupteur simple, pas de cimenterie", [E.rows("produits", "bat", "").some((r) => r.name === "Interrupteur simple"), E.rows("produits", "bat", "").some((r) => r.fam.startsWith("16"))], [true, false]);
eq("électricité : Interrupteur simple = Pièce, IEC 60669-1", [E.find("interrupteur simple").unit, E.find("Interrupteur simple").norm], ["Pièce", "IEC 60669-1"]);
eq("électricité : accessoires sans unité (jamais devinée)", E.rows("produits", "acc", "").every((r) => r.unit === ""), true);
eq("électricité : pas d'outils dans le référentiel", E.rows("outils", "", "").length, 0);
// --- plomberie
eq("plomberie : 792 fiches", P.count, 792);
eq("plomberie : 12 sous-ensembles", P.domaines.length, 12);
eq("plomberie : chaque section 1 à 32, 34, 35 rangée dans un sous-ensemble", [...Array(35).keys()].map((n) => String(n + 1)).filter((f) => f !== "33").every((f) => P.domaines.some((d) => d[3].includes(f))), true);
eq("plomberie : outillage (33) dans « Outils », essais (36) dans « divers »", [P.rows("outils", "", "").length > 20, P.rows("autres", "", "").length > 15, P.domaines.some((d) => d[3].includes("33") || d[3].includes("36"))], [true, true, false]);
eq("plomberie : Tube cuivre rigide = mètre, EN 1057", [P.find("Tube cuivre rigide").unit, P.find("Tube cuivre rigide").norm], ["mètre", "EN 1057"]);
eq("plomberie : le sous-ensemble Eau potable ne contient ni gaz ni cimenterie", P.rows("produits", "eau", "").every((r) => !["31", "32", "27", "28", "29", "30"].includes(r.fam)), true);
eq("plomberie : aucun prix ni quantité dans une fiche", [...P.rows("produits", "eau", ""), ...P.rows("outils", "", "")].every((r) => !("price" in r) && !("qty" in r)), true);
eq("plomberie : point de vigilance affiché pour la famille 1", /diamètre nominal/.test(P.note("1")), true);
eq("plomberie : guide = 11 vérifications, 9 distinctions, 12 erreurs, 21 travaux, 15 règles de métré", [P.guide.verifs.length, P.guide.distinguer.length, P.guide.erreurs.length, P.guide.travaux.length, P.guide.metre.length], [11, 9, 12, 21, 15]);
eq("plomberie : recherche « siphon » trouve des fiches de tous sous-ensembles confondus", P.rows("produits", "eau", "siphon").length > 0, true);
eq("métier sans référentiel : null", [M.refOf("peinture"), M.hasRef("carrelage"), M.hasRef("plomberie")], [null, false, true]);
eq("aucune fiche sans nom ni famille (2 métiers)", [E, P].every((r) => ["produits", "autres", "outils"].every((t) => r.rows(t, r.firstDomain, "").every((x) => x.name && x.famLabel))), true);
eq("recherche : au plus 40 résultats", [E, P].every((r) => r.rows("produits", r.firstDomain, "e").length <= 40), true);
eq("recherche d'un mot inconnu : rien", [E, P].map((r) => r.rows("produits", r.firstDomain, "zzzxqw").length), [0, 0]);
eq("sous-ensemble inconnu : retombe sur le premier", E.rows("produits", "nimportequoi", "").length, E.rows("produits", E.firstDomain, "").length);
eq("noms uniques dans un même sous-ensemble (2 métiers)", [E.rows("produits", "ind", ""), P.rows("produits", "ind", ""), P.rows("produits", "cim", "")].every((rs) => new Set(rs.map((r) => r.name.toLowerCase())).size === rs.length), true);
eq("unité « Mètre ou rouleau » → Mètre, Rouleau", R.unitsOf("Mètre ou rouleau"), ["Mètre", "Rouleau"]);
eq("unité « mètre ou barre » → mètre, barre (même casse)", R.unitsOf("mètre ou barre"), ["mètre", "barre"]);
eq("unité vide → aucun choix", R.unitsOf(""), []);
eq("fiche plomberie : alerte gaz / incendie, pas pour sanitaire", [P.fiche.warn({ travaux: ["Gaz et combustibles"] }), P.fiche.warn({ travaux: ["Protection incendie"] }), P.fiche.warn({ travaux: ["Appareils sanitaires"] }), P.fiche.warn({})], [true, true, false, false]);
eq("fiche électricité : alerte HTA / ATEX, pas pour BT", [E.fiche.warn({ alim: "HTA / MT" }), E.fiche.warn({ env: "Zone ATEX / poussières combustibles" }), E.fiche.warn({ alim: "BT 230 V monophasé" })], [true, true, false]);

// --- maçonnerie : document organisé en matériaux + ouvrages (bordereau), pas en catalogue de matériel
const MA = M.refOf("maconnerie");
eq("maçonnerie : 161 fiches", MA.count, 161);
eq("maçonnerie : 6 sous-ensembles de matériaux", MA.domaines.length, 6);
eq("maçonnerie : les 45 postes du bordereau sont dans « Ouvrages » (+15 ouvrages industriels)", MA.rows("ouvriers", "", "").length, 60);
eq("maçonnerie : aucun ouvrage dans les sous-ensembles de matériaux", MA.domaines.every((d) => MA.rows("produits", d[0], "").every((r) => r.tab === "produits")), true);
eq("maçonnerie : chaque famille de matériaux est rangée dans un sous-ensemble", ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12","M13","M14"].every((f) => MA.domaines.some((d) => d[3].includes(f))), true);
eq("maçonnerie : contrôles/sécurité/frais dans « divers », moyens dans « outils »", [MA.rows("autres", "", "").length, MA.rows("outils", "", "").length], [23, 5]);
eq("maçonnerie : Ciment Portland courant = EN 197-1, sans unité inventée", [MA.find("Ciment Portland courant").norm, MA.find("Ciment Portland courant").unit], ["EN 197-1", ""]);
eq("maçonnerie : ciment à prise rapide = aucune norme (le document n'en lie pas)", MA.find("Ciment à prise rapide").norm, "");
eq("maçonnerie : Fouilles en rigoles = m³", MA.find("Fouilles en rigoles").unit, "m³");
eq("maçonnerie : Évacuation des déblais = m³ ou tonne → deux unités", M.unitsOf(MA.find("Évacuation des déblais").unit), ["m³", "tonne"]);
eq("maçonnerie : Installation de chantier = forfait", MA.find("Installation de chantier").unit, "forfait");
eq("maçonnerie : acier Ø 12 mm = 0,889 kg/m (tableau du document)", /0,889 kg\/m/.test(MA.find("Acier d'armature Ø 12 mm").spec), true);
eq("maçonnerie : aucun prix, aucune quantité, aucun rendement", MA.rows("ouvriers", "", "").every((r) => !("price" in r) && !("qty" in r) && !("yield" in r)), true);
eq("maçonnerie : recherche « linteau » trouve le matériau préfabriqué", MA.rows("produits", "liants", "linteau").some((r) => r.name === "Linteau préfabriqué"), true);
eq("maçonnerie : noms uniques", new Set(["produits", "ouvriers", "autres", "outils"].flatMap((t) => (t === "produits" ? MA.domaines.flatMap((d) => MA.rows(t, d[0], "")) : MA.rows(t, "", ""))).map((r) => r.name.toLowerCase())).size, 161);
eq("maçonnerie : notes de vigilance sur le ciment", /ne compense pas un mauvais dosage/.test(MA.note("M1")), true);
eq("maçonnerie : aides = 7 rubriques, 17 erreurs, 14 lots, 6 documents", [MA.guide.sections.length, MA.guide.erreurs.length, MA.guide.travaux.length, MA.guide.plans.length], [7, 17, 14, 6]);
eq("maçonnerie : titres de l'onglet renommés", [MA.labels.ouvriers[0], MA.calc], ["Ouvrages et main-d'œuvre", true]);
eq("fiche maçonnerie : alerte structure pour fondations, béton armé, industriel", [MA.fiche.warn({ travaux: ["Fondations"] }), MA.fiche.warn({ travaux: ["Béton armé"] }), MA.fiche.warn({ projet: "Bâtiment industriel ou technique" })], [true, true, true]);
eq("fiche maçonnerie : pas d'alerte pour enduits seuls", [MA.fiche.warn({ travaux: ["Enduits"] }), MA.fiche.warn({})], [false, false]);
eq("norme maçonnerie : EN 998-2 imprimée", R.printableNorm("EN 998-2"), "EN 998-2");
eq("norme maçonnerie : double référence imprimée", R.printableNorm("EN 206 ; EN 13670"), "EN 206 ; EN 13670");
eq("norme maçonnerie : NF DTU imprimé", R.printableNorm("NF DTU 20.1"), "NF DTU 20.1");
eq("norme maçonnerie : texte libre non imprimé", R.printableNorm("Plans et notes de calcul approuvés"), "");
eq("norme maçonnerie : Eurocode seul sans EN non imprimé", R.printableNorm("Eurocode 2 à vérifier"), "");
eq("norme maçonnerie : vide non imprimé", R.printableNorm(""), "");
eq("ligne d'installation maçonnerie : lots, documents et béton écrits", installLine({ fiche: { projet: "Bâtiment résidentiel", travaux: ["Fondations", "Enduits"], plans: ["Plans de fondations"], beton: "Béton prêt à l'emploi" } }), '<div class="note">Bâtiment résidentiel · Fondations, Enduits · Plans de fondations · Béton prêt à l\'emploi</div>'.replace("l\\'", "l'"));

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
q.current.fiche = { projet: "Bâtiment résidentiel", alim: "BT 230 V monophasé", env: "", objet: "Fourniture et installation" };
eq("ligne d'installation imprimée (champs vides ignorés)", installLine(q.current), '<div class="note">Bâtiment résidentiel · BT 230 V monophasé · Fourniture et installation</div>');
eq("sans fiche : aucune ligne", installLine({}), "");
eq("plomberie : choix multiples écrits séparés par des virgules", installLine({ fiche: { travaux: ["Appareils sanitaires", "Chauffe-eau et production d'ECS"], objet: "Fourniture et pose" } }), '<div class="note">Fourniture et pose · Appareils sanitaires, Chauffe-eau et production d\'ECS</div>');
eq("ancien devis (clé elec) toujours lu", installLine({ elec: { projet: "Chantier BTP" } }), '<div class="note">Chantier BTP</div>');
const html = renderDoc({ quote: q.current, result: S.evaluate(q).result, company: S.state.db.company, conditions: [], presentation: {}, n: null, at: null, hash: null }, { draft: true, ref: q.ref });
eq("devis : norme et fiche présentes", html.includes("Norme de référence : IEC 60669-1") && html.includes("Bâtiment résidentiel"), true);
// devis maçonnerie : un ouvrage (étiquette « ouvrage ») est détaillé, pas noyé dans la main-d'œuvre
S.init(); S.state.db.settings.metier = "maconnerie"; S.state.db.settings.profil = "technicien";
const qm = S.createQuote(); qm.current.metier = "maconnerie"; qm.current.profil = "technicien";
S.saveItem({ id: "TER-O", ref: "TER-O", label: "Enduit extérieur", cat: "main_oeuvre", unit: "m²", pricing: "unitaire", price: 4000, cost: null, priceDate: null, supplier: "", brand: "", yield: null, yieldUnit: "m²", tags: ["ouvrage"], pack: "maconnerie", archived: false });
S.saveItem({ id: "TER-M", ref: "TER-M", label: "Maçon", cat: "main_oeuvre", unit: "jour", pricing: "unitaire", price: 10000, cost: null, priceDate: null, supplier: "", brand: "", yield: null, yieldUnit: "m²", tags: [], pack: "maconnerie", archived: false });
qm.current.showNorms = true;
qm.current.manual.push({ id: "o1", itemId: "TER-O", group: "Main-d'œuvre", mode: "fixed", qty: 96, option: false, label: "Enduit extérieur", nom: "Enduit extérieur", norm: "EN 13914 ; NF DTU 26.1" });
qm.current.manual.push({ id: "o2", itemId: "TER-M", group: "Main-d'œuvre", mode: "fixed", qty: 5, option: false, label: "Maçon", nom: "Maçon" });
const evm = S.evaluate(qm);
eq("maçonnerie : total = ouvrage + main-d'œuvre (aucun montant perdu)", evm.result.totals.base, 96 * 4000 + 5 * 10000);
for (const form of ["express", "detaille", "chantier"]) {
  qm.current.form = form;
  const h = renderDoc({ quote: qm.current, result: S.evaluate(qm).result, company: S.state.db.company, conditions: [], presentation: {}, n: null, at: null, hash: null }, { draft: true, ref: qm.ref });
  eq("maçonnerie, forme " + form + " : l'ouvrage est détaillé avec sa norme", h.includes("Enduit extérieur") && /384.000/.test(h) && h.includes("Norme de référence : EN 13914 ; NF DTU 26.1"), true);
  eq("maçonnerie, forme " + form + " : la main-d'œuvre simple reste un total", /Main-d'œuvre/.test(h), true);
}
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
