# SportManager Backend MVP — Gap Analysis & Implementation Plan

> **Status:** Plan approved. Phases 0–10 completed. Next: Phase 11 (hardening & cleanup) after Postman verification.  
> **Sources of truth:** Project Design Document (detailed MVP/FRs) + Business Requirements EN (operational flow) + current backend.  
> **Out of scope (MVP):** Frontend, online payment gateway, auto WhatsApp/email, parent portal, multi-admin roles, automatic receipts.

**Goal:** Complete a production-ready backend MVP that supports registration, seasons/activities/pricing, clothing, payments (including manual confirmation), group assignment, Kibbutz Excel export, admin JWT auth, and dashboard/report APIs — in controlled phases.

**Architecture:** Keep existing Spring Boot layered structure (`controller → service → repository → entity`). Add `exception`, `config`, `security`, and `dto/response` packages. Prefer fixing/extending existing domains over rewrites.

**Tech Stack:** Java 21, Spring Boot 3.5.4, Spring Data JPA, PostgreSQL, Bean Validation, Spring Security + JWT, Apache POI (Excel), Lombok.

## Global Constraints

- Public registration endpoints remain unauthenticated.
- Administrative endpoints require JWT after Phase 8.
- Keep the project compiling after every phase.
- Do not add features outside Project Design MVP / Business Requirements flows.
- Preserve working season/activity/pricing patterns unless they violate requirements.
- Schema managed via Hibernate `ddl-auto=update` for now (no Flyway in MVP unless needed later).

---

# Part A — Complete Gap Analysis

## A.1 MVP requirements checklist

| # | MVP capability (Project Design / BRD flow) | Current status | Gap |
|---|---------------------------------------------|----------------|-----|
| 1 | Season management + history | Partial | Working CRUD/activate; registration history APIs thin |
| 2 | Activity management (football/swimming) | Mostly done | Active checks not enforced on dependent flows |
| 3 | Seasonal activity pricing | Partial | Create only; football weekly-sessions model inconsistency |
| 4 | Seasonal clothing pricing | Partial | Create only; unused `isActive` on request |
| 5 | Online football/swimming registration | Partial | Works but weak validation; always `APPROVED` |
| 6 | Mandatory health declaration | Partial | Field stored; not enforced `true` |
| 7 | Duplicate registration prevention | Partial | App-level only; no DB unique |
| 8 | Parent management | Partial | List/update OK; phone uniqueness missing on column; kibbutz budget not enforced on register |
| 9 | Student management | Partial | List/update OK; create via registration only (OK) |
| 10 | Registration admin workflow (review/approve/cancel) | Missing | Created as `APPROVED`; no list/status APIs |
| 11 | Clothing orders (football; once/year; skip if has kit) | Partial | Football + one order; no “already has clothing”; not mandatory workflow |
| 12 | Clothing payment tracking | Partial | Create PENDING only |
| 13 | Monthly charge generation | Partial | Create PENDING only; no bulk monthly generation |
| 14 | Manual payment confirmation (Bit/PayBox/Kibbutz) | Missing | No mark-paid; PayBox enum missing |
| 15 | Activity groups + assignment | Missing | No Group domain |
| 16 | Kibbutz Excel export | Missing | No POI / export API |
| 17 | Admin JWT authentication | Missing | `AdminUser` entity only |
| 18 | Dashboard statistics API | Missing | — |
| 19 | Reports APIs (registrations/payments/clothing/seasons) | Missing | — |
| 20 | Consistent validation + error handling | Missing | Mixed `@Valid`; `RuntimeException`; no `@ControllerAdvice` |
| 21 | Clean API responses | Partial | Raw entities / strings; serialization risk |

## A.2 Critical defects (must fix early)

