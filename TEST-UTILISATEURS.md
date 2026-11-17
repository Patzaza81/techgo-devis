# Test avec de vrais utilisateurs débutants — protocole

> **Statut : NON RÉALISÉ.** Ce test exige de vraies personnes. Les 500 parcours de `AUDIT-ERGONOMIE.md` sont des
> personnages simulés : ils détectent des défauts de structure, ils ne disent pas ce qu'un artisan comprend.
> Tant que ce protocole n'a pas été joué, **l'application ne doit pas être déclarée facile à utiliser**.

## Qui
- **5 artisans par métier**, soit 25 personnes (peinture, carrelage, maçonnerie, plomberie, électricité).
  Cinq personnes par groupe révèlent la majorité des problèmes d'usage ; ce n'est pas un échantillon statistique.
- Au moins **2 débutants complets par métier** : n'ont jamais utilisé une application de devis, se servent surtout de WhatsApp et d'appels.
- Mélange d'appareils : **iPhone** et **Android** (au moins un écran de 360 px parmi eux), dans la langue habituelle de la personne (français ou anglais).
- Aucun proche de l'équipe TechGo. Aucune personne ayant déjà vu l'application.

## Comment
1. Remettre le téléphone de la personne (ou un prêté) avec l'aperçu de test ouvert sur une page vierge (jamais la production).
2. Lire la carte du métier (ci-dessous) **telle quelle**. Ne rien expliquer de l'application. Pas de tutoriel, pas de démonstration.
3. Demander de parler à voix haute. L'observateur note, il ne guide pas.
4. **Aide** : si la personne reste bloquée plus de 3 minutes, ou demande de l'aide, l'observateur donne l'indication minimale et le parcours est compté **« avec aide »** (jamais « réussi sans aide »).
5. Limite : 20 minutes. Au-delà, noter « abandon » et la cause.
6. Fin : 3 questions (voir fiche) et une note de difficulté de 1 à 7.
7. Ne jamais saisir de vraies données de clients. Les prix sont ceux que la personne utilise d'habitude (aucun prix n'est fourni par TechGo).

## Cartes de scénario (à lire à haute voix)
- **Peinture** : « M. Mballa veut repeindre son salon : 5 m sur 4 m, 2,8 m de haut, une porte et une fenêtre, deux couches. Faites-lui un devis que vous pouvez lui envoyer sur WhatsApp. »
- **Carrelage** : « Mme Ngo veut carreler sa cuisine au sol : 4 m sur 3,5 m, carreaux de 60 sur 60, avec les plinthes. Faites-lui un devis en PDF. »
- **Maçonnerie** : « M. Tchinda fait un mur de clôture de 12 m de long sur 2 m de haut en parpaings de 15. Faites un devis avec le mortier. »
- **Plomberie** : « Mme Essomba veut un lavabo, une douche et un WC dans sa salle d'eau neuve, environ 15 m de tuyau. Faites un devis. »
- **Électricité** : « M. Fotso veut refaire l'électricité d'une chambre : 4 prises, 2 interrupteurs, 2 lampes, une ligne depuis le tableau de 12 m. Faites un devis. »

Chaque carte se termine par : « Quand vous avez fini, envoyez-moi le devis en PDF et en Word. »

## Ce qu'on mesure (par personne)
| Mesure | Comment |
|---|---|
| Réussite **sans aide** | PDF **et** Word enregistrés, devis chiffré, aucune aide de l'observateur |
| Temps | chronomètre de l'ouverture à la réception du PDF |
| Erreurs | nombre de fois où la personne se trompe de bouton, de champ, de valeur ou doit revenir en arrière |
| Aides demandées / données | compter chacune, noter à quel écran |
| Abandon | oui / non + cause |
| Champs incompris | noter les mots que la personne ne comprend pas ou lit de travers |
| Difficulté perçue | note de 1 (très facile) à 7 (impossible) |

## Critères d'acceptation (humains)
La PR n° 2 ne se fusionne que si, sur ces 25 personnes :
- **≥ 80 %** réussissent leur premier devis **sans aide**, et **≥ 70 %** des débutants complets ;
- **temps médian ≤ 15 minutes** ;
- **abandon ≤ 10 %** ;
- **aucun problème bloquant** observé chez 2 personnes ou plus (même écran, même cause) ;
- difficulté perçue **médiane ≤ 3 sur 7**.

Ces seuils sont posés **avant** le test pour ne pas les ajuster ensuite aux résultats.

## Fiche d'observation
Voir `tests-humains/fiche-observation.csv` (une ligne par personne et par métier).

## Ajouts après la campagne simulée n° 2 (v39) : à observer chez des humains

Ces points ne peuvent pas être jugés par la simulation. Noter pour chacun : la personne comprend-elle sans aide ? combien de temps ?

1. **Aides sous les champs** (« Écrit sur le sac », « Mesure un de tes blocs »…) : sont-elles lues ? Les valeurs écrites sont-elles justes ?
2. **Liens « Corriger : aller à … »** dans « Vérifier avant d'envoyer » : la personne les voit-elle et les touche-t-elle, ou revient-elle en arrière avec « Précédent » ?
3. **Étape 3 (artisan)** : l'aperçu et le PDF sont maintenant juste après le total, les réglages sont repliés. La personne trouve-t-elle encore les conditions, le paiement, le logo quand elle en a besoin ?
4. **Choix de facturation de la main-d'œuvre** : choisit-elle « À la tâche » (le plus simple) ? Comprend-elle « rendement » et « équipe » ?
5. **Champs de dosage et de section** (maçonnerie, électricité) : qui sait les remplir sans aide ?
6. **Parcours « entreprise » (5 étapes) : NON simulé de bout en bout.** À tester obligatoirement avec au moins 5 personnes (2 par métier minimum).
7. **Vrai iPhone et vrai Android** : virgule décimale selon la langue du téléphone, clavier numérique, défilement.
