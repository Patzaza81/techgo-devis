// MÉTIER PLOMBERIE — formules seulement ; prix et rendements vides (bloquants) tant que non saisis.
import { mk, rent, need, hasN } from "./commun.js";

const plomberie = {
  id: "plomberie", label: "Plomberie", version: "1.0",
  seeds: [
    mk("PLO-TUYAU", "Tuyauterie", "materiaux", "ml", "unitaire", null, { pack: "plomberie" }),
    mk("PLO-RACCORD", "Raccords et accessoires", "materiaux", "pièce", "unitaire", null, { pack: "plomberie" }),
    mk("MO-PLOMBERIE", "Pose par point d'eau", "main_oeuvre", "point", "unitaire", null, { pack: "plomberie" }),
  ],
  prestations: [{
    id: "points", label: "Points d'eau",
    params: [
      { key: "points", label: "Nombre de points d'eau", type: "number", def: null },
      { key: "mlPoint", label: "Mètres de tuyau par point", type: "number", def: null },
      { key: "raccPoint", label: "Raccords par point", type: "number", def: null },
    ],
    build(p) {
      const pts = p.points;
      const bad = pts > 0 ? {} : { unknown: "Nombre de points à renseigner" };
      return [
        { key: "tu", itemId: "PLO-TUYAU", group: "Fournitures", role: "Tuyauterie", mode: "factor", baseQty: pts, factor: p.mlPoint, ...(p.mlPoint > 0 ? bad : { unknown: "Mètres par point à renseigner" }) },
        { key: "ra", itemId: "PLO-RACCORD", group: "Fournitures", role: "Raccords", mode: "factor", baseQty: pts, factor: p.raccPoint, ...(p.raccPoint > 0 ? bad : { unknown: "Raccords par point à renseigner" }) },
        { key: "mo", itemId: "MO-PLOMBERIE", group: "Main-d'œuvre", label: "Pose par point d'eau", mode: "flat", qty: pts, ...bad },
      ];
    },
  }],
};
export default plomberie;
