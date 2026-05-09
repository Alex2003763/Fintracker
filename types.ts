import React from 'react';

export interface AIInsight {
  summary: string;
  positivePoints: string[];
  areasForImprovement: string[];
  actionableTip: string;
}

// ─── Account Types ────────────────────────────────────────────────────────────
export type AccountType = 'cash' | 'credit_card' | 'savings' | 'piggy_bank' | 'investment' | 'e_wallet' | 'checking' | 'other';

export const ACCOUNT_TYPE_META: Record<AccountType, { label: string; emoji: string; color: string }> = {
  cash:        { label: 'Cash',             emoji: '💵', color: '#22c55e' },
  credit_card: { label: 'Credit Card',      emoji: '💳', color: '#ef4444' },
  savings:     { label: 'Savings Account',  emoji: '🏦', color: '#3b82f6' },
  piggy_bank:  { label: 'Piggy Bank',       emoji: '🐷', color: '#ec4899' },
  investment:  { label: 'Investment',       emoji: '📈', color: '#f59e0b' },
  e_wallet:    { label: 'E-Wallet',         emoji: '📱', color: '#8b5cf6' },
  checking:    { label: 'Checking Account', emoji: '🏧', color: '#06b6d4' },
  other:       { label: 'Other',            emoji: '💼', color: '#6b7280' },
};

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color?: string;
  icon?: string;
  note?: string;
  createdAt: string;
  isArchived?: boolean;
  creditLimit?: number;       // only for credit_card
  includeInNetWorth?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  emoji?: string;
  accountId?: string;         // which account this transaction belongs to
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
  month: string;
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
    financialAccounts?: FinancialAccount[];  // multi-account support
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
