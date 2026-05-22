// agenda.js - Logique Agenda + Notifications + Sync Google Calendar

(function() {
    let currentDate  = new Date();
    let selectedDate = new Date();
    let events = []; // { id, date, time, clientName, address, gcalEventId? }

    const DOM = {
        modal: null, monthTitle: null, grid: null,
        panelTitle: null, eventList: null, addForm: null,
        evTime: null, evClient: null, evAddress: null,
        notifBtn: null, calBtn: null
    };

    function init() {
        DOM.modal      = document.getElementById('agendaModal');
        DOM.monthTitle = document.getElementById('calMonthTitle');
        DOM.grid       = document.querySelector('.cal-grid');
        DOM.panelTitle = document.getElementById('panelDateTitle');
        DOM.eventList  = document.getElementById('eventList');
        DOM.addForm    = document.getElementById('addEventForm');
        DOM.evTime     = document.getElementById('evTime');
        DOM.evClient   = document.getElementById('evClient');
        DOM.evAddress  = document.getElementById('evAddress');
        loadEvents();
        _injectHeaderButtons();
    }

    function loadEvents() {
        try {
            const stored = localStorage.getItem('kzo_agenda_events');
            events = stored ? JSON.parse(stored) : [];
        } catch(e) { events = []; }
    }

    function saveEvents() {
        localStorage.setItem('kzo_agenda_events', JSON.stringify(events));
    }

    function formatDate(date) {
        return date.getFullYear() + '-'
            + String(date.getMonth() + 1).padStart(2, '0') + '-'
            + String(date.getDate()).padStart(2, '0');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────

    function _notifSupported() { return 'Notification' in window; }
    function _notifStatus()    { return _notifSupported() ? Notification.permission : 'unsupported'; }

    async function _requestNotifPermission() {
        if (!_notifSupported()) return false;
        if (_notifStatus() === 'granted') return true;
        if (_notifStatus() === 'denied')  return false;
        const r = await Notification.requestPermission();
        _updateNotifBtn();
        return r === 'granted';
    }

    async function _notifyTodayEvents() {
        if (_notifStatus() !== 'granted') return;
        const todayStr   = formatDate(new Date());
        const sessionKey = 'kzo_notif_shown_' + todayStr;
        if (sessionStorage.getItem(sessionKey)) return;
        sessionStorage.setItem(sessionKey, '1');

        const todayEv = events
            .filter(e => e.date === todayStr)
            .sort((a, b) => a.time.localeCompare(b.time));
        if (!todayEv.length) return;

        const label = todayEv.length === 1
            ? 'Inspection aujourd\'hui'
            : `${todayEv.length} inspections aujourd'hui`;
        const lines = todayEv.map(e => `${e.time} · ${e.clientName}`).join('\n');
        try {
            new Notification('KZO — ' + label, {
                body:  lines + '\n📍 ' + todayEv[0].address,
                icon:  'icon-192.png',
                badge: 'icon-192.png',
                tag:   'kzo-today-' + todayStr
            });
        } catch(e) { console.warn('[KZO Agenda] Notification échouée :', e); }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GOOGLE CALENDAR
    // ─────────────────────────────────────────────────────────────────────────

    function _gcal() { return window.GoogleCalendar; }

    function _calStatus() {
        if (!_gcal()) return 'unavailable';
        if (_gcal().isSyncEnabled() && _gcal().isTokenValid())  return 'connected';
        if (_gcal().isSyncEnabled() && !_gcal().isTokenValid()) return 'expired';
        return 'disconnected';
    }

    // Synchro d'un événement vers Google Agenda — silencieuse, non-bloquante
    async function _syncToGcal(ev) {
        if (!_gcal() || !_gcal().isSyncEnabled()) return;
        try {
            const gcalId = await _gcal().createEvent(ev);
            if (gcalId) {
                ev.gcalEventId = gcalId;
                saveEvents();
                _updateCalBtn();
            }
        } catch(e) {
            console.warn('[Agenda] Sync Google Agenda échouée :', e.message);
            // L'événement est sauvegardé localement même si la sync échoue
        }
    }

    async function _deleteFromGcal(ev) {
        if (!_gcal() || !ev.gcalEventId) return;
        try { await _gcal().deleteEvent(ev.gcalEventId); } catch(e) {}
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BOUTONS D'EN-TÊTE (notification + Google Calendar)
    // ─────────────────────────────────────────────────────────────────────────

    function _injectHeaderButtons() {
        const header = DOM.modal && DOM.modal.querySelector('.agenda-header');
        if (!header) return;
        const closeBtn = header.querySelector('.agenda-close');

        // Bouton Google Calendar
        if (_gcal() && !document.getElementById('agendaCalBtn')) {
            const btn = document.createElement('button');
            btn.id = 'agendaCalBtn';
            btn.type = 'button';
            btn.style.cssText = 'background:none; border:none; cursor:pointer; font-size:1.1rem; padding:4px 8px; border-radius:6px; transition:background 0.15s; color:white; font-family:inherit;';
            btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.1)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'none'; });
            btn.addEventListener('click', async () => {
                const status = _calStatus();
                if (status === 'connected' || status === 'expired') {
                    const email = _gcal().getConnectedEmail ? _gcal().getConnectedEmail() : '';
                    const msg = email
                        ? `Déconnecter le compte ${email} de Google Agenda ?`
                        : 'Déconnecter la synchronisation Google Agenda ?';
                    const ok = window._confirmModal
                        ? await window._confirmModal(msg)
                        : confirm(msg);
                    if (ok) {
                        _gcal().disableSync();
                        _updateCalBtn();
                        _showToast('Google Agenda déconnecté.', 'info');
                    }
                } else {
                    try {
                        _showToast('Sélectionnez votre compte personnel (jeaneveillard@gmail.com) dans la fenêtre Google.', 'info');
                        // authenticateInteractive = sélecteur de compte, déclenché par un clic
                        await (_gcal().authenticateInteractive || _gcal().authenticate)();
                        const email = _gcal().getConnectedEmail ? _gcal().getConnectedEmail() : '';
                        _updateCalBtn();
                        _showToast(`✅ Google Agenda connecté${email ? ' : ' + email : ''} — vos prochains RDV seront synchronisés.`, 'success');
                        await _syncExisting();
                    } catch(e) {
                        _showToast('Connexion Google Agenda annulée ou échouée.', 'warning');
                    }
                }
            });
            header.insertBefore(btn, closeBtn);
            DOM.calBtn = btn;
        }

        // Bouton notifications
        if (_notifSupported() && !document.getElementById('agendaNotifBtn')) {
            const btn = document.createElement('button');
            btn.id = 'agendaNotifBtn';
            btn.type = 'button';
            btn.style.cssText = 'background:none; border:none; cursor:pointer; font-size:1.3rem; padding:4px 8px; border-radius:6px; transition:background 0.15s;';
            btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.1)'; });
            btn.addEventListener('mouseleave', () => { btn.style.background = 'none'; });
            btn.addEventListener('click', async () => {
                if (_notifStatus() === 'granted') {
                    _showToast('Pour désactiver les notifications, allez dans les paramètres de votre navigateur.', 'info');
                } else {
                    const ok = await _requestNotifPermission();
                    if (ok) await _notifyTodayEvents();
                }
                _updateNotifBtn();
            });
            header.insertBefore(btn, closeBtn);
            DOM.notifBtn = btn;
        }

        _updateCalBtn();
        _updateNotifBtn();
    }

    function _updateCalBtn() {
        if (!DOM.calBtn) return;
        const status = _calStatus();
        if (status === 'unavailable') {
            DOM.calBtn.style.display = 'none';
            return;
        }
        DOM.calBtn.style.display = '';
        const email = _gcal() && _gcal().getConnectedEmail ? _gcal().getConnectedEmail() : '';
        if (status === 'connected') {
            DOM.calBtn.textContent = '📅✅';
            DOM.calBtn.title = email
                ? `Google Agenda connecté : ${email} — cliquer pour déconnecter`
                : 'Google Agenda connecté — cliquer pour déconnecter';
        } else if (status === 'expired') {
            DOM.calBtn.textContent = '📅🔄';
            DOM.calBtn.title = email
                ? `Session expirée (${email}) — cliquer pour reconnecter`
                : 'Session Google Agenda expirée — cliquer pour reconnecter';
        } else {
            DOM.calBtn.textContent = '📅';
            DOM.calBtn.title = 'Connecter Google Agenda pour synchroniser automatiquement vos RDV';
        }
    }

    function _updateNotifBtn() {
        if (!DOM.notifBtn) return;
        const status = _notifStatus();
        DOM.notifBtn.style.opacity = status === 'denied' ? '0.5' : '1';
        if (status === 'granted') {
            DOM.notifBtn.textContent = '🔔';
            DOM.notifBtn.title = 'Notifications activées';
        } else if (status === 'denied') {
            DOM.notifBtn.textContent = '🔕';
            DOM.notifBtn.title = 'Notifications bloquées — à activer dans les paramètres du navigateur';
        } else {
            DOM.notifBtn.textContent = '🔔';
            DOM.notifBtn.title = 'Activer les notifications de rendez-vous';
        }
    }

    // Syncer les événements existants qui n'ont pas encore de gcalEventId
    async function _syncExisting() {
        if (!_gcal() || !_gcal().isSyncEnabled()) return;
        let updated = false;
        for (const ev of events) {
            if (!ev.gcalEventId) {
                try {
                    const gcalId = await _gcal().createEvent(ev);
                    if (gcalId) { ev.gcalEventId = gcalId; updated = true; }
                } catch(e) {}
            }
        }
        if (updated) saveEvents();
    }

    function _showToast(msg, type) {
        if (window.showToast) { window.showToast(msg, type); return; }
        const t = document.getElementById('toast-home');
        if (t) { t.textContent = msg; t.style.display = 'block'; setTimeout(() => { t.style.display = 'none'; }, 3500); }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CALENDRIER
    // ─────────────────────────────────────────────────────────────────────────

    function renderCalendar() {
        const headers = Array.from(DOM.grid.querySelectorAll('.cal-day-header'));
        DOM.grid.innerHTML = '';
        headers.forEach(h => DOM.grid.appendChild(h));

        const year  = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
        DOM.monthTitle.textContent = MONTHS[month] + ' ' + year;

        let startIdx = new Date(year, month, 1).getDay() - 1;
        if (startIdx === -1) startIdx = 6;

        const todayStr    = formatDate(new Date());
        const selectedStr = formatDate(selectedDate);

        for (let i = 0; i < 42; i++) {
            const cellDate    = new Date(year, month, 1 + (i - startIdx));
            const cellDateStr = formatDate(cellDate);

            const cell = document.createElement('div');
            cell.className = 'cal-cell';
            if (cellDate.getMonth() !== month) cell.classList.add('other-month');
            if (cellDateStr === todayStr)        cell.classList.add('today');
            if (cellDateStr === selectedStr)     cell.classList.add('selected');
            cell.onclick = () => selectDate(cellDate);

            const dateNum = document.createElement('div');
            dateNum.className = 'cal-date-num';
            dateNum.textContent = cellDate.getDate();
            cell.appendChild(dateNum);

            const dayEvents = events.filter(e => e.date === cellDateStr);
            if (dayEvents.length > 0) {
                const dots = document.createElement('div');
                dots.className = 'cal-events-dots';
                for (let j = 0; j < Math.min(dayEvents.length, 4); j++) {
                    const dot = document.createElement('div');
                    dot.className = 'cal-dot';
                    // Couleur différente si synchronisé avec Google Calendar
                    if (dayEvents[j].gcalEventId) dot.style.background = '#34d399';
                    dots.appendChild(dot);
                }
                if (dayEvents.length > 4) {
                    const more = document.createElement('div');
                    more.style.cssText = 'font-size:0.7rem; color:#94a3b8; line-height:8px;';
                    more.textContent = '+';
                    dots.appendChild(more);
                }
                cell.appendChild(dots);
            }
            DOM.grid.appendChild(cell);
        }
    }

    function selectDate(date) {
        selectedDate = date;
        renderCalendar();
        renderPanel();
    }

    function renderPanel() {
        const selStr   = formatDate(selectedDate);
        DOM.panelTitle.textContent = selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const dayEvents = events
            .filter(e => e.date === selStr)
            .sort((a, b) => a.time.localeCompare(b.time));

        DOM.eventList.innerHTML = '';
        if (!dayEvents.length) {
            DOM.eventList.innerHTML = '<div class="empty-events">Aucun rendez-vous ce jour-là.</div>';
        } else {
            dayEvents.forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';

                // Badge de synchronisation Google Calendar
                const syncBadge = ev.gcalEventId
                    ? `<span title="Synchronisé avec Google Agenda" style="font-size:0.75rem; color:#34d399; margin-left:6px;">📅✅</span>`
                    : (_gcal() && _gcal().isSyncEnabled()
                        ? `<span title="Non encore synchronisé" style="font-size:0.75rem; color:#f59e0b; margin-left:6px;">📅⏳</span>`
                        : '');

                card.innerHTML = `
                    <button class="del-btn" onclick="window.agendaDeleteEvent('${ev.id}')" title="Supprimer">×</button>
                    <h4>${escapeHTML(ev.clientName)}${syncBadge}</h4>
                    <div class="time">⏰ ${escapeHTML(ev.time)}</div>
                    <div class="addr">📍 ${escapeHTML(ev.address)}</div>
                    <button class="start-btn" onclick="window.agendaStartInspection('${encodeURIComponent(ev.clientName)}', '${encodeURIComponent(ev.address)}')">🚀 Démarrer l'inspection</button>
                `;
                DOM.eventList.appendChild(card);
            });
        }

        DOM.addForm.style.display = 'block';
        DOM.evTime.value = DOM.evClient.value = DOM.evAddress.value = '';
    }

    function escapeHTML(str) {
        if (window.sanitizeHTML) return window.sanitizeHTML(str);
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API PUBLIQUE
    // ─────────────────────────────────────────────────────────────────────────

    window.openAgendaModal = function() {
        if (!DOM.modal) init();
        DOM.modal.style.display = 'flex';
        selectedDate = currentDate = new Date();
        renderCalendar();
        renderPanel();
        _updateCalBtn();
        _updateNotifBtn();

        // Proposer les notifications si pas encore demandé
        if (_notifStatus() === 'default') {
            setTimeout(async () => {
                const ok = await _requestNotifPermission();
                if (ok) await _notifyTodayEvents();
            }, 800);
        }
    };

    window.closeAgendaModal = function() {
        if (DOM.modal) DOM.modal.style.display = 'none';
    };

    window.agendaPrevMonth = function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };

    window.agendaNextMonth = function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };

    window.agendaSaveEvent = async function() {
        const time    = DOM.evTime.value;
        const client  = DOM.evClient.value.trim();
        const address = DOM.evAddress.value.trim();

        if (!time || !client || !address) {
            DOM.evTime.style.borderColor    = !time    ? '#ef4444' : '';
            DOM.evClient.style.borderColor  = !client  ? '#ef4444' : '';
            DOM.evAddress.style.borderColor = !address ? '#ef4444' : '';
            return;
        }
        DOM.evTime.style.borderColor = DOM.evClient.style.borderColor = DOM.evAddress.style.borderColor = '';

        const newEvent = {
            id:         'ev_' + Date.now(),
            date:       formatDate(selectedDate),
            time,
            clientName: client,
            address,
            gcalEventId: null
        };

        events.push(newEvent);
        saveEvents();
        renderCalendar();
        renderPanel();

        // Synchronisation Google Calendar en arrière-plan (non-bloquante)
        if (_gcal() && _gcal().isSyncEnabled()) {
            _syncToGcal(newEvent).then(() => {
                if (newEvent.gcalEventId) {
                    _showToast('📅 RDV ajouté dans Google Agenda', 'success');
                    renderCalendar(); // met à jour les points verts
                    renderPanel();
                }
            });
        }
    };

    window.agendaDeleteEvent = function(id) {
        const ev = events.find(e => e.id === id);
        const doDelete = async () => {
            // Supprimer de Google Calendar avant de retirer localement
            if (ev) await _deleteFromGcal(ev);
            events = events.filter(e => e.id !== id);
            saveEvents();
            renderCalendar();
            renderPanel();
        };
        if (window._confirmModal) {
            window._confirmModal('Supprimer ce rendez-vous ?').then(ok => { if (ok) doDelete(); });
        } else {
            doDelete();
        }
    };

    window.agendaStartInspection = function(clientEnc, addrEnc) {
        const newId = 'KZO-' + Date.now().toString().slice(-5);
        window.location.href = 'KZO_Inspect.html?project=' + newId + '&new=1&client=' + clientEnc + '&address=' + addrEnc;
    };

    // Appelé par index.html au chargement pour notifier silencieusement
    window.kzoCheckTodayNotifications = async function() {
        loadEvents();
        await _notifyTodayEvents();
    };

})();
