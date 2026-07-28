# Frontend Phase F1 — Admin Authentication

> **Goal:** Admin can log in via `POST /api/auth/login`, store the JWT, attach it to API calls, and reach `/admin` only when authenticated. Logout clears the session client-side.  
> **Out of scope:** Real admin domain screens (seasons, payments, …), password change, refresh tokens, “remember me” beyond localStorage, public registration forms (F3).  
> **Depends on:** F0 (API client, layouts, routing).  
> **Branch:** continue on `feature/frontend-setup` or a new `feature/admin-auth` (your choice when starting).

**Backend contract:**
- `POST /api/auth/login` body: `{ "username", "password" }`
- Response: `{ "accessToken", "tokenType": "Bearer", "username" }`
- Protected routes expect `Authorization: Bearer <accessToken>`
- Failures use `ErrorResponse` (already mapped by F0 `ApiError`)

---

## Target structure (end of F1)

```
frontend/src/
  api/
    auth.ts                 # login()
    client.ts               # attach Bearer when token present
  auth/
    AuthContext.tsx         # token + user state, login/logout
    RequireAuth.tsx         # redirect unauthenticated → /admin/login
    tokenStorage.ts         # localStorage get/set/clear
  pages/
    LoginPage.tsx
    AdminHomePage.tsx       # show logged-in username + logout
  routes/index.tsx          # /admin/login public; /admin/* protected
```

---

## Steps & recommended commits

### Step 1 — Auth API types + `login()` helper
**Do:** `src/api/auth.ts` with `LoginRequest`, `AuthResponse`, and `login(credentials)` via `apiRequest` → `POST /api/auth/login`. No UI yet.  
**Verify:** `npm run build`.  
**Commit:** `feat(frontend): add auth login API helper`

---

### Step 2 — Token storage
**Do:** `src/auth/tokenStorage.ts` — get/set/clear access token (and optionally username) in `localStorage` under a clear key (e.g. `sportmanager.accessToken`). No React context yet.  
**Verify:** Build; tiny sanity via exporting functions only.  
**Commit:** `feat(frontend): add JWT token storage helpers`

---

### Step 3 — Attach Bearer token in API client
**Do:** Extend `apiRequest` to read the stored token and set `Authorization: Bearer …` when present, unless the caller already set `Authorization`. Still no login UI.  
**Verify:** Build. (Live verify comes after login UI.)  
**Commit:** `feat(frontend): attach Bearer token on API requests`

---

### Step 4 — Auth context (login / logout / hydrate)
**Do:** `AuthProvider` wrapping the app: hydrate from storage on load; `login(username, password)` calls API then stores token + username; `logout()` clears storage and state; expose `isAuthenticated`, `username`, `token`. Wire provider in `main.tsx` (or `App.tsx`).  
**Don’t:** Route guards yet.  
**Verify:** Build.  
**Commit:** `feat(frontend): add AuthContext provider`

---

### Step 5 — Login page
**Do:** `LoginPage` at `/admin/login` — username/password form, submit → context `login`, show `ApiError` message on failure, navigate to `/admin` on success. Minimal layout (can reuse a thin auth shell or PublicLayout; prefer standalone simple page under admin path).  
**Verify:** Manual: wrong password shows error; correct password redirects (with backend up).  
**Commit:** `feat(frontend): add admin login page`

---

### Step 6 — Protect admin routes + logout UX
**Do:**
- `RequireAuth` wrapper: if not authenticated → `<Navigate to="/admin/login" replace />`
- Nest `/admin` routes under `RequireAuth` except `/admin/login`
- If already logged in, visiting `/admin/login` → redirect to `/admin`
- Admin layout / home: show username + **Logout** button  
**Verify:** Unauthenticated `/admin` → login; after login → home; logout → login; health check on public `/` still works without token.  
**Commit:** `feat(frontend): protect admin routes and add logout`

---

### Step 7 — Optional polish (only if needed)
**Do:** On API `401` from protected calls, clear token and redirect to login (global handler in client or a small auth interceptor). Update README with login URL + default local admin note.  
**Commit:** `feat(frontend): handle 401 session expiry` and/or `docs: document admin login`

*(If you want F1 lean, Step 7 can be skipped or done as a thin README-only commit.)*

---

## Execution rules

1. One step at a time; after each: explain changes, suggest commit message, wait for approval.  
2. No F2+ domain screens.  
3. Do not commit unless asked.

---

## Acceptance checklist (end of F1)

- [ ] Login against real backend works
- [ ] JWT stored and sent on subsequent API calls
- [ ] `/admin` requires auth; `/admin/login` does not
- [ ] Logout clears session
- [ ] Public routes remain usable without JWT
- [ ] Errors surface via existing `ErrorResponse` / `ApiError` mapping
