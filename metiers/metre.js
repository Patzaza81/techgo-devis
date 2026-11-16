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
// Ouvertures à déduire : [{ n, l, h }] en mètres.
function ouvertures(liste) {
  const ok = [], manque = [];
  for (const o of liste || []) {
    if (!pos(o.l) && !pos(o.h) && !pos(o.n)) continue; // ligne vide : ignorée
    if (!pos(o.l) || !pos(o.h)) { manque.push("la largeur et la hauteur de chaque ouverture"); continue; }
    ok.push({ n: pos(o.n) ? o.n : 1, l: o.l, h: o.h });
  }
  const S = ok.reduce((s, o) => s + o.n * o.l * o.h, 0);
  const detail = ok.map((o) => `${o.n > 1 ? fr(o.n) + " × " : ""}${fr(o.l)} × ${fr(o.h)}`).join(" + ");
  return { S, detail, manque: [...new Set(manque)], largeurs: ok.reduce((s, o) => s + o.n * o.l, 0) };
}
// Pertes : vide = 0 %. Renvoie le coefficient et le texte de la formule.
function pertes(p, manque) {
  if (p === null || p === undefined || p === "") return { k: 1, t: "" };
  if (!N(p) || p < 0 || p > 100) { manque.push("un pourcentage de pertes entre 0 et 100"); return { k: 1, t: "" }; }
  return { k: 1 + p / 100, t: p > 0 ? ` + ${fr(p)} % de pertes` : "" };
}
const besoin = (tab, nom, unite, arr, brut, detail, manque = []) => ({ tab, nom, unite, arr, brut: manque.length ? null : brut, detail, manque });

// Produit vendu avec une couverture par unité (pot, seau, carton) : S × couches × pertes ÷ couverture.
function parCouverture(nom, unite, S, couches, couv, p) {
  const m = []; const pe = pertes(p, m);
  if (!pos(couv)) m.push(`la surface couverte par ${plat(unite) || "unité"} de « ${nom} »`);
  if (!(pos(couches) && Number.isInteger(couches))) m.push(`le nombre de couches de « ${nom} »`);
  const brut = m.length ? null : (S * couches * pe.k) / couv;
  return besoin("produits", nom, unite, "sup", brut, m.length ? "" : `${fr(S)} m²${couches > 1 ? ` × ${couches} couches` : ""}${pe.t} = ${fr(S * couches * pe.k)} m² à couvrir ÷ ${fr(couv)} m² par ${plat(unite)} = ${fr(brut)}`, m);
}
// Produit vendu au poids avec une consommation au m² (colle, joint) : S × kg/m² × pertes ÷ poids du sac.
function parConso(nom, S, conso, sacKg, p, quoi) {
  const m = []; const pe = pertes(p, m);
  if (!pos(conso)) m.push(`la consommation de ${quoi} (kg par m²)`);
  if (!pos(sacKg)) m.push(`le poids d'un sac de ${quoi} (kg)`);
  const brut = m.length ? null : (S * conso * pe.k) / sacKg;
  return besoin("produits", nom, "Sac", "sup", brut, m.length ? "" : `${fr(S)} m² × ${fr(conso)} kg par m²${pe.t} = ${fr(S * conso * pe.k)} kg ÷ ${fr(sacKg)} kg par sac = ${fr(brut)}`, m);
}
// Liants et granulats d'un volume de béton ou de mortier. Les dosages sont ceux de l'entreprise.
function melange(V, v, { quoi, gravier }) {
  const out = [], vt = `${fr(V, 3)} m³ de ${quoi}`;
  { const m = []; if (!pos(v.ciment)) m.push(`le ciment par m³ de ${quoi} (kg)`); if (!pos(v.sac)) m.push("le poids d'un sac de ciment (kg)");
    const brut = m.length ? null : (V * v.ciment) / v.sac;
    out.push(besoin("produits", "Ciment", "Sac", "sup", brut, m.length ? "" : `${vt} × ${fr(v.ciment)} kg par m³ = ${fr(V * v.ciment)} kg ÷ ${fr(v.sac)} kg par sac = ${fr(brut)}`, m)); }
  { const m = []; if (!pos(v.sable)) m.push(`le sable par m³ de ${quoi} (m³)`);
    out.push(besoin("produits", "Sable", "m³", "dec", m.length ? null : V * v.sable, m.length ? "" : `${vt} × ${fr(v.sable, 3)} m³ de sable par m³ = ${fr(V * v.sable)}`, m)); }
  if (gravier === "requis" || (gravier === "option" && pos(v.gravier))) {
    const m = []; if (!pos(v.gravier)) m.push(`le gravier par m³ de ${quoi} (m³)`);
    out.push(besoin("produits", "Gravier", "m³", "dec", m.length ? null : V * v.gravier, m.length ? "" : `${vt} × ${fr(v.gravier, 3)} m³ de gravier par m³ = ${fr(V * v.gravier)}`, m));
  }
  return out;
}
// Main-d'œuvre d'un ouvrage : à la tâche (au m², ml, m³, point) ou à la journée (rendement de l'équipe saisi).
function mainOeuvre(v, Q, unite, defNom) {
  if (!v.moMode) return [];
  const nom = txt(v.moNom, defNom);
  if (v.moMode === "tache") return [besoin("ouvriers", nom, unite, "dec", Q, `Payé à la tâche : ${fr(Q)} ${unite}`)];
  const m = [];
  if (!pos(v.moRend)) m.push(`ce que l'équipe fait par jour (${unite})`);
  if (!(pos(v.moOuv) && Number.isInteger(v.moOuv))) m.push("le nombre d'ouvriers de l'équipe");
  const jours = m.length ? null : Q / v.moRend;
  return [{ ...besoin("ouvriers", nom + " (à la journée)", "jour", "demi", m.length ? null : jours * v.moOuv, m.length ? "" : `${fr(Q)} ${unite} ÷ ${fr(v.moRend)} ${unite} par jour = ${fr(jours)} jour${jours >= 2 ? "s" : ""} d'équipe × ${v.moOuv} ouvrier${v.moOuv > 1 ? "s" : ""} = ${fr(jours * v.moOuv)}`, m), jours }];
}
const articles = (liste, tab = "produits") => (liste || []).filter((a) => String(a.nom || "").trim() || pos(a.n)).map((a) => {
  const m = []; if (!String(a.nom || "").trim()) m.push("le nom d'un article"); if (!pos(a.n)) m.push(`la quantité de « ${txt(a.nom, "article")} »`);
  return besoin(tab, txt(a.nom, "Article"), txt(a.u, "Pièce"), "sup", a.n, m.length ? "" : `Compté sur place : ${fr(a.n)}`, m);
});
const totalArticles = (liste) => (liste || []).reduce((s, a) => s + (pos(a.n) ? a.n : 0), 0);

