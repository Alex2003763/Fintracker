import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { SalaryIcon, ReportsIcon } from './icons';
import { formatCurrency } from '../utils/formatters';

interface BalanceCardProps {
  transactions: Transaction[];
  onAddTransaction: (type?: 'income' | 'expense') => void;
  setActiveItem: (item: string) => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ transactions, onAddTransaction, setActiveItem }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const { balance, monthlyChange, monthlyIncome, monthlyExpense } = useMemo(() => {
    const currentBalance = transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
    
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    let income = 0;
    let expense = 0;

    const transactionsInLastMonth = transactions.filter(t => {
        const tDate = new Date(t.date);
        if (tDate >= oneMonthAgo) {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
            return true;
        }
        return false;
    });
    
    if (transactionsInLastMonth.length === 0) {
        return { balance: currentBalance, monthlyChange: 0, monthlyIncome: 0, monthlyExpense: 0 };
    }

    const changeLastMonth = income - expense;
    const previousBalance = currentBalance - changeLastMonth;
    
    let percentageChange = 0;
    if (previousBalance !== 0) {
      percentageChange = (changeLastMonth / Math.abs(previousBalance)) * 100;
    } else if (changeLastMonth !== 0) {
      percentageChange = changeLastMonth > 0 ? 100 : -100;
    }
    
    return { balance: currentBalance, monthlyChange: percentageChange, monthlyIncome: income, monthlyExpense: expense };
  }, [transactions]);
  
  const changeColor = monthlyChange >= 0 ? 'text-green-400 bg-green-400/20' : 'text-red-400 bg-red-400/20';
  const sign = monthlyChange >= 0 ? '+' : '';

  const actionButtons = [
    { name: 'Add Income', icon: SalaryIcon, action: () => onAddTransaction('income') },
    { name: 'Reports', icon: ReportsIcon, action: () => setActiveItem('Reports') },
  ];

  return (
    <div className="card-flip-container h-64 md:h-56">
      <div className={`card-flipper ${isFlipped ? 'flipped' : ''} h-full`}>
        {/* Card Front */}
        <div className="card-front text-white p-6 md:p-8 shadow-lg bg-gradient-to-br from-[rgb(var(--gradient-from-rgb))] to-[rgb(var(--gradient-to-rgb))] transition-colors">
          <div className="flex justify-between items-start mb-8 md:mb-4">
            <div>
              <h2 className="text-blue-200 text-base font-medium">Current Balance</h2>
              <p className="text-4xl font-bold mt-1">{formatCurrency(balance)}</p>
            </div>
            <div className="flex flex-col items-end">
                <p className={`text-sm font-semibold ${changeColor} px-3 py-1 rounded-full`}>
                    {sign}{monthlyChange.toFixed(1)}%
                </p>
                <button onClick={() => setIsFlipped(!isFlipped)} className="mt-2 text-blue-200 hover:text-white transition-colors" aria-label="Flip card">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.012 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                </button>
            </div>
          </div>
          <div className="flex justify-around md:justify-start md:space-x-8">
            {actionButtons.map(button => (
                <div key={button.name} className="flex flex-col items-center">
                    <button onClick={button.action} className="h-16 w-16 bg-[rgb(var(--color-card-rgb))] rounded-full flex items-center justify-center shadow-lg hover:bg-[rgba(var(--color-card-rgb),0.8)] transition-colors" aria-label={button.name}>
                        <div className="h-12 w-12 rounded-full border-2 border-[rgb(var(--color-border-rgb))] flex items-center justify-center">
                            <button.icon className="h-6 w-6 text-[rgb(var(--color-text-muted-rgb))]"/>
                        </div>
                    </button>
                    <span className="text-sm font-medium text-blue-100 mt-3">{button.name}</span>
                </div>
            ))}
          </div>
        </div>
        {/* Card Back */}
        <div className="card-back bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] p-6 md:p-8 shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold">Monthly Summary</h3>
                <button onClick={() => setIsFlipped(!isFlipped)} className="text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] transition-colors" aria-label="Flip card">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <div className="flex justify-around items-center h-full">
                <div className="text-center">
                    <p className="text-sm text-green-500 font-semibold">Income</p>
                    <p className="text-3xl font-bold">{formatCurrency(monthlyIncome)}</p>
                </div>
                <div className="h-2/3 w-px bg-[rgb(var(--color-border-rgb))]"></div>
                <div className="text-center">
                    <p className="text-sm text-red-500 font-semibold">Expenses</p>
                    <p className="text-3xl font-bold">{formatCurrency(monthlyExpense)}</p>
                </div>
            </div>
            <p className="text-xs text-center text-[rgb(var(--color-text-muted-rgb))]">Based on the last 30 days.</p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;