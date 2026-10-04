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

        raise AIServiceError(f"Kullanılabilir modellerden yanıt alınamadı. Son durum: {last_error}")


# Uygulama genelinde kullanılacak servis örneği
ai_service = AIService()
