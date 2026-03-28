import React, { useState } from 'react';
import { Transaction, Budget, Goal, User } from '../types';
import { Category } from '../types/category';
import BaseModal from './BaseModal';
import { ExportConfig, ExportFormat, ReportType, DateRange } from '../types/export';
import DateRangePicker from './DateRangePicker';
import ExportProgress from './ExportProgress';
import { generateReportData, generateReportMetadata } from '../utils/export/reportGenerator';
import { generatePDFReport } from '../utils/export/pdfExport';
import { generateExcelReport } from '../utils/export/excelExport';
import { generateCSVReport } from '../utils/export/csvExport';
import { DownloadIcon, ChevronDownIcon, CheckCircleIcon } from './icons';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  user: User;
  categories: Category[];
}

const REPORT_TYPE_LABELS: { [key in ReportType]: string } = {
  monthly_summary: 'Monthly Summary',
  category_breakdown: 'Category Breakdown',
  budget_performance: 'Budget Performance',
  goal_progress: 'Goal Progress',
  transaction_history: 'Transaction History',
  tax_expenses: 'Tax Expenses',
};

const REPORT_TYPE_ICONS: { [key in ReportType]: string } = {
  monthly_summary: '📅',
  category_breakdown: '📊',
  budget_performance: '💰',
  goal_progress: '🎯',
  transaction_history: '📝',
  tax_expenses: '🧾',
};

const REPORT_TYPE_DESCRIPTIONS: { [key in ReportType]: string } = {
  monthly_summary: 'High-level overview of income & expenses.',
  category_breakdown: 'Where your money goes by category.',
  budget_performance: 'How well you stuck to your budgets.',
  goal_progress: 'Progress towards your savings goals.',
  transaction_history: 'Complete list of all transactions.',
  tax_expenses: 'Tax-deductible expenses helper.',
};

const FORMAT_META: { id: ExportFormat; label: string; icon: string; desc: string }[] = [
  { id: 'pdf',   label: 'PDF',   icon: '📄', desc: 'Best for sharing' },
  { id: 'excel', label: 'Excel', icon: '📊', desc: 'Editable data'    },
  { id: 'csv',   label: 'CSV',   icon: '📋', desc: 'Raw export'       },
];

const INCLUDE_OPTIONS = [
  { key: 'includeCharts'  as const, label: 'Visual Charts',         icon: '📈', csvDisabled: true  },
  { key: 'includeSummary' as const, label: 'Executive Summary',     icon: '📌', csvDisabled: false },
  { key: 'includeDetails' as const, label: 'Detailed Transactions', icon: '🔍', csvDisabled: false },
];

