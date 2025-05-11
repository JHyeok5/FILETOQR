@echo off
echo FileToQR 웹사이트 배포 시작
echo ==============================

echo 1. 변경사항 확인 중...
git status

echo.
echo 2. 모든 변경사항 추가...
git add .

echo.
echo 3. 변경사항 커밋 중...
git commit -m "빌드 설정 수정: 웹팩 설정 및 GitHub 액션 워크플로우 개선"

echo.
echo 4. GitHub 원격 저장소에 푸시 중...
git push

echo.
echo 웹사이트 배포 완료!
echo ==============================

pause 