@echo off
echo ===============================
echo Запуск локального сервера геопортала
echo ===============================

set PORT=8000

echo.
echo Запуск сервера на порту %PORT%...
echo.
echo Для доступа к геопорталу откройте в браузере: http://localhost:%PORT%
echo Для остановки сервера нажмите Ctrl+C
echo.

REM Проверяем наличие Python
python --version > nul 2>&1
if %ERRORLEVEL% == 0 (
    python -m http.server %PORT%
) else (
    echo Python не найден. Попытка запуска через Node.js...
    npx http-server -p %PORT%
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo Ошибка: Не удалось запустить сервер ни через Python, ни через Node.js.
        echo Пожалуйста, установите Python или Node.js и попробуйте снова.
        echo.
        pause
    )
) 