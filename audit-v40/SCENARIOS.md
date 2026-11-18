# Scénarios exécutés — audit v40

Joués dans Chromium piloté par Playwright, uniquement par l'interface visible (touchers, saisies, défilement, téléchargements). Aucune fonction interne appelée. **Ce sont des tests automatisés, pas des tests humains.**

| Largeur | Réussis | Échoués |
|---|---|---|
| 360 px | 29 | 0 |
| 390 px | 29 | 0 |
| 414 px | 29 | 0 |

Mêmes scénarios rejoués sur la version d'avant (v39, commit 0b9915b), à 360 px : **2 réussis sur 29**. Les échecs d'avant sont détaillés plus bas.


## Détail par scénario (360 px ; statut aux trois largeurs)

### PEI-C1 — Catalogue : chercher, ajouter, modifier, remplacer, doublon, retirer, retour, rechargement, produit absent
Métier : Peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 40 gestes comptés · 19 s machine

- ✔ Ajout « Ciment ordinaire » : 4 × 5 000 = 20 000
- ✔ Ajout « Sous-couche » : total 26 000
- ✔ Modification 4 → 5 : total 31 000
- ✔ L'ancien montant 20 000 a disparu de l'écran
- ✔ Remplacement « Sous-couche » → « Multiprim » : une seule ligne, au nouveau nom
- ✔ Remplacement : total inchangé (31 000)
- ✔ Doublon : la fiche avertit que le produit est déjà dans le devis
- • Doublon : même nom ajouté une 2e fois à la main — 2 ligne(s) « Ciment ordinaire » ; total 32000 ; lignes : Ciment ordinaire 25 000 | Multiprim 6 000 | Ciment ordinaire 1 000
- ✔ Doublon : pas deux lignes identiques sans avertissement
- ✔ Bouton « Retirer du devis » présent
- ✔ Suppression de « Multiprim »
- • Total après suppression — 26000
- ✔ Retour à l'étape 1
- ✔ Lignes et total conservés après retour à l'étape 1
- ✔ Lignes et total conservés après rechargement
- • Pas de champ de recherche dans ce métier — liste à plat
- ✔ Produit absent du catalogue : ajouté à la main
- ✔ Total + 1 500 après le produit ajouté à la main
- ✔ Quantité oubliée : la fiche dit ce qui manque
- ✔ Ligne sans quantité : n'entre pas dans le total
- ✔ Saisie « abc » : message d'erreur à côté du champ
- • Quantité 0 — n'est pas encore dans le devis. Il manque : la quantité. Écrire à quoi ça sert (facultatif) ▲ Fermer  Remplis la quantité, l'unité et le prix : la ligne entre dans le devis.  Main-d'œuvre ▼ Outils et machines ▼ Transport
- *Version d'avant (v39) : ÉCHOUÉ* — Doublon : la fiche avertit que le produit est déjà dans le devis (aucun avertissement) ; Doublon : pas deux lignes identiques sans avertissement (2 lignes « Ciment ordinaire »)
- Preuves : PEI-C1-ajouts.png, PEI-C1-fin.png

### CAR-C1 — Catalogue : chercher, ajouter, modifier, remplacer, doublon, retirer, retour, rechargement, produit absent
Métier : Carrelage · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 40 gestes comptés · 19 s machine

- ✔ Ajout « Colle à carrelage » : 4 × 5 000 = 20 000
- ✔ Ajout « Joint de carrelage » : total 26 000
- ✔ Modification 4 → 5 : total 31 000
- ✔ L'ancien montant 20 000 a disparu de l'écran
- ✔ Remplacement « Joint de carrelage » → « Croisillons » : une seule ligne, au nouveau nom
- ✔ Remplacement : total inchangé (31 000)
- ✔ Doublon : la fiche avertit que le produit est déjà dans le devis
- • Doublon : même nom ajouté une 2e fois à la main — 2 ligne(s) « Colle à carrelage » ; total 32000 ; lignes : Colle à carrelage 25 000 | Croisillons 6 000 | Colle à carrelage 1 000
- ✔ Doublon : pas deux lignes identiques sans avertissement
- ✔ Bouton « Retirer du devis » présent
- ✔ Suppression de « Croisillons »
- • Total après suppression — 26000
- ✔ Retour à l'étape 1
- ✔ Lignes et total conservés après retour à l'étape 1
- ✔ Lignes et total conservés après rechargement
- • Pas de champ de recherche dans ce métier — liste à plat
- ✔ Produit absent du catalogue : ajouté à la main
- ✔ Total + 1 500 après le produit ajouté à la main
- ✔ Quantité oubliée : la fiche dit ce qui manque
- ✔ Ligne sans quantité : n'entre pas dans le total
- ✔ Saisie « abc » : message d'erreur à côté du champ
- • Quantité 0 — n'est pas encore dans le devis. Il manque : la quantité. Écrire à quoi ça sert (facultatif) ▲ Fermer  Remplis la quantité, l'unité et le prix : la ligne entre dans le devis.  Main-d'œuvre ▼ Outils et machines ▼ Transport
- *Version d'avant (v39) : ÉCHOUÉ* — Doublon : la fiche avertit que le produit est déjà dans le devis (aucun avertissement) ; Doublon : pas deux lignes identiques sans avertissement (2 lignes « Colle à carrelage »)
- Preuves : CAR-C1-ajouts.png, CAR-C1-fin.png

