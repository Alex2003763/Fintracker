import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Budget, User } from '../types';
import { Category } from '../types/category';
import Card, { CardHeader, CardTitle, CardContent } from './Card';
import { SparklesIcon, TrendingUpIcon, PieChartIcon, ArrowRightIcon, DownloadIcon } from './icons';
import ReportExportModal from './ReportExportModal';
import { useTheme } from './ThemeContext';
import { formatCurrency } from '../utils/formatters';
import SpendingTrendsWidget from './SpendingTrendsWidget';
import BudgetForecastingWidget from './BudgetForecastingWidget';
import SavingsRateWidget from './SavingsRateWidget';
import CategoryComparisonWidget from './CategoryComparisonWidget';
import FinancialHealthWidget from './FinancialHealthWidget';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  user: User;
  categories: Category[];
}

type TabId = 'overview' | 'trends' | 'forecasting' | 'net worth';
const TABS: TabId[] = ['overview', 'trends', 'forecasting', 'net worth'];

// Compact number formatter for axes — no currency prefix needed
const fmtAxis = (v: number) => {
  if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`;
  return `${v}`;
};

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  transactions,
  budgets,
  user,
  categories,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [key, setKey] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setKey((prev) => prev + 1), 100);
    return () => clearTimeout(timer);
  }, []);

  const isDark = theme === 'dark';
  const chartTextColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const incomeColor = isDark ? '#34d399' : '#059669';
  const expenseColor = isDark ? '#f87171' : '#dc2626';
  const netColor = isDark ? '#60a5fa' : '#2563eb';

  // Real stats computation
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const isThisMonth = (t: Transaction) => {
      const d = new Date(t.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    };
    const isLastMonth = (t: Transaction) => {
      const d = new Date(t.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
    };

    const sum = (txs: Transaction[], type: 'income' | 'expense') =>
      txs.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);

    const thisMonthTx = transactions.filter(isThisMonth);
    const lastMonthTx = transactions.filter(isLastMonth);

    const thisIncome = sum(thisMonthTx, 'income');
    const thisExpense = sum(thisMonthTx, 'expense');
    const lastIncome = sum(lastMonthTx, 'income');
    const lastExpense = sum(lastMonthTx, 'expense');
    const savingsRate = thisIncome > 0 ? ((thisIncome - thisExpense) / thisIncome) * 100 : 0;

    const categoryTotals: Record<string, number> = {};
    thisMonthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = t.categoryId || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      });
    const topCatId = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCategory = categories.find((c) => c.id === topCatId)?.name || topCatId || 'None';
    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? null : ((curr - prev) / prev) * 100;

    return {
      thisIncome, thisExpense, lastIncome, lastExpense, savingsRate, topCategory,
      expenseChange: pctChange(thisExpense, lastExpense),
      incomeChange: pctChange(thisIncome, lastIncome),
    };
  }, [transactions, categories]);

  // Month-over-Month chart data (last 6 months)
  const momData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleString('default', { month: 'short' });
      const txs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === m && td.getFullYear() === y;
      });
      return {
        label,
        income: txs.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0),
        expense: txs.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0),
      };
    });
  }, [transactions]);

  // Net worth trend
  const netWorthData = useMemo(() => {
    if (transactions.length === 0) return [];
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const byMonth: Record<string, number> = {};
    sorted.forEach((t) => {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      byMonth[k] = (byMonth[k] || 0) + (t.type === 'income' ? t.amount : -t.amount);
    });
    let cumulative = 0;
    return Object.entries(byMonth)
      .sort()
      .map(([k, v]) => {
        cumulative += v;
        const [yr, mo] = k.split('-');
        const label = new Date(Number(yr), Number(mo) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
        return { label, netWorth: cumulative };
      });
  }, [transactions]);

  const hasData = transactions.length > 0;

  const KpiCard: React.FC<{ label: string; value: string; change?: number | null; positive?: boolean }> = ({ label, value, change, positive }) => {
    const up = change != null && change > 0;
    const down = change != null && change < 0;
    const color = positive
      ? up ? 'text-green-500' : down ? 'text-red-500' : 'text-gray-400'
      : up ? 'text-red-500' : down ? 'text-green-500' : 'text-gray-400';
    return (
      <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: 'rgba(128,128,128,0.07)' }}>
        <span className="text-xs font-medium" style={{ color: chartTextColor }}>{label}</span>
        <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>{value}</span>
        {change != null && (
          <span className={`text-xs font-medium ${color}`}>
            {up ? '▲' : down ? '▼' : '–'} {Math.abs(change).toFixed(1)}% vs last month
          </span>
        )}
      </div>
    );
  };

  const EmptyState: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-50">
      <PieChartIcon className="h-10 w-10" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs">Add transactions to see your data here.</p>
    </div>
  );

  const tooltipStyle = {
    background: isDark ? '#1c1b19' : '#fff',
    border: '1px solid rgba(128,128,128,0.2)',
    borderRadius: 8,
    color: isDark ? '#cdccca' : '#28251d',
  };

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6 max-w-7xl mx-auto animate-fade-in-up">

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex space-x-1 bg-[rgb(var(--color-card-muted-rgb))] p-1 rounded-xl overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap capitalize ${
                activeTab === tab
                  ? 'bg-[rgb(var(--color-card-rgb))] text-[rgb(var(--color-text-rgb))] shadow-sm'
                  : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgba(var(--color-text-rgb),0.05)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(128,128,128,0.1)', color: 'var(--color-text)' }}
        >
          <DownloadIcon className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="This Month Income" value={formatCurrency(stats.thisIncome)} change={stats.incomeChange} positive />
            <KpiCard label="This Month Spending" value={formatCurrency(stats.thisExpense)} change={stats.expenseChange} positive={false} />
            <KpiCard label="Savings Rate" value={`${stats.savingsRate.toFixed(1)}%`} />
            <div className="rounded-xl p-4 flex flex-col gap-1" style={{ background: 'rgba(128,128,128,0.07)' }}>
              <span className="text-xs font-medium" style={{ color: chartTextColor }}>Top Category</span>
              <span className="text-lg font-bold truncate" style={{ color: 'var(--color-text)' }}>{stats.topCategory}</span>
              <span className="text-xs" style={{ color: chartTextColor }}>Highest spend this month</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <FinancialHealthWidget transactions={transactions} budgets={budgets} user={user} />
            </div>
            <div className="lg:col-span-1">
              <SavingsRateWidget transactions={transactions} />
            </div>
          </div>
        </div>
      )}

      {/* TRENDS */}
      {activeTab === 'trends' && (
        <div className="flex flex-col gap-6">
          {!hasData ? <EmptyState label="No transaction data yet" /> : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Spending — Last 6 Months</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={momData}
                        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                        barCategoryGap="20%"
                        barGap={4}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: chartTextColor }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: chartTextColor }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={fmtAxis}
                          width={48}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="income" name="Income" fill={incomeColor} radius={[4, 4, 0, 0]} maxBarSize={48} />
                        <Bar dataKey="expense" name="Spending" fill={expenseColor} radius={[4, 4, 0, 0]} maxBarSize={48} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SpendingTrendsWidget transactions={transactions} period="month" />
                <div className="h-[360px]">
                  <CategoryComparisonWidget transactions={transactions} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* FORECASTING */}
      {activeTab === 'forecasting' && (
        <div key={key} className="min-h-[400px]">
          <BudgetForecastingWidget transactions={transactions} budgets={budgets} />
        </div>
      )}

      {/* NET WORTH */}
      {activeTab === 'net worth' && (
        <div className="flex flex-col gap-4">
          {netWorthData.length < 2 ? <EmptyState label="Not enough data for net worth trend" /> : (
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Net Worth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={netWorthData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <defs>
                        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={netColor} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={netColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fill: chartTextColor }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 12, fill: chartTextColor }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={fmtAxis}
                        width={56}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(value: number) => [formatCurrency(value), 'Net Worth']}
                      />
                      <Area
                        type="monotone"
                        dataKey="netWorth"
                        stroke={netColor}
                        strokeWidth={2.5}
                        fill="url(#nwGrad)"
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Starting Net Worth', value: netWorthData[0]?.netWorth ?? 0 },
                    { label: 'Current Net Worth', value: netWorthData[netWorthData.length - 1]?.netWorth ?? 0 },
                    { label: 'Total Growth', value: (netWorthData[netWorthData.length - 1]?.netWorth ?? 0) - (netWorthData[0]?.netWorth ?? 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3 flex flex-col gap-1" style={{ background: 'rgba(128,128,128,0.07)' }}>
                      <span className="text-xs" style={{ color: chartTextColor }}>{label}</span>
                      <span className="text-base font-bold" style={{ color: value >= 0 ? incomeColor : expenseColor }}>
                        {formatCurrency(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isExportModalOpen && (
        <ReportExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          transactions={transactions}
          budgets={budgets}
          user={user}
          categories={categories}
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;
