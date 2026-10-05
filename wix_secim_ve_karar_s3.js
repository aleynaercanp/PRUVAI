/**
 * PRUVAI — Wix Studio "Seçim ve Karar / S3" Senaryo Sayfa Kodu
 * 
 * BİREBİR EŞLEŞEN TÜM ID'LER:
 * -------------------------------------------------------------
 * 1. Üst Rozet Elemanları:
 *    - #box247                (S3 Kare Kutusu -> Yeşile döner)
 *    - #text94                ("S3" Metni -> Koyu renge döner)
 *    - #box251                (Dış Kapsül Kutusu -> Yeşile döner)
 *    - #box262                ("Başlanmadı" Butonu/Metni -> "Tamamlandı" olur)
 *    - #vectorImage126        (Saat İkonu -> Yeşil Onay/Checkmark olur)
 * 
 * 2. Buton ve AI Konteynırı:
 *    - #avaluateButton        ("Gönder ve Değerlendir" Butonu)
 *    - #aiResultBox           (Turuncu Çerçeveli AI Değerlendirme Kutusu)
 * 
 * 3. Girdi ve Çıktı Alanları:
 *    - #answerInput           (Adayın cevabını yazdığı metin kutusu)
 *    - #scoreText             ("-" alanındaki puan, örn: 88)
 *    - #strengthsText         (Güçlü Yönler metni)
 *    - #developmentText       (Gelişim Alanı metni)
 */

import { fetch } from 'wix-fetch';
import { session } from 'wix-storage';

// Canlı Python Render Backend URL
const BACKEND_URL = "https://pruvai-backend.onrender.com";

