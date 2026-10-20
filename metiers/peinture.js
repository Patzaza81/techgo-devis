// MÉTIER PEINTURE — comprend les enduits et le ponçage (un seul métier, plusieurs prestations).
// Valeurs réelles : prestation « Enduit 3 couches + ponçage » (devis DEV-2026-09-001 du 28/09/2026).
// Prestation « Peinture murs / façade » : formule seulement, prix et rendements vides (bloquants).
import { mk, rent, need, hasN } from "./commun.js";

// ---------- Articles : enduits (valeurs réelles) ----------
const SEEDS_ENDUITS = [
  mk("END-FIXACOAT", "Fixacoat (25 kg)", "materiaux", "pot", "unitaire", 22000, { yield: 39, pack: "peinture" }),
  mk("END-HOMAY", "Homay enduit extérieur (25 kg)", "materiaux", "sac", "unitaire", 25000, { pack: "peinture" }),
  mk("END-P60", "Papier-vert P60", "consommables", "rouleau", "unitaire", 19500, { tags: ["abrasif"], pack: "peinture" }),
  mk("END-P100", "Papier-vert P100", "consommables", "rouleau", "unitaire", 19500, { tags: ["abrasif"], pack: "peinture" }),
  mk("END-P120", "Papier-vert P120", "consommables", "rouleau", "unitaire", 19500, { tags: ["abrasif"], pack: "peinture" }),
  mk("END-P220", "Papier abrasif P220", "consommables", "paquet", "unitaire", 13000, { tags: ["abrasif"], pack: "peinture" }),
  mk("END-CIMENT", "Ciment ordinaire 32,5", "materiaux", "sac", "unitaire", 4500, { pack: "peinture" }),
  mk("END-ADDITIF", "Additif de mélange (sachet 5 kg)", "materiaux", "sachet", "unitaire", 3500, { pack: "peinture", packKg: 5 }),
  mk("END-MULTIPRIM", "Multiprim anti-alcali (25 kg)", "materiaux", "pot", "unitaire", 65000, { yield: 250, tags: ["primaire"], pack: "peinture" }),
  mk("MO-ENDUIT", "Application d'enduit (par couche)", "main_oeuvre", "m²", "unitaire", 400, { pack: "peinture" }),
  mk("MO-PONCAGE", "Ponçage (par passe)", "main_oeuvre", "m²", "unitaire", 100, { pack: "peinture" }),
  mk("MO-PRIMAIRE", "Application du primaire anti-alcali", "main_oeuvre", "m²", "unitaire", 150, { pack: "peinture" }),
  mk("TRA-CHANTIER-ENDUIT", "Transport et logistique de chantier (enduits)", "transport", "forfait", "forfait", 180000, { tags: ["transport"], pack: "peinture" }),
];

// ---------- Articles : peinture (prix vides) ----------
const SEEDS_PEINTURE = [
    mk("PEI-SOUS-COUCHE", "Sous-couche / impression", "materiaux", "seau", "unitaire", null, { pack: "peinture" }),
    mk("PEI-FINITION", "Peinture de finition", "materiaux", "seau", "unitaire", null, { pack: "peinture" }),
    mk("PEI-RUBAN", "Ruban de masquage", "consommables", "rouleau", "unitaire", null, { tags: ["protection"], pack: "peinture" }),
    mk("MO-PEINTURE", "Application de peinture (par couche)", "main_oeuvre", "m²", "unitaire", null, { pack: "peinture" }),
    mk("MO-PREPARATION", "Préparation du support", "main_oeuvre", "m²", "unitaire", null, { pack: "peinture" }),
];
SEEDS_PEINTURE.find((s) => s.ref === "MO-PREPARATION").tags = ["preparation"];

