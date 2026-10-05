/**
 * PRUVAI — Wix Studio "Yeni İş İlanı Oluştur" Sayfa Kodu
 *
 * #publishJobButton'a basıldığında session'a sabit bir anahtar ('yeni_ilan_yayinlandi')
 * yazar. "İş İlanları" sayfası bu anahtarı okuyup #candidateNewJobCard
 * konteynırını (başlangıçta collapsed) açar.
 */

import { session } from 'wix-storage';

$w.onReady(function () {
    try {
        $w('#publishJobButton').onClick(() => {
            try { session.setItem('yeni_ilan_yayinlandi', 'true'); } catch (e) { }
            // Yönlendirme yapılmıyor; sayfa zaten kendisi gidiyor.
        });
    } catch (e) {
        console.warn("publishJobButton bağlanamadı:", e);
    }
});
