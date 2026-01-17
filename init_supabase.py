#!/usr/bin/env python3
"""
Script pentru inițializare automată a tabelelor Supabase
Rulează acest script dacă vrei să inițializezi manual tabelele în Supabase
"""

import os
import sys

# Verifică dacă sunt setate variabilele de mediu
SUPABASE_DB_URL = os.environ.get('SUPABASE_DB_URL', '')

if not SUPABASE_DB_URL:
    print("❌ Eroare: SUPABASE_DB_URL nu este setat!")
    print("\nConfigurare variabile de mediu:")
    print("  export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres'")
    print("\nSau creează un fișier .env cu:")
    print("  SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres")
    sys.exit(1)

try:
    import psycopg2
    print("✅ Conectare la Supabase...")
    conn = psycopg2.connect(SUPABASE_DB_URL)
    cur = conn.cursor()
    
    print("📝 Creare tabele...")
    
    # Create tables
    tables = [
        ("messages", """CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )"""),
        ("chatbot_messages", """CREATE TABLE IF NOT EXISTS chatbot_messages (
            id SERIAL PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )"""),
        ("visits", """CREATE TABLE IF NOT EXISTS visits (
            date TEXT PRIMARY KEY,
            count INTEGER NOT NULL
        )"""),
        ("certificates", """CREATE TABLE IF NOT EXISTS certificates (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'certificat',
            timestamp TEXT NOT NULL
        )"""),
        ("partners", """CREATE TABLE IF NOT EXISTS partners (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )"""),
        ("site_texts", """CREATE TABLE IF NOT EXISTS site_texts (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )"""),
        ("admin_password", """CREATE TABLE IF NOT EXISTS admin_password (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )"""),
        ("tiktok_videos", """CREATE TABLE IF NOT EXISTS tiktok_videos (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            videos TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )"""),
        ("locations", """CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )"""),
        ("reviews", """CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            author TEXT NOT NULL,
            rating INTEGER NOT NULL,
            text TEXT NOT NULL,
            date TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )"""),
        ("chatbot_responses", """CREATE TABLE IF NOT EXISTS chatbot_responses (
            keyword TEXT PRIMARY KEY,
            response TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )""")
    ]
    
    for table_name, sql in tables:
        try:
            cur.execute(sql)
            print(f"  ✅ Tabel '{table_name}' creat")
        except Exception as e:
            print(f"  ⚠️  Tabel '{table_name}' există deja sau eroare: {e}")
    
    # Create indexes
    print("\n📊 Creare index-uri...")
    indexes = [
        ("idx_messages_timestamp", "CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)"),
        ("idx_chatbot_messages_timestamp", "CREATE INDEX IF NOT EXISTS idx_chatbot_messages_timestamp ON chatbot_messages(timestamp)"),
        ("idx_certificates_timestamp", "CREATE INDEX IF NOT EXISTS idx_certificates_timestamp ON certificates(timestamp)"),
        ("idx_reviews_timestamp", "CREATE INDEX IF NOT EXISTS idx_reviews_timestamp ON reviews(timestamp)")
    ]
    
    for index_name, sql in indexes:
        try:
            cur.execute(sql)
            print(f"  ✅ Index '{index_name}' creat")
        except Exception as e:
            print(f"  ⚠️  Index '{index_name}' există deja sau eroare: {e}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("\n✅ Inițializare Supabase finalizată cu succes!")
    print("💡 Tabelele vor fi create automat și la primul acces API, dar poți rula acest script pentru verificare.")
    
except ImportError:
    print("❌ Eroare: psycopg2 nu este instalat!")
    print("\nInstalare:")
    print("  pip install psycopg2-binary")
    sys.exit(1)
except Exception as e:
    print(f"❌ Eroare la conectare sau creare tabele: {e}")
    sys.exit(1)

