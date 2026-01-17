import React from 'react';
import { HomeIcon, TransactionsIcon, ReportsIcon, GoalsIcon, SettingsIcon, SalaryIcon, CoffeeIcon, GroceriesIcon, BillIcon, CartIcon, PiggyBankIcon, TransferIcon, UserIcon, PlusIcon, BudgetIcon, HomeGoodsIcon, HobbiesIcon, PharmacyIcon, DoctorIcon, GymIcon, MoviesIcon, SubscriptionsIcon, MaintenanceIcon, GasIcon, BusIcon, CarIcon, TrendingUpIcon } from './components/icons';

export const NAV_ITEMS = [
  { name: 'Home', icon: HomeIcon },
  { name: 'Transactions', icon: TransactionsIcon },
  { name: 'Insights', icon: TrendingUpIcon },
  { name: 'Goals', icon: GoalsIcon },
  { name: 'Budgets', icon: BudgetIcon },
  { name: 'Account', icon: UserIcon },
  { name: 'Settings', icon: SettingsIcon },
];

export const INITIAL_BALANCE = 0;

import { SubCategory } from './types';

export const TRANSACTION_CATEGORIES: {
    expense: { [key: string]: SubCategory[] };
    income: { [key: string]: SubCategory[] };
} = {
    expense: {
        'Food & Drink': [{ name: 'Groceries' }, { name: 'Restaurants' }, { name: 'Coffee Shops' }, { name: 'Takeout' }],
        'Shopping': [{ name: 'Clothing' }, { name: 'Electronics' }, { name: 'Home Goods' }, { name: 'Hobbies' }, { name: 'General Shopping' }],
        'Bills & Utilities': [{ name: 'Rent/Mortgage' }, { name: 'Utilities' }, { name: 'Phone' }, { name: 'Internet' }, { name: 'Insurance' }],
        'Transportation': [{ name: 'Gas/Fuel' }, { name: 'Public Transit' }, { name: 'Ride Sharing' }, { name: 'Maintenance' }],
        'Health & Wellness': [{ name: 'Pharmacy' }, { name: 'Doctor' }, { name: 'Gym' }],
        'Entertainment': [{ name: 'Movies' }, { name: 'Subscriptions' }, { name: 'Games' }],
        'Transfers': [{ name: 'Transfers' }],
        'Other': [{ name: 'Other' }],
    },
    income: {
        'Earned': [{ name: 'Salary' }, { name: 'Freelance' }, { name: 'Bonus' }],
        'Passive': [{ name: 'Investments' }],
        'Other': [{ name: 'Savings' }, { name: 'Other' }],
    }
};

export const CATEGORY_ICON_MAP: { [key: string]: React.FC<{ className?: string }> } = {
    // Income
    'Salary': SalaryIcon,
    'Freelance': SalaryIcon,
    'Bonus': SalaryIcon,
    'Investments': PiggyBankIcon,
    'Savings': PiggyBankIcon,

    // Expense
    'Groceries': GroceriesIcon,
    'Restaurants': CoffeeIcon,
    'Coffee Shops': CoffeeIcon,
    'Takeout': CoffeeIcon,
    'Clothing': CartIcon,
    'Electronics': CartIcon,
    'Home Goods': HomeGoodsIcon,
    'Hobbies': HobbiesIcon,
    'General Shopping': CartIcon,
    'Rent/Mortgage': BillIcon,
    'Utilities': BillIcon,
    'Phone': BillIcon,
    'Internet': BillIcon,
    'Insurance': BillIcon,
    'Gas/Fuel': GasIcon,
    'Public Transit': BusIcon,
    'Ride Sharing': CarIcon,
    'Maintenance': MaintenanceIcon,
    'Pharmacy': PharmacyIcon,
    'Doctor': DoctorIcon,
    'Gym': GymIcon,
    'Movies': MoviesIcon,
    'Subscriptions': SubscriptionsIcon,
    'Games': CartIcon,
    'Transfers': TransferIcon,
    'Other': GroceriesIcon, // A default icon
};