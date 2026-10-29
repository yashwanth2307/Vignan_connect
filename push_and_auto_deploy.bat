@echo off
setlocal
echo ========================================================
echo   Pushing to GitHub to trigger automatic Vercel Deploy
echo ========================================================

:: Ensure Git & System32 are in PATH
set "PATH=%SystemRoot%\System32;%SystemRoot%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd;%PATH%"

d:
cd \vignan_connect

echo Staging all changes...
git add .

echo Committing...
git commit -m "feat(classroom): native WebRTC video mesh, shared whiteboard, screen share, and admin controls"

echo Pushing to GitHub (origin main)...
git push origin main

echo.
echo ========================================================
echo   Pushed to GitHub! 
echo   Vercel will now automatically build and deploy 
echo   your project without any local upload drops!
echo ========================================================
pause
