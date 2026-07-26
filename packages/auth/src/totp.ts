import { TOTP } from 'otpauth'
import { randomBytes } from '@noble/hashes/utils'

export function generateTotpSecret(): { secret: string; uri: string } {
  const secretBytes = randomBytes(20)
  const secret = base32Encode(secretBytes)

  const totp = new TOTP({
    issuer: 'GRIDERA',
    label: '',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })

  return {
    secret,
    uri: totp.toString(),
  }
}

export function verifyTotp(secret: string, token: string): boolean {
  const totp = new TOTP({
    issuer: 'GRIDERA',
    label: '',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })

  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}

export function getTotpUri(secret: string, email: string): string {
  const totp = new TOTP({
    issuer: 'GRIDERA',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  })
  return totp.toString()
}

function base32Encode(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  let bits = 0
  let value = 0

  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31]
  }

  return result
}
