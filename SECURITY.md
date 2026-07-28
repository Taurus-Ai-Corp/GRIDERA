# Security Policy

GRIDERA is post-quantum security tooling. We hold our own codebase to the standard we assess others against.

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Report privately via one of:

- **GitHub Private Vulnerability Reporting** — the "Report a vulnerability" button under this repo's **Security** tab (preferred).
- **Email** — `admin@taurusai.io` with subject `SECURITY: <short description>`.

Please include: affected component/path, version or commit hash, reproduction steps, and impact. If you have a suggested fix, include it.

### Our commitment

| Stage | Target |
|---|---|
| Acknowledgement | within 3 business days |
| Initial assessment | within 10 business days |
| Fix or mitigation plan | severity-dependent, communicated in the assessment |
| Coordinated disclosure | after a fix ships, credit to the reporter unless anonymity is requested |

We do not currently run a paid bug bounty. We do credit reporters.

## Scope

In scope — anything that affects the integrity of GRIDERA's cryptographic assurance:

- `packages/pqc-crypto` — ML-DSA-65 signing, ML-KEM-768, key encryption
- `packages/pqc-engine` — scanner, QRS scoring, CBOM generation/signing/verification
- `packages/hedera` — HCS anchoring
- `packages/guard` — LLM guardrails
- `tools/gridera-verify` — the CI verification action
- `apps/comply`, `apps/landing`

Out of scope: third-party dependencies (report upstream), social engineering, denial-of-service via volumetric traffic, and findings that require a compromised developer machine.

## Cryptographic posture

- Signatures: **ML-DSA-65 (FIPS 204)**. Key encapsulation: **ML-KEM-768 (FIPS 203)**.
- Evidence integrity: signed artifacts are anchored to **Hedera HCS**; anchors are independently verifiable via the public mirror node (see `tools/gridera-verify`).
- Never commit secrets. Secret scanning (GitGuardian) runs on every push.

## Supported

Security fixes target the `main` branch. There are no long-term-support branches at this time.
