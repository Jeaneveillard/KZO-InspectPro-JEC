# Groupe A — Rapport PDF enrichi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir le rapport PDF avec un Sommaire Exécutif numéroté, des badges #N par défaut, la durée de vie des équipements + spécialiste recommandé, et les champs pyrrhotite.

**Architecture:** `AIAgents.getSpecialist()` dans `ai_agents.js`. Helpers `_buildNumberedDefects()`, `_buildLifespanItems()` dans `app.js` avant `generateFinalReport()`. Le Sommaire existant (lignes ~2419-2455) est enrichi avec la liste numérotée et le tableau de durée de vie. Chaque défaut dans les sections reçoit un badge `#N`. `data.js` reçoit 3 champs pyrrhotite.

**Tech Stack:** JavaScript vanilla, EQUIPMENT_LIFESPAN existant (ai_agents.js), AIAgents.determineSeverity existant

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `data.js` | +3 champs pyrrhotite dans ss_da_2 |
| `ai_agents.js` | +`AIAgents.getSpecialist(label)` |
| `app.js` | +`AGE_TO_LIFESPAN`, +`TO_AGE_MAP`, +`_buildNumberedDefects()`, +`_buildLifespanItems()`, modif `generateFinalReport()` |
| `KZO_Inspect.html` | Bump `?v=` app.js et ai_agents.js |
| `sw.js` | Bump CACHE_NAME v18→v19 |

---

