'use strict';

function showPanel(id) {
    ['panelLogin', 'panelForgot', 'panelCode', 'panelNewPwd'].forEach(function (p) {
        document.getElementById(p).classList.remove('active');
    });
    document.getElementById(id).classList.add('active');
}
function showLogin()  { showPanel('panelLogin');  }
function showForgot() { showPanel('panelForgot'); }

async function handleLogin() {
    const pwd = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const err = document.getElementById('loginError');
    if (!pwd) { err.textContent = 'Veuillez entrer le mot de passe.'; return; }
    btn.disabled = true;
    btn.textContent = '…';
    try {
        const ok = await KZOAuth.login(pwd);
        if (ok) {
            window.location.replace('index.html');
        } else {
            err.textContent = 'Mot de passe incorrect.';
            document.getElementById('loginPassword').value = '';
            document.getElementById('loginPassword').focus();
            btn.disabled = false;
            btn.textContent = 'Entrer';
        }
    } catch (e) {
        err.textContent = e.message;
        document.getElementById('loginPassword').value = '';
        btn.disabled = false;
        btn.textContent = 'Entrer';
    }
}

async function handleSendCode() {
    const btn = document.getElementById('sendCodeBtn');
    const err = document.getElementById('forgotError');
    btn.disabled = true;
    btn.textContent = '…';
    try {
        const sent = await KZOAuth.sendResetEmail();
        if (sent) {
            showPanel('panelCode');
            document.getElementById('resetCode').focus();
        } else {
            err.textContent = 'EmailJS non configuré. Ajoutez les clés dans config.js.';
            btn.disabled = false;
            btn.textContent = '📧 Envoyer le code';
        }
    } catch (e) {
        err.textContent = 'Erreur : ' + (e.text || e.message || JSON.stringify(e));
        btn.disabled = false;
        btn.textContent = '📧 Envoyer le code';
    }
}

async function handleVerifyCode() {
    const code = document.getElementById('resetCode').value.trim();
    const err  = document.getElementById('codeError');
    const ok   = await KZOAuth.verifyResetCode(code);
    if (!ok) { err.textContent = 'Code invalide ou expiré.'; return; }
    showPanel('panelNewPwd');
    document.getElementById('newPassword').focus();
}

async function handleSetPassword() {
    const pwd  = document.getElementById('newPassword').value;
    const conf = document.getElementById('confirmPassword').value;
    const err  = document.getElementById('newPwdError');
    const succ = document.getElementById('newPwdSuccess');
    if (pwd.length < 6)  { err.textContent = 'Minimum 6 caractères.'; return; }
    if (pwd !== conf)    { err.textContent = 'Les mots de passe ne correspondent pas.'; return; }
    await KZOAuth.setNewPassword(pwd);
    err.textContent  = '';
    succ.textContent = '✅ Mot de passe mis à jour ! Reconnectez-vous.';
    setTimeout(showLogin, 2000);
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('sendCodeBtn').addEventListener('click', handleSendCode);
    document.querySelector('#panelCode .btn-primary').addEventListener('click', handleVerifyCode);
    document.querySelector('#panelNewPwd .btn-primary').addEventListener('click', handleSetPassword);
    document.querySelector('#panelLogin .forgot-link').addEventListener('click', showForgot);
    document.querySelectorAll('.forgot-link[data-back]').forEach(function (b) {
        b.addEventListener('click', showLogin);
    });
    document.getElementById('loginPassword').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('resetCode').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleVerifyCode();
    });
});
