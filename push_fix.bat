@echo off
setlocal
echo ========================================================
echo   Pushing Classroom Fix to GitHub for Instant Vercel Deploy
echo ========================================================

set "PATH=%SystemRoot%\System32;%SystemRoot%;C:\Program Files\Git\bin;C:\Program Files\Git\cmd;%PATH%"

d:
cd \vignan_connect

echo 1. Adding all updated files...
git add .

echo 2. Committing live audio playback fix...
git commit -m "fix(classroom): hardcode live Render backend and add RemoteParticipantTile with explicit audio autoplay"

echo 3. Pushing to GitHub (origin main)...
git push origin main

echo.
echo ========================================================
echo   Done! Check https://vignan-connect.vercel.app 
echo   in 1-2 minutes after Vercel finishes the cloud build!
echo ========================================================
pause
