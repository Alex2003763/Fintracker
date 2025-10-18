import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { RecurringIcon, SearchIcon } from './icons';
import { CATEGORY_ICON_MAP } from '../constants';

const TransactionItem: React.FC<{
  transaction: Transaction,
  onEdit: (transaction: Transaction) => void
}> = ({ transaction, onEdit }) => {
  const Icon = CATEGORY_ICON_MAP[transaction.category] || CATEGORY_ICON_MAP['Other'];
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const bgColor = isIncome ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const iconBgColor = isIncome ? 'bg-green-100' : 'bg-red-100';
  const iconColor = isIncome ? 'text-green-600' : 'text-red-600';

  const formattedAmount = isIncome
    ? `+${formatCurrency(transaction.amount)}`
    : `-${formatCurrency(transaction.amount)}`;

  return (
    <li
      className="group flex items-center gap-3 p-3 hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm border border-transparent hover:border-[rgb(var(--color-border-rgb))]"
      onClick={() => onEdit(transaction)}
    >
      <div className={`${iconBgColor} rounded-full p-2 transition-all duration-200 group-hover:scale-105`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors truncate">
            {transaction.description}
          </p>
          <div className={`px-2 py-1 rounded-full text-xs font-bold ${bgColor} ${amountColor}`}>
            {formattedAmount}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-card-muted-rgb))] px-2 py-1 rounded-full">
            {transaction.category}
          </span>
          <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-bg-rgb))] px-2 py-1 rounded-md">
            {new Date(transaction.date).toLocaleDateString()}
          </span>
        </div>
      </div>
    </li>
  );
};

// FIX: Explicitly type the accumulator in the reduce function to ensure correct type inference for `groupedTransactions`.
const groupTransactionsByDate = (transactions: Transaction[]): { [key: string]: Transaction[] } => {
    return transactions.reduce((groups: { [key: string]: Transaction[] }, transaction) => {
        const date = new Date(transaction.date);
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = date.toLocaleDateString('en-US', options);

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        let groupKey: string;
        if (date.toDateString() === today.toDateString()) {
            groupKey = 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            groupKey = 'Yesterday';
        } else {
            groupKey = dateString;
        }

        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(transaction);
        return groups;
    }, {} as { [key: string]: Transaction[] });
};
  
