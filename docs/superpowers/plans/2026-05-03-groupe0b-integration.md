# Groupe 0B — Intégration UI (index.html + app.js)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réécrire `index.html` comme écran d'accueil multi-projets et intégrer `storage.js` dans `app.js` pour remplacer localStorage.

**Architecture:** `index.html` charge `storage.js` + `jszip.min.js` et affiche la grille des projets. `KZO_Inspect.html` lit `?project=ID` dans l'URL, charge le projet depuis IndexedDB, sauvegarde via `KZOStorage.saveProject()` à chaque `saveAppState()`. Bouton "💾 Sauvegarder et quitter" dans top-bar + sidebar.

**Prérequis :** Plan 0A complété (`storage.js` et `jszip.min.js` présents).

**Tech Stack:** JavaScript vanilla, IndexedDB via KZOStorage, JSZip 3.10.1

---

## Fichiers

| Fichier | Action |
|---------|--------|
| `index.html` | Réécriture complète — écran d'accueil |
| `app.js` | Modifié — saveAppState, chargement URL, boutons |
| `KZO_Inspect.html` | Modifié — bouton top-bar + chargement scripts |
| `sw.js` | Modifié — bump CACHE_NAME v17→v18 |

---

## Task 1 : index.html — Écran d'accueil (grille de projets)

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/index.html`

- [ ] **Étape 1 — Lire index.html actuel**

Lire `index.html`. Il fait actuellement ~13 lignes — une simple redirection vers `KZO_Inspect.html`.

- [ ] **Étape 2 — Réécrire index.html**

Remplacer tout le contenu de `index.html` par :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KZO InspectPro — Projets</title>
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#0f172a">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #f1f5f9; min-height: 100vh; }

        .topbar {
            background: #1e3a5f;
            padding: 14px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .logo { font-weight: 800; font-size: 1.1rem; color: #60a5fa; white-space: nowrap; }
        .topbar-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .btn { padding: 8px 18px; border: none; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: opacity 0.2s; }
        .btn:hover { opacity: 0.85; }
        .btn-primary { background: #1d4ed8; color: white; }
        .btn-secondary { background: #334155; color: #cbd5e1; }
        .btn-import { background: #059669; color: white; }

        .main { padding: 24px; max-width: 1100px; margin: 0 auto; }

        .search-bar {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 10px;
            padding: 10px 16px;
            color: #f1f5f9;
            font-size: 0.9rem;
            width: 100%;
            margin-bottom: 16px;
        }
        .search-bar::placeholder { color: #64748b; }
        .search-bar:focus { outline: none; border-color: #3b82f6; }

        .filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
        .filter-btn {
            padding: 6px 16px;
            border: none;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            background: #1e293b;
            color: #64748b;
            transition: all 0.2s;
        }
        .filter-btn.active { background: #1d4ed8; color: white; }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
        }

        .card {
            background: #1e293b;
            border-radius: 12px;
            border-left: 4px solid #334155;
            padding: 16px;
            cursor: pointer;
            transition: transform 0.15s, box-shadow 0.15s;
            position: relative;
        }
        .card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .card.en_cours { border-left-color: #f59e0b; }
        .card.termine { border-left-color: #22c55e; }

        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .badge {
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 0.05em;
        }
        .badge.en_cours { background: #f59e0b; color: #0f172a; }
        .badge.termine { background: #22c55e; color: #0f172a; }
        .card-date { color: #475569; font-size: 0.75rem; }

        .card-client { font-weight: 700; font-size: 1rem; color: #f1f5f9; margin-bottom: 4px; }
        .card-code { color: #60a5fa; font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; }
        .card-address { color: #94a3b8; font-size: 0.8rem; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .progress-bar-bg { background: #0f172a; border-radius: 4px; height: 5px; margin-bottom: 6px; }
        .progress-bar-fill { height: 5px; border-radius: 4px; transition: width 0.3s; }
        .en_cours .progress-bar-fill { background: #f59e0b; }
        .termine .progress-bar-fill { background: #22c55e; }
        .progress-label { color: #64748b; font-size: 0.72rem; }

        .card-actions {
            display: none;
            position: absolute;
            bottom: 12px;
            right: 12px;
            gap: 6px;
        }
        .card:hover .card-actions { display: flex; }
        .action-btn {
            padding: 5px 10px;
            border: none;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
        }
        .action-btn.open { background: #1d4ed8; color: white; }
        .action-btn.export { background: #334155; color: #cbd5e1; }
        .action-btn.del { background: #dc2626; color: white; }

        .empty-state {
            text-align: center;
            padding: 80px 20px;
            color: #475569;
        }
        .empty-state h2 { font-size: 1.3rem; margin-bottom: 10px; color: #64748b; }

        #toast-home {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #059669;
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.9rem;
            display: none;
            z-index: 999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
    </style>
</head>
<body>

<div class="topbar">
    <div class="logo">🏠 KZO InspectPro</div>
    <div class="topbar-actions">
        <button class="btn btn-secondary btn-import" onclick="triggerImport()">📂 Ouvrir .kzo</button>
        <button class="btn btn-primary" onclick="newInspection()">+ Nouvelle inspection</button>
    </div>
</div>

<div class="main">
    <input class="search-bar" type="text" id="searchInput" placeholder="🔍 Rechercher par client, adresse ou code..." oninput="filterProjects()">

    <div class="filters">
        <button class="filter-btn active" data-filter="all" onclick="setFilter('all', this)">Tous</button>
        <button class="filter-btn" data-filter="en_cours" onclick="setFilter('en_cours', this)">En cours</button>
        <button class="filter-btn" data-filter="termine" onclick="setFilter('termine', this)">Terminés</button>
    </div>

    <div class="grid" id="projectGrid"></div>
</div>

<div id="toast-home"></div>

<input type="file" id="importInput" accept=".kzo" style="display:none" onchange="handleImport(event)">

<script src="jszip.min.js"></script>
<script src="storage.js"></script>
<script>
    let allProjects = [];
    let currentFilter = 'all';

    function showToast(msg, color = '#059669') {
        const t = document.getElementById('toast-home');
        t.textContent = msg;
        t.style.background = color;
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 3000);
    }

    function formatDate(iso) {
        if (!iso) return '';
        return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function renderGrid(projects) {
        const grid = document.getElementById('projectGrid');
        if (!projects.length) {
            grid.innerHTML = '<div class="empty-state"><h2>Aucune inspection trouvée</h2><p>Créez votre première inspection ou importez un fichier .kzo</p></div>';
            return;
        }
        grid.innerHTML = projects.map(p => {
            const pct = Math.round((p.progress / 10) * 100);
            return `
            <div class="card ${p.status}" onclick="openProject('${p.id}')">
                <div class="card-header">
                    <span class="badge ${p.status}">${p.status === 'en_cours' ? 'EN COURS' : 'TERMINÉ'}</span>
                    <span class="card-date">${formatDate(p.updatedAt)}</span>
                </div>
                <div class="card-client">${p.clientName || 'Client inconnu'}</div>
                <div class="card-code">${p.code || p.id}</div>
                <div class="card-address">${p.address || '—'}</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:${Math.min(pct, 100)}%"></div>
                </div>
                <div class="progress-label">${p.progress}/10 sections</div>
                <div class="card-actions" onclick="event.stopPropagation()">
                    <button class="action-btn open" onclick="openProject('${p.id}')">Ouvrir</button>
                    <button class="action-btn export" onclick="exportProject('${p.id}')">⬇️ .kzo</button>
                    <button class="action-btn del" onclick="deleteProject('${p.id}')">🗑️</button>
                </div>
            </div>`;
        }).join('');
    }

    function filterProjects() {
        const q = document.getElementById('searchInput').value.toLowerCase();
        let filtered = allProjects;
        if (currentFilter !== 'all') filtered = filtered.filter(p => p.status === currentFilter);
        if (q) filtered = filtered.filter(p =>
            (p.clientName || '').toLowerCase().includes(q) ||
            (p.address || '').toLowerCase().includes(q) ||
            (p.code || '').toLowerCase().includes(q)
        );
        renderGrid(filtered);
    }

    function setFilter(filter, btn) {
        currentFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterProjects();
    }

    function openProject(id) {
        window.location.href = 'KZO_Inspect.html?project=' + encodeURIComponent(id);
    }

    function newInspection() {
        const newId = 'KZO-' + Date.now().toString().slice(-5);
        window.location.href = 'KZO_Inspect.html?project=' + newId + '&new=1';
    }

    async function exportProject(id) {
        try {
            showToast('⏳ Génération du fichier .kzo...');
            const blob = await KZOStorage.exportKZO(id);
            const project = allProjects.find(p => p.id === id);
            const name = (project ? project.clientName.replace(/[^a-zA-Z0-9]/g, '_') : id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `KZO-${name}-${new Date().toISOString().slice(0,10)}.kzo`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('✅ Fichier .kzo exporté');
        } catch(e) {
            showToast('❌ Erreur export : ' + e.message, '#dc2626');
        }
    }

    async function deleteProject(id) {
        const project = allProjects.find(p => p.id === id);
        const name = project ? project.clientName : id;
        if (!confirm(`Supprimer l'inspection de "${name}" ?\nCette action est irréversible.`)) return;
        await KZOStorage.deleteProject(id);
        showToast('🗑️ Inspection supprimée');
        await loadAndRender();
    }

    function triggerImport() {
        document.getElementById('importInput').value = '';
        document.getElementById('importInput').click();
    }

    async function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        try {
            showToast('⏳ Import en cours...');
            const projectId = await KZOStorage.importKZO(file);
            if (projectId) {
                showToast('✅ Inspection importée — ' + projectId);
                await loadAndRender();
            }
        } catch(e) {
            showToast('❌ Erreur import : ' + e.message, '#dc2626');
        }
    }

    async function loadAndRender() {
        allProjects = await KZOStorage.listProjects();
        filterProjects();
    }

    // Init
    KZOStorage.migrateLegacy().then(() => loadAndRender());
