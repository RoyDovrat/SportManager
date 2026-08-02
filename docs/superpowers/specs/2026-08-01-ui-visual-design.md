# UI visual design — SportManager MVP polish

**Date:** 2026-08-01  
**Branch:** `feature/ui-visual-design`  
**Scope:** One-pass visual/UX redesign of admin + public frontend. No new product modules, no backend changes, no chart libraries.

## Direction

- **Admin:** Modern SaaS — deep navy RTL sidebar, light content area, cards, polished tables/forms, colored status badges.
- **Public:** Warmer welcome — same design language, subtle sport green/blue accents, brand-led landing.
- **Keep:** All existing routes and functionality.

## Out of scope

Charts/analytics, Students/Parents/Settings modules, profile photos, notifications, multi-step registration wizard, backend work.

## System

| Token | Role |
|-------|------|
| Navy `#0b1f3a` / `#122#if` | Admin chrome, primary actions |
| Accent green `#1f8a4c` | Public warmth, success |
| Accent blue `#1a6f9a` | Secondary public accent |
| Pending `#c47a12` / Paid/Approved green / Cancelled red | Status badges |
| Font | Heebo (Hebrew UI) |

## Surfaces

1. Design tokens + shared components (buttons, badges, cards, tables) in CSS (+ small `StatusBadge`).
2. `AdminLayout`: fixed RTL sidebar, grouped nav, top bar with user + logout.
3. `PublicLayout` + `PublicHomePage`: welcoming header/hero + registration CTAs.
4. Login + forms/tables inherit tokens; dashboard stats as lightweight cards.

## Success

Looks like a production product; Hebrew RTL intact; `npm run build` passes; behavior unchanged.
