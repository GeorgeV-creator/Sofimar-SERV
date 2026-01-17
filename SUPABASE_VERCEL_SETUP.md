# 📚 Ghid Complet: Conectare Vercel + Supabase (Pas cu Pas)

## Partea 1: Setup Supabase 🗄️

### Pasul 1.1: Creează Proiect Supabase

1. Mergi pe **https://supabase.com**
2. Click pe **"Start your project"** sau **"Sign Up"**
3. Login cu GitHub (sau creează cont)
4. Click pe **"New Project"**
5. Completează:
   - **Name**: `sofimar-serv` (sau orice nume vrei)
   - **Database Password**: **Creează o parolă puternică și SALVEAZ-O!** (o vei folosi mai jos)
   - **Region**: Alege cel mai apropiat (ex: **West EU** pentru România)
   - **Pricing Plan**: **Free** (planul gratuit este suficient)
6. Click **"Create new project"**
7. ⏳ **Așteaptă 2-3 minute** pentru crearea proiectului

### Pasul 1.2: Obține Credențialele Supabase

#### A. Obține SUPABASE_URL și SUPABASE_SERVICE_KEY

1. În Supabase Dashboard, în meniul din stânga, click pe **⚙️ Settings**
2. Click pe **"API"** (sub Settings)
3. Găsește secțiunea **"Project API keys"**
4. Copiază următoarele:

   **SUPABASE_URL:**
   - Găsește **"Project URL"**
   - Ex: `https://xxxxx.supabase.co`
   - **COPY ACEASTA** → aceasta este `SUPABASE_URL`
   
   **SUPABASE_SERVICE_KEY:**
   - Găsește **"service_role"** key (Secret)
   - Click pe **"Reveal"** pentru a vedea key-ul complet
   - **COPY TOT KEY-UL** (începe cu `eyJhbGc...`)
   - ⚠️ **IMPORTANT**: Folosește **service_role key**, NU **anon key**!

#### B. Obține SUPABASE_DB_URL (Connection String)

1. În Supabase Dashboard, mergi la **⚙️ Settings** > **"Database"**
2. Scroll jos până la secțiunea **"Connection string"**
3. Selectează tab-ul **"URI"**
4. Vei vedea ceva de genul:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
5. **COPY connection string-ul**
6. **IMPORTANT**: Înlocuiește `[YOUR-PASSWORD]` cu **parola reală** (cea pe care ai creat-o la Pasul 1.1)
   - Rezultatul final ar trebui să arate așa:
   ```
   postgresql://postgres.xxxxx:PAROLA_TA_AICI@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   - → Aceasta este `SUPABASE_DB_URL`

### Pasul 1.3: Verifică Credențialele

Ai nevoie de **3 valori**:

✅ **SUPABASE_URL**: `https://xxxxx.supabase.co`  
✅ **SUPABASE_SERVICE_KEY**: `eyJhbGc...` (lung, service_role key)  
✅ **SUPABASE_DB_URL**: `postgresql://postgres.xxxxx:PAROLA@...` (cu parola reală!)

---

## Partea 2: Crearea Tabelelor în Supabase 📊

### Opțiunea A: Automat (Recomandat) ⭐

**Tabelele se creează automat** când faci primul request la API! Nu trebuie să faci nimic manual.

**Cum funcționează:**
1. Când accesezi prima dată `https://sofimar-serv.vercel.app/api/test`
2. API-ul detectează că nu există tabele
3. Creează automat toate tabelele necesare
4. Vezi în Vercel logs: `✅ Supabase tables initialized successfully`

**Verificare:**
- După primul request API, mergi în **Supabase Dashboard > Table Editor**
- Ar trebui să vezi toate tabelele create automat

### Opțiunea B: Manual (Dacă automat nu funcționează)

Dacă tabelele nu se creează automat, poți le creezi manual:

1. În Supabase Dashboard, mergi la **SQL Editor** (în meniul din stânga)
2. Click pe **"New query"**
3. Copy-paste următorul SQL:

```sql
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

-- Site texts table
CREATE TABLE IF NOT EXISTS site_texts (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- Admin password table
CREATE TABLE IF NOT EXISTS admin_password (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- TikTok videos table
CREATE TABLE IF NOT EXISTS tiktok_videos (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    videos TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

-- Locations table
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
```

4. Click pe **"Run"** (sau Ctrl+Enter)
5. Ar trebui să vezi mesajul: **"Success. No rows returned"**

**Verificare:**
- Mergi la **Table Editor** în Supabase Dashboard
- Ar trebui să vezi toate cele 11 tabele listate

---

## Partea 3: Conectare Vercel + Supabase 🔗

### Pasul 3.1: Deschide Vercel Dashboard

1. Mergi pe **https://vercel.com/dashboard**
2. Selectează proiectul **`Sofimar-SERV`**

### Pasul 3.2: Adaugă Environment Variables

1. Click pe **"Settings"** (în bara de navigare de sus)
2. Click pe **"Environment Variables"** (în meniul din stânga)
3. Vei vedea un formular cu 3 câmpuri

#### Adaugă prima variabilă: SUPABASE_URL

1. **Name**: `SUPABASE_URL`
2. **Value**: Copiază `SUPABASE_URL` din Pasul 1.2.A
   - Ex: `https://awqahhtpjwsncidcsiar.supabase.co`
3. **Environment**: ✅ Bifează **Production**, **Preview**, și **Development**
4. Click **"Save"**

#### Adaugă a doua variabilă: SUPABASE_SERVICE_KEY

1. **Name**: `SUPABASE_SERVICE_KEY`
2. **Value**: Copiază `SUPABASE_SERVICE_KEY` din Pasul 1.2.A
   - Ex: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (lung)
