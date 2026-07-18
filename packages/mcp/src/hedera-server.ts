/**
 * Hedera MCP Server (TypeScript port of gridera/src/mcp-servers/hedera-mcp.js)
 *
 * Exposes Hedera Hashgraph operations via Model Context Protocol
 * for integration with Claude Code and other MCP clients.
 *
 * Wiring notes:
 * - Uses @taurus/hedera (createHederaClient / loadHederaConfig / submitToHCS / HederaConfig)
 *   for client initialization and HCS message submission.
 * - Uses @hiero-ledger/sdk for low-level transactions not covered by @taurus/hedera:
 *   AccountCreateTransaction, TokenCreateTransaction, TransferTransaction,
 *   AccountBalanceQuery, Hbar, AccountId, PrivateKey.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Client } from '@hiero-ledger/sdk';
import {
  AccountCreateTransaction,
  Hbar,
  PrivateKey,
  TokenCreateTransaction,
  TransferTransaction,
} from '@hiero-ledger/sdk';
import {
  createHederaClient,
  loadHederaConfig,
  submitToHCS,
  type HederaConfig,
} from '@taurus/hedera';

import type { CallToolResult, ToolDefinition } from './types.js';
import { errorResult, textResult } from './types.js';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const HEDERA_TOOLS: readonly ToolDefinition[] = [
  {
    name: 'hedera_initialize',
    description: 'Initialize Hedera client with account credentials',
    inputSchema: {
      type: 'object',
      properties: {
        network: {
          type: 'string',
          enum: ['testnet', 'mainnet', 'previewnet'],
          default: 'testnet',
          description: 'Hedera network',
        },
        accountId: {
          type: 'string',
          description: 'Hedera account ID (e.g., 0.0.123456)',
        },
        privateKey: {
          type: 'string',
          description: 'Private key (DER encoded hex string)',
        },
      },
      required: ['accountId', 'privateKey'],
    },
  },
  {
    name: 'hedera_create_account',
    description: 'Create a new Hedera account',
    inputSchema: {
      type: 'object',
      properties: {
        initialBalance: {
          type: 'number',
          default: 100,
          description: 'Initial balance in HBAR',
        },
      },
    },
  },
  {
    name: 'hedera_create_token',
    description: 'Create a new HTS token',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Token name' },
        symbol: { type: 'string', description: 'Token symbol' },
        decimals: { type: 'number', default: 8, description: 'Token decimals' },
        initialSupply: {
          type: 'number',
          default: 1000000,
          description: 'Initial token supply',
        },
      },
      required: ['name', 'symbol'],
    },
  },
  {
    name: 'hedera_transfer_token',
    description: 'Transfer HTS tokens between accounts',
    inputSchema: {
      type: 'object',
      properties: {
        tokenId: { type: 'string', description: 'Token ID' },
        fromAccountId: { type: 'string', description: 'Sender account ID' },
        toAccountId: { type: 'string', description: 'Recipient account ID' },
        amount: { type: 'number', description: 'Amount to transfer' },
      },
      required: ['tokenId', 'fromAccountId', 'toAccountId', 'amount'],
    },
  },
  {
    name: 'hedera_transfer_hbar',
    description: 'Transfer HBAR between accounts',
    inputSchema: {
      type: 'object',
      properties: {
        fromAccountId: { type: 'string', description: 'Sender account ID' },
        toAccountId: { type: 'string', description: 'Recipient account ID' },
        amount: { type: 'number', description: 'Amount in HBAR' },
      },
      required: ['fromAccountId', 'toAccountId', 'amount'],
    },
  },
  {
    name: 'hedera_query_balance',
    description: 'Query account balance',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID to query' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'hedera_submit_message',
    description: 'Submit message to Hedera Consensus Service (HCS)',
    inputSchema: {
      type: 'object',
      properties: {
        topicId: { type: 'string', description: 'Topic ID' },
        message: { type: 'string', description: 'Message content' },
      },
      required: ['topicId', 'message'],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Argument parsing helpers (safe extraction from Record<string, unknown>)
// ---------------------------------------------------------------------------

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing or invalid '${field}' (expected non-empty string)`);
  }
  return value;
}

function asNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Missing or invalid '${field}' (expected finite number)`);
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

function asOptionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Invalid '${field}' (expected number)`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// Server factory
// ---------------------------------------------------------------------------

export interface HederaServerOptions {
  /** Pre-initialized Hedera config + client (skips hedera_initialize requirement). */
  config?: HederaConfig;
  client?: Client;
}