1. **`Parent.isKibbutzMember` has `unique = true`** — blocks more than one kibbutz / non-kibbutz parent. Uniqueness belongs on `phoneNumber`.
2. Registration ignores **active season/activity**.
3. Registration does not require **health declaration approved**.
4. Registration does not require **budgetNumber** when kibbutz member.
5. **No payment confirmation** — charges stay `PENDING` forever.
6. **No groups / Kibbutz export / auth / dashboard**.

## A.3 What already works (preserve)

- Season single-active activation pattern.
- Activity unique-by-type + activate/deactivate.
- Activity pricing create with football vs swimming rules.
- Clothing pricing one-per-season create.
- Registration parent/student upsert + pricing resolution + duplicate check.
- Clothing order quantity/size/shirt validation for football.
- Payment method derivation from kibbutz membership.
- Parent/student admin update services with some business rules.

## A.4 Explicit non-goals for this plan

- React frontend
- Automatic WhatsApp/email
- Online card payments / payment gateway
- Parent login portal
- Multi-role RBAC beyond single admin
- Flyway migrations (optional later)
- AI features

---

# Part B — Recommended Implementation Phases

## Phase 0 — Foundations: errors, validation wiring, schema bugfixes

**Goal:** Make the API safe and consistent before adding features. Fix data-model bugs that would corrupt production data.

**Business requirements covered:**
- NFR maintainability / validation (Project Design)
- Parent/student data integrity (BRD: centralized accurate parent data)
- Enables all later phases to return proper 400/404/409 instead of 500

**Modify:**
- `entity/Parent.java` — remove unique from `isKibbutzMember`; add unique on `phoneNumber`
- All request DTOs missing annotations — add Bean Validation
- Controllers missing `@Valid` — Registration, ClothingOrder, ActivityPricing, ClothingPricing
- `pom.xml` — no new deps yet

**Add:**
- `exception/ErrorResponse.java`
- `exception/ResourceNotFoundException.java`
- `exception/BusinessRuleException.java` (or `ConflictException`)
- `exception/GlobalExceptionHandler.java` (`@RestControllerAdvice`)
- Optionally thin helpers in `util/` only if needed

**Remove / clean:**
- Replace ad-hoc `RuntimeException` throws in services with typed exceptions (incrementally in this phase for touched services; complete migration as other phases touch files)

**Database changes:**
- Drop unique constraint on `parents.is_kibbutz_member` (Hibernate may not auto-drop; may need manual SQL once)
- Add unique constraint on `parents.phone_number`
- Add unique constraint on `registrations(student_id, activity_id, season_id)` when Registration entity updated

**Risks / dependencies:**
- Existing DB may already have bad unique constraint — document one-time SQL for local Postgres
- Must not break existing Postman flows (same endpoints, better error bodies)

**Complexity:** Medium

**Postman focus (after implementation):** Trigger validation failures and confirm 400 JSON; create two kibbutz parents successfully.

---

## Phase 1 — Registration flow correctness

**Goal:** Align registration with BRD/Project Design operational flow and required fields.

**Business requirements covered:**
- FR-2 Parent Registration (football/swimming fields)
- Mandatory health declaration
- Duplicate registration prevention
- Active season/activity only
- Kibbutz budget when member
- Status workflow: create as `PENDING` (admin reviews later in Phase 2)
- BRD: swimming lesson type + level; football age group / sessions via pricing

**Modify:**
- `dto/request/RegistrationRequest.java` — full validation; activity-type conditional rules (service-level)
- `service/RegistrationService.java` — enforce health declaration, kibbutz budget, active season/activity, type-specific fields; set status `PENDING`; keep duplicate check
- `entity/Registration.java` — `@Table(uniqueConstraints=...)` for student+activity+season
- `controller/RegistrationController.java` — `@Valid`; proper HTTP statuses
- `repository/RegistrationRepository.java` — query helpers for list/filter (prep for Phase 2)

**Add:**
- `dto/response/RegistrationResponse.java` (avoid returning full entity graphs)
- Service methods for get/list by season/status (minimal read APIs)

