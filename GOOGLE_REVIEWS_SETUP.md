# Configurare Recenzii Google

Pentru a sincroniza recenziile de pe Google în site, trebuie să configurezi Google Places API.

## Pași pentru configurare:

### 1. Obține Google Places API Key

1. Mergi la [Google Cloud Console](https://console.cloud.google.com/)
2. Creează un proiect nou sau selectează unul existent
3. Activează **Places API**:
   - Mergi la "APIs & Services" > "Library"
   - Caută "Places API"
   - Click pe "Enable"
4. Creează un API Key:
   - Mergi la "APIs & Services" > "Credentials"
   - Click pe "Create Credentials" > "API Key"
   - Copiază API key-ul

### 2. Obține Place ID

1. Mergi pe [Google Maps](https://www.google.com/maps)
2. Caută locația ta de business (ex: "Sofimar Nicoflor Serv")
3. Click pe locația ta
4. În sidebar, scroll jos până vezi "Share" sau click dreapta pe marker
5. Place ID-ul se găsește în URL sau poți folosi [Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)

### 3. Configurează variabilele de mediu

Adaugă următoarele variabile de mediu înainte de a porni serverul:

```bash
export GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"
export GOOGLE_PLACE_ID="YOUR_PLACE_ID_HERE"
```

Sau creează un fișier `.env` (dacă folosești python-dotenv) sau modifică `start-server.sh`:

```bash
#!/bin/bash
export GOOGLE_PLACES_API_KEY="YOUR_API_KEY_HERE"
export GOOGLE_PLACE_ID="YOUR_PLACE_ID_HERE"
python3 api_server.py &
# ... rest of script
```

### 4. Sincronizează recenziile

1. Deschide panoul de admin
2. Mergi la tab-ul "⭐ Recenzii"
3. Click pe butonul "🔄 Sincronizează de pe Google"
4. Recenziile vor fi sincronizate automat în baza de date

### 5. Recenziile se actualizează automat

- La fiecare refresh al paginii, se vor afișa 6 recenzii aleatorii din toate recenziile sincronizate de pe Google
- Poți sincroniza din nou când vrei să actualizezi recenziile

## Notă importantă:

- Google Places API are un cost (primele $200/lună sunt gratuite)
- Recenziile se sincronizează manual prin butonul din admin
- Poți configura un cron job pentru sincronizare automată periodică


