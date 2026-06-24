import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import type { HederaConfig } from '@taurus/hedera';
import type { CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';

export type { CallToolResult, TextContent };

/**
 * JSON schema for MCP tool input parameters.
 * Matches the MCP SDK's Tool inputSchema shape (JSON Schema object).
 */
export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

/**
 * A tool definition with name, description, and JSON schema for input.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}

// ---------------------------------------------------------------------------
// Hedera MCP types
// ---------------------------------------------------------------------------

export interface HederaInitializeArgs {
  network?: 'testnet' | 'mainnet' | 'previewnet';
  accountId: string;
  privateKey: string;
}

export interface HederaCreateAccountArgs {
  initialBalance?: number;
}

export interface HederaCreateTokenArgs {
  name: string;
  symbol: string;
  decimals?: number;
  initialSupply?: number;
}

export interface HederaTransferTokenArgs {
  tokenId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface HederaTransferHbarArgs {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
}

export interface HederaQueryBalanceArgs {
  accountId: string;
}

export interface HederaSubmitMessageArgs {
  topicId: string;
  message: string;
}

/**
 * Mutable state for the Hedera MCP server, holding the active client config
 * and low-level client reference. The client is initialized on
 * `hedera_initialize` and reused by subsequent tools.
 */
export interface HederaServerState {
  config: HederaConfig | null;
}

// ---------------------------------------------------------------------------
// Quantum crypto MCP types
// ---------------------------------------------------------------------------

export interface MldsaGenerateKeyPairArgs {
  level?: 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87';
}

export interface MldsaSignArgs {
  privateKey: string;
  data: string;
  level?: 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87';
}

export interface MldsaVerifyArgs {
  publicKey: string;
  data: string;
  signature: string;
  level?: 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87';
}

export interface MlkemGenerateKeyPairArgs {
  level?: 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024';
}

export interface MlkemEncapsulateArgs {
  publicKey: string;
  level?: 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024';
}

export interface MlkemDecapsulateArgs {
  secretKey: string;
  ciphertext: string;
  level?: 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024';
}

// ---------------------------------------------------------------------------
// Hex utilities
// ---------------------------------------------------------------------------

/**
 * Encode a Uint8Array as a lowercase hex string.
 */
export function toHex(bytes: Uint8Array): string {
  return bytesToHex(bytes);
}

/**
 * Decode a hex string (with or without 0x prefix) into a Uint8Array.
 * Throws on invalid input.
 */
export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length === 0 || normalized.length % 2 !== 0) {
    throw new Error(`Invalid hex string: odd or zero length (${normalized.length})`);
  }
  if (!/^[0-9a-fA-F]*$/.test(normalized)) {
    throw new Error('Invalid hex string: contains non-hex characters');
  }
  return hexToBytes(normalized);
}

/**
 * Helper to build a text-only CallToolResult.
 */
export function textResult(payload: unknown, isError = false): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2),
      },
    ],
    isError,
  };
}

/**
 * Helper to build an error CallToolResult.
 */
export function errorResult(message: string): CallToolResult {
  return textResult(`Error: ${message}`, true);
}