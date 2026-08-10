# Fantasy Soccer Manager

A full-stack fantasy soccer manager built for the Toptal technical assessment.

**Stack:** Rails 8.1 API · PostgreSQL 15 · React Native (Expo SDK 54) · JWT auth

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Node.js 18+](https://nodejs.org/) and npm
- [Expo Go](https://expo.dev/go) on your iOS or Android device (or an emulator)

---

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/hassan-khattak/fantasy-soccer-manager.git
cd fantasy-soccer-manager
```

Create the mobile env file:
```bash
cp mobile/.env.example mobile/.env
# Edit mobile/.env and set EXPO_PUBLIC_API_URL to your machine's LAN IP:
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000/api/v1
```

### 2. Start the API

```bash
docker compose up
# First run takes ~60s to build and migrate.
# API is ready when you see: "Listening on http://0.0.0.0:3000"
```

### 3. Seed demo data

```bash
make seed
# Creates 3 users (dev1@example.com, dev2@example.com, dev3@example.com)
# Password: password123
# Each user has a team with 20 players and 3 active transfer listings.
```

### 4. Run the mobile app

```bash
cd mobile
npm install
npx expo start -c
# Scan the QR code with Expo Go on your device.
```

---

## Running Tests

```bash
make test
# Runs the full RSpec suite inside Docker.
# Expected: 132 examples, 0 failures.
```

Run a specific spec:
```bash
docker compose run --rm api bundle exec rspec spec/services/transfer_service_spec.rb
```

TypeScript check:
```bash
cd mobile && npx tsc --noEmit
```

---

## Postman Collection

Import `Fantasy_Soccer_Manager.postman_collection.json` into Postman.

- `base_url` is pre-set to `http://localhost:3000/api/v1`
- Tokens are auto-saved after Register/Login
- E2E buy flow: Login as dev1 → List Player for Sale → Login as dev2 → GET Transfer Listings → Buy Player → GET /team (see new player)

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `docker-compose.yml` / `api/.env` | PostgreSQL connection string |
| `DEVISE_JWT_SECRET_KEY` | `docker-compose.yml` / `api/.env` | JWT signing secret — change in production |
| `RAILS_ENV` | `docker-compose.yml` / `api/.env` | `development` or `test` |
| `EXPO_PUBLIC_API_URL` | `mobile/.env` | API base URL — must be your machine's LAN IP for Expo Go |

See `api/.env.example` and `mobile/.env.example` for templates.

---

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make setup` | Build Docker images, create + migrate databases |
| `make test` | Run the full RSpec test suite |
| `make seed` | Seed 3 demo users with teams and transfer listings |

---

## Architecture

```
Hassan-khattak/
├── api/          Rails 8.1 API (Docker)
│   ├── app/controllers/api/v1/   — REST endpoints
│   ├── app/models/               — User, Team, Player, TransferListing, Transfer
│   ├── app/services/             — TeamGeneratorService, TransferService, RefreshTokenService
│   └── spec/                     — RSpec request + service + model specs
└── mobile/       React Native (Expo SDK 54)
    └── src/
        ├── api/         — Axios client + typed API calls
        ├── contexts/    — AuthContext (JWT + SecureStore)
        ├── navigation/  — Bottom tabs + stack navigators
        └── screens/     — TeamScreen, PlayerDetailScreen, TransferListScreen, …
```

### Key Design Decisions

| Concern | Decision |
|---------|----------|
| Race-condition-safe buy | `SELECT FOR UPDATE` on listing + buyer_team inside a single transaction |
| Auth | Devise + JWT (1h access token) + opaque refresh token (30d, stored as SHA-256 digest) |
| Money | `decimal(15,2)` — never `float` |
| Transfer history | Append-only `transfers` table — immutable audit log |
| Pagination | Kaminari — all list endpoints return `{ data: [...], meta: { total_count, current_page, total_pages } }` |
