@echo off
title EternalEcho Preview Server
echo ========================================================
echo       EternalEcho 3D 专属浪漫全景相册预览服务器
echo ========================================================
echo.
echo 正在启动本地服务器...
start http://localhost:8080/index.html
python -m http.server 8080
pause
