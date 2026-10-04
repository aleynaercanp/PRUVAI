"""
Uygulama sunucusu başlatıcı (run.py).
Yerel ortamda Flask geliştirme sunucusunu ayağa kaldırır.
Gunicorn dağıtımlarında doğrudan 'app' nesnesi kullanılır.
"""

import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = app.config.get('DEBUG', True)
    
    print("\n" + "=" * 60)
    print(" >>> PRUVAI Servisi Başlatılıyor...")
    print(f" >>> Web Adresi: http://localhost:{port}")
    print(f" >>> Durum Kontrolü: http://localhost:{port}/health")
    print(f" >>> Yönetim Paneli: http://localhost:{port}/dashboard")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
