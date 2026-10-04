@echo off
chcp 65001 > nul
title PRUVAI - GitHub'a Proje Yükleme
echo ============================================================
echo   PRUVAI PROJESI GITHUB'A YUKLENIYOR
echo ============================================================
echo.
echo Depo Adresi: https://github.com/aleynaercanp/PRUVAI.git
echo Dal: main
echo.
echo Eger tarayicinizda GitHub onay penceresi acilirsa 
echo lutfen "Authorize" / "Sign in with your browser" butonuna tiklayin.
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ============================================================
    echo [BASARILI] Kodlariniz GitHub'a basariyla yuklendi!
    echo Tarayicinizdaki GitHub sayfasini yenileyerek (F5) gorebilirsiniz.
    echo ============================================================
) else (
    echo ============================================================
    echo [BILGI] Yukleme sirasinda bir durum olustu. 
    echo ============================================================
)
echo.
pause
