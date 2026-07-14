# GRIDERA Deployment Map

> **Frozen 2026-07-14** (Wave V0). Domains `q-grid.*` are production identifiers — never migrate to `gridera.net`.
> Team: `team_ljtVg59YsYUDbIdetyyOVg05` (taurus-s-projects).

## Canonical production stack

| Label | Vercel project | Project ID | Git | Root | Production aliases | Last deploy (snapshot) |
|-------|----------------|------------|-----|------|--------------------|------------------------|
| **Landing** | `landing` | `prj_Aa1xuuC3MAC9ZB4vtyCdjikmHX7q` | `Taurus-Ai-Corp/GRIDERA` @ `main` | `apps/landing` | **q-grid.net**, landing-phi-ashen.vercel.app | READY `e1941cdaaafc` PR #22 CBOM |
| **Comply** | `comply` | `prj_9E7o3VMvRcqtWYMDrpk4NIxDFskx` | `Taurus-Ai-Corp/GRIDERA` @ `main` | `apps/comply` | **eu.q-grid.net**, comply.gridera.net (DNS empty), comply-rho.vercel.app | READY `e1941cdaaafc` same SHA |
| **Guard executor** | `guard` | `prj_W1R1J466ZjCidSoOWgt3mtqYwNKH` | detached / manual | `packages/guard/api` | **guard-beryl.vercel.app** (works), guard.gridera.net (DNS empty) | READY `970aa7d17a00` |

### Guard deploy runbook

- Deploy only from a **clean** `git worktree` of `main` (dirty tree can exceed Vercel upload limits).
- `rootDirectory` = `packages/guard/api`; `framework` must be `null` (Fastify serverless, not Express).
- Preferred public base: `https://eu.q-grid.net/guard/v1/*` (comply `beforeFiles` rewrite → guard-beryl).
- Fallback base: `https://guard-beryl.vercel.app`.
- **Never** hardcode `guard.gridera.net` (NXDOMAIN).
- LLM keys on guard project required for full execute responses.

## Secondary / Pay

| Label | Vercel project | Git | Aliases | Notes |
|-------|----------------|-----|---------|-------|
| Pay / Q-Grid.IN | `q-grid-in` | `Taurus-Ai-Corp/Q-GRID.IN` | **rupee.q-grid.in** | Separate product surface; domain frozen |

## Legacy / zombie (do not treat as current product)

| Vercel project | Git | Aliases | Status | Action |
|----------------|-----|---------|--------|--------|
| **gridera** | `gridera-comply` | gridera-*.vercel.app | Last deploy **ERROR**; UI still titled "Q-Grid \| Comply" | Archive / unpublish / password-protect (Wave V2) |
| `comply-scan` | none | comply-scan-*.vercel.app | READY, no git | Zombie |
| `web` | none | web-*.vercel.app | ERROR | Zombie |

## DNS truth (2026-07-14)

| Hostname | Resolution | Notes |
|----------|------------|-------|
| `q-grid.net` | A 216.198.79.1 | Canonical landing |
| `eu.q-grid.net` | CNAME vercel-dns | Canonical comply |
| `guard-beryl.vercel.app` | A (Vercel) | Guard executor works |
| `guard.gridera.net` | **empty** | Dead alias — remove from product copy |
| `comply.gridera.net` | **empty** | Dead alias |
| `gridera.net` apex | Squarespace (198.49.23.x) | Not Vercel — not a GRIDERA deploy target |
| `rupee.q-grid.in` | (check live) | Pay domain frozen |

## Local ↔ GitHub map

| Local path | `origin` | Role |
|------------|----------|------|
| `/Users/taurus_ai/Documents/HEDERA/q-grid-platform` | `git@github.com:Taurus-Ai-Corp/GRIDERA.git` | **Canonical monorepo** (planned rename → `gridera-platform`) |
| `/Users/taurus_ai/Documents/HEDERA/hiero-cli-pqc` | `git@github.com:Taurus-Ai-Corp/gridera-scan.git` | Scan CLI |
| (if present) `HEDERA/Comply.Q-Grid.EU` | `gridera-comply` | Legacy Gen-2 — Vercel `gridera` project only |

## Frozen domain invariant

Never change product traffic to `gridera.net`. Footer may explain:

`q-grid.net — the Quantum-Grid.Network · GRIDERA by Taurus AI`

## Rendered Brand Gate (post-deploy)

Fail the gate if production HTML still contains deprecated brand strings
(legacy product names without pipe form, dead `*.gridera.net` executor hosts,
or old CTA wording). Run:

```bash
# brand-allow: gate pattern documents forbidden strings intentionally
FORBIDDEN='Q-[Gg]rid|GO TO Q-GRID|guard\.gridera\.net|GRIDERA (Comply|Scan|Migrate)([^|]|$)'
for path in "" scan comply migrate guard pricing; do
  curl -sSL "https://q-grid.net/$path" | rg -n "$FORBIDDEN" && exit 1
done
curl -sSL https://eu.q-grid.net | rg -n 'Q-[Gg]rid' && exit 1
```

Expect zero matches.
