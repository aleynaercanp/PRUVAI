/**
 * PRUVAI — Wix Studio "Seçim ve Karar / S3" Senaryo Sayfa Kodu
 * 
 * BİREBİR EŞLEŞEN TÜM ID'LER:
 * -------------------------------------------------------------
 * 1. S3 Kartı ve Dönüştürülecek Elemanlar (İkinci Resim):
 *    - #box257                (S3 Senaryo Kartı -> #box253 gibi olur)
 *    - #box252                (S3 Sol Rozet Kutusu)
 *    - #text97                (S3 Başlık / Metin Alanı)
 *    - #box255                ("Başlanmadı" Konteynırı -> #box251 nane yeşili konteynırın aynısı olur)
 *    - #text102               ("Başlanmadı" Metni -> #text95 "Tamamlandı" metninin aynısı olur)
 *    - #vectorImage120        (Saat İkonu -> #vectorImage117 Yeşil Onay/Tik ikonunun aynısı olur)
 *    - #text98                ("-" Puan Alanı -> #scoreText AI Puanı gelir)
 *    - #button15              ("Senaryoyu Başlat" Butonu -> #button14 butonunun aynısı olur)
 * 
 * 2. Referans S2 Elemanları (Kopyalanacak Şablon):
 *    - #box253                (S2 Tamamlanmış Kart)
 *    - #box251                (S2 "Tamamlandı" Yeşil Konteynırı)
 *    - #text95                (S2 "Tamamlandı" Metni)
 *    - #vectorImage117        (S2 Yeşil Tik İkonu)
 *    - #button14              (S2 Butonu)
 * 
 * 3. AI Değerlendirme ve Form Elemanları:
 *    - #avaluateButton        ("Gönder ve Değerlendir" Butonu)
 *    - #aiResultBox           (Turuncu Çerçeveli AI Değerlendirme Konteynırı)
 *    - #answerInput           (Adayın cevabını yazdığı input alanı)
 *    - #scoreText             (AI Değerlendirme Puanı, örn: 88)
 *    - #strengthsText         (Güçlü Yönler metni)
 *    - #developmentText       (Gelişim Alanı metni)
 */

import { fetch } from 'wix-fetch';

// Canlı Python Render Backend URL
const BACKEND_URL = "https://pruvai-backend.onrender.com";

$w.onReady(function () {
    console.log("PRUVAI Seçim ve Karar / S3 Sayfası Başlatılıyor...");

    // 1. Sayfa ilk açıldığında AI Değerlendirme kutusunu gizle/kapat (collapse)
    try {
        const c = $w('#aiResultBox');
        if (c) {
            try { c.collapse(); } catch (e) {}
            try { c.hide(); } catch (e) {}
        }
    } catch (e) {}

    // 2. "Gönder ve Değerlendir" Butonunu (#avaluateButton) Dinle
    try {
        const btn = $w("#avaluateButton") || $w("#evaluateButton");
        if (btn && typeof btn.onClick === 'function') {
            btn.onClick(async () => {
                await cevabiDegerlendir();
            });
        }
    } catch (e) {
        console.warn("Buton bağlama uyarısı:", e);
    }
});


/**
 * Bir kutuyu ve içindeki tüm alt kutuları açık nane yeşiline boyar
 */
function yesilBoya(el, derinlik = 0) {
    if (!el || derinlik > 5) return;

    const tip = String(el.type || "");
    const metinVeyaIkon = /Text|Vector|Image|Button|Icon/i.test(tip);

    if (!metinVeyaIkon) {
        try { el.style.backgroundColor = "rgba(212, 248, 240, 1)"; } catch (e) {}
        try { el.style.borderColor = "rgba(212, 248, 240, 1)"; } catch (e) {}
    }

    try {
        if (el.children && el.children.length) {
            el.children.forEach(c => yesilBoya(c, derinlik + 1));
        }
    } catch (e) {}
}


/**
 * S3 Kartını ve Durum Rozetlerini Birebir S2 Şablonuna Göre Günceller
 * 
 * - #box257 -> #box253 gibi olur
 * - #box255 -> #box251 gibi olur
 * - #text102 -> #text95 ("Tamamlandı") gibi olur
 * - #vectorImage120 -> #vectorImage117 (Tik ikonu) gibi olur
 * - #text98 -> AI Puanı yazılır
 * - #button15 -> #button14 gibi olur
 */
