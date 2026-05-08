// google_drive.js — KZO InspectPro
// Gestion Google Drive : OAuth, upload photos + rapport, Sheets webhook, queue offline
// API publique : window.GoogleDrive

(function () {
    'use strict';

    const TOKEN_KEY        = 'kzo_drive_token';
    const TOKEN_EXPIRY_KEY = 'kzo_drive_token_expiry';
    const STATUS_PREFIX    = 'kzo_drive_sync_';
    const QUEUE_KEY        = 'kzo_drive_queue';
    const ROOT_FOLDER      = 'KZO InspectPro';
    const DRIVE_API        = 'https://www.googleapis.com/drive/v3';
    const UPLOAD_API       = 'https://www.googleapis.com/upload/drive/v3';

    let _lastSyncUrl  = '';
    let _tokenClient  = null;
    let _resolveAuth  = null;
    let _rejectAuth   = null;

    // -------------------------------------------------------------------------
    // Auth
    // -------------------------------------------------------------------------

    function init() {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
            console.warn('[GoogleDrive] GIS non chargé — sync Drive désactivé');
            return;
        }
        const clientId = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG.GOOGLE_DRIVE_CLIENT_ID : '';
        if (!clientId) {
            console.warn('[GoogleDrive] GOOGLE_DRIVE_CLIENT_ID non configuré dans config.js');
            return;
        }
        _tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (response) => {
                if (response.error) {
                    if (_rejectAuth) _rejectAuth(new Error(response.error));
                } else {
                    // Token en sessionStorage (pas localStorage) : disparaît à la fermeture du navigateur
                    sessionStorage.setItem(TOKEN_KEY, response.access_token);
                    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + (response.expires_in - 60) * 1000));
                    if (_resolveAuth) _resolveAuth();
                }
                _resolveAuth = null;
                _rejectAuth  = null;
            }
        });
        window.addEventListener('online', _drainQueue);
    }

    function isAuthenticated() {
        const token  = sessionStorage.getItem(TOKEN_KEY);
        const expiry = parseInt(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
        return !!token && Date.now() < expiry;
    }

    function _getToken() {
        return sessionStorage.getItem(TOKEN_KEY) || '';
    }

    function authenticate() {
        if (isAuthenticated()) return Promise.resolve();
        if (!_tokenClient) return Promise.reject(new Error('[GoogleDrive] Non initialisé — configurez GOOGLE_DRIVE_CLIENT_ID'));
        return new Promise((resolve, reject) => {
            _resolveAuth = resolve;
            _rejectAuth  = reject;
            _tokenClient.requestAccessToken({ prompt: '' });
        });
    }

    // -------------------------------------------------------------------------
    // Status + indicator
    // -------------------------------------------------------------------------

    function getSyncStatus(projectId) {
        return localStorage.getItem(STATUS_PREFIX + projectId) || 'not_synced';
    }

    function _setStatus(projectId, status) {
        localStorage.setItem(STATUS_PREFIX + projectId, status);
    }

    function updateSyncIndicator(projectId) {
        const el  = document.getElementById('driveSyncIndicator');
        if (!el) return;
        const pid = projectId || window.currentProjectId;
        if (!pid) return;
        const status = getSyncStatus(pid);
        const MAP = {
            not_synced: { icon: '☁️',  color: '#64748b', title: 'Non synchronisé avec Google Drive' },
            syncing:    { icon: '⏳',  color: '#3b82f6', title: 'Upload en cours...' },
            synced:     { icon: '✅',  color: '#22c55e', title: 'Synchronisé vers Google Drive' },
            error:      { icon: '❌',  color: '#ef4444', title: 'Erreur sync Drive — cliquez pour réessayer' },
            pending:    { icon: '⏳',  color: '#f59e0b', title: 'En attente de connexion internet' }
        };
        const s = MAP[status] || MAP.not_synced;
        el.textContent = s.icon;
        el.style.color  = s.color;
        el.title        = s.title;
    }

    function retrySync() {
        const projectId = window.currentProjectId;
        if (!projectId) return;
        if (getSyncStatus(projectId) !== 'error') return;
        const reportEl = document.getElementById('reportContent');
        if (!reportEl || !reportEl.innerHTML) {
            if (typeof showToast === 'function') showToast('Générez d\'abord le rapport avant de resynchroniser.', 'warning');
            return;
        }
        const unitId = (window.inspectionData && window.inspectionData.currentUnitId) || undefined;
        const reportBlob = new Blob([reportEl.innerHTML], { type: 'text/html;charset=utf-8' });
        syncInspection(projectId, reportBlob, unitId);
    }

    // -------------------------------------------------------------------------
    // Drive API primitives
    // -------------------------------------------------------------------------

    async function _driveRequest(method, path, opts) {
        opts = opts || {};
        const headers = Object.assign({ 'Authorization': 'Bearer ' + _getToken() }, opts.headers || {});
        const res = await fetch(DRIVE_API + path, { method, headers, body: opts.body });
        if (!res.ok) {
            const text = await res.text();
            throw new Error('[GoogleDrive] Drive API ' + res.status + ': ' + text);
        }
        if (res.status === 204) return null;
        return res.json();
    }

    async function _findOrCreateFolder(name, parentId) {
        const escaped = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const q = "name='" + escaped + "' and mimeType='application/vnd.google-apps.folder' and '" + parentId + "' in parents and trashed=false";
        const data = await _driveRequest('GET', '/files?q=' + encodeURIComponent(q) + '&fields=files(id)');
        if (data && data.files && data.files.length > 0) return data.files[0].id;
        const meta = { name: name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
        const created = await _driveRequest('POST', '/files', {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(meta)
        });
        return created.id;
    }

    async function _uploadFile(name, mimeType, blob, parentId) {
        const meta    = JSON.stringify({ name: name, mimeType: mimeType, parents: [parentId] });
        const body    = new FormData();
        body.append('metadata', new Blob([meta], { type: 'application/json' }));
        body.append('file', blob);
        const res = await fetch(UPLOAD_API + '/files?uploadType=multipart&fields=id,webViewLink', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + _getToken() },
            body: body
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error('[GoogleDrive] Upload échoué ' + res.status + ': ' + text);
        }
        return res.json();
    }

    function _dataUrlToBlob(dataUrl) {
        const parts = dataUrl.split(',');
        const mime  = parts[0].match(/:(.*?);/)[1];
        const bytes = atob(parts[1]);
        const buf   = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
        return new Blob([buf], { type: mime });
    }

    // -------------------------------------------------------------------------
    // Upload orchestration
    // -------------------------------------------------------------------------

    async function _uploadAll(projectId, reportBlob, inspData, unitId) {
        // Create folder hierarchy
        const kzoFolderId    = await _findOrCreateFolder(ROOT_FOLDER, 'root');
        const clientName     = (inspData.clientInfo && inspData.clientInfo.name) || 'Client Inconnu';
        const clientFolderId = await _findOrCreateFolder(clientName, kzoFolderId);

        const activeUnit   = (unitId ? (inspData.units || []).find(function (u) { return u.id === unitId; }) : null)
                           || (inspData.units || []).find(function (u) { return u.id === inspData.currentUnitId; })
                           || (inspData.units || [])[0]
                           || { fieldStates: {} };
        const fieldStates  = activeUnit.fieldStates || {};
        const inspCode     = fieldStates['inspection_code'] || projectId || ('KZO-' + Date.now().toString().slice(-5));
        const rawDate      = (inspData['inspection_date'] || new Date().toISOString()).split('T')[0];
        const inspFolderName = inspCode + ' — ' + rawDate;
        const inspFolderId = await _findOrCreateFolder(inspFolderName, clientFolderId);

        // Get folder web URL for Sheets
        const folderMeta = await _driveRequest('GET', '/files/' + inspFolderId + '?fields=webViewLink');
        const folderUrl  = (folderMeta && folderMeta.webViewLink) ? folderMeta.webViewLink : '';

        // Create photos sub-folder
        const photosFolderId = await _findOrCreateFolder('photos', inspFolderId);

        // Upload photos from all units (sequential — resilient to interruption)
        for (let u = 0; u < (inspData.units || []).length; u++) {
            const unit = inspData.units[u];
            const sectionPhotos = unit.sectionPhotos || {};
            const subIds = Object.keys(sectionPhotos);
            for (let s = 0; s < subIds.length; s++) {
                const subId = subIds[s];
                const photos = sectionPhotos[subId] || [];
                for (let i = 0; i < photos.length; i++) {
                    const photoObj = photos[i];
                    if (!photoObj.url || photoObj.url.indexOf('data:') !== 0) continue;
                    const blob = _dataUrlToBlob(photoObj.url);
                    const ext  = blob.type.indexOf('png') !== -1 ? 'png' : 'jpg';
                    await _uploadFile('photo_' + subId + '_' + i + '.' + ext, blob.type, blob, photosFolderId);
                }
            }
        }

        // Upload report HTML
        await _uploadFile('rapport_' + inspCode + '.html', 'text/html', reportBlob, inspFolderId);

        return folderUrl;
    }

    // -------------------------------------------------------------------------
    // Sheets webhook
    // -------------------------------------------------------------------------

    function _buildSheetsPayload(projectId, inspData, unitId) {
        function _v(id) {
            const el = document.getElementById(id);
            return el ? (el.value || '') : '';
        }

        const clientName    = (inspData.clientInfo && inspData.clientInfo.name) || '';
        const address       = (inspData.clientInfo && inspData.clientInfo.address) || '';
        const inspectorName = (inspData.clientInfo && inspData.clientInfo.inspectorName)
            || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.inspectorName : '');
        const clientPhone   = (inspData.clientInfo && inspData.clientInfo.phone) || '';

        const rawDate        = inspData['inspection_date'] || new Date().toISOString();
        const dateInspection = new Date(rawDate).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });

        const prix    = _v('prix_inspection') || '500';
        const norme   = _v('norme_pratique')  || 'BNQ 3009-500 (RBQ)';
        const prixNum = parseFloat(prix) || 0;
        const tps     = prixNum * 0.05;
        const tvq     = prixNum * 0.09975;
        const total   = prixNum + tps + tvq;

        const activeUnit  = (unitId ? (inspData.units || []).find(function (u) { return u.id === unitId; }) : null)
                          || (inspData.units || []).find(function (u) { return u.id === inspData.currentUnitId; })
                          || (inspData.units || [])[0]
                          || { fieldStates: {} };
        const fieldStates = activeUnit.fieldStates || {};
        const inspCode    = fieldStates['inspection_code'] || projectId || '';

        let totalUrgents = 0, totalMajeurs = 0, totalSurveiller = 0, totalConformes = 0;
        (inspData.sections || []).forEach(function (section) {
            if (['s_cover', 's_admin', 's_rapport', 's_preview'].indexOf(section.id) !== -1) return;
            (section.subSections || []).forEach(function (sub) {
                (sub.fields || []).forEach(function (field) {
                    if (field.type !== 'checkbox') return;
                    const state = fieldStates[field.id];
                    if (state === 'defaut') {
                        if (typeof AIAgents !== 'undefined' && AIAgents.determineSeverity(field.label) === 'URGENT') totalUrgents++;
                        else totalMajeurs++;
                    } else if (state === 'surveiller') {
                        totalSurveiller++;
                    } else if (state === 'conforme') {
                        totalConformes++;
                    }
                });
            });
        });

        return {
            date_rapport:         new Date().toLocaleDateString('fr-CA'),
            date_inspection:      dateInspection,
            facture_id:           projectId,
            numero_dossier:       inspCode,
            client:               clientName,
            telephone:            clientPhone,
            adresse_propriete:    address,
            type_batiment:        _v('prop_type'),
            annee_construction:   _v('prop_year'),
            superficie:           _v('prop_area'),
            type_garage:          _v('prop_garage'),
            meteo:                _v('prop_weather'),
            temperature:          _v('prop_temp'),
            inspecteur:           inspectorName,
            entreprise:           (window.AppCompanyProfile && window.AppCompanyProfile.name) ? window.AppCompanyProfile.name : 'KZO InspectPro',
            norme_applicable:     norme,
            defauts_urgents:      totalUrgents,
            defauts_majeurs:      totalMajeurs,
            a_surveiller:         totalSurveiller,
            conformes:            totalConformes,
            etat_general:         _v('rap_etat_general') || 'Non évalué',
            prix_ht:              prix,
            montant_facture:      prix,
            tps:                  tps.toFixed(2),
            tvq:                  tvq.toFixed(2),
            total:                total.toFixed(2),
            travaux_prioritaires: _v('rap_priorite'),
            notes_inspecteur:     _v('rap_notes')
        };
    }

    function _sendSheetsWebhook(url, payload) {
        if (!url) return;
        fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(function (e) { console.warn('[GoogleDrive] Sheets webhook error:', e); });
    }

    // -------------------------------------------------------------------------
    // Offline queue
    // -------------------------------------------------------------------------

    function _enqueue(projectId) {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        if (queue.indexOf(projectId) === -1) queue.push(projectId);
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }

    async function _drainQueue() {
        const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
        if (queue.length === 0) return;
        for (let i = 0; i < queue.length; i++) {
            const projectId = queue[i];
            if (projectId !== window.currentProjectId) continue;
            const reportEl = document.getElementById('reportContent');
            if (!reportEl || !reportEl.innerHTML) continue;
            const reportBlob = new Blob([reportEl.innerHTML], { type: 'text/html;charset=utf-8' });
            await syncInspection(projectId, reportBlob);
            // Remove from queue only after sync attempt (success or user-visible error)
            const current = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
            localStorage.setItem(QUEUE_KEY, JSON.stringify(current.filter(function (id) { return id !== projectId; })));
        }
    }

    // -------------------------------------------------------------------------
    // Main sync
    // -------------------------------------------------------------------------

    async function syncInspection(projectId, reportBlob, unitId) {
        if (!projectId) return;
        const inspData   = window.inspectionData;
        if (!inspData) return;

        const webhookUrl = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG.SHEETS_WEBHOOK_URL : '';
        const clientId   = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG.GOOGLE_DRIVE_CLIENT_ID : '';
        const payload    = _buildSheetsPayload(projectId, inspData, unitId);

        if (!clientId) {
            _sendSheetsWebhook(webhookUrl, payload);
            return;
        }

        if (!navigator.onLine) {
            _enqueue(projectId);
            _setStatus(projectId, 'pending');
            updateSyncIndicator(projectId);
            if (typeof showToast === 'function') showToast('⏳ Rapport généré — sync Drive dès reconnexion', 'info');
            _sendSheetsWebhook(webhookUrl, payload);
            return;
        }

        _setStatus(projectId, 'syncing');
        updateSyncIndicator(projectId);

        try {
            await authenticate();
            const folderUrl = await _uploadAll(projectId, reportBlob, inspData, unitId);
            _lastSyncUrl = folderUrl;
            _setStatus(projectId, 'synced');
            updateSyncIndicator(projectId);
            if (typeof showToast === 'function') showToast('✅ Synchronisé vers Google Drive', 'success');
            payload.drive_link = folderUrl;
        } catch (err) {
            console.error('[GoogleDrive] Erreur syncInspection:', err);
            _setStatus(projectId, 'error');
            updateSyncIndicator(projectId);
            if (typeof showToast === 'function') showToast('❌ Erreur sync Drive — cliquez ☁️ pour réessayer', 'error');
        }

        _sendSheetsWebhook(webhookUrl, payload);
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    window.GoogleDrive = {
        init:                init,
        isAuthenticated:     isAuthenticated,
        authenticate:        authenticate,
        getSyncStatus:       getSyncStatus,
        updateSyncIndicator: updateSyncIndicator,
        retrySync:           retrySync,
        syncInspection:      syncInspection,
        getLastSyncUrl:      function() { return _lastSyncUrl; }
    };

})();
