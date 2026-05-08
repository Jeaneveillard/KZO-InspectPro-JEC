# Groupe G — Annotations Photo, Signature Électronique, Envoi PDF

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'outil crayon aux annotations photo, une signature électronique client (sur place et à distance), et un bouton d'envoi du rapport par email via Drive + EmailJS.

**Architecture:** Les annotations photo étendent `openAnnotationEditor` déjà dans `app.js`. La signature client utilise `signature_pad` via CDN stockée dans `inspectionData.clientInfo.clientSignatureUrl`. L'envoi email récupère le lien Drive exposé par `google_drive.js` et l'envoie via EmailJS.

**Tech Stack:** Canvas API (crayon), signature_pad@4 (CDN jsdelivr), EmailJS browser SDK v4 (déjà en place), Google Drive API (déjà en place).

---

## Contexte codebase

- `app.js:3228` — `openAnnotationEditor(photoObj, onSave)` : éditeur canvas existant avec Flèche, Cercle, Texte, Couleurs.
- `app.js:3366` — tableau des outils `[{id:'arrow',...},{id:'circle',...},{id:'text',...}]`.
- `app.js:3288` — `drawShape(ctx, s)` : dessin de chaque forme (à étendre pour `pen`).
- `app.js:1367–1410` — rendu galerie photos : bouton ✏️ déjà présent, badge annotation à ajouter.
- `app.js:2869` — `generateFinalReport(unitId)` : génère le HTML et ouvre la modale rapport.
- `app.js:2849` — appel `BOILERPLATE.attestation(...)` : bloc fin de rapport à étendre.
- `KZO_Inspect.html:246–247` — boutons `closeReportBtn` / `printReportBtn` : ajouter `sendReportBtn` ici.
- `google_drive.js:347` — `syncInspection(projectId, reportBlob, unitId)` : upload Drive + Sheets. Retourne void, mais utilise `folderUrl` en interne à la ligne 375.
- `config.js:11–14` — clés EmailJS déjà présentes (`EMAILJS_SERVICE_ID`, `EMAILJS_PUBLIC_KEY`). Ajouter `EMAILJS_RAPPORT_TEMPLATE_ID`.

---

## File Structure

| Fichier | Modifications |
|---------|--------------|
| `app.js` | Crayon tool, badge annotation, modal signature client, sendReportByEmail(), bloc signature PDF |
| `google_drive.js` | `_lastSyncUrl` + `getLastSyncUrl()` |
| `KZO_Inspect.html` | CDN signature_pad, bouton sendReportBtn, app.js?v=24 |
| `config.js` | `EMAILJS_RAPPORT_TEMPLATE_ID` |
| `sw.js` | Cache v25 |

---

## Task 1: Outil Crayon dans l'annotateur photo

**Files:**
- Modify: `app.js` (lignes ~3274–3378)

- [ ] **Step 1: Ajouter `currentPenShape` et modifier `startDraw` pour le crayon**

Dans `app.js`, trouver (ligne ~3274) :
```js
const shapes = [];
let activeTool = 'arrow';
let activeColor = '#dc2626';
let drawing = false;
let startX = 0, startY = 0;
let previewShape = null;
```

Remplacer par :
```js
const shapes = [];
let activeTool = 'arrow';
let activeColor = '#dc2626';
let drawing = false;
let startX = 0, startY = 0;
let previewShape = null;
let currentPenShape = null;
```

- [ ] **Step 2: Modifier `startDraw` pour initialiser le tracé crayon**

Trouver :
```js
        function startDraw(e) {
            const pos = getCanvasPos(e);
            if (activeTool === 'text') {
                const text = window.prompt('Texte :', '');
                if (text) shapes.push({ type: 'text', startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y, color: activeColor, text });
                redrawCanvas();
                return;
            }
            drawing = true;
            startX = pos.x;
            startY = pos.y;
        }
```

