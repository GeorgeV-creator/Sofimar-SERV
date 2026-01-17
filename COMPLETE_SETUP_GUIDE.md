# 📚 Ghid Complet: Conectare Vercel + GitHub + Supabase

## Partea 1: Conectare Vercel cu GitHub 🔗

### Pasul 1.1: Creează cont Vercel (dacă nu ai)
1. Mergi pe https://vercel.com
2. Click pe **"Sign Up"**
3. Click pe **"Continue with GitHub"** (recomandat - conectează automat GitHub)
4. Autorizează Vercel să acceseze GitHub-ul tău

### Pasul 1.2: Import Proiect din GitHub
1. După login, în Vercel Dashboard, click pe **"Add New..."** sau **"New Project"**
2. Vei vedea o listă cu toate repository-urile tale GitHub
3. **Găsește `Sofimar-SERV`** în listă
4. Click pe **"Import"** lângă `Sofimar-SERV`

### Pasul 1.3: Configurează Proiectul
1. Vercel va detecta automat:
   - `vercel.json` (configurație)
   - `api/index.py` (serverless function)
   - `requirements.txt` (dependencies)
2. **NU schimba nimic** în setări (Framework Preset = Other, Build Command = gol)
3. Click pe **"Deploy"**

### Pasul 1.4: Verificare
- Așteaptă ~1-2 minute pentru deploy
- Vei vedea **"Building..."** apoi **"Ready"**
- Proiectul va fi disponibil la: `https://sofimar-serv.vercel.app` (sau alt URL)

✅ **Gata! Vercel este conectat cu GitHub și va face auto-deploy la fiecare push.**

---

## Partea 2: Configurare Supabase 🗄️

### Pasul 2.1: Creează Proiect Supabase
1. Mergi pe https://supabase.com
2. Click pe **"Start your project"** sau **"New Project"**
3. Login cu GitHub (dacă nu ai cont)
4. Click pe **"New Project"**
5. Completează:
   - **Name**: `sofimar-serv` (sau orice nume vrei)
   - **Database Password**: **Creează o parolă puternică** (salveaz-o undeva sigur!)
   - **Region**: Alege cel mai apropiat (ex: EU West pentru România)
   - **Pricing Plan**: Free (planul gratuit este suficient)
6. Click **"Create new project"**
7. ⏳ Așteaptă ~2 minute pentru crearea proiectului

### Pasul 2.2: Obține Credențialele Supabase

#### A. Obține SUPABASE_URL și SUPABASE_SERVICE_KEY
1. În Supabase Dashboard, mergi la **Settings** (⚙️) din meniul stâng
2. Click pe **"API"**
3. Găsește secțiunea **"Project API keys"**
4. Copiază:
   - **Project URL**: 
     - Ex: `https://xxxxx.supabase.co`
     - → Aceasta este `SUPABASE_URL`
   - **service_role key** (Secret) - **IMPORTANT:**
     - Click pe **"Reveal"** pentru a vedea key-ul complet
     - Copiază tot key-ul (începe cu `eyJhbGc...`)
     - → Aceasta este `SUPABASE_SERVICE_KEY`
     - ⚠️ **ATENȚIE**: Folosește **service_role key**, NU **anon key**!

#### B. Obține SUPABASE_DB_URL (Connection String)
1. În Supabase Dashboard, mergi la **Settings** (⚙️) > **"Database"**
2. Scroll jos până la secțiunea **"Connection string"**
3. Selectează tab-ul **"URI"**
4. Vei vedea ceva de genul:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
5. **Copiază connection string-ul**
6. **Înlocuiește `[YOUR-PASSWORD]` cu parola ta reală** (cea pe care ai creat-o la Pasul 2.1)
   - Dacă nu o știi, poți găsi parola în:
     - **Settings** > **Database** > **Database password** (dacă este afișată)
     - Sau resetă parola în același loc
7. Rezultatul final ar trebui să fie ceva de genul:
   ```
   postgresql://postgres.xxxxx:YOUR_REAL_PASSWORD_HERE@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
   - → Aceasta este `SUPABASE_DB_URL`

### Pasul 2.3: Verifică Credențialele
Ai nevoie de 3 valori:
1. ✅ `SUPABASE_URL` - ex: `https://awqahhtpjwsncidcsiar.supabase.co`
2. ✅ `SUPABASE_SERVICE_KEY` - ex: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3cWFoaHRwandzbmNpZGNzaWFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODY3NTM2OSwiZXhwIjoyMDg0MjUxMzY5fQ.hDhfeyzJTzMeq-8OAaPu5GmX75U_s_XqPw25cwU_ars` (lung)
3. ✅ `SUPABASE_DB_URL` - ex: `postgresql://postgres:nugdi4-Sushuf-fiwpiq@db.awqahhtpjwsncidcsiar.supabase.co:5432/postgres`

