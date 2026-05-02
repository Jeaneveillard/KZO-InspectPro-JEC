# Rapport 40+ Pages — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le rapport PDF en un document professionnel 40+ pages avec pages légales pré-remplies, documents signés intégrés, table des matières, et sections d'inspection en flux continu sans sauts de page forcés.

**Architecture:** `legal_docs.js` (nouveau) contient les textes légaux de l'inspecteur. `boilerplate.js` reçoit 4 nouvelles fonctions de page. `data.js` reçoit 7 nouveaux champs dans `s_admin`. `app.js` réorganise l'ordre des pages et supprime les `class="page-break"` des divs de section pour un flux continu.

**Tech Stack:** JavaScript vanilla, HTML/CSS inline, `window.print()` pour PDF, localStorage, base64 pour images uploadées.

---

## Fichiers modifiés

| Fichier | Rôle |
|---------|------|
| `legal_docs.js` | **CRÉER** — objet `LEGAL_DOCS` avec 6 textes légaux (placeholders) |
| `data.js` | Ajouter 7 champs dans `ss_admin_2` |
| `boilerplate.js` | Ajouter 4 fonctions : `tableDesMatières`, `ficheDescriptionMaison`, `pageDocumentsRecus`, `pageDocumentLegal` |
| `app.js` | Handlers upload nouveaux champs + réorganisation ordre pages + suppression page-break sections |
| `KZO_Inspect.html` | Ajout `<script src="legal_docs.js">` + bump `?v=N` |
| `sw.js` | Bump `CACHE_NAME` v16 → v17 |

---

## Task 1 : Créer `legal_docs.js`

**Files:**
- Create: `C:/Users/jeane/Desktop/Amboul/JEC/legal_docs.js`

- [ ] **Étape 1 — Créer le fichier**

Créer `C:/Users/jeane/Desktop/Amboul/JEC/legal_docs.js` avec ce contenu exact :

```js
// ================================================================
//  JEC / KZO InspectPro — Documents légaux de l'inspecteur
//  Remplacez chaque [COLLER TON TEXTE ICI] par votre texte.
//  Ce fichier ne doit PAS être versionné s'il contient des
//  informations confidentielles — ajoutez-le au .gitignore si besoin.
// ================================================================

const LEGAL_DOCS = {

    // Page 2 du rapport — Lettre de remerciement
    lettreRemerciement: `[COLLER VOTRE LETTRE DE REMERCIEMENT ICI]`,

    // Page 6 — Clause du contrat
    clauseContrat: `[COLLER LE TEXTE DE LA CLAUSE DU CONTRAT ICI]`,

    // Page 7 — Contrat d'inspection
    contratInspection: `[COLLER LE TEXTE DU CONTRAT D'INSPECTION ICI]`,

    // Page 8 — Contrat client
    contratClient: `[COLLER LE TEXTE DU CONTRAT CLIENT ICI]`,

    // Page 9 — Déclaration de conflit d'intérêt
    declarationConflitInteret: `[COLLER LE TEXTE DE LA DÉCLARATION DE CONFLIT D'INTÉRÊT ICI]`,

    // Page 10 — Formulaire de limitations
    formulaireLimitations: `[COLLER LE TEXTE DU FORMULAIRE DE LIMITATIONS ICI]`

};
```

- [ ] **Étape 2 — Vérifier**

Confirmer que le fichier existe :
```bash
ls "C:/Users/jeane/Desktop/Amboul/JEC/legal_docs.js"
```
Résultat attendu : le fichier est listé.

- [ ] **Étape 3 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add legal_docs.js
git commit -m "feat: ajout legal_docs.js avec placeholders documents légaux inspecteur"
```

---

