const compareIds = (left, right) => {
  const aText = String(left);
  const bText = String(right);
  if (/^-?\d+$/.test(aText) && /^-?\d+$/.test(bText)) {
    const a = BigInt(aText);
    const b = BigInt(bText);
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return aText < bText ? -1 : aText > bText ? 1 : 0;
};

const chronological = (transactions) => [...transactions].sort((a, b) => {
  const aDate = typeof a.date === 'string' ? a.date : '';
  const bDate = typeof b.date === 'string' ? b.date : '';
  return aDate < bDate ? -1 : aDate > bDate ? 1 : compareIds(a.id, b.id);
});

const isCalendarDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const todayIso = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isPositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;
const isNonNegativeInteger = (value) => Number.isSafeInteger(value) && value >= 0;
const transactionLabel = (transaction) => (
  transaction?.id === 'zzzz-new-transaction' && transaction.symbol
    ? transaction.symbol
    : transaction?.id ?? ''
);

export function validateTransactionInput(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, errors: { input: 'Pateikite sandorio duomenis.' } };
  }

  if (!input.date) {
    errors.date = 'Data privaloma.';
  } else if (!isCalendarDate(input.date)) {
    errors.date = 'Data turi būti tinkamo formato YYYY-MM-DD.';
  } else if (input.date > todayIso()) {
    errors.date = 'Data negali būti ateityje.';
  }

  if (input.type === 'deposit') {
    if (!isPositiveInteger(input.amountCents)) {
      errors.amountCents = 'Įnašo suma turi būti sveikas centų skaičius, didesnis už nulį.';
    }
  } else if (input.type === 'withdrawal') {
    if (!isPositiveInteger(input.amountCents)) {
      errors.amountCents = 'Išmokėta suma turi būti sveikas centų skaičius, didesnis už nulį.';
    }
  } else if (input.type === 'buy' || input.type === 'sell') {
    if (typeof input.symbol !== 'string' || input.symbol.trim() === '') {
      errors.symbol = 'Akcijos simbolis privalomas.';
    }
    if (!isPositiveInteger(input.quantity)) {
      errors.quantity = 'Kiekis turi būti sveikas skaičius, didesnis už nulį.';
    }
    if (!isPositiveInteger(input.priceCents)) {
      errors.priceCents = 'Kaina turi būti sveikas centų skaičius, didesnis už nulį.';
    }
    const feeCents = input.feeCents === undefined ? 0 : input.feeCents;
    if (!isNonNegativeInteger(feeCents)) {
      errors.feeCents = 'Komisinis turi būti neneigiamas sveikas centų skaičius.';
    }
  } else {
    errors.type = 'Sandorio tipas turi būti įnašas, išmokėtos lėšos, pirkimas arba pardavimas.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePortfolio(transactions) {
  if (!Array.isArray(transactions)) {
    return { valid: false, errors: ['Sandoriai turi būti pateikti masyvu.'] };
  }

  const errors = [];
  const cashBySymbol = new Map();
  let cashBalance = 0;

  for (const transaction of chronological(transactions)) {
    const inputResult = validateTransactionInput(transaction);
    if (!inputResult.valid) {
      for (const message of Object.values(inputResult.errors)) {
        errors.push(`Sandoris ${transactionLabel(transaction)}: ${message}`.trim());
      }
      continue;
    }

    const { type, symbol, quantity, amountCents } = transaction;
    const feeCents = transaction.feeCents ?? 0;
    if (type === 'deposit') {
      cashBalance += amountCents;
      continue;
    }

    if (type === 'withdrawal') {
      cashBalance -= amountCents;
      if (cashBalance < 0) {
        errors.push(`Sandoris ${transactionLabel(transaction)}: po išmokėjimo pinigų likutis būtų neigiamas.`);
      }
      continue;
    }

    if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
      errors.push(`Sandoris ${transaction.id}: suma turi būti neneigiamas sveikas centų skaičius.`);
      continue;
    }

    const position = cashBySymbol.get(symbol) ?? { quantity: 0, firstBuyDate: null };
    if (type === 'buy') {
      cashBalance -= amountCents;
      position.quantity += quantity;
      position.firstBuyDate ??= transaction.date;
      cashBySymbol.set(symbol, position);
    } else {
      if (!position.firstBuyDate || transaction.date < position.firstBuyDate) {
        errors.push(`Sandoris ${transaction.id}: pardavimas negali būti ankstesnis už pirmąjį ${symbol} pirkimą.`);
      }
      if (quantity > position.quantity) {
        errors.push(`Sandoris ${transaction.id}: parduodamas ${symbol} kiekis viršija tuo metu turimą kiekį.`);
      } else {
        position.quantity -= quantity;
        cashBySymbol.set(symbol, position);
      }
      cashBalance += amountCents;
    }

    if (cashBalance < 0) {
      errors.push(`Sandoris ${transactionLabel(transaction)}: po sandorio pinigų likutis būtų neigiamas.`);
    }

    // Keep amountCents consistent with the supplied trade fields, including fees.
    const expectedAmount = type === 'buy'
      ? quantity * transaction.priceCents + feeCents
      : quantity * transaction.priceCents - feeCents;
    if (Number.isSafeInteger(expectedAmount) && amountCents !== expectedAmount) {
      errors.push(`Sandoris ${transaction.id}: suma neatitinka kiekio, kainos ir komisinio.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

const replaceAndValidate = (transactions, replacement) => {
  const result = validatePortfolio(replacement);
  return result.valid
    ? { valid: true, errors: [] }
    : { valid: false, errors: result.errors };
};

export function canAddTransaction(existing, newTransaction) {
  return replaceAndValidate(existing, [...existing, newTransaction]);
}

export function canEditTransaction(existing, id, updated) {
  const index = existing.findIndex((transaction) => compareIds(transaction.id, id) === 0);
  if (index < 0) return { valid: false, errors: ['Redaguojamas sandoris nerastas.'] };
  const replacement = existing.map((transaction, i) => i === index ? { ...updated, id: transaction.id } : transaction);
  return replaceAndValidate(existing, replacement);
}

export function canDeleteTransaction(existing, id) {
  const replacement = existing.filter((transaction) => compareIds(transaction.id, id) !== 0);
  if (replacement.length === existing.length) {
    return { valid: false, errors: ['Ištrinamas sandoris nerastas.'] };
  }
  const result = validatePortfolio(replacement);
  if (result.valid) return { valid: true, errors: [] };
  const hasLaterSellQuantityError = result.errors.some((message) => message.includes('parduodamas') && message.includes('viršija'));
  return {
    valid: false,
    errors: hasLaterSellQuantityError
      ? ['Negalima ištrinti: vėlesnis pardavimas viršytų turimą kiekį.', ...result.errors]
      : result.errors,
  };
}
