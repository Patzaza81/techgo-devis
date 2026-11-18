// Devis de 1, 30, 100 et 200 lignes : chargés par l'écran « Restaurer » de l'application, puis montants comparés
// sur 4 supports (écran, aperçu, PDF, Word) aux montants calculés à part (outils/gros-devis-gen.mjs).
// Contrôle aussi les pages du PDF (aucune ligne coupée, en-tête répété) et du Word rendu par LibreOffice.
// Usage : PW=… node outils/gros-devis.cjs dossier_genere [n…]
const { chromium } = require(process.env.PW); const fs = require("fs"); const path = require("path"); const cp = require("child_process");
const DIR = process.argv[2], NS = process.argv.slice(3);
const URL0 = process.env.URL0 || "http://localhost:8123/index.html";
let n = 0, ko = 0; const ok = (q, c, d = "") => { n++; if (!c) ko++; console.log(`${c ? "OK   " : "ÉCHEC"} ${q}${c ? "" : "  → " + String(d).slice(0, 300)}`); };
const esp = (s) => s.replace(/[  ]/g, " ");
const f = (x) => Number(x).toLocaleString("fr-FR").replace(/[  ]/g, " ");
const pdfPages = (file) => { const nb = Number((cp.execFileSync("pdfinfo", [file]).toString().match(/Pages:\s+(\d+)/) || [])[1]); return Array.from({ length: nb }, (_, i) => esp(cp.execFileSync("pdftotext", ["-layout", "-f", String(i + 1), "-l", String(i + 1), file, "-"]).toString())); };

