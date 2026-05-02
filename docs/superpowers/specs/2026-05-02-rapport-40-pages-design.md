# Rapport 40+ Pages — Spec de design (v2)
**Projet :** JEC / KZO InspectPro
**Date :** 2026-05-02
**Statut :** Approuvé par l'utilisateur

---

## Objectif

Transformer le rapport PDF en un document professionnel 40+ pages. Les formulaires légaux sont des documents pré-imprimés que l'inspecteur uploade comme images dans l'app — ils s'insèrent à la bonne page du rapport. Certains formulaires sont toujours inclus, d'autres seulement si l'inspecteur coche une case.

---

## Contraintes

- **Pas de génération de texte légal** — les formulaires sont des images uploadées par l'inspecteur
- **Deux types de documents** :
  - **Toujours inclus** : apparaît dans le rapport si uploadé (pas de condition)
  - **Conditionnel** : une case à cocher dans l'app active l'inclusion
- Les documents s'affichent **pleine page** dans le rapport, dans l'ordre défini
- Sections d'inspection en **flux continu** — aucun saut de page forcé entre sections
- JavaScript vanilla, HTML/CSS inline, `window.print()` pour PDF
- `config.js` exclu du versionnement

---

## Architecture des fichiers

| Fichier | Modification |
|---------|-------------|
| `boilerplate.js` | +3 nouvelles fonctions : `tableDesMatières`, `ficheDescriptionMaison`, `pageDocumentUpload` |
| `data.js` | Nouveaux champs dans `s_admin` : uploads + checkboxes conditionnels |
| `app.js` | Handlers uploads → `inspectionData.clientInfo` + réorganisation `generateReport()` + suppression `class="page-break"` sections |
| `KZO_Inspect.html` | Bump `?v=N` scripts modifiés |
| `sw.js` | Bump `CACHE_NAME` v16 → v17 |

> **Supprimé vs v1 :** `legal_docs.js` — plus nécessaire.

---

## Structure du rapport (ordre des pages)

### Pages préliminaires et légales

| Page | Titre | Type | Condition d'inclusion |
|------|-------|------|-----------------------|
| 1 | Couverture | Existante enrichie | Toujours |
| 2 | Lettre de remerciement | Upload image | Toujours (si uploadée) |
| 3 | Table des matières | Générée automatiquement | Toujours |
| 4 | Description de la propriété | Fiche technique + narratif | Toujours |
| 5 | Documents reçus | Upload image | Toujours (si uploadée) |
| 6 | Clause du contrat | Upload image | **Toujours** |
| 7 | Contrat d'inspection | Upload image | **Toujours** |
| 8 | Contrat client | Upload image | **Conditionnel** ← case à cocher |
| 9 | Déclaration conflit d'intérêt | Upload image | **Conditionnel** ← case à cocher |
| 10 | Formulaire de limitations | Upload image | **Conditionnel** ← case à cocher |
| 11+ | Rapport d'inspection | Existant, flux continu | Toujours |
| Fin | Guide d'entretien | Existant | Toujours |
| Fin | Annexe normes | Existante | Toujours |

> **Note :** D'autres formulaires peuvent être ajoutés ultérieurement selon le même pattern.

---

## Nouveaux champs dans `data.js` (section `s_admin`, sous-section `ss_admin_2`)

```js
// Description narrative (toujours)
{ id: "description_narrative", type: "text",
  label: "Description narrative de la propriété avant inspection",
  placeholder: "État général apparent, conditions d'accès, limitations observées..." },

// Documents toujours inclus (si uploadés)
{ id: "doc_lettre_remerciement", type: "file",
  label: "📄 Lettre de remerciement — votre formulaire (photo/scan)" },
{ id: "client_docs", type: "file",
  label: "📎 Documents reçus (déclaration vendeur, plans, etc.)" },
{ id: "doc_clause_contrat", type: "file",
  label: "📄 Clause du contrat — votre formulaire (photo/scan)" },
{ id: "doc_contrat_inspection", type: "file",
  label: "📄 Contrat d'inspection — votre formulaire (photo/scan)" },

// Documents conditionnels (checkbox + upload)
{ id: "include_contrat_client", type: "checkbox",
  label: "Inclure le contrat client dans le rapport" },
{ id: "doc_contrat_client", type: "file",
  label: "📄 Contrat client — votre formulaire (photo/scan)" },
{ id: "include_conflit_interet", type: "checkbox",
  label: "Inclure la déclaration de conflit d'intérêt" },
{ id: "doc_conflit_interet", type: "file",
  label: "📄 Déclaration conflit d'intérêt — votre formulaire (photo/scan)" },
{ id: "include_limitations", type: "checkbox",
  label: "Inclure le formulaire de limitations" },
{ id: "doc_limitations", type: "file",
  label: "📄 Formulaire de limitations — votre formulaire (photo/scan)" },

// Sync (existant, garder en dernier)
{ id: "sync_status", type: "action",
  label: "🔄 Forcer la sauvegarde locale" }
```

