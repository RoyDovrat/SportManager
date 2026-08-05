# Swimming payments, sport seasons, kibbutz export — Design

**Date:** 2026-08-05  
**Status:** Approved for implementation (Approach 1 + Section 1 confirmed by user; remaining sections use recommended defaults)

## Problem

1. Swimming monthly fees use `unit price × weeklySessions × Mondays in month`, which does not match real training days when a month has fewer occurrences of the group’s weekday(s).
2. Seasons are sport-agnostic and only one can be active, so football and swimming cannot run separate calendars.
3. Seasons are never auto-closed; admins need a clear prompt near end date, but deactivation stays manual.
4. Kibbutz Excel mixes football and swimming; kibbutz needs two files.
5. In-app admin help (`he.ts` / AdminHelpPage) documents the old rules and must be updated.

## Goals

- Bill swimming only after group assignment with a defined schedule (days/hours).
- Amount = lesson-type unit price × actual scheduled session occurrences in the charge month (within the swimming season date range).
- Sport-scoped seasons; multiple active seasons allowed with at most one active per sport.
- Admin banner/prompt when an active season’s end date is approaching; no auto-deactivate.
- Separate kibbutz Excel downloads for FOOTBALL and SWIMMING.
- Update the admin help guide accordingly.

## Non-goals

- Auto-closing seasons.
- Holiday / cancelled-session calendars (count weekday occurrences only).
- Retroactive cleanup of historical swimming payments created without a group (leave as-is).
- Splitting clothing into swimming seasons (clothing stays tied to football seasons).

## Approach

**Sport-scoped seasons (Approach 1):** `Season.activityType` is `FOOTBALL` or `SWIMMING`. Activating a season deactivates only other seasons of the **same** sport. Public catalogs and registration resolve the active season for that sport.

---

## 1. Swimming groups: schedule + assignment

### Behavior

- Swimming groups persist `GroupTrainingSession` rows (day + start/end time), same as football.
- Admin must define training days/hours when creating/editing an **active** swimming group.
- `weeklySessions` on a swimming group must equal the count of **active** training sessions (1–6). Validation rejects mismatch.
- Assigning a student to a swimming group is unchanged in matching rules (lesson type, age, water level, weekly sessions), but the student’s training days/times are those of the group schedule.
- PRIVATE, PAIR, and GROUP all require assignment to a scheduled group before billing.

### Implementation notes

- Remove the football-only gate in `ActivityGroupService.replaceTrainingSessions` so swimming sessions are persisted.
- Add swimming-specific validation for sessions (day + start time required; active count matches `weeklySessions`).
- Frontend swimming group create/edit UI gains the same schedule editor pattern used for football (adapted for 1–6 slots).

---

## 2. Swimming payment calculation

### When payments are created

- Do **not** create a monthly swimming payment until the registration is assigned to a swimming group that has at least one active training session.
- Football payment generation is unchanged (still on approval / monthly sync as today).
- After swimming group assignment (or when an assigned group’s schedule changes), create/recalculate **PENDING** monthly payment(s) for covered months that still need a charge; never overwrite **PAID** amounts.

### Amount formula

```
amount = lessonTypeUnitPrice × countSessionOccurrences(group.activeSessions, chargeMonth ∩ seasonDates)
```

- `lessonTypeUnitPrice` = `ActivityPricing.monthlyPrice` for that swimming lesson type (existing “weekly unit” price with `weeklySessions=1` on the pricing row).
- Occurrence count: for each active `GroupTrainingSession`, count calendar days in the charge month whose `DayOfWeek` matches, and whose date is within `[season.startDate, season.endDate]`.
- Do **not** multiply by `registration.weeklySessions` separately — the schedule already encodes session frequency.
- Replace `countWeeksInMonth` (Monday proxy) for swimming.

### Generation scope

- Continue generating for the **current calendar month** (approval, assignment, scheduler, sync), only when the registration’s season covers that month.
- Scheduler / sync: skip swimming registrations without an assigned scheduled group.

---

## 3. Sport-scoped seasons + multiple active

### Data model

- Add required `activityType` (`FOOTBALL` | `SWIMMING`) to `Season`.
- Unique season `name` remains global.
- Clothing pricing remains `OneToOne` with a season; only **FOOTBALL** seasons may have clothing pricing (enforce in service). Swimming seasons never own clothing.