(async () => {
  const b = await chromium.launch();
  for (const ID of NS.length ? NS : ["1", "30", "100", "200", "carrelage", "maconnerie", "plomberie", "electricite"]) {
    const att = JSON.parse(fs.readFileSync(path.join(DIR, `attendu-${ID}.json`), "utf8")), N = att.n, T = `${ID === String(N) ? N + " lignes" : att.met + " " + N + " lignes"} · `;
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block", acceptDownloads: true, isMobile: true, hasTouch: true });
    const p = await ctx.newPage(); const err = []; p.on("pageerror", (e) => err.push(String(e)));
    await p.goto(URL0 + "#/devis");
    await p.locator(`[data-act="setMetier"][data-k="${att.met}"]`).click(); await p.waitForTimeout(150);
    await p.locator('[data-act="setProfil"][data-k="technicien"]').click(); await p.waitForTimeout(150);
    await p.goto(URL0 + "#/reglages"); await p.waitForTimeout(400);
    await p.locator('[data-on="backupFile"]').setInputFiles(path.join(DIR, `devis-${ID}.json`)); await p.waitForSelector('[data-act="restore"]', { timeout: 15000 });
    await p.locator('[data-act="restore"]').click(); await p.waitForTimeout(600);
    await p.goto(URL0 + "#/devis"); await p.waitForTimeout(500);
    await p.locator("a, button").filter({ hasText: `Client essai ${ID}` }).first().click(); await p.waitForTimeout(600);
    const base = p.url().replace(/\/\d+$/, "").replace(/#\/devis\/([^/]+)$/, "#/devis/$1");
    await p.goto(base.replace(/\/$/, "") + "/2"); await p.waitForTimeout(1500);
    if (!(await p.locator("#doc").count())) { ok(T + "aperçu atteint", false, p.url()); await ctx.close(); continue; }
    // 1. Écran (bandeau du total) et 2. aperçu
    const ecran = esp(await p.locator(".total .big").first().innerText());
    ok(T + `écran : total ${f(att.ht)} HT${att.ttc === null ? "" : ` ou ${f(att.ttc)} TTC`}`, (att.ttc !== null && ecran.includes(f(att.ttc))) || ecran.includes(f(att.ht)), ecran);
    const ap = esp(await p.locator("#doc").innerText());
    const manq = (txt) => att.lignes.filter((l) => !txt.includes(f(l.total))).map((l) => l.nom.slice(0, 11) + " " + f(l.total));
    const montants = (txt, nom) => {
      ok(T + `${nom} : HT ${f(att.ht)}`, txt.includes(f(att.ht)));
      if (att.tva === null) ok(T + `${nom} : sans TVA, écrit « hors taxes » et aucune ligne TVA`, /hors taxes/i.test(txt) && !/TVA \d/.test(txt));
      else { ok(T + `${nom} : TVA ${f(att.tva)}`, txt.includes(f(att.tva))); ok(T + `${nom} : TTC ${f(att.ttc)}`, txt.includes(f(att.ttc))); }
      if (att.remise) ok(T + `${nom} : remise ${f(att.remise)}`, txt.includes(f(att.remise)));
      if (att.frais) ok(T + `${nom} : frais ${f(att.frais)}`, txt.includes(f(att.frais)));
      const m = manq(txt); ok(T + `${nom} : les ${N} montants de ligne`, m.length === 0, `${m.length} absents : ${m.slice(0, 5).join(" ; ")}`);
      const noms = att.lignes.filter((l) => !txt.replace(/\s+/g, " ").includes(l.nom.slice(0, 11))); ok(T + `${nom} : les ${N} lignes présentes`, noms.length === 0, noms.slice(0, 5).map((l) => l.nom.slice(0, 11)).join(", "));
    };
    montants(ap, "aperçu");
    // 3. PDF
    const bp = p.locator('[data-act="pdf"]').first(); await bp.scrollIntoViewIfNeeded(); await bp.click();
    const sv = await p.waitForSelector('[data-act="saveFile"]', { timeout: 180000 }).catch(() => null);
    if (sv) {
      const [d] = await Promise.all([p.waitForEvent("download", { timeout: 30000 }), p.locator('[data-act="saveFile"]').first().click()]);
      const fp = path.join(DIR, `sortie-${ID}.pdf`); await d.saveAs(fp);
      const pages = pdfPages(fp), tout = pages.join("\n");
      ok(T + `PDF en texte (${pages.length} page(s), ${Math.round(fs.statSync(fp).size / 1024)} Ko)`, tout.includes("DEVIS"));
      montants(tout, "PDF");
      // aucune ligne coupée : le nom (début et fin) et le montant d'une ligne sont sur la même page
      const coupees = [];
      for (const l of att.lignes) {
        const pg = pages.findIndex((t) => t.includes(l.nom.slice(0, 11))); if (pg < 0) continue;
        const mots = l.nom.split(/\s+/), fin = mots.slice(-2).join(" ");
        const t = pages[pg].replace(/\s+/g, " ");
        if (!t.includes(f(l.total)) || (l.nom.length > 40 && !t.includes(fin))) coupees.push(`${l.nom.slice(0, 11)} (p. ${pg + 1})`);
      }
      ok(T + "PDF : aucune ligne coupée entre deux pages (nom complet et montant sur la même page)", coupees.length === 0, coupees.slice(0, 6).join(", "));
      // toute page qui porte des lignes de tableau commence par l'en-tête du tableau
      const aDesLignes = (t) => /Article \d{3} — .*\s(m2|ml|pot|sac|pièce|jour|jours)\s+[\d ,]+\s+[\d ,]+/m.test(t);
      const sans = pages.map((t, i) => (i > 0 && aDesLignes(t) && !/DÉSIGNATION|Désignation/.test(t) ? i + 1 : null)).filter(Boolean);
      if (pages.length > 1) ok(T + "PDF : chaque page qui contient des lignes du tableau a l'en-tête", sans.length === 0, "pages sans en-tête : " + sans.join(","));
      const num = pages.map((t, i) => new RegExp(`Page ${i + 1} / ${pages.length}`).test(t)); ok(T + "PDF : pages numérotées « Page x / y »", num.every(Boolean), num.join(","));
    } else ok(T + "PDF créé", false, "jamais prêt");
    // 4. Word (+ rendu LibreOffice pour les pages)
    const bw = p.locator('[data-act="word"]').first(); await bw.scrollIntoViewIfNeeded();
    const [dw] = await Promise.all([p.waitForEvent("download", { timeout: 60000 }).catch(() => null), bw.click()]);
    if (dw) {
      const fw = path.join(DIR, `sortie-${ID}.docx`); await dw.saveAs(fw);
      const xml = cp.execFileSync("unzip", ["-p", fw, "word/document.xml"]).toString();
      const txt = esp(xml.replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&quot;/g, '"'));
      montants(txt, "Word");
      // Deuxième lecteur indépendant : python-docx (bibliothèque Word) + XML bien formé pour chaque partie du fichier
      try { const r = cp.execFileSync("python3", ["-c", "import sys,docx;d=docx.Document(sys.argv[1]);print(len(d.tables), sum(len(t.rows) for t in d.tables))", fw]).toString().trim(); ok(T + `Word lu par python-docx (${r.split(" ")[0]} tableaux, ${r.split(" ")[1]} lignes)`, true); }
      catch (e) { ok(T + "Word lu par python-docx", false, e.message); }
      { const parts = cp.execFileSync("unzip", ["-Z1", fw]).toString().trim().split("\n").filter((x) => /\.(xml|rels)$/.test(x)); const bad = parts.filter((x) => { try { cp.execFileSync("sh", ["-c", `unzip -p "${fw}" "${x.replace(/([\[\]])/g, "\\$1")}" | xmllint --noout -`], { stdio: "ignore" }); return false; } catch { return true; } });
        ok(T + `Word : ${parts.length} parties XML bien formées`, bad.length === 0, bad.join(", ")); }
      ok(T + "Word : chaque ligne de tableau est insécable", (xml.match(/<w:tr>/g) || []).length === (xml.match(/<w:cantSplit\/>/g) || []).length);
      try {
        cp.execFileSync("soffice", ["--headless", "--convert-to", "pdf", "--outdir", path.join(DIR, "lo"), fw], { stdio: "ignore", timeout: 180000 });
        const lp = pdfPages(path.join(DIR, "lo", `sortie-${ID}.pdf`)), lt = lp.join("\n");
        ok(T + `Word rendu (LibreOffice) : ${lp.length} page(s), TTC ${f(att.ttc)}`, lt.includes(f(att.ttc)));
        const coup = att.lignes.filter((l) => { const pg = lp.findIndex((t) => t.includes(l.nom.slice(0, 11))); return pg >= 0 && !lp[pg].replace(/\s+/g, " ").includes(f(l.total)); });
        ok(T + "Word rendu : aucune ligne coupée entre deux pages", coup.length === 0, coup.slice(0, 5).map((l) => l.nom.slice(0, 11)).join(", "));
      } catch (e) { ok(T + "Word rendu par LibreOffice", false, e.message); }
    } else ok(T + "Word créé", false);
    ok(T + "aucune erreur JavaScript", err.length === 0, err.join(" | "));
    await ctx.close();
  }
  await b.close(); console.log(`\n${n - ko}/${n} vérifications réussies`); process.exit(ko ? 1 : 0);
})();
