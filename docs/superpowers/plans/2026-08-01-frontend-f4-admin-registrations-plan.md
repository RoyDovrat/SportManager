# Frontend Phase F4 — Admin registration review (list + detail)

> **Status:** In progress — Stage 1 done; waiting for approve before Stage 2.  
> **Goal:** Authenticated admin can browse registrations (season + status filters), open a detail view, and approve or cancel with clear status rules and Hebrew UX.  
> **UI language:** Hebrew (RTL) via `frontend/src/i18n` (`t()` + enum labels).  
> **Out of scope:** Edit registration fields, group assignment, clothing orders, payments, dashboard/reports, parent/student CRUD.  
> **Depends on:** F1 (JWT), F2 (seasons for filters), F3 (PENDING creates exist to review). Backend Phase 2 APIs already exist — **no backend work expected**.  
> **Branch:** `feature/admin-registrations`  
> Create from updated `main`, or from `feature/public-registration` if F3 is not merged yet.

---

## Stages (same cadence as F0–F3)

One stage at a time → explain → suggest commit → wait for **approve**.

| Stage | What | Suggested commit |
|-------|------|------------------|
| **1** | Admin registration API helpers | `feat(frontend): add admin registration API helpers` |
| **2** | Routes + nav + admin home card | `feat(frontend): add admin registrations nav and routes` |
| **3** | List page + season/status filters | `feat(frontend): add registrations list with filters` |
| **4** | Detail page + approve/cancel | `feat(frontend): add registration detail approve/cancel` |
| **5** | Polish + README | `feat(frontend): polish admin registration review UX` |

---

## Design choice (locked)

**Option C — Full status browser + detail view**

| Piece | Decision |
|-------|----------|
| List | `/admin/registrations` — table with filters |
| Detail | `/admin/registrations/:id` — full read-only record + actions |
| Filters | Season (required for focused queue; “all seasons” allowed) + Status (`PENDING` / `APPROVED` / `CANCELLED` / all) |
| Default filters | Active season (if any) + status `PENDING` (queue-first) |
| Approve | Only when status is `PENDING` |
| Cancel | When status is `PENDING` or `APPROVED` (backend clears group link on cancel) |
| Already cancelled | No approve/cancel actions |
| Confirm | Confirm dialog before **cancel**; confirm before **approve** as well (avoid misclicks) |
| After action | Stay on detail with updated status, or return to list after success message — prefer **stay on detail** + toast/message, with link back to list |
| Errors | `formatApiError` / `ApiError` (same as F2) |
| Visual bar | Functional admin tables/forms like F2 — not visual polish |

Backend rules already enforced (surface messages as returned):

- Approve when already `APPROVED` → conflict  
- Approve when `CANCELLED` → business rule error  
- Cancel when already `CANCELLED` → conflict  

---

## Backend APIs used (all JWT-protected)

| Action | Endpoint |
|--------|----------|
| List / filter | `GET /api/registrations?seasonId=&status=` |
| Get one | `GET /api/registrations/{id}` |
| Approve | `PATCH /api/registrations/{id}/approve` |
| Cancel | `PATCH /api/registrations/{id}/cancel` |
| Seasons for filter | `GET /api/seasons` (existing) |

`RegistrationResponse` already includes student, parent, activity, season, swimming fields, medical notes, group name, etc. — enough for a detail page without extra endpoints.

---

## Target routes

```
/admin/registrations          List + filters + row link to detail
/admin/registrations/:id      Detail + Approve / Cancel
```

Under `RequireAuth` + `AdminLayout`. Add nav link + admin home card.

---

## Target structure

```
frontend/src/
  api/registrations.ts              # extend: list, getById, approve, cancel
  pages/admin/
    RegistrationsPage.tsx           # list + filters
    RegistrationDetailPage.tsx      # detail + actions
  layouts/AdminLayout.tsx           # nav link
  pages/AdminHomePage.tsx           # card link
  routes/index.tsx                  # two routes
  i18n/he.ts                        # copy for list/detail/actions/confirms
  # labels.ts already has registrationStatusLabel
```