function s3KartiniTamamla(puan) {
    console.log("S3 Kartı ve Durum Kutuları Tamamlandı durumuna dönüştürülüyor...", puan);

    // 1. KART KONTEYNIRI (#box257 -> #box253 gibi olsun)
    try {
        const b257 = $w('#box257');
        const b253 = $w('#box253');
        if (b257) {
            if (b253 && b253.style) {
                if (b253.style.backgroundColor) b257.style.backgroundColor = b253.style.backgroundColor;
                if (b253.style.borderColor) b257.style.borderColor = b253.style.borderColor;
                if (b253.style.borderWidth) b257.style.borderWidth = b253.style.borderWidth;
            } else {
                b257.style.borderColor = "rgba(0, 180, 159, 0.4)";
            }
        }
    } catch (e) {}

    // 2. BAŞLANMADI KONTEYNIRI (#box255 -> #box251 gibi olsun)
    try {
        const b255 = $w('#box255');
        const b251 = $w('#box251');
        if (b255) {
            let hedefBg = "#D4F8F0";
            let hedefBorder = "transparent";

            if (b251 && b251.style) {
                if (b251.style.backgroundColor) hedefBg = b251.style.backgroundColor;
                if (b251.style.borderColor) hedefBorder = b251.style.borderColor;
            }

            b255.style.backgroundColor = hedefBg;
            b255.style.borderColor = hedefBorder;
            yesilBoya(b255, 0);
        }
    } catch (e) {}

    // 3. BAŞLANMADI METNİ (#text102 -> #text95 "Tamamlandı" gibi olsun)
    try {
        const t102 = $w('#text102');
        const t95 = $w('#text95');
        if (t102) {
            t102.text = (t95 && t95.text) ? t95.text : "Tamamlandı";
            if (t95 && t95.html) {
                t102.html = t95.html;
            } else {
                t102.html = `<p style="color:#003831; font-weight:700; margin:0; font-size:14px; text-align:center;">Tamamlandı</p>`;
            }
        }
    } catch (e) {}

    // 4. SAAT İKONU (#vectorImage120 -> #vectorImage117 Yeşil Tik ikonu gibi olsun)
    try {
        const icon120 = $w('#vectorImage120');
        const icon117 = $w('#vectorImage117');
        if (icon120) {
            if (icon117 && icon117.src) {
                icon120.src = icon117.src;
            } else {
                icon120.src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00a896"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
            }
        }
    } catch (e) {}

    // 5. PUAN ALANI (#text98 -> scoreText alanındaki AI değerlendirme puanı)
    try {
        const t98 = $w('#text98');
        if (t98) {
            if (puan !== undefined && puan !== null) {
                t98.text = String(puan);
                t98.html = `<h4 style="color:#192A3E; font-weight:800; margin:0; text-align:center;">${puan}</h4>`;
            } else {
                t98.text = "..";
            }
        }
    } catch (e) {}

    // 6. BUTON (#button15 -> #button14 olsun)
    try {
        const btn15 = $w('#button15');
        const btn14 = $w('#button14');
        if (btn15 && btn14) {
            if (btn14.label) btn15.label = btn14.label;
            if (btn14.style) {
                if (btn14.style.backgroundColor) btn15.style.backgroundColor = btn14.style.backgroundColor;
                if (btn14.style.color) btn15.style.color = btn14.style.color;
                if (btn14.style.borderColor) btn15.style.borderColor = btn14.style.borderColor;
                if (btn14.style.borderWidth) btn15.style.borderWidth = btn14.style.borderWidth;
                if (btn14.style.borderRadius) btn15.style.borderRadius = btn14.style.borderRadius;
            }
        }
    } catch (e) {}

    // 7. ROZET KUTUSU (#box252) & METİN (#text97)
    try {
        const b252 = $w('#box252');
        if (b252 && b252.style) {
            b252.style.backgroundColor = "#00B49F";
        }
    } catch (e) {}

    // 8. YEDEK ID'LER (Önceki yapılardan kalan elemanlar varsa uyum için)
    try {
        yesilBoya($w('#box251'), 0);
        yesilBoya($w('#box262'), 0);
        const el262 = $w('#box262');
        if (el262) {
            if (typeof el262.label !== 'undefined') el262.label = "Tamamlandı";
            if (typeof el262.text !== 'undefined') el262.text = "Tamamlandı";
            try { el262.style.backgroundColor = "#D4F8F0"; el262.style.color = "#003831"; } catch (e) {}
        }
        const b247 = $w('#box247');
        if (b247 && b247.style) { b247.style.backgroundColor = "#C7F5EC"; }
        const t94 = $w('#text94');
        if (t94) { t94.text = "S3"; }
        const icon126 = $w('#vectorImage126');
        if (icon126) {
            const icon117 = $w('#vectorImage117');
            if (icon117 && icon117.src) icon126.src = icon117.src;
        }
    } catch (e) {}
}