### MAC-C1 — Catalogue : chercher, ajouter, modifier, remplacer, doublon, retirer, retour, rechargement, produit absent
Métier : Maçonnerie · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 40 gestes comptés · 24 s machine

- ✔ Champ de recherche présent (« ciment »)
- • Résultats pour « ciment » — 6 : Ciment Portland courant ; Ciment composé ; Ciment à prise rapide ; Ciment résistant à certains environnements agressifs ; Ciment pour travaux particuliers ; Accélérateur ou retardateur
- ✔ La recherche « ciment » donne au moins un résultat
- ✔ Ajout « Ciment Portland courant » : 4 × 5 000 = 20 000
- ✔ Champ de recherche présent (« sable »)
- • Résultats pour « sable » — 6 : Sable fin ; Sable moyen ; Sable grossier ; Sable de carrière ; Sable alluvionnaire ; Sable marin
- ✔ La recherche « sable » donne au moins un résultat
- ✔ Ajout « Sable fin » : total 26 000
- ✔ Modification 4 → 5 : total 31 000
- ✔ L'ancien montant 20 000 a disparu de l'écran
- ✔ Champ de recherche présent (« gravier »)
- • Résultats pour « gravier » — 4 : Gravier (granulats pour béton) ; Granulats de petite dimension ; Granulats de dimension moyenne ; Granulats de dimension plus importante
- ✔ La recherche « gravier » donne au moins un résultat
- ✔ Remplacement « Sable fin » → « Gravier (granulats pour béton) » : une seule ligne, au nouveau nom
- ✔ Remplacement : total inchangé (31 000)
- ✔ Doublon : la fiche avertit que le produit est déjà dans le devis
- • Doublon : même nom ajouté une 2e fois à la main — 2 ligne(s) « Ciment Portland courant » ; total 32000 ; lignes : Ciment Portland courant 25 000 | Gravier (granulats pour béton) 6 000 | Ciment Portland courant 1 000
- ✔ Doublon : pas deux lignes identiques sans avertissement
- ✔ Bouton « Retirer du devis » présent
- ✔ Suppression de « Gravier (granulats pour béton) »
- • Total après suppression — 26000
- ✔ Retour à l'étape 1
- ✔ Lignes et total conservés après retour à l'étape 1
- ✔ Lignes et total conservés après rechargement
- ✔ Recherche sans résultat : un message le dit et propose l'ajout à la main
- ✔ Produit absent du catalogue : ajouté à la main
- ✔ Total + 1 500 après le produit ajouté à la main
- ✔ Quantité oubliée : la fiche dit ce qui manque
- ✔ Ligne sans quantité : n'entre pas dans le total
- ✔ Saisie « abc » : message d'erreur à côté du champ
- • Quantité 0 — n'est pas encore dans le devis. Il manque : la quantité. Écrire à quoi ça sert (facultatif) ▲ Fermer  Remplis la quantité, l'unité et le prix : la ligne entre dans le devis.  Ouvrages et main-d'œuvre ▼ Outils et machines
- *Version d'avant (v39) : ÉCHOUÉ* — La recherche « ciment » donne au moins un résultat ; Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : MAC-C1-ajouts.png, MAC-C1-fin.png

### PLO-C1 — Catalogue : chercher, ajouter, modifier, remplacer, doublon, retirer, retour, rechargement, produit absent
Métier : Plomberie · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 40 gestes comptés · 23 s machine

- ✔ Champ de recherche présent (« PER »)
- • Résultats pour « PER » — 25 : Tube multicouche PE-RT/Al/PE-RT ; Tube PE-RT ; Bride de raccordement ; Filtre à panier ; Compteur d'eau froide ; Compteur à jets multiples ; Enregistreur de consommation ; Tube de drainage périphérique
- ✔ La recherche « PER » donne au moins un résultat
- ✔ Ajout « Tube multicouche PE-RT/Al/PE-RT » : 4 × 5 000 = 20 000
- ✔ Champ de recherche présent (« siphon »)
- • Résultats pour « siphon » — 20 : Siphon de lavabo ; Siphon de bidet ; Siphon d'évier ; Siphon de douche ; Siphon de baignoire ; Siphon de sol ; Siphon de machine à laver ; Bonde de lavabo
- ✔ La recherche « siphon » donne au moins un résultat
- ✔ Ajout « Siphon de lavabo » : total 26 000
- ✔ Modification 4 → 5 : total 31 000
- ✔ L'ancien montant 20 000 a disparu de l'écran
- ✔ Champ de recherche présent (« robinet »)
- • Résultats pour « robinet » — 40 : Raccord union de robinet ; Robinet d'arrêt droit ; Robinet d'arrêt équerre ; Robinet à tournant sphérique ; Robinet de vidange ; Robinet de purge ; Robinet de puisage ; Robinet de machine à laver
- ✔ La recherche « robinet » donne au moins un résultat
- ✔ Remplacement « Siphon de lavabo » → « Raccord union de robinet » : une seule ligne, au nouveau nom
- ✔ Remplacement : total inchangé (31 000)
- ✔ Doublon : la fiche avertit que le produit est déjà dans le devis
- • Doublon : même nom ajouté une 2e fois à la main — 2 ligne(s) « Tube multicouche PE-RT/Al/PE-RT » ; total 32000 ; lignes : Tube multicouche PE-RT/Al/PE-RT 25 000 | Raccord union de robinet 6 000 | Tube multicouche PE-RT/Al/PE-RT 1 000
- ✔ Doublon : pas deux lignes identiques sans avertissement
- ✔ Bouton « Retirer du devis » présent
- ✔ Suppression de « Raccord union de robinet »
- • Total après suppression — 26000
- ✔ Retour à l'étape 1
- ✔ Lignes et total conservés après retour à l'étape 1
- ✔ Lignes et total conservés après rechargement
- ✔ Recherche sans résultat : un message le dit et propose l'ajout à la main
- ✔ Produit absent du catalogue : ajouté à la main
- ✔ Total + 1 500 après le produit ajouté à la main
- ✔ Quantité oubliée : la fiche dit ce qui manque
- ✔ Ligne sans quantité : n'entre pas dans le total
- ✔ Saisie « abc » : message d'erreur à côté du champ
- • Quantité 0 — n'est pas encore dans le devis. Il manque : la quantité. Écrire à quoi ça sert (facultatif) ▲ Fermer  Remplis la quantité, l'unité et le prix : la ligne entre dans le devis.  Main-d'œuvre ▼ Outils et machines ▼ Transport
- *Version d'avant (v39) : ÉCHOUÉ* — La recherche « PER » donne au moins un résultat ; Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : PLO-C1-ajouts.png, PLO-C1-fin.png

