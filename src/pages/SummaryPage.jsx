import { Fragment, useEffect, useState } from 'react';
import { listTransactions } from '../api/transactions.js';
import {
  calculateCashSummary,
  calculateHoldings,
  calculateProfitBySymbol,
  calculateSellDetails,
  calculateTotalProfit,
} from '../services/profit/profit.js';
import { formatCents } from '../utils/money.js';

const formatProfitPercent = (profitCents, investedCapitalCents) => {
  if (investedCapitalCents === 0) return '—';
  const profit = BigInt(profitCents);
  const capital = BigInt(investedCapitalCents);
  const negative = profit < 0n;
  const numerator = (negative ? -profit : profit) * 10_000n;
  const roundedHundredths = (numerator + capital / 2n) / capital;
  const whole = (roundedHundredths / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  const fraction = String(roundedHundredths % 100n).padStart(2, '0');
  return `${negative ? '−' : ''}${whole},${fraction} %`;
};

export default function SummaryPage({ transactionRevision = 0 }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [expandedSymbols, setExpandedSymbols] = useState(() => new Set());

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
  const remainingPurchaseCostCents = calculateHoldings(transactions)
    .reduce((sum, holding) => sum + holding.totalCostCents, 0);
  const portfolioValueCents = remainingPurchaseCostCents + cash.balanceCents;
  const realizedBySymbol = calculateProfitBySymbol(transactions);
  const sellDetailsBySymbol = new Map();
  for (const detail of calculateSellDetails(transactions)) {
    const details = sellDetailsBySymbol.get(detail.symbol) ?? [];
    details.push(detail);
    sellDetailsBySymbol.set(detail.symbol, details);
  }
  const totalProfitCents = calculateTotalProfit(transactions);

  return (
    <main className="app-shell">
      <div className="page-container">
        <header className="page-header">
          <div>
            <p className="eyebrow">Portfelio apžvalga</p>
            <h1>Mano portfelis</h1>
            <p className="page-lede">Pinigų srautai ir parduotų pozicijų rezultatai.</p>
          </div>
          <span className="portfolio-mark" aria-hidden="true">↗</span>
        </header>

        <section className="summary-cash-grid" aria-label="Pinigų srautai">
          <article className="summary-card">
            <span>Įneštas kapitalas</span>
            <strong>{formatCents(cash.depositsCents)}</strong>
          </article>
          <article className="summary-card summary-card-highlight">
            <span>Portfelio vertė</span>
            <strong>{formatCents(portfolioValueCents)}</strong>
          </article>
          <section className="summary-profit-hero" aria-labelledby="total-profit-heading">
            <div>
              <p className="eyebrow">Realizuotas rezultatas</p>
              <h2 id="total-profit-heading">Bendras portfelio pelnas</h2>
              <p>Tai realizuotas pelnas. Neparduotų akcijų vertė neįskaičiuota.</p>
            </div>
            <div className="summary-profit-value">
              <strong className={totalProfitCents > 0 ? 'profit-positive' : totalProfitCents < 0 ? 'profit-negative' : ''}>
                {formatCents(totalProfitCents)}
              </strong>
              <div className="summary-profit-percent-line">
                <strong className={totalProfitCents > 0 ? 'profit-positive' : totalProfitCents < 0 ? 'profit-negative' : ''}>
                  {formatProfitPercent(totalProfitCents, cash.depositsCents)}
                </strong>
                <span>nuo įnešto kapitalo</span>
              </div>
            </div>
          </section>
          <article className="summary-card">
            <span>Bendra pirkimų vertė</span>
            <strong>{formatCents(remainingPurchaseCostCents)}</strong>
            <small>Turimų akcijų įsigijimo vertė</small>
          </article>
          <article className="summary-card summary-card-highlight">
            <span>Dabartinis pinigų likutis</span>
            <strong>{formatCents(cash.balanceCents)}</strong>
          </article>
        </section>

        <section className="panel summary-table-panel" aria-labelledby="symbol-profit-heading">
          <div className="list-heading">
            <div>
              <p className="eyebrow">Pardavimų rezultatai</p>
              <h2 id="symbol-profit-heading">Realizuotas pelnas pagal akciją</h2>
            </div>
          </div>
          {realizedBySymbol.length === 0 ? (
            <div className="empty-state">Parduotų akcijų dar nėra</div>
          ) : (
            <div className="table-scroll">
              <table className="transactions-table summary-table">
                <thead>
                  <tr>
                    <th scope="col"><span className="visually-hidden">Išskleisti</span></th>
                    <th scope="col">Akcija</th>
                    <th scope="col">Parduotas kiekis</th>
                    <th scope="col">Pardavimas</th>
                    <th scope="col">Savikaina</th>
                    <th scope="col">Pelnas / Nuostolis (-)</th>
                  </tr>
                </thead>
                <tbody>
                  {realizedBySymbol.map((row) => {
                    const expanded = expandedSymbols.has(row.symbol);
                    const saleDetails = sellDetailsBySymbol.get(row.symbol) ?? [];
                    return (
                      <Fragment key={row.symbol}>
                        <tr>
                          <td>
                            <button
                              className="expand-button"
                              type="button"
                              aria-expanded={expanded}
                              aria-label={`${expanded ? 'Suskleisti' : 'Išskleisti'} ${row.symbol} pardavimus`}
                              onClick={() => setExpandedSymbols((current) => {
                                const next = new Set(current);
                                if (next.has(row.symbol)) next.delete(row.symbol);
                                else next.add(row.symbol);
                                return next;
                              })}
                            >
                              {expanded ? '−' : '+'}
                            </button>
                          </td>
                          <td className="symbol-cell">{row.symbol}</td>
                          <td>{row.soldQuantity}</td>
                          <td>{formatCents(row.proceedsCents)}</td>
                          <td>{formatCents(row.costCents)}</td>
                          <td className={row.profitCents > 0 ? 'profit-positive' : row.profitCents < 0 ? 'profit-negative' : ''}>
                            {formatCents(row.profitCents)}
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="detail-row">
                            <td colSpan="6">
                              <p className="detail-note">
                                Pirkimai, kuriems pagal FIFO priskirta šio pardavimo savikaina, rodomi chronologine tvarka.
                              </p>
                              <div className="table-scroll">
                                <table className="sale-detail-table">
                                  <thead>
                                    <tr>
                                      <th scope="col">Sandoris</th>
                                      <th scope="col">Data</th>
                                      <th scope="col">Kiekis</th>
                                      <th scope="col">Kaina už akciją</th>
                                      <th scope="col">Pirkimo dalies savikaina / pardavimas</th>
                                      <th scope="col">Pardavimo savikaina</th>
                                      <th scope="col">Pelnas / Nuostolis (-)</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...saleDetails].reverse().map((sale) => (
                                      <Fragment key={`sale-${sale.transactionId}`}>
                                        {sale.purchaseAllocations.map((purchase) => (
                                          <tr key={`buy-${purchase.transactionId}`}>
                                            <td><span className="detail-kind detail-buy">Pirkimas</span></td>
                                            <td>{purchase.date}</td>
                                            <td>{purchase.quantity}</td>
                                            <td>{formatCents(purchase.priceCents)}</td>
                                            <td>{formatCents(purchase.costCents)}</td>
                                            <td>—</td>
                                            <td>—</td>
                                          </tr>
                                        ))}
                                        <tr className="sale-detail-row">
                                          <td><span className="detail-kind detail-sell">Pardavimas</span></td>
                                          <td>{sale.date}</td>
                                          <td>{sale.quantity}</td>
                                          <td>{formatCents(sale.priceCents)}</td>
                                          <td>{formatCents(sale.proceedsCents)}</td>
                                          <td>{formatCents(sale.costCents)}</td>
                                          <td className={sale.profitCents > 0 ? 'profit-positive' : sale.profitCents < 0 ? 'profit-negative' : ''}>
                                            {formatCents(sale.profitCents)}
                                          </td>
                                        </tr>
                                      </Fragment>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <footer className="page-footer">Pardavimo savikaina apskaičiuojama FIFO metodu.</footer>
      </div>
    </main>
  );
}
