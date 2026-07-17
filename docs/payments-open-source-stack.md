# Open-Source Payment Stack — Decision Record (Stripe Replacement)

**Prepared:** 2026-07-17 · **Author:** Claude (GRIDERA internal) · **Status:** proposed, not yet implemented
**Constraint from owner:** open-source, self-hostable, **free of cost**, high-throughput, low-latency, cryptographically secure, globally usable. **No Stripe.**
**Confidence key:** ✅ verified from repo/primary sources · ⚠️ needs verification before relying on it · ❌ do not assume

---

## 0. TL;DR

Replace Stripe with a **two-rail + metering** open-source design, most of which GRIDERA already owns:

| Layer | Tool | License | Cost | Role |
|---|---|---|---|---|
| **Rail A — fiat cards/bank** | **Hyperswitch** (Rust) | Apache-2.0 | Free self-host (OCI free tier) | Payment orchestration; 1 API in front of ~124 processors; PCI scope reduction via hosted fields |
| **Rail B — native settlement** | **Hedera HTS + HCS** (already in repo) + **x402** | Apache-2.0 / MIT-ish | Free code; ~$0.0001/tx network fee | Stablecoin (USDC/USDT) + micropayments; 3–5s finality; PQC-signed, ledger-anchored receipts |
| **Billing / metering** | **Lago** | AGPL-3.0 | Free self-host | Subscriptions, usage metering, invoicing (the part Hyperswitch does *not* do) |

**Do NOT** believe this makes you "globally compliant." See §5 — compliance is legal/operational, not a library.

---

## 1. What GRIDERA already owns (verified in repo)

- ✅ `packages/hedera/src/hts.ts` + `hcs.ts` — Hedera Token Service + Consensus Service wrappers. HTS = value transfer rail; HCS = tamper-evident audit log. **BUT**: payment-relevant functions are currently **stubs** — e.g. `mintComplianceNFT()` returns `Promise<never>`. The rail is scaffolded, not implemented for money movement. ⚠️
- ✅ `packages/pqc-crypto` (ML-DSA-65) — cryptographic receipt signing, already used for CBOM/scan attestations.
- ✅ `packages/db/src/schema/billing.ts` — the `billing` table already carries `hederaTxId`, `pqcSignature`, `pqcHash` next to `stripeEventId`. **The schema was built crypto-native from day one.** Migration to remove Stripe is small (see §6).
- ✅ Prior research: `_archive/Comply.Q-Grid.EU/OPEN_SOURCE_PAYMENTS.md`, `_archive/Q-Grid.CA|IN/.../07_x402_Payment_Integration_*.md`.
- ✅ Stripe surface to replace (contained): `apps/comply/src/lib/stripe.ts`, `apps/landing/src/lib/billing.ts`, `apps/landing/src/lib/guard-tiers.ts`, and ~8 API routes (`billing/checkout`, `billing/portal`, `webhooks/stripe`, `guard/checkout`, `guard/webhook`, `guard/signup`, `guard/lookup`, `scan/report`).

**Implication:** this is a *contained refactor plus one new self-hosted service*, not a rebuild.

---

## 2. Rail A — Hyperswitch (fiat)

- Rust payment **orchestrator**: one integration, swap/route processors behind it. Apache-2.0, self-hostable free.
- Why it fits: enterprises still pay compliance software by **card or invoice**, not crypto. Hyperswitch keeps that door open while removing Stripe lock-in and per-tx SaaS fees.
- Deploy: Oracle Cloud free tier (4 ARM vCPU / 24GB / 200GB, forever-free) via their Docker/Helm stack. ⚠️ Verify current one-click installer version before deploy.
- PCI: hosted payment fields keep card data off your servers → **SAQ-A scope**, the lightest PCI tier. (Scope *reduction*, not elimination — see §5.)
- Client migration is a drop-in-ish swap: `@stripe/stripe-js` → Hyperswitch web SDK; server `Stripe` SDK → Hyperswitch REST.

