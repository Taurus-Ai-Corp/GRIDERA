/**
 * @taurus/guard — Core Type Definitions
 *
 * Public API surface for GRIDERA|Guard:
 * PQC-attested AI guardrails with jurisdiction-aware compliance mapping.
 */

// ---------------------------------------------------------------------------
// Guard Input / Output
// ---------------------------------------------------------------------------

export interface GuardInput {
  /** The prompt to validate before sending to LLM */
  prompt: string
  /** Function that calls the LLM and returns its response */
  llmCall: () => Promise<string>
  /** Jurisdiction code: 'eu' | 'us' | 'ca' | 'uk' | 'global' */
  jurisdiction: JurisdictionCode
  /** LLM model identifier for pricing/attestation */
  model?: string
  /** Max input tokens (default: 8192) */
  maxTokens?: number
  /** Custom rules to append to the preset rules */
  customRules?: GuardRule[]
  /** Preset to use for jurisdiction-aware rules */
  preset?: JurisdictionPreset
}

export interface GuardResult {
  /** The LLM response (undefined if blocked) */
  response?: string
  /** Whether the call was blocked by a guard rule */
  blocked: boolean
  /** Human-readable reason for blocking */
  blockReason?: string
  /** PQC-signed attestation proving the guard was applied */
  attestation: GuardAttestation
}

// ---------------------------------------------------------------------------
// Attestation
// ---------------------------------------------------------------------------

export interface GuardAttestation {
  /** Input rule verdicts */
  input_verdicts: GuardVerdict[]
  /** Output rule verdicts */
  output_verdicts: GuardVerdict[]
  /** LLM model used */
  model: string
  /** Estimated input token count */
  tokens_in: number
  /** Estimated output token count */
  tokens_out: number
  /** Estimated cost in USD */
  cost_usd: number
  /** LLM call latency in milliseconds */
  latency_ms: number
  /** Jurisdiction code */
  jurisdiction: string
  /** Overall guard verdict */
  guard_verdict: GuardVerdictStatus
  /** ML-DSA-65 PQC signature (or SHA-256 fallback) */
  signature: string
  /** Signing algorithm used */
  algorithm: string
  /** ISO 8601 timestamp */
  timestamp: string
  /** Hedera HCS transaction ID (if anchored) */
  hedera_tx_id?: string
}

// ---------------------------------------------------------------------------
// Verdicts
// ---------------------------------------------------------------------------

export type GuardVerdictStatus = 'pass' | 'block' | 'warn'
export type JurisdictionCode = 'eu' | 'us' | 'ca' | 'uk' | 'global'
export type JurisdictionPreset = 'eu-ai-act' | 'nist-ai-rmf' | 'soc2' | 'default'

export interface GuardVerdict {
  /** Whether the check passed */
  pass: boolean
  /** Rule name that was checked */
  rule: string
  /** Why it failed (if pass=false) */
  reason?: string
  /** How severe the failure is */
  severity: 'block' | 'warn'
  /** ISO 8601 timestamp */
  timestamp: string
}

// ---------------------------------------------------------------------------
// Guard Rules
// ---------------------------------------------------------------------------

export interface GuardContext {
  jurisdiction: JurisdictionCode
  maxTokens?: number
  preset?: JurisdictionPreset
}

export interface GuardRule {
  /** Unique rule name (e.g. 'no-pii', 'token-limit') */
  name: string
  /** Failure severity: 'block' stops the call, 'warn' logs but proceeds */
  severity: 'block' | 'warn'
  /** The check function */
  check: (input: string, context: GuardContext) => { pass: boolean; reason?: string }
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export interface ModelPricing {
  /** Cost per 1K input tokens in USD */
  inputPer1K: number
  /** Cost per 1K output tokens in USD */
  outputPer1K: number
}

export type ModelPricingTable = Record<string, ModelPricing>

// ---------------------------------------------------------------------------
// Guard Configuration
// ---------------------------------------------------------------------------

export interface GuardConfig {
  /** PQC signing configuration (optional — falls back to SHA-256) */
  pqc?: {
    publicKeyHex?: string
    secretKeyHex?: string
  }
  /** Hedera HCS anchoring configuration (optional) */
  hedera?: {
    network: 'mainnet' | 'testnet' | 'previewnet'
    topicId: string
    operatorId?: string
    operatorKey?: string
  }
  /** Audit trail storage adapter (optional — defaults to no-op) */
  auditAdapter?: AuditAdapter
  /** Model pricing table (optional — uses built-in defaults) */
  pricing?: ModelPricingTable
  /** Default jurisdiction */
  defaultJurisdiction?: JurisdictionCode
  /** Default preset */
  defaultPreset?: JurisdictionPreset
  /** Default max tokens */
  defaultMaxTokens?: number
}

// ---------------------------------------------------------------------------
// Audit Adapter (pluggable storage)
// ---------------------------------------------------------------------------

export interface AuditAdapter {
  /** Write attestation to audit trail (non-blocking) */
  write(attestation: GuardAttestation): Promise<void>
  /** Read attestation by ID */
  read(id: string): Promise<GuardAttestation | null>
  /** Query attestations with filters */
  query(filter: AuditFilter): Promise<GuardAttestation[]>
}

export interface AuditFilter {
  jurisdiction?: JurisdictionCode
  verdict?: GuardVerdictStatus
  model?: string
  fromTimestamp?: string
  toTimestamp?: string
  limit?: number
  offset?: number
}

// ---------------------------------------------------------------------------
// Guard Instance (returned by createGuard)
// ---------------------------------------------------------------------------

export interface GuardInstance {
  /** Main guard function — wraps an LLM call with input/output validation */
  execute(input: GuardInput): Promise<GuardResult>
  /** Input-only validation (no LLM call) */
  checkInput(prompt: string, context?: Partial<GuardContext>): GuardVerdict[]
  /** Output-only validation (no LLM call) */
  checkOutput(response: string, context?: Partial<GuardContext>): GuardVerdict[]
  /** Retrieve a signed attestation by ID */
  getAttestation(id: string): Promise<GuardAttestation | null>
  /** Anchor an attestation to Hedera HCS */
  anchorAttestation(attestation: GuardAttestation): Promise<{ txId: string }>
}