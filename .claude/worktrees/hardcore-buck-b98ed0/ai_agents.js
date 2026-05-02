// Agents IA (Simulés pour le frontend)

// --- Base de données : Durées de vie typiques des équipements (Québec) ---
const EQUIPMENT_LIFESPAN = {
    // Chauffage & CVAC
    "fournaise":       { min: 15, max: 25, label: "Fournaise à air pulsé",     signes: "Bruit excessif, cycles fréquents, réparations répétées" },
    "thermopompe":     { min: 15, max: 20, label: "Thermopompe",               signes: "Perte d'efficacité, gels fréquents, fuite de réfrigérant" },
    "chauffe-eau":     { min: 10, max: 15, label: "Chauffe-eau électrique",     signes: "Eau tiède, fuites, corrosion visible, bruit" },
    "chauffe-eau gaz": { min: 8,  max: 12, label: "Chauffe-eau au gaz",        signes: "Flamme pilote instable, eau insuffisante, rouille" },
    "vrc":             { min: 20, max: 25, label: "VRC / Échangeur d'air",      signes: "Débit réduit, moteur bruyant, condensat insuffisant" },
    "plinthe":         { min: 25, max: 40, label: "Plinthes électriques",       signes: "Thermostat défaillant, surchauffe localisée" },
    "chaudière":       { min: 20, max: 30, label: "Chaudière à eau chaude",     signes: "Pression instable, fuites, bruits de canalisation" },
    // Plomberie
    "cuivre":          { min: 50, max: 70, label: "Tuyaux en cuivre",           signes: "Pinhole leaks, verdissement, raccords détériorés" },
    "pex":             { min: 25, max: 40, label: "Tuyaux PEX",                 signes: "Raccords défaillants, exposition UV si extérieur" },
    "galvanisé":       { min: 30, max: 50, label: "Tuyaux galvanisés",          signes: "Rouille, diminution pression, eau brunâtre" },
    "fonte":           { min: 50, max: 75, label: "Tuyauterie en fonte",        signes: "Fissures, fuites aux joints, corrosion avancée" },
    // Ventilation
    "conduit métal":   { min: 30, max: 40, label: "Conduits de ventilation",    signes: "Rouille, joints décollés, fuites d'air" },
    // Toiture
    "bardeau":         { min: 20, max: 25, label: "Bardeaux d'asphalte",        signes: "Granules absents, gondolement, coins relevés" },
    "membrane":        { min: 20, max: 30, label: "Membrane de toiture",        signes: "Bulles, fissures, joints décollés" },
    "tôle":            { min: 40, max: 60, label: "Toiture en tôle",            signes: "Rouille, vis desserrées, joints dégradés" },
    // Fenêtres
    "thermos":         { min: 15, max: 25, label: "Unités scellées (thermos)",  signes: "Condensation entre vitres, voile blanc" },
    "fenêtre pvc":     { min: 25, max: 40, label: "Fenêtres PVC",              signes: "Joints usés, condensation, manœuvre difficile" },
    "fenêtre bois":    { min: 30, max: 50, label: "Fenêtres bois",             signes: "Pourriture cadre, peinture écaillée, infiltration" },
    // Électricité
    "panneau":         { min: 30, max: 40, label: "Panneau électrique",         signes: "Disjoncteurs fatigués, marques de chaleur, capacité insuffisante" },
    // Fondations
    "drain français":  { min: 20, max: 30, label: "Drain français",             signes: "Efflorescence, eau stagnante, ocre ferreuse" }
};

// Fonction d'estimation de durée de vie résiduelle
function estimateResidualLife(equipmentKey, ageYears) {
    const eq = EQUIPMENT_LIFESPAN[equipmentKey];
    if (!eq || isNaN(ageYears) || ageYears < 0) return null;
    
    const avgLife = (eq.min + eq.max) / 2;
    const residual = Math.max(0, Math.round(avgLife - ageYears));
    const pctUsed = Math.min(100, Math.round((ageYears / avgLife) * 100));
    
    let status = "";
    if (pctUsed >= 100) {
        status = "FIN DE VIE UTILE DÉPASSÉE";
    } else if (pctUsed >= 80) {
        status = "Fin de vie utile approchante";
    } else if (pctUsed >= 50) {
        status = "Mi-vie atteinte";
    } else {
        status = "Bon potentiel résiduel";
    }
    
    return {
        label: eq.label,
        ageYears: ageYears,
        lifeMin: eq.min,
        lifeMax: eq.max,
        avgLife: avgLife,
        residual: residual,
        pctUsed: pctUsed,
        status: status,
        signes: eq.signes,
        // Formulation REIBH 2024 — ne jamais garantir
        text: `Âge estimé : environ ${ageYears} ans. Durée de vie typique : ${eq.min}–${eq.max} ans. ` +
              `Durée de vie résiduelle estimée : environ ${residual} ans (${status}). ` +
              `Indicateurs de fin de vie à surveiller : ${eq.signes}. ` +
              `⚠️ Cette estimation est basée sur des moyennes statistiques et dépend des conditions d'entretien.`
    };
}

