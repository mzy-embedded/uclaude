@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
set "HOME=%~dp0"
echo === Claude Code USB Builder ===
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [!] 本机没有 npm, 请先安装 Node.js LTS: https://nodejs.org
  pause
  exit /b 1
)

rem 1/4 便携 Node (备用运行时)
if not exist "%HOME%portable-node\node.exe" (
  echo [1/4] 下载便携 Node v24.15.0 ...
  powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://registry.npmmirror.com/-/binary/node/v24.15.0/node-v24.15.0-win-x64.zip' -OutFile \"%TEMP%\node24.zip\""
  powershell -NoProfile -Command "Expand-Archive '%TEMP%\node24.zip' -DestinationPath '%TEMP%\node24x' -Force"
  xcopy /e /i /y "%TEMP%\node24x\node-v24.15.0-win-x64\." "%HOME%portable-node\"
) else (
  echo [1/4] portable-node 已存在
)

rem 2/4 安装 Claude Code (--ignore-scripts: FAT32 无 hardlink)
echo [2/4] 安装 @anthropic-ai/claude-code ...
if not exist "%HOME%claude-code" mkdir "%HOME%claude-code"
pushd "%HOME%claude-code"
call npm install --ignore-scripts @anthropic-ai/claude-code --registry=https://registry.npmmirror.com
popd

rem 3/4 准备 .claude 配置 (仅首次: 拷贝本机配置 + 预置引导完成标志)
echo [3/4] 准备 .claude 配置 ...
if not exist "%HOME%.claude\settings.json" (
  if exist "%USERPROFILE%\.claude" xcopy /e /i /y "%USERPROFILE%\.claude" "%HOME%.claude\"
) else (
  echo       .claude 已存在, 跳过拷贝
)
if not exist "%HOME%.claude" mkdir "%HOME%.claude"

rem 首次启动会弹出交互式引导 欢迎页/选主题, 这里让 claude.exe 自举生成
rem .claude.json, 再补上 hasCompletedOnboarding 标志以消除该引导。
rem 若该标志的语义随版本变化, 最坏结果是引导重新出现, 不影响启动。
if not exist "%HOME%.claude\.claude.json" (
  set "CLAUDE_CONFIG_DIR=%HOME%.claude"
  "%HOME%claude-code\node_modules\@anthropic-ai\claude-code-win32-x64\claude.exe" doctor <nul >nul 2>&1
)
"%HOME%portable-node\node.exe" -e "const fs=require('fs'),f=process.argv[1];try{const j=JSON.parse(fs.readFileSync(f,'utf8'));if(j.hasCompletedOnboarding===void 0){j.hasCompletedOnboarding=true;fs.writeFileSync(f,JSON.stringify(j,null,2))}}catch(e){}" "%HOME%.claude\.claude.json"

rem 4/4 重置安全核心: 密码=123456, 删除API配置
echo [4/4] 重置安全核心 ^(密码=123456, API 配置删除^) ...
"%HOME%portable-node\node.exe" "%HOME%core\_guard.js" reset
if errorlevel 1 (
  echo [!] 重置失败, 请确认 core\_guard.js 存在.
  pause
  exit /b 1
)
echo.
echo 完成!
echo   启动密码 : 123456
echo   启动入口 : "%HOME%claude.bat"
echo   API 配置 : 已清空, 运行 "%HOME%config.bat" 选 1 重新配置
exit /b 0