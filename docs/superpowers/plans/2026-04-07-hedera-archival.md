# HEDERA Directory Archival Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce HEDERA/ from 39 directories (~26GB) to ~15 active directories by archiving dead repos, deleting duplicates, and cleaning orphans — without losing any unique code or git history.

**Architecture:** Four-pass approach: (1) delete pure duplicates and empty dirs, (2) move dead/superseded repos to `_archive/`, (3) move parked future projects to `_parked/`, (4) consolidate orphan files into logical homes. Every git repo is preserved on GitHub — local clones are what we're cleaning. Two holding directories:
- **`_archive/`** — Dead, superseded, never coming back. Safe to delete entirely later.
- **`_parked/`** — Future projects with planned roadmaps, just not active yet. Will be moved back to HEDERA root when development starts.

**Tech Stack:** git, shell, GitHub CLI (for repo archival flags)

---

## Forensics Summary (April 7, 2026)

### Current State: 39 directories, 26GB

**Duplicate clones (same GitHub remote, same commit):**
| Directory | Remote | Duplicate Of |
|-----------|--------|--------------|
| `Comply.Q-Grid.in/` (577MB) | Taurus-Ai-Corp/Comply.Q-Grid | `Comply.Q-Grid.EU/` |
| `Rupee_Grid_pay_Q-Grid.in/` (429MB) | Taurus-Ai-Corp/Q-GRID.IN | `Q-Grid.IN/` |

**Orphan non-git directories:**
| Directory | Size | Contents |
|-----------|------|----------|
| `node_modules/` | 2.0GB | Top-level orphan (no package.json at HEDERA root) |
| `apps/` | 155MB | Old monorepo remnant (bizflow, opsflow, social-orchestra, taurusai-io) |
| `packages/` | 239MB | Old monorepo remnant (9 packages, superseded by q-grid-platform/packages/) |
| `dist/` | 4KB | Orphan deploy-config.json |
| `docker-extract/` | 0B | Empty |
| `Comply.Q-Grid.net/` | 164KB | Empty Next.js scaffold, not a git repo |
| `Q-GRID-ECOSYSTEM/` | 396KB | Architecture docs (6 subdirs + 3 .md files) |
| `Obidien.taurusai.io/` | 491MB | Pi 5 project, Phase 0, no git |
| `OBD2-Ai-Diagnostic/` | 172KB | Docs only |
| `obd2-ai-diagnostics/` | 160KB | Duplicate name of above |
| `genmedia-mcp-bridge/` | 8KB | Single JS file |
| `tooling/` | 8KB | docker + scripts dirs |
| `emails/` | 8KB | Single email draft |

### Target State: ~15 directories, ~8GB

**KEEP (active, unique, revenue-generating):**
```
q-grid-platform/          # Gen 3 canonical — THE product
hiero-cli-pqc/            # Revenue product #1
swarm-spawner-skill/       # Published npm, integrated
bizflow/                   # Active app
hedera-orchestrator/       # Foundation engine
multi_agent_pipeline/      # DAG runner, built & tested
social-media-orchestra/    # Active app
gws-bridge/                # Active tool (small)
papers/                    # IP/research (small)
grants/                    # Active grant pipeline (small)
pqc-leads/                 # Active sales pipeline (small)
docs/                      # Hedera documentation
gemini-integration/        # GenMedia bridge
skills/                    # Claude skills collection
```

**ARCHIVE (dead/superseded → `_archive/`):**
```
Comply.Q-Grid.EU/          # Gen 2 reference — superseded by q-grid-platform
Q-Grid.IN/                 # Gen 1 reference — superseded by q-grid-platform
Q-Grid.CA/                 # Hedera integration reference — code ported
fraud-detection-demo/       # Demo, not product
multi-ai-devops/           # Stale, no recent commits
INNOVATIVE_IDEAS_DOCS/     # Stale docs
taurus-cli/                # Superseded by q-grid-platform CLI
huggingface-spaces/        # Reference only
ml-pipeline/               # Reference only
```

