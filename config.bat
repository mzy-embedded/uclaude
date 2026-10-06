@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "HOME=%~dp0"
set "NODE=%HOME%portable-node\node.exe"
if not exist "%NODE%" set "NODE=node"

:menu
cls
echo.
echo   Claude Code U盘配置工具
echo =====================================
echo    1. 修改 API 配置 (地址/Token/模型)
echo    2. 修改访问密码
echo    3. 查看当前配置 (Token 打码)
echo    4. 退出
echo =====================================
set /p C=请选择[1-4]:
if "%C%"=="1" "%NODE%" "%HOME%core\_guard.js" setapi
if "%C%"=="2" "%NODE%" "%HOME%core\_guard.js" setpwd
if "%C%"=="3" "%NODE%" "%HOME%core\_guard.js" show
if "%C%"=="4" exit /b 0
echo.
pause >nul
goto menu