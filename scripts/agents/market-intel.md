# Agent C — Market intel brief (research agent prompt)

**Cadence:** weekly  
**Skills:** web_search, last30days, deep-research  
**Output path:** `docs/ops/market-intel/YYYY-MM-DD.md`

## Query set

1. Post-quantum compliance SaaS pricing (PQShield, sandbox AQ, Cloudflare PQC, AWS hybrid PQ)  
2. Continuous control monitoring (Vanta, Drata, Secureframe) — PQC messaging gaps  
3. Sovereign cloud / Canadian data residency claims (honest vs L1 residency-only)  
4. CSE 2027 / OSFI B-13 / CCCS PQC guidance updates last 30 days  
5. LLM guardrail vendors vs GRIDERA|Guard attestation story  

## Required output shape

| Competitor | ICP | Pricing | PQC claim | Gap vs GRIDERA|Scan/Comply/Guard |
|------------|-----|---------|-----------|----------------------------------|
| … | … | … | … | … |

## Novel angles to score

- Jurisdiction cells as SKUs (CAD CA cell)  
- Free QRS public scan as lead magnet vs paid-only assessments  
- HCS-anchored ML-DSA audit trail uniqueness  

## Delivery

- Write markdown under `docs/ops/market-intel/`  
- Top 3 GTM actions for sales-ops Kanban  
- No space-form brand names (use `GRIDERA|Verb`)  

## Run (agent session)

```
/deep-research GRIDERA competitive landscape PQC compliance SaaS 2026 standard
```

Or Hermes profile `bio-foundry-ops` / `analyst` with this file as the prompt body.
