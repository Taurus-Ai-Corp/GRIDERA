#!/usr/bin/env bash
# Agent B — Jurisdiction cell health (EU + CA interim)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== Agent B: Cell health $(date -u +%Y-%m-%dT%H:%MZ) ==="
pnpm exec tsx scripts/ca-cell-probe.ts || true

echo "--- EU auth spine ---"
code=$(curl -sS -o /tmp/eu_auth.json -w "%{http_code}" -X POST "https://eu.q-grid.net/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@example.com","password":"cell-health"}' || echo "000")
echo "EU HTTP $code body=$(head -c 120 /tmp/eu_auth.json 2>/dev/null || true)"
if [ "$code" != "401" ]; then
  echo "FAIL EU expected 401"
  exit 1
fi
echo "=== Agent B done (EU OK; CA see probe WARN lines) ==="
