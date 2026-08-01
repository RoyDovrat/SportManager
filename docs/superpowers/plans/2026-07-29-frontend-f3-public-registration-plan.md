# Frontend Phase F3 — Public registration

> **Goal:** Parents can submit football/swimming registrations from the public site (`POST /api/registrations`, no JWT), with clear success/error UX aligned to backend validation.  
> **Out of scope:** Admin approve/cancel queue (F4), clothing orders, payments, groups, dashboard.  
> **Depends on:** F0 (API client, public layout) + F2 setup data existing in DB (active season, activities, pricing).  
> **Branch recommendation:** new `feature/public-registration` after merging/finishing `feature/admin-setup`.

---

## Important prerequisite (small backend change)

Today only these are public:

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/registrations`

`GET /api/seasons/active` and `GET /api/activities/active` are **JWT-protected**, so the public form cannot load real `seasonId` / `activityId` without a change.

**Recommended (do first in F3 Step 0):** permit read-only catalog endpoints:

```text
GET /api/seasons/active
GET /api/activities/active
```

(Optionally later: a single `GET /api/public/registration-options` — not required for MVP.)

Do **not** open full season/activity CRUD publicly.

---

## Backend contract (create)

`POST /api/registrations` → `201` + `RegistrationResponse`  
Status created as **`PENDING`**.

### Always required

| Field | Notes |
|-------|--------|
| Parent: first/last, phone | |
| Student: first/last, identity, age, ageGroup, gender | |
| `isKibbutzMember` | if `true` → `budgetNumber` required |
| `activityId`, `seasonId` | must be active season/activity |
| `hasMedicalLimitation` | |
| `healthDeclarationApproved` | must be `true` |
| `medicalNotes`, `specialRequests` | optional |

### Football

- Do **not** send swimming fields (`swimmingLessonType`, `waterAdaptationLevel`, `weeklySessions`)

### Swimming

- Require `swimmingLessonType`, `waterAdaptationLevel`, `weeklySessions` (> 0)

Errors use existing `ErrorResponse` / `fieldErrors` (already mapped by `ApiError` + `formatApiError`).

---

## Target UX / routes

```
/                         Public home — links to register football / swimming
/register/football        Football registration form
/register/swimming        Swimming registration form
/register/success/:id     Confirmation (optional; or inline success on same page)
```

All under `PublicLayout`. No auth.

---

## Target structure

```
frontend/src/
  types/enums.ts              # add Gender, WaterAdaptationLevel (+ RegistrationStatus if needed)
  api/
    registrations.ts          # createRegistration()
    publicCatalog.ts          # getActiveSeason(), listActiveActivities()  [uses newly public GETs]
  pages/public/
    FootballRegistrationPage.tsx
    SwimmingRegistrationPage.tsx
    RegistrationSuccessPage.tsx   # optional
  components/registration/      # shared parent/student field groups (optional, Step 3+)
  routes/index.tsx
  layouts/PublicLayout.tsx      # nav links to register
```

---

## Steps & recommended commits

### Step 0 — Backend: public catalog reads
**Do:** In `SecurityConfig`, `permitAll` for:
- `GET /api/seasons/active`
- `GET /api/activities/active`  
**Verify:** curl/browser without token returns 200.  
**Commit:** `fix(backend): allow public read of active season and activities`  
**Branch:** can be on `feature/public-registration` (same PR) or a tiny prerequisite commit.

---

### Step 1 — Enums + registration API helper
**Do:** Extend `enums.ts` with `Gender`, `WaterAdaptationLevel`. Add `api/registrations.ts` (`createRegistration`) and `api/publicCatalog.ts`.  
**Verify:** build.  
**Commit:** `feat(frontend): add public registration API helpers`

---

### Step 2 — Public routes + home entry points
**Do:** Routes for `/register/football` and `/register/swimming` (placeholder pages OK). Update `PublicLayout` / home with links. Keep health check or move to footer.  
**Commit:** `feat(frontend): add public registration routes`

---

### Step 3 — Shared form sections (parent + student)
**Do:** Reusable fields: parent block, student block, kibbutz/budget, medical/health declaration checkbox (must be checked). Load active season + activities on mount; resolve `activityId` by type (`FOOTBALL` / `SWIMMING`). Show clear error if no active season/activity.  
**Commit:** `feat(frontend): add shared registration form fields`

---

### Step 4 — Football registration page
**Do:** Wire football form → `createRegistration` (no swimming fields). Success: show confirmation (id + PENDING) or navigate to success page.  
**Verify:** End-to-end with backend (health declaration required, kibbutz budget).  
**Commit:** `feat(frontend): add football public registration page`

---

### Step 5 — Swimming registration page
**Do:** Same as football + lesson type, water adaptation, weekly sessions.  
**Commit:** `feat(frontend): add swimming public registration page`

---

### Step 6 — Polish
**Do:** Disable submit while saving; show `fieldErrors`; success copy (“awaiting admin approval”); README public URLs; remove/relocate raw health-check if it clutters home.  
**Commit:** `feat(frontend): polish public registration UX`

---

## Branching

| Current | Action |
|---------|--------|
| `feature/admin-setup` | Finish/merge F2 first |
| New | `feature/public-registration` for F3 |

Stacking on `admin-setup` is OK only if you want one long-lived frontend PR; prefer a new branch after F2 is merged.

---

## Execution rules

1. One step at a time; explain + suggest commit; wait for approval.  
2. No admin registration queue (that’s F4).  
3. Do not commit unless asked.

---

## Acceptance checklist (end of F3)

- [ ] Public user can register for football without JWT  
- [ ] Public user can register for swimming without JWT  
- [ ] Active season/activity loaded without admin login  
- [ ] Health declaration + kibbutz budget rules enforced (client UX + backend)  
- [ ] Success shows registration created as PENDING  
- [ ] Errors use `ApiError` / `ErrorResponse`  
- [ ] Admin-only APIs remain protected  
