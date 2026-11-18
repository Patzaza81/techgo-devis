// Désignations en clair (v41) : un sigle technique est expliqué en mots simples, le sigle reste entre parenthèses
// pour l'achat chez le fournisseur. On EXPLIQUE seulement le sigle (sens courant) : aucune caractéristique ajoutée.
// Les sigles déjà connus de tous (PVC, WC, LED, USB) sont laissés tels quels.
const R = [
  // plomberie
  [/\bPE-X\/Al\/PE-X\b/g, "PER-alu-PER (PE-X/Al/PE-X)"], [/\bPE-RT\/Al\/PE-RT\b/g, "polyéthylène-alu-polyéthylène pour eau chaude (PE-RT/Al/PE-RT)"],
  [/^Tube polypropylène PP-R$/, "Tube PPR (polypropylène, PP-R)"], [/^Tube PVC-U sous pression$/, "Tube PVC rigide sous pression (PVC-U)"],
  [/^Connecteurs PV$/, "Connecteurs pour panneaux solaires (PV)"], [/^Détecteur de tension HTA$/, "Détecteur de tension pour moyenne tension (HTA)"],
  [/\bTube PE-X\b/g, "Tube PER (polyéthylène réticulé, PE-X)"], [/\bPE-RT\b/g, "polyéthylène pour eau chaude (PE-RT)"],
  [/\bpolypropylène PP-R\b/g, "PPR (polypropylène, PP-R)"], [/\bPP-R\b/g, "PPR (PP-R)"],
  [/\bPVC-U sous pression\b/g, "PVC rigide sous pression (PVC-U)"], [/\bPVC-U\b/g, "PVC rigide (PVC-U)"], [/\bPVC-C\b/g, "PVC pour eau chaude (PVC-C)"],
  [/\bPE100\b/g, "polyéthylène PE100"], [/\bPE\b(?!-)/g, "polyéthylène (PE)"], [/\bPP\b(?!-)/g, "polypropylène (PP)"],
  [/\bTube PTFE\b/g, "Tube téflon (PTFE)"], [/\bRuban PTFE\b/g, "Ruban téflon (PTFE)"],
  [/\bECS\b/g, "eau chaude (ECS)"], [/^RIA pivotant$/, "Robinet d'incendie armé pivotant (RIA)"], [/^Essai de RIA$/, "Essai de robinet d'incendie armé (RIA)"],
  [/\bWC PMR\b/g, "WC pour personne à mobilité réduite (PMR)"], [/\bLavabo PMR\b/g, "Lavabo pour personne à mobilité réduite (PMR)"],
  [/\bPompe haute pression RO\b/g, "Pompe haute pression d'osmose inverse (RO)"], [/^Système UV$/, "Système de désinfection par ultraviolets (UV)"],
  [/^Tube PVDF$/, "Tube PVDF (plastique résistant aux produits chimiques)"], [/^Groupe FRL$/, "Groupe filtre-régulateur-lubrificateur d'air comprimé (FRL)"], [/^Appareil de soudage TIG$/, "Poste de soudage à l'arc TIG"],
  // électricité
  [/\bTGBT industriel\b/, "Tableau général basse tension industriel (TGBT)"], [/^Tableau général BT \(TGBT\)$/, "Tableau général basse tension (TGBT)"], [/\bParafoudre BT \(SPD\)/, "Parafoudre basse tension (SPD)"],
  [/\bTransformateur HTA\/BT\b/, "Transformateur moyenne / basse tension (HTA/BT)"], [/\bHTA\b(?!\))/g, "moyenne tension (HTA)"], [/\bHT\b(?!A)/g, "haute tension (HT)"], [/\bBT\b(?!\))/g, "basse tension (BT)"],
  [/\bParafoudre DC\/PV\b/, "Parafoudre courant continu pour panneaux solaires (DC/PV)"], [/\bCâble solaire PV\b/, "Câble pour panneaux solaires (PV)"], [/\bCoffret de protection PV\b/, "Coffret de protection des panneaux solaires (PV)"], [/\bPV\b/g, "photovoltaïque (PV)"],
  [/\b24 V DC\b/g, "24 V courant continu"], [/^Parafoudre AC$/, "Parafoudre courant alternatif (AC)"],
  [/^Rail DIN$/, "Rail DIN (fixation des modules du tableau)"], [/^Rails DIN$/, "Rails DIN (fixation des modules du tableau)"],
  [/^Onduleur UPS$/, "Onduleur (UPS)"], [/^UPS informatique$/, "Onduleur informatique (UPS)"],
  [/^Câble d'installation U-1000 R2V$/, "Câble rigide d'installation U-1000 R2V"], [/^Câble sans halogène LSZH$/, "Câble sans halogène (LSZH)"],
  [/^Gaine ICTA$/, "Gaine annelée à encastrer (ICTA)"], [/^Tube IRL$/, "Tube rigide pour pose apparente (IRL)"],
  [/^Système DALI$/, "Système de gestion de l'éclairage (DALI)"], [/^Éclairage de sécurité BAES$/, "Bloc autonome d'éclairage de sécurité (BAES)"],
  [/^Inverseur automatique ATS$/, "Inverseur automatique de source (ATS)"], [/^SFP \/ transceiver optique$/, "Module optique pour fibre (SFP)"], [/^PDU de baie$/, "Bloc multiprise de baie (PDU)"], [/^Prise RJ45$/, "Prise réseau informatique (RJ45)"],
  [/^Cybersécurité OT$/, "Cybersécurité des automatismes (OT)"], [/^Kit de consignation LOTO$/, "Kit de consignation : cadenas et étiquettes (LOTO)"],
  [/^Transformateur de courant TC$/, "Transformateur de courant (TC)"], [/^Transformateur de tension TP$/, "Transformateur de tension (TP)"], [/^Centre de commande moteurs MCC$/, "Armoire de commande des moteurs (MCC)"],
  [/^Automate programmable PLC$/, "Automate programmable (PLC)"], [/^CPU de rechange$/, "Unité centrale d'automate de rechange (CPU)"], [/^HMI \/ pupitre opérateur$/, "Pupitre opérateur à écran (HMI)"],
  [/^SCADA$/, "Supervision informatique de l'installation (SCADA)"], [/^DCS de procédé$/, "Système de contrôle du procédé (DCS)"], [/^Communicateur HART$/, "Communicateur de réglage des capteurs (HART)"],
  [/^Variateur avec STO$/, "Variateur avec arrêt de sécurité (STO)"], [/^Système de surveillance de CO$/, "Surveillance du monoxyde de carbone (CO)"],
  [/^Analyseur XRF$/, "Analyseur de composition par fluorescence X (XRF)"], [/^Analyseur XRD$/, "Analyseur par diffraction X (XRD)"], [/^Vérification des DDR$/, "Vérification des différentiels (DDR)"],
  [/^FAT$/, "Essais en usine avant livraison (FAT)"], [/^SAT$/, "Essais sur site avant mise en service (SAT)"], [/^Vérificateur d'absence de tension VAT$/, "Vérificateur d'absence de tension (VAT)"],
];
// La première règle qui s'applique décide (les règles précises sont avant les règles générales).
export function nomClair(nom) { const s = String(nom); for (const [re, v] of R) { re.lastIndex = 0; if (re.test(s)) { re.lastIndex = 0; return s.replace(re, v).replace(/\s+/g, " ").trim(); } } return s; }
