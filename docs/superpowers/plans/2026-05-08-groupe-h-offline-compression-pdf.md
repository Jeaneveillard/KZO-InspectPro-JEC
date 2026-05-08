# Groupe H — Mode Hors-ligne, Compression Photos, Rapport PDF

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un bandeau hors-ligne, améliorer la compression photos avec avertissement stockage, et enrichir le rapport PDF avec une table des matières et un sommaire exécutif amélioré.

**Architecture:** Tout dans `app.js` (déjà ~3500 lignes, pattern établi). `initOfflineBanner()` ajouté à la fin de l'init DOMContentLoaded. Compression changée à 800px/0.65. `_buildReportHTML` étendu avec TOC + exec summary amélioré.

**Tech Stack:** Vanilla JS, Canvas API, HTML/CSS inline pour le rapport PDF.

---

## Contexte codebase

- `app.js:1` — DOMContentLoaded async handler, tout le code de l'app
- `app.js:159` — `compressImage(file, maxWidth=1200, quality=0.75)` — à modifier
- `app.js:1514-1524` — Boucle upload photo galerie → `store[sub.id].push({url, caption, originalUrl: null})`
- `app.js:1497` — `renderGallery()` + `galleryTitle` (h4 avec titre de la sous-section)
- `app.js:3203-3210` — Fin de l'init : `renderNavigation()`, `renderSection(0)`, `GoogleDrive.init()` → point d'injection de `initOfflineBanner()`
- `app.js:2590` — `_buildReportHTML(unitId)` — génère le HTML du rapport
- `app.js:2807-2810` — Fin du bloc cover page + début "CORPS DU RAPPORT" → insérer TOC ici
- `app.js:2815-2818` — `inspectionData.sections.forEach(section => { ... html += '<div class="page-break"...'` → ajouter `id="section-N"`
- `KZO_Inspect.html:75` — `<header class="top-bar">` → insérer `#offlineBanner` juste avant
- `sw.js:1` — `CACHE_NAME = 'kzo-inspect-v26'`
- `KZO_Inspect.html:282` — `<script src="app.js?v=25">`

---

## File Structure

| Fichier | Modifications |
|---------|--------------|
| `app.js` | `initOfflineBanner()`, `_estimatePhotosSize()`, compression 800/0.65, badge galerie, TOC, exec summary amélioré |
| `sw.js` | Cache v27 |
| `KZO_Inspect.html` | app.js?v=26 |

---

## Task 1: H1 — Bandeau hors-ligne

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Step 1: Ajouter la fonction `initOfflineBanner` dans app.js**

Dans `app.js`, trouver (ligne ~3203) :
```js
    renderNavigation();
    renderSection(0);
    renderUnitTabs(); // Afficher la barre d'unités si applicable

    // Init Google Drive module + afficher statut sync
    if (typeof GoogleDrive !== 'undefined') {
        GoogleDrive.init();
        GoogleDrive.updateSyncIndicator(window.currentProjectId);
    }
```

Juste AVANT cette ligne `renderNavigation()`, ajouter la fonction :

```js
    function initOfflineBanner() {
        const banner = document.createElement('div');
        banner.id = 'offlineBanner';
        banner.style.cssText = 'display:none;background:#dc2626;color:white;text-align:center;padding:8px 16px;font-size:0.85rem;font-weight:700;position:sticky;top:0;z-index:1000;';
        banner.textContent = '📵 Mode hors ligne — Données sauvegardées localement. Sync Drive dès reconnexion.';
        const topBar = document.querySelector('.top-bar');
        if (topBar) topBar.insertAdjacentElement('afterend', banner);

        function showBanner() {
            banner.style.display = 'block';
            if (typeof GoogleDrive !== 'undefined') {
                GoogleDrive.updateSyncIndicator(window.currentProjectId);
            }
        }

        function hideBanner() {
            banner.style.display = 'none';
            showToast('✅ Connexion rétablie — synchronisation en cours...', 'success');
            if (typeof GoogleDrive !== 'undefined') {
                GoogleDrive.updateSyncIndicator(window.currentProjectId);
            }
        }

        if (!navigator.onLine) showBanner();
        window.addEventListener('offline', showBanner);
        window.addEventListener('online', hideBanner);
    }
```

- [ ] **Step 2: Appeler `initOfflineBanner()` à la fin de l'init**

Trouver (ligne ~3203) :
```js
    renderNavigation();
    renderSection(0);
```

