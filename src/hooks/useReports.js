import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { startOfYear, endOfYear, isWithinInterval } from 'date-fns';

export const useReports = (dateRange = { start: startOfYear(new Date()), end: endOfYear(new Date()) }) => {
  const data = useLiveQuery(async () => {
    const accounts = await db.accounts.toArray();
    const lines = await db.journalLines.toArray();
    const entries = await db.journalEntries.toArray();

    // Filter entries by date range
    const filteredEntries = entries.filter(e => 
      isWithinInterval(new Date(e.date), { start: dateRange.start, end: dateRange.end })
    );
    const entryIds = new Set(filteredEntries.map(e => e.id));
    const filteredLines = lines.filter(l => entryIds.has(l.entryId));

    // Calculate balances per account
    const accountBalances = accounts.map(acc => {
      const accLines = filteredLines.filter(l => l.accountId === acc.id);
      const debit = accLines.reduce((sum, l) => sum + l.debit, 0);
      const credit = accLines.reduce((sum, l) => sum + l.credit, 0);
      const balance = (acc.type === 'asset' || acc.type === 'expense') 
        ? debit - credit 
        : credit - debit;
      
      return { ...acc, debit, credit, balance };
    });

    // 1. Balance Sheet (Assets, Liabilities, Equity)
    const balanceSheet = {
      assets: accountBalances.filter(a => a.type === 'asset'),
      liabilities: accountBalances.filter(a => a.type === 'liability'),
      equity: accountBalances.filter(a => a.type === 'equity'),
    };
    balanceSheet.totalAssets = balanceSheet.assets.reduce((sum, a) => sum + a.balance, 0);
    balanceSheet.totalLiabilities = balanceSheet.liabilities.reduce((sum, a) => sum + a.balance, 0);
    balanceSheet.totalEquity = balanceSheet.equity.reduce((sum, a) => sum + a.balance, 0);

    // 2. Profit & Loss (Revenue, Expense)
    const pnl = {
      revenue: accountBalances.filter(a => a.type === 'revenue'),
      expenses: accountBalances.filter(a => a.type === 'expense'),
    };
    pnl.totalRevenue = pnl.revenue.reduce((sum, a) => sum + a.balance, 0);
    pnl.totalExpenses = pnl.expenses.reduce((sum, a) => sum + a.balance, 0);
    pnl.netProfit = pnl.totalRevenue - pnl.totalExpenses;

    // 3. VAT Report
    const vatTariffs = await db.vatTariffs.toArray();
    const vatReport = vatTariffs.map(t => {
      // Net Sales (exclude the VAT line itself, only the revenue line)
      const salesLines = filteredLines.filter(l => 
        l.vatTariffId === t.id && 
        accounts.find(a => a.id === l.accountId)?.type === 'revenue'
      );
      
      // Net Purchases (exclude the VAT line itself, only the expense/asset line)
      const purchaseLines = filteredLines.filter(l => 
        l.vatTariffId === t.id && 
        ['expense', 'asset'].includes(accounts.find(a => a.id === l.accountId)?.type) &&
        !accounts.find(a => a.id === l.accountId)?.subType?.includes('vat') // Exclude VAT accounts
      );
      
      const vatSales = salesLines.reduce((sum, l) => sum + (l.vatAmount || 0), 0);
      const vatPurchases = purchaseLines.reduce((sum, l) => sum + (l.vatAmount || 0), 0);

      return {
        tariff: t.name,
        netSales: salesLines.reduce((sum, l) => sum + l.credit, 0),
        vatSales,
        netPurchases: purchaseLines.reduce((sum, l) => sum + l.debit, 0),
        vatPurchases,
      };
    });

    return { balanceSheet, pnl, vatReport, accountBalances };
  }, [dateRange]);

  return {
    reportData: data,
    loading: data === undefined
  };
};