3. **Environment**: ✅ Bifează **Production**, **Preview**, și **Development**
4. Click **"Save"**

#### Adaugă a treia variabilă: SUPABASE_DB_URL

1. **Name**: `SUPABASE_DB_URL`
2. **Value**: Copiază `SUPABASE_DB_URL` din Pasul 1.2.B (cu parola reală!)
   - Ex: `postgresql://postgres.nugdi4-Sushuf-fiwpiq:PAROLA_TA_AICI@db.awqahhtpjwsncidcsiar.supabase.co:5432/postgres`
   - ⚠️ **IMPORTANT**: Înlocuiește `PAROLA_TA_AICI` cu parola reală din Pasul 1.1!
3. **Environment**: ✅ Bifează **Production**, **Preview**, și **Development**
4. Click **"Save"**

### Pasul 3.3: Verifică Variabilele

Ar trebui să vezi 3 variabile listate:

| Name | Environments |
|------|--------------|
| `SUPABASE_URL` | Production, Preview, Development |
| `SUPABASE_SERVICE_KEY` | Production, Preview, Development |
| `SUPABASE_DB_URL` | Production, Preview, Development |

### Pasul 3.4: Redeploy Proiectul

1. Mergi la **"Deployments"** (în bara de navigare)
2. Găsește ultimul deployment (cel mai recent)
3. Click pe **⋮** (trei puncte) din dreapta deployment-ului
4. Click pe **"Redeploy"**
5. Click **"Redeploy"** în dialog (lasă "Use existing Build Cache" bifat)
6. ⏳ **Așteaptă 2-3 minute** pentru redeploy

---

## Partea 4: Testare și Verificare ✅

### Pasul 4.1: Test API

1. Deschide în browser: `https://sofimar-serv.vercel.app/api/test`
2. Ar trebui să vezi:
   ```json
   {
     "status": "ok",
     "db_initialized": true
   }
   ```

### Pasul 4.2: Verifică Logs Vercel

1. În Vercel Dashboard, mergi la **Functions**
2. Click pe **`api/index.py`**
3. Click pe **"View Function Logs"**
4. Caută mesaje precum:
   - `🔧 Checking/Initializing Supabase database tables...`
   - `✅ Table 'messages' created/verified`
   - `✅ Table 'certificates' created/verified`
   - etc.

### Pasul 4.3: Verifică Tabelele în Supabase

1. Mergi în **Supabase Dashboard**
2. Click pe **"Table Editor"** (în meniul din stânga)
3. Ar trebui să vezi toate tabelele:
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

### Pasul 4.4: Test Funcționalitate

1. Trimite un mesaj prin formularul de contact de pe site
2. Mergi în **Supabase Dashboard > Table Editor > messages**
3. Ar trebui să vezi mesajul tău salvat acolo

---

## Troubleshooting 🔧

### ❌ "Supabase connection error" în logs

**Cauză**: `SUPABASE_DB_URL` este incorect sau parola este greșită.

**Soluție**:
1. Verifică că `SUPABASE_DB_URL` conține parola reală (nu `[YOUR-PASSWORD]` literal)
2. Verifică că parola din connection string este corectă
3. Reset parola în Supabase dacă e necesar:
   - Settings > Database > Database password > Reset password

### ❌ "USE_SUPABASE=False" sau tabelele nu se creează

**Cauză**: Una sau mai multe variabile de mediu lipsesc sau sunt greșite.

**Soluție**:
1. Verifică că toate cele 3 variabile sunt setate în Vercel
2. Verifică că numele variabilelor sunt **EXACT** ca mai sus:
   - `SUPABASE_URL` (nu `SUPABASE_API_URL`)
   - `SUPABASE_SERVICE_KEY` (nu `SUPABASE_KEY`)
   - `SUPABASE_DB_URL` (nu `DATABASE_URL`)
3. Verifică că ai făcut **Redeploy** după adăugarea variabilelor

### ❌ Tabelele nu apar în Supabase

**Cauză**: Tabelele nu s-au creat automat sau există erori.

**Soluție**:
1. Fă un request la API: `https://sofimar-serv.vercel.app/api/test`
2. Verifică logs-urile în Vercel pentru erori
3. Dacă tot nu funcționează, creează tabelele manual (vezi Opțiunea B de mai sus)

### ❌ "service_role key" vs "anon key"

**IMPORTANT**: 
- ✅ Folosește **service_role key** (permisii complete)
- ❌ NU folosi **anon key** (permisii limitate)

Service_role key permite crearea tabelelor și operațiuni administrative.

---

## Verificare Finală ✅

După ce ai făcut toți pașii, verifică:

- ✅ Variabilele de mediu sunt setate în Vercel (3 variabile)
- ✅ Redeploy făcut după adăugarea variabilelor
- ✅ `https://sofimar-serv.vercel.app/api/test` returnează `{"status": "ok"}`
- ✅ Tabelele apar în Supabase Dashboard > Table Editor
- ✅ Poți trimite mesaje prin formular și apar în Supabase

---

## Structura Finală

```
Vercel (Hosting + API)
    ↓
Environment Variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_DB_URL)
    ↓
Supabase PostgreSQL Database
    ↓
Tabele: messages, certificates, reviews, etc.
```

**Codul tău** → **Vercel API** (`api/index.py`) → **Supabase PostgreSQL** → **Date persistente** ✅

---

## Suport

Dacă ai probleme:
1. Verifică logs-urile în Vercel Dashboard > Functions > Logs
2. Verifică logs-urile în Supabase Dashboard > Logs
3. Asigură-te că toate variabilele sunt setate corect
4. Verifică că ai făcut redeploy după setarea variabilelor

**Totul ar trebui să funcționeze automat odată ce variabilele sunt configurate corect!** 🚀