Juste AVANT ces lignes, ajouter :
```js
    initOfflineBanner();
```

- [ ] **Step 3: Vérifier dans le navigateur**

Ouvrir `http://localhost:8000`. Dans DevTools → onglet **Network** → mode **Offline**.
Expected : bandeau rouge "📵 Mode hors ligne" apparaît en haut. Repasser en ligne → bandeau disparaît + toast "✅ Connexion rétablie".

- [ ] **Step 4: Commit**

```bash
git add "C:/Users/jeane/Desktop/Amboul/JEC/app.js"
git commit -m "feat(groupe-h): bandeau hors-ligne persistant avec auto-dismiss"
```

---

## Task 2: H2 — Compression photos intelligente

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Step 1: Réduire la compression dans `compressImage`**

Trouver (ligne ~159) :
```js
    function compressImage(file, maxWidth = 1200, quality = 0.75) {
```

Remplacer par :
```js
    function compressImage(file, maxWidth = 800, quality = 0.65) {
```

- [ ] **Step 2: Ajouter la fonction `_estimatePhotosSize`**

Juste après la fonction `compressImage` (après sa fermeture `}`), ajouter :

```js
    function _estimatePhotosSize(unit) {
        let bytes = 0;
        Object.values(unit.sectionPhotos || {}).forEach(arr =>
            arr.forEach(p => { bytes += Math.round((p.url || '').length * 0.75); })
        );
        return bytes;
    }
```

- [ ] **Step 3: Ajouter l'avertissement stockage après chaque upload**

Dans `app.js`, trouver la ligne dans la boucle upload de la galerie (ligne ~1523) :
```js
                        store[sub.id].push({ url: dataUrl, caption: '', originalUrl: null });
                        saveAppState();
```

Remplacer par :
```js
                        store[sub.id].push({ url: dataUrl, caption: '', originalUrl: null });
                        saveAppState();
                        // Avertissement stockage
                        const _unit = getCurrentUnit();
                        const _sizeBytes = _estimatePhotosSize(_unit);
                        const _sizeMB = (_sizeBytes / 1048576).toFixed(1);
                        if (_sizeBytes > 6 * 1048576) {
                            showToast('❌ Stockage photos critique (~' + _sizeMB + ' Mo). Exportez le fichier .kzo maintenant.', 'error', 6000);
                        } else if (_sizeBytes > 3 * 1048576) {
                            showToast('⚠️ Stockage photos : ~' + _sizeMB + ' Mo. Sauvegardez régulièrement (.kzo).', 'warning', 5000);
                        }
```

- [ ] **Step 4: Ajouter le badge taille dans le titre de la galerie**

Dans `app.js`, trouver (ligne ~1414) :
```js
            const galleryTitle = document.createElement('h4');
            galleryTitle.textContent = '📸 Photos additionnelles (' + sub.title + ')';
```

Remplacer par :
```js
            const galleryTitle = document.createElement('h4');
            const _galleryPhotos = getActiveSectionPhotos()[sub.id] || [];
            const _gallerySizeKB = Math.round(_galleryPhotos.reduce((acc, p) => acc + Math.round((p.url || '').length * 0.75), 0) / 1024);
            galleryTitle.textContent = '📸 Photos additionnelles (' + sub.title + ')' + (_galleryPhotos.length > 0 ? ' — ' + _galleryPhotos.length + ' photo' + (_galleryPhotos.length > 1 ? 's' : '') + ' (~' + _gallerySizeKB + ' Ko)' : '');
```

- [ ] **Step 5: Vérifier**

Ouvrir `http://localhost:8000`, créer une inspection, ajouter 1 photo dans une section. Expected : le titre de la galerie affiche "1 photo (~XXX Ko)". Compression plus rapide (photo plus petite que précédemment).

- [ ] **Step 6: Commit**

```bash
git add "C:/Users/jeane/Desktop/Amboul/JEC/app.js"
git commit -m "feat(groupe-h): compression 800/0.65, badge taille galerie, avertissement stockage"
```

---

## Task 3: H3 — Table des matières + Exec Summary amélioré

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Step 1: Ajouter `id="section-N"` sur chaque div de section dans le rapport**

Dans `app.js`, trouver (ligne ~2815) :
```js
        let defectCount = 0;
        inspectionData.sections.forEach(section => {
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport' || section.id === 's_preview') return;

            html += `<div class="page-break" style="padding-top: 50px;">
                     <h2 style="color: #1A56DB; margin-bottom: 20px; border-bottom: 2px solid #1A56DB; padding-bottom: 10px; font-size: 1.8rem;">${section.title}</h2>
