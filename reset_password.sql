-- Script pentru resetarea parolei admin în Neon PostgreSQL
-- Rulează acest script în SQL Editor din Neon Dashboard

-- Creează tabelul dacă nu există
CREATE TABLE IF NOT EXISTS admin_password (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- Resetează parola la 'admin123'
INSERT INTO admin_password (id, password, last_updated) 
VALUES (1, 'admin123', NOW()::TEXT)
ON CONFLICT (id) 
DO UPDATE SET 
    password = 'admin123',
    last_updated = NOW()::TEXT;

-- Verifică parola resetată
SELECT id, password, last_updated FROM admin_password WHERE id = 1;

