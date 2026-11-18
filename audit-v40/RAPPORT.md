# Compte rendu — audit de l'expérience utilisateur, TechGo Devis v40

**Statut : 19 anomalies corrigées. 87 parcours automatisés réussis (29 scénarios × 3 largeurs). Aucun test humain réalisé.**
TechGo Devis **ne peut pas encore être déclaré facile à utiliser** : ce n'est démontré que par des tests automatisés.

## Version testée
- Branche `audit/ux-v40`, partie de `metier/v32` au commit `0b9915b` (v39). `main` (071b9d2) non touché ; PR n° 2 non fusionnée.
- Version servie : `BUILD 40`, cache `techgo-devis-v40`.
- Environnement : Chromium (Playwright) en mode téléphone tactile, largeurs 360, 390 et 414 px, langue fr-FR, serveur local des fichiers de la branche. Pas de vrai téléphone.
- Version d'avant rejouée pour comparaison : `0b9915b` (v39), mêmes scénarios, 360 px.

## 1. Ce qui a réellement été testé
- **Par l'interface visible** (`outils/audit-v40.cjs` et `outils/audit-v40-scenarios.cjs`), 29 scénarios, chacun aux 3 largeurs :
  - catalogue des 5 métiers : chercher, ajouter, modifier, remplacer, doublon, retirer, retour à l'étape 1, rechargement, produit absent, quantité oubliée, saisie « abc », quantité 0 (C1 ×5) ;
  - chiffrage avec valeurs connues jusqu'au PDF et au Word (K1), remise + TVA dans les 5 métiers (K2 ×5), grands montants et lettres (K3), devis de 30 lignes aux noms longs (L1) ;
  - parcours **entreprise complet en 5 étapes** dans les 5 métiers (E1 ×5) ;
  - métré → devis → documents (M1) ; artisan pressé (P1 ×5) ;
  - résistance : double toucher sur « Créer le PDF » et export répété (R1), client incomplet (R2), fermeture du navigateur puis retour (R3), hors connexion (R4) ;
  - envoi : figer V1, préparer V2, V1 inchangée, reprise du devis depuis son PDF sur un autre navigateur (V1).
- **Lecture des fichiers produits** : texte du Word (XML), PDF lu par reconnaissance de caractères (le PDF est une image), Word rendu avec LibreOffice.
- **Non-régression** : 12 fichiers de tests (722 vérifications + cohérence du cache), `parcours-metre.cjs` 325/325, `controle-mobile.cjs` 130/130, échantillon de 50 parcours du simulateur d'usage identique à v39 (90 % dans les deux cas).

## 2. Problèmes découverts
19 corrigés et 9 ouverts : détail dans `ANOMALIES.md`. Les plus graves :
- **Recherche inutilisable** en maçonnerie, plomberie et électricité : rien ne s'affichait pendant la frappe (A1) ; « PPR », « agglo », « pvc coude » ne trouvaient rien (A2).
- **Plomberie et électricité en entreprise : PDF impossible**, bloqué par une surface pourtant marquée « facultative » (A10).
- **Remise et TVA invisibles** dans l'aperçu tant que l'écran n'était pas redessiné (A8) ; métré affichant « À compléter » alors qu'il était complet (A9).
- **Documents** : textes de remplissage (« … jours », « — m² », « Base de calcul : 0 m² ») dans le Word et le PDF entreprise (A5, A6) ; main-d'œuvre détaillée dans le Word mais pas dans le PDF (A7) ; synthèse qui ne s'additionne pas avec une remise (A15) ; Word avec un défaut de structure (A4).
- Aperçu coupé sur 360/390 px (A11) ; devis envoyé « Mon entreprise » sans avertissement (A12).

Sur la version d'avant, les mêmes scénarios donnent **2 réussis sur 29**. Honnêtement : 9 de ces échecs viennent seulement de l'aperçu coupé à 360 px (vrai défaut, mais il compte dans presque tous les scénarios) ; les autres viennent de la recherche, de la remise/TVA, de la surface bloquante et des documents.

## 3. Corrections effectuées
Voir `ANOMALIES.md` (A1 à A19). Aucun tutoriel ajouté ; aucune donnée inventée (ni produit, ni prix, ni unité, ni norme) ; aucun calcul métier modifié — seuls l'affichage, la recherche, les contrôles avant envoi et le contenu des documents ont changé. 34 vérifications automatiques ajoutées (Word, recherche, main-d'œuvre détaillée, surface, arrêté TTC, synthèse).

