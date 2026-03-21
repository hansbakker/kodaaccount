import React, { useState, useMemo } from 'react';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useAccounts } from '../hooks/useAccounts';
import { Plus, Trash2, Save, X, Eye, Search } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import DateRangePicker from '../components/shared/DateRangePicker';

const JournalEntries = () => {
  const { entries, addJournalEntry, deleteJournalEntry, getLinesForEntry } = useJournalEntries();
  const { accounts } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [viewLines, setViewLines] = useState([]);

  // Filtering State
  const [filters, setFilters] = useState({
    dateRange: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    reference: '',
    description: ''
  });

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    reference: '',
    description: '',
  });

  const [lines, setLines] = useState([
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' }
  ]);

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', debit: '', credit: '' }]);
  };

  const handleRemoveLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    
    // Clear opposite field if one is set
    if (field === 'debit' && value) newLines[index].credit = '';
    if (field === 'credit' && value) newLines[index].debit = '';
    
    setLines(newLines);
  };

  const totals = lines.reduce((acc, line) => ({
    debit: acc.debit + (parseFloat(line.debit) || 0),
    credit: acc.credit + (parseFloat(line.credit) || 0)
  }), { debit: 0, credit: 0 });

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.001 && totals.debit > 0;

  // Filtered Entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const inDateRange = isWithinInterval(entryDate, { 
        start: filters.dateRange.start, 
        end: filters.dateRange.end 
      });
      
      const referenceToMatch = entry.reference || `JE-${entry.id}`;
      const matchRef = referenceToMatch.toLowerCase().includes(filters.reference.toLowerCase());
      const matchDesc = entry.description.toLowerCase().includes(filters.description.toLowerCase());
      
      return inDateRange && matchRef && matchDesc;
    });
  }, [entries, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isBalanced) return;

    try {
      await addJournalEntry(formData, lines.filter(l => l.accountId && (l.debit || l.credit)));
      setIsModalOpen(false);
      setLines([{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }]);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        reference: '',
        description: '',
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleView = async (entry) => {
    const lines = await getLinesForEntry(entry.id);
    setViewingEntry(entry);
    setViewLines(lines);
  };

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1>Journal Entries</h1>
            <p className="text-muted">Directly record business transactions</p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            New Entry
          </button>
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
                    <span>Reference</span>
                    <div style={{ position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                      <input 
                        className="input" 
                        style={{ padding: '4px 8px 4px 24px', fontSize: '0.75rem' }} 
                        placeholder="Filter ref..."
                        value={filters.reference}
                        onChange={e => setFilters({ ...filters, reference: e.target.value })}
                      />
                    </div>
                  </div>
                </th>
                <th style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Description</span>
                    <div style={{ position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                      <input 
                        className="input" 
                        style={{ padding: '4px 8px 4px 24px', fontSize: '0.75rem' }} 
                        placeholder="Search memo..."
                        value={filters.description}
                        onChange={e => setFilters({ ...filters, description: e.target.value })}
                      />
                    </div>
                  </div>
                </th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '40px', textAlign: 'center' }} className="text-muted">
                    No journal entries match your filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>{format(new Date(entry.date), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{entry.reference || `JE-${entry.id}`}</td>
                    <td style={{ padding: '16px' }}>{entry.description}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => handleView(entry)} title="View entry">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger)' }} onClick={() => deleteJournalEntry(entry.id)} title="Delete entry">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* New Entry Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-card" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>New Journal Entry</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Close modal"><X /></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: 'var(--space-6)' }}>
                <div className="form-group">
                  <label className="label">Date</label>
                  <input type="date" className="input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="label">Reference</label>
                  <input type="text" className="input" placeholder="e.g. JE-001" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Description</label>
                <input type="text" className="input" placeholder="Memo..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>

              <table style={{ width: '100%', marginBottom: 'var(--space-6)' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: 'var(--space-2)' }}>Account</th>
                    <th style={{ padding: 'var(--space-2)', width: '120px' }}>Debit</th>
                    <th style={{ padding: 'var(--space-2)', width: '120px' }}>Credit</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td style={{ padding: 'var(--space-1)' }}>
                        <select 
                          className="input" 
                          value={line.accountId} 
                          onChange={e => handleLineChange(index, 'accountId', e.target.value)}
                        >
                          <option value="">Select Account...</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: 'var(--space-1)' }}>
                        <input 
                          type="number" step="0.01" className="input" placeholder="0.00" 
                          value={line.debit} onChange={e => handleLineChange(index, 'debit', e.target.value)}
                        />
                      </td>
                      <td style={{ padding: 'var(--space-1)' }}>
                        <input 
                          type="number" step="0.01" className="input" placeholder="0.00" 
                          value={line.credit} onChange={e => handleLineChange(index, 'credit', e.target.value)}
                        />
                      </td>
                      <td>
                        {lines.length > 2 && (
                          <button type="button" onClick={() => handleRemoveLine(index)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ textAlign: 'right', padding: 'var(--space-2)', fontWeight: 700 }}>Total</td>
                    <td style={{ padding: 'var(--space-2)', fontWeight: 700 }}>{totals.debit.toFixed(2)}</td>
                    <td style={{ padding: 'var(--space-2)', fontWeight: 700 }}>{totals.credit.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              <button type="button" className="btn btn-outline" style={{ marginBottom: 'var(--space-6)' }} onClick={handleAddLine}>
                <Plus size={16} /> Add Line
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-6)' }}>
                {!isBalanced && totals.debit > 0 && <span style={{ color: 'var(--danger)', fontSize: '0.875rem', alignSelf: 'center' }}>Entry does not balance!</span>}
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!isBalanced}>
                  <Save size={20} /> Post Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Entry Modal */}
      {viewingEntry && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewingEntry(null); }}>
          <div className="modal-card" style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>Journal Entry: {viewingEntry.reference || `JE-${viewingEntry.id}`}</h3>
              <button type="button" onClick={() => setViewingEntry(null)} aria-label="Close modal"><X /></button>
            </div>
            <p><strong>Date:</strong> {format(new Date(viewingEntry.date), 'dd-MM-yyyy')}</p>
            <p style={{ marginBottom: 'var(--space-4)' }}><strong>Description:</strong> {viewingEntry.description}</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '8px' }}>Account</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Debit</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {viewLines.map((line, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px' }}>{accounts.find(a => a.id === line.accountId)?.code} - {accounts.find(a => a.id === line.accountId)?.name}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{line.debit > 0 ? line.debit.toFixed(2) : ''}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{line.credit > 0 ? line.credit.toFixed(2) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default JournalEntries;