Remplacer par :
```js
        function startDraw(e) {
            const pos = getCanvasPos(e);
            if (activeTool === 'text') {
                const text = window.prompt('Texte :', '');
                if (text) shapes.push({ type: 'text', startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y, color: activeColor, text });
                redrawCanvas();
                return;
            }
            drawing = true;
            startX = pos.x;
            startY = pos.y;
            if (activeTool === 'pen') {
                currentPenShape = { type: 'pen', points: [{ x: pos.x, y: pos.y }], color: activeColor };
                shapes.push(currentPenShape);
            }
        }
```

- [ ] **Step 3: Modifier `moveDraw` pour le crayon**

Trouver :
```js
        function moveDraw(e) {
            if (!drawing) return;
            const pos = getCanvasPos(e);
            previewShape = { type: activeTool, startX, startY, endX: pos.x, endY: pos.y, color: activeColor, text: '' };
            redrawCanvas();
            drawShape(ctx, previewShape);
        }
```

Remplacer par :
```js
        function moveDraw(e) {
            if (!drawing) return;
            const pos = getCanvasPos(e);
            if (activeTool === 'pen') {
                currentPenShape.points.push({ x: pos.x, y: pos.y });
                redrawCanvas();
                return;
            }
            previewShape = { type: activeTool, startX, startY, endX: pos.x, endY: pos.y, color: activeColor, text: '' };
            redrawCanvas();
            drawShape(ctx, previewShape);
        }
```

- [ ] **Step 4: Modifier `endDraw` pour le crayon**

Trouver :
```js
        function endDraw() {
            if (!drawing) return;
            drawing = false;
            if (previewShape) { shapes.pop(); previewShape = null; }
        }
```

Attends — le code original est :
```js
        function endDraw() {
            if (!drawing) return;
            drawing = false;
            if (previewShape) { shapes.push(previewShape); previewShape = null; }
        }
```

Remplacer par :
```js
        function endDraw() {
            if (!drawing) return;
            drawing = false;
            if (activeTool === 'pen') {
                currentPenShape = null;
                return;
            }
            if (previewShape) { shapes.push(previewShape); previewShape = null; }
        }
```

- [ ] **Step 5: Ajouter le rendu `pen` dans `drawShape`**

Trouver :
```js
            } else if (s.type === 'text') {
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(s.text, s.startX, s.startY);
            }
```

Remplacer par :
```js
            } else if (s.type === 'text') {
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(s.text, s.startX, s.startY);
            } else if (s.type === 'pen') {
                if (!s.points || s.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(s.points[0].x, s.points[0].y);
                s.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
```

- [ ] **Step 6: Ajouter le bouton Crayon dans la toolbar**

Trouver :
```js
        [{ id: 'arrow', label: '↗ Flèche' }, { id: 'circle', label: '⬤ Cercle' }, { id: 'text', label: 'T Texte' }].forEach(t => {
```

Remplacer par :
```js
        [{ id: 'arrow', label: '↗ Flèche' }, { id: 'circle', label: '⬤ Cercle' }, { id: 'pen', label: '✏️ Crayon' }, { id: 'text', label: 'T Texte' }].forEach(t => {
```

- [ ] **Step 7: Vérifier dans le navigateur**

Ouvrir `http://localhost:8000`, créer une inspection, aller dans n'importe quelle section avec photos, ajouter une photo et cliquer ✏️.
Expected : l'éditeur s'ouvre avec le bouton **✏️ Crayon** dans la toolbar. Sélectionner Crayon, dessiner sur la photo — le tracé suit le doigt/curseur. Sauvegarder → la photo dans la galerie montre le tracé.

- [ ] **Step 8: Ajouter le badge ✏️ sur les vignettes annotées**

Dans `app.js`, trouver (ligne ~1408) :
```js
                    imgWrap.appendChild(img);
                    imgWrap.appendChild(delBtn);
                    imgWrap.appendChild(annotBtn);
```

