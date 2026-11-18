// Aucune donnée perdue à la mise à jour : des devis sont créés avec le CODE des anciennes versions (main = production,
// metier/v32), puis le téléphone ouvre la nouvelle version avec ces mêmes données (même stockage du navigateur).
// On compare : nombre de devis, statuts, lignes, versions envoyées (empreinte intacte, montants inchangés), clients, catalogue,
// et l'écran de la nouvelle version (liste des devis, ouverture d'un devis envoyé, aperçu de la version figée).
// Usage : PW=… node outils/migration-donnees.cjs   (anciens serveurs : 8131 = main, 8132 = metier/v32 ; nouveau : 8123)
const { chromium } = require(process.env.PW);
let n = 0, ko = 0; const ok = (q, c, d = "") => { n++; if (!c) ko++; console.log(`${c ? "OK   " : "ÉCHEC"} ${q}${c ? "" : "  → " + String(d).slice(0, 300)}`); };
const ANCIENS = [["main (production)", "http://localhost:8131/index.html"], ["metier/v32", "http://localhost:8132/index.html"]];
const NOUVEAU = "http://localhost:8123/index.html";

(async () => {
  const b = await chromium.launch();
  for (const [nom, url] of ANCIENS) {
    const T = `${nom} → nouvelle version · `;
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
    const p = await ctx.newPage(); const err = []; p.on("pageerror", (e) => err.push(String(e)));
    await p.goto(url); await p.waitForTimeout(800);
    // Données créées par l'ancienne version, avec son propre code (store.js de cette version)
    const avant = await p.evaluate(async () => {
      const S = await import("./store.js"); const { referenceDraft } = await import("./packs.js");
      localStorage.clear(); S.init(); // espace neuf AVEC les prix de référence (sinon le devis de référence est incomplet)
      const db = () => S.state.db;
      const mk = () => { const q = S.createQuote(); q.current = { ...referenceDraft(db().settings), ref: q.ref, date: S.today() }; return q; };
      const q1 = mk(); // brouillon modifié
      q1.current.client = { ...q1.current.client, name: "Client brouillon" }; q1.current.discount = { pct: 5, amount: null }; S.commit();
      const q2 = mk(); q2.current.client = { ...q2.current.client, name: "Client envoyé" }; S.setStatus(q2, "pret"); S.freezeVersion(q2); // envoyé (ancien code)
      const q3 = mk(); q3.current.client = { ...q3.current.client, name: "Client accepté" }; S.setStatus(q3, "pret"); S.freezeVersion(q3);
      S.accept(q3, { by: "M. Test", date: S.today(), note: "accord", option: false });
      const q4 = mk(); q4.current.client = { ...q4.current.client, name: "Client négociation" }; S.setStatus(q4, "pret"); S.freezeVersion(q4); S.startNegotiation(q4); q4.current.discount = { pct: 10, amount: null }; S.commit();
      const c = S.saveClient ? (S.saveClient({ name: "Client fichier", phone: "699000000" }), 1) : 0;
      const resume = (q) => ({ id: q.id, ref: q.ref, statut: q.status, client: q.current.client.name, lignes: (q.current.manual || []).length + (q.current.prestations || []).length,
        versions: q.versions.map((v) => ({ n: v.n, hash: v.hash, base: v.result.totals.base, ttc: v.result.totals.ttcBase })), courant: S.evaluate(q).result.totals.base });
      const brut = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); brut[k] = localStorage.getItem(k); }
      return { devis: db().quotes.map(resume), clients: db().clients.length, articles: db().catalogue.length, commandes: (db().orders || []).length, brut };
    });
    ok(T + `données créées par l'ancienne version (${avant.devis.length} devis, ${avant.clients} clients, ${avant.articles} articles)`, avant.devis.length === 4);
    // Le même navigateur ouvre la nouvelle version (même stockage)
    const p2 = await ctx.newPage(); const err2 = []; p2.on("pageerror", (e) => err2.push(String(e)));
    await p2.addInitScript((brut) => { if (!sessionStorage.getItem("seed")) { localStorage.clear(); for (const [k, v] of Object.entries(brut)) localStorage.setItem(k, v); sessionStorage.setItem("seed", "1"); } }, avant.brut);
    await p2.goto(NOUVEAU); await p2.waitForTimeout(1000);
    const apres = await p2.evaluate(async () => {
      const S = await import("./store.js"); S.init(); const db = () => S.state.db;
      const resume = (q) => ({ id: q.id, ref: q.ref, statut: q.status, client: q.current.client.name, lignes: (q.current.manual || []).length + (q.current.prestations || []).length,
        versions: q.versions.map((v) => ({ n: v.n, hash: v.hash, base: v.result.totals.base, ttc: v.result.totals.ttcBase, verif: S.verifyVersion(v) })), courant: S.evaluate(q).result.totals.base });
      return { devis: db().quotes.map(resume), clients: db().clients.length, articles: db().catalogue.length, commandes: (db().orders || []).length };
    });
    ok(T + "même nombre de devis", apres.devis.length === avant.devis.length, `${avant.devis.length} → ${apres.devis.length}`);
    ok(T + "même nombre de clients, d'articles, de commandes", apres.clients === avant.clients && apres.articles === avant.articles && apres.commandes === avant.commandes, JSON.stringify([avant.clients, avant.articles, avant.commandes, apres.clients, apres.articles, apres.commandes]));
    for (const a of avant.devis) {
      const z = apres.devis.find((x) => x.id === a.id); const t = `${T}« ${a.client} » `;
      if (!z) { ok(t + "retrouvé", false); continue; }
      ok(t + `: statut gardé (${a.statut})`, z.statut === a.statut, `${a.statut} → ${z.statut}`);
      ok(t + ": référence, client et lignes gardés", z.ref === a.ref && z.client === a.client && z.lignes === a.lignes);
      ok(t + `: ${a.versions.length} version(s) figée(s) intactes (empreinte et montants identiques)`, JSON.stringify(z.versions.map(({ n, hash, base, ttc }) => ({ n, hash, base, ttc }))) === JSON.stringify(a.versions));
      for (const v of z.versions) ok(t + `: V${v.n} reconnue comme intacte`, v.verif.ok, v.verif.reasons.join(" ; ") + " " + (v.verif.notes || []).join(" "));
      const notes = z.versions.flatMap((v) => v.verif.notes || []); if (notes.length) console.log(`      note : ${notes.join(" | ")}`);
      if (z.courant !== a.courant) console.log(`      écart sur le brouillon en cours (recalculé avec la nouvelle règle d'arrondi) : ${a.courant} → ${z.courant}`);
      ok(t + ": total du brouillon en cours inchangé, ou écart ≤ 1 FCFA par ligne (règle d'arrondi)", Math.abs(z.courant - a.courant) <= Math.max(1, a.lignes), `${a.courant} → ${z.courant}`);
    }
    // Écran de la nouvelle version
    await p2.goto(NOUVEAU + "#/devis"); await p2.waitForTimeout(700);
    // Données sans métier choisi (créées directement par le code de l'ancienne version) : la nouvelle version pose la question une fois
    const q1 = await p2.innerText("#app"); const demande = /Quel est ton métier/.test(q1);
    if (demande) { ok(T + "si le métier n'est pas encore choisi : la question annonce que les devis existants vont s'afficher", /Tes 4 devis déjà créés/.test(q1), q1.slice(0, 200));
      await p2.locator('[data-act="setMetier"][data-k="peinture"]').click(); await p2.waitForTimeout(300);
      if (await p2.locator('[data-act="setProfil"][data-k="technicien"]').count()) { await p2.locator('[data-act="setProfil"][data-k="technicien"]').click(); await p2.waitForTimeout(300); } }
    const liste = await p2.innerText("#app");
    ok(T + "écran : les 4 devis sont listés", ["Client brouillon", "Client envoyé", "Client accepté", "Client négociation"].every((c) => liste.includes(c)), liste.slice(0, 300));
    const env = avant.devis.find((d) => d.client === "Client envoyé");
    await p2.goto(NOUVEAU + `#/devis/${env.id}/2`); await p2.waitForTimeout(900);
    const ap = (await p2.innerText("#app")).replace(/[  ]/g, " ");
    ok(T + "écran : le devis envoyé avant la mise à jour reste « Envoyé » (pas de faux « pas encore envoyé »)", /Envoyé/.test(ap) && !/Pas encore envoyée au client/.test(ap));
    ok(T + `écran : l'aperçu de la V1 montre son montant d'origine (${env.versions[0].base.toLocaleString("fr-FR").replace(/[  ]/g, " ")})`, ap.includes(env.versions[0].base.toLocaleString("fr-FR").replace(/[  ]/g, " ")));
    ok(T + "aucune erreur JavaScript (ancienne et nouvelle version)", !err.length && !err2.length, [...err, ...err2].join(" | "));
    await ctx.close();
  }
  await b.close(); console.log(`\n${n - ko}/${n} vérifications réussies`); process.exit(ko ? 1 : 0);
})();