## Task 2 : Nouveaux champs dans `data.js`

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/data.js`

- [ ] **Étape 1 — Lire data.js**

Lire `data.js`. Localiser la sous-section `ss_admin_2` :
```js
{ id: "ss_admin_2", title: "Pièces jointes & Synchronisation", fields: [
    { id: "client_docs", type: "file", label: "Déclaration du vendeur / Documents remis" },
    { id: "sync_status", type: "action", label: "🔄 Forcer la sauvegarde locale" }
]}
```

- [ ] **Étape 2 — Ajouter les 7 nouveaux champs**

Remplacer le bloc `ss_admin_2` par :
```js
{ id: "ss_admin_2", title: "Pièces jointes & Synchronisation", fields: [
    { id: "description_narrative", type: "text", label: "Description narrative de la propriété avant inspection", placeholder: "Décrivez l'état général apparent, les conditions d'accès, les limitations observées avant l'inspection..." },
    { id: "client_docs", type: "file", label: "📎 Documents reçus (déclaration vendeur, plans, etc.)" },
    { id: "doc_clause_signe", type: "file", label: "✍️ Clause du contrat — scan signé (inspecteur)" },
    { id: "doc_contrat_signe", type: "file", label: "✍️ Contrat d'inspection — scan signé (inspecteur + client)" },
    { id: "doc_contrat_client_signe", type: "file", label: "✍️ Contrat client — scan signé (client)" },
    { id: "doc_conflit_signe", type: "file", label: "✍️ Déclaration conflit d'intérêt — scan signé (inspecteur)" },
    { id: "doc_limitations_signe", type: "file", label: "✍️ Formulaire de limitations — scan signé (inspecteur + client)" },
    { id: "sync_status", type: "action", label: "🔄 Forcer la sauvegarde locale" }
]}
```

- [ ] **Étape 3 — Vérifier**

Lire les lignes modifiées dans `data.js` et confirmer que les 7 champs sont présents dans `ss_admin_2` avec les bons `id`.

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add data.js
git commit -m "feat: ajout 7 champs s_admin (description narrative + 5 uploads documents signés)"
```

---

