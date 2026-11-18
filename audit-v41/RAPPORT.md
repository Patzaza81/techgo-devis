# TechGo Devis v41 — rapport (branche `audit/ux-v41`, 18/11/2026)

Rien n'est fusionné, `main` n'est pas touché, rien n'est en production.
« RÉUSSI » ci-dessous = vérifié par un test automatique qui passe par l'écran (Playwright) ou par un test unitaire. **Aucun artisan n'a encore testé cette version.**

## 1. Ce qui a changé, et son effet sur les 5 métiers

| # | Changement | Peinture | Carrelage | Maçonnerie | Plomberie | Électricité |
|---|---|---|---|---|---|---|
| 1 | Arrondi unique (ligne au franc, puis remise/TVA au franc) | oui | oui | oui | oui | oui |
| 2 | PDF en vrai texte | oui | oui | oui | oui | oui |
| 3 | Sigles en clair | — | — | oui | oui | oui |
| 4 | Produits ajoutés (nom + unité, sourcés) | — | 6 | 6 | — | 7 |
| 5 | Unités proposées par produit | liste | liste | 79/79 | 733/733 | 550/550 |
| 6 | Fiche de ligne réorganisée | oui | oui | oui | oui | oui |
| 7 | Un seul outil de quantité : le métré | lien vers le métré | lien vers le métré | — | — | — |
| 8 | Envoi direct (profil technicien) | oui | oui | oui | oui | oui |
| 9 | Journal d'essai (`?essai=1`) | oui | oui | oui | oui | oui |

Aucun devis enregistré n'est perdu : un ancien nom de produit retrouve sa fiche ; le profil entreprise garde son étape « Prêt à envoyer ».

## 2. Résultats

| Point de ta demande | Statut | Preuve |
|---|---|---|
| Un seul résultat par calcul (écran = aperçu = PDF = Word) | RÉUSSI | Scénarios K1 et K2 × 5 métiers × 3 écrans ; `test-arrondi.mjs` (22 cas, dont 0,35 × 1 350 = 473 que l'ancien moteur donnait 472) |
| Remise 10 % + TVA 19,25 % : 115 000 → HT 103 500, TVA 19 924, TTC 123 424 | RÉUSSI | K2, 5 métiers, PDF et Word lus |
| Grands montants (187 500 000) et montant en lettres | RÉUSSI | K3 |
| PDF en texte sélectionnable, ~12 Ko, plusieurs pages, en-tête répété | RÉUSSI | K1, L1 (30 lignes, 3 pages, 30/30 lignes retrouvées dans le texte) |
| Toutes les fiches produits ont une unité | RÉUSSI | `test-ref.mjs` (113 tests) ; `INVENTAIRE-CATALOGUE.md` |
| Unités du produit en premier dans la fiche | RÉUSSI | captures `ecrans/fiche-carrelage.png` ; contrôle mobile 140/140 |
| Ancienne aide au m² retirée, renvoi au métré visible | RÉUSSI | contrôle mobile (360 et 390 px) |
| Envoi en un geste pour le technicien | RÉUSSI | scénario V1 (version 1 envoyée, puis V2, V1 inchangée) |
| Texte du PDF : espace gardé entre deux morceaux (« francs CFA (123 424… ») ; « 3 jours × 15 000 » au lieu de « 3 jour » | RÉUSSI | `test-texte.mjs` (10), PDF de K2 relu |
| Journal d'essai sans contenu saisi | RÉUSSI | `test-journal.mjs` (12) + `outils/essai-journal.cjs` (8/8) |
| Non-régression | RÉUSSI | 15 fichiers de tests unitaires (794 vérifications), parcours métré 325/325, contrôle mobile 140/140, 29 scénarios × 360/390/414 px |
| Word ouvert dans Microsoft Word | NON TESTÉ | à faire par toi sur iPhone (voir kit, § 7) |
| Affichage sur un vrai iPhone / Android | NON TESTÉ | à faire sur l'aperçu Netlify |
| 25 artisans débutants sans tutoriel | NON TESTÉ | kit prêt : `KIT-ESSAI-ARTISANS.md` |

## 3. Ce qui reste, honnêtement

- **Organisation du catalogue par ouvrage** : proposée, pas codée. Il me faut ta liste d'ouvrages validée (`CATALOGUE-PROPOSITION.md`, § 2).
- **Peinture et carrelage** : toujours une liste à plat sans recherche (20 et 13 produits).
- **Électricité** : les sous-ensembles industriels (postes HTA, ATEX, cimenteries) restent visibles pour un technicien de logement.
- **Produits ajoutés** : « à confirmer » par un artisan de chaque métier.
- 50 désignations gardent un sigle hors parenthèses (PVC, LED, USB, PER, PPR, DIN…), jugées connues des artisans — à confirmer pendant l'essai.

## 4. Ce que j'attends de toi

1. Ouvrir l'aperçu Netlify de la branche sur ton iPhone et faire un devis complet.
2. Ouvrir un Word créé par l'application dans Microsoft Word.
3. Valider ou corriger la liste des ouvrages (catalogue).
4. Lancer l'essai avec les artisans selon le kit, puis m'envoyer fiches + journaux CSV.
