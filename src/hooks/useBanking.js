import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useBanking = (bankAccountId) => {
  const bankAccounts = useLiveQuery(() => db.bankAccounts.toArray());
  const transactions = useLiveQuery(
    () => bankAccountId ? db.bankTransactions.where('bankAccountId').equals(bankAccountId).reverse().sortBy('date') : [],
    [bankAccountId]
  );
  
  const currentAccount = useLiveQuery(
    () => bankAccountId ? db.bankAccounts.get(bankAccountId) : null,
    [bankAccountId]
  );

  const addTransaction = async (data) => {
    return await db.bankTransactions.add({
      bankAccountId,
      date: data.date,
      description: data.description,
      amount: parseFloat(data.amount),
      status: 'unmatched',
      matchedType: null,
      matchedId: null,
    });
  };

  const matchTransaction = async (transactionId, matchData) => {
    // matchData: { type: 'invoice' | 'bill' | 'direct', id: number, glAccountId?: number }
    return await db.transaction('rw', [db.bankTransactions, db.journalEntries, db.journalLines, db.invoices, db.bills, db.bankAccounts, db.accounts], async () => {
      const tx = await db.bankTransactions.get(transactionId);
      const acc = await db.bankAccounts.get(bankAccountId);
      if (!tx || !acc) throw new Error('Transaction or account not found');
      
      let description = `Bank: ${tx.description}`;
      let journalEntryId;

      if (matchData.type === 'invoice') {
        const inv = await db.invoices.get(matchData.id);
        if (!inv) throw new Error('Invoice not found');
        description = `Payment for Invoice ${inv.number || inv.invoiceNumber}`;
        
        // Post GL: Debit Bank (1100/1010), Credit AR (1300)
        journalEntryId = await db.journalEntries.add({
          date: new Date(tx.date),
          reference: inv.number || inv.invoiceNumber,
          description,
          isPosted: true,
          sourceType: 'bank_match',
          sourceId: transactionId
        });

        const arAccount = await db.accounts.where('code').equals('1300').first();
        await db.journalLines.bulkAdd([
          { entryId: journalEntryId, accountId: acc.glAccountId, debit: tx.amount, credit: 0 },
          { entryId: journalEntryId, accountId: arAccount.id, debit: 0, credit: tx.amount }
        ]);

        // Update Invoice status
        await db.invoices.update(inv.id, { status: 'paid' });

      } else if (matchData.type === 'bill') {
        const bill = await db.bills.get(matchData.id);
        if (!bill) throw new Error('Bill not found');
        description = `Payment for Bill ${bill.number || bill.billNumber}`;
        
        // Post GL: Debit AP (2000), Credit Bank (1100/1010)
        journalEntryId = await db.journalEntries.add({
          date: new Date(tx.date),
          reference: bill.number || bill.billNumber,
          description,
          isPosted: true,
          sourceType: 'bank_match',
          sourceId: transactionId
        });

        const apAccount = await db.accounts.where('code').equals('2000').first();
        const absAmount = Math.abs(tx.amount);
        await db.journalLines.bulkAdd([
          { entryId: journalEntryId, accountId: apAccount.id, debit: absAmount, credit: 0 },
          { entryId: journalEntryId, accountId: acc.glAccountId, debit: 0, credit: absAmount }
        ]);

        // Update Bill status
        await db.bills.update(bill.id, { status: 'paid' });

      } else if (matchData.type === 'direct') {
        // Post GL: Debit Expense/Asset, Credit Bank (or vice versa)
        journalEntryId = await db.journalEntries.add({
          date: new Date(tx.date),
          reference: 'BANK-DIR',
          description,
          isPosted: true,
          sourceType: 'bank_direct',
          sourceId: transactionId
        });

        if (tx.amount > 0) { // Receipt
          await db.journalLines.bulkAdd([
            { entryId: journalEntryId, accountId: acc.glAccountId, debit: tx.amount, credit: 0 },
            { entryId: journalEntryId, accountId: matchData.glAccountId, debit: 0, credit: tx.amount }
          ]);
        } else { // Payment
          const absAmount = Math.abs(tx.amount);
          await db.journalLines.bulkAdd([
            { entryId: journalEntryId, accountId: matchData.glAccountId, debit: absAmount, credit: 0 },
            { entryId: journalEntryId, accountId: acc.glAccountId, debit: 0, credit: absAmount }
          ]);
        }
      }

      await db.bankTransactions.update(transactionId, {
        status: 'matched',
        matchedType: matchData.type,
        matchedId: matchData.id || matchData.glAccountId
      });

      // Update Bank Account rolling balance
      await db.bankAccounts.update(bankAccountId, {
        balance: (acc.balance || 0) + tx.amount
      });
    });
  };

  return {
    bankAccounts,
    transactions,
    currentAccount,
    addTransaction,
    matchTransaction
  };
};
