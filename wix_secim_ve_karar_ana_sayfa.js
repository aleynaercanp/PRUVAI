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
    } catch (e) { }
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
        try { el.style.backgroundColor = "#C7F5EC"; } catch (e) { }
        try { el.style.borderColor = "transparent"; } catch (e) { }
    }

    try {
        if (el.children && el.children.length) {
            el.children.forEach(c => yesilBoya(c, derinlik + 1));
        }
    } catch (e) { }
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
    } catch (e) { }

    // 2. text101 rengi koyu teal (#003831) (text97 gibi)
    try {
        const text101 = $w('#text101');
        if (text101) {
            text101.html = `<h4 style="color:#003831; font-weight:800; margin:0; text-align:center;">S3</h4>`;
        }
    } catch (e) { }

    // 3. box255 dış kapsül rengi yeşil (#C7F5EC) (box251 gibi)
    try {
        const box255 = $w('#box255');
        if (box255) {
            box255.style.backgroundColor = "#C7F5EC";
            box255.style.borderColor = "transparent";
            yesilBoya(box255, 0); // İçindeki olası konteynırları da garantiye al
        }
    } catch (e) { }

    // 4. vectorImage120 ikonu, vectorImage117'nin birebir aynısı olsun (kaynağı kopyalanır)
    try {
        const vectorImage120 = $w('#vectorImage120');
        const vectorImage117 = $w('#vectorImage117');
        if (vectorImage120 && vectorImage117) {
            // Boyut: vectorImage117 ile birebir aynı (okunamazsa 40px)
            let w = 40, h = 40;
            try { if (vectorImage117.width) w = vectorImage117.width; } catch (e) { }
            try { if (vectorImage117.height) h = vectorImage117.height; } catch (e) { }

            // Renk: turkuaz halka + onay işareti (vectorImage117 görünümü)
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#00B8A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="7.5 12.5 10.5 15.5 16.5 9"/></svg>`;
            try { vectorImage120.src = svg; } catch (e) { }
            try { vectorImage120.width = w; } catch (e) { }
            try { vectorImage120.height = h; } catch (e) { }
        }
    } catch (e) { }

    // 5. text102 yazısı 'Tamamlandı' olsun ve rengi #003831 olsun
    try {
        const text102 = $w('#text102');
        if (text102) {
            text102.text = "Tamamlandı";
            text102.html = `<p style="color:#003831; font-weight:700; margin:0; font-size:15px;">Tamamlandı</p>`;
        }
    } catch (e) { }

    // 6. text98: puan (100 üzerinden), text97/text99 gibi koyu ve kalın
    try {
        const text98 = $w('#text98');
        const puan = sessionOku('s3_puan');
        if (text98 && puan) {
            const metin = `${puan} / 100`;
            text98.text = metin;
            text98.html = `<p style="color:#003831; font-weight:700; margin:0; font-size:18px; text-align:center;">${metin}</p>`;
        }
    } catch (e) { }

    // 7. button15, button14 ile aynı olsun ("Cevabı Gör →", beyaz zemin)
    try {
        const button15 = $w('#button15');
        const button14 = $w('#button14');
        if (button15) {
            let etiket = "Cevabı Gör →";
            try { if (button14 && button14.label) etiket = button14.label; } catch (e) { }
            button15.label = etiket;

            let bg = "#FFFFFF", kenar = "#D3D3D3";
            try {
                if (button14 && button14.style) {
                    bg = button14.style.backgroundColor || bg;
                    kenar = button14.style.borderColor || kenar;
                }
            } catch (e) { }
            try { button15.style.backgroundColor = bg; } catch (e) { }
            try { button15.style.borderColor = kenar; } catch (e) { }
            // Yazı ve ikon (fill) siyah
            try { button15.style.color = "#000000"; } catch (e) { }
            try { button15.fill = "#000000"; } catch (e) { }

            // Butonun 2. elemanı (ok ikonu): fill siyah + siyah ok SVG
            const okSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path fill="#000000" d="M4 11h13.17l-4.88-4.88L13.7 4.7 21 12l-7.3 7.3-1.41-1.42L17.17 13H4z"/></svg>`;
            try {
                const cocuklar = button15.children || [];
                const ikon = cocuklar[1];
                if (ikon) {
                    try { ikon.fill = "#000000"; } catch (e) { }
                    try { ikon.style.color = "#000000"; } catch (e) { }
                    try { ikon.style.fill = "#000000"; } catch (e) { }
                    try { ikon.src = okSvg; } catch (e) { }
                    try { ikon.show(); } catch (e) { }
                }
            } catch (e) { }
            try { if (button15.icon) { button15.icon.src = okSvg; button15.icon.fill = "#000000"; } } catch (e) { }
        }
    } catch (e) { }

    // 9. text91 metni '3 / 3' olsun
    try {
        const text91 = $w('#text91');
        if (text91) {
            text91.text = "3 / 3";
        }
    } catch (e) { }

    // 10. box248 genişliği %100 olsun
    try {
        const box248 = $w('#box248');
        if (box248) {
            try { box248.style.width = "100%"; } catch (e) { }
        }
    } catch (e) { }

    // 8. box257 (satır kartı): box253 gibi — turkuaz çerçeveyi kaldır
    try {
        const box257 = $w('#box257');
        const box253 = $w('#box253');
        if (box257) {
            let bg = "#FFFFFF", kenar = "transparent", kalinlik = "0px", radius = null;
            try {
                if (box253 && box253.style) {
                    bg = box253.style.backgroundColor || bg;
                    kenar = box253.style.borderColor || kenar;
                    kalinlik = box253.style.borderWidth || kalinlik;
                    radius = box253.style.borderRadius || null;
                }
            } catch (e) { }
            try { box257.style.backgroundColor = bg; } catch (e) { }
            try { box257.style.borderColor = kenar; } catch (e) { }
            try { box257.style.borderWidth = kalinlik; } catch (e) { }
            try { if (radius) box257.style.borderRadius = radius; } catch (e) { }
        }
    } catch (e) { }
}
