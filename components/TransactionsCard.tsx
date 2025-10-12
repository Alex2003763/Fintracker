import React from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_ICON_MAP } from '../constants';

interface TransactionsCardProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  setActiveItem: (item: string) => void;
}

const TransactionItem: React.FC<{ transaction: Transaction, onEdit: (transaction: Transaction) => void }> = ({ transaction, onEdit }) => {
  const Icon = CATEGORY_ICON_MAP[transaction.category] || CATEGORY_ICON_MAP['Other'];
  const amountColor = transaction.type === 'income' ? 'text-green-500' : 'text-[rgb(var(--color-text-rgb))]';
  const formattedAmount = transaction.type === 'income'
    ? `+${formatCurrency(transaction.amount)}`
    : formatCurrency(-transaction.amount);

  return (
    <div 
      className="flex items-center justify-between py-4 border-b last:border-b-0 border-[rgb(var(--color-border-rgb))] cursor-pointer hover:bg-[rgb(var(--color-card-muted-rgb))] -mx-6 px-6 transition-colors"
      onClick={() => onEdit(transaction)}
    >
      <div className="flex items-center">
        <div className="bg-[rgba(var(--color-border-rgb),0.5)] rounded-full p-3 mr-4">
          <Icon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]" />
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

const TransactionsCard: React.FC<TransactionsCardProps> = ({ transactions, onEditTransaction, setActiveItem }) => {
  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-6 rounded-2xl shadow-sm overflow-hidden transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[rgb(var(--color-text-rgb))]">Recent Transactions</h2>
        <button onClick={() => setActiveItem('Transactions')} className="text-sm font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:underline">View All</button>
      </div>
      <div>
        {transactions.map(transaction => (
          <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEditTransaction} />
        ))}
      </div>
    </div>
  );
};

export default TransactionsCard;