### ELE-C1 — Catalogue : chercher, ajouter, modifier, remplacer, doublon, retirer, retour, rechargement, produit absent
Métier : Électricité · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 40 gestes comptés · 23 s machine

- ✔ Champ de recherche présent (« disjoncteur »)
- • Résultats pour « disjoncteur » — 10 : Disjoncteur modulaire ; Disjoncteur boîtier moulé ; Disjoncteur de puissance ouvert ; Disjoncteur différentiel (RCBO) ; Disjoncteur de branchement ; Disjoncteur HTA ; Cellule disjoncteur HTA ; Disjoncteur boîtier mo
- ✔ La recherche « disjoncteur » donne au moins un résultat
- ✔ Ajout « Disjoncteur modulaire » : 4 × 5 000 = 20 000
- ✔ Champ de recherche présent (« prise »)
- • Résultats pour « prise » — 8 : Prise de courant domestique ; Prise spécialisée ; Prise USB ; Prise d'échantillonnage ; Prise RJ45 ; PDU de baie ; Prise industrielle ; Coffret de chantier
- ✔ La recherche « prise » donne au moins un résultat
- ✔ Ajout « Prise de courant domestique » : total 26 000
- ✔ Modification 4 → 5 : total 31 000
- ✔ L'ancien montant 20 000 a disparu de l'écran
- ✔ Champ de recherche présent (« interrupteur »)
- • Résultats pour « interrupteur » — 7 : Interrupteur simple ; Interrupteur double ; Interrupteur-sectionneur ; Interrupteur différentiel (RCCB) ; Cellule interrupteur-sectionneur ; Interrupteur de sécurité de porte ; Interrupteur de position
- ✔ La recherche « interrupteur » donne au moins un résultat
- ✔ Remplacement « Prise de courant domestique » → « Interrupteur simple » : une seule ligne, au nouveau nom
- ✔ Remplacement : total inchangé (31 000)
- ✔ Doublon : la fiche avertit que le produit est déjà dans le devis
- • Doublon : même nom ajouté une 2e fois à la main — 2 ligne(s) « Disjoncteur modulaire » ; total 32000 ; lignes : Disjoncteur modulaire 25 000 | Interrupteur simple 6 000 | Disjoncteur modulaire 1 000
- ✔ Doublon : pas deux lignes identiques sans avertissement
- ✔ Bouton « Retirer du devis » présent
- ✔ Suppression de « Interrupteur simple »
- • Total après suppression — 26000
- ✔ Retour à l'étape 1
- ✔ Lignes et total conservés après retour à l'étape 1
- ✔ Lignes et total conservés après rechargement
- ✔ Recherche sans résultat : un message le dit et propose l'ajout à la main
- ✔ Produit absent du catalogue : ajouté à la main
- ✔ Total + 1 500 après le produit ajouté à la main
- ✔ Quantité oubliée : la fiche dit ce qui manque
- ✔ Ligne sans quantité : n'entre pas dans le total
- ✔ Saisie « abc » : message d'erreur à côté du champ
- • Quantité 0 — n'est pas encore dans le devis. Il manque : la quantité. Écrire à quoi ça sert (facultatif) ▲ Fermer  Remplis la quantité, l'unité et le prix : la ligne entre dans le devis.  Main-d'œuvre ▼ Outils et machines ▼ Transport
- *Version d'avant (v39) : ÉCHOUÉ* — La recherche « disjoncteur » donne au moins un résultat ; Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : ELE-C1-ajouts.png, ELE-C1-fin.png

### PEI-E1 — Parcours entreprise complet (5 étapes) : TVA, délai, oublis, vérification, PDF et Word
Métier : Peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 26 gestes comptés · 16 s machine

