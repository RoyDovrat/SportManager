# SportManager

Management system for football and swimming activities.

## Backend

Java 21, Spring Boot 3.5.4, PostgreSQL, JWT admin auth.

### Prerequisites

- JDK 21
- PostgreSQL with a database named `sportmanager` (or override `DB_URL`)
- Maven wrapper in `backend/` (`mvnw` / `mvnw.cmd`)

### First-time local setup (secrets)

Secrets are **not** committed. For local development:

```bash
cd backend/src/main/resources
copy application-local.properties.example application-local.properties
```

Then edit `application-local.properties` with your real DB password, JWT secret, and admin password.

The default Spring profile is `local`, which loads that file. For shared/staging/production, set env vars instead and use e.g. `SPRING_PROFILES_ACTIVE=prod` (do not deploy `application-local.properties`).

### Run

```bash
cd backend
./mvnw spring-boot:run
```

Windows:

```bash
cd backend
.\mvnw.cmd spring-boot:run
```

API base: `http://localhost:8080`

### Configuration

| Variable / property | Purpose | Notes |
|---------------------|---------|--------|
| `DB_URL` | JDBC URL | Default `jdbc:postgresql://localhost:5432/sportmanager` |
| `DB_USERNAME` | DB user | Default `postgres` |
| `DB_PASSWORD` / `spring.datasource.password` | DB password | **Required** (env or local file) |
| `JWT_SECRET` / `app.jwt.secret` | HS256 signing key | **Required**; long random string |
| `JWT_EXPIRATION_MS` | Token lifetime | Default `86400000` (24h) |
| `ADMIN_DEFAULT_USERNAME` | Seeded admin username | Default `admin` |
| `ADMIN_DEFAULT_PASSWORD` / `app.admin.default-password` | Seeded admin password | **Required** |
| `CORS_ALLOWED_ORIGINS` / `app.cors.allowed-origins` | Browser origins | Default `http://localhost:5173,http://localhost:3000` |
| `JPA_DDL_AUTO` | Hibernate ddl mode | Default `update` |
| `JPA_SHOW_SQL` | Log SQL | Default `false` |
| `SPRING_PROFILES_ACTIVE` | Active profile | Default `local` |

Never commit `application-local.properties`, `.env`, or real production secrets.

### CORS

The API allows the origins in `app.cors.allowed-origins` (credentials + standard REST methods). Add your frontend origin before calling the API from a browser.

### Auth

1. `POST /api/auth/login` with `{ "username": "<admin>", "password": "<from local config or env>" }`
2. Use `Authorization: Bearer <token>` on protected routes

### Public vs protected routes

**Public (no JWT):**

- `GET /api/health`
- `GET /api/seasons/active`
- `GET /api/activities/active`
- `POST /api/auth/login`
- `POST /api/registrations`

**Protected:** everything else under `/api/**` (seasons, activities, pricing, parents, students, registrations admin, clothing, payments, groups, Kibbutz export, dashboard, reports).

### Main API areas

| Area | Base path |
|------|-----------|
| Auth | `/api/auth` |
| Seasons | `/api/seasons` |
| Activities | `/api/activities` |
| Activity pricing | `/api/activity-pricing` |
| Clothing pricing | `/api/clothing-pricing` |
| Registrations | `/api/registrations` |
| Parents / students | `/api/parents`, `/api/students` |
| Clothing orders | `/api/clothing-orders` |
| Payments | `/api/payments` |
| Activity groups | `/api/activity-groups` |
| Kibbutz export | `/api/exports/kibbutz` |
| Dashboard | `/api/dashboard` |
| Reports | `/api/reports` |

Creates return `201`. Unassign from a group (`DELETE .../activity-groups/registrations/{id}`) returns `204`.

## Frontend

React 19 + Vite + TypeScript. Lives in `frontend/`.

UI language is **Hebrew (RTL)**. Copy lives in `frontend/src/i18n/he.ts` and is accessed with `t('…')`. API enum values stay English; displayed labels are Hebrew via `i18n/labels.ts`.

### Prerequisites

- Node.js 20+ (npm)

### Setup

```bash
cd frontend
copy .env.example .env
npm install
```

`.env` sets `VITE_API_BASE_URL` (default `http://localhost:8080`). Do not commit `.env`.

### Run

With the backend already running on port 8080:

```bash
cd frontend
npm run dev
```

App: `http://localhost:5173`

**Public (no login):**

- Home: `/`
- Football registration: `/register/football`
- Swimming registration: `/register/swimming`
- Clothing order: `/register/clothing` (after football registration is **APPROVED**; identity + kit or “already has clothing”)

Registrations are created as **PENDING** until an admin approves them. Clothing orders require an approved football registration for the active season.

**Admin (JWT):**

- Login: `/admin/login`
- Dashboard (home): `/admin` — season stats, open charges, recent registrations, quick links
- Season reports: `/admin/reports` — full-season summary (registrations / payments / clothing)
- Seasons: `/admin/seasons`
- Activities: `/admin/activities`
- Activity pricing: `/admin/activity-pricing`
- Clothing pricing: `/admin/clothing-pricing`
- Registrations list: `/admin/registrations` (filter by season + status; defaults to active season + `PENDING`; supports `?status=` / `?seasonId=`)
- Registration detail: `/admin/registrations/:id` (approve / cancel)
- Clothing orders list: `/admin/clothing-orders` (create/skip + filter by season / identity)
- Clothing order detail: `/admin/clothing-orders/:id`
- Payments list: `/admin/payments` (filters; generate monthly charges; create clothing payment; supports `?status=`)
- Payment detail: `/admin/payments/:id` (confirm / cancel)
- Activity groups: `/admin/activity-groups` (create football/swimming groups)
- Activity group detail: `/admin/activity-groups/:id` (edit; assign matching approved kids — swimming matches lesson type, age, water level, weekly sessions 1–6; capacities 1/2/5)
- Kibbutz Excel export: `/admin/exports/kibbutz` (download pending kibbutz-budget charges for a month)

**Dashboard notes:** Season filter defaults to the active season. **Monthly income** is the sum of payments marked PAID in the **current calendar month across all seasons** — it is not limited to the selected season (the UI labels this explicitly).

Use the admin credentials from `application-local.properties` / env (`ADMIN_DEFAULT_USERNAME` / `ADMIN_DEFAULT_PASSWORD`). A `401` from a protected API call clears the stored session and sends you back to login.

Typical flow: create/activate a **season** → ensure **activities** and **pricing** exist → parents register publicly → admin reviews at `/admin/registrations` → parents order clothing at `/register/clothing` → admin places kids in **activity groups** → admin generates monthly charges / clothing payments at `/admin/payments` → confirm Bit/PayBox/Kibbutz → download Kibbutz Excel at `/admin/exports/kibbutz` for accounting.

### CORS

Backend allows `http://localhost:5173` and `http://localhost:3000` by default (`app.cors.allowed-origins` / `CORS_ALLOWED_ORIGINS`).