## 4. Calculs vérifiés indépendamment
Valeurs calculées à la main dans les scénarios, comparées à l'écran, à l'aperçu, au PDF et au Word :
- 12 × 6 500 = 78 000, puis 10 sacs → 65 000 ; l'ancien montant disparaît partout (K1) ;
- 2,5 × 1 250 = 3 125 (décimale avec virgule) ; 3 jours × 15 000 = 45 000 ; total 113 125 (K1) ;
- 115 000 − remise 10 % = 103 500 ; TVA 19,25 % = 19 923,75 → 19 924 ; TTC 123 424, dans les 5 métiers (K2) ;
- entreprise : 123 000 HT, TVA 23 677,5 → 23 678, TTC 146 678, dans les 5 métiers (E1) ;
- « 1 500 » × « 125 000 » = 187 500 000 et « cent quatre-vingt-sept millions cinq cent mille » (K3) ;
- 30 lignes : somme de i × (1 000 + 10 i) = 559 550, toutes les lignes présentes dans l'aperçu et le Word, 30/30 relues par OCR sur le PDF de plusieurs pages (L1) ;
- métré : 50 m² × 2 couches ÷ 10 m² par pot = 10 pots ; 10 × 12 000 + 50 × 1 500 = 195 000 (M1).

## 5. La sélection des matériaux est-elle facile ?
- **Peinture, carrelage** : liste courte à toucher (20 et 7 produits), sans recherche : rapide, mais le carrelage manque de produits courants (O3).
- **Maçonnerie, plomberie, électricité** : la recherche fonctionne maintenant pendant la frappe et avec les mots du chantier. Restent : 152 noms avec des sigles (PE-X, RCBO…), 98 fiches de maçonnerie sans unité (l'artisan doit la choisir), des produits absents (hourdis, poutrelles, douille) qu'il faut ajouter à la main.
- Produit absent : message clair et ajout à la main vérifiés ; doublon désormais signalé.
- **Facilité réelle non démontrée** sans test humain.

## 6. Le chiffrage est-il fiable ?
Sur tous les cas joués : oui, montants identiques à l'écran, dans l'aperçu, le PDF et le Word, y compris après modifications, retour en arrière, rechargement et reprise depuis le PDF. Règle d'arrondi de la TVA à faire confirmer (O7).

## 7. L'aperçu est-il professionnel ?
Nettement amélioré : plus de textes de remplissage, main-d'œuvre détaillée, synthèse qui s'additionne, arrêté sur le montant à payer, lisible sur 360 px. Restent : « Mon entreprise » si l'artisan ne remplit pas son nom (désormais signalé), unités non accordées, PDF en image.

## 8. Le PDF et le Word sont-ils conformes ?
Mêmes montants, mêmes lignes et même client dans les deux, vérifiés automatiquement. Le Word suit une présentation plus détaillée que le PDF technicien (choix existant). Le Word n'a pas été ouvert dans Microsoft Word.

## 9. Problèmes ouverts
O1 à O9 dans `ANOMALIES.md`. Décisions demandées à Patrick : PDF en image (O1), trois outils de calcul des quantités (O2), produits à ajouter au catalogue (O3), arrêté en TTC (A16, appliqué).

## 10. Validations humaines manquantes
Toutes. Il faut :
1. Faire tester l'aperçu Netlify de cette branche sur ton iPhone ;
2. Organiser le test de `TEST-UTILISATEURS.md` : 25 artisans (5 par métier, au moins 2 débutants complets par métier), sans explication, en mesurant réussite sans aide, erreurs, demandes d'aide, abandons, temps et difficulté ressentie ;
3. Ouvrir un Word exporté dans Microsoft Word.

## Dossier
`SCENARIOS.md` (chaque scénario, RÉUSSI / ÉCHOUÉ / NON TESTÉ, avec la comparaison v39), `ANOMALIES.md`, `ECRANS.md`, `INVENTAIRE-CATALOGUE.md`, `resultats/` (résultats bruts). Captures, PDF, Word et textes extraits : dans le ZIP livré (non versionnés, trop lourds).
