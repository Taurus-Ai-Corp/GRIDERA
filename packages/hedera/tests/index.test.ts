import { describe, it, expect, vi } from 'vitest';
import * as hedera from '../src/index.js';

// index.js re-exports client.js, which imports the SDK at module load. The
// mock keeps this file free of any SDK initialisation side effects.
vi.mock('@hiero-ledger/sdk', () => ({
  Client: { forMainnet: vi.fn(), forTestnet: vi.fn(), forPreviewnet: vi.fn() },
  PrivateKey: { fromString: vi.fn() },
  TopicCreateTransaction: class {},
  TopicMessageSubmitTransaction: class {},
}));

describe('@taurus/hedera public surface', () => {
  it('exports exactly the five documented entry points', () => {
    expect(Object.keys(hedera).sort()).toEqual([
      'createHederaClient',
      'createTopic',
      'loadHederaConfig',
      'mintComplianceNFT',
      'submitToHCS',
    ]);
  });

  it.each([
    'createHederaClient',
    'createTopic',
    'loadHederaConfig',
    'mintComplianceNFT',
    'submitToHCS',
  ])('exports %s as a callable function', (name) => {
    expect(hedera[name as keyof typeof hedera]).toBeTypeOf('function');
  });

  it('does not leak the Hedera SDK symbols through the barrel', () => {
    expect(hedera).not.toHaveProperty('Client');
    expect(hedera).not.toHaveProperty('PrivateKey');
    expect(hedera).not.toHaveProperty('TopicMessageSubmitTransaction');
  });
});

describe('mintComplianceNFT — unimplemented Phase 5 stub', () => {
  it('rejects with the Phase 5 marker rather than silently no-opping', async () => {
    await expect(hedera.mintComplianceNFT({}, '0.0.1', {})).rejects.toThrow(
      'HTS minting not implemented — Phase 5',
    );
  });

  it('rejects rather than throwing synchronously, so callers can await it', () => {
    const returned = hedera.mintComplianceNFT({}, '0.0.1', {});

    expect(returned).toBeInstanceOf(Promise);
    return expect(returned).rejects.toBeInstanceOf(Error);
  });

  it('rejects regardless of the arguments supplied', async () => {
    await expect(
      hedera.mintComplianceNFT(null, '', { serial: 1 }),
    ).rejects.toThrow('HTS minting not implemented');
  });
});
