# Groupe 0 — Gestionnaire de projets multi-inspection

**Date :** 2026-05-02
**Statut :** Approuvé

## Objectif

Transformer KZO InspectPro d'une app à inspection unique en un gestionnaire multi-projets. L'inspecteur peut créer, reprendre, exporter, importer et supprimer des inspections depuis un écran d'accueil. 85% du travail de rédaction se fait au bureau — le fichier `.kzo` assure la portabilité entre l'iPad sur le terrain et l'ordinateur au bureau.

---

## Décisions de design

| Décision | Choix |
|----------|-------|
| Stockage | IndexedDB uniquement (text + photos) |
| Écran d'accueil | Grille de cartes |
| Carte projet | Nom client · Code inspection · Adresse · Date · Statut · Barre progression |
| Statuts | `en_cours` (défaut) · `termine` (auto à la génération PDF, réouvrable) |
| Bouton Sauvegarder et quitter | Top-bar + bas du sidebar |
| Format export | `.kzo` (ZIP renommé : `inspection.json` + `photos/`) |
| Import | Bouton "Importer .kzo" sur l'écran d'accueil |
| Suppression | Oui, avec dialog de confirmation |

---

## Architecture de stockage

### IndexedDB — `kzo_inspectpro_db` (version 1)

**Object store `projects`** (keyPath: `id`)
```
id          — string  — "KZO-48291" (code inspection = clé primaire)
code        — string  — numéro d'inspection
clientName  — string  — nom du/des client(s)
address     — string  — adresse du bâtiment
createdAt   — string  — ISO date création
updatedAt   — string  — ISO date dernière modification
status      — string  — "en_cours" | "termine"
progress    — number  — sections avec au moins 1 champ rempli (0-12)
data        — object  — objet inspectionData complet (sans photos)
```

**Object store `photos`** (keyPath: `id`)
```
id          — string  — "${projectId}_${subId}_${index}"
projectId   — string  — référence au projet (index)
subId       — string  — référence à la sous-section
url         — string  — base64 data URL (image/jpeg compressée)
caption     — string  — légende individuelle (Groupe B)
```
Index : `projectId` pour récupérer toutes les photos d'un projet.

### Migration

L'objet `inspectionData` actuel en localStorage est migré automatiquement au premier lancement : si `localStorage.inspectionData` existe, il est importé dans IndexedDB comme projet `"en_cours"` avec `clientName = "Migration automatique"`.

---

## Fichiers

| Fichier | Action | Description |
|---------|--------|-------------|
| `storage.js` | **Nouveau** | Couche d'abstraction IndexedDB |
| `index.html` | **Réécriture** | Écran d'accueil — grille projets |
| `app.js` | **Modifié** | Remplace localStorage → storage.js, lit `?project=ID`, ajoute boutons |
| `KZO_Inspect.html` | **Modifié** | Bouton "💾 Sauvegarder et quitter" dans top-bar |
| `sw.js` | **Modifié** | Bump cache v18, ajoute `storage.js` |

Dépendance externe : **JSZip** (CDN `https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`) pour export/import `.kzo`.

---

## Module `storage.js`

API publique exposée sur `window.KZOStorage` :

```js
KZOStorage.openDB()                          // → Promise<IDBDatabase>
KZOStorage.listProjects()                    // → Promise<Project[]> triés par updatedAt desc
KZOStorage.saveProject(id, data, progress)  // → Promise<void>
KZOStorage.loadProject(id)                  // → Promise<Project>
KZOStorage.deleteProject(id)               // → Promise<void> (projets + photos)
KZOStorage.savePhotos(projectId, subId, photos[])  // → Promise<void>
KZOStorage.loadPhotos(projectId)            // → Promise<Photo[]>
KZOStorage.loadPhotosBySub(projectId, subId) // → Promise<Photo[]>
KZOStorage.exportKZO(projectId)             // → Promise<Blob> fichier .kzo
KZOStorage.importKZO(file)                  // → Promise<string> projectId importé
KZOStorage.migrateLegacy()                  // → Promise<void> migration localStorage
```

---

## Écran d'accueil — `index.html`

