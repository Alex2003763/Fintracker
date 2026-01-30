import { useLiveQuery } from 'dexie-react-hooks';
import Dexie from 'dexie';
import { db } from '../db/db';
import { Transaction, Goal, Bill, Budget, RecurringTransaction, Notification, GoalContribution, BillPayment, DebtEntry } from '../types';
import { decryptObjectFields } from '../utils/encryption';

/**
 * Hook to fetch and observe transactions from IndexedDB
 * Note: Manual decryption needed because orderBy uses cursors which bypass middleware
 */
export function useTransactions() {
  return useLiveQuery(
    async () => {
      const transactions = await db.transactions.orderBy('date').reverse().toArray();
      // Manually decrypt sensitive fields
      const decrypted = await Promise.all(
        transactions.map(tx => decryptObjectFields(tx, ['description', 'receiptImage'] as (keyof Transaction)[]))
      );
      return decrypted;
    },
    [],
    []
  );
}

/**
 * Hook to fetch transactions filtered by type
 * Note: Manual decryption needed because orderBy uses cursors which bypass middleware
 */
export function useTransactionsByType(type: 'income' | 'expense' | 'all' = 'all') {
  return useLiveQuery(
    async () => {
      let transactions: Transaction[];
      if (type === 'all') {
        transactions = await db.transactions.orderBy('date').reverse().toArray();
      } else {
        // Use compound index [type+date] for efficient sorting and filtering
        transactions = await db.transactions
          .where('[type+date]')
          .between([type, Dexie.minKey], [type, Dexie.maxKey])
          .reverse()
          .toArray();
      }
      // Manually decrypt sensitive fields
      const decrypted = await Promise.all(
        transactions.map(tx => decryptObjectFields(tx, ['description', 'receiptImage'] as (keyof Transaction)[]))
      );
      return decrypted;
    },
    [type],
    []
  );
}

/**
 * Hook to fetch goals from IndexedDB
 * Note: Manual decryption needed because toArray uses cursors which bypass middleware
 */
export function useGoals() {
  return useLiveQuery(
    async () => {
      const goals = await db.goals.toArray();
      // Manually decrypt sensitive fields
      const decrypted = await Promise.all(
        goals.map(goal => decryptObjectFields(goal, ['name'] as (keyof Goal)[]))
      );
      return decrypted;
    },
    [],
    []
  );
}

/**
 * Hook to fetch active goals only
 * Note: Manual decryption needed because filter uses cursors which bypass middleware
 */
export function useActiveGoals() {
  return useLiveQuery(
    async () => {
      const goals = await db.goals.filter(goal => goal.isActive).toArray();
      // Manually decrypt sensitive fields
      const decrypted = await Promise.all(
        goals.map(goal => decryptObjectFields(goal, ['name'] as (keyof Goal)[]))
      );
      return decrypted;
    },
    [],
    []
  );
}

/**
 * Hook to fetch bills from IndexedDB
 * Note: Manual decryption needed because toArray uses cursors which bypass middleware
 */
export function useBills() {
  return useLiveQuery(
    async () => {
      const bills = await db.bills.toArray();
      // Manually decrypt sensitive fields
      const decrypted = await Promise.all(
        bills.map(bill => decryptObjectFields(bill, ['name', 'payee'] as (keyof Bill)[]))
      );
      return decrypted;
    },
    [],
    []
  );
}

/**
 * Hook to fetch budgets from IndexedDB
 */
export function useBudgets() {
  return useLiveQuery(
    () => db.budgets.toArray(),
    [],
    []
  );
}

/**
 * Hook to fetch budgets for a specific month
 */
export function useBudgetsByMonth(month: string) {
  return useLiveQuery(
    () => db.budgets.where('month').equals(month).toArray(),
    [month],
    []
  );
}

/**
 * Hook to fetch recurring transactions from IndexedDB
 */
export function useRecurringTransactions() {
  return useLiveQuery(
    () => db.recurringTransactions.toArray(),
    [],
    []
  );
}

/**
 * Hook to fetch notifications from IndexedDB
 */
export function useNotifications() {
  return useLiveQuery(
    () => db.notifications.orderBy('date').reverse().toArray(),
    [],
    []
  );
}

/**
 * Hook to fetch unread notifications
 */
export function useUnreadNotifications() {
  return useLiveQuery(
    () => db.notifications.filter(notification => !notification.read).reverse().sortBy('date'),
    [],
    []
  );
}

/**
 * Hook to fetch goal contributions from IndexedDB
 */
