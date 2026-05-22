// ============================================================
//  KZO InspectPro — Bibliothèque de modèles de commentaires
//  Phrases pré-écrites (voix impersonnelle, factuelle)
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

        ss_st_0: { // Aménagement et Pente
            positive: [
                "L'aménagement paysager, les entrées et la pente du terrain autour du bâtiment favorisent un bon écoulement des eaux de ruissellement loin des fondations. Aucune condition propice aux infiltrations d'eau n'a été observée à ce niveau.",
                "Le revêtement de l'entrée et les surfaces dures adjacentes sont en bon état et inclinés correctement vers le réseau de drainage. Aucun affaissement ni fissuration importante permettant l'accumulation d'eau n'a été noté.",
                "La végétation est bien entretenue et maintenue à une distance raisonnable du bâtiment. Les racines d'arbres matures ne semblent pas compromettre les fondations ou les services enterrés au moment de l'inspection."
            ],
            negative: [
                "Il a été observé une pente de terrain négative vers le bâtiment. Cette condition dirige les eaux de ruissellement directement vers les murs de fondation, augmentant considérablement le risque d'infiltration d'eau au sous-sol et de dégradation prématurée des matériaux. Nous recommandons de revoir l'aménagement paysager afin de créer une pente positive s'éloignant du bâtiment sur une distance d'au moins 1.5 mètre (5 pieds).",
                "Les descentes de gouttières déversent l'eau trop près des fondations. Cette concentration d'eau saturera le sol près des murs de fondation, ce qui peut surcharger le système de drainage (drain français) et provoquer des infiltrations. Nous recommandons l'installation de rallonges ou de blocs parapluies pour éloigner l'eau d'au moins 1.5 mètre du bâtiment.",
                "Des arbres matures sont implantés à moins de 3 mètres du bâtiment. Les racines peuvent envahir le drain français, fracturer les fondations et soulever les dallages. Une surveillance annuelle de l'état des fondations et du drainage est recommandée ; l'abattage ou l'élagage significatif peut être envisagé.",
                "Le revêtement de l'allée ou de la cour présente des affaissements importants créant des cuvettes où l'eau stagne à proximité du bâtiment. Ces zones d'accumulation favorisent la saturation du sol adjacent aux fondations. Des travaux de nivellement ou de réfection du revêtement sont recommandés."
            ]
        },

        ss_st_1: { // Fondations
            positive: [
                "L'inspection visuelle de la portion exposée des murs de fondation n'a révélé aucun signe de mouvement structural, d'efflorescence majeure ou de fissuration active au moment de l'inspection.",
                "Les murs de fondation sont d'aplomb et aucune déformation horizontale ou en escalier susceptible d'indiquer une poussée du sol n'a été observée. Le drain français apparent semble fonctionnel.",
                "Aucune humidité active, odeur de moisi ni trace d'infiltration récente n'a été détectée au sous-sol lors de l'inspection. Les conditions de drainage périphérique visible semblent adéquates."
            ],
            negative: [
                "Des fissures ont été observées sur les murs de fondation. Bien que certaines fissures puissent être attribuables au retrait normal du béton, toute ouverture dans la fondation représente une voie potentielle pour les infiltrations d'eau et les insectes. Nous recommandons de faire sceller ces fissures par l'extérieur ou par injection d'époxy/polyuréthane par un entrepreneur spécialisé afin de garantir l'étanchéité.",
                "La présence d'efflorescence (dépôts de sels minéraux blanchâtres) a été notée sur les murs de fondation intérieurs. Ce phénomène indique une migration d'humidité à travers le béton, souvent due à un drainage périphérique déficient ou en fin de vie utile. Nous recommandons de faire évaluer la condition du drain français par inspection télévisée (caméra) afin d'en vérifier la fonctionnalité."
            ]
        },

        ss_st_2: { // Revêtement extérieur
            positive: [
                "Le revêtement extérieur mural, les solins et les éléments d'étanchéité visibles apparaissent en bon état. Les joints de calfeutrage autour des ouvertures sont souples et assurent une bonne barrière contre les intempéries.",
                "Le revêtement de briques ou de maçonnerie est bien attaché, les joints de mortier sont intacts et aucune brique délogée ou fissure d'importance n'a été observée. Les larmiers et solins de linteau semblent correctement installés.",
                "Le lambris de vinyle ou de fibrociment est bien fixé, sans déformation ni section manquante. Les coins et raccords d'angles sont couverts de moulures appropriées assurant l'étanchéité de l'enveloppe."
            ],
            negative: [
                "Le revêtement extérieur présente des dommages et/ou des sections détériorées. Ces ouvertures dans l'enveloppe du bâtiment permettent l'infiltration d'eau et d'humidité dans la structure murale, ce qui peut causer de la pourriture cachée et le développement de moisissures. Une réparation immédiate par un menuisier ou un entrepreneur spécialisé est requise.",
                "Les joints de calfeutrage autour des portes, des fenêtres ou des pénétrations extérieures sont desséchés, fissurés ou manquants. L'intégrité de l'enveloppe est compromise. Nous recommandons de retirer le calfeutrage existant et de refaire tous les joints avec un scellant de haute qualité (ex. polyuréthane) pour prévenir toute infiltration d'eau."
            ]
        },

        ss_to_0: { // Toiture
            positive: [
                "La couverture du toit présente une usure normale pour son âge. Les bardeaux, les solins et les éléments de ventilation au toit sont bien en place et ne montrent aucune déficience d'importance immédiate."
            ],
            negative: [
                "La couverture du toit présente des signes d'usure avancée (gondolement, perte importante de granules, bardeaux fendillés ou manquants). Le revêtement a atteint ou dépassé sa fin de vie utile et ne garantit plus l'étanchéité du bâtiment. Le remplacement complet de la couverture du toit doit être planifié et exécuté à court terme par un couvreur qualifié.",
                "Des anomalies ont été observées au niveau des solins métalliques (cheminée, murs adjacents, noues, évents). Les solins sont souvent la première cause d'infiltration d'eau au toit s'ils sont mal installés ou détériorés. Une intervention d'entretien correctif par un ferblantier ou un couvreur est fortement recommandée pour assurer l'étanchéité à ces jonctions."
            ]
        },

        ss_to_1: { // Grenier
            positive: [
                "L'inspection du grenier n'a révélé aucun signe d'infiltration d'eau active ni de condensation excessive. La ventilation semble adéquate et l'isolant est bien réparti."
            ],
            negative: [
                "Une mauvaise ventilation de l'entretoit a été constatée (soffites bloqués par l'isolant, nombre insuffisant d'évents de toit). Une ventilation déficiente entraîne une surchauffe du grenier en été et de la condensation en hiver, pouvant mener à la formation de barrages de glace et au développement de moisissures sur la charpente. Il est recommandé de dégager les corniches et de s'assurer d'un flux d'air continu selon les normes du bâtiment.",
                "Des taches sombres s'apparentant à des moisissures ont été observées sur le pontage de toit et les fermes de toit. Ceci est généralement symptomatique d'une ventilation déficiente combinée à des fuites d'air chaud et humide provenant de l'espace habitable (ex. ventilateur de salle de bain évacuant dans le grenier). Nous recommandons d'investiguer et de corriger les sources d'humidité, d'améliorer la ventilation, et de faire nettoyer le bois par une entreprise spécialisée en décontamination."
            ]
        },

        ss_pl_0: { // Chauffe-eau
            positive: [
                "Le chauffe-eau est d'installation récente, ne présente aucun signe de fuite ni de corrosion, et son alimentation électrique ainsi que sa tuyauterie apparaissent conformes aux bonnes pratiques."
            ],
            negative: [
                "Le chauffe-eau a atteint ou dépassé l'âge limite généralement reconnu par les assureurs (10 à 12 ans). Les risques de rupture du réservoir et de dégâts d'eau majeurs augmentent considérablement après cette période. Nous recommandons le remplacement préventif de cet appareil par un plombier certifié.",
                "Il n'y a pas de tuyau de décharge relié à la soupape de sûreté (température et pression) du chauffe-eau, ou celui-ci est mal dirigé. En cas de surpression, de l'eau bouillante pourrait être projetée, causant un risque grave de brûlure. Il faut faire installer un tuyau de décharge rigide orienté vers le sol (à environ 15 cm du plancher) par un plombier."
            ]
        },
        
        ss_el_1: { // Panneau électrique
            positive: [
                "Le panneau de distribution électrique principal et ses composantes visibles sont en bon état. La capacité semble suffisante pour une utilisation résidentielle standard, et aucune surchauffe ni bricolage dangereux n'a été observé."
            ],
            negative: [
                "Le panneau électrique contient des disjoncteurs surchargés (double-tap), où plus d'un fil est connecté sur un disjoncteur conçu pour un seul conducteur. Cette situation peut causer des arcs électriques, un échauffement et un risque d'incendie. Une vérification et une correction par un maître électricien sont recommandées.",
                "La capacité de l'entrée électrique (ex: 60 ampères) est considérée comme désuète et insuffisante selon les standards de vie modernes. L'ajout d'appareils électriques sera limité ou impossible. Nous recommandons de planifier la modernisation de l'entrée électrique à au moins 100 ou 200 ampères par un maître électricien certifié."
            ]
        },

        ss_cv_1: { // Chauffage
            positive: [
                "Le système de chauffage principal est fonctionnel au moment de l'inspection. Il répond normalement aux commandes du thermostat et la chaleur est distribuée adéquatement."
            ],
            negative: [
                "Le système de chauffage est ancien et approche la fin de sa vie utile estimée. Bien qu'il fonctionne actuellement, son efficacité énergétique est moindre et le risque de bris est accru. Il est recommandé de prévoir un budget pour son remplacement à moyen terme et d'assurer un entretien annuel rigoureux d'ici là.",
                "Un manque d'entretien du système de chauffage a été noté (filtre très encrassé, composantes poussiéreuses). Un appareil mal entretenu perd en efficacité, s'use prématurément et peut altérer la qualité de l'air intérieur. Un nettoyage professionnel complet et un entretien mécanique par un technicien qualifié sont recommandés immédiatement."
            ]
        },

        ss_da_1: { // Amiante
            positive: [
                "Aucun matériau suspect d'amiante n'a été identifié visuellement au moment de l'inspection. Note : seul un échantillonnage en laboratoire accrédité peut confirmer de façon certaine l'absence d'amiante dans les matériaux anciens."
            ],
            negative: [
                "De la vermiculite a été observée dans l'entretoit. Considérant que la majorité de la vermiculite vendue au Canada avant 1990 (ex: marque Zonolite) provenait d'une mine contaminée à l'amiante, il faut présumer que cet isolant contient des fibres d'amiante. Nous recommandons vivement de faire analyser un échantillon par un laboratoire indépendant avant toute intervention dans le grenier.",
                "Des matériaux de calorifugeage (isolation de tuyauterie/conduits) d'apparence suspecte ont été notés. Ce type de matériau, fréquent dans les maisons anciennes, contient souvent un fort pourcentage d'amiante. S'il est friable ou endommagé, il présente un risque important pour la santé respiratoire. Une évaluation par un expert en décontamination est requise."
            ]
        },

        ss_da_2: { // Plomb et Pyrite
            positive: [
                "Aucun signe visuel évident n'indique la présence de problèmes liés à la peinture au plomb ou à la pyrite dans les remblais sous-dalle au moment de l'inspection."
            ],
            negative: [
                "Des fissures en forme d'étoile ou de toile d'araignée ainsi qu'un soulèvement de la dalle de plancher au sous-sol (ou dans le garage) ont été observés. Ces signes sont fortement associés à la présence de pyrite dans le remblai granulaire. Le gonflement dû à l'oxydation de la pyrite est irréversible. Un test de caractérisation (norme CTQ-M200) par un laboratoire spécialisé est fortement recommandé pour confirmer la présence et l'Indice Pétrographique de Potentiel de Gonflement (IPPG).",
                "Considérant l'âge du bâtiment (construit avant 1978), il est fort probable que certaines couches de peinture contiennent du plomb. La peinture au plomb écaillée ou la poussière générée lors de rénovations est toxique, particulièrement pour les jeunes enfants. Des précautions strictes doivent être prises lors de futurs travaux."
            ]
        },

        ss_da_3: { // Radon
            positive: [
                "Aucun indicateur visuel n'a été noté, mais il est important de rappeler que le radon est un gaz radioactif naturel inodore et incolore. Un test de dépistage à long terme (90 jours) en saison de chauffage est toujours recommandé pour toute résidence."
            ],
            negative: [
                "Il n'y a aucune preuve qu'un test de radon a été effectué dans ce bâtiment. Le radon s'infiltre par les fissures des fondations et est la deuxième cause de cancer du poumon au pays. Nous vous recommandons fortement de vous procurer un dosimètre de Santé Canada pour effectuer une mesure sur 90 jours durant la saison hivernale. Si les niveaux dépassent 200 Bq/m³, des travaux d'atténuation seront nécessaires."
            ]
        },

        ss_in_3: { // Portes et Fenêtres
            positive: [
                "Les portes et fenêtres testées sont fonctionnelles, s'ouvrent et se ferment adéquatement. Les vitrages thermiques (thermos) examinés ne présentent aucun signe évident de descellement au moment de l'inspection."
            ],
            negative: [
                "Une ou plusieurs fenêtres présentent de la condensation ou un voile blanchâtre entre les vitres. Cela indique que le scellant thermique (thermos) est brisé et que le gaz isolant s'est échappé. La valeur isolante est réduite et la visibilité est altérée. Le remplacement de l'unité scellée par un vitrier est recommandé.",
                "Les coupe-froid de plusieurs portes et/ou fenêtres sont usés, affaissés ou manquants. Cela entraîne d'importantes pertes thermiques, des courants d'air froids en hiver et peut permettre des infiltrations d'eau lors de fortes pluies poussées par le vent. Il est recommandé de remplacer les coupe-froid pour améliorer le confort et l'efficacité énergétique."
            ]
        },

        ss_ga_1: { // Garage
            positive: [
                "La structure du garage, y compris la dalle de plancher et les murs de séparation avec la zone habitable, apparaît conforme. La porte de garage fonctionne bien et le système d'inversion automatique réagit correctement."
            ],
            negative: [
                "Il manque un coupe-feu adéquat (gypse scellé) ou la porte de communication n'est pas étanche et munie d'un ferme-porte automatique entre le garage et l'espace habitable. Cette situation est dangereuse car elle permet aux gaz d'échappement (monoxyde de carbone) et aux flammes de se propager rapidement vers la maison. Nous recommandons de corriger cette situation immédiatement pour votre sécurité.",
                "La dalle du garage présente d'importantes fissures avec dénivellation et/ou s'incline vers les murs de fondation plutôt que vers la porte de garage ou le drain. L'eau de fonte des véhicules risque de s'accumuler contre les murs, causant de la détérioration et un risque d'infiltration. Des travaux de correction du drainage ou de la dalle sont à prévoir."
            ]
        },

        ss_cu_1: { // Cuisine
            positive: [
                "Les armoires, les comptoirs et la robinetterie de la cuisine sont en bon état et fonctionnels. La hotte évacue adéquatement l'air vers l'extérieur et aucun signe de fuite n'a été détecté sous l'évier."
            ],
            negative: [
                "Des traces d'humidité active, des cernes d'eau ou de la détérioration ont été notés dans le meuble sous l'évier de la cuisine. Cela indique une fuite de la robinetterie, du renvoi ou du joint d'étanchéité de l'évier. Une intervention rapide par un plombier est recommandée pour éviter le développement de moisissures et de pourriture.",
                "La hotte de cuisinière n'évacue pas l'air vers l'extérieur (système à recirculation) ou le conduit de sortie est non conforme (ex: tuyau flexible en plastique). La cuisson génère beaucoup d'humidité et de polluants qui doivent être expulsés à l'extérieur du bâtiment pour maintenir une bonne qualité d'air. L'installation d'un conduit d'évacuation extérieur rigide et lisse est recommandée."
            ]
        },

        ss_cu_2: { // Salles de bain
            positive: [
                "Les appareils sanitaires (bain, douche, toilette, lavabo) ont été testés et s'écoulent normalement. Les joints de silicone sont étanches et le ventilateur d'extraction fonctionne et évacue l'air vers l'extérieur."
            ],
            negative: [
                "Les joints de coulis et/ou le calfeutrage (silicone) autour du bain ou de la douche sont fissurés, moisis ou manquants par endroits. L'eau s'infiltre derrière la céramique, ce qui peut causer des dommages considérables à la structure murale et au plancher de façon invisible. Nous recommandons de retirer l'ancien scellant, d'assécher, et de refaire tous les joints avec un calfeutrage de qualité sanitaire.",
                "La toilette n'est pas solidement ancrée au plancher (elle bouge lorsqu'on s'y appuie). Ce mouvement écrase et détruit l'anneau de cire situé en dessous, provoquant des fuites d'eau usée et de gaz d'égout dans le plancher. Il faut retirer la toilette, remplacer l'anneau de cire et la fixer solidement au sol par un plombier."
            ]
        },

        ss_pl_2: { // Tuyauterie
            positive: [
                "La tuyauterie d'alimentation en eau visible est en cuivre ou en PEX et la tuyauterie de renvoi est en plastique ABS ou PVC. Aucune fuite, corrosion avancée ni raccordement fautif n'ont été observés lors de l'inspection visuelle."
            ],
            negative: [
                "Des sections de la tuyauterie d'alimentation d'origine en acier galvanisé sont encore présentes. Ces tuyaux ont largement dépassé leur vie utile; ils rouillent de l'intérieur, ce qui réduit considérablement la pression d'eau et augmente le risque imminent de perforation et de dégât d'eau. Le remplacement complet par un plombier est recommandé.",
                "Des connexions non conformes (ex: raccords flexibles, pentes inversées, absence d'évents) ont été observées sur la tuyauterie de renvoi. Cela peut causer des blocages fréquents, un refoulement d'égout ou le siphonnage des siphons laissant entrer les gaz d'égout toxiques dans la maison. Une révision du système par un maître plombier est requise."
            ]
        },

        ss_el_2: { // Câblage et Prises
            positive: [
                "Les prises de courant, les interrupteurs et le câblage visible inspectés sont fonctionnels, bien fixés et conformes. Les prises situées près des sources d'eau sont protégées par des disjoncteurs de fuite à la terre (DDFT/GFCI)."
            ],
            negative: [
                "Des prises de courant situées à moins de 1.5m d'une source d'eau (comptoir de cuisine, salle de bain, extérieur) ne sont pas munies de protection contre les fuites à la terre (GFCI/DDFT). Cette protection est essentielle pour prévenir les chocs électriques mortels en milieu humide. Le remplacement de ces prises par un électricien est une question de sécurité prioritaire.",
                "Du câblage électrique comportant des jonctions à l'air libre (sans boîte de jonction) ou du filage de type \"bouton et tube\" (knob and tube) a été identifié. Ces conditions représentent un risque d'arc électrique et d'incendie majeur. De plus, le filage bouton et tube est souvent refusé par les assureurs. Une évaluation complète et une mise aux normes par un maître électricien sont recommandées."
            ]
        },

        ss_cv_2: { // Ventilation
            positive: [
                "Le système de ventilation mécanique (échangeur d'air ou VRC) est fonctionnel. Les bouches d'aspiration et de refoulement sont propres et permettent un renouvellement adéquat de l'air intérieur."
            ],
            negative: [
                "L'échangeur d'air (VRC) ne semble pas fonctionnel ou le noyau récupérateur de chaleur et les filtres sont complètement obstrués par la poussière et les débris. Un système de ventilation déficient entraîne une hausse de l'humidité relative, de la condensation sur les fenêtres et une mauvaise qualité de l'air (accumulation de CO2 et de COV). Un nettoyage en profondeur et un entretien mécanique sont recommandés.",
                "Le conduit de ventilation de la sécheuse est fait de plastique ou d'aluminium ondulé flexible. Ce type de conduit accumule rapidement la charpie, restreint le flux d'air, allonge les temps de séchage et représente un risque d'incendie important. L'installation d'un conduit en métal rigide, lisse et scellé au ruban d'aluminium est requise selon les normes."
            ]
        },

        ss_in_1: { // Planchers, Murs et Plafonds
            positive: [
                "Les planchers, murs et plafonds inspectés ne présentent aucun défaut structurel majeur ni trace d'infiltration d'eau active. L'usure observée correspond à l'âge normal du bâtiment."
            ],
            negative: [
                "Une pente importante ou un affaissement prononcé a été remarqué au niveau de certains planchers. Cela peut être le signe d'un problème structurel sous-jacent (poutre maîtresse affaissée, colonnes inadéquates ou solives sous-dimensionnées). Une investigation plus poussée par un ingénieur en structure est recommandée pour déterminer la cause et les correctifs appropriés.",
                "Des cernes d'eau ou des traces d'humidité séchées sont visibles sur certains plafonds ou murs. Bien qu'il n'y ait pas d'humidité active détectée au moment de l'inspection, cela indique qu'une fuite s'est produite dans le passé. Nous vous recommandons de questionner le propriétaire actuel sur la nature de cette fuite et les réparations qui ont été effectuées."
            ]
        },

        ss_in_2: { // Escaliers et Garde-corps
            positive: [
                "Les escaliers, les mains courantes et les garde-corps intérieurs sont solides, bien fixés et ne présentent aucun risque immédiat pour la sécurité des occupants."
            ],
            negative: [
                "Les balustres du garde-corps sont espacés de plus de 10 cm (4 pouces) ou le garde-corps présente des éléments horizontaux créant un effet d'échelle. Ceci ne répond pas aux normes de sécurité actuelles car un jeune enfant pourrait s'y coincer la tête ou l'escalader, avec un risque grave de chute. Il est fortement recommandé de modifier ou remplacer ce garde-corps pour des raisons de sécurité.",
                "L'escalier ne possède pas de main courante continue ou celle-ci est mal fixée. L'absence d'un point d'appui solide représente un risque élevé de chute, particulièrement pour les jeunes enfants et les personnes âgées. L'installation d'une main courante robuste sur toute la longueur de la volée d'escalier est requise."
            ]
        },

        ss_st_3: { // Vide Sanitaire
            positive: [
                "L'inspection du vide sanitaire n'a révélé aucune accumulation d'eau, et l'espace semble adéquatement ventilé. La présence d'un pare-vapeur au sol aide à contrôler le niveau d'humidité."
            ],
            negative: [
                "Il n'y a aucune pellicule pare-vapeur sur le sol de terre battue du vide sanitaire, ou celle-ci est endommagée et incomplète. L'humidité du sol s'évapore continuellement dans cet espace clos, ce qui favorise la pourriture de la structure de bois (solives) et la prolifération de moisissures. L'installation d'une membrane de polyéthylène scellée de 6 mil minimum est requise.",
                "Une accumulation d'eau stagnante a été observée dans le vide sanitaire. Cette situation entraîne une humidité excessive, détériore les fondations et attire les insectes ou la vermine. Il est impératif d'identifier la source de l'eau (drainage extérieur déficient, fuite de plomberie) et d'installer un système de drainage adéquat avec une pompe de puisard."
            ]
        },

        ss_st_5: { // Insectes et Vermine
            positive: [
                "Aucun signe évident ou activité d'infestation par des insectes destructeurs du bois (fourmis charpentières, termites) ou par de la vermine n'a été observé lors de l'inspection visuelle."
            ],
            negative: [
                "Des signes probables d'activité de rongeurs (excréments, matériaux isolants grugés, nids) ont été découverts dans le grenier ou le vide sanitaire. La vermine peut causer des dommages considérables à l'isolation et au câblage électrique (risque d'incendie), en plus de représenter un risque sanitaire. Les services d'un exterminateur professionnel sont recommandés.",
                "De la sciure de bois très fine et des galeries creusées dans certaines pièces de bois (solives, sablières) suggèrent la présence d'insectes xylophages, telles que les fourmis charpentières. Ces insectes affaiblissent la structure du bâtiment. Une évaluation immédiate et un traitement par un spécialiste en gestion parasitaire sont nécessaires."
            ]
        },

        ss_ch_1: { // Cheminée extérieure
            positive: [
                "La maçonnerie de la cheminée extérieure, la couronne de béton et les solins à la base semblent en bon état. Aucun effritement majeur ou désalignement n'a été noté."
            ],
            negative: [
                "La couronne de béton au sommet de la cheminée est fissurée ou effritée, et les joints de mortier de la maçonnerie sont détériorés. L'eau s'infiltre dans ces ouvertures et les cycles de gel/dégel accélèrent la dégradation de la structure, ce qui peut mener à l'effondrement de briques. Une réfection par un maçon qualifié est recommandée afin de prévenir des dommages plus importants."
            ]
        },

        ss_ch_2: { // Foyer et Âtre
            positive: [
                "Les composantes visibles du foyer à l'intérieur, telles que l'âtre et le registre, sont fonctionnelles. L'espace de dégagement par rapport aux matériaux combustibles semble adéquat."
            ],
            negative: [
                "Des fissures importantes ont été notées dans les briques réfractaires de l'âtre du foyer. De plus, une accumulation importante de créosote est visible dans le conduit. La créosote est hautement inflammable et cause de nombreux incendies de cheminée. Nous vous recommandons de ne pas utiliser le foyer avant d'avoir fait effectuer un ramonage complet et une inspection par caméra (WETT) par un spécialiste."
            ]
        },

        ss_to_2: { // Isolation du Grenier
            positive: [
                "L'épaisseur et la répartition de l'isolant dans l'entretoit offrent une résistance thermique convenable selon les standards de l'époque de construction du bâtiment."
            ],
            negative: [
                "La quantité d'isolant dans le grenier est très faible par rapport aux normes d'efficacité énergétique actuelles. Une mauvaise isolation entraîne d'importantes pertes de chaleur, augmente les coûts de chauffage et peut causer la formation de glaçons destructeurs en bordure du toit durant l'hiver. L'ajout d'isolant par un entrepreneur qualifié est recommandé, tout en s'assurant de maintenir une bonne ventilation."
            ]
        },

        ss_pl_1: { // Alimentation et Entrée d'eau
            positive: [
                "L'entrée d'eau principale visible (en cuivre ou plastique) et sa valve d'arrêt d'urgence sont en bon état et ne présentent aucune fuite.",
                "Le robinet d'arrêt principal est localisé, accessible et fonctionne normalement. La pression d'eau mesurée aux points de distribution est adéquate.",
                "Aucun signe de corrosion ou de réduction de diamètre intérieur n'a été observé sur la tuyauterie d'alimentation visible."
            ],
            negative: [
                "La conduite de l'entrée d'eau principale est en plomb. Les vieilles conduites en plomb contaminent l'eau potable, causant des risques sérieux pour la santé, en particulier pour les enfants et les femmes enceintes, et sont plus susceptibles de se rompre. Il est recommandé de faire tester l'eau et de planifier le remplacement de l'entrée d'eau jusqu'à la ligne de ville par un entrepreneur.",
                "Le robinet d'arrêt principal est introuvable, inaccessible ou ne ferme pas complètement. En cas de fuite majeure, il sera impossible de couper rapidement l'alimentation en eau. Il est urgent de localiser et de remettre en état ce dispositif de sécurité essentiel.",
                "La pression d'eau est insuffisante à plusieurs points d'utilisation simultanés. Cette situation peut indiquer un dépôt de tartre dans la tuyauterie galvanisée, un problème de réducteur de pression ou une faible pression au réseau municipal. Une vérification par un plombier est recommandée."
            ]
        },

        // ─── NOUVELLES SOUS-SECTIONS ────────────────────────────────────────────

        ss_st_4: { // Fondation sur Pilotis
            positive: [
                "Les pilotis visibles et leurs appuis de solives sont en bon état. Le bois traité ne présente aucun signe de pourriture, de déplacement ou d'affaissement notable. La gestion des eaux de pluie semble adéquate sous la structure.",
                "L'espace sous le bâtiment sur pilotis est accessible et bien ventilé. Aucune détérioration structurelle majeure n'a été observée sur les éléments de fondation visibles."
            ],
            negative: [
                "Des pilotis présentent des signes de pourriture, d'écrasement ou de déplacement latéral. Cette situation compromet l'intégrité structurelle du plancher et de l'ensemble du bâtiment. Une évaluation par un ingénieur en structure est recommandée avant toute autre intervention.",
                "La pente du terrain sous le bâtiment sur pilotis dirige les eaux de ruissellement vers le centre plutôt que vers l'extérieur. L'accumulation d'eau favorise la dégradation accélérée du bois non traité. Des corrections de drainage et l'application d'un traitement préservatif sont recommandés.",
                "Des appuis de solives (beam pockets) sont manquants, écrasés ou mal positionnés sous le plancher. Cette déficience peut causer un affaissement localisé du plancher. Une intervention par un charpentier ou un entrepreneur en fondation est requise."
            ]
        },

        ss_st_6: { // Électricité et Plomberie Extérieures
            positive: [
                "Les robinets extérieurs sont du type antigel et les prises électriques extérieures sont munies de boîtiers étanches de type « en cours d'utilisation » (in-use) avec protection DDFT/GFCI. Aucune anomalie n'a été observée à ces installations.",
                "L'ensemble des équipements extérieurs (éclairage, prises, robinetterie) est en bon état apparent et conforme aux bonnes pratiques d'installation."
            ],
            negative: [
                "Les robinets extérieurs ne sont pas du type antigel. Durant les périodes de gel, l'eau résiduelle dans les tuyaux peut geler, se dilater et fracturer les conduites à l'intérieur du mur. Le remplacement par des robinets antigel à tige longue par un plombier est recommandé avant la saison froide.",
                "Les prises électriques extérieures sont sans protection DDFT/GFCI ou leur boîtier de protection n'est pas de type étanche (in-use). L'exposition à l'humidité et à la pluie rend cette situation potentiellement mortelle. Le remplacement et la mise aux normes par un électricien sont requis.",
                "Des luminaires ou équipements électriques extérieurs présentent des fils dénudés, des boîtiers ouverts ou des fixations manquantes. L'exposition aux intempéries augmente le risque de choc électrique et d'incendie. Une inspection et une remise en état par un électricien qualifié sont requises."
            ]
        },

        ss_st_7: { // Dépendances et Aménagements
            positive: [
                "Les bâtiments accessoires visibles (cabanon, remise) sont en état satisfaisant pour leur usage. Aucun affaissement de structure ou détérioration majeure n'a été noté lors de l'inspection visuelle.",
                "Les clôtures et aménagements extérieurs sont en bon état général. La piscine ou le spa, si présent, est entouré d'une clôture conforme avec porte auto-verrouillante."
            ],
            negative: [
                "Le cabanon ou garage détaché présente des signes d'affaissement de la structure (murs penchés, toiture affaissée, fondation effondrée). Ces bâtiments peuvent devenir dangereux et leur réfection ou démolition devrait être planifiée.",
                "La clôture entourant la piscine ne répond pas aux exigences réglementaires (hauteur minimale de 1,2 m, porte auto-fermante et auto-verrouillante). Cette non-conformité constitue un risque grave de noyade pour les jeunes enfants. Une mise aux normes immédiate est requise conformément au Code de sécurité du Québec.",
                "Des poteaux de clôture sont pourris, cassés ou fortement penchés, rendant la clôture instable. Des sections importantes présentent des ouvertures ou des affaissements. La réfection de la clôture est recommandée pour assurer la sécurité du périmètre."
            ]
        },

        ss_in_4: { // Sécurité — Détecteurs et Alarmes
            positive: [
                "Les détecteurs de fumée sont présents à chaque étage et dans les chambres, et les détecteurs de monoxyde de carbone sont installés conformément aux exigences légales. Tous les appareils testés ont répondu normalement.",
                "L'installation des dispositifs de sécurité (fumée, CO, extincteur) respecte les emplacements requis par le Code de sécurité du Québec. Les piles ou l'alimentation électrique semblent fonctionnelles."
            ],
            negative: [
                "Des détecteurs de fumée sont absents à des emplacements requis (au moins un par étage et un dans chaque chambre à coucher). Cette non-conformité constitue un risque vital en cas d'incendie. L'installation de détecteurs certifiés ULC est requise dans les plus brefs délais.",
                "Aucun détecteur de monoxyde de carbone n'est installé, malgré la présence d'un garage attaché ou d'appareils à combustion. Le CO est inodore et incolore et peut être mortel en quelques minutes. L'installation d'un détecteur de CO certifié est obligatoire selon le Code de sécurité du Québec.",
                "Les détecteurs de fumée présents sont anciens (plus de 10 ans), ont été peints par-dessus, ou n'ont pas répondu au test. Des appareils défaillants n'offrent aucune protection. Le remplacement par des modèles récents combinés (fumée + CO) est vivement recommandé.",
                "Aucun extincteur portatif n'est présent dans la cuisine ou la salle mécanique. Un extincteur de type ABC en bon état et facilement accessible est un équipement de sécurité de base recommandé pour toute résidence."
            ]
        },

        ss_in_5: { // Salle Mécanique / Sous-sol
            positive: [
                "La salle mécanique est accessible, propre et bien organisée. Les équipements (fournaise, chauffe-eau, tableau électrique) sont identifiés et accessibles. Aucun signe d'humidité excessive ou de moisissures n'a été observé.",
                "Le sous-sol présente un niveau d'humidité acceptable au moment de l'inspection. Les murs de fondation sont secs, la pompe de puisard est en état fonctionnel et aucun signe de pénétration d'eau récente n'a été noté."
            ],
            negative: [
                "Une humidité excessive ou des traces de moisissures ont été observées dans le sous-sol ou la salle mécanique. Cette condition dégrade la qualité de l'air de tout le bâtiment et peut causer des problèmes respiratoires. La source d'humidité (infiltration, condensation, fuite de plomberie) doit être identifiée et corrigée avant tout travail de finition.",
                "La salle mécanique est encombrée au point de restreindre l'accès aux équipements et au panneau électrique. Le dégagement minimal devant le panneau (1 mètre) n'est pas respecté. Un désencombrement et une réorganisation de l'espace sont requis pour assurer la sécurité et faciliter l'entretien.",
                "Des traces de calorifugeage suspect (gris ou blanc) ont été observées sur des tuyaux de plomberie ou des conduits de chauffage dans la salle mécanique. Ce matériau, courant dans les maisons construites avant 1980, peut contenir de l'amiante. Une analyse par un laboratoire accrédité est recommandée avant toute intervention ou rénovation dans cet espace."
            ]
        },

        ss_ga_2: { // Systèmes et Sécurité du Garage
            positive: [
                "La porte de garage motorisée fonctionne normalement. Le mécanisme d'inversion automatique réagit à un obstacle, ce qui confirme que la sécurité anti-écrasement est opérationnelle. La ventilation du garage semble adéquate.",
                "Les prises électriques du garage sont munies de protections DDFT/GFCI conformes. Un détecteur de CO est présent et semble fonctionnel dans la zone de vie adjacente."
            ],
            negative: [
                "Le mécanisme d'inversion automatique de la porte de garage motorisée est absent ou ne fonctionne pas correctement. Une porte qui ne s'arrête pas et ne s'inverse pas en cas d'obstacle peut causer des blessures graves, voire la mort. Cette déficience de sécurité doit être corrigée immédiatement par un technicien en portes de garage.",
                "Le garage ne possède pas de ventilation mécanique ou naturelle adéquate. Dans un espace fermé, les gaz d'échappement d'un véhicule peuvent atteindre des concentrations mortelles de monoxyde de carbone en quelques minutes. L'installation d'une ventilation conforme est requise.",
                "Aucun détecteur de monoxyde de carbone n'est installé dans la zone de vie directement adjacente au garage attaché. Le CO peut migrer silencieusement depuis le garage vers les espaces habitables. L'installation d'un détecteur de CO certifié est obligatoire selon le Code de sécurité du Québec."
            ]
        },

        ss_pl_3: { // Systèmes Sanitaires Autonomes
            positive: [
                "Le système d'assainissement autonome (fosse septique et champ d'épuration) ne présente aucun signe visible de débordement, d'odeur excessive ou de surface détrempée au moment de l'inspection. La date du dernier vidange est connue et raisonnable.",
                "Le puits artésien et l'équipement de pompage semblent en bon état. Aucune odeur ni coloration anormale de l'eau n'a été signalée. Un test bactériologique annuel demeure recommandé."
            ],
            negative: [
                "La fosse septique ou le champ d'épuration n'a pas été vidangé depuis plus de deux ans, ou la date du dernier vidange est inconnue. Une fosse non entretenue déborde prématurément et contamine le sol et les nappes phréatiques. Un vidange par une entreprise certifiée et une inspection de l'état de la fosse sont recommandés sans délai.",
                "Des signes de débordement ou de saturation du champ d'épuration ont été observés (surface détrempée, odeur d'égout à l'extérieur, végétation anormalement verte au-dessus du champ). Ce système en fin de vie ou en défaillance constitue un risque sanitaire et environnemental. Une évaluation par un technologue agréé en environnement est requise.",
                "Le puits autonome est situé à moins de 30 mètres du système d'épuration ou d'une source de contamination potentielle. Cette proximité augmente significativement le risque de contamination bactériologique de l'eau potable. Un test d'eau complet (bactériologie + chimie) par un laboratoire accrédité est fortement recommandé.",
                "L'installation du système sanitaire autonome semble ancienne et ne répond possiblement plus aux normes actuelles de la Loi sur la qualité de l'environnement (LQE) et du Règlement sur l'évacuation et le traitement des eaux usées des résidences isolées (Q-2, r. 22). Une évaluation de conformité par un professionnel est recommandée."
            ]
        },

        ss_el_3: { // Énergie Solaire
            positive: [
                "Les panneaux solaires sont bien fixés à la toiture et ne présentent aucun signe de dommage visible ni de fuite aux points d'ancrage. L'onduleur et le câblage apparents semblent conformes et en bon état.",
                "L'installation photovoltaïque inclut un interrupteur d'urgence (déconnexion rapide) accessible à l'extérieur, conformément aux exigences du Code national du bâtiment et aux pratiques de sécurité pour les services d'urgence."
            ],
            negative: [
                "Des dommages à la toiture ont été observés aux points d'ancrage des fixations de panneaux solaires (fissures de bardeaux, joints décollés, rouille). Ces zones constituent des voies d'infiltration potentielles. Une inspection par un couvreur et vérification par l'installateur du système solaire sont recommandées.",
                "Aucun interrupteur d'urgence (déconnexion rapide) n'est visible à l'extérieur du bâtiment. En cas d'incendie, les pompiers doivent pouvoir couper rapidement le circuit photovoltaïque pour intervenir en sécurité. Cette installation est non conforme aux exigences de sécurité incendie. Une mise aux normes par l'installateur est requise.",
                "L'onduleur ou la banque de batteries est installé dans un espace non ventilé. Les batteries au lithium ou au plomb dégagent des gaz potentiellement inflammables lors de la charge. Une ventilation adéquate de cet espace est requise pour prévenir tout risque d'explosion ou d'incendie."
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
