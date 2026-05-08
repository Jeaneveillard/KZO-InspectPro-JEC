document.addEventListener('DOMContentLoaded', async () => {

    // Handle File System Access API pour Save / Save As .kzo
    let _kzoFileHandle = null;
    let _isDirty = false;

    // --- 0. Sécurité et Utilitaires ---
    
    // Anti-XSS : Échapper tout contenu utilisateur avant insertion HTML
    function sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Valide qu'une URL photo est un data URI image ou un blob URL (jamais javascript: ou data:text/)
    function _isSafePhotoUrl(url) {
        return typeof url === 'string' && (url.startsWith('data:image/') || url.startsWith('blob:'));
    }

    // Validation de fichier (taille max 10 Mo, types image uniquement)
    function validateFile(file) {
        const MAX_SIZE = 10 * 1024 * 1024;
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!file) return { valid: false, error: 'Aucun fichier sélectionné.' };
        if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: 'Type non supporté. Utilisez JPG, PNG ou WebP.' };
        if (file.size > MAX_SIZE) return { valid: false, error: 'Fichier trop volumineux (max 10 Mo).' };
        return { valid: true };
    }

    // Toast — remplace alert() natif
    function showToast(message, type = 'info', duration = 4000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = `${icons[type] || ''} ${message}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), duration + 300);
    }

    // Popup prévisualisation IA — title: string, text: string, onInsert: Function
    function showAiPreview(title, text, onInsert) {
        const modal = document.getElementById('aiPreviewModal');
        const titleEl = document.getElementById('aiPreviewTitle');
        const contentEl = document.getElementById('aiPreviewContent');
        const insertBtn = document.getElementById('insertAiPreviewBtn');
        const cancelBtn = document.getElementById('cancelAiPreviewBtn');
        const closeBtn = document.getElementById('closeAiPreviewBtn');

        if (!modal) return;

        titleEl.textContent = title;
        contentEl.textContent = text;

        modal.style.display = 'flex';

        // Cloner pour nettoyer les anciens listeners
        const newInsert = insertBtn.cloneNode(true);
        const newCancel = cancelBtn.cloneNode(true);
        const newClose = closeBtn.cloneNode(true);
        insertBtn.parentNode.replaceChild(newInsert, insertBtn);
        cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
        closeBtn.parentNode.replaceChild(newClose, closeBtn);

        newInsert.addEventListener('click', () => {
            modal.style.display = 'none';
            onInsert();
        });
        newCancel.addEventListener('click', () => { modal.style.display = 'none'; });
        newClose.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    // Panneau analyse photo automatique IA
    function showPhotoAnalysis(subId, subTitle, imageBase64, result, onApply) {
        const panel = document.getElementById('photoAnalysisPanel');
        const titleEl = document.getElementById('photoAnalysisTitle');
        const badge = document.getElementById('photoAnalysisBadge');
        const thumb = document.getElementById('photoAnalysisThumb');
        const textEl = document.getElementById('photoAnalysisText');
        const ignoreBtn = document.getElementById('photoAnalysisIgnore');
        const applyBtn = document.getElementById('photoAnalysisApply');

        if (!panel) return;

        // Remplir le contenu
        titleEl.textContent = '🔍 Analyse IA — ' + subTitle;
        textEl.textContent = result.description; // textContent — pas d'injection HTML

        // Badge selon état détecté
        const badgeConfig = {
            defaut:    { bg: '#dc2626', text: '❌ DÉFAUT DÉTECTÉ' },
            surveiller:{ bg: '#d97706', text: '⚠️ À SURVEILLER' },
            conforme:  { bg: '#059669', text: '✅ CONFORME' }
        };
        const cfg = badgeConfig[result.etat] || { bg: '#64748b', text: result.etat.toUpperCase() };
        badge.style.background = cfg.bg;
        badge.textContent = cfg.text;

        // Miniature
        if (imageBase64) {
            thumb.src = 'data:image/jpeg;base64,' + imageBase64;
            thumb.style.display = 'block';
        } else {
            thumb.style.display = 'none';
        }

        panel.style.display = 'flex';

        // Cloner les boutons pour nettoyer les anciens listeners
        const newIgnore = ignoreBtn.cloneNode(true);
        const newApply = applyBtn.cloneNode(true);
        ignoreBtn.parentNode.replaceChild(newIgnore, ignoreBtn);
        applyBtn.parentNode.replaceChild(newApply, applyBtn);

        newIgnore.addEventListener('click', () => { panel.style.display = 'none'; });
        newApply.addEventListener('click', () => {
            panel.style.display = 'none';
            onApply(result.etat);
        });
    }

    function _markDirty() {
        if (_isDirty) return;
        _isDirty = true;
        const btn = document.getElementById('saveBtn');
        if (btn) {
            btn.classList.add('dirty');
            btn.title = 'Modifications non sauvegardées — cliquer pour sauvegarder';
        }
    }

    function _markClean() {
        _isDirty = false;
        const btn = document.getElementById('saveBtn');
        if (btn) {
            btn.classList.remove('dirty');
            btn.title = 'Sauvegarder l\'inspection';
        }
    }

    // Sauvegarde explicite sans quitter
    async function saveOnly() {
        const btn = document.getElementById('saveBtn');
        if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
        if (window.currentProjectId && window.KZOStorage) {
            try {
                const snapshot = {
                    clientInfo: inspectionData.clientInfo,
                    id: inspectionData.id,
                    units: inspectionData.units,
                    currentUnitId: inspectionData.currentUnitId,
                    rapportNarratifIA: inspectionData.rapportNarratifIA || ''
                };
                await KZOStorage.saveProject(window.currentProjectId, snapshot, _computeProgress());
                _markClean();
                showToast('Inspection sauvegardée ✓', 'success');
            } catch (e) {
                showToast('Erreur sauvegarde : ' + e.message, 'error');
            }
        }
        if (btn) { btn.disabled = false; btn.textContent = '💾 Sauvegarder'; }
    }

    // Sauvegarde explicite et retour à l'accueil
    async function saveAndQuit() {
        const _btn1 = document.getElementById('saveBtn');
        const _btn2 = document.getElementById('saveQuitSidebarBtn');
        [_btn1, _btn2].forEach(b => { if (b) b.disabled = true; });
        if (window.currentProjectId && window.KZOStorage) {
            try {
                const snapshot = {
                    clientInfo: inspectionData.clientInfo,
                    id: inspectionData.id,
                    units: inspectionData.units,
                    currentUnitId: inspectionData.currentUnitId,
                    rapportNarratifIA: inspectionData.rapportNarratifIA || ''
                };
                await KZOStorage.saveProject(window.currentProjectId, snapshot, _computeProgress());
                _markClean();
                showToast('Inspection sauvegardée ✓', 'success');
                setTimeout(() => { window.location.href = 'index.html'; }, 1200);
            } catch (e) {
                showToast('Erreur sauvegarde : ' + e.message, 'error');
                [_btn1, _btn2].forEach(b => { if (b) b.disabled = false; });
            }
        } else {
            window.location.href = 'index.html';
        }
    }

    // Ajoute le bouton "Sauvegarder et quitter" épinglé en bas du sidebar
    function renderSaveQuitSidebar() {
        const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar') || document.querySelector('nav');
        if (!sidebar || document.getElementById('saveQuitSidebarBtn')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'saveQuitSidebarBtn';
        btn.textContent = '💾 Sauvegarder et quitter';
        btn.style.cssText = 'display:block;width:calc(100% - 16px);margin:12px 8px 8px;padding:10px 14px;background:#1e3a5f;color:#93c5fd;border:1px solid #2563eb33;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;text-align:center;transition:background 0.15s;';
        btn.addEventListener('mouseenter', () => { btn.style.background = '#0f2a5c'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = '#1e3a5f'; });
        btn.addEventListener('click', saveAndQuit);
        sidebar.appendChild(btn);
    }

    // Compression photo avant stockage localStorage (évite la saturation)
    function compressImage(file, maxWidth = 800, quality = 0.65) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ratio = Math.min(1, maxWidth / img.width);
                    canvas.width = Math.round(img.width * ratio);
                    canvas.height = Math.round(img.height * ratio);
                    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function _estimatePhotosSize(unit) {
        let bytes = 0;
        Object.values(unit.sectionPhotos || {}).forEach(arr =>
            arr.forEach(p => { bytes += Math.round((p.url || '').length * 0.75); })
        );
        return bytes;
    }

    // Protection légère : désactiver le clic droit sur les images uniquement
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('contextmenu', e => e.preventDefault());
    });

    // --- Gestion multi-projets : chargement depuis URL ---
    const _urlParams = new URLSearchParams(window.location.search);
    window.currentProjectId = _urlParams.get('project');

    if (!window.currentProjectId) {
        window.location.href = 'index.html';
        return;
    }

    const _isNewProject = _urlParams.get('new') === '1';
    if (!_isNewProject && window.KZOStorage) {
        try {
            const _savedProject = await KZOStorage.loadProject(window.currentProjectId);
            if (_savedProject && _savedProject.data) {
                const d = _savedProject.data;
                if (d.clientInfo && typeof d.clientInfo === 'object') inspectionData.clientInfo = d.clientInfo;
                if (Array.isArray(d.units) && d.units.length > 0) inspectionData.units = d.units;
                if (d.currentUnitId) inspectionData.currentUnitId = d.currentUnitId;
                if (d.rapportNarratifIA) inspectionData.rapportNarratifIA = d.rapportNarratifIA;
                inspectionData.id = window.currentProjectId;
            }
        } catch (e) {
            console.warn('[app.js] Chargement projet IndexedDB échoué:', e);
            showToast('Projet non chargé — données temporaires', 'warning');
        }
    } else if (_isNewProject) {
        inspectionData.id = window.currentProjectId;
    }

    // Charger les données persistées depuis localStorage
    const savedInspectorName = localStorage.getItem('inspectpro_inspector_name') || '';
    let savedClientNames = [];
    try { savedClientNames = JSON.parse(localStorage.getItem('inspectpro_client_names')) || []; } catch(e) { savedClientNames = []; }
    if (!Array.isArray(savedClientNames) || savedClientNames.length === 0) savedClientNames = [''];
    const savedClientAddress = localStorage.getItem('inspectpro_client_address') || '';
    const savedClientEmail   = localStorage.getItem('inspectpro_client_email') || '';
    inspectionData.clientInfo.inspectorName = savedInspectorName;
    inspectionData.clientInfo.names = savedClientNames;
    inspectionData.clientInfo.name = savedClientNames.filter(n => n).join(' & ');
    inspectionData.clientInfo.address = savedClientAddress;
    inspectionData.clientInfo.email   = savedClientEmail;

    // Initialiser les objets de commentaires si absents
    if (!inspectionData.comments) inspectionData.comments = {};
    if (!inspectionData.sectionComments) inspectionData.sectionComments = {};
    if (!inspectionData.fieldStates) inspectionData.fieldStates = {};
    if (!inspectionData.sectionPhotos) inspectionData.sectionPhotos = {};

    // ============================================================
    //  PROXY MULTI-UNITÉS
    //  Redirige inspectionData.fieldStates vers l'unité active
    //  si le mode multi-unités est activé. Transparent pour tout
    //  le code existant.
    // ============================================================
    // Sauvegarder les données initiales (pré-multi-unités) dans unit_1
    const _initialFieldStates = { ...inspectionData.fieldStates };
    const _initialComments = { ...inspectionData.comments };
    const _initialSectionComments = { ...inspectionData.sectionComments };
    const _initialSectionPhotos = { ...inspectionData.sectionPhotos };

    // ============================================================
    //  SYSTÈME MULTI-UNITÉS (Duplex, Triplex, Condo, etc.)
    // ============================================================
    // Types qui activent le mode multi-unités automatiquement
    const MULTI_UNIT_TYPES = ['Duplex', 'Triplex', 'Condo / Appartement', 'Maison de ville (Townhouse)'];

    // Initialisation des unités — DOIT être avant tout appel à getActiveFieldStates()
    if (!inspectionData.units) {
        inspectionData.units = [
            {
                id: 'unit_1',
                name: 'Unité 1',
                fieldStates: _initialFieldStates || {},
                comments: _initialComments || {},
                sectionComments: _initialSectionComments || {},
                sectionPhotos: _initialSectionPhotos || {}
            }
        ];
    }
    if (typeof inspectionData.currentUnitId === 'undefined') {
        inspectionData.currentUnitId = 'unit_1';
    }

    // Auto-génération du code d'inspection sur nouvelle inspection
    if (_isNewProject && !getActiveFieldStates()['inspection_code']) {
        getActiveFieldStates()['inspection_code'] = window.currentProjectId || ('KZO-' + Date.now().toString().slice(-5));
        saveAppState();
    }

    // ============================================================
    //  REDIRECTION AUTOMATIQUE vers l'unité active
    //  Remplace fieldStates/comments/etc par des proxies qui
    //  redirigent vers l'unité active dès qu'on est multi-unités.
    //  Compatible avec tout le code existant — aucune modification
    //  nécessaire ailleurs dans app.js.
    // ============================================================
    function _getActiveUnit() {
        return inspectionData.units.find(u => u.id === inspectionData.currentUnitId) || inspectionData.units[0];
    }

    // Propriétés dynamiques sur inspectionData
    // IMPORTANT: supprimer les anciennes propriétés avant de redéfinir
    // sinon defineProperty peut échouer silencieusement
    try { delete inspectionData.fieldStates; } catch(e) {}
    try { delete inspectionData.comments; } catch(e) {}
    try { delete inspectionData.sectionComments; } catch(e) {}
    try { delete inspectionData.sectionPhotos; } catch(e) {}

    Object.defineProperty(inspectionData, 'fieldStates', {
        get() {
            const u = _getActiveUnit();
            if (!u.fieldStates) u.fieldStates = {};
            return u.fieldStates;
        },
        set(v) {
            const u = _getActiveUnit();
            u.fieldStates = v;
        },
        configurable: true,
        enumerable: true
    });

    Object.defineProperty(inspectionData, 'comments', {
        get() {
            const u = _getActiveUnit();
            if (!u.comments) u.comments = {};
            return u.comments;
        },
        set(v) {
            const u = _getActiveUnit();
            u.comments = v;
        },
        configurable: true,
        enumerable: true
    });

    Object.defineProperty(inspectionData, 'sectionComments', {
        get() {
            const u = _getActiveUnit();
            if (!u.sectionComments) u.sectionComments = {};
            return u.sectionComments;
        },
        set(v) {
            const u = _getActiveUnit();
            u.sectionComments = v;
        },
        configurable: true,
        enumerable: true
    });

    Object.defineProperty(inspectionData, 'sectionPhotos', {
        get() {
            const u = _getActiveUnit();
            if (!u.sectionPhotos) u.sectionPhotos = {};
            return u.sectionPhotos;
        },
        set(v) {
            const u = _getActiveUnit();
            u.sectionPhotos = v;
        },
        configurable: true,
        enumerable: true
    });

    // Retourner l'unité active
    function getCurrentUnit() {
        return inspectionData.units.find(u => u.id === inspectionData.currentUnitId) || inspectionData.units[0];
    }

    // Retourner les fieldStates de l'unité active (avec fallback)
    function getActiveFieldStates() {
        const unit = getCurrentUnit();
        if (!unit.fieldStates) unit.fieldStates = {};
        return unit.fieldStates;
    }

    function getActiveComments() {
        const unit = getCurrentUnit();
        if (!unit.comments) unit.comments = {};
        return unit.comments;
    }

    function getActiveSectionComments() {
        const unit = getCurrentUnit();
        if (!unit.sectionComments) unit.sectionComments = {};
        return unit.sectionComments;
    }

    function getActiveSectionPhotos() {
        const unit = getCurrentUnit();
        if (!unit.sectionPhotos) unit.sectionPhotos = {};
        return unit.sectionPhotos;
    }

    // Vérifier si le bâtiment est multi-unités selon prop_type
    function isMultiUnitBuilding() {
        const propType = document.getElementById('prop_type')?.value || inspectionData.fieldStates?.prop_type_val || '';
        return MULTI_UNIT_TYPES.includes(propType);
    }

    // Ajouter une nouvelle unité
    function addUnit() {
        const newNum = inspectionData.units.length + 1;
        const defaultName = prompt('Nom de la nouvelle unité :', `Unité ${newNum}`);
        if (!defaultName) return;
        const newUnit = {
            id: 'unit_' + Date.now(),
            name: defaultName,
            fieldStates: {},
            comments: {},
            sectionComments: {},
            sectionPhotos: {}
        };
        inspectionData.units.push(newUnit);
        inspectionData.currentUnitId = newUnit.id;
        saveAppState();
        renderUnitTabs();
        renderSection(currentSectionIndex);
    }

    // Renommer une unité
    function renameUnit(unitId) {
        const unit = inspectionData.units.find(u => u.id === unitId);
        if (!unit) return;
        const newName = prompt('Renommer l\'unité :', unit.name);
        if (newName && newName.trim()) {
            unit.name = newName.trim();
            saveAppState();
            renderUnitTabs();
        }
    }

    // Supprimer une unité
    function deleteUnit(unitId) {
        if (inspectionData.units.length <= 1) {
            showToast('Impossible de supprimer la dernière unité.', 'warning');
            return;
        }
        const unit = inspectionData.units.find(u => u.id === unitId);
        if (!unit) return;
        if (!confirm(`Supprimer "${unit.name}" ? Toutes les données de cette unité seront perdues.`)) return;
        inspectionData.units = inspectionData.units.filter(u => u.id !== unitId);
        if (inspectionData.currentUnitId === unitId) {
            inspectionData.currentUnitId = inspectionData.units[0].id;
        }
        saveAppState();
        renderUnitTabs();
        renderSection(currentSectionIndex);
    }

    // Changer d'unité active
    function switchUnit(unitId) {
        inspectionData.currentUnitId = unitId;
        saveAppState();
        renderUnitTabs();
        renderSection(currentSectionIndex);
    }

    // Rendre la barre de tabs des unités
    function renderUnitTabs() {
        let tabsBar = document.getElementById('unitTabsBar');
        const multiMode = isMultiUnitBuilding();

        // Créer la barre si elle n'existe pas
        if (!tabsBar) {
            tabsBar = document.createElement('div');
            tabsBar.id = 'unitTabsBar';
            tabsBar.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: linear-gradient(135deg, #1e40af, #1A56DB); border-bottom: 2px solid #0D3B6E; overflow-x: auto; flex-wrap: nowrap;';
            const mainContent = document.querySelector('.main-content') || document.querySelector('#sectionContent')?.parentElement;
            const topBar = document.querySelector('.top-bar');
            if (mainContent && topBar) {
                mainContent.insertBefore(tabsBar, mainContent.firstChild);
            } else if (topBar) {
                topBar.parentNode.insertBefore(tabsBar, topBar.nextSibling);
            }
        }

        // Masquer la barre si pas multi-unités
        if (!multiMode) {
            tabsBar.style.display = 'none';
            // Assurer qu'on est sur une unité valide (reset à unit_1)
            if (inspectionData.units.length > 1) {
                inspectionData.units = [inspectionData.units[0]];
                inspectionData.currentUnitId = inspectionData.units[0].id;
            }
            return;
        }

        tabsBar.style.display = 'flex';
        tabsBar.innerHTML = '';

        // Label
        const label = document.createElement('span');
        label.innerHTML = '🏠 <strong>Unités :</strong>';
        label.style.cssText = 'color: white; font-size: 0.9rem; margin-right: 4px; flex-shrink: 0; white-space: nowrap;';
        tabsBar.appendChild(label);

        // Tabs des unités
        inspectionData.units.forEach(unit => {
            const isActive = unit.id === inspectionData.currentUnitId;
            const tab = document.createElement('div');
            tab.style.cssText = `
                display: flex; align-items: center; gap: 6px;
                padding: 7px 12px; border-radius: 8px;
                background: ${isActive ? 'white' : 'rgba(255,255,255,0.15)'};
                color: ${isActive ? '#1e40af' : 'white'};
                font-weight: ${isActive ? '700' : '500'};
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s;
                flex-shrink: 0;
                white-space: nowrap;
                box-shadow: ${isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'};
            `;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = unit.name;
            nameSpan.onclick = () => switchUnit(unit.id);
            tab.appendChild(nameSpan);

            if (isActive) {
                // Bouton renommer
                const renameBtn = document.createElement('button');
                renameBtn.innerHTML = '✏️';
                renameBtn.title = 'Renommer';
                renameBtn.style.cssText = 'background: none; border: none; cursor: pointer; padding: 0 4px; font-size: 0.85rem;';
                renameBtn.onclick = (e) => { e.stopPropagation(); renameUnit(unit.id); };
                tab.appendChild(renameBtn);

                // Bouton supprimer (seulement si +1 unité)
                if (inspectionData.units.length > 1) {
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = '🗑️';
                    delBtn.title = 'Supprimer';
                    delBtn.style.cssText = 'background: none; border: none; cursor: pointer; padding: 0 4px; font-size: 0.85rem;';
                    delBtn.onclick = (e) => { e.stopPropagation(); deleteUnit(unit.id); };
                    tab.appendChild(delBtn);
                }
            }

            tabsBar.appendChild(tab);
        });

        // Bouton ajouter
        const addBtn = document.createElement('button');
        addBtn.innerHTML = '+ Ajouter une unité';
        addBtn.style.cssText = `
            background: #059669; color: white; border: none;
            padding: 7px 14px; border-radius: 8px;
            font-size: 0.85rem; font-weight: 600; cursor: pointer;
            transition: all 0.2s; flex-shrink: 0; white-space: nowrap;
            margin-left: auto;
        `;
        addBtn.onmouseenter = () => addBtn.style.background = '#047857';
        addBtn.onmouseleave = () => addBtn.style.background = '#059669';
        addBtn.onclick = addUnit;
        tabsBar.appendChild(addBtn);

        // Indicateur du nombre total
        const badge = document.createElement('span');
        badge.textContent = `${inspectionData.units.length} unité${inspectionData.units.length > 1 ? 's' : ''}`;
        badge.style.cssText = 'background: rgba(255,255,255,0.2); color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; flex-shrink: 0; white-space: nowrap;';
        tabsBar.appendChild(badge);

        // Bouton rapport rapide pour l'unité active
        const reportBtn = document.createElement('button');
        reportBtn.innerHTML = '📄 Rapport de cette unité';
        reportBtn.title = `Générer le rapport de ${_getActiveUnit().name}`;
        reportBtn.style.cssText = `
            background: #eab308; color: #0f172a; border: none;
            padding: 7px 14px; border-radius: 8px;
            font-size: 0.85rem; font-weight: 700; cursor: pointer;
            transition: all 0.2s; flex-shrink: 0; white-space: nowrap;
        `;
        reportBtn.onmouseenter = () => { reportBtn.style.background = '#ca8a04'; reportBtn.style.transform = 'translateY(-1px)'; };
        reportBtn.onmouseleave = () => { reportBtn.style.background = '#eab308'; reportBtn.style.transform = 'translateY(0)'; };
        reportBtn.onclick = () => generateFinalReport(_getActiveUnit().id);
        tabsBar.appendChild(reportBtn);
    }

    // Écouter les changements du champ prop_type pour activer/désactiver le mode multi-unités
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'prop_type') {
            renderUnitTabs();
            // Notification à l'utilisateur
            if (isMultiUnitBuilding()) {
                const msg = document.createElement('div');
                msg.style.cssText = 'position: fixed; top: 80px; right: 20px; background: #059669; color: white; padding: 14px 20px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 9999; font-weight: 600; font-size: 0.95rem; animation: slideIn 0.3s;';
                msg.innerHTML = '✅ Mode multi-unités activé<br><span style="font-weight:400; font-size:0.85rem;">Utilisez la barre en haut pour gérer les unités</span>';
                document.body.appendChild(msg);
                setTimeout(() => msg.remove(), 4000);
            }
        }
    });

    // ============================================================
    //  FIN SYSTÈME MULTI-UNITÉS
    // ============================================================

    // --- Configuration Entreprise Dynamique ---
    window.AppCompanyProfile = {
        name: localStorage.getItem('kzo_company_name') || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.name : 'KZO InspectPro'),
        address: localStorage.getItem('kzo_company_address') || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.address : 'Québec, Canada'),
        phone: localStorage.getItem('kzo_company_phone') || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.phone : '438-378-6703'),
        email: localStorage.getItem('kzo_company_email') || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.email : 'kzoinspectpro@gmail.com'),
        tps: localStorage.getItem('kzo_company_tps') || '',
        tvq: localStorage.getItem('kzo_company_tvq') || ''
    };

    // Pré-remplir le nom de l'inspecteur depuis KZO_OWNER_PROFILE
    if (!localStorage.getItem('inspectpro_inspector_name') && typeof KZO_OWNER_PROFILE !== 'undefined') {
        inspectionData.clientInfo.inspectorName = KZO_OWNER_PROFILE.inspectorName || 'Jean Eveillard Cazeau';
        localStorage.setItem('inspectpro_inspector_name', inspectionData.clientInfo.inspectorName);
    }

    // Bouton IA Rapport Complet (top-bar)
    const iaRapportBtn = document.getElementById('iaRapportBtn');
    if (iaRapportBtn) {
        iaRapportBtn.addEventListener('click', async () => {
            iaRapportBtn.textContent = '⏳ Génération...';
            iaRapportBtn.disabled = true;
            try {
                const texte = await AIAgents.generateFullReport();
                showAiPreview(
                    '📄 Rapport Narratif Complet IA',
                    texte,
                    () => {
                        inspectionData.rapportNarratifIA = texte;
                        saveAppState();
                        showToast('Rapport narratif sauvegardé.', 'success');
                    }
                );
            } catch(err) {
                showToast('Erreur IA : ' + err.message, 'error');
            } finally {
                iaRapportBtn.textContent = '📄 IA Rapport';
                iaRapportBtn.disabled = false;
            }
        });
    }

    // Modal Profil Entreprise
    const cpBtn = document.getElementById('companyProfileBtn');
    const cpModal = document.getElementById('companyProfileModal');
    const cpClose = document.getElementById('closeCompanyProfile');
    const cpSave = document.getElementById('saveCompanyProfile');
    
    if (cpBtn && cpModal) {
        cpBtn.addEventListener('click', () => {
            document.getElementById('cp_company_name').value = window.AppCompanyProfile.name === 'NOM DE L\'ENTREPRISE' ? '' : window.AppCompanyProfile.name;
            document.getElementById('cp_company_address').value = window.AppCompanyProfile.address === 'Adresse à spécifier, Ville, Province' ? '' : window.AppCompanyProfile.address;
            document.getElementById('cp_company_phone').value = window.AppCompanyProfile.phone === '(000) 000-0000' ? '' : window.AppCompanyProfile.phone;
            document.getElementById('cp_company_email').value = window.AppCompanyProfile.email === 'email@entreprise.com' ? '' : window.AppCompanyProfile.email;
            document.getElementById('cp_company_tps').value = window.AppCompanyProfile.tps === '[No TPS]' ? '' : window.AppCompanyProfile.tps;
            document.getElementById('cp_company_tvq').value = window.AppCompanyProfile.tvq === '[No TVQ]' ? '' : window.AppCompanyProfile.tvq;
            cpModal.style.display = 'flex';
        });
        
        cpClose.addEventListener('click', () => cpModal.style.display = 'none');
        
        cpSave.addEventListener('click', () => {
            const n = document.getElementById('cp_company_name').value.trim();
            const a = document.getElementById('cp_company_address').value.trim();
            const p = document.getElementById('cp_company_phone').value.trim();
            const e = document.getElementById('cp_company_email').value.trim();
            const tp = document.getElementById('cp_company_tps').value.trim();
            const tv = document.getElementById('cp_company_tvq').value.trim();
            
            if (n) localStorage.setItem('kzo_company_name', n);
            if (a) localStorage.setItem('kzo_company_address', a);
            if (p) localStorage.setItem('kzo_company_phone', p);
            if (e) localStorage.setItem('kzo_company_email', e);
            if (tp) localStorage.setItem('kzo_company_tps', tp);
            if (tv) localStorage.setItem('kzo_company_tvq', tv);

            window.AppCompanyProfile.name = n || 'NOM DE L\'ENTREPRISE';
            window.AppCompanyProfile.address = a || 'Adresse à spécifier, Ville, Province';
            window.AppCompanyProfile.phone = p || '(000) 000-0000';
            window.AppCompanyProfile.email = e || 'email@entreprise.com';
            window.AppCompanyProfile.tps = tp || '[No TPS]';
            window.AppCompanyProfile.tvq = tv || '[No TVQ]';
            
            cpModal.style.display = 'none';
            showToast("Profil d'entreprise enregistré avec succès !", 'success');
            
            // Update Cover branding if visible
            const coverAppNames = document.querySelectorAll('.cover-app-name');
            coverAppNames.forEach(el => el.textContent = window.AppCompanyProfile.name);
        });
    }

    // Utilitaire : obtenir le nom d'affichage des clients
    function getClientDisplayName() {
        const names = (inspectionData.clientInfo.names || []).filter(n => n.trim());
        return names.length > 0 ? names.join(' & ') : '';
    }

    // Utilitaire : mettre à jour partout quand les noms changent
    function propagateClientNames() {
        if (!inspectionData.clientInfo) inspectionData.clientInfo = {};
        const displayName = getClientDisplayName();
        inspectionData.clientInfo.name = displayName;
        localStorage.setItem('inspectpro_client_names', JSON.stringify(inspectionData.clientInfo.names));

        // Sidebar
        const stitle = document.getElementById('sidebarTitle');
        if (stitle) {
            stitle.textContent = '';
            const nameLine = document.createElement('strong');
            nameLine.textContent = displayName || 'Client inconnu';
            const addrLine = document.createElement('span');
            addrLine.style.color = '#94a3b8';
            addrLine.style.fontSize = '0.8rem';
            addrLine.textContent = inspectionData.clientInfo.address || '';
            stitle.appendChild(nameLine);
            stitle.appendChild(document.createElement('br'));
            stitle.appendChild(addrLine);
        }

        // Cover page
        const coverClient = document.getElementById('coverClientName');
        if (coverClient) coverClient.textContent = displayName || 'Client à définir';
    }

    // --- 1. Rendu Dynamique de la Navigation ---
    const navLinks = document.getElementById('navLinks');
    let currentSectionIndex = 0;
    
    function getSectionStatus(section, fieldStates, sectionIndex, currentIdx) {
        if (sectionIndex === currentIdx) return 'active';
        const allFields = (section.subSections || []).flatMap(ss => ss.fields || []);
        const checkboxFields = allFields.filter(f => f.type === 'checkbox');
        const hasDefaut = checkboxFields.some(f =>
            fieldStates[f.id] === 'defaut' || fieldStates[f.id] === 'surveiller'
        );
        if (hasDefaut) return 'defaut';
        const hasAnyFilled = allFields.some(f => {
            const v = fieldStates[f.id];
            return v !== undefined && v !== null && v !== '' && v !== 'non_applicable';
        });
        if (hasAnyFilled) return 'complete';
        return 'todo';
    }

    function renderNavigation() {
        navLinks.innerHTML = '';

        inspectionData.sections.forEach((section, index) => {
            const li = document.createElement('li');
            const iconSpan = document.createElement('span');
            iconSpan.textContent = section.icon;
            const titleSpan = document.createElement('span');
            titleSpan.textContent = section.title;
            li.appendChild(iconSpan);
            li.appendChild(document.createTextNode(' '));
            li.appendChild(titleSpan);
            if (index === currentSectionIndex) li.classList.add('active');

            // Badge de statut
            if (!section.isCoverPage && section.key !== 'rapport') {
                const STATUS_BADGE = {
                    active:   { text: 'En cours',   bg: '#1d4ed8', color: 'white' },
                    defaut:   { text: '⚠️ Défauts', bg: '#dc2626', color: 'white' },
                    complete: { text: '✅ Complété', bg: '#166534', color: '#86efac' },
                    todo:     { text: '○ À faire',  bg: '#1e293b', color: '#64748b' }
                };
                const status = getSectionStatus(section, getActiveFieldStates(), index, currentSectionIndex);
                const b = STATUS_BADGE[status];
                const badge = document.createElement('span');
                badge.textContent = b.text;
                badge.style.cssText = `margin-left:auto; font-size:0.65rem; padding:2px 7px; border-radius:10px; background:${b.bg}; color:${b.color}; white-space:nowrap; flex-shrink:0;`;
                li.style.cssText = (li.style.cssText || '') + 'display:flex;align-items:center;gap:6px;';
                li.appendChild(badge);
            }

            li.addEventListener('click', () => {
                currentSectionIndex = index;
                renderNavigation();
                renderSection(index);
                if(window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
            });
            navLinks.appendChild(li);
        });
    }

    // --- 2. Rendu de la Section Courante ---
    const dynamicContent = document.getElementById('dynamicContent');
    const currentSectionTitle = document.getElementById('currentSectionTitle');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    function renderSection(index) {
        const section = inspectionData.sections[index];
        currentSectionTitle.textContent = section.title;
        dynamicContent.innerHTML = '';

        // --- Special Cover Page Rendering ---
        if (section.isCoverPage) {
            const coverDiv = document.createElement('div');
            coverDiv.className = 'cover-page-container';
            coverDiv.innerHTML = `
                <div class="cover-hero">
                    <!-- Inspector Name -->
                    <div class="cover-inspector-name">
                        <span class="cover-inspector-label">Inspecteur</span>
                        <span class="cover-inspector-value" id="coverInspectorName">${sanitizeHTML(inspectionData.clientInfo.inspectorName) || 'À définir'}</span>
                    </div>

                    <!-- App Branding -->
                    <h1 class="cover-app-name" style="word-wrap: anywhere; text-align: center;">${sanitizeHTML(window.AppCompanyProfile ? window.AppCompanyProfile.name : "InspectPro")}</h1>
                    <div class="cover-app-tagline">
                        <span class="cover-tagline-line"></span>
                        <span>Expertise & Intelligence en Inspection</span>
                        <span class="cover-tagline-line"></span>
                    </div>

                    <!-- Photo Upload -->
                    <label class="cover-upload-zone" id="coverDropZone">
                        <input type="file" accept="image/*" id="coverPhotoInput" style="display:none;">
                        <div class="cover-upload-content" id="coverUploadContent">
                            <div class="cover-upload-icon">🏠</div>
                            <span class="cover-upload-text">Appuyez ici pour sélectionner la photo de façade</span>
                            <span class="cover-upload-hint">JPG, PNG — Photo principale du bâtiment</span>
                        </div>
                        <img id="coverPreviewImg" class="cover-preview-img" style="display:none;">
                    </label>
                    
                    <div id="coverPhotoActions" style="display:none; margin-top: 12px;">
                        <button class="btn secondary" id="coverChangeBtn">🔄 Changer la photo</button>
                    </div>

                    <!-- Client Name -->
                    <div class="cover-client-section">
                        <span class="cover-client-label">Préparé pour</span>
                        <span class="cover-client-value" id="coverClientName">${sanitizeHTML(inspectionData.clientInfo.name) || 'Client à définir'}</span>
                        <span class="cover-client-address" id="coverClientAddress">${sanitizeHTML(inspectionData.clientInfo.address) || ''}</span>
                    </div>
                </div>
            `;
            dynamicContent.appendChild(coverDiv);

            // Wire up the cover photo input
            const coverInput = document.getElementById('coverPhotoInput');
            const coverPreview = document.getElementById('coverPreviewImg');
            const coverUploadContent = document.getElementById('coverUploadContent');
            const coverActions = document.getElementById('coverPhotoActions');
            const coverDropZone = document.getElementById('coverDropZone');

            coverInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                const check = validateFile(file);
                if (!check.valid) {
                    showToast(check.error, 'error');
                    coverInput.value = '';
                    return;
                }
                if (file && file.type.startsWith('image/')) {
                    const url = URL.createObjectURL(file);
                    coverPreview.src = url;
                    coverPreview.alt = 'Photo de façade du bâtiment';
                    coverPreview.style.display = 'block';
                    coverUploadContent.style.display = 'none';
                    coverActions.style.display = 'block';
                    coverDropZone.classList.add('has-photo');

                    // Update sidebar preview + data
                    document.getElementById('sidebarPhotoPreview').src = url;
                    document.getElementById('sidebarPhotoPreview').style.display = 'block';
                    document.getElementById('pinnedHeader').style.display = 'block';
                    inspectionData.clientInfo.coverPhotoUrl = url;
                }
            });

            // Restore existing photo if already uploaded
            if (inspectionData.clientInfo.coverPhotoUrl) {
                coverPreview.src = inspectionData.clientInfo.coverPhotoUrl;
                coverPreview.style.display = 'block';
                coverUploadContent.style.display = 'none';
                coverActions.style.display = 'block';
                coverDropZone.classList.add('has-photo');
            }

            document.getElementById('coverChangeBtn').addEventListener('click', (e) => {
                e.preventDefault();
                coverInput.click();
            });

            // Update nav buttons
            prevBtn.disabled = true;
            nextBtn.textContent = "Commencer l'inspection →";
            return;
        }

        // --- Preview Page Rendering ---
        if (section.isPreviewPage) {
            _renderPreviewPage(dynamicContent);
            prevBtn.disabled = currentSectionIndex === 0;
            nextBtn.disabled = false;
            nextBtn.textContent = 'Rapport Final →';
            return;
        }

        // --- Standard Section Rendering ---

        // Bannière Condo pour sections extérieures
        if (['structure', 'toiture'].includes(section.key) &&
            (getActiveFieldStates()['prop_type'] || '') === 'Condo / Appartement') {
            const condoBanner = document.createElement('div');
            condoBanner.style.cssText = 'background:#1e3a5f;border:1px solid #3b82f6;border-radius:6px;padding:10px 14px;margin-bottom:16px;color:#93c5fd;font-size:0.85rem;';
            condoBanner.textContent = 'ℹ️ Condo — Ces éléments sont généralement sous la responsabilité du syndicat de copropriété.';
            dynamicContent.appendChild(condoBanner);
        }

        section.subSections.forEach(sub => {
            const div = document.createElement('div');
            div.className = 'sub-section';

            // En-tête sous-section : titre + bouton "Tout Conforme"
            const subHeader = document.createElement('div');
            subHeader.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:10px;';
            const h3 = document.createElement('h3');
            h3.textContent = sub.title;
            h3.style.margin = '0';
            const hasCheckboxes = (sub.fields || []).some(f => f.type === 'checkbox');
            if (hasCheckboxes) {
                const toutConformeBtn = document.createElement('button');
                toutConformeBtn.type = 'button';
                toutConformeBtn.textContent = '✅ Tout Conforme';
                toutConformeBtn.title = 'Marquer tous les éléments de cette sous-section comme Conformes';
                toutConformeBtn.style.cssText = 'padding:5px 12px;background:#065f46;color:#6ee7b7;border:1px solid #064e3b44;border-radius:8px;font-size:0.75rem;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background 0.15s;';
                toutConformeBtn.addEventListener('click', () => {
                    div.querySelectorAll('select[id$="_state"]').forEach(sel => {
                        if (sel.value !== 'conforme') {
                            sel.value = 'conforme';
                            sel.dispatchEvent(new Event('change'));
                        }
                    });
                });
                subHeader.appendChild(h3);
                subHeader.appendChild(toutConformeBtn);
            } else {
                subHeader.appendChild(h3);
            }
            div.appendChild(subHeader);

            sub.fields.forEach(field => {
                // Champs conditionnels — ne pas rendre si condition non satisfaite
                if (field.showIf) {
                    const val = getActiveFieldStates()[field.showIf.field] || '';
                    if (!field.showIf.values.includes(val)) return;
                }

                const fieldGroup = document.createElement('div');
                fieldGroup.className = 'field-group';

                if (field.type === 'checkbox') {
                    // --- Conteneur principal de l'item ---
                    const itemWrapper = document.createElement('div');
                    itemWrapper.style.cssText = 'border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; background: #f8fafc; transition: all 0.2s;';

                    // --- Ligne du haut : état + label ---
                    const topRow = document.createElement('div');
                    topRow.style.cssText = 'display: flex; align-items: flex-start; gap: 12px;';

                    // Menu déroulant d'état
                    const stateSelect = document.createElement('select');
                    stateSelect.id = field.id + '_state';
                    stateSelect.style.cssText = 'padding: 6px 10px; border-radius: 8px; border: 2px solid #e2e8f0; font-size: 0.88rem; font-weight: 600; cursor: pointer; background: white; min-width: 160px; flex-shrink: 0;';

                    const states = [
                        { value: '', label: '— Sélectionner —', color: '#94a3b8', bg: '#f8fafc' },
                        { value: 'conforme', label: '✅ Conforme', color: '#059669', bg: '#ecfdf5' },
                        { value: 'surveiller', label: '⚠️ À surveiller', color: '#d97706', bg: '#fffbeb' },
                        { value: 'defaut', label: '❌ Défaut', color: '#dc2626', bg: '#fef2f2' },
                        { value: 'na', label: '➖ Non applicable', color: '#64748b', bg: '#f1f5f9' }
                    ];

                    states.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s.value;
                        opt.textContent = s.label;
                        stateSelect.appendChild(opt);
                    });

                    // Restaurer état sauvegardé (depuis unité active)
                    const activeStates = getActiveFieldStates();
                    if (activeStates[field.id]) {
                        stateSelect.value = activeStates[field.id];
                    }

                    // --- Dropdown du label avec variantes positive / négative ---
                    // Évite le wrapping vertical du texte sur tablette et permet de choisir
                    // d'un coup la formulation et l'état du champ.
                    const variants = (typeof generateFieldVariants === 'function')
                        ? generateFieldVariants(field.label)
                        : { positive: field.label + ' — en bon état', negative: field.label };

                    const labelSelect = document.createElement('select');
                    labelSelect.id = field.id + '_variant';
                    labelSelect.title = field.label;
                    labelSelect.style.cssText = 'flex:1; min-width:0; padding:6px 10px; border-radius:8px; border:1px solid #cbd5e1; background:white; color:#334155; font-size:0.92rem; line-height:1.4; cursor:pointer; max-width:100%;';

                    const defaultOpt = document.createElement('option');
                    defaultOpt.value = '';
                    defaultOpt.textContent = field.label;
                    labelSelect.appendChild(defaultOpt);

                    const posGroup = document.createElement('optgroup');
                    posGroup.label = '✅ Conforme';
                    const posOpt = document.createElement('option');
                    posOpt.value = 'conforme';
                    posOpt.textContent = variants.positive;
                    posGroup.appendChild(posOpt);
                    labelSelect.appendChild(posGroup);

                    const negGroup = document.createElement('optgroup');
                    negGroup.label = '❌ Défaut';
                    const negOpt = document.createElement('option');
                    negOpt.value = 'defaut';
                    negOpt.textContent = variants.negative;
                    negGroup.appendChild(negOpt);
                    labelSelect.appendChild(negGroup);

                    // Choisir une variante synchronise le state select et applique l'état.
                    labelSelect.addEventListener('change', () => {
                        const v = labelSelect.value;
                        if (v === 'conforme' || v === 'defaut') {
                            stateSelect.value = v;
                            applyState(v);
                        }
                    });

                    topRow.appendChild(stateSelect);
                    topRow.appendChild(labelSelect);
                    itemWrapper.appendChild(topRow);

                    // Input hidden pour compatibilité rapport (checked = défaut)
                    const input = document.createElement('input');
                    input.type = 'checkbox';
                    input.id = field.id;
                    input.style.display = 'none';

                    // Bouton analyser photo
                    const visionRow = document.createElement('div');
                    visionRow.style.cssText = 'margin-top: 8px; display: flex; gap: 8px; align-items: center;';
                    const visionBtn = document.createElement('button');
                    visionBtn.className = 'vision-ai-btn';
                    visionBtn.innerHTML = '📷 Analyser Photo';
                    visionBtn.onclick = (e) => { e.preventDefault(); openPhotoModal(field); };
                    visionRow.appendChild(visionBtn);
                    itemWrapper.appendChild(visionRow);
                    itemWrapper.appendChild(input);

                    // Zone IA (apparaît si défaut)
                    const aiZone = document.createElement('div');
                    aiZone.id = field.id + '_ai';
                    itemWrapper.appendChild(aiZone);

                    // Appliquer couleur selon état sélectionné
                    function applyState(val) {
                        const s = states.find(x => x.value === val) || states[0];
                        itemWrapper.style.borderColor = s.color === '#94a3b8' ? '#e2e8f0' : s.color;
                        itemWrapper.style.background = s.bg;
                        stateSelect.style.borderColor = s.color;
                        stateSelect.style.color = s.color;

                        // Sync checkbox caché pour le rapport
                        input.checked = (val === 'defaut');

                        // Sync le label select : afficher la variante correspondante
                        // si le state est conforme ou defaut, sinon revenir au label par défaut.
                        if (labelSelect) {
                            if (val === 'conforme') labelSelect.value = 'conforme';
                            else if (val === 'defaut') labelSelect.value = 'defaut';
                            else labelSelect.value = '';
                        }

                        // IA uniquement si défaut
                        if (val === 'defaut') {
                            generateAIContext(field, aiZone);
                        } else {
                            aiZone.innerHTML = '';
                        }

                        // Sauvegarder dans l'unité active
                        const activeStates = getActiveFieldStates();
                        activeStates[field.id] = val;
                        saveAppState();
                    }

                    // Appliquer état initial si sauvegardé (depuis unité active)
                    const savedState = getActiveFieldStates()[field.id];
                    if (savedState) {
                        applyState(savedState);
                    }

                    stateSelect.addEventListener('change', () => applyState(stateSelect.value));

                    fieldGroup.appendChild(itemWrapper);

                // --- Multi-Client Names Field ---
                } else if (field.type === 'clients') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    fieldGroup.appendChild(label);

                    const clientsContainer = document.createElement('div');
                    clientsContainer.id = 'clientsContainer';
                    clientsContainer.style.display = 'flex';
                    clientsContainer.style.flexDirection = 'column';
                    clientsContainer.style.gap = '8px';

                    function renderClientInputs() {
                        clientsContainer.innerHTML = '';
                        // Garantir que names existe toujours
                        if (!Array.isArray(inspectionData.clientInfo.names) || inspectionData.clientInfo.names.length === 0) {
                            inspectionData.clientInfo.names = [''];
                        }
                        inspectionData.clientInfo.names.forEach((name, i) => {
                            const row = document.createElement('div');
                            row.style.display = 'flex';
                            row.style.alignItems = 'center';
                            row.style.gap = '8px';

                            const input = document.createElement('input');
                            input.type = 'text';
                            input.value = name;
                            input.placeholder = i === 0 ? 'Nom du client principal...' : 'Nom du co-acheteur / client(e)...';
                            input.style.flex = '1';
                            input.addEventListener('input', () => {
                                inspectionData.clientInfo.names[i] = input.value;
                                propagateClientNames();
                            });
                            row.appendChild(input);

                            // Bouton supprimer (seulement si plus d'un client)
                            if (inspectionData.clientInfo.names.length > 1) {
                                const removeBtn = document.createElement('button');
                                removeBtn.type = 'button';
                                removeBtn.textContent = '✕';
                                removeBtn.title = 'Retirer ce client';
                                removeBtn.style.cssText = 'width:36px;height:36px;border-radius:8px;border:1px solid #e2e8f0;background:#fef2f2;color:#dc2626;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;';
                                removeBtn.addEventListener('mouseenter', () => { removeBtn.style.background = '#fee2e2'; removeBtn.style.borderColor = '#fca5a5'; });
                                removeBtn.addEventListener('mouseleave', () => { removeBtn.style.background = '#fef2f2'; removeBtn.style.borderColor = '#e2e8f0'; });
                                removeBtn.addEventListener('click', () => {
                                    inspectionData.clientInfo.names.splice(i, 1);
                                    propagateClientNames();
                                    renderClientInputs();
                                });
                                row.appendChild(removeBtn);
                            }

                            clientsContainer.appendChild(row);
                        });
                    }

                    renderClientInputs();
                    fieldGroup.appendChild(clientsContainer);

                    // Bouton "Ajouter un(e) client(e)"
                    const addBtn = document.createElement('button');
                    addBtn.type = 'button';
                    addBtn.textContent = '＋ Ajouter un(e) client(e)';
                    addBtn.style.cssText = 'margin-top:8px;padding:10px 16px;border-radius:8px;border:2px dashed #cbd5e1;background:#f8fafc;color:#3b82f6;font-weight:600;font-size:0.9rem;cursor:pointer;transition:all 0.2s;width:100%;';
                    addBtn.addEventListener('mouseenter', () => { addBtn.style.borderColor = '#3b82f6'; addBtn.style.background = '#eef2ff'; });
                    addBtn.addEventListener('mouseleave', () => { addBtn.style.borderColor = '#cbd5e1'; addBtn.style.background = '#f8fafc'; });
                    addBtn.addEventListener('click', () => {
                        inspectionData.clientInfo.names.push('');
                        propagateClientNames();
                        renderClientInputs();
                        // Focus le dernier input ajouté
                        const inputs = clientsContainer.querySelectorAll('input');
                        if (inputs.length > 0) inputs[inputs.length - 1].focus();
                    });
                    fieldGroup.appendChild(addBtn);

                } else if (field.type === 'date') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    const input = document.createElement('input');
                    input.type = 'date';
                    input.id = field.id;
                    input.style.cssText = 'width:100%; padding:12px; border:1px solid #e2e8f0; border-radius:8px; font-size:1rem;';
                    // Restore saved value
                    if (inspectionData[field.id]) input.value = inspectionData[field.id];
                    input.addEventListener('change', () => { inspectionData[field.id] = input.value; saveAppState(); });
                    fieldGroup.appendChild(label);
                    fieldGroup.appendChild(input);

                } else if (field.type === 'number' || field.type === 'text') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    const input = document.createElement('input');
                    input.type = field.type;
                    input.id = field.id;
                    input.placeholder = field.placeholder || '';
                    
                    if (field.id === 'inspector_name') input.value = inspectionData.clientInfo.inspectorName || '';
                    if (field.id === 'prop_address') input.value = inspectionData.clientInfo.address || '';
                    
                    // Persistance du nom inspecteur
                    if (field.id === 'inspector_name') {
                        input.addEventListener('input', () => {
                            inspectionData.clientInfo.inspectorName = input.value;
                            localStorage.setItem('inspectpro_inspector_name', input.value);
                            const coverName = document.getElementById('coverInspectorName');
                            if (coverName) coverName.textContent = input.value || 'À définir';
                        });
                    }
                    
                    // Persistance de l'adresse
                    if (field.id === 'prop_address') {
                        input.addEventListener('input', () => {
                            inspectionData.clientInfo.address = input.value;
                            localStorage.setItem('inspectpro_client_address', input.value);
                            propagateClientNames(); // Met à jour sidebar + cover
                            const coverAddr = document.getElementById('coverClientAddress');
                            if (coverAddr) coverAddr.textContent = input.value || '';
                        });
                    }

                    if (field.id === 'client_email') {
                        input.type = 'email';
                        input.value = inspectionData.clientInfo.email || '';
                        input.addEventListener('input', () => {
                            inspectionData.clientInfo.email = input.value.trim();
                            localStorage.setItem('inspectpro_client_email', input.value.trim());
                            saveAppState();
                        });
                    }

                    // Converter logic for Area
                    if (field.id === 'prop_area') {
                        const hint = document.createElement('span');
                        hint.style.fontSize = "0.85rem";
                        hint.style.color = "#64748b";
                        hint.style.marginLeft = "8px";
                        
                        input.addEventListener('input', (e) => {
                            let m2 = parseFloat(e.target.value);
                            if(!isNaN(m2)){
                                let sqft = Math.round(m2 * 10.7639);
                                hint.textContent = `(${sqft} pi²)`;
                            } else {
                                hint.textContent = '';
                            }
                        });
                        label.appendChild(hint);
                    }
                    
                    // Alerte de vigilance pour l'année de construction (Santé / Matériaux)
                    if (field.id === 'prop_year') {
                        const alertBox = document.createElement('div');
                        alertBox.style.marginTop = "8px";
                        alertBox.style.padding = "10px 12px";
                        alertBox.style.borderRadius = "6px";
                        alertBox.style.fontSize = "0.85rem";
                        alertBox.style.display = "none";
                        alertBox.style.lineHeight = "1.5";
                        
                        input.addEventListener('input', (e) => {
                            const year = parseInt(e.target.value);
                            if(isNaN(year) || e.target.value.length < 4) {
                                alertBox.style.display = "none";
                                return;
                            }
                            
                            let warnings = [];
                            if (year < 1990) {
                                warnings.push("☢️ <strong>Amiante :</strong> Fort risque dans l'isolation (Vermiculite/Zonolite), le plâtre, le stucco ou les tuiles de plancher.");
                            }
                            if (year <= 1980) {
                                warnings.push("☣️ <strong>Plomb :</strong> Possibilité de tuyauterie en plomb ou de peinture au plomb.");
                            }
                            if (year >= 1998 && year <= 2014) {
                                warnings.push("🧱 <strong>Pyrrhotite :</strong> Surveillez de près les fissures en toile d'araignée sur les fondations.");
                            }
                            if (year < 1999) {
                                warnings.push("🪨 <strong>Pyrite :</strong> Soyez attentif aux soulèvements ou fissures étoilées de la dalle de béton (Sous-sol/Garage).");
                            }
                            if (year >= 1989 && year <= 1998) {
                                warnings.push("💧 <strong>Plomberie Poly-B :</strong> Risque élevé de trouver des conduits d'eau gris problématiques.");
                            }
                            
                            if (warnings.length > 0) {
                                alertBox.innerHTML = "<strong style='color:#b91c1c; font-size: 0.9rem;'>VIGILANCE REQUISE (Maison de " + year + ") :</strong><br>" + warnings.join("<br>");
                                alertBox.style.backgroundColor = "#fef2f2";
                                alertBox.style.border = "1px solid #fecaca";
                                alertBox.style.color = "#7f1d1d";
                                alertBox.style.display = "block";
                            } else {
                                alertBox.style.display = "none";
                            }
                        });
                        // Append after the input
                        setTimeout(() => fieldGroup.appendChild(alertBox), 0);
                    }

                    fieldGroup.appendChild(label);
                    fieldGroup.appendChild(input);
                } else if (field.type === 'select') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    const select = document.createElement('select');
                    select.id = field.id;

                    field.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.textContent = opt;
                        select.appendChild(option);
                    });

                    fieldGroup.appendChild(label);
                    fieldGroup.appendChild(select);
                } else if (field.type === 'file') {
                    const label = document.createElement('label');
                    label.textContent = field.label;
                    const input = document.createElement('input');
                    input.type = field.type;
                    
                    const previewContainer = document.createElement('div');
                    previewContainer.style.marginTop = "12px";
                    previewContainer.style.display = "none";
                    
                    const imgPreview = document.createElement('img');
                    imgPreview.style.maxWidth = "100%";
                    imgPreview.style.maxHeight = "300px";
                    imgPreview.style.borderRadius = "8px";
                    imgPreview.style.boxShadow = "var(--shadow)";
                    imgPreview.style.objectFit = "cover";
                    previewContainer.appendChild(imgPreview);

                    input.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        const check = validateFile(file);
                        if (!check.valid) {
                            showToast(check.error, 'error');
                            input.value = '';
                            return;
                        }
                        if (file && file.type.startsWith('image/')) {
                            const url = URL.createObjectURL(file);
                            imgPreview.src = url;
                            imgPreview.alt = field.label;
                            previewContainer.style.display = "block";
                            
                            // Mettre à jour la photo dans la barre latérale si c'est la photo de couverture
                            if (field.id === 'cover_photo') {
                                document.getElementById('sidebarPhotoPreview').src = url;
                                document.getElementById('sidebarPhotoPreview').style.display = "block";
                                document.getElementById('pinnedHeader').style.display = "block";
                                inspectionData.clientInfo.coverPhotoUrl = url;
                            } else if (field.id === 'inspector_signature') {
                                inspectionData.clientInfo.signatureUrl = url;
                            } else if (field.id === 'inspector_seal') {
                                inspectionData.clientInfo.sealUrl = url;
                            }
                        } else {
                            previewContainer.style.display = "none";
                            imgPreview.src = "";
                        }
                    });

                    fieldGroup.appendChild(label);
                    fieldGroup.appendChild(input);
                    fieldGroup.appendChild(previewContainer);
                } else if (field.type === 'info') {
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'info-block';
                    // Seuls les champs marqués safeHTML:true (HTML statique de data.js) sont injectés directement
                    if (field.safeHTML === true) {
                        infoDiv.innerHTML = field.content;
                    } else {
                        infoDiv.textContent = field.content || '';
                    }
                    fieldGroup.appendChild(infoDiv);
                } else if (field.type === 'action') {
                    if (field.id === 'client_sign') {
                        const signBtn = document.createElement('button');
                        signBtn.type = 'button';
                        signBtn.style.cssText = 'width:100%;padding:12px;background:linear-gradient(135deg,#1A56DB,#0d9488);color:white;border:none;border-radius:10px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:8px;';
                        const sigIndicator = document.createElement('span');
                        sigIndicator.id = 'clientSignatureIndicator';
                        sigIndicator.style.cssText = 'display:block;text-align:center;margin-top:6px;font-size:0.82rem;color:#94a3b8;';
                        if (inspectionData.clientInfo.clientSignatureUrl) {
                            signBtn.textContent = '✍️ Modifier la signature';
                            sigIndicator.textContent = 'Signé ✅';
                            sigIndicator.style.color = '#22c55e';
                        } else {
                            signBtn.textContent = '✍️ Faire signer le client';
                            sigIndicator.textContent = '';
                        }
                        signBtn.onclick = () => openClientSignatureModal();
                        fieldGroup.appendChild(signBtn);
                        fieldGroup.appendChild(sigIndicator);
                    } else if (field.id === 'client_remote_sign') {
                        const remoteBtn = document.createElement('button');
                        remoteBtn.type = 'button';
                        remoteBtn.textContent = '📧 Envoyer pour signature à distance';
                        remoteBtn.style.cssText = 'width:100%;padding:11px;background:#334155;color:#cbd5e1;border:none;border-radius:10px;font-size:0.9rem;font-weight:700;cursor:pointer;margin-top:8px;';
                        remoteBtn.onclick = async () => {
                            const clientEmail = inspectionData.clientInfo.email || '';
                            if (!clientEmail) { showToast('Veuillez saisir l\'email du client d\'abord.', 'warning'); return; }
                            remoteBtn.disabled = true;
                            remoteBtn.textContent = '…';
                            try {
                                const html = _buildReportHTML(inspectionData.currentUnitId);
                                const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                                if (typeof GoogleDrive !== 'undefined') {
                                    await GoogleDrive.syncInspection(window.currentProjectId, blob, inspectionData.currentUnitId);
                                }
                                await sendReportByEmail(inspectionData.currentUnitId);
                                remoteBtn.textContent = '✅ Envoyé pour signature';
                            } catch (e) {
                                showToast('Erreur : ' + (e.text || e.message || 'inconnu'), 'error');
                                remoteBtn.disabled = false;
                                remoteBtn.textContent = '📧 Envoyer pour signature à distance';
                            }
                        };
                        fieldGroup.appendChild(remoteBtn);
                    } else {
                    const btn = document.createElement('button');
                    btn.className = 'btn primary';
                    btn.style.width = '100%';
                    btn.style.padding = '16px';
                    btn.style.fontSize = '1.1rem';
                    btn.style.marginTop = '12px';
                    btn.textContent = field.label;
                    btn.addEventListener('click', () => {
                        if (field.id === 'rap_generate') {
                            if (isMultiUnitBuilding() && inspectionData.units.length > 1) showUnitReportSelector();
                            else generateFinalReport();
                        }
                    });
                    fieldGroup.appendChild(btn);

                    if (field.id === 'rap_generate') {
                        const clientBtn = document.createElement('button');
                        clientBtn.type = 'button';
                        clientBtn.className = 'btn secondary';
                        clientBtn.style.cssText = 'width:100%;padding:14px;font-size:1rem;margin-top:8px;';
                        clientBtn.textContent = '📋 Rapport Client';
                        clientBtn.addEventListener('click', () => generateClientReport());
                        fieldGroup.appendChild(clientBtn);
                    }
                    } // end else (default action button)
                }

                div.appendChild(fieldGroup);
            });

            // --- Multi-Photo Gallery for each sub-section (lié à l'unité active) ---
            const activePhotosStore = getActiveSectionPhotos();
            if (!activePhotosStore[sub.id]) {
                activePhotosStore[sub.id] = [];
            }

            const galleryContainer = document.createElement('div');
            galleryContainer.className = 'sub-gallery-container';
            galleryContainer.style.cssText = 'margin-top: 20px; padding: 15px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #f8fafc;';
            
            const galleryTitle = document.createElement('h4');
            const _galleryPhotos = getActiveSectionPhotos()[sub.id] || [];
            const _gallerySizeKB = Math.round(_galleryPhotos.reduce((acc, p) => acc + Math.round((p.url || '').length * 0.75), 0) / 1024);
            galleryTitle.textContent = '📸 Photos additionnelles (' + sub.title + ')' + (_galleryPhotos.length > 0 ? ' — ' + _galleryPhotos.length + ' photo' + (_galleryPhotos.length > 1 ? 's' : '') + ' (~' + _gallerySizeKB + ' Ko)' : '');
            galleryTitle.style.cssText = 'margin-top: 0; margin-bottom: 12px; font-size: 0.95rem; color: #475569;';
            galleryContainer.appendChild(galleryTitle);

            const grid = document.createElement('div');
            grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-bottom: 12px;';
            
            const renderGallery = () => {
                grid.innerHTML = '';
                const photos = getActiveSectionPhotos()[sub.id] || [];
                photos.forEach((photoObj, i) => {
                    // Carte flex column : image (carré) + caption
                    const card = document.createElement('div');
                    card.style.cssText = 'display:flex;flex-direction:column;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;background:#fff;';

                    // Zone image carrée
                    const imgWrap = document.createElement('div');
                    imgWrap.style.cssText = 'position:relative;aspect-ratio:1;overflow:hidden;';

                    const img = document.createElement('img');
                    img.src = _isSafePhotoUrl(photoObj.url) ? photoObj.url : '';
                    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';

                    // Bouton supprimer (haut droite)
                    const delBtn = document.createElement('button');
                    delBtn.type = 'button';
                    delBtn.innerHTML = '✕';
                    delBtn.title = 'Supprimer cette photo';
                    delBtn.style.cssText = 'position:absolute;top:4px;right:4px;background:rgba(220,38,38,0.9);color:white;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
                    delBtn.onclick = () => {
                        const arr = getActiveSectionPhotos()[sub.id];
                        const idx = arr.indexOf(photoObj);
                        if (idx !== -1) arr.splice(idx, 1);
                        saveAppState();
                        renderGallery();
                    };

                    // Bouton annoter (bas gauche)
                    const annotBtn = document.createElement('button');
                    annotBtn.type = 'button';
                    annotBtn.innerHTML = '✏️';
                    annotBtn.title = 'Annoter cette photo';
                    annotBtn.style.cssText = 'position:absolute;bottom:4px;left:4px;background:rgba(30,41,59,0.85);color:white;border:none;border-radius:6px;width:28px;height:28px;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
                    annotBtn.onclick = () => {
                        openAnnotationEditor(photoObj, () => {
                            saveAppState();
                            renderGallery();
                        });
                    };

                    imgWrap.appendChild(img);
                    imgWrap.appendChild(delBtn);
                    imgWrap.appendChild(annotBtn);
                    if (photoObj.originalUrl) {
                        const annotBadge = document.createElement('span');
                        annotBadge.textContent = '✏️';
                        annotBadge.title = 'Photo annotée';
                        annotBadge.style.cssText = 'position:absolute;top:4px;right:4px;background:rgba(26,86,219,0.9);color:white;border-radius:4px;padding:1px 5px;font-size:10px;pointer-events:none;';
                        imgWrap.appendChild(annotBadge);
                    }

                    // Zone légende
                    const captionInput = document.createElement('input');
                    captionInput.type = 'text';
                    captionInput.className = 'photo-caption-input';
                    captionInput.value = photoObj.caption || '';
                    captionInput.placeholder = 'Ajouter une légende...';
                    captionInput.style.cssText = 'width:100%;border:none;border-top:1px solid #e2e8f0;padding:4px 6px;font-size:0.72rem;color:#475569;background:#f8fafc;box-sizing:border-box;';
                    captionInput.onblur = () => {
                        photoObj.caption = captionInput.value.trim();
                        saveAppState();
                    };
                    captionInput.onkeydown = (e) => {
                        if (e.key === 'Enter') captionInput.blur();
                    };

                    card.appendChild(imgWrap);
                    card.appendChild(captionInput);
                    grid.appendChild(card);
                });
            };

            renderGallery();
            
            const uploadBtnWrap = document.createElement('div');
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            fileInput.style.display = 'none';
            
            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = '＋ Ajouter des photos';
            uploadBtn.type = 'button';
            uploadBtn.className = 'btn secondary';
            uploadBtn.style.cssText = 'font-size: 0.85rem; padding: 6px 12px;';
            
            uploadBtn.onclick = () => fileInput.click();
            
            fileInput.onchange = async (e) => {
                const files = Array.from(e.target.files);
                if (files.length === 0) return;
                for (const file of files) {
                    const check = validateFile(file);
                    if (check.valid) {
                        const dataUrl = await compressImage(file);
                        const store = getActiveSectionPhotos();
                        if (!store[sub.id]) store[sub.id] = [];
                        store[sub.id].push({ url: dataUrl, caption: '', originalUrl: null });
                        saveAppState();
                        // Avertissement stockage
                        const _unit = getCurrentUnit();
                        const _sizeBytes = _estimatePhotosSize(_unit);
                        const _sizeMB = (_sizeBytes / 1048576).toFixed(1);
                        if (_sizeBytes > 6 * 1048576) {
                            showToast('❌ Stockage photos critique (~' + _sizeMB + ' Mo). Exportez le fichier .kzo maintenant.', 'error', 6000);
                        } else if (_sizeBytes > 3 * 1048576) {
                            showToast('⚠️ Stockage photos : ~' + _sizeMB + ' Mo. Sauvegardez régulièrement (.kzo).', 'warning', 5000);
                        }

                        // Analyse IA automatique (une seule photo à la fois pour éviter les conflits de panneau)
                        if (files.length === 1 && localStorage.getItem('kzo_auto_ai_photos') !== '0') {
                            const _activeProvider = localStorage.getItem('inspectpro_api_provider') || 'gemini';
                            const _visionProviders = ['anthropic', 'gemini', 'openai'];
                            if (!_visionProviders.includes(_activeProvider)) {
                                showToast('⚠️ ' + _activeProvider.charAt(0).toUpperCase() + _activeProvider.slice(1) + ' ne supporte pas l\'analyse de photos. Configurez une clé Claude, Gemini ou OpenAI dans les paramètres.', 'warning');
                            } else {
                                const base64Only = dataUrl.split(',')[1];
                                AIAgents.analyzePhotoField(base64Only, sub.title)
                                    .then(result => {
                                        if (!result) return;
                                        const currentPhotos = getActiveSectionPhotos()[sub.id] || [];
                                        if (!currentPhotos.some(p => p.url === dataUrl)) return;
                                        showPhotoAnalysis(
                                            sub.id,
                                            sub.title,
                                            base64Only,
                                            result,
                                            (etatSuggere) => {
                                                sub.fields.forEach(f => {
                                                    if (f.type === 'checkbox') {
                                                        inspectionData.fieldStates[f.id] = etatSuggere;
                                                    }
                                                });
                                                // Sauvegarder la description IA dans le commentaire de la sous-section
                                                if (result.description) {
                                                    const activeCom = getActiveComments();
                                                    if (!activeCom[sub.id]) activeCom[sub.id] = {};
                                                    activeCom[sub.id].text = result.description;
                                                    const sevMap = { defaut: 'urgent', surveiller: 'mineur', conforme: 'ok' };
                                                    activeCom[sub.id].severity = sevMap[etatSuggere] || 'ok';
                                                    // Sauvegarder aussi comme légende de la photo
                                                    const photos = getActiveSectionPhotos()[sub.id] || [];
                                                    const lastPhoto = photos[photos.length - 1];
                                                    if (lastPhoto && !lastPhoto.caption) {
                                                        lastPhoto.caption = result.description.substring(0, 200);
                                                    }
                                                }
                                                saveAppState();
                                                renderSection(currentSectionIndex);
                                                showToast('✅ État et description IA sauvegardés dans les commentaires.', 'info');
                                            }
                                        );
                                    })
                                    .catch((e) => {
                                        showToast('Analyse IA indisponible : ' + (e?.message || 'erreur inconnue'), 'warning');
                                    });
                            }
                        }

                    } else {
                        showToast(check.error, 'error');
                    }
                }
                renderGallery();
                // Bouton "Analyser toutes" pour uploads multiples
                if (files.length > 1 && localStorage.getItem('kzo_auto_ai_photos') !== '0') {
                    const _ap = localStorage.getItem('inspectpro_api_provider') || 'gemini';
                    const _vp = ['anthropic', 'gemini', 'openai'];
                    const _existingAnalyzeBtn = galleryContainer.querySelector('[data-analyze-all]');
                    if (_existingAnalyzeBtn) _existingAnalyzeBtn.remove();
                    const analyzeAllBtn = document.createElement('button');
                    analyzeAllBtn.type = 'button';
                    analyzeAllBtn.setAttribute('data-analyze-all', '1');
                    analyzeAllBtn.className = 'btn secondary';
                    analyzeAllBtn.style.cssText = 'font-size:0.82rem;padding:5px 12px;margin-top:8px;display:block;';
                    if (_vp.includes(_ap)) {
                        const _photoCount = (getActiveSectionPhotos()[sub.id] || []).length;
                        analyzeAllBtn.textContent = '🤖 Analyser toutes (' + _photoCount + ')';
                        analyzeAllBtn.onclick = async () => {
                            analyzeAllBtn.disabled = true;
                            try {
                                const photos = getActiveSectionPhotos()[sub.id] || [];
                                for (let i = 0; i < photos.length; i++) {
                                    analyzeAllBtn.textContent = '⏳ Analyse ' + (i + 1) + '/' + photos.length + '...';
                                    try {
                                        const b64 = (photos[i].url || '').split(',')[1];
                                        if (!b64) continue;
                                        const result = await AIAgents.analyzePhotoField(b64, sub.title);
                                        if (result && result.description) {
                                            const activeCom = getActiveComments();
                                            if (!activeCom[sub.id]) activeCom[sub.id] = {};
                                            activeCom[sub.id].text = activeCom[sub.id].text
                                                ? activeCom[sub.id].text + '\n' + result.description
                                                : result.description;
                                            if (!photos[i].caption) photos[i].caption = result.description.substring(0, 200);
                                        }
                                    } catch(e) { /* continuer en cas d'erreur sur une photo */ }
                                }
                                saveAppState();
                                showToast('✅ ' + photos.length + ' photo' + (photos.length > 1 ? 's' : '') + ' analysée' + (photos.length > 1 ? 's' : '') + '.', 'success');
                                analyzeAllBtn.remove();
                                renderGallery();
                            } catch(outerErr) {
                                showToast('Erreur analyse : ' + outerErr.message, 'error');
                                analyzeAllBtn.disabled = false;
                                analyzeAllBtn.textContent = '🤖 Réessayer';
                            }
                        };
                    } else {
                        analyzeAllBtn.textContent = '🤖 Vision non disponible (' + _ap + ')';
                        analyzeAllBtn.style.opacity = '0.5';
                        analyzeAllBtn.disabled = true;
                    }
                    galleryContainer.insertBefore(analyzeAllBtn, uploadBtnWrap);
                }
                if (files.length === 1) {
                    const captionInputs = grid.querySelectorAll('.photo-caption-input');
                    const lastInput = captionInputs.length ? captionInputs[captionInputs.length - 1] : null;
                    if (lastInput) { lastInput.focus(); lastInput.select(); }
                }
                fileInput.value = '';
            };

            uploadBtnWrap.appendChild(uploadBtn);
            uploadBtnWrap.appendChild(fileInput);
            
            galleryContainer.appendChild(grid);
            galleryContainer.appendChild(uploadBtnWrap);
            
            div.appendChild(galleryContainer);

            // --- Champ Commentaire + Sévérité (sous-section) ---
            const subCommentBlock = document.createElement('div');
            subCommentBlock.style.cssText = 'margin-top: 16px; padding: 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;';
            // Construire les options du dropdown de modèles pour cette sous-section.
            const _tpls = (typeof getCommentTemplates === 'function')
                ? getCommentTemplates(section.id, sub.id)
                : { positive: [], negative: [] };
            const _truncate = (s, n = 75) => s.length > n ? s.slice(0, n) + '…' : s;
            const _posOptions = _tpls.positive.map((t, i) =>
                `<option value="p:${i}">${sanitizeHTML(_truncate(t))}</option>`
            ).join('');
            const _negOptions = _tpls.negative.map((t, i) =>
                `<option value="n:${i}">${sanitizeHTML(_truncate(t))}</option>`
            ).join('');

            subCommentBlock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                    <div style="font-weight: 600; font-size: 0.9rem; color: #92400e;">📝 Commentaires — ${sub.title}</div>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                        <select id="modeles_${sub.id}" title="Insérer un modèle de phrase"
                            style="padding:6px 10px; border-radius:18px; border:1px solid #cbd5e1; background:white; color:#475569; font-size:0.78rem; font-weight:600; cursor:pointer; max-width:220px;">
                            <option value="" disabled selected>📋 Modèles…</option>
                            <optgroup label="✅ Conforme">${_posOptions}</optgroup>
                            <optgroup label="❌ Défaut">${_negOptions}</optgroup>
                        </select>
                        <button type="button" id="ia_redige_${sub.id}" style="padding:6px 14px; background:linear-gradient(135deg,#1d4ed8,#7c3aed); color:white; border:none; border-radius:20px; font-size:0.8rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px;">
                            ✨ IA Rédige
                        </button>
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                    <button type="button" class="sev-btn" data-sev="urgent" data-target="comment_sev_${sub.id}"
                        style="padding: 6px 14px; border-radius: 20px; border: 2px solid #ef4444; background: white; color: #ef4444; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                        🔴 Urgent
                    </button>
                    <button type="button" class="sev-btn" data-sev="majeur" data-target="comment_sev_${sub.id}"
                        style="padding: 6px 14px; border-radius: 20px; border: 2px solid #f59e0b; background: white; color: #b45309; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                        🟠 Majeur
                    </button>
                    <button type="button" class="sev-btn" data-sev="mineur" data-target="comment_sev_${sub.id}"
                        style="padding: 6px 14px; border-radius: 20px; border: 2px solid #eab308; background: white; color: #854d0e; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                        🟡 Mineur
                    </button>
                    <button type="button" class="sev-btn" data-sev="ok" data-target="comment_sev_${sub.id}"
                        style="padding: 6px 14px; border-radius: 20px; border: 2px solid #10b981; background: white; color: #065f46; font-weight: 700; font-size: 0.8rem; cursor: pointer;">
                        ✅ Conforme
                    </button>
                    <input type="hidden" id="comment_sev_${sub.id}" value="">
                </div>
                <textarea id="comment_txt_${sub.id}" placeholder="Observations de l'inspecteur — ou cliquez ✨ IA Rédige pour générer automatiquement..."
                    style="width:100%; min-height:80px; padding:10px; border:1px solid #fed7aa; border-radius:6px; font-size:0.9rem; font-family:inherit; resize:vertical; background:white;"></textarea>
            `;
            // Sécurité : assigner le contenu via .value au lieu d'interpoler dans innerHTML
            // (sinon "</textarea><script>..." injecté dans un commentaire casse la balise).
            const _existingComment = (getActiveComments()[sub.id]) ? getActiveComments()[sub.id].text || '' : '';
            const _ta = subCommentBlock.querySelector(`#comment_txt_${sub.id}`);
            if (_ta) _ta.value = _existingComment;
            // Brancher le bouton IA Rédige
            const iaBtn = subCommentBlock.querySelector(`#ia_redige_${sub.id}`);
            if (iaBtn) {
                iaBtn.addEventListener('click', async () => {
                    iaBtn.textContent = '⏳ Génération...';
                    iaBtn.disabled = true;
                    const textarea = subCommentBlock.querySelector(`#comment_txt_${sub.id}`);
                    await generateSubSectionComment(sub, textarea);
                    iaBtn.textContent = '✨ IA Rédige';
                    iaBtn.disabled = false;
                });
            }

            // Brancher le dropdown de modèles : insère la phrase choisie dans la textarea.
            const tplSelect = subCommentBlock.querySelector(`#modeles_${sub.id}`);
            if (tplSelect) {
                tplSelect.addEventListener('change', () => {
                    const val = tplSelect.value;
                    if (!val) return;
                    const [kind, idxStr] = val.split(':');
                    const idx = parseInt(idxStr, 10);
                    const phrase = (kind === 'p' ? _tpls.positive[idx] : _tpls.negative[idx]) || '';
                    if (!phrase) return;
                    const ta = subCommentBlock.querySelector(`#comment_txt_${sub.id}`);
                    if (!ta) return;
                    ta.value = ta.value.trim()
                        ? ta.value.trimEnd() + '\n' + phrase
                        : phrase;
                    ta.dispatchEvent(new Event('input'));
                    tplSelect.selectedIndex = 0; // reset sur "📋 Modèles…"
                    showToast('Modèle inséré — modifiez avant de finaliser le rapport.', 'success');
                });
            }
            div.appendChild(subCommentBlock);

            // Wire severity buttons for sub-section
            subCommentBlock.querySelectorAll('.sev-btn').forEach(btn => {
                const targetId = btn.dataset.target;
                const sevInput = subCommentBlock.querySelector('#' + targetId);
                // Restore saved state (unité active)
                const activeC = getActiveComments();
                if (activeC[sub.id] && activeC[sub.id].severity === btn.dataset.sev) {
                    btn.style.color = 'white';
                    const colors = { urgent: '#ef4444', majeur: '#f59e0b', mineur: '#eab308', ok: '#10b981' };
                    btn.style.background = colors[btn.dataset.sev] || '#64748b';
                    sevInput.value = btn.dataset.sev;
                }
                btn.addEventListener('click', () => {
                    subCommentBlock.querySelectorAll('.sev-btn').forEach(b => {
                        b.style.background = 'white';
                        const colorsReset = { urgent: '#ef4444', majeur: '#b45309', mineur: '#854d0e', ok: '#065f46' };
                        b.style.color = colorsReset[b.dataset.sev] || '#64748b';
                    });
                    const colors = { urgent: '#ef4444', majeur: '#f59e0b', mineur: '#eab308', ok: '#10b981' };
                    btn.style.background = colors[btn.dataset.sev] || '#64748b';
                    btn.style.color = 'white';
                    sevInput.value = btn.dataset.sev;
                    // Sauvegarder dans unité active
                    const activeCom = getActiveComments();
                    if (!activeCom[sub.id]) activeCom[sub.id] = {};
                    activeCom[sub.id].severity = btn.dataset.sev;
                    saveAppState();
                });
            });

            // Save text comment on input (unité active)
            const subTxtArea = subCommentBlock.querySelector('#comment_txt_' + sub.id);
            subTxtArea.addEventListener('input', () => {
                const activeCom = getActiveComments();
                if (!activeCom[sub.id]) activeCom[sub.id] = {};
                activeCom[sub.id].text = subTxtArea.value;
                saveAppState();
            });

            dynamicContent.appendChild(div);
        });

        // --- Champ Commentaire + Sévérité (section principale) ---
        if (!section.isCoverPage) {
            const secCommentBlock = document.createElement('div');
            secCommentBlock.style.cssText = 'margin-top: 8px; margin-bottom: 24px; padding: 18px; background: #eff6ff; border: 2px solid #93c5fd; border-radius: 10px;';
            const secId = 'section_' + index;
            secCommentBlock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
                    <div style="font-weight:700; font-size:1rem; color:#1e40af;">🗂️ Commentaire global — ${section.title}</div>
                    <button type="button" id="ia_synthese_${index}" style="padding:6px 14px; background:linear-gradient(135deg,#059669,#0d9488); color:white; border:none; border-radius:20px; font-size:0.8rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:5px;">
                        ✨ IA Synthèse
                    </button>
                </div>
                <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                    <button type="button" class="sev-btn-sec" data-sev="urgent"
                        style="padding: 8px 18px; border-radius: 20px; border: 2px solid #ef4444; background: white; color: #ef4444; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                        🔴 Urgent
                    </button>
                    <button type="button" class="sev-btn-sec" data-sev="majeur"
                        style="padding: 8px 18px; border-radius: 20px; border: 2px solid #f59e0b; background: white; color: #b45309; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                        🟠 Majeur
                    </button>
                    <button type="button" class="sev-btn-sec" data-sev="mineur"
                        style="padding: 8px 18px; border-radius: 20px; border: 2px solid #eab308; background: white; color: #854d0e; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                        🟡 Mineur
                    </button>
                    <button type="button" class="sev-btn-sec" data-sev="ok"
                        style="padding: 8px 18px; border-radius: 20px; border: 2px solid #10b981; background: white; color: #065f46; font-weight: 700; font-size: 0.85rem; cursor: pointer;">
                        ✅ Conforme
                    </button>
                    <input type="hidden" id="sec_sev_${secId}" value="">
                </div>
                <textarea id="sec_txt_${secId}" placeholder="Résumé global de l'inspecteur pour cette section..."
                    style="width:100%; min-height:90px; padding:12px; border:1px solid #93c5fd; border-radius:6px; font-size:0.95rem; font-family:inherit; resize:vertical; background:white;"></textarea>
            `;
            // Sécurité : assigner via .value plutôt qu'interpoler dans innerHTML.
            const _existingSecComment = (getActiveSectionComments()[secId]) ? getActiveSectionComments()[secId].text || '' : '';
            const _secTa = secCommentBlock.querySelector(`#sec_txt_${secId}`);
            if (_secTa) _secTa.value = _existingSecComment;
            dynamicContent.appendChild(secCommentBlock);

            // Wire section severity buttons (unité active)
            secCommentBlock.querySelectorAll('.sev-btn-sec').forEach(btn => {
                const sevInput = secCommentBlock.querySelector('#sec_sev_' + secId);
                const activeSC = getActiveSectionComments();
                if (activeSC[secId] && activeSC[secId].severity === btn.dataset.sev) {
                    btn.style.color = 'white';
                    const colors = { urgent: '#ef4444', majeur: '#f59e0b', mineur: '#eab308', ok: '#10b981' };
                    btn.style.background = colors[btn.dataset.sev] || '#64748b';
                    sevInput.value = btn.dataset.sev;
                }
                btn.addEventListener('click', () => {
                    secCommentBlock.querySelectorAll('.sev-btn-sec').forEach(b => {
                        b.style.background = 'white';
                        const colorsReset = { urgent: '#ef4444', majeur: '#b45309', mineur: '#854d0e', ok: '#065f46' };
                        b.style.color = colorsReset[b.dataset.sev] || '#64748b';
                    });
                    const colors = { urgent: '#ef4444', majeur: '#f59e0b', mineur: '#eab308', ok: '#10b981' };
                    btn.style.background = colors[btn.dataset.sev] || '#64748b';
                    btn.style.color = 'white';
                    sevInput.value = btn.dataset.sev;
                    const activeSec = getActiveSectionComments();
                    if (!activeSec[secId]) activeSec[secId] = {};
                    activeSec[secId].severity = btn.dataset.sev;
                    saveAppState();
                });
            });

            const secTxtArea = secCommentBlock.querySelector('#sec_txt_' + secId);
            secTxtArea.addEventListener('input', () => {
                const activeSec = getActiveSectionComments();
                if (!activeSec[secId]) activeSec[secId] = {};
                activeSec[secId].text = secTxtArea.value;
                saveAppState();
            });

            // Bouton IA Synthèse
            const iaSyntheseBtn = secCommentBlock.querySelector('#ia_synthese_' + index);
            if (iaSyntheseBtn) {
                iaSyntheseBtn.addEventListener('click', async () => {
                    iaSyntheseBtn.textContent = '⏳ Génération...';
                    iaSyntheseBtn.disabled = true;
                    try {
                        const texte = await AIAgents.generateSectionSynthesis(section, index);
                        showAiPreview(
                            '✨ Synthèse IA — ' + section.title,
                            texte,
                            () => {
                                const activeSec = getActiveSectionComments();
                                if (!activeSec[secId]) activeSec[secId] = {};
                                activeSec[secId].text = texte;
                                saveAppState();
                                const ta = secCommentBlock.querySelector('#sec_txt_' + secId);
                                if (ta) { ta.value = texte; ta.dispatchEvent(new Event('input')); }
                                showToast('Synthèse insérée dans le commentaire de section.', 'success');
                            }
                        );
                    } catch(err) {
                        showToast('Erreur IA : ' + err.message, 'error');
                    } finally {
                        iaSyntheseBtn.textContent = '✨ IA Synthèse';
                        iaSyntheseBtn.disabled = false;
                    }
                });
            }
        }

        // Update nav buttons
        prevBtn.disabled = index === 0;
        if(index === inspectionData.sections.length - 1) {
            nextBtn.textContent = "Générer Rapport (PDF)";
        } else {
            nextBtn.textContent = "Suivant";
        }
    }

    prevBtn.addEventListener('click', () => {
        if(currentSectionIndex > 0) { currentSectionIndex--; renderSection(currentSectionIndex); renderNavigation(); }
    });

    nextBtn.addEventListener('click', () => {
        if(currentSectionIndex < inspectionData.sections.length - 1) { 
            currentSectionIndex++; renderSection(currentSectionIndex); renderNavigation(); 
        } else {
            // Mode multi-unités : demander quelle unité générer
            if (isMultiUnitBuilding() && inspectionData.units.length > 1) {
                showUnitReportSelector();
            } else {
                generateFinalReport();
            }
        }
    });

    // Modal de sélection d'unité pour rapport
    function showUnitReportSelector() {
        const existing = document.getElementById('unitReportSelector');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'unitReportSelector';
        overlay.style.cssText = 'position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;';

        const box = document.createElement('div');
        box.style.cssText = 'background: white; border-radius: 16px; padding: 40px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);';

        box.innerHTML = `
            <h2 style="margin: 0 0 12px; color: #0f172a; font-size: 1.5rem;">📄 Générer un rapport</h2>
            <p style="color: #64748b; margin: 0 0 24px; font-size: 0.95rem;">Sélectionnez l'unité pour laquelle vous voulez générer un rapport. Chaque unité aura son propre rapport complet.</p>
            <div id="unitReportList" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;"></div>
            <button id="cancelUnitReport" style="width: 100%; padding: 12px; background: #e2e8f0; color: #475569; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem;">Annuler</button>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const list = box.querySelector('#unitReportList');
        inspectionData.units.forEach(unit => {
            // Compter défauts dans cette unité
            let urg = 0, maj = 0, surv = 0, conf = 0;
            const fs = unit.fieldStates || {};
            inspectionData.sections.forEach(section => {
                if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport' || section.id === 's_preview') return;
                section.subSections.forEach(sub => {
                    sub.fields.forEach(f => {
                        if (f.type !== 'checkbox') return;
                        const s = fs[f.id];
                        if (s === 'defaut') { const sev = AIAgents.determineSeverity(f.label); if (sev==='URGENT') urg++; else maj++; }
                        else if (s === 'surveiller') surv++;
                        else if (s === 'conforme') conf++;
                    });
                });
            });

            const btn = document.createElement('button');
            btn.style.cssText = 'width: 100%; padding: 16px; background: white; border: 2px solid #e2e8f0; border-radius: 10px; cursor: pointer; text-align: left; transition: all 0.2s;';
            btn.onmouseenter = () => { btn.style.borderColor = '#1A56DB'; btn.style.background = '#eff6ff'; };
            btn.onmouseleave = () => { btn.style.borderColor = '#e2e8f0'; btn.style.background = 'white'; };
            btn.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 700; color: #0f172a; font-size: 1.05rem;">🏠 ${sanitizeHTML(unit.name)}</div>
                        <div style="font-size: 0.82rem; color: #64748b; margin-top: 4px;">
                            ${urg > 0 ? `<span style="color:#dc2626;">🔴 ${urg} urgent${urg>1?'s':''}</span>` : ''}
                            ${maj > 0 ? ` <span style="color:#d97706;">🟠 ${maj} majeur${maj>1?'s':''}</span>` : ''}
                            ${surv > 0 ? ` <span style="color:#f59e0b;">⚠️ ${surv} à surveiller</span>` : ''}
                            ${conf > 0 ? ` <span style="color:#059669;">✅ ${conf} conforme${conf>1?'s':''}</span>` : ''}
                            ${(urg+maj+surv+conf)===0 ? '<em style="color:#94a3b8;">Aucune inspection saisie</em>' : ''}
                        </div>
                    </div>
                    <div style="color: #1A56DB; font-size: 1.5rem;">→</div>
                </div>
            `;
            btn.onclick = () => {
                overlay.remove();
                generateFinalReport(unit.id);
            };
            list.appendChild(btn);
        });

        box.querySelector('#cancelUnitReport').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    }

    // --- 3. Intelligence Artificielle ---
    function generateAIContext(field, container) {
        if (container.querySelector('.ai-box')) return;

        const aiBox = document.createElement('div');
        aiBox.className = 'ai-box';
        aiBox.innerHTML = `<em>IA réfléchit...</em>`;
        container.appendChild(aiBox);

        setTimeout(() => {
            const severity = AIAgents.determineSeverity(field.label);
            const narrative = AIAgents.analyzeCheckbox(field.label);
            const compliance = AIAgents.checkCompliance(field.label);
            const reco = AIAgents.getRecommendation(field.label);
            const semColorClass = severity === 'URGENT' ? 'urgent' : severity === 'MAJEUR' ? 'major' : 'minor';

            let html = `
                <span class="ai-badge ${semColorClass}">${severity}</span>
                <p style="margin-top:8px">${narrative}</p>
                <div style="margin-top:8px; font-weight:600; color:#3b82f6;">💡 ${reco}</div>
            `;
            if (compliance.length > 0) {
                html += `<div style="margin-top:8px; padding:8px; background:#fee2e2; color:#b91c1c; border-radius:4px; font-size:0.85rem;">
                    <strong>⚠️ Alerte Conformité :</strong> ${compliance.join('<br>')}
                </div>`;
            }
            aiBox.innerHTML = html;

            // Bouton — insérer la recommandation dans le champ commentaire de la sous-section
            const insertBtn = document.createElement('button');
            insertBtn.type = 'button';
            insertBtn.textContent = '📋 Insérer dans commentaire';
            insertBtn.style.cssText = 'margin-top:10px; padding:6px 14px; background:#1d4ed8; color:white; border:none; border-radius:6px; font-size:0.8rem; cursor:pointer; font-weight:600;';
            insertBtn.onclick = () => {
                const subSection = container.closest('.sub-section');
                const textarea = subSection ? subSection.querySelector('textarea[id^="comment_txt_"]') : null;
                const line = `[${severity}] ${field.label} — ${reco}`;
                if (textarea) {
                    textarea.value = textarea.value.trim() ? textarea.value.trimEnd() + '\n' + line : line;
                    textarea.dispatchEvent(new Event('input'));
                    showToast('✅ Commentaire enregistré — voir zone jaune ci-dessous.', 'success');
                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    textarea.style.transition = 'background 0.4s';
                    textarea.style.background = '#fef9c3';
                    textarea.style.border = '2px solid #f59e0b';
                    setTimeout(() => { textarea.style.background = ''; textarea.style.border = ''; }, 2000);
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(line);
                    showToast('Copié dans le presse-papier.', 'info');
                }
            };
            aiBox.appendChild(insertBtn);
        }, 600);
    }

    // Génère automatiquement le texte d'observation d'une sous-section via IA réelle
    async function generateSubSectionComment(sub, textarea) {
        const defects = sub.fields
            .filter(f => f.type === 'checkbox' && getActiveFieldStates()[f.id] === 'defaut')
            .map(f => f.label);
        const toWatch = sub.fields
            .filter(f => f.type === 'checkbox' && getActiveFieldStates()[f.id] === 'surveiller')
            .map(f => f.label);

        if (defects.length === 0 && toWatch.length === 0) {
            showToast('Aucun défaut ou élément à surveiller dans cette sous-section.', 'warning');
            return;
        }

        const parts = [];
        if (defects.length > 0) parts.push(`Défauts observés : ${defects.join(' / ')}`);
        if (toWatch.length > 0) parts.push(`Éléments à surveiller : ${toWatch.join(' / ')}`);

        const question = `Tu rédiges un rapport d'inspection professionnel selon la norme REIBH 2024 et BNQ 3009-500 au Québec. Section inspectée : "${sub.title}". ${parts.join('. ')}. Rédige 2 à 4 phrases d'observation professionnelle : décris le défaut, le risque potentiel et la recommandation (spécialiste à consulter). Langue : français professionnel. Termine par : "Cette observation est basée sur une inspection visuelle non invasive."`;

        const raw = await AIAgents.askAssistant(question);
        // askAssistant échappe déjà le HTML brut puis ré-injecte <strong>/<br>.
        // On enlève ces tags whitelistés et on décode les entités pour obtenir du texte propre.
        // Convertir le HTML formaté en texte brut : <br> → \n, strip tags, decode entities
        const stripped = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
        const decoder = document.createElement('textarea');
        decoder.innerHTML = stripped;
        textarea.value = decoder.value.trim();
        textarea.dispatchEvent(new Event('input'));
        showToast('Texte généré par IA — vérifiez avant de finaliser le rapport.', 'info');
    }

    // --- 4. Photo Vision Modal & Drawing ---
    const modal = document.getElementById('photoModal');
    const photoArea = document.getElementById('photoArea');
    const photoText = document.getElementById('photoText');
    const simulatedImg = document.getElementById('simulatedImg');
    const drawCanvas = document.getElementById('drawCanvas');
    const drawToolbar = document.getElementById('drawToolbar');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const aiResultArea = document.getElementById('aiResultArea');
    const applyAiBtn = document.getElementById('applyAiBtn');
    let currentVisionField = null;

    // Drawing context
    let ctx = null;
    let isDrawing = false;
    let currentTool = 'circle'; 
    let startX = 0, startY = 0;
    let snapshot = null; // Save state for shape preview

    function initCanvas() {
        // Obtenir la taille réelle affichée
        const rect = photoArea.getBoundingClientRect();
        drawCanvas.width = rect.width;
        drawCanvas.height = rect.height;
        ctx = drawCanvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function openPhotoModal(field) {
        currentVisionField = field;
        modal.classList.add('open');
        
        // Reset states
        photoArea.classList.remove('taken');
        photoText.style.display = 'block';
        photoText.innerHTML = 'Appuyez pour prendre une photo du défaut';
        simulatedImg.style.display = 'none';
        drawCanvas.style.display = 'none';
        drawToolbar.style.display = 'none';
        
        aiResultArea.style.display = 'none';
        applyAiBtn.style.display = 'none';
        takePhotoBtn.style.display = 'block';
    }

    document.getElementById('closeModal').addEventListener('click', () => { modal.classList.remove('open'); });

    takePhotoBtn.addEventListener('click', async () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.onchange = async (e) => {
            document.body.removeChild(fileInput); // évite la fuite mémoire
            const file = e.target.files[0];
            if (!file) return;

            const check = validateFile(file);
            if (!check.valid) { showToast(check.error, 'error'); return; }

            photoArea.classList.add('taken');
            photoText.innerHTML = '📸 Photo chargée...<br><br>⏳ Analyse par Claude Vision...';
            takePhotoBtn.style.display = 'none';

            // Afficher la photo sélectionnée
            const url = URL.createObjectURL(file);
            simulatedImg.src = url;
            simulatedImg.alt = 'Photo du défaut';
            photoText.style.display = 'none';
            simulatedImg.style.display = 'block';
            drawCanvas.style.display = 'block';
            drawToolbar.style.display = 'flex';
            initCanvas();

            // Convertir en base64 pour l'API
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const base64 = ev.target.result.split(',')[1];
                const mimeType = file.type;

                // Appel API Claude Vision
                const apiKey = localStorage.getItem('inspectpro_api_key');
                const provider = localStorage.getItem('inspectpro_api_provider') || 'anthropic';

                if (!apiKey) {
                    document.getElementById('analysisText').textContent = "⚠️ Aucune clé API configurée. Cliquez sur ⚙️ dans l'Assistant IA pour ajouter votre clé.";
                    document.getElementById('recommendationText').textContent = "Configurez votre clé API (Groq, Claude, Gemini ou OpenAI) pour activer l'analyse de photos.";
                    aiResultArea.style.display = 'block';
                    return;
                }

                try {
                    let analysisText = '';
                    let recoText = '';
                    const fieldLabel = currentVisionField ? currentVisionField.label : 'élément inspecté';
                    const prompt = `Tu es un inspecteur en bâtiment certifié RBQ au Québec. Analyse cette photo dans le contexte suivant : "${fieldLabel}". 
Décris en 2-3 phrases ce que tu observes visuellement (matériaux, état, signes visibles de défauts ou de conformité).
Puis donne une recommandation professionnelle concise selon la norme BNQ 3009-500.
Réponds en français.`;

                    if (provider === 'anthropic') {
                        const resp = await fetch('https://api.anthropic.com/v1/messages', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': apiKey,
                                'anthropic-version': '2023-06-01',
                                'anthropic-dangerous-direct-browser-access': 'true'
                            },
                            body: JSON.stringify({
                                model: 'claude-haiku-4-5-20251001',
                                max_tokens: 500,
                                messages: [{
                                    role: 'user',
                                    content: [
                                        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
                                        { type: 'text', text: prompt }
                                    ]
                                }]
                            })
                        });
                        const data = await resp.json();
                        const full = data.content?.[0]?.text || 'Analyse non disponible.';
                        const parts = full.split(/recommandation|Recommandation/i);
                        analysisText = parts[0].trim();
                        recoText = parts[1] ? parts[1].replace(/^[\s:]+/, '') : AIAgents.getRecommendation(fieldLabel);

                    } else if (provider === 'gemini') {
                        const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
                        const resp = await fetch(url2, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [
                                    { inline_data: { mime_type: mimeType, data: base64 } },
                                    { text: prompt }
                                ]}]
                            })
                        });
                        const data = await resp.json();
                        const full = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analyse non disponible.';
                        const parts = full.split(/recommandation|Recommandation/i);
                        analysisText = parts[0].trim();
                        recoText = parts[1] ? parts[1].replace(/^[\s:]+/, '') : AIAgents.getRecommendation(fieldLabel);

                    } else if (provider === 'openai') {
                        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                            body: JSON.stringify({
                                model: 'gpt-4o',
                                max_tokens: 500,
                                messages: [{ role: 'user', content: [
                                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
                                    { type: 'text', text: prompt }
                                ]}]
                            })
                        });
                        const data = await resp.json();
                        const full = data.choices?.[0]?.message?.content || 'Analyse non disponible.';
                        const parts = full.split(/recommandation|Recommandation/i);
                        analysisText = parts[0].trim();
                        recoText = parts[1] ? parts[1].replace(/^[\s:]+/, '') : AIAgents.getRecommendation(fieldLabel);

                    } else if (provider === 'groq') {
                        // Groq vision — modèle Llama 4 Scout (supporte les images)
                        const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                            body: JSON.stringify({
                                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                                max_tokens: 500,
                                messages: [{ role: 'user', content: [
                                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
                                    { type: 'text', text: prompt }
                                ]}]
                            })
                        });
                        const data = await resp.json();
                        const full = data.choices?.[0]?.message?.content || 'Analyse non disponible.';
                        const parts = full.split(/recommandation|Recommandation/i);
                        analysisText = parts[0].trim();
                        recoText = parts[1] ? parts[1].replace(/^[\s:]+/, '') : AIAgents.getRecommendation(fieldLabel);
                    }

                    document.getElementById('analysisText').textContent = analysisText;
                    document.getElementById('recommendationText').textContent = recoText;
                    aiResultArea.style.display = 'block';
                    applyAiBtn.style.display = 'block';

                } catch (err) {
                    document.getElementById('analysisText').textContent = '❌ Erreur lors de l\'analyse : ' + err.message;
                    document.getElementById('recommendationText').textContent = 'Vérifiez votre connexion et votre clé API.';
                    aiResultArea.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
            // fileInput already removed in onchange handler above
        };

        fileInput.click();
    });

    // --- Drawing Logic ---
    const drawBtns = document.querySelectorAll('.draw-btn');
    drawBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            drawBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
        });
    });

    document.getElementById('clearDrawBtn').addEventListener('click', () => {
        if(ctx) ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });

    function getMousePos(e) {
        const rect = drawCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    const startDraw = (e) => {
        isDrawing = true;
        const pos = getMousePos(e);
        startX = pos.x;
        startY = pos.y;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.strokeStyle = document.getElementById('drawColor').value;
        ctx.lineWidth = 4;
        snapshot = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height);
        e.preventDefault(); // prevent scrolling on touch
    };

    const drawing = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        ctx.putImageData(snapshot, 0, 0); // Restore to preview current shape

        if (currentTool === 'freehand') {
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            snapshot = ctx.getImageData(0, 0, drawCanvas.width, drawCanvas.height); // save continuously
        } else if (currentTool === 'circle') {
            ctx.beginPath();
            const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (currentTool === 'arrow') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            // Arrowhead
            const angle = Math.atan2(pos.y - startY, pos.x - startX);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x - 15 * Math.cos(angle - Math.PI / 6), pos.y - 15 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(pos.x - 15 * Math.cos(angle + Math.PI / 6), pos.y - 15 * Math.sin(angle + Math.PI / 6));
            ctx.lineTo(pos.x, pos.y);
            ctx.fillStyle = ctx.strokeStyle;
            ctx.fill();
        }
        e.preventDefault();
    };

    const stopDraw = () => { isDrawing = false; };

    drawCanvas.addEventListener('mousedown', startDraw);
    drawCanvas.addEventListener('mousemove', drawing);
    drawCanvas.addEventListener('mouseup', stopDraw);
    drawCanvas.addEventListener('mouseout', stopDraw);
    
    // Support tactil pour iPad/Tablette
    drawCanvas.addEventListener('touchstart', startDraw, {passive: false});
    drawCanvas.addEventListener('touchmove', drawing, {passive: false});
    drawCanvas.addEventListener('touchend', stopDraw);

    applyAiBtn.addEventListener('click', () => {
        if (currentVisionField) {
            const activeStates = getActiveFieldStates();
            activeStates[currentVisionField.id] = 'defaut';

            // Sauvegarder le texte d'analyse dans le commentaire de la sous-section
            const analysisTextEl = document.getElementById('analysisText');
            const recoTextEl     = document.getElementById('recommendationText');
            const analysisContent = analysisTextEl ? analysisTextEl.textContent.trim() : '';
            const recoContent     = recoTextEl ? recoTextEl.textContent.trim() : '';
            const fullComment = [analysisContent, recoContent ? 'Recommandation : ' + recoContent : '']
                .filter(Boolean).join('\n\n');

            if (fullComment) {
                let targetSubId = null;
                for (const section of inspectionData.sections) {
                    for (const sub of (section.subSections || [])) {
                        if ((sub.fields || []).some(f => f.id === currentVisionField.id)) {
                            targetSubId = sub.id;
                            break;
                        }
                    }
                    if (targetSubId) break;
                }
                if (targetSubId) {
                    const activeCom = getActiveComments();
                    if (!activeCom[targetSubId]) activeCom[targetSubId] = {};
                    activeCom[targetSubId].text     = fullComment;
                    activeCom[targetSubId].severity = 'urgent';
                }
            }

            saveAppState();
            renderSection(currentSectionIndex);
            showToast('✅ Analyse IA sauvegardée dans les commentaires de la sous-section.', 'success');
        }
        modal.classList.remove('open');
    });

    // Boutons "Sauvegarder" et "Quitter" — top-bar
    const saveTopBtn = document.getElementById('saveBtn');
    if (saveTopBtn) saveTopBtn.addEventListener('click', saveOnly);
    const quitTopBtn = document.getElementById('quitBtn');
    if (quitTopBtn) quitTopBtn.addEventListener('click', () => window.location.href = 'index.html');

    // Bouton "Exporter .kzo" — top-bar (Save / Save As)
    const exportKzoBtn   = document.getElementById('exportKzoBtn');
    const exportKzoAsBtn = document.getElementById('exportKzoAsBtn');

    async function _doKzoExport(forcePickNew) {
        if (!window.currentProjectId || !window.KZOStorage) return;
        exportKzoBtn.textContent = '⏳';
        exportKzoBtn.disabled = true;
        if (exportKzoAsBtn) exportKzoAsBtn.disabled = true;
        try {
            const snapshot = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId,
                rapportNarratifIA: inspectionData.rapportNarratifIA || ''
            };
            await KZOStorage.saveProject(window.currentProjectId, snapshot);
            const blob = await KZOStorage.exportKZO(window.currentProjectId);
            const clientName = (inspectionData.clientInfo.names || []).filter(Boolean).join('_') || 'inspection';
            const filename = 'KZO-' + clientName.replace(/[^a-zA-Z0-9]/g, '_') + '-' + new Date().toISOString().slice(0, 10) + '.kzo';

            if (window.showSaveFilePicker && (forcePickNew || !_kzoFileHandle)) {
                try {
                    _kzoFileHandle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{ description: 'KZO Inspection', accept: { 'application/octet-stream': ['.kzo'] } }]
                    });
                } catch (pickErr) {
                    if (pickErr.name === 'AbortError') return; // annulé par l'utilisateur
                    throw pickErr;
                }
            }

            if (_kzoFileHandle) {
                const writable = await _kzoFileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                const savedName = _kzoFileHandle.name || filename;
                exportKzoBtn.textContent = '💾 .kzo';
                exportKzoBtn.title = 'Enregistrer — ' + savedName;
                if (exportKzoAsBtn) exportKzoAsBtn.classList.remove('tb-hidden');
                showToast('💾 Enregistré : ' + savedName, 'success');
                _markClean();
            } else {
                // Fallback navigateur sans File System Access API
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename; a.click();
                URL.revokeObjectURL(url);
                showToast('✅ Fichier .kzo exporté.', 'success');
                _markClean();
            }
        } catch (e) {
            showToast('Erreur export : ' + e.message, 'error');
        } finally {
            exportKzoBtn.disabled = false;
            if (exportKzoAsBtn) exportKzoAsBtn.disabled = false;
        }
    }

    if (exportKzoBtn) {
        exportKzoBtn.addEventListener('click', () => _doKzoExport(false));
    }
    if (exportKzoAsBtn) {
        exportKzoAsBtn.addEventListener('click', () => _doKzoExport(true));
    }

    // Rendre le bouton sidebar
    renderSaveQuitSidebar();

    // Avertir si l'utilisateur ferme l'onglet avec des modifications non sauvegardées
    window.addEventListener('beforeunload', (e) => {
        if (_isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // --- 5. Assistant Chatbot ---
    const assistantBtn = document.getElementById('assistantBtn');
    const closeAssistant = document.getElementById('closeAssistant');
    const expandAssistantBtn = document.getElementById('expandAssistantBtn');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatHistory = document.getElementById('chatHistory');

    // UI Configuration API
    const aiSettingsBtn = document.getElementById('aiSettingsBtn');
    const aiConfigPanel = document.getElementById('aiConfigPanel');
    const geminiApiKey = document.getElementById('geminiApiKey');
    const apiProvider = document.getElementById('apiProvider');
    const saveApiBtn = document.getElementById('saveApiBtn');

    if (aiSettingsBtn) {
        aiSettingsBtn.addEventListener('click', () => {
            aiConfigPanel.style.display = aiConfigPanel.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (saveApiBtn) {
        const savedKey = localStorage.getItem('inspectpro_api_key');
        const savedProvider = localStorage.getItem('inspectpro_api_provider');
        if (savedKey) geminiApiKey.value = savedKey;
        if (savedProvider && apiProvider) apiProvider.value = savedProvider;
        
        saveApiBtn.addEventListener('click', () => {
            const key = geminiApiKey.value.trim();
            const provider = apiProvider ? apiProvider.value : 'gemini';
            if (key) {
                localStorage.setItem('inspectpro_api_key', key);
                localStorage.setItem('inspectpro_api_provider', provider);
                aiConfigPanel.style.display = 'none';
                
                // Add system message
                const sysMsg = document.createElement('div');
                sysMsg.className = 'message ai';
                sysMsg.style.backgroundColor = '#064e3b';
                sysMsg.style.color = '#a7f3d0';
                
                let providerName = provider === 'openai' ? 'ChatGPT (OpenAI)' : provider === 'anthropic' ? 'Claude (Anthropic)' : provider === 'groq' ? 'Groq (Llama 3.3)' : 'Gemini (Google)';
                sysMsg.textContent = `Système: Clé enregistrée pour ${providerName}. Je suis connecté au réseau et prêt à vous aider.`;
                chatHistory.appendChild(sysMsg);
                chatHistory.scrollTop = chatHistory.scrollHeight;
            } else {
                localStorage.removeItem('inspectpro_api_key');
                localStorage.removeItem('inspectpro_api_provider');
            }
        });

        // Bouton Effacer la clé
        const clearApiBtn = document.getElementById('clearApiBtn');
        if (clearApiBtn) {
            clearApiBtn.addEventListener('click', () => {
                localStorage.removeItem('inspectpro_api_key');
                localStorage.removeItem('inspectpro_api_provider');
                geminiApiKey.value = '';
                const sysMsg = document.createElement('div');
                sysMsg.className = 'message ai';
                sysMsg.style.backgroundColor = '#7f1d1d';
                sysMsg.style.color = '#fecaca';
                sysMsg.textContent = 'Clé API effacée. Je suis en mode démo hors-ligne.';
                chatHistory.appendChild(sysMsg);
                chatHistory.scrollTop = chatHistory.scrollHeight;
                aiConfigPanel.style.display = 'none';
            });
        }
    }

    // Toggle auto-analyse IA à l'upload
    const autoAiToggle = document.getElementById('autoAiPhotosToggle');
    if (autoAiToggle) {
        autoAiToggle.checked = localStorage.getItem('kzo_auto_ai_photos') !== '0';
        autoAiToggle.addEventListener('change', () => {
            localStorage.setItem('kzo_auto_ai_photos', autoAiToggle.checked ? '1' : '0');
        });
    }

    // --- Mobile Menu Toggle (Bug fix: handler was missing) ---
    const menuToggle = document.getElementById('menuToggle');
    const navSidebar = document.getElementById('sidebar');
    if (menuToggle && navSidebar) {
        menuToggle.addEventListener('click', () => navSidebar.classList.toggle('open'));
    }

    const assistantSidebarEl = document.getElementById('assistantSidebar');
    assistantBtn.addEventListener('click', () => assistantSidebarEl.classList.toggle('open'));
    closeAssistant.addEventListener('click', () => {
        assistantSidebarEl.classList.remove('open');
        assistantSidebarEl.classList.remove('expanded');
    });
    if (expandAssistantBtn) {
        expandAssistantBtn.addEventListener('click', () => assistantSidebarEl.classList.toggle('expanded'));
    }

    async function sendChatMessage() {
        const text = chatInput.value.trim();
        if(!text) return;

        // User message
        const uMsg = document.createElement('div');
        uMsg.className = 'message user';
        uMsg.textContent = text;
        chatHistory.appendChild(uMsg);
        chatInput.value = '';

        // IA Typing
        const aiMsg = document.createElement('div');
        aiMsg.className = 'message ai';
        aiMsg.innerHTML = '<em>Recherche dans les normes...</em>';
        chatHistory.appendChild(aiMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Get Answer
        const answer = await AIAgents.askAssistant(text);
        aiMsg.innerHTML = answer;
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    sendChatBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') sendChatMessage(); });

    // --- Helpers Rapport PDF enrichi ---

    // Table d'âge numérique → EQUIPMENT_LIFESPAN key
    const AGE_TO_LIFESPAN = {
        'ce_age': { key: 'chauffe-eau', specialist: 'Plombier maître' },
        'c_age':  { key: 'fournaise',   specialist: 'Technicien CVAC certifié' }
    };

    // Table d'âge sélection toiture → durée résiduelle
    const TO_AGE_MAP = {
        'Neuf / Récent (0-5 ans)':              { badge: '15-20 ans restants', badgeColor: '#059669' },
        'Bon état (5-10 ans)':                  { badge: '10-15 ans restants', badgeColor: '#059669' },
        'Milieu de vie (10-15 ans)':            { badge: '5-10 ans restants',  badgeColor: '#059669' },
        'Fin de vie approchant (15-20 ans)':    { badge: '1-5 ans restants — À planifier', badgeColor: '#d97706' },
        'Remplacement urgent (20 ans et +)':    { badge: 'Remplacement recommandé', badgeColor: '#dc2626' }
    };

    // Construit la liste numérotée de tous les défauts/surveiller, triée URGENT→MAJEUR→SURVEILLER
    function _buildNumberedDefects(unitFieldStates, sections) {
        const defects = [];
        sections.forEach(section => {
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport' || section.id === 's_preview') return;
            (section.subSections || []).forEach(sub => {
                (sub.fields || []).forEach(field => {
                    if (field.type !== 'checkbox') return;
                    const state = unitFieldStates[field.id];
                    if (state !== 'defaut' && state !== 'surveiller') return;
                    const severity = state === 'defaut'
                        ? AIAgents.determineSeverity(field.label)
                        : 'SURVEILLER';
                    defects.push({
                        sectionTitle: section.title,
                        label: field.label,
                        fieldId: field.id,
                        state,
                        severity,
                        specialist: AIAgents.getSpecialist(field.label)
                    });
                });
            });
        });
        const order = { URGENT: 0, MAJEUR: 1, SURVEILLER: 2 };
        defects.sort((a, b) => (order[a.severity] || 2) - (order[b.severity] || 2));
        return defects.map((d, i) => Object.assign({}, d, { num: i + 1 }));
    }

    // Construit la liste des équipements avec durée de vie résiduelle
    function _buildLifespanItems() {
        const items = [];

        // Équipements à âge numérique (chauffe-eau, fournaise)
        Object.entries(AGE_TO_LIFESPAN).forEach(([fieldId, mapping]) => {
            const el = document.getElementById(fieldId);
            const age = el ? parseInt(el.value, 10) : NaN;
            if (isNaN(age) || age <= 0) return;
            const eq = typeof EQUIPMENT_LIFESPAN !== 'undefined' ? EQUIPMENT_LIFESPAN[mapping.key] : null;
            if (!eq) return;
            const residMin = Math.max(0, eq.min - age);
            const residMax = Math.max(0, eq.max - age);
            let badge, badgeColor;
            if (eq.max - age <= 0) {
                badge = 'Fin de vie — Remplacement recommandé';
                badgeColor = '#dc2626';
            } else if (eq.max - age <= 2) {
                badge = residMin + '-' + residMax + ' ans restants — Remplacement imminent';
                badgeColor = '#dc2626';
            } else if (eq.max - age <= 5) {
                badge = residMin + '-' + residMax + ' ans restants — À planifier';
                badgeColor = '#d97706';
            } else {
                badge = residMin + '-' + residMax + ' ans restants — État satisfaisant';
                badgeColor = '#059669';
            }
            items.push({ label: eq.label, age, badge, badgeColor, specialist: mapping.specialist });
        });

        // Toiture (âge sélection)
        const toAgeEl = document.getElementById('to_age');
        if (toAgeEl && toAgeEl.value && TO_AGE_MAP[toAgeEl.value]) {
            const m = TO_AGE_MAP[toAgeEl.value];
            items.push({
                label: 'Bardeaux d\'asphalte / Couverture',
                age: null,
                badge: m.badge,
                badgeColor: m.badgeColor,
                specialist: 'Couvreur certifié'
            });
        }

        return items;
    }

    // --- 6. Génération du Rapport Final ---

    function _buildReportHTML(unitId) {
        // Déterminer quelle unité utiliser
        const targetUnit = unitId
            ? inspectionData.units.find(u => u.id === unitId)
            : getCurrentUnit();
        if (!targetUnit) return '<p>Unité introuvable.</p>';

        const clientName = sanitizeHTML(inspectionData.clientInfo.name) || '';
        const address = sanitizeHTML(inspectionData.clientInfo.address) || '';

        const unitFieldStates = targetUnit.fieldStates || {};
        const unitComments = targetUnit.comments || {};
        const unitSectionComments = targetUnit.sectionComments || {};
        const unitSectionPhotos = targetUnit.sectionPhotos || {};
        const unitName = targetUnit.name || '';
        const isMultiMode = isMultiUnitBuilding() && inspectionData.units.length > 1;

        const prixElement = document.getElementById('prix_inspection');
        const prix = prixElement ? prixElement.value : "500";
        const normeElement = document.getElementById('norme_pratique');
        const norme = (normeElement && normeElement.value) ? normeElement.value : "BNQ 3009-500 (RBQ)";
        const signatureUrl = inspectionData.clientInfo.signatureUrl || null;
        const sealUrl = inspectionData.clientInfo.sealUrl || null;
        const inspectorName = inspectionData.clientInfo.inspectorName || (typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.inspectorName : 'Jean Eveillard Cazeau');

        // Utiliser la date de l'inspection saisie, pas aujourd'hui
        const dateInspection = inspectionData['inspection_date']
            ? new Date(inspectionData['inspection_date']).toLocaleDateString('fr-CA', {year:'numeric', month:'long', day:'numeric'})
            : new Date().toLocaleDateString('fr-CA', {year:'numeric', month:'long', day:'numeric'});

        // Sécurité XSS : tous les champs libres tapés par l'inspecteur ou le client
        // sont sanitisés avant d'être interpolés dans le HTML du rapport.
        const meteo = sanitizeHTML(document.getElementById('prop_weather')?.value || '');
        const temperature = sanitizeHTML(document.getElementById('prop_temp')?.value || '');
        const superficie = sanitizeHTML(document.getElementById('prop_area')?.value || '');
        const annee = sanitizeHTML(document.getElementById('prop_year')?.value || '');
        const typeBatiment = sanitizeHTML(document.getElementById('prop_type')?.value || '');
        const typeGarage = sanitizeHTML(document.getElementById('prop_garage')?.value || '');
        const safeNorme = sanitizeHTML(norme);
        const safeUnitName = sanitizeHTML(unitName);
        const safeInspectorName = sanitizeHTML(inspectorName);
        const safeDossierId = sanitizeHTML(String(inspectionData.id || ''));

        // Compter défauts et à surveiller DANS L'UNITÉ
        let totalUrgents = 0, totalMajeurs = 0, totalSurveiller = 0, totalConformes = 0;
        inspectionData.sections.forEach(section => {
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport' || section.id === 's_preview') return;
            section.subSections.forEach(sub => {
                sub.fields.forEach(field => {
                    if (field.type !== 'checkbox') return;
                    const state = unitFieldStates[field.id];
                    if (state === 'defaut') {
                        const sev = AIAgents.determineSeverity(field.label);
                        if (sev === 'URGENT') totalUrgents++;
                        else totalMajeurs++;
                    } else if (state === 'surveiller') totalSurveiller++;
                    else if (state === 'conforme') totalConformes++;
                });
            });
        });

        // PAGE DE COUVERTURE PROFESSIONNELLE
        let html = `
            <div class="page-break" style="min-height: 100vh; display: flex; flex-direction: column; background: #0f172a; color: white; padding: 60px; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px;">
                    <div>
                        <div style="font-size: 2.5rem; font-weight: 900; color: #1A56DB; letter-spacing: 4px;">KZO</div>
                        <div style="font-size: 1rem; color: #60a5fa; letter-spacing: 3px; font-weight: 600;">INSPECTPRO</div>
                    </div>
                    <div style="text-align: right; font-size: 0.9rem; color: #94a3b8; line-height: 1.8;">
                        <div>${typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.phone : '438-378-6703'}</div>
                        <div>${typeof KZO_OWNER_PROFILE !== 'undefined' ? KZO_OWNER_PROFILE.email : 'kzoinspectpro@gmail.com'}</div>
                        <div style="margin-top:8px; color:#3b82f6; font-size:0.8rem;">BNQ 3009-500 · REIBH 2024 · RBQ</div>
                    </div>
                </div>

                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 0.85rem; color: #64748b; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px;">Rapport d'inspection préachat</div>
                    <h1 style="font-size: 2.8rem; font-weight: 800; color: white; margin: 0 0 8px; line-height: 1.1;">RAPPORT D'INSPECTION</h1>
                    <h2 style="font-size: 1.8rem; font-weight: 400; color: #60a5fa; margin: 0 0 24px;">DE BÂTIMENT D'HABITATION</h2>

                    ${isMultiMode ? `
                    <div style="display: inline-block; background: #1A56DB; color: white; padding: 10px 22px; border-radius: 8px; font-weight: 700; font-size: 1.1rem; margin-bottom: 30px; width: fit-content; box-shadow: 0 4px 16px rgba(26,86,219,0.4);">
                        🏠 ${safeUnitName}
                    </div>
                    ` : `<div style="margin-bottom:20px;"></div>`}

                    ${inspectionData.clientInfo.coverPhotoUrl
                        ? `<img src="${inspectionData.clientInfo.coverPhotoUrl}" style="width: 100%; max-height: 380px; object-fit: cover; border-radius: 12px; border: 2px solid #1A56DB; margin-bottom: 50px;">`
                        : `<div style="width: 100%; height: 280px; background: #1e293b; border: 2px dashed #334155; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #475569; font-size: 1.1rem; margin-bottom: 50px;">📷 Photo de façade non fournie</div>`}

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Préparé pour</div>
                            <div style="font-size: 1.4rem; font-weight: 700; color: white;">${clientName}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Propriété inspectée</div>
                            <div style="font-size: 1rem; color: #e2e8f0;">${address}${isMultiMode ? `<br><span style="color:#60a5fa; font-weight:600;">— ${safeUnitName}</span>` : ''}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Date de l'inspection</div>
                            <div style="font-size: 1rem; color: #e2e8f0;">${dateInspection}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px;">Inspecteur</div>
                            <div style="font-size: 1rem; color: #e2e8f0;">${safeInspectorName}</div>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 60px; padding-top: 24px; border-top: 1px solid #1e293b; display: flex; justify-content: space-between; font-size: 0.8rem; color: #475569;">
                    <span>No dossier : ${safeDossierId}${isMultiMode ? ` — ${safeUnitName}` : ''}</span>
                    <span>Conforme BNQ 3009-500 · REIBH 2024</span>
                </div>
            </div>
        `;

        // FICHE DE PROPRIÉTÉ
        html += `
            <div class="page-break" style="padding: 50px 60px;">
                <h2 style="color: #1A56DB; border-bottom: 3px solid #1A56DB; padding-bottom: 12px; margin-bottom: 30px; font-size: 1.8rem;">Fiche de la propriété inspectée</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 24px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    ${typeBatiment ? `<div><strong>Type de bâtiment :</strong> ${typeBatiment}</div>` : ''}
                    ${typeGarage ? `<div><strong>Type de garage :</strong> ${typeGarage}</div>` : ''}
                    ${superficie ? `<div><strong>Superficie habitable :</strong> ${superficie} m²</div>` : ''}
                    ${annee ? `<div><strong>Année de construction :</strong> ${annee}</div>` : ''}
                    ${meteo ? `<div><strong>Météo lors de l'inspection :</strong> ${meteo}</div>` : ''}
                    ${temperature ? `<div><strong>Température extérieure :</strong> ${temperature} °C</div>` : ''}
                    <div><strong>Norme applicable :</strong> ${safeNorme}</div>
                    <div><strong>Date du rapport :</strong> ${new Date().toLocaleDateString('fr-CA')}</div>
                </div>
            </div>
        `;

        // FACTURE
        html += BOILERPLATE.facture(clientName, address, sanitizeHTML(String(prix)), safeDossierId);

        // LETTRE D'INTRO
        html += BOILERPLATE.lettreIntro(clientName, safeNorme, safeInspectorName, signatureUrl, sealUrl);

        // COMMENT LIRE CE RAPPORT
        if (BOILERPLATE.commentLire) html += BOILERPLATE.commentLire;

        // LOCALISATION
        if (BOILERPLATE.localisation) html += BOILERPLATE.localisation(address);

        // CONVENTIONS
        html += BOILERPLATE.conventions;

        // Construire défauts numérotés et items durée de vie
        const _numberedDefects = _buildNumberedDefects(unitFieldStates, inspectionData.sections);
        const _lifespanItems = _buildLifespanItems();
        const _urgentDefects = _numberedDefects.filter(d => d.severity === 'URGENT');
        const _majeurDefects = _numberedDefects.filter(d => d.severity === 'MAJEUR');
        const _surveillerDefects = _numberedDefects.filter(d => d.severity === 'SURVEILLER');

        // SOMMAIRE EXÉCUTIF avec compteur
        const hasIssues = totalUrgents > 0 || totalMajeurs > 0 || totalSurveiller > 0;
        const _totalChecked = totalUrgents + totalMajeurs + totalSurveiller + totalConformes || 1;
        const _bars = [
            { label: 'Urgents',    count: totalUrgents,    color: '#dc2626', pct: Math.round(totalUrgents    / _totalChecked * 100) },
            { label: 'Majeurs',    count: totalMajeurs,    color: '#d97706', pct: Math.round(totalMajeurs    / _totalChecked * 100) },
            { label: 'Surveiller', count: totalSurveiller, color: '#f59e0b', pct: Math.round(totalSurveiller / _totalChecked * 100) },
            { label: 'Conformes',  count: totalConformes,  color: '#22c55e', pct: Math.round(totalConformes  / _totalChecked * 100) }
        ];
        const _barsHtml = `<div style="margin-top:24px;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <h3 style="font-size:1rem;color:#0f172a;margin:0 0 16px;">📊 Répartition des observations</h3>
            ${_bars.map(b => `<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:0.85rem;font-weight:600;margin-bottom:4px;"><span style="color:#334155;">${b.label}</span><span style="color:${b.color};">${b.count} (${b.pct}%)</span></div><div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;"><div style="background:${b.color};height:100%;width:${b.pct}%;border-radius:4px;"></div></div></div>`).join('')}
        </div>`;
        html += `
            <div class="page-break" style="padding-top: 50px;">
                <h2 style="color: #1A56DB; border-bottom: 2px solid #1A56DB; padding-bottom: 10px; margin-bottom: 30px; font-size: 2rem;">Sommaire Exécutif</h2>

                <!-- Compteur visuel -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px;">
                    <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 900; color: #dc2626;">${totalUrgents}</div>
                        <div style="font-size: 0.85rem; color: #7f1d1d; font-weight: 600; margin-top: 4px;">❌ URGENTS</div>
                    </div>
                    <div style="background: #fffbeb; border: 2px solid #d97706; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 900; color: #d97706;">${totalMajeurs}</div>
                        <div style="font-size: 0.85rem; color: #78350f; font-weight: 600; margin-top: 4px;">❌ MAJEURS</div>
                    </div>
                    <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 900; color: #f59e0b;">${totalSurveiller}</div>
                        <div style="font-size: 0.85rem; color: #92400e; font-weight: 600; margin-top: 4px;">⚠️ À SURVEILLER</div>
                    </div>
                    <div style="background: #ecfdf5; border: 2px solid #059669; border-radius: 10px; padding: 20px; text-align: center;">
                        <div style="font-size: 2.5rem; font-weight: 900; color: #059669;">${totalConformes}</div>
                        <div style="font-size: 0.85rem; color: #064e3b; font-weight: 600; margin-top: 4px;">✅ CONFORMES</div>
                    </div>
                </div>

                <div style="padding: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 30px;">
                    <p style="margin-bottom: 16px; font-size: 1.1rem;"><strong>État général au moment de l'inspection :</strong><br><br>
                        <span style="background: ${hasIssues && totalUrgents > 0 ? '#fef2f2' : hasIssues ? '#fffbeb' : '#ecfdf5'}; color: ${hasIssues && totalUrgents > 0 ? '#dc2626' : hasIssues ? '#d97706' : '#059669'}; padding: 8px 16px; border-radius: 6px; font-weight: bold; border: 1px solid currentColor; display: inline-block;">
                            ${sanitizeHTML(document.getElementById('rap_etat_general')?.value || 'Non évalué')}
                        </span>
                    </p>
                    <p style="margin-bottom: 16px; font-size: 1rem; line-height: 1.7;"><strong>Travaux prioritaires :</strong><br>${sanitizeHTML(document.getElementById('rap_priorite')?.value || 'Aucun documenté.').replace(/\n/g, '<br>')}</p>
                    <p style="font-size: 1rem; line-height: 1.7;"><strong>Notes de l'inspecteur :</strong><br>${sanitizeHTML(document.getElementById('rap_notes')?.value || 'Aucune observation supplémentaire.').replace(/\n/g, '<br>')}</p>
                    ${document.getElementById('rap_entretien')?.value ? `<p style="font-size: 1rem; line-height: 1.7; margin-top: 16px;"><strong>Recommandations d'entretien préventif :</strong><br>${sanitizeHTML(document.getElementById('rap_entretien').value).replace(/\n/g, '<br>')}</p>` : ''}
                </div>
                ${_numberedDefects.length > 0 ? `
                <div style="margin-top: 30px;">
                    <h3 style="font-size: 1.3rem; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">📋 Liste des observations — ${_numberedDefects.length} au total</h3>
                    ${_urgentDefects.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <div style="background: #dc2626; color: white; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; display: inline-block;">🚨 URGENT — ${_urgentDefects.length} observation${_urgentDefects.length > 1 ? 's' : ''}</div>
                        ${_urgentDefects.map(d => `<div style="padding: 8px 14px; border-left: 3px solid #dc2626; margin-bottom: 4px; font-size: 0.9rem; background: #fff5f5;"><span style="font-weight: 700; color: #dc2626; margin-right: 8px;">#${d.num}</span><strong>${sanitizeHTML(d.sectionTitle)}</strong> — ${sanitizeHTML(d.label)}<span style="color: #dc2626; font-size: 0.82rem; margin-left: 8px;">→ ${sanitizeHTML(d.specialist)}</span></div>`).join('')}
                    </div>` : ''}
                    ${_majeurDefects.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <div style="background: #d97706; color: white; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; display: inline-block;">⚠️ MAJEUR — ${_majeurDefects.length} observation${_majeurDefects.length > 1 ? 's' : ''}</div>
                        ${_majeurDefects.map(d => `<div style="padding: 8px 14px; border-left: 3px solid #d97706; margin-bottom: 4px; font-size: 0.9rem; background: #fffdf0;"><span style="font-weight: 700; color: #d97706; margin-right: 8px;">#${d.num}</span><strong>${sanitizeHTML(d.sectionTitle)}</strong> — ${sanitizeHTML(d.label)}<span style="color: #d97706; font-size: 0.82rem; margin-left: 8px;">→ ${sanitizeHTML(d.specialist)}</span></div>`).join('')}
                    </div>` : ''}
                    ${_surveillerDefects.length > 0 ? `
                    <div style="margin-bottom: 16px;">
                        <div style="background: #f59e0b; color: #0f172a; padding: 6px 14px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; margin-bottom: 8px; display: inline-block;">👁️ À SURVEILLER — ${_surveillerDefects.length} élément${_surveillerDefects.length > 1 ? 's' : ''}</div>
                        ${_surveillerDefects.map(d => `<div style="padding: 8px 14px; border-left: 3px solid #f59e0b; margin-bottom: 4px; font-size: 0.9rem; background: #fffbeb;"><span style="font-weight: 700; color: #92400e; margin-right: 8px;">#${d.num}</span><strong>${sanitizeHTML(d.sectionTitle)}</strong> — ${sanitizeHTML(d.label)}<span style="color: #92400e; font-size: 0.82rem; margin-left: 8px;">→ ${sanitizeHTML(d.specialist)}</span></div>`).join('')}
                    </div>` : ''}
                </div>` : ''}
                ${_barsHtml}
                ${_lifespanItems.length > 0 ? `
                <div style="margin-top: 24px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h3 style="font-size: 1.1rem; color: #0f172a; margin-bottom: 14px;">🔧 Durée de vie estimée des équipements</h3>
                    ${_lifespanItems.map(item => `<div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 0.9rem;"><span style="font-weight: 600; color: #1e293b; min-width: 200px;">${sanitizeHTML(item.label)}${item.age ? ' · ' + item.age + ' ans' : ''}</span><span style="background: ${item.badgeColor}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">${sanitizeHTML(item.badge)}</span><span style="color: #64748b; font-size: 0.82rem;">→ Consulter un ${sanitizeHTML(item.specialist)}</span></div>`).join('')}
                </div>` : ''}
            </div>
        `;

        // TABLE DES MATIÈRES
        const _tocSections = inspectionData.sections.filter(s => !['s_cover','s_admin','s_rapport','s_preview'].includes(s.id));
        const _reportDate = new Date().toLocaleString('fr-CA', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });
        html += `<div class="page-break" style="padding-top:50px;">
            <h2 style="color:#1A56DB;border-bottom:2px solid #1A56DB;padding-bottom:10px;margin-bottom:30px;font-size:2rem;">📋 Table des matières</h2>
            <ol style="list-style:none;padding:0;margin:0;">
                ${_tocSections.map((s, i) => `<li style="display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px dotted #cbd5e1;font-size:0.95rem;"><a href="#rapport-section-${i+1}" style="color:#1e3a5f;text-decoration:none;font-weight:500;">${i+1}. ${sanitizeHTML(s.title)}</a><span style="color:#94a3b8;font-size:0.82rem;white-space:nowrap;padding-left:8px;">section ${i+1}</span></li>`).join('')}
                <li style="display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;font-size:0.95rem;font-weight:600;margin-top:4px;"><span style="color:#1e3a5f;">Sommaire des défauts</span><span style="color:#94a3b8;font-size:0.82rem;white-space:nowrap;padding-left:8px;">voir p.1</span></li>
            </ol>
            <p style="margin-top:24px;color:#94a3b8;font-size:0.8rem;text-align:right;">Rapport généré le ${_reportDate}</p>
        </div>`;

        // CORPS DU RAPPORT
        // Map fieldId → numéro global #N pour les badges
        const _defectNumMap = {};
        (_numberedDefects || []).forEach(d => { _defectNumMap[d.fieldId] = d.num; });
        let defectCount = 0;
        let _sectionIndex = 0;
        inspectionData.sections.forEach(section => {
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport' || section.id === 's_preview') return;
            _sectionIndex++;
            html += `<div class="page-break" id="rapport-section-${_sectionIndex}" style="padding-top: 50px;">
                     <h2 style="color: #1A56DB; margin-bottom: 20px; border-bottom: 2px solid #1A56DB; padding-bottom: 10px; font-size: 1.8rem;">${section.title}</h2>
                     <p style="margin-bottom: 30px; font-style: italic; color: #64748b; line-height: 1.6; font-size: 0.95rem;">Cette section documente l'état des composants apparents et accessibles au moment de l'inspection visuelle non destructive. Les éléments non mentionnés n'ont pu être inspectés en raison de finitions, d'encombrement ou d'inaccessibilité.</p>`;

            let sectionHasDefects = false;
            let defectsHtml = "";
            let infoHtml = "<div style='margin-bottom: 40px;'><h3 style='font-size: 1.2rem; margin-bottom: 16px; color: #374151;'>Matériaux et observations</h3><ul style='list-style-type: none; padding: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;'>";

            section.subSections.forEach(sub => {
                infoHtml += `<li style="padding: 10px 16px; background: #1A56DB; color: white; font-weight: 600; font-size: 0.9rem;">${sub.title}</li>`;
                sub.fields.forEach(field => {
                    if (field.type === 'select' || field.type === 'text' || field.type === 'number' || field.type === 'date') {
                        const val = document.getElementById(field.id)?.value;
                        if (val) infoHtml += `<li style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem;"><strong style="color: #374151;">${field.label} :</strong> <span style="color: #0f172a;">${sanitizeHTML(val)}</span></li>`;
                    }
                    if (field.type === 'checkbox') {
                        const state = unitFieldStates[field.id];
                        if (!state || state === '') return;
                        if (state === 'defaut') {
                            sectionHasDefects = true;
                            defectCount++;
                            const severity = AIAgents.determineSeverity(field.label);
                            const reco = AIAgents.getRecommendation(field.label);
                            const narrative = AIAgents.analyzeCheckbox(field.label);
                            let color = severity === "URGENT" ? "#dc2626" : severity === "MAJEUR" ? "#d97706" : "#475569";
                            let bgClass = severity === "URGENT" ? "#fef2f2" : severity === "MAJEUR" ? "#fffbeb" : "#f8fafc";
                            defectsHtml += `
                                <div style="margin-bottom: 25px; padding: 25px; background: ${bgClass}; border-left: 6px solid ${color}; border-radius: 8px; page-break-inside: avoid;">
                                    <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 15px;">
                                        <span style="background: ${color}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; white-space: nowrap;">❌ ${severity}</span>
                                        ${_defectNumMap[field.id] ? `<span style="background: #0f172a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.82rem; font-weight: 700; white-space: nowrap;">#${_defectNumMap[field.id]}</span>` : ''}
                                        <strong style="font-size: 1.1rem; color: #0f172a;">${field.label}</strong>
                                    </div>
                                    <p style="color: #334155; font-size: 0.95rem; line-height: 1.7; margin-bottom: 15px;">${narrative}</p>
                                    <div style="background: rgba(0,0,0,0.04); padding: 14px; border-radius: 6px; font-size: 0.95rem;"><strong>💡 Recommandation :</strong><br>${reco}</div>
                                </div>`;
                        } else if (state === 'surveiller') {
                            const reco = AIAgents.getRecommendation(field.label);
                            defectsHtml += `
                                <div style="margin-bottom: 16px; padding: 18px; background: #fffbeb; border-left: 5px solid #d97706; border-radius: 8px;">
                                    <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                                        <span style="background: #d97706; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.82rem; font-weight: bold; white-space: nowrap;">⚠️ À SURVEILLER</span>
                                        ${_defectNumMap[field.id] ? `<span style="background: #0f172a; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.78rem; font-weight: 700;">#${_defectNumMap[field.id]}</span>` : ''}
                                        <span style="color: #0f172a; font-size: 0.95rem;">${field.label}</span>
                                    </div>
                                    <div style="font-size: 0.88rem; color: #78350f; margin-top: 6px;"><strong>Suggestion :</strong> ${reco}</div>
                                </div>`;
                        } else if (state === 'conforme') {
                            // Pour les champs conformes, on affiche la formulation positive
                            // (cohérent avec le dropdown vu par l'inspecteur). Sinon on aurait
                            // "✅ <défaut hypothétique> — Conforme" qui est contradictoire.
                            const conformeLabel = (typeof generateFieldVariants === 'function')
                                ? generateFieldVariants(field.label).positive
                                : field.label;
                            infoHtml += `<li style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #059669;">✅ ${sanitizeHTML(conformeLabel)} — <em>Conforme</em></li>`;
                        } else if (state === 'na') {
                            infoHtml += `<li style="padding: 10px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #94a3b8;">➖ ${sanitizeHTML(field.label)} — <em>Non applicable</em></li>`;
                        }
                    }
                });

                // Photos de la sous-section (de l'unité active)
                const subPhotos = unitSectionPhotos[sub.id] || [];
                if (subPhotos.length > 0) {
                    infoHtml += `</ul><div style="margin: 16px 0; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">`;
                    infoHtml += `<strong style="color: #475569; font-size: 0.95rem;">📸 Photos (${sub.title}) :</strong>`;
                    infoHtml += `<div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px;">`;
                    subPhotos.forEach(photo => {
                        infoHtml += `<figure style="display:inline-block;margin:4px;vertical-align:top;">`;
                        infoHtml += `<img src="${_isSafePhotoUrl(photo.url) ? photo.url : ''}" style="width:180px;height:135px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1;display:block;">`;
                        if (photo.caption) {
                            infoHtml += `<figcaption style="font-size:0.75rem;color:#64748b;text-align:center;margin-top:4px;max-width:180px;">${sanitizeHTML(photo.caption)}</figcaption>`;
                        }
                        infoHtml += `</figure>`;
                    });
                    infoHtml += `</div></div><ul style='list-style-type: none; padding: 0;'>`;
                }
            });
            infoHtml += "</ul></div>";
            html += infoHtml;

            // Anomalies
            html += `<h3 style='font-size: 1.2rem; margin-bottom: 20px; color: ${sectionHasDefects ? '#dc2626' : '#059669'};'>${sectionHasDefects ? '⚠️ Anomalies et observations' : '✅ Aucune anomalie majeure'}</h3>`;
            if (sectionHasDefects || defectsHtml.includes('surveiller')) {
                html += defectsHtml;
            } else {
                html += `<div style="padding: 18px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 0.95rem;">L'inspection visuelle non-destructive des éléments apparents de cette section n'a révélé aucun défaut d'importance immédiate. Entretien préventif recommandé selon le calendrier saisonnier.</div>`;
            }

            // Commentaires sous-sections (de l'unité active)
            let hasSubComments = false;
            section.subSections.forEach(sub => {
                const sc = unitComments[sub.id];
                if (sc && (sc.text || sc.severity)) hasSubComments = true;
            });
            if (hasSubComments) {
                html += `<h3 style='font-size: 1.1rem; margin-top: 30px; margin-bottom: 16px; color: #92400e;'>📝 Commentaires de l'inspecteur</h3>`;
                section.subSections.forEach(sub => {
                    const sc = unitComments[sub.id];
                    if (!sc || (!sc.text && !sc.severity)) return;
                    const sevColors = { urgent: '#dc2626', majeur: '#d97706', mineur: '#ca8a04', ok: '#059669' };
                    const sevLabels = { urgent: '🔴 URGENT', majeur: '🟠 MAJEUR', mineur: '🟡 MINEUR', ok: '✅ CONFORME' };
                    const sevColor = sevColors[sc.severity] || '#64748b';
                    html += `<div style="margin-bottom: 14px; padding: 14px; background: #fff7ed; border-left: 4px solid ${sevColor}; border-radius: 6px;">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
                            <strong style="color:#1e293b; font-size:0.95rem;">${sub.title}</strong>
                            ${sc.severity ? `<span style="background:${sevColor}; color:white; padding:2px 8px; border-radius:10px; font-size:0.78rem; font-weight:700;">${sevLabels[sc.severity] || sc.severity}</span>` : ''}
                        </div>
                        ${sc.text ? `<p style="color:#334155; font-size:0.9rem; line-height:1.6; margin:0; white-space:pre-wrap;">${sanitizeHTML(sc.text)}</p>` : ''}
                    </div>`;
                });
            }

            // Commentaire global section (de l'unité active)
            const secId = 'section_' + inspectionData.sections.indexOf(section);
            const secC = unitSectionComments[secId];
            if (secC && (secC.text || secC.severity)) {
                const sevColors = { urgent: '#dc2626', majeur: '#d97706', mineur: '#ca8a04', ok: '#059669' };
                const sevLabels = { urgent: '🔴 URGENT', majeur: '🟠 MAJEUR', mineur: '🟡 MINEUR', ok: '✅ CONFORME' };
                html += `<div style="margin-top: 20px; padding: 18px; background: #eff6ff; border: 2px solid #3b82f6; border-radius: 8px;">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
                        <strong style="color:#1e40af; font-size:0.95rem;">🗂️ Commentaire global</strong>
                        ${secC.severity ? `<span style="background:${sevColors[secC.severity]||'#64748b'}; color:white; padding:3px 10px; border-radius:10px; font-size:0.82rem; font-weight:700;">${sevLabels[secC.severity]||secC.severity}</span>` : ''}
                    </div>
                    ${secC.text ? `<p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin:0; white-space:pre-wrap;">${sanitizeHTML(secC.text)}</p>` : ''}
                </div>`;
            }

            // Ligne durée de vie si la section contient des champs d'âge mappés
            const _sectionLifespan = _lifespanItems.filter(item =>
                section.subSections.some(sub =>
                    (sub.fields || []).some(f =>
                        (f.id === 'ce_age' && item.label.includes('Chauffe')) ||
                        (f.id === 'c_age' && item.label.includes('Fournaise')) ||
                        (f.id === 'to_age' && item.label.includes('Couverture'))
                    )
                )
            );
            if (_sectionLifespan.length > 0) {
                html += `<div style="margin-top: 20px; padding: 16px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                    <div style="font-weight: 700; color: #065f46; margin-bottom: 10px; font-size: 0.95rem;">🔧 Durée de vie estimée</div>
                    ${_sectionLifespan.map(item => `<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px; font-size: 0.88rem;"><span style="color: #1e293b; font-weight: 600;">${sanitizeHTML(item.label)}${item.age ? ' · ' + item.age + ' ans' : ''}</span><span style="background: ${item.badgeColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.78rem; font-weight: 700;">${sanitizeHTML(item.badge)}</span><span style="color: #64748b; font-size: 0.82rem;">→ Consulter un ${sanitizeHTML(item.specialist)}</span></div>`).join('')}
                </div>`;
            }

            html += "</div>";
        });

        // ATTESTATION
        if (BOILERPLATE.attestation) html += BOILERPLATE.attestation(clientName, safeInspectorName, signatureUrl, sealUrl);

        const clientSigUrl = inspectionData.clientInfo.clientSignatureUrl || null;
        if (clientSigUrl) {
            const sigDate = new Date().toLocaleDateString('fr-CA');
            html += `<div style="margin-top:40px;padding:24px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;page-break-inside:avoid;">
                <h3 style="color:#0f172a;font-size:1rem;margin:0 0 12px;">✍️ Acceptation du rapport — Signature du client</h3>
                <p style="color:#64748b;font-size:0.85rem;margin:0 0 16px;">Date : ${sigDate} &nbsp;&nbsp;&nbsp; Client : ${sanitizeHTML(clientName)}</p>
                <img src="${clientSigUrl}" style="max-width:300px;height:80px;object-fit:contain;border-bottom:2px solid #0f172a;display:block;">
            </div>`;
        }

        // LETTRE DE REMERCIEMENT
        if (BOILERPLATE.lettreRemerciement) {
            html += BOILERPLATE.lettreRemerciement(
                clientName, address, safeInspectorName,
                sanitizeHTML(window.AppCompanyProfile ? window.AppCompanyProfile.name : 'KZO InspectPro'),
                signatureUrl
            );
        }

        // GUIDE D'ENTRETIEN
        html += BOILERPLATE.guideEntretien;

        // ANNEXE NORMES
        html += BOILERPLATE.normesPratique(safeNorme);

        return html;
    }

    async function sendReportByEmail(unitId) {
        const clientEmail = inspectionData.clientInfo.email || inspectionData['client_email'] || '';
        if (!clientEmail) {
            showToast('Veuillez saisir l\'email du client dans la Section 1.', 'warning');
            return;
        }
        const cfg = (typeof KZO_CONFIG !== 'undefined') ? KZO_CONFIG : {};
        if (!cfg.EMAILJS_SERVICE_ID || !cfg.EMAILJS_RAPPORT_TEMPLATE_ID || !cfg.EMAILJS_PUBLIC_KEY) {
            showToast('EmailJS non configuré — remplissez EMAILJS_RAPPORT_TEMPLATE_ID dans config.js.', 'error');
            return;
        }
        const sendBtn = document.getElementById('sendReportBtn');
        if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = '…'; }
        try {
            let driveUrl = (typeof GoogleDrive !== 'undefined') ? GoogleDrive.getLastSyncUrl() : '';
            if (!driveUrl && typeof GoogleDrive !== 'undefined') {
                const blob = new Blob([document.getElementById('reportContent').innerHTML], { type: 'text/html;charset=utf-8' });
                await GoogleDrive.syncInspection(window.currentProjectId, blob, unitId);
                driveUrl = GoogleDrive.getLastSyncUrl();
            }
            emailjs.init(cfg.EMAILJS_PUBLIC_KEY);
            await emailjs.send(cfg.EMAILJS_SERVICE_ID, cfg.EMAILJS_RAPPORT_TEMPLATE_ID, {
                to_email:       clientEmail,
                client_name:    sanitizeHTML(inspectionData.clientInfo.name || 'Client'),
                inspector_name: sanitizeHTML(inspectionData.clientInfo.inspectorName || 'Inspecteur'),
                address:        sanitizeHTML(inspectionData.clientInfo.address || ''),
                report_link:    driveUrl || '(lien non disponible — activez Google Drive)'
            });
            showToast('✅ Rapport envoyé à ' + clientEmail, 'success');
            if (sendBtn) { sendBtn.textContent = '✅ Envoyé'; }
        } catch (e) {
            console.error('[sendReportByEmail]', e);
            showToast('Erreur envoi : ' + (e.text || e.message || JSON.stringify(e)), 'error');
            if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = '📤 Envoyer au client'; }
        }
    }

    function generateFinalReport(unitId) {
        if (typeof BOILERPLATE === 'undefined') {
            showToast("Impossible de charger le contenu légal (boilerplate.js manquant).", 'error');
            return;
        }

        // Validation minimale
        const clientName = sanitizeHTML(inspectionData.clientInfo.name) || '';
        const address = sanitizeHTML(inspectionData.clientInfo.address) || '';
        if (!clientName || !address) {
            showToast('Veuillez remplir le nom du client et l\'adresse du bâtiment avant de générer le rapport (Section 1).', 'warning');
            return;
        }

        const html = _buildReportHTML(unitId);
        const reportModal = document.getElementById('reportModal');
        const reportContent = document.getElementById('reportContent');
        reportContent.innerHTML = html;
        reportModal.style.display = 'flex';

        // Drive sync + Sheets webhook (délégué à google_drive.js)
        // Guard handles environments where google_drive.js n'est pas chargé
        if (typeof GoogleDrive !== 'undefined') {
            const reportBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
            GoogleDrive.syncInspection(window.currentProjectId, reportBlob, unitId);
        }

        document.getElementById('closeReportBtn').onclick = () => { reportModal.style.display = 'none'; };
        document.getElementById('sendReportBtn').onclick = () => sendReportByEmail(unitId);
        document.getElementById('printReportBtn').onclick = () => { setTimeout(() => window.print(), 500); };

        // Marquer le projet comme terminé dans IndexedDB
        if (window.currentProjectId && window.KZOStorage) {
            const snapshot = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId,
                rapportNarratifIA: inspectionData.rapportNarratifIA || ''
            };
            KZOStorage.saveProject(window.currentProjectId, snapshot, _computeProgress(), 'termine')
                .then(() => _markClean())
                .catch(e => console.warn('[generateFinalReport] IndexedDB:', e));
        }
    }

    // Calcule le nombre de sections avec au moins 1 checkbox cochée
    function _computeProgress() {
        if (!inspectionData.sections) return 0;
        const unit = inspectionData.units && (
            inspectionData.units.find(u => u.id === inspectionData.currentUnitId) || inspectionData.units[0]
        );
        const states = (unit && unit.fieldStates) || {};
        let count = 0;
        const NON_INSPECTION = ['s_cover', 's_admin', 's_rapport', 's_preview'];
        inspectionData.sections.forEach(section => {
            // Exclure : couverture photo, admin, prévisualisation, rapport final
            if (section.isCoverPage || section.isPreviewPage || NON_INSPECTION.includes(section.id)) return;
            const hasChecked = (section.subSections || []).some(sub =>
                (sub.fields || []).some(f => f.type === 'checkbox' && states[f.id])
            );
            if (hasChecked) count++;
        });
        return count;
    }

    // --- Persistence Globale (Offline Support) ---
    function saveAppState() {
        _markDirty();
        // Sauvegarde localStorage (fallback)
        try {
            const toSave = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId
            };
            localStorage.setItem('kzo_inspection_data', JSON.stringify(toSave));
        } catch(e) { console.error('[saveAppState] localStorage:', e); }

        // Sauvegarde IndexedDB (primaire)
        if (window.currentProjectId && window.KZOStorage) {
            const snapshot = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId,
                rapportNarratifIA: inspectionData.rapportNarratifIA || ''
            };
            KZOStorage.saveProject(window.currentProjectId, snapshot, _computeProgress())
                .catch(e => console.warn('[saveAppState] IndexedDB:', e));
        }
    }

    function loadAppState() {
        const saved = localStorage.getItem('kzo_inspection_data');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.clientInfo) Object.assign(inspectionData.clientInfo, parsed.clientInfo);
                if (parsed.id) inspectionData.id = parsed.id;
                
                // Charger les unités (nouvelle structure)
                if (parsed.units && Array.isArray(parsed.units) && parsed.units.length > 0) {
                    inspectionData.units = parsed.units;
                } else if (parsed.fieldStates || parsed.comments) {
                    // MIGRATION : Ancienne structure sans unités → copier dans unit_1
                    inspectionData.units[0].fieldStates = parsed.fieldStates || {};
                    inspectionData.units[0].comments = parsed.comments || {};
                    inspectionData.units[0].sectionComments = parsed.sectionComments || {};
                    inspectionData.units[0].sectionPhotos = parsed.sectionPhotos || {};
                }
                if (parsed.currentUnitId && inspectionData.units.find(u => u.id === parsed.currentUnitId)) {
                    inspectionData.currentUnitId = parsed.currentUnitId;
                }
                return true;
            } catch(e) { console.error("Erreur chargement", e); }
        }
        return false;
    }

    // --- Bouton Nouvelle Inspection ---
    function resetInspection() {
        if (confirm('Retourner à l\'accueil ? L\'inspection en cours a été sauvegardée.')) {
            window.location.href = 'index.html';
        }
    }

    // Ajouter bouton Nouvelle Inspection dans la topbar
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        const newInspBtn = document.createElement('button');
        newInspBtn.textContent = '🆕 Nouvelle inspection';
        newInspBtn.style.cssText = 'background: #059669; color: white; border: none; padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-right: 8px;';
        newInspBtn.onclick = resetInspection;
        topBar.insertBefore(newInspBtn, topBar.querySelector('.assistant-btn'));
    }

    // Capture de tous les changements du formulaire
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target.id && (target.type === 'text' || target.type === 'number' || target.type === 'checkbox' || target.tagName === 'SELECT')) {
            saveAppState();
        }
    });
    // Sauvegarder aussi les textarea (commentaires) en temps réel
    document.addEventListener('input', (e) => {
        if (e.target.tagName === 'TEXTAREA') {
            saveAppState();
        }
    });



    // Initialize the app
    loadAppState();
    
    // Garanties post-load : s'assurer que toutes les structures critiques existent
    if (!inspectionData.clientInfo) inspectionData.clientInfo = {};
    if (!Array.isArray(inspectionData.clientInfo.names) || inspectionData.clientInfo.names.length === 0) {
        inspectionData.clientInfo.names = [''];
    }
    if (!inspectionData.units || !Array.isArray(inspectionData.units) || inspectionData.units.length === 0) {
        inspectionData.units = [{ id: 'unit_1', name: 'Unité 1', fieldStates: {}, comments: {}, sectionComments: {}, sectionPhotos: {} }];
        inspectionData.currentUnitId = 'unit_1';
    }
    
    function initOfflineBanner() {
        const banner = document.createElement('div');
        banner.id = 'offlineBanner';
        banner.style.cssText = 'display:none;background:#dc2626;color:white;text-align:center;padding:8px 16px;font-size:0.85rem;font-weight:700;position:sticky;top:0;z-index:1000;';
        banner.textContent = '📵 Mode hors ligne — Données sauvegardées localement. Sync Drive dès reconnexion.';
        const topBar = document.querySelector('.top-bar');
        if (topBar) topBar.insertAdjacentElement('afterend', banner);

        function showBanner() {
            banner.style.display = 'block';
            if (typeof GoogleDrive !== 'undefined') {
                GoogleDrive.updateSyncIndicator(window.currentProjectId);
            }
        }

        function hideBanner() {
            banner.style.display = 'none';
            showToast('✅ Connexion rétablie — synchronisation en cours...', 'success');
            if (typeof GoogleDrive !== 'undefined') {
                GoogleDrive.updateSyncIndicator(window.currentProjectId);
            }
        }

        if (!navigator.onLine) showBanner();
        window.addEventListener('offline', showBanner);
        window.addEventListener('online', hideBanner);
    }

    initOfflineBanner();

    renderNavigation();
    renderSection(0);
    renderUnitTabs(); // Afficher la barre d'unités si applicable

    // Init Google Drive module + afficher statut sync
    if (typeof GoogleDrive !== 'undefined') {
        GoogleDrive.init();
        GoogleDrive.updateSyncIndicator(window.currentProjectId);
    }

    // Enregistrement du Service Worker pour le mode hors ligne (iPad, tablette)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('KZO InspectPro : mode hors ligne actif'))
            .catch(err => console.warn('Service Worker non enregistré :', err));
    }

    function generateClientReport() {
        const clientName = sanitizeHTML(inspectionData.clientInfo.name) || '';
        const address = sanitizeHTML(inspectionData.clientInfo.address) || '';
        if (!clientName || !address) {
            showToast('Veuillez remplir le nom du client et l\'adresse (Section 1).', 'warning');
            return;
        }

        const targetUnit = getCurrentUnit();
        const unitFieldStates = targetUnit.fieldStates || {};
        const unitSectionPhotos = targetUnit.sectionPhotos || {};
        const inspectorName = sanitizeHTML(inspectionData.clientInfo.inspectorName || '');
        const dateInspection = inspectionData['inspection_date']
            ? new Date(inspectionData['inspection_date']).toLocaleDateString('fr-CA', {year:'numeric', month:'long', day:'numeric'})
            : new Date().toLocaleDateString('fr-CA', {year:'numeric', month:'long', day:'numeric'});
        const codeInspection = sanitizeHTML(unitFieldStates['inspection_code'] || inspectionData.id || '');

        // Compteurs
        let urgents = 0, majeurs = 0, surveiller = 0, conformes = 0;
        inspectionData.sections.forEach(section => {
            if (['s_cover','s_admin','s_rapport','s_preview'].includes(section.id)) return;
            (section.subSections || []).forEach(sub => {
                (sub.fields || []).forEach(field => {
                    if (field.type !== 'checkbox') return;
                    const state = unitFieldStates[field.id];
                    if (state === 'defaut') {
                        const sev = AIAgents.determineSeverity(field.label);
                        if (sev === 'URGENT') urgents++; else majeurs++;
                    } else if (state === 'surveiller') surveiller++;
                    else if (state === 'conforme') conformes++;
                });
            });
        });

        // Durée de vie
        const lifespanItems = _buildLifespanItems();

        // Sections
        let sectionsHtml = '';
        inspectionData.sections.forEach(section => {
            if (['s_cover','s_admin','s_rapport','s_preview'].includes(section.id)) return;
            const allFields = (section.subSections || []).flatMap(ss => ss.fields || []);
            const defautFields = allFields.filter(f => f.type === 'checkbox' && (unitFieldStates[f.id] === 'defaut' || unitFieldStates[f.id] === 'surveiller'));
            const hasDefaut = defautFields.length > 0;
            const maxSev = defautFields.some(f => AIAgents.determineSeverity(f.label) === 'URGENT') ? 'URGENT'
                : defautFields.some(f => unitFieldStates[f.id] === 'defaut') ? 'MAJEUR'
                : defautFields.length > 0 ? 'SURVEILLER' : 'CONFORME';
            const borderColor = maxSev === 'URGENT' ? '#dc2626' : maxSev === 'MAJEUR' ? '#ea580c' : maxSev === 'SURVEILLER' ? '#ca8a04' : '#22c55e';
            const icon = maxSev === 'CONFORME' ? '✅' : maxSev === 'URGENT' ? '🚨' : '⚠️';

            // Photos de la section
            let photosHtml = '';
            (section.subSections || []).forEach(sub => {
                const photos = (unitSectionPhotos[sub.id] || []).filter(p => p.url);
                if (photos.length) {
                    photosHtml += photos.map(p => `<figure style="display:inline-block;margin:4px;vertical-align:top;"><img src="${_isSafePhotoUrl(p.url) ? p.url : ''}" style="width:150px;height:112px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;display:block;">${p.caption ? `<figcaption style="font-size:0.7rem;color:#64748b;text-align:center;margin-top:3px;max-width:150px;">${sanitizeHTML(p.caption)}</figcaption>` : ''}</figure>`).join('');
                }
            });

            const defautsHtml = defautFields.map(f => {
                const specialist = AIAgents.getSpecialist(f.label);
                return `<div style="margin-bottom:6px;padding-left:8px;">• ${sanitizeHTML(f.label)} — <em>Consulter un ${sanitizeHTML(specialist)}</em></div>`;
            }).join('');

            sectionsHtml += `
            <div style="background:white;border-left:4px solid ${borderColor};border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                <div style="font-weight:700;color:${borderColor};margin-bottom:${hasDefaut ? '8px' : '0'};font-size:0.9rem;">${icon} ${sanitizeHTML(section.title)}</div>
                ${hasDefaut ? `<div style="font-size:0.85rem;color:#374151;line-height:1.7;">${defautsHtml}</div>` : ''}
                ${photosHtml ? `<div style="margin-top:10px;">${photosHtml}</div>` : ''}
            </div>`;
        });

        // Durée de vie HTML
        const lifespanHtml = lifespanItems.length ? `
        <div style="background:white;border-radius:8px;padding:16px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <div style="font-weight:700;color:#475569;margin-bottom:10px;font-size:0.9rem;">🔧 Durée de vie estimée des équipements</div>
            ${lifespanItems.map(item => `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:0.85rem;">
                <span style="color:#374151;">${sanitizeHTML(item.label)}</span>
                <span style="background:${item.badgeColor || '#475569'};color:white;padding:2px 10px;border-radius:10px;font-size:0.75rem;">${sanitizeHTML(item.badge)}</span>
            </div>`).join('')}
        </div>` : '';

        const html = `
        <div style="font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#f8fafc;">
            <div class="page-break" style="background:linear-gradient(135deg,#1e293b,#334155);color:white;border-radius:10px;padding:32px;text-align:center;margin-bottom:24px;">
                <div style="font-size:1.6rem;font-weight:900;letter-spacing:2px;margin-bottom:6px;">RAPPORT D'INSPECTION</div>
                <div style="font-size:1rem;color:#94a3b8;margin-bottom:4px;">${sanitizeHTML(address)}</div>
                <div style="font-size:0.85rem;color:#64748b;">${dateInspection} · ${codeInspection} · ${inspectorName}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
                <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;text-align:center;">
                    <div style="font-size:2rem;font-weight:900;color:#dc2626;">${urgents}</div>
                    <div style="font-size:0.8rem;color:#dc2626;font-weight:600;">URGENT</div>
                </div>
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;text-align:center;">
                    <div style="font-size:2rem;font-weight:900;color:#ea580c;">${majeurs}</div>
                    <div style="font-size:0.8rem;color:#ea580c;font-weight:600;">MAJEUR</div>
                </div>
                <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;">
                    <div style="font-size:2rem;font-weight:900;color:#ca8a04;">${surveiller}</div>
                    <div style="font-size:0.8rem;color:#ca8a04;font-weight:600;">À SURVEILLER</div>
                </div>
                <div style="background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:16px;text-align:center;">
                    <div style="font-size:2rem;font-weight:900;color:#16a34a;">${conformes}</div>
                    <div style="font-size:0.8rem;color:#16a34a;font-weight:600;">CONFORMES</div>
                </div>
            </div>
            ${lifespanHtml}
            ${sectionsHtml}
            <div style="text-align:center;padding:20px;color:#94a3b8;font-size:0.8rem;border-top:1px solid #e2e8f0;margin-top:16px;">
                ${inspectorName} · KZO InspectPro · ${dateInspection}
            </div>
        </div>`;

        const reportModal = document.getElementById('reportModal');
        document.getElementById('reportContent').innerHTML = html;
        reportModal.style.display = 'flex';
        document.getElementById('closeReportBtn').onclick = () => { reportModal.style.display = 'none'; };
    }

    function _renderPreviewPage(container) {
        // Filigrane diagonal fixe
        const watermark = document.createElement('div');
        watermark.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:5rem;font-weight:900;color:rgba(251,191,36,0.07);pointer-events:none;z-index:0;white-space:nowrap;user-select:none;';
        watermark.textContent = 'PRÉVISUALISATION';
        container.appendChild(watermark);

        // Bannière jaune
        const banner = document.createElement('div');
        banner.style.cssText = 'background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;position:relative;z-index:1;flex-wrap:wrap;gap:8px;';
        banner.innerHTML = '<span style="color:#92400e;font-weight:700;font-size:0.88rem;">👁️ PRÉVISUALISATION — Non finalisé · Relisez avant de générer</span>';
        const launchBtn = document.createElement('button');
        launchBtn.type = 'button';
        launchBtn.textContent = '✅ Lancer le rapport final';
        launchBtn.style.cssText = 'background:#22c55e;color:white;border:none;border-radius:6px;padding:8px 16px;font-size:0.88rem;cursor:pointer;font-weight:600;';
        launchBtn.onclick = () => {
            if (isMultiUnitBuilding() && inspectionData.units.length > 1) showUnitReportSelector();
            else generateFinalReport();
        };
        banner.appendChild(launchBtn);
        container.appendChild(banner);

        // Guard: check required fields
        const clientName = sanitizeHTML(inspectionData.clientInfo.name) || '';
        const address = sanitizeHTML(inspectionData.clientInfo.address) || '';
        if (!clientName || !address) {
            const warn = document.createElement('div');
            warn.style.cssText = 'background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;color:#dc2626;font-size:0.9rem;position:relative;z-index:1;';
            warn.textContent = '⚠️ Remplissez le nom du client et l\'adresse (Section 1) pour voir la prévisualisation.';
            container.appendChild(warn);
            return;
        }
        if (typeof BOILERPLATE === 'undefined') {
            const warn = document.createElement('div');
            warn.style.cssText = 'background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;color:#dc2626;position:relative;z-index:1;';
            warn.textContent = '⚠️ boilerplate.js manquant — prévisualisation indisponible.';
            container.appendChild(warn);
            return;
        }

        // Inline report preview
        const previewDiv = document.createElement('div');
        previewDiv.style.cssText = 'position:relative;z-index:1;';
        previewDiv.innerHTML = _buildReportHTML();
        container.appendChild(previewDiv);
    }

    function openClientSignatureModal() {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const card = document.createElement('div');
        card.style.cssText = 'background:white;border-radius:16px;padding:24px;width:min(500px,90vw);';
        card.innerHTML = '<h3 style="color:#0f172a;margin:0 0 16px;text-align:center;font-size:1.1rem;">✍️ Signature du client</h3>';
        const canvasEl = document.createElement('canvas');
        canvasEl.width = 460;
        canvasEl.height = 200;
        canvasEl.style.cssText = 'border:2px dashed #cbd5e1;border-radius:8px;width:100%;touch-action:none;display:block;';
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'display:flex;gap:10px;margin-top:16px;justify-content:center;flex-wrap:wrap;';
        const clearBtn   = document.createElement('button');
        const cancelBtn  = document.createElement('button');
        const confirmBtn = document.createElement('button');
        clearBtn.type = cancelBtn.type = confirmBtn.type = 'button';
        clearBtn.textContent   = '🗑️ Effacer';
        cancelBtn.textContent  = '✕ Annuler';
        confirmBtn.textContent = '✅ Confirmer';
        clearBtn.style.cssText   = 'padding:8px 16px;background:#e2e8f0;color:#334155;border:none;border-radius:8px;font-weight:700;cursor:pointer;';
        cancelBtn.style.cssText  = 'padding:8px 16px;background:#e2e8f0;color:#334155;border:none;border-radius:8px;font-weight:700;cursor:pointer;';
        confirmBtn.style.cssText = 'padding:8px 16px;background:#22c55e;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;';
        btnRow.appendChild(clearBtn);
        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(confirmBtn);
        card.appendChild(canvasEl);
        card.appendChild(btnRow);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        if (typeof SignaturePad === 'undefined') {
            showToast('Erreur : bibliothèque de signature non chargée.', 'error');
            overlay.remove();
            return;
        }
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvasEl.width  = canvasEl.offsetWidth  * ratio;
        canvasEl.height = canvasEl.offsetHeight * ratio;
        canvasEl.getContext('2d').scale(ratio, ratio);
        const sigPad = new SignaturePad(canvasEl);
        clearBtn.onclick  = () => { sigPad.clear(); };
        cancelBtn.onclick = () => overlay.remove();
        confirmBtn.onclick = () => {
            if (sigPad.isEmpty()) { showToast('Veuillez signer avant de confirmer.', 'warning'); return; }
            inspectionData.clientInfo.clientSignatureUrl = sigPad.toDataURL('image/png');
            saveAppState();
            overlay.remove();
            const indicator = document.getElementById('clientSignatureIndicator');
            if (indicator) { indicator.textContent = 'Signé ✅'; indicator.style.color = '#22c55e'; }
            const signBtnEl = indicator ? indicator.previousElementSibling : null;
            if (signBtnEl) signBtnEl.textContent = '✍️ Modifier la signature';
            showToast('✅ Signature enregistrée', 'success');
        };
    }

    function openAnnotationEditor(photoObj, onSave) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;z-index:9999;display:flex;flex-direction:column;';

        // Header
        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#1e293b;flex-shrink:0;';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = '← Annuler';
        cancelBtn.style.cssText = 'background:none;border:none;color:#94a3b8;font-size:1rem;cursor:pointer;padding:4px 0;';
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.textContent = '✓ Sauvegarder';
        saveBtn.style.cssText = 'background:#22c55e;color:white;border:none;border-radius:6px;padding:8px 16px;font-size:1rem;cursor:pointer;';
        header.appendChild(cancelBtn);
        header.appendChild(saveBtn);

        // Canvas
        const canvasWrap = document.createElement('div');
        canvasWrap.style.cssText = 'flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:8px;';
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'touch-action:none;max-width:100%;max-height:100%;';
        canvasWrap.appendChild(canvas);

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex;gap:8px;padding:10px 16px;background:#1e293b;justify-content:center;flex-wrap:wrap;flex-shrink:0;align-items:center;';

        overlay.appendChild(header);
        overlay.appendChild(canvasWrap);
        overlay.appendChild(toolbar);
        document.body.appendChild(overlay);

        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            const maxW = window.innerWidth - 16;
            const maxH = window.innerHeight - 130;
            const ratio = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
            canvas.width = Math.round(img.naturalWidth * ratio);
            canvas.height = Math.round(img.naturalHeight * ratio);
            redrawCanvas();
        };
        img.src = _isSafePhotoUrl(photoObj.url) ? photoObj.url : '';

        const shapes = [];
        let activeTool = 'arrow';
        let activeColor = '#dc2626';
        let drawing = false;
        let startX = 0, startY = 0;
        let previewShape = null;
        let currentPenShape = null;
        const ANNOTATION_COLORS = ['#dc2626', '#f59e0b', '#3b82f6', '#ffffff'];

        function redrawCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            shapes.forEach(s => drawShape(ctx, s));
        }

        function drawShape(ctx, s) {
            ctx.strokeStyle = s.color;
            ctx.fillStyle = s.color;
            ctx.lineWidth = 2;
            if (s.type === 'arrow') {
                drawArrow(ctx, s.startX, s.startY, s.endX, s.endY);
            } else if (s.type === 'circle') {
                const r = Math.hypot(s.endX - s.startX, s.endY - s.startY);
                ctx.beginPath();
                ctx.arc(s.startX, s.startY, r, 0, Math.PI * 2);
                ctx.stroke();
            } else if (s.type === 'text') {
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(s.text, s.startX, s.startY);
            } else if (s.type === 'pen') {
                if (!s.points || s.points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(s.points[0].x, s.points[0].y);
                s.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            }
        }

        function drawArrow(ctx, x1, y1, x2, y2) {
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const headLen = 14;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(x2, y2);
            ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        }

        function getCanvasPos(e) {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        }

        function startDraw(e) {
            const pos = getCanvasPos(e);
            if (activeTool === 'text') {
                const text = window.prompt('Texte :', '');
                if (text) shapes.push({ type: 'text', startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y, color: activeColor, text });
                redrawCanvas();
                return;
            }
            drawing = true;
            startX = pos.x;
            startY = pos.y;
            if (activeTool === 'pen') {
                currentPenShape = { type: 'pen', points: [{ x: pos.x, y: pos.y }], color: activeColor };
                shapes.push(currentPenShape);
            }
        }

        function moveDraw(e) {
            if (!drawing) return;
            const pos = getCanvasPos(e);
            if (activeTool === 'pen') {
                currentPenShape.points.push({ x: pos.x, y: pos.y });
                redrawCanvas();
                return;
            }
            previewShape = { type: activeTool, startX, startY, endX: pos.x, endY: pos.y, color: activeColor, text: '' };
            redrawCanvas();
            drawShape(ctx, previewShape);
        }

        function endDraw() {
            if (!drawing) return;
            drawing = false;
            if (activeTool === 'pen') {
                if (currentPenShape && currentPenShape.points.length < 2) shapes.pop();
                currentPenShape = null;
                return;
            }
            if (previewShape) { shapes.push(previewShape); previewShape = null; }
        }

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(e); }, { passive: false });
        canvas.addEventListener('mousemove', moveDraw);
        canvas.addEventListener('touchmove', e => { e.preventDefault(); moveDraw(e); }, { passive: false });
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('touchend', e => { e.preventDefault(); endDraw(); }, { passive: false });
        canvas.addEventListener('touchcancel', () => { drawing = false; previewShape = null; currentPenShape = null; redrawCanvas(); });

        const toolBtns = {};
        [{ id: 'arrow', label: '↗ Flèche' }, { id: 'circle', label: '⬤ Cercle' }, { id: 'pen', label: '✏️ Crayon' }, { id: 'text', label: 'T Texte' }].forEach(t => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = t.label;
            btn.style.cssText = `background:${activeTool === t.id ? '#3b82f6' : '#334155'};color:white;border:none;border-radius:6px;padding:7px 11px;font-size:0.82rem;cursor:pointer;`;
            btn.onclick = () => {
                activeTool = t.id;
                Object.values(toolBtns).forEach(b => b.style.background = '#334155');
                btn.style.background = '#3b82f6';
            };
            toolBtns[t.id] = btn;
            toolbar.appendChild(btn);
        });

        const colorBtns = [];
        ANNOTATION_COLORS.forEach(c => {
            const swatch = document.createElement('button');
            swatch.type = 'button';
            swatch.style.cssText = `width:22px;height:22px;border-radius:50%;background:${c};border:2px solid ${c === activeColor ? 'white' : 'transparent'};cursor:pointer;padding:0;flex-shrink:0;`;
            swatch.setAttribute('aria-label', `Couleur ${c}`);
            swatch.onclick = () => {
                activeColor = c;
                colorBtns.forEach(b => b.style.borderColor = 'transparent');
                swatch.style.borderColor = 'white';
            };
            colorBtns.push(swatch);
            toolbar.appendChild(swatch);
        });

        const undoBtn = document.createElement('button');
        undoBtn.type = 'button';
        undoBtn.textContent = '↩ Undo';
        undoBtn.style.cssText = 'background:#475569;color:white;border:none;border-radius:6px;padding:7px 11px;font-size:0.82rem;cursor:pointer;';
        undoBtn.onclick = () => { shapes.pop(); redrawCanvas(); };
        toolbar.appendChild(undoBtn);

        saveBtn.onclick = () => {
            if (!photoObj.originalUrl) photoObj.originalUrl = photoObj.url;
            photoObj.url = canvas.toDataURL('image/jpeg', 0.85);
            overlay.remove();
            onSave();
        };

        cancelBtn.onclick = () => overlay.remove();
    }
});