export function useGoalContributions() {
  return useLiveQuery(
    () => db.goalContributions.toArray(),
    [],
    []
  );
}

/**
 * Hook to fetch contributions for a specific goal
 */
export function useGoalContributionsByGoal(goalId: string) {
  return useLiveQuery(
    () => db.goalContributions.where('goalId').equals(goalId).reverse().sortBy('date'),
    [goalId],
    []
  );
}

/**
 * Hook to fetch bill payments from IndexedDB
 */
export function useBillPayments() {
  return useLiveQuery(
    () => db.billPayments.toArray(),
    [],
    []
  );
}

/**
 * Hook to fetch payments for a specific bill
 */
export function useBillPaymentsByBill(billId: string) {
  return useLiveQuery(
    () => db.billPayments.where('billId').equals(billId).reverse().sortBy('paidDate'),
    [billId],
    []
  );
}

/**
 * Hook to fetch debts from IndexedDB
 * Note: Manual decryption needed because orderBy uses cursors which bypass middleware
 */
export function useDebts() {
  return useLiveQuery(
    async () => {
      const debts = await db.debts.orderBy('date').reverse().toArray();
      // Manually decrypt sensitive fields
      const decrypted = await Promise.all(
        debts.map(debt => decryptObjectFields(debt, ['personName', 'note'] as (keyof DebtEntry)[]))
      );
      return decrypted;
    },
    [],
    []
  );
}

/**
 * Hook to fetch debts filtered by direction
 * Note: Manual decryption needed because orderBy uses cursors which bypass middleware
 */
export function useDebtsByDirection(direction: 'they_owe_me' | 'i_owe_them' | 'all' = 'all') {
  return useLiveQuery(
    async () => {
      let debts: DebtEntry[];
      if (direction === 'all') {
        debts = await db.debts.orderBy('date').reverse().toArray();
      } else {
        debts = await db.debts.where('direction').equals(direction).reverse().sortBy('date');
      }
      // Manually decrypt sensitive fields
      const decrypted = await Promise.all(
        debts.map(debt => decryptObjectFields(debt, ['personName', 'note'] as (keyof DebtEntry)[]))
      );
      return decrypted;
    },
    [direction],
    []
  );
}

/**
 * Hook to fetch transactions for a specific date range
 */
export function useTransactionsByDateRange(startDate: Date, endDate: Date) {
  return useLiveQuery(
    () => db.transactions
      .where('date')
      .between(startDate.toISOString(), endDate.toISOString(), true, true)
      .reverse()
      .sortBy('date'),
    [startDate, endDate],
    []
  );
}

/**
 * Hook to fetch transactions for a specific category
 */
export function useTransactionsByCategory(category: string) {
  return useLiveQuery(
    // Use compound index [category+date]
    () => db.transactions
      .where('[category+date]')
      .between([category, Dexie.minKey], [category, Dexie.maxKey])
      .reverse()
      .toArray(),
    [category],
    []
  );
}

/**
 * Hook to search transactions by description
 */
export function useSearchTransactions(query: string) {
  return useLiveQuery(
    () => {
      const q = query.toLowerCase().trim();
      if (!q) {
        return db.transactions.orderBy('date').reverse().toArray();
      }
      
      // Optimization: If the query is short, sticking to filter+sort on date might be okay.
      // But we can try to use anyStartsWith if the user is typing the beginning of a description.
      // However, we need to search both description and category.
      // Full text search in IndexedDB is limited.
      // We stick to filter() but ensure we iterate over the sorted index 'date' so at least the result is naturally sorted
      // without needing an in-memory sort of the whole set if possible.
      
      return db.transactions
        .orderBy('date')
        .reverse()
        .filter(transaction =>
          transaction.description.toLowerCase().includes(q) ||
          transaction.category.toLowerCase().includes(q)
        )
        .toArray();
    },
    [query],
    []
  );
}

/**
 * Database mutation hooks
 */
