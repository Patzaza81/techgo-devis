// Aides au chiffrage — fonctions pures, sans prix, sans rendement ni norme inventés.
//
// 1. manqueLigne      : dit ce qui empêche une ligne d'entrer dans le devis (plus de perte silencieuse).
// 2. quantiteCouverture : calcule une quantité à partir d'une surface et d'une couverture par unité.
//    La couverture est TOUJOURS saisie par l'utilisateur (elle est écrite sur l'emballage du produit).
// 3. oublis           : rappels non bloquants (« as-tu pensé à… ») selon ce que contient le devis.
//    ORIGINE DES RÈGLES : bon sens de chantier, rédigées sans document de référence. Elles ne
//    bloquent rien, ne chiffrent rien, et sont à faire valider par un professionnel de chaque métier.

const plat = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const nombre = (v) => typeof v === "number" && isFinite(v);

// ---------- 1. Ligne incomplète ----------
export function aDesDonnees(t) {
  return !!t && (nombre(t.qty) && t.qty !== 0 || nombre(t.price) && t.price !== 0 || !!String(t.unit || "").trim());
}
export function manqueLigne(t) {
  const m = [];
  if (!String(t?.label || "").trim()) m.push("le nom");
  if (!(t?.qty > 0)) m.push("la quantité");
  if (!String(t?.unit || "").trim()) m.push("l'unité");
  const aPrix = t?.price !== null && t?.price !== undefined && t?.price !== "";
  if (aPrix && !(t.price > 0)) m.push("un prix supérieur à zéro");
  return m;
}

// ---------- 2. Quantité à partir d'une surface ----------
// Métiers où l'aide est proposée. La maçonnerie en est exclue volontairement (voir DECISIONS.md :
// son référentiel refuse les ratios universels) ; plomberie et électricité ne se chiffrent pas au m².
export const AIDE_QTE = {
  peinture: { couches: true, couverture: "Surface couverte par un pot ou un sac, pour une couche (m²)", ou: "C'est écrit sur le pot ou le sac, ou tu le connais de tes chantiers." },
  carrelage: { couches: false, couverture: "Surface couverte par un carton, un sac ou une pièce (m²)", ou: "C'est écrit sur le carton ou le sac, ou tu le connais de tes chantiers." },
};
// quantité = arrondi supérieur de : surface × couches × (1 + pertes %) ÷ couverture par unité
export function quantiteCouverture({ surface, couches = 1, couverture, pertePct = 0 }) {
  const manque = [];
  if (!(surface > 0)) manque.push("la surface");
  if (!(couverture > 0)) manque.push("la surface couverte par unité");
  if (!(couches >= 1) || !Number.isInteger(couches)) manque.push("le nombre de couches");
  if (!(pertePct >= 0) || pertePct > 100) manque.push("un pourcentage de pertes entre 0 et 100");
  if (manque.length) return { ok: false, manque };
  const besoin = surface * couches * (1 + pertePct / 100);
  const brut = besoin / couverture;
  // Arrondi supérieur, en neutralisant les imprécisions de calcul (ex. 40 × 1,05 ÷ 1,4 = 30,000000000000004).
  const qty = Math.ceil(Math.round(brut * 1e9) / 1e9);
  const f = (n) => String(Math.round(n * 100) / 100).replace(".", ",");
  const detail = `${f(surface)} m²${couches > 1 ? ` × ${couches} couches` : ""}${pertePct > 0 ? ` + ${f(pertePct)} % de pertes` : ""} = ${f(besoin)} m² à couvrir ; ÷ ${f(couverture)} m² par unité = ${f(brut)} → ${qty} (arrondi au-dessus)`;
  return { ok: true, qty, brut, besoin, detail };
}

