# Analyse Photo Automatique — Spec de design
**Projet :** JEC / KZO InspectPro
**Date :** 2026-05-02
**Statut :** Approuvé par l'utilisateur

---

## Objectif

À chaque upload de photo dans un champ d'inspection, l'IA vision analyse automatiquement l'image et affiche ses conclusions dans un panneau. L'inspecteur peut appliquer la suggestion de l'IA ou l'ignorer — le jugement final reste toujours à l'inspecteur.

---

## Contraintes

- L'analyse se déclenche **automatiquement** après chaque upload — aucune action manuelle requise
- L'inspecteur a **toujours la main** : bouton "Ignorer" ou "Appliquer"
- Si aucune clé API n'est configurée → upload fonctionne normalement, analyse silencieusement ignorée
- Si erreur IA → toast discret, upload préservé, aucun blocage
- Groq ne supporte pas la vision → fallback automatique vers un provider vision compatible (Gemini, OpenAI, Anthropic)
- `sanitizeHTML()` sur toute réponse IA insérée dans le DOM

---

## Architecture des fichiers

| Fichier | Modification |
|---------|-------------|
| `KZO_Inspect.html` | Ajout `<div id="photoAnalysisPanel">` + bump versions |
| `ai_agents.js` | Ajout `AIAgents.analyzePhotoField(imageBase64, fieldLabel)` |
| `app.js` | Ajout `showPhotoAnalysis()` + hook dans le handler photo existant |
| `sw.js` | Bump `CACHE_NAME` v17 → v18 |

---

## Panneau `#photoAnalysisPanel`

### Structure HTML (à ajouter dans `KZO_Inspect.html`)

```html
<div id="photoAnalysisPanel" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.88); z-index:2200; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
    <div style="background:white; width:95%; max-width:560px; border-radius:12px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
        <div style="padding:18px 24px; background:#0f172a; color:white; display:flex; justify-content:space-between; align-items:center;">
            <h3 id="photoAnalysisTitle" style="margin:0; font-size:1rem;">🔍 Analyse IA</h3>
            <span id="photoAnalysisBadge" style="padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:700;"></span>
        </div>
        <div style="padding:24px;">
            <img id="photoAnalysisThumb" style="width:100%; max-height:200px; object-fit:cover; border-radius:8px; margin-bottom:16px; display:none;">
            <p id="photoAnalysisText" style="color:#334155; line-height:1.7; font-size:0.95rem; margin-bottom:16px;"></p>
            <div style="padding:12px 16px; background:#fffbeb; border-left:4px solid #d97706; border-radius:6px; font-size:0.85rem; color:#92400e; margin-bottom:20px;">
                ⚠️ Cette analyse est indicative. Votre jugement professionnel prévaut toujours.
            </div>
        </div>
        <div style="padding:16px 24px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:12px;">
            <button id="photoAnalysisIgnore" style="padding:8px 20px; background:white; border:1px solid #cbd5e1; color:#475569; border-radius:6px; cursor:pointer;">Ignorer</button>
            <button id="photoAnalysisApply" style="padding:8px 20px; background:#1d4ed8; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:700;">✓ Appliquer la suggestion</button>
        </div>
    </div>
</div>
```

### Badge couleur selon état détecté
| État | Couleur badge | Texte badge |
|------|--------------|-------------|
| `defaut` | `#dc2626` (rouge) | ❌ DÉFAUT DÉTECTÉ |
| `surveiller` | `#d97706` (orange) | ⚠️ À SURVEILLER |
| `conforme` | `#059669` (vert) | ✅ CONFORME |

---

## Nouvelle fonction `AIAgents.analyzePhotoField(imageBase64, fieldLabel)`

### Localisation
Ajoutée dans `ai_agents.js` avant la fermeture `};`, après `generateFullReport`.

### Logique
1. Vérifie qu'une clé API est configurée — si non, retourne `null` silencieusement
2. Détermine le provider à utiliser :
   - Si provider actif = `'groq'` → utilise `'gemini'` en fallback (Groq ne supporte pas la vision)
   - Sinon → utilise le provider actif
