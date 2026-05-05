# Groupe F — Login Sécurisé

**Date :** 2026-05-04
**Statut :** Approuvé

---

## Objectif

Protéger l'intégralité de KZO InspectPro par un écran de connexion par mot de passe. Seul l'inspecteur (Jean Eveillard Cazeau) peut accéder à l'app. La session est liée à l'onglet/navigateur et disparaît à sa fermeture.

---

## Décisions de design

| Décision | Choix |
|----------|-------|
| Style écran | Carte blanche centrée sur fond gris |
| Session | `sessionStorage` — efface à la fermeture du navigateur |
| Stockage mot de passe | Hash SHA-256 dans `auth.js` (jamais en clair) |
| Identifiant | `JECPRO` |
| Mot de passe | `Amboul500` (stocké hashé — ne pas écrire en clair dans le code) |
| Pages protégées | `index.html` + `KZO_Inspect.html` |
| Déconnexion | Bouton dans la top-bar de `KZO_Inspect.html` et sur `index.html` |

---

## Fichiers

| Fichier | Action | Description |
|---------|--------|-------------|
| `login.html` | **Nouveau** | Page de connexion — carte centrée |
| `auth.js` | **Nouveau** | Hash SHA-256, vérification session, helpers logout |
| `index.html` | **Modifié** | Guard de session au chargement + bouton déconnexion |
| `KZO_Inspect.html` | **Modifié** | Guard de session au chargement + bouton déconnexion top-bar |
| `sw.js` | **Modifié** | Bump CACHE_NAME v23→v24, ajouter `login.html` aux ASSETS, exclure `auth.js` |

---

## Page de connexion `login.html`

### Visuel

Fond gris clair (`#e2e8f0`), carte blanche centrée avec ombre, logo KZO, champ mot de passe, bouton "Connexion".

```html
<!-- Structure de la carte -->
<div class="login-bg">
  <div class="login-card">
    <div class="login-logo">🏠 KZO InspectPro</div>
    <div class="login-subtitle">Accès sécurisé</div>
    <input id="loginPassword" type="password" placeholder="••••••••" />
    <div id="loginError" class="login-error"></div>
    <button id="loginBtn">Entrer</button>
  </div>
</div>
```

### Comportement

1. L'utilisateur entre le mot de passe et appuie sur Entrée ou "Entrer"
2. `auth.js` hash la saisie en SHA-256 et compare avec le hash stocké
3. Si correct → `sessionStorage.setItem('kzo_auth', '1')` → `window.location.href = 'index.html'`
4. Si incorrect → message d'erreur rouge sous le champ, champ vidé, focus remis

---

## Module `auth.js`

```js
// Constantes (ne jamais stocker le mot de passe en clair)
const AUTH_HASH = '...'; // SHA-256 de 'Amboul500' — calculé à l'implémentation
const SESSION_KEY = 'kzo_auth';

async function hashPassword(password) {
    const buf = await crypto.subtle.digest('SHA-256',
        new TextEncoder().encode(password));
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function login(password) {
    const hash = await hashPassword(password);
    return hash === AUTH_HASH;
}

function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'login.html';
}

function requireAuth() {
    if (!isAuthenticated()) window.location.href = 'login.html';
}

window.KZOAuth = { login, isAuthenticated, logout, requireAuth };
```

**Calcul du hash :** L'implémenteur calcule `SHA-256('Amboul500')` via `crypto.subtle.digest` et l'assigne à `AUTH_HASH` comme chaîne hexadécimale constante. Le mot de passe n'apparaît jamais en clair dans le code final.

---

## Guard de session

Au début de `index.html` et `KZO_Inspect.html`, avant tout autre script :

```html
<script src="auth.js"></script>
<script>
  // Guard inline — bloque le rendu si non authentifié
  if (!sessionStorage.getItem('kzo_auth')) {
    window.location.replace('login.html');
  }
</script>
```

---

## Bouton Déconnexion

### Dans `KZO_Inspect.html` (top-bar)

Après le bouton `exportKzoBtn` :

```html
<button id="logoutBtn" onclick="KZOAuth.logout()"
  style="padding:7px 14px;background:#dc2626;color:white;border:none;border-radius:8px;font-size:0.85rem;font-weight:700;cursor:pointer;">
  🔒 Déconnexion
</button>
```

### Dans `index.html`

Bouton visible sur la page d'accueil des projets, même style.

---

## Service Worker

- `CACHE_NAME` : v23 → v24
- Ajouter `login.html` aux ASSETS
- `auth.js` **exclu** du cache (contient le hash — fichier sensible)

---

## Hors-périmètre Groupe F

- Multi-utilisateurs / rôles
- Récupération de mot de passe
- Tentatives de connexion limitées (brute-force protection)
- Biométrie / Touch ID
