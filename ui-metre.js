// Écran du métré : zones → ouvrages → dimensions. Aucun calcul ici (tout est dans metiers/metre.js).
import * as M from "./metiers/metre.js";
import { esc, fmtD } from "./ui-doc.js";

let H = null; // { I, Sel, Chk, L, ui, sugg(metier) } fournis par app.js
export const init = (h) => { H = h; };
const st = () => (H.ui.tmp.metre = H.ui.tmp.metre || { z: null, o: null, add: null, del: null, lignes: false });
const UNITES_PROD = ["Pot", "Seau", "Sac", "Litre", "Kg"];

function champ(c, v, base, dis, metier, repris = []) {
  const tete = c.g ? `<div class="mg"><b>${esc(c.g)}</b>${c.gp ? `<span>${esc(c.gp)}</span>` : ""}</div>` : "";
  return tete + champ1(c, v, base, dis, metier, repris.includes(c.k));
}
function champ1(c, v, base, dis, metier, rep) {
  const p = `${base}.v.${c.k}`, val = v[c.k], aide = (rep ? `<p class="hint mrep">Repris de ton dernier ouvrage : à confirmer.</p>` : "") + (c.aide ? `<p class="hint" style="margin:2px 0 8px">${esc(c.aide)}</p>` : "");
  if (c.t === "n") return `<div class="mf${rep ? " rep" : ""}${!rep && !c.aide && c.l.length <= 24 ? " half" : ""}">${H.L(esc(c.l))}${H.I("q", p, val, { type: "number", n: "n", dis, ph: c.ph })}${aide}</div>`;
  if (c.t === "txt") return `<div class="mf">${H.L(esc(c.l))}${H.I("q", p, val, { dis, ph: c.ph })}${aide}</div>`;
  if (c.t === "bool") return `<div class="mf">${H.Chk("q", p, !!val, esc(c.l), { dis })}</div>`;
  if (c.t === "choix") return `<div class="mf${rep ? " rep" : ""}">${H.L(esc(c.l))}${H.Sel("q", p, c.k === "moMode" ? M.modeMO(val) : val ?? c.opt[0][0], c.opt, { dis })}${aide}</div>`;
  const liste = Array.isArray(val) ? val : [];
  const plus = (txt) => (dis ? "" : `<button type="button" class="addrow" data-act="metreAdd" data-base="${base}" data-k="${c.k}">＋ ${txt}</button>`);
  const moins = (i) => (dis ? "" : `<button type="button" class="mx" data-act="metreDel" data-base="${base}" data-k="${c.k}" data-i="${i}" aria-label="Retirer">✕</button>`);
  if (c.t === "ouv") return `<div class="mf"><b class="ml">${esc(c.l)}</b>${liste.map((o, i) => `<div class="mrow m3"><div>${H.L("Nombre")}${H.I("q", `${p}.${i}.n`, o.n, { type: "number", n: "n", dis, ph: "1" })}</div><div>${H.L("Largeur (m)")}${H.I("q", `${p}.${i}.l`, o.l, { type: "number", n: "n", dis })}</div><div>${H.L("Hauteur (m)")}${H.I("q", `${p}.${i}.h`, o.h, { type: "number", n: "n", dis })}</div>${moins(i)}</div>`).join("")}${plus("Ajouter une porte ou une fenêtre")}</div>`;
  if (c.t === "art") {
    const pris = new Set(liste.map((a) => String(a.nom || "").trim().toLowerCase()));
    const chips = dis || !c.sugg ? "" : `<div class="chips names">${c.sugg.filter((s) => !pris.has(s.toLowerCase())).map((s) => `<button type="button" class="chip nm" data-act="metreAdd" data-base="${base}" data-k="${c.k}" data-nom="${esc(s)}">＋ ${esc(s)}</button>`).join("")}</div>`;
    return `<div class="mf"><b class="ml">${esc(c.l)}</b>${liste.map((a, i) => `<div class="mrow m2"><div>${H.L("Nom")}${H.I("q", `${p}.${i}.nom`, a.nom, { dis })}</div><div>${H.L("Quantité")}${H.I("q", `${p}.${i}.n`, a.n, { type: "number", n: "n", dis })}</div>${moins(i)}</div>`).join("")}${chips}${plus("Ajouter un autre article")}</div>`;
  }
  if (c.t === "prod") {
    const pris = new Set(liste.map((a) => String(a.nom || "").trim().toLowerCase()));
    const chips = dis ? "" : `<div class="chips names">${H.sugg(metier).filter((s) => !pris.has(s.toLowerCase())).slice(0, 8).map((s) => `<button type="button" class="chip nm" data-act="metreAdd" data-base="${base}" data-k="${c.k}" data-nom="${esc(s)}">＋ ${esc(s)}</button>`).join("")}</div>`;
    return `<div class="mf"><b class="ml">${esc(c.l)}</b>${liste.map((a, i) => `<div class="mprod"><div class="mrow m1"><div>${H.L("Produit")}${H.I("q", `${p}.${i}.nom`, a.nom, { dis })}</div>${moins(i)}</div>
      <div class="mrow m3"><div>${H.L("Couches")}${H.I("q", `${p}.${i}.couches`, a.couches, { type: "number", n: "n", dis, ph: "1" })}</div><div>${H.L("m² couverts (1 couche)")}${H.I("q", `${p}.${i}.couv`, a.couv, { type: "number", n: "n", dis })}</div><div>${H.L("Vendu en")}${H.Sel("q", `${p}.${i}.u`, a.u || "Pot", UNITES_PROD.map((u) => [u, u]), { dis })}</div></div></div>`).join("")}
      <p class="hint" style="margin:2px 0 8px">La surface couverte est écrite sur le pot, pour une couche. Sinon, prends celle de tes chantiers.</p>${chips}${plus("Ajouter un autre produit")}</div>`;
  }
  return "";
}

