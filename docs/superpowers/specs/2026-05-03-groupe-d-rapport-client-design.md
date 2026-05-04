# Groupe D — Rapport Client + Prévisualisation

**Date :** 2026-05-03
**Statut :** Approuvé

---

## Objectif

Deux fonctionnalités liées au rapport :
1. **Section Prévisualisation (nouvelle section 12)** — prérapport complet inline avec filigrane, avant le Rapport Final (section 13)
2. **Rapport Client** — rapport séparé en langage accessible, style moderne coloré, déclenché par un bouton dédié dans la section Rapport Final

---

## Décisions de design

| Décision | Choix |
|----------|-------|
| Prévisualisation | Nouvelle section numérotée avant Rapport Final |
| Rendu prévisualisation | Inline dans `dynamicContent` (pattern `isCoverPage`) |
| Filigrane | Diagonales + texte "PRÉVISUALISATION" en overlay fixe, opacity 0.07 |
| Style rapport client | Option B — Moderne coloré (compteurs 2×2, cartes par section) |
| Déclencheur rapport client | Bouton "📋 Rapport Client" dans section Rapport Final (13) |
| Sections incluses | Toutes les sections (conformes + défauts) |
| Photos | Oui — seulement celles de la galerie d'inspection |
| Langage | Labels directs de data.js (déjà en français accessible) |

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `data.js` | Ajout section `s_preview` (`isPreviewPage: true`) entre `s_danger` et `s_rapport` |
| `app.js` | Rendu inline prévisualisation dans `renderSection()` + `generateClientReport()` + bouton rapport client dans section rapport |
| `KZO_Inspect.html` | Bump versions `?v=` |
| `sw.js` | Bump `CACHE_NAME` v21→v22 |

---

## Feature 1 — Section Prévisualisation

### Définition dans `data.js`

Insérer entre `s_danger` et `s_rapport` :

```js
{ id: "s_preview", title: "12. Prévisualisation du Rapport", key: "preview", icon: "👁️",
  isPreviewPage: true,
  subSections: []
},
```

L'ancienne section 12 (`s_rapport`) devient automatiquement la section 13 dans la navigation (les titres sont définis dans `data.js`, pas hardcodés).

### Rendu dans `renderSection()`

Après le bloc `if (section.isCoverPage)`, ajouter :

```js
// --- Preview Page Rendering ---
if (section.isPreviewPage) {
    _renderPreviewPage(dynamicContent);
    prevBtn.disabled = currentSectionIndex === 0;
    nextBtn.disabled = false;
    nextBtn.textContent = 'Rapport Final →';
    return;
}
```

### Fonction `_renderPreviewPage(container)`

```js
function _renderPreviewPage(container) {
    // Filigrane texte fixe (visible pendant scroll)
    const watermark = document.createElement('div');
    watermark.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:5rem;font-weight:900;color:rgba(251,191,36,0.07);pointer-events:none;z-index:0;white-space:nowrap;user-select:none;';
    watermark.textContent = 'PRÉVISUALISATION';
    container.appendChild(watermark);

    // Bannière jaune
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;';
    banner.innerHTML = `
        <span style="color:#92400e;font-weight:700;font-size:0.9rem;">👁️ PRÉVISUALISATION — Non finalisé · Relisez avant de générer</span>
        <button type="button" id="launchFinalReportBtn" style="background:#22c55e;color:white;border:none;border-radius:6px;padding:8px 16px;font-size:0.9rem;cursor:pointer;font-weight:600;">✅ Lancer le rapport final</button>
    `;
    container.appendChild(banner);

    // Contenu du rapport (réutilise la logique de generateFinalReport mais sans modal)
    const previewDiv = document.createElement('div');
    previewDiv.style.cssText = 'position:relative;z-index:1;';
    previewDiv.innerHTML = _buildReportHTML(); // helper qui retourne le HTML sans ouvrir le modal
    container.appendChild(previewDiv);

    // Bouton lancer rapport final
    document.getElementById('launchFinalReportBtn').onclick = () => {
        generateFinalReport();
    };
}
```

### Refactorisation de `generateFinalReport()`

Extraire le HTML du rapport dans une fonction `_buildReportHTML()` qui retourne le string HTML sans ouvrir le modal. `generateFinalReport()` devient :

```js
function generateFinalReport(unitId) {
    // ... validation existante ...
    const html = _buildReportHTML(unitId);
    const reportModal = document.getElementById('reportModal');
    document.getElementById('reportContent').innerHTML = html;
    // ... reste de l'ouverture du modal ...
}
```

### Filigrane diagonal (CSS inline sur chaque page)

Chaque bloc `page-break` dans `_buildReportHTML()` reçoit un `background-image` de diagonales subtiles :

```js
// Dans _buildReportHTML(), sur chaque div.page-break :
'background-image: repeating-linear-gradient(-45deg, transparent, transparent 80px, rgba(251,191,36,0.04) 80px, rgba(251,191,36,0.04) 160px);'
```

---

## Feature 2 — Rapport Client (`generateClientReport()`)

### Structure HTML générée

```html
<!-- Header -->
<div class="page-break" style="background:linear-gradient(135deg,#1e293b,#334155); color:white; padding:32px; text-align:center;">
  <h1>Rapport d'Inspection</h1>
  <p>Adresse · Date · Code · Inspecteur</p>
</div>

<!-- Compteurs 2×2 -->
<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:24px 0;">
  <div style="background:#fef2f2; border:1px solid #fca5a5; ...">
    <div style="font-size:2rem; font-weight:900; color:#dc2626;">N</div>
    <div>URGENT</div>
  </div>
  <!-- MAJEUR, SURVEILLER, CONFORMES -->
</div>

<!-- Durée de vie (si items présents) -->
<div>🔧 Durée de vie estimée...</div>

<!-- Une carte par section -->
<div style="border-left:4px solid #22c55e; ..."> ✅ Section — Aucun défaut </div>
<div style="border-left:4px solid #dc2626; ...">
  🚨 Section — Défauts
  • Label du défaut → Consulter un Spécialiste
  [photos]
</div>

<!-- Pied de page -->
<div>Nom inspecteur · Coordonnées · Signature</div>
```

### Bouton dans section Rapport Final

Dans le rendu de `s_rapport` (section 13), ajouter un bouton :

```js
const clientReportBtn = document.createElement('button');
clientReportBtn.type = 'button';
clientReportBtn.textContent = '📋 Rapport Client';
clientReportBtn.className = 'btn secondary';
clientReportBtn.onclick = () => generateClientReport();
```

À côté du bouton existant "Générer le rapport complet".

### Réutilisation des helpers

- `_buildNumberedDefects(unitFieldStates, sections)` — déjà dans `app.js`
- `_buildLifespanItems()` — déjà dans `app.js`
- `AIAgents.getSpecialist(label)` — déjà dans `ai_agents.js`

---

## Hors-périmètre Groupe D

- Export PDF automatique (l'inspecteur utilise Ctrl+P / Imprimer comme pour le rapport existant)
- Envoi par email depuis l'app (Groupe E)
- Traduction anglaise
- Personnalisation du logo dans le rapport client
