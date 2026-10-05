/**
 * PRUVAI — Wix Studio "Seçim ve Karar / S3" Senaryo Sayfa Kodu
 * 
 * Bu kod, adayın yazdığı cevabı AI ile analiz eder, puanlar ve
 * Güçlü Yönler ile Gelişim Alanları geri bildirimlerini dinamik olarak ekrana basar.
 * 
 * KULLANILAN ELEMAN ID'LERİ:
 * -------------------------------------------------------------
 * 1. Cevap Giriş Alanı:
 *    - #answerInput           (Adayın cevabını yazdığı çok satırlı metin kutusu)
 * 
 * 2. Buton:
 *    - #evaluateButton        ("Gönder ve Değerlendir" butonu)
 *      (Not: Kod alternatif olarak #btnEvaluate, #submitButton, #button1'i de destekler)
 * 
 * 3. AI Değerlendirme Konteynırı (Başlangıçta KAPALI):
 *    - #aiEvaluationContainer (Turuncu çerçeveli tüm değerlendirme kutusu)
 *      (Not: Kod alternatif olarak #evaluationContainer, #aiBox, #box1'i de destekler)
 * 
 * 4. Sonuç Alanları:
 *    - #scoreText             ("-" alanındaki puan, örn: 85)
 *    - #strengthsText         (Güçlü Yönler metni)
 *    - #developmentText       (Gelişim Alanı metni)
 */

import { fetch } from 'wix-fetch';

// Canlı Python Render Backend URL
const BACKEND_URL = "https://pruvai-backend.onrender.com";

$w.onReady(function () {
    console.log("PRUVAI Seçim ve Karar / S3 Sayfası Yüklendi.");

    // 1. Sayfa ilk açıldığında AI Değerlendirme kutusunu SIFIR PİKSEL (collapse) yap
    // Böylece sayfa başlangıçta tertemiz ve kısa kalır, beyaz boşluk oluşmaz.
    degerlendirmeKutusunuKapat();

    // 2. "Gönder ve Değerlendir" Butonunu Bağla
    const olasiButonlar = [
        "#evaluateButton", 
        "#btnEvaluate", 
        "#gonderVeDegerlendirBtn", 
        "#submitButton", 
        "#btnGonder", 
        "#button1", 
        "#button2"
    ];

    for (let bId of olasiButonlar) {
        try {
            const btn = $w(bId);
            if (btn && typeof btn.onClick === 'function') {
                btn.onClick(async () => {
                    await cevabiDegerlendir();
                });
                break;
            }
        } catch (e) {}
    }
});


/**
 * AI Değerlendirme Kutusunu Başlangıçta Kapatır (Collapse)
 */
function degerlendirmeKutusunuKapat() {
    const olasiKutular = [
        "#aiEvaluationContainer", 
        "#evaluationContainer", 
        "#aiResultBox", 
        "#evaluationBox", 
        "#aiBox", 
        "#boxEvaluation", 
        "#box1", 
        "#box2", 
        "#container1"
    ];

    for (let cId of olasiKutular) {
        try {
            const c = $w(cId);
            if (c) {
                if (typeof c.collapse === 'function') c.collapse();
                if (typeof c.hide === 'function') c.hide();
            }
        } catch (e) {}
    }
}


/**
 * Cevabı Alır, Canlı AI ile Değerlendirir ve Sonuçları Gösterir
 */
async function cevabiDegerlendir() {
    // 1. Kullanıcının yazdığı cevabı oku
    let cevapMetni = "";
    try {
        if ($w('#answerInput')) {
            cevapMetni = ($w('#answerInput').value || "").trim();
        }
    } catch (e) {}

    // Boş cevap kontrolü
    if (!cevapMetni) {
        try {
            if ($w('#answerInput')) {
                $w('#answerInput').placeholder = "Lütfen önce hangi adayı neden seçtiğinizi yazınız...";
            }
        } catch (e) {}
        return;
    }

    // 2. Buton durumunu 'Değerlendiriliyor' yap
    let aktifButon = null;
    const olasiButonlar = ["#evaluateButton", "#btnEvaluate", "#gonderVeDegerlendirBtn", "#submitButton", "#button1"];
    for (let bId of olasiButonlar) {
        try {
            const b = $w(bId);
            if (b && typeof b.label !== 'undefined') {
                aktifButon = b;
                b.label = "Değerlendiriliyor... ⏳";
                break;
            }
        } catch (e) {}
    }

    // Yükleniyor durumunu alanlara önceden yaz
    try { if ($w('#scoreText')) $w('#scoreText').text = ".."; } catch (e) {}
    try { if ($w('#strengthsText')) $w('#strengthsText').text = "Yapay zekâ adayın yetkinlik eşleşmesini inceliyor..."; } catch (e) {}
    try { if ($w('#developmentText')) $w('#developmentText').text = "Pozisyon dinamiklerine göre gelişim önerisi hazırlanıyor..."; } catch (e) {}

    // Kutuyu önceden genişletip ekrana kaydır
    await degerlendirmeKutusunuAc();

    // 3. Canlı Render Backend'e AI Değerlendirme İsteği Gönder
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

    // 4. Eğer API gecikirse veya bağlantı sağlanamazsa devrede olan Akıllı Yerel İK Motoru
    if (!degerlendirme) {
        degerlendirme = akilliYerelDegerlendirme(cevapMetni);
    }

    // 5. SONUÇLARI İLGİLİ ELEMANLARA YAZ:
    // Puan (#scoreText)
    try {
        if ($w('#scoreText')) {
            $w('#scoreText').text = String(degerlendirme.puan);
        }
    } catch (e) {}

    // Güçlü Yönler (#strengthsText)
    try {
        if ($w('#strengthsText')) {
            $w('#strengthsText').text = String(degerlendirme.guclu_yonler);
        }
    } catch (e) {}

    // Gelişim Alanı (#developmentText)
    try {
        if ($w('#developmentText')) {
            $w('#developmentText').text = String(degerlendirme.gelisim_alanlari);
        }
    } catch (e) {}

    // 6. Buton yazısını eski haline getir
    if (aktifButon) {
        aktifButon.label = "Gönder ve Değerlendir ✈";
    }

    console.log("Değerlendirme tamamlandı. Skor:", degerlendirme.puan);
}


/**
 * AI Değerlendirme Kutusunu Açar ve Sayfayı Aşağı Kaydırır (Expand & ScrollTo)
 */
async function degerlendirmeKutusunuAc() {
    const olasiKutular = [
        "#aiEvaluationContainer", 
        "#evaluationContainer", 
        "#aiResultBox", 
        "#evaluationBox", 
        "#aiBox", 
        "#boxEvaluation", 
        "#box1", 
        "#box2", 
        "#container1"
    ];

    for (let cId of olasiKutular) {
        try {
            const c = $w(cId);
            if (c) {
                if (typeof c.show === 'function') await c.show();
                if (typeof c.expand === 'function') await c.expand();

                // Sayfayı yeni açılan kutuya doğru kaydır
                setTimeout(() => {
                    try {
                        if (typeof c.scrollTo === 'function') c.scrollTo();
                    } catch (e) {}
                }, 80);
                break;
            }
        } catch (e) {}
    }
}


/**
 * Akıllı Yedek İK Değerlendirme Motoru (Offline / Hızlı Yanıt Koruması)
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


// Wix Studio Properties Panelinde "onClick" event'i oluşturulmuşsa çalışan yedek handler
export async function evaluateButton_click(event) {
    await cevabiDegerlendir();
}
