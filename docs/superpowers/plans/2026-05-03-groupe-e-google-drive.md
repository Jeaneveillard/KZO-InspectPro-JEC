# Groupe E — Google Drive + Sheets Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** At report generation, automatically sync all inspection photos + report HTML to a structured Google Drive hierarchy and send a full row (including Drive link) to the Google Sheets master webhook.

**Architecture:** A new `google_drive.js` module (`window.GoogleDrive`) handles all OAuth, Drive API calls, Sheets webhook, and offline queuing. The existing `generateFinalReport()` in `app.js` delegates everything to `GoogleDrive.syncInspection()` — the current Sheets webhook block is removed from `app.js` and absorbed into the new module. `inspectionData` is a global defined in `data.js` and is directly accessible in `google_drive.js`.

**Tech Stack:** Google Identity Services (GIS) for OAuth 2.0 implicit grant, Google Drive REST API v3 (multipart upload), existing Apps Script webhook for Sheets, vanilla JS, no new external libraries.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `google_drive.js` | **Create** | Auth, Drive API, syncInspection, Sheets webhook, offline queue, indicator |
| `config.js` | **Modify** | Add `GOOGLE_DRIVE_CLIENT_ID: ''` |
| `KZO_Inspect.html` | **Modify** | CSP update, GIS script tag, google_drive.js tag, sync indicator in top-bar |
| `app.js` | **Modify** | Remove Sheets block from `generateFinalReport()`, add Drive sync call + init |
| `sw.js` | **Modify** | Bump CACHE_NAME v22→v23, add `google_drive.js` to ASSETS |

---

## Context for implementers

**`inspectionData` global** (defined in `data.js`, not `app.js`):
- `inspectionData.clientInfo.name` — client full name
- `inspectionData.clientInfo.address` — property address
- `inspectionData.clientInfo.inspectorName` — inspector name
- `inspectionData['inspection_date']` — raw ISO date string
- `inspectionData.sections` — array of section definitions (each has `subSections[].fields[]`)
- `inspectionData.units` — array of `{ id, name, fieldStates, sectionPhotos }` units
- `inspectionData.currentUnitId` — ID of active unit
- `unit.sectionPhotos[subSectionId]` — array of `{ url: dataUrl, caption, originalUrl }`
- `unit.fieldStates['inspection_code']` — inspection code (e.g. `KZO-48291`)

**Current `generateFinalReport()` in `app.js`** (lines ~2869–2998):
- Lines 2869–2888: validation + HTML build + modal open — **keep as-is**
- Lines 2889–2982: `// --- SYNCHRONISATION GOOGLE SHEETS ---` block — **remove entirely**
- Lines 2983–2997: button handlers + IndexedDB save — **keep as-is**

**Top-bar in `KZO_Inspect.html`** (around line 75–92): contains buttons `saveQuitBtn`, `exportKzoBtn`, `assistantBtn`, `iaRapportBtn`. Sync indicator goes **after** `iaRapportBtn`.

**CSP** (line 6 of `KZO_Inspect.html`) — current `connect-src` does not include `https://www.googleapis.com` or `https://accounts.google.com`. Must be updated.

---

### Task 1: Config + HTML scaffolding

**Files:**
- Modify: `config.js`
- Modify: `KZO_Inspect.html`

- [ ] **Step 1: Add `GOOGLE_DRIVE_CLIENT_ID` to `config.js`**

Replace the existing `KZO_CONFIG` object (currently 4 lines) with:

```js
const KZO_CONFIG = {
    provider: 'gemini',
    apiKey: '',
    SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycby6XAR9XXWCFMqFAiyF7bjK5RQZxkoclv7KLVuDwJrW2YiNzeVlHr11pfnk3U7l_Nrv/exec',
    GOOGLE_DRIVE_CLIENT_ID: '' // À remplir : Google Cloud Console → OAuth 2.0 Client ID
};
```

- [ ] **Step 2: Update CSP in `KZO_Inspect.html` line 6**

Find the `<meta http-equiv="Content-Security-Policy" ...>` tag (line 6) and replace its `content` attribute value with:

