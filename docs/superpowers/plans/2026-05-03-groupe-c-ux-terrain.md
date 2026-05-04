# Groupe C — UX Terrain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter des badges de statut par section dans la navigation + un système de champs conditionnels `showIf` basé sur le type de bâtiment.

**Architecture:** `getSectionStatus()` calcule l'état de chaque section depuis `getActiveFieldStates()` et est appelé dans `renderNavigation()`. La propriété `showIf` dans data.js est évaluée en début de `sub.fields.forEach()` avec un `return` early. Une bannière Condo est injectée dans les sections extérieur/toiture si `prop_type === 'Condo / Appartement'`.

**Tech Stack:** Vanilla JS, HTML5, data.js (structure de données déclarative).

---

## Fichiers modifiés

| Fichier | Lignes | Modification |
|---------|--------|-------------|
| `app.js` | ~700 | Ajout `getSectionStatus()` avant `renderNavigation()` |
| `app.js` | 702-723 | Badges de statut dans `renderNavigation()` |
| `app.js` | 833-834 | Bannière Condo avant `section.subSections.forEach` |
| `app.js` | 842-844 | Évaluation `showIf` au début de `sub.fields.forEach` |
| `data.js` | 219-220 | Nouveaux champs Chalet dans `ss_pl_3` |
| `data.js` | 255-256 | Nouveaux champs Chalet dans `ss_cv_1` |
| `data.js` | 30-31 | Nouveaux champs Condo dans `ss_admin_1` |
| `KZO_Inspect.html` | 271 | Bump `app.js?v=19` → `app.js?v=20` |
| `sw.js` | 1 | Bump `kzo-inspect-v20` → `kzo-inspect-v21` |

---

## Task 1 : `getSectionStatus()` + badges dans `renderNavigation()`

