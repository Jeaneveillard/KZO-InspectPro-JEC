// ============================================================
//  KZO InspectPro — Bibliothèque de modèles de commentaires
//  Phrases pré-écrites en style AIBQ (voix impersonnelle, factuelle)
//  pour accélérer la saisie sur le terrain.
// ============================================================

const COMMENT_TEMPLATES = {

    // ---------- FALLBACK GÉNÉRIQUE ----------
    // Utilisé pour toute sous-section qui n'a pas de modèle spécifique.
    generic: {
        positive: [
            "L'inspection visuelle non-destructive de cette section n'a révélé aucun défaut d'importance immédiate. Entretien préventif recommandé selon le calendrier saisonnier.",
            "Les éléments visibles et accessibles ont été examinés et apparaissent en bon état général au moment de l'inspection.",
            "Aucune anomalie notable n'a été observée dans cette section. Cette observation est basée sur une inspection visuelle non invasive."
        ],
        negative: [
            "Il a été observé une ou plusieurs anomalies dans cette section. Une évaluation par un spécialiste qualifié est recommandée pour préciser l'ampleur et le coût des correctifs.",
            "Plusieurs éléments présentent des signes de vieillissement ou de détérioration. Une intervention préventive est suggérée à court terme afin d'éviter une aggravation.",
            "Des défauts ont été notés à plusieurs endroits. Un suivi documenté (photos et localisation) est requis avant intervention corrective."
        ]
    },

    // ---------- PAR SECTION ----------
    // Ces modèles s'appliquent à toutes les sous-sections de la section concernée.
    bySection: {

        s_struct: {
            positive: [
                "L'enveloppe extérieure et la fondation visible apparaissent en bon état général. Aucune fissure structurelle n'a été observée et le drainage périphérique semble adéquat au moment de l'inspection.",
                "Le revêtement extérieur, les ouvertures et la pente du terrain ont été examinés ; aucun élément ne présente de défaut d'importance immédiate.",
                "L'inspection visuelle de la fondation, des murs extérieurs et des aménagements n'a révélé aucun signe d'infiltration active ni de mouvement structural."
            ],
            negative: [
                "Des fissures et signes d'infiltration ont été observés sur la fondation. Une évaluation par un ingénieur en structure est recommandée afin de préciser l'origine et l'ampleur des correctifs.",
                "La pente du terrain et le drainage périphérique présentent des déficiences. Une correction de la mise en pente est recommandée pour éloigner les eaux de ruissellement de la fondation.",
                "Le revêtement extérieur présente des dommages (fissures, joints dégradés ou pourriture). Une intervention par un entrepreneur qualifié est requise avant aggravation."
            ]
        },

        s_int: {
            positive: [
                "Les planchers, murs et plafonds visibles apparaissent en bon état général. Aucune trace d'infiltration récente ni de fissure active n'a été observée au moment de l'inspection.",
                "Les escaliers, garde-corps, portes et fenêtres ont été inspectés ; les éléments visibles et accessibles fonctionnent normalement.",
                "Les détecteurs de fumée et de monoxyde de carbone sont présents aux emplacements requis et apparaissent fonctionnels."
            ],
            negative: [
                "Des fissures ou taches d'infiltration ont été notées sur certains plafonds ou murs. Une recherche de la source d'humidité est recommandée avant les travaux de réfection.",
                "Les garde-corps ou escaliers présentent des déficiences (hauteur insuffisante, espacement de barreaux non conforme, instabilité). Une mise aux normes selon le CNB est recommandée.",
                "Les détecteurs de fumée ou de monoxyde de carbone sont absents, mal positionnés ou en fin de vie utile. Le remplacement et l'ajout de détecteurs conformes sont requis."
            ]
        },

        s_toit: {
            positive: [
                "La couverture du toit, les solins et les évents apparaissent en bon état apparent. Aucun signe d'infiltration ou de gondolement n'a été observé depuis le sol.",
                "Le grenier visité est ventilé adéquatement et l'isolation présente une épaisseur appropriée. Aucune trace d'humidité, de condensation ou de moisissure n'est visible.",
                "L'inspection visuelle de la toiture et de l'entretoit n'a révélé aucune anomalie majeure au moment de l'inspection."
            ],
            negative: [
                "Les bardeaux d'asphalte présentent des signes de vieillissement avancé (perte de granules, gondolement, coins relevés). Le remplacement de la couverture devrait être planifié à court terme.",
                "Les solins, le chapeau de cheminée ou les évents présentent des déficiences pouvant entraîner des infiltrations. Une intervention rapide par un couvreur est recommandée.",
                "La ventilation du grenier ou l'isolation est insuffisante. Une correction est requise pour prévenir la formation de glace de rive et la condensation hivernale."
            ]
        },

        s_cheminee: {
            positive: [
                "La cheminée extérieure, son chapeau, ses solins et son couronnement apparaissent en bon état. Aucun signe de dégradation de la maçonnerie n'a été observé.",
                "Le foyer et son âtre sont propres et fonctionnels en apparence. Le tirage et le registre semblent opérationnels au moment de l'inspection.",
                "Aucune anomalie immédiate n'a été notée sur la cheminée ou le foyer. Un ramonage annuel par un professionnel certifié WETT est néanmoins recommandé."
            ],
            negative: [
                "Le chapeau de cheminée est absent ou endommagé. L'eau de précipitation accélère la dégradation du conduit ; une réparation immédiate est recommandée.",
                "Les solins de cheminée présentent des déficiences pouvant causer des infiltrations dans la structure du toit. Une intervention par un couvreur est requise.",
                "Le foyer ou son chemisage présente des fissures ou un mauvais tirage. Une évaluation par un technicien WETT est recommandée avant toute utilisation, en raison du risque d'incendie ou de refoulement de monoxyde de carbone."
            ]
        },

        s_garage: {
            positive: [
                "La structure du garage et son étanchéité apparaissent en bon état général. La séparation coupe-feu avec le logement (porte et gypse Type X) semble conforme.",
                "Les systèmes du garage, incluant la porte motorisée, le mécanisme d'inversion et la ventilation, fonctionnent normalement au moment de l'inspection.",
                "Aucune anomalie significative n'a été observée dans le garage attaché."
            ],
            negative: [
                "La porte coupe-feu entre le garage et le logement est absente, endommagée ou non conforme. Cette déficience de sécurité incendie doit être corrigée sans délai (exigence CNB).",
                "La séparation coupe-feu en gypse Type X présente des perforations ou est incomplète. Une mise aux normes est requise pour assurer la résistance au feu d'au moins 1 heure.",
                "Le mécanisme d'inversion de la porte de garage motorisée ne fonctionne pas correctement. Cette déficience présente un risque d'écrasement et doit être corrigée d'urgence."
            ]
        },

        s_plomb: {
            positive: [
                "Le système de plomberie visible (alimentation, évacuation, chauffe-eau, robinetterie) apparaît en bon état général. Aucune fuite active n'a été observée au moment de l'inspection.",
                "Le chauffe-eau et la tuyauterie sont d'âge raisonnable et présentent un fonctionnement normal. La soupape TPR est présente et l'évacuation est adéquate.",
                "Les renvois et raccords visibles ne présentent aucun signe d'humidité ou de corrosion active."
            ],
            negative: [
                "Le chauffe-eau approche ou dépasse sa fin de vie utile (10–15 ans). Un remplacement devrait être planifié à court terme afin d'éviter une fuite imprévue.",
                "La tuyauterie d'alimentation est partiellement en matériaux désuets (galvanisé, plomb). Une mise à niveau par un plombier licencié est recommandée pour assurer la qualité de l'eau et la pression.",
                "Des traces de fuites ou de corrosion ont été observées sur certains raccords. Une évaluation et des correctifs par un plombier sont requis pour prévenir les dommages d'eau."
            ]
        },

        s_elec: {
            positive: [
                "L'entrée électrique, le panneau de distribution et le câblage visible apparaissent en bon état. Les disjoncteurs sont identifiés et le dégagement frontal est respecté.",
                "Les prises et interrupteurs vérifiés fonctionnent normalement. Les prises GFCI sont présentes aux emplacements humides requis et fonctionnelles.",
                "Aucune anomalie électrique majeure n'a été observée au moment de l'inspection."
            ],
            negative: [
                "Le panneau électrique présente des déficiences (capacité insuffisante, modèle reconnu défaillant comme Federal Pacific Stab-Lok ou Zinsco, double-tap, fusibles désuets). Une évaluation par un maître électricien est requise.",
                "Du câblage en aluminium ou non conforme a été identifié. Compte tenu du risque d'incendie connu, une inspection complète et la pose de connexions COPALUM ou AlumiConn sont recommandées.",
                "Les prises GFCI sont absentes ou non fonctionnelles aux emplacements humides (cuisine, salle de bain, extérieur). La mise aux normes par un électricien licencié est requise pour la sécurité des occupants."
            ]
        },

        s_cvac: {
            positive: [
                "Le système de chauffage principal (fournaise, thermopompe, plinthes, chaudière) fonctionne normalement et apparaît bien entretenu. Le filtre est propre et les conduits sont en bon état.",
                "La ventilation mécanique (VRC, hotte, ventilateurs) est fonctionnelle et le débit semble approprié. Aucune odeur ni signe de mauvaise qualité de l'air n'a été noté.",
                "L'âge des équipements est raisonnable et leur durée de vie résiduelle est satisfaisante."
            ],
            negative: [
                "Le système de chauffage approche ou a dépassé sa fin de vie utile. Un remplacement devrait être planifié et budgétisé à court ou moyen terme.",
                "L'échangeur thermique de la fournaise présente des signes pouvant indiquer une fissure (risque de monoxyde de carbone). Une évaluation immédiate par un technicien certifié est requise avant toute utilisation prolongée.",
                "La ventilation mécanique est absente, déficiente ou mal raccordée. Une intervention est recommandée pour assurer une bonne qualité de l'air intérieur et éviter la condensation."
            ]
        },

        s_cuis: {
            positive: [
                "Les installations de cuisine et des salles de bain (robinetterie, drains, ventilation, électroménagers fixes) fonctionnent normalement. Aucune fuite ni signe d'infiltration n'a été observé.",
                "Les surfaces, comptoirs, armoires et céramiques sont en bon état apparent. La hotte et les ventilateurs de salles de bain sont fonctionnels.",
                "Aucune anomalie significative n'a été notée dans les pièces d'eau au moment de l'inspection."
            ],
            negative: [
                "De la robinetterie ou des drains présentent des fuites ou des signes de corrosion. Une intervention par un plombier est requise pour éviter les dommages aux armoires et planchers.",
                "Le scellant autour des baignoires, douches ou comptoirs est dégradé. Le rejointoiement est recommandé à court terme pour prévenir l'infiltration et la formation de moisissures.",
                "La ventilation des salles de bain ou de la cuisine est insuffisante ou mal évacuée. Une correction est requise pour évacuer correctement l'humidité vers l'extérieur."
            ]
        },

        s_danger: {
            positive: [
                "Aucun matériau dangereux apparent (vermiculite, calorifugeage suspect, peinture écaillée pré-1980, citerne enterrée) n'a été identifié visuellement au moment de l'inspection.",
                "Les zones susceptibles de contenir des matières dangereuses ont été examinées dans la limite de l'inspection visuelle non invasive. Aucun élément suspect n'a été noté.",
                "Un test de radon est néanmoins recommandé conformément aux pratiques actuelles de Santé Canada, le radon étant la deuxième cause de cancer du poumon au pays."
            ],
            negative: [
                "De la vermiculite Zonolite est suspectée dans l'isolant du grenier. Compte tenu du risque de contamination à l'amiante (mine Libby), aucune perturbation ne doit être effectuée avant analyse en laboratoire accrédité.",
                "Du calorifugeage en amiante est suspecté autour de tuyauterie ou d'équipements. S'il est endommagé, il libère des fibres carcinogènes. Une analyse et un plan de gestion par un entrepreneur certifié sont recommandés.",
                "Un test de radon est fortement recommandé : le bouclier canadien est une zone à risque connue. La mesure se fait sur 90 jours minimum en saison de chauffage."
            ]
        }
    },

    // ---------- PAR SOUS-SECTION (priorité maximale) ----------
    // Surcharge ponctuelle pour les sous-sections très spécifiques.
    bySubSection: {

        ss_da_1: { // Amiante
            positive: [
                "Aucun matériau suspect d'amiante n'a été identifié visuellement au moment de l'inspection. Note : seul un échantillonnage en laboratoire accrédité peut confirmer l'absence d'amiante."
            ],
            negative: [
                "De la vermiculite Zonolite est suspectée dans l'isolant du grenier. Le risque de contamination à l'amiante (mine Libby, Montana) est de l'ordre de 70 % selon les études disponibles. Aucune perturbation ne doit être effectuée avant analyse en laboratoire accrédité.",
                "Du calorifugeage en amiante est suspecté sur la tuyauterie ou les équipements de chauffage. S'il est intact, il peut être laissé en place sous surveillance. S'il est endommagé ou friable, une décontamination par entrepreneur certifié est requise."
            ]
        },

        ss_da_2: { // Plomb et Pyrite
            positive: [
                "Aucun signe visible de peinture au plomb ni de pyrite dans le remblai n'a été identifié au moment de l'inspection."
            ],
            negative: [
                "La pyrite dans le remblai sous la dalle de béton réagit chimiquement et peut faire gonfler et fissurer la dalle de façon irréversible. Une caractérisation pétrographique du remblai (norme CTQ-M200) est recommandée pour les bâtiments construits dans les zones à risque.",
                "La peinture en place dans une maison construite avant 1980 peut contenir du plomb. Si elle est écaillée ou si des travaux sont prévus, un test au plomb est recommandé, particulièrement pour la sécurité des enfants."
            ]
        },

        ss_da_3: { // Radon
            positive: [
                "Aucun indicateur visuel n'a été noté, mais un test de radon de 90 jours en saison de chauffage est tout de même recommandé. Le radon est inodore et incolore, et seul un test peut le détecter."
            ],
            negative: [
                "Un test de radon est fortement recommandé. Le radon est la deuxième cause de cancer du poumon au Canada (3200 décès/an) et le bouclier canadien est une zone à risque connue. Si la concentration dépasse 200 Bq/m³, des mesures correctives (dépressurisation sous-dalle) sont requises."
            ]
        }
    }
};

