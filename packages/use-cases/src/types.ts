import type { PqcKeyPair, PqcStamp } from '@taurus/pqc-crypto';

/**
 * Result of creating a Hedera token (CBDC or fungible supply).
 */
export interface TokenResult {
  tokenId: string;
  txId: string;
}

/**
 * Result of creating a Hedera account (e.g. wallet, org treasury).
 */
export interface AccountResult {
  accountId: string;
  txId: string;
}

/**
 * Result of a token transfer.
 */
export interface TransferResult {
  txId: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  signature: string;
}

/**
 * Balance of a wallet/account for a specific token.
 */
export interface WalletBalance {
  walletId: string;
  tokenId: string;
  balance: number;
}

/**
 * A quantum-signed wallet record.
 */
export interface WalletRecord {
  walletId: string;
  accountId: string;
  ownerId: string;
  keyPair: PqcKeyPair;
  createdAt: number;
}

/**
 * Data required to register an organization.
 */
export interface OrgData {
  name: string;
  industry: string;
  jurisdiction: string;
  contactEmail: string;
  metadata?: Record<string, string>;
}

/**
 * A quantum-signed organization record.
 */
export interface OrganizationRecord {
  orgId: string;
  accountId: string;
  data: OrgData;
  keyPair: PqcKeyPair;
  stamp: PqcStamp;
  createdAt: number;
}

/**
 * A document signed by an organization.
 */
export interface SignedDocument {
  documentId: string;
  orgId: string;
  documentHash: string;
  signature: string;
  publicKey: string;
  algorithm: 'ML-DSA-65';
  timestamp: number;
  hcsTxId?: string;
  hcsSequence?: number;
}

/**
 * Verification result for a document.
 */
export interface DocumentVerification {
  documentId: string;
  orgId: string;
  valid: boolean;
  timestamp: number;
}

/**
 * Data required to create a patient record.
 */
export interface PatientData {
  name: string;
  dateOfBirth: string;
  ssnLast4: string;
  diagnoses: string[];
  medications: string[];
  metadata?: Record<string, string>;
}

/**
 * A quantum-signed patient record.
 */
export interface PatientRecord {
  patientId: string;
  data: PatientData;
  keyPair: PqcKeyPair;
  stamp: PqcStamp;
  createdAt: number;
}

/**
 * A signed patient record entry (signed by a provider).
 */
export interface SignedPatientRecord {
  recordId: string;
  patientId: string;
  recordHash: string;
  signature: string;
  publicKey: string;
  algorithm: 'ML-DSA-65';
  timestamp: number;
  hcsTxId?: string;
  hcsSequence?: number;
}

/**
 * Verification result for a patient record.
 */
export interface PatientRecordVerification {
  recordId: string;
  patientId: string;
  valid: boolean;
  timestamp: number;
}

/**
 * Data required to create a compliance rule.
 */
export interface ComplianceRuleData {
  ruleId: string;
  title: string;
  description: string;
  jurisdiction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  checks: string[];
}

/**
 * A quantum-stamped compliance rule.
 */
export interface ComplianceRuleRecord {
  ruleId: string;
  data: ComplianceRuleData;
  stamp: PqcStamp;
  createdAt: number;
}

/**
 * An audit entry on the audit trail.
 */
export interface AuditEntry {
  auditId: string;
  entityId: string;
  ruleId: string;
  dataHash: string;
  signature: string;
  publicKey: string;
  algorithm: 'ML-DSA-65';
  compliant: boolean;
  timestamp: number;
  hcsTxId?: string;
  hcsSequence?: number;
}

/**
 * Data required to register a product.
 */
export interface ProductData {
  name: string;
  sku: string;
  manufacturer: string;
  category: string;
  batchNumber: string;
  metadata?: Record<string, string>;
}

/**
 * A quantum-signed product record.
 */
export interface ProductRecord {
  productId: string;
  data: ProductData;
  keyPair: PqcKeyPair;
  stamp: PqcStamp;
  createdAt: number;
}

/**
 * Shipment status values.
 */
export type ShipmentStatus = 'created' | 'in_transit' | 'delivered' | 'verified' | 'recalled';

/**
 * A shipment record.
 */
export interface ShipmentRecord {
  shipmentId: string;
  productId: string;
  fromLocation: string;
  toLocation: string;
  status: ShipmentStatus;
  currentLocation: string;
  signature: string;
  publicKey: string;
  algorithm: 'ML-DSA-65';
  timestamp: number;
  hcsTxId?: string;
  hcsSequence?: number;
}

/**
 * Verification result for a product's provenance.
 */
export interface ProductVerification {
  productId: string;
  valid: boolean;
  shipments: ShipmentRecord[];
  timestamp: number;
}

/**
 * Generic record-keeping map keyed by string id.
 * Used internally by the use-case classes.
 */
export type RecordMap<V> = Map<string, V>;