#!/bin/bash

# Server local pentru testare site pe telefon/emulator
PORT=8000
API_PORT=8001

echo "🚀 Pornind serverele locale..."
echo ""
echo "📱 Site-ul va fi disponibil la:"
echo "   http://localhost:$PORT"
echo "   http://$(ipconfig getifaddr en0 2>/dev/null || echo 'YOUR_IP'):$PORT"
echo ""
echo "🔌 API Server va rula la:"
echo "   http://localhost:$API_PORT"
echo ""
echo "💡 Pentru a accesa de pe telefon:"
echo "   1. Asigură-te că telefonul este pe aceeași rețea WiFi"
echo "   2. Înlocuiește YOUR_IP cu adresa IP afișată mai sus"
echo "   3. Deschide browser-ul pe telefon și accesează adresa"
echo ""
echo "⏹️  Apasă Ctrl+C pentru a opri serverele"
echo ""

# Pornește API server în background
python3 api_server.py &
API_PID=$!

# Pornește server HTTP simplu
python3 -m http.server $PORT

# Când se oprește serverul principal, oprește și API server-ul
kill $API_PID 2>/dev/null
