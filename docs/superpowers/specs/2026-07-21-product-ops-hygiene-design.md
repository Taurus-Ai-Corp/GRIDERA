# Design: Product ops hygiene (taxonomy + funnel smoke + CA ops + agents)

**Date:** 2026-07-21  
**Status:** implemented in `feat/product-ops-hygiene`

## Goal

Replace outdated CORE/LABS/VISION product tables with a canonical taxonomy, add TDD-backed funnel smoke, document CA cell go-live, and ship runnable research/QA agents.

## Approaches considered

1. **Docs-only** — fast, no CI enforcement  
2. **Docs + pure unit helpers + optional prod smoke** (chosen) — testable without flaking PRs  
3. **Full Playwright in every PR** — high flake cost on monorepo PRs  

## Architecture

| Artifact | Role |
|----------|------|
| `docs/GRIDERA-PRODUCT-TAXONOMY.md` | External/deck source of truth |
| `scripts/funnel-smoke/lib.ts` | Pure parsers (unit-tested) |
| `scripts/funnel-smoke.ts` | Live funnel network smoke |
| `scripts/ca-cell-probe.ts` | CA DNS/auth interim probe |
| `scripts/agents/*` | A/B runners + C prompt |
| `.github/workflows/funnel-smoke.yml` | Unit on PR; prod smoke on schedule |

## Verification

- `pnpm test:funnel-unit` — 9 tests  
- `pnpm smoke:funnel` — against production  
- `pnpm probe:ca` — CA interim  

## Out of scope

- Name.com DNS mutation (no credentials)  
- Supabase password reset  
- Gradio/ZeroGPU demos (unrelated to product map)  
