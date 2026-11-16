# Cas de chantier pour la validation du métré

Produit par `validation/controle.py` : un **second calcul indépendant** (Python, fractions exactes) du même chantier que l'application.
`test-metre.mjs` vérifie que l'application donne exactement les mêmes quantités. Toutes les valeurs d'entrée (couvertures, dosages, rendements, pertes) sont des **données d'essai**, pas des références.

Limite de ce contrôle : il vérifie que les calculs sont justes par rapport aux formules de `METRE.md`. Il ne dit pas si ces formules et ces conventions sont celles du métier : c'est l'objet des « points à faire valider » à la fin.

## Peinture — Appartement : salon, chambre et trois portes

**Salon**

- Données (p_piece) : longueur = 5.2, largeur = 3.8, hauteur = 2.7, plafond = true, perte = 8, moMode = "ouvrier", moRend = 35, moOuv = 2
  - Pièce : murs 2 × (5,2 + 3,8) × 2,7 − 5,25 = 43,35 m² ; plafond 19,76 m² ; à peindre 63,11 m²
  - Sous-couche : 63,11 × 1 × 1,08 ÷ 60 = 1,14 seau(s)
  - Peinture acrylique : 63,11 × 2 × 1,08 ÷ 48 = 2,84 seau(s)
  - Main-d'œuvre « Travaux de peinture » : 63,11 m² ÷ 35 par jour pour l'équipe = 1,803 jour(s) de chantier

**Chambre**

- Données (p_piece) : longueur = 3.6, largeur = 3.2, hauteur = 2.7, plafond = true, perte = 8, moMode = "ouvrier", moRend = 35, moOuv = 2
  - Pièce : murs 2 × (3,6 + 3,2) × 2,7 − 3,12 = 33,6 m² ; plafond 11,52 m² ; à peindre 45,12 m²
  - Sous-couche : 45,12 × 1 × 1,08 ÷ 60 = 0,81 seau(s)
  - Peinture acrylique : 45,12 × 2 × 1,08 ÷ 48 = 2,03 seau(s)
  - Main-d'œuvre « Travaux de peinture » : 45,12 m² ÷ 35 par jour pour l'équipe = 1,289 jour(s) de chantier

**Portes**

- Données (p_surface) : longueur = 0.8, hauteur = 2.1, nombre = 3, faces = 2, perte = 5, moMode = "tache", moNom = "Peinture des portes"
  - Surfaces : 3 × 0,8 × 2,1 × 2 face(s) = 10,08 m²
  - Laque : 10,08 × 2 × 1,05 ÷ 12 = 1,76 pot(s)
  - Main-d'œuvre à la tâche « Peinture des portes » : 10,08 m²

**Quantités attendues dans le devis (après cumul des zones et arrondi)**

