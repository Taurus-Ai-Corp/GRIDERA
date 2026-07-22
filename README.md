<p align="center">
  <img src="https://img.shields.io/badge/PQC-ML--DSA--65%20%7C%20ML--KEM--768-blueviolet?style=for-the-badge" alt="PQC Standards" />
    <img src="https://img.shields.io/badge/Hedera-HCS%20Audit%20Trail-00C389?style=for-the-badge&logo=hedera" alt="Hedera" />
      <img src="https://img.shields.io/badge/License-BSL%201.1-blue?style=for-the-badge" alt="License" />
        <img src="https://img.shields.io/badge/TypeScript-83.7%25-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
          <img src="https://img.shields.io/github/actions/workflow/status/Taurus-Ai-Corp/GRIDERA/ci.yml?style=for-the-badge&label=CI" alt="CI Status" />
</p>

<h1 align="center">GRIDERA</h1>

<p align="center">
  <strong>Post-Quantum Compliance Platform — Scan. Comply. Migrate.</strong><br/>
    Enterprise-grade PQC compliance platform with ML-DSA-65/ML-KEM-768 signing, Hedera HCS audit trails, and geo-routed regulatory compliance across NA, EU, IN, and UAE.
</p>

<p align="center">
  <a href="https://eu.q-grid.net">Website</a> · <a href="https://eu.q-grid.net/scan">Free PQC Scan</a> · <a href="#quick-start">Quick Start</a> · <a href="docs/API.md">API Docs</a> · <a href="#enterprise">Enterprise</a>
</p>

---

## Why GRIDERA

NIST finalized post-quantum cryptography standards (FIPS 203/204/205) in August 2024. The EU AI Act mandates compliance by August 2026. Every organization running TLS, signing code, or managing certificates must migrate — but most have zero visibility into their cryptographic posture.

GRIDERA is the first platform that combines automated PQC vulnerability scanning with blockchain-anchored audit trails and multi-jurisdictional regulatory mapping, giving enterprises a single pane of glass for the quantum migration.

## Key Features

**Automated PQC Scanning** — Scan any domain for quantum-vulnerable cryptography. Our Quantum Readiness Score (QRS) algorithm rates infrastructure across key exchange, signatures, certificates, and cipher suites.

**ML-DSA-65 / ML-KEM-768 Signing** — Every assessment, report, and audit event is signed with NIST-approved post-quantum algorithms using `@noble/post-quantum`. Signatures are verifiable and tamper-evident.

**Hedera HCS Audit Trails** — Immutable compliance records anchored to Hedera Consensus Service. Every assessment, status change, and report generation event gets a verifiable `hedera_tx_id`.

**Multi-Jurisdiction Routing** — Single codebase deployed across geographic cells (NA/EU/IN/UAE/CA), each with jurisdiction-specific regulatory rules: EU AI Act, OSFI B-13, CCCS PQC, RBI DPSC, TDRA.

**Product map** — Canonical CORE/LABS taxonomy (pipe brand `GRIDERA|Verb`): [docs/GRIDERA-PRODUCT-TAXONOMY.md](docs/GRIDERA-PRODUCT-TAXONOMY.md).

**Sovereign AI Reports** — AI-generated compliance reports that can run entirely on-premises via Ollama/vLLM/TensorRT-LLM. Data never leaves your infrastructure.

**Six-Section Assessment Wizard** — Guided compliance assessment covering system classification, data governance, risk management, transparency, human oversight, and technical robustness.

## Architecture

