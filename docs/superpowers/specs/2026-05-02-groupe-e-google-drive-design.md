# Groupe E — Intégration Google Drive + Sheets

**Date :** 2026-05-02
**Statut :** Approuvé
**Implémentation :** Après Groupe 0, A, B, C, D

---

## Objectif

À la génération du PDF, l'app uploade automatiquement vers Google Drive :
- Toutes les photos de terrain de l'inspection
- Le rapport PDF final

Et déclenche l'ajout d'une ligne dans le Google Sheet maître (webhook Apps Script existant).

---

## Décisions de design

| Décision | Choix |
|----------|-------|
| Authentification | Google Identity Services (OAuth 2.0) — token localStorage |
| Déclencheur | Génération du PDF (automatique) |
| Dossier principal | `KZO InspectPro` |
| Sous-dossier client | Nom du client (ex: `Martin Tremblay`) |
| Sous-dossier inspection | `{Code} — {Date}` (ex: `KZO-48291 — 2026-05-02`) |
| Contenu par inspection | `photos/photo_1.jpg`, ..., `rapport_KZO-48291.pdf` |
| Google Sheet | Feuille maître — webhook Apps Script existant |
| Mode hors-ligne | Queue d'upload — exécutée à la reconnexion |

---

## Structure Google Drive

```
KZO InspectPro/                          ← créé au 1er upload si absent
  Martin Tremblay/                       ← créé si absent
    KZO-48291 — 2026-05-02/             ← créé à chaque inspection
      photos/
        photo_ss_st_1_0.jpg
        photo_ss_st_1_1.jpg
        ...
      rapport_KZO-48291.pdf
  Sophie Gagné/
    KZO-31748 — 2026-04-28/
      photos/
        ...
      rapport_KZO-31748.pdf
```

Si le client a plusieurs inspections → un sous-dossier distinct par inspection (jamais d'écrasement).

---

## Setup unique (15 min)

1. Google Cloud Console → Nouveau projet → Activer **Google Drive API**
2. Identifiants → Créer un **OAuth 2.0 Client ID** (type : Application Web)
3. Origines autorisées : `http://localhost:8000` + `file://`
4. Copier le **Client ID** → `config.js → GOOGLE_DRIVE_CLIENT_ID`

---

## Fichiers

| Fichier | Action | Description |
|---------|--------|-------------|
| `google_drive.js` | **Nouveau** | Authentification OAuth + Drive API abstraction |
| `config.js` | **Modifié** | Ajouter `GOOGLE_DRIVE_CLIENT_ID` |
| `app.js` | **Modifié** | Appel `GoogleDrive.syncInspection()` dans `generateFinalReport()` |
| `KZO_Inspect.html` | **Modifié** | Charger `google_drive.js` + indicateur de sync Drive dans top-bar |
| `sw.js` | **Modifié** | Bump cache, ajouter `google_drive.js` |

---

## Module `google_drive.js`

API publique `window.GoogleDrive` :

```js
GoogleDrive.init()
// Charge Google Identity Services, vérifie token existant en localStorage

GoogleDrive.isAuthenticated()
// → boolean — token valide présent

GoogleDrive.authenticate()
// → Promise<void> — ouvre popup OAuth si nécessaire

GoogleDrive.syncInspection(projectId, pdfBlob)
// → Promise<SyncResult> — upload complet (photos + PDF)
// Crée arborescence Drive si absente
// Appelle le webhook Google Sheets
// Gère la queue offline si pas de connexion

GoogleDrive.getSyncStatus(projectId)
// → 'synced' | 'pending' | 'error' | 'not_synced'
```

### Flux d'upload

```
generateFinalReport()
  ↓
GoogleDrive.syncInspection(projectId, pdfBlob)
  ↓
  1. GoogleDrive.isAuthenticated() ?
     Non → GoogleDrive.authenticate() → popup OAuth → token sauvegardé
  ↓
  2. Créer/trouver dossier "KZO InspectPro"
  ↓
  3. Créer/trouver dossier "{Client Name}"
  ↓
  4. Créer dossier "{Code} — {Date}"
  ↓
  5. Créer sous-dossier "photos/"
  ↓
  6. Upload photos une par une (séquentiel — robuste si coupure)
  ↓
  7. Upload rapport PDF
  ↓
  8. Appel webhook Apps Script → ligne Google Sheet
  ↓
  9. showToast("✅ Synchronisé vers Google Drive", 'success')
```

### Mode hors-ligne

Si pas de connexion au moment de `generateFinalReport()` :
- Sauvegarder `{ projectId, status: 'pending' }` dans localStorage
- Toast : `"⏳ PDF généré — synchronisation Drive dès reconnexion"`
- Au prochain `online` event → exécuter automatiquement la queue pending

---

## Indicateur de sync dans la top-bar

Icône discrète à droite du bouton "📄 IA Rapport" :

```
☁️ — gris   : non synchronisé (statut: not_synced)
⏳ — bleu   : upload en cours
✅ — vert   : synchronisé (avec date/heure au survol)
❌ — rouge  : erreur (clic → réessayer)
⏳ — orange : en attente de connexion (queue pending)
```

---

## Google Sheet maître

Utilise le webhook Apps Script **existant** (`SHEETS_WEBHOOK_URL` dans config.js).

Déclenché après l'upload Drive réussi. Données envoyées :

| Colonne | Valeur |
|---------|--------|
| Date | date de l'inspection |
| Code | numéro d'inspection |
| Client | nom du client |
| Téléphone | numéro de téléphone |
| Prix HT | prix avant taxes |
| TPS (5%) | calculé |
| TVQ (9,975%) | calculé |
| Total | total avec taxes |
| Lien Drive | URL du dossier inspection dans Drive |

La colonne **Lien Drive** est nouvelle — pointe directement vers le dossier `KZO-48291 — 2026-05-02` dans Drive pour accès rapide.

---

## Hors-périmètre

- Partage de fichiers Drive avec d'autres utilisateurs
- Sync bidirectionnelle (Drive → app)
- Multi-compte Google