## Task 1 : Pyrrhotite dans data.js

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/data.js`

- [ ] **Étape 1 — Lire data.js section 11**

```bash
grep -n "ss_da_2\|Plomb et Pyrite\|da_pyrite\|da_plomb" "C:/Users/jeane/Desktop/Amboul/JEC/data.js" | head -10
```

- [ ] **Étape 2 — Modifier le titre de ss_da_2 et ajouter les 3 champs**

Localiser dans `data.js` :
```js
            { id: "ss_da_2", title: "Plomb et Pyrite", fields: [
```
Remplacer par :
```js
            { id: "ss_da_2", title: "Plomb, Pyrite et Pyrrhotite", fields: [
```

Localiser la dernière entrée de `ss_da_2` :
```js
                { id: "da_pyrite", type: "checkbox", label: "DANGER PYRITE : Soulèvement ou fissuration du plancher de béton au sous-sol — Test de laboratoire recommandé" }
```
Remplacer par :
```js
                { id: "da_pyrite", type: "checkbox", label: "DANGER PYRITE : Soulèvement ou fissuration du plancher de béton au sous-sol — Test de laboratoire recommandé" },
                { id: "da_pyrrhotite", type: "checkbox", label: "DANGER PYRRHOTITE : Soulèvement ou fissuration du plancher de béton — Maisons 1960-1990 en Estrie, Beauce ou Chaudière-Appalaches — Test de laboratoire obligatoire" },
                { id: "da_pyrrhotite_region", type: "select", label: "Région à risque pyrrhotite", options: ["Non applicable", "Estrie", "Beauce", "Chaudière-Appalaches", "Autre région — Vérifier"] },
                { id: "da_pyrrhotite_note", type: "text", label: "Notes pyrrhotite", placeholder: "Observations visuelles, date de construction suspectée..." }
```

- [ ] **Étape 3 — Vérifier**

```bash
grep -n "da_pyrrhotite\|Pyrrhotite" "C:/Users/jeane/Desktop/Amboul/JEC/data.js"
```
Résultat attendu : 4 lignes.

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add data.js
git commit -m "feat: data.js — pyrrhotite (3 champs) dans section 11 Matières Dangereuses"
```

---

## Task 2 : AIAgents.getSpecialist() dans ai_agents.js

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/ai_agents.js`

- [ ] **Étape 1 — Localiser la fin de l'objet AIAgents**

```bash
grep -n "generateFullReport\|return { etat\|^};" "C:/Users/jeane/Desktop/Amboul/JEC/ai_agents.js" | tail -5
```

Localiser la dernière ligne `};` qui ferme l'objet AIAgents.

- [ ] **Étape 2 — Ajouter getSpecialist() avant la fermeture `};`**

Localiser :
```js
    generateFullReport: async function() {
```

Juste AVANT `generateFullReport`, insérer :

```js
    // Mappe un label de défaut vers le type de spécialiste à consulter
    getSpecialist: function(label) {
        const l = (label || '').toLowerCase();
        if (/fondation|structure|soulèvement|fissure horiz|pilotis|pyrite|pyrrhotite|déflexion/.test(l)) return 'Ingénieur en structures';
        if (/toiture|bardeau|gouttière|solin|membrane élasto|tôle|couverture|charpente.*toit/.test(l)) return 'Couvreur certifié';
        if (/électricité|électrique|filage|panneau|disjoncteur|gfci|afci|ddft|aluminium|câblage|circuit|exposition.*fil/.test(l)) return 'Électricien licencié RBQ';
        if (/plomberie|chauffe.eau|tuyau|fuite|drain|soupape|puits|fosse|renvoi|pompe|puisard/.test(l)) return 'Plombier maître';
        if (/chauffage|fournaise|thermopompe|vrc|échangeur|combustion| co |chaudière|cvac|filtre.*air/.test(l)) return 'Technicien CVAC certifié';
        if (/amiante|vermiculite|radon|plomb|contamination|mazout|formaldéhyde|cov/.test(l)) return 'Spécialiste en matières dangereuses';
        if (/cheminée|foyer|fumée|tirage|liner|chemisage|chapeau.*cheminée|solin.*cheminée/.test(l)) return 'Ramoneur certifié WETT';
        if (/fenêtre|porte.*ext|calfeutrage|thermos|vitrage|chambranle|egress/.test(l)) return 'Menuisier ou vitrier';
        if (/moisissure|mycologie/.test(l)) return 'Inspecteur en moisissures certifié';
        return 'Entrepreneur général';
    },

```

- [ ] **Étape 3 — Vérifier**

```bash
grep -n "getSpecialist" "C:/Users/jeane/Desktop/Amboul/JEC/ai_agents.js"
```
Résultat attendu : au moins 2 lignes (déclaration + return dans l'objet).

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add ai_agents.js
git commit -m "feat: AIAgents.getSpecialist() — mapping label → spécialiste à consulter"
```

---

## Task 3 : _buildNumberedDefects() + _buildLifespanItems() dans app.js

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Étape 1 — Localiser generateFinalReport()**

```bash
grep -n "function generateFinalReport" "C:/Users/jeane/Desktop/Amboul/JEC/app.js"
```

- [ ] **Étape 2 — Ajouter les constantes et helpers JUSTE AVANT la ligne function generateFinalReport()**

Insérer ce bloc complet juste avant `function generateFinalReport(unitId) {` :

```js
    // --- Helpers Rapport PDF enrichi ---

    // Table d'âge numérique → EQUIPMENT_LIFESPAN key
    const AGE_TO_LIFESPAN = {
        'ce_age': { key: 'chauffe-eau', specialist: 'Plombier maître' },
        'c_age':  { key: 'fournaise',   specialist: 'Technicien CVAC certifié' }
    };

    // Table d'âge sélection toiture → durée résiduelle
    const TO_AGE_MAP = {
        'Neuf / Récent (0-5 ans)':              { badge: '15-20 ans restants', badgeColor: '#059669' },
        'Bon état (5-10 ans)':                  { badge: '10-15 ans restants', badgeColor: '#059669' },
        'Milieu de vie (10-15 ans)':            { badge: '5-10 ans restants',  badgeColor: '#059669' },
        'Fin de vie approchant (15-20 ans)':    { badge: '1-5 ans restants — À planifier', badgeColor: '#d97706' },
        'Remplacement urgent (20 ans et +)':    { badge: 'Remplacement recommandé', badgeColor: '#dc2626' }
    };

    // Construit la liste numérotée de tous les défauts/surveiller, triée URGENT→MAJEUR→SURVEILLER
    function _buildNumberedDefects(unitFieldStates, sections) {
        const defects = [];
        sections.forEach(section => {
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport') return;
            (section.subSections || []).forEach(sub => {
                (sub.fields || []).forEach(field => {
                    if (field.type !== 'checkbox') return;
                    const state = unitFieldStates[field.id];
                    if (state !== 'defaut' && state !== 'surveiller') return;
                    const severity = state === 'defaut'
                        ? AIAgents.determineSeverity(field.label)
                        : 'SURVEILLER';
                    defects.push({
                        sectionTitle: section.title,
                        label: field.label,
                        fieldId: field.id,
                        state,
                        severity,
                        specialist: AIAgents.getSpecialist(field.label)
                    });
                });
            });
        });
        const order = { URGENT: 0, MAJEUR: 1, SURVEILLER: 2 };
        defects.sort((a, b) => (order[a.severity] || 2) - (order[b.severity] || 2));
        return defects.map((d, i) => Object.assign({}, d, { num: i + 1 }));
    }

    // Construit la liste des équipements avec durée de vie résiduelle
    function _buildLifespanItems() {
        const items = [];

        // Équipements à âge numérique (chauffe-eau, fournaise)
        Object.entries(AGE_TO_LIFESPAN).forEach(([fieldId, mapping]) => {
            const ageVal = document.getElementById(fieldId) && document.getElementById(fieldId).value;
            const age = parseInt(ageVal, 10);
            if (isNaN(age) || age <= 0) return;
            const eq = typeof EQUIPMENT_LIFESPAN !== 'undefined' ? EQUIPMENT_LIFESPAN[mapping.key] : null;
            if (!eq) return;
            const residMin = Math.max(0, eq.min - age);
            const residMax = Math.max(0, eq.max - age);
            let badge, badgeColor;
            if (eq.max - age <= 0) {
                badge = 'Fin de vie — Remplacement recommandé';
                badgeColor = '#dc2626';
            } else if (eq.max - age <= 2) {
                badge = residMin + '-' + residMax + ' ans restants — Remplacement imminent';
                badgeColor = '#dc2626';
            } else if (eq.max - age <= 5) {
                badge = residMin + '-' + residMax + ' ans restants — À planifier';
                badgeColor = '#d97706';
            } else {
                badge = residMin + '-' + residMax + ' ans restants — État satisfaisant';
                badgeColor = '#059669';
            }
            items.push({ label: eq.label, age, badge, badgeColor, specialist: mapping.specialist });
        });

        // Toiture (âge sélection)
        const toAgeEl = document.getElementById('to_age');
        if (toAgeEl && toAgeEl.value && TO_AGE_MAP[toAgeEl.value]) {
            const m = TO_AGE_MAP[toAgeEl.value];
            items.push({
                label: 'Bardeaux d\'asphalte / Couverture',
                age: null,
                badge: m.badge,
                badgeColor: m.badgeColor,
                specialist: 'Couvreur certifié'
            });
        }

        return items;
    }
```

- [ ] **Étape 3 — Vérifier**

```bash
grep -n "_buildNumberedDefects\|_buildLifespanItems\|AGE_TO_LIFESPAN\|TO_AGE_MAP" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -8
```
Résultat attendu : au moins 6 lignes.

- [ ] **Étape 4 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: app.js — _buildNumberedDefects() + _buildLifespanItems() + AGE_TO_LIFESPAN"
```

---

## Task 4 : Enrichir le Sommaire existant (liste numérotée + durée de vie)

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Étape 1 — Lire le Sommaire existant**

```bash
grep -n "SOMMAIRE\|Sommaire Exécutif\|totalUrgents\|totalMajeurs\|totalSurveiller\|totalConformes" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -15
```

Lire `app.js` lignes autour du Sommaire (chercher `Sommaire Exécutif`).

- [ ] **Étape 2 — Ajouter le calcul des défauts numérotés AVANT le Sommaire**

Localiser dans `generateFinalReport()` la ligne :
```js
        // SOMMAIRE EXÉCUTIF avec compteur
        const hasIssues = totalUrgents > 0 || totalMajeurs > 0 || totalSurveiller > 0;
```

Insérer AVANT cette ligne :
```js
        // Construire la liste numérotée et les items de durée de vie
        const _numberedDefects = _buildNumberedDefects(unitFieldStates, inspectionData.sections);
        const _lifespanItems = _buildLifespanItems();
        const _urgentDefects = _numberedDefects.filter(d => d.severity === 'URGENT');
        const _majeurDefects = _numberedDefects.filter(d => d.severity === 'MAJEUR');
        const _surveillerDefects = _numberedDefects.filter(d => d.severity === 'SURVEILLER');
```

- [ ] **Étape 3 — Ajouter la liste numérotée dans le bloc Sommaire existant**

Localiser dans le bloc HTML du Sommaire :
```js
                    ${document.getElementById('rap_entretien')?.value ? `<p style="font-size: 1rem; line-height: 1.7; margin-top: 16px;"><strong>Recommandations d'entretien préventif :</strong><br>${sanitizeHTML(document.getElementById('rap_entretien').value).replace(/\n/g, '<br>')}</p>` : ''}
                </div>
            </div>
        `;
```

Remplacer la fermeture `</div></div>` par :

```js
                    ${document.getElementById('rap_entretien')?.value ? `<p style="font-size: 1rem; line-height: 1.7; margin-top: 16px;"><strong>Recommandations d'entretien préventif :</strong><br>${sanitizeHTML(document.getElementById('rap_entretien').value).replace(/\n/g, '<br>')}</p>` : ''}
                </div>
                ${_numberedDefects.length > 0 ? `
                <div style="margin-top: 30px;">
                    <h3 style="font-size: 1.3rem; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">📋 Liste des observations — ${_numberedDefects.length} au total</h3>
                    ${_urgentDefects.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <div style="background: #dc2626; color: white; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; display: inline-block;">🚨 URGENT — ${_urgentDefects.length} observation${_urgentDefects.length > 1 ? 's' : ''}</div>
                        ${_urgentDefects.map(d => `<div style="padding: 8px 14px; border-left: 3px solid #dc2626; margin-bottom: 4px; font-size: 0.9rem; background: #fff5f5;">
                            <span style="font-weight: 700; color: #dc2626; margin-right: 8px;">#${d.num}</span>
                            <strong>${sanitizeHTML(d.sectionTitle)}</strong> — ${sanitizeHTML(d.label)}
                            <span style="color: #dc2626; font-size: 0.82rem; margin-left: 8px;">→ ${sanitizeHTML(d.specialist)}</span>
                        </div>`).join('')}
                    </div>` : ''}
                    ${_majeurDefects.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <div style="background: #d97706; color: white; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; display: inline-block;">⚠️ MAJEUR — ${_majeurDefects.length} observation${_majeurDefects.length > 1 ? 's' : ''}</div>
                        ${_majeurDefects.map(d => `<div style="padding: 8px 14px; border-left: 3px solid #d97706; margin-bottom: 4px; font-size: 0.9rem; background: #fffdf0;">
                            <span style="font-weight: 700; color: #d97706; margin-right: 8px;">#${d.num}</span>
                            <strong>${sanitizeHTML(d.sectionTitle)}</strong> — ${sanitizeHTML(d.label)}
                            <span style="color: #d97706; font-size: 0.82rem; margin-left: 8px;">→ ${sanitizeHTML(d.specialist)}</span>
                        </div>`).join('')}
                    </div>` : ''}
                    ${_surveillerDefects.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <div style="background: #f59e0b; color: #0f172a; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; display: inline-block;">👁️ À SURVEILLER — ${_surveillerDefects.length} élément${_surveillerDefects.length > 1 ? 's' : ''}</div>
                        ${_surveillerDefects.map(d => `<div style="padding: 8px 14px; border-left: 3px solid #f59e0b; margin-bottom: 4px; font-size: 0.9rem; background: #fffbeb;">
                            <span style="font-weight: 700; color: #92400e; margin-right: 8px;">#${d.num}</span>
                            <strong>${sanitizeHTML(d.sectionTitle)}</strong> — ${sanitizeHTML(d.label)}
                            <span style="color: #92400e; font-size: 0.82rem; margin-left: 8px;">→ ${sanitizeHTML(d.specialist)}</span>
                        </div>`).join('')}
                    </div>` : ''}
                </div>` : ''}
                ${_lifespanItems.length > 0 ? `
                <div style="margin-top: 24px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h3 style="font-size: 1.1rem; color: #0f172a; margin-bottom: 14px;">🔧 Durée de vie estimée des équipements</h3>
                    ${_lifespanItems.map(item => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;">
                        <span style="font-weight: 600; color: #1e293b; min-width: 200px;">${sanitizeHTML(item.label)}${item.age ? ` · ${item.age} ans` : ''}</span>
                        <span style="background: ${item.badgeColor}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">${sanitizeHTML(item.badge)}</span>
                        <span style="color: #64748b; font-size: 0.82rem;">→ Consulter un ${sanitizeHTML(item.specialist)}</span>
                    </div>`).join('')}
                </div>` : ''}
            </div>
        `;
```

- [ ] **Étape 4 — Vérifier**

```bash
grep -n "_numberedDefects\|_lifespanItems\|_urgentDefects" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -8
```
Résultat attendu : au moins 6 lignes.

- [ ] **Étape 5 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: generateFinalReport — sommaire enrichi avec liste #N et durée de vie équipements"
```

---

## Task 5 : Badges #N dans les sections du rapport

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js`

- [ ] **Étape 1 — Lire le rendu des défauts dans les sections**

```bash
grep -n "defectCount++\|severity.*URGENT\|❌ \${severity}" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -8
```

Lire les lignes autour de `defectCount++`. Le code actuel ressemble à :
```js
        let defectCount = 0;
        inspectionData.sections.forEach(section => {
            ...
            if (state === 'defaut') {
                sectionHasDefects = true;
                defectCount++;
                const severity = AIAgents.determineSeverity(field.label);
                ...
                defectsHtml += `
                    <div ...>
                        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 15px;">
                            <span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; white-space: nowrap;">❌ ${severity}</span>
                            <strong style="font-size: 1.1rem; color: #0f172a;">${field.label}</strong>
                        </div>
```

- [ ] **Étape 2 — Remplacer defectCount par lookup dans _numberedDefects**

Localiser le bloc `let defectCount = 0;` (début de la boucle des sections).

**AVANT** `let defectCount = 0;`, ajouter :
```js
        // Map fieldId → numéro global pour les badges #N
        const _defectNumMap = {};
        (_numberedDefects || []).forEach(d => { _defectNumMap[d.fieldId] = d.num; });
```

Puis localiser (dans la boucle `if (state === 'defaut')`) :
```js
                            <span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; white-space: nowrap;">❌ ${severity}</span>
                            <strong style="font-size: 1.1rem; color: #0f172a;">${field.label}</strong>
```

Remplacer par :
```js
                            <span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; white-space: nowrap;">❌ ${severity}</span>
                            ${_defectNumMap[field.id] ? `<span style="background: #0f172a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.82rem; font-weight: 700; white-space: nowrap;">#${_defectNumMap[field.id]}</span>` : ''}
                            <strong style="font-size: 1.1rem; color: #0f172a;">${field.label}</strong>
```

Faire la même chose pour le badge `À SURVEILLER` (localiser `⚠️ À SURVEILLER` dans le rendu des surveiller) :
```js
                        <span style="background: #d97706; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.82rem; font-weight: bold; white-space: nowrap;">⚠️ À SURVEILLER</span>
                        <span style="color: #0f172a; font-size: 0.95rem;">${field.label}</span>
```
Remplacer par :
```js
                        <span style="background: #d97706; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.82rem; font-weight: bold; white-space: nowrap;">⚠️ À SURVEILLER</span>
                        ${_defectNumMap[field.id] ? `<span style="background: #0f172a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 700;">#${_defectNumMap[field.id]}</span>` : ''}
                        <span style="color: #0f172a; font-size: 0.95rem;">${field.label}</span>
```

- [ ] **Étape 3 — Ajouter la ligne durée de vie en bas de chaque section**

Localiser la fin de la boucle `section.subSections.forEach`, juste avant `html += "</div>";` qui ferme la section :
```js
            html += "</div>";
        });

        // ATTESTATION
```

Juste AVANT `html += "</div>";`, ajouter :
```js
            // Durée de vie de la section (si applicable)
            const _sectionLifespan = _lifespanItems.filter(item => {
                // Associer par section via les champs de la section
                return section.subSections.some(sub =>
                    (sub.fields || []).some(f =>
                        (f.id === 'ce_age' && item.label.includes('Chauffe')) ||
                        (f.id === 'c_age' && (item.label.includes('Fournaise') || item.label.includes('Thermopompe'))) ||
                        (f.id === 'to_age' && item.label.includes('Couverture'))
                    )
                );
            });
            if (_sectionLifespan.length > 0) {
                html += `<div style="margin-top: 20px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                    <div style="font-weight: 700; color: #065f46; margin-bottom: 10px; font-size: 0.95rem;">🔧 Durée de vie estimée</div>
                    ${_sectionLifespan.map(item => `
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 0.88rem;">
                        <span style="color: #1e293b; font-weight: 600;">${sanitizeHTML(item.label)}${item.age ? ` · ${item.age} ans` : ''}</span>
                        <span style="background: ${item.badgeColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.78rem; font-weight: 700;">${sanitizeHTML(item.badge)}</span>
                        <span style="color: #64748b; font-size: 0.82rem;">→ Consulter un ${sanitizeHTML(item.specialist)}</span>
                    </div>`).join('')}
                </div>`;
            }
```

- [ ] **Étape 4 — Vérifier**

```bash
grep -n "_defectNumMap\|_sectionLifespan" "C:/Users/jeane/Desktop/Amboul/JEC/app.js" | head -8
```
Résultat attendu : au moins 4 lignes.

- [ ] **Étape 5 — Commit**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add app.js
git commit -m "feat: rapport — badges #N par défaut dans sections + ligne durée de vie par section"
```

---

## Task 6 : Bump cache v18→v19 + versions scripts

**Files:**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/sw.js`
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html`

- [ ] **Étape 1 — Bumper CACHE_NAME**

Dans `sw.js`, remplacer :
```js
const CACHE_NAME = 'kzo-inspect-v18';
```
par :
```js
const CACHE_NAME = 'kzo-inspect-v19';
```

- [ ] **Étape 2 — Bumper les versions scripts dans KZO_Inspect.html**

```bash
grep -n "app.js\|ai_agents.js\|data.js" "C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html" | grep "?v="
```

Incrémenter :
- `app.js?v=17` → `app.js?v=18`
- `ai_agents.js?v=14` → `ai_agents.js?v=15`
- `data.js?v=N` → `data.js?v=N+1` (si versionné)

- [ ] **Étape 3 — Vérifier**

```bash
grep -n "CACHE_NAME\|app.js\|ai_agents\|data.js" "C:/Users/jeane/Desktop/Amboul/JEC/sw.js" "C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html" | grep -v ".git" | head -10
```

- [ ] **Étape 4 — Commit et push**

```bash
cd "C:/Users/jeane/Desktop/Amboul/JEC"
git add sw.js KZO_Inspect.html
git commit -m "chore: bump cache PWA v18→v19 + versions scripts Groupe A"
git push
```
