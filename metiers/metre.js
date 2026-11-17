// MÉTRÉ — du chantier décrit (zones, ouvrages, dimensions) aux quantités du devis.
//
// RÈGLES DE CE FICHIER
// 1. Aucun prix, aucun rendement, aucun dosage, aucune consommation, aucune norme n'est écrit ici.
//    Tout ce qui dépend du produit ou de l'équipe (couverture d'un pot, kg de colle par m², dosage
//    du béton, m² posés par jour…) est SAISI par l'entreprise, puis gardé pour ses prochains devis.
// 2. Ce fichier ne contient que de la géométrie et de l'arithmétique : surfaces, volumes, comptages,
//    divisions et arrondis. Chaque résultat porte sa formule écrite en clair avec les nombres utilisés.
// 3. Ce qui relève d'une étude (section des câbles, calibre des protections, ferraillage, formulation
//    du béton, diamètre des tuyaux) n'est JAMAIS calculé : l'application le dit et laisse la saisie.
// 4. Un besoin dont il manque une donnée n'entre pas dans le devis : il est signalé avec ce qui manque.
//
// 5. EXACT ou ESTIMATION. Ce qui se compte ou se découpe (blocs, cartons, pots, barres, appareils) est
//    exact pour les dimensions et les pertes saisies. Ce qui dépend du geste et du support (mortier,
//    enduit, ciment, sable, gravier, colliers, durée du travail) est marqué « estimation » partout :
//    dans l'ouvrage, dans la ligne du devis et dans le contrôle avant envoi.
// 6. Une valeur reprise d'un ouvrage précédent n'entre jamais dans un devis sans avoir été confirmée.
//
// ARRONDIS (les mêmes partout, écrits dans chaque explication)
//   « sup »  : ce qui s'achète entier (pot, carton, sac, barre, rouleau, pièce) → entier au-dessus,
//              calculé sur le TOTAL du devis et non zone par zone (on n'achète pas un sac entamé par pièce).
//   « demi » : journées de travail → demi-journée au-dessus, sur le total de la prestation.
//   « dec »  : ce qui se mesure (m², ml, m³) → 2 décimales.

const N = (x) => typeof x === "number" && isFinite(x);
const pos = (x) => N(x) && x > 0;
const net = (x) => Math.round(x * 1e9) / 1e9;
export const arrSup = (x) => Math.ceil(net(x));
export const arrDemi = (x) => Math.ceil(net(x * 2)) / 2;
export const arrDec = (x) => Math.round(net(x) * 100) / 100;
export const fr = (n, d = 2) => {
  if (!N(n)) return "?";
  const [e, f = ""] = String(Number(n.toFixed(d))).split(".");
  return e.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (f ? "," + f : "");
};
const plat = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const txt = (s, def) => String(s || "").trim() || def;

// ---------- Briques de calcul ----------
// Nombre entier ≥ 1. Vide = valeur par défaut « def » (1 élément). 0, négatif ou décimal = refusé.
function entier(x, quoi, manque, def = 1) {
  if (x === null || x === undefined || x === "") return def;
  if (!N(x) || x < 1 || !Number.isInteger(x)) { manque.push(`${quoi} (nombre entier, 1 ou plus)`); return null; }
  return x;
}
// Ouvertures à déduire : [{ n, l, h }] en mètres. n vide = 1 ; n = 0 = ligne ignorée.
function ouvertures(liste, { hMax, lMax } = {}) {
  const ok = [], manque = [], alertes = [];
  for (const o of liste || []) {
    const vide = (x) => x === null || x === undefined || x === "";
    if (vide(o.l) && vide(o.h) && vide(o.n)) continue; // ligne vide
    if (o.n === 0) continue;                             // « 0 porte » : rien à déduire
    const n = entier(o.n, "le nombre d'ouvertures", manque);
    if (!pos(o.l) || !pos(o.h)) { manque.push("la largeur et la hauteur de chaque ouverture"); continue; }
    if (n === null) continue;
    if (pos(hMax) && o.h > hMax) alertes.push(`Une ouverture (${fr(o.h)} m) est plus haute que la paroi (${fr(hMax)} m) : vérifie les dimensions.`);
    if (pos(lMax) && o.l > lMax) alertes.push(`Une ouverture (${fr(o.l)} m) est plus large que la paroi (${fr(lMax)} m) : vérifie les dimensions.`);
    ok.push({ n, l: o.l, h: o.h });
  }
  const S = ok.reduce((s, o) => s + o.n * o.l * o.h, 0);
  const detail = ok.map((o) => `${o.n > 1 ? fr(o.n) + " × " : ""}${fr(o.l)} × ${fr(o.h)}`).join(" + ");
  return { S, detail, manque: [...new Set(manque)], alertes };
}
// Pertes : vide = 0 %. Renvoie le coefficient et le texte de la formule.
function pertes(p, manque) {
  if (p === null || p === undefined || p === "") return { k: 1, t: "" };
  if (!N(p) || p < 0 || p > 100) { manque.push("un pourcentage de pertes entre 0 et 100"); return { k: 1, t: "" }; }
  return { k: 1 + p / 100, t: p > 0 ? ` + ${fr(p)} % de pertes` : "" };
}
const besoin = (tab, nom, unite, arr, brut, detail, manque = [], plus = {}) => ({ tab, nom, unite, arr, brut: manque.length ? null : brut, detail, manque, ...plus });
const EST = {
  melange: "Estimation : la quantité réelle dépend de ton dosage sur place, du gâchage perdu et du support.",
  colliers: "Estimation pour un tracé d'un seul tenant : chaque changement de direction peut demander un collier de plus.",
  duree: "Estimation : la durée réelle dépend du chantier (accès, hauteur, préparation, météo).",
  conso: "Estimation : la consommation réelle dépend du support et de l'outil utilisé.",
};

// Produit vendu avec une couverture par unité (pot, seau) : S × couches × pertes ÷ couverture.
function parCouverture(nom, unite, S, couches, couv, p) {
  const m = []; const pe = pertes(p, m);
  if (!pos(couv)) m.push(`la surface couverte par ${plat(unite) || "unité"} de « ${nom} »`);
  const c = entier(couches, `le nombre de couches de « ${nom} »`, m);
  const brut = m.length ? null : (S * c * pe.k) / couv;
  return besoin("produits", nom, unite, "sup", brut, m.length ? "" : `${fr(S)} m²${c > 1 ? ` × ${c} couches` : ""}${pe.t} = ${fr(S * c * pe.k)} m² à couvrir ÷ ${fr(couv)} m² par ${plat(unite)} = ${fr(brut)}`, m, { est: EST.conso });
}
// Produit vendu au poids avec une consommation au m² (colle, joint) : S × kg/m² ÷ poids du sac.
function parConso(nom, S, conso, sacKg, quoi) {
  const m = [];
  if (!pos(conso)) m.push(`la consommation de ${quoi} (kg par m²)`);
  if (!pos(sacKg)) m.push(`le poids d'un sac de ${quoi} (kg)`);
  const brut = m.length ? null : (S * conso) / sacKg;
  return besoin("produits", nom, "Sac", "sup", brut, m.length ? "" : `${fr(S)} m² × ${fr(conso)} kg par m² = ${fr(S * conso)} kg ÷ ${fr(sacKg)} kg par sac = ${fr(brut)}`, m, { est: EST.conso });
}
// Liants et granulats d'un volume de béton ou de mortier. Les dosages sont ceux de l'entreprise.
function melange(V, v, { quoi, gravier }) {
  const out = [], vt = `${fr(V, 3)} m³ de ${quoi}`, plus = { est: EST.melange };
  { const m = []; if (!pos(v.ciment)) m.push(`le ciment par m³ de ${quoi} (kg)`); if (!pos(v.sac)) m.push("le poids d'un sac de ciment (kg)");
    const brut = m.length ? null : (V * v.ciment) / v.sac;
    out.push(besoin("produits", "Ciment", "Sac", "sup", brut, m.length ? "" : `${vt} × ${fr(v.ciment)} kg par m³ = ${fr(V * v.ciment)} kg ÷ ${fr(v.sac)} kg par sac = ${fr(brut)}`, m, plus)); }
  { const m = []; if (!pos(v.sable)) m.push(`le sable par m³ de ${quoi} (m³)`);
    out.push(besoin("produits", "Sable", "m³", "dec", m.length ? null : V * v.sable, m.length ? "" : `${vt} × ${fr(v.sable, 3)} m³ de sable par m³ = ${fr(V * v.sable, 3)}`, m, plus)); }
  if (gravier === "requis" || (gravier === "option" && pos(v.gravier))) {
    const m = []; if (!pos(v.gravier)) m.push(`le gravier par m³ de ${quoi} (m³)`);
    out.push(besoin("produits", "Gravier", "m³", "dec", m.length ? null : V * v.gravier, m.length ? "" : `${vt} × ${fr(v.gravier, 3)} m³ de gravier par m³ = ${fr(V * v.gravier, 3)}`, m, plus));
  }
  return out;
}
// MAIN-D'ŒUVRE D'UN OUVRAGE — trois façons de facturer, une seule par ouvrage :
//   « tache »   : payé à la quantité faite (m², ml, m³, point). Quantité de la ligne = quantité de l'ouvrage.
//   « ouvrier » : payé par ouvrier et par jour. Quantité = jours de chantier × nombre d'ouvriers. Prix = 1 ouvrier, 1 jour.
//   « equipe »  : payé par jour pour toute l'équipe. Quantité = jours de chantier. Prix = toute l'équipe, 1 jour.
// Dans les deux derniers cas, le rendement saisi est toujours celui de TOUTE l'équipe en une journée, et
// jours de chantier = quantité ÷ rendement (demi-journée au-dessus, sur le total de la prestation dans le devis).
// (« jour » est l'ancien nom de « ouvrier » dans les devis faits avec la v32.)
export const modeMO = (m) => (m === "jour" ? "ouvrier" : m || "");
function mainOeuvre(v, Q, unite, defNom) {
  const mode = modeMO(v.moMode); if (!mode) return [];
  const nom = txt(v.moNom, defNom);
  if (mode === "tache") return [besoin("ouvriers", nom, unite, "dec", Q, `Payé à la tâche : ${fr(Q)} ${unite}. Le prix à saisir est celui de 1 ${unite}.`)];
  const m = [];
  if (!pos(v.moRend)) m.push(`ce que toute l'équipe fait en une journée (${unite})`);
  const n = mode === "ouvrier" ? (v.moOuv === null || v.moOuv === undefined || v.moOuv === "" ? (m.push("le nombre d'ouvriers de l'équipe"), null) : entier(v.moOuv, "le nombre d'ouvriers de l'équipe", m)) : entier(v.moOuv, "le nombre d'ouvriers de l'équipe", m, 0);
  const duree = m.length ? null : Q / v.moRend, d = m.length ? "" : `${fr(Q)} ${unite} ÷ ${fr(v.moRend)} ${unite} par jour pour l'équipe = ${fr(duree)} jour${duree >= 2 ? "s" : ""} de chantier`;
  if (mode === "equipe") return [besoin("ouvriers", `${nom} — équipe${n ? ` de ${n}` : ""}`, "journée d'équipe", "demi", duree, d, m, { duree, est: EST.duree, prixPour: "Le prix à saisir est celui de TOUTE l'équipe pour une journée." })];
  return [besoin("ouvriers", n ? `${nom} — ${n} ouvrier${n > 1 ? "s" : ""}` : nom, "journée d'ouvrier", "demi", duree, d, m, { duree, mult: n, est: EST.duree, prixPour: "Le prix à saisir est celui d'UN ouvrier pour UNE journée." })];
}
const articles = (liste, tab = "produits") => (liste || []).filter((a) => String(a.nom || "").trim() || pos(a.n)).map((a) => {
  const m = []; if (!String(a.nom || "").trim()) m.push("le nom d'un article"); const n = a.n === null || a.n === undefined || a.n === "" ? (m.push(`la quantité de « ${txt(a.nom, "article")} »`), null) : entier(a.n, `la quantité de « ${txt(a.nom, "article")} »`, m);
  return besoin(tab, txt(a.nom, "Article"), txt(a.u, "Pièce"), "sup", n, m.length ? "" : `Compté sur place : ${fr(n)}`, m);
});
const totalArticles = (liste) => (liste || []).reduce((s, a) => s + (pos(a.n) && Number.isInteger(a.n) ? a.n : 0), 0);

