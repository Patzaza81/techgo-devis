import { computeQuote, schedule, qtyFromYield, runChecks, fingerprint, equipmentCost } from "./engine.js";
import { ALL_SEEDS, referenceDraft, newDraft, compute, buildInput, regen, packExpects, PACKS, scaffoldLines } from "./packs.js";

let pass = 0, fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log((ok ? "OK   " : "FAIL ") + name + (ok ? "" : `  obtenu=${JSON.stringify(got)} attendu=${JSON.stringify(want)}`));
};
const settings = { minMarginPct: null };
const cat = () => ALL_SEEDS();
const clone = (x) => JSON.parse(JSON.stringify(x));

// ===== Devis de référence DEV-2026-09-001 =====
const ref = referenceDraft(settings);
const q = compute(ref, cat(), settings);
const L = (k) => q.lines.find((l) => l.id === "p1." + k);
eq("surface de calcul", q.calcSurface, 4860.45);
eq("Fixacoat 125", L("fix").qty, 125);
eq("Homay 2e 98", L("hom2").qty, 98);
eq("Homay 3e 49", L("hom3").qty, 49);
eq("Ciment 125", L("cim").qty, 125);
eq("Additif 294", L("add2").qty + L("add3").qty, 294);
eq("Multiprim 20", L("mp").qty, 20);
eq("Sous-total A", L("fix").total + L("hom2").total + L("hom3").total, 6425000);
eq("Sous-total B", ["p60", "p100", "p120", "p220"].reduce((a, k) => a + L(k).total, 0), 474500);
eq("Sous-total C", L("cim").total, 562500);
eq("Sous-total D", L("add2").total + L("add3").total, 1029000);
eq("Matériel base", q.totals.matBase, 8491000);
eq("MO application", ["l1", "l2", "l3", "l4", "l5", "l6"].reduce((a, k) => a + L(k).total, 0), 6943500);
eq("MO base avec transport", q.totals.svcBase, 7123500);
eq("TOTAL BASE", q.totals.base, 15614500);
eq("Option fourniture", L("mp").total, 1300000);
eq("Option pose", L("lp").total, 694350);
eq("TOTAL AVEC OPTION", q.totals.withOption, 17608850);
eq("Matériel 70/30 base", q.schedules.base.materials, [5943700, 2547300]);
eq("Matériel 70/30 option", q.schedules.option.materials, [6853700, 2937300]);
eq("MO 35/40/25 base", q.schedules.base.services, [2493225, 2849400, 1780875]);
eq("MO 35/40/25 option", q.schedules.option.services, [2736248, 3127140, 1954462]);
eq("Versements cumulés base", q.schedules.base.combined, [8436925, 5396700, 1780875]);
eq("Versements cumulés option", q.schedules.option.combined, [9589948, 6064440, 1954462]);
eq("Somme versements = total (base)", q.schedules.base.combined.reduce((a, b) => a + b, 0), 15614500);
eq("Somme versements = total (option)", q.schedules.option.combined.reduce((a, b) => a + b, 0), 17608850);
eq("Aucun avertissement sur la référence", q.warnings, []);
eq("TVA absente → null", q.totals.vatBase, null);

// ===== Arrondis et échéanciers =====
eq("pile sur le conditionnement", qtyFromYield(39, 0, 39), 1);
eq("+0,001 → supérieur", qtyFromYield(39.001, 0, 39), 2);
eq("perte 5 % : 100 m² / 50 → 3", qtyFromYield(100, 5, 50), 3);
let threw = false; try { schedule(1000, [60, 30]); } catch { threw = true; }
eq("échéancier ≠ 100 % rejeté", threw, true);
eq("échéancier somme exacte", schedule(1000, [33.33, 33.33, 33.34]).reduce((a, b) => a + b, 0), 1000);
eq("0,5 vers le haut", schedule(5, [50, 50]), [3, 2]);

