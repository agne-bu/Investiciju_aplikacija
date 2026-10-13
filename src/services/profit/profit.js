const compareIds = (left, right) => {
  const leftText = String(left);
  const rightText = String(right);
  if (/^-?\d+$/.test(leftText) && /^-?\d+$/.test(rightText)) {
    const a = BigInt(leftText);
    const b = BigInt(rightText);
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return leftText < rightText ? -1 : leftText > rightText ? 1 : 0;
};

const chronological = (transactions) => [...transactions].sort((a, b) =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : compareIds(a.id, b.id),
);

const integer = (value, field) => {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${field} must be a safe integer`);
  }
  return BigInt(value);
};

const asSafeNumber = (value, field) => {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`${field} exceeds the safe integer range`);
  }
  return result;
};

const roundedDivide = (numerator, denominator) => {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return quotient + (remainder * 2n >= denominator ? 1n : 0n);
};

const compute = (transactions) => {
  const holdings = new Map();
  const sales = [];

  for (const transaction of chronological(transactions)) {
    if (transaction.type === 'deposit') continue;
    if (transaction.type !== 'buy' && transaction.type !== 'sell') {
      throw new TypeError(`Unknown transaction type: ${transaction.type}`);
    }

    const { symbol } = transaction;
    if (typeof symbol !== 'string' || symbol.trim() === '') {
      throw new TypeError('Trade symbol must be a non-empty string');
    }
    const quantity = integer(transaction.quantity, 'quantity');
    const price = integer(transaction.priceCents, 'priceCents');
    const fee = integer(transaction.feeCents, 'feeCents');
    if (quantity <= 0n || price <= 0n || fee < 0n) {
      throw new RangeError('Trade quantity and price must be positive, and fee non-negative');
    }

    const position = holdings.get(symbol) ?? { quantity: 0n, totalCostCents: 0n };
    if (transaction.type === 'buy') {
      position.quantity += quantity;
      position.totalCostCents += quantity * price + fee;
      holdings.set(symbol, position);
      continue;
    }

    if (quantity > position.quantity) {
      throw new RangeError(`Cannot sell more ${symbol} than currently held`);
    }
    const cost = roundedDivide(position.totalCostCents * quantity, position.quantity);
    const proceeds = quantity * price - fee;
    position.quantity -= quantity;
    position.totalCostCents -= cost;
    sales.push({
      transactionId: transaction.id,
      symbol,
      soldQuantity: asSafeNumber(quantity, 'soldQuantity'),
      proceedsCents: asSafeNumber(proceeds, 'proceedsCents'),
      costCents: asSafeNumber(cost, 'costCents'),
      profitCents: asSafeNumber(proceeds - cost, 'profitCents'),
    });
    if (position.quantity === 0n) position.totalCostCents = 0n;
    holdings.set(symbol, position);
  }

  return { sales, holdings };
};

export const calculateSellProfits = (transactions) => compute(transactions).sales.map((sale) => ({
  transactionId: sale.transactionId,
  symbol: sale.symbol,
  proceedsCents: sale.proceedsCents,
  costCents: sale.costCents,
  profitCents: sale.profitCents,
}));

export const calculateProfitBySymbol = (transactions) => {
  const totals = new Map();
  for (const sale of compute(transactions).sales) {
    const total = totals.get(sale.symbol) ?? {
      symbol: sale.symbol,
      soldQuantity: 0,
      proceedsCents: 0,
      costCents: 0,
      profitCents: 0,
    };
    total.soldQuantity = asSafeNumber(
      BigInt(total.soldQuantity) + BigInt(sale.soldQuantity),
      'soldQuantity',
    );
    total.proceedsCents = asSafeNumber(BigInt(total.proceedsCents) + BigInt(sale.proceedsCents), 'proceedsCents');
    total.costCents = asSafeNumber(BigInt(total.costCents) + BigInt(sale.costCents), 'costCents');
    total.profitCents = asSafeNumber(BigInt(total.profitCents) + BigInt(sale.profitCents), 'profitCents');
    totals.set(sale.symbol, total);
  }
  return [...totals.values()].sort((a, b) => a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0);
};

export const calculateTotalProfit = (transactions) =>
  asSafeNumber(calculateProfitBySymbol(transactions).reduce((sum, item) => sum + BigInt(item.profitCents), 0n), 'profitCents');

export const calculateCashSummary = (transactions) => {
  let deposits = 0n;
  let buys = 0n;
  let sellProceeds = 0n;
  let fees = 0n;
  for (const transaction of transactions) {
    const amount = integer(transaction.amountCents, 'amountCents');
    if (transaction.type === 'deposit') deposits += amount;
    if (transaction.type === 'buy') buys += amount;
    if (transaction.type === 'sell') sellProceeds += amount;
    if (transaction.type === 'buy' || transaction.type === 'sell') {
      fees += integer(transaction.feeCents, 'feeCents');
    }
  }
  return {
    depositsCents: asSafeNumber(deposits, 'depositsCents'),
    buysCents: asSafeNumber(buys, 'buysCents'),
    sellProceedsCents: asSafeNumber(sellProceeds, 'sellProceedsCents'),
    feesCents: asSafeNumber(fees, 'feesCents'),
    balanceCents: asSafeNumber(deposits - buys + sellProceeds, 'balanceCents'),
  };
};

export const calculateHoldings = (transactions) => {
  const { holdings } = compute(transactions);
  return [...holdings]
    .filter(([, position]) => position.quantity > 0n)
    .map(([symbol, position]) => ({
      symbol,
      quantity: asSafeNumber(position.quantity, 'quantity'),
      totalCostCents: asSafeNumber(position.totalCostCents, 'totalCostCents'),
    }))
    .sort((a, b) => a.symbol < b.symbol ? -1 : a.symbol > b.symbol ? 1 : 0);
};
