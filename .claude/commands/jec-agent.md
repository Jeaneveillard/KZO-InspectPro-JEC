# /jec-agent — Travail sur les agents IA

Tu travailles sur les agents IA et les intégrations de providers de JEC / KZO InspectPro. Exécute les étapes suivantes, puis aide l'utilisateur avec sa demande.

## Étapes à exécuter

### 1. Charger le module agents
Lis les 120 premières lignes de `ai_agents.js` — contient `EQUIPMENT_LIFESPAN` (base de données durées de vie) et `estimateResidualLife()`.

### 2. Présenter le contexte opérationnel

Affiche ce rappel avant de répondre :

---
**Contexte — Agents IA JEC**

**Providers supportés (modèles à jour) :**

| Provider | Chat | Vision | Clé localStorage |
|----------|------|--------|-----------------|
| Groq | `llama-3.3-70b-versatile` | `meta-llama/llama-4-scout-17b-16e-instruct` | `inspectpro_api_key` |
| Gemini | `gemini-2.0-flash` | `gemini-2.0-flash` | `inspectpro_api_key` |
| OpenAI | `gpt-4o` | `gpt-4o` | `inspectpro_api_key` |
| Anthropic | `claude-sonnet-4-6` | `claude-haiku-4-5-20251001` | `inspectpro_api_key` |

Provider actif : `localStorage.getItem('inspectpro_api_provider')`

**Règles de sécurité (CRITIQUES) :**
- La clé API reste dans `localStorage` uniquement — jamais dans le code JS versionné
- Ne jamais intercepter les requêtes API dans `sw.js` (URLs Gemini contiennent la clé en query string)
- Toujours utiliser `sanitizeHTML()` sur toute réponse IA insérée dans le DOM

**Signature d'appel d'un agent IA (pattern existant dans `ai_agents.js`) :**
```js
async function callAIProvider(prompt, imageBase64 = null) {
    const provider = localStorage.getItem('inspectpro_api_provider') || 'groq';
    const apiKey = localStorage.getItem('inspectpro_api_key');
    // → dispatch vers Groq / Gemini / OpenAI / Anthropic selon provider
}
```

**`EQUIPMENT_LIFESPAN` — pour ajouter un équipement :**
```js
"nom-équipement": { min: X, max: Y, label: "Nom affiché", signes: "Signes de fin de vie" }
```
---

## Demande de l'utilisateur
$ARGUMENTS
