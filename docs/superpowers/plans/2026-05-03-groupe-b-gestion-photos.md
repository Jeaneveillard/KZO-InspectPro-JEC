# Groupe B — Gestion photos améliorée (Légende + Annotation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une légende par photo (éditable en galerie + dans le PDF) et un éditeur d'annotation canvas (Flèche/Cercle/Texte/Couleur/Undo) accessible depuis la galerie.

**Architecture:** Modification de `renderGallery()` dans `app.js` (closure locale dans `renderSection()`) pour restructurer les cartes photo (image + caption + bouton Annoter). Ajout d'une fonction `openAnnotationEditor()` qui crée un overlay plein écran avec un `<canvas>` HTML5 et un `shapes[]` pour le undo. Pas de nouvelle dépendance.

**Tech Stack:** Vanilla JS, HTML5 Canvas API, événements touch/mouse, `canvas.toDataURL()` pour export base64.

---

## Fichiers modifiés

| Fichier | Lignes concernées | Modification |
|---------|------------------|-------------|
| `app.js` | 1291-1315 | Restructure `renderGallery()` — cartes flex column + caption + bouton Annoter |
| `app.js` | 1335-1383 | `fileInput.onchange` — push `{ url, caption:'', originalUrl:null }` + focus caption |
| `app.js` | 2651-2659 | `generateFinalReport()` — ajouter figcaption dans boucle photos |
| `app.js` | fin du fichier (avant `}`) | Ajouter fonction `openAnnotationEditor()` |
| `KZO_Inspect.html` | ligne 271 | Bump `app.js?v=18` → `app.js?v=19` |
| `sw.js` | ligne 1 | Bump `kzo-inspect-v19` → `kzo-inspect-v20` |

---

## Task 1 : Structure de données — push avec caption + originalUrl

**Fichier :** `app.js` ligne 1344

**Contexte :** Dans `fileInput.onchange`, chaque photo est poussée dans `store[sub.id]` comme `{ url: dataUrl }`. On doit ajouter `caption` et `originalUrl`.

- [ ] **Step 1 : Modifier le push pour inclure les nouveaux champs**

Localise la ligne 1344 dans `app.js` :
```js
store[sub.id].push({ url: dataUrl });
```
Remplace par :
```js
store[sub.id].push({ url: dataUrl, caption: '', originalUrl: null });
```

