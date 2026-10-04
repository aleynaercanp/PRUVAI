/**
 * PRUVAI — Wix Studio Yönetici Paneli Sayfa Kodu
 * 
 * Bu kod SADECE Wix Studio'daki "Yönetici Paneli" sayfasının alt kod paneline yapıştırılmalıdır.
 * 
 * KULLANILAN ELEMAN ID'LERİ:
 * -------------------------------------------------------------
 * 1. Sayaç Kartları:
 *    - #adminTotalMessages  (Toplam Mesaj Sayısı)
 *    - #adminMonthMessages  (Bu Ay Gelen Mesaj Sayısı)
 *    - #adminTodayMessages  (Bugün Gelen Mesaj Sayısı)
 * 
 * 2. Tablo / Repeater:
 *    - #adminMessagesRepeater
 *    - #adminRowName        (Satırdaki Ad Soyad)
 *    - #adminRowEmail       (Satırdaki E-posta)
 *    - #adminRowUserType    (Satırdaki Kullanıcı Tipi)
 *    - #adminRowSubject     (Satırdaki Konu)
 *    - #adminRowDate        (Satırdaki Tarih)
 *    - #adminViewMessageButton (Satırdaki "Detayı Gör >" Butonu)
 *    - #adminRowDeleteBtn   (Satırdaki "Sil" Butonu - İsteğe bağlı)
 * 
 * 3. Mesaj Detay Paneli:
 *    - #adminMessageDetailContainer (Tüm Detay Kutusunun Konteynırı)
 *    - #adminDetailName     (Detaydaki Ad Soyad metni)
 *    - #adminDetailEmail    (Detaydaki E-posta metni)
 *    - #adminDetailUserType (Detaydaki Kullanıcı Tipi metni)
 *    - #adminDetailSubject  (Detaydaki Konu metni)
 *    - #adminDetailDate     (Detaydaki Tarih metni)
 *    - #adminDetailMessage  (Detaydaki Mesaj metni/kutusu)
 *    - #adminDetailCloseBtn (Detay kutusundaki X kapatma butonu)
 * 
 * 4. Arama ve Yenile:
 *    - #adminSearchInput    (Arama Kutusu)
 *    - #adminRefreshButton  (Yenile Butonu)
 */

import { fetch } from 'wix-fetch';
import wixData from 'wix-data';

// Canlı Python Render Backend
const BACKEND_URL = "https://pruvai-backend.onrender.com";

let tumKayitlar = [];

