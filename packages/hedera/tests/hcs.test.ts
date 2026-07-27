import { describe, it, expect, beforeEach, vi } from 'vitest';
import { submitToHCS, createTopic } from '../src/hcs.js';
import type { Client } from '@hiero-ledger/sdk';

// Both HCS transactions are mocked. `.execute()` on a real transaction opens a
// gRPC connection to a Hedera node — nothing here goes near the network.
const sdk = vi.hoisted(() => {
  const state = {
    submitInstances: [] as MockSubmitTx[],
    createInstances: [] as MockCreateTx[],
    submitReceipt: { topicSequenceNumber: 1 } as unknown,
    createReceipt: { topicId: { toString: () => '0.0.5005' } } as unknown,
    transactionId: { toString: () => '0.0.1234@1700000000.000000001' },
    executeError: null as Error | null,
  };

  class MockSubmitTx {
    setTopicId = vi.fn(() => this);
    setMessage = vi.fn(() => this);
    getReceipt = vi.fn(async () => state.submitReceipt);
    execute = vi.fn(async () => {
      if (state.executeError) throw state.executeError;
      return {
        transactionId: state.transactionId,
        getReceipt: this.getReceipt,
      };
    });

    constructor() {
      state.submitInstances.push(this);
    }
  }

  class MockCreateTx {
    setTopicMemo = vi.fn(() => this);
    getReceipt = vi.fn(async () => state.createReceipt);
    execute = vi.fn(async () => {
      if (state.executeError) throw state.executeError;
      return { getReceipt: this.getReceipt };
    });

    constructor() {
      state.createInstances.push(this);
    }
  }

  return { state, MockSubmitTx, MockCreateTx };
});

vi.mock('@hiero-ledger/sdk', () => ({
  TopicMessageSubmitTransaction: sdk.MockSubmitTx,
  TopicCreateTransaction: sdk.MockCreateTx,
}));

const client = { tag: 'fake-client' } as unknown as Client;

const lastSubmit = () => {
  const tx = sdk.state.submitInstances.at(-1);
  if (!tx) throw new Error('no TopicMessageSubmitTransaction was constructed');
  return tx;
};

const lastCreate = () => {
  const tx = sdk.state.createInstances.at(-1);
  if (!tx) throw new Error('no TopicCreateTransaction was constructed');
  return tx;
};

beforeEach(() => {
  sdk.state.submitInstances.length = 0;
  sdk.state.createInstances.length = 0;
  sdk.state.submitReceipt = { topicSequenceNumber: 1 };
  sdk.state.createReceipt = { topicId: { toString: () => '0.0.5005' } };
  sdk.state.transactionId = { toString: () => '0.0.1234@1700000000.000000001' };
  sdk.state.executeError = null;
});

describe('submitToHCS — transaction construction', () => {
  it('sets the topic id and the message on the transaction', async () => {
    await submitToHCS(client, '0.0.9551792', 'audit-event-payload');

    const tx = lastSubmit();
    expect(tx.setTopicId).toHaveBeenCalledWith('0.0.9551792');
    expect(tx.setMessage).toHaveBeenCalledWith('audit-event-payload');
  });

  it('executes against the client it was given and reads the receipt with the same client', async () => {
    await submitToHCS(client, '0.0.9551792', 'msg');

    const tx = lastSubmit();
    expect(tx.execute).toHaveBeenCalledWith(client);
    expect(tx.getReceipt).toHaveBeenCalledWith(client);
  });

  it('builds one fresh transaction per call', async () => {
    await submitToHCS(client, '0.0.1', 'a');
    await submitToHCS(client, '0.0.2', 'b');

    expect(sdk.state.submitInstances).toHaveLength(2);
    expect(sdk.state.submitInstances[0]?.setTopicId).toHaveBeenCalledWith('0.0.1');
    expect(sdk.state.submitInstances[1]?.setTopicId).toHaveBeenCalledWith('0.0.2');
  });

  it.each([
    ['an empty message', ''],
    ['a JSON audit envelope', '{"event":"assessment.signed","qrs":72}'],
    ['non-ASCII content', 'jurisdiction: 🇪🇺 — Größe'],
    ['embedded newlines', 'line1\nline2\r\nline3'],
  ])('passes %s through verbatim with no encoding or truncation', async (_label, message) => {
    await submitToHCS(client, '0.0.1', message);

    expect(lastSubmit().setMessage).toHaveBeenCalledWith(message);
    expect(lastSubmit().setMessage.mock.calls[0]?.[0]).toBe(message);
  });
});

