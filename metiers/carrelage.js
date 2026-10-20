// MÉTIER CARRELAGE — formules seulement ; prix et rendements vides (bloquants) tant que non saisis.
import { mk, rent, need, hasN } from "./commun.js";

const carrelage = {
  id: "carrelage", label: "Carrelage", version: "1.0",
  seeds: [
    mk("CAR-CARREAU", "Carreaux", "materiaux", "boîte", "unitaire", null, { pack: "carrelage" }),
    mk("CAR-COLLE", "Colle carrelage (sac)", "materiaux", "sac", "unitaire", null, { pack: "carrelage" }),
    mk("CAR-JOINT", "Joint de carrelage (sac)", "materiaux", "sac", "unitaire", null, { pack: "carrelage" }),
    mk("MO-CARRELAGE", "Pose de carrelage", "main_oeuvre", "m²", "unitaire", null, { pack: "carrelage" }),
  ],
  prestations: [{
    id: "pose", label: "Pose de carrelage",
    params: [
      { key: "boxM2", label: "Surface couverte par boîte (m²)", type: "number", def: null },
      { key: "pertePct", label: "Pertes de coupe carrelage (%)", type: "number", def: null },
    ],
    build(p) {
      const lossOk = hasN(p.pertePct);
      return [
        { key: "car", itemId: "CAR-CARREAU", group: "Fournitures", role: "Carreaux (surface + pertes, arrondi à la boîte)", mode: "yield", yield: p.boxM2, ...(lossOk ? { lossPct: p.pertePct } : {}), ...(p.boxM2 > 0 ? {} : { unknown: "Surface par boîte à renseigner" }), ...(lossOk ? {} : { unknown: "Pertes de coupe à renseigner" }) },
        { key: "col", itemId: "CAR-COLLE", group: "Fournitures", role: "Colle", mode: "yield" },
        { key: "jt", itemId: "CAR-JOINT", group: "Fournitures", role: "Joint", mode: "yield" },
        { key: "mo", itemId: "MO-CARRELAGE", group: "Main-d'œuvre", label: "Pose de carrelage", mode: "area", noLoss: true },
      ];
    },
  }],
};
export default carrelage;
