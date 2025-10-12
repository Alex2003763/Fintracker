import React from 'react';
import { Transaction, Bill } from '../types';
import BalanceCard from './BalanceCard';
import TransactionsCard from './TransactionsCard';
import SpendingBreakdownCard from './SpendingBreakdownCard';
import UpcomingBillsCard from './UpcomingBillsCard';

interface DashboardProps {
  transactions: Transaction[];
  bills: Bill[];
  onAddTransaction: (type?: 'income' | 'expense') => void;
  onEditTransaction: (transaction: Transaction) => void;
  setActiveItem: (item: string) => void;
  onPayBill: (bill: Bill) => void;
  onManageBills: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    transactions, 
    bills, 
    onAddTransaction, 
    onEditTransaction, 
    setActiveItem,
    onPayBill,
    onManageBills
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2">
        <BalanceCard transactions={transactions} onAddTransaction={onAddTransaction} setActiveItem={setActiveItem} />
      </div>
      <TransactionsCard 
        transactions={transactions.slice(0, 5)} 
        onEditTransaction={onEditTransaction}
        setActiveItem={setActiveItem}
      />
      <div className="space-y-6">
        <SpendingBreakdownCard transactions={transactions} />
        <UpcomingBillsCard bills={bills} onPayBill={onPayBill} onManageBills={onManageBills} />
      </div>
    </div>
  );
};

export default Dashboard;