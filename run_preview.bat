@echo off
chcp 65001 >nul
title EternalEcho 3D 专属浪漫全景相册预览服务器
echo ========================================================
echo       EternalEcho 3D 专属浪漫全景相册预览服务器
echo ========================================================
echo.
echo 正在启动本地高速服务器并打开浏览器...
start http://localhost:8080/index.html

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  node server.js
) else (
  python -m http.server 8080
)
pause
