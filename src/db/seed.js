import { db } from './schema';

export const seedDatabase = async () => {
  // Check if we already have data
  const accountCount = await db.accounts.count();
  if (accountCount > 0) return;

  console.log('Seeding database with default accounts and VAT tariffs...');

  // 1. VAT Tariffs
  const tariffs = [
    { name: 'Hoog (21%)', rate: 0.21, isDefault: true, isActive: true },
    { name: 'Laag (9%)', rate: 0.09, isDefault: false, isActive: true },
    { name: 'Nul (0%)', rate: 0.00, isDefault: false, isActive: true },
    { name: 'Vrijgesteld', rate: 0.00, isDefault: false, isActive: true },
  ];
  await db.vatTariffs.bulkAdd(tariffs);
  const defaultTariff = await db.vatTariffs.where('isDefault').equals(1).first();

  // 2. Default Chart of Accounts (Dutch standard - simplified)
  const accounts = [
    // ASSETS (1xxx)
    { code: '1000', name: 'Kas', type: 'asset', subType: 'cash', isActive: true },
    { code: '1010', name: 'Bank 1', type: 'asset', subType: 'bank', isActive: true },
    { code: '1300', name: 'Debiteuren', type: 'asset', subType: 'receivable', isActive: true },
    { code: '1500', name: 'Voorraad', type: 'asset', subType: 'inventory', isActive: true },
    { code: '1900', name: 'Te vorderen BTW (Voorbelasting)', type: 'asset', subType: 'vat', isActive: true },

    // LIABILITIES (2xxx)
    { code: '2000', name: 'Crediteuren', type: 'liability', subType: 'payable', isActive: true },
    { code: '2100', name: 'Te betalen BTW', type: 'liability', subType: 'vat', isActive: true },
    { code: '2200', name: 'Leningen', type: 'liability', subType: 'loan', isActive: true },

    // EQUITY (3xxx)
    { code: '3000', name: 'Eigen Vermogen', type: 'equity', subType: 'equity', isActive: true },
    { code: '3900', name: 'Privé opname/stortingen', type: 'equity', subType: 'equity', isActive: true },

    // REVENUE (8xxx)
    { code: '8000', name: 'Omzet 21%', type: 'revenue', subType: 'sales', vatTariffId: defaultTariff?.id, isActive: true },
    { code: '8100', name: 'Omzet 9%', type: 'revenue', subType: 'sales', isActive: true },
    { code: '8200', name: 'Omzet 0%', type: 'revenue', subType: 'sales', isActive: true },

    // EXPENSES (4xxx-7xxx)
    { code: '4000', name: 'Inkoopkosten', type: 'expense', subType: 'purchase', isActive: true },
    { code: '4100', name: 'Huur', type: 'expense', subType: 'operating', isActive: true },
    { code: '4200', name: 'Telefoon/Internet', type: 'expense', subType: 'operating', isActive: true },
    { code: '4300', name: 'Kantoorkosten', type: 'expense', subType: 'operating', isActive: true },
    { code: '4400', name: 'Marketing', type: 'expense', subType: 'operating', isActive: true },
    { code: '4500', name: 'Reiskosten', type: 'expense', subType: 'operating', isActive: true },
    { code: '4600', name: 'Algemene kosten', type: 'expense', subType: 'operating', isActive: true },
  ];
  await db.accounts.bulkAdd(accounts);

  // 3. Settings
  await db.settings.bulkAdd([
    { key: 'companyName', value: 'KodaAccount Demo' },
    { key: 'currency', value: 'EUR' },
    { key: 'fiscalYearStart', value: '01-01' },
    { key: 'nextInvoiceNumber', value: 1001 },
    { key: 'nextBillNumber', value: 2001 },
    { key: 'nextJournalReference', value: 1 },
  ]);

  // 4. Bank Accounts
  const bankAccCount = await db.bankAccounts.count();
  if (bankAccCount === 0) {
    const bankGL = await db.accounts.where('code').equals('1010').first();
    if (bankGL) {
      await db.bankAccounts.add({
        name: 'Main Bank Account',
        accountNumber: 'NL00 BANK 0123 4567 89',
        glAccountId: bankGL.id,
        balance: 0
      });
    }
  }

  console.log('Seeding complete.');
};
