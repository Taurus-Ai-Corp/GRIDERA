# Contributing to GRIDERA

Thanks for your interest. GRIDERA is post-quantum compliance and cryptographic-assurance tooling; contributions are held to a security-first bar.

## Ground rules

- **Never commit secrets.** Use `.env` (gitignored). Secret scanning runs on every push.
- **Evidence integrity is sacred.** Changes to signing (`packages/pqc-crypto`), CBOM (`packages/pqc-engine`), or anchoring (`packages/hedera`) require extra review and, where relevant, re-anchored evidence.
- **No "trust me" claims.** PRs must show real command output for verification, not assertions.

## Development

Prerequisites: Node 24.x, pnpm.

```bash
pnpm install
pnpm build          # builds all workspace packages
pnpm type-check
pnpm test
```

The `gridera-verify` CI action self-tests on every push and pull request:

```bash
cd tools/gridera-verify && node --test verify.test.mjs
```

## Workflow

1. Branch from `main` (`feat/…`, `fix/…`, `chore/…`).
2. Keep each PR focused on one change.
3. Ensure `pnpm test`, `pnpm type-check`, and required CI checks pass.
4. Open a PR against `main`. A code owner review and green required checks are needed to merge (branch protection is enforced).
5. Fill in the PR template, including the security checklist.

## Commit messages

Conventional-commit style (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`). Reference issues where relevant.

## Reporting security issues

Do **not** open a public issue. See [SECURITY.md](SECURITY.md).