Remplacer par :
```js
                    imgWrap.appendChild(img);
                    imgWrap.appendChild(delBtn);
                    imgWrap.appendChild(annotBtn);
                    if (photoObj.originalUrl) {
                        const annotBadge = document.createElement('span');
                        annotBadge.textContent = '✏️';
                        annotBadge.title = 'Photo annotée';
                        annotBadge.style.cssText = 'position:absolute;top:4px;right:4px;background:rgba(26,86,219,0.9);color:white;border-radius:4px;padding:1px 5px;font-size:10px;pointer-events:none;';
                        imgWrap.appendChild(annotBadge);
                    }
```

- [ ] **Step 9: Commit**

```bash
git add app.js
git commit -m "feat(groupe-g): outil crayon + badge annotation dans éditeur photo"
```

---

## Task 2: Champ email client dans Section 1

**Files:**
- Modify: `app.js` (section rendu champs text, lignes ~1149–1200)

- [ ] **Step 1: Stocker et restaurer l'email client**

Dans `app.js`, trouver (ligne ~1166) :
```js
                    if (field.id === 'prop_address') {
                        input.addEventListener('input', () => {
                            inspectionData.clientInfo.address = input.value;
                            localStorage.setItem('inspectpro_client_address', input.value);
```

Après ce bloc (après sa fermeture `}`), ajouter :
```js
                    if (field.id === 'client_email') {
                        input.type = 'email';
                        input.value = inspectionData.clientInfo.email || '';
                        input.addEventListener('input', () => {
                            inspectionData.clientInfo.email = input.value.trim();
                            saveAppState();
                        });
                    }
```

- [ ] **Step 2: Ajouter le champ `client_email` dans data.js**

Ouvrir `data.js`. Chercher la section `s_admin` (Section 1 — Informations générales). Trouver la sous-section qui contient `prop_address` ou `inspector_name`. Après le champ `prop_address`, ajouter dans le tableau `fields` :

```js
{ id: 'client_email', label: 'Email du client', type: 'text', placeholder: 'client@email.com' },
```

- [ ] **Step 3: Vérifier dans le navigateur**

Ouvrir `http://localhost:8000`, aller en Section 1. Expected : un champ **"Email du client"** apparaît. Saisir une adresse email → recharger la page → le champ doit conserver la valeur.

- [ ] **Step 4: Commit**

```bash
git add app.js data.js
git commit -m "feat(groupe-g): champ email client dans section informations"
```

---

## Task 3: Signature électronique client — sur place

**Files:**
- Modify: `KZO_Inspect.html` (ajout CDN signature_pad)
- Modify: `app.js` (modal signature, bouton dans section client)

- [ ] **Step 1: Ajouter le CDN signature_pad dans `KZO_Inspect.html`**

Trouver (ligne ~265) :
```html
    <script src="auth.js"></script>
    <script>if (!sessionStorage.getItem('kzo_auth')) { window.location.replace('login.html'); }</script>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
```

Remplacer par :
```html
    <script src="auth.js"></script>
    <script>if (!sessionStorage.getItem('kzo_auth')) { window.location.replace('login.html'); }</script>
    <script src="https://cdn.jsdelivr.net/npm/signature_pad@4/dist/signature_pad.umd.min.js"></script>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
```

- [ ] **Step 2: Ajouter la fonction `openClientSignatureModal` dans `app.js`**

Dans `app.js`, juste avant la ligne `function openAnnotationEditor` (ligne ~3228), ajouter :

