import React, { useMemo } from 'react';
import { Transaction } from '../types';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { PiggyBankIcon, TrendingUpIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface SavingsRateWidgetProps {
  transactions: Transaction[];
}

const SavingsRateWidget: React.FC<SavingsRateWidgetProps> = React.memo(({ transactions }) => {
  const savingsData = useMemo(() => {
    // Current month filter
    const now = new Date();
    const currentMonthTxs = transactions.filter(t => 
      new Date(t.date).getMonth() === now.getMonth() &&
      new Date(t.date).getFullYear() === now.getFullYear()
    );

    const income = currentMonthTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = currentMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate precise savings and handle negative edge cases
    const savings = Math.max(0, income - expenses);
    const rate = income > 0 ? Math.round((savings / income) * 100) : 0;
    
    return {
       income,
       expenses,
       savings,
       rate,
       chartData: [
         { name: 'Expenses', value: expenses, color: '#EF4444' },
         { name: 'Savings', value: savings, color: '#10B981' } // Green
       ]
    };
  }, [transactions]);

  const getRateMessage = (rate: number) => {
    if (rate >= 50) return "Excellent! You're saving a significant portion.";
    if (rate >= 20) return "Good job! You're hitting recommended targets.";
    if (rate > 0) return "Keep going! Every bit helps build security.";
    return "Expenses matched or exceeded income this month.";
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBankIcon className="h-5 w-5 text-green-500" />
          Monthly Savings Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center p-4">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={savingsData.chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {savingsData.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer> 
          {/* Centered Rate Text */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">
              {savingsData.rate}%
            </span>
          </div>
        </div>

        <div className="w-full mt-6 space-y-4">
           {/* Detailed Breakdown */}
           <div className="flex justify-between items-center text-sm border-b border-[rgb(var(--color-border-rgb))] pb-2">
              <span className="text-[rgb(var(--color-text-muted-rgb))]">Income</span>
              <span className="font-medium text-[rgb(var(--color-text-rgb))]">{formatCurrency(savingsData.income)}</span>
           </div>
           <div className="flex justify-between items-center text-sm border-b border-[rgb(var(--color-border-rgb))] pb-2">
              <span className="text-[rgb(var(--color-text-muted-rgb))]">Expenses</span>
              <span className="font-medium text-red-500">-{formatCurrency(savingsData.expenses)}</span>
           </div>
           
           <div className="flex justify-between items-center bg-green-500/10 p-3 rounded-lg">
             <span className="font-medium text-green-600 dark:text-green-400">Total Saved</span>
             <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(savingsData.savings)}</span>
           </div>
           
           <p className="text-xs text-center text-[rgb(var(--color-text-muted-rgb))] mt-2 px-4">
             {getRateMessage(savingsData.rate)}
           </p>
        </div>

      </CardContent>
    </Card>
  );
});

export default SavingsRateWidget;
