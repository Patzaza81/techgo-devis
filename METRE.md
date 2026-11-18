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
| Rendement de toute l'équipe par jour, nombre d'ouvriers, façon de facturer | **À renseigner** | Chantiers de l'entreprise |
| Longueur des barres, couronnes, rouleaux | **À renseigner** | Fournisseur |
| Tous les prix | **À renseigner** | Fournisseurs, tarifs de l'entreprise |
| Section des câbles, calibre des protections, terre | **Jamais calculé** | Électricien qualifié, schéma |
| Ferraillage (nombre de barres, diamètres, cadres, recouvrements) | **Jamais calculé** | Plan de ferraillage |
| Formulation du béton, classe de résistance | **Jamais calculé** | Étude ou plan |
| Diamètre et type des tuyaux | **Jamais calculé** | Choix du plombier |
| Rappels d'oublis (`metiers/aide.js`) | **À valider par un professionnel** | Rédigés sans document de référence |
| Convention « mortier = volume géométrique des joints » | **À valider par un maçon** | Géométrie ; alvéoles et gâchage perdu passent par les pertes |

## Exact ou estimation
L'application écrit « exact » ou « estimation » à côté de chaque quantité (dans l'ouvrage, dans la ligne du devis, dans le contrôle avant envoi).

| Quantité | Nature | Pourquoi |
|---|---|---|
| Blocs, cartons, plinthes, barres de tuyau, rouleaux, appareils, points, barres d'acier | **Exact** pour les dimensions et les pertes saisies | Comptage ou découpe |
| Pots de peinture, colle, joint | **Estimation** | Dépend du support et de l'outil |
| Mortier des joints | **Estimation géométrique** | Volume des joints pleins ; alvéoles et gâchage perdu passent par « pertes de mortier » |
| Ciment, sable, gravier, enduit | **Estimation** | Volume exact × dosage saisi ; la consommation réelle dépend du dosage sur place |
| Colliers | **Estimation** | Tracé d'un seul tenant |
| Jours de chantier, journées | **Estimation** | Dépend du rendement réel |

## Main-d'œuvre : trois façons de facturer, une seule par ouvrage
Le rendement saisi est toujours celui de **toute l'équipe en une journée**. `jours de chantier = quantité ÷ rendement`, additionnés sur tout le devis pour une même prestation, puis arrondis à la demi-journée au-dessus.

| Mode | Quantité de la ligne | Unité | Prix à saisir |
|---|---|---|---|
| À la tâche | quantité de l'ouvrage | m², ml, m³, point | prix d'une unité |
| Par jour et par ouvrier | jours de chantier × nombre d'ouvriers | journée d'ouvrier | **un** ouvrier, **une** journée |
| Par jour, toute l'équipe | jours de chantier | journée d'équipe | **toute** l'équipe, une journée |

Si le prix de l'équipe vaut `ouvriers × prix d'un ouvrier`, les deux modes à la journée donnent le même montant (vérifié sur 300 tirages). L'effectif figure dans le nom de la ligne ; deux équipes de taille différente donnent deux lignes. Une main-d'œuvre saisie à la main en plus de celle du métré est signalée avant l'envoi.

## Mémoire de l'entreprise
- **Valeurs de pratique** (pertes, dosages, consommations, rendement, façon de facturer) : proposées au prochain ouvrage du même type, marquées « à confirmer ». Tant que l'artisan n'a pas répondu, l'ouvrage n'entre pas dans le devis.
- **Valeurs d'un produit** (format et carton d'un carreau, dimensions d'un bloc, longueur d'une barre ou d'un rouleau, couverture d'un pot) : gardées sous le nom du produit, reprises seulement si le même nom est saisi. Un autre nom vide les champs.
- Dimensions et nom du produit : jamais repris.

## Formules
**Communes** — Paroi : `nombre × longueur × hauteur × faces − ouvertures × nombre × faces`. Pertes : `× (1 + % ÷ 100)`. Nombres d'éléments, de couches, d'ouvriers, d'articles : entiers, 1 ou plus (0 ou 1,5 sont refusés).

**Peinture** — Pièce : `2 × (L + l) × h − ouvertures (+ L × l si plafond)`. Produit : `surface × couches × pertes ÷ m² couverts par unité`.

**Carrelage** — Sol : `L × l − surface à déduire`. Cartons : `surface × pertes ÷ (carreaux par carton × a × b)` ; au m² : `surface × pertes`. Colle, joint : `surface × kg/m² ÷ poids du sac` (sans la casse des carreaux). Plinthes : `(2 × (L + l) − portes) × coupes ÷ longueur d'une plinthe`.

**Maçonnerie** — Blocs : `surface ÷ ((Lbloc + joint) × (Hbloc + joint)) × pertes`. Mortier des joints : `surface × épaisseur × (1 − Lbloc × Hbloc ÷ ((Lbloc + joint) × (Hbloc + joint))) × pertes de mortier` (identité vérifiée : volume du mur = blocs + joints). Béton, chape : `nombre × L × l × e × pertes`. Enduit : `surface × épaisseur × pertes`. Ciment : `volume × kg/m³ ÷ poids du sac` ; sable, gravier : `volume × m³/m³`. Fouille : `nombre × L × l × profondeur` (terre en place). Armatures, par **découpe** : `pièces par barre = partie entière de (barre ÷ longueur d'une pièce)` ; `barres = pièces ÷ pièces par barre, entier au-dessus`. Cadres : `(longueur ÷ espacement, entier au-dessus, + 1) × éléments`. Une pièce plus longue que la barre déclenche une alerte (recouvrements à lire sur le plan).

**Plomberie** — Tuyau : `longueur × pertes ÷ longueur de barre`. Colliers : `longueur ÷ espacement, entier au-dessus, + 1`. Raccords, appareils, accessoires : comptés. Un point d'eau par appareil.

**Électricité** — Câble : `lignes × (tracé + raccordements × longueur laissée) × fils × pertes ÷ longueur du rouleau`. Conduit : `lignes × tracé × pertes ÷ longueur du rouleau` (pas multiplié par le nombre de fils). Alerte si une ligne est plus longue qu'un rouleau. Points, boîtes, matériel du tableau : comptés.

## Contrôles
- `validation/controle.py` : second calcul indépendant (Python, fractions exactes) de cinq chantiers complets ; résultats dans `VALIDATION.md` ; `test-metre.mjs` exige l'égalité avec l'application.
- Propriétés sur 2 000 tirages au hasard : jamais une unité de moins que le besoin, jamais une de trop.
- `VALIDATION.md` se termine par les points à faire valider par un professionnel local.

## Limites connues
- Pièces rectangulaires seulement (une pièce en L se saisit en deux ouvrages).
- Pas de calepinage de carrelage : les coupes passent par le pourcentage de pertes.
- Coffrage, étaiement, eau de gâchage : non calculés (rappels seulement).
- Plinthes coupées dans les carreaux : non géré.
- Cadres resserrés aux extrémités, chutes d'acier réutilisées : non gérés (le plan fait foi).
- Aucun essai sur chantier réel ni validation par un professionnel de chaque métier à ce jour.