export function createHederaServer(options: HederaServerOptions = {}): Server {
  const server = new Server(
    { name: 'hedera-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  // Mutable runtime state
  let activeClient: Client | null = options.client ?? null;

  function requireClient(): Client {
    if (!activeClient) {
      throw new Error('Hedera client not initialized. Call hedera_initialize first.');
    }
    return activeClient;
  }

  // -- List tools -----------------------------------------------------------
  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: HEDERA_TOOLS.map((t) => ({
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
        case 'hedera_initialize':
          return handleInitialize(a);
        case 'hedera_create_account':
          return handleCreateAccount(a);
        case 'hedera_create_token':
          return handleCreateToken(a);
        case 'hedera_transfer_token':
          return handleTransferToken(a);
        case 'hedera_transfer_hbar':
          return handleTransferHbar(a);
        case 'hedera_query_balance':
          return handleQueryBalance(a);
        case 'hedera_submit_message':
          return handleSubmitMessage(a);
        default:
          return errorResult(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return errorResult(message);
    }
  });

  // -- Handlers -------------------------------------------------------------

  function handleInitialize(raw: Record<string, unknown>): CallToolResult {
    const network = (asOptionalString(raw['network'], 'network') ?? 'testnet') as HederaConfig['network'];
    const accountId = asString(raw['accountId'], 'accountId');
    const privateKey = asString(raw['privateKey'], 'privateKey');

    const config: HederaConfig = {
      network,
      operatorId: accountId,
      operatorKey: privateKey,
    };
    // Validate by constructing the client (throws on bad credentials format)
    const client = createHederaClient(config);
    activeClient = client;

    return textResult({
      success: true,
      network,
      accountId,
      message: 'Hedera client initialized successfully',
    });
  }

  async function handleCreateAccount(raw: Record<string, unknown>): Promise<CallToolResult> {
    const client = requireClient();
    const initialBalance = asOptionalNumber(raw['initialBalance'], 'initialBalance') ?? 100;
    const accountKey = PrivateKey.generateED25519();

    const response = await new AccountCreateTransaction()
      .setKey(accountKey.publicKey)
      .setInitialBalance(Hbar.fromTinybars(initialBalance * 100_000_000))
      .execute(client);

    const receipt = await response.getReceipt(client);
    if (receipt.accountId === null) {
      throw new Error('AccountCreateTransaction succeeded but receipt contained no accountId');
    }

    return textResult({
      success: true,
      accountId: receipt.accountId.toString(),
      publicKey: accountKey.publicKey.toString(),
      privateKey: accountKey.toString(),
      initialBalance,
      transactionId: response.transactionId.toString(),
    });
  }

  async function handleCreateToken(raw: Record<string, unknown>): Promise<CallToolResult> {
    const client = requireClient();
    const tokenName = asString(raw['name'], 'name');
    const symbol = asString(raw['symbol'], 'symbol');
    const decimals = asOptionalNumber(raw['decimals'], 'decimals') ?? 8;
    const initialSupply = asOptionalNumber(raw['initialSupply'], 'initialSupply') ?? 1_000_000;

    const response = await new TokenCreateTransaction()
      .setTokenName(tokenName)
      .setTokenSymbol(symbol)
      .setDecimals(decimals)
      .setInitialSupply(initialSupply)
      .execute(client);

    const receipt = await response.getReceipt(client);
    if (receipt.tokenId === null) {
      throw new Error('TokenCreateTransaction succeeded but receipt contained no tokenId');
    }

    return textResult({
      success: true,
      tokenId: receipt.tokenId.toString(),
      name: tokenName,
      symbol,
      decimals,
      initialSupply,
      transactionId: response.transactionId.toString(),
    });
  }

  async function handleTransferToken(raw: Record<string, unknown>): Promise<CallToolResult> {
    const client = requireClient();
    const tokenId = asString(raw['tokenId'], 'tokenId');
    const fromAccountId = asString(raw['fromAccountId'], 'fromAccountId');
    const toAccountId = asString(raw['toAccountId'], 'toAccountId');
    const amount = asNumber(raw['amount'], 'amount');

    const transferTx = new TransferTransaction()
      .addTokenTransfer(tokenId, fromAccountId, -amount)
      .addTokenTransfer(tokenId, toAccountId, amount);

    const response = await transferTx.execute(client);
    const receipt = await response.getReceipt(client);

    return textResult({
      success: true,
      transactionId: response.transactionId.toString(),
      tokenId,
      from: fromAccountId,
      to: toAccountId,
      amount,
      status: receipt.status.toString(),
    });
  }

  async function handleTransferHbar(raw: Record<string, unknown>): Promise<CallToolResult> {
    const client = requireClient();
    const fromAccountId = asString(raw['fromAccountId'], 'fromAccountId');
    const toAccountId = asString(raw['toAccountId'], 'toAccountId');
    const amount = asNumber(raw['amount'], 'amount');

    const transferTx = new TransferTransaction()
      .addHbarTransfer(fromAccountId, Hbar.fromTinybars(-amount * 100_000_000))
      .addHbarTransfer(toAccountId, Hbar.fromTinybars(amount * 100_000_000));

    const response = await transferTx.execute(client);
    const receipt = await response.getReceipt(client);

    return textResult({
      success: true,
      transactionId: response.transactionId.toString(),
      from: fromAccountId,
      to: toAccountId,
      amount,
      status: receipt.status.toString(),
    });
  }

  async function handleQueryBalance(raw: Record<string, unknown>): Promise<CallToolResult> {
    const accountIdStr = asString(raw['accountId'], 'accountId');
    const network = (asOptionalString(raw['network'], 'network') ?? 'testnet') as HederaConfig['network'];

    // Validate BEFORE interpolating into the mirror-node URL. The inputSchema enum
    // is advisory (not enforced at runtime), so an untrusted MCP client could set
    // `network`/`accountId` to redirect the fetch off-host (SSRF) or inject path.
    if (!['mainnet', 'testnet', 'previewnet'].includes(network)) {
      throw new Error(`Invalid 'network' (expected mainnet, testnet, or previewnet)`);
    }
    if (!/^\d+\.\d+\.\d+$/.test(accountIdStr)) {
      throw new Error(`Invalid 'accountId' (expected Hedera format shard.realm.num, e.g. 0.0.123456)`);
    }

    // Use Mirror Node REST API (AccountBalanceQuery deprecated Sep 2026)
    const mirrorUrl = `https://${network}.mirrornode.hedera.com/api/v1/accounts/${encodeURIComponent(accountIdStr)}`;
    const response = await fetch(mirrorUrl);
    if (!response.ok) {
      return textResult({
        success: false,
        error: `Mirror node balance query failed: ${response.status}`,
      });
    }
    const balanceData = await response.json() as {
      balance: number;
      tokens: Array<{ token_id: string; balance: number }>;
    };

    return textResult({
      success: true,
      accountId: accountIdStr,
      balance: {
        hbars: (balanceData.balance / 100_000_000).toString(),
        tinybars: balanceData.balance.toString(),
      },
    });
  }

  async function handleSubmitMessage(raw: Record<string, unknown>): Promise<CallToolResult> {
    const client = requireClient();
    const topicId = asString(raw['topicId'], 'topicId');
    const message = asString(raw['message'], 'message');

    // Use @taurus/hedera's submitToHCS for real HCS submission
    const { txId, sequence } = await submitToHCS(client, topicId, message);

    return textResult({
      success: true,
      topicId,
      message,
      transactionId: txId,
      sequence,
    });
  }

  return server;
}

// ---------------------------------------------------------------------------
// Standalone stdio entrypoint
// ---------------------------------------------------------------------------

/**
 * Start the Hedera MCP server on stdio transport.
 * If HEDERA_OPERATOR_ID / HEDERA_OPERATOR_KEY env vars are set, the client is
 * pre-initialized from config; otherwise the caller must invoke
 * `hedera_initialize` before using other tools.
 */
export async function main(): Promise<void> {
  let config: HederaConfig | undefined;
  let client: Client | undefined;
  try {
    config = loadHederaConfig();
    client = createHederaClient(config);
  } catch {
    // Env not set — caller must invoke hedera_initialize at runtime.
  }

  const server = createHederaServer({ config, client });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hedera MCP Server running on stdio');
}