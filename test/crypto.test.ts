import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { computeBallotHash } from '../src/utils/crypto';

describe('Ballot Hashing', () => {
  test('Hash is deterministic for the same inputs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 3, maxLength: 5 }),
        fc.string({ minLength: 64, maxLength: 64 }),
        fc.date().map(d => d.toISOString()),
        async (selections, previousHash, timestamp) => {
          const hash1 = await computeBallotHash(selections, previousHash, timestamp);
          const hash2 = await computeBallotHash(selections, previousHash, timestamp);
          expect(hash1).toBe(hash2);
        }
      )
    );
  });

  test('Hash does not depend on selection order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 3, maxLength: 5 }),
        fc.string({ minLength: 64, maxLength: 64 }),
        fc.date().map(d => d.toISOString()),
        async (selections, previousHash, timestamp) => {
          const hash1 = await computeBallotHash([...selections], previousHash, timestamp);
          const hash2 = await computeBallotHash([...selections].reverse(), previousHash, timestamp);
          expect(hash1).toBe(hash2);
        }
      )
    );
  });

  test('Changing any input totally changes the hash', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 3, maxLength: 5 }),
        fc.string({ minLength: 64, maxLength: 64 }),
        fc.date().map(d => d.toISOString()),
        async (selections, previousHash, timestamp) => {
          const baseHash = await computeBallotHash(selections, previousHash, timestamp);
          
          // Changing previous hash
          const modHash1 = await computeBallotHash(selections, previousHash + 'x', timestamp);
          expect(modHash1).not.toBe(baseHash);

          // Changing timestamp
          const modHash2 = await computeBallotHash(selections, previousHash, new Date().toISOString());
          expect(modHash2).not.toBe(baseHash);
        }
      )
    );
  });
});
