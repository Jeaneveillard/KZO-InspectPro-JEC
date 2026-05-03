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

    return { openDB };
})();
