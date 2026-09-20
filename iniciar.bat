@echo off
setlocal enabledelayedexpansion
title Clinica Alvea - Inicializador
color 0B
cd /d "%~dp0"

echo ============================================
echo    CLINICA ALVEA - Sistema de Agendamento
echo ============================================
echo.

REM ---------- Verificar Node.js ----------
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no seu computador.
    echo.
    echo Baixe e instale em: https://nodejs.org  ^(versao LTS^)
    echo Depois de instalar, feche esta janela e execute o iniciar.bat novamente.
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js encontrado.

REM ---------- Verificar Python (python ou py) ----------
set PYTHON_CMD=
where python >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
) else (
    where py >nul 2>nul
    if !errorlevel! equ 0 (
        set PYTHON_CMD=py
    )
)

if "%PYTHON_CMD%"=="" (
    echo [ERRO] Python nao foi encontrado no seu computador.
    echo.
    echo Baixe e instale em: https://www.python.org/downloads/
    echo IMPORTANTE: marque a opcao "Add python.exe to PATH" durante a instalacao.
    echo Depois de instalar, feche esta janela e execute o iniciar.bat novamente.
    echo.
    pause
    exit /b 1
)
echo [OK] Python encontrado ^(comando: %PYTHON_CMD%^).
echo.

REM ---------- Criar backend\.env se nao existir ----------
if not exist "backend\.env" (
    echo Criando arquivo backend\.env com valores padrao...
    (
        echo PORT=3000
        echo.
        echo SUPABASE_URL=
        echo SUPABASE_SERVICE_ROLE_KEY=
        echo.
        echo JWT_SECRET=clinica_alvea_%RANDOM%%RANDOM%%RANDOM%
        echo JWT_EXPIRES_IN=8h
        echo DATA_ENCRYPTION_KEY=alvea_key_%RANDOM%%RANDOM%%RANDOM%%RANDOM%
        echo NODE_ENV=development
        echo ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
        echo.
        echo EMAIL_USER=
        echo EMAIL_APP_PASSWORD=
    ) > "backend\.env"
    echo [OK] Arquivo backend\.env criado.
    echo       Para ativar o envio real de e-mail de confirmacao, edite esse
    echo       arquivo e preencha EMAIL_USER e EMAIL_APP_PASSWORD ^(veja o
    echo       README.md para o passo a passo^).
) else (
    echo [OK] Arquivo backend\.env ja existe.
)
echo.

REM ---------- Verificar se o Supabase ja foi configurado ----------
findstr /r /c:"^SUPABASE_URL=." "backend\.env" >nul 2>nul
if %errorlevel% neq 0 (
    echo ============================================
    echo  [ATENCAO] O banco de dados ^(Supabase^) ainda
    echo  nao foi configurado em backend\.env.
    echo.
    echo  O backend NAO vai iniciar sem isso. Siga o
    echo  passo a passo no README.md ^(secao "Banco de
    echo  dados"^):
    echo   1. Crie um projeto gratuito em supabase.com
    echo   2. Rode backend\supabase\schema.sql no SQL Editor
    echo   3. Preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
    echo      em backend\.env
    echo   4. Execute este iniciar.bat novamente
    echo ============================================
    echo.
    pause
    exit /b 1
)
echo [OK] Supabase configurado em backend\.env.
echo.

REM ---------- Instalar dependencias do backend ----------
if not exist "backend\node_modules" (
    echo Instalando dependencias do backend, isso pode levar alguns minutos...
    pushd backend
    call npm install
    popd
    echo [OK] Dependencias instaladas.
) else (
    echo [OK] Dependencias do backend ja instaladas.
)
echo.

REM ---------- Criar pastas de upload se nao existirem ----------
if not exist "backend\uploads\exames" mkdir "backend\uploads\exames"
if not exist "backend\uploads\perfis" mkdir "backend\uploads\perfis"

REM ---------- Subir backend em nova janela ----------
echo Iniciando backend em http://localhost:3000 ...
start "Clinica Alvea - Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

REM ---------- Subir frontend em nova janela ----------
echo Iniciando frontend em http://localhost:8080 ...
start "Clinica Alvea - Frontend" cmd /k "cd frontend && %PYTHON_CMD% -m http.server 8080"

timeout /t 2 /nobreak >nul

REM ---------- Abrir navegador ----------
echo Abrindo o navegador...
start http://localhost:8080/index.html

echo.
echo ============================================
echo  Tudo pronto! Duas janelas foram abertas:
echo   - Clinica Alvea - Backend   ^(porta 3000^)
echo   - Clinica Alvea - Frontend  ^(porta 8080^)
echo.
echo  NAO FECHE essas duas janelas enquanto estiver
echo  usando o sistema.
echo.
echo  Para encerrar tudo de uma vez, execute o parar.bat
echo  ^(ou simplesmente feche as duas janelas^).
echo ============================================
echo.
pause