**Database changes:**
- Unique index on `(student_id, activity_id, season_id)`

**Risks / dependencies:**
- Depends on Phase 0 exceptions
- Changing default status to `PENDING` affects ClothingOrderService (currently requires `APPROVED`) — clothing phase must accept approved-only still; document that clothing waits for approval
- Existing approved rows in DB remain fine

**Complexity:** Medium–High

**Postman focus:** Valid football/swimming register; reject missing health declaration; reject inactive season; reject duplicate; reject kibbutz without budget.

---

## Phase 2 — Registration admin APIs (review / approve / cancel)

**Goal:** Complete “Administrator Reviews Registration” before group assignment and clothing.

**Business requirements covered:**
- FR registration management (view/approve/edit/cancel)
- Flow 8.1: submit → admin review → later group assign
- BRD: registration tracking

**Modify:**
- `RegistrationService` / `RegistrationController` — list, get by id, approve, cancel, optional update of notes/status
- `ClothingOrderService` — keep requiring `APPROVED` (correct)

**Add:**
- `dto/request/RegistrationStatusUpdateRequest.java` (optional)
- Response DTOs for list items

**Database changes:** None (status enum already exists)

**Risks / dependencies:** Depends on Phase 1 (`PENDING` create). Clothing/payments should only proceed for approved registrations (enforce in later phases too).

**Complexity:** Low–Medium

**Postman focus:** List pending → approve → cancel rejected path; clothing order fails before approve, succeeds after.

---

## Phase 3 — Pricing completeness (activity + clothing)

**Goal:** Admin can fully manage seasonal prices (not create-only).

**Business requirements covered:**
- BRD: prices change every season
- FR-5 / seasonal pricing
- FR-8 charge amounts derived from pricing

**Modify:**
- `ActivityPricingService` + Controller — list by season, get by id, update price (and validate uniqueness rules)
- `ClothingPricingService` + Controller — list/get/update; remove unused request field or wire `isActive` intentionally (prefer remove unused)
- Clarify football pricing: either store `weeklySessions` as part of uniqueness OR document that football price is per age group only and stop requiring unused sessions inconsistency — **decision: football unique by season+activity+ageGroup; `weeklySessions` optional metadata or required for display but not part of lookup** (align service create + registration lookup)

**Add:**
- Response DTOs for pricing

**Database changes:** Possibly none; if uniqueness changes, adjust constraints carefully

**Risks / dependencies:** Registration and payment amount calculation depend on stable pricing lookup — do not break existing resolution methods.

**Complexity:** Medium

**Postman focus:** Create/list/update football and swimming prices; clothing prices per season; duplicate create returns 409.

---

## Phase 4 — Clothing orders (BRD rules)

**Goal:** Football clothing orders match “mandatory unless already has clothing; paid once per year.”

**Business requirements covered:**
- BRD clothing flow (football only; after registration; once/year)
- FR-7 Clothing Management
- Flow 8.5

**Modify:**
- `entity/ClothingOrder.java` — unique on `registration_id`; add `alreadyHasClothing` boolean OR separate skip endpoint
- `dto/request/ClothingOrderRequest.java` — support order items OR `alreadyHasClothing=true` (no items required)
- `ClothingOrderService` — enforce approved football registration; one order per registration per season; if `alreadyHasClothing`, store skip with zero items and no clothing payment required
- Controllers — list/get by season/student; `@Valid`

**Add:**
- List/get endpoints
- Response DTO

**Database changes:**
- Unique `clothing_orders.registration_id`
- Column `already_has_clothing` (boolean, default false)

**Risks / dependencies:** Depends on Phase 2 approval. Payment Phase 5 must skip clothing charge when `alreadyHasClothing`.

**Complexity:** Medium

**Postman focus:** Order with items; skip with already-has; reject swimming; reject before approval; reject second order.

---

## Phase 5 — Payments completion (confirm, cancel, list, PayBox, bulk monthly)

