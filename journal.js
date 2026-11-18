// Journal d'essai (tests avec de vrais artisans) — v41.
// Activé seulement par le lien « ?essai=1 » (désactivé par « ?essai=0 »). Rien ne sort du téléphone :
// l'observateur exporte le fichier CSV depuis Réglages. On note QUOI (écran, nom du bouton, nom du champ, erreur)
// et QUAND, jamais le contenu saisi (ni nom de client, ni téléphone, ni prix).
const CLE_ACTIF = "techgo-essai-actif", CLE = "techgo-essai-journal", MAX = 5000;
const lire = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, v); } catch { /* stockage plein ou interdit : on n'empêche jamais l'application de marcher */ } };

export function lireParametre(search = location.search) {
  const m = /[?&]essai=([01])\b/.exec(search || "");
  if (m) ecrire(CLE_ACTIF, m[1]);
}
export const actif = () => lire(CLE_ACTIF) === "1";
export function entrees() { try { return JSON.parse(lire(CLE) || "[]"); } catch { return []; } }
// Écran sans identifiant de devis (« #/devis/abc123/2 » → « #/devis/x/2 »).
export const ecran = (h) => String(h || "#/").replace(/(#\/devis\/)[^/]+/, "$1x");
export function noter(type, detail = "") {
  if (!actif()) return;
  const j = entrees(); j.push([new Date().toISOString(), type, String(detail).slice(0, 120)]);
  ecrire(CLE, JSON.stringify(j.slice(-MAX)));
}
export function effacer() { ecrire(CLE, "[]"); }
export function arreter() { ecrire(CLE_ACTIF, "0"); }
const champCsv = (s) => (/[;"\n]/.test(s) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
export function csv(j = entrees()) {
  return "﻿heure;type;détail\n" + j.map((e) => e.map(champCsv).join(";")).join("\n") + "\n";
}
// Branchement : un seul appel au démarrage de l'application.
export function brancher(doc = document, win = window) {
  lireParametre(win.location.search);
  if (!actif()) return;
  noter("début", `${win.innerWidth}×${win.innerHeight} ${/iPhone|iPad/.test(navigator.userAgent) ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "autre"}`);
  noter("écran", ecran(win.location.hash));
  win.addEventListener("hashchange", () => noter("écran", ecran(win.location.hash)));
  doc.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-act]");
    if (b) noter("bouton", b.dataset.act + (b.dataset.to ? ":" + b.dataset.to : "") + (b.dataset.k && b.dataset.k.length < 30 ? ":" + b.dataset.k : ""));
  }, true);
  doc.addEventListener("change", (e) => { const p = e.target && e.target.dataset && e.target.dataset.p; if (p) noter("saisie", p); }, true);
  win.addEventListener("error", (e) => noter("erreur", e.message || "erreur"));
  win.addEventListener("unhandledrejection", (e) => noter("erreur", (e.reason && e.reason.message) || "promesse rejetée"));
}
