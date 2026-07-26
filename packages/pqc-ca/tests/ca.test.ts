/**
 * Round-trip tests for the reconstructed @taurus/pqc-ca.
 *
 * PROVENANCE — read before trusting this package. The source of this package was
 * never committed to this repository (0 commits across every local and remote
 * ref) and existed on one machine only as compiled `dist/` output. It was
 * reconstructed on 2026-07-26 from that output: unminified `tsc` emit with
 * comments intact, plus the `.d.ts` files for the type annotations `tsc` had
 * stripped. Nothing imports this package.
 *
 * That makes these tests load-bearing in an unusual way. They are not here to
 * characterize known-good code — they are the only evidence the reconstruction
 * is faithful. The chain test in particular exercises real ML-DSA-65 signing and
 * verification end to end, so a transcription error in the canonicalization, the
 * hex helpers, or the issuer-hash binding would surface as a verification
 * failure rather than passing silently.
 *
 * No network and no fixtures: every key is generated in-process.
 */
import { describe, expect, it } from 'vitest'
import {
  CertificateAuthority,
  verifyCertificate,
  verifyCertificateChain,
  isCertificateExpired,
  canonicalize,
} from '../src/index.js'

describe('CertificateAuthority — root', () => {
  it('creates a self-signed root CA that verifies against its own key', () => {
    const root = CertificateAuthority.createRootCA('GRIDERA Root CA')
    const cert = root.getCertificate()

    expect(cert.version).toBe('1.0')
    expect(cert.subject.cn).toBe('GRIDERA Root CA')
    // Self-signed: issuer and subject are the same entity.
    expect(cert.issuer.cn).toBe(cert.subject.cn)
    expect(cert.issuer.o).toBe(cert.subject.o)
    expect(cert.extensions).toMatchObject({ ca: true, role: 'root-ca' })
    expect(root.role).toBe('root-ca')

    expect(verifyCertificate(cert, root.getPublicKey())).toBe(true)
  })

  it('emits a real ML-DSA-65 signature and public key at the FIPS 204 sizes', () => {
    const root = CertificateAuthority.createRootCA('Sizes')
    const cert = root.getCertificate()

    expect(cert.signature.algorithm).toBe('ML-DSA-65')
    expect(cert.publicKey.algorithm).toBe('ML-DSA-65')
    // 3309-byte signature and 1952-byte public key, hex-encoded.
    expect(cert.signature.value.length / 2).toBe(3309)
    expect(cert.publicKey.key.length / 2).toBe(1952)
    expect(root.getPublicKey().length).toBe(1952)
  })

  it('issues a root certificate valid for 10 years', () => {
    const cert = CertificateAuthority.createRootCA('Validity').getCertificate()
    const days =
      (new Date(cert.notAfter).getTime() - new Date(cert.notBefore).getTime()) /
      86_400_000
    expect(Math.round(days)).toBe(3650)
    expect(isCertificateExpired(cert)).toBe(false)
  })

  it('gives every certificate a distinct serial', () => {
    const a = CertificateAuthority.createRootCA('A').getCertificate()
    const b = CertificateAuthority.createRootCA('B').getCertificate()
    expect(a.serial).not.toBe(b.serial)
  })
})

