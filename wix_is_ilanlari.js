/**
 * PRUVAI — Wix Studio "İş İlanları" Sayfa Kodu
 *
 * "Yeni İş İlanı Oluştur" sayfasında #publishJobButton'a basılınca session'a
 * 'yeni_ilan_yayinlandi' = 'true' yazılır. Bu sayfa açılınca anahtar okunur ve
 * başlangıçta collapsed olan #candidateNewJobCard görünür/açık hale getirilir.
 */

import { session } from 'wix-storage';

$w.onReady(function () {
    let yayinlandi = null;
    try { yayinlandi = session.getItem('yeni_ilan_yayinlandi'); } catch (e) { }

    if (yayinlandi === 'true') {
        const kartiAc = async () => {
            try {
                const kart = $w('#candidateNewJobCard');
                if (kart) {
                    try { await kart.expand(); } catch (e) { }
                    try { await kart.show(); } catch (e) { }
                }
            } catch (e) { }
        };

        kartiAc();
        // Wix render'ına karşı tekrar dene
        setTimeout(kartiAc, 300);
        setTimeout(kartiAc, 1000);
    }
});
