import { describe, expect, it } from 'vitest';
import {
  canAddTransaction,
  canDeleteTransaction,
  canEditTransaction,
  validatePortfolio,
  validateTransactionInput,
} from './transactionValidation.js';

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const futureDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
};
const deposit = (id, amountCents, date = '2026-01-01') => ({
  id, type: 'deposit', date, symbol: null, quantity: null, priceCents: null,
  feeCents: 0, amountCents,
});
const buy = (id, symbol, quantity, priceCents, feeCents = 0, date = '2026-01-02') => ({
  id, type: 'buy', date, symbol, quantity, priceCents, feeCents,
  amountCents: quantity * priceCents + feeCents,
});
const sell = (id, symbol, quantity, priceCents, feeCents = 0, date = '2026-01-03') => ({
  id, type: 'sell', date, symbol, quantity, priceCents, feeCents,
  amountCents: quantity * priceCents - feeCents,
});

describe('validateTransactionInput', () => {
  it('requires a valid, non-future YYYY-MM-DD date', () => {
    expect(validateTransactionInput({ type: 'deposit', amountCents: 1 }).errors.date).toBe('Data privaloma.');
    expect(validateTransactionInput({ type: 'deposit', date: '2026-02-30', amountCents: 1 }).valid).toBe(false);
    expect(validateTransactionInput({ type: 'deposit', date: futureDate(), amountCents: 1 }).errors.date).toBe('Data negali būti ateityje.');
    expect(validateTransactionInput({ type: 'deposit', date: today(), amountCents: 1 }).valid).toBe(true);
  });

  it('requires a positive integer deposit amount', () => {
    for (const amountCents of [0, -1, 1.2, '100']) {
      expect(validateTransactionInput({ type: 'deposit', date: today(), amountCents }).errors.amountCents).toBeTruthy();
    }
  });

  it('checks trade symbol, quantity, price and optional commission', () => {
    const base = { type: 'buy', date: today(), symbol: 'ABC', quantity: 1, priceCents: 100 };
    expect(validateTransactionInput(base)).toEqual({ valid: true, errors: {} });
    expect(validateTransactionInput({ ...base, symbol: '  ' }).errors.symbol).toBeTruthy();
    for (const quantity of [0, -1, 1.5]) {
      expect(validateTransactionInput({ ...base, quantity }).errors.quantity).toBeTruthy();
    }
    for (const priceCents of [0, -1, 1.5]) {
      expect(validateTransactionInput({ ...base, priceCents }).errors.priceCents).toBeTruthy();
    }
    expect(validateTransactionInput({ ...base, feeCents: -1 }).errors.feeCents).toBeTruthy();
    expect(validateTransactionInput({ ...base, feeCents: 1.5 }).errors.feeCents).toBeTruthy();
  });

  it('rejects unknown transaction types and malformed input', () => {
    expect(validateTransactionInput(null).valid).toBe(false);
    expect(validateTransactionInput({ type: 'withdrawal', date: today() }).errors.type).toBeTruthy();
  });
});

describe('validatePortfolio', () => {
  it('accepts funded purchases and sales in chronological order', () => {
    expect(validatePortfolio([
      deposit(1, 20_000), buy(2, 'ABC', 10, 1_000), sell(3, 'ABC', 4, 1_200),
    ])).toEqual({ valid: true, errors: [] });
  });

  it('rejects a negative cash balance', () => {
    const result = validatePortfolio([buy(1, 'ABC', 1, 1_000)]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('pinigų likutis būtų neigiamas'))).toBe(true);
  });

  it('rejects selling more shares than held', () => {
    const result = validatePortfolio([deposit(1, 10_000), buy(2, 'ABC', 2, 1_000), sell(3, 'ABC', 3, 1_000)]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('viršija tuo metu turimą kiekį'))).toBe(true);
  });

  it('rejects a sale dated before the first purchase', () => {
    const result = validatePortfolio([
      deposit(1, 10_000, '2026-01-01'),
      sell(2, 'ABC', 1, 1_000, 0, '2026-01-02'),
      buy(3, 'ABC', 1, 1_000, 0, '2026-01-03'),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('negali būti ankstesnis'))).toBe(true);
  });

  it('orders transactions on the same date by id', () => {
    const result = validatePortfolio([
      sell(2, 'ABC', 1, 1_000, 0, '2026-01-02'),
      deposit(1, 10_000, '2026-01-02'),
      buy(3, 'ABC', 1, 1_000, 0, '2026-01-02'),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('parduodamas') && message.includes('viršija'))).toBe(true);
  });

  it('checks that each transaction amount matches the trade fields', () => {
    const transaction = { ...buy(2, 'ABC', 1, 1_000), amountCents: 999 };
    expect(validatePortfolio([deposit(1, 10_000), transaction]).errors).toContain(
      'Sandoris 2: suma neatitinka kiekio, kainos ir komisinio.',
    );
  });
});

describe('hypothetical portfolio changes', () => {
  it('allows a valid addition', () => {
    expect(canAddTransaction([deposit(1, 10_000)], buy(2, 'ABC', 2, 1_000))).toEqual({ valid: true, errors: [] });
  });

  it('rejects an addition that makes the balance negative', () => {
    const result = canAddTransaction([deposit(1, 1_000)], buy(2, 'ABC', 2, 1_000));
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('pinigų likutis būtų neigiamas'))).toBe(true);
  });

  it('rejects editing a purchase when later sales would exceed holdings', () => {
    const existing = [deposit(1, 10_000), buy(2, 'ABC', 5, 1_000), sell(3, 'ABC', 4, 1_000)];
    const result = canEditTransaction(existing, 2, buy(2, 'ABC', 3, 1_000));
    expect(result.valid).toBe(false);
    expect(result.errors.some((message) => message.includes('viršija tuo metu turimą kiekį'))).toBe(true);
  });

  it('explains when deleting a purchase breaks a later sale', () => {
    const existing = [deposit(1, 10_000), buy(2, 'ABC', 5, 1_000), sell(3, 'ABC', 4, 1_000)];
    expect(canDeleteTransaction(existing, 2).errors[0]).toBe(
      'Negalima ištrinti: vėlesnis pardavimas viršytų turimą kiekį.',
    );
  });

  it('rejects changes for unknown transaction ids', () => {
    const existing = [deposit(1, 1_000)];
    expect(canEditTransaction(existing, 99, deposit(99, 100)).valid).toBe(false);
    expect(canDeleteTransaction(existing, 99).valid).toBe(false);
  });
});
