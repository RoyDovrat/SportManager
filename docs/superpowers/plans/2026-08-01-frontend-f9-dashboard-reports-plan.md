# Frontend Phase F9 — Admin dashboard + season reports

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Authenticated admin sees a live season dashboard (counts, open charges, recent registrations) and can open season reports (registrations / payments / clothing).

**Architecture:** Thin Hebrew admin UI over existing JWT APIs — `GET /api/dashboard` and `GET /api/reports/*`. Prefer `/api/reports/summary` for a single reports page with sections (avoid N+1 section fetches unless tabs need lazy load). Reuse existing `RegistrationResponse` / `PaymentResponse` / `ClothingOrderResponse` types from current API modules where possible.

**Tech Stack:** React 19 + Vite + TypeScript, existing `apiRequest`, Hebrew `t()` / labels, functional admin tables (same visual bar as F4–F8). No chart library unless a tiny CSS layout needs it — **YAGNI: numbers + tables first**.

## Global Constraints

- UI language: Hebrew (RTL) via `t('…')` in `frontend/src/i18n/he.ts`; enums via `labels.ts`.
- Do not commit unless the user asks.
- Approve between stages (unless user says do all stages together).
- Backend APIs already exist — **no backend work expected** unless a bug is found.
- Out of scope: editing data from dashboard, charts/graphs, PDF export, parent-facing portal, Kibbutz Excel (done in F8).

---

## Roadmap

| Phase | Status |
|-------|--------|
| F0–F8 | Done |
| **F9** | **Done — frontend MVP complete** |

---

## Backend APIs (already implemented)

### Dashboard

| Action | Endpoint |
|--------|----------|
| Get dashboard | `GET /api/dashboard?seasonId=` (`seasonId` optional) |

**Season resolution (server):**
- If `seasonId` provided → that season (404 if missing)
- Else → first `isActive=true` season, or null if none

**`DashboardResponse` fields:**

| Field | Type | Notes |
|-------|------|--------|
| `seasonId` / `seasonName` | number / string \| null | Resolved season |
| `totalRegistrations` | number | |
| `pendingRegistrations` | number | |
| `approvedRegistrations` | number | |
| `cancelledRegistrations` | number | |
| `activeStudents` | number | Distinct students with APPROVED |
| `openChargesCount` | number | PENDING payments |
| `openChargesAmount` | number | Sum PENDING |
| `monthlyIncome` | number | **Global** PAID where `paymentDate` in current calendar month — **not season-filtered** |
| `paymentStatusSummary` | object | pending/paid/cancelled counts + amounts |
| `recentRegistrations` | `RegistrationResponse[]` | Top 10 |

`PaymentStatusSummary`: `pendingCount`, `paidCount`, `cancelledCount`, `pendingAmount`, `paidAmount`, `cancelledAmount`.

### Reports

| Action | Endpoint |
|--------|----------|
| Full season report | `GET /api/reports/summary?seasonId=` (**required**) |
| Registrations section | `GET /api/reports/registrations?seasonId=` |
| Payments section | `GET /api/reports/payments?seasonId=` |
| Clothing section | `GET /api/reports/clothing?seasonId=` |

**MVP uses `/summary` only** (one request). Section endpoints are available if later we want lazy tabs.

**`SeasonReportResponse`:**
- `seasonId`, `seasonName`
- `registrations`: totals + `items: RegistrationResponse[]` (**all** season regs)
- `payments`: status totals/amounts + `items: PaymentResponse[]`
- `clothing`: `totalOrders`, `ordersRequiringPayment`, `alreadyHasClothingCount` + `items: ClothingOrderResponse[]`

**Caution:** Report `items` can be large (full season). Use scrollable tables; no server pagination. Do not auto-render huge charts.

---

## Design (locked)

| Piece | Decision |
|-------|----------|
| Dashboard route | `/admin` **becomes** the live dashboard (replace pure link-hub), **or** `/admin/dashboard` with home redirect — **prefer `/admin` as dashboard** + keep quick links section below stats |
| Reports route | `/admin/reports` |
| Season filter | Select on both pages; default = active season from `GET /api/seasons` |
| Dashboard cards | Registration counts, active students, open charges (count + amount), monthly income (with hint “חודש קלנדרי נוכחי — כל העונות”), payment summary |
| Recent regs | Table with link to `/admin/registrations/:id` |
| Reports page | Season select → load summary → three sections (registrations / payments / clothing) with summary numbers + tables |
| Deep links | From report/dashboard rows → existing detail pages where ids exist |
| Errors | `formatApiError` |
| Visual bar | Functional admin UI; no new design system |

**Important copy:** Label `monthlyIncome` clearly so admins do not think it is season-scoped.

---

## Stages

