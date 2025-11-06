import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/formatters';
import { RecurringIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon } from './icons';
import { CATEGORY_ICON_MAP } from '../constants';

const TransactionItem: React.FC<{
  transaction: Transaction,
  onEdit: (transaction: Transaction) => void
}> = ({ transaction, onEdit }) => {
  const Icon = CATEGORY_ICON_MAP[transaction.category] || CATEGORY_ICON_MAP['Other'];
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const bgColor = isIncome ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  const iconBgColor = isIncome ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30';
  const iconColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  const formattedAmount = isIncome
    ? `+${formatCurrency(transaction.amount)}`
    : `-${formatCurrency(transaction.amount)}`;

  // Format time for better readability
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <li
      className="group flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-[rgb(var(--color-card-muted-rgb))] dark:hover:bg-[rgb(var(--color-card-muted-rgb))]/50 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm border border-transparent hover:border-[rgb(var(--color-border-rgb))] dark:hover:border-[rgb(var(--color-border-rgb))]/50 w-full min-h-[48px] sm:min-h-[56px] active:scale-[0.98] overflow-hidden"
      onClick={() => onEdit(transaction)}
    >
      {/* Category Icon */}
      <div className={`${iconBgColor} rounded-lg p-1.5 sm:p-2 transition-all duration-200 group-hover:scale-105 shadow-sm flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center`}>
        <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${iconColor}`} />
      </div>

      {/* Transaction Details */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="min-w-0 overflow-hidden flex-1" style={{ maxWidth: 'calc(100% - 100px)' }}>
            <p className="font-medium sm:font-semibold text-sm sm:text-base text-[rgb(var(--color-text-rgb))] group-hover:text-[rgb(var(--color-primary-rgb))] transition-colors truncate leading-tight">
              {transaction.description}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] truncate max-w-[100px] sm:max-w-[150px]">
                {transaction.category}
              </p>
              <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] hidden xs:inline">•</span>
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] hidden xs:inline whitespace-nowrap">
                {formatTime(transaction.date)}
              </p>
            </div>
          </div>

          {/* Amount - Fixed Width, No Truncation */}
          <div className={`text-sm sm:text-base font-bold w-[90px] sm:w-[100px] text-right ${amountColor} flex-shrink-0`}>
            {formattedAmount}
          </div>
        </div>
      </div>

      {/* Action Indicators */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 hidden sm:block">
        <div className="w-1.5 h-1.5 bg-[rgb(var(--color-text-muted-rgb))]/40 rounded-full"></div>
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
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  // Calculate filter counts
  const filterCounts = useMemo(() => ({
    all: transactions.length,
    income: transactions.filter(t => t.type === 'income').length,
    expense: transactions.filter(t => t.type === 'expense').length
  }), [transactions]);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
     <div className="relative space-y-4 sm:space-y-6 w-[600px] mx-auto px-3 sm:px-4 overflow-x-hidden" style={{ width: '600px', maxWidth: '90vw' }}>
       {/* Mobile-Optimized Header Section */}
       <div className="bg-[rgb(var(--color-card-rgb))] rounded-xl shadow-md p-3 sm:p-4 md:p-6 border border-[rgb(var(--color-border-rgb))] w-full min-w-0 overflow-hidden">
         {/* Mobile-Optimized Header with Original Recurring Button Position */}
         <div className="relative mb-4">
           <div className="pr-20 sm:pr-24">
             <h1 className="text-xl sm:text-2xl font-bold text-[rgb(var(--color-text-rgb))]">
               Transactions
             </h1>
             <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
               {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
               {searchQuery && ' found'}
             </p>
           </div>

           {/* Recurring Button - Back to Original Position but Mobile-Optimized */}
           <button
             onClick={onOpenManageRecurring}
             className="absolute top-0 right-0 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-primary-rgb))]/10 hover:bg-[rgb(var(--color-primary-rgb))]/20 active:bg-[rgb(var(--color-primary-rgb))]/30 rounded-lg transition-all duration-200 min-h-[36px] sm:min-h-[44px] touch-manipulation"
             aria-label="Manage recurring transactions"
           >
             <RecurringIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
             <span className="whitespace-nowrap text-xs sm:text-sm">Recurring</span>
           </button>
         </div>

         {/* Responsive Search Bar */}
         <div className="relative mb-4">
           <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-[rgb(var(--color-text-muted-rgb))]" />
           <input
             type="text"
             placeholder="Search transactions..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full h-11 sm:h-12 pl-10 pr-10 rounded-lg bg-[rgb(var(--color-bg-rgb))] text-[rgb(var(--color-text-rgb))] border border-[rgb(var(--color-border-rgb))] focus:border-[rgb(var(--color-primary-rgb))] focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))]/20 transition-colors text-sm sm:text-base"
           />
           {searchQuery && (
             <button
               onClick={() => setSearchQuery('')}
               className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] p-1 rounded transition-colors"
               aria-label="Clear search"
             >
               <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           )}
         </div>

         {/* Mobile-Optimized Filter Buttons */}
         <div className="flex gap-1.5 sm:gap-2 flex-wrap items-stretch justify-start">
           <button
             onClick={() => setFilterType('all')}
             className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
               filterType === 'all'
                 ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-sm'
                 : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-[rgb(var(--color-border-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
             }`}
           >
             <span className="truncate">
               All ({filterCounts.all > 999 ? '999+' : filterCounts.all})
             </span>
           </button>
           <button
             onClick={() => setFilterType('income')}
             className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
               filterType === 'income'
                 ? 'bg-green-600 text-white shadow-sm'
                 : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-green-50 hover:text-green-700'
             }`}
           >
             <span className="truncate">
               <span className="hidden xs:inline">Income</span>
               <span className="xs:hidden">In</span>
               {` (${filterCounts.income})`}
             </span>
           </button>
           <button
             onClick={() => setFilterType('expense')}
             className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center whitespace-nowrap flex-shrink-0 ${
               filterType === 'expense'
                 ? 'bg-red-600 text-white shadow-sm'
                 : 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-muted-rgb))] hover:bg-red-50 hover:text-red-700'
             }`}
           >
             <span className="truncate">
               <span className="hidden xs:inline">Expenses</span>
               <span className="xs:hidden">Exp</span>
               {` (${filterCounts.expense})`}
             </span>
           </button>
         </div>
       </div>

       {/* Simplified Transactions List */}
       <div className="space-y-4">
         {Object.keys(groupedTransactions).length > 0 ? (
           Object.entries(groupedTransactions).map(([date, transactionsInGroup]) => (
             <div key={date} className="space-y-3">
               {/* Simple Date Header */}
               <div className="bg-[rgb(var(--color-card-muted-rgb))] dark:bg-[rgb(var(--color-card-muted-rgb))]/50 py-2 px-4 rounded-lg border border-[rgb(var(--color-border-rgb))]">
                 <h3 className="font-semibold text-[rgb(var(--color-text-rgb))]">
                   {date}
                 </h3>
               </div>

               {/* Transaction Items */}
               <div className="space-y-2">
                 {(transactionsInGroup as Transaction[]).map(transaction => (
                   <TransactionItem key={transaction.id} transaction={transaction} onEdit={onEditTransaction} />
                 ))}
               </div>
             </div>
           ))
         ) : (
           /* Mobile-Optimized Empty State */
           <div className="text-center py-12 sm:py-16 md:py-24 px-4 sm:px-6">
             <div className="relative mb-8 sm:mb-12">
               <div className="bg-gradient-to-br from-[rgb(var(--color-primary-rgb))]/10 to-[rgb(var(--color-primary-rgb))]/5 rounded-full p-8 sm:p-12 md:p-16 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-xl border border-[rgb(var(--color-primary-rgb))]/20 animate-pulse">
                 <SearchIcon className="h-12 w-12 sm:h-16 sm:w-16 md:h-24 md:w-24 text-[rgb(var(--color-primary-rgb))]/60" />
               </div>
               <div className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-[rgb(var(--color-primary-rgb))] text-white rounded-full p-2 sm:p-3 shadow-lg animate-bounce">
                 <span className="text-lg sm:text-xl md:text-2xl">💡</span>
               </div>
             </div>

             <div className="space-y-3 sm:space-y-4 max-w-sm sm:max-w-md mx-auto">
               <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-3 sm:mb-4">
                 {searchQuery ? 'No matches found' : 'Start your journey'}
               </h3>
               <p className="text-sm sm:text-base md:text-lg text-[rgb(var(--color-text-muted-rgb))] leading-relaxed mb-4 sm:mb-6">
                 {searchQuery
                   ? 'Try adjusting your search terms or clearing filters to see more results'
                   : 'Begin tracking your financial journey by adding your first transaction. Monitor your income and expenses to gain valuable insights into your spending patterns.'
                 }
               </p>

               {searchQuery && (
                 <button
                   onClick={() => setSearchQuery('')}
                   className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-xl shadow-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] hover:shadow-xl transition-all duration-200 hover:scale-105 min-h-[48px] sm:min-h-[52px] text-sm sm:text-base"
                 >
                   Clear Search & View All
                 </button>
               )}

               {!searchQuery && (
                 <div className="flex flex-col gap-3 justify-center max-w-xs sm:max-w-none mx-auto">
                   <button className="w-full px-4 sm:px-6 py-3 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-xl shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] hover:shadow-lg transition-all duration-200 hover:scale-105 min-h-[48px] text-sm sm:text-base">
                     Add First Transaction
                   </button>
                   <button className="w-full px-4 sm:px-6 py-3 bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] font-semibold rounded-xl shadow-md hover:bg-[rgb(var(--color-border-rgb))] transition-all duration-200 hover:scale-105 min-h-[48px] text-sm sm:text-base">
                     Setup Recurring
                   </button>
                 </div>
               )}
             </div>
           </div>
         )}
       </div>

       {/* Mobile-Optimized Scroll to Top Button */}
       {showScrollTop && (
         <button
           onClick={scrollToTop}
           className="fixed bottom-20 sm:bottom-28 right-4 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 bg-[rgb(var(--color-primary-rgb))] hover:bg-[rgb(var(--color-primary-hover-rgb))] active:bg-[rgb(var(--color-primary-hover-rgb))] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-20 hover:scale-110 active:scale-95 min-h-[48px] min-w-[48px] sm:min-h-[56px] sm:min-w-[56px] touch-manipulation"
           aria-label="Scroll to top"
         >
           <ChevronUpIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
         </button>
       )}
     </div>
   );
 };

export default TransactionsPage;