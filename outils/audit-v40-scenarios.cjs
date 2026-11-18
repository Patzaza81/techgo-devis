// Scénarios de l'audit v40. Chaque valeur attendue est calculée ICI, à la main, indépendamment de l'application.
module.exports = ({ scenario, nonTeste, METIERS, montant, contient, nombre, norm }) => [

  // ---------------------------------------------------------------- CATALOGUE : cycle complet par métier
  ...[["Peinture", "PEI", { a: "Ciment ordinaire", b: "Sous-couche", c: "Multiprim" }], ["Carrelage", "CAR", { a: "Colle à carrelage", b: "Joint de carrelage", c: "Croisillons" }],
      ["Maçonnerie", "MAC", { ra: "ciment", rb: "sable", rc: "gravier" }], ["Plomberie", "PLO", { ra: "PER", rb: "siphon", rc: "robinet" }], ["Électricité", "ELE", { ra: "disjoncteur", rb: "prise", rc: "interrupteur" }]]
   .map(([met, code, P]) => () => scenario(code + "-C1", met, "Catalogue : chercher, ajouter, modifier, remplacer, doublon, retirer, retour, rechargement, produit absent", async (A, p, ok, note) => {
    await A.demarrer(met); await A.client(); await A.continuer();
    const choisir = async (cle) => { // nom réel d'un produit : liste à plat (peinture, carrelage) ou recherche dans le référentiel
      if (P[cle]) return P[cle];
      const cherche = P["r" + cle]; const a = await A.rechercher(cherche); ok(a, `Champ de recherche présent (« ${cherche} »)`);
      const noms = await A.nomsVisibles(); note(`Résultats pour « ${cherche} »`, `${noms.length} : ${noms.slice(0, 8).join(" ; ")}`);
      ok(noms.length > 0, `La recherche « ${cherche} » donne au moins un résultat`); return noms[0];
    };
    const n1 = await choisir("a"); await A.ajouter(n1, { qty: 4, unit: "auto", price: 5000 });
    ok((await A.total()) === 20000, `Ajout « ${n1} » : 4 × 5 000 = 20 000`, await A.total());
    const n2 = await choisir("b"); await A.ajouter(n2, { qty: 2, unit: "auto", price: 3000 });
    ok((await A.total()) === 26000, `Ajout « ${n2} » : total 26 000`, await A.total());
    await A.capture("ajouts");
    // modification
    await A.ouvrirLigne(n1); await A.remplirLigne({ qty: 5 }); await A.fermerLigne();
    ok((await A.total()) === 31000, "Modification 4 → 5 : total 31 000", await A.total());
    ok(!contient(await A.lire(), 20000), "L'ancien montant 20 000 a disparu de l'écran");
    // remplacement : la personne change le nom de la ligne
    const n3 = await choisir("c");
    await A.ouvrirLigne(n2); await A.remplirLigne({ nom: n3 }); await A.fermerLigne();
    let L = await A.lignes();
    ok(L.some((l) => l.nom === n3) && !L.some((l) => l.nom === n2), `Remplacement « ${n2} » → « ${n3} » : une seule ligne, au nouveau nom`, JSON.stringify(L.map((l) => l.nom)));
    ok((await A.total()) === 31000, "Remplacement : total inchangé (31 000)", await A.total());
    // doublon : on ajoute à la main un produit du même nom que n1
    await A.ouvrirSection(/Produits/);
    await A.toucher(p.locator("button.addrow:visible").filter({ hasText: /Ajouter un produit/ }).first(), "＋ Ajouter un produit"); await A.remplirLigne({ nom: n1 });
    const doublonVu = await p.locator("#doublon:visible").count() > 0; ok(doublonVu, "Doublon : la fiche avertit que le produit est déjà dans le devis", doublonVu ? await p.locator("#doublon").innerText() : "aucun avertissement");
    await A.remplirLigne({ qty: 1, unit: "auto", price: 1000 }); await A.fermerLigne();
    L = await A.lignes(); const nb = L.filter((l) => l.nom === n1).length;
    note("Doublon : même nom ajouté une 2e fois à la main", `${nb} ligne(s) « ${n1} » ; total ${await A.total()} ; lignes : ${L.map((l) => l.nom + " " + l.total).join(" | ")}`);
    ok(nb === 1 || doublonVu, "Doublon : pas deux lignes identiques sans avertissement", `${nb} lignes « ${n1} »`);
    // suppression
    await A.ouvrirLigne(n3); const rb = A.bouton(/Retirer du devis/); ok(await rb.count(), "Bouton « Retirer du devis » présent"); if (await rb.count()) await A.toucher(rb, "Retirer du devis");
    L = await A.lignes(); ok(!L.some((l) => l.nom === n3), `Suppression de « ${n3} »`, JSON.stringify(L.map((l) => l.nom)));
    const totApres = await A.total(); note("Total après suppression", totApres);
    // retour à l'étape 1 puis retour
    const avant = JSON.stringify(await A.lignes());
    await A.precedent(); ok(/Pour qui est le devis/.test(await A.lire()), "Retour à l'étape 1");
    await A.continuer(); ok(JSON.stringify(await A.lignes()) === avant && (await A.total()) === totApres, "Lignes et total conservés après retour à l'étape 1");
    // rechargement accidentel
    await p.reload(); await p.waitForTimeout(800);
    ok(JSON.stringify(await A.lignes()) === avant && (await A.total()) === totApres, "Lignes et total conservés après rechargement", JSON.stringify(await A.lignes()).slice(0, 200));
    // produit absent du catalogue
    if (await A.rechercher("zzproduitintrouvable")) { const t = await A.lire(); ok(/Aucun matériel trouvé/.test(t), "Recherche sans résultat : un message le dit et propose l'ajout à la main"); await A.rechercher(""); }
    else note("Pas de champ de recherche dans ce métier", "liste à plat");
    await A.ajouterLibre(/Ajouter un produit/, { nom: "Produit spécial XYZ 450", qty: 1, unit: "auto", price: 1500 });
    ok((await A.lignes()).some((l) => l.nom === "Produit spécial XYZ 450"), "Produit absent du catalogue : ajouté à la main");
    ok((await A.total()) === totApres + 1500, "Total + 1 500 après le produit ajouté à la main", await A.total());
    // quantité oubliée
    await A.ouvrirSection(/Produits/); const add = p.locator("button.addrow:visible").filter({ hasText: /Ajouter un produit/ }).first(); await A.toucher(add, "＋ Ajouter un produit");
    await A.remplirLigne({ nom: "Article sans quantité", price: 2000, unit: "auto" });
    const t2 = await A.lire(); ok(/Il manque : (la )?quantité/.test(t2), "Quantité oubliée : la fiche dit ce qui manque", t2.match(/Il manque[^.|]*/)?.[0]);
    ok((await A.total()) === totApres + 1500, "Ligne sans quantité : n'entre pas dans le total");
    // saisie invalide
    await A.remplirLigne({ qty: "abc" }); const t3 = await A.lire(); ok(/n'est pas un nombre|nombre|Écris/i.test(t3.match(/(?:^|\|)[^|]*(nombre|chiffre)[^|]*/)?.[0] || ""), "Saisie « abc » : message d'erreur à côté du champ", t3.match(/[^|]*(nombre|chiffre)[^|]*/)?.[0]);
    await A.remplirLigne({ qty: "0" }); note("Quantité 0", (await A.lire()).match(/Il manque[^|]*|n'est pas encore dans le devis[^|]*/)?.[0] || "aucun message");
    await A.fermerLigne(); await A.capture("fin");
  })),


  // ---------------------------------------------------------------- PARCOURS ENTREPRISE (5 étapes) par métier
  ...[["Peinture", "PEI", ["Ciment ordinaire", "sac"], ["Peintre", "jour"]], ["Carrelage", "CAR", ["Colle à carrelage", "sac"], ["Carreleur", "jour"]], ["Maçonnerie", "MAC", ["Ciment 42,5", "sac"], ["Maçon", "jour"]],
      ["Plomberie", "PLO", ["Tube PVC 100", "mètre"], ["Plombier", "jour"]], ["Électricité", "ELE", ["Câble 2,5 mm²", "mètre"], ["Électricien", "jour"]]]
   .map(([met, code, [prod, up], [ouv, uo]]) => () => scenario(code + "-E1", met, "Parcours entreprise complet (5 étapes) : TVA, délai, oublis, vérification, PDF et Word", async (A, p, ok, note) => {
    await A.demarrer(met, "entreprise");
    let t = await A.lire(); ok(/Étape 1 sur 5/.test(t), "Étape 1 sur 5 affichée");
    await A.taper(/^Nom du client$/, "SCI Les Palmiers"); await A.taper(/^Contact$/, "6 99 00 11 22").catch(() => note("Champ « Contact » absent"));
    await A.taper(/Adresse \/ quartier/, "Akwa, Douala").catch(() => note("Champ adresse absent"));
    for (const [re, v] of [[/surface déjà calculée/, 100], [/Hauteur de travail maximale/, 3]]) { if (await A.champ(re).count()) await A.taper(re, v); else note("Champ absent dans ce métier", re.source); }
    await A.capture("e1"); await A.continuer();
    t = await A.lire(); ok(/Étape 2 sur 5/.test(t), "Étape 2 sur 5"); await A.capture("e2"); await A.continuer();
    t = await A.lire(); ok(/Étape 3 sur 5/.test(t), "Étape 3 sur 5 : produits et main-d'œuvre");
    const ajoute = async (nom, unite, qte, prix) => { await A.taper(/^Nom \(ex/, nom); const ch = p.locator("button.chip:visible").filter({ hasText: new RegExp("^\\s*" + unite + "\\s*$") }).first(); if (await ch.count()) await A.toucher(ch, "unité " + unite); else await A.taper(/^Unité$/, unite);
      await A.taper(/^Quantité$/, qte); await A.taper(/^Prix (par unité|d'achat par unité)/, prix); await A.toucher(p.locator("button:visible").filter({ hasText: /^\s*Ajouter à/ }).first(), "Ajouter à …");
      const oui = A.bouton(/Oui, c'est bon/); if (await oui.count()) await A.toucher(oui, "Oui, c'est bon"); };
    await ajoute(prod, up, 12, 6500);
    await A.toucher(p.locator("button:visible").filter({ hasText: /^\s*(Ouvriers|Ouvrages|Main-d'œuvre)/ }).first(), "onglet Ouvriers");
    await ajoute(ouv, uo, 3, 15000);
    t = await A.lire(); ok(/123 000/.test(norm(t)), "Total partiel 78 000 + 45 000 = 123 000 visible", (norm(t).match(/[\d ]+FCFA/g) || []).slice(-3).join(" | "));
    // « À ne pas oublier » : la personne répond « Sans objet » à chaque point non examiné
    const sels = p.locator("select:visible").filter({ has: p.locator("option", { hasText: /^Sans objet$/ }) }); const ns = await sels.count();
    for (let i = 0; i < ns; i++) { const s0 = sels.nth(i); if ((await s0.inputValue()) === "" || /Non examiné/.test(await s0.locator("option:checked").innerText())) { await s0.scrollIntoViewIfNeeded(); await s0.selectOption({ label: "Sans objet" }); await p.waitForTimeout(150); } }
    note("Points « À ne pas oublier » renseignés", ns);
    await A.capture("e3"); await A.continuer();
    t = await A.lire(); ok(/Étape 4 sur 5/.test(t), "Étape 4 sur 5 : prix et conditions");
    await A.taper(/^TVA \(%\)/, "19,25"); await A.taper(/^Délai minimum/, 5); await A.taper(/^Délai maximum/, 10);
    await A.capture("e4"); await A.continuer();
    t = await A.lire(); ok(/Étape 5 sur 5/.test(t), "Étape 5 sur 5 : vérifier");
    const bloque = await p.locator(".chk .d-bloque").count(); const raisons = await p.locator(".chk:has(.d-bloque) b").allInnerTexts();
    ok(bloque === 0, "Aucun point bloquant après un parcours complet", raisons.join(" ; "));
    note("Points à vérifier restants", (await p.locator(".chk:has(.d-verifier) b").allInnerTexts()).join(" ; "));
    // valeurs attendues, calculées ici : HT 123 000 ; TVA 19,25 % = 23 677,5 ; TTC 146 677,5
    const ap = await A.apercu(); await A.capture("apercu");
    ok(contient(ap, 123000), "Aperçu : total HT 123 000"); const ttc = 146678; ok(contient(ap, 146678), "Aperçu : TTC 146 678 (TVA 23 677,5 arrondie au franc supérieur : règle unique)");
    ok(contient(ap, 23678), "Aperçu : TVA 23 678"); ok(new RegExp(prod.split(" ")[0]).test(ap) && new RegExp(ouv).test(ap), "Aperçu : produit et main-d'œuvre détaillés");
    ok(/5 à 10 jours|5 jours minimum à 10 jours/.test(ap), "Aperçu : délai 5 à 10 jours");
    const pdf = await A.exporter("pdf"); ok(pdf.ok, "PDF créé", pdf.raison);
    if (pdf.ok) { ok(contient(pdf.texte, 123000), "PDF : 123 000 HT"); ok(contient(pdf.texte, ttc || 146678), "PDF : TTC identique à l'aperçu"); ok(/SCI Les Palmiers/.test(pdf.texte), "PDF : client"); }
    const w = await A.exporter("word"); ok(w.ok, "Word créé", w.raison);
    if (w.ok) { ok(contient(w.texte, 123000), "Word : 123 000 HT"); ok(contient(w.texte, ttc || 146678), "Word : TTC identique à l'aperçu"); ok(!/…\s*jours/.test(w.texte), "Word : pas de « … jours »"); ok(new RegExp(ouv).test(w.texte), "Word : main-d'œuvre détaillée"); }
  })),


  // ---------------------------------------------------------------- CHIFFRAGE TECHNICIEN AVEC REMISE ET TVA, par métier
  ...[["Peinture", "PEI", "Peinture acrylique", "Sous-couche"], ["Carrelage", "CAR", "Carreaux", "Colle à carrelage"], ["Maçonnerie", "MAC", "@ciment", "@sable"], ["Plomberie", "PLO", "@PVC", "@coude"], ["Électricité", "ELE", "@câble", "@disjoncteur"]]
   .map(([met, code, a, b]) => () => scenario(code + "-K2", met, "Chiffrage avec remise 10 % et TVA 19,25 % : écran, aperçu, PDF, Word", async (A, p, ok, note) => {
    await A.demarrer(met); await A.client(); await A.continuer();
    const nom = async (x) => { if (!x.startsWith("@")) return x; await A.rechercher(x.slice(1)); const n = (await A.nomsVisibles())[0]; return n; };
    const n1 = await nom(a); await A.ajouter(n1, { qty: 5, unit: "auto", price: 12000 }); await A.rechercher("");
    const n2 = await nom(b); await A.ajouter(n2, { qty: "2,5", unit: "auto", price: 6000 }); await A.rechercher("");
    await A.ouvrirSection(/Main-d'œuvre|Ouvrages et main-d'œuvre/); await A.ajouterLibre(/Ajouter (la main-d'œuvre|un ouvrage ou de la main-d'œuvre)/, { nom: "Main-d'œuvre de pose", qty: 2, unit: "jour", price: 20000 });
    // calcul indépendant : 60 000 + 15 000 + 40 000 = 115 000 ; remise 10 % = 11 500 ; HT 103 500 ; TVA 19,25 % = 19 923,75 ; TTC 123 423,75
    ok((await A.total()) === 115000, "Total avant remise : 5 × 12 000 + 2,5 × 6 000 + 2 × 20 000 = 115 000", await A.total());
    await A.allerEtape3();
    await A.toucher(p.locator("details.reglages > summary").filter({ hasText: /Conditions, présentation/ }).first(), "Conditions, présentation et paiement");
    await A.taper(/^Remise en %/, 10); await A.taper(/^TVA \(%\)/, "19,25");
    const t = await A.lire(); const ap = await A.apercu(); await A.capture("apercu");
    ok(contient(ap, 103500), "Aperçu : HT après remise 103 500", (ap.match(/[\d ]{5,} FCFA/g) || []).slice(0, 8).join(" | "));
    ok(contient(ap, 11500), "Aperçu : remise 11 500 écrite");
    const ttc = 123424; ok(contient(ap, 123424), "Aperçu : TTC 123 424 (TVA 19 923,75 → 19 924)");
    ok(contient(t, ttc || 123424), "Écran : « Avec TVA » égal au TTC de l'aperçu");
    const pdf = await A.exporter("pdf"); ok(pdf.ok, "PDF créé", pdf.raison);
    if (pdf.ok) { for (const v of [103500, ttc || 123424]) ok(contient(pdf.texte, v), `PDF contient ${montant(v)}`); ok(contient(pdf.texte, 11500) && /Remise \(10 ?%\)/.test(pdf.texte), "PDF : « Remise (10 %) » et 11 500"); }
    const w = await A.exporter("word"); ok(w.ok, "Word créé", w.raison);
    if (w.ok) for (const v of [103500, 11500, ttc || 123424]) ok(contient(w.texte, v), `Word contient ${montant(v)}`);
    if (w.ok) ok(new RegExp(n1.split(" ")[0]).test(w.texte) && /Main-d'œuvre de pose/.test(w.texte), "Word : désignations présentes");
  })),

  // ---------------------------------------------------------------- GRANDS MONTANTS, DEVIS LONG, NOMS LONGS
  () => scenario("PEI-K3", "peinture", "Grands montants : 1 500 × 125 000 = 187 500 000, montant en lettres", async (A, p, ok, note) => {
    await A.demarrer("Peinture"); await A.client(); await A.continuer();
    await A.ajouter("Peinture extérieure", { qty: "1 500", unit: "auto", price: "125 000" });
    ok((await A.total()) === 187500000, "« 1 500 » × « 125 000 » (espaces) = 187 500 000", await A.total());
    await A.allerEtape3(); const ap = await A.apercu();
    ok(contient(ap, 187500000), "Aperçu : 187 500 000"); ok(/cent quatre-vingt-sept millions cinq cent mille/i.test(ap), "Aperçu : montant en lettres exact", (ap.match(/somme de[^(]*/) || [""])[0]);
    const pdf = await A.exporter("pdf"); ok(pdf.ok && contient(pdf.texte, 187500000), "PDF : 187 500 000");
    const w = await A.exporter("word"); ok(w.ok && contient(w.texte, 187500000) && /cent quatre-vingt-sept millions cinq cent mille/i.test(w.texte), "Word : montant et lettres");
    await A.capture("apercu");
  }),
  () => scenario("PEI-L1", "peinture", "Devis long : 30 lignes aux noms longs, saut de page, rien de perdu", async (A, p, ok, note) => {
    await A.demarrer("Peinture"); await A.client(); await A.continuer();
    let attendu = 0;
    for (let i = 1; i <= 30; i++) { const nom = `Article ${String(i).padStart(2, "0")} — peinture acrylique satinée lessivable teinte spéciale réf. ${1000 + i}`; await A.ouvrirSection(/Produits/);
      await A.ajouterLibre(/Ajouter un produit/, { nom, qty: i, unit: "auto", price: 1000 + i * 10 }); attendu += i * (1000 + i * 10); }
    ok((await A.total()) === attendu, `Total des 30 lignes = ${montant(attendu)} (calculé à part)`, await A.total());
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), "Pas de défilement horizontal à l'écran avec des noms longs");
    await A.allerEtape3(); const ap = await A.apercu(); ok(contient(ap, attendu), "Aperçu : total");
    const manquants = []; for (let i = 1; i <= 30; i++) if (!ap.includes(`Article ${String(i).padStart(2, "0")}`)) manquants.push(i); ok(!manquants.length, "Aperçu : les 30 lignes présentes", manquants.join(","));
    const pdf = await A.exporter("pdf"); ok(pdf.ok, "PDF créé");
    if (pdf.ok) { const pages = Number((require("child_process").execFileSync("pdfinfo", [pdf.f]).toString().match(/Pages:\s+(\d+)/) || [])[1]); note("Pages du PDF", pages); ok(pages >= 2, "Le PDF passe sur plusieurs pages", pages); ok(!/^\[OCR\]/.test(pdf.texte), "PDF lu comme texte (sans reconnaissance de caractères)"); ok(contient(pdf.texte, attendu), "PDF : total");
      const vus = []; for (let i = 1; i <= 30; i++) if (new RegExp(`Article ${String(i).padStart(2, "0")}`).test(pdf.texte)) vus.push(i); ok(vus.length === 30, "PDF : les 30 lignes présentes", `${vus.length}/30`); }
    const w = await A.exporter("word"); if (w.ok) { const m = []; for (let i = 1; i <= 30; i++) if (!w.texte.includes(`Article ${String(i).padStart(2, "0")}`)) m.push(i); ok(!m.length, "Word : les 30 lignes présentes", m.join(",")); ok(contient(w.texte, attendu), "Word : total"); }
  }),


  // ---------------------------------------------------------------- RÉSISTANCE
  () => scenario("PEI-R1", "peinture", "Double toucher sur « Créer le PDF », export répété : un seul fichier prêt, montants identiques", async (A, p, ok, note) => {
    await A.demarrer("Peinture"); await A.client(); await A.continuer(); await A.ajouter("Ciment ordinaire", { qty: 12, unit: "sac", price: 6500 }); await A.allerEtape3();
    const b = p.locator('[data-act="pdf"]').first(); await b.scrollIntoViewIfNeeded(); await b.tap(); await b.tap({ force: true }).catch(() => {}); await p.waitForSelector('[data-act="saveFile"]', { timeout: 60000 }); await p.waitForTimeout(1500);
    ok((await p.locator('[data-act="saveFile"]').count()) === 1, "Un seul bouton « Enregistrer » après deux touchers"); ok(!(await p.locator(".banner.bad").count()), "Aucun message d'erreur", (await p.locator(".banner.bad").allInnerTexts()).join(" | "));
    const e1 = await A.exporter("pdf"), e2 = await A.exporter("pdf"); ok(e1.ok && e2.ok, "Deux exports PDF successifs réussis");
    if (e1.ok && e2.ok) ok(contient(e1.texte, 78000) && contient(e2.texte, 78000), "Les deux PDF portent 78 000");
    const w1 = await A.exporter("word"), w2 = await A.exporter("word"); ok(w1.ok && w2.ok && w1.texte === w2.texte, "Deux Word identiques");
  }),
  () => scenario("PEI-R2", "peinture", "Client incomplet : pas de nom ni de téléphone", async (A, p, ok, note) => {
    await A.demarrer("Peinture"); await A.continuer(); await A.ajouter("Ciment ordinaire", { qty: 12, unit: "sac", price: 6500 }); await A.allerEtape3();
    const t = await A.lire(); const ap = await A.apercu();
    note("Ce que montre l'aperçu à la place du nom", (ap.match(/CLIENT\s*([^|]{0,40})/) || [])[1]);
    ok(/nom du client/i.test((await p.locator(".chk b").allInnerTexts()).join(" | ")), "« Vérifier » signale le nom du client manquant", (await p.locator(".chk b").allInnerTexts()).join(" | "));
    await A.capture("verifier");
  }),
  () => scenario("PEI-R3", "peinture", "Fermeture du navigateur puis retour : le devis est retrouvé et modifiable", async (A, p, ok, note) => {
    await A.demarrer("Peinture"); await A.client("Mme Ngo Bassa"); await A.continuer(); await A.ajouter("Ciment ordinaire", { qty: 12, unit: "sac", price: 6500 });
    await p.close(); const p2 = await A.ctx.newPage(); await p2.goto(process.env.URL || "http://localhost:8123/index.html"); await p2.waitForTimeout(800);
    const t = (await p2.locator("#app").innerText()); ok(/Ngo Bassa/.test(t), "La liste des devis montre le devis de Mme Ngo Bassa", t.slice(0, 200).replace(/\n/g, " | "));
    await p2.locator("#app").getByText(/Ngo Bassa/).first().tap(); await p2.waitForTimeout(500);
    for (let k = 0; k < 3 && !(await p2.locator(".total .big").count()); k++) { const c = p2.locator("button:visible").filter({ hasText: /^\s*Continuer/ }).first(); if (await c.count()) { await c.tap(); await p2.waitForTimeout(300); } }
    const tot = Number((await p2.locator(".total .big").first().innerText()).replace(/\D/g, "")); ok(tot === 78000, "Total retrouvé : 78 000", tot);
  }),
  () => scenario("PEI-R4", "peinture", "Hors connexion : l'application se rouvre sans réseau (après une première visite)", async (A, p, ok, note) => {
    await p.goto(process.env.URL || "http://localhost:8123/index.html"); await p.waitForTimeout(800);
    const sw = await p.evaluate(async () => { if (!navigator.serviceWorker) return "absent"; const r = await Promise.race([navigator.serviceWorker.ready.then(() => "prêt"), new Promise((res) => setTimeout(() => res("délai"), 8000))]); return r; });
    note("Service worker", sw); await p.waitForTimeout(1500);
    await A.ctx.setOffline(true); await p.reload().catch((e) => note("Rechargement", e.message.split("\n")[0])); await p.waitForTimeout(1200);
    const t = await p.locator("body").innerText().catch(() => ""); ok(/Quel est ton métier|Mes devis|TechGo Devis/.test(t), "L'application s'affiche hors connexion", t.slice(0, 120).replace(/\n/g, " | "));
    await A.ctx.setOffline(false);
  }),


  // ---------------------------------------------------------------- MÉTRÉ → DEVIS → DOCUMENTS (calcul indépendant)
  () => scenario("PEI-M1", "peinture", "Métré : 50 m², 2 couches, 10 m² par pot → 10 pots ; prix saisis → devis, PDF, Word", async (A, p, ok, note) => {
    await A.demarrer("Peinture"); await A.client(); await A.continuer();
    await A.toucher(A.bouton(/Ajouter une zone/), "Ajouter une zone");
    await A.toucher(p.locator("button:visible").filter({ hasText: /^\s*(＋\s*)?Surface déjà mesurée\s*$/ }).first(), "Surface déjà mesurée");
    await A.taper(/^Surface à peindre \(m²\)/, 50);
    await A.toucher(p.locator("button:visible").filter({ hasText: /＋\s*Peinture acrylique/ }).first(), "＋ Peinture acrylique");
    await A.taper(/^m² couverts/, 10); await A.taper(/^Couches$/, 2);
    const moSel = p.locator(".mzone select:visible").filter({ has: p.locator("option", { hasText: /tâche/i }) }).first(); ok(await moSel.count(), "Choix « Comment tu la factures » présent");
    note("Mode de main-d'œuvre proposé par défaut", await moSel.locator("option:checked").innerText().catch(() => "?"));
    if (await moSel.count()) { const o = (await moSel.locator("option").allInnerTexts()).find((x) => /tâche/i.test(x)); await moSel.selectOption({ label: o }); await p.waitForTimeout(300); }
    let t = await A.lire(); await A.capture("metre"); note("Textes « Il manque » / « à compléter »", t.split("\n").filter((x) => /Il manque|compléter|choisis|Choisis/.test(x)).join(" // "));
    ok(/50 m² × 2 couches = 100 m² à couvrir ÷ 10 m² par pot = 10/.test(t), "Le calcul est montré en clair : 50 m² × 2 couches = 100 m² ÷ 10 = 10", (t.match(/50 m²[^|]{0,90}/) || [])[0]);
    const L = await A.lignes(); note("Lignes après le métré", L.map((l) => `${l.nom} : ${l.detail}`).join(" | "));
    const lp = (await p.locator("button.rowc").filter({ hasText: /Peinture acrylique/ }).first().innerText()).replace(/\s+/g, " "); ok(/10 Pot/i.test(lp), "La ligne « Peinture acrylique » porte 10 pots", lp);
    await A.ouvrirLigne("Peinture acrylique"); await A.remplirLigne({ price: 12000 }); await A.fermerLigne();
    await A.ouvrirSection(/Main-d'œuvre/); const mo = p.locator("button.rowc").filter({ hasText: /Travaux de peinture/ }).first(); ok(await mo.count(), "Ligne de main-d'œuvre « Travaux de peinture » créée par le métré");
    if (await mo.count()) { await A.toucher(mo, "Travaux de peinture"); await A.remplirLigne({ price: 1500 }); await A.fermerLigne(); }
    ok((await A.total()) === 195000, "Total : 10 × 12 000 + 50 × 1 500 = 195 000 (calcul indépendant)", await A.total());
    await A.allerEtape3(); const ap = await A.apercu(); ok(contient(ap, 195000) && contient(ap, 120000) && contient(ap, 75000), "Aperçu : 120 000, 75 000, 195 000");
    ok(/50 m²/.test(ap), "Aperçu : le détail du métré (50 m²) est joint");
    const pdf = await A.exporter("pdf"); ok(pdf.ok && contient(pdf.texte, 195000), "PDF : 195 000");
    const w = await A.exporter("word"); ok(w.ok && contient(w.texte, 195000) && /Mesurée sur place : 50 m²/.test(w.texte), "Word : 195 000 et détail du métré (50 m²)"); ok(w.ok && !/Zone sans nom/.test(w.texte), "Word : pas de « Zone sans nom »");
  }),


  // ---------------------------------------------------------------- ARTISAN PRESSÉ : le chemin le plus court jusqu'au PDF
  ...[["Peinture", "PEI", "Peinture acrylique"], ["Carrelage", "CAR", "Carreaux"], ["Maçonnerie", "MAC", "@ciment"], ["Plomberie", "PLO", "@robinet"], ["Électricité", "ELE", "@prise"]]
   .map(([met, code, prod]) => () => scenario(code + "-P1", met, "Artisan pressé : 1 client, 1 produit, PDF — nombre de gestes", async (A, p, ok, note) => {
    const S0 = Date.now();
    await A.demarrer(met); await A.taper(/Nom du client/, "M. Ekane"); await A.continuer();
    let n = prod; if (prod.startsWith("@")) { await A.rechercher(prod.slice(1)); n = (await A.nomsVisibles())[0]; }
    await A.ajouter(n, { qty: 4, unit: "auto", price: 2500 }); await A.allerEtape3();
    const pdf = await A.exporter("pdf"); ok(pdf.ok && contient(pdf.texte, 10000), "PDF obtenu avec 4 × 2 500 = 10 000");
  })),


  // ---------------------------------------------------------------- ENVOI, VERSIONS, REPRISE D'UN DEVIS DEPUIS SON PDF
  () => scenario("PEI-V1", "peinture", "Figer V1, modifier ensuite (V2), V1 inchangée ; rouvrir le devis depuis son PDF sur un autre téléphone", async (A, p, ok, note) => {
    await A.demarrer("Peinture"); await A.client("M. Tchoua"); await A.continuer(); await A.ajouter("Ciment ordinaire", { qty: 12, unit: "sac", price: 6500 }); await A.allerEtape3();
    ok(!(await A.bouton(/Marquer « Prêt à envoyer »/).count()), "Technicien : pas d'étape « Marquer prêt » avant l'envoi");
    await A.toucher(A.bouton(/Envoyer au client \(version 1\)/), "Envoyer au client (version 1)");
    ok(/Version 1 envoyée/.test(await A.lire()), "Message « Version 1 envoyée »");
    const pdf1 = await A.exporter("pdf"); ok(pdf1.ok && contient(pdf1.texte, 78000), "PDF de V1 : 78 000");
    // modification après envoi : passer par le suivi du devis
    const suivi = p.locator("a.btn").filter({ hasText: /Suivi du devis/ }).first(); await A.toucher(suivi, "Suivi du devis");
    const prep = A.bouton(/Préparer V2/); ok(await prep.count(), "Bouton « Préparer V2 » trouvé dans le suivi", (await A.lire()).slice(0, 300));
    if (await prep.count()) { await A.toucher(prep, "Préparer V2");
      for (let k = 0; k < 4 && !(await p.locator("button.rowc").count()); k++) await A.precedent();
      if (!(await p.locator("button.rowc").count())) await p.goto(p.url().replace(/\/\d+$/, "/1")); await p.waitForTimeout(500);
      await A.ouvrirLigne("Ciment ordinaire"); await A.remplirLigne({ qty: 10 }); await A.fermerLigne();
      ok((await A.total()) === 65000, "V2 en préparation : 10 sacs → 65 000", await A.total());
      await A.allerEtape3(); const sel = A.champ(/Version affichée/); const opts = await sel.locator("option").allInnerTexts(); note("Versions proposées", opts.join(" | "));
      const v1 = opts.find((o) => /^V1/.test(o)); if (v1) { await sel.selectOption({ label: v1 }); await p.waitForTimeout(400); const ap = await A.apercu(); ok(contient(ap, 78000) && !contient(ap, 65000), "La V1 envoyée garde 78 000 (non modifiée)"); } else ok(false, "V1 sélectionnable dans « Version affichée »", opts.join(" | "));
    }
    // reprise : un autre téléphone (navigateur vierge) rouvre le PDF de V1
    if (pdf1.ok) { const ctx2 = await p.context().browser().newContext({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true }); const p2 = await ctx2.newPage();
      await p2.goto(process.env.URL || "http://localhost:8123/index.html"); await p2.waitForTimeout(500);
      await p2.getByRole("button", { name: /^\s*Peinture\s*$/ }).first().tap(); await p2.getByText(/Je suis technicien/).first().tap(); await p2.waitForTimeout(400);
      await p2.locator('input[type=file][data-on="importQuote"]').setInputFiles(pdf1.f); await p2.waitForTimeout(1500);
      const t2 = await p2.locator("#app").innerText(); const nomRepris = await p2.locator('input[data-p="current.client.name"]').inputValue().catch(() => ""); ok(/Tchoua/.test(nomRepris), "PDF rouvert sur un autre téléphone : le devis de M. Tchoua revient", t2.slice(0, 200).replace(/\n/g, " | "));
      ok(/78.000/.test(t2.replace(/[  ]/g, " ")), "Montant 78 000 retrouvé"); await ctx2.close(); }
  }),

  // ---------------------------------------------------------------- CHIFFRAGE DE BOUT EN BOUT
  () => scenario("PEI-K1", "peinture", "Chiffrage connu : écran = aperçu = PDF = Word, puis modification", async (A, p, ok, note) => {
    await A.demarrer("Peinture"); await A.client(); await A.continuer();
    await A.ajouter("Ciment ordinaire", { qty: 12, unit: "sac", price: 6500 });
    let l = (await A.lignes()).find((x) => x.nom === "Ciment ordinaire");
    ok(l && contient(l.total, 78000), "12 sacs × 6 500 = 78 000 sur la ligne", JSON.stringify(l));
    ok((await A.total()) === 78000, "Total du devis = 78 000", await A.total());
    await A.ajouter("Peinture acrylique", { qty: "2,5", unit: "pot", price: 1250 });
    l = (await A.lignes()).find((x) => x.nom === "Peinture acrylique");
    ok(l && contient(l.total, 3125), "2,5 × 1 250 = 3 125 (décimale avec virgule)", JSON.stringify(l));
    await A.ouvrirSection(/Main-d'œuvre/); await A.ajouter("Peintre", { qty: 3, unit: "jour", price: 15000 });
    ok((await A.total()) === 78000 + 3125 + 45000, "Total = 78 000 + 3 125 + 45 000 = 126 125", await A.total());
    // modification de la quantité : l'ancien montant ne doit rester nulle part
    await A.ouvrirLigne("Ciment ordinaire"); await A.remplirLigne({ qty: 10 }); await A.fermerLigne();
    const t = await A.lire();
    ok((await A.total()) === 65000 + 3125 + 45000, "Après 12 → 10 sacs : total 113 125", await A.total());
    ok(!contient(t, 78000), "L'ancien montant 78 000 n'apparaît plus à l'écran");
    await A.capture("etape2");
    await A.allerEtape3();
    const ap = await A.apercu(); await A.capture("apercu");
    for (const [n, v] of [["ligne ciment", 65000], ["ligne peinture", 3125], ["main-d'œuvre", 45000], ["total", 113125]]) ok(contient(ap, v), `Aperçu : ${n} ${montant(v)}`);
    ok(!contient(ap, 78000), "Aperçu : pas d'ancien montant 78 000");
    ok(/Mbarga/.test(ap), "Aperçu : nom du client");
    const pdf = await A.exporter("pdf"); ok(pdf.ok, "PDF créé et téléchargé", pdf.raison || pdf.nom);
    if (pdf.ok) { ok(!/^\[OCR\]/.test(pdf.texte), "PDF en vrai texte (lu sans reconnaissance de caractères)"); ok(require("fs").statSync(pdf.f).size < 150000, "PDF léger (< 150 Ko) pour WhatsApp", require("fs").statSync(pdf.f).size); }
    if (pdf.ok) { for (const v of [65000, 3125, 45000, 113125]) ok(contient(pdf.texte, v), `PDF contient ${montant(v)}`); ok(!contient(pdf.texte, 78000), "PDF : pas d'ancien montant"); ok(/Ciment ordinaire/.test(pdf.texte) && /Peinture acrylique/.test(pdf.texte) && /Peintre/.test(pdf.texte), "PDF : les 3 désignations (dont la main-d'œuvre)"); ok(/Mbarga/.test(pdf.texte), "PDF : client"); }
    const w = await A.exporter("word"); ok(w.ok, "Word créé et téléchargé", w.raison || w.nom);
    if (w.ok) { for (const v of [65000, 3125, 45000, 113125]) ok(contient(w.texte, v), `Word contient ${montant(v)}`); ok(/Ciment ordinaire/.test(w.texte) && /Peintre/.test(w.texte), "Word : désignations"); }
  }),
];
