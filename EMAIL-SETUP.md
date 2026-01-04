# Configurare Email Yahoo Mail

Pentru a trimite email-uri automat prin Yahoo Mail, urmează acești pași:

## 1. Creează o App Password pentru Yahoo Mail

1. Mergi la https://login.yahoo.com/account/security
2. Autentifică-te cu contul Yahoo
3. Activează **Verificarea în doi pași** (2-Step Verification) dacă nu este deja activată
4. Scroll down și găsește secțiunea **App passwords** (Parole pentru aplicații)
5. Click pe **Generate app password** sau **Manage app passwords**
6. Selectează **Mail** sau **Other app**
7. Introdu un nume (ex: "Sofimar SERV API")
8. Click **Generate**
9. Copiază parola generată (16 caractere, fără spații)

**Notă**: Dacă nu vezi opțiunea App passwords, asigură-te că:
- Verificarea în doi pași este activată
- Folosești versiunea nouă a interfeței Yahoo Account

## 2. Configurează Credentialele

### Opțiunea 1: Variabile de mediu (Recomandat)

```bash
export YAHOO_USER="your-email@yahoo.com"
export YAHOO_PASSWORD="your-16-char-app-password"
```

### Opțiunea 2: Editează direct în api_server.py

Deschide `api_server.py` și actualizează:

```python
YAHOO_USER = 'your-email@yahoo.com'
YAHOO_PASSWORD = 'your-16-char-app-password'
```

⚠️ **ATENȚIE**: Nu comite aceste date în git! Sunt deja în `.gitignore`.

## 3. Repornește API Server-ul

După configurare, oprește și repornește serverul:

```bash
# Oprește serverul (Ctrl+C)
# Apoi repornește:
bash start-server.sh
```

## 4. Testează

1. Deschide admin panel
2. Click pe "Răspunde" la un mesaj
3. Completează subiectul și mesajul
4. Click "Trimite Email"
5. Verifică dacă email-ul a fost trimis cu succes

## Troubleshooting

### Eroare: "Yahoo authentication failed"
- Verifică dacă ai folosit App Password, nu parola normală
- Asigură-te că verificarea în doi pași este activată
- Verifică dacă adresa de email este corectă (trebuie să fie @yahoo.com, @yahoo.ro, etc.)
- Încearcă să generezi o nouă App Password

### Eroare: "Failed to send email"
- Verifică dacă API server-ul rulează pe portul 8001
- Verifică conexiunea la internet
- Verifică dacă credentialele sunt corecte

### Email-urile nu ajung
- Verifică folderul Spam
- Verifică dacă adresa destinatarului este validă
- Verifică log-urile serverului pentru erori