**PARKED (future projects with roadmaps → `_parked/`):**
```
Obidien.taurusai.io/       # Phase 0 — Pi 5 + ONNX + Next.js (planned)
OpsFlow.Taurusai.io/       # Phase 2 of 7 — Remotion video gen (will resume)
OBD2-Ai-Diagnostic/        # Vehicle diagnostics project (planned)
obd2-ai-diagnostics/       # Merge into OBD2-Ai-Diagnostic/, keep 1 copy
```

**DELETE (duplicates, empties, orphans):**
```
Comply.Q-Grid.in/          # DUPLICATE of Comply.Q-Grid.EU (same remote+commit)
Rupee_Grid_pay_Q-Grid.in/  # DUPLICATE of Q-Grid.IN (same remote)
Comply.Q-Grid.net/         # Empty scaffold, not git
node_modules/              # Orphan, no root package.json
apps/                      # Old monorepo remnant, superseded
packages/                  # Old monorepo remnant, superseded
dist/                      # Orphan build artifact
docker-extract/            # Empty
Q-GRID-ECOSYSTEM/          # Docs only, consolidate into docs/
```

**CONSOLIDATE (move files, then delete dir):**
```
emails/                    → grants/emails/
genmedia-mcp-bridge/       → gemini-integration/
tooling/                   → _archive/tooling/
```

---

### Task 1: Safety Net — Verify All Repos Exist on GitHub

Before deleting any local clone, confirm the remote still exists.

**Files:**
- Create: `_archive/ARCHIVAL-LOG.md` (audit trail of what moved where and when)

- [ ] **Step 1: Check all GitHub remotes are accessible**

```bash
cd /Users/taurus_ai/Documents/HEDERA
for d in Comply.Q-Grid.EU Comply.Q-Grid.in Q-Grid.IN Rupee_Grid_pay_Q-Grid.in Q-Grid.CA OpsFlow.Taurusai.io fraud-detection-demo multi-ai-devops INNOVATIVE_IDEAS_DOCS taurus-cli huggingface-spaces ml-pipeline; do
  if [ -d "$d/.git" ]; then
    url=$(cd "$d" && git remote get-url origin 2>/dev/null)
    status=$(git ls-remote --exit-code "$url" HEAD 2>/dev/null && echo "OK" || echo "MISSING")
    echo "$d → $url → $status"
  fi
done
```

Expected: All should print `OK`. If any print `MISSING`, do NOT delete that local clone — push it first.

- [ ] **Step 2: Check for unpushed local commits**

```bash
cd /Users/taurus_ai/Documents/HEDERA
for d in Comply.Q-Grid.EU Comply.Q-Grid.in Q-Grid.IN Rupee_Grid_pay_Q-Grid.in Q-Grid.CA OpsFlow.Taurusai.io fraud-detection-demo multi-ai-devops INNOVATIVE_IDEAS_DOCS taurus-cli huggingface-spaces ml-pipeline; do
  if [ -d "$d/.git" ]; then
    unpushed=$(cd "$d" && git log --oneline origin/main..HEAD 2>/dev/null | wc -l | tr -d ' ')
    dirty=$(cd "$d" && git status --porcelain | wc -l | tr -d ' ')
    echo "$d → unpushed:$unpushed dirty:$dirty"
  fi
done
```

Expected: All `unpushed:0 dirty:0`. Any non-zero means push or stash first.

- [ ] **Step 3: Create archival log**

```bash
mkdir -p /Users/taurus_ai/Documents/HEDERA/_archive
cat > /Users/taurus_ai/Documents/HEDERA/_archive/ARCHIVAL-LOG.md << 'EOF'
# HEDERA Archival Log

**Date:** 2026-04-07
**Reason:** Consolidate 39 dirs → ~15. Gen 3 (q-grid-platform) is canonical.

## Archived Repos (moved to _archive/)
| Directory | GitHub Remote | Reason |
|-----------|-------------|--------|

## Deleted (duplicates/empties)
| Directory | Reason |
|-----------|--------|

## Consolidated
| From | To | Reason |
|------|-----|--------|
EOF
```

- [ ] **Step 4: Commit the archival log**

