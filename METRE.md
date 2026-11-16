# Métré — formules et statut des données

Fichier de calcul : `metiers/metre.js`. Tests : `test-metre.mjs` (chaque exemple est recalculable à la main).

## Statut des données
| Donnée | Statut | D'où elle vient |
|---|---|---|
| Surfaces, volumes, périmètres, comptages | **Calculé** (géométrie) | Dimensions saisies |
| Blocs par m² | **Calculé** (géométrie) | Dimensions du bloc et du joint saisies |
| Couverture d'un pot, carreaux par carton, kg de colle ou de joint par m², poids des sacs | **À renseigner** | Emballage du produit |
| Dosages (ciment, sable, gravier par m³) | **À renseigner** | Pratique de l'entreprise ou plan |
| Pertes, casse, chutes (%) | **À renseigner** | Pratique de l'entreprise |
| Rendement de l'équipe par jour, nombre d'ouvriers | **À renseigner** | Chantiers de l'entreprise |
| Longueur des barres, couronnes, rouleaux | **À renseigner** | Fournisseur |
| Tous les prix | **À renseigner** | Fournisseurs, tarifs de l'entreprise |
| Section des câbles, calibre des protections, terre | **Jamais calculé** | Électricien qualifié, schéma |
| Ferraillage (nombre de barres, diamètres, cadres, recouvrements) | **Jamais calculé** | Plan de ferraillage |
| Formulation du béton, classe de résistance | **Jamais calculé** | Étude ou plan |
| Diamètre et type des tuyaux | **Jamais calculé** | Choix du plombier |
| Rappels d'oublis (`metiers/aide.js`) | **À valider par un professionnel** | Rédigés sans document de référence |
| Convention « mortier = volume géométrique des joints » | **À valider par un maçon** | Géométrie ; alvéoles et gâchage perdu passent par les pertes |

## Formules
**Communes** — Paroi : `nombre × longueur × hauteur × faces − ouvertures`. Pertes : `× (1 + % ÷ 100)`. Main-d'œuvre à la journée : `quantité ÷ rendement par jour × ouvriers`, arrondie à la demi-journée au-dessus sur le total de la prestation.

**Peinture** — Pièce : `2 × (L + l) × h − ouvertures (+ L × l si plafond)`. Produit : `surface × couches × pertes ÷ m² couverts par unité`.

**Carrelage** — Sol : `L × l − surface à déduire`. Cartons : `surface × pertes ÷ (carreaux par carton × a × b)`. Colle, joint : `surface × kg/m² ÷ poids du sac`. Plinthes : `(2 × (L + l) − portes) × pertes ÷ longueur d'une plinthe`.

**Maçonnerie** — Blocs : `surface ÷ ((Lbloc + joint) × (Hbloc + joint)) × pertes`. Mortier des joints : `surface × épaisseur × (1 − Lbloc × Hbloc ÷ ((Lbloc + joint) × (Hbloc + joint)))`. Béton, chape : `nombre × L × l × e`. Enduit : `surface × épaisseur`. Ciment : `volume × kg/m³ ÷ poids du sac` ; sable, gravier : `volume × m³/m³`. Fouille : `nombre × L × l × profondeur` (terre en place). Armatures : filants `éléments × barres × (longueur + ajout) ÷ longueur de barre` ; cadres `(longueur ÷ espacement, arrondi au-dessus, + 1) × éléments × fer d'un cadre ÷ longueur de barre`.

**Plomberie** — Tuyau : `longueur × pertes ÷ longueur de barre`. Colliers : `longueur ÷ espacement, arrondi au-dessus, + 1`. Raccords, appareils, accessoires : comptés.

**Électricité** — Câble : `lignes × (tracé + raccordements × réserve) × fils × pertes ÷ longueur du rouleau`. Conduit : `lignes × tracé × pertes ÷ longueur du rouleau`. Points, boîtes, matériel du tableau : comptés.

## Limites connues
- Pièces rectangulaires seulement (une pièce en L se saisit en deux ouvrages).
- Pas de calepinage de carrelage : les coupes passent par le pourcentage de pertes.
- Coffrage, étaiement, eau de gâchage : non calculés (rappels seulement).
- Aucun essai sur chantier réel ni validation par un professionnel de chaque métier à ce jour.
