import * as tls from 'tls'
import type { KeyExchangeInfo } from './types.js'

// The PQC hybrid group we probe for. X25519MLKEM768 (NIST ML-KEM-768 +
// classical X25519) is the group Chrome/Firefox/Cloudflare/Google have
// deployed by default in 2025-2026 — the de-facto standard hybrid.
export const PQC_HYBRID_GROUP = 'X25519MLKEM768'

// ML-KEM TLS groups require OpenSSL 3.5+. Node 20/22 bundle OpenSSL 3.0,
// Node 24 bundles 3.5, Node 25 bundles 3.6. On an incapable runtime the
// probe cannot distinguish "server refused" from "we can't even offer it",
// so we must report `null` (undetermined), never `false`.
export function runtimeSupportsMlKem(opensslVersion: string = process.versions.openssl): boolean {
  const match = /^(\d+)\.(\d+)/.exec(opensslVersion)
  if (!match) return false
  const major = Number(match[1])
  const minor = Number(match[2])
  if (major > 3) return true
  return major === 3 && minor >= 5
}

export interface ProbeOutcome {
  connected: boolean
  // A TLS-level handshake failure means the forced-TLS1.3 endpoint refused
  // our ML-KEM-only group offer — i.e. it does NOT support the hybrid.
  handshakeFailure: boolean
}

// Pure decision function — maps runtime capability + probe outcome to the
// reported result. Kept separate from the network call so every branch is
// unit-testable without a socket.
export function interpretProbeOutcome(
  runtimeCapable: boolean,
  outcome: ProbeOutcome | null,
): KeyExchangeInfo {
  const base = { detectionMethod: 'tls13-negotiation-probe' as const, group: undefined }

  if (!runtimeCapable) {
    return {
      ...base,
      hybridPqcSupported: null,
      detected: false,
      note: `scanner runtime OpenSSL ${process.versions.openssl} cannot negotiate ML-KEM (needs 3.5+); result undetermined`,
    }
  }

  if (outcome === null) {
    return {
      ...base,
      hybridPqcSupported: null,
      detected: true,
      note: 'probe inconclusive (network error or timeout, not a TLS refusal)',
    }
  }

  if (outcome.connected) {
    return {
      ...base,
      hybridPqcSupported: true,
      group: PQC_HYBRID_GROUP,
      detected: true,
      note: `negotiated ${PQC_HYBRID_GROUP} — quantum-safe key exchange (certificate signatures are separate)`,
    }
  }

  if (outcome.handshakeFailure) {
    return {
      ...base,
      hybridPqcSupported: false,
      detected: true,
      note: `endpoint refused ${PQC_HYBRID_GROUP} on a forced TLS 1.3 handshake`,
    }
  }

  return {
    ...base,
    hybridPqcSupported: null,
    detected: true,
    note: 'probe inconclusive',
  }
}

// A TLS 1.3 handshake_failure surfaces from OpenSSL as an SSL-routines
// alert. A connection reset / DNS / timeout is a transport error and must
// NOT be read as "unsupported".
function isHandshakeFailure(err: NodeJS.ErrnoException): boolean {
  const msg = (err.message || '').toLowerCase()
  const code = (err.code || '').toString().toLowerCase()
  if (code.startsWith('econn') || code === 'etimedout' || code === 'enotfound' || code === 'eai_again') {
    return false
  }
  return (
    msg.includes('ssl') ||
    msg.includes('handshake') ||
    msg.includes('alert') ||
    msg.includes('no shared') ||
    msg.includes('sslv3') ||
    code.includes('err_ssl')
  )
}

// Offers ONLY the PQC hybrid group on a hard-pinned TLS 1.3 handshake.
// Forcing minVersion=maxVersion=TLSv1.3 is what makes this discriminating:
// a non-supporting server cannot silently fall back to TLS 1.2 (where the
// group is irrelevant), so it fails the handshake instead.
export function probeHybridKex(domain: string, timeoutMs = 8000): Promise<KeyExchangeInfo> {
  const runtimeCapable = runtimeSupportsMlKem()
  if (!runtimeCapable) {
    return Promise.resolve(interpretProbeOutcome(false, null))
  }

  return new Promise((resolve) => {
    let settled = false
    const done = (outcome: ProbeOutcome | null) => {
      if (settled) return
      settled = true
      resolve(interpretProbeOutcome(true, outcome))
    }

    let socket: tls.TLSSocket
    try {
      socket = tls.connect({
        // rejectUnauthorized:false is intentional and safe: this is a
        // capability probe against arbitrary third-party endpoints, not a
        // trusting client. We transmit no data and destroy the socket on
        // handshake. Cert trust is irrelevant to whether the server offers
        // a PQC key-exchange group; cert validity is scanned separately.
        host: domain,
        port: 443,
        servername: domain,
        rejectUnauthorized: false,
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3',
        ecdhCurve: PQC_HYBRID_GROUP,
        timeout: timeoutMs,
      })
    } catch {
      // Some runtimes throw synchronously when the group is unknown
      done(null)
      return
    }

    socket.on('secureConnect', () => {
      done({ connected: true, handshakeFailure: false })
      socket.destroy()
    })
    socket.on('error', (err: NodeJS.ErrnoException) => {
      done({ connected: false, handshakeFailure: isHandshakeFailure(err) })
      socket.destroy()
    })
    socket.setTimeout(timeoutMs, () => {
      done(null)
      socket.destroy()
    })
  })
}
