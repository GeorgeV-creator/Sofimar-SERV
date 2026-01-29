-- Index pe certificates.id pentru DELETE mai rapid (folosește conexiunea persistentă)
-- Rulează în Neon SQL Editor dacă idx_certificates_id nu există.
CREATE INDEX IF NOT EXISTS idx_certificates_id ON certificates(id);
