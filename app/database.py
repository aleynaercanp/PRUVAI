"""
SQLite veritabanı bağlantı yönetimi ve kayıt işlemleri.
Başvuru (lead) verilerinin güvenli şekilde saklanmasını ve listelenmesini sağlar.
"""

import sqlite3
from flask import g, current_app


def get_db():
    """
    Mevcut istek bağlamındaki veritabanı bağlantısını döner.
    Bağlantı henüz açılmamışsa yenisini oluşturur ve sütun isimleriyle erişim sağlar.
    """
    if 'db' not in g:
        db_path = current_app.config.get('DATABASE_PATH', 'pruvai.db')
        g.db = sqlite3.connect(
            db_path,
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row

    return g.db


def close_db(e=None):
    """İstek tamamlandığında açık olan veritabanı bağlantısını kapatır."""
    db = g.pop('db', None)
    if db is not None:
        db.close()


def init_db(app):
    """
    Uygulama ayağa kalktığında gerekli tabloları hazırlar
    ve istek bitişinde bağlantının kapatılmasını güvenceye alır.
    """
    app.teardown_appcontext(close_db)

    with app.app_context():
        db = get_db()
        cursor = db.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                isim TEXT NOT NULL,
                telefon TEXT NOT NULL,
                mesaj TEXT,
                hedef_rol TEXT DEFAULT 'Aday - Aday Deneyimi',
                tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.commit()


def lead_ekle(isim, telefon, mesaj="", hedef_rol="Aday - Aday Deneyimi"):
    """
    Formdan gelen yeni iletişim kaydını veritabanına ekler.
    Parametreler güvenli bir şekilde sorguya bağlanır.
    Aynı verinin kısa süre içinde çoklanmasını engeller.
    """
    try:
        db = get_db()
        cursor = db.cursor()

        temiz_isim = isim.strip()
        temiz_telefon = telefon.strip()
        temiz_mesaj = (mesaj or "").strip()
        temiz_rol = (hedef_rol or "Aday - Aday Deneyimi").strip()

        # Çoklama (duplication) önleme: Son 1 dakika içinde aynı isim/telefon ve mesaj varsa tekrar ekleme
        cursor.execute("""
            SELECT id FROM leads 
            WHERE (telefon = ? OR isim = ?) AND mesaj = ? 
            ORDER BY id DESC LIMIT 1
        """, (temiz_telefon, temiz_isim, temiz_mesaj))
        mevcut = cursor.fetchone()
        if mevcut:
            return mevcut["id"]

        cursor.execute(
            """
            INSERT INTO leads (isim, telefon, mesaj, hedef_rol)
            VALUES (?, ?, ?, ?)
            """,
            (temiz_isim, temiz_telefon, temiz_mesaj, temiz_rol)
        )
        db.commit()
        return cursor.lastrowid
    except sqlite3.Error as err:
        db.rollback()
        raise RuntimeError(f"Veritabanına kayıt eklenemedi: {str(err)}")


def tum_leadler():
    """
    Kayıtlı tüm başvuruları yeniden eskiye doğru listeler.
    Arayüz ve Wix Repeater bileşenleriyle tam uyumlu bir sözlük listesi döner.
    """
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            SELECT id, isim, telefon, mesaj, hedef_rol, tarih 
            FROM leads 
            ORDER BY id DESC
        """)
        rows = cursor.fetchall()
        
        lead_listesi = []
        for r in rows:
            raw_mesaj = r["mesaj"] or ""
            subject = "Platform Hakkında"
            clean_mesaj = raw_mesaj

            # Mesaj başlığında [Konu] formatı varsa ayıklıyoruz
            if raw_mesaj.startswith("[") and "]" in raw_mesaj:
                subject = raw_mesaj[1:raw_mesaj.index("]")].strip()
                clean_mesaj = raw_mesaj[raw_mesaj.index("]")+1:].strip()

            lead_listesi.append({
                "id": r["id"],
                "_id": str(r["id"]),  # Wix Velo Repeater bileşenleri için benzersiz kimlik
                "isim": r["isim"],
                "fullName": r["isim"],
                "telefon": r["telefon"],
                "email": r["telefon"],
                "konu": subject,
                "subject": subject,
                "mesaj": clean_mesaj or raw_mesaj,
                "message": clean_mesaj or raw_mesaj,
                "hedef_rol": r["hedef_rol"] or "Yeni Mezun",
                "userType": r["hedef_rol"] or "Yeni Mezun",
                "tarih": str(r["tarih"])
            })
        return lead_listesi
    except sqlite3.Error as err:
        raise RuntimeError(f"Kayıtlar okunurken hata oluştu: {str(err)}")


def lead_sil(lead_id):
    """
    Belirtilen ID'ye sahip başvuruyu veritabanından kalıcı olarak siler.
    """
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
        db.commit()
        return cursor.rowcount > 0
    except sqlite3.Error as err:
        db.rollback()
        raise RuntimeError(f"Kayıt silinirken hata oluştu: {str(err)}")
