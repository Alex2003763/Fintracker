import React from 'react';
import {
  HomeIcon, TransactionsIcon, ReportsIcon, GoalsIcon, SettingsIcon,
  SalaryIcon, CoffeeIcon, GroceriesIcon, BillIcon, CartIcon,
  PiggyBankIcon, TransferIcon, UserIcon, PlusIcon, BudgetIcon,
  HomeGoodsIcon, HobbiesIcon, PharmacyIcon, DoctorIcon, GymIcon,
  MoviesIcon, SubscriptionsIcon, MaintenanceIcon, GasIcon, BusIcon,
  CarIcon, TrendingUpIcon,
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
  { name: 'Home',         icon: HomeIcon        },
  { name: 'Transactions', icon: TransactionsIcon },
  { name: 'Insights',     icon: TrendingUpIcon   },
  { name: 'Goals',        icon: GoalsIcon        },
  { name: 'Budgets',      icon: BudgetIcon       },
];

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const INITIAL_BALANCE = 0;

// ─── Categories ───────────────────────────────────────────────────────────────

export const TRANSACTION_CATEGORIES: TransactionCategories = {
  expense: {
    'Food & Drink': [
      { name: 'Groceries'    },
      { name: 'Restaurants'  },
      { name: 'Coffee Shops' },
      { name: 'Takeout'      },
    ],
    'Shopping': [
      { name: 'Clothing'          },
      { name: 'Electronics'       },
      { name: 'Home Goods'        },
      { name: 'Hobbies'           },
      { name: 'General Shopping'  },
    ],
    'Bills & Utilities': [
      { name: 'Rent/Mortgage' },
      { name: 'Utilities'     },
      { name: 'Phone'         },
      { name: 'Internet'      },
      { name: 'Insurance'     },
    ],
    'Transportation': [
      { name: 'Gas/Fuel'      },
      { name: 'Public Transit'},
      { name: 'Ride Sharing'  },
      { name: 'Maintenance'   },
    ],
    'Health & Wellness': [
      { name: 'Pharmacy' },
      { name: 'Doctor'   },
      { name: 'Gym'      },
    ],
    'Entertainment': [
      { name: 'Movies'        },
      { name: 'Subscriptions' },
      { name: 'Games'         },
    ],
    'Transfers': [
      { name: 'Transfers' },
    ],
    'Other': [
      { name: 'Other' },
    ],
  },
  income: {
    'Earned': [
      { name: 'Salary'    },
      { name: 'Freelance' },
      { name: 'Bonus'     },
    ],
    'Passive': [
      { name: 'Investments' },
    ],
    'Other': [
      { name: 'Savings' },
      { name: 'Other'   },
    ],
  },
};

// ─── Icon map ─────────────────────────────────────────────────────────────────

export const CATEGORY_ICON_MAP: Record<string, IconComponent> = {
  // ── Income ──
  'Salary':      SalaryIcon,
  'Freelance':   SalaryIcon,
  'Bonus':       SalaryIcon,
  'Investments': PiggyBankIcon,
  'Savings':     PiggyBankIcon,

  // ── Food & Drink ──
  'Groceries':    GroceriesIcon,
  'Restaurants':  CoffeeIcon,
  'Coffee Shops': CoffeeIcon,
  'Takeout':      CoffeeIcon,

  // ── Shopping ──
  'Clothing':         CartIcon,
  'Electronics':      CartIcon,
  'Home Goods':       HomeGoodsIcon,
  'Hobbies':          HobbiesIcon,
  'General Shopping': CartIcon,

  // ── Bills & Utilities ──
  'Rent/Mortgage': BillIcon,
  'Utilities':     BillIcon,
  'Phone':         BillIcon,
  'Internet':      BillIcon,
  'Insurance':     BillIcon,

  // ── Transportation ──
  'Gas/Fuel':      GasIcon,
  'Public Transit': BusIcon,
  'Ride Sharing':  CarIcon,
  'Maintenance':   MaintenanceIcon,

  // ── Health & Wellness ──
  'Pharmacy': PharmacyIcon,
  'Doctor':   DoctorIcon,
  'Gym':      GymIcon,

  // ── Entertainment ──
  'Movies':        MoviesIcon,
  'Subscriptions': SubscriptionsIcon,
  'Games':         CartIcon,

  // ── Misc ──
  'Transfers': TransferIcon,
  'Other':     GroceriesIcon,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 取得某 type 下所有 SubCategory（已攤平） */
export const getFlatCategories = (
  type: TransactionType,
  customCategories?: TransactionCategories
): SubCategory[] =>
  Object.values((customCategories ?? TRANSACTION_CATEGORIES)[type]).flat();

/** 取得某 type 的第一個 category name（作為預設值） */
export const getDefaultCategory = (
  type: TransactionType,
  customCategories?: TransactionCategories
): string => getFlatCategories(type, customCategories)[0]?.name ?? '';

/** 從 category name 取得對應的 IconComponent，找不到回傳 undefined */
export const getIconForCategory = (name: string): IconComponent | undefined =>
  CATEGORY_ICON_MAP[name];