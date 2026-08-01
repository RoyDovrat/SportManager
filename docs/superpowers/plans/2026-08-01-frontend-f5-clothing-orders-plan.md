# Frontend Phase F5 — Admin clothing orders

> **Status:** F5 admin slice complete (Stages 1–5).  
> **Goal:** Authenticated admin can list clothing orders and create orders (or “already has clothing” skips) for approved football registrations.  
> **UI language:** Hebrew (RTL) via `frontend/src/i18n` (`t()` + enum labels).  
> **Out of scope (this slice):** Clothing *payments* (F6), groups, Kibbutz export, dashboard.  
> **Follow-up (requested):** Public parent clothing order form — not in Stages 1–5; plan separately (needs public `POST` + UX choice A/B/C).  
> **Depends on:** F2 (clothing pricing exists), F4 (registrations can be `APPROVED`). Backend clothing-order APIs already exist for admin.  
> **Branch:** `feature/admin-clothing-orders`

---

## Frontend roadmap (phases left)

| Phase | Status | Topic |
|-------|--------|--------|
| F0 | Done | Scaffold + API client |
| F1 | Done | Admin auth |
| F2 | Done | Seasons / activities / pricing |
| F3 | Done | Public registration |
| F4 | Done | Admin registration review |
| **F5** | **Next** | **Clothing orders** |
| F6 | Planned | Payments (list, confirm, cancel, generate monthly, clothing charge) |
| F7 | Planned | Activity groups + assignment |
| F8 | Planned | Kibbutz Excel export |
| F9 | Planned | Dashboard + reports |

**After F4: 5 frontend phases left (F5–F9).**  
Backend MVP APIs for these areas already exist.

---

## Stages (same cadence as F0–F4)

One stage at a time → explain → suggest commit → wait for **approve**.

| Stage | What | Suggested commit |
|-------|------|------------------|
| **1** | Clothing order API helpers + `ClothingSize` enum | `feat(frontend): add clothing order API helpers` |
| **2** | Routes + nav + admin home card | `feat(frontend): add clothing orders nav and routes` |
| **3** | List page (season / identity filters) | `feat(frontend): add clothing orders list` |
| **4** | Create order form (items or already-has skip) | `feat(frontend): add clothing order create form` |
| **5** | Detail view + polish + README | `feat(frontend): polish clothing orders UX` |

---

## Design choice (locked for this plan)

| Piece | Decision |
|-------|----------|
| List | `/admin/clothing-orders` — filter by season + optional student identity |
| Create | Same page (form above list) or `/admin/clothing-orders/new` — prefer **form on list page** (matches F2 seasons pattern) |
| Detail | `/admin/clothing-orders/:id` — read-only order details |
| Create rules (client UX) | Require season + identity; if `alreadyHasClothing` → hide/disable kit fields; else collect quantities/sizes (+ optional shirt number) |
| Football only | Backend rejects non-football / non-approved — surface `formatApiError` |
| Hebrew | All copy via `t()`; sizes via `labels.ts` |

---

## Backend APIs used (all JWT-protected)

| Action | Endpoint |
|--------|----------|
| List | `GET /api/clothing-orders?seasonId=&studentIdentityNumber=` |
| Get one | `GET /api/clothing-orders/{orderId}` |
| Create | `POST /api/clothing-orders` |
| Seasons for filter | `GET /api/seasons` (existing) |

### `ClothingOrderRequest`

| Field | Notes |
|-------|--------|
| `studentIdentityNumber` | required |
| `seasonId` | required |
| `alreadyHasClothing` | required boolean |
| `shortKitQuantity` / `shortKitSize` | when ordering |
| `longKitQuantity` / `longKitSize` | when ordering |
| `hoodieQuantity` / `hoodieSize` | when ordering |
| `shirtNumber` | optional |

When `alreadyHasClothing=true`, kit fields should be omitted/empty (backend stores skip; `clothingPaymentRequired=false`).

### `ClothingOrderResponse`

Includes student names, season, kit lines, `alreadyHasClothing`, `clothingPaymentRequired`, `registrationId`.

---

## Target routes

```
/admin/clothing-orders          List + create form
/admin/clothing-orders/:id      Detail (read-only)
```

Under `RequireAuth` + `AdminLayout`.

---

## Target structure

```
frontend/src/
  types/enums.ts                 # add CLOTHING_SIZES / ClothingSize
  api/clothingOrders.ts          # list, getById, create
  pages/admin/
    ClothingOrdersPage.tsx       # list + create
    ClothingOrderDetailPage.tsx  # detail
  i18n/he.ts + labels.ts
  layouts/AdminLayout.tsx
  pages/AdminHomePage.tsx
  routes/index.tsx
  README.md
```

---

## Stage details

### Stage 1 — API helpers + enum
**Do:** `ClothingSize` in `enums.ts`; Hebrew size labels; `api/clothingOrders.ts` with types + `listClothingOrders` / `getClothingOrder` / `createClothingOrder`.  
**Verify:** `npm run build`  
**Commit:** `feat(frontend): add clothing order API helpers`

---

### Stage 2 — Routes + nav
**Do:** Placeholder pages; nav **הזמנות ביגוד**; admin home card; Hebrew keys.  
**Commit:** `feat(frontend): add clothing orders nav and routes`

---

### Stage 3 — List page
**Do:** Season filter (default active), optional identity search; table: id, student, season, already-has, payment required, link to detail.  
**Commit:** `feat(frontend): add clothing orders list`

---

### Stage 4 — Create form
**Do:** Form on list page: season, identity, already-has checkbox; when false show kit qty/size fields + shirt number; submit → create → reload list / show success.  
**Verify:** Create skip order and real kit order against approved football registration.  
**Commit:** `feat(frontend): add clothing order create form`

---

### Stage 5 — Detail + polish + README
**Do:** Detail page; empty states; README URLs; mark acceptance checklist complete.  
**Commit:** `feat(frontend): polish clothing orders UX`

---

## Execution rules

1. One stage at a time; explain + suggest commit; wait for **approve**.  
2. No backend changes unless an API gap is found.  
3. All new UI strings via `t()` in Hebrew.  
4. Do not commit unless asked.  
5. Do not start F6 (payments) in this phase.

---

## Acceptance checklist (end of F5 admin slice)

- [x] Admin can open `/admin/clothing-orders` when logged in  
- [x] List filters by season (+ optional identity)  
- [x] Create order with kit items for approved football registration  
- [x] Create “already has clothing” skip order  
- [x] Detail page shows order data  
- [x] Backend errors surfaced via `formatApiError`  
- [x] Hebrew UI + README clothing-order URLs  
- [x] Public parent clothing order (follow-up F5b — option B)

