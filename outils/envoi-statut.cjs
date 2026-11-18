// Statut « Envoyé » : il ne s'obtient que par un partage confirmé par le téléphone, ou par la confirmation de l'artisan.
// 3 cas qui doivent donner « Envoyé », 4 cas qui ne doivent PAS le donner. Le partage du téléphone est simulé
// (navigator.share) : ce n'est pas un essai sur un vrai iPhone.
// Usage : PW=… node outils/envoi-statut.cjs
const { chromium } = require(process.env.PW);
const URL0 = process.env.URL0 || "http://localhost:8123/index.html";
let n = 0, ko = 0; const ok = (q, c, d = "") => { n++; if (!c) ko++; console.log(`${c ? "OK   " : "ÉCHEC"} ${q}${c ? "" : "  → " + String(d).slice(0, 200)}`); };
const pause = (p, ms = 300) => p.waitForTimeout(ms);

async function devisTermine(b, partage) { // partage : "ok" (le téléphone confirme), "annule" (l'artisan ferme le menu), null (pas de menu Partager)
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", acceptDownloads: true, isMobile: true, hasTouch: true });
  await ctx.addInitScript((mode) => {
    window.__partages = [];
    if (mode) { navigator.canShare = (d) => !!(d && d.files); navigator.share = async (d) => { window.__partages.push(d.files[0].name); if (mode === "annule") { const e = new Error("annulé"); e.name = "AbortError"; throw e; } }; }
  }, partage);
  const p = await ctx.newPage(); p.err = []; p.on("pageerror", (e) => p.err.push(String(e)));
  await p.goto(URL0 + "#/devis");
  await p.locator('[data-act="setMetier"][data-k="carrelage"]').click(); await pause(p);
  await p.locator('[data-act="setProfil"][data-k="technicien"]').click(); await pause(p);
  await p.locator('[data-act="newQuote"]').click(); await pause(p, 400);
  p.base = p.url().replace(/\/\d+$/, "");
  const f = async (k, v) => { await p.fill(`[data-p="${k}"]`, String(v)); await p.locator(`[data-p="${k}"]`).dispatchEvent("change"); await pause(p, 250); };
  await f("current.client.name", "M. Ndocko");
  await p.goto(p.base + "/1"); await pause(p, 400);
  await p.locator("button.rowc", { hasText: "Carreaux" }).first().click(); await pause(p);
  await p.locator(".chips.unites .chip", { hasText: "m²" }).click(); await pause(p); await f("row.qty", 40); await f("row.price", 9500);
  await p.goto(p.base + "/2"); await pause(p, 500); await f("company.name", "Ets Kamga"); await f("company.phone", "677123456");
  await p.locator('[data-act="tva"][data-v="0"]').click(); await pause(p);
  p.statut = async () => (await p.locator(".progtop .ref").first().innerText()).split("·").pop().trim();
  p.ctx = ctx; return p;
}

(async () => {
  const b = await chromium.launch();
  // A. Brouillon : PDF brouillon partagé et confirmé par le téléphone → reste brouillon (doit ÉCHOUER à devenir Envoyé)
  { const p = await devisTermine(b, "ok");
    await p.locator('[data-act="pdf"]').click(); await p.waitForSelector('[data-act="saveFile"]', { timeout: 60000 }); await p.locator('[data-act="saveFile"]').click(); await pause(p, 600);
    ok("A. PDF brouillon partagé : le devis reste « Brouillon »", (await p.statut()) === "Brouillon", await p.statut());
    // B. Terminer : version figée, PDF prêt, PAS envoyé
    await p.locator('[data-act="send"]').click(); await p.waitForSelector('[data-act="saveFile"]', { timeout: 60000 }); await pause(p, 300);
    ok("B. « Terminer… » : statut « Terminé, pas encore envoyé »", (await p.statut()) === "Terminé, pas encore envoyé", await p.statut());
    ok("B. bandeau « Pas encore envoyée au client » visible", (await p.locator("#pasenvoye").count()) === 1);
    // C. Partage du PDF de la version 1 confirmé par le téléphone → Envoyé
    await p.locator('[data-act="saveFile"]').click(); await pause(p, 600);
    ok("C. partage du PDF V1 confirmé par le téléphone : statut « Envoyé »", (await p.statut()) === "Envoyé", await p.statut());
    ok("C. le fichier partagé est bien celui de la V1", (await p.evaluate(() => window.__partages)).at(-1) === "DEV-2026-11-001-V1.pdf", JSON.stringify(await p.evaluate(() => window.__partages)));
    ok("C. le bandeau « pas encore envoyée » disparaît", (await p.locator("#pasenvoye").count()) === 0);
    await p.goto(p.base + "/3"); await pause(p, 400);
    ok("C. l'historique garde la preuve « partage confirmé par le téléphone »", /partage confirmé par le téléphone/.test(await p.innerText("#app")));
    ok("A–C. aucune erreur JavaScript", p.err.length === 0, p.err.join(" | ")); await p.ctx.close(); }
  // D. Menu Partager fermé sans envoyer → reste Terminé
  { const p = await devisTermine(b, "annule");
    await p.locator('[data-act="send"]').click(); await p.waitForSelector('[data-act="saveFile"]', { timeout: 60000 }); await pause(p, 300);
    await p.locator('[data-act="saveFile"]').click(); await pause(p, 600);
    ok("D. partage annulé par l'artisan : reste « Terminé, pas encore envoyé »", (await p.statut()) === "Terminé, pas encore envoyé", await p.statut());
    await p.ctx.close(); }
  // E. Téléphone sans menu Partager : téléchargement → reste Terminé ; F. confirmation explicite → Envoyé
  { const p = await devisTermine(b, null);
    await p.locator('[data-act="send"]').click(); await p.waitForSelector('[data-act="saveFile"]', { timeout: 60000 }); await pause(p, 300);
    const [d] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }), p.locator('[data-act="saveFile"]').click()]);
    ok("E. bouton « Télécharger le fichier » sur un téléphone qui ne sait pas partager", /Télécharger/.test(await p.locator('[data-act="saveFile"]').innerText()));
    ok("E. simple téléchargement : reste « Terminé, pas encore envoyé »", (await p.statut()) === "Terminé, pas encore envoyé" && !!d, await p.statut());
    await p.locator('[data-act="confirmEnvoi"]').first().click(); await pause(p, 400);
    ok("F. « J'ai envoyé la version 1 au client » : statut « Envoyé »", (await p.statut()) === "Envoyé", await p.statut());
    await p.goto(p.base + "/3"); await pause(p, 400);
    ok("F. l'historique garde « confirmé par l'artisan »", /confirmé par l'artisan/.test(await p.innerText("#app")));
    await p.ctx.close(); }
  // G. Word de la version 1 partagé et confirmé → Envoyé
  { const p = await devisTermine(b, "ok");
    await p.locator('[data-act="send"]').click(); await p.waitForSelector('[data-act="saveFile"]', { timeout: 60000 }); await pause(p, 300);
    await p.locator('[data-act="word"]').first().click(); await pause(p, 800);
    ok("G. Word de la V1 partagé et confirmé : statut « Envoyé »", (await p.statut()) === "Envoyé" && (await p.evaluate(() => window.__partages)).at(-1) === "DEV-2026-11-001-V1.docx", `${await p.statut()} ${JSON.stringify(await p.evaluate(() => window.__partages))}`);
    await p.ctx.close(); }
  await b.close(); console.log(`\n${n - ko}/${n} vérifications réussies`); process.exit(ko ? 1 : 0);
})();
