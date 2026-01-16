import Dexie, { Table } from 'dexie';
import { Transaction, Goal, Bill, Budget, RecurringTransaction, Notification, GoalContribution, BillPayment } from '../types';

/**
 * FinTrack Database Schema
 * 
 * This database stores all user financial data in IndexedDB for better performance
 * and larger storage capacity compared to localStorage.
 */
export class FinTrackDatabase extends Dexie {
  transactions!: Table<Transaction>;
  goals!: Table<Goal>;
  bills!: Table<Bill>;
  budgets!: Table<Budget>;
  recurringTransactions!: Table<RecurringTransaction>;
  notifications!: Table<Notification>;
  goalContributions!: Table<GoalContribution>;
  billPayments!: Table<BillPayment>;

  constructor() {
    super('FinTrackDB');
    
    // Define database schema with indexes for efficient querying
    this.version(1).stores({
      transactions: '++id, date, type, category, description',
      goals: '++id, isActive, category, priority',
      bills: '++id, dayOfMonth, category, name',
      budgets: '++id, category, month',
      recurringTransactions: '++id, nextDueDate, frequency, type, category',
      notifications: '++id, date, read, type, relatedId',
      goalContributions: '++id, goalId, transactionId, date',
      billPayments: '++id, billId, month, paidDate'
    });
  }
}

// Create a singleton instance of the database
export const db = new FinTrackDatabase();

/**
 * Database utility functions for common operations
 */
export const dbUtils = {
  /**
   * Clear all data from the database (useful for logout or reset)
   */
  async clearAll(): Promise<void> {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(table => table.clear()));
    });
  },

  /**
   * Get database size estimate in bytes
   */
  async getDatabaseSize(): Promise<number> {
    let totalSize = 0;
    const tables = db.tables;
    
    for (const table of tables) {
      const count = await table.count();
      totalSize += count * 1000; // Rough estimate: 1KB per record
    }
    
    return totalSize;
  },

  /**
   * Export all data as JSON (for backup)
   */
  async exportAllData(): Promise<any> {
    const data: any = {};
    
    for (const table of db.tables) {
      data[table.name] = await table.toArray();
    }
    
    return data;
  },

  /**
   * Import data from JSON (for restore)
   */
  async importAllData(data: any): Promise<void> {
    await db.transaction('rw', db.tables, async () => {
      for (const tableName in data) {
        const table = db.table(tableName);
        if (table) {
          await table.clear();
          await table.bulkAdd(data[tableName]);
        }
      }
    });
  }
};