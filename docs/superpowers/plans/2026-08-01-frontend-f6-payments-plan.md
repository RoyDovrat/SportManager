# Frontend Phase F6 — Admin payments (option B)

> **Status:** F6 implementation complete (Stages 1–6).  
> **Goal:** Authenticated admin can list/filter payments, open detail, confirm or cancel, bulk-generate monthly charges, and create clothing payments from a clothing order.  
> **UI language:** Hebrew (RTL) via `t()` + enum labels.  
> **Out of scope:** Single monthly create (`POST /monthly`), manual one-time (`POST /manual`), Kibbutz Excel (F8), dashboard (F9), public parent payment UI.  
> **Depends on:** F4 (approved registrations), F5/F5b (clothing orders for clothing charges). Backend payment APIs already exist — **no backend work expected**.  
> **Branch:** `feature/admin-payments`  
> Create from updated `main`, or from `feature/public-clothing-orders` if F5b is not merged yet.

---

## Roadmap reminder

| Phase | Status |
|-------|--------|
| F0–F5b | Done |
| **F6** | **Next — payments (B)** |
| F7 | Activity groups |
| F8 | Kibbutz Excel export |
| F9 | Dashboard + reports |

**After F6: 3 phases left.**

---

## Design choice (locked)

**Option B — Desk + billing actions**

| Piece | Decision |
|-------|----------|
| List | `/admin/payments` — filters: status, type, charge month (optional registration id later if needed) |
| Detail | `/admin/payments/:id` — full payment + confirm / cancel |
| Confirm | Confirm dialog; for non-kibbutz require method `BIT` or `PAYBOX`; kibbutz uses `KIBBUTZ_BUDGET` (backend ignores override) |
| Cancel | Confirm dialog; only when not already `PAID` / `CANCELLED` |
| Generate monthly | Panel on list page: charge month (`YYYY-MM-01`), optional season (default active) → `POST /monthly/generate` → show created/skipped counts |
| Clothing payment | Form: clothing order id → `POST /clothing` (or deep-link from clothing order detail later — optional polish) |
| Defaults | Status filter `PENDING` on first load |
| Errors | `formatApiError` |
| Visual bar | Functional admin UI like F4/F5 |

---

## Backend APIs used (JWT)

| Action | Endpoint |
|--------|----------|
| List | `GET /api/payments?registrationId=&status=&paymentType=&chargeMonth=` |
| Get | `GET /api/payments/{id}` |
| Confirm | `PATCH /api/payments/{id}/confirm` body `{ paymentMethod? }` |
| Cancel | `PATCH /api/payments/{id}/cancel` |
| Generate monthly | `POST /api/payments/monthly/generate` `{ chargeMonth, seasonId? }` |
| Clothing payment | `POST /api/payments/clothing` `{ clothingOrderId }` |
| Seasons | `GET /api/seasons` (filter helpers) |

### `PaymentResponse` fields

id, registrationId, student/parent names, isKibbutzMember, amount, chargeMonth, status, paymentDate, paymentMethod, paymentType, clothingOrderId.

Enums: `PaymentStatus` (`PENDING` / `PAID` / `CANCELLED`), `PaymentType` (`MONTHLY_ACTIVITY` / `CLOTHING` / `MANUAL_ONE_TIME`), `PaymentMethod` (`BIT` / `PAYBOX` / `KIBBUTZ_BUDGET`).

---

## Stages

| Stage | What | Suggested commit |
|-------|------|------------------|
| **1** | Payment API helpers + enums + Hebrew labels | `feat(frontend): add payment API helpers` |
| **2** | Routes + nav + admin home card | `feat(frontend): add payments nav and routes` |
| **3** | List page + filters | `feat(frontend): add payments list with filters` |
| **4** | Detail + confirm / cancel | `feat(frontend): add payment detail confirm/cancel` |
| **5** | Generate monthly + create clothing payment | `feat(frontend): add monthly generate and clothing payment` |
| **6** | Polish + README | `feat(frontend): polish admin payments UX` |

---

## Target structure

```
frontend/src/
  types/enums.ts                 # PaymentStatus, PaymentType, PaymentMethod
  api/payments.ts                # list, get, confirm, cancel, generateMonthly, createClothing
  pages/admin/
    PaymentsPage.tsx             # list + filters + generate + clothing create
    PaymentDetailPage.tsx        # detail + actions
  i18n/he.ts + labels.ts
  layouts/AdminLayout.tsx
  pages/AdminHomePage.tsx
  routes/index.tsx
  README.md
```

---

## Stage details

### Stage 1 — API helpers + enums
**Do:** Add enums + labels; `api/payments.ts` with types and methods above. Query params omit nulls; `chargeMonth` as `YYYY-MM-01`.  
**Verify:** `npm run build`  
**Commit:** `feat(frontend): add payment API helpers`

---

### Stage 2 — Routes + nav
**Do:** `/admin/payments`, `/admin/payments/:id` placeholders; nav **תשלומים**; home card.  
**Commit:** `feat(frontend): add payments nav and routes`

---

### Stage 3 — List + filters
**Do:** `PaymentsPage` — filters status (default `PENDING`), type, charge month; table: id, student, amount, month, type, status, method, kibbutz, link to detail.  
**Commit:** `feat(frontend): add payments list with filters`

---

### Stage 4 — Detail + confirm/cancel
**Do:** `PaymentDetailPage` — read-only fields; Approve/Confirm with method select when needed; Cancel with confirm; disable while acting; refresh on success.  
**Commit:** `feat(frontend): add payment detail confirm/cancel`

---

### Stage 5 — Generate monthly + clothing payment
**Do:** On list page (or adjacent panels):

- Generate: month input + season select → call generate → show `createdCount` / `skippedCount` + reload list  
- Clothing payment: clothing order id → create → success message + reload  

**Commit:** `feat(frontend): add monthly generate and clothing payment`

---

### Stage 6 — Polish + README
**Do:** Empty states; enum labels everywhere; README admin payment URLs; mark checklist complete. Optional: link from clothing order detail “צור חיוב ביגוד”.  
**Commit:** `feat(frontend): polish admin payments UX`

---

## Execution rules

1. One stage at a time; explain + suggest commit; wait for **approve**.  
2. No backend changes unless an API gap is found.  
3. Hebrew via `t()`.  
4. Do not commit unless asked.  
5. Do not start F7/F8 in this phase.

---

## Acceptance checklist (end of F6)

- [x] Admin opens `/admin/payments` when logged in  
- [x] List filters by status / type / charge month; default favors `PENDING`  
- [x] Detail shows payment data  
- [x] Confirm works (BIT/PAYBOX for non-kibbutz; kibbutz OK)  
- [x] Cancel works for pending charges  
- [x] Bulk monthly generate reports created/skipped  
- [x] Clothing payment create from order id  
- [x] Errors via `formatApiError`  
- [x] Hebrew UI + README payment URLs  

