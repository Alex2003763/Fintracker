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
  tax_expenses: 'Tax Expenses'
};

const REPORT_TYPE_ICONS: { [key in ReportType]: string } = {
  monthly_summary: '📅',
  category_breakdown: '📊',
  budget_performance: '💰',
  goal_progress: '🎯',
  transaction_history: '📝',
  tax_expenses: '🧾'
};

const REPORT_TYPE_DESCRIPTIONS: { [key in ReportType]: string } = {
  monthly_summary: 'High-level overview of income & expenses.',
  category_breakdown: 'Where your money goes by category.',
  budget_performance: 'How well you stuck to your budgets.',
  goal_progress: 'Progress towards your savings goals.',
  transaction_history: 'Complete list of all transactions.',
  tax_expenses: 'Tax-deductible expenses helper.'
};

const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  budgets,
  goals,
  user,
  categories
}) => {
  const [config, setConfig] = useState<ExportConfig>({
    format: 'pdf',
    reportType: 'monthly_summary',
    dateRange: {
      start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      end: new Date(),
      preset: 'last_month'
    },
    includeCharts: true,
    includeSummary: true,
    includeDetails: true
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

    // Give UI time to update
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const reportData = generateReportData(config, transactions, budgets, goals);
      const metadata = generateReportMetadata(config, transactions);
      
      let blob: Blob;
      let extension: string;

      if (config.format === 'pdf') {
        blob = await generatePDFReport(
          { 
            ...config, 
            format: 'pdf', 
            includePageNumbers: true,
            includeLogo: true 
          }, 
          reportData, 
          metadata
        );
        extension = 'pdf';
      } else if (config.format === 'excel') {
         // Create sheet config based on report type
         const sheets = [
             { name: 'Summary', data: [], headers: [] }, // Placeholders, real data handled in utility
             { name: 'Transactions', data: [], headers: [] }
         ];
        
        blob = await generateExcelReport(
            { ...config, format: 'excel', sheets }, 
            reportData
        );
        extension = 'xlsx';
      } else {
        // Fallback for CSV - basic implementation
        blob = new Blob([''], { type: 'text/csv' });
        extension = 'csv';
      }

      // Download file
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
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
      setExportResult({ 
        success: false, 
        fileName: '', 
        error: error.message || 'An unknown error occurred' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
      setExportResult(null);
      setIsExporting(false);
      onClose();
  }

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Export Financial Report"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {/* Report Type Selection */}
          <section className="space-y-3">
             <label className="block text-sm font-bold text-[rgb(var(--color-text-rgb))] uppercase tracking-wide opacity-80">Report Type</label>
             {/* Desktop Grid View */}
             <div className="hidden sm:grid gap-3 sm:grid-cols-2">
                {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                   <button
                      key={value}
                      onClick={() => setConfig({ ...config, reportType: value as ReportType })}
                      className={`relative flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:shadow-md active:scale-95 duration-200
                         ${config.reportType === value 
                            ? 'border-[rgb(var(--color-primary-rgb))] bg-[rgba(var(--color-primary-rgb),0.08)] ring-1 ring-[rgb(var(--color-primary-rgb))]' 
                            : 'border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] hover:border-[rgb(var(--color-primary-rgb))]'
                         }`}
                   >
                      <span className="text-2xl mb-2">{REPORT_TYPE_ICONS[value as ReportType]}</span>
                      <div className="flex-1 w-full">
                        <span className={`block text-sm font-semibold ${config.reportType === value ? 'text-[rgb(var(--color-primary-rgb))]' : 'text-[rgb(var(--color-text-rgb))]'}`}>
                           {label}
                        </span>
                        <span className="text-xs text-[rgb(var(--color-text-muted-rgb))] line-clamp-2 block mt-0.5">
                           {REPORT_TYPE_DESCRIPTIONS[value as ReportType]}
                        </span>
                      </div>
                      {config.reportType === value && (
                        <div className="absolute top-3 right-3 text-[rgb(var(--color-primary-rgb))]">
                          <CheckCircleIcon className="w-5 h-5" />
                        </div>
                      )}
                   </button>
                ))}
             </div>

             {/* Mobile Dropdown View */}
             <div className="sm:hidden relative">
               <div className="relative w-full">
                 <select
                   value={config.reportType}
                   onChange={(e) => setConfig({ ...config, reportType: e.target.value as ReportType })}
                   className="w-full appearance-none bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-primary-rgb))] text-base rounded-xl p-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-shadow"
                   style={{ color: 'rgb(var(--color-primary-rgb))' }}
                 >
                   {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                     <option key={value} value={value}>
                       {REPORT_TYPE_ICONS[value as ReportType]} {label}
                     </option>
                   ))}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[rgb(var(--color-text-muted-rgb))]">
                   <ChevronDownIcon className="h-5 w-5" />
                 </div>
               </div>
               <div className="mt-2 p-3 bg-[rgba(var(--color-primary-rgb),0.05)] rounded-lg text-sm text-[rgb(var(--color-text-muted-rgb))] border border-[rgba(var(--color-primary-rgb),0.1)]">
                 <span className="font-medium text-[rgb(var(--color-primary-rgb))] block mb-1">About this report:</span>
                 {REPORT_TYPE_DESCRIPTIONS[config.reportType]}
               </div>
             </div>
          </section>

          <div className="h-px bg-[rgb(var(--color-border-rgb))] opacity-50" />

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Date Range Selection */}
             <section>
               <label className="block text-sm font-bold text-[rgb(var(--color-primary-rgb))] uppercase tracking-wide opacity-90 mb-3">Time Period</label>
               <DateRangePicker 
                 value={config.dateRange} 
                 onChange={(range) => setConfig({...config, dateRange: range})} 
               />
             </section>

             {/* Format Selection */}
             <section>
               <label className="block text-sm font-bold text-[rgb(var(--color-text-rgb))] uppercase tracking-wide opacity-80 mb-3">Export Format</label>
               <div className="flex gap-3">
                 {(['pdf', 'excel', 'csv'] as ExportFormat[]).map((format) => (
                   <button
                     key={format}
                     type="button"
                     onClick={() => setConfig({ ...config, format })}
                     className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all text-sm font-bold relative overflow-hidden group
                       ${config.format === format 
                         ? 'border-[rgb(var(--color-primary-rgb))] bg-[rgb(var(--color-primary-rgb))] text-white shadow-lg transform scale-[1.02]' 
                         : 'border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))]'}`}
                   >
                     <span className="uppercase tracking-wider text-xs relative z-10">{format}</span>
                     {config.format === format && <div className="absolute inset-0 bg-white opacity-10 blur-sm rounded-xl"></div>}
                   </button>
                 ))}
               </div>
             </section>
          </div>

          {/* Options */}
          <section className="bg-[rgb(var(--color-card-muted-rgb))] rounded-xl p-4 border border-[rgb(var(--color-border-rgb))]">
            <label className="block text-sm font-bold text-[rgb(var(--color-text-rgb))] uppercase tracking-wide opacity-80 mb-3">Include in Report</label>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
              <label className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-lg transition-colors ${config.format === 'csv' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[rgba(var(--color-text-rgb),0.05)]'} touch-manipulation`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.includeCharts ? 'bg-[rgb(var(--color-primary-rgb))] border-[rgb(var(--color-primary-rgb))]' : 'border-[rgb(var(--color-text-rgb))] bg-transparent dark:border-gray-500'}`}>
                    {config.includeCharts && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={config.includeCharts}
                  onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
                  className="sr-only"
                  disabled={config.format === 'csv'}
                />
                <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Visual Charts</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-colors touch-manipulation">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.includeSummary ? 'bg-[rgb(var(--color-primary-rgb))] border-[rgb(var(--color-primary-rgb))]' : 'border-[rgb(var(--color-text-rgb))] bg-transparent dark:border-gray-500'}`}>
                    {config.includeSummary && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={config.includeSummary}
                  onChange={(e) => setConfig({ ...config, includeSummary: e.target.checked })}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Executive Summary</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-lg hover:bg-[rgba(var(--color-text-rgb),0.05)] transition-colors touch-manipulation">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.includeDetails ? 'bg-[rgb(var(--color-primary-rgb))] border-[rgb(var(--color-primary-rgb))]' : 'border-[rgb(var(--color-text-rgb))] bg-transparent dark:border-gray-500'}`}>
                    {config.includeDetails && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={config.includeDetails}
                  onChange={(e) => setConfig({ ...config, includeDetails: e.target.checked })}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-[rgb(var(--color-text-rgb))]">Detailed Transactions</span>
              </label>
            </div>
          </section>

          <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3 border-t border-[rgb(var(--color-border-rgb))] mt-4">
            <button
              onClick={handleClose}
              className="px-5 py-3 text-sm font-medium text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-xl transition-colors w-full sm:w-auto text-center"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center px-6 py-3 text-sm font-bold bg-[rgb(var(--color-primary-rgb))] text-white rounded-xl hover:bg-[rgb(var(--color-primary-hover-rgb))] hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none w-full sm:w-auto"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              {isExporting ? 'Generating Report...' : `Download ${config.format.toUpperCase()} Report`}
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

export default ReportExportModal;
