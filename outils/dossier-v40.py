# Construit audit-v40/SCENARIOS.md à partir des résultats Playwright (une ligne JSON par scénario).
# Usage : python3 outils/dossier-v40.py RESULTATS_DIR [AVANT_DIR] > audit-v40/SCENARIOS.md
import json, sys, os, collections

base = sys.argv[1]
avant = sys.argv[2] if len(sys.argv) > 2 else None
def charge(d):
    return [json.loads(l) for l in open(os.path.join(d, "resultats.jsonl"))]
larg = {L: charge(os.path.join(base, f"l{L}")) for L in (360, 390, 414) if os.path.exists(os.path.join(base, f"l{L}"))}
av = {j["id"]: j for j in charge(avant)} if avant else {}

NON_TESTE = [
    ("Tous", "Test avec de vrais artisans (débutants et expérimentés)", "Impossible depuis cet environnement : protocole prêt dans TEST-UTILISATEURS.md"),
    ("Tous", "Vrai iPhone et vrai Android (clavier, virgule selon la langue, partage)", "Seul Chromium émulé (360, 390, 414 px) a été utilisé"),
    ("Tous", "Envoi réel par WhatsApp ou par e-mail", "Le bouton ouvre WhatsApp ; l'envoi lui-même n'est pas automatisable ici"),
    ("Tous", "Impression papier", "Le bouton « Imprimer » n'a pas été testé"),
    ("Tous", "Ajout d'un logo (fichier image)", "Non joué dans les scénarios"),
    ("Tous", "Activation d'une licence et fin d'essai gratuit", "Couvert par test-licence.mjs (34 vérifications), pas par un parcours navigateur"),
    ("Tous", "Écrans Clients, Produits (gestion du catalogue), Suivi, Réglages en détail", "Seuls leurs effets dans un devis ont été vérifiés"),
    ("Maçonnerie", "Armatures d'après le plan", "Couvert par parcours-metre.cjs ; demande la lecture d'un plan"),
    ("Plomberie / Électricité", "Dimensionnement (sections, diamètres)", "Hors champ : l'application ne dimensionne pas, c'est au professionnel"),
    ("Tous", "Perte de connexion pendant la création d'un PDF", "Seule la réouverture hors connexion a été testée"),
]

out = ["# Scénarios exécutés — audit v40\n"]
out.append("Joués dans Chromium piloté par Playwright, uniquement par l'interface visible (touchers, saisies, défilement, téléchargements). Aucune fonction interne appelée. **Ce sont des tests automatisés, pas des tests humains.**\n")
tot = collections.Counter()
for L, R in larg.items():
    for j in R: tot[(L, j["statut"])] += 1
out.append("| Largeur | Réussis | Échoués |\n|---|---|---|")
for L in larg: out.append(f"| {L} px | {tot[(L, 'RÉUSSI')]} | {tot[(L, 'ÉCHOUÉ')]} |")
if av:
    n_av = sum(1 for j in av.values() if j["statut"] == "RÉUSSI")
    out.append(f"\nMêmes scénarios rejoués sur la version d'avant (v39, commit 0b9915b), à 360 px : **{n_av} réussis sur {len(av)}**. Les échecs d'avant sont détaillés plus bas.\n")
out.append("\n## Détail par scénario (360 px ; statut aux trois largeurs)\n")
ref = larg.get(360) or next(iter(larg.values()))
for j in ref:
    st = " / ".join(f"{L} : {next((x['statut'] for x in R if x['id'] == j['id']), '—')}" for L, R in larg.items())
    out.append(f"### {j['id']} — {j['titre']}\nMétier : {j['metier']} · {st} · {j.get('gestes', 0)} gestes comptés · {j.get('duree', '?')} s machine\n")
    for c in j["constats"]:
        mark = "✔" if c["ok"] is True else "✘" if c["ok"] is False else "•"
        d = (" — " + c["detail"].replace("\n", " ")[:220]) if c.get("detail") and c["ok"] is not True else ""
        out.append(f"- {mark} {c['quoi']}{d}")
    if j["id"] in av and av[j["id"]]["statut"] != "RÉUSSI":
        ech = [c for c in av[j["id"]]["constats"] if c["ok"] is False]
        out.append(f"- *Version d'avant (v39) : ÉCHOUÉ* — " + " ; ".join((c["quoi"] + (" (" + c["detail"].replace("\n", " ")[:120] + ")" if c.get("detail") else "")) for c in ech[:4]))
    if j.get("preuves"):
        out.append(f"- Preuves : {', '.join(j['preuves'][:8])}")
    out.append("")
out.append("## NON TESTÉ\n")
out.append("| Métier | Fonction | Raison |\n|---|---|---|")
for m, f, r in NON_TESTE: out.append(f"| {m} | {f} | {r} |")
print("\n".join(out))
