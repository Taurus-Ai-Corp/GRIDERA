# GRIDERA Product Taxonomy (Canonical)

**Status:** source of truth for decks, agents, S4 / A-track, and GTM  
**Last updated:** 2026-07-22  
**Brand form (mandatory):** `GRIDERA|<Verb>` — never space-form or legacy product prefixes (brand-allow)

> Aligns with platform hierarchy §1–§2 (product roles, monorepo, cells, connectors).  
> Outdated CORE/LABS/VISION screenshots are retired.

---

## 1. Product hierarchy (brand + surface) — A-track (S4)

| Product | Role in A (S4) | Code / deploy |
|---------|----------------|---------------|
| **GRIDERA\|Scan** | Free/public scan → QRS entry | `apps/landing` + `@taurus/pqc-engine`; prod **q-grid.net** |
| **GRIDERA\|Comply** | Primary A2 shell — assessments, matrix, reports, systems, CA pack | `apps/comply`; prod today **eu.q-grid.net**; CA cell target **ca.q-grid.net** (interim: **q-grid.net/ca** → `q-grid-comply-ca`) |
| **GRIDERA\|Guard** | Executor / observe / LLM compliance assist | `packages/guard` (+ `packages/guard/api`); **rewrite via Comply host** `/guard/v1/*` — not dead `guard.gridera.net` |
| **GRIDERA\|Migrate** | Org-change path (wizard / policies) — **in-app**, not separate deploy | Comply dashboard + policy/migration components |
| **GRIDERA\|Pay / others** | **Out of A** | Separate repos/domains (`rupee.q-grid.in` etc.) |

**A1 delivery kit** rides **GRIDERA\|Comply + Scan contracts only** (same monorepo `sales-engine/`).

### Funnel contract

```
Acquire (q-grid.net + Calendly)
  → Scan (free QRS on landing)
  → Comply (convert / assess / matrix)  [CA cell for C1 ICP]
  → Guard | Migrate (expand, in-product)
  → Prove (ML-DSA stamp + HCS)
```

Deep link: landing scan → `/comply?scan={scanId}` (`scripts/smoke-comply-flow.ts`, `pnpm smoke:funnel`).

---

## 2. Repos & local map (connectors to git)

| Local | GitHub | Role |
|-------|--------|------|
| `HEDERA/gridera-platform` | **Taurus-Ai-Corp/GRIDERA** | Canonical monorepo for Scan/Comply/Guard packages |
| `HEDERA/hiero-cli-pqc` | **Taurus-Ai-Corp/gridera-scan** | Scan CLI lineage (adjacent, not Comply app) |
| Legacy gridera-comply / Vercel “gridera” | zombie | **Do not build on** |
| Domains | **Frozen on q-grid.\*** | Never migrate product traffic to gridera.net |

### Monorepo layout (authoritative for A)

```
gridera-platform/   (= Taurus-Ai-Corp/GRIDERA)
├── apps/
│   ├── landing/          # q-grid.net — Scan funnel
│   └── comply/           # Comply dashboard + APIs
├── packages/
│   ├── pqc-engine/       # SSL scan, QRS, CBOM, KEX
│   ├── pqc-crypto/       # ML-DSA-65 / ML-KEM-768
│   ├── pqc-ca/           # CA / cert path
│   ├── hedera/           # HCS + HTS client
│   ├── jurisdiction/     # na | eu | in | ae | ca configs
│   ├── db/               # Drizzle schema + geo URL resolve
│   ├── guard/            # Guard product + api
│   ├── auth/             # shared auth
│   ├── mcp/              # Hedera + quantum-crypto MCP (ops/agent)
│   ├── ui/, use-cases/, ai-assistant/
├── sales-engine/         # A1 kit home
├── scripts/              # funnel-smoke, ca-cell-probe, agents, …
└── docs/                 # sovereign-cell, CA strategy, this taxonomy
```

---

## 3. Geo / jurisdiction / databases (sovereign cells)

**One codebase, N cells.**  
A cell = `{ domain, jurisdiction, data region, database, keys, entity, law, reg config }`.

| Cell | Domain | Jurisdiction id | Data region | DB env | Status |
|------|--------|-----------------|-------------|--------|--------|
| **Canada** | ca.q-grid.net | `ca` | ca-central-1 (Montreal) | **`DATABASE_URL_CA`** (residency-strict, **no fallback**) | App live on `q-grid-comply-ca`; DNS + DB password still blockers |
| **EU** | eu.q-grid.net | `eu` | EU DB when provisioned | `DATABASE_URL` today; `DATABASE_URL_EU` planned strict | Current Comply prod alias; not CA data |
| **NA (US-modeled)** | q-grid.net / na path | `na` | US region | `DATABASE_URL` / `DATABASE_URL_NA` | Landing + shared |
| **India** | (future) | `in` | in-region | scoped URL | Residency later |
| **UAE** | ae.q-grid.net | `ae` | me-region | scoped URL | Later |

**Schema truth:** `jurisdiction` enum = `['na','eu','in','ae','ca']` on orgs, systems, assessments, policies, users, scans (`packages/db/src/schema/enums.ts`).

**Routing truth:** `packages/db/src/resolve.ts` — for `ca`, refuse generic `DATABASE_URL` so Canadian PII never bleeds to US/EU DB.

**Canada config truth:** `packages/jurisdiction/src/configs/ca.ts`

- Regs: PIPEDA, Law 25, AIDA, TBS ADM, OSFI E-23 / B-13, CCCS PQC, NIST FIPS, SOC2  
- `dataResidencyRegion: ca-central-1`  
- `vercelRegion: iad1` (compute not sovereign; **DB + keys** are the residency story)  
- `documentTypes` include **`pqc_readiness_report`**, **`data_residency_certificate`**, plus `aia_report`, `pipeda_pia`, `law25_pia`, `osfi_mrm_report`, `soc2_report`

