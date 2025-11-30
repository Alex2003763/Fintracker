import React, { useMemo, useState } from 'react';
import { Transaction, User, AIInsight } from '../types';
import { Category } from '../types/category';
import CategoryIcon from './CategoryIcon';
import { ReportsIcon, SparklesIcon, ChevronDownIcon, DownloadIcon, XMarkIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import AISwiperCard from './AISwiperCard';
import Card, { CardHeader, CardTitle, CardContent } from './Card';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface TimeRangeOption {
  label: string;
  value: string;
  months: number;
}

const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { label: 'This Month', value: 'current_month', months: 1 },
  { label: 'Last 3 Months', value: 'last_3_months', months: 3 },
  { label: 'Last 6 Months', value: 'last_6_months', months: 6 },
  { label: 'This Year', value: 'current_year', months: 12 },
  { label: 'All Time', value: 'all_time', months: -1 }
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560', '#775DD0', '#546E7A'];

const FormattedAIInsights: React.FC<{ insights: AIInsight }> = ({ insights }) => (
  <div className="flex justify-center w-full max-w-full overflow-hidden">
    <div className="w-full max-w-lg">
      <AISwiperCard insights={insights} />
    </div>
  </div>
);

const AIInsightsCard: React.FC<{
  user: User, 
  transactions: Transaction[],
}> = ({ user, transactions }) => {
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasApiKey = !!user?.aiSettings?.apiKey;

  const handleGenerateInsights = async () => {
    if (!hasApiKey || !user.aiSettings?.apiKey) return;
    setIsLoading(true);
    setError('');
    setInsights(null);

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const recentTransactions = transactions
      .filter(t => new Date(t.date) >= oneMonthAgo)
      .map(({ description, category, type, amount }) => ({ description, category, type, amount }));

    if (recentTransactions.length < 3) {
      setError("Not enough recent transaction data to generate insights. Please add at least 3 transactions in the last month.");
      setIsLoading(false);
      return;
    }

    const prompt = `You are Finance Flow, an expert financial assistant. Analyze the following transactions from the last 30 days and provide a structured JSON response. Requirements:
- 'summary': 1 sentence only, maximum 15 words
- 'positivePoints': exactly 2 items, each under 10 words
- 'areasForImprovement': exactly 2 items, each under 10 words
- 'actionableTip': 1 specific, actionable recommendation under 15 words

Keep text friendly and concise. Focus on actionable insights.

Transactions:
${JSON.stringify(recentTransactions)}
`;

    try {
      const model = user.aiSettings?.model || 'gemini-2.5-flash';
      const apiKey = user.aiSettings.apiKey;

      const proxyUrl = `https://rainbow-gumption-2fc85c.netlify.app/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'An unknown error occurred');
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No AI response candidates received");
      }

      const candidate = data.candidates[0];
      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        throw new Error("Invalid AI response structure");
      }

      const text = candidate.content.parts[0].text;

      if (!text) {
        throw new Error("The AI model returned an empty response. This might be due to a content safety filter.");
      }

      let jsonText = text.trim();
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      const parsedInsights = JSON.parse(jsonText);
      setInsights(parsedInsights);

    } catch (e: any) {
      setError(`Failed to generate insights. Check your API key, network connection, or model configuration. Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const buttonContent = !hasApiKey 
    ? 'Configure API Key in Settings' 
    : 'Get AI Insights';

  return (
    <Card className="bg-gradient-to-br from-[rgb(var(--color-card-rgb))] to-[rgb(var(--color-card-muted-rgb))] border-[rgb(var(--color-border-rgb))]">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-[rgb(var(--color-primary-rgb))]" />
          AI Financial Assistant
        </CardTitle>
        <button
          onClick={handleGenerateInsights}
          disabled={!hasApiKey || isLoading}
          className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
        >
          <SparklesIcon className="h-4 w-4 mr-2" />
          {isLoading ? 'Analyzing...' : buttonContent}
        </button>
      </CardHeader>
      <CardContent>
        <div className="min-h-[14rem] flex items-center justify-center">
          {isLoading && (
            <div className="flex flex-col items-center text-[rgb(var(--color-text-muted-rgb))]">
              <svg className="animate-spin h-8 w-8 text-[rgb(var(--color-primary-rgb))]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="mt-2">Generating your financial summary...</span>
            </div>
          )}
          {error && <p className="text-red-500 text-sm text-center max-w-md">{error}</p>}
          {insights && !isLoading && (
            <FormattedAIInsights insights={insights} />
          )}
          {!isLoading && !error && !insights && (
            <div className="text-center text-[rgb(var(--color-text-muted-rgb))] max-w-md">
              <p className="mb-2">
                {hasApiKey ? "Click the button to get AI-powered insights on your recent spending." : "Please add your Gemini API key in the settings page to enable this feature."}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg">
        <p className="font-medium text-[rgb(var(--color-text-rgb))]">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg">
        <p className="font-medium text-[rgb(var(--color-text-rgb))]">{data.name}</p>
        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Amount: {formatCurrency(data.value)}</p>
        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Percentage: {data.percentage}%</p>
      </div>
    );
  }
  return null;
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-4} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
        {payload.name}
      </text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="rgb(var(--color-text-muted-rgb))" fontSize={12}>
        {`${(percent * 100).toFixed(2)}%`}
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

interface ReportsPageProps {
  transactions: Transaction[];
  user: User;
  categories: Category[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, user, categories }) => {
  const [selectedRange, setSelectedRange] = useState<string>(
    TIME_RANGE_OPTIONS.find(o => o.value === 'last_6_months')?.value || TIME_RANGE_OPTIONS[0].value
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [cashFlowRange, setCashFlowRange] = useState<string>('last_6_months');

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const monthlyData: MonthlyData[] = useMemo(() => {
    const data: { [key: string]: MonthlyData } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const selectedOption = TIME_RANGE_OPTIONS.find(opt => opt.value === cashFlowRange);
    const now = new Date();
    let startDate = new Date(0);

    if (selectedOption) {
      if (selectedOption.value === 'current_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (selectedOption.value === 'current_year') {
        startDate = new Date(now.getFullYear(), 0, 1);
      } else if (selectedOption.months > 0) {
        startDate = new Date(now.getFullYear(), now.getMonth() - selectedOption.months + 1, 1);
      }
    }

    const filteredTransactions = transactions.filter(t => new Date(t.date) >= startDate);

    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!data[monthKey]) {
        data[monthKey] = {
          month: `${months[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`,
          income: 0,
          expense: 0,
        };
      }
      if (t.type === 'income') {
        data[monthKey].income += t.amount;
      } else {
        data[monthKey].expense += t.amount;
      }
    });

    return Object.values(data).sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" '");
      const [bMonth, bYear] = b.month.split(" '");
      return new Date(`${aMonth} 1, 20${aYear}`).getTime() - new Date(`${bMonth} 1, 20${bYear}`).getTime();
    });
  }, [transactions, cashFlowRange]);

  const pieData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    const total = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0) || 1;

    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100),
    }));
  }, [transactions]);

  const totalSpending = useMemo(() => pieData.reduce((sum, item) => sum + item.value, 0), [pieData]);

  const handleExport = () => {
    const headers = ['Month', 'Income', 'Expense'];
    const csvContent = [
      headers.join(','),
      ...monthlyData.map(row => `${row.month},${row.income},${row.expense}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'financial_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 sm:p-6 pb-20 md:pb-6 max-w-7xl mx-auto`}>
      {/* Header */}
      <div className="lg:col-span-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))]">Reports</h1>
          <p className="text-sm text-[rgb(var(--color-text-muted-rgb))] mt-1">Analyze your financial performance and trends.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 text-sm font-medium bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>
      
      <div className="w-full max-w-2xl mx-auto">
        <AIInsightsCard user={user} transactions={transactions} />
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ReportsIcon className="h-5 w-5 text-[rgb(var(--color-primary-rgb))]" />
            Cash Flow Analysis
          </CardTitle>
          <div className="relative">
            <select
              value={cashFlowRange}
              onChange={(e) => setCashFlowRange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-[rgb(var(--color-border-rgb))] rounded-lg bg-[rgb(var(--color-card-muted-rgb))] text-sm w-full sm:w-auto focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none transition-all"
            >
              {TIME_RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="h-4 w-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[rgb(var(--color-text-muted-rgb))]" />
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--color-border-rgb), 0.5)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--color-text-muted-rgb))', fontSize: 12 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(var(--color-primary-rgb), 0.1)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '10px' }} />
                <Bar dataKey="income" name="Income" fill={COLORS[0]} radius={[8, 8, 0, 0]} barSize={20} />
                <Bar dataKey="expense" name="Expense" fill={COLORS[1]} radius={[8, 8, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Spending Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={50}
                      paddingAngle={2}
                      labelLine={false}
                      label={false}
                      activeIndex={activeIndex ?? -1}
                      activeShape={renderActiveShape}
                      onMouseEnter={onPieEnter}
                      onMouseLeave={onPieLeave}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none transition-opacity" style={{ filter: activeIndex !== null && activeIndex !== index ? 'saturate(0.3)' : 'saturate(1)' }} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-4">
                <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">Total Spending</p>
                <p className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">{formatCurrency(totalSpending)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top Spending Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
                {pieData.sort((a, b) => b.value - a.value).map((item, index) => {
                  const category = categories.find(c => c.name === item.name);
                  const isExpanded = expandedCategory === item.name;
                  return (
                    <div key={item.name}>
                      <div
                        className="cursor-pointer p-2.5 rounded-lg hover:bg-[rgb(var(--color-card-muted-rgb))] transition-colors"
                        onClick={() => setExpandedCategory(isExpanded ? null : item.name)}
                        aria-expanded={isExpanded}
                        aria-controls={`category-transactions-${item.name}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-3">
                            <CategoryIcon category={item.name} emoji={category?.icon} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatCurrency(item.value)}</span>
                            <ChevronDownIcon className={`h-4 w-4 text-[rgb(var(--color-text-muted-rgb))] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
                          <div className="h-2.5 rounded-full" style={{ width: `${(item.value / totalSpending) * 100}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                        </div>
                      </div>
                      <div
                        id={`category-transactions-${item.name}`}
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}
                      >
                        {isExpanded && (
                          <div className="mt-2 ml-4 pl-4 border-l-2 border-[rgb(var(--color-border-rgb))]">
                            <ul className="divide-y divide-[rgb(var(--color-border-rgb))]">
                              {transactions
                                .filter(t => t.category === item.name)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((t) => (
                                <li key={t.id} className="flex justify-between items-center py-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium text-[rgb(var(--color-text-rgb))]">{t.description}</span>
                                    <span className="text-xs text-[rgb(var(--color-text-muted-rgb))]">{new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                  </div>
                                  <span className={`font-semibold text-base ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                  </span>
                                </li>
                              ))}
                            {transactions.filter(t => t.category === item.name).length === 0 && (
                                <li className="text-center py-6 text-[rgb(var(--color-text-muted-rgb))]">No transactions found in this category.</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;