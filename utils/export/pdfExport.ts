import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFConfig, ReportMetadata } from '../../types/export';
import { formatCurrency } from '../formatters';
import { exportChartToImage } from './chartExport';
import { loadChineseFont } from './fontLoader';

// ── Types ────────────────────────────────────────────────────────────────────

interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: { finalY: number };
}

type RGBColor = [number, number, number];

interface ColorPalette {
  primary:      RGBColor;
  primaryLight: RGBColor;
  secondary:    RGBColor;
  accent:       RGBColor;
  text:         RGBColor;
  lightText:    RGBColor;
  bg:           RGBColor;
  headerBg:     RGBColor;
}

// ── Constants ────────────────────────────────────────────────────────────────

const COLORS: ColorPalette = {
  primary:      [30,  64,  175],
  primaryLight: [219, 234, 254],
  secondary:    [100, 116, 139],
  accent:       [16,  185, 129],
  text:         [15,  23,  42],
  lightText:    [148, 163, 184],
  bg:           [248, 250, 252],
  headerBg:     [241, 245, 249],
};

const MARGIN        = 15;
const HEADER_HEIGHT = 44;

// ── Main Export ──────────────────────────────────────────────────────────────

export async function generatePDFReport(
  config: PDFConfig,
  data: any,
  metadata: ReportMetadata
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: config.orientation || 'portrait',
    unit: 'mm',
    format: config.pageSize || 'a4',
  }) as jsPDFWithAutoTable;

  // Load Chinese font; fontName is passed down so helper functions stay pure
  const chineseFontLoaded = await loadChineseFont(doc);
  const fontName = chineseFontLoaded ? 'NotoSansTC' : 'helvetica';

  const pageWidth    = doc.internal.pageSize.width;
  const pageHeight   = doc.internal.pageSize.height;
  const contentWidth = pageWidth - MARGIN * 2;

  // 1. Header
  addPDFHeader(doc, metadata, MARGIN, pageWidth, COLORS, fontName);
  let currentY = HEADER_HEIGHT + 10;

  // 2. Summary
  if (config.includeSummary && data.summary) {
    if (currentY + 60 > pageHeight - MARGIN) {
      doc.addPage();
      currentY = MARGIN + 20;
    }
    addPDFSummary(doc, data.summary, MARGIN, currentY, contentWidth, COLORS, fontName);
    currentY = doc.lastAutoTable.finalY + 15;
  }

  // 3. Charts
  if (config.includeCharts && data.chartElements?.length > 0) {
    if (currentY + 100 > pageHeight - MARGIN) {
      doc.addPage();
      currentY = MARGIN + 20;
    }

    setFont(doc, fontName, 'bold');
    doc.setFontSize(14);
    setTextColor(doc, COLORS.primary);
    doc.text('Visual Overview', MARGIN, currentY);
    currentY += 10;

    for (const chartId of data.chartElements) {
      if (currentY + 90 > pageHeight - MARGIN) {
        doc.addPage();
        currentY = MARGIN + 20;
      }
      try {
        const chartImage = await exportChartToImage(chartId, { format: 'png' });
        if (chartImage) {
          const imgHeight = 85;
          doc.addImage(chartImage, 'PNG', MARGIN, currentY, contentWidth, imgHeight);
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.3);
          doc.rect(MARGIN, currentY, contentWidth, imgHeight);
          currentY += imgHeight + 15;
        }
      } catch (e) {
        console.error(`Failed to add chart ${chartId} to PDF`, e);
      }
    }
  }

  // 4. Detailed Tables
  if (config.includeDetails && data.details) {
    if (currentY + 20 > pageHeight - MARGIN) {
      doc.addPage();
      currentY = MARGIN + 20;
    }

    setFont(doc, fontName, 'bold');
    doc.setFontSize(14);
    setTextColor(doc, COLORS.primary);
    doc.text('Detailed Breakdown', MARGIN, currentY);
    currentY += 8;

    const headers: string[] = data.details.headers || [];
    const rows: string[][]  = data.details.rows    || [];

    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: {
        font: fontName,
        fontSize: 9,
        cellPadding: 6,
        textColor: COLORS.text,
      },
      headStyles: {
        fillColor: COLORS.primary,
        textColor: [255, 255, 255] as RGBColor,
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: { fillColor: COLORS.bg },
      columnStyles: {
        // Last column assumed to be a currency amount
        ...(headers.length > 0 && {
          [headers.length - 1]: { halign: 'right', fontStyle: 'bold' },
        }),
      },
      margin: { left: MARGIN, right: MARGIN },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // 5. Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, i, totalPages, pageWidth, COLORS, fontName);
  }

  return doc.output('blob');
}

