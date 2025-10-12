import React, { useMemo } from 'react';
import { Transaction, SpendingCategory } from '../types';

interface SpendingBreakdownCardProps {
  transactions: Transaction[];
}

const SpendingBreakdownCard: React.FC<SpendingBreakdownCardProps> = ({ transactions }) => {
  const spendingByCategory: SpendingCategory[] = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    return Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalSpending = useMemo(() => 
    spendingByCategory.reduce((sum, cat) => sum + cat.amount, 0),
    [spendingByCategory]
  );

  const colors = ['#6366F1', '#3B82F6', '#0EA5E9', '#06B6D4', '#14B8A6']; // indigo, blue, sky, cyan, teal

  const gradientStops = useMemo(() => {
    if (totalSpending === 0) return 'rgb(229 231 235) 0% 100%';
    let cumulativePercentage = 0;
    return spendingByCategory.map((category, index) => {
      const percentage = (category.amount / totalSpending) * 100;
      const stop = `${colors[index % colors.length]} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`;
      cumulativePercentage += percentage;
      return stop;
    }).join(', ');
  }, [spendingByCategory, totalSpending]);

  const largestCategoryPercentage = useMemo(() => {
    if (spendingByCategory.length === 0 || totalSpending === 0) return 0;
    const largestCategory = spendingByCategory[0];
    return Math.round((largestCategory.amount / totalSpending) * 100);
}, [spendingByCategory, totalSpending]);

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-6 rounded-2xl shadow-sm transition-colors">
      <h2 className="text-xl font-bold text-[rgb(var(--color-text-rgb))] mb-6">Spending Breakdown</h2>
      {spendingByCategory.length > 0 ? (
        <div className="flex flex-col items-center">
            <div className="relative w-40 h-40">
                <div 
                    className="w-full h-full rounded-full"
                    style={{ background: `conic-gradient(${gradientStops})`}}
                ></div>
                <div className="absolute inset-5 bg-[rgb(var(--color-card-rgb))] rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">{largestCategoryPercentage}%</span>
                </div>
            </div>
            <div className="mt-6 w-full space-y-3">
              {spendingByCategory.slice(0, 4).map((category, index) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                   <div className="flex items-center">
                       <div className="w-2.5 h-2.5 rounded-full mr-3" style={{backgroundColor: colors[index % colors.length]}}></div>
                       <p className="font-semibold text-[rgb(var(--color-text-rgb))]">{category.name}</p>
                   </div>
                   <p className="font-medium text-[rgb(var(--color-text-muted-rgb))]">{totalSpending > 0 ? ((category.amount / totalSpending) * 100).toFixed(0) : 0}%</p>
                </div>
              ))}
            </div>
        </div>
      ) : (
        <p className="text-[rgb(var(--color-text-muted-rgb))] text-center py-4">No spending data available.</p>
      )}
    </div>
  );
};

export default SpendingBreakdownCard;