**Goal:** Full charge lifecycle matching Bit/PayBox/Kibbutz manual confirmation.

**Business requirements covered:**
- FR-8 Charge Management
- FR-9 Payment Management (manual confirm; Bit, PayBox, Kibbutz)
- BRD monthly billing + Bit reminders (manual confirm in system)
- Flow 8.4 / 8.6 (charge creation side)

**Modify:**
- `enums/PaymentMethod.java` — add `PAYBOX`
- `PaymentService` — confirm payment (set `PAID` + `paymentDate` + method override allowed for Bit/PayBox); cancel; list/filter; validate registration approved; clothing payment skipped if already has clothing
- `PaymentController` — REST: create monthly, create clothing, confirm, cancel, get, list
- Optional: `POST /api/payments/monthly/generate` for bulk generate for active season + month

**Add:**
- `dto/request/ConfirmPaymentRequest.java` (`paymentMethod` required for non-kibbutz)
- `dto/request/GenerateMonthlyPaymentsRequest.java` (`chargeMonth`, optional `seasonId`)
- Response DTOs

**Database changes:** None beyond enum string values

**Risks / dependencies:** Kibbutz export (Phase 7) needs `PENDING`/`PAID` kibbutz charges. Confirm must be idempotent-safe (reject confirm if already PAID).

**Complexity:** High

**Postman focus:** Create monthly → confirm Bit/PayBox → confirm Kibbutz; reject duplicate month; clothing payment; bulk generate; cancel pending.

---

## Phase 6 — Activity groups + student assignment

**Goal:** Admin can create groups and assign/move students (football by age; swimming by level/age/lesson type as attributes).

**Business requirements covered:**
- FR-6 Group Management
- BRD group assignment rules
- Flow 8.1 / 8.8 group assignment after review

**Add:**
- `entity/ActivityGroup.java` — id, name, activity, season, ageGroup (nullable), swimmingLessonType (nullable), waterAdaptationLevel (nullable), isActive
- `repository/ActivityGroupRepository.java`
- `service/ActivityGroupService.java`
- `controller/ActivityGroupController.java`
- DTOs request/response
- Assignment: either `Registration.activityGroup` ManyToOne **or** join entity — **prefer `Registration.group` ManyToOne** (one group per registration)

**Modify:**
- `entity/Registration.java` — nullable `ManyToOne` ActivityGroup
- Registration approve flow may remain manual assign (separate assign endpoint)

**Database changes:**
- New table `activity_groups`
- New nullable FK `registrations.activity_group_id`

**Risks / dependencies:** Should assign only `APPROVED` registrations. Soft validation: football group ageGroup should match student ageGroup (warn or enforce — **enforce**).

**Complexity:** High

**Postman focus:** Create football/swimming groups; assign; move; reject mismatched activity/season; list groups by season.

---

## Phase 7 — Kibbutz Excel export

**Goal:** Monthly Excel for Kibbutz accounting (parent, student, budget number, amount, total).

**Business requirements covered:**
- FR-10 Kibbutz Export
- BRD monthly Excel to kibbutz office
- Flow 8.6

**Modify:**
- `pom.xml` — add Apache POI
- Possibly `PaymentRepository` query methods for kibbutz pending/paid by month

**Add:**
- `service/KibbutzExportService.java`
- `controller/KibbutzExportController.java` — `GET /api/exports/kibbutz?year=&month=` returns file download
- `util/ExcelExportHelper.java` (optional)

**Database changes:** None

**Risks / dependencies:** Depends on Phase 5 payments existing. Define export set clearly: **Kibbutz members’ PENDING (or all non-cancelled) monthly+clothing charges for that month** — recommend export **PENDING Kibbutz charges** for the month (what still needs to be billed), include running total row.

**Complexity:** Medium

**Postman focus:** Download `.xlsx`; verify columns; empty month returns valid empty file or 404 with message (prefer empty sheet + total 0).

