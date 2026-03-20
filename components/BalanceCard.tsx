import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { SalaryIcon, ReportsIcon, CartIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { useTheme } from './ThemeContext';

interface BalanceCardProps {
  transactions: Transaction[];
  onAddTransaction: (type?: 'income' | 'expense') => void;
  setActiveItem: (item: string) => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ transactions, onAddTransaction, setActiveItem }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const { customBackground } = useTheme();

  const { balance, dailyChange, dailyIncome, dailyExpense } = useMemo(() => {
    const currentBalance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

    let income = 0;
    let expense = 0;

    const transactionsYesterday = transactions.filter(t => {
        const tDate = new Date(t.date);
        if (tDate >= yesterday && tDate < today) {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
            return true;
        }
        return false;
    });

    if (transactionsYesterday.length === 0) {
        return { balance: currentBalance, dailyChange: 0, dailyIncome: 0, dailyExpense: 0 };
    }

    const changeYesterday = income - expense;
    const previousBalance = currentBalance - changeYesterday;

    let percentageChange = 0;
    if (previousBalance !== 0 && Math.abs(previousBalance) > 0.01) {
      percentageChange = (changeYesterday / Math.abs(previousBalance)) * 100;
      // Cap percentage at reasonable bounds to prevent extreme values
      percentageChange = Math.max(-999, Math.min(999, percentageChange));
    }

    return { balance: currentBalance, dailyChange: percentageChange, dailyIncome: income, dailyExpense: expense };
  }, [transactions]);
  
  const changeColor = dailyChange >= 0 ? 'text-green-400 bg-green-400/20' : 'text-red-400 bg-red-400/20';
  const sign = dailyChange >= 0 ? '+' : '';

  const actionButtons = [
    { name: 'Add Income', icon: SalaryIcon, action: () => onAddTransaction('income') },
    { name: 'Add Expense', icon: CartIcon, action: () => onAddTransaction('expense') },
    { name: 'Reports', icon: ReportsIcon, action: () => setActiveItem('Reports') },
  ];

  return (
    <div className="card-flip-container w-full aspect-[1.8/1] min-h-[220px] md:min-h-[260px] max-h-[300px]">
      <div className={`card-flipper ${isFlipped ? 'flipped' : ''} h-full w-full rounded-3xl`}>
        {/* Card Front */}
        <div
          className="card-front text-white p-6 md:p-8 rounded-3xl shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
          style={{
            backgroundImage: customBackground
              ? `url(${customBackground})`
              : `linear-gradient(135deg, rgb(var(--gradient-from-rgb)), rgb(var(--gradient-to-rgb)))`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Glassmorphism overlay for readability if custom bg */}
          {customBackground && <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>}
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-white/80 text-sm font-medium tracking-wide uppercase mb-1 drop-shadow-sm">Total Balance</h2>
              <p className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md truncate">{formatCurrency(balance)}</p>
            </div>
            <div className="flex flex-col items-end ml-4 gap-2">
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
                aria-label="Flip card for details"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div className={`text-xs font-bold ${dailyChange >= 0 ? 'text-green-300 bg-green-500/20' : 'text-red-300 bg-red-500/20'} px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1 border border-white/10`}>
                {dailyChange >= 0 ?
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg> :
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                }
                {Math.abs(dailyChange).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-black/5 blur-xl"></div>

          <div className="relative z-10 flex justify-between gap-2 mt-auto pt-6">
            {actionButtons.map(button => (
                <button
                    key={button.name}
                    onClick={button.action}
                    className="flex-1 min-w-[30%] py-2.5 px-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border border-white/10 shadow-sm transition-all duration-200 active:scale-95 group"
                    aria-label={button.name}
                >
                    <button.icon className="h-6 w-6 text-white/90 group-hover:text-white mb-1" />
                    <span className="text-[10px] sm:text-xs font-semibold text-white/90 tracking-wide whitespace-nowrap">{button.name}</span>
                </button>
            ))}
          </div>
        </div>
        {/* Card Back */}
        <div className="card-back bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-rgb))] p-6 shadow-xl rounded-3xl flex flex-col justify-between h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold tracking-tight">Today's Summary</h3>
                <button onClick={() => setIsFlipped(!isFlipped)} className="bg-[rgb(var(--color-card-muted-rgb))] p-2 rounded-full text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] transition-colors" aria-label="Flip back">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-4">
                <div className="flex items-center justify-between bg-green-500/10 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-lg text-green-600 dark:text-green-400">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>
                        </div>
                        <span className="text-sm font-semibold text-[rgb(var(--color-text-rgb))]">Income</span>
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(dailyIncome)}</span>
                </div>
                
                <div className="flex items-center justify-between bg-red-500/10 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500/20 p-2 rounded-lg text-red-600 dark:text-red-400">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>
                        </div>
                        <span className="text-sm font-semibold text-[rgb(var(--color-text-rgb))]">Expenses</span>
                    </div>
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(dailyExpense)}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[rgb(var(--color-border-rgb))] flex items-center justify-between">
                <span className="text-sm font-bold text-[rgb(var(--color-text-muted-rgb))]">Net Flow</span>
                <span className={`text-xl font-black ${dailyIncome - dailyExpense >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {dailyIncome - dailyExpense >= 0 ? '+' : ''}{formatCurrency(dailyIncome - dailyExpense)}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;