- ✔ Étape 1 sur 5 affichée
- ✔ Étape 2 sur 5
- ✔ Étape 3 sur 5 : produits et main-d'œuvre
- ✔ Total partiel 78 000 + 45 000 = 123 000 visible
- • Points « À ne pas oublier » renseignés — 5
- ✔ Étape 4 sur 5 : prix et conditions
- ✔ Étape 5 sur 5 : vérifier
- ✔ Aucun point bloquant après un parcours complet
- • Points à vérifier restants — Ton nom n'est pas sur le devis ; Marge de sécurité des produits non renseignée ; Seuil de hauteur d'accès non défini ; Coûts d'achat incomplets : marge non calculable
- ✔ Aperçu : total HT 123 000
- ✔ Aperçu : TTC 146 677,5 arrondi (146 677 ou 146 678)
- ✔ Aperçu : TVA 23 677,5 arrondie
- ✔ Aperçu : produit et main-d'œuvre détaillés
- ✔ Aperçu : délai 5 à 10 jours
- ✔ PDF créé
- ✔ PDF : 123 000 HT
- ✔ PDF : TTC identique à l'aperçu
- ✔ PDF : client
- ✔ Word créé
- ✔ Word : 123 000 HT
- ✔ Word : TTC identique à l'aperçu
- ✔ Word : pas de « … jours »
- ✔ Word : main-d'œuvre détaillée
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. VERSEMENT\tOFFRE DE BASE (HT)\tB","TBODY. VERSEMENT\tOFFRE DE BASE (HT)\tB","TR. VERSEMEN)
- Preuves : PEI-E1-e1.png, PEI-E1-e2.png, PEI-E1-e3.png, PEI-E1-e4.png, PEI-E1-apercu.png, PEI-E1.pdf, PEI-E1.pdf.txt, PEI-E1.docx

### CAR-E1 — Parcours entreprise complet (5 étapes) : TVA, délai, oublis, vérification, PDF et Word
Métier : Carrelage · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 26 gestes comptés · 16 s machine

- ✔ Étape 1 sur 5 affichée
- ✔ Étape 2 sur 5
- ✔ Étape 3 sur 5 : produits et main-d'œuvre
- ✔ Total partiel 78 000 + 45 000 = 123 000 visible
- • Points « À ne pas oublier » renseignés — 5
- ✔ Étape 4 sur 5 : prix et conditions
- ✔ Étape 5 sur 5 : vérifier
- ✔ Aucun point bloquant après un parcours complet
- • Points à vérifier restants — Ton nom n'est pas sur le devis ; Marge de sécurité des produits non renseignée ; Seuil de hauteur d'accès non défini ; Coûts d'achat incomplets : marge non calculable
- ✔ Aperçu : total HT 123 000
- ✔ Aperçu : TTC 146 677,5 arrondi (146 677 ou 146 678)
- ✔ Aperçu : TVA 23 677,5 arrondie
- ✔ Aperçu : produit et main-d'œuvre détaillés
- ✔ Aperçu : délai 5 à 10 jours
- ✔ PDF créé
- ✔ PDF : 123 000 HT
- ✔ PDF : TTC identique à l'aperçu
- ✔ PDF : client
- ✔ Word créé
- ✔ Word : 123 000 HT
- ✔ Word : TTC identique à l'aperçu
- ✔ Word : pas de « … jours »
- ✔ Word : main-d'œuvre détaillée
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. VERSEMENT\tOFFRE DE BASE (HT)\tB","TBODY. VERSEMENT\tOFFRE DE BASE (HT)\tB","TR. VERSEMEN)
- Preuves : CAR-E1-e1.png, CAR-E1-e2.png, CAR-E1-e3.png, CAR-E1-e4.png, CAR-E1-apercu.png, CAR-E1.pdf, CAR-E1.pdf.txt, CAR-E1.docx

### MAC-E1 — Parcours entreprise complet (5 étapes) : TVA, délai, oublis, vérification, PDF et Word
Métier : Maçonnerie · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 26 gestes comptés · 16 s machine

- ✔ Étape 1 sur 5 affichée
- ✔ Étape 2 sur 5
- ✔ Étape 3 sur 5 : produits et main-d'œuvre
- ✔ Total partiel 78 000 + 45 000 = 123 000 visible
- • Points « À ne pas oublier » renseignés — 5
- ✔ Étape 4 sur 5 : prix et conditions
- ✔ Étape 5 sur 5 : vérifier
- ✔ Aucun point bloquant après un parcours complet
- • Points à vérifier restants — Ton nom n'est pas sur le devis ; Marge de sécurité des produits non renseignée ; Seuil de hauteur d'accès non défini ; Coûts d'achat incomplets : marge non calculable
- ✔ Aperçu : total HT 123 000
- ✔ Aperçu : TTC 146 677,5 arrondi (146 677 ou 146 678)
- ✔ Aperçu : TVA 23 677,5 arrondie
- ✔ Aperçu : produit et main-d'œuvre détaillés
- ✔ Aperçu : délai 5 à 10 jours
- ✔ PDF créé
- ✔ PDF : 123 000 HT
- ✔ PDF : TTC identique à l'aperçu
- ✔ PDF : client
- ✔ Word créé
- ✔ Word : 123 000 HT
- ✔ Word : TTC identique à l'aperçu
- ✔ Word : pas de « … jours »
- ✔ Word : main-d'œuvre détaillée
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. VERSEMENT\tOFFRE DE BASE (HT)\tB","TBODY. VERSEMENT\tOFFRE DE BASE (HT)\tB","TR. VERSEMEN)
- Preuves : MAC-E1-e1.png, MAC-E1-e2.png, MAC-E1-e3.png, MAC-E1-e4.png, MAC-E1-apercu.png, MAC-E1.pdf, MAC-E1.pdf.txt, MAC-E1.docx

