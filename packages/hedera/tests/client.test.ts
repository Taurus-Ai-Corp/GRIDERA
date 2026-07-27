import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHederaClient } from '../src/client.js';
import type { HederaConfig } from '../src/config.js';

// The Hedera SDK is mocked wholesale: Client.forMainnet() and friends would
// otherwise build real network clients, and PrivateKey.fromString validates
// (and would reject) our fixture keys. No test in this file touches a socket.
const sdk = vi.hoisted(() => {
  const makeClient = (network: string) => ({
    network,
    setOperator: vi.fn(),
  });

  return {
    makeClient,
    forMainnet: vi.fn(() => makeClient('mainnet')),
    forTestnet: vi.fn(() => makeClient('testnet')),
    forPreviewnet: vi.fn(() => makeClient('previewnet')),
    fromString: vi.fn((key: string) => ({ parsedFrom: key })),
  };
});

vi.mock('@hiero-ledger/sdk', () => ({
  Client: {
    forMainnet: sdk.forMainnet,
    forTestnet: sdk.forTestnet,
    forPreviewnet: sdk.forPreviewnet,
  },
  PrivateKey: {
    fromString: sdk.fromString,
  },
}));

const baseConfig: HederaConfig = {
  network: 'testnet',
  operatorId: '0.0.1234',
  operatorKey: '302e020100300506032b657004220420aa',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createHederaClient — network selection', () => {
  it('builds a mainnet client for network "mainnet"', () => {
    const client = createHederaClient({ ...baseConfig, network: 'mainnet' });

    expect(sdk.forMainnet).toHaveBeenCalledTimes(1);
    expect(sdk.forTestnet).not.toHaveBeenCalled();
    expect(sdk.forPreviewnet).not.toHaveBeenCalled();
    expect(client).toMatchObject({ network: 'mainnet' });
  });

  it('builds a previewnet client for network "previewnet"', () => {
    const client = createHederaClient({ ...baseConfig, network: 'previewnet' });

    expect(sdk.forPreviewnet).toHaveBeenCalledTimes(1);
    expect(sdk.forMainnet).not.toHaveBeenCalled();
    expect(sdk.forTestnet).not.toHaveBeenCalled();
    expect(client).toMatchObject({ network: 'previewnet' });
  });

  it('builds a testnet client for network "testnet"', () => {
    const client = createHederaClient({ ...baseConfig, network: 'testnet' });

    expect(sdk.forTestnet).toHaveBeenCalledTimes(1);
    expect(sdk.forMainnet).not.toHaveBeenCalled();
    expect(sdk.forPreviewnet).not.toHaveBeenCalled();
    expect(client).toMatchObject({ network: 'testnet' });
  });

  it('falls back to testnet for an unrecognised network value', () => {
    // Reachable in practice: loadHederaConfig casts an arbitrary env string
    // to the union without validating it.
    const client = createHederaClient({
      ...baseConfig,
      network: 'not-a-real-network' as HederaConfig['network'],
    });

    expect(sdk.forTestnet).toHaveBeenCalledTimes(1);
    expect(sdk.forMainnet).not.toHaveBeenCalled();
    expect(sdk.forPreviewnet).not.toHaveBeenCalled();
    expect(client).toMatchObject({ network: 'testnet' });
  });

  it('never selects mainnet by accident for an empty network string', () => {
    // Guards the ''-from-empty-env case documented in config.test.ts.
    createHederaClient({ ...baseConfig, network: '' as HederaConfig['network'] });

    expect(sdk.forMainnet).not.toHaveBeenCalled();
    expect(sdk.forTestnet).toHaveBeenCalledTimes(1);
  });
});

describe('createHederaClient — operator wiring', () => {
  it('parses the operator key through PrivateKey.fromString', () => {
    createHederaClient(baseConfig);

    expect(sdk.fromString).toHaveBeenCalledTimes(1);
    expect(sdk.fromString).toHaveBeenCalledWith('302e020100300506032b657004220420aa');
  });

  it('sets the operator on the returned client with the id and the parsed key', () => {
    const client = createHederaClient(baseConfig) as unknown as {
      setOperator: ReturnType<typeof vi.fn>;
    };

    expect(client.setOperator).toHaveBeenCalledTimes(1);
    expect(client.setOperator).toHaveBeenCalledWith('0.0.1234', {
      parsedFrom: '302e020100300506032b657004220420aa',
    });
  });

  it('sets the operator on the mainnet client too, not just the default branch', () => {
    const client = createHederaClient({
      ...baseConfig,
      network: 'mainnet',
      operatorId: '0.0.9999',
    }) as unknown as { setOperator: ReturnType<typeof vi.fn> };

    expect(client.setOperator).toHaveBeenCalledTimes(1);
    expect(client.setOperator.mock.calls[0]?.[0]).toBe('0.0.9999');
  });

  it('propagates a PrivateKey.fromString failure instead of returning a half-built client', () => {
    sdk.fromString.mockImplementationOnce(() => {
      throw new Error('invalid private key');
    });

    expect(() => createHederaClient(baseConfig)).toThrow('invalid private key');
  });

  it('ignores auditTopicId — it is not part of client construction', () => {
    const client = createHederaClient({
      ...baseConfig,
      auditTopicId: '0.0.9551792',
    }) as unknown as { setOperator: ReturnType<typeof vi.fn> };

    expect(client.setOperator).toHaveBeenCalledWith('0.0.1234', expect.anything());
    expect(sdk.forTestnet).toHaveBeenCalledTimes(1);
  });
});
