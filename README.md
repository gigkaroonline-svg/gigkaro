# GigKaro — Kaam Karo. Kamao.

Pincode-first Indian gig hiring monorepo: Next.js frontend + Express/MongoDB API.

## Structure

```text
frontend/   Next.js 16 App Router (React, TypeScript, Tailwind)
backend/    Express + Mongoose REST API
```

kl

## Prerequisites

- Node.js 20.9+
- MongoDB optional for local demo: set `backend/.env` `MONGODB_URI=memory` (default) to use an in-memory server. For persistence use `mongodb://127.0.0.1:27017/gigkaro`.

## Run

```sh
# API (port 5000)
cd backend && npm install && npm run seed && npm run dev

# Frontend (port 3000) — separate terminal
cd frontend && npm install && npm run dev
```

From the repo root (after installing each workspace once):

```sh
npm run dev:backend
npm run dev:frontend
```

Demo OTP is `123456` (logged on the API; not sent via SMS).

### Admin access

Admin OTP is only allowed for identifiers listed in `ADMIN_IDENTIFIERS` (comma-separated mobiles/emails in `backend/.env`). Defaults:

```env
ADMIN_IDENTIFIERS=9999999999,admin@gigkaro.local
```

Sign in at `/login?role=admin` with an allowlisted identifier and OTP `123456`. On startup the API bootstraps an admin user for the first identifier if none exists.

### India pincodes

On startup the API loads ~19,000 India pincodes (locality/city/state + coordinates) from `indian-pincode-utils`, with curated demo localities (e.g. Koramangala 560034) overlaid from the taxonomy catalog. Location search, nearest, and job radius filters all use this catalog.

Public endpoints:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/locations/search?q=` | Autocomplete (pincode or place name) |
| GET | `/api/locations/nearest?lat=&lng=` | Nearest pincode for “use my location” |
| GET | `/api/locations/:pincode` | Exact pincode lookup |

Home search uses autocomplete against this directory (not the old 11-demo list).

## API

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/request-otp`, `POST /api/auth/verify-otp`, `GET /api/auth/me` |
| Jobs | `GET /api/jobs`, `GET /api/jobs/:slug`, `GET /api/jobs/pincode/:pincode` (public list is Active-only) |
| Locations | `/api/locations/search`, `/nearest`, `/:pincode` |
| Candidate | applications (incl. guest `POST /api/applications/public`), saved, profile |
| Admin | `/api/admin/*` (Bearer + `role: admin`): analytics, **post/moderate jobs**, applications, users, companies, categories, taxonomy |

Admin-posted jobs default to `showEverywhere: true`, so they appear in public search for **every** location/pincode. Seeded catalog jobs stay location-scoped.

## Frontend notes

Candidate and admin portals talk to the API (`NEXT_PUBLIC_API_URL`). Employer workspace remains on the local demo store for now.

## Verification

```sh
cd frontend && npm run typecheck && npm test
cd backend && npm run typecheck
```
