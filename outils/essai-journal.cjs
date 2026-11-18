// Journal d'essai, par l'écran : activé par le lien, export CSV sans contenu saisi, absent sans le lien.
const { chromium } = require(process.env.PW); const fs = require("fs");
let n = 0, ko = 0; const ok = (q, c, d = "") => { n++; if (!c) ko++; console.log(`${c ? "OK   " : "ÉCHEC"} ${q}${c ? "" : "  → " + d}`); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 780 }, serviceWorkers: "block", acceptDownloads: true, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const err = []; p.on("pageerror", (e) => err.push(String(e)));
  await p.goto("http://localhost:8123/index.html#/reglages"); await p.waitForTimeout(500);
  ok("sans le lien d'essai : pas de carte « Journal d'essai »", (await p.locator("#journal").count()) === 0);
  await p.goto("http://localhost:8123/index.html?essai=1#/devis"); await p.waitForTimeout(500);
  await p.locator('[data-act="setMetier"][data-k="peinture"]').click(); await p.waitForTimeout(150);
  await p.locator('[data-act="setProfil"][data-k="technicien"]').click(); await p.waitForTimeout(150);
  await p.locator('[data-act="newQuote"]').click(); await p.waitForTimeout(400);
  await p.fill('[data-p="current.client.name"]', "M. Ndocko Secret"); await p.locator('[data-p="current.client.name"]').dispatchEvent("change"); await p.waitForTimeout(300);
  await p.goto(p.url().replace(/#.*/, "#/reglages")); await p.waitForTimeout(500);
  ok("avec ?essai=1 : carte « Journal d'essai » dans Réglages", (await p.locator("#journal").count()) === 1);
  const [d] = await Promise.all([p.waitForEvent("download"), p.locator('[data-act="journalCsv"]').click()]);
  const f = "/tmp/b41/journal.csv"; await d.saveAs(f); const t = fs.readFileSync(f, "utf8");
  ok("CSV : en-tête « heure;type;détail »", t.includes("heure;type;détail"), t.slice(0, 80));
  ok("CSV : écrans, boutons et champs notés", /;écran;/.test(t) && /;bouton;setMetier:peinture/.test(t) && /;saisie;current\.client\.name/.test(t), t.slice(0, 400));
  ok("CSV : le nom du client n'y est pas", !t.includes("Ndocko") && !t.includes("Secret"));
  ok("CSV : l'identifiant du devis est masqué", !/#\/devis\/(?!x\/)[^;\n]+\/\d/.test(t), t.match(/#\/devis\/[^;\n]*/g)?.join(" "));
  await p.locator('[data-act="journalStop"]').click(); await p.waitForTimeout(400);
  await p.goto("http://localhost:8123/index.html#/reglages"); await p.waitForTimeout(500);
  ok("« Arrêter » : la carte disparaît", (await p.locator("#journal").count()) === 0);
  ok("aucune erreur JavaScript", err.length === 0, err.join(" | "));
  await b.close(); console.log(`\n${n - ko}/${n} vérifications réussies`); process.exit(ko ? 1 : 0);
})();
