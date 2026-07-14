# GRIDERA Enterprise Architecture + Brutally Honest Slaughter

**Date:** 2026-07-14  
**Mode:** CTO / product / cryptographer / BD — zero boat  
**Companion docs:** `GRIDERA-DEPLOYMENT-MAP.md`, `GRIDERA-STRATEGIC-GTM-INTEGRATION.md`  
**Status:** Architecture + audit complete. Meet-summary integration **READY** (await attachment).

---

## Executive truth (one paragraph)

You have a **real monorepo**, a **working free scan** (live POST `/api/scan` returns QRS + PQC stamp for `example.com`), a **live Comply SaaS shell** on `eu.q-grid.net`, and a **Guard executor** that answers health on `guard-beryl.vercel.app/guard/v1/health`. You do **not** yet have a single unbroken client journey from “curious CISO lands” → “pays” → “gets immutable regulator pack” without human glue. Six products are marketed; **two are brochure pages** (Lend, Asset). Analytics is a stub. Guard rewrite through `eu.q-grid.net/guard` returned **404 HTML** in this audit while the beryl host is healthy — a **client-facing break**. Enterprise buyers will not buy “platform of six” until **one golden path is boringly reliable**.

Honest product state: **MVP / pilot-ready for Scan + Comply narrative**, **partial for Guard/Migrate**, **vision for Lend/Asset**. Not a finished enterprise system of record.

---

## 1. Target enterprise architecture (novel, non-fragile)

### 1.1 Principle: one golden path, not six equal products

```
                    ┌─────────────────────────────────────────┐
                    │         EDGE (Vercel)                   │
                    │  q-grid.net (landing)                   │
                    │  eu.q-grid.net (comply)                 │
                    │  guard-beryl (executor) via rewrite      │
                    └───────────┬─────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
   ┌───────────┐         ┌────────────┐         ┌────────────┐
   │ Scan      │         │ Comply     │         │ Guard API  │
   │ pqc-engine│────────▶│ QRS/QREP   │◀────────│ Fastify    │
   │ stamp     │  scanId │ JWT auth   │  rewrite │ ML-DSA etc │
   └─────┬─────┘         └─────┬──────┘         └─────┬──────┘
         │                     │                      │
         │              ┌──────┴──────┐               │
         │              │ Neon Postgres│◀─────────────┘
         │              │ (jurisdiction)│
         │              └──────┬──────┘
         │                     │
         │              ┌──────┴──────┐
         └─────────────▶│ Hedera HCS  │  audit anchors
                        │ (optional   │  (fail closed in prod
                        │  degrade)   │   for paid tier only)
                        └─────────────┘
```

**Novel hard-to-copy layer (not “another scanner”):**

| Layer | What competitors sell | GRIDERA differentiator if *proven* |
|-------|----------------------|-------------------------------------|
| Discovery | CBOM / network scan | QRS + financial harvest-window language + PQC stamp on every scan |
| Migration | Consultants / HSM | RefAgent swarm that **opens verified PRs** + self-heals (must demo live) |
| Compliance | Policy templates | **Art. 15-ready** evidence chain: sign → HCS → report |
| AI control | LLM gateways | Guard with **ML-DSA-65 + HCS** on each execute (health OK; full execute needs LLM key) |

### 1.2 Reliability architecture (nothing breaks)

| Concern | Design rule | Current gap |
|---------|-------------|-------------|
| **Fail closed vs open** | Free scan may degrade (ephemeral key); **paid Comply never** ships unsigned “evidence” | Ephemeral key path exists in scan if platform keys missing — OK for free, must be labeled |
| **Rewrite contracts** | Single documented Guard base URL; health check in CI against prod rewrite | `eu.q-grid.net/guard/v1/*` 404 in audit |
| **Idempotency** | scanId / assessmentId as primary keys; dual-read sessionStorage | Partial |
| **Multi-tenant** | First-party JWT + Neon RLS / row filters | Verify RLS exists (do not assume) |
| **Secrets** | Vercel env only; `printf` never `echo` (newline gotcha) | Documented historically |
| **Observability** | PostHog + structured logs + error tracking | **Analytics returns null** — flying blind |
| **Deploy** | landing/comply on push main; Guard clean worktree only | Guard not in CI — drift risk |
| **Domain freeze** | Only `q-grid.*` in client copy | Enforced after PR #23 |
| **Maturity labels** | CORE / LABS / VISION badges on site | Lend/Asset look like peers to Scan |

