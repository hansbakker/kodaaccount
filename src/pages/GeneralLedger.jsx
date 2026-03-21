import React, { useState } from 'react';
import { useGeneralLedger } from '../hooks/useJournalEntries';
import { useAccounts } from '../hooks/useAccounts';
import { format } from 'date-fns';
import { FileText, Search, ArrowRightLeft } from 'lucide-react';

const GeneralLedger = () => {
  const { accounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const { ledgerLines, loading } = useGeneralLedger(selectedAccountId);

  let runningBalance = 0;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>General Ledger</h1>
          <p className="text-muted">Detailed activity for each account</p>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: 'var(--space-6)' }}>
        <div style={{ flexGrow: 1 }}>
          <label className="label">Filter by Account</label>
          <select 
            className="input" 
            value={selectedAccountId} 
            onChange={e => setSelectedAccountId(e.target.value)}
          >
            <option value="">All Accounts</option>
            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
          </select>
        </div>
        <button className="btn btn-outline" onClick={() => setSelectedAccountId('')}>Clear Filter</button>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: 'var(--space-3)' }}>Date</th>
              <th style={{ padding: 'var(--space-3)' }}>Ref</th>
              <th style={{ padding: 'var(--space-3)' }}>Source</th>
              {!selectedAccountId && <th style={{ padding: 'var(--space-3)' }}>Account</th>}
              <th style={{ padding: 'var(--space-3)' }}>Description</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Debit</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Credit</th>
              {selectedAccountId && <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Balance</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading ledger...</td></tr>
            ) : ledgerLines.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>No transactions found.</td></tr>
            ) : (
              ledgerLines.map((line, i) => {
                runningBalance += (line.debit - line.credit);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 'var(--space-3)', fontSize: '0.875rem' }}>{line.date ? format(new Date(line.date), 'dd-MM-yyyy') : ''}</td>
                    <td style={{ padding: 'var(--space-3)', fontSize: '0.875rem' }}>{line.reference || '-'}</td>
                    <td style={{ padding: 'var(--space-3)' }}>
                      {line.sourceType?.startsWith('bank') ? (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Bank</span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Manual</span>
                      )}
                    </td>
                    {!selectedAccountId && <td style={{ padding: 'var(--space-3)', fontSize: '0.875rem' }}>{line.accountCode}</td>}
                    <td style={{ padding: 'var(--space-3)', fontSize: '0.875rem' }}>{line.description}</td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: line.debit > 0 ? 'var(--success)' : 'inherit' }}>
                      {line.debit > 0 ? line.debit.toFixed(2) : ''}
                    </td>
                    <td style={{ padding: 'var(--space-3)', textAlign: 'right', color: line.credit > 0 ? 'var(--danger)' : 'inherit' }}>
                      {line.credit > 0 ? line.credit.toFixed(2) : ''}
                    </td>
                    {selectedAccountId && (
                      <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600 }}>
                        {runningBalance.toFixed(2)}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GeneralLedger;
