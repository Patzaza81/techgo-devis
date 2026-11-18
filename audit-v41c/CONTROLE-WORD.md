# Contrôle Microsoft Word (à faire sur iPhone)

LibreOffice a lu et mis en page ces fichiers sans erreur, et python-docx les a ouverts. **Ce n'est pas Microsoft Word.** Ce contrôle, fait par toi, est le seul qui vaut pour Word.

## Fichiers à ouvrir (dans `controle-word/` du ZIP)

| Fichier | Lignes | Total HT attendu | TVA attendue | TTC attendu |
|---|---|---|---|---|
| devis-200-lignes.docx | 200 | 186 880 388 822 | 35 974 474 848 | 222 854 863 670 |
| devis-carrelage-30-lignes.docx | 30 | 14 663 945 | 2 822 809 | 17 486 754 |
| devis-plomberie-30-lignes-sans-tva.docx | 30 | 19 159 768 | sans TVA | — |

Les montants attendus ont été calculés à part (outil `gros-devis-gen.mjs`), pas lus dans l'application.

## Comment ouvrir
1. Enregistre le ZIP dans Fichiers, touche-le pour l'extraire.
2. Touche le fichier .docx → Partager → **Word** (application Microsoft Word, gratuite pour la lecture).

## À cocher pour chaque fichier

| # | Contrôle | 200 lignes | Carrelage | Plomberie |
|---|---|---|---|---|
| 1 | Le fichier s'ouvre sans message « réparer » ou « erreur » | | | |
| 2 | Le nom de l'entreprise et le client sont en haut | | | |
| 3 | Le tableau a ses colonnes alignées (désignation, quantité, prix, montant) | | | |
| 4 | En haut de **chaque** page où le tableau continue : la ligne de titres du tableau est répétée | | | |
| 5 | Aucune ligne de produit n'est coupée en deux entre deux pages | | | |
| 6 | Les accents s'affichent (é, è, à, ç, œ) et « m² » est lisible | | | |
| 7 | Total HT, TVA et TTC = les valeurs du tableau ci-dessus (plomberie : « hors taxes », pas de TVA) | | | |
| 8 | La phrase « Arrêté le présent devis à la somme de … » est complète | | | |
| 9 | Nombre de pages affiché par Word (à noter, il peut différer de LibreOffice) | | | |

Envoie-moi une capture de la page 2 du fichier de 200 lignes, et la liste des cases non cochées.
