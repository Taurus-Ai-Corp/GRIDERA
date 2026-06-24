/**
 * Cryptographic Agility Framework
 *
 * Enables seamless migration from Ed25519 (current Hedera standard) to
 * ML-DSA (quantum-resistant) with backward compatibility and hot-swappable
 * cryptography.
 *
 * Ported from gridera/src/crypto/CryptoAgility.js to TypeScript, wired to
 * @taurus/pqc-crypto's native ML-DSA-65 implementation and @hiero-ledger/sdk
 * for Ed25519 legacy operations.
 */

import { ml_dsa87 } from '@noble/post-quantum/ml-dsa';
import { randomBytes } from '@noble/hashes/utils';
import { PrivateKey, PublicKey } from '@hiero-ledger/sdk';
import { generateKeyPair as generateMlDsa65KeyPair } from './sign.js';
import { sign as signMlDsa65 } from './sign.js';
import { verify as verifyMlDsa65 } from './sign.js';
import type { PqcKeyPair } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MigrationMode = 'legacy' | 'hybrid' | 'quantum';

export type AlgorithmName = 'ML-DSA-65' | 'ML-DSA-87' | 'Ed25519';

export interface MigrationRecord {
  fromAlgorithm: AlgorithmName;
  toAlgorithm: AlgorithmName;
  migrationDate: string;
  ed25519PublicKey: string;
  mldsaPublicKey: string;
  status: 'migrated';
}

export interface SignResult {
  algorithm: AlgorithmName;
  signature: Uint8Array;
  signatureSize: number;
  timestamp: string;
  metadata: { quantumResistant: boolean; legacy: boolean };
}

export interface VerifyResult {
  algorithm: AlgorithmName;
  valid: boolean;
  timestamp: string;
  metadata: { quantumResistant: boolean; legacy: boolean };
}

export interface MigrationResult {
  mldsaKeyPair: PqcKeyPair;
  migrationRecord: MigrationRecord;
  metadata: { quantumResistant: boolean; backwardCompatible: boolean; migrationComplete: boolean };
}

export interface RotationResult {
  futureKeyPair: PqcKeyPair;
  rotationDate: string;
  fromLevel: AlgorithmName;
  toLevel: AlgorithmName;
  metadata: { securityLevelIncreased: boolean; quantumResistant: boolean };
}

export interface AgilityStatus {
  currentAlgorithm: AlgorithmName;
  legacyAlgorithm: AlgorithmName;
  futureAlgorithm: AlgorithmName;
  migrationMode: MigrationMode;
  quantumResistant: boolean;
  backwardCompatible: boolean;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// ML-DSA signature sizes per FIPS 204
const ML_DSA_44_SIG_SIZE = 2420;
const ML_DSA_65_SIG_SIZE = 3309;
const ML_DSA_87_SIG_SIZE = 4595;
const ED25519_SIG_SIZE = 64;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function toBytes(data: Uint8Array | string): Uint8Array {
  return typeof data === 'string' ? new TextEncoder().encode(data) : data;
}

// ---------------------------------------------------------------------------
// CryptoAgility class
// ---------------------------------------------------------------------------

export class CryptoAgility {
  private readonly algorithms: {
    current: AlgorithmName;
    legacy: AlgorithmName;
    future: AlgorithmName;
  };
  private migrationMode: MigrationMode;

  constructor() {
    this.algorithms = {
      current: 'ML-DSA-65',
      legacy: 'Ed25519',
      future: 'ML-DSA-87',
    };
    this.migrationMode = 'hybrid';
  }

  /**
   * Sign data with current algorithm (ML-DSA-65) or legacy (Ed25519).
   */
  sign(privateKey: Uint8Array | PrivateKey, data: Uint8Array | string, algorithm?: AlgorithmName): SignResult {
    const algo = algorithm ?? this.algorithms.current;

    if (algo === 'ML-DSA-65') {
      const sig = signMlDsa65(toBytes(data), privateKey as Uint8Array);
      return {
        algorithm: 'ML-DSA-65',
        signature: sig,
        signatureSize: sig.length,
        timestamp: new Date().toISOString(),
        metadata: { quantumResistant: true, legacy: false },
      };
    }

    if (algo === 'ML-DSA-87') {
      const sig = ml_dsa87.sign(privateKey as Uint8Array, toBytes(data));
      return {
        algorithm: 'ML-DSA-87',
        signature: sig,
        signatureSize: sig.length,
        timestamp: new Date().toISOString(),
        metadata: { quantumResistant: true, legacy: false },
      };
    }

    if (algo === 'Ed25519') {
      return this.signEd25519(privateKey as PrivateKey, data);
    }

    throw new Error(`Unsupported algorithm: ${algo}`);
  }

