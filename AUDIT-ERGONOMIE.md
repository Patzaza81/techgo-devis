# Audit ergonomique — TechGo Devis (branche `metier/v32`, version v39)

**Statut : 8 critères simulés sur 9 atteints, MAIS aucun humain n'a testé l'application. Elle ne peut pas être déclarée « facile à utiliser ». La PR n° 2 reste ouverte en brouillon. Rien n'est fusionné, `main` est intact.**

## Ce que ce rapport est — et n'est pas

- **Simulation** : 500 personnages (100 par métier) pilotés dans un vrai navigateur (Chromium / Playwright) : touches, saisies, défilement, retours, rechargements, écrans de 360, 390 et 414 px. Aucune fonction interne n'est appelée.
- **Ce n'est PAS un test humain.** Protocole prêt : `TEST-UTILISATEURS.md` (25 personnes). Statut : **non réalisé**.
- Limites du simulateur (`outils/audit-ergo.cjs`) :
  - les « mots non compris » et les hésitations viennent de règles que j'ai écrites ; les aides sous les champs ne sont pas lues par les personnages, donc **leur effet n'est pas mesurable ici** ;
  - le temps est modélisé, pas chronométré ; l'abandon dépend de seuils arbitraires ;
  - **parcours « entreprise » (5 étapes) NON simulé de bout en bout** : seul le parcours artisan (3 étapes) l'est ;
  - Chromium émulé : le comportement réel des iPhone / Android (virgule selon la langue du téléphone, clavier) n'est pas démontré.
- Le simulateur a eu des défauts pendant l'audit (sélecteurs périmés, formats de saisie irréalistes, champs voisins non trouvés). Je les ai corrigés. **Les deux campagnes ci-dessous (avant et après) ont été rejouées avec exactement le même simulateur final**, parcours artisan uniquement. Mes premiers chiffres « avant » (14 %) venaient d'un simulateur plus défaillant et sont abandonnés.

## Résultats : v33 (avant) → v39 (après), 500 parcours chacun

| Mesure | Avant (v33) | Après (v39) |
|---|---|---|
| Réussite sans aide, tous | 45 % | **97 %** |
| Débutants complets | 44 % | **94 %** |
| Devis FAUX (chiffres erronés sans alerte) | 261 | **0** |
| Problèmes graves par parcours | 7,58 | 0,63 |
| Temps médian / P90 (modélisé) | 7,0 / 11,2 min | 8,3 / 12,3 min |
| Écrans de défilement jusqu'au PDF (médiane) | 5 | **2** |
| Champs sans libellé rattaché | 100 % | 0 % |
| Curseur perdu après « Suivant » | 97 % | 0 % |
| Libellés coupés par « … » | 37 % | 0 % |
| Saisie mal lue (« 25,9 » → 259) | 53 % | 0 % |
| Erreurs de l'application (JS, NaN, débordement) | 0 | 0 |

Par métier (réussite avant → après) : peinture 38 → 99 %, carrelage 30 → 99 %, maçonnerie 36 → 92 %, plomberie 65 → 100 %, électricité 58 → 93 %.
Par largeur : 360 px 31 → 99 %, 390 px 38 → 92 %, 414 px 68 → 99 %.

Le temps médian a augmenté (7,0 → 8,3 min) parce que bien plus de parcours vont jusqu'au bout. C'est le seul critère non atteint (cible 8 min).

## Critères (fixés avant les résultats)

Atteints (8/9) : réussite ≥ 90 % (97), débutants ≥ 80 % (94), abandon ≤ 5 % (3,4), chaque métier et chaque largeur ≥ 85 % (92), erreurs application = 0, clics sans effet ≤ 1, problèmes graves ≤ 1 (0,63), PDF en ≤ 3 écrans (2).
Non atteint : temps médian ≤ 8 min (8,3).

## Corrections (à l'origine, aucun tutoriel ajouté)

1. Libellés reliés à leur champ ; curseur conservé après Tab ; libellés longs sur plusieurs lignes.
2. Champs numériques en texte avec clavier décimal ; lecture de la virgule, du point, des espaces ; unité du champ acceptée (« 60 cm ») ; autre unité **refusée avec un message à côté du champ** (rien converti en silence).
3. Après « Ajouter un ouvrage », la nouvelle fiche est amenée à l'écran.
4. **Étape 3 (artisan)** : aperçu et PDF juste après le total ; conditions, présentation et paiement rangés dans un bloc replié.
5. **Contrôle avant envoi** : chaque ✕ / ! a un lien « Corriger : aller à … » vers la bonne étape ; message « Le devis est vide » qui dit quoi faire.
6. **Bug** : le message affichait « Pose des appareils — **null** ouvrier » (corrigé ; test ajouté qui échoue sans la correction).
7. **Contradictions (entreprise)** : « Aucun travail pour l'instant » affiché alors qu'un métré existait ; « Surface de base non renseignée » alors que le métré fournit les quantités.
8. **Aides sous environ 120 champs** : elles disent OÙ trouver la valeur (« écrit sur le sac », « mesure un de tes blocs »), jamais QUELLE valeur écrire. Aucun prix, rendement ni norme inventé. Conseil « À la tâche » ajouté pour le choix de facturation.

## Ce qui reste (échecs simulés : 17 sur 500)

- **Maçonnerie (béton, mortier, chape)** : dosage (ciment par m³) et poids d'un sac. L'application ne doit pas inventer ces valeurs. Une aide existe ; à observer chez des humains.
- **Électricité, ligne de câble** : « type et section », « nombre de raccordements ». Idem.
- 2 cas où le personnage n'a pas corrigé une saisie malgré le message d'erreur (limite du modèle de patience).
- « Copier cette zone » non trouvé dans 8 parcours (profils peu patients, bouton en bas de longues fiches).
- Hésitation « Métré du chantier » / liste de produits : non démontrée, à observer.
- Pertes « Casse et coupes (%) » : facultatives mais jugées obscures par les débutants simulés.

## Non vérifié (à faire par des humains)

- Parcours entreprise (5 étapes) de bout en bout.
- Compréhension réelle des aides, des liens « Corriger », des libellés.
- iPhone / Android réels.
- Critères humains de `TEST-UTILISATEURS.md` : ≥ 80 % de réussite sans aide (débutants ≥ 70 %), médiane ≤ 15 min, abandon ≤ 10 %, difficulté perçue ≤ 3/7.

## Non-régression

12 fichiers `test*.mjs` réussis (dont `test-metre` 165, `test` 109, `test-store` 90, `test-saisie` 30) ; `outils/parcours-metre.cjs` 325/325 ; `outils/controle-mobile.cjs` 130/130 ; `test-sw.mjs` cohérent. `CACHE_VERSION` v39. Golden master : non touché.

## Données et relance

`audit-donnees/avant-parcours.jsonl` et `apres-parcours.jsonl`. Relancer : `FORCE_PROFIL=technicien node outils/audit-ergo.cjs --n=100 --metier=peinture --out=DIR` puis `python3 outils/rapport-ergo.py DIR`.

## Conclusion

Fiabilité nettement meilleure (plus aucun devis faux) et parcours artisan fluide en simulation. Mais « navigation excellente » et « compréhension parfaite » ne sont **pas démontrées** : seul un test avec de vrais artisans peut le dire.