```js
    function openClientSignatureModal() {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const card = document.createElement('div');
        card.style.cssText = 'background:white;border-radius:16px;padding:24px;width:min(500px,90vw);';
        card.innerHTML = '<h3 style="color:#0f172a;margin:0 0 16px;text-align:center;font-size:1.1rem;">✍️ Signature du client</h3>';
        const canvasEl = document.createElement('canvas');
        canvasEl.width = 460;
        canvasEl.height = 200;
        canvasEl.style.cssText = 'border:2px dashed #cbd5e1;border-radius:8px;width:100%;touch-action:none;display:block;';
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:10px;margin-top:16px;justify-content:center;flex-wrap:wrap;';
        const clearBtn   = document.createElement('button');
        const cancelBtn  = document.createElement('button');
        const confirmBtn = document.createElement('button');
        clearBtn.type = cancelBtn.type = confirmBtn.type = 'button';
        clearBtn.textContent   = '🗑️ Effacer';
        cancelBtn.textContent  = '✕ Annuler';
        confirmBtn.textContent = '✅ Confirmer';
        clearBtn.style.cssText   = 'padding:8px 16px;background:#e2e8f0;color:#334155;border:none;border-radius:8px;font-weight:700;cursor:pointer;';
        cancelBtn.style.cssText  = 'padding:8px 16px;background:#e2e8f0;color:#334155;border:none;border-radius:8px;font-weight:700;cursor:pointer;';
        confirmBtn.style.cssText = 'padding:8px 16px;background:#22c55e;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;';
        btnRow.appendChild(clearBtn);
        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        card.appendChild(canvasEl);
        card.appendChild(btnRow);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        const sigPad = new SignaturePad(canvasEl);
        clearBtn.onclick  = () => sigPad.clear();
        cancelBtn.onclick = () => document.body.removeChild(overlay);
        confirmBtn.onclick = () => {
            if (sigPad.isEmpty()) { showToast('Veuillez signer avant de confirmer.', 'warning'); return; }
            inspectionData.clientInfo.clientSignatureUrl = sigPad.toDataURL('image/png');
            saveAppState();
            document.body.removeChild(overlay);
            const indicator = document.getElementById('clientSignatureIndicator');
            if (indicator) { indicator.textContent = 'Signé ✅'; indicator.style.color = '#22c55e'; }
            showToast('✅ Signature enregistrée', 'success');
        };
    }
```

- [ ] **Step 3: Ajouter le bouton "Faire signer" dans la section client**

Dans `app.js`, trouver le gestionnaire pour `field.id === 'rap_generate'` (ligne ~1326) :
```js
                    if (field.id === 'rap_generate') {
                        const rapBtn = document.createElement('button');
```

Juste avant, ajouter le gestionnaire pour `client_sign` :
```js
                    if (field.id === 'client_sign') {
                        const signBtn = document.createElement('button');
                        signBtn.type = 'button';
                        signBtn.style.cssText = 'width:100%;padding:12px;background:linear-gradient(135deg,#1A56DB,#0d9488);color:white;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:8px;';
                        const sigIndicator = document.createElement('span');
                        sigIndicator.id = 'clientSignatureIndicator';
                        sigIndicator.style.cssText = 'display:block;text-align:center;margin-top:6px;font-size:0.82rem;color:#94a3b8;';
                        if (inspectionData.clientInfo.clientSignatureUrl) {
                            signBtn.textContent = '✍️ Modifier la signature';
                            sigIndicator.textContent = 'Signé ✅';
                            sigIndicator.style.color = '#22c55e';
                        } else {
                            signBtn.textContent = '✍️ Faire signer le client';
                            sigIndicator.textContent = '';
                        }
                        signBtn.onclick = () => openClientSignatureModal();
                        fieldEl.appendChild(signBtn);
                        fieldEl.appendChild(sigIndicator);
                        continue;
                    }
```

- [ ] **Step 4: Ajouter les champs `client_sign` et `client_remote_sign` dans `data.js`**

Dans `data.js`, dans la même section que `client_email`, ajouter après ce champ :
```js
{ id: 'client_sign',        label: 'Signature du client', type: 'action' },
{ id: 'client_remote_sign', label: 'Envoyer pour signature à distance', type: 'action' },
```

- [ ] **Step 5: Vérifier dans le navigateur**

Ouvrir `http://localhost:8000`, aller en Section 1. Expected : bouton **"✍️ Faire signer le client"**. Cliquer → modale avec canvas blanc. Dessiner une signature → **Confirmer** → indicateur "Signé ✅" apparaît sous le bouton.

- [ ] **Step 6: Commit**

