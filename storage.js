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
                _db.onversionchange = () => _db.close();
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