### PLO-E1 — Parcours entreprise complet (5 étapes) : TVA, délai, oublis, vérification, PDF et Word
Métier : Plomberie · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 25 gestes comptés · 15 s machine

- ✔ Étape 1 sur 5 affichée
- • Champ absent dans ce métier — surface déjà calculée
- ✔ Étape 2 sur 5
- ✔ Étape 3 sur 5 : produits et main-d'œuvre
- ✔ Total partiel 78 000 + 45 000 = 123 000 visible
- • Points « À ne pas oublier » renseignés — 5
- ✔ Étape 4 sur 5 : prix et conditions
- ✔ Étape 5 sur 5 : vérifier
- ✔ Aucun point bloquant après un parcours complet
- • Points à vérifier restants — Ton nom n'est pas sur le devis ; Marge de sécurité des produits non renseignée ; Seuil de hauteur d'accès non défini ; Coûts d'achat incomplets : marge non calculable
- ✔ Aperçu : total HT 123 000
- ✔ Aperçu : TTC 146 677,5 arrondi (146 677 ou 146 678)
- ✔ Aperçu : TVA 23 677,5 arrondie
- ✔ Aperçu : produit et main-d'œuvre détaillés
- ✔ Aperçu : délai 5 à 10 jours
- ✔ PDF créé
- ✔ PDF : 123 000 HT
- ✔ PDF : TTC identique à l'aperçu
- ✔ PDF : client
- ✔ Word créé
- ✔ Word : 123 000 HT
- ✔ Word : TTC identique à l'aperçu
- ✔ Word : pas de « … jours »
- ✔ Word : main-d'œuvre détaillée
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. VERSEMENT\tOFFRE DE BASE (HT)\tB","TBODY. VERSEMENT\tOFFRE DE BASE (HT)\tB","TR. VERSEMEN) ; Aucun point bloquant après un parcours complet (Surface ou quantité de base non renseignée) ; PDF créé (bouton grisé) ; Word créé (bouton grisé)
- Preuves : PLO-E1-e1.png, PLO-E1-e2.png, PLO-E1-e3.png, PLO-E1-e4.png, PLO-E1-apercu.png, PLO-E1.pdf, PLO-E1.pdf.txt, PLO-E1.docx

### ELE-E1 — Parcours entreprise complet (5 étapes) : TVA, délai, oublis, vérification, PDF et Word
Métier : Électricité · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 25 gestes comptés · 15 s machine

- ✔ Étape 1 sur 5 affichée
- • Champ absent dans ce métier — surface déjà calculée
- ✔ Étape 2 sur 5
- ✔ Étape 3 sur 5 : produits et main-d'œuvre
- ✔ Total partiel 78 000 + 45 000 = 123 000 visible
- • Points « À ne pas oublier » renseignés — 5
- ✔ Étape 4 sur 5 : prix et conditions
- ✔ Étape 5 sur 5 : vérifier
- ✔ Aucun point bloquant après un parcours complet
- • Points à vérifier restants — Ton nom n'est pas sur le devis ; Marge de sécurité des produits non renseignée ; Seuil de hauteur d'accès non défini ; Coûts d'achat incomplets : marge non calculable
- ✔ Aperçu : total HT 123 000
- ✔ Aperçu : TTC 146 677,5 arrondi (146 677 ou 146 678)
- ✔ Aperçu : TVA 23 677,5 arrondie
- ✔ Aperçu : produit et main-d'œuvre détaillés
- ✔ Aperçu : délai 5 à 10 jours
- ✔ PDF créé
- ✔ PDF : 123 000 HT
- ✔ PDF : TTC identique à l'aperçu
- ✔ PDF : client
- ✔ Word créé
- ✔ Word : 123 000 HT
- ✔ Word : TTC identique à l'aperçu
- ✔ Word : pas de « … jours »
- ✔ Word : main-d'œuvre détaillée
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. VERSEMENT\tOFFRE DE BASE (HT)\tB","TBODY. VERSEMENT\tOFFRE DE BASE (HT)\tB","TR. VERSEMEN) ; Aucun point bloquant après un parcours complet (Surface ou quantité de base non renseignée) ; PDF créé (bouton grisé) ; Word créé (bouton grisé)
- Preuves : ELE-E1-e1.png, ELE-E1-e2.png, ELE-E1-e3.png, ELE-E1-e4.png, ELE-E1-apercu.png, ELE-E1.pdf, ELE-E1.pdf.txt, ELE-E1.docx

### PEI-K2 — Chiffrage avec remise 10 % et TVA 19,25 % : écran, aperçu, PDF, Word
Métier : Peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 25 gestes comptés · 14 s machine

- ✔ Total avant remise : 5 × 12 000 + 2,5 × 6 000 + 2 × 20 000 = 115 000
- ✔ Aperçu : HT après remise 103 500
- ✔ Aperçu : remise 11 500 écrite
- ✔ Aperçu : TTC 123 423,75 arrondi
- ✔ Écran : « Avec TVA » égal au TTC de l'aperçu
- ✔ PDF créé
- ✔ PDF contient 103 500
- ✔ PDF contient 123 424
- ✔ PDF : ligne « Remise (10 %) » (le montant − 11 500 est vérifié sur l'image : l'OCR lit mal le signe moins)
- ✔ Word créé
- ✔ Word contient 103 500
- ✔ Word contient 11 500
- ✔ Word contient 123 424
- ✔ Word : désignations présentes
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN) ; Aperçu : HT après remise 103 500 (115 000 FCFA |  75 000 FCFA |  40 000 FCFA |  115 000 FCFA | 115 000 FCFA) ; Aperçu : remise 11 500 écrite ; Aperçu : TTC 123 423,75 arrondi
- Preuves : PEI-K2-apercu.png, PEI-K2.pdf, PEI-K2.pdf.txt, PEI-K2.docx, PEI-K2.docx.txt