// ---------- Champs communs ----------
const MO = (unite, defNom) => [
  { k: "moMode", t: "choix", l: "Main-d'œuvre de cet ouvrage", opt: [["", "Pas ici"], ["tache", `À la tâche (${unite})`], ["jour", "À la journée"]], memo: true },
  { k: "moNom", t: "txt", l: "Nom de la prestation", ph: defNom, si: (v) => !!v.moMode },
  { k: "moRend", t: "n", l: `Ce que ton équipe fait par jour (${unite})`, memo: true, si: (v) => v.moMode === "jour", aide: "Ton rendement à toi, sur tes chantiers. L'application n'en propose pas." },
  { k: "moOuv", t: "n", l: "Nombre d'ouvriers de l'équipe", memo: true, si: (v) => v.moMode === "jour" },
];
const OUV = { k: "ouv", t: "ouv", l: "Portes et fenêtres à déduire" };
const PERTE = (l = "Pertes et coupes (%)") => ({ k: "perte", t: "n", l, memo: true, aide: "Laisse vide si tu n'en comptes pas." });
const DOSAGE = (quoi, gravier) => [
  { k: "ciment", t: "n", l: `Ciment par m³ de ${quoi} (kg)`, memo: true, aide: "Ton dosage, ou celui du plan. L'application n'en propose pas." },
  { k: "sac", t: "n", l: "Poids d'un sac de ciment (kg)", memo: true },
  { k: "sable", t: "n", l: `Sable par m³ de ${quoi} (m³)`, memo: true },
  ...(gravier ? [{ k: "gravier", t: "n", l: `Gravier par m³ de ${quoi} (m³)${gravier === "option" ? " — vide si sans gravier" : ""}`, memo: true }] : []),
];

// Surface d'une paroi rectangulaire moins ses ouvertures.
function paroi(v, { lk = "longueur", hk = "hauteur", ln = "la longueur", hn = "la hauteur" } = {}) {
  const manque = [], alertes = [];
  if (!pos(v[lk])) manque.push(ln); if (!pos(v[hk])) manque.push(hn);
  const nb = pos(v.nombre) ? v.nombre : 1, faces = pos(v.faces) ? v.faces : 1;
  const o = ouvertures(v.ouv); manque.push(...o.manque);
  if (manque.length) return { manque, alertes };
  const brute = v[lk] * v[hk] * nb * faces, S = brute - o.S * faces * nb;
  if (S <= 0) { alertes.push("Les ouvertures sont aussi grandes que la surface : vérifie les dimensions."); return { manque: ["une surface positive (ouvertures trop grandes)"], alertes }; }
  const detail = `${nb > 1 ? fr(nb) + " × " : ""}${fr(v[lk])} × ${fr(v[hk])}${faces > 1 ? ` × ${fr(faces)} faces` : ""} = ${fr(brute)} m²${o.S ? ` − ${fr(o.S * faces * nb)} m² d'ouvertures (${o.detail}) = ${fr(S)} m²` : ""}`;
  return { S, detail, manque, alertes, o };
}

