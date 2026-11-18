// Fabrique, à partir d'une sauvegarde réelle exportée par l'application, des devis de N lignes (décimales, remises,
// TVA, noms longs, gros montants) et calcule les montants attendus SANS le moteur de l'application (calcul entier
// indépendant), pour comparer ensuite écran, aperçu, PDF et Word.
// Usage : node outils/gros-devis-gen.mjs base.json dossier_sortie
import fs from "node:fs";
import path from "node:path";
const { fingerprint } = await import("../engine.js"); // seulement pour la somme de contrôle du fichier de sauvegarde

const [, , BASE, OUT] = process.argv;
fs.mkdirSync(OUT, { recursive: true });

// Générateur pseudo-aléatoire reproductible
const alea = (graine) => () => { graine = (graine * 1103515245 + 12345) % 2147483648; return graine / 2147483648; };

// Calcul attendu, indépendant : tout en millièmes entiers (BigInt), arrondi au franc 0,5 → au-dessus.
const mil = (x) => BigInt(Math.round(x * 1000));
const arrondi = (n, d) => { const q = (2n * n + d) / (2n * d); return q; }; // n ≥ 0
const ligne = (qte, pu) => arrondi(mil(qte) * mil(pu), 1000000n);
const pct = (x, p) => arrondi(x * mil(p), 100000n);

const NOMS_LONGS = [
  "Peinture acrylique satinée lessivable pour murs intérieurs des chambres et du séjour, deux couches croisées",
  "Fourniture et pose de carreaux grès cérame rectifiés 60 × 60 avec colle flexible et joint époxy anti-taches",
  "Enduit de lissage pâteux prêt à l'emploi appliqué en deux passes avec ponçage soigné entre chaque passe",
];
// id : nom des fichiers ; met : métier du devis ; unités : celles du métier (achat pour les produits, facturation pour le travail)
const U = { peinture: ["pot", "seau", "kg", "litre", "sac"], carrelage: ["m²", "carton", "sac", "kg", "ml"], maconnerie: ["sac", "m³", "pièce", "camion", "barre"], plomberie: ["mètre", "pièce", "barre", "rouleau", "lot"], electricite: ["pièce", "mètre", "rouleau", "boîte", "lot"] };
const MO = { peinture: "m²", carrelage: "m²", maconnerie: "m³", plomberie: "ml", electricite: "point" };
const VARIANTES = [
  { id: "1", n: 1, met: "peinture", graine: 11, remise: { pct: 10, amount: null }, tva: 19.25, frais: 0, gros: false },
  { id: "30", n: 30, met: "peinture", graine: 23, remise: { pct: 7.5, amount: null }, tva: 19.25, frais: 0, gros: false },
  { id: "100", n: 100, met: "peinture", graine: 37, remise: { pct: null, amount: 12345 }, tva: 19.25, frais: 5, gros: false },
  { id: "200", n: 200, met: "peinture", graine: 41, remise: { pct: 3.75, amount: null }, tva: 19.25, frais: 0, gros: true },
  // les quatre autres métiers : leurs unités, remise en % ou en FCFA, avec ou sans TVA
  { id: "carrelage", n: 30, met: "carrelage", graine: 53, remise: { pct: 12.5, amount: null }, tva: 19.25, frais: 0, gros: false },
  { id: "maconnerie", n: 30, met: "maconnerie", graine: 59, remise: { pct: null, amount: 50000 }, tva: 19.25, frais: 0, gros: false },
  { id: "plomberie", n: 30, met: "plomberie", graine: 61, remise: { pct: 2.5, amount: null }, tva: null, frais: 0, gros: false },
  { id: "electricite", n: 30, met: "electricite", graine: 67, remise: { pct: null, amount: null }, tva: 19.25, frais: 3, gros: false },
];

const base = JSON.parse(fs.readFileSync(BASE, "utf8"));
for (const V of VARIANTES) {
  const r = alea(V.graine), sauv = structuredClone(base), db = sauv.data, q = db.quotes[0];
  const modele = db.catalogue.find((i) => i.id === q.current.manual[0].itemId);
  const lignes = [], articles = [];
  for (let i = 1; i <= V.n; i++) {
    const mo = i % 5 === 0;
    const dec = [0, 1, 2, 3][Math.floor(r() * 4)];
    const qte = Number((V.gros ? 1 + r() * 1500 : 0.1 + r() * 60).toFixed(dec));
    const pu = V.gros ? Number((5000 + r() * 2500000).toFixed(i % 3 === 0 ? 2 : 0)) : Number((100 + r() * 45000).toFixed(i % 4 === 0 ? 1 : 0));
    const nom = `Article ${String(i).padStart(3, "0")} — ${i % 7 === 0 ? NOMS_LONGS[i % 3] : mo ? "Main-d'œuvre de pose" : "Produit de chantier"}`;
    const id = `TER-9${String(i).padStart(3, "0")}`;
    articles.push({ ...modele, id, ref: id, label: nom, nom, cat: mo ? "main_oeuvre" : "materiaux", unit: mo ? (i % 10 === 0 ? MO[V.met] : "jour") : U[V.met][i % 5], price: pu, pack: V.met });
    lignes.push({ ...q.current.manual[0], id: "gd" + V.n + "x" + i, itemId: id, label: nom, nom, qty: qte, group: mo ? "Main-d'œuvre" : "Matériaux et produits" });
  }
  db.catalogue = [...db.catalogue.filter((i) => !i.id.startsWith("TER-9")), ...articles];
  q.current.manual = lignes;
  db.settings.metier = V.met; q.current.metier = V.met; q.current.discount = V.remise; q.current.terms.vatPct = V.tva; q.current.terms.sansTva = V.tva === null; q.current.overhead = { pct: V.frais, mode: V.frais ? "ligne" : "inclus" };
  q.current.client = { ...q.current.client, name: `Client essai ${V.id}` };
  sauv.checksum = fingerprint(sauv.data);
  fs.writeFileSync(path.join(OUT, `devis-${V.id}.json`), JSON.stringify(sauv));

  // attendu
  const tot = lignes.map((l, k) => ligne(l.qty, articles[k].price));
  const sub = tot.reduce((a, b) => a + b, 0n);
  const frais = V.frais ? pct(sub, V.frais) : 0n;
  const rem = V.remise.pct ? pct(sub + frais, V.remise.pct) : V.remise.amount ? BigInt(V.remise.amount) : 0n;
  const ht = sub + frais - rem, tva = V.tva === null ? null : pct(ht, V.tva), ttc = tva === null ? null : ht + tva;
  const att = { id: V.id, n: V.n, met: V.met, lignes: lignes.map((l, k) => ({ nom: l.nom, qte: l.qty, pu: articles[k].price, total: Number(tot[k]) })), sousTotal: Number(sub), frais: Number(frais), remise: Number(rem), ht: Number(ht), tva: tva === null ? null : Number(tva), ttc: ttc === null ? null : Number(ttc) };
  fs.writeFileSync(path.join(OUT, `attendu-${V.id}.json`), JSON.stringify(att, null, 1));
  console.log(`${V.id} (${V.met}, ${V.n} lignes) : HT ${att.ht.toLocaleString("fr-FR")} · TVA ${att.tva === null ? "sans" : att.tva.toLocaleString("fr-FR")} · TTC ${att.ttc === null ? "—" : att.ttc.toLocaleString("fr-FR")}`);
}
