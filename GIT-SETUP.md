# Git Setup Instructions

## Push to GitHub

Proiectul este pregătit pentru push. Pentru a trimite codul pe GitHub:

### Opțiunea 1: HTTPS (va cere username și password/token)

```bash
cd /Users/georgevatasoiu/site
git push -u origin main
```

**Notă**: Dacă ai 2FA activat pe GitHub, trebuie să folosești un Personal Access Token în loc de parolă.
Creează un token la: https://github.com/settings/tokens

### Opțiunea 2: SSH (recomandat)

1. Configurează SSH key pentru GitHub (dacă nu ai deja):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Adaugă cheia publică în GitHub Settings > SSH and GPG keys
   ```

2. Schimbă remote-ul la SSH:
   ```bash
   git remote set-url origin git@github.com:GeorgeV-creator/Sofimar-SERV.git
   git push -u origin main
   ```

## Fișiere Protejate

Următoarele fișiere NU sunt incluse în git (din motive de securitate):
- `api_server.py` - conține credențiale Yahoo
- `test_yahoo_smtp.py` - conține credențiale Yahoo
- `messages.json` - conține date personale
- `chatbot_messages.json` - conține date personale

Un template `api_server.py.template` este inclus pentru referință.

## Configurare Locală

După clone, copiază template-ul:
```bash
cp api_server.py.template api_server.py
# Apoi editează api_server.py și adaugă credențialele tale
```