**Salvează-le undeva sigur (temporar) pentru următorul pas!**

---

## Partea 3: Conectare Supabase cu Vercel 🔗

### Pasul 3.1: Deschide Vercel Dashboard
1. Mergi pe https://vercel.com/dashboard
2. Selectează proiectul **`Sofimar-SERV`**

### Pasul 3.2: Adaugă Environment Variables
1. Click pe **"Settings"** (în bara de navigare de sus)
2. Click pe **"Environment Variables"** (în meniul din stânga)
3. Vei vedea un formular cu 3 câmpuri:
   - **Name** (numele variabilei)
   - **Value** (valoarea variabilei)
   - **Environment** (Production, Preview, Development)

4. **Adaugă prima variabilă:**
   - **Name**: `SUPABASE_URL`
   - **Value**: Copiază `SUPABASE_URL` din Pasul 2.2.A
   - **Environment**: ✅ Bifează **Production**, **Preview**, și **Development**
   - Click **"Save"**

5. **Adaugă a doua variabilă:**
   - **Name**: `SUPABASE_SERVICE_KEY`
   - **Value**: Copiază `SUPABASE_SERVICE_KEY` din Pasul 2.2.A
   - **Environment**: ✅ Bifează **Production**, **Preview**, și **Development**
   - Click **"Save"**

6. **Adaugă a treia variabilă:**
   - **Name**: `SUPABASE_DB_URL`
   - **Value**: Copiază `SUPABASE_DB_URL` din Pasul 2.2.B (cu parola reală!)
   - **Environment**: ✅ Bifează **Production**, **Preview**, și **Development**
   - Click **"Save"**

### Pasul 3.3: Redeploy Proiectul
1. După ce ai adăugat toate cele 3 variabile, mergi la **"Deployments"** (în bara de navigare)
2. Găsește ultimul deployment (cel mai recent)
3. Click pe **⋮** (trei puncte) din dreapta deployment-ului
4. Click pe **"Redeploy"**
5. În dialog, selectează **"Use existing Build Cache"** (opțional)
6. Click **"Redeploy"**

### Pasul 3.4: Verificare
1. Așteaptă ~2 minute pentru redeploy
2. Când deployment-ul este gata, click pe **"Functions"** în meniul de sus
3. Click pe **"View Function Logs"** pentru `api/index.py`
4. Ar trebui să vezi în logs:
   - ✅ `✅ Supabase tables initialized successfully` (la primul acces)
   - Sau: `⚠️ Supabase initialization error (tables may already exist)`

---

## ✅ Gata! Totul este conectat!

### Ce s-a întâmplat:
1. ✅ **Vercel ↔ GitHub**: Auto-deploy la fiecare push
2. ✅ **Vercel ↔ Supabase**: Variabile de mediu configurate
3. ✅ **API ↔ Supabase**: Tabelele se creează automat la primul acces

### Testare:
1. Deschide site-ul: `https://sofimar-serv.vercel.app`
2. Mergi la Admin panel: `https://sofimar-serv.vercel.app/admin.html`
3. Încearcă să adaugi un certificat sau orice alt date
4. Verifică în Supabase Dashboard > **Table Editor** - ar trebui să vezi datele!

---

## ❓ Probleme Comune

### "Vercel nu găsește repository-ul meu"
- Verifică că ești logat cu același cont GitHub în Vercel
- Verifică că repository-ul este public sau că ai dat acces Vercel-ului

### "Environment variables nu funcționează"
- Verifică că ai bifat toate environment-urile (Production, Preview, Development)
- Verifică că ai făcut **Redeploy** după adăugarea variabilelor
- Verifică că nu există spații înainte/după valorile variabilelor

### "Supabase connection error"
- Verifică că `SUPABASE_DB_URL` are parola reală (nu `[YOUR-PASSWORD]` literal)
- Verifică că `SUPABASE_SERVICE_KEY` este **service_role key**, nu **anon key**
- Verifică că toate cele 3 variabile sunt setate corect

### "Tables not created"
- Tabelele se creează automat la primul request API
- Fă un request API (ex: accesează admin panel și încearcă să adaugi ceva)
- Verifică logs-urile în Vercel > Functions > Logs

---

## 📞 Ajutor Suplimentar

Dacă ai probleme:
1. Verifică logs-urile în Vercel Dashboard > Functions > Logs
2. Verifică logs-urile în Supabase Dashboard > Logs > Postgres Logs
3. Contactează-mă cu detaliile erorii și pot să te ajut!

