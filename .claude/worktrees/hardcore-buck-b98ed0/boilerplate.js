const BOILERPLATE = {

    // ================================================================
    // LETTRE D'INTRODUCTION (Remise du rapport)
    // ================================================================
    lettreIntro: (clientName, normeSelected = "BNQ 3009-500 (RBQ)", inspectorName = "Inspecteur", signatureUrl = null, sealUrl = null, certifRBQ = "", categorieInspection = "1") => `
        <div class="page-break" style="padding: 50px 60px 40px;">
            <p style="text-align: right; color: #64748b; margin-bottom: 40px;">
                ${new Date().toLocaleDateString('fr-CA', {year:'numeric', month:'long', day:'numeric'})}
            </p>

            <p style="margin-bottom: 6px;"><strong>À l'attention de :</strong> ${clientName || 'Cher/Chère client(e)'}</p>
            <p style="margin-bottom: 40px; color: #64748b;">Concernant la propriété inspectée selon nos ententes contractuelles.</p>

            <h2 style="font-size: 1.4rem; margin-bottom: 20px; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                Objet : Remise de votre rapport d'inspection de bâtiment
            </h2>

            <p style="line-height: 1.7; margin-bottom: 15px;">
                Nous vous remercions de la confiance que vous nous avez témoignée en choisissant les services de
                <strong>${window.AppCompanyProfile ? window.AppCompanyProfile.name : "notre cabinet d'inspection"}</strong>
                pour l'analyse de votre future propriété.
            </p>

            <p style="line-height: 1.7; margin-bottom: 15px;">
                Ce rapport a été produit en stricte conformité avec la norme
                <strong>BNQ 3009-500 — Bâtiment d'habitation — Pratiques pour l'inspection en vue d'une transaction immobilière</strong>,
                telle qu'exigée par le Règlement sur l'encadrement des inspecteurs en bâtiments d'habitation
                (<strong>REIBH 2024</strong>) de la Régie du bâtiment du Québec (RBQ).
                Norme de pratique retenue pour cette inspection : <strong>${normeSelected}</strong>.
                Catégorie d'inspection : <strong>Catégorie ${categorieInspection}</strong>.
            </p>

            <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 16px; margin: 20px 0; border-radius: 0 6px 6px 0;">
                <strong style="color: #92400e;">⚠️ Nature de l'inspection :</strong>
                <p style="margin-top: 8px; color: #78350f; line-height: 1.6;">
                    L'inspection documentée dans ce rapport est une analyse strictement <strong>visuelle et non destructive</strong>
                    des composantes apparentes et accessibles du bâtiment au moment de la visite.
                    L'inspecteur ne déplace pas les meubles, ne procède à aucune ouverture et n'effectue aucun test destructif.
                    Certaines défaillances dissimulées peuvent ne pas figurer dans ce document.
                </p>
            </div>

            <p style="line-height: 1.7; margin-bottom: 15px;">
                Les éléments nécessitant une attention immédiate sont mis en évidence dans la section
                <em>Sommaire Exécutif</em>. Nous vous invitons à lire ce rapport dans son intégralité
                pour prendre connaissance de l'ensemble des observations et des conseils d'entretien préventif.
            </p>

            <p style="line-height: 1.7; margin-bottom: 30px;">
                N'hésitez pas à nous contacter pour toute question concernant la terminologie ou les recommandations
                contenues dans ce rapport. Nous demeurons à votre entière disposition.
            </p>

            <p style="margin-bottom: 5px;">Cordialement,</p>
            <div style="position: relative; height: 120px; display: flex; align-items: center; margin: 10px 0;">
                ${signatureUrl ? `<img src="${signatureUrl}" style="max-height: 80px; position: absolute; z-index: 1;" alt="Signature">` : '<div style="height:60px;"></div>'}
                ${sealUrl ? `<img src="${sealUrl}" style="max-height: 120px; position: absolute; left: 180px; opacity: 0.8; z-index: 0;" alt="Sceau">` : ''}
            </div>
            <p style="margin-top: 5px;">
                <strong>${inspectorName}</strong><br>
                Inspecteur en Bâtiment d'Habitation — RBQ
                ${certifRBQ ? `<br><span style="color:#3b82f6;">Certificat RBQ : ${certifRBQ}</span>` : ''}
            </p>

            <p style="margin-top: 30px; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                ⚖️ Déclaration de conflit d'intérêts : L'inspecteur soussigné déclare n'avoir aucun intérêt financier, personnel ou professionnel dans la présente transaction immobilière, ni dans les travaux susceptibles de découler de ce rapport, conformément aux exigences du REIBH 2024.
            </p>
        </div>
    `,

    // ================================================================
    // LETTRE DE REMERCIEMENT (Envoyée après l'inspection)
    // ================================================================
    lettreRemerciement: (clientName, propertyAddress, inspectorName = "Inspecteur", companyName = "KZO InspectPro", signatureUrl = null, certifRBQ = "") => `
        <div class="page-break" style="padding: 50px 60px 40px;">
            <p style="text-align: right; color: #64748b; margin-bottom: 40px;">
                ${new Date().toLocaleDateString('fr-CA', {year:'numeric', month:'long', day:'numeric'})}
            </p>

            <p style="margin-bottom: 4px;"><strong>À l'attention de :</strong> ${clientName || 'Cher/Chère client(e)'}</p>
            ${propertyAddress ? `<p style="margin-bottom: 40px; color: #64748b;">Concernant la propriété : ${propertyAddress}</p>` : '<div style="margin-bottom:40px;"></div>'}

            <h2 style="font-size: 1.4rem; margin-bottom: 24px; color: #1e40af;">
                Objet : Remerciements pour votre confiance
            </h2>

            <p style="line-height: 1.8; margin-bottom: 16px;">
                ${clientName ? clientName.split(' ')[0] : 'Cher(e) client(e)'},
            </p>

            <p style="line-height: 1.8; margin-bottom: 16px;">
                Au nom de toute l'équipe de <strong>${companyName}</strong>, nous tenons à vous remercier
                sincèrement de nous avoir confié l'inspection de votre propriété.
                Votre confiance est pour nous une marque de reconnaissance que nous prenons très au sérieux.
            </p>

            <p style="line-height: 1.8; margin-bottom: 16px;">
                Nous espérons que notre rapport vous a fourni les informations claires et détaillées
                dont vous aviez besoin pour prendre une décision éclairée. Notre objectif est toujours
                de vous livrer une analyse rigoureuse, impartiale et conforme aux meilleures pratiques
                reconnues par la <strong>norme BNQ 3009-500</strong> et le <strong>REIBH 2024</strong>.
            </p>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 0 6px 6px 0;">
                <strong style="color: #1e40af;">📋 Nos engagements envers vous :</strong>
                <ul style="margin-top: 10px; padding-left: 20px; line-height: 1.8; color: #1e3a8a;">
                    <li>Rapport conservé dans nos archives pendant <strong>5 ans</strong> — contactez-nous à tout moment pour une copie.</li>
                    <li>Questions post-inspection ? Nous restons disponibles pour clarifier tout élément du rapport.</li>
                    <li>Entretien annuel recommandé — nous pouvons vous rappeler chaque automne pour une vérification préventive.</li>
                </ul>
            </div>

            <p style="line-height: 1.8; margin-bottom: 16px;">
                Si vous avez été satisfait(e) de nos services, nous serions honorés de recevoir votre recommandation
                auprès de votre entourage. Le bouche-à-oreille est la meilleure marque de confiance qu'un client
                puisse accorder à un professionnel.
            </p>

            <p style="line-height: 1.8; margin-bottom: 30px;">
                Nous vous souhaitons beaucoup de bonheur dans votre nouveau chez-vous, et n'hésitez pas à
                nous contacter pour tout service futur d'inspection.
            </p>

            <p style="margin-bottom: 5px;">Avec nos sincères salutations,</p>
            <div style="position: relative; height: 100px; display: flex; align-items: center; margin: 10px 0;">
                ${signatureUrl ? `<img src="${signatureUrl}" style="max-height: 70px; position: absolute; z-index: 1;" alt="Signature">` : '<div style="height:50px;"></div>'}
            </div>
            <p>
                <strong>${inspectorName}</strong><br>
                Inspecteur en Bâtiment d'Habitation — RBQ<br>
                <strong>${companyName}</strong>
                ${certifRBQ ? `<br><span style="color:#3b82f6; font-size:0.9rem;">Certificat RBQ No : ${certifRBQ}</span>` : ''}
            </p>

            <div style="margin-top: 40px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; color: #64748b;">
                <strong>Coordonnées :</strong><br>
                ${window.AppCompanyProfile ? `
                    ${window.AppCompanyProfile.name}<br>
                    ${window.AppCompanyProfile.address}<br>
                    Tél : ${window.AppCompanyProfile.phone}<br>
                    Courriel : ${window.AppCompanyProfile.email}
                ` : `${companyName} — Québec, Canada`}
            </div>
        </div>
    `,

    // ================================================================
    // COMMENT LIRE CE RAPPORT
    // ================================================================
    commentLire: `
        <div class="page-break" style="padding-top: 50px;">
            <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 30px; font-size: 1.8rem;">Comment lire ce rapport</h2>

            <h3 style="color: #0f172a; margin-bottom: 15px; font-size: 1.3rem;">Orientation du Bâtiment</h3>
            <p style="color: #334155; line-height: 1.6; margin-bottom: 15px;">Afin de faciliter la localisation des éléments et des anomalies, une convention d'orientation standard a été utilisée.</p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin-bottom: 40px; display: flex; align-items: center; justify-content: center; gap: 50px;">
                <div style="position: relative; width: 150px; height: 180px;">
                    <div style="position: absolute; top: -30px; left: 0; width: 100%; text-align: center; font-weight: bold; font-size: 0.9rem; color: #475569;">ARRIÈRE</div>
                    <div style="position: absolute; bottom: -30px; left: 0; width: 100%; text-align: center; font-weight: bold; font-size: 0.9rem; color: #3b82f6; text-transform: uppercase;">Avant (Façade)</div>
                    <div style="position: absolute; left: -80px; top: 75px; font-weight: bold; font-size: 0.9rem; color: #475569;">GAUCHE</div>
                    <div style="position: absolute; right: -80px; top: 75px; font-weight: bold; font-size: 0.9rem; color: #475569;">DROIT</div>
                    <div style="width: 100%; height: 100%; background: #e2e8f0; border: 2px solid #cbd5e1; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                        <span style="margin-bottom: auto; margin-top: 10px;">🏠</span>
                        <span style="font-size: 1.8rem; margin-bottom: 10px;">👤</span>
                    </div>
                </div>
                <div style="max-width: 400px;">
                    <p style="color: #0f172a; line-height: 1.6; font-size: 1.05rem; margin-bottom: 10px;"><strong>La Règle d'or :</strong> Imaginez que le client se tient dans la rue, en regardant directement la porte d'entrée principale.</p>
                    <ul style="margin-top: 0; color: #475569; line-height: 1.6; margin-left: 20px;">
                        <li><strong>Façade (Avant) :</strong> Le mur face à vous.</li>
                        <li><strong>Côté Gauche :</strong> Le mur à votre gauche.</li>
                        <li><strong>Côté Droit :</strong> Le mur à votre droite.</li>
                        <li><strong>Arrière :</strong> Le mur directement opposé.</li>
                    </ul>
                </div>
            </div>

            <h3 style="color: #0f172a; margin-bottom: 15px; font-size: 1.3rem;">Classification des Anomalies (BNQ 3009-500 / REIBH 2024)</h3>
            <p style="color: #334155; line-height: 1.6; margin-bottom: 20px;">L'inspecteur classe les défauts selon leur niveau de priorité. Les verbes utilisés (<em>observer, constater, noter, recommander l'évaluation par...</em>) reflètent la nature visuelle et non-destructive de l'inspection.</p>

            <div style="margin-bottom: 15px; display: flex; align-items: flex-start; gap: 15px; background: #fef2f2; padding: 15px; border-left: 5px solid #dc2626; border-radius: 6px;">
                <div style="background: #dc2626; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; margin-top: 2px; min-width: 100px; text-align: center;">🔴 URGENT</div>
                <div style="color: #0f172a; line-height: 1.5; font-size: 0.95rem;">Problème affectant la sécurité des occupants ou causant un dommage immédiat. <strong>Action immédiate ou consultation d'expert requise avant l'achat.</strong></div>
            </div>
            <div style="margin-bottom: 15px; display: flex; align-items: flex-start; gap: 15px; background: #fffbeb; padding: 15px; border-left: 5px solid #d97706; border-radius: 6px;">
                <div style="background: #d97706; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; margin-top: 2px; min-width: 100px; text-align: center;">🟠 MAJEUR</div>
                <div style="color: #0f172a; line-height: 1.5; font-size: 0.95rem;">Composante en fin de vie ou défaut fonctionnel significatif. <strong>À corriger dans un délai de 3 à 6 mois.</strong></div>
            </div>
            <div style="margin-bottom: 15px; display: flex; align-items: flex-start; gap: 15px; background: #fefce8; padding: 15px; border-left: 5px solid #ca8a04; border-radius: 6px;">
                <div style="background: #ca8a04; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; margin-top: 2px; min-width: 100px; text-align: center;">🟡 MINEUR</div>
                <div style="color: #0f172a; line-height: 1.5; font-size: 0.95rem;">Entretien recommandé ou anomalie de vieillissement normal. <strong>À planifier — non urgent.</strong></div>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 15px; background: #ecfdf5; padding: 15px; border-left: 5px solid #059669; border-radius: 6px;">
                <div style="background: #059669; color: white; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; margin-top: 2px; min-width: 100px; text-align: center;">✅ CONFORME</div>
                <div style="color: #0f172a; line-height: 1.5; font-size: 0.95rem;">Aucun défaut observé au moment de l'inspection. Entretien préventif recommandé selon le calendrier saisonnier.</div>
            </div>
        </div>
    `,

    // ================================================================
    // ATTESTATION ET SIGNATURE
    // ================================================================
    attestation: (clientName, inspectorName = "Inspecteur", signatureUrl = null, sealUrl = null, certifRBQ = "", categorieInspection = "1") => `
        <div class="page-break" style="padding-top: 50px;">
            <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 30px; font-size: 1.8rem;">Attestation et Signature</h2>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                <p style="color: #334155; line-height: 1.7; margin-bottom: 16px;">
                    Je soussigné(e), <strong>${inspectorName}</strong>, inspecteur(trice) en bâtiment d'habitation
                    certifié(e) par la Régie du bâtiment du Québec (RBQ)
                    ${certifRBQ ? `(Certificat No : <strong>${certifRBQ}</strong>)` : ''},
                    Catégorie <strong>${categorieInspection}</strong>,
                    certifie avoir personnellement effectué l'inspection visuelle de la propriété décrite dans les pages précédentes.
                </p>
                <p style="color: #334155; line-height: 1.7; margin-bottom: 16px;">
                    Cette inspection a été réalisée conformément aux exigences de la norme
                    <strong>BNQ 3009-500 — Bâtiment d'habitation — Pratiques pour l'inspection en vue d'une transaction immobilière</strong>
                    et au <strong>Règlement sur l'encadrement des inspecteurs en bâtiments d'habitation (REIBH 2024)</strong>
                    de la Régie du bâtiment du Québec.
                </p>
                <p style="color: #475569; font-size: 0.9rem; line-height: 1.6; padding: 12px; background: #fffbeb; border-radius: 6px; border-left: 3px solid #d97706;">
                    ⚖️ <strong>Déclaration de conflit d'intérêts :</strong> L'inspecteur(trice) soussigné(e) déclare formellement
                    n'avoir aucun intérêt financier, personnel ou professionnel dans cette transaction immobilière,
                    ni dans les travaux qui pourraient en découler, conformément aux articles du REIBH 2024.
                </p>
            </div>

            <div style="display: flex; justify-content: space-between; border-top: 1px solid #cbd5e1; padding-top: 20px; page-break-inside: avoid; gap: 40px;">
                <div style="width: 45%;">
                    <p style="margin-bottom: 10px; font-size: 1rem; color: #0f172a;"><strong>Signé par le/la client(e) :</strong></p>
                    <br><br><br>
                    <p style="border-top: 1px solid #0f172a; padding-top: 5px; color: #64748b; font-size: 0.9rem;">${clientName || 'Signature du/de la client(e)'}</p>
                    <p style="margin-top: 8px; color: #94a3b8; font-size: 0.8rem;">Date : _______________</p>
                </div>
                <div style="width: 45%;">
                    <p style="margin-bottom: 10px; font-size: 1rem; color: #0f172a;"><strong>Inspecteur(trice) Certifié(e) RBQ :</strong></p>
                    <div style="position: relative; height: 120px; display: flex; align-items: center; margin-bottom: 10px; margin-top: 10px;">
                        ${signatureUrl ? `<img src="${signatureUrl}" style="max-height: 80px; position: absolute; z-index: 1;" alt="Signature">` : ''}
                        ${sealUrl ? `<img src="${sealUrl}" style="max-height: 120px; position: absolute; left: 160px; opacity: 0.8; z-index: 0;" alt="Sceau">` : ''}
                    </div>
                    <p style="border-top: 1px solid #0f172a; padding-top: 5px; color: #64748b; font-size: 0.9rem;">${inspectorName}</p>
                    ${certifRBQ ? `<p style="margin-top: 4px; color: #3b82f6; font-size: 0.85rem;">Cert. RBQ : ${certifRBQ}</p>` : ''}
                </div>
            </div>

            <p style="margin-top: 50px; font-style: italic; color: #94a3b8; font-size: 0.82rem; text-align: center;">
                Document confidentiel délivré le ${new Date().toLocaleDateString('fr-CA')} — Conservation obligatoire 5 ans (REIBH 2024)
            </p>
        </div>
    `,

    // ================================================================
    // LOCALISATION GOOGLE MAPS
    // ================================================================
    localisation: (address) => {
        if (!address || address.trim() === '') return '';
        const encodedAddress = encodeURIComponent(address);
        return `
        <div class="page-break" style="padding-top: 50px;">
            <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 30px; font-size: 1.8rem;">Localisation de la propriété</h2>
            <p style="margin-bottom: 20px; font-size: 1.1rem; color: #334155;">L'inspection visuelle référencée dans ce rapport s'applique au bâtiment situé à :</p>
            <p style="margin-bottom: 30px; font-size: 1.25rem; font-weight: bold; color: #0f172a; padding-left: 20px; border-left: 4px solid #3b82f6;">${address}</p>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; height: 450px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <iframe width="100%" height="100%" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"
                    src="https://maps.google.com/maps?q=${encodedAddress}&t=&z=16&ie=UTF8&iwloc=&output=embed">
                </iframe>
            </div>
            <p style="margin-top: 12px; font-style: italic; color: #64748b; font-size: 0.88rem;">* Localisation générée par Google Maps selon l'adresse saisie à l'ouverture du dossier.</p>
        </div>
        `;
    },

    // ================================================================
    // FACTURE
    // ================================================================
    facture: (clientName, address, prix, idFacture, certifRBQ = "") => {
        const montant = parseFloat(prix) || 0;
        const tps = montant * 0.05;
        const tvq = montant * 0.09975;
        const total = montant + tps + tvq;
        const cp = window.AppCompanyProfile || {};
        const companyName = cp.name || "KZO InspectPro";
        const companyAddress = cp.address || "Québec, Canada";
        const companyPhone = cp.phone || "(000) 000-0000";
        const companyEmail = cp.email || "email@entreprise.com";
        const companyTps = cp.tps || "";
        const companyTvq = cp.tvq || "";

        return `
        <div class="page-break" style="padding-top: 50px; font-family: 'Inter', sans-serif;">
            <div style="border: 2px solid #0f172a; padding: 40px; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px;">
                    <div>
                        <h1 style="font-size: 2rem; color: #0f172a; margin: 0 0 4px;">FACTURE</h1>
                        <p style="color: #64748b; font-size: 0.9rem;">Services d'inspection en bâtiment d'habitation</p>
                    </div>
                    <div style="text-align: right;">
                        <p style="font-size: 1.1rem; font-weight: bold; color: #0f172a;">${companyName}</p>
                        <p style="color: #64748b; font-size: 0.88rem;">${companyAddress}</p>
                        <p style="color: #64748b; font-size: 0.88rem;">Tél : ${companyPhone}</p>
                        <p style="color: #64748b; font-size: 0.88rem;">${companyEmail}</p>
                        ${companyTps ? `<p style="color: #64748b; font-size: 0.85rem;">TPS : ${companyTps}</p>` : ''}
                        ${companyTvq ? `<p style="color: #64748b; font-size: 0.85rem;">TVQ : ${companyTvq}</p>` : ''}
                        ${certifRBQ ? `<p style="color: #3b82f6; font-size: 0.85rem; font-weight: 600;">Cert. RBQ : ${certifRBQ}</p>` : ''}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                    <div>
                        <p style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">Facturé à :</p>
                        <p style="color: #334155;">${clientName || 'Client inconnu'}</p>
                        <p style="color: #64748b; font-size: 0.9rem;">Propriété : ${address || 'Adresse à spécifier'}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Facture No :</strong> ${idFacture}</p>
                        <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-CA')}</p>
                        <p style="margin-top: 8px; color: #64748b; font-size: 0.88rem;">Norme : BNQ 3009-500</p>
                        <p style="color: #64748b; font-size: 0.88rem;">REIBH 2024 — RBQ</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <thead>
                        <tr style="background-color: #0f172a; color: white;">
                            <th style="padding: 12px 16px; text-align: left; border-radius: 4px 0 0 4px;">Description du service</th>
                            <th style="padding: 12px 16px; text-align: right; border-radius: 0 4px 4px 0;">Montant</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background: #f8fafc;">
                            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #334155; line-height: 1.5;">
                                Inspection préachat exhaustive du bâtiment d'habitation<br>
                                <span style="font-size: 0.85rem; color: #64748b;">Conforme à la norme BNQ 3009-500 — REIBH 2024 (RBQ)</span>
                            </td>
                            <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${montant > 0 ? montant.toFixed(2) + ' $' : 'Sur entente'}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="display: flex; justify-content: flex-end;">
                    <div style="width: 280px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                        <div style="display: flex; justify-content: space-between; padding: 10px 16px; background: #f8fafc;">
                            <span style="color: #475569;">Sous-total :</span>
                            <span>${montant > 0 ? montant.toFixed(2) + ' $' : '—'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 10px 16px;">
                            <span style="color: #475569;">TPS (5.000%) :</span>
                            <span>${montant > 0 ? tps.toFixed(2) + ' $' : '—'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 10px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
                            <span style="color: #475569;">TVQ (9.975%) :</span>
                            <span>${montant > 0 ? tvq.toFixed(2) + ' $' : '—'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 14px 16px; background: #0f172a; color: white; font-weight: bold; font-size: 1.1rem;">
                            <span>Total :</span>
                            <span>${montant > 0 ? total.toFixed(2) + ' $' : 'Sur entente'}</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 40px; padding: 16px; background: #f8fafc; border-radius: 6px; font-size: 0.85rem; color: #64748b; border-top: 2px solid #e2e8f0;">
                    <p style="margin-bottom: 4px;">Conditions : Payable sur réception. Merci pour votre confiance !</p>
                    <p>Ce rapport est protégé et confidentiel. Il est destiné exclusivement au(x) client(s) identifié(s) ci-dessus.</p>
                </div>
            </div>
        </div>
        `;
    },

    // ================================================================
    // CONVENTIONS ET PORTÉE
    // ================================================================
    conventions: `
        <div class="page-break" style="padding-top: 50px;">
            <h2 style="margin-bottom: 20px; color: #0f172a; font-size: 1.6rem;">Convention de services et Portée de l'inspection</h2>
            <p style="margin-bottom: 20px; color: #64748b; font-size: 0.9rem;">Conformément aux exigences de la norme BNQ 3009-500 et du REIBH 2024 (RBQ)</p>

            <div style="font-size: 0.95rem; line-height: 1.7; color: #334155;">
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 0 6px 6px 0; margin-bottom: 20px;">
                    <p><strong>IMPORTANT — VEUILLEZ LIRE ATTENTIVEMENT</strong></p>
                    <p style="margin-top: 8px;">L'inspection décrite dans ce rapport est une analyse <strong>VISUELLE ET NON DESTRUCTIVE</strong> des composantes et systèmes apparents et accessibles du bâtiment au moment de l'inspection.</p>
                </div>

                <h3 style="margin-top: 25px; margin-bottom: 10px; color: #1e293b;">Nature et objectifs de l'inspection</h3>
                <p style="margin-bottom: 15px;">L'inspection vise à identifier les défauts majeurs susceptibles de diminuer significativement l'usage, la jouissance ou la valeur du bâtiment, ou présentant un risque pour la sécurité des occupants. Elle ne constitue pas une garantie, une évaluation de la valeur marchande, ni une inspection de conformité réglementaire exhaustive.</p>

                <h3 style="margin-top: 25px; margin-bottom: 10px; color: #1e293b;">Limitations de l'inspection (BNQ 3009-500)</h3>
                <p style="margin-bottom: 15px;">Cette inspection N'INCLUT PAS : l'intérieur des murs et plafonds, derrière les revêtements de plancher, sous la terre, derrière les meubles ou effets personnels. L'inspecteur ne déplace ni meubles, ni isolant, ni neige. Les éléments inaccessibles, cachés ou dissimulés sont exclus de l'inspection.</p>

                <h3 style="margin-top: 25px; margin-bottom: 10px; color: #1e293b;">Exclusions standard</h3>
                <p style="margin-bottom: 15px;">Sauf indication spécifique dans le corps du rapport, les éléments suivants sont exclus : contamination des sols, amiante caché, moisissures dissimulées, gaz radon (sauf recommandation de test), efficacité énergétique certifiée, conformité complète aux codes locaux, estimation des coûts de réparation, équipements spécialisés (piscines, spas, ascenseurs, systèmes de sécurité intégrés, systèmes de gicleurs).</p>

                <h3 style="margin-top: 25px; margin-bottom: 10px; color: #1e293b;">Portée de l'inspection — Catégorie du bâtiment</h3>
                <p style="margin-bottom: 15px;">La présente inspection couvre un bâtiment d'habitation tel que défini dans la norme BNQ 3009-500. Les parties communes d'une copropriété divise ne sont incluses que si expressément mentionné dans le contrat de service.</p>

                <h3 style="margin-top: 25px; margin-bottom: 10px; color: #1e293b;">Responsabilité et durée de conservation</h3>
                <p style="margin-bottom: 15px;">Ce rapport représente l'état apparent du bâtiment au jour et à l'heure de l'inspection. Il est conservé dans nos archives pendant 5 ans conformément aux exigences du REIBH 2024. L'inspecteur détient une assurance responsabilité professionnelle erreurs et omissions tel que requis par la RBQ.</p>
            </div>
        </div>
    `,

    // ================================================================
    // GUIDE D'ENTRETIEN SAISONNIER
    // ================================================================
    guideEntretien: `
        <div class="page-break" style="padding-top: 50px;">
            <h2 style="margin-bottom: 10px; color: #0f172a; font-size: 1.6rem;">Guide d'entretien préventif saisonnier</h2>
            <p style="margin-bottom: 30px; color: #64748b;">La longévité de votre propriété dépend d'un entretien rigoureux et régulier. Voici notre calendrier recommandé :</p>

            <div style="margin-bottom: 28px; background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #065f46; margin-bottom: 12px;">🌱 PRINTEMPS</h3>
                <ul style="line-height: 1.8; padding-left: 20px; color: #064e3b;">
                    <li>Nettoyer les gouttières et descentes pluviales — s'assurer que l'eau s'écoule à plus de 1.5m des fondations.</li>
                    <li>Inspecter la toiture pour détecter les bardeaux manquants, endommagés ou gondolés.</li>
                    <li>Vérifier le calfeutrage autour des fenêtres, portes et pénétrations — remplacer si craquelé.</li>
                    <li>Inspecter les fondations intérieurement et extérieurement pour toute nouvelle fissure apparue l'hiver.</li>
                    <li>Faire vérifier et entretenir le système de climatisation avant la saison chaude.</li>
                    <li>Tester tous les détecteurs de fumée et de CO — remplacer les piles si nécessaire.</li>
                </ul>
            </div>

            <div style="margin-bottom: 28px; background: #fefce8; border-left: 4px solid #eab308; padding: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #713f12; margin-bottom: 12px;">☀️ ÉTÉ</h3>
                <ul style="line-height: 1.8; padding-left: 20px; color: #713f12;">
                    <li>Vérifier la ventilation du vide sanitaire et du grenier — s'assurer que les évents sont dégagés.</li>
                    <li>Inspecter les joints et calfeutrage autour des bains, douches et éviers — refaire si décollé.</li>
                    <li>Vérifier la tuyauterie apparente pour détecter des signes de fuites ou de condensation excessive.</li>
                    <li>Tailler les arbres et arbustes pour maintenir un dégagement d'au moins 1 mètre de la maison.</li>
                    <li>Nettoyer les filtres du VRC/VRE et de la hotte de cuisine.</li>
                    <li>Inspecter les solins de la cheminée et les joints de la toiture après les pluies importantes.</li>
                </ul>
            </div>

            <div style="margin-bottom: 28px; background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #7c2d12; margin-bottom: 12px;">🍂 AUTOMNE</h3>
                <ul style="line-height: 1.8; padding-left: 20px; color: #7c2d12;">
                    <li>Purger et fermer les robinets extérieurs antigel avant le gel — indispensable pour éviter l'éclatement.</li>
                    <li>Faire ramoner la cheminée si vous utilisez un foyer ou un poêle au bois.</li>
                    <li>Nettoyer les gouttières après la chute des feuilles — vérifier les attaches.</li>
                    <li>Faire entretenir et nettoyer le système de chauffage (filtre, brûleurs) par un professionnel.</li>
                    <li>Vérifier l'isolation des combles avant l'hiver — compléter si insuffisante (moins de R-40).</li>
                    <li>Inspecter les joints de fenêtres et appliquer un calfeutrant si nécessaire.</li>
                </ul>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1e3a8a; margin-bottom: 12px;">❄️ HIVER</h3>
                <ul style="line-height: 1.8; padding-left: 20px; color: #1e40af;">
                    <li>Surveiller la formation de barrières de glace (ice dam) sur les débords de toit — signe de ventilation insuffisante.</li>
                    <li>Tester mensuellement les détecteurs de fumée et de monoxyde de carbone.</li>
                    <li>Nettoyer régulièrement les filtres de la hotte de cuisine et de l'échangeur d'air (VRC).</li>
                    <li>S'assurer que la sortie de sécheuse et les évents de ventilation ne sont pas bloqués par la neige.</li>
                    <li>Déneiger le pourtour du bâtiment pour éloigner la neige des fondations.</li>
                    <li>Vérifier que les sorties d'air du chauffe-eau à gaz et de la fournaise sont dégagées.</li>
                </ul>
            </div>
        </div>
    `,

    // ================================================================
    // ANNEXE — NORMES DE PRATIQUE (BNQ 3009-500 / REIBH 2024)
    // ================================================================
    normesPratique: function(normeSelected = "BNQ 3009-500 (RBQ)") {
        let html = '<div class="page-break" style="padding-top: 50px;">';
        html += '<h2 style="margin-bottom: 10px; font-size: 1.5rem; color: #0f172a;">ANNEXE — Normes de pratiques professionnelles</h2>';
        html += '<p style="margin-bottom: 8px; color: #64748b;">Norme applicable : <strong>' + normeSelected + '</strong></p>';
        html += '<p style="margin-bottom: 30px; color: #64748b; font-style: italic; font-size: 0.9rem;">Cette annexe présente les principales exigences normatives encadrant la présente inspection, conformément à la norme BNQ 3009-500 et au REIBH 2024 de la Régie du bâtiment du Québec (RBQ).</p>';

        const articles = [
            {
                titre: "1. Portée et objectifs de la norme BNQ 3009-500",
                contenu: "La norme BNQ 3009-500 établit les pratiques minimales pour l'inspection d'un bâtiment d'habitation en vue d'une transaction immobilière au Québec. Elle a été élaborée par le Bureau de normalisation du Québec (BNQ) à la demande de la Régie du bâtiment du Québec (RBQ). Elle vise à uniformiser et à rehausser la prestation de services des inspecteurs en bâtiment, tout en permettant aux consommateurs de mieux comprendre la nature et les limites de l'inspection.",
                ref: "BNQ 3009-500 — Section 1"
            },
            {
                titre: "2. Qualifications et certification de l'inspecteur",
                contenu: "Conformément au Règlement sur l'encadrement des inspecteurs en bâtiments d'habitation (REIBH 2024), l'inspecteur doit être titulaire d'un certificat délivré par la RBQ (Catégorie 1 : bâtiments de 1 à 6 unités; Catégorie 2 : grands bâtiments). Il doit détenir une attestation d'études collégiales (AEC) basée sur la norme BNQ 3009-500, ainsi qu'une assurance responsabilité professionnelle erreurs et omissions d'au moins 1 000 000 $ (Cat. 1) ou 2 000 000 $ (Cat. 2).",
                ref: "REIBH 2024 — Articles 4 à 12"
            },
            {
                titre: "3. Contenu obligatoire du rapport d'inspection",
                contenu: "Le rapport d'inspection doit obligatoirement mentionner : l'édition applicable de la norme BNQ 3009-500, la catégorie de bâtiment inspecté, le numéro de certificat RBQ de l'inspecteur, la décision du client concernant l'inspection des parties communes (copropriété divise), et la déclaration de tout conflit d'intérêts. Le rapport doit être remis au client dans les délais prévus au contrat de service.",
                ref: "REIBH 2024 — Article 18; BNQ 3009-500 — Section 5"
            },
            {
                titre: "4. Nature visuelle et non destructive de l'inspection",
                contenu: "L'inspection est exclusivement visuelle et non destructive. L'inspecteur examine les composantes apparentes et accessibles sans déplacer les meubles, sans ouvrir les murs, sans enlever les revêtements de plancher, et sans procéder à des tests destructifs. L'inspecteur peut utiliser des outils d'aide à l'inspection (humidimètre, caméra thermique à titre indicatif, lampe de poche, binoculaires) dans le cadre de son analyse visuelle.",
                ref: "BNQ 3009-500 — Section 3.2"
            },
            {
                titre: "5. Composantes inspectées — Extérieur du bâtiment",
                contenu: "L'inspecteur examine les éléments extérieurs suivants lorsqu'ils sont visibles et accessibles : terrain et drainage, fondations visibles, revêtement extérieur, fenêtres et portes extérieures, toiture et couverture, solins, gouttières et descentes pluviales, cheminées, galeries, balcons et escaliers extérieurs, garages et bâtiments détachés selon le mandat.",
                ref: "BNQ 3009-500 — Section 4.1"
            },
            {
                titre: "6. Composantes inspectées — Intérieur du bâtiment",
                contenu: "À l'intérieur, l'inspecteur examine : les planchers, murs et plafonds apparents, les escaliers intérieurs et garde-corps, les portes et fenêtres intérieures, les salles de bain et la cuisine, le sous-sol et le vide sanitaire (si accessibles), le grenier (si accessible et praticable), ainsi que les détecteurs de fumée et de monoxyde de carbone.",
                ref: "BNQ 3009-500 — Section 4.2"
            },
            {
                titre: "7. Systèmes mécaniques — Plomberie",
                contenu: "L'inspecteur évalue visuellement les systèmes de plomberie apparents : tuyauterie d'alimentation et d'évacuation visible, chauffe-eau (type, âge approximatif, présence de la soupape TPR), robinetterie, pompe de puisard si accessible, et systèmes sanitaires autonomes (fosse septique, puits) lorsque visibles et dans les limites du mandat.",
                ref: "BNQ 3009-500 — Section 4.3"
            },
            {
                titre: "8. Systèmes mécaniques — Électricité",
                contenu: "L'inspection électrique visuelle couvre : le panneau de distribution (type, capacité, état apparent), le câblage visible, la mise à la terre, les prises DDFT/GFCI dans les zones requises (salles de bain, cuisine, extérieur, garage), ainsi que tout défaut apparent de sécurité électrique. L'inspecteur ne procède pas à des tests de circuits sous tension au-delà des tests de prise standards.",
                ref: "BNQ 3009-500 — Section 4.4"
            },
            {
                titre: "9. Systèmes mécaniques — Chauffage, ventilation et climatisation",
                contenu: "L'inspection CVAC couvre : le système de chauffage principal (type, âge estimé, état apparent), les systèmes de ventilation (VRC/VRE, sorties d'extraction), la climatisation centrale si présente, ainsi que les conduites de ventilation apparentes. L'inspecteur ne démonte pas les appareils et ne procède pas à des tests de combustion.",
                ref: "BNQ 3009-500 — Section 4.5"
            },
            {
                titre: "10. Matières dangereuses — Recommandations de tests",
                contenu: "La norme BNQ 3009-500 prévoit que l'inspecteur signale les situations susceptibles de révéler la présence de matières dangereuses et recommande les tests appropriés : amiante (vermiculite, calorifugeage), plomb (peinture, tuyauterie), pyrite (dalle de béton au sous-sol), radon (zones à risque selon Santé Canada). L'inspecteur ne procède pas lui-même aux tests de laboratoire.",
                ref: "BNQ 3009-500 — Section 4.8; Santé Canada"
            },
            {
                titre: "11. Limites et exclusions normatives",
                contenu: "Conformément à la norme BNQ 3009-500, les éléments suivants sont exclus de l'inspection standard : la contamination des sols et des eaux souterraines, les vices cachés au sens du Code civil du Québec, la conformité réglementaire exhaustive, les systèmes spécialisés (piscines, ascenseurs, gicleurs, systèmes d'alarme intégrés), l'estimation des coûts de réparation, ainsi que tout élément inaccessible, caché ou dissimulé.",
                ref: "BNQ 3009-500 — Section 3.4"
            },
            {
                titre: "12. Conservation du rapport et obligations post-inspection",
                contenu: "Conformément au REIBH 2024, l'inspecteur est tenu de conserver une copie du rapport d'inspection et du contrat de service pendant une période minimale de 5 ans. Le client peut demander une copie de son rapport pendant cette période. L'inspecteur doit également maintenir à jour ses compétences par la formation continue telle qu'exigée par la RBQ pour le renouvellement de son certificat.",
                ref: "REIBH 2024 — Articles 25 à 28"
            }
        ];

        articles.forEach(article => {
            html += `
                <div style="margin-bottom: 30px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid;">
                    <h3 style="font-size: 1.05rem; color: #1e293b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">${article.titre}</h3>
                    <p style="font-size: 0.9rem; line-height: 1.7; color: #475569; text-align: justify;">${article.contenu}</p>
                    <p style="margin-top: 10px; font-size: 0.8rem; color: #94a3b8; font-style: italic;">Référence : ${article.ref}</p>
                </div>
            `;
        });

        html += `
            <div style="margin-top: 40px; padding: 20px; background: #0f172a; color: white; border-radius: 8px; text-align: center;">
                <p style="font-size: 0.9rem; line-height: 1.7; opacity: 0.85;">
                    Ce rapport a été produit conformément à la norme <strong>BNQ 3009-500</strong> et au
                    <strong>Règlement sur l'encadrement des inspecteurs en bâtiments d'habitation (REIBH 2024)</strong>
                    de la Régie du bâtiment du Québec.<br>
                    Pour consulter la norme intégrale, visitez : <strong>bnq.qc.ca</strong> | Pour le REIBH : <strong>rbq.gouv.qc.ca</strong>
                </p>
            </div>
        `;

        html += '</div>';
        return html;
    }
};
