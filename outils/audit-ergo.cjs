// Campagne d'audit ergonomique : 100 profils simulés × 5 métiers = 500 parcours, dans Chromium, écran de téléphone.
//
// CE QUE C'EST : des utilisateurs SIMULÉS (personnages avec un niveau informatique, un niveau de métier, des habitudes
// de saisie, une patience). Chaque parcours se joue uniquement par l'interface : toucher, taper au clavier, défiler,
// revenir en arrière, recharger la page. Aucun appel de fonction interne, aucun sélecteur technique (data-p, data-act) pour
// AGIR : les éléments sont trouvés par leur texte visible, comme le ferait une personne.
// CE QUE CE N'EST PAS : un test humain. Les « hésitations » sont détectées par des règles écrites ici (voir RÈGLES) ;
// elles repèrent des défauts de structure (cible introuvable, bouton sans effet, mot technique, erreur muette),
// pas ce qu'une vraie personne comprend ou non. Le temps est un temps MODÉLISÉ, pas un chronomètre humain.
//
//   python3 -m http.server 8123 &      puis
//   PW=/chemin/@playwright/test node outils/audit-ergo.cjs --n=100 --out=/tmp/audit-avant [--metier=peinture] [--workers=4]
const { chromium } = require(process.env.PW || "@playwright/test");
const fs = require("fs");
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith("--" + k + "=")); return a ? a.split("=")[1] : d; };
const N = +arg("n", 100), OUT = arg("out", "/tmp/audit"), WORKERS = +arg("workers", 4), SEED = +arg("seed", 20261116);
const ONLY = arg("metier", ""), ID = arg("id", ""), SHOTS = arg("shots", ""), URL0 = arg("url", "http://localhost:8123/index.html"), LARG = arg("largeurs", "360,390,414").split(",").map(Number);
const METIERS = ["peinture", "carrelage", "maconnerie", "plomberie", "electricite"].filter((m) => !ONLY || ONLY.split(",").includes(m));
const NOM_METIER = { peinture: "Peinture", carrelage: "Carrelage", maconnerie: "Maçonnerie", plomberie: "Plomberie", electricite: "Électricité" };
fs.mkdirSync(OUT, { recursive: true });

