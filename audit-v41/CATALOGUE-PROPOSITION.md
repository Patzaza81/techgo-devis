# Catalogue — état v41 et proposition d'organisation

Règle suivie : aucun prix, aucune norme, aucune caractéristique inventés. Les ajouts v41 sont des **noms + unités de vente**, chacun avec au moins une source (`metiers/complements.js`, marqués « à confirmer »).

## 1. Ce qui est fait (vérifié par `test-ref.mjs`, 113 tests)

- **Sigles** : 113 désignations réécrites en clair, le sigle reste entre parenthèses (ex. « Tube PER (polyéthylène réticulé, PE-X) »). Un ancien devis qui porte l'ancien nom retrouve sa fiche.
  - Restent hors parenthèses : PVC, LED, USB, PER, PPR, DIN, PE100, IE3/IE4 (40 en plomberie, 10 en électricité). PVC, LED et USB sont le vocabulaire courant des artisans ; les autres sont dans des fiches spécialisées. Liste exacte : `INVENTAIRE-CATALOGUE.md`.
- **Unités** : toutes les fiches produits de maçonnerie (79), plomberie (733) et électricité (550) ont maintenant au moins une unité proposée. Avant : 98 fiches de maçonnerie et 77 d'électricité sans unité.
  - Origine de l'unité : celle du document source quand il en donne une ; sinon unité par famille (ex. sable → m³, camion, tonne) ; sinon par nom ; accessoires d'électricité → mètre/rouleau (câbles, gaines), mètre/barre (goulottes, rails), rouleau (rubans), pièce/lot (le reste).
- **Produits courants ajoutés** (sources citées) :
  - Maçonnerie : hourdis (entrevous), poutrelle de plancher, chevron, latte, pointes, film polyane.
  - Électricité : ampoule (lampe à culot), douille, plafonnier, applique murale, hublot, télérupteur, borne de connexion (domino).
  - Carrelage : primaire d'accrochage, ragréage, profilé de finition (baguette d'angle), nez de marche, natte d'étanchéité, silicone sanitaire. La liste passe de 7 à 13 produits.
- **Mots du chantier reconnus par la recherche** : agglo/agglos/aggloméré → bloc, parpaing ; fer → acier, armature ; tuyau → tube ; téflon → PTFE ; ampoule → lampe, LED ; solaire → photovoltaïque ; panneau → module ; fil → conducteur.

## 2. Proposition d'organisation (à valider par Patrick avant de la coder)

Aujourd'hui, maçonnerie, plomberie et électricité sont rangées par **famille de produit** (ce que vend le quincaillier). Peinture et carrelage n'ont qu'une liste à plat, sans recherche.

Proposition : garder les familles (elles servent au quincaillier) et ajouter au-dessus une entrée **par ouvrage** (ce que l'artisan est en train de chiffrer) :

| Métier | Ouvrages proposés (porte d'entrée) | Familles reprises dessous |
|---|---|---|
| Maçonnerie | Fondation · Mur en agglos · Poteaux et chaînages · Dalle / plancher hourdis · Enduit · Dallage | Ciment, sable, gravier ; Blocs ; Acier et coffrage ; Mortiers ; Préfabriqués |
| Plomberie | Arrivée d'eau · Évacuation · Salle de bains / WC · Cuisine · Chauffe-eau · Pompe et bâche à eau | Les 12 sous-ensembles actuels |
| Électricité | Éclairage · Prises · Tableau et protections · Câblage et gaines · Solaire et secours · Terre | Les 8 sous-ensembles actuels |
| Carrelage | Sol · Mur · Escalier · Salle de bains (étanchéité) · Finitions | Liste actuelle (13) |
| Peinture | Intérieur · Façade · Boiseries / métal · Préparation du support | Liste actuelle (20) |

- Effet attendu : l'artisan touche « Dalle / plancher hourdis » et voit hourdis, poutrelles, fer, ciment, gravier, sable, étais — au lieu de chercher dans 6 familles.
- Conséquence sur les 5 métiers : seulement l'écran de choix des produits ; aucun calcul, aucun devis enregistré, aucun prix touché.
- Ce qu'il me faut de toi : valider ou corriger la liste des ouvrages (c'est du métier, je ne l'invente pas seul).

## 3. Manques encore constatés (non comblés faute de source fiable)

- Carrelage : pas de recherche ni de familles ; formats de carreaux non listés (les formats sont des caractéristiques : à prendre chez un fournisseur réel).
- Peinture : pas de distinction mat / satiné / brillant ni de familles par support.
- Toutes les fiches ajoutées restent « à confirmer » : elles doivent être relues par un artisan de chaque métier pendant les tests humains.
