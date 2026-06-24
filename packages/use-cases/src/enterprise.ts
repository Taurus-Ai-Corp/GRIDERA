/**
 * Quantum-Resistant Enterprise Platform
 *
 * Enterprise blockchain platform on Hedera Hashgraph with ML-DSA signatures.
 * Ported from gridera/src/use-cases/QuantumEnterprisePlatform.js to TypeScript.
 */

import type { Client } from '@hiero-ledger/sdk';
import { AccountCreateTransaction, Hbar, PrivateKey } from '@hiero-ledger/sdk';
import { createHederaClient, submitToHCS, type HederaConfig } from '@taurus/hedera';
import {
  generateKeyPair,
  sign,
  verify,
  hashPayload,
  type PqcKeyPair,
  type StampableEntity,
} from '@taurus/pqc-crypto';

import type {
  AccountResult,
  OrganizationRecord,
  OrgData,
  SignedDocument,
  DocumentVerification,
} from './types.js';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  return new Uint8Array(
    normalized.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [],
  );
}

export class QuantumEnterprisePlatform {
  private readonly client: Client;
  private readonly organizations = new Map<string, OrganizationRecord>();
  private readonly documents = new Map<string, SignedDocument>();

  constructor(config: HederaConfig) {
    this.client = createHederaClient(config);
  }

  /**
   * Register an organization with quantum-resistant key pair.
   */
  async registerOrganization(orgData: OrgData): Promise<OrganizationRecord & AccountResult> {
    const keyPair: PqcKeyPair = generateKeyPair();
    const accountKey = PrivateKey.generateED25519();

    const response = await new AccountCreateTransaction()
      .setKey(accountKey.publicKey)
      .setInitialBalance(Hbar.fromTinybars(0))
      .execute(this.client);

    const receipt = await response.getReceipt(this.client);
    if (receipt.accountId === null) {
      throw new Error('AccountCreateTransaction succeeded but receipt contained no accountId');
    }

    const orgId = `ORG-${Date.now()}`;
    const stampable: StampableEntity = {
      type: 'system',
      id: orgId,
      payload: { orgData, accountId: receipt.accountId.toString() },
      jurisdiction: 'na',
    };
    const stamp = {
      hash: hashPayload(stampable.payload),
      signature: toHex(sign(new TextEncoder().encode(hashPayload(stampable.payload)), keyPair.secretKey)),
      publicKey: toHex(keyPair.publicKey),
      algorithm: 'ML-DSA-65' as const,
      timestamp: Date.now(),
    };

    const record: OrganizationRecord = {
      orgId,
      accountId: receipt.accountId.toString(),
      data: orgData,
      keyPair,
      stamp,
      createdAt: Date.now(),
    };
    this.organizations.set(orgId, record);

    return {
      ...record,
      txId: response.transactionId.toString(),
    };
  }

  /**
   * Sign a document with the organization's quantum-resistant key.
   */
  async signDocument(orgId: string, documentData: unknown): Promise<SignedDocument> {
    const org = this.organizations.get(orgId);
    if (!org) {
      throw new Error(`Organization not found: ${orgId}`);
    }

    const documentHash = hashPayload(documentData);
    const docBytes = new TextEncoder().encode(documentHash);
    const signature = sign(docBytes, org.keyPair.secretKey);

    const documentId = `DOC-${Date.now()}`;
    const signedDoc: SignedDocument = {
      documentId,
      orgId,
      documentHash,
      signature: toHex(signature),
      publicKey: toHex(org.keyPair.publicKey),
      algorithm: 'ML-DSA-65',
      timestamp: Date.now(),
    };
    this.documents.set(documentId, signedDoc);

    // Anchor to HCS if audit topic is configured
    const auditTopicId = (this.client as unknown as { auditTopicId?: string }).auditTopicId;
    if (auditTopicId) {
      const hcsResult = await submitToHCS(this.client, auditTopicId, JSON.stringify(signedDoc));
      signedDoc.hcsTxId = hcsResult.txId;
      signedDoc.hcsSequence = hcsResult.sequence;
    }

    return signedDoc;
  }

  /**
   * Verify a signed document.
   */
  verifyDocument(orgId: string, documentId: string, documentData: unknown): DocumentVerification {
    const org = this.organizations.get(orgId);
    const doc = this.documents.get(documentId);
    if (!org || !doc) {
      throw new Error('Organization or document not found');
    }

    const expectedHash = hashPayload(documentData);
    if (expectedHash !== doc.documentHash) {
      return {
        documentId,
        orgId,
        valid: false,
        timestamp: Date.now(),
      };
    }

    const valid = verify(
      new TextEncoder().encode(doc.documentHash),
      fromHex(doc.signature),
      fromHex(doc.publicKey),
    );

    return {
      documentId,
      orgId,
      valid,
      timestamp: Date.now(),
    };
  }

  /**
   * Get organization record.
   */
  getOrganization(orgId: string): OrganizationRecord | undefined {
    return this.organizations.get(orgId);
  }
}