// ============================================================
//  generateFieldVariants(label)
//  À partir d'un label de champ checkbox (ex. "Membrane pare-vapeur
//  au sol absente ou mal installée"), produit deux reformulations :
//    { positive: "Membrane pare-vapeur au sol présente et bien installée",
//      negative: "Membrane pare-vapeur au sol absente ou mal installée" }
//
//  Utilisé pour offrir un dropdown compact à la place du label texte
//  qui wrappe sur tablette.
// ============================================================
function generateFieldVariants(label) {
    if (!label || typeof label !== 'string') {
        return { positive: '', negative: '' };
    }

    // Paires de patterns négatifs → opposés positifs.
    // Ordre : du plus spécifique au plus générique.
    const replacements = [
        // "absent / manquant"
        [/\babsente?s?\b/gi, (m) => m.endsWith('es') ? 'présentes' : m.endsWith('s') ? 'présents' : m.endsWith('e') ? 'présente' : 'présent'],
        [/\bmanquante?s?\b/gi, (m) => m.endsWith('es') ? 'présentes' : m.endsWith('s') ? 'présents' : m.endsWith('e') ? 'présente' : 'présent'],

        // "mal installé / non conforme / non fonctionnel"
        [/\bmal install(é{1,2}e?s?)\b/gi, 'bien install$1'],
        [/\bnon[\s-]conformes?\b/gi, (m) => m.endsWith('s') ? 'conformes' : 'conforme'],
        [/\bnon[\s-]fonctionnel(le)?s?\b/gi, (m) => m.endsWith('les') ? 'fonctionnelles' : m.endsWith('le') ? 'fonctionnelle' : m.endsWith('ls') ? 'fonctionnels' : 'fonctionnel'],

        // États dégradés
        // Bug fix : "défectu(eux|euse)" → "fonctionn(el|elle)" — le radical
        // "fonctionn" prend une terminaison différente de "défectu", donc on
        // sépare en 2 patterns explicites.
        [/\bdéfectueuses?\b/gi, (m) => m.endsWith('s') ? 'fonctionnelles' : 'fonctionnelle'],
        [/\bdéfectueux\b/gi, 'fonctionnel'],
        [/\bdégradée?s?\b/gi, 'en bon état'],
        [/\bdétériorée?s?\b/gi, 'en bon état'],
        [/\bendommagée?s?\b/gi, (m) => m.endsWith('es') ? 'intactes' : m.endsWith('s') ? 'intacts' : m.endsWith('e') ? 'intacte' : 'intact'],
        [/\busée?s?\b/gi, 'en bon état'],
        [/\bcassée?s?\b/gi, (m) => m.endsWith('es') ? 'intactes' : m.endsWith('s') ? 'intacts' : m.endsWith('e') ? 'intacte' : 'intact'],
        [/\bbrisée?s?\b/gi, (m) => m.endsWith('es') ? 'intactes' : m.endsWith('s') ? 'intacts' : m.endsWith('e') ? 'intacte' : 'intact'],

        // Corrosion / rouille
        [/\bcorrodée?s?\b/gi, 'sans corrosion'],
        [/\bcorrosion\b/gi, 'aucune corrosion'],
        [/\brouillée?s?\b/gi, 'sans rouille'],
        [/\brouille\b/gi, 'aucune rouille'],

        // Fissures / fuites / humidité
        [/\bfissures?\b/gi, 'aucune fissure'],
        [/\bfuites?\b/gi, 'aucune fuite'],
        [/\bmoisissures?\b/gi, 'aucune moisissure'],
        [/\bpourritures?\b/gi, 'sans pourriture'],
        [/\binfiltrations?\b/gi, 'aucune infiltration'],

        // Obstructions / desserrements
        [/\bbouchée?s?\b/gi, (m) => m.endsWith('es') ? 'dégagées' : m.endsWith('s') ? 'dégagés' : m.endsWith('e') ? 'dégagée' : 'dégagé'],
        [/\bobstruée?s?\b/gi, (m) => m.endsWith('es') ? 'dégagées' : m.endsWith('s') ? 'dégagés' : m.endsWith('e') ? 'dégagée' : 'dégagé'],
        [/\bdesserrée?s?\b/gi, (m) => m.endsWith('es') ? 'serrées' : m.endsWith('s') ? 'serrés' : m.endsWith('e') ? 'serrée' : 'serré'],
        [/\binstables?\b/gi, (m) => m.endsWith('s') ? 'stables' : 'stable'],

        // Qualifiants
        [/\binsuffisante?s?\b/gi, (m) => m.endsWith('es') ? 'suffisantes' : m.endsWith('s') ? 'suffisants' : m.endsWith('e') ? 'suffisante' : 'suffisant'],
        [/\binadéquate?s?\b/gi, (m) => m.endsWith('es') ? 'adéquates' : m.endsWith('s') ? 'adéquats' : m.endsWith('e') ? 'adéquate' : 'adéquat'],
        [/\bsurchauffe\b/gi, 'sans surchauffe'],

        // "Risque de" — formulation conditionnelle
        // Bug fix : on sépare "risque d'" et "risque de" pour préserver
        // l'espace après "de" et l'apostrophe au bon endroit.
        [/\brisques? d'/gi, "aucun risque d'"],
        [/\brisques? de\b/gi, 'aucun risque de'],
    ];

    let positive = label;
    let foundMatch = false;

    for (const [pattern, replacement] of replacements) {
        // Recréer la regex à chaque tour pour éviter l'état persistant du flag /g.
        const re = new RegExp(pattern.source, pattern.flags);
        if (re.test(positive)) {
            positive = positive.replace(new RegExp(pattern.source, pattern.flags), replacement);
            foundMatch = true;
        }
    }

    // Fallback : si aucun pattern n'a matché, ajouter " — en bon état".
    if (!foundMatch) {
        positive = label + ' — en bon état';
    }

    return { positive, negative: label };
}

// ============================================================
//  Helper : retourne la liste des modèles applicables à une sous-section.
//  Priorité : bySubSection > bySection > generic.
// ============================================================
function getCommentTemplates(sectionId, subId) {
    const specific = COMMENT_TEMPLATES.bySubSection[subId] || {};
    const sectionLevel = COMMENT_TEMPLATES.bySection[sectionId] || {};
    const generic = COMMENT_TEMPLATES.generic;

    return {
        positive: [
            ...(specific.positive || []),
            ...(sectionLevel.positive || []),
            ...generic.positive
        ],
        negative: [
            ...(specific.negative || []),
            ...(sectionLevel.negative || []),
            ...generic.negative
        ]
    };
}
