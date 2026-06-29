/**
 * GRIDERA|Guard — Audit Trail Persistence
 *
 * Pluggable audit adapter for writing guard attestations to storage.
 * Default: no-op (fire-and-forget). Override with custom adapter.
 */

import type { GuardAttestation, AuditAdapter, AuditFilter } from './types'

// ---------------------------------------------------------------------------
// No-op Adapter (default — guard works without storage)
// ---------------------------------------------------------------------------

export const noopAdapter: AuditAdapter = {
  async write(_attestation: GuardAttestation): Promise<void> {
    // No-op — guard works even without storage
  },
  async read(_id: string): Promise<GuardAttestation | null> {
    return null
  },
  async query(_filter: AuditFilter): Promise<GuardAttestation[]> {
    return []
  },
}

// ---------------------------------------------------------------------------
// In-Memory Adapter (for testing and development)
// ---------------------------------------------------------------------------

export class InMemoryAuditAdapter implements AuditAdapter {
  private store: Map<string, GuardAttestation> = new Map()

  async write(attestation: GuardAttestation): Promise<void> {
    const id = attestation.timestamp + '-' + crypto.randomUUID()
    this.store.set(id, attestation)
  }

  async read(id: string): Promise<GuardAttestation | null> {
    return this.store.get(id) ?? null
  }

  async query(filter: AuditFilter): Promise<GuardAttestation[]> {
    let results = Array.from(this.store.values())

    if (filter.jurisdiction) {
      results = results.filter(a => a.jurisdiction === filter.jurisdiction)
    }
    if (filter.verdict) {
      results = results.filter(a => a.guard_verdict === filter.verdict)
    }
    if (filter.model) {
      results = results.filter(a => a.model === filter.model)
    }
    if (filter.fromTimestamp) {
      results = results.filter(a => a.timestamp >= filter.fromTimestamp!)
    }
    if (filter.toTimestamp) {
      results = results.filter(a => a.timestamp <= filter.toTimestamp!)
    }

    const offset = filter.offset ?? 0
    const limit = filter.limit ?? 100
    return results.slice(offset, offset + limit)
  }

  /** Clear all stored attestations (for testing) */
  clear(): void {
    this.store.clear()
  }

  /** Count stored attestations */
  get count(): number {
    return this.store.size
  }
}