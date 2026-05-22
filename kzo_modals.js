// kzo_modals.js — Logique des modales : Paiement, Signature à distance, Réparations
// Chargé après app.js. Utilise window.showToast, window._confirmModal, window.inspectionData.

(function () {
    'use strict';

    const _toast = (msg, type) =>
        window.showToast ? window.showToast(msg, type || 'info') : alert(msg);

    // ────────────────────────────────────────────────────────────────
    // MODALE PAIEMENT
    // ────────────────────────────────────────────────────────────────
    window.openPaymentModal = function () {
        document.getElementById('paymentModal').style.display = 'flex';
        document.getElementById('interacDetails').style.display = 'none';
        document.getElementById('payMethods').style.display = 'block';

        try {
            let currentPrice = document.getElementById('prix_inspection')
                ? document.getElementById('prix_inspection').value : '';
            if (!currentPrice) currentPrice = window.inspectionData?.units?.[0]?.fieldStates?.['prix_inspection'];
            if (currentPrice) document.getElementById('payAmount').value = currentPrice;

            let clientName = '';
            const clientInputs = document.querySelectorAll('#clientsContainer input[type="text"]');
            if (clientInputs && clientInputs.length > 0) {
                const names = [];
                clientInputs.forEach(i => { if (i.value.trim()) names.push(i.value.trim()); });
                clientName = names.join(' et ');
            }
            if (!clientName) clientName = window.inspectionData?.clientInfo?.name
                || window.inspectionData?.clientInfo?.names?.[0] || 'Non défini';

            let propAddr = document.getElementById('prop_address')
                ? document.getElementById('prop_address').value : '';
            if (!propAddr) propAddr = window.inspectionData?.units?.[0]?.fieldStates?.['prop_address'] || 'Non définie';

            let inspId = document.getElementById('inspection_code')
                ? document.getElementById('inspection_code').value : '';
            if (!inspId) inspId = window.inspectionData?.units?.[0]?.fieldStates?.['inspection_code']
                || window.inspectionData?.id || 'N/A';

            document.getElementById('payClientName').textContent  = clientName;
            document.getElementById('payPropAddress').textContent = propAddr;
            document.getElementById('payInspNumber').textContent  = inspId;
        } catch (e) { /* champs non encore rendus */ }

        window.calcPaymentTotal();
    };

    window.calcPaymentTotal = function () {
        const amt      = parseFloat(document.getElementById('payAmount').value) || 0;
        const hasTaxes = document.getElementById('payTaxes').checked;
        const tps      = hasTaxes ? amt * 0.05    : 0;
        const tvq      = hasTaxes ? amt * 0.09975 : 0;
        const total    = amt + tps + tvq;

        document.getElementById('taxDetailsBlock').style.display = hasTaxes ? 'block' : 'none';
        document.getElementById('paySubtotalDisplay').textContent = amt.toFixed(2)   + ' $';
        document.getElementById('payTpsDisplay').textContent      = tps.toFixed(2)   + ' $';
        document.getElementById('payTvqDisplay').textContent      = tvq.toFixed(2)   + ' $';
        document.getElementById('payTotalDisplay').textContent    = total.toFixed(2) + ' $';

        window._currentPaymentTotal = total.toFixed(2);
        window._currentPaymentTps   = tps.toFixed(2);
        window._currentPaymentTvq   = tvq.toFixed(2);
    };

    window.showInteracDetails = function () {
        const cfg     = (typeof KZO_CONFIG       !== 'undefined') ? KZO_CONFIG       : {};
        const profile = (typeof KZO_OWNER_PROFILE !== 'undefined') ? KZO_OWNER_PROFILE : {};
        const email    = cfg.interac_email    || profile.email || '';
        const question = cfg.interac_question || 'inspection';
        const reponse  = cfg.interac_reponse  || '';

        const emailEl = document.getElementById('interacEmailDisplay');
        if (emailEl) emailEl.textContent = email;

        const qrBlock = document.getElementById('interacQRBlock');
        if (qrBlock) {
            if (reponse) {
                document.getElementById('interacQDisplay').textContent = question;
                document.getElementById('interacRDisplay').textContent = reponse;
                qrBlock.style.display = 'block';
            } else {
                qrBlock.style.display = 'none';
            }
        }
        document.getElementById('payMethods').style.display   = 'none';
        document.getElementById('interacDetails').style.display = 'block';
    };

    window.markInteracAsPaid = function () {
        document.getElementById('paymentModal').style.display = 'none';
        try {
            if (!window.inspectionData.units[0].fieldStates)
                window.inspectionData.units[0].fieldStates = {};

            const baseAmt  = document.getElementById('payAmount').value;
            const hasTaxes = document.getElementById('payTaxes').checked;
            const total    = window._currentPaymentTotal;
            const tps      = window._currentPaymentTps;
            const tvq      = window._currentPaymentTvq;
            const dateStr  = new Date().toLocaleString('fr-CA');

            const clientName = document.getElementById('payClientName').textContent;
            const propAddr   = document.getElementById('payPropAddress').textContent;
            const inspId     = document.getElementById('payInspNumber').textContent;

            let receipt = 'REÇU DE PAIEMENT - Virement Interac\n';
            receipt += `Facturé à : ${clientName}\nAdresse : ${propAddr}\nDossier : ${inspId}\nDate : ${dateStr}\n\n`;
            receipt += hasTaxes
                ? `Sous-total : ${parseFloat(baseAmt).toFixed(2)} $\nTPS (5%) : ${tps} $\nTVQ (9.975%) : ${tvq} $\nTotal payé : ${total} $`
                : `Montant payé : ${total} $`;

            window.inspectionData.units[0].fieldStates['paiement_statut'] = receipt;
            window.inspectionData.units[0].fieldStates['prix_inspection'] = baseAmt;

            if (window.saveAppState) window.saveAppState();

            if (document.getElementById('paiement_statut')) {
                document.getElementById('paiement_statut').value = receipt;
                if (document.getElementById('prix_inspection'))
                    document.getElementById('prix_inspection').value = baseAmt;
            }
            _toast('Le reçu a été annexé avec succès dans la section "1. Documents & Pré-inspection" (Client & Contrat).', 'success');
        } catch (e) {
            console.error(e);
        }
    };

    // ────────────────────────────────────────────────────────────────
    // SIGNATURE À DISTANCE
    // ────────────────────────────────────────────────────────────────
    window.openRemoteSignModal = function () {
        try {
            let clientName = '';
            const clientInputs = document.querySelectorAll('#clientsContainer input[type="text"]');
            if (clientInputs && clientInputs.length > 0) {
                const names = [];
                clientInputs.forEach(i => { if (i.value.trim()) names.push(i.value.trim()); });
                clientName = names.join(' et ');
            }
            if (!clientName) clientName = window.inspectionData?.clientInfo?.name
                || window.inspectionData?.clientInfo?.names?.[0] || 'Client(e)';

            let propAddr = document.getElementById('prop_address')
                ? document.getElementById('prop_address').value : '';
            if (!propAddr) propAddr = window.inspectionData?.units?.[0]?.fieldStates?.['prop_address']
                || 'Adresse non définie';

            let clientEmail = document.getElementById('client_email')
                ? document.getElementById('client_email').value : '';
            if (!clientEmail) clientEmail = window.inspectionData?.clientInfo?.email || '';

            document.getElementById('remoteSignClientName').textContent = clientName;
            document.getElementById('remoteSignAddress').textContent    = propAddr;
            document.getElementById('remoteSignEmailInput').value       = clientEmail;

            document.getElementById('remoteSignModal').style.display = 'flex';
        } catch (e) {
            console.error('Erreur openRemoteSignModal:', e);
        }
    };

    window.sendRemoteSignEmail = function () {
        const email         = document.getElementById('remoteSignEmailInput').value;
        const clientName    = document.getElementById('remoteSignClientName').textContent;
        const propAddr      = document.getElementById('remoteSignAddress').textContent;
        const inspectorName = document.getElementById('inspector_name')?.value
            || window.inspectionData?.clientInfo?.inspectorName || 'Votre Inspecteur';

        if (!email) {
            _toast('Veuillez entrer une adresse courriel valide.', 'warning');
            return;
        }

        const subject  = encodeURIComponent(`Convention de service d'inspection - ${propAddr}`);
        const bodyText = `Bonjour ${clientName},

Voici votre convention de service concernant l'inspection en bâtiment pour la propriété située au :
${propAddr}

Conformément aux normes de l'industrie, nous devons obtenir votre acceptation avant de débuter l'inspection.

ACTION REQUISE DE VOTRE PART :
Veuillez simplement répondre à ce courriel en écrivant :
"J'AI LU ET J'ACCEPTE LA CONVENTION DE SERVICE"

Merci de votre confiance,
${inspectorName}
KZO InspectPro
`;
        window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
        document.getElementById('remoteSignModal').style.display = 'none';
        _toast("Votre application de courriel devrait s'ouvrir. N'oubliez pas d'y joindre votre document PDF si nécessaire.", 'info');
    };

    // ────────────────────────────────────────────────────────────────
    // RÉPARATIONS
    // ────────────────────────────────────────────────────────────────
    window.openRepairBuilder = function () {
        if (typeof inspectionData === 'undefined' || !inspectionData?.units?.[0]) {
            _toast("Veuillez d'abord commencer une inspection.", 'warning');
            return;
        }

        const currentUnit    = inspectionData.units.find(u => u.id === inspectionData.currentUnitId) || inspectionData.units[0];
        const listContainer  = document.getElementById('repairListContainer');
        listContainer.innerHTML = '';

        const fieldStates    = currentUnit.fieldStates    || {};
        const comments       = currentUnit.comments       || {};
        const sectionComments = currentUnit.sectionComments || {};
        let defectsCount = 0;
        const addedItems = new Set();

        const addDefect = (title, text, severity) => {
            const hash = title + text;
            if (addedItems.has(hash)) return;
            addedItems.add(hash);
            defectsCount++;

            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = 'display:flex; gap:10px; padding:12px; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:10px; background:#f8fafc; align-items:flex-start;';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox'; checkbox.checked = true;
            checkbox.className = 'repair-checkbox';
            checkbox.style.cssText = 'width:20px; height:20px; margin-top:3px; cursor:pointer;';

            const textDiv  = document.createElement('div');
            textDiv.style.flex = '1';

            const sevBadge = document.createElement('span');
            sevBadge.style.cssText = 'display:inline-block; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:bold; margin-bottom:5px;';
            if (severity === 'urgent') {
                sevBadge.textContent = '🔴 URGENT';
                sevBadge.style.cssText += 'background:#fee2e2; color:#dc2626;';
            } else if (severity === 'majeur') {
                sevBadge.textContent = '🟠 MAJEUR';
                sevBadge.style.cssText += 'background:#fef3c7; color:#d97706;';
            } else {
                sevBadge.textContent = '🟡 MINEUR / À SURVEILLER';
                sevBadge.style.cssText += 'background:#fef9c3; color:#ca8a04;';
            }

            const desc = document.createElement('p');
            desc.textContent = (title ? `[${title}] ` : '') + text;
            desc.className = 'repair-desc';
            desc.style.cssText = 'margin:0; font-size:0.9rem; color:#334155; line-height:1.4;';

            textDiv.appendChild(sevBadge);
            textDiv.appendChild(desc);
            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(textDiv);
            listContainer.appendChild(itemDiv);
        };

        if (inspectionData.sections) {
            inspectionData.sections.forEach(section => {
                if (['s_cover','s_admin','s_rapport','s_preview'].includes(section.id)) return;
                (section.subSections || []).forEach(sub => {
                    (sub.fields || []).forEach(field => {
                        const state = fieldStates[field.id];
                        if (state !== 'defaut' && state !== 'surveiller') return;
                        let sev = state === 'defaut' ? 'majeur' : 'mineur';
                        const lbl = field.label.toLowerCase();
                        if (lbl.includes('fissure') || lbl.includes('fuite') || lbl.includes('danger') || lbl.includes('structure'))
                            sev = 'urgent';
                        const commentText = (comments[sub.id] && comments[sub.id].text)
                            ? ' - ' + comments[sub.id].text : '';
                        addDefect(section.title, field.label + commentText, sev);
                    });
                });
            });
        }

        const allComments = [...Object.values(comments), ...Object.values(sectionComments)];
        for (const c of allComments) {
            if (!c || !c.text?.trim()) continue;
            const txt = c.text.toLowerCase();
            if (c.severity === 'urgent' || c.severity === 'majeur' || c.severity === 'mineur'
                || txt.includes('défaut') || txt.includes('anomalie') || txt.includes('fissure') || txt.includes('fuite')) {
                let sev = c.severity || 'majeur';
                if (txt.includes('fissure') || txt.includes('fuite')) sev = 'urgent';
                addDefect('', c.text, sev);
            }
        }

        if (defectsCount === 0) {
            const p = document.createElement('p');
            p.style.cssText = 'color:#64748b; font-style:italic; text-align:center; padding:20px;';
            p.textContent = "Aucun défaut ou commentaire de sévérité n'a été détecté pour le moment.";
            listContainer.appendChild(p);
        }

        document.getElementById('repairModal').style.display = 'flex';
    };

    window.copyRepairList = function () {
        const checkboxes   = document.querySelectorAll('.repair-checkbox');
        const descriptions = document.querySelectorAll('.repair-desc');
        let textToCopy = 'SOMMAIRE DES DEMANDES DE RÉPARATIONS / VÉRIFICATIONS :\n\n';
        let count = 0;

        for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                count++;
                textToCopy += `${count}. ${descriptions[i].textContent}\n\n`;
            }
        }

        if (count === 0) {
            _toast('Veuillez sélectionner au moins un item.', 'warning');
            return;
        }
        textToCopy += "Basé sur le rapport d'inspection fourni par KZO InspectPro.";

        navigator.clipboard.writeText(textToCopy)
            .then(() => _toast('Copié dans le presse-papier ! Collez-le dans un courriel ou un addendum.', 'success'))
            .catch(err => {
                console.error('Erreur de copie:', err);
                _toast('Erreur lors de la copie. Sélectionnez le texte manuellement.', 'error');
            });
    };

    // ────────────────────────────────────────────────────────────────
    // CÂBLAGE DES ÉVÉNEMENTS (remplace tous les onclick= inline)
    // ────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        const on = (id, ev, fn) => document.getElementById(id)?.addEventListener(ev, fn);
        const hide = id => () => { document.getElementById(id).style.display = 'none'; };

        // Top bar
        on('payBtn',    'click',  () => window.openPaymentModal());
        on('repairBtn', 'click',  () => window.openRepairBuilder());
        on('logoutBtn', 'click',  () => window.KZOAuth && window.KZOAuth.logout());
        on('driveSyncIndicator', 'click', () => window.GoogleDrive && window.GoogleDrive.retrySync());

        // Modale Paiement
        on('closePaymentModalBtn',  'click',  hide('paymentModal'));
        on('showInteracBtn',        'click',  () => window.showInteracDetails());
        on('markPaidBtn',           'click',  () => window.markInteracAsPaid());
        on('payAmount',             'input',  () => window.calcPaymentTotal());
        on('payTaxes',              'change', () => window.calcPaymentTotal());

        // Modale Signature à distance
        on('remoteSignCancelBtn', 'click', hide('remoteSignModal'));
        on('remoteSignSendBtn',   'click', () => window.sendRemoteSignEmail());

        // Modale Réparations
        on('closeRepairModalBtn',  'click', hide('repairModal'));
        on('closeRepairModalBtn2', 'click', hide('repairModal'));
        on('copyRepairBtn',        'click', () => window.copyRepairList());
    });

})();
