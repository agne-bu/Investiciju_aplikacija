import { formatCents } from '../utils/money.js';
import { calculateSellProfits } from '../services/profit/profit.js';

const compareIds = (left, right) => {
  const a = String(left);
  const b = String(right);
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) return BigInt(a) < BigInt(b) ? -1 : BigInt(a) > BigInt(b) ? 1 : 0;
  return a < b ? -1 : a > b ? 1 : 0;
};

const typeLabels = { deposit: 'Įnašas', buy: 'Pirkimas', sell: 'Pardavimas' };

export default function TransactionList({ transactions, onEdit, onDelete, deletingId }) {
  const profitByTransaction = new Map(
    calculateSellProfits(transactions).map(({ transactionId, profitCents }) => [String(transactionId), profitCents]),
  );
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return -compareIds(a.id, b.id);
  });

  if (sortedTransactions.length === 0) {
    return <div className="empty-state">Sandorių dar nėra</div>;
  }

  return (
    <div className="table-scroll">
      <table className="transactions-table">
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Tipas</th>
            <th scope="col">Akcija</th>
            <th scope="col">Kiekis</th>
            <th scope="col">Kaina</th>
            <th scope="col">Komisinis</th>
            <th scope="col">Bendra suma</th>
            <th scope="col">Pelnas</th>
            <th scope="col"><span className="visually-hidden">Veiksmai</span></th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.date}</td>
              <td><span className={`type-badge type-${transaction.type}`}>{typeLabels[transaction.type] ?? transaction.type}</span></td>
              <td className="symbol-cell">{transaction.symbol ?? '—'}</td>
              <td>{transaction.quantity ?? '—'}</td>
              <td>{transaction.priceCents == null ? '—' : formatCents(transaction.priceCents)}</td>
              <td>{formatCents(transaction.feeCents ?? 0)}</td>
              <td className="amount-cell">{formatCents(transaction.amountCents)}</td>
              <td className={profitByTransaction.has(String(transaction.id))
                ? profitByTransaction.get(String(transaction.id)) > 0
                  ? 'profit-positive'
                  : profitByTransaction.get(String(transaction.id)) < 0 ? 'profit-negative' : ''
                : ''}
              >
                {profitByTransaction.has(String(transaction.id))
                  ? formatCents(profitByTransaction.get(String(transaction.id)))
                  : '—'}
              </td>
              <td>
                <div className="row-actions">
                  <button className="text-button" type="button" onClick={() => onEdit(transaction)}>Redaguoti</button>
                  <button
                    className="text-button text-button-danger"
                    type="button"
                    disabled={deletingId === transaction.id}
                    onClick={() => onDelete(transaction)}
                  >
                    {deletingId === transaction.id ? 'Trinama…' : 'Ištrinti'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