```bash
cd /Users/taurus_ai/Documents/HEDERA/gridera-platform
cp /Users/taurus_ai/Documents/HEDERA/_archive/ARCHIVAL-LOG.md docs/superpowers/plans/ARCHIVAL-LOG.md
git add docs/superpowers/plans/ARCHIVAL-LOG.md docs/superpowers/plans/2026-04-07-hedera-archival.md
git commit -m "docs: add HEDERA archival plan and log

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Delete Pure Duplicates (~1GB freed)

These are confirmed identical clones of repos that already have another local copy.

**Files:**
- Delete: `Comply.Q-Grid.in/` (duplicate of `Comply.Q-Grid.EU/`)
- Delete: `Rupee_Grid_pay_Q-Grid.in/` (duplicate of `Q-Grid.IN/`)

- [ ] **Step 1: Final confirmation — both are same commit as their original**

```bash
cd /Users/taurus_ai/Documents/HEDERA
echo "EU: $(cd Comply.Q-Grid.EU && git rev-parse HEAD)"
echo "in: $(cd Comply.Q-Grid.in && git rev-parse HEAD)"
echo "---"
echo "IN: $(cd Q-Grid.IN && git rev-parse HEAD)"
echo "Rupee: $(cd Rupee_Grid_pay_Q-Grid.in && git rev-parse HEAD)"
```

Expected: EU and in match. IN and Rupee should share the same remote (commits may differ if Rupee diverged — check).

- [ ] **Step 2: If Rupee has unique commits, check what they are**

```bash
cd /Users/taurus_ai/Documents/HEDERA/Rupee_Grid_pay_Q-Grid.in
git log --oneline -5
```

If it has commits not in Q-Grid.IN, push them to a branch before deleting:
```bash
git push origin HEAD:refs/heads/rupee-archive
```

- [ ] **Step 3: Delete duplicates**

```bash
cd /Users/taurus_ai/Documents/HEDERA
rm -rf Comply.Q-Grid.in/
rm -rf Rupee_Grid_pay_Q-Grid.in/
```

- [ ] **Step 4: Update archival log**

Add to the "Deleted" table in `_archive/ARCHIVAL-LOG.md`:
```
| Comply.Q-Grid.in/ | Duplicate of Comply.Q-Grid.EU/ (same remote + commit 79c9199) |
| Rupee_Grid_pay_Q-Grid.in/ | Duplicate of Q-Grid.IN/ (same remote Taurus-Ai-Corp/Q-GRID.IN) |
```

- [ ] **Step 5: Commit log update**

```bash
cd /Users/taurus_ai/Documents/HEDERA/gridera-platform
cp /Users/taurus_ai/Documents/HEDERA/_archive/ARCHIVAL-LOG.md docs/superpowers/plans/ARCHIVAL-LOG.md
git add docs/superpowers/plans/ARCHIVAL-LOG.md
git commit -m "docs: log deletion of duplicate clones (Comply.Q-Grid.in, Rupee_Grid_pay)

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Delete Orphan Directories (~2.4GB freed)

These have no git history, no unique code worth preserving, or are superseded.

**Files:**
- Delete: `node_modules/` (orphan, 2GB)
- Delete: `dist/` (orphan build artifact)
- Delete: `docker-extract/` (empty)
- Delete: `Comply.Q-Grid.net/` (empty scaffold)

- [ ] **Step 1: Verify node_modules is truly orphan**

```bash
cd /Users/taurus_ai/Documents/HEDERA
ls package.json 2>/dev/null || echo "NO ROOT PACKAGE.JSON — node_modules is orphan"
```

Expected: `NO ROOT PACKAGE.JSON`

- [ ] **Step 2: Delete orphans**

```bash
cd /Users/taurus_ai/Documents/HEDERA
rm -rf node_modules/
rm -rf dist/
rm -rf docker-extract/
rm -rf Comply.Q-Grid.net/
```

- [ ] **Step 3: Update archival log**

Add to "Deleted" table:
```
| node_modules/ | Orphan — no root package.json (2GB) |
| dist/ | Orphan build artifact (4KB) |
| docker-extract/ | Empty directory |
| Comply.Q-Grid.net/ | Empty Next.js scaffold, not a git repo |
```

---

### Task 4: Consolidate Small Orphans

Move stray files into logical homes before deleting their directories.

