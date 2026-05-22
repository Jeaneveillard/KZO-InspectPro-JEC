'use strict';

let allProjects   = [];
let currentFilter = 'all';

// ─── Utilitaires ────────────────────────────────────────────────────────────

function showToast(msg, color) {
    const t = document.getElementById('toast-home');
    t.textContent = msg;
    t.style.background = color || '#065f46';
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none'; }, 3000);
}

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sanitize(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML.replace(/'/g, '&#39;');
}

function buildingEmoji(p) {
    const name = (p.clientName || '') + (p.address || '');
    if (/duplex|triplex/i.test(name)) return '🏘️';
    if (/condo|appart/i.test(name))   return '🏢';
    if (/commercial|bureau/i.test(name)) return '🏬';
    return '🏠';
}

// ─── Rendu de la grille ─────────────────────────────────────────────────────
// Les boutons utilisent data-action + data-id (pas d'onclick inline)
// pour être compatibles avec la CSP sans unsafe-inline.

function renderGrid(projects) {
    const grid = document.getElementById('projectGrid');

    const newCard = currentFilter === 'all'
        ? `<div class="card-new" role="button" tabindex="0" aria-label="Créer une nouvelle inspection">
               <div class="card-new-icon">＋</div>
               <div class="card-new-label">Nouvelle inspection</div>
               <div class="card-new-sub">Créer un nouveau dossier</div>
           </div>`
        : '';

    if (!projects.length) {
        grid.innerHTML = newCard + '<div class="empty-state"><h2>Aucune inspection trouvée</h2><p>Créez votre première inspection ou importez un fichier .kzo</p></div>';
        return;
    }

    grid.innerHTML = newCard + projects.map(p => {
        const pct = Math.min(Math.round((p.progress / 10) * 100), 100);
        const statusLabel = p.status === 'termine' ? 'TERMINÉ' : 'EN COURS';
        return `
        <div class="card ${sanitize(p.status)}" data-id="${sanitize(p.id)}" data-action="open-card">
            <div class="card-photo-strip">${buildingEmoji(p)}</div>
            <div class="card-body">
                <div class="card-header">
                    <span class="badge ${sanitize(p.status)}">${statusLabel}</span>
                    <span class="card-date">${formatDate(p.updatedAt)}</span>
                </div>
                <div class="card-client">${sanitize(p.clientName) || 'Client inconnu'}</div>
                <div class="card-code">${sanitize(p.code || p.id)}</div>
                <div class="card-address">${sanitize(p.address) || '—'}</div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width:${pct}%"></div>
                </div>
                <div class="progress-label">${p.progress}/10 sections · ${pct}%</div>
                <div class="card-actions">
                    <button type="button" class="action-btn open"   data-action="open"   data-id="${sanitize(p.id)}" aria-label="Ouvrir ${sanitize(p.clientName)}">Ouvrir</button>
                    <button type="button" class="action-btn export" data-action="export" data-id="${sanitize(p.id)}" aria-label="Exporter ${sanitize(p.clientName)} en .kzo">⬇️ .kzo</button>
                    <button type="button" class="action-btn del"    data-action="delete" data-id="${sanitize(p.id)}" aria-label="Supprimer ${sanitize(p.clientName)}">🗑️</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ─── Filtres & recherche ────────────────────────────────────────────────────

function filterProjects() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    let filtered = allProjects;
    if (currentFilter !== 'all') filtered = filtered.filter(p => p.status === currentFilter);
    if (q) filtered = filtered.filter(p =>
        (p.clientName || '').toLowerCase().includes(q) ||
        (p.address    || '').toLowerCase().includes(q) ||
        (p.code       || '').toLowerCase().includes(q)
    );
    renderGrid(filtered);
}

function setFilter(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterProjects();
}

// ─── Navigation ─────────────────────────────────────────────────────────────

function openProject(id) {
    window.location.href = 'KZO_Inspect.html?project=' + encodeURIComponent(id);
}

function newInspection() {
    const newId = 'KZO-' + Date.now().toString().slice(-5);
    window.location.href = 'KZO_Inspect.html?project=' + newId + '&new=1';
}

// ─── Export / Import ─────────────────────────────────────────────────────────

async function exportProject(id) {
    try {
        showToast('⏳ Génération du fichier .kzo...');
        const blob    = await KZOStorage.exportKZO(id);
        const project = allProjects.find(p => p.id === id);
        const name    = project ? project.clientName.replace(/[^a-zA-Z0-9]/g, '_') : id;
        const url     = URL.createObjectURL(blob);
        const a       = document.createElement('a');
        a.href = url;
        a.download = 'KZO-' + name + '-' + new Date().toISOString().slice(0, 10) + '.kzo';
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Fichier .kzo exporté');
    } catch (e) {
        showToast('❌ Erreur export : ' + e.message, '#7f1d1d');
    }
}

function triggerImport() {
    const input = document.getElementById('importInput');
    input.value = '';
    input.click();
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
        showToast('⏳ Import en cours...');
        const projectId = await KZOStorage.importKZO(file);
        if (projectId) {
            showToast('✅ Inspection importée — ' + projectId);
            await loadAndRender();
        }
    } catch (e) {
        showToast('❌ Erreur import : ' + e.message, '#7f1d1d');
    }
}

// ─── Suppression avec modale ─────────────────────────────────────────────────

function showConfirm(msg, onConfirm) {
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:9999;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#1e293b;border-radius:12px;padding:28px 24px;max-width:340px;width:90%;color:#f1f5f9;box-shadow:0 8px 32px rgba(0,0,0,0.5);';
    const p = document.createElement('p');
    p.style.cssText = 'margin-bottom:20px;font-size:0.95rem;line-height:1.5;';
    p.textContent = msg;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;';
    const cancel = document.createElement('button');
    cancel.textContent = 'Annuler';
    cancel.style.cssText = 'padding:9px 18px;background:#334155;color:#f1f5f9;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;';
    const ok = document.createElement('button');
    ok.textContent = 'Supprimer';
    ok.style.cssText = 'padding:9px 18px;background:#dc2626;color:white;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:700;';
    cancel.onclick = () => ov.remove();
    ok.onclick     = () => { ov.remove(); onConfirm(); };
    row.append(cancel, ok);
    box.append(p, row);
    ov.appendChild(box);
    document.body.appendChild(ov);
}

async function deleteProject(id) {
    const project = allProjects.find(p => p.id === id);
    const name = project ? project.clientName : id;
    showConfirm('Supprimer l\'inspection de « ' + name + ' » ?\nCette action est irréversible.', async () => {
        try {
            await KZOStorage.deleteProject(id);
            showToast('🗑️ Inspection supprimée');
            await loadAndRender();
        } catch (e) {
            showToast('❌ Erreur suppression : ' + e.message, '#7f1d1d');
        }
    });
}

// ─── Chargement ──────────────────────────────────────────────────────────────

async function loadAndRender() {
    allProjects = await KZOStorage.listProjects();
    filterProjects();
}

// ─── Initialisation (après DOM ready) ────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {

    // Topbar
    document.getElementById('agendaBtn').addEventListener('click', () => window.openAgendaModal());
    document.getElementById('importBtn').addEventListener('click', triggerImport);
    document.getElementById('logoutBtn').addEventListener('click', () => KZOAuth.logout());

    // Recherche
    document.getElementById('searchInput').addEventListener('input', filterProjects);

    // Filtres — délégation sur le conteneur
    document.querySelector('.filters').addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (btn) setFilter(btn.dataset.filter, btn);
    });

    // Import fichier
    document.getElementById('importInput').addEventListener('change', handleImport);

    // Agenda modal
    document.querySelector('.agenda-close').addEventListener('click', () => window.closeAgendaModal());
    document.getElementById('agendaPrevBtn').addEventListener('click', () => window.agendaPrevMonth());
    document.getElementById('agendaNextBtn').addEventListener('click', () => window.agendaNextMonth());
    document.getElementById('agendaSaveBtn').addEventListener('click', () => window.agendaSaveEvent());

    // Grille — délégation d'événements
    document.getElementById('projectGrid').addEventListener('click', e => {
        if (e.target.closest('.card-new')) { newInspection(); return; }
        const btn = e.target.closest('[data-action]');
        if (btn && btn.dataset.action !== 'open-card') {
            e.stopPropagation();
            const id = btn.dataset.id;
            if (btn.dataset.action === 'open')   openProject(id);
            if (btn.dataset.action === 'export') exportProject(id);
            if (btn.dataset.action === 'delete') deleteProject(id);
            return;
        }
        const card = e.target.closest('[data-action="open-card"]');
        if (card && !e.target.closest('.card-actions')) openProject(card.dataset.id);
    });

    // Accessibilité : Entrée/Espace sur card-new
    document.getElementById('projectGrid').addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card-new')) {
            e.preventDefault();
            newInspection();
        }
    });

    // Démarrage
    KZOStorage.migrateLegacy().then(() => loadAndRender()).catch(() => loadAndRender());
    if (window.kzoCheckTodayNotifications) window.kzoCheckTodayNotifications();
});
