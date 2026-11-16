// Contrôle de l'application dans un vrai navigateur, à la taille d'un téléphone (iPhone 390 px, Android 360 px).
// Ce n'est pas un essai sur un vrai téléphone : c'est Chromium avec un écran de cette largeur.
//   python3 -m http.server 8123 &   puis   PW=/chemin/vers/@playwright/test node outils/controle-mobile.cjs
const { chromium } = require(process.env.PW || "@playwright/test");
const fs = require("fs");
const URL0 = process.env.URL0 || "http://localhost:8123/index.html";
const R = []; const ok = (n, v, d = "") => { R.push(v); console.log((v ? "OK    " : "ÉCHEC ") + n + (v || !d ? "" : "  → " + d)); };
const METIERS = ["peinture", "carrelage", "maconnerie", "plomberie", "electricite"];
const PRODUIT = { peinture: "Peinture acrylique", carrelage: "Carreaux", maconnerie: "Ciment", plomberie: "Tuyau PVC", electricite: "Câble électrique" };

async function ouvrir(ctx, met) {
  const p = await ctx.newPage(); p.erreurs = []; p.on("pageerror", (e) => p.erreurs.push(String(e).slice(0, 160)));
  await p.goto(URL0 + "#/devis");
  await p.locator(`[data-act="setMetier"][data-k="${met}"]`).click(); await p.waitForTimeout(120);
  await p.locator('[data-act="setProfil"][data-k="technicien"]').click(); await p.waitForTimeout(120);
  await p.locator('[data-act="newQuote"]').click(); await p.waitForTimeout(300);
  p.base = p.url().replace(/\/\d+$/, ""); return p;
}
const deborde = (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
async function ouvrirLigne(p, tab, nom) {
  let row = p.locator("button.rowc", { hasText: nom }).first();
  if (await row.count()) await row.click(); else { await p.locator(`[data-act="rowToggle"][data-key="new:${tab}"]`).click(); await p.waitForTimeout(120); await p.fill('[data-p="row.label"]', nom); await p.locator('[data-p="row.label"]').dispatchEvent("change"); }
  await p.waitForTimeout(150);
}
const saisir = async (p, champ, v) => { await p.fill(`[data-p="${champ}"]`, String(v)); await p.locator(`[data-p="${champ}"]`).dispatchEvent("change"); await p.waitForTimeout(220); };
const total = async (p) => (await p.locator(".total .big").first().textContent()).replace(/\s/g, "");

(async () => {
  const b = await chromium.launch();
  for (const [nomEcran, largeur, hauteur] of [["iPhone 390 px", 390, 844], ["Android 360 px", 360, 780]]) {
    console.log("\n=== " + nomEcran + " ===");
    for (const met of METIERS) {
      // Un téléphone neuf par métier : aucune donnée d'un essai précédent.
      const ctx = await b.newContext({ viewport: { width: largeur, height: hauteur }, serviceWorkers: "block", acceptDownloads: true, hasTouch: true, isMobile: true });
      const p = await ouvrir(ctx, met), T = `${met} · `;
      await saisir(p, "current.client.name", "M. Ndocko Paul");
      const d0 = await deborde(p);
      await p.goto(p.base + "/1"); await p.waitForTimeout(300);
      // 1. Ligne incomplète : plus de perte silencieuse
      await ouvrirLigne(p, "produits", PRODUIT[met]);
      await saisir(p, "row.qty", 12); await saisir(p, "row.price", 9500);
      const avert = p.locator("#lignemanque");
      ok(T + "ligne sans unité : avertissement visible", (await avert.count()) > 0 && (await avert.textContent()).includes("l'unité"));
      await p.locator('[data-act="rowClose"]').click(); await p.waitForTimeout(250);
      ok(T + "« Fermer » ne perd pas la ligne en silence", (await p.textContent("#app")).includes("Ligne non enregistrée"));
      await p.selectOption('[data-p="row.unit"]', { index: 1 }); // première unité proposée pour ce métier await p.waitForTimeout(350);
      ok(T + "avec l'unité, la ligne entre dans le devis (114 000)", (await total(p)).includes("114000"), await total(p));
      // 2. Aide au calcul de quantité (peinture et carrelage seulement)
      const lien = p.locator('[data-act="calcToggle"]');
      if (met === "carrelage" || met === "peinture") {
        ok(T + "aide au calcul de quantité proposée", (await lien.count()) > 0);
        await lien.first().click(); await p.waitForTimeout(250);
        await saisir(p, "calc.surface", 40); await saisir(p, "calc.couv", 1.44); await saisir(p, "calc.perte", 10);
        const res = await p.locator(".calc").textContent();
        ok(T + "calcul affiché avec sa formule (31)", res.includes("Quantité : 31") && res.includes("44 m² à couvrir"), res.slice(0, 160));
        await p.locator('[data-act="calcUse"]').click(); await p.waitForTimeout(350);
        ok(T + "quantité reprise dans la ligne (31 × 9 500 = 294 500)", (await total(p)).includes("294500"), await total(p));
      } else ok(T + "pas d'aide au m² (métier non chiffré à la surface)", (await lien.count()) === 0);
      const cl = p.locator('[data-act="rowClose"]'); if (await cl.count()) await cl.click(); await p.waitForTimeout(200);
      const d1 = await deborde(p);
      // 3. Rappels d'oublis et identité, à l'étape du prix
      await p.goto(p.base + "/2"); await p.waitForTimeout(400);
      const carte = p.locator("#oublis");
      const texte = (await carte.count()) ? await carte.textContent() : "";
      ok(T + "rappels d'oublis affichés (main-d'œuvre, transport…)", texte.includes("Aucune main-d'œuvre") && texte.includes("Transport"), texte.slice(0, 120));
      const n1 = await p.locator('#oublis [data-act="oubliNa"]').count();
      await p.locator('#oublis [data-act="oubliNa"]').first().click(); await p.waitForTimeout(300);
      const n2 = await p.locator('#oublis [data-act="oubliNa"]').count();
      ok(T + "« Pas besoin » écarte un rappel", n2 === n1 - 1, `${n1} → ${n2}`);
      ok(T + "les rappels ne bloquent pas l'envoi (PDF actif)", !(await p.locator('[data-act="pdf"]').isDisabled()));
      ok(T + "identité de l'entreprise demandée", (await p.locator("#identite").count()) > 0);
      await saisir(p, "company.name", "Ets Kamga " + met); await saisir(p, "company.phone", "677 12 34 56");
      ok(T + "nom de l'entreprise en tête du devis", (await p.locator("#doc .co").textContent()).includes("Ets Kamga"));
      ok(T + "identité remplie : la carte disparaît", (await p.locator("#identite").count()) === 0);
      const d2 = await deborde(p);
      ok(T + "aucun débordement horizontal sur les 3 écrans", !d0 && !d1 && !d2, `${d0} ${d1} ${d2}`);
      ok(T + "aucune erreur JavaScript", p.erreurs.length === 0, p.erreurs.join(" | "));
      if (met === "carrelage") {
        await p.screenshot({ path: `/tmp/mobile-${largeur}-prix.png` });
        await p.locator("#doc").screenshot({ path: `/tmp/mobile-${largeur}-doc.png` });
        await p.locator('[data-act="pdf"]').click(); await p.waitForSelector('[data-act="saveFile"]', { timeout: 40000 });
        const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }), p.locator('[data-act="saveFile"]').click()]);
        const f = `/tmp/mobile-${largeur}.pdf`; await dl.saveAs(f);
        ok(T + "PDF créé depuis le téléphone", fs.statSync(f).size > 50000, fs.statSync(f).size + " octets");
      }
      await ctx.close();
    }
  }
  await b.close();
  const n = R.filter(Boolean).length; console.log(`\n${n}/${R.length} vérifications réussies`); process.exit(n === R.length ? 0 : 1);
})().catch((e) => { console.error("ARRÊT", String(e).slice(0, 400)); process.exit(1); });