### Structure
```
Top-bar : Logo KZO · Bouton "+ Nouvelle inspection" · Bouton "📂 Importer .kzo"
Barre de recherche : filtre en temps réel (client, adresse, code)
Filtres : Tous · En cours · Terminés
Grille de cartes (2 colonnes desktop, 1 colonne mobile)
```

### Carte projet
```
Bordure gauche colorée : orange (en cours) · vert (terminé)
Badge statut            : EN COURS | TERMINÉ
Date                    : updatedAt formaté fr-CA
Nom client              : bold
Code inspection         : bleu (#60a5fa)
Adresse                 : gris
Barre de progression    : X/12 sections
Actions au survol       : [Ouvrir] [Exporter .kzo] [Supprimer 🗑️]
```

### Interactions
- Clic carte → ouvre `KZO_Inspect.html?project={id}`
- "+ Nouvelle inspection" → `KZOStorage.saveProject(newId, emptyData)` → redirige
- "Importer .kzo" → `<input type="file" accept=".kzo">` → `KZOStorage.importKZO(file)` → recharge la liste
- "Supprimer" → `confirm("Supprimer cette inspection ? Cette action est irréversible.")` → `KZOStorage.deleteProject(id)`

---

## Inspection active — `KZO_Inspect.html`

### Chargement
Au `DOMContentLoaded`, lire `new URLSearchParams(location.search).get('project')` → `KZOStorage.loadProject(id)` → populate `inspectionData`.

Si aucun `?project` → rediriger vers `index.html`.

### Auto-save
Remplacer `saveAppState()` : appelle `KZOStorage.saveProject(currentProjectId, inspectionData, computeProgress())` (déjà debounced à chaque modification — comportement identique à avant).

### Photos
Remplacer `getActiveSectionPhotos()` / `saveAppState()` côté photos : appelle `KZOStorage.savePhotos()` et `KZOStorage.loadPhotosBySub()`.

### Bouton "Sauvegarder et quitter"
- **Top-bar** : bouton gris `💾 Sauvegarder et quitter` à gauche du logo
- **Sidebar** : bouton identique épinglé en bas du menu de navigation
- Action : `KZOStorage.saveProject(...)` → toast "Inspection sauvegardée ✓" (2s) → `location.href = 'index.html'`

### Génération PDF
Après `generateFinalReport()` réussie : `KZOStorage.saveProject(id, data, 12, 'termine')`.

### Export .kzo depuis l'inspection
Bouton "⬇️ Exporter .kzo" dans le menu options (top-bar) → `KZOStorage.exportKZO(currentProjectId)` → téléchargement `KZO-{code}-{date}.kzo`.

---

## Format du fichier `.kzo`

Archive ZIP renommée `.kzo` contenant :

```
inspection.json        — données complètes (inspectionData + métadonnées projet)
photos/
  ss_st_1_0.jpg        — photos nommées {subId}_{index}.jpg
  ss_st_1_1.jpg
  ...
```

`inspection.json` structure :
```json
{
  "version": 1,
  "exportedAt": "2026-05-02T14:30:00Z",
  "project": { "id", "code", "clientName", "address", "status", "createdAt", "updatedAt" },
  "data": { ...inspectionData },
  "photoIndex": [
    { "subId": "ss_st_1", "index": 0, "file": "photos/ss_st_1_0.jpg", "caption": "" }
  ]
}
```

À l'import, si un projet avec le même `id` existe déjà : demander confirmation "Écraser l'inspection existante ?".

---

## Flux de navigation

```
index.html
  ├── "+ Nouvelle inspection"  →  KZO_Inspect.html?project=KZO-XXXXX (nouveau)
  ├── Clic carte existante     →  KZO_Inspect.html?project=KZO-48291 (reprise)
  └── "Importer .kzo"          →  Charge fichier → index.html (liste mise à jour)

KZO_Inspect.html?project=ID
  ├── "💾 Sauvegarder et quitter"  →  toast ✓  →  index.html (statut: en_cours)
  ├── "📄 Générer PDF"              →  PDF ouvert  →  statut auto: terminé
  ├── "⬇️ Exporter .kzo"           →  téléchargement fichier
  └── "🗑️ Supprimer"               →  confirm  →  index.html
```

---

## Hors-périmètre (Groupe 0)

- Synchronisation cloud en temps réel (Groupe E)
- Signature électronique client (Groupe E)
- Partage de projet entre inspecteurs
