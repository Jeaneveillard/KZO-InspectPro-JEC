// kzo_auth_check.js — Vérification d'authentification (remplace le script inline)
// Chargé de façon synchrone juste après auth.js pour bloquer le rendu si non connecté.
(function () {
    'use strict';
    if (!sessionStorage.getItem('kzo_auth')) {
        window.location.replace('login.html');
    }
})();
