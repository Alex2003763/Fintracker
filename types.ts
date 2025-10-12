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

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number; // 1-31
  category: string;
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
  type?: 'standard' | 'budget';
  relatedId?: string; // e.g., budget ID
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
}