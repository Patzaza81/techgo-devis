#!/usr/bin/env python3
"""Contrôle indépendant du métré de TechGo Devis.

Second calcul, écrit séparément de metiers/metre.js : autre langage, arithmétique exacte (fractions,
aucun nombre flottant), formules reprises de METRE.md. Il produit :
  - cas.json       : les chantiers d'essai (données d'entrée), lus par test-metre.mjs ;
  - attendus.json  : les résultats de CE calcul ; test-metre.mjs vérifie que l'application donne les mêmes ;
  - ../VALIDATION.md : les cas écrits en clair, avec les calculs intermédiaires, pour relecture par un professionnel.
Toutes les valeurs (couvertures, dosages, rendements, pertes) sont des DONNÉES D'ESSAI, pas des références.
Usage : python3 validation/controle.py
"""
import json, math, os
from fractions import Fraction as F

D = lambda x: F(str(x))
def sup(x): return math.ceil(x)
def demi(x): return F(math.ceil(2 * x), 2)
def dec(x): return F(math.floor(x * 100 + F(1, 2)), 100)
def fr(x, d=2):
    q = F(math.floor(abs(x) * 10**d + F(1, 2)), 10**d); s = f"{float(q):.{d}f}".rstrip("0").rstrip(".")
    e, _, f_ = s.partition("."); e = f"{int(e):,}".replace(",", " ")
    return ("-" if x < 0 else "") + e + ("," + f_ if f_ else "")
k = lambda p: 1 + D(p or 0) / 100

