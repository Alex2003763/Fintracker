import React, { useState, useMemo, useRef } from 'react';
import { Transaction, User } from '../types';
import { formatCurrency } from '../utils/formatters';
import { RecurringIcon, SearchIcon, ChevronUpIcon } from './icons';
import TransactionRow from './TransactionRow';
import TransactionChart from './TransactionChart';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const groupTransactionsByDate = (
  transactions: Transaction[]
): { [key: string]: Transaction[] } => {
  return transactions.reduce(
    (groups: { [key: string]: Transaction[] }, transaction) => {
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
        groupKey = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(transaction);
      return groups;
    },
    {}
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Summary stat pill shown at the top */
const StatPill: React.FC<{
  label: string;
  value: number;
  positive?: boolean;
}> = ({ label, value, positive }) => (
  <div className="flex flex-col items-center justify-center px-5 py-3 rounded-2xl bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] min-w-[120px] flex-1">
    <span className="text-xs font-semibold uppercase tracking-widest text-[rgb(var(--color-text-muted-rgb))] mb-1">
      {label}
    </span>
    <span
      className={`text-lg font-bold ${
        positive === undefined
          ? 'text-[rgb(var(--color-text-rgb))]'
          : positive
          ? 'text-[rgb(var(--color-success-rgb))]'
          : 'text-[rgb(var(--color-error-rgb))]'
      }`}
    >
      {positive ? '+' : positive === false ? '' : ''}
      {formatCurrency(value)}
    </span>
  </div>
);

/** Filter pill button */
const FilterButton: React.FC<{
  type: 'all' | 'income' | 'expense';
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}> = ({ type, label, count, active, onClick }) => {
  const activeColors: Record<string, string> = {
    all: 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-md',
    income: 'bg-[rgb(var(--color-success-rgb))] text-white shadow-md',
    expense: 'bg-[rgb(var(--color-error-rgb))] text-white shadow-md',
  };
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-2 text-sm font-semibold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] whitespace-nowrap ${
        active
          ? activeColors[type]
          : 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))]'
      }`}
    >
      {label}{' '}
      <span className="text-xs opacity-70 ml-1" aria-hidden="true">
        ({count})
      </span>
    </button>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const TransactionsPage: React.FC<{
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onOpenManageRecurring: () => void;
  scrollContainerRef?: React.RefObject<HTMLElement>;
  user: User | null;
}> = ({ transactions, onEditTransaction, onOpenManageRecurring, user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalIncome = useMemo(
    () => transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const netBalance = totalIncome - totalExpense;

  // ── Filtered list ────────────────────────────────────────────────────────
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const searchMatch =
        searchQuery === '' ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = filterType === 'all' || t.type === filterType;
      return searchMatch && typeMatch;
    });
  }, [searchQuery, filterType, transactions]);

  // ── Flattened items for rendering ────────────────────────────────────────
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
      const dailyTotal = txs.reduce(
        (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
        0
      );
      items.push({ type: 'header', group, dailyTotal });
      txs.forEach((tx, index) => {
        items.push({
          type: 'transaction',
          data: tx,
          isFirst: index === 0,
          isLast: index === txs.length - 1,
        });
      });
    });

    return items;
  }, [filteredTransactions]);

  // ── Scroll handling ──────────────────────────────────────────────────────
  const handleScroll = () => {
    setShowScrollTop((listRef.current?.scrollTop ?? 0) > 200);
  };

  const scrollToTop = () =>
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="space-y-5 max-w-5xl mx-auto px-4 pb-24 pt-5 relative">

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[rgb(var(--color-text-rgb))] tracking-tight">
            Transactions
          </h1>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-0.5">
            {transactions.length} total entries
          </p>
        </div>
        <button
          onClick={onOpenManageRecurring}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[rgb(var(--color-primary-rgb))] rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md"
          aria-label="Manage Recurring Transactions"
        >
          <RecurringIcon className="h-4 w-4" />
          <span>Recurring</span>
        </button>
      </header>


{/* ── Search & Filters ─────────────────────────────────────────── */}
<div className="space-y-2.5">

  {/* Search */}
  <div className="relative">
    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--color-text-muted-rgb))] transition-colors pointer-events-none" />
    <input
      type="search"
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      placeholder="Search transactions…"
      className="w-full bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-2xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent transition-all text-[rgb(var(--color-text-rgb))] placeholder:text-[rgb(var(--color-text-muted-rgb))] shadow-sm"
      aria-label="Search transactions"
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] transition-colors"
        aria-label="Clear search"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
        </svg>
      </button>
    )}
  </div>

  {/* Filter Pills */}
  <div className="flex items-center gap-2">
    {(['all', 'income', 'expense'] as const).map(type => {
      const isActive = filterType === type;
      const activeStyles: Record<string, string> = {
        all:     'bg-[rgb(var(--color-primary-rgb))] text-white border border-[rgb(var(--color-primary-rgb))]',
        income:  'bg-[rgb(var(--color-primary-rgb))] text-white border border-[rgb(var(--color-primary-rgb))]',
        expense: 'bg-[rgb(var(--color-primary-rgb))] text-white border border-[rgb(var(--color-primary-rgb))]',
      };

      return (
        <button
          key={type}
          onClick={() => setFilterType(type)}
          aria-pressed={isActive}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95 focus:outline-none
            ${isActive
              ? `${activeStyles[type]} shadow-sm`
              : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))]'
            }`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      );
    })}

    {/* Clear — only when active */}
    {(searchQuery || filterType !== 'all') && (
      <button
        onClick={() => { setSearchQuery(''); setFilterType('all'); }}
        className="ml-auto text-xs text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-error-rgb))] transition-colors"
        aria-label="Clear filters"
      >
        Clear ✕
      </button>
    )}
  </div>

