import { sign, verify } from '@taurus/pqc-crypto'
import { shake256 } from '@noble/hashes/sha3'
import type { JwtHeader, JwtPayload, JwtToken } from './types.js'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function base64urlEncode(data: Uint8Array): string {
  return Buffer.from(data)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (padded.length % 4)) % 4
  return new Uint8Array(Buffer.from(padded + '='.repeat(padLen), 'base64'))
}

function encodeJwtPart(obj: unknown): string {
  return base64urlEncode(encoder.encode(JSON.stringify(obj)))
}

function decodeJwtPart<T>(str: string): T {
  return JSON.parse(decoder.decode(base64urlDecode(str))) as T
}

export function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  secretKey: Uint8Array,
  options: { expiresIn: number; kid: string },
): JwtToken {
  const now = Math.floor(Date.now() / 1000)

  const header: JwtHeader = {
    alg: 'ML-DSA-65',
    typ: 'JWT',
    kid: options.kid,
  }

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + options.expiresIn,
  }

  const headerEncoded = encodeJwtPart(header)
  const payloadEncoded = encodeJwtPart(fullPayload)

  const message = encoder.encode(`${headerEncoded}.${payloadEncoded}`)
  const hash = shake256(message, { dkLen: 64 })
  const signature = sign(hash, secretKey)

  return {
    token: `${headerEncoded}.${payloadEncoded}.${base64urlEncode(signature)}`,
    payload: fullPayload,
    expiresAt: new Date(fullPayload.exp * 1000),
  }
}

export function verifyJwt(token: string, publicKey: Uint8Array): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerEncoded, payloadEncoded, signatureEncoded] = parts
  if (!signatureEncoded || !payloadEncoded) return null

  const message = encoder.encode(`${headerEncoded}.${payloadEncoded}`)

  try {
    const signature = base64urlDecode(signatureEncoded)
    const hash = shake256(message, { dkLen: 64 })
    const valid = verify(hash, signature, publicKey)
    if (!valid) return null

    const payload = decodeJwtPart<JwtPayload>(payloadEncoded)
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null

    return payload
  } catch {
    return null
  }
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  if (!parts[1]) return null
  try {
    return decodeJwtPart<JwtPayload>(parts[1])
  } catch {
    return null
  }
}
