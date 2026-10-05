"""
Groq API entegrasyonu ve yapay zekâ sohbet servisi.
Kullanıcı mesajlarını ve geçmiş konuşmayı toparlayıp ilgili dil modeline iletir.
"""

import requests
from config import get_config


class AIServiceError(Exception):
    """Yapay zekâ servis çağrılarında veya yanıt işleme sırasında oluşan hatalar için"""
    pass


class AIService:
    """Groq API üzerinden model yönetimini ve yanıt üretimini gerçekleştiren servis sınıfı."""

    def __init__(self):
        self.config = get_config()
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    def _get_system_prompt(self) -> str:
        """Karakter ve rehberlik kurallarını config üzerinden alır."""
        return getattr(self.config, 'BUSINESS_CONTEXT', (
            "Sen PRUVAI platformunun kıdemli Kariyer ve Yetkinlik Rehber Asistanısın. "
            "Kullanıcılara yetkinlik bazlı değerlendirmeler ve kariyer yönlendirmeleri hakkında Türkçe bilgi ver."
        ))

    def yanit_uret(self, mesaj: str, gecmis: list = None) -> str:
        """
        Kullanıcı mesajını ve önceki konuşma geçmişini birleştirerek Groq API'ye gönderir.
        API anahtarı henüz tanımlanmamışsa test amaçlı bilgilendirici bir mesaj döner.
        """
        api_key = self.config.GROQ_API_KEY

        # Henüz geçerli bir API anahtarı girilmediyse kullanıcıyı nazikçe bilgilendiriyoruz
        if not api_key or api_key.startswith("gsk_buraya") or len(api_key) < 10:
            return (
                "Merhaba! Ben PRUVAI Akıllı Kariyer Asistanı (Demo Modu). "
                "PRUVAI, gerçek iş senaryoları ve vaka çalışmalarıyla yetkinliklerinizi ölçüp kanıtlamanızı sağlar. "
                "Sistem tam olarak çalışmaktadır; canlı yapay zekâ yanıtları için lütfen geçerli bir Groq API anahtarı tanımlayın."
            )

        if gecmis is None:
            gecmis = []

        # Modele iletilecek mesaj dizisini hazırlıyoruz
        messages = [
            {"role": "system", "content": self._get_system_prompt()}
        ]

        # Varsa önceki konuşma geçmişini listeye dahil ediyoruz
        for item in gecmis:
            if isinstance(item, dict) and "role" in item and "content" in item:
                if item["role"] in ["user", "assistant"]:
                    messages.append({
                        "role": item["role"],
                        "content": str(item["content"])
                    })

        # Kullanıcının son mesajını ekliyoruz
        messages.append({"role": "user", "content": mesaj})

        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json"
        }

        # Öncelikli modelimiz ve kota/erişim sorunlarına karşı yedek alternatifler
        candidate_models = [
            getattr(self.config, 'GROQ_MODEL', 'qwen/qwen3.8-27b'),
            "qwen/qwen3.8-27b",
            "openai/gpt-oss-120b",
            "openai/gpt-oss-20b",
            "llama-3.1-8b-instant"
        ]
        # Sıralamayı bozmadan tekrarlanan model isimlerini eliyoruz
        unique_models = list(dict.fromkeys([m for m in candidate_models if m]))

        last_error = None
        for model_name in unique_models:
            payload = {
                "model": model_name,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1000
            }

            try:
                response = requests.post(
                    self.api_url,
                    headers=headers,
                    json=payload,
                    timeout=15
                )

                if response.status_code == 200:
                    veri = response.json()
                    secenekler = veri.get("choices", [])
                    if secenekler and "message" in secenekler[0]:
                        return secenekler[0]["message"]["content"].strip()
                    raise AIServiceError("API yanıtı döndü ancak mesaj içeriği okunamadı.")
                elif response.status_code in (404, 429):
                    # Model geçici olarak yoğunsa veya kota dolduysa bir sonraki modeli deniyoruz
                    last_error = f"Model ({model_name}) geçici olarak yanıt veremedi (HTTP {response.status_code})."
                    continue
                else:
                    hata_detayi = response.text
                    raise AIServiceError(f"Groq API hatası (HTTP {response.status_code}): {hata_detayi}")

            except requests.exceptions.RequestException as err:
                raise AIServiceError(f"Yapay zekâ servisine bağlanırken ağ hatası oluştu: {str(err)}")
            except Exception as err:
                raise AIServiceError(f"Beklenmeyen bir hata oluştu: {str(err)}")

    def vaka_degerlendir(self, cevap: str, senaryo_bilgisi: str = "") -> dict:
        """
        Kullanıcının Seçim ve Karar (S3) işe alım vaka cevabını değerlendirir.
        Puan, güçlü yönler ve gelişim alanlarını içeren bir sözlük döner.
        """
        cevap_temiz = (cevap or "").strip()
        if not cevap_temiz:
            return {
                "puan": 0,
                "guclu_yonler": "Henüz bir cevap girilmedi.",
                "gelisim_alanlari": "Lütfen hangi adayı neden seçtiğinizi detaylandırarak yazınız."
            }

        api_key = self.config.GROQ_API_KEY

        # Canlı Groq çağrısı için prompt
        if api_key and not api_key.startswith("gsk_buraya") and len(api_key) > 10:
            prompt = f"""Sen PRUVAI İnsan Kaynakları ve Yetkinlik Değerlendirme Yapay Zekasısın.
Aşağıdaki İşe Alım Uzmanı Seçim ve Karar Senaryosu (S3) için adayın verdiği cevabı değerlendir:

SENARYO:
- Pozisyon: İşe Alım Uzmanı
- Beklenti: İlk 6 ayda yoğun aday görüşmeleri, bölüm yöneticileriyle doğrudan iletişim ve aktif süreç takibi.
- Aday A (Ece): Vaka: 92/100, Mülakat: 86/100, İletişim: 72/100, Deneyim: 3 yıl, Bütçe içinde.
- Aday B (Kerem): Vaka: 82/100, Mülakat: 91/100, İletişim: 93/100, Deneyim: 1 yıl, Bütçe içinde.

ADAYIN CEVABI:
"{cevap_temiz}"

LÜTFEN SADECE VE SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir açıklama metni ekleme:
{{
  "puan": 85,
  "guclu_yonler": "Adayın güçlü yönlerine dair 1-2 cümlelik profesyonel İK geri bildirimi.",
  "gelisim_alanlari": "Adayın kararında geliştirebileceği/göz ardı ettiği noktaya dair 1-2 cümlelik yapıcı öneri."
}}
Puan 0-100 arasında bir tam sayı olmalıdır."""

            try:
                yanit_metni = self.yanit_uret(mesaj=prompt)
                import json, re
                json_match = re.search(r'\{.*\}', yanit_metni, re.DOTALL)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    return {
                        "puan": int(parsed.get("puan", 85)),
                        "guclu_yonler": str(parsed.get("guclu_yonler", "Yetkinlik odaklı analiz yapıldı.")),
                        "gelisim_alanlari": str(parsed.get("gelisim_alanlari", "Alternatif risk senaryoları değerlendirilebilir."))
                    }
            except Exception:
                pass

        # Akıllı yerel kural bazlı İK değerlendirme motoru (Fallback)
        lower_ans = cevap_temiz.lower()
        secilen_kerem = any(k in lower_ans for k in ["kerem", "aday b", "b adayı", "b ile", "b'yi", "kerem'i"])
        secilen_ece = any(k in lower_ans for k in ["ece", "aday a", "a adayı", "a ile", "a'yı", "ece'yi"])
        uzunluk = len(cevap_temiz.split())

        puan = 70
        if secilen_kerem:
            puan += 15
            guclu = "Pozisyonun ilk 6 aylık önceliği olan 'yoğun görüşme ve paydaş iletişimi' ihtiyacını, Kerem'in yüksek iletişim (93) ve mülakat (91) yetkinlikleriyle doğru eşleştirdiniz."
            gelisim = "Kerem'in 1 yıllık tecrübesi ve vaka çalışmasındaki (82) eksiklerini kapatmak için ilk aylarda kıdemli bir uzmandan teknik mentorluk almasını sürece dahil edebilirdiniz."
        elif secilen_ece:
            puan += 10
            guclu = "Ece'nin 3 yıllık sektörel deneyimini ve vaka çalışmasındaki yüksek başarısını (92) temel alarak bağımsız iş yapabilme kapasitesini öne çıkardınız."
            gelisim = "İlk 6 ayda kritik olan yoğun paydaş ve bölüm yöneticisi iletişiminde Ece'nin iletişim puanının (72) yaratabileceği riskleri ve yönetim planını detaylandırabilirdiniz."
        else:
            puan += 5
            guclu = "Her iki adayın güçlü yönlerini ve pozisyon gereksinimlerini çok yönlü bir bakış açısıyla ele aldınız."
            gelisim = "Hangi adayla ilerleneceği konusunda daha net bir karar belirterek kararınızın arkasındaki ana stratejiyi vurgulayabilirsiniz."

        if uzunluk > 30:
            puan = min(98, puan + 10)
        elif uzunluk < 10:
            puan = max(60, puan - 10)

        return {
            "puan": puan,
            "guclu_yonler": guclu,
            "gelisim_alanlari": gelisim
        }


# Uygulama genelinde kullanılacak servis örneği
ai_service = AIService()

