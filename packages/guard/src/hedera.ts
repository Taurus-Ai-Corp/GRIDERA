/**
 * GRIDERA|Guard — Hedera HCS Anchoring
 *
 * Anchors guard attestations to Hedera Consensus Service (HCS) topics
 * for immutable, governed, carbon-negative audit trails.
 *
 * Falls back to no-op when Hedera SDK is unavailable.
 */

import type { GuardAttestation } from './types'

// ---------------------------------------------------------------------------
// Hedera Anchoring (optional dependency)
// ---------------------------------------------------------------------------

export interface HederaConfig {
  network: 'mainnet' | 'testnet' | 'previewnet'
  topicId: string
  operatorId?: string
  operatorKey?: string
}

export interface AnchorResult {
  txId: string
  topicId: string
  sequenceNumber: number
  timestamp: string
}

async function anchorToHedera(
  attestation: GuardAttestation,
  config: HederaConfig,
): Promise<AnchorResult> {
  if (!config.operatorId || !config.operatorKey) {
    throw new Error(
      'HCS submission requires HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY. ' +
      'Set these in .env.local. Get testnet credentials at portal.hedera.com (free, instant). ' +
      'Do NOT silently mock — audit trail integrity requires real submission.'
    )
  }

  const { createHederaClient, submitToHCS } = await import('@taurus/hedera')
  const client = createHederaClient({
    network: config.network,
    operatorId: config.operatorId,
    operatorKey: config.operatorKey,
  })

  const message = JSON.stringify({
    attestation_id: attestation.timestamp,
    guard_verdict: attestation.guard_verdict,
    signature: attestation.signature,
    algorithm: attestation.algorithm,
    jurisdiction: attestation.jurisdiction,
    model: attestation.model,
    tokens_in: attestation.tokens_in,
    tokens_out: attestation.tokens_out,
  })

  const { txId, sequence } = await submitToHCS(client, config.topicId, message)

  return {
    txId,
    topicId: config.topicId,
    sequenceNumber: sequence,
    timestamp: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function anchorAttestation(
  attestation: GuardAttestation,
  hederaConfig?: HederaConfig,
): Promise<GuardAttestation> {
  if (!hederaConfig) {
    return attestation
  }

  const result = await anchorToHedera(attestation, hederaConfig)

  return {
    ...attestation,
    hedera_tx_id: result.txId,
  }
}