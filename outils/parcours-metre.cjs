// Parcours complet « métré → devis → PDF/Word → envoi → négociation → commande → paiement » dans Chromium,
// à la taille d'un téléphone (iPhone 390 px, Android 360 px). Ce n'est PAS un essai sur un vrai téléphone.
//   python3 -m http.server 8123 &   puis   PW=/chemin/vers/@playwright/test node outils/parcours-metre.cjs
// Les prix saisis ici sont des valeurs d'essai (pour vérifier les totaux à la main), pas des prix de référence.
const { chromium } = require(process.env.PW || "@playwright/test");
const fs = require("fs");
const URL0 = process.env.URL0 || "http://localhost:8123/index.html";
const R = []; const ok = (n, v, d = "") => { R.push(v); console.log((v ? "OK    " : "ÉCHEC ") + n + (v || !d ? "" : "  → " + String(d).slice(0, 260))); };
const pause = (p, ms = 200) => p.waitForTimeout(ms);
const deborde = (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const total = async (p) => (await p.locator(".total .big").first().textContent()).replace(/[^\d]/g, "");
const txt = async (p, sel) => ((await p.locator(sel).count()) ? (await p.locator(sel).first().textContent()).replace(/[  ]/g, " ") : "");
const V = async (p, k, v) => { const l = p.locator(`.sheet.metre [data-p$=".v.${k}"]`); await l.fill(String(v)); await l.dispatchEvent("change"); await pause(p); };
const sel = async (p, k, v) => { await p.locator(`.sheet.metre [data-p$=".v.${k}"]`).selectOption(v); await pause(p, 300); };
const coche = async (p, k) => { await p.locator(`.sheet.metre [data-p$=".v.${k}"]`).check(); await pause(p, 300); };
const plus = async (p, k, nom) => { await p.locator(`.sheet.metre [data-act="metreAdd"][data-k="${k}"]${nom ? `[data-nom="${nom}"]` : ":not([data-nom])"}`).click(); await pause(p, 300); };
async function prix(p, nom, v) {
  let row = p.locator('button.rowc[data-act="rowToggle"]', { hasText: nom }).first();
  if (!(await row.count())) { for (const s of await p.locator('[data-act="secToggle"]').all()) { if (!(await row.count())) { await s.click(); await pause(p); } } row = p.locator('button.rowc[data-act="rowToggle"]', { hasText: nom }).first(); }
  if (!(await row.count())) return false;
  await row.click(); await pause(p, 250);
  const f = p.locator('[data-p="row.price"]'); await f.fill(String(v)); await f.dispatchEvent("change"); await pause(p, 300);
  const c = p.locator('[data-act="rowClose"]'); if (await c.count()) await c.click(); await pause(p, 250); return true;
}
const qteLigne = async (p, nom) => txt(p, `button.rowc[data-act="rowToggle"]:has-text("${nom}") small`);

// Un chantier d'essai par métier : mêmes nombres que test-metre.mjs (calculs écrits là-bas).
const CHANTIERS = {
  peinture: { type: "p_piece", zone: "Salon", async saisir(p) { await V(p, "longueur", 4); await V(p, "largeur", 3); await V(p, "hauteur", 2.8); await plus(p, "ouv"); await V(p, "ouv.0.l", 0.9); await V(p, "ouv.0.h", 2.1); await plus(p, "ouv"); await V(p, "ouv.1.l", 1.2); await V(p, "ouv.1.h", 1.2); await coche(p, "plafond"); await plus(p, "prod", "Peinture acrylique"); await V(p, "prod.0.couches", 2); await V(p, "prod.0.couv", 40); await V(p, "perte", 5); await sel(p, "moMode", "ouvrier"); await V(p, "moRend", 25); await V(p, "moOuv", 2); },
    calcul: ["47,87", "2 × (4 + 3) × 2,8 = 39,2 m²", "÷ 40 m² par pot = 2,51"], lignes: [["Peinture acrylique", "3 Pot", 25000], ["Travaux de peinture — 2 ouvriers", "4 journée d'ouvrier", 8000]], total: 107000 },
  carrelage: { type: "c_sol", zone: "Séjour", async saisir(p) { await V(p, "longueur", 5); await V(p, "largeur", 4); await V(p, "carreau", "Grès 60×60"); await V(p, "cA", 60); await V(p, "cB", 60); await V(p, "parCarton", 4); await V(p, "perte", 10); await V(p, "colle", 5); await V(p, "colleSac", 25); await V(p, "jointC", 0.5); await V(p, "jointSac", 5); await coche(p, "plinthes"); await V(p, "portes", 0.9); await V(p, "plinthe", 60); await V(p, "perteP", 10); await sel(p, "moMode", "tache"); },
    calcul: ["5 × 4 = 20 m²", "÷ 1,44 m² par carton", "= 15,28"], lignes: [["Grès 60×60", "16 Carton", 12000], ["Colle à carrelage", "4 Sac", 6000], ["Joint de carrelage", "2 Sac", 3500], ["Plinthes", "32 Pièce", 800], ["Pose de carrelage", "20 m²", 3000]], total: 308600 },
  maconnerie: { type: "m_mur", zone: "Clôture", async saisir(p) { await V(p, "longueur", 10); await V(p, "hauteur", 3); await V(p, "blocNom", "Parpaing de 15"); await V(p, "blocL", 40); await V(p, "blocH", 20); await V(p, "joint", 1); await V(p, "perte", 5); await coche(p, "mortier"); await V(p, "blocE", 15); await V(p, "ciment", 350); await V(p, "sac", 50); await V(p, "sable", 1); await sel(p, "moMode", "ouvrier"); await V(p, "moRend", 10); await V(p, "moOuv", 3); },
    calcul: ["10 × 3 = 30 m²", "= 11,61 blocs par m²", "0,319 m³"], lignes: [["Parpaing de 15", "366 Pièce", 350], ["Ciment", "3 Sac", 5200], ["Sable", "0,32 m³", 15000], ["Élévation de mur — 3 ouvriers", "9 journée d'ouvrier", 6000]], total: 202500 },
  plomberie: { type: "pl_reseau", zone: "Salle de bain", async saisir(p) { await V(p, "tuyau", "Tube PVC Ø100"); await V(p, "longueur", 23); await V(p, "perte", 10); await V(p, "barre", 4); await plus(p, "art", "Coude"); await V(p, "art.0.n", 6); await V(p, "colEsp", 80); await sel(p, "moMode", "tache"); },
    calcul: ["23 ml mesurés + 10 % de pertes = 25,3 ml", "÷ 4 m par barre = 6,33"], lignes: [["Tube PVC Ø100", "7 Barre", 4500], ["Colliers pour Tube PVC Ø100", "30 Pièce", 300], ["Coude", "6 Pièce", 1200], ["Pose de tuyauterie", "23 ml", 1000]], total: 70700 },
  electricite: { type: "e_ligne", zone: "Rez-de-chaussée", async saisir(p) { await V(p, "cable", "Câble 3G2,5"); await V(p, "nombre", 2); await V(p, "longueur", 18); await V(p, "reserve", 0.3); await V(p, "racc", 6); await V(p, "perte", 10); await V(p, "rouleau", 100); await V(p, "conduit", "Gaine ICTA Ø20"); await V(p, "rouleauC", 25); await sel(p, "moMode", "tache"); },
    calcul: ["= 43,56 ml", "÷ 100 m par rouleau = 0,44", "ne sont pas calculés"], lignes: [["Câble 3G2,5", "1 Rouleau", 45000], ["Gaine ICTA Ø20", "2 Rouleau", 9000], ["Tirage de câble", "36 ml", 500]], total: 81000 },
};

(async () => {
  const b = await chromium.launch();
  for (const [ecran, largeur, hauteur] of [["iPhone 390 px", 390, 844], ["Android 360 px", 360, 780]]) {
    console.log("\n=== " + ecran + " ===");
    for (const [met, C] of Object.entries(CHANTIERS)) {
      const ctx = await b.newContext({ viewport: { width: largeur, height: hauteur }, serviceWorkers: "block", acceptDownloads: true, hasTouch: true, isMobile: true });
      const p = await ctx.newPage(), T = `${met} · `; const err = []; p.on("pageerror", (e) => err.push(String(e).slice(0, 200))); p.on("dialog", (d) => d.accept());
      await p.goto(URL0 + "#/devis");
      await p.locator(`[data-act="setMetier"][data-k="${met}"]`).click(); await pause(p);
      await p.locator('[data-act="setProfil"][data-k="technicien"]').click(); await pause(p);
      await p.locator('[data-act="newQuote"]').click(); await pause(p, 300);
      const base = p.url().replace(/\/\d+$/, "");
      { const l = p.locator('[data-p="current.client.name"]'); await l.fill("Mme Ebongue Claire"); await l.dispatchEvent("change"); await pause(p); }
      await p.goto(base + "/1"); await pause(p, 300);
      // 1. Décrire le chantier
      ok(T + "carte « Métré du chantier » présente", (await p.locator("#metre").count()) === 1);
      await p.locator('[data-act="metreZoneAdd"]').click(); await pause(p, 300);
      { const l = p.locator('[data-p="current.metre.zones.0.nom"]'); await l.fill(C.zone); await l.dispatchEvent("change"); await pause(p, 300); }
      const nbTypes = await p.locator('[data-act="metreOuvAdd"]').count();
      ok(T + "types d'ouvrage proposés pour ce métier seulement", nbTypes >= 2 && (await p.locator(`[data-act="metreOuvAdd"]:not([data-t^="${C.type.split("_")[0]}_"])`).count()) === 0, nbTypes);
      await p.locator(`[data-act="metreOuvAdd"][data-t="${C.type}"]`).click(); await pause(p, 300);
      ok(T + "ouvrage vide : signalé « Il manque », aucune ligne dans le devis", (await txt(p, "#mresult")).includes("Il manque") && (await total(p)) === "0", await total(p));
      await C.saisir(p);
      const res = await txt(p, "#mresult");
      const fiche = await txt(p, ".sheet.metre");
      for (const c of C.calcul) ok(T + `explication affichée : « ${c} »`, fiche.includes(c), fiche.slice(-400));
      ok(T + "ouvrage complet : plus rien ne manque", !res.includes("Il manque"), res);
      ok(T + "formulaire regroupé par rubriques", (await p.locator(".sheet.metre .mg").count()) >= 2);
      ok(T + "chaque quantité dit si elle est exacte ou estimée", (await p.locator("#mresult .mest").count()) >= 1);
      if (met === "peinture" || met === "maconnerie") ok(T + "main-d'œuvre : jours de chantier × ouvriers, et prix attendu écrit", /jours? de chantier/.test(res) && res.includes("UN ouvrier pour UNE journée"), res.slice(-300));
      const dMetre = await deborde(p);
      if (met === "carrelage" || met === "maconnerie") await p.screenshot({ path: `/tmp/metre-${met}-${largeur}.png`, fullPage: true });
      await p.locator('.sheet.metre [data-act="metreOuv"]').click(); await pause(p, 300);
      // 2. Les quantités sont dans le devis, rangées par nature ; il ne reste que les prix
      for (const [nom, q] of C.lignes) { const s = await qteLigne(p, nom); ok(T + `ligne « ${nom} » : ${q}`, s.replace(/\s+/g, " ").includes(q), s); }
      for (const [nom, , pu] of C.lignes) ok(T + `prix saisi sur « ${nom} »`, await prix(p, nom, pu));
      ok(T + `total vérifiable à la main : ${C.total}`, (await total(p)) === String(C.total), await total(p));
      // 3. Explication dans la ligne et écart si on change la quantité à la main
      const [n0, q0] = C.lignes[0];
      await p.locator('button.rowc[data-act="rowToggle"]', { hasText: n0 }).first().click(); await pause(p, 300);
      if (met === "peinture") { await p.locator('button.rowc[data-act="rowToggle"]', { hasText: "ouvriers" }).first().click(); await pause(p, 300); const f = await txt(p, ".sheet:not(.metre)"); ok(T + "ligne de main-d'œuvre : « Prix pour 1 journée d'ouvrier » et calcul des journées", f.includes("Prix pour 1 journée d'ouvrier") && f.includes("× 2 ouvriers = 4 journées d'ouvrier"), f.slice(0, 400)); await p.locator('[data-act="rowClose"]').click(); await pause(p, 250); await p.locator('button.rowc[data-act="rowToggle"]', { hasText: n0 }).first().click(); await pause(p, 300); }
      ok(T + "la ligne explique sa quantité (calcul du métré)", (await txt(p, "#explmetre")).includes("Quantité calculée par le métré") && (await txt(p, "#explmetre")).includes(C.zone));
      { const f = p.locator('[data-p="row.qty"]'); await f.fill("999"); await f.dispatchEvent("change"); await pause(p, 350); }
      ok(T + "quantité changée à la main : écart signalé, pas écrasé", (await txt(p, "#explmetre")).includes("tu as écrit 999") && (await txt(p, "#metre")).includes("tu as écrit 999"), await txt(p, "#explmetre"));
      await p.locator('#explmetre [data-act="metreReprendre"]').click(); await pause(p, 350);
      { const c = p.locator('[data-act="rowClose"]'); if (await c.count()) await c.click(); await pause(p, 250); }
      ok(T + "« Reprendre » remet la quantité du métré et le total", (await total(p)) === String(C.total) && (await qteLigne(p, n0)).includes(q0), await total(p));
      // 4. Plusieurs zones : copier la zone → les quantités s'additionnent, l'arrondi se fait sur le total
      await p.locator('[data-act="metreZone"]').first().click(); await pause(p, 250);
      if (!(await p.locator('[data-act="metreZoneCopie"]').count())) { await p.locator('[data-act="metreZone"]').first().click(); await pause(p, 250); }
      await p.locator('[data-act="metreZoneCopie"]').click(); await pause(p, 350);
      ok(T + "zone copiée : 2 zones, total augmenté", (await p.locator(".mzone").count()) === 2 && Number(await total(p)) > C.total, await total(p));
      await p.locator('[data-act="metreLignes"]').click(); await pause(p, 250);
      const dl = await txt(p, "#metre .mcalc");
      ok(T + "détail des quantités : les deux zones et le total sont écrits", dl.includes(C.zone + " (copie)") && dl.includes("Total :"), dl.slice(0, 200));
      await p.locator('[data-act="metreLignes"]').click(); await pause(p, 200);
      // suppression de la copie (deux touchers : demander, confirmer)
      await p.locator('[data-act="metreAsk"]').last().click(); await pause(p, 250);
      await p.locator('[data-act="metreZoneDel"]').click(); await pause(p, 350);
      ok(T + "zone supprimée : retour au total d'origine", (await total(p)) === String(C.total), await total(p));
      const dLignes = await deborde(p);
      // 5. Étape du prix : contrôle du métré, impression du métré, PDF et Word
      await p.goto(base + "/2"); await pause(p, 400);
      ok(T + "carte de contrôle du métré à l'étape du prix", (await p.locator("#metrecontrole").count()) === 1);
      if (met === "peinture" || met === "maconnerie") ok(T + "durée calculée proposée (main-d'œuvre à la journée)", (await txt(p, "#metrecontrole")).includes("Durée d'après ton métré"), await txt(p, "#metrecontrole"));
      { for (const [k, v] of [["company.name", "Ets Kamga " + met], ["company.phone", "677 12 34 56"]]) { const l = p.locator(`[data-p="${k}"]`); if (await l.count()) { await l.fill(v); await l.dispatchEvent("change"); await pause(p, 250); } } }
      const doc = await txt(p, "#doc");
      ok(T + "le devis imprime le détail du métré (zone + formule)", doc.includes("Détail du métré".toUpperCase()) || doc.includes("Détail du métré"), doc.slice(-300));
      ok(T + "le devis porte les fournitures du métré", C.lignes.filter(([n]) => !/^(Pose|Travaux|Élévation|Tirage)/.test(n)).every(([n]) => doc.includes(n)));
      const dPrix = await deborde(p);
      ok(T + "aucun débordement horizontal (métré, lignes, prix)", !dMetre && !dLignes && !dPrix, `${dMetre} ${dLignes} ${dPrix}`);
      if (largeur === 390 || met === "peinture") {
        await p.locator('[data-act="pdf"]').click(); await p.waitForSelector('[data-act="saveFile"]', { timeout: 60000 });
        const [d1] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }), p.locator('[data-act="saveFile"]').click()]);
        const f = `/tmp/metre-${met}-${largeur}.pdf`; await d1.saveAs(f);
        const txt = require("child_process").execFileSync("pdftotext", [f, "-"]).toString();
        ok(T + "PDF créé depuis l'écran de téléphone (texte lisible)", fs.statSync(f).size > 5000 && /DEVIS/.test(txt) && /TOTAL|Total/.test(txt), fs.statSync(f).size);
      }
      // 6. Cycle de vie complet (une fois par écran, en peinture) : envoi, Word, négociation, acceptation, facture, paiement
      if (met === "peinture") {
        const mk = p.locator('[data-act="mark"][data-to="pret"]'); if (await mk.count()) { await mk.click(); await pause(p, 400); }
        await p.locator('[data-act="send"]').first().click(); await pause(p, 500);
        ok(T + "version 1 envoyée (et figée)", (await txt(p, "#app")).includes("Version 1 envoyée"), (await txt(p, ".banner")).slice(0, 120));
        const w = p.locator('[data-act="word"]').first();
        if (await w.count()) { await w.click(); await p.waitForSelector('[data-act="saveFile"]', { timeout: 30000 }); const [d2] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }), p.locator('[data-act="saveFile"]').click()]); const f = `/tmp/metre-${met}-${largeur}.docx`; await d2.saveAs(f); ok(T + "Word créé (version figée)", fs.statSync(f).size > 5000, fs.statSync(f).size); } else ok(T + "bouton Word présent après l'envoi", false);
        await p.goto(base + "/1"); await pause(p, 400);
        ok(T + "devis envoyé : le métré est verrouillé (aucun bouton d'ajout)", (await p.locator('[data-act="metreZoneAdd"]').count()) === 0 && (await p.locator("#metre").count()) === 1);
        await p.goto(base + "/3"); await pause(p, 400);
        await p.locator('[data-act="startNeg"]').click(); await pause(p, 500);
        await p.goto(base + "/1"); await pause(p, 400);
        // négociation : le client retire le plafond → les quantités baissent toutes seules
        await p.locator('[data-act="metreZone"]').first().click(); await pause(p, 250);
        if (!(await p.locator('[data-act="metreOuv"]').count())) { await p.locator('[data-act="metreZone"]').first().click(); await pause(p, 250); }
        await p.locator('[data-act="metreOuv"]').first().click(); await pause(p, 300);
        await p.locator('.sheet.metre [data-p$=".v.plafond"]').uncheck(); await pause(p, 400);
        // sans plafond : 35,87 × 2 × 1,05 ÷ 40 = 1,88 → 2 pots ; 35,87 ÷ 25 × 2 = 2,87 → 3 journées : 2 × 25 000 + 3 × 8 000 = 74 000
        ok(T + "négociation : plafond retiré → 74 000 (2 pots + 3 journées)", (await total(p)) === "74000", await total(p));
        await p.goto(base + "/2"); await pause(p, 400);
        await p.locator('[data-act="send"]').first().click(); await pause(p, 500);
        await p.goto(base + "/3"); await pause(p, 400);
        const suivi = await txt(p, "#app");
        ok(T + "historique : V1 (107 000) et V2 (74 000), intégrité vérifiée", suivi.includes("V1") && suivi.includes("V2") && suivi.includes("107 000") && suivi.includes("74 000") && !suivi.includes("NON VÉRIFIÉE"), suivi.slice(0, 200));
        { const l = p.locator('[data-p="accept.by"]'); await l.fill("Mme Ebongue"); await l.dispatchEvent("change"); await pause(p, 250); }
        await p.locator('[data-act="accept"]').click(); await pause(p, 500);
        await p.goto(URL0 + "#/suivi"); await pause(p, 400);
        ok(T + "commande créée à 74 000", (await txt(p, "#app")).includes("74 000"));
        await p.locator('[data-act="invoice"]').first().click(); await pause(p, 400);
        await p.locator('[data-act="pay"]').first().click(); await pause(p, 400);
        ok(T + "première tranche facturée puis payée", (await txt(p, "#app")).includes("payé le"));
        ok(T + "suivi : pas de débordement horizontal", !(await deborde(p)));
      }
      ok(T + "aucune erreur JavaScript", err.length === 0, err.join(" | "));
      await ctx.close();
    }
  }
  // 7. Mémoire de l'entreprise : jamais de valeur reprise sans confirmation, jamais le format d'un autre produit
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", hasTouch: true, isMobile: true }); const p = await ctx.newPage(); const C = CHANTIERS.carrelage; const err = []; p.on("pageerror", (e) => err.push(String(e).slice(0, 200)));
    await p.goto(URL0 + "#/devis"); await p.locator('[data-act="setMetier"][data-k="carrelage"]').click(); await pause(p); await p.locator('[data-act="setProfil"][data-k="technicien"]').click(); await pause(p); await p.locator('[data-act="newQuote"]').click(); await pause(p, 300);
    const base = p.url().replace(/\/\d+$/, ""); await p.goto(base + "/1"); await pause(p, 300);
    await p.locator('[data-act="metreZoneAdd"]').click(); await pause(p, 300); await p.locator('[data-act="metreOuvAdd"][data-t="c_sol"]').click(); await pause(p, 300);
    ok("mémoire · premier ouvrage : rien à confirmer", (await p.locator("#mconf").count()) === 0);
    await C.saisir(p);
    await p.locator('.sheet.metre [data-act="metreOuv"]').click(); await pause(p, 250);
    await p.locator('[data-act="metreChoix"]').click(); await pause(p, 250); await p.locator('[data-act="metreOuvAdd"][data-t="c_sol"]').click(); await pause(p, 300);
    const val = (k) => p.locator(`.sheet.metre [data-p$=".v.${k}"]`).inputValue();
    ok("mémoire · deuxième pièce : dimensions, nom et format du carreau VIDES", (await val("longueur")) === "" && (await val("carreau")) === "" && (await val("cA")) === "" && (await val("parCarton")) === "", `${await val("cA")}/${await val("parCarton")}`);
    ok("mémoire · deuxième pièce : pertes et colle proposées, bandeau « à confirmer »", (await val("perte")) === "10" && (await val("colle")) === "5" && (await p.locator("#mconf").count()) === 1 && (await p.locator(".mf.rep").count()) >= 4);
    // saisie au doigt : le calcul se met à jour sans fermer le clavier
    await p.locator('.sheet.metre [data-p$=".v.longueur"]').tap(); await p.keyboard.type("3"); await p.locator('.sheet.metre [data-p$=".v.largeur"]').tap(); await p.keyboard.type("3");
    const actif = await p.evaluate(() => (document.activeElement && document.activeElement.dataset.p) || "");
    await p.locator('.sheet.metre [data-p$=".v.deduire"]').tap(); await pause(p, 600);
    ok("saisie au doigt · le champ suivant garde le focus", /largeur$/.test(actif), actif);
    ok("saisie au doigt · le calcul est à jour (3 × 3 = 9 m²)", (await txt(p, "#mresult")).includes("3 × 3 = 9 m²"), await txt(p, "#mresult"));
    await V(p, "carreau", "Marbre 80×80");
    ok("mémoire · autre carreau : le format du premier n'est PAS repris", (await val("cA")) === "" && (await val("parCarton")) === "");
    await V(p, "carreau", "grès 60×60");
    ok("mémoire · même carreau : son format est repris (60 × 60, 4 par carton)", (await val("cA")) === "60" && (await val("cB")) === "60" && (await val("parCarton")) === "4", `${await val("cA")}/${await val("parCarton")}`);
    await V(p, "carreau", "Grès 60×60");
    ok("mémoire · tant que ce n'est pas confirmé : le devis garde 16 cartons", (await qteLigne(p, "Grès 60×60")).includes("16 Carton"), await qteLigne(p, "Grès 60×60"));
    await p.locator('[data-act="metreConfirmer"]').tap(); await pause(p, 400);
    // 20 + 9 = 29 m² ; × 1,10 ÷ 1,44 = 22,15 → 23 cartons
    ok("mémoire · après « Oui, je les garde » : 23 cartons (29 m²)", (await qteLigne(p, "Grès 60×60")).includes("23 Carton") && (await p.locator("#mconf").count()) === 0, await qteLigne(p, "Grès 60×60"));
    // troisième ouvrage : « Non, tout vider »
    await p.locator('.sheet.metre [data-act="metreOuv"]').click(); await pause(p, 250);
    await p.locator('[data-act="metreChoix"]').click(); await pause(p, 250); await p.locator('[data-act="metreOuvAdd"][data-t="c_sol"]').click(); await pause(p, 300);
    await p.locator('[data-act="metreVider"]').tap(); await pause(p, 400);
    ok("mémoire · « Non, tout vider » : pertes et colle vidées, plus de bandeau", (await val("perte")) === "" && (await val("colle")) === "" && (await p.locator("#mconf").count()) === 0);
    await p.locator('[data-act="metreAsk"]').first().click(); await pause(p, 250); await p.locator('[data-act="metreOuvDel"]').click(); await pause(p, 300);
    // main-d'œuvre saisie à la main en plus de celle du métré → signalée
    for (const s of await p.locator('[data-act="secToggle"]').all()) { if (!(await p.locator('[data-act="rowToggle"][data-key="new:ouvriers"]').count())) { await s.click(); await pause(p); } }
    await p.locator('[data-act="rowToggle"][data-key="new:ouvriers"]').click(); await pause(p, 250);
    { const l = p.locator('[data-p="row.label"]'); await l.fill("Carreleur"); await l.dispatchEvent("change"); await pause(p, 250); const q = p.locator('[data-p="row.qty"]'); await q.fill("3"); await q.dispatchEvent("change"); await pause(p, 250); await p.locator('[data-p="row.unit"]').selectOption({ index: 1 }); await pause(p, 250); const c = p.locator('[data-act="rowClose"]'); if (await c.count()) await c.click(); await pause(p, 250); }
    await p.goto(base + "/2"); await pause(p, 400);
    const ctl = await txt(p, "#metrecontrole");
    ok("double comptage · main-d'œuvre saisie à la main en plus du métré : signalée", ctl.includes("comptée deux fois") && ctl.includes("Carreleur"), ctl.slice(0, 300));
    ok("contrôle · les quantités estimées sont listées (colle, joint)", (await txt(p, "#metreest")).includes("Colle à carrelage"), await txt(p, "#metreest"));
    ok("mémoire · aucune erreur JavaScript", err.length === 0, err.join(" | "));
    await p.screenshot({ path: "/tmp/metre-controle-390.png", fullPage: false });
    await ctx.close(); }
  await b.close();
  const n = R.filter(Boolean).length; console.log(`\n${n}/${R.length} vérifications réussies`); process.exit(n === R.length ? 0 : 1);
})().catch((e) => { console.error("ARRÊT", String(e).slice(0, 600)); process.exit(1); });