```bash
git add app.js KZO_Inspect.html data.js
git commit -m "feat(groupe-g): signature_pad client sur place avec modale canvas"
```

---

## Task 4: Signature client dans le rapport PDF

**Files:**
- Modify: `app.js` (fonction `_buildReportHTML`, ligne ~2849)

- [ ] **Step 1: Ajouter le bloc signature client à la fin du rapport**

Dans `app.js`, trouver (ligne ~2849) :
```js
        if (BOILERPLATE.attestation) html += BOILERPLATE.attestation(clientName, safeInspectorName, signatureUrl, sealUrl);
```

Après cette ligne, ajouter :
```js
        const clientSigUrl = inspectionData.clientInfo.clientSignatureUrl || null;
        if (clientSigUrl) {
            const sigDate = new Date().toLocaleDateString('fr-CA');
            html += `<div style="margin-top:40px;padding:24px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;page-break-inside:avoid;">
                <h3 style="color:#0f172a;font-size:1rem;margin:0 0 12px;">✍️ Acceptation du rapport — Signature du client</h3>
                <p style="color:#64748b;font-size:0.85rem;margin:0 0 16px;">Date : ${sigDate} &nbsp;&nbsp;&nbsp; Client : ${sanitizeHTML(clientName)}</p>
                <img src="${clientSigUrl}" style="max-width:300px;height:80px;object-fit:contain;border-bottom:2px solid #0f172a;display:block;">
            </div>`;
        }
```

- [ ] **Step 2: Vérifier dans le navigateur**

Ouvrir `http://localhost:8000`, créer une inspection, signer en Section 1, puis générer le rapport (dernière section → Générer Rapport). Expected : en bas du rapport, un bloc **"✍️ Acceptation du rapport"** avec la signature apparaît.

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat(groupe-g): bloc signature client dans rapport PDF"
```

---

## Task 5: Exposer l'URL Drive dans `google_drive.js`

**Files:**
- Modify: `google_drive.js`

- [ ] **Step 1: Ajouter `_lastSyncUrl` et `getLastSyncUrl()`**

Dans `google_drive.js`, trouver (proche du début du module) la déclaration des constantes ou la première `let` :
```js
    const API_BASE   = 'https://www.googleapis.com/drive/v3';
```

Juste après, ajouter :
```js
    let _lastSyncUrl = '';
```

- [ ] **Step 2: Stocker l'URL après chaque sync réussi**

Trouver (ligne ~375) :
```js
            const folderUrl = await _uploadAll(projectId, reportBlob, inspData, unitId);
            _setStatus(projectId, 'synced');
```

Remplacer par :
```js
            const folderUrl = await _uploadAll(projectId, reportBlob, inspData, unitId);
            _lastSyncUrl = folderUrl;
            _setStatus(projectId, 'synced');
```

- [ ] **Step 3: Exposer `getLastSyncUrl` dans l'API publique**

Trouver la fin du module google_drive.js, où l'objet public est défini (contient `syncInspection`) :
```js
        syncInspection:      syncInspection
```

Ajouter après :
```js
        syncInspection:      syncInspection,
        getLastSyncUrl:      function() { return _lastSyncUrl; }
```

- [ ] **Step 4: Commit**

```bash
git add google_drive.js
git commit -m "feat(groupe-g): exposer getLastSyncUrl dans google_drive.js"
```

---

## Task 6: Bouton "Envoyer au client" dans la modale rapport

**Files:**
- Modify: `KZO_Inspect.html` (bouton sendReportBtn)
- Modify: `app.js` (fonction sendReportByEmail + hook dans generateFinalReport)
- Modify: `config.js` (EMAILJS_RAPPORT_TEMPLATE_ID)

- [ ] **Step 1: Ajouter le bouton dans `KZO_Inspect.html`**

Trouver (ligne ~246) :
```html
                   <button class="btn" id="closeReportBtn" style="margin-right: 12px; background: white; border: 1px solid #cbd5e1; color: #475569;">Fermer</button>
                   <button class="btn primary" id="printReportBtn" style="background: #3b82f6;">📥 Imprimer PDF</button>
