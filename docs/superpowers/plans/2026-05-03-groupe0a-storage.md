# Groupe 0A — Module storage.js (IndexedDB)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer le module `window.KZOStorage` qui abstrait IndexedDB pour stocker les projets d'inspection et exporter/importer des fichiers `.kzo`.

**Architecture:** `storage.js` est un IIFE exposé sur `window.KZOStorage`. Il gère une base IndexedDB `kzo_inspectpro_db` avec deux object stores : `projects` (données complètes incluant photos base64) et un schéma extensible. JSZip (local) gère la compression pour l'export/import `.kzo`.

**Tech Stack:** IndexedDB native, JSZip 3.10.1 (fichier local), JavaScript vanilla IIFE

---

## Fichiers

| Fichier | Action |
|---------|--------|
| `jszip.min.js` | Nouveau — téléchargé localement |
| `storage.js` | Nouveau — module KZOStorage |

---

## Task 1 : Télécharger JSZip + squelette storage.js

**Files:**
- Create: `C:/Users/jeane/Desktop/Amboul/JEC/jszip.min.js`
- Create: `C:/Users/jeane/Desktop/Amboul/JEC/storage.js`

- [ ] **Étape 1 — Télécharger JSZip**

Dans le navigateur, aller à :
`https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`

Sauvegarder le fichier sous `C:/Users/jeane/Desktop/Amboul/JEC/jszip.min.js`.

Vérifier :
```bash
ls -la "C:/Users/jeane/Desktop/Amboul/JEC/jszip.min.js"
```
Résultat attendu : fichier ~100 Ko présent.

- [ ] **Étape 2 — Créer storage.js avec openDB()**

Créer `C:/Users/jeane/Desktop/Amboul/JEC/storage.js` :

```js
window.KZOStorage = (function () {
    const DB_NAME = 'kzo_inspectpro_db';
    const DB_VERSION = 1;
    let _db = null;

    function openDB() {
        if (_db) return Promise.resolve(_db);
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('projects')) {
                    db.createObjectStore('projects', { keyPath: 'id' });
                }
            };
            req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    return { openDB };
})();
```

- [ ] **Étape 3 — Vérifier dans le navigateur**

Ouvrir `http://localhost:8000/KZO_Inspect.html` temporairement avec le script chargé (pour tester, ajouter temporairement dans `KZO_Inspect.html` : `<script src="storage.js"></script>` avant `</body>`).

Dans la console :
```js
KZOStorage.openDB().then(db => console.log('DB OK:', db.name))
```
Résultat attendu : `DB OK: kzo_inspectpro_db`

Dans DevTools → Application → IndexedDB : vérifier que `kzo_inspectpro_db` apparaît avec le store `projects`.

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add jszip.min.js storage.js
git commit -m "feat: storage.js squelette + openDB() IndexedDB schema"
```

---

## Task 2 : CRUD projets — listProjects, saveProject, loadProject, deleteProject

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/storage.js`

- [ ] **Étape 1 — Ajouter les helpers privés et les 4 fonctions CRUD**

Remplacer le contenu de `storage.js` par :

```js
window.KZOStorage = (function () {
    const DB_NAME = 'kzo_inspectpro_db';
    const DB_VERSION = 1;
    let _db = null;

    function openDB() {
        if (_db) return Promise.resolve(_db);
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('projects')) {
                    db.createObjectStore('projects', { keyPath: 'id' });
                }
            };
            req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    // Extrait le nom du client depuis inspectionData
    function _clientName(data) {
        if (!data) return 'Client inconnu';
        const names = data.clientInfo && data.clientInfo.names;
        if (Array.isArray(names) && names.filter(Boolean).length > 0) {
            return names.filter(Boolean).join(' & ');
        }
        return (data.clientInfo && data.clientInfo.name) || 'Client inconnu';
    }

    // Extrait l'adresse depuis fieldStates (via units[0])
    function _address(data) {
        if (!data) return '';
        try {
            const unit = data.units && data.units[0];
            return (unit && unit.fieldStates && unit.fieldStates['prop_address']) || '';
        } catch (e) { return ''; }
    }

    // Compte les sections avec au moins 1 checkbox cochée
    function _progress(data) {
        if (!data || !data.sections || !data.units) return 0;
        const unit = data.units.find(u => u.id === data.currentUnitId) || data.units[0];
        const states = (unit && unit.fieldStates) || {};
        let count = 0;
        data.sections.forEach(section => {
            if (section.isCoverPage || section.id === 's_admin') return;
            const hasChecked = section.subSections.some(sub =>
                sub.fields.some(f => f.type === 'checkbox' && states[f.id])
            );
            if (hasChecked) count++;
        });
        return count;
    }

    async function listProjects() {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const req = db.transaction('projects', 'readonly')
                          .objectStore('projects').getAll();
            req.onsuccess = () => {
                const list = (req.result || []).sort(
                    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
                );
                resolve(list);
            };
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async function saveProject(id, data, progress, status) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('projects', 'readwrite');
            const store = tx.objectStore('projects');
            store.get(id).onsuccess = (e) => {
                const existing = e.target.result;
                const now = new Date().toISOString();
                const project = {
                    id,
                    code: id,
                    clientName: _clientName(data),
                    address: _address(data),
                    createdAt: existing ? existing.createdAt : now,
                    updatedAt: now,
                    status: status !== undefined ? status : (existing ? existing.status : 'en_cours'),
                    progress: progress !== undefined ? progress : _progress(data),
                    data
                };
                const put = store.put(project);
                put.onsuccess = () => resolve();
                put.onerror = (ev) => reject(ev.target.error);
            };
        });
    }

    async function loadProject(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const req = db.transaction('projects', 'readonly')
                          .objectStore('projects').get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async function deleteProject(id) {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const req = db.transaction('projects', 'readwrite')
                          .objectStore('projects').delete(id);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }

    return { openDB, listProjects, saveProject, loadProject, deleteProject };
})();
```

