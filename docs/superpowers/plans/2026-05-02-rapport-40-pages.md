# Rapport 40+ Pages — Plan d'implémentation (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le rapport PDF en 40+ pages : table des matières auto-générée, description narrative de la maison, formulaires légaux uploadés par l'inspecteur (toujours ou conditionnels selon case à cocher), sections d'inspection en flux continu sans sauts de page forcés.

**Architecture:** `boilerplate.js` reçoit 3 nouvelles fonctions. `data.js` reçoit les champs upload + checkbox dans `s_admin`. `app.js` gère les handlers upload (base64 → `inspectionData.clientInfo`) et réorganise `generateReport()`. Pas de nouveau fichier JS.

**Tech Stack:** JavaScript vanilla, HTML/CSS inline, `window.print()` PDF, base64 via `compressImage()` existant.

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `data.js` | +11 champs dans `ss_admin_2` (uploads + checkboxes) |
| `boilerplate.js` | +3 fonctions : `tableDesMatières`, `ficheDescriptionMaison`, `pageDocumentUpload` |
| `app.js` | Handlers upload nouveaux champs + réorganisation `generateReport()` + suppression `class="page-break"` sections |
| `KZO_Inspect.html` | Bump `?v=N` sur `boilerplate.js`, `app.js`, `data.js` |
| `sw.js` | Bump `CACHE_NAME` v16 → v17 |

---

## Task 1 : Nouveaux champs dans `data.js`

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/data.js`

- [ ] **Étape 1 — Lire data.js et localiser ss_admin_2**

Lire `data.js`. Trouver :
```js
{ id: "ss_admin_2", title: "Pièces jointes & Synchronisation", fields: [
    { id: "client_docs", type: "file", label: "Déclaration du vendeur / Documents remis" },
    { id: "sync_status", type: "action", label: "🔄 Forcer la sauvegarde locale" }
]}
```

- [ ] **Étape 2 — Remplacer ss_admin_2 par la version enrichie**

Remplacer le bloc `ss_admin_2` entier par :
```js
{ id: "ss_admin_2", title: "Pièces jointes & Synchronisation", fields: [
    { id: "description_narrative", type: "text",
      label: "Description narrative de la propriété avant inspection",
      placeholder: "État général apparent, conditions d'accès, limitations observées avant l'inspection..." },
    { id: "doc_lettre_remerciement", type: "file",
      label: "📄 Lettre de remerciement — votre formulaire (photo/scan)" },
    { id: "client_docs", type: "file",
      label: "📎 Documents reçus (déclaration vendeur, plans, etc.)" },
    { id: "doc_clause_contrat", type: "file",
      label: "📄 Clause du contrat — votre formulaire (photo/scan)" },
    { id: "doc_contrat_inspection", type: "file",
      label: "📄 Contrat d'inspection — votre formulaire (photo/scan)" },
    { id: "include_contrat_client", type: "checkbox",
      label: "Inclure le contrat client dans le rapport" },
    { id: "doc_contrat_client", type: "file",
      label: "📄 Contrat client — votre formulaire (photo/scan)" },
    { id: "include_conflit_interet", type: "checkbox",
      label: "Inclure la déclaration de conflit d'intérêt" },
    { id: "doc_conflit_interet", type: "file",
      label: "📄 Déclaration conflit d'intérêt — votre formulaire (photo/scan)" },
    { id: "include_limitations", type: "checkbox",
      label: "Inclure le formulaire de limitations" },
    { id: "doc_limitations", type: "file",
      label: "📄 Formulaire de limitations — votre formulaire (photo/scan)" },
    { id: "sync_status", type: "action", label: "🔄 Forcer la sauvegarde locale" }
]}
```

- [ ] **Étape 3 — Vérifier**

Lire le bloc `ss_admin_2` modifié et confirmer que les 11 nouveaux champs + `sync_status` sont présents.

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add data.js
git commit -m "feat: +11 champs s_admin (uploads formulaires + checkboxes conditionnels)"
```

---

