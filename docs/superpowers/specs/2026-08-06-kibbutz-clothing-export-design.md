# Kibbutz clothing Excel export

## Goal

Admins download a separate Excel of pending kibbutz-budget **clothing** charges for a charge month. Clothing lines must not appear in the football/swimming kibbutz exports.

## Rules

- **Sport export** (existing `GET /api/exports/kibbutz`): PENDING + `KIBBUTZ_BUDGET` + charge month + `activityType`, **exclude** `paymentType = CLOTHING`.
- **Clothing export** (new): PENDING + `KIBBUTZ_BUDGET` + charge month + `paymentType = CLOTHING` only (no activityType param).
- Same columns: parent name, student name, budget number, amount + monthly total row.
- Filename: `חיוב-קיבוץ-ביגוד-YYYY-MM.xlsx`; sheet name: `חיוב קיבוץ ביגוד`.

## API / UI

- `GET /api/exports/kibbutz/clothing?year=&month=`
- Kibbutz export page: third download button for clothing; updated intro/hint and help copy.

## Out of scope

- Season filter, multi-sheet workbook, changing non-kibbutz clothing flows.
