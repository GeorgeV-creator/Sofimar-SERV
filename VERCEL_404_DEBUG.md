# 🔍 Debugging 404 NOT_FOUND pe Vercel

## Verificări Pas cu Pas:

### 1. Verifică că funcția Python este detectată

În **Vercel Dashboard**:
1. Mergi la **Functions** (în bara de navigare)
2. Ar trebui să vezi `api/index.py` listat
3. Dacă **NU apare**, Vercel nu detectează funcția

### 2. Verifică Build Logs

În **Vercel Dashboard**:
1. Mergi la **Deployments**
2. Click pe ultimul deployment
3. Click pe **Build Logs**
4. Caută erori sau avertismente

### 3. Verifică Runtime Logs

În **Vercel Dashboard**:
1. Mergi la **Functions** > `api/index.py`
2. Click pe **"View Function Logs"**
3. Fă un request la `https://sofimar-serv.vercel.app/api/test`
4. Verifică dacă apar logs sau erori

### 4. Testează URL-uri diferite

Încearcă:
- `https://sofimar-serv.vercel.app/api/test`
- `https://sofimar-serv.vercel.app/api/index.py` (direct la fișier)
- `https://sofimar-serv.vercel.app/api/` (fără endpoint)

### 5. Verifică variabilele de mediu

În **Vercel Dashboard** > **Settings** > **Environment Variables**:
- ✅ `SUPABASE_URL` există?
- ✅ `SUPABASE_SERVICE_KEY` există?
- ✅ `SUPABASE_DB_URL` există?
- ✅ Toate sunt bifate pentru **Production, Preview, Development**?

### 6. Verifică structura proiectului

Proiectul trebuie să aibă:
```
site/
  ├── api/
  │   └── index.py          ✅ Trebuie să existe
  ├── requirements.txt       ✅ Trebuie să existe
  ├── index.html
  └── ... (alte fișiere)
```

### 7. Test local (opțional)

Dacă ai Vercel CLI instalat:
```bash
vercel dev
```

## Ce să verifici exact:

1. **În Vercel Dashboard > Functions**: Apare `api/index.py`?
2. **În Build Logs**: Există erori de build?
3. **În Runtime Logs**: Apar logs când accesezi API-ul?
4. **Variabile de mediu**: Sunt setate corect?

## Dacă tot primești 404:

**Posibile cauze:**
- Funcția nu este detectată de Vercel
- Există o eroare de sintaxă care blochează handler-ul
- Ruta nu este configurată corect

**Soluție temporară**: Verifică dacă există `vercel.json` și șterge-l dacă există (Vercel detectează automat funcțiile Python din `api/`)