### 1.3 Client-facing interaction model (what a real buyer does)

```
T+0s    Land q-grid.net — fear strip (HNDL) + single CTA "Scan free"
T+30s   Enter domain → POST /api/scan → results + QRS
T+2m    Email capture for full QREP → Resend (if key live)
T+3m    CTA "Open GRIDERA|Comply" → eu.q-grid.net (first-party sign-up)
T+10m   Onboarding org → create system → start assessment OR attach scanId
T+30m   Report download / dashboard — PQC badge real, not placeholder
T+day   Migrate inquire for services still weak
T+week  Pilot LOI — 12-week fixed scope
```

**Anything off this path is secondary.** Lend/Asset demos are BD side quests until CORE path is airtight.

### 1.4 Integration map (keys already on this machine)

| System | Where keys live | Use in novel product |
|--------|-----------------|----------------------|
| Stripe | Vercel landing/comply | Checkout, report purchase, Guard SMB |
| Resend | landing | Scan report / newsletter / support |
| JWT_SECRET | comply | First-party auth (Clerk permanently removed) |
| Neon DATABASE_URL | landing/comply/guard | Persistence |
| Hedera operator | local `.env.local` (not fully on Vercel list) | **Risk:** audit anchors may be local-only |
| OpenRouter | **guard** project | LLM for Guard execute |
| PLATFORM_PQC_* | landing/comply | Scan stamps |
| GWS | gws-bridge | Client workspaces / lead sheets (ops, not product core) |
| Nexus stack (OpenAI, Anthropic, HubSpot, etc.) | Nexus `.env.example` / secrets | HubSpot CRM for LOIs; do **not** bolt random LLM into scan path without contracts |

**Integration rule:** only wire a key when there is a **contract test** and a **prod health probe**. Novel ≠ more APIs; novel = **verifiable chain**.

---

## 2. Live verification snapshot (this session)

