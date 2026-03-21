import React, { useState } from 'react';
import { useVat } from '../hooks/useVat';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const VatManagement = () => {
  const { tariffs, addTariff, updateTariff, deleteTariff } = useVat();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTariff, setEditingTariff] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    rate: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      rate: parseFloat(formData.rate) / 100 // Convert percentage to decimal
    };

    if (editingTariff) {
      await updateTariff(editingTariff.id, data);
    } else {
      await addTariff(data);
    }
    closeModal();
  };

  const openModal = (tariff = null) => {
    if (tariff) {
      setEditingTariff(tariff);
      setFormData({
        name: tariff.name,
        rate: (tariff.rate * 100).toString()
      });
    } else {
      setEditingTariff(null);
      setFormData({ name: '', rate: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTariff(null);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>VAT Management</h1>
          <p className="text-muted">Configure VAT tariffs for your business</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          Add Tariff
        </button>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: 'var(--space-3)' }}>Name</th>
              <th style={{ padding: 'var(--space-3)' }}>Rate</th>
              <th style={{ padding: 'var(--space-3)' }}>Status</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tariffs.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{t.name}</td>
                <td style={{ padding: 'var(--space-3)' }}>{(t.rate * 100).toFixed(0)}%</td>
                <td style={{ padding: 'var(--space-3)' }}>
                  <span className={`badge ${t.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {t.isDefault && <span className="badge badge-warning" style={{ marginLeft: '8px' }}>Default</span>}
                </td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                  <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => openModal(t)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '4px 8px', marginLeft: '8px', color: 'var(--danger)' }} onClick={() => deleteTariff(t.id)}>
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
              <h3>{editingTariff ? 'Edit Tariff' : 'New VAT Tariff'}</h3>
              <button type="button" onClick={closeModal} aria-label="Close modal"><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Name</label>
                <input 
                  type="text" className="input" placeholder="e.g. Hoog (21%)" required 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Rate (%)</label>
                <input 
                  type="number" step="0.1" className="input" placeholder="21" required 
                  value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Tariff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VatManagement;