```
default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' blob: data: https://images.unsplash.com https://maps.googleapis.com; connect-src https://generativelanguage.googleapis.com https://api.openai.com https://api.anthropic.com https://api.groq.com https://oauth2.googleapis.com https://www.googleapis.com https://accounts.google.com https://script.google.com; frame-src https://www.google.com https://accounts.google.com;
```

- [ ] **Step 3: Add GIS script tag to `KZO_Inspect.html`**

Just before the existing `<script src="jszip.min.js">` (currently around line 264), add:

```html
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <script src="google_drive.js?v=1"></script>
```

- [ ] **Step 4: Add sync indicator to top-bar in `KZO_Inspect.html`**

The top-bar currently ends with `iaRapportBtn` around line 91. After the `</button>` closing tag of `iaRapportBtn`, add:

```html
                <span id="driveSyncIndicator" title="Non synchronisé avec Google Drive" style="cursor:pointer;font-size:1.1rem;margin-left:8px;color:#64748b;" onclick="window.GoogleDrive && GoogleDrive.retrySync()">☁️</span>
```

- [ ] **Step 5: Open `KZO_Inspect.html` in a browser and verify**

Open the app (e.g. `http://localhost:8000/KZO_Inspect.html?project=test`). Expected:
- No console errors about CSP violations
- The ☁️ icon appears to the right of the "📄 IA Rapport" button in the top-bar
- Console warning: `[GoogleDrive] GOOGLE_DRIVE_CLIENT_ID not configured` (expected — no client ID yet)

- [ ] **Step 6: Commit**

```bash
git add config.js KZO_Inspect.html
git commit -m "feat(groupe-e): config + HTML scaffolding — CSP, GIS, indicator"
```

---

### Task 2: Create `google_drive.js`

**Files:**
- Create: `google_drive.js`

- [ ] **Step 1: Create `google_drive.js` with the complete module**

Create `C:/Users/jeane/Desktop/Amboul/JEC/google_drive.js` with this exact content:

