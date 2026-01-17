import * as XLSX from 'xlsx';
import { ExcelConfig, ExcelSheetConfig } from '../../types/export';
import { exportChartToImage } from './chartExport';
// import XLSXStyle from 'xlsx-js-style'; // Would normally import this if available in environment, falling back to basic XLSX

/**
 * Generate a professional Excel report
 */
export async function generateExcelReport(
  config: ExcelConfig,
  data: any
): Promise<Blob> {
  const wb = XLSX.utils.book_new();
  
  // Create sheets based on config
  for (const sheetConfig of config.sheets) {
    if (sheetConfig.name === 'Summary' && config.includeSummary && data.summary) {
      addSummarySheet(wb, data.summary);
    } else if (sheetConfig.name === 'Transactions' && config.includeDetails && data.details) {
      addTransactionSheet(wb, data.details);
    } else {
      // Generic sheet addition
      if (sheetConfig.data && sheetConfig.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(sheetConfig.data);
        XLSX.utils.book_append_sheet(wb, ws, sheetConfig.name);
      }
    }
  }

  // Handle charts if included
  if (config.includeCharts && data.chartElements?.length > 0) {
      // Note: Full Excel chart embedding is complex in browser-side JS
      // We will add a "Charts" sheet with links or base64 data if feasible
      // For now, let's create a sheet with chart data points which is more useful
      // The user can then generate charts in Excel easily
      if (data.chartDataPoints) {
          const ws = XLSX.utils.json_to_sheet(data.chartDataPoints);
          XLSX.utils.book_append_sheet(wb, ws, "Chart Data");
      }
  }

  // Generate buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([wbout], { type: 'application/octet-stream' });
}

function addSummarySheet(wb: XLSX.WorkBook, summary: any) {
  // Transform summary object to rows
  const rows = Object.entries(summary).map(([key, value]) => ({
    Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
    Value: value
  }));

  // Create worksheet with styling logic
  const ws = XLSX.utils.json_to_sheet(rows);
  
  // Set column widths
  ws['!cols'] = [{ wch: 25 }, { wch: 20 }];

  // Apply basic styling 
  // Note: 'xlsx' community version doesn't support extensive styling, but we structure for clarity
  // If 'xlsx-js-style' was available we would do:
  /*
  const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2196F3" } } };
  for (let cell in ws) {
      if (cell[1] === '1') ws[cell].s = headerStyle;
  }
  */
  
  XLSX.utils.book_append_sheet(wb, ws, 'Summary');
}

function addTransactionSheet(wb: XLSX.WorkBook, details: any) {
  // Use rows directly if available, otherwise just use empty array
  const rows = details.rows || [];
  const headers = details.headers || [];

  // Create worksheet from array of arrays (headers + data)
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-width columns roughly
  if (headers.length > 0) {
      ws['!cols'] = headers.map(() => ({ wch: 20 }));
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
}

/**
 * Helper to apply basic styling if xlsx-js-style is available
 * Note: Standard xlsx properties are limited in free version
 */
function applyStyle(cell: any, style: any) {
  // This would use xlsx-js-style if we switch import
  // cell.s = style;
}
