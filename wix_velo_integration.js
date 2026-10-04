/**
 * PRUVAI — Wix Studio Velo Entegrasyonu
 * İletişim formu, AI kariyer asistanı ve yönetim paneli fonksiyonları.
 * 
 * TAM DİNAMİK WIX CMS + CANLI RENDER ENTEGRASYONU
 */

import { fetch } from 'wix-fetch';
import wixData from 'wix-data';

// Canlı Python Backend bağlantı adresi (Render)
const BACKEND_URL = "https://pruvai-backend.onrender.com"; 

$w.onReady(function () {
    console.log("PRUVAI Sistemi Yükleniyor...");

    // 1. YÖNETİM PANELİ (Sayfada sayaçlar, tablo veya detay paneli varsa doğrudan başlat)
    try {
        if ($w('#adminTotalMessages') || $w('#adminMessagesRepeater') || $w('#adminMessageDetailContainer') || $w('#adminViewMessageButton')) {
            baslatYonetimPaneli();
        }
    } catch (e) {}

    // 2. BİZE ULAŞIN FORMU (Sayfada form gönder butonu varsa doğrudan başlat)
    try {
        if ($w('#contactPageSubmitButton')) {
            baslatIletisimFormu();
        }
    } catch (e) {}

    // 3. CHATBOT SOHBET ALANI (Sayfada chatbot repeater varsa doğrudan başlat)
    try {
        if ($w('#chatRepeater')) {
            baslatChatbot();
        }
    } catch (e) {}
});


