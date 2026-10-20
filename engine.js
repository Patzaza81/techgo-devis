// Moteur de calcul TechGo Devis v2 — indépendant de l'interface, sans état, sans valeur cachée.
// Règles d'arrondi (documentées, testées) :
//  - quantités de produits : arrondies à l'unité de conditionnement SUPÉRIEURE ;
//  - montants de ligne : FCFA entiers, 0,5 vers le haut ;
//  - remise, frais généraux, TVA : calculés sur le total, 0,5 vers le haut, une seule fois ;
//  - échéancier : chaque part arrondie 0,5 vers le haut, la dernière = reste (somme exacte).
// Un prix, un coût, un rendement ou une quantité manquants valent « inconnu » (null), jamais zéro.

export const ENGINE_VERSION = "2.0.0";

const SC = 1000;
const isNum = (x) => typeof x === "number" && isFinite(x);
const sc = (x) => { if (!isNum(x)) throw new Error("Nombre invalide : " + x); return Math.round(x * SC); };
const ceilDiv = (a, b) => { if (!(b > 0)) throw new Error("Division invalide"); return Math.floor((a + b - 1) / b); };
const roundDiv = (n, d) => Math.floor((2 * n + d) / (2 * d));

export const MATERIAL_CATS = ["materiaux", "consommables"];

// base × (1 + perte %), en milli-unités entières
export function withLoss(base, lossPct) {
  return Math.round((sc(base) * (100 * SC + sc(lossPct || 0))) / (100 * SC));
}
export function qtyFromYield(base, lossPct, yieldPerUnit, mult = 1) {
  return ceilDiv(Math.round(withLoss(base, lossPct) * mult), sc(yieldPerUnit));
}
export function calcSurface(surface, lossPct) { return withLoss(surface, lossPct) / SC; }

export function schedule(amount, percents) {
  const sum = percents.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 100) > 1e-9) throw new Error("Les pourcentages doivent totaliser 100 (reçu " + sum + ")");
  const out = []; let acc = 0;
  percents.forEach((p, i) => {
    if (i === percents.length - 1) out.push(amount - acc);
    else { const part = roundDiv(amount * sc(p), 100 * SC); out.push(part); acc += part; }
  });
  return out;
}
const splitProportional = (total, parts) => { // parts: tableau de poids, somme exacte
  const w = parts.reduce((a, b) => a + b, 0);
  if (!w) return parts.map(() => 0);
  const out = []; let acc = 0;
  parts.forEach((p, i) => { if (i === parts.length - 1) out.push(total - acc); else { const v = roundDiv(total * p, w); out.push(v); acc += v; } });
  return out;
};

// ---------- Équipements ----------
// item.ownership : 'loue' | 'possede'. Tarifs de location = COÛTS fournisseur.
export function equipmentCost(item, L) {
  const days = isNum(L.days) ? L.days : null;
  if (days === null || days <= 0) return { cost: null, calc: "Durée non renseignée" };
  if (item.ownership === "possede") {
    if (!isNum(item.ownCostDay)) return { cost: null, calc: "Coût interne d'utilisation inconnu" };
    return { cost: Math.round(item.ownCostDay * days), calc: `${item.ownCostDay} FCFA/jour (coût interne) × ${days} j — pas de location facturée` };
  }
  const r = item.rent || {};
  const basis = L.basis || "jour";
  const billDays = Math.max(days, r.minDays || 0);
  const periods = basis === "jour" ? billDays : basis === "semaine" ? Math.ceil(billDays / 7) : Math.ceil(billDays / 30);
  const rate = r[{ jour: "day", semaine: "week", mois: "month" }[basis]];
  if (!isNum(rate)) return { cost: null, calc: `Tarif de location (${basis}) inconnu` };
  let cost = rate * periods;
  const parts = [`${rate} × ${periods} ${basis}${periods > 1 ? "s" : ""}`];
  if (!r.setupIncluded) {
    const area = isNum(L.areaQty) ? L.areaQty : 0;
    const setup = (r.setup || 0) + (r.teardown || 0) + ((r.setupPerM2 || 0) + (r.teardownPerM2 || 0)) * area;
    if (setup) { cost += setup; parts.push(`montage/démontage ${Math.round(setup)}`); }
  } else parts.push("montage/démontage inclus par le fournisseur");
  if (r.transport) { const trips = isNum(L.trips) ? L.trips : 1; cost += r.transport * trips; parts.push(`transport ${r.transport} × ${trips}`); }
  return { cost: Math.round(cost), calc: parts.join(" + ") };
}

