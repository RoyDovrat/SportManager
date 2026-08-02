# Football Registration — Groups, Schedule & Pricing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins configure football groups, schedules, and session-count prices; the public form shows the full catalog on open; after the parent enters the child’s age group the UI highlights the matched group; the backend auto-binds that group and the price for `group.weeklySessions`.

**Architecture:** `GroupTrainingSession` under `ActivityGroup`. Football `ActivityPricing` keyed only by `(season, activity, weeklySessions)` — **not** by age group. Age group selects which group matches the child. Public `GET /api/public/football-catalog` loads all active groups + resolved prices at page open. Registration auto-matches group by age, then pricing by `season + FOOTBALL + group.weeklySessions`. Parent never chooses group/slots/session count. Swimming pricing unchanged.

**Tech Stack:** Spring Boot + JPA (`ddl-auto=update`), React + TypeScript wizard UI, JWT admin APIs, public `permitAll` GETs.

## Global Constraints

- Do **not** hardcode flyer schedules/prices in the frontend (flyer/logo are visual reference + branding only).
- Football logo: `c:\Users\along\Downloads\לוגו כדורגל.pdf` — football surfaces only.
- Preserve swimming registration/pricing/group rules unless a shared change is required and safe.
- Preserve JWT + existing public/protected routes; only **add** explicit public GETs for football catalog.
- Schema: Hibernate `ddl-auto=update` (no Flyway).
- Backend derives price from `ActivityPricing`; never trust client price/group IDs.
- Commits: small; stop after each task for approval when running interactively.

---

## Current flow (as-is)

```text
Admin: Groups (ageGroups[], weeklySessions 1|2, no day/time slots)
     → Pricing (season + ageGroup + monthlyPrice; weeklySessions forced null)
Public: ageGroup → submit; pricing by ageGroup only; activityGroup null until admin assign
```

---

## Revised football registration flow

```text
ADMIN
  1. Create active football groups (name, ageGroups[], weeklySessions 1|2)
  2. Age bands disjoint across active groups in the season
  3. Define trainingSessions (day, start, optional end, isActive)
  4. Define exactly two (or one) football prices for the season:
       FOOTBALL + weeklySessions=1 → e.g. 185
       FOOTBALL + weeklySessions=2 → e.g. 250
     (ageGroup is NOT part of football pricing)

PUBLIC — page open
  GET /api/public/football-catalog (active season)
  Show FULL read-only catalog of all active football groups:
    name, age groups, weeklySessions, days/times, monthly price
    (price = pricing row for season+FOOTBALL+that group’s weeklySessions)

PUBLIC — after parent selects child’s ageGroup
  Highlight / clearly identify the unique matching group in the catalog
  Repeat schedule + price beside registration fields (still read-only)
  Parent does NOT choose group, 1vs2, day, or slot

BACKEND POST /api/registrations (FOOTBALL)
  group := unique active group where ageGroup ∈ group.ageGroups
  pricing := ActivityPricing(season, FOOTBALL, weeklySessions=group.weeklySessions)
            // ageGroup NOT used in pricing lookup
  Bind activityGroup + activityPricing on registration
  Reject: 0 groups, >1 groups, incomplete slots, missing pricing row
```

**Example**

| Admin | Parent | System |
|-------|--------|--------|
| Group “כיתות א'-ב'”: GRADE_1+GRADE_2, weeklySessions=2, Sun 17:00 + Thu 16:15 | ageGroup=GRADE_1 | Match that group; price = football/2-sessions row (e.g. 250) |
| Season prices: 1→185, 2→250 | — | Catalog shows 250 on every 2-session group |

---

## Data model implications

### `GroupTrainingSession` (unchanged intent)

Table `group_training_sessions`: `activityGroup`, `dayOfWeek`, `startTime`, `endTime?`, `isActive`.  
Unique `(activity_group_id, day_of_week, start_time)`.

### `ActivityGroup`

- `weeklySessions` = admin count (1|2) — drives which price row applies.
- `ageGroups` = matching key for the child only.
- Active group: ≥1 active session; if weeklySessions=2 ⇒ ≥2 active sessions.
- No overlapping age across two active football groups in a season.

### `ActivityPricing` — football vs swimming

| | Football | Swimming |
|--|----------|----------|
| Required | `weeklySessions` ∈ {1,2}, `monthlyPrice` | lesson type + weeklySessions + price |
| `ageGroup` | **Must be null** | Must be null (unchanged) |
| `swimmingLessonType` | Must be null | Required |
| Uniqueness | `(season, activity, weeklySessions)` | `(season, activity, swimmingLessonType, weeklySessions)` (unchanged) |
| Lookup | `findBySeasonAndActivityAndWeeklySessions` where ageGroup is null | existing swimming finder |

**Repository methods (football):**

- `findBySeasonAndActivityAndWeeklySessionsAndAgeGroupIsNull(...)`
- `existsBySeasonAndActivityAndWeeklySessionsAndAgeGroupIsNull(...)`

Prevent duplicate football rows for the same `season + activity + weeklySessions`.

### `Registration`

- Auto-set `activityGroup` + `activityPricing` on create.
- No selected-slots join table; no client group/price/slot fields.
- Approve keeps group; admin may reassign; cancel clears group.

---

## Pricing lookup & service validation