export const dbMutations = {
  /**
   * Add a new transaction
   */
  async addTransaction(transaction: Transaction | Omit<Transaction, 'id'>): Promise<string> {
    const id = await db.transactions.add(transaction as Transaction);
    return id.toString();
  },

  /**
   * Update an existing transaction
   */
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<number> {
    return await db.transactions.update(id, updates);
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: string): Promise<void> {
    await db.transactions.delete(id);
  },

  /**
   * Add a new goal
   */
  async addGoal(goal: Goal | Omit<Goal, 'id'>): Promise<string> {
    const id = await db.goals.add(goal as Goal);
    return id.toString();
  },

  /**
   * Update an existing goal
   */
  async updateGoal(id: string, updates: Partial<Goal>): Promise<number> {
    return await db.goals.update(id, updates);
  },

  /**
   * Delete a goal
   */
  async deleteGoal(id: string): Promise<void> {
    await db.goals.delete(id);
  },

  /**
   * Add a new bill
   */
  async addBill(bill: Bill | Omit<Bill, 'id'>): Promise<string> {
    const id = await db.bills.add(bill as Bill);
    return id.toString();
  },

  /**
   * Update an existing bill
   */
  async updateBill(id: string, updates: Partial<Bill>): Promise<number> {
    return await db.bills.update(id, updates);
  },

  /**
   * Delete a bill
   */
  async deleteBill(id: string): Promise<void> {
    await db.bills.delete(id);
  },

  /**
   * Add a new budget
   */
  async addBudget(budget: Budget | Omit<Budget, 'id'>): Promise<string> {
    const id = await db.budgets.add(budget as Budget);
    return id.toString();
  },

  /**
   * Update an existing budget
   */
  async updateBudget(id: string, updates: Partial<Budget>): Promise<number> {
    return await db.budgets.update(id, updates);
  },

  /**
   * Delete a budget
   */
  async deleteBudget(id: string): Promise<void> {
    await db.budgets.delete(id);
  },

  /**
   * Add a new recurring transaction
   */
  async addRecurringTransaction(recurring: RecurringTransaction | Omit<RecurringTransaction, 'id'>): Promise<string> {
    const id = await db.recurringTransactions.add(recurring as RecurringTransaction);
    return id.toString();
  },

  /**
   * Update an existing recurring transaction
   */
  async updateRecurringTransaction(id: string, updates: Partial<RecurringTransaction>): Promise<number> {
    return await db.recurringTransactions.update(id, updates);
  },

  /**
   * Delete a recurring transaction
   */
  async deleteRecurringTransaction(id: string): Promise<void> {
    await db.recurringTransactions.delete(id);
  },

  /**
   * Add a new notification
   */
  async addNotification(notification: Notification | Omit<Notification, 'id'>): Promise<string> {
    const id = await db.notifications.add(notification as Notification);
    return id.toString();
  },

  /**
   * Update an existing notification
   */
  async updateNotification(id: string, updates: Partial<Notification>): Promise<number> {
    return await db.notifications.update(id, updates);
  },

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(id: string): Promise<number> {
    return await db.notifications.update(id, { read: true });
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<number> {
    const unreadNotifications = await db.notifications.filter(notification => !notification.read).toArray();
    return await db.notifications.bulkPut(
      unreadNotifications.map(n => ({ ...n, read: true }))
    );
  },

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    await db.notifications.delete(id);
  },

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await db.notifications.clear();
  },

  /**
   * Add a new goal contribution
   */
  async addGoalContribution(contribution: GoalContribution | Omit<GoalContribution, 'id'>): Promise<string> {
    const id = await db.goalContributions.add(contribution as GoalContribution);
    return id.toString();
  },

  /**
   * Delete a goal contribution
   */
  async deleteGoalContribution(id: string): Promise<void> {
    await db.goalContributions.delete(id);
  },

  /**
   * Delete goal contributions for a specific transaction
   */
  async deleteGoalContributionsByTransaction(transactionId: string): Promise<void> {
    await db.goalContributions.where('transactionId').equals(transactionId).delete();
  },

  /**
   * Add a new bill payment
   */
  async addBillPayment(payment: BillPayment | Omit<BillPayment, 'id'>): Promise<string> {
    const id = await db.billPayments.add(payment as BillPayment);
    return id.toString();
  },

  /**
   * Delete bill payments for a specific bill
   */
  async deleteBillPaymentsByBill(billId: string): Promise<void> {
    await db.billPayments.where('billId').equals(billId).delete();
  },

  /**
   * Add a new debt entry
   */
  async addDebt(debt: DebtEntry | Omit<DebtEntry, 'id'>): Promise<string> {
    const id = await db.debts.add(debt as DebtEntry);
    return id.toString();
  },

  /**
   * Update an existing debt entry
   */
  async updateDebt(id: string, updates: Partial<DebtEntry>): Promise<number> {
    return await db.debts.update(id, updates);
  },

  /**
   * Delete a debt entry
   */
  async deleteDebt(id: string): Promise<void> {
    await db.debts.delete(id);
  },

  /**
   * Clear all debts (optional: for settling all)
   */
  async clearAllDebts(): Promise<void> {
    await db.debts.clear();
  }
};