import React from 'react';
import { useReports } from '../hooks/useReports';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  AlertCircle 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { reportData, loading } = useReports();

  if (loading) return <div className="card">Loading Dashboard...</div>;

  const { pnl, balanceSheet, accountBalances } = reportData;

  const kpis = [
    { label: 'Total Revenue', value: pnl.totalRevenue, icon: <TrendingUp color="var(--success)" />, color: 'var(--success)' },
    { label: 'Total Expenses', value: pnl.totalExpenses, icon: <TrendingDown color="var(--danger)" />, color: 'var(--danger)' },
    { label: 'Net Profit', value: pnl.netProfit, icon: <Wallet color="var(--primary)" />, color: 'var(--primary)' },
    { label: 'Bank Balance', value: accountBalances.find(a => a.subType === 'bank')?.balance || 0, icon: <Receipt color="var(--info)" />, color: 'var(--info)' },
  ];

  const barData = {
    labels: ['Revenue', 'Expenses', 'Profit'],
    datasets: [
      {
        label: 'Financial Performance',
        data: [pnl.totalRevenue, pnl.totalExpenses, pnl.netProfit],
        backgroundColor: ['#dcfce7', '#fee2e2', '#e0f2fe'],
        borderColor: ['#10b981', '#ef4444', '#3b82f6'],
        borderWidth: 1,
      },
    ],
  };

  const assetData = {
    labels: balanceSheet.assets.map(a => a.name),
    datasets: [
      {
        data: balanceSheet.assets.map(a => a.balance),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
        ],
      },
    ],
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1>Financial Overview</h1>
        <p className="text-muted">Real-time performance of your business</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: 'var(--space-8)' }}>
        {kpis.map((kpi, i) => (
          <div key={i} className="card" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-main)' }}>
              {kpi.icon}
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>€{kpi.value.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <h3>Profit & Loss Summary</h3>
          <div style={{ height: '300px', marginTop: '20px' }}>
            <Bar 
              data={barData} 
              options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
            />
          </div>
        </div>
        <div className="card">
          <h3>Asset Allocation</h3>
          <div style={{ height: '300px', marginTop: '20px' }}>
            <Doughnut 
              data={assetData} 
              options={{ maintainAspectRatio: false }} 
            />
          </div>
        </div>
      </div>

      {pnl.netProfit < 0 && (
        <div className="card" style={{ border: '1px solid var(--danger)', backgroundColor: '#fef2f2', display: 'flex', gap: '12px', alignItems: 'center', marginTop: '24px' }}>
          <AlertCircle color="var(--danger)" />
          <div>
            <strong style={{ color: '#991b1b' }}>Net Loss Detected</strong>
            <p className="text-muted" style={{ margin: 0 }}>Review your expenses to improve your margins.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
