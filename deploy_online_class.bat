@echo off
setlocal
echo ========================================================
echo   Running Vercel Local Build & Production Deployment
echo ========================================================

d:
cd \vignan_connect\web

echo 1. Generating Vercel prebuilt output locally...
call npx vercel build --prod --yes

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Vercel build had an issue, falling back to direct deploy...
    call npx vercel --prod --yes
    pause
    exit /b
)

echo.
echo 2. Uploading prebuilt bundle directly to production...
call npx vercel deploy --prebuilt --prod --yes

echo.
echo ========================================================
echo   Deployment completed successfully!
echo ========================================================
pause
