#!/usr/bin/env bash
# Agent: compare hierarchy claims against monorepo (static).
# Exit 0 if all required paths + enum + ca documentTypes present.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
fail=0
ok() { echo "✓ $1"; }
bad() { echo "✗ $1"; fail=1; }

echo "=== Hierarchy compare $(date -u +%Y-%m-%dT%H:%MZ) ==="

for p in \
  apps/landing apps/comply sales-engine \
  packages/pqc-engine packages/pqc-crypto packages/pqc-ca \
  packages/hedera packages/jurisdiction packages/db packages/guard \
  packages/auth packages/mcp packages/ui \
  docs/GRIDERA-PRODUCT-TAXONOMY.md docs/ops/CA-CELL-OPS-CHECKLIST.md
do
  [ -e "$p" ] && ok "path $p" || bad "path $p"
done

if grep -q "\\['na', 'eu', 'in', 'ae', 'ca'\\]" packages/db/src/schema/enums.ts 2>/dev/null \
  || grep -q 'na.*eu.*in.*ae.*ca' packages/db/src/schema/enums.ts 2>/dev/null; then
  ok "jurisdiction enum na/eu/in/ae/ca"
else
  bad "jurisdiction enum"
fi

if grep -q "pqc_readiness_report" packages/jurisdiction/src/configs/ca.ts \
  && grep -q "data_residency_certificate" packages/jurisdiction/src/configs/ca.ts; then
  ok "caConfig documentTypes (pqc_readiness + data_residency)"
else
  bad "caConfig documentTypes"
fi

if grep -q "RESIDENCY_STRICT" packages/db/src/resolve.ts \
  && grep -q "'ca'" packages/db/src/resolve.ts; then
  ok "CA residency-strict resolve"
else
  bad "CA residency-strict resolve"
fi

if grep -q "sales-engine" docs/GRIDERA-PRODUCT-TAXONOMY.md \
  && grep -q "guard/v1" docs/GRIDERA-PRODUCT-TAXONOMY.md \
  && grep -q "Never migrate product traffic to gridera.net" docs/GRIDERA-PRODUCT-TAXONOMY.md; then
  ok "taxonomy includes A1 sales-engine, Guard rewrite, domain freeze"
else
  bad "taxonomy missing hierarchy fields"
fi

if [ "$fail" -ne 0 ]; then
  echo "FAIL — hierarchy compare"
  exit 1
fi
echo "PASS — hierarchy claims match monorepo + taxonomy"
