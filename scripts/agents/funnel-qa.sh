#!/usr/bin/env bash
# Agent A — Funnel QA (nightly / manual)
# Human-like path via curl + optional browser-use when available.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== Agent A: Funnel QA $(date -u +%Y-%m-%dT%H:%MZ) ==="
pnpm exec tsx scripts/funnel-smoke.ts

if command -v browser-use >/dev/null 2>&1; then
  echo "=== browser-use: comply demo CTA ==="
  export PATH="${HOME}/.local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"
  browser-use open "https://q-grid.net/comply?scan=demo" 2>/dev/null | tail -2 || true
  browser-use eval "JSON.stringify(Array.from(document.querySelectorAll('a')).filter(a=>/calendly|remediate|contact sales/i.test((a.textContent||'')+a.href)).map(a=>({t:(a.textContent||'').trim().slice(0,24),h:a.href})).slice(0,5))" 2>/dev/null | tail -5 || true
else
  echo "(browser-use not installed — API/curl path only)"
fi

echo "=== Agent A done ==="
