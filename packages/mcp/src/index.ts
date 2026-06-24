/**
 * @taurus/mcp — Model Context Protocol servers for Hedera and post-quantum crypto.
 *
 * Exports two MCP server factories plus their standalone stdio entrypoints:
 *  - createHederaServer() / hederaMain()  — Hedera operations (HCS, HTS, HBAR, accounts)
 *  - createQuantumCryptoServer() / quantumCryptoMain() — ML-DSA / ML-KEM operations
 *
 * Servers are wired to @taurus/hedera and @taurus/pqc-crypto rather than the
 * original gridera-internal crypto/Hedera helpers.
 */

export { createHederaServer, main as hederaMain, type HederaServerOptions } from './hedera-server.js';
export { createQuantumCryptoServer, main as quantumCryptoMain } from './quantum-crypto-server.js';

export type {
  // Result + content types
  CallToolResult,
  TextContent,
  ToolDefinition,
  ToolInputSchema,
  // Hedera tool args
  HederaInitializeArgs,
  HederaCreateAccountArgs,
  HederaCreateTokenArgs,
  HederaTransferTokenArgs,
  HederaTransferHbarArgs,
  HederaQueryBalanceArgs,
  HederaSubmitMessageArgs,
  HederaServerState,
  // Quantum crypto tool args
  MldsaGenerateKeyPairArgs,
  MldsaSignArgs,
  MldsaVerifyArgs,
  MlkemGenerateKeyPairArgs,
  MlkemEncapsulateArgs,
  MlkemDecapsulateArgs,
  // Hex utilities
  toHex,
  fromHex,
  textResult,
  errorResult,
} from './types.js';