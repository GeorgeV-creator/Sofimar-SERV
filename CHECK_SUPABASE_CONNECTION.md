# ✅ Cum să verifici conexiunea la Supabase

## Verificări Imediate:

### 1. Verifică în Vercel Dashboard > Functions

1. Mergi la **https://vercel.com/dashboard**
2. Selectează proiectul **Sofimar-SERV**
3. Click pe **Functions** (în bara de navigare de sus)
4. **Întrebare**: Vezi `api/index.py` listat în lista de functions?

   - ✅ **DA** → Funcția este detectată, problema este altundeva
   - ❌ **NU** → Vercel nu detectează funcția Python

### 2. Verifică în Vercel Dashboard > Deployments

1. Mergi la **Deployments**
2. Click pe ultimul deployment (cel mai recent)
3. Click pe **"Functions"** tab
4. **Întrebare**: Vezi `api/index.py` aici?

   - ✅ **DA** → Funcția este deployată
   - ❌ **NU** → Funcția nu este detectată la deploy

### 3. Verifică Build Logs

1. În același deployment, click pe **"Build Logs"**
2. **Caută**:
   - `Installing required dependencies from requirements.txt` → ✅ OK
   - `No Python version specified` → ✅ OK (folosește 3.12)
   - Erori de sintaxă sau import → ❌ PROBLEMĂ

### 4. Verifică Runtime Logs

1. Mergi la **Functions** > `api/index.py` > **"View Function Logs"**
2. Fă un request: `https://sofimar-serv.vercel.app/api/test`
3. **Caută în logs**:
   - Apare vreun log? → Da/No
   - Erori? → Ce erori?
   - Mesaje despre Supabase? → Da/No

### 5. Verifică Environment Variables

1. Mergi la **Settings** > **Environment Variables**
2. **Verifică**:
   - `SUPABASE_URL` există? → Da/No
   - `SUPABASE_SERVICE_KEY` există? → Da/No  
   - `SUPABASE_DB_URL` există? → Da/No
   - Toate sunt bifate pentru **Production, Preview, Development**? → Da/No

### 6. Test Conexiune Supabase Direct

Dacă vrei să testezi direct conexiunea la Supabase (fără Vercel):

1. Deschide terminal local
2. Rulează:
   ```bash
   export SUPABASE_DB_URL="postgresql://postgres.xxxxx:PAROLA@db.xxxxx.supabase.co:5432/postgres"
   python3 -c "import psycopg2; conn = psycopg2.connect('$SUPABASE_DB_URL'); print('✅ Connected!')"
   ```
3. Dacă funcționează → conexiunea Supabase este OK
4. Dacă nu funcționează → problema este cu `SUPABASE_DB_URL`

## Ce să-mi spui:

După ce verifici toate cele de mai sus, spune-mi:

1. ✅/❌ `api/index.py` apare în Functions?
2. ✅/❌ Apare în deployment Functions tab?
3. ✅/❌ Există erori în Build Logs?
4. ✅/❌ Apare ceva în Runtime Logs când accesezi `/api/test`?
5. ✅/❌ Toate cele 3 variabile de mediu sunt setate?

Cu aceste informații pot identifica exact problema! 🔍


