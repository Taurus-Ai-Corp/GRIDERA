import { describe, expect, it } from 'vitest'
import { generateKeyPair } from '@taurus/pqc-crypto'
import { generateCBOM, signCBOM, verifyCBOM } from './cbom.js'
import type { ScanResult } from './types.js'

const rsaScan: ScanResult = {
  domain: 'legacy.example.com',
  scannedAt: '2026-07-13T00:00:00.000Z',
  tlsVersion: 'TLSv1.2',
  algorithms: [
    { name: 'RSA', keySize: 2048, grade: 'WEAK', vulnerable: true, severity: 'high' },
  ],
  certificates: [
    {
      subject: 'legacy.example.com',
      issuer: 'Example CA',
      validFrom: 'Jan 1 00:00:00 2026 GMT',
      validTo: 'Jan 1 00:00:00 2027 GMT',
      daysUntilExpiry: 172,
      serialNumber: '01',
      fingerprint: 'AA:BB:CC',
    },
  ],
}

const pqcScan: ScanResult = {
  domain: 'pqc.example.com',
  scannedAt: '2026-07-13T00:00:00.000Z',
  tlsVersion: 'TLSv1.3',
  algorithms: [
    { name: 'ML-DSA-65', keySize: 1952, grade: 'PQC_READY', vulnerable: false, severity: 'none' },
  ],
  certificates: [],
}

describe('generateCBOM', () => {
  it('produces a valid CycloneDX 1.6 skeleton', () => {
    const cbom = generateCBOM(rsaScan)
    expect(cbom.bomFormat).toBe('CycloneDX')
    expect(cbom.specVersion).toBe('1.6')
    expect(cbom.serialNumber).toMatch(
      /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(cbom.metadata.component.name).toBe('legacy.example.com')
    expect(cbom.metadata.timestamp).toBe(rsaScan.scannedAt)
  })

  it('maps classical RSA to nistQuantumSecurityLevel 0', () => {
    const cbom = generateCBOM(rsaScan)
    const algo = cbom.components.find(
      (c) => c.cryptoProperties.assetType === 'algorithm',
    )
    expect(algo?.cryptoProperties.algorithmProperties?.nistQuantumSecurityLevel).toBe(0)
    expect(algo?.cryptoProperties.algorithmProperties?.primitive).toBe('signature')
    expect(algo?.properties).toContainEqual({
      name: 'gridera:quantumVulnerable',
      value: 'true',
    })
  })

  it('maps ML-DSA-65 to nistQuantumSecurityLevel 3', () => {
    const cbom = generateCBOM(pqcScan)
    const algo = cbom.components.find(
      (c) => c.cryptoProperties.assetType === 'algorithm',
    )
    expect(algo?.cryptoProperties.algorithmProperties?.nistQuantumSecurityLevel).toBe(3)
  })

  it('emits certificate and protocol components', () => {
    const cbom = generateCBOM(rsaScan)
    const cert = cbom.components.find(
      (c) => c.cryptoProperties.assetType === 'certificate',
    )
    expect(cert?.cryptoProperties.certificateProperties?.subjectName).toBe('legacy.example.com')
    expect(cert?.cryptoProperties.certificateProperties?.issuerName).toBe('Example CA')
    // Node TLS date strings must be normalized to RFC 3339 for the 1.6 schema
    expect(cert?.cryptoProperties.certificateProperties?.notValidAfter).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    )

    const protocol = cbom.components.find(
      (c) => c.cryptoProperties.assetType === 'protocol',
    )
    expect(protocol?.cryptoProperties.protocolProperties?.version).toBe('TLSv1.2')
  })
})

describe('signCBOM / verifyCBOM', () => {
  it('round-trips a detached ML-DSA-65 signature', () => {
    const { publicKey, secretKey } = generateKeyPair()
    const cbom = generateCBOM(rsaScan)
    const signed = signCBOM(cbom, secretKey, publicKey)
    expect(signed.signature.algorithm).toBe('ML-DSA-65')
    expect(verifyCBOM(signed)).toBe(true)
  })

  it('rejects a tampered CBOM', () => {
    const { publicKey, secretKey } = generateKeyPair()
    const cbom = generateCBOM(rsaScan)
    const signed = signCBOM(cbom, secretKey, publicKey)
    signed.cbom.components[0]!.name = 'TAMPERED'
    expect(verifyCBOM(signed)).toBe(false)
  })
})
