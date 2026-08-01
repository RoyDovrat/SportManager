# Frontend Phase F8 — Kibbutz Excel export

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Authenticated admin can download a monthly Kibbutz billing Excel (`.xlsx`) for pending kibbutz-budget charges.

**Architecture:** Thin admin UI over existing `GET /api/exports/kibbutz?year=&month=`. Frontend must download binary with JWT (not `window.open` — that drops the Bearer header). Reuse Hebrew `t()` patterns from payments.

**Tech Stack:** React 19 + Vite + TypeScript, `fetch` + `Blob` download, existing Spring Boot export (Apache POI).

## Global Constraints

- UI language: Hebrew (RTL) via `t('…')` in `frontend/src/i18n/he.ts`; enum labels via `labels.ts` if needed.
- Do not commit unless the user asks.
- Approve between stages (unless user says do all stages together).
- Backend export API already exists — **no backend work expected** unless a bug is found.
- Out of scope: emailing the file, editing payment rows from export, dashboard (F9), changing export column definitions.

---

## Roadmap

| Phase | Status |
|-------|--------|
| F0–F7 | Done (activity groups complete) |
| **F8** | **Complete — Kibbutz Excel** |
| F9 | Dashboard + reports |

**After F8: 1 frontend phase left (F9).**

---

## Backend API (already implemented)

| Action | Endpoint |
|--------|----------|
| Export | `GET /api/exports/kibbutz?year={int}&month={int}` |

**Auth:** JWT required.

**Success response:**
- Body: raw `.xlsx` bytes
- `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `Content-Disposition: attachment; filename="חיוב-קיבוץ-YYYY-MM.xlsx"`

**Export contents (server-side):**
- Rows: payments that are `PENDING` + method `KIBBUTZ_BUDGET` + `chargeMonth` = first day of selected month
- Columns (Hebrew): שם הורה, שם תלמיד/ה, מספר תקציב, סכום לחיוב
- Last row: סה״כ חודשי + total amount
- Empty month: still a valid workbook (headers + total 0)

**Validation errors (JSON ErrorResponse, not file):**
- year outside 2000–2100
- month not 1–12

Controller: `KibbutzExportController`  
Service: `KibbutzExportService`  
Repo query: `PaymentRepository.findKibbutzExportPayments`

---

## Design (locked)

| Piece | Decision |
|-------|----------|
| Entry | New admin page `/admin/exports/kibbutz` + nav link + home card |
| Inputs | Year + month (defaults: current calendar month) |
| Action | Button “הורדת קובץ Excel” → download |
| Download | `fetch` with Bearer → `Blob` → temporary `<a download>` click |
| Empty data | Still download file; show short hint that month may have no pending kibbutz charges |
| Errors | `formatApiError` on JSON error bodies |
| Optional polish | Link from `/admin/payments` (“ייצוא קיבוץ”) to this page with month prefilled from payment filters if easy |

**Do not** use `apiRequest` as-is for success path — it only parses JSON. Add `apiDownload` (or export-specific helper) that returns `{ blob, fileName }`.

---

## Stages

| Stage | What | Suggested commit |
|-------|------|------------------|
| **1** | Binary download helper + `api/kibbutzExport.ts` ✅ | `feat(frontend): add kibbutz export API download helper` |
| **2** | Route + nav + admin home card ✅ | `feat(frontend): add kibbutz export nav and route` |
| **3** | Export page UI (year/month + download) ✅ | `feat(frontend): add kibbutz excel export page` |
| **4** | Polish + README + optional payments deep-link ✅ | `feat(frontend): polish kibbutz export UX` |

---

## Target structure

```
frontend/src/
  api/client.ts              # add apiDownload (blob + filename from Content-Disposition)
  api/kibbutzExport.ts       # downloadKibbutzExport(year, month)
  pages/admin/
    KibbutzExportPage.tsx    # form + download button + hints
  i18n/he.ts
  layouts/AdminLayout.tsx
  pages/AdminHomePage.tsx
  routes/index.tsx
README.md                    # document /admin/exports/kibbutz
```

---

## Stage details

### Stage 1 — Download helper + API module

**Do:**
1. In `api/client.ts`, add something like:

```ts
export async function apiDownload(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ blob: Blob; fileName: string | null }>
```

- Same auth / 401 handling as `apiRequest`
- On `!ok`, parse JSON error when possible and throw `ApiError`
- On success: `response.blob()`, parse `Content-Disposition` filename (quoted or bare)
- Fallback filename: `kibbutz-export.xlsx` if header missing

2. Add `api/kibbutzExport.ts`:

```ts
export function downloadKibbutzExport(year: number, month: number) {
  return apiDownload(`/api/exports/kibbutz?year=${year}&month=${month}`)
}
```

**Verify:** `npm run build`

**Commit:** `feat(frontend): add kibbutz export API download helper`

---

### Stage 2 — Nav + route

**Do:**
- Route: `/admin/exports/kibbutz` → `KibbutzExportPage` (placeholder OK)
- `AdminLayout` nav: e.g. `ייצוא קיבוץ`
- `AdminHomePage` card pointing to the page
- Hebrew keys under `nav.kibbutzExport`, `adminHome.kibbutzExportDesc`, `kibbutzExport.*`

**Verify:** Navigate while logged in; placeholder renders.

**Commit:** `feat(frontend): add kibbutz export nav and route`

---

### Stage 3 — Export page

**Do:** `KibbutzExportPage.tsx`
- Intro text: exports **pending kibbutz-budget** charges for the selected month
- Fields: year (number), month (select 1–12 or `type="month"` → split year/month)
- Default: today’s year/month
- Submit → call download helper → trigger browser save
- Loading / disabled while downloading
- Success message optional (“ההורדה החלה”)
- Errors via `formatApiError`

**Browser download helper (inline or tiny util):**

```ts
function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
```

**Verify:**
1. Seed/create PENDING + `KIBBUTZ_BUDGET` payment for a month (via payments UI)
2. Export that month → file opens in Excel with expected columns
3. Export empty month → file still downloads
4. Invalid year → error shown, stay logged in

**Commit:** `feat(frontend): add kibbutz excel export page`

---

### Stage 4 — Polish + README

**Do:**
- README admin bullet for Kibbutz export
- Optional: link from `PaymentsPage` to export page
- Copy polish in Hebrew
- `npm run build`

**Commit:** `feat(frontend): polish kibbutz export UX`

---

## Acceptance checklist (end of F8)

- [x] Admin can open Kibbutz export page from nav/home  
- [x] Year + month selection works  
- [x] Download returns `.xlsx` with JWT (no anonymous open)  
- [x] File has Hebrew headers + total row (backend)  
- [x] Empty month still downloads (backend)  
- [x] API validation errors show in UI without logout  
- [x] README updated  
- [x] `npm run build` passes  

---

## Execution rules

1. One stage at a time with **approve**, unless user says do all together.  
2. Hebrew via `t()`.  
3. Do not commit unless asked.  
4. Do not start F9 until F8 acceptance is done.  
5. Branch: `feature/admin-kibbutz-export` (from updated `main` or after merging F7).  

---

## Manual test recipe

1. Login admin.  
2. Ensure a kibbutz parent registration is approved and has a **PENDING** payment with method `KIBBUTZ_BUDGET` for month M.  
3. `/admin/exports/kibbutz` → choose year/month M → download.  
4. Open Excel: parent, student, budget number, amount, total row.  
5. Repeat for a month with no such payments → file still downloads.  
