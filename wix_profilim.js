/**
 * PRUVAI — Wix Studio "Profilim" Sayfa Kodu
 *
 * s3_tamamlandi === 'true' ise:
 *  - #box298, #box295'in birebir görünümüne getirilir (stil + alt elemanlar).
 *  - #text142'ye session'daki 's3_puan' değeri "NN / 100" olarak yazılır.
 */

import { session } from 'wix-storage';

$w.onReady(function () {
    const s3TamamlandiMi = sessionOku('s3_tamamlandi');

    if (s3TamamlandiMi === 'true') {
        // Wix rendering ezmelerine karşı birkaç kez çalıştır
        profilKartiniGuncelle();
        setTimeout(profilKartiniGuncelle, 150);
        setTimeout(profilKartiniGuncelle, 500);
        setTimeout(profilKartiniGuncelle, 1200);
    }
});


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
 * Hedef elemana kaynağın stilini, metnini/html'ini ve kaynağını (src) kopyalar.
 */
function elemanKopyala(hedef, kaynak) {
    if (!hedef || !kaynak) return;

    try {
        const s = kaynak.style;
        if (s && hedef.style) {
            ['backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'color'].forEach(k => {
                try { if (s[k]) hedef.style[k] = s[k]; } catch (e) { }
            });
        }
    } catch (e) { }

    try { if (typeof kaynak.html === 'string' && kaynak.html) hedef.html = kaynak.html; } catch (e) { }
    try { if (typeof kaynak.text === 'string' && kaynak.text) hedef.text = kaynak.text; } catch (e) { }
    try { if (typeof kaynak.label === 'string' && kaynak.label) hedef.label = kaynak.label; } catch (e) { }
    try { if (kaynak.src) hedef.src = kaynak.src; } catch (e) { }
}

/**
 * Kaynağın alt elemanlarını sırayla hedefin alt elemanlarına kopyalar.
 */
function agaciKopyala(hedef, kaynak, derinlik) {
    if (!hedef || !kaynak || derinlik > 5) return;

    elemanKopyala(hedef, kaynak);

    try {
        const hc = hedef.children || [];
        const kc = kaynak.children || [];
        const n = Math.min(hc.length, kc.length);
        for (let i = 0; i < n; i++) {
            agaciKopyala(hc[i], kc[i], derinlik + 1);
        }
    } catch (e) { }
}


function profilKartiniGuncelle() {
    // 1. box298, box295 ile aynı olsun (kaynak: box295, hedef: box298)
    try {
        agaciKopyala($w('#box298'), $w('#box295'), 0);
    } catch (e) { }

    // 1b. text143, text140'ın stil ve içeriği (inner html) ile aynı olsun
    try {
        elemanKopyala($w('#text143'), $w('#text140'));
    } catch (e) { }

    // 2. text142: session'daki puan (text98'deki gibi "NN / 100")
    try {
        const text142 = $w('#text142');
        const puan = sessionOku('s3_puan');
        if (text142 && puan) {
            const metin = `${puan} / 100`;
            text142.text = metin;
            text142.html = `<p style="color:#003831; font-weight:700; margin:0; font-size:18px; text-align:center;">${metin}</p>`;
        }
    } catch (e) { }
}
