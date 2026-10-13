import { useEffect, useState } from 'react';
import { listTransactions } from '../api/transactions.js';
import {
  calculateCashSummary,
  calculateProfitBySymbol,
  calculateTotalProfit,
} from '../services/profit/profit.js';
import { formatCents } from '../utils/money.js';

export default function SummaryPage({ transactionRevision = 0 }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const rows = await listTransactions();
        if (active) setTransactions(rows);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Nepavyko įkelti suvestinės.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [transactionRevision, retryKey]);

  if (loading) {
    return <main className="app-shell"><div className="page-container"><p className="state-message">Kraunama...</p></div></main>;
  }
  if (error) {
    return (
      <main className="app-shell">
        <div className="page-container">
          <div className="load-error" role="alert">
            <p>{error}</p>
            <button className="button button-secondary" type="button" onClick={() => setRetryKey((key) => key + 1)}>
              Bandyti dar kartą
            </button>
          </div>
        </div>
      </main>
    );
  }

  const cash = calculateCashSummary(transactions);
  const realizedBySymbol = calculateProfitBySymbol(transactions);
  const realizedBySymbolMap = new Map(realizedBySymbol.map((row) => [row.symbol, row]));
  const symbols = [...new Set(transactions.filter((row) => row.type === 'buy' || row.type === 'sell').map((row) => row.symbol))].sort();
  const totalProfitCents = calculateTotalProfit(transactions);

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="page-header">
          <div>
            <p className="eyebrow">Portfelio apžvalga</p>
            <h1>Suvestinė</h1>
            <p className="page-lede">Pinigų srautai ir parduotų pozicijų rezultatai.</p>
          </div>
          <span className="portfolio-mark" aria-hidden="true">↗</span>
        </header>

        <section className="summary-cash-grid" aria-label="Pinigų srautai">
          <article className="summary-card">
            <span>Įneštas kapitalas</span>
            <strong>{formatCents(cash.depositsCents)}</strong>
          </article>
          <article className="summary-card">
            <span>Bendra pirkimų suma</span>
            <strong>{formatCents(cash.buysCents)}</strong>
          </article>
          <article className="summary-card">
            <span>Pardavimų įplaukos</span>
            <strong>{formatCents(cash.sellProceedsCents)}</strong>
          </article>
          <article className="summary-card">
            <span>Sumokėti komisiniai</span>
            <strong>{formatCents(cash.feesCents)}</strong>
          </article>
          <article className="summary-card summary-card-highlight">
            <span>Dabartinis pinigų likutis</span>
            <strong>{formatCents(cash.balanceCents)}</strong>
          </article>
        </section>

        <section className="summary-profit-hero" aria-labelledby="total-profit-heading">
          <div>
            <p className="eyebrow">Realizuotas rezultatas</p>
            <h2 id="total-profit-heading">Bendras portfelio pelnas</h2>
            <p>Tai realizuotas pelnas. Neparduotų akcijų vertė neįskaičiuota.</p>
          </div>
          <strong className={totalProfitCents > 0 ? 'profit-positive' : totalProfitCents < 0 ? 'profit-negative' : ''}>
            {formatCents(totalProfitCents)}
          </strong>
        </section>

        <section className="panel summary-table-panel" aria-labelledby="symbol-profit-heading">
          <div className="list-heading">
            <div>
              <p className="eyebrow">Pardavimų rezultatai</p>
              <h2 id="symbol-profit-heading">Realizuotas pelnas pagal akciją</h2>
            </div>
          </div>
          {symbols.length === 0 ? (
            <div className="empty-state">Akcijų sandorių dar nėra</div>
          ) : (
            <div className="table-scroll">
              <table className="transactions-table summary-table">
                <thead>
                  <tr>
                    <th scope="col">Akcija</th>
                    <th scope="col">Parduotas kiekis</th>
                    <th scope="col">Įplaukos</th>
                    <th scope="col">Savikaina</th>
                    <th scope="col">Pelnas</th>
                  </tr>
                </thead>
                <tbody>
                  {symbols.map((symbol) => {
                    const row = realizedBySymbolMap.get(symbol);
                    return (
                      <tr key={symbol}>
                        <td className="symbol-cell">{symbol}</td>
                        <td>{row?.soldQuantity ?? 0}</td>
                        <td>{formatCents(row?.proceedsCents ?? 0)}</td>
                        <td>{formatCents(row?.costCents ?? 0)}</td>
                        <td className={row?.profitCents > 0 ? 'profit-positive' : row?.profitCents < 0 ? 'profit-negative' : ''}>
                          {formatCents(row?.profitCents ?? 0)}{!row && <span className="unrealized-label">Neparduota</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <footer className="page-footer">Pelnas apskaičiuojamas svertinio vidurkio metodu.</footer>
      </div>
    </main>
  );
}