```js
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
                    localStorage.setItem(TOKEN_KEY, response.access_token);
                    localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + (response.expires_in - 60) * 1000));
                    if (_resolveAuth) _resolveAuth();
                }
                _resolveAuth = null;
                _rejectAuth  = null;
            }
        });
        window.addEventListener('online', _drainQueue);
    }

    function isAuthenticated() {
        const token  = localStorage.getItem(TOKEN_KEY);
        const expiry = parseInt(localStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
        return !!token && Date.now() < expiry;
    }

    function _getToken() {
        return localStorage.getItem(TOKEN_KEY) || '';
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
        const reportBlob = new Blob([reportEl.innerHTML], { type: 'text/html;charset=utf-8' });
        syncInspection(projectId, reportBlob);
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
        const meta    = JSON.stringify({ name: name, parents: [parentId] });
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

    async function _uploadAll(projectId, reportBlob, inspData) {
        // Create folder hierarchy
        const kzoFolderId    = await _findOrCreateFolder(ROOT_FOLDER, 'root');
        const clientName     = (inspData.clientInfo && inspData.clientInfo.name) || 'Client Inconnu';
        const clientFolderId = await _findOrCreateFolder(clientName, kzoFolderId);

        const activeUnit   = (inspData.units || []).find(function (u) { return u.id === inspData.currentUnitId; })
                            || (inspData.units || [])[0]
                            || { fieldStates: {} };
        const fieldStates  = activeUnit.fieldStates || {};
        const inspCode     = fieldStates['inspection_code'] || projectId || ('KZO-' + Date.now().toString().slice(-5));
        const rawDate      = (inspData['inspection_date'] || new Date().toISOString()).split('T')[0];
        const inspFolderName = inspCode + ' — ' + rawDate; // em dash
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

    function _buildSheetsPayload(projectId, inspData) {
        function _v(id) {
            const el = document.getElementById(id);
            return el ? (el.value || '') : '';
        }

        const clientName    = (inspData.clientInfo && inspData.clientInfo.name) || '';
        const address       = (inspData.clientInfo && inspData.clientInfo.address) || '';
        const inspectorName = (inspData.clientInfo && inspData.clientInfo.inspectorName)
            || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.inspectorName : '');
        const clientPhone   = (inspData.clientInfo && inspData.clientInfo.phone) || '';

        const rawDate       = inspData['inspection_date'] || new Date().toISOString();
        const dateInspection = new Date(rawDate).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });

        const prix        = _v('prix_inspection') || '500';
        const norme       = _v('norme_pratique')  || 'BNQ 3009-500 (RBQ)';
        const prixNum     = parseFloat(prix) || 0;
        const tps         = prixNum * 0.05;
        const tvq         = prixNum * 0.09975;
        const total       = prixNum + tps + tvq;

        const activeUnit  = (inspData.units || []).find(function (u) { return u.id === inspData.currentUnitId; })
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
            date_rapport:        new Date().toLocaleDateString('fr-CA'),
            date_inspection:     dateInspection,
            facture_id:          projectId,
            numero_dossier:      inspCode,
            client:              clientName,
            telephone:           clientPhone,
            adresse_propriete:   address,
            type_batiment:       _v('prop_type'),
            annee_construction:  _v('prop_year'),
            superficie:          _v('prop_area'),
            type_garage:         _v('prop_garage'),
            meteo:               _v('prop_weather'),
            temperature:         _v('prop_temp'),
            inspecteur:          inspectorName,
            entreprise:          (window.AppCompanyProfile && window.AppCompanyProfile.name) ? window.AppCompanyProfile.name : 'KZO InspectPro',
            norme_applicable:    norme,
            defauts_urgents:     totalUrgents,
            defauts_majeurs:     totalMajeurs,
            a_surveiller:        totalSurveiller,
            conformes:           totalConformes,
            etat_general:        _v('rap_etat_general') || 'Non évalué',
            prix_ht:             prix,
            montant_facture:     prix,
            tps:                 tps.toFixed(2),
            tvq:                 tvq.toFixed(2),
            total:               total.toFixed(2),
            travaux_prioritaires: _v('rap_priorite'),
            notes_inspecteur:    _v('rap_notes')
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
        localStorage.setItem(QUEUE_KEY, '[]');
        for (let i = 0; i < queue.length; i++) {
            const projectId = queue[i];
            if (projectId !== window.currentProjectId) continue;
            const reportEl = document.getElementById('reportContent');
            if (!reportEl || !reportEl.innerHTML) continue;
            const reportBlob = new Blob([reportEl.innerHTML], { type: 'text/html;charset=utf-8' });
            await syncInspection(projectId, reportBlob);
        }
    }

    // -------------------------------------------------------------------------
    // Main sync
    // -------------------------------------------------------------------------

    async function syncInspection(projectId, reportBlob) {
        if (!projectId) return;
        const inspData   = window.inspectionData;
        if (!inspData) return;

        const webhookUrl = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG.SHEETS_WEBHOOK_URL : '';
        const clientId   = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG.GOOGLE_DRIVE_CLIENT_ID : '';
        const payload    = _buildSheetsPayload(projectId, inspData);

        if (!clientId) {
            // Drive non configuré — envoyer uniquement le webhook Sheets
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
            const folderUrl = await _uploadAll(projectId, reportBlob, inspData);
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
        init:                 init,
        isAuthenticated:      isAuthenticated,
        authenticate:         authenticate,
        getSyncStatus:        getSyncStatus,
        updateSyncIndicator:  updateSyncIndicator,
        retrySync:            retrySync,
        syncInspection:       syncInspection
    };

})();
```

- [ ] **Step 2: Verify file created with no syntax errors**

Open `KZO_Inspect.html` in browser. Expected console output:
- `[GoogleDrive] GOOGLE_DRIVE_CLIENT_ID non configuré dans config.js` (warning — expected)
- No `SyntaxError` or `ReferenceError`

If you see `Uncaught SyntaxError`, open the browser DevTools Sources tab, navigate to `google_drive.js`, and find the error line.

- [ ] **Step 3: Commit**

