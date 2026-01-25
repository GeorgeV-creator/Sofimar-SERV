-- Neon PostgreSQL Schema pentru Sofimar SERV
-- Rulează acest script în SQL Editor din Neon Dashboard

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- Chatbot messages table
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id SERIAL PRIMARY KEY,
    data TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
    date TEXT PRIMARY KEY,
    count INTEGER NOT NULL
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'certificat',
    timestamp TEXT NOT NULL
);

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- Site texts table (single row with id = 1)
CREATE TABLE IF NOT EXISTS site_texts (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    texts TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- Admin password table (single row with id = 1)
CREATE TABLE IF NOT EXISTS admin_password (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- TikTok videos table (single row with id = 1)
CREATE TABLE IF NOT EXISTS tiktok_videos (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    videos TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- Locations table (single row with id = 1)
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    text TEXT NOT NULL,
    date TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- Chatbot responses table
CREATE TABLE IF NOT EXISTS chatbot_responses (
    keyword TEXT PRIMARY KEY,
    response TEXT NOT NULL,
    timestamp TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_timestamp ON chatbot_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_certificates_timestamp ON certificates(timestamp);
CREATE INDEX IF NOT EXISTS idx_reviews_timestamp ON reviews(timestamp);


