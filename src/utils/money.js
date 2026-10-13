const SAFE_INTEGER_MAX = BigInt(Number.MAX_SAFE_INTEGER);
const SAFE_INTEGER_MIN = BigInt(Number.MIN_SAFE_INTEGER);

export function eurosToCents(value) {
  const input = String(value ?? '').trim();
  const match = /^(\d+)(?:[,.](\d{1,2}))?$/.exec(input);
  if (!match) throw new Error('Įveskite sumą, pvz., 12,50.');

  const whole = BigInt(match[1]);
  const fraction = BigInt((match[2] ?? '').padEnd(2, '0'));
  const cents = whole * 100n + fraction;
  if (cents > SAFE_INTEGER_MAX) throw new Error('Suma per didelė.');
  return Number(cents);
}

export function formatCents(cents) {
  if (!Number.isSafeInteger(cents)) throw new TypeError('Suma turi būti saugus sveikasis centų skaičius.');
  const value = BigInt(cents);
  const isNegative = value < 0n;
  const absolute = isNegative ? -value : value;
  const euros = absolute / 100n;
  const remainder = String(absolute % 100n).padStart(2, '0');
  const groupedEuros = new Intl.NumberFormat('lt-LT', { maximumFractionDigits: 0 }).format(Number(euros));
  return `${isNegative ? '−' : ''}${groupedEuros},${remainder} €`;
}