// ---------- 3. Rappels d'oublis ----------
// Chaque règle : si une ligne du devis correspond à `quand` et qu'aucune ne correspond à `sans`, on rappelle.
// `onglet` restreint la recherche de `quand` (produits, ouvriers, outils, autres).
const R = (id, quand, sans, texte, aide) => ({ id, quand, sans, texte, aide });
const REGLES = {
  tous: [
    { id: "main-oeuvre", test: (l) => l.some((x) => x.tab === "produits") && !l.some((x) => x.tab === "ouvriers"), texte: "Aucune main-d'œuvre dans le devis", aide: "Le devis ne compte que le matériel. Ajoute ta main-d'œuvre, sauf si elle est payée à part." },
    { id: "materiel", test: (l) => l.some((x) => x.tab === "ouvriers") && !l.some((x) => x.tab === "produits"), texte: "Aucun produit dans le devis", aide: "Le devis ne compte que la main-d'œuvre. C'est normal si le client fournit tout le matériel : écris-le dans le message au client." },
    { id: "transport", test: (l) => l.some((x) => x.tab === "produits") && !l.some((x) => /transport|livraison|camion|deplacement/.test(x.n)), texte: "Transport du matériel non compté", aide: "Qui paie pour amener le matériel sur le chantier ?" },
  ],
  carrelage: [
    R("colle", /carreau|faience|gres/, /colle|mortier|ciment/, "Carreaux sans colle", "Avec quoi les carreaux sont-ils posés ? Colle ou mortier."),
    R("joint", /carreau|faience|gres/, /joint/, "Carreaux sans joint", "Le joint de carrelage n'est pas dans le devis."),
    R("plinthe", /carreau|faience|gres/, /plinthe/, "Pas de plinthes", "Y a-t-il des plinthes à poser au bas des murs ?"),
  ],
  peinture: [
    R("sous-couche", /peinture|finition|acrylique|huile/, /sous-couche|sous couche|impression|primaire|multiprim/, "Peinture sans sous-couche", "Le support a-t-il besoin d'une sous-couche ou d'un primaire avant la peinture ?"),
    R("preparation", /peinture|finition|acrylique|huile/, /enduit|mastic|rebouch|abrasif|poncage|preparation/, "Aucune préparation du support", "Rebouchage, enduit ou ponçage : le mur est-il déjà prêt à peindre ?"),
    R("protection", /peinture|enduit/, /bache|ruban|adhesi|protection|masquage/, "Pas de protection", "Bâche et ruban pour protéger les sols, les meubles et les menuiseries."),
  ],
  maconnerie: [
    R("liant", /parpaing|bloc|brique|agglo/, /ciment|mortier/, "Blocs sans ciment ni mortier", "Avec quoi les blocs sont-ils montés ?"),
    R("sable", /ciment/, /sable|mortier pret|beton pret/, "Ciment sans sable", "Le sable n'est pas dans le devis."),
    R("attache", /fer a beton|acier|armature|treillis/, /fil d'attache|fil recuit|ligature/, "Fers sans fil d'attache", "Le fil d'attache pour lier les armatures n'est pas dans le devis."),
    R("coffrage", /beton|fer a beton|armature/, /coffrage|planche|contreplaque|etai/, "Béton armé sans coffrage", "Planches, étais ou coffrage : sont-ils fournis ou loués à part ?"),
  ],
  plomberie: [
    R("raccords", /tuyau|tube|per\b|pvc|cuivre|multicouche/, /raccord|coude|te\b|manchon|collier/, "Tuyaux sans raccords", "Coudes, tés, manchons, colliers : ils ne sont pas dans le devis."),
    R("colle-pvc", /pvc/, /colle/, "PVC sans colle", "La colle PVC n'est pas dans le devis."),
    R("robinetterie", /lavabo|evier|douche|baignoire|vasque/, /robinet|mitigeur|melangeur/, "Appareil sanitaire sans robinetterie", "Robinet ou mitigeur : fourni par toi ou par le client ?"),
    R("vidage", /lavabo|evier|douche|baignoire|vasque/, /siphon|bonde|vidage/, "Appareil sanitaire sans siphon ni bonde", "Le vidage de l'appareil n'est pas dans le devis."),
    R("etancheite", /tuyau|raccord|robinet/, /teflon|filasse|pate a joint|joint/, "Rien pour l'étanchéité des raccords", "Ruban téflon, filasse ou pâte à joint."),
  ],
  electricite: [
    R("conduit", /cable|fil\b|conducteur/, /gaine|conduit|goulotte|tube|chemin de cable/, "Câbles sans gaine ni conduit", "Dans quoi passent les câbles ?"),
    R("boites", /prise|interrupteur|va-et-vient|bouton poussoir/, /boite|boitier/, "Appareillage sans boîtes", "Les boîtes d'encastrement ou de dérivation ne sont pas dans le devis."),
    R("protection", /cable|prise|luminaire|interrupteur/, /disjoncteur|differentiel|fusible|tableau|coffret/, "Aucune protection électrique", "Disjoncteurs, différentiel, tableau : l'installation existante suffit-elle ?"),
    R("terre", /tableau|coffret|disjoncteur/, /terre|piquet|barrette/, "Pas de mise à la terre", "La prise de terre existe-t-elle déjà sur le chantier ?"),
  ],
};
export const METIERS_AVEC_RAPPELS = Object.keys(REGLES).filter((k) => k !== "tous");

// lignes : [{ nom, tab }] ; ignores : identifiants de rappels écartés par l'utilisateur (« pas besoin »)
export function oublis(metier, lignes, ignores = []) {
  const l = (lignes || []).map((x) => ({ n: plat(x.nom), tab: x.tab }));
  if (!l.length) return [];
  const prod = l.filter((x) => x.tab === "produits");
  const out = [];
  for (const r of REGLES.tous) if (r.test(l)) out.push({ id: r.id, texte: r.texte, aide: r.aide });
  for (const r of REGLES[metier] || []) if (prod.some((x) => r.quand.test(x.n)) && !l.some((x) => r.sans.test(x.n))) out.push({ id: r.id, texte: r.texte, aide: r.aide });
  return out.filter((o) => !ignores.includes(o.id));
}
