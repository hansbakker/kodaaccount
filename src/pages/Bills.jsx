import React, { useState } from 'react';
import { useBills } from '../hooks/useBills';
import { useAccounts } from '../hooks/useAccounts';
import { useVat, calculateVat } from '../hooks/useVat';
import { Plus, Truck, FileText, X, Save } from 'lucide-react';
import { format, addDays } from 'date-fns';

const Bills = () => {
  const { bills, vendors, addBill, addVendor, getLinesForBill } = useBills();
  const { accounts } = useAccounts();
  const { tariffs } = useVat();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    number: '',
    contactId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
  });

  const [lines, setLines] = useState([
    { description: '', quantity: 1, unitPrice: 0, accountId: '', vatTariffId: '' }
  ]);

  const [vendorForm, setVendorForm] = useState({ name: '', email: '', vatNumber: '' });

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  // VAT Initialization Fix
  React.useEffect(() => {
    if (tariffs.length > 0 && lines[0].vatTariffId === '') {
      const defaultTariff = tariffs.find(t => t.isDefault) || tariffs[0];
      if (defaultTariff) {
        const newLines = [...lines];
        newLines[0].vatTariffId = defaultTariff.id.toString();
        setLines(newLines);
      }
    }
  }, [tariffs, isModalOpen]);

  const calculateTotals = () => {
    let subtotal = 0;
    let vatTotal = 0;
    
    const processedLines = lines.map(line => {
      const tariffId = parseInt(line.vatTariffId);
      const tariff = tariffs.find(t => t.id === tariffId);
      const lineSubtotal = (parseFloat(line.quantity) || 0) * (parseFloat(line.unitPrice) || 0);
      const vat = calculateVat(lineSubtotal, tariff?.rate || 0);
      
      subtotal += lineSubtotal;
      vatTotal += vat.vat;
      
      return { ...line, vatAmount: vat.vat, lineTotal: vat.gross };
    });

    return { subtotal, vatTotal, total: subtotal + vatTotal, processedLines };
  };

  const { subtotal, vatTotal, total, processedLines } = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contactId || !formData.number || processedLines.some(l => !l.accountId)) return;

    await addBill({
      ...formData,
      contactId: parseInt(formData.contactId),
      subtotal,
      vatTotal,
      total
    }, processedLines);

    setIsModalOpen(false);
    setLines([{ description: '', quantity: 1, unitPrice: 0, accountId: '', vatTariffId: '' }]);
    setFormData({ ...formData, number: '' });
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    await addVendor(vendorForm);
    setIsVendorModalOpen(false);
    setVendorForm({ name: '', email: '', vatNumber: '' });
  };

  return (
    <>
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1>Bills (AP)</h1>
            <p className="text-muted">Manage vendor bills and purchases</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" onClick={() => setIsVendorModalOpen(true)}>
              <Truck size={20} />
              Vendors
            </button>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={20} />
              Add Bill
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>Number</th>
                <th style={{ padding: '16px' }}>Vendor</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center' }} className="text-muted">
                    No bills found. Add your first bill to get started.
                  </td>
                </tr>
              ) : (
                bills.map(bill => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px' }}>{format(new Date(bill.date), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{bill.number}</td>
                    <td style={{ padding: '16px' }}>
                      {vendors.find(v => v.id === bill.contactId)?.name || 'Unknown Vendor'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>
                      €{bill.total?.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span className={`badge ${bill.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {bill.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Bill Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>Add Vendor Bill</h3>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', marginBottom: 'var(--space-6)' }}>
                <div className="form-group">
                  <label className="label">Vendor</label>
                  <select className="input" value={formData.contactId} onChange={e => setFormData({...formData, contactId: e.target.value})} required>
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Bill Number</label>
                  <input type="text" className="input" placeholder="e.g. 2024-88" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="label">Date</label>
                  <input type="date" className="input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required />
                </div>
              </div>

              <table style={{ width: '100%', marginBottom: 'var(--space-6)' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th>Description</th>
                    <th style={{ width: '80px' }}>Qty</th>
                    <th style={{ width: '120px' }}>Price</th>
                    <th style={{ width: '180px' }}>Account</th>
                    <th style={{ width: '150px' }}>VAT</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td><input className="input" value={line.description} onChange={e => handleLineChange(index, 'description', e.target.value)} placeholder="Expense description..." /></td>
                      <td><input type="number" className="input" value={line.quantity} onChange={e => handleLineChange(index, 'quantity', e.target.value)} /></td>
                      <td><input type="number" className="input" value={line.unitPrice} onChange={e => handleLineChange(index, 'unitPrice', e.target.value)} /></td>
                      <td>
                        <select className="input" value={line.accountId} onChange={e => handleLineChange(index, 'accountId', e.target.value)}>
                          <option value="">Account...</option>
                          {accounts.filter(a => a.type === 'expense' || a.type === 'asset').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="input" value={line.vatTariffId} onChange={e => handleLineChange(index, 'vatTariffId', e.target.value)}>
                          {tariffs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>€{((line.quantity * line.unitPrice) * (1 + (tariffs.find(t => t.id === parseInt(line.vatTariffId))?.rate || 0))).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px', padding: 'var(--space-4) 0', borderTop: '1px solid var(--border-color)' }}>
                <div>
                  <div className="text-muted">Subtotal</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>€{subtotal.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted">VAT</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>€{vatTotal.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-muted">Total</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>€{total.toFixed(2)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={20} /> Post Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {isVendorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>Vendors</h3>
              <button onClick={() => setIsVendorModalOpen(false)}><X /></button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: 'var(--space-6)' }}>
              {vendors.map(v => (
                <div key={v.id} style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <strong>{v.name}</strong> <br/>
                  <small className="text-muted">{v.email}</small>
                </div>
              ))}
            </div>

            <h4 style={{ marginBottom: 'var(--space-3)' }}>Add Vendor</h4>
            <form onSubmit={handleAddVendor}>
              <div className="form-group"><input className="input" placeholder="Name" required value={vendorForm.name} onChange={e => setVendorForm({...vendorForm, name: e.target.value})} /></div>
              <div className="form-group"><input className="input" placeholder="Email" value={vendorForm.email} onChange={e => setVendorForm({...vendorForm, email: e.target.value})} /></div>
              <button className="btn btn-primary" style={{ width: '100%' }}>Add</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Bills;
