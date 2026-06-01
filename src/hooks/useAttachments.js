import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

export const useAttachments = (entityType, entityId) => {
  const attachments = useLiveQuery(
    () => entityId
      ? db.attachments
          .where('entityId')
          .equals(entityId)
          .toArray()
          .then(list => list.filter(a => a.entityType === entityType))
      : Promise.resolve([]),
    [entityType, entityId]
  );

  const addAttachment = async ({ url, label }) => {
    if (!entityId) throw new Error('entityId is required');
    return await db.attachments.add({
      entityType,
      entityId,
      url: url.trim(),
      label: label?.trim() || '',
      createdAt: new Date()
    });
  };

  const deleteAttachment = async (id) => {
    return await db.attachments.delete(id);
  };

  return {
    attachments: attachments || [],
    addAttachment,
    deleteAttachment,
    loading: attachments === undefined
  };
};
