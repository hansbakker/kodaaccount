import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useVat = () => {
  const tariffs = useLiveQuery(() => db.vatTariffs.toArray());

  const addTariff = async (tariff) => {
    return await db.vatTariffs.add({ ...tariff, isActive: true });
  };

  const updateTariff = async (id, changes) => {
    return await db.vatTariffs.update(id, changes);
  };

  const deleteTariff = async (id) => {
    return await db.vatTariffs.update(id, { isActive: false });
  };

  return {
    tariffs: tariffs || [],
    addTariff,
    updateTariff,
    deleteTariff,
    loading: tariffs === undefined
  };
};

export const calculateVat = (amount, rate, inclusive = false) => {
  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(rate) || 0;

  if (inclusive) {
    const net = amountNum / (1 + rateNum);
    const vat = amountNum - net;
    return { net, vat, gross: amountNum };
  } else {
    const vat = amountNum * rateNum;
    const gross = amountNum + vat;
    return { net: amountNum, vat, gross };
  }
};
