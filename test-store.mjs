const _m = {};
globalThis.localStorage = { getItem: (k) => (k in _m ? _m[k] : null), setItem: (k, v) => { _m[k] = String(v); }, removeItem: (k) => { delete _m[k]; } };
const S = await import("./store.js");
const { referenceDraft } = await import("./packs.js");

let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + name + (ok ? "" : `  obtenu=${JSON.stringify(got)} attendu=${JSON.stringify(want)}`)); };
const throws = (name, f) => { let t = false; try { f(); } catch { t = true; } eq(name, t, true); };

S.init();
const db = () => S.state.db;
eq("catalogue pré-rempli", db().catalogue.length > 50, true);
eq("espace unique au départ", S.listWorkspaces().length, 1);

// ----- Devis de référence : cycle complet -----
const q = S.createQuote();
eq("référence auto DEV-AAAA-MM-001", /^DEV-\d{4}-\d{2}-001$/.test(q.ref), true);
eq("statut initial brouillon", q.status, "brouillon");
q.current = { ...referenceDraft(db().settings), ref: q.ref, date: S.today() };
const ev = S.evaluate(q);
eq("total de référence 15 614 500", ev.result.totals.base, 15614500);
throws("envoi impossible depuis un brouillon", () => S.freezeVersion(q));
throws("transition interdite brouillon → accepté", () => S.setStatus(q, "accepte"));
S.setStatus(q, "pret");
eq("statut prêt", q.status, "pret");
const v1 = S.freezeVersion(q);
eq("statut envoyé", q.status, "envoye");
eq("V1 figée avec empreinte", [v1.n, v1.hash.length], [1, 27]);
eq("intégrité V1", S.verifyVersion(v1).ok, true);
throws("V1 immuable (modification refusée)", () => { v1.quote.site.surface = 1; });
throws("V1 immuable (résultat)", () => { v1.result.totals.base = 1; });
eq("devis non modifiable une fois envoyé", S.editable(q), false);
{ // falsification détectée
  const t = JSON.parse(JSON.stringify(v1)); t.result.totals.base -= 1000;
  eq("falsification détectée", S.verifyVersion(t).ok, false);
  const t2 = JSON.parse(JSON.stringify(v1)); t2.quote.site.surface = 4000;
  eq("changement de données détecté", S.verifyVersion(t2).ok, false);
}
{ // un changement de prix au catalogue ne touche pas V1
  const it = JSON.parse(JSON.stringify(db().catalogue.find((i) => i.id === "END-FIXACOAT"))); it.price = 30000; S.saveItem(it);
  eq("V1 inchangée après hausse de prix", [S.verifyVersion(q.versions[0]).ok, q.versions[0].result.totals.base], [true, 15614500]);
  eq("nouveau calcul avec le nouveau prix", S.evaluate(q).result.totals.base > 15614500, true);
  eq("historique des prix enregistré", db().priceHistory.some((h) => h.itemId === "END-FIXACOAT" && h.old === 22000 && h.new === 30000), true);
  const back = JSON.parse(JSON.stringify(it)); back.price = 22000; S.saveItem(back);
}

// ----- Négociation : V2 distincte -----
S.startNegotiation(q);
eq("négociation : statut", q.status, "negociation");
eq("négociation : brouillon éditable", S.editable(q), true);
q.current.discount = { pct: 10, amount: null };
S.freezeVersion(q);
eq("V2 créée, V1 intacte", [q.versions.length, q.versions[0].result.totals.base, q.versions[1].result.totals.base], [2, 15614500, 14053050]);
eq("V1 et V2 ont des empreintes distinctes", q.versions[0].hash !== q.versions[1].hash, true);
eq("V1 toujours valide", S.verifyVersion(q.versions[0]).ok, true);

// ----- Expiration -----
{
  const old = JSON.parse(JSON.stringify(q.versions[1])); old.at = "2020-01-01T00:00:00.000Z";
  const keep = q.versions[1]; q.versions[1] = S.deepFreeze(old);
  eq("validité dépassée → expiré", S.effectiveStatus(q), "expire");
  q.versions[1] = keep;
  eq("validité respectée → envoyé", S.effectiveStatus(q), "envoye");
}

// ----- Acceptation, commande, factures -----
const order = S.accept(q, { by: "M. Client", date: S.today(), note: "Bon pour accord signé", option: true });
eq("statut accepté", q.status, "accepte");
eq("preuve d'accord conservée", [q.acceptance.by, q.acceptance.version, q.acceptance.option], ["M. Client", 2, true]);
eq("commande : tranches = total net option V2", order.tranches.reduce((a, t) => a + t.amountHT, 0), q.versions[1].result.totals.withOption);
eq("commande : 3 tranches", order.tranches.length, 3);
const inv = S.invoiceTranche(order.id, 0);
eq("facture numérotée", /^FAC-\d{4}-0001$/.test(inv.no), true);
throws("double facturation refusée", () => S.invoiceTranche(order.id, 0));
S.markPaid(order.id, 0);
eq("paiement enregistré", order.tranches[0].status, "paye");
[1, 2].forEach((i) => { S.invoiceTranche(order.id, i); S.markPaid(order.id, i); });
eq("commande soldée", order.status, "solde");
throws("devis accepté : plus de transition", () => S.setStatus(q, "refuse"));

