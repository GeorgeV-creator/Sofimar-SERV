# Ghid pentru Emulator de Telefon

## Opțiunea 1: iOS Simulator (Recomandat pentru Mac) ⭐

### Instalare:
1. Deschide **App Store**
2. Caută **"Xcode"**
3. Click **"Get"** sau **"Install"** (este gratuit, dar mare ~12GB)
4. După instalare, deschide Xcode o dată pentru a accepta licența

### Utilizare:
```bash
# Deschide iOS Simulator
open -a Simulator

# Sau din Xcode: Xcode → Open Developer Tool → Simulator
```

### Accesare site în simulator:
1. Pornește serverul local: `./start-server.sh`
2. În Simulator, deschide Safari
3. Accesează: `http://localhost:8000`

---

## Opțiunea 2: Android Emulator (Android Studio)

### Instalare:
1. Descarcă **Android Studio** de pe [developer.android.com](https://developer.android.com/studio)
2. Instalează Android Studio
3. La prima deschidere, instalează Android SDK și un emulator

### Utilizare:
1. Deschide Android Studio
2. Tools → Device Manager → Create Device
3. Alege un device (ex: Pixel 5)
4. Pornește emulatorul
5. Deschide Chrome în emulator și accesează site-ul

---

## Opțiunea 3: Emulator Online (Rapid) 🌐

### BrowserStack (Gratuit trial):
1. Mergi pe [browserstack.com](https://www.browserstack.com)
2. Creează cont gratuit
3. Upload site-ul sau folosește URL-ul local
4. Testează pe device-uri reale în cloud

### Responsively App (Desktop):
1. Descarcă de pe [responsively.app](https://responsively.app)
2. Instalează aplicația
3. Deschide site-ul în app
4. Vezi toate device-urile simultan

---

## Opțiunea 4: Chrome DevTools (Cel mai rapid) ⚡

1. Deschide site-ul în Chrome
2. Apasă `Cmd + Shift + I` (Mac) sau `F12` (Windows)
3. Click pe iconița telefon/tabletă sau `Cmd + Shift + M`
4. Selectează device-ul dorit

---

## Server Local

Am creat un script `start-server.sh` care pornește un server local.

### Utilizare:
```bash
cd /Users/georgevatasoiu/site
./start-server.sh
```

Apoi accesează `http://localhost:8000` în emulator sau browser.


