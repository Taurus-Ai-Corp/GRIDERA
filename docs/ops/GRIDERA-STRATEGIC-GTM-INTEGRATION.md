# GRIDERA Strategic GTM Integration

**Date:** 2026-07-14  
**Audience:** Enterprise CISO / CTO / Head of Risk / Board technology risk  
**Sources:** Live `apps/landing` product surface · GRIDERA Research PRD · Software-Defined Quantum Compliance deck · last30days (HN/GitHub/YT, Reddit 403, X not unlocked) · web CBOM market pulse  

Domains stay **q-grid.net** / **eu.q-grid.net**. Brand: **GRIDERA|by Taurus AI** — *a Quantum Grid Infra for PQC*. <!-- brand-allow: uses pipe form but guard parsing misreads "by" as verb -->

---

## 1. Latest platform structure (confirmed live)

Source of truth: `apps/landing/src/components/platform-products.tsx`  
Headline: **"The GRIDERA Platform — Six products. One post-quantum compliance fabric."**

| # | Product | Live path | Role in funnel | Enterprise buyer job |
|---|---------|-----------|----------------|----------------------|
| 1 | **GRIDERA\|Guard** | `/guard` | Control plane for AI | Sign every LLM call (ML-DSA-65); EU AI Act / NIST AI RMF packs; HCS anchor |
| 2 | **GRIDERA\|Scan** | `/scan` | **HOOK (free)** | First-minute quantum posture; TLS/cert algorithm gaps; QRS baseline |
| 3 | **GRIDERA\|Migrate** | `/migrate` | Expansion / $50K–$500K+ | RefAgent swarms → NIST PRs; hybrid rollout; evidence pack |
| 4 | **GRIDERA\|Comply** | `/comply` · **eu.q-grid.net** | **LAND (SaaS)** | QREP / CBOM / harvest-window exposure; continuous compliance |
| 5 | **GRIDERA\|Lend** | `/lend` | LABS vertical | MSME lending + quantum-safe KYC/scoring (emerging markets) |
| 6 | **GRIDERA\|Asset** | `/asset` | LABS vertical | Institutional custody / token lifecycle / policy engine |

### Revenue journey (deck + PRD aligned)

```
FREE Scan (<1 min)  →  Comply SaaS ($399/mo → $6–24K/yr)
                    →  Migrate pilot / license ($50K–$250K+ → $1.2M ARR design partner)
                    →  Certify / continuous evidence (usage)
```

**Structure PDF** (`GRIDERA final Structure.pdf`) is image-only (jsPDF, no extractable text). Treat **live product grid + investor deck layers** as canonical until a text structure export exists.

**Deck architecture (positioning PDF):** L1 Hedera HCS · L2 hybrid signature mesh · L3 RefAgent swarm · L4 autonomous orchestration / MCP.

**Tier language (memory/PDF):** CORE = Scan, Comply, Migrate (+ Guard on landing) · LABS = Lend, Asset, Pay, Certify · VISION = Intelligence, Ops.

---

## 2. Enterprise fear → product answer matrix

Every row is a gap enterprises feel when shopping for **compliance + migration**. Messaging must answer the fear *before* the feature list.

