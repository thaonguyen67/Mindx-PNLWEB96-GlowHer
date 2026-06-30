# GlowHer

Bilingual (English / Vietnamese) strength-training web app for women. Browse exercises, generate AI workout plans, log sessions, and track weekly calorie ranking.

## Features

- **Auth** — register / login with JWT
- **Exercise library** — search, filter, favorites, video demos
- **AI plans** — Gemini-generated multi-week plans (save to profile)
- **Dashboard** — log workout days, weekly calorie leaderboard
- **Profile** — edit details, upload photo (Cloudinary), manage saved plans & favorites

Language toggle (EN | VI) in the navbar.

## Project structure

```
glowher/
├── backend/     Express + MongoDB API (port 8080)
└── frontend/    React + Vite SPA (port 5173)
```

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for details.

## Local development

**1. Backend**

```bash
cd backend
npm install
cp .env.example .env    # add MongoDB URI, secrets, API keys
npm start
curl -X POST http://localhost:8080/api/v1/exercises/seed
```

**2. Frontend** (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Deploy (Render)

1. Push this repo to GitHub (never commit `backend/.env`).
2. **Web Service** — root `backend`, build `npm install`, start `npm start`. Add env vars from `.env.example`.
3. **Static Site** — root `frontend`, build `npm install && npm run build`, publish `dist`.
4. Set `VITE_API_URL=https://your-api.onrender.com/api/v1` on the static site.
5. Add SPA rewrite: `/*` → `/index.html`.
6. Seed exercises once on the live API.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, React Router, axios, react-i18next |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Services | Google Gemini (plans & calories), Cloudinary (photos) |

## License

© 2026 GlowHer
