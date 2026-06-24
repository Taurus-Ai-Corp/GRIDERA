// Types
export type {
  Jurisdiction,
  PqcStamp,
  StampableEntity,
  PqcKeyPair,
  EncryptedKey,
} from './types.js';

// Sign (ML-DSA-65)
export { generateKeyPair, sign, verify } from './sign.js';

// KEM (ML-KEM-768)
export type { KemEncapsulateResult } from './kem.js';
export { kemGenerateKeyPair, encapsulate, decapsulate } from './kem.js';

// Hash (SHA-256 + SHAKE-256)
export { hashPayload, hashBytes, hashPayloadQuantum, hashBytesQuantum } from './hash.js';

// KDF (HKDF-SHA3-256)
export { deriveKey, deriveAgentSeed, deriveOrgEncryptionKey } from './kdf.js';

// Keys (AES-256-GCM key encryption, HKDF-SHA3-256 derivation)
export { generateOrgKeyPair, encryptSecretKey, decryptSecretKey } from './keys.js';

// Stamp (PQC stamping)
export { createStamp } from './stamp.js';

// Crypto Agility (dual-mode Ed25519 / ML-DSA framework)
export type {
  MigrationMode,
  AlgorithmName,
  MigrationRecord,
  SignResult,
  VerifyResult,
  MigrationResult,
  RotationResult,
  AgilityStatus,
} from './agility.js';
export { CryptoAgility } from './agility.js';
