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
