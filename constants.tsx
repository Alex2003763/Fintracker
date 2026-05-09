import React from 'react';
import {
  HomeIcon, TransactionsIcon, GoalsIcon, SettingsIcon, BudgetIcon,
  SalaryIcon, CoffeeIcon, GroceriesIcon, BillIcon, CartIcon,
  PiggyBankIcon, TransferIcon, UserIcon, TrendingUpIcon, WalletIcon,
  HomeGoodsIcon, HobbiesIcon, PharmacyIcon, DoctorIcon, GymIcon,
  MoviesIcon, SubscriptionsIcon, MaintenanceIcon, GasIcon, BusIcon,
  CarIcon, PieChartIcon, SparklesIcon,
} from './components/icons';
import { SubCategory } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';

export type IconComponent = React.FC<{ className?: string; 'aria-label'?: string }>;

export interface NavItem {
  name: string;
  icon: IconComponent;
}

export interface TransactionCategories {
  expense: Record<string, SubCategory[]>;
  income:  Record<string, SubCategory[]>;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

// Wallet icon inline SVG component for Accounts nav
const AccountsNavIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
    <rect x="1" y="4" width="22" height="16" rx="3" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="14" r="2" strokeWidth={1.8} />
  </svg>
);

export const NAV_ITEMS: NavItem[] = [
  { name: 'Home',         icon: HomeIcon         },
  { name: 'Transactions', icon: TransactionsIcon  },
  { name: 'Insights',     icon: TrendingUpIcon    },
  { name: 'Goals',        icon: GoalsIcon         },
  { name: 'Budgets',      icon: BudgetIcon        },
  { name: 'Accounts',     icon: AccountsNavIcon   },
];

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const INITIAL_BALANCE = 0;

// ─── Categories ───────────────────────────────────────────────────────────────

export const TRANSACTION_CATEGORIES: TransactionCategories = {
  expense: {
    'Food & Drink': [
      { name: 'Groceries',    emoji: '🛒' },
      { name: 'Restaurants',  emoji: '🍽️' },
      { name: 'Coffee Shops', emoji: '☕' },
      { name: 'Takeout',      emoji: '🥡' },
    ],
    'Shopping': [
      { name: 'Clothing',          emoji: '👕' },
      { name: 'Electronics',       emoji: '💻' },
      { name: 'Home Goods',        emoji: '🏠' },
      { name: 'Hobbies',           emoji: '🎨' },
      { name: 'General Shopping',  emoji: '🛍️' },
    ],
    'Bills & Utilities': [
      { name: 'Rent/Mortgage', emoji: '🏢' },
      { name: 'Utilities',     emoji: '💡' },
      { name: 'Phone',         emoji: '📱' },
      { name: 'Internet',      emoji: '🌐' },
      { name: 'Insurance',     emoji: '🛡️' },
    ],
    'Transportation': [
      { name: 'Gas/Fuel',       emoji: '⛽' },
      { name: 'Public Transit', emoji: '🚌' },
      { name: 'Ride Sharing',   emoji: '🚗' },
      { name: 'Maintenance',    emoji: '🔧' },
    ],
    'Health & Wellness': [
      { name: 'Pharmacy', emoji: '💊' },
      { name: 'Doctor',   emoji: '🏥' },
      { name: 'Gym',      emoji: '💪' },
    ],
    'Entertainment': [
      { name: 'Movies',        emoji: '🎬' },
      { name: 'Subscriptions', emoji: '📺' },
      { name: 'Games',         emoji: '🎮' },
    ],
    'Transfers': [
      { name: 'Transfers', emoji: '↔️' },
    ],
    'Other': [
      { name: 'Other', emoji: '📋' },
    ],
  },

  income: {
    'Earned': [
      { name: 'Salary',    emoji: '💰' },
      { name: 'Freelance', emoji: '💼' },
      { name: 'Bonus',     emoji: '🎁' },
    ],
    'Passive': [
      { name: 'Investments', emoji: '📈' },
      { name: 'Rental',      emoji: '🏠' },
      { name: 'Dividends',   emoji: '💹' },
    ],
    'Other': [
      { name: 'Savings', emoji: '🐷' },
      { name: 'Gifts',   emoji: '🎀' },
      { name: 'Other',   emoji: '📋' },
    ],
  },
};

// ─── Icon map ─────────────────────────────────────────────────────────────────

export const CATEGORY_ICON_MAP: Record<string, IconComponent> = {
  'Salary':      SalaryIcon,
  'Freelance':   UserIcon,
  'Bonus':       SparklesIcon,
  'Investments': PieChartIcon,
  'Rental':      HomeGoodsIcon,
  'Dividends':   TrendingUpIcon,
  'Savings':     PiggyBankIcon,
  'Gifts':       SparklesIcon,
  'Groceries':    GroceriesIcon,
  'Restaurants':  CoffeeIcon,
  'Coffee Shops': CoffeeIcon,
  'Takeout':      CartIcon,
  'Clothing':         CartIcon,
  'Electronics':      CartIcon,
  'Home Goods':       HomeGoodsIcon,
  'Hobbies':          HobbiesIcon,
  'General Shopping': CartIcon,
  'Rent/Mortgage': HomeGoodsIcon,
  'Utilities':     BillIcon,
  'Phone':         BillIcon,
  'Internet':      BillIcon,
  'Insurance':     BillIcon,
  'Gas/Fuel':       GasIcon,
  'Public Transit': BusIcon,
  'Ride Sharing':   CarIcon,
  'Maintenance':    MaintenanceIcon,
  'Pharmacy': PharmacyIcon,
  'Doctor':   DoctorIcon,
  'Gym':      GymIcon,
  'Movies':        MoviesIcon,
  'Subscriptions': SubscriptionsIcon,
  'Games':         HobbiesIcon,
  'Transfers': TransferIcon,
  'Other':     WalletIcon,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getFlatCategories = (
  type: TransactionType,
  customCategories?: TransactionCategories,
): SubCategory[] =>
  Object.values((customCategories ?? TRANSACTION_CATEGORIES)[type]).flat();

export const getDefaultCategory = (
  type: TransactionType,
  customCategories?: TransactionCategories,
): string => getFlatCategories(type, customCategories)[0]?.name ?? '';

export const getAllCategoryNames = (
  type: TransactionType,
  customCategories?: TransactionCategories,
): string[] =>
  getFlatCategories(type, customCategories).map(c => c.name);

export const getCategoryGroup = (
  name: string,
  type: TransactionType,
  customCategories?: TransactionCategories,
): string | undefined => {
  const cats = (customCategories ?? TRANSACTION_CATEGORIES)[type];
  return Object.entries(cats).find(([, subs]) =>
    subs.some(s => s.name === name)
  )?.[0];
};

export const getEmojiForCategory = (
  name: string,
  type?: TransactionType,
  customCategories?: TransactionCategories,
): string | undefined => {
  const sources: TransactionType[] = type ? [type] : ['expense', 'income'];
  for (const t of sources) {
    const found = getFlatCategories(t, customCategories).find(c => c.name === name);
    if (found?.emoji) return found.emoji;
  }
  return undefined;
};

export const getIconForCategory = (name: string): IconComponent | undefined =>
  CATEGORY_ICON_MAP[name];

export const isCategoryInType = (
  name: string,
  type: TransactionType,
  customCategories?: TransactionCategories,
): boolean =>
  getAllCategoryNames(type, customCategories).includes(name);
