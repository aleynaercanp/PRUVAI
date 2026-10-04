# PRUVAI — Yapay Zekâ Destekli Yetkinlik ve Kariyer Gelişim Platformu (SmartLead AI)

> *"Yetkinlik beyan edilen değil, gerçek iş senaryoları ve vaka çalışmalarıyla gösterilebilen ve kanıtlanabilen bir değerdir."*

**Marka Yöneticisi:** Aleyna ERCAN  
**Mimari İlke:** Separation of Concerns (Sorumlulukların Ayrılığı)  
**Teknoloji Yığını:** Python 3 · Flask · SQLite · Groq AI (`qwen/qwen3.8-27b`) · HTML5 / Glassmorphism Vanilla CSS · Wix Studio Velo  

---

## 🧭 1. Proje Hakkında

**PRUVAI**, yeni mezunların, kariyer değiştirmek isteyenlerin ve çalışan profesyonellerin diplomaya veya klasik mülakat filtrelerine takılmadan, gerçek iş senaryoları çözerek yetkinliklerini kanıtlamalarını sağlayan yapay zekâ destekli bir istihdam ve kariyer platformudur. İşverenler ise role özgü yetkinlik skorlarıyla kanıta dayalı ve sıfır riskli işe alım kararları verir.

Sistem iki temel arayüzden oluşur:
1. **B2C Karşılama Sayfası (`/`):** Z-Pattern UX dizilimi, Glassmorphism AI sohbet kartı (PRUVAI AI Kariyer Asistanı) ve aday lead formu.
2. **B2B Yönetim Paneli (`/dashboard`):** F-Pattern UX dizilimi, en önemli kolon (isim) en solda olacak şekilde lead listesi, arama filtresi ve CSV dışa aktarma.

---

## 🏛️ 2. Hedef Mimari ve Dosya Hiyerarşisi (Separation of Concerns)

Proje, yönergedeki mimari sözleşmeye birebir uygun olarak inşa edilmiştir:

```text
PRUVAI/
├── run.py                 # Sunucuyu başlatan giriş noktası (gunicorn: run:app)
├── config.py              # Tüm ayarlar, .env okuma, BUSINESS_CONTEXT
├── test_app.py            # Uçtan uca 7 adımlı sistem doğrulama ve API testleri
├── requirements.txt       # Bağımlılıklar (Flask, cors, dotenv, requests, gunicorn)
├── .env                   # Gizli anahtarlar (Git'e eklenmez!)
├── .env.example           # Ortam değişkenleri şablonu
├── .gitignore             # Güvenlik ve çöp dosyaları engelleme
├── wix_velo_integration.js# Wix Studio Velo hazır entegrasyon kodu
│
└── app/
    ├── __init__.py        # Uygulama fabrikası (create_app), CORS, init_db, /health
    ├── database.py        # SADECE SQLite veri tabanı işlemleri (? parametreli güvenli SQL)
    ├── routes.py          # HTTP Rotaları (Web & API Blueprint'leri; SQL/AI kodu içermez)
    ├── templates/
    │   ├── index.html     # Karşılama sayfası (Z-Pattern, Glassmorphism, Montserrat/Inter)
    │   └── dashboard.html # Yönetim paneli (F-Pattern, Aday/İşveren takip masası)
    └── services/
        ├── __init__.py
        └── ai_service.py  # SADECE Yapay Zekâ API çağrıları (Groq Llama 3.1 & Demo Modu)
```

### 🔒 Mimari Sözleşme
- **`database.py` dışında HİÇBİR yerde SQL kodu yoktur.** SQL Injection'a karşı tüm sorgularda `?` yer tutucusu kullanılmıştır.
- **`ai_service.py` dışında HİÇBİR yerde yapay zekâ çağrısı yoktur.** Groq API anahtarı girilmediğinde sistem çökmez, güvenli *Demo Modu* döner.
- **`routes.py` yalnızca yönlendirme yapar.** Kendi içinde SQL veya AI kodu barındırmaz.

---

## 🚀 3. Kurulum ve Çalıştırma

### 1. Depoyu Klonlayın veya Klasöre Geçin
```bash
cd PRUVAI
```

