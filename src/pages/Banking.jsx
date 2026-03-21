import React, { useState, useMemo } from 'react';
import { useBanking } from '../hooks/useBanking';
import { useInvoices } from '../hooks/useInvoices';
import { useBills } from '../hooks/useBills';
import { useAccounts } from '../hooks/useAccounts';
import { 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import DateRangePicker from '../components/shared/DateRangePicker';

const Banking = () => {
  const { bankAccounts, transactions, currentAccount, addTransaction, matchTransaction } = useBanking(1); // Default to main
  const { invoices } = useInvoices();
  const { bills } = useBills();
  const { accounts } = useAccounts();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reconcilingId, setReconcilingId] = useState(null);
  const [newTx, setNewTx] = useState({ date: format(new Date(), 'yyyy-MM-dd'), description: '', amount: '' });
  
  // List Filtering State
  const [listFilters, setListFilters] = useState({
    dateRange: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    description: '',
    amount: '',
    status: ''
  });

  const [matchFilter, setMatchFilter] = useState('');

  const handleAddTx = async (e) => {
    e.preventDefault();
    await addTransaction(newTx);
    setIsAddModalOpen(false);
    setNewTx({ date: format(new Date(), 'yyyy-MM-dd'), description: '', amount: '' });
  };

  const handleMatch = async (txId, matchData) => {
    await matchTransaction(txId, matchData);
    setReconcilingId(null);
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter(tx => {
      const txDate = new Date(tx.date);
      const inDateRange = isWithinInterval(txDate, { 
        start: listFilters.dateRange.start, 
        end: listFilters.dateRange.end 
      });
      
      const matchDesc = tx.description.toLowerCase().includes(listFilters.description.toLowerCase());
      const matchAmount = listFilters.amount === '' || tx.amount.toString().includes(listFilters.amount);
      const matchStatus = listFilters.status === '' || tx.status === listFilters.status;
      
      return inDateRange && matchDesc && matchAmount && matchStatus;
    });
  }, [transactions, listFilters]);

  const filteredInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.number.toLowerCase().includes(matchFilter.toLowerCase()));
  const filteredBills = bills.filter(bill => bill.status !== 'paid' && bill.number.toLowerCase().includes(matchFilter.toLowerCase()));
  const filteredGL = accounts.filter(acc => acc.name.toLowerCase().includes(matchFilter.toLowerCase()) || acc.code.includes(matchFilter));

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
          <div>
            <h1>Banking Ledger</h1>
            <p className="text-muted">Reconcile bank statements and manage payments</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={20} />
              Add Transaction
            </button>
          </div>
        </div>

        {currentAccount && (
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-dark)', marginBottom: 'var(--space-6)' }}>
            <div>
              <h3 style={{ margin: 0 }}>{currentAccount.name}</h3>
              <span className="text-muted">{currentAccount.accountNumber}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>Current Balance</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>€{currentAccount.balance.toFixed(2)}</div>
            </div>
          </div>
        )}

        <DateRangePicker 
          value={listFilters.dateRange} 
          onChange={(range) => setListFilters({ ...listFilters, dateRange: range })} 
        />

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--secondary-light)' }}>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Description</span>
                    <div style={{ position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                      <input 
                        className="input" 
                        style={{ padding: '4px 8px 4px 24px', fontSize: '0.75rem' }} 
                        placeholder="Search description..."
                        value={listFilters.description}
                        onChange={e => setListFilters({ ...listFilters, description: e.target.value })}
                      />
                    </div>
                  </div>
                </th>
                <th style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                    <span>Amount</span>
                    <input 
                      className="input" 
                      style={{ padding: '4px 8px', fontSize: '0.75rem', width: '100px', textAlign: 'right' }} 
                      placeholder="Filter amt..."
                      value={listFilters.amount}
                      onChange={e => setListFilters({ ...listFilters, amount: e.target.value })}
                    />
                  </div>
                </th>
                <th style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <span>Status</span>
                    <select 
                      className="input" 
                      style={{ padding: '4px', fontSize: '0.75rem', width: '100px' }}
                      value={listFilters.status}
                      onChange={e => setListFilters({ ...listFilters, status: e.target.value })}
                    >
                      <option value="">All</option>
                      <option value="unmatched">Unmatched</option>
                      <option value="matched">Matched</option>
                    </select>
                  </div>
                </th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                   <td colSpan="5" style={{ padding: '40px', textAlign: 'center' }} className="text-muted">
                    No transactions match your filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <React.Fragment key={tx.id}>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: reconcilingId === tx.id ? '#f8fafc' : 'transparent' }}>
                      <td style={{ padding: '16px' }}>{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                      <td style={{ padding: '16px' }}>{tx.description}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: tx.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        €{tx.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        {tx.status === 'matched' ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Matched
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14} /> Unmatched
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        {tx.status === 'unmatched' ? (
                          <button className="btn btn-outline btn-sm" onClick={() => setReconcilingId(reconcilingId === tx.id ? null : tx.id)}>
                            {reconcilingId === tx.id ? 'Cancel' : 'Match'}
                          </button>
                        ) : (
                          <div style={{ textAlign: 'right' }}>
                            <span className="text-muted" style={{ display: 'block', fontSize: '0.75rem' }}>{tx.matchedType} #{tx.matchedId}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>GL JE-{tx.journalEntryId}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                    {reconcilingId === tx.id && (
                      <tr>
                        <td colSpan="5" style={{ padding: '24px', backgroundColor: '#f1f5f9', borderBottom: '2px solid var(--primary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h4>Find a Match for €{tx.amount.toFixed(2)}</h4>
                            <div style={{ position: 'relative' }}>
                              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--secondary)' }} />
                              <input 
                                className="input" 
                                style={{ paddingLeft: '36px', width: '300px' }} 
                                placeholder="Filter invoices, bills, accounts..." 
                                value={matchFilter}
                                onChange={e => setMatchFilter(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Invoices */}
                            <div className="card" style={{ marginBottom: 0, maxHeight: '300px', overflowY: 'auto' }}>
                              <h5 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowDownLeft size={16} color="var(--success)" /> Posted Invoices
                              </h5>
                              {filteredInvoices.map(inv => (
                                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => handleMatch(tx.id, { type: 'invoice', id: inv.id })}>
                                  <span>{inv.number}</span>
                                  <span style={{ fontWeight: 600 }}>€{inv.total.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Bills */}
                            <div className="card" style={{ marginBottom: 0, maxHeight: '300px', overflowY: 'auto' }}>
                              <h5 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ArrowUpRight size={16} color="var(--danger)" /> Posted Bills
                              </h5>
                              {filteredBills.map(bill => (
                                <div key={bill.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }} onClick={() => handleMatch(tx.id, { type: 'bill', id: bill.id })}>
                                  <span>{bill.number}</span>
                                  <span style={{ fontWeight: 600 }}>€{bill.total.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="card" style={{ marginTop: '20px', marginBottom: 0 }}>
                            <h5 style={{ marginBottom: '12px' }}>Direct Post to Account</h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', maxHeight: '150px', overflowY: 'auto' }}>
                              {filteredGL.map(acc => (
                                <button 
                                  key={acc.id} 
                                  className="btn btn-outline btn-sm" 
                                  style={{ textAlign: 'left', fontWeight: 'normal' }}
                                  onClick={() => handleMatch(tx.id, { type: 'direct', glAccountId: acc.id })}
                                >
                                  {acc.code} {acc.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}>
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>Add Bank Transaction</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} aria-label="Close modal"><X /></button>
            </div>
            <form onSubmit={handleAddTx}>
              <div className="form-group">
                <label className="label">Date</label>
                <input type="date" className="input" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <input className="input" placeholder="e.g. Sales Invoice INV-001" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Amount</label>
                <input type="number" step="0.01" className="input" placeholder="e.g. 121.00 or -50.00" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)' }}>Add Transaction</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Banking;
