"""
Vercel Serverless Function for API endpoints
Handles all API routes for the Sofimar SERV website
"""

import json
import os
import sqlite3
from datetime import datetime
from urllib.parse import urlparse, parse_qs
import urllib.request
import urllib.parse

# Database configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
SUPABASE_DB_URL = os.environ.get('SUPABASE_DB_URL', '')

# Use Supabase if all credentials are present
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_KEY and SUPABASE_DB_URL)
DB_FILE = '/tmp/site.db' if os.environ.get('VERCEL') else 'site.db'

# Debug logging
if os.environ.get('VERCEL'):
    print(f"🔍 Database config: USE_SUPABASE={USE_SUPABASE}, SUPABASE_URL={'✅' if SUPABASE_URL else '❌'}, SUPABASE_KEY={'✅' if SUPABASE_KEY else '❌'}, SUPABASE_DB_URL={'✅' if SUPABASE_DB_URL else '❌'}")

class DBWrapper:
    """Wrapper to make Supabase and SQLite connections compatible"""
    def __init__(self, conn, db_type):
        self.conn = conn
        self.db_type = db_type
        self._cursor = None
    
    def execute(self, query, params=None):
        """Execute query and return cursor"""
        # Convert SQLite ? placeholders to PostgreSQL $1, $2, etc. if needed
        if self.db_type == 'supabase' and params:
            # For PostgreSQL, use %s placeholders
            if '?' in query:
                # Simple replacement - may need more sophisticated handling
                query = query.replace('?', '%s')
        
        if self.db_type == 'supabase':
            from psycopg2.extras import RealDictCursor
            self._cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        else:
            self._cursor = self.conn.cursor()
        
        if params:
            self._cursor.execute(query, params)
        else:
            self._cursor.execute(query)
        return self._cursor
    
    def commit(self):
        if self.conn:
            self.conn.commit()
    
    def close(self):
        if self._cursor:
            self._cursor.close()
        if self.conn:
            self.conn.close()

def get_db():
    """Get database connection - Supabase PostgreSQL or SQLite"""
    # Check if we should use Supabase
    if USE_SUPABASE and SUPABASE_DB_URL:
        try:
            import psycopg2
            conn = psycopg2.connect(SUPABASE_DB_URL)
            return DBWrapper(conn, 'supabase')
        except ImportError:
            # psycopg2 not available, fallback to SQLite
            print("psycopg2 not available, using SQLite")
            pass
        except Exception as e:
            # Connection failed, fallback to SQLite
            print(f"Supabase connection error: {e}, using SQLite fallback")
            pass
    
    # Fallback to SQLite
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return DBWrapper(conn, 'sqlite')

def execute_query(query, params=None, fetch=True):
    """Execute query on Supabase or SQLite"""
    if USE_SUPABASE and SUPABASE_DB_URL:
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            conn = psycopg2.connect(SUPABASE_DB_URL)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params)
            if fetch:
                result = cursor.fetchall()
                conn.commit()
                cursor.close()
                conn.close()
                return result
            else:
                conn.commit()
                cursor.close()
                conn.close()
                return cursor.rowcount
        except Exception as e:
            print(f"Supabase query error: {e}")
            # Fallback to SQLite
            pass
    
    # SQLite fallback
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)
    if fetch:
        result = cursor.fetchall()
        conn.commit()
        conn.close()
        return result
    else:
        conn.commit()
        rowcount = cursor.rowcount
        conn.close()
        return rowcount

