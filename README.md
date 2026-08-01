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

- Public shell: `/` (includes API health check)
- Admin login: `/admin/login`
- Admin home (JWT required): `/admin`
- Admin setup:
  - Seasons: `/admin/seasons`
  - Activities: `/admin/activities`
  - Activity pricing: `/admin/activity-pricing`
  - Clothing pricing: `/admin/clothing-pricing`

Use the admin credentials from `application-local.properties` / env (`ADMIN_DEFAULT_USERNAME` / `ADMIN_DEFAULT_PASSWORD`). A `401` from a protected API call clears the stored session and sends you back to login.

Typical setup order: create/activate a **season** → ensure **activities** exist → add **activity pricing** and **clothing pricing** for that season.

### CORS

Backend allows `http://localhost:5173` and `http://localhost:3000` by default (`app.cors.allowed-origins` / `CORS_ALLOWED_ORIGINS`).
