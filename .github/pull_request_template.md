<!-- Keep PRs focused and reviewable. Delete sections that don't apply. -->

## What & why

<!-- What does this change do, and why is it needed? -->

## How it was verified

<!-- Commands run + result. "Trust me" is not evidence. Paste real output. -->

- [ ] Tests pass (`pnpm test`) / relevant suite:
- [ ] Type-check passes (`pnpm type-check`)
- [ ] `gridera-verify` green (if crypto/evidence touched)

## Security & crypto checklist

- [ ] No secrets, keys, or `.env` values committed
- [ ] No change to signing / anchoring semantics — or, if changed, evidence re-anchored and documented
- [ ] New dependencies reviewed (license + provenance)

## Scope

- [ ] This PR does one thing; unrelated changes are split out
- [ ] Docs / README updated if behavior changed
