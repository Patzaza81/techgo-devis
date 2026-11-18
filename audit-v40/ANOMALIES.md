# Anomalies — audit v40

Chaque anomalie a été **reproduite** dans le navigateur (ou par un test qui échoue sur la version d'avant), sa cause trouvée dans le code, puis corrigée et **rejouée**. Les scénarios cités sont dans `SCENARIOS.md`.

Gravité : **Bloquant** = l'artisan ne peut pas finir ; **Majeur** = devis faux, trompeur ou non professionnel, ou forte difficulté ; **Mineur** = gêne.

## Corrigées

| N° | Gravité | Problème vu par l'utilisateur | Cause | Correction | Preuve |
|---|---|---|---|---|---|
| A1 | Bloquant | Maçonnerie, plomberie, électricité : taper « PER » ou « disjoncteur » dans la recherche ne montre **rien** tant qu'on n'a pas appuyé sur Entrée ou quitté le champ | La recherche n'écoutait que l'événement « fin de saisie » | Résultats pendant la frappe (250 ms), le curseur reste dans le champ | C1, K2, P1 (MAC, PLO, ELE) réussis ; échouent sur v39 |
| A2 | Majeur | « PPR », « agglo », « pvc coude », « fer de 10 », « PPR 25 » : 0 résultat. « sable » proposait « Panneaux réutilisables » | Recherche de la phrase entière, à n'importe quel endroit du mot, tirets comptés | Chaque mot doit être le début d'un mot de la fiche, ordre libre, tirets ignorés, nombre ignoré si rien ne correspond ; quelques mots du chantier renvoient au terme du référentiel (agglo → parpaing, ampoule → lampe, téflon → PTFE…). **Aucun produit créé.** | `test-ref.mjs` : 7 cas (4 trouvent, 3 ne doivent rien trouver) |
| A3 | Majeur | Le même produit ajouté deux fois donne deux lignes, sans rien dire | Aucun contrôle | Avertissement dès que le nom est saisi (« déjà dans le devis : change plutôt sa quantité ») — non bloquant (même produit dans deux pièces possible) | C1 ×5 métiers |
| A4 | Majeur | Fichier Word : risque d'être signalé « endommagé » par Word | Des virgules s'inséraient entre les cellules des tableaux (tableau JavaScript converti en texte) | Cellules jointes sans séparateur | `test-docx.mjs` (échoue sans la correction) |
| A5 | Majeur | Word envoyé au client : « … jours minimum à … jours maximum », date vide, « — m² », « Base de calcul : 0 m² », case « ☐ Offre de base seule » sans autre choix, « — Signature » | Textes de remplissage écrits même quand l'information n'existe pas | Chaque bloc n'est écrit que s'il a un contenu ; date du devis ; titres « Montant total », « Détail du devis » quand il n'y a pas d'option | `test-docx.mjs` (6 cas) ; K1, E1, K2 |
| A6 | Majeur | PDF entreprise (plomberie, électricité) : « Surface — m² », « Base de calcul … 0 m² », « Chantier — Akwa », « TVA 19.25 % » | Même cause dans le modèle entreprise | Même correction ; TVA écrite « 19,25 % » | E1 ×5, capture PLO-E1 |
| A7 | Majeur | PDF technicien : la ligne « Peintre — 3 jours × 15 000 » disparaît, seul « Main-d'œuvre 45 000 » reste ; le Word, lui, la détaille | Les 3 formes du devis technicien résument la main-d'œuvre, les outils et le transport | Détail écrit sous chaque poste (« Peintre : 3 jour × 15 000 = 45 000 »). Un forfait unique (comme le devis v4 de TechGo) reste présenté comme avant | `test-tech.mjs` (7 cas) ; K1 |
| A8 | Majeur | Étape « Le prix » : après une remise de 10 % et une TVA, l'aperçu et le total restaient à 115 000 au lieu de 103 500 | L'écran ne se redessinait pas quand le curseur passait au champ suivant | Redessin en gardant le curseur ; le bloc « Conditions » reste ouvert | K2 ×5 (échoue sur v39) |
| A9 | Majeur | Métré : après la dernière valeur, l'ouvrage affiche encore « À compléter » et les lignes du devis restent vides (« Toucher pour remplir ») | Même cause : seul le calcul de l'ouvrage était rafraîchi | Redessin dès que l'état du métré change (ouvrage complet, lignes, quantités) | M1 |
| A10 | Bloquant | Plomberie et électricité, profil entreprise : PDF grisé « Surface non renseignée », alors que le champ est écrit « facultatif » | Le contrôle exigeait une surface pour tout devis entreprise | La surface ne bloque que si un travail est calculé à partir d'elle | `test.mjs` (6 cas) ; PLO-E1, ELE-E1 |
| A11 | Majeur | Aperçu sur téléphone 360 et 390 px : la colonne des montants est coupée | Tableaux trop larges pour l'écran | Aperçu compact sous 440 px ; le PDF (rendu à 794 px) ne change pas | 87 parcours sans débordement ; échec sur v39 |
| A12 | Majeur | Premier devis envoyé au nom de « Mon entreprise », sans téléphone, sans avertissement | Rien ne le signalait | Point « ! Ton nom n'est pas sur le devis » + bouton qui amène au champ | E1, R2 |
| A13 | Mineur | Devis sans nom de client : aucun rappel | Idem | Point « ! Le nom du client n'est pas écrit » + lien | R2 |
| A14 | Mineur | « Zone sans nom » imprimé dans le détail du métré | Nom par défaut | « Zone 1 », « Zone 2 »… | M1 (Word) |
| A15 | Majeur | Synthèse financière (Word et aperçu entreprise) : fournitures + main-d'œuvre ≠ total quand il y a une remise | La remise et les frais n'y figuraient pas | Lignes « Remise » et « Frais » ajoutées | `test-docx.mjs` (3 cas) |
| A16 | Majeur | Avec TVA, « Arrêté le présent devis à la somme de … hors taxes » (modèle entreprise et Word) alors que le modèle technicien écrit le TTC | Texte figé | Montant à payer (TTC) quand une TVA est appliquée | `test-docx.mjs` (4 cas) — **à valider par Patrick** |
| A17 | Mineur | Étape 1 technicien (plomberie, électricité, maçonnerie) : 30 à 40 choix facultatifs dépliés, écran triplé | Bloc toujours ouvert | Replié « Précisions sur le chantier (facultatif) », rouvert s'il est rempli | Capture étape 1 |
| A18 | Mineur | Étape 2 : la recherche sous 12 boutons ; case « norme » et longs avertissements au milieu du choix du matériel | Ordre des blocs | Recherche en premier ; normes et méthode de comptage repliées | Capture étape 2 |
| A19 | Mineur | Lien « Corriger » collé au libellé (« …renseignéeCorriger ») | Lien en ligne | Lien sur sa propre ligne | E1 |

## Ouvertes (non corrigées)

| N° | Gravité | Problème | Pourquoi pas corrigé |
|---|---|---|---|
| O1 | Majeur | Le PDF est une **image** : le client ne peut ni chercher ni copier un montant ; zoom limité (223 ppp) | Refonte du moteur PDF : décision de Patrick |
| O2 | Majeur | Trois outils différents calculent les quantités pour le technicien (métré, « Calcul automatique à partir de la surface », « Calculer la quantité » dans une fiche) : risque de confusion | Supprimer une fonction demande l'accord de Patrick ; recommandation : garder le métré seul pour le technicien |
| O3 | Majeur | Catalogue : absents courants (hourdis, poutrelles, chevrons, douille) ; carrelage limité à 7 produits ; 98 fiches de maçonnerie sur 161 sans unité ; 152 noms avec sigles (PE-X, RCBO…) | Aucune donnée inventée : liste à compléter par Patrick (voir `INVENTAIRE-CATALOGUE.md`) |
| O4 | Mineur | Unités : peinture sans « seau » dans la fiche rapide (présent ailleurs) ; main-d'œuvre sans « point » ni « ml » | À confirmer par les métiers |
| O5 | Mineur | Unités non accordées : « 3 jour », « 10 Sac » | Mineur |
| O6 | Mineur | Métré : main-d'œuvre « Pas de main-d'œuvre ici » par défaut ; un artisan pressé peut l'oublier (seul un rappel apparaît à l'étape 3) | Choix de conception à valider |
| O7 | Mineur | Arrondi : TVA 19 923,75 → 19 924 ; identique sur écran, aperçu, PDF et Word | Règle d'arrondi à confirmer par un comptable |
| O8 | — | Word ouvert seulement avec LibreOffice, pas Microsoft Word | Pas de Microsoft Word ici |
| O9 | — | Compréhension humaine non mesurée | Test humain non réalisé |
