import React, { useState, useEffect } from 'react';
import { db } from '../db/schema';
import { Download, Upload, Trash2, Building } from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [companyName, setCompanyName] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await db.settings.toArray();
    setSettings(s);
    setCompanyName(s.find(i => i.key === 'companyName')?.value || '');
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    await db.settings.put({ key: 'companyName', value: companyName });
    alert('Company name updated!');
  };

  const exportData = async () => {
    const data = {};
    for (const table of db.tables) {
      data[table.name] = await table.toArray();
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koda-account-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        await db.transaction('rw', db.tables, async () => {
          for (const [tableName, rows] of Object.entries(data)) {
            await db.table(tableName).clear();
            await db.table(tableName).bulkAdd(rows);
          }
        });
        alert('Data imported successfully! Reloading...');
        window.location.reload();
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const clearData = async () => {
    if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      await db.delete();
      window.location.reload();
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1>Settings</h1>
        <p className="text-muted">Manage your company profile and data</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Building size={20} color="var(--primary)" />
            <h3>Company Profile</h3>
          </div>
          <form onSubmit={handleUpdateCompany}>
            <div className="form-group">
              <label className="label">Company Name</label>
              <input 
                className="input" 
                value={companyName} 
                onChange={e => setCompanyName(e.target.value)}
                placeholder="My Awesome Small Business"
              />
            </div>
            <button className="btn btn-primary">Update Profile</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Download size={20} color="var(--primary)" />
            <h3>Data Management</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p className="text-muted">Back up your data or restore from a previous export.</p>
            
            <button className="btn btn-outline" onClick={exportData} style={{ justifyContent: 'flex-start' }}>
              <Download size={18} /> Export Backup (JSON)
            </button>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                id="import-file" 
                style={{ display: 'none' }} 
                onChange={importData}
                accept=".json"
              />
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => document.getElementById('import-file').click()}>
                <Upload size={18} /> Import Backup (JSON)
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '12px 0' }} />
            
            <button className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)', justifyContent: 'flex-start' }} onClick={clearData}>
              <Trash2 size={18} /> Reset All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
