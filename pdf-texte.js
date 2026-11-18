// PDF en vrai texte (v41) : la page d'aperçu est mise en page à 794 px dans un cadre caché, puis chaque fond, filet,
// image et ligne de texte est redessiné dans le PDF. Le texte est sélectionnable et recherchable, le fichier est léger,
// et une page ne coupe jamais une ligne de tableau. Le contenu vient du même aperçu que l'écran : aucun montant recalculé.
import { jsPDF, makePdf } from "./pdf.js";

const W = 794; // largeur de mise en page (px), la même que l'ancien PDF image
const MARGE = 8, PAGE_W = 210, PAGE_H = 297; // mm
const K0 = (PAGE_W - 2 * MARGE) / W; // mm par px (pleine largeur)
const PT = 72 / 25.4; // pt par mm

// Polices standard du PDF (WinAnsi) : ce qui n'y existe pas est remplacé par un équivalent lisible, jamais supprimé.
const ANSI = /[^\x20-\x7e\xa0-\xffŒœŠšŸŽžƒˆ˜–—‘’‚“”„†‡•…‰‹›€™]/g;
export const versAnsi = (s) => String(s)
  .replace(/[      ]/g, " ").replace(/−/g, "–").replace(/☐/g, "[ ]").replace(/☑|☒/g, "[x]")
  .replace(/≤/g, "<=").replace(/≥/g, ">=").replace(/→/g, "->").replace(/✓|✔/g, "v").replace(/✕|✖/g, "x")
  .replace(ANSI, "?");