// ---------- Champs communs ----------
// g : titre de la rubrique qui commence à ce champ. memo : valeur de pratique gardée pour le prochain ouvrage (à confirmer).
const G = (titre, champs, pourquoi) => champs.map((c, i) => (i ? c : { ...c, g: titre, gp: pourquoi }));
const MO = (unite, defNom) => G("Main-d'œuvre", [
  { k: "moMode", t: "choix", l: "Comment tu la factures", opt: [["", "Pas de main-d'œuvre ici"], ["tache", `À la tâche, par ${unite}`], ["ouvrier", "Par jour et par ouvrier"], ["equipe", "Par jour, toute l'équipe"]], memo: true,
    aide: `Le plus simple : « À la tâche » (tu donnes seulement le prix pour 1 ${unite}). Par ouvrier : le prix d'UN ouvrier pour une journée. Toute l'équipe : le prix de l'équipe entière pour une journée.` },
  { k: "moNom", t: "txt", l: "Nom de la prestation", ph: defNom, si: (v) => !!modeMO(v.moMode) },
  { k: "moRend", t: "n", l: `Ce que TOUTE l'équipe fait en une journée (${unite})`, memo: true, si: (v) => /^(ouvrier|equipe)$/.test(modeMO(v.moMode)), aide: "Ton rendement à toi, pour l'équipe entière. L'application n'en propose pas. Tu ne le connais pas ? Choisis plutôt « À la tâche » plus haut." },
  { k: "moOuv", t: "n", l: "Nombre d'ouvriers dans l'équipe", memo: true, si: (v) => /^(ouvrier|equipe)$/.test(modeMO(v.moMode)), aide: "Compte tout le monde : toi, les ouvriers et les aides." },
], "Une seule façon de facturer par ouvrage : la main-d'œuvre n'est jamais comptée deux fois.");
const OUV = { k: "ouv", t: "ouv", l: "Portes et fenêtres à déduire" };
const PERTE = (l = "Pertes et coupes (%)") => ({ k: "perte", t: "n", l, memo: true, aide: "Laisse vide si tu n'en comptes pas." });
const DOSAGE = (quoi, gravier, si) => [
  { k: "ciment", t: "n", l: `Ciment par m³ de ${quoi} (kg)`, memo: true, si, aide: "Ton dosage, ou celui du plan. L'application n'en propose pas." },
  { k: "sac", t: "n", l: "Poids d'un sac de ciment (kg)", memo: true, si },
  { k: "sable", t: "n", l: `Sable par m³ de ${quoi} (m³)`, memo: true, si },
  ...(gravier ? [{ k: "gravier", t: "n", l: `Gravier par m³ de ${quoi} (m³)${gravier === "option" ? " — vide si sans gravier" : ""}`, memo: true, si }] : []),
];

// Surface d'une paroi rectangulaire moins ses ouvertures.
function paroi(v, { lk = "longueur", hk = "hauteur", ln = "la longueur", hn = "la hauteur" } = {}) {
  const manque = [], alertes = [];
  if (!pos(v[lk])) manque.push(ln); if (!pos(v[hk])) manque.push(hn);
  const nb = entier(v.nombre, "le nombre de surfaces", manque), faces = entier(v.faces, "le nombre de faces", manque);
  if (faces !== null && faces > 2) manque.push("1 ou 2 faces");
  const o = ouvertures(v.ouv, { hMax: v[hk], lMax: v[lk] }); manque.push(...o.manque); alertes.push(...o.alertes);
  if (manque.length) return { manque, alertes };
  const brute = v[lk] * v[hk] * nb * faces, S = brute - o.S * faces * nb;
  if (S <= 0) { alertes.push("Les ouvertures sont aussi grandes que la surface : vérifie les dimensions."); return { manque: ["une surface positive (ouvertures trop grandes)"], alertes }; }
  const detail = `${nb > 1 ? fr(nb) + " × " : ""}${fr(v[lk])} × ${fr(v[hk])}${faces > 1 ? ` × ${fr(faces)} faces` : ""} = ${fr(brute)} m²${o.S ? ` − ${fr(o.S * faces * nb)} m² d'ouvertures (${nb * faces > 1 ? `${fr(nb * faces)} × (${o.detail})` : o.detail}) = ${fr(S)} m²` : ""}`;
  return { S, detail, manque, alertes, o };
}

