# Kit d'essai — artisans débutants et expérimentés, vrais téléphones, observation directe

L'essai se fait **en face de l'artisan**. Le journal d'essai du téléphone ne sert qu'à retrouver l'ordre des écrans après coup ; il ne remplace ni l'observateur ni ses notes.

## 1. Qui

| | Nombre | Condition |
|---|---|---|
| Débutants | 15 | n'ont jamais fait de devis sur téléphone |
| Expérimentés | 10 | font déjà leurs devis (papier, Word ou autre application) |
| Par métier | 5 | peinture, carrelage, maçonnerie, plomberie, électricité (débutants et expérimentés mélangés) |
| Téléphones | ≥ 10 Android, ≥ 10 iPhone | le téléphone **de l'artisan**, sa connexion habituelle |

Chaque artisan accepte l'essai à voix haute (pas de photo de lui sans son accord).

## 2. Lien à ouvrir

- Lien d'essai : **adresse de l'aperçu Netlify de la branche `audit/ux-v41`** suivie de `?essai=1`.
  - Je n'ai pas pu créer ni vérifier cet aperçu d'ici (voir le rapport, § « Ce que j'attends de toi »).
- Avant chaque artisan : ouvrir le lien dans un **onglet privé** (aucune donnée d'un essai précédent).

## 3. Règles de l'observateur

1. Phrase unique au départ : « Fais le devis de ce chantier comme pour un vrai client, avec tes prix. Je ne peux pas t'aider. Dis à voix haute ce que tu cherches. »
2. **Ne rien montrer, ne rien expliquer.** Si l'artisan demande : « Fais comme tu penses. »
3. Blocage de plus de **3 minutes** : noter « aide donnée », l'écran et la question, puis donner **une seule** indication.
4. Noter les **mots exacts** de l'artisan quand il hésite ou se trompe.
5. Chronométrer du premier toucher à l'envoi du PDF.

## 4. Cartes de chantier

L'artisan met **ses** prix. Les mesures sont imposées pour pouvoir vérifier les quantités.

| Métier | Chantier |
|---|---|
| Peinture | Salon 5 m × 4 m, hauteur 2,80 m, une porte 0,90 × 2,10 m, une fenêtre 1,20 × 1,00 m. Murs et plafond, 2 couches. Main-d'œuvre, transport. |
| Carrelage | Chambre 4 m × 3,50 m, sol. Carreaux 60 × 60 en cartons de 4 carreaux. Colle, joint, plinthes. Pose au m². |
| Maçonnerie | Mur de clôture 20 m × 2 m en agglos de 15. Ciment, sable, fer pour le chaînage. Main-d'œuvre. |
| Plomberie | Salle de bains : WC, lavabo, douche. Arrivée d'eau en tube PPR, évacuation en PVC. Main-d'œuvre. |
| Électricité | Chambre : 1 plafonnier avec interrupteur, 3 prises, câble depuis le tableau, TVA 19,25 %. Main-d'œuvre. |

Tâche complète : client (nom, téléphone, quartier) → lignes → prix → **« Terminer le devis et créer le PDF à envoyer »** → **« Envoyer le PDF »** à l'observateur par WhatsApp.

## 5. Fiche d'observation (une par artisan)

Fichier tableur prêt : `FICHE-OBSERVATION.csv` (une ligne par artisan).

| Colonne | Ce qu'on note |
|---|---|
| artisan, métier, niveau | débutant / expérimenté |
| téléphone | marque, iPhone ou Android, taille d'écran |
| début, fin | heure exacte |
| terminé seul | oui / non ; si non : écran d'abandon |
| aides données | nombre ; écran et question pour chacune |
| blocages > 20 s | écran, ce qu'il cherchait, ses mots |
| erreurs d'unité | ex. prix d'un carton saisi « pour 1 m² » |
| erreurs de quantité ou de ligne | oubli, doublon, ligne retirée par erreur |
| montants | total PDF = total écran ? 2 lignes recalculées à la main (quantité × prix) |
| PDF reçu | s'ouvre sur WhatsApp ? lisible ? |
| mots non compris | tous |
| avis | « Tu l'utiliserais pour un vrai client ? Pourquoi ? » (ses mots) |

À la fin : Réglages → « Journal d'essai » → **Exporter (CSV)**, joint à la fiche.

## 6. Critères fixés avant l'essai

- **Réussite d'un artisan** : devis complet et PDF envoyé, sans aide, montants justes.
- **À corriger avant toute mise en production** :
  - un écran où **3 artisans ou plus** se bloquent ou demandent de l'aide ;
  - **une seule** différence de montant entre écran, PDF et Word ;
  - **une seule** erreur d'unité que l'écran n'a pas empêchée.
- Le temps est noté, il n'est pas un critère de réussite au premier essai.

## 7. Word

À faire une fois par Patrick : ouvrir un Word créé par l'application dans **Microsoft Word sur iPhone** et vérifier tableau, totaux, accents, page 2 (en-tête du tableau répété, aucune ligne coupée). Le test automatique a rendu le Word avec LibreOffice, pas avec Microsoft Word.
