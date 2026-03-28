import { ExportConfig } from '../../types/export';

/**
 * Generate a CSV report from report data
 */
export function generateCSVReport(
  config: ExportConfig,
  data: any
): Blob {
  // CSV content
  let csvContent = '';

  // Add BOM for UTF-8 support in Excel
  csvContent += '\uFEFF';

  // 強制將所有欄位轉為字串並用 toLocaleString 處理中文
  function toTWString(cell: any) {
    if (typeof cell === 'number') return cell.toLocaleString('zh-TW');
    if (cell instanceof Date) return cell.toLocaleDateString('zh-TW');
    return String(cell);
  }

  // Add details (transaction history, category breakdown, or monthly summary)
  if (data.details && data.details.headers && data.details.rows) {
    // Add headers
    csvContent += data.details.headers.join(',') + '\n';
    
    // Add rows
    for (const row of data.details.rows) {
      // Escape CSV fields with quotes if they contain commas or quotes
      const escapedRow = row.map((cell: string) => {
        if (cell === undefined || cell === null) {
          return '';
        }
        const cellStr = toTWString(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      });
      
      csvContent += escapedRow.join(',') + '\n';
    }
  }

  // Add summary if included and available
  if (config.includeSummary && data.summary) {
    csvContent += '\n\n--- Summary ---\n';
    csvContent += 'Metric,Value\n';
    
    for (const [key, value] of Object.entries(data.summary)) {
      // Format metric name (e.g., "totalIncome" to "Total Income")
      const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
      const formattedValue = String(value);
      
      // Escape fields
      const escapedKey = formattedKey.includes(',') || formattedKey.includes('"') ? `"${formattedKey.replace(/"/g, '""')}"` : formattedKey;
      const escapedValue = formattedValue.includes(',') || formattedValue.includes('"') ? `"${formattedValue.replace(/"/g, '""')}"` : formattedValue;
      
      csvContent += `${escapedKey},${escapedValue}\n`;
    }
  }

  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}