---

## Phase 8 — Admin authentication (JWT)

**Goal:** Secure all admin APIs; keep public registration (+ health) open.

**Business requirements covered:**
- FR-1 User Authentication
- MVP: administrator authentication
- NFR security

**Modify:**
- `pom.xml` — `spring-boot-starter-security`, JWT library (`jjwt` or similar)
- `entity/AdminUser.java` — ensure password stored hashed
- `application.properties` — JWT secret, expiration
- All admin controllers remain paths under `/api/**` except public ones

**Add:**
- `config/SecurityConfig.java`
- `security/JwtService.java`, `JwtAuthenticationFilter.java`
- `service/AuthService.java` / `AdminUserService.java`
- `controller/AuthController.java` — `POST /api/auth/login`
- `dto/request/LoginRequest.java`, `dto/response/AuthResponse.java`
- Data loader or documented SQL to create initial admin (BCrypt)

**Public endpoints (permitAll):**
- `GET /api/health`
- `POST /api/registrations`
- `POST /api/auth/login`

**Protected:** everything else

**Database changes:** None structural; seed admin user

**Risks / dependencies:** Will break existing Postman collections until Authorization header added — document in phase notes. Do this after core business APIs exist so testing earlier phases stays easy. **Ordered late intentionally.**

**Complexity:** High

**Postman focus:** Login → token → access protected; reject without token; public register still works.

---

## Phase 9 — Parent/Student admin API completeness

**Goal:** Finish FR-3/FR-4 admin capabilities used daily.

**Business requirements covered:**
- FR-3 Student Management (search/filter/history)
- FR-4 Parent Management
- BRD parent/student lookup

**Modify:**
- `ParentController` / `ParentService` — search by name/phone; filter kibbutz
- `StudentController` / `StudentService` — search by name/identity; filter; registration history endpoint
- Response DTOs to avoid lazy-load issues

**Add:**
- Query params on list endpoints
- `GET /api/students/{id}/registrations`

**Database changes:** None (indexes optional)

**Risks / dependencies:** Low; can partially overlap earlier phases but kept separate for reviewability.

**Complexity:** Low–Medium

**Postman focus:** Search/filter; student registration history across seasons.

---

## Phase 10 — Dashboard & reports APIs

**Goal:** Backend stats/reports for admin dashboard (frontend later).

**Business requirements covered:**
- FR-11 Dashboard
- FR-12 Reports
- FR-13 Season history reporting
- BRD: reporting / payment tracking visibility

**Add:**
- `controller/DashboardController.java` — totals: registrations, active students, open charges, monthly income, recent registrations, payment status summary
- `controller/ReportController.java` — registrations/payments/clothing by season
- `service/DashboardService.java`, `ReportService.java`
- Response DTOs / aggregation records

**Modify:**
- Repositories — add count/sum queries

**Database changes:** None

**Risks / dependencies:** Depends on Phases 1–5 data being meaningful. Auth from Phase 8 should protect these.

**Complexity:** Medium

**Postman focus:** Dashboard JSON for active season; report by seasonId.

---

## Phase 11 — API hardening & cleanup (MVP freeze)

**Goal:** Consistency pass before calling backend MVP “done.”

**Business requirements covered:**
- NFR maintainability, REST consistency
- Remove obsolete/dead code

**Modify / cleanup:**
- Ensure all controllers use response DTOs (no open entity cycles)
- Consistent status codes (`201` creates, `204` deletes if any, `404`/`409`)
- Remove unused empty packages or fill them
- Remove unused request fields
- Align naming of endpoints
- README backend section: how to run, default admin, public vs protected routes
- Move plaintext DB password note: recommend env vars (document; optional `.env` not committed)

**Add:**
- Minimal integration tests for critical flows (registration duplicate, payment confirm) — optional but recommended

**Database changes:** None

**Risks / dependencies:** Last phase; no new features.

