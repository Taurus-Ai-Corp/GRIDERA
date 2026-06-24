/**
 * Quantum-Resistant Healthcare Platform
 *
 * Secure patient data management on Hedera Hashgraph with ML-DSA signatures.
 * Ported from gridera/src/use-cases/QuantumHealthcarePlatform.js to TypeScript.
 */

import type { Client } from '@hiero-ledger/sdk';
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
  PatientData,
  PatientRecord,
  SignedPatientRecord,
  PatientRecordVerification,
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

export class QuantumHealthcarePlatform {
  private readonly client: Client;
  private readonly patients = new Map<string, PatientRecord>();
  private readonly signedRecords = new Map<string, SignedPatientRecord>();

  constructor(config: HederaConfig) {
    this.client = createHederaClient(config);
  }

  /**
   * Create a quantum-resistant patient record.
   */
  async createPatientRecord(patientData: PatientData): Promise<PatientRecord> {
    const keyPair: PqcKeyPair = generateKeyPair();
    const patientId = `PAT-${Date.now()}`;

    const stampable: StampableEntity = {
      type: 'consent',
      id: patientId,
      payload: patientData,
      jurisdiction: 'na',
    };
    const stamp = {
      hash: hashPayload(stampable.payload),
      signature: toHex(sign(new TextEncoder().encode(hashPayload(stampable.payload)), keyPair.secretKey)),
      publicKey: toHex(keyPair.publicKey),
      algorithm: 'ML-DSA-65' as const,
      timestamp: Date.now(),
    };

    const record: PatientRecord = {
      patientId,
      data: patientData,
      keyPair,
      stamp,
      createdAt: Date.now(),
    };
    this.patients.set(patientId, record);

    return record;
  }

  /**
   * Sign a patient record entry (e.g., a diagnosis or treatment).
   */
  async signPatientRecord(patientId: string, recordData: unknown): Promise<SignedPatientRecord> {
    const patient = this.patients.get(patientId);
    if (!patient) {
      throw new Error(`Patient not found: ${patientId}`);
    }

    const recordHash = hashPayload(recordData);
    const signature = sign(new TextEncoder().encode(recordHash), patient.keyPair.secretKey);

    const recordId = `REC-${Date.now()}`;
    const signedRecord: SignedPatientRecord = {
      recordId,
      patientId,
      recordHash,
      signature: toHex(signature),
      publicKey: toHex(patient.keyPair.publicKey),
      algorithm: 'ML-DSA-65',
      timestamp: Date.now(),
    };
    this.signedRecords.set(recordId, signedRecord);

    // Anchor to HCS if audit topic is configured
    const auditTopicId = (this.client as unknown as { auditTopicId?: string }).auditTopicId;
    if (auditTopicId) {
      const hcsResult = await submitToHCS(this.client, auditTopicId, JSON.stringify(signedRecord));
      signedRecord.hcsTxId = hcsResult.txId;
      signedRecord.hcsSequence = hcsResult.sequence;
    }

    return signedRecord;
  }

  /**
   * Verify a signed patient record.
   */
  verifyPatientRecord(patientId: string, recordId: string, recordData: unknown): PatientRecordVerification {
    const patient = this.patients.get(patientId);
    const signedRecord = this.signedRecords.get(recordId);
    if (!patient || !signedRecord) {
      throw new Error('Patient or signed record not found');
    }

    const expectedHash = hashPayload(recordData);
    if (expectedHash !== signedRecord.recordHash) {
      return { recordId, patientId, valid: false, timestamp: Date.now() };
    }

    const valid = verify(
      new TextEncoder().encode(signedRecord.recordHash),
      fromHex(signedRecord.signature),
      fromHex(signedRecord.publicKey),
    );

    return { recordId, patientId, valid, timestamp: Date.now() };
  }

  /**
   * Get patient record.
   */
  getPatientRecord(patientId: string): PatientRecord | undefined {
    return this.patients.get(patientId);
  }
}