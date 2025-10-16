import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { RecurringIcon, SearchIcon } from './icons';
import { CATEGORY_ICON_MAP } from '../constants';

const TransactionItem: React.FC<{
  transaction: Transaction,
  onEdit: (transaction: Transaction) => void
}> = ({ transaction, onEdit }) => {
  const Icon = CATEGORY_ICON_MAP[transaction.category] || CATEGORY_ICON_MAP['Other'];
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const bgColor = isIncome ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const iconBgColor = isIncome ? 'bg-green-100' : 'bg-red-100';
  const iconColor = isIncome ? 'text-green-600' : 'text-red-600';

  const formattedAmount = isIncome
    ? `+${formatCurrency(transaction.amount)}`
    : `-${formatCurrency(transaction.amount)}`;

  return (
    <li
      className="group flex items-center justify-between p-4 hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-xl cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-[1.01] border border-transparent hover:border-[rgb(var(--color-border-rgb))]"
      onClick={() => onEdit(transaction)}
    >
      <div className="flex items-center flex-1">
        <div className={`${iconBgColor} rounded-full p-2.5 mr-4 transition-colors group-hover:scale-110`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors">
            {transaction.description}
          </p>
          <div className="flex items-center mt-1">
            <span className="text-sm text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-card-muted-rgb))] px-2 py-1 rounded-full">
              {transaction.category}
            </span>
            <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] ml-2">
              {new Date(transaction.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold text-lg ${amountColor}`}>
          {formattedAmount}
        </p>
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${amountColor}`}>
          <span className="mr-1">{isIncome ? '+' : '−'}</span>
          {isIncome ? 'Income' : 'Expense'}
        </div>
      </div>
    </li>
  );
};

// FIX: Explicitly type the accumulator in the reduce function to ensure correct type inference for `groupedTransactions`.
const groupTransactionsByDate = (transactions: Transaction[]): { [key: string]: Transaction[] } => {
    return transactions.reduce((groups: { [key: string]: Transaction[] }, transaction) => {
        const date = new Date(transaction.date);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = date.toLocaleDateString('en-US', options);

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        let groupKey: string;
        if (date.toDateString() === today.toDateString()) {
            groupKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'Yesterday';
        } else {
            groupKey = dateString;
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(transaction);
        return groups;
    }, {} as { [key: string]: Transaction[] });
};
  
const TransactionsPage: React.FC<{
    transactions: Transaction[],
    onEditTransaction: (transaction: Transaction) => void,
    onOpenManageRecurring: () => void,
}> = ({ transactions, onEditTransaction, onOpenManageRecurring }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    return filtered;
  }, [searchQuery, filterType, transactions]);

  const groupedTransactions = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions]);


  return (
    <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg p-6 space-y-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-2">Transactions</h1>
          <p className="text-[rgb(var(--color-text-muted-rgb))]">
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            {searchQuery && ` found`}
          </p>
        </div>
        <button
            onClick={onOpenManageRecurring}
            className="flex items-center px-4 py-2.5 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-all duration-200 shadow-sm hover:shadow-md"
        >
            <RecurringIcon className="h-4 w-4 mr-2" />
            Manage Recurring
        </button>
      </div>


      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgb(var(--color-text-muted-rgb))]" />
          <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))] focus:border-[rgb(var(--color-primary-rgb))] focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))]/20 transition-all duration-200"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filterType === 'all'
                ? 'bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))]'
                : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))]'
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filterType === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))]'
            }`}
          >
            Income ({transactions.filter(t => t.type === 'income').length})
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filterType === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))]'
            }`}
          >
            Expenses ({transactions.filter(t => t.type === 'expense').length})
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, transactionsInGroup]) => (
            <div key={date} className="space-y-3">
              <div className="sticky -top-3 bg-[rgb(var(--color-card-rgb))]/100 backdrop-blur-sm z-20 py-2 -mx-4 px-4 border-b border-[rgb(var(--color-border-rgb))] shadow-sm">
                <div className="bg-[rgb(var(--color-card-rgb))]/100 py-1">
                  <h2 className="text-sm font-bold text-[rgb(var(--color-text-rgb))] bg-[rgb(var(--color-primary-rgb))]/10 py-2.5 px-4 rounded-xl inline-block shadow-sm border border-[rgb(var(--color-primary-rgb))]/20">
                    {date}
                  </h2>
                </div>
              </div>
              <div className="space-y-2">
                {(transactionsInGroup as Transaction[]).map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEditTransaction} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="bg-[rgb(var(--color-card-muted-rgb))] rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <SearchIcon className="h-8 w-8 text-[rgb(var(--color-text-muted-rgb))]" />
            </div>
            <p className="text-lg font-medium text-[rgb(var(--color-text-rgb))] mb-2">
              {searchQuery ? 'No transactions found' : 'No transactions yet'}
            </p>
            <p className="text-[rgb(var(--color-text-muted-rgb))]">
              {searchQuery ? 'Try adjusting your search terms' : 'Add your first transaction to get started'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;