def init_supabase_db():
    """Initialize Supabase database tables automatically"""
    if not USE_SUPABASE or not SUPABASE_DB_URL:
        return
    
    try:
        import psycopg2
        conn = psycopg2.connect(SUPABASE_DB_URL)
        cur = conn.cursor()
        
        # Create tables
        tables_sql = [
            """CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS chatbot_messages (
                id SERIAL PRIMARY KEY,
                data TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS visits (
                date TEXT PRIMARY KEY,
                count INTEGER NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS certificates (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'certificat',
                timestamp TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS partners (
                id TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS site_texts (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                data TEXT NOT NULL,
                last_updated TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS admin_password (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                password TEXT NOT NULL,
                last_updated TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS tiktok_videos (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                videos TEXT NOT NULL,
                last_updated TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                data TEXT NOT NULL,
                last_updated TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                author TEXT NOT NULL,
                rating INTEGER NOT NULL,
                text TEXT NOT NULL,
                date TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )""",
            """CREATE TABLE IF NOT EXISTS chatbot_responses (
                keyword TEXT PRIMARY KEY,
                response TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )"""
        ]
        
        for sql in tables_sql:
            try:
                cur.execute(sql)
            except Exception as e:
                # Table might already exist, ignore
                pass
        
        # Create indexes
        indexes_sql = [
            "CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_chatbot_messages_timestamp ON chatbot_messages(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_certificates_timestamp ON certificates(timestamp)",
            "CREATE INDEX IF NOT EXISTS idx_reviews_timestamp ON reviews(timestamp)"
        ]
        
        for sql in indexes_sql:
            try:
                cur.execute(sql)
            except Exception as e:
                pass
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ Supabase tables initialized successfully")
    except Exception as e:
        print(f"⚠️ Supabase initialization error (tables may already exist): {e}")

def init_db():
    """Initialize database tables - SQLite only (Supabase uses init_supabase_db)"""
    db = get_db()
    if db.db_type == 'supabase':
        # Initialize Supabase tables
        db.close()
        init_supabase_db()
        return
    
    # SQLite initialization
    cur = db

    # Messages table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    # Chatbot messages table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chatbot_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    # Visits table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS visits (
            date TEXT PRIMARY KEY,
            count INTEGER NOT NULL
        )
    """)

    # Certificates table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS certificates (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'certificat',
            timestamp TEXT NOT NULL
        )
    """)
    
    # Add type column if it doesn't exist (migration) - SQLite only
    if db.db_type == 'sqlite':
        try:
            cur.execute("ALTER TABLE certificates ADD COLUMN type TEXT DEFAULT 'certificat'")
        except sqlite3.OperationalError:
            pass  # Column already exists

    # Partners table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS partners (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    # Site texts table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS site_texts (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
    """)

    # Admin password table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS admin_password (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
    """)

    # TikTok videos table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tiktok_videos (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            videos TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
    """)

    # Locations table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            data TEXT NOT NULL,
            last_updated TEXT NOT NULL
        )
    """)

    # Reviews table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            author TEXT NOT NULL,
            rating INTEGER NOT NULL,
            text TEXT NOT NULL,
            date TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    # Chatbot responses table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chatbot_responses (
            keyword TEXT PRIMARY KEY,
            response TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    db.commit()
    db.close()

# Initialize database on first import
init_db()

def sync_google_reviews(place_id=None, api_key=None):
    """Sync reviews from Google Places API"""
    if not api_key:
        return {'error': 'Google Places API key este necesar'}
    
    if not place_id:
        place_id = os.environ.get('GOOGLE_PLACE_ID', '')
        if not place_id:
            return {'error': 'Place ID este necesar'}
    
    try:
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
                
                review_date = datetime.fromtimestamp(time).strftime('%Y-%m-%d') if time else datetime.now().strftime('%Y-%m-%d')
                review_id = f"google_{time}_{hash(author_name) % 100000}"
                
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

