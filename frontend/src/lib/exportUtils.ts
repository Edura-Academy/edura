'use client';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { showToast } from '@/components/ToastProvider';

// ==================== EXCEL EXPORT ====================

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExcelColumn[];
  data: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
}

export async function exportToExcel({
  filename,
  sheetName = 'Sayfa1',
  columns,
  data,
  title,
  subtitle,
}: ExcelExportOptions) {
  try {
    // Veri satırlarını oluştur
    const headers = columns.map((col) => col.header);
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        // Tarih değerlerini formatla
        if (value instanceof Date) {
          return value.toLocaleDateString('tr-TR');
        }
        return value ?? '';
      })
    );

    // Worksheet oluştur
    const wsData: (string | number | boolean | null | undefined)[][] = [];
    
    // Başlık ekle (opsiyonel)
    if (title) {
      wsData.push([title]);
      wsData.push([]);
    }
    if (subtitle) {
      wsData.push([subtitle]);
      wsData.push([]);
    }
    
    // Header ve veri satırları
    wsData.push(headers);
    rows.forEach((row) => wsData.push(row as (string | number | boolean | null | undefined)[]));

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Kolon genişliklerini ayarla
    const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
    ws['!cols'] = colWidths;

    // Workbook oluştur ve kaydet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Excel dosyası oluştur
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // İndir
    saveAs(blob, `${filename}.xlsx`);
    showToast.success('Excel dosyası indirildi');
    
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    showToast.error('Excel dosyası oluşturulamadı');
    return false;
  }
}

// ==================== PDF EXPORT ====================

export interface PDFColumn {
  header: string;
  key: string;
  width?: number;
}

export interface PDFExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  columns: PDFColumn[];
  data: Record<string, unknown>[];
  orientation?: 'portrait' | 'landscape';
  logo?: string; // Base64 logo
  footer?: string;
  headerInfo?: { label: string; value: string }[];
}

export async function exportToPDF({
  filename,
  title,
  subtitle,
  columns,
  data,
  orientation = 'portrait',
  footer,
  headerInfo,
}: PDFExportOptions) {
  try {
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 15;

    // Başlık
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Alt başlık
    if (subtitle) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
    }

    // Header info (sol üst bilgiler)
    if (headerInfo && headerInfo.length > 0) {
      yPosition += 5;
      doc.setFontSize(10);
      doc.setTextColor(60);
      headerInfo.forEach((info) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${info.label}: `, 15, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(info.value, 15 + doc.getTextWidth(`${info.label}: `), yPosition);
        yPosition += 5;
      });
    }

    // Tarih
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Oluşturulma: ${new Date().toLocaleString('tr-TR')}`,
      pageWidth - 15,
      10,
      { align: 'right' }
    );

    yPosition += 5;

    // Tablo
    const tableHeaders = columns.map((col) => col.header);
    const tableData = data.map((row) =>
      columns.map((col) => {
        const value = row[col.key];
        if (value instanceof Date) {
          return value.toLocaleDateString('tr-TR');
        }
        if (value === null || value === undefined) {
          return '-';
        }
        return String(value);
      })
    );

    autoTable(doc, {
      startY: yPosition,
      head: [tableHeaders],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246], // Blue-500
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        halign: 'center',
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Slate-50
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      margin: { left: 15, right: 15 },
    });

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Sayfa numarası
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text(
        `Sayfa ${i} / ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Custom footer
      if (footer) {
        doc.setFontSize(8);
        doc.text(footer, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
    }

    // İndir
    doc.save(`${filename}.pdf`);
    showToast.success('PDF dosyası indirildi');
    
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    showToast.error('PDF dosyası oluşturulamadı');
    return false;
  }
}

// ==================== CSV EXPORT ====================

export interface CSVExportOptions {
  filename: string;
  columns: { header: string; key: string }[];
  data: Record<string, unknown>[];
  delimiter?: string;
}

export function exportToCSV({
  filename,
  columns,
  data,
  delimiter = ',',
}: CSVExportOptions) {
  try {
    const headers = columns.map((col) => `"${col.header}"`).join(delimiter);
    
    const rows = data.map((row) =>
      columns
        .map((col) => {
          const value = row[col.key];
          if (value === null || value === undefined) return '""';
          if (value instanceof Date) return `"${value.toLocaleDateString('tr-TR')}"`;
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(delimiter)
    );

    const csvContent = [headers, ...rows].join('\n');
    
    // BOM ekle (Excel'de Türkçe karakterler için)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    
    saveAs(blob, `${filename}.csv`);
    showToast.success('CSV dosyası indirildi');
    
    return true;
  } catch (error) {
    console.error('CSV export error:', error);
    showToast.error('CSV dosyası oluşturulamadı');
    return false;
  }
}

// ==================== PRINT HELPER ====================

export function printTable(elementId: string, title?: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    showToast.error('Yazdırılacak içerik bulunamadı');
    return;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast.error('Yazdırma penceresi açılamadı');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Yazdır'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${title ? `<h1 style="text-align:center;margin-bottom:20px;">${title}</h1>` : ''}
        ${element.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

