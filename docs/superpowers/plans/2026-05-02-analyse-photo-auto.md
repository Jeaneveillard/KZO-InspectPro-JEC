# Analyse Photo Automatique IA Vision — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** À chaque photo uploadée dans la galerie d'une sous-section d'inspection, l'IA vision l'analyse automatiquement et affiche ses conclusions dans un panneau — l'inspecteur peut appliquer la suggestion ou l'ignorer.

**Architecture:** `ai_agents.js` reçoit `analyzePhotoField()` (remplace le mock existant `analyzePhoto`). `app.js` reçoit `showPhotoAnalysis()` + un hook dans `fileInput.onchange` de la galerie (ligne ~1219). `KZO_Inspect.html` reçoit le panneau `#photoAnalysisPanel`.

**Tech Stack:** JavaScript vanilla, `_callAI()` existant avec vision (base64), `_extractJSON()` existant, `compressImage()` existant.

---

## Fichiers modifiés

| Fichier | Rôle |
|---------|------|
| `KZO_Inspect.html` | Ajout `#photoAnalysisPanel` + bump versions |
| `ai_agents.js` | Remplacement mock `analyzePhoto` par vraie `analyzePhotoField()` |
| `app.js` | Ajout `showPhotoAnalysis()` + hook dans galerie upload |
| `sw.js` | Bump `CACHE_NAME` v17 → v18 |

---

## Task 1 : Panneau `#photoAnalysisPanel` dans KZO_Inspect.html

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`

- [ ] **Étape 1 — Lire KZO_Inspect.html**

Lire `KZO_Inspect.html`. Localiser la ligne avec `<!-- Modale prévisualisation IA -->` (avant `#aiPreviewModal`).

- [ ] **Étape 2 — Insérer le panneau AVANT aiPreviewModal**

Ajouter ce bloc juste avant `<!-- Modale prévisualisation IA -->` :

```html
    <!-- Panneau analyse photo automatique IA -->
    <div id="photoAnalysisPanel" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.88); z-index:2200; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
        <div style="background:white; width:95%; max-width:560px; border-radius:12px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <div style="padding:18px 24px; background:#0f172a; color:white; display:flex; justify-content:space-between; align-items:center;">
                <h3 id="photoAnalysisTitle" style="margin:0; font-size:1rem; font-weight:700;">🔍 Analyse IA</h3>
                <span id="photoAnalysisBadge" style="padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:700;"></span>
            </div>
            <div style="padding:24px;">
                <img id="photoAnalysisThumb" style="width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-bottom:16px; display:none;" alt="Photo analysée">
                <p id="photoAnalysisText" style="color:#334155; line-height:1.7; font-size:0.95rem; margin-bottom:16px;"></p>
                <div style="padding:12px 16px; background:#fffbeb; border-left:4px solid #d97706; border-radius:6px; font-size:0.85rem; color:#92400e;">
                    ⚠️ Cette analyse est indicative. Votre jugement professionnel prévaut toujours.
                </div>
            </div>
            <div style="padding:16px 24px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:12px;">
                <button id="photoAnalysisIgnore" style="padding:8px 20px; background:white; border:1px solid #cbd5e1; color:#475569; border-radius:6px; cursor:pointer; font-size:0.9rem;">Ignorer</button>
                <button id="photoAnalysisApply" style="padding:8px 20px; background:#1d4ed8; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:700; font-size:0.9rem;">✓ Appliquer la suggestion</button>
            </div>
        </div>
    </div>

```

- [ ] **Étape 3 — Vérifier**

Lire les lignes autour de l'insertion et confirmer :
- `id="photoAnalysisPanel"` présent avec `z-index:2200`
- `id="photoAnalysisTitle"`, `id="photoAnalysisBadge"`, `id="photoAnalysisThumb"`, `id="photoAnalysisText"` présents
- `id="photoAnalysisIgnore"`, `id="photoAnalysisApply"` présents

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add KZO_Inspect.html
git commit -m "feat: ajout panneau #photoAnalysisPanel dans KZO_Inspect.html (z-index 2200)"
```

---

## Task 2 : `analyzePhotoField()` dans ai_agents.js

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/ai_agents.js:329-338` (remplacer le mock `analyzePhoto`)

