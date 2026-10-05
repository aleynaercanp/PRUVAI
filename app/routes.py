"""
Uygulama rotaları ve API uç noktaları.
Arayüz sayfalarını ve gelen HTTP isteklerini karşılayıp ilgili servislere yönlendirir.
"""

from flask import Blueprint, request, jsonify, render_template
from app.services.ai_service import ai_service, AIServiceError
from app.database import lead_ekle, tum_leadler, lead_sil

# Sayfa şablonları ve API istekleri için iki ayrı blueprint kullanıyoruz
web_bp = Blueprint('web', __name__)
api_bp = Blueprint('api', __name__)


# ---------------------------------------------------------
# Sayfa Yönlendirmeleri
# ---------------------------------------------------------

@web_bp.route('/', methods=['GET'])
@web_bp.route('/index', methods=['GET'])
@web_bp.route('/index.html', methods=['GET'])
def index():
    """Tanıtım ve karşılama sayfası."""
    return render_template('index.html')


@web_bp.route('/dashboard', methods=['GET'])
@web_bp.route('/dashboard.html', methods=['GET'])
def dashboard():
    """Gelen iletişim ve aday taleplerinin izlendiği yönetim paneli."""
    return render_template('dashboard.html')


# ---------------------------------------------------------
# API Uç Noktaları (/api/...)
# ---------------------------------------------------------

@api_bp.route('/sohbet', methods=['POST'])
def api_sohbet():
    """
    Kullanıcının gönderdiği mesajı alır ve AI servisine iletir.
    Beklenen gövde: { "mesaj": "...", "gecmis": [...] (opsiyonel) }
    """
    veri = request.get_json(silent=True)

    # Boş veya geçersiz istek kontrolü
    if not veri or 'mesaj' not in veri or not str(veri['mesaj']).strip():
        return jsonify({
            "basari": False,
            "hata": "Lütfen bir mesaj metni girin."
        }), 400

    mesaj = str(veri['mesaj']).strip()
    gecmis = veri.get('gecmis', [])

    try:
        cevap = ai_service.yanit_uret(mesaj=mesaj, gecmis=gecmis)
        return jsonify({
            "basari": True,
            "cevap": cevap
        }), 200

    except AIServiceError as err:
        return jsonify({
            "basari": False,
            "hata": "Yapay zekâ servisi şu anda yanıt veremiyor, lütfen birazdan tekrar deneyin.",
            "detay": str(err)
        }), 503
    except Exception as err:
        return jsonify({
            "basari": False,
            "hata": "Sunucu tarafında beklenmeyen bir hata oluştu.",
            "detay": str(err)
        }), 500


@api_bp.route('/degerlendir', methods=['POST'])
def api_degerlendir():
    """
    Seçim ve Karar (S3) vaka cevabını değerlendirir.
    Beklenen gövde: { "cevap": "...", "senaryo": "..." }
    """
    veri = request.get_json(silent=True) or {}
    cevap = str(veri.get('cevap') or veri.get('answer') or veri.get('mesaj') or '').strip()

    if not cevap:
        return jsonify({
            "basari": False,
            "hata": "Lütfen değerlendirilecek bir cevap metni giriniz."
        }), 400

    senaryo = str(veri.get('senaryo') or 'Seçim ve Karar / S3').strip()

    try:
        sonuc = ai_service.vaka_degerlendir(cevap=cevap, senaryo_bilgisi=senaryo)
        return jsonify({
            "basari": True,
            "senaryo": senaryo,
            **sonuc
        }), 200
    except Exception as err:
        return jsonify({
            "basari": False,
            "hata": "Değerlendirme sırasında bir hata oluştu.",
            "detay": str(err)
        }), 500


@api_bp.route('/leads', methods=['POST'])
def api_leads_ekle():
    """
    Web sitesindeki iletişim formundan gelen yeni başvuruyu kaydeder.
    """
    veri = request.get_json(silent=True)

    if not veri:
        return jsonify({
            "basari": False,
            "hata": "Geçerli bir JSON verisi gönderilmelidir."
        }), 400

    # Farklı form alan adlarını esnek şekilde karşılıyoruz
    isim = str(veri.get('isim') or veri.get('fullName') or veri.get('contactName') or veri.get('name') or '').strip()
    telefon = str(veri.get('telefon') or veri.get('email') or veri.get('contactPhone') or veri.get('contactEmail') or veri.get('phone') or '').strip()
    hedef_rol = str(veri.get('hedef_rol') or veri.get('userType') or veri.get('contactUserType') or veri.get('role') or 'Aday - Aday Deneyimi').strip()
    
    ham_mesaj = str(veri.get('mesaj') or veri.get('message') or veri.get('contactMessage') or '').strip()
    konu = str(veri.get('contactSubject') or veri.get('subject') or veri.get('konu') or '').strip()
    
    # Konu başlığı varsa mesajın önüne ekliyoruz
    if konu:
        mesaj = f"[{konu}] {ham_mesaj}".strip()
    else:
        mesaj = ham_mesaj

    # Temel zorunlu alan doğrulaması
    if not isim or not telefon:
        return jsonify({
            "basari": False,
            "hata": "İsim ve iletişim bilgisi alanları zorunludur."
        }), 400

    try:
        yeni_id = lead_ekle(isim=isim, telefon=telefon, mesaj=mesaj, hedef_rol=hedef_rol)
        return jsonify({
            "basari": True,
            "mesaj": "Kayıt başarıyla oluşturuldu.",
            "id": yeni_id
        }), 201

    except RuntimeError as err:
        return jsonify({
            "basari": False,
            "hata": "Kayıt veritabanına eklenirken bir sorun oluştu.",
            "detay": str(err)
        }), 500


@api_bp.route('/leads', methods=['GET'])
def api_leads_listele():
    """
    Kayıtlı başvuruları en yeniden eskiye doğru listeler.
    Yönetim paneli ve arayüz tabloları tarafından kullanılır.
    """
    try:
        kayitlar = tum_leadler()
        return jsonify({
            "basari": True,
            "toplam": len(kayitlar),
            "leadler": kayitlar
        }), 200
    except RuntimeError as err:
        return jsonify({
            "basari": False,
            "hata": "Kayıtlar listelenirken bir hata oluştu.",
            "detay": str(err)
        }), 500


@api_bp.route('/leads/<int:lead_id>', methods=['DELETE'])
def api_lead_sil(lead_id):
    """
    Belirtilen ID'ye sahip başvuruyu veritabanından kalıcı olarak siler.
    """
    try:
        basarili = lead_sil(lead_id)
        if basarili:
            return jsonify({
                "basari": True,
                "mesaj": "Kayıt başarıyla silindi.",
                "id": lead_id
            }), 200
        else:
            return jsonify({
                "basari": False,
                "hata": "Kayıt bulunamadı veya daha önce silinmiş."
            }), 404
    except RuntimeError as err:
        return jsonify({
            "basari": False,
            "hata": "Kayıt silinirken bir sunucu hatası oluştu.",
            "detay": str(err)
        }), 500
