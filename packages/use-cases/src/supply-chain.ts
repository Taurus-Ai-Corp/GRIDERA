/**
 * Quantum-Resistant Supply Chain Platform
 *
 * Secure supply chain tracking on Hedera Hashgraph with ML-DSA signatures.
 * Ported from gridera/src/use-cases/QuantumSupplyChain.js to TypeScript.
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
  ProductData,
  ProductRecord,
  ShipmentRecord,
  ShipmentStatus,
  ProductVerification,
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

export class QuantumSupplyChain {
  private readonly client: Client;
  private readonly config: HederaConfig;
  private readonly products = new Map<string, ProductRecord>();
  private readonly shipments = new Map<string, ShipmentRecord>();
  private readonly productShipments = new Map<string, ShipmentRecord[]>();

  constructor(config: HederaConfig) {
    this.client = createHederaClient(config);
    this.config = config;
  }

  /**
   * Register a product with quantum-resistant tracking.
   */
  async registerProduct(productData: ProductData): Promise<ProductRecord> {
    const keyPair: PqcKeyPair = generateKeyPair();
    const productId = `PROD-${Date.now()}`;

    const stampable: StampableEntity = {
      type: 'system',
      id: productId,
      payload: productData,
      jurisdiction: 'na',
    };
    const stamp = {
      hash: hashPayload(stampable.payload),
      signature: toHex(sign(new TextEncoder().encode(hashPayload(stampable.payload)), keyPair.secretKey)),
      publicKey: toHex(keyPair.publicKey),
      algorithm: 'ML-DSA-65' as const,
      timestamp: Date.now(),
    };

    const record: ProductRecord = {
      productId,
      data: productData,
      keyPair,
      stamp,
      createdAt: Date.now(),
    };
    this.products.set(productId, record);

    return record;
  }

  /**
   * Create a shipment for a product. Signs the shipment with the product's key.
   */
  async createShipment(productId: string, fromLocation: string, toLocation: string): Promise<ShipmentRecord> {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const shipmentData = `${productId}:${fromLocation}:${toLocation}:${Date.now()}`;
    const shipmentHash = hashPayload(shipmentData);
    const signature = sign(new TextEncoder().encode(shipmentHash), product.keyPair.secretKey);

    const shipmentId = `SHIP-${Date.now()}`;
    const record: ShipmentRecord = {
      shipmentId,
      productId,
      fromLocation,
      toLocation,
      status: 'created',
      currentLocation: fromLocation,
      signature: toHex(signature),
      publicKey: toHex(product.keyPair.publicKey),
      algorithm: 'ML-DSA-65',
      timestamp: Date.now(),
    };
    this.shipments.set(shipmentId, record);

    const trail = this.productShipments.get(productId) ?? [];
    trail.push(record);
    this.productShipments.set(productId, trail);

    // Anchor to HCS if audit topic is configured
    const auditTopicId = this.config.auditTopicId;
    if (auditTopicId) {
      const hcsResult = await submitToHCS(this.client, auditTopicId, JSON.stringify(record));
      record.hcsTxId = hcsResult.txId;
      record.hcsSequence = hcsResult.sequence;
    }

    return record;
  }

  /**
   * Update shipment status and location.
   */
  async updateShipmentStatus(shipmentId: string, status: ShipmentStatus, currentLocation: string): Promise<ShipmentRecord> {
    const shipment = this.shipments.get(shipmentId);
    if (!shipment) {
      throw new Error(`Shipment not found: ${shipmentId}`);
    }

    const product = this.products.get(shipment.productId);
    if (!product) {
      throw new Error(`Product not found for shipment: ${shipment.productId}`);
    }

    const updateData = `${shipmentId}:${status}:${currentLocation}:${Date.now()}`;
    const updateHash = hashPayload(updateData);
    const signature = sign(new TextEncoder().encode(updateHash), product.keyPair.secretKey);

    const updatedRecord: ShipmentRecord = {
      ...shipment,
      status,
      currentLocation,
      signature: toHex(signature),
      timestamp: Date.now(),
    };
    this.shipments.set(shipmentId, updatedRecord);

    // Update product shipment trail
    const trail = this.productShipments.get(shipment.productId) ?? [];
    const idx = trail.findIndex((s) => s.shipmentId === shipmentId);
    if (idx >= 0) {
      trail[idx] = updatedRecord;
    } else {
      trail.push(updatedRecord);
    }
    this.productShipments.set(shipment.productId, trail);

    return updatedRecord;
  }

  /**
   * Verify a product's provenance by checking all shipment signatures.
   */
  verifyProduct(productId: string): ProductVerification {
    const product = this.products.get(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    const shipments = this.productShipments.get(productId) ?? [];
    let allValid = true;

    for (const shipment of shipments) {
      const shipmentData = `${productId}:${shipment.fromLocation}:${shipment.toLocation}:${shipment.timestamp}`;
      const expectedHash = hashPayload(shipmentData);
      const valid = verify(
        new TextEncoder().encode(expectedHash),
        fromHex(shipment.signature),
        fromHex(shipment.publicKey),
      );
      if (!valid) {
        allValid = false;
        break;
      }
    }

    return {
      productId,
      valid: allValid,
      shipments,
      timestamp: Date.now(),
    };
  }
}