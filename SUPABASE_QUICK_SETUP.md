# 🚀 Setup Rapid Supabase (5 minute)

## Pasul 1: Obține credențialele Supabase

### 1.1. Mergi în Supabase Dashboard
- Deschide https://supabase.com/dashboard
- Selectează proiectul tău (sau creează unul nou dacă nu ai)

### 1.2. Obține SUPABASE_URL și SUPABASE_SERVICE_KEY
1. Mergi la **Settings** (⚙️) > **API**
2. Găsește secțiunea **Project API keys**
3. Copiază:
   - **Project URL** → aceasta este `SUPABASE_URL`
   - **service_role key** (Secret) → aceasta este `SUPABASE_SERVICE_KEY`
     - ⚠️ **IMPORTANT**: Folosește **service_role key**, NU **anon key**!

### 1.3. Obține SUPABASE_DB_URL (Connection String)
1. Mergi la **Settings** (⚙️) > **Database**
2. Scroll jos la secțiunea **Connection string**
3. Selectează tab-ul **URI**
4. Copiază connection string-ul (arată astfel):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. **Înlocuiește `[YOUR-PASSWORD]` cu parola ta reală de bază de date**
   - Parola o găsești în **Settings** > **Database** > **Database password**
   - Sau o vezi când ai creat proiectul
   - Dacă nu o știi, poți reseta parola în același loc
6. Rezultatul final ar trebui să fie ceva de genul:
   ```
   postgresql://postgres.xxxxx:YOUR_REAL_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   → Aceasta este `SUPABASE_DB_URL`

## Pasul 2: Configurează în Vercel

1. Mergi la **Vercel Dashboard** > Selectează proiectul tău
2. Mergi la **Settings** > **Environment Variables**
3. Adaugă cele 3 variabile:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
   | `SUPABASE_SERVICE_KEY` | `eyJhbGc...` (service_role key complet) | Production, Preview, Development |
   | `SUPABASE_DB_URL` | `postgresql://postgres:PASSWORD@...` (cu parola reală) | Production, Preview, Development |

4. ✅ Verifică că toate cele 3 variabile sunt bifate pentru **Production, Preview, Development**
5. Click **Save**

## Pasul 3: Redeploy pe Vercel

1. Mergi la **Deployments**
2. Click pe **⋮** (trei puncte) lângă ultimul deployment
3. Click **Redeploy**
4. Sau push un nou commit pe GitHub (auto-deploy)

## ✅ Gata! 

**Tabelele se vor crea automat** la primul acces API. Nu trebuie să faci nimic manual!

### Verificare:
- Mergi în Vercel > Functions > Logs
- Ar trebui să vezi "✅ Supabase tables initialized successfully"
- Sau testează API-ul: `https://your-project.vercel.app/api/certificates`

---

## ❓ Probleme?

### "Supabase connection error"
- Verifică că toate cele 3 variabile sunt setate corect
- Verifică că `SUPABASE_DB_URL` are parola reală (nu `[PASSWORD]`)
- Verifică că ai folosit **service_role key**, nu **anon key**

### "Tables not created"
- Tabelele se creează automat la primul request API
- Fă un request la orice endpoint API pentru a forța crearea
- Verifică logs-urile în Vercel pentru erori

### "Password incorrect"
- Resetă parola în Supabase > Settings > Database > Database password
- Actualizează `SUPABASE_DB_URL` cu noua parolă în Vercel
- Redeploy

