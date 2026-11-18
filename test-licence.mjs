// Licence : essai gratuit, activation par code, expiration, prolongation.
const _m = {};
globalThis.localStorage = { getItem: (k) => (k in _m ? _m[k] : null), setItem: (k, v) => { _m[k] = String(v); }, removeItem: (k) => { delete _m[k]; } };
const fs = await import("node:fs");
const Lic = await import("./licence.js");
const { EMPREINTES } = await import("./licence-codes.js");

let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? "OK   " : "FAIL ") + name + (ok ? "" : `  obtenu=${JSON.stringify(got)} attendu=${JSON.stringify(want)}`)); };
const J = 86400000, T0 = Date.UTC(2026, 10, 16);

// Saisie du code : 4 formes acceptées, 6 refusées
eq("code exact", Lic.normaliser("TGD-ABCD-2345-WXYZ"), "TGD-ABCD-2345-WXYZ");
eq("minuscules", Lic.normaliser("tgd-abcd-2345-wxyz"), "TGD-ABCD-2345-WXYZ");
eq("sans tirets, avec espaces", Lic.normaliser(" tgd abcd 2345 wxyz "), "TGD-ABCD-2345-WXYZ");
eq("tirets en trop", Lic.normaliser("TGD--ABCD-2345--WXYZ"), "TGD-ABCD-2345-WXYZ");
for (const [nom, v] of [["vide", ""], ["trop court", "TGD-ABCD-2345"], ["trop long", "TGD-ABCD-2345-WXYZ9"], ["mauvais préfixe", "ABC-ABCD-2345-WXYZ"], ["chiffre interdit 0", "TGD-ABCD-2345-WXY0"], ["lettre interdite I", "TGD-ABCD-2345-WXYI"]]) eq("refusé : " + nom, Lic.normaliser(v), null);

// Codes générés : forme valide, tous différents
const lot = new Set(); for (let i = 0; i < 2000; i++) lot.add(Lic.nouveauCode());
eq("2000 codes générés tous différents", lot.size, 2000);
eq("codes générés de forme valide", [...lot].every((c) => Lic.normaliser(c) === c), true);
eq("liste d'empreintes livrée non vide", EMPREINTES.length >= 200, true);
eq("empreintes : 24 caractères hexadécimaux, sans doublon", EMPREINTES.every((h) => /^[0-9a-f]{24}$/.test(h)) && new Set(EMPREINTES).size === EMPREINTES.length, true);
eq("aucun code en clair dans le dépôt", fs.readFileSync("licence-codes.js", "utf8").includes("TGD-"), false);

// Essai gratuit : 3 devis différents, pas plus
eq("départ : essai, 3 restants", [Lic.etat(T0).mode, Lic.etat(T0).restants], ["essai", Lic.ESSAI_DEVIS]);
for (const id of ["q1", "q2"]) { eq("sortie permise " + id, Lic.peutSortir(id, T0), true); Lic.noterSortie(id, T0); }
Lic.noterSortie("q1", T0);
eq("le même devis sorti deux fois ne compte qu'une fois", Lic.etat(T0).restants, 1);
Lic.noterSortie("q3", T0);
eq("après 3 devis : essai terminé", Lic.etat(T0).mode, "termine");
eq("4e devis refusé", Lic.peutSortir("q4", T0), false);
eq("un devis déjà sorti reste sortable", Lic.peutSortir("q2", T0), true);

// Activation
eq("code mal formé refusé", (await Lic.activer("TGD-123", T0)).ok, false);
eq("code bien formé mais inconnu refusé", (await Lic.activer("TGD-ABCD-2345-WXYZ", T0)).ok, false);
eq("toujours bloqué après deux refus", Lic.peutSortir("q4", T0), false);
// Code de test : on ajoute son empreinte à la liste chargée (les vrais codes ne sont pas dans le dépôt).
const code = Lic.nouveauCode(), code2 = Lic.nouveauCode();
EMPREINTES.push(await Lic.empreinte(code), await Lic.empreinte(code2));
const a = await Lic.activer(code.toLowerCase().replace(/-/g, " "), T0);
eq("code valide accepté (saisie approximative)", [a.ok, a.expire, a.enregistre], [true, new Date(T0 + 365 * J).toISOString().slice(0, 10), true]);
eq("licence active : sorties illimitées", [Lic.etat(T0).mode, Lic.peutSortir("q4", T0), Lic.peutSortir("q99", T0)], ["licence", true, true]);
eq("même code refusé une seconde fois", (await Lic.activer(code, T0)).ok, false);
eq("veille de l'expiration : encore active", Lic.etat(T0 + 364 * J).mode, "licence");
eq("après expiration : bloqué de nouveau", [Lic.etat(T0 + 366 * J).mode, Lic.etat(T0 + 366 * J).expiree, Lic.peutSortir("q100", T0 + 366 * J)], ["termine", true, false]);
eq("après expiration : anciens devis de l'essai toujours sortables", Lic.peutSortir("q1", T0 + 366 * J), true);
const b = await Lic.activer(code2, T0 + 100 * J);
eq("second code avant l'échéance : prolonge depuis la fin", b.expire, new Date(T0 + 730 * J).toISOString().slice(0, 10));
eq("lien WhatsApp : numéro et nom de l'entreprise", Lic.lienWhatsApp("ERCOG").startsWith("https://wa.me/237699881729?text=") && Lic.lienWhatsApp("ERCOG").includes("ERCOG"), true);

// Stockage indisponible (navigation privée) : on le dit, on ne plante pas
globalThis.localStorage = { getItem() { throw new Error("x"); }, setItem() { throw new Error("x"); }, removeItem() {} };
const Lic2 = await import("./licence.js?sans-stockage");
const code3 = Lic2.nouveauCode(); EMPREINTES.push(await Lic2.empreinte(code3));
const c = await Lic2.activer(code3, T0);
eq("sans stockage : activée pour la séance, signalée non enregistrée", [c.ok, c.enregistre, Lic2.etat(T0).mode], [true, false, "licence"]);

console.log(`\n${pass} réussis, ${fail} échoués`);
process.exit(fail ? 1 : 0);
