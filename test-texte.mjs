// Textes du devis : accord des unités dans les phrases (« 2 jours × 20 000 »), sans toucher aux symboles.
const { uniteAccord: u } = await import("./ui-doc.js");
let pass = 0, fail = 0;
const eq = (nom, a, b) => { const ok = a === b; ok ? pass++ : fail++; console.log(`${ok ? "OK  " : "ÉCHEC"} ${nom}${ok ? "" : ` → ${a} ≠ ${b}`}`); };
eq("2 jour → 2 jours", u("jour", 2), "jours");
eq("3 rouleau → 3 rouleaux", u("rouleau", 3), "rouleaux");
eq("12 Sac → « 12 sacs » (minuscule dans une phrase)", u("Sac", 12), "sacs");
eq("1 Pièce → « 1 pièce »", u("Pièce", 1), "pièce");
eq("2 pièce → 2 pièces", u("pièce", 2), "pièces");
eq("1 jour reste au singulier", u("jour", 1), "jour");
eq("1,5 jour reste au singulier (pluriel à partir de 2)", u("jour", 1.5), "jour");
eq("4 journée d'ouvrier → 4 journées d'ouvrier", u("journée d'ouvrier", 4), "journées d'ouvrier");
eq("1,5 journée d'équipe reste au singulier", u("journée d'équipe", 1.5), "journée d'équipe");
eq("m² ne change jamais", u("m²", 40), "m²");
eq("kg ne change jamais", u("kg", 5), "kg");
eq("ml ne change jamais", u("ml", 3), "ml");
eq("unité inconnue ou vide : inchangée", u("", 2) + "|" + u("Ensemble électrique", 2), "|Ensemble électrique");
console.log(`\n${pass} réussis, ${fail} échoués`); process.exit(fail ? 1 : 0);
