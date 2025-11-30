import React from 'react';
import { Transaction, Bill, CategoryEmoji, User } from '../types';
import PremiumBalanceCard from './PremiumBalanceCard';
import TransactionsCard from './TransactionsCard';
import GoalsCard from './GoalsCard';
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

const Dashboard: React.FC<DashboardProps> = React.memo(({
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
     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-w-7xl mx-auto pb-20 md:pb-6">
       <div className="md:col-span-2 xl:col-span-3">
         <PremiumBalanceCard
            transactions={transactions}
            onAddTransaction={onAddTransaction}
            setActiveItem={setActiveItem}
            className="w-full mx-auto"
         />
       </div>
       
       <div className="md:col-span-1 xl:col-span-2 space-y-4">
         <TransactionsCard
           transactions={transactions.slice(0, 5)}
           onEditTransaction={onEditTransaction}
           setActiveItem={setActiveItem}
           user={user}
         />
         <UpcomingBillsCard bills={bills} onPayBill={onPayBill} onManageBills={onManageBills} />
       </div>
     </div>
   );
});

export default Dashboard;