describe('submitToHCS — result mapping', () => {
  it('stringifies the transaction id from the response', async () => {
    const result = await submitToHCS(client, '0.0.1', 'msg');

    expect(result.txId).toBe('0.0.1234@1700000000.000000001');
    expect(typeof result.txId).toBe('string');
  });

  it('coerces a Long-like topicSequenceNumber to a JS number', async () => {
    sdk.state.submitReceipt = {
      topicSequenceNumber: { valueOf: () => 4096, toString: () => '4096' },
    };

    const result = await submitToHCS(client, '0.0.1', 'msg');

    expect(result.sequence).toBe(4096);
    expect(typeof result.sequence).toBe('number');
  });

  it('returns sequence 0 when the receipt carries a null topicSequenceNumber', async () => {
    sdk.state.submitReceipt = { topicSequenceNumber: null };

    expect((await submitToHCS(client, '0.0.1', 'msg')).sequence).toBe(0);
  });

  it('does not collapse a legitimate sequence of 0 into the null fallback', async () => {
    sdk.state.submitReceipt = { topicSequenceNumber: 0 };

    expect((await submitToHCS(client, '0.0.1', 'msg')).sequence).toBe(0);
  });

  it('returns exactly the two documented keys', async () => {
    const result = await submitToHCS(client, '0.0.1', 'msg');

    expect(Object.keys(result).sort()).toEqual(['sequence', 'txId']);
  });

  it('propagates an execute() failure rather than returning a fake anchor', async () => {
    sdk.state.executeError = new Error('INSUFFICIENT_TX_FEE');

    await expect(submitToHCS(client, '0.0.1', 'msg')).rejects.toThrow('INSUFFICIENT_TX_FEE');
  });
});

describe('createTopic — memo handling', () => {
  it('sets the topic memo when one is supplied', async () => {
    await createTopic(client, 'GRIDERA audit trail');

    expect(lastCreate().setTopicMemo).toHaveBeenCalledWith('GRIDERA audit trail');
  });

  it('does not call setTopicMemo when the memo is omitted', async () => {
    await createTopic(client);

    expect(lastCreate().setTopicMemo).not.toHaveBeenCalled();
  });

  it('does not call setTopicMemo when the memo is explicitly undefined', async () => {
    await createTopic(client, undefined);

    expect(lastCreate().setTopicMemo).not.toHaveBeenCalled();
  });

  it('DOES set an empty-string memo — the guard tests undefined, not falsiness', async () => {
    await createTopic(client, '');

    expect(lastCreate().setTopicMemo).toHaveBeenCalledWith('');
  });
});

describe('createTopic — result mapping', () => {
  it('executes against the client and reads the receipt with the same client', async () => {
    await createTopic(client, 'memo');

    const tx = lastCreate();
    expect(tx.execute).toHaveBeenCalledWith(client);
    expect(tx.getReceipt).toHaveBeenCalledWith(client);
  });

  it('returns the topic id as a string', async () => {
    sdk.state.createReceipt = { topicId: { toString: () => '0.0.9551792' } };

    const topicId = await createTopic(client);

    expect(topicId).toBe('0.0.9551792');
    expect(typeof topicId).toBe('string');
  });

  it('throws a descriptive error when the receipt has a null topicId', async () => {
    sdk.state.createReceipt = { topicId: null };

    await expect(createTopic(client)).rejects.toThrow(
      'TopicCreateTransaction succeeded but receipt contained no topicId',
    );
  });

  it('propagates an execute() failure', async () => {
    sdk.state.executeError = new Error('TOPIC_EXPIRATION_REDUCTION');

    await expect(createTopic(client, 'memo')).rejects.toThrow('TOPIC_EXPIRATION_REDUCTION');
  });
});