# ---------------- Chantiers d'essai ----------------
MO_P = {"moMode": "ouvrier", "moRend": 35, "moOuv": 2}
PROD = [{"nom": "Sous-couche", "couches": 1, "couv": 60, "u": "Seau"}, {"nom": "Peinture acrylique", "couches": 2, "couv": 48, "u": "Seau"}]
GRES = {"carreau": "Grès 60×60", "vente": "Carton", "cA": 60, "cB": 60, "parCarton": 4, "perte": 10, "colle": 4.5, "colleSac": 25, "jointC": 0.4, "jointSac": 5}
MO_C = {"moMode": "equipe", "moRend": 18, "moOuv": 2}
PORTAIL = [{"n": 1, "l": 3.5, "h": 2.0}, {"n": 1, "l": 1.0, "h": 2.0}]
PPR = {"tuyau": "Tube PPR Ø20", "perte": 5, "vente": "Barre", "barre": 4, "colEsp": 60, "moMode": "tache"}
CAS = {
 "peinture": {"titre": "Appartement : salon, chambre et trois portes", "zones": [
   {"nom": "Salon", "ouvrages": [{"type": "p_piece", "v": {"longueur": 5.2, "largeur": 3.8, "hauteur": 2.7, "ouv": [{"n": 1, "l": 0.9, "h": 2.1}, {"n": 2, "l": 1.4, "h": 1.2}], "plafond": True, "prod": PROD, "perte": 8, **MO_P}}]},
   {"nom": "Chambre", "ouvrages": [{"type": "p_piece", "v": {"longueur": 3.6, "largeur": 3.2, "hauteur": 2.7, "ouv": [{"n": 1, "l": 0.8, "h": 2.1}, {"n": 1, "l": 1.2, "h": 1.2}], "plafond": True, "prod": PROD, "perte": 8, **MO_P}}]},
   {"nom": "Portes", "ouvrages": [{"type": "p_surface", "v": {"longueur": 0.8, "hauteur": 2.1, "nombre": 3, "faces": 2, "prod": [{"nom": "Laque", "couches": 2, "couv": 12, "u": "Pot"}], "perte": 5, "moMode": "tache", "moNom": "Peinture des portes"}}]}]},
 "carrelage": {"titre": "Maison : séjour, cuisine et douche", "zones": [
   {"nom": "Séjour", "ouvrages": [{"type": "c_sol", "v": {"longueur": 6.4, "largeur": 4.25, **GRES, "plinthes": True, "portes": 1.8, "plinthe": 60, "perteP": 5, **MO_C}}]},
   {"nom": "Cuisine", "ouvrages": [{"type": "c_sol", "v": {"longueur": 3.5, "largeur": 2.8, "deduire": 1.2, **GRES, **MO_C}}]},
   {"nom": "Douche", "ouvrages": [{"type": "c_mur", "v": {"longueur": 5.6, "hauteur": 2.1, "ouv": [{"n": 1, "l": 0.7, "h": 2.0}], "carreau": "Faïence 25×40", "vente": "Carton", "cA": 25, "cB": 40, "parCarton": 15, "perte": 12, "colle": 3.5, "colleSac": 25, "jointC": 0.3, "jointSac": 5, "moMode": "tache"}}]}]},
 "maconnerie": {"titre": "Clôture de 24 m avec 9 poteaux, dallage et enduit", "zones": [
   {"nom": "Clôture", "ouvrages": [
     {"type": "m_fouille", "v": {"nombre": 9, "longueur": 0.6, "largeur": 0.6, "profondeur": 0.5, "moMode": "tache"}},
     {"type": "m_mur", "v": {"longueur": 24, "hauteur": 2.2, "ouv": PORTAIL, "blocNom": "Parpaing de 15", "blocL": 40, "blocH": 20, "blocE": 15, "joint": 1.5, "perte": 5, "mortier": True, "ciment": 350, "sac": 50, "sable": 1, "perteM": 20, "moMode": "ouvrier", "moRend": 12, "moOuv": 3}},
     {"type": "m_beton", "v": {"nom": "Poteaux", "nombre": 9, "longueur": 2.2, "largeur": 20, "epaisseur": 20, "perte": 5, "ciment": 350, "sac": 50, "sable": 0.4, "gravier": 0.8, "moMode": "tache"}},
     {"type": "m_acier", "v": {"nom": "Armatures des poteaux", "nombre": 9, "longueur": 2.2, "barre": 12, "filNom": "Fer de 12", "filN": 4, "filRec": 0.6, "cadNom": "Fer de 6", "cadEsp": 15, "cadDev": 68}},
     {"type": "m_enduit", "v": {"longueur": 24, "hauteur": 2.2, "faces": 2, "ouv": PORTAIL, "epaisseur": 1.5, "perte": 15, "ciment": 300, "sac": 50, "sable": 1, "moMode": "ouvrier", "moRend": 30, "moOuv": 3}}]},
   {"nom": "Cour", "ouvrages": [{"type": "m_chape", "v": {"longueur": 8, "largeur": 5, "epaisseur": 8, "perte": 5, "ciment": 300, "sac": 50, "sable": 0.5, "gravier": 0.8, "moMode": "equipe", "moRend": 40, "moOuv": 4}}]}]},
 "plomberie": {"titre": "Salle de bain et cuisine", "zones": [
   {"nom": "Salle de bain", "ouvrages": [
     {"type": "pl_reseau", "v": {"tuyau": "Tube PVC Ø100", "longueur": 6.5, "perte": 10, "vente": "Barre", "barre": 4, "art": [{"nom": "Coude Ø100", "n": 3}, {"nom": "Té Ø100", "n": 1}], "colEsp": 80, "moMode": "tache"}},
     {"type": "pl_reseau", "v": {**PPR, "longueur": 14, "art": [{"nom": "Coude Ø20", "n": 8}, {"nom": "Té Ø20", "n": 3}, {"nom": "Vanne d'arrêt Ø20", "n": 2}]}},
     {"type": "pl_appareils", "v": {"art": [{"nom": "WC", "n": 1}, {"nom": "Lavabo", "n": 1}, {"nom": "Douche", "n": 1}], "acc": [{"nom": "Flexible", "n": 3}, {"nom": "Robinet d'arrêt", "n": 3}, {"nom": "Siphon", "n": 2}], "moMode": "tache"}}]},
   {"nom": "Cuisine", "ouvrages": [
     {"type": "pl_reseau", "v": {**PPR, "longueur": 9, "art": [{"nom": "Coude Ø20", "n": 4}, {"nom": "Té Ø20", "n": 1}]}},
     {"type": "pl_reseau", "v": {"tuyau": "Tube PVC Ø50", "longueur": 4.2, "perte": 10, "vente": "Mètre", "art": [{"nom": "Coude Ø50", "n": 2}], "moMode": "tache"}},
     {"type": "pl_appareils", "v": {"art": [{"nom": "Évier", "n": 1}], "acc": [{"nom": "Flexible", "n": 2}, {"nom": "Siphon", "n": 1}], "moMode": "tache"}}]}]},
 "electricite": {"titre": "Logement : séjour, chambre et tableau", "zones": [
   {"nom": "Séjour", "ouvrages": [
     {"type": "e_points", "v": {"art": [{"nom": "Prise 2P+T", "n": 6}, {"nom": "Interrupteur simple", "n": 2}, {"nom": "Point lumineux", "n": 2}], "boites": True, "moMode": "tache"}},
     {"type": "e_ligne", "v": {"cable": "Câble 3G2,5", "nombre": 2, "longueur": 14, "reserve": 0.25, "racc": 5, "perte": 10, "rouleau": 100, "conduit": "Gaine Ø20", "rouleauC": 50, "moMode": "equipe", "moRend": 60, "moOuv": 2}}]},
   {"nom": "Chambre", "ouvrages": [
     {"type": "e_points", "v": {"art": [{"nom": "Prise 2P+T", "n": 4}, {"nom": "Interrupteur simple", "n": 1}, {"nom": "Point lumineux", "n": 1}], "boites": True, "moMode": "tache"}},
     {"type": "e_ligne", "v": {"cable": "Câble 3G2,5", "longueur": 11, "reserve": 0.25, "racc": 6, "perte": 10, "rouleau": 100, "conduit": "Gaine Ø20", "rouleauC": 50, "moMode": "equipe", "moRend": 60, "moOuv": 2}},
     {"type": "e_ligne", "v": {"cable": "Fil 1,5 mm²", "longueur": 9, "fils": 3, "reserve": 0.25, "racc": 4, "perte": 10, "rouleau": 100, "conduit": "Gaine Ø16", "rouleauC": 50, "moMode": "equipe", "moRend": 60, "moOuv": 2}}]},
   {"nom": "Tableau", "ouvrages": [{"type": "e_tableau", "v": {"art": [{"nom": "Coffret 13 modules", "n": 1}, {"nom": "Disjoncteur", "n": 6}, {"nom": "Interrupteur différentiel", "n": 2}], "moMode": "tache"}}]}]},
}

