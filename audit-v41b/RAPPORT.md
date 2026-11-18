# TechGo Devis v41b — rapport point par point (18/11/2026)

Branche `audit/ux-v41`. `main` non touché, rien fusionné, rien en production.
« Vérifié » = test automatique qui passe par l'écran (Playwright, 360/390/414 px) ou test unitaire. **Aucun artisan n'a encore testé cette version.**

## 1. Catalogue

| Terminé | Partiel | Reste à faire |
|---|---|---|
| Recherche en peinture et en carrelage (même règle que les autres métiers : début des mots, trait d'union, mots du chantier) | Inventaire des besoins : 138 produits courants sur 146 trouvés (`INVENTAIRE-BESOINS.md`) | Les 8 absents, faute de source fiable : traitement anti-moisissure, lasure, barre de seuil, chaux (côté carrelage), buse, dalle, tôle, puisard |
| Électricité et plomberie : le matériel d'usine (postes HTA, moteurs, ATEX, cimenteries) est caché à l'artisan ; un toucher l'affiche ; le profil entreprise voit tout | 35 produits ajoutés au total (19 en v41, 16 dans cette passe), nom + unité + source, tous « à confirmer » | Organisation par ouvrage (fondation, dalle hourdis, salle de bains…) : attend ta liste validée |
| Bug corrigé : « câble » proposait d'abord « Sortie de câble » (familles triées par numéro au lieu du meilleur résultat) | | |

## 2. Unités (détail : `UNITES.md`)

| Terminé | Partiel | Reste à faire |
|---|---|---|
| La fiche dit à quoi sert l'unité : achat (« celle dans laquelle tu achètes et factures ce produit »), facturation du travail (« au m², au mètre, à la journée ou au forfait »), ligne du métré (« mesuré par le métré, acheté et facturé en cartons entiers ») | Pas de conversion carton ↔ m² sur une ligne saisie à la main : volontaire (l'application ne devine pas la contenance d'un carton) | Afficher le prix ramené à l'unité mesurée (« soit 9 600 FCFA par m² ») : à décider après l'essai |
| « Prix pour 1 carton », « Prix pour 1 m² » : le libellé suit l'unité choisie | | |
| Conversions du métré : 165 tests (cartons, pots, blocs, sacs, barres, rouleaux, plinthes, journées) | | |

## 3. Ligne de devis

| Terminé | Partiel | Reste à faire |
|---|---|---|
| Scénario × 5 métiers × 3 écrans : 3 produits, unités différentes, 4 modifications de suite, quantité 1,2345 → 1,235, changement d'unité, 2 suppressions, aperçu final | | Observation d'artisans réels |
| Sous chaque ligne : « 16 cartons × 12 000 = 192 000 FCFA » | | |
| Unités accordées dans les phrases (« 3 jours », « 16 cartons », plus de « 3 Pièces ») | | |

## 4. Bouton d'envoi

**Constat** : « Envoyer au client » n'envoyait rien. Il figeait la version et passait le devis à « Envoyé » ; l'envoi réel se faisait ailleurs.

| Terminé | Partiel | Reste à faire |
|---|---|---|
| 1er bouton : « Terminer le devis et créer le PDF à envoyer (version 1) » : fige la version, passe le devis à « Envoyé », crée le PDF de cette version | Partage testé en simulant un téléphone qui sait partager (le PDF de la version 1 part bien) | Essai sur un vrai iPhone et un vrai Android |
| 2e bouton, selon le téléphone : « Envoyer le PDF (WhatsApp, e-mail…) » (ouvre le menu Partager) ou « Télécharger le fichier » | Le statut « Envoyé » est posé au 1er bouton, avant que le PDF parte réellement | |
| Les PDF de relecture s'appellent « PDF brouillon (pour relire) » | | |

## 5. Arrondis

Règle unique : quantité et prix pris au millième (0,001) → montant de ligne arrondi au franc (0,5 au-dessus) → total HT = somme des lignes → frais, remise, TVA arrondis au franc sur le HT → TTC = HT + TVA.

| Terminé | Partiel | Reste à faire |
|---|---|---|
| Devis de 1, 30, 100 et 200 lignes (décimales, remise %, remise en FCFA, frais 5 %, TVA 19,25 %, jusqu'à 222 milliards TTC) : écran, aperçu, PDF et Word comparés à un calcul fait à part — 111/111 | | |
| Écarts trouvés et corrigés : quantité 0,335 affichée « 0,34 » (calcul fait sur 0,335) ; prix 1 333,5 affiché « 1 334 » ; pourcentages faux au-delà de ~230 milliards ; location refacturée où « jours × prix par jour » ≠ montant | | |
| Devis déjà envoyés avec l'ancienne règle : montants d'origine conservés, écart signalé sans fausse alerte | | |

## 6. PDF et Word

| Terminé | Partiel | Reste à faire |
|---|---|---|
| 200 lignes : PDF 8 pages, Word 7 pages (rendu LibreOffice) ; aucune ligne coupée entre deux pages ; en-tête du tableau en haut de chaque page ; pages numérotées | Word rendu par LibreOffice, pas par Microsoft Word | Ouvrir un Word dans Microsoft Word sur iPhone |
| Word : il manquait « ligne insécable » et « en-tête répété » → ajoutés | | |
| Un poste de 4 lignes ou plus (ex. 40 ouvriers) a son propre tableau ; avant, un paragraphe illisible qui débordait sur la page suivante | | |

## 7. Interface (revue des 5 métiers à 360 px)

| Terminé | Partiel | Reste à faire |
|---|---|---|
| TVA : deux boutons « Sans TVA » / « TVA 19,25 % » en haut de l'étape du prix ; le point de contrôle mène au bouton | Revue faite par moi sur captures et textes : ce n'est pas un test humain | Profil entreprise encore dense (méthode de prix, frais de fonctionnement) |
| Technicien : seuls les points à revoir s'affichent ; l'envoi ne demande plus « Marquer prêt » | | |
| Retirés : l'outil « calculer la surface des murs » de l'étape 1 (le métré le fait), « version 24 ou plus », « paramétrés », « seuil d'accès » | | |
| Entreprise : surface, niveaux et pertes repliés ; la hauteur (obligatoire) reste visible avec sa raison | | |
| Choix des sous-ensembles plus compact en électricité et plomberie | | |

## 8. Essais humains

| Terminé | Partiel | Reste à faire |
|---|---|---|
| Kit : `KIT-ESSAI-ARTISANS.md` (15 débutants + 10 expérimentés, règles d'observation directe, cartes par métier, critères fixés avant) ; fiche `FICHE-OBSERVATION.csv` | Journal d'essai dans le téléphone (complément, pas un remplacement de l'observation) | Lien d'aperçu : je ne peux ni le créer sans risque de toucher la production, ni l'ouvrir d'ici |
| | | Les essais eux-mêmes |

## Non-régression

- 15 fichiers de tests unitaires : 826 vérifications.
- Parcours métré 325/325 ; contrôle mobile 140/140 ; journal 8/8 ; gros devis 111/111.
- 34 scénarios × 3 largeurs (360, 390, 414 px).

## Ce que j'attends de toi

1. **Lien d'essai** : si le site Netlify est relié au dépôt GitHub, ajouter la branche `audit/ux-v41` aux déploiements de branche (*Branch deploys*) : cela crée une adresse à part, sans toucher la production. Sinon, m'autoriser à publier un aperçu (déploiement non publié).
2. Ouvrir un Word dans Microsoft Word sur ton iPhone.
3. Valider la liste des ouvrages pour le catalogue.
4. Lancer l'essai avec le kit, puis m'envoyer les fiches et les journaux.
