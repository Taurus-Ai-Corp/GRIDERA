# Canada cell — ops go-live checklist

**Product:** GRIDERA|Comply CA jurisdiction cell  
**Vercel project:** `q-grid-comply-ca` · `rootDirectory=apps/comply` · `JURISDICTION=ca`  
**Interim URL:** https://q-grid-comply-ca.vercel.app · https://q-grid.net/ca  
**Target URL:** https://ca.q-grid.net  

Automated probe: `pnpm probe:ca`  
Strict (fail if DNS or auth broken): `CA_STRICT=1 pnpm probe:ca`

---

## Blockers (human / account)

| # | Action | Owner | Done when |
|---|--------|-------|-----------|
| 1 | Name.com: CNAME `ca` → `cname.vercel-dns.com` on `q-grid.net` | Domain owner (`taurus.ai@taas-ai.com`) | `dig +short ca.q-grid.net` returns CNAME/A |
| 2 | Supabase ca-central-1: reset DB password | Ops | `DATABASE_URL_CA` connects |
| 3 | Vercel env `DATABASE_URL_CA` updated + redeploy | Ops | `pnpm probe:ca` shows auth `auth_reject` (401) not 500 |
| 4 | Optional: NS cutover to `ns1.vercel-dns.com` / `ns2.vercel-dns.com` | Domain owner | All cells use Vercel zone |

See also: `docs/ca-dns-cutover.md` (Replit cannot write Name.com DNS).

---

## Engineering already done

- [x] CA project: framework nextjs, root `apps/comply`, Node 20  
- [x] Env: `JURISDICTION=ca`, `NEXT_PUBLIC_JURISDICTION=ca`, JWT/Resend/Stripe/Hedera/PQC  
- [x] Residency code: `resolveDatabaseUrl` throws without `DATABASE_URL_CA`  
- [x] Jurisdiction pack: `packages/jurisdiction` `caConfig` (PIPEDA, OSFI, CCCS, AIDA, …)  
- [x] Interim routing: landing redirects `/ca` → CA app  
- [x] SSO protection disabled on CA project for public API probes  

---

## Verify commands

```bash
# Interim (expect PASS + WARN until DNS/DB fixed)
pnpm probe:ca

# Full go-live gate
CA_STRICT=1 pnpm probe:ca

# Manual
curl -sI https://q-grid.net/ca | head -5
curl -s -X POST https://q-grid-comply-ca.vercel.app/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"nobody@example.com","password":"x"}'
# Want: {"error":"Invalid email or password"} HTTP 401
# Bad:  {"error":"Sign in failed"} HTTP 500  → DATABASE_URL_CA
```

---

## Blockchain / audit (post-login)

- HCS testnet topic `0.0.9612022` (GRIDERA PQC Audit Trail)  
- Operator account from env (never commit keys)  
- After first CA assessment: confirm mirror-node sequence for that cell  

---

## Do not market yet

Full “data never leaves Canada / sovereign” until key custody + counsel  
(`docs/sovereign-cell-architecture.md`). Engineering residency is shippable; legal sovereignty is not.
