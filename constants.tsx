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

export const NAV_ITEMS: NavItem[] = [
  { name: 'Home',         icon: HomeIcon         },
  { name: 'Transactions', icon: TransactionsIcon  },
  { name: 'Insights',     icon: TrendingUpIcon    },
  { name: 'Goals',        icon: GoalsIcon         },
  { name: 'Budgets',      icon: BudgetIcon        },
];

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const INITIAL_BALANCE = 0;

// ─── Categories ───────────────────────────────────────────────────────────────
// Each SubCategory has name + emoji for richer display in CategoryIcon & chips.
// Emoji are cross-platform functional identifiers — not decorative.

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
// FIX: Icons are now semantically matched.
// Categories with emoji in TRANSACTION_CATEGORIES will render emoji first
// (via CategoryIcon's emoji branch), so SVG fallbacks here are for
// custom/user-added categories that only have a name.

export const CATEGORY_ICON_MAP: Record<string, IconComponent> = {
  // ── Income ──────────────────────────────────────────────────────────────
  'Salary':      SalaryIcon,
  'Freelance':   UserIcon,         // FIX: person/worker, not a money bag
  'Bonus':       SparklesIcon,     // FIX: special/reward, not generic salary
  'Investments': PieChartIcon,     // FIX: chart/portfolio, not piggy bank
  'Rental':      HomeGoodsIcon,
  'Dividends':   TrendingUpIcon,
  'Savings':     PiggyBankIcon,
  'Gifts':       SparklesIcon,

  // ── Food & Drink ────────────────────────────────────────────────────────
  'Groceries':    GroceriesIcon,
  'Restaurants':  CoffeeIcon,      // best available — no utensil icon
  'Coffee Shops': CoffeeIcon,
  'Takeout':      CartIcon,        // FIX: takeout = carry items, not coffee

  // ── Shopping ────────────────────────────────────────────────────────────
  'Clothing':         CartIcon,
  'Electronics':      CartIcon,
  'Home Goods':       HomeGoodsIcon,
  'Hobbies':          HobbiesIcon,
  'General Shopping': CartIcon,

  // ── Bills & Utilities ───────────────────────────────────────────────────
  'Rent/Mortgage': HomeGoodsIcon,  // FIX: home icon, not generic bill
  'Utilities':     BillIcon,
  'Phone':         BillIcon,
  'Internet':      BillIcon,
  'Insurance':     BillIcon,

  // ── Transportation ──────────────────────────────────────────────────────
  'Gas/Fuel':       GasIcon,
  'Public Transit': BusIcon,
  'Ride Sharing':   CarIcon,
  'Maintenance':    MaintenanceIcon,

  // ── Health & Wellness ───────────────────────────────────────────────────
  'Pharmacy': PharmacyIcon,
  'Doctor':   DoctorIcon,
  'Gym':      GymIcon,

  // ── Entertainment ───────────────────────────────────────────────────────
  'Movies':        MoviesIcon,
  'Subscriptions': SubscriptionsIcon,
  'Games':         HobbiesIcon,    // FIX: hobby/fun, not shopping cart

  // ── Misc ────────────────────────────────────────────────────────────────
  'Transfers': TransferIcon,
  'Other':     WalletIcon,         // FIX: neutral wallet, not groceries
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten all SubCategory for a given type */
export const getFlatCategories = (
  type: TransactionType,
  customCategories?: TransactionCategories,
): SubCategory[] =>
  Object.values((customCategories ?? TRANSACTION_CATEGORIES)[type]).flat();

/** First category name in a type — useful as form default */
export const getDefaultCategory = (
  type: TransactionType,
  customCategories?: TransactionCategories,
): string => getFlatCategories(type, customCategories)[0]?.name ?? '';

/** All category names as a flat string array */
export const getAllCategoryNames = (
  type: TransactionType,
  customCategories?: TransactionCategories,
): string[] =>
  getFlatCategories(type, customCategories).map(c => c.name);

/** Find which group a category name belongs to, or undefined if not found */
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

/** Look up the emoji for a category name, or undefined */
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

/** SVG icon component for a category name, or undefined */
export const getIconForCategory = (name: string): IconComponent | undefined =>
  CATEGORY_ICON_MAP[name];

/** True if the category name exists in the given type */
export const isCategoryInType = (
  name: string,
  type: TransactionType,
  customCategories?: TransactionCategories,
): boolean =>
  getAllCategoryNames(type, customCategories).includes(name);