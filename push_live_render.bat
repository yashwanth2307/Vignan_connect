@echo off
setlocal
echo ========================================================
echo   Updating V-Connect Frontend with Live Render Backend!
echo ========================================================

:: Ensure System32 & Git in PATH
set "PATH=%SystemRoot%\System32;%SystemRoot%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd;%PATH%"

d:
cd \vignan_connect

echo 1. Committing live backend configuration...
git add .
git commit -m "feat(config): link live Render backend https://vignan-connect.onrender.com for API and WebSockets"

echo 2. Pushing to GitHub (origin main)...
git push origin main

echo.
echo ========================================================
echo   SUCCESS! 
echo   GitHub pushed! Vercel is now deploying the frontend
echo   connected to your live Render backend!
echo ========================================================
pause
