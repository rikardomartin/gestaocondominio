@echo off
echo ========================================
echo   DEPLOY CLOUD FUNCTIONS - FCM
echo ========================================
echo.

echo [1/5] Verificando pasta functions...
if not exist "functions" (
    echo ERRO: Pasta functions nao encontrada!
    pause
    exit /b 1
)

echo [2/5] Instalando dependencias...
cd functions
if not exist "package.json" (
    echo ERRO: package.json nao encontrado!
    cd ..
    pause
    exit /b 1
)

call npm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias
    cd ..
    pause
    exit /b 1
)

echo.
echo [3/5] Voltando para raiz do projeto...
cd ..

echo.
echo [4/5] Fazendo deploy das functions...
call firebase deploy --only functions
if errorlevel 1 (
    echo ERRO: Falha no deploy
    echo.
    echo Dicas:
    echo - Verifique se esta logado: firebase login
    echo - Verifique o projeto: firebase use gestaodoscondominios
    pause
    exit /b 1
)

echo.
echo [5/5] Deploy concluido!
echo.
echo ========================================
echo   SUCESSO! Functions deployadas
echo ========================================
echo.
echo Funcoes disponiveis:
echo - sendPaymentNotification (trigger automatico)
echo - cleanupOldTokens (agendada semanalmente)
echo - sendTestNotification (HTTP endpoint)
echo.
echo Teste agora:
echo https://us-central1-gestaodoscondominios.cloudfunctions.net/sendTestNotification
echo.
pause