### CAR-K2 — Chiffrage avec remise 10 % et TVA 19,25 % : écran, aperçu, PDF, Word
Métier : Carrelage · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 25 gestes comptés · 14 s machine

- ✔ Total avant remise : 5 × 12 000 + 2,5 × 6 000 + 2 × 20 000 = 115 000
- ✔ Aperçu : HT après remise 103 500
- ✔ Aperçu : remise 11 500 écrite
- ✔ Aperçu : TTC 123 423,75 arrondi
- ✔ Écran : « Avec TVA » égal au TTC de l'aperçu
- ✔ PDF créé
- ✔ PDF contient 103 500
- ✔ PDF contient 123 424
- ✔ PDF : ligne « Remise (10 %) » (le montant − 11 500 est vérifié sur l'image : l'OCR lit mal le signe moins)
- ✔ Word créé
- ✔ Word contient 103 500
- ✔ Word contient 11 500
- ✔ Word contient 123 424
- ✔ Word : désignations présentes
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN) ; Aperçu : HT après remise 103 500 (115 000 FCFA |  75 000 FCFA |  40 000 FCFA |  115 000 FCFA | 115 000 FCFA) ; Aperçu : remise 11 500 écrite ; Aperçu : TTC 123 423,75 arrondi
- Preuves : CAR-K2-apercu.png, CAR-K2.pdf, CAR-K2.pdf.txt, CAR-K2.docx, CAR-K2.docx.txt

### MAC-K2 — Chiffrage avec remise 10 % et TVA 19,25 % : écran, aperçu, PDF, Word
Métier : Maçonnerie · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 25 gestes comptés · 17 s machine

- ✔ Total avant remise : 5 × 12 000 + 2,5 × 6 000 + 2 × 20 000 = 115 000
- ✔ Aperçu : HT après remise 103 500
- ✔ Aperçu : remise 11 500 écrite
- ✔ Aperçu : TTC 123 423,75 arrondi
- ✔ Écran : « Avec TVA » égal au TTC de l'aperçu
- ✔ PDF créé
- ✔ PDF contient 103 500
- ✔ PDF contient 123 424
- ✔ PDF : ligne « Remise (10 %) » (le montant − 11 500 est vérifié sur l'image : l'OCR lit mal le signe moins)
- ✔ Word créé
- ✔ Word contient 103 500
- ✔ Word contient 11 500
- ✔ Word contient 123 424
- ✔ Word : désignations présentes
- *Version d'avant (v39) : ÉCHOUÉ* — Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : MAC-K2-apercu.png, MAC-K2.pdf, MAC-K2.pdf.txt, MAC-K2.docx, MAC-K2.docx.txt

### PLO-K2 — Chiffrage avec remise 10 % et TVA 19,25 % : écran, aperçu, PDF, Word
Métier : Plomberie · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 25 gestes comptés · 16 s machine

- ✔ Total avant remise : 5 × 12 000 + 2,5 × 6 000 + 2 × 20 000 = 115 000
- ✔ Aperçu : HT après remise 103 500
- ✔ Aperçu : remise 11 500 écrite
- ✔ Aperçu : TTC 123 423,75 arrondi
- ✔ Écran : « Avec TVA » égal au TTC de l'aperçu
- ✔ PDF créé
- ✔ PDF contient 103 500
- ✔ PDF contient 123 424
- ✔ PDF : ligne « Remise (10 %) » (le montant − 11 500 est vérifié sur l'image : l'OCR lit mal le signe moins)
- ✔ Word créé
- ✔ Word contient 103 500
- ✔ Word contient 11 500
- ✔ Word contient 123 424
- ✔ Word : désignations présentes
- *Version d'avant (v39) : ÉCHOUÉ* — Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : PLO-K2-apercu.png, PLO-K2.pdf, PLO-K2.pdf.txt, PLO-K2.docx, PLO-K2.docx.txt

### ELE-K2 — Chiffrage avec remise 10 % et TVA 19,25 % : écran, aperçu, PDF, Word
Métier : Électricité · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 25 gestes comptés · 17 s machine

- ✔ Total avant remise : 5 × 12 000 + 2,5 × 6 000 + 2 × 20 000 = 115 000
- ✔ Aperçu : HT après remise 103 500
- ✔ Aperçu : remise 11 500 écrite
- ✔ Aperçu : TTC 123 423,75 arrondi
- ✔ Écran : « Avec TVA » égal au TTC de l'aperçu
- ✔ PDF créé
- ✔ PDF contient 103 500
- ✔ PDF contient 123 424
- ✔ PDF : ligne « Remise (10 %) » (le montant − 11 500 est vérifié sur l'image : l'OCR lit mal le signe moins)
- ✔ Word créé
- ✔ Word contient 103 500
- ✔ Word contient 11 500
- ✔ Word contient 123 424
- ✔ Word : désignations présentes
- *Version d'avant (v39) : ÉCHOUÉ* — Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : ELE-K2-apercu.png, ELE-K2.pdf, ELE-K2.pdf.txt, ELE-K2.docx, ELE-K2.docx.txt