## Task 2 : 3 nouvelles fonctions dans `boilerplate.js`

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/boilerplate.js`

- [ ] **Étape 1 — Lire la fin de boilerplate.js**

Lire les 10 dernières lignes de `boilerplate.js`. Identifier la fermeture :
```js
    }
};
```

- [ ] **Étape 2 — Ajouter les 3 fonctions avant `};`**

Remplacer la fermeture `};` par :

```js
    },

    // Table des matières auto-générée
    tableDesMatières: function(sections) {
        const items = [
            { label: 'Lettre de remerciement', indent: false },
            { label: 'Table des matières', indent: false },
            { label: 'Description de la propriété', indent: false },
            { label: 'Documents reçus', indent: false },
            { label: 'Clause du contrat', indent: false },
            { label: "Contrat d'inspection", indent: false },
            { label: 'Contrat client', indent: false },
            { label: "Déclaration de conflit d'intérêt", indent: false },
            { label: 'Formulaire de limitations', indent: false },
            { label: "Rapport d'inspection", indent: false }
        ];
        sections.forEach(s => {
            if (s.id === 's_cover' || s.id === 's_admin') return;
            items.push({ label: s.title, indent: true });
        });
        items.push({ label: "Guide d'entretien", indent: false });
        items.push({ label: 'Annexe — Normes de pratique', indent: false });

        const rows = items.map(item =>
            `<tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:${item.indent ? '8px 16px 8px 32px' : '12px 16px'}; color:${item.indent ? '#475569' : '#0f172a'}; font-size:${item.indent ? '0.9rem' : '1rem'}; font-weight:${item.indent ? '400' : '600'};">
                    ${item.indent ? '↳ ' : ''}${item.label}
                </td>
            </tr>`
        ).join('');

        return `<div class="page-break" style="padding:50px 60px;">
            <h2 style="color:#1A56DB; border-bottom:3px solid #1A56DB; padding-bottom:12px; margin-bottom:30px; font-size:1.8rem;">Table des matières</h2>
            <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                ${rows}
            </table>
        </div>`;
    },

    // Fiche description de la propriété + paragraphe narratif
    ficheDescriptionMaison: function(infos) {
        const { typeBatiment, typeGarage, superficie, annee, meteo, temperature, norme, dateInspection, narratif } = infos;
        const narratifHtml = narratif
            ? `<div style="margin-top:28px; padding:24px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                <h3 style="color:#1e40af; margin-bottom:14px; font-size:1.1rem;">📝 Description narrative</h3>
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

    // Page générique pour afficher un formulaire uploadé (image pleine page)
    pageDocumentUpload: function(titre, imageUrl) {
        const contenu = imageUrl
            ? `<img src="${imageUrl}" style="width:100%; max-height:88vh; object-fit:contain; border:1px solid #e2e8f0; border-radius:4px;">`
            : `<div style="margin-top:24px; padding:40px; background:#f8fafc; border:2px dashed #cbd5e1; border-radius:10px; text-align:center; color:#94a3b8; font-size:0.95rem;">
                Document non uploadé — à ajouter dans l'application avant impression
               </div>`;
        return `<div class="page-break" style="padding:30px 60px;">
            <h2 style="color:#1A56DB; border-bottom:2px solid #1A56DB; padding-bottom:10px; margin-bottom:24px; font-size:1.4rem;">${titre}</h2>
            ${contenu}
        </div>`;
    }

};
```

- [ ] **Étape 3 — Vérifier la syntaxe**

Lire les 20 dernières lignes de `boilerplate.js`. Confirmer :
- `tableDesMatières`, `ficheDescriptionMaison`, `pageDocumentUpload` présents
- Fichier se termine par `};`

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add boilerplate.js
git commit -m "feat: +3 fonctions boilerplate (tableDesMatières, ficheDescriptionMaison, pageDocumentUpload)"
```

---

## Task 3 : Handlers upload dans `app.js`

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

Les nouveaux champs `file` dans `s_admin` doivent sauvegarder leur base64 dans `inspectionData.clientInfo[fieldId + 'Url']`, exactement comme `signatureUrl` et `sealUrl`.

- [ ] **Étape 1 — Trouver le pattern existant pour les uploads de s_admin**

```bash
grep -n "inspector_signature\|inspector_seal\|signatureUrl\|sealUrl\|compressImage\|clientInfo\[" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -20
```

Lire les lignes autour des résultats pour comprendre exactement comment les champs `file` de `s_admin` sont gérés.

- [ ] **Étape 2 — Identifier le bloc de rendu des champs file dans s_admin**

Chercher dans `app.js` le gestionnaire qui traite `field.type === 'file'` pour les champs de `s_admin`. Ce bloc rend le bouton upload et déclenche `compressImage()`.

```bash
grep -n "type.*file\|field\.type.*file\|inspector_signature\|fileInput\|compressImage" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -30
```

- [ ] **Étape 3 — Ajouter la liste des nouveaux champs à sauvegarder dans clientInfo**

Dans la logique de rendu/sauvegarde des champs file (probablement une condition `if (field.id === 'inspector_signature')` ou similaire), étendre le traitement pour inclure les nouveaux champs. Chercher où `inspectionData.clientInfo.signatureUrl` est assigné et dupliquer ce pattern pour :

```js
const CLIENT_INFO_FILE_FIELDS = [
    'inspector_signature', 'inspector_seal',
    'doc_lettre_remerciement', 'client_docs',
    'doc_clause_contrat', 'doc_contrat_inspection',
    'doc_contrat_client', 'doc_conflit_interet', 'doc_limitations'
];

// Dans le handler de l'input file :
if (CLIENT_INFO_FILE_FIELDS.includes(field.id)) {
    compressImage(file).then(base64 => {
        inspectionData.clientInfo[field.id + 'Url'] = base64;
        saveAppState();
        showToast('Document chargé.', 'success');
    });
}
```

**Note :** Adapter ce pattern au code existant plutôt que le copier tel quel — l'objectif est que `compressImage(file)` → base64 → `inspectionData.clientInfo[field.id + 'Url']` → `saveAppState()` pour chaque nouveau champ file.

- [ ] **Étape 4 — Commit handlers**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: handlers upload formulaires légaux → inspectionData.clientInfo"
```

---

## Task 4 : Réorganisation `generateReport()` + flux continu sections

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Étape 1 — Lire generateReport() en entier**

Lire `app.js` de la ligne 2095 à 2425 pour mémoriser l'ordre actuel exact des pages.

- [ ] **Étape 2 — Supprimer `class="page-break"` des divs de section**

Dans la boucle sections (chercher `html += \`<div class="page-break" style="padding-top: 50px;">`), remplacer par :
```js
html += `<div style="padding-top: 40px; margin-top: 30px; border-top: 2px solid #e2e8f0;">
```

- [ ] **Étape 3 — Ajouter les nouvelles pages AVANT la facture**

Après la page de couverture (ligne ~2199) et AVANT `html += BOILERPLATE.facture(...)`, insérer le bloc suivant :

```js
        // PAGE 2 — LETTRE DE REMERCIEMENT
        const lettreUrl = inspectionData.clientInfo['doc_lettre_remerciementUrl'] || null;
        if (lettreUrl || BOILERPLATE.lettreRemerciement) {
            if (lettreUrl) {
                html += BOILERPLATE.pageDocumentUpload('Lettre de remerciement', lettreUrl);
            } else if (BOILERPLATE.lettreRemerciement) {
                html += BOILERPLATE.lettreRemerciement(
                    clientName, address, safeInspectorName,
                    sanitizeHTML(window.AppCompanyProfile ? window.AppCompanyProfile.name : 'KZO InspectPro'),
                    signatureUrl
                );
            }
        }

        // PAGE 3 — TABLE DES MATIÈRES
        html += BOILERPLATE.tableDesMatières(inspectionData.sections);

        // PAGE 4 — DESCRIPTION DE LA PROPRIÉTÉ
        const narratifRaw = document.getElementById('description_narrative')?.value || '';
        html += BOILERPLATE.ficheDescriptionMaison({
            typeBatiment, typeGarage, superficie, annee, meteo, temperature,
            norme: safeNorme,
            dateInspection,
            narratif: sanitizeHTML(narratifRaw)
        });

        // PAGE 5 — DOCUMENTS REÇUS
        const docsUrl = inspectionData.clientInfo['client_docsUrl'] || null;
        if (docsUrl) html += BOILERPLATE.pageDocumentUpload('Documents reçus', docsUrl);

        // PAGE 6 — CLAUSE DU CONTRAT (toujours)
        html += BOILERPLATE.pageDocumentUpload('Clause du contrat',
            inspectionData.clientInfo['doc_clause_contratUrl'] || null);

        // PAGE 7 — CONTRAT D'INSPECTION (toujours)
        html += BOILERPLATE.pageDocumentUpload("Contrat d'inspection",
            inspectionData.clientInfo['doc_contrat_inspectionUrl'] || null);

        // PAGE 8 — CONTRAT CLIENT (conditionnel)
        if (unitFieldStates['include_contrat_client'] === 'conforme') {
            html += BOILERPLATE.pageDocumentUpload('Contrat client',
                inspectionData.clientInfo['doc_contrat_clientUrl'] || null);
        }

        // PAGE 9 — DÉCLARATION CONFLIT D'INTÉRÊT (conditionnel)
        if (unitFieldStates['include_conflit_interet'] === 'conforme') {
            html += BOILERPLATE.pageDocumentUpload("Déclaration de conflit d'intérêt",
                inspectionData.clientInfo['doc_conflit_interetUrl'] || null);
        }

        // PAGE 10 — FORMULAIRE DE LIMITATIONS (conditionnel)
        if (unitFieldStates['include_limitations'] === 'conforme') {
            html += BOILERPLATE.pageDocumentUpload('Formulaire de limitations',
                inspectionData.clientInfo['doc_limitationsUrl'] || null);
        }
```

- [ ] **Étape 4 — Supprimer le doublon lettre de remerciement en fin de rapport**

Chercher vers la ligne 2404 :
```js
        // LETTRE DE REMERCIEMENT
        if (BOILERPLATE.lettreRemerciement) {
```
Supprimer ce bloc — la lettre est maintenant gérée en page 2.

- [ ] **Étape 5 — Vérifier l'ordre final**

Lire les lignes 2200–2430 et confirmer l'ordre :
1. Lettre remerciement (upload ou existante)
2. tableDesMatières
3. ficheDescriptionMaison
4. Documents reçus (si uploadés)
5. Clause contrat (toujours)
6. Contrat inspection (toujours)
7. Contrat client (si coché)
8. Conflit intérêt (si coché)
9. Limitations (si coché)
10. BOILERPLATE.facture (existant)
11. commentLire (existant)
12. localisation (existant)
13. conventions (existant)
14. Sommaire exécutif (existant)
15. Sections flux continu (sans class="page-break")
16. attestation (existant)
17. guideEntretien (existant)
18. normesPratique (existant)

- [ ] **Étape 6 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: rapport 40p — nouvelles pages + flux continu sections + pages conditionnelles"
```

---

## Task 5 : Bump versions + push GitHub

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/sw.js`

- [ ] **Étape 1 — Bumper les versions dans KZO_Inspect.html**

Lire `KZO_Inspect.html`. Incrémenter de +1 :
- `boilerplate.js?v=N`
- `app.js?v=N`
- `data.js?v=N`

- [ ] **Étape 2 — Bumper CACHE_NAME dans sw.js**

```js
// Avant :
const CACHE_NAME = 'kzo-inspect-v16';
// Après :
const CACHE_NAME = 'kzo-inspect-v17';
```

- [ ] **Étape 3 — Vérifier**

Confirmer dans `KZO_Inspect.html` que les 3 balises script sont incrémentées.
Confirmer dans `sw.js` que `CACHE_NAME = 'kzo-inspect-v17'`.

- [ ] **Étape 4 — Commit et push**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add KZO_Inspect.html sw.js
git commit -m "chore: bump cache PWA v16→v17 + versions scripts rapport 40 pages"
git push
```
