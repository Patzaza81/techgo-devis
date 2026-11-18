# Journal des décisions

Format : quoi · pourquoi · date.

- **Nom : TechGo Devis** (sans « S.A.R.L. » ni « TechGo » seul) · choix du propriétaire · 2026-10-20
- **Version complète, pas de version réduite** · le propriétaire décide et dispose du temps · 2026-10-20
- **Enduits = prestation du métier Peinture** · ce n'est pas un métier à part · 2026-10-20
- **Un module par métier** (`metiers/`) · ajouter un métier sans toucher au noyau · 2026-10-20
- **Aucun prix ni rendement inventé** · seuls les prix du devis du 28/09/2026 sont fournis (métier Peinture, enduits) · 2026-10-20
- **Nouvelles entreprises : catalogue sans prix** · le catalogue appartient à l'entreprise · 2026-10-20
- **Données dans l'appareil, pas de serveur** · aucun service de données choisi ; sauvegarde .json vérifiée · 2026-10-20
- **Empreinte de contrôle ≠ signature** · détecte une modification, n'a pas de valeur de signature · 2026-10-20
- **Word (.docx) généré sans bibliothèque externe, depuis la version figée seulement** · mêmes montants que le PDF, testé · 2026-10-20
- **Import CSV : cellule vide = inconnu (nouvel article) ou inchangé (article existant)** · jamais un prix à zéro par défaut · 2026-10-20
- **Surface retenue = brute − ouvertures si la brute est saisie** · la source est affichée sur le devis · 2026-10-20
- **Arrondi des restes par ligne** · c'est le comportement du devis TechGo ; à confirmer · 2026-10-20
- **JavaScript au lieu de TypeScript** · pas d'étape de compilation sur téléphone ; migration possible · 2026-10-20

## Électricité — référentiel (oct. 2026)
- Source : « Référentiel professionnel du matériel électrique » fourni par Patrick (487 matériels, 19 familles + accessoires de la section 23).
- Rangé en 8 sous-ensembles (logement, secours/solaire, courants faibles, chantier, protection/mesure, industrie, ATEX/cimenteries, accessoires) ; contrôles et essais (section 19) à part, dans « Transport et divers ».
- Données : metiers/elec-data.js (générées depuis le document), accès : metiers/elec-ref.js. Noms, spécifications, unités et normes seulement : aucun prix, aucune quantité.
- Norme imprimée sur le devis seulement si l'utilisateur coche l'option, et seulement si c'est une vraie référence (IEC, EN, ISO, NF, OIML). Le document précise qu'une norme citée ne prouve pas la conformité ni son caractère obligatoire au Cameroun.
- Unité par défaut = celle du document ; jamais devinée pour les accessoires (laissée vide).
- Fiche « avant de chiffrer » (section 22) : 4 questions imprimées sous l'objet du chantier.

