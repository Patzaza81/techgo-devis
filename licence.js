// Licence de l'application — vérifiée dans le téléphone, sans serveur (l'application
// fonctionne hors ligne et ne connaît aucun compte).
//
// Principe : l'essai gratuit permet de sortir ESSAI_DEVIS devis (PDF, Word, impression,
// envoi). Ensuite, un code de licence acheté débloque les sorties pendant DUREE_JOURS.
// La saisie, les calculs, le catalogue et les sauvegardes ne sont JAMAIS bloqués : un
// utilisateur ne perd pas l'accès à ses données.
//
// Limites connues, assumées tant qu'il n'y a pas de serveur :
//  - un même code peut être saisi sur plusieurs appareils ;
//  - la date vient de l'horloge du téléphone ;
//  - les codes valides sont reconnus par leur empreinte (licence-codes.js) : la liste des
//    codes en clair n'est jamais dans le dépôt.
import { EMPREINTES } from "./licence-codes.js";

export const ESSAI_DEVIS = 3;       // nombre de devis différents sortis gratuitement
export const DUREE_JOURS = 365;     // durée d'une licence à partir de l'activation
export const VENTE_WHATSAPP = "237699881729"; // numéro WhatsApp de TechGo pour obtenir un code
const CLE = "tgd.licence.v1";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O ni 1/I
const FORME = /^TGD-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

const mem = {};
const stock = {
  get() { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch { return mem.v || {}; } },
  set(v) { mem.v = v; try { localStorage.setItem(CLE, JSON.stringify(v)); return true; } catch { return false; } },
};
const jourMs = 86400000;

// Saisie tolérante : minuscules, espaces, tirets oubliés. Renvoie le code normalisé ou null.
export function normaliser(saisie) {
  const brut = String(saisie || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!brut.startsWith("TGD") || brut.length !== 15) return null;
  const c = `TGD-${brut.slice(3, 7)}-${brut.slice(7, 11)}-${brut.slice(11, 15)}`;
  return FORME.test(c) ? c : null;
}
export async function empreinte(code) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("techgo-devis|" + code));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function nouveauCode(alea = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  let s = ""; const o = alea(24);
  for (let i = 0; s.length < 12 && i < o.length; i++) if (o[i] < 224) s += ALPHABET[o[i] % 32]; // 224 = 7 × 32 : tirage sans biais
  if (s.length < 12) return nouveauCode(alea);
  return `TGD-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export function etat(maintenant = Date.now()) {
  const v = stock.get();
  const sortis = Array.isArray(v.sortis) ? v.sortis : [];
  if (v.exp && v.exp > maintenant) return { mode: "licence", expire: new Date(v.exp).toISOString().slice(0, 10), joursRestants: Math.ceil((v.exp - maintenant) / jourMs) };
  const restants = Math.max(0, ESSAI_DEVIS - sortis.length);
  return { mode: restants > 0 ? "essai" : "termine", restants, sortis: sortis.length, expiree: !!v.exp };
}
// Peut-on sortir (PDF, Word, impression, envoi) ce devis ? Un devis déjà sorti reste sortable.
export function peutSortir(devisId, maintenant = Date.now()) {
  const e = etat(maintenant);
  if (e.mode === "licence" || e.mode === "essai") return true;
  return (stock.get().sortis || []).includes(devisId);
}
export function noterSortie(devisId, maintenant = Date.now()) {
  if (etat(maintenant).mode === "licence") return;
  const v = stock.get(); const sortis = Array.isArray(v.sortis) ? v.sortis : [];
  if (!sortis.includes(devisId)) stock.set({ ...v, sortis: [...sortis, devisId] });
}
export async function activer(saisie, maintenant = Date.now()) {
  const code = normaliser(saisie);
  if (!code) return { ok: false, erreur: "Code incomplet. Il ressemble à TGD-XXXX-XXXX-XXXX." };
  const h = await empreinte(code);
  if (!EMPREINTES.includes(h)) return { ok: false, erreur: "Ce code n'est pas reconnu. Vérifie chaque lettre, ou écris-nous sur WhatsApp." };
  const v = stock.get();
  if ((v.codes || []).includes(h)) return { ok: false, erreur: "Ce code a déjà été utilisé sur cet appareil." };
  // Un nouveau code prolonge une licence encore en cours au lieu de l'écraser.
  const depart = v.exp && v.exp > maintenant ? v.exp : maintenant;
  const exp = depart + DUREE_JOURS * jourMs;
  const enregistre = stock.set({ ...v, exp, codes: [...(v.codes || []), h], activeLe: maintenant });
  return { ok: true, expire: new Date(exp).toISOString().slice(0, 10), enregistre };
}
export const lienWhatsApp = (entreprise) => `https://wa.me/${VENTE_WHATSAPP}?text=${encodeURIComponent(`Bonjour, je veux un code de licence TechGo Devis${entreprise ? " pour " + entreprise : ""}.`)}`;