```

Remplacer par :
```js
        let defectCount = 0;
        let _sectionIndex = 0;
        inspectionData.sections.forEach(section => {
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport' || section.id === 's_preview') return;
            _sectionIndex++;
            html += `<div class="page-break" id="rapport-section-${_sectionIndex}" style="padding-top: 50px;">
                     <h2 style="color: #1A56DB; margin-bottom: 20px; border-bottom: 2px solid #1A56DB; padding-bottom: 10px; font-size: 1.8rem;">${section.title}</h2>
```

- [ ] **Step 2: Construire la Table des matières et l'insérer entre la cover et les sections**

Dans `app.js`, trouver (ligne ~2810) :
```js
        // CORPS DU RAPPORT
        // Map fieldId → numéro global #N pour les badges
```

Juste AVANT cette ligne, ajouter :

```js
        // TABLE DES MATIÈRES
        const _tocSections = inspectionData.sections.filter(s =>
            s.id !== 's_cover' && s.id !== 's_admin' && s.id !== 's_rapport' && s.id !== 's_preview'
        );
        const _genDate = new Date().toLocaleString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        html += `<div class="page-break" style="padding: 50px 0;">
            <h2 style="color:#0f172a;font-size:1.6rem;margin-bottom:8px;border-bottom:2px solid #e2e8f0;padding-bottom:12px;">📋 Table des matières</h2>
            <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:24px;">Rapport généré le ${_genDate}</p>
            <ol style="list-style:none;padding:0;margin:0;">
                ${_tocSections.map((s, i) => `
                <li style="display:flex;align-items:center;padding:10px 0;border-bottom:1px dashed #e2e8f0;">
                    <span style="background:#1A56DB;color:white;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;margin-right:14px;">${i + 1}</span>
                    <a href="#rapport-section-${i + 1}" style="color:#1A56DB;text-decoration:none;font-size:1rem;font-weight:600;flex:1;">${s.title}</a>
                    <span style="color:#94a3b8;font-size:0.85rem;margin-left:8px;">→ p.${i + 1}</span>
                </li>`).join('')}
                <li style="display:flex;align-items:center;padding:10px 0;border-bottom:1px dashed #e2e8f0;">
                    <span style="background:#dc2626;color:white;border-radius:50%;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;margin-right:14px;">⚠</span>
                    <span style="color:#334155;font-size:1rem;font-weight:600;flex:1;">Sommaire des défauts</span>
                </li>
            </ol>
        </div>`;

```

- [ ] **Step 3: Améliorer l'exec summary — ajouter barres de progression et timestamp**

Dans `app.js`, trouver le bloc qui contient (ligne ~2748) :
```js
        const hasIssues = totalUrgents > 0 || totalMajeurs > 0 || totalSurveiller > 0;
```

Lire les quelques lignes autour pour trouver l'endroit exact où le résumé chiffré est construit (autour de lignes 2756-2780). Trouver la div qui contient les 4 compteurs (Urgents, Majeurs, À surveiller, Conformes). Après le bloc `</div>` qui les ferme, ajouter les barres de progression.

Concrètement, trouver :
```js
        const hasIssues = totalUrgents > 0 || totalMajeurs > 0 || totalSurveiller > 0;
```

Juste APRÈS cette ligne, ajouter :
```js
        const _totalChecked = totalUrgents + totalMajeurs + totalSurveiller + totalConformes || 1;
        const _bars = [
            { label: 'Urgents',    count: totalUrgents,    color: '#dc2626', pct: Math.round(totalUrgents / _totalChecked * 100) },
            { label: 'Majeurs',    count: totalMajeurs,    color: '#d97706', pct: Math.round(totalMajeurs / _totalChecked * 100) },
            { label: 'Surveiller', count: totalSurveiller, color: '#f59e0b', pct: Math.round(totalSurveiller / _totalChecked * 100) },
            { label: 'Conformes',  count: totalConformes,  color: '#22c55e', pct: Math.round(totalConformes / _totalChecked * 100) }
        ];
        const _barsHtml = `<div style="margin-top:24px;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <h3 style="font-size:1rem;color:#0f172a;margin:0 0 16px;">📊 Répartition des observations</h3>
            ${_bars.map(b => `<div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:0.85rem;font-weight:600;margin-bottom:4px;">
                    <span style="color:#334155;">${b.label}</span>
                    <span style="color:${b.color};">${b.count} (${b.pct}%)</span>
                </div>
                <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
                    <div style="background:${b.color};height:100%;width:${b.pct}%;transition:width 0.3s;border-radius:4px;"></div>
                </div>
            </div>`).join('')}
        </div>`;
```

- [ ] **Step 4: Insérer `_barsHtml` dans le HTML du rapport**

Dans le bloc de construction du HTML (après les compteurs), trouver l'endroit où le sommaire se termine (vers ligne ~2807 `</div>\`` juste avant `// CORPS DU RAPPORT`). 

Trouver :
```js
            </div>` : ''}
        </div>` : ''}
            </div>` : ''}
        </div>
    `;
```