## Plomberie — référentiel (oct. 2026)
- Source : « Référentiel professionnel du matériel de plomberie » fourni par Patrick (792 matériels, 36 familles).
- Même mécanisme que l'électricité, généralisé : metiers/ref.js (refOf(métier)) lit elec-data.js / plo-data.js. Un nouveau métier = un fichier de données + une entrée dans ref.js.
- 12 sous-ensembles ; outillage (section 33) → onglet « Outils et machines » (au forfait par défaut) ; épreuves et essais (36) → « Transport et divers ».
- Points de vigilance de chaque famille affichés quand elle est ouverte. Unités de métré (39), vérifications avant commande (41.G), « ce que le devis doit distinguer », 12 erreurs fréquentes (42) : aides non bloquantes.
- Fiche « avant de chiffrer » : clé `current.fiche` (l'ancienne clé `elec` reste lue).
- Les données *-data.js sont générées depuis les documents : ne pas les modifier à la main.

## Maçonnerie — référentiel (oct. 2026)
- Source : « Référentiel professionnel de maçonnerie et gros œuvre » fourni par Patrick. Ce n'est pas un catalogue de matériel : matériaux (partie 2), ouvrages (bordereau, partie 18), normes (13), métrés (11), contrôles, sécurité, check-lists, fiche de relevé (19).
- Adaptation (générateur gen_mac.py → metiers/mac-data.js, 161 fiches) : matériaux → « Produits » en 6 sous-ensembles ; les 45 postes du bordereau + 15 ouvrages industriels → onglet « Ouvrages et main-d'œuvre », rangés par lot GO-01…GO-14 (tableau 1.1) ; essais du béton, protections (15.2), frais annexes → « Contrôles, sécurité et frais » ; moyens de coffrage, levage, vibration → « Outils ».
- Unités : celles du bordereau et du tableau 1.2 (« m² ou m³ » → deux choix). Matériaux : unité vide si le document n'en donne pas (sac, tonne… à choisir). Aucun prix, quantité, rendement ni coefficient de perte.
- Normes : liées à une fiche seulement quand les tableaux 13.x les rattachent au produit (ciment courant EN 197-1, granulats EN 12620, eau EN 1008, adjuvants EN 934-2, acier EN 10080, blocs EN 771, mortiers EN 998-1/2, chapes EN 13813, béton EN 206/13670). Pour les ouvrages : DTU 13.1, 13.3, 20.1, 26.1 et EN 13914 selon 13.5. Option « Écrire la norme » décochée par défaut.
- Un ouvrage du bordereau est enregistré avec l'étiquette « ouvrage » : le devis le détaille (désignation, quantité, unité, prix) comme un matériau, au lieu de le noyer dans un total « Main-d'œuvre ». Le libellé du sous-total devient « fournitures et ouvrages ».
- Fiche « avant de chiffrer » (technicien) : type d'ouvrage, lots, ce que le prix comprend, documents (plans, étude de sol), béton, contraintes. Alerte si fondations, béton armé, dallages, linteaux/chaînages, réhabilitation ou ouvrage industriel : dimensions et armatures viennent des plans validés.
- Aides non bloquantes (technicien et entreprise, étape « Vérifier ») : contrôles de prix et de métré, à préciser dans l'offre, double comptage, documents à demander, relevé sur place, sécurité, 17 erreurs fréquentes. Formules de métré du document affichées en lecture seule : aucun calculateur de quantités (le document refuse les ratios universels).
- Ajout hors document : « Fil d'attache » (ta liste habituelle), signalé dans la fiche.
- Calcul de surface murs − ouvertures conservé pour la maçonnerie (partie 6.2).

## Vocabulaire par métier (oct. 2026)
- metiers/vocab.js : libellés, exemples, unités et formats propres à chaque métier (surface, support, finition, marque, à quoi ça sert, unités des produits). Plus aucun mot de peinture (pot, contenance en litres, « lissage des murs », marque « National ») hors de la peinture.
- Plomberie et électricité : pas de calcul « murs − ouvertures » (surface du local facultative). Maçonnerie et carrelage : calcul conservé.
- Articles saisis par l'utilisateur (TER-) : rattachés à leur métier ; les anciens articles sans métier sont traités comme de la peinture. Ils n'apparaissent plus dans les listes ni dans l'autocomplétion des autres métiers.

## Licence et vente (nov. 2026)
- **Essai gratuit : 3 devis sortis** (PDF, Word, impression, envoi), puis code de licence valable 365 jours. Valeurs proposées, à confirmer par le propriétaire (`licence.js` : `ESSAI_DEVIS`, `DUREE_JOURS`).
- **La saisie, les calculs, le catalogue et les sauvegardes ne sont jamais bloqués** ; un devis déjà sorti reste sortable · personne ne perd ses données.
- **Vérification dans le téléphone, sans serveur** : l'application reconnaît un code par son empreinte (`licence-codes.js`). Les codes en clair ne sont jamais dans le dépôt (il est public).
- **Limites assumées** : un code peut être saisi sur plusieurs appareils ; la date vient de l'horloge du téléphone. Une vérification par serveur les lèvera (phase 4).
- **Vente** : le client demande son code sur WhatsApp (bouton dans Réglages), paie, reçoit un code du lot. Prix : décision du propriétaire, non écrit dans l'application.
- Nouveaux codes : `node outils/gen-codes.mjs <nombre> <fichier hors dépôt>`.

## Métré par zones (v32, nov. 2026)
- **Un devis peut contenir un métré** (`quote.metre`) : des zones (pièce, étage, bâtiment, lot), chacune avec des ouvrages mesurés. Le métré calcule les quantités et alimente les lignes du devis ; l'artisan ne saisit plus que les prix. Détail des formules et statut de chaque donnée : `METRE.md`.
- **Aucune donnée fabriquée** : `metiers/metre.js` ne contient que de la géométrie et de l'arithmétique. Couverture d'un pot, consommation de colle, dosage, rendement de l'équipe, format des blocs, longueur des barres… sont saisis par l'entreprise, puis gardés (`settings.metreMemo`) et repris au prochain ouvrage du même type. Un test vérifie qu'aucun champ n'a de valeur par défaut.
- **Ce qui relève d'une étude n'est jamais calculé** : section des câbles, calibre des protections, ferraillage, formulation du béton, diamètre des tuyaux. L'application le dit dans l'ouvrage et compte seulement ce que l'artisan a décidé.
- **Arrondis** : ce qui s'achète entier → entier au-dessus, calculé sur le total du devis (pas zone par zone) ; journées → demi-journée au-dessus ; mesures → 2 décimales.
- **Une donnée manquante ne produit pas de quantité** : le besoin n'entre pas dans le devis et ce qui manque est nommé.
- **Une quantité changée à la main n'est jamais écrasée** par le métré : l'écart est signalé, avec un bouton pour reprendre la valeur calculée.
- **Main-d'œuvre** : par ouvrage, à la tâche (m², ml, m³, point) ou à la journée (rendement et nombre d'ouvriers saisis). La durée d'équipe calculée est comparée à la durée annoncée sur le devis (signalement, jamais blocage).
- **Le détail du métré s'imprime à la fin du devis** (PDF et Word), désactivable par devis. Il ne change aucun montant.
- Les quantités décimales s'impriment avec leurs décimales (0,32 m³ s'imprimait « 0 »).
- Devis existants : rien ne change tant qu'aucun métré n'est saisi (`quote.metre` absent). Le devis de référence reste exact au franc.