**RegistrationService (football):**

1. Resolve unique active group by season + FOOTBALL + `request.ageGroup`.
2. Validate group slots vs `group.weeklySessions`.
3. `pricing = findBySeasonAndActivityAndWeeklySessions(season, football, group.getWeeklySessions())` with `ageGroup == null`.
4. Persist both FKs.

**ActivityPricingService (football create/update):**

- Require `weeklySessions` 1|2; force/require `ageGroup == null`; reject swimmingLessonType.
- Uniqueness on `(season, activity, weeklySessions)` only.
- Price > 0.

**Swimming:** leave create/update/lookup as today (ageGroup null, lesson type + weeklySessions).

---

## Public UI flow

| Moment | UI |
|--------|-----|
| Page open | Full catalog: all active groups with ages, weeklySessions, schedule, monthly price |
| Age group selected | Highlight matching group; show same schedule/price next to form fields |
| Submit | Existing registration payload; backend re-resolves |

No parent selectors for group / weekly sessions / days / slots.

**API:** Prefer single `GET /api/public/football-catalog` returning groups (with sessions) + a small `prices[]` map keyed by weeklySessions (1 and/or 2). Frontend joins price onto each group by `group.weeklySessions`. Optional highlight is client-side filter of the same payload (no separate offer endpoint required).

---

## Admin pricing UI

- Football create: season (context) + **weekly sessions (1 or 2)** + monthly price — **no age group field**.
- List/edit shows at most one row per weeklySessions value for football in that season.
- Setup checklist: missing price for 1 and/or 2 if any active group uses that count; groups without sessions; age overlaps.

---

## Validations summary

| Layer | Rule |
|-------|------|
| Admin group | ages, weeklySessions 1\|2, slots, no day+time dupes, no age overlap |
| Admin pricing | football: unique season+activity+weeklySessions; ageGroup null; price > 0 |
| Register | 0 / >1 group match → block; missing price for group.weeklySessions → block; never trust client price/group |

---

## Files that must change

### Backend

- `GroupTrainingSession` + group DTOs/service (Task 1 — started)
- `ActivityPricingRepository` — football find/exists by season+activity+weeklySessions (+ ageGroup null)
- `ActivityPricingService` + football pricing DTOs/validation
- `RegistrationService` — group by age; price by weeklySessions only
- `PublicFootballCatalogController` + `FootballCatalogResponse`
- `SecurityConfig` — permitAll catalog GET
- Tests: sessions; pricing uniqueness without ageGroup; registration match + price by weeklySessions

### Frontend

- Admin groups: session editor
- Admin pricing: football form **without** age group; weeklySessions 1|2 only
- Public: load catalog on football page open; highlight after ageGroup; read-only panels
- i18n, football logo/flyer styling

### Do not

- Key football price by ageGroup
- Parent selection of group/slots/1vs2
- Registration↔session join table

---

## Migration / compatibility

1. Existing football pricing rows use `age_group` set and `weekly_sessions` null → **must be replaced** with two (or one) season-level rows keyed by weeklySessions; old age-keyed rows should not be used for lookup.
2. PENDING football regs without group remain manually assignable until re-registered under new rules.
3. Swimming untouched.

---

## Recommended commits

1. `feat(backend): add GroupTrainingSession and football schedule validation`
2. `feat(backend): football pricing by season activity and weekly sessions`
3. `feat(backend): auto-match football group and session-count pricing`
4. `feat(frontend): admin football sessions and session-count pricing UI`
5. `feat(frontend): public football catalog and age-group highlight`
6. `feat(frontend): football logo and flyer-inspired catalog panel`
7. `docs: football catalog and auto-match registration`

---

## Implementation tasks

> **Status: Tasks 1–7 completed (2026-08-02).**


### Task 1: `GroupTrainingSession` + group validation ✅

- [x] Failing tests written.
- [x] Implement persistence/validation until PASS (4/4).
- [x] Stop before Task 2.

### Task 2: Football pricing by `weeklySessions` only

- ageGroup null; uniqueness season+activity+weeklySessions; swimming unchanged.
- Stop for approval.

### Task 3: Auto-match registration + public catalog API

- Group by age; price by group.weeklySessions; catalog GET permitAll.
- Tests: 0 / 1 / >1 group; missing session-count price.
- Stop for approval.

### Task 4: Admin UI — sessions + session-count prices

- No age on football pricing form.
- Stop for approval.

### Task 5: Public wizard — catalog on open + highlight after ageGroup

- Full catalog immediately; highlight match; no selectors.
- Stop for approval.

### Task 6: Football branding (logo + flyer-inspired catalog)

### Task 7: Docs / swimming smoke

---

## Spec coverage

| Requirement | Task |
|-------------|------|
| Training sessions entity | 1 |
| Price = season + FOOTBALL + weeklySessions (not age) | 2, 4 |
| Catalog on page open | 3, 5 |
| Highlight after ageGroup | 5 |
| Auto-match group by age; price by weeklySessions | 3 |
| Block 0 / >1 group match | 3 |
| Parent never chooses group/slots/1vs2 | 3, 5 |
| Swimming unchanged | 2, 3 |
| Logo / flyer UI | 6 |

---

## First step after this revision is approved

Finish **Task 1** only (session validation/persistence). Do not start pricing/UI until approved.