3. Construit le prompt vision :
```
Tu es un inspecteur en bâtiment certifié RBQ au Québec.
Analyse cette photo d'inspection pour le champ : "[fieldLabel]".
Réponds UNIQUEMENT en JSON valide sans aucun texte autour :
{"etat":"defaut|surveiller|conforme","description":"2-3 phrases professionnelles en français décrivant ce que tu observes et pourquoi tu as choisi cet état"}
```
4. Appelle `AIAgents._callAI(systemPrompt, { text: prompt, imageBase64, mediaType: 'image/jpeg' }, 'vision_auto')`
5. Parse la réponse JSON via `AIAgents._extractJSON()` existant
6. Retourne `{ etat: 'defaut'|'surveiller'|'conforme', description: string }` ou `null` si erreur

### Signature
```js
analyzePhotoField: async function(imageBase64, fieldLabel)
// Retourne : { etat: string, description: string } | null
```

---

## Nouvelle fonction `showPhotoAnalysis(fieldId, fieldLabel, imageBase64, result, onApply)`

### Localisation
Ajoutée dans `app.js` après `showAiPreview()`.

### Logique
1. Récupère les éléments DOM du panneau `#photoAnalysisPanel`
2. Remplit `#photoAnalysisTitle` avec `'🔍 Analyse IA — ' + fieldLabel`
3. Affiche la miniature dans `#photoAnalysisThumb` (src = `'data:image/jpeg;base64,' + imageBase64`)
4. Remplit `#photoAnalysisText` avec `sanitizeHTML(result.description)`
5. Colore `#photoAnalysisBadge` selon `result.etat`
6. Affiche le panneau (`display: 'flex'`)
7. Clone les boutons pour nettoyer les listeners (même pattern que `showAiPreview`)
8. "Ignorer" → ferme le panneau
9. "Appliquer" → ferme le panneau + appelle `onApply(result.etat)`

### Signature
```js
function showPhotoAnalysis(fieldId, fieldLabel, imageBase64, result, onApply)
```

---

## Modification du handler photo dans `app.js`

### Localisation
Dans la boucle de rendu des champs, là où `field.type === 'file'` est géré et où `compressImage()` est appelé.

### Modification
Après `compressImage(file).then(base64 => { ... saveAppState(); })`, ajouter :

```js
// Analyse IA automatique si clé API disponible
const apiKey = localStorage.getItem('inspectpro_api_key');
if (apiKey) {
    AIAgents.analyzePhotoField(base64.split(',')[1], field.label)
        .then(result => {
            if (!result) return;
            showPhotoAnalysis(
                field.id,
                field.label,
                base64.split(',')[1],
                result,
                (etatSuggere) => {
                    // Appliquer l'état suggéré au champ
                    inspectionData.fieldStates[field.id] = etatSuggere;
                    saveAppState();
                    // Mettre à jour visuellement le dropdown du champ si visible
                    const select = document.getElementById('state_' + field.id);
                    if (select) select.value = etatSuggere;
                    showToast('État mis à jour selon la suggestion IA.', 'success');
                }
            );
        })
        .catch(() => {
            showToast('Analyse IA indisponible pour cette photo.', 'warning');
        });
}
```

---

## Flux complet

```
1. Inspecteur prend/upload une photo
2. compressImage() → base64
3. Sauvegarde dans inspectionData + affichage miniature
4. [NOUVEAU] analyzePhotoField(base64, fieldLabel) appelé en arrière-plan
5. Panneau s'ouvre avec : miniature + état IA + description
6a. Inspecteur clique "Ignorer" → panneau fermé, son état existant conservé
6b. Inspecteur clique "Appliquer" → inspectionData.fieldStates[fieldId] = etatIA
7. saveAppState()
```

---

## Tests de validation

- [ ] Upload d'une photo avec clé API configurée → panneau s'ouvre automatiquement
- [ ] Upload sans clé API → aucun panneau, aucune erreur, upload fonctionnel
- [ ] Bouton "Ignorer" → panneau fermé, état du champ inchangé
- [ ] Bouton "Appliquer" → état du champ = état détecté par l'IA, dropdown mis à jour
- [ ] Provider Groq actif → analyse via Gemini (fallback vision)
- [ ] Erreur API → toast "Analyse IA indisponible", upload préservé
- [ ] `sanitizeHTML()` appliqué sur la description IA
- [ ] Panneau z-index 2200 (au-dessus de aiPreviewModal z-index 2100)
