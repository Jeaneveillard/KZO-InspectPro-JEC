# Groupe G — Annotations Photo, Signature Électronique, Envoi PDF

**Date :** 2026-05-07
**Statut :** Approuvé
**Priorité :** Critique

---

## Objectif

Ajouter trois fonctionnalités de niveau professionnel à KZO InspectPro pour différencier l'app sur le marché :
1. Annoter les photos d'inspection directement dans l'app
2. Faire signer le client sur place ou à distance
3. Envoyer le rapport PDF au client par email ou téléchargement direct

---

## Feature 1 — Annotations Photo

### Architecture

Nouveau module : `photo_annotator.js` (IIFE, `window.KZOAnnotator`)

Le module gère un canvas HTML5 superposé sur la photo dans la modale existante de `KZO_Inspect.html`.

### Flux utilisateur

1. L'inspecteur ouvre une photo → bouton **✏️ Annoter** apparaît
2. Clic → canvas actif + barre d'outils fixe en bas
3. L'inspecteur dessine ses annotations
4. Clic **✅ Sauvegarder** → image annotée générée et stockée
5. Clic **✕ Annuler** → canvas effacé, photo originale inchangée

### Outils disponibles

| Outil | Comportement |
|-------|-------------|
| ➡️ Flèche | mousedown → drag → mouseup : dessine une flèche directionnelle |
| ⭕ Cercle | mousedown → drag → mouseup : dessine une ellipse |
| ✏️ Crayon | tracé libre continu en temps réel |
| 🔤 Texte | clic → prompt → étiquette positionnée à la coordonnée du clic |
| 🎨 Couleur | sélecteur 3 couleurs : rouge `#ef4444`, jaune `#f59e0b`, vert `#22c55e` |
| ↩️ Annuler | undo du dernier tracé (stack d'états canvas) |
| 🗑️ Effacer tout | remet le canvas à zéro |

### Stockage

- **Photo originale** : conservée intacte dans `sectionPhotos[sectionId][photoIndex]`
- **Photo annotée** : stockée sous `sectionPhotos[sectionId][photoIndex + '_annotated']` en base64 (`canvas.toDataURL('image/jpeg', 0.85)`)
- Indicateur visuel sur la vignette si une annotation existe (badge `✏️`)

### PDF

Le générateur PDF utilise `photoIndex + '_annotated'` si la clé existe, sinon `photoIndex`.

---

## Feature 2 — Signature Électronique

### Architecture

- Librairie : `signature_pad.js` via CDN (`https://cdn.jsdelivr.net/npm/signature_pad@4/dist/signature_pad.umd.min.js`)
- Stockage : `inspectionData.signature` (base64 PNG)
- Apparaît dans le PDF sous la section "Acceptation du rapport"

### Flux — Sur place (client présent)

1. Section **Informations client** → bouton **✍️ Faire signer le client**
2. Modale plein écran s'ouvre avec canvas blanc
3. Client signe avec le doigt (mobile/tablette) ou la souris
4. Bouton **✅ Confirmer** → signature sauvegardée
5. Bouton **🗑️ Effacer** → remet le canvas à zéro
6. Indicateur "Signé ✅" affiché dans la section client après signature

### Flux — À distance

1. Bouton **📧 Envoyer pour signature** dans la section client
2. App génère le PDF + upload Google Drive + récupère lien de partage
3. EmailJS envoie au client (`inspectionData.clientEmail`) avec le lien et les instructions
4. L'inspecteur reçoit la signature par retour d'email (processus manuel côté client)

> **Note :** La signature électronique est à usage professionnel QC standard. Elle ne constitue pas une signature légalement qualifiée (non conforme eIDAS). Convient pour les rapports d'inspection résidentielle.

### PDF

La signature est intégrée comme image dans le bloc final du rapport :

```
──────────────────────────────────
Acceptation du rapport d'inspection
Date : [date]     Client : [nom]
[image signature]
──────────────────────────────────
```

---

## Feature 3 — Envoi PDF

### Deux modes disponibles

#### Mode A — Téléchargement direct

Bouton **⬇️ Télécharger PDF** (comportement existant conservé, renommé pour clarté).
Génère le PDF → déclenche le téléchargement sur l'appareil.

#### Mode B — Envoi par email

Bouton **📤 Envoyer au client** → flux :
1. Génère le PDF
2. Upload vers Google Drive (module `google_drive.js` déjà intégré)
3. Récupère le lien de partage public
4. EmailJS (`service_ws2zy3s`) envoie via template dédié `kzo_rapport`
5. Toast de confirmation "✅ Rapport envoyé à [email]"

### Template EmailJS `kzo_rapport`

Variables utilisées :
- `{{client_name}}` — nom du client
- `{{inspector_name}}` — nom de l'inspecteur
- `{{address}}` — adresse inspectée
- `{{report_link}}` — lien Google Drive
- `{{to_email}}` — email du client

> Template à créer manuellement sur emailjs.com (Service ID : `service_ws2zy3s`).

### UI — Boutons dans la page rapport

```
[ ⬇️ Télécharger PDF ]   [ 📤 Envoyer au client ]
```

Les deux boutons sont accessibles simultanément.

---

## Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `photo_annotator.js` | Nouveau — module annotations canvas |
| `KZO_Inspect.html` | Modifié — intégration annotator, modale signature, boutons envoi |
| `app.js` | Modifié — stockage annotations, appel signature, envoi email |
| `sw.js` | Modifié — cache v25, `photo_annotator.js` dans ASSETS |
| `config.js` | Modifié — `EMAILJS_RAPPORT_TEMPLATE_ID` |

---

## Contraintes techniques

- `photo_annotator.js` : pas de dépendance externe — Canvas API pure
- `signature_pad.js` : chargé via CDN dans `KZO_Inspect.html` (comme EmailJS)
- La CSP de `KZO_Inspect.html` autorise déjà `cdn.jsdelivr.net` — aucune modification nécessaire
- Les annotations sont stockées en base64 dans `localStorage` via le mécanisme existant — attention à la taille (compression JPEG 0.85 obligatoire)
- `auth.js` guard : aucun impact — les features sont toutes dans `KZO_Inspect.html` déjà protégé
