import React from 'react';
import { useReports } from '../../hooks/useReports';
import { format } from 'date-fns';

const BalanceSheet = () => {
  const { reportData, loading } = useReports();

  if (loading) return <div className="card">Loading Balance Sheet...</div>;

  const { balanceSheet, pnl } = reportData;
  const currentEarnings = pnl.netProfit;
  const totalEquityPlusEarnings = balanceSheet.totalEquity + currentEarnings;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>Balance Sheet</h1>
          <p className="text-muted">As of {format(new Date(), 'dd MMMM yyyy')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Assets Side */}
        <div className="card">
          <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Assets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {balanceSheet.assets.map(acc => (
              <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{acc.code} {acc.name}</span>
                <span style={{ fontWeight: 600 }}>€{acc.balance.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '16px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total Assets</span>
              <span>€{balanceSheet.totalAssets.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Liabilities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {balanceSheet.liabilities.map(acc => (
                <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{acc.code} {acc.name}</span>
                  <span style={{ fontWeight: 600 }}>€{acc.balance.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total Liabilities</span>
                <span>€{balanceSheet.totalLiabilities.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>Equity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {balanceSheet.equity.map(acc => (
                <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{acc.code} {acc.name}</span>
                  <span style={{ fontWeight: 600 }}>€{acc.balance.toFixed(2)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontStyle: 'italic', color: 'var(--primary)' }}>
                <span>Current Year Earnings</span>
                <span>€{currentEarnings.toFixed(2)}</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total Equity</span>
              <span>€{totalEquityPlusEarnings.toFixed(2)}</span>
            </div>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--primary-light)', border: '2px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}>
              <span>Total Liabilities & Equity</span>
              <span>€{(balanceSheet.totalLiabilities + totalEquityPlusEarnings).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;
