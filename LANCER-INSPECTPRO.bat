title InspectPro - Serveur Local
echo.
echo  ====================================================
echo   InspectPro - Demarrage du serveur local...
echo  ====================================================
echo.
echo  L'application sera disponible sur :
echo  http://localhost:8080/InspectPro.html
echo.
echo  Ne fermez pas cette fenetre pendant l'utilisation.
echo  Fermez-la pour arreter le serveur.
echo.

cd /d "%~dp0"

REM --- Essayer Python 3 d'abord ---
python -m http.server 8080 2>nul
if %errorlevel% equ 0 goto :done

REM --- Essayer Python (alias) ---
python3 -m http.server 8080 2>nul
if %errorlevel% equ 0 goto :done

REM --- Si Python n'est pas installe ---
echo.
echo  ATTENTION: Python n'est pas installe.
echo  Ouvrez simplement InspectPro.html dans votre navigateur.
echo  (La cle API devra etre ressaisie a chaque session)
echo.
pause
start "" "InspectPro.html"

:done
