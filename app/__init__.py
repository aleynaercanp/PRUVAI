"""
Flask uygulama fabrikası.
Uygulama bileşenlerini, CORS ayarlarını, veritabanını ve rotaları ilklendirir.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from config import get_config
from app.database import init_db
from app.routes import web_bp, api_bp


def create_app(config_class=None):
    """
    Uygulama örneğini oluşturup yapılandırır.
    """
    app = Flask(__name__)

    # Konfigürasyon ayarlarını yüklüyoruz
    if config_class is None:
        config_class = get_config()
    app.config.from_object(config_class)

    # Wix Studio ve harici kaynaklardan gelen API çağrıları için CORS izni
    CORS(app, resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}})

    # Veritabanı tablolarını hazırlıyoruz
    with app.app_context():
        init_db(app)

    # Sayfa ve API rotalarını kaydediyoruz
    app.register_blueprint(web_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    # Canlılık ve durum kontrolü için basit bir sağlık rotası
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "durum": "aktif",
            "servis": "PRUVAI SmartLead AI Backend",
            "ai_saglayici": app.config.get("AI_PROVIDER", "groq"),
            "model": app.config.get("GROQ_MODEL", "llama-3.1-8b-instant")
        }), 200

    return app
