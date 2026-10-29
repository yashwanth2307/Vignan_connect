@echo off
cd /d D:\vignan_connect
git config user.name "yashwanth2307"
git config user.email "billapatiyashwanthreddy@gmail.com"
git add .
git commit -m "feat(classroom): add audio/video enhancements, broadcast whiteboard, screen share with audio, admin moderation controls, and class recording"
git push origin main
cd /d D:\vignan_connect\web
npx vercel --prod --yes
pause
