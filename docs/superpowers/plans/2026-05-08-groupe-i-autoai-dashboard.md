# Groupe I — Auto-analyse IA multi-photos & Tableau de bord — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un toggle on/off pour l'auto-analyse IA + bouton "Analyser toutes" pour multi-photos, et un tableau de bord business listant les inspections passées via KZOStorage.

**Architecture:** Tout dans `app.js` (pas de nouveau fichier). Le tableau de bord utilise l'index sentinelle `-1` pour `currentSectionIndex`. La feature I1 s'appuie sur `localStorage.kzo_auto_ai_photos` et le panel `aiConfigPanel` existant dans `KZO_Inspect.html`.

**Tech Stack:** Vanilla JS, `KZOStorage.listProjects()` (storage.js), `AIAgents.analyzePhotoField()` (ai_agents.js), localStorage.

---

## Fichiers modifiés

| Fichier | Lignes clés |
|---------|-------------|
| `KZO_Inspect.html` | Ajouter checkbox toggle dans `aiConfigPanel` (~ligne 145) ; `app.js?v=27` (~ligne 282) |
| `app.js` | Toggle init+handler (~ligne 2468) ; wrap auto-analyse single-photo (~ligne 1546) ; bouton multi-photos (~ligne 1599) ; `_renderDashboard()` avant `renderNavigation()` (~ligne 734) ; dashboard dispatch dans `renderSection()` (~ligne 780) ; nav entry dans `renderNavigation()` (~ligne 734) |
| `sw.js` | `kzo-inspect-v27` → `kzo-inspect-v28` |

---

## Task I1a — Toggle auto-analyse dans aiConfigPanel

**Files:**
- Modify: `KZO_Inspect.html` (après ligne 145, dans `aiConfigPanel`)
- Modify: `app.js` (après le bloc `clearApiBtn` listener, ~ligne 2468)

- [ ] **Step 1 : Ajouter la checkbox dans `KZO_Inspect.html`**

Trouver dans `aiConfigPanel` :
```html
                </div>
            </div>

            <div class="chat-history" id="chatHistory">
```

Remplacer par :
```html
                </div>
                <label style="display:flex;align-items:center;gap:8px;margin-top:10px;cursor:pointer;font-size:0.82rem;color:#94a3b8;">
                    <input type="checkbox" id="autoAiPhotosToggle" checked style="width:15px;height:15px;cursor:pointer;">
                    🤖 Analyse IA automatique à l'upload
                </label>
            </div>

            <div class="chat-history" id="chatHistory">
```

- [ ] **Step 2 : Ajouter l'init + handler dans `app.js`**

Trouver (après le bloc `clearApiBtn`, environ ligne 2468) :
```js
    }

    // --- Mobile Menu Toggle (Bug fix: handler was missing) ---
```

Insérer avant ce commentaire :
```js
    // Toggle auto-analyse IA à l'upload
    const autoAiToggle = document.getElementById('autoAiPhotosToggle');
    if (autoAiToggle) {
        autoAiToggle.checked = localStorage.getItem('kzo_auto_ai_photos') !== '0';
        autoAiToggle.addEventListener('change', () => {
            localStorage.setItem('kzo_auto_ai_photos', autoAiToggle.checked ? '1' : '0');
        });
    }
```

- [ ] **Step 3 : Vérifier manuellement**

Ouvrir l'assistant IA (`⚙️`) → le toggle "🤖 Analyse IA automatique à l'upload" doit apparaître. Cocher/décocher → `localStorage.getItem('kzo_auto_ai_photos')` doit retourner `'1'` ou `'0'` dans la console.

- [ ] **Step 4 : Commit**

```bash
git add KZO_Inspect.html app.js
git commit -m "feat(groupe-i): toggle auto-analyse IA à l'upload"
```

---

## Task I1b — Wrap single-photo auto-analyse avec toggle check

**Files:**
- Modify: `app.js` (~ligne 1546, dans `fileInput.onchange`)

- [ ] **Step 1 : Modifier la condition dans `fileInput.onchange`**

