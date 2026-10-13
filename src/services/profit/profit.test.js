import { describe, expect, it } from 'vitest';
import {
  calculateCashSummary,
  calculateHoldings,
  calculateProfitBySymbol,
  calculateSellProfits,
  calculateTotalProfit,
} from './profit.js';

const buy = (id, date, symbol, quantity, priceCents, feeCents = 0) => ({
  id, type: 'buy', date, symbol, quantity, priceCents, feeCents,
  amountCents: quantity * priceCents + feeCents,
});
const sell = (id, date, symbol, quantity, priceCents, feeCents = 0) => ({
  id, type: 'sell', date, symbol, quantity, priceCents, feeCents,
  amountCents: quantity * priceCents - feeCents,
});
const deposit = (id, date, amountCents) => ({
  id, type: 'deposit', date, symbol: null, quantity: null, priceCents: null,
  feeCents: 0, amountCents,
});

describe('profit calculations using weighted average cost', () => {
  it('calculates the requested buy and sell example', () => {
    const transactions = [
      buy(1, '2026-01-01', 'ABC', 10, 10_000, 500),
      sell(2, '2026-02-01', 'ABC', 4, 12_000, 200),
    ];
    expect(calculateSellProfits(transactions)).toEqual([{
      transactionId: 2, symbol: 'ABC', proceedsCents: 47_800, costCents: 40_200, profitCents: 7_600,
    }]);
  });

  it('keeps the remaining cost correct across two partial sales', () => {
    const transactions = [
      buy(1, '2026-01-01', 'ABC', 10, 1_000, 5),
      sell(2, '2026-02-01', 'ABC', 3, 1_100),
      sell(3, '2026-03-01', 'ABC', 2, 1_100),
    ];
    expect(calculateSellProfits(transactions).map(({ costCents }) => costCents)).toEqual([3002, 2001]);
    expect(calculateHoldings(transactions)).toEqual([{ symbol: 'ABC', quantity: 5, totalCostCents: 5002 }]);
  });

  it('uses weighted average cost across purchases at different prices', () => {
    const transactions = [
      buy(1, '2026-01-01', 'ABC', 2, 1_000),
      buy(2, '2026-01-02', 'ABC', 3, 2_000),
      sell(3, '2026-01-03', 'ABC', 2, 2_500),
    ];
    expect(calculateSellProfits(transactions)[0].costCents).toBe(3_200);
    expect(calculateHoldings(transactions)[0]).toEqual({ symbol: 'ABC', quantity: 3, totalCostCents: 4_800 });
  });

  it('reports a loss as a negative profit', () => {
    expect(calculateSellProfits([
      buy(1, '2026-01-01', 'ABC', 1, 1_000),
      sell(2, '2026-01-02', 'ABC', 1, 800),
    ])[0].profitCents).toBe(-200);
  });

  it('aggregates different symbols and matches their sum to total profit', () => {
    const transactions = [
      buy(1, '2026-01-01', 'ABC', 2, 1_000), sell(2, '2026-01-02', 'ABC', 1, 1_500),
      buy(3, '2026-01-01', 'XYZ', 1, 2_000), sell(4, '2026-01-03', 'XYZ', 1, 1_800),
    ];
    const bySymbol = calculateProfitBySymbol(transactions);
    expect(bySymbol).toEqual([
      { symbol: 'ABC', soldQuantity: 1, proceedsCents: 1_500, costCents: 1_000, profitCents: 500 },
      { symbol: 'XYZ', soldQuantity: 1, proceedsCents: 1_800, costCents: 2_000, profitCents: -200 },
    ]);
    expect(bySymbol.reduce((sum, row) => sum + row.profitCents, 0)).toBe(calculateTotalProfit(transactions));
  });

  it('does not tie realized profit to reused cash', () => {
    const transactions = [
      buy(1, '2026-01-01', 'ABC', 1, 1_000), sell(2, '2026-01-02', 'ABC', 1, 1_200),
      buy(3, '2026-01-03', 'ABC', 1, 1_200),
    ];
    expect(calculateTotalProfit(transactions)).toBe(200);
    expect(calculateHoldings(transactions)).toEqual([{ symbol: 'ABC', quantity: 1, totalCostCents: 1_200 }]);
  });

  it('returns zero values for empty input', () => {
    expect(calculateSellProfits([])).toEqual([]);
    expect(calculateProfitBySymbol([])).toEqual([]);
    expect(calculateTotalProfit([])).toBe(0);
    expect(calculateCashSummary([])).toEqual({
      depositsCents: 0, buysCents: 0, sellProceedsCents: 0, feesCents: 0, balanceCents: 0,
    });
    expect(calculateHoldings([])).toEqual([]);
  });

  it('sorts out-of-order trades by date and then id', () => {
    const transactions = [
      sell(3, '2026-01-03', 'ABC', 2, 1_500),
      buy(2, '2026-01-02', 'ABC', 2, 1_000),
      buy(1, '2026-01-01', 'ABC', 2, 1_000),
    ];
    expect(calculateSellProfits(transactions)[0].costCents).toBe(2_000);
    expect(calculateHoldings(transactions)).toEqual([{ symbol: 'ABC', quantity: 2, totalCostCents: 2_000 }]);
  });

  it('summarizes cash flows and fees', () => {
    expect(calculateCashSummary([
      deposit(1, '2026-01-01', 20_000),
      buy(2, '2026-01-02', 'ABC', 1, 10_000, 100),
      sell(3, '2026-01-03', 'ABC', 1, 12_000, 200),
    ])).toEqual({
      depositsCents: 20_000, buysCents: 10_100, sellProceedsCents: 11_800,
      feesCents: 300, balanceCents: 21_700,
    });
  });
});
