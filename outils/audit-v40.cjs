// Audit v40 — scénarios nommés, joués dans un vrai navigateur (Playwright) PAR L'INTERFACE visible.
// Aucune fonction interne de l'application n'est appelée : on touche, on tape, on lit l'écran, on télécharge les fichiers.
// Chaque scénario rend : RÉUSSI / ÉCHOUÉ / NON TESTÉ, avec ses constats et ses preuves (captures, textes PDF/Word).
// Usage : PW=…/@playwright/test node outils/audit-v40.cjs [dossier] [filtre]
const { chromium } = require(process.env.PW);
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const URL = process.env.URL || "http://localhost:8123/index.html";
const OUT = path.resolve(process.argv[2] || "audit-v40/preuves"), FILTRE = process.argv[3] ? new RegExp(process.argv[3]) : null;
fs.mkdirSync(OUT, { recursive: true });
const LARG = +(process.env.LARG || 360);

// ---------- outils de lecture ----------
const norm = (s) => String(s || "").replace(/[  ]/g, " ").replace(/[ \t]+/g, " ");
const nombre = (s) => { const m = norm(s).match(/-?\d[\d ]*(,\d+)?/); return m ? Number(m[0].replace(/ /g, "").replace(",", ".")) : null; };
const montant = (n) => Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " "); // « 78 000 »
const contient = (texte, n) => /^\[OCR\]/.test(texte) ? (" " + norm(texte).replace(/(\d) (?=\d{3}\b)/g, "$1") + " ").includes(String(Math.round(n))) : norm(texte).includes(montant(n)); // OCR : « 113 125 » peut devenir « 113125 »
// Le PDF de l'application est une image (pas de texte) : on le lit par reconnaissance de caractères (tesseract, français).
function textePDF(f) { const t = norm(execFileSync("pdftotext", ["-layout", f, "-"]).toString()); if (t.trim().length > 20) return t;
  const base = f.replace(/\.pdf$/, "-p"); execFileSync("pdftoppm", ["-r", "200", "-png", f, base]); let out = "";
  for (const png of fs.readdirSync(path.dirname(f)).filter((x) => x.startsWith(path.basename(base)) && x.endsWith(".png")).sort()) { out += execFileSync("tesseract", [path.join(path.dirname(f), png), "-", "-l", "fra"], { stdio: ["ignore", "pipe", "ignore"] }).toString() + "\n"; }
  return "[OCR] " + norm(out); }
function texteWord(f) { const x = execFileSync("unzip", ["-p", f, "word/document.xml"]).toString(); return norm(x.replace(/<w:tab\/>/g, " ").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'").replace(/&quot;/g, '"')); }

// ---------- un scénario ----------
const RES = [];
async function scenario(id, metier, titre, fn) {
  if (FILTRE && !FILTRE.test(id)) return;
  const S = { id, metier, titre, statut: "RÉUSSI", constats: [], preuves: [], debut: Date.now(), gestes: 0 };
  const ok = (cond, quoi, detail = "") => { S.constats.push({ ok: !!cond, quoi, detail: String(detail).slice(0, 400) }); if (!cond) S.statut = "ÉCHOUÉ"; return !!cond; };
  const note = (quoi, detail = "") => S.constats.push({ ok: null, quoi, detail: String(detail).slice(0, 600) });
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: LARG, height: 760 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, acceptDownloads: true, locale: "fr-FR" });
  const p = await ctx.newPage(); const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(String(e.message).slice(0, 200)));
  p.on("dialog", (d) => d.dismiss().catch(() => {}));
  const A = outils(p, S, ok, note, ctx);
  try { await fn(A, p, ok, note); }
  catch (e) { S.statut = "ÉCHOUÉ"; S.constats.push({ ok: false, quoi: "Le scénario s'est arrêté", detail: String(e.message).split("\n")[0].slice(0, 300) }); await A.capture("arret").catch(() => {}); }
  if (erreurs.length) ok(false, "Erreurs JavaScript de l'application", erreurs.join(" / "));
  S.duree = Math.round((Date.now() - S.debut) / 1000);
  await b.close();
  RES.push(S); fs.appendFileSync(path.join(OUT, "resultats.jsonl"), JSON.stringify(S) + "\n");
  console.log(`${S.statut.padEnd(8)} ${id} — ${titre} (${S.duree} s)` + S.constats.filter((c) => c.ok === false).map((c) => `\n         ✘ ${c.quoi} ${c.detail ? "· " + c.detail.slice(0, 160) : ""}`).join(""));
}
function nonTeste(id, metier, titre, raison) { if (FILTRE && !FILTRE.test(id)) return; const S = { id, metier, titre, statut: "NON TESTÉ", constats: [{ ok: null, quoi: raison }], preuves: [] }; RES.push(S); fs.appendFileSync(path.join(OUT, "resultats.jsonl"), JSON.stringify(S) + "\n"); console.log(`NON TESTÉ ${id} — ${titre} · ${raison}`); }

