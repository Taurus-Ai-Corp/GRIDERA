// In-memory scan result store used by /api/scan and /api/qrep/[id].
// This is an MVP shortcut: serverless instances each have their own Map, so a
// scan created on instance A can only be read by instance A until a shared DB
// replaces this. Entries expire after 60 minutes to limit memory growth.

export interface StoredScanResult {
  scanId: string
  domain: string
  qrsScore: unknown
  algorithms: unknown[]
  certificates: unknown[]
  recommendations: unknown[]
  tlsVersion: string
  scannedAt: string
  error?: string
  pqcStamp: unknown
  createdAt: number
}

export const scanStore = new Map<string, StoredScanResult>()

export function storeScanResult(result: StoredScanResult): void {
  scanStore.set(result.scanId, result)
}

export function getScanResult(scanId: string): StoredScanResult | undefined {
  const result = scanStore.get(scanId)
  if (!result) return undefined
  if (Date.now() - result.createdAt > 60 * 60 * 1000) {
    scanStore.delete(scanId)
    return undefined
  }
  return result
}
