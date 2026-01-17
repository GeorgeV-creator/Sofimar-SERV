# Deploy pe Vercel

## Pași pentru deploy:

1. **Instalează Vercel CLI** (dacă nu ai deja):
   ```bash
   npm i -g vercel
   ```

2. **Login în Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy proiectul**:
   ```bash
   vercel
   ```
   
   Sau pentru producție:
   ```bash
   vercel --prod
   ```

4. **Configurare variabile de mediu** (opțional, pentru Google Reviews):
   - Mergi pe dashboard-ul Vercel
   - Selectează proiectul
   - Mergi la Settings > Environment Variables
   - Adaugă:
     - `GOOGLE_PLACES_API_KEY` - API key-ul tău Google Places
     - `GOOGLE_PLACE_ID` - Place ID-ul locației tale

## ⚠️ PROBLEMĂ IMPORTANTĂ - SQLite pe Vercel:

**SQLite NU funcționează persistent pe Vercel** pentru că:
- Filesystem-ul `/tmp` se resetează la fiecare invocation/serverless call
- Datele nu persistă între invocations
- Baza de date va fi goală de fiecare dată când se face un request

### Soluții pentru persistență:

**Opțiunea 1: Vercel KV (RECOMANDAT - GRATUIT)**
- Mergi la Vercel Dashboard > Storage > Create > KV
- Creează un store KV
- Instalează: `npm install @vercel/kv`
- Adaptează codul să folosească KV în loc de SQLite

**Opțiunea 2: Supabase (GRATUIT)**
- Creează un cont gratuit pe https://supabase.com
- Conectează baza de date PostgreSQL
- Adaptează codul să folosească Supabase

**Opțiunea 3: Servicii Cloud**
- PlanetScale (MySQL) - plan gratuit disponibil
- MongoDB Atlas - plan gratuit disponibil
- PostgreSQL pe Railway/Render - planuri gratuite

**PENTRU TESTARE LOCALĂ**: Codul funcționează perfect cu SQLite local.

## Structura API:

Toate endpoint-urile API sunt disponibile la:
- `https://your-domain.vercel.app/api/messages`
- `https://your-domain.vercel.app/api/certificates`
- `https://your-domain.vercel.app/api/partners`
- etc.

## Troubleshooting:

Dacă primești erori "server not available":
1. Verifică că `api/index.py` există
2. Verifică că `vercel.json` este configurat corect
3. Verifică logs-urile în Vercel Dashboard > Functions