- [ ] **Étape 1 — Lire le mock existant**

Lire `ai_agents.js` lignes 329-338. Le mock actuel :
```js
analyzePhoto: function() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ description: "...", recommendation: "..." });
        }, 1500);
    });
},
```

- [ ] **Étape 2 — Remplacer le mock par la vraie implémentation**

Remplacer tout le bloc `analyzePhoto: function() { ... },` (lignes 329-338) par :

```js
analyzePhoto: function() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({ description: "Analyse simulée (sans photo).", recommendation: "" });
        }, 500);
    });
},

// Analyse vision automatique d'une photo d'inspection
analyzePhotoField: async function(imageBase64, fieldLabel) {
    // Providers supportant la vision (extensible)
    const VISION_PROVIDERS = ['anthropic', 'gemini', 'openai'];

    const activeProvider = localStorage.getItem('inspectpro_api_provider') || 'gemini';
    const apiKey = localStorage.getItem('inspectpro_api_key');
    if (!apiKey) return null;

    // Si le provider actif ne supporte pas la vision, utiliser le premier de la liste
    const visionProvider = VISION_PROVIDERS.includes(activeProvider)
        ? activeProvider
        : VISION_PROVIDERS[0];

    // Override temporaire du provider pour cet agent
    const overrideKey = 'inspectpro_api_provider_vision_auto';
    const hadOverride = localStorage.getItem(overrideKey);
    localStorage.setItem(overrideKey, visionProvider);

    const systemPrompt = `Tu es un inspecteur en bâtiment certifié RBQ au Québec. Tu analyses des photos d'inspection de façon professionnelle et factuelle. Tu réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après.`;

    const userPrompt = `Analyse cette photo d'inspection pour l'élément : "${fieldLabel}".
Réponds en JSON strict avec exactement ces deux clés :
{"etat":"defaut|surveiller|conforme","description":"2 à 3 phrases professionnelles en français décrivant ce que tu observes et justifiant l'état choisi"}

Règles :
- "defaut" : anomalie visible nécessitant une intervention
- "surveiller" : état acceptable mais à surveiller
- "conforme" : aucune anomalie visible`;

    try {
        const raw = await AIAgents._callAI(
            systemPrompt,
            { text: userPrompt, imageBase64: imageBase64, mediaType: 'image/jpeg' },
            'vision_auto'
        );
        const parsed = AIAgents._extractJSON(raw);
        if (!parsed || !parsed.etat || !parsed.description) return null;
        if (!['defaut', 'surveiller', 'conforme'].includes(parsed.etat)) return null;
        return { etat: parsed.etat, description: parsed.description };
    } catch(e) {
        return null;
    } finally {
        // Nettoyer l'override temporaire
        if (hadOverride) {
            localStorage.setItem(overrideKey, hadOverride);
        } else {
            localStorage.removeItem(overrideKey);
        }
    }
},
```

- [ ] **Étape 3 — Vérifier la syntaxe**

Lire les lignes 328-400 de `ai_agents.js` et confirmer :
- `analyzePhoto` (mock réduit) toujours présent — ne pas le supprimer car il peut être référencé ailleurs
- `analyzePhotoField` présent avec `VISION_PROVIDERS`, gestion override provider, try/finally
- Fichier ne contient pas d'erreur de syntaxe JS visible (accolades équilibrées)

- [ ] **Étape 4 — Vérifier que analyzePhoto n'est pas supprimé**

```bash
grep -n "analyzePhoto" "C:/Users/jeane/Desktop/Amboul/JEC/ai_agents.js"
```
Résultat attendu : deux lignes — `analyzePhoto:` et `analyzePhotoField:`.

- [ ] **Étape 5 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add ai_agents.js
git commit -m "feat: analyzePhotoField() vision réelle — remplace mock, VISION_PROVIDERS extensible"
```

