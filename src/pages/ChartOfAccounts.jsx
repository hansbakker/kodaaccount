import React, { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const ChartOfAccounts = () => {
  const { accounts, vatTariffs, addAccount, updateAccount, deleteAccount } = useAccounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAccount, setEditingAccount] = useState(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'asset',
    subType: '',
    vatTariffId: ''
  });

  const filteredAccounts = accounts.filter(acc => 
    acc.isActive !== false &&
    (acc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     acc.code.includes(searchQuery))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      vatTariffId: formData.vatTariffId ? parseInt(formData.vatTariffId) : undefined
    };

    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
    } else {
      await addAccount(data);
    }
    
    closeModal();
  };

  const openModal = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        subType: account.subType || '',
        vatTariffId: account.vatTariffId || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({ code: '', name: '', type: 'asset', subType: '', vatTariffId: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>Chart of Accounts</h1>
          <p className="text-muted">Manage your business accounts and categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          Add Account
        </button>
      </div>

      <div className="card">
        <div style={{ position: 'relative', marginBottom: 'var(--space-6)' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} size={18} />
          <input 
            type="text" 
            className="input" 
            placeholder="Search accounts by name or code..." 
            style={{ paddingLeft: '40px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: 'var(--space-3)' }}>Code</th>
              <th style={{ padding: 'var(--space-3)' }}>Name</th>
              <th style={{ padding: 'var(--space-3)' }}>Type</th>
              <th style={{ padding: 'var(--space-3)' }}>VAT Tariff</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(acc => (
              <tr key={acc.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{acc.code}</td>
                <td style={{ padding: 'var(--space-3)' }}>{acc.name}</td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <span className="badge" style={{ ...getTypeStyle(acc.type), fontSize: '0.65rem', padding: '2px 8px', fontWeight: 700 }}>
                    {acc.type.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-3)' }}>
                  {vatTariffs.find(t => t.id === acc.vatTariffId)?.name || '-'}
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                  <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => openModal(acc)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '4px 8px', marginLeft: '8px', color: 'var(--danger)' }} onClick={() => deleteAccount(acc.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>{editingAccount ? 'Edit Account' : 'New Account'}</h3>
              <button type="button" onClick={closeModal} aria-label="Close modal"><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Code</label>
                <input 
                  type="text" className="input" required 
                  value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Name</label>
                <input 
                  type="text" className="input" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Type</label>
                <select 
                  className="input" 
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Default VAT Tariff</label>
                <select 
                  className="input" 
                  value={formData.vatTariffId} onChange={e => setFormData({...formData, vatTariffId: e.target.value})}
                >
                  <option value="">None</option>
                  {vatTariffs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingAccount ? 'Save Changes' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover { background-color: var(--secondary-light); }
      `}</style>
    </div>
  );
};

const getTypeStyle = (type) => {
  switch(type) {
    case 'asset': return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'liability': return { backgroundColor: '#fee2e2', color: '#991b1b' };
    case 'equity': return { backgroundColor: '#fef9c3', color: '#854d0e' };
    case 'revenue': return { backgroundColor: '#e0f2fe', color: '#075985' };
    case 'expense': return { backgroundColor: '#f3e8ff', color: '#6b21a8' };
    default: return { backgroundColor: '#f1f5f9', color: '#444' };
  }
};

export default ChartOfAccounts;
