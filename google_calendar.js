// google_calendar.js — KZO InspectPro
// Synchronisation automatique des RDV d'inspection vers Google Agenda
// API publique : window.GoogleCalendar
//
// PRÉREQUIS (une seule fois dans Google Cloud Console) :
//  1. APIs & Services → Bibliothèque → activer "Google Calendar API"
//  2. APIs & Services → Écran de consentement → ajouter scope "calendar.events"
//  3. Le GOOGLE_DRIVE_CLIENT_ID dans config.js est réutilisé

(function () {
    'use strict';

    const TOKEN_KEY        = 'kzo_calendar_token';
    const TOKEN_EXPIRY_KEY = 'kzo_calendar_token_expiry';
    const SYNC_ENABLED_KEY = 'kzo_calendar_sync_enabled';
    const LOGIN_HINT_KEY   = 'kzo_calendar_login_hint';
    const CAL_API          = 'https://www.googleapis.com/calendar/v3';
    const CALENDAR_ID      = 'primary';
    const TIMEZONE         = 'America/Toronto'; // Québec

    let _tokenClient = null;
    let _resolveAuth = null;
    let _rejectAuth  = null;

    // ────────────────────────────────────────────────────────────────────────
    // INIT
    // ────────────────────────────────────────────────────────────────────────

    function init() {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
            // GIS pas encore chargé — réessai après chargement du script
            return;
        }
        const clientId = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG.GOOGLE_DRIVE_CLIENT_ID : '';
        if (!clientId) {
            console.warn('[GoogleCalendar] GOOGLE_DRIVE_CLIENT_ID non configuré dans config.js');
            return;
        }

        _tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/calendar.events',
            callback: (response) => {
                if (response.error) {
                    console.warn('[GoogleCalendar] Auth échouée :', response.error);
                    if (_rejectAuth) _rejectAuth(new Error(response.error));
                    _resolveAuth = null;
                    _rejectAuth  = null;
                } else {
                    sessionStorage.setItem(TOKEN_KEY, response.access_token);
                    sessionStorage.setItem(TOKEN_EXPIRY_KEY,
                        String(Date.now() + (response.expires_in - 60) * 1000));
                    localStorage.setItem(SYNC_ENABLED_KEY, '1');
                    // Stocker l'email AVANT de résoudre la promesse — évite la race condition
                    const resolve = _resolveAuth;
                    _resolveAuth = null;
                    _rejectAuth  = null;
                    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { 'Authorization': 'Bearer ' + response.access_token }
                    }).then(r => r.json()).then(info => {
                        if (info.email) localStorage.setItem(LOGIN_HINT_KEY, info.email);
                    }).catch(() => {}).finally(() => {
                        if (resolve) resolve();
                    });
                }
            }
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // AUTH
    // ────────────────────────────────────────────────────────────────────────

    function isTokenValid() {
        const token  = sessionStorage.getItem(TOKEN_KEY);
        const expiry = parseInt(sessionStorage.getItem(TOKEN_EXPIRY_KEY) || '0', 10);
        return !!token && Date.now() < expiry;
    }

    function isSyncEnabled() {
        return localStorage.getItem(SYNC_ENABLED_KEY) === '1';
    }

    function disableSync() {
        localStorage.removeItem(SYNC_ENABLED_KEY);
        localStorage.removeItem(LOGIN_HINT_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    }

    function _getToken() {
        return sessionStorage.getItem(TOKEN_KEY) || '';
    }

    // authenticate() doit être appelée depuis un geste utilisateur (click)
    function authenticate() {
        if (isTokenValid()) return Promise.resolve();
        if (!_tokenClient) {
            // Tenter une init tardive si GIS vient de charger
            init();
            if (!_tokenClient) return Promise.reject(new Error('[GoogleCalendar] GIS non disponible — vérifiez que le script GIS est chargé'));
        }
        const loginHint = localStorage.getItem(LOGIN_HINT_KEY);
        // Première connexion (pas d'email mémorisé) → sélecteur de compte (requiert un clic)
        // Re-auth après expiration → silencieuse via login_hint (pas de popup)
        const prompt = loginHint ? '' : 'select_account';
        return new Promise((resolve, reject) => {
            _resolveAuth = resolve;
            _rejectAuth  = reject;
            _tokenClient.requestAccessToken({
                prompt,
                ...(loginHint ? { login_hint: loginHint } : {})
            });
        });
    }

    // Authentification interactive — à appeler uniquement depuis un clic utilisateur
    function authenticateInteractive() {
        if (!_tokenClient) { init(); if (!_tokenClient) return Promise.reject(new Error('GIS non disponible')); }
        localStorage.removeItem(LOGIN_HINT_KEY); // Force le sélecteur de compte
        return new Promise((resolve, reject) => {
            _resolveAuth = resolve;
            _rejectAuth  = reject;
            _tokenClient.requestAccessToken({ prompt: 'select_account' });
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // CALENDAR API
    // ────────────────────────────────────────────────────────────────────────

    // Construit l'heure de fin (+2h par défaut, durée standard d'inspection)
    function _endTime(date, time, durationHours = 2) {
        const [h, m] = time.split(':').map(Number);
        const dt = new Date(date + 'T' + time + ':00');
        dt.setHours(dt.getHours() + durationHours);
        return dt.toISOString().slice(0, 19); // YYYY-MM-DDTHH:MM:SS
    }

    // Crée un événement Google Agenda
    // ev = { id, date: 'YYYY-MM-DD', time: 'HH:MM', clientName, address }
    // Retourne l'ID Google Calendar de l'événement créé
    async function createEvent(ev) {
        if (!isTokenValid()) await authenticate();

        const startDT = ev.date + 'T' + ev.time + ':00';
        const endDT   = _endTime(ev.date, ev.time, 2);

        const body = {
            summary:     `🏠 Inspection — ${ev.clientName}`,
            location:    ev.address,
            description: `Inspection pré-achat générée par KZO InspectPro\nClient : ${ev.clientName}\nAdresse : ${ev.address}`,
            start: { dateTime: startDT, timeZone: TIMEZONE },
            end:   { dateTime: endDT,   timeZone: TIMEZONE },
            colorId: '6', // bleu saphir
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'popup', minutes: 60 }, // 1h avant
                    { method: 'popup', minutes: 15 }  // 15 min avant
                ]
            }
        };

        const res = await fetch(`${CAL_API}/calendars/${CALENDAR_ID}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${_getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (res.status === 401) {
            // Token expiré — vider et réessayer une fois
            sessionStorage.removeItem(TOKEN_KEY);
            await authenticate();
            return createEvent(ev);
        }

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`[GoogleCalendar] Création échouée (${res.status}) : ${text}`);
        }

        const created = await res.json();
        return created.id;
    }

    // Supprime un événement Google Agenda
    async function deleteEvent(gcalId) {
        if (!gcalId) return;
        if (!isTokenValid()) {
            try { await authenticate(); } catch(e) { return; } // silencieux si pas de session
        }
        try {
            await fetch(`${CAL_API}/calendars/${CALENDAR_ID}/events/${gcalId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${_getToken()}` }
            });
        } catch(e) {
            console.warn('[GoogleCalendar] Suppression échouée :', e.message);
        }
    }

    // Met à jour un événement existant
    async function updateEvent(gcalId, ev) {
        if (!gcalId || !isTokenValid()) return;
        const startDT = ev.date + 'T' + ev.time + ':00';
        const endDT   = _endTime(ev.date, ev.time, 2);
        try {
            await fetch(`${CAL_API}/calendars/${CALENDAR_ID}/events/${gcalId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${_getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    summary:  `🏠 Inspection — ${ev.clientName}`,
                    location: ev.address,
                    start: { dateTime: startDT, timeZone: TIMEZONE },
                    end:   { dateTime: endDT,   timeZone: TIMEZONE }
                })
            });
        } catch(e) {
            console.warn('[GoogleCalendar] Mise à jour échouée :', e.message);
        }
    }

    // Init au chargement (GIS peut être encore en train de charger)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    // Deuxième tentative après chargement du script GIS (async defer)
    window.addEventListener('load', init);

    function getConnectedEmail() {
        return localStorage.getItem(LOGIN_HINT_KEY) || '';
    }

    window.GoogleCalendar = {
        init,
        isTokenValid,
        isSyncEnabled,
        disableSync,
        authenticate,
        authenticateInteractive,
        getConnectedEmail,
        createEvent,
        deleteEvent,
        updateEvent
    };

})();