NOTE : Cette structure est complexe. À la place, chercher le pattern `_lifespanItems.length > 0` qui est la dernière condition avant la fermeture du sommaire. Trouver :
```js
                ${_lifespanItems.length > 0 ? `
                <div style="margin-top: 24px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h3 style="font-size: 1.1rem; color: #0f172a; margin-bottom: 14px;">🔧 Durée de vie estimée des équipements</h3>
```

Juste AVANT le `${_lifespanItems.length > 0 ?` (sur la même ligne de template), ajouter `${_barsHtml}` :

Trouver la chaîne exacte :
```
                ${_lifespanItems.length > 0 ? `
```

Remplacer par :
```
                ${_barsHtml}
                ${_lifespanItems.length > 0 ? `
```

- [ ] **Step 5: Vérifier dans le navigateur**

Ouvrir `http://localhost:8000`, créer une inspection avec quelques checkboxes cochés (défaut, surveiller, conforme), générer le rapport. Expected :
- Page "Table des matières" visible après la couverture avec tous les titres de section numérotés
- Date et heure de génération visible
- Barres de progression colorées dans le sommaire exécutif

- [ ] **Step 6: Commit**

```bash
git add "C:/Users/jeane/Desktop/Amboul/JEC/app.js"
git commit -m "feat(groupe-h): TOC + barres de progression dans rapport PDF"
```

---

## Task 4: Bump cache

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/sw.js`
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`

- [ ] **Step 1: Bumper sw.js**

Changer :
```js
const CACHE_NAME = 'kzo-inspect-v26';
```
En :
```js
const CACHE_NAME = 'kzo-inspect-v27';
```

- [ ] **Step 2: Bumper app.js?v= dans KZO_Inspect.html**

Changer :
```html
    <script src="app.js?v=25"></script>
```
En :
```html
    <script src="app.js?v=26"></script>
```

- [ ] **Step 3: Commit**

```bash
git add "C:/Users/jeane/Desktop/Amboul/JEC/sw.js" "C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html"
git commit -m "chore(groupe-h): cache v27, app.js v26"
```

---

## Self-Review

### Spec coverage

| Exigence spec | Tâche |
|---|---|
| Bandeau hors-ligne rouge persistant | Task 1 Step 1 |
| Auto-dismiss online + toast | Task 1 Step 1 (`hideBanner`) |
| `navigator.onLine` check initial | Task 1 Step 1 |
| Compression 800px/0.65 | Task 2 Step 1 |
| `_estimatePhotosSize` | Task 2 Step 2 |
| Warning > 3MB / > 6MB | Task 2 Step 3 |
| Badge taille galerie | Task 2 Step 4 |
| TOC avec ancres `#rapport-section-N` | Task 3 Steps 1-2 |
| Date génération dans TOC | Task 3 Step 2 (`_genDate`) |
| Barres de progression exec summary | Task 3 Steps 3-4 |
| Cache v27 | Task 4 |

### Type consistency

- `_estimatePhotosSize(unit)` — défini Task 2 Step 2, appelé Task 2 Step 3 ✅
- `_barsHtml` — défini Task 3 Step 3, inséré Task 3 Step 4 ✅
- `_sectionIndex` — initialisé Task 3 Step 1, utilisé dans `id="rapport-section-N"` et dans le TOC (`i+1`) ✅
- `initOfflineBanner()` — défini et appelé Task 1 ✅

### Placeholder scan

Aucun TBD. Task 3 Step 4 a une note sur la structure complexe du template literal — elle est résolue avec un pattern de recherche exact. ✅
