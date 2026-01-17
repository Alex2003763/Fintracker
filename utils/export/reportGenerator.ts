import { Transaction, Budget, Goal } from '../../types';
import { ExportConfig, ReportMetadata, DateRange, DateRangePreset } from '../../types/export';
import { formatCurrency } from '../formatters';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks, subMonths, subYears, isWithinInterval } from 'date-fns';

/**
 * Main function to generate report data structure
 */
export function generateReportData(
  config: ExportConfig,
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[]
): any {
  // 1. Filter transactions by date range
  const filteredTransactions = filterTransactionsByDateRange(transactions, config.dateRange);

  // 2. Generate summary metrics
  const summary = calculateSummaryMetrics(filteredTransactions);

  // 3. Generate detailed rows based on report type
  let details: any = {};
  if (config.reportType === 'monthly_summary') {
    details = generateMonthlyDetails(filteredTransactions);
  } else if (config.reportType === 'category_breakdown') {
    details = generateCategoryBreakdown(filteredTransactions);
  } else {
    // Default to transaction history
    details = generateTransactionHistory(filteredTransactions);
  }

  // 4. Prepare chart data
  const chartDataPoints = generateChartData(filteredTransactions);

  return {
    summary,
    details,
    chartDataPoints,
    // chartElements will be populated by the IDs of charts in the UI
    chartElements: config.includeCharts ? ['report-chart-main', 'report-chart-secondary'] : []
  };
}

export function generateReportMetadata(config: ExportConfig, transactions: Transaction[]): ReportMetadata {
  return {
    title: getReportTitle(config.reportType),
    subtitle: getDateRangeLabel(config.dateRange),
    generatedAt: new Date().toLocaleString(),
    generatedBy: 'User', // Could be dynamic if user name is available
    period: getDateRangeLabel(config.dateRange),
    totalTransactions: transactions.length,
    currency: 'USD'
  };
}

function getReportTitle(type: string): string {
  switch (type) {
    case 'monthly_summary': return 'Monthly Financial Summary';
    case 'category_breakdown': return 'Category Spending Breakdown';
    case 'budget_performance': return 'Budget Performance Report';
    case 'goal_progress': return 'Goal Progress Report';
    case 'tax_expenses': return 'Tax-Ready Expense Report';
    default: return 'Transaction History Report';
  }
}

function filterTransactionsByDateRange(transactions: Transaction[], range: DateRange): Transaction[] {
  const { start, end } = range;
  
  // Ensure start is start of day and end is end of day
  const effectiveStart = startOfDay(new Date(start));
  const effectiveEnd = endOfDay(new Date(end));

  return transactions.filter(t => {
    const date = new Date(t.date);
    return isWithinInterval(date, { start: effectiveStart, end: effectiveEnd });
  });
}

function calculateSummaryMetrics(transactions: Transaction[]) {
  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(t => {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  return {
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) + '%' : '0%'
  };
}

function generateTransactionHistory(transactions: Transaction[]) {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  
  const rows = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type === 'income' ? 'Income' : 'Expense',
      formatCurrency(t.amount)
    ]);

  return { headers, rows };
}

function generateCategoryBreakdown(transactions: Transaction[]) {
  const headers = ['Category', 'Type', 'Transaction Count', 'Total Amount', '% of Total'];
  
  const categories: {[key: string]: { amount: number, count: number, type: string }} = {};
  let totalExpense = 0;
  
  transactions.forEach(t => {
    if (!categories[t.category]) {
      categories[t.category] = { amount: 0, count: 0, type: t.type };
    }
    categories[t.category].amount += t.amount;
    categories[t.category].count += 1;
    
    if (t.type === 'expense') totalExpense += t.amount;
  });

  const rows = Object.entries(categories)
    .sort((a, b) => b[1].amount - a[1].amount)
    .map(([name, data]) => [
      name,
      data.type === 'income' ? 'Income' : 'Expense',
      data.count,
      formatCurrency(data.amount),
      data.type === 'expense' && totalExpense > 0 
        ? ((data.amount / totalExpense) * 100).toFixed(1) + '%' 
        : '-'
    ]);

  return { headers, rows };
}

function generateMonthlyDetails(transactions: Transaction[]) {
  const headers = ['Month', 'Income', 'Expenses', 'Net Savings'];
  
  const months: {[key: string]: { income: number, expense: number, sortKey: number }} = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const sortKey = date.getFullYear() * 100 + date.getMonth();
    
    if (!months[key]) {
      months[key] = { income: 0, expense: 0, sortKey };
    }
    
    if (t.type === 'income') months[key].income += t.amount;
    else months[key].expense += t.amount;
  });

  const rows = Object.entries(months)
    .sort((a, b) => b[1].sortKey - a[1].sortKey)
    .map(([month, data]) => [
      month,
      formatCurrency(data.income),
      formatCurrency(data.expense),
      formatCurrency(data.income - data.expense)
    ]);

  return { headers, rows };
}

function generateChartData(transactions: Transaction[]) {
  // Create data points for potential recreation of charts in Excel
  // Similar to Category Breakdown
  const categories: {[key: string]: number} = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });
  
  return Object.entries(categories).map(([category, amount]) => ({
      Category: category,
      Amount: amount
  }));
}

/**
 * Helper to get Date object from range preset
 */
export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (preset) {
    case 'today':
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case 'yesterday':
      start = startOfDay(subWeeks(now, 0)); // Hack to clone date
      start.setDate(start.getDate() - 1);
      end = endOfDay(start);
      break;
    case 'this_week':
      start = startOfWeek(now);
      end = endOfWeek(now);
      break;
    case 'last_week':
      start = startOfWeek(subWeeks(now, 1));
      end = endOfWeek(subWeeks(now, 1));
      break;
    case 'this_month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'last_month':
      start = startOfMonth(subMonths(now, 1));
      end = endOfMonth(subMonths(now, 1));
      break;
    case 'this_year':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case 'last_year':
      start = startOfYear(subYears(now, 1));
      end = endOfYear(subYears(now, 1));
      break;
    default:
      start = subMonths(now, 6); // Default fallback
      end = now;
  }

  return { start, end, preset };
}

function getDateRangeLabel(range: DateRange): string {
  if (range.preset && range.preset !== 'custom') {
    return range.preset.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return `${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`;
}
