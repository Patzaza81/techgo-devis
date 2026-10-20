// MÉTIER MACONNERIE — formules seulement ; prix et rendements vides (bloquants) tant que non saisis.
import { mk, rent, need, hasN } from "./commun.js";

const maconnerie = {
  id: "maconnerie", label: "Maçonnerie", version: "1.0",
  seeds: [
    mk("MAC-BLOC", "Bloc (parpaing)", "materiaux", "bloc", "unitaire", null, { pack: "maconnerie" }),
    mk("MAC-MORTIER", "Mortier / ciment de pose", "materiaux", "sac", "unitaire", null, { pack: "maconnerie" }),
    mk("MO-MACONNERIE", "Élévation de mur", "main_oeuvre", "m²", "unitaire", null, { pack: "maconnerie" }),
  ],
  prestations: [{
    id: "mur", label: "Mur en blocs",
    params: [{ key: "blocsM2", label: "Nombre de blocs par m² de mur", type: "number", def: null }],
    build(p) {
      return [
        { key: "bl", itemId: "MAC-BLOC", group: "Fournitures", role: "Blocs (surface + pertes)", mode: "factor", factor: p.blocsM2, ...(p.blocsM2 > 0 ? {} : { unknown: "Nombre de blocs par m² à renseigner" }) },
        { key: "mo", itemId: "MAC-MORTIER", group: "Fournitures", role: "Mortier", mode: "yield" },
        { key: "mo2", itemId: "MO-MACONNERIE", group: "Main-d'œuvre", label: "Élévation de mur", mode: "area", noLoss: true },
      ];
    },
  }],
};
export default maconnerie;
