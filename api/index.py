"""
Vercel Python Serverless Function
Handles all API endpoints for Sofimar SERV website
Creates database tables automatically on first run
"""

import json
import os
import sqlite3
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request
import urllib.parse
import base64
import uuid
from pathlib import Path

# OpenAI API Key - can be set via environment variable OPENAI_API_KEY
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')

def cleanup_old_messages(db, cur, days=5):
    """Delete chatbot messages older than specified days"""
    try:
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        sql = "DELETE FROM chatbot_messages WHERE timestamp < %s" if db['type'] == 'neon' else "DELETE FROM chatbot_messages WHERE timestamp < ?"
        cur.execute(sql, (cutoff_date,))
        deleted_count = cur.rowcount if db['type'] == 'neon' else cur.rowcount
        db['conn'].commit()
        if deleted_count > 0:
            print(f"Cleaned up {deleted_count} old chatbot messages (older than {days} days)")
    except Exception as e:
        print(f"Error cleaning up old messages: {str(e)}")
        # Don't raise - cleanup failure shouldn't break the request

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

def commit_image_to_github(image_path, relative_path, image_bytes):
    """
    Commit image to GitHub repository using git commands (local only)
    """
    try:
        import subprocess
        project_root = Path(__file__).parent.parent
        
        # Check if we're in a git repository
        result = subprocess.run(
            ['git', 'rev-parse', '--is-inside-work-tree'],
            cwd=project_root,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print("⚠️ Not in a git repository, skipping commit")
            return False
        
        # Add file to git (use absolute path)
        result = subprocess.run(
            ['git', 'add', str(image_path)],
            cwd=project_root,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ Added {relative_path} to git")
        if result.stdout:
            print(f"Git add output: {result.stdout}")
        if result.stderr:
            print(f"Git add stderr: {result.stderr}")
        
        # Commit with author info
        commit_message = f"Add image: {relative_path}"
        result = subprocess.run(
            ['git', 'commit', '-m', commit_message],
            cwd=project_root,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print(f"✅ Committed {relative_path}")
            if result.stdout:
                print(f"Git commit output: {result.stdout}")
        else:
            # Check if there are changes to commit
            if 'nothing to commit' in result.stdout or 'nothing to commit' in result.stderr:
                print(f"⚠️ Nothing to commit for {relative_path} (file may already be committed)")
            else:
                print(f"⚠️ Git commit failed: {result.stderr}")
                raise subprocess.CalledProcessError(result.returncode, 'git commit', result.stdout + result.stderr)
        
        # Push to GitHub
        result = subprocess.run(
            ['git', 'push', 'origin', 'main'],
            cwd=project_root,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ Pushed {relative_path} to GitHub")
        if result.stdout:
            print(f"Git push output: {result.stdout}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Git command failed: {str(e)}")
        return False
    except Exception as e:
        print(f"⚠️ Error committing to GitHub: {str(e)}")
        return False

def upload_image_to_github_via_api(relative_path, image_bytes):
    """
    Upload image to GitHub using GitHub API (for Vercel/serverless)
    Requires GITHUB_TOKEN environment variable
    """
    try:
        github_token = os.environ.get('GITHUB_TOKEN')
        github_repo = os.environ.get('GITHUB_REPO', 'GeorgeV-creator/Sofimar-SERV')
        
        if not github_token:
            error_msg = "GITHUB_TOKEN not set in Vercel environment variables. Please set it in Vercel Dashboard → Settings → Environment Variables"
            print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        import base64 as b64
        import urllib.request
        import urllib.parse
        import urllib.error
        
        # Encode image to base64 for GitHub API
        print(f"📤 Encoding image for GitHub API upload...")
        image_b64 = b64.b64encode(image_bytes).decode('utf-8')
        print(f"📤 Encoded image size: {len(image_b64)} characters")
        
        # GitHub API endpoint
        url = f"https://api.github.com/repos/{github_repo}/contents/{relative_path}"
        print(f"📤 Uploading to GitHub: {url}")
        
        # Create request data
        data = {
            "message": f"Add image: {relative_path}",
            "content": image_b64,
            "branch": "main"
        }
        
        # Make request
        req = urllib.request.Request(url, method='PUT')
        req.add_header('Authorization', f'token {github_token}')
        req.add_header('Content-Type', 'application/json')
        req.add_header('Accept', 'application/vnd.github.v3+json')
        req.add_header('User-Agent', 'Sofimar-SERV-Image-Uploader')
        
        try:
            with urllib.request.urlopen(req, data=json.dumps(data).encode('utf-8'), timeout=30) as response:
                result = json.loads(response.read().decode('utf-8'))
                uploaded_path = result.get('content', {}).get('path', relative_path)
                print(f"✅ Image uploaded successfully to GitHub: {uploaded_path}")
                print(f"✅ GitHub API response: {result.get('commit', {}).get('message', 'Uploaded')}")
                return True
        except urllib.error.HTTPError as http_error:
            error_body = http_error.read().decode('utf-8') if http_error.fp else 'No error body'
            print(f"❌ GitHub API HTTP Error {http_error.code}: {error_body}")
            if http_error.code == 401:
                raise ValueError("GitHub API authentication failed. Check if GITHUB_TOKEN is valid.")
            elif http_error.code == 403:
                raise ValueError("GitHub API forbidden. Check if token has 'repo' permissions.")
            elif http_error.code == 404:
                raise ValueError(f"GitHub repository not found: {github_repo}")
            else:
                raise ValueError(f"GitHub API error {http_error.code}: {error_body}")
            
    except ValueError as ve:
        # Re-raise ValueError as-is (these are our custom errors)
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error uploading to GitHub via API: {str(e)}"
        print(f"❌ {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")
        raise Exception(error_msg) from e

def save_image_to_folder(image_data, filename=None):
    """
    Save image to images folder or upload directly to GitHub (in Vercel).
    image_data can be:
    - base64 string (data:image/...;base64,...)
    - binary data
    Returns the relative path to the image or None if saving failed
    
    In Vercel, uploads directly to GitHub via API (no filesystem write).
    Locally, saves to folder and commits via git.
    """
    try:
        is_vercel = os.environ.get('VERCEL')
        
        # Decode image data first
        if isinstance(image_data, str):
            if image_data.startswith('data:image/'):
                # Extract base64 data from data URI
                if ',' not in image_data:
                    raise ValueError("Invalid base64 data URI format - missing comma")
                header, encoded = image_data.split(',', 1)
                print(f"📝 Decoding base64 image, header: {header[:50]}...")
                image_bytes = base64.b64decode(encoded)
                print(f"📝 Decoded image size: {len(image_bytes)} bytes")
                
                # Extract extension from header
                if not filename:
                    format_match = image_data.split(';')[0].split('/')[-1]
                    ext = format_match if format_match in ['jpg', 'jpeg', 'png', 'gif', 'webp'] else 'jpg'
                    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{ext}"
            else:
                # Assume it's already base64 without data URI
                print(f"📝 Decoding base64 string (no data URI)")
                image_bytes = base64.b64decode(image_data)
                print(f"📝 Decoded image size: {len(image_bytes)} bytes")
                if not filename:
                    filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"
        else:
            # Assume it's already binary
            image_bytes = image_data
            print(f"📝 Using binary data, size: {len(image_bytes)} bytes")
            if not filename:
                filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.jpg"
        
        relative_path = f"images/{filename}"
        
        if is_vercel:
            # Vercel environment - upload directly to GitHub via API
            print("🔄 Vercel environment detected - uploading directly to GitHub via API...")
            try:
                upload_image_to_github_via_api(relative_path, image_bytes)
                print(f"✅ Image uploaded to GitHub: {relative_path}")
                return relative_path
            except ValueError as ve:
                # Custom error messages (token missing, auth failed, etc.)
                error_msg = str(ve)
                print(f"❌ {error_msg}")
                raise Exception(error_msg) from ve
            except Exception as upload_error:
                import traceback
                error_msg = f"Error uploading to GitHub via API: {str(upload_error)}"
                print(f"❌ {error_msg}")
                print(f"Traceback: {traceback.format_exc()}")
                raise Exception(error_msg) from upload_error
        else:
            # Local development - save to folder and commit via git
            project_root = Path(__file__).parent.parent
            images_folder = project_root / 'images'
            image_path = images_folder / filename
            
            print(f"📁 Project root: {project_root}")
            print(f"📁 Images folder path: {images_folder}")
            
            # Create images folder if it doesn't exist
            try:
                images_folder.mkdir(exist_ok=True, mode=0o755)
                print(f"✅ Images folder created/verified: {images_folder}")
            except Exception as mkdir_error:
                print(f"❌ Error creating images folder: {str(mkdir_error)}")
                raise
            
            # Check if folder is writable
            if not os.access(images_folder, os.W_OK):
                print(f"❌ Images folder is not writable: {images_folder}")
                raise PermissionError(f"Images folder is not writable: {images_folder}")
            
            print(f"📝 Saving image to: {image_path}")
            
            # Write to file
            try:
                with open(image_path, 'wb') as f:
                    f.write(image_bytes)
                print(f"✅ Image file written successfully: {image_path}")
            except Exception as write_error:
                print(f"❌ Error writing image file: {str(write_error)}")
                raise
            
            # Verify file was created
            if not image_path.exists():
                raise FileNotFoundError(f"Image file was not created: {image_path}")
            
            file_size = image_path.stat().st_size
            print(f"✅ Image file verified: {image_path} ({file_size} bytes)")
            print(f"✅ Image saved successfully to: {relative_path}")
            
            # Try to commit to GitHub
            print("🔄 Attempting to commit image to GitHub using git...")
            try:
                success = commit_image_to_github(image_path, relative_path, image_bytes)
                if not success:
                    print(f"⚠️ Git commit failed, but image saved locally at: {image_path}")
            except Exception as commit_error:
                import traceback
                print(f"⚠️ Could not commit image to GitHub: {str(commit_error)}")
                print(f"Traceback: {traceback.format_exc()}")
                print(f"⚠️ Image saved locally at: {image_path}")
                print(f"⚠️ You may need to commit manually: git add {relative_path} && git commit -m 'Add image' && git push")
            
            return relative_path
        
    except Exception as e:
        import traceback
        error_msg = f"Error saving image: {str(e)}"
        print(f"❌ {error_msg}")
        print(f"Traceback: {traceback.format_exc()}")
        return None

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
            
            elif path == 'chatbot' or path == 'chatbot-messages':
                # Get chatbot messages
                try:
                    db = get_db_connection()
                    cur = get_cursor(db)
                    
                    # Clean up messages older than 5 days
                    cleanup_old_messages(db, cur, days=5)
                    
                    cur.execute("SELECT id, data, timestamp FROM chatbot_messages ORDER BY timestamp ASC")
                    rows = cur.fetchall()
                    messages = []
                    for row in rows:
                        row_dict = dict(row) if db['type'] == 'neon' else row
                        msg_data = json.loads(row_dict['data']) if isinstance(row_dict['data'], str) else row_dict['data']
                        msg_data['id'] = row_dict['id']
                        messages.append(msg_data)
                    db['conn'].close()
                    return 200, headers, json.dumps(messages, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    error_msg = str(e)
                    print(f"Error in GET /chatbot: {error_msg}")
                    print(f"Traceback: {traceback.format_exc()}")
                    return 500, headers, json.dumps({'error': error_msg}, ensure_ascii=False)
            
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
                    
                    # Store image as base64 in database (original behavior)
                    image_data = data.get('image', '')
                    if image_data:
                        # Keep image as base64 in database
                        print(f"✅ Certificate image will be stored as base64 in database (length: {len(image_data)} chars)")
                    else:
                        print(f"⚠️ No image provided for certificate")
                    
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
                    # Extract locations array from data (admin.js sends { locations: [...] })
                    locations = data.get('locations') if isinstance(data, dict) and 'locations' in data else data
                    if not isinstance(locations, list):
                        locations = []
                    
                    db = get_db_connection()
                    cur = get_cursor(db)
                    last_updated = datetime.now().isoformat()
                    sql = "INSERT INTO locations (id, data, last_updated) VALUES (1, %s, %s) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, last_updated = EXCLUDED.last_updated" if db['type'] == 'neon' else "INSERT OR REPLACE INTO locations (id, data, last_updated) VALUES (1, ?, ?)"
                    locations_json = json.dumps(locations, ensure_ascii=False)
                    if db['type'] == 'neon':
                        cur.execute(sql, (locations_json, last_updated))
                    else:
                        cur.execute(sql, (locations_json, last_updated))
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
                    
                    # Store image as base64 in database (original behavior)
                    image_data = data.get('image', '')
                    if image_data:
                        # Keep image as base64 in database
                        print(f"✅ Partner image will be stored as base64 in database (length: {len(image_data)} chars)")
                    else:
                        print(f"⚠️ No image provided for partner")
                    
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
            
            elif path == 'chatbot-responses':
                try:
                    keyword = data.get('keyword', '').strip().lower()
                    response_text = data.get('response', '').strip()
                    
                    if not keyword or not response_text:
                        return 400, headers, json.dumps({'error': 'Missing keyword or response'}, ensure_ascii=False)
                    
                    db = get_db_connection()
                    cur = get_cursor(db)
                    timestamp = datetime.now().isoformat()
                    
                    # Insert or update chatbot response
                    sql = "INSERT INTO chatbot_responses (keyword, response, timestamp) VALUES (%s, %s, %s) ON CONFLICT (keyword) DO UPDATE SET response = EXCLUDED.response, timestamp = EXCLUDED.timestamp" if db['type'] == 'neon' else "INSERT OR REPLACE INTO chatbot_responses (keyword, response, timestamp) VALUES (?, ?, ?)"
                    
                    if db['type'] == 'neon':
                        cur.execute(sql, (keyword, response_text, timestamp))
                    else:
                        cur.execute(sql, (keyword, response_text, timestamp))
                    
                    db['conn'].commit()
                    db['conn'].close()
                    return 200, headers, json.dumps({'success': True, 'keyword': keyword}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    error_msg = str(e)
                    traceback_str = traceback.format_exc()
                    print(f"❌ Error in POST /chatbot-responses: {error_msg}")
                    print(f"Traceback: {traceback_str}")
                    return 500, headers, json.dumps({'error': error_msg, 'success': False}, ensure_ascii=False)
            
            elif path == 'chatbot' or path == 'chatbot-messages':
                # Save chatbot message (user or bot)
                try:
                    message_type = data.get('type', 'user')
                    message_text = data.get('message', '')
                    timestamp = data.get('timestamp') or datetime.now().isoformat()
                    
                    if not message_text:
                        return 400, headers, json.dumps({'error': 'Missing message'}, ensure_ascii=False)
                    
                    db = get_db_connection()
                    cur = get_cursor(db)
                    
                    message_data = {
                        'type': message_type,
                        'message': message_text,
                        'timestamp': timestamp
                    }
                    message_json = json.dumps(message_data, ensure_ascii=False)
                    
                    sql = "INSERT INTO chatbot_messages (data, timestamp) VALUES (%s, %s)" if db['type'] == 'neon' else "INSERT INTO chatbot_messages (data, timestamp) VALUES (?, ?)"
                    cur.execute(sql, (message_json, timestamp))
                    db['conn'].commit()
                    db['conn'].close()
                    
                    return 200, headers, json.dumps({'success': True}, ensure_ascii=False)
                except Exception as e:
                    import traceback
                    error_msg = str(e)
                    print(f"Error in POST /chatbot: {error_msg}")
                    print(f"Traceback: {traceback.format_exc()}")
                    return 500, headers, json.dumps({'error': error_msg, 'success': False}, ensure_ascii=False)
            
            elif path == 'chatbot-ai':
                # AI-powered chatbot response generation
                try:
                    user_message = data.get('message', '').strip()
                    
                    if not user_message:
                        return 400, headers, json.dumps({'error': 'Missing message'}, ensure_ascii=False)
                    
                    if not OPENAI_API_KEY:
                        # Fallback to keyword-based responses if OpenAI key is not configured
                        db = get_db_connection()
                        cur = get_cursor(db)
                        cur.execute("SELECT keyword, response FROM chatbot_responses ORDER BY keyword")
                        rows = cur.fetchall()
                        responses = {}
                        for row in rows:
                            row_dict = dict(row) if db['type'] == 'neon' else row
                            responses[row_dict['keyword']] = row_dict['response']
                        db['conn'].close()
                        
                        message_lower = user_message.lower()
                        for keyword, response in responses.items():
                            if keyword != 'default' and keyword in message_lower:
                                return 200, headers, json.dumps({'response': response}, ensure_ascii=False)
                        
                        default_response = responses.get('default', 'Vă mulțumim pentru întrebare! Pentru informații detaliate despre serviciile noastre de deratizare, dezinsecție sau dezinfecție, vă rugăm să ne contactați direct. Oferim consultație gratuită și intervenție rapidă în 24 de ore pentru probleme urgente.')
                        return 200, headers, json.dumps({'response': default_response}, ensure_ascii=False)
                    
                    # Use OpenAI API
                    try:
                        from openai import OpenAI
                        
                        client = OpenAI(api_key=OPENAI_API_KEY)
                        
                        # Get conversation history (last 10 messages)
                        db = get_db_connection()
                        cur = get_cursor(db)
                        cur.execute("SELECT data, timestamp FROM chatbot_messages ORDER BY timestamp DESC LIMIT 10")
                        rows = cur.fetchall()
                        db['conn'].close()
                        
                        messages = [
                            {
                                "role": "system",
                                "content": "Ești un asistent virtual pentru Sofimar SERV, o companie care oferă servicii profesionale de deratizare, dezinsecție și dezinfecție în România. Răspunde întotdeauna în română. Fii prietenos, profesional și concis. Dacă nu știi ceva, îndrumă utilizatorul să contacteze compania direct pentru consultație gratuită."
                            }
                        ]
                        
                        db_type = db['type']
                        for row in reversed(rows):
                            row_dict = dict(row) if db_type == 'neon' else row
                            msg_data = json.loads(row_dict['data']) if isinstance(row_dict['data'], str) else row_dict['data']
                            role = 'user' if msg_data.get('type') == 'user' else 'assistant'
                            content = msg_data.get('message', '')
                            if content:
                                messages.append({"role": role, "content": content})
                        
                        messages.append({"role": "user", "content": user_message})
                        
                        response = client.chat.completions.create(
                            model="gpt-3.5-turbo",
                            messages=messages,
                            max_tokens=300,
                            temperature=0.7
                        )
                        
                        ai_response = response.choices[0].message.content.strip()
                        return 200, headers, json.dumps({'response': ai_response}, ensure_ascii=False)
                    
                    except ImportError:
                        return 500, headers, json.dumps({'error': 'OpenAI library not installed'}, ensure_ascii=False)
                    except Exception as e:
                        import traceback
                        error_msg = str(e)
                        print(f"Error calling OpenAI API: {error_msg}")
                        print(f"Traceback: {traceback.format_exc()}")
                        
                        db = get_db_connection()
                        cur = get_cursor(db)
                        cur.execute("SELECT keyword, response FROM chatbot_responses WHERE keyword = 'default' LIMIT 1")
                        row = cur.fetchone()
                        db['conn'].close()
                        
                        if row:
                            row_dict = dict(row) if db['type'] == 'neon' else row
                            fallback = row_dict['response']
                        else:
                            fallback = 'Ne pare rău, am întâmpinat o eroare. Vă rugăm să ne contactați direct pentru mai multe informații.'
                        
                        return 200, headers, json.dumps({'response': fallback}, ensure_ascii=False)
                
                except Exception as e:
                    import traceback
                    error_msg = str(e)
                    print(f"Error in POST /chatbot-ai: {error_msg}")
                    print(f"Traceback: {traceback.format_exc()}")
                    return 500, headers, json.dumps({'error': error_msg}, ensure_ascii=False)
            
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
