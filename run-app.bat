@echo off
title Smart Grocery Tracker Server
echo ===================================================
echo   Smart Grocery ^& Budget Safety Tracker (PWA)
echo ===================================================
echo.
echo Menjalankan server lokal di port 8080...
echo Buka di browser laptop: http://localhost:8080
echo.
echo Untuk membuka di smartphone, pastikan HP dan laptop
echo terhubung di Wi-Fi yang sama, lalu buka:
echo http://[IP-LAPTOP-ANDA]:8080
echo.
powershell -ExecutionPolicy Bypass -File .\server.ps1 -port 8080
pause
