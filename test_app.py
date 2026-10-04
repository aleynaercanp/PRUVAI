"""
Uygulama uç noktalarını ve temel servis akışlarını doğrulayan test betiği.
"""

import sys

# Windows konsolunda Türkçe karakterlerin düzgün görüntülenmesini sağlıyoruz
try:
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

from config import get_config
from app import create_app


def run_tests():
    print("=" * 60)
    print("PRUVAI SİSTEM DOĞRULAMA TESTLERİ BAŞLIYOR")
    print("=" * 60)

    # 1. Yapılandırma kontrolü
    cfg = get_config()
    print(f"[TEST 1] Config: Sağlayıcı = {cfg.AI_PROVIDER}, Model = {cfg.GROQ_MODEL}, API Key Uzunluğu = {len(cfg.GROQ_API_KEY)}")
    assert len(cfg.GROQ_API_KEY) > 10, "Groq API anahtarı boş veya eksik!"

    # 2. Test istemcisi hazırlığı
    app = create_app()
    client = app.test_client()

    # 3. /health canlılık kontrolü
    res_health = client.get('/health')
    print(f"[TEST 2] /health -> Durum Kodu: {res_health.status_code}, Yanıt: {res_health.get_json()}")
    assert res_health.status_code == 200, "/health başarısız!"

    # 4. Karşılama sayfası (GET /)
    res_index = client.get('/')
    print(f"[TEST 3] GET / (Karşılama Sayfası) -> Durum Kodu: {res_index.status_code}, Boyut: {len(res_index.data)} byte")
    assert res_index.status_code == 200, "Karşılama sayfası yüklenemedi!"

    # 5. Yönetim paneli (GET /dashboard)
    res_dash = client.get('/dashboard')
    print(f"[TEST 4] GET /dashboard (Yönetim Paneli) -> Durum Kodu: {res_dash.status_code}, Boyut: {len(res_dash.data)} byte")
    assert res_dash.status_code == 200, "Yönetim paneli yüklenemedi!"

    # 6. Yeni lead kaydı (POST /api/leads)
    ornek_lead = {
        "isim": "Arzu Pehlivan",
        "email": "arzu.pehlivan@pruvai.com",
        "mesaj": "Muhasebe ve mali müşavirlik stajı vaka senaryoları için katılmak istiyorum.",
        "hedef_rol": "Yeni Mezun / Deneyimsiz Aday"
    }
    res_lead = client.post('/api/leads', json=ornek_lead)
    print(f"[TEST 5] POST /api/leads -> Durum Kodu: {res_lead.status_code}, Yanıt: {res_lead.get_json()}")
    assert res_lead.status_code in [200, 201], "Lead kaydı başarısız!"
    lead_id = res_lead.get_json().get('id')

    # 7. Lead kayıtlarını listeleme (GET /api/leads)
    res_list = client.get('/api/leads')
    data_list = res_list.get_json()
    print(f"[TEST 6] GET /api/leads -> Durum Kodu: {res_list.status_code}, Toplam Kayıt: {data_list.get('toplam')}")
    assert res_list.status_code == 200, "Lead listeleme başarısız!"
    assert data_list.get('toplam', 0) > 0, "Lead listesi boş dönmemeli!"

    # Test kaydını hemen siliyoruz (panelde mükerrer veya çöp kayıt kalmasın)
    if lead_id:
        with app.app_context():
            from app.database import get_db
            db = get_db()
            db.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
            db.commit()

    # 8. Yapay zekâ sohbet servisi (POST /api/sohbet)
    print("\n[TEST 7] Canlı Groq API Yapay Zekâ Sohbet Testi Başlatılıyor...")
    sohbet_istegi = {
        "mesaj": "Merhaba, PRUVAI nedir? Ben muhasebe mezunuyum, platformdan nasıl yararlanabilirim?",
        "gecmis": []
    }
    res_ai = client.post('/api/sohbet', json=sohbet_istegi)
    ai_data = res_ai.get_json()
    print(f"Durum Kodu: {res_ai.status_code}")
    print(f"Başarı: {ai_data.get('basari')}")
    print(f"PRUVAI AI Kariyer Asistanı Yanıtı:\n{ai_data.get('cevap')}\n")
    assert res_ai.status_code == 200, f"AI Sohbet isteği başarısız oldu! {ai_data}"
    assert ai_data.get('basari') is True, "AI yanıtı başarı false döndü!"

    print("=" * 60)
    print("[OK] TÜM SİSTEM TESTLERİ BAŞARIYLA GEÇTİ!")
    print("=" * 60)


if __name__ == '__main__':
    run_tests()
