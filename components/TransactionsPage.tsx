import React, { useState, useMemo } from 'react';
import { Transaction, User } from '../types';
import { formatCurrency } from '../utils/formatters';
import { RecurringIcon, SearchIcon } from './icons';
import TransactionRow from './TransactionRow';

// Removed virtual list row component in favor of standard mapping for reliability

const groupTransactionsByDate = (transactions: Transaction[]): { [key: string]: Transaction[] } => {
    return transactions.reduce((groups: { [key: string]: Transaction[] }, transaction) => {
        const date = new Date(transaction.date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let groupKey: string;
        if (date.toDateString() === today.toDateString()) {
            groupKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'Yesterday';
        } else {
            groupKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(transaction);
        return groups;
    }, {});
};
  
const TransactionsPage: React.FC<{
    transactions: Transaction[],
    onEditTransaction: (transaction: Transaction) => void,
    onOpenManageRecurring: () => void,
    scrollContainerRef?: React.RefObject<HTMLElement>,
    user: User | null
}> = ({ transactions, onEditTransaction, onOpenManageRecurring, user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
        const searchMatch = searchQuery === '' ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.category.toLowerCase().includes(searchQuery.toLowerCase());
        const typeMatch = filterType === 'all' || t.type === filterType;
        return searchMatch && typeMatch;
    });
  }, [searchQuery, filterType, transactions]);

  // Flatten transactions for virtual scrolling
  const flattenedItems = useMemo(() => {
    const groups = groupTransactionsByDate(filteredTransactions);
    const items: Array<{
      type: 'header' | 'transaction';
      data?: Transaction;
      group?: string;
      dailyTotal?: number;
      isFirst?: boolean;
      isLast?: boolean;
    }> = [];

    Object.entries(groups).forEach(([group, txs]) => {
      const dailyTotal = txs.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
      
      // Add Header
      items.push({
        type: 'header',
        group,
        dailyTotal
      });

      // Add Transactions
      txs.forEach((tx, index) => {
        items.push({
          type: 'transaction',
          data: tx,
          isFirst: index === 0,
          isLast: index === txs.length - 1
        });
      });
    });

    return items;
  }, [filteredTransactions]);

  const listRef = React.useRef<HTMLDivElement>(null);

  const FilterButton: React.FC<{type: 'all' | 'income' | 'expense', count: number}> = ({ type, count }) => (
    <button
      onClick={() => setFilterType(type)}
      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] ${
        filterType === type
          ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-md'
          : 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))]'
      }`}
      aria-pressed={filterType === type}
      aria-label={`Filter by ${type}, ${count} transactions`}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)} <span className="text-xs opacity-75 ml-1" aria-hidden="true">({count})</span>
    </button>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 pb-12 relative">
      <header className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] tracking-tight">Transactions</h1>
          <p className="text-[rgb(var(--color-text-muted-rgb))] mt-1">Track your financial activity</p>
        </div>
        <button
          onClick={onOpenManageRecurring}
          className="absolute top-0 right-0 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-opacity-90 transition-all shadow-sm"
          aria-label="Manage Recurring Transactions"
        >
          <RecurringIcon className="h-4 w-4" />
          <span>Recurring</span>
        </button>
      </header>

      <div className="w-full">
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="relative group">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgb(var(--color-text-muted-rgb))] group-focus-within:text-[rgb(var(--color-primary-rgb))] transition-colors" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search transactions..."
                        className="w-full bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl pl-12 pr-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all shadow-sm"
                        aria-label="Search transactions"
                    />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                    <FilterButton type="all" count={transactions.length} />
                    <FilterButton type="income" count={transactions.filter(t => t.type === 'income').length} />
                    <FilterButton type="expense" count={transactions.filter(t => t.type === 'expense').length} />
                </div>
            </div>

            <div
              ref={listRef}
              className="h-[65vh] min-h-[300px] w-full overflow-y-auto no-scrollbar scroll-smooth pb-4"
            >
                {flattenedItems.length === 0 ? (
                <div className="text-center py-20 bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-[rgb(var(--color-border-rgb))] border-dashed">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[rgba(var(--color-border-rgb),0.3)] flex items-center justify-center">
                        <SearchIcon className="h-10 w-10 text-[rgb(var(--color-text-muted-rgb))]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[rgb(var(--color-text-rgb))]">No Transactions Found</h3>
                    <p className="text-[rgb(var(--color-text-muted-rgb))] mt-2">Try adjusting your search or filters.</p>
                </div>
                ) : (
                  <div className="w-full">
                    {flattenedItems.map((item, index) => {
                      if (item.type === 'header') {
                        return (
                          <div key={`header-${item.group}-${index}`} className="px-1 pt-6 pb-2 flex justify-between items-end bg-[rgb(var(--color-bg-rgb))] sticky top-0 z-10">
                            <h2 className="text-sm font-bold text-[rgb(var(--color-text-muted-rgb))] uppercase tracking-wider">{item.group}</h2>
                            <span className={`text-sm font-semibold ${(item.dailyTotal || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-[rgb(var(--color-text-rgb))]'}`}>
                                {(item.dailyTotal || 0) > 0 ? '+' : ''}{formatCurrency(item.dailyTotal || 0)}
                            </span>
                          </div>
                        );
                      }

                      if (item.type === 'transaction' && item.data) {
                        return (
                          <div key={item.data.id} className="px-0">
                            <div className={`
                              bg-[rgb(var(--color-card-rgb))]
                              border-x border-[rgb(var(--color-border-rgb))]
                              ${item.isFirst ? 'rounded-t-xl border-t' : ''}
                              ${item.isLast ? 'rounded-b-xl border-b shadow-sm' : 'border-b'}
                              hover:bg-[rgb(var(--color-card-muted-rgb))]
                              transition-colors
                            `}>
                              <TransactionRow
                                transaction={item.data}
                                onEdit={onEditTransaction}
                                user={user}
                                style={{ borderRadius: item.isFirst || item.isLast ? undefined : '0' }}
                              />
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
            </div>
        </div>

      </div>


    </div>
  );
};

export default TransactionsPage;
