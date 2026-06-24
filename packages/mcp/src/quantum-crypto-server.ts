/**
 * Quantum Crypto MCP Server (TypeScript port of gridera/src/mcp-servers/quantum-crypto-mcp.js)
 *
 * Exposes ML-DSA and ML-KEM operations via Model Context Protocol
 * for integration with Claude Code and other MCP clients.
 *
 * Wiring notes:
 * - Uses @taurus/pqc-crypto for sign/verify/kem operations instead of the old
 *   local MLDSACrypto / MLKEMCrypto classes.
 * - @taurus/pqc-crypto currently implements ML-DSA-65 and ML-KEM-768. The tool
 *   input schemas still accept a `level` parameter for forward compatibility,
 *   but only the default levels are supported; other levels throw a clear
 *   error.
 * - CryptoAgility tools have been removed (they will live in
 *   @taurus/pqc-crypto/agility.ts as a separate task).
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  generateKeyPair,
  sign,
  verify,
  kemGenerateKeyPair,
  encapsulate,
  decapsulate,
} from '@taurus/pqc-crypto';

import type { CallToolResult, ToolDefinition } from './types.js';
import { errorResult, fromHex, textResult, toHex } from './types.js';

// ---------------------------------------------------------------------------
// Supported levels
// ---------------------------------------------------------------------------

const SUPPORTED_MLDSA_LEVELS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'] as const;
const SUPPORTED_MLKEM_LEVELS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'] as const;

type MldsaLevel = (typeof SUPPORTED_MLDSA_LEVELS)[number];
type MlkemLevel = (typeof SUPPORTED_MLKEM_LEVELS)[number];

/**
 * @taurus/pqc-crypto currently implements ML-DSA-65 only.
 * Other levels are accepted by the schema but rejected at runtime with a
 * clear message so callers know they aren't silently ignored.
 */