**Fichiers :**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js` lignes ~700-723

**Contexte :** `renderNavigation()` est définie à la ligne 702. Elle crée des `<li>` avec icône + titre pour chaque section. `getActiveFieldStates()` (ligne 345) retourne les fieldStates de l'unité active. `currentSectionIndex` est la variable de ligne 700 qui suit la section courante.

- [ ] **Step 1 : Lire les lignes 699-724 de app.js pour confirmer le contexte exact**

```bash
# Vérifier la structure actuelle de renderNavigation
```
Expected : voir `navLinks.innerHTML = ''`, boucle `forEach`, création de `li` avec `iconSpan` + `titleSpan`.

- [ ] **Step 2 : Insérer `getSectionStatus()` juste avant `renderNavigation()`**

Trouver la ligne exacte :
```js
    function renderNavigation() {
```

Insérer AVANT cette ligne :
```js
    function getSectionStatus(section, fieldStates, sectionIndex, currentIdx) {
        if (sectionIndex === currentIdx) return 'active';
        const allFields = (section.subSections || []).flatMap(ss => ss.fields || []);
        const checkboxFields = allFields.filter(f => f.type === 'checkbox');
        const hasDefaut = checkboxFields.some(f =>
            fieldStates[f.id] === 'defaut' || fieldStates[f.id] === 'surveiller'
        );
        if (hasDefaut) return 'defaut';
        const hasAnyFilled = allFields.some(f => {
            const v = fieldStates[f.id];
            return v !== undefined && v !== null && v !== '' && v !== 'non_applicable';
        });
        if (hasAnyFilled) return 'complete';
        return 'todo';
    }

```

- [ ] **Step 3 : Modifier `renderNavigation()` pour ajouter les badges**

Trouver le bloc exact dans `renderNavigation()` :
```js
            const titleSpan = document.createElement('span');
            titleSpan.textContent = section.title;
            li.appendChild(iconSpan);
            li.appendChild(document.createTextNode(' '));
            li.appendChild(titleSpan);
            if (index === currentSectionIndex) li.classList.add('active');
```

Remplacer par :
```js
            const titleSpan = document.createElement('span');
            titleSpan.textContent = section.title;
            li.appendChild(iconSpan);
            li.appendChild(document.createTextNode(' '));
            li.appendChild(titleSpan);
            if (index === currentSectionIndex) li.classList.add('active');

            // Badge de statut
            if (!section.isCoverPage && section.key !== 'rapport') {
                const STATUS_BADGE = {
                    active:   { text: 'En cours',    bg: '#1d4ed8', color: 'white' },
                    defaut:   { text: '⚠️ Défauts',  bg: '#dc2626', color: 'white' },
                    complete: { text: '✅ Complété',  bg: '#166534', color: '#86efac' },
                    todo:     { text: '○ À faire',   bg: '#1e293b', color: '#64748b' }
                };
                const status = getSectionStatus(section, getActiveFieldStates(), index, currentSectionIndex);
                const b = STATUS_BADGE[status];
                const badge = document.createElement('span');
                badge.textContent = b.text;
                badge.style.cssText = `margin-left:auto; font-size:0.65rem; padding:2px 7px; border-radius:10px; background:${b.bg}; color:${b.color}; white-space:nowrap; flex-shrink:0;`;
                li.style.cssText = (li.style.cssText || '') + 'display:flex;align-items:center;gap:6px;';
                li.appendChild(badge);
            }
```

- [ ] **Step 4 : Vérifier manuellement**

Ouvrir `KZO_Inspect.html` → vérifier dans la sidebar :
- Sections non visitées : badge gris "○ À faire"
- Section active : badge bleu "En cours"
- Cocher un défaut dans une section → naviguer → badge rouge "⚠️ Défauts"
- Remplir un champ non-défaut → naviguer → badge vert "✅ Complété"

- [ ] **Step 5 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/app.js
git commit -m "feat(groupe-c): badges de statut de section dans la navigation"
```

---

## Task 2 : Évaluation `showIf` + bannière Condo dans `renderSection()`

**Fichiers :**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/app.js` lignes ~833-844

**Contexte :**
- Ligne 833 : `// --- Standard Section Rendering ---`
- Ligne 834 : `section.subSections.forEach(sub => {`
- Ligne 842 : `sub.fields.forEach(field => {`
- Ligne 843 : `const fieldGroup = document.createElement('div');`
- `getActiveFieldStates()` retourne les fieldStates de l'unité active (inclut `prop_type`)
- Les sections Condo ont `section.key === 'structure'` ou `section.key === 'toiture'`

- [ ] **Step 1 : Lire app.js lignes 831-847 pour confirmer le contexte exact**

Expected : voir `// --- Standard Section Rendering ---`, `section.subSections.forEach`, `sub.fields.forEach`, `const fieldGroup`.

- [ ] **Step 2 : Ajouter la bannière Condo avant `section.subSections.forEach`**

Trouver :
```js
        // --- Standard Section Rendering ---
        section.subSections.forEach(sub => {
```

Remplacer par :
```js
        // --- Standard Section Rendering ---

        // Bannière Condo pour sections extérieures
        if (['structure', 'toiture'].includes(section.key) &&
            (getActiveFieldStates()['prop_type'] || '') === 'Condo / Appartement') {
            const condoBanner = document.createElement('div');
            condoBanner.style.cssText = 'background:#1e3a5f;border:1px solid #3b82f6;border-radius:6px;padding:10px 14px;margin-bottom:16px;color:#93c5fd;font-size:0.85rem;';
            condoBanner.textContent = 'ℹ️ Condo — Ces éléments sont généralement sous la responsabilité du syndicat de copropriété.';
            dynamicContent.appendChild(condoBanner);
        }

        section.subSections.forEach(sub => {
```

- [ ] **Step 3 : Ajouter l'évaluation `showIf` au début de `sub.fields.forEach`**

Trouver :
```js
            sub.fields.forEach(field => {
                const fieldGroup = document.createElement('div');
                fieldGroup.className = 'field-group';
```

Remplacer par :
```js
            sub.fields.forEach(field => {
                // Champs conditionnels — ne pas rendre si condition non satisfaite
                if (field.showIf) {
                    const val = getActiveFieldStates()[field.showIf.field] || '';
                    if (!field.showIf.values.includes(val)) return;
                }

                const fieldGroup = document.createElement('div');
                fieldGroup.className = 'field-group';
```

- [ ] **Step 4 : Vérifier manuellement**

Ouvrir `KZO_Inspect.html` → Section 1 → changer "Type de bâtiment" à "Chalet / Résidence secondaire" → aller en Section Plomberie → vérifier que les champs puits/fosse apparaissent (ils n'y sont pas encore — Task 3 les ajoute, mais le mécanisme ne doit pas crasher).

Changer à "Condo / Appartement" → aller en Section Toiture → vérifier que la bannière bleue ℹ️ apparaît.

- [ ] **Step 5 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/app.js
git commit -m "feat(groupe-c): showIf conditionnel + bannière Condo dans renderSection"
```

---

## Task 3 : Nouveaux champs conditionnels dans `data.js`

**Fichiers :**
- Modify: `C:/Users/jeane/Desktop/Amboul/JEC/data.js`
  - Lignes ~219-220 (fin de `ss_pl_3`)
  - Lignes ~255-256 (fin de `ss_cv_1`)
  - Lignes ~30-31 (fin de `ss_admin_1`)

**Contexte :**
- `ss_pl_3` (ligne 215) se termine à la ligne 220 avec `p_puits_risq` suivi de `]}` puis `]` puis `},`
- `ss_cv_1` (ligne 250) se termine à la ligne 256 avec `c_combustion` suivi de `]},`
- `ss_admin_1` (ligne 15) se termine à la ligne 31 avec `prop_temp` suivi de `]},`
- La clé `showIf` doit référencer exactement `'prop_type'` et les valeurs doivent correspondre exactement aux options dans le select `prop_type` de la ligne 26

### Chalet — Section Plomberie (`ss_pl_3`)

- [ ] **Step 1 : Insérer les champs Chalet à la fin de `ss_pl_3`**

Trouver :
```js
                { id: "p_puits_risq", type: "checkbox", label: "Puits autonome à moins de 30m (100pi) d'un système d'épuration — Risque de contamination" }
            ]}
