# Groupe A — Rapport PDF enrichi

**Date :** 2026-05-03
**Statut :** Approuvé

---

## Objectif

Enrichir le rapport PDF de KZO InspectPro avec 4 fonctionnalités professionnelles :
1. Sommaire Exécutif auto-généré (page résumé avec défauts numérotés + durée de vie)
2. Numérotation automatique des défauts (#1 à #N)
3. Durée de vie résiduelle + spécialiste recommandé (sans coût)
4. Pyrrhotite — distinction légale avec pyrite (Québec)

---

## Décisions de design

| Décision | Choix |
|----------|-------|
| Layout Sommaire | Option C — liste numérotée par priorité (URGENT / MAJEUR / SURVEILLER) |
| Durée de vie | Dans chaque section ET dans le Sommaire |
| Spécialiste | `AIAgents.getSpecialist(label)` dans `ai_agents.js` — sans coût |
| Numérotation | Globale (#1 à #N), triée URGENT → MAJEUR → SURVEILLER |
| Implémentation | Approche B — helpers dans `app.js` + `getSpecialist()` dans `ai_agents.js` |

---

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `ai_agents.js` | Ajout `AIAgents.getSpecialist(label)` |
| `app.js` | Ajout `_buildNumberedDefects()`, `_buildSommaire()`, `_buildLifespanRow()` + modification `generateFinalReport()` |
| `data.js` | Ajout 3 champs pyrrhotite dans section 11 |
| `KZO_Inspect.html` | Bump versions `?v=` |
| `sw.js` | Bump `CACHE_NAME` v18→v19 |

---

## Feature 1 & 2 — Sommaire Exécutif + numérotation

### Placement
Après la lettre d'introduction (`BOILERPLATE.lettreIntro()`), avant les sections détaillées.

### Fonction `_buildNumberedDefects(unitFieldStates, sections)`
Retourne un array d'objets :
```js
[{
    num: 1,
    sectionTitle: "Fondation",
    label: "Fissures horizontales visibles dans les fondations",
    severity: "URGENT",       // AIAgents.determineSeverity(label)
    specialist: "Ingénieur en structures",  // AIAgents.getSpecialist(label)
    pageRef: null             // calculé après rendu (non implémenté v1 — afficher section seulement)
}]
```

Tri : URGENT en premier, puis MAJEUR, puis SURVEILLER.
Exclure : `s_cover`, `s_admin`, `s_rapport`.
Inclure : champs `type: "checkbox"` avec état `"defaut"` ou `"surveiller"`.

### Fonction `_buildSommaire(defects, lifespanItems)`
Génère le HTML d'une page `page-break`. Structure :

```
┌──────────────────────────────────────────┐
│ 📋 SOMMAIRE EXÉCUTIF                     │
│ Code : KZO-XXXXX · Date · Adresse        │
├──────────────────────────────────────────┤
│ 🚨 URGENT (N)                            │
│   #1 · Section — Défaut → Spécialiste    │
│   #2 · Section — Défaut → Spécialiste    │
├──────────────────────────────────────────┤
│ ⚠️ MAJEUR (N)                            │
│   #3 · Section — Défaut → Spécialiste    │
├──────────────────────────────────────────┤
│ 👁️ À SURVEILLER (N)                     │
│   #8 · Section — Élément → Spécialiste   │
├──────────────────────────────────────────┤
│ ✅ CONFORMES : N éléments                │
├──────────────────────────────────────────┤
│ 🔧 DURÉE DE VIE ESTIMÉE                  │
│   Bardeaux · 18 ans · 2-7 ans restants → Couvreur │
│   Chauffe-eau · 11 ans · 1-4 ans restants → Plombier │
└──────────────────────────────────────────┘
```

### Numéro dans les sections détaillées
Dans chaque section du rapport, chaque défaut coché affiche son numéro `#N` en badge rouge/orange à côté du label, ex : `❌ #1 Fissures horizontales`.

---

## Feature 3 — Durée de vie + spécialiste

### Fonction `_buildLifespanRow(section, unitFieldStates)`
Cherche les champs `type: "number"` avec id contenant `_age` dans la section. Table de correspondance dans `app.js` :

```js
const AGE_TO_LIFESPAN = {
    'ce_age':  { key: 'chauffe-eau',  specialist: 'Plombier maître' },
    'c_age':   { key: 'fournaise',    specialist: 'Technicien CVAC' },
    'to_age':  { key: 'bardeau',      specialist: 'Couvreur certifié' }
};
```

Calcul de la durée résiduelle :
- `residMin = EQUIPMENT_LIFESPAN[key].min - age`
- `residMax = EQUIPMENT_LIFESPAN[key].max - age`
- Si `residMax ≤ 0` → "⚠️ Fin de vie — Remplacement recommandé"
- Si `residMax ≤ 2` → badge rouge "Remplacement imminent"
- Si `residMax ≤ 5` → badge orange "À planifier dans 1-5 ans"
- Sinon → badge vert "État satisfaisant"

**Jamais de prix.** Uniquement "Consulter un [spécialiste]".

### Dans le Sommaire
`_buildSommaire()` reçoit `lifespanItems` (array produit par `_buildLifespanRow()` pour chaque section) et les affiche en bas du Sommaire.

---

## `AIAgents.getSpecialist(label)` dans ai_agents.js

Fonction de mapping par mots-clés. Retourne un string. Table de priorité (premier match gagne) :

| Mots-clés (lowercase) | Spécialiste |
|----------------------|-------------|
| fondation, structure, fissure horizontale, soulèvement, déflexion | Ingénieur en structures |
| toiture, bardeau, gouttière, solin, membrane, tôle, couverture | Couvreur certifié |
| électricité, filage, panneau, disjoncteur, gfci, afci, ddft, aluminium | Électricien licencié RBQ |
| plomberie, chauffe-eau, tuyau, fuite, drain, soupape, puits, fosse | Plombier maître |
| chauffage, fournaise, thermopompe, vrc, combustion, co, chaudière, cvac | Technicien CVAC certifié |
| amiante, vermiculite, radon, pyrite, pyrrhotite, plomb, contamination, mazout | Spécialiste en matières dangereuses |
| cheminée, foyer, fumée, tirage, liner, chemisage | Ramoneur certifié WETT |
| fenêtre, porte, calfeutrage, thermos, vitrage | Menuisier ou vitrier |
| garage, coupe-feu, piscine, clôture | Entrepreneur général |
| (défaut) | Entrepreneur général |

---

## Feature 4 — Pyrrhotite dans data.js

Section 11 — sous-section `ss_da_2` (renommée "Plomb, Pyrite et Pyrrhotite") :

```js
{ id: "da_pyrrhotite", type: "checkbox",
  label: "DANGER PYRRHOTITE : Soulèvement ou fissuration du plancher de béton — Maisons 1960-1990 en Estrie, Beauce ou Chaudière-Appalaches — Test de laboratoire obligatoire" },
{ id: "da_pyrrhotite_region", type: "select",
  label: "Région à risque pyrrhotite",
  options: ["Non applicable","Estrie","Beauce","Chaudière-Appalaches","Autre région — Vérifier"] },
{ id: "da_pyrrhotite_note", type: "text",
  label: "Notes pyrrhotite",
  placeholder: "Observations visuelles, date de construction suspectée..." }
```

**Distinction légale :** la pyrrhotite (Fe₇S₈) est distincte de la pyrite (FeS₂) dans les décisions des tribunaux québécois depuis 2012. Zone à risque : triangle Estrie-Beauce-Chaudière-Appalaches.

---

## Hors-périmètre Groupe A

- Prix / estimations de coûts (jamais)
- Liens hypertextes vers numéros de page (complexité PDF trop élevée pour v1 — afficher le titre de section)
- Numérotation par section (globale seulement)