```

Remplacer par :
```html
                   <button class="btn" id="closeReportBtn" style="margin-right: 12px; background: white; border: 1px solid #cbd5e1; color: #475569;">Fermer</button>
                   <button class="btn" id="sendReportBtn" style="background: #0d9488; color:white; margin-right: 8px;">📤 Envoyer au client</button>
                   <button class="btn primary" id="printReportBtn" style="background: #3b82f6;">📥 Imprimer PDF</button>
```

- [ ] **Step 2: Ajouter `EMAILJS_RAPPORT_TEMPLATE_ID` dans `config.js`**

Trouver :
```js
    EMAILJS_PUBLIC_KEY:     'Cm9YQePszO7sEIGJ2'
```

Remplacer par :
```js
    EMAILJS_PUBLIC_KEY:          'Cm9YQePszO7sEIGJ2',
    EMAILJS_RAPPORT_TEMPLATE_ID: '' // À remplir après création du template emailjs.com
```

- [ ] **Step 3: Ajouter `sendReportByEmail` dans `app.js`**

Juste avant la fonction `generateFinalReport` (ligne ~2869), ajouter :

```js
    async function sendReportByEmail(unitId) {
        const clientEmail = inspectionData.clientInfo.email || inspectionData['client_email'] || '';
        if (!clientEmail) {
            showToast('Veuillez saisir l\'email du client dans la Section 1.', 'warning');
            return;
        }
        const cfg = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG : {};
        if (!cfg.EMAILJS_SERVICE_ID || !cfg.EMAILJS_RAPPORT_TEMPLATE_ID || !cfg.EMAILJS_PUBLIC_KEY) {
            showToast('EmailJS non configuré — remplissez EMAILJS_RAPPORT_TEMPLATE_ID dans config.js.', 'error');
            return;
        }
        const sendBtn = document.getElementById('sendReportBtn');
        if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '…'; }
        try {
            let driveUrl = (typeof GoogleDrive !== 'undefined') ? GoogleDrive.getLastSyncUrl() : '';
            if (!driveUrl && typeof GoogleDrive !== 'undefined') {
                const blob = new Blob([document.getElementById('reportContent').innerHTML], { type: 'text/html;charset=utf-8' });
                await GoogleDrive.syncInspection(window.currentProjectId, blob, unitId);
                driveUrl = GoogleDrive.getLastSyncUrl();
            }
            emailjs.init(cfg.EMAILJS_PUBLIC_KEY);
            await emailjs.send(cfg.EMAILJS_SERVICE_ID, cfg.EMAILJS_RAPPORT_TEMPLATE_ID, {
                to_email:       clientEmail,
                client_name:    sanitizeHTML(inspectionData.clientInfo.name || 'Client'),
                inspector_name: sanitizeHTML(inspectionData.clientInfo.inspectorName || 'Inspecteur'),
                address:        sanitizeHTML(inspectionData.clientInfo.address || ''),
                report_link:    driveUrl || '(lien non disponible — activez Google Drive)'
            });
            showToast('✅ Rapport envoyé à ' + clientEmail, 'success');
            if (sendBtn) { sendBtn.textContent = '✅ Envoyé'; }
        } catch (e) {
            console.error('[sendReportByEmail]', e);
            showToast('Erreur envoi : ' + (e.text || e.message || JSON.stringify(e)), 'error');
            if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '📤 Envoyer au client'; }
        }
    }
```

- [ ] **Step 4: Brancher le bouton dans `generateFinalReport`**

Dans `app.js`, trouver (ligne ~2896) :
```js
        document.getElementById('closeReportBtn').onclick = () => { reportModal.style.display = 'none'; };
        document.getElementById('printReportBtn').onclick = () => { setTimeout(() => window.print(), 500); };
