import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { RecurringIcon, SearchIcon } from './icons';
import { CATEGORY_ICON_MAP } from '../constants';

const TransactionItem: React.FC<{ transaction: Transaction, onEdit: (transaction: Transaction) => void }> = ({ transaction, onEdit }) => {
    const Icon = CATEGORY_ICON_MAP[transaction.category] || CATEGORY_ICON_MAP['Other'];
    const amountColor = transaction.type === 'income' ? 'text-green-500' : 'text-[rgb(var(--color-text-rgb))]';
    const formattedAmount = transaction.type === 'income'
    ? `+${formatCurrency(transaction.amount)}`
    : formatCurrency(-transaction.amount);
  
    return (
      <li 
        className="flex items-center justify-between py-4 px-2 hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-lg cursor-pointer transition-colors -mx-2"
        onClick={() => onEdit(transaction)}
      >
        <div className="flex items-center">
          <div className="bg-[rgba(var(--color-border-rgb),0.5)] rounded-full p-3 mr-4">
            <Icon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]" />
          </div>
          <div>
            <p className="font-semibold text-base text-[rgb(var(--color-text-rgb))]">{transaction.description}</p>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">{transaction.category}</p>
          </div>
        </div>
        <p className={`font-semibold text-base ${amountColor}`}>
          {formattedAmount}
        </p>
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

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    return transactions.filter(t => 
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, transactions]);

  const groupedTransactions = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions]);
  
  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-4 md:p-6 rounded-lg shadow space-y-6 transition-colors">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">All Transactions</h1>
        <button 
            onClick={onOpenManageRecurring}
            className="flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-primary-subtle-text-rgb))] bg-[rgba(var(--color-primary-rgb),0.1)] rounded-lg hover:bg-[rgba(var(--color-primary-rgb),0.2)] transition-colors"
        >
            <RecurringIcon className="h-5 w-5 mr-2" />
            Manage Recurring
        </button>
      </div>

      <div className="relative w-full">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgb(var(--color-text-muted-rgb))]" />
        <input
            type="text"
            placeholder="Search by description or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))] focus:border-[rgb(var(--color-primary-rgb))] focus:ring-0 transition-colors"
        />
      </div>

      <div>
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, transactionsInGroup]) => (
            <div key={date} className="mb-6">
              <h2 className="sticky-header text-sm font-semibold text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-card-muted-rgb))] py-2 px-2 -mx-2 mb-2">{date}</h2>
              <ul className="divide-y divide-[rgb(var(--color-border-rgb))]">
                {/* FIX: Cast transactionsInGroup to Transaction[] to resolve TypeScript inference issue. */}
                {(transactionsInGroup as Transaction[]).map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEditTransaction} />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-center text-[rgb(var(--color-text-muted-rgb))] py-8">
            {searchQuery ? 'No transactions found.' : 'No transactions yet.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;