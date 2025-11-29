import React from 'react';
import { Transaction, User } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import TransactionRow from './TransactionRow';

interface TransactionsCardProps {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  setActiveItem: (item: string) => void;
  user: User | null;
}

const TransactionsCard: React.FC<TransactionsCardProps> = React.memo(({ transactions, onEditTransaction, setActiveItem, user }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Recent Transactions</CardTitle>
        <button
            onClick={() => setActiveItem('Transactions')}
            className="text-sm font-semibold text-[rgb(var(--color-primary-subtle-text-rgb))] hover:text-[rgb(var(--color-primary-hover-rgb))] hover:underline focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] rounded px-2 py-1"
            aria-label="View all transactions"
        >
            View All
        </button>
      </CardHeader>
      <CardContent className="overflow-hidden">
        {transactions.length > 0 ? (
            <div className="space-y-1">
            {transactions.map(transaction => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={onEditTransaction}
                  user={user}
                  variant="compact"
                />
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center py-4 text-[rgb(var(--color-text-muted-rgb))]">
                <div className="bg-[rgba(var(--color-border-rgb),0.3)] p-4 rounded-full mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                </div>
                <p className="font-medium">No recent transactions</p>
                <p className="text-sm opacity-75 mt-1">Your recent activity will show up here</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
});

export default TransactionsCard;