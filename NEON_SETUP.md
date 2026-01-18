# 🚀 Setup Neon Database pentru Vercel

Neon este un PostgreSQL serverless care funcționează perfect cu Vercel (suportă IPv4 nativ).

---

## Opțiunea 1: Folosind neonctl (Recomandat pentru CLI)

### Pasul 1: Instalează și configurează neonctl
```bash
# Instalează neonctl global
npm install -g neonctl

# Sau folosește npx (fără instalare globală)
npx neonctl@latest login
```

### Pasul 2: Creează proiect și branch
```bash
# Inițializează proiect în folderul curent
npx neonctl@latest init

# Sau creează manual
npx neonctl@latest projects create
npx neonctl@latest branches create --project-id YOUR_PROJECT_ID
```

### Pasul 3: Obține Connection String
```bash
# List all projects
npx neonctl@latest projects list

# Get connection string
npx neonctl@latest connection-string YOUR_PROJECT_ID

# Sau pentru un branch specific
npx neonctl@latest connection-string YOUR_PROJECT_ID --branch main
```

---

## Opțiunea 2: Setup Manual (Mai Simplu)

### Pasul 1: Creează cont Neon
1. Mergi la: https://neon.tech
2. Sign up (free tier este generos)
3. Creează un proiect nou
4. Alege regiunea (preferabil aceeași cu Vercel)

### Pasul 2: Obține Connection String
1. După ce proiectul este creat, mergi la **Dashboard**
2. Click pe proiectul tău
3. În **"Connection Details"**, vei vedea **Connection String**
4. Copiază connection string-ul (format: `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require`)

**IMPORTANT**: Connection string-ul Neon arată așa:
```
postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
```
- Nu are port explicit (folosește 5432 implicit)
- Include `?sslmode=require` pentru SSL

---

## Pasul 3: Creează Tabelele în Neon

### Metoda A: Folosind SQL Editor în Neon Dashboard
1. Mergi la **Neon Dashboard** > **SQL Editor**
2. Creează un query nou
3. Copiază SQL din `supabase_schema.sql` sau execută manual fiecare `CREATE TABLE`

### Metoda B: Folosind neonctl
```bash
# Conectează-te și execută SQL
npx neonctl@latest sql YOUR_PROJECT_ID --sql "CREATE TABLE IF NOT EXISTS messages (...)"

# Sau execută un fișier SQL
npx neonctl@latest sql YOUR_PROJECT_ID --file supabase_schema.sql
```

### Metoda C: Folosind psql direct
```bash
# Folosește connection string-ul de la Neon
psql "postgresql://[user]:[password]@[host]/[dbname]?sslmode=require" < supabase_schema.sql
```

---

## Pasul 4: Actualizează Variabilele de Mediu în Vercel

### 4.1. Mergi la Vercel Dashboard
- https://vercel.com/dashboard
- Selectează proiectul **Sofimar-SERV**

### 4.2. Actualizează Environment Variables
1. **Settings** → **Environment Variables**
2. Găsește `SUPABASE_DB_URL` (sau creează `NEON_DB_URL`)
3. **Edit** și înlocuiește cu connection string-ul de la Neon
4. Bifează pentru **Production, Preview, Development**
5. **Save**

### 4.3. Opțional: Rename variabila
Dacă vrei să folosești `NEON_DB_URL` în loc de `SUPABASE_DB_URL`:
1. Creează `NEON_DB_URL` cu connection string-ul Neon
2. Păstrează `SUPABASE_DB_URL` ca backup (sau șterge-l dacă nu mai folosești Supabase)

---

## Pasul 5: Actualizează Codul (Opțional)

Codul actual ar trebui să funcționeze direct cu Neon, deoarece:
- Folosește `SUPABASE_DB_URL` din environment variables
- Compatibil cu PostgreSQL (Neon este PostgreSQL)
- Nu are dependențe specifice Supabase

**Dacă vrei să renumezi variabila în cod:**
- Schimbă `SUPABASE_DB_URL` → `NEON_DB_URL` în `api/index.py`

Dar **nu este necesar** - poți păstra `SUPABASE_DB_URL` ca nume pentru variabila de mediu, chiar dacă conține connection string-ul Neon.

---

## Pasul 6: Schema Tabelelor

Tabelele necesare (din `supabase_schema.sql`):
- `messages`
- `chatbot_messages`
- `visits`
- `certificates`
- `partners`
- `site_texts`
- `admin_password`
- `tiktok_videos`
- `locations`
- `reviews`
- `chatbot_responses`

Poți copia SQL-ul din `supabase_schema.sql` și să-l execuți în Neon SQL Editor.

---

## Pasul 7: Testează

După ce ai:
1. ✅ Creat proiectul Neon
2. ✅ Creat tabelele
3. ✅ Actualizat `SUPABASE_DB_URL` în Vercel cu connection string-ul Neon
4. ✅ Făcut redeploy pe Vercel

Testează:
```
https://sofimar-serv.vercel.app/api/test
```

Ar trebui să vezi:
```json
{
  "status": "ok",
  "database": {
    "connected": true,
    "type": "supabase"  // (numele nu contează - este doar pentru compatibilitate)
  }
}
```

---

## Avantaje Neon vs Supabase:

✅ **Suport IPv4 nativ** - Nu ai nevoie de Connection Pooler
✅ **Connection string simplu** - Funcționează direct, fără port special
✅ **Serverless-first** - Optimizat pentru Vercel și alte platforme serverless
✅ **Free tier generos** - 512 MB storage, compute-time generos

---

## Notă Importantă:

Codul actual funcționează **fără modificări** cu Neon, deoarece:
- Folosește `psycopg2` (PostgreSQL driver)
- Connection string-ul este standard PostgreSQL
- Nu există dependențe specifice Supabase în cod

**Singura modificare necesară** este să actualizezi variabila de mediu `SUPABASE_DB_URL` cu connection string-ul de la Neon.

---

## Dacă ai probleme:

1. **Verifică connection string-ul** - Ar trebui să includă `?sslmode=require`
2. **Verifică că tabelele există** - Folosește SQL Editor în Neon Dashboard
3. **Verifică logs-urile Vercel** - Pentru erori de conexiune
4. **Verifică Network Settings** în Neon - Asigură-te că permite conexiuni externe