- [ ] **Step 2 : Après `renderGallery()` (ligne 1381), focus automatique sur la légende de la dernière photo ajoutée (upload d'un seul fichier)**

Localise le bloc `fileInput.onchange` autour de la ligne 1381 :
```js
                renderGallery();
                fileInput.value = '';
```
Remplace par :
```js
                renderGallery();
                if (files.length === 1) {
                    const lastInput = grid.querySelector('.photo-caption-input:last-of-type');
                    if (lastInput) { lastInput.focus(); lastInput.select(); }
                }
                fileInput.value = '';
```

- [ ] **Step 3 : Vérifier manuellement dans le navigateur**

Ouvrir `KZO_Inspect.html` → aller dans une section avec galerie photo → uploader une photo → vérifier en console :
```js
// Dans la console, après upload :
getActiveSectionPhotos()  // doit montrer { url:'data:...', caption:'', originalUrl:null }
```

- [ ] **Step 4 : Commit**

```bash
git add app.js
git commit -m "feat(groupe-b): photo object inclut caption et originalUrl"
```

---

## Task 2 : Restructuration de `renderGallery()` — cartes avec caption

**Fichier :** `app.js` lignes 1291-1315

**Contexte :** La galerie actuelle rend des cartes `aspect-ratio:1` avec `overflow:hidden`. Pour ajouter une légende sous la photo, on restructure en flex column : un `imgWrap` carré en haut + une zone caption en bas.

- [ ] **Step 1 : Remplacer le corps de `renderGallery()`**

Localise le bloc exact (lignes 1291-1315) :
```js
            const renderGallery = () => {
                grid.innerHTML = '';
                const photos = getActiveSectionPhotos()[sub.id] || [];
                photos.forEach((photoObj, i) => {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
                    
                    const img = document.createElement('img');
                    img.src = photoObj.url;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                    
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = '✕';
                    delBtn.title = 'Supprimer cette photo';
                    delBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; background: rgba(220, 38, 38, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
                    delBtn.onclick = () => {
                        getActiveSectionPhotos()[sub.id].splice(i, 1);
                        saveAppState();
                        renderGallery();
                    };
                    
                    wrap.appendChild(img);
                    wrap.appendChild(delBtn);
                    grid.appendChild(wrap);
                });
            };
```

Remplace par :
```js
            const renderGallery = () => {
                grid.innerHTML = '';
                const photos = getActiveSectionPhotos()[sub.id] || [];
                photos.forEach((photoObj, i) => {
                    // Carte flex column : image (carré) + caption
                    const card = document.createElement('div');
                    card.style.cssText = 'display:flex;flex-direction:column;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;background:#fff;';

                    // Zone image carrée
                    const imgWrap = document.createElement('div');
                    imgWrap.style.cssText = 'position:relative;aspect-ratio:1;overflow:hidden;';

                    const img = document.createElement('img');
                    img.src = photoObj.url;
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';

                    // Bouton supprimer (haut droite)
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = '✕';
                    delBtn.title = 'Supprimer cette photo';
                    delBtn.style.cssText = 'position:absolute;top:4px;right:4px;background:rgba(220,38,38,0.9);color:white;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
                    delBtn.onclick = () => {
                        getActiveSectionPhotos()[sub.id].splice(i, 1);
                        saveAppState();
                        renderGallery();
                    };

                    // Bouton annoter (bas gauche)
                    const annotBtn = document.createElement('button');
                    annotBtn.innerHTML = '✏️';
                    annotBtn.title = 'Annoter cette photo';
                    annotBtn.style.cssText = 'position:absolute;bottom:4px;left:4px;background:rgba(30,41,59,0.85);color:white;border:none;border-radius:6px;width:28px;height:28px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
                    annotBtn.onclick = () => {
                        openAnnotationEditor(photoObj, () => {
                            saveAppState();
                            renderGallery();
                        });
                    };

                    imgWrap.appendChild(img);
                    imgWrap.appendChild(delBtn);
                    imgWrap.appendChild(annotBtn);

                    // Zone légende
                    const captionInput = document.createElement('input');
                    captionInput.type = 'text';
                    captionInput.className = 'photo-caption-input';
                    captionInput.value = photoObj.caption || '';
                    captionInput.placeholder = 'Ajouter une légende...';
                    captionInput.style.cssText = 'width:100%;border:none;border-top:1px solid #e2e8f0;padding:4px 6px;font-size:0.72rem;color:#475569;background:#f8fafc;box-sizing:border-box;';
                    captionInput.onblur = () => {
                        photoObj.caption = captionInput.value.trim();
                        saveAppState();
                    };
                    captionInput.onkeydown = (e) => {
                        if (e.key === 'Enter') captionInput.blur();
                    };

                    card.appendChild(imgWrap);
                    card.appendChild(captionInput);
                    grid.appendChild(card);
                });
            };
```

- [ ] **Step 2 : Vérifier visuellement dans le navigateur**

Ouvrir `KZO_Inspect.html` → galerie photo → vérifier :
- Chaque photo a un champ de légende en dessous (grisé si vide)
- Taper une légende → blur → légende sauvegardée
- Bouton ✏️ visible en bas à gauche (l'annotation editor n'est pas encore implémenté — un `ReferenceError: openAnnotationEditor is not defined` est attendu au clic)
- Bouton ✕ toujours fonctionnel

- [ ] **Step 3 : Commit**

```bash
git add app.js
git commit -m "feat(groupe-b): galerie restructurée avec légende inline et bouton annoter"
```

---

## Task 3 : Légende dans le PDF (`generateFinalReport()`)

**Fichier :** `app.js` lignes 2651-2659

**Contexte :** La boucle de rendu des photos dans le PDF affiche actuellement chaque photo comme un simple `<img>`. On ajoute un `<figcaption>` conditionnel.

- [ ] **Step 1 : Modifier la boucle de rendu des photos**

Localise le bloc exact :
```js
                    subPhotos.forEach(photo => {
                        infoHtml += `<img src="${photo.url}" style="width: 180px; height: 135px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;">`;
                    });
```

Remplace par :
```js
                    subPhotos.forEach(photo => {
                        infoHtml += `<figure style="display:inline-block;margin:0;vertical-align:top;">`;
                        infoHtml += `<img src="${photo.url}" style="width:180px;height:135px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1;display:block;">`;
                        if (photo.caption) {
                            infoHtml += `<figcaption style="font-size:0.75rem;color:#64748b;text-align:center;margin-top:4px;max-width:180px;">${photo.caption}</figcaption>`;
                        }
                        infoHtml += `</figure>`;
                    });
```

- [ ] **Step 2 : Vérifier dans le PDF**

Ouvrir `KZO_Inspect.html` → ajouter une photo avec légende "Fissure visible" → générer le rapport PDF → vérifier que la légende apparaît sous la photo dans le rapport.

- [ ] **Step 3 : Commit**

```bash
git add app.js
git commit -m "feat(groupe-b): légende photo affichée dans le rapport PDF"
```

---

## Task 4 : Éditeur d'annotation — fonction `openAnnotationEditor()`

**Fichier :** `app.js` — ajouter la fonction juste avant la dernière accolade fermante `}` du bloc DOMContentLoaded (vers la fin du fichier, autour de la ligne 2950+).

**Contexte :** `openAnnotationEditor(photoObj, onSave)` crée un overlay plein écran, charge la photo dans un canvas, gère les outils Flèche/Cercle/Texte/Couleur/Undo, puis au Sauvegarder exporte le canvas en JPEG base64 et remplace `photoObj.url`.

- [ ] **Step 1 : Trouver l'emplacement d'insertion**

Dans `app.js`, chercher la dernière ligne du bloc DOMContentLoaded :
```js
}); // fin DOMContentLoaded
```
Insérer la fonction `openAnnotationEditor` AVANT cette ligne (dans le scope de DOMContentLoaded pour avoir accès à `saveAppState`).

- [ ] **Step 2 : Insérer la fonction**

```js
    function openAnnotationEditor(photoObj, onSave) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;z-index:9999;display:flex;flex-direction:column;';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#1e293b;flex-shrink:0;';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '← Annuler';
        cancelBtn.style.cssText = 'background:none;border:none;color:#94a3b8;font-size:1rem;cursor:pointer;padding:4px 0;';
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '✓ Sauvegarder';
        saveBtn.style.cssText = 'background:#22c55e;color:white;border:none;border-radius:6px;padding:8px 16px;font-size:1rem;cursor:pointer;';
        header.appendChild(cancelBtn);
        header.appendChild(saveBtn);

        // Canvas
        const canvasWrap = document.createElement('div');
        canvasWrap.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:8px;';
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'touch-action:none;max-width:100%;max-height:100%;';
        canvasWrap.appendChild(canvas);

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex;gap:8px;padding:10px 16px;background:#1e293b;justify-content:center;flex-wrap:wrap;flex-shrink:0;align-items:center;';

        overlay.appendChild(header);
        overlay.appendChild(canvasWrap);
        overlay.appendChild(toolbar);
        document.body.appendChild(overlay);

        // Setup canvas
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            const maxW = window.innerWidth - 16;
            const maxH = window.innerHeight - 130;
            const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
            canvas.width = Math.round(img.naturalWidth * ratio);
            canvas.height = Math.round(img.naturalHeight * ratio);
            redrawCanvas();
        };
        img.src = photoObj.url;

        // State
        const shapes = [];
        let activeTool = 'arrow';
        let activeColor = '#dc2626';
        let drawing = false;
        let startX = 0, startY = 0;
        let previewShape = null;
        const ANNOTATION_COLORS = ['#dc2626', '#f59e0b', '#3b82f6', '#ffffff'];

        function redrawCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            shapes.forEach(s => drawShape(ctx, s));
        }

        function drawShape(ctx, s) {
            ctx.strokeStyle = s.color;
            ctx.fillStyle = s.color;
            ctx.lineWidth = 2;
            if (s.type === 'arrow') {
                drawArrow(ctx, s.startX, s.startY, s.endX, s.endY);
            } else if (s.type === 'circle') {
                const r = Math.hypot(s.endX - s.startX, s.endY - s.startY);
                ctx.beginPath();
                ctx.arc(s.startX, s.startY, r, 0, Math.PI * 2);
                ctx.stroke();
            } else if (s.type === 'text') {
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(s.text, s.startX, s.startY);
            }
        }

        function drawArrow(ctx, x1, y1, x2, y2) {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLen = 14;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }

        function getCanvasPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        }

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

        function moveDraw(e) {
            if (!drawing) return;
            const pos = getCanvasPos(e);
            previewShape = { type: activeTool, startX, startY, endX: pos.x, endY: pos.y, color: activeColor, text: '' };
            redrawCanvas();
            drawShape(ctx, previewShape);
        }

        function endDraw() {
            if (!drawing) return;
            drawing = false;
            if (previewShape) { shapes.push(previewShape); previewShape = null; }
        }

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
        canvas.addEventListener('mousemove', moveDraw);
        canvas.addEventListener('touchmove', e => { e.preventDefault(); moveDraw(e); }, { passive: false });
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('touchend', e => { e.preventDefault(); endDraw(); }, { passive: false });

        // Toolbar — outils
        const toolBtns = {};
        [{ id: 'arrow', label: '↗ Flèche' }, { id: 'circle', label: '⬤ Cercle' }, { id: 'text', label: 'T Texte' }].forEach(t => {
            const btn = document.createElement('button');
            btn.textContent = t.label;
            btn.style.cssText = `background:${activeTool === t.id ? '#3b82f6' : '#334155'};color:white;border:none;border-radius:6px;padding:7px 11px;font-size:0.82rem;cursor:pointer;`;
            btn.onclick = () => {
                activeTool = t.id;
                Object.values(toolBtns).forEach(b => b.style.background = '#334155');
                btn.style.background = '#3b82f6';
            };
            toolBtns[t.id] = btn;
            toolbar.appendChild(btn);
        });

        // Toolbar — couleurs
        const colorBtns = [];
        ANNOTATION_COLORS.forEach(c => {
            const swatch = document.createElement('button');
            swatch.style.cssText = `width:22px;height:22px;border-radius:50%;background:${c};border:2px solid ${c === activeColor ? 'white' : 'transparent'};cursor:pointer;padding:0;flex-shrink:0;`;
            swatch.onclick = () => {
                activeColor = c;
                colorBtns.forEach(b => b.style.borderColor = 'transparent');
                swatch.style.borderColor = 'white';
            };
            colorBtns.push(swatch);
            toolbar.appendChild(swatch);
        });

        // Toolbar — undo
        const undoBtn = document.createElement('button');
        undoBtn.textContent = '↩ Undo';
        undoBtn.style.cssText = 'background:#475569;color:white;border:none;border-radius:6px;padding:7px 11px;font-size:0.82rem;cursor:pointer;';
        undoBtn.onclick = () => { shapes.pop(); redrawCanvas(); };
        toolbar.appendChild(undoBtn);

        // Sauvegarder
        saveBtn.onclick = () => {
            if (!photoObj.originalUrl) photoObj.originalUrl = photoObj.url;
            photoObj.url = canvas.toDataURL('image/jpeg', 0.85);
            document.body.removeChild(overlay);
            onSave();
        };

        // Annuler
        cancelBtn.onclick = () => document.body.removeChild(overlay);
    }
```

- [ ] **Step 3 : Vérifier manuellement**

Ouvrir `KZO_Inspect.html` → galerie → cliquer ✏️ sur une photo → vérifier :
- Modal plein écran s'ouvre avec la photo
- Dessiner une flèche rouge : pointer sur la photo, drag → flèche apparaît
- Changer couleur → bleu → dessiner un cercle
- Cliquer "T Texte" → tap sur la photo → prompt → texte apparaît
- Undo → dernier trait effacé
- Sauvegarder → modal se ferme, photo mise à jour dans la galerie
- Ouvrir à nouveau le modal → la photo montre les annotations (originalUrl préservé)
- Cliquer Annuler → aucun changement

- [ ] **Step 4 : Commit**

```bash
git add app.js
git commit -m "feat(groupe-b): éditeur annotation canvas (flèche, cercle, texte, couleur, undo)"
```

---

## Task 5 : Bump versions

**Fichiers :** `sw.js` ligne 1, `KZO_Inspect.html` ligne 271

- [ ] **Step 1 : Bump service worker**

Dans `sw.js` ligne 1 :
```js
const CACHE_NAME = 'kzo-inspect-v19';
```
Remplace par :
```js
const CACHE_NAME = 'kzo-inspect-v20';
```

- [ ] **Step 2 : Bump script version dans KZO_Inspect.html**

Dans `KZO_Inspect.html` ligne 271 :
```html
    <script src="app.js?v=18"></script>
```
Remplace par :
```html
    <script src="app.js?v=19"></script>
```

- [ ] **Step 3 : Vérifier le rechargement PWA**

Ouvrir `KZO_Inspect.html` dans le navigateur → ouvrir DevTools → Application → Service Workers → vérifier que le nouveau SW `kzo-inspect-v20` est actif après rechargement.

- [ ] **Step 4 : Commit**

```bash
git add sw.js KZO_Inspect.html
git commit -m "chore: bump cache v20 et app.js v19 pour groupe-b"
```

---

## Récapitulatif des commits

1. `feat(groupe-b): photo object inclut caption et originalUrl`
2. `feat(groupe-b): galerie restructurée avec légende inline et bouton annoter`
3. `feat(groupe-b): légende photo affichée dans le rapport PDF`
4. `feat(groupe-b): éditeur annotation canvas (flèche, cercle, texte, couleur, undo)`
5. `chore: bump cache v20 et app.js v19 pour groupe-b`