const AIAgents = {
    // Agent Technique (Inspection)
    analyzeCheckbox: function(issueLabel) {
        const text = issueLabel.toLowerCase();
        let riskWarning = "Ce défaut requiert une attention particulière pour éviter une détérioration future de la structure ou des composantes environnantes.";
        
        // Explicitation des VRAIS RISQUES

        // --- DÉFAUTS CRITIQUES (Fiches de référence) ---
        if (text.includes("fissure") && text.includes("horizontal")) {
            riskWarning = "Indique une pression latérale du sol sur le mur — souvent due au gel-dégel. Peut signifier un risque structurel imminent. Recommander un ingénieur en structure sans délai. Documenter longueur, largeur et localisation avec photos.";
        } else if (text.includes("glace de rive") || text.includes("ice dam")) {
            riskWarning = "Accumulation de glace en bordure de toit causée par une mauvaise ventilation de comble. L'eau de fonte s'infiltre sous les bardeaux. Inspecter les combles pour traces d'humidité et ventilation insuffisante.";
        } else if (text.includes("moisissure")) {
            riskWarning = "Présence visible de moisissures (taches noires, vertes, blanches) dans vide sanitaire, comble ou murs. Risque pour la santé. Recommander analyse par spécialiste en qualité de l'air et identifier la source d'humidité.";

        // --- DÉFAUTS MODÉRÉS (Fiches de référence) ---
        } else if (text.includes("efflorescence")) {
            riskWarning = "Dépôts blancs de sels minéraux indiquant un passage d'humidité à travers le béton. N'est pas structurellement dangereux seul, mais révèle une infiltration chronique. Inspecter drain français et pente du terrain.";
        } else if (text.includes("condensation") && (text.includes("vitre") || text.includes("thermos") || text.includes("vitrage"))) {
            riskWarning = "Bris du scellant de l'unité scellée (thermopane). La vitre ne remplit plus son rôle d'isolation thermique. Coût de remplacement variable selon la fenêtre. À documenter fenêtre par fenêtre avec localisation.";
        } else if (text.includes("gondol") || text.includes("granules")) {
            riskWarning = "Signe de vieillissement avancé du bardeau d'asphalte (durée de vie 20-25 ans). Risque de fuite à court terme. Estimer le pourcentage de surface affectée et noter l'âge apparent. Recommander remplacement si >25% atteint.";
        } else if (text.includes("pente") && text.includes("fondation")) {
            riskWarning = "Le terrain doit avoir une pente d'au moins 5% sur 3 m s'éloignant du bâtiment (REIBH 2024). Une pente inversée dirige les eaux de ruissellement vers la fondation. Recommander correction de la mise en pente.";

        // --- DÉFAUTS MINEURS (Fiches de référence) ---
        } else if (text.includes("joints de m") || text.includes("mortier") && text.includes("dégradé")) {
            riskWarning = "Joints de mortier érodés ou manquants entre briques ou blocs. Permet l'infiltration d'eau et de froid. Rejointoiement recommandé avant aggravation. Coût modéré si traité tôt.";

        // --- CHEMINÉE & FOYER ---
        } else if (text.includes("chapeau") && text.includes("cheminée")) {
            riskWarning = "Un chapeau de cheminée absent ou brisé expose le conduit aux précipitations directement. L'eau pénètre, accélère la dégradation du mortier et de la maçonnerie, et favorise la formation de rouille sur les composantes métalliques. Les oiseaux et la vermine peuvent aussi s'installer dans le conduit et créer un blocage dangereux.";
        } else if (text.includes("solin") && text.includes("cheminée")) {
            riskWarning = "Les solins de cheminée déficients sont la cause principale d'infiltrations d'eau autour des cheminées. L'eau pénètre dans la structure du toit, pourrit le platelage et les fermes de toit, et peut causer des dommages importants sur plusieurs années sans que cela soit visible immédiatement.";
        } else if (text.includes("registre") || text.includes("damper")) {
            riskWarning = "Un registre non fonctionnel laisse l'air chaud s'échapper par la cheminée en hiver, causant des pertes thermiques importantes (équivalent d'une fenêtre ouverte). Il laisse aussi entrer l'air froid, la pluie et les insectes. Sans registre, le risque de refoulement de fumée et de CO en cas de vent est accru.";
        } else if (text.includes("chemisage") || text.includes("liner")) {
            riskWarning = "L'absence de chemisage expose les murs de la cheminée aux gaz chauds de combustion, à la créosote et aux acides corrosifs. Un conduit non chemisé peut transmettre la chaleur aux matériaux combustibles adjacents (poutres, solives) et provoquer un incendie de charpente. Risque de fuite de monoxyde de carbone dans le logement.";
        } else if (text.includes("tirage") && text.includes("foyer")) {
            riskWarning = "Un mauvais tirage indique un problème grave : conduit bouché, cheminée trop froide, pression dépressive dans la maison ou conduit sous-dimensionné. Le refoulement de fumée introduit du monoxyde de carbone et des particules de combustion dans l'espace de vie — risque pour la santé des occupants.";

        // --- GARAGE ATTACHÉ ---
        } else if (text.includes("porte coupe-feu") || (text.includes("porte") && text.includes("garage") && text.includes("coupe"))) {
            riskWarning = "L'absence d'une porte coupe-feu conforme entre le garage et le logement est une déficience de sécurité incendie critique. En cas d'incendie dans le garage (vapeurs d'essence, produits inflammables), le feu et les gaz toxiques peuvent se propager rapidement dans le logement. Exigence absolue du CNB — non négociable.";
        } else if (text.includes("gypse") && text.includes("garage")) {
            riskWarning = "Sans séparation coupe-feu en gypse Type X, un incendie dans le garage se propage directement dans le logement sans aucune résistance. Le gypse Type X offre une résistance d'au moins 1 heure qui permet aux occupants d'évacuer. Déficience de sécurité grave — à corriger impérativement.";
        } else if (text.includes("inversion") && text.includes("porte")) {
            riskWarning = "Un mécanisme d'inversion défectueux sur une porte de garage motorisée présente un risque d'écrasement grave pour les enfants, les animaux et les adultes. Des décès ont été documentés. La norme canadienne exige ce mécanisme depuis 1993 — son absence ou dysfonctionnement est inacceptable.";
        } else if (text.includes("co") && text.includes("garage")) {
            riskWarning = "Le monoxyde de carbone produit par les véhicules à moteur dans un garage attaché peut s'infiltrer dans le logement même avec le moteur éteint. Ce gaz inodore et incolore peut causer l'inconscience et la mort en moins d'une heure à faible concentration. Détecteur de CO obligatoire selon le code.";
        } else if (text.includes("ventilation") && text.includes("garage")) {
            riskWarning = "Un garage fermé sans ventilation accumule le monoxyde de carbone, les vapeurs d'essence et les vapeurs de peinture à des niveaux dangereux très rapidement. Une seule minute de démarrage de véhicule dans un garage fermé peut atteindre des concentrations mortelles de CO.";

        // --- MATIÈRES DANGEREUSES ---
        } else if (text.includes("vermiculite") || (text.includes("amiante") && text.includes("isolant"))) {
            riskWarning = "ALERTE AMIANTE : La vermiculite Zonolite utilisée comme isolant en grenier au Canada est contaminée à l'amiante dans 70% des cas (mine de Libby, Montana). L'inhalation de fibres d'amiante cause le mésothéliome et le cancer du poumon. Aucune exposition n'est sans risque. Ne jamais perturber cet isolant sans analyse préalable.";
        } else if (text.includes("amiante") && text.includes("calorifuge")) {
            riskWarning = "Le calorifugeage en amiante sur les tuyaux ou les appareils de chauffage était courant avant 1980. S'il est endommagé ou friable, il libère des fibres d'amiante dans l'air ambiant — risque carcinogène grave à long terme. S'il est intact et non perturbé, il peut être laissé en place sous surveillance, mais doit être déclaré à tous les entrepreneurs.";
        } else if (text.includes("plomb") && text.includes("peinture")) {
            riskWarning = "La peinture au plomb est particulièrement dangereuse pour les enfants de moins de 6 ans — même de faibles concentrations causent des dommages neurologiques irréversibles (retard intellectuel, troubles du comportement). Si la peinture est écaillée ou si des travaux de ponçage sont prévus, le risque d'intoxication au plomb est immédiat.";
        } else if (text.includes("pyrite")) {
            riskWarning = "La pyrite dans le remblai de fondation réagit chimiquement au contact de l'eau et de l'oxygène, produisant du sulfate qui fait gonfler et se fissurer la dalle de béton de façon irréversible. Ce processus est lent mais inexorable — les coûts de correction (remplacement complet de la dalle) sont considérables et peuvent atteindre plusieurs dizaines de milliers de dollars.";
        } else if (text.includes("radon")) {
            riskWarning = "Le radon est un gaz radioactif naturel issu de la désintégration de l'uranium dans le sol — il est la deuxième cause de cancer du poumon après le tabagisme au Canada (3200 décès/an). Il s'accumule silencieusement dans les sous-sols et espaces confinés. Inodore, incolore, non irritant — seul un test peut le détecter. La région du bouclier canadien est particulièrement à risque.";
        } else if (text.includes("citerne") && text.includes("mazout")) {
            riskWarning = "Une ancienne citerne à mazout enterrée peut être corrodée et fuir sans qu'il soit possible de le voir. La contamination du sol par le pétrole est coûteuse à décontaminer, peut affecter la nappe phréatique et représente un passif environnemental qui peut rendre la propriété invendable ou non finançable.";

        // --- DÉFAUTS EXISTANTS ---
        } else if (text.includes("pare-vapeur") || text.includes("stagnante") || text.includes("imperméabilisation")) {
            riskWarning = "La remontée constante d'humidité depuis le sol expose le vide sanitaire à un risque élevé de développement de moisissures sévères et détériore la qualité de l'air de tout le bâtiment.";
        } else if (text.includes("ventilation inadéquate") || text.includes("ventilation")) {
            riskWarning = "Une mauvaise ventilation emprisonnera l'air humide, menant à de la condensation chronique et à de futures moisissures ou champignons sur la structure en bois.";
        } else if (text.includes("pourriture") || text.includes("bois des pilotis")) {
            riskWarning = "L'accumulation d'humidité sur du bois non traité provoque une pourriture fongique active. C'est un risque sérieux qui compromet directement l'intégrité et la force portante de la structure.";
        } else if (text.includes("drainage") || text.includes("pente negative")) {
             riskWarning = "L'eau de ruissellement ramenée vers le bâtiment augmente la pression et provoque inévitablement l'affaissement des appuis et des infiltrations à court terme.";
        } else if (text.includes("xylophage") || text.includes("fourmis") || text.includes("termite")) {
             riskWarning = "Ces insectes rongent le bois de l'intérieur, détruisant silencieusement la charpente de la maison. Une destruction structurale complète peut survenir à long terme.";
        } else if (text.includes("guêpe") || text.includes("nid") || text.includes("frelon")) {
             riskWarning = "La présence d'un nid actif représente un risque élevé de piqûres et de chocs allergiques pour les occupants ou les visiteurs.";
        } else if (text.includes("sécheuse")) {
             riskWarning = "L'accumulation de charpie dans un conduit bloqué ou plastique est une grande cause d'incendies. Une mauvaise évacuation pousse aussi l'humidité directement dans la structure.";
        } else if (text.includes("hotte") || text.includes("vrc") || text.includes("conduit")) {
             riskWarning = "Une ventilation déficiente empêche l'humidité de s'échapper, dégrade considérablement la qualité de l'air intérieur, et les conduits non lisses (annelés) accumulent dangereusement la graisse.";
        } else if (text.includes("mise à la terre") || text.includes("double-tap") || text.includes("incompatible")) {
             riskWarning = "Une absence de mise à la terre ou une surcharge des disjoncteurs (connexion double) pose un risque critique d'électrocution mortelle et d'incendie électrique en cas de foudre ou de court-circuit.";
        } else if (text.includes("federal pacific") || text.includes("stab-lok") || text.includes("zinsco")) {
             riskWarning = "Les panneaux Federal Pacific (Stab-Lok) et Zinsco sont reconnus pour une défaillance connue : le disjoncteur ne débranche pas lors d'une surcharge, causant des incendies électriques sans avertissement. Le remplacement complet du panneau est recommandé.";
        } else if (text.includes("60 a") || (text.includes("60") && text.includes("ampère"))) {
             riskWarning = "Un panneau de 60 A est nettement insuffisant pour une maison équipée d'une thermopompe, d'une cuisière et d'une sécheuse électriques. Un panneau surchargé à 60 A peut provoquer des disjoncting en chaîne et des risques d'incendie.";
        } else if (text.includes("fusibles") || text.includes("fusible")) {
             riskWarning = "Un panneau à fusibles désuet présente un risque si des fusibles de mauvais calibre ont été installés (ex: fusible 30 A sur un circuit de 15 A). Cette pratique supprime la protection contre les surcharges.";
        } else if (text.includes("double-tap") || (text.includes("deux conducteurs") && text.includes("disjoncteur"))) {
             riskWarning = "Un double-tap (deux fils sur un même pôle) surchage le disjoncteur. Si les deux conducteurs ne sont pas de même calibre, le risque de surchauffe et d'incendie est présent. Un électricien doit corriger la situation rapidement.";
        } else if (text.includes("étiquett") || text.includes("identifiés")) {
             riskWarning = "L'absence d'identification sur les disjoncteurs empêche une coupure rapide du courant en cas d'urgence, retardant les interventions lors d'incidents électriques ou de dégâts d'eau.";
        } else if (text.includes("rouille") || text.includes("brûlure") || text.includes("surchauffe") || text.includes("fils dénudés")) {
             riskWarning = "La présence de traces visibles de rouille, de brûlures ou de fils dénudés dans le panneau indique une défaillance électrique active. Évaluation immédiate par un électricien maître requise.";
        } else if (text.includes("dégagement frontal") || (text.includes("1 mètre") && text.includes("panneau"))) {
             riskWarning = "Le Code électrique du Québec exige un espace libre d'au moins 1 mètre (3,3 pi) devant tout panneau de distribution. Un accès bloqué retarde une coupure d'émergence et expose les intervenants à un danger d'électrocution.";
        } else if (text.includes("disjoncteurs") || text.includes("puisard") || text.includes("clapet")) {
             riskWarning = "Le dysfonctionnement du regard de drainage ou l'absence d'un clapet de retenue expose tout le sous-sol à un risque inévitable de refoulement d'égout et d'inondation majeure.";
        } else if (text.includes("fosse") || text.includes("épuration") || text.includes("débordement")) {
             riskWarning = "Un débordement de fosse ou un champ d'épuration saturé représente un risque biologique extrême pour la santé publique, en plus de contaminer le sol obligatoirement.";
        } else if (text.includes("puits") || text.includes("contamination")) {
             riskWarning = "L'absence de dégagement sanitaire entre le puits et le système septique expose les occupants à un danger invisible mais imminent de contamination de l'eau potable par les coliformes fécaux (E. Coli).";
        } else if (text.includes("ancrages") || text.includes("panneaux")) {
             riskWarning = "Des ancrages mal scellés sur la toiture créent des points d'infiltration directe pour l'eau de pluie, risquant de pourrir le platelage du toit et d'annuler vos garanties de bardeau.";
        } else if (text.includes("batteries") || text.includes("interrupteur") || text.includes("onduleur")) {
             riskWarning = "Une installation solaire non ventilée présente un risque élevé d'incendie (emballement thermique des batteries). L'absence d'interrupteur extérieur de coupure met la vie des pompiers en danger en cas d'intervention.";
        } else if (text.includes("pente négative") || text.includes("gouttière")) {
             riskWarning = "L'eau orientée vers le bâtiment génère une importante pression hydrostatique sur la fondation, ce qui mène très souvent à des fissures structurelles et des infiltrations d'eau au sous-sol.";
        } else if (text.includes("végétation") || text.includes("arbres matures")) {
             riskWarning = "Le lierre retient l'humidité sur les parements (favorisant la pourriture). Les racines de grands arbres menacent de détruire physiquement le drain français par colmatage et d'assécher mortellement les sols argileux.";

        // --- CHAUFFAGE & SYSTÈMES MÉCANIQUES ---
        } else if (text.includes("filtre") && text.includes("fournaise")) {
             riskWarning = "Un filtre colmaté réduit drastiquement le débit d'air, surcharge le moteur du ventilateur et peut provoquer une surchauffe de l'échangeur thermique. Remplacement immédiat recommandé.";
        } else if (text.includes("échangeur thermique")) {
             riskWarning = "Un échangeur thermique fissuré peut laisser échapper du monoxyde de carbone (CO) dans l'air de la maison — un gaz mortel inodore. Recommander l'évaluation par un technicien en chauffage certifié.";
        } else if (text.includes("conduits") && text.includes("isolé")) {
             riskWarning = "Des conduits de distribution non isolés dans les espaces non chauffés (grenier, vide sanitaire) causent une perte thermique significative et augmentent la consommation d'énergie.";
        } else if (text.includes("plinthe") && text.includes("30 cm")) {
             riskWarning = "Le non-respect du dégagement de 30 cm autour des plinthes électriques est un risque d'incendie. Les matériaux combustibles (rideaux, meubles, jouets) trop proches peuvent s'enflammer.";
        } else if (text.includes("plinthe") && (text.includes("surchauffe") || text.includes("bosselée"))) {
             riskWarning = "Des plinthes peinturées réduisent leur efficacité thermique. Des traces de surchauffe ou des déformations indiquent un dysfonctionnement potentiel du thermostat ou de l'élément chauffant.";
        } else if (text.includes("thermopompe") || text.includes("serpentin") || text.includes("réfrigérant")) {
             riskWarning = "Des serpentins encrassés ou endommagés réduisent considérablement l'efficacité de la thermopompe. Une odeur de réfrigérant indique une fuite nécessitant l'intervention d'un technicien certifié HRAI.";
        } else if (text.includes("créosote")) {
             riskWarning = "La créosote est un résidu hautement inflammable qui s'accumule dans les conduits de cheminée. Son épaisseur excessive (> 3mm) représente un risque imminent d'incendie de cheminée. Ramonage urgent requis.";
        } else if (text.includes("ramonage") || text.includes("cheminée") && text.includes("2 ans")) {
             riskWarning = "L'absence de ramonage professionnel depuis plus de 2 ans expose les occupants à un risque d'incendie de cheminée et d'intoxication au CO. Un ramonage annuel est fortement recommandé par la CNESST.";
        } else if (text.includes("trappe") && text.includes("tirage")) {
             riskWarning = "Une trappe de tirage bloquée ou absente empêche la fermeture du conduit lorsque le foyer n'est pas en usage, causant des pertes thermiques importantes et l'entrée d'air froid ou de vermine.";

        // --- DÉFAUTS MÉCANIQUES CRITIQUES ---
        } else if (text.includes("soupape") || text.includes("tpr")) {
             riskWarning = "L'absence de soupape TPR (température-pression) sur un chauffe-eau représente un risque d'explosion. Cette soupape est le dernier dispositif de sécurité empêchant une surpression catastrophique du réservoir. Remplacement ou installation d'urgence requis.";
        } else if (text.includes("plomb") && text.includes("tuyau")) {
             riskWarning = "Les tuyaux en plomb contaminent l'eau potable avec des niveaux dangereux de plomb — un neurotoxique qui affecte particulièrement le développement des enfants. Le remplacement complet de la tuyauterie est la seule solution permanente.";
        } else if (text.includes("polybutylène") || text.includes("poly-b")) {
             riskWarning = "Le polybutylène (Poly-B), gris et flexible, est reconnu pour ses ruptures soudaines et sans avertissement. Plusieurs assureurs refusent de couvrir les propriétés équipées de Poly-B. Recommander le remplacement complet par du PEX ou du cuivre.";
        } else if (text.includes("h₂s") || text.includes("gaz d'égout") || text.includes("odeur") && text.includes("égout")) {
             riskWarning = "Le sulfure d'hydrogène (H₂S) est un gaz toxique irritant pour les voies respiratoires. Sa présence indique un siphon sec, un joint de renvoi défectueux ou une fissure dans la tuyauterie d'évacuation. Source à identifier et corriger d'urgence.";
        } else if (text.includes("ventilateur") && text.includes("comble")) {
             riskWarning = "Un ventilateur de salle de bain évacuant l'air humide dans le comble au lieu de l'extérieur provoque une accumulation d'humidité, de condensation et de moisissures sur la charpente et l'isolant du toit.";
        } else if (text.includes("galvanisé") && text.includes("alimentation")) {
             riskWarning = "Les tuyaux galvanisés en alimentation se corrodent de l'intérieur avec le temps, réduisant progressivement la pression d'eau et libérant des particules de rouille. Remplacement par du cuivre ou du PEX recommandé.";

        // --- DÉFAUTS STRUCTURELS (Module 4) ---
        } else if (text.includes("fissure") && text.includes("escalier") || text.includes("diagonale")) {
             riskWarning = "Les fissures en diagonale ou en escalier sont des signes typiques d'un tassement différentiel de la fondation, souvent dû à un mauvais drainage ou aux cycles de gel-dégel. Une évaluation par un ingénieur est requise.";
        } else if (text.includes("voilement") || text.includes("bombement")) {
             riskWarning = "Le voilement d'un mur de fondation indique que le mur cède sous la pression latérale du sol et du gel. Ce défaut structurel majeur nécessite une intervention corrective (mur de soutènement ou pieutage).";
        } else if (text.includes("gel") && text.includes("soulèvement")) {
             riskWarning = "Le soulèvement par le gel survient lorsque l'humidité gèle sous les fondations, manquant de profondeur hors gel (min. 1.2m). Ce cycle endommagera progressivement toute la structure s'il n'est pas mitigé.";
        } else if (text.includes("retrait") || (text.includes("fissure") && text.includes("verticale"))) {
             riskWarning = "Les fissures de retrait (verticales) sont courantes lors du séchage du béton. Moins critiques que les fissures obliques, elles doivent cependant être scellées pour prévenir toute infiltration d'eau.";
        } else if (text.includes("dégagement") || text.includes("200 mm") || text.includes("parement")) {
             riskWarning = "Un dégagement du sol au parement insufisant favorise les infiltrations d'eau vers la lisse d'assise (bois) et attire les insectes xylophages. Couper la terre est souvent requis.";
        } else if (text.includes("crépi")) {
             riskWarning = "Le crépi protège le béton des fondations contre l'usure prématurée causée par le gel, le dégel et les rayons UV. S'il est endommagé, le béton devient plus poreux et friable à long terme.";
        } else if (text.includes("margelle")) {
             riskWarning = "L'absence de margelles ou des margelles mal drainées (remplies de terre/feuilles) accumuleront l'eau contre la fenêtre du sous-sol, augmentant radicalement le risque d'infiltration d'eau massive.";
        } else if (text.includes("traces d'eau") || (text.includes("efflorescence") && text.includes("fondation"))) {
             riskWarning = "Une efflorescence sévère au bas des murs intérieurs de fondation confirme que le mur est gorgé d'humidité. Le drain français est potentiellement bloqué ou en fin de vie utile.";
        } else if (text.includes("solives") && (text.includes("coupes") || text.includes("trous") || text.includes("entailles"))) {
             riskWarning = "Les trous forés à plus d'un tiers (1/3) de la hauteur d'une solive ou les entailles irrégulières suppriment la résistance en flexion du plancher, provoquant affaissement et perte de portance globale.";
        } else if (text.includes("murs") && text.includes("ouvertures") && text.includes("linteau")) {
             riskWarning = "Une ouverture dans un mur porteur sans l'installation d'un linteau structurel correctement dimensionné forcera les étages supérieurs à s'affaisser, posant un risque grave d'effondrement partiel.";
        } else if (text.includes("poutre") && (text.includes("appuis") || text.includes("flèche"))) {
             riskWarning = "L'appui minimal pour une poutre porteuse doit être de 90 mm (3.5 pouces) sur la fondation ou la colonne. Un appui insuffisant ou une flèche visible menace le support de la surface totale de plancher.";
        } else if (text.includes("colonnes") && (text.includes("hors d'aplomb") || text.includes("semelle") || text.includes("pourriture"))) {
             riskWarning = "Une colonne sans semelle ou hors d'aplomb ne peut transférer adéquatement la charge au sol. L'affaissement des colonnes est l'une des causes principales de déformation des planchers au-dessus de vides sanitaires.";
        } else if (text.includes("parasismique") || (text.includes("ancrage") && text.includes("lisse"))) {
             riskWarning = "En zone sismique, l'absence d'ancrage entre la charpente de bois (lisse) et la fondation de béton augmente considérablement le risque que le bâtiment glisse de sa base lors d'un tremblement de terre modéré.";
        }

        let narrative = `Lors de l'inspection visuelle, nous avons constaté : ${issueLabel.toLowerCase()}.\n\n**Risque associé :** ${riskWarning}`;
        
        // Auto-enrichir avec durée de vie résiduelle si "fin de vie" est mentionné
        if (text.includes("fin de vie")) {
            const lifespanInfo = AIAgents.estimateLifespanFromLabel(issueLabel);
            if (lifespanInfo) {
                narrative += `\n\n**Durée de vie :** ${lifespanInfo}`;
            }
        }
        
        return narrative;
    },

    // Agent Diagnostic (Sévérité — REIBH 2024)
    determineSeverity: function(issueLabel) {
        const text = issueLabel.toLowerCase();
        // URGENT — Sécurité ou dommage immédiat
        if (text.includes("incendie") || text.includes("danger") || text.includes("amiante") || text.includes("fuite active") || text.includes("absence de main courante") || text.includes("fumée") || text.includes("monoxyde") || text.includes("gaz combustible") || text.includes("xylophage") || text.includes("termite") || text.includes("sécheuse") || text.includes("mise à la terre") || text.includes("surcharge") || text.includes("fosse") || text.includes("débordement") || text.includes("batteries") || text.includes("interrupteur") || text.includes("pompiers") || (text.includes("fissure") && (text.includes("horizontal") || text.includes("actif") || text.includes("escalier") || text.includes("diagonale"))) || text.includes("moisissure") || text.includes("ice dam") || text.includes("glace de rive") || text.includes("créosote") || text.includes("échangeur thermique") || (text.includes("plinthe") && text.includes("30 cm")) || text.includes("soupape") || text.includes("tpr") || text.includes("plomb") || text.includes("poly-b") || text.includes("polybutylène") || text.includes("h₂s") || text.includes("gaz d'égout") || text.includes("explosion") || text.includes("voilement") || text.includes("bombement") || text.includes("linteau") || (text.includes("poutre") && text.includes("appuis")) || text.includes("federal pacific") || text.includes("stab-lok") || text.includes("zinsco") || text.includes("double-tap") || text.includes("rouille") || text.includes("brûlure") || text.includes("fils dénudés") || text.includes("surchauffe")) {
            return "URGENT";
        }
        // IMPORTANT — À corriger sous 6 mois
        if (text.includes("fissure") || text.includes("affaissement") || text.includes("égout") || text.includes("eau stagnante") || text.includes("non conforme") || text.includes("fin de vie utile") || text.includes("drain") || text.includes("pourriture") || text.includes("pente négative") || text.includes("membrane") || text.includes("guêpe") || text.includes("vermine") || text.includes("vrc") || text.includes("hotte") || text.includes("conduit") || text.includes("disjoncteurs") || text.includes("puisard") || text.includes("puits") || text.includes("contamination") || text.includes("ancrages") || text.includes("panneaux") || text.includes("gouttière") || text.includes("végétation") || text.includes("efflorescence") || text.includes("condensation") || text.includes("thermos") || text.includes("gondol") || text.includes("granules") || (text.includes("pente") && text.includes("fondation")) || text.includes("filtre") || text.includes("plinthe") || text.includes("ramonage") || text.includes("chaudière") || text.includes("pression") || text.includes("réfrigérant") || text.includes("serpentin") || (text.includes("ventilateur") && text.includes("comble")) || text.includes("galvanisé") || text.includes("gel") || text.includes("flèche") || text.includes("solives") || text.includes("poteaux") || text.includes("colonnes") || text.includes("coincées") || text.includes("parasismique") || text.includes("dégagement") || text.includes("parement") || text.includes("margelle") || text.includes("traces d'eau") || text.includes("fusibles") || text.includes("60 a") || text.includes("étiquett") || text.includes("1 mètre")) {
            return "IMPORTANT";
        }
        // ENTRETIEN — À planifier, non urgent
        return "ENTRETIEN";
    },

    // Agent Sécurité et Normes (Alerte de conformité)
    checkCompliance: function(issueLabel) {
        const text = issueLabel.toLowerCase();
        let norms = [];
        if (text.includes("aluminium")) norms.push("Attention : Le câblage en aluminium nécessite une inspection par un maître électricien (Normes minimales et Assurabilité).");
        if (text.includes("chapeau") && text.includes("cheminée")) norms.push("BNQ 3009-500 / CNB 9.21 : L'inspection de la cheminée inclut l'évaluation du chapeau, des solins, de la couronne et de l'état général de la maçonnerie.");
        if (text.includes("chemisage") || text.includes("liner")) norms.push("NFPA 211 / CNB 9.21 : Un chemisage de cheminée certifié est requis lorsqu'un appareil à combustion est raccordé à une cheminée de maçonnerie existante. L'absence de liner est un risque d'incendie et de CO.");
        if (text.includes("porte coupe-feu") || (text.includes("porte") && text.includes("garage") && text.includes("coupe"))) norms.push("CNB 9.10.9 : La séparation entre le garage et le logement doit être coupe-feu — porte homologuée résistance 20 min. minimum, auto-fermante et auto-verrouillante.");
        if (text.includes("gypse") && text.includes("garage")) norms.push("CNB 9.10.9.14 : Les surfaces intérieures d'un garage attaché exposées au logement doivent être recouvertes de gypse de type X (5/8 po) — barrière coupe-feu obligatoire.");
        if (text.includes("inversion") && text.includes("porte")) norms.push("CAN/CSA-C22.2 No. 220 : Les portes de garage motorisées doivent être équipées d'un mécanisme d'inversion automatique à la rencontre d'un obstacle. Exigence obligatoire depuis 1993 au Canada.");
        if (text.includes("vermiculite") || (text.includes("amiante") && text.includes("isolant"))) norms.push("Règlement sur la santé et la sécurité du travail (RSST) / CNESST : La manipulation d'amiante est strictement réglementée. Test de caractérisation obligatoire avant tout travail perturbant le matériau suspect. Désamiantage par firme certifiée CNESST uniquement.");
        if (text.includes("plomb") && text.includes("peinture")) norms.push("Santé Canada / CNESST : La peinture au plomb doit être identifiée et gérée selon les lignes directrices de Santé Canada. Dépose uniquement par des travailleurs formés avec EPI appropriés.");
        if (text.includes("pyrite")) norms.push("Programme de protection contre la pyrite du Québec / MERN : La présence de pyrite dans le remblai est un vice affectant la valeur du bien. Un test de laboratoire accrédité est recommandé pour toute propriété construite entre 1960 et 1990 en zone à risque.");
        if (text.includes("radon")) norms.push("Santé Canada : Le seuil d'intervention recommandé est de 200 Bq/m³. Une mitigation est recommandée dès 100 Bq/m³. Test sur 3 mois minimum — appareil de mesure accrédité C-NRPP requis.");
        if (text.includes("garde-corps") || text.includes("espacement")) norms.push("Code National du Bâtiment : L'espacement des barreaux d'un garde-corps ne doit pas permettre le passage d'un objet sphérique de 100mm (4 po).");
        if (text.includes("amiante") || text.includes("vermiculite")) norms.push("Protocole de santé (CSST/CNESST) : Un test de caractérisation en laboratoire est obligatoire avant toute manipulation.");
        if (text.includes("fumée") || text.includes("monoxyde") || text.includes("gaz")) norms.push("Règlement de sécurité incendie : L'absence de détecteurs fonctionnels est une violation directe aux normes de sécurité vitales du bâtiment (Code de Sécurité).");
        if (text.includes("fissure") && text.includes("horizontal")) norms.push("REIBH 2024 / CNB : Les fissures horizontales indiquent une pression latérale excessive. Évaluation par un ingénieur en structure obligatoire.");
        if (text.includes("pente") && text.includes("fondation")) norms.push("REIBH 2024 : Le terrain doit présenter une pente minimale de 5% sur les 3 premiers mètres s'éloignant du bâtiment.");
        if (text.includes("moisissure")) norms.push("Santé Canada / INSPQ : La présence de moisissures visibles requiert une analyse professionnelle de la qualité de l'air et une remediation certifiée.");
        if (text.includes("glace de rive") || text.includes("ice dam")) norms.push("CNB 9.26 : La ventilation du comble doit être suffisante (ratio 1/300 minimum) pour prévenir la formation de barrières de glace.");
        if (text.includes("mortier") || text.includes("joints de m")) norms.push("CNB 9.20 : Les joints de maçonnerie doivent être maintenus en bon état pour assurer l'étanchéité et la résistance structurale du parement.");
        if (text.includes("créosote") || text.includes("ramonage")) norms.push("NFPA 211 / Régie du bâtiment : Le ramonage annuel des conduits de cheminée au bois est fortement recommandé. La créosote de niveau 3 (glacée) requiert une intervention professionnelle immédiate.");
        if (text.includes("échangeur thermique")) norms.push("CSA B149.1 / Code du gaz : Un échangeur thermique fissuré peut causer une fuite de monoxyde de carbone (CO). Évaluation par un technicien certifié en chauffage obligatoire.");
        if (text.includes("plinthe") && text.includes("30 cm")) norms.push("Code de sécurité incendie : Un dégagement minimal de 30 cm (12 po) doit être maintenu autour de tout appareil de chauffage électrique.");
        if (text.includes("entretien") && text.includes("gaz")) norms.push("CSA B149.1 : L'entretien annuel des appareils au gaz par un technicien certifié est requis pour maintenir la garantie et la sécurité.");
        if (text.includes("soupape") || text.includes("tpr")) norms.push("CNB / CSA B125 : Chaque chauffe-eau doit être muni d'une soupape de sûreté (TPR) raccordée à un drain vers le sol. Son absence constitue un défaut critique de sécurité.");
        if (text.includes("plomb")) norms.push("Santé Canada : La concentration de plomb dans l'eau potable ne doit pas dépasser 5 µg/L (2019). Le remplacement des conduites en plomb est la solution recommandée.");
        if (text.includes("poly-b") || text.includes("polybutylène")) norms.push("Industrie / Assurance : Le polybutylène (Poly-B) n'est plus accepté par le Code du bâtiment et plusieurs assureurs exigent son remplacement complet pour maintenir la couverture.");
        if (text.includes("h₂s") || text.includes("gaz d'égout")) norms.push("Code de plomberie : Chaque appareil sanitaire doit être muni d'un siphon fonctionnel empêchant le retour des gaz d'égout dans le bâtiment.");
        if (text.includes("ventilateur") && text.includes("comble")) norms.push("CNB 9.32 : Les ventilateurs d'extraction de salle de bain doivent évacuer directement à l'extérieur du bâtiment, jamais dans le comble ou le vide sanitaire.");
        
        // --- NORMES STRUCTURELLES ---
        if (text.includes("gel") && text.includes("profondeur")) norms.push("CNB 9.12.2.2 : Les semelles de fondations doivent être enfouies sous le niveau de pénétration du gel (typiquement 1.2m à 1.5m au Québec) ou protégées par de l'isolation certifiée.");
        if (text.includes("flèche") || text.includes("rebond")) norms.push("CNB 9.4 : La flèche maximale tolérée pour une solive de plancher supportant des charges vives est de L/360.");
        if (text.includes("solives") && (text.includes("trous") || text.includes("coupes"))) norms.push("CNB 9.23.5.1 : Les trous forés dans des éléments d'ossature porteurs ne doivent pas excéder 1/3 de la profondeur de l'élément, et doivent se situer au centre.");
        if (text.includes("poutre") && text.includes("appuis")) norms.push("CNB 9.23.4 : Les poutres en bois, en acier ou en bois d'ingénierie doivent s'appuyer sur au moins 90 mm (3,5 po) de maçonnerie ou de béton solide.");
        if (text.includes("dégagement") || text.includes("200 mm")) norms.push("CNB 9.27.2.4 : Une distance minimale de 200 mm (8 po) doit être maintenue entre le plancher fini extérieur (sol) et le parement pour prévenir l'humidité et les dommages.");
        if (text.includes("margelle")) norms.push("CNB 9.14.6.3 : Les fenêtres de sous-sol situées sous ou au niveau du terrain doivent être munies de margelles correctement drainées (gravier jusqu'au drain français).");

        // --- NORMES ÉLECTRIQUES ---
        if (text.includes("federal pacific") || text.includes("stab-lok") || text.includes("zinsco")) norms.push("Code de construction du Québec / Régie du bâtiment : Les panneaux Federal Pacific (Stab-Lok) et Zinsco sont reconnus comme défectueux. Leur remplacement est recommandé par les assureurs et les inspecteurs en bâtiment.");
        if (text.includes("double-tap")) norms.push("Code électrique du Québec (CEQ) : Un seul conducteur par pôle de disjoncteur est permis, sauf utilisation de disjoncteurs tandem certifiés et approuvés par le fabricant du panneau.");
        if (text.includes("dégagement frontal") || (text.includes("1 mètre") && text.includes("panneau"))) norms.push("Code électrique du Québec — Art. 2-308 : Un espace libre d'au moins 1 mètre (3,3 pi) doit être maintenu devant tout panneau de distribution pour permettre une intervention sécuritaire.");
        if (text.includes("60 a") || (text.includes("60") && text.includes("insuffisant"))) norms.push("Hydro-Québec / CEQ : Un service de 60 A est insuffisant pour les maisons modernes avec chauffage électrique intégral et thermopompe. Un service minimal de 200 A est recommandé.");
        
        return norms;
    },

    // Agent Vision (Analyse de photo)
    analyzePhoto: function() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    description: "Analyse Vision: On observe une fissure verticale d'environ 3mm de largeur sur la fondation extérieure de type béton coulé. La fissure semble inactive pour le moment, mais des traces d'efflorescence suggèrent une infiltration passée.",
                    recommendation: "Faire sceller la fissure par injection d'époxy ou de polyuréthane par un spécialiste en fondations pour prévenir toute infiltration d'eau future."
                });
            }, 1500); // 1.5s simulation delay
        });
    },

    // Agent Durée de Vie — Estimation résiduelle (REIBH 2024)
    estimateLifespanFromLabel: function(issueLabel) {
        const text = issueLabel.toLowerCase();
        // Détection automatique du type d'équipement à partir du libellé
        const mappings = [
            { keys: ["fournaise", "air pulsé"], eq: "fournaise" },
            { keys: ["thermopompe", "mini-split"], eq: "thermopompe" },
            { keys: ["chauffe-eau", "réservoir d'eau chaude"], eq: "chauffe-eau" },
            { keys: ["vrc", "vre", "échangeur d'air"], eq: "vrc" },
            { keys: ["plinthe"], eq: "plinthe" },
            { keys: ["chaudière", "eau chaude", "radiateur"], eq: "chaudière" },
            { keys: ["bardeau", "asphalte", "couverture"], eq: "bardeau" },
            { keys: ["membrane", "élastomère", "tpo", "epdm"], eq: "membrane" },
            { keys: ["tôle", "acier"], eq: "tôle" },
            { keys: ["thermos", "vitrage scellé", "thermopane"], eq: "thermos" },
            { keys: ["drain français"], eq: "drain français" },
            { keys: ["cuivre"], eq: "cuivre" },
            { keys: ["pex"], eq: "pex" },
            { keys: ["galvanisé"], eq: "galvanisé" },
            { keys: ["fonte"], eq: "fonte" },
            { keys: ["panneau électrique", "panneau de distribution"], eq: "panneau" },
            { keys: ["conduit", "ventilation métal"], eq: "conduit métal" }
        ];
        
        for (const m of mappings) {
            for (const key of m.keys) {
                if (text.includes(key)) {
                    const eq = EQUIPMENT_LIFESPAN[m.eq];
                    if (eq) {
                        return `${eq.label} — durée de vie typique : ${eq.min}–${eq.max} ans. Indicateurs de fin de vie : ${eq.signes}. ⚠️ Cette estimation dépend des conditions d'entretien.`;
                    }
                }
            }
        }
        return null;
    },

    // Accès direct à la base de données de durées de vie
    getLifespanData: function() {
        return EQUIPMENT_LIFESPAN;
    },

    // Estimation avec âge spécifié (pour utilisation dans le rapport)
    estimateWithAge: function(equipmentKey, ageYears) {
        return estimateResidualLife(equipmentKey, ageYears);
    },

    // Agent Recommandation
    getRecommendation: function(issueLabel) {
        // --- Nouvelles recommandations (Fiches de référence) ---
        if (issueLabel.toLowerCase().includes("horizontal") && issueLabel.toLowerCase().includes("fissure")) return "URGENT : Faire évaluer par un ingénieur en structure sans délai. Documenter la longueur, largeur et localisation exacte de chaque fissure avec photos. Ne pas tenter de colmater avant l'évaluation professionnelle.";
        if (issueLabel.toLowerCase().includes("glace de rive") || issueLabel.toLowerCase().includes("ice dam")) return "Améliorer la ventilation du comble (ajouter des évents de soffite et de faîte). Vérifier l'étanchéité de la membrane Ice & Water Shield en bas de pente. Envisager l'installation de câbles chauffants si le problème est récurrent.";
        if (issueLabel.toLowerCase().includes("moisissure")) return "Identifier et éliminer la source d'humidité en priorité. Faire analyser la qualité de l'air par un laboratoire accrédité. Engager une firme certifiée en décontamination pour la remédiation. Ne pas tenter de nettoyer soi-même les surfaces affectées.";
        if (issueLabel.toLowerCase().includes("efflorescence")) return "Inspecter le drain français et la pente du terrain. Vérifier le calfeutrage des fenêtres de sous-sol. Appliquer un traitement hydrofuge après correction de la source d'humidité. Surveiller l'évolution sur 6 mois.";
        if (issueLabel.toLowerCase().includes("condensation") && (issueLabel.toLowerCase().includes("vitre") || issueLabel.toLowerCase().includes("thermos"))) return "Remplacer les unités scellées (thermopanes) défectueuses pour restaurer l'isolation thermique. Documenter chaque fenêtre affectée avec localisation (façade, étage). Obtenir des soumissions de vitriers certifiés.";
        if (issueLabel.toLowerCase().includes("gondol") || issueLabel.toLowerCase().includes("granules")) return "Estimer le pourcentage de surface affectée. Si >25%, planifier le remplacement complet de la couverture. Si <25%, effectuer des réparations localisées et surveiller annuellement. Obtenir 3 soumissions de couvreurs certifiés.";
        if (issueLabel.toLowerCase().includes("pente") && issueLabel.toLowerCase().includes("fondation")) return "Corriger la pente du terrain pour atteindre un minimum de 5% sur les 3 premiers mètres (REIBH 2024). Remblayer avec de la terre glaise compactée. Ajouter des rallonges aux descentes pluviales pour éloigner l'eau à plus de 1,5m.";
        if (issueLabel.toLowerCase().includes("joints de m") || (issueLabel.toLowerCase().includes("mortier") && issueLabel.toLowerCase().includes("dégradé"))) return "Procéder au rejointoiement des sections affectées par un maçon qualifié. Utiliser un mortier compatible avec l'existant. Traiter avant l'hiver pour éviter l'aggravation par le gel-dégel. Coût modéré si traité rapidement.";

        // --- Recommandations structurelles (Module 4) ---
        if (issueLabel.toLowerCase().includes("fissure") && (issueLabel.toLowerCase().includes("escalier") || issueLabel.toLowerCase().includes("diagonale"))) return "Faire évaluer urgemment par un ingénieur en structure pour déterminer si le tassement est actif ou stabilisé. L'installation de pieux d'acier sous la semelle pourrait être requise. Documenter la progression avec des témoins (jauges).";
        if (issueLabel.toLowerCase().includes("retrait") || (issueLabel.toLowerCase().includes("fissure") && issueLabel.toLowerCase().includes("verticale"))) return "Nettoyer et sceller la fissure à l'aide d'une injection d'époxy (si structurelle) ou de polyuréthane (si uniquement infiltration) par un professionnel en fondations. Surveiller visuellement de façon annuelle.";
        if (issueLabel.toLowerCase().includes("voilement") || issueLabel.toLowerCase().includes("bombement")) return "Consulter un ingénieur en structure. Des travaux d'excavation pour relâcher la pression du sol et l'installation de poutres de renfort en acier (H-beams) ancrées au plancher et à la dalle seront probablement nécessaires.";
        if (issueLabel.toLowerCase().includes("gel") && issueLabel.toLowerCase().includes("soulèvement")) return "Améliorer le drainage de surface et installer une jupe isolante rigide (ex: panneau de polystyrène extrudé) autour de la fondation sous le niveau du sol pour empêcher le gel d'atteindre la base de la semelle.";
        if (issueLabel.toLowerCase().includes("solives") && (issueLabel.toLowerCase().includes("coupes") || issueLabel.toLowerCase().includes("trous"))) return "Faire renforcer les solives fragilisées par un charpentier qualifié (ex: doublage de solives, plaques d'acier) selon les recommandations d'un ingénieur structurel. Ne jamais couper les membrures de fermes de plancher.";
        if (issueLabel.toLowerCase().includes("poutre") && issueLabel.toLowerCase().includes("appuis")) return "Faire installer des colonnes de soutien ajustables supplémentaires (Jack posts) ou des plaques d'acier pour assurer un appui minimal continu de 90 mm, selon l'évaluation professionnelle.";
        if (issueLabel.toLowerCase().includes("dégagement") || (issueLabel.toLowerCase().includes("parement") && issueLabel.toLowerCase().includes("sol"))) return "Abaisser le niveau du terrain autour de la zone affectée pour restaurer un dégagement de 200 mm sous le parement, tout en maintenant une pente d'égouttement positive s'éloignant des fondations.";
        if (issueLabel.toLowerCase().includes("margelle")) return "Installer ou nettoyer les margelles. S'assurer que chaque margelle est remplie de gravier drainant (3/4 net) connecté jusqu'au drain français, et installer un couvercle transparent incliné pour dévier l'eau de pluie.";
        if (issueLabel.toLowerCase().includes("crépi")) return "Faire piqueter et remplacer le crépi endommagé pour protéger le béton des éléments en surface. Une tâche d'entretien à bas coût mais utile à long terme.";

        // --- Recommandations électriques (Panneau) ---
        if (issueLabel.toLowerCase().includes("federal pacific") || issueLabel.toLowerCase().includes("stab-lok") || issueLabel.toLowerCase().includes("zinsco")) return "URGENT : Recommander immédiatement le remplacement complet du panneau par un maître électricien. Informer l'acheteur que plusieurs assureurs refusent ou surtaxent les propriétés équipées de ces panneaux. Obtenir 3 soumissions.";
        if (issueLabel.toLowerCase().includes("60 a") || (issueLabel.toLowerCase().includes("60") && issueLabel.toLowerCase().includes("insuffisant"))) return "Planifier la mise à niveau du service électrique de 60 A à 200 A. Cela nécessite la coordination avec Hydro-Québec pour la mise à niveau du câble d'entrée, un maître électricien pour le panneau et l'inspection par un électricien régional.";
        if (issueLabel.toLowerCase().includes("fusibles") || issueLabel.toLowerCase().includes("fusible")) return "Recommander le remplacement du panneau à fusibles par un panneau à disjoncteurs modernes. Faire vérifier le calibrage des fusibles existants par un maître électricien avant remplacement.";
        if (issueLabel.toLowerCase().includes("double-tap")) return "Faire installer des disjoncteurs supplémentaires par un électricien licencié pour dédier un pôle par conducteur, ou remplacer par un disjoncteur tandem approuvé par le fabricant du panneau.";
        if (issueLabel.toLowerCase().includes("étiquett") || issueLabel.toLowerCase().includes("identifiés")) return "Identifier chaque circuit avec des étiquettes claires et permanentes (étiqueteuse ou stylo indelébile). Tester chaque disjoncteur pour confirmer le circuit contrôlé. Cette tâche peut être réalisée par le propriétaire ou un électricien.";
        if (issueLabel.toLowerCase().includes("rouille") || issueLabel.toLowerCase().includes("brûlure") || issueLabel.toLowerCase().includes("fils dénudés")) return "URGENT : Cesser l'utilisation du panneau si possible et demander une évaluation immédiate par un maître électricien. Des traces de brûlures ou de fils dénudés peuvent indiquer une défaillance électrique active près de s'embraser.";
        if (issueLabel.toLowerCase().includes("dégagement frontal")) return "Dégager et maintenir un espace libre d'au moins 1 mètre devant le panneau. Enlever tout meuble, rangement ou matériau bloqué dans cet espace. Ne jamais utiliser l'espace devant un panneau comme espace de rangement.";

        // --- Recommandations chauffage ---
        if (issueLabel.toLowerCase().includes("filtre") && issueLabel.toLowerCase().includes("fournaise")) return "Remplacer le filtre immédiatement (filtre MERV-8 minimum recommandé). Établir un calendrier de remplacement aux 3 mois. Un filtre colmaté surcharge le moteur et réduit la durée de vie de l'appareil.";
        if (issueLabel.toLowerCase().includes("échangeur thermique")) return "URGENT : Cesser l'utilisation de la fournaise et recommander l'évaluation par un technicien certifié en chauffage. Un échangeur fissuré peut causer une fuite de CO mortelle. Ne pas tenter de réparer soi-même.";
        if (issueLabel.toLowerCase().includes("conduits") && issueLabel.toLowerCase().includes("isolé")) return "Isoler les conduits de distribution dans les espaces non chauffés avec un minimum de R-8. Sceller les jonctions avec du ruban métallique (pas du duct tape). Améliore l'efficacité de 15-25%.";
        if (issueLabel.toLowerCase().includes("plinthe") && issueLabel.toLowerCase().includes("30 cm")) return "Dégager immédiatement tous les objets à moins de 30 cm des plinthes électriques. Informer les occupants du risque d'incendie. Vérifier que les rideaux ne touchent pas les plinthes.";
        if (issueLabel.toLowerCase().includes("plinthe") && (issueLabel.toLowerCase().includes("surchauffe") || issueLabel.toLowerCase().includes("bosselée"))) return "Faire inspecter par un électricien. Les plinthes peinturées doivent être décapées ou remplacées. Les traces de surchauffe peuvent indiquer un thermostat défectueux.";
        if (issueLabel.toLowerCase().includes("thermostat") && issueLabel.toLowerCase().includes("défectueux")) return "Remplacer le thermostat défectueux. Recommander des thermostats électroniques programmables pour les plinthes (économie d'énergie de 10-15%).";
        if (issueLabel.toLowerCase().includes("thermopompe") || issueLabel.toLowerCase().includes("serpentin")) return "Faire nettoyer les serpentins par un technicien certifié HRAI. Dégager la végétation autour de l'unité extérieure (minimum 60 cm). Remplacer les filtres intérieurs aux 3 mois.";
        if (issueLabel.toLowerCase().includes("réfrigérant")) return "Faire intervenir un technicien certifié HRAI pour localiser et colmater la fuite de réfrigérant. La manipulation de réfrigérants est réglementée et requiert une certification.";
        if (issueLabel.toLowerCase().includes("créosote")) return "URGENT : Faire ramoner la cheminée par un ramoneur certifié WETT immédiatement. Ne pas utiliser le foyer avant le ramonage. Une accumulation de créosote de niveau 2 ou 3 est un risque imminent d'incendie.";
        if (issueLabel.toLowerCase().includes("ramonage")) return "Planifier un ramonage professionnel par un technicien certifié WETT. Recommander un entretien annuel. Conserver les preuves de ramonage pour l'assurance habitation.";
        if (issueLabel.toLowerCase().includes("trappe") && issueLabel.toLowerCase().includes("tirage")) return "Faire réparer ou remplacer la trappe de tirage (damper) par un installateur certifié. Une trappe non fonctionnelle cause des pertes thermiques importantes et permet l'entrée de vermine.";
        if (issueLabel.toLowerCase().includes("chaudière") || issueLabel.toLowerCase().includes("pression")) return "Faire vérifier la pression et les soupapes de sécurité par un technicien certifié. Purger les radiateurs pour éliminer les poches d'air. Vérifier le vase d'expansion.";
        if (issueLabel.toLowerCase().includes("entretien") && issueLabel.toLowerCase().includes("annuel")) return "Recommander fortement un contrat d'entretien annuel avec un technicien certifié. Conserver les preuves d'entretien (requis par certaines assurances et pour maintenir les garanties du fabricant).";

        // --- Recommandations défauts mécaniques critiques ---
        if (issueLabel.toLowerCase().includes("soupape") || issueLabel.toLowerCase().includes("tpr")) return "URGENT : Faire installer ou remplacer la soupape TPR (température-pression) immédiatement par un plombier certifié. Raccorder le drain de la soupape vers le sol. Ne jamais obstruer ou retirer une soupape TPR.";
        if (issueLabel.toLowerCase().includes("plomb") && issueLabel.toLowerCase().includes("tuyau")) return "URGENT : Recommander le remplacement complet de la tuyauterie en plomb par du cuivre ou du PEX. En attendant, laisser couler l'eau 2 minutes avant consommation. Faire analyser l'eau potable par un laboratoire accrédité.";
        if (issueLabel.toLowerCase().includes("poly-b") || issueLabel.toLowerCase().includes("polybutylène")) return "URGENT : Recommander le remplacement complet du Poly-B par du PEX ou du cuivre. Vérifier la couverture d'assurance habitation (certains assureurs refusent les propriétés avec Poly-B). Prioriser les raccords et jonctions.";
        if (issueLabel.toLowerCase().includes("h₂s") || issueLabel.toLowerCase().includes("gaz d'égout")) return "Identifier la source : vérifier tous les siphons (remplir d'eau les siphons secs), inspecter les joints de renvoi et les évents de plomberie. Si l'odeur persiste, recommander l'évaluation par un plombier certifié avec caméra d'inspection.";
        if (issueLabel.toLowerCase().includes("ventilateur") && issueLabel.toLowerCase().includes("comble")) return "Prolonger le conduit d'évacuation du ventilateur directement vers l'extérieur à travers le toit ou le soffite. Isoler le conduit dans le comble pour prévenir la condensation. Utiliser un conduit rigide ou semi-rigide (pas flexible).";
        if (issueLabel.toLowerCase().includes("galvanisé") && issueLabel.toLowerCase().includes("alimentation")) return "Planifier le remplacement de la tuyauterie galvanisée par du cuivre ou du PEX dans les 6 à 12 mois. Prioriser les sections présentant une corrosion visible ou un débit réduit. Obtenir 3 soumissions de plombiers certifiés.";
        if (issueLabel.toLowerCase().includes("corrosion") && issueLabel.toLowerCase().includes("réservoir")) return "Un chauffe-eau présentant des traces de corrosion au bas du réservoir est en fin de vie imminente. Prévoir le remplacement à brève échéance pour éviter un dégât d'eau. Vérifier la garantie du fabricant.";

        // --- Recommandations Cheminée & Foyer ---
        if (issueLabel.toLowerCase().includes("chapeau") && issueLabel.toLowerCase().includes("cheminée")) return "Installer un chapeau de cheminée (pare-pluie) en acier inoxydable avec grillage anti-vermine. Coût modéré — prévient l'infiltration d'eau, la nidification et le refoulement de vent. Travail accessible à un couvreur ou un ramoneur certifié WETT.";
        if (issueLabel.toLowerCase().includes("solin") && issueLabel.toLowerCase().includes("cheminée")) return "Faire refaire les solins de cheminée par un couvreur qualifié avec du solinage en plomb, aluminium ou acier inoxydable. Appliquer un scellant élastomère compatible. Source majeure d'infiltrations d'eau — à traiter en priorité avant l'hiver.";
        if (issueLabel.toLowerCase().includes("couronne") && issueLabel.toLowerCase().includes("cheminée")) return "Faire réparer ou refaire la couronne de cheminée en béton par un maçon qualifié. Appliquer un scellant de couronne (CrownCoat ou équivalent). Une couronne intacte prévient jusqu'à 90% des infiltrations d'eau dans la cheminée.";
        if (issueLabel.toLowerCase().includes("registre") || issueLabel.toLowerCase().includes("damper")) return "Faire réparer ou remplacer le registre (damper) par un technicien certifié WETT. Un registre fonctionnel est essentiel pour contrôler le tirage, prévenir les pertes thermiques en hiver et empêcher la vermine d'entrer par la cheminée.";
        if (issueLabel.toLowerCase().includes("chemisage") || issueLabel.toLowerCase().includes("liner")) return "URGENT : Faire installer un chemisage de cheminée (liner) certifié en acier inoxydable par un technicien WETT avant toute utilisation. Un appareil à combustion raccordé à une cheminée non chemisée constitue un risque d'incendie et de monoxyde de carbone.";
        if (issueLabel.toLowerCase().includes("tirage") && issueLabel.toLowerCase().includes("foyer")) return "Faire inspecter la cheminée par un technicien WETT avec caméra d'inspection. Vérifier l'absence de blocage, d'oiseau, de créosote ou de fissure. Un mauvais tirage peut indiquer un problème de pression entre l'intérieur et l'extérieur — envisager une VMC ou une prise d'air dédiée.";
        if (issueLabel.toLowerCase().includes("distance") && issueLabel.toLowerCase().includes("foyer")) return "Faire corriger les distances de dégagement par un entrepreneur qualifié WETT. Le Code National du Bâtiment exige des distances minimales entre tout appareil à combustion et les matériaux combustibles. Documenter les mesures actuelles avec photos.";

        // --- Recommandations Garage Attaché ---
        if (issueLabel.toLowerCase().includes("porte coupe-feu") || (issueLabel.toLowerCase().includes("porte") && issueLabel.toLowerCase().includes("garage") && issueLabel.toLowerCase().includes("coupe"))) return "URGENT — SÉCURITÉ INCENDIE : Faire installer une porte coupe-feu homologuée (résistance minimale 20 minutes, auto-fermante) entre le garage et le logement. Exigence absolue du Code National du Bâtiment pour tout garage attaché. Faire exécuter par un entrepreneur certifié RBQ.";
        if (issueLabel.toLowerCase().includes("gypse") && issueLabel.toLowerCase().includes("garage")) return "Faire revêtir le plafond et les murs communs du garage de panneaux de gypse Type X (5/8 po ignifuge) par un entrepreneur certifié RBQ. Exigence du CNB pour tout garage attaché — barrière coupe-feu entre le garage et le logement.";
        if (issueLabel.toLowerCase().includes("inversion") && issueLabel.toLowerCase().includes("porte")) return "DANGER D'ÉCRASEMENT : Faire réparer ou remplacer le système d'inversion automatique de la porte de garage motorisée par un technicien certifié. Tester en plaçant un objet de 4 cm sous la porte — elle doit s'inverser au contact. Exigence de sécurité depuis 1993 au Canada.";
        if (issueLabel.toLowerCase().includes("co") && issueLabel.toLowerCase().includes("garage")) return "Faire installer un détecteur de CO homologué dans l'espace de vie adjacent au garage et dans tout couloir y donnant accès. Exigence du Code de sécurité incendie du Québec pour tout garage attaché. Utiliser un modèle avec alarme auditive et affichage numérique.";
        if (issueLabel.toLowerCase().includes("gfci") && issueLabel.toLowerCase().includes("garage")) return "Faire installer des prises DDFT (GFCI) par un électricien certifié sur tous les circuits du garage. Zone humide — exigence absolue du Code Électrique du Québec. Les prises existantes sans GFCI constituent un risque d'électrocution et de départ d'incendie.";
        if (issueLabel.toLowerCase().includes("ventilation") && issueLabel.toLowerCase().includes("garage")) return "Faire installer un système de ventilation mécanique dans le garage fermé (soupirail ou ventilateur d'extraction) pour prévenir l'accumulation de monoxyde de carbone et de vapeurs d'essence. Particulièrement critique si des véhicules à moteur sont démarrés à l'intérieur.";
        if (issueLabel.toLowerCase().includes("étanchéité") && issueLabel.toLowerCase().includes("garage")) return "Faire appliquer un coupe-froid continu (bas de porte, joints de cadrage) entre le garage et tous les espaces de vie adjacents. Sceller les passages de tuyauterie, câbles et conduits avec un mastic coupe-feu (mortier intumescent) pour prévenir l'infiltration de CO et de gaz.";

        // --- Recommandations Matières Dangereuses ---
        if (issueLabel.toLowerCase().includes("vermiculite") || (issueLabel.toLowerCase().includes("amiante") && issueLabel.toLowerCase().includes("isolant"))) return "DANGER AMIANTE : Ne pas manipuler ni perturber cet isolant. Faire procéder à un test de caractérisation par un laboratoire accrédité (échantillon de 30g suffit). Si positif, faire effectuer la décontamination par une firme certifiée en désamiantage selon les règles de la CNESST. Informer tous les entrepreneurs de la présence potentielle avant tout travail.";
        if (issueLabel.toLowerCase().includes("amiante") && issueLabel.toLowerCase().includes("calorifuge")) return "DANGER AMIANTE : Ce calorifugeage suspect ne doit pas être touché, percé ni perturbé. Faire analyser par un hygiéniste industriel accrédité. Si la présence d'amiante est confirmée, la dépose doit être effectuée par une firme spécialisée certifiée CNESST avec plan de travail approuvé.";
        if (issueLabel.toLowerCase().includes("amiante") && issueLabel.toLowerCase().includes("tuile")) return "DANGER AMIANTE : Les tuiles de plancher 9x9 po d'avant 1980 contiennent souvent de l'amiante dans l'adhésif et la tuile elle-même. Ne jamais poncer, arracher ou percer ces tuiles. Faire analyser avant tout travail de rénovation. Si intactes et recouvertes, elles peuvent souvent être conservées en l'état.";
        if (issueLabel.toLowerCase().includes("plomb") && issueLabel.toLowerCase().includes("peinture")) return "DANGER PLOMB : Faire analyser la peinture suspecte par un test de détection au plomb (kit XRF ou laboratoire). Ne pas poncer, décaper ni perturber la peinture avant confirmation. Si positive, la dépose doit être effectuée selon les normes CNESST (combinaison, aspirateur HEPA, confinement). Risque particulièrement élevé pour les jeunes enfants.";
        if (issueLabel.toLowerCase().includes("plomb") && issueLabel.toLowerCase().includes("tuyaux")) return "DANGER PLOMB : Faire remplacer toute la tuyauterie en plomb par du cuivre ou du PEX par un plombier certifié RBQ. En attendant le remplacement : laisser couler l'eau froide 2-3 minutes avant consommation et ne jamais utiliser l'eau chaude du robinet pour cuisiner ou boire. Faire analyser l'eau potable par un laboratoire accrédité.";
        if (issueLabel.toLowerCase().includes("pyrite")) return "DANGER PYRITE : Ne pas minimiser — le soulèvement ou la fissuration caractéristique en réseau de la dalle de béton est un indice sérieux. Faire effectuer un test de laboratoire par un géotechnicien accrédité (échantillon de granulat de remblai). Si positif, les travaux correctifs (remplacement de la dalle) sont coûteux — facteur important dans la négociation d'achat. Consulter le Programme de protection contre la pyrite du Québec.";
        if (issueLabel.toLowerCase().includes("radon")) return "Recommander fortement un test au radon sur une période de 3 mois (test passif au charbon actif — environ 30$). Si le résultat dépasse 200 Bq/m³ (seuil de Santé Canada), faire installer un système de mitigation (dépressurisation sous-dalle) par un professionnel certifié CARST/C-NRPP. Exiger le test comme condition d'achat dans les zones à risque.";
        if (issueLabel.toLowerCase().includes("citerne") || (issueLabel.toLowerCase().includes("mazout") && issueLabel.toLowerCase().includes("sol"))) return "Faire procéder à une évaluation environnementale de Phase I par un consultant accrédité pour déterminer la présence et l'état de la citerne et la possible contamination du sol. Si une citerne hors d'usage est présente, elle doit être vidangée, nettoyée et retirée ou neutralisée selon les normes du MELCCFP du Québec.";
        if (issueLabel.toLowerCase().includes("formaldehyde") || issueLabel.toLowerCase().includes("cov")) return "Recommander une période d'aération intensive après l'installation de nouveaux matériaux (panneaux de particules, MDF). Exiger les fiches techniques LEED des matériaux si possible. En cas d'odeur persistante, faire mesurer la qualité de l'air par un hygiéniste industriel accrédité (COV totaux, formaldéhyde).";

        // --- Recommandations existantes ---
        if (issueLabel.includes("Thermos")) return "Remplacer le vitrage scellé pour restaurer l'efficacité énergétique.";
        if (issueLabel.includes("cuivre/aluminium")) return "Faire installer des marrettes spéciales anti-oxydation (Al/Cu) par un électricien certifié.";
        if (issueLabel.includes("calfeutrage")) return "Retirer l'ancien mastic, nettoyer et appliquer un calfeutrage à base de silicone de qualité sanitaire.";
        if (issueLabel.includes("sécheuse")) return "Remplacer immédiatement les conduites en plastique/annelées par de la gaine métallique rigide ventilée directement à l'extérieur pour prévenir les incendies.";
        if (issueLabel.includes("vrc") || issueLabel.includes("hotte") || issueLabel.includes("conduit")) return "Faire intervenir un spécialiste en CVAC pour assurer une évacuation conforme rigide vers l'extérieur et/ou nettoyer l'échangeur d'air mécaniquement.";
        if (issueLabel.includes("mise à la terre") || issueLabel.includes("disjoncteurs")) return "Engager un maître électricien pour effectuer la liaison à la terre sur l'entrée d'eau et corriger les anomalies du panneau (double-tap, AFCI manquants).";
        if (issueLabel.includes("puisard") || issueLabel.includes("clapet")) return "Faire appel à un plombier pour réparer la pompe de puisard, installer un clapet anti-retour ou sceller hermétiquement la fausse de rétention de gaz radon.";
        if (issueLabel.includes("fosse") || issueLabel.includes("débordement")) return "Contrôler la consommation d'eau et contacter d'urgence une firme en assainissement pour la vidange. Une évaluation de la compaction du champ d'épuration est requise.";
        if (issueLabel.includes("puits") || issueLabel.includes("contamination")) return "Recommander fortement au client de faire effectuer une analyse d'eau (bactériologique et physico-chimique) en laboratoire accrédité avant de boire l'eau.";
        if (issueLabel.includes("ancrages") || issueLabel.includes("panneaux")) return "Faire inspecter les fixations par un couvreur qualifié pour ré-imperméabiliser les points d'ancrage et stopper la détérioration du toit.";
        if (issueLabel.includes("batteries") || issueLabel.includes("interrupteur") || issueLabel.includes("onduleur")) return "Missionner d'urgence un électricien spécialisé en énergie solaire pour sécuriser la ventilation des batteries et installer un interrupteur extérieur (Rapid Shutdown).";
        if (issueLabel.includes("pente négative") || issueLabel.includes("gouttière")) return "Remblayer avec de la terre glaise pour recréer une pente positive s'éloignant des murs, et installer des rallonges sous les descentes pluviales.";
        if (issueLabel.includes("végétation") || issueLabel.includes("arbres matures")) return "Dégager/Couper la végétation à un minimum de 1 mètre du parement. Surveiller étroitement le bon fonctionnement du drain français suite à la proximité des racines.";
        if (issueLabel.includes("drainage autour") || issueLabel.includes("drain")) return "Faire une inspection par caméra (endoscopie) du drain ou améliorer le drainage périphérique (pentes, tranchée drainante) pour éviter l'accumulation d'eau.";
        if (issueLabel.includes("pare-vapeur")) return "Installer un pare-vapeur continu (polyéthylène 6 mil) sur tout le sol exposé du vide sanitaire et bien sceller les rebords pour stopper l'humidité.";
        if (issueLabel.includes("membrane") && issueLabel.includes("murs")) return "Installer/réparer la membrane d'imperméabilisation sur les murs intérieurs exposés pour couper la migration capillaire de l'humidité.";
        if (issueLabel.includes("gouttières") || issueLabel.includes("pente négative")) return "Corriger la pente du terrain pour éloigner les eaux de ruissellement des pilotis/fondation et s'assurer que les gouttières rejettent l'eau à au moins 1,5m.";
        if (issueLabel.includes("pourriture") && issueLabel.includes("pilotis")) return "Faire évaluer la capacité structurale par un entrepreneur et remplacer les pièces de bois affectées par du bois traité sous pression adéquat.";
        if (issueLabel.includes("xylophage") || issueLabel.includes("termite")) return "Aviser un exterminateur spécialiste d'urgence pour éradiquer la colonie, suivi d'une évaluation par un charpentier/menuisier pour remplacer le bois structurel rongé.";
        if (issueLabel.includes("guêpe") || issueLabel.includes("vermine")) return "Faire appel à un spécialiste en gestion parasitaire pour éliminer la menace et sceller les points d'entrée (calfeutrage, grillages).";
        return "Faire évaluer et corriger par un entrepreneur spécialisé selon les règles de l'art.";
    },

    // Agent Assistant (Multi-Modèles Connectés)
    askAssistant: async function(question) {
        // Priorité 1 : localStorage (configuration manuelle via l'UI)
        // Priorité 2 : config.js (configuration permanente par défaut)
        const apiKey = localStorage.getItem('inspectpro_api_key') 
                    || (typeof KZO_CONFIG !== 'undefined' ? KZO_CONFIG.apiKey : null);
        const provider = localStorage.getItem('inspectpro_api_provider') 
                    || (typeof KZO_CONFIG !== 'undefined' ? KZO_CONFIG.provider : 'gemini');
        
        // --- MODE SIMULÉ (Sans Clé API) ---
        if (!apiKey) {
            const q = question.toLowerCase();
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (q.includes("fondation") && q.includes("1965")) {
                        resolve("[Simulation] Pour une maison de 1965, soyez particulièrement attentif aux fissures de tassement, à l'absence possible de drain français.");
                    } else if (q.includes("aluminium")) {
                        resolve("[Simulation] Le filage d'aluminium a été utilisé principalement entre 1965 et 1976. Risque d'incendie! Recommander une inspection par un électricien.");
                    } else if (q.includes("rédige") || q.includes("redige") || q.includes("rapport") || q.includes("observation")) {
                        resolve("[Simulation] ⚠️ Pour générer automatiquement les textes de rapport, configurez une clé API Groq (gratuite) via l'engrenage ⚙️ en haut à droite.");
                    } else {
                        resolve("⚠️ Mode démo hors-ligne. Cliquez sur ⚙️ pour configurer votre clé API Groq (gratuit), Gemini, ChatGPT ou Claude.");
                    }
                }, 1000);
            });
        }

        // --- MODE INTELLIGENT (Avec Clé API) ---
        try {
            let textResponse = "";

            if (provider === 'gemini') {
                // Étape 1 : Auto-découverte des modèles (pour contourner les restrictions régionales/de clés API)
                let selectedModelName = "models/gemini-1.5-flash"; // Par défaut
                try {
                    const checkModelsRes = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey);
                    if (checkModelsRes.ok) {
                        const modelsData = await checkModelsRes.json();
                        if (modelsData.models && modelsData.models.length > 0) {
                            // On cherche en priorité "flash" ou "pro" qui supporte generateContent
                            const validModels = modelsData.models.filter(m => m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("gemini"));
                            if (validModels.length > 0) {
                                // Essaie de prendre flash 1.5, sinon le premier de la liste
                                const preferred = validModels.find(m => m.name.includes("gemini-1.5-flash")) || validModels[0];
                                selectedModelName = preferred.name;
                            } else {
                                return "❌ Erreur API Gemini : Votre clé API ne possède les droits pour aucun modèle de génération de texte.";
                            }
                        }
                    }
                } catch (e) { console.error("Erreur découverte des modèles: ", e); }

                const url = "https://generativelanguage.googleapis.com/v1beta/" + selectedModelName + ":generateContent?key=" + apiKey;
                const systemPrompt = "Tu es l'assistant IA expert d'un Inspecteur en Bâtiment d'Habitation certifié RBQ au Québec. Tu maîtrises parfaitement : la norme BNQ 3009-500 (Pratiques pour l'inspection en vue d'une transaction immobilière), le REIBH 2024 (RBQ), le Code National du Bâtiment (CNB 2020), le Code de Construction du Québec, le Code Électrique du Québec, le Code de Plomberie, les normes AIBQ et InterNACHI, ainsi que les réglementations spécifiques au Québec (pyrite, amiante, radon, plomb). Tu connais les normes cheminée (NFPA 211), gaz (CSA B149.1), garage attaché, matières dangereuses et systèmes mécaniques. Réponds de manière experte, précise et concise en référençant toujours la norme ou le code applicable. Recommande toujours la sécurité.\n\nQuestion de l'inspecteur : " + question;
                
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: systemPrompt }] }]
                    })
                });
                
                if (!response.ok) {
                    const errData = await response.json();
                    return "❌ Erreur API Gemini : " + (errData.error?.message || response.status);
                }
                
                const data = await response.json();
                textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            } else if (provider === 'openai') {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
                    body: JSON.stringify({ model: "gpt-4o", messages: [{role: "system", content: "Tu es l'assistant IA expert d'un Inspecteur en Bâtiment d'Habitation certifié RBQ au Québec. Tu maîtrises parfaitement : la norme BNQ 3009-500, le REIBH 2024 (RBQ), le Code National du Bâtiment (CNB 2020), le Code Électrique du Québec, le Code de Plomberie, les normes AIBQ et InterNACHI, ainsi que les réglementations québécoises (pyrite, amiante, radon, plomb, garage, cheminée, matières dangereuses). Réponds de manière experte, précise et concise en citant toujours la norme applicable. Recommande toujours la sécurité et l'évaluation par un spécialiste si nécessaire."}, {role: "user", content: question }]})
                });
                if (!response.ok) {
                    const errData = await response.json();
                    return "❌ Erreur API OpenAI : " + (errData.error?.message || response.status);
                }
                const data = await response.json();
                textResponse = data.choices?.[0]?.message?.content;

            } else if (provider === 'anthropic') {
                const response = await fetch("https://api.anthropic.com/v1/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                        "anthropic-dangerous-direct-browser-access": "true"
                    },
                    body: JSON.stringify({
                        model: "claude-sonnet-4-5",
                        system: "Tu es l'assistant IA expert d'un Inspecteur en Bâtiment d'Habitation certifié RBQ au Québec. Tu maîtrises parfaitement : la norme BNQ 3009-500 (Pratiques pour l'inspection en vue d'une transaction immobilière), le REIBH 2024 (RBQ), le Code National du Bâtiment (CNB 2020), le Code de Construction du Québec, le Code Électrique du Québec (CEQ), le Code de Plomberie du Québec, les normes AIBQ, InterNACHI et Réseau IBC, ainsi que les réglementations spécifiques au Québec (pyrite, pyrrhotite, amiante, radon, plomb). Tu connais les normes cheminée (NFPA 211), gaz (CSA B149.1), garage attaché (porte coupe-feu, gypse Type X, CO), matières dangereuses et systèmes mécaniques. Réponds de manière experte, précise, concise en référençant toujours la norme ou le code applicable. Recommande toujours la sécurité et l'évaluation par un spécialiste si nécessaire.",
                        messages: [{role: "user", content: question }],
                        max_tokens: 1024
                    })
                });
                if (!response.ok) {
                    const errData = await response.json();
                    return "❌ Erreur API Anthropic : " + (errData.error?.message || response.status);
                }
                const data = await response.json();
                textResponse = data.content?.[0]?.text;

            } else if (provider === 'groq') {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: "Tu es l'assistant IA expert d'un Inspecteur en Bâtiment d'Habitation certifié RBQ au Québec. Tu maîtrises parfaitement : la norme BNQ 3009-500 (Pratiques pour l'inspection en vue d'une transaction immobilière), le REIBH 2024 (RBQ), le Code National du Bâtiment (CNB 2020), le Code de Construction du Québec, le Code Électrique du Québec (CEQ), le Code de Plomberie du Québec, les normes AIBQ, InterNACHI et Réseau IBC, ainsi que les réglementations spécifiques au Québec (pyrite, pyrrhotite, amiante, radon, plomb). Tu connais les normes cheminée (NFPA 211), gaz (CSA B149.1), garage attaché (porte coupe-feu, gypse Type X, CO), matières dangereuses et systèmes mécaniques. Réponds de manière experte, précise, concise en référençant toujours la norme ou le code applicable. Recommande toujours la sécurité et l'évaluation par un spécialiste si nécessaire." },
                            { role: "user", content: question }
                        ],
                        max_tokens: 1024
                    })
                });
                if (!response.ok) {
                    const errData = await response.json();
                    return "❌ Erreur API Groq : " + (errData.error?.message || response.status);
                }
                const data = await response.json();
                textResponse = data.choices?.[0]?.message?.content;
            }
            
            if (!textResponse) {
                return "Je suis désolé, je n'ai pas pu générer une réponse claire.";
            }

            // Sécurité : échapper tout HTML brut renvoyé par le LLM AVANT d'appliquer
            // le markdown maison. Sans ça, une prompt-injection pourrait faire renvoyer
            // <script> ou <img onerror=...> qui s'exécuterait via innerHTML côté chat.
            const escapeDiv = document.createElement('div');
            escapeDiv.textContent = textResponse;
            const safe = escapeDiv.innerHTML;

            return safe
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>');

        } catch (error) {
            console.error("Fetch API Error:", error);
            return "❌ Erreur de réseau : Impossible de contacter le serveur " + provider + ".";
        }
    }
};
