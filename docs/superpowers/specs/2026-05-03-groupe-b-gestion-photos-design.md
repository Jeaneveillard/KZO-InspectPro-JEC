# Groupe B — Gestion photos améliorée

**Date :** 2026-05-03
**Statut :** Approuvé

---

## Objectif

Enrichir la gestion des photos dans KZO InspectPro avec deux fonctionnalités :
1. **Légende par photo** — caption optionnelle à la capture + éditable dans la galerie + rendu dans le PDF
2. **Annotation de photos** — éditeur canvas (Flèches + Cercles + Texte + Couleur + Undo) accessible depuis la galerie

---

## Décisions de design

| Décision | Choix |
|----------|-------|
| Niveau annotation | Option B — Flèches + Cercles + Texte + Couleur |
| Caption entry | Option C — prompt à la capture + éditable dans la galerie |
| Undo | Undo dernier trait (shapes.pop()) |
| Implémentation | Canvas API + shapes[] + redrawCanvas() — zéro dépendance |
| Prompt texte | `window.prompt()` natif (offline-safe) |

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `app.js` | Ajout caption à la capture, mise à jour `renderGallery()`, éditeur annotation |
| `KZO_Inspect.html` | Bump version `?v=` |
| `sw.js` | Bump `CACHE_NAME` v19→v20 |

---

## Feature 1 — Légende par photo

### Structure de données

Chaque objet photo passe de `{ url }` à :
```js
{ url: 'data:image/jpeg;base64,...', caption: '', originalUrl: null }
```

- `caption` : légende saisie par l'inspecteur (string vide par défaut)
- `originalUrl` : copie de l'URL originale stockée au moment de la première annotation (`null` = jamais annoté ou revert effectué)

Les photos existantes sans `caption` restent compatibles (traitées comme `caption: ''`).

### À la capture

Après ajout de la photo dans `sectionPhotos`, afficher un input non-bloquant sous la nouvelle photo :
- `placeholder="Légende (optionnel)"`
- Bouton Confirmer ou Enter → sauvegarde `caption` dans l'objet photo
- Skip possible (clic ailleurs ou Enter vide)

### Dans la galerie (`renderGallery()`)

Chaque photo affiche sa légende en dessous :
- Si vide : `<span class="photo-caption-placeholder">Ajouter une légende...</span>` (grisé)
- Si non vide : `<span class="photo-caption">` avec le texte
- Tap sur le texte/placeholder → `<input>` inline éditable → `blur`/Enter → sauvegarde dans `sectionPhotos`

### Dans le PDF (`generateFinalReport()`)

Dans la boucle existante sur les photos :
```html
<figure>
  <img src="${photo.url}" ...>
  ${photo.caption ? `<figcaption class="photo-caption">${photo.caption}</figcaption>` : ''}
</figure>
```

---

## Feature 2 — Annotation de photos

### Déclencheur

Bouton `✏️ Annoter` sur chaque photo dans `renderGallery()`.

### Modal plein écran

```
┌─────────────────────────────────────┐
│  ← Annuler          ✓ Sauvegarder  │
├─────────────────────────────────────┤
│  [Canvas : photo en fond]           │
│  (événements touch/mouse)           │
├─────────────────────────────────────┤
│  ↗  ⬤  T  🎨  ↩                   │
│ Flèche Cercle Texte Couleur Undo    │
└─────────────────────────────────────┘
```

### Logique interne

**Structure de shapes :**
```js
// shapes[] — tableau global de l'éditeur
{
  type: 'arrow' | 'circle' | 'text',
  startX, startY,    // origine du geste
  endX, endY,        // fin du geste
  color: '#dc2626',  // couleur active au moment du tracé
  text: ''           // pour type 'text' seulement
}
```

**`redrawCanvas(ctx, img, shapes)`**
1. `ctx.clearRect(0, 0, canvas.width, canvas.height)`
2. `ctx.drawImage(img, 0, 0, canvas.width, canvas.height)`
3. Itère sur `shapes[]` et dessine chaque forme

**Outil flèche** — ligne avec tête de flèche (2 segments ~15px à l'extrémité)

**Outil cercle** — `ctx.arc()` centré sur `(startX, startY)`, rayon = distance vers `(endX, endY)`

**Outil texte** — `window.prompt('Texte :', '')` → place le texte à `(startX, startY)` via `ctx.fillText()`

**Couleurs preset :**
```js
const ANNOTATION_COLORS = ['#dc2626', '#f59e0b', '#3b82f6', '#ffffff'];
```
Sélecteur 4 pastilles cliquables dans la toolbar.

**Undo** : `shapes.pop()` + `redrawCanvas()`

### Sauvegarde

```js
// Si première annotation sur cette photo
if (!photo.originalUrl) photo.originalUrl = photo.url;
// Export canvas → remplace url
photo.url = canvas.toDataURL('image/jpeg', 0.85);
saveAppState();
```

### Annuler

```js
if (photo.originalUrl) {
  photo.url = photo.originalUrl;
  photo.originalUrl = null;
  saveAppState();
}
// Ferme le modal sans rien modifier si jamais annoté
```

---

## Hors-périmètre Groupe B

- Undo multi-niveaux (historique complet) — `shapes.pop()` un seul niveau suffit pour le terrain
- Partage ou export séparé d'une photo annotée
- Filtres photo (luminosité, contraste)
- Annotation sur vidéo
