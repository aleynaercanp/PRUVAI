# PRUVAI — Backend & API Servisi

PRUVAI platformunun yapay zekâ entegrasyonunu, veri yönetimini ve API servislerini sağlayan Flask tabanlı backend projesidir.

Ön yüzde Wix Studio kullanılırken, yapay zekâ değerlendirmeleri (Groq Cloud), aday/başvuru kayıtları (SQLite) ve yönetim paneli bu servis üzerinden yürütülür.

- **Geliştirici / Proje Sahibi:** Aleyna ERCAN
- **Teknolojiler:** Python 3, Flask, SQLite, Groq API, HTML/CSS (Jinja2), Wix Studio (Velo)
- **Canlı Sunucu (Render):** https://pruvai-backend.onrender.com

---

## Proje Yapısı

Kod tabanında modüler bir yapı hedeflendi. Veritabanı sorguları, AI çağrıları ve HTTP yönlendirmeleri birbirinden ayrı modüllerde tutuluyor.

```text
PRUVAI/
├── run.py                 # Uygulama run dosyası
├── config.py              # değişkenler, model ayarları ve prompt yapılandırması
├── test_app.py            # API noktalarını ve veritabanı işlemleri test scripti
├── requirements.txt       # Bağımlılık listesi
├── .env.example           # Örnek .env şablonu
├── .gitignore             # Git takip dışı dosyalar
├── pruvai.db              # SQLite veritabanı dosyası
│
└── app/
    ├── __init__.py        # Uygulama Bileşenleri
    ├── database.py        # SQLite bağlantısı ve Fonksiyonlar
    ├── routes.py          # Web ve API rotaları
    ├── services/
    │   ├── __init__.py
    │   └── ai_service.py  # Groq API entegrasyonu
    ├── static/
    │   └── images/        # Arayüz için statik görseller ve logolar
    └── templates/
        ├── index.html     # Bize Ulaşın
        └── dashboard.html # Yönetim Paneli
```

### Tasarım Tercihleri
- **Veritabanı (`database.py`):** Doğrudan SQLite kullanıldı. SQL Injection riskini engellemek için tüm sorgularda `?` parametreleri tercih edildi. Rotalar veritabanına doğrudan bağlanmaz, bu modüldeki fonksiyonları çağırır.
- **Yapay Zekâ Servisi (`ai_service.py`):** Groq Cloud API üzerinden `qwen/qwen3.8-27b` modeli kullanılıyor. API anahtarı tanımlı olmadığında veya kota aşıldığında sistemin çökmemesi için otomatik bir yedek yanıt (mock/demo) mekanizması bulunuyor.
- **Rotalar (`routes.py`):** Sayfa arayüzleri (`web_bp`) ve API istekleri (`api_bp`) iki ayrı Blueprint olarak yönetiliyor.

---

## Kurulum ve Yerel Çalıştırma

### Gereksinimler
- Python 3.9+ 
- Groq Cloud API anahtarı (canlı AI yanıtları için)

### Adımlar

1. Depoyu klonlayın veya proje klasörüne gidin:
```bash
cd PRUVAI
```

2. Sanal ortamı oluşturup aktif edin:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

3. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

4. `.env` dosyasını oluşturun:
`.env.example` dosyasını kopyalayarak `.env` adıyla kaydedin ve değerleri girin:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
FLASK_ENV=development
SECRET_KEY=local_development_secret_key
PORT=5000
DATABASE_PATH=pruvai.db
```

5. Sunucuyu başlatın:
```bash
python run.py
```

Uygulama varsayılan olarak `http://localhost:5000` portunda çalışır:
- **Ana Sayfa:** `http://localhost:5000/`
- **Yönetim Paneli:** `http://localhost:5000/dashboard`
- **Health Check:** `http://localhost:5000/health`

---

## API Uç Noktaları

| Metot | Uç Nokta | Açıklama | Beklenen Body / Parametre | Örnek Yanıt |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Servis canlılık kontrolü | - | `{"durum": "aktif", "model": "..."}` |
| `GET` | `/` | Web tanıtım sayfası | - | HTML |
| `GET` | `/dashboard` | Yönetim paneli | - | HTML |
| `POST` | `/api/sohbet` | AI Kariyer Asistanı soru-cevap | `{"mesaj": "...", "gecmis": []}` | `{"basari": true, "cevap": "..."}` |
| `POST` | `/api/degerlendir` | S3 vaka değerlendirme ve skorlama | `{"cevap": "...", "senaryo": "..."}` | `{"basari": true, "puan": 85, ...}` |
| `POST` | `/api/leads` | İletişim / başvuru formu kaydı | `{"fullName": "...", "email": "...", ...}` | `{"basari": true, "id": 1}` |
| `GET` | `/api/leads` | Kayıtlı başvuruları listeleme | - | `{"basari": true, "leadler": [...]}` |
| `DELETE`| `/api/leads/<id>` | Başvuru kaydı silme | URL parametresi `id` | `{"basari": true}` |

---

## Wix Studio Entegrasyonu

Wix Studio tarafındaki frontend, bu backend ile standart HTTPS REST çağrıları (`wix-fetch`) üzerinden haberleşir.

- Canlı API Base URL: `https://pruvai-backend.onrender.com`
- Sohbet bileşenleri `/api/sohbet` uç noktasına istek atar.
- Aday vaka değerlendirmeleri `/api/degerlendir` uç noktasından puan ve geri bildirim alır.
- İletişim ve aday başvuru formları verileri eş zamanlı olarak hem Wix CMS'e hem de `/api/leads` üzerinden bu backend veritabanına iletir.

---

## Testler

API rotalarını, veritabanı okuma/yazma işlevlerini ve canlı model bağlantısını doğrulamak için `test_app.py` scripti kullanılır:

```bash
python test_app.py
```

Test scripti sırasıyla config yüklemesini, `/health` yanıtını, template render durumlarını, SQLite CRUD işlemlerini ve Groq API sohbet akışını kontrol eder.

---

## Dağıtım (Deployment)

Proje Render üzerinde Web Service olarak barındırılmaktadır:

- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn run:app`
- **Environment Variables:**
  - `GROQ_API_KEY`: Groq API anahtarınız
  - `FLASK_ENV`: `production`
  - `SECRET_KEY`: Güvenli rastgele bir string
  - `PYTHON_VERSION`: `3.10.x` veya üstü