// ===== Prix inconnu ≠ zéro =====
{
  const c = cat(); c.find((i) => i.id === "END-CIMENT").price = null;
  const r = compute(ref, c, settings);
  eq("prix inconnu → total null", r.lines.find((l) => l.id === "p1.cim").total, null);
  eq("prix inconnu signalé", r.unknownPrices, true);
  const ck = runChecks({ surface: 4629, result: r, workHeightM: 18, accessThresholdM: 3, decisions: ref.decisions, expects: packExpects(ref), hasDelay: true, hasValidity: true, hasPayment: true });
  eq("prix inconnu → contrôle bloqué", ck.status, "bloque");
}
// Article gratuit (0) ≠ inconnu
{
  const c = cat(); c.find((i) => i.id === "END-CIMENT").price = 0;
  const r = compute(ref, c, settings);
  eq("article gratuit → total 0, pas bloqué", [r.lines.find((l) => l.id === "p1.cim").total, r.unknownPrices], [0, false]);
}

// ===== Packs sans données : tout est bloquant, rien n'est inventé =====
{
  const d = newDraft(settings, "2026-10-20"); d.site.surface = 100; d.site.lossPct = 5;
  d.prestations = [{ id: "p1", packId: "peinture", prestId: "murs", params: { couches: 2, sousCouche: "oui", preparation: "oui" } }];
  const r = compute(d, cat(), settings);
  eq("peinture sans prix → prix inconnus", r.unknownPrices, true);
  const d2 = clone(d); d2.prestations[0].params.couches = null;
  const r2 = compute(d2, cat(), settings);
  eq("couches non saisies → quantité inconnue (pas 1)", r2.lines.find((l) => l.id === "p1.pf").flags.includes("qte_inconnue"), true);
}
{ // peinture avec données de test : quantité = surface+perte ÷ rendement × couches
  const c = cat();
  const f = c.find((i) => i.id === "PEI-FINITION"); f.price = 1000; f.yield = 10; f.cost = 600;
  const d = newDraft(settings, "2026-10-20"); d.site.surface = 100; d.site.lossPct = 5;
  d.prestations = [{ id: "p1", packId: "peinture", prestId: "murs", params: { couches: 2, sousCouche: "non", preparation: "non" } }];
  const r = compute(d, c, settings);
  eq("peinture : 105 m² × 2 couches ÷ 10 = 21 seaux", r.lines.find((l) => l.id === "p1.pf").qty, 21);
}
{ // carrelage : boîtes
  const c = cat(); const k = c.find((i) => i.id === "CAR-CARREAU"); k.price = 1;
  const d = newDraft(settings, "x"); d.site.surface = 10; d.site.lossPct = 5;
  d.prestations = [{ id: "p1", packId: "carrelage", prestId: "pose", params: { boxM2: 1.44, pertePct: 10 } }];
  const r = compute(d, c, settings);
  eq("carrelage : 10 m² + 10 % ÷ 1,44 → 8 boîtes", r.lines.find((l) => l.id === "p1.car").qty, 8);
}

