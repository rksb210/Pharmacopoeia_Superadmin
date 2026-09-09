import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format a cell value safely for export
 */
const formatCellValue = (val, row, col) => {
  if (col.format && typeof col.format === 'function') {
    try {
      const formatted = col.format(val, row);
      return formatted !== undefined && formatted !== null ? formatted : '';
    } catch {
      return '';
    }
  }

  if (val === undefined || val === null) return '';
  if (typeof val === 'boolean') return val ? 'Active / Yes' : 'Inactive / No';
  if (val instanceof Date) return val.toLocaleDateString('en-IN');
  return String(val);
};

/**
 * Export dataset to Microsoft Excel (.xlsx)
 *
 * @param {Object} options
 * @param {string} options.filename - Base filename (without .xlsx extension)
 * @param {string} options.title - Document title (e.g. "Indian Pharmacopoeia Commission - Users Directory")
 * @param {string} [options.subtitle] - Optional subtitle
 * @param {Array<string>} [options.metadata] - Optional KPI summary lines
 * @param {Array<{ header: string, key: string, format?: Function }>} options.columns - Column specifications
 * @param {Array<Object>} options.data - Array of row items
 * @param {string} [options.sheetName='Records'] - Name of the Excel worksheet
 */
export const exportToExcel = ({
  filename = 'Export',
  title = 'Indian Pharmacopoeia Commission - Official Export Ledger',
  subtitle = '',
  metadata = [],
  columns = [],
  data = [],
  sheetName = 'Records',
}) => {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('Export columns configuration is required.');
  }

  const generatedDateStr = `Generated On: ${new Date().toLocaleString('en-IN')}`;
  const wsData = [];

  // 1. Title Header Row
  wsData.push([title]);
  wsData.push([generatedDateStr]);

  // 2. Subtitle if provided
  if (subtitle) {
    wsData.push([subtitle]);
  }

  // 3. Metadata KPIs if provided
  if (Array.isArray(metadata) && metadata.length > 0) {
    wsData.push(metadata);
  }

  // 4. Blank row spacer
  wsData.push([]);

  // 5. Column Headers
  const headerRow = columns.map((col) => col.header || col.key);
  wsData.push(headerRow);

  // 6. Data Rows
  (data || []).forEach((row) => {
    const rowValues = columns.map((col) => {
      const rawVal = col.key?.includes('.')
        ? col.key.split('.').reduce((acc, part) => acc?.[part], row)
        : row[col.key];
      return formatCellValue(rawVal, row, col);
    });
    wsData.push(rowValues);
  });

  // Create Workbook and Sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-calculate column widths (min 12, max 45 chars)
  const colWidths = columns.map((col, colIdx) => {
    let maxLen = (col.header || '').length;
    (data || []).slice(0, 500).forEach((row) => {
      const rawVal = col.key?.includes('.')
        ? col.key.split('.').reduce((acc, part) => acc?.[part], row)
        : row[col.key];
      const strVal = String(formatCellValue(rawVal, row, col) || '');
      if (strVal.length > maxLen) {
        maxLen = strVal.length;
      }
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) };
  });

  ws['!cols'] = colWidths;

  const cleanSheetName = sheetName.replace(/[\\/*?:[\]]/g, '').slice(0, 30) || 'Records';
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

  const cleanFilename = `${filename.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
};

/**
 * Export dataset to Adobe PDF (.pdf) with official IPC styling
 *
 * @param {Object} options
 * @param {string} options.filename - Base filename (without .pdf extension)
 * @param {string} options.title - Document title (e.g. "Indian Pharmacopoeia Commission - Users Directory")
 * @param {string} [options.subtitle] - Optional subtitle / metadata string
 * @param {Array<string>} [options.metadata] - Optional KPI summary lines
 * @param {Array<{ header: string, key: string, format?: Function }>} options.columns - Column specifications
 * @param {Array<Object>} options.data - Array of row items
 * @param {'landscape'|'portrait'} [options.orientation='landscape'] - PDF Page orientation
 */
export const exportToPDF = ({
  filename = 'Export',
  title = 'Indian Pharmacopoeia Commission - Official Export Ledger',
  subtitle = '',
  metadata = [],
  columns = [],
  data = [],
  orientation = 'landscape',
}) => {
  if (!Array.isArray(columns) || columns.length === 0) {
    throw new Error('Export columns configuration is required.');
  }

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Accent Bar (NFI Orange #E76120)
  doc.setFillColor(231, 97, 32);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  // Title Branding (IPC Navy #284661)
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 70, 97);
  doc.text(title, 14, 11);

  // Subtitle / Generated Timestamp
  const generatedInfo = `Generated: ${new Date().toLocaleString('en-IN')} | Total Records: ${(data || []).length}`;
  const subText = subtitle ? `${subtitle} · ${generatedInfo}` : generatedInfo;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(subText, 14, 16.5);

  let startYPos = 20;

  // Metadata KPI Line if provided
  if (Array.isArray(metadata) && metadata.length > 0) {
    const metaStr = metadata.filter(Boolean).join('  |  ');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(metaStr, 14, 20.5);
    startYPos = 23;
  }

  // Table Headers
  const tableHeaders = [columns.map((col) => col.header || col.key)];

  // Table Rows
  const tableRows = (data || []).map((row) =>
    columns.map((col) => {
      const rawVal = col.key?.includes('.')
        ? col.key.split('.').reduce((acc, part) => acc?.[part], row)
        : row[col.key];
      return formatCellValue(rawVal, row, col);
    })
  );

  autoTable(doc, {
    startY: startYPos,
    head: tableHeaders,
    body: tableRows,
    theme: 'grid',
    margin: { left: 14, right: 14, top: 12, bottom: 14 },
    headStyles: {
      fillColor: [40, 70, 97], // IPC Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate 50
    },
    didDrawPage: (hookData) => {
      // Page Footer
      const totalPages = doc.internal.getNumberOfPages();
      const currentPage = hookData.pageNumber;
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);

      // Left Footer
      doc.text(
        'Government of India · Ministry of Health and Family Welfare · Indian Pharmacopoeia Commission',
        14,
        pageHeight - 6
      );

      // Right Footer: Page X of Y
      doc.text(
        `Page ${currentPage} of ${totalPages}`,
        pageWidth - 14,
        pageHeight - 6,
        { align: 'right' }
      );
    },
  });

  const cleanFilename = `${filename.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(cleanFilename);
};

export default {
  exportToExcel,
  exportToPDF,
};
