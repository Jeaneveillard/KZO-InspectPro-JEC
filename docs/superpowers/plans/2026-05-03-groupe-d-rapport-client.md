# Groupe D — Rapport Client + Prévisualisation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'auto-génération du code d'inspection, une section Prévisualisation inline avec filigrane, et un rapport client moderne séparé.

**Architecture:** `_buildReportHTML(unitId)` extrait la logique HTML de `generateFinalReport()` pour être réutilisé par la prévisualisation inline et le rapport final. `generateClientReport()` nouvelle fonction indépendante. `s_preview` nouvelle section `isPreviewPage:true` dans data.js.

**Tech Stack:** Vanilla JS, HTML5, CSS inline.

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `app.js` | Auto-code inspection + `_buildReportHTML()` + `_renderPreviewPage()` + rendu isPreviewPage + `generateClientReport()` + bouton rapport client |
| `data.js` | Section `s_preview` + renommage `s_rapport` en section 13 |
| `KZO_Inspect.html` | Bump versions |
| `sw.js` | Bump CACHE_NAME v21→v22 |

---

## Task 1 : Auto-génération du code d'inspection

**Fichier :** `app.js`

**Contexte :** `index.html` crée les nouveaux projets avec `?new=1` dans l'URL et un ID format `KZO-XXXXX`. `app.js` lit `window.currentProjectId` au chargement. Le champ `inspection_code` (Section 1) est un `type: "text"` saisi manuellement. On doit le pré-remplir automatiquement sur les nouvelles inspections.

- [ ] **Step 1 : Trouver le bloc d'initialisation dans `app.js`**

Chercher la ligne contenant :
```js
window.currentProjectId = _urlParams.get('project')
```
ou le bloc de lecture des URL params (autour de la ligne 200-210).

- [ ] **Step 2 : Ajouter l'auto-génération du code**

Après le bloc qui restaure les données sauvegardées (chercher `saveAppState` ou `migrateLegacy` ou le bloc `if (_urlParams.get('new'))`), ajouter :

```js
    // Auto-génération du code d'inspection sur nouvelle inspection
    if (_urlParams.get('new') === '1' && !getActiveFieldStates()['inspection_code']) {
        getActiveFieldStates()['inspection_code'] = window.currentProjectId || ('KZO-' + Date.now().toString().slice(-5));
        saveAppState();
    }
```

- [ ] **Step 3 : Vérifier**

Ouvrir `index.html` → cliquer "+ Nouvelle inspection" → dans Section 1, le champ "Numéro de code de l'inspection" doit être pré-rempli avec `KZO-XXXXX`.