| Ligne | Quantité |
|---|---|
| Sous-couche [Seau] | 2 |
| Peinture acrylique [Seau] | 5 |
| Travaux de peinture — 2 ouvriers [journée d'ouvrier] | 7 |
| Laque [Pot] | 2 |
| Peinture des portes [m²] | 10,08 |

## Carrelage — Maison : séjour, cuisine et douche

**Séjour**

- Données (c_sol) : longueur = 6.4, largeur = 4.25, carreau = "Grès 60×60", vente = "Carton", cA = 60, cB = 60, parCarton = 4, perte = 10, colle = 4.5, colleSac = 25, jointC = 0.4, jointSac = 5, plinthes = true, portes = 1.8, plinthe = 60, perteP = 5, moMode = "equipe", moRend = 18, moOuv = 2
  - Sol : 6,4 × 4,25 − 0 = 27,2 m²
  - Grès 60×60 : 27,2 × 1,1 ÷ 1,44 m² par carton = 20,78 carton(s)
  - colle : 27,2 × 4.5 = 122,4 kg = 4,9 sac(s) ; joint : 10,88 kg = 2,18 sac(s)
  - plinthes : 2 × (6,4 + 4,25) − 1,8 = 19,5 ml × 1,05 ÷ 0,6 = 34,13 pièce(s)
  - Main-d'œuvre « Pose de carrelage » : 27,2 m² ÷ 18 par jour pour l'équipe = 1,511 jour(s) de chantier

**Cuisine**

- Données (c_sol) : longueur = 3.5, largeur = 2.8, deduire = 1.2, carreau = "Grès 60×60", vente = "Carton", cA = 60, cB = 60, parCarton = 4, perte = 10, colle = 4.5, colleSac = 25, jointC = 0.4, jointSac = 5, moMode = "equipe", moRend = 18, moOuv = 2
  - Sol : 3,5 × 2,8 − 1,2 = 8,6 m²
  - Grès 60×60 : 8,6 × 1,1 ÷ 1,44 m² par carton = 6,57 carton(s)
  - colle : 8,6 × 4.5 = 38,7 kg = 1,55 sac(s) ; joint : 3,44 kg = 0,69 sac(s)
  - Main-d'œuvre « Pose de carrelage » : 8,6 m² ÷ 18 par jour pour l'équipe = 0,478 jour(s) de chantier

**Douche**

- Données (c_mur) : longueur = 5.6, hauteur = 2.1, carreau = "Faïence 25×40", vente = "Carton", cA = 25, cB = 40, parCarton = 15, perte = 12, colle = 3.5, colleSac = 25, jointC = 0.3, jointSac = 5, moMode = "tache"
  - Mur : 5,6 × 2,1 − 1,4 = 10,36 m²
  - Faïence 25×40 : 10,36 × 1,12 ÷ 1,5 m² par carton = 7,74 carton(s)
  - colle : 10,36 × 3.5 = 36,26 kg = 1,45 sac(s) ; joint : 3,11 kg = 0,62 sac(s)
  - Main-d'œuvre à la tâche « Pose de faïence » : 10,36 m²

**Quantités attendues dans le devis (après cumul des zones et arrondi)**

| Ligne | Quantité |
|---|---|
| Grès 60×60 [Carton] | 28 |
| Colle à carrelage [Sac] | 8 |
| Joint de carrelage [Sac] | 4 |
| Plinthes [Pièce] | 35 |
| Pose de carrelage — équipe de 2 [journée d'équipe] | 2 |
| Faïence 25×40 [Carton] | 8 |
| Pose de faïence [m²] | 10,36 |

## Maçonnerie — Clôture de 24 m avec 9 poteaux, dallage et enduit

**Clôture**

- Données (m_fouille) : nombre = 9, longueur = 0.6, largeur = 0.6, profondeur = 0.5, moMode = "tache"
  - Fouilles : 9 × 0,6 × 0,6 × 0,5 = 1,62 m³ en place
  - Main-d'œuvre à la tâche « Fouilles » : 1,62 m³
- Données (m_mur) : longueur = 24, hauteur = 2.2, blocNom = "Parpaing de 15", blocL = 40, blocH = 20, blocE = 15, joint = 1.5, perte = 5, mortier = true, ciment = 350, sac = 50, sable = 1, perteM = 20, moMode = "ouvrier", moRend = 12, moOuv = 3
  - Mur : 24 × 2,2 − 9 = 43,8 m² ; 11,208 blocs par m² ; 515,44 blocs avec la casse
  - mortier des joints (estimation géométrique) : 43,8 × 0,15 × 10,34 % × 1,2 = 0,815 m³
  - ciment : 0,815 × 350 = 285,3 kg = 5,71 sac(s) ; sable : 0,815 m³
  - Main-d'œuvre « Élévation de mur » : 43,8 m² ÷ 12 par jour pour l'équipe = 3,65 jour(s) de chantier
- Données (m_beton) : nom = "Poteaux", nombre = 9, longueur = 2.2, largeur = 20, epaisseur = 20, perte = 5, ciment = 350, sac = 50, sable = 0.4, gravier = 0.8, moMode = "tache"
  - Béton « Poteaux » : 9 × 2,2 × 0,2 × 0,2 = 0,792 m³ ; avec pertes 0,832 m³
  - ciment : 0,832 × 350 = 291,06 kg = 5,82 sac(s) ; sable : 0,333 m³ ; gravier : 0,665 m³
  - Main-d'œuvre à la tâche « Coulage de béton » : 0,79 m³
- Données (m_acier) : nom = "Armatures des poteaux", nombre = 9, longueur = 2.2, barre = 12, filNom = "Fer de 12", filN = 4, filRec = 0.6, cadNom = "Fer de 6", cadEsp = 15, cadDev = 68
  - Armatures : 36 filants de 2,8 m, 4 par barre → 9 barres ; 144 cadres de 0,68 m, 17 par barre → 9 barres
- Données (m_enduit) : longueur = 24, hauteur = 2.2, faces = 2, epaisseur = 1.5, perte = 15, ciment = 300, sac = 50, sable = 1, moMode = "ouvrier", moRend = 30, moOuv = 3
  - Enduit : 87,6 m² × 0,015 m × 1,15 = 1,511 m³ (estimation)
  - ciment : 1,511 × 300 = 453,33 kg = 9,07 sac(s) ; sable : 1,511 m³
  - Main-d'œuvre « Enduit » : 87,6 m² ÷ 30 par jour pour l'équipe = 2,92 jour(s) de chantier

**Cour**

- Données (m_chape) : longueur = 8, largeur = 5, epaisseur = 8, perte = 5, ciment = 300, sac = 50, sable = 0.5, gravier = 0.8, moMode = "equipe", moRend = 40, moOuv = 4
  - Chape : 40 m² × 0,08 m × 1,05 = 3,36 m³
  - ciment : 3,36 × 300 = 1 008 kg = 20,16 sac(s) ; sable : 1,68 m³ ; gravier : 2,688 m³
  - Main-d'œuvre « Réalisation de chape » : 40 m² ÷ 40 par jour pour l'équipe = 1 jour(s) de chantier

**Quantités attendues dans le devis (après cumul des zones et arrondi)**

| Ligne | Quantité |
|---|---|
| Fouilles [m³] | 1,62 |
| Parpaing de 15 [Pièce] | 516 |
| Ciment [Sac] | 41 |
| Sable [m³] | 4,34 |
| Élévation de mur — 3 ouvriers [journée d'ouvrier] | 12 |
| Gravier [m³] | 3,35 |
| Coulage de béton [m³] | 0,79 |
| Fer de 12 [Barre] | 9 |
| Fer de 6 [Barre] | 9 |
| Enduit — 3 ouvriers [journée d'ouvrier] | 9 |
| Réalisation de chape — équipe de 4 [journée d'équipe] | 1 |

## Plomberie — Salle de bain et cuisine

**Salle de bain**

- Données (pl_reseau) : tuyau = "Tube PVC Ø100", longueur = 6.5, perte = 10, vente = "Barre", barre = 4, colEsp = 80, moMode = "tache"
  - Réseau Tube PVC Ø100 : 6,5 × 1,1 = 7,15 ml ÷ 4 = 1,79 barre(s)
  - colliers : 6,5 ÷ 0,8 → 9 intervalles + 1 = 10
  - Main-d'œuvre à la tâche « Pose de tuyauterie » : 6,5 ml
- Données (pl_reseau) : tuyau = "Tube PPR Ø20", perte = 5, vente = "Barre", barre = 4, colEsp = 60, moMode = "tache", longueur = 14
  - Réseau Tube PPR Ø20 : 14 × 1,05 = 14,7 ml ÷ 4 = 3,68 barre(s)
  - colliers : 14 ÷ 0,6 → 24 intervalles + 1 = 25
  - Main-d'œuvre à la tâche « Pose de tuyauterie » : 14 ml
- Données (pl_appareils) : moMode = "tache"
  - Comptage : 3 point(s)
  - Main-d'œuvre à la tâche « Pose des appareils » : 3 point

**Cuisine**

- Données (pl_reseau) : tuyau = "Tube PPR Ø20", perte = 5, vente = "Barre", barre = 4, colEsp = 60, moMode = "tache", longueur = 9
  - Réseau Tube PPR Ø20 : 9 × 1,05 = 9,45 ml ÷ 4 = 2,36 barre(s)
  - colliers : 9 ÷ 0,6 → 15 intervalles + 1 = 16
  - Main-d'œuvre à la tâche « Pose de tuyauterie » : 9 ml
- Données (pl_reseau) : tuyau = "Tube PVC Ø50", longueur = 4.2, perte = 10, vente = "Mètre", moMode = "tache"
  - Réseau Tube PVC Ø50 : 4,2 × 1,1 = 4,62 ml
  - Main-d'œuvre à la tâche « Pose de tuyauterie » : 4,2 ml
- Données (pl_appareils) : moMode = "tache"
  - Comptage : 1 point(s)
  - Main-d'œuvre à la tâche « Pose des appareils » : 1 point

**Quantités attendues dans le devis (après cumul des zones et arrondi)**

| Ligne | Quantité |
|---|---|
| Tube PVC Ø100 [Barre] | 2 |
| Coude Ø100 [Pièce] | 3 |
| Té Ø100 [Pièce] | 1 |
| Colliers pour Tube PVC Ø100 [Pièce] | 10 |
| Pose de tuyauterie [ml] | 33,7 |
| Tube PPR Ø20 [Barre] | 7 |
| Coude Ø20 [Pièce] | 12 |
| Té Ø20 [Pièce] | 4 |
| Vanne d'arrêt Ø20 [Pièce] | 2 |
| Colliers pour Tube PPR Ø20 [Pièce] | 41 |
| WC [Pièce] | 1 |
| Lavabo [Pièce] | 1 |
| Douche [Pièce] | 1 |
| Flexible [Pièce] | 5 |
| Robinet d'arrêt [Pièce] | 3 |
| Siphon [Pièce] | 3 |
| Pose des appareils [point] | 4 |
| Tube PVC Ø50 [Mètre] | 5 |
| Coude Ø50 [Pièce] | 2 |
| Évier [Pièce] | 1 |

## Électricité — Logement : séjour, chambre et tableau

**Séjour**

- Données (e_points) : boites = true, moMode = "tache"
  - Comptage : 10 point(s)
  - Main-d'œuvre à la tâche « Pose des points électriques » : 10 point
- Données (e_ligne) : cable = "Câble 3G2,5", nombre = 2, longueur = 14, reserve = 0.25, racc = 5, perte = 10, rouleau = 100, conduit = "Gaine Ø20", rouleauC = 50, moMode = "equipe", moRend = 60, moOuv = 2
  - Ligne Câble 3G2,5 : 2 × (14 + 1,25) × 1 fil(s) × 1,1 = 33,55 ml ; conduit Gaine Ø20 : 30,8 ml
  - Main-d'œuvre « Tirage de câble » : 28 ml ÷ 60 par jour pour l'équipe = 0,467 jour(s) de chantier

**Chambre**

- Données (e_points) : boites = true, moMode = "tache"
  - Comptage : 6 point(s)
  - Main-d'œuvre à la tâche « Pose des points électriques » : 6 point
- Données (e_ligne) : cable = "Câble 3G2,5", longueur = 11, reserve = 0.25, racc = 6, perte = 10, rouleau = 100, conduit = "Gaine Ø20", rouleauC = 50, moMode = "equipe", moRend = 60, moOuv = 2
  - Ligne Câble 3G2,5 : 1 × (11 + 1,5) × 1 fil(s) × 1,1 = 13,75 ml ; conduit Gaine Ø20 : 12,1 ml
  - Main-d'œuvre « Tirage de câble » : 11 ml ÷ 60 par jour pour l'équipe = 0,183 jour(s) de chantier
- Données (e_ligne) : cable = "Fil 1,5 mm²", longueur = 9, fils = 3, reserve = 0.25, racc = 4, perte = 10, rouleau = 100, conduit = "Gaine Ø16", rouleauC = 50, moMode = "equipe", moRend = 60, moOuv = 2
  - Ligne Fil 1,5 mm² : 1 × (9 + 1) × 3 fil(s) × 1,1 = 33 ml ; conduit Gaine Ø16 : 9,9 ml
  - Main-d'œuvre « Tirage de câble » : 9 ml ÷ 60 par jour pour l'équipe = 0,15 jour(s) de chantier

**Tableau**

- Données (e_tableau) : moMode = "tache"
  - Comptage : 9 article(s) de tableau
  - Main-d'œuvre à la tâche « Câblage du tableau » : 1 forfait

**Quantités attendues dans le devis (après cumul des zones et arrondi)**

| Ligne | Quantité |
|---|---|
| Prise 2P+T [Pièce] | 10 |
| Interrupteur simple [Pièce] | 3 |
| Point lumineux [Pièce] | 3 |
| Boîte d'encastrement [Pièce] | 16 |
| Pose des points électriques [point] | 16 |
| Câble 3G2,5 [Rouleau] | 1 |
| Gaine Ø20 [Rouleau] | 1 |
| Tirage de câble — équipe de 2 [journée d'équipe] | 1 |
| Fil 1,5 mm² [Rouleau] | 1 |
| Gaine Ø16 [Rouleau] | 1 |
| Coffret 13 modules [Pièce] | 1 |
| Disjoncteur [Pièce] | 6 |
| Interrupteur différentiel [Pièce] | 2 |
| Câblage du tableau [forfait] | 1 |

## Points à faire valider par un professionnel local

Aucun de ces points n'a été validé par un professionnel à ce jour. Pour chacun : ce que fait l'application, et la question à poser.

| Métier | Ce que fait l'application | Question pour le professionnel |
|---|---|---|
| Tous | Journées = quantité ÷ rendement de l'équipe, arrondi à la demi-journée au-dessus sur le total de la prestation | Factures-tu à la demi-journée ? Arrondis-tu par pièce ou sur tout le chantier ? |
| Tous | Les pertes sont un pourcentage saisi, appliqué à la quantité | Comptes-tu les pertes ainsi, ou en unités entières (un carton, un sac de plus) ? |
| Peinture | Surface = murs − toutes les ouvertures ; une quantité par produit et par couche | Déduis-tu toutes les ouvertures, ou seulement les grandes ? La première couche consomme-t-elle plus (support neuf) ? |
| Carrelage | Cartons = surface avec casse ÷ surface d'un carton ; les joints entre carreaux ne réduisent pas le nombre | La casse saisie suffit-elle pour une pose en diagonale ou une pièce biscornue ? |
| Carrelage | Colle et joint = surface × consommation du sac, sans pourcentage de casse | Ajoutes-tu une marge sur la colle (double encollage, support irrégulier) ? |
| Carrelage | Plinthes au mètre linéaire, portes déduites | Les plinthes sont-elles achetées ou coupées dans les carreaux ? (cas non géré) |
| Maçonnerie | Blocs = surface nette ÷ (bloc + joint), ouvertures entièrement déduites | Déduis-tu les ouvertures en entier ? Comptes-tu des blocs pour les linteaux et les angles ? |
| Maçonnerie | Mortier = volume géométrique des joints pleins, puis pertes saisies | Quelle marge réelle pour les blocs creux (mortier dans les alvéoles) ? Combien de blocs poses-tu par sac ? |
| Maçonnerie | Ciment, sable, gravier = volume en place × dosage saisi | Tes dosages sont-ils par m³ de béton en place ? Comment convertis-tu en brouettes ou en seaux ? |
| Maçonnerie | Enduit = surface × épaisseur moyenne | Quelle épaisseur moyenne réelle sur tes blocs (creux, faux aplombs) ? |
| Maçonnerie | Armatures : pièces entières découpées dans chaque barre ; cadres = longueur ÷ espacement + 1 | Le plan resserre-t-il les cadres aux extrémités ? Réutilises-tu les chutes ? |
| Maçonnerie | Coffrage, étais, eau, linteaux, chaînages : non calculés | Lesquels faut-il ajouter en priorité ? |
| Plomberie | Tuyau = tracé + chutes, vendu à la barre ; colliers = tracé ÷ espacement + 1 | Tes espacements de colliers par diamètre ? Ajoutes-tu des colliers à chaque coude ? |
| Plomberie | Un point d'eau par appareil ; diamètres, pentes et pression non calculés | Factures-tu au point d'eau ou à l'appareil ? Eau chaude et eau froide comptent-elles deux points ? |
| Électricité | Câble = tracé + longueur laissée × raccordements, par ligne ; un conduit par ligne | Quelle longueur laisses-tu au tableau et dans chaque boîte ? Passes-tu plusieurs circuits dans un même conduit ? |
| Électricité | Section, calibre, différentiels, terre : jamais calculés | (Responsabilité de l'électricien qualifié : rien à valider dans l'application, seulement à confirmer que rien n'est suggéré.) |
