import React from 'react';
import { useReports } from '../../hooks/useReports';
import { format } from 'date-fns';

const ProfitAndLoss = () => {
  const { reportData, loading } = useReports();

  if (loading) return <div className="card">Loading P&L...</div>;

  const { pnl } = reportData;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>Profit & Loss</h1>
          <p className="text-muted">For current fiscal year</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>Revenue</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {pnl.revenue.map(acc => (
            <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{acc.code} {acc.name}</span>
              <span style={{ fontWeight: 600 }}>€{acc.balance.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: 'var(--success)' }}>
            <span>Total Revenue</span>
            <span>€{pnl.totalRevenue.toFixed(2)}</span>
          </div>
        </div>

        <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>Expenses</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {pnl.expenses.map(acc => (
            <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{acc.code} {acc.name}</span>
              <span style={{ fontWeight: 600 }}>€{acc.balance.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger)' }}>
            <span>Total Expenses</span>
            <span>€{pnl.totalExpenses.toFixed(2)}</span>
          </div>
        </div>

        <div className="card" style={{ backgroundColor: pnl.netProfit >= 0 ? '#dcfce7' : '#fee2e2', border: 'none', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.4rem' }}>
            <span>Net Profit / (Loss)</span>
            <span>€{pnl.netProfit.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLoss;
