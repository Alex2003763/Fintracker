import React from 'react';
import { Transaction, User } from '../types';
import { formatCurrency } from '../utils/formatters';
import CategoryIcon from './CategoryIcon';

interface TransactionsCardProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  setActiveItem: (item: string) => void;
  user: User | null;
}

const TransactionItem: React.FC<{ transaction: Transaction, onEdit: (transaction: Transaction) => void, user: User | null }> = ({ transaction, onEdit, user }) => {
  const amountColor = transaction.type === 'income' ? 'text-green-500' : 'text-[rgb(var(--color-text-rgb))]';
  const formattedAmount = transaction.type === 'income'
    ? `+${formatCurrency(transaction.amount)}`
    : formatCurrency(-transaction.amount);

  const getIconForCategory = (categoryName: string) => {
    if (!user?.customCategories) return undefined;
    const allCategories = { ...user.customCategories.expense, ...user.customCategories.income };
    for (const parentCategory in allCategories) {
      const subCategory = allCategories[parentCategory].find(c => c.name === categoryName);
      if (subCategory) {
        return subCategory.icon;
      }
    }
    return undefined;
  };

  const displayEmoji = transaction.emoji || getIconForCategory(transaction.category);

  return (
    <div
      className="flex items-center justify-between py-3 border-b last:border-b-0 border-[rgb(var(--color-border-rgb))] cursor-pointer hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors"
      onClick={() => onEdit(transaction)}
    >
      <div className="flex items-center">
        <div className="bg-[rgba(var(--color-border-rgb),0.5)] rounded-full p-3 mr-4">
          <CategoryIcon
            category={transaction.category}
            emoji={displayEmoji}
            className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]"
          />
        </div>
        <div>
          <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{transaction.description}</p>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">{new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>
      </div>
      <p className={`font-bold ${amountColor}`}>
        {formattedAmount}
      </p>
    </div>
  );
};

const TransactionsCard: React.FC<TransactionsCardProps> = ({ transactions, onEditTransaction, setActiveItem, user }) => {
  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-4 md:p-6 rounded-2xl shadow-sm overflow-hidden transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[rgb(var(--color-text-rgb))]">Recent Transactions</h2>
        <button onClick={() => setActiveItem('Transactions')} className="text-sm font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline">View All</button>
      </div>
      <div>
        {transactions.map(transaction => (
          <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEditTransaction} user={user} />
        ))}
      </div>
    </div>
  );
};

export default TransactionsCard;