  /**
   * Verify signature with appropriate algorithm. Auto-detects from signature
   * size if algorithm is not specified.
   */
  verify(
    publicKey: Uint8Array | PublicKey,
    data: Uint8Array | string,
    signature: Uint8Array,
    algorithm?: AlgorithmName,
  ): VerifyResult {
    const algo = algorithm ?? this.detectAlgorithm(signature);

    if (algo === 'ML-DSA-65') {
      const valid = verifyMlDsa65(toBytes(data), signature, publicKey as Uint8Array);
      return {
        algorithm: 'ML-DSA-65',
        valid,
        timestamp: new Date().toISOString(),
        metadata: { quantumResistant: true, legacy: false },
      };
    }

    if (algo === 'ML-DSA-87') {
      const valid = ml_dsa87.verify(publicKey as Uint8Array, toBytes(data), signature);
      return {
        algorithm: 'ML-DSA-87',
        valid,
        timestamp: new Date().toISOString(),
        metadata: { quantumResistant: true, legacy: false },
      };
    }

    if (algo === 'Ed25519') {
      return this.verifyEd25519(publicKey as PublicKey, data, signature);
    }

    throw new Error(`Unsupported algorithm: ${algo}`);
  }

  /**
   * Migrate from Ed25519 to ML-DSA-65.
   * Generates a new ML-DSA key pair and creates a migration record.
   */
  migrateToQuantum(ed25519Key: PrivateKey): MigrationResult {
    const mldsaKeyPair = generateMlDsa65KeyPair();

    const migrationRecord: MigrationRecord = {
      fromAlgorithm: 'Ed25519',
      toAlgorithm: this.algorithms.current,
      migrationDate: new Date().toISOString(),
      ed25519PublicKey: ed25519Key.publicKey.toStringRaw(),
      mldsaPublicKey: toHex(mldsaKeyPair.publicKey),
      status: 'migrated',
    };

    return {
      mldsaKeyPair,
      migrationRecord,
      metadata: {
        quantumResistant: true,
        backwardCompatible: true,
        migrationComplete: true,
      },
    };
  }

  /**
   * Set migration mode: 'legacy', 'hybrid', or 'quantum'.
   */
  setMigrationMode(mode: MigrationMode): void {
    const valid: MigrationMode[] = ['legacy', 'hybrid', 'quantum'];
    if (!valid.includes(mode)) {
      throw new Error(`Invalid migration mode: ${mode}. Use "legacy", "hybrid", or "quantum"`);
    }
    this.migrationMode = mode;
  }

  /**
   * Rotate to future algorithm (ML-DSA-87, higher security level).
   */
  rotateToFuture(currentKeyPair: PqcKeyPair): RotationResult {
    void currentKeyPair; // kept for API compatibility; future rotation would re-sign documents

    const seed = randomBytes(32);
    const futureKeyPair = ml_dsa87.keygen(seed);

    return {
      futureKeyPair,
      rotationDate: new Date().toISOString(),
      fromLevel: 'ML-DSA-65',
      toLevel: this.algorithms.future,
      metadata: {
        securityLevelIncreased: true,
        quantumResistant: true,
      },
    };
  }

  /**
   * Auto-detect algorithm from signature size.
   */
  detectAlgorithm(signature: Uint8Array): AlgorithmName {
    const size = signature.length;

    if (size === ML_DSA_65_SIG_SIZE) return 'ML-DSA-65';
    if (size === ML_DSA_87_SIG_SIZE) return 'ML-DSA-87';
    if (size === ML_DSA_44_SIG_SIZE) return 'ML-DSA-65'; // 44 not in our type union; fall back to 65
    if (size === ED25519_SIG_SIZE) return 'Ed25519';

    return this.algorithms.current;
  }

  /**
   * Get current algorithm status.
   */
  getStatus(): AgilityStatus {
    return {
      currentAlgorithm: this.algorithms.current,
      legacyAlgorithm: this.algorithms.legacy,
      futureAlgorithm: this.algorithms.future,
      migrationMode: this.migrationMode,
      quantumResistant: true,
      backwardCompatible: true,
      timestamp: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private signEd25519(privateKey: PrivateKey, data: Uint8Array | string): SignResult {
    const signature = privateKey.sign(toBytes(data));
    return {
      algorithm: 'Ed25519',
      signature,
      signatureSize: signature.length,
      timestamp: new Date().toISOString(),
      metadata: { quantumResistant: false, legacy: true },
    };
  }

  private verifyEd25519(publicKey: PublicKey, data: Uint8Array | string, signature: Uint8Array): VerifyResult {
    const valid = publicKey.verify(toBytes(data), signature);
    return {
      algorithm: 'Ed25519',
      valid,
      timestamp: new Date().toISOString(),
      metadata: { quantumResistant: false, legacy: true },
    };
  }
}