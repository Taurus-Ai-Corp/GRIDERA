# ADR: Auth path after Clerk removal — Harden JWT vs Better Auth

| Field | Value |
|-------|--------|
| **Status** | **Accepted** · Harden JWT P0 implemented 2026-07-14 |
| **Date** | 2026-07-14 |
| **Deciders** | TAURUS AI Corp (GRIDERA ops) |
| **Context** | Clerk removed from code 2026-06-24 (`afac35e`). Residual docs/env still said Clerk. Product sells multi-geo PQC / EU AI Act compliance — third-party US IdP is a sub-processor liability. |

---

## Decision

1. **Clerk is permanently out of scope.** Do not reinstall `@clerk/*`. Do not re-add Clerk as a sub-processor on privacy pages.
2. **Near term (now → first design partner):** **Harden the existing first-party JWT stack** in `apps/comply/src/lib/auth.ts` (P0 security fixes below).
3. **Next auth platform (before enterprise SSO deals):** **Better Auth** on Neon (same DB residency as Comply), replacing DIY session surface.
4. **SAML/SCIM:** Only when a signed deal requires it — BoxyHQ / SSOReady / or Better Auth enterprise plugins — **not** Clerk.

---

## Current state (facts)

| Item | Reality |
|------|---------|
| Package | `jose` only — no `@clerk/nextjs` |
| Session | HTTP-only cookie `gridera_auth`, HS256 JWT, 7d |
| APIs | `/api/auth/signup`, `signin`, `me` (+ signout if present) |
| Password hash | **SHA-256 in app code** with comment “demo — use bcrypt” — **not production-grade** |
| JWT secret | Falls back to hardcoded `dev-secret-change-in-production-…` if `JWT_SECRET` unset — **critical** |
| Schema | `users.clerk_id` still exists (legacy optional column) |
| Vercel | Dead `CLERK_*` keys may still exist on project `comply` |

---

## Options compared

### A — Harden DIY JWT (current code)

**Pros**
- Zero new dependency surface
- Full data residency (Neon only)
- Already integrated across Comply API routes
- Fastest path to “no Clerk” honesty

**Cons**
- You own MFA, email verification, OAuth, lockout, password reset, bot protection
- Easy to leave crypto footguns (already present: SHA-256, default secret)
- No enterprise SSO without another project later

**Effort:** 1–3 days for P0 harden; weeks for MFA+SSO feature parity.

### B — Better Auth (recommended platform)

**Pros**
- Open source, self-hosted, sessions/users in **your** Postgres
- Plugins: email/password, OAuth, 2FA, orgs — without US IdP as identity store
- Aligns with “sovereign compliance” story better than Clerk
- Active ecosystem for Next.js App Router

**Cons**
- Migration from DIY JWT (cookie name, user table mapping)
- Team must learn plugin config and keep it updated
- SAML still may need an add-on for bank-grade SSO

**Effort:** ~1 week careful migration + tests for Comply.

### C — Auth.js (NextAuth) + DB adapter

**Pros**
- Mature, widely documented
- Flexible providers

**Cons**
- Config sprawl; security depends heavily on correct adapter + cookie settings
- Overlap with Better Auth for this stack without clear win

### D — Keycloak / Authentik / Zitadel

**Pros**
- Full IdP, audit, SAML out of the box

**Cons**
- Ops burden (HA, upgrades, backup) not justified pre-revenue
- Overkill until multi-tenant SSO is the product

### E — Clerk (rejected)

**Rejected** for GRIDERA:
- Sub-processor / transfer objections for regulated EU/finance buyers
- Undercuts sovereign / PQC platform narrative
- Explicit product direction: migrate off Clerk (June 2026)

---

## Consequences

### Must do immediately (Harden JWT — P0)

| # | Fix | Why |
|---|-----|-----|
| 1 | Require `JWT_SECRET` (≥32 bytes); **fail boot** if missing in production | Default secret is game over |
| 2 | Replace SHA-256 with **argon2id** or **bcrypt** (cost ≥12) | Demo hash is not password hashing |
| 3 | Rate-limit signup/signin (Upstash already in stack story) | Credential stuffing |
| 4 | Password reset + email verify (Resend) | Account recovery without Clerk |
| 5 | Scrub all Clerk docs / privacy / pricing / SOC2 mapper | Legal + sales truth |
| 6 | Delete Vercel `CLERK_*` env | Dead attack surface / confusion |
| 7 | Stripe webhook: resolve users by **`users.id`**, not `clerkId` | Billing works post-Clerk |

### Must do before enterprise SSO (Better Auth — P1)

| # | Work |
|---|------|
| 1 | ADR implementation spike: Better Auth + Drizzle/Neon schema alongside `users` |
| 2 | Dual-read cookies during cutover; then single session cookie |
| 3 | Drop `clerk_id` column (migration) after zero references |
| 4 | MFA for all paid seats |
| 5 | Org/roles model matching CISO / Auditor / Viewer |

### Explicitly out of scope

- Reintroducing Clerk “just for SSO”
- Hosted Auth0/Firebase/Supabase Auth as default IdP (same class of objection)

---

## Recommendation summary

```
NOW:     Harden JWT (P0 security) + doc/env scrub  ← this change set
NEXT:    Better Auth on Neon when MFA/OAuth needed or before paid pilot SSO
NEVER:   Clerk
LATER:   SAML only under contract (BoxyHQ/SSOReady or Better Auth plugins)
```

---

## References

- Commit `afac35e` — replace Clerk with JWT
- Commit `443b6ea` — remove Clerk middleware / proxy
- Commit `0f9c435` — delete proxy.ts remnant
- Live auth: `apps/comply/src/lib/auth.ts`
- Prior (obsolete) memory: `clerk_auth_decision.md` → superseded by this ADR
