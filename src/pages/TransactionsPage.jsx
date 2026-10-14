import { useCallback, useEffect, useState } from 'react';
import { deleteTransaction, listTransactions } from '../api/transactions.js';
import TransactionForm from '../components/TransactionForm.jsx';
import TransactionList from '../components/TransactionList.jsx';
import { canDeleteTransaction } from '../services/validation/transactionValidation.js';

export default function TransactionsPage({ onTransactionsChanged }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reloadTransactions = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setTransactions(await listTransactions());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Nepavyko įkelti sandorių.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadTransactions();
  }, [reloadKey, reloadTransactions]);

  const handleDelete = async (transaction) => {
    setActionError('');
    const result = canDeleteTransaction(transactions, transaction.id);
    if (!result.valid) {
      setActionError(result.errors[0]);
      return;
    }
    if (!window.confirm('Ar tikrai norite ištrinti šį sandorį?')) return;

    setDeletingId(transaction.id);
    try {
      await deleteTransaction(transaction.id);
      if (editingTransaction?.id === transaction.id) setEditingTransaction(null);
      onTransactionsChanged?.();
      setReloadKey((key) => key + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Nepavyko ištrinti sandorio.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    setEditingTransaction(null);
    setActionError('');
    onTransactionsChanged?.();
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="page-header">
          <div>
            <p className="eyebrow">Asmeninių investicijų apskaita</p>
            <h1>Sandoriai</h1>
            <p className="page-lede">Tvarkykite įnašus, išmokėtas lėšas, pirkimus ir pardavimus vienoje vietoje.</p>
          </div>
          <span className="portfolio-mark" aria-hidden="true">€</span>
        </header>

        <div className="page-layout">
          <section className="panel form-panel" aria-label="Sandorio forma">
            <TransactionForm
              transactions={transactions}
              editingTransaction={editingTransaction}
              onSaved={handleSaved}
              onCancel={() => setEditingTransaction(null)}
            />
          </section>

          <section className="panel list-panel" aria-labelledby="transactions-heading">
            <div className="list-heading">
              <div>
                <p className="eyebrow">Portfelio istorija</p>
                <h2 id="transactions-heading">Visi sandoriai</h2>
              </div>
              {!loading && !loadError && <span className="record-count">{transactions.length} įraš.</span>}
            </div>

            {actionError && <p className="notice notice-error" role="alert">{actionError}</p>}
            {loading ? (
              <p className="state-message" role="status">Kraunama...</p>
            ) : loadError ? (
              <div className="load-error" role="alert">
                <p>{loadError}</p>
                <button className="button button-secondary" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                  Bandyti dar kartą
                </button>
              </div>
            ) : (
              <TransactionList
                transactions={transactions}
                onEdit={(transaction) => {
                  setActionError('');
                  setEditingTransaction(transaction);
                }}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            )}
          </section>
        </div>
        <footer className="page-footer">Sumos pateikiamos eurais. Sandorių duomenys saugomi jūsų portfelyje.</footer>
      </div>
    </main>
  );
}