## Métré : corrections après relecture (v33, nov. 2026)
- **Main-d'œuvre** : trois modes exclusifs par ouvrage (à la tâche ; par jour et par ouvrier ; par jour pour toute l'équipe). Le rendement est toujours celui de toute l'équipe. Les jours de chantier sont arrondis d'abord, puis multipliés par l'effectif : chaque ouvrier est payé le même nombre de jours. Unités « journée d'ouvrier » et « journée d'équipe » ; le prix attendu est écrit dans la ligne. L'ancien mode « jour » de la v32 se lit comme « par ouvrier ».
- **Armatures** : calcul par découpe de pièces entières dans chaque barre (la v32 divisait la longueur totale par la longueur de barre et pouvait donner une barre de moins que nécessaire).
- **Nombres entiers** : « 0 porte » ne déduit plus une porte ; 0 élément, 1,5 couche, 2,5 ouvriers sont refusés.
- **Exact ou estimation** : chaque quantité porte sa nature (voir `METRE.md`).
- **Mémoire** : les valeurs d'un produit ne sont reprises que pour le même nom de produit ; les valeurs de pratique reprises doivent être confirmées avant d'entrer dans un devis.
- **Mortier d'un mur** : calculé seulement si l'artisan le demande (case à cocher).
- **Carrelage** : vente au carton ou au m² ; coupes de plinthes séparées de la casse des carreaux.
- **Contrôle indépendant** : `validation/controle.py` et `VALIDATION.md`.