| # | Fear / gap (buyer language) | Persona | GRIDERA answer | Product surface | Proof asset to cite |
|---|----------------------------|---------|----------------|-----------------|---------------------|
| F1 | "We'll still be on RSA when CRQC arrives; traffic is already being harvested." | CISO | HNDL + **HNFL** (forge later on agent identity) framed as *today's* liability | Scan → Comply harvest-window | Positioning deck problem slide; blog HNDL; PRD §2 |
| F2 | "HSMs are $50–250K and 6–18 months. Board will not fund that before the deadline." | CTO / CFO | **18-month HSM trap vs &lt;1 hour software-defined deploy**; $399/mo entry | Comply, Migrate | Deck secret sauce + differentiators.tsx |
| F3 | "We don't even know where crypto lives." | CISO / Architect | First-minute domain scan + estate inventory + **CycloneDX CBOM** | Scan, Comply | PRD user stories; market CBOM demand (OWASP CycloneDX, NIST SP 1800-38B) |
| F4 | "PQC migration will break CI/CD and take years of engineers." | DevOps / CTO | RefAgent Planner→Generator→Compiler→Tester; **25.3% → 90%** unit-test pass lift; signed PRs | Migrate + MP4s | PRD RefAgent; self-heal + swarm videos |
| F5 | "Regulators want immutable logs for AI (EU AI Act Aug 2026)." | Auditor / CISO | ML-DSA-65 birth/death certs + HCS anchors; Art. 12/15 evidence | Guard, Comply | PRD §8–9; deck EU AI Act row |
| F6 | "NHIs outnumber humans 80:1–144:1 with no accountable owner." | CISO | Named human ownership + OBO tokens + agent lifecycle on Sparkplug B model | Guard, Comply | PRD NHI gap |
| F7 | "We need PQC now but algorithms keep changing (ML-DSA debate)." | Architect | Hybrid mesh; crypto-agility; **ship ML-DSA now** (don't wait for "better" signatures) | Migrate, Comply | last30days: Cloudflare "We cannot wait for better PQC signatures" (HN Jul 2026) |
| F8 | "CBOM without threat context is shelfware." | CISO | CBOM **plus** QRS + financial harvest-window exposure (not inventory alone) | Scan + Comply | Web: HorizenLabs / postquantum.com CBOM framing (2026) |
| F9 | "Vendors sell tools; we need a 12-week path to a case study." | Head of Risk | Fixed-scope pilot: Week 1 QRS → W4 read-only swarm → W8 sandbox re-sign → W12 evidence + convert | Migrate pilot | Deck slide 10 pilot framework |
| F10 | "Carbon / sustainability scrutiny on new crypto." | ESG / CTO | 0.00017 kWh / HCS msg; ML-DSA energy claims vs RSA | Comply audit narrative | PRD sustainability bullet |

---

## 3. Important Docs → surface mapping (strategic integration)

| Document | What it owns | Integrate into | Do not dump |
|----------|--------------|----------------|-------------|
| **GRIDERA Platform · Software-Defined Quantum Compliance…pdf** | HNDL/HNFL, 80% legacy, $250K/18mo trap, 3 pillars, 4-layer fabric, $399 vs pilot, regulatory egg-timer, traction metrics | Home hero subhead + differentiators + competitive table framing + `/migrate` economics | Full 10-slide deck on landing |
| **GRIDERA-Research-PRD.md** | Personas, user stories, RefAgent NFRs, CBOM/QRS, birth certificates, pilot DoD | "Built for your role" section (CISO/DevOps/Auditor); FAQ; sales one-pager | Open questions (air-gap ZK) as product claims |
| **How_the_RefAgent_Swarm_Self-Heals_Code.mp4** | Self-healing migration story | `/migrate` hero or mid-page embed; LinkedIn/X cutdowns | Silent autoplay without captions |
| **How_AI_Swarms_Fix_Quantum_Vulnerabilities.mp4** | Swarm fixes vulns | `/migrate` + home proof strip; PH/social | Technical jargon without CTA |
| **Autonomous_Quantum_Compliance.pdf** | Deep research backing | NotebookLM "GRIDERA — Platform" notebook; sales FAQ citations | Raw PDF on marketing site |
| **Architecting_for_Stability.pdf** | Stability / architecture rationale | Same NotebookLM; CTO deep-dive appendix | Landing body copy |
| **GRIDERA final Structure.pdf** | Taxonomy visual (image) | Design reference for product hierarchy diagrams | Text claims until OCR/export |
| **(1) duplicate positioning PDF** | Same as primary deck | Prefer single canonical file | Dual citations |

### Video placement (highest GTM impact)

1. **`/migrate`** — both MP4s under "How the swarm works" (self-heal first, then quantum vulns).  
2. **Home** — 15–30s silent loop or poster frames linking to migrate.  
3. **Sales room / LOI pack** — full length with PRD DoD checklist.

---

## 4. last30days pulse (2026-06-14 → 2026-07-14)

**Engine:** last30days v3 · topic `post-quantum cryptography migration enterprise compliance`  
**Coverage note:** Reddit API 403 · X not unlocked · YT thin · **HN + GitHub strongest**.

### What I learned (synthesis for GTM)

**ML-DSA is "good enough now," not "wait for better"** - Practitioner discourse (e.g. Cloudflare blog on HN: *We cannot wait for better post-quantum signature algorithms*) rejects delay. GRIDERA messaging must **normalize ML-DSA-65 as the ship standard**, not experimental.

**National / federal framing is heating** - White House-class crypto security actions and RFC/engineering guides (RFC 9958 PQC for engineers, OpenPGP PQC RFCs) keep PQC in the "policy + engineering" dual track. Use **CNSA 2.0 Jan 2027 + SWIFT CSP 2027** as board slides, not research trivia.

**CBOM is the discovery language buyers already hear** - GitHub + market content treat CycloneDX CBOM as the inventory primitive for quantum readiness. Position Scan/Comply as **QRS + CBOM + exposure dollars**, not "another scanner."

**Implementation curiosity is high; enterprise packaging is scarce** - Scratch Kyber tutorials and open issues show builders experimenting. GRIDERA's wedge is **enterprise packaging** (evidence pack, pilot, HCS audit) around the same primitives.

KEY PATTERNS from the research:
1. Ship now vs wait for perfect PQC - per Cloudflare / HN cluster  
2. Standards + RFCs normalizing engineer-facing PQC - per RFC 9958 / OpenPGP PQC  
3. CBOM as inventory lingua franca - per CycloneDX / market posts  
4. Social (Reddit/X) dark - re-run when Reddit/X auth fixed for CISO community voice  

---
✅ All agents reported back!  
├─ 🔴 YouTube: 2 videos │ 73 views  
├─ 🟡 HN: 13 stories │ 92 points │ 16 comments  
├─ 🐙 GitHub: 14 items │ 8 reactions │ 33 comments  
└─ 📎 Raw: `~/Documents/Last30Days/post-quantum-cryptography-migration-enterprise-compliance-raw-v3.md`  
---

---

## 5. Highest-impact GTM hooks (copy-ready)

### CISO (risk / board)

> **80% of your stack still rides 2034-expiry crypto.** Adversaries are harvesting traffic *and* forging paths against agent identity. GRIDERA gives you a Quantum Readiness Score, CycloneDX CBOM, and regulator-ready evidence - without a $250K HSM queue.

CTA: Free scan → QREP on eu.q-grid.net  

### CTO (delivery / cost)

> **Replace the 18-month HSM trap with software-defined PQC.** RefAgent swarms open NIST-compliant PRs, self-heal to ~90% unit-test pass rates, and anchor every transition on Hedera HCS. Deploy posture in under an hour; pilot a real service in 12 weeks.

CTA: `/migrate` + swarm videos  

### DevOps

> **No dependency-hell heroics.** Ephemeral agents spawn, inventory RSA/ECDSA, refactor, certify birth/death, and die - so nothing leaks sideways into your cluster.

CTA: Guard API + migrate sandbox  

### Auditor

> **Mutable SIEM is not Art. 15.** Every compliance event is ML-DSA-65 signed and HCS-anchored at ~$0.0001/msg - independent verification, six-month retention ready.

CTA: Comply evidence pack  

### Revenue hooks

| Hook | Offer | Convert to |
|------|-------|------------|
| Free scan campaign | Domain QRS in &lt;1 min | Comply trial $399/mo |
| "CBOM + exposure" webinar | Live scan of volunteer domain | Pilot LOI |
| RefAgent demo (MP4 + sandbox) | One non-critical service re-sign | $250K+ enterprise |
| EU AI Act Aug 2026 countdown | Art. 15 logging pack | Guard + Comply |

---

## 6. Landing implementation backlog (priority)

| P | Change | File / area | Fear IDs |
|---|--------|-------------|----------|
| P0 | Home "Enterprise narrative" strip: HNDL+HNFL, 80%, $250K trap, egg-timer | new section or `differentiators.tsx` expand | F1 F2 F7 |
| P0 | "Built for your role" 3 cards (CISO / DevOps / Auditor) | new component on `page.tsx` | F3 F5 F6 |
| P0 | Embed both MP4s on `/migrate` | `apps/landing/src/app/migrate/page.tsx` | F4 |
| P1 | FAQ from PRD objections + CBOM myth ("inventory without exposure is incomplete") | `/pricing` or home | F8 |
| P1 | Pilot 12-week stepper (deck slide 10) | `/migrate` | F9 |
| P1 | Social proof metrics strip only if verified weekly (8 engines, &lt;1min scan, 240+ scans) | `proof-bar.tsx` | — |
| P2 | NotebookLM notebook "GRIDERA — Platform" ingest Autonomous + Architecting + PRD | ops | sales enablement |
| P2 | Re-run last30days with X + Reddit unlocked | research | fresher fear language |

**Do not:** rebrand domains; claim gridera.net; invent metrics not in deck/PRD; present Lend/Asset as CORE maturity.

---

## 7. Funnel → strategic revenue

```
Attention   →  HNDL/HNFL + deadline egg-timer (home, LinkedIn, scan ads)
Interest    →  Free Scan (QRS) + competitive table vs HSM vendors
Desire      →  Role section + RefAgent videos + pilot stepper
Action      →  Comply trial | Migrate inquire | Pilot call (admin@taurusai.io)
Expand      →  Design partner $1.2M ARR path (18 mo) · Seed narrative Q1 2027
```

**Unit economics (deck):** Self-service $399/mo · Enterprise $250K+ · Pilot fixed-scope · Target $1.2M ARR / design partner.

---

## 8. Gaps still open (honest)

1. Structure PDF not text-extractable - export text/SVG hierarchy.  
2. Autonomous + Architecting PDFs need NotebookLM ingest (binary-heavy).  
3. last30days missing Reddit/X - CISO forum language incomplete.  
4. Landing not yet fully carrying deck fear architecture (P0 backlog above).  
5. Lend/Asset must stay LABS in enterprise pitches to CORE buyers (Comply/Migrate).

---

## 9. Next execution (when approved)

1. Ship P0 landing sections + migrate video embeds (feature branch).  
2. NotebookLM ingest of deep PDFs for sales FAQ.  
3. Unlock X cookies / Reddit and re-run last30days.  
4. Align sales LOI template with 12-week pilot DoD from PRD.
