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
# Try multiple environment variable names (Neon integration might use different names)
NEON_DB_URL = (
    os.environ.get('NEON_DB_URL') or 
    os.environ.get('DATABASE_URL') or 
    os.environ.get('POSTGRES_URL') or 
    os.environ.get('POSTGRES_PRISMA_URL') or 
    os.environ.get('POSTGRES_URL_NON_POOLING') or
    ''
)
USE_NEON = bool(NEON_DB_URL)
DB_FILE = '/tmp/site.db' if os.environ.get('VERCEL') else 'site.db'

def get_db_connection():
    """Get database connection - Neon PostgreSQL or SQLite fallback"""
    print(f"get_db_connection called: USE_NEON={USE_NEON}, has_db_url={bool(NEON_DB_URL)}")
    
    if USE_NEON and NEON_DB_URL:
        try:
            import psycopg2
            from psycopg2.extras import RealDictCursor
            
            print(f"Attempting Neon database connection...")
            
            # Neon uses standard PostgreSQL connection string
            # It supports IPv4 natively, no special handling needed
            conn = psycopg2.connect(NEON_DB_URL, connect_timeout=10)
            
            print("✅ Neon connection successful!")
            # RealDictCursor is a class, not an instance
            return {'conn': conn, 'type': 'neon', 'cursor_factory': RealDictCursor, 'is_neon': True}
        except Exception as e:
            import traceback
            error_msg = str(e)
            print(f"❌ Neon connection error: {error_msg}")
            print(f"Traceback: {traceback.format_exc()}")
            # Fall through to SQLite
    else:
        print(f"⚠️ Not using Neon: USE_NEON={USE_NEON}, NEON_DB_URL={bool(NEON_DB_URL)}")
    
    print("Using SQLite database (fallback)")
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return {'conn': conn, 'type': 'sqlite', 'cursor_factory': None, 'is_neon': False}

def get_cursor(db):
    """Get cursor from database connection, handling both Neon PostgreSQL and SQLite"""
    if db.get('is_neon') or db['type'] == 'neon':
        return db['conn'].cursor(cursor_factory=db['cursor_factory'])
    else:
        return db['conn'].cursor()

