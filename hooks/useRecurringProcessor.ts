import { useRef } from 'react';
import { RecurringTransaction, Transaction, Notification } from '../types';
import { v4 as uuidv4 } from 'uuid';

export function useRecurringProcessor(dbMutations: any, recurringTransactions: RecurringTransaction[], initialProcessingDone: React.MutableRefObject<boolean>) {
  // 定期交易自動處理
  async function processRecurring() {
    if (!recurringTransactions || recurringTransactions.length === 0 || initialProcessingDone.current) return;
    const calculateNextDueDate = (currentDueDate: Date, frequency: 'weekly' | 'monthly' | 'yearly'): Date => {
      const nextDate = new Date(currentDueDate);
      if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      else if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (frequency === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
      return nextDate;
    };
    let transactionsAdded = false;
    let addedCount = 0;
    for (const rt of recurringTransactions) {
      let nextDueDate = new Date(rt.nextDueDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      while (nextDueDate <= today) {
        const newTransaction: Transaction = {
          id: uuidv4(),
          date: nextDueDate.toISOString(),
          description: rt.description,
          amount: rt.amount,
          type: rt.type,
          category: rt.category,
        };
        await dbMutations.addTransaction(newTransaction);
        transactionsAdded = true;
        addedCount++;
        nextDueDate = calculateNextDueDate(nextDueDate, rt.frequency);
      }
      if (new Date(rt.nextDueDate).getTime() !== nextDueDate.getTime()) {
        await dbMutations.updateRecurringTransaction(rt.id, { nextDueDate: nextDueDate.toISOString() });
      }
    }
    if (transactionsAdded) {
      const newNotification: Notification = {
        id: uuidv4(),
        title: 'Recurring Transactions Processed',
        message: `${addedCount} recurring transaction(s) were automatically added.`,
        date: new Date().toISOString(),
        read: false,
      };
      await dbMutations.addNotification(newNotification);
    }
    initialProcessingDone.current = true;
  }
  return {
    processRecurring
  };
}
