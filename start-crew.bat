@echo off
chcp 65001 > nul
cd /d "%~dp0"
title 29 Crew
echo 29 Crew 대시보드를 켜는 중이에요...
start "" http://127.0.0.1:8129/
where py > nul 2>&1 && (py -m crew29 dashboard %*) || (python -m crew29 dashboard %*)
pause