## Task 3 : 4 nouvelles fonctions dans `boilerplate.js`

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/boilerplate.js`

- [ ] **Étape 1 — Lire la fin de boilerplate.js**

Lire les 20 dernières lignes de `boilerplate.js`. Localiser la fermeture de l'objet BOILERPLATE :
```js
    }
};
```

- [ ] **Étape 2 — Ajouter les 4 nouvelles fonctions**

Remplacer la fermeture `};` finale par :

```js
    },

    // Table des matières auto-générée
    tableDesMatières: function(sections) {
        const items = [
            'Lettre de remerciement',
            'Table des matières',
            'Description de la propriété',
            'Documents reçus',
            'Clause du contrat',
            'Contrat d\'inspection',
            'Contrat client',
            'Déclaration de conflit d\'intérêt',
            'Formulaire de limitations',
            'Rapport d\'inspection'
        ];
        sections.forEach(s => {
            if (s.id === 's_cover' || s.id === 's_admin') return;
            items.push('  — ' + s.title);
        });
        items.push('Guide d\'entretien');
        items.push('Annexe — Normes de pratique');

        const rows = items.map((item, i) =>
            `<tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:10px 16px; color:${item.startsWith('  —') ? '#475569' : '#0f172a'}; font-size:${item.startsWith('  —') ? '0.9rem' : '1rem'}; font-weight:${item.startsWith('  —') ? '400' : '600'};">${item.replace(/^  — /, '↳ ')}</td>
            </tr>`
        ).join('');

        return `<div class="page-break" style="padding:50px 60px;">
            <h2 style="color:#1A56DB; border-bottom:3px solid #1A56DB; padding-bottom:12px; margin-bottom:30px; font-size:1.8rem;">Table des matières</h2>
            <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                ${rows}
            </table>
        </div>`;
    },

    // Fiche description maison + paragraphe narratif
    ficheDescriptionMaison: function(infos) {
        const { typeBatiment, typeGarage, superficie, annee, meteo, temperature, norme, dateInspection, narratif } = infos;
        const narratifHtml = narratif
            ? `<div style="margin-top:28px; padding:24px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                <h3 style="color:#1e40af; margin-bottom:14px; font-size:1.1rem;">Description narrative</h3>
                <p style="color:#334155; line-height:1.8; font-size:0.95rem; white-space:pre-wrap;">${narratif}</p>
               </div>`
            : '';

        return `<div class="page-break" style="padding:50px 60px;">
            <h2 style="color:#1A56DB; border-bottom:3px solid #1A56DB; padding-bottom:12px; margin-bottom:30px; font-size:1.8rem;">Description de la propriété avant inspection</h2>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; background:#f8fafc; padding:24px; border-radius:10px; border:1px solid #e2e8f0;">
                ${typeBatiment ? `<div><strong>Type de bâtiment :</strong> ${typeBatiment}</div>` : ''}
                ${typeGarage ? `<div><strong>Type de garage :</strong> ${typeGarage}</div>` : ''}
                ${superficie ? `<div><strong>Superficie habitable :</strong> ${superficie} m²</div>` : ''}
                ${annee ? `<div><strong>Année de construction :</strong> ${annee}</div>` : ''}
                ${meteo ? `<div><strong>Météo lors de l'inspection :</strong> ${meteo}</div>` : ''}
                ${temperature ? `<div><strong>Température extérieure :</strong> ${temperature} °C</div>` : ''}
                <div><strong>Norme applicable :</strong> ${norme}</div>
                <div><strong>Date d'inspection :</strong> ${dateInspection}</div>
            </div>
            ${narratifHtml}
        </div>`;
    },

    // Page documents reçus avec scan intégré
    pageDocumentsRecus: function(scanUrl) {
        const scanHtml = scanUrl
            ? `<div style="margin-top:24px;">
                <h3 style="color:#475569; font-size:1rem; margin-bottom:12px;">📎 Document joint :</h3>
                <img src="${scanUrl}" style="width:100%; max-height:80vh; object-fit:contain; border:1px solid #e2e8f0; border-radius:8px;">
               </div>`
            : `<div style="margin-top:24px; padding:24px; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:10px; text-align:center; color:#94a3b8; font-size:0.95rem;">
                Aucun document joint — à ajouter via l'application avant impression
               </div>`;

        return `<div class="page-break" style="padding:50px 60px;">
            <h2 style="color:#1A56DB; border-bottom:3px solid #1A56DB; padding-bottom:12px; margin-bottom:30px; font-size:1.8rem;">Documents reçus</h2>
            <p style="color:#475569; font-size:0.95rem; margin-bottom:20px; font-style:italic;">Les documents ci-joints ont été remis à l'inspecteur avant ou lors de la visite. Leur contenu n'a pas été vérifié dans le cadre de cette inspection visuelle.</p>
            ${scanHtml}
        </div>`;
    },

    // Template générique pour les 5 documents légaux
    pageDocumentLegal: function(titre, texte, infos, signataires, scanUrl) {
        const { inspectorName, clientName, address, date, prix, norme, dossierId } = infos;

        const sigLines = signataires.map(s =>
            `<div style="margin-top:30px; padding:20px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc;">
                <div style="font-weight:700; color:#1e293b; margin-bottom:8px;">${s.role} : ${s.nom}</div>
                <div style="display:flex; gap:40px; margin-top:16px; align-items:flex-end;">
                    <div style="flex:2;">
                        <div style="border-bottom:1px solid #94a3b8; height:40px;"></div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:4px;">Signature</div>
                    </div>
                    <div style="flex:1;">
                        <div style="border-bottom:1px solid #94a3b8; height:40px;"></div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:4px;">Date</div>
                    </div>
                </div>
             </div>`
        ).join('');

        const scanHtml = scanUrl
            ? `<div class="page-break" style="padding:20px 0;">
                <h3 style="color:#475569; font-size:1rem; margin-bottom:12px;">✍️ Document signé :</h3>
                <img src="${scanUrl}" style="width:100%; max-height:85vh; object-fit:contain; border:1px solid #e2e8f0; border-radius:8px;">
               </div>`
            : '';

        return `<div class="page-break" style="padding:50px 60px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px;">
                <div>
                    <h2 style="color:#1A56DB; border-bottom:3px solid #1A56DB; padding-bottom:12px; font-size:1.8rem;">${titre}</h2>
                </div>
                <div style="text-align:right; font-size:0.85rem; color:#64748b; line-height:1.8;">
                    <div>No dossier : ${dossierId || ''}</div>
                    <div>Date : ${date}</div>
                    <div>Norme : ${norme || 'REIBH 2024'}</div>
                </div>
            </div>
            <div style="margin-bottom:20px; padding:16px; background:#f1f5f9; border-radius:8px; font-size:0.9rem; line-height:1.6;">
                <strong>Inspecteur :</strong> ${inspectorName} &nbsp;|&nbsp;
                <strong>Client :</strong> ${clientName} &nbsp;|&nbsp;
                <strong>Adresse :</strong> ${address}
                ${prix ? ` &nbsp;|&nbsp; <strong>Honoraires :</strong> ${prix}$` : ''}
            </div>
            <div style="white-space:pre-wrap; line-height:1.8; font-size:0.95rem; color:#1e293b; margin-bottom:30px;">${texte}</div>
            ${sigLines}
            ${scanHtml}
        </div>`;
    }

};
```

- [ ] **Étape 3 — Vérifier la syntaxe**

Lire les 30 dernières lignes de `boilerplate.js` et confirmer :
- `tableDesMatières`, `ficheDescriptionMaison`, `pageDocumentsRecus`, `pageDocumentLegal` sont présents
- Le fichier se termine par `};`

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add boilerplate.js
git commit -m "feat: 4 nouvelles fonctions boilerplate (tableDesMatières, ficheDescriptionMaison, pageDocumentsRecus, pageDocumentLegal)"
```

---

## Task 4 : Réorganisation rapport + flux continu dans `app.js`

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

Cette task est la plus importante. Elle a deux parties :
- **4A** : Handlers pour sauvegarder les nouvelles uploads dans `inspectionData.clientInfo`
- **4B** : Réorganiser l'ordre des pages dans `generateReport()` + supprimer page-break des sections

### Partie 4A — Handlers upload nouveaux champs

- [ ] **Étape 1 — Lire le handler d'upload existant pour inspector_signature**

Dans `app.js`, chercher `inspector_signature` pour comprendre le pattern de sauvegarde des fichiers. Chercher aussi `client_docs` pour voir comment les fichiers uploadés sont stockés.

```bash
grep -n "inspector_signature\|client_docs\|signatureUrl\|sealUrl\|inspectionData.clientInfo" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -20
```

- [ ] **Étape 2 — Trouver où ajouter les nouveaux handlers**

Chercher dans `app.js` le bloc qui gère les champs `file` de type générique dans `s_admin`. Les nouveaux champs (`doc_clause_signe`, `doc_contrat_signe`, etc.) doivent sauvegarder leur base64 dans `inspectionData.clientInfo`.

Chercher le pattern :
```js
} else if (field.type === 'file') {
```
ou similaire dans la boucle de rendu de `s_admin`.

- [ ] **Étape 3 — Ajouter la logique de sauvegarde pour les 5 nouveaux champs file**

Dans la fonction qui gère le rendu et les événements des champs file (probablement vers ligne 800-900), après le handler existant pour `client_docs`, ajouter :

```js
// Sauvegarde des scans de documents légaux signés
const SIGNED_DOC_FIELDS = ['doc_clause_signe', 'doc_contrat_signe', 'doc_contrat_client_signe', 'doc_conflit_signe', 'doc_limitations_signe', 'client_docs'];
if (SIGNED_DOC_FIELDS.includes(field.id)) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*'; // compressImage() ne supporte pas les PDF
    fileInput.id = field.id + '_input';
    fileInput.style.display = 'none';
    
    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'btn secondary';
    uploadBtn.style.cssText = 'margin-top:8px; font-size:0.85rem;';
    uploadBtn.textContent = '📎 Choisir un fichier';
    
    const preview = document.createElement('div');
    preview.style.cssText = 'margin-top:8px; font-size:0.85rem; color:#059669;';
    
    // Afficher si déjà uploadé
    const existingUrl = inspectionData.clientInfo[field.id + 'Url'];
    if (existingUrl) preview.textContent = '✅ Fichier chargé';
    
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const check = validateFile(file);
        if (!check.valid) { showToast(check.error, 'error'); return; }
        const compressed = await compressImage(file, 1600, 0.85);
        inspectionData.clientInfo[field.id + 'Url'] = compressed;
        saveAppState();
        preview.textContent = '✅ ' + file.name;
        showToast('Document chargé.', 'success');
    });
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'margin-bottom:16px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;';
    wrapper.innerHTML = `<label style="font-weight:600; color:#374151; font-size:0.9rem;">${field.label}</label>`;
    wrapper.appendChild(fileInput);
    wrapper.appendChild(uploadBtn);
    wrapper.appendChild(preview);
    div.appendChild(wrapper);
    continue; // Ne pas utiliser le rendu générique pour ces champs
}
```

**Note :** Si `app.js` gère déjà les champs `file` de façon générique avec upload + base64, adapter ce code pour s'intégrer au pattern existant plutôt que de le dupliquer. L'objectif est que le base64 soit stocké dans `inspectionData.clientInfo[field.id + 'Url']`.

- [ ] **Étape 4 — Commit 4A**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: handlers upload scans documents légaux signés → inspectionData.clientInfo"
```

