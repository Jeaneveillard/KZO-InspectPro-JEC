# Agent Rapport Intelligent — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter deux niveaux de génération IA dans KZO InspectPro — synthèse par section et rapport complet — avec popup prévisualisation et bouton "Insérer".

**Architecture:** Deux nouvelles fonctions dans `AIAgents` (`ai_agents.js`) appellent `AIAgents.askAssistant()` avec des prompts REIBH 2024. `app.js` ajoute les boutons dans `renderSection()` et la top-bar, et gère la popup modale de prévisualisation. Aucun nouveau fichier créé.

**Tech Stack:** JavaScript vanilla, localStorage, pattern AIAgents existant, pattern modal existant (reportModal)

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `KZO_Inspect.html` | Ajout modale `#aiPreviewModal` + bouton `#iaRapportBtn` dans top-bar |
| `ai_agents.js` | Ajout `generateSectionSynthesis()` et `generateFullReport()` avant `};` (ligne 1015) |
| `app.js` | Ajout bouton "✨ IA Synthèse" dans `renderSection()` + logique popup (insert/cancel) |
| `sw.js` | Bump `CACHE_NAME` : `kzo-inspect-v15` → `kzo-inspect-v16` |

---

## Task 1 : Modale IA preview + bouton global dans KZO_Inspect.html

**Files:**
- Modify: `KZO_Inspect.html:80-83` (top-bar — ajouter bouton)
- Modify: `KZO_Inspect.html:191` (avant `reportModal` — ajouter aiPreviewModal)

- [ ] **Étape 1 — Ajouter le bouton "✨ IA Rapport" dans la top-bar**

Localiser ce bloc dans `KZO_Inspect.html` (ligne ~80) :
```html
<button class="assistant-btn" id="assistantBtn">
    ✨ Assistant IA
</button>
```
Le remplacer par :
```html
<button class="assistant-btn" id="assistantBtn">
    ✨ Assistant IA
</button>
<button class="assistant-btn" id="iaRapportBtn" style="margin-left:8px; background:linear-gradient(135deg,#059669,#0d9488);">
    📄 IA Rapport
</button>
```

- [ ] **Étape 2 — Ajouter la modale `#aiPreviewModal` dans KZO_Inspect.html**

Localiser ce commentaire juste avant `reportModal` (ligne ~192) :
```html
    <div id="reportModal"
```
Insérer AVANT cette ligne :
```html
    <!-- Modale prévisualisation IA -->
    <div id="aiPreviewModal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.88); z-index:2100; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
        <div style="background:white; width:95%; max-width:700px; max-height:85vh; border-radius:12px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <div style="padding:20px 28px; background:#f8fafc; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center;">
                <h2 id="aiPreviewTitle" style="color:#0f172a; margin:0; font-size:1.1rem;">✨ Synthèse IA</h2>
                <button id="closeAiPreviewBtn" style="padding:6px 14px; background:white; border:1px solid #cbd5e1; color:#475569; border-radius:6px; cursor:pointer; font-size:0.9rem;">✕ Fermer</button>
            </div>
            <div id="aiPreviewContent" style="flex:1; overflow-y:auto; padding:28px; font-family:'Inter',sans-serif; line-height:1.8; color:#1e293b; white-space:pre-wrap; font-size:0.95rem;"></div>
            <div style="padding:16px 28px; background:#f8fafc; border-top:1px solid #e2e8f0; display:flex; justify-content:flex-end; gap:12px;">
                <button id="cancelAiPreviewBtn" style="padding:8px 20px; background:white; border:1px solid #cbd5e1; color:#475569; border-radius:6px; cursor:pointer;">Annuler</button>
                <button id="insertAiPreviewBtn" style="padding:8px 20px; background:#1d4ed8; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:700;">✓ Insérer</button>
            </div>
        </div>
    </div>

```

- [ ] **Étape 3 — Vérifier dans le navigateur**

