// MÉTIER ELECTRICITE — formules seulement ; prix et rendements vides (bloquants) tant que non saisis.
import { mk, rent, need, hasN } from "./commun.js";

const electricite = {
  id: "electricite", label: "Électricité", version: "1.0",
  seeds: [
    mk("ELE-CABLE", "Câble (rouleau)", "materiaux", "rouleau", "unitaire", null, { pack: "electricite", yieldUnit: "ml" }),
    mk("ELE-POINT", "Appareillage par point", "materiaux", "point", "unitaire", null, { pack: "electricite" }),
    mk("MO-ELECTRICITE", "Pose par point", "main_oeuvre", "point", "unitaire", null, { pack: "electricite" }),
  ],
  prestations: [{
    id: "circuits", label: "Circuits électriques",
    params: [
      { key: "longueur", label: "Longueur totale des circuits (ml)", type: "number", def: null },
      { key: "coef", label: "Coefficient technique de longueur", type: "number", def: null },
      { key: "points", label: "Nombre de points", type: "number", def: null },
    ],
    build(p) {
      const okL = p.longueur > 0 && p.coef > 0;
      return [
        { key: "ca", itemId: "ELE-CABLE", group: "Fournitures", role: "Câble (longueur × coefficient technique, + pertes)", mode: "yield", baseQty: okL ? p.longueur * p.coef : undefined, ...(okL ? {} : { unknown: "Longueur et coefficient à renseigner" }) },
        { key: "pt", itemId: "ELE-POINT", group: "Fournitures", role: "Appareillage", mode: "fixed", qty: p.points, ...(p.points > 0 ? {} : { unknown: "Nombre de points à renseigner" }) },
        { key: "mo", itemId: "MO-ELECTRICITE", group: "Main-d'œuvre", label: "Pose par point", mode: "flat", qty: p.points, ...(p.points > 0 ? {} : { unknown: "Nombre de points à renseigner" }) },
      ];
    },
  }],
};
export default electricite;
