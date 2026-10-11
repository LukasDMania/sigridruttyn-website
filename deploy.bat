@echo off
rem Build the Astro site into dist\ and deploy it to Cloudflare Pages (project "sigrid-ruttyn").
setlocal
cd /d "%~dp0"

call npm install || goto :error
call npm run build || goto :error
call npx wrangler pages deploy dist --project-name=sigrid-ruttyn --branch=main --commit-dirty=true || goto :error

echo.
echo Deployed: https://sigrid-ruttyn.pages.dev
exit /b 0

:error
echo.
echo Deploy failed.
exit /b 1
