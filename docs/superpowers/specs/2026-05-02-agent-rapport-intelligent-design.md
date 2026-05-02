# Agent Rapport Intelligent — Spec de design
**Projet :** JEC / KZO InspectPro
**Date :** 2026-05-02
**Statut :** Approuvé par l'utilisateur

---

## Objectif

Ajouter un agent IA de génération de rapport à deux niveaux :
1. **Synthèse par section** — paragraphe narratif REIBH 2024 pour une section donnée
2. **Rapport complet** — synthèse narrative globale de toute l'inspection

Sortie via popup de prévisualisation → bouton "Insérer" si approuvé.

---

## Contraintes

- Aucun nouveau fichier (pas de bump `sw.js` pour un nouveau `<script>`)
- Ne pas modifier les boutons "IA Rédige" par sous-section déjà existants
- Utiliser le provider IA actif (`localStorage.inspectpro_api_provider`)
- `sanitizeHTML()` sur toute réponse IA insérée dans le DOM
- Prompt en français québécois, voix impersonnelle, style AIBQ

---

## Architecture

### Fichier : `ai_agents.js` — 2 nouvelles fonctions

#### `generateSectionSynthesis(sectionId, sectionTitle)`

**Entrées :**
- `sectionId` — ex: `"s_struct"`, `"s_toit"`, `"s_elec"`
- `sectionTitle` — ex: `"Extérieur & Structure"`

