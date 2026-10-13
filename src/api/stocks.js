import { supabaseClient } from '../lib/supabaseClient.js';

const stockError = () => new Error('Nepavyko gauti ar išsaugoti akcijos. Patikrinkite ryšį su duomenų baze.');

export function mapStockFromDb(row) {
  if (!row) return row;
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function mapStockToDb(stock) {
  return {
    symbol: stock.symbol,
    name: stock.name ?? null,
  };
}

export async function getOrCreateStock(symbol) {
  const normalizedSymbol = typeof symbol === 'string' ? symbol.trim().toUpperCase() : '';
  if (!normalizedSymbol) throw new Error('Akcijos simbolis privalomas.');
  if (!supabaseClient) throw stockError();

  const { data: existing, error: findError } = await supabaseClient
    .from('stocks')
    .select('*')
    .eq('symbol', normalizedSymbol)
    .maybeSingle();
  if (findError) throw stockError();
  if (existing) return mapStockFromDb(existing);

  const { data, error } = await supabaseClient
    .from('stocks')
    .insert({ symbol: normalizedSymbol })
    .select('*')
    .single();
  if (!error && data) return mapStockFromDb(data);

  // A concurrent request may have inserted the unique symbol first.
  const { data: concurrent, error: retryError } = await supabaseClient
    .from('stocks')
    .select('*')
    .eq('symbol', normalizedSymbol)
    .maybeSingle();
  if (!retryError && concurrent) return mapStockFromDb(concurrent);
  throw stockError();
}

export async function listStocks() {
  if (!supabaseClient) throw stockError();
  const { data, error } = await supabaseClient.from('stocks').select('*').order('symbol', { ascending: true });
  if (error) throw stockError();
  return (data ?? []).map(mapStockFromDb);
}
