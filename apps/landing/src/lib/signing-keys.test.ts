import { describe, expect, it } from 'vitest'
import { generateKeyPair } from '@taurus/pqc-crypto'
import { loadSigningKeys } from './signing-keys'

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

describe('loadSigningKeys', () => {
  it('uses the platform pair when it self-verifies', async () => {
    const pair = generateKeyPair()
    const keys = await loadSigningKeys({
      publicKeyHex: toHex(pair.publicKey),
      secretKeyHex: toHex(pair.secretKey),
    })
    expect(keys.source).toBe('platform')
    expect(keys.publicKey).toEqual(pair.publicKey)
  })

  it('falls back to ephemeral when the public key does not match the secret key', async () => {
    // The 2026-07-14 production incident: both keys valid ML-DSA-65 keys,
    // but from different pairs — signatures never verified
    const pairA = generateKeyPair()
    const pairB = generateKeyPair()
    const keys = await loadSigningKeys({
      publicKeyHex: toHex(pairB.publicKey),
      secretKeyHex: toHex(pairA.secretKey),
    })
    expect(keys.source).toBe('ephemeral')
    expect(keys.publicKey).not.toEqual(pairB.publicKey)
  })

  it('falls back to ephemeral when keys are malformed hex', async () => {
    const keys = await loadSigningKeys({
      publicKeyHex: 'zz-not-hex',
      secretKeyHex: 'deadbeef',
    })
    expect(keys.source).toBe('ephemeral')
  })

  it('falls back to ephemeral when env keys are absent', async () => {
    const keys = await loadSigningKeys({})
    expect(keys.source).toBe('ephemeral')
    expect(keys.publicKey.length).toBe(1952)
    expect(keys.secretKey.length).toBe(4032)
  })
})
