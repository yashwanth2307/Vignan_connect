@echo off
setlocal
echo ========================================================
echo   Building and Deploying Pure Native WebRTC Classroom
echo ========================================================

d:
cd \vignan_connect\web

echo 1. Prebuilding locally with Next.js...
call npx vercel build --prod --yes

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Running direct deploy fallback...
    call npx vercel --prod --yes
    pause
    exit /b
)

echo.
echo 2. Uploading prebuilt production bundle...
call npx vercel deploy --prebuilt --prod --yes

echo.
echo Done! Native classroom deployed.
pause
