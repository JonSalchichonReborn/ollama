@echo off
setlocal
cd /d "%~dp0"
set "PORT=5173"

where node >nul 2>nul
if not errorlevel 1 goto usenode

python --version >nul 2>nul
if not errorlevel 1 goto usepython

goto unavailable

:usenode
echo Serving OllamaChat on http://localhost:%PORT%/ using Node.js
echo Close this window to stop the server.
echo.
start "" "http://localhost:%PORT%/index.html"
node serve.js
echo.
echo Server stopped.
pause
exit /b 0

:usepython
echo Serving OllamaChat on http://localhost:%PORT%/ using Python
echo Close this window to stop the server.
echo.
start "" "http://localhost:%PORT%/index.html"
python -m http.server %PORT%
echo.
echo Server stopped.
pause
exit /b 0

:unavailable
echo.
echo [ERROR] Neither Node.js nor Python was found on your PATH.
echo.
echo You can still open index.html directly in your browser,
echo or install Node.js from https://nodejs.org/ or Python from https://www.python.org/downloads/
echo.
pause
exit /b 1
