# Groupe H — Mode Hors-ligne, Compression Photos, Rapport PDF

**Date :** 2026-05-08
**Statut :** Approuvé (décision autonome — utilisateur absent)
**Priorité :** Importante

---

## Objectif

Améliorer la robustesse et la qualité professionnelle de KZO InspectPro sur 3 axes :
1. Rendre l'état hors-ligne évident pour l'inspecteur
2. Prévenir la saturation du stockage par les photos
3. Élever la qualité visuelle du rapport PDF

---

## Feature H1 — Mode Hors-ligne Robuste

### Comportement

**Quand `!navigator.onLine` :**
- Bandeau rouge persistant sous la topbar : `📵 Mode hors ligne — Données sauvegardées localement. Sync Drive dès reconnexion.`
- `driveSyncIndicator` passe en `pending` automatiquement

**Quand reconnecté (`online`) :**
- Bandeau disparaît avec animation fade-out
- Toast : `✅ Connexion rétablie — synchronisation en cours...`
- Retry automatique de la queue Drive

### Architecture

Nouveau module inline dans `app.js` : `function initOfflineBanner()` — IIFE simple, pas de fichier séparé.

- `window.addEventListener('offline', ...)` → affiche bandeau, met à jour `driveSyncIndicator`
- `window.addEventListener('online', ...)` → cache bandeau, toast, retry Drive si queue non vide
- Bandeau DOM : `<div id="offlineBanner">` créé dynamiquement et inséré après `<div class="topbar">`

### Persistance

Aucune donnée à persister — état transient basé sur `navigator.onLine`.

---

## Feature H2 — Compression Photos Intelligente

### Seuils

| Paramètre | Avant | Après |
|-----------|-------|-------|
| `maxWidth` | 1200 px | 800 px |
| `quality` | 0.75 | 0.65 |
| Taille max par photo | ~300 KB base64 | ~150 KB base64 |

### Avertissement stockage

Après chaque ajout de photo, calculer la taille totale estimée de `unit.sectionPhotos` :
```js
function _estimatePhotosSize(unit) {
    let bytes = 0;
    Object.values(unit.sectionPhotos || {}).forEach(arr =>
        arr.forEach(p => { bytes += (p.url || '').length * 0.75; })
    );
    return bytes;
}
```

- Si > **3 MB** : toast warning `⚠️ Stockage photos : ~Xmo. Sauvegardez régulièrement (.kzo).`
- Si > **6 MB** : toast error `❌ Stockage photos critique (~Xmo). Exportez le fichier .kzo maintenant.`
- Seuils vérifiés après chaque upload, pas en continu.

### Compteur de photos

Badge discret dans chaque `galleryContainer` title : `📸 Photos (X) — ~YKB`

---

## Feature H3 — Rapport PDF de Qualité Supérieure

### Table des matières

Insérée après la page de couverture, avant les sections d'inspection.

Structure HTML :
```
📋 Table des matières
  1. Documents & Pré-inspection ........ p.1
  2. Extérieur & Structure ............. p.2
  3. Intérieur & Menuiserie ............ p.3
  ...
  Sommaire des défauts ................. p.X
```

Implémentation : liste `<ol>` avec `counter-reset` CSS, liens d'ancres internes (`href="#section-N"`).

### Sommaire exécutif amélioré

Le sommaire existe déjà. Améliorations :
- Ajouter une **barre de progression visuelle** par catégorie (Urgent / Majeur / Surveiller / Conforme)
- Ajouter un **tableau récapitulatif** top 5 des défauts urgents
- Ajouter la **date + heure de génération** du rapport

### Sections d'inspection — style amélioré

- Titre de section avec icône colorée (déjà partiellement en place)
- Séparateur visuel entre sous-sections
- Photos en grille 3 colonnes (vs flex actuel)

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `app.js` | `initOfflineBanner()`, compression 800/0.65, warning stockage, badge photos, TOC + exec summary améliorés |
| `sw.js` | Cache v27 |
| `KZO_Inspect.html` | app.js?v=26 |

---

## Contraintes

- Pas de nouveau fichier JS — tout dans `app.js`
- `initOfflineBanner()` appelé une fois à l'init (après le DOMContentLoaded setup)
- La compression réduite s'applique aux nouveaux uploads uniquement, pas aux photos existantes
- Le TOC utilise `id="section-N"` sur chaque `<div class="page-break">` dans le rapport
- Seuils de stockage basés sur estimation base64 (`.length * 0.75` ≈ octets réels)
