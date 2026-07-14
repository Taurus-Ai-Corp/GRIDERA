# GRIDERA|Guard — SaaS Extraction & Launch Plan

**Date:** 2026-06-10
**Status:** ACTIVE — Execution in progress
**Authority:** Taurus AI Corp (Canada) / ARQ QUANTUM LLC (Wyoming)
**Product Site:** guard.gridera.net

---

## Market Gap Analysis

### Competitors (as of early 2025)

| Product | Type | Pricing | PQC Attestations | Blockchain Audit | EU AI Act |
|---------|------|---------|-------------------|-----------------|-----------|
| NeMo Guardrails (NVIDIA) | OSS + enterprise | Free / custom | No | No | Partial |
| Guardrails AI | OSS + cloud | Free / custom | No | No | No |
| Llama Guard (Meta) | OSS model | Free | No | No | No |
| CalypsoAI | SaaS platform | $50K-200K/yr | No | No | Yes |
| Holistic AI | Assessment platform | $30K-100K/yr | No | No | Yes |
| Fairly AI | Governance platform | Custom | No | No | Yes |
| Vanta/Drata | GRC platform | $20K-80K/yr | No | No | Indirect |

### The Gap NOBODY Fills

1. **PQC-signed AI attestations** — ML-DSA-65 is a NIST PQC standard (FIPS 204). ZERO commercial products offer quantum-safe signed proof that an AI decision was made with specific guard rules. This is a $0 → $1 market creation.

2. **Blockchain audit trail** — Hedera HCS provides immutable, governed, carbon-negative anchoring. No AI governance tool uses it. Regulators love immutable audit trails.

3. **Jurisdiction-aware guard rules** — Current tools are country-agnostic. GRIDERA|Guard maps guard rules to specific EU AI Act articles, NIST AI RMF categories, and SOC 2 controls.

4. **$1K/mo entry point** — CalypsoAI starts at $50K/yr. Holistic AI at $30K. We start at $1K/mo for SMB. 50x price disruption.

### Our Moat

- ML-DSA-65 signing (NIST PQC standard, FIPS 204) — nobody else has this
- Hedera HCS anchoring — immutable, governed, ESG-friendly
- EU AI Act Article 9/11/14/15 compliance mapping — regulatory-ready
- TypeScript SDK — integrates in 5 minutes, any framework
- $1K/mo starting price — 50x cheaper than enterprise incumbents

---

## Product Architecture

### Extraction from Comply → Standalone Package

The current `ai-guard.ts` (290 LOC) + `ai-guard-rules.ts` (172 LOC) = 462 LOC of production code.
Extraction plan:

```
@taurus/guard (npm package)
├── src/
│   ├── index.ts              ← Public API: execute(), checkInput(), checkOutput()
│   ├── guard.ts              ← Core execute() logic (from ai-guard.ts)
│   ├── rules.ts              ← Guard rules engine (from ai-guard-rules.ts)
│   ├── attestation.ts        ← PQC signing (extracted from guard.ts)
│   ├── audit.ts              ← Audit trail persistence (extracted from guard.ts)
│   ├── hedera.ts             ← HCS anchoring (new, from @taurus/hedera)
│   ├── pricing.ts            ← Model pricing calculator (extracted)
│   ├── types.ts              ← GuardInput, GuardAttestation, GuardResult, etc.
│   └── presets/
│       ├── eu-ai-act.ts      ← EU AI Act Article 9/11/14/15 rule presets
│       ├── nist-ai-rmf.ts    ← NIST AI Risk Management Framework presets
│       └── soc2.ts            ← SOC 2 Type II control mapping presets
├── test/
│   ├── guard.test.ts
│   ├── rules.test.ts
│   ├── attestation.test.ts
│   ├── hedera.test.ts
│   └── integration.test.ts
└── package.json
```

### API Endpoints (5 routes, Fastify)

```
POST /guard/v1/execute      ← Main guard endpoint (wrap LLM call)
POST /guard/v1/check-input  ← Input-only validation
POST /guard/v1/check-output ← Output-only validation
GET  /guard/v1/attestations/:id ← Retrieve signed attestation
POST /guard/v1/anchor       ← Anchor attestation to Hedera HCS
```

### SDK Usage (5-minute integration)

```typescript
import { createGuard } from '@taurus/guard'

const guard = createGuard({
  jurisdiction: 'eu',
  preset: 'eu-ai-act',
  pqcKey: process.env.PLATFORM_PQC_SECRET_KEY,
  hederaConfig: { network: 'mainnet', topicId: process.env.HEDERA_TOPIC_ID }
})

const result = await guard.execute({
  prompt: userPrompt,
  llmCall: () => model.generate(userPrompt),
  model: 'gpt-4',
  jurisdiction: 'eu'
})

// result.blocked? → guard blocked the call
// result.attestation → ML-DSA-65 signed proof
// result.attestation.signature → verifiable PQC signature
// result.attestation.guard_verdict → 'pass' | 'block' | 'warn'
```