$w.onReady(function () {
    console.log("PRUVAI Yönetici Paneli Başlatılıyor...");

    // Sayfa açıldığında detay kutusunu SIFIR PİKSEL YAP (collapse)
    // Böylece sayfa gereksiz yere uzamaz, altta beyaz boşluk kalmaz!
    try {
        const container = $w('#adminMessageDetailContainer');
        if (container) {
            try { container.show(); } catch (e) {}
            try { container.collapse(); } catch (e) {}
        }
    } catch (e) {}

    // Repeater Satır Ayarları
    try {
        if ($w("#adminMessagesRepeater")) {
            $w("#adminMessagesRepeater").onItemReady(($item, itemData) => {
                satiriDoldur($item, itemData);
            });
        }
    } catch (e) {
        console.warn("Repeater onItemReady hatası:", e);
    }

    // Kapatma (X) Butonları Dinleyicisi
    const kapatAdaylari = [
        "#adminDetailCloseBtn", 
        "#adminMessageDetailCloseButton", 
        "#adminMessageDetailCloseBtn",
        "#detailCloseBtn",
        "#closeBtn"
    ];
    for (let cId of kapatAdaylari) {
        try {
            const btnClose = $w(cId);
            if (btnClose && typeof btnClose.onClick === 'function') {
                btnClose.onClick(async () => {
                    await detayiKapat();
                });
            }
        } catch (e) {}
    }

    // Arama Kutusu Filtreleme
    try {
        if ($w("#adminSearchInput")) {
            $w("#adminSearchInput").onInput((event) => {
                const q = event.target.value.toLowerCase().trim();
                if (!q) {
                    if ($w("#adminMessagesRepeater")) $w("#adminMessagesRepeater").data = tumKayitlar;
                    return;
                }
                const filtreli = tumKayitlar.filter(it => {
                    const ad = (it.fullName || it.isim || "").toLowerCase();
                    const em = (it.email || it.telefon || "").toLowerCase();
                    const rol = (it.userType || it.hedef_rol || "").toLowerCase();
                    const konu = (it.subject || it.konu || "").toLowerCase();
                    const msg = (it.message || it.mesaj || "").toLowerCase();
                    return ad.includes(q) || em.includes(q) || rol.includes(q) || konu.includes(q) || msg.includes(q);
                });
                if ($w("#adminMessagesRepeater")) $w("#adminMessagesRepeater").data = filtreli;
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

    // Verileri yükle
    tabloyuguncelle();
});


/**
 * Repeater satırına gelen veriyi yerleştirir ve butonları bağlar
 */
function satiriDoldur($item, itemData) {
    // 1. İsim
    try {
        if ($item("#adminRowName")) {
            $item("#adminRowName").text = itemData.fullName || itemData.isim || "Aday";
        }
    } catch (e) {}

    // 2. E-posta
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
        const btn = $item("#adminViewMessageButton") || $item("#adminRowDetailBtn");
        if (btn && typeof btn.onClick === 'function') {
            btn.onClick(async () => {
                await mesajDetayiniGoster(itemData);
            });
        }
    } catch (e) {}

    // 7. "Sil" BUTONU
    try {
        const btnSil = $item("#adminRowDeleteBtn") || $item("#adminDeleteBtn");
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


/**
 * MESAJ DETAYINI AÇAR VE İLGİLİ ALANLARI DOLDURUR
 */
async function mesajDetayiniGoster(itemData) {
    if (!itemData) return;

    console.log("Mesaj detayı açılıyor:", itemData);

    const isim = itemData.fullName || itemData.isim || "Aday";
    const email = itemData.email || itemData.telefon || "-";
    const userType = itemData.userType || itemData.hedef_rol || "Yeni Mezun";
    const konu = itemData.subject || itemData.konu || "Platform Hakkında";
    const mesaj = itemData.message || itemData.mesaj || "Mesaj içeriği bulunamadı.";

    let tarih = "-";
    if (itemData._createdDate) {
        tarih = new Date(itemData._createdDate).toLocaleDateString('tr-TR');
    } else if (itemData.tarih) {
        const p = String(itemData.tarih).slice(0, 10).split('-');
        tarih = p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : String(itemData.tarih).slice(0, 10);
    }

    // 1. TAM VERDİĞİNİZ ID'LERLE ALANLARI DOLDUR:
    try { if ($w('#adminDetailName')) $w('#adminDetailName').text = String(isim); } catch (e) {}
    try { if ($w('#adminDetailEmail')) $w('#adminDetailEmail').text = String(email); } catch (e) {}
    try { if ($w('#adminDetailUserType')) $w('#adminDetailUserType').text = String(userType); } catch (e) {}
    try { if ($w('#adminDetailSubject')) $w('#adminDetailSubject').text = String(konu); } catch (e) {}
    try { if ($w('#adminDetailDate')) $w('#adminDetailDate').text = String(tarih); } catch (e) {}
    try { 
        if ($w('#adminDetailMessage')) {
            if (typeof $w('#adminDetailMessage').text !== 'undefined') {
                $w('#adminDetailMessage').text = String(mesaj);
            } else if (typeof $w('#adminDetailMessage').value !== 'undefined') {
                $w('#adminDetailMessage').value = String(mesaj);
            }
        }
    } catch (e) {}

    // 2. #adminMessageDetailContainer KONTEYNIRINI GÖRÜNÜR YAP VE AÇ
    try {
        const container = $w('#adminMessageDetailContainer');
        if (container) {
            // Önce gizliliği kaldır (Hidden durumundan çıkar)
            try { await container.show(); } catch (err) {}
            // Sonra genişlet (Collapsed durumundan çıkar)
            try { await container.expand(); } catch (err) {}

            // Sayfayı kutunun olduğu yere yumuşakça kaydır
            setTimeout(async () => {
                try {
                    if (typeof container.scrollTo === 'function') {
                        await container.scrollTo();
                    }
                } catch (scrollErr) {}
            }, 80);
        }
    } catch (e) {
        console.error("Detay kutusu açılırken hata:", e);
    }
}


/**
 * MESAJ DETAYINI KAPATIR (SAYFA OTOMATİK ESKİ BOYUNA KISALIR)
 */
async function detayiKapat() {
    try {
        const container = $w('#adminMessageDetailContainer');
        if (container) {
            // SADECE collapse() kullanılır! 
            // hide() beyaz boşluk bırakırken, collapse() o alanı 0 piksel yapar ve sayfayı yukarı toplar.
            try { await container.collapse(); } catch (e) {}
        }
    } catch (e) {}
}


/**
 * Wix CMS ve Backend üzerinden verileri çekip tabloyu ve KPI sayaçlarını günceller
 */
async function tabloyuguncelle() {
    let kayitlar = [];

    // 1. Wix CMS Sorgusu
    try {
        const wixSonuc = await wixData.query("ContactMessages").descending("_createdDate").find();
        if (wixSonuc && wixSonuc.items && wixSonuc.items.length > 0) {
            kayitlar = wixSonuc.items;
        }
    } catch (e) {}

    // 2. Canlı Render Backend Yedek Sorgusu
    if (kayitlar.length === 0) {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/leads`);
            const data = await resp.json();
            if (data.basari && Array.isArray(data.leadler) && data.leadler.length > 0) {
                kayitlar = data.leadler.map((item, idx) => ({
                    ...item,
                    _id: String(item._id || item.id || ("lead_" + idx))
                }));
            }
        } catch (e) {}
    }

    tumKayitlar = kayitlar;

    // 3. KPI Sayaçlarını Güncelle
    metrikleriHesapla(tumKayitlar);

    // 4. Repeater Verisini Ata ve Halihazırdaki Satırlara Dinleyicileri Bağla
    try {
        if ($w("#adminMessagesRepeater")) {
            $w("#adminMessagesRepeater").data = tumKayitlar;

            // Halihazırda ekranda bulunan satırlar için butonları anında bağla
            $w("#adminMessagesRepeater").forEachItem(($item, itemData) => {
                satiriDoldur($item, itemData);
            });
        }
    } catch (e) {}
}


/**
 * KPI Kartlarını Hesapla (Toplam, Bu Ay, Bugün)
 */
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

    try { if ($w("#adminTotalMessages")) $w("#adminTotalMessages").text = String(toplam); } catch (e) {}
    try { if ($w("#adminMonthMessages")) $w("#adminMonthMessages").text = String(buAySayac); } catch (e) {}
    try { if ($w("#adminTodayMessages")) $w("#adminTodayMessages").text = String(bugunSayac); } catch (e) {}
}


/**
 * Wix Studio Properties Panelinden "onClick" olayı bağlandıysa çalışan fonksiyonlar
 */
export async function adminViewMessageButton_click(event) {
    try {
        const itemId = event.context && event.context.itemId;
        let itemData = null;
        if (itemId && tumKayitlar && tumKayitlar.length > 0) {
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
        await mesajDetayiniGoster(itemData || {});
    } catch (e) {}
}

export async function adminDetailCloseBtn_click(event) {
    await detayiKapat();
}