# ---------------- Second calcul ----------------
class Devis:
    def __init__(s): s.b = {}; s.notes = []
    def add(s, nom, unite, arr, brut, mult=0):
        g = s.b.setdefault((nom, unite), {"arr": arr, "brut": F(0), "mult": mult, "parts": []}); g["brut"] += brut; g["parts"].append(brut)
    def note(s, t): s.notes.append(t)
    def lignes(s):
        out = {}
        for (nom, unite), g in s.b.items():
            base = sup(g["brut"]) if g["arr"] == "sup" else demi(g["brut"]) if g["arr"] == "demi" else dec(g["brut"])
            q = base * g["mult"] if g["mult"] else base
            if q > 0: out[f"{nom} [{unite}]"] = float(q)
        return out

def ouv(v): return sum(D(o.get("n", 1)) * D(o["l"]) * D(o["h"]) for o in v.get("ouv", []))
def mo(d, v, Q, unite, nom):
    m = v.get("moMode"); nom = v.get("moNom", nom)
    if not m: return
    if m == "tache": d.add(nom, unite, "dec", Q); d.note(f"Main-d'œuvre à la tâche « {nom} » : {fr(Q)} {unite}"); return
    j = Q / D(v["moRend"]); n = v["moOuv"]
    d.note(f"Main-d'œuvre « {nom} » : {fr(Q)} {unite} ÷ {fr(D(v['moRend']))} par jour pour l'équipe = {fr(j, 3)} jour(s) de chantier")
    if m == "ouvrier": d.add(f"{nom} — {n} ouvrier{'s' if n > 1 else ''}", "journée d'ouvrier", "demi", j, n)
    else: d.add(f"{nom} — équipe de {n}", "journée d'équipe", "demi", j)
