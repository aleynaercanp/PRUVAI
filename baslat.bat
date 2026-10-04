@echo off
chcp 65001 > nul
title PRUVAI Sunucu ve Yonetim Paneli
echo ============================================================
echo   PRUVAI — Yapay Zeka ve Yonetim Paneli Baslatiliyor...
echo ============================================================
echo.

cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo [HATA] Sanal ortam (venv) bulunamadi!
    echo Lutfen kurulumun eksiksiz oldugundan emin olun.
    pause
    exit /b
)

echo [1/2] Sunucu port kontrolu yapiliyor...
echo [2/2] Tarayicida yonetim paneli aciliyor...
start http://localhost:5000/dashboard

echo.
echo ============================================================
echo  Sunucu su anda aktif! (Kapatmak icin bu pencereyi kapatin)
echo  Adres: http://localhost:5000
echo  Yonetim Paneli: http://localhost:5000/dashboard
echo ============================================================
echo.

.\venv\Scripts\python.exe run.py

pause