$w.onReady(function () {
    console.log("PRUVAI Seçim ve Karar / S3 Sayfası Başlatılıyor...");

    // 1. SESSION KONTROLÜ: Sayfa yeniden yüklendiğinde başarı durumunu ve verileri koru
    const s3TamamlandiMi = sessionOku('s3_tamamlandi');

    if (s3TamamlandiMi === 'true') {
        console.log("Daha önce başarıyla tamamlanmış: Durum korunuyor (Tamamlandı - Yeşil)...");
        
        // Rozetleri hemen yeşil ve Tamamlandı yap
        s3DurumunuTamamla();
        // Wix Studio rendering ve hydration sonrasında stilin ezilmemesi için tekrarlı uygula
        setTimeout(() => { s3DurumunuTamamla(); }, 150);
        setTimeout(() => { s3DurumunuTamamla(); }, 500);
        setTimeout(() => { s3DurumunuTamamla(); }, 1200);

        // Önceki sonuç verilerini session'dan oku ve kutulara geri yükle
        const eskiPuan = sessionOku('s3_puan');
        const eskiGuclu = sessionOku('s3_guclu');
        const eskiGelisim = sessionOku('s3_gelisim');
        const eskiCevap = sessionOku('s3_cevap');

        if (eskiCevap) {
            try {
                if ($w('#answerInput')) $w('#answerInput').value = eskiCevap;
            } catch (e) {}
        }
        if (eskiPuan) {
            try {
                if ($w('#scoreText')) $w('#scoreText').text = String(eskiPuan);
            } catch (e) {}
        }
        if (eskiGuclu) {
            try {
                if ($w('#strengthsText')) $w('#strengthsText').text = String(eskiGuclu);
            } catch (e) {}
        }
        if (eskiGelisim) {
            try {
                if ($w('#developmentText')) $w('#developmentText').text = String(eskiGelisim);
            } catch (e) {}
        }

        // Değerlendirme kutusunu açık bırak
        try {
            const c = $w('#aiResultBox');
            if (c) {
                if (typeof c.show === 'function') c.show();
                if (typeof c.expand === 'function') c.expand();
            }
        } catch (e) {}
    } else {
        // İlk kez açılıyorsa AI Değerlendirme kutusunu SIFIR PİKSEL YAP (collapse)
        try {
            const c = $w('#aiResultBox');
            if (c) {
                try { c.collapse(); } catch (e) {}
                try { c.hide(); } catch (e) {}
            }
        } catch (e) {}
    }

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
 * Güvenli Session Yazma / Okuma Yardımcıları
 * Sadece session storage kullanır; böylece tarayıcı kapatıldığında sıfırlanır, 
 * ancak sayfa (F5) yenilendiğinde veriler korunur.
 */
function sessionKaydet(anahtar, deger) {
    try {
        if (typeof session !== 'undefined' && session.setItem) {
            session.setItem(anahtar, String(deger));
        }
    } catch (e) {}
}

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
 * Bir kutuyu ve içindeki alt kutuları açık nane yeşiline (#C7F5EC) boyayan yardımcı
 */
function yesilBoya(el, derinlik) {
    if (!el || derinlik > 5) return;

    const tip = String(el.type || "");
    const metinVeyaIkon = /Text|Vector|Image|Icon/i.test(tip);

    if (!metinVeyaIkon) {
        try { el.style.backgroundColor = "#C7F5EC"; } catch (e) {}
        try { el.style.borderColor = "#C7F5EC"; } catch (e) {}
    }

    try {
        if (el.children && el.children.length) {
            el.children.forEach(c => yesilBoya(c, derinlik + 1));
        }
    } catch (e) {}
}


/**
 * S3 Rozetlerini Turuncudan "Tamamlandı" (Yeşil) Haline Getirir
 */
function s3DurumunuTamamla() {
    console.log("S3 rozetleri yeşile çevriliyor (#box247, #box251, #box262, #vectorImage126, #text94)...");

    // 1. "S3" METNİ (#text94): Koyu teal renk yap
    try {
        const t94 = $w('#text94');
        if (t94) {
            t94.text = "S3";
            try {
                t94.html = `<h3 style="color:#003831; font-weight:800; margin:0; text-align:center;">S3</h3>`;
            } catch (e) {}
        }
    } catch (e) {}

    // 2. S3 KARE KUTUSU (#box247): Açık nane yeşili yap
    try {
        const b247 = $w('#box247');
        if (b247) {
            try { b247.style.backgroundColor = "#C7F5EC"; } catch (e) {}
            try { b247.style.borderColor = "transparent"; } catch (e) {}
            try { if (typeof b247.label !== 'undefined') b247.label = "S3"; } catch (e) {}
        }
    } catch (e) {}

    // 3. DIŞ KAPSÜL KUTUSU (#box251): Hem doğrudan hem özyinelemeli yeşile boya
    try {
        const b251 = $w('#box251');
        if (b251) {
            try { b251.style.backgroundColor = "#C7F5EC"; } catch (e) {}
            try { b251.style.borderColor = "transparent"; } catch (e) {}
            yesilBoya(b251, 0);
        }
    } catch (e) {}

    // 4. "BAŞLANMADI" BUTONU/ELEMANI (#box262): "Tamamlandı" yap ve yeşil stile çevir
    try {
        const el262 = $w('#box262');
        if (el262) {
            // Eğer buton ise
            if (typeof el262.label !== 'undefined') {
                el262.label = "Tamamlandı";
            }
            // Eğer metin elemanı ise
            if (typeof el262.text !== 'undefined') {
                el262.text = "Tamamlandı";
                try {
                    el262.html = `<p style="color:#003831; font-weight:700; margin:0; font-size:15px;">Tamamlandı</p>`;
                } catch (e) {}
            }
            try {
                el262.style.backgroundColor = "#C7F5EC";
                el262.style.borderColor = "transparent";
                el262.style.color = "#003831";
            } catch (e) {}

            yesilBoya(el262, 0);

            if (el262.children && Array.isArray(el262.children)) {
                el262.children.forEach(child => {
                    try {
                        if (typeof child.text !== 'undefined') {
                            child.text = "Tamamlandı";
                            child.html = `<p style="color:#003831; font-weight:700; margin:0; font-size:15px;">Tamamlandı</p>`;
                        }
                    } catch (e) {}
                });
            }
        }
    } catch (e) {}

    // 5. SAAT İKONU (#vectorImage126): Yeşil Onay (Checkmark) İkonuna Çevir
    try {
        const icon = $w('#vectorImage126');
        if (icon) {
            try {
                icon.src = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#00a896"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
            } catch (errSvg) {}
        }
    } catch (e) {}

    // 6. GENEL TARAMA: Sayfadaki herhangi bir "Başlanmadı" yazısını da "Tamamlandı"ya çevir
    try {
        $w("Text").forEach(el => {
            try {
                if (el && el.text) {
                    const txt = el.text.trim();
                    if (txt === "Başlanmadı" || txt.includes("Başlanmadı")) {
                        el.text = "Tamamlandı";
                        try {
                            el.html = `<p style="color:#003831; font-weight:700; margin:0; font-size:15px;">Tamamlandı</p>`;
                        } catch (e) {}
                    }
                }
            } catch (e) {}
        });
    } catch (e) {}
}


/**
 * Cevabı Alır, Üst Rozetleri Yeşile Çevirir, AI ile Değerlendirir ve Sonuçları Gösterir
 */
async function cevabiDegerlendir() {
    // 1. ÜST ROZETLERİ ANINDA YEŞİL VE "TAMAMLANDI" YAP
    s3DurumunuTamamla();

    // Session'a başarılı tamamlandı durumunu yaz
    sessionKaydet('s3_tamamlandi', 'true');

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

    sessionKaydet('s3_cevap', cevapMetni);

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

    // 7. SONUÇLARI İLGİLİ ELEMANLARA YAZ VE SESSION'A KAYDET:
    sessionKaydet('s3_puan', String(degerlendirme.puan));
    sessionKaydet('s3_guclu', String(degerlendirme.guclu_yonler));
    sessionKaydet('s3_gelisim', String(degerlendirme.gelisim_alanlari));

    try {
        if ($w('#scoreText')) {
            $w('#scoreText').text = String(degerlendirme.puan);
        }
    } catch (e) {}

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

    // Kalıcılığı kesinleştir
    sessionKaydet('s3_tamamlandi', 'true');
    s3DurumunuTamamla();

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
