# Sofimar SERV

Site-ul este construit cu **Astro** (output static). API-ul rămâne în Python (`api/index.py`), deploy pe Vercel.

## Develop local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output în `dist/`. Conținutul din `public/` (CSS, JS, images, videos) este copiat în `dist/` la build.

## Deploy (Vercel)

- Conectezi repo-ul la Vercel; build-ul rulează `npm run build` și servește `dist/`.
- Rute: `/` (home), `/certificate`, `/admin`.
- Redirecturi: `/index.html` → `/`, `/certificate.html` → `/certificate`, `/admin.html` → `/admin`.
- API: `/api/*` este rewritat la `api/index.py` (păstrare path via `?path=/$1`).

## Structură

- `src/pages/` – paginile Astro (index, certificate, admin).
- `public/` – styles, scripts, images, videos (servite la root).
- `api/` – serverless Python (Neon/SQLite).

## Troubleshooting Vercel (psycopg2)

Dacă build-ul eșuează cu `psycopg2` / `pg_config` / „building from source”:

1. **Șterge cache-ul de build**: Vercel → Project → Settings → General → **Build Cache** → Clear.
2. **Redeploy** după clear cache.
3. Folosim doar `psycopg2-binary` (nu `psycopg2`) în `requirements.txt` și `api/requirements.txt`; `runtime.txt` = `python-3.12`.
4. **`installCommand`** în `vercel.json`: `pip install -r requirements.txt && npm install` (Vercel folosește pip preinstalat; nu uv).
