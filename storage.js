// storage.js — KZOStorage : IndexedDB wrapper pour KZO InspectPro
// Expose window.KZOStorage (IIFE singleton)
// DB: kzo_inspectpro_db v1 — stores: projects
window.KZOStorage = (function () {
    const DB_NAME = 'kzo_inspectpro_db';
    const DB_VERSION = 1;
    let _db = null;
    let _dbPromise = null;

    function openDB() {
        if (_db) return Promise.resolve(_db);
        if (_dbPromise) return _dbPromise;
        _dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('projects')) {
                    db.createObjectStore('projects', { keyPath: 'id' });
                }
            };
            req.onsuccess = (e) => {
                _db = e.target.result;
                _db.onversionchange = () => { _db.close(); _db = null; _dbPromise = null; };
                resolve(_db);
            };
            req.onerror = (e) => { _dbPromise = null; reject(e.target.error); };
            req.onblocked = () => {
                console.warn('[KZOStorage] DB upgrade blocked — close other tabs.');
                reject(new Error('IndexedDB upgrade blocked'));
            };
        });
        return _dbPromise;
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

    // Extrait l'adresse depuis units[0].fieldStates
    function _address(data) {
        if (!data) return '';
        try {
            if (data.clientInfo && data.clientInfo.address) return data.clientInfo.address;
            const unit = data.units && data.units[0];
            return (unit && unit.fieldStates && unit.fieldStates['prop_address']) || '';
        } catch (e) { return ''; }
    }

    // Compte les sections avec au moins 1 checkbox cochée (exclut cover + admin)
    function _progress(data) {
        if (!data || !data.sections || !data.units) return 0;
        const unit = data.units.find(u => u.id === data.currentUnitId) || data.units[0];
        const states = (unit && unit.fieldStates) || {};
        let count = 0;
        data.sections.forEach(section => {
            if (section.isCoverPage || section.id === 's_admin') return;
            const hasChecked = (section.subSections || []).some(sub =>
                (sub.fields || []).some(f => f.type === 'checkbox' && states[f.id])
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
            tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
            const store = tx.objectStore('projects');
            const getReq = store.get(id);
            getReq.onerror = (e) => reject(e.target.error);
            getReq.onsuccess = (e) => {
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

    // Extrait toutes les photos de data.units[n].sectionPhotos
    function _extractPhotos(data) {
        const photos = [];
        if (!data || !data.units) return photos;
        data.units.forEach(unit => {
            const store = unit.sectionPhotos || {};
            Object.entries(store).forEach(([subId, arr]) => {
                (arr || []).forEach((photo, i) => {
                    if (photo && photo.url) {
                        photos.push({ subId, unitId: unit.id, url: photo.url, index: i, caption: photo.caption || '' });
                    }
                });
            });
        });
        return photos;
    }

    async function exportKZO(projectId) {
        if (typeof JSZip === 'undefined') throw new Error('JSZip non chargé');
        const project = await loadProject(projectId);
        if (!project) throw new Error('Projet introuvable : ' + projectId);

        const zip = new JSZip();
        const photos = _extractPhotos(project.data);

        // Strip photos avant deep copy pour éviter de sérialiser les blobs base64
        const dataStripped = Object.assign({}, project.data, {
            units: (project.data.units || []).map(u => Object.assign({}, u, { sectionPhotos: {} }))
        });
        const dataForJson = JSON.parse(JSON.stringify(dataStripped));

        const photoIndex = photos.map(p => ({
            subId: p.subId,
            unitId: p.unitId,
            index: p.index,
            file: 'photos/' + p.unitId + '_' + p.subId + '_' + p.index + '.jpg',
            caption: p.caption
        }));

        photos.forEach(p => {
            const filename = 'photos/' + p.unitId + '_' + p.subId + '_' + p.index + '.jpg';
            const base64 = p.url.includes(',') ? p.url.split(',')[1] : p.url;
            zip.file(filename, base64, { base64: true });
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

    async function importKZO(file) {
        if (typeof JSZip === 'undefined') throw new Error('JSZip non chargé');

        let zip;
        try {
            zip = await JSZip.loadAsync(file);
        } catch (e) {
            throw new Error('Fichier .kzo invalide — archive ZIP corrompue');
        }

        const jsonFile = zip.file('inspection.json');
        if (!jsonFile) throw new Error('Fichier .kzo invalide — inspection.json manquant');

        const jsonStr = await jsonFile.async('string');
        let inspection;
        try {
            inspection = JSON.parse(jsonStr);
        } catch (e) {
            throw new Error('Fichier .kzo invalide — JSON malformé');
        }

        if (!inspection.version || !inspection.data || !inspection.project) {
            throw new Error('Fichier .kzo invalide — structure incorrecte');
        }

        // Reconstruire les photos dans data.units[n].sectionPhotos
        const data = inspection.data;
        (data.units || []).forEach(unit => { unit.sectionPhotos = {}; });

        // Assainir les URLs sensibles du clientInfo (provenant d'un JSON non validé)
        if (data.clientInfo) {
            const _safeUrl = u => (typeof u === 'string' && (u.startsWith('data:image/') || u.startsWith('blob:'))) ? u : null;
            data.clientInfo.coverPhotoUrl      = _safeUrl(data.clientInfo.coverPhotoUrl);
            data.clientInfo.signatureUrl       = _safeUrl(data.clientInfo.signatureUrl);
            data.clientInfo.sealUrl            = _safeUrl(data.clientInfo.sealUrl);
            data.clientInfo.clientSignatureUrl = _safeUrl(data.clientInfo.clientSignatureUrl);
        }

        for (const entry of (inspection.photoIndex || [])) {
            const zipEntry = zip.file(entry.file);
            if (!zipEntry) continue;
            const base64 = await zipEntry.async('base64');
            const unit = (data.units || []).find(u => u.id === entry.unitId);
            if (!unit) continue;
            if (!unit.sectionPhotos[entry.subId]) unit.sectionPhotos[entry.subId] = [];
            unit.sectionPhotos[entry.subId][entry.index] = {
                url: 'data:image/jpeg;base64,' + base64,
                caption: entry.caption || ''
            };
        }

        const projectId = inspection.project.id;

        // Vérifier si un projet existant a le même ID
        const existing = await loadProject(projectId);
        if (existing) {
            const msg = 'Un projet "' + existing.clientName + '" (' + projectId + ') existe déjà.\nÉcraser avec le fichier importé ?';
            const overwrite = window._confirmModal
                ? await window._confirmModal(msg)
                : confirm(msg);
            if (!overwrite) return null;
        }

        await saveProject(projectId, data, undefined, inspection.project.status || 'en_cours');
        return projectId;
    }

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
                localStorage.removeItem('kzo_inspection_data');
                console.log('[KZOStorage] Migration localStorage → IndexedDB :', id);
            }
            return id;
        } catch (e) {
            console.warn('[KZOStorage] migrateLegacy failed:', e);
            return false;
        }
    }

    return { openDB, listProjects, saveProject, loadProject, deleteProject, exportKZO, importKZO, migrateLegacy };
})();
