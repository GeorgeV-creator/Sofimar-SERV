# 🔧 Cum să Actualizezi SUPABASE_DB_URL în Vercel

## Pași pentru a actualiza variabila de mediu:

### 1. Copiază Connection String de la Supabase
- Din **Supabase Dashboard** > **Settings** > **Database** > **Connection Pooling** > **Transaction Mode**
- Copiază **Connection String** (format: `postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`)
- **IMPORTANT**: Verifică că are:
  - ✅ Port **6543** (nu 5432)
  - ✅ Host `pooler.supabase.com` (nu `db.supabase.co`)
  - ✅ Query param `?pgbouncer=true` la sfârșit

### 2. Mergi la Vercel Dashboard
- https://vercel.com/dashboard
- Selectează proiectul **Sofimar-SERV** (sau numele proiectului tău)

### 3. Mergi la Settings > Environment Variables
- Click pe **"Settings"** în bara laterală stânga
- Click pe **"Environment Variables"** în submeniu

### 4. Găsește `SUPABASE_DB_URL`
- Scroll prin lista de variabile de mediu
- Găsește `SUPABASE_DB_URL`
- Click pe **"..."** (three dots) → **"Edit"** sau **"Edit Value"**

### 5. Înlocuiește Value cu Pooler URL
- **Șterge** vechiul URL (port 5432)
- **Paste** noul URL cu port 6543 (Transaction Pooler)
- **Verifică** că are formatul corect:
  ```
  postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```

### 6. Verifică Environment Selection
- Asigură-te că **Production**, **Preview**, și **Development** sunt **bifate**
- Dacă nu sunt, **bifează-le** pe toate

### 7. Salvează
- Click pe **"Save"** sau **"Update"**
- Confirmă dacă apare un dialog

### 8. Redeploy pe Vercel
- Vercel ar trebui să facă **auto-redeploy** sau
- Manual: mergi la **"Deployments"** → Click pe **"..."** pe ultimul deployment → **"Redeploy"**
- Sau simplu: fă un **push nou pe GitHub** (Vercel va detecta automat)

---

## Verificare după actualizare:

După ce ai actualizat variabila de mediu și Vercel a făcut redeploy:

1. **Așteaptă 1-2 minute** pentru ca redeploy-ul să se finalizeze

2. **Testează API-ul**:
   ```
   https://sofimar-serv.vercel.app/api/test
   ```

3. **Ar trebui să vezi**:
   ```json
   {
     "status": "ok",
     "use_supabase": true,
     "db_type": "supabase",
     "database": {
       "connected": true,
       "type": "supabase"  ← Ar trebui să fie "supabase", nu "sqlite"
     }
   }
   ```

4. **Verifică logs-urile** în Vercel:
   - Dashboard > Deployments > (ultimul deployment) > Functions > `api/index.py` > "View Function Logs"
   - Când accesezi `/api/test`, ar trebui să vezi:
     - `"Resolved ... to IPv4: ..."` (dacă rezolvarea funcționează)
     - SAU conexiunea ar trebui să funcționeze direct cu pooler URL

---

## Diferența dintre URL-uri:

### ❌ Vechi (Direct Connection - IPv6):
```
postgresql://postgres.[PROJECT]:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```
- Port: **5432**
- Problema: IPv6, nu funcționează pe Vercel

### ✅ Nou (Transaction Pooler - IPv4):
```
postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```
- Port: **6543**
- Avantaj: IPv4, funcționează pe Vercel

---

## Dacă tot nu funcționează:

1. **Verifică din nou URL-ul** - asigură-te că este exact Connection Pooler (Transaction Mode)
2. **Verifică că variabila este setată** pentru Production/Preview/Development
3. **Verifică logs-urile** pentru erori
4. **Așteaptă** să se finalizeze redeploy-ul complet

---

## Notă:

După actualizarea variabilei de mediu, Vercel va face redeploy automat pentru a aplica noile variabile. Aceasta poate dura 1-2 minute.

