# JEC — KZO InspectPro · Guide Claude Code

## Identité du projet
- **Nom** : JEC / KZO InspectPro
- **Propriétaire** : Jean Eveillard Cazeau — kzoinspectpro@gmail.com
- **Type** : PWA offline-first d'inspection de bâtiment (Québec)
- **Version cache PWA** : `kzo-inspect-v42`
- **Protocoles supportés** : `file://` (local) · `http://localhost:8000` (serveur PS)

## Contexte
Application web progressive (PWA) pour inspecteurs certifiés RBQ au Québec. Fonctionne hors ligne via Service Worker. Supporte le mode multi-unités (Duplex, Triplex, Condo). Génère des rapports PDF conformes BNQ 3009-500 / REIBH 2024. Intègre un assistant IA multi-provider pour la rédaction de commentaires d'inspection. Synchronise les données vers Google Sheets via webhook Apps Script.

## Architecture des fichiers

### Interface & Logique principale
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `KZO_Inspect.html` | — | Interface principale — sidebar nav, modale photo, assistant IA |
| `index.html` | 13 | Redirect automatique vers `KZO_Inspect.html` (double-clic ou PWA) |
| `app.js` | 2 525 | Logique centrale : CRUD, navigation, proxy multi-unités, export PDF, chat |
| `style.css` | 801 | Thème sombre bleu, responsive mobile-first |

### Données & Contenu
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `data.js` | 314 | Structure `inspectionData` — toutes les sections et sous-sections BNQ |
| `boilerplate.js` | 558 | Templates légaux, lettre d'introduction, clauses de limitation |
| `templates.js` | 306 | `COMMENT_TEMPLATES` — phrases pré-écrites AIBQ par section d'inspection |

### IA & Intégrations
| Fichier | Lignes | Rôle |
|---------|--------|------|
| `ai_agents.js` | 1 015 | Agents IA, base `EQUIPMENT_LIFESPAN`, appels API multi-provider |
| `GOOGLE_SHEET_SCRIPT.js` | 116 | Script Apps Script — webhook Google Sheets (à déployer manuellement) |

### PWA & Lancement
| Fichier | Rôle |
|---------|------|
| `sw.js` | Service worker — cache offline, version actuelle `kzo-inspect-v15` |
| `manifest.json` | Manifeste PWA (icônes 192/512, couleurs, orientation) |
| `LANCER-INSPECTPRO.bat` / `LANCER-KZO.bat` | Lanceurs Windows (double-clic) |
| `serve.ps1` | Serveur HTTP local PowerShell sur port 8000 |
| `.claude/launch.json` | Config serveur de dev Claude Code (démarre `serve.ps1` auto) |

### Sensible — Ne jamais versionner
| Fichier | Rôle |
|---------|------|
| `config.js` | Clés API (Groq, Gemini, OpenAI, Anthropic) + profil propriétaire + `SHEETS_WEBHOOK_URL` |

## Système multi-unités
`app.js` utilise `Object.defineProperty` pour rediriger `inspectionData.fieldStates`, `comments`, `sectionComments` et `sectionPhotos` vers l'unité active (`inspectionData.currentUnitId`). Ce proxy est transparent pour tout le code existant.

Types de bâtiments qui activent automatiquement le mode multi-unités :
`Duplex` · `Triplex` · `Condo / Appartement` · `Maison de ville (Townhouse)`

Chaque unité stocke ses propres `fieldStates`, `comments`, `sectionComments` et `sectionPhotos` dans `inspectionData.units[n]`.

## Providers IA supportés

