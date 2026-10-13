import { useState } from 'react';
import TransactionsPage from './pages/TransactionsPage.jsx';
import SummaryPage from './pages/SummaryPage.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('transactions');
  const [transactionRevision, setTransactionRevision] = useState(0);

  return (
    <>
      <nav className="screen-switch" aria-label="Puslapiai">
        <button
          className={activePage === 'transactions' ? 'is-active' : ''}
          type="button"
          aria-pressed={activePage === 'transactions'}
          onClick={() => setActivePage('transactions')}
        >
          Sandoriai
        </button>
        <button
          className={activePage === 'summary' ? 'is-active' : ''}
          type="button"
          aria-pressed={activePage === 'summary'}
          onClick={() => setActivePage('summary')}
        >
          Suvestinė
        </button>
      </nav>
      {activePage === 'transactions' ? (
        <TransactionsPage onTransactionsChanged={() => setTransactionRevision((value) => value + 1)} />
      ) : (
        <SummaryPage transactionRevision={transactionRevision} />
      )}
    </>
  );
}
