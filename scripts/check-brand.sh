#!/usr/bin/env bash
#
# GRIDERA brand guard — blocks commits that introduce deprecated/space-form brand names.
#
# Enforces the mandatory brand rule:
#   - Product names MUST use pipe form: GRIDERA|Comply, GRIDERA|Scan, GRIDERA|Migrate, etc.
#   - FORBIDDEN: "Q-Grid Comply" / "Q-Grid Platform" / "Q-Grid Scanner"
#   - FORBIDDEN: space-form "GRIDERA Comply" (no pipe) for any product verb
#
# Scans ONLY staged additions (won't fail on pre-existing legacy elsewhere).
# Does NOT touch: q-grid.net domains, the q-grid-platform dir/package, the repo name,
# or "GRIDERA platform" (lowercase p — not a product name).
#
# Bypass for a legitimate edge case: add "brand-allow" on the same line, or commit
# with `git commit --no-verify`.
#
# Usage: scripts/check-brand.sh            # checks staged changes (pre-commit)
#        scripts/check-brand.sh --all      # checks the whole tracked tree (CI/manual)

set -u

# Deprecated "Q-Grid X" forms (incl. Platform — the platform is GRIDERA, never "Q-Grid Platform").
QGRID_VERBS='Comply|Scan|Scanner|Migrate|Certify|Lend|Pay|Arq|Shield|Guard|Observe|Platform'
# Space-form product names that MUST use the pipe (GRIDERA|Comply). NOTE: "Platform" is NOT
# here on purpose — "GRIDERA Platform" / "the GRIDERA platform" is legitimate prose.
GRIDERA_VERBS='Comply|Scan|Migrate|Certify|Lend|Pay|Arq|Shield|Guard|Observe'
# All case variants of the deprecated prefix ("Q-GRID Comply" was invisible to the old
# case-sensitive regex). Hyphenated identifiers (Q-GRID-QaaS-Platform,
# Quantum-Grid.Network) never match — the space is required.
QGRID_PREFIX='(Q-GRID|Q-Grid|q-grid|QGRID)'
# "Quantum Grid" / "Quantum Grid Mesh" are retired display brands; the GitHub repo is GRIDERA.
# q-grid-platform: dir/package renamed gridera-platform (Wave D) — old token must not resurface.
RETIRED_BRANDS='(Quantum Grid)|(Quantum-Grid-Mesh)|(quantum-grid-mesh)|(q-grid-platform)'
# The pipe form "GRIDERA|Comply" never matches (regex requires a literal space).
FORBIDDEN="(${QGRID_PREFIX} (${QGRID_VERBS}))|(GRIDERA (${GRIDERA_VERBS}))|${RETIRED_BRANDS}"

# Paths that legitimately contain the forbidden strings as negative examples,
# plus historical plans/specs (docs/superpowers/) that record the old names.
EXCLUDE_RE='(^|/)(scripts/check-brand\.sh|\.githooks/|docs/superpowers/)|BRAND|brand-rule'

fail=0
report() { # file, line, text
  printf '  \033[31m✗\033[0m %s:%s  %s\n' "$1" "$2" "$3"
  fail=1
}

if [ "${1:-}" = "--all" ]; then
  # Whole-tree scan (CI / manual audit)
  while IFS= read -r f; do
    case "$f" in
      *.lock|*.png|*.jpg|*.jpeg|*.gif|*.svg|*.ico|*.woff*|*.ttf) continue ;;
    esac
    echo "$f" | grep -qE "$EXCLUDE_RE" && continue
    while IFS=: read -r ln text; do
      [ -z "$ln" ] && continue
      echo "$text" | grep -q "brand-allow" && continue
      report "$f" "$ln" "$(echo "$text" | sed 's/^[[:space:]]*//' | cut -c1-80)"
    done < <(grep -nEI "$FORBIDDEN" "$f" 2>/dev/null)
  done < <(git ls-files)
else
  # Staged-additions scan (pre-commit). Parse unified diff, track file + new-line numbers.
  current_file=""
  newln=0
  while IFS= read -r line; do
    case "$line" in
      '+++ b/'*) current_file="${line#+++ b/}" ;;
      '@@ '*)
        # @@ -a,b +c,d @@  -> start of new-file hunk = c
        hunk="${line#@@ -*+}"; hunk="${hunk%% @@*}"; newln="${hunk%%,*}"
        ;;
      '+'*)
        # an added line (not the +++ header)
        text="${line#+}"
        if echo "$current_file" | grep -qE "$EXCLUDE_RE"; then :;
        elif echo "$text" | grep -q "brand-allow"; then :;
        elif echo "$text" | grep -qE "$FORBIDDEN"; then
          report "$current_file" "$newln" "$(echo "$text" | sed 's/^[[:space:]]*//' | cut -c1-80)"
        fi
        newln=$((newln+1))
        ;;
      ' '*) newln=$((newln+1)) ;;   # context line advances new-file counter
      # '-' lines: removals, do not advance new-file counter
    esac
  done < <(git diff --cached --unified=0)
fi

if [ "$fail" -ne 0 ]; then
  echo ""
  echo "  Brand guard: use pipe form (GRIDERA|Comply), never \"Q-Grid <Verb>\" (any case) or space-form \"GRIDERA <Verb>\"."
  echo "  \"Quantum Grid\"/\"Quantum-Grid-Mesh\"/\"q-grid-platform\" are retired (dir/package is gridera-platform). Domains (q-grid.net — FROZEN, production) are fine."
  echo "  Edge case? add 'brand-allow' on the line, or bypass once with: git commit --no-verify"
  exit 1
fi
exit 0
