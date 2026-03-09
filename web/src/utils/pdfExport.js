import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const toCellText = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
};

export const exportRowsToPdf = ({
  title = 'Export Report',
  subtitleLines = [],
  headers = [],
  rows = [],
  fileName = 'export-report.pdf',
  orientation = 'landscape',
  columnStyles,
}) => {
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  let currentY = 38;

  doc.setFontSize(16);
  doc.text(title, 40, currentY);
  currentY += 18;

  doc.setFontSize(10);
  subtitleLines.filter(Boolean).forEach((line) => {
    doc.text(String(line), 40, currentY);
    currentY += 14;
  });

  autoTable(doc, {
    startY: currentY + 8,
    head: [headers.map(toCellText)],
    body: rows.map((row) => row.map(toCellText)),
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [46, 125, 50],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [247, 251, 247],
    },
    columnStyles,
  });

  const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  doc.save(safeFileName);
};
