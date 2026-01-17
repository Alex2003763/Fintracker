import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFConfig, ReportMetadata } from '../../types/export';
import { formatCurrency } from '../formatters';
import { exportChartToImage } from './chartExport';
import { loadChineseFont } from './fontLoader';

// Extend jsPDF type to include autotable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

/**
 * Generate a professional PDF report
 */
export async function generatePDFReport(
  config: PDFConfig,
  data: any,
  metadata: ReportMetadata
): Promise<Blob> {
  // Initialize PDF document
  const doc = new jsPDF({
    orientation: config.orientation || 'portrait',
    unit: 'mm',
    format: config.pageSize || 'a4',
  }) as jsPDFWithAutoTable;

  // Attempt to load Chinese font support
  await loadChineseFont(doc);

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  // Deep & Modern Color Palette
  const colors: {
    primary: [number, number, number];
    primaryLight: [number, number, number];
    secondary: [number, number, number];
    accent: [number, number, number];
    text: [number, number, number];
    lightText: [number, number, number];
    bg: [number, number, number];
    headerBg: [number, number, number];
  } = {
    primary:   [30, 64, 175],     // Deep Blue
    primaryLight: [219, 234, 254], // Light Blue Background
    secondary: [100, 116, 139],   // Slate
    accent:    [16, 185, 129],    // Green
    text:      [15, 23, 42],      // Dark Slate/Black
    lightText: [148, 163, 184],   // Light Slate
    bg:        [248, 250, 252],   // Very Light Slate
    headerBg:  [241, 245, 249]    // Light Gray
  };

  let currentY = margin;

  // 1. Add Header
  addPDFHeader(doc, metadata, margin, pageWidth, colors);
  currentY += 35;

  // 2. Add Summary Section
  if (config.includeSummary && data.summary) {
    if (currentY + 60 > pageHeight - margin) {
      doc.addPage();
      currentY = margin + 20;
    }
    
    addPDFSummary(doc, data.summary, margin, currentY, contentWidth, colors);
    currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 15;
  }

  // 3. Add Charts if included
  if (config.includeCharts && data.chartElements?.length > 0) {
    if (currentY + 100 > pageHeight - margin) {
      doc.addPage();
      currentY = margin + 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    // Use font based on loaded status - if custom font loaded, it's set globally
    // Ensure we don't override to helvetica if we want Chinese support
    // doc.setFont('helvetica', 'bold'); 
    // Instead set style only if using standard fonts, or rely on added font
    // For now, let's just set bold if possible or leave as 'normal' for CJK
    doc.text('Visual Overview', margin, currentY);
    currentY += 10;

    for (const chartId of data.chartElements) {
      // Check if we have enough space, else new page
      if (currentY + 90 > pageHeight - margin) {
        doc.addPage();
        currentY = margin + 20; // Allow space for header
      }

      try {
        const chartImage = await exportChartToImage(chartId, { format: 'png' });
        if (chartImage) {
          // Center the chart
          const imgHeight = 85; 
          doc.addImage(chartImage, 'PNG', margin, currentY, contentWidth, imgHeight);
          
          // Add subtle border to chart
          doc.setDrawColor(226, 232, 240);
          doc.rect(margin, currentY, contentWidth, imgHeight);
          
          currentY += imgHeight + 15;
        }
      } catch (e) {
        console.error(`Failed to add chart ${chartId} to PDF`, e);
      }
    }
  }

  // 4. Add Detailed Tables
  if (config.includeDetails && data.details) {
    // Check if we need a new page for the title
    if (currentY + 20 > pageHeight - margin) {
      doc.addPage();
      currentY = margin + 20;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Detailed Breakdown', margin, currentY);
    currentY += 8;

    const headers = data.details.headers || [];
    const rows = data.details.rows || [];

    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: {
        font: doc.getFont().fontName, // Use the currently set font (likely NotoSansSC if loaded)
        fontSize: 9,
        cellPadding: 6,
        textColor: colors.text
      },
      headStyles: { 
        fillColor: colors.primary, 
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: colors.bg
      },
      columnStyles: {
        // Assume last column is amount, align right
        [headers.length - 1]: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        // Add footer on each new page created by table
        // addPDFFooter is called at the end for all pages, so we skip here
      }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, i, totalPages, pageWidth, colors);
  }

  return doc.output('blob');
}

function addPDFHeader(doc: jsPDF, metadata: ReportMetadata, margin: number, pageWidth: number, colors: any) {
  // Background for header
  doc.setFillColor(colors.primaryLight[0], colors.primaryLight[1], colors.primaryLight[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Logo / App Name
  doc.setFontSize(24);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  // doc.setFont('helvetica', 'bold'); 
  doc.text('FinTrack', margin, 20);

  // Report Title
  doc.setFontSize(18);
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  // doc.setFont('helvetica', 'bold');
  doc.text(metadata.title, pageWidth - margin, 18, { align: 'right' });

  // Subtitle / Period
  doc.setFontSize(10);
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  // doc.setFont('helvetica', 'normal');
  doc.text(`${metadata.period}`, pageWidth - margin, 24, { align: 'right' });
  doc.text(`Generated: ${metadata.generatedAt.split(',')[0]}`, pageWidth - margin, 29, { align: 'right' });
  
  // Decorative line
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, 39, pageWidth - margin, 39);
}

function addPDFSummary(doc: jsPDFWithAutoTable, summary: any, margin: number, startY: number, contentWidth: number, colors: any) {
  doc.setFontSize(14);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  // doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, startY);

  const summaryData = Object.entries(summary).map(([key, value]) => {
    // Format key to start case
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    // Format value if number
    const formattedValue = typeof value === 'number' ? formatCurrency(value) : String(value);
    return [label, formattedValue];
  });

  autoTable(doc, {
    startY: startY + 5,
    body: summaryData,
    theme: 'plain',
    styles: { 
        font: doc.getFont().fontName,
        fontSize: 11, 
        cellPadding: 6,
        textColor: colors.text
    },
    columnStyles: {
      0: { fontStyle: 'normal', cellWidth: contentWidth * 0.6 },
      1: { fontStyle: 'bold', halign: 'right', textColor: colors.primary }
    },
    didParseCell: (data) => {
        // Add borders only between rows
        if (data.section === 'body') {
            data.cell.styles.lineWidth = { bottom: 0.1 };
            data.cell.styles.lineColor = [226, 232, 240];
        }
    },
    // Don't break summary table across pages
    pageBreak: 'avoid'
  });
}

function addPDFFooter(doc: jsPDF, pageNumber: number, totalPages: number, pageWidth: number, colors: any) {
  const pageHeight = doc.internal.pageSize.height;
  
  // Footer Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.1);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

  doc.setFontSize(8);
  doc.setTextColor(colors.lightText[0], colors.lightText[1], colors.lightText[2]);
  doc.text(
    `Page ${pageNumber}${totalPages > 0 ? ` of ${totalPages}` : ''}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );
  
  doc.text(
    'Generated by FinTrack',
    pageWidth - 15,
    pageHeight - 8,
    { align: 'right' }
  );
}