| Provider | Modèle chat | Modèle vision |
|----------|-------------|---------------|
| Groq (gratuit) | `llama-3.3-70b-versatile` | `meta-llama/llama-4-scout-17b-16e-instruct` |
| Gemini | `gemini-2.0-flash` | `gemini-2.0-flash` |
| OpenAI | `gpt-4o` | `gpt-4o` |
| Anthropic | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` |

Clé active : `localStorage.inspectpro_api_key` / `inspectpro_api_provider`

## Intégration Google Sheets

`GOOGLE_SHEET_SCRIPT.js` est un script Apps Script à déployer manuellement :
1. Google Sheet → **Extensions → Apps Script** → coller le contenu du fichier
2. **Déployer → Nouveau déploiement** (type : Application Web, accès : Tout le monde)
3. Copier l'URL générée → `config.js → SHEETS_WEBHOOK_URL`

Données transmises automatiquement : date, code inspection, inspecteur, client, adresse, téléphone, prix, TPS (5%), TVQ (9,975%), total avec taxes.

## Workflow de lancement local

```
Option 1 (Windows)     : Double-clic LANCER-INSPECTPRO.bat
Option 2 (PowerShell)  : .\serve.ps1  →  http://localhost:8000
Option 3 (Claude Code) : .claude/launch.json démarre serve.ps1 automatiquement
Option 4 (file://)     : Ouvrir KZO_Inspect.html directement — Service Worker inactif
```

## Normes de référence (Québec)
- **BNQ 3009-500** — Pratiques pour l'inspection en vue d'une transaction immobilière
- **REIBH 2024** — Règlement sur les inspecteurs en bâtiment (RBQ)
- **CNB 2020** — Code National du Bâtiment
- **CSA A770-23** — Norme nationale d'inspection de bâtiment
- **AIBQ / InterNACHI** — Normes professionnelles
- Risques spécifiques QC : pyrite, pyrrhotite, amiante, radon, filage aluminium

## Structure des données d'inspection

`inspectionData.sections[]` contient toutes les sections. Types de champs :
- `checkbox` → état : `'conforme'`, `'defaut'`, `'surveiller'`, `'na'`
- `select` / `text` / `number` / `file` / `clients` / `action`

États stockés par unité dans `inspectionData.units[n].fieldStates` — accessible via le proxy `inspectionData.fieldStates` (pointe toujours vers l'unité active).

## Règles de développement

### Sécurité
- Toujours utiliser `sanitizeHTML()` avant tout `innerHTML` avec données utilisateur
- Toujours valider `_isSafePhotoUrl(url)` avant d'assigner une URL photo à `img.src` ou de l'interpoler dans `innerHTML`
- Ne jamais exposer `config.js` dans git (protégé dans `.gitignore`)
- La clé API doit rester dans `localStorage` uniquement — jamais dans le HTML ou JS versionné
- Ne jamais intercepter ni mettre en cache les requêtes vers les API IA dans `sw.js` — les URLs Gemini contiennent la clé en query string
- Token OAuth Google Drive stocké en `sessionStorage` (disparaît à la fermeture du navigateur)
- **Limite connue — auth client-side** : `auth.js` utilise un flag `sessionStorage` pour la session. Un utilisateur avec accès aux DevTools peut contourner la vérification via `sessionStorage.setItem('kzo_auth','1')`. Le verrou `_loginAttempts` est aussi réinitialisé à chaque rechargement de page. Cette protection est de l'**obfuscation**, pas de la sécurité réelle — elle convient pour une app monoutilisateur sur appareil privé, mais ne constitue pas une barrière d'accès robuste si l'appareil est compromis.

### Versionnement PWA
- Bumper `?v=N` dans `KZO_Inspect.html` après chaque modification de script JS ou CSS
- Bumper `CACHE_NAME` dans `sw.js` (ex: `kzo-inspect-v15` → `v16`) après toute modification de fichier mis en cache — sans ça, les navigateurs servent l'ancien cache

### Multi-unités
- Ne jamais accéder directement à `inspectionData.units[n].fieldStates` — toujours passer par le proxy `inspectionData.fieldStates`
- Le proxy est défini avec `configurable: true` — utiliser `delete inspectionData.fieldStates` avant tout `Object.defineProperty` sur les mêmes clés pour éviter les erreurs silencieuses