Trouver (environ ligne 1545) :
```js
                        // Analyse IA automatique (une seule photo à la fois pour éviter les conflits de panneau)
                        if (files.length === 1) {
                            const _activeProvider = localStorage.getItem('inspectpro_api_provider') || 'gemini';
```

Remplacer par :
```js
                        // Analyse IA automatique (une seule photo à la fois pour éviter les conflits de panneau)
                        if (files.length === 1 && localStorage.getItem('kzo_auto_ai_photos') !== '0') {
                            const _activeProvider = localStorage.getItem('inspectpro_api_provider') || 'gemini';
```

- [ ] **Step 2 : Vérifier**

Désactiver le toggle dans l'assistant IA → uploader une photo → aucun panneau d'analyse ne doit apparaître. Réactiver → uploader une photo → panneau d'analyse doit apparaître (si provider vision configuré).

- [ ] **Step 3 : Commit**

```bash
git add app.js
git commit -m "feat(groupe-i): toggle auto-analyse respecté pour upload simple"
```

---

## Task I1c — Bouton "Analyser toutes (X)" pour uploads multiples

**Files:**
- Modify: `app.js` (~après ligne 1599 `renderGallery();` dans `fileInput.onchange`)

- [ ] **Step 1 : Injecter le bouton après `renderGallery()` dans le handler upload**

Trouver (environ ligne 1599) :
```js
                renderGallery();
                if (files.length === 1) {
                    const captionInputs = grid.querySelectorAll('.photo-caption-input');
```

Insérer entre `renderGallery();` et `if (files.length === 1)` :
```js
                // Bouton "Analyser toutes" pour uploads multiples
                if (files.length > 1 && localStorage.getItem('kzo_auto_ai_photos') !== '0') {
                    const _ap = localStorage.getItem('inspectpro_api_provider') || 'gemini';
                    const _vp = ['anthropic', 'gemini', 'openai'];
                    const _existingAnalyzeBtn = galleryContainer.querySelector('[data-analyze-all]');
                    if (_existingAnalyzeBtn) _existingAnalyzeBtn.remove();
                    const analyzeAllBtn = document.createElement('button');
                    analyzeAllBtn.type = 'button';
                    analyzeAllBtn.setAttribute('data-analyze-all', '1');
                    analyzeAllBtn.className = 'btn secondary';
                    analyzeAllBtn.style.cssText = 'font-size:0.82rem;padding:5px 12px;margin-top:8px;display:block;';
                    if (_vp.includes(_ap)) {
                        const _photoCount = (getActiveSectionPhotos()[sub.id] || []).length;
                        analyzeAllBtn.textContent = '🤖 Analyser toutes (' + _photoCount + ')';
                        analyzeAllBtn.onclick = async () => {
                            const photos = getActiveSectionPhotos()[sub.id] || [];
                            analyzeAllBtn.disabled = true;
                            for (let i = 0; i < photos.length; i++) {
                                analyzeAllBtn.textContent = '⏳ Analyse ' + (i + 1) + '/' + photos.length + '...';
                                try {
                                    const b64 = (photos[i].url || '').split(',')[1];
                                    if (!b64) continue;
                                    const result = await AIAgents.analyzePhotoField(b64, sub.title);
                                    if (result && result.description) {
                                        const activeCom = getActiveComments();
                                        if (!activeCom[sub.id]) activeCom[sub.id] = {};
                                        activeCom[sub.id].text = activeCom[sub.id].text
                                            ? activeCom[sub.id].text + '\n' + result.description
                                            : result.description;
                                        if (!photos[i].caption) photos[i].caption = result.description.substring(0, 200);
                                    }
                                } catch(e) { /* continue on error */ }
                            }
                            saveAppState();
                            showToast('✅ ' + photos.length + ' photo' + (photos.length > 1 ? 's' : '') + ' analysée' + (photos.length > 1 ? 's' : '') + '.', 'success');
                            analyzeAllBtn.remove();
                            renderGallery();
                        };
                    } else {
                        analyzeAllBtn.textContent = '🤖 Vision non disponible (' + _ap + ')';
                        analyzeAllBtn.style.opacity = '0.5';
                        analyzeAllBtn.disabled = true;
                    }
                    galleryContainer.insertBefore(analyzeAllBtn, uploadBtnWrap);
                }
```

