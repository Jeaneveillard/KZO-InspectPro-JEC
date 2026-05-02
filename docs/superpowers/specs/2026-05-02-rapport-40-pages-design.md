# Rapport 40+ Pages — Spec de design
**Projet :** JEC / KZO InspectPro
**Date :** 2026-05-02
**Statut :** Approuvé par l'utilisateur

---

## Objectif

Transformer le rapport PDF existant en un document professionnel complet de 40+ pages comprenant : pages légales pré-remplies, documents signés intégrés à leurs pages respectives, table des matières auto-générée, description narrative de la maison, et toutes les sections d'inspection existantes.

---

## Contraintes

- Les documents légaux utilisent les textes fournis par l'inspecteur (placeholders dans `legal_docs.js`)
- Champs pré-remplis automatiquement : nom client, adresse, date, inspecteur, prix
- Espaces pour signatures manuscrites sur chaque document légal
- Les scans de documents signés s'affichent **intégrés dans leur page correspondante** (pas en annexe)
- Aucun nouveau framework — JavaScript vanilla, HTML/CSS inline, impression PDF via `window.print()`
- `config.js` reste exclu du versionnement

---

## Architecture des fichiers

| Fichier | Modification |
|---------|-------------|
| `legal_docs.js` | **NOUVEAU** — textes légaux de l'inspecteur (placeholders) |
| `boilerplate.js` | +6 nouvelles fonctions de page |
| `data.js` | +7 nouveaux champs dans `s_admin` (uploads + narratif) |
| `app.js` | Ordre des pages mis à jour dans `generateReport()` |
| `KZO_Inspect.html` | Ajout `<script src="legal_docs.js">` + bump versions |
| `sw.js` | Bump `CACHE_NAME` v16 → v17 |

---

## Structure du rapport (ordre des pages)

### Pages préliminaires

**Page 1 — Couverture** *(existante, enrichie)*
- Photo façade (existante)
- Nom client, adresse, date d'inspection
- Nom et coordonnées de l'inspecteur
- Logo + numéro de dossier

**Page 2 — Lettre de remerciement**
- Texte de `LEGAL_DOCS.lettreRemerciement`
- Pré-rempli : nom client, date, nom inspecteur
- Signature de l'inspecteur (image uploadée dans `s_admin`)

**Page 3 — Table des matières**
- Générée automatiquement depuis la liste des sections
- Sections listées dans l'ordre d'impression (sans numéros de page — non calculables en HTML/CSS avant impression)
- Style sobre, deux colonnes

**Page 4 — Description de la maison avant inspection**
- Fiche technique : type bâtiment, année construction, superficie, type garage, météo, température
- Paragraphe narratif : champ `description_narrative` saisi par l'inspecteur
- Conditions d'accès et limitations observées avant inspection

**Page 5 — Documents reçus**
- Liste des documents reçus du vendeur/client
- Zone pour scan(s) uploadé(s) via `docs_recus` (affiché en pleine page si présent)
- Mention légale : "Les documents ci-joints ont été remis à l'inspecteur avant la visite"

---

### Pages légales (Documents de mission)

