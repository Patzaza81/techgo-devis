# TechGo Devis — état par rapport au document stratégique (2026-10-19)

Mis à jour le 2026-10-20. Légende : ✅ fait et testé · 🟡 partiel · ❌ non fait · 🔒 demande une décision ou un service externe.

## Périmètre « V1 inclus » du document

| Élément | État | Remarque |
|---|---|---|
| Fiche entreprise, client, chantier, champs conditionnels | ✅ | Photos du chantier : ❌ (stockage du téléphone) |
| Surface nette = brute − ouvertures, source affichée | ✅ | Une seule surface par devis : « plusieurs bâtiments » ❌ |
| Catalogue vide rempli par l'entreprise | ✅ | Les nouvelles entreprises démarrent **sans aucun prix ni rendement** ; copie du catalogue possible sur demande |
| Prix datés + historique des modifications | ✅ | Rendements aussi |
| Calcul quantités, main-d'œuvre, options, échéancier | ✅ | Devis TechGo reproduit au franc près |
| Main-d'œuvre à l'heure / à la journée | 🟡 | Le moteur sait le faire ; l'écran ne propose pas encore ce choix par ligne |
| Contrôle des oublis (Complet / À vérifier / Bloqué) | ✅ | Total nul ou négatif bloqué |
| Moyens de chantier : équipement possédé ou loué, sans double comptage | ✅ | Pas de conception d'échafaudage (voulu) |
| Présentation : 3 modèles, couleur, logo PNG/JPG, textes de conditions | ✅ | Figée avec chaque version envoyée |
| Devis figés, versionnés, empreinte de contrôle | ✅ | Intégrité vérifiée par recalcul |
| Sortie PDF | ✅ | Via « Imprimer → Enregistrer en PDF » |
| Sortie Word (.docx) depuis la version figée, « copie modifiable » | ✅ | Test : mêmes montants que le PDF. Ouvert avec LibreOffice et python-docx ; **pas encore avec Microsoft Word ni Word iPhone** |
| Hors ligne sur un appareil | ✅ | Données dans le navigateur de l'appareil |
| Sauvegarde sur serveur | 🔒 | Aucun serveur choisi (phase 4). Sauvegarde fichier .json vérifiée disponible |
| Vue interne coûts et marge | ✅ | Jamais sur le document client |
| Import des prix depuis Excel (CSV) | ✅ | Aperçu avant application ; prix vide = inconnu |
| Export devis, catalogue, prix | ✅ | .json complet + CSV catalogue + CSV devis |

## Exclu de la V1 par le document, mais déjà livré (décision du propriétaire : version complète)

Facturation de gestion et suivi des commandes · 4 autres métiers (carrelage, maçonnerie, plomberie, électricité : **formules seulement, sans prix**) · plusieurs entreprises sur un appareil.

## Non fait

| Élément | Pourquoi |
|---|---|
| Comptes, connexion, sauvegardes serveur, synchronisation, isolation vérifiée côté serveur, code SMS/WhatsApp | 🔒 Nécessite de choisir un service de données (document : phase 4, avec ton accord) |
| Code PIN et chiffrement des données locales | ❌ Un PIN sans chiffrement serait trompeur ; le chiffrement impose de réécrire le stockage et fait perdre les données si le PIN est oublié |
| Rendement minimum / maximum / par défaut, choix « prudent / moyen », alerte hors plage | ❌ |
| Alerte sur les prix de plus de N jours | ❌ (N à fixer à partir de tes données) |
| Retour de chantier (quantité réellement utilisée) | ❌ |
| Étanchéité (dans le premier pack du document) | 🔒 Formules à fournir par un professionnel |
| Règle des papiers abrasifs | Laissée en saisie manuelle, comme le document le prévoit à défaut de règle validée |
| TypeScript | JavaScript simple utilisé (aucune étape de compilation, fonctionne sur téléphone). Migration possible plus tard |
| Dépôt privé | 🔒 À faire par le propriétaire : le dépôt est public et contient les prix du devis du 28/09 |

## Règles à trancher (le comportement actuel est indiqué)

- **Restes entre lignes d'un même produit** : arrondi **par ligne** (c'est ce que fait le devis TechGo : 98 + 49 sacs de Homay).
- **Pertes** : un seul paramètre, la marge de sécurité (5 % dans le devis TechGo), appliquée aux fournitures seulement. Pas de « rendement prudent » cumulé.
- **TVA** : aucun taux par défaut ; montants hors taxes tant qu'aucun taux n'est saisi ; avec un taux, TVA et TTC par versement. À valider avec un comptable local.

## Critères du document

| Critère | État |
|---|---|
| Test de référence rejoué à chaque modification | ✅ `.github/workflows/tests.yml` (à chaque modification et chaque jour) |
| Identité des totaux PDF / Word | ✅ `test-docx.mjs` |
| Cas limites d'arrondi | ✅ `test.mjs` |
| Devis de test supplémentaires (villa, intérieur, remise, plusieurs bâtiments) | ❌ Demandent de vrais devis |
| Test d'isolation entre entreprises | ✅ en local (`test-store.mjs`) ; ❌ côté serveur |
| Test sur iPhone / Android réels | ❌ Jamais fait depuis cet environnement |