```
gridera/
├── apps/
│   ├── landing/          # Marketing site (q-grid.net) — Next.js 16, dark mode
│   └── comply/           # Compliance platform — Next.js 16, first-party JWT auth, Stripe billing
├── packages/
│   ├── pqc-crypto/       # ML-DSA-65 signing, ML-KEM-768 encapsulation, AES-256-GCM
│   ├── pqc-engine/       # SSL scanner, QRS scoring algorithm
│   ├── jurisdiction/     # Geo-detection (NA/EU/IN/AE), regulatory rule configs
│   ├── db/               # Drizzle ORM schema, 11 tables, Neon PostgreSQL
│   ├── hedera/           # HCS audit trail submission, HTS credential management
│   ├── ui/               # Shared brand components, Grid Mesh logo, design tokens
│   └── tsconfig/         # Shared TypeScript configurations
├── sales-engine/         # Lead scoring, outreach automation, competitive intel
├── scripts/              # Platform key initialization, migrations
├── docs/                 # Architecture, API, deployment, and self-hosting guides
└── .github/workflows/    # CI/CD, CodeQL security scanning, release automation
```

```mermaid
graph TB
    subgraph "Client Layer"
        A[q-grid.net Landing] --> B[Free PQC Scan]
        C[eu.q-grid.net] --> D[Dashboard]
        D --> E[Assessment Wizard]
        D --> F[Reports]
        D --> G[Settings / Billing]
    end

    subgraph "Application Layer"
        H[Next.js 16 + proxy.ts]
        I[First-party JWT Auth]
        J[Stripe Billing]
    end

    subgraph "Core Engine"
        K[@taurus/pqc-crypto<br/>ML-DSA-65 · ML-KEM-768]
        L[@taurus/pqc-engine<br/>SSL Scanner · QRS Algorithm]
        M[@taurus/jurisdiction<br/>NA · EU · IN · UAE]
    end

    subgraph "Data Layer"
        N[Neon PostgreSQL<br/>Frankfurt eu-central-1]
        O[Hedera HCS<br/>Audit Trail]
        P[Sovereign AI<br/>Ollama / vLLM]
    end

    B --> L
    E --> K
    E --> M
    F --> P
    H --> I
    H --> J
    K --> N
    K --> O
    L --> K
```

## Quick Start

```bash
# Prerequisites: Node.js >= 20, pnpm >= 9
git clone https://github.com/Taurus-Ai-Corp/GRIDERA.git
cd GRIDERA

# Install dependencies
pnpm install

# Build all packages and apps (8 tasks)
pnpm build

# Run all tests (124+ tests)
pnpm test

# Start the landing site (dark mode, port 3000)
pnpm --filter landing dev

# Start the compliance platform (light mode, port 3000)
# Requires JWT_SECRET + DATABASE_URL in apps/comply/.env.local (see .env.example)
pnpm --filter comply dev
```

## Packages

| Package | Description | Tests |
|---------|------------|-------|
| `@taurus/pqc-crypto` | ML-DSA-65 signing, ML-KEM-768 key encapsulation, AES-256-GCM encryption | 13 |
| `@taurus/pqc-engine` | SSL/TLS scanner, Quantum Readiness Score (QRS) algorithm | 11 |
| `@taurus/jurisdiction` | Geo-detection (NA/EU/IN/AE), regulatory framework configs | 13 |
| `@taurus/db` | Drizzle ORM schema with 11 tables, Neon PostgreSQL connection | — |
| `@taurus/hedera` | Hedera Consensus Service audit trails, HTS credential management | — |
| `@taurus/ui` | Brand components, Grid Mesh logo, design tokens | — |
| `@taurus/tsconfig` | Shared TypeScript base configurations | — |

## Regulatory Coverage

| Jurisdiction | Region | Frameworks | Deployment |
|-------------|--------|-----------|-----------|
| European Union | `eu` | EU AI Act, GDPR, DORA, eIDAS 2.0 | eu.q-grid.net |
| North America | `na` | OSFI B-13, PIPEDA, CCCS PQC, NIST CSF | na.q-grid.net |
| India | `in` | RBI DPSC, IT Act, DPDPA 2023 | in.q-grid.net |
| UAE | `ae` | TDRA, NESA, ADGM | ae.q-grid.net |

## Enterprise

<a name="enterprise"></a>

