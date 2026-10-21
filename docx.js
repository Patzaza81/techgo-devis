// Export Word (.docx) d'un devis FIGÉ. Aucun calcul ici : tous les montants viennent de snap.result (le même objet que le PDF).
// Le fichier est produit sans dépendance : un zip « stocké » écrit à la main, au contenu déterministe (mêmes données → mêmes octets).
import { fmt, fmtN, fmtD, frDate, toWordsFr, exclusions, legalLine } from "./ui-doc.js";
import { effSurface, surfaceSource } from "./packs.js";

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// ---------- zip (méthode « stored », sans compression) ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const enc = new TextEncoder();
export function zip(files) { // files: [{ name, data: Uint8Array }]
  const parts = [], cen = []; let off = 0;
  const DT = 0x0021, TM = 0; // 01/01/1980 00:00
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, TM, true); lh.setUint16(12, DT, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, TM, true); ch.setUint16(14, DT, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, name.length, true); ch.setUint32(42, off, true);
    cen.push(new Uint8Array(ch.buffer), name);
    off += 30 + name.length + sz;
  }
  const cenSize = cen.reduce((a, b) => a + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true); end.setUint32(12, cenSize, true); end.setUint32(16, off, true);
  const all = [...parts, ...cen, new Uint8Array(end.buffer)]; const out = new Uint8Array(all.reduce((a, b) => a + b.length, 0)); let p = 0;
  for (const b of all) { out.set(b, p); p += b.length; }
  return out;
}

// ---------- XML ----------
const X = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}<w:sz w:val="${o.sz || 20}"/></w:rPr><w:t xml:space="preserve">${X(t)}</w:t></w:r>`;
const para = (inner, o = {}) => `<w:p><w:pPr><w:spacing w:before="${o.before ?? 60}" w:after="${o.after ?? 60}"/>${o.jc ? `<w:jc w:val="${o.jc}"/>` : ""}</w:pPr>${inner}</w:p>`;
const txt = (t, o = {}) => para(run(t, o), o);
const h3 = (t, acc) => para(run(t.toUpperCase(), { b: 1, color: acc, sz: 22 }), { before: 240, after: 80 });
const cell = (inner, w, o = {}) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ""}${o.span ? `<w:gridSpan w:val="${o.span}"/>` : ""}</w:tcPr>${inner}</w:tc>`;
const row = (cells) => `<w:tr>${cells}</w:tr>`;
const table = (rows, widths) => `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map((s) => `<w:${s} w:val="single" w:sz="4" w:space="0" w:color="BBBBBB"/>`).join("")}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${rows.join("")}</w:tbl>` + para("", { before: 0, after: 0 });
const WIDTHS = [4600, 1700, 1600, 1738]; // désignation, quantité, P.U., total
const headRow = (acc, labels = ["Désignation", "Quantité", "P.U. (FCFA)", "Total HT"]) => row(labels.map((l, i) => cell(para(run(l, { b: 1, color: "FFFFFF", sz: 18 }), { jc: i ? "right" : "left" }), WIDTHS[i], { fill: acc })));
const lineRow = (cells) => row(cells.map((c, i) => cell(c, WIDTHS[i])));
const subRow = (label, amount, acc) => row([cell(para(run(label, { b: 1, sz: 18 }), {}), WIDTHS[0] + WIDTHS[1] + WIDTHS[2], { fill: "EEEEEE", span: 3 }), cell(para(run(amount, { b: 1, sz: 18 }), { jc: "right" }), WIDTHS[3], { fill: "EEEEEE" })]);
const plainRow = (label, amount) => row([cell(para(run(label, { sz: 18 })), WIDTHS[0] + WIDTHS[1] + WIDTHS[2], { span: 3 }), cell(para(run(amount, { sz: 18 }), { jc: "right" }), WIDTHS[3])]);

