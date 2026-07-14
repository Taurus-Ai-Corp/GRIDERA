# Multi-Geo Deployment Spec

**Goal:** Deploy comply app to NA (na.q-grid.net) and IN (in.q-grid.net) with true data residency — separate databases per region, same codebase.

**Approach:** Infrastructure-only. Zero code changes. The `@taurus/jurisdiction` package already handles detection, config, pricing, and regulatory frameworks. The comply app reads `JURISDICTION` env var. We just need databases, Vercel projects, auth secrets (`JWT_SECRET`), and DNS.

> **2026-07-14 auth update:** Clerk is permanently removed. Per-region isolation uses separate Neon DBs + `JWT_SECRET` (and later Better Auth) — **not** separate Clerk projects. See `docs/ops/ADR-2026-07-14-auth-better-auth-vs-harden-jwt.md`.

---

## What Already Exists

- `packages/jurisdiction/src/detect.ts` — `detectJurisdiction(hostname, envOverride)` recognizes `na.q-grid.net`, `in.q-grid.net`
- `packages/jurisdiction/src/configs/` — NA (OSFI, PIPEDA, CCCS PQC), IN (RBI, DPDP, SEBI) fully defined
- `packages/db/src/schema/` — All 11 tables have `jurisdiction` column (defense in depth)
- `apps/comply/src/lib/jurisdiction.ts` — Server-side detection via Host header
- `apps/comply/vercel.json` — EU config exists (`regions: ["fra1"]`, `NEXT_PUBLIC_JURISDICTION: "eu"`)
- `apps/landing/src/components/geo-selector.tsx` — Manual region selector (links to na/eu/in subdomains)

## What Needs to Be Created

### 1. Neon Databases (2 new projects)

| Region | Neon Project | AWS Region | Domain |
|--------|-------------|------------|--------|
| EU | `q-grid-comply-eu` | eu-central-1 (Frankfurt) | **Exists** |
| NA | `q-grid-comply-na` | us-east-2 (Ohio) | **Create** |
| IN | `q-grid-comply-in` | ap-south-1 (Mumbai) | **Create** |

Each database runs the same Drizzle schema. Migrations run independently per region.

### 2. Vercel Projects (2 new)

| Project | Root Directory | Region | Env Vars |
|---------|---------------|--------|----------|
| `comply` (EU) | `apps/comply` | `fra1` | **Exists** |
| `comply-na` | `apps/comply` | `iad1` | `JURISDICTION=na`, `NEXT_PUBLIC_JURISDICTION=na`, `DATABASE_URL=<na-neon>` |
| `comply-in` | `apps/comply` | `bom1` | `JURISDICTION=in`, `NEXT_PUBLIC_JURISDICTION=in`, `DATABASE_URL=<in-neon>` |

All three point to the same GitHub repo (Quantum-Grid-Mesh), same root directory (`apps/comply`). Only env vars differ.

### 3. Auth secrets (per region)

Each region gets its own first-party auth secret (no Clerk):
- EU / NA / IN: distinct `JWT_SECRET` values on each Vercel project
- Future: Better Auth on region Neon (see ADR-2026-07-14)

### 4. DNS Records

| Subdomain | Target |
|-----------|--------|
| `eu.q-grid.net` | Vercel `comply` project (exists) |
| `na.q-grid.net` | Vercel `comply-na` project |
| `in.q-grid.net` | Vercel `comply-in` project |

### 5. Landing Page Update

Update `geo-selector.tsx` to set `live: true` for NA and IN links.

## What We Are NOT Building

- No edge geo-routing (manual selector is fine for now)
- No cross-region data sync (each region is fully independent)
- No shared user accounts across regions (separate Neon + JWT_SECRET per region)
- No AE region yet (Phase 2, pending ADGM RegLab)

## Data Residency Guarantee

Three layers (belt, suspenders, and a staple gun):
1. **Physical:** Separate Neon database in region-local AWS zone
2. **Application:** `JURISDICTION` env var restricts what config/regulations load
3. **Schema:** `jurisdiction` column on every table for query-level filtering

## Verification

- `curl -s https://na.q-grid.net` returns 200 with NA regulatory content
- `curl -s https://in.q-grid.net` returns 200 with IN regulatory content
- NA database contains zero EU records (and vice versa)
- Assessment wizard shows OSFI/PIPEDA for NA, RBI/DPDP for IN