### 2. Sanal Ortamı Oluşturun ve Aktive Edin
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Bağımlılıkları Yükleyin
```bash
pip install -r requirements.txt
```

### 4. `.env` Dosyasını Yapılandırın
`.env.example` dosyasını referans alarak `.env` oluşturun:
```env
GROQ_API_KEY=gsk_sizin_groq_api_anahtariniz
FLASK_ENV=development
SECRET_KEY=pruvai_guvenli_anahtar
PORT=5000
DATABASE_PATH=pruvai.db
```

### 5. Sunucuyu Başlatın
```bash
python run.py
```

Tarayıcınızda açın:
* **Karşılama Sayfası:** [http://localhost:5000](http://localhost:5000)
* **Yönetim Paneli:** [http://localhost:5000/dashboard](http://localhost:5000/dashboard)
* **Canlılık Kontrolü:** [http://localhost:5000/health](http://localhost:5000/health)

---

## 📡 4. RESTful API Uç Noktaları

| Metot | Yol | Açıklama | Başarılı Yanıt |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Sunucu sağlık ve model kontrolü | `200 OK` |
| `GET` | `/` | B2C Karşılama Sayfası | `200 OK` (HTML) |
| `GET` | `/dashboard` | B2B Yönetim Paneli | `200 OK` (HTML) |
| `POST` | `/api/sohbet` | PRUVAI AI Kariyer Asistanı'na soru iletme | `200 OK` `{"basari": true, "cevap": "..."}` |
| `POST` | `/api/leads` | Yeni lead / aday başvurusu kaydetme | `201 Created` `{"basari": true, "id": 1}` |
| `GET` | `/api/leads` | Tüm kayıtlı aday ve işverenleri listeleme | `200 OK` `{"basari": true, "leadler": [...]}` |

---

## 🎨 5. Wix Studio Entegrasyonu

Wix Studio üzerindeki siteniz (`https://aleynaercanp.wixstudio.com/pruvai`) için hazır Velo kodu [`wix_velo_integration.js`](file:///c:/Users/fatih/OneDrive/Masaüstü/PRUVAI/wix_velo_integration.js) dosyasına yerleştirilmiştir.
Backend servisini Render'a canlıya aldıktan sonra tek yapmanız gereken, Wix Velo kodundaki `API_BASE_URL` adresini Render bağlantınız ile güncellemektir.

---

## 🧪 6. Otomatik Sistem ve API Doğrulama Testi (`test_app.py`)

Projenin tüm uç noktalarını, veritabanı CRUD işlemlerini ve Groq canlı yapay zekâ sohbetini tek seferde doğrulamak için:

```bash
python test_app.py
```

Bu test senaryosu 7 kritik adımı otomatik olarak inceler ve onaylar:
1. **Config Testi:** Groq API anahtarının ve ortam değişkenlerinin varlığı.
2. **Nabız Testi (`/health`):** Sunucu canlılığı (`200 OK`).
3. **Karşılama Sayfası (`GET /`):** Landing page şablonunun başarıyla render edilmesi.
4. **Yönetim Paneli (`GET /dashboard`):** Admin ekranının başarıyla render edilmesi.
5. **Lead Ekleme (`POST /api/leads`):** SQLite veritabanına güvenli kayıt (`201 Created`).
6. **Lead Listeleme (`GET /api/leads`):** Veritabanından kayıtların çekilmesi (`200 OK`).
7. **Canlı AI Sohbeti (`POST /api/sohbet`):** Groq `qwen/qwen3.8-27b` modeliyle canlı soru-cevap.

---

## ☁️ 7. Render Canlı Yayına Alma (Deploy)

1. Projeyi GitHub'a yükleyin (`.env` dosyasının `.gitignore` sayesinde yüklenmediğinden emin olun).
2. [render.com](https://render.com) üzerinde **New Web Service** seçin ve GitHub deponuzu bağlayın.
3. Ayarları yapın:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn run:app`
4. **Environment Variables** bölümüne ekleyin:
   - `GROQ_API_KEY`: `gsk_...`
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: `pruvai_guvenli_anahtar`
5. Servis dağıtıldıktan sonra `https://projeniz.onrender.com/health` adresinde `"durum": "aktif"` yanıtını aldığınızda sisteminiz tüm dünyaya açıktır!