// ===== Équipements : loué / possédé / sans double comptage =====
const rentItem = (o) => ({ id: "E", label: "Échaf", ownership: "loue", cat: "equip_loue", unit: "jour", tags: ["acces"], rent: { day: 1000, week: 6000, month: 20000, setup: 5000, teardown: 3000, setupPerM2: null, transport: 2000, minDays: null, setupIncluded: false, ...o } });
eq("location jour", equipmentCost(rentItem({}), { days: 10, trips: 1 }).cost, 1000 * 10 + 5000 + 3000 + 2000);
eq("location semaine : 10 j → 2 semaines", equipmentCost(rentItem({}), { days: 10, basis: "semaine", trips: 1 }).cost, 6000 * 2 + 5000 + 3000 + 2000);
eq("location mois : 31 j → 2 mois", equipmentCost(rentItem({}), { days: 31, basis: "mois", trips: 1 }).cost, 20000 * 2 + 5000 + 3000 + 2000);
eq("montage inclus : pas ajouté deux fois", equipmentCost(rentItem({ setupIncluded: true }), { days: 10, trips: 1 }).cost, 1000 * 10 + 2000);
eq("durée minimale", equipmentCost(rentItem({ minDays: 7, setup: null, teardown: null, transport: null }), { days: 3 }).cost, 7000);
eq("transport × 2 trajets", equipmentCost(rentItem({ setup: null, teardown: null }), { days: 1, trips: 2 }).cost, 1000 + 4000);
eq("montage au m²", equipmentCost(rentItem({ setup: null, teardown: null, setupPerM2: 10, teardownPerM2: 5, transport: null }), { days: 1, areaQty: 100 }).cost, 1000 + 1500);
eq("tarif manquant → coût inconnu", equipmentCost(rentItem({ day: null }), { days: 2 }).cost, null);
eq("durée manquante → coût inconnu", equipmentCost(rentItem({}), { days: null }).cost, null);
const own = { id: "O", ownership: "possede", ownCostDay: 800, cat: "equip_possede", unit: "jour", tags: ["outillage"] };
eq("possédé : coût interne, pas de location", equipmentCost(own, { days: 5 }).cost, 4000);
{
  const items = { E: rentItem({}), O: own };
  const run = (lines, extra = {}) => computeQuote({ surface: 10, lossPct: 0, lines, items, payment: { materials: [100], services: [100] }, ...extra });
  const rInc = run([{ id: "a", itemId: "O", mode: "equip", days: 5, bill: "inclus" }]);
  eq("possédé non refacturé → total 0, coût 4000", [rInc.lines[0].total, rInc.lines[0].cost], [0, 4000]);
  const rRef = run([{ id: "a", itemId: "O", mode: "equip", days: 5, bill: "refacture", markupPct: 25 }]);
  eq("possédé refacturé avec majoration 25 %", rRef.lines[0].total, 5000);
  const rNoM = run([{ id: "a", itemId: "O", mode: "equip", days: 5, bill: "refacture" }]);
  eq("refacturé sans majoration saisie → prix inconnu", rNoM.lines[0].flags.includes("prix_inconnu"), true);
  const dbl = run([{ id: "a", itemId: "E", mode: "equip", days: 5, bill: "inclus" }, { id: "b", itemId: "E", mode: "fixed", qty: 1, tag: "montage", forItem: "E" }]);
  eq("pas de double comptage signalé si montage non inclus", dbl.warnings.some((w) => w.startsWith("Double")), false);
  const items2 = { E: rentItem({ setupIncluded: true }) };
  const dbl2 = computeQuote({ surface: 1, lossPct: 0, items: items2, payment: { materials: [100], services: [100] }, lines: [{ id: "a", itemId: "E", mode: "equip", days: 5, bill: "inclus" }, { id: "b", itemId: "E", mode: "fixed", qty: 1, tag: "montage", forItem: "E" }] });
  eq("double comptage détecté (montage déjà inclus)", dbl2.warnings.some((w) => w.startsWith("Double")), true);
}
{ // module échafaudage
  const l = scaffoldLines({ id: "s1", itemId: "ACC-ECHAF-FIXE", longueur: 40, hauteur: 18, jours: 100, bill: "refacture", markupPct: 10 });
  eq("échafaudage : façade 40 × 18 = 720 m²", l[0].areaQty, 720);
}

// ===== Correction de quantité tracée =====
{
  const d = clone(ref); d.adjust["p1.fix"] = { override: { qty: 130, reason: "Reprise de support" } };
  const r = compute(d, cat(), settings); const f = r.lines.find((l) => l.id === "p1.fix");
  eq("quantité retenue 130, calculée 125 conservée", [f.qty, f.qtyCalc, f.overridden, f.overrideReason], [130, 125, true, "Reprise de support"]);
  eq("ratio suit la quantité retenue (ciment 130)", r.lines.find((l) => l.id === "p1.cim").qty, 130);
  const d2 = clone(ref); d2.adjust["p1.fix"] = { override: { qty: 130, reason: "" } };
  const r2 = compute(d2, cat(), settings);
  const ck = runChecks({ surface: 4629, result: r2, workHeightM: 18, accessThresholdM: 3, decisions: ref.decisions, expects: [], hasDelay: true, hasValidity: true, hasPayment: true });
  eq("correction sans motif → bloqué", ck.status, "bloque");
}