- [ ] **Étape 2 — Vérifier dans le navigateur**

Ouvrir `http://localhost:8000/KZO_Inspect.html` (avec `<script src="storage.js"></script>` temporaire).

Dans la console, tester séquentiellement :
```js
// Sauvegarder un projet de test
const fakeData = { id: 'KZO-TEST', clientInfo: { names: ['Jean Test'] }, units: [{ id: 'unit_1', fieldStates: { prop_address: '123 rue Test, Laval' }, sectionPhotos: {} }], currentUnitId: 'unit_1', sections: inspectionData.sections };
await KZOStorage.saveProject('KZO-TEST', fakeData, 3, 'en_cours');
console.log('saveProject OK');

// Charger
const p = await KZOStorage.loadProject('KZO-TEST');
console.log('clientName:', p.clientName); // → "Jean Test"
console.log('address:', p.address);       // → "123 rue Test, Laval"
console.log('status:', p.status);         // → "en_cours"

// Lister
const list = await KZOStorage.listProjects();
console.log('listProjects count:', list.length); // → ≥ 1

// Supprimer
await KZOStorage.deleteProject('KZO-TEST');
const gone = await KZOStorage.loadProject('KZO-TEST');
console.log('deleted:', gone === null); // → true
```

- [ ] **Étape 3 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add storage.js
git commit -m "feat: storage.js — listProjects, saveProject, loadProject, deleteProject"
```

---

## Task 3 : Export/Import .kzo

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/storage.js`

- [ ] **Étape 1 — Ajouter les helpers d'extraction de photos**

Dans `storage.js`, juste avant le `return { ... }` final, ajouter les fonctions suivantes :

```js
    // Extrait toutes les photos de inspectionData.units
    // Retourne [{subId, unitId, url, index}]
    function _extractPhotos(data) {
        const photos = [];
        if (!data || !data.units) return photos;
        data.units.forEach(unit => {
            const store = unit.sectionPhotos || {};
            Object.entries(store).forEach(([subId, arr]) => {
                (arr || []).forEach((photo, i) => {
                    if (photo && photo.url) {
                        photos.push({ subId, unitId: unit.id, url: photo.url, index: i });
                    }
                });
            });
        });
        return photos;
    }

    // Recrée inspectionData.units avec photos depuis un index
    function _rebuildPhotos(data, photoIndex, getBase64) {
        if (!data || !data.units) return data;
        // Vider les photos dans les units
        data.units.forEach(unit => { unit.sectionPhotos = {}; });
        // Réinjecter depuis photoIndex
        photoIndex.forEach(entry => {
            const unit = data.units.find(u => u.id === entry.unitId) || data.units[0];
            if (!unit.sectionPhotos[entry.subId]) unit.sectionPhotos[entry.subId] = [];
            unit.sectionPhotos[entry.subId][entry.index] = {
                url: 'data:image/jpeg;base64,' + getBase64(entry.file),
                caption: entry.caption || ''
            };
        });
        return data;
    }
```

- [ ] **Étape 2 — Ajouter exportKZO()**

Juste avant `return { ... }`, ajouter :

```js
    async function exportKZO(projectId) {
        const project = await loadProject(projectId);
        if (!project) throw new Error('Projet introuvable : ' + projectId);

        const zip = new JSZip();
        const photos = _extractPhotos(project.data);

        // Construire l'index des photos et retirer les blobs du data JSON
        const dataForJson = JSON.parse(JSON.stringify(project.data));
        dataForJson.units.forEach(unit => { unit.sectionPhotos = {}; });

        const photoIndex = [];
        photos.forEach((p, i) => {
            const filename = `photos/${p.unitId}_${p.subId}_${p.index}.jpg`;
            const base64 = p.url.includes(',') ? p.url.split(',')[1] : p.url;
            zip.file(filename, base64, { base64: true });
            photoIndex.push({
                subId: p.subId,
                unitId: p.unitId,
                index: p.index,
                file: filename,
                caption: p.caption || ''
            });
        });

        const inspectionJson = {
            version: 1,
            exportedAt: new Date().toISOString(),
            project: {
                id: project.id,
                code: project.code,
                clientName: project.clientName,
                address: project.address,
                status: project.status,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt
            },
            data: dataForJson,
            photoIndex
        };

        zip.file('inspection.json', JSON.stringify(inspectionJson, null, 2));
        return zip.generateAsync({ type: 'blob' });
    }
```