</script>
</body>
</html>
```

- [ ] **Étape 3 — Vérifier dans le navigateur**

Ouvrir `http://localhost:8000` (ou `http://localhost:8000/index.html`).

Vérifier :
- L'écran d'accueil s'affiche (pas de redirection vers KZO_Inspect.html)
- La grille s'affiche (vide si aucun projet, ou avec les projets migrés)
- Le bouton "+ Nouvelle inspection" redirige vers `KZO_Inspect.html?project=KZO-XXXXX&new=1`
- La recherche filtre en temps réel

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add index.html
git commit -m "feat: index.html — écran d'accueil multi-projets avec grille, recherche, filtres"
```

---

## Task 2 : app.js — Chargement projet depuis URL + currentProjectId

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Étape 1 — Lire le début de app.js**

Lire `app.js` lignes 140-200 pour localiser le bloc `loadAppState()` et l'initialisation de `inspectionData`.

- [ ] **Étape 2 — Ajouter currentProjectId et chargement URL**

Localiser dans `app.js` (ligne ~145) :
```js
    // Charger les données persistées depuis localStorage
    const savedInspectorName = localStorage.getItem('inspectpro_inspector_name') || '';
```

AVANT cette ligne, insérer :

```js
    // --- Gestion multi-projets ---
    const _urlParams = new URLSearchParams(window.location.search);
    window.currentProjectId = _urlParams.get('project');

    // Si aucun project dans l'URL → retourner à l'accueil
    if (!window.currentProjectId) {
        window.location.href = 'index.html';
        return;
    }

    // Charger le projet depuis IndexedDB (si projet existant)
    const _isNewProject = _urlParams.get('new') === '1';
    if (!_isNewProject && window.KZOStorage) {
        try {
            const _savedProject = await KZOStorage.loadProject(window.currentProjectId);
            if (_savedProject && _savedProject.data) {
                // Restaurer les données dans inspectionData
                Object.assign(inspectionData, _savedProject.data);
                inspectionData.id = window.currentProjectId;
            }
        } catch(e) {
            console.warn('[app.js] Chargement projet IndexedDB échoué:', e);
        }
    } else if (_isNewProject) {
        // Nouveau projet : assigner l'ID
        inspectionData.id = window.currentProjectId;
    }
