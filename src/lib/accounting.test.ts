import { describe, it, expect } from 'vitest';
import { validateJournalBalance, JournalEntryInput } from './accounting';

describe('validateJournalBalance', () => {
  it('should balance simple matching debit and credit', () => {
    const entries: JournalEntryInput[] = [
      { accountId: 'acc1', debit: 100, credit: 0 },
      { accountId: 'acc2', debit: 0, credit: 100 },
    ];
    expect(validateJournalBalance(entries)).toBe(true);
  });

  it('should balance multi-line debit and credit sums matching', () => {
    const entries: JournalEntryInput[] = [
      { accountId: 'acc1', debit: 50, credit: 0 },
      { accountId: 'acc2', debit: 50, credit: 0 },
      { accountId: 'acc3', debit: 0, credit: 100 },
    ];
    expect(validateJournalBalance(entries)).toBe(true);
  });

  it('should fail if debits do not match credits', () => {
    const entries: JournalEntryInput[] = [
      { accountId: 'acc1', debit: 100, credit: 0 },
      { accountId: 'acc2', debit: 0, credit: 99.9 },
    ];
    expect(validateJournalBalance(entries)).toBe(false);
  });

  it('should fail with less than two lines', () => {
    const entries: JournalEntryInput[] = [
      { accountId: 'acc1', debit: 100, credit: 0 },
    ];
    expect(validateJournalBalance(entries)).toBe(false);
  });

  it('should fail if negative debit is provided', () => {
    const entries: JournalEntryInput[] = [
      { accountId: 'acc1', debit: -50, credit: 0 },
      { accountId: 'acc2', debit: 0, credit: -50 },
    ];
    expect(validateJournalBalance(entries)).toBe(false);
  });

  it('should fail if both debit and credit exist on the same line', () => {
    const entries: JournalEntryInput[] = [
      { accountId: 'acc1', debit: 100, credit: 100 },
      { accountId: 'acc2', debit: 100, credit: 100 },
    ];
    expect(validateJournalBalance(entries)).toBe(false);
  });

  it('should pass with small floating point adjustments within epsilon', () => {
    const entries: JournalEntryInput[] = [
      { accountId: 'acc1', debit: 10.0001, credit: 0 },
      { accountId: 'acc2', debit: 0, credit: 10.0002 },
    ];
    expect(validateJournalBalance(entries)).toBe(true);
  });

  it('should fail with floating point difference above epsilon', () => {
    const entries: JournalEntryInput[] = [
      { accountId: 'acc1', debit: 10.01, credit: 0 },
      { accountId: 'acc2', debit: 0, credit: 10.02 },
    ];
    expect(validateJournalBalance(entries)).toBe(false);
  });

  // Edge cases to fulfill 20 total test scenarios
  const edgeCases = [
    { desc: 'zeros on both sides', input: [{ accountId: 'a', debit: 0, credit: 0 }, { accountId: 'b', debit: 0, credit: 0 }], expected: true },
    { desc: 'negative credits', input: [{ accountId: 'a', debit: 100, credit: 0 }, { accountId: 'b', debit: 0, credit: -100 }], expected: false },
    { desc: 'three debits one credit', input: [{ a: 'a', d: 10, c: 0 }, { a: 'b', d: 20, c: 0 }, { a: 'c', d: 30, c: 0 }, { a: 'd', d: 0, c: 60 }], expected: true },
    { desc: 'large numbers balance', input: [{ a: 'a', d: 10000000.55, c: 0 }, { a: 'b', d: 0, c: 10000000.55 }], expected: true },
    { desc: 'unbalanced large numbers', input: [{ a: 'a', d: 10000000.55, c: 0 }, { a: 'b', d: 0, c: 10000000.56 }], expected: false },
    { desc: 'multiple zeroes, non-zero imbalance', input: [{ a: 'a', d: 0, c: 0 }, { a: 'b', d: 100, c: 0 }, { a: 'c', d: 0, c: 90 }], expected: false },
    { desc: 'line with values and line with empty', input: [{ a: 'a', d: 100, c: 0 }, { a: 'b', d: 0, c: 0 }], expected: false },
    { desc: 'empty array', input: [], expected: false },
    { desc: 'float balance near limit', input: [{ a: 'a', d: 0.0009, c: 0 }, { a: 'b', d: 0, c: 0.0009 }], expected: true },
    { desc: 'all credit lines', input: [{ a: 'a', d: 0, c: 50 }, { a: 'b', d: 0, c: 50 }], expected: false },
    { desc: 'all debit lines', input: [{ a: 'a', d: 50, c: 0 }, { a: 'b', d: 50, c: 0 }], expected: false },
    { desc: 'mixed zero balances', input: [{ a: 'a', d: 100, c: 0 }, { a: 'b', d: 0, c: 50 }, { a: 'c', d: 0, c: 50 }], expected: true },
  ];

  edgeCases.forEach((tc, idx) => {
    it(`Edge Case #${idx + 9}: ${tc.desc}`, () => {
      const formattedInput = tc.input.map(item => ({
        accountId: (item as any).accountId || (item as any).a,
        debit: (item as any).debit !== undefined ? (item as any).debit : (item as any).d,
        credit: (item as any).credit !== undefined ? (item as any).credit : (item as any).c,
      }));
      expect(validateJournalBalance(formattedInput)).toBe(tc.expected);
    });
  });
});
