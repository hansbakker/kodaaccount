import React, { useState } from 'react';
import { useReports } from '../../hooks/useReports';
import { format, startOfYear, endOfYear } from 'date-fns';
import DateRangePicker from '../../components/shared/DateRangePicker';

const VatReport = () => {
  const [dateRange, setDateRange] = useState({
    start: startOfYear(new Date()),
    end: endOfYear(new Date())
  });
  const { reportData, loading } = useReports(dateRange);

  if (loading) return <div className="card">Loading VAT Report...</div>;

  const { vatReport } = reportData;
  const totalDue = vatReport.reduce((sum, r) => sum + (r.vatSales - r.vatPurchases), 0);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>VAT Report</h1>
          <p className="text-muted">{format(dateRange.start, 'dd MMM yyyy')} - {format(dateRange.end, 'dd MMM yyyy')}</p>
        </div>
      </div>

      <DateRangePicker value={dateRange} onChange={setDateRange} />

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '12px' }}>VAT Tariff</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Net Sales</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>VAT on Sales</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Net Purchases</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>VAT on Purchases</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Net VAT</th>
            </tr>
          </thead>
          <tbody>
            {vatReport.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>{row.tariff}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>€{row.netSales.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--success)' }}>€{row.vatSales.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>€{row.netPurchases.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: 'var(--primary)' }}>€{row.vatPurchases.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>€{(row.vatSales - row.vatPurchases).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              <td colSpan="5" style={{ padding: '20px 12px', textAlign: 'right' }}>Total VAT Due / (Refundable)</td>
              <td style={{ padding: '20px 12px', textAlign: 'right', color: totalDue >= 0 ? 'var(--danger)' : 'var(--success)' }}>
                €{totalDue.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card" style={{ marginTop: '24px', backgroundColor: 'var(--secondary-light)' }}>
        <h3>Note</h3>
        <p className="text-muted">This report is an internal calculation. Please verify with your official tax records before filing.</p>
      </div>
    </div>
  );
};

export default VatReport;