---

## Task 3 : `showPhotoAnalysis()` + hook galerie dans app.js

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

Cette task a deux parties :
- **3A** : Ajouter `showPhotoAnalysis()` après `showAiPreview()`
- **3B** : Ajouter le hook dans `fileInput.onchange` de la galerie (ligne ~1219)

### Partie 3A — Fonction `showPhotoAnalysis()`

- [ ] **Étape 1 — Localiser showAiPreview dans app.js**

```bash
grep -n "showAiPreview\|function showAiPreview" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -5
```

- [ ] **Étape 2 — Ajouter showPhotoAnalysis() juste après la fermeture de showAiPreview()**

Localiser la fermeture de `showAiPreview` :
```js
    }

    // Compression photo avant stockage localStorage
```
ou
```js
    }

    // Popup prévisualisation IA
```

Insérer la fonction `showPhotoAnalysis` APRÈS la fermeture `}` de `showAiPreview` et AVANT le commentaire suivant :

```js
    // Panneau analyse photo automatique IA
    function showPhotoAnalysis(subId, subTitle, imageBase64, result, onApply) {
        const panel = document.getElementById('photoAnalysisPanel');
        const titleEl = document.getElementById('photoAnalysisTitle');
        const badge = document.getElementById('photoAnalysisBadge');
        const thumb = document.getElementById('photoAnalysisThumb');
        const textEl = document.getElementById('photoAnalysisText');
        const ignoreBtn = document.getElementById('photoAnalysisIgnore');
        const applyBtn = document.getElementById('photoAnalysisApply');

        if (!panel) return;

        // Remplir le contenu
        titleEl.textContent = '🔍 Analyse IA — ' + subTitle;
        textEl.textContent = result.description; // textContent — pas d'injection HTML

        // Badge selon état détecté
        const badgeConfig = {
            defaut:    { bg: '#dc2626', text: '❌ DÉFAUT DÉTECTÉ' },
            surveiller:{ bg: '#d97706', text: '⚠️ À SURVEILLER' },
            conforme:  { bg: '#059669', text: '✅ CONFORME' }
        };
        const cfg = badgeConfig[result.etat] || { bg: '#64748b', text: result.etat.toUpperCase() };
        badge.style.background = cfg.bg;
        badge.textContent = cfg.text;

        // Miniature
        if (imageBase64) {
            thumb.src = 'data:image/jpeg;base64,' + imageBase64;
            thumb.style.display = 'block';
        } else {
            thumb.style.display = 'none';
        }

        panel.style.display = 'flex';

        // Cloner les boutons pour nettoyer les anciens listeners
        const newIgnore = ignoreBtn.cloneNode(true);
        const newApply = applyBtn.cloneNode(true);
        ignoreBtn.parentNode.replaceChild(newIgnore, ignoreBtn);
        applyBtn.parentNode.replaceChild(newApply, applyBtn);

        newIgnore.addEventListener('click', () => { panel.style.display = 'none'; });
        newApply.addEventListener('click', () => {
            panel.style.display = 'none';
            onApply(result.etat);
        });
    }

```

### Partie 3B — Hook dans la galerie upload

- [ ] **Étape 3 — Lire fileInput.onchange dans app.js**

Lire `app.js` lignes 1219-1237. Le code actuel :
```js
fileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    for (const file of files) {
        const check = validateFile(file);
        if (check.valid) {
            const dataUrl = await compressImage(file, 1200, 0.75);
            const store = getActiveSectionPhotos();
            if (!store[sub.id]) store[sub.id] = [];
            store[sub.id].push({ url: dataUrl });
            saveAppState();
        } else {
            showToast(check.error, 'error');
        }
    }
    renderGallery();
    fileInput.value = '';
};
```