def melange(d, V, v, gravier):
    d.add("Ciment", "Sac", "sup", V * D(v["ciment"]) / D(v["sac"])); d.add("Sable", "m³", "dec", V * D(v["sable"]))
    if gravier and v.get("gravier"): d.add("Gravier", "m³", "dec", V * D(v["gravier"]))
    d.note(f"  ciment : {fr(V, 3)} × {v['ciment']} = {fr(V * D(v['ciment']))} kg = {fr(V * D(v['ciment']) / D(v['sac']))} sac(s) ; sable : {fr(V * D(v['sable']), 3)} m³" + (f" ; gravier : {fr(V * D(v['gravier']), 3)} m³" if gravier and v.get("gravier") else ""))
def peinture(d, v, S):
    for p in v["prod"]:
        q = S * p["couches"] * k(v.get("perte")) / D(p["couv"]); d.add(p["nom"], p["u"], "sup", q)
        d.note(f"  {p['nom']} : {fr(S)} × {p['couches']} × {fr(k(v.get('perte')))} ÷ {p['couv']} = {fr(q)} {p['u'].lower()}(s)")
    mo(d, v, S, "m²", "Travaux de peinture")
def carreaux(d, v, S):
    carton = D(v["cA"]) / 100 * D(v["cB"]) / 100 * v["parCarton"]; q = S * k(v.get("perte")) / carton
    d.add(v["carreau"], "Carton", "sup", q); d.note(f"  {v['carreau']} : {fr(S)} × {fr(k(v.get('perte')))} ÷ {fr(carton, 3)} m² par carton = {fr(q)} carton(s)")
    d.add("Colle à carrelage", "Sac", "sup", S * D(v["colle"]) / D(v["colleSac"])); d.add("Joint de carrelage", "Sac", "sup", S * D(v["jointC"]) / D(v["jointSac"]))
    d.note(f"  colle : {fr(S)} × {v['colle']} = {fr(S * D(v['colle']))} kg = {fr(S * D(v['colle']) / D(v['colleSac']))} sac(s) ; joint : {fr(S * D(v['jointC']))} kg = {fr(S * D(v['jointC']) / D(v['jointSac']))} sac(s)")
def decoupe(pieces, lg, barre): return math.ceil(F(pieces, math.floor(barre / lg)))

