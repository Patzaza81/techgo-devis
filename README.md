# TechGo Devis
Application web de devis multi-métiers (PWA, hors ligne, données locales).
- `index.html` + modules JS : version modulaire (nécessite un serveur HTTP).
- `metiers/` : un module par métier (peinture et enduits, carrelage, maçonnerie, plomberie, électricité). Ajouter un métier = ajouter un fichier.
- `TechGo-Devis-v2.html` : version autonome en un seul fichier.
- Tests : `node test.mjs` et `node test-store.mjs`.

- `ROADMAP.md` : état par rapport au document stratégique. `DECISIONS.md` : journal des décisions.
- Tests : `node test.mjs`, `node test-store.mjs`, `node test-csv.mjs`, `node test-docx.mjs /tmp/ref.docx`.
