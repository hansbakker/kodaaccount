import Dexie from 'dexie';

export const db = new Dexie('KodaAccountDB');

db.version(2).stores({
  accounts: '++id, &code, name, type, subType, vatTariffId, isActive',
  journalEntries: '++id, date, reference, description, isPosted, sourceType, sourceId',
  journalLines: '++id, entryId, accountId, vatTariffId',
  contacts: '++id, type, name, email, phone, vatNumber, isActive',
  invoices: '++id, number, contactId, date, dueDate, status, journalEntryId',
  invoiceLines: '++id, invoiceId, accountId, vatTariffId',
  bills: '++id, number, contactId, date, dueDate, status, journalEntryId',
  billLines: '++id, billId, accountId, vatTariffId',
  payments: '++id, date, type, contactId, invoiceId, billId, bankAccountId, journalEntryId',
  vatTariffs: '++id, name, rate, isDefault, isActive',
  bankAccounts: '++id, &name, accountNumber, glAccountId, balance',
  bankTransactions: '++id, bankAccountId, date, description, amount, status, matchedType, matchedId',
  settings: 'key, value'
});

// Indexes documentation:
// accounts: code (unique), type
// journalEntries: date, reference, [sourceType+sourceId]
// journalLines: entryId, accountId
// invoices: number, contactId, status
// bills: number, contactId, status
// payments: date, type, invoiceId, billId