def ouvrage(d, t, v):
    L = D(v.get("longueur", 0)); nb = v.get("nombre", 1)
    if t == "p_piece":
        la, h = D(v["largeur"]), D(v["hauteur"]); murs = 2 * (L + la) * h - ouv(v); S = murs + (L * la if v.get("plafond") else 0)
        d.note(f"Pièce : murs 2 × ({fr(L)} + {fr(la)}) × {fr(h)} − {fr(ouv(v))} = {fr(murs)} m² ; plafond {fr(L * la)} m² ; à peindre {fr(S)} m²"); peinture(d, v, S)
    elif t == "p_surface":
        S = (L * D(v["hauteur"]) - ouv(v)) * nb * v.get("faces", 1); d.note(f"Surfaces : {nb} × {fr(L)} × {fr(D(v['hauteur']))} × {v.get('faces', 1)} face(s) = {fr(S)} m²"); peinture(d, v, S)
    elif t == "c_sol":
        la = D(v["largeur"]); S = L * la - D(v.get("deduire", 0)); d.note(f"Sol : {fr(L)} × {fr(la)} − {fr(D(v.get('deduire', 0)))} = {fr(S)} m²"); carreaux(d, v, S)
        if v.get("plinthes"):
            ml = 2 * (L + la) - D(v.get("portes", 0)); q = ml * k(v.get("perteP")) / (D(v["plinthe"]) / 100); d.add("Plinthes", "Pièce", "sup", q)
            d.note(f"  plinthes : 2 × ({fr(L)} + {fr(la)}) − {fr(D(v.get('portes', 0)))} = {fr(ml)} ml × {fr(k(v.get('perteP')))} ÷ {fr(D(v['plinthe']) / 100)} = {fr(q)} pièce(s)")
        mo(d, v, S, "m²", "Pose de carrelage")
    elif t == "c_mur":
        S = L * D(v["hauteur"]) - ouv(v); d.note(f"Mur : {fr(L)} × {fr(D(v['hauteur']))} − {fr(ouv(v))} = {fr(S)} m²"); carreaux(d, v, S); mo(d, v, S, "m²", "Pose de faïence")
    elif t == "m_fouille":
        V = nb * L * D(v["largeur"]) * D(v["profondeur"]); d.note(f"Fouilles : {nb} × {fr(L)} × {fr(D(v['largeur']))} × {fr(D(v['profondeur']))} = {fr(V)} m³ en place"); mo(d, v, V, "m³", "Fouilles")
    elif t == "m_mur":
        S = L * D(v["hauteur"]) - ouv(v); bl, bh, be, j = (D(v[x]) for x in ("blocL", "blocH", "blocE", "joint"))
        par = 1 / ((bl + j) / 100 * (bh + j) / 100); q = S * par * k(v.get("perte")); d.add(v["blocNom"], "Pièce", "sup", q)
        d.note(f"Mur : {fr(L)} × {fr(D(v['hauteur']))} − {fr(ouv(v))} = {fr(S)} m² ; {fr(par, 3)} blocs par m² ; {fr(q)} blocs avec la casse")
        part = 1 - bl * bh / ((bl + j) * (bh + j)); V = S * be / 100 * part * k(v.get("perteM"))
        d.note(f"  mortier des joints (estimation géométrique) : {fr(S)} × {fr(be / 100)} × {fr(part * 100, 2)} % × {fr(k(v.get('perteM')))} = {fr(V, 3)} m³"); melange(d, V, v, False); mo(d, v, S, "m²", "Élévation de mur")
    elif t == "m_beton":
        Vn = nb * L * D(v["largeur"]) / 100 * D(v["epaisseur"]) / 100; V = Vn * k(v.get("perte")); d.note(f"Béton « {v['nom']} » : {nb} × {fr(L)} × {fr(D(v['largeur']) / 100)} × {fr(D(v['epaisseur']) / 100)} = {fr(Vn, 3)} m³ ; avec pertes {fr(V, 3)} m³"); melange(d, V, v, True); mo(d, v, Vn, "m³", "Coulage de béton")
    elif t == "m_chape":
        S = nb * L * D(v["largeur"]); V = S * D(v["epaisseur"]) / 100 * k(v.get("perte")); d.note(f"Chape : {fr(S)} m² × {fr(D(v['epaisseur']) / 100)} m × {fr(k(v.get('perte')))} = {fr(V, 3)} m³"); melange(d, V, v, True); mo(d, v, S, "m²", "Réalisation de chape")
    elif t == "m_enduit":
        S = (L * D(v["hauteur"]) - ouv(v)) * v.get("faces", 1); V = S * D(v["epaisseur"]) / 100 * k(v.get("perte")); d.note(f"Enduit : {fr(S)} m² × {fr(D(v['epaisseur']) / 100, 3)} m × {fr(k(v.get('perte')))} = {fr(V, 3)} m³ (estimation)"); melange(d, V, v, False); mo(d, v, S, "m²", "Enduit")
    elif t == "m_acier":
        barre = D(v["barre"]); lg = L + D(v.get("filRec", 0)); pieces = nb * v["filN"]; b1 = decoupe(pieces, lg, barre); d.add(v["filNom"], "Barre", "sup", F(b1))
        cad = nb * (math.ceil(L / (D(v["cadEsp"]) / 100)) + 1); dev = D(v["cadDev"]) / 100; b2 = decoupe(cad, dev, barre); d.add(v["cadNom"], "Barre", "sup", F(b2))
        d.note(f"Armatures : {pieces} filants de {fr(lg)} m, {math.floor(barre / lg)} par barre → {b1} barres ; {cad} cadres de {fr(dev)} m, {math.floor(barre / dev)} par barre → {b2} barres")
    elif t == "pl_reseau":
        Lp = L * k(v.get("perte"))
        if v["vente"] == "Mètre": d.add(v["tuyau"], "Mètre", "sup", Lp)
        else: d.add(v["tuyau"], v["vente"], "sup", Lp / D(v["barre"]))
        d.note(f"Réseau {v['tuyau']} : {fr(L)} × {fr(k(v.get('perte')))} = {fr(Lp)} ml" + ("" if v["vente"] == "Mètre" else f" ÷ {v['barre']} = {fr(Lp / D(v['barre']))} barre(s)"))
        for a in v.get("art", []): d.add(a["nom"], "Pièce", "sup", F(a["n"]))
        if v.get("colEsp"): n = math.ceil(L / (D(v["colEsp"]) / 100)) + 1; d.add(f"Colliers pour {v['tuyau']}", "Pièce", "sup", F(n)); d.note(f"  colliers : {fr(L)} ÷ {fr(D(v['colEsp']) / 100)} → {n - 1} intervalles + 1 = {n}")
        mo(d, v, L, "ml", "Pose de tuyauterie")
    elif t in ("pl_appareils", "e_points", "e_tableau"):
        pts = sum(a["n"] for a in v["art"])
        for a in v["art"] + v.get("acc", []): d.add(a["nom"], "Pièce", "sup", F(a["n"]))
        if v.get("boites"): d.add("Boîte d'encastrement", "Pièce", "sup", F(pts))
        d.note(f"Comptage : {pts} " + ("article(s) de tableau" if t == "e_tableau" else "point(s)"))
        if t == "e_tableau": mo(d, v, F(1), "forfait", "Câblage du tableau")
        else: mo(d, v, F(pts), "point", "Pose des appareils" if t == "pl_appareils" else "Pose des points électriques")
    elif t == "e_ligne":
        res = D(v.get("reserve", 0)) * v.get("racc", 0); Lc = nb * (L + res) * v.get("fils", 1) * k(v.get("perte")); d.add(v["cable"], "Rouleau", "sup", Lc / D(v["rouleau"]))
        Lg = nb * L * k(v.get("perte")); d.add(v["conduit"], "Rouleau", "sup", Lg / D(v["rouleauC"]))
        d.note(f"Ligne {v['cable']} : {nb} × ({fr(L)} + {fr(res)}) × {v.get('fils', 1)} fil(s) × {fr(k(v.get('perte')))} = {fr(Lc)} ml ; conduit {v['conduit']} : {fr(Lg)} ml"); mo(d, v, nb * L, "ml", "Tirage de câble")
    else: raise SystemExit("type inconnu " + t)