- [ ] **Étape 4 — Remplacer fileInput.onchange avec le hook IA**

Remplacer le bloc `fileInput.onchange = async (e) => { ... };` par :

```js
fileInput.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    for (const file of files) {
        const check = validateFile(file);
        if (check.valid) {
            const dataUrl = await compressImage(file, 1200, 0.75);
            const store = getActiveSectionPhotos();
            if (!store[sub.id]) store[sub.id] = [];
            store[sub.id].push({ url: dataUrl });
            saveAppState();

            // Analyse IA automatique de la photo
            const base64Only = dataUrl.split(',')[1];
            AIAgents.analyzePhotoField(base64Only, sub.title)
                .then(result => {
                    if (!result) return;
                    showPhotoAnalysis(
                        sub.id,
                        sub.title,
                        base64Only,
                        result,
                        (etatSuggere) => {
                            // Appliquer l'état IA à tous les champs checkbox de la sous-section
                            sub.fields.forEach(f => {
                                if (f.type === 'checkbox') {
                                    inspectionData.fieldStates[f.id] = etatSuggere;
                                }
                            });
                            saveAppState();
                            showToast('État mis à jour selon la suggestion IA — vérifiez chaque champ.', 'info');
                        }
                    );
                })
                .catch(() => {
                    showToast('Analyse IA indisponible pour cette photo.', 'warning');
                });

        } else {
            showToast(check.error, 'error');
        }
    }
    renderGallery();
    fileInput.value = '';
};
```

- [ ] **Étape 5 — Vérifier le code modifié**

Lire les lignes modifiées dans `app.js` et confirmer :
- `AIAgents.analyzePhotoField(base64Only, sub.title)` est appelé APRÈS `saveAppState()` (l'upload ne dépend pas de l'analyse)
- `showPhotoAnalysis(...)` est appelé dans `.then()` (asynchrone — ne bloque pas)
- En cas d'erreur, `.catch()` affiche un toast discret
- `renderGallery()` et `fileInput.value = ''` sont toujours exécutés (pas affectés par l'async)

- [ ] **Étape 6 — Test manuel**

Ouvrir `http://localhost:8000`. Aller dans une section d'inspection (ex: "Extérieur & Structure"). Cliquer "＋ Ajouter des photos" et sélectionner une photo. Confirmer :
1. La photo s'affiche dans la galerie immédiatement (upload fonctionnel)
2. Après ~3-5 secondes, le panneau `#photoAnalysisPanel` s'ouvre avec titre, badge coloré, description
3. Bouton "Ignorer" → panneau fermé, aucun champ modifié
4. Re-tester : bouton "✓ Appliquer" → panneau fermé + toast "État mis à jour"

- [ ] **Étape 7 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: showPhotoAnalysis() + hook analyse IA auto dans galerie photos sous-section"
```

---

## Task 4 : Bump versions + push GitHub

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/sw.js`

- [ ] **Étape 1 — Bumper les versions dans KZO_Inspect.html**

Lire `KZO_Inspect.html`. Incrémenter de +1 :
- `ai_agents.js?v=N` → `v=N+1`
- `app.js?v=N` → `v=N+1`

- [ ] **Étape 2 — Bumper CACHE_NAME dans sw.js**

Lire `sw.js` ligne 1. Remplacer la version actuelle par la version suivante (ex: `v17` → `v18`).

- [ ] **Étape 3 — Vérifier**

```bash
grep "CACHE_NAME\|ai_agents.js\|app.js" "C:/Users/jeane/Desktop/Amboul/JEC/sw.js" "C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html" | grep -v ".git"
```
Confirmer que les versions sont bien incrémentées.

- [ ] **Étape 4 — Commit et push**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add KZO_Inspect.html sw.js
git commit -m "chore: bump cache PWA + versions scripts analyse photo IA auto"
git push
```