</div>

      {/* ── Main Content Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Transaction List */}
        <div className="lg:col-span-2 relative">
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="h-[65vh] min-h-[300px] w-full overflow-y-auto no-scrollbar scroll-smooth"
          >
            {flattenedItems.length === 0 ? (
              /* ── Empty State ─────────────────────────────────────── */
              <div className="flex flex-col items-center justify-center h-full text-center py-16 bg-[rgb(var(--color-card-rgb))] rounded-2xl border border-dashed border-[rgb(var(--color-border-rgb))]">
                <div className="w-16 h-16 mb-4 rounded-full bg-[rgba(var(--color-border-rgb),0.25)] flex items-center justify-center">
                  <SearchIcon className="h-8 w-8 text-[rgb(var(--color-text-muted-rgb))]" />
                </div>
                <h3 className="text-lg font-bold text-[rgb(var(--color-text-rgb))]">
                  No Transactions Found
                </h3>
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
                  Try adjusting your search or filters.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                  className="mt-4 text-sm font-semibold text-[rgb(var(--color-primary-rgb))] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              /* ── Transaction Items ──────────────────────────────── */
              <div className="space-y-0 pb-4">
                {flattenedItems.map((item, index) => {
                  if (item.type === 'header') {
                    return (
                      <div
                        key={`header-${item.group}-${index}`}
                        className="flex justify-between items-center px-1 pt-5 pb-2 sticky top-0 z-10 bg-[rgb(var(--color-bg-rgb))]"
                      >
                        {/* Date badge */}
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[rgb(var(--color-text-muted-rgb))]">
                          {item.group}
                        </span>
                        {/* Daily net pill */}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            (item.dailyTotal ?? 0) > 0
                              ? 'bg-[rgba(var(--color-success-rgb),0.12)] text-[rgb(var(--color-success-rgb))] !text-green-600'
                              : (item.dailyTotal ?? 0) < 0
                              ? 'bg-[rgba(var(--color-error-rgb),0.12)] text-[rgb(var(--color-error-rgb))] !text-red-600'
                              : 'bg-[rgba(var(--color-border-rgb),0.12)] text-[rgb(var(--color-text-rgb))]'
                          }`}
                        >
                          {(item.dailyTotal ?? 0) > 0 ? '+' : ''}
                          {formatCurrency(item.dailyTotal ?? 0)}
                        </span>
                      </div>
                    );
                  }

                  if (item.type === 'transaction' && item.data) {
                    return (
                      <div
                        key={item.data.id}
                        className={`
                          bg-[rgb(var(--color-card-rgb))]
                          border-x border-[rgb(var(--color-border-rgb))]
                          ${item.isFirst ? 'rounded-t-2xl border-t' : ''}
                          ${item.isLast ? 'rounded-b-2xl border-b mb-1 shadow-sm' : 'border-b border-[rgba(var(--color-border-rgb),0.6)]'}
                          hover:bg-[rgb(var(--color-card-muted-rgb))]
                          transition-colors duration-150
                        `}
                      >
                        <TransactionRow
                          transaction={item.data}
                          onEdit={onEditTransaction}
                          user={user}
                        />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>


        </div>

        {/* Sidebar Chart */}
        <div className="hidden lg:block">
          <div className="sticky top-4">
            <TransactionChart transactions={filteredTransactions} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default TransactionsPage;