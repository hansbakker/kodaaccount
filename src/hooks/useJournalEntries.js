import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useJournalEntries = () => {
  const entries = useLiveQuery(() => db.journalEntries.orderBy('date').reverse().toArray());
  
  const getLinesForEntry = async (entryId) => {
    return await db.journalLines.where('entryId').equals(entryId).toArray();
  };

  const addJournalEntry = async (entry, lines) => {
    // 1. Validate balance
    const totalDebit = lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error('Journal entry must balance (Debits must equal Credits)');
    }

    return await db.transaction('rw', db.journalEntries, db.journalLines, async () => {
      const entryId = await db.journalEntries.add({
        ...entry,
        isPosted: entry.isPosted ?? true,
        date: new Date(entry.date)
      });

      const linesWithId = lines.map(line => ({
        ...line,
        entryId,
        debit: parseFloat(line.debit) || 0,
        credit: parseFloat(line.credit) || 0,
        vatTariffId: line.vatTariffId ? parseInt(line.vatTariffId) : undefined
      }));

      await db.journalLines.bulkAdd(linesWithId);
      return entryId;
    });
  };

  const deleteJournalEntry = async (id) => {
    return await db.transaction('rw', db.journalEntries, db.journalLines, async () => {
      await db.journalLines.where('entryId').equals(id).delete();
      await db.journalEntries.delete(id);
    });
  };

  return {
    entries: entries || [],
    getLinesForEntry,
    addJournalEntry,
    deleteJournalEntry,
    loading: entries === undefined
  };
};

export const useGeneralLedger = (accountId = null) => {
  const ledgerLines = useLiveQuery(async () => {
    let lines = [];
    if (accountId) {
      lines = await db.journalLines.where('accountId').equals(parseInt(accountId)).toArray();
    } else {
      lines = await db.journalLines.toArray();
    }

    const accountsPromise = db.accounts.toArray();
    // Attach entry details
    const entryIds = [...new Set(lines.map(l => l.entryId))].filter(id => id !== undefined);
    const entries = await db.journalEntries.bulkGet(entryIds);
    const accounts = await accountsPromise;

    return lines.map((line) => {
      const entry = entries.filter(Boolean).find(e => e.id === line.entryId);
      const account = accounts.find(a => a.id === line.accountId);
      return {
        ...line,
        date: entry?.date,
        reference: entry?.reference,
        description: entry?.description,
        accountName: account?.name,
        accountCode: account?.code,
        sourceType: entry?.sourceType,
        entryId: entry?.id
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [accountId]);

  return {
    ledgerLines: ledgerLines || [],
    loading: ledgerLines === undefined
  };
};
