import React, { memo } from 'react';
import { Transaction, Bill, User } from '../types';
import PremiumBalanceCard from './PremiumBalanceCard';
import TransactionsCard from './TransactionsCard';
import GoalsCard from './GoalsCard';
import UpcomingBillsCard from './UpcomingBillsCard';

interface DashboardProps {
  transactions: Transaction[];
  bills:        Bill[];
  onAddTransaction:  (type?: 'income' | 'expense') => void;
  onEditTransaction: (transaction: Transaction) => void;
  setActiveItem: (item: string) => void;
  onPayBill:     (bill: Bill) => void;
  onManageBills: () => void;
  user?: User;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes db-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .db-card {
    animation: db-fade-up 0.4s cubic-bezier(0.4,0,0.2,1) both;
  }
`;

let cssInjected = false;
const injectCSS = () => {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'db-css';
  el.textContent = CSS;
  document.head.appendChild(el);
  cssInjected = true;
};


// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader: React.FC<{
  title: string;
  action?: { label: string; onClick: () => void };
}> = ({ title, action }) => (
  <div className="flex items-center justify-between mb-3 px-0.5">
    <h2 className="text-sm font-bold text-[rgb(var(--color-text-rgb))] tracking-tight">{title}</h2>
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="text-xs font-semibold text-[rgb(var(--color-primary-rgb))] hover:opacity-75 active:scale-95 transition-all touch-manipulation"
      >
        {action.label} →
      </button>
    )}
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard: React.FC<DashboardProps> = memo(({
  transactions, bills, onAddTransaction, onEditTransaction,
  setActiveItem, onPayBill, onManageBills, user,
}) => {
  injectCSS();

  const upcomingBills = bills
    .filter(b => !b.isPaid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto pb-28 md:pb-10 px-0">

      {/* ── Balance card ── */}
      <div className="db-card" style={{ animationDelay: '0ms' }}>
        <PremiumBalanceCard
          transactions={transactions}
          onAddTransaction={onAddTransaction}
          setActiveItem={setActiveItem}
          className="w-full"
        />
      </div>

     

      {/* ── Recent transactions ── */}
      <div className="db-card" style={{ animationDelay: '120ms' }}>
        <SectionHeader
          title="Recent Transactions"
          action={{ label: 'See all', onClick: () => setActiveItem('Transactions') }}
        />
        <TransactionsCard
          transactions={recentTransactions}
          onEditTransaction={onEditTransaction}
          setActiveItem={setActiveItem}
          user={user}
        />
      </div>

      {/* ── Upcoming bills ── */}
      {upcomingBills.length > 0 && (
        <div className="db-card" style={{ animationDelay: '180ms' }}>
          <SectionHeader
            title="Upcoming Bills"
            action={{ label: 'Manage', onClick: onManageBills }}
          />
          <UpcomingBillsCard
            bills={upcomingBills}
            onPayBill={onPayBill}
            onManageBills={onManageBills}
          />
        </div>
      )}

      {/* ── Goals ── */}
      <div className="db-card" style={{ animationDelay: '240ms' }}>
        <SectionHeader
          title="Goals"
          action={{ label: 'See all', onClick: () => setActiveItem('Goals') }}
        />
        <GoalsCard goals={[]} setActiveItem={setActiveItem} />
      </div>

    </div>
  );
});

Dashboard.displayName = 'Dashboard';
export default Dashboard;