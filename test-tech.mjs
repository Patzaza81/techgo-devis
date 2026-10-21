// Devis Technicien : reproduit les devis réels de TechGo (v4 de juillet 2026 et n° 1111 de mars 2026).
const _m = {};
globalThis.localStorage = { getItem: (k) => (k in _m ? _m[k] : null), setItem: (k, v) => { _m[k] = String(v); }, removeItem: (k) => { delete _m[k]; } };
const S = await import("./store.js");
const { renderDoc } = await import("./ui-doc.js");
let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + name + (ok ? "" : `  obtenu=${JSON.stringify(got)} attendu=${JSON.stringify(want)}`)); };
S.init(); S.state.db.settings.metier = "peinture"; S.state.db.settings.profil = "technicien";
let n = 0;
const item = (label, cat, unit, price) => { const id = "T-" + ++n; S.saveItem({ id, ref: id, label, cat, unit, pricing: "unitaire", price, cost: null, priceDate: null, supplier: "", brand: "", yield: null, yieldUnit: "m²", tags: [], pack: "", archived: false }); return id; };
const line = (q, id, qty, role) => q.current.manual.push({ id: "m" + ++n, itemId: id, group: "x", mode: "fixed", qty, option: false, ...(role ? { role } : {}) });
const snapOf = (q) => { const ev = S.evaluate(q); return { quote: q.current, result: ev.result, company: S.state.db.company, conditions: [], presentation: {}, n: null, at: null, hash: null }; };

// ----- Devis v4 TechGo (486 500 FCFA)
const q = S.createQuote();
eq("le devis créé est en mode technicien, plan 70/30", [q.current.profil, q.current.terms.payment.materials], ["technicien", [70, 30]]);
const mats = [["Mastic de pontage", 8000, 2], ["Pancoat Hydro 5 kg", 7000, 2], ["Stucco 5 kg", 7000, 2], ["Diluant white-spirit", 1000, 4], ["Peinture acrylique 30 kg", 22000, 6], ["Peinture alkyde noir", 15000, 2], ["Ciment 10 kg", 2500, 1], ["Kit fournitures", 25000, 1], ["Abrasifs", 12000, 1], ["Peinture Soytex 5 kg", 22000, 1]];
mats.forEach(([l, p, qn], i) => line(q, item(l, "materiaux", "pièce", p), qn, i === 0 ? "Traitement et rebouchage des fissures" : ""));
line(q, item("Main-d'œuvre technique (équipe TechGo)", "main_oeuvre", "forfait", 180000), 1);
line(q, item("Logistique et nettoyage de fin de chantier", "transport", "forfait", 35000), 1);
q.current.client.name = "M. Bangue"; q.current.site.name = "Peinture appartement"; q.current.site.address = "Bonapriso";
q.current.terms.delayMin = 5; q.current.terms.delayMax = 6; q.current.terms.crew = { workers: 3, extraDay: 30000 };
const ev = S.evaluate(q);
eq("total v4 = 486 500", ev.result.totals.base, 486500);
eq("fournitures = 271 500", ev.result.totals.matBase, 271500);
eq("échéancier 70/30 : somme = total", ev.result.schedules.base.combined.reduce((a, b) => a + b, 0), 486500);
const html = renderDoc(snapOf(q), { draft: true, ref: q.ref }).replace(/[\u202f\u00a0]/g, " ");
eq("document court : pas de section « Base de calcul des quantités »", html.includes("Base de calcul des quantités"), false);
eq("fournitures détaillées + rôle technique", html.includes("SOUS-TOTAL FOURNITURES") && html.includes("Traitement et rebouchage des fissures"), true);
eq("synthèse : main-d'œuvre 180 000 et logistique 35 000", html.includes("Main-d'œuvre") && html.includes("180 000 FCFA") && html.includes("35 000 FCFA"), true);
eq("arrêté en lettres", html.includes("quatre cent quatre-vingt-six mille cinq cents francs CFA"), true);
eq("acompte et solde", html.includes("Acompte (70 %)") && html.includes("Solde (30 %)"), true);
eq("précision main-d'œuvre : 3 ouvriers, 5 à 6 jours, supplément 30 000", html.includes("3 ouvriers") && html.includes("5 à 6 jours") && html.includes("30 000 FCFA"), true);
eq("mention d'avenant écrit", html.includes("avenant écrit"), true);
eq("pas de ligne de prix inconnu (—)", html.includes(">—<"), false);

// ----- Devis n° 1111 (766 000 de fournitures + 448 000 de main-d'œuvre = 1 214 000)
const q2 = S.createQuote();
[["Peinture acrylique", 18000, 10], ["Multiprim", 60000, 3], ["Soytex", 60000, 2], ["Peinture à huile", 60000, 1], ["Pantimat", 18500, 2], ["Diluant", 1000, 8], ["Bandes adhésives", 500, 6], ["Rouleaux et pinceaux", 500, 10], ["Papier abrasif P100", 500, 20], ["Pancoat Hydro", 18000, 4], ["Ciment ordinaire", 4500, 3], ["Colorants", 1500, 15], ["Papier cache", 10000, 1], ["Flintkote", 45000, 1]].forEach(([l, p, qn]) => line(q2, item(l + " ", "materiaux", "pièce", p), qn));
line(q2, item("Main-d'œuvre ", "main_oeuvre", "forfait", 448000), 1);
const t2 = S.evaluate(q2).result.totals;
eq("devis 1111 : fournitures 766 000", t2.matBase, 766000);
eq("devis 1111 : total 1 214 000", t2.base, 1214000);

// ----- Cas qui doivent échouer / rester sûrs
const q3 = S.createQuote(); line(q3, item("Sable ", "materiaux", "m³", null), 20);
const h3 = renderDoc(snapOf(q3), { draft: true, ref: q3.ref });
eq("prix inconnu : jamais compté à zéro, affiché « — »", h3.includes(">—<") && S.evaluate(q3).result.totals.base === 0, true);
S.state.db.settings.profil = "entreprise"; const q4 = S.createQuote();
eq("devis entreprise : modèle complet conservé", renderDoc(snapOf(q4), { draft: true, ref: q4.ref }).includes("Base de calcul des quantités"), true);
eq("devis entreprise : profil entreprise", q4.current.profil, "entreprise");
eq("ancien devis sans profil = entreprise", renderDoc({ ...snapOf(q4), quote: { ...q4.current, profil: undefined } }, {}).includes("Base de calcul des quantités"), true);
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
