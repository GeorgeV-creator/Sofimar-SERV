# 🚀 Ghid Complet Setup Neon + Vercel + GitHub

Ghid pas cu pas pentru deploy-ul aplicației Sofimar SERV pe Vercel cu Neon PostgreSQL database.

---

## 📋 Prerequisiti

1. **Cont GitHub** (dacă nu ai: https://github.com)
2. **Cont Vercel** (dacă nu ai: https://vercel.com - conectează cu GitHub)
3. **Cont Neon** (dacă nu ai: https://neon.tech - Sign up free)

---

## Pasul 1: Setup Neon Database

### 1.1. Creează cont și proiect
1. Mergi la https://neon.tech
2. Click **"Sign Up"** (gratuit)
3. După login, click **"Create Project"**
4. Completează:
   - **Project Name**: `sofimar-serv` (sau orice nume)
   - **Region**: Alege regiunea (preferabil aceeași cu Vercel - ex: `us-east-1`)
   - **PostgreSQL Version**: 15 sau 16 (default)
5. Click **"Create Project"**

### 1.2. Obține Connection String
1. După crearea proiectului, mergi la **Dashboard**
2. În secțiunea **"Connection Details"**, vei vedea **Connection String**
3. **Copiază** connection string-ul (format: `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require`)
4. **IMPORTANT**: Connection string-ul trebuie să includă `?sslmode=require`

<!-- NOTA: Șterge parola din connection string înainte de commit pe GitHub pentru securitate! -->
<!-- Exemplu: postgresql://neondb_owner:[PASSWORD]@ep-little-bar-a92xmhtr-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require -->

Exemplu:
```
postgresql://[user]:[password]@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 1.3. Creează Tabelele
1. În **Neon Dashboard**, mergi la **"SQL Editor"** (în sidebar)
2. Click **"New Query"**
3. Deschide fișierul `neon_schema.sql` din proiect
4. **Copiază tot conținutul** fișierului
5. **Paste** în SQL Editor
6. Click **"Run"** sau **"Execute"**
7. Ar trebui să vezi mesajul "Success" - toate tabelele au fost create

**Tabele create:**
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

---

## Pasul 2: Setup GitHub Repository

### 2.1. Push Codul pe GitHub
```bash
# Dacă nu ai repository deja creat
cd /path/to/site
git init
git add .
git commit -m "Initial commit: Neon database setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Sofimar-SERV.git
git push -u origin main
```

### 2.2. Verifică că Fișierele Sunt pe GitHub
- Mergi la repository-ul tău pe GitHub
- Verifică că există:
  - `api/index.py`
  - `neon_schema.sql`
  - `requirements.txt`
  - `vercel.json`
  - `index.html`, `admin.html`, etc.

---

## Pasul 3: Setup Vercel

### 3.1. Conectează Repository-ul la Vercel
1. Mergi la https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Selectează repository-ul **Sofimar-SERV**
5. Click **"Import"**

### 3.2. Configurează Proiectul
1. **Project Name**: `sofimar-serv` (sau lasă default)
2. **Framework Preset**: **Other** (sau lasă Vercel să detecteze automat)
3. **Root Directory**: `.` (root)
4. **Build Command**: Lasă gol (nu este necesar)
5. **Output Directory**: Lasă gol (nu este necesar)

### 3.3. Adaugă Environment Variables
Înainte de a face deploy, adaugă variabilele de mediu:

1. Click pe **"Environment Variables"** (în secțiunea **"Configure Project"**)
2. Adaugă următoarele:

#### `NEON_DB_URL` (Obligatoriu)
- **Key**: `NEON_DB_URL`
- **Value**: Connection string-ul copiat de la Neon (Pasul 1.2)
  - Exemplu: `postgresql://[user]:[password]@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require`
- **Environments**: Bifează toate: **Production**, **Preview**, **Development**

3. Click **"Save"**

### 3.4. Deploy
1. Click **"Deploy"**
2. Așteaptă 1-2 minute pentru build și deploy
3. După ce se finalizează, vei vedea link-ul: `https://sofimar-serv.vercel.app`

---

## Pasul 4: Verifică Setup-ul

### 4.1. Testează API-ul
Accesează:
```
https://sofimar-serv.vercel.app/api/test
```

Ar trebui să vezi:
```json
{
  "status": "ok",
  "use_neon": true,
  "db_type": "neon",
  "has_neon_db_url": true,
  "database": {
    "connected": true,
    "type": "neon"
  }
}
```

Dacă vezi `"connected": true` și `"type": "neon"` → ✅ **SUCCES!**

### 4.2. Testează Site-ul
Accesează:
```
https://sofimar-serv.vercel.app
```

Ar trebui să vezi site-ul funcțional.

### 4.3. Testează Admin Panel
Accesează:
```
https://sofimar-serv.vercel.app/admin.html
```

Ar trebui să te poți loga și să gestionezi conținutul.

---

## Pasul 5: Auto-Deploy (Opțional)

Vercel va face **auto-deploy** automat când faci push pe GitHub:

1. Faci modificări în cod local
2. `git add .`
3. `git commit -m "Your changes"`
4. `git push origin main`
5. Vercel detectează automat push-ul
6. Face rebuild și redeploy automat (1-2 minute)

---

## 🔧 Troubleshooting

### Problema: "404 NOT_FOUND" pentru `/api/*`
**Soluție**: Verifică că există `vercel.json` cu rewrites configurate corect.

### Problema: "database": {"connected": false}
**Soluție**: 
1. Verifică că `NEON_DB_URL` este setat corect în Vercel
2. Verifică că connection string-ul include `?sslmode=require`
3. Verifică că tabelele există în Neon (SQL Editor)

### Problema: "Eroare: serverul nu este disponibil"
**Soluție**: 
1. Verifică logs-urile în Vercel Dashboard > Functions
2. Verifică că `api/index.py` există
3. Verifică că `requirements.txt` include `psycopg2-binary`

### Problema: Tabelele nu există
**Soluție**: 
1. Mergi la Neon Dashboard > SQL Editor
2. Rulează `neon_schema.sql` din nou

---

## 📝 Notițe Importante

### Environment Variables în Vercel
- `NEON_DB_URL`: Connection string-ul de la Neon (obligatoriu)
- Trebuie bifat pentru **Production**, **Preview**, **Development**

### Connection String Format
- Format standard PostgreSQL: `postgresql://[user]:[password]@[host]/[dbname]?sslmode=require`
- Nu modifică connection string-ul manual - copiază-l direct din Neon Dashboard

### Tabelele
- Toate tabelele sunt create din `neon_schema.sql`
- Nu sunt create automat de cod - trebuie rulate manual în Neon SQL Editor

### Free Tier Limits
- **Neon Free Tier**: 512 MB storage, compute-time generos
- **Vercel Free Tier**: 100 GB bandwidth/lună, funcții serverless generoase

---

## ✅ Checklist Final

- [ ] Cont Neon creat
- [ ] Proiect Neon creat
- [ ] Tabelele create (din `neon_schema.sql`)
- [ ] Connection string copiat
- [ ] Codul push-at pe GitHub
- [ ] Repository conectat la Vercel
- [ ] `NEON_DB_URL` setat în Vercel Environment Variables
- [ ] Deploy reușit pe Vercel
- [ ] `/api/test` returnează `"connected": true`
- [ ] Site-ul funcționează corect

---

## 🎉 Gata!

Aplicația ta este acum live pe Vercel cu Neon PostgreSQL database!

**URL-uri importante:**
- **Site**: `https://sofimar-serv.vercel.app`
- **Admin**: `https://sofimar-serv.vercel.app/admin.html`
- **API Test**: `https://sofimar-serv.vercel.app/api/test`

**Dashboard-uri:**
- **Vercel**: https://vercel.com/dashboard
- **Neon**: https://console.neon.tech
- **GitHub**: https://github.com/YOUR_USERNAME/Sofimar-SERV

---

## 📚 Resurse Suplimentare

- **Neon Docs**: https://neon.tech/docs
- **Vercel Docs**: https://vercel.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