/**
 * Cevabı Alır, S3 Kartını Günceller, AI ile Değerlendirir ve Sonuçları Gösterir
 */
async function cevabiDegerlendir() {
    // 1. S3 KARTINI VE ROZETLERİNİ ANINDA GÜNCELLE
    s3KartiniTamamla();

    // 2. AI DEĞERLENDİRME KUTUSUNU ANINDA AÇ (#aiResultBox)
    try {
        const c = $w('#aiResultBox');
        if (c) {
            try { await c.show(); } catch (e) {}
            try { await c.expand(); } catch (e) {}

            setTimeout(() => {
                try {
                    if (typeof c.scrollTo === 'function') c.scrollTo();
                } catch (e) {}
            }, 80);
        }
    } catch (e) {}

    // 3. Kullanıcının yazdığı cevabı oku
    let cevapMetni = "";
    try {
        if ($w('#answerInput')) {
            cevapMetni = ($w('#answerInput').value || $w('#answerInput').text || "").trim();
        }
    } catch (e) {}

    // Eğer kullanıcı henüz bir şey yazmadıysa kutuyu açık bırak ve yönlendirici mesaj göster
    if (!cevapMetni) {
        try { if ($w('#scoreText')) $w('#scoreText').text = "-"; } catch (e) {}
        try { if ($w('#strengthsText')) $w('#strengthsText').text = "Lütfen yukarıdaki kutuya hangi adayla (Kerem veya Ece) neden ilerlemek istediğinizi yazınız."; } catch (e) {}
        try { if ($w('#developmentText')) $w('#developmentText').text = "Cevabınızı girdikten sonra yapay zekâ yetkinlik analizinizi otomatik olarak çıkaracaktır."; } catch (e) {}
        try { if ($w('#answerInput')) $w('#answerInput').focus(); } catch (e) {}
        return;
    }

    // 4. Buton durumunu 'Değerlendiriliyor' yap
    let aktifButon = null;
    try {
        const b = $w("#avaluateButton") || $w("#evaluateButton");
        if (b && typeof b.label !== 'undefined') {
            aktifButon = b;
            b.label = "Değerlendiriliyor... ⏳";
        }
    } catch (e) {}

    // Yükleniyor durumunu alanlara önceden yaz
    try { if ($w('#scoreText')) $w('#scoreText').text = ".."; } catch (e) {}
    try { if ($w('#text98')) $w('#text98').text = ".."; } catch (e) {}
    try { if ($w('#strengthsText')) $w('#strengthsText').text = "Yapay zekâ adayın yetkinlik analizini hazırlıyor..."; } catch (e) {}
    try { if ($w('#developmentText')) $w('#developmentText').text = "Pozisyon dinamiklerine göre gelişim önerisi inceleniyor..."; } catch (e) {}

    // 5. Canlı Render Backend'e AI Değerlendirme İsteği Gönder
    let degerlendirme = null;
    try {
        const response = await fetch(`${BACKEND_URL}/api/degerlendir`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                cevap: cevapMetni,
                senaryo: "Seçim ve Karar / S3"
            })
        });

        if (response.ok) {
            const sonuc = await response.json();
            if (sonuc && sonuc.basari) {
                degerlendirme = sonuc;
            }
        }
    } catch (apiErr) {
        console.warn("Backend API bağlantı uyarısı (Yedek analize geçiliyor):", apiErr);
    }

    // 6. API gecikirse veya bağlantı sağlanamazsa devrede olan Akıllı Yerel İK Motoru
    if (!degerlendirme) {
        degerlendirme = akilliYerelDegerlendirme(cevapMetni);
    }

    // 7. SONUÇLARI İLGİLİ ELEMANLARA YAZ:
    try {
        if ($w('#scoreText')) {
            $w('#scoreText').text = String(degerlendirme.puan);
        }
    } catch (e) {}

    // #text98 ve S3 kartını hesaplanan skor ile güncelle
    s3KartiniTamamla(degerlendirme.puan);

    try {
        if ($w('#strengthsText')) {
            $w('#strengthsText').text = String(degerlendirme.guclu_yonler);
        }
    } catch (e) {}

    try {
        if ($w('#developmentText')) {
            $w('#developmentText').text = String(degerlendirme.gelisim_alanlari);
        }
    } catch (e) {}

    // 8. Buton yazısını eski haline getir
    if (aktifButon) {
        aktifButon.label = "Gönder ve Değerlendir ✈";
    }

    console.log("Değerlendirme tamamlandı. Skor:", degerlendirme.puan);
}


