import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useInvoices = () => {
  const invoices = useLiveQuery(() => db.invoices.orderBy('date').reverse().toArray());
  const customers = useLiveQuery(() => db.contacts.where('type').anyOf(['customer', 'both']).toArray().then(arr => arr.filter(c => c.isActive !== false)));

  const addInvoice = async (invoice, lines) => {
    return await db.transaction('rw', db.invoices, db.invoiceLines, db.journalEntries, db.journalLines, db.accounts, async () => {
      // 1. Save Invoice
      const invoiceId = await db.invoices.add({
        ...invoice,
        status: 'posted',
        date: new Date(invoice.date),
        dueDate: new Date(invoice.dueDate)
      });

      // 2. Save Lines
      const linesWithId = lines.map(line => ({
        ...line,
        invoiceId,
        accountId: parseInt(line.accountId),
        vatTariffId: parseInt(line.vatTariffId)
      }));
      await db.invoiceLines.bulkAdd(linesWithId);

      // 3. Generate Journal Entry
      // DR: Accounts Receivable (1300)
      // CR: Revenue (Line Account)
      // CR: VAT Payable (2100)
      
      const arAccount = await db.accounts.where('code').equals('1300').first();
      const vatAccount = await db.accounts.where('code').equals('2100').first();

      const journalEntryId = await db.journalEntries.add({
        date: new Date(invoice.date),
        reference: invoice.number,
        description: `Invoice: ${invoice.number}`,
        isPosted: true,
        sourceType: 'invoice',
        sourceId: invoiceId
      });

      const journalLines = [];
      
      // Debit AR
      journalLines.push({
        entryId: journalEntryId,
        accountId: arAccount.id,
        debit: invoice.total,
        credit: 0
      });

      // Credit Revenue & VAT per line
      for (const line of linesWithId) {
        journalLines.push({
          entryId: journalEntryId,
          accountId: line.accountId,
          debit: 0,
          credit: line.lineTotal - line.vatAmount,
          vatTariffId: line.vatTariffId,
          vatAmount: line.vatAmount
        });

        if (line.vatAmount > 0) {
          journalLines.push({
            entryId: journalEntryId,
            accountId: vatAccount.id,
            debit: 0,
            credit: line.vatAmount,
            vatTariffId: line.vatTariffId,
            vatAmount: line.vatAmount
          });
        }
      }

      await db.journalLines.bulkAdd(journalLines);
      await db.invoices.update(invoiceId, { journalEntryId });

      return invoiceId;
    });
  };

  const getLinesForInvoice = async (invoiceId) => {
    return await db.invoiceLines.where('invoiceId').equals(invoiceId).toArray();
  };

  const addCustomer = async (customer) => {
    return await db.contacts.add({ ...customer, type: 'customer', isActive: true });
  };

  return {
    invoices: invoices || [],
    customers: customers || [],
    addInvoice,
    getLinesForInvoice,
    addCustomer,
    loading: invoices === undefined
  };
};
