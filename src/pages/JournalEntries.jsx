import React, { useState } from 'react';
import { useJournalEntries } from '../hooks/useJournalEntries';
import { useAccounts } from '../hooks/useAccounts';
import { Plus, Trash2, Save, X, Eye } from 'lucide-react';
import { format } from 'date-fns';

const JournalEntries = () => {
  const { entries, addJournalEntry, deleteJournalEntry, getLinesForEntry } = useJournalEntries();
  const { accounts } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState(null);
  const [viewLines, setViewLines] = useState([]);

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

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: 'var(--space-3)' }}>Date</th>
              <th style={{ padding: 'var(--space-3)' }}>Reference</th>
              <th style={{ padding: 'var(--space-3)' }}>Description</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-3)' }}>{format(new Date(entry.date), 'dd-MM-yyyy')}</td>
                <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{entry.reference || `JE-${entry.id}`}</td>
                <td style={{ padding: 'var(--space-3)' }}>{entry.description}</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                  <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => handleView(entry)}>
                    <Eye size={16} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '4px 8px', marginLeft: '8px', color: 'var(--danger)' }} onClick={() => deleteJournalEntry(entry.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
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