| Check | Result |
|-------|--------|
| `GET q-grid.net` (+ scan/migrate/guard/pricing/lend/asset) | 200 |
| `POST /api/scan` `example.com` | **200** QRS overall **36**, ECDSA weak, PQC stamp present |
| `GET guard-beryl…/guard/v1/health` | **200** `{"status":"ok"}` |
| `GET guard-beryl…/` | 404 (expected API-only) |
| `POST eu.q-grid.net/guard/v1/execute` | **404 HTML** — rewrite broken or missing |
| Lend/Asset pages | Brochure + mailto demo — **no product backend** |
| Analytics | **null component** |
| Unit tests | Large suite (comply/guard/pqc) — not full client E2E |
| Brand gate (post PR#23) | Clean GRIDERA\| on home |

---

## 3. Brutally honest slaughter (slasher mode)

### 3.1 Product claims vs reality

| Claim you market | Reality check | Verdict |
|------------------|---------------|---------|
| “Six products. One fabric.” | Two are static marketing shells | **OVERCLAIM** — mark LABS or hide from CORE nav |
| Software-defined PQC &lt;1 hour | Scan + landing deploy yes; full estate migration no | **PARTIAL** |
| RefAgent 25.3%→90% | Research/PRD number — not shown as live dashboard metric | **THEORETICAL until demo repo** |
| EU AI Act compliance platform | Assessment + matrix exist; incomplete features called out in UI | **MVP** |
| Guard with LLM + attestation | Health OK; LLM empty without config; rewrite broken on comply domain | **BROKEN PATH** |
| Hedera-anchored everything | Local Hedera env; not clearly on all Vercel projects | **UNPROVEN in prod** |
| $1.2M ARR / design partner | Goal, not evidence | **SPECULATIVE** |
| Zero gridera.net brand mess | Client copy fixed; Vercel still has dead aliases | **IMPROVED / residual** |

### 3.2 Why a cryptographer would walk away in the first 15 minutes

1. **No public threat model** (what you sign, what you don’t, failure modes).  
2. **No published algorithm policy** (hybrid transitions, deprecation, algorithm agility).  
3. **Scan ≠ CBOM of code** — TLS cert scan is necessary but not sufficient for “estate quantum readiness.”  
4. **Signature truncation in API responses** (`signature.slice(0,128)+'...'`) confuses verifiers — show full signature in “verify” endpoint.  
5. **Ephemeral signing keys on free tier** must never be confused with platform root of trust.  
6. **Missing: formal verification of stamp schema**, key ceremony docs, rotation runbook.  
7. **Guard without rate limits / abuse story** becomes free attack surface.

### 3.3 Why a CTO would not buy yet

1. Broken Guard URL through primary SaaS domain.  
2. No status page / SLO.  
3. No SOC2 / pen-test letter (even “in progress” timeline).  
4. Six-product confusion → unclear SOW.  
5. No production observability → “how do you know we’re up?”  
6. Onboarding “team invites coming soon.”  
7. PQC badge **placeholder** on assessment results page.

### 3.4 Why a BD would lose the pilot

1. No one-page pilot SOW with fixed DoD (you have deck text; not a signed template).  
2. No CRM stage automation (HubSpot keys exist in org but not wired to scan leads).  
3. Demo depends on founder email.  
4. Lend/Asset dilute CORE story in every call.

---

## 4. What you haven’t asked (1% cryptographer + engineer + CTO)

These are the “hard-to-sell boat” items — the ones that close enterprise **or** kill credibility:

### Cryptography / trust

1. **Root of trust ceremony** — Who generates `PLATFORM_PQC_*`? Hardware? Multi-person? Air-gapped? Documented?  
2. **Key rotation without invalidating historical reports** — Certificate transparency-style log of public keys.  
3. **Hybrid signatures** (classical + PQC) during transition — NIST-aligned story, not ML-DSA-only absolutism.  
4. **Side-channel and library choice** — @noble vs liboqs vs HSM-backed for paid tier; formal choice memo.  
5. **Proof of verification tool** — `curl …/verify` or CLI that a third-party auditor can run offline.  
6. **Threat model document** (STRIDE + quantum adversary) public PDF.  
7. **What you deliberately do NOT claim** (e.g. “quantum-safe forever”).

### Product / reliability

8. **Golden path E2E test in CI** against production-like env (Playwright): scan → results → email → comply deep link.  
9. **Contract tests for Guard rewrite** every deploy (health 200 on `eu.q-grid.net/guard/v1/health`).  
10. **Feature flags** for LABS products so CORE never shows vapor.  
11. **Data residency map** (which Neon project per jurisdiction) — enterprise RFP checkbox.  
12. **Incident runbook + status.q-grid.net** (even static + RSS).  
13. **Kill switch** for free scan abuse (WAF / Upstash rate limit — Redis keys exist in example).

### GTM / BD

14. **Single ICP for next 90 days** (e.g. EU high-risk AI + financial TLS estate) — kill multi-geo multi-vertical spray.  
15. **Design partner legal** — DPA, subprocessors list, data processing terms before first scan of real client domain.  
16. **Competitive kill sheet** that is honest (vs Vanta: different job; vs Quantinuum/others: different layer).  
17. **Reference architecture one-pager** a CISO can forward to architecture board without founder on call.  
18. **Price fence** — free scan never undercuts $250K pilot (report depth gated correctly).

### Org / ops

19. **One production owner** for Guard deploys (currently manual worktree tribal knowledge).  
20. **Memory hygiene** — agents still carry contradictory domain advice; single `DEPLOYMENT-MAP` is source of truth.  
21. **Strip “8 engines / 240+ scans” from public** unless weekly verified metric job exists.  
22. **Meet summary + cryptographer notes → threat model + roadmap** (awaiting your attachment).

---

## 5. Testing strategy (client perspective + sub-agents)

### 5.1 Persona scripts (manual or browser agent)

| Persona | Script | Pass criteria |
|---------|--------|---------------|
| **Skeptical CISO** | Home → Scan `example.com` → read risk → open Comply CTA | No Q-GRID; QRS readable; no 5xx |
| **DevOps** | Guard page → copy curl → hit health + unauthorized execute | Correct base URL; 401 not 404 |
| **Auditor** | Comply sign-up → assessment → results | No “PQC placeholder”; export exists or honest empty state |
| **BD prospect** | Migrate inquire form | Email arrives Resend; CRM row if HubSpot wired |
| **Abuser** | 50 scans/min | Rate limited |

### 5.2 Automated gates (must become CI)

```
lint:brand → type-check → unit tests → 
playwright golden path (preview URL) →
prod canary: GET health rewrite + POST scan canary domain →
rendered brand gate (curl HTML)
```

### 5.3 Sub-agent dispatch plan (when you say go)

| Agent | Job |
|-------|-----|
| **security-auditor** | OWASP on landing/comply APIs; secret scan; Guard auth |
| **position-me** | Full multi-page LIFT/PAS audit of q-grid.net |
| **browser-use / Playwright** | Golden path video + screenshots |
| **docker-compose-validator** | Only if local stack used for E2E |
| **fable-verifier** | Cold re-check of claims vs code |

---

## 6. Security / ops / launch validation checklist

### Security (P0)

- [ ] Fix Guard rewrite on `eu.q-grid.net`  
- [ ] Rate limit `/api/scan` and Guard  
- [ ] Confirm RLS on Neon; no cross-tenant assessment read  
- [ ] Stripe webhook signature verify paths  
- [ ] JWT_SECRET set on Vercel comply (no default secret); no CLERK_* env left  
- [ ] See ADR-2026-07-14-auth-better-auth-vs-harden-jwt.md
- [ ] Remove or auth-wall `/api/diag` if exposes fingerprints  
- [ ] Pen-test or at least automated ZAP on preview  

### Ops (P0)

- [ ] PostHog (or equivalent) live — kill null Analytics  
- [ ] Guard deploy in CI from clean worktree  
- [ ] Status page + on-call owner  
- [ ] Backup/restore drill for Neon  
- [ ] Env inventory: Hedera keys on Vercel if anchors required  

### Launch (P0 for “sellable boat”)

- [ ] CORE-only nav (Scan, Comply, Migrate, Guard) + LABS drawer  
- [ ] Pilot SOW PDF + DPA  
- [ ] One demo script (15 min) with **live scan + one signed artifact**  
- [ ] Pricing page matches Stripe price IDs in Vercel  
- [ ] No Lend/Asset “Request Demo” without calendar or CRM  

---

## 7. Recommended 30-day “unsinkable boat” plan

| Week | Focus | Exit criteria |
|------|-------|---------------|
| **W1** | Fix Guard rewrite; rate limits; PostHog; brand/LABS nav | Client path zero 404s |
| **W2** | Playwright golden path CI; verify endpoint; remove placeholders | CI red on break |
| **W3** | Threat model + key ceremony doc; cryptographer Meet integration | PDF a CISO can read |
| **W4** | Design partner pilot pack; HubSpot scan leads; one paid pilot | LOI or paid pilot |

Do **not** expand Lend/Asset/Pay until W4 exit is green.

---

## 8. Meet summary integration — READY

I am **ready** for the Google Meet summary between the cryptographer and technical implementer.

Please attach:
- Transcript or notes (any format)
- Names/roles if not obvious
- Any whiteboards / links mentioned

I will fold it into:
1. Threat model v0.1  
2. Algorithm / hybrid policy  
3. Guard + stamp verification design  
4. Updated golden-path tests  
5. Explicit “do not build yet” list from their constraints  

---

## 9. Immediate P0 code defects (from this audit)

1. **`eu.q-grid.net/guard/v1/*` rewrite 404** while beryl health is OK  
2. **Analytics stub** — no product analytics  
3. **Assessment results PQC badge placeholder**  
4. **Lend/Asset peer-level marketing** without backends  
5. **Guard root URL docs** must only advertise paths that return 200  
6. **Uncommitted local noise** (`.nvmrc 2`, codemap, tmp scripts) — clean tree hygiene  

---

## Bottom line

**Sell the boat you can sail:** Scan → stamped QRS → Comply evidence → (optional) Migrate pilot.  
**Everything else is drag.**  

Novelty that survives a 1% cryptographer is not more agents — it is **verifiable stamps, honest maturity labels, unbroken rewrites, and a golden path tested every commit.**

**Attach the Meet summary when ready.**
