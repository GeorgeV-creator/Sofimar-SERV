#!/usr/bin/env python3
"""
Simple API server for handling contact messages and chatbot messages.
Saves data to JSON files for persistence.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
from datetime import datetime
import cgi
# File paths
MESSAGES_FILE = 'messages.json'
CHATBOT_FILE = 'chatbot_messages.json'
VISITS_FILE = 'visits.json'
CERTIFICATES_FILE = 'certificates.json'

# Ensure files exist
if not os.path.exists(MESSAGES_FILE):
    with open(MESSAGES_FILE, 'w') as f:
        json.dump([], f)

if not os.path.exists(CHATBOT_FILE):
    with open(CHATBOT_FILE, 'w') as f:
        json.dump([], f)

if not os.path.exists(VISITS_FILE):
    with open(VISITS_FILE, 'w') as f:
        json.dump({}, f)

if not os.path.exists(CERTIFICATES_FILE):
    with open(CERTIFICATES_FILE, 'w') as f:
        json.dump([], f)


class APIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        if path == '/api/messages':
            # Return all contact messages
            with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
                messages = json.load(f)
            self.wfile.write(json.dumps(messages).encode('utf-8'))

        elif path == '/api/chatbot':
            # Return all chatbot messages
            with open(CHATBOT_FILE, 'r', encoding='utf-8') as f:
                messages = json.load(f)
            self.wfile.write(json.dumps(messages).encode('utf-8'))

        elif path == '/api/visits':
            # Return all visits
            with open(VISITS_FILE, 'r', encoding='utf-8') as f:
                visits = json.load(f)
            self.wfile.write(json.dumps(visits).encode('utf-8'))

        elif path == '/api/certificates':
            # Return all certificates
            with open(CERTIFICATES_FILE, 'r', encoding='utf-8') as f:
                certificates = json.load(f)
            self.wfile.write(json.dumps(certificates).encode('utf-8'))

        else:
            self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))

    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        if path == '/api/messages':
            # Save contact message
            try:
                data = json.loads(post_data.decode('utf-8'))
                data['timestamp'] = datetime.now().isoformat()
                data['id'] = datetime.now().strftime('%Y%m%d%H%M%S%f')

                # Read existing messages
                with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
                    messages = json.load(f)

                # Add new message
                messages.append(data)

                # Save back to file
                with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(messages, f, ensure_ascii=False, indent=2)

                self.wfile.write(json.dumps({'success': True, 'id': data['id']}).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        elif path == '/api/chatbot':
            # Save chatbot message
            try:
                data = json.loads(post_data.decode('utf-8'))
                data['timestamp'] = datetime.now().isoformat()

                # Read existing messages
                with open(CHATBOT_FILE, 'r', encoding='utf-8') as f:
                    messages = json.load(f)

                # Add new message
                messages.append(data)

                # Save back to file
                with open(CHATBOT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(messages, f, ensure_ascii=False, indent=2)

                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        elif path == '/api/visits':
            # Save or update visit
            try:
                data = json.loads(post_data.decode('utf-8'))
                date = data.get('date')
                
                if not date:
                    self.wfile.write(json.dumps({'error': 'Missing date field'}).encode('utf-8'))
                    return
                
                # Read existing visits
                with open(VISITS_FILE, 'r', encoding='utf-8') as f:
                    visits = json.load(f)
                
                # Increment visit count for this date
                visits[date] = visits.get(date, 0) + 1
                
                # Save back to file
                with open(VISITS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(visits, f, ensure_ascii=False, indent=2)
                
                self.wfile.write(json.dumps({'success': True, 'count': visits[date]}).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        elif path == '/api/certificates':
            # Save certificate
            try:
                data = json.loads(post_data.decode('utf-8'))
                data['timestamp'] = datetime.now().isoformat()
                data['id'] = datetime.now().strftime('%Y%m%d%H%M%S%f')

                # Read existing certificates
                with open(CERTIFICATES_FILE, 'r', encoding='utf-8') as f:
                    certificates = json.load(f)

                # Add new certificate
                certificates.append(data)

                # Save back to file
                with open(CERTIFICATES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(certificates, f, ensure_ascii=False, indent=2)

                self.wfile.write(json.dumps({'success': True, 'id': data['id']}).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))

        else:
            self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))

    def do_DELETE(self):
        """Handle DELETE requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query = parse_qs(parsed_path.query)

        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        if path == '/api/messages':
            # Delete all messages or specific message
            if 'all' in query:
                with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
                    json.dump([], f)
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            elif 'id' in query:
                message_id = query['id'][0]
                with open(MESSAGES_FILE, 'r', encoding='utf-8') as f:
                    messages = json.load(f)
                messages = [m for m in messages if m.get('id') != message_id]
                with open(MESSAGES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(messages, f, ensure_ascii=False, indent=2)
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))

        elif path == '/api/chatbot':
            # Delete all chatbot messages
            if 'all' in query:
                with open(CHATBOT_FILE, 'w', encoding='utf-8') as f:
                    json.dump([], f)
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))

        elif path == '/api/visits':
            # Delete all visits
            if 'all' in query:
                with open(VISITS_FILE, 'w', encoding='utf-8') as f:
                    json.dump({}, f)
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))

        elif path == '/api/certificates':
            # Delete all certificates or specific certificate
            if 'all' in query:
                with open(CERTIFICATES_FILE, 'w', encoding='utf-8') as f:
                    json.dump([], f)
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            elif 'id' in query:
                cert_id = query['id'][0]
                with open(CERTIFICATES_FILE, 'r', encoding='utf-8') as f:
                    certificates = json.load(f)
                certificates = [c for c in certificates if c.get('id') != cert_id]
                with open(CERTIFICATES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(certificates, f, ensure_ascii=False, indent=2)
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))

    def log_message(self, format, *args):
        """Override to reduce log noise"""
        pass


def run(server_class=HTTPServer, handler_class=APIHandler, port=8001):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'🚀 API Server running on http://localhost:{port}')
    print(f'📧 Messages API: http://localhost:{port}/api/messages')
    print(f'💬 Chatbot API: http://localhost:{port}/api/chatbot')
    print(f'👁️  Visits API: http://localhost:{port}/api/visits')
    print(f'📄 Certificates API: http://localhost:{port}/api/certificates')
    print('⏹️  Press Ctrl+C to stop')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n👋 Server stopped')
        httpd.server_close()


if __name__ == '__main__':
    run()