---

## Pricing Tiers

| Tier | Price | Features |
|------|-------|----------|
| **Sandbox** | Free | 1K guard calls/mo, community support, basic rules |
| **SMB** | $1K/mo | 100K calls/mo, PQC attestations, 3 jurisdictions, email support |
| **Enterprise** | $3K/mo | Unlimited calls, PQC + Hedera HCS anchoring, all jurisdictions, custom rules, SLA |
| **White-label** | $5K/mo | Enterprise + co-branded dashboard, API customization, dedicated support |

---

## 1-Year Revenue Forecast (Conservative)

| Quarter | Customers | MRR | Cumulative |
|---------|-----------|-----|------------|
| Q1 (Wk 1-12) | 2-3 SMB + 1 pilot | $2-4K | $6-12K |
| Q2 (Mo 3-6) | 5-8 SMB + 2 enterprise | $8-15K | $30-57K |
| Q3 (Mo 6-9) | 10-15 SMB + 4 enterprise | $18-35K | $84-162K |
| Q4 (Mo 9-12) | 15-20 SMB + 6 enterprise | $30-50K | $174-362K |

### Revenue Assumptions
- UAE fintech pilots close in 6-8 weeks (ATRC/QuantumGate warm intros)
- ADGM RegLab alumni are warm leads (980 regulated entities)
- Guard+Comply bundle increases deal size 3x
- Canada SR&ED tax credit on PQC R&D (~35% recovery)
- Enterprise deals start at $3K/mo, expand to $5-12K/mo with Observe+Comply bundle

---

## Go-to-Market Channels

1. **UAE fintech corridor** — ATRC/QuantumGate partnership, ADGM RegLab, DFSA regulated entities
2. **EU AI Act compliance** — Companies scrambling for Articles 9/11/14/15 proof before enforcement
3. **SOC 2 Type II** — AI governance is a new SOC 2 control area; Guard provides audit evidence
4. **Developer community** — Open-source the SDK, monetize the attestation/HCS anchoring API
5. **Hedera ecosystem** — HBAR Foundation grants, Hashgraph community, enterprise Hedera users

---

## Implementation Tasks (TDD)

### Phase 1: Extract & Ship (Weeks 1-2)

- [ ] T1: Create `@taurus/guard` package with types.ts and GuardInput/GuardResult/GuardAttestation interfaces
- [ ] T2: Extract guard.ts — core execute() function with input/output guard pipeline
- [ ] T3: Extract rules.ts — INPUT_RULES, OUTPUT_RULES, checkInputRules(), checkOutputRules()
- [ ] T4: Extract attestation.ts — PQC signing with ML-DSA-65, SHA-256 fallback
- [ ] T5: Extract audit.ts — audit trail persistence (DB-agnostic, pluggable storage)
- [ ] T6: Add hedera.ts — HCS topic anchoring for attestations
- [ ] T7: Add pricing.ts — model pricing calculator with configurable rates
- [ ] T8: Add jurisdiction presets — eu-ai-act.ts, nist-ai-rmf.ts, soc2.ts
- [ ] T9: Write comprehensive test suite (guard.test.ts, rules.test.ts, attestation.test.ts, hedera.test.ts, integration.test.ts)
- [ ] T10: Create Fastify API server with 5 endpoints
- [ ] T11: Add API key auth middleware (first-party; not Clerk)
- [ ] T12: Deploy to guard.gridera.net on Vercel

### Phase 2: Enterprise Hooks (Weeks 3-6)

- [ ] T13: Landing page at guard.gridera.net with pricing table
- [ ] T14: Self-serve signup flow (API key provisioning)
- [ ] T15: /guard/v1/attestations/:id endpoint
- [ ] T16: /guard/v1/anchor endpoint with Hedera mainnet
- [ ] T17: Dashboard: guard pass/block/warn rates, latency, cost per request
- [ ] T18: Usage metering and billing (Stripe integration)

### Phase 3: Compliance Flywheel (Months 3-6)

- [ ] T19: Guard + Observe + Comply bundle pricing
- [ ] T20: EU AI Act conformity assessment package
- [ ] T21: ATRC/QuantumGate partnership outreach
- [ ] T22: ADGM/DFSA warm intro campaign

---

## Key Decisions

- **Not forking NeMo Guardrails** — wrong domain (LLM steering ≠ PQC compliance), Python-only, NVIDIA-branded
- **TypeScript SDK** — our target market (fintech, compliance teams) writes TypeScript
- **Rule-based, not ML** — auditable, deterministic, no black-box trust issues
- **PQC signing first, Hedera anchoring second** — PQC is the unique moat, Hedera is the differentiator
- **$1K/mo starting price** — 50x cheaper than incumbents, volume play
- **Open-core model** — SDK is OSS, attestation API + HCS anchoring is paid