// ===== Remise, frais généraux, TVA, marge =====
{
  const d = clone(ref); d.terms.vatPct = 19.25;
  const r = compute(d, cat(), settings);
  eq("TVA 19,25 % sur 15 614 500 (0,5 haut)", r.totals.vatBase, Math.floor((15614500 * 1925 + 5000) / 10000));
  eq("TTC = HT + TVA", r.totals.ttcBase, 15614500 + r.totals.vatBase);
  eq("versements TTC = TTC", r.schedules.base.ttc.reduce((a, b) => a + b, 0), r.totals.ttcBase);
  const d2 = clone(ref); d2.discount = { pct: 10, amount: null };
  const r2 = compute(d2, cat(), settings);
  eq("remise 10 %", [r2.totals.discountBase, r2.totals.base], [1561450, 14053050]);
  eq("versements = total net après remise", r2.schedules.base.combined.reduce((a, b) => a + b, 0), 14053050);
  eq("versements option = total net option", r2.schedules.option.combined.reduce((a, b) => a + b, 0), r2.totals.withOption);
  const d3 = clone(ref); d3.discount = { pct: null, amount: 100000 };
  eq("remise en montant", compute(d3, cat(), settings).totals.base, 15514500);
  const d4 = clone(ref); d4.overhead = { pct: 5, mode: "ligne" };
  const r4 = compute(d4, cat(), settings);
  eq("frais généraux en ligne : +5 %", [r4.totals.overheadBase, r4.totals.base], [780725, 16395225]);
  const d5 = clone(ref); d5.overhead = { pct: 5, mode: "inclus" };
  eq("frais généraux inclus : pas ajoutés au total (pas de double comptage)", compute(d5, cat(), settings).totals.base, 15614500);
}
{ // marge : calculable seulement si tous les coûts sont connus
  eq("marge non calculable sans coûts", q.margin, null);
  const c = cat(); c.forEach((i) => { if (i.pack === "peinture" && i.price !== null) i.cost = Math.round(i.price * 0.8); });
  const r = compute(ref, c, settings);
  eq("marge calculable avec tous les coûts", r.margin !== null && r.margin.base.profit > 0, true);
  eq("taux de marque ≠ marge sur coût", r.margin.base.marginRatePct < r.margin.base.markupPct, true);
  const d = clone(ref); d.overhead = { pct: 10, mode: "inclus" };
  const r2 = compute(d, c, settings);
  eq("frais généraux réduisent le bénéfice", r2.margin.base.profit < r.margin.base.profit, true);
  const ck = runChecks({ surface: 4629, result: r, workHeightM: 18, accessThresholdM: 3, decisions: ref.decisions, expects: [], hasDelay: true, hasValidity: true, hasPayment: true, vatPct: 19.25, minMarginPct: 90 });
  eq("rentabilité sous le minimum → à vérifier", ck.items.some((i) => i.label.startsWith("Rentabilité insuffisante")), true);
  const d6 = clone(ref); d6.pricing = { method: "cout_plus_marge", markupPct: 25 };
  const r6 = compute(d6, c, settings);
  eq("coût + marge 25 % : Fixacoat 17 600 → 22 000", r6.lines.find((l) => l.id === "p1.fix").price, 22000);
  const r7 = compute(d6, cat(), settings);
  eq("coût + marge sans coûts → prix inconnu", r7.unknownPrices, true);
}

// ===== Contrôle des oublis =====
const ctxBase = (extra) => ({ surface: 4629, lossPct: 5, result: q, workHeightM: 18, accessThresholdM: 3, decisions: {}, expects: packExpects(ref), hasDelay: true, hasValidity: true, hasPayment: true, vatPct: null, ...extra });
eq("R+5 sans décision d'accès → bloqué", runChecks(ctxBase({})).status, "bloque");
eq("accès exclu explicitement → à vérifier", runChecks(ctxBase({ decisions: { acces: "exclu", transport: "inclus", protection: "na", nettoyage: "inclus", outillage: "exclu" } })).status, "verifier");
eq("hauteur absente → bloqué", runChecks(ctxBase({ workHeightM: null })).status, "bloque");
eq("seuil non défini → à vérifier (jamais deviné)", runChecks(ctxBase({ accessThresholdM: null, decisions: ref.decisions })).items.some((i) => i.label.startsWith("Seuil")), true);
eq("délai manquant → bloqué", runChecks(ctxBase({ decisions: ref.decisions, hasDelay: false })).status, "bloque");
eq("devis vide → bloqué", runChecks({ ...ctxBase({}), surface: 0, result: compute(newDraft(settings, "x"), cat(), settings) }).status, "bloque");
{
  const c = cat(); c.forEach((i) => { if (i.pack === "peinture" && i.price !== null) i.cost = 1; });
  const r = compute(ref, c, settings);
  const full = runChecks({ surface: 4629, lossPct: 5, result: r, workHeightM: 18, accessThresholdM: 3, decisions: { acces: "client", transport: "inclus", protection: "na", nettoyage: "inclus", outillage: "na" }, expects: packExpects(ref), hasDelay: true, hasValidity: true, hasPayment: true, vatPct: 19.25 });
  eq("tout renseigné → complet", full.status, "complet");
}
{ // accès chiffré via module échafaudage
  const c = cat(); const e = c.find((i) => i.id === "ACC-ECHAF-FIXE"); e.rent.day = 1000; e.rent.setupIncluded = true;
  const d = clone(ref); d.manual.push(...scaffoldLines({ id: "m1", itemId: "ACC-ECHAF-FIXE", longueur: 40, hauteur: 18, jours: 100, bill: "refacture", markupPct: 0 }));
  const r = compute(d, c, settings);
  eq("échafaudage chiffré ajouté au total (100 000)", r.totals.base, 15614500 + 100000);
  const ck = runChecks({ surface: 4629, result: r, workHeightM: 18, accessThresholdM: 3, decisions: { transport: "inclus", protection: "na", nettoyage: "inclus", outillage: "na" }, expects: [], hasDelay: true, hasValidity: true, hasPayment: true });
  eq("accès chiffré → plus de blocage d'accès", ck.items.some((i) => i.label === "Moyens d'accès chiffrés"), true);
}

