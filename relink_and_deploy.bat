@echo off
setlocal
echo ========================================================
echo   Removing old .vercel and relinking to vignan-connect
echo ========================================================

d:
cd \vignan_connect\web

echo Current Directory: %CD%

:: Remove old corrupted/mismatched .vercel directory
if exist ".vercel" (
    echo Removing old .vercel directory...
    rmdir /s /q ".vercel"
)

echo.
echo Linking and deploying to Vercel production...
echo.

:: Deploy and link interactively or with defaults
call npx vercel --prod

echo.
echo Done!
pause
