/**
 * PRUVAI — Wix Studio Velo Entegrasyonu
 * İletişim formu, AI kariyer asistanı ve yönetim paneli fonksiyonları.
 */

import { fetch } from 'wix-fetch';
import wixData from 'wix-data';

// Canlı Render Python Backend bağlantı adresi
const BACKEND_URL = "https://pruvai-backend.onrender.com"; 

$w.onReady(function () {
    console.log("PRUVAI Velo Sistemi Başlatılıyor...");

    // 1. İLETİŞİM FORMU (Sayfada form varsa otomatik çalıştırır)
    if ($w('#contactPageSubmitButton')) {
        baslatIletisimFormu();
    }

    // 2. CHATBOT SOHBET ALANI (Sayfada chatbot varsa otomatik çalıştırır)
    if ($w('#chatRepeater')) {
        baslatChatbot();
    }

    // 3. YÖNETİM PANELİ (Sayfada yönetim paneli veya sayaç kartları varsa otomatik çalıştırır)
    if ($w('#adminMessagesRepeater') || $w('#adminTotalMessages')) {
        baslatYonetimPaneli();
    }
});


// ============================================================================
// 1. İLETİŞİM FORMU (BİZE ULAŞIN)
// ============================================================================
function baslatIletisimFormu() {
    if ($w('#contactPageSuccessMessage')) {
        $w('#contactPageSuccessMessage').hide();
        $w('#contactPageSuccessMessage').collapse();
    }

    $w('#contactPageSubmitButton').onClick(async () => {
        const contactMessage = {
            fullName: $w('#contactPageName') ? $w('#contactPageName').value : "",
            email: $w('#contactPageEmail') ? $w('#contactPageEmail').value : "",
            userType: $w('#contactPageUserType') ? $w('#contactPageUserType').value : "Aday",
            subject: $w('#contactPageSubject') ? $w('#contactPageSubject').value : "Platform Hakkında",
            message: $w('#contactPageMessage') ? $w('#contactPageMessage').value : ""
        };

        if (!contactMessage.fullName || !contactMessage.email) {
            console.warn("Lütfen isim ve iletişim bilgilerini doldurunuz.");
            return;
        }

        try {
            // 1. ÖNCELİKLİ: Doğrudan canlı Render veritabanına kaydediyoruz
            const response = await fetch(`${BACKEND_URL}/api/leads`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isim: contactMessage.fullName,
                    telefon: contactMessage.email,
                    hedef_rol: contactMessage.userType,
                    konu: contactMessage.subject,
                    mesaj: contactMessage.message
                })
            });

            const resJson = await response.json();
            console.log("Backend kayıt başarılı:", resJson);

            // 2. İKİNCİL: Wix CMS koleksiyonuna opsiyonel kayıt
            try {
                await wixData.insert('ContactMessages', contactMessage);
            } catch (wixErr) {
                console.warn("Wix CMS kaydı atlandı:", wixErr);
            }

            // Onay mesajını göster
            if ($w('#contactPageSuccessMessage')) {
                $w('#contactPageSuccessMessage').expand();
                $w('#contactPageSuccessMessage').show();
            }

            // Form alanlarını sıfırla
            if ($w('#contactPageName')) $w('#contactPageName').value = '';
            if ($w('#contactPageEmail')) $w('#contactPageEmail').value = '';
            if ($w('#contactPageUserType')) $w('#contactPageUserType').value = undefined;
            if ($w('#contactPageSubject')) $w('#contactPageSubject').value = undefined;
            if ($w('#contactPageMessage')) $w('#contactPageMessage').value = '';

            // Eğer Yönetim Paneli de aynı sayfadaysa hemen tabloyu ve sayaçları güncelle!
            if ($w('#adminMessagesRepeater') || $w('#adminTotalMessages')) {
                tabloyuguncelle();
            }

        } catch (error) {
            console.error('Mesaj iletilirken bağlantı hatası oluştu:', error);
        }
    });
}