// ===== Empreinte =====
eq("empreinte stable", fingerprint({ a: 1, b: [1, 2] }), fingerprint({ b: [1, 2], a: 1 }));
eq("empreinte sensible à un franc", fingerprint(q.totals) !== fingerprint({ ...q.totals, base: q.totals.base + 1 }), true);
eq("empreinte de 27 caractères", fingerprint(q).length, 27);

{ // architecture : un module par métier
  const ids = Object.keys(PACKS);
  eq("5 métiers, « enduits » n'est pas un métier", ids, ["peinture", "carrelage", "maconnerie", "plomberie", "electricite"]);
  eq("Peinture porte enduits ET peinture", PACKS.peinture.prestations.map((p) => p.id), ["systeme3", "murs"]);
  eq("chaque métier a id, version, articles, prestations", ids.every((k) => PACKS[k].id === k && PACKS[k].version && PACKS[k].seeds.length && PACKS[k].prestations.length), true);
  eq("articles d'un métier marqués de ce métier", ids.every((k) => PACKS[k].seeds.every((s) => s.pack === k)), true);
  eq("références d'articles uniques", new Set(ALL_SEEDS().map((s) => s.ref)).size, ALL_SEEDS().length);
  eq("alias d'anciennes données (enduits → peinture)", PACKS.enduits === PACKS.peinture, true);
  // contrôles portés par la prestation utilisée
  const d1 = newDraft(settings, "2026-10-20"); d1.prestations = [{ id: "p1", packId: "peinture", prestId: "systeme3", params: {} }];
  eq("enduit seul : attend les abrasifs, pas la préparation", packExpects(d1).map((e) => e.tag), ["abrasif"]);
  const d2 = clone(d1); d2.prestations = [{ id: "p1", packId: "peinture", prestId: "murs", params: {} }];
  eq("peinture seule : attend la préparation, pas les abrasifs", packExpects(d2).map((e) => e.tag), ["preparation"]);
  const d3 = clone(d1); d3.prestations.push({ id: "p2", packId: "peinture", prestId: "murs", params: {} });
  eq("les deux : les deux contrôles", packExpects(d3).map((e) => e.tag).sort(), ["abrasif", "preparation"]);
}

{ // contrôle de bon sens : total nul ou négatif
  const mk = (base) => ({ lines: [{ tags: [], flags: [], qty: 1, option: false, label: "x" }], warnings: [], totals: { base }, margin: null });
  const run = (base) => runChecks({ surface: 10, result: mk(base), workHeightM: 1, accessThresholdM: 5, decisions: {}, expects: [], hasDelay: true, hasValidity: true, hasPayment: true, vatPct: null });
  eq("total nul → bloqué", run(0).items.some((i) => i.state === "bloque" && /nul ou négatif/.test(i.label)), true);
  eq("total négatif → bloqué", run(-5).items.some((i) => i.state === "bloque" && /nul ou négatif/.test(i.label)), true);
  eq("total positif → pas de blocage de ce type", run(100).items.some((i) => /nul ou négatif/.test(i.label)), false);
}

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail ? 1 : 0);
