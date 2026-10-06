@echo off
chcp 65001 >nul
rem Install the "uclaude" launcher into this PC's PowerShell profiles.
rem Safe to run anytime (idempotent); drive letter does not matter.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-uclaude.ps1"
if errorlevel 1 (
  echo.
  echo   [失败] uclaude 安装未完成, 请截图本窗口.
  pause
  exit /b 1
)
echo.
echo   安装完成! 新开一个终端输入 uclaude 即可.
echo   本窗口 即将自动关闭...
ping 127.0.0.1 -n 1 >nul
exit /b 0