# gridera-verify

A GitHub Action (and standalone CLI) that **proves a repository's committed
cryptographic evidence is authentic and anchored** — without trusting the CI
logs, the committer, or a private server.

It reads a small `.gridera/` bundle committed to the repo and runs two
independent checks:

| # | Check | How |
|---|-------|-----|
| 1 | **Signature** | The ML-DSA-65 (NIST FIPS 204) signature on the CycloneDX CBOM verifies, via `verifyCBOM()` from `@taurus/pqc-engine`. No crypto is reimplemented here. |
| 1b | **Signer pin** *(optional, `--signer`)* | The signer public key in the bundle matches a **pinned GRIDERA identity** — its full public-key hex, or its SHA-256 fingerprint. Only runs when `--signer` is supplied; **fail-closed** on mismatch. |
| 2 | **Anchor** | SHA-256 of the canonical CBOM equals `anchor.cbomSha256` **and** the Hedera **public mirror-node** message at `(topicId, sequenceNumber)` carries that same SHA-256. |

If any active check fails the action exits non-zero. If all pass it prints a
success line and a [shields.io](https://shields.io/endpoint)-style badge JSON.

> **Signature vs. signer pin.** The signature check proves the CBOM was not
> tampered with *by whoever holds the key in the bundle* — but that key could be
> anyone's. The signer pin proves that key **is GRIDERA's**. Without a pin, a
> valid signature only means "internally consistent," not "signed by us."

---

## The `.gridera/` bundle format

Commit two files to your repo (default directory `.gridera/`):

### `cbom.signed.json` — a `SignedCBOM`
```jsonc
{
  "cbom": { "bomFormat": "CycloneDX", "specVersion": "1.6", "...": "..." },
  "signature": {
    "algorithm": "ML-DSA-65",
    "publicKey": "<hex, 1952 bytes>",
    "value":     "<hex, 3309-byte detached signature>",
    "signedAt":  "2026-07-27T00:00:00.000Z"
  }
}
```
This is exactly the artifact produced by `signCBOM()` in `@taurus/pqc-engine`
(the detached-signature envelope; the signature lives *outside* the BOM so the
BOM still validates against the strict CycloneDX 1.6 schema).

### `anchor.json`
```jsonc
{
  "topicId": "0.0.9551792",
  "sequenceNumber": 7,
  "consensusTimestamp": "1753660800.000000001",
  "cbomSha256": "a4e4698e0e9a347759fee54c663b8399ba40114492cba8112ddef527d1844081"
}
```
`cbomSha256` is the SHA-256 of the **canonical** CBOM (see *Canonicalization*
below). The Hedera Consensus Service message you submitted at that topic +
sequence must contain this hash (base64-encoded on the wire).

A working sample lives in [`fixtures/sample/.gridera/`](./fixtures/sample/.gridera).
Regenerate it with `node scripts/make-fixture.mjs`.

### `signer.json` — the published, pinnable signer identity (optional)
```jsonc
{
  "algorithm": "ML-DSA-65",
  "publicKey": "<hex, 1952 bytes>",
  "fingerprintSha256": "2a2806f6…",   // sha256(publicKeyHex)
  "note": "GRIDERA platform signer identity …"
}
```
Written from the platform **public** key only (no secret) by
`packages/pqc-engine/scripts/publish-signer.ts`. The public key + fingerprint
are safe to commit — publishing them is what lets a third party pin the signer
with `--signer` *before* they ever see a bundle. See *Signer pinning* below.

---

## Usage in a client workflow

`.github/workflows/verify-evidence.yml`:
```yaml
name: verify-crypto-evidence
on: [push, pull_request]

jobs:
  gridera-verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }

      # Make @taurus/pqc-engine + @taurus/pqc-crypto resolvable (see note below).
      - run: npm ci   # or: pnpm i --frozen-lockfile

      - uses: your-org/gridera-verify@v1
        with:
          bundle-dir: .gridera     # optional (default)
          network: testnet         # optional (default) — testnet|mainnet|previewnet
```

### Badge
On success the CLI prints a shields.io endpoint payload:
```json
{"schemaVersion":1,"label":"gridera-verify","message":"passing","color":"brightgreen"}
```
Serve it as a static endpoint and point a badge at it:
```
![crypto evidence](https://img.shields.io/endpoint?url=https://<you>/gridera-verify.json)
```

---

## CLI

```bash
node src/verify.mjs --bundle-dir .gridera --network testnet
# pin the signer to GRIDERA's published identity (fingerprint form):
node src/verify.mjs --bundle-dir .gridera --network testnet \
  --signer sha256:2a2806f674f00719d17b646c2d68c3f291f5e307a2860cff21d490bb1a45cbeb
# the full public-key hex is also accepted as --signer.
# convenience:
npm run verify:sample     # runs against the committed fixture
```
Exit code `0` = all active checks pass, non-zero = failure.

---

## Signer pinning (`--signer`)

`--signer <value>` adds an identity assertion on top of the signature check.
`<value>` is **either**:

- the full ML-DSA-65 public-key hex (3904 chars), **or**
- its SHA-256 fingerprint (64 hex chars), optionally `sha256:`-prefixed.

The published identity lives in [`.gridera/signer.json`](../../.gridera/signer.json)
(`fingerprintSha256`). The matcher is **fail-closed**: a bundle with no signer,
a missing pin, or a pin of unrecognized shape → mismatch, never a silent pass.
The comparison is constant-time.

Regenerate the identity file after a key rotation:
```bash
tsx packages/pqc-engine/scripts/publish-signer.ts   # reads PLATFORM_PQC_PUBLIC_KEY
```

---

## Canonicalization (important)

The anchored hash is:

```
cbomSha256 = SHA-256( utf8( JSON.stringify(signed.cbom) ) )
```

computed with `hashPayload()` from `@taurus/pqc-crypto`. This is deliberately
the **same byte sequence the ML-DSA-65 signature covers** — `@taurus/pqc-engine`
signs `new TextEncoder().encode(JSON.stringify(cbom))` (its private
`canonicalBytes`, which is a plain compact `JSON.stringify`, no key sorting, no
indentation). Binding the anchor to those exact bytes means the signature and
the anchor attest to *one* identical representation.

> **Divergence from the pilot-0 evidence script.** `packages/pqc-engine/scripts/pilot0-resign.ts`
> anchors `sha256(JSON.stringify(cbom, null, 2))` — the **pretty-printed file**
> bytes, which differ from the bytes the signature covers. gridera-verify uses
> the compact/canonical form on purpose. If you are verifying a bundle produced
> by that pilot-0 script, regenerate `anchor.cbomSha256` with this tool's
> `computeCbomSha256()` (or `make-fixture.mjs`) so signature and anchor agree.

`@taurus/pqc-engine` does **not** export `canonicalBytes`, so this tool
replicates the exact canonical form via the exported `hashPayload` — it does not
re-implement JSON canonicalization or hashing independently.

---

## v1 scope vs. deferred

**In v1 (this release):**
- ML-DSA-65 CBOM signature verification (delegated to `@taurus/pqc-engine`).
- Optional **`--signer` pin** — assert the bundle signer is GRIDERA's published identity (fail-closed).
- Local `cbomSha256` recomputation + equality with `anchor.json`.
- Live Hedera **public mirror-node** resolution (injectable fetch → offline-testable).
- Non-zero exit + clear message on any failure; badge JSON on success.

**Deferred (NOT in v1):**
- **`--drift`** — recomputing the CBOM from the current HEAD and diffing it
  against the committed one. This needs the live TLS **scanner**
  (`scanDomain` in `@taurus/pqc-engine`) plus network egress to the target,
  which is out of scope for an offline evidence verifier. The flag is accepted
  and prints a clear *DEFERRED* notice, then runs the signature + anchor checks
  only. It never silently passes.

---

## Using this in an external repo

`src/verify.mjs` imports `@taurus/pqc-engine` and `@taurus/pqc-crypto` by their
real package names. Inside this monorepo they resolve as workspace packages;
**in an external repo those two packages must be published to a registry or
vendored** and installed before the action's `node` step runs. They are
currently `"private": true` workspace packages — publishing/vendoring them is a
prerequisite that ships separately from this action.

---

## Test runner note

The suite is `verify.test.mjs`, run with Node's built-in test runner:

```bash
node --test verify.test.mjs
```

vitest was the nominal ask, but this tool directory lives **outside** the pnpm
workspace globs (`apps/*`, `packages/*`), so it has no vitest of its own and no
Vite dep-resolution config. `node:test` resolves the `@taurus/*` workspace
`dist` builds through the local `node_modules/@taurus/*` symlinks with zero
configuration. The test API (`test()` + `assert`) ports to vitest verbatim
(`test`/`it` + `expect`) if the dir is later folded into the workspace.
```

Seven cases: **(a)** happy path (real ML-DSA-65 round-trip + stubbed
mirror-node match → pass), **(b)** tampered CBOM (`verifyCBOM` false → fail),
**(c)** anchor mismatch (stub mirror returns the wrong hash → fail),
**(d)** signer pin via full public-key hex (match → pass), **(e)** signer pin
via SHA-256 fingerprint (match → pass), **(f)** signer pin mismatch (valid
signature but wrong identity → fail), **(g)** `signerMatches` fail-closed on
empty/garbage input.
