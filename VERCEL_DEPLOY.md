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

## Notă importantă:

- Baza de date SQLite (`site.db`) va fi stocată în `/tmp` pe Vercel
- Datele se vor reseta la fiecare redeploy (Vercel are filesystem efemer)
- Pentru persistență permanentă, recomand să folosești un serviciu extern de bază de date (ex: Supabase, PlanetScale, etc.)

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


