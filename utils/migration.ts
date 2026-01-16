import { db } from '../db/db';
import { decryptData } from './formatters';
import { Transaction, Goal, Bill, Budget, RecurringTransaction, Notification, GoalContribution, BillPayment } from '../types';
import { Table } from 'dexie';

const MIGRATION_FLAG = 'fintrack_indexeddb_migration_complete';

/**
 * Check if migration from localStorage to IndexedDB has been completed
 */
export function hasMigratedToIndexedDB(): boolean {
  return localStorage.getItem(MIGRATION_FLAG) === 'true';
}

/**
 * Set migration flag to prevent re-migration
 */
export function setMigrationComplete(): void {
  localStorage.setItem(MIGRATION_FLAG, 'true');
}

/**
 * Clear migration flag (useful for testing or re-migration)
 */
export function clearMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_FLAG);
}

/**
 * Migrate data from localStorage to IndexedDB
 * This function decrypts the data from localStorage and stores it in IndexedDB
 * 
 * @param sessionKey - The user's session key for decryption
 * @returns Promise that resolves when migration is complete
 */
export async function migrateFromLocalStorage(sessionKey: CryptoKey): Promise<{
  success: boolean;
  migratedCounts: { [key: string]: number };
  error?: string;
}> {
  const migratedCounts: { [key: string]: number } = {};
  
  try {
    console.log('Starting migration from localStorage to IndexedDB...');
    
    // Define the data mappings with proper typing
    const dataMappings: Array<{
      localStorageKey: string;
      table: Table<any>;
      countKey: string;
    }> = [
      {
        localStorageKey: 'fintrackTransactions',
        table: db.transactions,
        countKey: 'transactions'
      },
      {
        localStorageKey: 'fintrackGoals',
        table: db.goals,
        countKey: 'goals'
      },
      {
        localStorageKey: 'fintrackBills',
        table: db.bills,
        countKey: 'bills'
      },
      {
        localStorageKey: 'fintrackBudgets',
        table: db.budgets,
        countKey: 'budgets'
      },
      {
        localStorageKey: 'fintrackRecurringTransactions',
        table: db.recurringTransactions,
        countKey: 'recurringTransactions'
      },
      {
        localStorageKey: 'fintrackNotifications',
        table: db.notifications,
        countKey: 'notifications'
      },
      {
        localStorageKey: 'fintrackGoalContributions',
        table: db.goalContributions,
        countKey: 'goalContributions'
      },
      {
        localStorageKey: 'fintrackBillPayments',
        table: db.billPayments,
        countKey: 'billPayments'
      }
    ];

    // Process each data type
    for (const mapping of dataMappings) {
      const encryptedData = localStorage.getItem(mapping.localStorageKey);
      
      if (encryptedData) {
        try {
          // Decrypt the data
          const decrypted = await decryptData(JSON.parse(encryptedData), sessionKey);
          
          if (decrypted) {
            const parsedData = JSON.parse(decrypted);
            
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              // Clear existing data in the table
              await mapping.table.clear();
              
              // Bulk add the data to IndexedDB with proper typing
              await mapping.table.bulkAdd(parsedData as any[]);
              
              migratedCounts[mapping.countKey] = parsedData.length;
              console.log(`Migrated ${parsedData.length} ${mapping.countKey} to IndexedDB`);
            }
          }
        } catch (error) {
          console.error(`Error migrating ${mapping.localStorageKey}:`, error);
          // Continue with other data types even if one fails
        }
      }
    }

    // Mark migration as complete
    setMigrationComplete();
    
    console.log('Migration completed successfully!', migratedCounts);
    
    return {
      success: true,
      migratedCounts
    };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      migratedCounts,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get migration status and statistics
 */
export async function getMigrationStatus(): Promise<{
  hasMigrated: boolean;
  localStorageDataExists: boolean;
  indexedDBDataExists: boolean;
  localStorageCounts: { [key: string]: number };
  indexedDBCounts: { [key: string]: number };
}> {
  const hasMigrated = hasMigratedToIndexedDB();
  
  // Check localStorage data existence
  const localStorageKeys = [
    'fintrackTransactions',
    'fintrackGoals',
    'fintrackBills',
    'fintrackBudgets',
    'fintrackRecurringTransactions',
    'fintrackNotifications',
    'fintrackGoalContributions',
    'fintrackBillPayments'
  ];
  
  const localStorageCounts: { [key: string]: number } = {};
  let localStorageDataExists = false;
  
  for (const key of localStorageKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      localStorageDataExists = true;
      try {
        const parsed = JSON.parse(data);
        localStorageCounts[key] = Array.isArray(parsed) ? parsed.length : 1;
      } catch {
        localStorageCounts[key] = 0;
      }
    } else {
      localStorageCounts[key] = 0;
    }
  }
  
  // Check IndexedDB data existence
  const indexedDBCounts: { [key: string]: number } = {};
  let indexedDBDataExists = false;
  
  try {
    indexedDBCounts.transactions = await db.transactions.count();
    indexedDBCounts.goals = await db.goals.count();
    indexedDBCounts.bills = await db.bills.count();
    indexedDBCounts.budgets = await db.budgets.count();
    indexedDBCounts.recurringTransactions = await db.recurringTransactions.count();
    indexedDBCounts.notifications = await db.notifications.count();
    indexedDBCounts.goalContributions = await db.goalContributions.count();
    indexedDBCounts.billPayments = await db.billPayments.count();
    
    indexedDBDataExists = Object.values(indexedDBCounts).some(count => count > 0);
  } catch (error) {
    console.error('Error checking IndexedDB:', error);
  }
  
  return {
    hasMigrated,
    localStorageDataExists,
    indexedDBDataExists,
    localStorageCounts,
    indexedDBCounts
  };
}

/**
 * Clean up localStorage after successful migration
 * This should only be called after user confirmation
 */
export async function cleanupLocalStorageAfterMigration(): Promise<void> {
  const keysToRemove = [
    'fintrackTransactions',
    'fintrackGoals',
    'fintrackBills',
    'fintrackBudgets',
    'fintrackRecurringTransactions',
    'fintrackNotifications',
    'fintrackGoalContributions',
    'fintrackBillPayments'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('Cleaned up localStorage after migration');
}