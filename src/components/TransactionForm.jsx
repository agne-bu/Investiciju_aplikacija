import { useEffect, useState } from 'react';
import { createTransaction, updateTransaction } from '../api/transactions.js';
import { canAddTransaction, canEditTransaction, validateTransactionInput } from '../services/validation/transactionValidation.js';
import { eurosToCents } from '../utils/money.js';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const emptyValues = () => ({ type: 'deposit', date: today(), amount: '', symbol: '', quantity: '', price: '', fee: '' });

const fieldError = (field, message) => Object.assign(new Error(message), { field });
const centsToInput = (cents) => {
  const value = BigInt(cents);
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  return `${negative ? '-' : ''}${absolute / 100n},${String(absolute % 100n).padStart(2, '0')}`;
};

const valuesFromTransaction = (transaction) => ({
  type: transaction.type,
  date: transaction.date,
  amount: transaction.type === 'deposit' ? centsToInput(transaction.amountCents) : '',
  symbol: transaction.symbol ?? '',
  quantity: transaction.quantity == null ? '' : String(transaction.quantity),
  price: transaction.priceCents == null ? '' : centsToInput(transaction.priceCents),
  fee: transaction.feeCents == null ? '' : centsToInput(transaction.feeCents),
});

const buildTransaction = (values) => {
  const base = { date: values.date, type: values.type };
  if (values.type === 'deposit') {
    try {
      return { ...base, amountCents: eurosToCents(values.amount) };
    } catch (error) {
      throw fieldError('amountCents', error.message);
    }
  }
  const quantity = Number(values.quantity);
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    throw fieldError('quantity', 'Kiekis turi būti sveikas skaičius, didesnis už nulį.');
  }
  let priceCents;
  let feeCents;
  try {
    priceCents = eurosToCents(values.price);
  } catch (error) {
    throw fieldError('priceCents', error.message);
  }
  try {
    feeCents = values.fee.trim() ? eurosToCents(values.fee) : 0;
  } catch (error) {
    throw fieldError('feeCents', error.message);
  }
  const gross = BigInt(quantity) * BigInt(priceCents);
  const amount = values.type === 'buy' ? gross + BigInt(feeCents) : gross - BigInt(feeCents);
  const amountCents = Number(amount);
  if (!Number.isSafeInteger(amountCents)) throw fieldError('priceCents', 'Sandorio suma per didelė.');
  return { ...base, symbol: values.symbol.trim(), quantity, priceCents, feeCents, amountCents };
};

export default function TransactionForm({ transactions, editingTransaction, onSaved, onCancel }) {
  const [values, setValues] = useState(() => editingTransaction ? valuesFromTransaction(editingTransaction) : emptyValues());
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(editingTransaction ? valuesFromTransaction(editingTransaction) : emptyValues());
    setFieldErrors({});
    setFormError('');
  }, [editingTransaction]);

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    const errorKey = { amount: 'amountCents', price: 'priceCents', fee: 'feeCents' }[field] ?? field;
    setFieldErrors((current) => ({ ...current, [field]: undefined, [errorKey]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    let transaction;
    try {
      transaction = buildTransaction(values);
    } catch (error) {
      setFieldErrors({ [error.field ?? 'amountCents']: error.message });
      return;
    }

    const validation = validateTransactionInput(transaction);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    const portfolioResult = editingTransaction
      ? canEditTransaction(transactions, editingTransaction.id, { ...transaction, id: editingTransaction.id })
      : canAddTransaction(transactions, { ...transaction, id: 'zzzz-new-transaction' });
    if (!portfolioResult.valid) {
      setFormError(portfolioResult.errors[0]);
      return;
    }

    setSaving(true);
    try {
      if (editingTransaction) await updateTransaction(editingTransaction.id, transaction);
      else await createTransaction(transaction);
      setValues(emptyValues());
      setFieldErrors({});
      onSaved();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Nepavyko išsaugoti sandorio.');
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, options = {}) => (
    <label className="form-field" htmlFor={`transaction-${name}`}>
      <span>{label}</span>
      <input
        id={`transaction-${name}`}
        name={name}
        type={options.type ?? 'text'}
        inputMode={options.inputMode}
        min={options.min}
        step={options.step}
        value={values[name]}
        required={options.required !== false}
        onChange={(event) => updateField(name, event.target.value)}
        aria-invalid={Boolean(fieldErrors[options.errorKey ?? name])}
        aria-describedby={fieldErrors[options.errorKey ?? name] ? `transaction-${name}-error` : undefined}
      />
      {fieldErrors[options.errorKey ?? name] && (
        <span className="field-error" id={`transaction-${name}-error`} role="alert">
          {fieldErrors[options.errorKey ?? name]}
        </span>
      )}
    </label>
  );

  return (
    <form className="transaction-form" onSubmit={handleSubmit} noValidate>
      <div className="form-heading">
        <div>
          <p className="eyebrow">Portfelio operacijos</p>
          <h2>{editingTransaction ? 'Redaguoti sandorį' : 'Naujas sandoris'}</h2>
        </div>
      </div>
      <label className="form-field" htmlFor="transaction-type">
        <span>Sandorio tipas</span>
        <select id="transaction-type" value={values.type} onChange={(event) => updateField('type', event.target.value)}>
          <option value="deposit">Įnašas</option>
          <option value="buy">Pirkimas</option>
          <option value="sell">Pardavimas</option>
        </select>
        {fieldErrors.type && <span className="field-error" role="alert">{fieldErrors.type}</span>}
      </label>
      <div className="form-grid">
        {field('date', 'Data', { type: 'date', errorKey: 'date' })}
        {values.type === 'deposit' ? (
          field('amount', 'Suma (€)', { inputMode: 'decimal', errorKey: 'amountCents' })
        ) : (
          <>
            {field('symbol', 'Akcijos simbolis', { errorKey: 'symbol' })}
            {field('quantity', 'Kiekis', { inputMode: 'numeric', errorKey: 'quantity' })}
            {field('price', 'Kaina vienai akcijai (€)', { inputMode: 'decimal', errorKey: 'priceCents' })}
            {field('fee', 'Komisinis (€)', { inputMode: 'decimal', required: false, errorKey: 'feeCents' })}
          </>
        )}
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="form-actions">
        {editingTransaction && <button className="button button-secondary" type="button" onClick={onCancel}>Atšaukti</button>}
        <button className="button button-primary" type="submit" disabled={saving}>
          {saving ? 'Saugoma…' : 'Išsaugoti'}
        </button>
      </div>
    </form>
  );
}