- [ ] **Étape 3 — Ajouter importKZO()**

Juste avant `return { ... }`, ajouter :

```js
    async function importKZO(file) {
        const zip = await JSZip.loadAsync(file);

        const jsonFile = zip.file('inspection.json');
        if (!jsonFile) throw new Error('Fichier .kzo invalide — inspection.json manquant');

        const jsonStr = await jsonFile.async('string');
        const inspection = JSON.parse(jsonStr);
        if (!inspection.version || !inspection.data || !inspection.project) {
            throw new Error('Fichier .kzo invalide — structure incorrecte');
        }

        // Charger les photos depuis le ZIP
        const base64Cache = {};
        for (const entry of (inspection.photoIndex || [])) {
            const zipEntry = zip.file(entry.file);
            if (zipEntry) {
                base64Cache[entry.file] = await zipEntry.async('base64');
            }
        }

        // Reconstruire les photos dans inspectionData
        const data = _rebuildPhotos(
            inspection.data,
            inspection.photoIndex || [],
            (file) => base64Cache[file] || ''
        );

        const projectId = inspection.project.id;

        // Vérifier si un projet existant a le même ID
        const existing = await loadProject(projectId);
        if (existing) {
            const overwrite = confirm(
                `Un projet "${existing.clientName}" (${projectId}) existe déjà.\nÉcraser avec le fichier importé ?`
            );
            if (!overwrite) return null;
        }

        await saveProject(
            projectId,
            data,
            undefined,
            inspection.project.status || 'en_cours'
        );

        return projectId;
    }
```

- [ ] **Étape 4 — Mettre à jour le return**

Remplacer la ligne `return { openDB, listProjects, saveProject, loadProject, deleteProject };` par :

```js
    return { openDB, listProjects, saveProject, loadProject, deleteProject, exportKZO, importKZO };
```

- [ ] **Étape 5 — Vérifier export dans le navigateur**

Dans la console de `http://localhost:8000/KZO_Inspect.html` (avec `storage.js` et `jszip.min.js` chargés) :

```js
// Sauvegarder l'état courant comme projet de test
await KZOStorage.saveProject(inspectionData.id, { ...inspectionData, units: inspectionData.units }, 0);

// Exporter
const blob = await KZOStorage.exportKZO(inspectionData.id);
console.log('Export blob size (bytes):', blob.size); // → nombre > 0

// Déclencher le téléchargement pour vérifier le ZIP
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url; a.download = 'test.kzo'; a.click();
```

Ouvrir le fichier `.kzo` téléchargé avec 7-Zip ou WinRAR — vérifier : `inspection.json` présent, dossier `photos/` présent si des photos existent.

- [ ] **Étape 6 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add storage.js
git commit -m "feat: storage.js — exportKZO() et importKZO() avec JSZip"
```

---

## Task 4 : migrateLegacy()

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/storage.js`

- [ ] **Étape 1 — Ajouter migrateLegacy()**

Juste avant `return { ... }`, ajouter :

```js
    async function migrateLegacy() {
        const raw = localStorage.getItem('kzo_inspection_data');
        if (!raw) return false;
        try {
            const parsed = JSON.parse(raw);
            if (!parsed || !parsed.units) return false;
            const id = parsed.id || ('KZO-' + Date.now().toString().slice(-5));
            parsed.id = id;

            const existing = await loadProject(id);
            if (!existing) {
                await saveProject(id, parsed, undefined, 'en_cours');
                console.log('[KZOStorage] Migration localStorage → IndexedDB :', id);
            }
            return id;
        } catch (e) {
            console.warn('[KZOStorage] migrateLegacy failed:', e);
            return false;
        }
    }
```

- [ ] **Étape 2 — Mettre à jour le return**

```js
    return { openDB, listProjects, saveProject, loadProject, deleteProject, exportKZO, importKZO, migrateLegacy };
```

- [ ] **Étape 3 — Vérifier dans le navigateur**

Dans la console (avec une inspection active en localStorage) :

```js
const id = await KZOStorage.migrateLegacy();
console.log('Migré:', id); // → "KZO-XXXXX"

const p = await KZOStorage.loadProject(id);
console.log('clientName après migration:', p.clientName);
```

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add storage.js
git commit -m "feat: storage.js — migrateLegacy() depuis kzo_inspection_data localStorage"
```