// ---------- Types d'ouvrage ----------
// liens : valeurs attachées à un PRODUIT nommé (format d'un carreau, dimensions d'un bloc, longueur d'une barre).
// Elles ne sont reprises que si le même nom de produit est saisi de nouveau.
export const TYPES = [
  // ===== PEINTURE =====
  { id: "p_piece", metier: "peinture", nom: "Pièce : murs et plafond",
    champs: [
      ...G("Dimensions de la pièce", [{ k: "longueur", t: "n", l: "Longueur (m)" }, { k: "largeur", t: "n", l: "Largeur (m)" }, { k: "hauteur", t: "n", l: "Hauteur des murs (m)" }, OUV, { k: "plafond", t: "bool", l: "Peindre aussi le plafond avec les mêmes produits" }]),
      ...G("Produits", [{ k: "prod", t: "prod", l: "Produits à appliquer" }, PERTE("Pertes de produit (%)")], "La surface couverte par pot est écrite sur le pot, pour une couche."), ...MO("m²", "Travaux de peinture"),
    ],
    calc(v) {
      const manque = [], alertes = [], mesures = [];
      if (!pos(v.longueur)) manque.push("la longueur"); if (!pos(v.largeur)) manque.push("la largeur"); if (!pos(v.hauteur)) manque.push("la hauteur");
      const o = ouvertures(v.ouv, { hMax: v.hauteur, lMax: Math.max(v.longueur || 0, v.largeur || 0) }); manque.push(...o.manque); alertes.push(...o.alertes);
      if (manque.length) return { manque, alertes, mesures, besoins: [] };
      const per = 2 * (v.longueur + v.largeur), brute = per * v.hauteur, murs = brute - o.S;
      if (murs <= 0) return { manque: ["une surface positive (ouvertures trop grandes)"], alertes: ["Les ouvertures sont aussi grandes que les murs : vérifie les dimensions."], mesures, besoins: [] };
      mesures.push({ nom: "Murs", val: murs, unite: "m²", detail: `2 × (${fr(v.longueur)} + ${fr(v.largeur)}) × ${fr(v.hauteur)} = ${fr(brute)} m²${o.S ? ` − ${fr(o.S)} m² d'ouvertures (${o.detail}) = ${fr(murs)} m²` : ""}` });
      let S = murs;
      if (v.plafond) { const pl = v.longueur * v.largeur; S += pl; mesures.push({ nom: "Plafond", val: pl, unite: "m²", detail: `${fr(v.longueur)} × ${fr(v.largeur)} = ${fr(pl)} m²` }); mesures.push({ nom: "Surface à peindre", val: S, unite: "m²", detail: `${fr(murs)} + ${fr(pl)} = ${fr(S)} m²` }); }
      return { manque, alertes, mesures, besoins: [...produitsPeinture(v, S), ...mainOeuvre(v, S, "m²", "Travaux de peinture")], base: S };
    } },
  { id: "p_surface", metier: "peinture", nom: "Mur, façade, plafond ou porte",
    champs: [
      ...G("Dimensions", [{ k: "longueur", t: "n", l: "Longueur (m)" }, { k: "hauteur", t: "n", l: "Hauteur ou largeur (m)" }, { k: "nombre", t: "n", l: "Nombre de surfaces identiques", ph: "1" }, { k: "faces", t: "n", l: "Faces à peindre (1 ou 2)", ph: "1" }, OUV]),
      ...G("Produits", [{ k: "prod", t: "prod", l: "Produits à appliquer" }, PERTE("Pertes de produit (%)")], "La surface couverte par pot est écrite sur le pot, pour une couche."), ...MO("m²", "Travaux de peinture"),
    ],
    calc(v) {
      const p = paroi(v); if (p.manque.length) return { ...p, mesures: [], besoins: [] };
      return { manque: [], alertes: p.alertes, mesures: [{ nom: "Surface à peindre", val: p.S, unite: "m²", detail: p.detail }], besoins: [...produitsPeinture(v, p.S), ...mainOeuvre(v, p.S, "m²", "Travaux de peinture")], base: p.S };
    } },
  { id: "p_libre", metier: "peinture", nom: "Surface déjà mesurée",
    champs: [...G("Dimensions", [{ k: "surface", t: "n", l: "Surface à peindre (m²)" }]), ...G("Produits", [{ k: "prod", t: "prod", l: "Produits à appliquer" }, PERTE("Pertes de produit (%)")]), ...MO("m²", "Travaux de peinture")],
    calc(v) {
      if (!pos(v.surface)) return { manque: ["la surface"], alertes: [], mesures: [], besoins: [] };
      return { manque: [], alertes: [], mesures: [{ nom: "Surface à peindre", val: v.surface, unite: "m²", detail: `Mesurée sur place : ${fr(v.surface)} m²` }], besoins: [...produitsPeinture(v, v.surface), ...mainOeuvre(v, v.surface, "m²", "Travaux de peinture")], base: v.surface };
    } },

  // ===== CARRELAGE =====
  { id: "c_sol", metier: "carrelage", nom: "Sol d'une pièce", liens: LIENS_CARREAU(),
    champs: [
      ...G("Dimensions de la pièce", [{ k: "longueur", t: "n", l: "Longueur (m)" }, { k: "largeur", t: "n", l: "Largeur (m)" }, { k: "deduire", t: "n", l: "Surface à ne pas carreler (m²)", aide: "Baignoire, placard maçonné… Laisse vide s'il n'y en a pas." }]),
      ...champsCarreaux(),
      ...G("Plinthes", [{ k: "plinthes", t: "bool", l: "Poser des plinthes" },
        { k: "portes", t: "n", l: "Largeur totale des portes, sans plinthe (m)", si: (v) => v.plinthes },
        { k: "plinthe", t: "n", l: "Longueur d'une plinthe (cm)", si: (v) => v.plinthes },
        { k: "perteP", t: "n", l: "Coupes de plinthes (%)", memo: true, si: (v) => v.plinthes, aide: "Laisse vide si tu n'en comptes pas." }]),
      ...MO("m²", "Pose de carrelage"),
    ],
    calc(v) {
      const manque = [], alertes = [], mesures = [];
      if (!pos(v.longueur)) manque.push("la longueur"); if (!pos(v.largeur)) manque.push("la largeur");
      if (v.deduire !== null && v.deduire !== undefined && v.deduire !== "" && !(N(v.deduire) && v.deduire >= 0)) manque.push("une surface à déduire positive");
      if (manque.length) return { manque, alertes, mesures, besoins: [] };
      const brute = v.longueur * v.largeur, ded = pos(v.deduire) ? v.deduire : 0, S = brute - ded;
      if (S <= 0) return { manque: ["une surface positive (surface à déduire trop grande)"], alertes: ["La surface à déduire est aussi grande que la pièce."], mesures, besoins: [] };
      mesures.push({ nom: "Surface à carreler", val: S, unite: "m²", detail: `${fr(v.longueur)} × ${fr(v.largeur)} = ${fr(brute)} m²${ded ? ` − ${fr(ded)} m² = ${fr(S)} m²` : ""}` });
      const besoins = [...besoinsCarreaux(v, S)];
      if (v.plinthes) {
        const per = 2 * (v.longueur + v.largeur), po = pos(v.portes) ? v.portes : 0, ml = per - po, m = [];
        if (ml <= 0) { alertes.push("La largeur des portes dépasse le tour de la pièce."); besoins.push(besoin("produits", "Plinthes", "Pièce", "sup", null, "", ["une largeur de portes plus petite que le tour de la pièce"])); }
        else {
          mesures.push({ nom: "Plinthes", val: ml, unite: "ml", detail: `2 × (${fr(v.longueur)} + ${fr(v.largeur)}) = ${fr(per)} ml${po ? ` − ${fr(po)} ml de portes = ${fr(ml)} ml` : ""}` });
          const pe = pertes(v.perteP, m); if (!pos(v.plinthe)) m.push("la longueur d'une plinthe (cm)");
          besoins.push(besoin("produits", "Plinthes", "Pièce", "sup", m.length ? null : (ml * pe.k) / (v.plinthe / 100), m.length ? "" : `${fr(ml)} ml${pe.t}${pe.k > 1 ? ` = ${fr(ml * pe.k)} ml` : ""} ÷ ${fr(v.plinthe / 100)} m par plinthe = ${fr((ml * pe.k) / (v.plinthe / 100))}`, m));
        }
      }
      return { manque, alertes: [...alertes, ...alertesCarreaux(v)], mesures, besoins: [...besoins, ...mainOeuvre(v, S, "m²", "Pose de carrelage")], base: S };
    } },
  { id: "c_mur", metier: "carrelage", nom: "Mur (faïence)", liens: LIENS_CARREAU(),
    champs: [...G("Dimensions", [{ k: "longueur", t: "n", l: "Longueur de mur à carreler (m)" }, { k: "hauteur", t: "n", l: "Hauteur de pose (m)" }, OUV]), ...champsCarreaux(), ...MO("m²", "Pose de faïence")],
    calc(v) {
      const p = paroi(v, { hn: "la hauteur de pose" }); if (p.manque.length) return { ...p, mesures: [], besoins: [] };
      return { manque: [], alertes: [...p.alertes, ...alertesCarreaux(v)], mesures: [{ nom: "Surface à carreler", val: p.S, unite: "m²", detail: p.detail }], besoins: [...besoinsCarreaux(v, p.S), ...mainOeuvre(v, p.S, "m²", "Pose de faïence")], base: p.S };
    } },
  { id: "c_libre", metier: "carrelage", nom: "Surface déjà mesurée", liens: LIENS_CARREAU(),
    champs: [...G("Dimensions", [{ k: "surface", t: "n", l: "Surface à carreler (m²)" }]), ...champsCarreaux(), ...MO("m²", "Pose de carrelage")],
    calc(v) {
      if (!pos(v.surface)) return { manque: ["la surface"], alertes: [], mesures: [], besoins: [] };
      return { manque: [], alertes: alertesCarreaux(v), mesures: [{ nom: "Surface à carreler", val: v.surface, unite: "m²", detail: `Mesurée sur place : ${fr(v.surface)} m²` }], besoins: [...besoinsCarreaux(v, v.surface), ...mainOeuvre(v, v.surface, "m²", "Pose de carrelage")], base: v.surface };
    } },

  // ===== MAÇONNERIE =====
  { id: "m_mur", metier: "maconnerie", nom: "Mur en blocs", liens: [{ nom: "blocNom", champs: ["blocL", "blocH", "blocE"] }],
    note: "Blocs : nombre exact pour ces dimensions et cette casse. Mortier : seulement le volume géométrique des joints pleins ; le mortier tombé dans les alvéoles, les chutes et le gâchage perdu se comptent dans « Pertes de mortier ». Linteaux, chaînages et poteaux se chiffrent à part.",
    champs: [
      ...G("Dimensions du mur", [{ k: "longueur", t: "n", l: "Longueur (m)" }, { k: "hauteur", t: "n", l: "Hauteur (m)" }, OUV]),
      ...G("Blocs", [{ k: "blocNom", t: "txt", l: "Nom du bloc", ph: "Ex. : Parpaing de 15" },
        { k: "blocL", t: "n", l: "Longueur d'un bloc (cm)" }, { k: "blocH", t: "n", l: "Hauteur d'un bloc (cm)" },
        { k: "joint", t: "n", l: "Épaisseur des joints (cm)", memo: true }, PERTE("Casse et coupes de blocs (%)")], "Mesure un de tes blocs : les dimensions changent d'un fabricant à l'autre."),
      ...G("Mortier de pose", [{ k: "mortier", t: "bool", l: "Estimer le mortier des joints" }, { k: "blocE", t: "n", l: "Épaisseur d'un bloc (cm)", si: (v) => v.mortier },
        ...DOSAGE("mortier", false, (v) => v.mortier), { k: "perteM", t: "n", l: "Pertes de mortier (%)", memo: true, si: (v) => v.mortier, aide: "Alvéoles, chutes, gâchage perdu. Laisse vide si tu n'en comptes pas." }]),
      ...MO("m²", "Élévation de mur"),
    ],
    calc(v) {
      const p = paroi(v); if (p.manque.length) return { ...p, mesures: [], besoins: [] };
      const S = p.S, alertes = [...p.alertes], besoins = [], mesures = [{ nom: "Surface de mur", val: S, unite: "m²", detail: p.detail }];
      const nomBloc = txt(v.blocNom, "Blocs"), m = [];
      if (!pos(v.blocL)) m.push("la longueur d'un bloc (cm)"); if (!pos(v.blocH)) m.push("la hauteur d'un bloc (cm)"); if (!N(v.joint) || v.joint < 0) m.push("l'épaisseur des joints (cm, 0 si pose à sec)");
      const pe = pertes(v.perte, m);
      let parM2 = null;
      if (!m.length) {
        parM2 = 1 / (((v.blocL + v.joint) / 100) * ((v.blocH + v.joint) / 100));
        if (v.joint >= v.blocH) alertes.push("Le joint est plus épais que le bloc : vérifie que tout est en centimètres.");
        if (v.blocL / 100 > v.longueur || v.blocH / 100 > v.hauteur) alertes.push("Un bloc est plus grand que le mur : vérifie que le bloc est en centimètres et le mur en mètres.");
        mesures.push({ nom: "Blocs par m²", val: parM2, unite: "par m²", detail: `1 m² ÷ ((${fr(v.blocL)} + ${fr(v.joint)}) cm × (${fr(v.blocH)} + ${fr(v.joint)}) cm) = ${fr(parM2)} blocs par m²` });
      }
      besoins.push(besoin("produits", nomBloc, "Pièce", "sup", m.length ? null : S * parM2 * pe.k, m.length ? "" : `${fr(S)} m² × ${fr(parM2)} blocs par m²${pe.t} = ${fr(S * parM2 * pe.k)}`, m));
      if (v.mortier) {
        const mm = []; if (m.length) mm.push("les dimensions du bloc et du joint"); if (!pos(v.blocE)) mm.push("l'épaisseur d'un bloc (cm)");
        const pm = pertes(v.perteM, mm);
        if (mm.length) besoins.push(besoin("produits", "Ciment", "Sac", "sup", null, "", mm));
        else {
          const plein = (v.blocL * v.blocH) / ((v.blocL + v.joint) * (v.blocH + v.joint)), Vj = S * (v.blocE / 100) * (1 - plein), V = Vj * pm.k;
          mesures.push({ nom: "Mortier des joints (estimation géométrique)", val: V, unite: "m³", est: true, detail: `${fr(S)} m² × ${fr(v.blocE / 100)} m d'épaisseur × part des joints ${fr((1 - plein) * 100, 1)} % = ${fr(Vj, 3)} m³${pm.t}${pm.k > 1 ? ` = ${fr(V, 3)} m³` : ""}` });
          if (V > 0) besoins.push(...melange(V, v, { quoi: "mortier" }));
        }
      }
      return { manque: [], alertes, mesures, besoins: [...besoins, ...mainOeuvre(v, S, "m²", "Élévation de mur")], base: S };
    } },
  { id: "m_beton", metier: "maconnerie", nom: "Béton : semelle, poteau, poutre, chaînage, dalle",
    note: "Volume : exact pour ces dimensions (béton en place). Ciment, sable, gravier : estimation d'après TON dosage ; l'application ne choisit ni le dosage ni la résistance du béton. Armatures et coffrage : à part, d'après les plans.",
    champs: [
      ...G("Dimensions", [{ k: "nom", t: "txt", l: "Nom de l'élément", ph: "Ex. : Poteaux du rez-de-chaussée" }, { k: "nombre", t: "n", l: "Nombre d'éléments identiques", ph: "1" },
        { k: "longueur", t: "n", l: "Longueur ou hauteur d'un élément (m)" }, { k: "largeur", t: "n", l: "Largeur de la section (cm)" }, { k: "epaisseur", t: "n", l: "Épaisseur ou hauteur de la section (cm)" }], "Longueur en mètres, section en centimètres."),
      ...G("Dosage du béton", [PERTE("Pertes de béton (%)"), ...DOSAGE("béton", "requis")]), ...MO("m³", "Coulage de béton"),
    ],
    calc(v) { return volume(v, { quoi: "béton", gravier: "requis", mo: "Coulage de béton", ln: "la largeur de la section (cm)", lcm: true }); } },
  { id: "m_chape", metier: "maconnerie", nom: "Chape ou dallage",
    note: "Volume : exact pour une épaisseur constante. Sur un support irrégulier, l'épaisseur moyenne réelle est plus forte : compte-la dans les pertes.",
    champs: [
      ...G("Dimensions", [{ k: "nombre", t: "n", l: "Nombre de surfaces identiques", ph: "1" }, { k: "longueur", t: "n", l: "Longueur (m)" }, { k: "largeur", t: "n", l: "Largeur (m)" }, { k: "epaisseur", t: "n", l: "Épaisseur (cm)" }]),
      ...G("Dosage", [PERTE("Pertes (%)"), ...DOSAGE("mortier ou béton", "option")]), ...MO("m²", "Réalisation de chape"),
    ],
    calc(v) { return volume(v, { quoi: "mortier ou béton", gravier: "option", mo: "Réalisation de chape", ln: "la largeur", moSurface: true }); } },
  { id: "m_enduit", metier: "maconnerie", nom: "Enduit",
    note: "Volume : surface × épaisseur moyenne. Sur des blocs bruts, l'enduit remplit aussi les creux : compte-le dans les pertes.",
    champs: [
      ...G("Dimensions", [{ k: "longueur", t: "n", l: "Longueur du mur (m)" }, { k: "hauteur", t: "n", l: "Hauteur du mur (m)" }, { k: "faces", t: "n", l: "Faces à enduire (1 ou 2)", ph: "1" }, OUV, { k: "epaisseur", t: "n", l: "Épaisseur moyenne de l'enduit (cm)", memo: true }]),
      ...G("Dosage du mortier", [PERTE("Pertes d'enduit (%)"), ...DOSAGE("mortier", false)]), ...MO("m²", "Enduit"),
    ],
    calc(v) {
      const p = paroi(v); if (p.manque.length) return { ...p, mesures: [], besoins: [] };
      const mesures = [{ nom: "Surface à enduire", val: p.S, unite: "m²", detail: p.detail }], m = [];
      if (!pos(v.epaisseur)) m.push("l'épaisseur de l'enduit (cm)"); const pe = pertes(v.perte, m);
      let besoins;
      if (m.length) besoins = [besoin("produits", "Ciment", "Sac", "sup", null, "", m)];
      else { const V = p.S * (v.epaisseur / 100) * pe.k; mesures.push({ nom: "Volume d'enduit (estimation)", val: V, unite: "m³", est: true, detail: `${fr(p.S)} m² × ${fr(v.epaisseur / 100, 3)} m${pe.t} = ${fr(V, 3)} m³` }); besoins = melange(V, v, { quoi: "mortier" }); }
      return { manque: [], alertes: p.alertes, mesures, besoins: [...besoins, ...mainOeuvre(v, p.S, "m²", "Enduit")], base: p.S };
    } },
  { id: "m_fouille", metier: "maconnerie", nom: "Fouille ou terrassement",
    note: "Volume de terre en place. La terre sortie prend plus de place (foisonnement) : l'application ne l'estime pas.",
    champs: [...G("Dimensions", [{ k: "nombre", t: "n", l: "Nombre de fouilles identiques", ph: "1" }, { k: "longueur", t: "n", l: "Longueur (m)" }, { k: "largeur", t: "n", l: "Largeur (m)" }, { k: "profondeur", t: "n", l: "Profondeur (m)" }]), ...MO("m³", "Fouilles")],
    calc(v) {
      const manque = []; if (!pos(v.longueur)) manque.push("la longueur"); if (!pos(v.largeur)) manque.push("la largeur"); if (!pos(v.profondeur)) manque.push("la profondeur");
      const nb = entier(v.nombre, "le nombre de fouilles", manque);
      if (manque.length) return { manque, alertes: [], mesures: [], besoins: [] };
      const V = nb * v.longueur * v.largeur * v.profondeur;
      return { manque, alertes: [], mesures: [{ nom: "Volume de terre en place", val: V, unite: "m³", detail: `${nb > 1 ? fr(nb) + " × " : ""}${fr(v.longueur)} × ${fr(v.largeur)} × ${fr(v.profondeur)} = ${fr(V)} m³ (terre en place, sans foisonnement)` }], besoins: mainOeuvre(v, V, "m³", "Fouilles"), base: V };
    } },
  { id: "m_acier", metier: "maconnerie", nom: "Armatures (d'après le plan)",
    note: "Nombre de barres, diamètres, espacement des cadres, ancrages et recouvrements se lisent sur le plan de ferraillage : l'application ne les choisit pas. Elle compte les barres à acheter en découpant des pièces entières dans chaque barre (une chute trop courte est perdue).",
    champs: [
      ...G("Élément armé", [{ k: "nom", t: "txt", l: "Nom", ph: "Ex. : Poteaux" }, { k: "nombre", t: "n", l: "Nombre d'éléments identiques", ph: "1" }, { k: "longueur", t: "n", l: "Longueur d'un élément (m)" }, { k: "barre", t: "n", l: "Longueur d'une barre du commerce (m)", memo: true }]),
      ...G("Barres filantes (lues sur le plan)", [{ k: "filNom", t: "txt", l: "Désignation", ph: "Ex. : Fer de 12" }, { k: "filN", t: "n", l: "Nombre de barres par élément" }, { k: "filRec", t: "n", l: "Longueur ajoutée à chaque barre : ancrages, attentes (m)" }]),
      ...G("Cadres (lus sur le plan)", [{ k: "cadNom", t: "txt", l: "Désignation", ph: "Ex. : Fer de 6" }, { k: "cadEsp", t: "n", l: "Espacement des cadres (cm)" }, { k: "cadDev", t: "n", l: "Longueur de fer d'un cadre, crochets compris (cm)" }]),
      ...MO("ml", "Ferraillage"),
    ],
    calc(v) {
      const manque = [], alertes = []; if (!pos(v.longueur)) manque.push("la longueur d'un élément");
      const nb = entier(v.nombre, "le nombre d'éléments", manque);
      if (manque.length) return { manque, alertes, mesures: [], besoins: [] };
      const besoins = [], mesures = [], sansBarre = pos(v.barre) ? [] : ["la longueur d'une barre du commerce (m)"];
      // Découpe : pièces entières par barre = partie entière de (barre ÷ pièce). Barres = pièces ÷ pièces par barre, entier au-dessus.
      const decoupe = (nom, pieces, lg, quoi) => {
        const m = [...sansBarre]; if (m.length) return besoin("produits", nom, "Barre", "sup", null, "", m);
        if (lg > v.barre + 1e-9) {
          alertes.push(`${quoi} : une pièce de ${fr(lg)} m est plus longue qu'une barre de ${fr(v.barre)} m. Il faut des recouvrements : ajoute leur longueur d'après le plan.`);
          const b = (pieces * lg) / v.barre; return besoin("produits", nom, "Barre", "sup", b, `${fr(pieces)} pièces × ${fr(lg)} m = ${fr(pieces * lg)} ml ÷ ${fr(v.barre)} m par barre = ${fr(b)} (sans les recouvrements)`, [], { est: "Estimation basse : les recouvrements entre barres ne sont pas comptés." });
        }
        const par = Math.floor(net(v.barre / lg)), b = Math.ceil(net(pieces / par));
        return besoin("produits", nom, "Barre", "sup", b, `${fr(pieces)} pièces de ${fr(lg)} m ; ${par} pièce${par > 1 ? "s" : ""} entière${par > 1 ? "s" : ""} par barre de ${fr(v.barre)} m (${fr(v.barre)} ÷ ${fr(lg)} = ${fr(v.barre / lg)}) ; ${fr(pieces)} ÷ ${par} = ${fr(pieces / par)} → ${b} barres`);
      };
      const filN = v.filN === null || v.filN === undefined || v.filN === "" ? 0 : entier(v.filN, "le nombre de barres filantes", manque);
      if (manque.length) return { manque, alertes, mesures, besoins: [] };
      if (filN) {
        const rec = pos(v.filRec) ? v.filRec : 0, lg = v.longueur + rec, pieces = nb * filN;
        mesures.push({ nom: "Barres filantes", val: pieces * lg, unite: "ml", detail: `${nb > 1 ? fr(nb) + " éléments × " : ""}${fr(filN)} barres = ${fr(pieces)} pièces de (${fr(v.longueur)}${rec ? " + " + fr(rec) : ""}) = ${fr(lg)} m, soit ${fr(pieces * lg)} ml` });
        besoins.push(decoupe(txt(v.filNom, "Fer à béton (filants)"), pieces, lg, "Barres filantes"));
      }
      if (pos(v.cadEsp) || pos(v.cadDev)) {
        const m = []; if (!pos(v.cadEsp)) m.push("l'espacement des cadres (cm)"); if (!pos(v.cadDev)) m.push("la longueur de fer d'un cadre (cm)");
        if (m.length) besoins.push(besoin("produits", txt(v.cadNom, "Fer à béton (cadres)"), "Barre", "sup", null, "", m));
        else {
          const parEl = Math.ceil(net(v.longueur / (v.cadEsp / 100))) + 1, cadres = nb * parEl;
          mesures.push({ nom: "Cadres", val: cadres, unite: "cadres", detail: `${fr(v.longueur)} m ÷ ${fr(v.cadEsp)} cm = ${fr(v.longueur / (v.cadEsp / 100))} → ${parEl - 1} intervalles + 1 = ${parEl} cadres${nb > 1 ? ` × ${fr(nb)} éléments = ${fr(cadres)}` : ""} (à comparer au plan)` });
          besoins.push(decoupe(txt(v.cadNom, "Fer à béton (cadres)"), cadres, v.cadDev / 100, "Cadres"));
        }
      }
      if (!besoins.length) return { manque: ["le nombre de barres filantes ou les cadres (lus sur le plan)"], alertes, mesures, besoins };
      return { manque, alertes, mesures, besoins: [...besoins, ...mainOeuvre(v, nb * v.longueur, "ml", "Ferraillage")], base: nb * v.longueur };
    } },

  // ===== PLOMBERIE =====
  { id: "pl_reseau", metier: "plomberie", nom: "Réseau de tuyaux", liens: [{ nom: "tuyau", champs: ["vente", "barre"] }],
    note: "Type et diamètre du tuyau, pentes d'évacuation, pression et ventilation restent ta décision de plombier : rien de cela n'est calculé. Un réseau par diamètre. Les chutes de barre se réutilisent avec des manchons : compte ces manchons dans les raccords.",
    champs: [
      ...G("Tuyau", [{ k: "tuyau", t: "txt", l: "Type et diamètre", ph: "Ex. : Tube PVC évacuation Ø100" }, { k: "longueur", t: "n", l: "Longueur mesurée du tracé (m)" }, PERTE("Chutes de coupe (%)"),
        { k: "vente", t: "choix", l: "Le tuyau s'achète", opt: [["Barre", "À la barre"], ["Couronne", "À la couronne"], ["Mètre", "Au mètre"]] },
        { k: "barre", t: "n", l: "Longueur d'une barre ou d'une couronne (m)", si: (v) => (v.vente || "Barre") !== "Mètre" }], "Mesure le tracé réel, montées et descentes comprises."),
      ...G("Raccords et fixations", [{ k: "art", t: "art", l: "Raccords comptés sur le tracé", u: "Pièce", sugg: ["Coude", "Té", "Manchon", "Réduction", "Vanne d'arrêt", "Bouchon"] },
        { k: "colEsp", t: "n", l: "Un collier tous les (cm) — vide si pas de colliers", memo: true }]),
      ...MO("ml", "Pose de tuyauterie"),
    ],
    calc(v) {
      const manque = []; if (!pos(v.longueur)) manque.push("la longueur du tracé"); if (!String(v.tuyau || "").trim()) manque.push("le type et le diamètre du tuyau");
      { const pm = []; pertes(v.perte, pm); manque.push(...pm); }
      if (manque.length) return { manque, alertes: [], mesures: [], besoins: [] };
      const m = [], pe = pertes(v.perte, []), L = v.longueur * pe.k, vente = v.vente || "Barre", besoins = [], alertes = [];
      const mesures = [{ nom: "Tuyau", val: L, unite: "ml", detail: `${fr(v.longueur)} ml mesurés${pe.t}${pe.k > 1 ? ` = ${fr(L)} ml` : ""}` }];
      if (vente === "Mètre") besoins.push(besoin("produits", v.tuyau.trim(), "Mètre", "sup", L, `${fr(v.longueur)} ml${pe.t} = ${fr(L)}`));
      else { if (!pos(v.barre)) m.push(`la longueur d'une ${plat(vente)} (m)`); besoins.push(besoin("produits", v.tuyau.trim(), vente, "sup", m.length ? null : L / v.barre, m.length ? "" : `${fr(v.longueur)} ml${pe.t} = ${fr(L)} ml ÷ ${fr(v.barre)} m par ${plat(vente)} = ${fr(L / v.barre)}`, m)); }
      besoins.push(...articles(v.art));
      if (v.colEsp !== null && v.colEsp !== undefined && v.colEsp !== "") {
        if (!pos(v.colEsp)) besoins.push(besoin("produits", `Colliers pour ${v.tuyau.trim()}`, "Pièce", "sup", null, "", ["un espacement de colliers supérieur à zéro (cm)"]));
        else { const n = Math.ceil(net(v.longueur / (v.colEsp / 100))) + 1; besoins.push(besoin("produits", `Colliers pour ${v.tuyau.trim()}`, "Pièce", "sup", n, `${fr(v.longueur)} ml ÷ ${fr(v.colEsp)} cm = ${fr(v.longueur / (v.colEsp / 100))} → ${n - 1} intervalles + 1 = ${n}`, [], { est: EST.colliers })); }
      }
      if (!totalArticles(v.art)) alertes.push("Aucun raccord compté sur ce réseau : coudes, tés, manchons et vannes se chiffrent à part.");
      return { manque, alertes, mesures, besoins: [...besoins, ...mainOeuvre(v, v.longueur, "ml", "Pose de tuyauterie")], base: v.longueur };
    } },
  { id: "pl_appareils", metier: "plomberie", nom: "Appareils et points d'eau",
    note: "L'application compte ce que tu saisis. Le choix des appareils, leur raccordement et les essais d'étanchéité restent sous ta responsabilité.",
    champs: [...G("Appareils", [{ k: "art", t: "art", l: "Appareils à poser", u: "Pièce", sugg: ["WC", "Lavabo", "Douche", "Évier", "Chauffe-eau", "Robinet de puisage"] }, { k: "acc", t: "art", l: "Accessoires de raccordement", u: "Pièce", sugg: ["Flexible", "Robinet d'arrêt", "Siphon", "Fixations"] }]), ...MO("point", "Pose des appareils")],
    calc(v) {
      const pts = totalArticles(v.art);
      if (!pts) return { manque: ["au moins un appareil avec sa quantité"], alertes: [], mesures: [], besoins: [] };
      const alertes = totalArticles(v.acc) ? [] : ["Aucun accessoire de raccordement compté : flexibles, robinets d'arrêt, siphons et fixations se chiffrent à part."];
      return { manque: [], alertes, mesures: [{ nom: "Points d'eau", val: pts, unite: "points", detail: `${(v.art || []).filter((a) => pos(a.n)).map((a) => `${fr(a.n)} ${txt(a.nom, "article")}`).join(" + ")} = ${fr(pts)} points (un point par appareil)` }], besoins: [...articles(v.art), ...articles(v.acc), ...mainOeuvre(v, pts, "point", "Pose des appareils")], base: pts };
    } },

  // ===== ÉLECTRICITÉ =====
  { id: "e_points", metier: "electricite", nom: "Points d'une pièce",
    note: "L'application compte les points que tu saisis. Le nombre de points par circuit et leur protection se décident sur le schéma, par un électricien qualifié.",
    champs: [...G("Points", [{ k: "art", t: "art", l: "Points à poser", u: "Pièce", sugg: ["Prise 2P+T", "Interrupteur simple", "Va-et-vient", "Point lumineux", "Sortie de câble"] }, { k: "boites", t: "bool", l: "Compter une boîte d'encastrement par point" }]), ...MO("point", "Pose des points électriques")],
    calc(v) {
      const pts = totalArticles(v.art);
      if (!pts) return { manque: ["au moins un point avec sa quantité"], alertes: [], mesures: [], besoins: [] };
      const besoins = articles(v.art);
      if (v.boites) besoins.push(besoin("produits", "Boîte d'encastrement", "Pièce", "sup", pts, `Une par point : ${fr(pts)}`));
      return { manque: [], alertes: [], mesures: [{ nom: "Points", val: pts, unite: "points", detail: `${(v.art || []).filter((a) => pos(a.n)).map((a) => `${fr(a.n)} ${txt(a.nom, "article")}`).join(" + ")} = ${fr(pts)} points` }], besoins: [...besoins, ...mainOeuvre(v, pts, "point", "Pose des points électriques")], base: pts };
    } },
  { id: "e_ligne", metier: "electricite", nom: "Ligne de câble et son conduit", liens: [{ nom: "cable", champs: ["rouleau"] }, { nom: "conduit", champs: ["rouleauC"] }],
    note: "La section du câble, le calibre de sa protection et le diamètre du conduit ne sont pas calculés : ils relèvent d'un électricien qualifié. L'application compte seulement les longueurs à acheter.",
    champs: [
      ...G("Câble", [{ k: "cable", t: "txt", l: "Type et section (ton choix)", ph: "Ex. : Câble 3G2,5", aide: "Recopie ce que tu achètes, comme sur l'étiquette du rouleau. Le choix de la section revient à l'électricien qualifié." }, { k: "nombre", t: "n", l: "Nombre de lignes identiques", ph: "1" },
        { k: "longueur", t: "n", l: "Longueur du tracé d'une ligne, du tableau au dernier point (m)" }, { k: "fils", t: "n", l: "Fils tirés séparément (1 pour un câble)", ph: "1" },
        { k: "reserve", t: "n", l: "Longueur laissée à chaque raccordement (m)", memo: true }, { k: "racc", t: "n", l: "Nombre de raccordements sur une ligne", si: (v) => pos(v.reserve), aide: "Tableau, boîtes, prises, interrupteurs : chaque endroit où le câble est coupé ou dénudé." },
        PERTE("Chutes (%)"), { k: "rouleau", t: "n", l: "Longueur d'un rouleau de câble (m)" }], "Mesure le tracé réel : montées, descentes et détours compris."),
      ...G("Conduit", [{ k: "conduit", t: "txt", l: "Conduit ou gaine — vide s'il n'y en a pas", ph: "Ex. : Gaine ICTA Ø20" }, { k: "rouleauC", t: "n", l: "Longueur d'un rouleau ou d'une barre de conduit (m)", si: (v) => !!String(v.conduit || "").trim() }]),
      ...MO("ml", "Tirage de câble"),
    ],
    calc(v) {
      const manque = [], alertes = []; if (!pos(v.longueur)) manque.push("la longueur du tracé"); if (!String(v.cable || "").trim()) manque.push("le type et la section du câble");
      const nb = entier(v.nombre, "le nombre de lignes", manque), fils = entier(v.fils, "le nombre de fils", manque);
      const racc = pos(v.reserve) ? (v.racc === null || v.racc === undefined || v.racc === "" ? (manque.push("le nombre de raccordements"), null) : entier(v.racc, "le nombre de raccordements", manque)) : 0;
      { const pm = []; pertes(v.perte, pm); manque.push(...pm); }
      if (manque.length) return { manque, alertes, mesures: [], besoins: [] };
      const res = pos(v.reserve) ? v.reserve * racc : 0, m = [], pe = pertes(v.perte, []);
      const uneLigne = v.longueur + res, L = nb * uneLigne * fils * pe.k, trace = nb * v.longueur;
      const mesures = [{ nom: "Câble", val: L, unite: "ml", detail: `${nb > 1 ? fr(nb) + " lignes × " : ""}(${fr(v.longueur)} m de tracé${res ? ` + ${fr(racc)} raccordements × ${fr(v.reserve)} m` : ""})${fils > 1 ? ` × ${fr(fils)} fils` : ""}${pe.t} = ${fr(L)} ml` }];
      if (!pos(v.rouleau)) m.push("la longueur d'un rouleau de câble (m)");
      else if (uneLigne > v.rouleau) alertes.push(`Une ligne (${fr(uneLigne)} m) est plus longue qu'un rouleau (${fr(v.rouleau)} m) : un câble ne se raccorde pas dans un conduit. Prévois un rouleau plus long ou une boîte de jonction.`);
      if (!res) alertes.push("Aucune longueur comptée pour les raccordements (tableau, boîtes, appareils).");
      const besoins = [besoin("produits", v.cable.trim(), "Rouleau", "sup", m.length ? null : L / v.rouleau, m.length ? "" : `${fr(L)} ml ÷ ${fr(v.rouleau)} m par rouleau = ${fr(L / v.rouleau)}`, m)];
      if (String(v.conduit || "").trim()) {
        const mc = []; if (!pos(v.rouleauC)) mc.push("la longueur d'un rouleau ou d'une barre de conduit (m)");
        mesures.push({ nom: "Conduit", val: trace * pe.k, unite: "ml", detail: `${nb > 1 ? fr(nb) + " × " : ""}${fr(v.longueur)} m de tracé${pe.t} = ${fr(trace * pe.k)} ml (un conduit par ligne)` });
        besoins.push(besoin("produits", v.conduit.trim(), "Rouleau", "sup", mc.length ? null : (trace * pe.k) / v.rouleauC, mc.length ? "" : `${fr(trace * pe.k)} ml ÷ ${fr(v.rouleauC)} m = ${fr((trace * pe.k) / v.rouleauC)}`, mc));
      }
      return { manque, alertes, mesures, besoins: [...besoins, ...mainOeuvre(v, trace, "ml", "Tirage de câble")], base: trace };
    } },
  { id: "e_tableau", metier: "electricite", nom: "Tableau et protections",
    note: "Le calibre des disjoncteurs, les différentiels et la mise à la terre se décident sur un schéma fait par un électricien qualifié. Ici, tu comptes ce que le schéma demande.",
    champs: [...G("Matériel", [{ k: "art", t: "art", l: "Matériel du tableau (d'après le schéma)", u: "Pièce", sugg: ["Coffret", "Disjoncteur", "Interrupteur différentiel", "Peigne", "Bornier de terre", "Piquet de terre"] }]),
      ...G("Main-d'œuvre", [{ k: "moMode", t: "choix", l: "Comment tu la factures", opt: [["", "Pas de main-d'œuvre ici"], ["tache", "Au forfait"]], memo: true }, { k: "moNom", t: "txt", l: "Nom de la prestation", ph: "Câblage du tableau", si: (v) => !!v.moMode }])],
    calc(v) {
      const n = totalArticles(v.art);
      if (!n) return { manque: ["au moins un article avec sa quantité"], alertes: [], mesures: [], besoins: [] };
      return { manque: [], alertes: [], mesures: [], besoins: [...articles(v.art), ...mainOeuvre({ ...v, moMode: v.moMode ? "tache" : "" }, 1, "forfait", "Câblage du tableau")], base: 1 };
    } },
];
// Aide sous les champs que seul le professionnel connaît : elle dit OÙ trouver la valeur (emballage, plan, vendeur), jamais QUELLE valeur écrire.
const AIDES = [
  [/^Poids d'un sac/, "Écrit sur le sac."], [/^(Longueur|Largeur) d'un carreau/, "Écrit sur la boîte de carreaux, ou mesure un carreau."],
  [/^(Longueur|Hauteur|Épaisseur) d'un bloc/, "Mesure un de tes blocs, ou demande-le au vendeur."], [/^Épaisseur des joints/, "Épaisseur que tu laisses entre deux blocs, à toi de la choisir."],
  [/^Sable par m³|^Gravier par m³/, "Ton dosage pour 1 m³, ou celui du plan. L'application n'en propose pas."],
  [/^Longueur d'une barre|^Longueur d'un rouleau|^Longueur d'un rouleau ou d'une barre/, "Écrit sur l'étiquette du rouleau ou de la barre que tu achètes."],
  [/^(Largeur de la section|Épaisseur ou hauteur de la section)/, "Dimensions de l'élément, lues sur le plan ou mesurées sur place."],
  [/^Espacement des cadres|^Nombre de barres par élément|^Longueur de fer d'un cadre|^Longueur ajoutée à chaque barre/, "À lire sur le plan ou la liste d'armatures. Sans plan, fais-le préparer par le bureau d'études."],
  [/^Pertes de béton|^Pertes de produit|^Chutes|^Casse et coupes/, "Facultatif : la part perdue (cassée, coupée, renversée). Laisse vide si tu n'en comptes pas."],
  [/^Longueur laissée à chaque raccordement/, "Câble en plus, gardé à chaque endroit où on le coupe ou le dénude. Facultatif."],
  [/^Nombre de surfaces identiques|^Nombre d'éléments identiques|^Nombre de fouilles identiques|^Nombre de lignes identiques/, "Combien d'éléments pareils (mêmes dimensions). Écris 1 s'il n'y en a qu'un."],
  [/^Faces (à peindre|à enduire)/, "1 si un seul côté, 2 si les deux côtés."],
];
for (const t of TYPES) for (const c of t.champs) if (c.l && !c.aide) { const x = AIDES.find(([re]) => re.test(c.l)); if (x) c.aide = x[1]; }


function produitsPeinture(v, S) {
  const liste = (v.prod || []).filter((p) => String(p.nom || "").trim() || pos(p.couv));
  if (!liste.length) return [besoin("produits", "Peinture", "Pot", "sup", null, "", ["au moins un produit à appliquer"])];
  return liste.map((p) => { const b = parCouverture(txt(p.nom, "Peinture"), txt(p.u, "Pot"), S, p.couches, p.couv, v.perte); return String(p.nom || "").trim() ? b : { ...b, brut: null, manque: ["le nom du produit", ...b.manque] }; });
}
function LIENS_CARREAU() { return [{ nom: "carreau", champs: ["vente", "cA", "cB", "parCarton"] }]; }
function champsCarreaux() {
  const carton = (v) => (v.vente || "Carton") === "Carton";
  return [
    ...G("Carreaux", [{ k: "carreau", t: "txt", l: "Nom du carreau", ph: "Ex. : Grès 60×60" },
      { k: "vente", t: "choix", l: "Le carreau s'achète", opt: [["Carton", "Au carton"], ["m²", "Au m²"]] },
      { k: "cA", t: "n", l: "Longueur d'un carreau (cm)", si: carton }, { k: "cB", t: "n", l: "Largeur d'un carreau (cm)", si: carton },
      { k: "parCarton", t: "n", l: "Nombre de carreaux par carton", si: carton, aide: "Écrit sur le carton." },
      PERTE("Casse et coupes (%)")], "Les coupes dépendent de la pose (droite, diagonale) et de la pièce : c'est toi qui fixes le pourcentage."),
    ...G("Colle et joint", [{ k: "colle", t: "n", l: "Colle : kg par m² — vide si pas de colle", memo: true, aide: "Écrit sur le sac, selon le peigne utilisé." }, { k: "colleSac", t: "n", l: "Poids d'un sac de colle (kg)", memo: true, si: (v) => pos(v.colle) },
      { k: "jointC", t: "n", l: "Joint : kg par m² — vide si pas de joint", memo: true, aide: "Écrit sur le sac, selon le format et la largeur du joint." }, { k: "jointSac", t: "n", l: "Poids d'un sac de joint (kg)", memo: true, si: (v) => pos(v.jointC) }]),
  ];
}
function besoinsCarreaux(v, S) {
  const m = [], nom = txt(v.carreau, "Carreaux"), pe = pertes(v.perte, m), out = [];
  if ((v.vente || "Carton") === "m²") out.push(besoin("produits", nom, "m²", "dec", m.length ? null : S * pe.k, m.length ? "" : `${fr(S)} m²${pe.t} = ${fr(S * pe.k)}`, m));
  else {
    if (!pos(v.cA)) m.push("la longueur d'un carreau (cm)"); if (!pos(v.cB)) m.push("la largeur d'un carreau (cm)");
    const n = v.parCarton === null || v.parCarton === undefined || v.parCarton === "" ? (m.push("le nombre de carreaux par carton"), null) : entier(v.parCarton, "le nombre de carreaux par carton", m);
    if (m.length) out.push(besoin("produits", nom, "Carton", "sup", null, "", m));
    else {
      const un = (v.cA / 100) * (v.cB / 100), carton = un * n, brut = (S * pe.k) / carton;
      out.push(besoin("produits", nom, "Carton", "sup", brut, `${fr(S)} m²${pe.t} = ${fr(S * pe.k)} m² ÷ ${fr(carton, 3)} m² par carton (${fr(n)} carreaux de ${fr(v.cA)} × ${fr(v.cB)} cm) = ${fr(brut)}`));
    }
  }
  // Colle et joint : sur la surface posée, sans le pourcentage de casse des carreaux (un carreau cassé n'est pas collé).
  if (pos(v.colle)) out.push(parConso("Colle à carrelage", S, v.colle, v.colleSac, "colle"));
  if (pos(v.jointC)) out.push(parConso("Joint de carrelage", S, v.jointC, v.jointSac, "joint"));
  return out;
}
const alertesCarreaux = (v) => [
  ...(pos(v.colle) ? [] : ["Pas de colle comptée pour cette surface."]),
  ...(pos(v.jointC) ? [] : ["Pas de joint compté pour cette surface."]),
  ...((v.vente || "Carton") === "Carton" && pos(v.cA) && pos(v.cB) && (v.cA > 300 || v.cB > 300 || v.cA < 1 || v.cB < 1) ? ["Format de carreau inhabituel : vérifie qu'il est bien en centimètres."] : []),
];
// Volume d'un élément : nombre × longueur × largeur × épaisseur, puis dosage de l'entreprise.
function volume(v, { quoi, gravier, mo, ln, lcm, moSurface }) {
  const manque = [], alertes = [];
  if (!pos(v.longueur)) manque.push("la longueur"); if (!pos(v.largeur)) manque.push(ln); if (!pos(v.epaisseur)) manque.push("l'épaisseur (cm)");
  const nb = entier(v.nombre, "le nombre d'éléments", manque);
  if (manque.length) return { manque, alertes, mesures: [], besoins: [] };
  const la = lcm ? v.largeur / 100 : v.largeur, ep = v.epaisseur / 100, m = [], pe = pertes(v.perte, m);
  const Vn = nb * v.longueur * la * ep, V = Vn * pe.k, S = nb * v.longueur * la;
  if (ep > v.longueur || (lcm && la > v.longueur)) alertes.push("La section est plus grande que la longueur : vérifie que la section est bien en centimètres et la longueur en mètres.");
  const mesures = [];
  if (moSurface) mesures.push({ nom: "Surface", val: S, unite: "m²", detail: `${nb > 1 ? fr(nb) + " × " : ""}${fr(v.longueur)} × ${fr(la)} = ${fr(S)} m²` });
  mesures.push({ nom: `Volume de ${quoi}`, val: V, unite: "m³", detail: `${nb > 1 ? fr(nb) + " × " : ""}${fr(v.longueur)} m × ${fr(la, 3)} m × ${fr(ep, 3)} m = ${fr(Vn, 3)} m³${pe.t}${pe.k > 1 ? ` = ${fr(V, 3)} m³` : ""}` });
  const besoins = m.length ? [besoin("produits", "Ciment", "Sac", "sup", null, "", m)] : melange(V, v, { quoi, gravier });
  return { manque, alertes, mesures, besoins: [...besoins, ...(moSurface ? mainOeuvre(v, S, "m²", mo) : mainOeuvre(v, Vn, "m³", mo))], base: moSurface ? S : Vn };
}

// ---------- API ----------
export const typesDe = (metier) => TYPES.filter((t) => t.metier === metier);
export const typeDe = (id) => TYPES.find((t) => t.id === id) || null;
export const champsVisibles = (type, v) => type.champs.filter((c) => !c.si || c.si(v || {}));
export const titreOuvrage = (type, v) => String((v && (v.nom || v.tuyau || v.cable)) || "").trim() || type.nom;
export const clePlate = plat;
const cleDe = (b) => `${b.tab}|${plat(b.nom)}|${plat(b.unite)}`;
const arrondir = (arr, x) => (arr === "sup" ? arrSup(x) : arr === "demi" ? arrDemi(x) : arrDec(x));
const ARR_TXT = { sup: "entier au-dessus", demi: "demi-journée au-dessus", dec: "arrondi à 2 décimales" };
const DIMS = ["longueur", "largeur", "hauteur", "surface", "epaisseur", "profondeur"];
const libelle = (type, k) => (type.champs.find((c) => c.k === k) || {}).l || k;

// Calcule tout le métré d'un devis. Renvoie zones détaillées, lignes regroupées pour le devis, manques et alertes.
export function calculer(metre, metier) {
  const zones = [], parCle = new Map(), manques = [], alertes = [];
  for (const z of metre?.zones || []) {
    const nomZ = txt(z.nom, "Zone sans nom"), ouvrages = [], vus = new Map();
    for (const o of z.ouvrages || []) {
      const type = typeDe(o.type); if (!type || (metier && type.metier !== metier)) continue;
      const r = type.calc(o.v || {}), titre = titreOuvrage(type, o.v);
      // Valeurs reprises d'un ouvrage précédent et pas encore confirmées : rien n'entre dans le devis.
      const repris = (o.repris || []).filter((k) => champsVisibles(type, o.v || {}).some((c) => c.k === k));
      if (repris.length) { r.aConfirmer = repris.map((k) => libelle(type, k)); r.manque = [...r.manque, "ta confirmation des valeurs reprises du dernier ouvrage"]; r.besoins = []; }
      const sig = type.id + "|" + JSON.stringify(Object.entries(o.v || {}).filter(([k]) => DIMS.includes(k)).sort());
      if (!r.manque.length && !sig.endsWith("|[]") && vus.has(sig)) alertes.push({ zone: nomZ, ouvrage: titre, texte: `« ${titre} » a les mêmes dimensions que « ${vus.get(sig)} » dans ${nomZ} : compté deux fois ?` });
      vus.set(sig, titre);
      for (const a of r.alertes || []) alertes.push({ zone: nomZ, ouvrage: titre, texte: a });
      if (r.manque.length) manques.push({ zone: nomZ, ouvrage: titre, oid: o.id, quoi: r.manque });
      for (const b of r.besoins || []) {
        if (b.manque.length) { manques.push({ zone: nomZ, ouvrage: titre, oid: o.id, besoin: b.nom, quoi: b.manque }); continue; }
        const cle = cleDe(b), g = parCle.get(cle) || { cle, tab: b.tab, nom: b.nom, unite: b.unite, arr: b.arr, mult: b.mult || 0, est: "", prixPour: b.prixPour || "", brut: 0, parts: [] };
        g.brut += b.brut; if (b.est) g.est = b.est; g.parts.push({ zone: nomZ, ouvrage: titre, brut: b.brut, detail: b.detail }); parCle.set(cle, g);
      }
      ouvrages.push({ id: o.id, type: type.id, titre, note: type.note || "", ...r });
    }
    if (!(z.ouvrages || []).length) alertes.push({ zone: nomZ, ouvrage: "", texte: `${nomZ} n'a encore aucun ouvrage.` });
    zones.push({ id: z.id, nom: nomZ, ouvrages });
  }
  const lignes = [...parCle.values()].map((g) => {
    const base = arrondir(g.arr, g.brut), qty = g.mult ? base * g.mult : base;
    const somme = g.parts.length > 1 ? `Total : ${g.parts.map((p) => fr(p.brut, 3)).join(" + ")} = ${fr(g.brut, 3)} → ` : "→ ";
    const fin = g.arr === "demi"
      ? `${fr(base)} jour${base >= 2 ? "s" : ""} de chantier (${ARR_TXT.demi})${g.mult ? ` × ${g.mult} ouvrier${g.mult > 1 ? "s" : ""} = ${fr(qty)} journée${qty >= 2 ? "s" : ""} d'ouvrier` : ` = ${fr(qty)} journée${qty >= 2 ? "s" : ""} d'équipe`}`
      : `${fr(qty)} ${g.unite} (${ARR_TXT[g.arr]})`;
    const detail = g.parts.map((p) => `${p.zone} — ${p.ouvrage} : ${p.detail}`).join("\n") + `\n${somme}${fin}` + (g.prixPour ? `\n${g.prixPour}` : "") + (g.est ? `\n${g.est}` : "");
    return { ...g, jours: g.arr === "demi" ? base : 0, qty, detail };
  }).filter((l) => l.qty > 0);
  return { zones, lignes, manques, alertes };
}
// Durée du chantier si tout se suit avec une seule équipe : somme des jours de chantier des prestations à la journée.
export function dureeEquipe(metre, metier) { return calculer(metre, metier).lignes.reduce((s, l) => s + (l.jours || 0), 0); }

// Compare les lignes du devis issues du métré avec le métré d'aujourd'hui.
// manuel : [{ id, metre: clé, metreQty: dernière quantité reçue du métré, qty }]
// Une ligne dont la quantité a été changée à la main n'est jamais écrasée : elle est signalée.
export function planSync(manuel, lignes) {
  const parCle = new Map(lignes.map((l) => [l.cle, l])), vues = new Set(), maj = [], ecarts = [], retirer = [];
  for (const m of manuel) {
    if (!m.metre) continue;
    const l = parCle.get(m.metre), modifiee = N(m.metreQty) && m.qty !== m.metreQty;
    if (l) vues.add(l.cle);
    if (!l) { if (modifiee) ecarts.push({ id: m.id, nom: m.nom, qty: m.qty, metre: null }); else retirer.push(m.id); continue; }
    if (modifiee) { if (m.qty !== l.qty) ecarts.push({ id: m.id, nom: m.nom, qty: m.qty, metre: l.qty, unite: l.unite }); continue; }
    if (m.qty !== l.qty || m.detail !== l.detail) maj.push({ id: m.id, qty: l.qty, detail: l.detail });
  }
  return { maj, ecarts, retirer, ajouter: lignes.filter((l) => !vues.has(l.cle)) };
}

// ---------- Mémoire de l'entreprise ----------
// 1. Valeurs de PRATIQUE (pertes, dosages, rendements, façon de facturer) : gardées par type d'ouvrage, proposées au
//    prochain ouvrage du même type, mais « à confirmer » : tant que l'artisan n'a pas confirmé, rien n'entre dans le devis.
export function memoDe(type, v) { const o = {}; for (const c of type.champs) if (c.memo && v[c.k] !== undefined && v[c.k] !== null && v[c.k] !== "") o[c.k] = v[c.k]; return o; }
export function nouvelOuvrage(type, memo = {}, id) {
  const v = {}; for (const c of type.champs) if (c.memo && memo[c.k] !== undefined && memo[c.k] !== null && memo[c.k] !== "") v[c.k] = memo[c.k];
  const repris = Object.keys(v).filter((k) => k !== "moMode" || v[k]);
  return { id, type: type.id, v, ...(repris.length ? { repris } : {}) };
}
// 2. Valeurs attachées à un PRODUIT nommé (format d'un carreau, dimensions d'un bloc, longueur d'une barre, couverture d'un pot) :
//    gardées sous le nom du produit, reprises seulement quand ce même nom est saisi. Un autre nom → champs vides.
export const liensDe = (type) => type.liens || [];
export function ficheProduit(type, lien, v) { const o = {}; for (const k of lien.champs) if (v[k] !== undefined && v[k] !== null && v[k] !== "") o[k] = v[k]; return o; }
// Applique le changement de nom d'un produit : retire les valeurs de l'ancien produit, pose celles du nouveau s'il est connu.
// fiches : { [nom à plat]: { champ: valeur } }. Renvoie true si des valeurs ont été reprises.
export function changerProduit(type, lien, v, fiches = {}) {
  const f = fiches[plat(v[lien.nom])] || null;
  for (const k of lien.champs) { if (f && f[k] !== undefined) v[k] = f[k]; else delete v[k]; }
  return !!f;
}

// Texte du métré pour le devis imprimé : une ligne par mesure, avec sa formule.
export function annexe(metre, metier) {
  return calculer(metre, metier).zones.filter((z) => z.ouvrages.some((o) => o.mesures.length)).map((z) => ({
    zone: z.nom, lignes: z.ouvrages.flatMap((o) => o.mesures.filter((m) => !/par m²$/.test(m.unite)).map((m) => ({ ouvrage: o.titre, mesure: m.nom, detail: m.detail, val: m.val, unite: m.unite }))),
  }));
}
export const METIERS_METRE = [...new Set(TYPES.map((t) => t.metier))];
