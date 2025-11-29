
import React, { useMemo, useState } from 'react';
import { Transaction, User, AIInsight } from '../types';
import { ReportsIcon, SparklesIcon, ChevronDownIcon, DownloadIcon } from './icons';
import { formatCurrency } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Sector } from 'recharts';
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

const FormattedAIInsights: React.FC<{ insights: AIInsight }> = ({ insights }) => {
    return (
        <div className="flex justify-center w-full max-w-full overflow-hidden">
            <div className="w-full max-w-lg">
                <AISwiperCard insights={insights} />
            </div>
        </div>
    );
};

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

const CashFlowTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[rgb(var(--color-card-rgb))] p-3 border border-[rgb(var(--color-border-rgb))] rounded-lg shadow-lg">
          <p className="font-medium text-[rgb(var(--color-text-rgb))]">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey === 'monthlyFlow' ? 'Monthly Cash Flow' : 'Net Worth'}: {formatCurrency(entry.value)}
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
}

const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, user }) => {
  const [selectedRange, setSelectedRange] = useState<string>(
    TIME_RANGE_OPTIONS.find(o => o.value === 'last_6_months')?.value || TIME_RANGE_OPTIONS[0].value
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const monthlyData: MonthlyData[] = useMemo(() => {
    const data: { [key: string]: MonthlyData } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!data[monthKey]) {
        data[monthKey] = {
          month: `${months[date.getMonth()]} ${date.getFullYear()}`,
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

    return Object.values(data).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [transactions]);

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
    <div className="p-4 space-y-4 pb-20 md:pb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h1 className="text-2xl font-bold text-[rgb(var(--color-text-rgb))]">Financial Reports</h1>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 text-sm font-medium text-[rgb(var(--color-primary-text-rgb))] bg-[rgb(var(--color-primary-rgb))] rounded-lg hover:bg-[rgb(var(--color-primary-hover-rgb))] transition-colors shadow-sm w-full sm:w-auto justify-center"
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>
      
      <AIInsightsCard user={user} transactions={transactions} />

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ReportsIcon className="h-5 w-5 text-[rgb(var(--color-primary-rgb))]" />
            Cash Flow
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-[rgb(var(--color-card-muted-rgb))] text-sm w-full sm:w-auto focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] outline-none"
            >
              {TIME_RANGE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="Income" fill={COLORS[0]} />
                <Bar dataKey="expense" name="Expense" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Spending Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    labelLine={false}
                    label={false}
                    activeIndex={activeIndex ?? -1}
                    activeShape={renderActiveShape}
                    onMouseEnter={onPieEnter}
                    onMouseLeave={onPieLeave}
                    isAnimationActive={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>      
      </div>
    </div>
  );
};

export default ReportsPage;