describe('certificate chain — agent → org CA → root CA', () => {
  it('verifies a full three-link chain', () => {
    const root = CertificateAuthority.createRootCA('GRIDERA Root CA')
    const org = CertificateAuthority.createOrgCA('GRIDERA EU', 'eu', root)
    const agent = org.issueCertificate({
      subject: { cn: 'agent-001', o: 'TAURUS AI Corp', c: 'eu' },
      role: 'agent',
      validityDays: 90,
    })

    expect(
      verifyCertificateChain(agent, org.getCertificate(), root.getCertificate()),
    ).toBe(true)
  })

  it('rejects a chain whose root is not the real issuer of the org CA', () => {
    const root = CertificateAuthority.createRootCA('Real Root')
    const impostor = CertificateAuthority.createRootCA('Impostor Root')
    const org = CertificateAuthority.createOrgCA('Org', 'eu', root)
    const agent = org.issueCertificate({
      subject: { cn: 'agent', o: 'TAURUS AI Corp', c: 'eu' },
      role: 'agent',
      validityDays: 30,
    })

    expect(
      verifyCertificateChain(agent, org.getCertificate(), impostor.getCertificate()),
    ).toBe(false)
  })

  it('rejects an agent certificate issued by a different org CA', () => {
    const root = CertificateAuthority.createRootCA('Root')
    const orgA = CertificateAuthority.createOrgCA('Org A', 'eu', root)
    const orgB = CertificateAuthority.createOrgCA('Org B', 'na', root)
    const agentOfB = orgB.issueCertificate({
      subject: { cn: 'agent-b', o: 'TAURUS AI Corp', c: 'na' },
      role: 'agent',
      validityDays: 30,
    })

    // Presented as though orgA had issued it.
    expect(
      verifyCertificateChain(agentOfB, orgA.getCertificate(), root.getCertificate()),
    ).toBe(false)
  })

  it('binds the org CA certificate to the root that signed it', () => {
    const root = CertificateAuthority.createRootCA('Root')
    const org = CertificateAuthority.createOrgCA('Org', 'eu', root)
    const orgCert = org.getCertificate()

    expect(orgCert.issuer.cn).toBe('Root')
    expect(orgCert.subject.c).toBe('eu')
    expect(orgCert.extensions).toMatchObject({ ca: true, role: 'org-ca' })
    // Signed by the root's key, not its own.
    expect(verifyCertificate(orgCert, root.getPublicKey())).toBe(true)
    expect(verifyCertificate(orgCert, org.getPublicKey())).toBe(false)
  })
})

describe('tamper detection', () => {
  it('rejects a certificate whose subject was altered after signing', () => {
    const root = CertificateAuthority.createRootCA('Root')
    const cert = root.getCertificate()
    const tampered = { ...cert, subject: { ...cert.subject, cn: 'someone-else' } }

    expect(verifyCertificate(cert, root.getPublicKey())).toBe(true)
    expect(verifyCertificate(tampered, root.getPublicKey())).toBe(false)
  })

  it('rejects a certificate whose validity window was extended', () => {
    const root = CertificateAuthority.createRootCA('Root')
    const cert = root.getCertificate()
    const tampered = { ...cert, notAfter: '2099-01-01T00:00:00.000Z' }

    expect(verifyCertificate(tampered, root.getPublicKey())).toBe(false)
  })

  it('rejects a certificate verified against the wrong issuer key', () => {
    const root = CertificateAuthority.createRootCA('Root')
    const other = CertificateAuthority.createRootCA('Other')

    // Fails on the issuerKeyHash check before the signature is even examined.
    expect(verifyCertificate(root.getCertificate(), other.getPublicKey())).toBe(false)
  })
})

describe('canonicalize', () => {
  it('excludes the signature block from the signed bytes', () => {
    const cert = CertificateAuthority.createRootCA('Root').getCertificate()
    const canonical = canonicalize(cert)

    expect(canonical).not.toContain(cert.signature.value)
    expect(canonical).toContain(cert.serial)
  })

  it('is stable regardless of key insertion order', () => {
    const cert = CertificateAuthority.createRootCA('Root').getCertificate()
    // Rebuild with the top-level keys in reverse order.
    const reordered = Object.fromEntries(
      Object.entries(cert).reverse(),
    ) as typeof cert

    expect(canonicalize(reordered)).toBe(canonicalize(cert))
  })

  it('sorts nested object keys recursively', () => {
    const cert = CertificateAuthority.createRootCA('Root').getCertificate()
    const nestedReordered = {
      ...cert,
      subject: {
        c: cert.subject.c,
        o: cert.subject.o,
        cn: cert.subject.cn,
      },
    }
    expect(canonicalize(nestedReordered)).toBe(canonicalize(cert))
  })
})

describe('isCertificateExpired', () => {
  it('reports a certificate outside its validity window as expired', () => {
    const cert = CertificateAuthority.createRootCA('Root').getCertificate()

    expect(isCertificateExpired(cert)).toBe(false)
    expect(
      isCertificateExpired({ ...cert, notAfter: '2000-01-01T00:00:00.000Z' }),
    ).toBe(true)
    expect(
      isCertificateExpired({ ...cert, notBefore: '2099-01-01T00:00:00.000Z' }),
    ).toBe(true)
  })
})
