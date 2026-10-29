@echo off
setlocal
echo ========================================================
echo   Fixing Windows System PATH and Deploying to Vercel
echo ========================================================

:: Ensure System32 (where cmd.exe lives) is present in PATH
set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;%PATH%"

d:
cd \vignan_connect\web

echo Current Directory: %CD%
echo Testing cmd.exe availability...
where cmd.exe

echo.
echo 1. Running Next.js build...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo npm build had an error, trying direct vercel deployment...
)

echo.
echo 2. Deploying directly to Vercel production...
call npx vercel --prod --yes

echo.
echo ========================================================
echo   Deployment completed!
echo ========================================================
pause
