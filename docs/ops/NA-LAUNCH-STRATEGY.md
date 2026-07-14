# GRIDERA — North America / LATAM Launch Strategy

> Adopted 2026-07-14 (founder decision log). Brand: **GRIDERA by Taurus AI**.
> Domains are FROZEN infrastructure: NA products serve under `na.q-grid.net/*`
> (comply, lend, migrate, scan, pay, guard). Never migrate traffic to gridera.net.

## The launch narrative — deadline stacking (validated by /last30days, 2026-07-14)

The NA market moment is a compounding regulatory squeeze, not an abstract quantum threat:

| Mandate | Date | Effect |
|---------|------|--------|
| EO 14412 | June 2026 | Federal PQC migration becomes binding; FAR contractor compliance directed |
| FIPS 140-2 sunset | Sept 21, 2026 | Legacy module certificates expire; 140-3 required |
| CMMC 2.0 | Nov 2026 | Defense supply-chain enforcement begins |
| **CNSA 2.0** | **Jan 1, 2027** | **Procurement gate — new NSS deployments must be quantum-safe** |
| CNSA 2.0 full | 2033 | OS/apps/cloud exclusive use |

Market-validated angles: (1) discovery is the felt gap — CISOs can't inventory their
cryptography (sell GRIDERA|Scan first); (2) DIY program cost is $400K–$1.2M year one in
FTEs alone — against a software-defined entry point; (3) ML-DSA resignation is complete
(Cloudflare: "ML-DSA will have to do") — enterprises want someone to absorb the churn.

## Dual-entity structure (decided)

- **US LLC** (Wyoming): commercial contracts, USD billing (US + LATAM), IP licensing
  rights, VC/SBIR access, federal procurement posture.
- **Canadian Corp**: R&D engine — SR&ED (35–60% of eligible R&D labor), NRC IRAP,
  CUSMA/USMCA tariff-free delivery, Global Skills Strategy hiring. CAD billing for
  Canadian clients.
- Intercompany IP license: Canadian entity develops, US entity holds global commercial
  licensing. 100% solo ownership of both.

## Regional verticals

| Vertical | Pain | GRIDERA answer |
|----------|------|----------------|
| Defense & Federal (US/CA) | CMMC/FedRAMP + PQC deadlines | Compliance pipelines, air-gapped deploys, FIPS 203/204 native |
| FinTech & Banking | Zero-trust multi-cloud, cross-border scrutiny | Hedera-anchored immutable audit, automated SOC 2 evidence |
| Healthcare | HIPAA + confidential compute overhead | HIPAA-ready environments, encrypted pipelines |
| Growth SaaS | Tool sprawl, cloud bills | Unified engines, AI rightsizing (~35% cloud savings) |

## GTM phases

1. **Seed (M1–3)**: free tier via GRIDERA|Scan; open-source quantum-readiness CLI as
   lead gen; cloud region deploys (US-East/West, Canada-Central); intercompany IP license.
2. **Expand (M4–6)**: AWS/GCP/Azure Marketplace listings (burn committed cloud spend);
   50 NA scale-ups in developer beta; file SR&ED claims.
3. **Scale (M7–12)**: LATAM localization (es/pt — LGPD Brazil, Law 25 Quebec in pack);
   SI channel partners; SOC 2 Type II certification complete + FedRAMP readiness.

## Compliance certification sequence (decided 2026-07-14)

SOC 2 Type II first (6-month observation window — clock starts now, scoped to
COMPLY/SCAN), then ISO 27001 as the EU/global backbone. Geo packs are regulatory
*content*, not forks: `packages/jurisdiction` configs per region (NA pack carries the
deadline stack above; EU pack carries AI Act/GDPR/DORA/NIS2 — live at eu.q-grid.net).

## Action items

| Action | Owner | Deadline |
|--------|-------|----------|
| Intercompany IP licensing agreement (US LLC ↔ Canadian Corp) | Founder | 2026-09-30 |
| SR&ED + IRAP applications | Founder | 2026-10-31 |
| SOC 2 Type II readiness assessment | Engineering | 2026-11-15 |
| Multi-currency payment infrastructure (USD/CAD) | Operations | 2026-08-31 |
| Developer beta across NA tech hubs | DevRel | 2027-01-15 |
