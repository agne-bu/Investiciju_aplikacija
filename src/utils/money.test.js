import { describe, expect, it } from 'vitest';
import { eurosToCents, formatCents } from './money.js';

describe('money utilities', () => {
  it('converts comma and dot decimal input to integer cents', () => {
    expect(eurosToCents('12,50')).toBe(1_250);
    expect(eurosToCents('12.50')).toBe(1_250);
    expect(eurosToCents('12,5')).toBe(1_250);
  });

  it('formats cents as Lithuanian euros', () => {
    expect(formatCents(1_250)).toBe('12,50 €');
    expect(formatCents(0)).toBe('0,00 €');
    expect(formatCents(-1_250)).toBe('−12,50 €');
  });

  it('rejects malformed or unsafe amounts', () => {
    expect(() => eurosToCents('12,555')).toThrow();
    expect(() => eurosToCents('')).toThrow();
    expect(() => formatCents(1.5)).toThrow();
  });
});