const couleur = (c) => { const m = String(c).match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
const visible = (c) => c && c.a > 0.02;

export async function makePdfTexte(source, sujet) {
  // 1. Cadre caché de 794 px : les règles « téléphone » (max-width) ne s'y appliquent pas.
  const fr = document.createElement("iframe");
  fr.setAttribute("aria-hidden", "true"); fr.tabIndex = -1;
  fr.style.cssText = `position:fixed;left:-20000px;top:0;width:${W}px;height:1200px;border:0;visibility:hidden`;
  document.body.appendChild(fr);
  try {
    const fd = fr.contentDocument; fd.open(); fd.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"></head><body style="margin:0;background:#fff"></body></html>'); fd.close();
    for (const s of document.querySelectorAll('style, link[rel="stylesheet"]')) fd.head.appendChild(s.cloneNode(true));
    const doc = source.cloneNode(true);
    Object.assign(doc.style, { width: W + "px", maxWidth: W + "px", margin: "0", boxShadow: "none", border: "0", borderRadius: "0", padding: "0" });
    doc.querySelectorAll(".noprint").forEach((e) => e.remove());
    fd.body.appendChild(doc);
    await Promise.all([...doc.querySelectorAll("img")].map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; }))));
    if (fd.fonts && fd.fonts.ready) await fd.fonts.ready;
    const win = fr.contentWindow, o = doc.getBoundingClientRect(), H = Math.ceil(o.height);
    const R = (rc) => ({ x: rc.left - o.left, y: rc.top - o.top, w: rc.width, h: rc.height });

    // 2. Coupures de page : sur un bord de ligne, de titre ou de paragraphe (même règle que l'ancien PDF).
    const coupes = new Set();
    doc.querySelectorAll("tr,h3,p,.note,li,:scope > *,:scope > * > *").forEach((e) => { const r = R(e.getBoundingClientRect()); coupes.add(Math.round(r.y)); coupes.add(Math.round(r.y + r.h)); });
    const cs = [...coupes].filter((v) => v > 0).sort((a, b) => a - b);
    // Un devis qui dépasse d'à peine 10 % tient sur une page, légèrement réduit (comme l'ancien PDF), au lieu d'envoyer
    // les seules signatures sur une deuxième page.
    const hauteurPage = Math.floor((PAGE_H - 2 * MARGE) / K0), pages = [];
    const unePage = H > hauteurPage && H <= hauteurPage * 1.1, K = unePage ? (PAGE_H - 2 * MARGE) / H : K0, DX = unePage ? (PAGE_W - 2 * MARGE - W * K) / 2 : 0;
    // Un tableau qui continue sur la page suivante y répète sa ligne de titres (Désignation, Quantité…).
    const tables = [...doc.querySelectorAll("table")].map((tb) => { const tr = [...tb.querySelectorAll("tr")].find((r) => r.querySelector("th")); if (!tr) return null; const a = R(tb.getBoundingClientRect()), h = R(tr.getBoundingClientRect()); return { y0: a.y, y1: a.y + a.h, hy: h.y, hh: h.h }; }).filter(Boolean);
    const enteteA = (c) => tables.find((t) => c > t.hy + t.hh + 1 && c < t.y1 - 1) || null;
    if (unePage) pages.push([0, H, null]);
    else for (let c = 0; c < H - 2;) {
      const ent = c > 0 ? enteteA(c) : null, dispo = hauteurPage - (ent ? ent.hh : 0);
      let x = Math.min(c + dispo, H);
      if (x < H) { let y = 0; for (const v of cs) if (v <= x && v > c + dispo * 0.4) y = v; if (y) x = y; }
      pages.push([c, x, ent]); c = x;
    }

    // 3. Ce qu'il faut dessiner : fonds, filets, images, puces, et le texte ligne par ligne.
    const boites = [], textes = [];
    const tous = [doc, ...doc.querySelectorAll("*")];
    for (const e of tous) {
      const st = win.getComputedStyle(e); if (st.display === "none" || st.visibility === "hidden") continue;
      const r = R(e.getBoundingClientRect()); if (!r.w || !r.h) continue;
      const bg = couleur(st.backgroundColor), rad = parseFloat(st.borderTopLeftRadius) || 0;
      const bords = ["Top", "Right", "Bottom", "Left"].map((s) => ({ s, w: parseFloat(st[`border${s}Width`]) || 0, c: couleur(st[`border${s}Color`]), style: st[`border${s}Style`] })).filter((b) => b.w > 0 && b.style !== "none" && visible(b.c));
      if (visible(bg) || bords.length) boites.push({ r, bg: visible(bg) ? bg : null, rad, bords });
      if (e.tagName === "IMG" && e.src) boites.push({ r, img: e });
      if (e.tagName === "LI" && st.listStyleType !== "none") textes.push({ t: "•", x: r.x - 12, y: r.y, h: parseFloat(st.lineHeight) || r.h, taille: parseFloat(st.fontSize), gras: false, ital: false, col: couleur(st.color), larg: null });
      for (const ps of ["::before", "::after"]) { // petits filets décoratifs posés en absolu (barre jaune sous l'en-tête)
        const p = win.getComputedStyle(e, ps); if (p.content === "none" || p.position !== "absolute") continue; const pb = couleur(p.backgroundColor); if (!visible(pb)) continue;
        const pw = parseFloat(p.width), ph = parseFloat(p.height); if (!(pw > 0 && ph > 0)) continue;
        const left = p.left !== "auto" ? parseFloat(p.left) : r.w - parseFloat(p.right) - pw, top = p.top !== "auto" ? parseFloat(p.top) : r.h - parseFloat(p.bottom) - ph;
        boites.push({ r: { x: r.x + left, y: r.y + top, w: pw, h: ph }, bg: pb, rad: parseFloat(p.borderTopLeftRadius) || 0, bords: [] });
      }
    }
    const tw = fd.createTreeWalker(doc, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const brut = n.nodeValue; if (!brut.trim()) continue;
      const el = n.parentElement, st = win.getComputedStyle(el); if (st.visibility === "hidden" || st.display === "none") continue;
      const maj = st.textTransform === "uppercase", gras = parseInt(st.fontWeight, 10) >= 600 || st.fontWeight === "bold", ital = st.fontStyle === "italic", taille = parseFloat(st.fontSize), col = couleur(st.color);
      // mots et leur position : on regroupe les mots d'une même ligne affichée
      const re = /\S+/g; let m, ligne = null;
      const fin = () => { if (ligne) textes.push(ligne); ligne = null; };
      while ((m = re.exec(brut))) {
        const rg = fd.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
        const rects = [...rg.getClientRects()].filter((q) => q.width > 0); if (!rects.length) continue;
        const a = R(rects[0]), z = R(rects[rects.length - 1]);
        if (rects.length > 1 && Math.abs(a.y - z.y) > 2) { fin(); textes.push({ t: m[0], x: a.x, y: a.y, h: a.h, taille, gras, ital, col, larg: null, maj }); continue; } // mot coupé (rare)
        if (ligne && Math.abs(ligne.y - a.y) <= 2 && a.x >= ligne.x) { ligne.t += " " + m[0]; ligne.larg = z.x + z.w - ligne.x; }
        else { fin(); ligne = { t: m[0], x: a.x, y: a.y, h: a.h, taille, gras, ital, col, larg: z.x + z.w - a.x, maj, esp: m.index > 0 }; }
      }
      fin();
    }

    // 4. Dessin page par page
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    if (sujet) pdf.setProperties({ subject: sujet, title: "Devis" });
    const mm = (v) => v * K, X = (px) => MARGE + DX + mm(px);
    const dessine = (c, x, Y) => {
      for (const b of boites) {
        const y0 = Math.max(b.r.y, c), y1 = Math.min(b.r.y + b.r.h, x); if (y1 <= y0 + 0.01) continue;
        if (b.img) { if (b.r.y >= c - 1 && b.r.y + b.r.h <= x + 1) { try { pdf.addImage(b.img, X(b.r.x), Y(b.r.y), mm(b.r.w), mm(b.r.h)); } catch {} } continue; }
        if (b.bg) {
          pdf.setFillColor(b.bg.r, b.bg.g, b.bg.b);
          const entier = b.r.y >= c && b.r.y + b.r.h <= x;
          if (b.rad > 0 && entier) pdf.roundedRect(X(b.r.x), Y(y0), mm(b.r.w), mm(y1 - y0), mm(b.rad), mm(b.rad), "F"); else pdf.rect(X(b.r.x), Y(y0), mm(b.r.w), mm(y1 - y0), "F");
        }
        for (const bd of b.bords) {
          pdf.setDrawColor(bd.c.r, bd.c.g, bd.c.b); pdf.setLineWidth(Math.max(mm(bd.w), 0.1)); pdf.setLineDashPattern(bd.style === "dashed" ? [1.2, 1] : bd.style === "dotted" ? [0.3, 0.6] : [], 0);
          const L = X(b.r.x), Rr = X(b.r.x + b.r.w), T = b.r.y, B = b.r.y + b.r.h, dh = mm(bd.w) / 2;
          if (bd.s === "Top" && T >= c && T < x) pdf.line(L, Y(T) + dh, Rr, Y(T) + dh);
          if (bd.s === "Bottom" && B > c && B <= x) pdf.line(L, Y(B) - dh, Rr, Y(B) - dh);
          if (bd.s === "Left") pdf.line(L + dh, Y(y0), L + dh, Y(y1));
          if (bd.s === "Right") pdf.line(Rr - dh, Y(y0), Rr - dh, Y(y1));
        }
        pdf.setLineDashPattern([], 0);
      }
      for (const t of textes) {
        if (!(t.y >= c - 0.5 && t.y < x - 0.5)) continue;
        const style = t.gras && t.ital ? "bolditalic" : t.gras ? "bold" : t.ital ? "italic" : "normal";
        pdf.setFont("helvetica", style); const pts = t.taille * K * PT; pdf.setFontSize(pts);
        if (t.col) pdf.setTextColor(t.col.r, t.col.g, t.col.b);
        const brut = versAnsi(t.maj ? t.t.toUpperCase() : t.t);
        const base = Y(t.y) + mm(t.h) * 0.78;
        // ² et ³ : dessinés en petit et surélevés (certains lecteurs n'affichent pas ces signes en police standard)
        const morceaux = brut.split(/([²³¹])/);
        const largeurTexte = morceaux.reduce((s, p) => s + (/^[²³¹]$/.test(p) ? pdf.getTextWidth("2") * 0.7 : pdf.getTextWidth(p)), 0);
        const hs = t.larg && largeurTexte > 0 ? Math.max(0.75, Math.min(1.25, mm(t.larg) / largeurTexte)) : 1;
        let cx = X(t.x);
        // Espace qui sépare ce morceau du précédent (« <b>CFA</b> (123… ») : dessiné, pour que le texte copié garde l'espace.
        if (t.esp && morceaux[0]) { cx -= pdf.getTextWidth(" ") * hs; morceaux[0] = " " + morceaux[0]; }
        for (const p of morceaux) {
          if (!p) continue;
          if (/^[²³¹]$/.test(p)) { pdf.setFontSize(pts * 0.7); const ch = p === "²" ? "2" : p === "³" ? "3" : "1"; pdf.text(ch, cx, base - mm(t.taille) * 0.33, { horizontalScale: hs }); cx += pdf.getTextWidth(ch) * hs; pdf.setFontSize(pts); }
          else { pdf.text(p, cx, base, { horizontalScale: hs }); cx += pdf.getTextWidth(p) * hs; }
        }
      }
    };
    pages.forEach(([c, x, ent], i) => {
      if (i) pdf.addPage();
      const dh = ent ? ent.hh : 0;
      if (ent) dessine(ent.hy, ent.hy + ent.hh, (px) => MARGE + mm(px - ent.hy)); // titres du tableau répétés en haut
      dessine(c, x, (px) => MARGE + mm(px - c + dh));
      if (pages.length > 1) { pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(110, 110, 110); pdf.text(`Page ${i + 1} / ${pages.length}`, PAGE_W - MARGE, PAGE_H - 3, { align: "right" }); }
    });
    return pdf.output("arraybuffer");
  } finally { fr.remove(); }
}

// Repli : si le dessin en texte échoue sur un téléphone, l'ancien PDF image est produit (jamais d'échec silencieux).
export async function creerPdf(source, sujet) {
  try { return { data: await makePdfTexte(source, sujet), texte: true }; }
  catch (e) { console.warn("PDF texte impossible, PDF image produit :", e); return { data: await makePdf(source, sujet), texte: false }; }
}