```

Remplacer par :
```js
        document.getElementById('closeReportBtn').onclick = () => { reportModal.style.display = 'none'; };
        document.getElementById('sendReportBtn').onclick = () => sendReportByEmail(unitId);
        document.getElementById('printReportBtn').onclick = () => { setTimeout(() => window.print(), 500); };
```

- [ ] **Step 5: Vérifier dans le navigateur**

Générer un rapport. Expected : bouton **"📤 Envoyer au client"** visible entre Fermer et Imprimer. Cliquer sans email saisi → toast d'avertissement. Saisir un email en Section 1, regénérer, cliquer → toast "EmailJS non configuré" (normal, le template n'est pas encore créé).

- [ ] **Step 6: Commit**

```bash
git add KZO_Inspect.html app.js config.js
git commit -m "feat(groupe-g): bouton envoi rapport client + sendReportByEmail via Drive+EmailJS"
```

---

## Task 7: Bouton "Envoyer pour signature à distance"

**Files:**
- Modify: `app.js` (gestionnaire `client_remote_sign`)

- [ ] **Step 1: Ajouter le gestionnaire `client_remote_sign` dans `app.js`**

Dans `app.js`, juste après le gestionnaire `client_sign` ajouté en Task 3 Step 3, ajouter :

```js
                    if (field.id === 'client_remote_sign') {
                        const remoteBtn = document.createElement('button');
                        remoteBtn.type = 'button';
                        remoteBtn.textContent = '📧 Envoyer pour signature à distance';
                        remoteBtn.style.cssText = 'width:100%;padding:11px;background:#334155;color:#cbd5e1;border:none;border-radius:10px;font-size:0.9rem;font-weight:700;cursor:pointer;margin-top:8px;';
                        remoteBtn.onclick = async () => {
                            const clientEmail = inspectionData.clientInfo.email || inspectionData['client_email'] || '';
                            if (!clientEmail) { showToast('Veuillez saisir l\'email du client d\'abord.', 'warning'); return; }
                            remoteBtn.disabled = true;
                            remoteBtn.textContent = '…';
                            try {
                                const html = _buildReportHTML(window.currentUnitId);
                                const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                                if (typeof GoogleDrive !== 'undefined') {
                                    await GoogleDrive.syncInspection(window.currentProjectId, blob, window.currentUnitId);
                                }
                                await sendReportByEmail(window.currentUnitId);
                                remoteBtn.textContent = '✅ Envoyé pour signature';
                            } catch (e) {
                                showToast('Erreur : ' + (e.text || e.message || 'inconnu'), 'error');
                                remoteBtn.disabled = false;
                                remoteBtn.textContent = '📧 Envoyer pour signature à distance';
                            }
                        };
                        fieldEl.appendChild(remoteBtn);
                        continue;
                    }
```

- [ ] **Step 2: Vérifier dans le navigateur**

Ouvrir Section 1. Expected : bouton **"📧 Envoyer pour signature à distance"** sous le bouton de signature. Cliquer sans email → toast d'avertissement. Avec email → toast "EmailJS non configuré" (attendu jusqu'au template).

- [ ] **Step 3: Commit**

```bash
git add app.js
git commit -m "feat(groupe-g): bouton envoi à distance depuis section client"
```

---

## Task 8: Créer le template EmailJS pour le rapport

**Aucun fichier à modifier — étapes manuelles sur emailjs.com.**

- [ ] **Step 1: Aller sur emailjs.com → Email Templates → Create New Template**

- [ ] **Step 2: Configurer le template**

| Champ | Valeur |
|-------|--------|
| Name | `kzo_rapport` |
| Subject | `Rapport d'inspection — {{address}}` |
| To Email | `{{to_email}}` |

Corps (Code Editor) :
```html
<p>Bonjour {{client_name}},</p>
<p>Votre rapport d'inspection préparé par <strong>{{inspector_name}}</strong> est disponible :</p>
<p style="margin:20px 0;">
  <a href="{{report_link}}" style="background:#1A56DB;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
    📄 Consulter le rapport
  </a>
</p>
<p>Adresse inspectée : {{address}}</p>
<p style="color:#94a3b8;font-size:0.85em;">Ce rapport a été généré par KZO InspectPro.</p>
```

