# Unités : ce qu'on mesure, ce qu'on achète, ce qu'on facture

Trois unités différentes peuvent intervenir dans un même devis. L'application les sépare ainsi :

| | Où on la voit | Exemple carrelage |
|---|---|---|
| **Unité de métré** (ce qu'on mesure) | Métré du chantier, « Détail du métré » du devis | 20 m² de sol |
| **Unité d'achat** (ce qu'on achète et revend au client) | Ligne de produit : « Unité » + « Prix pour 1 carton » | 16 cartons |
| **Unité de facturation du travail** | Ligne de main-d'œuvre : « Unité » + « Prix pour 1 m² » | 20 m² de pose |

## Conversions faites par le métré (toutes vérifiées par `test-metre.mjs`, 165 tests)

| Métier | Mesuré en | Converti en | Règle |
|---|---|---|---|
| Carrelage | m² | cartons | surface × (1 + pertes) ÷ m² d'un carton, **entier au-dessus** (20 m² + 10 % = 22 m² ÷ 1,44 = 15,28 → 16) |
| Carrelage | m² | m² (carreau vendu au m²) | surface × (1 + pertes), 2 décimales |
| Carrelage | ml de plinthes | pièces | ml × (1 + coupes) ÷ longueur d'une plinthe, entier au-dessus |
| Peinture | m² | pots | surface × couches × (1 + pertes) ÷ surface couverte par pot, entier au-dessus |
| Maçonnerie | m² de mur | blocs (pièces) | blocs par m² selon format et joint, entier au-dessus |
| Maçonnerie | m³ de mortier ou béton | sacs de ciment | volume × dosage ÷ poids du sac, entier au-dessus |
| Maçonnerie | longueurs du plan | barres de fer | découpe des pièces dans les barres du commerce |
| Plomberie | ml de tuyau | barres ou mètres | ml × (1 + pertes) ÷ longueur d'une barre, entier au-dessus |
| Électricité | ml de câble | rouleaux ou mètres | ml × (1 + pertes) ÷ longueur d'un rouleau |
| Main-d'œuvre | m², ml, m³, point | même unité (à la tâche) ou jours | à la tâche : quantité mesurée ; à la journée : quantité ÷ rendement de l'équipe, au demi-jour |

## Conséquences sur les prix

- Ce qu'on achète se compte **entier** : 15,28 cartons → 16 cartons facturés. Le client paie le carton entamé.
- Le prix d'une ligne est **toujours celui d'une unité de la ligne** : la fiche l'écrit (« Prix pour 1 carton », « Prix pour 1 m² »), et écrit le calcul sous la ligne (« 16 cartons × 12 000 = 192 000 FCFA »).
- Un artisan qui facture les carreaux **au m²** au client (et non au carton) choisit l'unité « m² » : le libellé du prix devient « Prix pour 1 m² ». Il n'y a pas de conversion automatique carton → m² pour une ligne saisie à la main : c'est volontaire, l'application ne devine pas la contenance d'un carton.
- Les phrases du devis accordent l'unité (« 3 jours », « 16 cartons ») ; le tableau garde l'unité telle qu'elle est écrite.

## Non fait (à décider après l'essai)

- Afficher, sur une ligne venue du métré, le prix ramené à l'unité mesurée (ex. « soit 9 600 FCFA par m² »). Utile pour comparer à un prix au m², mais c'est une fonction de plus : à décider selon ce que diront les artisans.
