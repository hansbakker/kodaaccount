import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useBanking = (bankAccountId) => {
  const bankAccounts = useLiveQuery(() => db.bankAccounts.toArray());
  const transactions = useLiveQuery(
    () => bankAccountId ? db.bankTransactions.where('bankAccountId').equals(bankAccountId).reverse().sortBy('date') : [],
    [bankAccountId]
  );
  
  // Calculate balance dynamically to ensure 100% accuracy, including unmatched transactions
  const currentAccount = useLiveQuery(
    async () => {
      if (!bankAccountId) return null;
      const acc = await db.bankAccounts.get(bankAccountId);
      if (!acc) return null;
      
      // Sum ALL transactions for this bank account to get accurate Statement Balance
      const txs = await db.bankTransactions.where('bankAccountId').equals(bankAccountId).toArray();
      const liveBalance = txs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      return {
        ...acc,
        balance: liveBalance
      };
    },
    [bankAccountId]
  );

  // Auto-repair effect to fix historical matched transactions with incorrect signs!
  // (e.g., Outgoing bill payments stored as positive values in the bank statement)
  useEffect(() => {
    const repairTransactions = async () => {
      if (!bankAccountId) return;
      await db.transaction('rw', [db.bankTransactions, db.bankAccounts], async () => {
        const txs = await db.bankTransactions.where('bankAccountId').equals(bankAccountId).toArray();
        let updatedCount = 0;
        
        for (const tx of txs) {
          if (tx.status === 'matched') {
            if (tx.matchedType === 'bill' && tx.amount > 0) {
              await db.bankTransactions.update(tx.id, { amount: -tx.amount });
              updatedCount++;
            } else if (tx.matchedType === 'invoice' && tx.amount < 0) {
              await db.bankTransactions.update(tx.id, { amount: Math.abs(tx.amount) });
              updatedCount++;
            }
          }
        }

        if (updatedCount > 0) {
          // Recalculate and update the cached rolling balance field in the database as a fallback
          const fixedTxs = await db.bankTransactions.where('bankAccountId').equals(bankAccountId).toArray();
          const newSum = fixedTxs.reduce((s, t) => s + t.amount, 0);
          await db.bankAccounts.update(bankAccountId, { balance: newSum });
          console.log(`[Repair] Corrected ${updatedCount} bank transactions signs and updated balance to ${newSum}`);
        }
      });
    };
    repairTransactions();
  }, [bankAccountId]);

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
      let correctAmount = tx.amount;

      if (matchData.type === 'invoice') {
        const inv = await db.invoices.get(matchData.id);
        if (!inv) throw new Error('Invoice not found');
        description = `Payment for Invoice ${inv.number || inv.invoiceNumber}`;
        
        correctAmount = Math.abs(tx.amount); // Invoice receipt is always incoming (positive)
        
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
          { entryId: journalEntryId, accountId: acc.glAccountId, debit: correctAmount, credit: 0 },
          { entryId: journalEntryId, accountId: arAccount.id, debit: 0, credit: correctAmount }
        ]);

        // Update Invoice status
        await db.invoices.update(inv.id, { status: 'paid' });

      } else if (matchData.type === 'bill') {
        const bill = await db.bills.get(matchData.id);
        if (!bill) throw new Error('Bill not found');
        description = `Payment for Bill ${bill.number || bill.billNumber}`;
        
        correctAmount = -Math.abs(tx.amount); // Bill payment is always outgoing (negative)
        const absAmount = Math.abs(tx.amount);
        
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

      // 1. Update Bank Transaction status AND amount sign
      await db.bankTransactions.update(transactionId, {
        amount: correctAmount,
        status: 'matched',
        matchedType: matchData.type,
        matchedId: matchData.id || matchData.glAccountId,
        journalEntryId
      });

      // 2. Recalculate Bank Account rolling balance from all transaction amounts for storage fallback
      const allTxs = await db.bankTransactions.where('bankAccountId').equals(bankAccountId).toArray();
      const liveBalance = allTxs.reduce((sum, t) => {
        const amt = (t.id === transactionId) ? correctAmount : t.amount;
        return sum + amt;
      }, 0);

      await db.bankAccounts.update(bankAccountId, {
        balance: liveBalance
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