### Activation rules

- Creating/updating/activating with `isActive=true` deactivates other active seasons of the **same** `activityType` only.
- Multiple seasons may be active at once (e.g. one football + one swimming).
- `GET /api/seasons/active` becomes sport-aware: require `activityType` query param, **or** provide `GET /api/seasons/active/{activityType}` and keep a list endpoint `GET /api/seasons/active` returning all active seasons.
  - Prefer: `GET /api/seasons/active?activityType=FOOTBALL|SWIMMING` for single; `GET /api/seasons/active` returns list of all active seasons for admin dashboard banners.

### Public / registration resolution

- Football catalog, football registration, clothing catalog → active **FOOTBALL** season.
- Swimming catalog, swimming registration, swimming settings → active **SWIMMING** season.
- Reject registration if requested season id is inactive or wrong sport for the activity.

### Migration / existing data

- Existing seasons without a type: on schema update, treat missing type as requiring assignment. Prefer a one-time default: if exactly one season exists, set `FOOTBALL` and document that admins should create a swimming season; if multiple, set `FOOTBALL` for all existing and let admins correct (or use Flyway/SQL note in README). With Hibernate `ddl-auto=update`, add nullable column first then backfill in `AdminUserDataLoader`-style startup or document manual SQL. **Decision:** add non-null `activity_type` with application startup backfill: any season with null type → `FOOTBALL`.

### Payment months vs season

- Football monthly payments only for months covered by the registration’s **football** season.
- Swimming monthly payments only for months covered by the registration’s **swimming** season.
- Already true via `registration.season` date coverage; sport split makes seasons different date ranges by design.

---

## 4. Season end admin prompt

### Behavior

- Never auto-deactivate.
- When today is within **14 days** of an active season’s `endDate` (inclusive of end date and after end date while still active), show a persistent admin dashboard alert listing those seasons.
- Alert copy (Hebrew): season name, sport, end date, and a clear CTA to go to Seasons and turn it off.
- Deactivation remains the existing deactivate action on Seasons page.

### API

- Dashboard (or seasons) response includes `seasonsNearingEnd: [{ id, name, activityType, endDate }]` for active seasons where `endDate <= today + 14 days` (including overdue still-active seasons).

---

## 5. Kibbutz Excel — per sport

### Behavior

- Export API accepts required `activityType` (`FOOTBALL` | `SWIMMING`).
- Filter payments by registration activity type in addition to existing PENDING + KIBBUTZ_BUDGET + charge month + kibbutz parent.
- Filename includes sport, e.g. `חיוב-קיבוץ-כדורגל-YYYY-MM.xlsx` / `חיוב-קיבוץ-שחייה-YYYY-MM.xlsx`.
- Admin UI: two download actions (or sport selector + download) for the chosen month.

---

## 6. Manual / help updates

Update `frontend/src/i18n/he.ts` help strings (and any dependent AdminHelpPage structure if needed):

- Multiple active seasons allowed — one per sport (football / swimming).
- Swimming groups require days/hours; assign before billing.
- Swimming monthly amount = unit price × actual sessions in that month from the group schedule.
- Season-end: system prompts admin near end; admin turns season off manually.
- Kibbutz: separate Excel for football and swimming.

Briefly align `README.md` if it contradicts the above.

---

## Error handling

- Active swimming group without schedule → business rule error on save.
- Generate/sync swimming payment without assigned scheduled group → skip (no error flood); assignment endpoints may optionally generate immediately and return success with payment created.
- Activating second season of same sport → previous same-sport season deactivated; other sport untouched.
- Kibbutz export without `activityType` → 400.

## Testing

- Unit: session occurrence counting across month boundaries and season clipping.
- Unit: swimming amount = price × occurrences; no payment without group/schedule.
- Unit/service: activate football does not deactivate swimming.
- Unit/service: kibbutz export filters by activity type.
- Frontend: help copy updated; seasons form includes sport; kibbutz page has two exports; swimming group schedule UI.

## Out of scope follow-ups

- Purging orphan swimming PENDING payments created under the old Monday formula.
- Email/WhatsApp season-end notifications.
