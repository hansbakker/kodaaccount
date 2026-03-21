import React, { useState, useMemo } from 'react';
import { useGeneralLedger } from '../hooks/useJournalEntries';
import { useAccounts } from '../hooks/useAccounts';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { FileText, Search, ArrowRightLeft, X } from 'lucide-react';
import DateRangePicker from '../components/shared/DateRangePicker';

const GeneralLedger = () => {
  const { accounts } = useAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  // List Filtering State
  const [filters, setFilters] = useState({
    dateRange: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    reference: '',
    description: '',
    accountCode: ''
  });

  const { ledgerLines, loading } = useGeneralLedger(selectedAccountId);

  // Filtered Ledger Lines
  const filteredLedger = useMemo(() => {
    return (ledgerLines || []).filter(line => {
      const lineDate = new Date(line.date);
      const inDateRange = isWithinInterval(lineDate, { 
        start: filters.dateRange.start, 
        end: filters.dateRange.end 
      });
      
      const matchRef = (line.reference || '').toLowerCase().includes(filters.reference.toLowerCase());
      const matchDesc = (line.description || '').toLowerCase().includes(filters.description.toLowerCase());
      const matchAccount = !selectedAccountId ? (line.accountCode || '').toLowerCase().includes(filters.accountCode.toLowerCase()) : true;
      
      return inDateRange && matchRef && matchDesc && matchAccount;
    });
  }, [ledgerLines, filters, selectedAccountId]);

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

      <DateRangePicker 
        value={filters.dateRange} 
        onChange={(range) => setFilters({ ...filters, dateRange: range })} 
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', backgroundColor: 'var(--bg-main)', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '16px' }}>Date</th>
              <th style={{ padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Ref</span>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                    <input 
                      className="input" 
                      style={{ padding: '4px 8px 4px 24px', fontSize: '0.75rem' }} 
                      placeholder="Filter..."
                      value={filters.reference}
                      onChange={e => setFilters({ ...filters, reference: e.target.value })}
                    />
                  </div>
                </div>
              </th>
              <th style={{ padding: '16px' }}>Source</th>
              {!selectedAccountId && (
                <th style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Account</span>
                    <input 
                      className="input" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                      placeholder="Code..."
                      value={filters.accountCode}
                      onChange={e => setFilters({ ...filters, accountCode: e.target.value })}
                    />
                  </div>
                </th>
              )}
              <th style={{ padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Description</span>
                  <div style={{ position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                    <input 
                      className="input" 
                      style={{ padding: '4px 8px 4px 24px', fontSize: '0.75rem' }} 
                      placeholder="Search..."
                      value={filters.description}
                      onChange={e => setFilters({ ...filters, description: e.target.value })}
                    />
                  </div>
                </div>
              </th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Debit</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Credit</th>
              {selectedAccountId && <th style={{ padding: '16px', textAlign: 'right' }}>Balance</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={selectedAccountId ? 7 : 6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading ledger...</td></tr>
            ) : filteredLedger.length === 0 ? (
              <tr><td colSpan={selectedAccountId ? 7 : 6} style={{ textAlign: 'center', padding: 'var(--space-8)' }} className="text-muted">No transactions match your filters.</td></tr>
            ) : (
              filteredLedger.map((line, i) => {
                runningBalance += (line.debit - line.credit);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontSize: '0.875rem' }}>{line.date ? format(new Date(line.date), 'dd/MM/yyyy') : ''}</td>
                    <td style={{ padding: '16px', fontSize: '0.875rem' }}>{line.reference || '-'}</td>
                    <td style={{ padding: '16px' }}>
                      {line.sourceType === 'bank_match' || line.sourceType === 'bank_direct' ? (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}>BANK</span>
                      ) : line.sourceType === 'invoice' ? (
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', fontWeight: 700, border: '1px solid var(--primary-dark)' }}>A/R</span>
                      ) : line.sourceType === 'bill' ? (
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 700, border: '1px solid #f59e0b' }}>A/P</span>
                      ) : (
                        <span className="badge badge-secondary" style={{ fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}>MANUAL</span>
                      )}
                    </td>
                    {!selectedAccountId && <td style={{ padding: '16px', fontSize: '0.875rem' }}>{line.accountCode}</td>}
                    <td style={{ padding: '16px', fontSize: '0.875rem' }}>{line.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right', color: line.debit > 0 ? 'var(--success)' : 'inherit' }}>
                      {line.debit > 0 ? line.debit.toFixed(2) : ''}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', color: line.credit > 0 ? 'var(--danger)' : 'inherit' }}>
                      {line.credit > 0 ? line.credit.toFixed(2) : ''}
                    </td>
                    {selectedAccountId && (
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>
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
