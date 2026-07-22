# Agent compare: hierarchy plan vs shipped taxonomy (2026-07-22)

**Inputs**

- User hierarchy §1–§2 (product roles, monorepo, cells, connectors, components)  
- Shipped `docs/GRIDERA-PRODUCT-TAXONOMY.md` (pre-alignment PR #38)  
- Live monorepo verification on `main`

**Method:** checklist agent (static path + schema + config greps) — no hallucination of missing packages.

---

## Verdict

**Hierarchy is correct.** Monorepo layout, enum, `caConfig.documentTypes`, residency-strict resolve, and Guard rewrite path all match code.

Pre-alignment taxonomy was **directionally right** but **missed A-track specificity**. Those gaps are integrated in taxonomy v2026-07-22.

---

## What already matched (no change needed)

| Claim | Evidence |
|-------|----------|
| Pipe brand Scan/Comply/Guard/Migrate | Taxonomy CORE table |
| Scan = landing + pqc-engine | `apps/landing`, package present |
| Comply = apps/comply multi-deploy | eu + q-grid-comply-ca |
| Migrate in-app | Documented |
| Pay out of A | LABS / out of A |
| jurisdiction enum na/eu/in/ae/ca | `packages/db/src/schema/enums.ts` |
| CA strict resolve | `packages/db/src/resolve.ts` |
| caConfig regs + documentTypes | `packages/jurisdiction/src/configs/ca.ts` |
| Funnel smoke exists | `pnpm smoke:funnel` |

---

## What we missed before (now integrated)

| Gap | Hierarchy requirement | Fix in taxonomy / ops |
|-----|----------------------|------------------------|
| **A1 sales-engine** | Rides Comply+Scan only; lives in monorepo | §1 A1 line + monorepo tree `sales-engine/` |
| **Guard surface** | Comply rewrite `/guard/v1/*`, not guard.gridera.net | §1 + connectors table |
| **Domain freeze** | Never product traffic on gridera.net | §2 repos map |
| **Zombie legacy** | Do not build on old Vercel gridera | §2 |
| **Full monorepo tree** | pqc-ca, mcp, auth, sales-engine | §2 layout |
| **Cell definition** | domain + keys + entity + law + reg config | §3 cell formula |
| **S4 = CA path** | Production for A ≠ EU-only happy path | §3 S4 ship rule |
| **Executive view** | Comply-only, jurisdiction=ca | §6 components |
| **Matrix source** | caConfig.regulations only | §6 |
| **A1 documentTypes** | pqc_readiness_report, data_residency_certificate | §3 + §6 |
| **Not-A connectors** | BillionMail, Nextcloud, PACER, Azure archive | §4 explicit exclude |
| **Canada FI data flow** | Scan → CA org → assess → ML-DSA → HCS → exec view | **§8** new |

---

## Status deltas vs hierarchy table (ops truth)

| Hierarchy said | Ops truth after DevOps work |
|----------------|----------------------------|
| CA active on feat/ca-db-routing | **Routing code on main**; CA Vercel project live; interim **q-grid.net/ca** |
| Vercel CA blockers | **DNS** (Name.com) + **DATABASE_URL_CA password** still open |
| EU planned DATABASE_URL_EU | Still generic `DATABASE_URL` (intentional until provisioned) |

---

## Agent A/B re-run notes

- **A Funnel QA:** still green if Calendly + /ca + EU 401 + scanId hold  
- **B Cell health:** still WARN until DNS + CA auth 401  
- **C Market intel:** unchanged (prompt-only)

---

## Hierarchy OK?

**Yes — reply OK.** No structural change requested to product roles.

Optional micro-edits (non-blocking):

1. Note interim URL `q-grid.net/ca` until Name.com CNAME lands  
2. EU row: “prod alias live; strict EU DB later” (already in §3)

**Next:** §3 Canada FI path is documented in taxonomy §8; implementation work remains CA DNS + DB password + A1 report schema binding to `documentTypes`.
