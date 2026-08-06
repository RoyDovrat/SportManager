# Kibbutz Clothing Excel Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate pending kibbutz clothing charges into their own Excel download and remove them from sport kibbutz exports.

**Architecture:** Extend `PaymentRepository` + `KibbutzExportService` / controller; add a clothing download on the existing kibbutz export page.

**Tech Stack:** Spring Boot, JPA, Apache POI, React + TypeScript, Hebrew i18n.

## Global Constraints

- Clothing only in clothing Excel; never in football/swimming kibbutz Excel.
- Same PENDING + KIBBUTZ_BUDGET + charge-month rules as sport export.
- Same 4 Excel columns + total row.

---

### Task 1: Backend query + export + endpoint

- [ ] Add `AND p.paymentType <> CLOTHING` to `findKibbutzExportPayments`
- [ ] Add `findKibbutzClothingExportPayments` for CLOTHING only
- [ ] Add `exportMonthlyKibbutzClothingBilling` + `buildClothingFileName` in service (reuse sheet builder)
- [ ] Add `GET /api/exports/kibbutz/clothing`

### Task 2: Frontend download + copy

- [ ] `downloadKibbutzClothingExport` in `kibbutzExport.ts`
- [ ] Third button on `KibbutzExportPage`
- [ ] Update `he.ts` kibbutzExport + help strings
