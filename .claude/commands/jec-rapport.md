# /jec-rapport — Travail sur le rapport PDF

Tu travailles sur le rapport PDF et les templates légaux de JEC / KZO InspectPro. Exécute les étapes suivantes, puis aide l'utilisateur avec sa demande.

## Étapes à exécuter

### 1. Charger le module boilerplate
Lis les 80 premières lignes de `boilerplate.js` — contient `BOILERPLATE`, `lettreIntro()`, et les clauses légales REIBH 2024.

### 2. Présenter le contexte opérationnel

Affiche ce rappel avant de répondre :

---
**Contexte — Rapport PDF JEC**

**Structure de `BOILERPLATE` :**
- `lettreIntro(clientName, normeSelected, inspectorName, signatureUrl, sealUrl, certifRBQ, categorieInspection)` — lettre de remise du rapport
- Clauses de limitation de responsabilité (inspection visuelle non invasive)
- Sections légales REIBH 2024

**Normes légales obligatoires dans le rapport :**
- **BNQ 3009-500** — Pratiques pour l'inspection en vue d'une transaction immobilière
- **REIBH 2024** — Règlement sur les inspecteurs en bâtiment (RBQ)
- Catégories d'inspection : 1 (unifamiliale) · 2 (multi-logements ≤ 5 unités)
- Mention obligatoire : "inspection visuelle et non destructive"

**Taxes Québec (utilisées dans rapport + Google Sheets) :**
- TPS : 5%
- TVQ : 9,975%
- Calcul : `total = prix * (1 + 0.05 + 0.09975)`

**Règle de versionnement (CRITIQUE) :**
Après toute modification de `boilerplate.js` :
1. Bumper `?v=N` sur la balise `<script src="boilerplate.js?v=N">` dans `KZO_Inspect.html`
2. Bumper `CACHE_NAME` dans `sw.js` (ex: `kzo-inspect-v15` → `v16`)
Sans ça, le navigateur sert l'ancienne version depuis le cache PWA.

**Pour ajouter une nouvelle clause légale :**
Ajouter une propriété dans l'objet `BOILERPLATE` dans `boilerplate.js`, puis référencer depuis `KZO_Inspect.html` via `BOILERPLATE.nomDeLaClause`.

**Pour modifier la lettre d'introduction :**
Éditer la fonction `lettreIntro()` dans `boilerplate.js`. Elle retourne du HTML brut — utiliser `sanitizeHTML()` sur toute donnée utilisateur insérée.
---

## Demande de l'utilisateur
$ARGUMENTS
