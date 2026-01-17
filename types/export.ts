// Export format types
export type ExportFormat = 'pdf' | 'excel' | 'csv';

// Report types
export type ReportType = 
  | 'monthly_summary'
  | 'category_breakdown'
  | 'budget_performance'
  | 'goal_progress'
  | 'transaction_history'
  | 'tax_expenses';

// Date range types
export type DateRangePreset = 
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'last_year'
  | 'all_time'
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  preset?: DateRangePreset;
}

// Export configuration
export interface ExportConfig {
  format: ExportFormat;
  reportType: ReportType;
  dateRange: DateRange;
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  fileName?: string;
}

// PDF-specific configuration
export interface PDFConfig extends ExportConfig {
  format: 'pdf';
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  includePageNumbers: boolean;
  includeLogo: boolean;
  title?: string;
  subtitle?: string;
}

// Excel-specific configuration
export interface ExcelConfig extends ExportConfig {
  format: 'excel';
  sheets: ExcelSheetConfig[];
  theme?: ExcelTheme;
}

export interface ExcelSheetConfig {
  name: string;
  data: any[];
  headers: string[];
  formatting?: CellFormatting[];
  formulas?: Formula[];
}

export interface CellFormatting {
  range: string;
  style: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    backgroundColor?: string;
    border?: string;
    numberFormat?: string;
    alignment?: 'left' | 'center' | 'right';
  };
}

export interface Formula {
  cell: string;
  formula: string;
}

export interface ExcelTheme {
  primaryColor: string;
  headerColor: string;
  fontColor: string;
  borderColor: string;
}

// Chart export configuration
export interface ChartExportConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  options: any;
  format: 'png' | 'svg';
  width: number;
  height: number;
  dpi?: number;
}

// Report metadata
export interface ReportMetadata {
  title: string;
  subtitle?: string;
  generatedAt: string;
  generatedBy: string;
  period: string;
  totalTransactions: number;
  currency?: string;
}

// Export result
export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  format: ExportFormat;
  error?: string;
}
