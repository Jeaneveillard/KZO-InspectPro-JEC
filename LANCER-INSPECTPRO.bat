@echo off
title KZO InspectPro
cd /d "%~dp0"

:: Verifier si le serveur tourne deja sur le port 8000
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo  Serveur deja actif.
) else (
    echo  Demarrage du serveur...
    start "" /min powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0serve.ps1"
    timeout /t 2 /nobreak >nul
)

:: Ouvrir l'app dans le navigateur par defaut
start "" "http://localhost:8000"
exit