Ouvrir `http://localhost:8000`. Vérifier que :
- Le bouton "📄 IA Rapport" apparaît dans la top-bar à droite de "✨ Assistant IA"
- Cliquer "📄 IA Rapport" ne fait rien (pas encore câblé) — pas d'erreur console

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add KZO_Inspect.html
git commit -m "feat: ajout modale aiPreviewModal + bouton IA Rapport dans top-bar"
```

---

## Task 2 : `generateSectionSynthesis()` dans ai_agents.js

**Files:**
- Modify: `ai_agents.js:1013-1015` (insérer avant `};` final)

- [ ] **Étape 1 — Ajouter la fonction dans l'objet AIAgents**

Localiser la dernière ligne de l'objet AIAgents dans `ai_agents.js` :
```js
    }

};
```
Remplacer par :
```js
    },

    // Génère une synthèse narrative pour une section d'inspection
    generateSectionSynthesis: async function(section, sectionIndex) {
        const defauts = [];
        const surveiller = [];
        let conformeCount = 0;

        section.subSections.forEach(sub => {
            sub.fields.forEach(f => {
                if (f.type !== 'checkbox') return;
                const state = (inspectionData.fieldStates || {})[f.id];
                if (state === 'defaut') defauts.push(f.label);
                else if (state === 'surveiller') surveiller.push(f.label);
                else if (state === 'conforme') conformeCount++;
            });
        });

        const secKey = 'section_' + sectionIndex;
        const notesUnit = (inspectionData.sectionComments || {})[secKey];
        const notesExistantes = notesUnit ? (notesUnit.text || '') : '';

        if (defauts.length === 0 && surveiller.length === 0) {
            return `Section "${section.title}" — Aucun défaut ni élément à surveiller n'a été coché. Tous les éléments visibles et accessibles apparaissent en état général satisfaisant au moment de l'inspection.`;
        }

        const parts = [];
        if (defauts.length > 0) parts.push(`Défauts détectés (${defauts.length}) : ${defauts.join(' / ')}`);
        if (surveiller.length > 0) parts.push(`Éléments à surveiller (${surveiller.length}) : ${surveiller.join(' / ')}`);
        if (conformeCount > 0) parts.push(`Éléments conformes : ${conformeCount}`);
        if (notesExistantes) parts.push(`Notes de l'inspecteur : ${notesExistantes}`);

        const prompt = `Tu es un inspecteur en bâtiment certifié RBQ au Québec, rédigeant un rapport selon la norme REIBH 2024 et BNQ 3009-500.\n\nSection inspectée : "${section.title}"\n${parts.join('\n')}\n\nRédige un paragraphe de synthèse professionnel en français québécois (voix impersonnelle, style AIBQ) qui :\n1. Décrit les défauts observés et leur nature\n2. Évalue la sévérité globale (URGENT / MAJEUR / À SURVEILLER selon la gravité)\n3. Recommande les actions correctives et le type de spécialiste à consulter\n4. Conclut par : "Cette observation est basée sur une inspection visuelle et non destructive selon REIBH 2024."\n\nLongueur : 150 à 250 mots. Ton : factuel, professionnel, non alarmiste. Ne pas inventer de défauts non mentionnés.`;

        return await AIAgents.askAssistant(prompt);
    },

    // Génère un rapport narratif complet de toute l'inspection
    generateFullReport: async function() {
        const clientName = inspectionData.clientInfo.name || 'Client';
        const address = inspectionData.clientInfo.address || 'Adresse non renseignée';
        const inspectorName = inspectionData.clientInfo.inspectorName || 'Inspecteur';
        const inspDate = inspectionData['inspection_date'] || new Date().toLocaleDateString('fr-CA');
        const propType = (typeof document !== 'undefined' && document.getElementById('prop_type'))
            ? document.getElementById('prop_type').value || 'Non précisé'
            : 'Non précisé';
        const norme = (typeof document !== 'undefined' && document.getElementById('norme_pratique'))
            ? document.getElementById('norme_pratique').value || 'REIBH 2024'
            : 'REIBH 2024';

        const sectionsResume = [];
        let hasAnyField = false;

        inspectionData.sections.forEach((section, idx) => {
            if (section.id === 's_cover' || section.id === 's_admin') return;
            const defauts = [], surveiller = [];
            section.subSections.forEach(sub => {
                sub.fields.forEach(f => {
                    if (f.type !== 'checkbox') return;
                    const state = (inspectionData.fieldStates || {})[f.id];
                    if (state === 'defaut') { defauts.push(f.label); hasAnyField = true; }
                    else if (state === 'surveiller') { surveiller.push(f.label); hasAnyField = true; }
                });
            });
            if (defauts.length > 0 || surveiller.length > 0) {
                sectionsResume.push(`## ${section.title}\n- Défauts (${defauts.length}) : ${defauts.join(' / ') || 'aucun'}\n- Surveillance (${surveiller.length}) : ${surveiller.join(' / ') || 'aucun'}`);
            }
        });

        if (!hasAnyField) {
            return 'Aucun champ n\'a été renseigné. Veuillez remplir au moins une section d\'inspection avant de générer le rapport narratif.';
        }

        const prompt = `Tu es un inspecteur en bâtiment certifié RBQ au Québec, rédigeant le rapport final selon REIBH 2024 et BNQ 3009-500.\n\nInformations générales :\n- Client : ${clientName}\n- Adresse : ${address}\n- Date : ${inspDate}\n- Inspecteur : ${inspectorName}\n- Type de bâtiment : ${propType}\n- Norme de pratique : ${norme}\n\nRésumé de l'inspection par section :\n${sectionsResume.join('\n\n')}\n\nGénère un rapport narratif complet comprenant :\n1. Introduction (nature visuelle non invasive, portée de l'inspection)\n2. Synthèse par section (un paragraphe par section avec défauts et recommandations)\n3. Points critiques prioritaires classés URGENT > MAJEUR > À SURVEILLER\n4. Conclusion et recommandations générales\n5. Mention légale REIBH 2024\n\nStyle : voix impersonnelle, factuelle, professionnelle. Langue : français québécois. Longueur : 500 à 800 mots. Ne pas inventer de défauts non mentionnés.`;

        return await AIAgents.askAssistant(prompt);
    }

};
```

- [ ] **Étape 2 — Vérifier la syntaxe dans la console**

Ouvrir `http://localhost:8000`, ouvrir les DevTools (F12) → Console.
Taper :
```js
typeof AIAgents.generateSectionSynthesis
typeof AIAgents.generateFullReport
```
Résultat attendu : `"function"` pour les deux. Si erreur de syntaxe, corriger avant de continuer.

