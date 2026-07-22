# GRIDERA research / QA agents

| Agent | Script / prompt | What it checks |
|-------|-----------------|----------------|
| **A Funnel QA** | `./scripts/agents/funnel-qa.sh` | Calendly CTAs, /ca redirect, EU auth, scan contract |
| **B Cell health** | `./scripts/agents/cell-health.sh` | CA probe + EU 401 spine |
| **C Market intel** | `market-intel.md` (prompt) | Weekly competitive brief |

## Local

```bash
chmod +x scripts/agents/*.sh
pnpm smoke:funnel
pnpm probe:ca
./scripts/agents/funnel-qa.sh
./scripts/agents/cell-health.sh
```

## Schedule (suggested)

| When | Agent | Channel |
|------|-------|---------|
| Daily 08:00 America/Toronto | A + B | Telegram ops chat / CI artifact |
| Weekly Monday | C | `docs/ops/market-intel/` |

GitHub Actions: `.github/workflows/funnel-smoke.yml` (schedule + workflow_dispatch).

## Brand

All agent output must use `GRIDERA|Verb` pipe form.