def handler(request):
    """Main request handler for Vercel serverless function"""
    method = request.get('method', 'GET')
    path = request.get('path', '')
    query = request.get('query', {})
    body = request.get('body', '')
    
    # Parse path
    if path.startswith('/api/'):
        path = path[4:]  # Remove /api/ prefix
    
    # Parse body if present
    data = {}
    if body:
        try:
            data = json.loads(body) if isinstance(body, str) else body
        except:
            pass
    
    # Set CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # GET endpoints
        if method == 'GET':
            # Test endpoint for debugging
            if path == 'test' or path == 'health':
                test_info = {
                    'status': 'ok',
                    'vercel': bool(os.environ.get('VERCEL')),
                    'use_supabase': USE_SUPABASE,
                    'has_supabase_url': bool(SUPABASE_URL),
                    'has_supabase_key': bool(SUPABASE_KEY),
                    'has_supabase_db_url': bool(SUPABASE_DB_URL),
                    'db_type': 'supabase' if USE_SUPABASE else 'sqlite'
                }
                
                # Test database connection
                try:
                    db = get_db()
                    if db.db_type == 'supabase':
                        # Test query
                        cursor = db.execute("SELECT 1 as test")
                        result = cursor.fetchone()
                        test_info['db_connection'] = '✅ Working'
                        test_info['db_test_query'] = '✅ Success'
                    else:
                        # SQLite test
                        cursor = db.execute("SELECT 1 as test")
                        result = cursor.fetchone()
                        test_info['db_connection'] = '✅ Working (SQLite)'
                        test_info['db_test_query'] = '✅ Success'
                    db.close()
                except Exception as e:
                    test_info['db_connection'] = f'❌ Error: {str(e)}'
                    test_info['error'] = str(e)
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(test_info, ensure_ascii=False, indent=2)
                }
            
            if path == 'messages':
                conn = get_db()
                rows = conn.execute("SELECT data FROM messages ORDER BY timestamp DESC").fetchall()
                conn.close()
                messages = [json.loads(row['data']) for row in rows]
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(messages, ensure_ascii=False)
                }
            
            elif path == 'chatbot':
                conn = get_db()
                rows = conn.execute("SELECT data FROM chatbot_messages ORDER BY timestamp DESC LIMIT 50").fetchall()
                conn.close()
                messages = [json.loads(row['data']) for row in rows]
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(messages, ensure_ascii=False)
                }
            
            elif path == 'visits':
                conn = get_db()
                rows = conn.execute("SELECT date, count FROM visits").fetchall()
                conn.close()
                visits = {row['date']: row['count'] for row in rows}
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(visits, ensure_ascii=False)
                }
            
            elif path == 'certificates':
                conn = get_db()
                try:
                    rows = conn.execute("SELECT id, data, type FROM certificates ORDER BY timestamp DESC").fetchall()
                    certificates = []
                    for row in rows:
                        # Handle both dict-like (Supabase) and row-like (SQLite) objects
                        row_data = row['data'] if hasattr(row, '__getitem__') else getattr(row, 'data', '{}')
                        row_type = row.get('type', 'certificat') if hasattr(row, 'get') else (getattr(row, 'type', 'certificat') if hasattr(row, 'type') else 'certificat')
                        cert_data = json.loads(row_data)
                        cert_data['type'] = row_type
                        certificates.append(cert_data)
                except Exception as e:
                    conn.close()
                    return {
                        'statusCode': 500,
                        'headers': headers,
                        'body': json.dumps({'error': f'Database error: {str(e)}'}, ensure_ascii=False)
                    }
                conn.close()
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(certificates, ensure_ascii=False)
                }
            
            elif path == 'partners':
                conn = get_db()
                rows = conn.execute("SELECT data FROM partners ORDER BY timestamp DESC").fetchall()
                conn.close()
                partners = [json.loads(row['data']) for row in rows]
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(partners, ensure_ascii=False)
                }
            
            elif path == 'site-texts':
                conn = get_db()
                row = conn.execute("SELECT data FROM site_texts WHERE id = 1").fetchone()
                conn.close()
                if row:
                    texts = json.loads(row['data'])
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(texts, ensure_ascii=False)
                    }
                else:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({}, ensure_ascii=False)
                    }
            
            elif path == 'admin-password':
                conn = get_db()
                row = conn.execute("SELECT password FROM admin_password WHERE id = 1").fetchone()
                conn.close()
                if row:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'password': row['password']}, ensure_ascii=False)
                    }
                else:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'password': 'admin123'}, ensure_ascii=False)
                    }
            
            elif path == 'tiktok-videos':
                conn = get_db()
                row = conn.execute("SELECT videos FROM tiktok_videos WHERE id = 1").fetchone()
                conn.close()
                if row:
                    videos = json.loads(row['videos'])
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(videos if isinstance(videos, list) else [], ensure_ascii=False)
                    }
                else:
                    default_videos = ['7567003645250702614', '7564125179761167638', '7556587113244937475']
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(default_videos, ensure_ascii=False)
                    }
            
            elif path == 'locations':
                conn = get_db()
                row = conn.execute("SELECT data FROM locations WHERE id = 1").fetchone()
                conn.close()
                if row:
                    locations = json.loads(row['data'])
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps(locations if isinstance(locations, list) else [], ensure_ascii=False)
                    }
                else:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps([], ensure_ascii=False)
                    }
            
            elif path == 'reviews':
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
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(reviews, ensure_ascii=False)
                }
            
            elif path == 'sync-google-reviews':
                api_key = os.environ.get('GOOGLE_PLACES_API_KEY', '')
                place_id = os.environ.get('GOOGLE_PLACE_ID', '')
                result = sync_google_reviews(place_id=place_id, api_key=api_key)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(result, ensure_ascii=False)
                }
            
            elif path == 'chatbot-responses':
                conn = get_db()
                rows = conn.execute("SELECT keyword, response FROM chatbot_responses ORDER BY keyword").fetchall()
                conn.close()
                responses = {row['keyword']: row['response'] for row in rows}
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps(responses, ensure_ascii=False)
                }
            
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Not found'}, ensure_ascii=False)
                }
        
        # POST endpoints
        elif method == 'POST':
            if path == 'messages':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                
                conn = get_db()
                conn.execute(
                    "INSERT INTO messages (id, data, timestamp) VALUES (?, ?, ?)",
                    (data['id'], json.dumps(data, ensure_ascii=False), data['timestamp'])
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'id': data['id']}, ensure_ascii=False)
                }
            
            elif path == 'chatbot':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                
                conn = get_db()
                cursor = conn.execute(
                    "INSERT INTO chatbot_messages (data, timestamp) VALUES (?, ?)",
                    (json.dumps(data, ensure_ascii=False), data['timestamp'])
                )
                message_id = cursor.lastrowid
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'id': message_id}, ensure_ascii=False)
                }
            
            elif path == 'visits':
                today = datetime.now().strftime('%Y-%m-%d')
                conn = get_db()
                row = conn.execute("SELECT count FROM visits WHERE date = ?", (today,)).fetchone()
                new_count = (row['count'] if row else 0) + 1
                conn.execute(
                    "INSERT OR REPLACE INTO visits (date, count) VALUES (?, ?)",
                    (today, new_count)
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'count': new_count}, ensure_ascii=False)
                }
            
            elif path == 'certificates':
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
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'id': data['id']}, ensure_ascii=False)
                }
            
            elif path == 'partners':
                data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                
                conn = get_db()
                conn.execute(
                    "INSERT INTO partners (id, data, timestamp) VALUES (?, ?, ?)",
                    (data['id'], json.dumps(data, ensure_ascii=False), data['timestamp'])
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'id': data['id']}, ensure_ascii=False)
                }
            
            elif path == 'site-texts':
                data['lastUpdated'] = data.get('lastUpdated') or datetime.now().isoformat()
                
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO site_texts (id, data, last_updated) VALUES (1, ?, ?)",
                    (json.dumps(data, ensure_ascii=False), data['lastUpdated'])
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True}, ensure_ascii=False)
                }
            
            elif path == 'admin-password':
                password = data.get('password')
                if not password:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing password field'}, ensure_ascii=False)
                    }
                
                last_updated = datetime.now().isoformat()
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO admin_password (id, password, last_updated) VALUES (1, ?, ?)",
                    (password, last_updated)
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True}, ensure_ascii=False)
                }
            
            elif path == 'tiktok-videos':
                videos = data.get('videos')
                if not isinstance(videos, list):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing or invalid videos array'}, ensure_ascii=False)
                    }
                
                last_updated = datetime.now().isoformat()
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO tiktok_videos (id, videos, last_updated) VALUES (1, ?, ?)",
                    (json.dumps(videos, ensure_ascii=False), last_updated)
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True}, ensure_ascii=False)
                }
            
            elif path == 'locations':
                last_updated = datetime.now().isoformat()
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO locations (id, data, last_updated) VALUES (1, ?, ?)",
                    (json.dumps(data, ensure_ascii=False), last_updated)
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True}, ensure_ascii=False)
                }
            
            elif path == 'reviews':
                author = data.get('author')
                rating = data.get('rating')
                text = data.get('text')
                date = data.get('date')
                
                if not author or not rating or not text or not date:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing required fields'}, ensure_ascii=False)
                    }
                
                review_id = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                timestamp = datetime.now().isoformat()
                
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO reviews (id, author, rating, text, date, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
                    (review_id, author, rating, text, date, timestamp)
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'id': review_id}, ensure_ascii=False)
                }
            
            elif path == 'chatbot-responses':
                keyword = data.get('keyword')
                response_text = data.get('response')
                
                if not keyword or not response_text:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing keyword or response field'}, ensure_ascii=False)
                    }
                
                timestamp = datetime.now().isoformat()
                keyword_lower = keyword.lower().strip()
                
                conn = get_db()
                conn.execute(
                    "INSERT OR REPLACE INTO chatbot_responses (keyword, response, timestamp) VALUES (?, ?, ?)",
                    (keyword_lower, response_text, timestamp)
                )
                conn.commit()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'keyword': keyword_lower}, ensure_ascii=False)
                }
            
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Not found'}, ensure_ascii=False)
                }
        
        # DELETE endpoints
        elif method == 'DELETE':
            if path == 'messages':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM messages")
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                elif 'id' in query:
                    msg_id = query['id'][0]
                    conn.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                else:
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing id or all flag'}, ensure_ascii=False)
                    }
            
            elif path == 'chatbot':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM chatbot_messages")
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                elif 'id' in query:
                    msg_id = query['id'][0]
                    conn.execute("DELETE FROM chatbot_messages WHERE id = ?", (msg_id,))
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                else:
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing id or all flag'}, ensure_ascii=False)
                    }
            
            elif path == 'certificates':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM certificates")
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                elif 'id' in query:
                    cert_id = query['id'][0]
                    conn.execute("DELETE FROM certificates WHERE id = ?", (cert_id,))
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                else:
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing id or all flag'}, ensure_ascii=False)
                    }
            
            elif path == 'partners':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM partners")
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                elif 'id' in query:
                    partner_id = query['id'][0]
                    conn.execute("DELETE FROM partners WHERE id = ?", (partner_id,))
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                else:
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing id or all flag'}, ensure_ascii=False)
                    }
            
            elif path == 'reviews':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM reviews")
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                elif 'keyword' in query:
                    keyword = query['keyword'][0].lower().strip()
                    conn.execute("DELETE FROM chatbot_responses WHERE keyword = ?", (keyword,))
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                elif 'id' in query:
                    review_id = query['id'][0]
                    conn.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                else:
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing id or all flag'}, ensure_ascii=False)
                    }
            
            elif path == 'chatbot-responses':
                conn = get_db()
                if 'all' in query:
                    conn.execute("DELETE FROM chatbot_responses")
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                elif 'keyword' in query:
                    keyword = query['keyword'][0].lower().strip()
                    conn.execute("DELETE FROM chatbot_responses WHERE keyword = ?", (keyword,))
                    conn.commit()
                    conn.close()
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}, ensure_ascii=False)
                    }
                else:
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'Missing keyword or all flag'}, ensure_ascii=False)
                    }
            
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Not found'}, ensure_ascii=False)
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'}, ensure_ascii=False)
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)}, ensure_ascii=False)
        }

