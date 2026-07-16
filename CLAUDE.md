# GRIDERA|Platform — Project Context

## Brand vs. Domain

- **Product brand:** GRIDERA (GRIDERA|Comply, GRIDERA|Guard, etc.)
- **Canonical domain:** `https://q-grid.net`
- **Regional product consoles:** `eu.q-grid.net`, `na.q-grid.net`, `in.q-grid.net`, `ae.q-grid.net`
- Do **not** change URLs, sitemaps, OG metadata, Stripe callbacks, or email domains to `gridera.net` unless explicitly instructed.

## Trust But Verify Handoffs

- `.handoffs/2026-07-03-gridera-position-audit.md` may contain stale guidance (e.g., domain migration to `gridera.net`). Cross-check brand/domain instructions with the user before applying.

## Monorepo Commands

```bash
# Brand-drift check
pnpm lint:brand

# Landing app (apps/landing)
pnpm type-check   # tsc --noEmit
pnpm build        # next build --webpack
```

> Note: `pnpm lint` inside `apps/landing` can fail with a Next.js CLI path quirk; prefer running from the monorepo root or use `next lint` directly.

## Landing App Structure

- **Location:** `apps/landing`
- **Stack:** Next.js 16 App Router, Tailwind v4, static generation
- **Product verticals:** `/guard`, `/scan`, `/migrate`, `/comply`, `/lend`, `/asset`
- **SEO gap:** several pages are client components without `metadata` exports; add thin server wrappers to export metadata while keeping state in client children.

## Comply Dashboard (scan → QREP flow) — COMPLETED 2026-07-14

All 3 tasks from `GRIDERA-comply-fix-plan.md` are DONE and merged. Do NOT re-implement.

- **Task 1 — CTA link** (`scan/results/page.tsx:240`): `href={`/comply?scan=${encodeURIComponent(scanId)}`}` — relative, same-origin. Merged in PR #10 (commit f0a9dae).
- **Task 2 — Suspense boundary** (`comply/page.tsx`): `ComplyInner` (uses `useSearchParams`) wrapped in `<Suspense>` with loading fallback (lines 789-800). Merged in PR #10.
- **Task 3 — E2E integration test** (`comply/comply-flow.test.ts`): 4 vitest tests, all passing. Covers QrepCompact contract, QUANTUM_SAFE grading, 404 for unknown/expired scan IDs. Smoke script: `scripts/smoke-comply-flow.ts`. Merged in PR #26 (commit 4ca80f6).

> The stale plan file at `~/Documents/Nexus-Platform/GRIDERA-comply-fix-plan.md` has been updated to reflect completion. <!-- brand-allow: file path reference --> The `q-grid-platform-p0` dir is a legacy copy — the active repo is `gridera-platform` (remote: Taurus-Ai-Corp/GRIDERA).
