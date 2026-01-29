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
