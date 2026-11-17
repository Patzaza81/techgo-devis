# Audit ergonomique — TechGo Devis (branche `metier/v32`)

**Statut : critères d'acceptation NON atteints. La PR n° 2 reste ouverte en brouillon. Rien n'est fusionné, `main` est intact.**

## Ce que ce rapport est — et n'est pas

- C'est une **simulation** : 500 personnages pilotés par un vrai navigateur (Chromium via Playwright : touches, saisies, défilement, retours, rechargements, écrans 360 / 390 / 414 px), sans jamais appeler les fonctions internes de l'application.
- Ce **n'est pas un test humain**. Aucun vrai débutant n'a utilisé l'application. Protocole prêt : `TEST-UTILISATEURS.md` (25 participants). Statut : **non réalisé**.
- Limites connues du simulateur (`outils/audit-ergo.cjs`) :
  - les « hésitations » et les mots « incompris » viennent de règles que j'ai écrites (hypothèses), pas de mesures humaines ;
  - le temps est **modélisé** (pas chronométré sur des humains) ;
  - l'abandon dépend de seuils de patience arbitraires ;
  - les incidents tirés au hasard (`hesitation_choix`, `champ_saute`, `faux_tap`) sont du bruit modélisé ;
  - le comportement exact des vrais iPhone / Android (clavier, langue du téléphone) n'est pas démontré : Chromium émulé seulement.
- Même simulateur, même graine, avant et après. « Avant » = commit `fe2147d` (v33) ; « Après » = v35.

## Résultats : avant → après (500 parcours chacun, 100 par métier)

| Mesure | Avant | Après |
|---|---|---|
| Réussite sans aide, tous | 14 % | 52 % |
| Débutants complets | 6 % | 51 % |
| Devis FAUX (chiffres erronés sans alerte) | 211 | **0** |
| Problèmes graves par parcours | 8,95 | 2,45 |
| Temps médian modélisé / P90 | 6,8 / 10,2 min | 9,1 / 14,4 min |
| Champs sans libellé rattaché | 100 % des parcours | 0 % |
| Curseur perdu après « Suivant » | 94 % | 0 % |
| Libellés coupés par « … » | 37 % | 0 % |
| Saisie mal lue (« 25,9 » → 259) | 50 % | 0 % |
| Erreur muette (saisie refusée sans message) | 32 % | 0 % |
| Erreurs de l'application (JS, NaN, débordement) | 0 | 0 |

Par métier (réussite avant → après) : peinture 20 → 59 %, carrelage 6 → 57 %, maçonnerie 4 → 37 %, plomberie 23 → 63 %, électricité 18 → 43 %.
Par largeur : 360 px 7 → 64 %, 390 px 10 → 36 %, 414 px 25 → 56 %. L'écart du 390 px après correction n'est pas expliqué ; à investiguer, ne pas l'ignorer.

## Critères (fixés avant les résultats)

Atteints : erreurs de l'application = 0 ; clics sans effet ≤ 1 par parcours (2/9).
Non atteints : réussite ≥ 90 % (52 %) ; débutants ≥ 80 % (51 %) ; abandon ≤ 5 % (48 %) ; temps médian ≤ 8 min (9,1) ; chaque métier et chaque largeur ≥ 85 % ; problèmes graves ≤ 1 (2,45) ; PDF atteint en ≤ 3 écrans de défilement (5).

## Corrections faites à l'origine

1. Libellés reliés à leur champ (`for`/`id`) : toucher le libellé place le curseur.
2. Champs numériques en texte avec clavier décimal ; lecture tolérante (virgule, point, espaces de milliers). Cause : `type="number"` supprimait la virgule (« 3,5 » → 35). Réserve : à confirmer sur de vrais téléphones.
3. Saisie avec unité (« 60 cm » dans un champ en cm) acceptée ; autre unité **refusée avec message** à côté du champ, rien d'enregistré (`saisie.js`, 30 vérifications).
4. Message d'erreur à côté du champ (avant : erreur muette).
5. Le curseur reste dans la saisie après Tab (redessin différé).
6. Libellés longs affichés sur plusieurs lignes au lieu d'être coupés.
7. Après « Ajouter un ouvrage », la nouvelle fiche est amenée à l'écran (elle s'ouvrait à ~3 000 px hors de vue).

Aucun tutoriel ajouté. Aucune valeur par défaut inventée.

## Problème restant n° 1 : devis non chiffré (238 échecs sur 500)

Le bouton PDF reste grisé car aucune ligne n'a pu être chiffrée. Causes observées dans les parcours en échec :
- ouvrages restés « À compléter » : « Ligne de câble et son conduit » (31 cas), « Fouille ou terrassement », « Armatures d'après le plan », « Béton », « Réseau de tuyaux » ;
- champs que le personnage « ne sait pas remplir » : nombre de raccordements, poids d'un sac de colle / joint, nombre de barres par élément, espacement des cadres, longueur d'une barre.

**Je ne sais pas, d'après la simulation seule, si c'est un vrai défaut ou la limite de mes personnages.** Règle du projet : aucune donnée fabriquée, donc l'application ne doit pas deviner ces valeurs. Pistes **non faites**, à valider par des humains : aide courte sous chaque champ (« écrit sur le sac »), pas de blocage du PDF pour un ouvrage secondaire, accès plus direct au PDF (5 écrans de défilement aujourd'hui).

## Autres points ouverts

- 390 px nettement plus mauvais que 360 et 414 après correction : cause non identifiée.
- Armatures : nécessitent la lecture d'un plan ; peu réalistes pour un débutant.
- Valeur improbable non signalée (plinthes de 1 cm → 1 340 pièces) : pas de garde-fou.
- Parcours « entreprise » : couverture partielle par le simulateur.
- Hésitation « Métré du chantier » vs liste de produits : aucune preuve, à observer en test humain.

## Non-régression

12 fichiers `test*.mjs` : tous réussis après v35 (dont `test-metre` 161, `test` 109, `test-store` 90, `test-saisie` 30). `outils/parcours-metre.cjs` : 325/325 ; `outils/controle-mobile.cjs` : 130/130 (v35).

## Données

`audit-donnees/avant-parcours.jsonl` et `apres-parcours.jsonl` (un parcours par ligne : incidents, gravité, étape, profil). Relancer : `node outils/audit-ergo.cjs --n=100 --metier=peinture --out=DIR` puis `python3 outils/rapport-ergo.py DIR`.

## Conclusion

L'application est nettement plus fiable (plus aucun devis faux dans la simulation) mais **elle ne peut pas être déclarée facile à utiliser** : les critères simulés ne sont pas atteints et aucun humain ne l'a testée.
