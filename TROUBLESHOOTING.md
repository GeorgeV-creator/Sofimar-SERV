# 🔧 Troubleshooting: Supabase pe Vercel

## Ce trebuie să verifici dacă nu funcționează:

### 1. Verifică Variabilele de Mediu în Vercel

1. Mergi în **Vercel Dashboard** > Proiectul tău > **Settings** > **Environment Variables**
2. Verifică că ai **EXACT** aceste 3 variabile (nu altele):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` 
   - `SUPABASE_DB_URL`

3. Verifică că:
   - ✅ Toate sunt bifate pentru **Production, Preview, Development**
   - ✅ Valorile sunt corecte (fără spații înainte/după)
   - ✅ `SUPABASE_DB_URL` are parola reală (nu `[YOUR-PASSWORD]`)

### 2. Verifică Logs în Vercel

1. Mergi în **Vercel Dashboard** > Proiectul tău > **Functions**
2. Click pe `api/index.py`
3. Click pe **"View Function Logs"**
4. Caută mesaje care încep cu:
   - `🔍 Database config:` - arată ce variabile sunt detectate
   - `✅ Supabase tables initialized` - succes
   - `⚠️ Supabase` - avertisment (tabele există deja)
   - `❌` sau `error` - eroare

### 3. Erori Comune și Soluții

#### "psycopg2 not available"
**Cauză**: `requirements.txt` nu este detectat sau `psycopg2-binary` nu este instalat.

**Soluție**:
- Verifică că `requirements.txt` există în root-ul proiectului
- Verifică că conține: `psycopg2-binary==2.9.9`
- Redeploy proiectul

#### "Supabase connection error"
**Cauză**: `SUPABASE_DB_URL` este incorect sau parola este greșită.

**Soluție**:
- Verifică că `SUPABASE_DB_URL` arată așa:
  ```
  postgresql://postgres.xxxxx:PASSWORD@db.xxxxx.supabase.co:5432/postgres
  ```
- Verifică că `PASSWORD` este parola reală (nu `[YOUR-PASSWORD]`)
- Verifică că connection string-ul nu are spații

#### "USE_SUPABASE=False" în logs
**Cauză**: Una sau mai multe variabile de mediu lipsesc.

**Soluție**:
- Verifică că toate cele 3 variabile sunt setate
- Verifică că numele variabilelor sunt **EXACT** ca mai sus (nu `SUPABASE_KEY`, ci `SUPABASE_SERVICE_KEY`)

#### "Tables not created"
**Cauză**: Tabelele nu s-au creat automat.

**Soluție**:
- Fă un request la API (ex: accesează admin panel)
- Tabelele se creează la primul request
- Sau verifică manual în Supabase Dashboard > Table Editor

### 4. Test Rapid

Testează dacă Supabase funcționează:

1. Accesează: `https://your-project.vercel.app/api/certificates`
2. Ar trebui să returneze: `[]` (lista goală) sau date existente
3. Dacă vezi eroare, verifică logs-urile

### 5. Verificare Manuală în Supabase

1. Mergi în **Supabase Dashboard** > **Table Editor**
2. Ar trebui să vezi tabelele create automat
3. Dacă nu există, tabelele se vor crea la primul request API

### 6. Reset Complet (dacă nimic nu funcționează)

1. **Șterge toate variabilele de mediu** din Vercel
2. **Redeploy proiectul** (pentru a șterge cache-ul)
3. **Adaugă din nou variabilele** (verifică că sunt corecte)
4. **Redeploy din nou**

### 7. Verifică Connection String-ul

Connection string-ul Supabase ar trebui să arate așa:
```
postgresql://postgres.xxxxx:PAROLA_TA_AICI@db.xxxxx.supabase.co:5432/postgres
```

**NU** așa:
```
postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
postgresql://postgres:@db.xxxxx.supabase.co:5432/postgres
```

### 8. Contactează-mă

Dacă nimic nu funcționează, trimite-mi:
1. Screenshot din Vercel > Functions > Logs
2. Screenshot din Vercel > Settings > Environment Variables (ascunde valorile sensibile!)
3. Mesajul exact al erorii