### PEI-K3 — Grands montants : 1 500 × 125 000 = 187 500 000, montant en lettres
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 12 gestes comptés · 9 s machine

- ✔ « 1 500 » × « 125 000 » (espaces) = 187 500 000
- ✔ Aperçu : 187 500 000
- ✔ Aperçu : montant en lettres exact
- ✔ PDF : 187 500 000
- ✔ Word : montant et lettres
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN)
- Preuves : PEI-K3.pdf, PEI-K3.pdf.txt, PEI-K3.docx, PEI-K3.docx.txt, PEI-K3-apercu.png

### PEI-L1 — Devis long : 30 lignes aux noms longs, saut de page, rien de perdu
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 158 gestes comptés · 85 s machine

- ✔ Total des 30 lignes = 559 550 (calculé à part)
- ✔ Pas de défilement horizontal à l'écran avec des noms longs
- ✔ Aperçu : total
- ✔ Aperçu : les 30 lignes présentes
- ✔ PDF créé
- • Pages du PDF — 3
- ✔ Le PDF passe sur plusieurs pages
- ✔ PDF : total (lecture OCR)
- ✔ PDF : les lignes se retrouvent par OCR (≥ 28/30, l'OCR peut en rater)
- ✔ Word : les 30 lignes présentes
- ✔ Word : total
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN)
- Preuves : PEI-L1.pdf, PEI-L1.pdf.txt, PEI-L1.docx, PEI-L1.docx.txt

### PEI-R1 — Double toucher sur « Créer le PDF », export répété : un seul fichier prêt, montants identiques
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 12 gestes comptés · 11 s machine

- ✔ Un seul bouton « Enregistrer » après deux touchers
- ✔ Aucun message d'erreur
- ✔ Deux exports PDF successifs réussis
- ✔ Les deux PDF portent 78 000
- ✔ Deux Word identiques
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN)
- Preuves : PEI-R1.pdf, PEI-R1.pdf.txt, PEI-R1.pdf, PEI-R1.pdf.txt, PEI-R1.docx, PEI-R1.docx.txt, PEI-R1.docx, PEI-R1.docx.txt

### PEI-R2 — Client incomplet : pas de nom ni de téléphone
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 9 gestes comptés · 5 s machine

- • Ce que montre l'aperçu à la place du nom — ........................ OBJET ET LIEU D
- ✔ « Vérifier » signale le nom du client manquant
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN) ; « Vérifier » signale le nom du client manquant (Aucune main-d'œuvre dans le devis | Transport du matériel non compté | Validité de l'offre renseignée | Échéancier rense)
- Preuves : PEI-R2-verifier.png

### PEI-R3 — Fermeture du navigateur puis retour : le devis est retrouvé et modifiable
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 11 gestes comptés · 7 s machine

- ✔ La liste des devis montre le devis de Mme Ngo Bassa
- ✔ Total retrouvé : 78 000

### PEI-R4 — Hors connexion : l'application se rouvre sans réseau (après une première visite)
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 0 gestes comptés · 4 s machine

- • Service worker — prêt
- ✔ L'application s'affiche hors connexion

### PEI-M1 — Métré : 50 m², 2 couches, 10 m² par pot → 10 pots ; prix saisis → devis, PDF, Word
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 20 gestes comptés · 12 s machine

- ✔ Choix « Comment tu la factures » présent
- • Mode de main-d'œuvre proposé par défaut — Pas de main-d'œuvre ici
- • Textes « Il manque » / « à compléter »
- ✔ Le calcul est montré en clair : 50 m² × 2 couches = 100 m² ÷ 10 = 10
- • Lignes après le métré — Surface déjà mesurée : 50 m² | Peinture acrylique : 10 Pot × prix ? | Travaux de peinture : 50 m² × prix ?
- ✔ La ligne « Peinture acrylique » porte 10 pots
- ✔ Ligne de main-d'œuvre « Travaux de peinture » créée par le métré
- ✔ Total : 10 × 12 000 + 50 × 1 500 = 195 000 (calcul indépendant)
- ✔ Aperçu : 120 000, 75 000, 195 000
- ✔ Aperçu : le détail du métré (50 m²) est joint
- ✔ PDF : 195 000
- ✔ Word : 195 000 et détail du métré (50 m²)
- ✔ Word : pas de « Zone sans nom »
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN) ; Word : pas de « Zone sans nom »
- Preuves : PEI-M1-metre.png, PEI-M1.pdf, PEI-M1.pdf.txt, PEI-M1.docx, PEI-M1.docx.txt

### PEI-P1 — Artisan pressé : 1 client, 1 produit, PDF — nombre de gestes
Métier : Peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 10 gestes comptés · 7 s machine

- ✔ PDF obtenu avec 4 × 2 500 = 10 000
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN)
- Preuves : PEI-P1.pdf, PEI-P1.pdf.txt

### CAR-P1 — Artisan pressé : 1 client, 1 produit, PDF — nombre de gestes
Métier : Carrelage · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 10 gestes comptés · 7 s machine

- ✔ PDF obtenu avec 4 × 2 500 = 10 000
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN)
- Preuves : CAR-P1.pdf, CAR-P1.pdf.txt

### MAC-P1 — Artisan pressé : 1 client, 1 produit, PDF — nombre de gestes
Métier : Maçonnerie · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 10 gestes comptés · 8 s machine

