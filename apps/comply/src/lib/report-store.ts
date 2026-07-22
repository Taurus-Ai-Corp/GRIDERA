/**
 * Singleton in-memory store for compliance reports.
 * Shared across all route handlers in a single Next.js server process.
 * Swap for Neon DB queries when DATABASE_URL is provisioned.
 */

export interface Report {
  id: string
  assessmentId: string
  userId: string
  content: string // markdown
  mode: 'template' | 'cloud' | 'sovereign'
  model?: string
  /** Bound to JurisdictionConfig.documentTypes (e.g. pqc_readiness_report) */
  documentType?: string
  pqcHash?: string
  pqcSignature?: string
  pqcPublicKey?: string
  hederaTxId?: string
  createdAt: string
}

// Module-level singleton — persists for the lifetime of the server process
export const reportsStore = new Map<string, Report[]>()
