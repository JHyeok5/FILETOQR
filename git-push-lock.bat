@echo off
echo "package-lock.json 파일을 Git에 추가하고 푸시합니다..."

REM Git 명령을 실행할 수 있는지 확인
git --version > nul 2>&1
if errorlevel 1 (
    echo Git이 설치되어 있지 않거나 PATH에 추가되지 않았습니다.
    exit /b 1
)

REM package-lock.json이 존재하는지 확인
if not exist package-lock.json (
    echo package-lock.json 파일이 존재하지 않습니다. npm install을 실행하세요.
    exit /b 1
)

REM package-lock.json 파일을 Git에 추가
git add package-lock.json
if errorlevel 1 (
    echo Git add 명령이 실패했습니다.
    exit /b 1
)

REM 변경사항 커밋
git commit -m "Add package-lock.json for GitHub Actions"
if errorlevel 1 (
    echo Git commit 명령이 실패했습니다.
    exit /b 1
)

REM 원격 저장소에 푸시
git push
if errorlevel 1 (
    echo Git push 명령이 실패했습니다. 원격 저장소에 대한 권한이 있는지 확인하세요.
    exit /b 1
)

echo "package-lock.json 파일이 성공적으로 Git에 추가되고 푸시되었습니다."
exit /b 0 