function groupRows(lines, acc) {
  const out = [];
  for (const g of [...new Set(lines.map((l) => l.group))]) {
    const ls = lines.filter((l) => l.group === g);
    out.push(row([cell(para(run(g, { b: 1, sz: 18 })), WIDTHS.reduce((a, b) => a + b, 0), { fill: "F3F3F3", span: 4 })]));
    for (const l of ls) out.push(lineRow([
      para(run(l.label, { b: 1, sz: 18 }), { before: 20, after: 0 }) + (l.role ? para(run(l.role, { sz: 15, color: "666666" }), { before: 0, after: 20 }) : ""),
      para(run(`${fmtN(l.qty)} ${l.unit}`, { sz: 18 }), { jc: "right" }), para(run(fmtN(l.price), { sz: 18 }), { jc: "right" }), para(run(fmtN(l.total), { sz: 18 }), { jc: "right" })]));
    out.push(subRow(`Sous-total — ${g}`, fmtN(ls.reduce((a, l) => a + (l.total ?? 0), 0)), acc));
  }
  return out;
}

function parseDataUrl(u) {
  const m = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(u || ""); if (!m) return null;
  const bin = atob(m[2]); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
  return { ext: m[1] === "png" ? "png" : "jpeg", bytes: b };
}

/** snap = version figée (avec n, at, hash, presentation). Retourne { bytes, text } : les octets du .docx et le texte brut (pour les tests). */
export function buildDocx(snap, ref = "") {
  if (!snap || !snap.n || !snap.hash) throw new Error("L'export Word se fait depuis une version figée.");
  const q = snap.quote, r = snap.result, c = snap.company, t = r.totals, vat = q.terms.vatPct, pres = snap.presentation || {};
  const acc = /^#[0-9a-fA-F]{6}$/.test(pres.color || "") ? pres.color.slice(1).toUpperCase() : "0B7A8C";
  const shown = r.lines.filter((l) => !(l.mode === "equip" && l.total === 0));
  const base = shown.filter((l) => !l.option), opt = shown.filter((l) => l.option), hasOpt = opt.length > 0;
  const ohLabel = q.overhead && q.overhead.mode === "ligne" && q.overhead.pct > 0;
  const sc = r.schedules, nPay = sc.base.combined.length, trig = q.terms.triggers || [];
  const refTxt = `${ref || q.ref} — V${snap.n}`;
  const logo = parseDataUrl(pres.logo);
  const sNet = effSurface(q.site);
  const tail = (sub, oh, disc, net, v, ttc) => [
    subRow("Sous-total HT", fmtN(sub), acc),
    ...(ohLabel ? [plainRow(`Frais généraux (${q.overhead.pct} %)`, fmtN(oh))] : []),
    ...(disc ? [plainRow(`Remise${q.discount.pct > 0 ? " (" + q.discount.pct + " %)" : ""}`, "− " + fmtN(disc))] : []),
    subRow("TOTAL HT", fmtN(net), acc),
    ...(v === null ? [] : [plainRow(`TVA ${vat} %`, fmtN(v)), subRow("TOTAL TTC", fmtN(ttc), acc)]),
  ];
  const body = [];
  // en-tête
  let drawing = "";
  if (logo) {
    const H = 576000, W = pres.logoW > 0 && pres.logoH > 0 ? Math.round((H * pres.logoW) / pres.logoH) : H;
    drawing = `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${W}" cy="${H}"/><wp:docPr id="1" name="Logo"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W}" cy="${H}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  }
  if (drawing) body.push(para(drawing, { before: 0, after: 60 }));
  body.push(txt(c.name, { b: 1, sz: 26, color: acc, before: 0, after: 0 }));
  body.push(txt([c.tagline, c.address, c.phone ? "Tél. " + c.phone : "", c.whatsapp ? "WhatsApp " + c.whatsapp : "", c.web].filter(Boolean).join(" — "), { sz: 16, color: "666666", before: 0 }));
  body.push(txt(`Copie modifiable de la version V${snap.n}. Le PDF et la version figée font foi : pour changer un montant, créer une nouvelle version dans l'application.`, { i: 1, sz: 16, color: "B00020" }));
  body.push(txt("DEVIS ESTIMATIF", { b: 1, sz: 40, color: acc, before: 200 }));
  const meta = [["RÉFÉRENCE", refTxt], ["DATE", frDate(snap.at)], ["VALIDITÉ", `${q.validityDays ?? "…"} jours`], ["SURFACE / QUANTITÉ DE BASE", `${fmtD(sNet)} m²`], ["CLIENT", q.client.name || "........................"], ["CHANTIER", q.site.name + (q.site.address ? " — " + q.site.address : "")], ...(c.responsible ? [["RESPONSABLE CHANTIER", c.responsible + (c.responsiblePhone ? " — " + c.responsiblePhone : "")]] : [])];
  body.push(table(meta.map(([k, v]) => row([cell(para(run(k, { b: 1, sz: 16, color: "666666" })), 3200), cell(para(run(v, { sz: 18 })), 6438)])), [3200, 6438]));
  body.push(table([row([cell(para(run(`TOTAL OFFRE DE BASE${vat === null ? " (hors taxes)" : " (HT)"} : ${fmt(t.base)}`, { b: 1, sz: 26, color: "FFFFFF" })) + (vat === null ? "" : para(run(`Total TTC : ${fmt(t.ttcBase)}`, { b: 1, sz: 22, color: "FFFFFF" }))) + (hasOpt ? para(run(`Avec option${vat === null ? "" : " (HT)"} : ${fmt(t.withOption)}`, { b: 1, sz: 22, color: "FFE08A" })) : ""), 9638, { fill: acc })])], [9638]));
  body.push(h3("Base de calcul des quantités", acc));
  body.push(txt(`Quantité ou surface de base : ${fmtD(sNet)} m²${surfaceSource(q.site) === "brute − ouvertures" ? ` (surface brute ${fmtD(q.site.surfaceBrute)} m² − ouvertures ${fmtD(q.site.ouvertures ?? 0)} m²)` : ""}. Marge de sécurité sur les produits : ${q.site.lossPct ?? 0} % (pertes, reprises, irrégularités du support) — surface de calcul : ${r.calcSurface.toLocaleString("fr-FR")} m². Quantité de produit = surface de calcul ÷ rendement, arrondie à l'unité de conditionnement supérieure. La main-d'œuvre est calculée sur la surface réelle.`, { sz: 17 }));
  body.push(h3("Offre de base", acc));
  body.push(table([headRow(acc), ...groupRows(base, acc), ...tail(t.subBase, t.overheadBase, t.discountBase, t.base, t.vatBase, t.ttcBase)], WIDTHS));
  if (hasOpt) {
    body.push(h3("Option non obligatoire", acc));
    body.push(table([headRow(acc), ...groupRows(opt, acc), subRow("SOUS-TOTAL OPTION", fmtN(t.matOpt + t.svcOpt), acc), ...tail(t.subOption, t.overheadOption, t.discountOption, t.withOption, t.vatOption, t.ttcOption)], WIDTHS));
  }
  body.push(h3("Synthèse financière", acc));
  body.push(table([plainRow("Fournitures et consommables (offre de base)", fmt(t.matBase)), plainRow("Main-d'œuvre, équipements et services (offre de base)", fmt(t.svcBase)), subRow("Total offre de base (HT)", fmt(t.base), acc),
    ...(hasOpt ? [plainRow("Option (HT)", fmt(t.withOption - t.base)), subRow("Total offre de base + option (HT)", fmt(t.withOption), acc)] : [])], WIDTHS));
  body.push(txt(`Arrêté le présent devis, offre de base, à la somme de ${toWordsFr(t.base)} (${fmtN(t.base)}) francs CFA hors taxes${hasOpt ? `; avec option, à la somme de ${toWordsFr(t.withOption)} (${fmtN(t.withOption)}) francs CFA hors taxes` : ""}.`, { sz: 17 }));
  const excl = exclusions(q.decisions);
  if (excl.length || q.notes) { body.push(h3("Périmètre, hypothèses et exclusions", acc)); excl.forEach((e) => body.push(txt("• " + e, { sz: 17 }))); if (q.notes) body.push(txt("• " + q.notes, { sz: 17 })); }
  body.push(h3("Délai", acc));
  body.push(txt(`${q.terms.delayMin ?? "…"} jours minimum à ${q.terms.delayMax ?? "…"} jours maximum, à compter du démarrage effectif des travaux sur site.`, { sz: 17 }));
  body.push(h3("Modalités de paiement", acc));
  const cols = ["Versement", "Offre de base (HT)", ...(hasOpt ? ["Avec option (HT)"] : []), ...(vat === null ? [] : ["Base TTC"]), "Déclenchement"];
  const used = cols.length, tot = 9638, fixed = 1100, per = Math.floor((tot - fixed - 2600) / Math.max(1, used - 2)); const W2 = cols.map((_, i) => (i === 0 ? fixed : i === used - 1 ? 2600 : per));
  W2[used - 1] += tot - W2.reduce((a, b) => a + b, 0);
  const prow = (vals, o = {}) => row(vals.map((v, i) => cell(para(run(v, { sz: 18, b: o.b }), { jc: i && i < used - 1 ? "right" : "left" }), W2[i], o.fill ? { fill: o.fill } : {})));
  body.push(table([row(cols.map((l, i) => cell(para(run(l, { b: 1, color: "FFFFFF", sz: 18 }), { jc: i && i < used - 1 ? "right" : "left" }), W2[i], { fill: acc }))),
    ...Array.from({ length: nPay }, (_, i) => prow([String(i + 1), fmtN(sc.base.combined[i]), ...(hasOpt ? [fmtN(sc.option.combined[i])] : []), ...(vat === null ? [] : [fmtN(sc.base.ttc[i])]), trig[i] || ""])),
    prow(["Total", fmtN(sc.base.combined.reduce((a, b) => a + b, 0)), ...(hasOpt ? [fmtN(sc.option.combined.reduce((a, b) => a + b, 0))] : []), ...(vat === null ? [] : [fmtN(sc.base.ttc.reduce((a, b) => a + b, 0))]), ""], { b: 1, fill: "EEEEEE" })], W2));
  body.push(txt(`Fournitures : ${(q.terms.payment.materials || []).join(" / ")} % · Main-d'œuvre et services : ${(q.terms.payment.services || []).join(" / ")} %.`, { sz: 17 }));
  if ((snap.conditions || []).length) { body.push(h3("Conditions de l'offre", acc)); snap.conditions.forEach((x) => body.push(txt("• " + x, { sz: 17 }))); }
  body.push(h3("Choix du client et signatures", acc));
  body.push(txt(`☐ Offre de base seule — ${fmt(t.base)}`));
  if (hasOpt) body.push(txt(`☐ Offre de base + option — ${fmt(t.withOption)}`));
  body.push(table([row([
    cell(para(run("POUR LE CLIENT — Bon pour accord", { b: 1, sz: 18 })) + para(run("Date : ____/____/______", { sz: 18 })) + para("") + para(run("____________________________", { sz: 18 })) + para(run("Nom, signature et mention « Bon pour accord »", { sz: 15, color: "666666" })), 4819),
    cell(para(run(`POUR ${c.name}`, { b: 1, sz: 18 })) + para(run(`Date : ${frDate(snap.at)}`, { sz: 18 })) + para("") + para(run("____________________________", { sz: 18 })) + para(run(`${c.responsible || ""} — Signature & cachet`, { sz: 15, color: "666666" })), 4819)])], [4819, 4819]));
  if (legalLine(c)) body.push(txt(legalLine(c), { sz: 14, color: "666666" }));
  body.push(txt(`Empreinte de contrôle : ${snap.hash} (vérifie l'intégrité du document ; ne remplace pas une signature électronique).`, { sz: 14, color: "666666" }));

  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${body.join("")}<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const fld = (code) => `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${code} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;
  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}><w:p><w:pPr><w:jc w:val="center"/></w:pPr>${run(`${c.name} — ${refTxt} — copie modifiable — page `, { sz: 14, color: "666666" })}${fld("PAGE")}${run(" / ", { sz: 14 })}${fld("NUMPAGES")}</w:p></w:ftr>`;
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="20"/><w:lang w:val="fr-FR"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${logo ? `<Default Extension="${logo.ext}" ContentType="image/${logo.ext}"/>` : ""}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${logo ? `<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.${logo.ext}"/>` : ""}</Relationships>`;
  const f = (name, s) => ({ name, data: enc.encode(s) });
  const files = [f("[Content_Types].xml", ct), f("_rels/.rels", rels), f("word/document.xml", documentXml), f("word/_rels/document.xml.rels", docRels), f("word/styles.xml", stylesXml), f("word/footer1.xml", footerXml)];
  if (logo) files.push({ name: `word/media/logo.${logo.ext}`, data: logo.bytes });
  const text = documentXml.replace(/<\/w:p>/g, "\n").replace(/<\/w:tc>/g, " | ").replace(/<[^>]+>/g, "");
  return { bytes: zip(files), text, documentXml };
}
