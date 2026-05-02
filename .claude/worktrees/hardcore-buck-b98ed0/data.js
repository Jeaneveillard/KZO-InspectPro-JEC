const inspectionData = {
    brand: "KZO InspectPro",
    id: "KZO-" + Date.now().toString().slice(-5),
    clientInfo: {},
    sectionPhotos: {},
    comments: {},
    sectionComments: {},
    sections: [
        { id: "s_cover", title: "Photo Principale", key: "cover", icon: "📸", isCoverPage: true,
          subSections: [{ id: "ss_cover_1", title: "Photo de la Façade", fields: [{ id: "cover_photo", type: "file", label: "Photo principale (Façade)" }] }]
        },
        { id: "s_admin", title: "1. Documents & Pré-inspection", key: "admin", icon: "📝",
          subSections: [
            { id: "ss_admin_1", title: "Détails de la propriété", fields: [
                { id: "inspection_code", type: "text", label: "Numéro de code de l'inspection", placeholder: "Ex: KZO-12345" },
                { id: "inspection_date", type: "date", label: "Date de l'inspection" },
                { id: "inspector_name", type: "text", label: "Nom de l'inspecteur", placeholder: "Votre nom complet..." },
                { id: "client_names", type: "clients", label: "Nom du/des Client(es)" },
                { id: "prop_address", type: "text", label: "Adresse du bâtiment", placeholder: "Adresse complète..." },
                { id: "prix_inspection", type: "number", label: "Prix de l'inspection ($)", placeholder: "Montant avant taxes (ex: 550)" },
                { id: "inspector_signature", type: "file", label: "Votre Signature (Photo/Scan)" },
                { id: "inspector_seal", type: "file", label: "Sceau Officiel (PNG transparent)" },
                { id: "prop_area", type: "number", label: "Superficie habitable (m²)", placeholder: "Ex: 145" },
                { id: "prop_year", type: "number", label: "Année de construction", placeholder: "Ex: 1985" },
                { id: "prop_type", type: "select", label: "Type de bâtiment", options: ["Maison unifamiliale","Bungalow","Cottage / Split-level","Duplex","Triplex","Condo / Appartement","Maison de ville (Townhouse)","Chalet / Résidence secondaire"] },
                { id: "prop_garage", type: "select", label: "Type de garage", options: ["Aucun garage","Garage simple attaché","Garage double attaché","Garage simple détaché","Garage double détaché","Stationnement intérieur (Condo)"] },
                { id: "norme_pratique", type: "select", label: "Norme de pratique légale", options: ["REIBH 2024 (Règlement sur les inspecteurs en bâtiment — Québec)","AIBQ (Association des inspecteurs en bâtiment du Québec)","Réseau IBC (Inspecteurs en Bâtiment Certifiés)","InterNACHI","Norme Nationale (CSA A770-23)","RBQ (Régie du bâtiment du Québec)"] },
                { id: "prop_weather", type: "select", label: "Météo lors de l'inspection", options: ["Ensoleillé","Partiellement nuageux","Nuageux","Pluie légère","Pluie forte","Neige","Très froid (< -10°C)"] },
                { id: "prop_temp", type: "number", label: "Température extérieure (°C)", placeholder: "Ex: 5" }
            ]},
            { id: "ss_admin_2", title: "Pièces jointes & Synchronisation", fields: [
                { id: "client_docs", type: "file", label: "Déclaration du vendeur / Documents remis" },
                { id: "sync_status", type: "action", label: "🔄 Forcer la sauvegarde locale" }
            ]}
          ]
        },
        { id: "s_struct", title: "2. Extérieur & Structure", key: "structure", icon: "🏠",
          subSections: [
            { id: "ss_st_0", title: "Aménagement et Pente du terrain", fields: [
                { id: "st_surface", type: "select", label: "Revêtement dominant de l'allée / cour", options: ["Asphalte","Béton coulé","Pavé uni","Gravier / Terre","Gazon dominant"] },
                { id: "st_surface_prob", type: "checkbox", label: "Fissures majeures, affaissement ou détérioration du revêtement de la cour/entrée" },
                { id: "st_pente_neg", type: "checkbox", label: "Pente négative du terrain — L'eau s'écoule vers les fondations au lieu de s'en éloigner" },
                { id: "st_gouttiere", type: "checkbox", label: "Descentes de gouttières trop près des fondations (moins de 1.5m / 5pi)" },
                { id: "st_vegetation", type: "checkbox", label: "Végétation ou lierre rampant sur la structure, arbres matures trop proches du bâtiment" }
            ]},
            { id: "ss_st_1", title: "Fondations et Drainage", fields: [
                { id: "f_type", type: "select", label: "Type de fondation", options: ["Béton coulé (Murs)","Blocs de béton (Parpaings)","Pierre des champs","Pieux (Helical/Béton)","Dalle sur sol"] },
                { id: "f_fissure", type: "checkbox", label: "Fissures visibles (lézardes) — horizontales, verticales ou en escalier dans les fondations" },
                { id: "f_efflorescence", type: "checkbox", label: "Présence d'efflorescence — dépôts blanchâtres indiquant des infiltrations d'humidité" },
                { id: "f_drain", type: "checkbox", label: "Problème suspecté avec le drain français périphérique" },
                { id: "f_pyrite", type: "checkbox", label: "DANGER PYRITE : Soulèvement du plancher de béton ou fissuration en réseau — Maisons 1960-1990 en zone à risque" },
                { id: "f_drain_notes", type: "text", label: "Notes sur le drainage", placeholder: "Ex: Arbres matures à proximité, ocre ferreuse, drain obstrué..." }
            ]},
            { id: "ss_st_2", title: "Revêtement extérieur et Murs", fields: [
                { id: "m_ext_revetement", type: "select", label: "Revêtement extérieur dominant", options: ["Brique (Maçonnerie)","Vinyle","Aluminium","Fibrociment (James Hardie)","Bois usiné (CanExel)","Bois naturel","Acrylique/Stuc","Pierre de taille","Mixte"] },
                { id: "s_colonne", type: "checkbox", label: "Affaissement ou déformation visible des poutres ou colonnes portantes" },
                { id: "m_affaissement", type: "checkbox", label: "Murs intérieurs ou extérieurs non d'aplomb, bombés ou déformés" },
                { id: "m_fissure_ext", type: "checkbox", label: "Fissures dans le revêtement extérieur ou la maçonnerie permettant des infiltrations" },
                { id: "m_calfeutrage", type: "checkbox", label: "Calfeutrage absent ou dégradé autour des fenêtres, portes et pénétrations" }
            ]},
            { id: "ss_st_3", title: "Vide Sanitaire (Si applicable)", fields: [
                { id: "v_acces", type: "select", label: "Accès au vide sanitaire", options: ["Non applicable","Accessible","Partiellement restreint","Inaccessible (Non évalué)"] },
                { id: "v_poly", type: "checkbox", label: "Membrane pare-vapeur au sol absente ou mal installée" },
                { id: "v_mur", type: "checkbox", label: "Membrane d'imperméabilisation sur les murs absente ou défectueuse" },
                { id: "v_drain", type: "checkbox", label: "Problème de drainage dans le vide sanitaire — eau stagnante" },
                { id: "v_vent", type: "checkbox", label: "Ventilation inadéquate, bloquée ou absente dans le vide sanitaire" },
                { id: "v_moisissure", type: "checkbox", label: "Présence de moisissures ou de bois dégradé dans le vide sanitaire" }
            ]},
            { id: "ss_st_4", title: "Fondation sur Pilotis (Si applicable)", fields: [
                { id: "pil_bois", type: "checkbox", label: "Bois des pilotis non traité ou présentant de la pourriture / dégradation" },
                { id: "pil_eau", type: "checkbox", label: "Mauvaise gestion de l'eau de pluie — pente négative ramenant l'eau sous la maison" },
                { id: "pil_alignement", type: "checkbox", label: "Pilotis déplacés, penchés ou appuis de solives manquants" }
            ]},
            { id: "ss_st_5", title: "Insectes et Vermine", fields: [
                { id: "i_xylo", type: "checkbox", label: "Signes d'insectes xylophages — Fourmis charpentières ou termites — Danger structurel immédiat" },
                { id: "i_guepes", type: "checkbox", label: "Présence de nids dangereux — Guêpes, abeilles ou frelons dans la structure" },
                { id: "i_vermine", type: "checkbox", label: "Traces évidentes de rongeurs — Souris, rats, excréments ou dommages aux matériaux" }
            ]},
            { id: "ss_st_6", title: "Électricité et Plomberie Extérieures", fields: [
                { id: "st_ext_eau", type: "select", label: "Robinetterie extérieure (Hose bib)", options: ["Robinet antigel (Conforme)","Robinet standard (Risque d'éclatement en hiver)","Aucun robinet apparent"] },
                { id: "st_ext_eau_prob", type: "checkbox", label: "Robinet extérieur non antigel — Risque d'éclatement de la plomberie en hiver" },
                { id: "st_ext_elec", type: "select", label: "Prises électriques extérieures", options: ["Boîtier étanche (In-use) avec DDFT/GFCI","Couvercle manquant ou inadéquat","Sans protection DDFT/GFCI","Aucune prise apparente"] },
                { id: "st_ext_elec_prob", type: "checkbox", label: "DANGER ÉLECTRIQUE : Prises extérieures sans protection DDFT/GFCI ou sans boîtier étanche" }
            ]},
            { id: "ss_st_7", title: "Dépendances et Aménagements", fields: [
                { id: "st_dep_status", type: "select", label: "Portée du mandat d'inspection", options: ["EXCLUES du mandat (Bâtiment principal uniquement)","INCLUSES dans l'inspection (Selon entente écrite)"] },
                { id: "st_dep_bat", type: "text", label: "Bâtiments détachés présents", placeholder: "Ex: Garage détaché, Cabanon, Remise, Serre..." },
                { id: "st_dep_bat_prob", type: "checkbox", label: "Bâtiments détachés : Affaissement de structure, pourriture ou toiture détériorée" },
                { id: "st_dep_piscine", type: "select", label: "Piscine ou Spa", options: ["Aucune installation aquatique","Piscine creusée","Piscine hors-terre","Spa / Hot-tub"] },
                { id: "st_dep_piscine_prob", type: "checkbox", label: "SÉCURITÉ PISCINE : Clôture réglementaire absente ou porte non conforme — Danger noyade" },
                { id: "st_dep_cloture", type: "select", label: "Type de clôture", options: ["Aucune clôture","Bois","Mailles de chaîne (Frost)","PVC / Ornemental","Haie naturelle"] },
                { id: "st_dep_cloture_prob", type: "checkbox", label: "Clôtures : Poteaux pourris, penchés ou sections sévèrement endommagées" }
            ]}
          ]
        },
        { id: "s_int", title: "3. Intérieur & Menuiserie", key: "interieur", icon: "🛋️",
          subSections: [
            { id: "ss_in_1", title: "Planchers, Murs et Plafonds", fields: [
                { id: "in_mat_plancher", type: "select", label: "Revêtement dominant des planchers", options: ["Bois franc","Stratifié (Bois flottant)","Céramique ou Porcelaine","Vinyle ou Linoléum","Moquette / Tapis","Béton apparent","Mixte"] },
                { id: "in_mat_mur", type: "select", label: "Matériaux des murs et plafonds", options: ["Panneaux de gypse (Drywall)","Plâtre sur lattes","Lambris de bois","Béton apparent","Mixte"] },
                { id: "in_pente", type: "checkbox", label: "Pente significative du plancher ou plancher souple — affaissement potentiel de la structure" },
                { id: "in_eau", type: "checkbox", label: "Cernes d'eau au plafond ou aux murs — traces d'infiltrations passées ou actives" },
                { id: "in_moisissure", type: "checkbox", label: "Moisissures visibles sur les murs, plafonds ou dans les coins — Risque pour la santé" }
            ]},
            { id: "ss_in_2", title: "Escaliers et Garde-corps", fields: [
                { id: "in_esc_main", type: "checkbox", label: "Absence de main courante continue sur toute la longueur de l'escalier" },
                { id: "in_esc_garde", type: "checkbox", label: "Garde-corps non conforme : espacement des barreaux supérieur à 100mm (4 po) — Danger pour les enfants" },
                { id: "in_esc_stabilite", type: "checkbox", label: "Escalier instable, marches usées dangereusement ou contremarches absentes" }
            ]},
            { id: "ss_in_3", title: "Portes et Fenêtres", fields: [
                { id: "in_mat_fenetre", type: "select", label: "Matériaux dominants des fenêtres", options: ["PVC (Double ou Triple vitrage)","Aluminium","Bois","Hybride Bois-Alu","Mixte"] },
                { id: "in_type_fenetre", type: "text", label: "Styles d'ouverture observés", placeholder: "Ex: Manivelle (Battant), Guillotine, Coulissante, Fixe..." },
                { id: "in_mat_porte", type: "text", label: "Portes extérieures (matériaux)", placeholder: "Ex: Acier isolé, fibre de verre, bois massif, porte patio..." },
                { id: "in_thermos", type: "checkbox", label: "Vitrage (Thermos) descellé — Condensation entre les vitres et perte d'efficacité thermique" },
                { id: "in_egress", type: "checkbox", label: "Chambre sans fenêtre de sortie d'urgence (Egress) conforme au CNB (min. 0.35m²)" }
            ]},
            { id: "ss_in_4", title: "Sécurité — Détecteurs et Alarmes", fields: [
                { id: "in_sec_fumee", type: "checkbox", label: "Détecteur de fumée absent ou non fonctionnel — Minimum 1 par étage + 1 dans chaque chambre" },
                { id: "in_sec_co", type: "checkbox", label: "Détecteur de CO absent — Requis si garage attaché ou tout appareil à combustion" },
                { id: "in_sec_gaz", type: "checkbox", label: "Détecteur de gaz absent — Requis si système au gaz naturel ou propane" },
                { id: "in_sec_extincteur", type: "checkbox", label: "Absence d'extincteur portatif dans la cuisine ou la salle mécanique" }
            ]},
            { id: "ss_in_5", title: "Salle Mécanique / Sous-sol", fields: [
                { id: "sm_acces", type: "select", label: "Accès à la salle mécanique", options: ["Complètement accessible","Partiellement accessible","Inaccessible (Non évalué)"] },
                { id: "sm_humidite", type: "checkbox", label: "Humidité excessive, condensation ou moisissures dans le sous-sol ou la salle mécanique" },
                { id: "sm_radon", type: "checkbox", label: "Sous-sol sans mitigation au radon en région à risque — Test recommandé" },
                { id: "sm_amiante_calorifuge", type: "checkbox", label: "DANGER AMIANTE : Calorifugeage des tuyaux suspect — Maisons avant 1980" },
                { id: "sm_plomb_peinture", type: "checkbox", label: "DANGER PLOMB : Peinture écaillée dans une maison construite avant 1978 — Test recommandé" }
            ]}
          ]
        },
        { id: "s_toit", title: "4. Toiture & Grenier", key: "toiture", icon: "🏗️",
          subSections: [
            { id: "ss_to_0", title: "Couverture du Toit", fields: [
                { id: "to_materiau", type: "select", label: "Type de couverture dominant", options: ["Bardeaux d'asphalte","Membrane élastomère","Membrane EPDM / TPO","Tôle profilée (Acier)","Asphalte et gravier multicouche","Bardeaux de cèdre","Tuiles"] },
                { id: "to_age", type: "select", label: "Âge approximatif de la couverture", options: ["Neuf / Récent (0-5 ans)","Bon état (5-10 ans)","Milieu de vie (10-15 ans)","Fin de vie approchant (15-20 ans)","Remplacement urgent (20 ans et +)","Inconnu"] },
                { id: "to_etat", type: "checkbox", label: "Gondolage, usure avancée, perte de granules ou bardeaux manquants — Remplacement imminent" },
                { id: "to_solin", type: "checkbox", label: "Solins absents, rouillés ou mal scellés aux jonctions toit/mur, cheminée et puits de lumière" },
                { id: "to_gouttiere", type: "checkbox", label: "Gouttières obstruées, affaissées, percées ou absentes" },
                { id: "to_degivrage", type: "checkbox", label: "Signes de barrage de glace (Ice dam) — Indique un manque d'isolation ou de ventilation" }
            ]},
            { id: "ss_to_1", title: "Grenier / Entretoit", fields: [
                { id: "g_acces", type: "select", label: "Accès au grenier", options: ["Accessible (Inspecté)","Partiellement accessible","Inaccessible (Non évalué)"] },
                { id: "g_vent", type: "checkbox", label: "Ventilation inadéquate — déflecteurs bloqués, lame d'air obstruée ou entrées d'air absentes" },
                { id: "g_mouse", type: "checkbox", label: "Traces de vermine ou rongeurs dans le grenier — Excréments ou tunnels dans l'isolant" },
                { id: "g_moisissure", type: "checkbox", label: "Moisissures sur la charpente du toit — Condensation chronique due à une mauvaise ventilation" },
                { id: "g_charpente", type: "checkbox", label: "Charpente de toit modifiée, abîmée ou membres structuraux coupés non conformément" }
            ]},
            { id: "ss_to_2", title: "Isolation du Grenier", fields: [
                { id: "i_type", type: "select", label: "Type d'isolant dominant", options: ["Laine de fibre de verre (Nattes/Soufflée)","Cellulose soufflée","Polyuréthane giclé (Mousse)","Laine de roche (Roxul)","Vermiculite (DANGER Amiante potentiel)","Copeaux de bois / Sciure (Désuet)","Aucun isolant visible"] },
                { id: "i_epaisseur", type: "select", label: "Épaisseur approximative de l'isolant", options: ["< 4 pouces — Insuffisant (R < 12)","4 à 8 pouces (R-12 à R-25)","8 à 12 pouces (R-25 à R-40)","> 12 pouces — Conforme (R-40+)"] },
                { id: "i_amiante", type: "checkbox", label: "DANGER AMIANTE : Vermiculite suspecte — Test de laboratoire obligatoire avant tout travail" }
            ]}
          ]
        },
        { id: "s_cheminee", title: "5. Cheminée & Foyer", key: "cheminee", icon: "🔥",
          subSections: [
            { id: "ss_ch_1", title: "Cheminée extérieure", fields: [
                { id: "ch_presence", type: "select", label: "Type de cheminée", options: ["Aucune cheminée","Cheminée de maçonnerie (Briques/Pierres)","Tuyau de poêle métallique (Simple paroi)","Cheminée préfabriquée isolée (Double/Triple paroi)"] },
                { id: "ch_chapeau", type: "checkbox", label: "Chapeau de cheminée absent ou brisé — Risque d'infiltration d'eau et de nidification" },
                { id: "ch_solin_ch", type: "checkbox", label: "Solin de cheminée décollé, rouillé ou inexistant — Source majeure d'infiltrations" },
                { id: "ch_fissure", type: "checkbox", label: "Fissures dans la maçonnerie de la cheminée, briques délogées ou mortier érodé" },
                { id: "ch_couronne", type: "checkbox", label: "Couronne (tablette supérieure en béton) fissurée laissant pénétrer l'eau" }
            ]},
            { id: "ss_ch_2", title: "Foyer et Âtre", fields: [
                { id: "fo_type", type: "select", label: "Type de foyer", options: ["Aucun foyer","Foyer au bois (Maçonnerie traditionnelle)","Foyer certifié EPA (Haute efficacité)","Foyer au gaz (Pilote permanent)","Foyer au gaz (Allumage électronique)","Foyer électrique décoratif","Poêle à bois certifié EPA"] },
                { id: "fo_registre", type: "checkbox", label: "Registre (Damper) bloqué, absent ou non fonctionnel — Perte de chaleur en hiver" },
                { id: "fo_fissure_int", type: "checkbox", label: "Fissures dans le foyer intérieur, la chambre de combustion ou le manteau" },
                { id: "fo_tirage", type: "checkbox", label: "Problème de tirage ou refoulement de fumée — Inspection spécialisée de cheminée recommandée" },
                { id: "fo_distance", type: "checkbox", label: "Distance de dégagement insuffisante entre le foyer/poêle et les matériaux combustibles" },
                { id: "fo_liner", type: "checkbox", label: "Absence de chemisage (Liner) requis pour l'appareil à combustion — Non conforme au code" }
            ]}
          ]
        },
        { id: "s_garage", title: "6. Garage Attaché", key: "garage", icon: "🚗",
          subSections: [
            { id: "ss_ga_1", title: "Structure et Étanchéité du Garage", fields: [
                { id: "ga_applicable", type: "select", label: "Portée de cette section", options: ["Garage attaché inspecté","Garage détaché (Section non applicable)","Aucun garage"] },
                { id: "ga_porte_coupe_feu", type: "checkbox", label: "SÉCURITÉ INCENDIE : Porte coupe-feu absente ou non conforme entre garage et logement — Auto-fermante, 20 min. minimum" },
                { id: "ga_etancheite", type: "checkbox", label: "Joints déficients entre le garage et le logement — Risque d'infiltration de CO et de gaz" },
                { id: "ga_plancher_pente", type: "checkbox", label: "Plancher de garage sans pente vers la sortie — Accumulation d'eau, sel et huile" },
                { id: "ga_plafond", type: "checkbox", label: "Plafond ou murs du garage non recouverts de gypse Type X ignifuge (Requis pour garage attaché)" }
            ]},
            { id: "ss_ga_2", title: "Systèmes et Sécurité du Garage", fields: [
                { id: "ga_porte_auto", type: "select", label: "Porte de garage motorisée", options: ["Non motorisée (Manuelle)","Motorisée — Conforme","Motorisée — Défectueuse ou sans inversion automatique"] },
                { id: "ga_porte_auto_prob", type: "checkbox", label: "Système d'inversion automatique de la porte motorisée absent ou défectueux — Danger d'écrasement" },
                { id: "ga_ventilation", type: "checkbox", label: "Absence de ventilation mécanique ou naturelle dans le garage fermé — Risque d'accumulation de CO" },
                { id: "ga_co", type: "checkbox", label: "Détecteur de CO absent dans l'espace de vie adjacent au garage (Requis par le code)" },
                { id: "ga_elec", type: "checkbox", label: "Prises électriques sans protection DDFT/GFCI dans le garage — Zone humide, obligatoire" },
                { id: "ga_huile", type: "checkbox", label: "Contamination du plancher par des déversements d'huile ou liquides importants" }
            ]}
          ]
        },
        { id: "s_plomb", title: "7. Plomberie", key: "plomberie", icon: "🚰",
          subSections: [
            { id: "ss_pl_0", title: "Chauffe-eau", fields: [
                { id: "ce_type", type: "select", label: "Type de chauffe-eau", options: ["Électrique — Réservoir","Gaz naturel — Réservoir","Propane — Réservoir","Thermopompe à eau chaude (TPEC)","Sans réservoir (Instantané)","Chauffe-eau solaire","Inconnu"] },
                { id: "ce_age", type: "number", label: "Âge approximatif du chauffe-eau (années)", placeholder: "Ex: 8" },
                { id: "ce_capacite", type: "select", label: "Capacité du réservoir", options: ["< 40 gallons (Insuffisant pour famille)","40 gallons","50 gallons (Standard)","60 gallons et +","Sans réservoir"] },
                { id: "ce_vieillissement", type: "checkbox", label: "Chauffe-eau en fin de vie (> 10-12 ans) ou signes de corrosion et rouille sur le réservoir" },
                { id: "ce_soupape", type: "checkbox", label: "Soupape de sûreté (TPR valve) absente, non testée ou sans tuyau d'évacuation conforme" },
                { id: "ce_fuite", type: "checkbox", label: "Fuite active détectée au chauffe-eau ou à ses raccords" }
            ]},
            { id: "ss_pl_1", title: "Alimentation et Entrée d'eau", fields: [
                { id: "p_entree", type: "select", label: "Matériau de la tuyauterie d'alimentation", options: ["Cuivre","PEX (Polyéthylène réticulé)","CPVC","Galvanisé (Désuet — Risque de corrosion)","Plomb (DANGER — Remplacement urgent)"] },
                { id: "p_pression", type: "checkbox", label: "Faible pression d'eau constatée à plusieurs points d'eau" },
                { id: "p_robinet_arret", type: "checkbox", label: "Robinet d'arrêt principal introuvable ou non fonctionnel" }
            ]},
            { id: "ss_pl_2", title: "Tuyauterie et Renvois", fields: [
                { id: "p_fuite", type: "checkbox", label: "Fuite active détectée — Gouttes visibles, traces de moisissures ou d'humidité chronique" },
                { id: "p_materiau_renvoi", type: "select", label: "Matériau des tuyaux de renvoi (Évacuation)", options: ["ABS (Noir)","PVC (Blanc/Gris)","Fonte","Cuivre","Orangeburg (Papier compressé — Désuet)"] },
                { id: "p_regard", type: "checkbox", label: "Pompe de puisard non conforme — Débordement, absence d'étanchéité ou clapet de retenue absent" }
            ]},
            { id: "ss_pl_3", title: "Systèmes Sanitaires Autonomes", fields: [
                { id: "p_systeme_type", type: "select", label: "Type d'évacuation des eaux usées", options: ["Réseau municipal","Fosse septique avec champ d'épuration","Fosse de rétention scellée","Inconnu (À vérifier)"] },
                { id: "p_fosse", type: "checkbox", label: "Fosse / Champ d'épuration : Signes de débordement, odeurs d'égout ou surface détrempée" },
                { id: "p_puits", type: "select", label: "Source d'alimentation en eau potable", options: ["Aqueduc municipal","Puits artésien (Foreuse)","Puits de surface","Pointe filtrante"] },
                { id: "p_puits_risq", type: "checkbox", label: "Puits autonome à moins de 30m (100pi) d'un système d'épuration — Risque de contamination" }
            ]}
          ]
        },
        { id: "s_elec", title: "8. Électricité", key: "electricite", icon: "⚡",
          subSections: [
            { id: "ss_el_1", title: "Entrée et Panneau de Distribution", fields: [
                { id: "e_entree", type: "select", label: "Type d'entrée électrique", options: ["Aérienne (Triplex)","Souterraine"] },
                { id: "e_capacite", type: "select", label: "Capacité du service électrique", options: ["60 ampères (Insuffisant — Mise à niveau recommandée)","100 ampères (Standard ancienne norme)","125 ampères","150 ampères","200 ampères (Standard actuelle)","400 ampères (Service commercial/spécial)","Inconnu"] },
                { id: "e_panneau", type: "select", label: "Type et état du panneau de distribution", options: ["Panneau à disjoncteurs standard (Conforme)","Panneau à fusibles (Désuet — Toléré si en bon état)","Marque à risque — Federal Pioneer / Zinsco (Remplacement recommandé)","Panneau commercial inadapté pour résidentiel"] },
                { id: "e_terre_etat", type: "select", label: "État de la mise à la terre", options: ["Présente, connectée et visible","Dissimulée / Non visible à l'inspection","Manquante ou sectionnée"] },
                { id: "e_terre", type: "checkbox", label: "DÉFAUT À DÉCLARER : Mise à la terre manquante, coupée ou inadéquate — Danger électrique sérieux" }
            ]},
            { id: "ss_el_2", title: "Câblage et Prises", fields: [
                { id: "e_fil", type: "select", label: "Type de filage dominant", options: ["Cuivre (Standard conforme)","Aluminium (Risque d'incendie — Connexions spéciales requises)","Mixte Cuivre/Aluminium"] },
                { id: "e_disj", type: "checkbox", label: "Disjoncteurs incompatibles, double-tap (2 fils/1 disjoncteur) ou circuits surchargés" },
                { id: "e_gfci", type: "checkbox", label: "Absence de prises DDFT/GFCI requises près des points d'eau — Cuisine, salles de bain, garage, extérieur" },
                { id: "e_afci", type: "checkbox", label: "Absence de protection AFCI (Détection d'arc) sur circuits de chambre à coucher — Requis CNB 2020" },
                { id: "e_mixte", type: "checkbox", label: "Connexions cuivre/aluminium sans pâte antioxydante (Marette AluCopper requise)" },
                { id: "e_exposition", type: "checkbox", label: "Filage électrique exposé, non protégé ou dénudé dans des zones accessibles" }
            ]},
            { id: "ss_el_3", title: "Énergie Solaire (Si applicable)", fields: [
                { id: "e_sol_pres", type: "select", label: "Présence de panneaux solaires", options: ["Aucun","Sur le toit","Sur structure au sol"] },
                { id: "e_sol_fuite", type: "checkbox", label: "Dommages à la toiture ou fuite potentielle aux ancrages des fixations de panneaux" },
                { id: "e_sol_bat", type: "checkbox", label: "Banque de batteries non ventilée ou installation de l'onduleur non conforme" },
                { id: "e_sol_secu", type: "checkbox", label: "Absence d'interrupteur d'urgence (Déconnexion rapide extérieure) — Requis pour les pompiers" }
            ]}
          ]
        },
        { id: "s_cvac", title: "9. Chauffage, Clim & Ventilation", key: "cvac", icon: "🌡️",
          subSections: [
            { id: "ss_cv_1", title: "Système de chauffage principal", fields: [
                { id: "c_source", type: "select", label: "Type de système de chauffage", options: ["Plinthes électriques","Air pulsé électrique (Fournaise)","Air pulsé au gaz naturel","Air pulsé au propane","Air pulsé au mazout","Thermopompe centrale (Air-Air)","Thermopompe murale (Mini-split)","Géothermie","Radiant hydroponique (Plancher chauffant)","Poêle à bois / Foyer (Appoint)"] },
                { id: "c_age", type: "number", label: "Âge approximatif du système (années)", placeholder: "Ex: 12" },
                { id: "c_vetuste", type: "checkbox", label: "Système de chauffage en fin de vie (> 15-20 ans) ou entretien manifestement négligé" },
                { id: "c_filtre", type: "checkbox", label: "Filtre à air encrassé ou absent — Impact sur la qualité de l'air et l'efficacité du système" },
                { id: "c_combustion", type: "checkbox", label: "DANGER CO : Signes de combustion incomplète, brûleurs sales, flamme jaune ou odeur de gaz" }
            ]},
            { id: "ss_cv_2", title: "Ventilation et Qualité de l'air", fields: [
                { id: "v_vrc", type: "checkbox", label: "Échangeur d'air (VRC/VRE) absent, défectueux ou filtres encrassés — Entretien urgent requis" },
                { id: "v_secheuse", type: "checkbox", label: "Sortie de sécheuse non conforme — Conduit plastique, obstrué, clapet bloqué ou évacuation intérieure" },
                { id: "v_hotte_ext", type: "checkbox", label: "Hotte de cuisine évacuant vers l'intérieur — Recirculation, non conforme si gaz" },
                { id: "v_humidite", type: "checkbox", label: "Humidité relative excessive (> 60%) ou condensation chronique sur les fenêtres" }
            ]}
          ]
        },
        { id: "s_cuis", title: "10. Cuisine & Salles de bain", key: "cuisine", icon: "🍳",
          subSections: [
            { id: "ss_cu_1", title: "Cuisine", fields: [
                { id: "cu_hotte", type: "checkbox", label: "Hotte de cuisine non évacuée vers l'extérieur — Recirculation de l'air humide et des odeurs" },
                { id: "cu_conduit", type: "checkbox", label: "Conduit de hotte non conforme (Flexible annelé retenant la graisse — Risque incendie)" },
                { id: "cu_meubles", type: "checkbox", label: "Armoires, comptoirs ou électroménagers très usés, détériorés ou non fonctionnels" },
                { id: "cu_gfci_cui", type: "checkbox", label: "Absence de prises DDFT/GFCI sur le comptoir de cuisine (Moins de 1.5m d'un évier)" }
            ]},
            { id: "ss_cu_2", title: "Salles de bain", fields: [
                { id: "sb_vent", type: "checkbox", label: "Ventilateur d'extraction absent, défaillant ou non évacué vers l'extérieur — Risque de moisissures" },
                { id: "sb_calfeutrage", type: "checkbox", label: "Calfeutrage absent ou décollé autour du bain, douche ou lavabo — Risque d'infiltration" },
                { id: "sb_gfci", type: "checkbox", label: "Absence de prise DDFT/GFCI dans la salle de bain (Obligatoire à moins de 1.5m d'un lavabo)" },
                { id: "sb_plancher", type: "checkbox", label: "Plancher souple autour de la toilette ou baignoire — Infiltration sous le revêtement" }
            ]}
          ]
        },
        { id: "s_danger", title: "11. Matières Dangereuses", key: "danger", icon: "☢️",
          subSections: [
            { id: "ss_da_1", title: "Amiante", fields: [
                { id: "da_amiante_risque", type: "select", label: "Période de construction (Risque amiante)", options: ["Après 1990 (Faible risque)","1980-1990 (Risque modéré)","1970-1980 (Risque élevé)","Avant 1970 (Risque très élevé)"] },
                { id: "da_amiante_vermiculite", type: "checkbox", label: "DANGER AMIANTE : Isolant vermiculite dans le grenier — Test obligatoire avant tout travail de rénovation" },
                { id: "da_amiante_calorifuge", type: "checkbox", label: "DANGER AMIANTE : Calorifugeage gris/blanc sur les tuyaux ou la fournaise — Matériau potentiellement dangereux" },
                { id: "da_amiante_tuile", type: "checkbox", label: "DANGER AMIANTE : Tuiles de plancher 9x9 pouces ou carreaux de plafond acoustiques anciens (Avant 1980)" }
            ]},
            { id: "ss_da_2", title: "Plomb et Pyrite", fields: [
                { id: "da_plomb_peinture", type: "checkbox", label: "DANGER PLOMB : Peinture au plomb suspecte (Maisons avant 1978) — Risque si écaillée ou travaux prévus" },
                { id: "da_plomb_tuyaux", type: "checkbox", label: "DANGER PLOMB : Tuyauterie de plomb confirmée ou suspectée — Analyse de l'eau recommandée" },
                { id: "da_pyrite", type: "checkbox", label: "DANGER PYRITE : Soulèvement ou fissuration du plancher de béton au sous-sol — Test de laboratoire recommandé" }
            ]},
            { id: "ss_da_3", title: "Radon et Autres contaminants", fields: [
                { id: "da_radon", type: "checkbox", label: "Recommandation de test au radon (Région à risque selon la carte de Santé Canada)" },
                { id: "da_huile", type: "checkbox", label: "Trace ou suspicion d'ancienne citerne à mazout enterrée ou hors-terre — Risque de contamination du sol" },
                { id: "da_formaldehyde", type: "checkbox", label: "Boiseries ou panneaux de particules récents avec odeur chimique forte (Formaldéhyde — COV)" }
            ]}
          ]
        },
        { id: "s_rapport", title: "12. Rapport Final", key: "rapport", icon: "📄",
          subSections: [
            { id: "ss_rap_1", title: "Résumé général de l'inspection", fields: [
                { id: "rap_etat_general", type: "select", label: "État général du bâtiment", options: ["Excellent — Aucun défaut majeur observé","Bon — Quelques points mineurs à surveiller","Acceptable — Travaux recommandés à moyen terme","Préoccupant — Travaux urgents requis dans les prochains mois","Critique — Risques pour la sécurité des occupants — Intervention immédiate"] },
                { id: "rap_notes", type: "text", label: "Notes générales de l'inspecteur", placeholder: "Observations finales, limitations de l'inspection, conditions particulières..." },
                { id: "rap_priorite", type: "text", label: "Travaux prioritaires identifiés", placeholder: "Listez les interventions les plus urgentes avec estimation de coût si possible..." },
                { id: "rap_entretien", type: "text", label: "Recommandations d'entretien préventif", placeholder: "Ex: Inspecter la toiture annuellement, nettoyer les gouttières, vidanger le chauffe-eau..." }
            ]},
            { id: "ss_rap_2", title: "Génération du document", fields: [
                { id: "rap_generate", type: "action", label: "📄 Visualiser le Rapport Final (PDF)" }
            ]}
          ]
        }
    ]
};
