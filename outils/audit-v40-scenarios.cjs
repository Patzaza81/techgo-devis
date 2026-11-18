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
    ok(contient(ap, 123000), "Aperçu : total HT 123 000"); const ttc = [146677, 146678].find((v) => contient(ap, v)); ok(ttc, "Aperçu : TTC 146 677,5 arrondi (146 677 ou 146 678)", ttc);
    ok(contient(ap, 23677) || contient(ap, 23678), "Aperçu : TVA 23 677,5 arrondie"); ok(new RegExp(prod.split(" ")[0]).test(ap) && new RegExp(ouv).test(ap), "Aperçu : produit et main-d'œuvre détaillés");
    ok(/5 à 10 jours|5 jours minimum à 10 jours/.test(ap), "Aperçu : délai 5 à 10 jours");
    const pdf = await A.exporter("pdf"); ok(pdf.ok, "PDF créé", pdf.raison);
    if (pdf.ok) { ok(contient(pdf.texte, 123000), "PDF : 123 000 HT"); ok(contient(pdf.texte, ttc || 146678), "PDF : TTC identique à l'aperçu"); ok(/SCI Les Palmiers/.test(pdf.texte), "PDF : client"); }
    const w = await A.exporter("word"); ok(w.ok, "Word créé", w.raison);
    if (w.ok) { ok(contient(w.texte, 123000), "Word : 123 000 HT"); ok(contient(w.texte, ttc || 146678), "Word : TTC identique à l'aperçu"); ok(!/…\s*jours/.test(w.texte), "Word : pas de « … jours »"); ok(new RegExp(ouv).test(w.texte), "Word : main-d'œuvre détaillée"); }
  })),

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
    if (pdf.ok) { for (const v of [65000, 3125, 45000, 113125]) ok(contient(pdf.texte, v), `PDF contient ${montant(v)}`); ok(!contient(pdf.texte, 78000), "PDF : pas d'ancien montant"); ok(/Ciment ordinaire/.test(pdf.texte) && /Peinture acrylique/.test(pdf.texte) && /Peintre/.test(pdf.texte), "PDF : les 3 désignations (dont la main-d'œuvre)"); ok(/Mbarga/.test(pdf.texte), "PDF : client"); }
    const w = await A.exporter("word"); ok(w.ok, "Word créé et téléchargé", w.raison || w.nom);
    if (w.ok) { for (const v of [65000, 3125, 45000, 113125]) ok(contient(w.texte, v), `Word contient ${montant(v)}`); ok(/Ciment ordinaire/.test(w.texte) && /Peintre/.test(w.texte), "Word : désignations"); }
  }),
];