const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen, onClose, transactions, budgets, goals, user, categories,
}) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'pdf',
    reportType: 'monthly_summary',
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date(),
      preset: 'last_month',
    },
    includeCharts: true,
    includeSummary: true,
    includeDetails: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<{
    success: boolean;
    fileName: string;
    error?: string;
  } | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const reportData = generateReportData(config, transactions, budgets, goals);
      const metadata   = generateReportMetadata(config, transactions);
      let blob: Blob;
      let extension: string;

      if (config.format === 'pdf') {
        blob = await generatePDFReport(
          { ...config, format: 'pdf', includePageNumbers: true, includeLogo: true },
          reportData, metadata
        );
        extension = 'pdf';
      } else if (config.format === 'excel') {
        const sheets = [
          { name: 'Summary',      data: [], headers: [] },
          { name: 'Transactions', data: [], headers: [] },
        ];
        blob = await generateExcelReport({ ...config, format: 'excel', sheets }, reportData);
        extension = 'xlsx';
      } else {
        blob = generateCSVReport(config, reportData);
        extension = 'csv';
      }

      const url      = URL.createObjectURL(blob);
      const link     = document.createElement('a');
      const filename = `${REPORT_TYPE_LABELS[config.reportType].replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${extension}`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportResult({ success: true, fileName: filename });
    } catch (error: any) {
      console.error('Export failed:', error);
      setExportResult({ success: false, fileName: '', error: error.message || 'An unknown error occurred' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => { setExportResult(null); setIsExporting(false); onClose(); };

  return (
    <>
      <BaseModal isOpen={isOpen} onClose={handleClose} title="Export Financial Report">

        <div className="space-y-5 max-h-[78vh] overflow-y-auto px-1 pb-1">

          {/* ── Report Type ── */}
          <section>
            <SectionLabel>Report Type</SectionLabel>

            {/* Desktop grid */}
            <div className="hidden sm:grid gap-2.5 sm:grid-cols-3">
              {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => {
                const active = config.reportType === value;
                return (
                  <button
                    key={value}
                    onClick={() => setConfig({ ...config, reportType: value as ReportType })}
                    className={`
                      group relative flex flex-col gap-1.5 p-3.5 rounded-2xl border-2 text-left
                      transition-all duration-200 hover:shadow-md active:scale-95 focus:outline-none
                      focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-rgb))]
                      ${active
                        ? 'border-[rgb(var(--color-primary-rgb))] bg-[rgba(var(--color-primary-rgb),0.07)] shadow-sm'
                        : 'border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] hover:border-[rgba(var(--color-primary-rgb),0.5)] hover:bg-[rgba(var(--color-primary-rgb),0.03)]'
                      }
                    `}
                  >
                    <span className="text-xl leading-none">{REPORT_TYPE_ICONS[value as ReportType]}</span>
                    <span className={`text-xs font-bold leading-tight ${active ? 'text-[rgb(var(--color-primary-rgb))]' : 'text-[rgb(var(--color-text-rgb))]'}`}>
                      {label}
                    </span>
                    <span className="text-[10px] leading-snug text-[rgb(var(--color-text-muted-rgb))] line-clamp-2">
                      {REPORT_TYPE_DESCRIPTIONS[value as ReportType]}
                    </span>

                    {active && (
                      <span className="absolute top-2.5 right-2.5 text-[rgb(var(--color-primary-rgb))]">
                        <CheckCircleIcon className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile dropdown */}
            <div className="sm:hidden space-y-2">
              <div className="relative">
                <select
                  value={config.reportType}
                  onChange={e => setConfig({ ...config, reportType: e.target.value as ReportType })}
                  className="w-full appearance-none bg-[rgb(var(--color-card-rgb))] border-2 border-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-rgb))] text-sm font-semibold rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 transition-shadow"
                >
                  {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {REPORT_TYPE_ICONS[value as ReportType]} {label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgb(var(--color-text-muted-rgb))]" />
              </div>
              <p className="text-xs text-[rgb(var(--color-text-muted-rgb))] bg-[rgba(var(--color-primary-rgb),0.04)] border border-[rgba(var(--color-primary-rgb),0.12)] rounded-xl px-3.5 py-2.5 leading-relaxed">
                <span className="font-semibold text-[rgb(var(--color-primary-rgb))]">About: </span>
                {REPORT_TYPE_DESCRIPTIONS[config.reportType]}
              </p>
            </div>
          </section>

          <Divider />

          {/* ── Date Range + Format ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <section>
              <SectionLabel accent>Time Period</SectionLabel>
              <DateRangePicker
                value={config.dateRange}
                onChange={range => setConfig({ ...config, dateRange: range })}
              />
            </section>

            <section>
              <SectionLabel>Export Format</SectionLabel>
              <div className="grid grid-cols-3 gap-2.5 h-[calc(100%-2rem)]">
                {FORMAT_META.map(({ id, label, icon, desc }) => {
                  const active = config.format === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setConfig({ ...config, format: id })}
                      className={`
                        flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-2xl border-2
                        transition-all duration-200 focus:outline-none focus-visible:ring-2
                        focus-visible:ring-[rgb(var(--color-primary-rgb))] active:scale-95
                        ${active
                          ? 'border-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-primary-rgb))] text-white shadow-lg scale-[1.03]'
                          : 'border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] hover:border-[rgba(var(--color-primary-rgb),0.5)] hover:bg-[rgba(var(--color-primary-rgb),0.04)] text-[rgb(var(--color-text-rgb))]'
                        }
                      `}
                    >
                      <span className={`text-lg leading-none ${active ? '' : 'grayscale'}`}>{icon}</span>
                      <span className="text-xs font-extrabold uppercase tracking-widest">{label}</span>
                      <span className={`text-[10px] font-medium ${active ? 'text-white/70' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>
                        {desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Include Options ── */}
          <section className="rounded-2xl border border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-muted-rgb))] p-4">
            <SectionLabel>Include in Report</SectionLabel>
            <div className="flex flex-col sm:flex-row gap-2">
              {INCLUDE_OPTIONS.map(({ key, label, icon, csvDisabled }) => {
                const disabled = csvDisabled && config.format === 'csv';
                const checked  = config[key] as boolean;
                return (
                  <label
                    key={key}
                    className={`
                      flex items-center gap-3 flex-1 cursor-pointer select-none
                      px-3.5 py-2.5 rounded-xl border transition-all duration-150
                      ${disabled
                        ? 'opacity-40 cursor-not-allowed border-transparent bg-transparent'
                        : checked
                          ? 'border-[rgba(var(--color-primary-rgb),0.3)] bg-[rgba(var(--color-primary-rgb),0.06)]'
                          : 'border-transparent hover:bg-[rgba(var(--color-text-rgb),0.04)]'
                      }
                    `}
                  >
                    {/* Custom checkbox */}
                    <span
                      className={`
                        shrink-0 w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center
                        transition-colors duration-150
                        ${checked
                          ? 'bg-[rgb(var(--color-primary-rgb))] border-[rgb(var(--color-primary-rgb))]'
                          : 'border-[rgba(var(--color-text-rgb),0.3)] bg-transparent'
                        }
                      `}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => !disabled && setConfig({ ...config, [key]: e.target.checked })}
                      className="sr-only"
                      disabled={disabled}
                    />
                    <span className="text-lg leading-none">{icon}</span>
                    <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">{label}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* ── Footer Actions ── */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-2 border-t border-[rgb(var(--color-border-rgb))]">
            <button
              onClick={handleClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="
                w-full sm:w-auto group flex items-center justify-center gap-2
                px-6 py-2.5 text-sm font-bold text-white rounded-xl
                bg-[rgb(var(--color-primary-rgb))]
                hover:bg-[rgb(var(--color-primary-hover-rgb))] hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0 active:shadow-sm
                transition-all duration-200 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
              "
            >
              {isExporting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <DownloadIcon className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  Download {config.format.toUpperCase()}
                </>
              )}
            </button>
          </div>

        </div>
      </BaseModal>

      <ExportProgress
        isExporting={isExporting}
        result={exportResult}
        onClose={() => setExportResult(null)}
      />
    </>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ accent?: boolean; children: React.ReactNode }> = ({ accent, children }) => (
  <p className={`text-[11px] font-extrabold uppercase tracking-widest mb-2.5
    ${accent ? 'text-[rgb(var(--color-primary-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))]'}`}>
    {children}
  </p>
);

const Divider = () => (
  <div className="h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border-rgb))] to-transparent opacity-60" />
);

export default ReportExportModal;