### Partie 4B — Réorganiser l'ordre des pages + flux continu sections

- [ ] **Étape 5 — Lire le bloc generateReport() dans app.js**

Lire `app.js` de la ligne 2095 à 2425 pour voir l'ordre complet actuel des pages.

- [ ] **Étape 6 — Supprimer page-break des divs de section**

Dans la boucle sections (ligne ~2277), localiser :
```js
html += `<div class="page-break" style="padding-top: 50px;">
         <h2 style="color: #1A56DB; margin-bottom: 20px; border-bottom: 2px solid #1A56DB; padding-bottom: 10px; font-size: 1.8rem;">${section.title}</h2>
```
Remplacer par (supprimer `class="page-break"`, ajouter séparateur visuel) :
```js
html += `<div style="padding-top: 40px; margin-top: 30px; border-top: 2px solid #e2e8f0;">
         <h2 style="color: #1A56DB; margin-bottom: 20px; border-bottom: 2px solid #1A56DB; padding-bottom: 10px; font-size: 1.8rem;">${section.title}</h2>
```

- [ ] **Étape 7 — Réorganiser l'ordre des pages dans generateReport()**

Après le bloc de la page de couverture (ligne ~2199) et avant `BOILERPLATE.facture`, remplacer tout le bloc jusqu'à `// CORPS DU RAPPORT` par le nouvel ordre :

