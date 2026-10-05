/**
 * PRUVAI — Wix Studio "Seçim ve Karar" Ana Sayfa Kodu
 * 
 * Bu sayfa, S3 senaryosunun tamamlanıp tamamlanmadığını session üzerinden kontrol eder
 * ve tamamlandıysa (s3_tamamlandi === 'true') ana ekrandaki ilgili modül kartının
 * renklerini, metinlerini ve ikonunu "Tamamlandı" durumuna (Yeşil) geçirir.
 */

import { session } from 'wix-storage';

$w.onReady(function () {
    console.log("PRUVAI Seçim ve Karar Ana Sayfası Yükleniyor...");

    // s3_tamamlandi anahtar kelimesi ile session verisini çek
    const s3TamamlandiMi = sessionOku('s3_tamamlandi');

    if (s3TamamlandiMi === 'true') {
        console.log("S3 Senaryosu Tamamlanmış! Ana sayfadaki S3 kartı yeşile dönüştürülüyor...");
        
        // Wix rendering ezmelerine karşı garantili olarak 3 kere çalıştırıyoruz
        kartDurumunuTamamlandiYap();
        setTimeout(kartDurumunuTamamlandiYap, 150);
        setTimeout(kartDurumunuTamamlandiYap, 500);
        setTimeout(kartDurumunuTamamlandiYap, 1200);
    }
});


/**
 * Güvenli Session Okuma Yardımcısı
 */
function sessionOku(anahtar) {
    try {
        if (typeof session !== 'undefined' && session.getItem) {
            const val = session.getItem(anahtar);
            if (val !== null && val !== undefined && val !== "") return val;
        }
    } catch (e) {}
    return null;
}


/**
 * Bir kutuyu ve içindeki elemanları yeşile boyar
 */
function yesilBoya(el, derinlik) {
    if (!el || derinlik > 5) return;

    const tip = String(el.type || "");
    const metinVeyaIkon = /Text|Vector|Image|Icon/i.test(tip);

    if (!metinVeyaIkon) {
        try { el.style.backgroundColor = "#C7F5EC"; } catch (e) {}
        try { el.style.borderColor = "transparent"; } catch (e) {}
    }

    try {
        if (el.children && el.children.length) {
            el.children.forEach(c => yesilBoya(c, derinlik + 1));
        }
    } catch (e) {}
}


/**
 * Seçim ve Karar ana sayfasındaki S3 kartını "Tamamlandı" durumuna geçirir.
 */
function kartDurumunuTamamlandiYap() {
    // 1. box256 rengi yeşil (#C7F5EC) (box252 gibi)
    try {
        const box256 = $w('#box256');
        if (box256) {
            box256.style.backgroundColor = "#C7F5EC";
            box256.style.borderColor = "transparent";
        }
    } catch (e) {}

    // 2. text101 rengi koyu teal (#003831) (text97 gibi)
    try {
        const text101 = $w('#text101');
        if (text101) {
            text101.html = `<h4 style="color:#003831; font-weight:800; margin:0; text-align:center;">S3</h4>`;
        }
    } catch (e) {}

    // 3. box255 dış kapsül rengi yeşil (#C7F5EC) (box251 gibi)
    try {
        const box255 = $w('#box255');
        if (box255) {
            box255.style.backgroundColor = "#C7F5EC";
            box255.style.borderColor = "transparent";
            yesilBoya(box255, 0); // İçindeki olası konteynırları da garantiye al
        }
    } catch (e) {}

    // 4. vectorImage120 ikonu onay ikonuna (vectorImage117 gibi) dönüşsün
    try {
        const vectorImage120 = $w('#vectorImage120');
        if (vectorImage120) {
            vectorImage120.src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00a896"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
        }
    } catch (e) {}

    // 5. text102 yazısı 'Tamamlandı' olsun ve rengi #003831 olsun
    try {
        const text102 = $w('#text102');
        if (text102) {
            text102.text = "Tamamlandı";
            text102.html = `<p style="color:#003831; font-weight:700; margin:0; font-size:15px;">Tamamlandı</p>`;
        }
    } catch (e) {}
}
