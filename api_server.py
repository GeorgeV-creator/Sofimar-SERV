#!/usr/bin/env python3
"""
Simple API server for handling contact messages and chatbot messages.
Stores data in SQLite for persistence across machines.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
from datetime import datetime
import sqlite3
import urllib.request
import urllib.parse
import re

# Legacy JSON file paths (used for one-time migration)
MESSAGES_FILE = 'messages.json'
CHATBOT_FILE = 'chatbot_messages.json'
VISITS_FILE = 'visits.json'
CERTIFICATES_FILE = 'certificates.json'
PARTNERS_FILE = 'partners.json'
SITE_TEXTS_FILE = 'site_texts.json'

# SQLite database
DB_FILE = 'site.db'


def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS chatbot_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS visits (
            date TEXT PRIMARY KEY,
            count INTEGER NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS certificates (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'certificat',
            timestamp TEXT NOT NULL
        )
        """
    )
    
    # Add type column if it doesn't exist (migration)
    try:
        cur.execute("ALTER TABLE certificates ADD COLUMN type TEXT DEFAULT 'certificat'")
    except sqlite3.OperationalError:
        pass  # Column already exists

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS partners (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS site_texts (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_password (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS tiktok_videos (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            videos TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            author TEXT NOT NULL,
            rating INTEGER NOT NULL,
            text TEXT NOT NULL,
            date TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS chatbot_responses (
            keyword TEXT PRIMARY KEY,
            response TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
        """
    )

    conn.commit()
    conn.close()


def _table_empty(conn, table_name):
    cur = conn.execute(f"SELECT 1 FROM {table_name} LIMIT 1")
    return cur.fetchone() is None


def _load_json_file(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return default
            return json.loads(content)
    except Exception:
        return default


def migrate_from_json():
    conn = get_db()
    cur = conn.cursor()
    now_iso = datetime.now().isoformat()

    if _table_empty(conn, 'messages'):
        messages = _load_json_file(MESSAGES_FILE, [])
        for msg in messages:
            msg_id = msg.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
            timestamp = msg.get('timestamp') or now_iso
            msg['id'] = msg_id
            msg['timestamp'] = timestamp
            cur.execute(
                "INSERT OR IGNORE INTO messages (id, data, timestamp) VALUES (?, ?, ?)",
                (msg_id, json.dumps(msg, ensure_ascii=False), timestamp)
            )

    if _table_empty(conn, 'chatbot_messages'):
        messages = _load_json_file(CHATBOT_FILE, [])
        for msg in messages:
            timestamp = msg.get('timestamp') or now_iso
            msg['timestamp'] = timestamp
            cur.execute(
                "INSERT INTO chatbot_messages (data, timestamp) VALUES (?, ?)",
                (json.dumps(msg, ensure_ascii=False), timestamp)
            )

    if _table_empty(conn, 'visits'):
        visits = _load_json_file(VISITS_FILE, {})
        for date, count in visits.items():
            try:
                count_int = int(count)
            except Exception:
                count_int = 0
            cur.execute(
                "INSERT OR REPLACE INTO visits (date, count) VALUES (?, ?)",
                (date, count_int)
            )

    if _table_empty(conn, 'certificates'):
        certificates = _load_json_file(CERTIFICATES_FILE, [])
        for cert in certificates:
            cert_id = cert.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
            timestamp = cert.get('timestamp') or now_iso
            cert['id'] = cert_id
            cert['timestamp'] = timestamp
            cur.execute(
                "INSERT OR IGNORE INTO certificates (id, data, timestamp) VALUES (?, ?, ?)",
                (cert_id, json.dumps(cert, ensure_ascii=False), timestamp)
            )

    if _table_empty(conn, 'partners'):
        partners = _load_json_file(PARTNERS_FILE, [])
        for partner in partners:
            partner_id = partner.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
            timestamp = partner.get('timestamp') or now_iso
            partner['id'] = partner_id
            partner['timestamp'] = timestamp
            cur.execute(
                "INSERT OR IGNORE INTO partners (id, data, timestamp) VALUES (?, ?, ?)",
                (partner_id, json.dumps(partner, ensure_ascii=False), timestamp)
            )

    if _table_empty(conn, 'site_texts'):
        texts = _load_json_file(SITE_TEXTS_FILE, {})
        if isinstance(texts, dict) and texts:
            last_updated = texts.get('lastUpdated') or now_iso
            cur.execute(
                "INSERT OR REPLACE INTO site_texts (id, data, last_updated) VALUES (1, ?, ?)",
                (json.dumps(texts, ensure_ascii=False), last_updated)
            )

    if _table_empty(conn, 'chatbot_responses'):
        # Default chatbot responses
        default_responses = {
            'dezinsecție': 'Dezinsecția noastră elimină eficient gândacii, ploșnițele, furnicile și puricii folosind insecticide profesionale cu miros redus. Tratamentul este sigur pentru familie și animalele de companie, fiind efectuat de tehnicieni certificați CEPA. Pentru ploșnițe, garantăm tratament în două etape (18-21 zile) pentru a elimina complet ciclul reproductiv.',
            'gândaci': 'Folosim metode profesionale de dezinsecție pentru eliminarea gândacilor. Tratamentul vizăm strict locurile de ascunzătoare (crăpături, goluri) pentru eficiență maximă și siguranță. Toate intervențiile sunt efectuate de tehnicieni certificați.',
            'ploșnițe': 'Pentru ploșnițe, oferim tratament garantat în minim două etape la interval de 18-21 de zile. Acest protocol este esențial pentru a rupe ciclul reproductiv și a elimina larvele nou-eclozate. Utilizăm produse profesionale, sigure pentru familie.',
            'deratizare': 'Deratizarea noastră este discretă, sigură și eficientă. Folosim momeli anticoagulante profesionale, securizate în stații rezistente la deschidere accidentală, prevenind accesul copiilor și animalelor. Identificăm și tratăm punctele de acces exterioare pentru o apărare perimetrală completă.',
            'șoareci': 'Pentru eliminarea șoarecilor, implementăm stații sigure de momeală și ținem cont de neofobie (frica rozătoarelor de obiecte noi). Protocoalele noastre asigură consumul momelei și eliminarea eficientă a populației de rozătoare.',
            'șobolani': 'Șobolanii sunt vectori majori de boli (Salmonela, Leptospiroză) și cauzează daune structurale. Deratizarea noastră rezidențială folosește momeli profesionale securizate și crează o barieră protectoare în jurul proprietății.',
            'dezinfecție': 'Dezinfecția noastră utilizează tehnologia de Nebulizare Uscată (sistemul Nocospray cu Peroxid de Hidrogen H₂O₂) care ajunge la 100% din volumul aerului și suprafețelor, inclusiv în spatele mobilierului. Formulă non-corozivă care se descompune natural în apă și oxigen, fără reziduuri toxice.',
            'preț': 'Prețurile variază în funcție de tipul de serviciu și dimensiunea locuinței. Oferim consultație gratuită și estimare de preț personalizată. Contactați-ne pentru un devis detaliat.',
            'garanție': 'Oferim GARANȚIE 300% - o garanție triplă care oferă proprietarilor liniște și un angajament de neegalat pentru o soluție permanentă.',
            'certificat': 'Suntem prima firmă din România certificată cu standardul european de calitate ISO 16.636 (CEPA Certified®). Procedurile noastre sunt recunoscute la nivel internațional ca fiind cele mai bune practici.',
            'timp': 'Oferim intervenție rapidă în maximum 24 de ore pentru probleme urgente în zonele noastre de acoperire națională.',
            'contact': 'Ne puteți contacta prin email la contact@sofimarserv.ro sau prin formularul de contact de pe site. Suntem disponibili pentru consultații și intervenții urgente.',
            'default': 'Vă mulțumim pentru întrebare! Pentru informații detaliate despre serviciile noastre de deratizare, dezinsecție sau dezinfecție, vă rugăm să ne contactați direct. Oferim consultație gratuită și intervenție rapidă în 24 de ore pentru probleme urgente.',
            'salut': 'Bună ziua! Cu ce vă pot ajuta astăzi? Puteți întreba despre serviciile noastre de deratizare, dezinsecție sau dezinfecție.',
            'mulțum': 'Cu plăcere! Dacă mai aveți întrebări, sunt aici să vă ajut. O zi bună!'
        }
        
        for keyword, response_text in default_responses.items():
            cur.execute(
                "INSERT INTO chatbot_responses (keyword, response, timestamp) VALUES (?, ?, ?)",
                (keyword.lower(), response_text, now_iso)
            )

    conn.commit()
    conn.close()


def sync_google_reviews(place_id=None, api_key=None):
    """
    Sincronizează recenziile de pe Google Places API în baza de date.
    Necesită: place_id (ID-ul locației Google) și api_key (Google Places API key)
    """
    if not api_key:
        return {'error': 'Google Places API key este necesar. Configurează-l în variabila de mediu GOOGLE_PLACES_API_KEY'}
    
    if not place_id:
        # Poți configura place_id-ul în variabila de mediu sau hardcodat
        place_id = os.environ.get('GOOGLE_PLACE_ID', '')
        if not place_id:
            return {'error': 'Place ID este necesar. Configurează-l în variabila de mediu GOOGLE_PLACE_ID'}
    
    try:
        # Construiește URL-ul pentru Google Places API
        url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=reviews&key={api_key}"
        
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            
            if data.get('status') != 'OK':
                return {'error': f"Google Places API error: {data.get('status')}"}
            
            reviews_data = data.get('result', {}).get('reviews', [])
            
            if not reviews_data:
                return {'message': 'Nu s-au găsit recenzii pe Google'}
            
            conn = get_db()
            synced_count = 0
            
            for review in reviews_data:
                author_name = review.get('author_name', 'Anonim')
                rating = review.get('rating', 5)
                text = review.get('text', '')
                time = review.get('time', 0)
                
                # Convertește timestamp-ul în dată
                review_date = datetime.fromtimestamp(time).strftime('%Y-%m-%d') if time else datetime.now().strftime('%Y-%m-%d')
                
                # Creează un ID unic pentru recenzie bazat pe autor și timp
                review_id = f"google_{time}_{hash(author_name) % 100000}"
                
                # Verifică dacă recenzia există deja
                existing = conn.execute("SELECT id FROM reviews WHERE id = ?", (review_id,)).fetchone()
                
                if not existing:
                    timestamp = datetime.now().isoformat()
                    conn.execute(
                        "INSERT INTO reviews (id, author, rating, text, date, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                        (review_id, author_name, rating, text, review_date, timestamp)
                    )
                    synced_count += 1
            
            conn.commit()
            conn.close()
            
            return {'success': True, 'synced': synced_count, 'total': len(reviews_data)}
            
    except Exception as e:
        return {'error': f'Eroare la sincronizare: {str(e)}'}


class APIHandler(BaseHTTPRequestHandler):
    def _send_json(self, payload, status=200):
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        try:
            if path == '/api/messages':
                conn = get_db()
                rows = conn.execute("SELECT data FROM messages ORDER BY timestamp DESC").fetchall()
                conn.close()
                messages = [json.loads(row['data']) for row in rows]
                self._send_json(messages)

            elif path == '/api/chatbot':
                conn = get_db()
                rows = conn.execute("SELECT id, data FROM chatbot_messages ORDER BY id ASC").fetchall()
                conn.close()
                messages = []
                for row in rows:
                    try:
                        msg = json.loads(row['data'])
                    except Exception:
                        msg = {}
                    if isinstance(msg, dict) and 'id' not in msg:
                        msg['id'] = row['id']
                    messages.append(msg)
                self._send_json(messages)

            elif path == '/api/visits':
                conn = get_db()
                rows = conn.execute("SELECT date, count FROM visits").fetchall()
                conn.close()
                visits = {row['date']: row['count'] for row in rows}
                self._send_json(visits)

            elif path == '/api/certificates':
                conn = get_db()
                rows = conn.execute("SELECT id, data, type FROM certificates ORDER BY timestamp DESC").fetchall()
                conn.close()
                certificates = []
                for row in rows:
                    cert_data = json.loads(row['data'])
                    cert_data['type'] = row.get('type', 'certificat')
                    certificates.append(cert_data)
                self._send_json(certificates)

            elif path == '/api/partners':
                conn = get_db()
                rows = conn.execute("SELECT data FROM partners ORDER BY timestamp DESC").fetchall()
                conn.close()
                partners = [json.loads(row['data']) for row in rows]
                self._send_json(partners)

            elif path == '/api/site-texts':
                conn = get_db()
                row = conn.execute("SELECT data FROM site_texts WHERE id = 1").fetchone()
                conn.close()
                if row:
                    texts = json.loads(row['data'])
                    self._send_json(texts if isinstance(texts, dict) else {})
                else:
                    self._send_json({})

            elif path == '/api/admin-password':
                conn = get_db()
                row = conn.execute("SELECT password FROM admin_password WHERE id = 1").fetchone()
                conn.close()
                if row:
                    self._send_json({'password': row['password']})
                else:
                    # Default password if not set
                    self._send_json({'password': 'admin123'})

            elif path == '/api/tiktok-videos':
                conn = get_db()
                row = conn.execute("SELECT videos FROM tiktok_videos WHERE id = 1").fetchone()
                conn.close()
                if row:
                    videos = json.loads(row['videos'])
                    self._send_json(videos if isinstance(videos, list) else [])
                else:
                    # Default videos
                    default_videos = ['7567003645250702614', '7564125179761167638', '7556587113244937475']
                    self._send_json(default_videos)

            elif path == '/api/locations':
                conn = get_db()
                row = conn.execute("SELECT data FROM locations WHERE id = 1").fetchone()
                conn.close()
                if row:
                    locations = json.loads(row['data'])
                    self._send_json(locations if isinstance(locations, list) else [])
                else:
                    self._send_json([])

            elif path == '/api/reviews':
                conn = get_db()
                rows = conn.execute("SELECT id, author, rating, text, date FROM reviews ORDER BY timestamp DESC").fetchall()
                conn.close()
                reviews = [{
                    'id': row['id'],
                    'author': row['author'],
                    'rating': row['rating'],
                    'text': row['text'],
                    'date': row['date']
                } for row in rows]
                self._send_json(reviews)

            elif path == '/api/sync-google-reviews':
                # Sincronizează recenziile de pe Google
                api_key = os.environ.get('GOOGLE_PLACES_API_KEY', '')
                place_id = os.environ.get('GOOGLE_PLACE_ID', '')
                
                result = sync_google_reviews(place_id=place_id, api_key=api_key)
                self._send_json(result)

            elif path == '/api/chatbot-responses':
                conn = get_db()
                rows = conn.execute("SELECT keyword, response FROM chatbot_responses ORDER BY keyword").fetchall()
                conn.close()
                responses = {row['keyword']: row['response'] for row in rows}
                self._send_json(responses)

            else:
                self._send_json({'error': 'Not found'}, status=404)
        except Exception as e:
            self._send_json({'error': str(e)}, status=500)

    def do_POST(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8')) if post_data else {}
        except Exception:
            data = {}

        try:
            if path == '/api/messages':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')

                conn = get_db()
                conn.execute(
                    "INSERT INTO messages (id, data, timestamp) VALUES (?, ?, ?)",
                    (data['id'], json.dumps(data, ensure_ascii=False), data['timestamp'])
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True, 'id': data['id']})

            elif path == '/api/chatbot':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()

                conn = get_db()
                cur = conn.execute(
                    "INSERT INTO chatbot_messages (data, timestamp) VALUES (?, ?)",
                    (json.dumps(data, ensure_ascii=False), data['timestamp'])
                )
                chatbot_id = cur.lastrowid
                if isinstance(data, dict):
                    data['id'] = chatbot_id
                    conn.execute(
                        "UPDATE chatbot_messages SET data = ? WHERE id = ?",
                        (json.dumps(data, ensure_ascii=False), chatbot_id)
                    )
                conn.commit()
                conn.close()

                self._send_json({'success': True, 'id': chatbot_id})

            elif path == '/api/visits':
                date = data.get('date')
                if not date:
                    self._send_json({'error': 'Missing date field'}, status=400)
                    return

                conn = get_db()
                row = conn.execute("SELECT count FROM visits WHERE date = ?", (date,)).fetchone()
                new_count = (row['count'] if row else 0) + 1
                conn.execute(
                    "INSERT OR REPLACE INTO visits (date, count) VALUES (?, ?)",
                    (date, new_count)
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True, 'count': new_count})

            elif path == '/api/certificates':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                cert_type = data.get('type', 'certificat')

                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO certificates (id, data, type, timestamp) VALUES (?, ?, ?, ?)",
                    (data['id'], json.dumps(data, ensure_ascii=False), cert_type, data['timestamp'])
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True, 'id': data['id']})

            elif path == '/api/partners':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')

                conn = get_db()
                conn.execute(
                    "INSERT INTO partners (id, data, timestamp) VALUES (?, ?, ?)",
                    (data['id'], json.dumps(data, ensure_ascii=False), data['timestamp'])
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True, 'id': data['id']})

            elif path == '/api/site-texts':
                data['lastUpdated'] = data.get('lastUpdated') or datetime.now().isoformat()

                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO site_texts (id, data, last_updated) VALUES (1, ?, ?)",
                    (json.dumps(data, ensure_ascii=False), data['lastUpdated'])
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True})

            elif path == '/api/admin-password':
                password = data.get('password')
                if not password:
                    self._send_json({'error': 'Missing password field'}, status=400)
                    return

                last_updated = datetime.now().isoformat()
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO admin_password (id, password, last_updated) VALUES (1, ?, ?)",
                    (password, last_updated)
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True})

            elif path == '/api/tiktok-videos':
                videos = data.get('videos')
                if not isinstance(videos, list):
                    self._send_json({'error': 'Missing or invalid videos array'}, status=400)
                    return

                last_updated = datetime.now().isoformat()
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO tiktok_videos (id, videos, last_updated) VALUES (1, ?, ?)",
                    (json.dumps(videos, ensure_ascii=False), last_updated)
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True})

            elif path == '/api/locations':
                locations = data.get('locations')
                if not isinstance(locations, list):
                    self._send_json({'error': 'Missing or invalid locations array'}, status=400)
                    return

                last_updated = datetime.now().isoformat()
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO locations (id, data, last_updated) VALUES (1, ?, ?)",
                    (json.dumps(locations, ensure_ascii=False), last_updated)
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True})

            elif path == '/api/reviews':
                author = data.get('author')
                rating = data.get('rating')
                text = data.get('text')
                date = data.get('date')
                
                if not author or not rating or not text or not date:
                    self._send_json({'error': 'Missing required fields'}, status=400)
                    return

                review_id = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                timestamp = datetime.now().isoformat()

                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO reviews (id, author, rating, text, date, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                    (review_id, author, rating, text, date, timestamp)
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True, 'id': review_id})

            elif path == '/api/chatbot-responses':
                keyword = data.get('keyword')
                response_text = data.get('response')
                
                if not keyword or not response_text:
                    self._send_json({'error': 'Missing keyword or response field'}, status=400)
                    return

                timestamp = datetime.now().isoformat()
                keyword_lower = keyword.lower().strip()

                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO chatbot_responses (keyword, response, timestamp) VALUES (?, ?, ?)",
                    (keyword_lower, response_text, timestamp)
                )
                conn.commit()
                conn.close()

                self._send_json({'success': True, 'keyword': keyword_lower})

            else:
                self._send_json({'error': 'Not found'}, status=404)
        except Exception as e:
            self._send_json({'error': str(e)}, status=500)

    def do_DELETE(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)

        try:
            if path == '/api/messages':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM messages")
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                elif 'id' in query:
                    message_id = query['id'][0]
                    conn.execute("DELETE FROM messages WHERE id = ?", (message_id,))
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                else:
                    conn.close()
                    self._send_json({'error': 'Missing id'}, status=400)

            elif path == '/api/chatbot':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM chatbot_messages")
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                elif 'id' in query:
                    chatbot_id = query['id'][0]
                    conn.execute("DELETE FROM chatbot_messages WHERE id = ?", (chatbot_id,))
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                else:
                    conn.close()
                    self._send_json({'error': 'Missing id or all flag'}, status=400)

            elif path == '/api/visits':
                if 'all' in query:
                    conn = get_db()
                    conn.execute("DELETE FROM visits")
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                else:
                    self._send_json({'error': 'Missing all flag'}, status=400)

            elif path == '/api/certificates':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM certificates")
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                elif 'id' in query:
                    cert_id = query['id'][0]
                    conn.execute("DELETE FROM certificates WHERE id = ?", (cert_id,))
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                else:
                    conn.close()
                    self._send_json({'error': 'Missing id'}, status=400)

            elif path == '/api/partners':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM partners")
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                elif 'id' in query:
                    partner_id = query['id'][0]
                    conn.execute("DELETE FROM partners WHERE id = ?", (partner_id,))
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                else:
                    conn.close()
                    self._send_json({'error': 'Missing id'}, status=400)

            elif path == '/api/reviews':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM reviews")
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                elif 'id' in query:
                    review_id = query['id'][0]
                    conn.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                else:
                    conn.close()
                    self._send_json({'error': 'Missing id or all flag'}, status=400)

            elif path == '/api/chatbot-responses':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM chatbot_responses")
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                elif 'keyword' in query:
                    keyword = query['keyword'][0].lower().strip()
                    conn.execute("DELETE FROM chatbot_responses WHERE keyword = ?", (keyword,))
                    conn.commit()
                    conn.close()
                    self._send_json({'success': True})
                else:
                    conn.close()
                    self._send_json({'error': 'Missing keyword or all flag'}, status=400)

            else:
                self._send_json({'error': 'Not found'}, status=404)
        except Exception as e:
            self._send_json({'error': str(e)}, status=500)

    def log_message(self, format, *args):
        pass


def run(server_class=HTTPServer, handler_class=APIHandler, port=8001):
    init_db()
    migrate_from_json()

    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'🚀 API Server running on http://localhost:{port}')
    print(f'📧 Messages API: http://localhost:{port}/api/messages')
    print(f'💬 Chatbot API: http://localhost:{port}/api/chatbot')
    print(f'👁️  Visits API: http://localhost:{port}/api/visits')
    print(f'📄 Certificates API: http://localhost:{port}/api/certificates')
    print(f'🤝 Partners API: http://localhost:{port}/api/partners')
    print(f'🔐 Admin Password API: http://localhost:{port}/api/admin-password')
    print(f'📱 TikTok Videos API: http://localhost:{port}/api/tiktok-videos')
    print(f'📍 Locations API: http://localhost:{port}/api/locations')
    print(f'⭐ Reviews API: http://localhost:{port}/api/reviews')
    print(f'🤖 Chatbot Responses API: http://localhost:{port}/api/chatbot-responses')
    print('⏹️  Press Ctrl+C to stop')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n👋 Server stopped')
        httpd.server_close()


if __name__ == '__main__':
    run()
