import React from 'react';
import { Transaction, Bill, CategoryEmoji, User } from '../types';
import PremiumBalanceCard from './PremiumBalanceCard';
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
  user?: User;
}

const Dashboard: React.FC<DashboardProps> = ({
    transactions,
    bills,
    onAddTransaction,
    onEditTransaction,
    setActiveItem,
    onPayBill,
    onManageBills,
    user
}) => {
  return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
       <div className="lg:col-span-2">
         <PremiumBalanceCard
            transactions={transactions}
            onAddTransaction={onAddTransaction}
            setActiveItem={setActiveItem}
         />
       </div>
       <TransactionsCard
         transactions={transactions.slice(0, 5)}
         onEditTransaction={onEditTransaction}
         setActiveItem={setActiveItem}
         categoryEmojis={user?.categoryEmojis}
       />
       <div className="space-y-6">
         <SpendingBreakdownCard transactions={transactions} />
         <UpcomingBillsCard bills={bills} onPayBill={onPayBill} onManageBills={onManageBills} />
       </div>
     </div>
   );
};

export default Dashboard;