**S4 ship rule:** “Production” for A means **CA cell path works** — `JURISDICTION=ca` + `DATABASE_URL_CA` + Comply on CA schema + HCS + ML-DSA — **not only** eu.q-grid.net happy path.

**Sovereignty marketing:** do **not** claim full legal sovereignty until key custody + counsel (`docs/sovereign-cell-architecture.md`). Product still ships CA residency engineering.

---

## 4. Connectors (in-platform, not archive enterprise stack)

| Connector | Package / path | Used by A for |
|-----------|----------------|---------------|
| Hedera HCS | `@taurus/hedera` + Guard hedera | Immutable audit of assessment/report events |
| PQC crypto | `@taurus/pqc-crypto` | ML-DSA-65 sign; ML-KEM where KEX |
| Scan engine | `@taurus/pqc-engine` | Domain scan, QRS, recommendations, CBOM |
| Jurisdiction | `@taurus/jurisdiction` | Host/JURISDICTION → caConfig regs & residency |
| DB | `@taurus/db` | `createDb(resolveDatabaseUrl('ca'))` |
| Guard API | `packages/guard` | Observe/execute; Comply rewrite `/guard/v1/*` |
| MCP | `packages/mcp` | Agent connectors (Hedera, quantum-crypto) — ops/agent, **not** client UI |
| Stripe | Comply billing routes | SaaS; prod key = account blocker |
| Landing → Comply | scan API + `/comply?scan=` | Funnel contract (smoke scripts) |

**Explicitly not A connectors:** BillionMail, Nextcloud, Patent PACER, Azure-from-archive — those are B/C.

---

## 5. Architecture (platform-accurate)

```
        GRIDERA product line (pipe brand)
   Scan ──────────► Comply ──────────► Guard / Migrate (in-product)
   apps/landing     apps/comply        packages/guard + migrate UI
   q-grid.net       ca.q-grid.net ★    via Comply host rewrite
                    eu.q-grid.net (live)

   ★ DevOps focus: CA sovereign cell
        JURISDICTION=ca
        DATABASE_URL_CA → Supabase ca-central-1
        caConfig regulations + documentTypes
        ML-DSA sign → HCS audit (network from env)

   Shared packages (single codebase, N deploys)
        pqc-engine · pqc-crypto · hedera · jurisdiction · db · auth · ui

   A1 sales-engine/  ──operates──►  CA Comply APIs + report schema
```

---

## 6. Components revision (aligned)

- **Executive Operating View** lives only in **GRIDERA\|Comply** dashboard; data only from Comply APIs with **jurisdiction = ca**.
- **Compliance matrix** default pack = **`caConfig.regulations`** (OSFI B-13/E-23, CCCS PQC, PIPEDA, AIDA, …) — not a generic “Canada pack” invented outside jurisdiction package.
- **Document types** for A1 reports must match **`caConfig.documentTypes`** (esp. `pqc_readiness_report`, `data_residency_certificate`).
- **S4 ship checklist** includes CA DB routing + deploy (DNS + password) — product features without CA cell are incomplete for **C1 ICP**.
- Do not claim full data sovereignty marketing until sovereign-cell legal/key custody items are done.

---

## 7. Still out of A

GRIDERA\|Pay, non-CA cells as **first** ship target, archive revenue engine, enterprise Nextcloud/email — **B/C/E**.

---

## 8. Canada FI data flow (§3) — Scan → CA Comply → proof

```
1. Scan (q-grid.net)
     POST /api/scan { domain }
     → QRS + scanId (landing / @taurus/pqc-engine)
     → optional deep link /comply?scan={scanId}

2. CA Comply org (DATABASE_URL_CA)
     JURISDICTION=ca · caConfig
     org/system/assessment rows tagged jurisdiction='ca'
     matrix defaults from caConfig.regulations

3. Assess / QRS bind
     Assessment wizard + recommendations
     Report artifacts: documentTypes ∈ caConfig
       (pqc_readiness_report, data_residency_certificate, …)

4. Prove
     ML-DSA-65 sign (@taurus/pqc-crypto)
     HCS submit (@taurus/hedera, network from env)
     Executive Operating View reads Comply APIs only (ca)

5. Expand (optional)
     Guard /guard/v1/* via Comply rewrite
     Migrate wizard in dashboard
```

**Verification probes**

| Step | Command / check |
|------|-----------------|
| Funnel | `pnpm smoke:funnel` |
| CA interim | `pnpm probe:ca` |
| CA strict go-live | `CA_STRICT=1 pnpm probe:ca` |
| Scan→Comply contract | `pnpm smoke:comply-flow` |

---

## 9. Ops runbooks

| Doc | Purpose |
|-----|---------|
| `docs/ca-dns-cutover.md` | Name.com CNAME / Vercel NS (not Replit) |
| `docs/ops/CA-CELL-OPS-CHECKLIST.md` | Go-live blockers + probes |
| `docs/ops/HIERARCHY-GAP-REPORT.md` | Agent compare: plan vs hierarchy |
| `docs/ops/GRIDERA-DEPLOYMENT-MAP.md` | Deploy topology |
| `scripts/agents/` | Funnel QA, cell health, market intel |

---

## Forbidden in external decks

- Space-form product names (must use pipe)  
- Deprecated Q-Grid **product** prefixes (domains `q-grid.net` stay valid and **frozen**)  
- Shipping source = legacy monorepo dir / zombie Vercel projects  
- SENTINEL as AI-audit product  
- Product traffic on gridera.net  