// ---------- Calcul d'un devis ----------
/**
 * inp = { surface, lossPct, lines, items:{id:item}, payment:{materials:[..], services:[..]},
 *         vatPct, discount:{pct,amount}, overhead:{pct,mode:'ligne'|'inclus'}, pricing:{method:'catalogue'|'cout_plus_marge', markupPct}, minMarginPct }
 */
export function computeQuote(inp) {
  const surface = isNum(inp.surface) ? inp.surface : 0;
  const lossPct = isNum(inp.lossPct) ? inp.lossPct : 0;
  const items = inp.items || {};
  const out = []; const byId = {}; const warnings = [];
  const pricing = inp.pricing || { method: "catalogue" };

  for (const L of inp.lines || []) {
    const it = items[L.itemId];
    if (!it) { warnings.push("Article introuvable : " + L.itemId); continue; }
    const flags = [];
    const base = isNum(L.baseQty) ? L.baseQty : surface;
    const loss = L.noLoss ? 0 : isNum(L.lossPct) ? L.lossPct : lossPct;
    const mult = isNum(L.mult) ? L.mult : 1;
    let qtyCalc = null, calc = "", cost = null, unitPrice = null, total = null, isEquip = false, unit = it.unit;

    if (L.unknown) {
      flags.push("qte_inconnue"); calc = L.unknown;
    } else if (L.mode === "yield") {
      const y = isNum(L.yield) ? L.yield : it.yield;
      if (!(y > 0)) { flags.push("rendement_inconnu"); calc = "Rendement inconnu"; }
      else { qtyCalc = qtyFromYield(base, loss, y, mult); calc = `${withLoss(base, loss) / SC} ${it.yieldUnit || "m²"}${mult !== 1 ? " × " + mult : ""} ÷ ${y} par ${it.unit}, arrondi au supérieur`; }
    } else if (L.mode === "factor") {
      if (!isNum(L.factor)) { flags.push("qte_inconnue"); calc = "Coefficient inconnu"; }
      else { qtyCalc = ceilDiv(Math.round(withLoss(base, loss) * sc(L.factor) * mult), SC * SC); calc = `${withLoss(base, loss) / SC} × ${L.factor}${mult !== 1 ? " × " + mult : ""}, arrondi au supérieur`; }
    } else if (L.mode === "ratio") {
      const ref = byId[L.of];
      if (!ref || ref.qty === null) { flags.push("qte_inconnue"); calc = "Ligne de référence incomplète"; }
      else { qtyCalc = ceilDiv(ref.qty * sc(L.factor), SC); calc = `${ref.qty} × ${L.factor} (${ref.label})`; }
    } else if (L.mode === "fixed" || L.mode === "flat" || L.mode === "hours") {
      if (isNum(L.qty)) { qtyCalc = L.qty; calc = L.mode === "flat" ? "forfait / quantité saisie" : "quantité saisie"; } else { flags.push("qte_inconnue"); calc = "Quantité à saisir"; }
    } else if (L.mode === "area") {
      qtyCalc = base * mult; calc = `${base} ${it.unit === "m²" ? "m²" : it.unit}${mult !== 1 ? " × " + mult : ""}`;
    } else if (L.mode === "equip") {
      isEquip = true; unit = "jour";
      const e = equipmentCost(it, L);
      cost = e.cost; calc = e.calc; qtyCalc = isNum(L.days) ? L.days : null;
      if (cost === null) flags.push("cout_inconnu");
    } else { warnings.push("Mode inconnu : " + L.mode); continue; }

    // correction manuelle tracée : quantité calculée conservée
    let qty = qtyCalc, overridden = false, overrideReason = "";
    if (L.override && isNum(L.override.qty)) { qty = L.override.qty; overridden = true; overrideReason = L.override.reason || ""; }

    if (isEquip) {
      if (L.bill === "refacture") {
        if (cost !== null && isNum(L.markupPct)) { total = Math.round(cost * (1 + L.markupPct / 100)); unitPrice = qty ? Math.round(total / qty) : null; }
        else flags.push("prix_inconnu");
      } else { total = 0; unitPrice = 0; calc += " — non facturé séparément (absorbé)"; }
    } else {
      const c = isNum(L.costOverride) ? L.costOverride : it.cost;
      if (pricing.method === "cout_plus_marge") {
        unitPrice = isNum(c) && isNum(pricing.markupPct) ? Math.round(c * (1 + pricing.markupPct / 100)) : null;
      } else unitPrice = isNum(L.priceOverride) ? L.priceOverride : isNum(it.price) ? it.price : null;
      if (unitPrice === null) flags.push("prix_inconnu");
      total = unitPrice !== null && qty !== null ? Math.round(qty * unitPrice) : null;
      cost = isNum(c) && qty !== null ? Math.round(qty * c) : null;
    }
    if (qty === null && total === null && !flags.includes("qte_inconnue") && !isEquip) flags.push("qte_inconnue");
    flags.forEach((f) => warnings.push(`${it.label} : ${{ prix_inconnu: "prix inconnu", rendement_inconnu: "rendement inconnu", qte_inconnue: "quantité inconnue", cout_inconnu: "coût inconnu" }[f]}`));

    const row = {
      id: L.id, key: L.key || L.id, itemId: it.id, ref: it.ref || "", label: L.label || it.label, role: L.role || "", group: L.group || "Divers",
      cat: it.cat, kind: MATERIAL_CATS.includes(it.cat) ? "material" : "service", unit, tags: it.tags || [], option: !!L.option, mode: L.mode,
      qtyCalc, qty, overridden, overrideReason, price: unitPrice, total, cost, calc, flags, tag: L.tag || "", forItem: L.forItem || "",
      setupIncluded: !!(it.rent && it.rent.setupIncluded),
    };
    out.push(row); byId[L.id] = row;
  }

  // double comptage : montage ajouté alors que le fournisseur l'inclut déjà
  const doubles = out.filter((l) => l.tag === "montage" && l.forItem && out.some((e) => e.itemId === l.forItem && e.setupIncluded));
  doubles.forEach((l) => warnings.push(`Double comptage possible : « ${l.label} » alors que le fournisseur inclut déjà le montage`));

  const sumKind = (kind, opt) => out.filter((l) => l.kind === kind && l.option === opt).reduce((a, l) => a + (l.total ?? 0), 0);
  const mat0 = sumKind("material", false), svc0 = sumKind("service", false);
  const mat1 = mat0 + sumKind("material", true), svc1 = svc0 + sumKind("service", true);
  const unknown = out.some((l) => l.total === null);

  // frais généraux : soit ligne séparée facturée, soit inclus dans les prix (jamais les deux)
  const oh = inp.overhead || { pct: 0, mode: "inclus" };
  const ohLine = (sub) => (oh.mode === "ligne" && oh.pct > 0 ? roundDiv(sub * sc(oh.pct), 100 * SC) : 0);
  const sub0 = mat0 + svc0, sub1 = mat1 + svc1;
  const ohB = ohLine(sub0), ohO = ohLine(sub1);

  const d = inp.discount || {};
  const disc = (sub) => {
    if (isNum(d.pct) && d.pct > 0) return roundDiv(sub * sc(d.pct), 100 * SC);
    if (isNum(d.amount) && d.amount > 0) return Math.min(d.amount, sub);
    return 0;
  };
  const dB = disc(sub0 + ohB), dO = disc(sub1 + ohO);
  const netB = sub0 + ohB - dB, netO = sub1 + ohO - dO;
  const vat = (x) => (isNum(inp.vatPct) ? roundDiv(x * sc(inp.vatPct), 100 * SC) : null);
  const vB = vat(netB), vO = vat(netO);

  // échéanciers (remise répartie proportionnellement matériel / services)
  const pay = inp.payment || { materials: [100], services: [100] };
  const scen = (mat, svc, oh_, dd, vatAmt) => {
    const dm = splitProportional(dd, [mat, svc + oh_]);
    const m = mat - dm[0], s = svc + oh_ - dm[1];
    const sm = schedule(m, pay.materials), ss = schedule(s, pay.services);
    const n = Math.max(sm.length, ss.length);
    const combined = Array.from({ length: n }, (_, i) => (sm[i] ?? 0) + (ss[i] ?? 0));
    const vats = vatAmt === null ? null : splitProportional(vatAmt, combined);
    return { materials: sm, services: ss, combined, vat: vats, ttc: vats ? combined.map((c, i) => c + vats[i]) : null };
  };
  const schedules = { base: scen(mat0, svc0, ohB, dB, vB), option: scen(mat1, svc1, ohO, dO, vO) };

  // rentabilité : uniquement si tous les coûts sont connus
  const costKnown = out.length > 0 && out.every((l) => l.cost !== null);
  let margin = null;
  if (costKnown) {
    const direct0 = out.filter((l) => !l.option).reduce((a, l) => a + l.cost, 0);
    const direct1 = out.reduce((a, l) => a + l.cost, 0);
    const ohCost = (x) => (oh.pct > 0 ? roundDiv(x * sc(oh.pct), 100 * SC) : 0);
    const mk = (direct, net) => { const c = direct + ohCost(direct); return { cost: c, profit: net - c, markupPct: c ? ((net - c) / c) * 100 : null, marginRatePct: net ? ((net - c) / net) * 100 : null }; };
    margin = { base: mk(direct0, netB), option: mk(direct1, netO) };
  }

  return {
    engineVersion: ENGINE_VERSION, lines: out, warnings, unknownPrices: unknown,
    totals: {
      matBase: mat0, svcBase: svc0, matOpt: mat1 - mat0, svcOpt: svc1 - svc0,
      subBase: sub0, subOption: sub1, overheadBase: ohB, overheadOption: ohO, discountBase: dB, discountOption: dO,
      base: netB, withOption: netO, vatBase: vB, vatOption: vO, ttcBase: vB === null ? null : netB + vB, ttcOption: vO === null ? null : netO + vO,
    },
    schedules, margin, calcSurface: calcSurface(surface, lossPct),
  };
}