- [ ] **Step 3: Sauvegarder — noter le Template ID (format `template_xxxxxxx`)**

Aller dans l'onglet **Settings** du template pour copier le Template ID exact.

- [ ] **Step 4: Mettre à jour `config.js` avec le Template ID**

Remplacer dans `config.js` :
```js
    EMAILJS_RAPPORT_TEMPLATE_ID: '' // À remplir après création du template emailjs.com
```
Par :
```js
    EMAILJS_RAPPORT_TEMPLATE_ID: 'template_xxxxxxx' // Remplacer par le vrai ID
```

- [ ] **Step 5: Tester l'envoi complet**

Ouvrir `http://localhost:8000`, créer une inspection avec email client, signer, générer le rapport → cliquer **"📤 Envoyer au client"**. Expected : toast "✅ Rapport envoyé à [email]". Vérifier la boîte mail du client.

- [ ] **Step 6: Commit**

```bash
git add config.js
git commit -m "chore(groupe-g): template ID rapport EmailJS configuré"
```

---

## Task 9: Bump version cache + query strings

**Files:**
- Modify: `sw.js`
- Modify: `KZO_Inspect.html`

- [ ] **Step 1: Bumper le cache dans `sw.js`**

Changer :
```js
const CACHE_NAME = 'kzo-inspect-v24';
```
En :
```js
const CACHE_NAME = 'kzo-inspect-v25';
```

- [ ] **Step 2: Bumper `app.js?v=` dans `KZO_Inspect.html`**

Changer :
```html
    <script src="app.js?v=23"></script>
```
En :
```html
    <script src="app.js?v=24"></script>
```

- [ ] **Step 3: Commit final**

```bash
git add sw.js KZO_Inspect.html
git commit -m "chore(groupe-g): cache v25, app.js v24"
```

---

## Self-Review

### Spec coverage

| Exigence spec | Tâche |
|---|---|
| Outil Crayon dans annotateur | Task 1 Steps 1–7 |
| Badge ✏️ sur vignette annotée | Task 1 Step 8 |
| Photo originale conservée | Déjà implémenté (`photoObj.originalUrl`) |
| Photo annotée dans PDF | Déjà implémenté (`photo.url` = version annotée) |
| Signature client sur place (signature_pad) | Task 3 |
| Indicateur "Signé ✅" | Task 3 Step 3 |
| Signature dans PDF | Task 4 |
| Exposer URL Drive | Task 5 |
| Bouton "📤 Envoyer au client" dans rapport | Task 6 |
| sendReportByEmail (Drive + EmailJS) | Task 6 Step 3 |
| Bouton "📧 Envoyer pour signature à distance" | Task 7 |
| Champ email client | Task 2 |
| Template EmailJS rapport | Task 8 |
| Cache v25 | Task 9 |

### Type consistency

- `sendReportByEmail(unitId)` — défini Task 6 Step 3, appelé Task 6 Step 4 et Task 7 Step 1. ✅
- `openClientSignatureModal()` — défini Task 3 Step 2, appelé Task 3 Step 3. ✅
- `GoogleDrive.getLastSyncUrl()` — défini Task 5 Step 3, appelé Task 6 Step 3 et Task 7 Step 1. ✅
- `inspectionData.clientInfo.clientSignatureUrl` — écrit Task 3 Step 2, lu Task 4 Step 1. ✅
- `inspectionData.clientInfo.email` — écrit Task 2 Step 1, lu Task 6 Step 3 et Task 7 Step 1. ✅
- `_buildReportHTML(unitId)` — existant dans app.js, appelé Task 7 Step 1. ✅
- `window.currentUnitId` — existant dans app.js, utilisé Task 7 Step 1. ✅

### Placeholder scan

Aucun TBD ou TODO dans les steps. Le Template ID EmailJS (Task 8 Step 4) est marqué comme étape manuelle explicite avec instruction. ✅