```js
        // Préparer les infos communes pour les documents légaux
        const legalInfos = {
            inspectorName: safeInspectorName,
            clientName: clientName,
            address: address,
            date: dateInspection,
            prix: prix,
            norme: safeNorme,
            dossierId: safeDossierId
        };

        // PAGE 2 — LETTRE DE REMERCIEMENT
        if (typeof LEGAL_DOCS !== 'undefined' && LEGAL_DOCS.lettreRemerciement) {
            html += BOILERPLATE.lettreIntro(clientName, safeNorme, safeInspectorName, signatureUrl, sealUrl);
        } else if (BOILERPLATE.lettreRemerciement) {
            html += BOILERPLATE.lettreRemerciement(clientName, address, safeInspectorName,
                sanitizeHTML(window.AppCompanyProfile ? window.AppCompanyProfile.name : 'KZO InspectPro'),
                signatureUrl);
        }

        // PAGE 3 — TABLE DES MATIÈRES
        if (BOILERPLATE.tableDesMatières) {
            html += BOILERPLATE.tableDesMatières(inspectionData.sections);
        }

        // PAGE 4 — DESCRIPTION DE LA MAISON
        if (BOILERPLATE.ficheDescriptionMaison) {
            const narratifRaw = document.getElementById('description_narrative')?.value || '';
            html += BOILERPLATE.ficheDescriptionMaison({
                typeBatiment, typeGarage, superficie, annee, meteo, temperature,
                norme: safeNorme,
                dateInspection,
                narratif: sanitizeHTML(narratifRaw)
            });
        }

        // PAGE 5 — DOCUMENTS REÇUS
        if (BOILERPLATE.pageDocumentsRecus) {
            const docsUrl = inspectionData.clientInfo['client_docsUrl'] || null;
            html += BOILERPLATE.pageDocumentsRecus(docsUrl);
        }

        // PAGES 6-10 — DOCUMENTS LÉGAUX
        if (BOILERPLATE.pageDocumentLegal && typeof LEGAL_DOCS !== 'undefined') {
            html += BOILERPLATE.pageDocumentLegal(
                'Clause du contrat', LEGAL_DOCS.clauseContrat, legalInfos,
                [{ role: 'Inspecteur', nom: safeInspectorName }],
                inspectionData.clientInfo['doc_clause_signeUrl'] || null
            );
            html += BOILERPLATE.pageDocumentLegal(
                "Contrat d'inspection", LEGAL_DOCS.contratInspection, legalInfos,
                [{ role: 'Inspecteur', nom: safeInspectorName }, { role: 'Client', nom: clientName }],
                inspectionData.clientInfo['doc_contrat_signeUrl'] || null
            );
            html += BOILERPLATE.pageDocumentLegal(
                'Contrat client', LEGAL_DOCS.contratClient, legalInfos,
                [{ role: 'Client', nom: clientName }],
                inspectionData.clientInfo['doc_contrat_client_signeUrl'] || null
            );
            html += BOILERPLATE.pageDocumentLegal(
                "Déclaration de conflit d'intérêt", LEGAL_DOCS.declarationConflitInteret, legalInfos,
                [{ role: 'Inspecteur', nom: safeInspectorName }],
                inspectionData.clientInfo['doc_conflit_signeUrl'] || null
            );
            html += BOILERPLATE.pageDocumentLegal(
                'Formulaire de limitations', LEGAL_DOCS.formulaireLimitations, legalInfos,
                [{ role: 'Inspecteur', nom: safeInspectorName }, { role: 'Client', nom: clientName }],
                inspectionData.clientInfo['doc_limitations_signeUrl'] || null
            );
        }

        // FACTURE
        html += BOILERPLATE.facture(clientName, address, sanitizeHTML(String(prix)), safeDossierId);

        // COMMENT LIRE CE RAPPORT
        if (BOILERPLATE.commentLire) html += BOILERPLATE.commentLire;

        // LOCALISATION
        if (BOILERPLATE.localisation) html += BOILERPLATE.localisation(address);

        // CONVENTIONS
        html += BOILERPLATE.conventions;

        // SOMMAIRE EXÉCUTIF
```