// ── Section Renderers ────────────────────────────────────────────────────────

function addPDFHeader(
  doc: jsPDF,
  metadata: ReportMetadata,
  margin: number,
  pageWidth: number,
  colors: ColorPalette,
  fontName: string
): void {
  // Background fill
  doc.setFillColor(...colors.primaryLight);
  doc.rect(0, 0, pageWidth, HEADER_HEIGHT, 'F');

  // Left accent stripe
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, 4, HEADER_HEIGHT, 'F');

  // App name
  setFont(doc, fontName, 'bold');
  doc.setFontSize(22);
  setTextColor(doc, colors.primary);
  doc.text('FinTrack', margin + 6, 18);

  // Tagline
  setFont(doc, fontName, 'normal');
  doc.setFontSize(9);
  setTextColor(doc, colors.secondary);
  doc.text('Personal Finance Manager', margin + 6, 25);

  // Report title (right-aligned)
  setFont(doc, fontName, 'bold');
  doc.setFontSize(16);
  setTextColor(doc, colors.text);
  doc.text(metadata.title, pageWidth - margin, 17, { align: 'right' });

  // Period & generated date
  setFont(doc, fontName, 'normal');
  doc.setFontSize(9);
  setTextColor(doc, colors.secondary);
  doc.text(metadata.period, pageWidth - margin, 24, { align: 'right' });
  doc.text(
    `Generated: ${metadata.generatedAt.split(',')[0]}`,
    pageWidth - margin, 30,
    { align: 'right' }
  );

  // Bottom border line
  doc.setDrawColor(...colors.primary);
  doc.setLineWidth(0.8);
  doc.line(margin, HEADER_HEIGHT - 1, pageWidth - margin, HEADER_HEIGHT - 1);
}

function addPDFSummary(
  doc: jsPDFWithAutoTable,
  summary: Record<string, unknown>,
  margin: number,
  startY: number,
  contentWidth: number,
  colors: ColorPalette,
  fontName: string
): void {
  setFont(doc, fontName, 'bold');
  doc.setFontSize(13);
  setTextColor(doc, colors.primary);
  doc.text('Executive Summary', margin, startY);

  const summaryData = Object.entries(summary).map(([key, value]) => {
    const label = key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase());
    const formattedValue =
      typeof value === 'number' ? formatCurrency(value) : String(value);
    return [label, formattedValue];
  });

  autoTable(doc, {
    startY: startY + 8,
    body: summaryData,
    theme: 'plain',
    styles: {
      font: fontName,
      fontSize: 10,
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      textColor: colors.text,
    },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: { fontStyle: 'bold', halign: 'right', textColor: colors.primary },
    },
    didParseCell: ({ section, cell }) => {
      if (section === 'body') {
        // Row separator lines only
        (cell.styles as any).lineWidth = { bottom: 0.2 };
        (cell.styles as any).lineColor = [226, 232, 240];
      }
    },
    pageBreak: 'avoid',
    margin: { left: margin, right: margin },
  });
}

function addPDFFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  pageWidth: number,
  colors: ColorPalette,
  fontName: string
): void {
  const pageHeight = doc.internal.pageSize.height;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, pageHeight - 14, pageWidth - MARGIN, pageHeight - 14);

  setFont(doc, fontName, 'normal');
  doc.setFontSize(8);
  setTextColor(doc, colors.lightText);

  doc.text(
    `Page ${pageNumber} of ${totalPages}`,
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );
  doc.text('Generated by FinTrack', pageWidth - MARGIN, pageHeight - 7, {
    align: 'right',
  });
}

// ── Utility Helpers ──────────────────────────────────────────────────────────

/**
 * Sets the active font, falling back to helvetica if the named font
 * is not registered (e.g. Chinese font failed to load).
 */
function setFont(
  doc: jsPDF,
  fontName: string,
  style: 'normal' | 'bold' | 'italic' = 'normal'
): void {
  try {
    doc.setFont(fontName, style);
  } catch {
    doc.setFont('helvetica', style);
  }
}

/** Typed wrapper to avoid repetitive tuple destructuring for setTextColor. */
function setTextColor(doc: jsPDF, [r, g, b]: RGBColor): void {
  doc.setTextColor(r, g, b);
}