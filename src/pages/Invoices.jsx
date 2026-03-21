import React, { useState } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { useAccounts } from '../hooks/useAccounts';
import { useVat, calculateVat } from '../hooks/useVat';
import { Plus, Users, FileText, X, Save } from 'lucide-react';
import { format, addDays } from 'date-fns';

const Invoices = () => {
  const { invoices, customers, addInvoice, addCustomer, getLinesForInvoice } = useInvoices();
  const { accounts } = useAccounts();
  const { tariffs } = useVat();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    number: `INV-${new Date().getFullYear()}-${1001 + invoices.length}`,
    contactId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
  });

  const [lines, setLines] = useState([
    { description: '', quantity: 1, unitPrice: 0, accountId: '', vatTariffId: '' }
  ]);

  const [customerForm, setCustomerForm] = useState({ name: '', email: '', vatNumber: '' });

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let vatTotal = 0;
    
    const processedLines = lines.map(line => {
      const tariff = tariffs.find(t => t.id === parseInt(line.vatTariffId));
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
    if (!formData.contactId || processedLines.some(l => !l.accountId)) return;

    await addInvoice({
      ...formData,
      contactId: parseInt(formData.contactId),
      subtotal,
      vatTotal,
      total
    }, processedLines);

    setIsModalOpen(false);
    setLines([{ description: '', quantity: 1, unitPrice: 0, accountId: '', vatTariffId: '' }]);
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    await addCustomer(customerForm);
    setIsCustomerModalOpen(false);
    setCustomerForm({ name: '', email: '', vatNumber: '' });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1>Invoices (AR)</h1>
          <p className="text-muted">Manage customer invoices and sales</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => setIsCustomerModalOpen(true)}>
            <Users size={20} />
            Customers
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} />
            New Invoice
          </button>
        </div>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: 'var(--space-3)' }}>Number</th>
              <th style={{ padding: 'var(--space-3)' }}>Customer</th>
              <th style={{ padding: 'var(--space-3)' }}>Date</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Total</th>
              <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{inv.number}</td>
                <td style={{ padding: 'var(--space-3)' }}>{customers.find(c => c.id === inv.contactId)?.name}</td>
                <td style={{ padding: 'var(--space-3)' }}>{format(new Date(inv.date), 'dd-MM-yyyy')}</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 600 }}>€{inv.total.toFixed(2)}</td>
                <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                  <span className="badge badge-success">Posted</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>New Invoice</h3>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: 'var(--space-6)' }}>
                <div className="form-group">
                  <label className="label">Customer</label>
                  <select className="input" value={formData.contactId} onChange={e => setFormData({...formData, contactId: e.target.value})} required>
                    <option value="">Select Customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
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
                      <td><input className="input" value={line.description} onChange={e => handleLineChange(index, 'description', e.target.value)} placeholder="Service description..." /></td>
                      <td><input type="number" className="input" value={line.quantity} onChange={e => handleLineChange(index, 'quantity', e.target.value)} /></td>
                      <td><input type="number" className="input" value={line.unitPrice} onChange={e => handleLineChange(index, 'unitPrice', e.target.value)} /></td>
                      <td>
                        <select className="input" value={line.accountId} onChange={e => handleLineChange(index, 'accountId', e.target.value)}>
                          <option value="">Account...</option>
                          {accounts.filter(a => a.type === 'revenue').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
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
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>€{total.toFixed(2)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Save size={20} /> Post Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>Customers</h3>
              <button onClick={() => setIsCustomerModalOpen(false)}><X /></button>
            </div>

            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: 'var(--space-6)' }}>
              {customers.map(c => (
                <div key={c.id} style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <strong>{c.name}</strong> <br/>
                  <small className="text-muted">{c.email}</small>
                </div>
              ))}
            </div>

            <h4 style={{ marginBottom: 'var(--space-3)' }}>Add Customer</h4>
            <form onSubmit={handleAddCustomer}>
              <div className="form-group"><input className="input" placeholder="Name" required value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} /></div>
              <div className="form-group"><input className="input" placeholder="Email" value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} /></div>
              <button className="btn btn-primary" style={{ width: '100%' }}>Add</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
