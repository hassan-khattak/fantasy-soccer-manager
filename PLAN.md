# Fantasy Soccer Manager — Project Plan

> **Status:** Planning  
> **Author:** Hassan Khattak  
> **Last Updated:** 2026-06-23  
> **Assessment:** Toptal Fantasy Soccer Manager  
> **Deadline:** 7 days from receipt

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Database Schema](#3-database-schema)
4. [API Contract](#4-api-contract)
5. [Slice 1 — Scaffolding + Auth](#slice-1--scaffolding--auth)
6. [Slice 2 — Team & Players (Read)](#slice-2--team--players-read)
7. [Slice 3 — Edit Team & Players](#slice-3--edit-team--players)
8. [Slice 4 — Transfer Listing (Sell)](#slice-4--transfer-listing-sell)
9. [Slice 5 — Transfer Market (Buy)](#slice-5--transfer-market-buy)
10. [Slice 6 — Polish & Production Hardening](#slice-6--polish--production-hardening)
11. [Testing Strategy](#11-testing-strategy)
12. [Technical Traps & Mitigations](#12-technical-traps--mitigations)
13. [Scalability & Maintainability Notes](#13-scalability--maintainability-notes)

---

## 1. Architecture Decisions

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Backend framework | Ruby on Rails 7 (API mode) | Fast CRUD, ActiveRecord handles relations + transactions cleanly |
| Database | PostgreSQL 15 | Relational integrity, partial unique indexes, `SELECT FOR UPDATE` support |
| Auth | Devise + devise-jwt | JWT stateless tokens — correct for mobile APIs. `jti` column enables logout/revocation |
| Email verification | None (instant login) | Not required by spec; can be added later |
| Mobile | React Native (Expo managed workflow) | Same RN code, zero Xcode/Android Studio setup for reviewer — `npx expo start` just works |
| API style | REST | Simpler, widely understood, no GraphQL overhead for this scope |
| Serialization | Jbuilder (view templates + partials) | Renders the custom response shapes directly (no JSON:API envelope to fight); computed fields (`team_value`, `age`, `is_listed`) are one-liners; a shared `_player` partial keeps the player shape consistent across `/team` and `/transfer_listings`; tested via request specs |
| Repo structure | Monorepo (`api/` + `mobile/`) | Single git history, easier for reviewer to run |
| Containerization | Docker + docker-compose | Reviewer runs `docker-compose up` — zero setup friction |
| Player generation | Faker gem | Realistic names + countries, already in Rails ecosystem. Goals populated with `rand(0..200)` |
| Money storage | `decimal(15,2)` NOT `float` | Floating point arithmetic is unsafe for currency |
| Transfer model | Instant (buy = immediate) | Spec implies this; no pending/confirm window |
| Self-buy | Blocked at API level | Logical constraint; validated in service layer |
| Transfer history | Append-only `transfers` table | Immutable audit log; source of truth for player history screen |
| Service objects | Yes — `TransferService` for buy flow | Complex multi-step mutation deserves its own class |
| Pagination | `kaminari` gem | Transfer list is paginated (confirmed in UI boilerplate) |
| Background jobs | None required by spec | All operations are synchronous |
| Developer UX | `Makefile` | `make setup`, `make test`, `make seed` — reduces reviewer friction beyond docker-compose |
| Env config | `.env.example` + `EXPO_PUBLIC_API_URL` | API base URL in Expo env, no hardcoded IPs |

---

## 2. Monorepo Structure

```
fantasy-soccer/
├── api/                          # Rails 7 API
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── application_controller.rb
│   │   │   └── api/
│   │   │       └── v1/
│   │   │           ├── auth/
│   │   │           │   ├── registrations_controller.rb
│   │   │           │   └── sessions_controller.rb
│   │   │           ├── teams_controller.rb
│   │   │           ├── players_controller.rb
│   │   │           ├── transfer_listings_controller.rb
│   │   │           └── transfers_controller.rb
│   │   ├── models/
│   │   │   ├── user.rb
│   │   │   ├── team.rb
│   │   │   ├── player.rb
│   │   │   ├── transfer_listing.rb
│   │   │   └── transfer.rb
│   │   ├── services/
│   │   │   ├── team_generator_service.rb   # generates 20 players on signup
│   │   │   └── transfer_service.rb         # buy flow with locking + transaction
│   │   └── views/
│   │       └── api/
│   │           └── v1/
│   │               ├── teams/
│   │               │   ├── show.json.jbuilder       # team + team_value + players
│   │               │   └── _team.json.jbuilder      # team shape (id, name, country) — reused
│   │               ├── players/
│   │               │   ├── show.json.jbuilder       # player + transfers
│   │               │   └── _player.json.jbuilder    # canonical player shape — REUSED everywhere
│   │               ├── transfer_listings/
│   │               │   ├── index.json.jbuilder      # { data: [...], meta: {...} }
│   │               │   ├── show.json.jbuilder       # single listing (after create)
│   │               │   └── _listing.json.jbuilder   # renders _player + _team
│   │               └── transfers/
│   │                   └── _transfer.json.jbuilder  # history entry (from/to team, price, value)
│   ├── config/
│   │   └── routes.rb
│   ├── db/
│   │   ├── migrate/
│   │   └── schema.rb
│   ├── spec/                               # RSpec tests
│   │   ├── models/
│   │   ├── requests/                       # API integration tests
│   │   └── services/                       # Unit tests for service objects
│   ├── Gemfile
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── mobile/                       # React Native (bare)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts         # Axios instance + interceptors
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # JWT storage + auth state
│   │   ├── navigation/
│   │   │   ├── RootNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   └── AppNavigator.tsx  # Bottom tab: Team | Transfer List
│   │   ├── screens/
│   │   │   ├── LandingScreen.tsx
│   │   │   ├── SignInScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   ├── TeamScreen.tsx
│   │   │   ├── TeamEditorScreen.tsx
│   │   │   ├── PlayerDetailScreen.tsx
│   │   │   ├── TransferListScreen.tsx
│   │   │   ├── SelectPlayerScreen.tsx
│   │   │   └── CreateTransferOfferScreen.tsx
│   │   ├── components/           # Shared UI components
│   │   │   ├── PlayerCard.tsx
│   │   │   ├── TransferOfferCard.tsx
│   │   │   └── CurrencyDisplay.tsx
│   │   └── types/
│   │       └── index.ts          # Shared TypeScript types
│   └── package.json
│
├── PLAN.md                       # This file
├── wireframe.pdf
└── README.md
```

---

## 3. Database Schema

### Tables

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK |
| email | string | NOT NULL, UNIQUE |
| encrypted_password | string | NOT NULL |
| jti | string | NOT NULL, UNIQUE |
| created_at | datetime | |
| updated_at | datetime | |

#### `refresh_tokens`
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK |
| user_id | bigint FK | NOT NULL, INDEX |
| token_digest | string | NOT NULL, UNIQUE (SHA-256 of raw token) |
| expires_at | datetime | NOT NULL |
| revoked_at | datetime | nullable — null means valid |
| created_at | datetime | |

> Raw token is returned to the client once and never stored. Only the SHA-256 digest is persisted — a stolen database reveals nothing usable. On refresh, the raw token is hashed and compared against `token_digest`.  
> Rotation: on every `/auth/refresh` call the old record's `revoked_at` is set and a new row is inserted. Reuse of a revoked token is rejected immediately.

#### `teams`
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK |
| user_id | bigint FK | NOT NULL, UNIQUE, INDEX |
| name | string | NOT NULL |
| country | string | NOT NULL |
| budget | decimal(15,2) | NOT NULL, >= 0 CHECK |
| created_at | datetime | |
| updated_at | datetime | |

> `user_id UNIQUE` enforces one team per user at the database level.

#### `players`
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK |
| team_id | bigint FK | NOT NULL, INDEX |
| first_name | string | NOT NULL |
| last_name | string | NOT NULL |
| country | string | NOT NULL |
| position | string | NOT NULL (`GK`, `DEF`, `MID`, `ATT`) |
| birth_date | date | NOT NULL |
| market_value | decimal(15,2) | NOT NULL, > 0 CHECK |
| goals | integer | DEFAULT 0, nullable |
| created_at | datetime | |
| updated_at | datetime | |

#### `transfer_listings`
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK |
| player_id | bigint FK | NOT NULL, INDEX |
| asking_price | decimal(15,2) | NOT NULL, > 0 CHECK |
| active | boolean | NOT NULL, DEFAULT true |
| created_at | datetime | (= offer date shown in UI) |
| updated_at | datetime | |

> **Partial unique index:** `CREATE UNIQUE INDEX one_active_listing_per_player ON transfer_listings (player_id) WHERE active = true;`  
> This is the database-level guard preventing duplicate active listings even under concurrent requests.

#### `transfers` (append-only audit log)
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigint | PK |
| player_id | bigint FK | NOT NULL, INDEX |
| transfer_listing_id | bigint FK | NOT NULL |
| from_team_id | bigint FK | NOT NULL |
| to_team_id | bigint FK | NOT NULL |
| price | decimal(15,2) | NOT NULL |
| market_value_after | decimal(15,2) | NOT NULL |
| created_at | datetime | (= transfer date shown in UI) |

> No `updated_at` — this table is never updated, only appended to.

### Indexes Summary
```sql
-- users
CREATE UNIQUE INDEX ON users (email);
CREATE UNIQUE INDEX ON users (jti);

-- refresh_tokens
CREATE INDEX ON refresh_tokens (user_id);
CREATE UNIQUE INDEX ON refresh_tokens (token_digest);

-- teams
CREATE UNIQUE INDEX ON teams (user_id);   -- one team per user

-- players
CREATE INDEX ON players (team_id);
CREATE INDEX ON players (team_id, position);

-- transfer_listings
CREATE INDEX ON transfer_listings (player_id);
CREATE UNIQUE INDEX one_active_listing_per_player
  ON transfer_listings (player_id) WHERE (active = true);
CREATE INDEX ON transfer_listings (active);

-- transfers
CREATE INDEX ON transfers (player_id);
CREATE INDEX ON transfers (from_team_id);
CREATE INDEX ON transfers (to_team_id);
```

---

## 4. API Contract

All endpoints under `/api/v1/`. Protected routes require `Authorization: Bearer <jwt>` header.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register + auto-generate team + 20 players. Returns `access_token` (JWT, 1h) + `refresh_token` (opaque, 30d) |
| POST | `/auth/login` | No | Returns `access_token` + `refresh_token` |
| POST | `/auth/refresh` | No (uses refresh token in body) | Validates refresh token, returns new `access_token` + rotated `refresh_token`. Old refresh token is immediately revoked. |
| DELETE | `/auth/logout` | Yes | Revokes current refresh token + rotates `jti` (kills access token) |

#### Auth token response shape
```json
{
  "access_token": "<JWT — expires in 1 hour>",
  "refresh_token": "<opaque 64-char hex — expires in 30 days>",
  "token_type": "Bearer"
}
```

#### `POST /auth/refresh` request body
```json
{ "refresh_token": "<opaque token from previous login/refresh>" }
```

### Team
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/team` | Yes | Current user's team + all players |
| PATCH | `/team` | Yes | Update team name and/or country |

#### `GET /team` response shape
```json
{
  "id": 1,
  "name": "FC Example",
  "country": "Romania",
  "budget": "3500000.00",
  "team_value": "20000000.00",
  "players": [
    {
      "id": 10,
      "first_name": "Carlos",
      "last_name": "Silva",
      "country": "Brazil",
      "position": "GK",
      "birth_date": "1995-04-12",
      "age": 31,
      "market_value": "1000000.00",
      "goals": 42,
      "is_listed": false,
      "active_listing": null
    }
  ]
}
```

> `team.id` is returned so the mobile/web client can identify its own listings (see Buy button logic below).  
> `is_listed` + `active_listing` (`{ id, asking_price }` when present) let the UI hide/disable the **Sell** button on already-listed players and let `SelectPlayerScreen` exclude them. Surfaced via the `has_one :active_listing` association — no extra query when eager-loaded.  
> `age` is derived from `birth_date` server-side for convenience; clients may also compute it.

### Players
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/players/:id` | Yes | Player detail + transfer history |
| PATCH | `/players/:id` | Yes | Update first_name, last_name, country (owner only) |

### Transfer Listings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/transfer_listings` | Yes | All active listings, filterable + paginated |
| POST | `/transfer_listings` | Yes | List own player for sale |
| DELETE | `/transfer_listings/:id` | Yes | Remove own listing |
| POST | `/transfer_listings/:id/buy` | Yes | Buy a player (the critical endpoint) |

#### `GET /transfer_listings` query params
```
player_name    string   partial match on first_name or last_name
team_name      string   partial match on team name
team_country   string   exact match on team country
player_country string   exact match on player country
min_price      decimal  asking_price >= min_price
max_price      decimal  asking_price <= max_price
page           integer  default 1
per_page       integer  default 20, max 100
```

#### `GET /transfer_listings` response shape
```json
{
  "data": [
    {
      "id": 5,
      "asking_price": "2000000.00",
      "created_at": "2026-06-23T14:30:00Z",
      "player": {
        "id": 10,
        "first_name": "Carlos",
        "last_name": "Silva",
        "country": "Brazil",
        "position": "GK",
        "birth_date": "1995-04-12",
        "age": 31,
        "market_value": "1000000.00"
      },
      "team": { "id": 2, "name": "Rival FC", "country": "Spain" }
    }
  ],
  "meta": { "total_count": 50, "current_page": 1, "total_pages": 3 }
}
```

> The card on both web (`transfer-offers.html`) and mobile (`TransferOfferCard`) renders **player country flag, team name, team country flag, position, offer date (`created_at`), and asking price** — so `player.country`, `team.name`, and `team.country` are all required in the payload (also needed for the country/team filters).  
> **Buy button ownership:** `team.id` is returned on every listing; the client compares it against its own `team.id` (from `GET /team`) and hides the **Buy** button on its own listings. Self-buy is also blocked server-side (403).

### HTTP Status Codes (intentional, not generic 400 everything)
| Scenario | Status |
|----------|--------|
| Success create | 201 |
| Success read/update | 200 |
| Unauthenticated | 401 |
| Forbidden (not your resource) | 403 |
| Not found | 404 |
| Validation error | 422 |
| Insufficient budget | 422 |
| Already sold (race condition loser) | 409 |
| Already listed | 409 |

---

## Slice 1 — Scaffolding + Auth

### Goal
Monorepo exists. Rails API boots in Docker. React Native app boots. A user can register and receive a JWT. A user can log in and receive a JWT. A user can log out and have their token revoked.

### Deliverables
**API**
- [ ] `rails new api --api --database=postgresql`
- [ ] Gemfile: `devise`, `devise-jwt`, `rack-cors`, `faker`, `kaminari`, `rspec-rails`, `factory_bot_rails`, `shoulda-matchers`
- [ ] `users` migration with `jti` column
- [ ] `refresh_tokens` migration
- [ ] `User` model with Devise + JWT strategy
- [ ] `RefreshToken` model — `belongs_to :user`, scopes: `active` (not revoked + not expired)
- [ ] `RefreshTokenService` — `issue(user)` generates raw token, stores digest; `rotate(raw_token)` revokes old + issues new; `revoke(raw_token)` for logout
- [ ] `POST /api/v1/auth/register` — creates user, returns access_token + refresh_token
- [ ] `POST /api/v1/auth/login` — returns access_token + refresh_token
- [ ] `POST /api/v1/auth/refresh` — rotates refresh token, returns new pair
- [ ] `DELETE /api/v1/auth/logout` — revokes refresh token + rotates jti
- [ ] CORS configured for `*` origins (development only — tighten for production)
- [ ] `Dockerfile` + `docker-compose.yml` (api + postgres services)
- [ ] `Makefile` with `setup`, `test`, `seed` targets
- [ ] Minimal seed (2 dev users + teams) added now so Slice 2 development doesn't require manual setup

**Mobile**
- [ ] `npx create-expo-app FantasyFC --template expo-template-blank-typescript`
- [ ] Dependencies: `@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs`, `axios`, `@react-native-async-storage/async-storage`, `expo-secure-store`
- [ ] `AuthContext` — stores JWT in AsyncStorage, exposes `login`, `logout`, `register`
- [ ] `RootNavigator` — switches between `AuthNavigator` and `AppNavigator` based on JWT presence
- [ ] `LandingScreen` — logo + Sign In + Register buttons
- [ ] `SignInScreen` — email + password + Sign In button, calls API
- [ ] `RegisterScreen` — email + password + Register button, calls API
- [ ] Axios `client.ts` — base URL from env (`EXPO_PUBLIC_API_URL`), `Authorization: Bearer <access_token>` injected via request interceptor
- [ ] Response interceptor: on 401, silently call `POST /auth/refresh` with stored refresh token → retry original request with new access token → if refresh also fails, logout user
- [ ] `expo-secure-store` for token storage: `access_token` + `refresh_token` both stored encrypted (survives app restarts)
- [ ] `AuthContext` manages in-memory access token + secure-store refresh token; exposes `login`, `logout`, `register`, `refreshTokens`

### BDD Acceptance Criteria

```
Feature: User Registration

  Scenario: Successful registration
    Given a unique email and a valid password
    When POST /api/v1/auth/register is called
    Then the response status is 201
    And the response body contains a JWT token
    And a User record exists in the database
    And a Team record is created for that user
    And the team has exactly 20 players
    And the team has 3 goalkeepers, 6 defenders, 6 midfielders, 5 attackers
    And each player has a market_value of 1_000_000.00
    And the team budget is between 2_000_000.00 and 5_000_000.00

  Scenario: Duplicate email registration
    Given an email that is already registered
    When POST /api/v1/auth/register is called with that email
    Then the response status is 422
    And the response body contains an errors key

  Scenario: Missing fields
    Given a request body with no password
    When POST /api/v1/auth/register is called
    Then the response status is 422

Feature: User Login

  Scenario: Successful login
    Given a registered user with email and password
    When POST /api/v1/auth/login is called with correct credentials
    Then the response status is 200
    And the response body contains a JWT token

  Scenario: Wrong password
    Given a registered user
    When POST /api/v1/auth/login is called with wrong password
    Then the response status is 401

Feature: Token Refresh

  Scenario: Successful refresh
    Given a user with a valid refresh token
    When POST /api/v1/auth/refresh is called with that refresh token
    Then the response status is 200
    And the response contains a new access_token and a new refresh_token
    And the old refresh token is revoked (reuse returns 401)

  Scenario: Expired refresh token
    Given a refresh token whose expires_at is in the past
    When POST /api/v1/auth/refresh is called
    Then the response status is 401

  Scenario: Revoked refresh token (reuse after rotation)
    Given a refresh token that was already rotated
    When POST /api/v1/auth/refresh is called with the old token
    Then the response status is 401

Feature: User Logout

  Scenario: Successful logout
    Given a logged-in user with a valid access token and refresh token
    When DELETE /api/v1/auth/logout is called
    Then the response status is 200
    And the refresh token is revoked
    And the jti is rotated (access token invalid for subsequent requests)

Feature: Mobile Auth Flow

  Scenario: Landing to Register
    Given the app is launched with no stored token
    When the LandingScreen is shown
    And the user taps "Register"
    Then the RegisterScreen is shown

  Scenario: Successful register navigates to app
    Given the RegisterScreen is shown
    When the user enters email and password and taps Register
    And the API returns 201 with a JWT
    Then the JWT is stored in AsyncStorage
    And the AppNavigator is shown (Team tab visible)

  Scenario: Failed register shows error
    Given the RegisterScreen is shown
    When the API returns 422
    Then an error message is shown on screen

  Scenario: App launch with stored token skips auth
    Given a JWT is stored in AsyncStorage
    When the app is launched
    Then the AppNavigator is shown directly (no Landing screen)
```

### Testing
- RSpec request specs for all 3 auth endpoints
- FactoryBot factories: `user`
- Model spec: validates email uniqueness, presence validations

---

## Slice 2 — Team & Players (Read)

### Goal
A logged-in user can view their team (name, country, budget, total market value, player list). A logged-in user can tap a player to see their full detail including transfer history.

### Deliverables
**API**
- [ ] `teams` migration
- [ ] `players` migration
- [ ] `transfers` migration (read-only for now, needed for player detail)
- [ ] `Team` model: `belongs_to :user`, `has_many :players`
- [ ] `Player` model: `belongs_to :team`, `has_one :transfer_listing`, `has_many :transfers`
- [ ] `TeamGeneratorService` — called from registration, generates 20 Faker players
- [ ] `GET /api/v1/team` — returns team + players, computed `team_value` (sum of player market_values)
- [ ] `GET /api/v1/players/:id` — returns player + transfers (empty array for now)
- [ ] `include` / `eager_load` to prevent N+1

**Mobile**
- [ ] `TeamScreen` — country flag, team name (edit pencil icon), budget (eye mask toggle), team market value, scrollable player list, search bar
- [ ] `PlayerDetailScreen` — full player info (name, country, position, age derived from birth_date, birth_date, market value, goals), Transfer History section (empty state), Sell button (wired in Slice 4)
- [ ] `PlayerCard` component — reusable, used in TeamScreen and SelectPlayerScreen
- [ ] Position display: API stores the code (`GK`/`DEF`/`MID`/`ATT`); the full label ("Goalkeeper", etc.) is a client-side mapping. Wireframe/web UI show both — keep the mapping in a shared constant.

> The Player page wireframe omits goals, but it's a required (optional) field — surface it on `PlayerDetailScreen` so it's visible somewhere in the app.

### BDD Acceptance Criteria

```
Feature: View My Team

  Scenario: Get team with players
    Given a logged-in user with a team
    When GET /api/v1/team is called
    Then the response status is 200
    And the response contains team name, country, budget
    And the response contains team_value (sum of all player market_values)
    And the response contains a players array with 20 items
    And each player has: id, first_name, last_name, country, position, birth_date, age, market_value, goals
    And each player has is_listed (boolean) and active_listing (null or { id, asking_price })
    And the response contains the team id (so the client can identify its own listings)

  Scenario: Unauthenticated request
    Given no Authorization header
    When GET /api/v1/team is called
    Then the response status is 401

  Scenario: Team value is computed correctly
    Given a team with 20 players each worth $1,000,000
    When GET /api/v1/team is called
    Then team_value equals 20_000_000.00

Feature: View Player Detail

  Scenario: View own player
    Given a logged-in user and a player belonging to their team
    When GET /api/v1/players/:id is called
    Then the response status is 200
    And the response contains full player fields
    And the response contains a transfers array (may be empty)

  Scenario: View player from another team
    Given a logged-in user and a player belonging to another team
    When GET /api/v1/players/:id is called
    Then the response status is 200
    And transfer history is visible (public info)

  Scenario: Player not found
    When GET /api/v1/players/99999 is called
    Then the response status is 404

Feature: TeamGeneratorService

  Scenario: Correct squad composition
    Given a new user registration
    Then TeamGeneratorService creates exactly 3 GK players
    And exactly 6 DEF players
    And exactly 6 MID players
    And exactly 5 ATT players
    And each player's market_value is 1_000_000.00
    And each player's birth_date results in an age between 18 and 40
    And the team budget is between 2_000_000.00 and 5_000_000.00
    And all player names and countries are non-empty strings

Feature: Mobile Team Screen

  Scenario: Budget mask toggle
    Given the TeamScreen is shown with budget visible
    When the user taps the eye icon
    Then the budget is hidden (masked as *****)
    When the user taps the eye icon again
    Then the budget is shown

  Scenario: Search players
    Given the TeamScreen shows 20 players
    When the user types a name in the search bar
    Then only matching players are shown (client-side filter)

  Scenario: Tap player navigates to detail
    Given the TeamScreen is shown
    When the user taps a player card
    Then the PlayerDetailScreen is shown with that player's data
```

### Testing
- RSpec request specs for `GET /team`, `GET /players/:id`
- Unit spec for `TeamGeneratorService` (squad composition, values, age range)
- N+1 check: assert query count with `bullet` gem

---

## Slice 3 — Edit Team & Players

### Goal
A team owner can edit their team name and country. A team owner can edit a player's first name, last name, and country. No one else can edit these.

### Deliverables
**API**
- [ ] `PATCH /api/v1/team` — update name and/or country, owner only
- [ ] `PATCH /api/v1/players/:id` — update first_name, last_name, country, owner only (403 if not owner)
- [ ] Strong params, model validations

**Mobile**
- [ ] `TeamEditorScreen` — text input for name, country dropdown (or picker), Save button
- [ ] Edit pencil icon on TeamScreen header navigates to TeamEditorScreen
- [ ] Inline edit on PlayerDetailScreen: editable fields for first_name, last_name, country with Save

### BDD Acceptance Criteria

```
Feature: Edit Team

  Scenario: Owner edits team name
    Given a logged-in user who owns a team
    When PATCH /api/v1/team is called with { name: "New Name" }
    Then the response status is 200
    And the team name is updated in the database

  Scenario: Owner edits team country
    Given a logged-in user who owns a team
    When PATCH /api/v1/team is called with { country: "Spain" }
    Then the response status is 200
    And the team country is updated

  Scenario: Invalid — blank name
    When PATCH /api/v1/team is called with { name: "" }
    Then the response status is 422

Feature: Edit Player

  Scenario: Owner edits own player
    Given a logged-in user and a player on their team
    When PATCH /api/v1/players/:id with { first_name: "Carlos" }
    Then the response status is 200
    And the player first_name is updated

  Scenario: Non-owner cannot edit player
    Given User A and a player on User B's team
    When User A calls PATCH /api/v1/players/:id
    Then the response status is 403

  Scenario: Cannot edit position or market_value via PATCH
    Given a logged-in user
    When PATCH /api/v1/players/:id with { position: "GK", market_value: 9999 }
    Then the response status is 200
    But position and market_value remain unchanged (strong params reject them)
```

### Testing
- RSpec request specs for both PATCH endpoints
- Authorization spec: 403 on non-owner access

---

## Slice 4 — Transfer Listing (Sell)

### Goal
A team owner can place one of their players on the transfer market with a custom asking price. They can also remove a listing. A player can only have one active listing at a time. The listing appears in the transfer market for all users.

### Deliverables
**API**
- [ ] `transfer_listings` migration (with partial unique index)
- [ ] `TransferListing` model: `belongs_to :player`, validations
- [ ] `POST /api/v1/transfer_listings` — list a player (owner only, no duplicate active listing)
- [ ] `DELETE /api/v1/transfer_listings/:id` — remove listing (owner only)
- [ ] `Player` model: `has_one :active_listing, -> { where(active: true) }, class_name: 'TransferListing'`

**Mobile**

> Two entry points reach the same `CreateTransferOfferScreen`:
> 1. **Player page → Sell**: the player is already selected, so the Sell button navigates **directly to `CreateTransferOfferScreen`** (skip `SelectPlayerScreen`).
> 2. **Transfer List → FAB (+)**: no player chosen yet, so it opens `SelectPlayerScreen` first, then `CreateTransferOfferScreen`.

- [ ] Sell button on `PlayerDetailScreen` navigates **directly** to `CreateTransferOfferScreen` for that player (disabled/hidden if player `is_listed`)
- [ ] FAB (+) on `TransferListScreen` navigates to `SelectPlayerScreen`
- [ ] `SelectPlayerScreen` — lists own players (excludes those where `is_listed == true`), searchable
- [ ] `CreateTransferOfferScreen` — shows player info (read-only), market value (read-only), sell price input, Create offer button
- [ ] After creating offer, navigate back to Transfer List tab

### BDD Acceptance Criteria

```
Feature: Create Transfer Listing

  Scenario: Owner lists a player
    Given a logged-in user with a player on their team
    And that player has no active listing
    When POST /api/v1/transfer_listings with { player_id: X, asking_price: 2000000 }
    Then the response status is 201
    And an active TransferListing record exists for that player
    And the player appears on GET /transfer_listings

  Scenario: Cannot list another team's player
    Given User A tries to list User B's player
    When POST /api/v1/transfer_listings with player_id from User B's team
    Then the response status is 403

  Scenario: Cannot list same player twice
    Given a player already has an active listing
    When POST /api/v1/transfer_listings for the same player
    Then the response status is 409
    And the error message is "Player is already listed"

  Scenario: Asking price must be positive
    When POST /api/v1/transfer_listings with { asking_price: 0 }
    Then the response status is 422

  Scenario: Asking price must be positive (negative)
    When POST /api/v1/transfer_listings with { asking_price: -500 }
    Then the response status is 422

Feature: Remove Transfer Listing

  Scenario: Owner removes their listing
    Given a logged-in user with an active listing
    When DELETE /api/v1/transfer_listings/:id
    Then the response status is 200
    And the listing is deactivated (active = false)
    And the player no longer appears on the transfer market

  Scenario: Non-owner cannot remove listing
    Given User A tries to delete User B's listing
    When DELETE /api/v1/transfer_listings/:id
    Then the response status is 403
```

### Testing
- RSpec request specs for POST and DELETE
- Model spec: uniqueness validation, asking_price > 0
- Database constraint spec: partial unique index prevents duplicate active listings at DB level

---

## Slice 5 — Transfer Market (Buy)

### Goal
Any logged-in user can browse active transfer listings with filtering and pagination. A user can buy a player from another team. The buy flow is atomic, race-condition-safe, and updates all relevant records in a single transaction.

### Deliverables
**API**
- [ ] `GET /api/v1/transfer_listings` — filtered, paginated, with `includes` to avoid N+1
- [ ] `POST /api/v1/transfer_listings/:id/buy` — the critical endpoint
- [ ] `TransferService` — encapsulates the full buy flow
- [ ] `transfers` migration complete (already drafted in Slice 2)
- [ ] `Transfer` model: `belongs_to :player`, `belongs_to :transfer_listing`, `belongs_to :from_team`, `belongs_to :to_team`

**`TransferService` logic (atomic, locked):**
```
TransferService.call(listing_id:, buyer:)
  1. BEGIN TRANSACTION
  2. SELECT FOR UPDATE on transfer_listing → raises AlreadySold if active = false
  3. SELECT FOR UPDATE on buyer_team → raises InsufficientFunds if budget < asking_price
  4. Deduct asking_price from buyer_team.budget
  5. Add asking_price to seller_team.budget
  6. Assign player.team_id = buyer_team.id
  7. Increase player.market_value by rand(10..100)%
  8. Set transfer_listing.active = false
  9. Create Transfer record (price, market_value_after, from_team, to_team)
  10. COMMIT
  → Returns Transfer record
  → On any failure: ROLLBACK (no partial state)
```

**Mobile**
- [ ] `TransferListScreen` — budget shown at top with mask, search bar + filter icon, paginated list of `TransferOfferCard` components, FAB (+) to create new listing
- [ ] `TransferOfferCard` — player name/age/flag, team name/flag, position, offer date, price, Buy button (hidden if own listing)
- [ ] Filter modal — player name, team name, min price, max price, team country, player country
- [ ] Buy confirmation alert before calling API
- [ ] Handle 409 (already sold) with "Sorry, this player was just bought" message
- [ ] Handle 422 (insufficient funds) with "Insufficient budget" message

### BDD Acceptance Criteria

```
Feature: Browse Transfer Market

  Scenario: List all active listings
    Given 5 players are on the transfer market
    When GET /api/v1/transfer_listings
    Then the response status is 200
    And the response contains 5 listings
    And each listing includes: player info, team info, asking_price, created_at

  Scenario: Filter by player name
    When GET /api/v1/transfer_listings?player_name=Carlos
    Then only listings where player first_name or last_name contains "Carlos" are returned

  Scenario: Filter by team name
    When GET /api/v1/transfer_listings?team_name=Barcelona
    Then only listings from teams with "Barcelona" in their name are returned

  Scenario: Filter by price range
    When GET /api/v1/transfer_listings?min_price=1000000&max_price=3000000
    Then only listings with asking_price between 1M and 3M are returned

  Scenario: Filter by team country
    When GET /api/v1/transfer_listings?team_country=Spain
    Then only listings from Spanish teams are returned

  Scenario: Filter by player country
    When GET /api/v1/transfer_listings?player_country=Brazil
    Then only listings where player country is Brazil are returned

  Scenario: Pagination
    Given 50 active listings exist
    When GET /api/v1/transfer_listings?page=2&per_page=20
    Then 20 listings are returned
    And the response metadata includes total_count, current_page, total_pages

Feature: Buy a Player

  Scenario: Successful purchase
    Given User A has budget $5,000,000
    And Player X is listed for $2,000,000 by User B's team
    When User A calls POST /transfer_listings/:id/buy
    Then the response status is 201
    And User A's budget decreases by $2,000,000 (= $3,000,000 remaining)
    And User B's budget increases by $2,000,000
    And Player X belongs to User A's team
    And Player X market_value has increased by between 10% and 100%
    And the transfer_listing is inactive (active = false)
    And a Transfer record exists with correct from_team, to_team, price, market_value_after

  Scenario: Insufficient budget
    Given User A has budget $500,000
    And a player is listed for $2,000,000
    When User A calls POST /transfer_listings/:id/buy
    Then the response status is 422
    And the error message is "Insufficient budget"
    And no records are changed

  Scenario: Cannot buy own player
    Given User A has a player listed for sale
    When User A calls POST /transfer_listings/:id/buy on their own listing
    Then the response status is 403
    And the error message is "Cannot buy your own player"

  Scenario: Race condition — two buyers simultaneously
    Given Player X is listed for $1,000,000
    And both User A and User B have $2,000,000 budget
    When both users call POST /transfer_listings/:id/buy at the same time
    Then exactly one succeeds with 201
    And the other receives 409 with "Player has already been sold"
    And Player X belongs to exactly one team
    And budgets are consistent (no double-deduction)

  Scenario: Already sold listing
    Given a listing that is already inactive (active = false)
    When POST /transfer_listings/:id/buy is called
    Then the response status is 409

Feature: Market Value Increase

  Scenario: Value increases on transfer
    Given a player with market_value $1,000,000
    When the player is successfully transferred
    Then the player's market_value is between $1,100,000 and $2,000,000
    And market_value_after in the Transfer record matches the player's new market_value
```

### Testing
- RSpec request specs for GET (all filter combos) and POST buy
- **Concurrency spec:** spawn 2 threads simultaneously calling buy, assert exactly one succeeds
- Service unit spec for `TransferService` — test each failure path
- N+1 check on GET /transfer_listings

---

## Slice 6 — Polish & Production Hardening

### Goal
All screens have loading states and error handling. Player detail shows full transfer history. Reviewer experience is smooth (good README, seeds). Code is clean and consistent.

### Deliverables
**API**
- [ ] `GET /players/:id` returns full transfer history (from_team, to_team, date, price, market_value_after)
- [ ] Seed file (`db/seeds.rb`) with 3 demo users, each with a team, some players listed
- [ ] Global error handler in `ApplicationController` (rescue `ActiveRecord::RecordNotFound` → 404, `Pundit::NotAuthorizedError` → 403)
- [ ] API versioning confirmed (`/api/v1/`)

**Mobile**
- [ ] Transfer history section on `PlayerDetailScreen` (from/to team flags, date, price, value)
- [ ] Loading spinners on all async operations
- [ ] Empty states on Transfer List and player search
- [ ] Sign out from `•••` menu on TeamScreen
- [ ] Error boundary / generic error screen
- [ ] Filter modal fully wired with all 6 filter fields

**Documentation**
- [ ] `README.md` with: how to run with Docker, how to run tests, env vars
- [ ] `.env.example` for API

### BDD Acceptance Criteria

```
Feature: Player Transfer History

  Scenario: Player with no transfers
    When GET /api/v1/players/:id for a player who has never been transferred
    Then transfers is an empty array []

  Scenario: Player with transfer history
    Given a player who has been transferred twice
    When GET /api/v1/players/:id
    Then transfers contains 2 entries
    And each entry has: from_team (name, country), to_team (name, country),
        created_at, price, market_value_after

Feature: Error Handling

  Scenario: 404 on missing resource
    When any endpoint is called with a non-existent ID
    Then the response status is 404
    And the body is { "error": "Not found" }

  Scenario: 401 on expired/invalid JWT
    When a protected endpoint is called with an invalid token
    Then the response status is 401

Feature: Seed Data

  Scenario: Seeds run cleanly
    Given an empty database
    When rails db:seed is run
    Then 3 users exist
    And each user has a team with 20 players
    And some players are on the transfer market
    And no errors are raised
```

---

## 11. Testing Strategy

### API (RSpec)
```
spec/
├── factories/
│   ├── users.rb
│   ├── teams.rb
│   ├── players.rb
│   ├── transfer_listings.rb
│   └── transfers.rb
├── models/
│   ├── user_spec.rb
│   ├── team_spec.rb
│   ├── player_spec.rb
│   └── transfer_listing_spec.rb
├── requests/
│   ├── auth_spec.rb
│   ├── teams_spec.rb
│   ├── players_spec.rb
│   └── transfer_listings_spec.rb
└── services/
    ├── team_generator_service_spec.rb
    ├── transfer_service_spec.rb
    └── refresh_token_service_spec.rb
```

### Gems
```ruby
group :test do
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'shoulda-matchers'      # cleaner model validation specs
  gem 'database_cleaner-active_record'
  gem 'bullet'                # N+1 detection
end
```

### Test Priorities (ordered by assessment importance)
1. `transfer_service_spec.rb` — concurrency test, all failure paths
2. `transfer_listings_spec.rb` — buy endpoint, race condition
3. `team_generator_service_spec.rb` — squad composition
4. `auth_spec.rb` — register, login, logout, refresh, token rotation, revoked token rejection
5. `refresh_token_service_spec.rb` — issue, rotate, revoke, expiry
6. `teams_spec.rb`, `players_spec.rb` — CRUD + authorization
7. Model specs — validations, associations

### Mobile (Jest + React Native Testing Library)
- Auth context unit tests (login/logout/register)
- Axios client interceptor tests
- Component tests for `PlayerCard`, `TransferOfferCard`
- Navigation smoke tests

---

## 12. Technical Traps & Mitigations

### Trap 1: Race Condition on Buy (Most Critical)
**Problem:** Two users buy the same player simultaneously — both pass budget check, player transferred twice.  
**Mitigation:**
- `TransferService` wraps entire flow in `ActiveRecord::Base.transaction`
- `listing.lock!` (SELECT FOR UPDATE) at the start — second request blocks until first commits
- Re-check `listing.active?` INSIDE the lock — second request sees `active = false`, raises `AlreadySold`
- Partial unique index at DB level as last-resort safety net

### Trap 2: Negative Budget
**Problem:** Budget check passes, then budget decremented, but player was already sold → seller credited without buyer losing money.  
**Mitigation:** Both budget changes happen inside the same transaction as the lock. Rollback on any error.

### Trap 3: Float Money Arithmetic
**Problem:** `float` columns give `$1999999.9999998` due to IEEE 754.  
**Mitigation:** All money columns are `decimal(15,2)`. Never use `float` for currency.

### Trap 4: JWT Not Revoked on Logout + Refresh Token Reuse
**Problem:** Stateless JWTs are valid until expiry even after logout. Refresh tokens stolen from the client could be replayed.  
**Mitigation:**
- Access tokens are short-lived (1 hour) — blast radius of a stolen token is small
- `jti` column on `users` invalidates the current access token on logout even before expiry
- Refresh tokens are stored as SHA-256 digests only — raw token never in the database
- Rotation on every use: reusing an old refresh token (e.g. stolen before rotation) returns 401 immediately
- `revoked_at` + `expires_at` checked on every refresh request

### Trap 5: N+1 on Transfer List
**Problem:** 20 listings → 20 player queries + 20 team queries = 41 queries.  
**Mitigation:** `TransferListing.includes(player: :team)` in the controller. Verified with `bullet` gem in test environment.

### Trap 6: Duplicate Active Listings
**Problem:** Two simultaneous POST /transfer_listings requests create two active listings for the same player.  
**Mitigation:** Partial unique index (`WHERE active = true`) at the database level — one will get a `PG::UniqueViolation` even if app-level check passes.

### Trap 7: Unauthorized Player Edit/List
**Problem:** User A edits or lists User B's player.  
**Mitigation:** All player mutations check `player.team.user == current_user`, return 403 otherwise. Never trust player_id from request body without ownership check.

---

## 13. Scalability & Maintainability Notes

### Service Objects
All complex business logic lives in `app/services/`, not controllers or models. Controllers are thin — they validate input, call a service, return the result. This makes the logic independently testable and reusable.

### API Versioning
All routes namespaced under `/api/v1/`. Adding `/api/v2/` later doesn't break existing clients.

### Pagination
All list endpoints paginated with `kaminari`. Default 20 per page. Max 100 per page. Response always includes `{ data: [...], meta: { total_count, current_page, total_pages } }`.

### Indexes
Every foreign key has an index. Transfer list queries are indexed on `active`, `player_id`. Player search in team is indexed on `team_id`. No full table scans on common paths.

### Decimal Precision
`decimal(15,2)` supports values up to $9,999,999,999,999.99 — safe for any fantasy soccer valuation.

### Mobile API Client
Single Axios instance with base URL from env. JWT injected via request interceptor. 401 responses trigger automatic logout via response interceptor. All API calls centralized in `src/api/` — never scattered across screens.

### TypeScript
Mobile is fully typed. API response shapes defined in `src/types/index.ts`. No `any` types in core flows.

---

## Session Progress Tracker

| Slice | Status | Session | Notes |
|-------|--------|---------|-------|
| Slice 1 — Scaffolding + Auth | `TODO` | — | |
| Slice 2 — Team & Players (Read) | `TODO` | — | |
| Slice 3 — Edit Team & Players | `TODO` | — | |
| Slice 4 — Transfer Listing (Sell) | `TODO` | — | |
| Slice 5 — Transfer Market (Buy) | `TODO` | — | |
| Slice 6 — Polish & Hardening | `TODO` | — | |

> Update this table at the start of each session. Change `TODO` → `IN PROGRESS` → `DONE`.
