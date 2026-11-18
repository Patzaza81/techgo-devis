# Kit d'essai — 25 artisans, vrais téléphones, sans tutoriel

But : observer un artisan qui n'a jamais vu l'application construire un devis complet, seul. Ce kit ne remplace pas l'essai : les tests automatiques ne disent rien de la compréhension réelle.

## 1. Qui

- 25 artisans : 5 par métier (peinture, carrelage, maçonnerie, plomberie, électricité).
- Au moins 10 sur Android et 10 sur iPhone ; au moins 10 qui n'ont jamais fait de devis sur téléphone.
- Chacun sur **son propre téléphone**, avec sa connexion habituelle.

## 2. Préparation (5 min par artisan)

- Ouvrir le lien d'essai : `<adresse de l'aperçu Netlify>/?essai=1` (le journal d'essai s'active ; rien n'est envoyé sur Internet).
- Ne rien montrer de l'application. Ne pas expliquer les écrans.
- Phrase unique à dire : « Fais le devis de ce chantier comme pour un vrai client, avec tes prix. Je ne peux pas t'aider. Dis à voix haute ce que tu cherches. »

## 3. Cartes de chantier (une par métier)

Les prix ne sont pas donnés : l'artisan met **ses** prix. Seules les mesures sont imposées, pour pouvoir vérifier les quantités.

| Métier | Chantier à chiffrer |
|---|---|
| Peinture | Salon de 5 m × 4 m, hauteur 2,80 m, une porte (0,90 × 2,10) et une fenêtre (1,20 × 1,00). Murs et plafond, 2 couches. Main-d'œuvre et transport. |
| Carrelage | Chambre de 4 m × 3,50 m, sol, carreaux 60 × 60 en cartons, plinthes. Colle et joint. Main-d'œuvre. |
| Maçonnerie | Mur de clôture de 20 m de long, 2 m de haut, agglos de 15. Ciment, sable, fer pour le chaînage. Main-d'œuvre. |
| Plomberie | Salle de bains : WC, lavabo, douche. Arrivée d'eau en tube PPR, évacuation en PVC. Main-d'œuvre. |
| Électricité | Chambre : 1 plafonnier avec interrupteur, 3 prises, câblage depuis le tableau. Main-d'œuvre. |

Tâche complète : le client (nom, téléphone, quartier) → les lignes → le prix → **le PDF envoyé sur WhatsApp à l'observateur**.

## 4. Ce que l'observateur note (fiche ci-dessous, une par artisan)

| Champ | À noter |
|---|---|
| Artisan | Métier, âge approximatif, habitude du téléphone (faible / moyenne / bonne) |
| Téléphone | Marque, iPhone ou Android |
| Début / fin | Heure exacte |
| Terminé seul ? | Oui / Non (si non : à quel écran il a abandonné) |
| Blocages | Chaque arrêt de plus de 20 secondes : écran, ce qu'il cherchait, ses mots exacts |
| Erreurs | Unité fausse, quantité fausse, ligne oubliée, ligne en double, prix au mauvais endroit |
| Montants | Le total du PDF est-il égal au total à l'écran ? Le recalculer à la main sur 2 lignes |
| PDF | S'ouvre sur le téléphone du client ? Texte lisible ? |
| Mots non compris | Tous les mots qu'il a demandés ou mal interprétés |
| Avis | « Tu l'utiliserais pour un vrai client ? Pourquoi ? » (ses mots) |

À la fin : Réglages → « Journal d'essai » → **Exporter (CSV)** et envoyer le fichier avec la fiche.

## 5. Critères fixés avant l'essai (pour ne pas les ajuster après)

- Réussite d'un artisan : devis complet, PDF envoyé, **sans aide**, montants justes.
- Bloquant à corriger avant toute mise en production : un écran où **3 artisans ou plus** se bloquent, ou **une seule** erreur de montant entre écran, PDF et Word.
- Le temps est noté mais n'est pas un critère de réussite au premier essai.

## 6. Ce que le journal d'essai enregistre (dans le téléphone seulement)

- Heure de chaque écran ouvert, de chaque bouton touché (nom de l'action, pas le contenu saisi), des erreurs de l'application.
- Ni nom de client, ni téléphone, ni prix. Effacement : Réglages → Journal d'essai → Effacer.

## 7. Word

- À faire par Patrick une fois : ouvrir un Word créé par l'application dans **Microsoft Word sur iPhone**, et vérifier tableau, totaux, accents, page 2. Le test automatique ne lit que le contenu du fichier, pas son affichage dans Word.
