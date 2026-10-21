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