- [ ] **Step 2 : Vérifier**

Uploader 2 photos dans une sous-section → bouton `🤖 Analyser toutes (2)` doit apparaître sous la galerie. Cliquer → texte passe à `⏳ Analyse 1/2...` puis `⏳ Analyse 2/2...` → toast `✅ 2 photos analysées.` → bouton disparaît.

Tester avec Groq comme provider → bouton grisé `🤖 Vision non disponible (groq)`.

Tester avec toggle désactivé → bouton n'apparaît pas.

- [ ] **Step 3 : Commit**

```bash
git add app.js
git commit -m "feat(groupe-i): bouton analyser toutes pour upload multi-photos"
```

---

## Task I3a — Fonction `_renderDashboard`

**Files:**
- Modify: `app.js` (ajouter avant `function renderNavigation()`, ~ligne 734)

- [ ] **Step 1 : Ajouter `_renderDashboard` avant `renderNavigation`**

Trouver :
```js
    function renderNavigation() {
        navLinks.innerHTML = '';
        inspectionData.sections.forEach((section, index) => {
```

Insérer juste avant :
```js
    async function _renderDashboard(container) {
        container.innerHTML = '<p style="color:#94a3b8;padding:24px;">⏳ Chargement des inspections...</p>';
        let projects = [];
        if (window.KZOStorage) {
            try { projects = await KZOStorage.listProjects(); } catch(e) { projects = []; }
        }
        const now = new Date();
        const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        const total    = projects.length;
        const enCours  = projects.filter(p => p.status !== 'termine').length;
        const termines = projects.filter(p => p.status === 'termine').length;
        const ceMois   = projects.filter(p => (p.createdAt || '').startsWith(thisMonth)).length;

        const _sectionsTotal = inspectionData.sections.filter(s => !s.isCoverPage && s.id !== 's_admin' && s.id !== 's_rapport' && s.id !== 's_preview').length || 1;

        container.innerHTML = `
            <div style="padding:24px;max-width:900px;">
                <h2 style="color:#1A56DB;margin-bottom:24px;font-size:1.8rem;">📊 Tableau de bord</h2>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:32px;">
                    <div style="background:#f0f9ff;border:2px solid #1A56DB;border-radius:10px;padding:20px;text-align:center;">
                        <div style="font-size:2.5rem;font-weight:900;color:#1A56DB;">${total}</div>
                        <div style="font-size:0.85rem;color:#1e40af;font-weight:600;margin-top:4px;">Total</div>
                    </div>
                    <div style="background:#fffbeb;border:2px solid #d97706;border-radius:10px;padding:20px;text-align:center;">
                        <div style="font-size:2.5rem;font-weight:900;color:#d97706;">${enCours}</div>
                        <div style="font-size:0.85rem;color:#92400e;font-weight:600;margin-top:4px;">🔄 En cours</div>
                    </div>
                    <div style="background:#ecfdf5;border:2px solid #059669;border-radius:10px;padding:20px;text-align:center;">
                        <div style="font-size:2.5rem;font-weight:900;color:#059669;">${termines}</div>
                        <div style="font-size:0.85rem;color:#064e3b;font-weight:600;margin-top:4px;">✅ Terminées</div>
                    </div>
                    <div style="background:#f5f3ff;border:2px solid #7c3aed;border-radius:10px;padding:20px;text-align:center;">
                        <div style="font-size:2.5rem;font-weight:900;color:#7c3aed;">${ceMois}</div>
                        <div style="font-size:0.85rem;color:#4c1d95;font-weight:600;margin-top:4px;">📅 Ce mois</div>
                    </div>
                </div>
                ${projects.length === 0 ? `
                    <div style="text-align:center;padding:48px;color:#94a3b8;border:2px dashed #e2e8f0;border-radius:12px;">
                        <div style="font-size:3rem;margin-bottom:16px;">📋</div>
                        <p style="font-size:1rem;">Aucune inspection enregistrée.<br>Commencez une nouvelle inspection.</p>
                    </div>
                ` : `
                    <h3 style="font-size:1.1rem;color:#0f172a;margin-bottom:16px;">Inspections récentes</h3>
                    <div style="display:flex;flex-direction:column;gap:8px;">
                        ${projects.map(p => {
                            const date = new Date(p.updatedAt || p.createdAt || '').toLocaleDateString('fr-CA', {year:'numeric',month:'short',day:'numeric'});
                            const isTermine = p.status === 'termine';
                            const pct = Math.min(100, Math.round((p.progress || 0) / _sectionsTotal * 100));
                            return `<div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;display:flex;align-items:center;gap:16px;">
                                <div style="flex:1;min-width:0;">
                                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
                                        <span style="font-weight:700;color:#1e293b;font-size:0.9rem;">${sanitizeHTML(p.code || p.id)}</span>
                                        <span style="background:${isTermine ? '#dcfce7' : '#dbeafe'};color:${isTermine ? '#166534' : '#1d4ed8'};padding:2px 8px;border-radius:10px;font-size:0.75rem;font-weight:600;">${isTermine ? '✅ Terminée' : '🔄 En cours'}</span>
                                    </div>
                                    <div style="font-size:0.9rem;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${sanitizeHTML(p.clientName || '—')} · ${sanitizeHTML(p.address || '—')}</div>
                                    <div style="font-size:0.8rem;color:#94a3b8;margin-top:2px;">${date}</div>
                                    <div style="margin-top:6px;background:#e2e8f0;border-radius:4px;height:4px;"><div style="background:#1A56DB;height:100%;width:${pct}%;border-radius:4px;transition:width 0.3s;"></div></div>
                                </div>
                                <button data-project-id="${sanitizeHTML(p.id)}" class="btn secondary" style="white-space:nowrap;font-size:0.85rem;padding:6px 14px;flex-shrink:0;">📂 Ouvrir</button>
                            </div>`;
                        }).join('')}
                    </div>
                `}
            </div>
        `;

        container.querySelectorAll('[data-project-id]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.projectId;
                btn.textContent = '⏳';
                btn.disabled = true;
                try {
                    const proj = await KZOStorage.loadProject(id);
                    if (!proj || !proj.data) { showToast('Impossible de charger cette inspection.', 'error'); return; }
                    window.currentProjectId = id;
                    const d = proj.data;
                    Object.assign(inspectionData.clientInfo, d.clientInfo || {});
                    if (d.units && Array.isArray(d.units) && d.units.length > 0) inspectionData.units = d.units;
                    if (d.currentUnitId && inspectionData.units.find(u => u.id === d.currentUnitId)) {
                        inspectionData.currentUnitId = d.currentUnitId;
                    } else {
                        inspectionData.currentUnitId = inspectionData.units[0].id;
                    }
                    currentSectionIndex = 0;
                    renderNavigation();
                    renderSection(0);
                    showToast('✅ Inspection chargée.', 'success');
                } catch(e) {
                    showToast('Erreur chargement : ' + (e.message || 'inconnue'), 'error');
                    btn.textContent = '📂 Ouvrir';
                    btn.disabled = false;
                }
            });
        });
    }

```