- ✔ PDF obtenu avec 4 × 2 500 = 10 000
- *Version d'avant (v39) : ÉCHOUÉ* — Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : MAC-P1.pdf, MAC-P1.pdf.txt

### PLO-P1 — Artisan pressé : 1 client, 1 produit, PDF — nombre de gestes
Métier : Plomberie · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 10 gestes comptés · 7 s machine

- ✔ PDF obtenu avec 4 × 2 500 = 10 000
- *Version d'avant (v39) : ÉCHOUÉ* — Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : PLO-P1.pdf, PLO-P1.pdf.txt

### ELE-P1 — Artisan pressé : 1 client, 1 produit, PDF — nombre de gestes
Métier : Électricité · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 10 gestes comptés · 7 s machine

- ✔ PDF obtenu avec 4 × 2 500 = 10 000
- *Version d'avant (v39) : ÉCHOUÉ* — Le scénario s'est arrêté (Cannot read properties of undefined (reading 'replace'))
- Preuves : ELE-P1.pdf, ELE-P1.pdf.txt

### PEI-V1 — Figer V1, modifier ensuite (V2), V1 inchangée ; rouvrir le devis depuis son PDF sur un autre téléphone
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 20 gestes comptés · 15 s machine

- ✔ Message « V1 figée et envoyée »
- ✔ PDF de V1 : 78 000
- ✔ Bouton « Préparer V2 » trouvé dans le suivi
- ✔ V2 en préparation : 10 sacs → 65 000
- • Versions proposées — Brouillon actuel | V1 — 18/11/2026
- ✔ La V1 envoyée garde 78 000 (non modifiée)
- ✔ PDF rouvert sur un autre téléphone : le devis de M. Tchoua revient
- ✔ Montant 78 000 retrouvé
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN) ; Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN)
- Preuves : PEI-V1.pdf, PEI-V1.pdf.txt

### PEI-K1 — Chiffrage connu : écran = aperçu = PDF = Word, puis modification
Métier : peinture · 360 : RÉUSSI / 390 : RÉUSSI / 414 : RÉUSSI · 24 gestes comptés · 14 s machine

- ✔ 12 sacs × 6 500 = 78 000 sur la ligne
- ✔ Total du devis = 78 000
- ✔ 2,5 × 1 250 = 3 125 (décimale avec virgule)
- ✔ Total = 78 000 + 3 125 + 45 000 = 126 125
- ✔ Après 12 → 10 sacs : total 113 125
- ✔ L'ancien montant 78 000 n'apparaît plus à l'écran
- ✔ Aperçu : ligne ciment 65 000
- ✔ Aperçu : ligne peinture 3 125
- ✔ Aperçu : main-d'œuvre 45 000
- ✔ Aperçu : total 113 125
- ✔ Aperçu : pas d'ancien montant 78 000
- ✔ Aperçu : nom du client
- ✔ PDF créé et téléchargé
- ✔ PDF contient 65 000
- ✔ PDF contient 3 125
- ✔ PDF contient 45 000
- ✔ PDF contient 113 125
- ✔ PDF : pas d'ancien montant
- ✔ PDF : les 3 désignations (dont la main-d'œuvre)
- ✔ PDF : client
- ✔ Word créé et téléchargé
- ✔ Word contient 65 000
- ✔ Word contient 3 125
- ✔ Word contient 45 000
- ✔ Word contient 113 125
- ✔ Word : désignations
- *Version d'avant (v39) : ÉCHOUÉ* — Débordement horizontal (après Continuer) ({"sw":360,"w":360,"b":["TABLE. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","THEAD. DÉSIGNATION\tUNITÉ\tQTÉ\tP.U. (FC","TR. DÉSIGN) ; PDF : les 3 désignations (dont la main-d'œuvre)
- Preuves : PEI-K1-etape2.png, PEI-K1-apercu.png, PEI-K1.pdf, PEI-K1.pdf.txt, PEI-K1.docx, PEI-K1.docx.txt

## NON TESTÉ

| Métier | Fonction | Raison |
|---|---|---|
| Tous | Test avec de vrais artisans (débutants et expérimentés) | Impossible depuis cet environnement : protocole prêt dans TEST-UTILISATEURS.md |
| Tous | Vrai iPhone et vrai Android (clavier, virgule selon la langue, partage) | Seul Chromium émulé (360, 390, 414 px) a été utilisé |
| Tous | Envoi réel par WhatsApp ou par e-mail | Le bouton ouvre WhatsApp ; l'envoi lui-même n'est pas automatisable ici |
| Tous | Impression papier | Le bouton « Imprimer » n'a pas été testé |
| Tous | Ajout d'un logo (fichier image) | Non joué dans les scénarios |
| Tous | Activation d'une licence et fin d'essai gratuit | Couvert par test-licence.mjs (34 vérifications), pas par un parcours navigateur |
| Tous | Écrans Clients, Produits (gestion du catalogue), Suivi, Réglages en détail | Seuls leurs effets dans un devis ont été vérifiés |
| Maçonnerie | Armatures d'après le plan | Couvert par parcours-metre.cjs ; demande la lecture d'un plan |
| Plomberie / Électricité | Dimensionnement (sections, diamètres) | Hors champ : l'application ne dimensionne pas, c'est au professionnel |
| Tous | Perte de connexion pendant la création d'un PDF | Seule la réouverture hors connexion a été testée |
