-- Migrare Recenzii Custom (fără Google Places)
-- Rulează în Neon SQL Editor dacă ai deja tabela reviews veche (author, text, timestamp).
-- Atenție: șterge datele existente din reviews.

DROP TABLE IF EXISTS reviews;

CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    date TEXT NOT NULL,
    approved BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(date);
