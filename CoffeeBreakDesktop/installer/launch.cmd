@echo off
setlocal

set "APP_NAME=CoffeeBreak-0.1.0-win-x64"
set "ZIP_NAME=CoffeeBreak-0.1.0-win-x64.zip"
set "TARGET_DIR=%LOCALAPPDATA%\CoffeeBreak"

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%~dp0%ZIP_NAME%' -DestinationPath '%TARGET_DIR%' -Force"

start "" "%TARGET_DIR%\%APP_NAME%\CoffeeBreak.exe"
exit /b 0
