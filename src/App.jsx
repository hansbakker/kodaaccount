import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  BookOpen, 
  FileText, 
  ShoppingCart, 
  Users, 
  Percent, 
  Settings as SettingsIcon,
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { seedDatabase } from './db/seed';
import ChartOfAccounts from './pages/ChartOfAccounts';
import JournalEntries from './pages/JournalEntries';
import GeneralLedger from './pages/GeneralLedger';
import VatManagement from './pages/VatManagement';
import Invoices from './pages/Invoices';
import Bills from './pages/Bills';
import BalanceSheet from './pages/reports/BalanceSheet';
import ProfitAndLoss from './pages/reports/ProfitAndLoss';
import VatReport from './pages/reports/VatReport';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import Banking from './pages/Banking';

// Custom Sidebar Component
const Layout = ({ theme, toggleTheme }) => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid #334155' }}>
          <h2 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={28} color="var(--primary)" />
            <span>KodaAccount</span>
          </h2>
        </div>
        
        <nav style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          
          <div className="text-muted" style={{ padding: 'var(--space-4) var(--space-2) var(--space-2)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Bookkeeping</div>
          <SidebarItem to="/accounts" icon={<BookOpen size={20} />} label="Accounts" />
          <SidebarItem to="/journal" icon={<ArrowRightLeft size={20} />} label="Journal Entries" />
          <SidebarItem to="/ledger" icon={<FileText size={20} />} label="General Ledger" />
          
          <div className="text-muted" style={{ padding: 'var(--space-4) var(--space-2) var(--space-2)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Transactions</div>
          <SidebarItem to="/invoices" icon={<Users size={20} />} label="Invoices (AR)" />
          <SidebarItem to="/bills" icon={<ShoppingCart size={20} />} label="Bills (AP)" />
          <SidebarItem to="/banking" icon={<Wallet size={20} />} label="Banking Ledger" />
          <SidebarItem to="/vat" icon={<Percent size={20} />} label="VAT" />
          
          <div className="text-muted" style={{ padding: 'var(--space-4) var(--space-2) var(--space-2)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Reports</div>
          <SidebarItem to="/reports/balance-sheet" icon={<BookOpen size={20} />} label="Balance Sheet" />
          <SidebarItem to="/reports/pnl" icon={<BarChart3 size={20} />} label="Profit & Loss" />
          <SidebarItem to="/reports/vat" icon={<Percent size={20} />} label="VAT Report" />
          
          <div style={{ marginTop: 'auto' }}>
            <SidebarItem to="/settings" icon={<SettingsIcon size={20} />} label="Settings" />
          </div>
        </nav>
      </aside>
      
      <main className="main-content">
        <header className="page-header">
          <div className="text-muted">Small Business Accounting</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '8px', borderRadius: '50%' }}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div className="badge badge-success">Live Data</div>
          </div>
        </header>
        <section className="page-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

const SidebarItem = ({ to, icon, label }) => (
  <NavLink 
    to={to} 
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: 'var(--space-3) var(--space-4)',
      borderRadius: 'var(--radius-sm)',
      color: isActive ? 'white' : 'var(--sidebar-text)',
      backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
      opacity: isActive ? 1 : 0.7,
      transition: 'all 0.2s'
    })}
    className="sidebar-link"
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

function App() {
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    seedDatabase().catch(console.error);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout theme={theme} toggleTheme={toggleTheme} />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<ChartOfAccounts />} />
          <Route path="journal" element={<JournalEntries />} />
          <Route path="ledger" element={<GeneralLedger />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="bills" element={<Bills />} />
          <Route path="banking" element={<Banking />} />
          <Route path="vat" element={<VatManagement />} />
          <Route path="reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="reports/pnl" element={<ProfitAndLoss />} />
          <Route path="reports/vat" element={<VatReport />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