```

Remplacer par :
```js
                { id: "p_puits_risq", type: "checkbox", label: "Puits autonome à moins de 30m (100pi) d'un système d'épuration — Risque de contamination" },
                { id: "pl_puits", type: "checkbox", label: "Puits artésien présent", showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } },
                { id: "pl_puits_type", type: "select", label: "Type de puits", options: ["Artésien","De surface","Citerne"], showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } },
                { id: "pl_puits_qualite", type: "checkbox", label: "Test qualité eau requis (bactériologie) — Non effectué dans ce rapport", showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } },
                { id: "pl_fosse", type: "checkbox", label: "Fosse septique présente", showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } },
                { id: "pl_fosse_type", type: "select", label: "Type de fosse", options: ["Conventionnelle","Système tertiaire","Biologique / Ecoflo"], showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } },
                { id: "pl_fosse_age", type: "number", label: "Âge estimé de la fosse (ans)", placeholder: "Ex: 15", showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } },
                { id: "pl_fosse_vidange", type: "text", label: "Date dernier vidange (approx.)", placeholder: "Ex: 2023, inconnu...", showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } }
            ]}
```

### Chalet — Section Chauffage (`ss_cv_1`)

- [ ] **Step 2 : Insérer les champs poêle à bois à la fin de `ss_cv_1`**

Trouver :
```js
                { id: "c_combustion", type: "checkbox", label: "DANGER CO : Signes de combustion incomplète, brûleurs sales, flamme jaune ou odeur de gaz" }
            ]},
```

Remplacer par :
```js
                { id: "c_combustion", type: "checkbox", label: "DANGER CO : Signes de combustion incomplète, brûleurs sales, flamme jaune ou odeur de gaz" },
                { id: "ch_poele_bois", type: "checkbox", label: "Poêle à bois ou foyer principal présent", showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } },
                { id: "ch_poele_wett", type: "checkbox", label: "Inspection WETT requise — Non effectuée dans ce rapport d'inspection", showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] } }
            ]},
```

### Condo — Section Documents (`ss_admin_1`)

- [ ] **Step 3 : Insérer les champs Condo à la fin de `ss_admin_1`**

Trouver :
```js
                { id: "prop_temp", type: "number", label: "Température extérieure (°C)", placeholder: "Ex: 5" }
            ]},
```

Remplacer par :
```js
                { id: "prop_temp", type: "number", label: "Température extérieure (°C)", placeholder: "Ex: 5" },
                { id: "condo_syndicat", type: "checkbox", label: "Déclaration de copropriété reçue", showIf: { field: 'prop_type', values: ['Condo / Appartement'] } },
                { id: "condo_fonds", type: "checkbox", label: "Fonds de prévoyance — Carnet d'entretien demandé au syndicat", showIf: { field: 'prop_type', values: ['Condo / Appartement'] } }
            ]},
```

- [ ] **Step 4 : Vérifier l'ensemble end-to-end**

Ouvrir `KZO_Inspect.html` :
1. Section 1 → choisir "Chalet / Résidence secondaire" → Section Plomberie → vérifier que les 7 champs Chalet apparaissent (pl_puits, pl_puits_type, etc.)
2. Section Chauffage → vérifier que ch_poele_bois et ch_poele_wett apparaissent
3. Section 1 → choisir "Maison unifamiliale" → Plomberie → vérifier que les 7 champs Chalet disparaissent
4. Section 1 → choisir "Condo / Appartement" → Section 1 → vérifier que condo_syndicat et condo_fonds apparaissent
5. Section Toiture → vérifier bannière ℹ️ Condo

- [ ] **Step 5 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/data.js
git commit -m "feat(groupe-c): champs conditionnels Chalet (puits/fosse/poêle) et Condo (syndicat)"
```

---

## Task 4 : Bump versions

**Fichiers :**
- `C:/Users/jeane/Desktop/Amboul/JEC/sw.js` ligne 1
- `C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html` ligne 271

- [ ] **Step 1 : Bump sw.js**

Trouver :
```js
const CACHE_NAME = 'kzo-inspect-v20';
```
Remplacer par :
```js
const CACHE_NAME = 'kzo-inspect-v21';
```

- [ ] **Step 2 : Bump KZO_Inspect.html**

Trouver :
```html
    <script src="app.js?v=19"></script>
```
Remplacer par :
```html
    <script src="app.js?v=20"></script>
```

- [ ] **Step 3 : Commit**

```bash
git add C:/Users/jeane/Desktop/Amboul/JEC/sw.js C:/Users/jeane/Desktop/Amboul/JEC/KZO_Inspect.html
git commit -m "chore: bump cache v21 et app.js v20 pour groupe-c"
```

---

## Récapitulatif des commits

1. `feat(groupe-c): badges de statut de section dans la navigation`
2. `feat(groupe-c): showIf conditionnel + bannière Condo dans renderSection`
3. `feat(groupe-c): champs conditionnels Chalet (puits/fosse/poêle) et Condo (syndicat)`
4. `chore: bump cache v21 et app.js v20 pour groupe-c`
