import React from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { CATEGORY_ICON_MAP } from '../constants';

interface SearchResultsPageProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  searchQuery: string;
}

const TransactionItem: React.FC<{ transaction: Transaction, onEdit: (transaction: Transaction) => void }> = ({ transaction, onEdit }) => {
    const Icon = CATEGORY_ICON_MAP[transaction.category] || CATEGORY_ICON_MAP['Other'];
    const amountColor = transaction.type === 'income' ? 'text-green-500' : 'text-[rgb(var(--color-text-rgb))]';
    const formattedAmount = transaction.type === 'income'
    ? `+${formatCurrency(transaction.amount)}`
    : formatCurrency(-transaction.amount);
  
    return (
      <li 
        className="flex items-center justify-between py-4 px-2 hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-lg border-b border-[rgb(var(--color-border-rgb))] last:border-b-0 cursor-pointer transition-colors"
        onClick={() => onEdit(transaction)}
      >
        <div className="flex items-center">
          <div className="bg-[rgba(var(--color-border-rgb),0.5)] rounded-full p-3 mr-4">
            <Icon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]" />
          </div>
          <div>
            <p className="font-semibold text-base md:text-lg text-[rgb(var(--color-text-rgb))]">{transaction.description}</p>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">{new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} &middot; {transaction.category}</p>
          </div>
        </div>
        <p className={`font-semibold text-base md:text-lg ${amountColor}`}>
          {formattedAmount}
        </p>
      </li>
    );
  };

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ transactions, onEditTransaction, searchQuery }) => {
  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-4 md:p-6 rounded-lg shadow transition-colors">
      <h1 className="text-2xl font-bold mb-6 text-[rgb(var(--color-text-rgb))]">Search Results for "{searchQuery}"</h1>
      <ul className="-my-px">
        {transactions.length > 0 ? (
          transactions.map(transaction => (
            <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEditTransaction} />
          ))
        ) : (
          <p className="text-center text-[rgb(var(--color-text-muted-rgb))] py-8">No transactions found matching your search.</p>
        )}
      </ul>
    </div>
  );
};

export default SearchResultsPage;