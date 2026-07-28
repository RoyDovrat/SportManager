# Frontend Phase F0 — Scaffold & API Foundation

> **Goal:** React + Vite + TypeScript app in `frontend/` with routing shells, env-based API base URL, reusable API client + `ErrorResponse` mapping, CORS verified, and one real call to the backend health endpoint.  
> **Status:** F0 implementation complete (Steps 1–7). Manual health check in browser recommended when backend is running.  
> **Out of scope:** Login/JWT (F1), real admin/public screens, styling polish, Hebrew/RTL.  
> **Branch:** `feature/frontend-setup`  
> **Backend note:** CORS for `http://localhost:5173` was already configured (`CorsConfig` + `app.cors.allowed-origins`). Step 7 confirmed no backend code change needed.

**Sources:** Backend `ErrorResponse` record, `GET /api/health`, existing CORS defaults.

---

## Target structure (end of F0)

```
frontend/
  .env.example
  .env                  # gitignored; local VITE_API_BASE_URL
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    vite-env.d.ts
    api/
      client.ts         # fetch wrapper
      types.ts          # ErrorResponse + ApiError
      health.ts         # getHealth() for verification only
    layouts/
      PublicLayout.tsx
      AdminLayout.tsx
    pages/
      PublicHomePage.tsx    # minimal placeholder + health check result
      AdminHomePage.tsx     # minimal placeholder (no auth)
      NotFoundPage.tsx
    routes/
      index.tsx             # BrowserRouter + routes
```

---

## Steps & recommended commits

### Step 1 — Scaffold Vite React TypeScript app
**Do:** Create `frontend/` with `npm create vite@latest` (React + TS). Install deps. Confirm `npm run dev` / `npm run build` work.  
**Don’t:** Add routing, API client, or pages yet beyond Vite defaults.  
**Verify:** `cd frontend && npm run build` succeeds.  
**Commit:** `chore(frontend): scaffold Vite React TypeScript app`

---

### Step 2 — Project structure & cleanup
**Do:** Remove default Vite demo UI/assets. Add folders: `api/`, `layouts/`, `pages/`, `routes/`. Keep a minimal root `App.tsx` that will mount routes in the next step. Align root `.gitignore` for `frontend/node_modules`, `dist`, `.env` (already partly covered).  
**Verify:** App still builds; blank/minimal shell renders.  
**Commit:** `chore(frontend): set base folder structure and remove Vite demo UI`

---

### Step 3 — Env config (`VITE_API_BASE_URL`)
**Do:** Add `.env.example` with `VITE_API_BASE_URL=http://localhost:8080`. Add local `.env` (gitignored). Extend `src/vite-env.d.ts` for `ImportMetaEnv`. Small `src/config.ts` exporting `apiBaseUrl`.  
**Verify:** `import.meta.env.VITE_API_BASE_URL` resolves in dev.  
**Commit:** `chore(frontend): add VITE_API_BASE_URL env configuration`

---

### Step 4 — Routing + public/admin layouts
**Do:** Add `react-router-dom`. Define routes:
- Public layout: `/` → placeholder public home
- Admin layout: `/admin` → placeholder admin home (no auth guard yet)
- `*` → not found  
Layouts are structural only (header/nav stubs OK; no login).  
**Verify:** Navigate `/`, `/admin`, unknown path in browser.  
**Commit:** `feat(frontend): add public and admin layout routing`

---

### Step 5 — API client + ErrorResponse mapping
**Do:**
- `src/api/types.ts` mirroring backend:
  - `timestamp`, `status`, `error`, `message`, `path`, `fieldErrors`
- `ApiError` class holding parsed `ErrorResponse` (or fallback for non-JSON)
- `src/api/client.ts`: `apiRequest<T>(path, options)` using `VITE_API_BASE_URL`, JSON headers, parse success JSON, on `!response.ok` parse `ErrorResponse` and throw `ApiError`  
**Don’t:** Attach JWT (F1).  
**Verify:** Unit-style manual check or temporary call; build passes.  
**Commit:** `feat(frontend): add API client with ErrorResponse mapping`

---

### Step 6 — Health API helper + wire verification UI
**Do:** `getHealth()` → `GET /api/health`. On public home placeholder only: button or auto-load that shows `UP` / error message via client (proves CORS + client). No real product screens.  
**Verify (manual):** Backend running on `:8080`, frontend on `:5173`, health call succeeds in Network tab (no CORS error).  
**Commit:** `feat(frontend): verify health endpoint from public shell`

---

### Step 7 — CORS confirmation (backend)
**Do:** Confirm existing `CorsConfig` allows Vite origin. Only change backend if verification fails (e.g. missing origin). Update root README with `frontend/` run blurb if missing.  
**Verify:** Browser request from `http://localhost:5173` to `http://localhost:8080/api/health` returns 200.  
**Commit (only if backend change needed):** `fix(backend): adjust CORS for Vite frontend`  
**Else:** no backend commit; note “CORS already OK” in PR description.

---

## Execution rules (this session)

1. Implement **one step at a time**.
2. After each step: explain changes, suggest commit message, **wait for approval**.
3. Do **not** implement F1 auth or real application screens.
4. Do **not** commit unless the user asks.

---

## Acceptance checklist (end of F0)

- [x] `frontend/` is a working Vite React TS app
- [x] Public vs admin layouts routed
- [x] `VITE_API_BASE_URL` configured
- [x] Reusable API client maps `ErrorResponse`
- [x] Health helper + public-shell button for `GET /api/health` (confirm in browser with backend up)
- [x] No login, no domain screens beyond placeholders
- [x] CORS already OK for Vite; README documents frontend run
