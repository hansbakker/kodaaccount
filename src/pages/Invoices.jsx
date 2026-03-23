import React, { useState, useMemo, useEffect } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { useAccounts } from '../hooks/useAccounts';
import { useVat, calculateVat } from '../hooks/useVat';
import { Plus, Users, FileText, X, Save, Search, Filter } from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import DateRangePicker from '../components/shared/DateRangePicker';

const Invoices = () => {
  const { invoices, customers, addInvoice, addCustomer, getLinesForInvoice } = useInvoices();
  const { accounts } = useAccounts();
  const { tariffs } = useVat();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Filtering State
  const [filters, setFilters] = useState({
    dateRange: { start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    number: '',
    customer: '',
    status: ''
  });

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
  const [activeAccount, setActiveAccount] = useState(null);

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const handleAddLine = () => {
    const defaultTariff = tariffs.find(t => t.isDefault) || tariffs[0];
    setLines([...lines, { 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      accountId: '', 
      vatTariffId: defaultTariff ? defaultTariff.id.toString() : '' 
    }]);
  };

  const handleRemoveLine = (index) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  // VAT Initialization Fix
  useEffect(() => {
    if (isModalOpen && !isReadOnly && tariffs.length > 0 && lines.length > 0 && (lines[0].vatTariffId === '' || !lines[0].vatTariffId)) {
      const defaultTariff = tariffs.find(t => t.isDefault) || tariffs[0];
      if (defaultTariff) {
        const newLines = [...lines];
        newLines[0].vatTariffId = defaultTariff.id.toString();
        setLines(newLines);
      }
    }
  }, [isModalOpen, isReadOnly, tariffs.length]); // Use tariffs.length as more stable dependency

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

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const invDate = new Date(inv.date);
      const inDateRange = isWithinInterval(invDate, { 
        start: filters.dateRange.start, 
        end: filters.dateRange.end 
      });
      
      const matchNumber = inv.number.toLowerCase().includes(filters.number.toLowerCase());
      const customerName = customers.find(c => c.id === inv.contactId)?.name || '';
      const matchCustomer = customerName.toLowerCase().includes(filters.customer.toLowerCase());
      const matchStatus = filters.status === '' || inv.status === filters.status;
      
      return inDateRange && matchNumber && matchCustomer && matchStatus;
    });
  }, [invoices, filters, customers]);

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

  const handleOpenNewInvoice = () => {
    setIsReadOnly(false);
    setFormData({
      number: `INV-${new Date().getFullYear()}-${1001 + invoices.length}`,
      contactId: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'),
    });
    setLines([{ description: '', quantity: 1, unitPrice: 0, accountId: '', vatTariffId: '' }]);
    setIsModalOpen(true);
  };

  const handleViewInvoice = async (invoice) => {
    const invoiceLines = await getLinesForInvoice(invoice.id);
    setFormData({
      number: invoice.number,
      contactId: invoice.contactId.toString(),
      date: format(new Date(invoice.date), 'yyyy-MM-dd'),
      dueDate: format(new Date(invoice.dueDate), 'yyyy-MM-dd'),
    });
    setLines(invoiceLines.map(line => ({
      ...line,
      accountId: line.accountId.toString(),
      vatTariffId: line.vatTariffId.toString()
    })));
    setIsReadOnly(true);
    setIsModalOpen(true);
  };

  return (
    <>
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
            <button className="btn btn-primary" onClick={handleOpenNewInvoice}>
              <Plus size={20} />
              New Invoice
            </button>
          </div>
        </div>

        <DateRangePicker 
          value={filters.dateRange} 
          onChange={(range) => setFilters({ ...filters, dateRange: range })} 
        />

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '16px' }}>Date</th>
                <th style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Number</span>
                    <div style={{ position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                      <input 
                        className="input" 
                        style={{ padding: '4px 8px 4px 24px', fontSize: '0.75rem' }} 
                        placeholder="Search..."
                        value={filters.number}
                        onChange={e => setFilters({ ...filters, number: e.target.value })}
                      />
                    </div>
                  </div>
                </th>
                <th style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>Customer</span>
                    <div style={{ position: 'relative' }}>
                      <Search size={12} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--text-muted)' }} />
                      <input 
                        className="input" 
                        style={{ padding: '4px 8px 4px 24px', fontSize: '0.75rem' }} 
                        placeholder="Filter customer..."
                        value={filters.customer}
                        onChange={e => setFilters({ ...filters, customer: e.target.value })}
                      />
                    </div>
                  </div>
                </th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                    <span>Status</span>
                    <select 
                      className="input" 
                      style={{ padding: '4px', fontSize: '0.75rem', width: '100px' }}
                      value={filters.status}
                      onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                      <option value="">All</option>
                      <option value="posted">Posted</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '40px', textAlign: 'center' }} className="text-muted">
                    No invoices match your filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(invoice => (
                  <tr 
                    key={invoice.id} 
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.2s' }} 
                    className="table-row-hover"
                    onClick={() => handleViewInvoice(invoice)}
                  >
                    <td style={{ padding: '16px' }}>{format(new Date(invoice.date), 'dd/MM/yyyy')}</td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>{invoice.number}</td>
                    <td style={{ padding: '16px' }}>
                      {customers.find(c => c.id === invoice.contactId)?.name || 'Unknown Customer'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 600 }}>
                      €{invoice.total?.toFixed(2)}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span className={`badge ${invoice.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Invoice Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-card" style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>{isReadOnly ? `Invoice ${formData.number}` : 'New Invoice'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Close modal"><X /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: 'var(--space-6)' }}>
                <div className="form-group">
                  <label className="label">Customer</label>
                  <select className="input" value={formData.contactId} onChange={e => setFormData({...formData, contactId: e.target.value})} required disabled={isReadOnly}>
                    <option value="">Select Customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Date</label>
                  <input type="date" className="input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required disabled={isReadOnly} />
                </div>
                <div className="form-group">
                  <label className="label">Due Date</label>
                  <input type="date" className="input" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} required disabled={isReadOnly} />
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
                      <td><input className="input" value={line.description} onChange={e => handleLineChange(index, 'description', e.target.value)} placeholder="Service description..." disabled={isReadOnly} /></td>
                      <td><input type="number" className="input" value={line.quantity} onChange={e => handleLineChange(index, 'quantity', e.target.value)} disabled={isReadOnly} /></td>
                      <td><input type="number" className="input" value={line.unitPrice} onChange={e => handleLineChange(index, 'unitPrice', e.target.value)} disabled={isReadOnly} /></td>
                      <td>
                        <select className="input" value={line.accountId} onChange={e => handleLineChange(index, 'accountId', e.target.value)} disabled={isReadOnly}>
                          <option value="">Account...</option>
                          {accounts.filter(a => a.type === 'revenue').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="input" value={line.vatTariffId} onChange={e => handleLineChange(index, 'vatTariffId', e.target.value)} disabled={isReadOnly}>
                          {tariffs.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>€{((line.quantity * line.unitPrice) * (1 + (tariffs.find(t => t.id === parseInt(line.vatTariffId))?.rate || 0))).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {lines.length > 1 && !isReadOnly && (
                          <button type="button" onClick={() => handleRemoveLine(index)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!isReadOnly && (
                <button type="button" className="btn btn-outline" style={{ marginBottom: 'var(--space-6)' }} onClick={handleAddLine}>
                  <Plus size={16} /> Add Line
                </button>
              )}

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
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>{isReadOnly ? 'Close' : 'Cancel'}</button>
                {!isReadOnly && <button type="submit" className="btn btn-primary"><Save size={20} /> Post Invoice</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsCustomerModalOpen(false); }}>
          <div className="modal-card" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
              <h3>Customers</h3>
              <button type="button" onClick={() => setIsCustomerModalOpen(false)} aria-label="Close modal"><X /></button>
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
    </>
  );
};

export default Invoices;
