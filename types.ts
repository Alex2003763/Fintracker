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
  type: 'income' | 'expense';
  category: string;
  emoji?: string; // Optional emoji for the transaction
}

export interface CategoryEmoji {
  [category: string]: string; // Maps category name to emoji
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
  value: number | string; // percentage (0-100) or category name or fixed amount
  applyToIncome?: boolean;
  applyToExpense?: boolean;
  categories?: string[]; // for category-based rules
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
  targetDate?: string; // ISO date string
  isActive: boolean;
  allocationRules: GoalAllocationRule[];
  progressHistory: GoalProgressEntry[];
  autoAllocate: boolean;
  monthlyTarget?: number; // calculated based on target date
}

export interface Bill {
   id: string;
   name: string;
   amount: number;
   dayOfMonth: number; // 1-31
   category: string;
   frequency?: 'monthly' | 'weekly' | 'yearly';
}

export interface BillPayment {
   id: string;
   billId: string;
   month: string; // "YYYY-MM" format
   paidDate: string; // ISO date string
   amount: number;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string; // ISO string
  nextDueDate: string; // ISO string
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type?: 'standard' | 'budget' | 'goal_progress' | 'bill_reminder';
  relatedId?: string; // e.g., budget ID, goal ID, or bill ID
  progress?: {
    currentAmount: number;
    targetAmount: number;
    percentage: number;
    milestone: number; // 25, 50, 75, 100
  };
  urgent?: boolean; // For push notifications
}

export interface NotificationSettings {
    goalProgress: {
        enabled: boolean;
        milestones: number[]; // [25, 50, 75, 100]
    };
    billReminders: {
        enabled: boolean;
        advanceDays: number; // 1, 3, 7
    };
    budgetAlerts: {
        enabled: boolean;
        thresholds: number[]; // [80, 90, 100]
    };
    monthlyReports: {
        enabled: boolean;
        frequency: 'weekly' | 'monthly';
    };
    pushNotifications: {
        enabled: boolean;
        quietHours: {
            start: string; // "22:00"
            end: string;   // "08:00"
        };
    };
}

export interface User {
    username: string;
    salt: string; // Stored as base64
    passwordCheck: string; // Stored as stringified JSON {iv, ciphertext}
    avatar?: string; // base64 encoded image
    aiSettings?: {
        apiKey: string;
        model: string;
    };
    smartFeatures?: {
        categorySuggestions: boolean;
    };
    notificationSettings?: NotificationSettings;
    categoryEmojis?: CategoryEmoji; // Custom emoji mappings for categories
    customCategories?: {
        expense: { [key: string]: SubCategory[] };
        income: { [key: string]: SubCategory[] };
    }; // User's custom category structure
}

export interface SubCategory {
  name: string;
  icon?: string;
}