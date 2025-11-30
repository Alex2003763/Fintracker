import React, { useMemo, useState, useCallback } from 'react';
import { Transaction, SpendingCategory } from '../types';
import { useTheme } from './ThemeContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { formatCurrency } from '../utils/formatters';

interface SpendingBreakdownCardProps {
  transactions: Transaction[];
}

const SpendingBreakdownCard: React.FC<SpendingBreakdownCardProps> = ({ transactions }) => {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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

  const colors = useMemo(() => {
    const colorMap: { [key: string]: string[] } = {
      'theme-light': ['#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#0EA5E9', '#EC4899', '#06B6D4'],
      'theme-dark-slate': ['#60A5FA', '#34D399', '#A78BFA', '#F87171', '#FBBF24', '#38BDF8', '#F472B6', '#22D3EE'],
      'theme-dark-green': ['#4ADE80', '#6EE7B7', '#C4B5FD', '#FCA5A5', '#FDE047', '#7DD3FC', '#F9A8D4', '#67E8F9'],
      'theme-dark-crimson': ['#F43F5E', '#4ADE80', '#A78BFA', '#FCA5A5', '#FDE047', '#7DD3FC', '#F9A8D4', '#67E8F9'],
    };
    return colorMap[theme] || colorMap['theme-light'];
  }, [theme]);

  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

  const onPieLeave = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalSpending > 0 ? ((data.amount / totalSpending) * 100).toFixed(0) : 0;
      return (
        <div className="bg-[rgb(var(--color-card-rgb))] p-3 rounded-lg shadow-lg border border-[rgb(var(--color-border-rgb))]">
          <p className="font-bold text-[rgb(var(--color-text-rgb))]">{`${data.name}`}</p>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">{`${formatCurrency(data.amount)} (${percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;
    
    return (
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4" aria-label="Spending categories legend">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center text-xs text-[rgb(var(--color-text-muted-rgb))]">
            <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} aria-hidden="true" />
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  
    return (
      <g>
        <text x={cx} y={cy} dy={-4} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
          {payload.name}
        </text>
        <text x={cx} y={cy} dy={14} textAnchor="middle" fill="rgb(var(--color-text-muted-rgb))" fontSize={12}>
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center">
        {spendingByCategory.length > 0 ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center"
            role="img"
            aria-label="Spending breakdown pie chart"
          >
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={spendingByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="amount"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  activeIndex={activeIndex ?? -1}
                  activeShape={renderActiveShape}
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full px-4 mt-4 space-y-2">
              {spendingByCategory.map((category, index) => (
                <div key={category.name} className="flex items-center text-sm">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors[index % colors.length] }} />
                  <div className="flex-1 text-[rgb(var(--color-text-muted-rgb))]">{category.name}</div>
                  <div className="w-24 h-2 bg-[rgb(var(--color-card-muted-rgb))] rounded-full overflow-hidden mx-2">
                    <div
                      className="h-full"
                      style={{
                        width: `${totalSpending > 0 ? (category.amount / totalSpending) * 100 : 0}%`,
                        backgroundColor: colors[index % colors.length],
                      }}
                    />
                  </div>
                  <div className="font-semibold text-[rgb(var(--color-text-rgb))] w-16 text-right">{formatCurrency(category.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-[rgb(var(--color-text-muted-rgb))]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[rgba(var(--color-border-rgb),0.3)] flex items-center justify-center">
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-medium">No spending data yet</p>
            <p className="text-sm opacity-75 mt-1">Add some expenses to see your breakdown</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SpendingBreakdownCard;