// ============================================================================
// 1. İLETİŞİM FORMU (BİZE ULAŞIN SAYFASI)
// ============================================================================
function baslatIletisimFormu() {
    try {
        if ($w('#contactPageSuccessMessage')) {
            $w('#contactPageSuccessMessage').hide();
            $w('#contactPageSuccessMessage').collapse();
        }
    } catch (e) {}

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

        // 1. WIX CMS KOLEKSİYONUNA YAZMA (Wix üzerinde tamamen bağımsız dinamiklik)
        try {
            await wixData.insert('ContactMessages', contactMessage);
            console.log("Wix CMS koleksiyonuna başarıyla eklendi.");
        } catch (wixErr) {
            console.warn("Wix CMS kaydı uyarısı:", wixErr);
        }

        // 2. CANLI RENDER BACKEND'E YAZMA (Hocanın kontrol ettiği veritabanı)
        try {
            await fetch(`${BACKEND_URL}/api/leads`, {
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
            console.log("Backend veritabanına başarıyla iletildi.");
        } catch (beErr) {
            console.warn("Backend iletim uyarısı:", beErr);
        }

        // Onay mesajını göster
        try {
            if ($w('#contactPageSuccessMessage')) {
                $w('#contactPageSuccessMessage').expand();
                $w('#contactPageSuccessMessage').show();
            }
        } catch (e) {}

        // Form alanlarını sıfırla
        try {
            if ($w('#contactPageName')) $w('#contactPageName').value = '';
            if ($w('#contactPageEmail')) $w('#contactPageEmail').value = '';
            if ($w('#contactPageUserType')) $w('#contactPageUserType').value = undefined;
            if ($w('#contactPageSubject')) $w('#contactPageSubject').value = undefined;
            if ($w('#contactPageMessage')) $w('#contactPageMessage').value = '';
        } catch (e) {}

        // Eğer Yönetim Paneli de aynı sayfadaysa hemen tabloyu ve sayaçları yenile!
        try {
            if (typeof window !== 'undefined' && typeof window.tabloyuguncelle === 'function') {
                window.tabloyuguncelle();
            }
        } catch (e) {}
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

    try {
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
    } catch (e) {}

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

    try {
        $w('#chatSendButton').onClick(soruGonder);
        $w('#chatInput').onKeyPress((event) => {
            if (event.key === "Enter") {
                soruGonder();
            }
        });
    } catch (e) {}
}


// ============================================================================
// 3. YÖNETİM PANELİ (LEAD TAKİP MASASI & DİNAMİK KPI SAYAÇLARI)
// ============================================================================
export function baslatYonetimPaneli() {
    let tumKayitlar = [];

    // Detay panelini başlangıçta SIFIR PİKSEL YAP (collapse)
    try {
        const c = $w('#adminMessageDetailContainer');
        if (c) {
            try { c.show(); } catch (e) {}
            try { c.collapse(); } catch (e) {}
        }
    } catch (e) {}

    // REPEATER SATIRLARINI DOLDURMA YARDIMCISI
    function satiriDoldur($item, itemData) {
        // 1. İsim
        try {
            if ($item("#adminRowName")) {
                $item("#adminRowName").text = itemData.fullName || itemData.isim || "Aday";
            }
        } catch (e) {}

        // 2. E-posta / İletişim
        try {
            if ($item("#adminRowEmail")) {
                $item("#adminRowEmail").text = itemData.email || itemData.telefon || "-";
            }
        } catch (e) {}

        // 3. Kullanıcı Tipi
        try {
            if ($item("#adminRowUserType")) {
                $item("#adminRowUserType").text = itemData.userType || itemData.hedef_rol || "Yeni Mezun";
            }
        } catch (e) {}

        // 4. Konu
        try {
            if ($item("#adminRowSubject")) {
                $item("#adminRowSubject").text = itemData.subject || itemData.konu || "Platform Hakkında";
            }
        } catch (e) {}

        // 5. Tarih (GG.AA.YYYY)
        try {
            if ($item("#adminRowDate")) {
                if (itemData._createdDate) {
                    $item("#adminRowDate").text = new Date(itemData._createdDate).toLocaleDateString('tr-TR');
                } else if (itemData.tarih) {
                    const parca = String(itemData.tarih).slice(0, 10).split('-');
                    $item("#adminRowDate").text = parca.length === 3 ? `${parca[2]}.${parca[1]}.${parca[0]}` : String(itemData.tarih).slice(0, 10);
                } else {
                    $item("#adminRowDate").text = "-";
                }
            }
        } catch (e) {}

        // 6. "Detayı Gör >" BUTONU (#adminViewMessageButton)
        try {
            const btnDetail = $item("#adminViewMessageButton") || $item("#adminRowDetailBtn");
            if (btnDetail && typeof btnDetail.onClick === 'function') {
                btnDetail.onClick(async () => {
                    await mesajDetayiniGoster(itemData);
                });
            }
        } catch (e) {}

        // 7. "Sil" BUTONU
        try {
            const btnSil = $item("#adminRowDeleteBtn") || $item("#adminDeleteBtn") || $item("#btnDelete");
            if (btnSil && typeof btnSil.onClick === 'function') {
                btnSil.onClick(async () => {
                    if (itemData._id) {
                        try { await wixData.remove("ContactMessages", itemData._id); } catch (e) {}
                    }
                    if (itemData.id) {
                        try { await fetch(`${BACKEND_URL}/api/leads/${itemData.id}`, { method: "DELETE" }); } catch (e) {}
                    }
                    tabloyuguncelle();
                });
            }
        } catch (e) {}
    }

    // MESAJ DETAYINI GÖSTER
    async function mesajDetayiniGoster(itemData) {
        if (!itemData) return;

        const isim = itemData.fullName || itemData.isim || "Aday";
        const email = itemData.email || itemData.telefon || "-";
        const userType = itemData.userType || itemData.hedef_rol || "Yeni Mezun";
        const subject = itemData.subject || itemData.konu || "Platform Hakkında";
        const mesajIcerik = itemData.message || itemData.mesaj || "Mesaj içeriği bulunamadı.";
        
        let tarihMetni = "-";
        if (itemData._createdDate) {
            tarihMetni = new Date(itemData._createdDate).toLocaleDateString('tr-TR');
        } else if (itemData.tarih) {
            const parca = String(itemData.tarih).slice(0, 10).split('-');
            tarihMetni = parca.length === 3 ? `${parca[2]}.${parca[1]}.${parca[0]}` : String(itemData.tarih).slice(0, 10);
        }

        // Birebir kullanıcının belirttiği ID'lere verileri ata
        try { if ($w('#adminDetailName')) $w('#adminDetailName').text = String(isim); } catch (e) {}
        try { if ($w('#adminDetailEmail')) $w('#adminDetailEmail').text = String(email); } catch (e) {}
        try { if ($w('#adminDetailUserType')) $w('#adminDetailUserType').text = String(userType); } catch (e) {}
        try { if ($w('#adminDetailSubject')) $w('#adminDetailSubject').text = String(subject); } catch (e) {}
        try { if ($w('#adminDetailDate')) $w('#adminDetailDate').text = String(tarihMetni); } catch (e) {}
        try {
            if ($w('#adminDetailMessage')) {
                if (typeof $w('#adminDetailMessage').text !== 'undefined') {
                    $w('#adminDetailMessage').text = String(mesajIcerik);
                } else if (typeof $w('#adminDetailMessage').value !== 'undefined') {
                    $w('#adminDetailMessage').value = String(mesajIcerik);
                }
            }
        } catch (e) {}

        // #adminMessageDetailContainer KONTEYNIRINI AÇ
        try {
            const container = $w("#adminMessageDetailContainer");
            if (container) {
                // Önce görünür yap (Hidden özelliğini kaldır)
                try { await container.show(); } catch (err) {}
                // Sonra genişlet (Collapsed özelliğini kaldır)
                try { await container.expand(); } catch (err) {}

                // Ekranı pürüzsüz kaydır
                setTimeout(async () => {
                    try {
                        if (typeof container.scrollTo === 'function') {
                            await container.scrollTo();
                        }
                    } catch (scrollErr) {}
                }, 80);
            }
        } catch (e) {}

        console.log(`[${isim}] Mesaj Detayı açıldı (#adminMessageDetailContainer).`);
    }

    // REPEATER BAĞLAMA
    try {
        if ($w("#adminMessagesRepeater")) {
            $w("#adminMessagesRepeater").onItemReady(($item, itemData, index) => {
                satiriDoldur($item, itemData);
            });
        }
    } catch (repErr) {
        console.warn("Repeater kurulum hatası:", repErr);
    }

    // Detay panelini kapatma (X) butonu
    const closeBtnAdaylari = [
        "#adminDetailCloseBtn",
        "#adminMessageDetailCloseButton",
        "#adminMessageDetailCloseBtn",
        "#closeDetailBtn", 
        "#detailCloseBtn", 
        "#closeBtn"
    ];
    for (let cId of closeBtnAdaylari) {
        try {
            const btnClose = $w(cId);
            if (btnClose && typeof btnClose.onClick === 'function') {
                btnClose.onClick(async () => {
                    try {
                        const p = $w("#adminMessageDetailContainer");
                        if (p) {
                            try { await p.collapse(); } catch (e) {}
                        }
                    } catch (e) {}
                });
            }
        } catch (e) {}
    }

    // DİNAMİK KPI SAYAÇLARI HESAPLAMA (3 RAKAMLARINI GERÇEK SAYILARLA DEĞİŞTİRİR)
    function metrikleriHesapla(liste) {
        const toplam = liste.length;
        const bugun = new Date();
        const buYil = bugun.getFullYear();
        const buAy = bugun.getMonth();
        const buGun = bugun.getDate();

        let buAySayac = 0;
        let bugunSayac = 0;

        liste.forEach(item => {
            const rawDate = item._createdDate ? new Date(item._createdDate) : (item.tarih ? new Date(item.tarih.replace(" ", "T")) : null);
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
        try {
            if ($w("#adminTotalMessages")) {
                $w("#adminTotalMessages").text = String(toplam);
            }
        } catch (e) {}

        // 2. KART: Bu Ay Gelen (#adminMonthMessages)
        try {
            if ($w("#adminMonthMessages")) {
                $w("#adminMonthMessages").text = String(buAySayac);
            }
        } catch (e) {}

        // 3. KART: Bugün Gelen (#adminTodayMessages)
        try {
            if ($w("#adminTodayMessages")) {
                $w("#adminTodayMessages").text = String(bugunSayac);
            }
        } catch (e) {}
    }

    // LİSTEYİ VE KARTLARI GÜNCELLE (WIX CMS ÖNCELİKLİ & RENDER ENTEGRE)
    async function tabloyuguncelle() {
        console.log("Kayıtlar Wix CMS üzerinden taranıyor...");
        let kayitlar = [];

        // 1. Wix CMS (ContactMessages) koleksiyonunu sorgula
        try {
            const wixSonuc = await wixData.query("ContactMessages").descending("_createdDate").find();
            if (wixSonuc && wixSonuc.items && wixSonuc.items.length > 0) {
                kayitlar = wixSonuc.items;
                console.log("Wix CMS'ten gelen kayıt sayısı:", kayitlar.length);
            }
        } catch (wixErr) {
            console.warn("Wix CMS sorgusu hatası:", wixErr);
        }

        // 2. Eğer Wix CMS'te kayıt yoksa veya backend'den de çekmek gerekirse
        if (kayitlar.length === 0) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/leads`);
                const sonuc = await response.json();
                if (sonuc.basari && Array.isArray(sonuc.leadler) && sonuc.leadler.length > 0) {
                    kayitlar = sonuc.leadler.map((item, idx) => ({
                        ...item,
                        _id: String(item._id || item.id || ("lead_" + idx))
                    }));
                }
            } catch (beErr) {
                console.warn("Backend bağlantı hatası:", beErr);
            }
        }

        tumKayitlar = kayitlar;
        
        // Sayaçları ve Repeater'ı güncelle
        metrikleriHesapla(tumKayitlar);

        try {
            if ($w("#adminMessagesRepeater")) {
                $w("#adminMessagesRepeater").data = tumKayitlar;
                // Halihazırda ekranda olan satırlara da butonları bağla
                $w("#adminMessagesRepeater").forEachItem(($item, itemData) => {
                    satiriDoldur($item, itemData);
                });
            }
        } catch (repDataErr) {
            console.warn("Repeater veri aktarımı uyarısı:", repDataErr);
        }
    }

    // Global erişim için fonksiyonu pencereye bağlıyoruz
    if (typeof window !== 'undefined') {
        window.tabloyuguncelle = tabloyuguncelle;
    }

    // Canlı Arama Kutusu Filtreleme
    try {
        if ($w("#adminSearchInput")) {
            $w("#adminSearchInput").onInput((event) => {
                const q = event.target.value.toLowerCase().trim();
                if (!q) {
                    if ($w("#adminMessagesRepeater")) $w("#adminMessagesRepeater").data = tumKayitlar;
                    return;
                }
                const f = tumKayitlar.filter(it => {
                    const ad = (it.fullName || it.isim || "").toLowerCase();
                    const em = (it.email || it.telefon || "").toLowerCase();
                    const rol = (it.userType || it.hedef_rol || "").toLowerCase();
                    const konu = (it.subject || it.konu || "").toLowerCase();
                    const msg = (it.message || it.mesaj || "").toLowerCase();
                    return ad.includes(q) || em.includes(q) || rol.includes(q) || konu.includes(q) || msg.includes(q);
                });
                if ($w("#adminMessagesRepeater")) $w("#adminMessagesRepeater").data = f;
            });
        }
    } catch (e) {}

    // Yenile Butonu
    try {
        if ($w("#adminRefreshButton")) {
            $w("#adminRefreshButton").onClick(() => {
                tabloyuguncelle();
            });
        }
    } catch (e) {}

    // Sayfa açılır açılmaz verileri çek ve göster!
    tabloyuguncelle();
}

/**
 * Wix Studio Properties panelinden "onClick" olayı bağlandıysa çalışan fonksiyonlar
 */
export async function adminViewMessageButton_click(event) {
    try {
        const itemId = event.context && event.context.itemId;
        let itemData = null;
        if (itemId && typeof tumKayitlar !== 'undefined' && tumKayitlar.length > 0) {
            itemData = tumKayitlar.find(it => String(it._id) === String(itemId) || String(it.id) === String(itemId));
        }
        if (!itemData && event.context) {
            const $item = $w.at(event.context);
            itemData = {
                fullName: $item("#adminRowName") ? $item("#adminRowName").text : "",
                email: $item("#adminRowEmail") ? $item("#adminRowEmail").text : "",
                userType: $item("#adminRowUserType") ? $item("#adminRowUserType").text : "",
                subject: $item("#adminRowSubject") ? $item("#adminRowSubject").text : "",
                tarih: $item("#adminRowDate") ? $item("#adminRowDate").text : ""
            };
        }
        if (itemData) {
            // Mesaj detayını göster
            try {
                if ($w('#adminDetailName')) $w('#adminDetailName').text = String(itemData.fullName || itemData.isim || "");
                if ($w('#adminDetailEmail')) $w('#adminDetailEmail').text = String(itemData.email || itemData.telefon || "");
                if ($w('#adminDetailUserType')) $w('#adminDetailUserType').text = String(itemData.userType || itemData.hedef_rol || "");
                if ($w('#adminDetailSubject')) $w('#adminDetailSubject').text = String(itemData.subject || itemData.konu || "");
                if ($w('#adminDetailDate')) $w('#adminDetailDate').text = String(itemData.tarih || "");
                if ($w('#adminDetailMessage')) $w('#adminDetailMessage').text = String(itemData.message || itemData.mesaj || "");

                const c = $w("#adminMessageDetailContainer");
                if (c) {
                    try { await c.show(); } catch (err) {}
                    try { await c.expand(); } catch (err) {}
                    setTimeout(() => { try { if (typeof c.scrollTo === 'function') c.scrollTo(); } catch (e) {} }, 80);
                }
            } catch (err) {}
        }
    } catch (e) {}
}

export async function adminDetailCloseBtn_click(event) {
    try {
        const c = $w('#adminMessageDetailContainer');
        if (c) {
            try { await c.hide(); } catch (e) {}
            try { await c.collapse(); } catch (e) {}
        }
    } catch (e) {}
}

