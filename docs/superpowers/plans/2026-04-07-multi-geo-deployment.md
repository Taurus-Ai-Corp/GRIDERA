# Multi-Geo Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy comply app to NA (na.q-grid.net) and IN (in.q-grid.net) with true data residency — separate Neon databases, Vercel projects, and DNS records.

**Architecture:** Same codebase (`apps/comply`), deployed 3x with different env vars. Each region has its own Neon PostgreSQL in a local AWS zone. Jurisdiction detection already works via `@taurus/jurisdiction` package.

**Tech Stack:** Neon PostgreSQL, Vercel, first-party JWT (JWT_SECRET), DNS (Vercel or Cloudflare)

---

## File Structure

No code changes required. Only infrastructure provisioning and configuration.

| What | Action |
|------|--------|
| `apps/comply/vercel.json` | Already configured for EU (fra1). NA and IN are separate Vercel projects. |
| `apps/landing/src/components/geo-selector.tsx` | Modify: set `live: true` for NA and IN links |

---

### Task 1: Provision Neon Databases

**Files:**
- No code files. Neon console operations.

- [ ] **Step 1: Create NA database**

Go to https://console.neon.tech and create a new project:
- Name: `q-grid-comply-na`
- Region: `us-east-2` (Ohio)
- Database: `neondb`
- Save the connection string.

- [ ] **Step 2: Create IN database**

Same process:
- Name: `q-grid-comply-in`
- Region: `ap-south-1` (Mumbai)
- Database: `neondb`
- Save the connection string.

- [ ] **Step 3: Run Drizzle migrations on both databases**

```bash
cd /Users/taurus_ai/Documents/HEDERA/q-grid-platform

# NA
DATABASE_URL="postgresql://neondb_owner:<password>@<na-host>.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  pnpm --filter @taurus/db exec drizzle-kit push

# IN
DATABASE_URL="postgresql://neondb_owner:<password>@<in-host>.ap-south-1.aws.neon.tech/neondb?sslmode=require" \
  pnpm --filter @taurus/db exec drizzle-kit push
```

Expected: All 11 tables created in each database.

- [ ] **Step 4: Verify tables exist**

```bash
# NA
DATABASE_URL="<na-url>" pnpm --filter @taurus/db exec drizzle-kit studio
# Check: organizations, assessments, systems, reports, audit_trail, scans exist
```

---

### Task 2: Create Vercel Projects

**Files:**
- No code files. Vercel CLI/dashboard operations.

- [ ] **Step 1: Create comply-na Vercel project**

```bash
cd /Users/taurus_ai/Documents/HEDERA/q-grid-platform

# Create project linked to same repo
vercel project add comply-na

# OR via API:
curl -X POST "https://api.vercel.com/v11/projects" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "comply-na",
    "framework": "nextjs",
    "rootDirectory": "apps/comply",
    "nodeVersion": "20.x",
    "gitRepository": {
      "repo": "Taurus-Ai-Corp/Quantum-Grid-Mesh",
      "type": "github"
    }
  }'
```

- [ ] **Step 2: Set comply-na environment variables**

```bash
# Via Vercel dashboard or CLI:
vercel env add JURISDICTION production comply-na <<< "na"
vercel env add NEXT_PUBLIC_JURISDICTION production comply-na <<< "na"
vercel env add DATABASE_URL production comply-na <<< "<na-neon-connection-string>"
vercel env add JWT_SECRET production comply-na <<< "$(openssl rand -base64 32)"
# JWT auth (no Clerk) keys removed 2026-07-14 — do not add CLERK_*
```

- [ ] **Step 3: Set comply-na Vercel region**

Via Vercel API (vercel.json `regions` only works for existing projects):
```bash
curl -X PATCH "https://api.vercel.com/v9/projects/comply-na" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serverlessFunctionRegion": "iad1"}'
```

- [ ] **Step 4: Repeat for comply-in**

Same steps with:
- Project name: `comply-in`
- `JURISDICTION=in`, `NEXT_PUBLIC_JURISDICTION=in`
- `DATABASE_URL=<in-neon-connection-string>`
- Region: `bom1` (Mumbai)
- JWT_SECRET: region-specific secret (no Clerk)

- [ ] **Step 5: Trigger initial deployments**

```bash
# Push triggers auto-deploy on all 3 projects
cd /Users/taurus_ai/Documents/HEDERA/q-grid-platform
git commit --allow-empty -m "chore: trigger multi-geo deployment

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

### Task 3: Configure DNS

- [ ] **Step 1: Add na.q-grid.net domain to comply-na**

```bash
vercel domains add na.q-grid.net --project comply-na
# Follow DNS verification instructions
```

- [ ] **Step 2: Add in.q-grid.net domain to comply-in**

```bash
vercel domains add in.q-grid.net --project comply-in
# Follow DNS verification instructions
```

- [ ] **Step 3: Verify all three domains resolve**

```bash
curl -s -o /dev/null -w "EU: HTTP %{http_code}\n" https://eu.q-grid.net
curl -s -o /dev/null -w "NA: HTTP %{http_code}\n" https://na.q-grid.net
curl -s -o /dev/null -w "IN: HTTP %{http_code}\n" https://in.q-grid.net
```

Expected: All return HTTP 200.

---

### Task 4: Update Landing Page Geo-Selector

**Files:**
- Modify: `apps/landing/src/components/geo-selector.tsx`

- [ ] **Step 1: Find and update the live flags**

In `geo-selector.tsx`, find the region config array and set `live: true` for NA and IN:

```typescript
// Change live: false to live: true for NA and IN
{ id: 'na', label: 'North America', domain: 'na.q-grid.net', live: true },
{ id: 'eu', label: 'European Union', domain: 'eu.q-grid.net', live: true },
{ id: 'in', label: 'India', domain: 'in.q-grid.net', live: true },
{ id: 'ae', label: 'UAE', domain: 'ae.q-grid.net', live: false },
```

- [ ] **Step 2: Commit**

```bash
cd /Users/taurus_ai/Documents/HEDERA/q-grid-platform
git add apps/landing/src/components/geo-selector.tsx
git commit -m "feat(landing): enable NA and IN regions in geo-selector

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

### Task 5: Verify Multi-Geo Works

- [ ] **Step 1: Check jurisdiction detection per region**

```bash
# EU should show EU AI Act content
curl -s https://eu.q-grid.net | grep -o "EU AI Act\|GDPR" | head -3

# NA should show OSFI/PIPEDA content
curl -s https://na.q-grid.net | grep -o "OSFI\|PIPEDA\|CCPA" | head -3

# IN should show RBI/DPDP content
curl -s https://in.q-grid.net | grep -o "RBI\|DPDP\|SEBI" | head -3
```

- [ ] **Step 2: Verify data isolation**

Create a test organization on NA, then verify it does NOT appear in EU:

```bash
# Create org on NA
curl -X POST https://na.q-grid.net/api/organizations \
  -H "Content-Type: application/json" \
  -d '{"name": "Test NA Org"}'

# Verify it's NOT in EU
curl https://eu.q-grid.net/api/organizations
# Should not contain "Test NA Org"
```

- [ ] **Step 3: Verify database residency**

Connect to each Neon database and confirm data stays in its region:
```sql
-- On NA database
SELECT jurisdiction FROM organizations;
-- Should only contain 'na'

-- On EU database
SELECT jurisdiction FROM organizations;
-- Should only contain 'eu'
```
