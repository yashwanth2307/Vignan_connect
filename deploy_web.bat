@echo off
setlocal
echo ========================================================
echo   Deploying Vignan Connect from D:\vignan_connect\web
echo ========================================================

:: 1. Force the current drive to D:
d:
cd \vignan_connect\web

echo Current working directory: %CD%

:: 2. Run vercel explicitly on current directory
call npx vercel . --prod --yes

echo.
echo Deployment finished.
pause
