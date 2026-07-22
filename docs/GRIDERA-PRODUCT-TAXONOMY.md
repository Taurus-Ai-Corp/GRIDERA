# GRIDERA Product Taxonomy (Canonical)

**Status:** source of truth for decks, agents, and GTM  
**Last updated:** 2026-07-21  
**Brand rule:** product names use pipe form only — `GRIDERA|Verb`

> Replaces outdated CORE / LABS / VISION boards that used space-form names,  
> legacy monorepo paths, and wrong statuses.

---

## CORE — ship / sell now (A-track)

| Product | Role | Code / package | Deploy / URL |
|---------|------|----------------|--------------|
| **GRIDERA\|Scan** | Free/public PQC scan → QRS entry | `apps/landing` + `@taurus/pqc-engine` | **https://q-grid.net/scan** |
| **GRIDERA\|Comply** | Assessments, matrix, reports, systems, CA pack | `apps/comply` | **https://eu.q-grid.net** · CA cell: `q-grid-comply-ca` / interim **https://q-grid.net/ca** |
| **GRIDERA\|Guard** | LLM compliance executor / attestations | `packages/guard` (+ `packages/guard/api`) | Via Comply host rewrite + landing `/guard` funnel |
| **GRIDERA\|Migrate** | Org crypto migration (wizard / policies) | Comply dashboard components | **In-app only** — not a separate deploy |

### CORE engines (not separate GTM products)

| Engine | Role | Repo / package |
|--------|------|----------------|
| pqc-engine | QRS, scanner, CBOM | `@taurus/pqc-engine` (monorepo; lineage: `gridera-scan` / hiero-cli-pqc) |
| pqc-crypto | ML-DSA-65 / ML-KEM | `@taurus/pqc-crypto` |
| Swarm-Spawner | Ephemeral PQC-signed agents | npm `@taurus-ai/swarm-spawner` (`swarm-spawner` repo) |
| Hedera HCS/HTS | Audit trail / credentials | `@taurus/hedera` · testnet topic `0.0.9612022` |

### Funnel contract

```
Acquire (q-grid.net + Calendly)
  → Scan (free QRS)
  → Comply (convert / assess / matrix)
  → Guard | Migrate (expand)
  → Prove (ML-DSA stamp + HCS)
```

Deep link: landing scan → `/comply?scan={scanId}` (see `scripts/smoke-comply-flow.ts`).

---

## LABS — pre-revenue / separate surfaces

| Product | Role | Reality |
|---------|------|---------|
| **GRIDERA\|Pay** | Offline CBDC / India payments | Separate stack (`Rupee_Grid_pay_…`); not A-track |
| **GRIDERA\|Lend** | MSME lending | Landing marketing + separate paths; not SaaS CORE |
| **GRIDERA\|Arq** | Asset tokenization (HTS) | Separate / archived Gen-1 surfaces |
| **GRIDERA\|Shield** | Quantum-safe NFT protection | Lab / legacy |
| **GRIDERA\|Certify** | Exportable signed certificates | **Promote candidate** — build on Comply export + HCS |
| **GRIDERA\|Docs** | Document intelligence | Defer |
| **GRIDERA\|Devkit** | Public API / SDK | Defer — OpenAPI + SDK later |

Do **not** put LABS on the CORE revenue board until funnel metrics exist.

---

## VISION — architecture only (careful naming)

| Name | Correct meaning | Do not claim |
|------|-----------------|--------------|
| Intelligence | Knowledge layer (future) | Not live product |
| **SENTINEL** | **Bio-Foundry** (biology + quantum / coherence) | Not “AI audit / Giskard” |
| Verify | Content authenticity (future) | Not live |
| Ops | Internal automation (OpsFlow, orchestra) | Internal, not customer SKU |

---

## Jurisdiction cells (multi-product platform)

| Cell | Domain (target) | `JURISDICTION` | Database |
|------|-----------------|----------------|----------|
| EU | eu.q-grid.net | `eu` | `DATABASE_URL` (generic until `_EU`) |
| CA | ca.q-grid.net | `ca` | **`DATABASE_URL_CA` required** (strict, no US fallback) |
| NA | na.q-grid.net | `na` | region URL when provisioned |
| IN / AE | in. / ae.q-grid.net | `in` / `ae` | same pattern |

Code: `@taurus/jurisdiction` configs + `@taurus/db` `resolveDatabaseUrl()`.

**Sovereignty marketing:** ship CA residency engineering; do **not** claim full legal sovereignty until key custody + counsel (`docs/sovereign-cell-architecture.md`).

---

## GitHub & deploy map

| Surface | GitHub | Vercel project | rootDirectory |
|---------|--------|----------------|---------------|
| Monorepo | `Taurus-Ai-Corp/GRIDERA` | landing, comply, q-grid-comply-ca, guard | apps/landing, apps/comply, packages/guard/api |
| Scanner lineage | `Taurus-Ai-Corp/gridera-scan` | — | — |
| Swarm-Spawner | `Taurus-Ai-Corp/swarm-spawner` | — | npm publish |

**Rule:** production deploys only from **`main`**. Feature-branch `--prod` deploys can clobber CTAs.

---

## Forbidden in external decks

- Space-form product names (must use pipe): see brand guard script  
- Deprecated Q-Grid product prefixes (domains like q-grid.net stay valid)  
- Paths: legacy monorepo dir as shipping source  
- SENTINEL as AI-audit product  

Allowed: `GRIDERA|Comply`, domains `q-grid.net` / `eu.q-grid.net`, repo name `GRIDERA`.

---

## Related runbooks

- `docs/ca-dns-cutover.md` — CA DNS (Name.com, not Replit)  
- `docs/ops/CA-CELL-OPS-CHECKLIST.md` — CA go-live probes  
- `docs/ops/GRIDERA-DEPLOYMENT-MAP.md` — deploy topology  
- `scripts/funnel-smoke.ts` — production funnel smoke  
- `scripts/agents/` — research / QA agents  