const TransactionsPage: React.FC<{
    transactions: Transaction[],
    onEditTransaction: (transaction: Transaction) => void,
    onOpenManageRecurring: () => void,
}> = ({ transactions, onEditTransaction, onOpenManageRecurring }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    return filtered;
  }, [searchQuery, filterType, transactions]);

  const groupedTransactions = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions]);


  return (
    <div className="relative space-y-4">
      {/* Main Content Card */}
      <div className="bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg p-4 sm:p-6 transition-all duration-300 border border-[rgb(var(--color-border-rgb))] h-[600px] overflow-y-auto">
        {/* Header */}
        <div className="relative mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--color-text-rgb))]">
              Transactions
            </h1>
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              {searchQuery && ` found`}
              {!searchQuery && transactions.length > 0 && ` • ${transactions.filter(t => t.type === 'income').length} income, ${transactions.filter(t => t.type === 'expense').length} expenses`}
            </p>
          </div>

          {/* Simplified Recurring Button - Top Right */}
          <button
              onClick={onOpenManageRecurring}
              className="absolute top-0 right-0 flex items-center px-3 py-2 text-sm font-medium text-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-primary-rgb))]/10 hover:bg-[rgb(var(--color-primary-rgb))]/20 rounded-lg transition-all duration-200 hover:scale-105 border border-[rgb(var(--color-primary-rgb))]/30"
          >
              <RecurringIcon className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Recurring</span>
          </button>
        </div>
       {/* Search and Filter */}
       <div className="space-y-3 mb-4">
         <div className="relative group">
           <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[rgb(var(--color-text-muted-rgb))] group-focus-within:text-[rgb(var(--color-primary-rgb))] transition-colors duration-200" />
           <input
               type="text"
               placeholder="Search by description or category..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full h-12 pl-12 pr-4 rounded-xl bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))] focus:border-[rgb(var(--color-primary-rgb))] focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))]/20 focus:bg-white transition-all duration-200 hover:border-[rgb(var(--color-text-muted-rgb))]"
           />
           {searchQuery && (
             <button
               onClick={() => setSearchQuery('')}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] transition-colors"
             >
               <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           )}
         </div>

         <div className="flex gap-2 flex-wrap">
           <button
             onClick={() => setFilterType('all')}
             className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 ${
               filterType === 'all'
                 ? 'bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] shadow-lg ring-2 ring-[rgb(var(--color-primary-rgb))]/30'
                 : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))] hover:shadow-md'
             }`}
           >
             All ({transactions.length})
           </button>
           <button
             onClick={() => setFilterType('income')}
             className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 ${
               filterType === 'income'
                 ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-600/30'
                 : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))] hover:shadow-md'
             }`}
           >
             Income ({transactions.filter(t => t.type === 'income').length})
           </button>
           <button
             onClick={() => setFilterType('expense')}
             className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 ${
               filterType === 'expense'
                 ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-600/30'
                 : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))] hover:shadow-md'
             }`}
           >
             Expenses ({transactions.filter(t => t.type === 'expense').length})
           </button>
         </div>
       </div>

       {/* Transactions List */}
       <div className="relative min-h-screen">
         {Object.keys(groupedTransactions).length > 0 ? (
           Object.entries(groupedTransactions).map(([date, transactionsInGroup]) => (
             <div key={date} className="space-y-2">
               <div className="sticky top-0 bg-[rgb(var(--color-card-rgb))] z-50 py-4 border-b border-[rgb(var(--color-border-rgb))] backdrop-blur-md shadow-sm" style={{ top: '-5%' }}>
                 <div className="bg-[rgb(var(--color-card-rgb))] -mx-4 px-4 py-3 rounded-lg shadow-sm border border-[rgb(var(--color-border-rgb))]">
                   <div className="flex items-center justify-between">
                     <h2 className="text-base font-bold text-[rgb(var(--color-text-rgb))] bg-gradient-to-r from-[rgb(var(--color-primary-rgb))]/15 to-[rgb(var(--color-primary-rgb))]/8 py-2 px-4 rounded-lg border border-[rgb(var(--color-primary-rgb))]/25">
                       📅 {date}
                     </h2>
                     <div className="text-sm text-[rgb(var(--color-text-muted-rgb))] bg-[rgb(var(--color-card-muted-rgb))] px-3 py-1.5 rounded-full font-medium">
                       {(transactionsInGroup as Transaction[]).length} transaction{(transactionsInGroup as Transaction[]).length !== 1 ? 's' : ''}
                     </div>
                   </div>
                 </div>
               </div>
               <div className="space-y-1">
                 {(transactionsInGroup as Transaction[]).map(transaction => (
                   <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEditTransaction} />
                 ))}
               </div>
             </div>
           ))
         ) : (
           <div className="text-center py-20">
             <div className="bg-gradient-to-br from-[rgb(var(--color-border-rgb))]/20 to-[rgb(var(--color-card-muted-rgb))] rounded-full p-12 w-40 h-40 mx-auto mb-8 flex items-center justify-center shadow-lg">
               <SearchIcon className="h-16 w-16 text-[rgb(var(--color-text-muted-rgb))]" />
             </div>
             <p className="text-2xl font-bold text-[rgb(var(--color-text-rgb))] mb-4">
               {searchQuery ? 'No transactions found' : 'No transactions yet'}
             </p>
             <p className="text-[rgb(var(--color-text-muted-rgb))] text-lg leading-relaxed max-w-lg mx-auto mb-6">
               {searchQuery ? 'Try adjusting your search terms or clearing filters to see more results' : 'Start building your financial history by adding your first transaction. Track your income and expenses to gain insights into your spending patterns.'}
             </p>
             {searchQuery && (
               <button
                 onClick={() => setSearchQuery('')}
                 className="px-6 py-3 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] hover:shadow-lg transition-all duration-200 hover:scale-105"
               >
                 Clear Search
               </button>
             )}
           </div>
         )}
       </div>
     </div>
   </div>
 );
};

export default TransactionsPage;