# 🔧 Fix pentru Problema IPv6 cu Supabase pe Vercel

## Problema:
Vercel nu suportă conexiuni IPv6 pentru PostgreSQL. Supabase folosește IPv6 pentru conexiunile directe (port 5432).

## Soluția:
Folosește **Supabase Connection Pooler** (Supavisor) care suportă IPv4.

---

## Pași pentru a obține Connection Pooler URL:

### 1. Mergi la Supabase Dashboard
- https://supabase.com/dashboard
- Selectează proiectul tău

### 2. Mergi la Settings → Database
- Click pe **"Settings"** în sidebar-ul stâng
- Click pe **"Database"** în submeniu

### 3. Găsește "Connection Pooling"
- Scroll down până vezi **"Connection Pooling"** sau **"Supavisor"**
- Vei vedea două opțiuni:
  - **Transaction mode** (port 6543) - Recomandat pentru serverless
  - **Session mode** (port 6543) - Alternativ

### 4. Copiază Connection String pentru Pooler

#### Pentru Transaction Mode (Recomandat pentru Vercel):
- Connection String arată așa:
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **NU** folosi port 5432 (acela este direct, IPv6)
- **FOLOSEȘTE** port 6543 (pooler, IPv4)

#### Formatul exact:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 5. Actualizează SUPABASE_DB_URL în Vercel
- Mergi la **Vercel Dashboard** > **Settings** > **Environment Variables**
- Găsește `SUPABASE_DB_URL`
- **Editează** și înlocuiește cu Connection Pooler URL (port 6543)
- Asigură-te că are `?pgbouncer=true` la sfârșit
- Bifează pentru **Production, Preview, Development**
- **Salvează**

### 6. Redeploy pe Vercel
- Vercel ar trebui să facă auto-deploy sau
- Manual: mergi la **Deployments** > **Redeploy**

---

## Diferența dintre Connection Strings:

### ❌ Direct Connection (IPv6, NU funcționează pe Vercel):
```
postgresql://postgres.[PROJECT]:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```
- Port: **5432**
- Host: `db.[PROJECT].supabase.co`
- **Problema**: Folosește IPv6

### ✅ Pooler Connection (IPv4, FUNCȚIONEAZĂ pe Vercel):
```
postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```
- Port: **6543**
- Host: `aws-0-[REGION].pooler.supabase.com`
- Query param: `?pgbouncer=true`
- **Avantaj**: Folosește IPv4, funcționează pe Vercel

---

## Verificare după modificare:

După ce ai actualizat `SUPABASE_DB_URL` cu pooler URL:

1. Așteaptă 1-2 minute pentru redeploy
2. Testează: `https://sofimar-serv.vercel.app/api/test`
3. Ar trebui să vezi:
   ```json
   {
     "database": {
       "connected": true,
       "type": "supabase"
     }
   }
   ```

---

## Notă Importantă:

**Transaction Mode** este recomandat pentru serverless (Vercel Functions) pentru că:
- Fiecare request este o tranzacție separată
- Conexiunile sunt reutilizate eficient
- Compatibil cu mediul serverless

Dacă ai nevoie de funcții care necesită sesiuni persistente, folosește **Session Mode**, dar pentru API-ul tău actual, Transaction Mode este perfect.

---

## Dacă nu găsești Connection Pooling în Dashboard:

- Verifică că planul tău Supabase suportă Connection Pooling
- Planul gratuit include Connection Pooling
- Dacă tot nu vezi, contactează support-ul Supabase