- [ ] **Étape 3 — Commit**

```bash
git add ai_agents.js
git commit -m "feat: ajout generateSectionSynthesis() et generateFullReport() dans AIAgents"
```

---

## Task 3 : Fonction `showAiPreview()` dans app.js  ← AVANT les boutons qui l'appellent

**Files:**
- Modify: `app.js:1323-1392` (bloc `secCommentBlock` dans `renderSection()`)

- [ ] **Étape 1 — Ajouter le bouton dans le header du secCommentBlock**

Localiser dans `app.js` (ligne ~1329) ce innerHTML :
```js
            secCommentBlock.innerHTML = `
                <div style="font-weight: 700; font-size: 1rem; color: #1e40af; margin-bottom: 12px;">🗂️ Commentaire global — ${section.title}</div>
```
Remplacer par :
```js
            secCommentBlock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                    <div style="font-weight:700; font-size:1rem; color:#1e40af;">🗂️ Commentaire global — ${section.title}</div>
                    <button type="button" id="ia_synthese_${index}" style="padding:6px 14px; background:linear-gradient(135deg,#059669,#0d9488); color:white; border:none; border-radius:20px; font-size:0.8rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px;">
                        ✨ IA Synthèse
                    </button>
                </div>
```

- [ ] **Étape 2 — Câbler le bouton après le bloc secCommentBlock**

Localiser dans `app.js` (ligne ~1391) juste après :
```js
            const secTxtArea = secCommentBlock.querySelector('#sec_txt_' + secId);
            secTxtArea.addEventListener('input', () => {
                const activeSec = getActiveSectionComments();
                if (!activeSec[secId]) activeSec[secId] = {};
                activeSec[secId].text = secTxtArea.value;
                saveAppState();
            });
        }