// ---------- gestes de l'utilisateur ----------
function outils(p, S, ok, note, ctx) {
  const A = {
    ctx,
    async capture(nom, full = true) { const f = path.join(OUT, `${S.id}-${nom}.png`); await p.screenshot({ path: f, fullPage: full }); S.preuves.push(path.basename(f)); return f; },
    async lire() { return norm(await p.locator("#app").innerText()); },
    async attendre(ms = 250) { await p.waitForTimeout(ms); },
    bouton(re) { return p.locator("button:visible, a.btn:visible").filter({ hasText: re }).first(); },
    async toucher(loc, quoi) { await loc.scrollIntoViewIfNeeded().catch(() => {}); if (!(await loc.count())) throw new Error(`« ${quoi} » introuvable à l'écran`); S.gestes++; await loc.tap({ timeout: 5000 }); await p.waitForTimeout(250); },
    async demarrer(metier, profil = "technicien") {
      await p.goto(URL); await p.waitForTimeout(500);
      await A.toucher(p.getByRole("button", { name: new RegExp("^\\s*" + metier + "\\s*$") }).first(), metier);
      await A.toucher(p.getByText(profil === "technicien" ? /Je suis technicien/ : /Je suis une entreprise/).first(), "profil " + profil);
      await A.toucher(A.bouton(/Faire un devis|Nouveau devis/), "Faire un devis");
    },
    champ(re, n = 0) { return p.locator("label:visible").filter({ hasText: re }).nth(n).locator("xpath=following-sibling::*[self::input or self::select or self::textarea][1]"); },
    async taper(re, valeur, n = 0) { const f = A.champ(re, n); await f.scrollIntoViewIfNeeded().catch(() => {}); if (!(await f.count())) throw new Error(`Champ « ${re.source} » introuvable`); S.gestes++; await f.tap(); await f.fill(""); await f.pressSequentially(String(valeur), { delay: 5 }); await f.press("Tab"); await p.waitForTimeout(250); return f; },
    async choisir(re, valeur, n = 0) { const f = A.champ(re, n); await f.scrollIntoViewIfNeeded().catch(() => {}); await f.selectOption({ label: valeur }).catch(async () => f.selectOption(valeur)); await p.waitForTimeout(250); },
    async client(nom = "M. Mbarga Jean", tel = "6 77 12 34 56", lieu = "Bonamoussadi, Douala") { await A.taper(/Nom du client/, nom); if (tel) await A.taper(/Téléphone du client/, tel); if (lieu) await A.taper(/Quartier ou adresse|Adresse du chantier|Lieu/, lieu).catch(() => {}); },
    async debord(ou) { const d = await p.evaluate(() => { const w = window.innerWidth; const b = [...document.querySelectorAll("#app *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > w + 1 && getComputedStyle(e).position !== "fixed"; }).slice(0, 3).map((e) => e.tagName + "." + e.className + " " + (e.innerText || "").slice(0, 30)); return { sw: document.documentElement.scrollWidth, w, b }; }); if (d.sw > d.w + 1 || d.b.length) ok(false, `Débordement horizontal (${ou})`, JSON.stringify(d)); },
    async continuer() { await A.debord("avant Continuer"); await A.toucher(p.locator("button:visible").filter({ hasText: /^\s*Continuer/ }).first(), "Continuer"); await p.waitForTimeout(300); await A.debord("après Continuer"); },
    async precedent() { const b = p.locator("button:visible, a:visible").filter({ hasText: /Précédent|^\s*‹\s*$|^\s*<\s*$/ }).first(); if (await b.count()) await A.toucher(b, "Précédent"); else await p.goBack(); await p.waitForTimeout(300); },
    async total() { return nombre(await p.locator(".total .big").first().innerText()); },
    async lignes() { return p.locator("button.rowc.ok").evaluateAll((bs) => bs.map((b) => ({ nom: b.querySelector(".rn b")?.innerText.trim(), detail: b.querySelector(".rn small")?.innerText.trim(), total: b.querySelector(".rt")?.innerText.replace(/[▲▼]/g, "").trim() }))); },
    async ouvrirSection(re) { const s = p.locator("button.sech").filter({ hasText: re }).first(); if (!(await s.count())) throw new Error(`Section « ${re.source} » introuvable`); const txt = await s.innerText(); if (/▼/.test(txt)) await A.toucher(s, "section " + re.source); },
    ligne(nom) { return p.locator("button.rowc").filter({ has: p.locator(".rn b", { hasText: new RegExp("^\\s*" + nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$") }) }).first(); },
    async ouvrirLigne(nom) { const l = A.ligne(nom); if (!(await l.count())) throw new Error(`Produit « ${nom} » introuvable dans la liste`); await A.toucher(l, nom); },
    async remplirLigne({ qty, unit, price, nom }) {
      if (nom !== undefined) await A.taper(/^(Nom du produit|Désignation)$/, nom);
      if (qty !== undefined) await A.taper(/^Quantité$/, qty);
      if (unit !== undefined) { const u = A.champ(/^Unité$/); const opts = await u.locator("option").allInnerTexts(); if (unit === "auto") { const cur = await u.inputValue(); if (!cur) { const o1 = opts.find((x) => x.trim() !== "—"); if (o1) await u.selectOption({ label: o1 }); await p.waitForTimeout(250); } } else { const o = opts.find((x) => x.trim().toLowerCase() === String(unit).toLowerCase()) || opts.find((x) => x.toLowerCase().startsWith(String(unit).toLowerCase())); if (!o) throw new Error(`Unité « ${unit} » absente de la liste : ${opts.join(", ")}`); await u.selectOption({ label: o }); await p.waitForTimeout(250); } }
      if (price !== undefined) await A.taper(/^Prix (unitaire|pour 1)/, price);
    },
    async fermerLigne() { const f = p.locator("button:visible").filter({ hasText: /▲ Fermer/ }).first(); if (await f.count()) await A.toucher(f, "Fermer"); },
    async ajouter(nom, v) { await A.ouvrirLigne(nom); await A.remplirLigne(v); await A.fermerLigne(); },
    async ajouterLibre(section, v) { const b = p.locator("button.addrow:visible").filter({ hasText: section }).first(); await A.toucher(b, "＋ " + section.source); await A.remplirLigne(v); await A.fermerLigne(); },
    async rechercher(texte) { const f = p.locator('input[type=search]:visible').first(); if (!(await f.count())) return false; await f.scrollIntoViewIfNeeded(); await f.tap(); await f.fill(""); await f.pressSequentially(texte, { delay: 20 }); await p.waitForTimeout(500); return true; },
    async nomsVisibles(section = null) { return p.locator("button.rowc.empty:visible .rn b").allInnerTexts(); },
    async allerEtape3() { for (let k = 0; k < 6 && !(await p.locator('[data-act="pdf"]').count()); k++) await A.continuer(); },
    async apercu() { const d = p.locator("#doc").first(); await d.waitFor({ timeout: 8000 }); return norm(await d.innerText()); },
    async exporter(type) { // « pdf » ou « word » : touche le bouton, attend le fichier, l'enregistre
      const btn = type === "pdf" ? p.locator('[data-act="pdf"]').first() : p.locator('[data-act="word"]').first();
      await btn.scrollIntoViewIfNeeded(); if (await btn.isDisabled()) return { ok: false, raison: "bouton grisé" };
      await btn.tap(); const sv = await p.waitForSelector('[data-act="saveFile"]', { timeout: 60000 }).catch(() => null); if (!sv) return { ok: false, raison: "fichier jamais prêt" };
      const [d] = await Promise.all([p.waitForEvent("download", { timeout: 20000 }).catch(() => null), p.locator('[data-act="saveFile"]').first().tap()]);
      if (!d) return { ok: false, raison: "aucun téléchargement" };
      const f = path.join(OUT, `${S.id}.${type === "pdf" ? "pdf" : "docx"}`); await d.saveAs(f); S.preuves.push(path.basename(f));
      const texte = type === "pdf" ? textePDF(f) : texteWord(f); fs.writeFileSync(f + ".txt", texte); S.preuves.push(path.basename(f) + ".txt");
      return { ok: true, f, texte, nom: d.suggestedFilename() };
    },
  };
  return A;
}

// ======================================================================
// SCÉNARIOS
// ======================================================================
const METIERS = [["Peinture", "peinture"], ["Carrelage", "carrelage"], ["Maçonnerie", "maconnerie"], ["Plomberie", "plomberie"], ["Électricité", "electricite"]];
const SCEN = require("./audit-v40-scenarios.cjs");
(async () => {
  for (const s of SCEN({ scenario, nonTeste, METIERS, montant, contient, nombre, norm })) await s();
  const n = (st) => RES.filter((r) => r.statut === st).length;
  console.log(`\n${RES.length} scénarios : ${n("RÉUSSI")} réussis, ${n("ÉCHOUÉ")} échoués, ${n("NON TESTÉ")} non testés → ${OUT}/resultats.jsonl`);
})();
