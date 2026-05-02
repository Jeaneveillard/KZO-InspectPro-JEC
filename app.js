document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. Sécurité et Utilitaires ---
    
    // Anti-XSS : Échapper tout contenu utilisateur avant insertion HTML
    function sanitizeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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

    // Compression photo avant stockage localStorage (évite la saturation)
    function compressImage(file, maxWidth = 1200, quality = 0.75) {
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

    // Protection légère : désactiver le clic droit sur les images uniquement
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('contextmenu', e => e.preventDefault());
    });

    // Charger les données persistées depuis localStorage
    const savedInspectorName = localStorage.getItem('inspectpro_inspector_name') || '';
    let savedClientNames = [];
    try { savedClientNames = JSON.parse(localStorage.getItem('inspectpro_client_names')) || []; } catch(e) { savedClientNames = []; }
    if (!Array.isArray(savedClientNames) || savedClientNames.length === 0) savedClientNames = [''];
    const savedClientAddress = localStorage.getItem('inspectpro_client_address') || '';
    inspectionData.clientInfo.inspectorName = savedInspectorName;
    inspectionData.clientInfo.names = savedClientNames;
    inspectionData.clientInfo.name = savedClientNames.filter(n => n).join(' & ');
    inspectionData.clientInfo.address = savedClientAddress;

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

    // Initialisation des unités
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

        // --- Standard Section Rendering ---
        section.subSections.forEach(sub => {
            const div = document.createElement('div');
            div.className = 'sub-section';
            
            const h3 = document.createElement('h3');
            h3.textContent = sub.title;
            div.appendChild(h3);

            sub.fields.forEach(field => {
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
                    infoDiv.innerHTML = field.content;
                    fieldGroup.appendChild(infoDiv);
                } else if (field.type === 'action') {
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
            galleryTitle.textContent = '📸 Photos additionnelles (' + sub.title + ')';
            galleryTitle.style.cssText = 'margin-top: 0; margin-bottom: 12px; font-size: 0.95rem; color: #475569;';
            galleryContainer.appendChild(galleryTitle);

            const grid = document.createElement('div');
            grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px; margin-bottom: 12px;';
            
            const renderGallery = () => {
                grid.innerHTML = '';
                const photos = getActiveSectionPhotos()[sub.id] || [];
                photos.forEach((photoObj, i) => {
                    const wrap = document.createElement('div');
                    wrap.style.cssText = 'position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
                    
                    const img = document.createElement('img');
                    img.src = photoObj.url;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                    
                    const delBtn = document.createElement('button');
                    delBtn.innerHTML = '✕';
                    delBtn.title = 'Supprimer cette photo';
                    delBtn.style.cssText = 'position: absolute; top: 4px; right: 4px; background: rgba(220, 38, 38, 0.9); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;';
                    delBtn.onclick = () => {
                        getActiveSectionPhotos()[sub.id].splice(i, 1);
                        saveAppState();
                        renderGallery();
                    };
                    
                    wrap.appendChild(img);
                    wrap.appendChild(delBtn);
                    grid.appendChild(wrap);
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
                        // Compresser en data URL pour persister dans localStorage
                        const dataUrl = await compressImage(file, 1200, 0.75);
                        const store = getActiveSectionPhotos();
                        if (!store[sub.id]) store[sub.id] = [];
                        store[sub.id].push({ url: dataUrl });
                        saveAppState();
                    } else {
                        showToast(check.error, 'error');
                    }
                }
                renderGallery();
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
                <div style="font-weight: 700; font-size: 1rem; color: #1e40af; margin-bottom: 12px;">🗂️ Commentaire global — ${section.title}</div>
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
                if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport') return;
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
                    showToast('Recommandation insérée dans le commentaire.', 'success');
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
        const stripped = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
        const decoder = document.createElement('div');
        decoder.innerHTML = stripped;
        textarea.value = decoder.textContent.trim();
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
        // Appliquer le résultat de l'analyse au rapport — marquer comme défaut dans l'unité active
        if (currentVisionField) {
            const activeStates = getActiveFieldStates();
            activeStates[currentVisionField.id] = 'defaut';
            saveAppState();
        }
        modal.classList.remove('open');
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
    chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendChatMessage(); });

    // --- 6. Génération du Rapport Final ---
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

        // Déterminer quelle unité utiliser
        const targetUnit = unitId
            ? inspectionData.units.find(u => u.id === unitId)
            : getCurrentUnit();
        const unitFieldStates = targetUnit.fieldStates || {};
        const unitComments = targetUnit.comments || {};
        const unitSectionComments = targetUnit.sectionComments || {};
        const unitSectionPhotos = targetUnit.sectionPhotos || {};
        const unitName = targetUnit.name || '';
        const isMultiMode = isMultiUnitBuilding() && inspectionData.units.length > 1;

        const reportModal = document.getElementById('reportModal');
        const reportContent = document.getElementById('reportContent');
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
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport') return;
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

        // SOMMAIRE EXÉCUTIF avec compteur
        const hasIssues = totalUrgents > 0 || totalMajeurs > 0 || totalSurveiller > 0;
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
            </div>
        `;

        // CORPS DU RAPPORT
        let defectCount = 0;
        inspectionData.sections.forEach(section => {
            if (section.id === 's_cover' || section.id === 's_admin' || section.id === 's_rapport') return;

            html += `<div class="page-break" style="padding-top: 50px;">
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
                        infoHtml += `<img src="${photo.url}" style="width: 180px; height: 135px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;">`;
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

            html += "</div>";
        });

        // ATTESTATION
        if (BOILERPLATE.attestation) html += BOILERPLATE.attestation(clientName, safeInspectorName, signatureUrl, sealUrl);

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

        reportContent.innerHTML = html;
        reportModal.style.display = 'flex';

        // --- SYNCHRONISATION GOOGLE SHEETS ---
        // Envoie les données de l'inspection vers Google Sheets pour archivage
        const webhookUrl = (typeof KZO_CONFIG !== 'undefined' && KZO_CONFIG.SHEETS_WEBHOOK_URL) ? KZO_CONFIG.SHEETS_WEBHOOK_URL : '';
        if (webhookUrl) {
            try {
                const syncData = {
                    // Identification
                    date_rapport: new Date().toLocaleDateString('fr-CA'),
                    date_inspection: dateInspection,
                    facture_id: inspectionData.id,
                    numero_dossier: inspectionData.id,

                    // Client
                    client: clientName,
                    adresse_propriete: address,

                    // Propriété
                    type_batiment: typeBatiment,
                    annee_construction: annee,
                    superficie: superficie,
                    type_garage: typeGarage,
                    meteo: meteo,
                    temperature: temperature,

                    // Inspecteur
                    inspecteur: inspectorName,
                    entreprise: window.AppCompanyProfile ? window.AppCompanyProfile.name : 'KZO InspectPro',
                    norme_applicable: norme,

                    // Résultats
                    defauts_urgents: totalUrgents,
                    defauts_majeurs: totalMajeurs,
                    a_surveiller: totalSurveiller,
                    conformes: totalConformes,
                    etat_general: document.getElementById('rap_etat_general')?.value || 'Non évalué',

                    // Financier
                    montant_facture: prix,

                    // Notes
                    travaux_prioritaires: document.getElementById('rap_priorite')?.value || '',
                    notes_inspecteur: document.getElementById('rap_notes')?.value || ''
                };

                fetch(webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(syncData)
                });
                console.log("✅ Synchronisation Google Sheets envoyée", syncData);
            } catch(e) {
                console.error("⚠️ Erreur Webhook Google Sheets :", e);
            }
        } else {
            console.log("ℹ️ Aucune URL Google Sheets configurée dans config.js");
        }

        document.getElementById('closeReportBtn').onclick = () => { reportModal.style.display = 'none'; };
        document.getElementById('printReportBtn').onclick = () => { setTimeout(() => window.print(), 500); };
    }

    // --- Persistence Globale (Offline Support) ---
    function saveAppState() {
        try {
            const toSave = {
                clientInfo: inspectionData.clientInfo,
                id: inspectionData.id,
                // Données multi-unités (fieldStates, comments, sectionComments, sectionPhotos
                // sont stockés dans units — pas besoin de les dupliquer)
                units: inspectionData.units,
                currentUnitId: inspectionData.currentUnitId
            };
            localStorage.setItem('kzo_inspection_data', JSON.stringify(toSave));
        } catch(e) { console.error("Erreur sauvegarde", e); }
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
        if (!confirm('⚠️ Êtes-vous sûr de vouloir démarrer une nouvelle inspection ?\nToutes les données actuelles seront effacées.')) return;
        localStorage.removeItem('kzo_inspection_data');
        // Réinitialiser clientInfo avec la structure attendue (évite crash sur .names)
        inspectionData.clientInfo = {
            inspectorName: localStorage.getItem('inspectpro_inspector_name') || '',
            names: [''],
            name: '',
            address: '',
            coverPhotoUrl: null,
            signatureUrl: null,
            sealUrl: null
        };
        inspectionData.id = 'KZO-' + Date.now().toString().slice(-5);
        // Reset unités (les proxies fieldStates/comments/etc. pointent vers units[0])
        inspectionData.units = [
            { id: 'unit_1', name: 'Unité 1', fieldStates: {}, comments: {}, sectionComments: {}, sectionPhotos: {} }
        ];
        inspectionData.currentUnitId = 'unit_1';
        currentSectionIndex = 0;
        renderUnitTabs();
        renderNavigation();
        renderSection(0);
        showToast('Nouvelle inspection démarrée !', 'success');
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

    // Bouton de sauvegarde manuelle
    const forceSync = () => {
        saveAppState();
        showToast('Données sauvegardées localement.', 'success');
    };



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
    
    renderNavigation();
    renderSection(0);
    renderUnitTabs(); // Afficher la barre d'unités si applicable

    // Patch for the manual sync button in the UI
    document.addEventListener('click', (e) => {
        if (e.target.textContent && e.target.textContent.includes('Forcer la sauvegarde locale')) {
            forceSync();
        }
    });

    // Enregistrement du Service Worker pour le mode hors ligne (iPad, tablette)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('KZO InspectPro : mode hors ligne actif'))
            .catch(err => console.warn('Service Worker non enregistré :', err));
    }
});



