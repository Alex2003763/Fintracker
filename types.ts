import React from 'react';

export interface AIInsight {
  summary: string;
  positivePoints: string[];
  areasForImprovement: string[];
  actionableTip: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  emoji?: string;
  accountId?: string;    // source account (or the single account for income/expense)
  toAccountId?: string;  // destination account — only for type === 'transfer'
}

export interface CategoryEmoji {
  [category: string]: string;
}

export interface SpendingCategory {
  name: string;
  amount: number;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string; // "YYYY-MM" format
}

export interface GoalContribution {
  id: string;
  transactionId: string;
  goalId: string;
  amount: number;
  date: string;
  type: 'auto' | 'manual';
}

export interface GoalAllocationRule {
  id: string;
  goalId: string;
  type: 'percentage' | 'category' | 'amount';
  value: number | string;
  applyToIncome?: boolean;
  applyToExpense?: boolean;
  categories?: string[];
}

export interface GoalProgressEntry {
  date: string;
  amount: number;
  source: 'transaction' | 'manual' | 'adjustment';
  transactionId?: string;
}

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  priority: 'low' | 'medium' | 'high';
  category: 'emergency' | 'savings' | 'investment' | 'debt' | 'purchase' | 'custom';
  targetDate?: string;
  isActive: boolean;
  allocationRules: GoalAllocationRule[];
  progressHistory: GoalProgressEntry[];
  autoAllocate: boolean;
  monthlyTarget?: number;
}

export interface Bill {
   id: string;
   name: string;
   amount: number;
   dayOfMonth: number;
   category: string;
   frequency?: 'monthly' | 'weekly' | 'yearly';
}

export interface BillPayment {
   id: string;
   billId: string;
   month: string;
   paidDate: string;
   amount: number;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  nextDueDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type?: 'standard' | 'budget' | 'goal_progress' | 'bill_reminder';
  relatedId?: string;
  progress?: {
    currentAmount: number;
    targetAmount: number;
    percentage: number;
    milestone: number;
  };
  urgent?: boolean;
}

export interface NotificationSettings {
    goalProgress: {
        enabled: boolean;
        milestones: number[];
    };
    billReminders: {
        enabled: boolean;
        advanceDays: number;
    };
    budgetAlerts: {
        enabled: boolean;
        thresholds: number[];
    };
    monthlyReports: {
        enabled: boolean;
        frequency: 'weekly' | 'monthly';
    };
    pushNotifications: {
        enabled: boolean;
        quietHours: {
            start: string;
            end: string;
        };
    };
}

export type CurrencyCode =
  | 'USD' | 'HKD' | 'EUR' | 'GBP' | 'JPY' | 'CNY'
  | 'AUD' | 'CAD' | 'SGD' | 'KRW' | 'TWD' | 'MYR'
  | 'THB' | 'INR' | 'CHF' | 'NZD' | 'SEK' | 'NOK';

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export interface NetWorthEntry {
  id: string;
  name: string;
  type: 'asset' | 'liability';
  category: 'cash' | 'investment' | 'property' | 'vehicle' | 'other_asset'
           | 'credit_card' | 'loan' | 'mortgage' | 'other_liability';
  amount: number;
  note?: string;
  updatedAt: string;
}

export type AccountType = 'cash' | 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan' | 'mortgage' | 'property' | 'crypto' | 'other';

export const ACCOUNT_TYPE_META: Record<AccountType, { label: string; emoji: string; color: string }> = {
  cash: { label: 'Cash', emoji: '\uD83D\uDCB5', color: '#10B981' },
  checking: { label: 'Checking', emoji: '\uD83C\uDFE6', color: '#3B82F6' },
  savings: { label: 'Savings', emoji: '\uD83D\uDC37', color: '#8B5CF6' },
  credit_card: { label: 'Credit Card', emoji: '\uD83D\uDCB3', color: '#EF4444' },
  investment: { label: 'Investment', emoji: '\uD83D\uDCC8', color: '#8B5CF6' },
  loan: { label: 'Loan', emoji: '\uD83D\uDCC9', color: '#F59E0B' },
  mortgage: { label: 'Mortgage', emoji: '\uD83C\uDFE0', color: '#F97316' },
  property: { label: 'Property', emoji: '\uD83C\uDFE2', color: '#6366F1' },
  crypto: { label: 'Crypto', emoji: '\u20BF', color: '#EAB308' },
  other: { label: 'Other', emoji: '\uD83D\uDCE6', color: '#6B7280' },
};

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  creditLimit?: number;
  note?: string;
  includeInNetWorth: boolean;
  isArchived: boolean;
  createdAt: string;
}

export interface User {
    username: string;
    salt: string;
    passwordCheck: string;
    avatar?: string;
    biometricEnabled?: boolean;
    biometricCredentialId?: string;
    currency?: CurrencyCode;
    aiSettings?: {
        apiKey: string;
        model: string;
    };
    smartFeatures?: {
        categorySuggestions: boolean;
    };
    notificationSettings?: NotificationSettings;
    categoryEmojis?: CategoryEmoji;
    customCategories?: {
        expense: { [key: string]: SubCategory[] };
        income: { [key: string]: SubCategory[] };
    };
    netWorthEntries?: NetWorthEntry[];
    financialAccounts?: FinancialAccount[];
}

export interface SubCategory {
  name: string;
  icon?: string;
}

export interface DebtEntry {
  id: string;
  personName: string;
  direction: 'they_owe_me' | 'i_owe_them';
  amount: number;
  date: string;
  note?: string;
}