```bash
git add google_drive.js
git commit -m "feat(groupe-e): google_drive.js — OAuth, Drive upload, Sheets webhook, queue offline"
```

---

### Task 3: `app.js` integration

**Files:**
- Modify: `app.js`

**Context:** The Sheets webhook block in `generateFinalReport()` begins at line ~2889 with the comment `// --- SYNCHRONISATION GOOGLE SHEETS ---` and ends at line ~2982 with the closing `}` of `} else { console.log(...) }`. All variables declared in this block (`targetUnit`, `prixElement`, `prix`, `normeElement`, `norme`, `inspectorName`, `dateInspection`, `meteo`, `temperature`, `superficie`, `annee`, `typeBatiment`, `typeGarage`, `unitFieldStates`, `totalUrgents`, etc.) are **not used** after this block, so the block can be safely removed entirely.

- [ ] **Step 1: Remove Sheets webhook block from `generateFinalReport()`**

In `app.js`, find and remove the entire block from:

```js
        // --- SYNCHRONISATION GOOGLE SHEETS ---
        // Envoie les données de l'inspection vers Google Sheets pour archivage
        const targetUnit = unitId
```

through the end of this block:

```js
        } else {
            console.log("ℹ️ Aucune URL Google Sheets configurée dans config.js");
        }
```

Replace that entire removed block with:

```js
        // Drive sync + Sheets webhook (délégué à google_drive.js)
        if (typeof GoogleDrive !== 'undefined') {
            const reportBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
            GoogleDrive.syncInspection(window.currentProjectId, reportBlob);
        }
```

- [ ] **Step 2: Verify `generateFinalReport()` structure is intact**

After the edit, the function should look like this (abbreviated):

```js
function generateFinalReport(unitId) {
    if (typeof BOILERPLATE === 'undefined') { ... return; }

    const clientName = ...; const address = ...;
    if (!clientName || !address) { showToast(...); return; }

    const html = _buildReportHTML(unitId);
    const reportModal = document.getElementById('reportModal');
    const reportContent = document.getElementById('reportContent');
    reportContent.innerHTML = html;
    reportModal.style.display = 'flex';

    // Drive sync + Sheets webhook (délégué à google_drive.js)
    if (typeof GoogleDrive !== 'undefined') {
        const reportBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
        GoogleDrive.syncInspection(window.currentProjectId, reportBlob);
    }

    document.getElementById('closeReportBtn').onclick = () => { reportModal.style.display = 'none'; };
    document.getElementById('printReportBtn').onclick = () => { setTimeout(() => window.print(), 500); };

    if (window.currentProjectId && window.KZOStorage) {
        const snapshot = { ... };
        KZOStorage.saveProject(...).catch(...);
    }
}
```

- [ ] **Step 3: Add `GoogleDrive.init()` and `updateSyncIndicator()` to startup**

In `app.js`, find the startup section after `renderSection(0)` (around line 3125):

```js
    renderNavigation();
    renderSection(0);
    renderUnitTabs(); // Afficher la barre d'unités si applicable
```

After `renderUnitTabs();`, add:

```js
    // Init Google Drive module + afficher statut sync
    if (typeof GoogleDrive !== 'undefined') {
        GoogleDrive.init();
        GoogleDrive.updateSyncIndicator(window.currentProjectId);
    }
```

- [ ] **Step 4: Verify in browser**

Open `KZO_Inspect.html?project=test&new=1` in browser.

Expected:
- No console errors (only the `[GoogleDrive] GOOGLE_DRIVE_CLIENT_ID non configuré` warning)
- ☁️ indicator visible in top-bar
- Navigate to section 13 (Rapport Final), click "Générer le rapport complet"
- Report modal opens normally
- If `GOOGLE_DRIVE_CLIENT_ID` is empty: console shows `[GoogleDrive]` path, Sheets webhook fires silently (no Drive upload)
- No regression on existing features

- [ ] **Step 5: Commit**

```bash
git add app.js
git commit -m "feat(groupe-e): intégration Drive sync dans generateFinalReport + init au démarrage"
```

---

### Task 4: Service worker + version bumps

