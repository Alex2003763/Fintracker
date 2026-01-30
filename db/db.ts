import Dexie, { Table } from 'dexie';
import { Transaction, Goal, Bill, Budget, RecurringTransaction, Notification, GoalContribution, BillPayment, DebtEntry } from '../types';
import { encryptObjectFields, decryptObjectFields } from '../utils/encryption';

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
  debts!: Table<DebtEntry>;

  constructor() {
    super('FinTrackDB');

    // Define database schema with indexes for efficient querying
    // Version 3: Added debts table for tracking personal IOUs
    this.version(3).stores({
      transactions: '++id, date, type, category, description, [type+date], [category+date]',
      goals: '++id, isActive, category, priority',
      bills: '++id, dayOfMonth, category, name',
      budgets: '++id, category, month, [category+month]',
      recurringTransactions: '++id, nextDueDate, frequency, type, category',
      notifications: '++id, date, read, type, relatedId',
      goalContributions: '++id, goalId, transactionId, date',
      billPayments: '++id, billId, month, paidDate',
      debts: '++id, personName, direction, date'
    });

    // Version 2: Added compound indexes for query optimization
    this.version(2).stores({
      transactions: '++id, date, type, category, description, [type+date], [category+date]',
      goals: '++id, isActive, category, priority',
      bills: '++id, dayOfMonth, category, name',
      budgets: '++id, category, month, [category+month]',
      recurringTransactions: '++id, nextDueDate, frequency, type, category',
      notifications: '++id, date, read, type, relatedId',
      goalContributions: '++id, goalId, transactionId, date',
      billPayments: '++id, billId, month, paidDate'
    });

    // Fallback for version 1 to ensure backward compatibility during upgrade
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

// Encryption Middleware
// We hook into the creating/updating/reading process to encrypt/decrypt sensitive data
// This is a simplified approach using Dexie hooks for specific tables
const SENSITIVE_FIELDS: Record<string, string[]> = {
  transactions: ['description', 'receiptImage'],
  goals: ['name'],
  bills: ['name', 'payee'],
  budgets: [], // Categories are usually generic
  debts: ['personName', 'note'], // Encrypt personal debt info
};

// Apply hooks
// Note: hooks are asynchronous but Dexie expects synchronous return or specific Promise handling
// We use 'reading' hook for decryption and 'creating'/'updating' for encryption.

// However, standard Dexie hooks for 'reading' only work for `get`. `toArray` bypasses it mostly in older versions?
// In Dexie 4, we use middleware for robust handling.

db.use({
  stack: 'dbcore',
  name: 'encryptionMiddleware',
  create: (downlevelDatabase) => {
    return {
      ...downlevelDatabase,
      table: (tableName) => {
        const downlevelTable = downlevelDatabase.table(tableName);
        const sensitiveFields = SENSITIVE_FIELDS[tableName];

        if (!sensitiveFields || sensitiveFields.length === 0) {
          return downlevelTable;
        }

        return {
          ...downlevelTable,
          mutate: async (req) => {
            if (req.type === 'add' || req.type === 'put') {
              const encryptedValues = await Promise.all(
                req.values.map(val => encryptObjectFields(val, sensitiveFields as any))
              );
              return downlevelTable.mutate({
                ...req,
                values: encryptedValues
              });
            }
            return downlevelTable.mutate(req);
          },
          query: async (req) => {
            const res = await downlevelTable.query(req);
            const { result } = res;
            if (Array.isArray(result)) {
               const decryptedResult = await Promise.all(
                 result.map(item => decryptObjectFields(item, sensitiveFields as any))
               );
               return { ...res, result: decryptedResult };
            }
            return res;
          },
          get: async (req) => {
            const item = await downlevelTable.get(req);
            if (item) {
              return decryptObjectFields(item, sensitiveFields as any);
            }
            return item;
          },
          getMany: async (req) => {
             const items = await downlevelTable.getMany(req);
             return Promise.all(items.map(item =>
                item ? decryptObjectFields(item, sensitiveFields as any) : item
             ));
          }
        };
      }
    };
  }
});

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