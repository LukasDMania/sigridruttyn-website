@echo off
title Sigrid Ruttyn - website
cd /d "%~dp0"
echo Stopping any dev server that is still running...
call npx astro dev stop >nul 2>&1
call npm install
start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:4321/"
call npm run dev