**Files:**
- Modify: `sw.js`
- Modify: `KZO_Inspect.html`

- [ ] **Step 1: Bump CACHE_NAME and add `google_drive.js` to ASSETS in `sw.js`**

In `sw.js`:

Change line 1:
```js
const CACHE_NAME = 'kzo-inspect-v22';
```
to:
```js
const CACHE_NAME = 'kzo-inspect-v23';
```

Add `'google_drive.js'` to the ASSETS array, just before the closing comment about config.js:

```js
const ASSETS = [
  '/',
  'index.html',
  'KZO_Inspect.html',
  'style.css',
  'app.js',
  'data.js',
  'ai_agents.js',
  'boilerplate.js',
  'templates.js',
  'house_bg.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.json',
  'storage.js',
  'jszip.min.js',
  'google_drive.js'
  // config.js exclu intentionnellement : contient des clés API sensibles
];
```

- [ ] **Step 2: Bump `app.js` version in `KZO_Inspect.html`**

In `KZO_Inspect.html`, find:
```html
    <script src="app.js?v=21"></script>
```
Change to:
```html
    <script src="app.js?v=22"></script>
```

- [ ] **Step 3: Verify no console 404 errors**

Open `KZO_Inspect.html` in browser, hard-refresh (Ctrl+Shift+R). Expected:
- No 404 for `google_drive.js`
- Service worker console: `KZO InspectPro : mode hors ligne actif`
- All resources loaded successfully

- [ ] **Step 4: Commit**

```bash
git add sw.js KZO_Inspect.html
git commit -m "chore: bump cache v23, app.js v22, ajouter google_drive.js au service worker"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|-----------------|------|
| Google Identity Services OAuth 2.0 | Task 2 — `init()`, `authenticate()` |
| Token stored in localStorage | Task 2 — `TOKEN_KEY`, `TOKEN_EXPIRY_KEY` |
| Dossier `KZO InspectPro` → client → inspection | Task 2 — `_uploadAll()` |
| Sous-dossier `{Code} — {Date}` | Task 2 — `inspFolderName` |
| Sous-dossier `photos/` | Task 2 — `_findOrCreateFolder('photos', ...)` |
| Upload photos une par une | Task 2 — sequential loop in `_uploadAll()` |
| Upload rapport | Task 2 — `_uploadFile('rapport_' + inspCode + '.html', ...)` |
| Webhook Google Sheets avec Lien Drive | Task 2 — `payload.drive_link = folderUrl` |
| Colonnes TPS/TVQ/Total dans Sheets | Task 2 — `_buildSheetsPayload()` |
| Mode hors-ligne → queue pending | Task 2 — `_enqueue()`, `_drainQueue()` |
| Toast offline | Task 2 — `showToast('⏳ Rapport généré...')` |
| Toast succès | Task 2 — `showToast('✅ Synchronisé...')` |
| Toast erreur + retry | Task 2 — `retrySync()` |
| Indicateur ☁️/⏳/✅/❌ dans top-bar | Task 1 (HTML) + Task 2 (`updateSyncIndicator`) |
| Déclencheur : génération rapport | Task 3 — `syncInspection()` appelé dans `generateFinalReport()` |
| GOOGLE_DRIVE_CLIENT_ID dans config.js | Task 1 |
| CSP mise à jour | Task 1 |
| sw.js bump cache | Task 4 |
| google_drive.js chargé dans HTML | Task 1 |

All requirements covered. No gaps found.

### Placeholder scan

No TBD, TODO, or incomplete steps found. All code blocks contain complete implementations.

### Type consistency

- `syncInspection(projectId, reportBlob)` — consistent across Task 2 (definition) and Task 3 (call)
- `updateSyncIndicator(projectId)` — consistent across Task 2 (definition) and Task 3 (call)
- `GoogleDrive.init()` — consistent across Task 2 (defined in public API) and Task 3 (called)
- `_buildSheetsPayload(projectId, inspData)` — called internally only in `syncInspection()`
- `_uploadAll(projectId, reportBlob, inspData)` — called internally only in `syncInspection()`