// ---------- Types d'ouvrage ----------
export const TYPES = [
  // ===== PEINTURE =====
  { id: "p_piece", metier: "peinture", nom: "Pièce : murs et plafond",
    champs: [
      { k: "longueur", t: "n", l: "Longueur de la pièce (m)" }, { k: "largeur", t: "n", l: "Largeur de la pièce (m)" }, { k: "hauteur", t: "n", l: "Hauteur des murs (m)" },
      OUV, { k: "plafond", t: "bool", l: "Peindre aussi le plafond avec les mêmes produits" },
      { k: "prod", t: "prod", l: "Produits à appliquer" }, PERTE("Pertes de produit (%)"), ...MO("m²", "Travaux de peinture"),
    ],
    calc(v) {
      const manque = [], alertes = [], mesures = [];
      if (!pos(v.longueur)) manque.push("la longueur"); if (!pos(v.largeur)) manque.push("la largeur"); if (!pos(v.hauteur)) manque.push("la hauteur");
      const o = ouvertures(v.ouv); manque.push(...o.manque);
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
      { k: "longueur", t: "n", l: "Longueur (m)" }, { k: "hauteur", t: "n", l: "Hauteur ou largeur (m)" },
      { k: "nombre", t: "n", l: "Nombre de surfaces identiques", ph: "1" }, { k: "faces", t: "n", l: "Faces à peindre (1 ou 2)", ph: "1" },
      OUV, { k: "prod", t: "prod", l: "Produits à appliquer" }, PERTE("Pertes de produit (%)"), ...MO("m²", "Travaux de peinture"),
    ],
    calc(v) {
      const p = paroi(v); if (p.manque.length) return { ...p, mesures: [], besoins: [] };
      return { manque: [], alertes: p.alertes, mesures: [{ nom: "Surface à peindre", val: p.S, unite: "m²", detail: p.detail }], besoins: [...produitsPeinture(v, p.S), ...mainOeuvre(v, p.S, "m²", "Travaux de peinture")], base: p.S };
    } },
  { id: "p_libre", metier: "peinture", nom: "Surface déjà mesurée",
    champs: [{ k: "surface", t: "n", l: "Surface à peindre (m²)" }, { k: "prod", t: "prod", l: "Produits à appliquer" }, PERTE("Pertes de produit (%)"), ...MO("m²", "Travaux de peinture")],
    calc(v) {
      if (!pos(v.surface)) return { manque: ["la surface"], alertes: [], mesures: [], besoins: [] };
      return { manque: [], alertes: [], mesures: [{ nom: "Surface à peindre", val: v.surface, unite: "m²", detail: `Mesurée sur place : ${fr(v.surface)} m²` }], besoins: [...produitsPeinture(v, v.surface), ...mainOeuvre(v, v.surface, "m²", "Travaux de peinture")], base: v.surface };
    } },

  // ===== CARRELAGE =====
  { id: "c_sol", metier: "carrelage", nom: "Sol d'une pièce",
    champs: [
      { k: "longueur", t: "n", l: "Longueur de la pièce (m)" }, { k: "largeur", t: "n", l: "Largeur de la pièce (m)" },
      { k: "deduire", t: "n", l: "Surface à ne pas carreler (m²)", aide: "Baignoire, placard maçonné… Laisse vide s'il n'y en a pas." },
      ...champsCarreaux(),
      { k: "plinthes", t: "bool", l: "Poser des plinthes" },
      { k: "portes", t: "n", l: "Largeur totale des portes, sans plinthe (m)", si: (v) => v.plinthes },
      { k: "plinthe", t: "n", l: "Longueur d'une plinthe (cm)", memo: true, si: (v) => v.plinthes },
      ...MO("m²", "Pose de carrelage"),
    ],
    calc(v) {
      const manque = [], alertes = [], mesures = [];
      if (!pos(v.longueur)) manque.push("la longueur"); if (!pos(v.largeur)) manque.push("la largeur");
      if (manque.length) return { manque, alertes, mesures, besoins: [] };
      const brute = v.longueur * v.largeur, ded = pos(v.deduire) ? v.deduire : 0, S = brute - ded;
      if (S <= 0) return { manque: ["une surface positive (surface à déduire trop grande)"], alertes: ["La surface à déduire est aussi grande que la pièce."], mesures, besoins: [] };
      mesures.push({ nom: "Surface à carreler", val: S, unite: "m²", detail: `${fr(v.longueur)} × ${fr(v.largeur)} = ${fr(brute)} m²${ded ? ` − ${fr(ded)} m² = ${fr(S)} m²` : ""}` });
      const besoins = [...besoinsCarreaux(v, S)];
      if (v.plinthes) {
        const per = 2 * (v.longueur + v.largeur), po = pos(v.portes) ? v.portes : 0, ml = per - po, m = [];
        if (ml <= 0) alertes.push("La largeur des portes dépasse le tour de la pièce.");
        else {
          mesures.push({ nom: "Plinthes", val: ml, unite: "ml", detail: `2 × (${fr(v.longueur)} + ${fr(v.largeur)}) = ${fr(per)} ml${po ? ` − ${fr(po)} ml de portes = ${fr(ml)} ml` : ""}` });
          const pe = pertes(v.perte, []); if (!pos(v.plinthe)) m.push("la longueur d'une plinthe (cm)");
          besoins.push(besoin("produits", "Plinthes", "Pièce", "sup", m.length ? null : (ml * pe.k) / (v.plinthe / 100), m.length ? "" : `${fr(ml)} ml${pe.t} = ${fr(ml * pe.k)} ml ÷ ${fr(v.plinthe / 100)} m par plinthe = ${fr((ml * pe.k) / (v.plinthe / 100))}`, m));
        }
      }
      return { manque, alertes: [...alertes, ...alertesCarreaux(v)], mesures, besoins: [...besoins, ...mainOeuvre(v, S, "m²", "Pose de carrelage")], base: S };
    } },
  { id: "c_mur", metier: "carrelage", nom: "Mur (faïence)",
    champs: [{ k: "longueur", t: "n", l: "Longueur de mur à carreler (m)" }, { k: "hauteur", t: "n", l: "Hauteur de pose (m)" }, OUV, ...champsCarreaux(), ...MO("m²", "Pose de faïence")],
    calc(v) {
      const p = paroi(v, { hn: "la hauteur de pose" }); if (p.manque.length) return { ...p, mesures: [], besoins: [] };
      return { manque: [], alertes: [...p.alertes, ...alertesCarreaux(v)], mesures: [{ nom: "Surface à carreler", val: p.S, unite: "m²", detail: p.detail }], besoins: [...besoinsCarreaux(v, p.S), ...mainOeuvre(v, p.S, "m²", "Pose de faïence")], base: p.S };
    } },
  { id: "c_libre", metier: "carrelage", nom: "Surface déjà mesurée",
    champs: [{ k: "surface", t: "n", l: "Surface à carreler (m²)" }, ...champsCarreaux(), ...MO("m²", "Pose de carrelage")],
    calc(v) {
      if (!pos(v.surface)) return { manque: ["la surface"], alertes: [], mesures: [], besoins: [] };
      return { manque: [], alertes: alertesCarreaux(v), mesures: [{ nom: "Surface à carreler", val: v.surface, unite: "m²", detail: `Mesurée sur place : ${fr(v.surface)} m²` }], besoins: [...besoinsCarreaux(v, v.surface), ...mainOeuvre(v, v.surface, "m²", "Pose de carrelage")], base: v.surface };
    } },

  // ===== MAÇONNERIE =====
  { id: "m_mur", metier: "maconnerie", nom: "Mur en blocs",
    note: "Le mortier calculé est le volume des joints seulement (géométrie). Le remplissage des alvéoles, les chutes et le gâchage perdu se comptent dans les pertes de mortier.",
    champs: [
      { k: "longueur", t: "n", l: "Longueur du mur (m)" }, { k: "hauteur", t: "n", l: "Hauteur du mur (m)" }, OUV,
      { k: "blocNom", t: "txt", l: "Nom du bloc", ph: "Ex. : Parpaing de 15", memo: true },
      { k: "blocL", t: "n", l: "Longueur d'un bloc (cm)", memo: true }, { k: "blocH", t: "n", l: "Hauteur d'un bloc (cm)", memo: true }, { k: "blocE", t: "n", l: "Épaisseur d'un bloc (cm)", memo: true },
      { k: "joint", t: "n", l: "Épaisseur des joints (cm)", memo: true }, PERTE("Casse et coupes de blocs (%)"),
      ...DOSAGE("mortier", false), { k: "perteM", t: "n", l: "Pertes de mortier (%)", memo: true, aide: "Alvéoles, chutes, gâchage perdu. Laisse vide si tu n'en comptes pas." },
      ...MO("m²", "Élévation de mur"),
    ],
    calc(v) {
      const p = paroi(v); if (p.manque.length) return { ...p, mesures: [], besoins: [] };
      const S = p.S, alertes = [...p.alertes], besoins = [], mesures = [{ nom: "Surface de mur", val: S, unite: "m²", detail: p.detail }];
      const nomBloc = txt(v.blocNom, "Blocs"), m = [];
      if (!pos(v.blocL)) m.push("la longueur d'un bloc (cm)"); if (!pos(v.blocH)) m.push("la hauteur d'un bloc (cm)"); if (!N(v.joint) || v.joint < 0) m.push("l'épaisseur des joints (cm)");
      const pe = pertes(v.perte, m);
      let parM2 = null;
      if (!m.length) {
        parM2 = 1 / (((v.blocL + v.joint) / 100) * ((v.blocH + v.joint) / 100));
        if (v.joint >= v.blocH) alertes.push("Le joint est plus épais que le bloc : vérifie que tout est en centimètres.");
        mesures.push({ nom: "Blocs par m²", val: parM2, unite: "par m²", detail: `1 m² ÷ ((${fr(v.blocL)} + ${fr(v.joint)}) cm × (${fr(v.blocH)} + ${fr(v.joint)}) cm) = ${fr(parM2)} blocs par m²` });
      }
      besoins.push(besoin("produits", nomBloc, "Pièce", "sup", m.length ? null : S * parM2 * pe.k, m.length ? "" : `${fr(S)} m² × ${fr(parM2)} blocs par m²${pe.t} = ${fr(S * parM2 * pe.k)}`, m));
      if (pos(v.ciment) || pos(v.sable) || pos(v.sac)) {
        const mm = []; if (m.length) mm.push("les dimensions du bloc et du joint"); if (!pos(v.blocE)) mm.push("l'épaisseur d'un bloc (cm)");
        const pm = pertes(v.perteM, mm);
        if (mm.length) besoins.push(besoin("produits", "Ciment", "Sac", "sup", null, "", mm));
        else {
          const plein = (v.blocL * v.blocH) / ((v.blocL + v.joint) * (v.blocH + v.joint)), Vj = S * (v.blocE / 100) * (1 - plein), V = Vj * pm.k;
          mesures.push({ nom: "Mortier des joints", val: V, unite: "m³", detail: `${fr(S)} m² × ${fr(v.blocE / 100)} m d'épaisseur × part des joints ${fr((1 - plein) * 100, 1)} % = ${fr(Vj, 3)} m³${pm.t}${pm.k > 1 ? ` = ${fr(V, 3)} m³` : ""}` });
          besoins.push(...melange(V, v, { quoi: "mortier" }));
        }
      }
      return { manque: [], alertes, mesures, besoins: [...besoins, ...mainOeuvre(v, S, "m²", "Élévation de mur")], base: S };
    } },
  { id: "m_beton", metier: "maconnerie", nom: "Béton : semelle, poteau, poutre, chaînage, dalle",
    note: "Le dosage est celui que tu saisis (le tien ou celui du plan). Les armatures et le coffrage ne sont pas calculés ici : ils viennent des plans.",
    champs: [
      { k: "nom", t: "txt", l: "Nom de l'élément", ph: "Ex. : Poteaux du rez-de-chaussée" }, { k: "nombre", t: "n", l: "Nombre d'éléments identiques", ph: "1" },
      { k: "longueur", t: "n", l: "Longueur ou hauteur d'un élément (m)" }, { k: "largeur", t: "n", l: "Largeur (cm)" }, { k: "epaisseur", t: "n", l: "Épaisseur ou hauteur de section (cm)" },
      PERTE("Pertes de béton (%)"), ...DOSAGE("béton", "requis"), ...MO("m³", "Coulage de béton"),
    ],
    calc(v) { return volume(v, { quoi: "béton", gravier: "requis", mo: "Coulage de béton", lk: "largeur", ln: "la largeur (cm)", lcm: true }); } },
  { id: "m_chape", metier: "maconnerie", nom: "Chape ou dallage",
    champs: [
      { k: "nombre", t: "n", l: "Nombre de surfaces identiques", ph: "1" }, { k: "longueur", t: "n", l: "Longueur (m)" }, { k: "largeur", t: "n", l: "Largeur (m)" }, { k: "epaisseur", t: "n", l: "Épaisseur (cm)" },
      PERTE("Pertes (%)"), ...DOSAGE("mortier ou béton", "option"), ...MO("m²", "Réalisation de chape"),
    ],
    calc(v) { return volume(v, { quoi: "mortier ou béton", gravier: "option", mo: "Réalisation de chape", lk: "largeur", ln: "la largeur", moSurface: true }); } },
  { id: "m_enduit", metier: "maconnerie", nom: "Enduit",
    champs: [
      { k: "longueur", t: "n", l: "Longueur du mur (m)" }, { k: "hauteur", t: "n", l: "Hauteur du mur (m)" }, { k: "faces", t: "n", l: "Faces à enduire (1 ou 2)", ph: "1" }, OUV,
      { k: "epaisseur", t: "n", l: "Épaisseur de l'enduit (cm)", memo: true }, PERTE("Pertes d'enduit (%)"), ...DOSAGE("mortier", false), ...MO("m²", "Enduit"),
    ],
    calc(v) {
      const p = paroi(v); if (p.manque.length) return { ...p, mesures: [], besoins: [] };
      const mesures = [{ nom: "Surface à enduire", val: p.S, unite: "m²", detail: p.detail }], m = [];
      if (!pos(v.epaisseur)) m.push("l'épaisseur de l'enduit (cm)"); const pe = pertes(v.perte, m);
      let besoins;
      if (m.length) besoins = [besoin("produits", "Ciment", "Sac", "sup", null, "", m)];
      else { const V = p.S * (v.epaisseur / 100) * pe.k; mesures.push({ nom: "Volume d'enduit", val: V, unite: "m³", detail: `${fr(p.S)} m² × ${fr(v.epaisseur / 100, 3)} m${pe.t} = ${fr(V, 3)} m³` }); besoins = melange(V, v, { quoi: "mortier" }); }
      return { manque: [], alertes: p.alertes, mesures, besoins: [...besoins, ...mainOeuvre(v, p.S, "m²", "Enduit")], base: p.S };
    } },
  { id: "m_fouille", metier: "maconnerie", nom: "Fouille ou terrassement",
    champs: [{ k: "nombre", t: "n", l: "Nombre de fouilles identiques", ph: "1" }, { k: "longueur", t: "n", l: "Longueur (m)" }, { k: "largeur", t: "n", l: "Largeur (m)" }, { k: "profondeur", t: "n", l: "Profondeur (m)" }, ...MO("m³", "Fouilles")],
    calc(v) {
      const manque = []; if (!pos(v.longueur)) manque.push("la longueur"); if (!pos(v.largeur)) manque.push("la largeur"); if (!pos(v.profondeur)) manque.push("la profondeur");
      if (manque.length) return { manque, alertes: [], mesures: [], besoins: [] };
      const nb = pos(v.nombre) ? v.nombre : 1, V = nb * v.longueur * v.largeur * v.profondeur;
      return { manque, alertes: [], mesures: [{ nom: "Volume de terre en place", val: V, unite: "m³", detail: `${nb > 1 ? fr(nb) + " × " : ""}${fr(v.longueur)} × ${fr(v.largeur)} × ${fr(v.profondeur)} = ${fr(V)} m³ (terre en place, sans foisonnement)` }], besoins: mainOeuvre(v, V, "m³", "Fouilles"), base: V };
    } },
  { id: "m_acier", metier: "maconnerie", nom: "Armatures (d'après le plan)",
    note: "Nombre de barres, diamètres, espacement des cadres et recouvrements se lisent sur le plan de ferraillage : l'application ne les choisit pas. Elle compte seulement les barres à acheter.",
    champs: [
      { k: "nom", t: "txt", l: "Élément armé", ph: "Ex. : Poteaux" }, { k: "nombre", t: "n", l: "Nombre d'éléments identiques", ph: "1" }, { k: "longueur", t: "n", l: "Longueur d'un élément (m)" },
      { k: "filNom", t: "txt", l: "Barres filantes : désignation", ph: "Ex. : Fer de 12" }, { k: "filN", t: "n", l: "Nombre de barres filantes par élément" }, { k: "filRec", t: "n", l: "Longueur ajoutée par barre : ancrages, recouvrements (m)" },
      { k: "cadNom", t: "txt", l: "Cadres : désignation", ph: "Ex. : Fer de 6" }, { k: "cadEsp", t: "n", l: "Espacement des cadres (cm)" }, { k: "cadDev", t: "n", l: "Longueur de fer d'un cadre, crochets compris (cm)" },
      { k: "barre", t: "n", l: "Longueur d'une barre du commerce (m)", memo: true }, PERTE("Chutes (%)"), ...MO("ml", "Ferraillage"),
    ],
    calc(v) {
      const manque = []; if (!pos(v.longueur)) manque.push("la longueur d'un élément");
      if (manque.length) return { manque, alertes: [], mesures: [], besoins: [] };
      const nb = pos(v.nombre) ? v.nombre : 1, besoins = [], mesures = [], pm = [], pe = pertes(v.perte, pm), sansBarre = pos(v.barre) ? [] : ["la longueur d'une barre du commerce (m)"];
      if (pos(v.filN)) {
        const rec = pos(v.filRec) ? v.filRec : 0, ml = nb * v.filN * (v.longueur + rec), m = [...pm, ...sansBarre];
        mesures.push({ nom: "Barres filantes", val: ml, unite: "ml", detail: `${nb > 1 ? fr(nb) + " éléments × " : ""}${fr(v.filN)} barres × (${fr(v.longueur)}${rec ? " + " + fr(rec) : ""}) m = ${fr(ml)} ml` });
        besoins.push(besoin("produits", txt(v.filNom, "Fer à béton (filants)"), "Barre", "sup", m.length ? null : (ml * pe.k) / v.barre, m.length ? "" : `${fr(ml)} ml${pe.t} ÷ ${fr(v.barre)} m par barre = ${fr((ml * pe.k) / v.barre)}`, m));
      }
      if (pos(v.cadEsp) || pos(v.cadDev)) {
        const m = [...pm, ...sansBarre]; if (!pos(v.cadEsp)) m.push("l'espacement des cadres (cm)"); if (!pos(v.cadDev)) m.push("la longueur de fer d'un cadre (cm)");
        if (pos(v.cadEsp) && pos(v.cadDev)) {
          const parEl = Math.ceil(net(v.longueur / (v.cadEsp / 100))) + 1, ml = nb * parEl * (v.cadDev / 100);
          mesures.push({ nom: "Cadres", val: nb * parEl, unite: "cadres", detail: `${fr(v.longueur)} m ÷ ${fr(v.cadEsp)} cm = ${fr(v.longueur / (v.cadEsp / 100))} → ${parEl - 1} intervalles + 1 = ${parEl} cadres${nb > 1 ? ` × ${fr(nb)} éléments = ${fr(nb * parEl)}` : ""} ; × ${fr(v.cadDev)} cm = ${fr(ml)} ml de fer` });
          besoins.push(besoin("produits", txt(v.cadNom, "Fer à béton (cadres)"), "Barre", "sup", m.length ? null : (ml * pe.k) / v.barre, m.length ? "" : `${fr(ml)} ml${pe.t} ÷ ${fr(v.barre)} m par barre = ${fr((ml * pe.k) / v.barre)}`, m));
        } else besoins.push(besoin("produits", txt(v.cadNom, "Fer à béton (cadres)"), "Barre", "sup", null, "", m));
      }
      if (!besoins.length) return { manque: ["le nombre de barres filantes ou les cadres (lus sur le plan)"], alertes: [], mesures, besoins };
      return { manque, alertes: [], mesures, besoins: [...besoins, ...mainOeuvre(v, nb * v.longueur, "ml", "Ferraillage")], base: nb * v.longueur };
    } },

  // ===== PLOMBERIE =====
  { id: "pl_reseau", metier: "plomberie", nom: "Réseau de tuyaux",
    note: "Le diamètre et le type de tuyau ne sont pas calculés : tu les choisis d'après les appareils à alimenter ou à évacuer. Un réseau par diamètre.",
    champs: [
      { k: "tuyau", t: "txt", l: "Tuyau (type et diamètre)", ph: "Ex. : Tube PVC évacuation Ø100" }, { k: "longueur", t: "n", l: "Longueur mesurée du tracé (m)" },
      PERTE("Chutes de coupe (%)"), { k: "vente", t: "choix", l: "Le tuyau s'achète", opt: [["Barre", "À la barre"], ["Couronne", "À la couronne"], ["Mètre", "Au mètre"]], memo: true },
      { k: "barre", t: "n", l: "Longueur d'une barre ou d'une couronne (m)", memo: true, si: (v) => (v.vente || "Barre") !== "Mètre" },
      { k: "art", t: "art", l: "Raccords comptés sur le tracé (coudes, tés, manchons, vannes…)", u: "Pièce", sugg: ["Coude", "Té", "Manchon", "Réduction", "Vanne d'arrêt", "Bouchon"] },
      { k: "colEsp", t: "n", l: "Un collier tous les (cm) — vide si pas de colliers", memo: true },
      ...MO("ml", "Pose de tuyauterie"),
    ],
    calc(v) {
      const manque = []; if (!pos(v.longueur)) manque.push("la longueur du tracé"); if (!String(v.tuyau || "").trim()) manque.push("le type et le diamètre du tuyau");
      if (manque.length) return { manque, alertes: [], mesures: [], besoins: [] };
      const m = [], pe = pertes(v.perte, m), L = v.longueur * pe.k, vente = v.vente || "Barre", besoins = [];
      const mesures = [{ nom: "Tuyau", val: L, unite: "ml", detail: `${fr(v.longueur)} ml mesurés${pe.t}${pe.k > 1 ? ` = ${fr(L)} ml` : ""}` }];
      if (vente === "Mètre") besoins.push(besoin("produits", v.tuyau.trim(), "Mètre", "sup", m.length ? null : L, `${fr(v.longueur)} ml${pe.t} = ${fr(L)}`, m));
      else { if (!pos(v.barre)) m.push(`la longueur d'une ${plat(vente)} (m)`); besoins.push(besoin("produits", v.tuyau.trim(), vente, "sup", m.length ? null : L / v.barre, m.length ? "" : `${fr(v.longueur)} ml${pe.t} = ${fr(L)} ml ÷ ${fr(v.barre)} m par ${plat(vente)} = ${fr(L / v.barre)}`, m)); }
      besoins.push(...articles(v.art));
      if (pos(v.colEsp)) { const n = Math.ceil(net(v.longueur / (v.colEsp / 100))) + 1; besoins.push(besoin("produits", `Colliers pour ${v.tuyau.trim()}`, "Pièce", "sup", n, `${fr(v.longueur)} ml ÷ ${fr(v.colEsp)} cm = ${fr(v.longueur / (v.colEsp / 100))} → ${n - 1} intervalles + 1 = ${n}`)); }
      const alertes = totalArticles(v.art) ? [] : ["Aucun raccord compté sur ce réseau : coudes, tés, manchons et vannes se chiffrent à part."];
      return { manque, alertes, mesures, besoins: [...besoins, ...mainOeuvre(v, v.longueur, "ml", "Pose de tuyauterie")], base: v.longueur };
    } },
  { id: "pl_appareils", metier: "plomberie", nom: "Appareils et points d'eau",
    champs: [{ k: "art", t: "art", l: "Appareils à poser", u: "Pièce", sugg: ["WC", "Lavabo", "Douche", "Évier", "Chauffe-eau", "Robinet de puisage"] }, { k: "acc", t: "art", l: "Accessoires de raccordement", u: "Pièce", sugg: ["Flexible", "Robinet d'arrêt", "Siphon", "Fixations"] }, ...MO("point", "Pose des appareils")],
    calc(v) {
      const pts = totalArticles(v.art);
      if (!pts) return { manque: ["au moins un appareil avec sa quantité"], alertes: [], mesures: [], besoins: [] };
      const alertes = totalArticles(v.acc) ? [] : ["Aucun accessoire de raccordement compté : flexibles, robinets d'arrêt, siphons et fixations se chiffrent à part."];
      return { manque: [], alertes, mesures: [{ nom: "Points d'eau", val: pts, unite: "points", detail: `${(v.art || []).filter((a) => pos(a.n)).map((a) => `${fr(a.n)} ${txt(a.nom, "article")}`).join(" + ")} = ${fr(pts)} points` }], besoins: [...articles(v.art), ...articles(v.acc), ...mainOeuvre(v, pts, "point", "Pose des appareils")], base: pts };
    } },

  // ===== ÉLECTRICITÉ =====
  { id: "e_points", metier: "electricite", nom: "Points d'une pièce",
    champs: [{ k: "art", t: "art", l: "Points à poser", u: "Pièce", sugg: ["Prise 2P+T", "Interrupteur simple", "Va-et-vient", "Point lumineux", "Sortie de câble"] }, { k: "boites", t: "bool", l: "Compter une boîte d'encastrement par point" }, ...MO("point", "Pose des points électriques")],
    calc(v) {
      const pts = totalArticles(v.art);
      if (!pts) return { manque: ["au moins un point avec sa quantité"], alertes: [], mesures: [], besoins: [] };
      const besoins = articles(v.art);
      if (v.boites) besoins.push(besoin("produits", "Boîte d'encastrement", "Pièce", "sup", pts, `Une par point : ${fr(pts)}`));
      return { manque: [], alertes: [], mesures: [{ nom: "Points", val: pts, unite: "points", detail: `${(v.art || []).filter((a) => pos(a.n)).map((a) => `${fr(a.n)} ${txt(a.nom, "article")}`).join(" + ")} = ${fr(pts)} points` }], besoins: [...besoins, ...mainOeuvre(v, pts, "point", "Pose des points électriques")], base: pts };
    } },
  { id: "e_ligne", metier: "electricite", nom: "Ligne de câble et son conduit",
    note: "La section du câble et le calibre de sa protection ne sont pas calculés : ils relèvent d'un électricien qualifié. L'application compte seulement les longueurs.",
    champs: [
      { k: "cable", t: "txt", l: "Câble ou fil (type et section)", ph: "Ex. : Câble 3G2,5" }, { k: "nombre", t: "n", l: "Nombre de lignes identiques", ph: "1" },
      { k: "longueur", t: "n", l: "Longueur du tracé, du tableau au dernier point (m)" }, { k: "fils", t: "n", l: "Fils tirés séparément dans le conduit (1 pour un câble)", ph: "1" },
      { k: "reserve", t: "n", l: "Réserve à chaque raccordement (m)", memo: true }, { k: "racc", t: "n", l: "Nombre de raccordements sur la ligne", si: (v) => pos(v.reserve) },
      PERTE("Chutes (%)"), { k: "rouleau", t: "n", l: "Longueur d'un rouleau de câble (m)", memo: true },
      { k: "conduit", t: "txt", l: "Conduit ou gaine — vide s'il n'y en a pas", ph: "Ex. : Gaine ICTA Ø20" }, { k: "rouleauC", t: "n", l: "Longueur d'un rouleau ou d'une barre de conduit (m)", memo: true, si: (v) => !!String(v.conduit || "").trim() },
      ...MO("ml", "Tirage de câble"),
    ],
    calc(v) {
      const manque = []; if (!pos(v.longueur)) manque.push("la longueur du tracé"); if (!String(v.cable || "").trim()) manque.push("le type et la section du câble");
      if (pos(v.reserve) && !pos(v.racc)) manque.push("le nombre de raccordements");
      { const pm = []; pertes(v.perte, pm); manque.push(...pm); }
      if (manque.length) return { manque, alertes: [], mesures: [], besoins: [] };
      const nb = pos(v.nombre) ? v.nombre : 1, fils = pos(v.fils) ? v.fils : 1, res = pos(v.reserve) ? v.reserve * v.racc : 0, m = [], pe = pertes(v.perte, m);
      const parLigne = (v.longueur + res) * fils, L = nb * parLigne * pe.k, trace = nb * v.longueur;
      const mesures = [{ nom: "Câble", val: L, unite: "ml", detail: `${nb > 1 ? fr(nb) + " lignes × " : ""}(${fr(v.longueur)} m de tracé${res ? ` + ${fr(v.racc)} raccordements × ${fr(v.reserve)} m` : ""})${fils > 1 ? ` × ${fr(fils)} fils` : ""}${pe.t} = ${fr(L)} ml` }];
      if (!pos(v.rouleau)) m.push("la longueur d'un rouleau de câble (m)");
      const besoins = [besoin("produits", v.cable.trim(), "Rouleau", "sup", m.length ? null : L / v.rouleau, m.length ? "" : `${fr(L)} ml ÷ ${fr(v.rouleau)} m par rouleau = ${fr(L / v.rouleau)}`, m)];
      if (String(v.conduit || "").trim()) {
        const mc = []; if (!pos(v.rouleauC)) mc.push("la longueur d'un rouleau ou d'une barre de conduit (m)");
        mesures.push({ nom: "Conduit", val: trace * pe.k, unite: "ml", detail: `${nb > 1 ? fr(nb) + " × " : ""}${fr(v.longueur)} m de tracé${pe.t} = ${fr(trace * pe.k)} ml` });
        besoins.push(besoin("produits", v.conduit.trim(), "Rouleau", "sup", mc.length ? null : (trace * pe.k) / v.rouleauC, mc.length ? "" : `${fr(trace * pe.k)} ml ÷ ${fr(v.rouleauC)} m = ${fr((trace * pe.k) / v.rouleauC)}`, mc));
      }
      return { manque, alertes: [], mesures, besoins: [...besoins, ...mainOeuvre(v, trace, "ml", "Tirage de câble")], base: trace };
    } },
  { id: "e_tableau", metier: "electricite", nom: "Tableau et protections",
    note: "Le calibre des disjoncteurs, les différentiels et la mise à la terre se décident sur un schéma fait par un électricien qualifié. Ici, tu comptes ce que le schéma demande.",
    champs: [{ k: "art", t: "art", l: "Matériel du tableau (d'après le schéma)", u: "Pièce", sugg: ["Coffret", "Disjoncteur", "Interrupteur différentiel", "Peigne", "Bornier de terre", "Piquet de terre"] }, { k: "moMode", t: "choix", l: "Main-d'œuvre de cet ouvrage", opt: [["", "Pas ici"], ["tache", "Au forfait"]], memo: true }, { k: "moNom", t: "txt", l: "Nom de la prestation", ph: "Câblage du tableau", si: (v) => !!v.moMode }],
    calc(v) {
      const n = totalArticles(v.art);
      if (!n) return { manque: ["au moins un article avec sa quantité"], alertes: [], mesures: [], besoins: [] };
      return { manque: [], alertes: [], mesures: [], besoins: [...articles(v.art), ...mainOeuvre(v, 1, "forfait", "Câblage du tableau")], base: 1 };
    } },
];

