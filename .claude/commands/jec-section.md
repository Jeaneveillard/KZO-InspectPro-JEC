# /jec-section — Travail sur les sections d'inspection

Tu travailles sur les sections et champs d'inspection de JEC / KZO InspectPro. Exécute les étapes suivantes, puis aide l'utilisateur avec sa demande.

## Étapes à exécuter

### 1. Charger la structure des sections
Lis `data.js` — il contient `inspectionData.sections[]`, la structure complète de toutes les sections et sous-sections d'inspection.

### 2. Charger les modèles de commentaires
Lis `templates.js` — il contient `COMMENT_TEMPLATES`, les phrases pré-écrites AIBQ organisées par section (`bySection`) et par sous-section (`byField`).

### 3. Présenter le contexte opérationnel

Affiche ce rappel avant de répondre :

---
**Contexte — Sections d'inspection JEC**

**Types de champs disponibles dans `data.js` :**
- `checkbox` → états : `'conforme'` | `'defaut'` | `'surveiller'` | `'na'`
- `select` → liste déroulante d'options prédéfinies
- `text` → saisie libre
- `number` → valeur numérique
- `file` → upload photo/document
- `clients` → noms multiples des clients
- `action` → bouton déclencheur (ex: sauvegarde forcée)

**Règle multi-unités (CRITIQUE) :**
Ne jamais accéder directement à `inspectionData.units[n].fieldStates`.
Toujours passer par le proxy : `inspectionData.fieldStates` → pointe automatiquement vers l'unité active.

**Pour ajouter une sous-section :**
```js
{ id: "ss_xxx_N", title: "Titre", fields: [
    { id: "champ_id", type: "checkbox", label: "Description du point inspecté" }
]}
```
Ajouter l'entrée dans `COMMENT_TEMPLATES.bySection['s_xxx']` dans `templates.js` pour les phrases pré-écrites.

**Sections existantes :**
s_cover · s_admin · s_struct · s_toit · s_elec · s_plomb · s_cvac · s_inter · s_garage · s_annexe
---

## Demande de l'utilisateur
$ARGUMENTS
