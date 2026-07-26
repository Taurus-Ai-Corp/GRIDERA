#!/usr/bin/env npx tsx
/**
 * Ratchet: no new untested packages.
 *
 * `pnpm test` runs `turbo run test`, and turbo SILENTLY SKIPS any package with
 * no `test` script — no error, no warning, no output. A package added without
 * one is therefore invisible to CI while CI reports success. That failure mode
 * is worse than a red build: it manufactures confidence.
 *
 * This does not demand full coverage. It pins the current offender count and
 * fails only if it grows, so coverage can only move one direction.
 *
 * Run:  pnpm assert:test-scripts
 */
import { readdirSync, existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Packages known to lack a test script. Shrink this list when you add one —
 * never grow it. A package here still ships untested; the list is a debt
 * register, not an approval.
 */
const KNOWN_UNTESTED = new Set(['mcp', 'ui', 'use-cases'])

const ROOTS = ['packages', 'apps']

type Offender = { name: string; root: string }

function hasTestScript(pkgDir: string): boolean {
  const pkgJson = join(pkgDir, 'package.json')
  if (!existsSync(pkgJson)) return false
  try {
    const parsed = JSON.parse(readFileSync(pkgJson, 'utf8')) as {
      scripts?: Record<string, string>
    }
    return typeof parsed.scripts?.['test'] === 'string'
  } catch {
    return false
  }
}

/**
 * A directory only counts if it has BOTH a package.json and a src/. Three
 * directories under packages/ (ai-assistant, auth, pqc-ca) contain only stale
 * local build output and are tracked by git in zero files — they are not
 * packages, they are residue, and flagging them would be noise.
 */
function isRealPackage(pkgDir: string): boolean {
  return existsSync(join(pkgDir, 'package.json')) && existsSync(join(pkgDir, 'src'))
}

const offenders: Offender[] = []
const unexpectedlyFixed: string[] = []

for (const root of ROOTS) {
  if (!existsSync(root)) continue
  for (const name of readdirSync(root)) {
    const dir = join(root, name)
    if (!statSync(dir).isDirectory() || !isRealPackage(dir)) continue

    if (hasTestScript(dir)) {
      if (KNOWN_UNTESTED.has(name)) unexpectedlyFixed.push(name)
    } else {
      offenders.push({ name, root })
    }
  }
}

const unexpected = offenders.filter((o) => !KNOWN_UNTESTED.has(o.name))

for (const o of offenders) {
  const known = KNOWN_UNTESTED.has(o.name) ? 'known debt' : 'NEW'
  console.log(`  ${known === 'NEW' ? '✗' : '·'} ${o.root}/${o.name} — no test script (${known})`)
}

if (unexpectedlyFixed.length > 0) {
  console.log(
    `\n✓ Now tested — remove from KNOWN_UNTESTED: ${unexpectedlyFixed.join(', ')}`,
  )
}

if (unexpected.length > 0) {
  console.error(
    `\nFAIL — ${unexpected.length} package(s) added without a test script: ` +
      unexpected.map((o) => `${o.root}/${o.name}`).join(', ') +
      `\n\nturbo skips these silently, so CI would pass without testing them.` +
      `\nAdd  "test": "vitest run"  to package.json, or add the name to` +
      ` KNOWN_UNTESTED in scripts/assert-test-scripts.ts with a reason.`,
  )
  process.exit(1)
}

console.log(
  `\nPASS — ${offenders.length} known untested, 0 new. ` +
    `(debt register: ${[...KNOWN_UNTESTED].join(', ') || 'empty'})`,
)
