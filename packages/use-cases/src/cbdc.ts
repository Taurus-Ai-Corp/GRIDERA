/**
 * Quantum-Resistant CBDC Platform
 *
 * Central Bank Digital Currency on Hedera Hashgraph with ML-DSA signatures.
 * Addresses CNSA 2.0 (Jan 2027) deadline for quantum-resistant payments.
 *
 * Ported from gridera/src/use-cases/QuantumCBDC.js to TypeScript.
 */

import type { Client } from '@hiero-ledger/sdk';
import {
  AccountCreateTransaction,
  Hbar,
  PrivateKey,
  TokenCreateTransaction,
  TransferTransaction,
} from '@hiero-ledger/sdk';
import { createHederaClient, type HederaConfig } from '@taurus/hedera';
import { generateKeyPair, sign, type PqcKeyPair } from '@taurus/pqc-crypto';

import type {
  TokenResult,
  AccountResult,
  TransferResult,
  WalletBalance,
  WalletRecord,
} from './types.js';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class QuantumCBDC {
  private readonly client: Client;
  private readonly config: HederaConfig;
  private cbdcTokenId: string | null = null;
  private readonly wallets = new Map<string, WalletRecord>();

  constructor(config: HederaConfig) {
    this.config = config;
    this.client = createHederaClient(config);
  }

  /**
   * Initialize CBDC token on Hedera.
   */
  async initializeCBDC(currencyName: string, currencySymbol: string, initialSupply = 1_000_000_000): Promise<TokenResult> {
    const response = await new TokenCreateTransaction()
      .setTokenName(currencyName)
      .setTokenSymbol(currencySymbol)
      .setDecimals(2)
      .setInitialSupply(initialSupply)
      .execute(this.client);

    const receipt = await response.getReceipt(this.client);
    if (receipt.tokenId === null) {
      throw new Error('TokenCreateTransaction succeeded but receipt contained no tokenId');
    }

    this.cbdcTokenId = receipt.tokenId.toString();

    return {
      tokenId: this.cbdcTokenId,
      txId: response.transactionId.toString(),
    };
  }

  /**
   * Create a new wallet with quantum-resistant key pair.
   */
  async createWallet(ownerId: string): Promise<WalletRecord & AccountResult> {
    if (!this.cbdcTokenId) {
      throw new Error('CBDC token not initialized. Call initializeCBDC first.');
    }

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

    const accountId = receipt.accountId.toString();
    const walletId = `WALLET-${Date.now()}`;
    const record: WalletRecord = {
      walletId,
      accountId,
      ownerId,
      keyPair,
      createdAt: Date.now(),
    };
    this.wallets.set(walletId, record);

    return {
      ...record,
      txId: response.transactionId.toString(),
    };
  }

  /**
   * Transfer CBDC tokens between wallets with quantum signature.
   */
  async transferCBDC(fromWalletId: string, toWalletId: string, amount: number): Promise<TransferResult> {
    if (!this.cbdcTokenId) {
      throw new Error('CBDC token not initialized. Call initializeCBDC first.');
    }

    const fromWallet = this.wallets.get(fromWalletId);
    const toWallet = this.wallets.get(toWalletId);
    if (!fromWallet || !toWallet) {
      throw new Error('One or both wallets not found');
    }

    // Sign the transfer intent with quantum-resistant key
    const transferData = `${fromWalletId}:${toWalletId}:${amount}:${this.cbdcTokenId}`;
    const transferBytes = new TextEncoder().encode(transferData);
    const signature = sign(transferBytes, fromWallet.keyPair.secretKey);

    const transferTx = new TransferTransaction()
      .addTokenTransfer(this.cbdcTokenId, fromWallet.accountId, -amount)
      .addTokenTransfer(this.cbdcTokenId, toWallet.accountId, amount);

    const response = await transferTx.execute(this.client);
    await response.getReceipt(this.client);

    return {
      txId: response.transactionId.toString(),
      fromWalletId,
      toWalletId,
      amount,
      signature: toHex(signature),
    };
  }

  /**
   * Query wallet balance for the CBDC token.
   */
  async getWalletBalance(walletId: string): Promise<WalletBalance> {
    if (!this.cbdcTokenId) {
      throw new Error('CBDC token not initialized. Call initializeCBDC first.');
    }

    const wallet = this.wallets.get(walletId);
    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    // Use Mirror Node REST API (AccountBalanceQuery deprecated Sep 2026)
    const mirrorUrl = `https://${this.config.network}.mirrornode.hedera.com/api/v1/accounts/${wallet.accountId}`;
    const response = await fetch(mirrorUrl);
    if (!response.ok) {
      throw new Error(`Mirror node balance query failed: ${response.status}`);
    }
    const balanceData = await response.json() as {
      balance: number;
      tokens: Array<{ token_id: string; balance: number }>;
    };

    const tokenBalance = balanceData.tokens?.find(
      (t) => t.token_id === this.cbdcTokenId,
    );
    const balanceNum = tokenBalance ? Number(tokenBalance.balance) : 0;

    return {
      walletId,
      tokenId: this.cbdcTokenId,
      balance: balanceNum,
    };
  }
}