- [ ] **Step 2 : Vérifier syntaxe**

```bash
node -e "const fs=require('fs'); try { new Function(fs.readFileSync('app.js','utf8')); console.log('OK'); } catch(e) { console.error(e.message); }"
```

Expected: `OK`

- [ ] **Step 3 : Commit**

```bash
git add app.js
git commit -m "feat(groupe-i): _renderDashboard avec stats et liste inspections"
```

---

## Task I3b — Entrée dashboard dans la sidebar + dispatch dans renderSection

**Files:**
- Modify: `app.js` (`renderNavigation` ~ligne 734, `renderSection` ~ligne 780)

- [ ] **Step 1 : Ajouter l'entrée "Tableau de bord" dans `renderNavigation`**

Trouver :
```js
    function renderNavigation() {
        navLinks.innerHTML = '';
        inspectionData.sections.forEach((section, index) => {
```

Remplacer par :
```js
    function renderNavigation() {
        navLinks.innerHTML = '';

        // Entrée virtuelle : Tableau de bord
        const dashLi = document.createElement('li');
        dashLi.style.cssText = 'display:flex;align-items:center;gap:6px;';
        dashLi.innerHTML = '<span>📊</span> <span>Tableau de bord</span>';
        if (currentSectionIndex === -1) dashLi.classList.add('active');
        dashLi.addEventListener('click', () => {
            currentSectionIndex = -1;
            renderNavigation();
            currentSectionTitle.textContent = 'Tableau de bord';
            dynamicContent.innerHTML = '';
            _renderDashboard(dynamicContent);
            if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
        });
        navLinks.appendChild(dashLi);

        inspectionData.sections.forEach((section, index) => {
```

