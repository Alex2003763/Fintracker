import React from 'react';
import { HomeIcon, TransactionsIcon, ReportsIcon, GoalsIcon, SettingsIcon, SalaryIcon, CoffeeIcon, GroceriesIcon, BillIcon, CartIcon, PiggyBankIcon, TransferIcon, UserIcon, PlusIcon, BudgetIcon, HomeGoodsIcon, HobbiesIcon, PharmacyIcon, DoctorIcon, GymIcon, MoviesIcon, SubscriptionsIcon, MaintenanceIcon, GasIcon, BusIcon, CarIcon } from './components/icons';

export const NAV_ITEMS = [
  { name: 'Home', icon: HomeIcon },
  { name: 'Transactions', icon: TransactionsIcon },
  { name: 'Reports', icon: ReportsIcon },
  { name: 'Budgets', icon: BudgetIcon },
  { name: 'Goals', icon: GoalsIcon },
  { name: 'Account', icon: UserIcon },
  { name: 'Settings', icon: SettingsIcon },
];

export const INITIAL_BALANCE = 0;

export const TRANSACTION_CATEGORIES: {
    expense: { [key: string]: string[] };
    income: { [key: string]: string[] };
} = {
    expense: {
        'Food & Drink': ['Groceries', 'Restaurants', 'Coffee Shops', 'Takeout'],
        'Shopping': ['Clothing', 'Electronics', 'Home Goods', 'Hobbies', 'General Shopping'],
        'Bills & Utilities': ['Rent/Mortgage', 'Utilities', 'Phone', 'Internet', 'Insurance'],
        'Transportation': ['Gas/Fuel', 'Public Transit', 'Ride Sharing', 'Maintenance'],
        'Health & Wellness': ['Pharmacy', 'Doctor', 'Gym'],
        'Entertainment': ['Movies', 'Subscriptions', 'Games'],
        'Transfers': ['Transfers'],
        'Other': ['Other'],
    },
    income: {
        'Earned': ['Salary', 'Freelance', 'Bonus'],
        'Passive': ['Investments'],
        'Other': ['Savings', 'Other'],
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