**Cost:** $0 self-hosted (you pay only the underlying processor's per-tx rate on the connector you enable).

---

## 3. Rail B — Hedera HTS + x402 (native settlement, the "fast/cryptographic/global" rail)

This is the differentiated rail and the reason GRIDERA is not just another SaaS reselling Stripe.

- **HTS stablecoin transfer**: settle in USDC/USDC-equivalent on Hedera. ✅ 3–5s finality, ~$0.0001 fixed fee, aBFT (asynchronous Byzantine fault tolerant) consensus, 10k+ TPS class throughput. Borderless by construction.
- **x402** (HTTP `402 Payment Required` protocol): pay-per-call / micropayment flow — ideal for GRIDERA|Scan per-scan, GRIDERA|Lend per-assessment, or API metering. Your prior doc models ₹0.01 minimums at 2s settlement.
  - ⚠️ **Reality check:** the mature x402 reference implementations are **EVM / Base / USDC-centric**. A first-class **Hedera** x402 binding likely needs custom adapter work — budget for it, don't assume a drop-in library exists. Verify before promising it externally.
- **Cryptographic receipts**: sign each settlement with ML-DSA-65 (you already do this for scans), write the hash to HCS. Result: a **PQC-signed, publicly-verifiable payment receipt** anchored on a ledger — a genuine enterprise differentiator (auditor-admissible evidence, not just a Stripe dashboard row).

**Cost:** free code; network fees ~$0.0001/tx (fractions of a cent). No processor cut.

---

## 4. Billing / metering — Lago (replaces Stripe *Billing*, which Hyperswitch does not cover)

- Hyperswitch orchestrates **payments**; it does not do subscriptions, usage metering, or invoicing. Stripe bundled both — open-source splits them.
- **Lago** (AGPL-3.0, self-host): metering, plans, usage-based billing, invoices. Pairs with either rail.
- Alternative: **Flexprice** (Go, credit-wallet model) — younger, good for prepaid API credits. **Kill Bill** (Apache-2.0, Java) — battle-tested 15+ yrs but operationally heavy; only if you need its maturity.

---

## 5. The compliance truth (read this before believing "globally compliant")

Software gives you **primitives**; compliance is an **operating obligation**. Where each helps and where you're still on the hook:

| Requirement | What the stack gives you | What you still must do (not software) |
|---|---|---|
| **PCI-DSS** (cards) | Hyperswitch hosted fields → SAQ-A scope | Annual SAQ, ASV scans, policies |
| **PSD2 / SCA** (EU) | Connector-level 3DS2 support | Merchant onboarding, SCA exemption logic, licensing |
| **RBI PA-PG** (India) | Nothing automatic | Payment Aggregator authorization or partner with a licensed PA; you **cannot** self-settle INR cards without it |
| **AML / KYC / sanctions** | Nothing automatic | Screening provider, travel-rule for crypto, record-keeping |
| **Stablecoin custody** | HTS holds tokens | Custody/e-money licensing varies by country; USDC redemption relationship |
| **ISO 20022** | Hedera targets regulated-finance messaging ⚠️ | Verify actual message-format support before claiming it |

**Bottom line:** the stack is free and technically world-capable. "Compliant with the entire world's transactions" is a **legal program**, not a deploy. Underclaim externally.

---

## 6. Integration path (phased, with real commands)

**Phase 0 — schema (small, do first)** — ✅ shipped in PR #31 (`feat/payments-phase0-provider-schema`), not yet applied to Neon.
- Make Stripe generic **additively**: add `provider text` ('stripe' | 'hyperswitch' | 'hedera' | 'lago') and `provider_event_id` (unique). **Keep** `billing.stripeEventId` (marked `@deprecated`) — it is dropped only in Phase 5, so no current reader breaks and the schema apply can happen independently of the code cutover. Idempotent manual migration at `packages/db/migrations-manual/billing_provider_generic.sql`.

**Phase 1 — Hyperswitch on OCI (fiat rail)**
```bash
# On Oracle Cloud free-tier ARM instance
git clone https://github.com/juspay/hyperswitch && cd hyperswitch
# ⚠️ follow current docker-compose / helm quickstart in their README (version-check first)
docker compose up -d
# then: create merchant account, enable a connector, grab publishable + secret keys
```
- Swap `apps/comply/src/lib/stripe.ts` for a `payments.ts` that calls Hyperswitch REST; swap client SDK.

**Phase 2 — Hedera settlement rail (native)**
- Implement the stubbed HTS functions (`packages/hedera/src/hts.ts`) for USDC/HTS transfer + balance.
- Add ML-DSA-65 signing of the settlement record; write hash to HCS (reuse the CBOM/scan anchoring pattern).
- Expose `/api/pay/hedera` issuing a PQC-signed, HCS-anchored receipt.

**Phase 3 — x402 metering (optional, per-call products)**
- Build a Hedera x402 adapter (⚠️ custom — no drop-in Hedera lib assumed) for Scan/Lend micropayments.

**Phase 4 — Lago (subscriptions/metering)**
```bash
# Self-host Lago on the same OCI box
git clone https://github.com/getlago/lago && cd lago
./install.sh   # ⚠️ verify current install method
```

**Phase 5 — decommission Stripe**
- Remove `@stripe/stripe-js`, `stripe` deps; delete `webhooks/stripe`; update privacy/terms copy referencing Stripe.

---

## 7. Risks & honest unknowns

- ⚠️ **HTS payment functions are stubs today** — Phase 2 is real engineering, not wiring.
- ⚠️ **Hedera x402 has no assumed drop-in** — reference impls are EVM/Base/USDC. Custom adapter risk.
- ⚠️ **Self-hosting = ops burden** — you own uptime, patching, PCI evidence for Hyperswitch. "Free" ≠ "no cost of operation."
- ⚠️ **Crypto settlement ≠ fiat in the bank** — someone must off-ramp USDC→fiat; that reintroduces a regulated intermediary.
- ✅ **Contained blast radius** — Stripe touches ~20 files behind two thin wrappers; migration is scoped.

---

## 8. Recommendation

1. **Start Phase 0 + Phase 1** (schema + Hyperswitch) — highest leverage, replaces Stripe's card flow with zero SaaS fees.
2. **Then Phase 2** (Hedera PQC-signed receipts) — this is the moat, not the cards.
3. Treat Rail B stablecoin/x402 as the enterprise-differentiator, but gate any external claim on the §5 compliance work and the §7 unknowns.