## v40 — audit de l'expérience utilisateur (18/11/2026, branche audit/ux-v40)
- Recherche du référentiel : en direct, par mots (ordre libre, début de mot, tirets ignorés) ; quelques mots du chantier renvoient au terme du référentiel (agglo → parpaing, ampoule → lampe, téflon → PTFE…). Aucun produit créé.
- Documents : un bloc n'est écrit que s'il a un contenu (pas de « … jours », « — m² », base de calcul sans surface, choix d'option sans option). Main-d'œuvre, outils et transport détaillés sous leur poste dans les 3 formes technicien (forfait unique inchangé).
- Avec une TVA, l'arrêté en lettres porte le montant TTC (modèle entreprise et Word, comme le modèle technicien). À valider par Patrick.
- La surface de base ne bloque un devis entreprise que si un travail est calculé à partir d'elle.
- « Vérifier » signale (sans bloquer) : nom de l'entreprise absent, nom du client absent, produit en double.
- Rapport complet : audit-v40/RAPPORT.md. Aucun test humain réalisé.

## v41 — produit commercial (18/11/2026, branche audit/ux-v41)

Décisions prises par Patrick le 18/11 (questions posées avant de coder) :

- **Arrondi** : une seule règle. Chaque ligne = quantité × prix, arrondi au franc (0,5 → au-dessus), en calcul entier exact. Total HT = somme des lignes. Remise, frais et TVA calculés sur le total HT, arrondis au franc. TTC = HT + TVA. Même règle à l'écran, dans l'aperçu, le PDF et le Word (`engine.js : montantLigne`, `test-arrondi.mjs`).
- **Arrêté du devis** : en lettres sur le montant TTC.
- **PDF** : vrai texte (sélectionnable, cherchable, ~15 Ko au lieu d'une image). Coupure de page entre deux lignes, en-tête du tableau répété, numéros de page. L'ancien PDF image reste en secours si le texte échoue.
- **Catalogue** : on n'ajoute que des noms et des unités de vente, avec source citée, marqués « à confirmer ». Aucun prix, norme ni caractéristique. Les sigles sont écrits en clair, le sigle reste entre parenthèses ; l'ancien nom retrouve toujours la fiche.
- **Unités** : chaque fiche produit propose ses unités (document source, sinon famille, sinon nom). La fiche de ligne montre d'abord ces unités en boutons, les autres dans « Autre… ». Un nom tapé à la main reçoit les unités de la fiche seulement s'il n'y a pas d'ambiguïté.
- **Quantités** : un seul outil, le métré. L'aide « calculer à partir de la surface » de la fiche de ligne est retirée ; la fiche renvoie au métré. Les travaux types (calcul depuis la surface du chantier) sont rangés dans la carte du métré.
- **Envoi (profil technicien)** : plus d'étape « Marquer Prêt à envoyer » ; le bouton « Envoyer au client (version 1) » suffit quand rien ne bloque. Le profil entreprise garde l'étape de vérification. Les points de contrôle réussis ne sont plus listés pour le technicien.
- **Journal d'essai** : activé par le lien `?essai=1`, reste dans le téléphone, n'enregistre ni nom, ni téléphone, ni prix ; export CSV dans Réglages.

## v41b — suite de l'examen de Patrick (18/11/2026, branche audit/ux-v41)

- **Envoi** : « Envoyer au client » n'envoyait rien (il figeait la version). Désormais : « Terminer le devis et créer le PDF à envoyer (version N) » fige la version et crée son PDF ; puis « Envoyer le PDF (WhatsApp, e-mail…) » ouvre le menu Partager du téléphone, ou « Télécharger le fichier » si le téléphone ne sait pas partager.
- **Règle de calcul** (complète) : quantité et prix au millième (la saisie est ramenée au millième, l'affichage aussi) ; montant de ligne au franc ; pourcentages et répartitions en calcul entier exact quelle que soit la taille ; location refacturée = jours × prix par jour. Moteur 2.1.0 ; une version figée avant garde ses montants, l'écart de recalcul est signalé, pas traité comme une fraude.
- **TVA** : choix en deux boutons « Sans TVA » / « TVA 19,25 % » ; « sans TVA » choisi n'est plus signalé comme un oubli.
- **Catalogue** : matériel d'usine (HTA, moteurs, ATEX, cimenteries ; fiches « industriel », « réactifs ») caché à l'artisan, visible au profil entreprise ou d'un toucher ; recherche en peinture et en carrelage ; à score égal, le sous-ensemble « Logement » passe d'abord.
- **PDF/Word** : un poste de 4 lignes ou plus a son tableau ; Word : lignes insécables et en-tête répété.
- **Unités** : la fiche dit si l'unité est celle d'achat, de facturation du travail ou issue du métré ; pas de conversion carton ↔ m² devinée pour une ligne saisie à la main.
- **Étape 1** : l'outil « surface des murs moins portes » est retiré pour le technicien (le métré le fait) ; gardé pour les anciens devis qui l'utilisent.

## v41c — vérification avant intégration (18/11/2026)

- **Statut « Envoyé »** : « Terminer le devis et créer le PDF » ne met plus le devis à « Envoyé ». Nouveau statut **« Terminé, pas encore envoyé »** (version figée, non modifiable sans préparer une nouvelle version). Il devient « Envoyé » seulement : (a) quand le téléphone confirme le partage du fichier PDF ou Word **de cette version** (menu Partager terminé) ; ou (b) quand l'artisan touche « J'ai envoyé la version N au client ». Un téléchargement, un partage annulé ou le partage d'un brouillon ne changent rien. La preuve est écrite dans l'historique du devis. Un devis « Terminé » n'expire pas et ne peut pas être accepté avant d'être envoyé. Les devis déjà « Envoyé » avant la mise à jour gardent leur statut.
- **Sources du catalogue** : registre avec lien, pays et ce que chaque source démontre réellement. Statut par produit : « vérifié » (source camerounaise lue, produit et façon de le vendre démontrés) ou « à confirmer » (affiché à l'artisan dans la fiche). 11 vérifiés, 24 à confirmer. 4 références introuvables retirées ; unités corrigées d'après les sources (pointes au paquet ou au carton, film polyane au rouleau, peinture antirouille au kg).
