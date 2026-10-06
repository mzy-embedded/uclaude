@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
set "CLAUDE_HOME=%~dp0"
set "PATH=%CLAUDE_HOME%portable-node;%PATH%"
set "CLAUDE_CONFIG_DIR=%CLAUDE_HOME%.claude"

rem ---- 密码门禁 ----
if not exist "%CLAUDE_HOME%core\.hash" (
  echo [提示] 尚未设置访问密码, 请先运行 config.bat 设置密码与 API.
  goto start
)

:check
set "C_PWD="
set /p C_PWD=访问密码:
echo !C_PWD!| "%CLAUDE_HOME%portable-node\node.exe" "%CLAUDE_HOME%core\_guard.js" check
if errorlevel 1 (
  echo.
  echo   密码错误，请重试！
  echo.
  goto check
)

for /f "usebackq delims=" %%v in (`echo !C_PWD!^| "%CLAUDE_HOME%portable-node\node.exe" "%CLAUDE_HOME%core\_guard.js" dump`) do set "%%v"
set "C_PWD="

:start
"%CLAUDE_HOME%claude-code\node_modules\@anthropic-ai\claude-code-win32-x64\claude.exe" %*

:done
endlocal