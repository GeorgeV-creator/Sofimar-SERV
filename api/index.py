"""
Vercel Python Serverless Function
Handles all API endpoints for Sofimar SERV website
Creates database tables automatically on first run
"""

import json
import os
import sqlite3
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request
import urllib.parse

# Database configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
SUPABASE_DB_URL = os.environ.get('SUPABASE_DB_URL', '')
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY and SUPABASE_DB_URL)
DB_FILE = '/tmp/site.db' if os.environ.get('VERCEL') else 'site.db'

# Initialize database flag
_db_initialized = False

def init_database():
    """Initialize database tables - called once, works for both Supabase and SQLite"""
    global _db_initialized
    if _db_initialized:
        return
    
    try:
        db = get_db_connection()
        try:
            if db['type'] == 'supabase':
                print("🔧 Initializing Supabase database tables...")
                init_supabase_tables(db['conn'])
                db['conn'].commit()
                print("✅ Supabase tables initialized successfully")
            else:
                print("🔧 Initializing SQLite database tables...")
                init_sqlite_tables(db['conn'])
                db['conn'].commit()
                print("✅ SQLite tables initialized successfully")
            _db_initialized = True
        except Exception as e:
            print(f"⚠️ Database init error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            db['conn'].close()
    except Exception as e:
        print(f"❌ Database connection error during init: {e}")

def get_db_connection():
    """Get database connection"""
    if USE_SUPABASE and SUPABASE_DB_URL:
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(SUPABASE_DB_URL)
            return {'conn': conn, 'type': 'supabase', 'cursor_factory': RealDictCursor}
        except Exception as e:
            print(f"Supabase connection error: {e}, using SQLite")
    
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return {'conn': conn, 'type': 'sqlite', 'cursor_factory': None}

def init_supabase_tables(conn):
    """Initialize Supabase PostgreSQL tables"""
    cur = conn.cursor()
    
    # Create all tables
    tables_sql = [
        "CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, data TEXT NOT NULL, timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS chatbot_messages (id SERIAL PRIMARY KEY, data TEXT NOT NULL, timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS visits (date TEXT PRIMARY KEY, count INTEGER NOT NULL)",
        "CREATE TABLE IF NOT EXISTS certificates (id TEXT PRIMARY KEY, data TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'certificat', timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS partners (id TEXT PRIMARY KEY, data TEXT NOT NULL, timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS site_texts (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, last_updated TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS admin_password (id INTEGER PRIMARY KEY CHECK (id = 1), password TEXT NOT NULL, last_updated TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS tiktok_videos (id INTEGER PRIMARY KEY CHECK (id = 1), videos TEXT NOT NULL, last_updated TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, last_updated TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, author TEXT NOT NULL, rating INTEGER NOT NULL, text TEXT NOT NULL, date TEXT NOT NULL, timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS chatbot_responses (keyword TEXT PRIMARY KEY, response TEXT NOT NULL, timestamp TEXT NOT NULL)"
    ]
    
    for sql in tables_sql:
        try:
            cur.execute(sql)
            print(f"  ✅ Table created/verified: {sql.split('(')[0].split()[-1]}")
        except Exception as e:
            print(f"  ⚠️ Table creation skipped (may already exist): {str(e)[:50]}")
    
    # Create indexes for better performance
    indexes_sql = [
        "CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)",
        "CREATE INDEX IF NOT EXISTS idx_chatbot_messages_timestamp ON chatbot_messages(timestamp)",
        "CREATE INDEX IF NOT EXISTS idx_certificates_timestamp ON certificates(timestamp)",
        "CREATE INDEX IF NOT EXISTS idx_reviews_timestamp ON reviews(timestamp)"
    ]
    
    for sql in indexes_sql:
        try:
            cur.execute(sql)
        except:
            pass
    
    cur.close()

def init_sqlite_tables(conn):
    """Initialize SQLite tables"""
    cur = conn.cursor()
    tables = [
        "CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, data TEXT NOT NULL, timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS chatbot_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT NOT NULL, timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS visits (date TEXT PRIMARY KEY, count INTEGER NOT NULL)",
        "CREATE TABLE IF NOT EXISTS certificates (id TEXT PRIMARY KEY, data TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'certificat', timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS partners (id TEXT PRIMARY KEY, data TEXT NOT NULL, timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS site_texts (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, last_updated TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS admin_password (id INTEGER PRIMARY KEY CHECK (id = 1), password TEXT NOT NULL, last_updated TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS tiktok_videos (id INTEGER PRIMARY KEY CHECK (id = 1), videos TEXT NOT NULL, last_updated TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL, last_updated TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, author TEXT NOT NULL, rating INTEGER NOT NULL, text TEXT NOT NULL, date TEXT NOT NULL, timestamp TEXT NOT NULL)",
        "CREATE TABLE IF NOT EXISTS chatbot_responses (keyword TEXT PRIMARY KEY, response TEXT NOT NULL, timestamp TEXT NOT NULL)"
    ]
    for sql in tables:
        cur.execute(sql)
    
    # Add type column if not exists
    try:
        cur.execute("ALTER TABLE certificates ADD COLUMN type TEXT DEFAULT 'certificat'")
    except:
        pass
    cur.close()

def handle_api_request(path, method, query, body_data):
    """Handle API request and return response"""
    # Initialize database on first request
    init_database()
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    try:
        if method == 'OPTIONS':
            return 200, headers, ''
        
        # Remove /api/ prefix from path
        if path.startswith('/api/'):
            path = path[5:]
        elif path.startswith('api/'):
            path = path[4:]
        
        # GET endpoints
        if method == 'GET':
            if path == 'test' or path == 'health':
                return 200, headers, json.dumps({
                    'status': 'ok',
                    'db_initialized': _db_initialized
                }, ensure_ascii=False)
            
            elif path == 'messages':
                db = get_db_connection()
                cur = db['conn'].cursor(cursor_factory=db['cursor_factory'])
                cur.execute("SELECT data FROM messages ORDER BY timestamp DESC")
                rows = cur.fetchall()
                messages = [json.loads(dict(row)['data'] if db['type'] == 'supabase' else row['data']) for row in rows]
                db['conn'].close()
                return 200, headers, json.dumps(messages, ensure_ascii=False)
            
            elif path == 'certificates':
                db = get_db_connection()
                cur = db['conn'].cursor(cursor_factory=db['cursor_factory'])
                cur.execute("SELECT id, data, type FROM certificates ORDER BY timestamp DESC")
                rows = cur.fetchall()
                certificates = []
                for row in rows:
                    row_dict = dict(row) if db['type'] == 'supabase' else row
                    cert_data = json.loads(row_dict['data'])
                    cert_data['type'] = row_dict.get('type', 'certificat')
                    certificates.append(cert_data)
                db['conn'].close()
                return 200, headers, json.dumps(certificates, ensure_ascii=False)
            
            elif path == 'tiktok-videos':
                db = get_db_connection()
                cur = db['conn'].cursor(cursor_factory=db['cursor_factory'])
                cur.execute("SELECT videos FROM tiktok_videos WHERE id = 1")
                row = cur.fetchone()
                if row:
                    row_dict = dict(row) if db['type'] == 'supabase' else row
                    videos = json.loads(row_dict['videos']) if isinstance(row_dict['videos'], str) else row_dict['videos']
                    db['conn'].close()
                    return 200, headers, json.dumps(videos if isinstance(videos, list) else [], ensure_ascii=False)
                db['conn'].close()
                default_videos = ['7567003645250702614', '7564125179761167638', '7556587113244937475']
                return 200, headers, json.dumps(default_videos, ensure_ascii=False)
            
            elif path == 'locations':
                db = get_db_connection()
                cur = db['conn'].cursor(cursor_factory=db['cursor_factory'])
                cur.execute("SELECT data FROM locations WHERE id = 1")
                row = cur.fetchone()
                if row:
                    row_dict = dict(row) if db['type'] == 'supabase' else row
                    locations = json.loads(row_dict['data']) if isinstance(row_dict['data'], str) else row_dict['data']
                    db['conn'].close()
                    return 200, headers, json.dumps(locations if isinstance(locations, list) else [], ensure_ascii=False)
                db['conn'].close()
                return 200, headers, json.dumps([], ensure_ascii=False)
            
            elif path == 'reviews':
                db = get_db_connection()
                cur = db['conn'].cursor(cursor_factory=db['cursor_factory'])
                cur.execute("SELECT id, author, rating, text, date FROM reviews ORDER BY timestamp DESC")
                rows = cur.fetchall()
                reviews = [dict(row) if db['type'] == 'supabase' else {k: row[k] for k in row.keys()} for row in rows]
                db['conn'].close()
                return 200, headers, json.dumps(reviews, ensure_ascii=False)
            
            elif path == 'chatbot-responses':
                db = get_db_connection()
                cur = db['conn'].cursor(cursor_factory=db['cursor_factory'])
                cur.execute("SELECT keyword, response FROM chatbot_responses ORDER BY keyword")
                rows = cur.fetchall()
                responses = {}
                for row in rows:
                    row_dict = dict(row) if db['type'] == 'supabase' else row
                    responses[row_dict['keyword']] = row_dict['response']
                db['conn'].close()
                return 200, headers, json.dumps(responses, ensure_ascii=False)
            
            elif path == 'admin-password':
                db = get_db_connection()
                cur = db['conn'].cursor(cursor_factory=db['cursor_factory'])
                cur.execute("SELECT password FROM admin_password WHERE id = 1")
                row = cur.fetchone()
                password = dict(row)['password'] if row and db['type'] == 'supabase' else (row['password'] if row else 'admin123')
                db['conn'].close()
                return 200, headers, json.dumps({'password': password}, ensure_ascii=False)
            
            else:
                return 404, headers, json.dumps({'error': 'Not found'}, ensure_ascii=False)
        
        # POST endpoints
        elif method == 'POST':
            if not body_data:
                return 400, headers, json.dumps({'error': 'No body data'}, ensure_ascii=False)
            
            data = body_data if isinstance(body_data, dict) else json.loads(body_data) if isinstance(body_data, str) else {}
            
            if path == 'messages':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                
                db = get_db_connection()
                cur = db['conn'].cursor()
                sql = "INSERT INTO messages (id, data, timestamp) VALUES (%s, %s, %s)" if db['type'] == 'supabase' else "INSERT INTO messages (id, data, timestamp) VALUES (?, ?, ?)"
                cur.execute(sql, (data['id'], json.dumps(data, ensure_ascii=False), data['timestamp']))
                db['conn'].commit()
                db['conn'].close()
                return 200, headers, json.dumps({'success': True, 'id': data['id']}, ensure_ascii=False)
            
            elif path == 'certificates':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                cert_type = data.get('type', 'certificat')
                
                db = get_db_connection()
                cur = db['conn'].cursor()
                sql = "INSERT INTO certificates (id, data, type, timestamp) VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET data = %s, type = %s, timestamp = %s" if db['type'] == 'supabase' else "INSERT OR REPLACE INTO certificates (id, data, type, timestamp) VALUES (?, ?, ?, ?)"
                if db['type'] == 'supabase':
                    cur.execute(sql, (data['id'], json.dumps(data, ensure_ascii=False), cert_type, data['timestamp'], json.dumps(data, ensure_ascii=False), cert_type, data['timestamp']))
                else:
                    cur.execute(sql, (data['id'], json.dumps(data, ensure_ascii=False), cert_type, data['timestamp']))
                db['conn'].commit()
                db['conn'].close()
                return 200, headers, json.dumps({'success': True, 'id': data['id']}, ensure_ascii=False)
            
            elif path == 'tiktok-videos':
                videos = data.get('videos', [])
                if not isinstance(videos, list):
                    return 400, headers, json.dumps({'error': 'Invalid videos'}, ensure_ascii=False)
                
                db = get_db_connection()
                cur = db['conn'].cursor()
                last_updated = datetime.now().isoformat()
                sql = "INSERT INTO tiktok_videos (id, videos, last_updated) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET videos = %s, last_updated = %s" if db['type'] == 'supabase' else "INSERT OR REPLACE INTO tiktok_videos (id, videos, last_updated) VALUES (1, ?, ?)"
                videos_json = json.dumps(videos, ensure_ascii=False)
                if db['type'] == 'supabase':
                    cur.execute(sql, (videos_json, last_updated, videos_json, last_updated))
                else:
                    cur.execute(sql, (videos_json, last_updated))
                db['conn'].commit()
                db['conn'].close()
                return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
            
            elif path == 'locations':
                db = get_db_connection()
                cur = db['conn'].cursor()
                last_updated = datetime.now().isoformat()
                sql = "INSERT INTO locations (id, data, last_updated) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET data = %s, last_updated = %s" if db['type'] == 'supabase' else "INSERT OR REPLACE INTO locations (id, data, last_updated) VALUES (1, ?, ?)"
                data_json = json.dumps(data, ensure_ascii=False)
                if db['type'] == 'supabase':
                    cur.execute(sql, (data_json, last_updated, data_json, last_updated))
                else:
                    cur.execute(sql, (data_json, last_updated))
                db['conn'].commit()
                db['conn'].close()
                return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
            
            elif path == 'admin-password':
                password = data.get('password')
                if not password:
                    return 400, headers, json.dumps({'error': 'Missing password'}, ensure_ascii=False)
                
                db = get_db_connection()
                cur = db['conn'].cursor()
                last_updated = datetime.now().isoformat()
                sql = "INSERT INTO admin_password (id, password, last_updated) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET password = %s, last_updated = %s" if db['type'] == 'supabase' else "INSERT OR REPLACE INTO admin_password (id, password, last_updated) VALUES (1, ?, ?)"
                if db['type'] == 'supabase':
                    cur.execute(sql, (password, last_updated, password, last_updated))
                else:
                    cur.execute(sql, (password, last_updated))
                db['conn'].commit()
                db['conn'].close()
                return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
            
            else:
                return 404, headers, json.dumps({'error': 'Not found'}, ensure_ascii=False)
        
        else:
            return 405, headers, json.dumps({'error': 'Method not allowed'}, ensure_ascii=False)
    
    except Exception as e:
        import traceback
        error_info = {'error': str(e)}
        if os.environ.get('VERCEL_ENV') != 'production':
            error_info['traceback'] = traceback.format_exc()
        return 500, headers, json.dumps(error_info, ensure_ascii=False)

class handler(BaseHTTPRequestHandler):
    """Vercel Python serverless function handler"""
    
    def do_GET(self):
        self._handle_request('GET')
    
    def do_POST(self):
        self._handle_request('POST')
    
    def do_DELETE(self):
        self._handle_request('DELETE')
    
    def do_OPTIONS(self):
        self._handle_request('OPTIONS')
    
    def _handle_request(self, method):
        try:
            # Parse path
            path = self.path
            parsed_url = urlparse(path)
            path = parsed_url.path
            
            # Parse query
            query = {}
            if parsed_url.query:
                query_params = parse_qs(parsed_url.query)
                query = {k: v[0] if len(v) == 1 else v for k, v in query_params.items()}
            
            # Get body
            body_data = ''
            if method in ['POST', 'PUT', 'PATCH']:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    body_str = self.rfile.read(content_length).decode('utf-8')
                    try:
                        body_data = json.loads(body_str)
                    except:
                        body_data = body_str
            
            # Handle request
            status_code, headers, body = handle_api_request(path, method, query, body_data)
            
            # Send response
            self.send_response(status_code)
            for key, value in headers.items():
                self.send_header(key, value)
            self.end_headers()
            if body:
                self.wfile.write(body.encode('utf-8'))
        
        except Exception as e:
            import traceback
            error_body = json.dumps({'error': str(e), 'traceback': traceback.format_exc()}, ensure_ascii=False)
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(error_body.encode('utf-8'))
