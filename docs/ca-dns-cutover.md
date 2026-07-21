# Canada cell DNS cutover — `ca.q-grid.net`

**Status:** CA Comply app is live on Vercel. Public DNS for `ca.q-grid.net` is **not** resolving yet.

## What is true (verified)

| Fact | Detail |
|------|--------|
| Registrar | **Name.com** (not Replit) |
| Nameservers | `ns1cny.name.com` … `ns4hny.name.com` |
| Account email on file | `taurus.ai@taas-ai.com` (Name.com verification mail Nov 2025) |
| Vercel project | `q-grid-comply-ca` (`JURISDICTION=ca`, deploy READY on `main`) |
| Vercel intended NS | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` (zone already has `*` wildcard) |
| Working URLs today | `https://q-grid-comply-ca.vercel.app` and `https://q-grid.net/ca` (redirect) |

**Replit does not own this zone.** Replit “custom domain” only prints records for you to paste at the registrar. Without Name.com login, no agent can write the records.

## One-time fix (pick ONE)

### Option A — CNAME only (minimal, recommended first)

In Name.com → Domains → **q-grid.net** → DNS records:

| Type | Host | Answer / Value | TTL |
|------|------|----------------|-----|
| **CNAME** | `ca` | `cname.vercel-dns.com` | 300 |

(Matches how `eu.q-grid.net` is already set up.)

### Option B — Move DNS to Vercel (best long-term)

In Name.com → Domain → Nameservers → custom:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Vercel already has a `*` ALIAS for `q-grid.net`, so `ca`, `na`, and future cells resolve without hand-adding each host.

## After DNS propagates

```bash
dig +short ca.q-grid.net CNAME   # expect cname.vercel-dns.com or vercel edge A
curl -sI https://ca.q-grid.net/sign-in   # expect HTTP 200
curl -s -X POST https://ca.q-grid.net/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"nobody@example.com","password":"x"}'
# expect 401 Invalid email or password once DATABASE_URL_CA password is fixed
```

## Recover Name.com access

1. https://www.name.com/account/credentials/username  
2. Domain: `q-grid.net` → email username to the account address  
3. https://www.name.com/account/credentials/password → reset  
4. Or Name.com support with account email `taurus.ai@taas-ai.com`

## CA DB note

`DATABASE_URL_CA` currently fails auth (`password authentication failed`). Reset the Supabase `ca-central-1` DB password and update the Vercel env on `q-grid-comply-ca` before expecting 401-on-bad-login (not 500).