function produitsPeinture(v, S) {
  const liste = (v.prod || []).filter((p) => String(p.nom || "").trim() || pos(p.couv));
  if (!liste.length) return [besoin("produits", "Peinture", "Pot", "sup", null, "", ["au moins un produit à appliquer"])];
  return liste.map((p) => { const b = parCouverture(txt(p.nom, "Peinture"), txt(p.u, "Pot"), S, pos(p.couches) ? p.couches : 1, p.couv, v.perte); return String(p.nom || "").trim() ? b : { ...b, brut: null, manque: ["le nom du produit", ...b.manque] }; });
}
function champsCarreaux() {
  return [
    { k: "carreau", t: "txt", l: "Nom du carreau", ph: "Ex. : Grès 60×60", memo: true },
    { k: "cA", t: "n", l: "Longueur d'un carreau (cm)", memo: true }, { k: "cB", t: "n", l: "Largeur d'un carreau (cm)", memo: true },
    { k: "parCarton", t: "n", l: "Nombre de carreaux par carton", memo: true, aide: "Écrit sur le carton." },
    PERTE("Casse et coupes (%)"),
    { k: "colle", t: "n", l: "Colle : consommation (kg par m²) — vide si pas de colle", memo: true, aide: "Écrite sur le sac, selon le peigne utilisé." }, { k: "colleSac", t: "n", l: "Poids d'un sac de colle (kg)", memo: true, si: (v) => pos(v.colle) },
    { k: "jointC", t: "n", l: "Joint : consommation (kg par m²) — vide si pas de joint", memo: true, aide: "Écrite sur le sac, selon le format et la largeur du joint." }, { k: "jointSac", t: "n", l: "Poids d'un sac de joint (kg)", memo: true, si: (v) => pos(v.jointC) },
  ];
}
function besoinsCarreaux(v, S) {
  const m = [], nom = txt(v.carreau, "Carreaux"), pe = pertes(v.perte, m), out = [];
  if (!pos(v.cA)) m.push("la longueur d'un carreau (cm)"); if (!pos(v.cB)) m.push("la largeur d'un carreau (cm)"); if (!pos(v.parCarton)) m.push("le nombre de carreaux par carton");
  if (m.length) out.push(besoin("produits", nom, "Carton", "sup", null, "", m));
  else {
    const un = (v.cA / 100) * (v.cB / 100), carton = un * v.parCarton, brut = (S * pe.k) / carton;
    out.push(besoin("produits", nom, "Carton", "sup", brut, `${fr(S)} m²${pe.t} = ${fr(S * pe.k)} m² ÷ ${fr(carton, 3)} m² par carton (${fr(v.parCarton)} carreaux de ${fr(v.cA)} × ${fr(v.cB)} cm) = ${fr(brut)}`));
  }
  if (pos(v.colle)) out.push(parConso("Colle à carrelage", S, v.colle, v.colleSac, null, "colle"));
  if (pos(v.jointC)) out.push(parConso("Joint de carrelage", S, v.jointC, v.jointSac, null, "joint"));
  return out;
}
const alertesCarreaux = (v) => [
  ...(pos(v.colle) ? [] : ["Pas de colle comptée pour cette surface."]),
  ...(pos(v.jointC) ? [] : ["Pas de joint compté pour cette surface."]),
];
// Volume d'un élément : nombre × longueur × largeur × épaisseur, puis dosage de l'entreprise.
function volume(v, { quoi, gravier, mo, ln, lcm, moSurface }) {
  const manque = [], alertes = [];
  if (!pos(v.longueur)) manque.push("la longueur"); if (!pos(v.largeur)) manque.push(ln); if (!pos(v.epaisseur)) manque.push("l'épaisseur (cm)");
  if (manque.length) return { manque, alertes, mesures: [], besoins: [] };
  const nb = pos(v.nombre) ? v.nombre : 1, la = lcm ? v.largeur / 100 : v.largeur, ep = v.epaisseur / 100, m = [], pe = pertes(v.perte, m);
  const Vn = nb * v.longueur * la * ep, V = Vn * pe.k, S = nb * v.longueur * la;
  if (ep > v.longueur) alertes.push("L'épaisseur dépasse la longueur : vérifie que l'épaisseur est bien en centimètres.");
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
const cleDe = (b) => `${b.tab}|${plat(b.nom)}|${plat(b.unite)}`;
const arrondir = (arr, x) => (arr === "sup" ? arrSup(x) : arr === "demi" ? arrDemi(x) : arrDec(x));
const ARR_TXT = { sup: "entier au-dessus", demi: "demi-journée au-dessus", dec: "arrondi à 2 décimales" };

// Calcule tout le métré d'un devis. Renvoie zones détaillées, lignes regroupées pour le devis, manques et alertes.
export function calculer(metre, metier) {
  const zones = [], parCle = new Map(), manques = [], alertes = [];
  for (const z of metre?.zones || []) {
    const nomZ = txt(z.nom, "Zone sans nom"), ouvrages = [], vus = new Map();
    for (const o of z.ouvrages || []) {
      const type = typeDe(o.type); if (!type || (metier && type.metier !== metier)) continue;
      const r = type.calc(o.v || {}), titre = titreOuvrage(type, o.v);
      const sig = type.id + "|" + JSON.stringify(Object.entries(o.v || {}).filter(([k]) => ["longueur", "largeur", "hauteur", "surface", "epaisseur", "profondeur"].includes(k)).sort());
      if (!r.manque.length && !sig.endsWith("|[]") && vus.has(sig)) alertes.push({ zone: nomZ, ouvrage: titre, texte: `« ${titre} » a les mêmes dimensions que « ${vus.get(sig)} » dans ${nomZ} : compté deux fois ?` });
      vus.set(sig, titre);
      for (const a of r.alertes || []) alertes.push({ zone: nomZ, ouvrage: titre, texte: a });
      if (r.manque.length) manques.push({ zone: nomZ, ouvrage: titre, oid: o.id, quoi: r.manque });
      for (const b of r.besoins || []) {
        if (b.manque.length) { manques.push({ zone: nomZ, ouvrage: titre, oid: o.id, besoin: b.nom, quoi: b.manque }); continue; }
        const cle = cleDe(b), g = parCle.get(cle) || { cle, tab: b.tab, nom: b.nom, unite: b.unite, arr: b.arr, brut: 0, parts: [] };
        g.brut += b.brut; g.parts.push({ zone: nomZ, ouvrage: titre, brut: b.brut, detail: b.detail }); parCle.set(cle, g);
      }
      ouvrages.push({ id: o.id, type: type.id, titre, note: type.note || "", ...r });
    }
    if (!(z.ouvrages || []).length) alertes.push({ zone: nomZ, ouvrage: "", texte: `${nomZ} n'a encore aucun ouvrage.` });
    zones.push({ id: z.id, nom: nomZ, ouvrages });
  }
  const lignes = [...parCle.values()].map((g) => {
    const qty = arrondir(g.arr, g.brut);
    const detail = g.parts.map((p) => `${p.zone} — ${p.ouvrage} : ${p.detail}`).join("\n") + `\n${g.parts.length > 1 ? `Total : ${g.parts.map((p) => fr(p.brut)).join(" + ")} = ${fr(g.brut)} → ` : "→ "}${fr(qty)} ${g.unite} (${ARR_TXT[g.arr]})`;
    return { ...g, qty, detail };
  });
  return { zones, lignes, manques, alertes };
}
// Durée d'équipe totale (jours) si tout se fait l'un après l'autre : somme des durées de chaque prestation à la journée.
export function dureeEquipe(metre, metier) {
  let j = 0;
  for (const z of metre?.zones || []) for (const o of z.ouvrages || []) {
    const type = typeDe(o.type); if (!type || (metier && type.metier !== metier)) continue;
    for (const b of type.calc(o.v || {}).besoins || []) if (N(b.jours) && !b.manque.length) j += b.jours;
  }
  return j ? arrDemi(j) : 0;
}

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

// Valeurs gardées par l'entreprise (ses rendements, ses dosages, ses formats) pour le prochain ouvrage du même type.
export function memoDe(type, v) { const o = {}; for (const c of type.champs) if (c.memo && v[c.k] !== undefined && v[c.k] !== null && v[c.k] !== "") o[c.k] = v[c.k]; return o; }
export const nouvelOuvrage = (type, memo = {}, id) => ({ id, type: type.id, v: { ...memo } });

// Texte du métré pour le devis imprimé : une ligne par mesure, avec sa formule.
export function annexe(metre, metier) {
  return calculer(metre, metier).zones.filter((z) => z.ouvrages.some((o) => o.mesures.length)).map((z) => ({
    zone: z.nom, lignes: z.ouvrages.flatMap((o) => o.mesures.filter((m) => !/par m²$/.test(m.unite)).map((m) => ({ ouvrage: o.titre, mesure: m.nom, detail: m.detail, val: m.val, unite: m.unite }))),
  }));
}
export const METIERS_METRE = [...new Set(TYPES.map((t) => t.metier))];