NOMS = {"peinture": "Peinture", "carrelage": "Carrelage", "maconnerie": "Maçonnerie", "plomberie": "Plomberie", "electricite": "Électricité"}
ici = os.path.dirname(os.path.abspath(__file__)); attendus = {}; md = ["# Cas de chantier pour la validation du métré", "",
  "Produit par `validation/controle.py` : un **second calcul indépendant** (Python, fractions exactes) du même chantier que l'application.",
  "`test-metre.mjs` vérifie que l'application donne exactement les mêmes quantités. Toutes les valeurs d'entrée (couvertures, dosages, rendements, pertes) sont des **données d'essai**, pas des références.", "",
  "Limite de ce contrôle : il vérifie que les calculs sont justes par rapport aux formules de `METRE.md`. Il ne dit pas si ces formules et ces conventions sont celles du métier : c'est l'objet des « points à faire valider » à la fin.", ""]
for met, c in CAS.items():
    d = Devis(); md += [f"## {NOMS[met]} — {c['titre']}", ""]
    for z in c["zones"]:
        md.append(f"**{z['nom']}**"); md.append("")
        for o in z["ouvrages"]:
            n0 = len(d.notes); ouvrage(d, o["type"], o["v"])
            ent = ", ".join(f"{a} = {json.dumps(b, ensure_ascii=False)}" for a, b in o["v"].items() if not isinstance(b, (list, dict)))
            md.append(f"- Données ({o['type']}) : {ent}"); md += [f"  - {t.strip()}" for t in d.notes[n0:]]
        md.append("")
    attendus[met] = d.lignes(); md += ["**Quantités attendues dans le devis (après cumul des zones et arrondi)**", "", "| Ligne | Quantité |", "|---|---|"] + [f"| {a} | {fr(F(str(b)))} |" for a, b in attendus[met].items()] + [""]
md += open(os.path.join(ici, "points-a-valider.md"), encoding="utf-8").read().splitlines()
json.dump(CAS, open(os.path.join(ici, "cas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(attendus, open(os.path.join(ici, "attendus.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
open(os.path.join(ici, "..", "VALIDATION.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
print({m: len(a) for m, a in attendus.items()})
