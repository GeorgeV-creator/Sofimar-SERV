# Configurare Supabase pentru Vercel

## Pași pentru setup:

1. **Creează proiectul Supabase** (dacă nu ai deja):
   - Mergi pe https://supabase.com
   - Creează un cont gratuit
   - Creează un nou proiect

2. **Creează tabelele în Supabase**:
   - Mergi la **SQL Editor** din Supabase Dashboard
   - Rulează scriptul `supabase_schema.sql` (copy-paste conținutul fișierului)
   - Click pe **Run** pentru a executa scriptul

3. **Obține credențialele Supabase**:
   - Mergi la **Settings** > **API** în Supabase Dashboard
   - Copiază:
     - **Project URL** (SUPABASE_URL)
     - **service_role key** (SUPABASE_SERVICE_KEY) - IMPORTANT: folosește service_role, nu anon key
   - Pentru conexiune directă PostgreSQL:
     - Mergi la **Settings** > **Database**
     - Sub **Connection string**, selectează **URI**
     - Copiază connection string-ul (SUPABASE_DB_URL)

4. **Configurează variabilele de mediu în Vercel**:
   - Mergi la Vercel Dashboard > Project > Settings > Environment Variables
   - Adaugă următoarele variabile:
     ```
     SUPABASE_URL=https://xxxxx.supabase.co
     SUPABASE_SERVICE_KEY=eyJhbGc... (service_role key)
     SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```
   - Înlocuiește `[PASSWORD]` cu parola ta de bază de date Supabase (găsește-o în Settings > Database)

5. **Adaugă dependencies pentru Vercel** (opțional, pentru PostgreSQL direct):
   - Creează `requirements.txt` în root:
     ```
     psycopg2-binary==2.9.9
     ```
   - Vercel va instala automat dependențele

## Notă importantă:

- **SUPABASE_SERVICE_KEY** trebuie să fie **service_role key**, NU **anon key**
- **SUPABASE_DB_URL** trebuie să conțină parola corectă a bazei de date
- După ce adaugi variabilele de mediu, redeploy proiectul pe Vercel

## Verificare:

După deploy, verifică în Vercel logs dacă apare "Using Supabase" sau "Using SQLite fallback".
Dacă vezi "Supabase connection error", verifică că:
- Variabilele de mediu sunt corecte
- Tabelele există în Supabase
- Parola din SUPABASE_DB_URL este corectă