def handle_api_request(path, method, query, body_data):
    """Handle API request and return response"""
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    try:
        if method == 'OPTIONS':
            return 200, headers, ''
        
        # Log original path for debugging
        original_path = path
        
        # In Vercel, path can be either:
        # 1. /api/test (full path) - remove /api/ prefix
        # 2. /test (without /api/) - Vercel already stripped /api/
        # 3. test (no leading slash) - already processed
        
        # Remove /api/ prefix if present
        if path.startswith('/api/'):
            path = path[5:]  # Remove '/api/'
        elif path.startswith('api/'):
            path = path[4:]  # Remove 'api/'
        elif path == '/api' or path == '/api/':
            path = ''
        
        # Remove leading slash if present (handles /test -> test)
        if path.startswith('/'):
            path = path[1:]
        
        # Debug logging - enable in production too for troubleshooting
        print(f"API Request: method={method}, original_path={original_path}, processed_path='{path}'")
        
        # GET endpoints
        if method == 'GET':
            # Handle root /api/ or empty path
            if path == '' or path == '/':
                return 200, headers, json.dumps({
                    'status': 'ok',
                    'message': 'API is working. Use /api/test, /api/messages, etc.',
                    'use_neon': USE_NEON,
                    'db_type': 'neon' if USE_NEON else 'sqlite'
                }, ensure_ascii=False)
            
            if path == 'test' or path == 'health':
                # Test database connection
                db_status = {'connected': False, 'error': None, 'type': None}
                try:
                    db = get_db_connection()
                    db_status['type'] = db['type']  # Set type before testing
                    print(f"Testing connection to: {db['type']}")
                    # Try a simple query
                    cur = get_cursor(db)
                    cur.execute("SELECT 1 as test")
                    cur.fetchone()
                    db['conn'].close()
                    db_status['connected'] = True
                except Exception as e:
                    error_msg = str(e)
                    db_status['error'] = error_msg
                    print(f"Database connection error: {error_msg}")
                
                return 200, headers, json.dumps({
                    'status': 'ok',
                    'use_neon': USE_NEON,
                    'db_type': 'neon' if USE_NEON else 'sqlite',
                    'has_neon_db_url': bool(NEON_DB_URL),
                    'database': db_status
                }, ensure_ascii=False)
            
            elif path == 'messages':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT data FROM messages ORDER BY timestamp DESC")
                rows = cur.fetchall()
                messages = [json.loads(dict(row)['data'] if db['type'] == 'neon' else row['data']) for row in rows]
                db['conn'].close()
                return 200, headers, json.dumps(messages, ensure_ascii=False)
            
            elif path == 'certificates':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT id, data, type FROM certificates ORDER BY timestamp DESC")
                rows = cur.fetchall()
                certificates = []
                for row in rows:
                    row_dict = dict(row) if db['type'] == 'neon' else row
                    cert_data = json.loads(row_dict['data'])
                    cert_data['type'] = row_dict.get('type', 'certificat')
                    certificates.append(cert_data)
                db['conn'].close()
                return 200, headers, json.dumps(certificates, ensure_ascii=False)
            
            elif path == 'partners':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT data FROM partners ORDER BY timestamp DESC")
                rows = cur.fetchall()
                partners = [json.loads(dict(row)['data'] if db['type'] == 'neon' else row['data']) for row in rows]
                db['conn'].close()
                return 200, headers, json.dumps(partners, ensure_ascii=False)
            
            elif path == 'tiktok-videos':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT videos FROM tiktok_videos WHERE id = 1")
                row = cur.fetchone()
                if row:
                    row_dict = dict(row) if db['type'] == 'neon' else row
                    videos = json.loads(row_dict['videos']) if isinstance(row_dict['videos'], str) else row_dict['videos']
                    db['conn'].close()
                    return 200, headers, json.dumps(videos if isinstance(videos, list) else [], ensure_ascii=False)
                db['conn'].close()
                default_videos = ['7567003645250702614', '7564125179761167638', '7556587113244937475']
                return 200, headers, json.dumps(default_videos, ensure_ascii=False)
            
            elif path == 'locations':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT data FROM locations WHERE id = 1")
                row = cur.fetchone()
                if row:
                    row_dict = dict(row) if db['type'] == 'neon' else row
                    locations = json.loads(row_dict['data']) if isinstance(row_dict['data'], str) else row_dict['data']
                    db['conn'].close()
                    return 200, headers, json.dumps(locations if isinstance(locations, list) else [], ensure_ascii=False)
                db['conn'].close()
                return 200, headers, json.dumps([], ensure_ascii=False)
            
            elif path == 'reviews':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT id, author, rating, text, date FROM reviews ORDER BY timestamp DESC")
                rows = cur.fetchall()
                reviews = [dict(row) if db['type'] == 'neon' else {k: row[k] for k in row.keys()} for row in rows]
                db['conn'].close()
                return 200, headers, json.dumps(reviews, ensure_ascii=False)
            
            elif path == 'chatbot-responses':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT keyword, response FROM chatbot_responses ORDER BY keyword")
                rows = cur.fetchall()
                responses = {}
                for row in rows:
                    row_dict = dict(row) if db['type'] == 'neon' else row
                    responses[row_dict['keyword']] = row_dict['response']
                db['conn'].close()
                return 200, headers, json.dumps(responses, ensure_ascii=False)
            
            elif path == 'site-texts':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT texts FROM site_texts WHERE id = 1")
                row = cur.fetchone()
                if row:
                    row_dict = dict(row) if db['type'] == 'neon' else row
                    texts = json.loads(row_dict['texts']) if isinstance(row_dict['texts'], str) else row_dict['texts']
                    db['conn'].close()
                    return 200, headers, json.dumps(texts if isinstance(texts, dict) else {}, ensure_ascii=False)
                db['conn'].close()
                return 200, headers, json.dumps({}, ensure_ascii=False)
            
            elif path == 'admin-password':
                db = get_db_connection()
                cur = get_cursor(db)
                cur.execute("SELECT password FROM admin_password WHERE id = 1")
                row = cur.fetchone()
                password = dict(row)['password'] if row and db['type'] == 'neon' else (row['password'] if row else 'admin123')
                db['conn'].close()
                return 200, headers, json.dumps({'password': password}, ensure_ascii=False)
            
            else:
                return 404, headers, json.dumps({'error': 'Not found'}, ensure_ascii=False)
        
        # POST endpoints
        elif method == 'POST':
            if not body_data:
                return 400, headers, json.dumps({'error': 'No body data'}, ensure_ascii=False)
            
            try:
                data = body_data if isinstance(body_data, dict) else json.loads(body_data) if isinstance(body_data, str) else {}
            except json.JSONDecodeError as e:
                return 400, headers, json.dumps({'error': f'Invalid JSON: {str(e)}'}, ensure_ascii=False)
            
            if path == 'messages':
                try:
                    data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                    data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                    
                    db = get_db_connection()
                    cur = get_cursor(db)
                    sql = "INSERT INTO messages (id, data, timestamp) VALUES (%s, %s, %s)" if db['type'] == 'neon' else "INSERT INTO messages (id, data, timestamp) VALUES (?, ?, ?)"
                    cur.execute(sql, (data['id'], json.dumps(data, ensure_ascii=False), data['timestamp']))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True, 'id': data['id']}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in POST /messages: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'certificates':
                try:
                    data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                    data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                    cert_type = data.get('type', 'certificat')
                    
                    print(f"📝 POST /certificates: Saving certificate id={data['id']}, type={cert_type}, title={data.get('title', 'N/A')}")
                    
                    db = get_db_connection()
                    print(f"📊 Database connection: type={db['type']}, is_neon={db.get('is_neon', False)}")
                    
                    cur = get_cursor(db)
                    data_json = json.dumps(data, ensure_ascii=False)
                    
                    if db['type'] == 'neon':
                        sql = "INSERT INTO certificates (id, data, type, timestamp) VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, type = EXCLUDED.type, timestamp = EXCLUDED.timestamp"
                        print(f"📊 Executing PostgreSQL INSERT with ON CONFLICT...")
                        cur.execute(sql, (data['id'], data_json, cert_type, data['timestamp']))
                    else:
                        sql = "INSERT OR REPLACE INTO certificates (id, data, type, timestamp) VALUES (?, ?, ?, ?)"
                        print(f"📊 Executing SQLite INSERT OR REPLACE...")
                        cur.execute(sql, (data['id'], data_json, cert_type, data['timestamp']))
                    
                    db['conn'].commit()
                    print(f"✅ Certificate saved successfully")
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True, 'id': data['id']}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    error_msg = str(e)
                    traceback_str = traceback.format_exc()
                    print(f"❌ Error in POST /certificates: {error_msg}")
                    print(f"Traceback: {traceback_str}")
                    # Return error response instead of raising to show user
                    return 500, headers, json.dumps({'error': error_msg, 'success': False}, ensure_ascii=False)
            
            elif path == 'tiktok-videos':
                try:
                    videos = data.get('videos', [])
                    if not isinstance(videos, list):
                        return 400, headers, json.dumps({'error': 'Invalid videos'}, ensure_ascii=False)
                    
                    db = get_db_connection()
                    cur = get_cursor(db)
                    last_updated = datetime.now().isoformat()
                    sql = "INSERT INTO tiktok_videos (id, videos, last_updated) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET videos = %s, last_updated = %s" if db['type'] == 'neon' else "INSERT OR REPLACE INTO tiktok_videos (id, videos, last_updated) VALUES (1, ?, ?)"
                    videos_json = json.dumps(videos, ensure_ascii=False)
                    if db['type'] == 'neon':
                        cur.execute(sql, (videos_json, last_updated, videos_json, last_updated))
                    else:
                        cur.execute(sql, (videos_json, last_updated))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in POST /tiktok-videos: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'locations':
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    last_updated = datetime.now().isoformat()
                    sql = "INSERT INTO locations (id, data, last_updated) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET data = %s, last_updated = %s" if db['type'] == 'neon' else "INSERT OR REPLACE INTO locations (id, data, last_updated) VALUES (1, ?, ?)"
                    data_json = json.dumps(data, ensure_ascii=False)
                    if db['type'] == 'neon':
                        cur.execute(sql, (data_json, last_updated, data_json, last_updated))
                    else:
                        cur.execute(sql, (data_json, last_updated))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in POST /locations: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'partners':
                try:
                    data['timestamp'] = data.get('timestamp') or datetime.now().isoformat()
                    data['id'] = data.get('id') or datetime.now().strftime('%Y%m%d%H%M%S%f')
                    
                    db = get_db_connection()
                    cur = get_cursor(db)
                    sql = "INSERT INTO partners (id, data, timestamp) VALUES (%s, %s, %s)" if db['type'] == 'neon' else "INSERT INTO partners (id, data, timestamp) VALUES (?, ?, ?)"
                    cur.execute(sql, (data['id'], json.dumps(data, ensure_ascii=False), data['timestamp']))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True, 'id': data['id']}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in POST /partners: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'site-texts':
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    last_updated = datetime.now().isoformat()
                    texts_json = json.dumps(data, ensure_ascii=False)
                    sql = "INSERT INTO site_texts (id, texts, last_updated) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET texts = EXCLUDED.texts, last_updated = EXCLUDED.last_updated" if db['type'] == 'neon' else "INSERT OR REPLACE INTO site_texts (id, texts, last_updated) VALUES (1, ?, ?)"
                    if db['type'] == 'neon':
                        cur.execute(sql, (texts_json, last_updated))
                    else:
                        cur.execute(sql, (texts_json, last_updated))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in POST /site-texts: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'admin-password':
                password = data.get('password')
                if not password:
                    return 400, headers, json.dumps({'error': 'Missing password'}, ensure_ascii=False)
                
                db = get_db_connection()
                cur = get_cursor(db)
                last_updated = datetime.now().isoformat()
                sql = "INSERT INTO admin_password (id, password, last_updated) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET password = %s, last_updated = %s" if db['type'] == 'neon' else "INSERT OR REPLACE INTO admin_password (id, password, last_updated) VALUES (1, ?, ?)"
                if db['type'] == 'neon':
                    cur.execute(sql, (password, last_updated, password, last_updated))
                else:
                    cur.execute(sql, (password, last_updated))
                db['conn'].commit()
                db['conn'].close()
                return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
            
            else:
                return 404, headers, json.dumps({'error': 'Not found'}, ensure_ascii=False)
        
        # DELETE endpoints
        elif method == 'DELETE':
            # Check for 'all' parameter first (for clearing all items)
            if query.get('all') == '1':
                if path == 'messages':
                    try:
                        db = get_db_connection()
                        cur = get_cursor(db)
                        cur.execute("DELETE FROM messages")
                        db['conn'].commit()
                        db['conn'].close()
                        return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                    except Exception as e:
                        import traceback
                        print(f"Error in DELETE /messages?all=1: {str(e)}")
                        print(f"Traceback: {traceback.format_exc()}")
                        raise
                
                elif path == 'chatbot' or path == 'chatbot-messages':
                    try:
                        db = get_db_connection()
                        cur = get_cursor(db)
                        cur.execute("DELETE FROM chatbot_messages")
                        db['conn'].commit()
                        db['conn'].close()
                        return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                    except Exception as e:
                        import traceback
                        print(f"Error in DELETE /chatbot?all=1: {str(e)}")
                        print(f"Traceback: {traceback.format_exc()}")
                        raise
            
            # Get ID from query parameter for individual deletion
            item_id = query.get('id')
            if not item_id:
                return 400, headers, json.dumps({'error': 'Missing id parameter'}, ensure_ascii=False)
            
            if path == 'messages':
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    sql = "DELETE FROM messages WHERE id = %s" if db['type'] == 'neon' else "DELETE FROM messages WHERE id = ?"
                    cur.execute(sql, (item_id,))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in DELETE /messages: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'certificates':
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    sql = "DELETE FROM certificates WHERE id = %s" if db['type'] == 'neon' else "DELETE FROM certificates WHERE id = ?"
                    cur.execute(sql, (item_id,))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in DELETE /certificates: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'partners':
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    sql = "DELETE FROM partners WHERE id = %s" if db['type'] == 'neon' else "DELETE FROM partners WHERE id = ?"
                    cur.execute(sql, (item_id,))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in DELETE /partners: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'reviews':
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    sql = "DELETE FROM reviews WHERE id = %s" if db['type'] == 'neon' else "DELETE FROM reviews WHERE id = ?"
                    cur.execute(sql, (item_id,))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in DELETE /reviews: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'chatbot' or path == 'chatbot-messages':
                # For chatbot-messages, 'id' is the message ID (integer)
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    sql = "DELETE FROM chatbot_messages WHERE id = %s" if db['type'] == 'neon' else "DELETE FROM chatbot_messages WHERE id = ?"
                    # Convert id to int if possible, otherwise use as string
                    try:
                        msg_id = int(item_id)
                    except ValueError:
                        msg_id = item_id
                    cur.execute(sql, (msg_id,))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in DELETE /chatbot: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
            elif path == 'chatbot-responses':
                # For chatbot-responses, 'id' is actually the keyword
                keyword = item_id
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    sql = "DELETE FROM chatbot_responses WHERE keyword = %s" if db['type'] == 'neon' else "DELETE FROM chatbot_responses WHERE keyword = ?"
                    cur.execute(sql, (keyword,))
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    print(f"Error in DELETE /chatbot-responses: {str(e)}")
                    print(f"Traceback: {traceback.format_exc()}")
                    raise
            
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
            # Parse path - Vercel passes the full path including /api/
            raw_path = self.path
            parsed_url = urlparse(raw_path)
            path = parsed_url.path
            
            # Log for debugging - enable in production too
            print(f"Handler received: raw_path={raw_path}, parsed_path={path}, method={method}")
            
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