// ============================================================================
// 2. PRUVAI AI KARİYER ASİSTANI (CHATBOT)
// ============================================================================
function baslatChatbot() {
    function formatWixChatHtml(rawText) {
        if (!rawText) return "";
        const lines = rawText.split('\n');
        let htmlParts = [];
        
        for (let line of lines) {
            let trimmed = line.trim();
            if (!trimmed) {
                htmlParts.push('<p style="margin: 0; line-height: 8px;">&nbsp;</p>');
                continue;
            }
            let formatted = trimmed
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1');
            
            if (formatted.startsWith('- ') || formatted.startsWith('* ') || formatted.startsWith('• ')) {
                let maddeMetni = formatted.replace(/^(\-|\*|•)\s+/, '');
                htmlParts.push(`<p style="margin: 0 0 10px 0; font-size: 15px; line-height: 1.55; color: #FFFFFF;">• ${maddeMetni}</p>`);
            } else {
                htmlParts.push(`<p style="margin: 0 0 10px 0; font-size: 15px; line-height: 1.55; color: #FFFFFF;">${formatted}</p>`);
            }
        }
        return htmlParts.join('');
    }

    let sohbetGecmisi = [];
    let mesajListesi = [
        {
            _id: "msg_baslangic",
            sender: "assistant",
            text: "Merhaba! Ben PRUVAI AI Kariyer Asistanı. Hedeflediğiniz meslek, kariyer değişimi veya işveren yetkinlik modülleri hakkında aklınıza takılan her şeyi sorabilirsiniz."
        }
    ];

    $w('#chatRepeater').onItemReady(($item, itemData) => {
        if (itemData.sender === 'user') {
            $item('#botBubble').collapse();
            $item('#userBubble').expand();
            $item('#userText').text = itemData.text;
        } else {
            $item('#userBubble').collapse();
            $item('#botBubble').expand();
            $item('#botText').html = formatWixChatHtml(itemData.text);
        }
    });

    $w('#chatRepeater').data = mesajListesi;

    async function soruGonder() {
        const soru = $w('#chatInput').value;
        if (!soru || soru.trim() === '') return;
        const temizSoru = soru.trim();

        mesajListesi.push({
            _id: "usr_" + Date.now(),
            sender: "user",
            text: temizSoru
        });

        const loadingId = "loading_" + Date.now();
        mesajListesi.push({
            _id: loadingId,
            sender: "assistant",
            text: "PRUVAI AI Kariyer Asistanı düşünüyor..."
        });

        $w('#chatRepeater').data = mesajListesi;
        $w('#chatInput').value = '';
        $w('#chatSendButton').disable();

        try {
            const response = await fetch(`${BACKEND_URL}/api/sohbet`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mesaj: temizSoru,
                    gecmis: sohbetGecmisi
                })
            });

            const veri = await response.json();
            mesajListesi = mesajListesi.filter(m => m._id !== loadingId);

            if (veri.basari) {
                mesajListesi.push({
                    _id: "ai_" + Date.now(),
                    sender: "assistant",
                    text: veri.cevap
                });
                sohbetGecmisi.push({ role: "user", content: temizSoru });
                sohbetGecmisi.push({ role: "assistant", content: veri.cevap });
            } else {
                mesajListesi.push({
                    _id: "err_" + Date.now(),
                    sender: "assistant",
                    text: "Hata: " + (veri.hata || "Cevap üretilemedi.")
                });
            }

        } catch (error) {
            mesajListesi = mesajListesi.filter(m => m._id !== loadingId);
            mesajListesi.push({
                _id: "conn_err_" + Date.now(),
                sender: "assistant",
                text: "Bağlantı hatası: Canlı sunucuya erişilemedi."
            });
            console.error("AI Bağlantı Hatası:", error);
        } finally {
            $w('#chatRepeater').data = mesajListesi;
            $w('#chatSendButton').enable();
        }
    }

    $w('#chatSendButton').onClick(soruGonder);
    $w('#chatInput').onKeyPress((event) => {
        if (event.key === "Enter") {
            soruGonder();
        }
    });
}


