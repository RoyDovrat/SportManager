# Frontend UX standards (project-wide)

Apply these by default for any future UI work in SportManager.

## Responsive

- Layouts must work on phone, tablet, laptop, and large desktop.
- Prefer fluid units (`clamp`, `%`, `minmax`, `dvh`) over fixed widths.
- Tables wrap in `.admin-table-wrap` (horizontal scroll only when needed).
- Admin sidebar collapses to a drawer under ~960px; public nav wraps cleanly.

## Validation

- Use helpers in `frontend/src/validation/fields.ts`.
- Required text: reject whitespace-only (`hasText` / `cleanText`).
- Israeli ID: `isValidIsraeliId` + `normalizeIsraeliId` before submit.
- Israeli mobile: `isValidIsraeliMobile` + `normalizeIsraeliPhone` before submit.
- Trim / normalize in request builders, not only in UI labels.
- Prefer Hebrew user messages (`wizard.errors.*`) for public flows.

## Accessibility

- Keep readable contrast (avoid very light muted text).
- Always provide visible `:focus-visible` rings.
- Errors: `role="alert"` / `aria-live` where users must notice them.
- Respect `prefers-reduced-motion`.
- Do not rely on color alone for status (badges include text).

## Public home

- Brand-first hierarchy, split sport panels, clothing as secondary.
- Desktop: aim for one viewport without page scroll; smaller screens may stack and scroll.