---

## Nouvelles fonctions dans `boilerplate.js`

### `BOILERPLATE.tableDesMatières(sections)`
Génère la page "Table des matières" avec la liste ordonnée de toutes les sections du rapport. Aucun numéro de page (non calculable avant impression).

### `BOILERPLATE.ficheDescriptionMaison(infos)`
Génère la page "Description de la propriété" avec la fiche technique (type, année, superficie, météo, etc.) et le paragraphe narratif saisi par l'inspecteur.

Signature : `ficheDescriptionMaison({ typeBatiment, typeGarage, superficie, annee, meteo, temperature, norme, dateInspection, narratif })`

### `BOILERPLATE.pageDocumentUpload(titre, imageUrl)`
Template générique réutilisé pour **tous** les documents uploadés. Affiche le document en pleine page avec un en-tête minimal.

```js
// Résultat si imageUrl présent :
<div class="page-break">
  <h3 style="...">titre</h3>
  <img src="imageUrl" style="width:100%; max-height:90vh; object-fit:contain;">
</div>

// Résultat si imageUrl absent (document "toujours" mais pas encore uploadé) :
<div class="page-break">
  <h3>titre</h3>
  <div style="border:2px dashed #cbd5e1; ...">Document non uploadé — à ajouter avant impression</div>
</div>
```

---

## Logique de sélection des pages dans `generateReport()` (app.js)

```js
// Toujours inclus (si uploadés)
if (clientInfo.doc_lettre_remerciementUrl) html += BOILERPLATE.pageDocumentUpload('Lettre de remerciement', clientInfo.doc_lettre_remerciementUrl);

// Table des matières — toujours générée
html += BOILERPLATE.tableDesMatières(inspectionData.sections);

// Description maison — toujours
html += BOILERPLATE.ficheDescriptionMaison({ ... });

// Documents reçus — si uploadés
if (clientInfo.client_docsUrl) html += BOILERPLATE.pageDocumentUpload('Documents reçus', clientInfo.client_docsUrl);

// Clause du contrat — toujours (placeholder si absent)
html += BOILERPLATE.pageDocumentUpload("Clause du contrat", clientInfo.doc_clause_contratUrl || null);

// Contrat d'inspection — toujours (placeholder si absent)
html += BOILERPLATE.pageDocumentUpload("Contrat d'inspection", clientInfo.doc_contrat_inspectionUrl || null);

// Contrat client — conditionnel
if (inspectionData.fieldStates['include_contrat_client'] === 'conforme') {
    html += BOILERPLATE.pageDocumentUpload("Contrat client", clientInfo.doc_contrat_clientUrl || null);
}

// Déclaration conflit — conditionnel
if (inspectionData.fieldStates['include_conflit_interet'] === 'conforme') {
    html += BOILERPLATE.pageDocumentUpload("Déclaration de conflit d'intérêt", clientInfo.doc_conflit_interetUrl || null);
}

// Formulaire limitations — conditionnel
if (inspectionData.fieldStates['include_limitations'] === 'conforme') {
    html += BOILERPLATE.pageDocumentUpload("Formulaire de limitations", clientInfo.doc_limitationsUrl || null);
}
```

---

## Sections d'inspection — Flux continu

Supprimer `class="page-break"` du `<div>` englobant chaque section dans `generateReport()`. Remplacer par un séparateur visuel CSS sans forcer de saut de page.

Avant :
```js
html += `<div class="page-break" style="padding-top: 50px;">`
```
Après :
```js
html += `<div style="padding-top: 40px; margin-top: 30px; border-top: 2px solid #e2e8f0;">`
```

---

## Sauvegarde des uploads

Les images uploadées sont compressées via `compressImage()` (existant) et stockées en base64 dans `inspectionData.clientInfo[fieldId + 'Url']`. Ce pattern est identique à `signatureUrl` et `sealUrl` déjà en place.

---

## Tests de validation

- [ ] Rapport ≥ 40 pages via `window.print()`
- [ ] Lettre de remerciement uploadée → apparaît en page 2
- [ ] Table des matières générée avec toutes les sections
- [ ] Description maison : fiche technique + narratif correctement formatés
- [ ] Clause et Contrat d'inspection toujours présents (placeholder si non uploadé)
- [ ] Contrat client absent si case non cochée, présent si cochée
- [ ] Déclaration conflit absente si case non cochée
- [ ] Formulaire limitations absent si case non cochée
- [ ] Sections d'inspection sans `class="page-break"` — flux continu
- [ ] `sanitizeHTML()` sur tous les champs texte libres
- [ ] Cache PWA bumped v17