```

**Note :** Le `await` requiert que la fonction englobante soit `async`. Vérifier que le callback `DOMContentLoaded` accepte async : `document.addEventListener('DOMContentLoaded', async () => {`. Si ce n'est pas le cas, localiser la déclaration et ajouter `async`.

- [ ] **Étape 3 — Vérifier la déclaration async**

```bash
grep -n "DOMContentLoaded" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -3
```

Si la ligne est `document.addEventListener('DOMContentLoaded', () => {`, remplacer par :
```js
document.addEventListener('DOMContentLoaded', async () => {
```

- [ ] **Étape 4 — Vérifier dans le navigateur**

Ouvrir `http://localhost:8000/KZO_Inspect.html` sans paramètre → doit rediriger vers `index.html`.
Ouvrir `http://localhost:8000/KZO_Inspect.html?project=KZO-99999&new=1` → doit charger l'app normalement.

Dans la console :
```js
console.log('currentProjectId:', window.currentProjectId); // → "KZO-99999"
```

- [ ] **Étape 5 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: app.js — chargement projet depuis URL ?project=ID + redirection index"
```

---

## Task 3 : app.js — saveAppState() → IndexedDB

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Étape 1 — Lire saveAppState() actuelle**

Lire `app.js` ligne 2564. La fonction actuelle :
```js
    function saveAppState() {
        try {
            const toSave = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId
            };
            localStorage.setItem('kzo_inspection_data', JSON.stringify(toSave));
        } catch(e) { console.error("Erreur sauvegarde", e); }
    }
```

- [ ] **Étape 2 — Remplacer saveAppState()**

Remplacer tout le bloc `function saveAppState() { ... }` par :

```js
    function saveAppState() {
        // Sauvegarde localStorage (compatibilité legacy)
        try {
            const toSave = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId
            };
            localStorage.setItem('kzo_inspection_data', JSON.stringify(toSave));
        } catch(e) { console.error("Erreur sauvegarde localStorage", e); }

        // Sauvegarde IndexedDB (primaire)
        if (window.currentProjectId && window.KZOStorage) {
            const snapshot = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId,
                sections: inspectionData.sections,
                rapportNarratifIA: inspectionData.rapportNarratifIA || ''
            };
            KZOStorage.saveProject(window.currentProjectId, snapshot)
                .catch(e => console.warn('[saveAppState] IndexedDB:', e));
        }
    }
```

- [ ] **Étape 3 — Vérifier dans le navigateur**

Ouvrir `http://localhost:8000/KZO_Inspect.html?project=KZO-TEST&new=1`.

Remplir quelques champs, puis dans la console :
```js
// Attendre que le save async soit terminé
await KZOStorage.saveProject(window.currentProjectId, { clientInfo: inspectionData.clientInfo, id: inspectionData.id, units: inspectionData.units, currentUnitId: inspectionData.currentUnitId });
const p = await KZOStorage.loadProject(window.currentProjectId);
console.log('Projet sauvegardé:', p.clientName, p.updatedAt);
```

Dans DevTools → Application → IndexedDB → `kzo_inspectpro_db` → `projects` : vérifier que le projet apparaît.

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: app.js — saveAppState() écrit dans IndexedDB + localStorage (double write)"
```

---

## Task 4 : KZO_Inspect.html + app.js — Bouton "Sauvegarder et quitter"

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Étape 1 — Ajouter le bouton dans la top-bar (KZO_Inspect.html)**

Localiser dans `KZO_Inspect.html` le bouton `id="assistantBtn"` dans la top-bar :
```html
<button class="assistant-btn" id="assistantBtn">
    ✨ Assistant IA
</button>
```

Insérer AVANT ce bouton :
```html
<button id="saveQuitBtn" style="padding:7px 14px; background:#475569; color:white; border:none; border-radius:8px; font-size:0.85rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; margin-right:4px;">
    💾 Sauvegarder et quitter
</button>
```

- [ ] **Étape 2 — Ajouter le bouton dans le sidebar (app.js)**

Localiser dans `app.js` la fonction `renderNavigation()` ou la boucle qui génère les items du menu latéral. Chercher :
```bash
grep -n "renderNavigation\|sidebar\|nav-item\|sectionList" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -10
```

Après le dernier item de navigation généré, ajouter le bouton "Sauvegarder et quitter" épinglé en bas du sidebar. Localiser où le sidebar est construit et ajouter à la fin :

```js
    // Bouton "Sauvegarder et quitter" en bas du sidebar
    function renderSaveQuitSidebar() {
        const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar') || document.querySelector('nav');
        if (!sidebar) return;
        let existing = document.getElementById('saveQuitSidebarBtn');
        if (existing) return; // déjà rendu
        const btn = document.createElement('button');
        btn.id = 'saveQuitSidebarBtn';
        btn.textContent = '💾 Sauvegarder et quitter';
        btn.style.cssText = `
            display: block;
            width: calc(100% - 16px);
            margin: 12px 8px 8px;
            padding: 10px 14px;
            background: #475569;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            text-align: center;
        `;
        btn.addEventListener('click', saveAndQuit);
        sidebar.appendChild(btn);
    }
```

Appeler `renderSaveQuitSidebar()` après l'initialisation de la navigation.

- [ ] **Étape 3 — Câbler la fonction saveAndQuit() dans app.js**

Localiser dans `app.js` juste après `showPhotoAnalysis()` (ligne ~120) et ajouter :

```js
    // Sauvegarder et retourner à l'accueil
    async function saveAndQuit() {
        if (window.currentProjectId && window.KZOStorage) {
            try {
                const snapshot = {
                    clientInfo: inspectionData.clientInfo,
                    id: inspectionData.id,
                    units: inspectionData.units,
                    currentUnitId: inspectionData.currentUnitId,
                    sections: inspectionData.sections,
                    rapportNarratifIA: inspectionData.rapportNarratifIA || ''
                };
                await KZOStorage.saveProject(window.currentProjectId, snapshot);
                showToast('Inspection sauvegardée ✓', 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1200);
            } catch(e) {
                showToast('Erreur sauvegarde : ' + e.message, 'error');
            }
        } else {
            window.location.href = 'index.html';
        }
    }
```

- [ ] **Étape 4 — Câbler le bouton top-bar**

Localiser dans `app.js` le bloc qui câble `assistantBtn` (ligne ~442). AVANT ce bloc, ajouter :

```js
    // Bouton "Sauvegarder et quitter" — top-bar
    const saveQuitTopBtn = document.getElementById('saveQuitBtn');
    if (saveQuitTopBtn) {
        saveQuitTopBtn.addEventListener('click', saveAndQuit);
    }
```

Puis appeler `renderSaveQuitSidebar()` juste après.

- [ ] **Étape 5 — Charger storage.js et jszip.min.js dans KZO_Inspect.html**

Localiser dans `KZO_Inspect.html` les balises `<script src=` au bas de la page. Ajouter AVANT les scripts existants :

```html
<script src="jszip.min.js"></script>
<script src="storage.js"></script>
```

- [ ] **Étape 6 — Vérifier dans le navigateur**

Ouvrir `http://localhost:8000/KZO_Inspect.html?project=KZO-TEST&new=1`.

Vérifier :
- Bouton "💾 Sauvegarder et quitter" visible dans la top-bar à gauche
- Bouton identique visible en bas du sidebar
- Cliquer le bouton → toast "Inspection sauvegardée ✓" → redirection vers `index.html`
- Dans `index.html` : le projet KZO-TEST apparaît dans la grille

- [ ] **Étape 7 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add KZO_Inspect.html app.js
git commit -m "feat: bouton Sauvegarder et quitter — top-bar + sidebar + saveAndQuit()"
```

---

## Task 5 : app.js — PDF → statut "termine" + bouton export .kzo

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`

- [ ] **Étape 1 — Localiser generateFinalReport() dans app.js**

```bash
grep -n "generateFinalReport\|function generateFinal" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -5
```

- [ ] **Étape 2 — Ajouter le statut "termine" après génération PDF**

Localiser dans `generateFinalReport()` le moment où le rapport est rendu (typiquement un `printWindow.document.write(...)` ou `window.print()`). APRÈS cet appel, ajouter :

```js
        // Marquer le projet comme terminé dans IndexedDB
        if (window.currentProjectId && window.KZOStorage) {
            const snapshot = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId,
                sections: inspectionData.sections,
                rapportNarratifIA: inspectionData.rapportNarratifIA || ''
            };
            KZOStorage.saveProject(window.currentProjectId, snapshot, undefined, 'termine')
                .catch(e => console.warn('[generateFinalReport] IndexedDB:', e));
        }
```

- [ ] **Étape 3 — Ajouter bouton "⬇️ Exporter .kzo" dans top-bar**

Dans `KZO_Inspect.html`, après le bouton `saveQuitBtn` ajouté en Task 4, ajouter :

```html
<button id="exportKzoBtn" style="padding:7px 14px; background:#334155; color:#cbd5e1; border:none; border-radius:8px; font-size:0.85rem; font-weight:700; cursor:pointer; margin-right:4px;">
    ⬇️ .kzo
</button>
```

Câbler dans `app.js` (même zone que saveQuitTopBtn) :

```js
    const exportKzoBtn = document.getElementById('exportKzoBtn');
    if (exportKzoBtn) {
        exportKzoBtn.addEventListener('click', async () => {
            if (!window.currentProjectId || !window.KZOStorage) return;
            exportKzoBtn.textContent = '⏳ Export...';
            exportKzoBtn.disabled = true;
            try {
                // S'assurer que l'état courant est sauvegardé avant export
                const snapshot = {
                    clientInfo: inspectionData.clientInfo,
                    id: inspectionData.id,
                    units: inspectionData.units,
                    currentUnitId: inspectionData.currentUnitId,
                    sections: inspectionData.sections,
                    rapportNarratifIA: inspectionData.rapportNarratifIA || ''
                };
                await KZOStorage.saveProject(window.currentProjectId, snapshot);
                const blob = await KZOStorage.exportKZO(window.currentProjectId);
                const clientName = (inspectionData.clientInfo.names || []).filter(Boolean).join('_') || 'inspection';
                const filename = `KZO-${clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().slice(0,10)}.kzo`;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename; a.click();
                URL.revokeObjectURL(url);
                showToast('Fichier .kzo exporté ✓', 'success');
            } catch(e) {
                showToast('Erreur export : ' + e.message, 'error');
            } finally {
                exportKzoBtn.textContent = '⬇️ .kzo';
                exportKzoBtn.disabled = false;
            }
        });
    }
```

- [ ] **Étape 4 — Vérifier dans le navigateur**

Ouvrir une inspection, générer un PDF. Vérifier dans `index.html` que le projet passe en statut "TERMINÉ" (badge vert).

Cliquer "⬇️ .kzo" → vérifier le téléchargement.

- [ ] **Étape 5 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js KZO_Inspect.html
git commit -m "feat: PDF → statut termine automatique + bouton export .kzo dans top-bar"
```

---

## Task 6 : Bump cache PWA v18 + versions scripts

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/sw.js`
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`

- [ ] **Étape 1 — Lire sw.js**

Lire `sw.js` ligne 1. Trouver `CACHE_NAME` et le tableau `ASSETS`.

- [ ] **Étape 2 — Bumper CACHE_NAME et ajouter nouveaux fichiers**

Localiser dans `sw.js` :
```js
const CACHE_NAME = 'kzo-inspect-v17';
```
Remplacer par :
```js
const CACHE_NAME = 'kzo-inspect-v18';
```

Localiser le tableau `ASSETS` dans `sw.js` et ajouter `'jszip.min.js'` et `'storage.js'` :
```js
const ASSETS = [
    // ... fichiers existants ...
    'jszip.min.js',
    'storage.js'
];
```

- [ ] **Étape 3 — Bumper les versions scripts dans KZO_Inspect.html**

Lire `KZO_Inspect.html`. Incrémenter :
- `app.js?v=16` → `app.js?v=17`
- `ai_agents.js?v=13` → `ai_agents.js?v=14`

Ajouter avec version pour les nouveaux scripts (si pas déjà versionné) :
```html
<script src="jszip.min.js"></script>
<script src="storage.js"></script>
```

- [ ] **Étape 4 — Vérifier**

```bash
grep -n "CACHE_NAME\|jszip\|storage.js\|app.js\|ai_agents" "C:/Users/jeane/Desktop/Amboul/JEC/sw.js" "C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html" | grep -v ".git" | head -20
```

- [ ] **Étape 5 — Commit et push**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add sw.js KZO_Inspect.html
git commit -m "chore: bump cache PWA v17→v18 + storage.js + jszip.min.js dans cache"
git push
```