- [ ] **Step 2 : Ajouter le dispatch dashboard dans `renderSection`**

Trouver :
```js
    function renderSection(index) {
        const section = inspectionData.sections[index];
        currentSectionTitle.textContent = section.title;
        dynamicContent.innerHTML = '';
```

Remplacer par :
```js
    function renderSection(index) {
        if (index === -1) {
            currentSectionTitle.textContent = 'Tableau de bord';
            dynamicContent.innerHTML = '';
            _renderDashboard(dynamicContent);
            return;
        }
        const section = inspectionData.sections[index];
        currentSectionTitle.textContent = section.title;
        dynamicContent.innerHTML = '';
```

- [ ] **Step 3 : Vérifier**

Recharger l'app → "📊 Tableau de bord" doit apparaître en premier dans la sidebar. Cliquer dessus → contenu principal affiche les 4 cartes stats + la liste. Si IndexedDB vide → message "Aucune inspection enregistrée". Naviguer vers une autre section puis revenir au tableau de bord → fonctionne.

- [ ] **Step 4 : Vérifier le chargement d'une inspection**

S'il y a au moins un projet en IndexedDB → cliquer `📂 Ouvrir` → l'inspection se charge, `s_cover` s'affiche, le nom du client est correct.

- [ ] **Step 5 : Commit**

```bash
git add app.js
git commit -m "feat(groupe-i): tableau de bord dans la sidebar avec chargement inspection"
```

---

## Task I4 — Cache v28 + app.js?v=27

**Files:**
- Modify: `sw.js` (ligne 1)
- Modify: `KZO_Inspect.html` (~ligne 282)

- [ ] **Step 1 : Bumper `sw.js`**

```
kzo-inspect-v27  →  kzo-inspect-v28
```

- [ ] **Step 2 : Bumper `KZO_Inspect.html`**

```
app.js?v=26  →  app.js?v=27
```

- [ ] **Step 3 : Commit final**

```bash
git add sw.js KZO_Inspect.html
git commit -m "chore: cache kzo-inspect-v28, app.js?v=27"
```

---

## Self-Review

**Spec coverage :**
- [x] Toggle `kzo_auto_ai_photos` dans `aiConfigPanel` → Task I1a
- [x] Wrap single-photo auto-analyse → Task I1b
- [x] Bouton `Analyser toutes (X)` pour multi-photos → Task I1c
- [x] Provider Groq → bouton grisé → Task I1c
- [x] Dashboard sidebar → Task I3b
- [x] 4 cartes stats → Task I3a
- [x] Liste inspections avec bouton Ouvrir → Task I3a
- [x] État vide → Task I3a
- [x] Cache bump → Task I4

**Placeholder scan :** Aucun TBD ou "implement later" détecté.

**Type consistency :** `_renderDashboard(container)` utilisé dans I3a (définition) et I3b (appel) — cohérent. `data-project-id` utilisé dans I3a pour injection et querySelectorAll — cohérent.
