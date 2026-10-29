Write-Host "--- Git Status & Configuring ---" -ForegroundColor Cyan
Set-Location -Path "D:\vignan_connect"
git config user.name "yashwanth2307"
git config user.email "billapatiyashwanthreddy@gmail.com"

Write-Host "--- Adding Files ---" -ForegroundColor Cyan
git add .

Write-Host "--- Committing ---" -ForegroundColor Cyan
git commit -m "feat(classroom): add audio/video enhancements, broadcast whiteboard, screen share with audio, admin moderation controls, and class recording"

Write-Host "--- Pushing to GitHub (origin main) ---" -ForegroundColor Cyan
git push origin main

Write-Host "--- Deploying to Vercel ---" -ForegroundColor Cyan
Set-Location -Path "D:\vignan_connect\web"
npx vercel --prod --yes

Write-Host "--- All Finished Successfully! ---" -ForegroundColor Green
Read-Host "Press Enter to exit..."