**Files:**
- Move: `emails/EMAIL-DR-MIRHASSANI-UWINDSOR.md` → `grants/emails/`
- Move: `genmedia-mcp-bridge/genmedia-bridge.js` → `gemini-integration/`
- Move: `Q-GRID-ECOSYSTEM/*.md` + subdirs → `docs/architecture/`
- [ ] **Step 1: Move emails into grants**

```bash
cd /Users/taurus_ai/Documents/HEDERA
mkdir -p grants/emails
mv emails/EMAIL-DR-MIRHASSANI-UWINDSOR.md grants/emails/
rmdir emails
```

- [ ] **Step 2: Move genmedia bridge into gemini-integration**

```bash
mv genmedia-mcp-bridge/genmedia-bridge.js gemini-integration/
rmdir genmedia-mcp-bridge
```

- [ ] **Step 3: Move Q-GRID-ECOSYSTEM docs into docs/architecture**

```bash
mkdir -p docs/architecture
cp -r Q-GRID-ECOSYSTEM/* docs/architecture/
rm -rf Q-GRID-ECOSYSTEM/
```

- [ ] **Step 4: Archive tooling**

```bash
mv tooling/ _archive/tooling/
```

- [ ] **Step 5: Update archival log with consolidations**

Add to "Consolidated" table:
```
| emails/ | grants/emails/ | Single file, logically belongs with grants |
| genmedia-mcp-bridge/ | gemini-integration/ | Single file, same system |
| Q-GRID-ECOSYSTEM/ | docs/architecture/ | Architecture docs belong in docs/ |
| tooling/ | _archive/tooling/ | Stale scripts |
```

---

### Task 5: Archive Old Monorepo Remnants (~394MB freed)

The top-level `apps/` and `packages/` dirs are from the old TAURUS_AI_SAAS monorepo structure. They've been superseded by `q-grid-platform/apps/` and `q-grid-platform/packages/`.

**Files:**
- Move: `apps/` → `_archive/monorepo-apps/`
- Move: `packages/` → `_archive/monorepo-packages/`

- [ ] **Step 1: Check if packages/taurus-agent-handoff has unpublished work**

```bash
cd /Users/taurus_ai/Documents/HEDERA/packages/taurus-agent-handoff
cat package.json | grep version
ls dist/ | head -5
```

This package is published and referenced in CLAUDE.md. Verify the published version matches before archiving.