// ---------- Contrôle des oublis ----------
/**
 * ctx = { surface, result, workHeightM, accessThresholdM, decisions:{acces,transport,protection,nettoyage,outillage : 'inclus'|'exclu'|'client'|'na'},
 *         expects:[{tag,label,severity,hint}], hasDelay, hasValidity, hasPayment, vatPct, minMarginPct, discountActive, expired }
 */
export function runChecks(ctx) {
  const res = []; const add = (state, label, hint) => res.push({ state, label, hint: hint || "" });
  const r = ctx.result; const lines = r ? r.lines : [];
  const has = (tag) => lines.some((l) => l.tags.includes(tag) && (l.qty ?? 0) > 0 && !l.option);
  const decided = (k) => !!(ctx.decisions && ctx.decisions[k]);

  if (!(ctx.surface > 0)) add("bloque", "Surface ou quantité de base non renseignée");
  if (!lines.length) add("bloque", "Aucune prestation sélectionnée");
  if (r && lines.length && typeof r.totals.base === "number" && r.totals.base <= 0) add("bloque", "Total de l'offre nul ou négatif", "Un devis ne peut pas avoir un montant nul ou négatif : vérifie les prix, les quantités et la remise.");
  if (ctx.lossPct === null || ctx.lossPct === undefined) add("verifier", "Marge de sécurité des produits non renseignée", "0 % est appliqué tant qu'elle n'est pas saisie. Utilise la valeur observée sur tes chantiers.");
  if (r) {
    const flagged = (f) => lines.filter((l) => l.flags.includes(f)).map((l) => l.label);
    const p = flagged("prix_inconnu"); if (p.length) add("bloque", "Prix manquants", p.join(", ") + ". Un prix inconnu n'est pas zéro.");
    const y = flagged("rendement_inconnu"); if (y.length) add("bloque", "Rendements manquants", y.join(", "));
    const q = flagged("qte_inconnue"); if (q.length) add("bloque", "Quantités à saisir", q.join(", "));
    const c = flagged("cout_inconnu"); if (c.length) add("bloque", "Coût d'équipement inconnu", c.join(", "));
    const ov = lines.filter((l) => l.overridden && !l.overrideReason); if (ov.length) add("bloque", "Quantité corrigée sans motif", ov.map((l) => l.label).join(", ") + ". Le motif de correction est obligatoire.");
    const dbl = r.warnings.filter((w) => w.startsWith("Double comptage")); dbl.forEach((w) => add("verifier", w));
  }

  // accès / travail en hauteur
  if (ctx.workHeightM === null || ctx.workHeightM === undefined) add("bloque", "Hauteur de travail non renseignée", "Nécessaire pour décider des moyens d'accès.");
  else if (ctx.accessThresholdM === null || ctx.accessThresholdM === undefined) add("verifier", "Seuil de hauteur d'accès non défini", "À définir dans les réglages de l'entreprise.");
  else if (ctx.workHeightM >= ctx.accessThresholdM) {
    if (has("acces")) add("ok", "Moyens d'accès chiffrés");
    else if (ctx.decisions.acces === "client") add("ok", "Accès fourni par le client");
    else if (ctx.decisions.acces === "exclu") add("verifier", "Moyens d'accès exclus du devis (chiffrage séparé)", "À confirmer par écrit avec le client : risque de surcoût non maîtrisé.");
    else add("bloque", "Moyens d'accès non traités", `Hauteur ${ctx.workHeightM} m ≥ seuil ${ctx.accessThresholdM} m : chiffrer, exclure explicitement ou faire fournir par le client.`);
  } else add("ok", "Hauteur sous le seuil d'accès");

  for (const [k, lab] of [["transport", "Transport et manutention"], ["protection", "Protections et sécurité"], ["nettoyage", "Nettoyage et évacuation des déchets"], ["outillage", "Outillage et équipements"]]) {
    if (has(k)) add("ok", lab + " chiffrés");
    else if (decided(k)) add("ok", lab + " : décision prise (" + ({ inclus: "inclus", exclu: "exclu", client: "fourni par le client", na: "sans objet" }[ctx.decisions[k]] || ctx.decisions[k]) + ")");
    else add("verifier", lab + " non examinés", "Chiffrer une ligne ou indiquer « sans objet ».");
  }
  for (const e of ctx.expects || []) {
    if (has(e.tag)) add("ok", e.label + " prévus");
    else if (decided(e.tag)) add("ok", e.label + " : décision prise");
    else add(e.severity || "verifier", e.label + " non prévus", e.hint);
  }

  add(ctx.hasDelay ? "ok" : "bloque", ctx.hasDelay ? "Délai renseigné" : "Délai d'exécution manquant");
  add(ctx.hasValidity ? "ok" : "bloque", ctx.hasValidity ? "Validité de l'offre renseignée" : "Validité de l'offre manquante");
  add(ctx.hasPayment ? "ok" : "bloque", ctx.hasPayment ? "Échéancier renseigné (100 %)" : "Échéancier incomplet", "Chaque échéancier doit totaliser 100 %.");
  if (ctx.vatPct === null || ctx.vatPct === undefined) add("verifier", "TVA non définie (devis affiché hors taxes)");
  if (r && r.margin) {
    if (ctx.minMarginPct !== null && ctx.minMarginPct !== undefined && r.margin.base.marginRatePct < ctx.minMarginPct)
      add("verifier", `Rentabilité insuffisante : taux de marque ${r.margin.base.marginRatePct.toFixed(1)} % < ${ctx.minMarginPct} %`, ctx.discountActive ? "La remise appliquée réduit la marge sous le minimum." : "");
  } else if (r && r.lines.length) add("verifier", "Coûts d'achat incomplets : marge non calculable");
  if (ctx.expired) add("verifier", "Validité dépassée", "Renouveler l'offre avant de la renvoyer.");

  const status = res.some((x) => x.state === "bloque") ? "bloque" : res.some((x) => x.state === "verifier") ? "verifier" : "complet";
  return { status, items: res };
}

// ---------- Empreinte de contrôle (intégrité, pas une signature) ----------
export function canonical(x) {
  if (x === null || typeof x !== "object") return JSON.stringify(x);
  if (Array.isArray(x)) return "[" + x.map(canonical).join(",") + "]";
  return "{" + Object.keys(x).sort().map((k) => JSON.stringify(k) + ":" + canonical(x[k])).join(",") + "}";
}
export function fingerprint(x) { // cyrb53 ×2 → 106 bits, 27 caractères hexa
  const s = canonical(x);
  const h = (seed) => { let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed; for (let i = 0; i < s.length; i++) { const ch = s.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0"); };
  return (h(1) + h(2)).slice(0, 27).toUpperCase();
}