Optional small helper (only if it stays tiny): `components/admin/ConfirmDialog.tsx` or inline `window.confirm` for MVP — prefer **`window.confirm` with Hebrew strings** to avoid new UI primitives unless needed.

---

## Stage details & recommended commits

### Stage 1 — Admin registration API helpers
**Do:** Extend `api/registrations.ts`:

- `listRegistrations({ seasonId?, status? })`
- `getRegistration(id)`
- `approveRegistration(id)`
- `cancelRegistration(id)`

Query string: omit null/undefined params. Reuse existing `RegistrationResponse` type.

**Verify:** `npm run build`  
**Commit:** `feat(frontend): add admin registration API helpers`

---

### Stage 2 — Routes + nav shell
**Do:**

- Routes: `registrations`, `registrations/:id` (placeholder pages OK)
- `AdminLayout` nav: הרשמות
- `AdminHomePage` card pointing at `/admin/registrations`
- Hebrew keys for nav + home blurb

**Commit:** `feat(frontend): add admin registrations nav and routes`

---

### Stage 3 — List page with season + status filters
**Do:** `RegistrationsPage`

- Load seasons on mount; default `seasonId` = active season id when present
- Default `status` = `PENDING`
- “All statuses” / “All seasons” options supported
- Table columns (compact): id, date, student name, parent name, phone, activity type, season name, status, kibbutz (yes/no)
- Row click or “פרטים” → `/admin/registrations/:id`
- Loading / empty / error states via `t()` + `formatApiError`
- Reload when filters change

**Verify:** With backend + JWT, see PENDING rows created via public forms.  
**Commit:** `feat(frontend): add registrations list with filters`

---

### Stage 4 — Detail page + approve / cancel
**Do:** `RegistrationDetailPage`

- Load by id; 404/error message if missing
- Read-only sections: status + dates; student; parent/kibbutz; activity/season; swimming fields if `SWIMMING`; medical/special
- Buttons:
  - Approve — visible/enabled only if `PENDING`; confirm then `PATCH …/approve`
  - Cancel — visible/enabled if `PENDING` or `APPROVED`; confirm then `PATCH …/cancel`
- Disable buttons while request in flight
- On success: refresh detail (or set local response); show success message
- Link back to list (preserve filters later is optional — not required for MVP)

**Verify:** Approve a PENDING registration; cancel another; confirm cancelled cannot be approved.  
**Commit:** `feat(frontend): add registration detail approve/cancel`

---

### Stage 5 — Polish + README
**Do:**

- Ensure enum labels used everywhere (status, activity, age group, gender, swimming)
- Empty filter copy (“אין הרשמות”)
- README: document `/admin/registrations` and detail under Admin section
- Mark this plan’s acceptance checklist complete when done

**Commit:** `feat(frontend): polish admin registration review UX`

---

## Branching

**Branch name:** `feature/admin-registrations`

| Current | Action |
|---------|--------|
| `feature/public-registration` (F3) | Prefer merge/finish F3 first, then branch `feature/admin-registrations` |
| Stacking | OK to branch from F3 if F3 is not merged yet |

Do not mix F4 commits into F3 commit titles.

---

## Execution rules

1. One step at a time; explain + suggest commit; wait for **approve**.  
2. No backend changes unless an API gap is discovered (unexpected).  
3. Continue all new UI strings via `t()` in Hebrew.  
4. Do not commit unless asked.  
5. Do not start F5 (clothing / payments / groups) in this phase.

---

## Acceptance checklist (end of F4)

- [ ] Admin can open `/admin/registrations` when logged in  
- [ ] List filters by season and status; defaults favor active season + `PENDING`  
- [ ] Row opens detail at `/admin/registrations/:id`  
- [ ] Detail shows full registration data (incl. swimming when relevant)  
- [ ] Approve works for `PENDING` only  
- [ ] Cancel works for `PENDING` / `APPROVED`  
- [ ] Confirm before approve and cancel  
- [ ] Errors use `ApiError` / `formatApiError`  
- [ ] Unauthenticated users redirected to login  
- [ ] Hebrew UI + README admin registration URLs
)