- [ ] **Step 2: Archive apps/ and packages/**

```bash
cd /Users/taurus_ai/Documents/HEDERA
mv apps/ _archive/monorepo-apps/
mv packages/ _archive/monorepo-packages/
```

- [ ] **Step 3: Update archival log**

Add to "Archived" table:
```
| apps/ | — | Old monorepo remnant, superseded by q-grid-platform/apps/ |
| packages/ | — | Old monorepo remnant, superseded by q-grid-platform/packages/ |
```

---

### Task 6: Archive Dead Repos + Park Future Projects (~2.4GB freed)

Two categories: **dead/superseded → `_archive/`** and **future/planned → `_parked/`**.

`_parked/` projects come back to HEDERA root when development starts:
```bash
mv _parked/Obidien.taurusai.io/ ./Obidien.taurusai.io/  # ← when Phase 1 begins
```

**Files:**
- Move 9 repos to `_archive/`
- Move 3 projects to `_parked/`

- [ ] **Step 1: Create both holding directories**

```bash
cd /Users/taurus_ai/Documents/HEDERA
mkdir -p _archive _parked
```

- [ ] **Step 2: Archive dead/superseded repos**

```bash
cd /Users/taurus_ai/Documents/HEDERA

# Gen 2 + Gen 1 (superseded by q-grid-platform Gen 3)
mv Comply.Q-Grid.EU/ _archive/Comply.Q-Grid.EU/
mv Q-Grid.IN/ _archive/Q-Grid.IN/
mv Q-Grid.CA/ _archive/Q-Grid.CA/

# Stale/dead projects
mv fraud-detection-demo/ _archive/fraud-detection-demo/
mv multi-ai-devops/ _archive/multi-ai-devops/
mv INNOVATIVE_IDEAS_DOCS/ _archive/INNOVATIVE_IDEAS_DOCS/
mv taurus-cli/ _archive/taurus-cli/
mv huggingface-spaces/ _archive/huggingface-spaces/
mv ml-pipeline/ _archive/ml-pipeline/
```

- [ ] **Step 3: Park future projects (will resume later)**

```bash
cd /Users/taurus_ai/Documents/HEDERA

# Phase 0 — Pi 5 + ONNX + Next.js (planned, not started)
mv Obidien.taurusai.io/ _parked/Obidien.taurusai.io/

# Phase 2 of 7 — Remotion video gen (will resume after Comply ships)
mv OpsFlow.Taurusai.io/ _parked/OpsFlow.Taurusai.io/

# Vehicle diagnostics (merge duplicates, then park)
mkdir -p _parked/OBD2-Ai-Diagnostic/
cp -r OBD2-Ai-Diagnostic/* _parked/OBD2-Ai-Diagnostic/ 2>/dev/null
cp -r obd2-ai-diagnostics/* _parked/OBD2-Ai-Diagnostic/ 2>/dev/null
rm -rf OBD2-Ai-Diagnostic/ obd2-ai-diagnostics/
```

- [ ] **Step 4: Create _parked/README.md**

```bash
cat > /Users/taurus_ai/Documents/HEDERA/_parked/README.md << 'EOF'
# Parked Projects

These are future projects with planned roadmaps. They are NOT archived — they will
be moved back to HEDERA/ root when active development starts.

## How to Resume

```bash
mv _parked/ProjectName/ ../ProjectName/
```

## Projects

| Project | Phase | Planned Start | Description |
|---------|-------|---------------|-------------|
| Obidien.taurusai.io | Phase 0 | TBD | Pi 5 + ONNX edge AI + Next.js dashboard |
| OpsFlow.Taurusai.io | Phase 2/7 | After Comply ships | Remotion video generation platform |
| OBD2-Ai-Diagnostic | Phase 0 | TBD | Vehicle diagnostics with AI |
EOF
```

- [ ] **Step 5: Update archival log**

Add to "Archived" table in `_archive/ARCHIVAL-LOG.md`:
```
| Comply.Q-Grid.EU/ | Taurus-Ai-Corp/Comply.Q-Grid | Gen 2 reference, superseded by q-grid-platform |
| Q-Grid.IN/ | Taurus-Ai-Corp/Q-GRID.IN | Gen 1, 24-agent system reference |
| Q-Grid.CA/ | Taurus-Ai-Corp/Q-GRID | Hedera integration reference |
| fraud-detection-demo/ | Taurus-Ai-Corp/fraud-detection-demo-private | Demo, not product |
| multi-ai-devops/ | Taurus-Ai-Corp/multi-ai-devops | Stale |
| INNOVATIVE_IDEAS_DOCS/ | Taurus-Ai-Corp/innovative-ideas-docs | Stale docs |
| taurus-cli/ | Taurus-Ai-Corp/taurus-cli | Superseded by q-grid-platform |
| huggingface-spaces/ | Taurus-Ai-Corp/huggingface-spaces | Reference only |
| ml-pipeline/ | Taurus-Ai-Corp/ml-pipeline | Reference only |
```

Add new "Parked" table:
```
## Parked (future projects — will resume)
| Directory | Reason | Resume When |
|-----------|--------|-------------|
| Obidien.taurusai.io/ | Phase 0, Pi 5 project | TBD |
| OpsFlow.Taurusai.io/ | Phase 2 of 7, paused | After Comply ships |
| OBD2-Ai-Diagnostic/ | Phase 0, vehicle diagnostics | TBD |
```

- [ ] **Step 4: Commit final archival log**

```bash
cd /Users/taurus_ai/Documents/HEDERA/gridera-platform
cp /Users/taurus_ai/Documents/HEDERA/_archive/ARCHIVAL-LOG.md docs/superpowers/plans/ARCHIVAL-LOG.md
git add docs/superpowers/plans/ARCHIVAL-LOG.md
git commit -m "docs: complete HEDERA archival — 39 dirs → 15

Archived 11 repos, deleted 2 duplicates + 4 orphans,
consolidated 5 small dirs. ~18GB freed.

Co-Authored-By: E.Fdz <admin@taurusai.io>
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Verify Final State

- [ ] **Step 1: List remaining directories**

```bash
cd /Users/taurus_ai/Documents/HEDERA
ls -d */ | grep -v _archive | grep -v node_modules
```

Expected (~14 active dirs + 2 holding dirs):
```
bizflow/                   # Active app
docs/                      # Documentation
gemini-integration/        # GenMedia bridge
grants/                    # Grant pipeline
gws-bridge/                # Google Workspace tool
hedera-orchestrator/       # Foundation engine
hiero-cli-pqc/             # Revenue product #1
multi_agent_pipeline/       # DAG runner
papers/                    # IP/research
pqc-leads/                 # Sales pipeline
q-grid-platform/           # THE canonical product
skills/                    # Claude skills
social-media-orchestra/    # Active app
swarm-spawner-skill/       # Published npm
_archive/                  # Dead repos (9 repos, deletable)
_parked/                   # Future projects (3 projects, will resume)
```

- [ ] **Step 2: Check disk savings**

```bash
du -sh /Users/taurus_ai/Documents/HEDERA/ 2>/dev/null
du -sh /Users/taurus_ai/Documents/HEDERA/_archive/ 2>/dev/null
```

Expected: HEDERA total ~8-10GB active, _archive ~6-8GB (deletable later).

- [ ] **Step 3: Verify q-grid-platform still builds**

```bash
cd /Users/taurus_ai/Documents/HEDERA/gridera-platform
pnpm test
```

Expected: 101 tests passing, 10 turbo tasks successful.

- [ ] **Step 4: Update CLAUDE.md to reflect new structure**

Remove references to archived repos. Update "Important: HEDERA Directory Structure" section to reflect the new ~15 directory layout. Remove "Old Q-Grid Repos (DO NOT modify)" section — they're archived now.

- [ ] **Step 5: Push**

```bash
cd /Users/taurus_ai/Documents/HEDERA/gridera-platform
git push origin main
```

---

### Task 8: Optional — Flag GitHub Repos as Archived

After confirming everything works locally, mark stale GitHub repos as archived so they don't show in active repo lists.

- [ ] **Step 1: Archive stale repos on GitHub**

```bash
# These repos are preserved but marked read-only on GitHub
gh repo archive Taurus-Ai-Corp/Q-GRID.IN --yes
gh repo archive Taurus-Ai-Corp/Q-GRID --yes
gh repo archive Taurus-Ai-Corp/innovative-ideas-docs --yes
gh repo archive Taurus-Ai-Corp/multi-ai-devops --yes
gh repo archive Taurus-Ai-Corp/ml-pipeline --yes
gh repo archive Taurus-Ai-Corp/huggingface-spaces --yes
```

**DO NOT archive these — still active or published:**
- `Taurus-Ai-Corp/Comply.Q-Grid` (Gen 2 — may still have Vercel deploys)
- `Taurus-Ai-Corp/opsflow-taurusai` (may resume)
- `Taurus-Ai-Corp/fraud-detection-demo-private` (demo for sales)
- `Taurus-Ai-Corp/taurus-cli` (public, may have users)
- `Taurus-Ai-Corp/swarm-spawner` (published npm)

- [ ] **Step 2: Verify no Vercel projects break**

Check that archived repos don't have active Vercel deployments:
```bash
# List Vercel projects and their git repos
vercel ls 2>/dev/null || echo "Check Vercel dashboard manually"
```

Any Vercel project pointing to an archived GitHub repo will stop auto-deploying. Verify this is intended.

---

## Expected Outcome

| Metric | Before | After |
|--------|--------|-------|
| Directories | 39 | 14 active + `_archive/` + `_parked/` |
| Disk (active) | 26GB | ~8GB |
| Duplicate clones | 2 pairs | 0 |
| Orphan dirs | 13 | 0 |
| Git repos (active) | 22 | 14 |
| Parked (future) | 0 | 3 |
| Canonical source | "Gen 3" (aspirational) | q-grid-platform/ (enforced) |

## Rollback

Everything is reversible:
- Archived repos: `mv _archive/X ./X`
- Parked projects: `mv _parked/X ./X` (this is the INTENDED workflow)
- Deleted duplicates: `git clone <remote>` (all exist on GitHub)
- GitHub archived repos: `gh repo unarchive Taurus-Ai-Corp/X`
