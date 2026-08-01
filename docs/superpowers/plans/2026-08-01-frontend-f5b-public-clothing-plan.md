# Frontend Phase F5b — Public clothing orders (parents)

> **Status:** F5b implementation complete (Stages 0–3).  
> **Decision:** Option **B** — parents order clothing only after football registration is **APPROVED** (come back later with season + student identity).  
> **Goal:** Public page to create a clothing order / “already has clothing” skip; admin continues to **list and view** orders (F5 admin slice).  
> **UI language:** Hebrew (RTL) via `t()`.  
> **Out of scope:** Clothing payments (F6), changing approval rules, parent login portal.  
> **Branch:** `feature/public-clothing-orders`  
> Create from `feature/admin-clothing-orders` (or updated `main` after F5 merges).

---

## Design (locked)

| Piece | Decision |
|-------|----------|
| When | Only after registration is `APPROVED` (existing backend rule) |
| Who creates | Parents via public form (no JWT) |
| Admin role | List + detail (already done); keep admin create form as staff backup |
| Route | `/register/clothing` |
| Inputs | Active season (loaded), student identity, already-has OR kit sizes/qty + optional shirt number |
| Success | Inline success with order id + note that payment comes later (admin) |
| Errors | `formatApiError` (e.g. not approved, no football reg, duplicate order) |

---

## Backend change (required)

Today only admins can `POST /api/clothing-orders`.

**Stage 0:** In `SecurityConfig`, add:

```text
POST /api/clothing-orders   → permitAll
```

Do **not** open list/get clothing-orders publicly (admin-only).

Business rules stay in `ClothingOrderService` (approved football registration, one order per registration, skip vs items).

---

## Stages

| Stage | What | Suggested commit |
|-------|------|------------------|
| **0** | Permit public `POST /api/clothing-orders` | `fix(backend): allow public clothing order create` |
| **1** | Public route + nav + home card | `feat(frontend): add public clothing order route` |
| **2** | Public clothing form page | `feat(frontend): add public clothing order form` |
| **3** | Polish + README + link from football success (optional hint) | `feat(frontend): polish public clothing order UX` |

---

## Target structure

```
backend/.../config/SecurityConfig.java     # Stage 0

frontend/src/
  pages/public/ClothingOrderPage.tsx       # public form
  components/clothing/                     # optional shared kit fields helper
  api/clothingOrders.ts                    # reuse createClothingOrder()
  layouts/PublicLayout.tsx                 # nav link
  pages/PublicHomePage.tsx                 # card
  routes/index.tsx
  i18n/he.ts
  README.md
```

Admin pages from F5 stay as-is (`/admin/clothing-orders`).

---

## Stage details

### Stage 0 — Backend public create
**Do:** `permitAll` for `POST /api/clothing-orders` only.  
**Verify:** Unauthenticated POST with valid approved football student/season returns `201`; GET list without JWT still `401`.  
**Commit:** `fix(backend): allow public clothing order create`

---

### Stage 1 — Public shell
**Do:** Route `/register/clothing` (placeholder OK); public nav + home card “הזמנת ביגוד”; Hebrew keys.  
**Commit:** `feat(frontend): add public clothing order route`

---

### Stage 2 — Public form
**Do:** `ClothingOrderPage`

- Load active season (`getActiveSeason` / public catalog); show season name  
- Fields: identity, already-has checkbox, kit fields when ordering  
- Submit via existing `createClothingOrder`  
- Success state; clear errors via `formatApiError`  
- Hint copy: only after admin approved football registration  

Reuse form field patterns from admin create (extract shared kit UI only if it stays small).

**Verify:** End-to-end without login after approving a football registration.  
**Commit:** `feat(frontend): add public clothing order form`

---

### Stage 3 — Polish + README
**Do:**

- Empty/no-active-season states  
- README: public `/register/clothing` + note admin list  
- Optional: on football registration success, link “לאחר אישור — הזמנת ביגוד”  
- Mark checklist complete  

**Commit:** `feat(frontend): polish public clothing order UX`

---

## Execution rules

1. One stage at a time; explain + suggest commit; wait for **approve**.  
2. Keep admin list/detail/create.  
3. Hebrew via `t()`.  
4. Do not commit unless asked.  
5. Do not start F6 payments here.

---

## Acceptance checklist

- [x] Unauthenticated parent can `POST` clothing order  
- [x] Public page `/register/clothing` works in Hebrew  
- [x] Rejects non-approved / non-football / duplicate (backend messages shown)  
- [x] “Already has clothing” skip works publicly  
- [x] Admin still lists/views orders at `/admin/clothing-orders`  
- [x] List/get clothing APIs remain JWT-protected  
- [x] README updated  

