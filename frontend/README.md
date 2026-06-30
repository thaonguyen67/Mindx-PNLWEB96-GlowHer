# GlowHer — Frontend

React + Vite SPA for GlowHer. English / Vietnamese (toggle in navbar).

## Setup

```bash
npm install
npm run dev    # http://localhost:5173
```

Requires the backend running on port **8080** (or set `VITE_API_URL` — see below).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |

## Environment

Optional `.env.local` (see `.env.example`):

```
VITE_API_URL=http://localhost:8080/api/v1
```

On Render, set `VITE_API_URL` to your deployed API URL (e.g. `https://glowher-api.onrender.com/api/v1`).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/exercises` | Exercise library with filters |
| `/generate-plan` | AI workout plan generator |
| `/dashboard` | Saved plans, day logging, weekly ranking |
| `/profile` | Account, saved plans, favorites |
| `/login`, `/register` | Auth |

Static assets live in `public/` (e.g. `public/images/hero.jpg`).