**Logique :**
1. Parcourt `inspectionData.sections` pour trouver la section
2. Pour chaque champ `checkbox` de la section, lit `inspectionData.fieldStates[fieldId]`
3. Catégorise : `defaut` / `surveiller` / `conforme` / `na`
4. Lit `inspectionData.sectionComments[sectionId]` (notes existantes de l'inspecteur)
5. Construit le prompt (voir section Prompts)
6. Appelle `callAIProvider(prompt)` avec le provider actif
7. Retourne `{ text: string, sectionId, sectionTitle }`

**Gestion d'erreur :** si aucun champ rempli → retourne message "Aucun champ renseigné dans cette section."

---

#### `generateFullReport()`

**Entrées :** aucune — lit directement `inspectionData`

**Logique :**
1. Lit `inspectionData.clientInfo` : `name`, `address`, `inspectorName`, `inspectionDate`, `propType`, `normatiquePratique`
2. Pour chaque section (hors `s_cover`) :
   - Compte `defaut`, `surveiller`, `conforme`
   - Collecte les labels des champs en `defaut` (pour le prompt)
   - Lit `inspectionData.sectionComments[sectionId]`
3. Construit le prompt global (voir section Prompts)
4. Appelle `callAIProvider(prompt)`
5. Retourne `{ text: string }`

**Gestion d'erreur :** si aucun champ rempli dans aucune section → retourne message "Veuillez remplir au moins une section avant de générer le rapport."

---

### Fichier : `app.js` — UI

#### Bouton "✨ IA Synthèse" (par section)

- Ajouté dans le rendu de chaque en-tête de section
- Sélecteur cible : là où le titre de section est rendu (rechercher le pattern de rendu des `section.title`)
- Apparence : bouton secondaire `btn-ai-synthese`, icône ✨, texte "IA Synthèse"
- Distinct visuellement des boutons "IA Rédige" (sous-section) — taille et couleur différentes
- État loading : désactive le bouton + affiche "Génération..." pendant l'appel

#### Bouton "✨ IA Rapport Complet" (global)

- Ajouté dans la barre de navigation principale ou le panneau de contrôle
- Toujours visible, peu importe la section active
- État loading : désactive + spinner

#### Popup de prévisualisation (modale)

Réutilise le pattern modal existant dans `app.js`. Structure :

```
┌─────────────────────────────────────────┐
│ ✨ Synthèse IA — Extérieur & Structure  │
├─────────────────────────────────────────┤
│                                         │
│  [Texte généré par l'IA, scrollable]   │
│                                         │
├─────────────────────────────────────────┤
│  [Fermer]          [Insérer ✓]         │
└─────────────────────────────────────────┘
```

**Action "Insérer" — synthèse section :**
→ `inspectionData.sectionComments[sectionId] = texteGenere`
→ Met à jour le champ textarea de commentaire de section si visible
→ Toast : "Synthèse insérée dans les commentaires de la section"

**Action "Insérer" — rapport complet :**
→ Stocke dans `inspectionData.rapportNarratifIA = texteGenere`
→ Affiche dans une zone dédiée "Rapport narratif IA" dans la section `s_admin` (sous-section existante ou nouvelle)
→ Toast : "Rapport narratif inséré"

---

## Prompts

### Prompt synthèse section

```
Tu es un inspecteur en bâtiment certifié RBQ au Québec, rédigeant un rapport selon la norme REIBH 2024 et BNQ 3009-500.

Section inspectée : {sectionTitle}

Résultats de l'inspection :
- Défauts détectés ({defautCount}) : {defautLabels}
- Points à surveiller ({surveillerCount}) : {surveillerLabels}
- Éléments conformes : {conformeCount}
- Notes de l'inspecteur : {notesInspecteur}

Rédige un paragraphe de synthèse professionnel en français québécois (voix impersonnelle, style AIBQ) qui :
1. Décrit les défauts observés avec leur nature
2. Évalue la sévérité globale (URGENT / MAJEUR / À SURVEILLER)
3. Recommande les actions correctives et le type de spécialiste à consulter
4. Conclut avec la mention légale : "Cette observation est basée sur une inspection visuelle et non destructive selon REIBH 2024."

Longueur : 150 à 250 mots. Ton : factuel, professionnel, non alarmiste.
Ne pas inventer de défauts non mentionnés. Si aucun défaut : confirmer la conformité générale.
```

### Prompt rapport complet

```
Tu es un inspecteur en bâtiment certifié RBQ au Québec, rédigeant le rapport final selon REIBH 2024 et BNQ 3009-500.

Informations générales :
- Client : {clientName}
- Adresse : {address}
- Date : {inspectionDate}
- Inspecteur : {inspectorName}
- Type de bâtiment : {propType}
- Norme de pratique : {normePratique}

Résumé de l'inspection par section :
{pourChaqueSection : "## {titre} : {defautCount} défaut(s), {surveillerCount} surveillance — {defautsLabels}"}

Génère un rapport narratif complet comprenant :
1. **Introduction** (nature visuelle non invasive, portée de l'inspection)
2. **Synthèse par section** (un paragraphe par section avec défauts et recommandations)
3. **Points critiques prioritaires** (classés URGENT > MAJEUR > À SURVEILLER)
4. **Conclusion et recommandations générales**
5. **Mention légale REIBH 2024**

Style : voix impersonnelle, factuelle, professionnelle. Langue : français québécois.
Longueur totale : 500 à 800 mots.
Ne pas inventer de défauts non mentionnés dans le résumé.
```

---

## Fichiers modifiés

| Fichier | Nature de la modification |
|---------|--------------------------|
| `ai_agents.js` | Ajout `generateSectionSynthesis()` et `generateFullReport()` |
| `app.js` | Ajout boutons UI, popup modale, logique "Insérer" |
| `KZO_Inspect.html` | Bump `?v=N` sur `ai_agents.js` et `app.js` |
| `sw.js` | Bump `CACHE_NAME` (`kzo-inspect-v15` → `v16`) |

---

## Tests à valider

- [ ] Synthèse générée correctement avec un provider Groq (gratuit)
- [ ] Synthèse correcte quand la section n'a aucun défaut (message de conformité)
- [ ] Rapport complet parcourt toutes les sections (hors s_cover)
- [ ] "Insérer" écrit dans `sectionComments` sans écraser les données multi-unités
- [ ] `sanitizeHTML()` appliqué avant insertion dans le DOM
- [ ] Toast de confirmation visible après insertion
- [ ] Loading state désactive bien le bouton pendant la génération
