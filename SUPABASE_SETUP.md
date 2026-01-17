# Configurare Supabase pentru Vercel

## ✅ Automatizat: Tabelele se creează automat!

**Tabelele se vor crea automat la primul acces API** dacă credențialele Supabase sunt configurate corect în Vercel. Nu este necesar să le creezi manual!

## Pași pentru setup:

1. **Creează proiectul Supabase** (dacă nu ai deja):
   - Mergi pe https://supabase.com
   - Creează un cont gratuit
   - Creează un nou proiect

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
- După ce adaugi variabilele de mediu, **redeploy proiectul pe Vercel**
- **Tabelele se vor crea automat** la primul acces API - nu trebuie să le creezi manual!

## Verificare:

### Metoda 1: Verifică în Vercel Logs
După deploy, verifică în Vercel Dashboard > Functions > Logs:
- ✅ Ar trebui să vezi "✅ Supabase tables initialized successfully" la primul acces
- ✅ Sau "⚠️ Supabase initialization error (tables may already exist)" dacă există deja

### Metoda 2: Verifică manual (opțional)
Dacă vrei să verifici manual, poți rula `init_supabase.py` local:
```bash
export SUPABASE_DB_URL='postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres'
python3 init_supabase.py
```

### Metoda 3: Verifică în Supabase Dashboard
- Mergi la Supabase Dashboard > Table Editor
- Ar trebui să vezi toate tabelele create automat

## Troubleshooting:

Dacă vezi "Supabase connection error", verifică că:
- Variabilele de mediu sunt corecte în Vercel
- **SUPABASE_DB_URL** conține parola corectă (nu [PASSWORD] literal)
- Credențialele sunt setate pentru environment-ul corect (Production/Preview/Development)

