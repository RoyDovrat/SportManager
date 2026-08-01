# Frontend Phase F2 — Admin setup (Seasons / Activities / Pricing)

> **Status:** F2 implementation complete (Steps 1–6).  
> **Goal:** Authenticated admin can manage seasons, activities, activity pricing, and clothing pricing via the UI — enough to configure a season before registrations (F3/F4).  
> **Out of scope:** Public registration forms, registration review queue, payments, groups, dashboard, parents/students.  
> **Depends on:** F0 (API client, layouts) + F1 (JWT / protected `/admin`).  
> **Branch:** `feature/admin-setup`

---

## Branching recommendation

**Current:** `feature/admin-auth` (F1). That branch’s job is auth. F2 is a different feature slice.

| Option | When | Recommendation |
|--------|------|----------------|
| **A — New branch `feature/admin-setup` (preferred)** | After F1 is committed/pushed | Start F2 here. Cleaner PRs and history. |
| **B — Keep stacking on `feature/admin-auth`** | Only if you won’t merge F1 soon and want one long PR | Works, but the PR mixes auth + setup screens. |

**Practical flow:**

1. Finish any leftover F1 commits on `feature/admin-auth` (commit/push).
2. Open/merge PR `feature/admin-auth` → `main` (or merge locally into `main`).
3. From updated `main`: `git checkout -b feature/admin-setup`.
4. If F1 is not merged yet: branch from `feature/admin-auth` → `feature/admin-setup`, then rebase onto `main` after F1 merges.

Do **not** put F2 work into commits titled around auth if you can avoid it.

---

## Backend APIs used (all JWT-protected)

| Area | Endpoints |
|------|-----------|
| Seasons | `GET/POST /api/seasons`, `GET /api/seasons/{id}`, `GET /api/seasons/active`, `PUT /api/seasons/{id}`, `PATCH .../activate`, `PATCH .../deactivate` |
| Activities | `GET/POST /api/activities`, `GET .../active`, `GET .../{id}`, `GET .../type/{type}`, `PUT .../{id}`, `PATCH .../activate\|deactivate` |
| Activity pricing | `GET/POST /api/activity-pricing`, `GET .../{id}`, `PUT .../{id}` |
| Clothing pricing | `GET/POST /api/clothing-pricing`, `GET .../{id}`, `GET .../season/{seasonId}`, `PUT .../{id}` |

Enums needed on the frontend: `ActivityType`, `AgeGroup`, `SwimmingLessonType` (string unions matching backend).

---

## Target structure (end of F2)

```
frontend/src/
  api/
    seasons.ts
    activities.ts
    activityPricing.ts
    clothingPricing.ts
  types/
    enums.ts                 # shared enum unions
  pages/admin/
    SeasonsPage.tsx
    ActivitiesPage.tsx
    ActivityPricingPage.tsx
    ClothingPricingPage.tsx
  components/admin/          # optional small shared table/form bits
  routes/index.tsx           # /admin/seasons, /activities, /activity-pricing, /clothing-pricing
  layouts/AdminLayout.tsx    # nav links to the four areas
```

UI bar: functional admin forms/tables, not visual polish. Show `ApiError.message` (+ `fieldErrors` when present).

---

## Steps & recommended commits

### Step 1 — Shared enums + admin nav shell
**Do:** `types/enums.ts`; add admin nav links (can point to placeholder pages or empty routes); nest routes under `RequireAuth` + `AdminLayout`.  
**Commit:** `feat(frontend): add admin setup nav and shared enums`

---

### Step 2 — Seasons API + list/create/activate
**Do:** `api/seasons.ts`; `SeasonsPage` — list seasons, create form (name, dates, isActive), activate/deactivate actions, optional edit via PUT.  
**Verify:** With backend + login, create a season and activate it.  
**Commit:** `feat(frontend): add seasons admin page`

---

### Step 3 — Activities API + list/create/activate
**Do:** `api/activities.ts`; `ActivitiesPage` — list, create (`FOOTBALL` / `SWIMMING` + isActive), activate/deactivate. (Usually only two activity types exist.)  
**Commit:** `feat(frontend): add activities admin page`

---

### Step 4 — Activity pricing API + page
**Do:** `api/activityPricing.ts`; page — list pricing rows; create form with season select, activity type, football vs swimming fields (`ageGroup` vs `swimmingLessonType` / `weeklySessions`), monthly price; edit price via PUT.  
**Commit:** `feat(frontend): add activity pricing admin page`

---

### Step 5 — Clothing pricing API + page
**Do:** `api/clothingPricing.ts`; page — list; create one-per-season (short/long/hoodie prices); edit via PUT; filter/show by season.  
**Commit:** `feat(frontend): add clothing pricing admin page`

---

### Step 6 — Wire-up polish
**Do:** Admin home links to the four pages; consistent empty/loading/error states; surface validation `fieldErrors`; README blurb for admin setup URLs.  
**Commit:** `feat(frontend): polish admin setup navigation and errors`

---

## Execution rules (same as F0/F1)

1. One step at a time; explain + suggest commit; wait for approval.  
2. No F3+ screens.  
3. Do not commit unless asked.

---

## Acceptance checklist (end of F2)

- [x] Admin can CRUD/activate seasons from UI  
- [x] Admin can manage football/swimming activities  
- [x] Admin can create/update activity pricing (type-specific fields)  
- [x] Admin can create/update clothing pricing per season  
- [x] All calls use JWT via existing `apiRequest`  
- [x] Errors use `ApiError` / `ErrorResponse`  
- [x] Work lives on `feature/admin-setup`
