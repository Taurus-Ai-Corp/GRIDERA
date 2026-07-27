# Skills → GRIDERA fit: overlaps, gaps, and one direct conflict

**Date**: 2026-07-26
**Method**: every skill resolved on disk; every platform claim re-derived from the repo or a live endpoint today. Nothing here is quoted from `CLAUDE.md` summaries without checking the underlying artifact.

---

## 1. Availability — verified, not assumed

| Skill | Resolves | Note |
|---|---|---|
| `fable-mode` | ✅ | `~/.claude/skills/` |
| `compliance-regtech` | ✅ | KYC/AML, GDPR, SOC2, MiCA, audit trails |
| `deeptech-research` | ✅ | PQC, ZK, distributed systems |
| `launch-ops` | ✅ | Launch checklists, pricing, PH playbook |
| `proposal-generation` | ✅ | Agent-backed, cites ≥3 sources/claim |
| `map-your-market` | ✅ | Reddit, HN, GitHub Issues, G2 |
| `last30days` | ✅ | Reddit, X, YouTube, TikTok, HN — 30-day window |
| `marketing-automation` | ✅ | SEO, email, social, landing pages |
| `higgsfield-generate` | ✅ | Also `-marketplace-cards`, `-product-photoshoot`, `-websites`, `-video-explainer`, `-soul-id`, `-game-generation` |
| `sumup:sumup-best-practices` | ✅ | Plugin — see §4, it conflicts with a standing decision |
| `railway:use-railway` | ✅ | Plugin |
| `/iq` | ✅ | Command, not a skill: `HEDERA/.claude/commands/iq.md` |
| **`high-end-visual-design`** | ❌ | **No such skill.** Nearest: `luxury-brand-design`, `frontend-design`, `superdesign-website`, `nexus-design-system` |

---

## 2. Overlaps — where two skills bill for the same work

Overlap is not automatically waste. It is waste when you run both and get one answer twice.

### 2a. `map-your-market` × `last30days` — heavy, ~60%

Both mine Reddit and Hacker News for what people say.

- `map-your-market` adds **G2 and GitHub Issues**, and frames output as ICP pain points — better for *positioning*.
- `last30days` adds **X, YouTube, TikTok** and a hard 30-day recency bound — better for *timing*.

**Rule**: `map-your-market` once per positioning cycle (quarterly). `last30days` only when recency is the question ("is PQC procurement heating up *now*"). Running both on the same query pays twice for the Reddit/HN pass.

### 2b. `launch-ops` × `marketing-automation` — moderate, ~40%

Both claim content strategy and campaigns. The clean split is temporal:

- `launch-ops` = the **launch moment** (checklist, pricing, Product Hunt, press kit)
- `marketing-automation` = the **steady state** (SEO, email sequences, ongoing social)

GRIDERA|Comply already launched. Guard has not. So `launch-ops` applies to Guard, `marketing-automation` to Comply. Applying both to the same product produces two competing content calendars — which is arguably what the 2026-07-25 cron already did.

### 2c. `launch-ops` × `proposal-generation` — narrow, on pricing

Both produce pricing. `launch-ops` sets **list price** (public, one-to-many). `proposal-generation` sets **deal price** (per-buyer, research-backed). They must not disagree in public. `00-SELLABLE-PRODUCTS.md` is the list price; proposals derive from it.

### 2d. `compliance-regtech` × `deeptech-research` — narrow but important to get right

They meet at "PQC + regulation," and the distinction is who the output is for:

- `compliance-regtech` = the frameworks GRIDERA|Comply **sells against** (EU AI Act, DORA, MiCA). Customer-facing.
- `deeptech-research` = the cryptography GRIDERA **is built from** (ML-DSA, ML-KEM, CycloneDX). Engineering-facing.

Using `deeptech-research` to answer a customer's compliance question produces a technically correct answer to a question they did not ask.

### 2e. The three higgsfield commercial-image skills

`-generate`, `-marketplace-cards`, `-product-photoshoot` all emit brand imagery. `-product-photoshoot` routes through a backend prompt enhancer and is the highest-fidelity for anything with a product in frame; `-generate` is raw text-to-image. Default to `-product-photoshoot` for GRIDERA assets; reach for `-generate` only when there is no product and no brand context.

### 2f. `fable-mode` × the superpowers process skills

`fable-mode` encodes stage-mapping, delegation and failable verification. `verification-before-completion` already enforces the verification half. **Overlap is near-total on verification**; `fable-mode`'s unique contribution is *enforced delegation* — an orchestrator with no Write tool, so it physically cannot do the work itself.

For a 2-agent job, that machinery costs more than it returns. `fable-mode` earns its keep at 5+ parallel lanes.

---

## 3. Gaps — real GRIDERA needs no listed skill covers

### Gap 1 — Nothing checks whether CI tells the truth. **This is the big one.**

Today's finding: `pnpm test` runs `turbo run test`, and **turbo silently skips any package with no `test` script** — no error, no warning, no output.

Counted carefully (an earlier pass in this session got this wrong twice, first by counting test files only under `src/` when the convention is `tests/`, then by treating untracked residue directories as real packages):

| | Count | Which |
|---|---|---|
| Real packages (tracked, has `src/` + `package.json`) | 9 | `db`, `guard`, `hedera`, `jurisdiction`, `mcp`, `pqc-crypto`, `pqc-engine`, `ui`, `use-cases` |
| Phantom dirs (**0 git-tracked files**) | 3 | `ai-assistant`, `auth`, `pqc-ca` |
| Missing `test` script after today's work | **3** | `mcp`, `ui`, `use-cases` |

