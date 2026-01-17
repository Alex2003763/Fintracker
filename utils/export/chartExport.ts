import html2canvas from 'html2canvas';
import { ChartExportConfig } from '../../types/export';

/**
 * Capture a chart element and convert it to an image
 */
export async function captureChartAsCanvas(chartElementId: string): Promise<HTMLCanvasElement> {
  const element = document.getElementById(chartElementId);
  if (!element) {
    throw new Error(`Chart element with ID ${chartElementId} not found`);
  }

  // Use html2canvas to capture the chart
  // We need to ensure the element is visible and has defined dimensions
  return await html2canvas(element, {
    scale: 2, // High resolution
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    allowTaint: true,
  });
}

/**
 * Convert a canvas to a data URL based on format
 */
export function convertCanvasToImage(canvas: HTMLCanvasElement, format: 'png' | 'jpeg' = 'png'): string {
  // Check the format string, default to image/png
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  return canvas.toDataURL(mimeType, 1.0); // 1.0 quality
}

/**
 * Main function to export a chart to an image string (base64)
 */
export async function exportChartToImage(
  chartElementId: string, 
  config?: Partial<ChartExportConfig>
): Promise<string> {
  try {
    const canvas = await captureChartAsCanvas(chartElementId);
    return convertCanvasToImage(canvas, config?.format === 'svg' ? 'png' : (config?.format as 'png' | 'jpeg') || 'png');
  } catch (error) {
    console.error('Failed to export chart:', error);
    return '';
  }
}

/**
 * Helper to prepare charts for export (ensure they are rendered)
 * This might be needed if charts are lazy-loaded or in hidden tabs
 */
export async function prepareChartsForExport(chartIds: string[]): Promise<void> {
  // This is a placeholder for any preparation logic
  // e.g., if we need to temporarily show hidden charts
  return new Promise(resolve => setTimeout(resolve, 500));
}
