@echo off
setlocal
echo ========================================================
echo   Pushing Vercel outputDirectory fix to GitHub
echo ========================================================

set "PATH=%SystemRoot%\System32;%SystemRoot%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd;%PATH%"

d:
cd \vignan_connect

git add .
git commit -m "fix(vercel): point outputDirectory to web/.next for monorepo build"
git push origin main

echo.
echo ========================================================
echo   Done! Pushed to GitHub. Check Vercel build now.
echo ========================================================
pause