- [ ] **Étape 8 — Supprimer le doublon lettre de remerciement en fin de rapport**

Localiser vers la ligne 2404 :
```js
        // LETTRE DE REMERCIEMENT
        if (BOILERPLATE.lettreRemerciement) {
            html += BOILERPLATE.lettreRemerciement(
```
Supprimer ce bloc entier (la lettre est maintenant en page 2, pas en fin de rapport).

- [ ] **Étape 9 — Vérifier visuellement**

Lire les lignes 2200-2430 de `app.js` et confirmer l'ordre :
1. Lettre de remerciement / lettreIntro
2. tableDesMatières
3. ficheDescriptionMaison
4. pageDocumentsRecus
5. 5× pageDocumentLegal
6. facture
7. commentLire
8. localisation
9. conventions
10. Sommaire exécutif
11. Sections en flux continu (sans `class="page-break"`)
12. attestation
13. guideEntretien
14. normesPratique

- [ ] **Étape 10 — Commit 4B**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: réorganisation rapport 40p + flux continu sections (suppression page-break)"
```

---

## Task 5 : KZO_Inspect.html + bump versions

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/sw.js`

- [ ] **Étape 1 — Ajouter legal_docs.js dans KZO_Inspect.html**

Lire `KZO_Inspect.html`. Localiser la ligne avec `<script src="config.js">` :
```html
<script src="config.js"></script>
<script src="data.js?v=6"></script>
```
Ajouter `legal_docs.js` APRÈS `config.js` et AVANT `data.js` :
```html
<script src="config.js"></script>
<script src="legal_docs.js"></script>
<script src="data.js?v=6"></script>
```

- [ ] **Étape 2 — Bumper les versions des fichiers modifiés**

Dans `KZO_Inspect.html`, incrémenter de +1 :
- `boilerplate.js?v=N` → `v=N+1`
- `app.js?v=N` → `v=N+1`
- `data.js?v=N` → `v=N+1`

- [ ] **Étape 3 — Bumper CACHE_NAME dans sw.js**

Dans `sw.js` ligne 1 :
```js
const CACHE_NAME = 'kzo-inspect-v16';
```
Remplacer par :
```js
const CACHE_NAME = 'kzo-inspect-v17';
```

Ajouter `legal_docs.js` dans la liste `ASSETS` de `sw.js` :
```js
const ASSETS = [
  '/',
  'index.html',
  'KZO_Inspect.html',
  'style.css',
  'app.js',
  'data.js',
  'ai_agents.js',
  'boilerplate.js',
  'legal_docs.js',     // ← AJOUTER
  'templates.js',
  'house_bg.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.json'
];
```

- [ ] **Étape 4 — Vérifier**

Lire les balises script dans `KZO_Inspect.html` et confirmer :
- `legal_docs.js` chargé entre `config.js` et `data.js`
- Versions de `boilerplate.js`, `app.js`, `data.js` incrémentées
- `sw.js` : `CACHE_NAME = 'kzo-inspect-v17'` et `legal_docs.js` dans `ASSETS`

- [ ] **Étape 5 — Commit final**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add KZO_Inspect.html sw.js
git commit -m "chore: ajout legal_docs.js dans HTML + bump cache PWA v16→v17"
```

- [ ] **Étape 6 — Push GitHub**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git push
```
