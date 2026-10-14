import { supabaseClient } from '../lib/supabaseClient.js';
import { getOrCreateStock } from './stocks.js';

const transactionError = () => new Error('Nepavyko išsaugoti ar gauti sandorio. Patikrinkite ryšį su duomenų baze.');

export function mapTransactionFromDb(row) {
  if (!row) return row;
  const transaction = {
    id: row.id,
    type: row.type,
    date: row.date,
    symbol: row.symbol,
    quantity: row.quantity,
    priceCents: row.price_cents,
    feeCents: row.fee_cents,
    amountCents: row.amount_cents,
    stockId: row.stock_id,
    createdAt: row.created_at,
  };
  if (row.stocks) transaction.stock = { symbol: row.stocks.symbol, name: row.stocks.name };
  return transaction;
}

export function mapTransactionToDb(transaction) {
  return {
    type: transaction.type,
    date: transaction.date,
    symbol: transaction.symbol ?? null,
    quantity: transaction.quantity ?? null,
    price_cents: transaction.priceCents ?? null,
    fee_cents: transaction.feeCents ?? 0,
    amount_cents: transaction.amountCents,
    stock_id: transaction.stockId ?? null,
  };
}

const requireSafeInteger = (value, field) => {
  if (!Number.isSafeInteger(value)) throw new Error(`${field} turi būti sveikas skaičius centais arba vienetais.`);
  return BigInt(value);
};

const asSafeNumber = (value) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error('Sandorio suma viršija leidžiamą sveikųjų skaičių intervalą.');
  return number;
};

function prepareTransaction(input, stockId) {
  if (input.type === 'deposit' || input.type === 'withdrawal') {
    const label = input.type === 'deposit' ? 'Įnašo' : 'Išmokėta';
    const amountCents = requireSafeInteger(input.amountCents, `${label} suma`);
    if (amountCents <= 0n) throw new Error(`${label} suma turi būti didesnė už nulį.`);
    return mapTransactionToDb({ ...input, amountCents: asSafeNumber(amountCents), stockId: null });
  }
  if (input.type !== 'buy' && input.type !== 'sell') throw new Error('Nežinomas sandorio tipas.');

  const quantity = requireSafeInteger(input.quantity, 'Kiekis');
  const priceCents = requireSafeInteger(input.priceCents, 'Kaina');
  const feeCents = requireSafeInteger(input.feeCents ?? 0, 'Komisinis');
  if (quantity <= 0n || priceCents <= 0n || feeCents < 0n) {
    throw new Error('Kiekis ir kaina turi būti teigiami, o komisinis – neneigiamas.');
  }
  const amountCents = input.type === 'buy'
    ? quantity * priceCents + feeCents
    : quantity * priceCents - feeCents;
  return mapTransactionToDb({
    ...input,
    feeCents: asSafeNumber(feeCents),
    amountCents: asSafeNumber(amountCents),
    stockId,
  });
}

const stockIdFor = async (input) => {
  if (input.type === 'deposit' || input.type === 'withdrawal') return null;
  return getOrCreateStock(input.symbol);
};

export async function listTransactions() {
  if (!supabaseClient) throw transactionError();
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*, stocks(symbol, name)')
    .order('date', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw transactionError();
  return (data ?? []).map(mapTransactionFromDb);
}

export async function createTransaction(input) {
  if (!supabaseClient) throw transactionError();
  const stock = await stockIdFor(input);
  const row = prepareTransaction(stock ? { ...input, symbol: stock.symbol } : input, stock?.id ?? null);
  const { data, error } = await supabaseClient.from('transactions').insert(row).select('*').single();
  if (error || !data) throw transactionError();
  return mapTransactionFromDb(data);
}

export async function updateTransaction(id, input) {
  if (!supabaseClient) throw transactionError();
  const stock = await stockIdFor(input);
  const row = prepareTransaction(stock ? { ...input, symbol: stock.symbol } : input, stock?.id ?? null);
  const { data, error } = await supabaseClient
    .from('transactions')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) throw transactionError();
  return mapTransactionFromDb(data);
}

export async function deleteTransaction(id) {
  if (!supabaseClient) throw transactionError();
  const { error } = await supabaseClient.from('transactions').delete().eq('id', id);
  if (error) throw new Error('Nepavyko ištrinti sandorio. Patikrinkite ryšį su duomenų baze.');
}
