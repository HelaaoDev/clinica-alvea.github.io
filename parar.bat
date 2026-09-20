@echo off
title Clinica Alvea - Encerrar
color 0C
cd /d "%~dp0"

echo ============================================
echo   Encerrando o sistema da Clinica Alvea...
echo ============================================
echo.

taskkill /FI "WINDOWTITLE eq Clinica Alvea - Backend*" /T /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq Clinica Alvea - Frontend*" /T /F >nul 2>nul

echo [OK] Backend e frontend encerrados.
echo.
echo Voce ja pode fechar esta janela.
echo.
pause
