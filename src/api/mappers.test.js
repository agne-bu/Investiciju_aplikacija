import { describe, expect, it } from 'vitest';
import { mapStockFromDb, mapStockToDb } from './stocks.js';
import { mapTransactionFromDb, mapTransactionToDb } from './transactions.js';

describe('Supabase row mappers', () => {
  it('maps stock fields between database and application naming', () => {
    const databaseRow = { id: 7, symbol: 'ABC', name: 'Example Corp', created_at: '2026-01-01T00:00:00Z' };
    expect(mapStockFromDb(databaseRow)).toEqual({
      id: 7, symbol: 'ABC', name: 'Example Corp', createdAt: '2026-01-01T00:00:00Z',
    });
    expect(mapStockToDb({ symbol: 'ABC', name: 'Example Corp' })).toEqual({
      symbol: 'ABC', name: 'Example Corp',
    });
  });

  it('maps transaction fields and the related stock to application names', () => {
    const databaseRow = {
      id: 9,
      type: 'buy',
      date: '2026-02-03',
      symbol: 'ABC',
      quantity: 2,
      price_cents: 1_250,
      fee_cents: 10,
      amount_cents: 2_510,
      stock_id: 7,
      created_at: '2026-02-03T12:00:00Z',
      stocks: { symbol: 'ABC', name: 'Example Corp' },
    };
    expect(mapTransactionFromDb(databaseRow)).toEqual({
      id: 9,
      type: 'buy',
      date: '2026-02-03',
      symbol: 'ABC',
      quantity: 2,
      priceCents: 1_250,
      feeCents: 10,
      amountCents: 2_510,
      stockId: 7,
      createdAt: '2026-02-03T12:00:00Z',
      stock: { symbol: 'ABC', name: 'Example Corp' },
    });
  });

  it('maps application transaction fields to database columns', () => {
    expect(mapTransactionToDb({
      type: 'sell', date: '2026-02-03', symbol: 'ABC', quantity: 2,
      priceCents: 1_250, feeCents: 10, amountCents: 2_490, stockId: 7,
    })).toEqual({
      type: 'sell', date: '2026-02-03', symbol: 'ABC', quantity: 2,
      price_cents: 1_250, fee_cents: 10, amount_cents: 2_490, stock_id: 7,
    });
  });
});