// ----- Refus puis réouverture -----
const q2 = S.createQuote();
q2.current = { ...referenceDraft(db().settings), ref: q2.ref, date: S.today() };
S.setStatus(q2, "pret"); S.freezeVersion(q2); S.reject(q2, "Prix trop élevé");
eq("refusé : motif conservé", q2.statusLog[q2.statusLog.length - 1].reason, "Prix trop élevé");
S.startNegotiation(q2);
eq("devis refusé rouvert en négociation", q2.status, "negociation");
S.discardNegotiationDraft(q2);

// ----- Un devis bloqué ne peut pas être prêt -----
const q3 = S.createQuote();
throws("devis vide ne peut pas être marqué prêt", () => S.setStatus(q3, "pret"));
S.cancel(q3, "Test");
eq("annulation tracée, historique conservé", [q3.status, S.getQuote(q3.id) !== undefined], ["annule", true]);

// ----- Journal d'audit -----
eq("journal d'audit alimenté", db().audit.length > 10, true);
eq("journal contient l'envoi de V1", db().audit.some((a) => a.action === "devis_envoye" && a.detail.includes("V1")), true);

// ----- Clients -----
S.saveClient({ id: "", name: "Syndic Bonamoussadi", type: "Syndic / gestionnaire", contact: "" });
const cid = db().clients[0].id;
const q4 = S.createQuote(cid);
eq("devis lié au client", [q4.current.client.id, q4.current.client.name], [cid, "Syndic Bonamoussadi"]);
eq("historique client", S.quotesOfClient(cid).length, 1);

// ----- Sauvegarde / restauration -----
const bak = S.exportBackup();
const vb = S.verifyBackup(bak);
eq("sauvegarde vérifiée", vb.ok, true);
eq("résumé de sauvegarde", vb.summary.devis, db().quotes.length);
{
  const p = JSON.parse(bak); p.data.quotes[0].current.site.name = "Falsifié";
  eq("sauvegarde modifiée refusée", S.verifyBackup(JSON.stringify(p)).ok, false);
  eq("JSON invalide refusé", S.verifyBackup("n'importe quoi").ok, false);
  eq("mauvais fichier refusé", S.verifyBackup(JSON.stringify({ a: 1 })).ok, false);
  const p2 = JSON.parse(bak); p2.data.quotes.find((x) => x.versions.length).versions[0].result.totals.base = 1; p2.checksum = (await import("./engine.js")).fingerprint(p2.data);
  eq("version falsifiée avec somme recalculée : refusée par l'intégrité des versions", S.verifyBackup(JSON.stringify(p2)).ok, false);
}
const nQuotes = db().quotes.length;
S.restoreBackup(vb.parsed, "Copie restaurée");
eq("restauration : mêmes devis", db().quotes.length, nQuotes);
eq("restauration : versions valides", db().quotes.every((x) => x.versions.every((v) => S.verifyVersion(v).ok)), true);
eq("restauration : deux espaces", S.listWorkspaces().length, 2);

// ----- Isolation entre entreprises -----
S.createWorkspace("Entreprise B");
eq("autre entreprise : aucun devis", db().quotes.length, 0);
eq("autre entreprise : aucun client", db().clients.length, 0);
eq("autre entreprise : catalogue de départ", db().catalogue.length > 50, true);
const wsB = S.state.ws;
S.switchWorkspace(S.listWorkspaces()[0].id);
eq("retour : les devis de la première entreprise sont là", db().quotes.length > 0, true);
S.deleteWorkspace(wsB);
eq("suppression d'un espace", S.listWorkspaces().length, 2);

// ----- Conflit entre deux onglets -----
{
  const key = "tgd-ws-" + S.state.ws; // simulation : un autre onglet a écrit entre-temps
  const stored = JSON.parse(localStorage.getItem(key)); stored.rev += 10; stored.company.name = "ÉCRIT AILLEURS";
  localStorage.setItem(key, JSON.stringify(stored));
  db().company.phone = "000";
  eq("conflit détecté : écriture refusée", S.commit(), false);
  eq("conflit signalé", S.state.conflict, true);
  eq("rien n'a été écrasé en silence", JSON.parse(localStorage.getItem(key)).company.name, "ÉCRIT AILLEURS");
  S.reloadAfterConflict();
  eq("rechargement : on repart de la version la plus récente", [S.state.conflict, db().company.name], [false, "ÉCRIT AILLEURS"]);
  eq("persistance dans localStorage", JSON.parse(localStorage.getItem(key)).quotes.length > 0, true);
}
console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail ? 1 : 0);