| Stage | What | Suggested commit |
|-------|------|------------------|
| **1** | API helpers: `api/dashboard.ts` + `api/reports.ts` (+ types) ✅ | `feat(frontend): add dashboard and reports API helpers` |
| **2** | Routes + nav + wire Admin home as dashboard shell ✅ | `feat(frontend): add dashboard and reports nav` |
| **3** | Live dashboard (stats + recent registrations) ✅ | `feat(frontend): add admin dashboard stats` |
| **4** | Reports page (summary sections + tables) ✅ | `feat(frontend): add season reports page` |
| **5** | Polish + README ✅ | `feat(frontend): polish dashboard and reports UX` |

---

## Target structure

```
frontend/src/
  api/dashboard.ts
  api/reports.ts                 # getSeasonReport(seasonId) → /summary
  pages/admin/
    DashboardPage.tsx            # or evolve AdminHomePage.tsx
    ReportsPage.tsx
  i18n/he.ts
  layouts/AdminLayout.tsx
  routes/index.tsx
README.md
```

**Reuse:**
- `api/registrations.ts` → `RegistrationResponse`
- `api/payments.ts` → `PaymentResponse`
- `api/clothingOrders.ts` → `ClothingOrderResponse` (confirm export name)
- `api/seasons.ts` → season dropdown
- `i18n/labels.ts` for status/type labels

---

## Stage details

### Stage 1 — API helpers

**Do:**
- `getDashboard(seasonId?: number | null)` → `GET /api/dashboard` (omit param when null)
- Types for `DashboardResponse` + `PaymentStatusSummary`
- `getSeasonReport(seasonId: number)` → `GET /api/reports/summary?seasonId=`
- Types for `SeasonReportResponse` and nested sections (import item types from existing modules)

**Verify:** `npm run build`

**Commit:** `feat(frontend): add dashboard and reports API helpers`

---

### Stage 2 — Nav + shell

**Do:**
- Nav: `לוח בקרה` → `/admin` (or `/admin/dashboard` if keeping home separate — stick to **dashboard at `/admin`**)
- Nav: `דוחות` → `/admin/reports`
- Refactor `AdminHomePage` into dashboard shell: season select placeholder + “quick links” list kept at bottom
- Route for `ReportsPage` placeholder
- Hebrew keys: `nav.dashboard`, `nav.reports`, `dashboard.*`, `reports.*`

**Verify:** Navigate while logged in.

**Commit:** `feat(frontend): add dashboard and reports nav`

---

### Stage 3 — Live dashboard

**Do:**
- On mount / season change: `getDashboard(seasonId)`
- Render stat blocks (simple grid of labeled numbers — not cards-as-marketing)
- Recent registrations table (student, activity, status, date, link)
- Empty / no-season messaging
- Format amounts with `he-IL` locale (same as payments page)

**Verify:** With seeded data, counts match backend; change season updates stats; monthly income hint visible.

**Commit:** `feat(frontend): add admin dashboard stats`

---

### Stage 4 — Reports page

**Do:**
- Season select (required; default active)
- Load `getSeasonReport`
- Three sections:
  1. Registrations — totals + table (link to detail)
  2. Payments — totals/amounts + table (link to payment detail)
  3. Clothing — totals + table (link to clothing order detail)
- Loading / error states

**Verify:** Switch season; open a row detail; large season still usable (scroll).

**Commit:** `feat(frontend): add season reports page`

---

### Stage 5 — Polish + README

**Do:**
- README: document dashboard + reports routes and monthly-income caveat
- Copy polish; quick links still useful on dashboard
- Optional: link “ממתין לאישור” count → `/admin/registrations` with pending filter if easy
- `npm run build`
- Mark F9 plan complete

**Commit:** `feat(frontend): polish dashboard and reports UX`

---

## Acceptance checklist (end of F9)

- [x] Dashboard loads for active season by default  
- [x] Season filter updates dashboard stats  
- [x] Registration / student / open-charge numbers shown  
- [x] Monthly income labeled as current calendar month (all seasons)  
- [x] Recent registrations list with detail links  
- [x] Reports page loads full season summary  
- [x] Registration / payment / clothing sections with tables  
- [x] Hebrew UI + README  
- [x] `npm run build` passes  

---

## Execution rules

1. One stage at a time with **approve**, unless user says do all together.  
2. Hebrew via `t()`.  
3. Do not commit unless asked.  
4. Branch: `feature/admin-dashboard` (from updated `main` or after merging F8).  

---

## Manual test recipe

1. Login admin; ensure active season has registrations + payments + clothing orders.  
2. Open `/admin` — stats and recent list look right.  
3. Switch season — numbers change.  
4. Open `/admin/reports` — three sections populate; follow links to detail pages.  
5. Confirm monthly income matches paid payments dated in the current calendar month (any season).  
