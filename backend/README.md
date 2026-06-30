# GlowHer — Backend

Express + MongoDB API for the GlowHer app. Base path: `/api/v1`.

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm start              # http://localhost:8080
```

Seed the exercise library once after the server is running:

```bash
curl -X POST http://localhost:8080/api/v1/exercises/seed
```

## Environment variables

Copy from `.env.example`:

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `AT_SECRET` | JWT access token secret |
| `RT_SECRET` | JWT refresh token secret |
| `CLOUDINARY_*` | Profile photo uploads |
| `GEMINI_API_KEY` | AI plan generation & calorie estimates |

`PORT` defaults to `8080` (Render sets this automatically).

## Auth

Protected routes need `Authorization: Bearer <accessToken>`.

- Register / login → receive `accessToken` + `refreshToken`
- Refresh with `POST /api/v1/auth/refresh-token` `{ "refreshToken": "..." }`

## Main routes

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /auth/register`, `/auth/login`, `/auth/refresh-token` |
| **Exercises** | `GET /exercises`, `GET /exercises/:id`, `POST /exercises/seed` |
| **Plans** | `POST /workout-plans/generate`, `GET /workout-plans/:id` |
| **Logs** | `POST /workout-logs`, `DELETE /workout-logs/plan/:planId/day/:dayNumber`, `GET /workout-logs/plan/:planId`, `GET /workout-logs/weekly-ranking` |
| **Profile** | `GET/PUT /users/profile`, `POST /users/profile/upload`, `POST /users/favorites/toggle`, `POST /users/saved-plans`, `DELETE /users/saved-plans/:planId` |

All responses: `{ "success": boolean, "message": string, "data": ... }`.