Chaque page légale suit ce template :
1. En-tête : titre du document + numéro de dossier + date
2. Parties identifiées : inspecteur (pré-rempli) + client (pré-rempli)
3. Corps du texte : `LEGAL_DOCS.[document]` (texte de l'inspecteur)
4. Zone de signature : ligne + nom + date pour chaque signataire
5. **Si scan signé uploadé** : affiché en dessous ou sur la page suivante, pleine largeur

**Page 6 — Clause du contrat**
- Texte : `LEGAL_DOCS.clauseContrat`
- Pré-rempli : inspecteur, client, adresse, date
- Signataire : inspecteur uniquement
- Scan intégré : `doc_clause_signe` (upload dans `s_admin`)

**Page 7 — Contrat d'inspection**
- Texte : `LEGAL_DOCS.contratInspection`
- Pré-rempli : inspecteur, client, adresse, prix (TPS + TVQ calculés), date, norme
- Signataires : inspecteur + client
- Scan intégré : `doc_contrat_signe`

**Page 8 — Contrat client**
- Texte : `LEGAL_DOCS.contratClient`
- Pré-rempli : client, adresse, date
- Signataire : client uniquement
- Scan intégré : `doc_contrat_client_signe`

**Page 9 — Déclaration de conflit d'intérêt**
- Texte : `LEGAL_DOCS.declarationConflitInteret`
- Pré-rempli : inspecteur, numéro de licence RBQ, date
- Signataire : inspecteur uniquement
- Scan intégré : `doc_conflit_signe`

**Page 10 — Formulaire de limitations**
- Texte : `LEGAL_DOCS.formulaireLimitations`
- Pré-rempli : inspecteur, client, adresse, conditions météo, accès limités
- Signataires : inspecteur + client
- Scan intégré : `doc_limitations_signe`

---

### Rapport d'inspection (Pages 11–40+)

Pages existantes conservées et enrichies :
- Résumé exécutif (défauts URGENT / MAJEUR / À SURVEILLER / CONFORMES)
- Sections d'inspection en flux continu — **aucun saut de page entre sections** : le rapport enchaîne directement d'une section à l'autre sans interruption. Les sauts de page ne surviennent que naturellement lors de l'impression selon le contenu.
- Guide d'entretien (existant)
- Annexe normes (existante)

---

## Nouveaux champs dans `data.js` (section `s_admin`)

Ajoutés dans la sous-section `ss_admin_2` (Pièces jointes & Synchronisation) :

```js
{ id: "description_narrative", type: "text",
  label: "Description narrative de la propriété avant inspection",
  placeholder: "Décrivez l'état général apparent, les conditions d'accès, les limitations observées avant l'inspection..." },
{ id: "docs_recus", type: "file",
  label: "Documents reçus (déclaration vendeur, plans, etc.)" },
{ id: "doc_clause_signe", type: "file",
  label: "Clause du contrat — scan signé" },
{ id: "doc_contrat_signe", type: "file",
  label: "Contrat d'inspection — scan signé (inspecteur + client)" },
{ id: "doc_contrat_client_signe", type: "file",
  label: "Contrat client — scan signé (client)" },
{ id: "doc_conflit_signe", type: "file",
  label: "Déclaration conflit d'intérêt — scan signé (inspecteur)" },
{ id: "doc_limitations_signe", type: "file",
  label: "Formulaire de limitations — scan signé (inspecteur + client)" }
```

---

## Nouveau fichier `legal_docs.js`

Structure de l'objet `LEGAL_DOCS` avec placeholders :

```js
const LEGAL_DOCS = {
  lettreRemerciement: `[COLLER TON TEXTE ICI]`,
  clauseContrat: `[COLLER TON TEXTE ICI]`,
  contratInspection: `[COLLER TON TEXTE ICI]`,
  contratClient: `[COLLER TON TEXTE ICI]`,
  declarationConflitInteret: `[COLLER TON TEXTE ICI]`,
  formulaireLimitations: `[COLLER TON TEXTE ICI]`
};
```

---

## Nouvelles fonctions dans `boilerplate.js`

```js
BOILERPLATE.lettreRemerciement(clientName, date, inspectorName, signatureUrl)
BOILERPLATE.tableDesMatières(sections)
BOILERPLATE.ficheDescriptionMaison(clientInfo, inspectionData, narratif)
BOILERPLATE.pageDocumentsRecus(docsImages)
BOILERPLATE.pageDocumentLegal(titre, texte, infos, signataires, scanUrl)
// pageDocumentLegal est réutilisé pour les 5 documents légaux
```

---

## Intégration des scans signés

Règle : si un scan est uploadé pour un document légal, il s'affiche **sur la même page** que le document, sous la zone de signature, en pleine largeur. Si le scan est trop grand, il prend une page entière avec `page-break-after`.

```js
// Exemple dans pageDocumentLegal()
if (scanUrl) {
  html += `<div class="page-break">
    <img src="${scanUrl}" style="width:100%; max-height:90vh; object-fit:contain;">
  </div>`;
}
```

---

## Ordre d'appel dans `generateReport()` (app.js)

```
1. pageCouverte()                          ← enrichie
2. lettreRemerciement()                    ← NOUVEAU
3. tableDesMatières()                      ← NOUVEAU
4. ficheDescriptionMaison()                ← NOUVEAU
5. pageDocumentsRecus()                    ← NOUVEAU
6. pageDocumentLegal('Clause du contrat')  ← NOUVEAU
7. pageDocumentLegal('Contrat inspection') ← NOUVEAU
8. pageDocumentLegal('Contrat client')     ← NOUVEAU
9. pageDocumentLegal('Déclaration conflit')← NOUVEAU
10. pageDocumentLegal('Limitations')       ← NOUVEAU
11–N. [sections d'inspection existantes]
N+1. résumé exécutif enrichi
N+2. guideEntretien()                     ← existant
N+3. normesPratique()                     ← existant
```

---

## Tests de validation

- [ ] Le rapport PDF généré contient ≥ 40 pages (via `window.print()`)
- [ ] Chaque page légale affiche correctement les champs pré-remplis (nom, date, adresse, prix)
- [ ] Un scan uploadé apparaît intégré dans la bonne page du rapport
- [ ] La table des matières liste toutes les sections dans le bon ordre
- [ ] Le paragraphe narratif de description maison apparaît correctement formaté
- [ ] `sanitizeHTML()` appliqué sur tous les champs libres insérés dans le HTML
- [ ] `config.js` toujours absent du versionnement git
- [ ] Cache PWA bumped (v17)