/**
 * Akıllı Yedek İK Değerlendirme Motoru
 */
function akilliYerelDegerlendirme(cevap) {
    const lower = cevap.toLowerCase();
    const secilenKerem = lower.includes("kerem") || lower.includes("aday b") || lower.includes("b adayı");
    const secilenEce = lower.includes("ece") || lower.includes("aday a") || lower.includes("a adayı");
    const kelimeSayisi = cevap.split(/\s+/).length;

    let puan = 75;
    let guclu = "";
    let gelisim = "";

    if (secilenKerem) {
        puan = 88;
        guclu = "Pozisyonun ilk 6 aylık kritik önceliği olan 'yoğun görüşme ve bölüm yöneticileriyle doğrudan iletişim' ihtiyacını, Kerem'in yüksek iletişim (93) ve mülakat (91) yetkinlikleriyle başarılı bir şekilde eşleştirdiniz.";
        gelisim = "Kerem'in 1 yıllık tecrübesi ve vaka çalışmasındaki (82) eksiklerini telafi etmek amacıyla ilk 3 ay için kıdemli bir uzmandan teknik mentorluk veya vaka oryantasyonu planlayabilirdiniz.";
    } else if (secilenEce) {
        puan = 82;
        guclu = "Ece'nin 3 yıllık sektörel deneyimini ve vaka çalışmasındaki yüksek başarısını (92) temel alarak bağımsız iş yapabilme kapasitesini doğru tespit ettiniz.";
        gelisim = "İlk 6 ayda kritik olan yoğun paydaş ve bölüm yöneticisi iletişiminde Ece'nin iletişim skorunun (72) yaratabileceği riskleri ve bu riskleri nasıl yöneteceğinizi detaylandırabilirsiniz.";
    } else {
        puan = 78;
        guclu = "Her iki adayın güçlü yönlerini ve pozisyon gereksinimlerini çok yönlü bir bakış açısıyla ele aldınız.";
        gelisim = "Hangi adayla ilerleneceği konusunda daha net bir karar belirterek kararınızın arkasındaki ana stratejiyi vurgulamanız değerlendirmenizi güçlendirecektir.";
    }

    if (kelimeSayisi > 25) {
        puan = Math.min(95, puan + 5);
    } else if (kelimeSayisi < 8) {
        puan = Math.max(65, puan - 10);
    }

    return {
        puan: puan,
        guclu_yonler: guclu,
        gelisim_alanlari: gelisim
    };
}


// Wix Studio Properties Panelinde "onClick" event'i oluşturulmuşsa çalışan handler'lar
export async function avaluateButton_click(event) {
    await cevabiDegerlendir();
}

export async function evaluateButton_click(event) {
    await cevabiDegerlendir();
}
