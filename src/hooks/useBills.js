import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useBills = () => {
  const bills = useLiveQuery(() => db.bills.orderBy('date').reverse().toArray());
  const vendors = useLiveQuery(() => db.contacts.where('type').anyOf(['vendor', 'both']).toArray());

  const addBill = async (bill, lines) => {
    return await db.transaction('rw', db.bills, db.billLines, db.journalEntries, db.journalLines, db.accounts, async () => {
      // 1. Save Bill
      const billId = await db.bills.add({
        ...bill,
        status: 'posted',
        date: new Date(bill.date),
        dueDate: new Date(bill.dueDate)
      });

      // 2. Save Lines
      const linesWithId = lines.map(line => ({
        ...line,
        billId,
        accountId: parseInt(line.accountId),
        vatTariffId: parseInt(line.vatTariffId)
      }));
      await db.billLines.bulkAdd(linesWithId);

      // 3. Generate Journal Entry
      // DR: Expense / Asset (Line Account)
      // DR: VAT Receivable (1900)
      // CR: Accounts Payable (2000)
      
      const apAccount = await db.accounts.where('code').equals('2000').first();
      const vatAccount = await db.accounts.where('code').equals('1900').first();

      const journalEntryId = await db.journalEntries.add({
        date: new Date(bill.date),
        reference: bill.number,
        description: `Bill: ${bill.number}`,
        isPosted: true,
        sourceType: 'bill',
        sourceId: billId
      });

      const journalLines = [];
      
      // Credit AP
      journalLines.push({
        entryId: journalEntryId,
        accountId: apAccount.id,
        debit: 0,
        credit: bill.total
      });

      // Debit Expense & VAT per line
      for (const line of linesWithId) {
        journalLines.push({
          entryId: journalEntryId,
          accountId: line.accountId,
          debit: line.lineTotal - line.vatAmount,
          credit: 0,
          vatTariffId: line.vatTariffId,
          vatAmount: line.vatAmount
        });

        if (line.vatAmount > 0) {
          journalLines.push({
            entryId: journalEntryId,
            accountId: vatAccount.id,
            debit: line.vatAmount,
            credit: 0,
            vatTariffId: line.vatTariffId,
            vatAmount: line.vatAmount
          });
        }
      }

      await db.journalLines.bulkAdd(journalLines);
      await db.bills.update(billId, { journalEntryId });

      return billId;
    });
  };

  const getLinesForBill = async (billId) => {
    return await db.billLines.where('billId').equals(billId).toArray();
  };

  const addVendor = async (vendor) => {
    return await db.contacts.add({ ...vendor, type: 'vendor', isActive: true });
  };

  return {
    bills: bills || [],
    vendors: vendors || [],
    addBill,
    getLinesForBill,
    addVendor,
    loading: bills === undefined
  };
};
