import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useAccounts = () => {
  const accounts = useLiveQuery(() => db.accounts.orderBy('code').toArray());
  const vatTariffs = useLiveQuery(() => db.vatTariffs.toArray().then(arr => arr.filter(t => t.isActive)));

  const addAccount = async (account) => {
    return await db.accounts.add({
      ...account,
      isActive: true
    });
  };

  const updateAccount = async (id, changes) => {
    return await db.accounts.update(id, changes);
  };

  const deleteAccount = async (id) => {
    // Soft delete or check for transactions first (future)
    return await db.accounts.update(id, { isActive: false });
  };

  const getAccountByCode = async (code) => {
    return await db.accounts.where('code').equals(code).first();
  };

  return {
    accounts: accounts || [],
    vatTariffs: vatTariffs || [],
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountByCode,
    loading: accounts === undefined
  };
};
