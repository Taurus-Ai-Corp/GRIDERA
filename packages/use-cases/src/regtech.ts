/**
 * Quantum-Resistant RegTech Compliance Platform
 *
 * Automated compliance and audit trails on Hedera Hashgraph with ML-DSA signatures.
 * Ported from gridera/src/use-cases/QuantumRegTech.js to TypeScript.
 */

import type { Client } from '@hiero-ledger/sdk';
import { createHederaClient, submitToHCS, createTopic, type HederaConfig } from '@taurus/hedera';
import {
  generateKeyPair,
  sign,
  hashPayload,
  type PqcKeyPair,
  type StampableEntity,
} from '@taurus/pqc-crypto';

import type {
  ComplianceRuleData,
  ComplianceRuleRecord,
  AuditEntry,
} from './types.js';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class QuantumRegTech {
  private readonly client: Client;
  private readonly config: HederaConfig;
  private readonly rules = new Map<string, ComplianceRuleRecord>();
  private readonly auditTrails = new Map<string, AuditEntry[]>();
  private readonly keyPair: PqcKeyPair;
  private auditTopicId: string | null = null;

  constructor(config: HederaConfig) {
    this.client = createHederaClient(config);
    this.config = config;
    this.keyPair = generateKeyPair();
  }

  /**
   * Ensure an HCS audit topic exists. Uses config.auditTopicId if available,
   * otherwise creates a new topic.
   */
  private async ensureAuditTopic(): Promise<string> {
    if (this.auditTopicId) return this.auditTopicId;
    if (this.config.auditTopicId) {
      this.auditTopicId = this.config.auditTopicId;
      return this.auditTopicId;
    }
    this.auditTopicId = await createTopic(this.client, 'regtech-audit-trail');
    return this.auditTopicId;
  }

  /**
   * Create a compliance rule with quantum signature.
   */
  async createComplianceRule(ruleData: ComplianceRuleData): Promise<ComplianceRuleRecord> {
    const stampable: StampableEntity = {
      type: 'audit',
      id: ruleData.ruleId,
      payload: ruleData,
      jurisdiction: 'na',
    };
    const stamp = {
      hash: hashPayload(stampable.payload),
      signature: toHex(sign(new TextEncoder().encode(hashPayload(stampable.payload)), this.keyPair.secretKey)),
      publicKey: toHex(this.keyPair.publicKey),
      algorithm: 'ML-DSA-65' as const,
      timestamp: Date.now(),
    };

    const record: ComplianceRuleRecord = {
      ruleId: ruleData.ruleId,
      data: ruleData,
      stamp,
      createdAt: Date.now(),
    };
    this.rules.set(ruleData.ruleId, record);

    return record;
  }

  /**
   * Audit an entity against a compliance rule. Anchors the audit entry to HCS.
   */
  async auditCompliance(entityId: string, ruleId: string, data: unknown): Promise<AuditEntry> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Compliance rule not found: ${ruleId}`);
    }

    const dataHash = hashPayload(data);
    const signature = sign(new TextEncoder().encode(dataHash), this.keyPair.secretKey);

    const auditId = `AUDIT-${Date.now()}`;
    const entry: AuditEntry = {
      auditId,
      entityId,
      ruleId,
      dataHash,
      signature: toHex(signature),
      publicKey: toHex(this.keyPair.publicKey),
      algorithm: 'ML-DSA-65',
      compliant: true,
      timestamp: Date.now(),
    };

    // Anchor to HCS
    const topicId = await this.ensureAuditTopic();
    const hcsResult = await submitToHCS(this.client, topicId, JSON.stringify(entry));
    entry.hcsTxId = hcsResult.txId;
    entry.hcsSequence = hcsResult.sequence;

    // Store in audit trail
    const trail = this.auditTrails.get(entityId) ?? [];
    trail.push(entry);
    this.auditTrails.set(entityId, trail);

    return entry;
  }

  /**
   * Get the audit trail for an entity.
   */
  getAuditTrail(entityId: string): AuditEntry[] {
    return this.auditTrails.get(entityId) ?? [];
  }
}