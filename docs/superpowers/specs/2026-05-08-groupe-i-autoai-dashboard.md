# Groupe I — Auto-analyse IA multi-photos & Tableau de bord

**Date :** 2026-05-08
**Statut :** Approuvé
**Priorité :** Nice-to-have (vert)

---

## Objectif

Deux améliorations de confort pour l'inspecteur :
1. Étendre l'auto-analyse IA aux uploads multi-photos (avec toggle on/off)
2. Donner une vue d'ensemble des inspections passées directement dans l'app

---

## Feature I1 — Auto-analyse IA multi-photos

### Comportement actuel

Quand **une seule photo** est uploadée, `AIAgents.analyzePhotoField` est appelé automatiquement et le panneau d'analyse s'affiche. Pour les uploads multiples (>1 photo), aucune analyse n'est déclenchée.

### Comportement cible

**Toggle global** (Paramètres, section existante) :
- Label : `🤖 Analyse IA automatique à l'upload`
- Type : checkbox
- Stockage : `localStorage.kzo_auto_ai_photos` (`'1'` = activé, `'0'` = désactivé)
- Défaut : activé (`'1'`)
- Si désactivé, l'auto-analyse ne se déclenche plus même pour 1 photo

**Upload d'une seule photo** (comportement existant, inchangé si toggle activé) :
- Analyse déclenchée automatiquement après upload
- Panneau `showPhotoAnalysis` affiché comme avant

**Upload de plusieurs photos** (nouveau) :
- Toutes les photos sont ajoutées à la galerie sans analyse immédiate
- Le titre de la `galleryContainer` affiche un bouton `🤖 Analyser toutes (X)` si le provider actif supporte la vision
- Si provider = Groq : bouton remplacé par un span grisé `🤖 Vision non disponible (Groq)`
- Au clic sur le bouton :
  1. Bouton remplacé par `⏳ Analyse 1/X...`
  2. Pour chaque photo, appel séquentiel à `AIAgents.analyzePhotoField(base64, subTitle)`
  3. Si résultat : sauvegarde `result.description` dans `getActiveComments()[sub.id].text`
  4. Compteur mis à jour `⏳ Analyse 2/X...`
  5. Fin : toast `✅ X photos analysées` + re-render galerie + bouton disparaît

### Architecture

Tout dans `app.js`. Le bouton est injecté dans la section titre de chaque `galleryContainer` lors du render de la galerie (fonction existante qui construit le `galleryContainer`).

Le toggle est ajouté dans la modale **Paramètres** existante (`⚙️ Paramètres`, bouton dans le header), dans la section `<!-- Paramètres IA -->` de cette modale.

---

## Feature I3 — Tableau de bord

### Accès

Nouvelle entrée dans la sidebar : `📊 Tableau de bord`, positionnée en premier (avant `s_cover`). Clic → `renderSection('s_dashboard')`.

La section `s_dashboard` est virtuelle (non définie dans `data.js`) — gérée directement dans `renderNavigation()` et `renderSection()`.

### Contenu

**Cartes stats (rangée du haut — 4 cartes) :**

| Carte | Valeur |
|-------|--------|
| Total | `projects.length` |
| En cours | `projects.filter(p => p.status !== 'termine').length` |
| Terminées | `projects.filter(p => p.status === 'termine').length` |
| Ce mois | projets dont `createdAt` est dans le mois calendaire actuel |

**Liste des inspections (dessous) :**

Chaque ligne :
- Code inspection (ex. `KZO-20260508-001`)
- Nom client
- Adresse
- Date (formatée `DD MMM YYYY`)
- Badge statut : `✅ Terminée` (vert) / `🔄 En cours` (bleu)
- Barre de progression (`progress` = sections inspectées)
- Bouton `📂 Ouvrir` → `KZOStorage.loadProject(id)` puis : `Object.assign(inspectionData.clientInfo, project.data.clientInfo)`, remplace `inspectionData.units`, `inspectionData.currentUnitId`, puis `renderNavigation()` + `renderSection('s_cover')`

**État vide :** Si aucun projet → message centré `Aucune inspection enregistrée. Commencez une nouvelle inspection.`

**Tri :** Par `updatedAt` décroissant (déjà trié par `KZOStorage.listProjects()`).

### Architecture

Nouveau bloc dans `renderSection()` :
```js
if (sectionId === 's_dashboard') {
    _renderDashboard(container);
    return;
}
```

Fonction `async function _renderDashboard(container)` définie inline dans `app.js` :
- Appel `KZOStorage.listProjects()`
- Calcul des stats
- Injection HTML dans `container.innerHTML`
- Listener sur les boutons `📂 Ouvrir`

Navigation sidebar : entrée `s_dashboard` ajoutée manuellement dans `renderNavigation()` avant la boucle `inspectionData.sections.forEach`.

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|--------------|
| `app.js` | Toggle paramètres I1, bouton `Analyser toutes` galerie, `_renderDashboard()`, nav sidebar |
| `sw.js` | Cache v28 |
| `KZO_Inspect.html` | `app.js?v=27` |

---

## Contraintes

- Pas de nouveau fichier JS — tout dans `app.js`
- `_renderDashboard` utilise uniquement `KZOStorage.listProjects()` (déjà disponible dans `storage.js`)
- Le bouton `Ouvrir` recharge l'état via `KZOStorage.loadProject(id)` → `Object.assign(inspectionData, ...)` + `renderNavigation()` + `renderSection('s_cover')`
- L'analyse multi-photos est séquentielle (pas parallèle) pour éviter le rate-limiting des API
- Le toggle `kzo_auto_ai_photos` est vérifié avant chaque déclenchement d'analyse automatique (upload single ET multi)
- Pas d'estimation de prix — laissé aux techniciens spécialisés