**Complexity:** Medium

**Postman focus:** Smoke regression of entire collection.

---

# Part C — Phase order summary

| Phase | Name | Complexity | Depends on |
|------:|------|------------|------------|
| 0 | Foundations (errors, validation, Parent unique bug) | Medium | — |
| 1 | Registration correctness | Medium–High | 0 |
| 2 | Registration admin workflow | Low–Medium | 1 |
| 3 | Pricing completeness | Medium | 0 |
| 4 | Clothing BRD rules | Medium | 2 |
| 5 | Payments lifecycle + PayBox + bulk | High | 1, 4 |
| 6 | Activity groups + assignment | High | 2 |
| 7 | Kibbutz Excel export | Medium | 5 |
| 8 | Admin JWT security | High | 0–7 preferably |
| 9 | Parent/Student search & history | Low–Medium | 1 |
| 10 | Dashboard & reports | Medium | 5, 8 |
| 11 | Hardening & cleanup | Medium | all |

**Notes on parallelization:** Phases 3 and 9 can proceed earlier if needed; Phase 8 is intentionally late so Postman testing of business flows stays simple during Phases 0–7.

---

# Part D — Target domain model (end state)

```
Season 1──* ActivityPricing *──1 Activity
Season 1──1 ClothingPricing
Season 1──* Registration *──1 Student *──1 Parent
Registration *──1 ActivityPricing
Registration 0..1──1 ActivityGroup *──1 Activity (+ season)
Registration 1──0..1 ClothingOrder 0..1──1 Payment (CLOTHING)
Registration 1──* Payment (MONTHLY_ACTIVITY)
AdminUser (auth only)
```

---

# Part E — Assumptions (where docs were ambiguous)

1. **Registration status:** New registrations are `PENDING` until admin approves (Project Design review step). Clothing/payments require `APPROVED`.
2. **Clothing “already has”:** Represented as a clothing-order record with `alreadyHasClothing=true` and no line items / no clothing payment — satisfies tracking without forcing a purchase.
3. **Football pricing:** Unique per season + activity + ageGroup; `weeklySessions` stored for information/pricing differentiation only if needed — registration lookup by ageGroup (current behavior preserved and made consistent).
4. **PayBox:** Added as `PaymentMethod.PAYBOX`; chosen at confirm time for non-kibbutz (Bit vs PayBox).
5. **Kibbutz export:** Exports Kibbutz-member charges for a given month (pending charges destined for the accounting file), columns: parent name, student name, budget number, amount; plus total.
6. **Group assignment:** Manual admin assign via API; system validates football ageGroup match; swimming groups may filter by lesson type / water level / age but assignment remains manual.
7. **Manual one-time charges (FR-8):** Included in Phase 5 as a simple `POST /api/payments/manual` if time allows; otherwise deferred note in Phase 5 implementation.
8. **Dashboard “monthly income”:** Sum of `PAID` payments in current calendar month (or active season month filter) — define precisely in Phase 10.

---

# Part F — Requirements that remain out of backend MVP (cannot/should not implement here)

| Requirement | Why |
|-------------|-----|
| Google Forms / WhatsApp distribution | Replaced by public registration API + future frontend |
| Automatic Bit payment reminders | Out of scope (no WhatsApp/email automation in MVP) |
| Emailing Excel to Kibbutz | Export download only; email is out of scope |
| Frontend dashboard UI | Backend JSON only in Phase 10 |
| Online payment gateway | Explicitly out of scope |
| Multi-admin RBAC | Single admin JWT only |

---

# Part G — How we will execute after approval

1. You approve this plan (optionally request phase order tweaks).
2. We implement **Phase 0 only**.
3. I explain every change; you test in Postman with a checklist I provide.
4. You approve → Phase 1 → repeat until Phase 11.
5. Backend MVP complete when Phase 11 checklist passes.

---

**Awaiting your approval of this plan before any code changes.**
