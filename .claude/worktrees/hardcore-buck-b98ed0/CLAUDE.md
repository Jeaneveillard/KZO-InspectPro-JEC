# KZO InspectPro — Guide Claude Code

## Contexte
Application PWA d'inspection en bâtiment pour inspecteurs certifiés RBQ au Québec.
Propriétaire : Jean Eveillard Cazeau — KZO InspectPro (kzoinspectpro@gmail.com)
Protocole : `file://` (pas de HTTPS, pas de service worker actif en local)

## Structure des fichiers
- `KZO_Inspect.html` — Interface principale (sidebar nav, assistant IA, modale photo)
- `app.js` — Logique applicative, navigation, CRUD, chat, analyse photo IA
- `ai_agents.js` — Agents IA simulés + appels API (Groq, Gemini, OpenAI, Anthropic)
- `data.js` — Structure complète des sections d'inspection (`inspectionData`)
- `boilerplate.js` — Textes légaux, clauses, boilerplate rapport PDF
- `config.js` — Clés API et profil propriétaire (**ne jamais versionner**)
- `style.css` — Styles (thème sombre bleu, responsive)
- `sw.js` — Service worker (cache PWA)

## Providers IA supportés
| Provider | Modèle chat | Modèle vision |
|----------|-------------|---------------|
| Groq (gratuit) | `llama-3.3-70b-versatile` | `meta-llama/llama-4-scout-17b-16e-instruct` |
| Gemini | auto-découverte `gemini-1.5-flash` | `gemini-1.5-flash` |
| OpenAI | `gpt-4o` | `gpt-4o` |
| Anthropic | `claude-sonnet-4-5` | `claude-haiku-4-5-20251001` |

Clé stockée dans `localStorage` → `inspectpro_api_key` / `inspectpro_api_provider`

## Normes de référence (Québec)
- **BNQ 3009-500** — Pratiques pour l'inspection en vue d'une transaction immobilière
- **REIBH 2024** — Règlement sur les inspecteurs en bâtiment (RBQ)
- **CNB 2020** — Code National du Bâtiment
- **AIBQ / InterNACHI** — Normes professionnelles
- Risques spécifiques QC : pyrite, pyrrhotite, amiante, radon, filage aluminium

## Données d'inspection
`inspectionData.sections[]` contient toutes les sections. Chaque champ peut être :
- `checkbox` → état : `'conforme'`, `'defaut'`, `'surveiller'`, `'na'`
- `select` / `text` / `number` / `file` / `clients` / `action`

États stockés dans `inspectionData.fieldStates` (proxy vers l'unité active en mode multi-unités).

## Règles de développement
- Toujours utiliser `sanitizeHTML()` avant tout `innerHTML` avec données utilisateur
- Ne jamais exposer `config.js` dans git (voir `.gitignore`)
- Bumper les versions `?v=N` dans `KZO_Inspect.html` après chaque modification de script
- Bumper `CACHE_NAME` dans `sw.js` pour forcer le rechargement du cache PWA
- La clé `inspectpro_api_key` doit rester dans `localStorage` uniquement