// ---------- aléa reproductible ----------
function prng(s) { let a = s >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = (r, a) => a[Math.floor(r() * a.length)];

// ---------- RÈGLES (modèle de personnage ; hypothèses d'expert, pas des mesures humaines) ----------
// info : 1 = débutant complet (WhatsApp seulement, tape lentement, ne cherche pas au-delà de 2 écrans, touche vite « Continuer »),
//        2 = débutant, 3 = à l'aise, 4 = très à l'aise.   metierNiv : 1 apprenti, 2 compétent, 3 expérimenté (connaît les consommations).
const PROFILS = {
  1: { patience: 14, ecransMax: 2, vitesseFrappe: 0.7, formats: ["fr", "fr", "point", "unite", "milliers"], pBouton: 0.7, pRetour: 0.25, pRecharge: 0.15, pSaute: 0.3, pFauxTap: 0.06 },
  2: { patience: 22, ecransMax: 3, vitesseFrappe: 0.45, formats: ["fr", "fr", "point", "unite"], pBouton: 0.5, pRetour: 0.2, pRecharge: 0.1, pSaute: 0.18, pFauxTap: 0.03 },
  3: { patience: 35, ecransMax: 5, vitesseFrappe: 0.3, formats: ["fr", "point"], pBouton: 0.25, pRetour: 0.12, pRecharge: 0.05, pSaute: 0.08, pFauxTap: 0.01 },
  4: { patience: 50, ecransMax: 8, vitesseFrappe: 0.2, formats: ["fr", "point"], pBouton: 0.1, pRetour: 0.08, pRecharge: 0.03, pSaute: 0.03, pFauxTap: 0.005 },
};
// Vocabulaire : un mot technique n'est « compris » que si le niveau de métier le permet (1 : mots du quotidien seulement).
const TECH = [
  [/dosage|chape|chaînage|semelle|poteau|poutre|armature|barres? filantes?|cadres?|ancrages?|attentes?|espacement/i, 2],
  [/kg par m|par m³|ciment par|sable par|gravier par|sac de ciment|colle\s*:|joint\s*:/i, 3],
  [/chutes?|pertes?|casse et coupes|recouvrement|couverture|rendement/i, 2],
  [/section|conduit|gaine|fils tirés|raccordement|couronne|manchon|réduction|té\b|bornier|peigne|différentiel|disjoncteur|piquet/i, 2],
  [/contenance|multiprim|soytex|pancoat|stucco|flintkote/i, 1],
  [/nombre de surfaces identiques|éléments identiques|lignes identiques|fouilles identiques/i, 1],
  [/main-d'œuvre|comment tu la factures|présentation du devis|express|détaillé|tva|remise|figer|version client|interne \(marge\)/i, 1],
];
const niveauMot = (txt) => { let n = 0; for (const [re, v] of TECH) if (re.test(txt)) n = Math.max(n, v); return n; };
// Un débutant complet en informatique comprend moins les mots d'interface (« figer », « version », « marge », « statut »).
const MOTS_UI = /figer|version|statut|brouillon|à vérifier|marge|synthèse|empreinte|archiver|dupliquer|restaurer|exporter/i;

// ---------- génération des personnages ----------
function personnages(metier, r0) {
  const L = [];
  for (let i = 0; i < N; i++) {
    const r = prng(SEED + METIERS.indexOf(metier) * 100003 + i * 7919);
    const info = i % 100 < 25 ? 1 : i % 100 < 55 ? 2 : i % 100 < 85 ? 3 : 4; // 25 % débutants complets, 30 % débutants, 30 % à l'aise, 15 % très à l'aise
    const metierNiv = pick(r, [1, 2, 2, 3, 3]);
    const largeur = LARG[i % LARG.length];
    L.push({ id: `${metier}-${String(i + 1).padStart(3, "0")}`, metier, info, metierNiv, largeur, hauteur: largeur === 360 ? 740 : largeur === 390 ? 800 : 860, seed: SEED + i * 31 + METIERS.indexOf(metier), voie: i % 5 === 4 ? "produits" : "metre", rang: i, profil: "technicien", ...PROFILS[info] });
  }
  return L;
}

// ---------- chantiers d'essai : un plan par métier, tournant sur tous les ouvrages et tous les modes de main-d'œuvre ----------
// valeurs d'ESSAI plausibles, jamais des références. « v » : libellé visible → valeur ; « prix » : prix d'essai par mot de la ligne.
const PLANS = {
  peinture: [
    { type: "Pièce : murs et plafond", champs: { "Longueur (m)": [3, 6], "Largeur (m)": [2.5, 5], "Hauteur des murs (m)": [2.4, 3.2] }, ouvertures: 1, produits: ["Peinture acrylique"], pertes: 5 },
    { type: "Mur, façade, plafond ou porte", champs: { "Longueur (m)": [4, 12], "Hauteur ou largeur (m)": [2.5, 4], "Nombre de surfaces identiques": [1, 3], "Faces à peindre (1 ou 2)": [1, 2] }, ouvertures: 0, produits: ["Peinture extérieure"], pertes: 8 },
    { type: "Surface déjà mesurée", champs: { "Surface à peindre (m²)": [20, 90] }, produits: ["Peinture intérieure", "Sous-couche"], pertes: 5 },
  ],
  carrelage: [
    { type: "Sol d'une pièce", champs: { "Longueur (m)": [3, 7], "Largeur (m)": [2.5, 5], "Nom du carreau": "Grès 60×60", "Longueur d'un carreau (cm)": 60, "Largeur d'un carreau (cm)": 60, "Nombre de carreaux par carton": 4, "Casse et coupes (%)": 10, "Colle : kg par m² — vide si pas de colle": 5, "Joint : kg par m² — vide si pas de joint": 0.5 }, plinthes: true },
    { type: "Mur (faïence)", champs: { "Longueur de mur à carreler (m)": [2, 6], "Hauteur de pose (m)": [1.2, 2.4], "Nom du carreau": "Faïence 30×60", "Longueur d'un carreau (cm)": 60, "Largeur d'un carreau (cm)": 30, "Nombre de carreaux par carton": 8, "Casse et coupes (%)": 10 }, ouvertures: 1 },
    { type: "Surface déjà mesurée", champs: { "Surface à carreler (m²)": [8, 45], "Nom du carreau": "Carreau 40×40", "Longueur d'un carreau (cm)": 40, "Largeur d'un carreau (cm)": 40, "Nombre de carreaux par carton": 6, "Casse et coupes (%)": 8 } },
  ],
  maconnerie: [
    { type: "Mur en blocs", champs: { "Longueur (m)": [4, 14], "Hauteur (m)": [2, 3.2], "Nom du bloc": "Parpaing de 15", "Longueur d'un bloc (cm)": 40, "Hauteur d'un bloc (cm)": 20, "Épaisseur des joints (cm)": 1, "Casse et coupes de blocs (%)": 5 }, ouvertures: 1, mortier: true },
    { type: "Béton : semelle, poteau, poutre, chaînage, dalle", champs: { "Nom de l'élément": "Poteau", "Nombre d'éléments identiques": [2, 8], "Longueur ou hauteur d'un élément (m)": [2.5, 3.5], "Largeur de la section (cm)": 15, "Épaisseur ou hauteur de la section (cm)": 15, "Pertes de béton (%)": 5, "Ciment par m³ de béton (kg)": 350, "Poids d'un sac de ciment (kg)": 50, "Sable par m³ de béton (m³)": 0.45, "Gravier par m³ de béton (m³)": 0.85 } },
    { type: "Chape ou dallage", champs: { "Nombre de surfaces identiques": 1, "Longueur (m)": [3, 8], "Largeur (m)": [3, 6], "Épaisseur (cm)": 5, "Pertes (%)": 5, "Ciment par m³ de mortier ou béton (kg)": 350, "Poids d'un sac de ciment (kg)": 50, "Sable par m³ de mortier ou béton (m³)": 1 } },
    { type: "Enduit", champs: { "Longueur du mur (m)": [3, 10], "Hauteur du mur (m)": [2.4, 3], "Faces à enduire (1 ou 2)": [1, 2], "Épaisseur moyenne de l'enduit (cm)": 2, "Pertes d'enduit (%)": 10, "Ciment par m³ de mortier (kg)": 350, "Poids d'un sac de ciment (kg)": 50, "Sable par m³ de mortier (m³)": 1 } },
    { type: "Fouille ou terrassement", champs: { "Nombre de fouilles identiques": [1, 6], "Longueur (m)": [0.6, 1.2], "Largeur (m)": [0.6, 1.2], "Profondeur (m)": [0.6, 1.4] } },
    { type: "Armatures (d'après le plan)", champs: { "Nom": "Poteau", "Nombre d'éléments identiques": [2, 6], "Longueur d'un élément (m)": 3, "Longueur d'une barre du commerce (m)": 12 } },
  ],
  plomberie: [
    { type: "Réseau de tuyaux", champs: { "Longueur mesurée du tracé (m)": [6, 30], "Chutes de coupe (%)": 5, "Longueur d'une barre ou d'une couronne (m)": 4 }, raccords: ["Coude", "Té"] },
    { type: "Appareils et points d'eau", articles: ["WC", "Lavabo", "Douche"] },
  ],
  electricite: [
    { type: "Points d'une pièce", articles: ["Prise 2P+T", "Interrupteur simple", "Point lumineux"] },
    { type: "Ligne de câble et son conduit", champs: { "Nombre de lignes identiques": [1, 4], "Longueur du tracé d'une ligne, du tableau au dernier point (m)": [8, 25], "Longueur laissée à chaque raccordement (m)": 0.3, "Chutes (%)": 5, "Longueur d'un rouleau de câble (m)": 100 } },
    { type: "Tableau et protections", articles: ["Coffret", "Disjoncteur", "Interrupteur différentiel"] },
  ],
};
const MODES_MO = ["Au m² / à la tâche", "Par ouvrier", "Par équipe"]; // libellés réels lus dans la liste « Comment tu la factures » ; résolus par motif ci-dessous
const MOTIF_MO = [/tâche|unité|m²|prix par/i, /ouvrier|journée/i, /équipe/i];

// ---------- temps MODÉLISÉ (secondes) ----------
const T = { tap: 1.3, scroll: 0.9, lecture: (mots, info) => (mots / 3.2) * (info === 1 ? 1.8 : info === 2 ? 1.3 : 1), frappe: (n, v) => n * v + 1.2, hesitation: 4, retour: 2, attente: 0.6 };

// ---------- saisie utilisateur ----------
function formatSaisie(v, fmt, r, quoi = "") {
  const s = String(v).replace(".", ",");
  if (fmt === "fr") return s;
  if (fmt === "point") return String(v);
  if (fmt === "unite") { // la personne écrit l'unité du champ (85 %), ou se trompe d'unité (15 %)
    const q = String(quoi).toLowerCase(); const u = /prix|montant|fcfa/.test(q) ? ["F", " FCFA", " f", "fcfa"] : /\(cm\)/.test(q) ? ["cm", " cm"] : /\(m²\)/.test(q) ? ["m²", " m²"] : /\(m\)/.test(q) ? ["m", " m"] : /\(kg\)/.test(q) ? ["kg", " kg"] : /\(%\)/.test(q) ? ["%", " %"] : [""];
    return s + (r() < 0.15 && !/prix|montant|fcfa/.test(q) ? pick(r, ["m", " cm", "m²"]) : pick(r, u));
  }
  if (fmt === "milliers") { const n = Number(v); return Number.isInteger(n) && n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : s; }
  return s;
}
const attendu = (txt) => Number(String(txt).replace(/\s/g, "").replace(",", ".").replace(/[^\d.\-]/g, ""));

// ---------- un parcours ----------
async function parcours(browser, P) {
  const r = prng(P.seed);
  const ctx = await browser.newContext({ viewport: { width: P.largeur, height: P.hauteur }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: "fr-FR", acceptDownloads: true });
  const p = await ctx.newPage();
  const J = { profil: P.profil, id: P.id, metier: P.metier, info: P.info, metierNiv: P.metierNiv, largeur: P.largeur, voie: P.voie, incidents: [], etapes: {}, actions: 0, taps: 0, saisies: 0, retours: 0, recharges: 0, defilements: 0, mort: 0, hesitations: 0, tempsModele: 0, reussi: false, abandon: null, avertissements: 0 };
  const inc = (cat, grav, msg, extra = {}) => { J.incidents.push({ cat, grav, msg: String(msg).slice(0, 200), etape: J.etape || "", ...extra }); };
  const t0 = Date.now(); J.etape = "ouverture";
  p.on("pageerror", (e) => inc("erreur_app", "bloquant", "Erreur JavaScript : " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/favicon|Failed to load resource/.test(m.text())) inc("erreur_app", "majeur", "Console : " + m.text()); });
  p.on("dialog", (d) => { inc("dialogue", "mineur", "Boîte système : " + d.message()); d.dismiss().catch(() => {}); });
  const abandon = (cause) => { J.abandon = cause; throw Object.assign(new Error("abandon"), { abandon: true }); };
  const cout = (s) => { J.tempsModele += s; };
  const defiler = (dy) => p.evaluate((d) => window.scrollBy(0, d), dy); // équivalent d'un geste du doigt sur la page
  const corps = () => p.evaluate(() => document.body.innerText);
  const empreinte = () => p.evaluate(() => { const m = document.querySelector("main") || document.body; return m.innerHTML.length + "|" + m.innerText.length + "|" + location.hash + "|" + document.activeElement?.tagName + "|" + (document.querySelector(".sheet,.card,.toast,.msg") ? 1 : 0); });
  const verifier = async () => { // contrôles passifs à chaque écran
    const o = await p.evaluate(() => ({ deb: document.documentElement.scrollWidth > window.innerWidth + 1, txt: document.body.innerText }));
    const tr = await p.evaluate(() => [...document.querySelectorAll("label")].filter((l) => { const r = l.getBoundingClientRect(); return r.width > 0 && l.scrollWidth > l.clientWidth + 1; }).map((l) => l.innerText.trim().slice(0, 50)));
    for (const x of tr) if (!J._tr) J._tr = new Set(); for (const x of tr) if (!J._tr.has(x)) { J._tr.add(x); inc("libelle_tronque", "majeur", `Libellé coupé par « … » : « ${x} »`); }
    if (o.deb) inc("debordement", "majeur", "Le contenu dépasse la largeur de l'écran");
    if (/NaN|undefined|Infinity|\[object/.test(o.txt)) inc("erreur_app", "bloquant", "Valeur absurde affichée (NaN/undefined/Infinity)");
  };
  // Trouver un élément par son TEXTE visible ; défiler comme le ferait la personne ; compter les écrans parcourus.
  async function trouver(fn, quoi, { ecrans = P.ecransMax, optionnel = false } = {}) {
    for (let k = 0; k <= ecrans; k++) {
      let loc = fn(); let n = await loc.count(); if (!n && k === 0) { await p.waitForTimeout(220); loc = fn(); n = await loc.count(); } let dir = 0;
      for (let i = 0; i < n; i++) {
        const l = loc.nth(i);
        const b = await l.boundingBox().catch(() => null);
        if (!b || !b.width || !b.height) continue;
        if (b.y >= 0 && b.y + b.height <= P.hauteur) return l;
        dir = b.y < 0 ? -1 : 1;
      }
      if (k === ecrans) break;
      if (process.env.DEBUG_TROUVER) console.log(`[scroll] k=${k} dir=${dir} avant=${await p.evaluate(() => window.scrollY)} « ${quoi} »`);
      await defiler((dir || 1) * P.hauteur * 0.7); J.defilements++; cout(T.scroll); await p.waitForTimeout(70);
    }
    if (!optionnel) { inc("introuvable", "bloquant", `« ${quoi} » introuvable après ${ecrans} écrans de recherche`); J.hesitations++; }
    else if (process.env.DEBUG_TROUVER) { const l = fn(); const n = await l.count(); const bb = n ? await l.first().boundingBox().catch(() => null) : null; console.log(`[trouver] « ${quoi} » absent : n=${n} bbox=${JSON.stringify(bb)} H=${P.hauteur}`); }
    return null;
  }
  async function toucher(loc, quoi, { sansEffet = false } = {}) {
    if (!loc) return false;
    J.actions++; J.taps++; cout(T.tap);
    const b = await loc.boundingBox().catch(() => null);
    if (b) {
      if (Math.min(b.width, b.height) < 40) inc("cible_petite", "mineur", `Cible tactile de ${Math.round(b.width)}×${Math.round(b.height)} px : « ${quoi} »`);
      // la barre fixe du bas (Continuer / Précédent / onglets) masque-t-elle la cible ?
      const couvert = (l) => l.evaluate((el) => { const q = el.getBoundingClientRect(); const x = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2); return x && !el.contains(x) && !x.contains(el) ? ((x.closest("button,a,nav,.actbar") || x).innerText || x.tagName).trim().replace(/\s+/g, " ").slice(0, 40) : ""; }).catch(() => "");
      const cache = await couvert(loc);
      if (cache) {
        J.defilements++; cout(T.scroll + 1.5);
        await defiler(160); await p.waitForTimeout(80);
        const encore = await couvert(loc); if (encore) { J.hesitations++; cout(T.hesitation); }
        inc("masque", encore ? "majeur" : "mineur", `« ${quoi} » est recouvert par « ${cache} »` + (encore ? " (même après avoir défilé)" : " (il faut défiler pour le découvrir)"));
      }
    }
    const petite = b && Math.min(b.width, b.height) < 44;
    if (r() < P.pFauxTap * (petite ? 4 : 0.5)) { inc("faux_tap", "mineur", `Fausse touche à côté de « ${quoi} » (cible ${b ? Math.round(b.width) + "×" + Math.round(b.height) : "?"} px)`); cout(T.hesitation); J.hesitations++; }
    const avant = await empreinte();
    try { await loc.tap({ timeout: 4000 }); } catch (e) { inc("tap_impossible", "majeur", `Impossible de toucher « ${quoi} » : ${String(e.message).split("\n").filter((x) => /intercepts|disabled|not visible|not enabled|outside|stable/i.test(x))[0] || String(e.message).split("\n")[0]}`.slice(0, 260)); J.hesitations++; await loc.scrollIntoViewIfNeeded().catch(() => {}); try { await loc.tap({ timeout: 3000 }); } catch { return false; } }
    await p.waitForTimeout(140); cout(T.attente);
    const apres = await empreinte();
    if (avant === apres && !sansEffet && !/Enregistrer|Créer le (PDF|Word)/.test(quoi)) { J.mort++; inc("clic_sans_effet", "mineur", `Aucun changement visible après avoir touché « ${quoi} »`); cout(T.hesitation); }
    return true;
  }
  async function lire() { const t = await corps(); cout(T.lecture(Math.min(t.split(/\s+/).length, 200) * 0.6, P.info)); return t; }
  async function taper(loc, texte, quoi, fmt, { retente = true } = {}) {
    if (!loc) return false;
    J.actions++; J.saisies++;
    await loc.tap({ timeout: 4000 }).catch(() => {}); cout(T.tap);
    await p.waitForTimeout(60 + Math.floor(r() * 60)); // temps de réaction : personne ne tape dans les 50 ms qui suivent le toucher
    const texteSaisi = fmt ? formatSaisie(texte, fmt, r, quoi) : String(texte);
    await p.keyboard.press("Control+A").catch(() => {});
    await p.keyboard.press("Backspace").catch(() => {});
    await p.keyboard.type(texteSaisi, { delay: 6 }); cout(T.frappe(texteSaisi.length, P.vitesseFrappe));
    // sortie du champ : « Suivant »/Tab (le clavier doit rester ouvert) ou on touche ailleurs (le champ perd le focus)
    const clavier = r() < 0.4;
    if (clavier) { const suivant = await loc.evaluate((e) => { const v = (x) => { const q = x.getBoundingClientRect(); return q.width > 0 && q.height > 0; }; const tous = [...document.querySelectorAll("input,select,textarea,button,a[href],summary")].filter(v); const n = tous[tous.indexOf(e) + 1]; return n ? n.tagName : ""; }).catch(() => ""); await p.keyboard.press("Tab").catch(() => {}); await p.waitForTimeout(160); const a = await p.evaluate(() => document.activeElement && document.activeElement.tagName); if (a === "BODY" && /INPUT|TEXTAREA|SELECT/.test(suivant)) inc("focus_perdu", "majeur", "Après « Suivant », le curseur n'est dans aucun champ : le clavier se ferme", { champ: quoi }); }
    else await loc.evaluate((e) => e.blur()).catch(() => {});
    await p.waitForTimeout(200);
    const lu = await loc.inputValue().catch(() => "");
    const msg = await loc.evaluate((e) => (e.nextElementSibling && e.nextElementSibling.classList.contains("fmsg") ? e.nextElementSibling.textContent : "")).catch(() => "");
    const attenduNum = Number(String(texte).replace(",", "."));
    const nombreAttendu = typeof texte === "number" || /^-?[\d.,]+$/.test(String(texte));
    if (fmt && nombreAttendu) {
      // Une saisie est « acceptable » si c'est un nombre seul, ou un nombre suivi de l'unité écrite dans le libellé du champ. Oracle écrit ici, indépendant de l'application.
      const lab = await loc.evaluate((e) => (e.previousElementSibling && e.previousElementSibling.tagName === "LABEL" ? e.previousElementSibling.textContent : "")).catch(() => "");
      const UN = { m: "m", "m²": "m²", m2: "m²", "m³": "m³", m3: "m³", cm: "cm", mm: "mm", kg: "kg", "%": "%", f: "fcfa", fcfa: "fcfa" };
      const um = (lab.match(/\(([^)]*)\)/) || [])[1]; const uChamp = um ? UN[um.replace(/\s/g, "").toLowerCase()] || "" : "";
      const mm = texteSaisi.trim().match(/^[+-]?[\d\s.,]+?\s*([a-zA-Z²³%][a-zA-Z²³%0-9]*)\s*$/); const uTape = mm ? UN[mm[1].toLowerCase()] || "?" : "";
      const nombreSeul = /^\s*[+-]?(\d[\d\s\u00a0\u202f]*([.,]\d*)?|[.,]\d+)\s*$/.test(texteSaisi);
      const acceptable = nombreSeul || (uTape && uChamp && uTape === uChamp);
      if (!acceptable) { // le nombre est suivi d'une autre unité, ou d'un texte : l'application doit le dire, à côté du champ
        if (!msg) inc("erreur_muette", "majeur", `« ${texteSaisi} » refusé ou mal lu sans aucun message`, { champ: quoi });
        else { inc("erreur_signalee", "info", `« ${texteSaisi} » → message affiché : ${msg.slice(0, 80)}`, { champ: quoi }); J.erreursVues = (J.erreursVues || 0) + 1; cout(T.lecture(14, P.info));
          if (retente && r() < (P.info === 1 ? 0.6 : P.info === 2 ? 0.8 : 0.95)) { J.corrections = (J.corrections || 0) + 1; return taper(loc, texte, quoi, "fr", { retente: false }); }
          inc("erreur_non_corrigee", "majeur", `Le message d'erreur sur « ${quoi} » n'a pas conduit à corriger la saisie`, { champ: quoi }); J.hesitations++; }
      } else {
        if (msg) inc("faux_refus", "majeur", `« ${texteSaisi} » est valide mais refusé : ${msg.slice(0, 60)}`, { champ: quoi });
        else if (lu !== "" && Math.abs(attendu(lu) - attenduNum) > 1e-9) inc("saisie_mal_lue", "majeur", `« ${texteSaisi} » devient « ${lu} »`, { champ: quoi });
        else if (lu === "") inc("saisie_perdue", "majeur", `« ${texteSaisi} » tapé mais le champ est vide`, { champ: quoi });
      }
    } else if (!fmt && String(texte) !== "" && lu === "") inc("saisie_perdue", "majeur", `« ${texteSaisi} » tapé mais le champ est vide`, { champ: quoi });
    return true;
  }
  const boutonTexte = (re, opts = {}) => () => p.getByRole("button", { name: re, ...opts });
  const lienTexte = (re) => () => p.getByRole("link", { name: re });
  const tout = (re) => () => p.locator("button, a, [role=button]").filter({ hasText: re });
  const champ = (label) => () => p.locator("label").filter({ hasText: label.slice(0, 60) }).locator("xpath=following-sibling::*[self::input or self::select or self::textarea][1]");

  // vérification de la valeur de chaque champ numérique du métré : un champ sans libellé est un champ incompris
  async function champsSansLibelle() {
    const l = await p.evaluate(() => [...document.querySelectorAll("main input:not([type=hidden]):not([type=file]):not([type=checkbox]), main select")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).filter((e) => { const lab = (e.labels && e.labels[0]?.textContent) || e.getAttribute("aria-label") || ""; return !lab.trim(); }).length);
    return l;
  }

  try {
    // ============ 1. Ouverture ============
    await p.goto(URL0); await p.waitForTimeout(500); await lire(); await verifier();
    if (r() < P.pRecharge * 2) { J.recharges++; await p.reload(); await p.waitForTimeout(400); }
    // ============ 2. Premières questions ============
    J.etape = "démarrage";
    let t = await corps();
    if (/Quel est ton métier/.test(t)) {
      const e1 = Date.now();
      await toucher(await trouver(boutonTexte(new RegExp("^\\s*" + NOM_METIER[P.metier] + "\\s*$", "i")), NOM_METIER[P.metier]), NOM_METIER[P.metier]);
      await lire();
      const prof = (process.env.FORCE_PROFIL ? process.env.FORCE_PROFIL === "technicien" : r() < 0.75) ? /technicien ou artisan/ : /entreprise/;
      if (prof.source.includes("entreprise")) P.profil = "entreprise";
      await toucher(await trouver(tout(prof), "Je suis technicien ou artisan"), "profil");
      J.etapes.demarrage = Date.now() - e1;
    }
    await p.waitForTimeout(300); await lire(); await verifier();
    // ============ 3. Créer le devis ============
    J.etape = "créer le devis";
    let b = await trouver(tout(/Faire un devis|Nouveau devis/i), "Faire un devis", { optionnel: true });
    if (!b) abandon("ne trouve pas comment créer un devis");
    await toucher(b, "Faire un devis"); await lire(); await verifier();
    // ============ 4. Étape 1 : le client ============
    J.etape = "étape 1 : client";
    t = await corps();
    if (!/Pour qui est le devis|Client et chantier/.test(t)) { inc("ecran_inattendu", "majeur", "L'écran du client n'apparaît pas après « Faire un devis »"); abandon("écran inattendu"); }
    const noms = ["M. Mballa", "Mme Ngo Bakang", "Ets Tchinda", "Jean Fotso", "Mme Essomba", "M. Njoya", "Paul Biyik"];
    const nomClient = pick(r, noms);
    if (r() >= P.pSaute * 0.5) await taper(await trouver(champ("Nom du client"), "Nom du client"), nomClient, "nom du client");
    else { inc("champ_saute", "mineur", "Le nom du client est laissé vide"); }
    if (r() < 0.8) await taper(await trouver(champ(P.profil === "entreprise" ? "Contact" : "Téléphone du client"), "Téléphone du client"), "6" + String(Math.floor(r() * 90000000 + 10000000)), "téléphone");
    if (r() < 0.6) await taper(await trouver(champ(P.profil === "entreprise" ? "Adresse / quartier" : "Quartier ou adresse"), "Quartier"), pick(r, ["Bonamoussadi", "Akwa", "Makepe", "Bonapriso", "Kotto"]), "quartier");
    // champs numériques génériques de cette étape : surface (peinture/carrelage)
    if (!(await champsSansLibelle() === 0)) inc("champ_sans_libelle", "majeur", "Un champ n'a aucun libellé à l'étape 1");
    b = await trouver(boutonTexte(/Continuer/), "Continuer"); await toucher(b, "Continuer (étape 1)");
    await lire(); await verifier();

    // ============ 5-6. Les écrans suivants, jusqu'à l'écran qui propose le PDF ============
    let travailFait = false, modifFait = false, lignesRemplies = 0, totalApres = 0; const choixVoie = P.voie;
    for (let ec = 0; ec < 6; ec++) {
      t = await corps();
      if (/Créer le PDF/.test(t)) break;
      if (!travailFait && /Métré du chantier|Le travail et le matériel|Travaux à faire/.test(t)) {
        travailFait = true; J.etape = "travaux";
    // ============ 5. Étape 2 : le travail et le matériel ============
    J.etape = "étape 2 : travail";
    t = await corps();
    const plan = PLANS[P.metier];
    const ouvrages = [plan[P.rang % plan.length]];
    if (P.rang % 3 === 0 && plan.length > 1) ouvrages.push(plan[(P.rang + 1) % plan.length]);
    if (choixVoie === "metre") {
      // Les personnes qui découvrent : repèrent-elles « Métré du chantier » ? Elles le voient en haut de l'écran.
      let zoneBtn = await trouver(boutonTexte(/Ajouter une zone/), "Ajouter une zone");
      if (!zoneBtn) { J.voie = "produits"; }
      else {
        if (P.info <= 2 && r() < 0.35) { inc("hesitation_choix", "mineur", "Hésite entre « Métré du chantier » et la liste de produits", {}); J.hesitations++; cout(T.hesitation * 2); }
        await toucher(zoneBtn, "Ajouter une zone"); await lire();
        // nom de la zone
        const nz = await trouver(() => p.getByPlaceholder(/Salon, Étage 1/), "Nom de la zone", { optionnel: true });
        if (nz) await taper(nz, pick(r, ["Salon", "Chambre 1", "Villa B", "Bâtiment A", "Cuisine"]), "nom de la zone");
        for (const o of ouvrages) {
          J.etape = "étape 2 : ouvrage " + o.type; (J.ouvrages = J.ouvrages || []).push(o.type);
          // choisir le type d'ouvrage par son nom visible
          let ch = await trouver(tout(new RegExp("^\\s*(＋\\s*)?" + o.type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, ".") + "\\s*$")), o.type, { optionnel: true, ecrans: 3 });
          if (!ch) { // l'ouvrage est peut-être déjà ouvert ou il faut d'abord demander « Ajouter un ouvrage »
            const add = await trouver(tout(/Ajouter un ouvrage/), "Ajouter un ouvrage", { optionnel: true, ecrans: 3 });
            if (add) { await toucher(add, "Ajouter un ouvrage"); ch = await trouver(tout(new RegExp("^\\s*(＋\\s*)?" + o.type.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, ".") + "\\s*$")), o.type, { optionnel: true, ecrans: 3 }); }
          }
          if (ch) await toucher(ch, o.type);
          await lire(); await verifier();
          // remplir chaque champ par son LIBELLÉ visible
          for (const [lab, val] of Object.entries(o.champs || {})) {
            const niv = niveauMot(lab);
            const sait = niv <= P.metierNiv;
            const f = await trouver(champ(lab), lab, { optionnel: true, ecrans: P.ecransMax + 2 });
            if (!f) { inc("champ_introuvable", "majeur", `Champ « ${lab} » introuvable`); J.hesitations++; continue; }
            if (niv > 0 && !sait) { inc("mot_technique", niv >= 3 ? "majeur" : "mineur", `« ${lab} » : mot que ce profil (métier niveau ${P.metierNiv}) ne comprend pas`, { champ: lab }); J.hesitations++; cout(T.hesitation * 2); if (r() < 0.55) { J.etapes.sauts = (J.etapes.sauts || 0) + 1; continue; } }
            let v = Array.isArray(val) ? (/^(Nombre|Faces)/.test(lab) ? Math.round(val[0] + r() * (val[1] - val[0])) : Math.round((val[0] + r() * (val[1] - val[0])) * 10) / 10) : val;
            if (typeof v === "string") await taper(f, v, lab);
            else await taper(f, v, lab, pick(r, P.formats));
          }
          // ouvertures (portes / fenêtres)
          for (let k = 0; k < (o.ouvertures || 0); k++) {
            const bo = await trouver(tout(/Ajouter une porte ou une fenêtre/), "Ajouter une porte ou une fenêtre", { optionnel: true, ecrans: 3 });
            if (bo) { await toucher(bo, "Ajouter une porte ou une fenêtre"); const lh = p.locator(".mzone input[type=number]"); const nn = await lh.count(); if (nn >= 2) { await taper(lh.nth(nn - 2), 0.9, "largeur de l'ouverture", "fr"); await taper(lh.nth(nn - 1), 2.1, "hauteur de l'ouverture", "fr"); } }
          }
          // produits (boutons « ＋ nom »)
          for (const pr of o.produits || []) { const bp = await trouver(tout(new RegExp("＋\\s*" + pr)), pr, { optionnel: true, ecrans: 3 }); if (bp) { await toucher(bp, "＋ " + pr); } else inc("champ_introuvable", "majeur", `Bouton produit « ${pr} » introuvable`); }
          for (const a of o.articles || o.raccords || []) { const ba = await trouver(tout(new RegExp("＋\\s*" + a.replace(/[+]/g, "\\+"))), a, { optionnel: true, ecrans: 3 }); if (ba) await toucher(ba, "＋ " + a); }
          if (o.plinthes) { const cp = await trouver(() => p.getByLabel(/Poser des plinthes/), "Poser des plinthes", { optionnel: true, ecrans: 3 }); if (cp) await toucher(cp, "Poser des plinthes"); }
          if (o.mortier) { const cm = await trouver(() => p.getByLabel(/Estimer le mortier/), "Estimer le mortier", { optionnel: true, ecrans: 3 }); if (cm) await toucher(cm, "Estimer le mortier"); }
          // champs secondaires apparus après le choix des produits / articles (couverture, couches, quantités)
          for (const [re, val, savoir] of [[/^m² couverts/, [8, 40], 2], [/^Couches$/, 2, 1], [/^Quantité$/, [1, 6], 1]]) {
            const labs = p.locator(".mzone label").filter({ hasText: re }); const nl = await labs.count();
            for (let i = 0; i < nl; i++) {
              const f2 = labs.nth(i).locator("xpath=following-sibling::input[1]");
              if (!(await f2.count()) || (await f2.inputValue()) !== "") continue;
              if (P.metierNiv < savoir && r() < 0.5) { inc("mot_technique", "majeur", `« ${(await labs.nth(i).innerText()).trim().slice(0, 60)} » : valeur inconnue de ce profil, champ laissé vide`, { champ: "couverture" }); J.hesitations++; continue; }
              await f2.scrollIntoViewIfNeeded().catch(() => {});
              await taper(f2, Array.isArray(val) ? Math.round(val[0] + r() * (val[1] - val[0])) : val, (await labs.nth(i).innerText()).trim().slice(0, 40), "fr");
            }
          }
          // lire « Il manque : … » et y répondre (c'est ce que fait une personne qui voit le message)
          for (let tour = 0; tour < 4; tour++) {
            const zt = await p.locator(".mzone").last().innerText().catch(() => "");
            const m = zt.match(/Il manque\s*:\s*([^\n]+)/); if (!m) break;
            const mots = (m[1].toLowerCase().match(/[a-zéèêàùç²³']{4,}/g) || []).filter((w) => !["manque", "toute", "pour", "chaque", "avec", "dans"].includes(w));
            const labs = p.locator(".mzone label"); const nl = await labs.count(); let rempli = false;
            for (let i = 0; i < nl && !rempli; i++) {
              const lt = ((await labs.nth(i).innerText().catch(() => "")) || "").toLowerCase();
              if (!mots.some((w) => lt.includes(w))) continue;
              const f2 = labs.nth(i).locator("xpath=following-sibling::input[1]");
              if (!(await f2.count()) || (await f2.inputValue()) !== "") continue;
              if (niveauMot(lt) > P.metierNiv || /rendement|fait en une journée/.test(lt) && P.metierNiv < 2) { inc("mot_technique", "majeur", `« ${lt.replace(/\s+/g, " ").slice(0, 70)} » : demandé par « Il manque » mais ce profil ne sait pas répondre`, { champ: lt.slice(0, 40) }); J.hesitations++; continue; }
              await f2.scrollIntoViewIfNeeded().catch(() => {});
              const texteLibre = /type et diamètre/.test(lt) ? 'PPR 20' : /type et section/.test(lt) ? 'câble 2,5 mm²' : /conduit ou gaine/.test(lt) ? 'gaine ICTA 20' : /désignation/.test(lt) ? 'HA 10' : /^nom$|nom de l.élément/.test(lt.trim()) ? 'Poteau' : null;
              if (texteLibre) { await f2.scrollIntoViewIfNeeded().catch(() => {}); await taper(f2, texteLibre, lt.slice(0, 40)); rempli = true; continue; }
              const val = /ouvriers/.test(lt) ? 2 : /couvert/.test(lt) ? 40 : /fait en une journée|rendement/.test(lt) ? 10 : /plinthe/.test(lt) && /longueur|pièce/.test(lt) ? 60 : /plinthe/.test(lt) ? 10 : /surfaces?|faces?|éléments|lignes|fouilles/.test(lt) ? 1
                : /poids d.un sac|sac de (colle|joint)/.test(lt) ? 25 : /longueur d.un rouleau|longueur d.une barre|rouleau ou d.une barre/.test(lt) ? (/câble/.test(lt) ? 100 : 6)
                : /^largeur \(m\)|largeur d.une? (porte|fenêtre)/.test(lt) ? 0.9 : /^hauteur \(m\)/.test(lt) ? 2.1 : /longueur d.un bloc/.test(lt) ? 40 : /épaisseur d.un bloc|largeur de la section|épaisseur ou hauteur de la section/.test(lt) ? 20 : /poids d.un sac de ciment/.test(lt) ? 50
                : /raccordements/.test(lt) ? 4 : /nombre de barres/.test(lt) ? 6 : /espacement/.test(lt) ? 20 : /longueur d.un carreau|largeur d.un carreau/.test(lt) ? 60 : /carreaux par carton/.test(lt) ? 4
                : /longueur du tuyau|longueur d.un tube|barre de tuyau/.test(lt) ? 4 : /longueur laissée/.test(lt) ? 0.3 : /nombre de/.test(lt) ? 2 : null;
              if (val === null) { inc("champ_inconnu", "mineur", `« ${lt.replace(/\s+/g, " ").slice(0, 60)} » : le personnage ne sait pas quelle valeur écrire`, { champ: lt.slice(0, 40) }); J.hesitations++; continue; }
              await taper(f2, val, lt.slice(0, 40), "fr"); rempli = true;
            }
            if (!rempli) break;
          }
          // pertes
          if (o.pertes !== undefined) { const fp = await trouver(champ("Pertes de produit (%)"), "Pertes de produit", { optionnel: true, ecrans: 3 }); if (fp && P.metierNiv >= 2) await taper(fp, o.pertes, "pertes", "fr"); else if (fp) { inc("mot_technique", "mineur", "« Pertes de produit (%) » : laissé vide par ce profil", { champ: "Pertes de produit (%)" }); J.hesitations++; } }
          // main-d'œuvre : le mode est choisi par la personne parmi 3 façons de facturer
          const selMO = await trouver(() => p.locator(".mzone select").filter({ has: p.locator("option", { hasText: /équipe/i }) }).last(), "Comment tu la factures", { optionnel: true, ecrans: P.ecransMax + 1 });
          if (selMO) {
            const mode = P.metierNiv >= 2 ? P.rang % 3 : 0; // tâche / ouvrier / équipe, réparti ; un profil de métier débutant choisit « à la tâche » (aucun rendement à connaître)
            const opts = await selMO.locator("option").allInnerTexts();
            const idx = opts.findIndex((x) => MOTIF_MO[mode].test(x));
            if (idx >= 0) { J.actions++; await selMO.selectOption({ index: idx }); cout(T.tap + T.hesitation * (P.info <= 2 ? 1 : 0)); await p.waitForTimeout(250); J.moMode = opts[idx].slice(0, 40); (J.modes = J.modes || []).push(mode); await lire(); }
            // champs du mode (rendement, ouvriers)
            for (const lab of [/Rendement|fait en une journée/i, /Nombre d'ouvriers|Combien d'ouvriers/i]) {
              const fm = p.locator(".mzone label").filter({ hasText: lab }).first().locator("xpath=following-sibling::input[1]");
              if (await fm.count()) { const lt = await p.locator(".mzone label").filter({ hasText: lab }).first().innerText(); if (niveauMot(lt) > P.metierNiv || /rendement/i.test(lt) && P.metierNiv < 2) { inc("mot_technique", "majeur", `« ${lt.replace(/\s+/g, " ").slice(0, 70)} » : notion de rendement non comprise par ce profil`, { champ: "rendement" }); J.hesitations++; if (r() < 0.5) continue; } await fm.scrollIntoViewIfNeeded().catch(() => {}); await taper(fm, /ouvrier/i.test(lab.source) ? 2 : 10, lt.slice(0, 40), "fr"); }
            }
          }
          await verifier();
          // le formulaire est-il encore « À compléter » ?
          const compl = await p.locator(".mzone", { hasText: "À compléter" }).count();
          if (compl) { J.etapes.completer = (J.etapes.completer || 0) + 1; inc("a_completer", "mineur", `Ouvrage « ${o.type} » reste « À compléter » après saisie`); }
          // ajouter l'ouvrage suivant (si prévu)
          if (o !== ouvrages[ouvrages.length - 1]) { const add = await trouver(tout(/Ajouter un ouvrage/), "Ajouter un ouvrage", { optionnel: true, ecrans: 4 }); if (add) await toucher(add, "Ajouter un ouvrage"); }
        }
      }
    }
    if (J.voie === "produits" || choixVoie === "produits") {
      // Voie « produits » : toucher un produit, quantité, prix
      J.etape = "étape 2 : produits";
      if (await p.getByText(/Quel type de matériel/).count()) { // métiers à catalogue : choisir une famille, puis un matériel
        const ch = await trouver(() => p.locator("button.chip").first(), "famille de matériel", { optionnel: true, ecrans: 3 }); if (ch) await toucher(ch, "famille de matériel");
      }
      const fam = p.locator("button.famh"); const nf = await fam.count(); // catalogue : ouvrir une famille ; ses matériels sont les button.rowc qui apparaissent
      if (nf) { const fb = await trouver(() => fam.first(), "une famille de matériel", { optionnel: true, ecrans: 3 }); if (fb) await toucher(fb, "famille"); }
      const liste = await p.locator('button.rowc').evaluateAll((e) => e.slice(0, 4).map((x) => x.innerText.split("\n")[0].trim())).catch(() => []);
      for (const nom of liste.slice(0, 2 + (P.rang % 2))) {
        const rb = await trouver(() => p.locator("button.rowc").filter({ hasText: nom }).first(), nom, { optionnel: true, ecrans: 4 }); if (!rb) continue;
        await toucher(rb, nom);
        const q = await trouver(() => p.locator('input[inputmode=decimal]:visible').first(), "Quantité", { optionnel: true, ecrans: 3 });
        const us = p.locator('select:visible').filter({ has: p.locator("option", { hasText: /^—$/ }) }).last();
        if (q) await taper(q, 1 + Math.floor(r() * 6), "quantité", pick(r, P.formats.filter((x) => x !== "unite")));
        if (await us.count()) { await us.selectOption({ index: 1 }).catch(() => {}); cout(T.tap); }
        const pu = p.locator('input[inputmode=decimal]:visible'); const nn = await pu.count(); if (nn >= 2) { await taper(pu.nth(nn - 1), 2000 + Math.floor(r() * 20) * 500, "prix", pick(r, P.formats.filter((x) => x !== "unite"))); }
        const fer = p.locator("button").filter({ hasText: /Fermer/ }).first(); if (await fer.count()) await toucher(fer, "Fermer");
      }
    }

      }
      const aDesLignes = (await p.locator("button.rowc").count()) > 0 && !/Prix et conditions|Vérifier avant/.test(t);
      if (aDesLignes && lignesRemplies === 0) {
        {
    // Les lignes du devis sont-elles apparues (métré → lignes) ? La personne doit maintenant saisir les prix.
    J.etape = "étape 2 : prix";
    await defiler(-4000); await p.waitForTimeout(100);
    const totalAvant = attendu(await p.locator(".total .big").first().innerText().catch(() => "0"));
    // repérer les lignes proposées : boutons « rowc » avec une quantité en sous-texte
    const lignes = await p.locator("button.rowc").evaluateAll((e) => e.map((x, i) => ({ i, t: x.innerText.replace(/\s+/g, " ").trim() })).filter((x) => /\d/.test(x.t) && !/Toucher pour remplir/.test(x.t)));
    if (lignes.length === 0 && choixVoie === "metre") { inc("aucune_ligne", "bloquant", "Le métré rempli n'a produit aucune ligne dans le devis visible", {}); }
    const nb = await p.locator("button.rowc").count();
    for (let i = 0; i < nb && lignesRemplies < 8; i++) {
      const rb = p.locator("button.rowc").nth(i);
      const tl = ((await rb.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
      if (!tl || /Toucher pour remplir/.test(tl) || !(/×|prix manquant|FCFA/.test(tl)) || /^[✓!]\s.*(m²|ml)\s*[▲▼]?$/.test(tl) && !/×/.test(tl)) continue;
      const nomL = tl.replace(/^[✓!]\s*/, "").split(" ").slice(0, 3).join(" ");
      await rb.scrollIntoViewIfNeeded().catch(() => {});
      await toucher(rb, nomL);
      const cible = p.locator("label").filter({ hasText: /^Prix (unitaire|pour 1|par)/i }).locator("xpath=following-sibling::input[1]").first();
      if (!(await cible.count())) { inc("champ_introuvable", "bloquant", `Champ prix introuvable dans la ligne « ${nomL} »`); continue; }
      await cible.scrollIntoViewIfNeeded().catch(() => {});
      await taper(cible, 500 + Math.floor(r() * 40) * 250, "prix de " + nomL, pick(r, P.formats));
      const fer = p.locator("button").filter({ hasText: /Fermer/ }).last(); if (await fer.count()) { await fer.scrollIntoViewIfNeeded().catch(() => {}); await toucher(fer, "Fermer la ligne"); }
      lignesRemplies++;
    }
    if (r() < P.pBouton) { /* touche directement Continuer sans quitter le champ : comportement fréquent */ }
    await verifier();
    totalApres = attendu(await p.locator(".total .big").first().innerText().catch(() => "0"));
    J.total = totalApres;
    if (lignesRemplies > 0 && !(totalApres > 0)) inc("total_nul", "bloquant", `Des prix sont saisis (${lignesRemplies} lignes) mais le total reste à 0`);
    if (lignesRemplies === 0 && !(totalApres > 0)) { inc("rien_chiffre", "majeur", "Aucune ligne chiffrée à la fin de l'étape 2"); }
    // retour en arrière puis revenir : les données sont-elles gardées ?
    if (r() < P.pRetour) {
      J.retours++; cout(T.retour);
      const prev = await trouver(boutonTexte(/Précédent/), "Précédent", { optionnel: true, ecrans: 2 });
      if (prev) { await toucher(prev, "Précédent"); await lire(); const nc = await p.getByPlaceholder(/M\. Mballa/).inputValue().catch(() => null); if (nc !== null && nc !== "" && nc !== nomClient && !/^$/.test(nc)) inc("donnee_perdue", "majeur", "Le nom du client a changé en revenant en arrière"); await toucher(await trouver(boutonTexte(/Continuer/), "Continuer"), "Continuer (retour)"); await lire(); const tt = attendu(await p.locator(".total .big").first().innerText().catch(() => "0")); if (Math.abs(tt - totalApres) > 0.5) inc("donnee_perdue", "bloquant", `Total changé après un aller-retour : ${totalApres} → ${tt}`); }
    }
    // rechargement de la page (navigateur fermé/rouvert) : le brouillon est-il retrouvé ?
    if (r() < P.pRecharge) {
      J.recharges++; await p.reload(); await p.waitForTimeout(500); await lire();
      const dev = await trouver(tout(/DEV-\d{4}|Reprendre|Brouillon/), "retrouver le brouillon", { optionnel: true, ecrans: 3 });
      if (!dev && /Aucun devis/.test(await corps())) inc("brouillon_perdu", "bloquant", "Après rechargement, le brouillon a disparu");
      else if (dev) { await toucher(dev, "brouillon"); await lire(); }
    }
        }
      }
      if (SHOTS) { await p.screenshot({ path: `${OUT}/${P.id}-ecran${ec + 2}.png`, fullPage: true }).catch(() => {}); fs.writeFileSync(`${OUT}/${P.id}-ecran${ec + 2}.txt`, (await corps())); }
      // ---- modifications après coup (copier une zone, retirer un ouvrage, changer le mode de main-d'œuvre, corriger une quantité) ----
      if (!modifFait && travailFait && choixVoie === "metre" && /Métré du chantier/.test(t) && r() < (P.info === 1 ? 0.3 : 0.45)) {
        modifFait = true; J.etape = "modifications";
        const lireTotal = async () => attendu(await p.locator(".total .big").first().innerText().catch(() => "0"));
        const t0m = await lireTotal(); const modif = pick(r, ["copie", "copie", "retirer", "mode", "quantite"]); (J.modifs = J.modifs || []).push(modif);
        const nZ = () => p.locator(".mzone").count();
        if (modif === "copie") {
          const z0 = await nZ(); const bc = await trouver(tout(/Copier cette zone/), "Copier cette zone", { optionnel: true, ecrans: 6 });
          if (!bc) inc("introuvable", "majeur", "« Copier cette zone » introuvable");
          else {
            await toucher(bc, "Copier cette zone"); await p.waitForTimeout(250); const z1 = await nZ(); const t1 = await lireTotal();
            if (z1 !== z0 + 1) inc("copie_zone", "majeur", `Copier une zone : ${z0} → ${z1} zones`);
            if (t0m > 0 && !(t1 > t0m)) inc("copie_zone", "majeur", `Copier une zone ne change pas le total (${t0m} → ${t1})`);
            // supprimer la copie : combien de touchers faut-il, la confirmation est-elle claire ?
            const sup = p.locator("button").filter({ hasText: /Supprimer la zone/ }).last();
            if (await sup.count()) { await sup.scrollIntoViewIfNeeded().catch(() => {}); await toucher(sup, "Supprimer la zone"); await p.waitForTimeout(200);
              const conf = p.locator("button").filter({ hasText: /^(Oui|Confirmer|Supprimer|Oui, supprimer)/ }).last();
              if (await conf.count()) { J.etapes.confirmSuppr = true; await toucher(conf, "Confirmer la suppression"); await p.waitForTimeout(250); }
              else inc("suppression", "mineur", "Aucune confirmation visible après « Supprimer la zone »");
              const t2 = await lireTotal(); if (Math.abs(t2 - t0m) > 1) inc("copie_zone", "majeur", `Après suppression de la copie, le total est ${t2} au lieu de ${t0m}`); }
          }
        } else if (modif === "retirer") {
          const br = p.locator("button").filter({ hasText: /Retirer cet ouvrage/ }).last();
          if ((await br.count()) && (await p.locator('button.rowc[data-act="metreOuv"]').count()) >= 2) { await br.scrollIntoViewIfNeeded().catch(() => {}); await toucher(br, "Retirer cet ouvrage"); await p.waitForTimeout(250);
            const conf = p.locator("button").filter({ hasText: /^(Oui|Confirmer|Retirer|Oui, retirer)/ }).last(); if (await conf.count()) await toucher(conf, "Confirmer"); }
          await verifier();
        } else if (modif === "mode") {
          const sel2 = p.locator(".mzone select").filter({ has: p.locator("option", { hasText: /équipe/i }) }).last();
          if (await sel2.count()) { await sel2.scrollIntoViewIfNeeded().catch(() => {}); const opts = await sel2.locator("option").allInnerTexts(); const k = Math.floor(r() * opts.length); await sel2.selectOption({ index: k }); cout(T.tap); await p.waitForTimeout(250); await lire(); await verifier(); }
        } else if (modif === "quantite") {
          const rb = p.locator("button.rowc").filter({ hasText: /×/ }).first();
          if (await rb.count()) { await rb.scrollIntoViewIfNeeded().catch(() => {}); await toucher(rb, "ligne"); const fq = p.locator("label").filter({ hasText: /^Quantité/ }).locator("xpath=following-sibling::input[1]").first();
            if (await fq.count()) { await fq.scrollIntoViewIfNeeded().catch(() => {}); await taper(fq, 999, "quantité (modifiée à la main)", "fr"); await p.waitForTimeout(250); const tx = await corps();
              if (!/999/.test(tx) || !/écrit|écart|métré/i.test(tx)) inc("ecart_non_signale", "majeur", "Quantité changée à la main : l'écart avec le métré n'est pas signalé");
              const rep = p.locator("button").filter({ hasText: /Reprendre/ }).first(); if (await rep.count()) { await toucher(rep, "Reprendre la quantité du métré"); } else inc("reprise_absente", "mineur", "Aucun bouton « Reprendre » pour revenir à la quantité du métré"); }
            const fer = p.locator("button").filter({ hasText: /Fermer/ }).last(); if (await fer.count()) await toucher(fer, "Fermer la ligne"); }
        }
        await verifier();
      }
      J.etape = "continuer";
      b = await trouver(boutonTexte(/Continuer|Aperçu, PDF et envoi/), "Continuer", { optionnel: true, ecrans: 6 });
      if (!b) { inc("introuvable", "bloquant", "Bouton « Continuer » introuvable à l'écran " + (ec + 2)); abandon("ne trouve pas le bouton Continuer"); }
      const avantT = t;
      await toucher(b, "Continuer (écran " + (ec + 2) + ")"); await lire(); await verifier();
      if ((await corps()) === avantT) { inc("bloque_ecran", "majeur", "« Continuer » ne fait pas avancer (écran " + (ec + 2) + ")"); }
    }
    if (!/Créer le PDF/.test(await corps())) { inc("export_absent", "bloquant", "L'écran d'export n'est jamais atteint"); abandon("n'atteint pas l'écran du PDF"); }
    if (lignesRemplies === 0) inc("rien_chiffre", "majeur", "Aucune ligne n'a pu être chiffrée");

    // ============ 7. Étape 3 : entreprise, PDF, Word ============
    J.etape = "étape 3 : export";
    const ent = await trouver(() => p.getByPlaceholder(/Ets Kamga/), "Nom de ton entreprise", { optionnel: true });
    if (ent) await taper(ent, "Ets " + pick(r, ["Kamga", "Ngassa", "Tagne", "Mbarga"]) + " " + NOM_METIER[P.metier], "nom entreprise");
    // devis vide ? (ne rien avoir chiffré et pouvoir exporter)
    J.totalExport = attendu(await p.locator('.total .big').first().innerText().catch(() => '0')); const vide = !(J.totalExport > 0);
    // PDF
    let pdfOk = false, wordOk = false;
    const d0 = J.defilements; let bp = await trouver(boutonTexte(/Créer le PDF/), "Créer le PDF", { ecrans: 10 }); J.defilPDF = J.defilements - d0;
    const corrigerPrix = async () => { // ouvre chaque ligne « prix manquant », écrit un prix, referme
      const nb2 = await p.locator("button.rowc").count(); let fix = 0;
      for (let i = 0; i < nb2; i++) { const rb = p.locator("button.rowc").nth(i); const tl = ((await rb.innerText().catch(() => "")) || ""); if (!/prix manquant|prix \?/.test(tl)) continue; await rb.scrollIntoViewIfNeeded().catch(() => {}); await toucher(rb, "ligne à corriger"); const c2 = p.locator("label").filter({ hasText: /^Prix (unitaire|pour 1|par)/i }).locator("xpath=following-sibling::input[1]").first(); if (await c2.count()) { await c2.scrollIntoViewIfNeeded().catch(() => {}); await taper(c2, 1000 + Math.floor(r() * 10) * 500, "prix (correction)", "fr"); fix++; const fer = p.locator("button").filter({ hasText: /Fermer/ }).last(); if (await fer.count()) await toucher(fer, "Fermer la ligne"); } }
      return fix;
    };
    // PDF grisé : la raison est-elle écrite ? la personne peut-elle corriger ?
    for (let tour = 0; bp && (await bp.isDisabled().catch(() => false)) && tour < 6; tour++) {
      const raison = ((await p.locator(".chk:has(.d-bloque)").allInnerTexts().catch(() => [])).map((x) => x.replace(/\s+/g, " ")).join(" / ")) || (await corps()).split("\n").filter((x) => /manque|Corrige|prix manquant|bloqu|incomplet/i.test(x)).slice(0, 3).join(" / ");
      inc("pdf_grise", raison ? "mineur" : "majeur", raison ? `Bouton PDF grisé. Raison affichée : ${raison.slice(0, 220)}` : "Bouton PDF grisé sans aucune raison visible");
      J.hesitations++; cout(T.hesitation * 2);
      // 1) le contrôle propose un lien « Corriger : aller à … » : la personne le touche, remplit ce qui est demandé, puis revient au bouton PDF
      const lien = p.locator(".chk:has(.d-bloque) a.fixlink");
      if (await lien.count()) {
        const bl = await trouver(() => lien.first(), "Corriger : aller à …", { optionnel: true, ecrans: 6 });
        if (bl) {
          J.retours++; J.liensCorriger = (J.liensCorriger || 0) + 1; await toucher(bl, "Corriger : aller à …"); await p.waitForTimeout(300);
          { const lp = p.locator("label").filter({ hasText: /^Prix (par|unitaire|pour 1)/ }); const np = await lp.count(); // lignes sans prix (entreprise : « Prix par Pot (FCFA) »)
            for (let i = 0; i < np; i++) { const f4 = lp.nth(i).locator("xpath=following-sibling::input[1]"); if (!(await f4.count()) || (await f4.inputValue()) !== "") continue;
              await f4.scrollIntoViewIfNeeded().catch(() => {}); await taper(f4, 2000 + Math.floor(r() * 20) * 500, "prix de la ligne", pick(r, P.formats.filter((x) => x !== "unite")));
              const cb = p.locator("button").filter({ hasText: /Corriger cette ligne/ }).first(); if (await cb.count()) await toucher(cb, "Corriger cette ligne"); } }
          for (const [re, val] of [[/^Surface des murs/, 60], [/^Hauteur de travail maximale/, 3], [/^Délai minimum/, 5], [/^Délai maximum/, 10]]) {
            const lb = p.locator("label").filter({ hasText: re }).first(); if (!(await lb.count())) continue;
            const f3 = lb.locator("xpath=following-sibling::input[1]"); if (!(await f3.count()) || (await f3.inputValue()) !== "") continue;
            await f3.scrollIntoViewIfNeeded().catch(() => {}); await taper(f3, val, (await lb.innerText()).trim().slice(0, 40), "fr");
          }
          await corrigerPrix();
          for (let k = 0; k < 6 && !/Créer le PDF/.test(await corps()); k++) { const nx = await trouver(boutonTexte(/Continuer|Aperçu, PDF et envoi/), "Continuer", { optionnel: true, ecrans: 6 }); if (!nx) break; await toucher(nx, "Continuer"); await p.waitForTimeout(200); }
          bp = await trouver(boutonTexte(/Créer le PDF/), "Créer le PDF", { ecrans: 10 });
          if (bp && !(await bp.isDisabled().catch(() => false))) break; else continue;
        }
      }
      const prev = await trouver(boutonTexte(/Précédent/), "Précédent", { optionnel: true, ecrans: 6 }); if (!prev) break;
      J.retours++; for (let k = 0; k < 4; k++) { await toucher(prev, "Précédent"); await p.waitForTimeout(150); if (/Le travail et le matériel|Travaux à faire|Produits et main-d/.test(await corps())) break; const pv = p.getByRole("button", { name: /Précédent/ }); if (!(await pv.count())) break; }
      if (SHOTS) fs.writeFileSync(`${OUT}/${P.id}-retour${tour}.txt`, await corps());
      const fix = await corrigerPrix();
      if (!fix) break;
      for (let k = 0; k < 5 && !/Créer le PDF/.test(await corps()); k++) { const nx = await trouver(boutonTexte(/Continuer|Aperçu, PDF et envoi/), "Continuer", { optionnel: true, ecrans: 6 }); if (!nx) break; await toucher(nx, "Continuer"); await p.waitForTimeout(200); }
      bp = await trouver(boutonTexte(/Créer le PDF/), "Créer le PDF", { ecrans: 10 });
    }
    if (bp && !(await bp.isDisabled().catch(() => false))) {
      await toucher(bp, "Créer le PDF");
      const sv = await p.waitForSelector('[data-act="saveFile"]', { timeout: 45000 }).catch(() => null);
      if (sv) {
        await lire();
        const [d] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }).catch(() => null), toucher(p.locator('[data-act="saveFile"]'), "Enregistrer le fichier")]);
        if (d) { const f = `${OUT}/${P.id}.pdf`; await d.saveAs(f); pdfOk = fs.statSync(f).size > 20000; if (!pdfOk) inc("pdf_vide", "bloquant", "PDF téléchargé trop petit"); if (!P.garder) fs.unlinkSync(f); }
        else inc("export_echec", "bloquant", "Le bouton « Enregistrer » ne télécharge rien");
      } else inc("export_echec", "bloquant", "Le PDF n'a pas été créé (délai dépassé)");
    }
    const bw = await trouver(boutonTexte(/Créer le Word/), "Créer le Word", { optionnel: true, ecrans: 6 });
    if (bw) {
      await toucher(bw, "Créer le Word");
      const sv = await p.waitForSelector('[data-act="saveFile"]', { timeout: 30000 }).catch(() => null);
      if (sv) { const [d] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }).catch(() => null), toucher(p.locator('[data-act="saveFile"]'), "Enregistrer le Word")]); if (d) { const f = `${OUT}/${P.id}.docx`; await d.saveAs(f); wordOk = fs.statSync(f).size > 3000; fs.unlinkSync(f); } else inc("export_echec", "majeur", "Le Word n'est pas téléchargé"); }
      else inc("export_echec", "majeur", "Le Word n'a pas été créé");
    }
    J.pdf = pdfOk; J.word = wordOk;
    if (vide && (pdfOk || wordOk)) inc("devis_vide_exporte", "majeur", "Un devis à 0 FCFA a pu être exporté sans aucun avertissement");
    if (pdfOk && wordOk && !vide) J.reussi = true;
    else if (!J.abandon) { J.abandon = vide ? "devis non chiffré" : "export incomplet"; }
    await verifier();
    J.tempsModele = Math.round(J.tempsModele);
  } catch (e) {
    if (!e.abandon) { inc("exception_simulateur", "bloquant", "Parcours interrompu : " + String(e.message).split("\n")[0]); J.abandon = J.abandon || "exception : " + String(e.message).split("\n")[0].slice(0, 100); }
    J.tempsModele = Math.round(J.tempsModele);
  }
  // Frictions VISIBLES seulement : une erreur silencieuse (valeur mal lue) n'est pas perçue sur le moment, elle rend le devis faux.
  delete J._tr; J.reelMs = Date.now() - t0;
  const SILENCIEUX = new Set(["saisie_mal_lue", "saisie_perdue", "champ_sans_libelle", "erreur_muette"]);
  const PETIT = new Set(["libelle_tronque"]);
  let fr = J.hesitations * 0.5 + J.mort * 0.5;
  for (const x of J.incidents) { if (SILENCIEUX.has(x.cat) || x.grav === "info") continue; fr += PETIT.has(x.cat) ? 0.3 : x.grav === "bloquant" ? 3 : x.grav === "majeur" ? 1.5 : 0; }
  J.frictions = Math.round(fr * 10) / 10;
  J.exact = !J.incidents.some((x) => SILENCIEUX.has(x.cat) && x.cat !== "champ_sans_libelle");
  J.bloqueVisible = J.incidents.some((x) => x.grav === "bloquant" && !SILENCIEUX.has(x.cat));
  if (J.reussi && !J.exact) { J.reussi = false; J.abandon = "devis FAUX (valeur saisie mal lue sans avertissement)"; J.devisFaux = true; }
  if (J.reussi && J.frictions > P.patience) { J.reussi = false; J.abandon = `patience épuisée (frictions ${J.frictions} > ${P.patience})`; J.abandonHumain = true; }
  await ctx.close();
  return J;
}

// ---------- exécution ----------
(async () => {
  const browser = await chromium.launch();
  const taches = []; for (const m of METIERS) for (const P of personnages(m)) if (!ID || P.id === ID) taches.push(P);
  const out = fs.createWriteStream(`${OUT}/parcours.jsonl`);
  let fait = 0; const t0 = Date.now();
  const worker = async () => { while (taches.length) { const P = taches.shift(); const J = await parcours(browser, P).catch((e) => ({ id: P.id, metier: P.metier, info: P.info, largeur: P.largeur, incidents: [{ cat: "exception_simulateur", grav: "bloquant", msg: String(e.message).slice(0, 200) }], reussi: false, abandon: "exception simulateur" })); out.write(JSON.stringify(J) + "\n"); fait++; if (fait % 25 === 0) console.log(`${fait} parcours — ${Math.round((Date.now() - t0) / 1000)} s`); } };
  await Promise.all(Array.from({ length: WORKERS }, worker));
  out.end(); await browser.close();
  console.log(`Terminé : ${fait} parcours en ${Math.round((Date.now() - t0) / 1000)} s → ${OUT}/parcours.jsonl`);
})();
