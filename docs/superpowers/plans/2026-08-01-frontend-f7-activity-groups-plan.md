# Frontend Phase F7 — Admin activity groups (revised)

> **Status:** Complete — swimming matching (lesson type + age + water + weekly 1–6), capacities 1/2/5, assign from group detail; create-logout bug fixed.  
> **Goal:** Admin manages groups with sport-specific rules: football teams mix several age groups + weekly trainings; swimming groups match registered kids and assign by name.  
> **UI language:** Hebrew (RTL) via `t()`.  
> **Out of scope:** Kibbutz Excel (F8), dashboard (F9).  
> **Branch:** `feature/admin-activity-groups`  
> **Next:** F8 Kibbutz Excel export.

---

## Product rules (locked)

### Football
- A team may include **several** classes/kindergartens (`AgeGroup` multi-select).
- Manager sets **weekly trainings** (`weeklySessions`: typically 1 or 2; store as positive int, UI offers 1 / 2).
- Assign only **APPROVED** football registrations whose student `ageGroup` is **in** the team’s allowed set.

### Swimming
- Group is defined by **lesson type** + **age groups** + **water adaptation level**.
- Capacities (all participants must be registered swimming students): `PRIVATE`=1, `PAIR`=2, `GROUP`=5.
- Assign by choosing from eligible approved swimming regs matching lesson type + age + water level.

---

## Gap vs current code

| Area | Today | Needed |
|------|--------|--------|
| Football age | Single `age_group` column + exact match | **Multiple** age groups + “member must be in set” |
| Weekly trainings | Missing | `weekly_sessions` on group (football required) |
| Swimming assign UX | Registration id input | Name picker from filtered approved regs |
| Backend | No multi-age API | Schema + DTO + validation changes |

---

## Backend changes (do first)

### Stage 0a — Schema / entity
**Do:**
- Replace single `ageGroup` with a collection, e.g. element collection table `activity_group_age_groups (group_id, age_group)`.
- Add `weekly_sessions` (`Integer`, nullable; required for football).
- Migrate: if old `age_group` present, copy into collection; drop old column when safe (`ddl-auto` update or Flyway — follow project convention; currently Hibernate update is fine if that’s the project default).

### Stage 0b — DTOs + service rules
**Do:**
- Request/response: `ageGroups: AgeGroup[]` (or `Set`), `weeklySessions: Integer`.
- Create/update validation:
  - Football: `ageGroups` non-empty; `weeklySessions` in `{1,2}` (or `>= 1`); no swimming lesson fields.
  - Swimming: `swimmingLessonType` required; `weeklySessions` null; ageGroups optional/empty.
- Assign validation:
  - Football: student age group ∈ group.ageGroups.
  - Swimming: registration lesson type matches group lesson type (keep existing optional water/age checks only if still desired).

**Commit:** `feat(backend): multi age groups and weekly sessions on activity groups`

---

## Frontend stages (revised remaining work)

Already done on branch (will need updates): API helpers, nav, list/create, detail/edit, assign-by-id.

| Stage | What | Suggested commit |
|-------|------|------------------|
| **0** | Backend multi-age + weeklySessions | `feat(backend): multi age groups and weekly sessions on activity groups` |
| **6a** | Update `api/activityGroups.ts` + types for `ageGroups[]`, `weeklySessions` | `feat(frontend): update activity group API for multi age and sessions` |
| **6b** | Football create/edit: multi-select age groups + weekly trainings (1/2) | `feat(frontend): football group multi age and weekly sessions` |
| **6c** | Swimming assign: load approved candidates by season/lesson type; pick by student name | `feat(frontend): swimming group assign by student name` |
| **6d** | Polish + README + remove id-only assign as primary UX (keep id as advanced optional if useful) | `feat(frontend): polish activity groups UX` |

---

## Target UX

### Create / edit — Football
- Name, season, active
- **Age groups:** multi-select checkboxes (all `AgeGroup` values)
- **Weekly trainings:** select `1` or `2`

### Create / edit — Swimming
- Name, season, active
- **Lesson type:** required
- Optional: water level (only if we keep it)

### Detail — Assign
- **Football:** list of eligible approved football registrations (season + age group in team set); pick by student name (checkbox/add)
- **Swimming:** list of eligible approved swimming registrations (season + lesson type); pick by student name
- Unassign remains per member row

---

## Acceptance checklist (end of revised F7)

- [x] Backend stores multiple age groups + weeklySessions for football  
- [x] Football create/edit uses multi age + 1/2 trainings  
- [x] Assign football: only kids in allowed age groups  
- [x] Swimming group by lesson type  
- [x] Assign swimming: picker by child name from approved regs  
- [x] Unassign works  
- [x] Hebrew UI + README  
- [x] Old single-ageGroup API/UI removed or migrated  

---

## Execution rules

1. Stage 0 (backend) first; then frontend 6a–6d one at a time with **approve**.  
2. Hebrew via `t()`.  
3. Do not commit unless asked.  
4. Do not start F8 until F7 revised acceptance is done.