So CI was reporting on packages it never ran, but the blast radius is three packages, not nine. The mechanism is the serious part; the count is smaller than first stated.

No skill in the list — not `fable-mode`, not `deeptech-research` — would surface this, because they all assume the test suite means something.

Related and unmeasured: **there are zero E2E tests.** No Playwright config, no `.spec.ts` anywhere. Every user-visible flow is unverified except by the four network checks in `funnel-smoke.ts`.

**Fill with**: a standing repo-integrity check, not a skill. Assert that every `packages/*` with a `src/` has a `test` script. Ten lines in CI.

### Gap 2 — Nothing validates price against willingness to pay

`launch-ops` sets prices from strategy. `proposal-generation` justifies them with market research. `pricing-finder` (not on the list) benchmarks competitors. **None of them tests a price against a human who might pay it.**

With $0 revenue and a 9-month runway, this is the only gap that is existential rather than annoying.

**Fill with**: not a skill. Three priced conversations.

### Gap 3 — The list is artifact-heavy and conversion-light

Every listed skill emits an artifact: research, images, copy, proposals, decks. None advances a deal. `sales-ops` (pipeline analysis, deal scoring, forecasting) exists in `HEDERA/skills/` and is **absent from the list.**

Given `feedback_stop_building.md` — *no new features until one paying customer* — a skill list with no sales-execution skill is aimed slightly to the left of the actual problem.

### Gap 4 — No skill owns the local↔CI divergence

26 files matching `* 2.*` exist in the working tree. **All 26 are untracked** — so CI and fresh clones are clean, which is the reassuring half. The unreassuring half is `packages/db/src/resolve 2.ts`, byte-identical to `resolve.ts` and sitting inside `src/`, where a glob-based local build may compile a module CI never sees. Consistent with a sync-tool conflict-copy pattern (`Documents/` is a sync root), and matching commit `e2e7956` "remove accidental duplicate ca config file."

Separately: **`packages/pqc-ca/` has zero git-tracked files.** No `package.json`, no `src/`, only stale `dist/` whose turbo log still references the directory path used before the rename to `gridera-platform`. It exists on this machine and nowhere else. Any plan that treats `@taurus/pqc-ca` as the identity-binding component is planning against something that is not in the repository.

**Fill with**: `.gitignore` entry for `* 2.*`, and a decision on whether `pqc-ca` is resurrected or deleted.

---

## 4. Conflict — `sumup:sumup-best-practices` reverses a standing decision

This is not an overlap. It is a contradiction.

**Decision on record (2026-07-17, `payments_no_stripe_oss_stack.md`)**: Stripe was rejected. The chosen stack is self-hosted and open-source — **Hyperswitch** (fiat, on OCI free tier), **Hedera HTS/HCS**, **x402** for native PQC-signed receipts, **Lago** for billing. Full rationale in `docs/payments-open-source-stack.md`.

SumUp is a hosted card acquirer — the same architectural category as Stripe, which was rejected on the grounds of self-hosting and sovereignty. Adopting `sumup-best-practices` would quietly reverse that, and it would do so inside a product whose entire pitch is data sovereignty and independently verifiable receipts.

**Recommendation**: do not run it against GRIDERA billing. If the decision has genuinely changed, change it explicitly and update the memory record first — don't let a skill invocation become the decision.

**`railway:use-railway`** is a milder version of the same shape. GRIDERA is on Vercel (confirmed: `server: Vercel` on `q-grid.net`), and the sovereignty plan puts self-hosted components on **OCI free tier**. Railway is a third deployment target competing with both. It fits only if you are actually migrating off Vercel — otherwise it adds a platform without retiring one.

---

## 5. Recommended sequence

Ordered by what unblocks what, not by interest.

**Now — repo integrity (no skill needed)**
1. `funnel-smoke.yml` Node 20 → 24 ✅ done
2. KEX regression assertion ✅ done, red-green verified
3. Add `test` scripts to the 9 skipped packages — in flight for `hedera` and `db`
4. CI assertion that every package with `src/` has a `test` script
5. `.gitignore` for `* 2.*`; decide `pqc-ca`'s fate

**Then — evidence the buyer audits**
6. `deeptech-research` — only on the ML-DSA/ML-KEM claims that appear in customer-facing copy
7. `compliance-regtech` — map CBOM output to DORA/EU AI Act articles, which is what turns a scan into a deliverable

**Then — demand, once the evidence holds**
8. `map-your-market` — once, for positioning against QorTrace/QorBOM
9. `proposal-generation` — top 3 names in `pqc-leads/`, priced from `00-SELLABLE-PRODUCTS.md`
10. `launch-ops` — GRIDERA|Guard only. Comply already launched.

**Last — amplification, only after something converts**
11. `marketing-automation`, `higgsfield-*`, `last30days`

**Do not run**: `sumup-best-practices` (§4). **Defer**: `railway:use-railway`, `fable-mode` (below its useful scale at 2 agents).

---

## 6. The honest summary

The skill list is well-stocked for **telling GRIDERA's story** and thin for **proving it and selling it**. Nine of the thirteen listed skills produce marketing or research artifacts. The two findings that actually moved risk today — CI reporting on packages it never tested, and a package that exists only on one laptop — came from reading the repository, and no skill on the list would have found either.

That is the real gap. It is not a missing skill; it is that skills operate on what you tell them is true.
