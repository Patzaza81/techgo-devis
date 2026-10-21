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
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
