#!/usr/bin/env python3
"""Synthèse d'une campagne audit-ergo.cjs : python3 outils/rapport-ergo.py /tmp/audit-avant [/tmp/audit-apres]
Affiche les mesures par métier / niveau / largeur, les critères d'acceptation et les problèmes récurrents classés.
Rappel : ce sont des utilisateurs SIMULÉS ; le temps est un temps modélisé, pas un chronomètre humain."""
import json, sys, collections, statistics, re

POIDS = {"bloquant": 4, "majeur": 2, "mineur": 1, "info": 0}
NOMS = {"peinture": "Peinture", "carrelage": "Carrelage", "maconnerie": "Maçonnerie", "plomberie": "Plomberie", "electricite": "Électricité"}


def charge(d):
    return [json.loads(l) for l in open(d.rstrip("/") + "/parcours.jsonl")]


def pct(a, b):
    return 0.0 if not b else 100.0 * a / b


def med(x):
    return statistics.median(x) if x else 0


def p90(x):
    x = sorted(x)
    return x[min(len(x) - 1, int(0.9 * len(x)))] if x else 0


def mesures(L):
    n = len(L)
    ok = [j for j in L if j.get("reussi")]
    ab = [j for j in L if not j.get("reussi")]
    t = [j.get("tempsModele", 0) / 60 for j in ok]
    graves = sum(1 for j in L for i in j["incidents"] if i["grav"] in ("bloquant", "majeur"))
    app = sum(1 for j in L for i in j["incidents"] if i["cat"] in ("erreur_app", "debordement") or (i["cat"] == "exception_simulateur"))
    return {
        "n": n, "reussite": pct(len(ok), n), "abandon": pct(len(ab), n),
        "t_med": med(t), "t_p90": p90(t), "graves_par_parcours": graves / n if n else 0,
        "morts_par_parcours": sum(j.get("mort", 0) for j in L) / n if n else 0,
        "erreurs_app": app, "defil_pdf": med([j.get("defilPDF", 0) for j in L if "defilPDF" in j]),
        "corrections": sum(j.get("corrections", 0) for j in L), "erreurs_vues": sum(j.get("erreursVues", 0) for j in L),
    }


def ligne(nom, m):
    return f"| {nom} | {m['n']} | {m['reussite']:.0f} % | {m['abandon']:.0f} % | {m['t_med']:.1f} | {m['t_p90']:.1f} | {m['graves_par_parcours']:.2f} | {m['morts_par_parcours']:.2f} |"


ENTETE = "| | Parcours | Réussite sans aide | Abandon / échec | Temps médian (min, modélisé) | P90 | Problèmes graves par parcours | Clics sans effet par parcours |\n|---|---|---|---|---|---|---|---|"


def norm(msg):
    m = re.sub(r"«[^»]*»", "« … »", msg)
    m = re.sub(r"\d+([,.]\d+)?", "N", m)
    return m[:110]


def problemes(L, top=25):
    par = collections.defaultdict(lambda: {"j": set(), "grav": "info", "ex": "", "cat": ""})
    for j in L:
        for i in j["incidents"]:
            k = (i["cat"], norm(i["msg"]) if i["cat"] in ("saisie_mal_lue", "mot_technique", "libelle_tronque", "masque", "champ_introuvable") else i["cat"])
            e = par[k]
            e["j"].add(j["id"]); e["cat"] = i["cat"]; e["ex"] = e["ex"] or i["msg"]
            if POIDS[i["grav"]] > POIDS[e["grav"]]:
                e["grav"] = i["grav"]
    out = sorted(par.items(), key=lambda kv: (-POIDS[kv[1]["grav"]] * len(kv[1]["j"]), kv[0]))
    return [(k, v, pct(len(v["j"]), len(L))) for k, v in out if v["grav"] != "info"][:top]


def criteres(m, debutants, par_metier, par_largeur):
    c = []
    c.append(("Réussite sans aide, tous profils ≥ 90 %", m["reussite"], m["reussite"] >= 90))
    c.append(("Réussite sans aide, débutants complets ≥ 80 %", debutants["reussite"], debutants["reussite"] >= 80))
    c.append(("Abandon / échec ≤ 5 % (≤ 10 % débutants complets)", m["abandon"], m["abandon"] <= 5 and debutants["abandon"] <= 10))
    c.append(("Temps modélisé : médiane ≤ 8 min et P90 ≤ 15 min", m["t_med"], m["t_med"] <= 8 and m["t_p90"] <= 15))
    c.append(("Chaque métier ≥ 85 % et chaque largeur ≥ 85 %", min([x["reussite"] for x in list(par_metier.values()) + list(par_largeur.values())] or [0]), all(x["reussite"] >= 85 for x in list(par_metier.values()) + list(par_largeur.values()))))
    c.append(("Erreurs de l'application (JS, NaN, débordement) = 0", m["erreurs_app"], m["erreurs_app"] == 0))
    c.append(("Clics sans effet ≤ 1 par parcours", m["morts_par_parcours"], m["morts_par_parcours"] <= 1))
    c.append(("Problèmes graves ≤ 1 par parcours", m["graves_par_parcours"], m["graves_par_parcours"] <= 1))
    c.append(("Bouton PDF atteint en ≤ 3 écrans de défilement (médiane)", m["defil_pdf"], m["defil_pdf"] <= 3))
    return c


def rapport(d):
    L = charge(d)
    m = mesures(L)
    deb = mesures([j for j in L if j["info"] == 1])
    pm = {k: mesures([j for j in L if j["metier"] == k]) for k in NOMS if any(j["metier"] == k for j in L)}
    pl = {k: mesures([j for j in L if j["largeur"] == k]) for k in sorted({j["largeur"] for j in L})}
    pi = {k: mesures([j for j in L if j["info"] == k]) for k in sorted({j["info"] for j in L})}
    print(f"\n## Campagne : {d} — {len(L)} parcours simulés\n")
    print("### Global\n" + ENTETE + "\n" + ligne("Tous", m) + "\n" + ligne("Débutants complets (niveau 1)", deb))
    print("\n### Par métier\n" + ENTETE)
    for k, v in pm.items():
        print(ligne(NOMS[k], v))
    print("\n### Par niveau informatique (1 = débutant complet … 4 = très à l'aise)\n" + ENTETE)
    for k, v in pi.items():
        print(ligne(f"Niveau {k}", v))
    print("\n### Par largeur d'écran\n" + ENTETE)
    for k, v in pl.items():
        print(ligne(f"{k} px", v))
    print("\n### Causes d'échec / abandon")
    for k, v in collections.Counter((j.get("abandon") or "?").split("(")[0].strip() for j in L if not j.get("reussi")).most_common(8):
        print(f"- {v} × {k}")
    print("\n### Critères d'acceptation (mesurés sur utilisateurs SIMULÉS uniquement)")
    ok = 0
    for nom, val, bon in criteres(m, deb, pm, pl):
        ok += bon
        print(f"- {'✔' if bon else '✘'} {nom} → {val:.1f}")
    print(f"\n{ok}/9 critères atteints.")
    print("\n### Problèmes récurrents (gravité × fréquence)")
    print("| Gravité | % de parcours touchés | Catégorie | Exemple |\n|---|---|---|---|")
    for (k, v, p) in problemes(L):
        print(f"| {v['grav']} | {p:.0f} % | {v['cat']} | {v['ex'][:120]} |")
    return L, m


if __name__ == "__main__":
    for d in sys.argv[1:]:
        rapport(d)