# Vercel serverless function entry point
def main(request):
    """Vercel serverless function entry point - handles both request object and dict"""
    try:
        # Handle Vercel Python request format
        if hasattr(request, 'method'):
            # Vercel Python request object
            method = request.method or 'GET'
            url = request.url if hasattr(request, 'url') else '/'
            parsed = urlparse(url)
            path = parsed.path
            
            # Parse query
            query_params = parse_qs(parsed.query) if parsed.query else {}
            query = {k: v[0] if isinstance(v, list) and len(v) == 1 else v for k, v in query_params.items()}
            
            # Get body
            body = ''
            if hasattr(request, 'json') and request.json:
                body = request.json
            elif hasattr(request, 'body'):
                try:
                    body = json.loads(request.body) if isinstance(request.body, str) else request.body
                except:
                    body = request.body if isinstance(request.body, dict) else ''
        else:
            # Dict format (fallback)
            method = request.get('method', 'GET')
            path = request.get('path', '')
            query = request.get('query', {})
            body = request.get('body', '')
        
        # Extract path from URL if needed
        if not path and hasattr(request, 'url'):
            parsed = urlparse(request.url)
            path = parsed.path
        
        # Remove /api/ prefix
        if path.startswith('/api/'):
            path = path[5:]
        elif path.startswith('api/'):
            path = path[4:]
        
        # Handle root path
        if path == '' or path == '/':
            path = 'test'  # Default to test endpoint
        
        return handler({
            'method': method,
            'path': path,
            'query': query,
            'body': body
        })
    except Exception as e:
        # Error response
        import traceback
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__,
            'traceback': traceback.format_exc() if os.environ.get('VERCEL_ENV') != 'production' else 'Hidden in production'
        }
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(error_details, ensure_ascii=False)
        }


