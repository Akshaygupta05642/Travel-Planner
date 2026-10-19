@echo off
set "PATH=%LOCALAPPDATA%\nodejs-portable\node-v22.20.0-win-x64;%PATH%"
cd /d "%~dp0"
npm run dev
