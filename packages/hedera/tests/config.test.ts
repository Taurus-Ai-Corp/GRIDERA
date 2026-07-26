import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadHederaConfig } from '../src/config.js';

const HEDERA_ENV_KEYS = [
  'HEDERA_NETWORK',
  'HEDERA_OPERATOR_ID',
  'HEDERA_OPERATOR_KEY',
  'HEDERA_AUDIT_TOPIC_ID',
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = {};
  for (const key of HEDERA_ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of HEDERA_ENV_KEYS) {
    const value = saved[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe('loadHederaConfig — required credentials', () => {
  it('throws when both operator id and operator key are missing', () => {
    expect(() => loadHederaConfig()).toThrow(
      'HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required',
    );
  });

  it('throws when only the operator key is present', () => {
    process.env['HEDERA_OPERATOR_KEY'] = '302e0201';

    expect(() => loadHederaConfig()).toThrow(
      'HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required',
    );
  });

  it('throws when only the operator id is present', () => {
    process.env['HEDERA_OPERATOR_ID'] = '0.0.1234';

    expect(() => loadHederaConfig()).toThrow(
      'HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required',
    );
  });

  it('treats an empty-string operator id as missing', () => {
    process.env['HEDERA_OPERATOR_ID'] = '';
    process.env['HEDERA_OPERATOR_KEY'] = '302e0201';

    expect(() => loadHederaConfig()).toThrow(
      'HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required',
    );
  });

  it('treats an empty-string operator key as missing', () => {
    process.env['HEDERA_OPERATOR_ID'] = '0.0.1234';
    process.env['HEDERA_OPERATOR_KEY'] = '';

    expect(() => loadHederaConfig()).toThrow(
      'HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY are required',
    );
  });
});

describe('loadHederaConfig — network resolution', () => {
  beforeEach(() => {
    process.env['HEDERA_OPERATOR_ID'] = '0.0.1234';
    process.env['HEDERA_OPERATOR_KEY'] = '302e0201';
  });

  it('defaults to testnet when HEDERA_NETWORK is unset', () => {
    expect(loadHederaConfig().network).toBe('testnet');
  });

  it('does NOT default an empty-string HEDERA_NETWORK — ?? only catches null/undefined', () => {
    process.env['HEDERA_NETWORK'] = '';

    // Characterization of a real edge: `?? 'testnet'` does not fire for ''.
    // The resulting config.network is '' — not a member of the declared union.
    // createHederaClient's switch falls through to testnet, so this is latent.
    expect(loadHederaConfig().network).toBe('');
  });

  it.each(['mainnet', 'testnet', 'previewnet'])(
    'passes through the %s network verbatim',
    (network) => {
      process.env['HEDERA_NETWORK'] = network;

      expect(loadHederaConfig().network).toBe(network);
    },
  );

  it('does NOT validate the network value — unknown strings pass through unchecked', () => {
    process.env['HEDERA_NETWORK'] = 'not-a-real-network';

    // Characterization: the cast in loadHederaConfig is unchecked at runtime.
    expect(loadHederaConfig().network).toBe('not-a-real-network');
  });
});

describe('loadHederaConfig — returned shape', () => {
  beforeEach(() => {
    process.env['HEDERA_OPERATOR_ID'] = '0.0.1234';
    process.env['HEDERA_OPERATOR_KEY'] = '302e020100300506032b657004220420aa';
  });

  it('returns operator credentials verbatim, without trimming', () => {
    process.env['HEDERA_OPERATOR_ID'] = '  0.0.1234  ';

    const config = loadHederaConfig();

    expect(config.operatorId).toBe('  0.0.1234  ');
    expect(config.operatorKey).toBe('302e020100300506032b657004220420aa');
  });

  it('leaves auditTopicId undefined when HEDERA_AUDIT_TOPIC_ID is unset', () => {
    const config = loadHederaConfig();

    expect(config.auditTopicId).toBeUndefined();
    expect(Object.keys(config).sort()).toEqual([
      'auditTopicId',
      'network',
      'operatorId',
      'operatorKey',
    ]);
  });

  it('passes auditTopicId through when HEDERA_AUDIT_TOPIC_ID is set', () => {
    process.env['HEDERA_AUDIT_TOPIC_ID'] = '0.0.9551792';

    expect(loadHederaConfig().auditTopicId).toBe('0.0.9551792');
  });

  it('reads env on every call rather than caching at module load', () => {
    const first = loadHederaConfig();
    process.env['HEDERA_OPERATOR_ID'] = '0.0.5678';
    const second = loadHederaConfig();

    expect(first.operatorId).toBe('0.0.1234');
    expect(second.operatorId).toBe('0.0.5678');
  });
});