- [ ] **Step 4 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/app.js
git commit -m "feat(groupe-d): auto-génération du code d'inspection KZO-XXXXX"
```

---

## Task 2 : Section `s_preview` dans `data.js` + renommage `s_rapport`

**Fichier :** `data.js` lignes 313-316

**Contexte :** `s_rapport` est actuellement "12. Rapport Final" à la ligne 315. On insère `s_preview` avant.

- [ ] **Step 1 : Insérer `s_preview` avant `s_rapport`**

Trouver :
```js
        { id: "s_rapport", title: "12. Rapport Final", key: "rapport", icon: "📄",
```

Remplacer par :
```js
        { id: "s_preview", title: "12. Prévisualisation du Rapport", key: "preview", icon: "👁️",
          isPreviewPage: true,
          subSections: []
        },
        { id: "s_rapport", title: "13. Rapport Final", key: "rapport", icon: "📄",
```

- [ ] **Step 2 : Vérifier**

Ouvrir `KZO_Inspect.html` → vérifier que la navigation affiche "12. Prévisualisation du Rapport" et "13. Rapport Final".

- [ ] **Step 3 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/data.js
git commit -m "feat(groupe-d): section prévisualisation (s_preview) avant rapport final"
```

---

## Task 3 : Extraire `_buildReportHTML(unitId)` de `generateFinalReport()`

**Fichier :** `app.js` lignes ~2446-2855

**Contexte :** `generateFinalReport()` (ligne 2446) fait :
1. Validation (lignes ~2447-2458)
2. Setup variables (lignes ~2460-2515)  
3. Construction HTML `let html = ...` (lignes ~2518-2849)
4. Injection dans modal + ouverture (lignes ~2850-2855)

On extrait les étapes 2+3 dans `_buildReportHTML(unitId)` qui retourne le string HTML.

- [ ] **Step 1 : Lire `app.js` lignes 2445-2460 et 2845-2860 pour confirmer les bornes exactes**

Expected : voir `function generateFinalReport(unitId) {`, la validation clientName/address, et plus loin `reportContent.innerHTML = html; reportModal.style.display = 'flex';`

- [ ] **Step 2 : Créer `_buildReportHTML(unitId)` juste avant `generateFinalReport()`**

Insérer avant `function generateFinalReport(unitId) {` :
```js
    function _buildReportHTML(unitId) {
        const targetUnit = unitId
            ? inspectionData.units.find(u => u.id === unitId)
            : getCurrentUnit();
        if (!targetUnit) return '<p>Unité introuvable.</p>';
```

- [ ] **Step 3 : Déplacer le corps de `generateFinalReport()` dans `_buildReportHTML()`**

Dans `generateFinalReport()`, couper tout le bloc depuis :
```js
        // Déterminer quelle unité utiliser
        const targetUnit = unitId
```
jusqu'à (mais sans inclure) :
```js
        reportContent.innerHTML = html;
```

Et coller ce bloc dans `_buildReportHTML()`, en remplaçant le stub `const targetUnit = ...` déjà mis. Fermer `_buildReportHTML()` avec `return html; }` avant les lignes `reportContent.innerHTML`.

- [ ] **Step 4 : Modifier `generateFinalReport()` pour appeler `_buildReportHTML()`**

`generateFinalReport()` doit devenir :
```js
    function generateFinalReport(unitId) {
        if (typeof BOILERPLATE === 'undefined') {
            showToast("Impossible de charger le contenu légal (boilerplate.js manquant).", 'error');
            return;
        }
        const clientName = sanitizeHTML(inspectionData.clientInfo.name) || '';
        const address = sanitizeHTML(inspectionData.clientInfo.address) || '';
        if (!clientName || !address) {
            showToast('Veuillez remplir le nom du client et l\'adresse du bâtiment avant de générer le rapport (Section 1).', 'warning');
            return;
        }
        const html = _buildReportHTML(unitId);
        const reportModal = document.getElementById('reportModal');
        const reportContent = document.getElementById('reportContent');
        reportContent.innerHTML = html;
        reportModal.style.display = 'flex';
        // ... (garder le reste : closeReportBtn, printBtn, saveToIDB, etc.)
    }
```

- [ ] **Step 5 : Vérifier que le rapport existant fonctionne toujours**

Ouvrir `KZO_Inspect.html` → remplir nom client + adresse → Section 13 (Rapport Final) → cliquer "Visualiser le Rapport Final" → vérifier que le modal s'ouvre avec le rapport complet.

- [ ] **Step 6 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/app.js
git commit -m "refactor(groupe-d): extraire _buildReportHTML() de generateFinalReport()"
```

---

## Task 4 : `_renderPreviewPage()` + rendu `isPreviewPage` dans `renderSection()`

**Fichier :** `app.js`

**Contexte :**
- `renderSection()` a un bloc `if (section.isCoverPage)` à la ligne ~770. Ajouter `if (section.isPreviewPage)` juste après.
- Les exclusions de sections dans `_buildNumberedDefects`, les compteurs de défauts, et la boucle principale du rapport excluent `s_cover`, `s_admin`, `s_rapport`. Ajouter `s_preview` à ces exclusions.

- [ ] **Step 1 : Ajouter le rendu `isPreviewPage` dans `renderSection()`**

Trouver :
```js
        // --- Special Cover Page Rendering ---
        if (section.isCoverPage) {
```

Ajouter APRÈS le bloc `if (section.isCoverPage) { ... return; }` :
```js
        // --- Preview Page Rendering ---
        if (section.isPreviewPage) {
            _renderPreviewPage(dynamicContent);
            prevBtn.disabled = currentSectionIndex === 0;
            nextBtn.disabled = false;
            nextBtn.textContent = 'Rapport Final →';
            return;
        }
```

- [ ] **Step 2 : Ajouter `_renderPreviewPage()` dans le scope DOMContentLoaded**

Insérer avant `openAnnotationEditor()` (fin du fichier) :
```js
    function _renderPreviewPage(container) {
        // Filigrane diagonal fixe
        const watermark = document.createElement('div');
        watermark.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:5rem;font-weight:900;color:rgba(251,191,36,0.07);pointer-events:none;z-index:0;white-space:nowrap;user-select:none;';
        watermark.textContent = 'PRÉVISUALISATION';
        container.appendChild(watermark);

        // Bannière jaune
        const banner = document.createElement('div');
        banner.style.cssText = 'background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;flex-wrap:wrap;gap:8px;';
        banner.innerHTML = '<span style="color:#92400e;font-weight:700;font-size:0.88rem;">👁️ PRÉVISUALISATION — Non finalisé · Relisez avant de générer</span>';
        const launchBtn = document.createElement('button');
        launchBtn.type = 'button';
        launchBtn.textContent = '✅ Lancer le rapport final';
        launchBtn.style.cssText = 'background:#22c55e;color:white;border:none;border-radius:6px;padding:8px 16px;font-size:0.88rem;cursor:pointer;font-weight:600;';
        launchBtn.onclick = () => {
            if (isMultiUnitBuilding() && inspectionData.units.length > 1) showUnitReportSelector();
            else generateFinalReport();
        };
        banner.appendChild(launchBtn);
        container.appendChild(banner);

        // Contenu du rapport inline
        const clientName = sanitizeHTML(inspectionData.clientInfo.name) || '';
        const address = sanitizeHTML(inspectionData.clientInfo.address) || '';
        if (!clientName || !address) {
            const warn = document.createElement('div');
            warn.style.cssText = 'background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;color:#dc2626;font-size:0.9rem;';
            warn.textContent = '⚠️ Remplissez le nom du client et l\'adresse (Section 1) pour voir la prévisualisation.';
            container.appendChild(warn);
            return;
        }
        if (typeof BOILERPLATE === 'undefined') {
            const warn = document.createElement('div');
            warn.style.cssText = 'background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;color:#dc2626;';
            warn.textContent = '⚠️ boilerplate.js manquant — prévisualisation indisponible.';
            container.appendChild(warn);
            return;
        }
        const previewDiv = document.createElement('div');
        previewDiv.style.cssText = 'position:relative;z-index:1;';
        previewDiv.innerHTML = _buildReportHTML();
        container.appendChild(previewDiv);
    }
```

- [ ] **Step 3 : Ajouter `s_preview` aux exclusions dans les boucles de sections**

Chercher toutes les occurrences de :
```js
if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport') return;
```

Il y en a 4 dans `app.js` (lignes ~1782, ~2374, ~2502, ~2682). Remplacer chacune par :
```js
if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport' || section.id === 's_preview') return;
```

- [ ] **Step 4 : Vérifier la prévisualisation**

Ouvrir `KZO_Inspect.html` → remplir Section 1 (nom + adresse) → aller en Section 12 (Prévisualisation) → vérifier :
- Filigrane "PRÉVISUALISATION" diagonal visible
- Bannière jaune avec bouton "Lancer le rapport final"
- Rapport complet affiché en dessous
- Bouton "Lancer le rapport final" ouvre le modal d'impression

- [ ] **Step 5 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/app.js
git commit -m "feat(groupe-d): prévisualisation inline avec filigrane et bouton lancement"
```

---

## Task 5 : `generateClientReport()` + bouton dans section Rapport Final

**Fichier :** `app.js`

**Contexte :**
- `_buildNumberedDefects(unitFieldStates, sections)` est à la ligne ~2371
- `_buildLifespanItems()` est à la ligne ~2400
- `AIAgents.getSpecialist(label)` est dans `ai_agents.js`
- Le bouton "Visualiser le Rapport Final" est dans `field.type === 'action'` avec `field.id === 'rap_generate'` (ligne ~1311)

- [ ] **Step 1 : Ajouter le bouton "Rapport Client" dans le rendu `rap_generate`**

Trouver :
```js
                    btn.addEventListener('click', () => {
                        if (field.id === 'rap_generate') {
                            if (isMultiUnitBuilding() && inspectionData.units.length > 1) showUnitReportSelector();
                            else generateFinalReport();
                        }
                    });
                    fieldGroup.appendChild(btn);
```

Remplacer par :
```js
                    btn.addEventListener('click', () => {
                        if (field.id === 'rap_generate') {
                            if (isMultiUnitBuilding() && inspectionData.units.length > 1) showUnitReportSelector();
                            else generateFinalReport();
                        }
                    });
                    fieldGroup.appendChild(btn);

                    if (field.id === 'rap_generate') {
                        const clientBtn = document.createElement('button');
                        clientBtn.type = 'button';
                        clientBtn.className = 'btn secondary';
                        clientBtn.style.cssText = 'width:100%;padding:14px;font-size:1rem;margin-top:8px;';
                        clientBtn.textContent = '📋 Rapport Client';
                        clientBtn.addEventListener('click', () => generateClientReport());
                        fieldGroup.appendChild(clientBtn);
                    }
```

- [ ] **Step 2 : Ajouter `generateClientReport()` dans le scope DOMContentLoaded**

Insérer avant `_renderPreviewPage()` :
```js
    function generateClientReport() {
        const clientName = sanitizeHTML(inspectionData.clientInfo.name) || '';
        const address = sanitizeHTML(inspectionData.clientInfo.address) || '';
        if (!clientName || !address) {
            showToast('Veuillez remplir le nom du client et l\'adresse (Section 1).', 'warning');
            return;
        }

        const targetUnit = getCurrentUnit();
        const unitFieldStates = targetUnit.fieldStates || {};
        const unitSectionPhotos = targetUnit.sectionPhotos || {};
        const inspectorName = sanitizeHTML(inspectionData.clientInfo.inspectorName || '');
        const dateInspection = inspectionData['inspection_date']
            ? new Date(inspectionData['inspection_date']).toLocaleDateString('fr-CA', {year:'numeric', month:'long', day:'numeric'})
            : new Date().toLocaleDateString('fr-CA', {year:'numeric', month:'long', day:'numeric'});
        const codeInspection = sanitizeHTML(unitFieldStates['inspection_code'] || inspectionData.id || '');

        // Compteurs
        let urgents = 0, majeurs = 0, surveiller = 0, conformes = 0;
        inspectionData.sections.forEach(section => {
            if (['s_cover','s_admin','s_rapport','s_preview'].includes(section.id)) return;
            (section.subSections || []).forEach(sub => {
                (sub.fields || []).forEach(field => {
                    if (field.type !== 'checkbox') return;
                    const state = unitFieldStates[field.id];
                    if (state === 'defaut') {
                        const sev = AIAgents.determineSeverity(field.label);
                        if (sev === 'URGENT') urgents++; else majeurs++;
                    } else if (state === 'surveiller') surveiller++;
                    else if (state === 'conforme') conformes++;
                });
            });
        });

        // Durée de vie
        const lifespanItems = _buildLifespanItems();

        // Sections
        let sectionsHtml = '';
        inspectionData.sections.forEach(section => {
            if (['s_cover','s_admin','s_rapport','s_preview'].includes(section.id)) return;
            const allFields = (section.subSections || []).flatMap(ss => ss.fields || []);
            const defautFields = allFields.filter(f => f.type === 'checkbox' && (unitFieldStates[f.id] === 'defaut' || unitFieldStates[f.id] === 'surveiller'));
            const hasDefaut = defautFields.length > 0;
            const maxSev = defautFields.some(f => AIAgents.determineSeverity(f.label) === 'URGENT') ? 'URGENT'
                : defautFields.some(f => unitFieldStates[f.id] === 'defaut') ? 'MAJEUR'
                : defautFields.length > 0 ? 'SURVEILLER' : 'CONFORME';
            const borderColor = maxSev === 'URGENT' ? '#dc2626' : maxSev === 'MAJEUR' ? '#ea580c' : maxSev === 'SURVEILLER' ? '#ca8a04' : '#22c55e';
            const icon = maxSev === 'CONFORME' ? '✅' : maxSev === 'URGENT' ? '🚨' : '⚠️';

            // Photos de la section
            let photosHtml = '';
            (section.subSections || []).forEach(sub => {
                const photos = (unitSectionPhotos[sub.id] || []).filter(p => p.url);
                if (photos.length) {
                    photosHtml += photos.map(p => `<figure style="display:inline-block;margin:4px;vertical-align:top;"><img src="${p.url}" style="width:150px;height:112px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;display:block;">${p.caption ? `<figcaption style="font-size:0.7rem;color:#64748b;text-align:center;margin-top:3px;max-width:150px;">${sanitizeHTML(p.caption)}</figcaption>` : ''}</figure>`).join('');
                }
            });

            const defautsHtml = defautFields.map(f => {
                const specialist = AIAgents.getSpecialist(f.label);
                return `<div style="margin-bottom:6px;padding-left:8px;">• ${sanitizeHTML(f.label)} — <em>Consulter un ${sanitizeHTML(specialist)}</em></div>`;
            }).join('');

            sectionsHtml += `
            <div style="background:white;border-left:4px solid ${borderColor};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                <div style="font-weight:700;color:${borderColor};margin-bottom:${hasDefaut ? '8px' : '0'};font-size:0.9rem;">${icon} ${sanitizeHTML(section.title)}</div>
                ${hasDefaut ? `<div style="font-size:0.85rem;color:#374151;line-height:1.7;">${defautsHtml}</div>` : ''}
                ${photosHtml ? `<div style="margin-top:10px;">${photosHtml}</div>` : ''}
            </div>`;
        });

        // Durée de vie HTML
        const lifespanHtml = lifespanItems.length ? `
        <div style="background:white;border-radius:8px;padding:16px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-weight:700;color:#475569;margin-bottom:10px;font-size:0.9rem;">🔧 Durée de vie estimée des équipements</div>
            ${lifespanItems.map(item => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:0.85rem;">
                <span style="color:#374151;">${sanitizeHTML(item.label)}</span>
                <span style="background:${item.badgeColor || '#475569'};color:white;padding:2px 10px;border-radius:10px;font-size:0.75rem;">${sanitizeHTML(item.badge)}</span>
            </div>`).join('')}
        </div>` : '';

        const html = `
        <div style="font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#f8fafc;">
            <div class="page-break" style="background:linear-gradient(135deg,#1e293b,#334155);color:white;border-radius:10px;padding:32px;text-align:center;margin-bottom:24px;">
                <div style="font-size:1.6rem;font-weight:900;letter-spacing:2px;margin-bottom:6px;">RAPPORT D'INSPECTION</div>
                <div style="font-size:1rem;color:#94a3b8;margin-bottom:4px;">${sanitizeHTML(address)}</div>
                <div style="font-size:0.85rem;color:#64748b;">${dateInspection} · ${codeInspection} · ${inspectorName}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
                <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;text-align:center;">
                    <div style="font-size:2rem;font-weight:900;color:#dc2626;">${urgents}</div>
                    <div style="font-size:0.8rem;color:#dc2626;font-weight:600;">URGENT</div>
                </div>
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;text-align:center;">
                    <div style="font-size:2rem;font-weight:900;color:#ea580c;">${majeurs}</div>
                    <div style="font-size:0.8rem;color:#ea580c;font-weight:600;">MAJEUR</div>
                </div>
                <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;">
                    <div style="font-size:2rem;font-weight:900;color:#ca8a04;">${surveiller}</div>
                    <div style="font-size:0.8rem;color:#ca8a04;font-weight:600;">À SURVEILLER</div>
                </div>
                <div style="background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:16px;text-align:center;">
                    <div style="font-size:2rem;font-weight:900;color:#16a34a;">${conformes}</div>
                    <div style="font-size:0.8rem;color:#16a34a;font-weight:600;">CONFORMES</div>
                </div>
            </div>
            ${lifespanHtml}
            ${sectionsHtml}
            <div style="text-align:center;padding:20px;color:#94a3b8;font-size:0.8rem;border-top:1px solid #e2e8f0;margin-top:16px;">
                ${inspectorName} · KZO InspectPro · ${dateInspection}
            </div>
        </div>`;

        const reportModal = document.getElementById('reportModal');
        document.getElementById('reportContent').innerHTML = html;
        reportModal.style.display = 'flex';
        document.getElementById('closeReportBtn').onclick = () => { reportModal.style.display = 'none'; };
    }
```

- [ ] **Step 3 : Vérifier le rapport client**

Ouvrir `KZO_Inspect.html` → remplir quelques sections → Section 13 (Rapport Final) → cliquer "📋 Rapport Client" → vérifier :
- Header gradient sombre avec adresse/date/code
- Grille 2×2 des compteurs
- Cartes par section (verte si conforme, colorée si défauts)
- Photos visibles si présentes

- [ ] **Step 4 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/app.js
git commit -m "feat(groupe-d): rapport client moderne avec compteurs et cartes par section"
```

---

## Task 6 : Bump versions

- [ ] **Step 1 : Bump `sw.js`**

Trouver `const CACHE_NAME = 'kzo-inspect-v21';` → remplacer par `'kzo-inspect-v22'`

- [ ] **Step 2 : Bump `KZO_Inspect.html`**

Trouver `<script src="app.js?v=20">` → `app.js?v=21`
Trouver `<script src="data.js?v=8">` → `data.js?v=9`

- [ ] **Step 3 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/sw.js C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html
git commit -m "chore: bump cache v22, app.js v21, data.js v9 pour groupe-d"
```

---

## Récapitulatif des commits

1. `feat(groupe-d): auto-génération du code d'inspection KZO-XXXXX`
2. `feat(groupe-d): section prévisualisation (s_preview) avant rapport final`
3. `refactor(groupe-d): extraire _buildReportHTML() de generateFinalReport()`
4. `feat(groupe-d): prévisualisation inline avec filigrane et bouton lancement`
5. `feat(groupe-d): rapport client moderne avec compteurs et cartes par section`
6. `chore: bump cache v22, app.js v21, data.js v9 pour groupe-d`