```
Ajouter AVANT la fermeture `}` du bloc `if (!section.isCoverPage)` :
```js
            // Bouton IA Synthèse — génère un paragraphe pour cette section
            const iaSyntheseBtn = secCommentBlock.querySelector('#ia_synthese_' + index);
            if (iaSyntheseBtn) {
                iaSyntheseBtn.addEventListener('click', async () => {
                    iaSyntheseBtn.textContent = '⏳ Génération...';
                    iaSyntheseBtn.disabled = true;
                    try {
                        const texte = await AIAgents.generateSectionSynthesis(section, index);
                        showAiPreview(
                            '✨ Synthèse IA — ' + section.title,
                            texte,
                            () => {
                                // Action Insérer : écrire dans sectionComments + textarea
                                const activeSec = getActiveSectionComments();
                                if (!activeSec[secId]) activeSec[secId] = {};
                                activeSec[secId].text = texte;
                                saveAppState();
                                const ta = secCommentBlock.querySelector('#sec_txt_' + secId);
                                if (ta) { ta.value = texte; ta.dispatchEvent(new Event('input')); }
                                showToast('Synthèse insérée dans le commentaire de section.', 'success');
                            }
                        );
                    } catch(err) {
                        showToast('Erreur IA : ' + err.message, 'error');
                    } finally {
                        iaSyntheseBtn.textContent = '✨ IA Synthèse';
                        iaSyntheseBtn.disabled = false;
                    }
                });
            }
```

- [ ] **Étape 3 — Vérifier dans le navigateur**

Ouvrir `http://localhost:8000`. Naviguer vers n'importe quelle section (ex: "Extérieur & Structure"). Vérifier que le bouton "✨ IA Synthèse" apparaît dans le bandeau bleu "Commentaire global". Il doit être vert.

- [ ] **Étape 4 — Commit**

```bash
git add app.js
git commit -m "feat: ajout bouton IA Synthèse par section dans renderSection()"
```

---

## Task 4 : Bouton "✨ IA Synthèse" par section + bouton global "📄 IA Rapport" — app.js

**Files:**
- Modify: `app.js` — ajouter `showAiPreview()` après `showToast()` (ligne ~37)

- [ ] **Étape 1 — Ajouter la fonction showAiPreview()**

Localiser dans `app.js` (ligne ~37) juste après la fermeture de `showToast` :
```js
    }

    // Compression photo avant stockage localStorage
```
Insérer entre ces deux blocs :
```js
    // Popup prévisualisation IA — title: string, text: string, onInsert: Function
    function showAiPreview(title, text, onInsert) {
        const modal = document.getElementById('aiPreviewModal');
        const titleEl = document.getElementById('aiPreviewTitle');
        const contentEl = document.getElementById('aiPreviewContent');
        const insertBtn = document.getElementById('insertAiPreviewBtn');
        const cancelBtn = document.getElementById('cancelAiPreviewBtn');
        const closeBtn = document.getElementById('closeAiPreviewBtn');

        if (!modal) return;

        titleEl.textContent = title;
        contentEl.textContent = text; // textContent — pas d'injection HTML

        modal.style.display = 'flex';

        // Nettoyer les anciens listeners en clonant les boutons
        const newInsert = insertBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        const newClose = closeBtn.cloneNode(true);
        insertBtn.parentNode.replaceChild(newInsert, insertBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        closeBtn.parentNode.replaceChild(newClose, closeBtn);

        newInsert.addEventListener('click', () => {
            modal.style.display = 'none';
            onInsert();
        });
        newCancel.addEventListener('click', () => { modal.style.display = 'none'; });
        newClose.addEventListener('click', () => { modal.style.display = 'none'; });
    }

```

- [ ] **Étape 2 — Vérifier que la popup s'ouvre correctement**

Dans la console du navigateur, tester :
```js
// Simuler l'ouverture (depuis la console)
document.getElementById('aiPreviewModal').style.display = 'flex';
document.getElementById('aiPreviewTitle').textContent = 'Test';
document.getElementById('aiPreviewContent').textContent = 'Texte de test...';
```
Résultat attendu : popup verte/bleue visible. Bouton "✕ Fermer" la ferme.

