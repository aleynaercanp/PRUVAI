$w.onReady(function () {
    console.log("PRUVAI Seçim ve Karar Ana Sayfası Yükleniyor...");

    // s3_tamamlandi anahtar kelimesi ile session verisini çek
    const s3TamamlandiMi = pruvaiSessionOku_s3('s3_tamamlandi');

    if (s3TamamlandiMi === 'true') {
        console.log("S3 Senaryosu Tamamlanmış! Ana sayfadaki S3 kartı yeşile dönüştürülüyor...");
        
        // Wix rendering ezmelerine karşı garantili olarak 3 kere çalıştırıyoruz
        pruvaiKartDurumunuTamamlandiYap_s3();
        setTimeout(pruvaiKartDurumunuTamamlandiYap_s3, 150);
        setTimeout(pruvaiKartDurumunuTamamlandiYap_s3, 500);
        setTimeout(pruvaiKartDurumunuTamamlandiYap_s3, 1200);
    }
});


/**
 * Güvenli Session Okuma Yardımcısı (İsim çakışmasını önlemek için özel isimlendirildi)
 */
function pruvaiSessionOku_s3(anahtar) {
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
function pruvaiYesilBoya_s3(el, derinlik) {
    if (!el || derinlik > 5) return;

    const tip = String(el.type || "");
    const metinVeyaIkon = /Text|Vector|Image|Icon/i.test(tip);

    if (!metinVeyaIkon) {
        try { el.style.backgroundColor = "#C7F5EC"; } catch (e) {}
        try { el.style.borderColor = "transparent"; } catch (e) {}
    }

    try {
        if (el.children && el.children.length) {
            el.children.forEach(c => pruvaiYesilBoya_s3(c, derinlik + 1));
        }
    } catch (e) {}
}


/**
 * Seçim ve Karar ana sayfasındaki S3 kartını "Tamamlandı" durumuna geçirir.
 */
function pruvaiKartDurumunuTamamlandiYap_s3() {
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
            pruvaiYesilBoya_s3(box255, 0); // İçindeki olası konteynırları da garantiye al
        }
    } catch (e) {}

    // 4. vectorImage120 ikonu ONAY (İçi boş yuvarlaklı checkmark - vectorImage117 gibi) ikonuna dönüşsün
    try {
        const vectorImage120 = $w('#vectorImage120');
        if (vectorImage120) {
            // İçi boş daireli (outlined) checkmark SVG'si
            vectorImage120.src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00a896"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>`;
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

    // 6. text98 skor alanını güncelle ("84 / 100" gibi)
    try {
        const puan = pruvaiSessionOku_s3('s3_puan') || "100";
        const text98 = $w('#text98');
        if (text98) {
            text98.text = `${puan} / 100`;
            text98.html = `<h4 style="color:#000000; font-weight:800; margin:0; text-align:center;">${puan} / 100</h4>`;
        }
    } catch (e) {}

    // 7. button15 durumunu button14 gibi yap (Cevabı Gör -> Beyaz arka plan, koyu metin)
    try {
        const button15 = $w('#button15');
        if (button15) {
            button15.label = "Cevabı Gör →";
            button15.style.backgroundColor = "#FFFFFF";
            button15.style.color = "#000000"; // veya #003831
            button15.style.borderColor = "#D3D3D3";
        }
    } catch (e) {}
}
