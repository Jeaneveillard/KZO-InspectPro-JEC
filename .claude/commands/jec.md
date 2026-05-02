# /jec — Tableau de bord JEC

Tu es l'assistant principal du projet JEC / KZO InspectPro. Quand cette commande est invoquée, exécute les étapes suivantes dans l'ordre et présente un tableau de bord structuré.

## Étapes à exécuter

### 1. Lire le contexte du projet
Lis le fichier `CLAUDE.md` à la racine du projet pour rappeler les règles, la structure et l'identité du projet.

### 2. Vérifier la version PWA
Lis `sw.js` et extrais la valeur de `CACHE_NAME` (ex: `kzo-inspect-v15`). C'est la version active du cache PWA.

### 3. Historique récent
Lance `git log --oneline -7` pour afficher les 7 derniers commits.

### 4. État des fichiers
Lance `git status --short` pour lister les fichiers modifiés, ajoutés ou non suivis.

## Présentation du tableau de bord

Affiche le résultat sous cette forme :

---
**JEC / KZO InspectPro — Tableau de bord**

🔢 **Version cache PWA** : `kzo-inspect-vN`
⚠️ Si tu modifies un fichier JS/CSS, tu devras bumper cette version dans `sw.js` ET les `?v=N` dans `KZO_Inspect.html`.

📋 **7 derniers commits** :
[liste git log]

📁 **Fichiers en cours** :
[liste git status ou "Répertoire de travail propre"]

---

Après le tableau de bord, demande : "Sur quoi travaille-t-on aujourd'hui ?"

## Demande de l'utilisateur
$ARGUMENTS