// ============================================================================
// 3. YÖNETİM PANELİ (LEAD TAKİP MASASI & DİNAMİK KPI KARTLARI)
// ============================================================================
export function baslatYonetimPaneli() {
    let tumKayitlar = [];

    // Tablo satırlarını gelen veriyle eşleştiriyoruz
    if ($w("#adminMessagesRepeater")) {
        $w("#adminMessagesRepeater").onItemReady(($item, itemData, index) => {
            if ($item("#adminRowName")) {
                $item("#adminRowName").text = itemData.fullName || itemData.isim || "Aday";
            }

            if ($item("#adminRowEmail")) {
                $item("#adminRowEmail").text = itemData.email || itemData.telefon || "-";
            }

            if ($item("#adminRowUserType")) {
                $item("#adminRowUserType").text = itemData.userType || itemData.hedef_rol || "Yeni Mezun";
            }

            if ($item("#adminRowSubject")) {
                $item("#adminRowSubject").text = itemData.subject || itemData.konu || "Platform Hakkında";
            }

            if ($item("#adminRowDate")) {
                if (itemData.tarih) {
                    const parca = String(itemData.tarih).slice(0, 10).split('-');
                    if (parca.length === 3) {
                        $item("#adminRowDate").text = `${parca[2]}.${parca[1]}.${parca[0]}`;
                    } else {
                        $item("#adminRowDate").text = String(itemData.tarih).slice(0, 10);
                    }
                } else if (itemData._createdDate) {
                    $item("#adminRowDate").text = new Date(itemData._createdDate).toLocaleDateString('tr-TR');
                } else {
                    $item("#adminRowDate").text = "-";
                }
            }

            // "Detayı Gör >" Butonu
            if ($item("#adminRowDetailBtn")) {
                $item("#adminRowDetailBtn").onClick(() => {
                    const mesajIcerik = itemData.message || itemData.mesaj || "Mesaj içeriği bulunamadı.";
                    const gonderen = itemData.fullName || itemData.isim || "Aday";
                    const email = itemData.email || itemData.telefon || "-";
                    const userType = itemData.userType || itemData.hedef_rol || "Yeni Mezun";
                    const subject = itemData.subject || itemData.konu || "Platform Hakkında";
                    const date = $item("#adminRowDate") ? $item("#adminRowDate").text : "-";

                    if ($w("#adminDetailName")) $w("#adminDetailName").text = gonderen;
                    if ($w("#adminDetailEmail")) $w("#adminDetailEmail").text = email;
                    if ($w("#adminDetailUserType")) $w("#adminDetailUserType").text = userType;
                    if ($w("#adminDetailSubject")) $w("#adminDetailSubject").text = subject;
                    if ($w("#adminDetailDate")) $w("#adminDetailDate").text = date;
                    if ($w("#adminDetailMessage")) $w("#adminDetailMessage").text = mesajIcerik;

                    if ($w("#adminDetailSection")) {
                        $w("#adminDetailSection").expand();
                        $w("#adminDetailSection").show();
                        $w("#adminDetailSection").scrollTo();
                    }
                });
            }

            // "Sil" Butonu
            if ($item("#adminRowDeleteBtn")) {
                $item("#adminRowDeleteBtn").onClick(async () => {
                    if (itemData.id) {
                        try {
                            await fetch(`${BACKEND_URL}/api/leads/${itemData.id}`, { method: "DELETE" });
                        } catch (e) {}
                    }
                    if (itemData._id) {
                        try {
                            await wixData.remove("ContactMessages", itemData._id);
                        } catch (e) {}
                    }
                    tabloyuguncelle();
                });
            }
        });
    }

    // Detay panelini kapatma butonu (X)
    if ($w("#adminDetailCloseBtn") && $w("#adminDetailSection")) {
        $w("#adminDetailCloseBtn").onClick(() => {
            $w("#adminDetailSection").hide();
            $w("#adminDetailSection").collapse();
        });
    }

    // DİNAMİK KPI KARTLARINI HESAPLAR VE SAYILARI GÜNCELLER
    function metrikleriHesapla(liste) {
        const toplam = liste.length;
        const bugun = new Date();
        const buYil = bugun.getFullYear();
        const buAy = bugun.getMonth();
        const buGun = bugun.getDate();

        let buAySayac = 0;
        let bugunSayac = 0;

        liste.forEach(item => {
            const rawDate = item.tarih ? new Date(item.tarih.replace(" ", "T")) : (item._createdDate ? new Date(item._createdDate) : null);
            if (rawDate && !isNaN(rawDate.getTime())) {
                if (rawDate.getFullYear() === buYil && rawDate.getMonth() === buAy) {
                    buAySayac++;
                    if (rawDate.getDate() === buGun) {
                        bugunSayac++;
                    }
                }
            } else {
                buAySayac++;
            }
        });

        // 1. KART: Toplam Mesaj (#adminTotalMessages)
        if ($w("#adminTotalMessages")) {
            $w("#adminTotalMessages").text = String(toplam);
        }

        // 2. KART: Bu Ay Gelen (#adminMonthMessages)
        if ($w("#adminMonthMessages")) {
            $w("#adminMonthMessages").text = String(buAySayac);
        }

        // 3. KART: Bugün Gelen (#adminTodayMessages)
        if ($w("#adminTodayMessages")) {
            $w("#adminTodayMessages").text = String(bugunSayac);
        }
    }

    // LİSTEYİ VE KARTLARI CANLI RENDER BACKEND'DEN ÇEKİP GÜNCELLER
    window.tabloyuguncelle = async function() {
        console.log("Canlı veritabanı sorgulanıyor...");
        try {
            const response = await fetch(`${BACKEND_URL}/api/leads`);
            const sonuc = await response.json();
            
            if (sonuc.basari && Array.isArray(sonuc.leadler)) {
                // Repeater'ın hata vermemesi için her elemana benzersiz _id tanımlıyoruz
                tumKayitlar = sonuc.leadler.map((item, idx) => ({
                    ...item,
                    _id: String(item._id || item.id || ("lead_" + idx))
                }));

                metrikleriHesapla(tumKayitlar);

                if ($w("#adminMessagesRepeater")) {
                    $w("#adminMessagesRepeater").data = tumKayitlar;
                }
                return;
            }
        } catch (backendErr) {
            console.warn("Backend verisi çekilemedi, Wix CMS deneniyor:", backendErr);
        }

        // Yedek fallback: Wix CMS
        try {
            const wixVerisi = await wixData.query("ContactMessages").descending("_createdDate").find();
            if (wixVerisi.items.length > 0) {
                tumKayitlar = wixVerisi.items;
                metrikleriHesapla(tumKayitlar);
                if ($w("#adminMessagesRepeater")) {
                    $w("#adminMessagesRepeater").data = tumKayitlar;
                }
            }
        } catch (wixErr) {
            console.warn("Wix CMS kaydı okunamadı:", wixErr);
        }
    };

    // Arama Kutusu Filtreleme
    if ($w("#adminSearchInput")) {
        $w("#adminSearchInput").onInput((event) => {
            const aranan = event.target.value.toLowerCase().trim();
            if (!aranan) {
                if ($w("#adminMessagesRepeater")) $w("#adminMessagesRepeater").data = tumKayitlar;
                return;
            }
            const filtrelenmis = tumKayitlar.filter(item => {
                const ad = (item.fullName || item.isim || "").toLowerCase();
                const email = (item.email || item.telefon || "").toLowerCase();
                const tip = (item.userType || item.hedef_rol || "").toLowerCase();
                const konu = (item.subject || item.konu || "").toLowerCase();
                const msg = (item.message || item.mesaj || "").toLowerCase();
                return ad.includes(aranan) || email.includes(aranan) || tip.includes(aranan) || konu.includes(aranan) || msg.includes(aranan);
            });
            if ($w("#adminMessagesRepeater")) $w("#adminMessagesRepeater").data = filtrelenmis;
        });
    }

    // Yenile Butonu
    if ($w("#adminRefreshButton")) {
        $w("#adminRefreshButton").onClick(() => {
            window.tabloyuguncelle();
        });
    }

    // İlk açılışta verileri çek
    window.tabloyuguncelle();
}
