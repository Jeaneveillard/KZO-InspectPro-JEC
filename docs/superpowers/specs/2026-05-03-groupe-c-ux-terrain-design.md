# Groupe C — UX Terrain

**Date :** 2026-05-03
**Statut :** Approuvé

---

## Objectif

Améliorer l'expérience de l'inspecteur sur le terrain avec deux fonctionnalités :
1. **Statuts de section dans la navigation** — badges visuels par section (À faire / En cours / Défauts / Complété)
2. **Champs conditionnels `showIf`** — champs qui apparaissent uniquement selon le type de bâtiment sélectionné en Section 1

---

## Décisions de design

| Décision | Choix |
|----------|-------|
| Indicateur de progression | Option B — badges de statut dans le menu de navigation |
| Champs conditionnels | Approche A — `showIf` metadata dans data.js |
| Évaluation condition | Dans `renderSection()` — `continue` si condition fausse |
| Types couverts | Chalet / Résidence secondaire + Condo / Appartement |
| Duplex/Triplex | Déjà géré par gestionnaire multi-unités (Groupe 0) |

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `app.js` | Ajout `getSectionStatus()` + badges dans rendu nav + évaluation `showIf` dans `renderSection()` + bannière Condo |
| `data.js` | Ajout champs conditionnels Chalet (plomberie + chauffage) + Condo (documents) |
| `KZO_Inspect.html` | Bump version `?v=` |
| `sw.js` | Bump `CACHE_NAME` v20→v21 |

---

## Feature 1 — Statuts de section dans la navigation

### Fonction `getSectionStatus(section, fieldStates, sectionIndex, currentSectionIndex)`

```js
function getSectionStatus(section, fieldStates, sectionIndex, currentSectionIndex) {
    if (sectionIndex === currentSectionIndex) return 'active';

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

Priorité : `active` > `defaut` > `complete` > `todo`

### Badge dans le menu de navigation

Dans la fonction qui rend la liste des sections dans la sidebar, après le titre de chaque section, ajouter :

```js
const status = getSectionStatus(section, unitFieldStates, i, currentSectionIndex);
const STATUS_BADGE = {
    active:   { text: 'En cours',   bg: '#1d4ed8', color: 'white' },
    defaut:   { text: '⚠️ Défauts', bg: '#dc2626', color: 'white' },
    complete: { text: '✅ Complété', bg: '#166534', color: '#86efac' },
    todo:     { text: '○ À faire',  bg: '#1e293b', color: '#64748b' }
};
const badge = STATUS_BADGE[status];
// <span style="background:${badge.bg}; color:${badge.color}; ...">badge.text</span>
```

Le badge se place à droite du nom de section dans chaque item du menu. Recalculé à chaque appel de `renderSection()`.

---

## Feature 2 — Champs conditionnels `showIf`

### Structure dans `data.js`

```js
{ id: "da_puits", type: "checkbox",
  label: "Puits artésien présent",
  showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] }
}
```

### Évaluation dans `renderSection()`

Dans la boucle de rendu des champs, avant de créer le DOM d'un champ :

```js
if (field.showIf) {
    const val = inspectionData.fieldStates[field.showIf.field] || '';
    if (!field.showIf.values.includes(val)) continue;
}
```

Les champs cachés ne sont pas rendus (pas de `display:none`). Leurs valeurs en `fieldStates` sont ignorées dans le rapport si le champ n'est pas applicable.

### Bannière Condo

Dans les sections Toiture (`s_toiture`), Extérieur (`s_exterior` ou équivalent), et Terrain (`s_terrain`), si `fieldStates['prop_type']` est `'Condo / Appartement'`, afficher en haut de la section :

```html
<div style="background:#1e3a5f; border:1px solid #3b82f6; border-radius:6px; padding:10px 14px; margin-bottom:16px; color:#93c5fd; font-size:0.85rem;">
  ℹ️ Condo — Ces éléments sont généralement sous la responsabilité du syndicat de copropriété.
</div>
```

---

## Nouveaux champs dans `data.js`

### Section Plomberie — sous-section existante (puits + fosse)

Tous avec `showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] }` :

```js
{ id: "pl_puits",         type: "checkbox", label: "Puits artésien présent" },
{ id: "pl_puits_type",    type: "select",   label: "Type de puits",
  options: ["Artésien","De surface","Citerne"] },
{ id: "pl_puits_qualite", type: "checkbox", label: "Test qualité eau requis (bactériologie) — Non effectué dans ce rapport" },
{ id: "pl_fosse",         type: "checkbox", label: "Fosse septique présente" },
{ id: "pl_fosse_type",    type: "select",   label: "Type de fosse",
  options: ["Conventionnelle","Système tertiaire","Biologique / Ecoflo"] },
{ id: "pl_fosse_age",     type: "number",   label: "Âge estimé de la fosse (ans)", placeholder: "Ex: 15" },
{ id: "pl_fosse_vidange", type: "text",     label: "Date dernier vidange (approx.)", placeholder: "Ex: 2023, inconnu..." }
```

### Section Chauffage — sous-section existante

Tous avec `showIf: { field: 'prop_type', values: ['Chalet / Résidence secondaire'] }` :

```js
{ id: "ch_poele_bois",  type: "checkbox", label: "Poêle à bois ou foyer principal présent" },
{ id: "ch_poele_wett",  type: "checkbox", label: "Inspection WETT requise — Non effectuée dans ce rapport d'inspection" }
```

### Section Documents & Pré-inspection (`s_admin`) — sous-section existante

Tous avec `showIf: { field: 'prop_type', values: ['Condo / Appartement'] }` :

```js
{ id: "condo_syndicat", type: "checkbox", label: "Déclaration de copropriété reçue" },
{ id: "condo_fonds",    type: "checkbox", label: "Fonds de prévoyance — Carnet d'entretien demandé au syndicat" }
```

---

## Hors-périmètre Groupe C

- Champs conditionnels multi-niveaux (showIf imbriqués)
- Différentes listes de sections par type de bâtiment
- Champs conditionnels sur autre chose que `prop_type`
- Inspection commerciale (hors du périmètre résidentiel de l'app)
