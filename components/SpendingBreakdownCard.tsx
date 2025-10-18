import React, { useMemo } from 'react';
import { Transaction, SpendingCategory } from '../types';
import { useTheme } from './ThemeContext';

interface SpendingBreakdownCardProps {
  transactions: Transaction[];
}

const SpendingBreakdownCard: React.FC<SpendingBreakdownCardProps> = ({ transactions }) => {
  const { theme } = useTheme();

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

  // Theme-aware colors for the chart
  const colors = useMemo(() => {
    const colorMap: { [key: string]: string[] } = {
      'theme-light': [
        'rgb(var(--color-primary-rgb))',
        'rgb(34 197 94)', // green-500
        'rgb(168 85 247)', // purple-500
        'rgb(239 68 68)',  // red-500
        'rgb(245 158 11)', // amber-500
        'rgb(14 165 233)', // sky-500
        'rgb(236 72 153)', // pink-500
        'rgb(6 182 212)'   // cyan-500
      ],
      'theme-dark-slate': [
        'rgb(var(--color-primary-rgb))',
        'rgb(74 222 128)', // emerald-400
        'rgb(168 85 247)', // violet-500
        'rgb(248 113 113)', // rose-400
        'rgb(251 191 36)', // amber-400
        'rgb(56 189 248)', // sky-400
        'rgb(244 114 182)', // pink-400
        'rgb(34 211 238)'  // cyan-400
      ],
      'theme-dark-green': [
        'rgb(var(--color-primary-rgb))',
        'rgb(134 239 172)', // emerald-300
        'rgb(196 181 253)', // violet-300
        'rgb(252 165 165)', // rose-300
        'rgb(253 224 71)',  // yellow-300
        'rgb(125 211 252)', // sky-300
        'rgb(249 168 212)', // pink-300
        'rgb(103 232 249)'  // cyan-300
      ],
      'theme-dark-crimson': [
        'rgb(var(--color-primary-rgb))',
        'rgb(134 239 172)', // emerald-300
        'rgb(196 181 253)', // violet-300
        'rgb(252 165 165)', // rose-300
        'rgb(253 224 71)',  // yellow-300
        'rgb(125 211 252)', // sky-300
        'rgb(249 168 212)', // pink-300
        'rgb(103 232 249)'  // cyan-300
      ]
    };
    return colorMap[theme] || colorMap['theme-light'];
  }, [theme]);

  // Category icons mapping
  const getCategoryIcon = (categoryName: string) => {
    const categoryIcons: { [key: string]: string } = {
      'food': '🍕',
      'dining': '🍽️',
      'restaurant': '🍽️',
      'groceries': '🛒',
      'shopping': '🛍️',
      'transport': '🚗',
      'gas': '⛽',
      'fuel': '⛽',
      'entertainment': '🎬',
      'movies': '🎬',
      'games': '🎮',
      'utilities': '💡',
      'electricity': '⚡',
      'water': '💧',
      'internet': '🌐',
      'phone': '📱',
      'mobile': '📱',
      'rent': '🏠',
      'mortgage': '🏘️',
      'insurance': '🛡️',
      'healthcare': '🏥',
      'medical': '💊',
      'fitness': '💪',
      'gym': '💪',
      'education': '📚',
      'books': '📖',
      'clothing': '👕',
      'fashion': '👗',
      'travel': '✈️',
      'vacation': '🏖️',
      'hotel': '🏨',
      'subscription': '📅',
      'netflix': '📺',
      'spotify': '🎵',
      'amazon': '📦',
      'coffee': '☕',
      'snacks': '🍪',
      'alcohol': '🍷',
      'tobacco': '🚬',
      'pets': '🐕',
      'pet': '🐕',
      'baby': '👶',
      'kids': '🧸',
      'gifts': '🎁',
      'donations': '🤝',
      'charity': '❤️',
      'home': '🏠',
      'maintenance': '🔧',
      'repair': '🔧',
      'automotive': '🔧',
      'beauty': '💄',
      'personal': '💅',
      'care': '💅',
    };

    const categoryKey = categoryName.toLowerCase();
    return categoryIcons[categoryKey] || '💰';
  };

  const gradientStops = useMemo(() => {
    if (totalSpending === 0) return 'rgb(var(--color-border-rgb)) 0% 100%';
    let cumulativePercentage = 0;
    return spendingByCategory.map((category, index) => {
      const percentage = (category.amount / totalSpending) * 100;
      const stop = `${colors[index % colors.length]} ${cumulativePercentage}% ${cumulativePercentage + percentage}%`;
      cumulativePercentage += percentage;
      return stop;
    }).join(', ');
  }, [spendingByCategory, totalSpending, colors]);

  const largestCategoryPercentage = useMemo(() => {
    if (spendingByCategory.length === 0 || totalSpending === 0) return 0;
    const largestCategory = spendingByCategory[0];
    return Math.round((largestCategory.amount / totalSpending) * 100);
  }, [spendingByCategory, totalSpending]);

  return (
    <div className="bg-[rgb(var(--color-card-rgb))] p-4 sm:p-6 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[rgb(var(--color-text-rgb))]">
          Spending Breakdown
        </h2>
        {totalSpending > 0 && (
          <div className="text-right">
            <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
              Total Spent
            </p>
            <p className="text-lg font-semibold text-[rgb(var(--color-primary-rgb))]">
              ${totalSpending.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {spendingByCategory.length > 0 ? (
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4">
            <div
              className="w-full h-full rounded-full transition-transform duration-300 hover:scale-105"
              style={{ background: `conic-gradient(${gradientStops})`}}
            ></div>
            <div className="absolute inset-3 sm:inset-5 bg-[rgb(var(--color-card-rgb))] rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl sm:text-3xl font-bold text-[rgb(var(--color-text-rgb))]">
                {largestCategoryPercentage}%
              </span>
              <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                of total
              </span>
            </div>
          </div>

          <div className="w-full space-y-3">
            {spendingByCategory.slice(0, 5).map((category, index) => (
              <div
                key={category.name}
                className="group flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-[rgb(var(--color-card-muted-rgb))]"
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full mr-3 transition-transform duration-200 group-hover:scale-110"
                    style={{backgroundColor: colors[index % colors.length]}}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[rgb(var(--color-text-rgb))] truncate">
                      {category.name}
                    </p>
                    <p className="text-xs text-[rgb(var(--color-text-muted-rgb))]">
                      ${category.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <p className="font-medium text-[rgb(var(--color-text-rgb))]">
                    {totalSpending > 0 ? ((category.amount / totalSpending) * 100).toFixed(0) : 0}%
                  </p>
                  <div className="w-16 h-1.5 bg-[rgb(var(--color-border-rgb))] rounded-full mt-1">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${totalSpending > 0 ? (category.amount / totalSpending) * 100 : 0}%`,
                        backgroundColor: colors[index % colors.length]
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

            {spendingByCategory.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
                  +{spendingByCategory.length - 5} more categories
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgb(var(--color-border-rgb))] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[rgb(var(--color-text-muted-rgb))]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-[rgb(var(--color-text-muted-rgb))] font-medium">
            No spending data yet
          </p>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">
            Add some expenses to see your breakdown
          </p>
        </div>
      )}
    </div>
  );
};

export default SpendingBreakdownCard;