const peinture = {
  id: "peinture", label: "Peinture et enduits", version: "1.0",
  seeds: [...SEEDS_ENDUITS, ...SEEDS_PEINTURE],
  prestations: [
{
    id: "systeme3", label: "Enduit 3 couches + ponçage",
    expects: [{ tag: "abrasif", label: "Consommables de ponçage", severity: "verifier", hint: "Les passes de ponçage consomment des abrasifs." }],
    params: [
      { key: "primer", label: "Primaire anti-alcali", type: "select", options: [["non", "Non prévu"], ["option", "En option"], ["inclus", "Inclus"]], def: "option" },
      { key: "additifKg", label: "Additif par sac de Homay (kg)", type: "number", def: 10 },
      { key: "abr60", label: "Papier-vert P60 (rouleaux)", type: "number", def: null },
      { key: "abr100", label: "Papier-vert P100 (rouleaux)", type: "number", def: null },
      { key: "abr120", label: "Papier-vert P120 (rouleaux)", type: "number", def: null },
      { key: "abr220", label: "Papier abrasif P220 (paquets)", type: "number", def: null },
      { key: "transport", label: "Forfait transport et logistique", type: "select", options: [["oui", "Oui"], ["non", "Non"]], def: "oui" },
    ],
    build(p) {
      const A = "A. Fournitures d'enduit", B = "B. Consommables de ponçage et d'égrenage", C = "C. Ciment ordinaire 32,5 (mortier de pose — Fixacoat)", Dg = "D. Additif de mélange (Homay)";
      const M = "Main-d'œuvre d'application";
      const opt = p.primer === "option", inc = p.primer === "inclus";
      const kg = hasN(p.additifKg) ? p.additifKg : 10;
      const L = [
        { key: "fix", itemId: "END-FIXACOAT", group: A, role: "1re couche — dressage et fixation du support brut", mode: "yield" },
        { key: "hom2", itemId: "END-HOMAY", group: A, role: "2e couche — ratissage, reprise des irrégularités", mode: "yield", yield: 50 },
        { key: "hom3", itemId: "END-HOMAY", group: A, role: "3e couche — lissage de finition (demi-dose)", mode: "yield", yield: 100 },
        { key: "p60", itemId: "END-P60", group: B, role: "Égrenage du support brut avant la 1re couche", mode: "fixed", qty: p.abr60 ?? undefined, ...(hasN(p.abr60) ? {} : { unknown: "Quantité à saisir" }) },
        { key: "p100", itemId: "END-P100", group: B, role: "Ponçage de la 1re couche (Fixacoat)", mode: "fixed", qty: p.abr100 ?? undefined, ...(hasN(p.abr100) ? {} : { unknown: "Quantité à saisir" }) },
        { key: "p120", itemId: "END-P120", group: B, role: "Ponçage de la 2e couche (Homay)", mode: "fixed", qty: p.abr120 ?? undefined, ...(hasN(p.abr120) ? {} : { unknown: "Quantité à saisir" }) },
        { key: "p220", itemId: "END-P220", group: B, role: "Ponçage fin de la 3e couche (finition)", mode: "fixed", qty: p.abr220 ?? undefined, ...(hasN(p.abr220) ? {} : { unknown: "Quantité à saisir" }) },
        { key: "cim", itemId: "END-CIMENT", group: C, role: "1 sac par pot de Fixacoat posé", mode: "ratio", of: "fix", factor: 1 },
        { key: "add2", itemId: "END-ADDITIF", group: Dg, role: `Mélange Homay 2e couche (${kg} kg/sac)`, mode: "ratio", of: "hom2", factor: kg / 5 },
        { key: "add3", itemId: "END-ADDITIF", group: Dg, role: `Mélange Homay 3e couche (${kg} kg/sac)`, mode: "ratio", of: "hom3", factor: kg / 5 },
        { key: "l1", itemId: "MO-ENDUIT", group: M, label: "Enduit non repassé (1re couche)", mode: "area", noLoss: true },
        { key: "l2", itemId: "MO-PONCAGE", group: M, label: "Ponçage — passe 1/3 (après la 1re couche)", mode: "area", noLoss: true },
        { key: "l3", itemId: "MO-ENDUIT", group: M, label: "Enduit intermédiaire (2e couche)", mode: "area", noLoss: true },
        { key: "l4", itemId: "MO-PONCAGE", group: M, label: "Ponçage — passe 2/3 (après la 2e couche)", mode: "area", noLoss: true },
        { key: "l5", itemId: "MO-ENDUIT", group: M, label: "Enduit de finition (3e couche)", mode: "area", noLoss: true },
        { key: "l6", itemId: "MO-PONCAGE", group: M, label: "Ponçage — passe 3/3 (après la 3e couche)", mode: "area", noLoss: true },
      ];
      if (p.transport !== "non") L.push({ key: "tr", itemId: "TRA-CHANTIER-ENDUIT", group: "Transport et logistique", mode: "flat", qty: 1 });
      if (opt || inc) {
        const G = "Option — Primaire anti-alcali";
        L.push({ key: "mp", itemId: "END-MULTIPRIM", group: G, role: "Impression du support, appliquée avant la 1re couche", mode: "yield", option: opt });
        L.push({ key: "lp", itemId: "MO-PRIMAIRE", group: G, label: "Application du primaire anti-alcali", mode: "area", noLoss: true, option: opt });
      }
      return L;
    },
  },
{
    id: "murs", label: "Peinture murs / façade",
    expects: [{ tag: "preparation", label: "Préparation du support", severity: "verifier", hint: "Ajouter la préparation ou indiquer « sans objet »." }],
    params: [
      { key: "couches", label: "Nombre de couches de finition", type: "number", def: null },
      { key: "sousCouche", label: "Sous-couche", type: "select", options: [["oui", "Oui"], ["non", "Non"]], def: "oui" },
      { key: "preparation", label: "Préparation du support (main-d'œuvre)", type: "select", options: [["oui", "Oui"], ["non", "Non"]], def: "oui" },
    ],
    build(p) {
      const c = p.couches; const U = need(c, "Nombre de couches"); const m = c > 0 ? { mult: c } : U;
      const L = [];
      if (p.sousCouche !== "non") L.push({ key: "sc", itemId: "PEI-SOUS-COUCHE", group: "Fournitures de peinture", role: "Sous-couche", mode: "yield" });
      L.push({ key: "pf", itemId: "PEI-FINITION", group: "Fournitures de peinture", role: "Peinture de finition", mode: "yield", ...m });
      if (p.preparation !== "non") L.push({ key: "prep", itemId: "MO-PREPARATION", group: "Main-d'œuvre", label: "Préparation du support", mode: "area", noLoss: true, tag: "preparation" });
      L.push({ key: "mo", itemId: "MO-PEINTURE", group: "Main-d'œuvre", label: "Application de peinture (par couche)", mode: "area", noLoss: true, ...m });
      return L;
    },
  }
  ],
};
export default peinture;
