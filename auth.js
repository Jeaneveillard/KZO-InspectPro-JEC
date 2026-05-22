// auth.js — KZO InspectPro
// Authentification : SHA-256, session, récupération mot de passe
// API publique : window.KZOAuth

(function () {
    'use strict';

    // SHA-256 de 'Amboul500' — ne jamais écrire le mot de passe en clair ici
    const DEFAULT_HASH  = '24bae3a3c7aec386485eef4eb6e4f7bbce279f50a85c165e0dc4e4ba72d7963f';
    const SESSION_KEY   = 'kzo_auth';
    const CUSTOM_HASH   = 'kzo_custom_hash';
    const RESET_CODE    = 'kzo_reset_code';
    const RESET_EXPIRY  = 'kzo_reset_expiry';
    const RESET_EMAIL   = 'kzoinspectpro@gmail.com';

    async function _sha256(str) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf))
            .map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    function _getActiveHash() {
        return localStorage.getItem(CUSTOM_HASH) || DEFAULT_HASH;
    }

    let _loginAttempts = 0;
    let _lockoutUntil  = parseInt(sessionStorage.getItem('kzo_lockout_until') || '0', 10);

    async function login(password) {
        if (Date.now() < _lockoutUntil) {
            const secs = Math.ceil((_lockoutUntil - Date.now()) / 1000);
            throw new Error('Trop de tentatives. Réessayez dans ' + secs + ' secondes.');
        }
        const hash = await _sha256(password);
        if (hash === _getActiveHash()) {
            _loginAttempts = 0;
            sessionStorage.setItem(SESSION_KEY, '1');
            return true;
        }
        _loginAttempts++;
        if (_loginAttempts >= 5) {
            _lockoutUntil  = Date.now() + 30 * 1000;
            sessionStorage.setItem('kzo_lockout_until', String(_lockoutUntil));
            _loginAttempts = 0;
            throw new Error('5 tentatives échouées. Compte bloqué 30 secondes.');
        }
        return false;
    }

    function isAuthenticated() {
        return sessionStorage.getItem(SESSION_KEY) === '1';
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        window.location.replace('login.html');
    }

    function requireAuth() {
        if (!isAuthenticated()) window.location.replace('login.html');
    }

    async function generateResetCode() {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        const code   = String(100000 + (arr[0] % 900000));
        const expiry = Date.now() + 15 * 60 * 1000;
        // Stocker le hash, pas le code en clair — empêche la lecture directe depuis DevTools
        const hash = await _sha256(code);
        localStorage.setItem(RESET_CODE, hash);
        localStorage.setItem(RESET_EXPIRY, String(expiry));
        return code;
    }

    async function verifyResetCode(code) {
        const storedHash = localStorage.getItem(RESET_CODE);
        const expiry = parseInt(localStorage.getItem(RESET_EXPIRY) || '0', 10);
        if (!storedHash) return false;
        if (Date.now() > expiry) {
            localStorage.removeItem(RESET_CODE);
            localStorage.removeItem(RESET_EXPIRY);
            return false;
        }
        const codeHash = await _sha256(code);
        return codeHash === storedHash;
    }

    async function setNewPassword(password) {
        const hash = await _sha256(password);
        localStorage.setItem(CUSTOM_HASH, hash);
        localStorage.removeItem(RESET_CODE);
        localStorage.removeItem(RESET_EXPIRY);
    }

    async function sendResetEmail() {
        const code = await generateResetCode();
        const cfg  = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG : {};
        if (!cfg.EMAILJS_SERVICE_ID || !cfg.EMAILJS_PUBLIC_KEY) {
            console.warn('[KZOAuth] EmailJS non configuré dans config.js');
            return false;
        }
        emailjs.init(cfg.EMAILJS_PUBLIC_KEY);
        await emailjs.send(cfg.EMAILJS_SERVICE_ID, cfg.EMAILJS_TEMPLATE_ID, {
            reset_code: code,
            expiry:     '15 minutes',
            to_email:   RESET_EMAIL
        });
        return true;
    }

    window.KZOAuth = {
        login:           login,
        isAuthenticated: isAuthenticated,
        logout:          logout,
        requireAuth:     requireAuth,
        sendResetEmail:  sendResetEmail,
        verifyResetCode: verifyResetCode,
        setNewPassword:  setNewPassword
    };
})();
