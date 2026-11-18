# Écrans et choix — inventaire et examen (audit v40)

Pour chaque choix : à quoi il sert, s'il est obligatoire, si son effet a été **vérifié par un scénario** (✔) ou seulement lu (•). La compréhension par un artisan réel n'est pas mesurée (aucun test humain).

## Démarrage
| Choix | Utilité | Obligatoire | Effet vérifié | Remarque |
|---|---|---|---|---|
| Métier (5 boutons) | Isole le vocabulaire et le catalogue du métier | Oui, une fois | ✔ tous les scénarios | Clair |
| Technicien / Entreprise | 3 écrans rapides ou 5 écrans complets | Oui, une fois | ✔ (P1, E1) | Clair ; « changer » possible depuis la liste des devis |
| « Faire un devis » | Crée le devis | — | ✔ | — |
| « Rouvrir un ancien devis » (PDF) | Reprendre un devis sur un autre téléphone | Non | ✔ V1 | Fonctionne ; revient en brouillon |

## Technicien — Étape 1 « Pour qui est le devis ? »
| Choix | Obligatoire | Vérifié | Remarque |
|---|---|---|---|
| Nom, téléphone du client | Non bloquant | ✔ R2 | Désormais rappelé à l'étape 3 s'il manque (A13) |
| Quartier, surface (facultative) | Non | ✔ | Surface utile seulement pour le calcul automatique |
| Précisions sur le chantier (plomberie, électricité, maçonnerie) | Non | • | Était déplié (30 à 40 choix) : replié (A17) |

## Technicien — Étape 2 « Le travail et le matériel »
| Bloc | Obligatoire | Vérifié | Remarque |
|---|---|---|---|
| Métré du chantier (zones, ouvrages) | Non | ✔ M1, parcours-metre (325) | Statut rafraîchi (A9) ; « Zone 1 » au lieu de « Zone sans nom » (A14) |
| Produits : liste (peinture, carrelage) ou recherche + types (3 autres métiers) | Au moins une ligne | ✔ C1 ×5 | Recherche en tête, en direct, par mots (A1, A2, A18) |
| Fiche d'une ligne : nom, quantité, unité, prix, rôle | Quantité, unité, prix | ✔ C1, K1, K2 | « Il manque : la quantité » affiché ; doublon signalé (A3) ; « abc » refusé avec message |
| Main-d'œuvre, outils, transport | Non | ✔ K1, K2 | Détail visible sur le PDF (A7) |
| « Calcul automatique à partir de la surface » | Non | • | **Fait doublon avec le métré** (O2) |
| « Échafaudage, outils loués, oublis fréquents » | Non | • | — |

## Technicien — Étape 3 « Le prix »
| Bloc | Obligatoire | Vérifié | Remarque |
|---|---|---|---|
| Total, « Avec TVA » | — | ✔ K2 | Suit la remise et la TVA (A8) |
| « Ton entreprise » (nom, téléphone) | Non bloquant | ✔ | Rappel dans « Vérifier » (A12) |
| Vérifier avant d'envoyer + liens « Corriger » | — | ✔ R2, E1 | Liens sur leur ligne (A19) |
| Aperçu, Créer le PDF, Créer le Word | — | ✔ tous | Aperçu lisible à 360 px (A11) ; double toucher sans effet indésirable (R1) |
| Conditions, présentation, paiement (replié) : TVA, validité, remise, message, logo, forme Express/Détaillé/Chantier, échéancier, durée | Non | ✔ TVA, remise (K2) ; • formes (tests unitaires), logo non testé | Bloc gardé ouvert après une saisie |
| Envoyer : figer V1, Suivi, Préparer V2 | — | ✔ V1 | V1 reste inchangée après modification |

## Entreprise — 5 étapes
| Étape | Vérifié | Remarque |
|---|---|---|
| 1 Client et chantier (type de client, date, validité, surfaces, hauteur, pertes) | ✔ E1 ×5 | Surface non exigée si aucun calcul n'en dépend (A10) |
| 2 Travaux (métré ou travail de la liste) | ✔ E1 (passage) | — |
| 3 Produits et main-d'œuvre (4 onglets, « À ne pas oublier ») | ✔ E1 ×5 | 5 points à examiner : réponse « Sans objet » acceptée |
| 4 Prix et conditions (méthode de prix, remise, frais, TVA, délais, tranches) | ✔ TVA, délai (E1) ; • méthode « coût + marge », frais | — |
| 5 Vérifier, aperçu, PDF, Word | ✔ E1 ×5 | Documents corrigés (A5, A6, A15, A16) |

## Écrans annexes
Clients, Produits, Suivi, Réglages : non parcourus en détail (voir « NON TESTÉ » dans `SCENARIOS.md`).