const IMPLEMENTED_MLDSA_LEVEL: MldsaLevel = 'ML-DSA-65';
const IMPLEMENTED_MLKEM_LEVEL: MlkemLevel = 'ML-KEM-768';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const CRYPTO_TOOLS: readonly ToolDefinition[] = [
  {
    name: 'mldsa_generate_keypair',
    description: 'Generate ML-DSA quantum-resistant key pair (NIST FIPS 204)',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: [...SUPPORTED_MLDSA_LEVELS],
          default: 'ML-DSA-65',
          description: 'ML-DSA security level',
        },
      },
    },
  },
  {
    name: 'mldsa_sign',
    description: 'Sign data with ML-DSA quantum-resistant signature',
    inputSchema: {
      type: 'object',
      properties: {
        privateKey: {
          type: 'string',
          description: 'Private key (hex encoded)',
        },
        data: { type: 'string', description: 'Data to sign' },
        level: {
          type: 'string',
          enum: [...SUPPORTED_MLDSA_LEVELS],
          default: 'ML-DSA-65',
          description: 'ML-DSA security level',
        },
      },
      required: ['privateKey', 'data'],
    },
  },
  {
    name: 'mldsa_verify',
    description: 'Verify ML-DSA quantum-resistant signature',
    inputSchema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: 'Public key (hex encoded)',
        },
        data: { type: 'string', description: 'Original data' },
        signature: {
          type: 'string',
          description: 'Signature to verify (hex encoded)',
        },
        level: {
          type: 'string',
          enum: [...SUPPORTED_MLDSA_LEVELS],
          default: 'ML-DSA-65',
          description: 'ML-DSA security level',
        },
      },
      required: ['publicKey', 'data', 'signature'],
    },
  },
  {
    name: 'mlkem_generate_keypair',
    description: 'Generate ML-KEM quantum-resistant key pair (NIST FIPS 203)',
    inputSchema: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: [...SUPPORTED_MLKEM_LEVELS],
          default: 'ML-KEM-768',
          description: 'ML-KEM security level',
        },
      },
    },
  },
  {
    name: 'mlkem_encapsulate',
    description: 'Encapsulate shared secret with ML-KEM',
    inputSchema: {
      type: 'object',
      properties: {
        publicKey: {
          type: 'string',
          description: "Recipient's public key (hex encoded)",
        },
        level: {
          type: 'string',
          enum: [...SUPPORTED_MLKEM_LEVELS],
          default: 'ML-KEM-768',
          description: 'ML-KEM security level',
        },
      },
      required: ['publicKey'],
    },
  },
  {
    name: 'mlkem_decapsulate',
    description: 'Decapsulate shared secret with ML-KEM',
    inputSchema: {
      type: 'object',
      properties: {
        secretKey: {
          type: 'string',
          description: "Recipient's secret key (hex encoded)",
        },
        ciphertext: {
          type: 'string',
          description: 'Encapsulated ciphertext (hex encoded)',
        },
        level: {
          type: 'string',
          enum: [...SUPPORTED_MLKEM_LEVELS],
          default: 'ML-KEM-768',
          description: 'ML-KEM security level',
        },
      },
      required: ['secretKey', 'ciphertext'],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Argument parsing helpers
// ---------------------------------------------------------------------------

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing or invalid '${field}' (expected non-empty string)`);
  }
  return value;
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`Invalid '${field}' (expected string)`);
  }
  return value;
}

function ensureMldsaLevel(level: string | undefined): MldsaLevel {
  const l = (level ?? IMPLEMENTED_MLDSA_LEVEL) as MldsaLevel;
  if (!SUPPORTED_MLDSA_LEVELS.includes(l)) {
    throw new Error(`Unsupported ML-DSA level: ${level}`);
  }
  if (l !== IMPLEMENTED_MLDSA_LEVEL) {
    throw new Error(
      `ML-DSA level '${l}' is not yet implemented in @taurus/pqc-crypto (only ${IMPLEMENTED_MLDSA_LEVEL}).`,
    );
  }
  return l;
}

function ensureMlkemLevel(level: string | undefined): MlkemLevel {
  const l = (level ?? IMPLEMENTED_MLKEM_LEVEL) as MlkemLevel;
  if (!SUPPORTED_MLKEM_LEVELS.includes(l)) {
    throw new Error(`Unsupported ML-KEM level: ${level}`);
  }
  if (l !== IMPLEMENTED_MLKEM_LEVEL) {
    throw new Error(
      `ML-KEM level '${l}' is not yet implemented in @taurus/pqc-crypto (only ${IMPLEMENTED_MLKEM_LEVEL}).`,
    );
  }
  return l;
}

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

export function createQuantumCryptoServer(): Server {
  const server = new Server(
    { name: 'quantum-crypto-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  // -- List tools -----------------------------------------------------------
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: CRYPTO_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  // -- Call tool ------------------------------------------------------------
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const a = args ?? {};

    try {
      switch (name) {
        case 'mldsa_generate_keypair':
          return handleMldsaGenerateKeypair(a);
        case 'mldsa_sign':
          return handleMldsaSign(a);
        case 'mldsa_verify':
          return handleMldsaVerify(a);
        case 'mlkem_generate_keypair':
          return handleMlkemGenerateKeypair(a);
        case 'mlkem_encapsulate':
          return handleMlkemEncapsulate(a);
        case 'mlkem_decapsulate':
          return handleMlkemDecapsulate(a);
        default:
          return errorResult(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(message);
    }
  });

  // -- Handlers -------------------------------------------------------------

  function handleMldsaGenerateKeypair(raw: Record<string, unknown>): CallToolResult {
    const level = ensureMldsaLevel(asOptionalString(raw['level'], 'level'));
    const keyPair = generateKeyPair();

    return textResult({
      algorithm: 'ML-DSA',
      securityLevel: level,
      publicKey: { hex: toHex(keyPair.publicKey), size: keyPair.publicKey.length },
      privateKey: { hex: toHex(keyPair.secretKey), size: keyPair.secretKey.length },
    });
  }

  function handleMldsaSign(raw: Record<string, unknown>): CallToolResult {
    const level = ensureMldsaLevel(asOptionalString(raw['level'], 'level'));
    const privateKeyHex = asString(raw['privateKey'], 'privateKey');
    const data = asString(raw['data'], 'data');

    const secretKey = fromHex(privateKeyHex);
    const messageBytes = new TextEncoder().encode(data);
    const signature = sign(messageBytes, secretKey);

    return textResult({
      algorithm: 'ML-DSA',
      securityLevel: level,
      signature: { hex: toHex(signature), size: signature.length },
    });
  }

  function handleMldsaVerify(raw: Record<string, unknown>): CallToolResult {
    const level = ensureMldsaLevel(asOptionalString(raw['level'], 'level'));
    const publicKeyHex = asString(raw['publicKey'], 'publicKey');
    const data = asString(raw['data'], 'data');
    const signatureHex = asString(raw['signature'], 'signature');

    const publicKey = fromHex(publicKeyHex);
    const signatureBytes = fromHex(signatureHex);
    const messageBytes = new TextEncoder().encode(data);
    const valid = verify(messageBytes, signatureBytes, publicKey);

    return textResult({
      valid,
      algorithm: 'ML-DSA',
      securityLevel: level,
    });
  }

  function handleMlkemGenerateKeypair(raw: Record<string, unknown>): CallToolResult {
    const level = ensureMlkemLevel(asOptionalString(raw['level'], 'level'));
    const keyPair = kemGenerateKeyPair();

    return textResult({
      algorithm: 'ML-KEM',
      securityLevel: level,
      publicKey: { hex: toHex(keyPair.publicKey), size: keyPair.publicKey.length },
      secretKey: { hex: toHex(keyPair.secretKey), size: keyPair.secretKey.length },
    });
  }

  function handleMlkemEncapsulate(raw: Record<string, unknown>): CallToolResult {
    const level = ensureMlkemLevel(asOptionalString(raw['level'], 'level'));
    const publicKeyHex = asString(raw['publicKey'], 'publicKey');

    const publicKey = fromHex(publicKeyHex);
    const result = encapsulate(publicKey);

    return textResult({
      algorithm: 'ML-KEM',
      securityLevel: level,
      ciphertext: { hex: toHex(result.ciphertext), size: result.ciphertext.length },
      sharedSecret: { hex: toHex(result.sharedSecret), size: result.sharedSecret.length },
    });
  }

  function handleMlkemDecapsulate(raw: Record<string, unknown>): CallToolResult {
    const level = ensureMlkemLevel(asOptionalString(raw['level'], 'level'));
    const secretKeyHex = asString(raw['secretKey'], 'secretKey');
    const ciphertextHex = asString(raw['ciphertext'], 'ciphertext');

    const secretKey = fromHex(secretKeyHex);
    const ciphertext = fromHex(ciphertextHex);
    const sharedSecret = decapsulate(secretKey, ciphertext);

    return textResult({
      algorithm: 'ML-KEM',
      securityLevel: level,
      sharedSecret: { hex: toHex(sharedSecret), size: sharedSecret.length },
    });
  }

  return server;
}

// ---------------------------------------------------------------------------
// Standalone stdio entrypoint
// ---------------------------------------------------------------------------

/**
 * Start the Quantum Crypto MCP server on stdio transport.
 */
export async function main(): Promise<void> {
  const server = createQuantumCryptoServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Quantum Crypto MCP Server running on stdio');
}