function resultat(r) {
  const mes = r.mesures.map((m) => `<div class="mres"><b>${esc(m.nom)} : ${fmtD(Math.round(m.val * 100) / 100)} ${esc(m.unite)}</b><div class="hint">${esc(m.detail)}</div></div>`).join("");
  const badge = (b) => (b.est ? `<span class="mest">estimation</span>` : `<span class="mest ex">exact</span>`);
  const ok = r.besoins.filter((b) => !b.manque.length), ko = r.besoins.filter((b) => b.manque.length);
  const bes = ok.map((b) => `<div class="mres"><b>${esc(b.nom)}</b> ${b.tab === "produits" || b.duree !== undefined ? badge(b) : ""}<div class="hint">${esc(b.detail)}${b.duree !== undefined ? "" : " " + esc(b.unite)}${b.prixPour ? "<br>" + esc(b.prixPour) : ""}</div></div>`).join("");
  const conf = r.aConfirmer && r.aConfirmer.length;
  const manque = [...r.manque, ...ko.flatMap((b) => b.manque)];
  return `${conf ? `<div class="banner warn" id="mconf"><b>Valeurs reprises de ton dernier ouvrage : sont-elles bonnes pour celui-ci ?</b><div class="hint" style="margin:4px 0 8px">${r.aConfirmer.map(esc).join(" · ")}</div><div class="row"><button type="button" class="sec" data-act="metreConfirmer">Oui, je les garde</button><button type="button" class="sec danger" data-act="metreVider">Non, tout vider</button></div><div class="hint" style="margin:6px 0 0">Tant que tu n'as pas répondu, cet ouvrage n'entre pas dans le devis. Corriger une valeur la confirme.</div></div>` : ""}${manque.filter((x) => !/^ta confirmation/.test(x)).length ? `<div class="banner warn"><b>Il manque :</b> ${[...new Set(manque.filter((x) => !/^ta confirmation/.test(x)))].map(esc).join(" ; ")}.<div class="hint" style="margin:4px 0 0">Ce qui est incomplet n'entre pas dans le devis.</div></div>` : ""}
    ${(r.alertes || []).map((a) => `<div class="banner warn">${esc(a)}</div>`).join("")}
    ${mes || bes ? `<div class="mcalc"><b class="ml">Calcul</b>${mes}${bes}</div>` : ""}
    ${r.note ? `<p class="hint">${esc(r.note)}</p>` : ""}`;
}

// Carte principale du métré, affichée à l'étape « Le travail et le matériel ».
export function carte(q, dis, sync) {
  const metier = H.metierOf(q), types = M.typesDe(metier); if (!types.length) return "";
  const metre = q.current.metre || { zones: [] }, s = st(), calc = M.calculer(metre, metier);
  const zones = metre.zones.map((z, zi) => {
    const cz = calc.zones.find((x) => x.id === z.id) || { ouvrages: [] }, openZ = s.z === z.id;
    const ouvr = (z.ouvrages || []).map((o, oi) => {
      const type = M.typeDe(o.type); if (!type || type.metier !== metier) return "";
      const r = cz.ouvrages.find((x) => x.id === o.id) || { mesures: [], besoins: [], manque: [], alertes: [] }, open = s.o === o.id, base = `current.metre.zones.${zi}.ouvrages.${oi}`;
      const incomplet = r.manque.length || r.besoins.some((b) => b.manque.length), m0 = r.mesures.find((m) => /^Surface à peindre/.test(m.nom)) || r.mesures[0];
      const head = `<button type="button" class="rowc ${incomplet ? "warn" : "ok"} ${open ? "open" : ""}" data-act="metreOuv" data-o="${o.id}"><em class="tick ${incomplet ? "w" : ""}">${incomplet ? "!" : "✓"}</em><span class="rn"><b>${esc(M.titreOuvrage(type, o.v))}</b><small>${r.aConfirmer && r.aConfirmer.length ? "À confirmer" : incomplet ? "À compléter" : m0 ? `${fmtD(Math.round(m0.val * 100) / 100)} ${esc(m0.unite)}` : esc(type.nom)}</small></span><span class="rt"><i>${open ? "▲" : "▼"}</i></span></button>`;
      if (!open) return head;
      return head + `<div class="sheet metre"><div class="mfs">${M.champsVisibles(type, o.v || {}).map((c) => champ(c, o.v || {}, base, dis, metier, o.repris || [])).join("")}</div><div id="mresult" data-base="${base}">${resultat(r)}</div>
        <div class="row" style="margin-top:8px"><button type="button" class="sec" data-act="metreOuv" data-o="${o.id}">▲ Fermer</button>${dis ? "" : s.del === o.id ? `<button type="button" class="sec danger" data-act="metreOuvDel" data-z="${zi}" data-i="${oi}">Confirmer : retirer</button>` : `<button type="button" class="sec danger" data-act="metreAsk" data-id="${o.id}">Retirer cet ouvrage</button>`}</div></div>`;
    }).join("");
    const choix = s.add === z.id ? `<div class="chips">${types.map((t) => `<button type="button" class="chip" data-act="metreOuvAdd" data-z="${zi}" data-t="${t.id}">${esc(t.nom)}</button>`).join("")}</div>` : dis ? "" : `<button type="button" class="addrow" data-act="metreChoix" data-z="${z.id}">＋ Ajouter un ouvrage dans ${esc(z.nom || "cette zone")}</button>`;
    const nb = (z.ouvrages || []).length;
    return `<div class="mzone"><button type="button" class="sech" data-act="metreZone" data-z="${z.id}"><b>${esc(z.nom || `Zone ${zi + 1}`)}${nb ? ` · ${nb}` : ""}</b><span><i>${openZ ? "▲" : "▼"}</i></span></button>
      ${openZ ? `${H.L("Nom de la zone (pièce, étage, bâtiment, lot)")}${H.I("q", `current.metre.zones.${zi}.nom`, z.nom, { dis, ph: "Ex. : Salon, Étage 1, Bâtiment B" })}${ouvr}${choix}
        ${dis ? "" : `<div class="row" style="margin-top:8px"><button type="button" class="sec" data-act="metreZoneCopie" data-z="${zi}">Copier cette zone</button>${s.del === z.id ? `<button type="button" class="sec danger" data-act="metreZoneDel" data-z="${zi}">Confirmer : supprimer</button>` : `<button type="button" class="sec danger" data-act="metreAsk" data-id="${z.id}">Supprimer la zone</button>`}</div>`}` : ""}</div>`;
  }).join("");
  const lignes = calc.lignes.length ? `<button type="button" class="linkbtn" data-act="metreLignes">${s.lignes ? "Cacher" : "Voir"} les ${calc.lignes.length} quantités calculées et leur explication</button>${s.lignes ? `<div class="mcalc">${["produits", "ouvriers"].map((tab) => { const ls = calc.lignes.filter((l) => l.tab === tab); return ls.length ? `<b class="ml">${tab === "produits" ? "Fournitures" : "Main-d'œuvre"}</b>` + ls.map((l) => `<div class="mres"><b>${esc(l.nom)} : ${fmtD(l.qty)} ${esc(l.unite)}</b> ${l.est ? `<span class="mest">estimation</span>` : `<span class="mest ex">exact</span>`}<div class="hint" style="white-space:pre-line">${esc(l.detail)}</div></div>`).join("") : ""; }).join("")}</div>` : ""}` : "";
  const ec = sync ? sync.ecarts : [];
  return `<div class="card" id="metre"><b>Métré du chantier</b>
    <p class="hint">Décris le chantier pièce par pièce. L'application calcule les quantités, te montre le calcul et remplit le devis. Tu ne saisis plus que les prix.</p>
    ${zones}
    ${dis ? "" : `<button type="button" class="addrow" data-act="metreZoneAdd">＋ Ajouter une zone (pièce, étage, bâtiment, lot)</button>`}
    ${calc.manques.length ? `<div class="banner warn" id="metremanque">${calc.manques.length} élément${calc.manques.length > 1 ? "s" : ""} du métré à compléter : ${[...new Set(calc.manques.map((m) => `${m.zone} — ${m.besoin || m.ouvrage}`))].slice(0, 4).map(esc).join(" ; ")}${calc.manques.length > 4 ? "…" : ""}</div>` : ""}
    ${ec.map((e) => `<div class="banner warn">« ${esc(e.nom)} » : tu as écrit ${fmtD(e.qty)} dans le devis, le métré ${e.metre === null ? "ne le calcule plus" : "donne " + fmtD(e.metre)}. ${dis ? "" : `<button type="button" class="linkbtn" data-act="metreReprendre" data-id="${e.id}">${e.metre === null ? "Retirer la ligne" : "Reprendre " + fmtD(e.metre)}</button>`}</div>`).join("")}
    ${lignes}</div>`;
}

// Carte de contrôle à l'étape « Le prix » : ce qui reste à compléter, écarts et durée.
export function controle(q, dis, sync) {
  const metier = H.metierOf(q), metre = q.current.metre; if (!metre || !(metre.zones || []).length) return "";
  const calc = M.calculer(metre, metier), jours = M.dureeEquipe(metre, metier), t = q.current.terms, pts = [];
  for (const m of calc.manques) pts.push(`À compléter — ${m.zone}, ${m.besoin || m.ouvrage} : ${m.quoi.join(" ; ")}.`);
  for (const a of calc.alertes) pts.push(a.texte);
  for (const e of sync ? sync.ecarts : []) pts.push(`« ${e.nom} » : ${fmtD(e.qty)} dans le devis, ${e.metre === null ? "plus rien dans le métré" : fmtD(e.metre) + " d'après le métré"}.`);
  for (const n of (sync && sync.doubleMO) || []) pts.push(`Main-d'œuvre peut-être comptée deux fois : « ${n} » est saisie à la main alors que le métré calcule déjà la main-d'œuvre. Garde l'une des deux.`);
  const est = calc.lignes.filter((l) => l.est && l.tab === "produits").map((l) => l.nom);
  const duree = jours ? (t.delayMax > 0 && t.delayMax < jours ? `Le métré donne ${fmtD(jours)} jour${jours >= 2 ? "s" : ""} de chantier si tout se suit avec une seule équipe ; le devis annonce ${fmtD(t.delayMax)} jour${t.delayMax >= 2 ? "s" : ""} au plus.` : !(t.delayMax > 0) ? `Durée d'après ton métré : ${fmtD(jours)} jour${jours >= 2 ? "s" : ""} de chantier (une seule équipe, tout à la suite ; estimation).` : "") : "";
  if (duree) pts.push(duree);
  return `<div class="card" id="metrecontrole"><b>${pts.length ? `Métré : ${pts.length} point${pts.length > 1 ? "s" : ""} à regarder` : "Métré : rien à signaler"}</b>
    ${pts.length ? `<p class="hint">Ce sont des signalements : tu peux envoyer ton devis tel quel.</p>` : ""}
    ${pts.map((p) => `<div class="chk"><div class="dot d-verifier">!</div><div style="flex:1">${esc(p)}</div></div>`).join("")}
    ${est.length ? `<p class="hint" id="metreest"><b>Quantités estimées</b> (à ajuster selon ton chantier) : ${est.map(esc).join(", ")}. Les autres quantités sont exactes pour les dimensions et les pertes saisies.</p>` : ""}
    ${jours && !dis && !(t.delayMax > 0) ? `<button type="button" class="sec" data-act="metreDuree" data-j="${Math.ceil(jours)}">Écrire ${Math.ceil(jours)} jour${Math.ceil(jours) >= 2 ? "s" : ""} sur le devis</button>` : ""}
    ${H.Chk("q", "current.metre.imprimer", metre.imprimer !== false, "Imprimer le détail du métré à la fin du devis", { dis })}
    ${pts.length ? `<a class="btn sec" href="#/devis/${q.id}/1" style="margin-top:8px;display:block;text-align:center">Revoir le métré</a>` : ""}</div>`;
}

// Met à jour le calcul de l'ouvrage ouvert sans redessiner l'écran (le clavier reste ouvert pendant la saisie).
export function majResultat(q) {
  const el = typeof document !== "undefined" && document.getElementById("mresult"); if (!el) return;
  const s = st(), metier = H.metierOf(q), calc = M.calculer(q.current.metre, metier);
  for (const z of calc.zones) { const o = z.ouvrages.find((x) => x.id === s.o); if (o) { el.innerHTML = resultat(o); return; } }
}