- [ ] **Étape 3 — Câbler le bouton global "📄 IA Rapport" dans app.js**

Localiser dans `app.js` (ligne ~442) le bloc qui câble `assistantBtn` :
```js
    const cpModal = document.getElementById('companyProfileModal');
```
Ajouter AVANT ce bloc :
```js
    // Bouton IA Rapport Complet (top-bar)
    const iaRapportBtn = document.getElementById('iaRapportBtn');
    if (iaRapportBtn) {
        iaRapportBtn.addEventListener('click', async () => {
            iaRapportBtn.textContent = '⏳ Génération...';
            iaRapportBtn.disabled = true;
            try {
                const texte = await AIAgents.generateFullReport();
                showAiPreview(
                    '📄 Rapport Narratif Complet IA',
                    texte,
                    () => {
                        inspectionData.rapportNarratifIA = texte;
                        saveAppState();
                        showToast('Rapport narratif sauvegardé. Il sera inclus à l\'export PDF.', 'success');
                    }
                );
            } catch(err) {
                showToast('Erreur IA : ' + err.message, 'error');
            } finally {
                iaRapportBtn.textContent = '📄 IA Rapport';
                iaRapportBtn.disabled = false;
            }
        });
    }

```

- [ ] **Étape 4 — Test de bout en bout : synthèse section**

1. Ouvrir `http://localhost:8000`
2. Aller dans "Extérieur & Structure", cocher 2-3 défauts
3. Cliquer "✨ IA Synthèse" → attendre ~5s
4. Vérifier la popup : titre correct, texte en français, ≥ 150 mots
5. Cliquer "✓ Insérer" → vérifier que le texte apparaît dans la textarea "Commentaire global"
6. Vérifier le toast "Synthèse insérée"

- [ ] **Étape 5 — Test de bout en bout : rapport complet**

1. Remplir quelques sections avec des défauts
2. Cliquer "📄 IA Rapport" dans la top-bar → attendre ~10s
3. Vérifier la popup : titre "📄 Rapport Narratif Complet IA", texte ≥ 500 mots
4. Cliquer "✓ Insérer" → vérifier le toast de confirmation
5. Ouvrir la console → `console.log(inspectionData.rapportNarratifIA)` → texte présent

- [ ] **Étape 6 — Test cas limites**

- Section sans aucun défaut coché → "✨ IA Synthèse" doit retourner un texte de conformité (pas d'erreur)
- Aucun champ rempli, cliquer "📄 IA Rapport" → message "Veuillez remplir au moins une section"
- Pas de clé API configurée → toast d'erreur "Aucune clé API configurée"

- [ ] **Étape 7 — Commit**

```bash
git add app.js
git commit -m "feat: showAiPreview() + logique insert section/rapport + câblage bouton global"
```

---

## Task 5 : Bump versions PWA + commit final

**Files:**
- Modify: `KZO_Inspect.html` — bump `?v=N` sur `ai_agents.js` et `app.js`
- Modify: `sw.js` — bump `CACHE_NAME`

- [ ] **Étape 1 — Bumper les versions dans KZO_Inspect.html**

Localiser les balises script dans `KZO_Inspect.html` :
```html
<script src="ai_agents.js?v=
<script src="app.js?v=
```
Incrémenter les numéros de version de +1 pour chaque fichier modifié.

- [ ] **Étape 2 — Bumper CACHE_NAME dans sw.js**

Localiser dans `sw.js` ligne 1 :
```js
const CACHE_NAME = 'kzo-inspect-v15';
```
Remplacer par :
```js
const CACHE_NAME = 'kzo-inspect-v16';
```

- [ ] **Étape 3 — Vérifier le rechargement du cache**

1. Ouvrir `http://localhost:8000`
2. Ouvrir DevTools → Application → Service Workers → cliquer "Update"
3. Vérifier dans "Cache Storage" que `kzo-inspect-v16` est présent et `kzo-inspect-v15` a disparu

- [ ] **Étape 4 — Commit final**

```bash
git add KZO_Inspect.html sw.js
git commit -m "chore: bump cache PWA v15→v16 après ajout Agent Rapport Intelligent"
```