### Pricing

| Tier | Price | Includes |
|------|-------|----------|
| **Starter** | €399/mo | 5 systems, PQC scanning, basic reports, email support |
| **Growth** | €899/mo | 25 systems, continuous monitoring, AI reports, priority support |
| **Enterprise** | Custom | Unlimited systems, sovereign AI, SSO/SCIM, dedicated CSM, SLA |

### Enterprise Features

**Sovereign AI Deployment** — Run the entire platform on your own infrastructure. AI report generation via self-hosted Nemotron, Mistral, or any OpenAI-compatible endpoint. Zero data egress.

**Org roles + future SSO** — First-party JWT auth today (Neon-resident). Enterprise SAML/OIDC and SCIM are planned via self-hosted Better Auth / BoxyHQ when a design partner requires them — **not** a third-party IdP like Clerk.

**CycloneDX CBOM Generation** — Automated Cryptographic Bill of Materials from your codebase. Integrates with GitHub, GitLab, and Bitbucket for continuous crypto inventory.

**Regulatory Submission Pipeline** — One-click submission to EU AI Database, OSFI reporting portal, and RBI compliance registry.

Contact: [enterprise@taurusai.io](mailto:enterprise@taurusai.io)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mono-repo | Turborepo + pnpm workspaces |
| Framework | Next.js 16 (proxy.ts routing) |
| Language | TypeScript 5.8 (83.7% of codebase) |
| Auth | First-party JWT (`jose`) → Better Auth (planned); Clerk permanently out |
| Database | Neon PostgreSQL v17 (Frankfurt) + Drizzle ORM |
| PQC | @noble/post-quantum (ML-DSA-65, ML-KEM-768) |
| Blockchain | Hedera Consensus Service (HCS) |
| Payments | Stripe (EUR billing, webhooks) |
| AI | Sovereign: Ollama/vLLM — Cloud: AI Gateway |
| Hosting | Vercel (Edge Functions, ISR) |
| CI/CD | GitHub Actions (build, test, CodeQL, SBOM) |

## Security

All artifacts are ML-DSA-65 signed. Every mutation triggers a Hedera HCS audit trail. See our [Security Policy](https://github.com/Taurus-Ai-Corp/.github/blob/main/SECURITY.md) for vulnerability reporting.

Security headers enforced: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security.

Zod validation on all API mutation routes. OWASP-enhanced XSS escaping on all user inputs.

## Contributing

We welcome contributions. Please read our [Contributing Guidelines](https://github.com/Taurus-Ai-Corp/.github/blob/main/CONTRIBUTING.md) and sign the [Contributor License Agreement](https://github.com/Taurus-Ai-Corp/.github/blob/main/CLA.md) before submitting PRs.

## License

This project is licensed under the [Business Source License 1.1](LICENSE) (BSL 1.1). The licensed work is GRIDERA. The licensor is TAURUS AI Corp. The change date is April 1, 2030. On the change date, the license converts to Apache 2.0. Additional use grants are available for evaluation, development, and non-commercial use. Commercial deployment requires a paid license — see [Enterprise](#enterprise).

## Links

| Resource | URL |
|----------|-----|
| Website | [q-grid.net](https://q-grid.net) |
| Free PQC Scan | [q-grid.net/scan](https://q-grid.net/scan) |
| EU Comply Platform | [eu.q-grid.net](https://eu.q-grid.net) |
| Documentation | [docs/](docs/) |
| Security Policy | [SECURITY.md](https://github.com/Taurus-Ai-Corp/.github/blob/main/SECURITY.md) |
| Status | [status.q-grid.net](https://status.q-grid.net) |

---

<p align="center">
  Built by <a href="https://taurusai.io">TAURUS AI Corp</a>a> · Wyoming, USA<br/>
    <sub>Post-quantum compliance infrastructure for the enterprises that can't afford to wait.</sub>sub>
</p>p></sub></strong>

